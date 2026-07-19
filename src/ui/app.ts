// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, Piece, STRETCH_FABRICS, fabricEaseNote } from "../drafting";
import { gradeRun, draftAtSize, specSheet, GARMENTS, GarmentRecipe, garmentByName } from "../drafting";
import { blockPieces, rolePiece } from "../drafting";
import { exportSvg, exportDxf, exportPdf, exportTechPack, flattenPiece, nestPieces, gradedMarker } from "../export";
import { renderBlueprint, renderGarment, renderNest, renderFabricNest, renderEditor, renderBody, DEFAULT_FABRIC } from "../render";
import { pieceHandles, moveHandle, nearestHandle, editorViewBox, viewboxPointToCm, Handle } from "../edit";
import { dartOf, transferDart, trueSeam, edgesMeet } from "../drafting";
import { BLUEPRINT } from "../render";
import { guide, Note } from "../guidance";
import { garmentReport } from "../guidance";
import { matchStyle, styleNames } from "../style";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup, guidanceMarkup, styleMarkup, specTableMarkup, checkMarkup, editorHintMarkup, dartControlsMarkup } from "./view";
import { saveToStorage, loadFromStorage } from "./persist";

export function mountApp(root: HTMLElement): void {
  const saved = loadFromStorage();
  let measurements: Measurements = saved ? saved.measurements : STANDARD_M;
  let fabric = saved ? saved.fabric : DEFAULT_FABRIC;
  root.innerHTML = appShellMarkup(measurements, fabric, GARMENTS[0].sizes);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const garmentHost = root.querySelector<HTMLDivElement>("#garment-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;
  const fabricWidthHost = root.querySelector<HTMLDivElement>("#fabric-width-host")!;

  let targetStyle = "Classic tee"; // the declared fit target (sets nothing)
  let stretchFabric = STRETCH_FABRICS[0]; // drives the ease guidance note
  let view: "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit" = "pattern";
  let recipe: GarmentRecipe = GARMENTS[0]; // the garment every view is built from
  let editedFront: Piece | null = null; // freeform snapshot of the front (override, not parametric)
  let dragId: string | null = null; // handle being dragged
  let selectedId: string | null = null; // handle highlighted in the editor
  let fabricWidth = 150; // cm — the bolt width for the nesting estimator
  let nestScope: "single" | "marker" = "single"; // one garment, or the whole size run

  const draw = (): void => {
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
      canvasHost.innerHTML = checkMarkup(garmentReport(recipe, measurements));
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
      canvasHost.innerHTML = renderBody(measurements);
    } else {
      const block = recipe.draft(measurements);
      const pieces = blockPieces(block);
      canvasHost.innerHTML = renderBlueprint(
        pieces,
        { active: pieces[0].name, notches: recipe.notches, allowances: recipe.allowances });
    }
    garmentHost.innerHTML = renderGarment(measurements, fabric);
    // Guidance = the geometry checks, plus a fabric-stretch ease note (advice only).
    const fabricNote: Note = { level: "info", text: fabricEaseNote(stretchFabric, measurements.chest) };
    guidanceHost.innerHTML = guidanceMarkup([...guide(measurements, recipe.draft(measurements)), fabricNote]);
    // Style = prescriptive: the gap from current measurements to the chosen target.
    styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle), styleNames());
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
    GARMENTS.forEach((g) => {
      const btn = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      btn.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      btn.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    });
    editedFront = null; // a new garment invalidates the freeform snapshot
    selectedId = null;
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
  const download = (filename: string, text: string, mime: string): void => {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
