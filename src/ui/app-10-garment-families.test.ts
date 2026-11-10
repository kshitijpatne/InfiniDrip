// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { mountApp, unmountApp } from "./app";

import { GARMENTS, STANDARD_M, TANK, notchesForRecipeOptions, type GarmentOptions } from "../drafting";

import { TANK_N04_ENTRY_ID, TANK_N05_ENTRY_ID, TANK_N05_PROFILE_ROUTE_KEY, TANK_N06_ENTRY_ID, TANK_N06_PROFILE_ROUTE_KEY, TANK_N07_ENTRY_ID, TANK_N08_ENTRY_ID, TANK_N08_PROFILE_ROUTE_KEY, TANK_N08_SHELF_DROP_OPTION_ID, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID } from "../drafting/tank";

import { blockPieces } from "../drafting/block";

import { SKIRT_A_LINE_ENTRY_ID, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID } from "../drafting/skirt";

import { exportPdf, exportSvg } from "../export";

import * as semanticEditEngine from "../edit/semantic-edit";

import { DEFAULT_APPEARANCE } from "./appearance";

import { DEFAULT_WORKSPACE, saveToStorage } from "./persist";

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
}

function expectedSkirtTiledPdf(localCoordinates: boolean, options: GarmentOptions = {}): string {
  const skirtRecipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
  return exportPdf(
    blockPieces(skirtRecipe.draft(STANDARD_M, options)),
    skirtRecipe.allowances!,
    undefined,
    1,
    localCoordinates,
  );
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



describe("switching to Jeans (S1154)", () => {
  beforeEach(() => localStorage.clear());

  it("uses the current Jeans assessment in the Checks view", () => {
    const root = mount();
    clickId(root, "garment-jeans");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");

    expect(root.querySelector<HTMLButtonElement>("#view-check")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Digital checks pass");
  });

  it("activates the Jeans contract, renders its pattern-linked views, and gates knit material", () => {
    const root = mount();
    clickId(root, "garment-jeans");

    expect(root.querySelector<HTMLButtonElement>("#garment-jeans")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Cotton woven");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed straight mid-rise jeans");
    expect(root.querySelector('input[data-field="chest"]')).toBeNull();
    expect(root.querySelector('input[data-field="thigh"]')?.closest("[data-control-page]")?.getAttribute("data-control-label"))
      .toBe("Finished targets");
    expect(root.querySelector<HTMLInputElement>('[data-option="backPocketDrop"]')!.value).toBe("7");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Cotton woven is an unqualified woven, 0% stretch product seed");

    root.querySelector<HTMLButtonElement>('button[data-open-field-history="target.jeans-finished-knee-transition-girth"]')!.click();
    expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.textContent)
      .toContain("internal pattern transition has no reviewed anatomical mapping");
    clickId(root, "view-body");
    expect(root.querySelectorAll("#analysis-host svg[data-renderer='jeans-body']")).toHaveLength(2);
    expect(root.querySelector("#analysis-host svg[data-view='front'] [data-source-role='frontLeft']")).not.toBeNull();
    expect(root.querySelector("#analysis-host svg[data-view='back'] [data-source-role='backYokeLeft']")).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#body-back")!.click();
    expect(root.querySelector("#analysis-host svg[data-view='back']")).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#body-front")!.click();
    expect(root.querySelector("#analysis-host svg[data-view='front']")).not.toBeNull();
    root.querySelector<HTMLButtonElement>("#body-side")!.click();
    expect(root.querySelector("#analysis-host [data-jeans-body-side-unavailable]")).not.toBeNull();
    expect(root.querySelector("#analysis-host svg[data-croquis-region]")).toBeNull();
    root.querySelector<HTMLButtonElement>("#body-front-back")!.click();

    clickId(root, "assembled-preview-toggle");
    expect(root.querySelector("#garment-host svg[data-renderer='jeans-assembled']")).not.toBeNull();
    expect(root.querySelector("#garment-host [data-component-role='flyShield']")).not.toBeNull();
    expect(root.querySelector("#garment-host [data-disclosure='assembled-component-schematic']")!.textContent)
      .toContain("NOT SEWN OR FIT SIMULATED");
    expect(root.querySelector("#garment-host svg[data-garment='skirt']")).toBeNull();
    clickId(root, "assembled-preview-toggle");
    clickId(root, "view-pattern");
    expect(root.querySelector("#analysis-host svg")).not.toBeNull();
    reachExportStage(root);
    clickId(root, "view-check");
    expect(root.querySelector<HTMLButtonElement>("#view-check")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#canvas-host")?.textContent).toContain("Digital checks pass");

    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();
    expect(root.querySelector("#guidance-host")!.textContent).toContain("compatibility remains unassessed");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
  });

  it("discloses when saved Jeans semantic edits are not reflected in Body or Assembled views", () => {
    const seed = mount();
    clickId(seed, "garment-jeans");
    clickId(seed, "save-pattern");
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
      measurements: typeof STANDARD_M;
      garmentOptions: Record<string, Record<string, number>>;
      workspace: typeof DEFAULT_WORKSPACE;
      fabric: string;
      appearance: typeof DEFAULT_APPEARANCE;
    };
    const recipe = GARMENTS.find((candidate) => candidate.name === "jeans")!;
    const savedOptions = saved.garmentOptions.jeans ?? {};
    const options = Object.fromEntries((recipe.options ?? []).flatMap((option) => {
      if (option.appliesToStyle !== undefined && option.appliesToStyle !== saved.workspace.targetStyle) return [];
      const value = savedOptions[option.id] ?? (option.optional ? undefined : option.defaultValue);
      return value === undefined ? [] : [[option.id, value] as const];
    }));
    const sourceInputs = {
      measurements: Object.fromEntries(recipe.fields.flatMap((field) => {
        const value = saved.measurements[field];
        return typeof value === "number" ? [[field, value] as const] : [];
      })),
      options,
    };
    // A structurally valid but stale saved edit record models the pending-edit
    // state; these schematic routes must disclose that they show the base draft.
    const sourceFingerprint = `semantic-edit:v2:sha256:${"a".repeat(64)}`;
    const document = semanticEditEngine.appendSemanticEditOperations(
      semanticEditEngine.emptySemanticEditDocument(recipe.name, sourceFingerprint, sourceInputs),
      [{
        schemaVersion: 2,
        id: "jeans-body-disclosure",
        kind: "move-anchors",
        recipeId: recipe.name,
        sourceFingerprint,
        moves: [{ anchorId: "jeans/frontLeft/fixture-control", signature: "saved-source-anchor", deltaCm: { x: 0.025, y: 0 } }],
      }],
    );
    expect(saveToStorage(saved.measurements, saved.fabric, saved.garmentOptions, saved.workspace,
      saved.appearance, {}, undefined, document)).toBe(true);
    seed.remove();

    const root = mount();
    clickId(root, "view-body");
    expect(root.querySelector("#analysis-host [data-jeans-edit-preview-notice]")?.textContent)
      .toContain("Saved pattern edits are not reflected in this parametric Jeans schematic");
    clickId(root, "assembled-preview-toggle");
    expect(root.querySelector("#garment-host .semantic-edit-preview-notice")?.textContent)
      .toContain("Saved pattern edits are not reflected in this schematic assembled illustration");
  });

  it("preserves Jeans options through undo, redo, and raw recovery", () => {
    const first = mount();
    clickId(first, "garment-jeans");
    const drop = first.querySelector<HTMLInputElement>('[data-option="backPocketDrop"]')!;
    drop.value = "8";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    expect(drop.value).toBe("8");
    clickId(first, "undo-pattern");
    expect(first.querySelector<HTMLInputElement>('[data-option="backPocketDrop"]')!.value).toBe("7");
    clickId(first, "redo-pattern");
    expect(first.querySelector<HTMLInputElement>('[data-option="backPocketDrop"]')!.value).toBe("8");

    const coinPocketWidth = first.querySelector<HTMLInputElement>('[data-option="coinPocketWidth"]')!;
    coinPocketWidth.value = "";
    coinPocketWidth.dispatchEvent(new Event("input", { bubbles: true }));
    const recovered = mount();
    clickId(recovered, "recovery-accept");
    expect(recovered.querySelector<HTMLButtonElement>("#garment-jeans")!.getAttribute("aria-pressed")).toBe("true");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="backPocketDrop"]')!.value).toBe("8");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="coinPocketWidth"]')!.value).toBe("");
    expect(recovered.querySelector<HTMLInputElement>('[data-option="coinPocketWidth"]')!.getAttribute("aria-invalid")).toBe("true");
  });

  it("pauses output for a relationship-invalid Jeans draft without changing the raw options", () => {
    const root = mount();
    clickId(root, "garment-jeans");

    const hipDepth = root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!;
    hipDepth.value = "30";
    hipDepth.dispatchEvent(new Event("input", { bubbles: true }));
    const crotchDepth = root.querySelector<HTMLInputElement>('input[data-field="crotchDepth"]')!;
    crotchDepth.value = "29";
    crotchDepth.dispatchEvent(new Event("input", { bubbles: true }));

    expect(hipDepth.value).toBe("30");
    expect(crotchDepth.value).toBe("29");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Hip depth");
    expect(root.querySelector("#canvas-host [data-jeans-output-paused]")).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

    root.querySelector<HTMLButtonElement>('[data-material-option="Cotton jersey"]')!.click();
    expect(root.querySelector("#guidance-host")!.textContent).toContain("compatibility remains unassessed");
    clickId(root, "view-body");
    expect(root.querySelector("#canvas-host [data-jeans-body-paused]")).not.toBeNull();
    clickId(root, "assembled-preview-toggle");
    expect(root.querySelector("#canvas-host [data-jeans-assembled-paused]")).not.toBeNull();
  });
});



describe("S1203 N04 Square-neck Tank", () => {
  it("selects, edits, saves, reopens, rejects a restored invalid corner, and exports the digital shell", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    let invalidRestored: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_N04_ENTRY_ID}`)!;
      expect(card.textContent).toContain("Square-neck Tank · software defaults");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)).toBeNull();
      clickId(root, `starter-${TANK_N04_ENTRY_ID}`);

      const radius = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!;
      expect([radius.getAttribute("aria-label"), radius.min, radius.max, radius.step, radius.value])
        .toEqual(["Square-corner easing (digital)", "0", "1.5", "0.5", "0"]);
      expect(root.querySelector<HTMLElement>(`[data-option-help="option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.textContent)
        .toContain("not a sewing radius or finish specification");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Square-neck Tank · software defaults");

      clickId(root, "journey-next");
      const optionPage = radius.closest<HTMLElement>("fieldset[data-control-page]")!;
      const pageSelect = root.querySelector<HTMLSelectElement>("#control-page-select")!;
      pageSelect.value = optionPage.dataset.controlPage!;
      pageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      clickId(root, "view-pattern");
      const sharpCornerSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      radius.value = "1";
      radius.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.textContent).toBe("");
      const easedCornerSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(easedCornerSvg).not.toBe(sharpCornerSvg);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.garmentOptions.tank[TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]).toBe(1);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_N04_ENTRY_ID,
        recipeId: "tank",
        recipeRevision: "tank-square-neck-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          options: { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 0 },
        },
      });

      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.value)
        .toBe("1");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_N04_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(easedCornerSvg);

      const invalidEdit = reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!;
      invalidEdit.value = "2";
      invalidEdit.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopened.querySelector<HTMLElement>(`[data-input-error="option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.textContent)
        .toContain("0–1.5 cm");
      await vi.waitFor(() => expect(localStorage.getItem("patternworks_recovery_v1")).not.toBeNull());
      unmountApp();
      root.remove();
      reopened.remove();
      invalidRestored = mount();
      expect(invalidRestored.querySelector("#recovery-accept")).not.toBeNull();
      clickId(invalidRestored, "recovery-accept");
      const restoredRadius = invalidRestored.querySelector<HTMLInputElement>(`input[data-option="${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!;
      expect(restoredRadius.value).toBe("2");
      expect(invalidRestored.querySelector<HTMLElement>(`[data-input-error="option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.textContent)
        .toContain("0–1.5 cm");
      expect(invalidRestored.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      restoredRadius.value = "1";
      restoredRadius.dispatchEvent(new Event("input", { bubbles: true }));
      expect(invalidRestored.querySelector<HTMLElement>(`[data-input-error="option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}"]`)!.textContent).toBe("");

      reachExportStage(invalidRestored);
      invalidRestored.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgEntry = [...files.entries()].find(([filename]) => filename.endsWith("-M.svg"))!;
      expect(svgEntry[0]).toBe("square-neck-tank-M.svg");
      const svgOutput = svgEntry[1];
      expect([...files.keys()]).toEqual(["square-neck-tank-M.svg"]);
      const chosenOptions = { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 1 };
      const expectedSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, chosenOptions)),
        TANK.allowances,
        notchesForRecipeOptions(TANK, chosenOptions),
      );
      const defaultSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 0 })),
        TANK.allowances,
        notchesForRecipeOptions(TANK, { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 0 }),
      );
      expect(svgOutput).toContain("<svg");
      expect(svgOutput).toBe(expectedSvg);
      expect(svgOutput).not.toBe(defaultSvg);

      invalidRestored.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      expect([...files.keys()]).toEqual(["square-neck-tank-M.svg", "square-neck-tank-techpack.pdf"]);
      const techPack = [...files.entries()].find(([filename]) => filename.endsWith("techpack.pdf"))?.[1];
      expect(techPack).toBeDefined();
      const techPackText = visiblePdfText(techPack!);
      expect(techPackText).toContain("Square-neck Tank");
      expect(techPackText).toContain("Digital N04 square-corner easing: 1 cm.");
      expect(techPackText).toContain("No sourcing or consumption estimate");
      expect(techPackText).toContain("no facing or binding template");
      expect(techPackText).not.toContain("Cotton jersey");
      expect(techPackText).not.toContain("Neckband");
    } finally {
      root?.remove();
      reopened?.remove();
      invalidRestored?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
});



describe("S1207 N05 V-neck Tank", () => {
  it("selects, edits, saves, reopens, and exports the V-neck digital shell", async () => {
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
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_N05_ENTRY_ID}`)!;
      expect(card.textContent).toContain("V-neck Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${TANK_N05_ENTRY_ID}`);

      const neckDrop = root.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!;
      expect(neckDrop.getAttribute("aria-label")).toBe("Front neckline drop");
      expect(root.querySelector<HTMLElement>('[data-dim-row="neckDrop"] > span')!.textContent)
        .toContain("Front neckline drop");
      expect(neckDrop.value).toBe("5");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_N05_PROFILE_ROUTE_KEY}"]`)).toBeNull();
      expect(root.querySelector<HTMLElement>(`#starter-limits-${TANK_N05_ENTRY_ID}`)!.textContent)
        .toContain("No facing, binding template, sewn tolerance, or construction method is specified");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: V-neck Tank · software defaults");

      neckDrop.value = "7";
      neckDrop.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#error-neckDrop")!.textContent).toBe("");
      clickId(root, "view-pattern");
      const vPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(vPattern).toContain("<svg");
      expect(root.querySelectorAll("#pattern-annotation-key [data-pattern-piece-name]")).toHaveLength(2);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_N05_ENTRY_ID,
        recipeId: "tank",
        recipeRevision: "tank-v-neck-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          measurements: { neckDrop: 5 },
          options: {},
        },
      });
      expect(saved.measurements.neckDrop).toBe(7);
      expect(saved.garmentOptions.tank).not.toHaveProperty(TANK_N05_PROFILE_ROUTE_KEY);

      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: V-neck Tank · software defaults");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("physical validation not performed");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="neckDrop"]')!.value).toBe("7");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_N05_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(vPattern);

      clickId(reopened, "view-body");
      const bodyView = reopened.querySelector("#canvas-host svg")!.innerHTML;
      expect(bodyView).toContain('data-edge="neckDrop"><path d="M -7 0 L 0 15 L 7 0"');
      expect(bodyView).toContain("Neck depth 7");
      clickId(reopened, "assembled-preview-toggle");
      const assembled = reopened.querySelector<SVGSVGElement>("#garment-host svg")!;
      const assembledPieces = [...assembled.querySelectorAll<SVGPathElement>('path[data-edge="ease"]')];
      expect(assembled.textContent).toContain("FRONT");
      expect(assembled.textContent).toContain("BACK");
      expect(assembledPieces).toHaveLength(2);
      expect(assembledPieces[0]!.getAttribute("d")).toContain("L -7 0 L 0 15 L 7 0 Z");

      reachExportStage(reopened);
      reopened.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgEntry = [...files.entries()].find(([filename]) => filename.endsWith("-M.svg"))!;
      expect(svgEntry).toBeDefined();
      const svgOutput = svgEntry[1];
      const routeOptions = { [TANK_N05_PROFILE_ROUTE_KEY]: 1 };
      const expectedSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, routeOptions)),
        TANK.allowances,
        notchesForRecipeOptions(TANK, routeOptions),
      );
      expect(svgOutput).toBe(expectedSvg);

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const techPackEntry = [...files.entries()].find(([filename]) => filename.endsWith("-techpack.pdf"))!;
      expect(techPackEntry).toBeDefined();
      const techPack = visiblePdfText(techPackEntry[1]);
      expect(techPack).toContain("V-neck Tank");
      expect(techPack).toContain("No sourcing or consumption estimate");
      expect(techPack).toContain("neckline finish unspecified");
      expect(techPack).toContain("no facing or binding template");
      expect(techPack).toContain("physical fit");
      expect(techPack).not.toContain("Cotton jersey");
      expect(techPack).not.toContain("Neckband");
    } finally {
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
});



describe("S1211 N06 Cropped Tank", () => {
  it("selects, preserves, blocks the invalid depth/length pair, reopens, and exports the digital shell", async () => {
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
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_N06_ENTRY_ID}`)!;
      expect(card.textContent).toContain("Cropped Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${TANK_N06_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Cropped Tank");
      expect(root.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("53");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("7");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${TANK_N06_PROFILE_ROUTE_KEY}"]`)).toBeNull();
      expect(root.querySelector<HTMLElement>(`#starter-limits-${TANK_N06_ENTRY_ID}`)!.textContent)
        .toContain("no physical crop location");

      clickId(root, "view-pattern");
      const initialPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(initialPattern).not.toMatch(/NaN|Infinity/);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_N06_ENTRY_ID,
        recipeId: "tank",
        recipeRevision: "tank-cropped-v1",
        configurationSnapshot: {
          targetStyle: "Crop tank",
          measurements: { length: 53, ease: 7 },
          options: {},
        },
      });
      expect(saved.garmentOptions.tank).not.toHaveProperty(TANK_N06_PROFILE_ROUTE_KEY);

      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Cropped Tank · software defaults");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("53");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("7");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_N06_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(initialPattern);

      const setField = (field: string, value: string): void => {
        const input = reopened!.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      setField("length", "40");
      setField("armholeDepth", "40");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("40");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="armholeDepth"]')!.value).toBe("40");
      expect(reopened.querySelector<HTMLElement>("#error-armholeDepth")!.textContent)
        .toContain("must be less than body length");

      clickIfPresent(reopened, "welcome-start");
      clickId(reopened, "journey-step-fit");
      clickId(reopened, "journey-next");
      const blockedNext = reopened.querySelector<HTMLButtonElement>("#journey-next");
      expect(blockedNext === null || blockedNext.disabled).toBe(true);
      const blockedSvg = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      expect(blockedSvg.disabled).toBe(true);
      blockedSvg.click();
      expect(saveFile).not.toHaveBeenCalled();

      setField("armholeDepth", "39");
      expect(reopened.querySelector<HTMLElement>("#error-armholeDepth")!.textContent).toBe("");
      setField("length", "53");
      setField("armholeDepth", "24");
      reachExportStage(reopened);
      expect(reopened.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      reopened.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgEntry = [...files.entries()].find(([filename]) => filename.endsWith("-M.svg"))!;
      expect(svgEntry).toBeDefined();
      const expectedOptions = { [TANK_N06_PROFILE_ROUTE_KEY]: 1 };
      expect(svgEntry[1]).toBe(exportSvg(
        blockPieces(TANK.draft({ ...saved.measurements, length: 53, armholeDepth: 24 }, expectedOptions)),
        TANK.allowances,
        notchesForRecipeOptions(TANK, expectedOptions),
      ));

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const techPackEntry = [...files.entries()].find(([filename]) => filename.endsWith("-techpack.pdf"))!;
      expect(techPackEntry).toBeDefined();
      const techPack = visiblePdfText(techPackEntry[1]);
      expect(techPack).toContain("Digital N06 Cropped Tank shell");
      expect(techPack).toContain("53 cm body length and 7 cm ease are editable software defaults");
      expect(techPack).toContain("no physical crop location");
      expect(techPack).toMatch(/physical fit/i);
      expect(techPack).toContain("Not estimated");
      expect(techPack).not.toContain("No sourcing or consumption estimate");
      expect(techPack).not.toContain("Neckband");
      expect(techPack).not.toContain("Bind the neckline");
      expect(techPack).not.toContain("Join the shoulder seams");
      expect(techPack).toContain("body-length profile");
      expect(techPack).not.toContain("Cotton jersey");
    } finally {
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
});



describe("S1213 N07 Longline Tank", () => {
  it("selects, saves, reopens, drafts boundary profiles, blocks invalid input, and exports digital-only output", async () => {
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
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_N07_ENTRY_ID}`)!;
      expect(card.textContent).toContain("Longline Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${TANK_N07_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Longline Tank");
      const lengthInput = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      const easeInput = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      expect(lengthInput.value).toBe("89");
      expect(lengthInput.min).toBe("78");
      expect(lengthInput.max).toBe("100");
      expect(lengthInput.getAttribute("aria-valuemin")).toBe("78");
      expect(lengthInput.getAttribute("aria-valuemax")).toBe("100");
      expect(lengthInput.dataset.rangeMin).toBe("78");
      expect(lengthInput.dataset.rangeMax).toBe("100");
      expect(lengthInput.closest<HTMLElement>("[data-range-control]")!
        .querySelector<HTMLElement>('[data-range-endpoint="min"]')!.textContent).toBe("78");
      expect(lengthInput.closest<HTMLElement>("[data-range-control]")!
        .querySelector<HTMLElement>('[data-range-endpoint="max"]')!.textContent).toBe("100");
      expect(easeInput.value).toBe("10");
      expect(easeInput.min).toBe("5");
      expect(easeInput.max).toBe("14");
      expect(easeInput.getAttribute("aria-valuemin")).toBe("5");
      expect(easeInput.getAttribute("aria-valuemax")).toBe("14");
      expect(easeInput.closest<HTMLElement>("[data-range-control]")!
        .querySelector<HTMLElement>('[data-range-endpoint="min"]')!.textContent).toBe("5");
      expect(easeInput.closest<HTMLElement>("[data-range-control]")!
        .querySelector<HTMLElement>('[data-range-endpoint="max"]')!.textContent).toBe("14");
      expect(root.querySelector<HTMLElement>(`#starter-limits-${TANK_N07_ENTRY_ID}`)!.textContent)
        .toContain("no physical hem location");

      clickId(root, "view-pattern");
      const initialPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(initialPattern).not.toMatch(/NaN|Infinity/);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_N07_ENTRY_ID,
        recipeId: "tank",
        recipeRevision: "tank-longline-v1",
        configurationSnapshot: {
          targetStyle: "Longline tank",
          measurements: { length: 89, ease: 10 },
          options: {},
        },
      });

      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Longline Tank · software defaults");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("89");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("10");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_N07_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(initialPattern);

      const setField = (field: string, value: string): void => {
        const input = reopened!.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      for (const length of [78, 89, 100]) {
        for (const ease of [5, 10, 14]) {
          setField("length", String(length));
          setField("ease", String(ease));
          expect(reopened.querySelector<HTMLElement>("#error-length")!.textContent).toBe("");
          expect(reopened.querySelector<HTMLElement>("#error-ease")!.textContent).toBe("");
          const svg = reopened.querySelector<SVGSVGElement>("#canvas-host svg")!;
          expect(svg.outerHTML).not.toMatch(/NaN|Infinity/);
          expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
        }
      }

      setField("length", "101");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("101");
      expect(reopened.querySelector<HTMLElement>("#error-length")!.textContent).toContain("78–100 cm");
      clickIfPresent(reopened, "welcome-start");
      clickId(reopened, "journey-step-fit");
      clickId(reopened, "journey-next");
      const blockedExport = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      expect(blockedExport.disabled).toBe(true);
      blockedExport.click();
      expect(saveFile).not.toHaveBeenCalled();

      setField("length", "89");
      setField("ease", "10");
      reachExportStage(reopened);
      const svgButton = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      expect(svgButton.disabled).toBe(false);
      svgButton.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      const svgEntry = [...files.entries()].find(([filename]) => filename.endsWith("-M.svg"))!;
      expect(svgEntry).toBeDefined();
      expect(svgEntry[1]).toContain("<svg");
      expect(svgEntry[1]).not.toMatch(/NaN|Infinity/);

      reopened.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      const techPackEntry = [...files.entries()].find(([filename]) => filename.endsWith("-techpack.pdf"))!;
      expect(techPackEntry).toBeDefined();
      const techPack = visiblePdfText(techPackEntry[1]);
      expect(techPack).toContain("Digital N07 Longline Tank shell");
      expect(techPack).toContain("89 cm body length and 10 cm ease are editable software defaults");
      expect(techPack).toContain("not a physical longline hem location");
      expect(techPack).toContain("generic Tank size run is not a validated N07 grade");
      expect(techPack).toContain("Not estimated");
      expect(techPack).not.toContain("Cotton jersey");
      expect(techPack).not.toContain("Bind the neckline");
      expect(techPack).not.toContain("Join the shoulder seams");
      expect(techPack).not.toContain("Hem the body");
      expect(techPack).not.toContain("Tol +/-");
      expect(techPack).not.toContain("Fit Pass");
    } finally {
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
});



describe("S1215 N08 Shelf-lined Tank", () => {
  it("selects, saves, restores invalid values, and exports the digital shelf pattern and Tech Pack", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    let invalidRestored: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const card = root.querySelector<HTMLButtonElement>(`#starter-${TANK_N08_ENTRY_ID}`)!;
      expect(card.textContent).toContain("Shelf-lined Tank · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${TANK_N08_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Shelf-lined Tank");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Shelf-lined Tank · software defaults");

      const shelfDrop = root.querySelector<HTMLInputElement>(`input[data-option="${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!;
      expect([shelfDrop.getAttribute("aria-label"), shelfDrop.min, shelfDrop.max, shelfDrop.step, shelfDrop.value])
        .toEqual(["Shelf hem below underarm (digital)", "2", "15", "1", "14"]);
      expect(root.querySelector<HTMLElement>(`[data-option-help="option-${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!.textContent)
        .toContain("not an underbust measurement, support level, or physical-fit target");
      expect(root.querySelector<HTMLElement>(`#starter-limits-${TANK_N08_ENTRY_ID}`)!.textContent)
        .toContain("Elastic width, cut length, tension, material, sourcing and consumption are unspecified");

      clickId(root, "view-pattern");
      const defaultPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
      expect(defaultPattern).toContain('data-pattern-mark-name="elasticAttachmentLine"');
      expect(root.querySelectorAll("#pattern-annotation-key [data-pattern-piece-name]")).toHaveLength(4);
      expect(root.querySelectorAll('#canvas-host [data-pattern-mark-name="elasticAttachmentLine"]')).toHaveLength(2);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
      expect(saved.garmentOptions.tank[TANK_N08_SHELF_DROP_OPTION_ID]).toBe(14);
      expect(saved.garmentOptions.tank).not.toHaveProperty(TANK_N08_PROFILE_ROUTE_KEY);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TANK_N08_ENTRY_ID,
        recipeId: "tank",
        recipeRevision: "tank-shelf-lined-v1",
        configurationSnapshot: {
          targetStyle: "Classic tank",
          options: { [TANK_N08_SHELF_DROP_OPTION_ID]: 14 },
        },
      });

      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!.value)
        .toBe("14");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TANK_N08_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(defaultPattern);

      let reopenedDrop = reopened.querySelector<HTMLInputElement>(`input[data-option="${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!;
      reopenedDrop.value = "16";
      reopenedDrop.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopenedDrop.value).toBe("16");
      expect(reopened.querySelector<HTMLElement>(`[data-input-error="option-${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!.textContent)
        .toContain("2–15 cm");
      await vi.waitFor(() => expect(localStorage.getItem("patternworks_recovery_v1")).not.toBeNull());
      unmountApp();
      root.remove();
      reopened.remove();
      invalidRestored = mount();
      expect(invalidRestored.querySelector("#recovery-accept")).not.toBeNull();
      clickId(invalidRestored, "recovery-accept");
      reopenedDrop = invalidRestored.querySelector<HTMLInputElement>(`input[data-option="${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!;
      expect(reopenedDrop.value).toBe("16");
      expect(invalidRestored.querySelector<HTMLElement>(`[data-input-error="option-${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!.textContent)
        .toContain("2–15 cm");
      expect(invalidRestored.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      reopenedDrop.value = "15";
      reopenedDrop.dispatchEvent(new Event("input", { bubbles: true }));
      expect(invalidRestored.querySelector<HTMLElement>(`[data-input-error="option-${TANK_N08_SHELF_DROP_OPTION_ID}"]`)!.textContent)
        .toBe("");
      reachExportStage(invalidRestored);
      expect(invalidRestored.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      invalidRestored.querySelector<HTMLButtonElement>("#export-svg")!.click();
      invalidRestored.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      expect(files.has("shelf-lined-tank-M.svg")).toBe(true);
      expect(files.has("shelf-lined-tank-M.dxf")).toBe(true);
      const expectedOptions = {
        [TANK_N08_PROFILE_ROUTE_KEY]: 1,
        [TANK_N08_SHELF_DROP_OPTION_ID]: 15,
      };
      const expectedSvg = exportSvg(
        blockPieces(TANK.draft(saved.measurements, expectedOptions)),
        TANK.allowances,
        notchesForRecipeOptions(TANK, expectedOptions),
      );
      expect(files.get("shelf-lined-tank-M.svg")).toBe(expectedSvg);
      expect(files.get("shelf-lined-tank-M.svg")).toContain('data-pattern-mark-name="elasticAttachmentLine"');
      expect(files.get("shelf-lined-tank-M.dxf")!.match(/\nPOLYLINE\n/gu)).toHaveLength(8);

      const packageButton = invalidRestored.querySelector<HTMLButtonElement>("#export-dxf-source-package")!;
      expect(packageButton.disabled).toBe(false);
      packageButton.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(3), { timeout: 15000 });
      const packageJson = JSON.parse(files.get("shelf-lined-tank-M-cad-exchange-source.json")!) as {
        readonly dxf: string;
        readonly manifest: {
          readonly options: Record<string, number>;
          readonly pieces: readonly { readonly role: string; readonly onFold: boolean }[];
          readonly patternMarks: readonly { readonly name: string }[];
        };
      };
      expect(packageJson.manifest.options[TANK_N08_SHELF_DROP_OPTION_ID]).toBe(15);
      expect(packageJson.manifest.pieces.map((piece) => piece.role)).toEqual(["front", "back", "shelfFront", "shelfBack"]);
      expect(packageJson.manifest.pieces.filter((piece) => piece.role.startsWith("shelf")).every((piece) => piece.onFold)).toBe(true);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name === "elasticAttachmentLine")).toHaveLength(2);

      invalidRestored.querySelector<HTMLButtonElement>("#export-cad-dxf")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 15000 });
      expect(files.get("shelf-lined-tank-M-cad-exchange.dxf")).toBe(packageJson.dxf);

      invalidRestored.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(5));
      const techPack = visiblePdfText(files.get("shelf-lined-tank-techpack.pdf")!);
      expect(techPack).toContain("Shelf-lined Tank");
      expect(techPack).toContain("Digital N08 panel set");
      expect(techPack).toContain("15 cm below underarm (software)");
      expect(techPack).toContain("No sourcing or consumption estimate");
      expect(techPack).toContain("Elastic width, cut length, tension, material");
      expect(techPack).not.toContain("Cotton jersey");
      expect(techPack).not.toContain("Bind the neckline");
      expect(techPack).not.toContain("Join the shoulder seams");
      expect(techPack).not.toContain("Tol +/-");
      expect(techPack).not.toContain("Fit Pass");
    } finally {
      root?.remove();
      reopened?.remove();
      invalidRestored?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("K01 A-line-like skirt starter workflow", () => {
  it("keeps the sweep entry-scoped, corrects invalid inputs, and saves the selected digital profile", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_A_LINE_ENTRY_ID}`);

      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: A-line skirt · software defaults");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`)!.value)
        .toBe("12");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("A-line-like skirt");
      reachExportStage(root);

      const sweep = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`)!;
      sweep.value = "25";
      sweep.dispatchEvent(new Event("input", { bubbles: true }));
      expect(sweep.value).toBe("25");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("supports 4–24 cm");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`)!.textContent)
        .toContain("supports 4–24 cm");

      sweep.value = "12.5";
      sweep.dispatchEvent(new Event("input", { bubbles: true }));
      expect(sweep.value).toBe("12.5");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("use 1 cm increments");

      sweep.value = "4";
      sweep.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).not.toContain("supports 4–24 cm");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).not.toContain("use 1 cm increments");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`)?.textContent).toBe("");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();

      const hipDepth = root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!;
      hipDepth.value = "40";
      hipDepth.dispatchEvent(new Event("input", { bubbles: true }));
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "40";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      expect(length.value).toBe("40");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("Length (40 cm) does not clear the hip depth (40 cm)");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("Lengthen the skirt or reduce the hip depth");
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent)
        .toContain("Lengthen the skirt or reduce the hip depth");

      length.value = "70";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')?.textContent).toBe("");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({ [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: 4 });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_A_LINE_ENTRY_ID,
        recipeRevision: "skirt-a-line-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`)!.value)
        .toBe("4");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_A_LINE_ENTRY_ID}"]`)!
        .getAttribute("aria-pressed")).toBe("true");

      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`))
        .toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("keeps the A-line identity and digital-only limits in all six output actions", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_A_LINE_ENTRY_ID}`);
      reachExportStage(root);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "a-line-like-skirt-M-A0.pdf",
        "a-line-like-skirt-M.dxf",
        "a-line-like-skirt-M.pdf",
        "a-line-like-skirt-M.svg",
        "a-line-like-skirt-projector.svg",
        "a-line-like-skirt-techpack.pdf",
      ].sort());

      expect(files.get("a-line-like-skirt-M.pdf")).toBe(expectedSkirtTiledPdf(true, {
        [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: 12,
      }));
      const projectorText = [...new DOMParser().parseFromString(
        files.get("a-line-like-skirt-projector.svg")!, "image/svg+xml",
      ).getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("A-line-like skirt");
      expect(projectorText).toContain("Digital A-line-like hem sweep; grading is not validated.");

      const techPackText = visiblePdfText(files.get("a-line-like-skirt-techpack.pdf")!);
      expect(techPackText).toContain("Hem circumference (modeled)");
      expect(techPackText).toContain("Digital pattern guidance only");
      expect(techPackText).toContain(
        "Digital A-line-like skirt using a 12 cm whole-garment hem-sweep software setting over a dartless block.",
      );
      expect(techPackText).toContain("does not model literal dart transfer");
      expect(techPackText).toContain("physical fit");
      expect(techPackText).toContain("unvalidated");

      clickId(root, "garment-skirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      reachExportStage(root);
      clickId(root, "export-svg");
      clickId(root, "export-pdf");
      clickId(root, "export-projector");
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(9));
      expect(files.has("skirt-M.svg")).toBe(true);
      expect(files.get("skirt-M.pdf")).toBe(expectedSkirtTiledPdf(false));
      expect(files.get("skirt-M.svg")).not.toBe(files.get("a-line-like-skirt-M.svg"));
      expect(files.has("skirt-projector.svg")).toBe(true);
      const genericProjectorText = [...new DOMParser().parseFromString(
        files.get("skirt-projector.svg")!, "image/svg+xml",
      ).getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(genericProjectorText).not.toContain("Digital A-line-like hem sweep; grading is not validated.");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });
});
