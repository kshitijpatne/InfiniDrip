// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, draftTshirt } from "../drafting";
import { renderBlueprint, renderGarment, DEFAULT_FABRIC } from "../render";
import { BLUEPRINT } from "../render";
import { guide } from "../guidance";
import { styleSuggestions } from "../style";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup, guidanceMarkup, styleMarkup } from "./view";

export function mountApp(root: HTMLElement): void {
  let measurements: Measurements = STANDARD_M;
  let fabric = DEFAULT_FABRIC;
  root.innerHTML = appShellMarkup(measurements, fabric);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const garmentHost = root.querySelector<HTMLDivElement>("#garment-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;

  const draw = (): void => {
    const block = draftTshirt(measurements);
    canvasHost.innerHTML = renderBlueprint(
      [block.front, block.back, block.sleeve], { active: "front" });
    garmentHost.innerHTML = renderGarment(measurements, fabric);
    guidanceHost.innerHTML = guidanceMarkup(guide(measurements));
    styleHost.innerHTML = styleMarkup(styleSuggestions(measurements));
  };
  draw();

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
}
