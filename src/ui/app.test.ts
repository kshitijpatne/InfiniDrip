// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { mountApp } from "./app";
import { draftTshirt, STANDARD_M } from "../drafting";
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
    expect(created).toEqual(["tee-M.svg", "tee-M.dxf", "tee-M.pdf"]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
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

  it("drags a handle to reshape the front, ignores stray input, and resets", () => {
    localStorage.clear();
    // 1 cm == 1 px, origin aligned, so screen coords map straight to cm - vb.min
    const vb = editorViewBox(draftTshirt(STANDARD_M).front);
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
      const vertex = pieceHandles(draftTshirt(STANDARD_M).front).find((h) => h.kind === "vertex")!;
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
    expect(host(root)).toContain("Ready to cut"); // the fitted block is sewable
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
