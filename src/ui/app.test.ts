// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountApp, stageBlockerFromNote } from "./app";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";
import type { InspectedArtworkFile } from "../surface/artwork-file";
import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";
import { GARMENTS, STANDARD_M, draftTshirt, rolePiece } from "../drafting";
import { pieceHandles, editorViewBox } from "../edit";
import { loadJourney } from "./journey";
import { PATTERN_MEASUREMENT_MAP, type PatternMeasurementDefinition, type PatternMeasurementField } from "./pattern-measurements";

const mutablePatternMeasurementMap = PATTERN_MEASUREMENT_MAP as unknown as
  Record<string, Record<string, PatternMeasurementDefinition>>;

function mount(): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root);
  return root;
}
const viewBox = (root: HTMLElement): string =>
  root.querySelector("#canvas-host svg")!.getAttribute("viewBox")!;
const clickId = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)!.click();
};
const clickIfPresent = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)?.click();
};
/** Navigate the real reviewed path used by export-writer tests. */
const reachExportStage = (root: HTMLElement): void => {
  clickIfPresent(root, "welcome-start");
  clickId(root, "journey-step-fit");
  clickId(root, "journey-next"); // accept the current Style choices → Check
  clickId(root, "journey-next"); // reviewed Check → Export
};

describe("mountApp", () => {
  it("routes warning notes through explicit stage blocker fallbacks", () => {
    expect(stageBlockerFromNote(undefined)).toEqual({
      message: "Review the flagged digital checks.", step: "refine",
    });
    expect(stageBlockerFromNote({ level: "warn", text: "Review the style." })).toEqual({
      message: "Review the style.", step: "refine",
    });
    expect(stageBlockerFromNote({ level: "warn", text: "Adjust ease.", field: "ease" })).toEqual({
      message: "Adjust ease.", step: "fit", field: "ease",
    });
  });

  it("draws the canvas and the garment on mount", () => {
    const root = mount();
    expect(root.querySelector("h1#product-title")!.textContent).toBe("InfiniDrip");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#pattern-annotation-key")).not.toBeNull();
    expect(root.querySelector("#analysis-host svg text")).toBeNull();
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(true);
  });

  it("keeps every garment's Pattern labels and instructions in a piece-grouped key", () => {
    localStorage.clear();
    const root = mount();
    for (let index = 0; index < 7; index += 1) {
      root.querySelectorAll<HTMLButtonElement>(".garment-card")[index].click();
      const key = root.querySelector<HTMLElement>("#pattern-annotation-key")!;
      expect(key.querySelectorAll(".pattern-piece-key-item").length).toBeGreaterThan(0);
      expect(key.querySelector(".pattern-piece-key-heading")!.textContent).toContain("01");
      expect(key.querySelectorAll("button[data-pattern-piece-index]")).toHaveLength(
        key.querySelectorAll(".pattern-piece-key-item").length,
      );
      expect(root.querySelectorAll("#analysis-host svg g.pattern-block-control")).toHaveLength(
        key.querySelectorAll(".pattern-piece-key-item").length,
      );
      expect(root.querySelector("#analysis-host svg text")).toBeNull();
    }
    clickId(root, "view-body");
    expect(root.querySelector("#pattern-annotation-key")).toBeNull();
  });

  it("lays out the Pattern key beside wide canvases and below narrow canvases", () => {
    localStorage.clear();
    const root = mount();
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 1000 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 360 });
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="fit"]')!.click();
    expect(root.querySelector<HTMLElement>("#analysis-host")!.style.display).toBe("grid");
    expect(root.querySelector<HTMLElement>("#analysis-host")!.style.gridTemplateColumns).toContain("350px");
    expect(root.querySelector<HTMLElement>("#pattern-annotation-key")!.style.overflowY).toBe("auto");

    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 600 });
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="fit"]')!.click();
    expect(root.querySelector<HTMLElement>("#analysis-host")!.style.gridTemplateColumns).toContain("1fr");
    expect(root.querySelector<HTMLElement>("#pattern-annotation-key")!.style.overflowY).toBe("visible");

    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 480 });
    root.querySelector<HTMLButtonElement>('button[data-inspection-zoom="fit"]')!.click();
    expect(root.querySelector<HTMLElement>("#analysis-host")!.style.gridTemplateColumns).toContain("1fr");
  });

  it("starts a fresh Tee workspace with a knit-appropriate material", () => {
    localStorage.clear();
    const root = mount();
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
  });

  it("replaces the active canvas with Assembled, then returns to the same view", () => {
    const root = mount();
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLElement>("#analysis-host")!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
    expect(root.querySelector("#inspection-title")!.textContent).toContain("Assembled preview");
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.getAttribute("aria-pressed")).toBe("false");
    expect(root.querySelector<HTMLElement>("#analysis-host")!.hidden).toBe(false);
    expect(root.querySelector("#inspection-title")!.textContent).toBe("Pattern inspection");
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
    minus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    minus.dispatchEvent(new Event("click", { bubbles: true }));
    expect(chest.value).toBe("60");

    // Defensive delegation paths: a stable root can receive unrelated or
    // malformed controls without turning them into measurement changes.
    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    const orphan = document.createElement("span");
    orphan.dataset.rangeControl = "orphan";
    root.append(orphan);
    chest.dispatchEvent(new Event("input")); // syncRangeIndicators skips it
    const orphanButton = document.createElement("button");
    orphanButton.type = "button";
    orphanButton.dataset.stepDirection = "1";
    root.append(orphanButton);
    orphanButton.dispatchEvent(new Event("click", { bubbles: true }));
    const anonymous = document.createElement("span");
    anonymous.dataset.rangeControl = "anonymous";
    anonymous.dataset.rangeStep = "1";
    const anonymousInput = document.createElement("input");
    anonymousInput.type = "number";
    anonymousInput.value = "1";
    const anonymousButton = document.createElement("button");
    anonymousButton.type = "button";
    anonymousButton.dataset.stepDirection = "1";
    anonymous.append(anonymousInput, anonymousButton);
    root.append(anonymous);
    anonymousButton.dispatchEvent(new Event("click", { bubbles: true }));
    expect(anonymousInput.value).toBe("2"); // no id uses the existing input for focus
    const malformed = document.createElement("span");
    malformed.dataset.rangeControl = "malformed";
    malformed.dataset.rangeStep = "not-a-step";
    const malformedInput = document.createElement("input");
    malformedInput.type = "number";
    const malformedButton = document.createElement("button");
    malformedButton.type = "button";
    malformedButton.dataset.stepDirection = "1";
    malformed.append(malformedInput, malformedButton);
    root.append(malformed);
    malformedButton.dispatchEvent(new Event("pointerdown", { bubbles: true }));

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

      plus.setAttribute("data-step-target", "chest");
      chest.value = "100";
      chest.dispatchEvent(new Event("input"));
      plus.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      plus.removeAttribute("data-step-target");
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(80); // a redraw can remove the replacement button; current is retained
      window.dispatchEvent(new Event("pointerup"));
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

  it("opens the contextual appearance editor and updates color, texture, and shine", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    clickId(root, "appearance-toggle");
    expect(root.querySelector<HTMLElement>("#appearance-editor")!.hidden).toBe(false);
    const hex = root.querySelector<HTMLInputElement>("#appearance-hex")!;
    hex.value = "#112233";
    hex.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#garment-host svg")!.innerHTML).toContain('fill="#112233"');
    root.querySelector<HTMLButtonElement>('[data-texture="woven"]')!.click();
    expect(root.querySelector("#garment-host svg")!.innerHTML).toContain("url(#appearance-texture)");
    const shine = root.querySelector<HTMLInputElement>("#appearance-shine")!;
    shine.value = "60";
    shine.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#garment-host svg")!.innerHTML).toContain("url(#appearance-sheen)");
    expect(root.querySelector<HTMLElement>("#appearance-shine-output")!.textContent).toBe("60%");
    const wheel = root.querySelector<HTMLElement>("#appearance-wheel")!;
    const beforeWheel = root.querySelector<HTMLElement>("#appearance-readout")!.textContent;
    wheel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(root.querySelector<HTMLElement>("#appearance-readout")!.textContent).not.toBe(beforeWheel);
  });

  it("covers native appearance controls, wheel pointer input, and ignored keys", () => {
    localStorage.clear();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    try {
      const root = mount();
      clickId(root, "welcome-skip");
      clickId(root, "journey-step-fit");
      clickId(root, "appearance-toggle");
      expect(scrollIntoView).toHaveBeenCalled();
      const hex = root.querySelector<HTMLInputElement>("#appearance-hex")!;
      hex.value = "#1234";
      hex.dispatchEvent(new Event("input", { bubbles: true }));
      hex.value = "#ABCDEF";
      hex.dispatchEvent(new Event("input", { bubbles: true }));
      const native = root.querySelector<HTMLInputElement>("#appearance-color-native")!;
      native.value = "#224466";
      native.dispatchEvent(new Event("input", { bubbles: true }));
      const lightness = root.querySelector<HTMLInputElement>("#appearance-lightness")!;
      lightness.value = "65";
      lightness.dispatchEvent(new Event("input", { bubbles: true }));
      const shine = root.querySelector<HTMLInputElement>("#appearance-shine")!;
      shine.value = "bad";
      shine.dispatchEvent(new Event("input", { bubbles: true }));
      const wheel = root.querySelector<HTMLElement>("#appearance-wheel")!;
      wheel.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0 }));
      vi.spyOn(wheel, "getBoundingClientRect").mockReturnValue({ left: 10, top: 10, right: 210, bottom: 210, width: 200, height: 200, x: 10, y: 10, toJSON: () => ({}) } as DOMRect);
      wheel.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 180, clientY: 100 }));
      wheel.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, buttons: 1, clientX: 160, clientY: 120 }));
      for (const key of ["ArrowLeft", "ArrowUp", "ArrowDown", "Escape"]) {
        wheel.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      }
      hex.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      expect(root.querySelector<HTMLInputElement>("#appearance-hex")!.value).toMatch(/^#[0-9A-F]{6}$/);
    } finally {
      delete (HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
      vi.restoreAllMocks();
    }
  });

  it("rejects an incomplete exact color without changing the live preview", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    const before = root.querySelector("#garment-host svg")!.innerHTML;
    clickId(root, "appearance-toggle");
    const hex = root.querySelector<HTMLInputElement>("#appearance-hex")!;
    hex.value = "#1234";
    hex.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#garment-host svg")!.innerHTML).toBe(before);
    expect(root.querySelector("#appearance-hex-status")!.textContent).toContain("#RRGGBB");
    expect(hex.validationMessage).toContain("six-digit");
  });

  it("round-trips appearance choices through the existing local workspace save", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    clickId(root, "appearance-toggle");
    const hex = root.querySelector<HTMLInputElement>("#appearance-hex")!;
    hex.value = "#456789";
    hex.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-texture="rib"]')!.click();
    const shine = root.querySelector<HTMLInputElement>("#appearance-shine")!;
    shine.value = "35";
    shine.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "save-pattern");
    hex.value = "#AABBCC";
    hex.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(root.querySelector<HTMLInputElement>("#appearance-hex")!.value).toBe("#456789");
    expect(root.querySelector<HTMLButtonElement>('[data-texture="rib"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLInputElement>("#appearance-shine")!.value).toBe("35");
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

  it("handles inspector menus, missing guidance targets, and preview spotlights safely", () => {
    localStorage.clear();
    const root = mount();
    const row = root.querySelector<HTMLElement>('[data-dim-row="chest"]')!;
    row.dispatchEvent(new Event("mouseenter"));
    clickId(root, "assembled-preview-toggle");
    row.dispatchEvent(new Event("mouseenter"));
    clickId(root, "assembled-preview-toggle");
    const unknownRow = document.createElement("div");
    unknownRow.dataset.dimRow = "mystery";
    root.append(unknownRow);
    clickId(root, "garment-tee");
    unknownRow.dispatchEvent(new Event("mouseenter"));

    const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views")!;
    advanced.open = true;
    clickId(root, "view-nest");
    advanced.open = true;
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    root.querySelector<HTMLElement>("#style-host")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-style-target="Classic tee"]')!.click();
    root.querySelector<HTMLElement>("#stretch-host")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();

    const missingFocus = document.createElement("button");
    missingFocus.dataset.guidanceFocus = "missing";
    root.querySelector("#guidance-host")!.append(missingFocus);
    missingFocus.click();
    const missingCorrection = document.createElement("button");
    missingCorrection.id = "journey-correction";
    missingCorrection.dataset.correctionStep = "measure";
    root.append(missingCorrection);
    missingCorrection.click();
    const outsideMenu = document.createElement("button");
    outsideMenu.id = "outside-menu";
    root.append(outsideMenu);
    advanced.open = true;
    outsideMenu.click();
    const emptyIgnore = document.createElement("button");
    emptyIgnore.dataset.ignoreGuidance = "";
    root.querySelector("#canvas-host")!.append(emptyIgnore);
    emptyIgnore.click();
    const emptyRestore = document.createElement("button");
    emptyRestore.dataset.restoreGuidance = "";
    root.querySelector("#canvas-host")!.append(emptyRestore);
    emptyRestore.click();
    root.querySelector<HTMLButtonElement>("#journey-step-output")!.dispatchEvent(new Event("click", { bubbles: true }));

    const invalid = mount();
    clickIfPresent(invalid, "welcome-skip");
    clickId(invalid, "garment-woven-shirt");
    const option = invalid.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
    option.value = "6.5";
    option.dispatchEvent(new Event("input"));
    clickId(invalid, "journey-step-fit");
    clickId(invalid, "journey-next");
    expect(invalid.querySelector("#journey-host")!.textContent).toContain("Current stage: 4 Check");
  });

  it("routes a field-backed journey correction to its input", () => {
    localStorage.clear();
    const root = mount();
    document.body.append(root);
    clickIfPresent(root, "welcome-skip");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "";
    chest.dispatchEvent(new Event("input"));
    clickId(root, "journey-step-fit");
    root.querySelector<HTMLButtonElement>("#journey-correction")!.click();
    expect(document.activeElement).toBe(root.querySelector('input[data-field="chest"]'));
    root.remove();
  });

  it("supports readable single-figure body focus and bounded zoom", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#body-front")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(1);
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
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(1);
    expect(root.querySelector<HTMLButtonElement>("#body-back")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#inspection-content svg")!.getAttribute("aria-label")).toContain("Body figure inspection");

    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 600 });
    root.querySelector<HTMLElement>("#analysis-host")!.innerHTML = '<svg viewBox="0 0 100 100"></svg>';
    window.dispatchEvent(new Event("resize"));
    expect(root.querySelector<SVGSVGElement>("#analysis-host svg")!.style.width).toBe("520px");
    expect(root.querySelector<SVGSVGElement>("#analysis-host svg")!.style.height).toBe("520px");

    root.querySelector<HTMLElement>("#inspection-title")!.remove();
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 16 });
    root.querySelector<HTMLElement>("#analysis-host")!.innerHTML = '<svg viewBox="0 0 0 100"></svg>';
    window.dispatchEvent(new Event("resize"));
    root.querySelector<HTMLElement>("#analysis-host")!.innerHTML = "<svg></svg>";
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
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
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
    reachExportStage(root);
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
      reachExportStage(root);
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
      const root = mount();
      reachExportStage(root);
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
    reachExportStage(root);
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
    reachExportStage(root);
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
    reachExportStage(root);
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
      reachExportStage(root);
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

  it("Save writes to localStorage and Load protects unsaved edits before restoring", () => {
    localStorage.clear();
    const root = mount();
    // Change a measurement then save
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input"));
    const savedCanvas = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    root.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("120");

    // Reset to default and verify it's different
    const currentChest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    currentChest.value = "100";
    currentChest.dispatchEvent(new Event("input"));
    const resetCanvas = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    expect(resetCanvas).not.toBe(savedCanvas);

    // A dirty workspace must ask before replacing the current edit.
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    const confirmation = root.querySelector<HTMLElement>("#workspace-confirm")!;
    expect(confirmation.hidden).toBe(false);
    root.querySelector<HTMLButtonElement>("#workspace-confirm-cancel")!.click();
    expect(confirmation.hidden).toBe(true);
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("100");

    // Accepting the same request restores the saved state.
    root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
    root.querySelector<HTMLButtonElement>("#workspace-confirm-accept")!.click();
    expect(root.querySelector("#canvas-host svg")!.getAttribute("viewBox")).toBe(savedCanvas);
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("120");
  });

  it("closes the dirty-load confirmation with Escape and returns focus", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input"));
    const load = root.querySelector<HTMLButtonElement>("#load-pattern")!;
    load.focus();
    load.click();
    const confirmation = root.querySelector<HTMLElement>("#workspace-confirm")!;
    expect(confirmation.hidden).toBe(false);
    confirmation.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(confirmation.hidden).toBe(true);
    expect(document.activeElement).toBe(load);
    root.remove();
  });

  it("closes a load confirmation safely when its pending request is gone", () => {
    localStorage.clear();
    const root = mount();
    const confirmation = root.querySelector<HTMLElement>("#workspace-confirm")!;
    confirmation.hidden = false;
    root.querySelector<HTMLButtonElement>("#workspace-confirm-accept")!.click();
    expect(confirmation.hidden).toBe(true);
  });

  it("recovers an unfinished input without allowing drafting or Save to accept it", () => {
    localStorage.clear();
    const first = mount();
    clickIfPresent(first, "welcome-skip");
    clickId(first, "garment-woven-shirt");
    const buttonCount = first.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
    buttonCount.value = "6";
    buttonCount.dispatchEvent(new Event("input"));
    const firstChest = first.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    firstChest.value = "";
    firstChest.dispatchEvent(new Event("input"));

    const recovered = mount();
    expect(recovered.querySelector("#recovery-host")!.textContent).toContain("Unfinished draft found");
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("6");
    expect(recovered.querySelector("#canvas-host")!.textContent).toContain("Draft paused");
    recovered.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    expect(recovered.querySelector("#persist-status")!.textContent).toContain("Save failed");
  });

  it("discards an unfinished recovery draft explicitly", () => {
    localStorage.clear();
    const first = mount();
    const chest = first.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "";
    chest.dispatchEvent(new Event("input"));
    const recovered = mount();
    recovered.querySelector<HTMLButtonElement>("#recovery-discard")!.click();
    expect(recovered.querySelector("#recovery-host")!.textContent).toBe("");
    expect(localStorage.getItem("patternworks_recovery_v1")).toBeNull();
  });

  it("recovers when the local option map predates the active recipe", () => {
    localStorage.clear();
    const first = mount();
    const chest = first.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "";
    chest.dispatchEvent(new Event("input"));
    const recovery = JSON.parse(localStorage.getItem("patternworks_recovery_v1")!);
    delete recovery.rawOptions.tee;
    localStorage.setItem("patternworks_recovery_v1", JSON.stringify(recovery));
    const recovered = mount();
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("");
  });

  it("preserves an incomplete recipe option through recovery", () => {
    localStorage.clear();
    const first = mount();
    clickIfPresent(first, "welcome-skip");
    clickId(first, "garment-woven-shirt");
    const option = first.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
    option.value = "";
    option.dispatchEvent(new Event("input"));
    const recovered = mount();
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("");
  });

  it("opens linked pages in inventory order and highlights only the mapped fields without editing values", () => {
    localStorage.clear();
    const root = mount();
    document.body.append(root);
    clickId(root, "welcome-skip");
    const valuesBefore = [...root.querySelectorAll<HTMLInputElement>("input[data-field], input[data-option]")]
      .map((input) => [input.dataset.field ?? input.dataset.option, input.value]);

    root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="front"]')!.click();
    expect(root.querySelector("#journey-step-measure")!.getAttribute("aria-current")).toBe("step");
    expect(root.querySelector<HTMLElement>('[data-control-page][data-control-label="Body measurements"]')!.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-dim-row="chest"]')!.classList.contains("pattern-measurement-match")).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-dim-row="shoulderWidth"]')!.classList.contains("pattern-measurement-match")).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-dim-row="length"]')!.classList.contains("pattern-measurement-match")).toBe(false);
    expect(root.querySelectorAll("#pattern-measurement-navigation [data-pattern-measurement-page]")).toHaveLength(3);
    expect(document.activeElement).toBe(root.querySelector('input[data-field="chest"]'));
    root.querySelector<HTMLButtonElement>('#pattern-measurement-navigation [data-pattern-measurement-page="0"]')!.click();

    clickId(root, "view-pattern");
    expect(root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="front"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="back"]')!.getAttribute("aria-pressed")).toBe("false");
    expect(root.querySelector<SVGGElement>('#analysis-host svg g.pattern-block-control[data-pattern-piece-index="0"]')!.getAttribute("aria-pressed")).toBe("true");
    root.querySelector<HTMLButtonElement>('#pattern-measurement-navigation [data-pattern-measurement-page="1"]')!.click();
    expect(root.querySelector<HTMLElement>('[data-control-page][data-control-label="Lengths & shape"]')!.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-dim-row="chest"]')!.classList.contains("pattern-measurement-match")).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-dim-row="length"]')!.classList.contains("pattern-measurement-match")).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-dim-row="armholeDepth"]')!.classList.contains("pattern-measurement-match")).toBe(true);

    root.querySelector<HTMLButtonElement>('#pattern-measurement-navigation [data-pattern-measurement-page="2"]')!.click();
    expect(root.querySelector("#journey-step-fit")!.getAttribute("aria-current")).toBe("step");
    expect(root.querySelector<HTMLElement>('[data-control-page][data-control-label="Fit allowance"]')!.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-dim-row="ease"]')!.classList.contains("pattern-measurement-match")).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('input[data-field="ease"]'));
    expect([...root.querySelectorAll<HTMLInputElement>("input[data-field], input[data-option]")]
      .map((input) => [input.dataset.field ?? input.dataset.option, input.value])).toEqual(valuesBefore);
  });

  it("opens the first linked page from a keyboard-activated SVG piece", () => {
    localStorage.clear();
    const root = mount();
    document.body.append(root);
    clickId(root, "welcome-skip");
    const piece = root.querySelector<SVGGElement>("#analysis-host svg g.pattern-block-control[data-pattern-piece-index='2']")!;
    expect(piece.getAttribute("role")).toBe("button");
    expect(piece.getAttribute("tabindex")).toBe("0");
    root.querySelector("#canvas-host")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    piece.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    expect(root.querySelector<HTMLElement>("#pattern-measurement-navigation")!.hidden).toBe(true);
    piece.focus();
    piece.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(root.querySelector("#journey-step-measure")!.getAttribute("aria-current")).toBe("step");
    expect(document.activeElement).toBe(root.querySelector('input[data-field="chest"]'));
    clickId(root, "view-pattern");
    expect(root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="sleeve"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<SVGGElement>('#analysis-host svg g.pattern-block-control[data-pattern-piece-index="2"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLElement>('[data-dim-row="bicep"]')!.classList.contains("pattern-measurement-match")).toBe(true);
    root.querySelector<SVGGElement>('#analysis-host svg g.pattern-block-control[data-pattern-piece-index="1"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    expect(root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="back"]')!.getAttribute("aria-pressed")).toBe("true");
  });

  it("explains option-only blocks without navigating to an unrelated measurement", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "garment-polo");
    const valuesBefore = [...root.querySelectorAll<HTMLInputElement>("input[data-field], input[data-option]")]
      .map((input) => [input.dataset.field ?? input.dataset.option, input.value]);
    root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="front"]')!.click();
    expect(root.querySelector("#journey-step-measure")!.getAttribute("aria-current")).toBe("step");
    expect(root.querySelectorAll(".pattern-measurement-match-badge").length).toBeGreaterThan(0);
    clickId(root, "view-pattern");
    root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="button placket"]')!.click();
    expect(root.querySelector("#journey-step-measure")!.getAttribute("aria-current")).toBe("step");
    expect(root.querySelector<HTMLElement>("#pattern-measurement-feedback")!.textContent).toContain("Front closure options");
    expect(root.querySelector<HTMLElement>("#pattern-measurement-navigation")!.hidden).toBe(true);
    expect(root.querySelectorAll(".pattern-measurement-match")).toHaveLength(0);
    expect(root.querySelectorAll(".pattern-measurement-match-badge")).toHaveLength(0);
    expect([...root.querySelectorAll<HTMLInputElement>("input[data-field], input[data-option]")]
      .map((input) => [input.dataset.field ?? input.dataset.option, input.value])).toEqual(valuesBefore);
  });

  it("explains when a live pattern block has no reviewed mapping", () => {
    const original = mutablePatternMeasurementMap.tee.front;
    mutablePatternMeasurementMap.tee.front = undefined as unknown as PatternMeasurementDefinition;
    try {
      localStorage.clear();
      const root = mount();
      clickId(root, "welcome-skip");
      root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="front"]')!.click();
      expect(root.querySelector<HTMLElement>("#pattern-measurement-feedback")!.textContent)
        .toContain("No reviewed measurement mapping is recorded for front.");
      expect(root.querySelector<HTMLElement>("#pattern-measurement-navigation")!.hidden).toBe(true);
    } finally {
      mutablePatternMeasurementMap.tee.front = original;
    }
  });

  it("clears highlights on an unrelated page and ignores a stale page link", () => {
    localStorage.clear();
    const root = mount();
    document.body.append(root);
    clickId(root, "welcome-skip");
    clickId(root, "garment-polo");
    root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="outer collar stand"]')!.click();
    expect(root.querySelector("#journey-step-measure")!.getAttribute("aria-current")).toBe("step");

    clickId(root, "view-body");
    root.querySelector<HTMLButtonElement>('#pattern-measurement-navigation [data-pattern-measurement-page="0"]')!.click();
    const pageSelect = root.querySelector<HTMLSelectElement>("#control-page-select")!;
    const unrelatedPage = [...pageSelect.options].find((option) => option.textContent?.includes("Lengths & shape"))!;
    pageSelect.value = unrelatedPage.value;
    pageSelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelectorAll(".pattern-measurement-match")).toHaveLength(0);
    expect(root.querySelector<HTMLElement>(".pattern-measurement-nav-detail")!.textContent)
      .toContain("Choose a linked page below");
    expect(root.querySelector('[data-pattern-measurement-page="0"]')!.getAttribute("aria-current")).toBeNull();

    const stalePageLink = root.querySelector<HTMLButtonElement>('[data-pattern-measurement-page="0"]')!;
    const currentPage = pageSelect.value;
    stalePageLink.dataset.patternMeasurementPage = "99";
    stalePageLink.click();
    expect(pageSelect.value).toBe(currentPage);
  });

  it("uses an explicit fallback when an option-only mapping has no explanatory text", () => {
    const original = mutablePatternMeasurementMap.polo["button placket"];
    mutablePatternMeasurementMap.polo["button placket"] = { fields: [] };
    try {
      localStorage.clear();
      const root = mount();
      clickId(root, "welcome-skip");
      clickId(root, "garment-polo");
      root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="button placket"]')!.click();
      expect(root.querySelector<HTMLElement>("#pattern-measurement-feedback")!.textContent)
        .toContain("No related editable measurements are recorded for button placket.");
      expect(root.querySelector<HTMLElement>("#pattern-measurement-navigation")!.hidden).toBe(true);
    } finally {
      mutablePatternMeasurementMap.polo["button placket"] = original;
    }
  });

  it("explains when a mapped field has no page in the active garment", () => {
    const original = mutablePatternMeasurementMap.tee.front;
    mutablePatternMeasurementMap.tee.front = { fields: ["waist" as PatternMeasurementField] };
    try {
      localStorage.clear();
      const root = mount();
      clickId(root, "welcome-skip");
      root.querySelector<HTMLButtonElement>('#pattern-annotation-key [data-pattern-piece-name="front"]')!.click();
      expect(root.querySelector<HTMLElement>("#pattern-measurement-feedback")!.textContent)
        .toContain("No editable measurement page is available for front in this garment.");
      expect(root.querySelector<HTMLElement>("#pattern-measurement-navigation")!.hidden).toBe(true);
    } finally {
      mutablePatternMeasurementMap.tee.front = original;
    }
  });

  it("preserves an incomplete Polo V2 option through recovery", () => {
    localStorage.clear();
    const first = mount();
    clickIfPresent(first, "welcome-skip");
    clickId(first, "garment-polo");
    const option = first.querySelector<HTMLInputElement>('[data-option="sideVentDepth"]')!;
    option.value = "";
    option.dispatchEvent(new Event("input"));
    const recovered = mount();
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>('[data-option="sideVentDepth"]')!.value).toBe("");
  });

  it("undoes and redoes a Polo V2 option without changing body measurements", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-skip");
    clickId(root, "garment-polo");
    const option = root.querySelector<HTMLInputElement>('[data-option="backHemDrop"]')!;
    const chest = root.querySelector<HTMLInputElement>('[data-field="chest"]')!;
    option.value = "5";
    option.dispatchEvent(new Event("input"));
    expect(option.value).toBe("5");
    clickId(root, "undo-pattern");
    expect(root.querySelector<HTMLInputElement>('[data-option="backHemDrop"]')!.value).toBe("1.5");
    expect(root.querySelector<HTMLInputElement>('[data-field="chest"]')!.value).toBe(chest.value);
    clickId(root, "redo-pattern");
    expect(root.querySelector<HTMLInputElement>('[data-option="backHemDrop"]')!.value).toBe("5");
  });

  it("guards navigation while dirty and clears the guard after a valid Save", () => {
    localStorage.clear();
    const root = mount();
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input"));
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    const savedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
  });

  it("keeps bounded Undo/Redo separate from native text editing", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input"));
    chest.value = "102";
    chest.dispatchEvent(new Event("input"));
    root.querySelector<HTMLButtonElement>("#undo-pattern")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("101");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true }));
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    root.querySelector<HTMLButtonElement>("#undo-pattern")!.click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, bubbles: true }));
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    root.querySelector<HTMLButtonElement>("#redo-pattern")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    chest.focus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
    expect(chest.value).toBe("102");
  });

  it("keeps empty history and unrelated shortcuts as no-ops", () => {
    localStorage.clear();
    const root = mount();
    const shortcut = (key: string): void => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true }));
    };
    shortcut("z");
    shortcut("y");
    shortcut("x");

    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input"));
    shortcut("z");
    shortcut("z");
    shortcut("y");
    shortcut("y");
    expect(chest.value).toBe("101");
  });

  it("Save shows a failure message when localStorage throws", () => {
    const originalWindowStorage = window.localStorage;
    const originalGlobalStorage = globalThis.localStorage;
    const unavailableStorage = {
      clear: (): void => undefined,
      getItem: (): null => null,
      key: (): null => null,
      removeItem: (): void => undefined,
      setItem: (): never => { throw new Error("quota"); },
      get length(): number { return 0; },
    } as unknown as Storage;
    Object.defineProperty(window, "localStorage", { configurable: true, value: unavailableStorage });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: unavailableStorage });
    try {
      const root = mount();
      root.querySelector<HTMLButtonElement>("#save-pattern")!.dispatchEvent(new Event("click"));
      expect(root.querySelector<HTMLSpanElement>("#persist-status")!.textContent).toContain("failed");
    } finally {
      Object.defineProperty(window, "localStorage", { configurable: true, value: originalWindowStorage });
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalGlobalStorage });
    }
  });

  it("routes an unready menu export back to the current review stage", () => {
    let registered: ((kind: string) => void) | undefined;
    window.electronAPI = {
      saveFile: vi.fn(),
      onExportRequested: (cb) => { registered = cb; },
    };
    try {
      const root = mount();
      registered!("svg");
      registered!("unknown");
      expect(root.querySelector("#persist-status")!.textContent).toContain("Review Style and the current digital checks");
    } finally {
      delete window.electronAPI;
    }
  });

  it("Load is a no-op when nothing has been saved", () => {
    localStorage.clear();
    const root = mount();
    const before = root.querySelector("#canvas-host svg")!.getAttribute("viewBox");
    root.querySelector<HTMLButtonElement>("#load-pattern")!.dispatchEvent(new Event("click"));
    expect(root.querySelector("#canvas-host svg")!.getAttribute("viewBox")).toBe(before);
    expect(root.querySelector<HTMLSpanElement>("#persist-status")!.textContent).toContain("Nothing");
  });

  it("keeps dirty Load safe when no HTMLElement owns focus", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input"));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    chest.value = "121";
    chest.dispatchEvent(new Event("input"));
    const descriptor = Object.getOwnPropertyDescriptor(document, "activeElement");
    try {
      Object.defineProperty(document, "activeElement", { configurable: true, value: null });
      root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
      expect(root.querySelector<HTMLElement>("#workspace-confirm")!.hidden).toBe(false);
    } finally {
      if (descriptor) Object.defineProperty(document, "activeElement", descriptor);
      else Reflect.deleteProperty(document, "activeElement");
    }
    root.querySelector<HTMLButtonElement>("#workspace-confirm-cancel")!.click();
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

  it("uses fit and material cards without bypassing the native state controls", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    root.querySelector<HTMLButtonElement>('[data-style-target="Classic tee"]')!.click();
    root.querySelector<HTMLButtonElement>('[data-style-target="Oversized tee"]')!.click();
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Oversized tee");
    expect(root.querySelector<HTMLButtonElement>('[data-style-target="Oversized tee"]')!.getAttribute("aria-pressed")).toBe("true");
    root.querySelector<HTMLButtonElement>('[data-material-option="Linen"]')!.click();
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
    expect(root.querySelector<HTMLButtonElement>('[data-material-option="Linen"]')!.getAttribute("aria-pressed")).toBe("true");
    clickId(root, "journey-step-measure");
    clickId(root, "journey-step-fit");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
    expect(root.querySelector<HTMLButtonElement>('[data-style-target="Oversized tee"]')!.getAttribute("aria-pressed")).toBe("true");
  });

  it("surfaces a material mismatch when a woven garment gets an explicit knit choice", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "welcome-skip");
    clickId(root, "journey-step-start");
    clickId(root, "garment-woven-shirt");
    clickId(root, "journey-step-fit");
    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
    expect(root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.getAttribute("aria-pressed")).toBe("true");
  });

  it("uses a garment-family material default until the user makes an explicit choice", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "journey-step-start");
    clickId(root, "garment-woven-shirt");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton woven");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("stable woven material");
    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();
    clickId(root, "garment-tee");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
    clickId(root, "garment-woven-shirt");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
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

  it("confirms Export only after Electron confirms the reviewed write", async () => {
    localStorage.clear();
    const saveFile = vi.fn().mockResolvedValue({ saved: true });
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-svg");
      await Promise.resolve();
      expect(root.querySelector("#journey-host")!.textContent).toContain("Current stage: 5 Export");
      expect(root.querySelector("#journey-step-output")!.getAttribute("aria-current")).toBe("step");
      expect(root.querySelector("#readiness-host")!.textContent).toContain("5 of 5");
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
  const walkToOutput = (root: HTMLElement): void => reachExportStage(root);
  const mockDownloads = (): void => {
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  };

  it("opens the first run on the approved non-modal Welcome without hiding Garment", () => {
    const root = mount();
    expect(root.querySelector("#tutorial-panel")?.textContent).toContain("fits your design intent");
    expect(root.querySelector("#tutorial-panel")?.getAttribute("role")).toBe("region");
    expect(root.querySelector("#tutorial-host")).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#journey-next")!.hidden).toBe(true);
    expect(hidden(root, "#garment-toggle-host")).toBe(false);
    expect(hidden(root, "#controls-panel")).toBe(true);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(hidden(root, "#view-toggle-host")).toBe(false);
    expect(root.querySelector<HTMLElement>("#advanced-views")!.hidden).toBe(true);
    expect(hidden(root, "#style-host")).toBe(true);
  });

  it("starts on Garment, then advances to Measure without choosing a garment", () => {
    const root = mount();
    jclick(root, "welcome-start");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
    expect(root.querySelector("#tutorial-title")!.textContent).toContain("Choose what to design");
    expect(root.querySelector("#garment-toggle-host")!.classList.contains("tutorial-target")).toBe(true);
    expect(hidden(root, "#controls-panel")).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#garment-tee")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLHeadingElement>("#tutorial-title")!.getAttribute("tabindex")).toBe("-1");
    expect(root.querySelector("#tutorial-announcement")!.textContent).toBe("Step 2 of 5");
    expect(root.querySelector<HTMLButtonElement>("#journey-next")!.textContent).toBe("Continue to Measure");
    jclick(root, "journey-next");
    expect(hidden(root, "#controls-panel")).toBe(false);
    expect(root.querySelector("#canvas-host")!.innerHTML).toContain("(circ)");
    expect(hidden(root, "#view-body")).toBe(false);
    expect(root.querySelector<HTMLElement>("#advanced-views")!.hidden).toBe(false);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
  });

  it("suppresses the undecided Welcome when someone navigates directly to another stage", () => {
    const root = mount();
    jclick(root, "journey-step-measure");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector("#tutorial-title")!.textContent).toBe("Need a quick guide?");
    expect(root.querySelector("#tutorial-replay")!.textContent).toBe("Take the tour");
    expect(loadJourney().tutorial).toEqual({ status: "suppressed", step: "measure" });
  });

  it("opens an older saved workspace at Measure without auto-opening the tour", () => {
    const original = mount();
    clickId(original, "save-pattern");
    localStorage.removeItem("patternworks_journey_v1");

    const restored = mount();
    expect(restored.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(restored.querySelector("#tutorial-replay")?.textContent).toBe("Take the tour");
    expect(restored.querySelector("#tutorial-title")?.textContent).toBe("Need a quick guide?");
  });

  it("restores the active tour step and target after a reload", () => {
    const root = mount();
    jclick(root, "welcome-start");
    jclick(root, "journey-next");
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!).tutorial).toEqual({
      status: "in_progress", step: "measure",
    });
    const reloaded = mount();
    expect(reloaded.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(reloaded.querySelector("#tutorial-title")!.textContent).toContain("Review measurements");
    expect(reloaded.querySelector("#controls-panel")!.classList.contains("tutorial-target")).toBe(true);
  });

  it("keeps the workspace usable and warns when tutorial persistence fails", () => {
    const root = mount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("storage unavailable");
    });
    jclick(root, "welcome-start");
    expect(root.querySelector(".tutorial-storage-notice")?.textContent)
      .toContain("progress may not survive a reload");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
    expect(root.querySelector("#tutorial-title")!.textContent).toContain("Choose what to design");
  });

  it("reaches Export through the reviewed stage path, with exports finally revealed", () => {
    const root = mount();
    walkToOutput(root);
    expect(hidden(root, "#export-host")).toBe(false);
    expect(hidden(root, "#view-nest")).toBe(false);
    expect(hidden(root, "#view-spec")).toBe(false);
    // standard measurements: plausible + on-target + checks pass, not yet exported
    expect(root.querySelector("#readiness-host")!.innerHTML).toContain("4 of 5");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("output");
  });

  it("does not claim a browser download was written", () => {
    mockDownloads();
    const root = mount();
    walkToOutput(root);
    jclick(root, "export-svg");
    const journeyHtml = (): string => root.querySelector("#readiness-host")!.innerHTML;
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

  it("skips without changing the current stage or design and retains replay", () => {
    const root = mount();
    const before = root.querySelector<HTMLButtonElement>("#garment-tee")!.getAttribute("aria-pressed");
    jclick(root, "welcome-skip");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
    expect(root.querySelector("#tutorial-replay")!.textContent).toBe("Take the tour");
    expect(hidden(root, "#controls-panel")).toBe(true);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#garment-tee")!.getAttribute("aria-pressed")).toBe(before);
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!).tutorial.status).toBe("skipped");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("Tour complete");
    expect(root.querySelector("#readiness-host")!.textContent).not.toContain("5 of 5");
    clickId(root, "save-pattern");
    clickId(root, "tutorial-replay");
    expect(root.querySelector("#tutorial-title")!.textContent).toBe("Welcome");
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!).tutorial).toEqual({
      status: "in_progress", step: "welcome",
    });
    expect(loadJourney(true).tutorial).toEqual({ status: "in_progress", step: "welcome" });
    const reloaded = mount();
    expect(loadJourney(true).tutorial).toEqual({ status: "in_progress", step: "welcome" });
    expect(reloaded.querySelector("#tutorial-title")!.textContent).toBe("Welcome");
    expect(reloaded.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
  });

  it("lets the active tour explain later stages while preserving invalid measurements and the Export gate", () => {
    const root = mount();
    jclick(root, "welcome-start");
    jclick(root, "journey-next"); // Measure
    setChest(root, "160");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    expect(chest.value).toBe("160");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Chest");
    jclick(root, "journey-next"); // invalid values stay visible; Style is still explained
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("fit");
    expect(root.querySelector("#tutorial-title")!.textContent).toContain("Shape the design");
    expect(chest.value).toBe("160");
    jclick(root, "journey-next"); // Check is visible, Export remains gated
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("check");
    expect(root.querySelector<HTMLDetailsElement>("#guidance-details")!.open).toBe(true);
    expect(root.querySelector<HTMLDetailsElement>("#readiness-details")!.open).toBe(true);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#journey-next")).toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#journey-correction")!.textContent).toBe("Review the first flagged item");
    expect(root.querySelector("#controls-panel input[data-field='chest']")!.getAttribute("value")).not.toBe("160");
    expect(chest.value).toBe("160");
    jclick(root, "journey-correction");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector("#tutorial-title")!.textContent).toContain("Review measurements");
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("160");
  });

  it("moves focus to the Check correction when a newly flagged value removes Next", () => {
    const root = mount();
    document.body.append(root);
    jclick(root, "welcome-start");
    jclick(root, "journey-next"); // Measure
    jclick(root, "journey-next"); // Style
    jclick(root, "journey-next"); // Check
    const next = root.querySelector<HTMLButtonElement>("#journey-next")!;
    next.focus();
    expect(document.activeElement).toBe(next);

    setChest(root, "160");
    const correction = root.querySelector<HTMLButtonElement>("#journey-correction")!;
    expect(root.querySelector("#journey-next")).toBeNull();
    expect(document.activeElement).toBe(correction);
  });

  it("finishes without exporting and keeps a replay action", () => {
    mockDownloads();
    const root = mount();
    walkToOutput(root);
    jclick(root, "tutorial-finish");
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!).tutorial).toEqual({
      status: "completed", step: "export",
    });
    expect(root.querySelector("#tutorial-replay")!.textContent).toBe("Take the tour");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("output");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("returns the inspector to the new stage context when navigation changes stage", () => {
    const root = mount();
    clickId(root, "welcome-skip");
    root.querySelector<HTMLElement>("#studio-inspector")!.scrollTop = 480;
    clickId(root, "journey-step-fit");
    expect(root.querySelector<HTMLElement>("#studio-inspector")!.scrollTop).toBe(0);
    expect(root.querySelector(".fit-intent-cards")).not.toBeNull();
  });

  it("resumes a persisted journey where it left off", () => {
    localStorage.setItem("patternworks_journey_v1",
      JSON.stringify({ v: 1, step: "refine", exported: false }));
    const root = mount();
    expect(root.querySelector("#tutorial-panel")).not.toBeNull();
    expect(root.querySelector("#tutorial-replay")?.textContent).toBe("Take the tour");
    expect(root.querySelector("#tutorial-title")?.textContent).toBe("Need a quick guide?");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("check");
    expect(hidden(root, "#export-host")).toBe(true);
  });

  it("steps back with the Back button", () => {
    const root = mount();
    jclick(root, "welcome-start"); // → Garment
    jclick(root, "journey-next"); // → Measure
    jclick(root, "journey-next"); // → Style
    expect(hidden(root, "#style-host")).toBe(false);
    jclick(root, "journey-back"); // → Measure again
    expect(hidden(root, "#style-host")).toBe(true);
    expect(hidden(root, "#controls-panel")).toBe(false);
  });

  it("lets the first four stage chips revisit their stage and preferred view", () => {
    const root = mount();
    jclick(root, "welcome-skip");
    jclick(root, "journey-step-start");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("pattern");
    jclick(root, "journey-step-measure");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("body");
    jclick(root, "journey-step-fit");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("fit");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("body");
    jclick(root, "journey-step-refine");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
    expect(root.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("check");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-output")!.disabled).toBe(true);
  });

  it("keeps the legacy Done state from bypassing the reviewed journey", () => {
    const root = mount();
    jclick(root, "welcome-skip");
    root.querySelector<HTMLButtonElement>("#view-body")!.dispatchEvent(new Event("click"));
    localStorage.setItem("patternworks_journey_v1",
      JSON.stringify({ v: 1, step: "done", exported: true }));
    const restored = mount();
    expect(restored.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(restored.querySelector("#canvas-inspection")!.getAttribute("data-inspection-view")).toBe("body");
    expect(restored.querySelector<HTMLButtonElement>("#journey-step-output")!.disabled).toBe(true);
    expect(restored.querySelector("#readiness-host")!.textContent).not.toContain("5 of 5");
  });

  it("keeps the Slice-30 hover spotlight alive inside the journey", () => {
    const root = mount();
    jclick(root, "welcome-start");
    jclick(root, "journey-next"); // Measure renders the body view
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
    reachExportStage(root);
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
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
    expect(root.querySelector('[data-dim="crotchDepth"]')).not.toBeNull();
    expect(root.querySelector('[data-edge="option-frontRiseEase"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>("#body-back")!.dispatchEvent(new Event("click"));
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(1);
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
    root.querySelector<HTMLButtonElement>("#workspace-confirm-accept")!.click();
    expect(root.querySelector<HTMLButtonElement>("#garment-trouser")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLInputElement>('input[data-option="pocketDrop"]')!.value).toBe("5");
  });
});

describe("surface artwork panel (Slice 126)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const widthInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;

  it("renders the panel with an add form on the fit step", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    expect(root.querySelector("#style-host")!.textContent).toContain("Surface");
    expect(root.querySelector("#surface-add")).not.toBeNull();
    expect(root.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("rejects empty and duplicate names without adding anything", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("Name the artwork");
    addArtwork(root, "chest-print");
    addArtwork(root, "chest-print");
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("already exists");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "ok";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("piece role");
  });

  it("adds a placement with a true-scale preview polygon", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    const polygon = root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!;
    expect(polygon.getAttribute("points")).toBe("2,2 22,2 22,27 2,27");
    expect(polygon.getAttribute("data-piece")).toBe("front");
  });

  it("creates a placement with its entered size and optional provenance reference", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "hem-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLInputElement>("#surface-new-width")!.value = "12";
    root.querySelector<HTMLInputElement>("#surface-new-height")!.value = "15";
    root.querySelector<HTMLInputElement>("#surface-new-source")!.value = "Studio archive · https://example.test/art";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();

    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!.value).toBe("12");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="heightCm"]')!.value).toBe("15");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="sourceName"]')!.value)
      .toBe("Studio archive · https://example.test/art");
    expect(root.querySelector('#surface-preview polygon[data-placement="hem-print"]')!.getAttribute("points"))
      .toBe("2,2 14,2 14,17 2,17");
  });

  it("suggests the current garment's exact piece roles, including lower-body roles", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-trouser");
    toFitStep(root);
    const roles = [...root.querySelectorAll<HTMLOptionElement>("#surface-piece-role-options option")]
      .map((option) => option.value);
    expect(roles).toContain("frontLeft");
    expect(roles).toContain("backRight");

    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "front-panel-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "frontLeft";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="pieceRole"]')!.value)
      .toBe("frontLeft");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("is not in the current block");
  });

  it("falls back to manual role entry when the current draft cannot supply roles", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));

    const trouser = GARMENTS.find((recipe) => recipe.name === "trouser")!;
    const draft = trouser.draft;
    const unavailable = vi.spyOn(trouser, "draft").mockImplementation((measurements, options) => {
      if (measurements === STANDARD_M) throw new Error("Role structure unavailable");
      return draft(measurements, options);
    });
    try {
      clickId(root, "garment-trouser");
      expect(root.querySelectorAll<HTMLOptionElement>("#surface-piece-role-options option")).toHaveLength(0);
      expect(root.querySelector("#surface-new-role-help")!.textContent)
        .toContain("Role suggestions are unavailable");
    } finally {
      unavailable.mockRestore();
    }
  });

  it("keeps an invalid creation dimension visible and gives field-specific feedback", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "invalid-size";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const width = root.querySelector<HTMLInputElement>("#surface-new-width")!;
    width.value = "0";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(width.value).toBe("0");
    expect(width.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("Enter a placement width above 0 cm.");
  });

  it("rejects a blank placement height without filling or hiding the input", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "blank-height";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const height = root.querySelector<HTMLInputElement>("#surface-new-height")!;
    height.value = "";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(height.value).toBe("");
    expect(height.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(height);
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("Enter a placement height above 0 cm.");
  });

  it("keeps invalid values visible with an actionable error while drafting continues", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const gateBefore = root.querySelector<HTMLButtonElement>("#export-svg")!.disabled;
    const width = widthInput(root);
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
    expect(widthInput(root).value).toBe("0");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(gateBefore);
    expect(root.querySelector("#surface-preview polygon")).toBeNull();
    expect(root.querySelector<HTMLElement>("[data-surface-preview-shell]")!.hidden).toBe(true);
    const retry = widthInput(root);
    retry.value = "abc";
    retry.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
  });

  it("recovers through the stepper and the kind select", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const broken = widthInput(root);
    broken.value = "abc";
    broken.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    const control = widthInput(root).closest<HTMLElement>("[data-range-control]")!;
    control.querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!.click();
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("false");
    expect(root.querySelector("#surface-preview polygon")).not.toBeNull();
    const kind = root.querySelector<HTMLSelectElement>('select[data-surface-index="0"]')!;
    kind.value = "patch";
    kind.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!.getAttribute("data-kind")).toBe("patch");
  });

  it("edits transform fields into the nested transform", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const dx = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!;
    dx.value = "5";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!.value).toBe("5");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    const rotation = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="rotationDeg"]')!;
    rotation.value = "90";
    rotation.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!.getAttribute("points"))
      .toBe("27,2 27,22 2,22 2,2");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
  });

  it("does not replace a manually edited numeric field while capturing raw input", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = widthInput(root);
    width.focus();
    width.value = "3";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    expect(widthInput(root)).toBe(width);
    widthInput(root).value = "37";
    widthInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    expect(widthInput(root).value).toBe("37");
    expect(widthInput(root)).toBe(width);
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    root.remove();
  });

  it("removes a placement explicitly", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(root.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("round-trips artwork, including raw invalid values, through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = widthInput(root);
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(localStorage.getItem("patternworks_save_v1")).toContain("chest-print");
    widthInput(root).value = "10";
    widthInput(root).dispatchEvent(new Event("focusout", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(widthInput(root).value).toBe("0");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
  });

  it("loads pre-surface saves with an empty set", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    delete raw.surface;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(reloaded.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("isolates artwork sets per style and shares them across sizes", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    const styles = [...root.querySelectorAll<HTMLButtonElement>("[data-style-target]")]
      .map((card) => card.dataset.styleTarget!);
    expect(styles.length).toBeGreaterThan(1);
    addArtwork(root, "chest-print");
    const current = root.querySelector<HTMLSelectElement>("#style-target")!.value;
    const other = styles.find((name) => name !== current)!;
    root.querySelector<HTMLButtonElement>(`[data-style-target="${other}"]`)!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    root.querySelector<HTMLButtonElement>(`[data-style-target="${current}"]`)!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
  });

  it("renders the panel for all seven garments with the assembled preview intact", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    for (const garment of ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]) {
      root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
      expect(root.querySelector("#surface-add")).not.toBeNull();
      expect(root.querySelector("#garment-host svg")).not.toBeNull();
    }
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
  });

  it("renders at narrow and wide widths without errors", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    addArtwork(root, "chest-print");
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    for (const width of [1280, 900, 700, 560, 390]) {
      Object.defineProperty(viewport, "clientWidth", { configurable: true, value: width });
      window.dispatchEvent(new Event("resize"));
      expect(root.querySelector("#surface-add")).not.toBeNull();
      expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')).not.toBeNull();
    }
    root.remove();
  });

  it("treats a cleared field as explicitly incomplete", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
    expect(root.querySelector("#surface-preview polygon")).toBeNull();
    expect(root.querySelector<HTMLElement>("[data-surface-preview-shell]")!.hidden).toBe(true);
  });

  it("ignores stray surface controls that name no row", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const ghost = document.createElement("input");
    ghost.setAttribute("data-surface-index", "99");
    ghost.setAttribute("data-surface-field", "widthCm");
    root.querySelector("#style-host")!.appendChild(ghost);
    root.querySelector("#style-host")!.dispatchEvent(new Event("surface-step", { bubbles: true }));
    ghost.dispatchEvent(new Event("surface-step", { bubbles: true }));
    ghost.value = "5";
    ghost.dispatchEvent(new Event("input", { bubbles: true }));
    const ghostRemove = document.createElement("button");
    ghostRemove.setAttribute("data-surface-remove-index", "99");
    root.querySelector("#style-host")!.appendChild(ghostRemove);
    ghostRemove.click();
    const ghostNaN = document.createElement("button");
    ghostNaN.setAttribute("data-surface-remove-index", "abc");
    root.querySelector("#style-host")!.appendChild(ghostNaN);
    ghostNaN.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')).not.toBeNull();
  });

  it("ignores typing in the add form until Add is pressed", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    const name = root.querySelector<HTMLInputElement>("#surface-new-id")!;
    name.value = "draft";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
  });

  it("survives a hostile save and recovers through explicit edits", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    const key = Object.keys(raw.surface)[0];
    raw.surface[key].placements.push({
      id: "hostile", kind: "print", pieceRole: "front", widthCm: 20, heightCm: 25,
      transform: null, zOrder: 1, sourceName: "",
    });
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelectorAll("[data-surface-row]")).toHaveLength(2);
    expect(reloaded.querySelector("#error-surface-1")!.textContent).toContain("Transform");
    const dx = reloaded.querySelector<HTMLInputElement>('input[data-surface-index="1"][data-surface-field="dx"]')!;
    dx.value = "2";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(reloaded.querySelector("#error-surface-1")!.textContent).toBe("");
    expect(reloaded.querySelectorAll('#surface-preview polygon')).toHaveLength(2);
  });
});

describe("surface output (Slice 127)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const captureDownloads = (): string[] => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    return created;
  };

  it("disables the print sheet with an artwork reason when the style is empty", () => {
    localStorage.clear();
    const root = mount();
    captureDownloads();
    reachExportStage(root);
    const button = root.querySelector<HTMLButtonElement>("#export-surface-sheet")!;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe("Add artwork on the Style panel first.");
  });

  it("downloads the print sheet for the current style, ignoring the size picker", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    toFitStep(root);
    addArtwork(root, "chest-print");
    reachExportStage(root);
    const button = root.querySelector<HTMLButtonElement>("#export-surface-sheet")!;
    expect(button.disabled).toBe(false);
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    const opts = [...root.querySelectorAll<HTMLOptionElement>("#export-size option")];
    size.value = opts[opts.length - 1].value;
    size.dispatchEvent(new Event("change"));
    button.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-surface-sheet.svg"]);
  });

  it("downloads the tech pack with the artwork section for the current style", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    toFitStep(root);
    addArtwork(root, "chest-print");
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-techpack")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-techpack.pdf"]);
  });

  it("leaves export filenames stable when the style is empty", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#export-techpack")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-M.svg", "tee-techpack.pdf"]);
  });
});

describe("surface guidance (Slice 128)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const breakWidth = (root: HTMLElement): void => {
    const width = root.querySelector<HTMLInputElement>(
      'input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
  };

  it("routes surface fields to the fit step for correction", () => {
    expect(stageBlockerFromNote({ level: "warn", text: "x", field: "surface-0-widthCm" })).toEqual({
      message: "x", step: "fit", field: "surface-0-widthCm",
    });
  });

  it("shows artwork warnings in guidance with a Review action", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    const host = root.querySelector("#guidance-host")!;
    expect(host.textContent).toContain("Artwork 'chest-print'");
    expect(host.textContent).toContain("widthCm");
    const review = host.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-widthCm"]')!;
    expect(review).not.toBeNull();
  });

  it("focuses the failing control from the Review action", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFitStep(root);
      addArtwork(root, "chest-print");
      breakWidth(root);
      const focused: Element[] = [];
      const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
        function (this: HTMLInputElement) { focused.push(this); });
      try {
        root.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-widthCm"]')!.click();
        // Review navigates (setView redraws), so resolve the control post-click.
        const fresh = root.querySelector('input[data-guidance-control="surface-0-widthCm"]')!;
        expect(focused).toContain(fresh);
      } finally {
        spy.mockRestore();
      }
    } finally {
      root.remove();
    }
  });

  it("dismisses the warning until a pattern change brings it back", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    const host = (): string => root.querySelector("#guidance-host")!.textContent ?? "";
    const ignoredRow = (): string | null =>
      root.querySelector('[data-guidance-field="surface-0-widthCm"][data-guidance-ignored]')?.textContent ?? null;
    root.querySelector<HTMLButtonElement>('button[data-ignore-guidance="surface-0-widthCm"]')!.click();
    expect(ignoredRow()).toContain("Set aside for this draft");
    root.querySelector<HTMLButtonElement>('button[data-restore-guidance="surface-0-widthCm"]')!.click();
    expect(host()).toContain("Artwork 'chest-print'");
    expect(ignoredRow()).toBeNull();
    root.querySelector<HTMLButtonElement>('button[data-ignore-guidance="surface-0-widthCm"]')!.click();
    const ghost = document.createElement("button");
    ghost.setAttribute("data-ignore-guidance", "");
    root.querySelector("#guidance-host")!.append(ghost);
    ghost.click();
    const dx = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!;
    dx.value = "3";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(ignoredRow()).toContain("Set aside for this draft");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input"));
    expect(ignoredRow()).toBeNull();
    expect(host()).toContain("Artwork 'chest-print'");
  });

  it("keeps artwork warnings visible on the Check view without gating exports", () => {
    localStorage.clear();
    const root = mount();
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    root.querySelector<HTMLButtonElement>("#view-check")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLButtonElement>("#view-check")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Artwork 'chest-print'");
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-M.svg"]);
  });
});

describe("surface frame guidance (Slice 130)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const setNumeric = (root: HTMLElement, index: number, field: string, value: string): void => {
    const input = root.querySelector<HTMLInputElement>(
      `input[data-surface-index="${index}"][data-surface-field="${field}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event("focusout", { bubbles: true }));
  };

  it("repairs an empty name through Review focus on the Name input", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    const key = Object.keys(raw.surface)[0];
    raw.surface[key].placements[0].id = "";
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelector("#guidance-host")!.textContent).toContain("Placement id");
    const focused: Element[] = [];
    const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
      function (this: HTMLInputElement) { focused.push(this); });
    try {
      reloaded.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-id"]')!.click();
      const fresh = reloaded.querySelector('input[data-guidance-control="surface-0-id"]')!;
      expect(focused).toContain(fresh);
    } finally {
      spy.mockRestore();
    }
    const name = reloaded.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="id"]')!;
    name.value = "chest-print";
    name.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(reloaded.querySelector("#error-surface-0")!.textContent).toBe("");
    expect(reloaded.querySelector("#guidance-host")!.textContent).not.toContain("Placement id");
  });

  it("warns when artwork leaves its piece and when it covers the whole piece", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "scale", "10");
    const host = root.querySelector("#guidance-host")!.textContent ?? "";
    expect(host).toContain("extends beyond the front piece");
    expect(host).toContain("covers about");
    expect(host).toContain("full-coverage print intent");
  });

  it("names unknown piece roles with the available choices", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print", "hood");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("not in the current block");
  });

  it("warns below the print floor for rated sources and stays silent otherwise", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("px/cm");
    setNumeric(root, 0, "sourcePxWidth", "200");
    setNumeric(root, 0, "sourcePxHeight", "200");
    const host = root.querySelector("#guidance-host")!.textContent ?? "";
    expect(host).toContain("about 8 px/cm");
    expect(host).toContain("59 px/cm floor");
  });

  it("treats cleared optional source dimensions as unknown, not invalid", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "sourcePxWidth", "2400");
    setNumeric(root, 0, "sourcePxWidth", "");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("px/cm");
  });

  it("round-trips source dimensions through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "sourcePxWidth", "2400");
    clickId(root, "save-pattern");
    expect(localStorage.getItem("patternworks_save_v1")).toContain("2400");
    setNumeric(root, 0, "sourcePxWidth", "100");
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="sourcePxWidth"]')!.value).toBe("2400");
  });
});

describe("nesting intelligence (Slice 133)", () => {
  const toFabricView = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");
    clickId(root, "journey-next");
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
  };
  const bufferInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>("#nest-buffer")!;
  const availableInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>("#nest-available")!;

  it("routes nesting fields to the output step for correction", () => {
    expect(stageBlockerFromNote({ level: "warn", text: "x", field: "nesting-buffer" })).toEqual({
      message: "x", step: "output", field: "nesting-buffer",
    });
  });

  it("renders planning controls and estimate readouts on the fabric view", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    expect(root.querySelector("#nest-intel-host")).not.toBeNull();
    expect(bufferInput(root).value).toBe("10");
    expect(availableInput(root).value).toBe("");
    expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
    expect(root.querySelector("#nest-required")!.textContent).toContain("cm of cloth");
    expect(root.querySelector("#nest-planned")!.textContent).toContain("Planned with buffer:");
    expect(root.querySelector("#nest-waste")!.textContent).toContain("Waste:");
    expect(root.querySelector("#nest-waste")!.textContent).toContain("% of cloth");
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("unknown");
    expect(root.querySelector("#nest-nap-notice")!.textContent).toContain("never rotate");
  });

  it("renders the estimate for all seven garments without leaking values", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const buffer = bufferInput(root);
    buffer.value = "25";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    for (const garment of ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]) {
      root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
      expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
      expect(root.querySelector("#nest-planned")!.textContent).toContain("Planned with buffer:");
      expect(root.querySelector("#nest-waste")!.textContent).toContain("% of cloth");
      expect(bufferInput(root).value).toBe("25");
    }
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
  });

  it("recomputes truthfully across single-size and marker scopes", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const singleRequired = root.querySelector("#nest-required")!.textContent;
    const singleScope = root.querySelector("#nest-intel-scope")!.textContent;
    expect(singleScope).toContain("Single size");
    root.querySelector<HTMLButtonElement>("#nest-marker")!.click();
    expect(root.querySelector("#nest-intel-scope")!.textContent).toContain("Graded marker");
    expect(root.querySelector("#nest-required")!.textContent).not.toBe(singleRequired);
    root.querySelector<HTMLButtonElement>("#nest-single")!.click();
    expect(root.querySelector("#nest-required")!.textContent).toBe(singleRequired);
  });

  it("keeps invalid buffer visible with guidance while drafting continues", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const buffer = bufferInput(root);
    buffer.value = "60";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    expect(bufferInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-nest-buffer")!.textContent).toContain("0–50");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Cutting buffer");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#nest-planned")!.textContent).toContain("unavailable");
    buffer.value = "";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#error-nest-buffer")!.textContent).toContain("finite");
  });

  it("judges fits and shortage against fabric on hand", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const available = availableInput(root);
    available.value = "10000";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#nest-verdict")!.textContent).toBe("Fit: fits the fabric on hand.");
    available.value = "1";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("short by");
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("cm.");
    available.value = "0";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(availableInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Fabric on hand");
  });

  it("toggles the directional notice without changing placements", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const before = root.querySelector("#canvas-host")!.innerHTML;
    const nap = root.querySelector<HTMLInputElement>("#nest-nap")!;
    expect(nap.checked).toBe(true);
    nap.checked = false;
    nap.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#nest-nap-notice")!.textContent).toContain("no rotation");
    expect(root.querySelector("#canvas-host")!.innerHTML).toBe(before);
  });

  it("focuses the failing control from the Review action", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFabricView(root);
      bufferInput(root).value = "60";
      bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
      const focused: Element[] = [];
      const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
        function (this: HTMLInputElement) { focused.push(this); });
      try {
        root.querySelector<HTMLButtonElement>('button[data-guidance-focus="nesting-buffer"]')!.click();
        const fresh = root.querySelector('input[data-guidance-control="nesting-buffer"]')!;
        expect(focused).toContain(fresh);
      } finally {
        spy.mockRestore();
      }
    } finally {
      root.remove();
    }
  });

  it("round-trips planning values through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    bufferInput(root).value = "25";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    availableInput(root).value = "300";
    availableInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    const napBox = root.querySelector<HTMLInputElement>("#nest-nap")!;
    napBox.checked = false;
    napBox.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "save-pattern");
    bufferInput(root).value = "10";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(bufferInput(root).value).toBe("25");
    expect(availableInput(root).value).toBe("300");
    expect(root.querySelector<HTMLInputElement>("#nest-nap")!.checked).toBe(false);
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("Fit:");
  });

  it("rejects an invalid buffer visibly at save time", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    bufferInput(root).value = "60";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Save failed");
    expect(root.querySelector("#persist-status")!.textContent).toContain("nesting intelligence");
    bufferInput(root).value = "";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Save failed");
  });

  it("loads a null on-hand value as a blank input", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    raw.nestingIntelligence.availableLengthCm = null;
    raw.nestingIntelligence.bufferPct = 25;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFabricView(reloaded);
    expect(bufferInput(reloaded).value).toBe("25");
    expect(availableInput(reloaded).value).toBe("");
    expect(reloaded.querySelector("#nest-verdict")!.textContent).toContain("unknown");
    raw.nestingIntelligence.availableLengthCm = 300;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const valued = mount();
    toFabricView(valued);
    expect(availableInput(valued).value).toBe("300");
    expect(valued.querySelector("#nest-verdict")!.textContent).toContain("Fit:");
  });

  it("loads pre-intelligence saves with planning defaults", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    delete raw.nestingIntelligence;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFabricView(reloaded);
    expect(bufferInput(reloaded).value).toBe("10");
    expect(availableInput(reloaded).value).toBe("");
    expect(reloaded.querySelector<HTMLInputElement>("#nest-nap")!.checked).toBe(true);
  });

  it("restores raw invalid planning values through recovery", () => {
    localStorage.clear();
    const first = mount();
    toFabricView(first);
    bufferInput(first).value = "60";
    bufferInput(first).dispatchEvent(new Event("input", { bubbles: true }));
    const recovered = mount();
    expect(recovered.querySelector("#recovery-host")!.textContent).toContain("Unfinished draft found");
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>("#nest-buffer")!.value).toBe("60");
    expect(recovered.querySelector("#error-nest-buffer")!.textContent).toContain("0–50");
  });

  it("renders planning readouts at narrow and wide widths without errors", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFabricView(root);
      const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
      for (const width of [1280, 900, 700, 560, 390]) {
        Object.defineProperty(viewport, "clientWidth", { configurable: true, value: width });
        window.dispatchEvent(new Event("resize"));
        expect(root.querySelector("#nest-intel-host")).not.toBeNull();
        expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
      }
    } finally {
      root.remove();
    }
  });
});

function memoryArtworkStore(): {
  readonly store: ArtworkAssetStore;
  readonly records: Map<string, StoredArtworkAsset>;
  setFailWrites(value: boolean): void;
} {
  const records = new Map<string, StoredArtworkAsset>();
  let failWrites = false;
  return {
    records,
    setFailWrites: (value) => { failWrites = value; },
    store: {
      put: vi.fn(async (asset) => {
        if (failWrites) throw new Error("profile is read-only");
        records.set(asset.assetId, asset);
      }),
      get: vi.fn(async (assetId) => records.get(assetId) ?? null),
      remove: vi.fn(async (assetId) => { records.delete(assetId); }),
    },
  };
}

function makeFileList(files: readonly (File | undefined)[], length = files.length): FileList {
  return { 0: files[0], length, item: (index: number) => files[index] ?? null } as unknown as FileList;
}

function setFileList(input: HTMLInputElement, files: readonly (File | undefined)[], length = files.length): void {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: makeFileList(files, length),
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setFileInput(input: HTMLInputElement, selected: File): void {
  setFileList(input, [selected]);
}

function dispatchArtworkDrop(
  target: HTMLElement,
  files?: readonly (File | undefined)[],
  length = files?.length ?? 0,
): Event {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  if (files) Object.defineProperty(event, "dataTransfer", { value: { files: makeFileList(files, length) } });
  target.dispatchEvent(event);
  return event;
}

function dispatchArtworkDrag(target: Node, type: "dragover" | "dragleave", relatedTarget?: EventTarget | null): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  if (type === "dragleave" && relatedTarget !== undefined) {
    Object.defineProperty(event, "relatedTarget", { value: relatedTarget });
  }
  target.dispatchEvent(event);
  return event;
}

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function inspectedArtwork(file: File, includeDimensions = true): InspectedArtworkFile {
  return {
    name: file.name,
    mimeType: "image/png",
    blob: new Blob(["already validated test artwork"], { type: "image/png" }),
    ...(includeDimensions ? { widthPx: 800, heightPx: 600 } : {}),
  };
}

describe("safe local artwork import and persistence (Slice 200)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const newFile = (name = "floral.png"): File => new File(["image"], name, { type: "image/png" });

  it("imports with the picker, saves only a stable asset reference, and reloads local artwork", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const inspector = vi.fn(async (file: File) => inspectedArtwork(file));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "chest-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready: floral.png"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    expect(assets.store.put).toHaveBeenCalledOnce();
    const assetId = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId!;
    expect(root.querySelector<HTMLInputElement>('input[data-surface-field="sourceName"]')!.value).toBe("floral.png");
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.surface["tee/Classic tee"].placements[0].assetId).toBe(assetId);
    expect(JSON.stringify(saved)).not.toContain("already validated test artwork");

    const reloaded = document.createElement("div");
    mountApp(reloaded, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    await vi.waitFor(() => expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: floral.png"));
    expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).not.toContain("missing");
    expect(inspector).toHaveBeenCalledOnce();
  });

  it("uses the desktop bridge by default instead of browser storage", async () => {
    localStorage.clear();
    const records = new Map<string, { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }>();
    const putArtworkAsset = vi.fn(async (asset: { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }) => {
      records.set(asset.assetId, asset);
    });
    const getArtworkAsset = vi.fn(async (assetId: string) => records.get(assetId) ?? null);
    const removeArtworkAsset = vi.fn(async (assetId: string) => { records.delete(assetId); });
    window.electronAPI = {
      saveFile: vi.fn(async () => ({ saved: false })),
      putArtworkAsset,
      getArtworkAsset,
      removeArtworkAsset,
    };
    try {
      const root = document.createElement("div");
      mountApp(root, { inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "desktop-logo";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(putArtworkAsset).toHaveBeenCalledOnce());
      expect([...records.values()][0]!.assetId).toMatch(/^local-/);
      root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
      const reloaded = document.createElement("div");
      mountApp(reloaded);
      await vi.waitFor(() => expect(getArtworkAsset).toHaveBeenCalledOnce());
      await vi.waitFor(() => expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally"));
    } finally {
      delete window.electronAPI;
    }
  });

  it("keeps desktop imports disabled when the local bridge is incomplete", async () => {
    localStorage.clear();
    window.electronAPI = { saveFile: vi.fn(async () => ({ saved: false })) };
    try {
      const root = document.createElement("div");
      mountApp(root, { inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "desktop-unavailable";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(root.querySelector("#surface-form-error")!.textContent).toContain("Desktop artwork storage is unavailable"));
      expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    } finally {
      delete window.electronAPI;
    }
  });

  it("creates and revokes object-URL previews for local images", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const previousCreate = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const previousRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    const createObjectUrl = vi.fn(() => "blob:local-artwork-preview");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    try {
      const root = document.createElement("div");
      mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "logo";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.getAttribute("src")).toBe("blob:local-artwork-preview"));
      const image = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!;
      expect(image.hidden).toBe(false);
      expect(createObjectUrl).toHaveBeenCalledOnce();
      root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:local-artwork-preview");
    } finally {
      if (previousCreate) Object.defineProperty(URL, "createObjectURL", previousCreate);
      else Reflect.deleteProperty(URL, "createObjectURL");
      if (previousRevoke) Object.defineProperty(URL, "revokeObjectURL", previousRevoke);
      else Reflect.deleteProperty(URL, "revokeObjectURL");
    }
  });

  it("creates a placement from a dropped file on the new-placement drop target", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "dropped-flower";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: { 0: newFile("flower.png"), length: 1 } as unknown as FileList },
    });
    root.querySelector<HTMLElement>("[data-surface-new-dropzone]")!.dispatchEvent(drop);
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready: flower.png"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    expect(assets.store.put).toHaveBeenCalledOnce();
    expect(root.querySelector<HTMLInputElement>('input[data-surface-field="sourceName"]')!.value).toBe("flower.png");
  });

  it("accepts a dropped file on an existing placement and preserves it if replacement storage fails", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "patch";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const row = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: { 0: newFile("badge.png"), length: 1 } as unknown as FileList },
    });
    row.dispatchEvent(drop);
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    const previousAssetId = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId;
    assets.setFailWrites(true);
    setFileInput(root.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!, newFile("replacement.png"));
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("previous placement is unchanged"));
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toBe(previousAssetId);
  });

  it("shows a missing asset distinctly and restores it with the file picker", async () => {
    localStorage.clear();
    const originalAssets = memoryArtworkStore();
    const first = document.createElement("div");
    mountApp(first, { artworkAssetStore: originalAssets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(first);
    first.querySelector<HTMLInputElement>("#surface-new-id")!.value = "mark";
    first.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(first.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(first.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    first.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(first.querySelector("[data-surface-asset-preview]")?.getAttribute("data-asset-id")).toMatch(/^local-/));
    first.querySelector<HTMLButtonElement>("#save-pattern")!.click();

    const emptyAssets = memoryArtworkStore();
    const second = document.createElement("div");
    mountApp(second, { artworkAssetStore: emptyAssets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    await vi.waitFor(() => expect(second.querySelector("[data-surface-asset-status]")!.textContent).toContain("image is missing"));
    const restoreInput = second.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    const chooseRestore = vi.fn();
    Object.defineProperty(restoreInput, "click", { configurable: true, value: chooseRestore });
    second.querySelector<HTMLButtonElement>('button[data-surface-asset-choose="0"]')!.click();
    expect(chooseRestore).toHaveBeenCalledOnce();
    setFileInput(restoreInput, newFile("restored.png"));
    await vi.waitFor(() => expect(second.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: restored.png"));
  });

  it("rejects a file clearly and blocks creation without changing design or storage", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, {
      artworkAssetStore: assets.store,
      inspectArtworkFile: async () => { throw new Error("SVG scripts are not allowed."); },
    });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "unsafe";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile("unsafe.svg"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("File rejected: SVG scripts"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("selected image was rejected");
  });

  it("keeps the new-file picker usable while checking and handles empty, multiple, and unknown-size selections", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const pending = deferred<InspectedArtworkFile>();
    const staleRejected = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File): Promise<InspectedArtworkFile> => {
      if (selected.name === "slow.png") return pending.promise;
      if (selected.name === "stale-broken.png") return staleRejected.promise;
      if (selected.name === "broken.png") return Promise.reject("decoder rejected the file");
      if (selected.name === "error.png") return Promise.reject(new Error("image decoder failed"));
      return Promise.resolve(inspectedArtwork(selected, false));
    });
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "local-art";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";

    const choose = root.querySelector<HTMLButtonElement>("#surface-new-choose-file")!;
    const input = root.querySelector<HTMLInputElement>("#surface-new-file")!;
    const pickerClick = vi.fn();
    Object.defineProperty(input, "click", { configurable: true, value: pickerClick });
    choose.click();
    expect(pickerClick).toHaveBeenCalledOnce();

    setFileInput(input, newFile("slow.png"));
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Checking slow.png");
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("Wait for the selected image");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");
    pending.resolve(inspectedArtwork(newFile("slow.png")));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");
    expect(assets.store.put).not.toHaveBeenCalled();

    setFileInput(input, newFile("stale-broken.png"));
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Checking stale-broken.png");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    staleRejected.reject(new Error("late inspection failure"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");

    setFileList(input, []);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("No file found");
    setFileList(input, [newFile("one.png"), newFile("two.png")]);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Choose one artwork file");
    setFileList(input, [], 1);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("could not be read");

    setFileInput(input, newFile("unknown-size.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("pixel size unknown"));
    setFileInput(input, newFile("broken.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Artwork could not be checked"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("selected image was rejected");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("");

    setFileInput(input, newFile("error.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("File rejected: image decoder failed"));
    vi.mocked(assets.store.put).mockRejectedValue("storage is read-only");
    setFileInput(input, newFile("storage-fail.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector("#surface-form-error")!.textContent).toContain("save failed"));
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
  });

  it("handles drag feedback and reports when a placement changes during replacement inspection", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const pending = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File) => selected.name === "stale.png"
      ? pending.promise
      : Promise.resolve(inspectedArtwork(selected)));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    const styleHost = root.querySelector<HTMLElement>("#style-host")!;

    const unrelatedDrag = dispatchArtworkDrag(styleHost, "dragover");
    expect(unrelatedDrag.defaultPrevented).toBe(false);
    const textTarget = document.createTextNode("not a drop target");
    styleHost.append(textTarget);
    expect(dispatchArtworkDrag(textTarget, "dragover").defaultPrevented).toBe(false);
    dispatchArtworkDrop(styleHost);

    const dropzone = root.querySelector<HTMLElement>("[data-surface-new-dropzone]")!;
    expect(dispatchArtworkDrag(dropzone, "dragover").defaultPrevented).toBe(true);
    expect(dropzone.classList.contains("is-dragging")).toBe(true);
    const inside = document.createElement("span");
    dropzone.append(inside);
    dispatchArtworkDrag(dropzone, "dragleave", inside);
    expect(dropzone.classList.contains("is-dragging")).toBe(true);
    dispatchArtworkDrag(dropzone, "dragleave", document.body);
    expect(dropzone.classList.contains("is-dragging")).toBe(false);
    dispatchArtworkDrop(dropzone);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("No file found");
    dispatchArtworkDrop(dropzone, [newFile("one.png"), newFile("two.png")]);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Choose one artwork file");
    dispatchArtworkDrop(dropzone, [], 1);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("could not be read");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();

    const orphanInput = document.createElement("input");
    orphanInput.dataset.surfaceAssetFile = "99";
    styleHost.append(orphanInput);
    setFileInput(orphanInput, newFile("orphan.png"));
    expect(inspector).not.toHaveBeenCalled();

    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "patch";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const row = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    const replacementInput = row.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    setFileList(replacementInput, []);
    expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("No file found");
    expect(dispatchArtworkDrag(row, "dragover").defaultPrevented).toBe(true);
    const rowChild = row.querySelector<HTMLElement>("[data-surface-asset-status]")!;
    dispatchArtworkDrag(row, "dragleave", rowChild);
    expect(row.classList.contains("is-dragging")).toBe(true);
    dispatchArtworkDrag(row, "dragleave", document.body);
    expect(row.classList.contains("is-dragging")).toBe(false);
    dispatchArtworkDrop(row, [newFile("stale.png")]);
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Checking stale.png"));
    const width = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "11";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    pending.resolve(inspectedArtwork(newFile("stale.png")));
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("placement changed while the file was being checked"));
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toBe("");

    vi.mocked(assets.store.put).mockRejectedValue("local profile is read-only");
    const currentRow = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    dispatchArtworkDrop(currentRow, [newFile("failed-replacement.png")]);
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("local save failed"));
    dispatchArtworkDrop(currentRow);
    expect(currentRow.querySelector("[data-surface-asset-status]")!.textContent).toContain("No file found");
    currentRow.querySelector<HTMLElement>("[data-surface-asset-status]")!.remove();
    dispatchArtworkDrop(currentRow);
  });

  it("ignores an older replacement selection after a newer file is chosen", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const older = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File) => selected.name === "older.png"
      ? older.promise
      : Promise.resolve(inspectedArtwork(selected)));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "badge";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const input = root.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    setFileInput(input, newFile("older.png"));
    expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Checking older.png");
    setFileInput(input, newFile("newer.png"));
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: newer.png"));
    older.resolve(inspectedArtwork(newFile("older.png")));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toMatch(/^local-/);
    expect(assets.records.size).toBe(1);
  });

  it("shows storage-unavailable preview feedback without a browser object-URL provider", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "logo";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toMatch(/^local-/));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();

    const previous = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: undefined });
    try {
      const noPreview = document.createElement("div");
      mountApp(noPreview, { artworkAssetStore: assets.store });
      await vi.waitFor(() => expect(noPreview.querySelector("[data-surface-asset-status]")!.textContent).toContain("preview is unavailable"));
    } finally {
      if (previous) Object.defineProperty(URL, "createObjectURL", previous);
      else Reflect.deleteProperty(URL, "createObjectURL");
    }

    vi.spyOn(assets.store, "get").mockRejectedValue("storage permission denied");
    const storageError = document.createElement("div");
    mountApp(storageError, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(storageError.querySelector("[data-surface-asset-status]")!.textContent).toContain("unknown error"));

    vi.mocked(assets.store.get).mockRejectedValue(new Error("local profile permission denied"));
    const detailedStorageError = document.createElement("div");
    mountApp(detailedStorageError, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(detailedStorageError.querySelector("[data-surface-asset-status]")!.textContent).toContain("local profile permission denied"));
  }, 15_000);

  it("blocks duplicate placement saves while a validated image is still being written", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const write = deferred<void>();
    vi.spyOn(assets.store, "put").mockImplementation(async (asset) => {
      await write.promise;
      assets.records.set(asset.assetId, asset);
    });
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    const library = root.querySelector<HTMLDetailsElement>("details.artwork-library")!;
    library.open = true;
    library.dispatchEvent(new Event("toggle", { bubbles: true }));
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "graphic";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const input = root.querySelector<HTMLInputElement>("#surface-new-file")!;
    const pickerClick = vi.fn();
    Object.defineProperty(input, "click", { configurable: true, value: pickerClick });
    setFileInput(input, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    const add = root.querySelector<HTMLButtonElement>("#surface-add")!;
    add.click();
    expect(add.disabled).toBe(true);
    add.dispatchEvent(new Event("click", { bubbles: true }));
    root.querySelector<HTMLButtonElement>("#surface-new-choose-file")!.click();
    expect(pickerClick).not.toHaveBeenCalled();
    expect(assets.store.put).toHaveBeenCalledOnce();
    root.querySelector<HTMLButtonElement>("[data-artwork-stage-id]")!.click();
    expect(root.querySelector<HTMLInputElement>("#surface-new-id")!.value).toBe("graphic");
    write.resolve();
    await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));
  });
});

describe("bundled local artwork library (Slice 203)", () => {
  const toStyleStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    const library = root.querySelector<HTMLDetailsElement>("details.artwork-library")!;
    const styleHost = root.querySelector<HTMLElement>("#style-host")!;
    const unrelatedToggle = document.createElement("div");
    styleHost.append(unrelatedToggle);
    unrelatedToggle.dispatchEvent(new Event("toggle", { bubbles: true }));
    unrelatedToggle.remove();
    library.open = true;
    library.dispatchEvent(new Event("toggle", { bubbles: true }));
    library.dispatchEvent(new Event("toggle", { bubbles: true }));
  };

  const savedDesign = (): Record<string, unknown> =>
    JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "{}") as Record<string, unknown>;

  it("searches, filters, and changes guidance without mutating the design or imported-art store", () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store });
    toStyleStep(root);
    clickId(root, "save-pattern");
    const before = localStorage.getItem("patternworks_save_v1");

    const search = root.querySelector<HTMLInputElement>("#surface-library-search")!;
    search.value = "  GAME   BIRDS ";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector(".artwork-library-result-count")!.textContent).toContain(`1 of ${ARTWORK_CATALOG.length}`);
    expect(root.querySelectorAll("[data-artwork-card]")).toHaveLength(1);
    expect(root.querySelector("[data-artwork-card]")!.textContent).toContain("Textile printed with game birds");

    const category = root.querySelector<HTMLSelectElement>("#surface-library-category")!;
    category.value = "dot/spot";
    category.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector(".artwork-library-result-count")!.textContent).toContain(`0 of ${ARTWORK_CATALOG.length}`);
    expect(root.querySelector("#surface-library-results")!.textContent).toContain("Clear or broaden");

    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    category.value = "";
    category.dispatchEvent(new Event("change", { bubbles: true }));
    const printUseFilter = root.querySelector<HTMLSelectElement>("#surface-library-use-filter")!;
    printUseFilter.value = "panel";
    printUseFilter.dispatchEvent(new Event("change", { bubbles: true }));
    const panelCount = ARTWORK_CATALOG.filter((item) => item.use.printUses.includes("panel")).length;
    expect(panelCount).toBeGreaterThan(0);
    expect(root.querySelectorAll("[data-artwork-card]")).toHaveLength(panelCount);
    printUseFilter.value = "";
    printUseFilter.dispatchEvent(new Event("change", { bubbles: true }));

    const family = root.querySelector<HTMLSelectElement>("#surface-library-family")!;
    family.value = ARTWORK_CATALOG[0]!.use.garmentFamilies[0]!;
    family.dispatchEvent(new Event("change", { bubbles: true }));
    const familyValue = family.value as (typeof ARTWORK_CATALOG)[number]["use"]["garmentFamilies"][number];
    const familyCount = ARTWORK_CATALOG.filter((item) => item.use.garmentFamilies.includes(familyValue)).length;
    expect(familyCount).toBeGreaterThan(0);
    expect(root.querySelectorAll("[data-artwork-card]")).toHaveLength(familyCount);
    family.value = "";
    family.dispatchEvent(new Event("change", { bubbles: true }));

    const role = root.querySelector<HTMLSelectElement>("#surface-library-role")!;
    role.value = ARTWORK_CATALOG[0]!.use.pieceRoleGroups[0]!;
    role.dispatchEvent(new Event("change", { bubbles: true }));
    const roleValue = role.value as (typeof ARTWORK_CATALOG)[number]["use"]["pieceRoleGroups"][number];
    const roleCount = ARTWORK_CATALOG.filter((item) => item.use.pieceRoleGroups.includes(roleValue)).length;
    expect(roleCount).toBeGreaterThan(0);
    expect(root.querySelectorAll("[data-artwork-card]")).toHaveLength(roleCount);
    role.value = "";
    role.dispatchEvent(new Event("change", { bubbles: true }));

    const use = root.querySelector<HTMLSelectElement>("#surface-library-assess-use")!;
    use.value = "all-over";
    use.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelectorAll("[data-artwork-card]")).toHaveLength(ARTWORK_CATALOG.length);
    expect(root.querySelector(".artwork-library-assessment h5")!.textContent).toContain("Needs review");
    expect(localStorage.getItem("patternworks_save_v1")).toBe(before);
    expect(assets.store.get).not.toHaveBeenCalled();
    expect(assets.store.put).not.toHaveBeenCalled();

    const target = root.querySelector<HTMLSelectElement>("#surface-library-target")!;
    target.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#surface-library-action-status")!.textContent).toContain("Choose a reference to stage");
    const unavailableTarget = root.querySelector<HTMLButtonElement>("[data-artwork-apply-id]")!;
    unavailableTarget.dispatchEvent(new Event("click", { bubbles: true }));
    unavailableTarget.disabled = false;
    unavailableTarget.click();
    expect(root.querySelector("#surface-library-action-status")!.textContent).toContain("Choose an existing placement");
    const unknownStage = document.createElement("button");
    unknownStage.dataset.artworkStageId = "builtin-met-999999";
    root.querySelector("#style-host")!.append(unknownStage);
    unknownStage.click();
    const unknownCmaStage = document.createElement("button");
    unknownCmaStage.dataset.artworkStageId = "builtin-cma-999999";
    root.querySelector("#style-host")!.append(unknownCmaStage);
    unknownCmaStage.click();
    const unknownApply = document.createElement("button");
    unknownApply.dataset.artworkApplyId = "builtin-met-999999";
    root.querySelector("#style-host")!.append(unknownApply);
    unknownApply.click();
    expect(localStorage.getItem("patternworks_save_v1")).toBe(before);
  });

  it("stages a bundled item, saves its stable ID, and reloads its preview without imported storage", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store });
    toStyleStep(root);
    const record = ARTWORK_CATALOG[0]!;
    root.querySelector<HTMLButtonElement>(`[data-artwork-stage-id="${record.assetId}"]`)!.click();

    expect(root.querySelector<HTMLInputElement>("#surface-new-id")!.value).toContain("textile-printed-with-game-birds");
    expect(root.querySelector<HTMLInputElement>("#surface-new-role")!.value).toBe("");
    expect(root.querySelector<HTMLInputElement>("#surface-new-source")!.value).toContain(record.title);
    expect(Number(root.querySelector<HTMLInputElement>("#surface-new-width")!.value)).toBe(record.use.suggestedPlacementWidthCm.maximum);
    expect(Number(root.querySelector<HTMLInputElement>("#surface-new-height")!.value)).toBeCloseTo(
      record.use.suggestedPlacementWidthCm.maximum * record.image.heightPx / record.image.widthPx,
      2,
    );
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("bundled reference");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(assets.store.get).not.toHaveBeenCalled();

    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLInputElement>("#surface-new-source")!.value = "";
    clickId(root, "surface-add");
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toBe(record.assetId));
    const preview = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!;
    expect(preview.src).toBe(record.image.localImageUrl);
    expect(preview.alt).toBe(`Bundled artwork reference: ${record.title}`);
    expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("not the imported-artwork store");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="sourceName"]')!.value).toContain(record.title);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(assets.store.get).not.toHaveBeenCalled();

    const firstPlacementId = root.querySelector<HTMLInputElement>('[data-surface-field="id"]')!.value;
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "";
    root.querySelector<HTMLButtonElement>(`[data-artwork-stage-id="${record.assetId}"]`)!.click();
    expect(root.querySelector<HTMLInputElement>("#surface-new-id")!.value).toBe(`${firstPlacementId}-2`);

    clickId(root, "save-pattern");
    const saved = savedDesign();
    const savedSurface = (saved.surface as Record<string, { placements: Array<Record<string, unknown>> }>)["tee/Classic tee"]!;
    expect(savedSurface.placements[0]!.assetId).toBe(record.assetId);
    expect(savedSurface.placements[0]!.sourcePxWidth).toBe(record.image.widthPx);
    expect(savedSurface.placements[0]!.sourcePxHeight).toBe(record.image.heightPx);
    expect(JSON.stringify(savedSurface)).not.toContain(record.source.originalImageUrl);

    const reloaded = document.createElement("div");
    mountApp(reloaded, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Bundled reference:"));
    const reloadedPreview = reloaded.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!;
    expect(reloadedPreview.dataset.assetId).toBe(record.assetId);
    expect(reloadedPreview.src).toBe(record.image.localImageUrl);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(assets.store.get).not.toHaveBeenCalled();

    reloadedPreview.onerror?.(new Event("error"));
    expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Bundled preview unavailable");
    expect(reloadedPreview.hidden).toBe(true);
    const previewFailure = reloaded.querySelector("[data-surface-asset-status]")!.textContent;
    reloadedPreview.remove();
    reloadedPreview.onerror?.(new Event("error"));
    expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toBe(previewFailure);

    const staleDesign = savedDesign() as { surface: Record<string, { placements: Array<Record<string, unknown>> }> };
    staleDesign.surface["tee/Classic tee"]!.placements[0]!.assetId = "builtin-met-999999";
    localStorage.setItem("patternworks_save_v1", JSON.stringify(staleDesign));
    const missingReference = document.createElement("div");
    mountApp(missingReference, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(missingReference.querySelector("[data-surface-asset-status]")!.textContent).toContain("no longer available"));
    expect(missingReference.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.hidden).toBe(true);
    expect(assets.store.get).not.toHaveBeenCalled();
  });

  it("stages and reloads a CMA reference using its institution and accession number", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store });
    toStyleStep(root);
    const record = ARTWORK_CATALOG.find((item) => item.assetId === "builtin-cma-109638")!;
    root.querySelector<HTMLButtonElement>(`[data-artwork-stage-id="${record.assetId}"]`)!.click();
    expect(root.querySelector<HTMLInputElement>("#surface-new-source")!.value)
      .toContain("Cleveland Museum of Art record 1928.269");
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    clickId(root, "surface-add");
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId)
      .toBe(record.assetId));
    clickId(root, "save-pattern");
    const saved = savedDesign();
    const savedSurface = (saved.surface as Record<string, { placements: Array<Record<string, unknown>> }>)
      ["tee/Classic tee"]!;
    expect(savedSurface.placements[0]!.assetId).toBe("builtin-cma-109638");
    expect(savedSurface.placements[0]!.sourceName).toContain("Cleveland Museum of Art record 1928.269");
    expect(JSON.stringify(savedSurface)).not.toContain("openaccess-cdn.clevelandart.org");

    const reloaded = document.createElement("div");
    mountApp(reloaded, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(reloaded.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId)
      .toBe(record.assetId));
    expect(reloaded.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.src)
      .toBe(record.image.localImageUrl);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(assets.store.get).not.toHaveBeenCalled();
  });

  it("keeps manual placement creation working with no artwork or source reference", async () => {
    localStorage.clear();
    const root = document.createElement("div");
    mountApp(root);
    toStyleStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "unlinked-placement";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLInputElement>("#surface-new-width")!.value = "10";
    root.querySelector<HTMLInputElement>("#surface-new-height")!.value = "6";

    clickId(root, "surface-add");
    await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));

    expect(root.querySelector<HTMLInputElement>('[data-surface-field="sourceName"]')!.value).toBe("");
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.hidden).toBe(true);
  });

  it("keeps the artwork target aligned when its placement or an earlier placement is removed", async () => {
    localStorage.clear();
    const root = document.createElement("div");
    mountApp(root);
    toStyleStep(root);

    const addBundledPlacement = async (recordIndex: number): Promise<void> => {
      const record = ARTWORK_CATALOG[recordIndex]!;
      const expectedPlacementCount = root.querySelectorAll("[data-surface-row]").length + 1;
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "";
      root.querySelector<HTMLButtonElement>(`[data-artwork-stage-id="${record.assetId}"]`)!.click();
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      clickId(root, "surface-add");
      await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(expectedPlacementCount));
    };

    await addBundledPlacement(0);
    await addBundledPlacement(1);
    let target = root.querySelector<HTMLSelectElement>("#surface-library-target")!;
    target.value = "0";
    target.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    expect(root.querySelector<HTMLSelectElement>("#surface-library-target")!.value).toBe("");

    await addBundledPlacement(2);
    const shiftedPlacementId = root.querySelector<HTMLInputElement>('input[data-surface-index="1"][data-surface-field="id"]')!.value;
    target = root.querySelector<HTMLSelectElement>("#surface-library-target")!;
    target.value = "1";
    target.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    expect(root.querySelector<HTMLSelectElement>("#surface-library-target")!.value).toBe("0");
    expect(root.querySelector("#surface-library-action-status")!.textContent).toContain(`Placement ${shiftedPlacementId} selected`);
  });

  it("uses the stable bundled ID when an artwork title cannot form a placement name", () => {
    localStorage.clear();
    const record = ARTWORK_CATALOG[0]!;
    const titleDescriptor = Object.getOwnPropertyDescriptor(record, "title")!;
    Object.defineProperty(record, "title", { ...titleDescriptor, value: "--- !!!" });
    try {
      const root = document.createElement("div");
      mountApp(root);
      toStyleStep(root);
      root.querySelector<HTMLButtonElement>(`[data-artwork-stage-id="${record.assetId}"]`)!.click();
      expect(root.querySelector<HTMLInputElement>("#surface-new-id")!.value).toBe(record.assetId);
    } finally {
      Object.defineProperty(record, "title", titleDescriptor);
    }
  });

  it("replaces an existing placement's artwork metadata without changing its design values", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store });
    toStyleStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "existing-placement";
    root.querySelector<HTMLSelectElement>("#surface-new-kind")!.value = "patch";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLInputElement>("#surface-new-width")!.value = "18.75";
    root.querySelector<HTMLInputElement>("#surface-new-height")!.value = "12.5";
    root.querySelector<HTMLInputElement>("#surface-new-source")!.value = "Previous source note";
    clickId(root, "surface-add");
    await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));

    const edit = (field: string, value: string): void => {
      const control = root.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-surface-index="0"][data-surface-field="${field}"]`,
      )!;
      control.value = value;
      control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? "change" : "focusout", { bubbles: true }));
    };
    edit("dx", "3.25");
    edit("dy", "-2.5");
    edit("scale", "1.4");
    edit("rotationDeg", "37");
    edit("zOrder", "5");
    edit("sourcePxWidth", "900");
    edit("sourcePxHeight", "600");

    const record = ARTWORK_CATALOG[1]!;
    const placementTarget = root.querySelector<HTMLSelectElement>("#surface-library-target")!;
    placementTarget.value = "0";
    placementTarget.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>(`[data-artwork-apply-id="${record.assetId}"]`)!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toBe(record.assetId));

    expect(root.querySelector<HTMLInputElement>('[data-surface-field="id"]')!.value).toBe("existing-placement");
    expect(root.querySelector<HTMLSelectElement>('[data-surface-field="kind"]')!.value).toBe("patch");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="pieceRole"]')!.value).toBe("front");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="widthCm"]')!.value).toBe("18.75");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="heightCm"]')!.value).toBe("12.5");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="dx"]')!.value).toBe("3.25");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="dy"]')!.value).toBe("-2.5");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="scale"]')!.value).toBe("1.4");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="rotationDeg"]')!.value).toBe("37");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="zOrder"]')!.value).toBe("5");
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="sourcePxWidth"]')!.value).toBe(String(record.image.widthPx));
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="sourcePxHeight"]')!.value).toBe(String(record.image.heightPx));
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="sourceName"]')!.value).toContain(record.title);
    expect(root.querySelector("#surface-library-action-status")!.textContent).toContain("were preserved");
    expect(assets.store.get).not.toHaveBeenCalled();
    expect(assets.store.put).not.toHaveBeenCalled();

    clickId(root, "save-pattern");
    const saved = savedDesign();
    const placement = (saved.surface as Record<string, { placements: Array<Record<string, unknown>> }>)["tee/Classic tee"]!.placements[0]!;
    expect(placement).toMatchObject({
      id: "existing-placement", kind: "patch", pieceRole: "front", widthCm: 18.75, heightCm: 12.5,
      assetId: record.assetId, sourcePxWidth: record.image.widthPx, sourcePxHeight: record.image.heightPx,
      zOrder: 5, sourceName: expect.stringContaining(record.title),
      transform: { dx: 3.25, dy: -2.5, scale: 1.4, rotationDeg: 37 },
    });
  });
});
