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
    root.querySelector<HTMLButtonElement>("#export-pdf")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tshirt.svg", "tshirt.dxf", "tshirt.pdf"]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
  });

  it("Save writes to localStorage and Load restores the canvas", () => {
    localStorage.clear();
    const root = mount();
    // Change a measurement then save
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input"));
    const savedCanvas = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    root.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));

    // Reset to default and verify it's different
    chest.value = "100";
    chest.dispatchEvent(new Event("input"));
    const resetCanvas = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    expect(resetCanvas).not.toBe(savedCanvas);

    // Load restores the saved state
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host svg")!.getAttribute("viewBox")).toBe(savedCanvas);
    expect(chest.value).toBe("120");
  });

  it("Save shows a failure message when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    const root = mount();
    root.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLSpanElement>("#persist-status")!.textContent).toContain("failed");
    vi.restoreAllMocks();
  });

  it("Load is a no-op when nothing has been saved", () => {
    localStorage.clear();
    const root = mount();
    const before = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host svg")!.getAttribute("viewBox")).toBe(before);
    expect(root.querySelector<HTMLSpanElement>("#persist-status")!.textContent).toContain("Nothing");
  });

  it("changing the target style updates the style panel gap, not the measurements", () => {
    localStorage.clear();
    const root = mount();
    const before = viewBox(root);
    const target = root.querySelector<HTMLSelectElement>("#style-target")!;
    target.value = "Oversized tee";
    target.dispatchEvent(new Event("change", { bubbles: true }));
    expect(viewBox(root)).toBe(before);
    expect(root.querySelector("#style-host")!.innerHTML).toContain("To reach Oversized tee");
  });

  it("shows a fabric-stretch ease note and updates it when fabric changes", () => {
    localStorage.clear();
    const root = mount();
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("no stretch");
    const stretch = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    stretch.value = "Spandex blend";
    stretch.dispatchEvent(new Event("change"));
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("negative ease");
  });

  it("shows the auto-measured spec sheet in the Spec view", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-spec")!.dispatchEvent(new Event("click"));
    const html = root.querySelector("#canvas-host")!.innerHTML;
    expect(html).toContain("<table");
    expect(html).toContain("Body chest (finished)");
    expect(html).toContain("Measurement (cm)");
    // back to pattern clears the table
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("<table");
  });

  it("shows the fabric nesting estimate in the Nesting view", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    const html = root.querySelector("#canvas-host")!.innerHTML;
    expect(html).toContain("cm wide");
    expect(html).toContain("% used");
    // back to pattern clears the estimate
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("% used");
  });

  it("re-nests when the fabric width changes, and ignores an invalid width", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    const before = viewBox(root);
    const width = root.querySelector<HTMLInputElement>("#fabric-width")!;
    // A narrower bolt forces more shelves → a taller sheet → a new viewBox.
    width.value = "60";
    width.dispatchEvent(new Event("input"));
    const after = viewBox(root);
    expect(after).not.toBe(before);
    // An unparseable width is ignored (no throw, canvas unchanged).
    width.value = "abc";
    width.dispatchEvent(new Event("input"));
    expect(viewBox(root)).toBe(after);
  });

  it("shows the production-readiness verdict in the Check view", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-check")!.dispatchEvent(new Event("click"));
    const html = root.querySelector("#canvas-host")!.innerHTML;
    expect(html).toContain("Ready to cut");
    expect(html).toContain("Shoulder seam");
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("Ready to cut");
  });

  it("toggles the canvas between the pattern and the graded size run", () => {
    localStorage.clear();
    const root = mount();
    // Pattern view: a single highlighted piece, no size legend.
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("(base)");
    root.querySelector<HTMLButtonElement>("#view-nest")!.dispatchEvent(new Event("click"));
    // Size-run view: the nest legend marks the base size.
    expect(root.querySelector("#canvas-host")!.innerHTML).toContain("(base)");
    expect(root.querySelector("#canvas-host")!.innerHTML).toContain(">XL<");
    // Back to pattern.
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("(base)");
  });

  it("restores a previous save automatically on mount", () => {
    localStorage.clear();
    // Save a non-default state
    const root1 = mount();
    const chest = root1.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "130";
    chest.dispatchEvent(new Event("input"));
    root1.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));
    const savedView = root1.querySelector("#canvas-host svg")!.getAttribute("viewBox");

    // A fresh mount should open that save automatically
    const root2 = mount();
    expect(root2.querySelector("#canvas-host svg")!.getAttribute("viewBox")).toBe(savedView);
  });
});
