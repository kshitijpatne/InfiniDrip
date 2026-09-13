// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountApp } from "./app";
import { STANDARD_M, draftTshirt, rolePiece } from "../drafting";
import { pieceHandles, editorViewBox } from "../edit";

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
    expect(root.querySelector("h1#product-title")!.textContent).toBe("InfiniDrip");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
    expect(root.querySelector("#assembled-preview-title")!.textContent).toBe("Assembled preview");
  });

  it("starts a fresh Tee workspace with a knit-appropriate material", () => {
    localStorage.clear();
    const root = mount();
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
  });

  it("lets the secondary assembled preview collapse without losing ownership", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.getAttribute("aria-expanded")).toBe("false");
    expect(root.querySelector<HTMLElement>("#assembled-preview-content")!.style.display).toBe("none");
    expect(root.querySelector("#assembled-preview-title")!.textContent).toBe("Assembled preview");
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.getAttribute("aria-expanded")).toBe("true");
  });

  it("redraws the canvas when a measurement changes", () => {
    const root = mount();
    const before = viewBox(root);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "150";
    chest.dispatchEvent(new Event("input"));
    expect(viewBox(root)).not.toBe(before);
  });

  it("uses flank +/- buttons and keeps the live boundary rail truthful", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    const control = chest.closest<HTMLElement>("[data-range-control]")!;
    const plus = control.querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!;
    const minus = control.querySelector<HTMLButtonElement>('button[data-step-direction="-1"]')!;

    plus.dispatchEvent(new Event("click", { bubbles: true }));
    expect(chest.value).toBe("101");
    expect(control.dataset.rangeState).toBe("valid");
    expect(control.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("current value 101 cm");
    expect(control.querySelector<HTMLElement>("[data-range-marker]")!.style.left).toBe("41%");

    chest.value = "60";
    chest.dispatchEvent(new Event("input"));
    expect(minus.disabled).toBe(true);
    minus.dispatchEvent(new Event("click", { bubbles: true }));
    expect(chest.value).toBe("60");

    chest.value = "999";
    chest.dispatchEvent(new Event("input"));
    expect(control.dataset.rangeState).toBe("over");
    expect(control.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("above maximum");
    minus.dispatchEvent(new Event("click", { bubbles: true }));
    expect(chest.value).toBe("160"); // an explicit action recovers to the boundary
    expect(plus.disabled).toBe(true);

    chest.value = "";
    chest.dispatchEvent(new Event("input"));
    expect(control.dataset.rangeState).toBe("empty");
    expect(control.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("current value unavailable");
    expect(chest.getAttribute("aria-valuenow")).toBeNull();
  });

  it("repeats a held stepper and suppresses the synthetic click", () => {
    localStorage.clear();
    vi.useFakeTimers();
    try {
      const root = mount();
      const plus = root.querySelector<HTMLButtonElement>('input[data-field="chest"]')!
        .closest<HTMLElement>("[data-range-control]")!
        .querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!;
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;

      plus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(chest.value).toBe("101"); // immediate response
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(240); // three 80 ms repeats
      const held = Number(chest.value);
      expect(held).toBeGreaterThan(101);
      window.dispatchEvent(new Event("pointerup"));
      plus.dispatchEvent(new Event("click", { bubbles: true }));
      expect(Number(chest.value)).toBe(held); // no double-step after release
      vi.advanceTimersByTime(500);
      expect(Number(chest.value)).toBe(held); // release stopped the interval

      chest.value = "158";
      chest.dispatchEvent(new Event("input"));
      plus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(chest.value).toBe("159");
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(160); // the interval reaches 160, then stops on disabled +
      expect(chest.value).toBe("160");
      window.dispatchEvent(new Event("pointerup"));

      chest.value = "159";
      chest.dispatchEvent(new Event("input"));
      plus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(chest.value).toBe("160");
      vi.advanceTimersByTime(350); // the delayed repeat also stops at a boundary
      window.dispatchEvent(new Event("pointerup"));

      chest.value = "100";
      chest.dispatchEvent(new Event("input"));
      plus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(chest.value).toBe("101");
      window.dispatchEvent(new Event("blur"));
      const blurred = chest.value;
      vi.advanceTimersByTime(500);
      expect(chest.value).toBe(blurred);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the same +/- and range contract for recipe options, nesting width, and Edit coordinates", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-polo")!.dispatchEvent(new Event("click"));
    const option = root.querySelector<HTMLInputElement>('input[data-option="placketLength"]')!;
    const optionControl = option.closest<HTMLElement>("[data-range-control]")!;
    optionControl.querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(option.value).toBe("14.5");
    expect(optionControl.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("Allowed range");

    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    const width = root.querySelector<HTMLInputElement>("#fabric-width")!;
    root.querySelector<HTMLElement>('[data-range-control="fabric-width"]')!
      .querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(width.value).toBe("151");
    expect(root.querySelector('[data-range-control="fabric-width"] [data-range-rail]')!.getAttribute("aria-label"))
      .toContain("30–300 cm");

    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    const coordinate = root.querySelector<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')!;
    const before = Number(coordinate.value);
    coordinate.closest<HTMLElement>("[data-range-control]")!
      .querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    const after = root.querySelector<HTMLInputElement>(`#${coordinate.id}`)!;
    expect(Number(after.value)).toBeCloseTo(before + 0.1, 5);
    expect(after.closest<HTMLElement>("[data-range-control]")!.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("Open range");
    expect(after.closest<HTMLElement>("[data-range-control]")!.querySelector<HTMLElement>("[data-range-marker]")!.style.display)
      .toBe("none");
  });

  it("preserves an out-of-range field with an actionable correction on change", () => {
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "999";
    chest.dispatchEvent(new Event("input"));
    chest.dispatchEvent(new Event("change"));
    expect(chest.value).toBe("999");
    expect(chest.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-chest")!.textContent).toContain("60–160");
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Draft paused");
  });

  it("recolours the garment when a fabric swatch is clicked", () => {
    const root = mount();
    const swatches = root.querySelectorAll<HTMLButtonElement>("button[data-fabric]");
    const target = swatches[swatches.length - 1];
    target.dispatchEvent(new Event("click"));
    const garment = root.querySelector("#garment-host svg")!.innerHTML;
    expect(garment).toContain(`fill="${target.dataset.fabric}"`);
  });

  it("switches the canvas to the body view when Body is clicked", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const canvas = root.querySelector("#canvas-host svg")!.innerHTML;
    expect(canvas).toContain("Armhole depth"); // a body-view dimension label
    expect(canvas).toContain("(circ)"); // girth labels are marked
    expect(root.querySelector<HTMLButtonElement>("#view-body")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLButtonElement>("#view-pattern")!.getAttribute("aria-pressed")).toBe("false");
  });

  it("moves focus from a guidance note to its associated control", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    const review = root.querySelector<HTMLButtonElement>('button[data-guidance-focus="ease"]')!;
    review.dispatchEvent(new Event("click", { bubbles: true }));
    expect(document.activeElement).toBe(root.querySelector('input[data-field="ease"]'));
    const guidanceHost = root.querySelector<HTMLElement>("#guidance-host")!;
    guidanceHost.dispatchEvent(new Event("click", { bubbles: true }));
    const emptyFocus = document.createElement("button");
    emptyFocus.setAttribute("data-guidance-focus", "");
    guidanceHost.append(emptyFocus);
    emptyFocus.dispatchEvent(new Event("click", { bubbles: true }));
    root.remove();
  });

  it("supports readable single-figure body focus and bounded zoom", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-front")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#inspection-content svg")).toHaveLength(1);
    expect(root.querySelector<HTMLButtonElement>("#body-front")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#inspection-content svg")!.getAttribute("aria-label")).toContain("Body figure inspection");
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="in"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector("#inspection-zoom")!.textContent).toBe("125%");
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="fit"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector("#inspection-zoom")!.textContent).toBe("100%");
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="out"]')!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector("#inspection-zoom")!.textContent).toBe("75%");
  });

  it("keeps the back body figure named and fits a wide inspection SVG", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-back")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#inspection-content svg")).toHaveLength(1);
    expect(root.querySelector<HTMLButtonElement>("#body-back")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#inspection-content svg")!.getAttribute("aria-label")).toContain("Body figure inspection");

    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 600 });
    root.querySelector<HTMLElement>("#inspection-content")!.innerHTML = '<svg viewBox="0 0 100 100"></svg>';
    window.dispatchEvent(new Event("resize"));
    expect(root.querySelector<SVGSVGElement>("#inspection-content svg")!.style.width).toBe("584px");
    expect(root.querySelector<SVGSVGElement>("#inspection-content svg")!.style.height).toBe("584px");

    root.querySelector<HTMLElement>("#inspection-title")!.remove();
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 16 });
    root.querySelector<HTMLElement>("#inspection-content")!.innerHTML = '<svg viewBox="0 0 0 100"></svg>';
    window.dispatchEvent(new Event("resize"));
    root.querySelector<HTMLElement>("#inspection-content")!.innerHTML = "<svg></svg>";
    window.dispatchEvent(new Event("resize"));
  });

  it("offers the schematic Side body view for both upper and lower garments", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#welcome-skip")!.dispatchEvent(new Event("click", { bubbles: true }));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLElement>("#body-croquis-toggle-host")!.style.display).toBe("flex");

    root.querySelector<HTMLButtonElement>("#body-side")!.dispatchEvent(new Event("click"));
    let side = root.querySelector("#canvas-host svg")!;
    expect(side.getAttribute("data-croquis-region")).toBe("upper");
    expect(side.getAttribute("data-croquis-view")).toBe("side");
    expect(side.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
    expect(side.querySelector("[data-dim]")).toBeNull(); // no side-specific measurements exist
    expect(side.textContent).toContain("SIDE · SCHEMATIC");
    expect(root.querySelector<HTMLButtonElement>("#body-side")!.getAttribute("aria-pressed")).toBe("true");

    root.querySelector<HTMLButtonElement>("#garment-skirt")!.dispatchEvent(new Event("click"));
    side = root.querySelector("#canvas-host svg")!;
    expect(side.getAttribute("data-croquis-region")).toBe("lower");
    expect(side.getAttribute("data-croquis-view")).toBe("side");
    expect(side.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
    expect(root.querySelector<HTMLElement>("#body-croquis-toggle-host")!.style.display).toBe("flex");
    expect(root.querySelector<HTMLButtonElement>("#body-side")!.getAttribute("aria-pressed")).toBe("true");

    root.querySelector<HTMLButtonElement>("#body-front-back")!.dispatchEvent(new Event("click"));
    expect(root.querySelector('[data-dim="waist"]')).not.toBeNull();
    expect(root.querySelector('[data-part="side-silhouette"]')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#body-front-back")!.getAttribute("aria-pressed")).toBe("true");

    root.querySelector<HTMLButtonElement>("#garment-polo")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLElement>("#body-croquis-toggle-host")!.style.display).toBe("flex");
    expect(root.querySelector<HTMLButtonElement>("#body-front-back")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelectorAll("#canvas-host svg")).toHaveLength(2);
  });

  it("draws the tank without a sleeve, in both the body view and the assembled view (Slice 60)", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-tank")!.dispatchEvent(new Event("click"));

    const garment = root.querySelector("#garment-host svg")!.innerHTML;
    expect(garment).not.toContain("stroke-dasharray"); // no armhole seam — nothing sews to it
    expect(garment).toContain("C 13.75 9 20 19 27.5 24"); // exact drafted armhole
    expect(root.querySelector('input[data-field="neckWidthEase"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const body = root.querySelector("#canvas-host svg")!.innerHTML;
    expect(body).not.toContain("Sleeve"); // sleeveLength isn't one of the tank's fields
    expect(body).not.toContain("Bicep");
    expect(body).toContain("Armhole depth"); // the tank DOES still use this one
    expect(body).toContain("C 13.75 9 20 19 27.5 24");
  });

  it("still draws the tee WITH a sleeve — the fix is garment-specific, not global", () => {
    const root = mount();
    const garment = root.querySelector("#garment-host svg")!.innerHTML;
    expect(garment).toContain("stroke-dasharray");
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host svg")!.innerHTML).toContain("Sleeve");
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
    expect(created).toEqual(["tee-M.svg", "tee-M.dxf", "tee-M.pdf"]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
  });

  it("routes the download through window.electronAPI when running inside the desktop shell (Slice 46), skipping the Blob path entirely", async () => {
    const saveFile = vi.fn().mockResolvedValue({ saved: true, filePath: "/tmp/tee-M.svg" });
    window.electronAPI = { saveFile };
    URL.createObjectURL = vi.fn(() => "blob:test"); // must NOT be called on this path
    HTMLAnchorElement.prototype.click = vi.fn();
    try {
      const root = mount();
      root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
      await Promise.resolve();
      expect(saveFile).toHaveBeenCalledTimes(1);
      const [filename, content] = saveFile.mock.calls[0];
      expect(filename).toBe("tee-M.svg");
      expect(content).toContain("<svg"); // the real exported SVG text, not a stub
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    } finally {
      // Every other test in this file assumes the plain-browser path — leaving
      // this set would silently break them by taking the Electron branch instead.
      delete window.electronAPI;
    }
  });

  it("routes a menu-triggered export (Slice 47) through the SAME button the mouse click uses, not a duplicated export path", async () => {
    const saveFile = vi.fn().mockResolvedValue({ saved: true });
    let registered: ((kind: string) => void) | undefined;
    window.electronAPI = {
      saveFile,
      onExportRequested: (cb) => { registered = cb; },
    };
    try {
      mount();
      expect(registered).toBeTypeOf("function"); // app.ts really registered a listener
      registered!("dxf"); // simulates "File > Export > DXF" being clicked in the real menu
      await Promise.resolve();
      expect(saveFile).toHaveBeenCalledTimes(1);
      const [filename, content] = saveFile.mock.calls[0];
      expect(filename).toBe("tee-M.dxf"); // proves #export-dxf's own handler ran, not a copy
      expect(content).toContain("POLYLINE"); // real DXF content, not a stub
    } finally {
      delete window.electronAPI;
    }
  });

  it("registers no menu listener at all when electronAPI has no onExportRequested (a plain browser tab)", () => {
    // Guards the optional chaining: mounting outside Electron must not throw
    // just because window.electronAPI is entirely absent.
    expect(() => mount()).not.toThrow();
  });

  it("downloads a whole-style tech pack, ignoring the per-size picker", () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    const root = mount();
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    const opts = [...root.querySelectorAll<HTMLOptionElement>("#export-size option")];
    size.value = opts[opts.length - 1].value;
    size.dispatchEvent(new Event("change"));
    root.querySelector<HTMLButtonElement>("#export-techpack")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-techpack.pdf"]); // size picker does not rename it
  });

  it("downloads a whole-run projector file, ignoring the per-size picker", () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    const root = mount();
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    size.value = "1";
    size.dispatchEvent(new Event("change"));
    root.querySelector<HTMLButtonElement>("#export-projector")!.dispatchEvent(new Event("click"));
    // every size rides in the file as a layer, so the picker does not rename it
    expect(created).toEqual(["tee-projector.svg"]);
  });

  it("downloads the A0 file at the picked size", () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    const root = mount();
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    size.value = "1";
    size.dispatchEvent(new Event("change"));
    root.querySelector<HTMLButtonElement>("#export-a0")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-L-A0.pdf"]);
  });

  it("exports the chosen size: the picker drives the filename and the geometry", () => {
    const created: string[] = [];
    const blobs: string[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => { void b; return "blob:test"; }) as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const captured: string[] = [];
    // capture the SVG text handed to the blob so we can prove size L != size M
    const RealBlob = globalThis.Blob;
    globalThis.Blob = class extends RealBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        captured.push(String(parts[0]));
      }
    } as unknown as typeof Blob;
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    try {
      const root = mount();
      const size = root.querySelector<HTMLSelectElement>("#export-size")!;
      // default is base M
      root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
      const mSvg = captured.pop()!;
      // switch to L and export again
      size.value = "1";
      size.dispatchEvent(new Event("change"));
      root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
      const lSvg = captured.pop()!;
      blobs.push(mSvg, lSvg);
      expect(created).toEqual(["tee-M.svg", "tee-L.svg"]);
      expect(lSvg).not.toBe(mSvg); // a larger size is genuinely different geometry
    } finally {
      globalThis.Blob = RealBlob;
    }
    expect(blobs).toHaveLength(2);
  });

  it("offers one export size per graded step, defaulting to the base", () => {
    const root = mount();
    const opts = [...root.querySelectorAll<HTMLOptionElement>("#export-size option")];
    expect(opts.map((o) => o.textContent)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(opts.find((o) => o.selected)!.textContent).toBe("M");
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
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("120");
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
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("Cotton jersey stretches");
    const stretch = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    stretch.value = "Spandex blend";
    stretch.dispatchEvent(new Event("change"));
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("negative ease");
  });

  it("graduates Output to Done only after Electron confirms the write", async () => {
    localStorage.clear();
    const saveFile = vi.fn().mockResolvedValue({ saved: true });
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      const journeyClick = (id: string): void => { root.querySelector<HTMLElement>("#" + id)!.dispatchEvent(new Event("click", { bubbles: true })); };
      journeyClick("welcome-start");
      journeyClick("journey-next");
      journeyClick("journey-next");
      journeyClick("journey-next");
      journeyClick("export-svg");
      await Promise.resolve();
      expect(root.querySelector("#journey-host")!.textContent).toContain("Tour complete");
      expect(root.querySelector("#journey-host")!.textContent).toContain("5 of 5");
      expect(root.querySelector("#journey-celebration")!.textContent).toContain("Files exported");
    } finally {
      delete window.electronAPI;
    }
  });

  it("explains and gates a knit material selected for the woven shirt", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));
    const stretch = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    stretch.value = "Spandex blend";
    stretch.dispatchEvent(new Event("change"));
    expect(root.querySelector("#stretch-host")!.textContent).toContain("Material / stretch");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
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

  it("renders the freeform editor with handles and a reset in the Edit view", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    const host = root.querySelector("#canvas-host")!;
    expect(host.querySelector("svg")).not.toBeNull();
    expect(host.innerHTML).toContain('id="editor-reset"');
    // leaving Edit clears the editor
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("editor-reset");
  });

  it("applies keyboard coordinate edits and rejects incomplete or unknown coordinates", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
    const coordinate = host.querySelector<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')!;
    const before = host.innerHTML;
    coordinate.value = String(Number(coordinate.value) + 3);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    expect(host.innerHTML).not.toBe(before);
    expect(host.querySelector<HTMLInputElement>(`input[data-editor-handle-id="${coordinate.dataset.editorHandleId}"][data-editor-axis="x"]`)!.value)
      .toBe(coordinate.value);

    host.dispatchEvent(new Event("change", { bubbles: true })); // no editor input target
    const current = host.querySelector<HTMLInputElement>('input[data-editor-coordinate]')!;
    current.value = "";
    current.dispatchEvent(new Event("change", { bubbles: true }));
    expect(current.getAttribute("aria-invalid")).toBe("true");
    expect(current.validationMessage).toContain("finite coordinate");

    const unknown = document.createElement("input");
    unknown.type = "number";
    unknown.dataset.editorCoordinate = "";
    unknown.dataset.editorHandleId = "unknown";
    unknown.dataset.editorAxis = "x";
    unknown.value = "1";
    host.appendChild(unknown);
    unknown.dispatchEvent(new Event("change", { bubbles: true }));
    expect(unknown.getAttribute("aria-invalid")).toBe("false");

    const badAxis = host.querySelector<HTMLInputElement>('input[data-editor-coordinate]')!;
    badAxis.dataset.editorAxis = "z";
    badAxis.value = "1";
    badAxis.dispatchEvent(new Event("change", { bubbles: true }));
    expect(badAxis.getAttribute("aria-invalid")).toBe("true");
  });

  it("drags a handle to reshape the front, ignores stray input, and resets", () => {
    localStorage.clear();
    // 1 cm == 1 px, origin aligned, so screen coords map straight to cm - vb.min
    const vb = editorViewBox(rolePiece(draftTshirt(STANDARD_M), "front"));
    const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
    const orig = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    try {
      const root = mount();
      const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
      // A mousedown outside Edit view does nothing.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: 5, clientY: 5, bubbles: true }));
      // A stray mousemove with no active drag does nothing (no throw).
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 5, clientY: 5 }));

      root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
      const vertex = pieceHandles(rolePiece(draftTshirt(STANDARD_M), "front")).find((h) => h.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;

      // Miss: click empty margin (>2 cm from any handle) selects nothing.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: 0.5, clientY: 0.5, bubbles: true }));
      expect(host.innerHTML).not.toContain('stroke="#FFFFFF"');

      const before = host.innerHTML;
      // Hit: grab the vertex, drag it +6 cm, release.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      expect(host.innerHTML).toContain('stroke="#FFFFFF"'); // selection ring shows
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 6, clientY: sy + 6 }));
      const dragged = host.innerHTML;
      expect(dragged).not.toBe(before); // the outline changed
      window.dispatchEvent(new MouseEvent("mouseup", {}));

      // Reset re-drafts from measurements, undoing the drag.
      host.querySelector<HTMLButtonElement>("#editor-reset")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(host.innerHTML).not.toBe(dragged);
    } finally {
      Element.prototype.getBoundingClientRect = orig;
    }
  });

  it("shows the production-readiness verdict in the Check view", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-check")!.dispatchEvent(new Event("click"));
    const html = root.querySelector("#canvas-host")!.innerHTML;
    expect(html).toContain("Digital checks pass");
    expect(html).toContain("Shoulder seam");
    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toContain("Digital checks pass");
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

describe("garment toggle", () => {
  const host = (root: HTMLElement): string => root.querySelector("#canvas-host")!.innerHTML;
  const pick = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLButtonElement>(id)!.dispatchEvent(new Event("click"));
  };

  it("swaps the Pattern view to the darted fitted front and back to the tee", () => {
    localStorage.clear();
    const root = mount();
    expect(host(root)).not.toContain('r="0.9"'); // tee front: no dart apex mark
    pick(root, "#garment-fitted");
    expect(host(root)).toContain('r="0.9"'); // fitted front: apex marked
    expect(host(root)).toContain("FITTED FRONT");
    pick(root, "#garment-tee");
    expect(host(root)).not.toContain('r="0.9"');
  });

  it("carries the garment through the Spec view (the fitted sheet reports its dart)", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-spec");
    expect(host(root)).not.toContain("Bust dart intake");
    pick(root, "#garment-fitted");
    expect(host(root)).toContain("Bust dart intake");
  });

  it("carries the garment through the Check view (the fitted report checks its dart)", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-check");
    expect(host(root)).not.toContain("Dart legs equal");
    pick(root, "#garment-fitted");
    expect(host(root)).toContain("Dart legs equal");
    expect(host(root)).toContain("Digital checks pass"); // the fitted block is sewable
  });

  it("re-snapshots the freeform editor when the garment changes", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-edit");
    const teeEditor = host(root);
    pick(root, "#garment-fitted");
    expect(host(root)).not.toBe(teeEditor); // now editing the fitted front
    expect(host(root)).toContain("editor-reset");
  });
});

describe("fabric width visibility", () => {
  it("shows the bolt-width box only in the Nesting view, where it does something", () => {
    localStorage.clear();
    const root = mount();
    const box = root.querySelector<HTMLDivElement>("#fabric-width-host")!;
    expect(box.style.display).toBe("none"); // Pattern view
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    expect(box.style.display).toBe("flex");
    root.querySelector<HTMLButtonElement>("#view-spec")!.dispatchEvent(new Event("click"));
    expect(box.style.display).toBe("none");
  });
});

describe("dart tools in the Edit view", () => {
  const pick = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLButtonElement>(id)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };
  const enterFittedEditor = (): HTMLElement => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-fitted")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    return root;
  };

  it("hides the dart tools for the undarted tee", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#dart-shoulder")).toBeNull();
  });

  it("offers transfer targets on the darted front, but truing only after a move", () => {
    const root = enterFittedEditor();
    expect(root.querySelector("#dart-shoulder")).not.toBeNull();
    expect(root.querySelector("#dart-true")).toBeNull(); // dart still splits the side
    pick(root, "#dart-shoulder");
    expect(root.querySelector("#dart-true")).not.toBeNull(); // side seam healed
  });

  it("moves the dart to the hem and reshapes the piece", () => {
    const root = enterFittedEditor();
    const before = root.querySelector("#canvas-host")!.innerHTML;
    pick(root, "#dart-hem");
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toBe(before);
    expect(root.querySelector("#dart-true")).not.toBeNull();
  });

  it("trues the healed side seam, then Reset restores the drafted front", () => {
    const root = enterFittedEditor();
    pick(root, "#dart-shoulder");
    const moved = root.querySelector("#canvas-host")!.innerHTML;
    pick(root, "#dart-true");
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toBe(moved);
    pick(root, "#editor-reset");
    // back to the drafted dart: side seam split again, so truing is unavailable
    expect(root.querySelector("#dart-true")).toBeNull();
  });

  it("ignores clicks that are not a dart tool", () => {
    const root = enterFittedEditor();
    const before = root.querySelector("#canvas-host")!.innerHTML;
    root.querySelector("#canvas-host")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(root.querySelector("#canvas-host")!.innerHTML).toBe(before);
  });
});

describe("nesting scope toggle", () => {
  it("switches the fabric view to a graded marker when Marker is clicked", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#fabric-width-host")!.textContent).toContain("Single size uses the selected size");
    const single = root.querySelector("#canvas-host svg")!.innerHTML;
    root.querySelector<HTMLButtonElement>("#nest-marker")!.dispatchEvent(new Event("click"));
    const marker = root.querySelector("#canvas-host svg")!.innerHTML;
    // the marker carries size-labelled pieces the single nest never shows
    expect(single).not.toContain("XL FRONT");
    expect(marker).toContain("XL FRONT");
    // toggling back to Single drops the size labels again
    root.querySelector<HTMLButtonElement>("#nest-single")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host svg")!.innerHTML).not.toContain("XL FRONT");
  });
});

describe("body-view measurement linking", () => {
  it("maps Tank-specific controls to their schematic dimensions and edges", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-tank")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-front")!.dispatchEvent(new Event("click"));
    for (const field of ["strapWidth", "neckDrop", "neckWidthEase"]) {
      const row = root.querySelector<HTMLElement>(`[data-dim-row="${field}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      expect(root.querySelector<SVGGElement>(`#canvas-host [data-dim="${field}"]`)!.style.opacity).toBe("1");
      expect(root.querySelector<SVGGElement>(`#canvas-host [data-edge="${field}"]`)!.style.opacity).toBe("1");
      row.dispatchEvent(new Event("mouseleave"));
    }
    root.querySelector<HTMLButtonElement>("#body-back")!.dispatchEvent(new Event("click"));
  });

  it("makes Polo options live, persisted design controls separate from measurements", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-polo")!.dispatchEvent(new Event("click"));
    const placket = root.querySelector<HTMLInputElement>('input[data-option="placketLength"]')!;
    expect(placket.value).toBe("14");
    const before = root.querySelector("#garment-host")!.innerHTML;
    placket.value = "20";
    placket.dispatchEvent(new Event("input"));
    expect(root.querySelector("#garment-host")!.innerHTML).not.toBe(before);
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.innerHTML).toContain('height="20"');
  });

  it("spotlights the Polo option's corresponding body feature", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-polo")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    for (const field of ["placketLength", "placketWidth", "standHeight", "collarLeafDepth"]) {
      const row = root.querySelector<HTMLElement>(`[data-dim-row="option-${field}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      expect(root.querySelector<SVGGElement>(`#canvas-host [data-edge="option-${field}"]`)!.style.opacity).toBe("1");
      row.dispatchEvent(new Event("mouseleave"));
    }
  });

  it("spotlights Woven options on matching assembled features", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    for (const field of ["neckEase", "buttonCount", "buttonSpacing", "frontOverlap", "placketWidth", "standHeight", "collarLeafDepth", "yokeDepth", "pocketWidth", "pocketHeight", "sleeveBandDepth", "sideVentDepth", "hemTurn"]) {
      const row = root.querySelector<HTMLElement>(`[data-dim-row="option-${field}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      expect(root.querySelector<SVGElement>(`#garment-host [data-edge="option-${field}"]`)!.style.opacity).toBe("1");
      row.dispatchEvent(new Event("mouseleave"));
    }
  });

  it("switches to the woven-shirt recipe and renders its live design details", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!.value).toBe("7");
    expect(root.querySelector("#garment-host")!.innerHTML).toContain('data-garment-detail="woven-shirt"');
    expect(root.querySelectorAll('[data-edge="woven-button"]').length).toBe(7);
    const buttonCount = root.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!;
    buttonCount.value = "6";
    buttonCount.dispatchEvent(new Event("input"));
    expect(root.querySelectorAll('[data-edge="woven-button"]').length).toBe(6);
  });

  it("keeps the woven neck measurement visible and live in Body view", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelector('#canvas-host [data-dim="neck"]')).not.toBeNull();
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Neck 40 (circ)");
    const neck = root.querySelector<HTMLInputElement>('input[data-field="neck"]')!;
    neck.value = "48";
    neck.dispatchEvent(new Event("input"));
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Neck 48 (circ)");
  });

  it("maps Woven lower measurements to both Body figures and their side seams", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-front-back")!.dispatchEvent(new Event("click"));
    for (const field of ["waist", "hip", "hipDepth"]) {
      expect(root.querySelectorAll(`#canvas-host [data-dim="${field}"]`)).toHaveLength(2);
      expect(root.querySelectorAll(`#canvas-host [data-edge="${field}"]`)).toHaveLength(2);
      const row = root.querySelector<HTMLElement>(`[data-dim-row="${field}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      expect([...root.querySelectorAll<SVGGElement>(`#canvas-host [data-dim="${field}"]`)]
        .every((g) => g.style.opacity === "1")).toBe(true);
      expect([...root.querySelectorAll<SVGGElement>('#canvas-host [data-edge="figure"]')]
        .every((g) => g.style.opacity === "0.15")).toBe(true);
      row.dispatchEvent(new Event("mouseleave"));
    }
  });

  it("runs the woven shirt through every user-facing view at the component exit", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.dispatchEvent(new Event("click"));

    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.textContent).toContain("WOVEN FRONT");

    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#canvas-host svg")).toHaveLength(2);
    root.querySelector<HTMLButtonElement>("#body-side")!.dispatchEvent(new Event("click"));
    expect(root.querySelector('#canvas-host svg[data-croquis-view="side"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#body-front-back")!.dispatchEvent(new Event("click"));

    for (const view of ["nest", "spec", "fabric", "check", "edit"] as const) {
      root.querySelector<HTMLButtonElement>(`#view-${view}`)!.dispatchEvent(new Event("click"));
      expect(root.querySelector("#canvas-host")!.innerHTML.length).toBeGreaterThan(0);
    }
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
  });

  it("spotlights the hovered measurement's dimension and fades the rest", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const chestRow = root.querySelector<HTMLElement>('[data-dim-row="chest"]')!;
    chestRow.dispatchEvent(new Event("mouseenter"));
    const groups = [...root.querySelectorAll<SVGGElement>("#canvas-host [data-dim]")];
    const chest = groups.find((g) => g.dataset.dim === "chest")!;
    const other = groups.find((g) => g.dataset.dim === "length")!;
    expect(chest.style.opacity).toBe("1");
    expect(other.style.opacity).toBe("0.15");
    // leaving restores everything
    chestRow.dispatchEvent(new Event("mouseleave"));
    expect(groups.every((g) => g.style.opacity === "1")).toBe(true);
  });

  it("keeps the spotlight after a slider change redraws the body", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLElement>('[data-dim-row="chest"]')!.dispatchEvent(new Event("mouseenter"));
    // change chest -> draw() re-renders the body SVG; the spotlight must survive
    const input = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    input.value = "104";
    input.dispatchEvent(new Event("input"));
    const groups = [...root.querySelectorAll<SVGGElement>("#canvas-host [data-dim]")];
    expect(groups.find((g) => g.dataset.dim === "chest")!.style.opacity).toBe("1");
    expect(groups.find((g) => g.dataset.dim === "length")!.style.opacity).toBe("0.15");
  });

  it("lifts the outline edges the measurement shapes, and dims the silhouette", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const chestRow = root.querySelector<HTMLElement>('[data-dim-row="chest"]')!;
    chestRow.dispatchEvent(new Event("mouseenter"));
    const edgeOf = (name: string): SVGGElement =>
      root.querySelector<SVGGElement>(`#canvas-host [data-edge="${name}"]`)!;
    expect(edgeOf("chest").style.opacity).toBe("1");   // the edges chest moves
    expect(edgeOf("length").style.opacity).toBe("0.15"); // edges it doesn't
    expect(edgeOf("figure").style.opacity).toBe("0.15"); // the body behind them
    // and the dimension line still lifts alongside its edges
    expect(root.querySelector<SVGGElement>('#canvas-host [data-dim="chest"]')!.style.opacity).toBe("1");
  });

  it("restores the silhouette and every edge on mouse leave", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const row = root.querySelector<HTMLElement>('[data-dim-row="length"]')!;
    row.dispatchEvent(new Event("mouseenter"));
    row.dispatchEvent(new Event("mouseleave"));
    const all = [...root.querySelectorAll<SVGGElement>("#canvas-host [data-edge]")];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((g) => g.style.opacity === "1")).toBe(true);
  });

  it("spotlights the outline from keyboard focus, not just hover", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const row = root.querySelector<HTMLElement>('[data-dim-row="bicep"]')!;
    row.dispatchEvent(new Event("focusin"));
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="bicep"]')!.style.opacity).toBe("1");
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="figure"]')!.style.opacity).toBe("0.15");
    row.dispatchEvent(new Event("focusout"));
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="figure"]')!.style.opacity).toBe("1");
  });

  it("keeps the outline spotlight after a slider change redraws the body", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLElement>('[data-dim-row="chest"]')!.dispatchEvent(new Event("mouseenter"));
    const input = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    input.value = "104";
    input.dispatchEvent(new Event("input"));
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="chest"]')!.style.opacity).toBe("1");
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="figure"]')!.style.opacity).toBe("0.15");
  });

  it("keeps keyboard focus spotlighted after the pointer leaves the row", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const row = root.querySelector<HTMLElement>('[data-dim-row="chest"]')!;
    row.dispatchEvent(new Event("mouseenter"));
    row.dispatchEvent(new Event("focusin"));
    row.dispatchEvent(new Event("mouseleave"));
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="chest"]')!.style.opacity).toBe("1");
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="figure"]')!.style.opacity).toBe("0.15");
    row.dispatchEvent(new Event("focusout"));
    expect(root.querySelector<SVGGElement>('#canvas-host [data-edge="figure"]')!.style.opacity).toBe("1");
  });
});

describe("measurement-plausibility surfacing (Slice 32)", () => {
  const setChest = (root: HTMLElement, v: string): void => {
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = v;
    chest.dispatchEvent(new Event("input"));
  };

  it("leaves fields un-outlined and the verdict clean for a sane body", () => {
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    expect(chest.style.outline === "" || chest.style.outline === "none").toBe(true);
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("Digital checks pass");
  });

  it("amber-outlines an implausible field and clears it when fixed", () => {
    const root = mount();
    setChest(root, "150"); // > 140 ceiling, but under the input's 160 max (no clamp)
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    expect(chest.style.outline).toContain("solid");
    // a field that is still fine does not get outlined
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    expect(length.style.outline === "" || length.style.outline === "none").toBe(true);
    // fix it → outline clears
    setChest(root, "100");
    expect(chest.style.outline === "" || chest.style.outline === "none").toBe(true);
  });

  it("switches the guidance verdict to a review count on an implausible value", () => {
    const root = mount();
    setChest(root, "150");
    expect(root.querySelector("#guidance-host")!.innerHTML).toContain("to review");
    expect(root.querySelector("#guidance-host")!.innerHTML).not.toContain("Digital checks pass");
  });

  it("withholds the green Ready banner in the check view while implausible", () => {
    const root = mount();
    setChest(root, "150");
    root.querySelector<HTMLButtonElement>("#view-check")!.dispatchEvent(new Event("click"));
    const html = root.querySelector("#canvas-host")!.innerHTML;
    expect(html).not.toContain("✓ Digital checks pass");
    expect(html).toContain("Review the flagged inputs and design guidance");
  });

  it("stops the style panel reading green while implausible", () => {
    const root = mount();
    setChest(root, "150");
    expect(root.querySelector("#style-host")!.innerHTML).not.toContain("✓ You're making");
  });
});

// ── The guided journey (F2) ───────────────────────────────────────────────────

describe("guided journey", () => {
  beforeEach(() => localStorage.clear());

  const jclick = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)!
      .dispatchEvent(new Event("click", { bubbles: true }));
  };
  const setChest = (root: HTMLElement, v: string): void => {
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = v;
    chest.dispatchEvent(new Event("input"));
  };
  const hidden = (root: HTMLElement, sel: string): boolean =>
    root.querySelector<HTMLElement>(sel)!.style.display === "none";
  const walkToOutput = (root: HTMLElement): void => {
    jclick(root, "welcome-start"); // → measure
    jclick(root, "journey-next"); // → fit
    jclick(root, "journey-next"); // → refine
    jclick(root, "journey-next"); // → output
  };
  const mockDownloads = (): void => {
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  };

  it("opens the first run on a welcome card with everything tucked away", () => {
    const root = mount();
    expect(root.querySelector("#journey-welcome")).not.toBeNull();
    expect(hidden(root, "#controls-panel")).toBe(true);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(hidden(root, "#view-toggle-host")).toBe(true);
    expect(hidden(root, "#style-host")).toBe(true);
  });

  it("starts the tour on Measure: controls appear and the body view teaches", () => {
    const root = mount();
    jclick(root, "welcome-start");
    expect(hidden(root, "#controls-panel")).toBe(false);
    expect(root.querySelector("#canvas-host")!.innerHTML).toContain("(circ)"); // body view
    expect(hidden(root, "#view-body")).toBe(false);
    expect(hidden(root, "#view-nest")).toBe(true); // advanced views stay tucked away
    expect(hidden(root, "#export-host")).toBe(true);
  });

  it("reaches Output in the five coached steps, with exports finally revealed", () => {
    const root = mount();
    walkToOutput(root);
    expect(hidden(root, "#export-host")).toBe(false);
    expect(hidden(root, "#view-nest")).toBe(false);
    expect(hidden(root, "#view-spec")).toBe(false);
    // standard measurements: plausible + on-target + checks pass, not yet exported
    expect(root.querySelector("#journey-host")!.innerHTML).toContain("4 of 5");
  });

  it("does not claim a browser download was written", () => {
    mockDownloads();
    const root = mount();
    walkToOutput(root);
    jclick(root, "export-svg");
    const journeyHtml = (): string => root.querySelector("#journey-host")!.innerHTML;
    expect(root.querySelector("#journey-celebration")).toBeNull();
    expect(journeyHtml()).toContain("4 of 5");
    expect(journeyHtml()).not.toContain("✓Files exported");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Download started");
  });

  it("never celebrates green while a measurement is implausible", () => {
    mockDownloads();
    const root = mount();
    walkToOutput(root);
    setChest(root, "160");
    jclick(root, "export-svg");
    expect(root.querySelector("#journey-celebration")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("lets an expert skip the tour and see the whole app at once", () => {
    const root = mount();
    jclick(root, "welcome-skip");
    expect(root.querySelector("#journey-welcome")).toBeNull();
    expect(hidden(root, "#export-host")).toBe(false);
    expect(hidden(root, "#view-edit")).toBe(false);
    expect(root.querySelector("#journey-host")!.innerHTML).toContain("Tour complete");
  });

  it("resumes a persisted journey where it left off", () => {
    localStorage.setItem("patternworks_journey_v1",
      JSON.stringify({ v: 1, step: "refine", exported: false }));
    const root = mount();
    expect(root.querySelector("#journey-welcome")).toBeNull();
    expect(hidden(root, "#view-check")).toBe(false); // refine unlocked Check…
    expect(hidden(root, "#view-nest")).toBe(true); // …but Size run waits for Output
    expect(hidden(root, "#export-host")).toBe(true);
  });

  it("steps back with the Back button", () => {
    const root = mount();
    jclick(root, "welcome-start"); // → measure
    jclick(root, "journey-next"); // → fit
    expect(hidden(root, "#style-host")).toBe(false);
    jclick(root, "journey-back"); // → measure again
    expect(hidden(root, "#style-host")).toBe(true);
    expect(hidden(root, "#controls-panel")).toBe(false);
  });

  it("keeps future step chips informational until graduation", () => {
    const root = mount();
    walkToOutput(root);
    jclick(root, "journey-step-measure");
    expect(root.querySelector("#journey-host")!.textContent).toContain("4 of 5");
    expect(hidden(root, "#export-host")).toBe(false);
  });

  it("returns Done to the defined Pattern landing state", () => {
    const root = mount();
    jclick(root, "welcome-skip");
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    jclick(root, "journey-step-start");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("pattern");
    expect(hidden(root, "#view-toggle-host")).toBe(true);
  });

  it("keeps the Slice-30 hover spotlight alive inside the journey", () => {
    const root = mount();
    jclick(root, "welcome-start"); // measure step renders the body view
    root.querySelector<HTMLElement>('[data-dim-row="chest"]')!
      .dispatchEvent(new Event("mouseenter"));
    const groups = [...root.querySelectorAll<SVGGElement>("#canvas-host [data-edge]")];
    expect(groups.find((g) => g.dataset.edge === "chest")!.style.opacity).toBe("1");
    expect(groups.find((g) => g.dataset.edge === "figure")!.style.opacity).toBe("0.15");
  });
});

describe("switching to the skirt (Slice 38)", () => {
  it("swaps the measurement controls to the skirt's fields", () => {
    const root = mount();
    // tee shows chest + sleeve, not waist
    expect(root.querySelector('input[data-field="chest"]')).not.toBeNull();
    expect(root.querySelector('input[data-field="waist"]')).toBeNull();

    root.querySelector<HTMLButtonElement>("#garment-skirt")!.dispatchEvent(new Event("click"));

    // skirt shows waist + hip, not chest/sleeve
    expect(root.querySelector('input[data-field="waist"]')).not.toBeNull();
    expect(root.querySelector('input[data-field="hip"]')).not.toBeNull();
    expect(root.querySelector('input[data-field="chest"]')).toBeNull();
    expect(root.querySelector('input[data-field="sleeveLength"]')).toBeNull();
  });

  it("keeps the re-rendered skirt inputs live (listeners re-wired)", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-skirt")!.dispatchEvent(new Event("click"));
    const before = root.querySelector("#canvas-host")!.innerHTML;
    const waist = root.querySelector<HTMLInputElement>('input[data-field="waist"]')!;
    waist.value = "78";
    waist.dispatchEvent(new Event("input"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toBe(before); // redrew
  });

  it("draws the skirt in both the assembled view and the body view (Slice 40)", () => {
    const root = mount();
    // tee assembled view has a neckline curve (Slice 61: real necklineEdge()
    // geometry, cubic "C" commands — no longer the old placeholder "Q")
    expect(root.querySelector("#garment-host")!.innerHTML).toMatch(/C /);

    root.querySelector<HTMLButtonElement>("#garment-skirt")!.dispatchEvent(new Event("click"));

    // assembled view is now a skirt: FRONT/BACK panels, no tee neckline
    const assembled = root.querySelector("#garment-host")!.innerHTML;
    expect(assembled).toContain(">FRONT<");
    expect(assembled).not.toMatch(/C /);

    // the style panel offers the skirt's own presets (Slice 39)
    expect(root.querySelector("#style-host")!.innerHTML).toContain("skirt");

    // the body view now draws the annotated skirt figure, not a placeholder
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    const body = root.querySelector("#canvas-host")!.innerHTML;
    expect(body).not.toContain("isn't available");
    expect(body).toContain('data-dim="waist"');
  });
});

describe("skirt styles are selectable (Slice 39)", () => {
  it("populates the target dropdown with skirt styles and switches target", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-skirt")!.dispatchEvent(new Event("click"));
    const sel = root.querySelector<HTMLSelectElement>("#style-target")!;
    const opts = [...sel.options].map((o) => o.textContent);
    expect(opts).toContain("Midi skirt");
    expect(opts.join(" ")).not.toContain("tee");
  });
});

describe("switching to the trouser recipe (Slice 100)", () => {
  beforeEach(() => localStorage.clear());

  it("routes all six export buttons through the live trouser recipe and picked size", () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });

    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.dispatchEvent(new Event("click"));
    const material = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    material.value = "Cotton woven";
    material.dispatchEvent(new Event("change"));
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    size.value = "1";
    size.dispatchEvent(new Event("change"));

    for (const id of ["#export-svg", "#export-dxf", "#export-pdf", "#export-techpack", "#export-projector", "#export-a0"]) {
      expect(root.querySelector<HTMLButtonElement>(id)!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>(id)!.dispatchEvent(new Event("click"));
    }

    expect(created).toEqual([
      "trouser-L.svg",
      "trouser-L.dxf",
      "trouser-L.pdf",
      "trouser-techpack.pdf",
      "trouser-projector.svg",
      "trouser-L-A0.pdf",
    ]);
  });

  it("routes the registered lower-body recipe through controls, views, and Edit", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.dispatchEvent(new Event("click"));

    expect(root.querySelector('input[data-field="chest"]')).toBeNull();
    for (const field of ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"]) {
      expect(root.querySelector(`input[data-field="${field}"]`)).not.toBeNull();
    }
    expect(root.querySelectorAll("input[data-option]")).toHaveLength(11);
    expect(root.querySelector('[data-finished="waist"]')).not.toBeNull();
    expect(root.querySelector('[data-finished="hip"]')).not.toBeNull();
    expect(root.querySelector('#garment-host svg[data-garment="trouser"]')).not.toBeNull();
    expect(root.querySelector("#style-host")!.textContent).toContain("straight trouser");

    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLElement>("#body-croquis-toggle-host")!.style.display).toBe("flex");
    expect(root.querySelectorAll("#canvas-host svg")).toHaveLength(2);
    expect(root.querySelector('[data-dim="crotchDepth"]')).not.toBeNull();
    expect(root.querySelector('[data-edge="option-frontRiseEase"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>("#body-back")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#canvas-host svg")).toHaveLength(1);
    expect(root.querySelector('[data-edge="option-backRiseEase"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#body-side")!.dispatchEvent(new Event("click"));
    expect(root.querySelector('#canvas-host svg[data-croquis-view="side"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>("#view-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host")!.textContent).toContain("TROUSER FRONT LEFT");
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    expect(root.querySelector('[data-editor-contract="preview-only"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#garment-tee")!.dispatchEvent(new Event("click"));
  });

  it("keeps option and measurement changes live in the shared draft-backed previews", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.dispatchEvent(new Event("click"));
    const before = root.querySelector("#garment-host")!.innerHTML;
    const legOpening = root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')!;
    legOpening.value = "48";
    legOpening.dispatchEvent(new Event("input"));
    expect(root.querySelector("#garment-host")!.innerHTML).not.toBe(before);

    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-front")!.dispatchEvent(new Event("click"));
    const bodyBefore = root.querySelector("#canvas-host")!.innerHTML;
    const inseam = root.querySelector<HTMLInputElement>('input[data-field="inseam"]')!;
    inseam.value = "90";
    inseam.dispatchEvent(new Event("input"));
    expect(root.querySelector("#canvas-host")!.innerHTML).not.toBe(bodyBefore);
    expect(root.querySelector('[data-dim="inseam"]')).not.toBeNull();
  });

  it("pauses invalid trouser options, reports material incompatibility, and restores saved state", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.dispatchEvent(new Event("click"));
    const angle = root.querySelector<HTMLInputElement>('input[data-option="pocketAngle"]')!;
    angle.value = "99";
    angle.dispatchEvent(new Event("input"));
    expect(angle.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Draft paused");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

    angle.value = "58";
    angle.dispatchEvent(new Event("input"));
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    const material = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    material.value = "Cotton jersey";
    material.dispatchEvent(new Event("change"));
    expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

    material.value = "Cotton woven";
    material.dispatchEvent(new Event("change"));
    const drop = root.querySelector<HTMLInputElement>('input[data-option="pocketDrop"]')!;
    drop.value = "5";
    drop.dispatchEvent(new Event("input"));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));
    expect(localStorage.getItem("patternworks_save_v1")).toContain('"trouser"');

    root.querySelector<HTMLButtonElement>("#garment-tee")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLButtonElement>("#garment-trouser")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLInputElement>('input[data-option="pocketDrop"]')!.value).toBe("5");
  });
});
