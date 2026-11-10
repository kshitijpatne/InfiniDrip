// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { mountApp, unmountApp } from "./app";

import { inspectionMarkup } from "./view";

import { GARMENTS, STANDARD_M, gradeRun, rolePiece } from "../drafting";

import { edgeLength, pieceEdge, type Piece } from "../drafting/piece";

import { teeNeckbandSettings, teeNeckbandTemplateSvg } from "../drafting/tshirt";

import * as teeDrafting from "../drafting/tshirt";

import { STARTER_REGISTRY } from "./starter-registry";

import { createDxfInterchangePackage } from "../export/dxf-interchange-package";

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

describe("mountApp", () => {


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

  it("uses the solid inspection-toolbar grouping by default and preserves exact flag-off markup", () => {
    localStorage.clear();
    const enabled = mount();
    const enabledToolbar = enabled.querySelector<HTMLElement>("#inspection-toolbar")!;
    expect(enabledToolbar.classList.contains("uiq-inspection-toolbar")).toBe(true);
    expect(enabledToolbar.classList.contains("uiq-inspection-toolbar--opaque")).toBe(true);
    expect(enabledToolbar.querySelectorAll("button[data-inspection-zoom]")).toHaveLength(3);
    expect(enabledToolbar.querySelectorAll(".uiq-inspection-toolbar__button")).toHaveLength(3);
    enabled.querySelector<HTMLButtonElement>('button[data-inspection-zoom="out"]')!.click();
    expect(enabled.querySelector("#inspection-zoom")!.textContent).toBe("75%");
    enabled.querySelector<HTMLButtonElement>('button[data-inspection-zoom="fit"]')!.click();
    expect(enabled.querySelector("#inspection-zoom")!.textContent).toBe("100%");

    const disabled = mount({ uiqInspectionToolbarEnabled: false });
    const expected = document.createElement("div");
    expected.innerHTML = inspectionMarkup("<p>fixture</p>", "pattern");
    const disabledToolbar = disabled.querySelector<HTMLElement>("#inspection-toolbar")!;
    expect(disabledToolbar.outerHTML).toBe(expected.querySelector<HTMLElement>("#inspection-toolbar")!.outerHTML);
    expect(disabledToolbar.classList.contains("uiq-inspection-toolbar")).toBe(false);
    expect(disabledToolbar.querySelectorAll(".uiq-inspection-toolbar__button")).toHaveLength(0);
    disabled.querySelector<HTMLButtonElement>('button[data-inspection-zoom="out"]')!.click();
    expect(disabled.querySelector("#inspection-zoom")!.textContent).toBe("75%");
  });

  it("keeps solid-only toolbar classes on paused renders and exact legacy fallback when disabled", () => {
    localStorage.clear();
    const enabled = mount({ uiqInspectionToolbarEnabled: true });
    const enabledChest = enabled.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    enabledChest.value = "";
    enabledChest.dispatchEvent(new Event("input", { bubbles: true }));
    expect(enabled.querySelector("#canvas-host [role='status']")?.textContent).toContain("Draft paused");
    expect(enabled.querySelector<HTMLElement>("#inspection-toolbar")!.classList.contains("uiq-inspection-toolbar--opaque")).toBe(true);

    const disabled = mount({ uiqInspectionToolbarEnabled: false });
    const disabledChest = disabled.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    disabledChest.value = "";
    disabledChest.dispatchEvent(new Event("input", { bubbles: true }));
    expect(disabled.querySelector("#canvas-host [role='status']")?.textContent).toContain("Draft paused");
    const expected = document.createElement("div");
    expected.innerHTML = inspectionMarkup("<p>fixture</p>", "pattern");
    const disabledToolbar = disabled.querySelector<HTMLElement>("#inspection-toolbar")!;
    expect(disabledToolbar.outerHTML).toBe(expected.querySelector<HTMLElement>("#inspection-toolbar")!.outerHTML);
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

  it("integrates shorts controls, woven material, real-role Body views, and assembled output", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-shorts");

    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton woven");
    expect(root.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!.value).toBe("20");
    expect(root.querySelector<HTMLInputElement>('[data-option="hemOpening"]')!.value).toBe("60");
    expect(root.querySelector<HTMLInputElement>('[data-option="pocketBagDepth"]')!.value).toBe("13");
    expect(root.querySelector('input[data-field="knee"]')).toBeNull();
    expect(root.querySelector("#controls-panel")!.textContent).toContain("Target finished thigh girth");
    const thighTarget = root.querySelector<HTMLElement>('[data-dim-row="thigh"]')!;
    expect(thighTarget.textContent).toContain("finished · circ");
    expect(thighTarget.closest("[data-control-page]")?.getAttribute("data-control-label")).toBe("Finished targets");

    const length = root.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!;
    length.value = "46";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(length.value).toBe("46");
    expect(length.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector<HTMLElement>("#error-option-shortsInseam")!.textContent).toContain("45");
    length.value = "20";
    length.dispatchEvent(new Event("input", { bubbles: true }));

    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();
    expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton woven"]')!.click();

    clickId(root, "view-body");
    let svgs = root.querySelectorAll<SVGSVGElement>("#analysis-host svg");
    expect(svgs).toHaveLength(2);
    expect(svgs[0].getAttribute("data-croquis-view")).toBe("front");
    expect(svgs[0].querySelector('[data-role="frontLeft"]')).not.toBeNull();
    expect(svgs[0].querySelector('[data-role="waistband"]')).not.toBeNull();
    expect(svgs[0].querySelector('[data-role="pocketBagLeft"]')).not.toBeNull();
    expect(svgs[0].querySelector('[data-dim="thigh"]')?.textContent).toContain("Finished thigh target");
    expect(`${svgs[0].textContent}${svgs[0].innerHTML}`).not.toMatch(/knee/i);

    clickId(root, "body-front");
    svgs = root.querySelectorAll<SVGSVGElement>("#analysis-host svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute("data-croquis-view")).toBe("front");
    expect(svgs[0].querySelector('[data-role="frontLeft"]')).not.toBeNull();

    clickId(root, "body-back");
    svgs = root.querySelectorAll<SVGSVGElement>("#analysis-host svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute("data-croquis-view")).toBe("back");
    expect(svgs[0].querySelector('[data-role="backLeft"]')).not.toBeNull();

    clickId(root, "body-side");
    const side = root.querySelector<SVGSVGElement>("#analysis-host svg")!;
    expect(side.getAttribute("data-croquis-view")).toBe("side");
    expect(side.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
    expect(side.textContent).toContain("SHORTS DRAFT");
    expect(side.textContent).not.toMatch(/knee/i);

    clickId(root, "assembled-preview-toggle");
    const assembled = root.querySelector<SVGSVGElement>("#garment-host svg")!;
    expect(assembled.getAttribute("data-garment")).toBe("shorts");
    expect(assembled.querySelector('[data-role="frontLeft"]')).not.toBeNull();
    expect(assembled.querySelector('[data-role="backLeft"]')).not.toBeNull();
    expect(assembled.querySelector('[data-role="waistband"]')).not.toBeNull();
    expect(assembled.querySelector('[data-role="flyShield"]')).not.toBeNull();
    expect(assembled.querySelector('[data-role="pocketBagRight"]')).not.toBeNull();
    expect(assembled.querySelector("parsererror")).toBeNull();
    expect(assembled.textContent).not.toMatch(/knee/i);
  });

  it("preserves shorts option raw state through recovery and bounded undo/redo", () => {
    localStorage.clear();
    const first = mount();
    clickId(first, "garment-shorts");
    const length = first.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!;
    const waist = first.querySelector<HTMLInputElement>('[data-field="waist"]')!.value;
    length.value = "24";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(first, "undo-pattern");
    expect(first.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!.value).toBe("20");
    expect(first.querySelector<HTMLInputElement>('[data-field="waist"]')!.value).toBe(waist);
    clickId(first, "redo-pattern");
    expect(first.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!.value).toBe("24");

    const pocketDrop = first.querySelector<HTMLInputElement>('[data-option="pocketDrop"]')!;
    pocketDrop.value = "";
    pocketDrop.dispatchEvent(new Event("input", { bubbles: true }));
    const recovered = mount();
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLButtonElement>("#garment-shorts")!.getAttribute("aria-pressed")).toBe("true");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="shortsInseam"]')!.value).toBe("24");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="pocketDrop"]')!.value).toBe("");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="pocketDrop"]')!.getAttribute("aria-invalid")).toBe("true");
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

  it("creates a scale-marked Tee neckband template from the live half-necklines", () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = tee.draft(STANDARD_M);
    const front = rolePiece(block, "front");
    const back = rolePiece(block, "back");
    const svg = teeNeckbandTemplateSvg([front, back], 75, 2);
    const document = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = document.documentElement;
    const necklineCm = 2 * (
      edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline"))
    );
    const cutLengthCm = necklineCm * 0.75 + 2;
    const cutWidthCm = 2 * (2 + 0.6);
    const formatted = (value: number): string => Number(value.toFixed(3)).toString();

    expect(document.querySelector("parsererror")).toBeNull();
    expect(root.getAttribute("width")).toBe(`${formatted(cutLengthCm + 2)}cm`);
    expect(root.getAttribute("height")).toBe(`${formatted(2 + cutWidthCm + 2.4)}cm`);
    expect(root.getAttribute("data-neckline-circumference-cm")).toBe(formatted(necklineCm));
    expect(root.getAttribute("data-loop-seamline-cm")).toBe(formatted(necklineCm * 0.75));
    expect(root.getAttribute("data-cut-length-cm")).toBe(formatted(cutLengthCm));
    expect(root.getAttribute("data-cut-width-cm")).toBe(formatted(cutWidthCm));
    expect(root.querySelectorAll("[data-neckline-seamline]")).toHaveLength(2);
    expect(root.querySelectorAll("[data-end-seamline]")).toHaveLength(2);
    expect(root.querySelectorAll("[data-quarter-notch]")).toHaveLength(3);
    expect(root.querySelector("[data-fold-line]")).not.toBeNull();
    expect(root.querySelector("[data-stretch-direction='lengthwise']")).not.toBeNull();
    const cutInstruction = [...root.querySelectorAll("text")].find((node) => node.textContent?.includes("CUT 1 RIB"))!;
    const cutOutline = root.querySelector("[data-cut-outline]")!;
    expect(cutInstruction.textContent).toContain("FOLD ON DASH-DOT LINE");
    expect(Number(cutInstruction.getAttribute("y"))).toBeLessThan(Number(cutOutline.getAttribute("y")));
    expect([...root.querySelectorAll("text")].find((node) => node.textContent?.includes("seam allowance"))
      ?.getAttribute("font-size")).toBe("0.22");
    const calibration = root.querySelector("[data-calibration-length-cm='10']")!;
    expect(calibration.getAttribute("x2")).toBe(String(Number(calibration.getAttribute("x1")) + 10));
    expect(root.textContent).toContain("75.0%");
    expect(root.textContent).toContain("fit/recovery not validated");
  });

  it("uses frozen custom-size neckband options and falls back to live Tee controls", () => {
    const current = { teeNeckbandLengthPercent: 75, teeNeckbandFinishedWidthCm: 2 };
    const planned = { options: { teeNeckbandLengthPercent: 86, teeNeckbandFinishedWidthCm: 2.4 } };
    const legacy = { options: { chestEase: 10 } };
    const partial = { options: { teeNeckbandLengthPercent: 86 } };

    expect(teeNeckbandSettings(undefined, current)).toEqual({ lengthPercent: 75, finishedWidthCm: 2 });
    expect(teeNeckbandSettings(planned, current)).toEqual({ lengthPercent: 86, finishedWidthCm: 2.4 });
    expect(teeNeckbandSettings(legacy, current)).toEqual({ lengthPercent: 75, finishedWidthCm: 2 });
    expect(teeNeckbandSettings(partial, current)).toEqual({ lengthPercent: 86, finishedWidthCm: 2 });
  });

  it("rejects invalid neckband settings and incomplete or unusable Tee geometry", () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = tee.draft(STANDARD_M);
    const front = rolePiece(block, "front");
    const back = rolePiece(block, "back");
    const linePiece = (name: string, endX: number): Piece => ({
      name,
      onFold: true,
      edges: [{ kind: "line", name: "neckline", start: { x: 0, y: 0 }, end: { x: endX, y: 0 } }],
    });

    expect(() => teeNeckbandTemplateSvg([back], 75, 2)).toThrow("front and back pieces");
    expect(() => teeNeckbandTemplateSvg([front], 75, 2)).toThrow("front and back pieces");
    expect(() => teeNeckbandTemplateSvg([
      { ...front, edges: front.edges.filter((edge) => edge.name !== "neckline") }, back,
    ], 75, 2)).toThrow('has no edge named "neckline"');
    expect(() => teeNeckbandTemplateSvg([linePiece("front", Number.POSITIVE_INFINITY), linePiece("back", 3)], 75, 2))
      .toThrow("geometry is not usable");
    expect(() => teeNeckbandTemplateSvg([linePiece("front", 3), linePiece("back", 0)], 75, 2))
      .toThrow("geometry is not usable");
    expect(() => teeNeckbandTemplateSvg([front, back], 74, 2)).toThrow("Neckband length must be");
    expect(() => teeNeckbandTemplateSvg([front, back], 91, 2)).toThrow("Neckband length must be");
    expect(() => teeNeckbandTemplateSvg([front, back], Number.NaN, 2)).toThrow("Neckband length must be");
    expect(() => teeNeckbandTemplateSvg([front, back], 75, 1.4)).toThrow("Finished neckband width must be");
    expect(() => teeNeckbandTemplateSvg([front, back], 75, 3.1)).toThrow("Finished neckband width must be");
    expect(() => teeNeckbandTemplateSvg([front, back], 75, Number.NaN)).toThrow("Finished neckband width must be");
    expect(() => teeNeckbandTemplateSvg([front, back], 90, 3)).not.toThrow();
  });

  it("keeps the neckband control Tee-only and downloads the selected adjustable template separately", async () => {
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    try {
      const root = mount();
      const teeRecipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      expect(teeRecipe.options?.map((option) => option.id)).not.toEqual(expect.arrayContaining([
        "teeNeckbandLengthPercent", "teeNeckbandFinishedWidthCm",
      ]));
      expect(root.querySelector('#controls-panel input[data-option="teeNeckbandLengthPercent"]')).toBeNull();
      expect(root.querySelector('#controls-panel input[data-option="teeNeckbandFinishedWidthCm"]')).toBeNull();
      const ratio = root.querySelector<HTMLInputElement>('input[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      const finishedWidth = root.querySelector<HTMLInputElement>('input[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!;
      expect(ratio.value).toBe("75");
      expect(finishedWidth.value).toBe("2");
      reachExportStage(root);
      ratio.value = "85";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      finishedWidth.value = "2.3";
      finishedWidth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLButtonElement>("#journey-step-output")?.getAttribute("aria-current")).toBe("step");
      clickId(root, "export-tee-neckband");
      await vi.waitFor(() => expect(files.has("tee-M-neckband.svg")).toBe(true));

      expect([...files.keys()]).toEqual(["tee-M-neckband.svg"]);
      expect(files.get("tee-M-neckband.svg")).toContain("at 85.0%");
      expect(files.get("tee-M-neckband.svg")).toContain('data-cut-width-cm="5.8"');
      expect(files.get("tee-M-neckband.svg")).toContain('data-calibration-length-cm="10"');

      const scope = root.querySelector<HTMLElement>('[data-export-scope="tee-neckband"]')!;
      clickId(root, "garment-tank");
      expect(scope.hidden).toBe(true);
      root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled = false;
      clickId(root, "export-tee-neckband");
      expect(files.size).toBe(1);
      clickId(root, "garment-tee");
      expect(scope.hidden).toBe(false);
    } finally {
      delete window.electronAPI;
    }
  });

  it("derives the selected-size Scoop neckband output from the active rounded neckline", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    try {
      const root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-tee-scoop-digital-v1");
      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(false);
      clickId(root, "export-tee-neckband");
      await vi.waitFor(() => expect(files.has("tee-M-neckband.svg")).toBe(true));

      const output = files.get("tee-M-neckband.svg")!;
      const circumference = Number(output.match(/data-neckline-circumference-cm="([^"]+)"/)?.[1]);
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-scoop-digital-v1")!;
      const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const selectedBlock = tee.draft(
        { ...STANDARD_M, ...entry.configuration.measurements },
        entry.configuration.options,
      );
      const expectedCircumference = 2 * (
        edgeLength(pieceEdge(rolePiece(selectedBlock, "front"), "neckline")) +
        edgeLength(pieceEdge(rolePiece(selectedBlock, "back"), "neckline"))
      );
      expect(circumference).toBeCloseTo(expectedCircumference, 3);
      expect(output).toContain("selected Tee front and back neckline curves");
      root.remove();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("round-trips neckband settings across a Tee body-option edit, Save/Load, and export", async () => {
    localStorage.clear();
    const root = mount();
    const style = root.querySelector<HTMLSelectElement>("#style-target")!;
    style.value = "Classic tee";
    style.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-set-option="chestEase"]')!.click();
    const chestEase = root.querySelector<HTMLInputElement>('[data-option="chestEase"]')!;
    chestEase.value = "7";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    const ratio = root.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!;
    const width = root.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!;
    clickId(root, "save-pattern");
    ratio.value = "84";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    width.value = "2.4";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(ratio.value).toBe("75");
    expect(width.value).toBe("2");
    ratio.value = "84";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    width.value = "2.4";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    chestEase.value = "8";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ratio.value).toBe("84");
    expect(width.value).toBe("2.4");
    clickId(root, "save-pattern");
    ratio.value = "78";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    width.value = "2.1";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(ratio.value).toBe("84");
    expect(width.value).toBe("2.4");
    expect(root.querySelector<HTMLInputElement>('[data-option="chestEase"]')!.value).toBe("8");

    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    try {
      reachExportStage(root);
      clickId(root, "export-tee-neckband");
      await vi.waitFor(() => expect(files.has("tee-M-neckband.svg")).toBe(true));
      expect(files.get("tee-M-neckband.svg")).toContain("at 84.0%");
      expect(files.get("tee-M-neckband.svg")).toContain('data-cut-width-cm="6"');
    } finally {
      delete window.electronAPI;
    }
  });
  it("hydrates saved neckband output settings when reopening the workspace", () => {
    localStorage.clear();
    const first = mount();
    const ratio = first.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!;
    const width = first.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!;
    ratio.value = "87";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    width.value = "2.7";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(first, "save-pattern");

    const reopened = mount();
    expect(reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!.value).toBe("87");
    expect(reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!.value).toBe("2.7");
  });

  it("restores neckband output settings from local recovery", () => {
    localStorage.clear();
    const first = mount();
    const ratio = first.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!;
    const width = first.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!;
    ratio.value = "86";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    width.value = "2.6";
    width.dispatchEvent(new Event("input", { bubbles: true }));

    const recovered = mount();
    expect(recovered.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found");
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!.value).toBe("86");
    expect(recovered.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!.value).toBe("2.6");
  });

  it("rejects invalid neckband output settings with a specific correction and no download", () => {
    const saveFile = vi.fn(async () => ({ saved: true }));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      const ratio = root.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandLengthPercent]')!;
      const width = root.querySelector<HTMLInputElement>('[data-tee-neckband-option=teeNeckbandFinishedWidthCm]')!;
      ratio.value = "74";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.validationMessage).toContain("75–90%");
      expect(root.querySelector("#tee-neckband-control-error")?.textContent).toContain("75–90%");
      ratio.value = "91";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.validationMessage).toContain("75–90%");
      ratio.value = "75.5";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.validationMessage).toContain("increments of 1%");
      width.value = "2.35";
      width.dispatchEvent(new Event("input", { bubbles: true }));
      expect(width.validationMessage).toContain("0.1 cm");
      ratio.value = "";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.validationMessage).toContain("enter a value");
      Object.defineProperty(ratio, "value", { configurable: true, value: "1e999" });
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.getAttribute("aria-invalid")).toBe("true");
      clickId(root, "export-tee-neckband");
      expect(saveFile).not.toHaveBeenCalled();
      expect(root.querySelector("#persist-status")?.textContent).toContain("finite number");
    } finally {
      delete window.electronAPI;
    }
  });
  it("reports neckband template generation errors without writing a partial file", () => {
    const generate = vi.spyOn(teeDrafting, "teeNeckbandTemplateSvg")
      .mockImplementationOnce(() => { throw new Error("neckline geometry unavailable"); })
      .mockImplementationOnce(() => { throw "non-Error geometry failure"; });
    const saveFile = vi.fn(async () => ({ saved: true }));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-tee-neckband");
      expect(saveFile).not.toHaveBeenCalled();
      expect(root.querySelector("#persist-status")?.textContent).toContain("neckline geometry unavailable");

      const fallbackRoot = mount();
      reachExportStage(fallbackRoot);
      clickId(fallbackRoot, "export-tee-neckband");
      expect(saveFile).not.toHaveBeenCalled();
      expect(fallbackRoot.querySelector("#persist-status")?.textContent)
        .toContain("The neckband template could not be generated.");
    } finally {
      generate.mockRestore();
      delete window.electronAPI;
    }
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

  it("exports the opt-in source-bound CAD DXF and integrity package without changing the legacy DXF", async () => {
    const files = new Map<string, string>();
    window.electronAPI = { saveFile: vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    }) };
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    try {
      const root = mount();
      reachExportStage(root);
      root.querySelector<HTMLButtonElement>("#export-cad-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      await vi.waitFor(() => expect(files.size).toBe(2), { timeout: 10_000 });

      expect([...files.keys()].sort()).toEqual([
        "tee-M-cad-exchange-source.json", "tee-M-cad-exchange.dxf",
      ]);
      const packageJson = JSON.parse(files.get("tee-M-cad-exchange-source.json")!) as {
        dxf: string; manifest: { schemaVersion: string; profileLabel: string; units: { length: string } };
      };
      expect(files.get("tee-M-cad-exchange.dxf")).toBe(packageJson.dxf);
      expect(packageJson.manifest.schemaVersion).toBe("infinidrip.g04.dxf-package/5");
      expect(packageJson.manifest.profileLabel).toBe("generic-dxf-centimeters-with-recipe-marks");
      expect(packageJson.manifest.units.length).toBe("cm");
      expect(packageJson.dxf).toContain("$INSUNITS");
      expect(packageJson.dxf).toContain("POLYLINE");
    } finally {
      delete window.electronAPI;
    }
  });

  it("audits a returned CAD DXF from the app panel using local file readers", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[0]!;
    const sourcePackage = await createDxfInterchangePackage(recipe, graded);
    const sourceFile = new File([""], "source.json");
    const returnedFile = new File([""], "returned.dxf");
    Object.defineProperty(sourceFile, "text", { value: async () => JSON.stringify(sourcePackage) });
    Object.defineProperty(returnedFile, "text", { value: async () => sourcePackage.dxf });
    const root = mount();
    try {
      reachExportStage(root);
      setFileInput(root.querySelector<HTMLInputElement>("#dxf-source-package-file")!, sourceFile);
      setFileInput(root.querySelector<HTMLInputElement>("#dxf-returned-file")!, returnedFile);
      root.querySelector<HTMLButtonElement>("#audit-dxf-return")!.click();
      await vi.waitFor(() => expect(root.querySelector("#dxf-audit-status")?.textContent).toContain("Passed:"));
      expect(root.querySelector("#dxf-audit-status")?.textContent).toContain("maximum difference 0.000000 cm");
    } finally {
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 15_000);

  it("reports source-package export failures without silently producing either file", async () => {
    window.electronAPI = { saveFile: vi.fn(async () => ({ saved: true })) };
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const digest = vi.spyOn(webcrypto.subtle, "digest");
    try {
      const root = mount();
      reachExportStage(root);
      digest.mockRejectedValueOnce(new Error("hash unavailable"));
      root.querySelector<HTMLButtonElement>("#export-cad-dxf")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("CAD exchange export failed: hash unavailable"));

      digest.mockRejectedValueOnce("unknown CAD package failure");
      root.querySelector<HTMLButtonElement>("#export-cad-dxf")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("CAD exchange export failed: source package could not be created."));

      digest.mockRejectedValueOnce("unknown digest failure");
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("Source package export failed: source package could not be created."));

      digest.mockRejectedValueOnce(new Error("source package hash unavailable"));
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("Source package export failed: source package hash unavailable"));
      expect(window.electronAPI.saveFile).not.toHaveBeenCalled();
    } finally {
      digest.mockRestore();
      delete window.electronAPI;
    }
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

  it("downloads one selected-size Tee Tech Pack and preserves the whole-run bytes", async () => {
    const saveFile = vi.fn(async (filename: string, content: string) => ({ saved: true, filePath: `${filename}:${content.length}` }));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const wholeRunBytes = saveFile.mock.calls[0]![1];

      const size = root.querySelector<HTMLSelectElement>("#export-size")!;
      size.value = "1";
      size.dispatchEvent(new Event("change", { bubbles: true }));
      const selectedLabel = size.options[size.selectedIndex]!.textContent!.trim();
      const selectedTechPack = root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!;
      expect(selectedTechPack.disabled).toBe(false);
      expect(selectedTechPack.closest<HTMLElement>("[data-export-format]")!.hidden).toBe(false);
      selectedTechPack.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));

      const [filename, content] = saveFile.mock.calls[1]!;
      expect(filename).toBe(`tee-${selectedLabel}-selected-techpack.pdf`);
      expect(content).toContain(`Tee - ${selectedLabel} - Pattern Piece Overview \\(1/1\\)`);
      expect(content).toContain("Digital draft only; physical fit has not been validated.");
      for (const otherSize of ["XS", "S", "M", "L", "XL"].filter((label) => label !== selectedLabel)) {
        expect(content).not.toContain(`Tee - ${otherSize} - Pattern Piece Overview`);
      }

      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(3));
      expect(saveFile.mock.calls[2]![1]).toBe(wholeRunBytes);
    } finally {
      delete window.electronAPI;
    }
  });

  it("hides and rejects the Tee selected-size Tech Pack for other garments", () => {
    const saveFile = vi.fn(async () => ({ saved: true }));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      clickId(root, "garment-tank");
      reachExportStage(root);
      const action = root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!;
      expect(action.closest<HTMLElement>("[data-export-format]")!.hidden).toBe(true);
      action.click();
      expect(saveFile).not.toHaveBeenCalled();
    } finally {
      delete window.electronAPI;
    }
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
});
