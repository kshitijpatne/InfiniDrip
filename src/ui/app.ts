// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, draftTshirt, Piece, STRETCH_FABRICS, fabricEaseNote } from "../drafting";
import { gradeRun, TSHIRT_GRADE, TSHIRT_SIZES, specSheet, TSHIRT_POMS } from "../drafting";
import { exportSvg, exportDxf, exportPdf, flattenPiece, nestPieces } from "../export";
import { renderBlueprint, renderGarment, renderNest, renderFabricNest, DEFAULT_FABRIC } from "../render";
import { BLUEPRINT } from "../render";
import { guide, Note } from "../guidance";
import { matchStyle, styleNames } from "../style";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup, guidanceMarkup, styleMarkup, specTableMarkup } from "./view";
import { saveToStorage, loadFromStorage } from "./persist";

export function mountApp(root: HTMLElement): void {
  const saved = loadFromStorage();
  let measurements: Measurements = saved ? saved.measurements : STANDARD_M;
  let fabric = saved ? saved.fabric : DEFAULT_FABRIC;
  root.innerHTML = appShellMarkup(measurements, fabric);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const garmentHost = root.querySelector<HTMLDivElement>("#garment-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;

  let targetStyle = "Classic tee"; // the declared fit target (sets nothing)
  let stretchFabric = STRETCH_FABRICS[0]; // drives the ease guidance note
  let view: "pattern" | "nest" | "spec" | "fabric" = "pattern";
  let fabricWidth = 150; // cm — the bolt width for the nesting estimator
  const ALLOWANCE = 1; // cm seam allowance, shared by nesting and the exports

  const draw = (): void => {
    if (view === "nest") {
      canvasHost.innerHTML = renderNest(gradeRun(measurements, TSHIRT_GRADE, TSHIRT_SIZES));
    } else if (view === "fabric") {
      const block = draftTshirt(measurements);
      const flats = [block.front, block.back, block.sleeve].map((p) => flattenPiece(p, ALLOWANCE));
      const nest = nestPieces(flats, fabricWidth);
      canvasHost.innerHTML = renderFabricNest(
        nest.placed, nest.fabricWidth, nest.fabricLength, nest.utilization, nest.fits);
    } else if (view === "spec") {
      const graded = gradeRun(measurements, TSHIRT_GRADE, TSHIRT_SIZES);
      const baseIndex = graded.findIndex((g) => g.step === 0);
      canvasHost.innerHTML = specTableMarkup(
        specSheet(graded, TSHIRT_POMS), graded.map((g) => g.label), baseIndex);
    } else {
      const block = draftTshirt(measurements);
      canvasHost.innerHTML = renderBlueprint(
        [block.front, block.back, block.sleeve], { active: "front" });
    }
    garmentHost.innerHTML = renderGarment(measurements, fabric);
    // Guidance = the geometry checks, plus a fabric-stretch ease note (advice only).
    const fabricNote: Note = { level: "info", text: fabricEaseNote(stretchFabric, measurements.chest) };
    guidanceHost.innerHTML = guidanceMarkup([...guide(measurements), fabricNote]);
    // Style = prescriptive: the gap from current measurements to the chosen target.
    styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle), styleNames());
  };
  draw();

  const viewBtns = {
    pattern: root.querySelector<HTMLButtonElement>("#view-pattern")!,
    nest: root.querySelector<HTMLButtonElement>("#view-nest")!,
    spec: root.querySelector<HTMLButtonElement>("#view-spec")!,
    fabric: root.querySelector<HTMLButtonElement>("#view-fabric")!,
  };
  const setView = (v: "pattern" | "nest" | "spec" | "fabric"): void => {
    view = v;
    (["pattern", "nest", "spec", "fabric"] as const).forEach((k) => {
      const on = k === v;
      viewBtns[k].style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      viewBtns[k].style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    });
    draw();
  };
  viewBtns.pattern.addEventListener("click", () => setView("pattern"));
  viewBtns.nest.addEventListener("click", () => setView("nest"));
  viewBtns.spec.addEventListener("click", () => setView("spec"));
  viewBtns.fabric.addEventListener("click", () => setView("fabric"));

  const widthInput = root.querySelector<HTMLInputElement>("#fabric-width")!;
  widthInput.addEventListener("input", () => {
    const v = Number(widthInput.value);
    if (Number.isFinite(v) && v > 0) {
      fabricWidth = v;
      draw();
    }
  });

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

  const exportPieces = (): Piece[] => {
    const block = draftTshirt(measurements);
    return [block.front, block.back, block.sleeve];
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
    download("tshirt.svg", exportSvg(exportPieces(), ALLOWANCE), "image/svg+xml");
  });
  root.querySelector<HTMLButtonElement>("#export-dxf")!.addEventListener("click", () => {
    download("tshirt.dxf", exportDxf(exportPieces(), ALLOWANCE), "image/vnd.dxf");
  });
  root.querySelector<HTMLButtonElement>("#export-pdf")!.addEventListener("click", () => {
    download("tshirt.pdf", exportPdf(exportPieces(), ALLOWANCE), "application/pdf");
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
