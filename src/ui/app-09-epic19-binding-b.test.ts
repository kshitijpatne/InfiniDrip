// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Blob as NodeBlob } from "node:buffer";

import { createHash, webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { mountApp, unmountApp } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import { materializeCustomSizeDesign } from "./custom-size-materialization";

import * as gradePlanContext from "./grade-plan-context";

import * as gradePlan from "./grade-plan";

import { GARMENTS, STANDARD_M, TANK, notchesForRecipeOptions, type GarmentOptions } from "../drafting";

import { TANK_RACERBACK_BACK_CUT_IN_OPTION_ID, TANK_RACERBACK_ENTRY_ID } from "../drafting/tank";

import { blockPieces } from "../drafting/block";

import { exportA0Pdf, exportDxf, exportPdf, exportSvg } from "../export";

import * as teeDrafting from "../drafting/tshirt";

import * as editEngine from "../edit";

import * as semanticEditEngine from "../edit/semantic-edit";

import { DEFAULT_APPEARANCE } from "./appearance";

import { DEFAULT_WORKSPACE, saveRecoveryToStorage } from "./persist";

import { STARTER_REGISTRY, starterOriginForEntry } from "./starter-registry";

import { currentFieldObservation, getCaptureFieldDefinitions, getFieldDefinition } from "./field-provenance";

import { addCaptureReadingForField, createMeasurementCaptureSession } from "./measurement-capture";

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
}

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

describe("EPIC-19 L02 starter binding", () => {


  it("selects, edits, saves, reloads, and renders the F01 Fitted Crew Tee starter", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-fitted-tee-digital-v1");
    expect(root.querySelector<HTMLElement>('[data-export-scope="tee-neckband"]')!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-export-format="export-tee-selected-techpack"]')!.hidden).toBe(true);

    expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Darted tee");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Fitted tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Fitted crew Tee · software defaults");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    for (const [field, value] of Object.entries({ chest: "100", shoulderWidth: "45", bicep: "38", length: "70", armholeDepth: "24", sleeveLength: "22", ease: "7" })) {
      expect(root.querySelector<HTMLInputElement>('input[data-field="' + field + '"]')!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    for (const [field, value] of Object.entries({ dartIntake: "4", bustApexHorizontal: "55", bustApexVertical: "28" })) {
      expect(root.querySelector<HTMLInputElement>('input[data-option="' + field + '"]')!.value).toBe(value);
    }

    clickId(root, "view-pattern");
    const defaultSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
    const intake = root.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')!;
    intake.value = "6"; intake.dispatchEvent(new Event("input", { bubbles: true }));
    const apexX = root.querySelector<HTMLInputElement>('input[data-option="bustApexHorizontal"]')!;
    apexX.value = "65"; apexX.dispatchEvent(new Event("input", { bubbles: true }));
    const apexY = root.querySelector<HTMLInputElement>('input[data-option="bustApexVertical"]')!;
    apexY.value = "40"; apexY.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
    expect(editedSvg).not.toBe(defaultSvg);

    clickId(root, "view-spec");
    expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Side seam (dart closed)");
    clickId(root, "save-pattern");
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.workspace.starterOrigin).toMatchObject({
      entryId: "fitted-tee-digital-v1", entryRevision: "2026-10-22.1",
      recipeId: "fitted", recipeRevision: "fitted-bust-dart-v1",
      configurationSnapshot: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
      },
    });
    expect(saved.garmentOptions.fitted).toMatchObject({ dartIntake: 6, bustApexHorizontal: 65, bustApexVertical: 40 });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Fitted tee");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-tee-digital-v1"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')!.value).toBe("6");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustApexHorizontal"]')!.value).toBe("65");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustApexVertical"]')!.value).toBe("40");
    clickId(reopened, "view-pattern");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);
    root.remove(); reopened.remove(); localStorage.clear();
  });

  it("selects, edits, saves, and reopens the F08 Cropped fitted Tee starter", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-fitted-tee-digital-v1");
    clickId(root, "view-pattern");
    const fittedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "starter-fitted-cropped-tee-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Cropped fitted tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Cropped fitted Tee · software defaults");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "53",
      armholeDepth: "24", sleeveLength: "22", ease: "7",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>('input[data-field="' + field + '"]')!.value).toBe(value);
    }
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    expect([length.min, length.max, length.step, length.value]).toEqual(["40", "57", "1", "53"]);
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    for (const [field, value] of Object.entries({ dartIntake: "4", bustApexHorizontal: "55", bustApexVertical: "28" })) {
      expect(root.querySelector<HTMLInputElement>('input[data-option="' + field + '"]')!.value).toBe(value);
    }

    clickId(root, "journey-next");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent).toContain("You're making a Cropped fitted tee.");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent)
      .not.toContain("flagged inputs or digital checks need review");
    clickId(root, "view-pattern");
    const croppedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(croppedSvg).not.toBe(fittedSvg);
    expect(croppedSvg).toContain("pattern-block-control");

    length.value = "58";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(length.value).toBe("58");
    expect(root.querySelector<HTMLElement>("#error-length")!.textContent).toContain("40–57 cm");
    length.value = "54";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-length")!.textContent).toBe("");
    const dartIntake = root.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')!;
    dartIntake.value = "6";
    dartIntake.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(croppedSvg);

    clickId(root, "view-spec");
    expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Side seam (dart closed)");
    clickId(root, "save-pattern");
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.workspace.starterOrigin).toMatchObject({
      entryId: "fitted-cropped-tee-digital-v1",
      entryRevision: "2026-10-24.1",
      recipeId: "fitted",
      recipeRevision: "fitted-cropped-v1",
      configurationSnapshot: {
        targetStyle: "Cropped fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
      },
    });
    expect(saved.garmentOptions.fitted).toMatchObject({ dartIntake: 6 });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Cropped fitted tee");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("54");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')!.value).toBe("6");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-cropped-tee-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Cropped fitted Tee · software defaults");
    clickId(reopened, "view-pattern");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });
  it("preserves the generic Tank Tech Pack bytes outside N01", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "garment-tank");
      reachExportStage(root);
      clickId(root, "export-techpack");
      await vi.waitFor(() => expect(files.has("tank-techpack.pdf")).toBe(true));
      const pdf = files.get("tank-techpack.pdf")!;
      const text = visiblePdfText(pdf);
      expect(text).toContain("Body & sleeves");
      expect(text).toContain("Neckband");
      expect(text).not.toContain("not a validated grade for the N01 Classic scoop Tank starter");
      expect(createHash("sha256").update(pdf).digest("hex")).toBe("4f3cb090354df0e99c9d0d1661ad2630383b903ab0b075088a0c9eb77f36593f");
    } finally {
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects, edits, saves, reopens, and exports the N02 higher-round High-neck Tank profile", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const starterId = "tank-high-neck-digital-v1";
      const card = root.querySelector<HTMLButtonElement>(`#starter-${starterId}`)!;
      expect(card.textContent).toContain("High-neck Tank · software defaults");
      expect(card.textContent).toContain("higher round front-neckline Tank draft relative to N01");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      expect(root.querySelector<HTMLElement>(`#starter-limits-${starterId}`)!.textContent)
        .toContain("No built-up neck, collar, neckband, facing, zipper");
      clickId(root, `starter-${starterId}`);
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)).toBeNull();
      expect(root.querySelector<HTMLElement>('[data-dim-row="neckDrop"] > span')?.textContent)
        .toContain("Additional front neckline drop");
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.getAttribute("aria-label"))
        .toBe("Additional front neckline drop");

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic tank");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: High-neck Tank · software defaults");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");
      const defaultControls: Record<string, string> = {
        chest: "100", shoulderWidth: "45", length: "70", armholeDepth: "24",
        strapWidth: "8", neckDrop: "0", neckWidthEase: "0", ease: "10",
      };
      for (const [field, expected] of Object.entries(defaultControls)) {
        expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value, field).toBe(expected);
      }
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.min).toBe("0");
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.max).toBe("18");
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.step).toBe("0.5");
      const controls = root.querySelector<HTMLElement>(`#starter-limits-${starterId}`)!.textContent;
      expect(controls).toContain("Additional front neckline drop (design input): 0–18 cm");
      expect(controls).toContain("not-validated");

      clickId(root, "journey-next");
      expect(root.querySelector<HTMLElement>("#style-host")!.textContent).toContain("You're making a Classic tank.");
      clickId(root, "view-pattern");
      const defaultSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(root.querySelectorAll("#pattern-annotation-key [data-pattern-piece-name]")).toHaveLength(2);
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML.toLowerCase()).toContain("front");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML.toLowerCase()).toContain("back");

      const strapWidth = root.querySelector<HTMLInputElement>('input[data-field="strapWidth"]')!;
      strapWidth.value = "16";
      strapWidth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(strapWidth.value).toBe("16");
      expect(root.querySelector<HTMLElement>("#error-strapWidth")!.textContent).toContain("0–15 cm");
      strapWidth.value = "8";
      strapWidth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#error-strapWidth")!.textContent).toBe("");

      const neckDrop = root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!;
      neckDrop.value = "1";
      neckDrop.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(editedSvg).not.toBe(defaultSvg);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: starterId,
        entryRevision: "2026-10-25.1",
        recipeId: "tank",
        recipeRevision: "tank-high-round-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          measurements: {
            chest: 100, shoulderWidth: 45, length: 70, armholeDepth: 24,
            strapWidth: 8, neckDrop: 0, neckWidthEase: 0, ease: 10,
          },
          options: {},
        },
      });
      expect(saved.measurements).toMatchObject({ neckDrop: 1, strapWidth: 8 });

      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: High-neck Tank · software defaults");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("physical validation not performed");
      expect(reopened.querySelector<HTMLElement>('[data-dim-row="neckDrop"] > span')?.textContent)
        .toContain("Additional front neckline drop");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.getAttribute("aria-label"))
        .toBe("Additional front neckline drop");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.value).toBe("1");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${starterId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      expect(reopened.querySelector<HTMLSelectElement>("#export-size")!.options[
        reopened.querySelector<HTMLSelectElement>("#export-size")!.selectedIndex
      ]!.textContent!.trim()).toBe("M");
      reopened.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgOutput = files.get("tank-M.svg")!;
      expect(svgOutput).toContain("<svg");
      expect(svgOutput.toLowerCase()).toContain("front");
      expect(svgOutput.toLowerCase()).toContain("back");

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const techPackText = visiblePdfText(files.get("tank-techpack.pdf")!);
      expect(techPackText).toContain("N02 is a higher round front neckline relative to N01.");
      expect(techPackText).toContain("No built-up neck, collar, facing or modeled stabilization is included");
      expect(techPackText).toContain("physical fit has not been validated");
      expect(techPackText).toContain("Front & back panels");
      expect(techPackText).toContain("Neckline & armholes");
      expect(techPackText).toContain("The generic Tank size run is not a validated N02 grade.");
      expect(techPackText).not.toContain("not a validated grade for the N01 Classic scoop Tank starter");
      expect(techPackText).not.toContain("Body & sleeves");
      expect(techPackText).not.toContain("Neckband");
    } finally {
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
  it("selects, edits, saves, reopens, and exports the N01 Classic scoop Tank starter", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const starterId = "tank-classic-scoop-digital-v1";
      const card = root.querySelector<HTMLButtonElement>(`#starter-${starterId}`)!;
      expect(card.textContent).toContain("Classic scoop Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review approved for digital scope · physical validation not-validated");
      clickId(root, `starter-${starterId}`);
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)).toBeNull();
      expect(root.querySelector<HTMLElement>('[data-dim-row="neckDrop"] > span')?.textContent)
        .toContain("Neck scoop depth");
      expect(root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.getAttribute("aria-label"))
        .toBe("Neck scoop depth");

      expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Tank");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic tank");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Classic scoop Tank · software defaults");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review approved for digital scope; physical validation not performed");
      const defaultControls: Record<string, { value: string; min: string; max: string; step: string }> = {
        chest: { value: "100", min: "60", max: "160", step: "1" },
        shoulderWidth: { value: "45", min: "30", max: "70", step: "0.1" },
        length: { value: "70", min: "59", max: "74", step: "1" },
        armholeDepth: { value: "24", min: "12", max: "40", step: "1" },
        strapWidth: { value: "8", min: "0", max: "15", step: "0.5" },
        neckDrop: { value: "5", min: "0", max: "18", step: "0.5" },
        neckWidthEase: { value: "0", min: "-4", max: "12", step: "0.5" },
        ease: { value: "10", min: "5", max: "10", step: "1" },
      };
      for (const [field, expected] of Object.entries(defaultControls)) {
        const input = root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!;
        expect({ value: input.value, min: input.min, max: input.max, step: input.step }, field).toEqual(expected);
      }
      const limits = root.querySelector<HTMLElement>(`#starter-limits-${starterId}`)!;
      expect(limits.textContent).toContain("Armhole depth (design input)");
      expect(limits.textContent).toContain("not a sourced physical wide/narrow standard");
      expect(limits.textContent).toContain("not a validated N01 grade");

      clickId(root, "journey-next");
      expect(root.querySelector<HTMLElement>("#style-host")!.textContent).toContain("You're making a Classic tank.");
      expect(root.querySelector<HTMLElement>("#style-host")!.textContent)
        .not.toContain("flagged inputs or digital checks need review");
      clickId(root, "view-pattern");
      const originalSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      const pieceNames = [...root.querySelectorAll<HTMLButtonElement>("#pattern-annotation-key [data-pattern-piece-name]")]
        .map((button) => button.dataset.patternPieceName);
      expect(pieceNames).toHaveLength(2);
      expect(pieceNames).toEqual(expect.arrayContaining(["front", "back"]));

      const strapWidth = root.querySelector<HTMLInputElement>('input[data-field="strapWidth"]')!;
      strapWidth.value = "16";
      strapWidth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(strapWidth.value).toBe("16");
      expect(root.querySelector<HTMLElement>("#error-strapWidth")!.textContent).toContain("0–15 cm");
      strapWidth.value = "10";
      strapWidth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(strapWidth.value).toBe("10");
      expect(root.querySelector<HTMLElement>("#error-strapWidth")!.textContent).toBe("");
      const neckDrop = root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!;
      neckDrop.value = "6";
      neckDrop.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(editedSvg).not.toBe(originalSvg);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: starterId,
        entryRevision: "2026-10-24.1",
        recipeId: "tank",
        recipeRevision: "tank-classic-scoop-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          measurements: {
            chest: 100, shoulderWidth: 45, length: 70, armholeDepth: 24,
            strapWidth: 8, neckDrop: 5, neckWidthEase: 0, ease: 10,
          },
          options: {},
        },
      });
      expect(saved.measurements).toMatchObject({ strapWidth: 10, neckDrop: 6 });

      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic tank");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review approved for digital scope; physical validation not performed");
      expect(reopened.querySelector<HTMLElement>('[data-dim-row="neckDrop"] > span')?.textContent)
        .toContain("Neck scoop depth");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.getAttribute("aria-label"))
        .toBe("Neck scoop depth");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="strapWidth"]')!.value).toBe("10");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.value).toBe("6");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${starterId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      const selectedSize = reopened.querySelector<HTMLSelectElement>("#export-size")!;
      expect(selectedSize.options[selectedSize.selectedIndex]!.textContent!.trim()).toBe("M");
      reopened.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      expect([...files.keys()]).toEqual(["tank-M.svg"]);
      const svgOutput = files.get("tank-M.svg")!;
      expect(svgOutput).toContain("<svg");
      expect(svgOutput.toLowerCase()).toContain("front");
      expect(svgOutput.toLowerCase()).toContain("back");

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const [techPackName, techPack] = saveFile.mock.calls[1]!;
      expect(techPackName).toBe("tank-techpack.pdf");
      const techPackText = visiblePdfText(techPack);
      expect(techPackText).toContain("Tank - Pattern Piece Overview (1/1)");
      expect(techPackText).toContain("Digital draft only; this generic Tank size run is not a validated grade for the N01 Classic scoop Tank starter.");
      expect(techPackText).toContain("Front & back panels");
      expect(techPackText).toContain("Neckline & armholes");
      expect(techPackText).toContain("Not estimated; no binding template");
      expect(techPackText).not.toContain("Body & sleeves");
      expect(techPackText).not.toContain("Neckband");
      expect(techPackText).not.toContain("Strap width (finished)");

    } finally {
      if (root) root.remove();
      if (reopened) reopened.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
  it("selects, edits, saves, reopens, and exports the N03 Racerback Tank software blank", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_RACERBACK_ENTRY_ID}`)!;
      expect(card.textContent).toContain("Racerback Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)).toBeNull();
      const limits = root.querySelector<HTMLElement>(`#starter-limits-${TANK_RACERBACK_ENTRY_ID}`)!.textContent;
      expect(limits).toContain("0–6 cm");
      expect(limits).toContain("not validated grading for N03");

      clickId(root, `starter-${TANK_RACERBACK_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Racerback Tank · software defaults");
      const option = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      expect([option.getAttribute("aria-label"), option.min, option.max, option.step, option.value])
        .toEqual(["Back armhole cut-in (digital)", "0", "6", "0.5", "3"]);
      expect(root.querySelector<HTMLElement>(`[data-option-help="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.textContent)
        .toContain("not a sewn tolerance or fit result");
      const optionPage = option.closest<HTMLElement>("fieldset[data-control-page]")!;
      expect(optionPage.dataset.controlStage).toBe("fit");
      expect(optionPage.hidden).toBe(true);
      clickId(root, "journey-next");
      const activeOption = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      const pageSelect = root.querySelector<HTMLSelectElement>("#control-page-select")!;
      pageSelect.value = activeOption.closest<HTMLElement>("fieldset[data-control-page]")!.dataset.controlPage!;
      pageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      const visibleOption = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      expect(visibleOption.closest<HTMLElement>("fieldset[data-control-page]")!.hidden).toBe(false);
      clickId(root, "view-pattern");
      const defaultSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      const optionForEdit = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      optionForEdit.value = "5.25";
      optionForEdit.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.value).toBe("5.25");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.textContent)
        .toContain("0.5 cm increments");
      const correctedOption = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      correctedOption.value = "4.5";
      correctedOption.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.textContent).toBe("");
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(editedSvg).not.toBe(defaultSvg);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.garmentOptions.tank[TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]).toBe(4.5);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_RACERBACK_ENTRY_ID,
        entryRevision: "2026-10-25.1",
        recipeId: "tank",
        recipeRevision: "tank-racerback-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          options: { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 3 },
        },
      });

      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.value).toBe("4.5");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_RACERBACK_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      const selectedSize = reopened.querySelector<HTMLSelectElement>("#export-size")!;
      expect(selectedSize.options[selectedSize.selectedIndex]!.textContent!.trim()).toBe("M");
      const reopenedOption = reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!;
      reopenedOption.value = "6.5";
      reopenedOption.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopenedOption.value).toBe("6.5");
      expect(reopened.querySelector<HTMLElement>(`[data-input-error="option-${TANK_RACERBACK_BACK_CUT_IN_OPTION_ID}"]`)!.textContent)
        .toContain("0–6 cm");
      expect(reopened.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      reopenedOption.value = "4.5";
      reopenedOption.dispatchEvent(new Event("input", { bubbles: true }));
      reachExportStage(reopened);
      expect(reopened.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(false);
      reopened.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgOutput = files.get("racerback-tank-M.svg")!;
      const chosenOptions = { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 4.5 };
      const expectedSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, chosenOptions)),
        TANK.allowances,
        notchesForRecipeOptions(TANK, chosenOptions),
      );
      const defaultOutputSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 3 })),
        TANK.allowances,
        notchesForRecipeOptions(TANK, { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 3 }),
      );
      expect(svgOutput).toBe(expectedSvg);
      expect(svgOutput).not.toBe(defaultOutputSvg);

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const techPackName = [...files.keys()].find((name) => name.endsWith("-techpack.pdf"))!;
      expect(techPackName).toBe("racerback-tank-techpack.pdf");
      const techPack = files.get(techPackName)!;
      const techPackText = visiblePdfText(techPack).replace(/\s+/g, " ");
      expect(techPackText).toContain("Racerback Tank - Pattern Piece Overview");
      expect(techPackText).toContain("Racerback Tank - Measurement Worksheet");
      expect(techPackText).toContain("Digital N03 back-armhole cut-in: 4.5 cm.");
      expect(techPackText).toContain("Binding consumption is not estimated");
      expect(techPackText).toContain("no sewn tolerance is specified or validated");
      expect(techPackText).toContain("The generic Tank size run is not a validated N03 grade");
      expect(techPackText).toContain("Generic Tank size values are not a validated N03 grade.");
      expect(techPackText).toContain("physical fit has not been validated");
      expect(techPackText).toContain("Not estimated; no binding template");
      expect(techPackText).toContain("Measurement-only worksheet");
      expect(techPackText).not.toContain("Pass?");
      expect(techPackText).not.toContain("Tol +/-");
      expect(techPack).not.toContain("(1.3)");
      expect(techPackText).not.toContain("validated N03 grading");
    } finally {
      if (root) root.remove();
      if (reopened) reopened.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects, edits, saves, reopens, and exports the F06 Cap-Sleeve fitted Tee", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-cap-sleeve-tee-digital-v1");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Cap-Sleeve Tee");
      root.querySelector<HTMLSelectElement>("#style-target")!.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Cap-Sleeve Tee");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Fitted Cap-Sleeve Tee · software defaults");
      const sleeveLength = root.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!;
      expect(root.querySelector<HTMLElement>('label[data-dim-row="sleeveLength"]')!.textContent)
        .toContain("Sleeve length below modeled cap base");
      expect([sleeveLength.min, sleeveLength.max, sleeveLength.step, sleeveLength.value]).toEqual(["8", "10", "1", "8"]);
      const trim = root.querySelector<HTMLInputElement>('input[data-option="capSleeveUnderarmTrimCm"]')!;
      expect([trim.min, trim.max, trim.step, trim.value]).toEqual(["0", "1.5", "0.1", "0.6"]);

      sleeveLength.value = "11";
      sleeveLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(sleeveLength.value).toBe("11");
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent).toContain("8–10 cm");
      sleeveLength.value = "10";
      sleeveLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent).toBe("");
      trim.value = "1.2";
      trim.dispatchEvent(new Event("input", { bubbles: true }));
      root.querySelector<HTMLButtonElement>("#undo-pattern")!.click();
      expect(root.querySelector<HTMLElement>('label[data-dim-row="sleeveLength"]')!.textContent)
        .toContain("Sleeve length below modeled cap base");
      root.querySelector<HTMLButtonElement>("#redo-pattern")!.click();
      expect(root.querySelector<HTMLElement>('label[data-dim-row="sleeveLength"]')!.textContent)
        .toContain("Sleeve length below modeled cap base");
      clickId(root, "view-pattern");
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: "fitted-cap-sleeve-tee-digital-v1", entryRevision: "2026-10-24.1",
        recipeId: "fitted", recipeRevision: "fitted-cap-sleeve-v1",
        configurationSnapshot: {
          targetStyle: "Fitted tee",
          measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 8, ease: 7 },
          options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, capSleeveUnderarmTrimCm: 0.6 },
        },
      });
      expect(saved.measurements.sleeveLength).toBe(10);
      expect(saved.garmentOptions.fitted.capSleeveUnderarmTrimCm).toBe(1.2);

      root.remove();
      reopened = mount();
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-cap-sleeve-tee-digital-v1"]')!.getAttribute("aria-pressed"))
        .toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!.value).toBe("10");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="capSleeveUnderarmTrimCm"]')!.value).toBe("1.2");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      clickId(reopened, "export-techpack");
      await vi.waitFor(() => expect([...files.keys()].some((filename) => filename.endsWith("-techpack.pdf"))).toBe(true),
        { timeout: 20_000 });
      const techPack = [...files.entries()].find(([filename]) => filename.endsWith("-techpack.pdf"))![1];
      expect(techPack).toContain("Fitted Cap-Sleeve Tee - Pattern Piece Overview");
      expect(techPack).toContain("short F06 sleeves flat");
      expect(techPack).toContain("taper each sleeve side by 1.2 cm from cap base to hem");
      expect(techPack).toContain("No sewn fit, comfort, wear, material,");
      expect(techPack).toContain("grading, or production result is represented.");
    } finally {
      root?.remove();
      reopened?.remove();
      vi.unstubAllGlobals();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("uses F07's valid guided sleeve preset and completes capture without manual correction", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-three-quarter-sleeve-tee-digital-v1");
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());

      const stalePreset = document.createElement("button");
      stalePreset.dataset.action = "capture-accept-preset";
      stalePreset.dataset.fieldId = "unsupported.capture.field";
      root.append(stalePreset);
      stalePreset.click();
      expect(root.querySelector<HTMLElement>("#g03-measurement-capture-status")!.textContent)
        .toContain("Measurement capture field is not defined by the active recipe.");
      stalePreset.remove();

      const definitions = getCaptureFieldDefinitions("fitted");
      const sleeve = definitions.find((definition) => definition.inputKey === "sleeveLength")!;
      for (const definition of definitions) {
        const field = root.querySelector<HTMLElement>(`[data-field-id="${definition.id}"]`)!;
        const presetDetails = field.querySelector<HTMLElement>(".measurement-capture-panel__preset-details")!;
        const preset = field.querySelector<HTMLButtonElement>('[data-action="capture-accept-preset"]')!;
        if (definition.inputKey === "sleeveLength") {
          expect(presetDetails.textContent).toContain("F07 sleeve digital preset");
          expect(presetDetails.textContent).toContain("38 cm below the modeled cap base");
        } else {
          expect(presetDetails.textContent).toContain("Standard M digital preset");
        }
        preset.click();
        if (definition.inputKey === "sleeveLength") {
          const updatedField = root.querySelector<HTMLElement>(`[data-field-id="${sleeve.id}"]`)!;
          expect(updatedField.querySelector(".measurement-capture-panel__reading-summary")?.textContent)
            .toContain("“38” cm");
          expect(updatedField.querySelector(".measurement-capture-panel__reading-details")?.textContent)
            .toContain("F07 sleeve software preset; not measured wearer data");
          expect(updatedField.textContent).toContain("Digital preset — not a measurement of the wearer");
        }
      }

      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit"));
      const sleeveControl = root.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!;
      expect(sleeveControl.value).toBe("38");
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')?.textContent).toBe("");
    } finally {
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  });

  it("keeps the generic Fitted sleeve preset at Standard M 22 cm without an F07 starter", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "garment-fitted");
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());

      const sleeve = getCaptureFieldDefinitions("fitted").find((definition) => definition.inputKey === "sleeveLength")!;
      const field = root.querySelector<HTMLElement>(`[data-field-id="${sleeve.id}"]`)!;
      expect(field.querySelector(".measurement-capture-panel__preset-details")?.textContent)
        .toContain("Standard M digital preset: 22 cm");
      field.querySelector<HTMLButtonElement>('[data-action="capture-accept-preset"]')!.click();
      expect(root.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!.value).toBe("22");
    } finally {
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  });

  it("keeps a manually entered 22 cm F07 sleeve value visible with its entry-specific correction", () => {
    localStorage.clear();
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-three-quarter-sleeve-tee-digital-v1");
      const sleeveLength = root.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!;
      sleeveLength.value = "22";
      sleeveLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(sleeveLength.value).toBe("22");
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')?.textContent)
        .toContain("34–44 cm");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("selects, edits, saves, reopens, and exports the F07 three-quarter-sleeve fitted Tee", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-three-quarter-sleeve-tee-digital-v1");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Three-Quarter-Sleeve Tee");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Fitted Three-Quarter-Sleeve Tee · software defaults");
      const sleeveLength = root.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!;
      expect(root.querySelector<HTMLElement>('label[data-dim-row="sleeveLength"]')!.textContent)
        .toContain("Sleeve length below modeled cap base");
      expect([sleeveLength.min, sleeveLength.max, sleeveLength.step, sleeveLength.value]).toEqual(["34", "44", "1", "38"]);
      expect(root.querySelector<HTMLInputElement>('input[data-option="capSleeveUnderarmTrimCm"]')).toBeNull();

      sleeveLength.value = "45";
      sleeveLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(sleeveLength.value).toBe("45");
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent).toContain("34–44 cm");
      sleeveLength.value = "40";
      sleeveLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent).toBe("");

      clickId(root, "view-pattern");
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: "fitted-three-quarter-sleeve-tee-digital-v1", entryRevision: "2026-10-24.1",
        recipeId: "fitted", recipeRevision: "fitted-three-quarter-sleeve-v1",
        configurationSnapshot: {
          targetStyle: "Fitted tee",
          measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 38, ease: 7 },
          options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
        },
      });
      expect(saved.measurements.sleeveLength).toBe(40);

      root.remove();
      reopened = mount();
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-three-quarter-sleeve-tee-digital-v1"]')!
        .getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Three-Quarter-Sleeve Tee");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="sleeveLength"]')!.value).toBe("40");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      clickId(reopened, "export-svg");
      clickId(reopened, "export-techpack");
      await vi.waitFor(() => expect(files.size).toBe(2), { timeout: 20_000 });
      const svg = [...files.entries()].find(([filename]) => filename.endsWith(".svg"))![1];
      const techPack = [...files.entries()].find(([filename]) => filename.endsWith("-techpack.pdf"))![1];
      const fittedRecipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
      const fittedNotches = notchesForRecipeOptions(fittedRecipe, saved.garmentOptions.fitted);
      const expectedPieces = blockPieces(fittedRecipe.draft(saved.measurements, saved.garmentOptions.fitted));
      expect(svg).toBe(exportSvg(expectedPieces, fittedRecipe.allowances, fittedNotches));
      expect(svg).toContain(">SLEEVE</text>");
      expect(techPack).toContain("Fitted Three-Quarter-Sleeve Tee - Pattern Piece Overview");
      expect(techPack).toContain("Sleeve length \\(cap-hem\\)");
      expect(techPack).toContain("Digital draft only; physical fit unvalidated. No elbow-to-wrist endpoint is guaranteed.");
    } finally {
      root?.remove();
      reopened?.remove();
      vi.unstubAllGlobals();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 20_000);

  it("freezes the F07 whole-run Tech Pack with its digital-only sleeve endpoint limit", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-f07-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-24T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-three-quarter-sleeve-tee-digital-v1");
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      reachExportStage(root);
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("whole-run-tech-pack-pdf");
      const frozenTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "whole-run-tech-pack-pdf");
      expect(await frozenTechPack.artifact.bytes.text())
        .toContain("Digital draft only; physical fit unvalidated. No elbow-to-wrist endpoint is guaranteed.");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);

  it("shows F06 sleeve context in guided capture and value history", async () => {
    localStorage.clear();
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-cap-sleeve-tee-digital-v1");
      clickId(root, "journey-guided");
      const fieldSelector = '[data-field-id="target.sleeve-cap-to-hem"]';
      await vi.waitFor(() => expect(root.querySelector(fieldSelector)).not.toBeNull());
      const field = root.querySelector<HTMLElement>(fieldSelector)!;
      expect(field.textContent).toContain("Sleeve length below modeled cap base");
      expect(field.textContent).toContain("F06 digital sleeve-length target from the modeled cap base to the hem");

      root.querySelector<HTMLButtonElement>('button[data-open-field-history="target.sleeve-cap-to-hem"]')!.click();
      expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.textContent)
        .toContain("Sleeve length below modeled cap base — value source and history");

      const unknownField = document.createElement("button");
      unknownField.dataset.openFieldHistory = "target.unknown-field";
      unknownField.dataset.fieldHistoryRecipe = "fitted";
      unknownField.dataset.fieldHistoryKind = "measurement";
      unknownField.dataset.fieldHistoryKey = "unknownField";
      root.append(unknownField);
      unknownField.click();
      expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.textContent)
        .toContain("This field is not defined for the selected recipe.");
      unknownField.remove();
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("shows N02 neckline context in guided capture and value history", async () => {
    localStorage.clear();
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-tank-high-neck-digital-v1");
      clickId(root, "journey-guided");
      const fieldSelector = '[data-field-id="style.tank-neck-drop"]';
      await vi.waitFor(() => expect(root.querySelector(fieldSelector)).not.toBeNull());
      const field = root.querySelector<HTMLElement>(fieldSelector)!;
      expect(field.textContent).toContain("Additional front neckline drop");
      expect(field.textContent).toContain("higher round front-neckline Tank profile relative to N01");
      expect(field.textContent).toContain("No qualified capture procedure or physical fit validation exists");
      expect(field.textContent).toContain("N02 software guardrail: 0–18 cm in 0.5 cm steps");

      root.querySelector<HTMLButtonElement>('button[data-open-field-history="style.tank-neck-drop"]')!.click();
      const history = root.querySelector<HTMLDialogElement>("#field-history-dialog")!.textContent!;
      expect(history).toContain("Additional front neckline drop — value source and history");
      expect(history).toContain("higher round front-neckline Tank profile relative to N01");
      expect(history).toContain("physical fit validation exists");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("selects, renders, exports, saves, and reopens the F02 waist-darted Fitted Tee", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
    const originalTextLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getComputedTextLength");
    Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value() {
      const text = this as SVGTextElement;
      return { x: 0, y: -0.2, width: (text.textContent?.length ?? 0) * 0.18, height: 0.25 };
    } });
    Object.defineProperty(SVGElement.prototype, "getComputedTextLength", { configurable: true, value() {
      return ((this as SVGTextElement).textContent?.length ?? 0) * 0.18;
    } });
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    try {
      const root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-waist-dart-tee-digital-v1");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Fitted tee");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Waist-darted fitted Tee · software defaults");
      for (const [field, value] of Object.entries({
        waistDartWaistlineFromHps: "43", waistDartIntake: "2", waistDartLength: "10", waistDartPosition: "45",
      })) {
        expect(root.querySelector<HTMLInputElement>(`input[data-option="${field}"]`)!.value).toBe(value);
      }
      expect(root.querySelector<HTMLInputElement>('input[data-field="waistDartWaistlineFromHps"]')).toBeNull();

      clickId(root, "view-pattern");
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(initialSvg).toContain('data-pattern-mark-name="waistDartUpperLeg"');
      expect(initialSvg).toContain('data-pattern-mark-name="waistDartLowerLeg"');
      expect(root.querySelector<HTMLElement>("#pattern-annotation-key")!.textContent).toContain("WAIST DART");
      clickId(root, "view-flat");
      const flatSvg = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg")!.outerHTML;
      expect(flatSvg).toContain("pattern:fitted:mark:front:waistDartUpperLeg");
      expect(flatSvg).toContain("pattern:fitted:mark:front:waistDartLowerLeg");
      expect(flatSvg).toContain("WAIST DART");
      expect(root.querySelector("[data-technical-flat-issues]")).toBeNull();
      clickId(root, "view-pattern");

      const intake = root.querySelector<HTMLInputElement>('input[data-option="waistDartIntake"]')!;
      intake.value = "3";
      intake.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(editedSvg).not.toBe(initialSvg);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: "fitted-waist-dart-tee-digital-v1", recipeRevision: "fitted-waist-dart-v1",
        configurationSnapshot: { targetStyle: "Fitted tee" },
      });
      expect(saved.garmentOptions.fitted).toMatchObject({ waistDartWaistlineFromHps: 43, waistDartIntake: 3,
        waistDartLength: 10, waistDartPosition: 45 });

        reachExportStage(root);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(files.size).toBe(5), { timeout: 10_000 });
      const waitForPackageExport = async (filename: string, failurePrefix: string): Promise<void> => {
        await vi.waitFor(() => {
          const failed = root.querySelector<HTMLElement>("#persist-status")!.textContent!.includes(failurePrefix);
          expect(files.has(filename) || failed).toBe(true);
        }, { timeout: 30_000 });
        expect(files.has(filename), root.querySelector<HTMLElement>("#persist-status")!.textContent).toBe(true);
      };
      clickId(root, "export-cad-dxf");
      await waitForPackageExport("fitted-M-cad-exchange.dxf", "CAD exchange export failed");
      clickId(root, "export-dxf-source-package");
      await waitForPackageExport("fitted-M-cad-exchange-source.json", "Source package export failed");
      expect(files.size).toBe(7);
      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const pdf = [...files.entries()].find(([name]) => name.endsWith(".pdf") && !name.endsWith("-techpack.pdf") && !name.endsWith("-A0.pdf"))![1];
      const a0 = [...files.entries()].find(([name]) => name.endsWith("-A0.pdf"))![1];
      const techPack = [...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1];
      const cadSource = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const cadDxf = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange.dxf"))![1];
      const cadPackage = JSON.parse(cadSource) as {
        dxf: string;
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      const fittedRecipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
      const fittedNotches = notchesForRecipeOptions(fittedRecipe, saved.garmentOptions.fitted);
      const expectedPieces = blockPieces(fittedRecipe.draft(saved.measurements, saved.garmentOptions.fitted));
      expect(svg).toBe(exportSvg(expectedPieces, fittedRecipe.allowances, fittedNotches));
      expect(dxf).toBe(exportDxf(expectedPieces, fittedRecipe.allowances));
      expect(pdf).toBe(exportPdf(expectedPieces, fittedRecipe.allowances, undefined, 1,
        fittedRecipe.tiledPdfLocalCoordinates === true));
      expect(a0).toBe(exportA0Pdf(expectedPieces, fittedRecipe.allowances, fittedNotches, undefined,
        fittedRecipe.a0Overflow === true));
      expect(svg).toContain('data-pattern-mark-name="waistDartUpperLeg"');
      expect(dxf).toContain("MARK_PLACEMENTLINE");
      expect(pdf.startsWith("%PDF-")).toBe(true);
      expect(a0.startsWith("%PDF-")).toBe(true);
      expect(techPack).toContain("Sew the marked front waist dart by matching both legs to the apex");
      expect(cadPackage.manifest.options).toMatchObject({
        waistDartWaistlineFromHps: 43, waistDartIntake: 3, waistDartLength: 10, waistDartPosition: 45,
      });
      expect(cadPackage.manifest.patternMarks.map((mark) => mark.name)).toContain("waistDartUpperLeg");
      expect(cadPackage.manifest.patternMarks.map((mark) => mark.name)).toContain("waistDartLowerLeg");
      expect(cadDxf).toBe(cadPackage.dxf);

      const reopened = mount();
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-waist-dart-tee-digital-v1"]')
        ?.getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistDartIntake"]')?.value).toBe("3");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedSvg);
      root.remove();
      reopened.remove();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
      if (originalGetBBox) Object.defineProperty(SVGElement.prototype, "getBBox", originalGetBBox);
      else delete (SVGElement.prototype as unknown as { getBBox?: unknown }).getBBox;
      if (originalTextLength) Object.defineProperty(SVGElement.prototype, "getComputedTextLength", originalTextLength);
      else delete (SVGElement.prototype as unknown as { getComputedTextLength?: unknown }).getComputedTextLength;
    }
  }, 75_000);

  it("delivers the F03 princess-seam Tee through editing, save/reopen, flats, nests, and exports", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
    const originalTextLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getComputedTextLength");
    Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value() {
      const text = this as SVGTextElement;
      return { x: 0, y: -0.2, width: (text.textContent?.length ?? 0) * 0.18, height: 0.25 };
    } });
    Object.defineProperty(SVGElement.prototype, "getComputedTextLength", { configurable: true, value() {
      return ((this as SVGTextElement).textContent?.length ?? 0) * 0.18;
    } });
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    let root: HTMLElement | null = null;
    let reopened: HTMLElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-princess-tee-digital-v1");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Princess-seam fitted Tee · software defaults");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Princess-seam fitted Tee");
      expect(root.querySelector<HTMLElement>("#g03-route-title")!.textContent)
        .toContain("Review Princess-seam fitted Tee measurements");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");
      for (const [option, value] of Object.entries({ princessSeamShaping: "2", princessApexHorizontal: "55",
        princessApexVertical: "28", princessShoulderOrigin: "60" })) {
        expect(root.querySelector<HTMLInputElement>(`input[data-option="${option}"]`)?.value).toBe(value);
      }
      expect(root.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')).toBeNull();

      clickId(root!, "view-edit");
      await vi.waitFor(() => expect(root!.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      const editorRole = root!.querySelector<HTMLSelectElement>("#editor-role")!;
      expect([...editorRole.options].map((option) => option.value)).toEqual(["front", "frontSide", "back", "sleeve"]);
      const centerEditor = root!.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      editorRole.value = "frontSide";
      editorRole.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root!.querySelector<HTMLSelectElement>("#editor-role")!.value).toBe("frontSide");
      const sideEditor = root!.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(sideEditor).not.toBe(centerEditor);

      clickId(root!, "view-pattern");
      const defaultPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      const patternKey = root.querySelector<HTMLElement>("#pattern-annotation-key")!.textContent!.toLowerCase();
      expect(patternKey).toContain("fitted front center");
      expect(patternKey).toContain("fitted side front (cut 2 mirrored)");
      expect(root.querySelectorAll("#canvas-host svg path").length).toBeGreaterThan(4);
      clickId(root, "view-flat");
      const flatPattern = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg")!.outerHTML;
      expect(flatPattern).toContain("Princess-seam fitted Tee · front technical flat");
      expect(flatPattern).toContain("frontSide:outline:approved-view-pair");
      expect(root.querySelector("[data-technical-flat-issues]")).toBeNull();
      clickId(root, "view-pattern");

      const shaping = root.querySelector<HTMLInputElement>('input[data-option="princessSeamShaping"]')!;
      shaping.value = "3";
      shaping.dispatchEvent(new Event("input", { bubbles: true }));
      const editedPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(editedPattern).not.toBe(defaultPattern);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: "fitted-princess-tee-digital-v1", entryRevision: "2026-10-23.1",
        recipeId: "fitted", recipeRevision: "fitted-princess-seam-v1",
        configurationSnapshot: { targetStyle: "Fitted tee", options: { princessSeamShaping: 2,
          princessApexHorizontal: 55, princessApexVertical: 28, princessShoulderOrigin: 60 } },
      });
      expect(saved.garmentOptions.fitted.princessSeamShaping).toBe(3);

      reopened = mount();
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-princess-tee-digital-v1"]')
        ?.getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="princessSeamShaping"]')?.value).toBe("3");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(editedPattern);
      clickId(reopened, "view-fabric");
      const singleNest = reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML.toLowerCase();
      expect(singleNest).toContain("fitted side front (cut 2 mirrored) (1 of 2)");
      expect(singleNest).toContain("fitted side front (cut 2 mirrored) (2 of 2)");
      clickId(reopened, "nest-marker");
      const markerNest = reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML.toLowerCase();
      expect(markerNest).toContain("xs fitted side front (cut 2 mirrored) (1 of 2)");
      expect(markerNest).toContain("xl fitted side front (cut 2 mirrored) (2 of 2)");

      reachExportStage(reopened);
      const exportIds = ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack",
        "export-cad-dxf", "export-dxf-source-package"];
      expect(exportIds.map((id) => [id, reopened!.querySelector<HTMLButtonElement>(`#${id}`)!.disabled]))
        .toEqual(exportIds.map((id) => [id, false]));
      for (const id of exportIds.slice(0, 5)) clickId(reopened, id);
      await vi.waitFor(() => expect(files.size).toBe(5), { timeout: 10_000 });
      const waitForPackageExport = async (filename: string, failurePrefix: string): Promise<void> => {
        await vi.waitFor(() => {
          const failed = reopened!.querySelector<HTMLElement>("#persist-status")!.textContent!.includes(failurePrefix);
          expect(files.has(filename) || failed).toBe(true);
        }, { timeout: 30_000 });
        expect(files.has(filename), reopened!.querySelector<HTMLElement>("#persist-status")!.textContent).toBe(true);
      };
      clickId(reopened, "export-cad-dxf");
      await waitForPackageExport("fitted-M-cad-exchange.dxf", "CAD exchange export failed");
      clickId(reopened, "export-dxf-source-package");
      await waitForPackageExport("fitted-M-cad-exchange-source.json", "Source package export failed");
      expect([...files.keys()].sort()).toHaveLength(7);
      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf") && !name.endsWith("-cad-exchange.dxf"))![1];
      const pdf = [...files.entries()].find(([name]) => name.endsWith(".pdf") && !name.endsWith("-techpack.pdf") && !name.endsWith("-A0.pdf"))![1];
      const a0 = [...files.entries()].find(([name]) => name.endsWith("-A0.pdf"))![1];
      const techPack = [...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1];
      const cadSource = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const cadDxf = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange.dxf"))![1];
      const fittedRecipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
      const fittedNotches = notchesForRecipeOptions(fittedRecipe, saved.garmentOptions.fitted);
      const expectedPieces = blockPieces(fittedRecipe.draft(saved.measurements, saved.garmentOptions.fitted));
      expect(svg).toBe(exportSvg(expectedPieces, fittedRecipe.allowances, fittedNotches));
      expect(dxf).toBe(exportDxf(expectedPieces, fittedRecipe.allowances));
      expect(pdf).toBe(exportPdf(expectedPieces, fittedRecipe.allowances, undefined, 1,
        fittedRecipe.tiledPdfLocalCoordinates === true));
      expect(a0).toBe(exportA0Pdf(expectedPieces, fittedRecipe.allowances, fittedNotches, undefined,
        fittedRecipe.a0Overflow === true));
      expect(svg.toLowerCase()).toContain("fitted front center");
      expect(svg.toLowerCase()).toContain("fitted side front (cut 2 mirrored)");
      expect(pdf.startsWith("%PDF-")).toBe(true);
      expect(a0.startsWith("%PDF-")).toBe(true);
      expect(techPack).toContain("Princess-seam fitted Tee");
      expect(techPack).toContain("2 side-front pieces as a mirrored pair");
      expect(techPack).toContain("physical fit, comfort, wear, and production behavior are unvalidated");
      const cadPackage = JSON.parse(cadSource) as { dxf: string; manifest: {
        options: Record<string, number>; pieces: readonly { role: string; edges: readonly string[] }[];
      } };
      expect(cadPackage.manifest.options).toMatchObject({ princessSeamShaping: 3,
        princessApexHorizontal: 55, princessApexVertical: 28, princessShoulderOrigin: 60 });
      expect(cadPackage.manifest.pieces.find((piece) => piece.role === "front")?.edges).toContain("princessUpper");
      expect(cadDxf).toBe(cadPackage.dxf);
    } finally {
      delete window.electronAPI;
      root?.remove();
      reopened?.remove();
      localStorage.clear();
      if (originalGetBBox) Object.defineProperty(SVGElement.prototype, "getBBox", originalGetBBox);
      else delete (SVGElement.prototype as unknown as { getBBox?: unknown }).getBBox;
      if (originalTextLength) Object.defineProperty(SVGElement.prototype, "getComputedTextLength", originalTextLength);
      else delete (SVGElement.prototype as unknown as { getComputedTextLength?: unknown }).getComputedTextLength;
    }
  }, 75_000);

  it("freezes the F04 selected-size V-band while withholding graded-band and physical-fit claims", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const exportedFiles = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        exportedFiles.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-fitted-vneck-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-23T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    let currentRoot = root;
    let reopenedRoot: HTMLDivElement | null = null;
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-vneck-tee-digital-v1");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted V-neck Tee");
      expect(root.querySelector<HTMLElement>("[data-export-scope='tee-neckband']")!.hidden).toBe(false);
      expect(root.querySelector<HTMLElement>("[data-export-format='export-tee-selected-techpack']")!.hidden).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.textContent).toBe("Fitted V-band SVG");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");

      const vDrop = root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!;
      vDrop.value = "6";
      vDrop.dispatchEvent(new Event("input", { bubbles: true }));
      const bandLength = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      const bandWidth = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!;
      bandLength.value = "84";
      bandLength.dispatchEvent(new Event("input", { bubbles: true }));
      bandWidth.value = "2.4";
      bandWidth.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      expect(workflow.snapshot.activeStyle.design.garmentOptions.fitted).toMatchObject({
        teeVNeckDropCm: 6,
        teeNeckbandLengthPercent: 84,
        teeNeckbandFinishedWidthCm: 2.4,
        dartIntake: 4,
      });

      root.remove();
      reopenedRoot = document.createElement("div");
      document.body.append(reopenedRoot);
      mountApp(reopenedRoot, { projectWorkflow: workflow });
      currentRoot = reopenedRoot;
      expect(currentRoot.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted V-neck Tee");
      expect(currentRoot.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.value).toBe("6");
      expect(currentRoot.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!.value).toBe("84");
      expect(currentRoot.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!.value).toBe("2.4");

      reachExportStage(currentRoot);
      clickId(currentRoot, "export-tee-selected-techpack");
      await vi.waitFor(() => expect(exportedFiles.has("fitted-M-selected-techpack.pdf")).toBe(true), { timeout: 20_000 });
      const selectedPackExport = exportedFiles.get("fitted-M-selected-techpack.pdf")!;
      expect(selectedPackExport).toContain("Provisional digital V-band construction");
      expect(selectedPackExport).toContain("1 strip");
      expect(selectedPackExport).not.toContain("1 strip; see selected-size V-band SVG");
      expect(exportedFiles.get("fitted-M-selected-techpack.pdf")).toContain("Sew the bust darts; press them toward the hem.");
      const manager = currentRoot.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      manager.open = true;
      const freeze = currentRoot.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(currentRoot.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      expect(workflow.snapshot.exportManifests).toHaveLength(1);
      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.schemaVersion).toBe(4);
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-svg");
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-tech-pack-pdf");
      const frozenBand = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-vneck-band-svg");
      const frozenVBandTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-vneck-band-tech-pack-pdf");
      const frozenWholeRunTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "whole-run-tech-pack-pdf");
      const bandSvg = await frozenBand.artifact.bytes.text();
      expect(bandSvg).toContain("Fitted Tee V-neck band provisional cutting template");
      expect(bandSvg).toContain('data-front-v-drop-cm="14"');
      expect(bandSvg).toContain('data-v-forming-join="start"');
      expect(bandSvg).toContain("physical fit/material behavior unvalidated");
      const selectedText = await frozenVBandTechPack.artifact.bytes.text();
      expect(selectedText).toContain("Fitted V-neck Tee - M - Pattern Piece Overview");
      expect(selectedText).toContain("Sew the bust darts; press them toward the hem.");
      expect(selectedText).toContain("Measured selected-size body neckline");
      expect(selectedText).toContain("1 strip");
      expect(selectedText).not.toContain("1 strip; see selected-size V-band SVG");

      expect(selectedText).toContain("Finished width 2.4 cm");
      const wholeRunText = await frozenWholeRunTechPack.artifact.bytes.text();
      expect(wholeRunText).toContain("V-band output is available only in the selected-size V-band Tech Pack;");
      expect(wholeRunText).toContain("graded-size V-band instructions or pattern output.");
      expect(wholeRunText).not.toContain("V-band settings:");
    } finally {
      workflow.close();
      root.remove();
      reopenedRoot?.remove();
      vi.unstubAllGlobals();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("reports Fitted Scoop neckband geometry failures without enabling exports", () => {
    localStorage.clear();
    const generateBand = vi.spyOn(teeDrafting, "fittedScoopNeckbandTemplateSvg")
      .mockImplementation(() => { throw new Error("synthetic Fitted Scoop geometry failure"); });
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-scoop-tee-digital-v1");
      reachExportStage(root);
      expect(generateBand).toHaveBeenCalled();
      expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
        .toContain("synthetic Fitted Scoop geometry failure");
      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(true);

      generateBand.mockImplementation(() => { throw "synthetic non-Error geometry failure"; });
      const scoopDrop = root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!;
      scoopDrop.value = "6";
      scoopDrop.dispatchEvent(new Event("input", { bubbles: true }));
      reachExportStage(root);
      expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
        .toContain("The selected Fitted Scoop neckband geometry could not be generated.");
      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
    } finally {
      generateBand.mockRestore();
      root.remove();
      localStorage.clear();
    }
  });

  it("selects, saves, reopens and exports F05 Fitted Scoop outputs at one size", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const exportedFiles = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        exportedFiles.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: "app-fitted-scoop-save-reopen",
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-23T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    let reopenedRoot: HTMLDivElement | null = null;
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-scoop-tee-digital-v1");

      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Scoop-neck Tee");
      expect(root.querySelector<HTMLElement>("[data-export-scope='tee-neckband']")!.hidden).toBe(false);
      expect(root.querySelector<HTMLElement>("[data-export-format='export-tee-selected-techpack']")!.hidden).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.textContent).toBe("Fitted Scoop neckband SVG");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Fitted Scoop-neck Tee · software defaults");
      expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
        .toContain("no graded-size template is supplied");

      const scoopDrop = root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!;
      expect(scoopDrop.value).toBe("5");
      scoopDrop.value = "7.5";
      scoopDrop.dispatchEvent(new Event("input", { bubbles: true }));
      const bandLength = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      const bandWidth = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!;
      bandLength.value = "84";
      bandLength.dispatchEvent(new Event("input", { bubbles: true }));
      bandWidth.value = "2.4";
      bandWidth.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      expect(workflow.snapshot.activeStyle.design.garmentOptions.fitted).toMatchObject({
        teeScoopNeckDropCm: 7.5,
        teeNeckbandLengthPercent: 84,
        teeNeckbandFinishedWidthCm: 2.4,
        dartIntake: 4,
      });

      root.remove();
      reopenedRoot = document.createElement("div");
      document.body.append(reopenedRoot);
      mountApp(reopenedRoot, { projectWorkflow: workflow });
      expect(reopenedRoot.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Fitted Scoop-neck Tee");
      expect(reopenedRoot.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!.value).toBe("7.5");
      expect(reopenedRoot.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!.value).toBe("84");
      expect(reopenedRoot.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!.value).toBe("2.4");
      expect(reopenedRoot.querySelector<HTMLButtonElement>('[data-starter-entry-id="fitted-scoop-tee-digital-v1"]')!.getAttribute("aria-pressed"))
        .toBe("true");

      reachExportStage(reopenedRoot);
      clickId(reopenedRoot, "export-tee-neckband");
      await vi.waitFor(() => expect(exportedFiles.has("fitted-M-scoop-neckband.svg")).toBe(true), { timeout: 20_000 });
      const bandSvg = exportedFiles.get("fitted-M-scoop-neckband.svg")!;
      expect(bandSvg).toContain('data-pattern-family="fitted-scoop-tee"');
      expect(bandSvg).toContain("Fitted Scoop-neck Tee neckband provisional cutting template");
      expect(bandSvg).toContain('data-calibration-length-cm="10"');
      expect(bandSvg).toContain("fit/recovery not validated");

      clickId(reopenedRoot, "export-tee-selected-techpack");
      await vi.waitFor(() => expect(exportedFiles.has("fitted-M-selected-techpack.pdf")).toBe(true), { timeout: 20_000 });
      const selectedPack = exportedFiles.get("fitted-M-selected-techpack.pdf")!;
      expect(selectedPack).toContain("Fitted Scoop-neck Tee - M - Pattern Piece Overview");
      expect(selectedPack).toContain("Provisional digital Scoop neckband construction");
      expect(selectedPack).toContain("Measured selected-size body neckline");
      expect(selectedPack).toContain("1 strip");
      expect(selectedPack).toContain("no graded-size band output is supplied");
      expect(selectedPack).toContain("Sew the bust darts; press them toward the hem.");

      const reopenedBandLength = reopenedRoot.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      reopenedBandLength.value = "74";
      reopenedBandLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopenedBandLength.value).toBe("74");
      expect(reopenedRoot.querySelector<HTMLElement>("#tee-neckband-control-error")!.textContent)
        .toContain("75–90%");
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(true);
    } finally {
      workflow.close();
      root.remove();
      reopenedRoot?.remove();
      vi.unstubAllGlobals();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("uses approved synthetic digital grade-plan options in a selected-size Tee Tech Pack", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const now = "2026-10-23T13:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-fitted-scoop-grade-plan-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    const setupRoot = document.createElement("div");
    document.body.append(setupRoot);
    let outputRoot: HTMLDivElement | null = null;
    try {
      mountApp(setupRoot, { projectWorkflow: workflow });
      clickIfPresent(setupRoot, "welcome-start");
      const seededDesign = workflow.snapshot.activeStyle.design;
      const sessionStart = createMeasurementCaptureSession(
        webcrypto.randomUUID(), "tee", now, workflow.snapshot.activeStyle.id,
      );
      let session = sessionStart;
      for (const [index, definition] of getCaptureFieldDefinitions("tee").entries()) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Synthetic digital grade-plan fixture; no physical grading or fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(now) + index + 1).toISOString());
      }
      await workflow.loadMeasurementCapture("tee");
      await workflow.saveMeasurementCapture(session, []);
      const capturedDesign = materializeCustomSizeDesign(seededDesign, session);
      await workflow.createCustomSizeStyle("Synthetic Tee digital plan", capturedDesign);

      const style = workflow.snapshot.activeStyle;
      const options: GarmentOptions = capturedDesign.garmentOptions.tee ?? {};
      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const sourceInputs = {
        measurements: Object.fromEntries(recipe.fields.map((field) => [field, capturedDesign.measurements[field]])),
        options: Object.fromEntries((recipe.options ?? []).flatMap((option) => {
          const value = options[option.id];
          return value === undefined ? [] : [[option.id, value]];
        })),
      };
      const sourceBlock = recipe.draft(capturedDesign.measurements, options);
      const fingerprint = await editEngine.semanticEditSourceFingerprint(
        recipe.name, sourceBlock, webcrypto as unknown as Crypto, sourceInputs,
      );
      await workflow.saveActiveDesign({
        ...style.design,
        semanticEdits: semanticEditEngine.emptySemanticEditDocument(recipe.name, fingerprint, sourceInputs),
      });
      const capture = await workflow.loadMeasurementCapture("tee");
      expect(capture).not.toBeNull();
      const contextResult = await gradePlanContext.createGradePlanContext(
        workflow.snapshot.project.id,
        workflow.snapshot.activeStyle,
        capture!,
        webcrypto as unknown as Crypto,
      );
      expect(contextResult.ok).toBe(true);
      if (!contextResult.ok) throw new Error(contextResult.errors.join(" "));

      const at = (offset: number): string => new Date(Date.parse(now) + 60_000 + offset).toISOString();
      const created = gradePlan.createGradePlanDraft(contextResult.value.binding, contextResult.value.targets, at(0));
      expect(created.ok).toBe(true);
      if (!created.ok) throw new Error(created.errors.join(" "));
      let plan = await workflow.saveGradePlan(created.value);
      const configured = gradePlan.configureGradePlan(created.value, {
        basis: { kind: "user-authored-digital-rule", decision: "Synthetic integration fixture only.",
          digitalRange: "S and M; no physical grading claim." },
        declaredRange: "S and M only; synthetic digital verification.",
        baseSizeLabel: "M",
        sizes: [{ label: "S", position: -1 }, { label: "M", position: 0 }],
        exceptions: [],
      }, at(1));
      expect(configured.ok).toBe(true);
      if (!configured.ok) throw new Error(configured.errors.join(" "));
      plan = await workflow.saveGradePlan(configured.value);
      const completedDraft = gradePlan.updateGradePlanDraft(plan, {
        basis: plan.basis,
        declaredRange: plan.declaredRange,
        baseSizeLabel: plan.baseSizeLabel,
        sizes: plan.sizes,
        targets: plan.targets.map((target) => ({
          ...target,
          deltas: target.deltas.map((delta) => ({
            ...delta,
            deltaFromBase: delta.sizeLabel === "S" ? 0 : delta.deltaFromBase,
          })),
        })),
        exceptions: plan.exceptions,
      }, at(2));
      expect(completedDraft.ok).toBe(true);
      if (!completedDraft.ok) throw new Error(completedDraft.errors.join(" "));
      plan = await workflow.saveGradePlan(completedDraft.value);
      const targetIds = plan.targets.map((target) => target.targetId);
      const reviewed = gradePlan.reviewGradePlan(plan, targetIds, contextResult.value.binding, at(100));
      expect(reviewed.ok).toBe(true);
      if (!reviewed.ok) throw new Error(reviewed.errors.join(" "));
      plan = await workflow.saveGradePlan(reviewed.value);
      const approved = gradePlan.approveGradePlan(plan, targetIds, contextResult.value.binding, at(101));
      expect(approved.ok).toBe(true);
      if (!approved.ok) throw new Error(approved.errors.join(" "));
      await workflow.saveGradePlan(approved.value);

      setupRoot.remove();
      outputRoot = document.createElement("div");
      document.body.append(outputRoot);
      mountApp(outputRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(outputRoot!.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });
      reachExportStage(outputRoot);
      const exportedTechPacks = new Map<string, string>();
      const saveTechPack = vi.fn(async (filename: string, content: string) => {
        exportedTechPacks.set(filename, content);
        return { saved: true, filePath: filename };
      });
      window.electronAPI = {
        saveFile: saveTechPack,
      };
      const exportSize = outputRoot.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "S";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      const selectedTechPack = outputRoot.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!;
      expect(selectedTechPack.disabled).toBe(false);
      selectedTechPack.click();
      await vi.waitFor(() => expect(exportedTechPacks.has("tee-S-selected-techpack.pdf")).toBe(true), { timeout: 20_000 });
      expect(exportedTechPacks.get("tee-S-selected-techpack.pdf")).toContain("Attach the neckband");
    } finally {
      workflow.close();
      setupRoot.remove();
      outputRoot?.remove();
      vi.unstubAllGlobals();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 60_000);

  it("uses the F03 name in guided measurement capture", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-fitted-princess-tee-digital-v1");
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#g03-measurement-capture-title")
        ?.textContent).toBe("Princess-seam fitted Tee guided measurements and targets"));
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("keeps raw Fitted inputs and warns when the dart mouth crosses the underarm", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-fitted-tee-digital-v1");
    const edit = (selector: string, value: string): HTMLInputElement => {
      const input = root.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return input;
    };
    expect(edit('input[data-field="length"]', "59").value).toBe("59");
    expect(edit('input[data-field="armholeDepth"]', "40").value).toBe("40");
    expect(edit('input[data-option="dartIntake"]', "8").value).toBe("8");
    expect(edit('input[data-option="bustApexVertical"]', "20").value).toBe("20");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("Move the apex toward the hem or reduce dart intake");
    root.remove(); localStorage.clear();
  });

  it("keeps F02 controls and marks unavailable on a manually selected Fitted style", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    const style = root.querySelector<HTMLSelectElement>("#style-target")!;
    style.value = "Fitted tee";
    style.dispatchEvent(new Event("change", { bubbles: true }));

    expect(root.querySelector<HTMLInputElement>('input[data-option="waistDartIntake"]')).toBeNull();
    clickId(root, "view-pattern");
    const svg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
    expect(svg).not.toContain('data-pattern-mark-name="waistDartUpperLeg"');
    expect(svg).not.toContain('data-pattern-mark-name="waistDartLowerLeg"');
    root.remove();
    localStorage.clear();
  });

  it("ignores invalid or no-op construction choices and blocks topology changes with semantic edits", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    localStorage.clear();
    const root = mount();
    const initialConstruction = root.querySelector<HTMLSelectElement>("#tee-construction")!;
    initialConstruction.dispatchEvent(new Event("change", { bubbles: true }));
    expect(initialConstruction.value).toBe("set-in");

    const unsupported = new Option("Unsupported", "unsupported");
    initialConstruction.add(unsupported);
    initialConstruction.value = "unsupported";
    initialConstruction.dispatchEvent(new Event("change", { bubbles: true }));
    expect(initialConstruction.value).toBe("unsupported");
    unsupported.remove();
    initialConstruction.value = "set-in";
    initialConstruction.dispatchEvent(new Event("change", { bubbles: true }));

    clickId(root, "view-edit");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const before = [...root.querySelectorAll<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')]
      .find((input) => input.dataset.editorHandleId?.includes("/control/"))!;
    before.value = String(Number(before.value) + 0.05);
    before.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const patternBeforeRejectedSwitch = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;

    const construction = root.querySelector<HTMLSelectElement>("#tee-construction")!;
    expect(construction.value).toBe("set-in");
    construction.value = "raglan";
    construction.dispatchEvent(new Event("change", { bubbles: true }));

    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("set-in");
    expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(patternBeforeRejectedSwitch);
    expect(root.textContent).toContain("Clear pattern edits before changing Tee construction");
  });

  it("clears stale starter provenance on a manual construction change and remembers Raglan across garment navigation", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(false);

    const construction = root.querySelector<HTMLSelectElement>("#tee-construction")!;
    construction.value = "raglan";
    construction.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);

    clickId(root, "garment-woven-shirt");
    expect(root.querySelector<HTMLElement>("#tee-construction-controls")!.hidden).toBe(true);
    clickId(root, "garment-tee");
    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("raglan");
    expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Raglan Tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);

    root.remove();
    localStorage.clear();
  });

  it("exports the selected Raglan pieces, measured neckband joins, and matching Tech Pack with distinct names", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-tee-raglan-digital-v1");
      reachExportStage(root);
      clickId(root, "export-svg");
      clickId(root, "export-dxf");
      clickId(root, "export-tee-neckband");
      clickId(root, "export-tee-selected-techpack");
      await vi.waitFor(() => expect(files.size).toBe(4), { timeout: 10_000 });

      expect([...files.keys()].sort()).toEqual([
        "tee-raglan-M-neckband.svg",
        "tee-raglan-M-selected-techpack.pdf",
        "tee-raglan-M.dxf",
        "tee-raglan-M.svg",
      ]);
      const pattern = files.get("tee-raglan-M.svg")!;
      expect(pattern).toContain(">FRONT</text>");
      expect(pattern).toContain(">BACK</text>");
      expect(pattern).toContain(">SLEEVE</text>");
      const band = files.get("tee-raglan-M-neckband.svg")!;
      expect(band).toContain('data-neckband-anchor="center-back"');
      expect(band).toContain('data-neckband-match="center-front"');
      expect(band).toContain('data-neckband-match="front-raglan-1"');
      expect(band).toContain('data-neckband-match="back-raglan-1"');
      expect(band).not.toContain("data-quarter-notch");
      expect(files.get("tee-raglan-M-selected-techpack.pdf")).toContain("Raglan Tee");
      expect(files.get("tee-raglan-M-selected-techpack.pdf")).toContain("short ends at center back");
    } finally {
      delete window.electronAPI;
      root?.remove();
      localStorage.clear();
    }
  });

  it("separates generic fabric guidance from active Tee starter material and ease intent", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-custom-v1");
    const guidance = root.querySelector("#guidance-host")!.textContent!;
    expect(guidance).toContain("generic material selector");
    expect(guidance).toContain("7 cm ease remains a product choice");
    expect(guidance).not.toContain("Cotton jersey stretches");
    const chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    chestEase.value = "7.25";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-option-chestEase")!.textContent).toContain("0.5 cm increments");
    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "7.5";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-ease")!.textContent).toContain("1 cm increments");
  });

  it("keeps starter origin as provenance after Tee style change and preserves it on reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-custom-v1");
    const style = root.querySelector<HTMLSelectElement>("#style-target")!;
    style.value = "Fitted tee";
    style.dispatchEvent(new Event("change", { bubbles: true }));
    const status = root.querySelector<HTMLElement>("#starter-origin-status")!;
    expect(status.textContent).toContain("Modified from");
    expect(status.textContent).toContain("Fitted tee");
    expect(status.textContent).toContain("Original B1 status: approved for digital scope");
    expect(root.querySelector<HTMLButtonElement>("#starter-tee-classic-custom-v1")!.getAttribute("aria-pressed")).toBe("false");
    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "5";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-ease")!.textContent).not.toContain("candidate supports");
    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.targetStyle).toBe("Fitted tee");
    expect(stored.workspace.starterOrigin.entryRevision).toBe("2026-10-19.3");
    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Fitted tee");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent).toContain("Modified from");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent).toContain("Fitted tee");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent).toContain("Original B1 status: approved for digital scope");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("5");
    const reopenedStyle = reopened.querySelector<HTMLSelectElement>("#style-target")!;
    reopenedStyle.value = "Classic tee";
    reopenedStyle.dispatchEvent(new Event("change", { bubbles: true }));
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent).toContain("B1 technical review approved for digital scope");
    expect(reopened.querySelector<HTMLButtonElement>("#starter-tee-classic-custom-v1")!.getAttribute("aria-pressed")).toBe("true");
    expect(reopened.querySelector<HTMLElement>("#error-ease")!.textContent).toContain("candidate supports");
  });
  it("flushes pending Tee field history before selecting T06 and records its starter options", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-starter-field-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      now: () => "2026-10-19T05:00:00.000Z",
    });
    const recordFieldHistory = vi.spyOn(workflow, "recordFieldHistory");
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = "101";
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "starter-tee-vneck-digital-v1");
      await vi.waitFor(() => expect(recordFieldHistory).toHaveBeenCalledTimes(3));
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure"));
      const recordedInputs = recordFieldHistory.mock.calls.map((call) => call[2]);
      expect(recordedInputs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          recipeId: "tee",
          inputKind: "measurement",
          inputKey: "chest",
        }),
        expect.objectContaining({
          recipeId: "tee",
          inputKind: "option",
          inputKey: "chestEase",
        }),
        expect.objectContaining({
          recipeId: "tee",
          inputKind: "option",
          inputKey: "teeVNeckDropCm",
        }),
      ]));
      await vi.waitFor(() => {
        const record = workflow.snapshot.fieldObservations.find((item) => item.styleId === workflow.snapshot.activeStyle.id)!;
        const vDepth = currentFieldObservation(record, getFieldDefinition("tee", "teeVNeckDropCm", "option")!);
        expect(vDepth).toMatchObject({ rawValue: "5", provenance: "USER_SELECTED" });
        expect(root.querySelector<HTMLElement>('[data-field-source-current="style.tee.tee-vneck-drop-cm"]')?.textContent)
          .toContain("User selected");
      });
      expect(root.querySelector<HTMLElement>('[data-field-source-current="style.tee.tee-vneck-drop-cm"]')?.textContent)
        .not.toContain("Inherited from another style");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Tee V-neck · software defaults");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("restores the Raglan construction and exact candidate origin from an unfinished recovery draft", () => {
    localStorage.clear();
    const raglanEntry = STARTER_REGISTRY.entries.find((entry) => entry.entryId === "tee-raglan-digital-v1")!;
    const recovery = {
      savedAt: 123,
      measurements: { ...STANDARD_M },
      rawMeasurements: { chest: "100" },
      fabric: "#3A4150",
      appearance: DEFAULT_APPEARANCE,
      garmentOptions: { tee: { chestEase: 7 } },
      rawOptions: { tee: { chestEase: "7" } },
      workspace: {
        ...DEFAULT_WORKSPACE,
        teeConstruction: "raglan" as const,
        starterOrigin: starterOriginForEntry(raglanEntry),
      },
      materialSelectionExplicit: false,
      surface: {},
      rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
      semanticEdits: null,
    } as const;
    expect(saveRecoveryToStorage(recovery)).toBe(true);
    const root = mount();
    clickId(root, "recovery-accept");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Raglan · software defaults");
    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("raglan");
    expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Raglan Tee");
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("100");
  });
});
