// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, Piece, STRETCH_FABRICS, fabricEaseNote } from "../drafting";
import { gradeRun, draftAtSize, specSheet, GARMENTS, GarmentRecipe, garmentByName } from "../drafting";
import { blockPieces, rolePiece } from "../drafting";
import { exportSvg, exportDxf, exportPdf, exportTechPack, exportProjectorSvg, exportA0Pdf, flattenPiece, nestPieces, gradedMarker } from "../export";
import { renderBlueprint, renderGarment, renderNest, renderFabricNest, renderEditor, renderBody, renderSkirtGarment, renderSkirtBody, DEFAULT_FABRIC } from "../render";
import { pieceHandles, moveHandle, nearestHandle, editorViewBox, viewboxPointToCm, Handle } from "../edit";
import { dartOf, transferDart, trueSeam, edgesMeet } from "../drafting";
import { BLUEPRINT } from "../render";
import { guide, Note } from "../guidance";
import { garmentReport, implausibleFields, measurementsPlausible } from "../guidance";
import { matchStyle, styleNames } from "../style";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup, controlsMarkup, guidanceMarkup, styleMarkup, specTableMarkup, checkMarkup, editorHintMarkup, dartControlsMarkup } from "./view";
import { saveToStorage, loadFromStorage } from "./persist";
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
    };
  }
}

export function mountApp(root: HTMLElement): void {
  const saved = loadFromStorage();
  let measurements: Measurements = saved ? saved.measurements : STANDARD_M;
  let fabric = saved ? saved.fabric : DEFAULT_FABRIC;
  root.innerHTML = appShellMarkup(measurements, fabric, GARMENTS[0].sizes, GARMENTS[0].fields);

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

  let targetStyle = "Classic tee"; // the declared fit target (sets nothing)
  let stretchFabric = STRETCH_FABRICS[0]; // drives the ease guidance note
  let view: "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit" = "pattern";
  let recipe: GarmentRecipe = GARMENTS[0]; // the garment every view is built from
  let editedFront: Piece | null = null; // freeform snapshot of the front (override, not parametric)
  let dragId: string | null = null; // handle being dragged
  let selectedId: string | null = null; // handle highlighted in the editor
  let fabricWidth = 150; // cm — the bolt width for the nesting estimator
  let nestScope: "single" | "marker" = "single"; // one garment, or the whole size run
  let activeDim: string | null = null; // the measurement field spotlighted on the body view

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
    const plausible = measurementsPlausible(measurements, recipe.fields);
    const gaps = matchStyle(measurements, targetStyle, recipe.styles).deltas.length;
    const report = garmentReport(recipe, measurements);
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

  const draw = (): void => {
    // The body figure and the style presets are upper-body only; a garment that
    // doesn't use the chest (a skirt) gets a neutral placeholder instead of a
    // misleading top. (Real lower-body figure + skirt styles: a later slice.)
    const isTop = recipe.fields.includes("chest");
    fabricWidthHost.style.display = view === "fabric" ? "flex" : "none";
    if (view === "nest") {
      canvasHost.innerHTML = renderNest(
        gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft));
    } else if (view === "fabric") {
      const nest = nestScope === "marker"
        ? gradedMarker(recipe, measurements, fabricWidth)
        : nestPieces(blockPieces(recipe.draft(measurements)).map((p) => flattenPiece(p, recipe.allowances)), fabricWidth);
      canvasHost.innerHTML = renderFabricNest(
        nest.placed, nest.fabricWidth, nest.fabricLength, nest.utilization, nest.fits);
    } else if (view === "check") {
      canvasHost.innerHTML = checkMarkup(garmentReport(recipe, measurements), measurementsPlausible(measurements, recipe.fields));
    } else if (view === "edit") {
      const piece = editedFront!;
      const vb = editorViewBox(piece);
      const hasDart = dartOf(piece) !== null;
      // Truing consumes `sideLower`, so only offer it while both halves still exist
      // AND the dart has moved off the side (leaving the two halves touching).
      const sideSplit = ["sideUpper", "sideLower"].every((n) =>
        piece.edges.some((e) => e.name === n));
      const canTrue = hasDart && sideSplit && edgesMeet(piece, "sideUpper", "sideLower");
      canvasHost.innerHTML =
        renderEditor(piece, pieceHandles(piece), vb, selectedId) +
        editorHintMarkup() +
        dartControlsMarkup(hasDart, canTrue);
    } else if (view === "spec") {
      const graded = gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft);
      const baseIndex = graded.findIndex((g) => g.step === 0);
      canvasHost.innerHTML = specTableMarkup(
        specSheet(graded, recipe.poms), graded.map((g) => g.label), baseIndex);
    } else if (view === "body") {
      canvasHost.innerHTML = isTop ? renderBody(measurements) : renderSkirtBody(measurements);
    } else {
      const block = recipe.draft(measurements);
      const pieces = blockPieces(block);
      canvasHost.innerHTML = renderBlueprint(
        pieces,
        { active: pieces[0].name, notches: recipe.notches, allowances: recipe.allowances });
    }
    garmentHost.innerHTML = isTop ? renderGarment(measurements, fabric) : renderSkirtGarment(measurements, fabric);
    // One sanity read for the whole frame: are the numbers a real body? It gates
    // every green "validated" signal — the check banner, the style ✓ — and flags
    // the offending fields, so geometry passing can never masquerade as "ready".
    const plausible = measurementsPlausible(measurements, recipe.fields);
    // Guidance = the geometry checks, plus a fabric-stretch ease note (advice only).
    const fabricNote: Note = { level: "info", text: fabricEaseNote(stretchFabric, measurements.chest) };
    guidanceHost.innerHTML = guidanceMarkup([...guide(recipe, measurements), fabricNote]);
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
  draw();

  const viewBtns = {
    pattern: root.querySelector<HTMLButtonElement>("#view-pattern")!,
    body: root.querySelector<HTMLButtonElement>("#view-body")!,
    nest: root.querySelector<HTMLButtonElement>("#view-nest")!,
    spec: root.querySelector<HTMLButtonElement>("#view-spec")!,
    fabric: root.querySelector<HTMLButtonElement>("#view-fabric")!,
    check: root.querySelector<HTMLButtonElement>("#view-check")!,
    edit: root.querySelector<HTMLButtonElement>("#view-edit")!,
  };
  const setView = (v: "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit"): void => {
    if (v === "edit" && editedFront === null) editedFront = rolePiece(recipe.draft(measurements), "front");
    view = v;
    (["pattern", "body", "nest", "spec", "fabric", "check", "edit"] as const).forEach((k) => {
      const on = k === v;
      viewBtns[k].style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      viewBtns[k].style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    });
    draw();
  };
  viewBtns.pattern.addEventListener("click", () => setView("pattern"));
  viewBtns.body.addEventListener("click", () => setView("body"));
  viewBtns.nest.addEventListener("click", () => setView("nest"));
  viewBtns.spec.addEventListener("click", () => setView("spec"));
  viewBtns.fabric.addEventListener("click", () => setView("fabric"));
  viewBtns.check.addEventListener("click", () => setView("check"));
  viewBtns.edit.addEventListener("click", () => setView("edit"));

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
    if (view !== "edit") return;
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
    const id = (e.target as HTMLElement).id;
    if (id === "editor-reset") {
      editedFront = rolePiece(recipe.draft(measurements), "front");
      selectedId = null;
      draw();
    } else if (DART_TOOLS[id] && editedFront) {
      editedFront = DART_TOOLS[id](editedFront);
      selectedId = null;
      draw();
    }
  });

  const setGarment = (name: string): void => {
    recipe = garmentByName(name);
    targetStyle = recipe.styles[0].name; // the old target may not exist for this garment
    GARMENTS.forEach((g) => {
      const btn = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      btn.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      btn.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    });
    editedFront = null; // a new garment invalidates the freeform snapshot
    selectedId = null;
    // Re-render the measurement panel to this garment's fields (a skirt shows
    // waist/hip, not chest/sleeve), then re-attach its listeners.
    root.querySelector<HTMLElement>("#controls-panel")!.outerHTML = controlsMarkup(measurements, recipe.fields);
    wireMeasurementInputs();
    if (view === "edit") editedFront = rolePiece(recipe.draft(measurements), "front");
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
      draw();
    }
  });

  const single = root.querySelector<HTMLButtonElement>("#nest-single")!;
  const marker = root.querySelector<HTMLButtonElement>("#nest-marker")!;
  const setScope = (s: "single" | "marker"): void => {
    nestScope = s;
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
        draw();
      });
      input.addEventListener("change", () => {
        input.value = String(measurements[field.id]);
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
      swatches.forEach((s) => {
        s.style.outline = s.dataset.fabric === fabric ? `2px solid ${BLUEPRINT.lineActive}` : "none";
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
      draw();
    }
  });

  const stretchSelect = root.querySelector<HTMLSelectElement>("#stretch-select")!;
  stretchSelect.addEventListener("change", () => {
    stretchFabric = STRETCH_FABRICS.find((f) => f.name === stretchSelect.value)!;
    draw();
  });

  // Export-local state: which size the download buttons emit. Defaults to base (M);
  // it scopes ONLY the exports, never the other views.
  let exportStep = 0;
  const exportSizeEl = root.querySelector<HTMLSelectElement>("#export-size")!;
  exportSizeEl.addEventListener("change", () => {
    exportStep = Number(exportSizeEl.value);
  });
  // exportStep always comes from the picker, which is populated from recipe.sizes,
  // so the step is guaranteed to resolve to a real size.
  const exportSizeLabel = (): string =>
    recipe.sizes.find((s) => s.step === exportStep)!.label;
  const exportPieces = (): Piece[] => {
    const block = draftAtSize(measurements, recipe.grade, exportStep, recipe.draft);
    return [...blockPieces(block)];
  };
  // The desktop shell's only bridge into this app (Slice 46): when running
  // inside Electron, `window.electronAPI` is set by electron/preload.cts via
  // contextBridge, and download() below routes through it instead of the
  // browser Blob-download trick. Absent it — `npm run dev` in a plain
  // browser, or any other web host — the app is exactly what it was before
  // this slice. Additive, not a fork: every export button, every test of
  // this function's browser path, is unchanged.
  const download = (filename: string, text: string, mime: string): void => {
    if (window.electronAPI) {
      void window.electronAPI.saveFile(filename, text);
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    // Reaching a real export completes the journey's checklist; while the tour
    // is still on, confirm it lightly (and honestly — see celebrationMarkup).
    journey = { ...journey, exported: true };
    saveJourney(journey);
    if (journey.step !== "done") celebrating = true;
    renderJourney();
  };
  root.querySelector<HTMLButtonElement>("#export-svg")!.addEventListener("click", () => {
    download(`${recipe.name}-${exportSizeLabel()}.svg`, exportSvg(exportPieces(), recipe.allowances, recipe.notches), "image/svg+xml");
  });
  root.querySelector<HTMLButtonElement>("#export-dxf")!.addEventListener("click", () => {
    download(`${recipe.name}-${exportSizeLabel()}.dxf`, exportDxf(exportPieces(), recipe.allowances), "image/vnd.dxf");
  });
  root.querySelector<HTMLButtonElement>("#export-pdf")!.addEventListener("click", () => {
    download(`${recipe.name}-${exportSizeLabel()}.pdf`, exportPdf(exportPieces(), recipe.allowances), "application/pdf");
  });
  // The tech pack is a whole-style document (sample-size sketch + graded table),
  // so it uses the live measurements directly and ignores the per-size picker.
  root.querySelector<HTMLButtonElement>("#export-techpack")!.addEventListener("click", () => {
    download(`${recipe.name}-techpack.pdf`, exportTechPack(recipe, measurements), "application/pdf");
  });
  // The projector file carries EVERY graded size as a toggleable layer, so it too
  // is a whole-style file and ignores the per-size picker.
  root.querySelector<HTMLButtonElement>("#export-projector")!.addEventListener("click", () => {
    download(`${recipe.name}-projector.svg`, exportProjectorSvg(recipe, measurements), "image/svg+xml");
  });
  root.querySelector<HTMLButtonElement>("#export-a0")!.addEventListener("click", () => {
    download(`${recipe.name}-${exportSizeLabel()}-A0.pdf`, exportA0Pdf(exportPieces(), recipe.allowances, recipe.notches), "application/pdf");
  });

  const statusEl = root.querySelector<HTMLSpanElement>("#persist-status")!;
  let statusTimer = 0;
  const flash = (msg: string, color: string): void => {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { statusEl.textContent = ""; }, 2000);
  };

  root.querySelector<HTMLButtonElement>("#save-pattern")!.addEventListener("click", () => {
    saveToStorage(measurements, fabric)
      ? flash("Saved ✓", "#2E9B63")
      : flash("Save failed", BLUEPRINT.lineActive);
  });

  root.querySelector<HTMLButtonElement>("#load-pattern")!.addEventListener("click", () => {
    const loaded = loadFromStorage();
    if (!loaded) { flash("Nothing saved", BLUEPRINT.label); return; }
    measurements = loaded.measurements;
    fabric = loaded.fabric;
    root.querySelectorAll<HTMLInputElement>("input[data-field]").forEach((input) => {
      input.value = String(measurements[input.dataset.field as keyof Measurements]);
    });
    draw();
    flash("Loaded ✓", "#2E9B63");
  });
}
