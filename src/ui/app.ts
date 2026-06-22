// The thin DOM glue: mount the shell, draw the canvas, and redraw it whenever a
// measurement changes. All the real logic lives in pure modules (controls, view,
// drafting, render); this only wires events to them.

import { Measurements, STANDARD_M, draftTshirt } from "../drafting";
import { renderBlueprint } from "../render";
import { FIELDS, applyChange } from "./controls";
import { appShellMarkup } from "./view";

export function mountApp(root: HTMLElement): void {
  let measurements: Measurements = STANDARD_M;
  root.innerHTML = appShellMarkup(measurements);

  const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const draw = (): void => {
    const block = draftTshirt(measurements);
    host.innerHTML = renderBlueprint([block.front, block.back, block.sleeve], { active: "front" });
  };
  draw();

  root.querySelectorAll<HTMLInputElement>("input[data-field]").forEach((input) => {
    const fieldId = input.dataset.field;
    const field = FIELDS.find((f) => f.id === fieldId)!;
    // live redraw as the value changes
    input.addEventListener("input", () => {
      measurements = applyChange(measurements, field, input.value);
      draw();
    });
    // when the person leaves the field, snap it to the clamped, valid value
    input.addEventListener("change", () => {
      input.value = String(measurements[field.id]);
    });
  });
}
