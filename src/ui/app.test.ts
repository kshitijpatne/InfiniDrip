// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { mountApp } from "./app";

function mount(): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root);
  return root;
}
const viewBox = (root: HTMLElement): string =>
  root.querySelector("#canvas-host svg")!.getAttribute("viewBox")!;

describe("mountApp", () => {
  it("draws the canvas and the garment on mount", () => {
    const root = mount();
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
  });

  it("redraws the canvas when a measurement changes", () => {
    const root = mount();
    const before = viewBox(root);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "150";
    chest.dispatchEvent(new Event("input"));
    expect(viewBox(root)).not.toBe(before);
  });

  it("snaps an out-of-range field to its clamped value on change", () => {
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "999";
    chest.dispatchEvent(new Event("input"));
    chest.dispatchEvent(new Event("change"));
    expect(chest.value).toBe("160");
  });

  it("recolours the garment when a fabric swatch is clicked", () => {
    const root = mount();
    const swatches = root.querySelectorAll<HTMLButtonElement>("button[data-fabric]");
    const target = swatches[swatches.length - 1];
    target.dispatchEvent(new Event("click"));
    const garment = root.querySelector("#garment-host svg")!.innerHTML;
    expect(garment).toContain(`fill="${target.dataset.fabric}"`);
  });

  it("downloads a file when an export button is clicked", () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    const root = mount();
    root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#export-dxf")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tshirt.svg", "tshirt.dxf"]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });
});
