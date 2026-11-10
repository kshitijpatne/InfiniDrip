// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { guidedCaptureFieldId, mountApp, unmountApp } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import { STANDARD_M, STRETCH_FABRICS } from "../drafting";

import { loadJourney, tutorialMarkup } from "./journey";

import { applyTutorialFoundation } from "./enhancements/foundation/tutorial-foundation";

import { DEFAULT_WORKSPACE, saveToStorage } from "./persist";

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

function invokeTrackedWindowListener(type: string, event: Event): void {
  const entry = trackedWindowListeners.find((candidate) => candidate.type === type);
  if (!entry) throw new Error(`No tracked ${type} window listener`);
  if (typeof entry.listener === "function") entry.listener.call(window, event);
  else entry.listener.handleEvent(event);
}

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



// ── The guided journey (F2) ───────────────────────────────────────────────────

describe("guided journey", () => {
  beforeEach(() => localStorage.clear());

  it("maps recipe input keys to guided-capture field IDs and preserves unknown keys", () => {
    expect(guidedCaptureFieldId("tee", "chest")).toBe("body.chest-girth");
    expect(guidedCaptureFieldId("tee", "future-field")).toBe("future-field");
  });

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

  it("invalidates reviewed Export readiness when a design input changes", () => {
    const root = mount();
    walkToOutput(root);

    const output = root.querySelector<HTMLButtonElement>("#journey-step-output")!;
    expect(output.disabled).toBe(false);
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("output");

    setChest(root, "101");

    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("refine");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-output")!.disabled).toBe(true);
  });

  it("keeps the current tour DOM intact when the local foundation override is off", () => {
    const root = mount({ uiqFoundationEnabled: false });
    const panel = root.querySelector<HTMLElement>("#tutorial-panel");
    expect(panel?.classList.contains("uiq-foundation-panel")).toBe(false);
    expect(panel?.querySelector(".uiq-foundation-panel-title")).toBeNull();
    expect(root.querySelector("#tutorial-title")?.textContent).toBe("Welcome");
    expect(root.querySelector("#welcome-start")?.textContent).toBe("Start the tour");
    expect(root.querySelector("#welcome-skip")).not.toBeNull();
    root.remove();
  });

  it("mounts UIQ guidance inside Design readiness without replacing stage navigation", () => {
    const root = mount();
    const readiness = root.querySelector<HTMLDetailsElement>("#readiness-details")!;
    readiness.open = true;

    expect(root.querySelector("#readiness-host .uiq-guidance")).not.toBeNull();
    expect(root.querySelector("#readiness-host .journey-checklist")).toBeNull();
    expect(root.querySelector(".uiq-guidance-fit-value")?.textContent).toBe("No fit preference supplied");
    expect(root.querySelector("#journey-step-fit")).not.toBeNull();
    expect(root.querySelector("#journey-next")).not.toBeNull();

    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");
    expect(root.querySelector(".uiq-guidance-fit-value")?.textContent).not.toBe("No fit preference supplied");
    expect(root.querySelector<HTMLElement>('.uiq-guidance-stage[data-step="refine"] .uiq-guidance-badge--current')?.hidden)
      .toBe(false);
    root.remove();
  });

  it("retains the exact legacy readiness checklist when UIQ guidance is disabled", () => {
    const root = mount({ uiqGuidanceEnabled: false });
    expect(root.querySelector("#readiness-host .uiq-guidance")).toBeNull();
    expect(root.querySelector("#readiness-host .journey-checklist")?.textContent)
      .toContain("Garment chosen");
    expect(root.querySelector("#journey-step-fit")).not.toBeNull();
    expect(root.querySelector("#journey-next")).not.toBeNull();
    root.remove();
  });

  it("mounts the UIQ-04 material panel as a collapsed, read-only view of existing state", () => {
    const root = mount();
    document.body.append(root);
    const disclosure = root.querySelector<HTMLDetailsElement>("#material-clarity-details")!;
    expect(disclosure.hidden).toBe(true);
    clickId(root, "journey-step-fit");
    expect(disclosure.hidden).toBe(false);
    const panel = root.querySelector<HTMLElement>("#material-clarity-host .uiq-material")!;
    const selectedFabric = root.querySelector<HTMLSelectElement>("#stretch-select")!.value;
    const currentColor = root.querySelector<HTMLInputElement>("#appearance-hex")!.value;
    const currentShine = root.querySelector<HTMLInputElement>("#appearance-shine")!.value;
    const selectedPreset = STRETCH_FABRICS.find((candidate) => candidate.name === selectedFabric)!;

    expect(disclosure.open).toBe(false);
    disclosure.open = true;
    expect(panel.textContent).toContain(`Design revision`);
    expect(panel.textContent).toContain(`${selectedPreset.name} (${selectedPreset.family}) — Known preset.`);
    expect(panel.querySelector(".uiq-material-compatibility-label")?.textContent).toBe("Unknown");
    expect(panel.querySelector(".uiq-material-compatibility-detail")?.textContent)
      .toBe("The app has no separate fabric/material compatibility assessment.");
    const existingEaseNote = root.querySelector<HTMLElement>(
      '#guidance-host [data-guidance-field="ease"] > span:nth-child(2)',
    )?.textContent;
    expect(panel.querySelector(".uiq-material-ease-guidance")?.textContent).toBe(existingEaseNote);

    const reviewFabric = panel.querySelector<HTMLButtonElement>(".uiq-material-review-fabric")!;
    reviewFabric.click();
    expect(document.activeElement).toBe(root.querySelector<HTMLButtonElement>("#stretch-host [data-material-option]"));

    const reviewAppearance = panel.querySelector<HTMLButtonElement>(".uiq-material-review-appearance")!;
    reviewAppearance.click();
    expect(root.querySelector<HTMLElement>("#appearance-editor")!.hidden).toBe(false);
    expect(document.activeElement).toBe(root.querySelector<HTMLInputElement>("#appearance-hex"));
    reviewAppearance.focus();
    reviewAppearance.click();
    expect(root.querySelector<HTMLElement>("#appearance-editor")!.hidden).toBe(false);
    expect(document.activeElement).toBe(root.querySelector<HTMLInputElement>("#appearance-hex"));

    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe(selectedFabric);
    expect(root.querySelector<HTMLInputElement>("#appearance-hex")!.value).toBe(currentColor);
    expect(root.querySelector<HTMLInputElement>("#appearance-shine")!.value).toBe(currentShine);
    root.remove();
  });

  it("keeps the exact legacy material and appearance shell when UIQ material is disabled", () => {
    const root = mount({ uiqMaterialEnabled: false });
    expect(root.querySelector("#material-clarity-details")).toBeNull();
    expect(root.querySelector("#stretch-host [data-material-option]")).not.toBeNull();
    expect(root.querySelector("#swatch-host #appearance-toggle")).not.toBeNull();
    expect(root.querySelector("#stretch-select")).not.toBeNull();
    expect(root.querySelector("#appearance-editor")).not.toBeNull();
    root.remove();
  });

  it("updates the same UIQ material panel when existing material or appearance state changes", () => {
    const root = mount();
    clickId(root, "journey-step-fit");
    const panel = root.querySelector<HTMLElement>("#material-clarity-host .uiq-material")!;
    const reviewButton = panel.querySelector<HTMLButtonElement>(".uiq-material-review-fabric")!;
    const before = root.querySelector<HTMLSelectElement>("#stretch-select")!.value;
    const nextCard = [...root.querySelectorAll<HTMLButtonElement>("#stretch-host [data-material-option]")]
      .find((button) => button.dataset.materialOption !== before)!;
    nextCard.click();

    expect(root.querySelector("#material-clarity-host .uiq-material")).toBe(panel);
    expect(panel.querySelector<HTMLButtonElement>(".uiq-material-review-fabric")).toBe(reviewButton);
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe(nextCard.dataset.materialOption);
    expect(panel.textContent).toContain(`${nextCard.dataset.materialOption} (`);
    expect(panel.textContent).toContain("Design revision");
    root.remove();
  });

  it("routes UIQ blocker review through existing correction focus without changing the input", () => {
    const root = mount();
    document.body.append(root);
    clickId(root, "journey-step-measure");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "0";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "journey-step-refine");
    root.querySelector<HTMLDetailsElement>("#readiness-details")!.open = true;

    expect(root.querySelector(".uiq-guidance-blocker-message")?.textContent).toBeTruthy();
    expect(root.querySelector(".uiq-guidance-correction")).not.toBeNull();
    const blockerMessage = root.querySelector(".uiq-guidance-blocker-message")!.textContent!;
    expect([...root.querySelectorAll(".uiq-guidance-note-text")]
      .filter((note) => note.textContent === blockerMessage)).toHaveLength(0);
    clickId(root, "journey-step-measure");
    clickId(root, "journey-step-refine");
    const review = root.querySelector<HTMLButtonElement>(".uiq-guidance-correction")!;
    review.click();

    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(document.activeElement).toBe(chest);
    expect(chest.value).toBe("0");
    root.remove();
  });

  it("routes recipe-field guidance into guided capture and tolerates a stale capture target", () => {
    const root = mount();
    document.body.append(root);
    clickId(root, "journey-next");
    const editorChest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    editorChest.value = "0";
    editorChest.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "journey-guided");
    clickId(root, "journey-step-refine");
    root.querySelector<HTMLDetailsElement>("#readiness-details")!.open = true;

    const findChestAction = (): HTMLButtonElement => root.querySelector<HTMLButtonElement>(".uiq-guidance-correction")!;
    expect(findChestAction()?.closest(".uiq-guidance")?.textContent).toContain("Chest: enter 60–160.");
    findChestAction().click();
    const captureChest = root.querySelector<HTMLInputElement>(
      '[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]',
    )!;
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(document.activeElement).toBe(captureChest);

    clickId(root, "journey-step-refine");
    root.querySelector<HTMLDetailsElement>("#readiness-details")!.open = true;
    const correction = findChestAction();
    const originalQueryAll = root.querySelectorAll.bind(root);
    const queryAllSpy = vi.spyOn(root, "querySelectorAll").mockImplementation((selector: string) => {
      if (selector === 'input[data-action="capture-edit-raw"]') return [] as unknown as NodeListOf<Element>;
      return originalQueryAll(selector);
    });
    expect(() => correction.click()).not.toThrow();
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(queryAllSpy).toHaveBeenCalledWith('input[data-action="capture-edit-raw"]');
    queryAllSpy.mockRestore();
    root.remove();
  });

  it("routes a blocker without a field to its existing stage", () => {
    const root = mount();
    clickId(root, "journey-step-refine");
    const correction = root.querySelector<HTMLButtonElement>(".uiq-guidance-correction")!;
    expect(correction).toBeTruthy();
    correction.click();
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("fit");
    root.remove();
  });

  it("opens the first run on the approved non-modal Welcome without hiding Garment", () => {
    const root = mount();
    expect(root.querySelector("#tutorial-panel")?.textContent).toContain("fits your design intent");
    expect(root.querySelector("#tutorial-panel")?.getAttribute("role")).toBe("region");
    expect(root.querySelector("#tutorial-panel")?.classList.contains("uiq-foundation-panel")).toBe(true);
    expect(root.querySelector("#tutorial-title")?.textContent).toBe("Welcome");
    expect(root.querySelector("#welcome-start")?.textContent).toBe("Start the tour");
    expect(root.querySelector("#tutorial-host")).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#journey-next")!.hidden).toBe(true);
    expect(hidden(root, "#garment-toggle-host")).toBe(false);
    expect(hidden(root, "#controls-panel")).toBe(true);
    expect(hidden(root, "#export-host")).toBe(true);
    expect(hidden(root, "#view-toggle-host")).toBe(false);
    expect(root.querySelector<HTMLElement>("#advanced-views")!.hidden).toBe(true);
    expect(hidden(root, "#style-host")).toBe(true);
  });

  it("integrates the branded visual into only the existing first-run welcome", () => {
    const root = mount();
    const welcome = root.querySelector<HTMLElement>(".uiq-entry");
    expect(welcome).not.toBeNull();
    expect(welcome?.querySelector(".uiq-entry__wordmark")?.tagName).toBe("H2");
    expect(root.querySelectorAll("#infini-shell h1")).toHaveLength(1);
    expect(welcome?.querySelector("#tutorial-title")?.textContent).toBe("Welcome");
    expect(welcome?.querySelector("#tutorial-panel")?.textContent)
      .toContain("Nothing has been sewn or fit-tested");
    expect(welcome?.querySelector<HTMLButtonElement>("#welcome-start")?.textContent)
      .toBe("Start the tour");
    expect(welcome?.querySelector<HTMLButtonElement>("#welcome-skip")?.textContent)
      .toBe("Skip for now");

    jclick(root, "welcome-start");
    expect(root.querySelector(".uiq-entry")).toBeNull();
    expect(root.querySelector("#tutorial-title")?.textContent).toContain("Choose what to design");
    root.remove();
  });

  it("retains the exact legacy tutorial welcome when UIQ welcome is disabled", () => {
    const root = mount({ uiqWelcomeEnabled: false });
    const expectedHost = document.createElement("div");
    expectedHost.innerHTML = tutorialMarkup(loadJourney().tutorial, false);
    applyTutorialFoundation(expectedHost, true);
    expect(root.querySelector(".uiq-entry")).toBeNull();
    expect(root.querySelector<HTMLElement>("#tutorial-host")?.innerHTML)
      .toBe(expectedHost.innerHTML);
    expect(root.querySelector("#welcome-start")?.textContent).toBe("Start the tour");
    expect(root.querySelector("#welcome-skip")?.textContent).toBe("Skip for now");
    root.remove();
  });

  it("ignores a resize after the inspection content host is detached", () => {
    const root = mount();
    root.querySelector("#garment-host")?.remove();
    root.querySelector("#analysis-host")?.remove();
    expect(() => window.dispatchEvent(new Event("resize"))).not.toThrow();
  });

  it("ignores global shortcuts from an app mount that has been replaced", () => {
    const replacedRoot = mount();
    const chest = replacedRoot.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    expect(replacedRoot.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled).toBe(false);
    mount();
    const shortcut = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true });
    invokeTrackedWindowListener("keydown", shortcut);
    expect(shortcut.defaultPrevented).toBe(false);
    expect(chest.value).toBe("102");
    expect(() => window.dispatchEvent(shortcut)).not.toThrow();
    expect(shortcut.defaultPrevented).toBe(false);
  });

  it("does not let a replaced app mount block before-unload", () => {
    const replacedRoot = mount();
    const chest = replacedRoot.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "120";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    mount();
    const staleBeforeUnload = new Event("beforeunload", { cancelable: true });
    invokeTrackedWindowListener("beforeunload", staleBeforeUnload);
    expect(staleBeforeUnload.defaultPrevented).toBe(false);
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    expect(() => window.dispatchEvent(beforeUnload)).not.toThrow();
    expect(beforeUnload.defaultPrevented).toBe(false);
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
    expect(root.querySelector(".tutorial-storage-notice .uiq-foundation-status-label")?.textContent)
      .toBe("Warning");
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
    expect(root.querySelector(".uiq-entry")).toBeNull();
    clickId(root, "save-pattern");
    clickId(root, "tutorial-replay");
    expect(root.querySelector("#tutorial-title")!.textContent).toBe("Welcome");
    expect(root.querySelector(".uiq-entry")).not.toBeNull();
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
    expect(root.querySelector('[data-editor-contract="semantic"]')).not.toBeNull();
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



describe("CREWNECK activation (Slice 1114)", () => {
  beforeEach(() => localStorage.clear());

  it("uses the crewneck material default when the project still has its garment default", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-crewneck-default-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-20T14:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      expect(workflow.snapshot.activeStyle.design.workspace.stretchFabric).toBe("Cotton jersey");
      clickId(root, "garment-crewneck");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value)
        .toBe("Stable sweatshirt knit (10% width seed)");
    } finally {
      workflow.close();
      root.remove();
      localStorage.clear();
      vi.unstubAllGlobals();
    }
  });

  it("preserves a non-default saved material choice when switching to crewneck", () => {
    expect(saveToStorage(STANDARD_M, "#123456", {}, {
      ...DEFAULT_WORKSPACE,
      stretchFabric: "Linen",
    })).toBe(true);
    const root = mount();
    try {
      clickId(root, "garment-crewneck");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("routes the selectable crewneck through its material, controls, save/load, and distinct views", () => {
    const root = mount();
    clickId(root, "garment-crewneck");

    expect(root.querySelector<HTMLButtonElement>("#garment-crewneck")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('input[data-field="knee"]')).toBeNull();
    expect(root.querySelectorAll("input[data-option]")).toHaveLength(6);

    const material = root.querySelector<HTMLSelectElement>("#stretch-select")!;
    expect(material.value).toBe("Stable sweatshirt knit (10% width seed)");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("10% width seed");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("negative ease");

    const cuffDepth = root.querySelector<HTMLInputElement>('input[data-option="cuffDepth"]')!;
    cuffDepth.value = "7.5";
    cuffDepth.dispatchEvent(new Event("input", { bubbles: true }));
    material.value = "Linen";
    material.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "save-pattern");

    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.v).toBe(8);
    expect(saved.workspace).toMatchObject({
      garment: "crewneck",
      targetStyle: "Classic crewneck sweatshirt",
      stretchFabric: "Linen",
    });
    expect(saved.garmentOptions.crewneck.cuffDepth).toBe(7.5);

    clickId(root, "garment-tee");
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(root.querySelector<HTMLButtonElement>("#garment-crewneck")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
    expect(root.querySelector<HTMLInputElement>('input[data-option="cuffDepth"]')!.value).toBe("7.5");

    clickId(root, "view-body");
    expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
    expect(root.querySelector("#analysis-host [data-crewneck-legend-background]")).toBeNull();
    clickId(root, "assembled-preview-toggle");
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
    expect(root.querySelector("#garment-host [data-crewneck-legend-background]")).not.toBeNull();
    expect(root.querySelector("#garment-host")!.textContent).toContain("SCHEMATIC ONLY");
  });
});



describe("HOODIE activation (S1137)", () => {
  beforeEach(() => localStorage.clear());

  it("uses the stable-knit default on a fresh Hoodie selection and retains an explicit material", () => {
    const root = mount();
    try {
      clickId(root, "garment-hoodie");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value)
        .toBe("Stable sweatshirt knit (10% width seed)");
      expect(root.querySelector("#guidance-host")!.textContent)
        .toContain("Hoodie geometry is independent of the selected material");
    } finally {
      root.remove();
      localStorage.clear();
    }

    expect(saveToStorage(STANDARD_M, "#123456", {}, {
      ...DEFAULT_WORKSPACE,
      stretchFabric: "Linen",
    })).toBe(true);
    const secondRoot = mount();
    try {
      clickId(secondRoot, "garment-hoodie");
      expect(secondRoot.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
    } finally {
      secondRoot.remove();
      localStorage.clear();
    }
  });

  it("routes Hoodie controls and source-geometry views through v8 save/load", () => {
    const root = mount();
    try {
      clickId(root, "garment-hoodie");
      expect(root.querySelector<HTMLButtonElement>("#garment-hoodie")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')).not.toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckWidthEase"]')).toBeNull();
      expect(root.querySelectorAll("input[data-option]")).toHaveLength(18);

      const height = root.querySelector<HTMLInputElement>('input[data-option="hoodHeight"]')!;
      height.value = "36";
      height.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.v).toBe(8);
      expect(saved.workspace).toMatchObject({
        garment: "hoodie",
        targetStyle: "Adult pullover hoodie P0",
        stretchFabric: "Stable sweatshirt knit (10% width seed)",
      });
      expect(saved.garmentOptions.hoodie.hoodHeight).toBe(36);

      clickId(root, "view-body");
      expect(root.querySelectorAll('#analysis-host svg[data-source-geometry="draftHoodie"]')).toHaveLength(2);
      clickId(root, "body-front");
      expect(root.querySelector('#analysis-host svg [data-role="front"]')).not.toBeNull();
      expect(root.querySelectorAll('#analysis-host svg[data-source-geometry="draftHoodie"]')).toHaveLength(1);
      clickId(root, "body-back");
      expect(root.querySelector('#analysis-host svg [data-role="back"]')).not.toBeNull();
      clickId(root, "body-front-back");
      expect(root.querySelectorAll('#analysis-host svg[data-source-geometry="draftHoodie"]')).toHaveLength(2);

      clickId(root, "assembled-preview-toggle");
      expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
      expect(root.querySelector('#garment-host svg[data-garment="hoodie"] [data-source-role="hoodOuterLeft"]')).not.toBeNull();
      expect(root.querySelector('#garment-host svg[data-garment="hoodie"] [data-source-role="hoodLiningRight"]')).not.toBeNull();
      expect(root.querySelector("#garment-host")!.textContent).toContain("SCHEMATIC ONLY");

      clickId(root, "garment-tee");
      clickId(root, "load-pattern");
      clickId(root, "workspace-confirm-accept");
      expect(root.querySelector<HTMLButtonElement>("#garment-hoodie")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value)
        .toBe("Stable sweatshirt knit (10% width seed)");
      expect(root.querySelector<HTMLInputElement>('input[data-option="hoodHeight"]')!.value).toBe("36");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });
});



describe("JOGGER activation (Slice 1119)", () => {
  beforeEach(() => localStorage.clear());

  it("uses the knit default, Jogger-specific views, and version-8 save/load", () => {
    const root = mount();
    try {
      clickId(root, "garment-trouser");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton woven");
      clickId(root, "garment-jogger");

      expect(root.querySelector<HTMLButtonElement>("#garment-jogger")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLInputElement>('input[data-field="knee"]')).not.toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')).toBeNull();
      expect(root.querySelectorAll('input[data-option]')).toHaveLength(15);
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
      expect(root.querySelector("#guidance-host")!.textContent).toContain("Jogger is a knit-only P0");
      expect(root.querySelector("#guidance-host")!.textContent).toContain("does not model stretch/recovery");

      clickId(root, "view-body");
      expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
      expect(root.querySelector("#analysis-host svg")!.getAttribute("aria-label")).toContain("Jogger front body figure");
      clickId(root, "body-front");
      expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(1);
      expect(root.querySelector("#analysis-host svg")!.getAttribute("aria-label")).toBe("Jogger front body figure");
      clickId(root, "body-back");
      expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(1);
      expect(root.querySelector("#analysis-host svg")!.getAttribute("aria-label")).toBe("Jogger back body figure");
      clickId(root, "body-front-back");
      expect(root.querySelectorAll("#analysis-host svg")).toHaveLength(2);
      clickId(root, "assembled-preview-toggle");
      expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
      expect(root.querySelector("#garment-host [data-garment=\"jogger\"]")).not.toBeNull();

      const drawcord = root.querySelector<HTMLInputElement>('input[data-option="drawcordLength"]')!;
      drawcord.value = "132";
      drawcord.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.v).toBe(8);
      expect(saved.workspace).toMatchObject({ garment: "jogger", targetStyle: "Adult knit jogger P0", stretchFabric: "Cotton jersey" });
      expect(saved.garmentOptions.jogger.drawcordLength).toBe(132);
      expect(DEFAULT_WORKSPACE.garment).toBe("tee");

      clickId(root, "garment-tee");
      clickId(root, "load-pattern");
      clickId(root, "workspace-confirm-accept");
      expect(root.querySelector<HTMLButtonElement>("#garment-jogger")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLInputElement>('input[data-option="drawcordLength"]')!.value).toBe("132");
      expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton jersey");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("retains explicit woven material and invalid option input with actionable Jogger guidance", () => {
    const root = mount();
    try {
      const material = root.querySelector<HTMLSelectElement>("#stretch-select")!;
      material.value = "Cotton woven";
      material.dispatchEvent(new Event("change", { bubbles: true }));
      clickId(root, "garment-jogger");
      expect(material.value).toBe("Cotton woven");
      expect(root.querySelector("#guidance-host")!.textContent).toContain("Jogger P0 is drafted for knit material");

      const casing = root.querySelector<HTMLInputElement>('input[data-option="waistbandDepth"]')!;
      casing.value = "2";
      casing.dispatchEvent(new Event("input", { bubbles: true }));
      expect(casing.value).toBe("2");
      expect(root.querySelector("#guidance-host")!.textContent).toContain("below the declared elastic/drawcord channel need");
      expect(root.querySelector("#guidance-host")!.textContent).toContain("increase casing depth or reduce elastic width/drawcord cut width");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("keeps woven compatibility guidance and the Skirt route after Jogger registration", () => {
    const root = mount();
    try {
      const material = root.querySelector<HTMLSelectElement>("#stretch-select")!;
      for (const garment of ["woven-shirt", "trouser", "shorts"]) {
        clickId(root, `garment-${garment}`);
        material.value = "Cotton jersey";
        material.dispatchEvent(new Event("change", { bubbles: true }));
        expect(root.querySelector("#guidance-host")!.textContent).toContain("stable woven material");
      }

      clickId(root, "garment-skirt");
      clickId(root, "view-body");
      expect(root.querySelector("#analysis-host svg")).not.toBeNull();
      clickId(root, "assembled-preview-toggle");
      expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
      expect(root.querySelector("#garment-host svg")).not.toBeNull();
    } finally {
      root.remove();
      localStorage.clear();
    }
  });
});
