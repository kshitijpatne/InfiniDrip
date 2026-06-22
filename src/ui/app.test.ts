// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mountApp } from "./app";

function mount(): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root);
  return root;
}
const viewBox = (root: HTMLElement): string =>
  root.querySelector("#canvas-host svg")!.getAttribute("viewBox")!;

describe("mountApp", () => {
  it("draws a canvas on mount", () => {
    const root = mount();
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
  });

  it("redraws the canvas when a measurement changes", () => {
    const root = mount();
    const before = viewBox(root);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "150"; // wider chest => wider canvas
    chest.dispatchEvent(new Event("input"));
    expect(viewBox(root)).not.toBe(before);
  });

  it("snaps an out-of-range field to its clamped value on change", () => {
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "999";
    chest.dispatchEvent(new Event("input"));
    chest.dispatchEvent(new Event("change"));
    expect(chest.value).toBe("160"); // clamped to the field maximum
  });
});
