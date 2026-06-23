// The thin DOM glue: mount the shell, then on every measurement change re-draft,
// re-render the canvas, and refresh the guidance and style panels. All real logic
// lives in the pure modules (controls, view, drafting, render, guidance, style).

import { Measurements, STANDARD_M, draftTshirt } from "../drafting";
import { renderBlueprint } from "../render";
import { guide } from "../guidance";
import { styleSuggestions } from "../style";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup, guidanceMarkup, styleMarkup } from "./view";

export function mountApp(root: HTMLElement): void {
  let measurements: Measurements = STANDARD_M;
  root.innerHTML = appShellMarkup(measurements);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;

  const draw = (): void => {
    const block = draftTshirt(measurements);
    canvasHost.innerHTML = renderBlueprint(
      [block.front, block.back, block.sleeve], { active: "front" });
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
}
