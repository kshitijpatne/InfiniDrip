// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, Piece, STRETCH_FABRICS, fabricEaseNote, GarmentOptionsByRecipe, GarmentOptions, defaultGarmentOptions } from "../drafting";
import { gradeRun, draftAtSize, specSheet, GARMENTS, GarmentRecipe, garmentByName } from "../drafting";
import { blockPieces, rolePiece } from "../drafting";
import { exportSvg, exportDxf, exportPdf, exportTechPack, exportProjectorSvg, exportA0Pdf, flattenPiece, nestPieces, gradedMarker } from "../export";
import { renderBlueprint, renderGarment, renderNest, renderFabricNest, renderEditor, renderBody, renderBodyPair, renderSkirtGarment, renderSkirtBody, renderSideCroquis, DEFAULT_FABRIC } from "../render";
import { pieceHandles, moveHandle, nearestHandle, editorViewBox, viewboxPointToCm, Handle } from "../edit";
import { dartOf, transferDart, trueSeam, edgesMeet } from "../drafting";
import { BLUEPRINT } from "../render";
import { guide, Note } from "../guidance";
import { garmentReport, implausibleFields } from "../guidance";
import { matchStyle, styleNames } from "../style";
import { FIELDS, applyChange, inputError } from "./controls";
import { appShellMarkup, controlsMarkup, guidanceMarkup, styleMarkup, specTableMarkup, checkMarkup, editorHintMarkup, dartControlsMarkup, inspectionMarkup, BodyCroquisView } from "./view";
import { saveToStorage, loadFromStorage, readFromStorage, serialize, deserialize, DEFAULT_WORKSPACE, Workspace } from "./persist";
import {
  JourneyStep, ViewName, COACHED_STEPS, disclosureFor, stepView, journeyChecklist,
  journeyBarMarkup, checklistMarkup, welcomeMarkup, celebrationMarkup,
  loadJourney, saveJourney,
} from "./journey";

// The desktop shell's bridge (Slice 46) — see electron/preload.cts for the
// other end. Optional: undefined everywhere this app runs as a plain web page.
declare global {
  interface Window {
    electronAPI?: {
      saveFile(filename: string, content: string): Promise<{ saved: boolean; filePath?: string }>;
      onExportRequested?(callback: (kind: string) => void): void;
    };
  }
}

export function mountApp(root: HTMLElement): void {
  const saved = loadFromStorage();
  let measurements: Measurements = saved ? saved.measurements : STANDARD_M;
  let fabric = saved ? saved.fabric : DEFAULT_FABRIC;
  let garmentOptions: GarmentOptionsByRecipe = saved ? saved.garmentOptions : {};
  const initialWorkspace = saved?.workspace ?? DEFAULT_WORKSPACE;
  let recipe: GarmentRecipe = garmentByName(initialWorkspace.garment);
  root.innerHTML = appShellMarkup(measurements, fabric, recipe.sizes, recipe.fields);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const garmentHost = root.querySelector<HTMLDivElement>("#garment-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;
  const fabricWidthHost = root.querySelector<HTMLDivElement>("#fabric-width-host")!;
  const journeyHost = root.querySelector<HTMLDivElement>("#journey-host")!;

  // The guided journey (F2): a coached Start→Output path over the existing views.
  // Its state is presentation-only and persisted separately from the pattern.
  let journey = loadJourney();
  let celebrating = false; // the light, dismissible export confirmation

  let targetStyle = initialWorkspace.targetStyle;
  let stretchFabric = STRETCH_FABRICS.find((f) => f.name === initialWorkspace.stretchFabric)!;
  let view: ViewName = initialWorkspace.view;
  let bodyCroquisView: BodyCroquisView = initialWorkspace.bodyCroquisView;
  let editedFront: Piece | null = null; // freeform snapshot of the front (override, not parametric)
  let dragId: string | null = null; // handle being dragged
  let selectedId: string | null = null; // handle highlighted in the editor
  let fabricWidth = initialWorkspace.fabricWidth;
  let nestScope: "single" | "marker" = initialWorkspace.nestScope;
  let exportStep = initialWorkspace.exportStep;
  let activeDim: string | null = null; // the measurement field spotlighted on the body view
  let inspectionZoom = 1;

  /** Design options live per recipe, never in body measurements. Existing saved
   * values stay verbatim so guidance can explain an invalid combination. */
  const recipeOptions = (forRecipe: GarmentRecipe = recipe): GarmentOptions => ({
    ...defaultGarmentOptions(forRecipe.options ?? []),
    ...(garmentOptions[forRecipe.name] ?? {}),
  });
  const draftCurrent = (): ReturnType<GarmentRecipe["draft"]> => recipe.draft(measurements, recipeOptions());
  const inputErrors = (): Map<string, string> => {
    const errors = new Map<string, string>();
    for (const field of FIELDS.filter((f) => recipe.fields.includes(f.id))) {
      const error = inputError(measurements[field.id], field);
      if (error) errors.set(field.id, error);
    }
    for (const option of recipe.options ?? []) {
      const error = inputError(recipeOptions()[option.id], option);
      if (error) errors.set(`option-${option.id}`, error);
    }
    return errors;
  };
  // Include recipe warnings without changing the geometry-only export report.
  const designValid = (): boolean => inputErrors().size === 0
    && !guide(recipe, measurements, recipeOptions()).some((note) => note.level === "warn")
    && garmentReport(recipe, measurements, recipeOptions()).ok;
  const poloVisual = () => {
    if (recipe.name !== "polo") return undefined;
    const options = recipeOptions();
    return {
      placketLength: options.placketLength,
      placketWidth: options.placketWidth,
      standHeight: options.standHeight,
      collarLeafDepth: options.collarLeafDepth,
    };
  };
  const wovenShirtVisual = () => {
    if (recipe.name !== "woven-shirt") return undefined;
    const options = recipeOptions();
    const neckWidthHalf = (measurements.neck + options.neckEase) / 4;
    return {
      neckWidthHalf,
      frontNeckDepth: neckWidthHalf * 0.8,
      backNeckDepth: neckWidthHalf * 0.3,
      buttonCount: options.buttonCount,
      buttonSpacing: options.buttonSpacing,
      frontOverlap: options.frontOverlap,
      placketWidth: options.placketWidth,
      standHeight: options.standHeight,
      collarLeafDepth: options.collarLeafDepth,
      yokeDepth: options.yokeDepth,
      pocketWidth: options.pocketWidth,
      pocketHeight: options.pocketHeight,
      sleeveBandDepth: options.sleeveBandDepth,
      sideVentDepth: options.sideVentDepth,
      hemTurn: options.hemTurn,
    };
  };
  const wovenBodyNeckline = () => {
    if (recipe.name !== "woven-shirt") return undefined;
    const options = recipeOptions();
    const widthHalf = (measurements.neck + options.neckEase) / 4;
    return { widthHalf, frontDepth: widthHalf * 0.8, backDepth: widthHalf * 0.3 };
  };

  // Spotlight one measurement on the body view: its dimension line AND the outline
  // edges it shapes stay at full opacity, everything else drops back. A group
  // carries its field in `data-dim` (the dimension line) or `data-edge` (the
  // outline segments, plus the silhouette itself tagged "figure" — never a field
  // name, so it always dims). `null` restores the whole figure.
  const spotlight = (field: string | null): void => {
    root.querySelectorAll<SVGGElement>("#canvas-host [data-dim], #canvas-host [data-edge]")
      .forEach((g) => {
        const owns = g.dataset.dim ?? g.dataset.edge;
        g.style.opacity = field === null || owns === field ? "1" : "0.15";
      });
  };

  // The journey bar + checklist render Opus's guidance DATA (plausibility gate,
  // fit gaps, the report verdict) — nothing here recomputes a check.
  const renderJourney = (): void => {
    const inputsOk = inputErrors().size === 0;
    const plausible = designValid();
    const gaps = matchStyle(measurements, targetStyle, recipe.styles).deltas.length;
    const report = inputsOk ? garmentReport(recipe, measurements, recipeOptions()) : { ok: false };
    const parts: string[] = [];
    if (journey.step === "start") parts.push(welcomeMarkup());
    parts.push(journeyBarMarkup(journey.step));
    if (celebrating) parts.push(celebrationMarkup(plausible));
    if (journey.step !== "start") {
      parts.push(checklistMarkup(
        journeyChecklist(plausible, gaps, report.ok, journey.exported)));
    }
    journeyHost.innerHTML = parts.join("");
  };
  const markOutputDirty = (): void => {
    if (!journey.exported && !celebrating) return;
    journey = { ...journey, exported: false };
    celebrating = false;
    saveJourney(journey);
  };

  /** Keep every SVG inside a bounded, keyboard-reachable inspection viewport.
   * The SVG's aspect ratio is preserved; portrait drawings get a capped height,
   * while unusually wide drawings get an intentional horizontal inspection
   * surface instead of making the entire page microscopic. */
  const applyInspectionPresentation = (): void => {
    const section = root.querySelector<HTMLElement>("#canvas-inspection");
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport");
    const content = root.querySelector<HTMLElement>("#inspection-content");
    if (!section || !viewport || !content) return;
    const svgs = [...content.querySelectorAll<SVGSVGElement>("svg")];
    const title = section.querySelector<HTMLElement>("#inspection-title")?.textContent ?? "Canvas";
    svgs.forEach((svg, index) => {
      svg.classList.add("inspection-svg");
      svg.setAttribute("role", "img");
      if (!svg.getAttribute("aria-label")) {
        const label = view === "body" && svgs.length === 2
          ? `${title} ${index === 0 ? "front" : "back"}`
          : `${title} graphic`;
        svg.setAttribute("aria-label", label);
      }
    });
    const viewportWidth = Math.max(260, viewport.clientWidth - 16 || 560);
    const zoomOutput = root.querySelector<HTMLOutputElement>("#inspection-zoom");
    if (svgs.length === 0) {
      content.style.width = "100%";
      content.style.display = "block";
      if (zoomOutput) zoomOutput.textContent = "";
      return;
    }
    if (svgs.length > 1) {
      content.style.display = "block";
      content.style.width = `${Math.max(100, Math.round(inspectionZoom * 100))}%`;
      svgs.forEach((svg) => {
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxWidth = "none";
      });
      if (zoomOutput) zoomOutput.textContent = `${Math.round(inspectionZoom * 100)}%`;
      return;
    }
    const svg = svgs[0];
    const values = (svg.getAttribute("viewBox") ?? "0 0 100 100")
      .trim().split(/[ ,]+/).map(Number);
    const ratio = values.length === 4 && values[2] > 0 && values[3] > 0 ? values[2] / values[3] : 1;
    const maxHeight = 520;
    const minHeight = 260;
    let height = Math.min(maxHeight, Math.max(minHeight, viewportWidth / ratio));
    let width = height * ratio;
    if (ratio >= 1 && width < viewportWidth) {
      width = viewportWidth;
      height = width / ratio;
    }
    width *= inspectionZoom;
    height *= inspectionZoom;
    svg.style.width = `${Math.round(width)}px`;
    svg.style.height = `${Math.round(height)}px`;
    svg.style.maxWidth = "none";
    svg.style.display = "block";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.alignItems = ratio < 1 ? "center" : "stretch";
    content.style.width = `${Math.max(viewportWidth, Math.ceil(width))}px`;
    viewport.style.minHeight = `${Math.min(560, Math.max(260, Math.ceil(Math.min(maxHeight, height) + 16)))}px`;
    if (zoomOutput) zoomOutput.textContent = `${Math.round(inspectionZoom * 100)}%`;
  };

  const draw = (): void => {
    const errors = inputErrors();
    const valid = designValid();
    root.querySelectorAll<HTMLElement>("[data-finished]").forEach((total) => {
      const value = measurements[total.dataset.finished as keyof Measurements] + measurements.ease;
      total.textContent = Number.isFinite(value) ? `${value} cm` : "Enter complete measurements";
    });
    root.querySelectorAll<HTMLInputElement>("[data-field], [data-option]").forEach((input) => {
      const key = input.dataset.field ?? `option-${input.dataset.option}`;
      const error = errors.get(key);
      input.setAttribute("aria-invalid", String(!!error));
      input.setCustomValidity(error ?? "");
      root.querySelector<HTMLElement>(`#error-${key}`)!.textContent = error ?? "";
    });
    root.querySelectorAll<HTMLButtonElement>('#export-host button[id^="export-"]').forEach((button) => {
      button.disabled = !valid;
      button.title = button.disabled ? "Resolve the flagged inputs and digital checks before exporting." : "";
    });
    if (errors.size > 0) {
      canvasHost.innerHTML = "<p role=\"status\">Draft paused — correct the flagged inputs to render your current design.</p>";
      garmentHost.innerHTML = "";
      guidanceHost.innerHTML = guidanceMarkup([...errors.values()].map((text) => ({ level: "warn", text })));
      styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle, recipe.styles), styleNames(recipe.styles), false);
      renderJourney();
      return;
    }
    // The body figure and the style presets are upper-body only; a garment that
    // doesn't use the chest (a skirt) gets a neutral placeholder instead of a
    // misleading top. (Real lower-body figure + skirt styles: a later slice.)
    const isTop = recipe.fields.includes("chest");
    // A sleeveless top (the tank) still carries a `sleeveLength` value on
    // `measurements` (fields not shown in a garment's UI don't disappear from
    // the object) — without this check both figures would draw it with a
    // short sleeve regardless (Slice 60).
    const hasSleeve = recipe.fields.includes("sleeveLength");
    fabricWidthHost.style.display = view === "fabric" ? "flex" : "none";
    let canvasContent: string;
    if (view === "nest") {
      canvasContent = renderNest(
        gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, recipeOptions()));
    } else if (view === "fabric") {
      const nest = nestScope === "marker"
        ? gradedMarker(recipe, measurements, fabricWidth, recipeOptions())
        : nestPieces(blockPieces(draftCurrent()).map((p) => flattenPiece(p, recipe.allowances)), fabricWidth);
      canvasContent = renderFabricNest(
        nest.placed, nest.fabricWidth, nest.fabricLength, nest.utilization, nest.fits);
    } else if (view === "check") {
      canvasContent = checkMarkup(garmentReport(recipe, measurements, recipeOptions()), valid);
    } else if (view === "edit") {
      const piece = editedFront ?? rolePiece(draftCurrent(), "front");
      editedFront = piece;
      const vb = editorViewBox(piece);
      const hasDart = dartOf(piece) !== null;
      // Truing consumes `sideLower`, so only offer it while both halves still exist
      // AND the dart has moved off the side (leaving the two halves touching).
      const sideSplit = ["sideUpper", "sideLower"].every((n) =>
        piece.edges.some((e) => e.name === n));
      const canTrue = hasDart && sideSplit && edgesMeet(piece, "sideUpper", "sideLower");
      canvasContent =
        renderEditor(piece, pieceHandles(piece), vb, selectedId) +
        editorHintMarkup() +
        dartControlsMarkup(hasDart, canTrue);
    } else if (view === "spec") {
      const graded = gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, recipeOptions());
      const baseIndex = graded.findIndex((g) => g.step === 0);
      canvasContent = specTableMarkup(
        specSheet(graded, recipe.poms), graded.map((g) => g.label), baseIndex);
    } else if (view === "body") {
      if (bodyCroquisView === "side") {
        canvasContent = renderSideCroquis(measurements, isTop ? "upper" : "lower");
      } else if (!isTop) {
        canvasContent = renderSkirtBody(measurements);
      } else if (bodyCroquisView === "front") {
        canvasContent = renderBody(measurements, hasSleeve, recipe.frontNeckline?.(measurements), recipe.strapWidth?.(measurements), "front", poloVisual(), wovenBodyNeckline());
      } else if (bodyCroquisView === "back") {
        canvasContent = renderBody(measurements, hasSleeve, recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), "back", poloVisual(), wovenBodyNeckline());
      } else {
        canvasContent = renderBodyPair(measurements, hasSleeve, recipe.frontNeckline?.(measurements), recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), poloVisual(), wovenBodyNeckline());
      }
    } else {
      const block = draftCurrent();
      const pieces = blockPieces(block);
      canvasContent = renderBlueprint(
        pieces,
        { active: pieces[0].name, notches: recipe.notches, allowances: recipe.allowances,
          layout: recipe.name === "polo" ? "polo" : "linear" });
    }
    canvasHost.innerHTML = inspectionMarkup(canvasContent, view);
    applyInspectionPresentation();
    garmentHost.innerHTML = isTop
      ? renderGarment(measurements, fabric, hasSleeve,
          recipe.frontNeckline?.(measurements), recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), poloVisual(), wovenShirtVisual())
      : renderSkirtGarment(measurements, fabric);
    // One sanity read for the whole frame: are the numbers a real body? It gates
    // every green "validated" signal — the check banner, the style ✓ — and flags
    // the offending fields, so geometry passing can never masquerade as "ready".
    const plausible = valid;
    // Guidance = the geometry checks, plus a fabric-stretch ease note (advice only).
    const fabricNote: Note = { level: "info", text: fabricEaseNote(stretchFabric, measurements.chest) };
    const failedChecks: Note[] = garmentReport(recipe, measurements, recipeOptions()).checks
      .filter((check) => !check.ok).map((check) => ({ level: "warn", text: `${check.name}: ${check.detail}` }));
    guidanceHost.innerHTML = guidanceMarkup([...guide(recipe, measurements, recipeOptions()), ...failedChecks, fabricNote]);
    // Style = prescriptive: the gap from current measurements to the chosen target.
    styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle, recipe.styles), styleNames(recipe.styles), plausible);
    // Amber-outline any measurement input whose value is out of plausible range
    // (same outline convention as the fabric swatches). Controls aren't re-rendered
    // per draw, so this is applied imperatively.
    const flagged = new Set<string>(implausibleFields(measurements, recipe.fields));
    root.querySelectorAll<HTMLInputElement>("[data-field]").forEach((inp) => {
      inp.style.outline = flagged.has(inp.dataset.field!) ? `2px solid ${BLUEPRINT.lineActive}` : "";
    });
    // The body SVG was just re-rendered; restore any active dimension spotlight.
    if (activeDim !== null) spotlight(activeDim);
    renderJourney();
  };

  const viewBtns = {
    pattern: root.querySelector<HTMLButtonElement>("#view-pattern")!,
    body: root.querySelector<HTMLButtonElement>("#view-body")!,
    nest: root.querySelector<HTMLButtonElement>("#view-nest")!,
    spec: root.querySelector<HTMLButtonElement>("#view-spec")!,
    fabric: root.querySelector<HTMLButtonElement>("#view-fabric")!,
    check: root.querySelector<HTMLButtonElement>("#view-check")!,
    edit: root.querySelector<HTMLButtonElement>("#view-edit")!,
  };
  const bodyCroquisHost = root.querySelector<HTMLElement>("#body-croquis-toggle-host")!;
  const bodyCroquisBtns = {
    frontBack: root.querySelector<HTMLButtonElement>("#body-front-back")!,
    front: root.querySelector<HTMLButtonElement>("#body-front")!,
    back: root.querySelector<HTMLButtonElement>("#body-back")!,
    side: root.querySelector<HTMLButtonElement>("#body-side")!,
  };
  const syncBodyCroquisButton = (button: HTMLButtonElement, on: boolean): void => {
    button.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
    button.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    button.setAttribute("aria-pressed", String(on));
  };
  const setBodyCroquisView = (v: BodyCroquisView): void => {
    bodyCroquisView = v;
    syncBodyCroquisButton(bodyCroquisBtns.frontBack, v === "front-back");
    syncBodyCroquisButton(bodyCroquisBtns.front, v === "front");
    syncBodyCroquisButton(bodyCroquisBtns.back, v === "back");
    syncBodyCroquisButton(bodyCroquisBtns.side, v === "side");
    draw();
  };
  const setView = (v: "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit"): void => {
    if (v === "edit" && editedFront === null && inputErrors().size === 0) editedFront = rolePiece(draftCurrent(), "front");
    view = v;
    inspectionZoom = 1;
    (["pattern", "body", "nest", "spec", "fabric", "check", "edit"] as const).forEach((k) => {
      const on = k === v;
      viewBtns[k].style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      viewBtns[k].style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    });
    bodyCroquisHost.style.display = v === "body" && recipe.fields.includes("chest") ? "flex" : "none";
    draw();
  };
  viewBtns.pattern.addEventListener("click", () => setView("pattern"));
  viewBtns.body.addEventListener("click", () => setView("body"));
  viewBtns.nest.addEventListener("click", () => setView("nest"));
  viewBtns.spec.addEventListener("click", () => setView("spec"));
  viewBtns.fabric.addEventListener("click", () => setView("fabric"));
  viewBtns.check.addEventListener("click", () => setView("check"));
  viewBtns.edit.addEventListener("click", () => setView("edit"));
  bodyCroquisBtns.frontBack.addEventListener("click", () => setBodyCroquisView("front-back"));
  bodyCroquisBtns.front.addEventListener("click", () => setBodyCroquisView("front"));
  bodyCroquisBtns.back.addEventListener("click", () => setBodyCroquisView("back"));
  bodyCroquisBtns.side.addEventListener("click", () => setBodyCroquisView("side"));

  // Progressive disclosure: each journey step reveals only what it needs; the
  // advanced views stay one click away once unlocked, never front-loaded.
  const applyDisclosure = (): void => {
    const d = disclosureFor(journey.step);
    root.querySelector<HTMLElement>("#controls-panel")!.style.display = d.controls ? "" : "none";
    root.querySelector<HTMLElement>("#stretch-host")!.style.display = d.stretch ? "flex" : "none";
    root.querySelector<HTMLElement>("#swatch-host")!.style.display = d.swatches ? "flex" : "none";
    root.querySelector<HTMLElement>("#export-host")!.style.display = d.exports ? "flex" : "none";
    styleHost.style.display = d.style ? "" : "none";
    guidanceHost.style.display = d.guidance ? "" : "none";
    root.querySelector<HTMLElement>("#view-toggle-host")!.style.display =
      d.views.length > 0 ? "flex" : "none";
    bodyCroquisHost.style.display = view === "body" && recipe.fields.includes("chest") && d.views.includes("body") ? "flex" : "none";
    (Object.keys(viewBtns) as ViewName[]).forEach((k) => {
      viewBtns[k].style.display = d.views.includes(k) ? "" : "none";
    });
  };

  const setStep = (s: JourneyStep): void => {
    journey = { ...journey, step: s };
    saveJourney(journey);
    celebrating = false;
    applyDisclosure();
    const v = stepView(s);
    if (v !== null && view !== v) setView(v); // setView redraws (and the journey with it)
    else draw();
  };

  // The journey host is rebuilt every draw, so its clicks are delegated.
  journeyHost.addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).id;
    const idx = COACHED_STEPS.findIndex((st) => st.id === journey.step);
    if (id === "welcome-start" || id === "journey-next") {
      setStep(COACHED_STEPS[Math.min(idx + 1, COACHED_STEPS.length - 1)].id);
    } else if (id === "journey-back") {
      setStep(COACHED_STEPS[Math.max(idx - 1, 0)].id);
    } else if (id === "welcome-skip" || id === "journey-skip") {
      setStep("done");
    } else if (id === "celebrate-dismiss") {
      celebrating = false;
      renderJourney();
    } else if (id.startsWith("journey-step-")) {
      setStep(id.slice("journey-step-".length) as JourneyStep);
    }
  });
  applyDisclosure();
  window.addEventListener("resize", applyInspectionPresentation);

  // Freeform drag: pointer -> nearest handle -> moveHandle -> redraw. All the
  // maths is pure (edit engine); these three handlers are the only impure glue.
  const handleAt = (e: MouseEvent): { handle: Handle | null; at: ReturnType<typeof viewboxPointToCm> } => {
    const svg = canvasHost.querySelector("svg")!;
    const piece = editedFront!;
    const vb = editorViewBox(piece);
    const at = viewboxPointToCm(e.clientX, e.clientY, svg.getBoundingClientRect(), vb);
    return { handle: nearestHandle(pieceHandles(piece), at, 2), at };
  };
  canvasHost.addEventListener("mousedown", (e) => {
    if (view !== "edit" || inputErrors().size > 0) return;
    const hit = handleAt(e);
    if (hit.handle) {
      dragId = hit.handle.id;
      selectedId = hit.handle.id;
      draw();
    }
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragId) return;
    const piece = editedFront!;
    const handle = pieceHandles(piece).find((h) => h.id === dragId)!;
    editedFront = moveHandle(piece, handle, handleAt(e).at);
    draw();
  });
  window.addEventListener("mouseup", () => { dragId = null; });
  // The dart tools pivot the snapshot about the apex. Like every edit-view change,
  // they are a manual override: they never touch `measurements` or the recipe.
  const DART_TOOLS: Record<string, (p: Piece) => Piece> = {
    "dart-shoulder": (p) => transferDart(p, "shoulder", 0.5, "centerFront"),
    "dart-hem": (p) => transferDart(p, "hem", 0.5, "centerFront"),
    "dart-true": (p) => trueSeam(p, "sideUpper", "sideLower"),
  };
  canvasHost.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const zoomButton = target.closest<HTMLButtonElement>("button[data-inspection-zoom]");
    if (zoomButton) {
      const action = zoomButton.dataset.inspectionZoom;
      inspectionZoom = action === "fit" ? 1
        : action === "in" ? Math.min(2.5, inspectionZoom + 0.25)
          : Math.max(0.5, inspectionZoom - 0.25);
      applyInspectionPresentation();
      return;
    }
    const id = target.id;
    if (id === "editor-reset") {
      editedFront = rolePiece(draftCurrent(), "front");
      selectedId = null;
      markOutputDirty();
      draw();
    } else if (DART_TOOLS[id] && editedFront) {
      editedFront = DART_TOOLS[id](editedFront);
      selectedId = null;
      markOutputDirty();
      draw();
    }
  });

  const setGarment = (name: string): void => {
    markOutputDirty();
    recipe = garmentByName(name);
    targetStyle = recipe.styles[0].name; // the old target may not exist for this garment
    GARMENTS.forEach((g) => {
      const btn = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      btn.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      btn.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
      btn.setAttribute("aria-pressed", String(on));
    });
    editedFront = null; // a new garment invalidates the freeform snapshot
    selectedId = null;
    // Re-render the measurement panel to this garment's fields (a skirt shows
    // waist/hip, not chest/sleeve), then re-attach its listeners.
    root.querySelector<HTMLElement>("#controls-panel")!.outerHTML = controlsMarkup(
      measurements, recipe.fields, recipe.options, recipeOptions());
    wireMeasurementInputs();
    syncExportSizes();
    if (view === "edit" && inputErrors().size === 0) editedFront = rolePiece(draftCurrent(), "front");
    draw();
  };
  GARMENTS.forEach((g) => {
    root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!
      .addEventListener("click", () => setGarment(g.name));
  });

  const widthInput = root.querySelector<HTMLInputElement>("#fabric-width")!;
  widthInput.addEventListener("input", () => {
    const v = Number(widthInput.value);
    if (Number.isFinite(v) && v > 0) {
      fabricWidth = v;
      markOutputDirty();
      draw();
    }
  });

  const single = root.querySelector<HTMLButtonElement>("#nest-single")!;
  const marker = root.querySelector<HTMLButtonElement>("#nest-marker")!;
  const setScope = (s: "single" | "marker"): void => {
    nestScope = s;
    markOutputDirty();
    single.style.background = s === "single" ? BLUEPRINT.lineActive : "transparent";
    single.style.color = s === "single" ? BLUEPRINT.background : BLUEPRINT.label;
    marker.style.background = s === "marker" ? BLUEPRINT.lineActive : "transparent";
    marker.style.color = s === "marker" ? BLUEPRINT.background : BLUEPRINT.label;
    draw();
  };
  single.addEventListener("click", () => setScope("single"));
  marker.addEventListener("click", () => setScope("marker"));

  // Wire the measurement rows: value inputs + body-view hover linking. Extracted
  // so it can re-run after the controls panel is re-rendered on a garment switch
  // (a garment with different fields renders different inputs).
  const highlightDim = (field: string | null): void => {
    activeDim = field;
    spotlight(field);
  };
  const wireMeasurementInputs = (): void => {
    root.querySelectorAll<HTMLInputElement>("input[data-field]").forEach((input) => {
      const field = FIELDS.find((f) => f.id === input.dataset.field)!;
      input.addEventListener("input", () => {
        measurements = applyChange(measurements, field, input.value);
        markOutputDirty();
        draw();
      });
    });
    root.querySelectorAll<HTMLInputElement>("input[data-option]").forEach((input) => {
      const id = input.dataset.option!;
      input.addEventListener("input", () => {
        const value = input.value.trim() === "" ? NaN : Number(input.value);
        garmentOptions = {
          ...garmentOptions,
          [recipe.name]: { ...recipeOptions(), [id]: value },
        };
        editedFront = null;
        markOutputDirty();
        draw();
      });
    });
    root.querySelectorAll<HTMLElement>("[data-dim-row]").forEach((row) => {
      const field = row.dataset.dimRow!;
      row.addEventListener("mouseenter", () => highlightDim(field));
      row.addEventListener("mouseleave", () => highlightDim(null));
      row.addEventListener("focusin", () => highlightDim(field));
      row.addEventListener("focusout", () => highlightDim(null));
    });
  };
  wireMeasurementInputs();

  const swatches = root.querySelectorAll<HTMLButtonElement>("button[data-fabric]");
  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      fabric = swatch.dataset.fabric!;
      markOutputDirty();
      swatches.forEach((s) => {
        s.style.outline = s.dataset.fabric === fabric ? `2px solid ${BLUEPRINT.lineActive}` : "none";
        s.setAttribute("aria-pressed", String(s.dataset.fabric === fabric));
      });
      draw();
    });
  });

  // Style target lives inside styleHost, which is rebuilt every draw — so we
  // delegate the change event from the stable host element.
  styleHost.addEventListener("change", (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.id === "style-target") {
      targetStyle = sel.value;
      markOutputDirty();
      draw();
    }
  });

  const stretchSelect = root.querySelector<HTMLSelectElement>("#stretch-select")!;
  stretchSelect.addEventListener("change", () => {
    stretchFabric = STRETCH_FABRICS.find((f) => f.name === stretchSelect.value)!;
    markOutputDirty();
    draw();
  });

  // Export-local state: which size the download buttons emit. Defaults to base (M);
  // it scopes ONLY the exports, never the other views.
  const exportSizeEl = root.querySelector<HTMLSelectElement>("#export-size")!;
  const syncExportSizes = (): void => {
    if (!recipe.sizes.some((s) => s.step === exportStep)) exportStep = 0;
    exportSizeEl.replaceChildren(...recipe.sizes.map((size) => new Option(size.label, String(size.step))));
    exportSizeEl.value = String(exportStep);
  };
  exportSizeEl.addEventListener("change", () => {
    exportStep = Number(exportSizeEl.value);
    markOutputDirty();
  });
  // exportStep always comes from the picker, which is populated from recipe.sizes,
  // so the step is guaranteed to resolve to a real size.
  const exportSizeLabel = (): string =>
    recipe.sizes.find((s) => s.step === exportStep)!.label;
  const exportPieces = (): Piece[] => {
    const block = draftAtSize(measurements, recipe.grade, exportStep, recipe.draft, recipeOptions());
    return [...blockPieces(block)];
  };
  // The desktop shell's only bridge into this app (Slice 46): when running
  // inside Electron, `window.electronAPI` is set by electron/preload.cts via
  // contextBridge, and download() below routes through it instead of the
  // browser Blob-download trick. Absent it — `npm run dev` in a plain
  // browser, or any other web host — the app is exactly what it was before
  // this slice. Additive, not a fork: every export button, every test of
  // this function's browser path, is unchanged.
  const statusEl = root.querySelector<HTMLSpanElement>("#persist-status")!;
  let statusTimer = 0;
  const flash = (msg: string, color: string): void => {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { statusEl.textContent = ""; }, 2000);
  };
  const completeExport = (): void => {
    journey = { ...journey, exported: true };
    saveJourney(journey);
    if (journey.step !== "done") celebrating = true;
    renderJourney();
  };
  const download = async (filename: string, text: string, mime: string): Promise<void> => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveFile(filename, text);
        if (!result.saved) {
          flash("Export canceled — choose a file location to complete it.", BLUEPRINT.lineActive);
          return;
        }
        completeExport();
        return;
      } catch {
        flash("Export failed — check the destination and retry.", BLUEPRINT.lineActive);
        return;
      }
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      flash("Download started — verify the file before marking export complete.", BLUEPRINT.label);
    } catch {
      flash("Export failed — the browser could not start the download.", BLUEPRINT.lineActive);
    }
  };
  const onExport = (id: string, action: () => void): void => {
    root.querySelector<HTMLButtonElement>(id)!.addEventListener("click", () => {
      if (designValid()) action();
    });
  };
  onExport("#export-svg", () => {
    download(`${recipe.name}-${exportSizeLabel()}.svg`, exportSvg(exportPieces(), recipe.allowances, recipe.notches), "image/svg+xml");
  });
  onExport("#export-dxf", () => {
    download(`${recipe.name}-${exportSizeLabel()}.dxf`, exportDxf(exportPieces(), recipe.allowances), "image/vnd.dxf");
  });
  onExport("#export-pdf", () => {
    download(`${recipe.name}-${exportSizeLabel()}.pdf`, exportPdf(exportPieces(), recipe.allowances), "application/pdf");
  });
  // The tech pack is a whole-style document (sample-size sketch + graded table),
  // so it uses the live measurements directly and ignores the per-size picker.
  onExport("#export-techpack", () => {
    download(`${recipe.name}-techpack.pdf`, exportTechPack(recipe, measurements, undefined, stretchFabric, recipeOptions()), "application/pdf");
  });
  // The projector file carries EVERY graded size as a toggleable layer, so it too
  // is a whole-style file and ignores the per-size picker.
  onExport("#export-projector", () => {
    download(`${recipe.name}-projector.svg`, exportProjectorSvg(recipe, measurements, recipeOptions()), "image/svg+xml");
  });
  onExport("#export-a0", () => {
    download(`${recipe.name}-${exportSizeLabel()}-A0.pdf`, exportA0Pdf(exportPieces(), recipe.allowances, recipe.notches), "application/pdf");
  });

  // Slice 47: the desktop shell's File > Export menu clicks the SAME button
  // above rather than duplicating any export logic — main only knows which
  // kind was picked, never how to build the file. Absent electronAPI (a
  // plain browser tab), this is simply never registered.
  window.electronAPI?.onExportRequested?.((kind) => {
    const buttonId: Record<string, string> = {
      svg: "export-svg", dxf: "export-dxf", pdf: "export-pdf",
      techpack: "export-techpack", projector: "export-projector", a0: "export-a0",
    };
    const id = buttonId[kind];
    if (id) root.querySelector<HTMLButtonElement>(`#${id}`)?.click();
  });

  root.querySelector<HTMLButtonElement>("#save-pattern")!.addEventListener("click", () => {
    const workspace: Workspace = { garment: recipe.name, targetStyle, stretchFabric: stretchFabric.name,
      view, bodyCroquisView, exportStep, fabricWidth, nestScope };
    const validation = deserialize(serialize(measurements, fabric, garmentOptions, workspace));
    if (!validation.ok) { flash(`Save failed: ${validation.error}`, BLUEPRINT.lineActive); return; }
    saveToStorage(measurements, fabric, garmentOptions, workspace)
      ? flash("Saved ✓", "#2E9B63")
      : flash("Save failed", BLUEPRINT.lineActive);
  });

  root.querySelector<HTMLButtonElement>("#load-pattern")!.addEventListener("click", () => {
    const loaded = readFromStorage();
    if (!loaded.ok) { flash(loaded.error, BLUEPRINT.label); return; }
    measurements = loaded.measurements;
    fabric = loaded.fabric;
    garmentOptions = loaded.garmentOptions;
    recipe = garmentByName(loaded.workspace.garment);
    targetStyle = loaded.workspace.targetStyle;
    stretchFabric = STRETCH_FABRICS.find((f) => f.name === loaded.workspace.stretchFabric)!;
    view = loaded.workspace.view;
    bodyCroquisView = loaded.workspace.bodyCroquisView;
    exportStep = loaded.workspace.exportStep;
    fabricWidth = loaded.workspace.fabricWidth;
    nestScope = loaded.workspace.nestScope;
    markOutputDirty();
    syncWorkspace(true);
    flash("Loaded ✓", "#2E9B63");
  });

  const syncWorkspace = (restoring: boolean): void => {
    editedFront = null;
    selectedId = null;
    dragId = null;
    activeDim = null;
    root.querySelector<HTMLElement>("#controls-panel")!.outerHTML = controlsMarkup(
      measurements, recipe.fields, recipe.options, recipeOptions());
    wireMeasurementInputs();
    GARMENTS.forEach((g) => {
      const button = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      button.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      button.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
      button.setAttribute("aria-pressed", String(on));
    });
    swatches.forEach((swatch) => {
      const on = swatch.dataset.fabric === fabric;
      swatch.style.outline = on ? `2px solid ${BLUEPRINT.lineActive}` : "none";
      swatch.setAttribute("aria-pressed", String(on));
    });
    stretchSelect.value = stretchFabric.name;
    widthInput.value = String(fabricWidth);
    syncExportSizes();
    if (restoring && !disclosureFor(journey.step).views.includes(view)) journey = { ...journey, step: "done" };
    setBodyCroquisView(bodyCroquisView);
    setScope(nestScope);
    setView(view);
    applyDisclosure();
  };
  syncWorkspace(saved !== null);
}
