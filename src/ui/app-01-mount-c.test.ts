// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { mountApp, unmountApp } from "./app";

import { customOneSizeSpecMarkup } from "./view";

import { GARMENTS, STANDARD_M, draftTshirt, rolePiece, type GarmentRecipe } from "../drafting";

import { pieceHandles, editorViewBox } from "../edit";

import { PATTERN_MEASUREMENT_MAP, type PatternMeasurementDefinition, type PatternMeasurementField } from "./pattern-measurements";

const mutablePatternMeasurementMap = PATTERN_MEASUREMENT_MAP as unknown as Record<string, Record<string, PatternMeasurementDefinition>>;

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

/** Navigate the real reviewed path used by export-writer tests. */
const reachExportStage = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-start");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next"); // accept the current Style choices → Check
    clickId(root, "journey-next"); // reviewed Check → Export
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

describe("mountApp", () => {


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

  it("keeps the assembled inspection frame selected when invalid input pauses the draft", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "assembled-preview-toggle");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "9999";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Draft paused");
    expect(root.querySelector("#inspection-title")!.textContent).toContain("Assembled preview");
  });

  it("rebuilds the semantic Edit source when a recipe option changes", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-polo");
    clickId(root, "view-edit");
    const option = root.querySelector<HTMLInputElement>('input[data-option="placketLength"]')!;
    option.value = "15";
    option.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelectorAll("input[data-editor-coordinate]").length).toBeGreaterThan(0);
    expect(root.querySelector('[data-editor-contract="semantic"]')?.textContent).toContain("registered size run");
  });

  it("opens field history immediately when the app has no project workflow", () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>('button[data-open-field-history="body.chest-girth"]')!.click();
    expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.open).toBe(true);
    expect(root.querySelector("#field-history-dialog")?.textContent).toContain("No value history is recorded");
  });

  it("selects the conventional front role for recipes without an explicit Edit role", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-tee");
    clickId(root, "view-edit");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector<HTMLSelectElement>("#editor-role")?.value).toBe("front");
    expect(root.querySelector('[data-editor-contract="semantic"]')).not.toBeNull();
  });

  it("keeps the reviewed journey incomplete when Electron cancels a file write", async () => {
    localStorage.clear();
    const saveFile = vi.fn().mockResolvedValue({ saved: false });
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-svg");
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledOnce(), { timeout: 20_000 });
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("Export canceled"), { timeout: 20_000 });
      expect(root.querySelector("#journey-celebration")).toBeNull();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("does not mark an older Electron export complete after the design changes", async () => {
    localStorage.clear();
    let finishWrite!: (result: { saved: boolean }) => void;
    const saveFile = vi.fn(() => new Promise<{ saved: boolean }>((resolve) => { finishWrite = resolve; }));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-svg");
      expect(saveFile).toHaveBeenCalledOnce();
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = "101";
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      finishWrite({ saved: true });
      await Promise.resolve();
      expect(root.querySelector("#persist-status")!.textContent).toContain("earlier design");
      expect(root.querySelector("#journey-celebration")).toBeNull();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("reports an Electron export write error without confirming export", async () => {
    localStorage.clear();
    const saveFile = vi.fn().mockRejectedValue(new Error("disk unavailable"));
    window.electronAPI = { saveFile };
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-svg");
      expect(saveFile).toHaveBeenCalledOnce();
      await Promise.resolve();
      expect(root.querySelector("#persist-status")!.textContent).toContain("Export failed");
      expect(root.querySelector("#journey-celebration")).toBeNull();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("reports when a browser cannot create the local export download", () => {
    const previousCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => { throw new Error("blob unavailable"); });
    try {
      const root = mount();
      reachExportStage(root);
      clickId(root, "export-svg");
      expect(root.querySelector("#persist-status")!.textContent)
        .toContain("the browser could not start the download");
      expect(root.querySelector("#journey-celebration")).toBeNull();
    } finally {
      URL.createObjectURL = previousCreate;
    }
  });

  it("resets a selected export size when the next recipe does not support it", () => {
    localStorage.clear();
    const recipes = GARMENTS as unknown as GarmentRecipe[];
    const index = recipes.findIndex((recipe) => recipe.name === "trouser");
    const original = recipes[index];
    if (!original) throw new Error("Trouser recipe fixture is missing.");
    recipes[index] = { ...original, sizes: original.sizes.filter((size) => size.step !== 2) };
    try {
      const root = mount();
      const size = root.querySelector<HTMLSelectElement>("#export-size")!;
      size.value = "2";
      size.dispatchEvent(new Event("change", { bubbles: true }));
      expect(size.value).toBe("2");
      clickId(root, "garment-trouser");
      expect(size.value).toBe("0");
      expect(root.querySelector("#nest-selected-size")!.textContent).toContain("M");
    } finally {
      recipes[index] = original;
    }
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

  it("steps through the measurement groups with the control-page buttons", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "journey-step-measure");
    const select = root.querySelector<HTMLSelectElement>("#control-page-select")!;
    const previous = root.querySelector<HTMLButtonElement>('[data-control-page-step="-1"]')!;
    const next = root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!;
    expect(previous.disabled).toBe(true);
    previous.dispatchEvent(new Event("click", { bubbles: true }));
    expect(select.value).toBe("0");
    next.dispatchEvent(new Event("click", { bubbles: true }));
    expect(select.value).toBe("1");
    root.dispatchEvent(new Event("click", { bubbles: true }));
    previous.dispatchEvent(new Event("click", { bubbles: true }));
    expect(select.value).toBe("0");
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

  it("replays history when one garment selector is missing", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    const initialChest = chest.value;
    chest.value = String(Number(initialChest) + 1);
    chest.dispatchEvent(new Event("input"));

    const nativeQuerySelector = root.querySelector.bind(root);
    let skipTankLookup = true;
    root.querySelector = ((selector: string) => {
      if (selector === "#garment-tank" && skipTankLookup) {
        skipTankLookup = false;
        return null;
      }
      return nativeQuerySelector(selector);
    }) as typeof root.querySelector;
    try {
      clickId(root, "undo-pattern");
    } finally {
      root.querySelector = nativeQuerySelector as typeof root.querySelector;
    }

    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe(initialChest);
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#garment-tank")).not.toBeNull();
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
      registered!("techpack");
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
      clickId(root, "celebrate-dismiss");
      expect(root.querySelector("#journey-celebration")).toBeNull();
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
    expect(html).toContain("Modeled chest circumference");
    expect(html).not.toContain("Body chest (finished)");
    expect(html).toContain("Measurement (cm)");
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    const customSpec = customOneSizeSpecMarkup(tee.draft(STANDARD_M), STANDARD_M, tee.poms, true, tee.name);
    expect(customSpec).toContain("Modeled chest circumference");
    expect(customSpec).not.toContain("Body chest (finished)");
    const tank = GARMENTS.find((recipe) => recipe.name === "tank")!;
    const tankSpec = customOneSizeSpecMarkup(tank.draft(STANDARD_M), STANDARD_M, tank.poms, true, tank.name);
    expect(tankSpec).toContain("Body chest (finished)");
    expect(tankSpec).not.toContain("Modeled chest circumference");
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

  it("persists an invalid semantic edit and pauses dependent outputs until correction", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const root = mount();
    clickId(root, "view-edit");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const coordinate = root.querySelector<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')!;
    coordinate.value = "1000";
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));

    const diagnostic = root.querySelector<HTMLElement>('[data-editor-validation="invalid"]');
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.getAttribute("role")).toBe("alert");
    expect(diagnostic?.textContent).toContain("Saved edit is blocked");
    expect(diagnostic?.textContent).toContain("dependent outputs and exports are paused");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

    clickId(root, "view-nest");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Graded nesting is paused.");
    clickId(root, "view-fabric");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Fabric nesting is paused.");
    clickId(root, "nest-single");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Fabric nesting is paused.");
    clickId(root, "view-check");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Checks are paused");
    clickId(root, "view-spec");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Graded specifications are paused.");
    clickId(root, "view-pattern");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Pattern output is paused for this size.");
    clickId(root, "view-flat");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Technical flat withheld.");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("DRAFT_FAILED");

    clickId(root, "view-edit");
    root.querySelector<HTMLButtonElement>("#editor-reset")!.click();
    expect(root.querySelector('[data-editor-validation="invalid"]')).toBeNull();
    expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull();
  }, 15_000);

  it("does not present preview checks as current when source input is invalid", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "view-edit");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "9999";
    chest.dispatchEvent(new Event("input", { bubbles: true }));

    expect(root.querySelector("#canvas-host")?.textContent)
      .toContain("correct the flagged inputs before the Edit preview or its geometry checks can be evaluated");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
    expect(root.querySelector('[data-editor-validation="valid"]')).toBeNull();
    expect(root.querySelector('[data-editor-validation="invalid"]')).toBeNull();
  });

  it("applies keyboard coordinate edits and rejects incomplete or unknown coordinates", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
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

  it("commits one durable semantic operation for a drag and clears it on reset", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
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
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      window.dispatchEvent(new MouseEvent("mouseup", { clientX: 5, clientY: 5 }));
      const vertex = pieceHandles(rolePiece(draftTshirt(STANDARD_M), "front")).find((h) => h.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;

      // Miss: click empty margin (>2 cm from any handle) selects nothing.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: 0.5, clientY: 0.5, bubbles: true }));
      expect(host.innerHTML).not.toContain('stroke="#FFFFFF"');

      // A press and release with no movement remains an explicit no-op.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      window.dispatchEvent(new MouseEvent("mouseup", {}));
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);

      const before = host.innerHTML;
      // Hit: grab the vertex, drag it +6 cm, release.
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      expect(host.innerHTML).toContain('stroke="#FFFFFF"'); // selection ring shows
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 6, clientY: sy + 6 }));
      const dragged = host.innerHTML;
      expect(dragged).not.toBe(before); // the outline changed
      window.dispatchEvent(new MouseEvent("mouseup", {}));

      // Clear removes the durable semantic operation and returns to the source draft.
      host.querySelector<HTMLButtonElement>("#editor-reset")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(host.innerHTML).not.toBe(dragged);
      expect(host.querySelector('[data-editor-validation="valid"]')).not.toBeNull();
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
