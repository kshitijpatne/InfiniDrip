// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { mountApp, unmountApp } from "./app";

import { TANK } from "../drafting";

import { TANK_RACERBACK_BACK_CUT_IN_OPTION_ID, TANK_RACERBACK_ENTRY_ID } from "../drafting/tank";

function mount(options: Parameters<typeof mountApp>[1] = {}): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root, options);
  mountedRoots.add(root);
  return root;
}

type TrackedWindowListener = {
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
};

const mountedRoots = new Set<HTMLDivElement>();

const trackedWindowListeners: TrackedWindowListener[] = [];

const addNativeWindowListener = window.addEventListener.bind(window);

const removeNativeWindowListener = window.removeEventListener.bind(window);

const viewBox = (root: HTMLElement): string => root.querySelector("#canvas-host svg")!.getAttribute("viewBox")!;

const clickId = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)!.click();
};

const clickIfPresent = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)?.click();
};

beforeEach(() => {
  trackedWindowListeners.length = 0;
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    trackedWindowListeners.push({ type, listener, options });
    addNativeWindowListener(type, listener, options);
  });
});

afterEach(() => {
  unmountApp();
  for (const { type, listener, options } of trackedWindowListeners) {
    removeNativeWindowListener(type, listener, options);
  }
  trackedWindowListeners.length = 0;
  for (const root of mountedRoots) root.remove();
  mountedRoots.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});



describe("nesting scope toggle", () => {
  it("uses the selected export size for the Single size nest", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    const before = viewBox(root);
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    size.value = "1";
    size.dispatchEvent(new Event("change"));
    expect(root.querySelector("#nest-selected-size")!.textContent).toBe("L");
    expect(viewBox(root)).not.toBe(before);
  });

  it("switches the fabric view to a graded marker when Marker is clicked", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#fabric-width-host")!.textContent).toContain("Single size uses M");
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
  it("renders the N03 cut-in in the Body back view while leaving the front unchanged", () => {
    const root = mount();
    const originalTankOptions = TANK.options;
    const mutableTank = TANK as unknown as { options?: typeof TANK.options };
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${TANK_RACERBACK_ENTRY_ID}`);
      clickId(root, "view-body");
      clickId(root, "body-back");
      const backAtDefault = root.querySelector("#canvas-host svg")!.outerHTML;
      const armholeGeometry = (svg: string): string[] => [...svg.matchAll(/<g data-edge="armholeDepth"[^>]*>[\s\S]*?<\/g>/g)]
        .map((match) => match[0]!.replace(/\sstyle="[^"]*"/g, ""));
      const defaultBackArmhole = armholeGeometry(backAtDefault);
      const setCutIn = (value: string): void => {
        const option = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
        option.value = value;
        option.dispatchEvent(new Event("input", { bubbles: true }));
      };
      setCutIn("6");
      const backAtMaximum = root.querySelector("#canvas-host svg")!.outerHTML;
      expect(armholeGeometry(backAtMaximum)).not.toEqual(defaultBackArmhole);

      clickId(root, "body-back");
      setCutIn("0");
      const backAtZero = armholeGeometry(root.querySelector("#canvas-host svg")!.outerHTML);
      clickId(root, "body-front");
      const frontAtMaximum = armholeGeometry(root.querySelector("#canvas-host svg")!.outerHTML);
      setCutIn("0");
      expect(armholeGeometry(root.querySelector("#canvas-host svg")!.outerHTML)).toEqual(frontAtMaximum);

      // If a saved recipe is missing the N03-only option definition, the Body
      // view keeps rendering with the documented zero-shift fallback.
      mutableTank.options = [];
      clickId(root, "body-back");
      expect(armholeGeometry(root.querySelector("#canvas-host svg")!.outerHTML)).toEqual(backAtZero);
    } finally {
      mutableTank.options = originalTankOptions;
      root.remove();
      localStorage.clear();
    }
  });

  it("keeps Edit source initialization usable when a recipe has no option definitions", () => {
    const root = mount();
    const originalTankOptions = TANK.options;
    const mutableTank = TANK as unknown as { options?: typeof TANK.options };
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${TANK_RACERBACK_ENTRY_ID}`);
      mutableTank.options = undefined;
      clickId(root, "view-edit");
      expect(root.querySelector("#editor-role")).not.toBeNull();
      expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    } finally {
      mutableTank.options = originalTankOptions;
      root.remove();
      localStorage.clear();
    }
  });

  it("uses the registered N03 option label in its spatial cue", () => {
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${TANK_RACERBACK_ENTRY_ID}`);
      clickId(root, "view-body");
      const row = root.querySelector<HTMLElement>(`[data-dim-row="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      const cue = root.querySelector<HTMLElement>("#spatial-cue-text")!.textContent!;
      expect(cue).toContain("Back armhole cut-in (digital)");
      expect(cue).not.toContain("tank racerback back cut in");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("uses a readable fallback when the N03 option label is unavailable", () => {
    const root = mount();
    const definition = TANK.options?.find((option) => option.id === TANK_RACERBACK_BACK_CUT_IN_OPTION_ID);
    expect(definition).toBeDefined();
    const originalLabel = definition!.label;
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${TANK_RACERBACK_ENTRY_ID}`);
      clickId(root, "view-body");
      (definition as { label?: string }).label = undefined;
      const row = root.querySelector<HTMLElement>(`[data-dim-row="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      const cue = root.querySelector<HTMLElement>("#spatial-cue-text")!.textContent!;
      expect(cue).toContain("tank racerback back cut in cm");
      expect(cue).not.toContain(TANK_RACERBACK_BACK_CUT_IN_OPTION_ID);
    } finally {
      (definition as { label: string }).label = originalLabel;
      root.remove();
      localStorage.clear();
    }
  });

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
    for (const field of ["placketLength", "placketWidth", "standHeight", "collarLeafDepth", "standFrontRise", "collarPointExtension", "sideVentDepth", "backHemDrop"]) {
      const row = root.querySelector<HTMLElement>(`[data-dim-row="option-${field}"]`)!;
      row.dispatchEvent(new Event("mouseenter"));
      expect(root.querySelector<SVGGElement>(`#canvas-host [data-edge="option-${field}"]`)!.style.opacity).toBe("1");
      row.dispatchEvent(new Event("mouseleave"));
    }
    expect(root.querySelectorAll('#garment-host [data-garment-detail="polo"][data-position="front"]').length).toBe(1);
    expect(root.querySelectorAll('#garment-host [data-garment-detail="polo"][data-position="back"]').length).toBe(1);
    expect(root.querySelector('#garment-host [data-edge="option-sideVentDepth"]')).not.toBeNull();
    expect(root.querySelector('#garment-host [data-edge="option-backHemDrop"]')).not.toBeNull();
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

  it("offers an honest Assembled route when the active Body view has no target", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "garment-woven-shirt");
    clickId(root, "view-body");
    const row = root.querySelector<HTMLElement>('[data-dim-row="option-pocketWidth"]')!;
    row.dispatchEvent(new Event("mouseenter"));
    expect(root.querySelector<HTMLElement>("#spatial-cue")!.hidden).toBe(false);
    expect(root.querySelector("#spatial-cue-text")!.textContent).toContain("highlighted in Assembled");
    expect(root.querySelector<HTMLButtonElement>("#spatial-cue-action")!.hidden).toBe(false);
    clickId(root, "spatial-cue-action");
    expect(root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#inspection-title")!.textContent).toContain("Assembled preview");
    clickId(root, "assembled-preview-toggle");
    row.dispatchEvent(new Event("mouseleave"));
    expect(root.querySelector<HTMLElement>("#spatial-cue")!.hidden).toBe(true);
  });

  it("anchors a warning to its visible target and carries a dismissal into Check", () => {
    const root = mount();
    clickId(root, "view-body");
    const box = (left: number, top: number, width: number, height: number): DOMRect =>
      ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.id === "canvas-inspection") return box(0, 0, 900, 700);
      if (this.id === "inspection-viewport") return box(10, 40, 880, 640);
      if (this.classList.contains("spatial-guidance-note")) {
        return box(Number.parseFloat(this.style.left) || 0, Number.parseFloat(this.style.top) || 0, 230, 92);
      }
      return box(0, 0, 0, 0);
    });
    vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue(box(420, 250, 24, 180));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "150";
    chest.dispatchEvent(new Event("input"));
    expect(root.querySelector<HTMLElement>('.spatial-guidance-note[data-guidance-field="chest"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('#spatial-guidance-host [data-ignore-guidance="chest"]')!.click();
    expect(root.querySelector('.spatial-guidance-note[data-guidance-field="chest"]')).toBeNull();
    expect(root.querySelector('[data-guidance-field="chest"][data-guidance-ignored]')).not.toBeNull();
    const canvasRestore = document.createElement("button");
    canvasRestore.dataset.restoreGuidance = "chest";
    root.querySelector("#canvas-host")!.append(canvasRestore);
    canvasRestore.click();
    expect(root.querySelector<HTMLElement>('.spatial-guidance-note[data-guidance-field="chest"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('#spatial-guidance-host [data-ignore-guidance="chest"]')!.click();
    clickId(root, "view-check");
    expect(root.querySelector('[data-ignored-guidance-field="chest"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[data-restore-guidance="chest"]')!.click();
    expect(root.querySelector('[data-ignored-guidance-field="chest"]')).toBeNull();
    chest.value = "100";
    chest.dispatchEvent(new Event("input"));
    expect(root.querySelector('[data-guidance-field="chest"][data-guidance-ignored]')).toBeNull();
  });

  it("handles spatial guidance geometry fallbacks and missing overlay hosts", () => {
    localStorage.clear();
    const missingHost = mount();
    missingHost.querySelector("#spatial-guidance-host")!.remove();
    const missingChest = missingHost.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    missingChest.value = "150";
    missingChest.dispatchEvent(new Event("input"));

    const root = mount();
    clickIfPresent(root, "welcome-skip");
    clickId(root, "garment-woven-shirt");
    clickId(root, "journey-step-fit");
    const setInput = (selector: string, value: number): void => {
      const input = root.querySelector<HTMLInputElement>(selector)!;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setInput('input[data-field="neck"]', 70);
    setInput('input[data-field="shoulderWidth"]', 30);
    setInput('input[data-field="length"]', 60);
    setInput('input[data-field="armholeDepth"]', 12);
    setInput('input[data-field="ease"]', 4);
    setInput('[data-option="buttonSpacing"]', 9);
    setInput('[data-option="buttonCount"]', 6.5);
    setInput('[data-option="frontOverlap"]', 3);
    setInput('[data-option="placketWidth"]', 2);
    setInput('[data-option="standHeight"]', 3.5);
    setInput('[data-option="collarLeafDepth"]', 4);
    setInput('[data-option="yokeDepth"]', 12);
    const stretch = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    stretch.value = "Cotton jersey";

    const box = (left: number, top: number, width: number, height: number): DOMRect =>
      ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect);
    let mode: "normal" | "zero-target" | "zero-viewport" = "normal";
    const htmlRect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.id === "canvas-inspection") return box(0, 0, 900, 700);
      if (this.id === "inspection-viewport") {
        return mode === "zero-viewport" ? box(30, 40, 0, 0) : box(10, 40, 880, 640);
      }
      if (this.classList.contains("spatial-guidance-note")) {
        const left = Number.parseFloat(this.style.left) || 0;
        const top = Number.parseFloat(this.style.top) || 0;
        return mode === "zero-viewport" ? box(left, top, 0, 0) : box(left, top, 230, 92);
      }
      return box(0, 0, 0, 0);
    });
    const svgRect = vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(() =>
      mode === "zero-target" ? box(0, 0, 0, 0)
        : mode === "zero-viewport" ? box(30, 40, 10, 20)
          : box(420, 250, 24, 180));
    try {
      stretch.dispatchEvent(new Event("change", { bubbles: true }));
      clickId(root, "assembled-preview-toggle");
      expect(root.querySelector<HTMLElement>(".spatial-guidance-more")?.textContent).toContain("more in Guidance");
      mode = "zero-target";
      stretch.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelectorAll(".spatial-guidance-note")).toHaveLength(0);
      mode = "zero-viewport";
      stretch.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelectorAll(".spatial-guidance-note").length).toBeGreaterThan(0);
    } finally {
      htmlRect.mockRestore();
      svgRect.mockRestore();
    }
  });

  it("blocks Check-to-Export when a reviewed style has a material warning", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-skip");
    clickId(root, "garment-woven-shirt");
    clickId(root, "journey-step-fit");
    const stretch = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    stretch.value = "Cotton jersey";
    stretch.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
    expect(root.querySelector("#journey-blocker")!.textContent).toContain("stable woven material");
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
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
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
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
