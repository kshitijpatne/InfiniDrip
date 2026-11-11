// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Blob as NodeBlob } from "node:buffer";

import { webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { mountApp, unmountApp } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import { isCustomOneSizeStyle } from "./project-records";

import { materializeCustomSizeDesign } from "./custom-size-materialization";

import * as gradePlanContext from "./grade-plan-context";

import * as gradePlan from "./grade-plan";

import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";

import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";

import { GARMENTS, type GarmentOptions } from "../drafting";

import * as drafting from "../drafting";

import { SKIRT_A_LINE_ENTRY_ID, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID, SKIRT_PENCIL_ENTRY_ID, SKIRT_PENCIL_HEM_TAPER_OPTION_ID, SKIRT_GATHERED_ENTRY_ID, SKIRT_GATHER_RATIO_OPTION_ID, SKIRT_CASING_DEPTH_OPTION_ID, SKIRT_BOX_PLEAT_ENTRY_ID, SKIRT_BOX_PLEAT_COUNT_OPTION_ID, SKIRT_BOX_PLEAT_SPACING_OPTION_ID, SKIRT_TIERED_ENTRY_ID, SKIRT_TIER_COUNT_OPTION_ID, SKIRT_TIER_GATHER_RATIO_OPTION_ID } from "../drafting/skirt";

import * as editEngine from "../edit";

import * as semanticEditEngine from "../edit/semantic-edit";

import { STARTER_REGISTRY, starterOriginForEntry } from "./starter-registry";

import { currentFieldObservation, getCaptureFieldDefinitions, getFieldDefinitions } from "./field-provenance";

import { addCaptureReadingForField, createMeasurementCaptureSession } from "./measurement-capture";

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

  it("clears UIQ artwork browsing filters without editing the design or losing the selected placement", async () => {
    localStorage.clear();
    const root = document.createElement("div");
    mountApp(root, { uiqArtworkEnabled: true });
    toStyleStep(root);

    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "saved-placement";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    clickId(root, "surface-add");
    await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));

    const target = root.querySelector<HTMLSelectElement>("#surface-library-target")!;
    target.value = "0";
    target.dispatchEvent(new Event("change", { bubbles: true }));
    const search = root.querySelector<HTMLInputElement>("#surface-library-search")!;
    search.value = "no matching artwork";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    const family = root.querySelector<HTMLSelectElement>("#surface-library-family")!;
    family.value = ARTWORK_CATALOG[0]!.use.garmentFamilies[0]!;
    family.dispatchEvent(new Event("change", { bubbles: true }));
    const printFilter = root.querySelector<HTMLSelectElement>("#surface-library-use-filter")!;
    printFilter.value = "panel";
    printFilter.dispatchEvent(new Event("change", { bubbles: true }));
    const assessment = root.querySelector<HTMLSelectElement>("#surface-library-assess-use")!;
    assessment.value = "all-over";
    assessment.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector(".artwork-library-result-count")!.textContent).toContain("0 of");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);

    root.querySelector<HTMLButtonElement>("#surface-library-clear")!.click();
    expect(search.value).toBe("");
    expect(root.querySelector<HTMLSelectElement>("#surface-library-category")!.value).toBe("");
    expect(family.value).toBe("");
    expect(root.querySelector<HTMLSelectElement>("#surface-library-role")!.value).toBe("");
    expect(printFilter.value).toBe("");
    expect(assessment.value).toBe("placement");
    expect(root.querySelector<HTMLSelectElement>("#surface-library-target")!.value).toBe("0");
    expect(root.querySelector(".artwork-library-result-count")!.textContent).toContain(`${ARTWORK_CATALOG.length} of`);
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    expect(root.querySelector<HTMLInputElement>('[data-surface-field="id"]')!.value).toBe("saved-placement");
  });

  it("keeps the UIQ artwork rollback exact and ignores an injected clear action", () => {
    localStorage.clear();
    const root = document.createElement("div");
    mountApp(root, { uiqArtworkEnabled: false });
    toStyleStep(root);
    const library = root.querySelector<HTMLDetailsElement>("details.artwork-library")!;
    expect(library.classList.contains("uiq-artwork")).toBe(false);
    expect(root.querySelector("#surface-library-clear")).toBeNull();
    expect(root.querySelector(".uiq-artwork-card")).toBeNull();

    const search = root.querySelector<HTMLInputElement>("#surface-library-search")!;
    search.value = "seed";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    const injected = document.createElement("button");
    injected.id = "surface-library-clear";
    root.querySelector("#style-host")!.append(injected);
    injected.click();
    expect(search.value).toBe("seed");
    expect(root.querySelector("#surface-library-clear")).not.toBeNull();
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

  it("keeps the first-run journey on Garment and routes project backup bytes through the optional Electron binary-save bridge", async () => {
    localStorage.clear();
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const ids = ["a12b39ab-4b40-48a9-9499-59583010c112", "b23c40bc-5c51-49ba-a59a-60694121d223"];
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-project-package-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => ids.shift()!,
      now: () => "2026-09-24T16:00:00.000Z",
    });
    expect(workflow.initializedFirstRun).toBe(true);
    const saved: Array<{ filename: string; bytes: Uint8Array }> = [];
    const saveProjectPackage = vi.fn(async (filename: string, bytes: Uint8Array) => {
      saved.push({ filename, bytes });
      return { saved: true, filePath: "C:/test/project.infinidrip.zip" };
    });
    window.electronAPI = {
      saveFile: vi.fn(async () => ({ saved: true })),
      saveProjectPackage,
    };
    const root = document.createElement("div");
    document.body.append(root);
    try {
      localStorage.clear();
      mountApp(root, { projectWorkflow: workflow });
      expect([...root.querySelectorAll<HTMLButtonElement>(".journey-stage")].map((button) => [button.id, button.dataset.stageState]))
        .toEqual([["journey-step-start", "active"], ["journey-step-measure", "pending"], ["journey-step-fit", "pending"], ["journey-step-refine", "pending"], ["journey-step-output", "pending"]]);
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      root.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toBe("Project backup exported."));
      await vi.waitFor(() => expect(saveProjectPackage).toHaveBeenCalledOnce());
      expect(saved[0]!.filename).toMatch(/\.infinidrip\.zip$/);
      expect(saved[0]!.bytes.slice(0, 4)).toEqual(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));
    } finally {
      workflow.close();
      root.remove();
      delete window.electronAPI;
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("resumes guided measurement drafts from the active local style without turning them into readings", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const factory = new IDBFactory();
    const settings = {
      repositoryOptions: { name: `app-capture-resume-${Date.now()}`, factory, crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => "a12b39ab-4b40-48a9-9499-59583010c112",
      now: () => "2026-09-24T16:00:00.000Z",
    };
    let workflow = await openProjectWorkflow(settings);
    let root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>("#welcome-start")?.click();
      root.querySelector<HTMLButtonElement>("#journey-guided")!.click();
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());

      const fieldId = "body.chest-girth";
      const raw = root.querySelector<HTMLInputElement>(`[data-action="capture-edit-raw"][data-field-id="${fieldId}"]`)!;
      raw.value = " 40 1/8 ";
      raw.dispatchEvent(new Event("input", { bubbles: true }));
      const unit = root.querySelector<HTMLSelectElement>(`[data-action="capture-change-unit"][data-field-id="${fieldId}"]`)!;
      unit.value = "in";
      unit.dispatchEvent(new Event("change", { bubbles: true }));
      const note = root.querySelector<HTMLInputElement>(`[data-action="capture-edit-source"][data-field-id="${fieldId}"]`)!;
      note.value = "Tape note, unconfirmed";
      note.dispatchEvent(new Event("input", { bubbles: true }));

      await vi.waitFor(async () => {
        const record = await workflow.loadMeasurementCapture("tee");
        expect(record?.drafts).toEqual([{
          fieldId, rawValue: " 40 1/8 ", enteredUnit: "in", sourceNote: "Tape note, unconfirmed",
          captureMethod: "", captureDate: "", measurer: "",
        }]);
      });
      const beforeReload = await workflow.loadMeasurementCapture("tee");
      expect(beforeReload?.session.fields.find((field) => field.fieldId === fieldId)?.readings).toEqual([]);
      root.remove();
      workflow.close();

      workflow = await openProjectWorkflow(settings);
      root = document.createElement("div");
      document.body.append(root);
      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>("#welcome-start")?.click();
      root.querySelector<HTMLButtonElement>("#journey-guided")!.click();
      await vi.waitFor(() => expect(
        root.querySelector<HTMLInputElement>(`[data-action="capture-edit-raw"][data-field-id="${fieldId}"]`)?.value,
      ).toBe(" 40 1/8 "));
      expect(root.querySelector<HTMLSelectElement>(`[data-action="capture-change-unit"][data-field-id="${fieldId}"]`)!.value).toBe("in");
      expect(root.querySelector<HTMLInputElement>(`[data-action="capture-edit-source"][data-field-id="${fieldId}"]`)!.value)
        .toBe("Tape note, unconfirmed");
      const afterReload = await workflow.loadMeasurementCapture("tee");
      expect(afterReload?.session.id).toBe(beforeReload?.session.id);
      expect(afterReload?.session.fields.find((field) => field.fieldId === fieldId)?.readings).toEqual([]);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("keeps Measure and garment selection in place when a pending guided capture cannot be saved", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const ids = ["a12b39ab-4b40-48a9-9499-59583010c112", "b23c40bc-5c51-49ba-a59a-60694121d223"];
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-capture-save-failure-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => ids.shift() ?? webcrypto.randomUUID(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    const styleId = workflow.snapshot.activeStyle.id;
    const session = getCaptureFieldDefinitions("tee").reduce((current, definition, index) => addCaptureReadingForField(
      current,
      definition.id,
      {
        id: webcrypto.randomUUID(),
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Explicit test fixture, not fit-qualified.",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      },
      `2026-09-24T16:00:${String(index + 1).padStart(2, "0")}.000Z`,
    ), createMeasurementCaptureSession(webcrypto.randomUUID(), "tee", "2026-09-24T16:00:00.000Z", styleId));
    await workflow.saveMeasurementCapture(session, []);
    const failingSave = vi.spyOn(workflow, "saveMeasurementCapture")
      .mockRejectedValueOnce(new Error("synthetic capture persistence failure"))
      .mockRejectedValueOnce("synthetic non-Error capture persistence failure");
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());
      const raw = root.querySelector<HTMLInputElement>('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]')!;
      raw.value = "40 1/8";
      raw.dispatchEvent(new Event("input", { bubbles: true }));

      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed"));
      expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("measure");
      expect(root.querySelector("#project-persistence-state")?.textContent).toContain("synthetic capture persistence failure");

      raw.value = "40 1/8, second attempt";
      raw.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(failingSave).toHaveBeenCalledTimes(2));
      clickId(root, "journey-step-start");
      clickId(root, "garment-skirt");
      await vi.waitFor(() => expect(root.querySelector("#project-persistence-state")?.textContent)
        .toBe("Guided measurements could not be saved."));
      expect(root.querySelector("#current-garment")?.textContent).toBe("Tee");
      expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("start");
      expect(root.querySelector("#project-persistence-state")?.textContent).toBe("Guided measurements could not be saved.");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("clears a pending guided-capture save timer when unmounting", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-capture-timer-cleanup-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      const session = createMeasurementCaptureSession(
        webcrypto.randomUUID(), "tee", "2026-09-24T16:00:00.000Z", workflow.snapshot.activeStyle.id,
      );
      await workflow.saveMeasurementCapture(session, []);
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());

      const firstFieldId = getCaptureFieldDefinitions("tee")[0]!.id;
      const preset = root.querySelector<HTMLButtonElement>(
        `[data-action="capture-accept-preset"][data-field-id="${firstFieldId}"]`,
      )!;
      preset.click(); // Schedules the 250 ms persistence debounce.
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
      unmountApp();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("creates a one-size custom Skirt through the empty recipe-option fallback", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-custom-skirt-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "welcome-start");
      clickId(root, "garment-skirt");
      await vi.waitFor(() => expect(root.querySelector("#current-garment")?.textContent).toBe("Skirt"));
      const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
      expect(recipe.options).toEqual([
        expect.objectContaining({
          id: SKIRT_A_LINE_HEM_SWEEP_OPTION_ID,
          appliesToStarterEntryId: SKIRT_A_LINE_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_PENCIL_HEM_TAPER_OPTION_ID,
          appliesToStarterEntryId: SKIRT_PENCIL_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_GATHER_RATIO_OPTION_ID,
          appliesToStarterEntryId: SKIRT_GATHERED_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_CASING_DEPTH_OPTION_ID,
          appliesToStarterEntryId: SKIRT_GATHERED_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_BOX_PLEAT_COUNT_OPTION_ID,
          appliesToStarterEntryId: SKIRT_BOX_PLEAT_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_BOX_PLEAT_SPACING_OPTION_ID,
          appliesToStarterEntryId: SKIRT_BOX_PLEAT_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_TIER_COUNT_OPTION_ID,
          appliesToStarterEntryId: SKIRT_TIERED_ENTRY_ID,
        }),
        expect.objectContaining({
          id: SKIRT_TIER_GATHER_RATIO_OPTION_ID,
          appliesToStarterEntryId: SKIRT_TIERED_ENTRY_ID,
        }),
      ]);

      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_A_LINE_HEM_SWEEP_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_PENCIL_HEM_TAPER_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_CASING_DEPTH_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`,
      )).toBeNull();
      expect(root.querySelector<HTMLInputElement>(
        `input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`,
      )).toBeNull();
      for (const definition of getCaptureFieldDefinitions("skirt")) {
        const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
          .find((button) => button.dataset.fieldId === definition.id);
        if (!preset) throw new Error(`No digital preset button for ${definition.id}`);
        preset.click();
      }

      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit"),
        { timeout: 20_000 });
      expect(workflow.snapshot.activeStyle.recipeId).toBe("skirt");
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt).toEqual({});
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("creates a custom style when the selected recipe omits its option catalog", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const source = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const recipe = { ...source, options: undefined };
    const originalGarmentForConstruction = drafting.garmentForConstruction;
    vi.spyOn(drafting, "garmentForConstruction").mockImplementation((name, teeConstruction) => {
      const resolved = originalGarmentForConstruction(name, teeConstruction);
      return name === "skirt" ? recipe : resolved;
    });
    let workflow: Awaited<ReturnType<typeof openProjectWorkflow>> | null = null;
    let root: HTMLDivElement | null = null;
    try {
      workflow = await openProjectWorkflow({
        repositoryOptions: {
          name: `app-optionless-recipe-${Date.now()}`,
          factory: new IDBFactory(),
          crypto: webcrypto as unknown as Crypto,
        },
        storage: localStorage,
        idFactory: () => webcrypto.randomUUID(),
        now: () => "2026-09-24T16:00:00.000Z",
      });
      root = document.createElement("div");
      document.body.append(root);
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "welcome-start");
      clickId(root, "garment-skirt");
      await vi.waitFor(() => expect(root!.querySelector("#current-garment")?.textContent).toBe(recipe.label));
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root!.querySelector(".measurement-capture-panel__field")).not.toBeNull());
      for (const definition of getCaptureFieldDefinitions("skirt")) {
        const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
          .find((button) => button.dataset.fieldId === definition.id);
        if (!preset) throw new Error(`No digital preset button for ${definition.id}`);
        preset.click();
      }

      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit"),
        { timeout: 20_000 });
      expect(workflow.snapshot.activeStyle.recipeId).toBe("skirt");
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt).toEqual({});
    } finally {
      workflow?.close();
      root?.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("turns a ready guided capture into one saved custom style and withholds whole-run controls", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-custom-size-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    await workflow.renameActiveStyle("Custom Woven shirt");
    const root = document.createElement("div");
    document.body.append(root);
    let reopenedRoot: HTMLDivElement | null = null;
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "welcome-start");
      clickId(root, "garment-woven-shirt");
      await vi.waitFor(() => expect(root.querySelector("#current-garment")?.textContent).toBe("Woven shirt"));
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull(), { timeout: 20_000 });
      for (const definition of getCaptureFieldDefinitions("woven-shirt")) {
        const presets = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')];
        const preset = presets
          .find((button) => button.dataset.fieldId === definition.id)!;
        if (!preset) throw new Error(`No digital preset button for ${definition.id}; rendered fields: ${presets.map((button) => button.dataset.fieldId).join(", ")}`);
        preset.click();
      }
      const unfinishedRaw = root.querySelector<HTMLInputElement>(
        '[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]',
      )!;
      unfinishedRaw.value = "103";
      unfinishedRaw.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
      let releaseCreation!: () => void;
      let signalCreation!: () => void;
      let signalCreationFinished!: () => void;
      const creationBlocked = new Promise<void>((resolve) => { releaseCreation = resolve; });
      const creationStarted = new Promise<void>((resolve) => { signalCreation = resolve; });
      const creationFinished = new Promise<void>((resolve) => { signalCreationFinished = resolve; });
      const createCustomStyle = workflow.createCustomSizeStyle.bind(workflow);
      const createCustomStyleSpy = vi.spyOn(workflow, "createCustomSizeStyle").mockImplementation(async (...args) => {
        signalCreation();
        await creationBlocked;
        try {
          return await createCustomStyle(...args);
        } finally {
          signalCreationFinished();
        }
      });
      clickId(root, "journey-next");
      await creationStarted;
      root.querySelector<HTMLButtonElement>("#journey-next")!.dispatchEvent(new Event("click", { bubbles: true }));
      expect(createCustomStyleSpy).toHaveBeenCalledOnce();
      releaseCreation();
      await creationFinished;
      const persistenceStatus = root.querySelector<HTMLElement>("#project-persistence-state")!;
      if (persistenceStatus.dataset.state === "failed") throw new Error(persistenceStatus.textContent ?? "Custom style save failed.");
      expect(isCustomOneSizeStyle(workflow.snapshot.activeStyle)).toBe(true);
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit"));

      expect(workflow.snapshot.styles).toHaveLength(2);
      expect(workflow.snapshot.styles[0]).toMatchObject({ recipeId: "tee", name: "Custom Woven shirt" });
      expect(workflow.snapshot.activeStyle.name).toBe("Custom Woven shirt 2");
      expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit");
      expect(root.querySelector(".measurement-capture-panel")).toBeNull();
      expect([...root.querySelector<HTMLSelectElement>("#export-size")!.options].map((option) => option.textContent))
        .toEqual(["One size"]);
      const oneSizePicker = root.querySelector<HTMLSelectElement>("#export-size")!;
      oneSizePicker.add(new Option("Injected graded step", "2"));
      oneSizePicker.value = "2";
      oneSizePicker.dispatchEvent(new Event("change", { bubbles: true }));
      expect(oneSizePicker.value).toBe("__one-size__");
      expect([...oneSizePicker.options].map((option) => option.textContent)).toEqual(["One size"]);
      expect(root.querySelector<HTMLButtonElement>("#garment-tee")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#garment-woven-shirt")!.disabled).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.title).toContain("approve a grade plan");
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.title).toContain("approve a grade plan");
      expect(await workflow.loadMeasurementCapture("woven-shirt")).toMatchObject({
        styleId: workflow.snapshot.activeStyle.id,
        session: { styleId: workflow.snapshot.activeStyle.id },
        drafts: [expect.objectContaining({ fieldId: "body.chest-girth", rawValue: "103" })],
      });
      expect(currentFieldObservation(
        workflow.snapshot.fieldObservations.find((record) => record.styleId === workflow.snapshot.activeStyle.id)!,
        getFieldDefinitions("woven-shirt")[0]!,
      )?.provenance).toBe("PRESET");

      clickId(root, "journey-next");
      clickId(root, "view-check");
      const customCheckText = root.querySelector("#canvas-host")?.textContent ?? "";
      expect(customCheckText).not.toContain("Size run grows in order");
      expect(customCheckText).toContain("Single custom size");
      expect(customCheckText).toContain("whole-run Tech Pack, Projector, and Marker outputs are not generated in this step");
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("output"));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      const manager = root.querySelector<HTMLElement>("#project-manager-host")!;
      manager.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = manager.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      expect(freeze.disabled).toBe(true);
      expect(manager.querySelector("#project-freeze-guidance")?.textContent)
        .toContain("Whole-run output capture is unavailable until you review and approve a grade plan.");
      expect(workflow.snapshot.exportManifests).toHaveLength(0);
      freeze.removeAttribute("disabled");
      freeze.click();
      await vi.waitFor(() => expect(manager.querySelector("#project-manager-status")?.textContent).toContain("not ready"));
      expect(workflow.snapshot.exportManifests).toHaveLength(0);
      const saveFile = vi.fn(async (filename: string, _content: string) => ({ saved: true, filePath: filename }));
      window.electronAPI = { saveFile };
      const selectedSvgButton = root.querySelector<HTMLButtonElement>("#export-svg")!;
      await vi.waitFor(() => expect(selectedSvgButton.disabled).toBe(false));
      for (const id of ["#export-cad-dxf", "#export-dxf-source-package"]) {
        const button = root.querySelector<HTMLButtonElement>(id)!;
        expect(button.disabled).toBe(true);
        expect(button.title).toContain("registered recipe sizes");
      }
      const cadButton = root.querySelector<HTMLButtonElement>("#export-cad-dxf")!;
      cadButton.disabled = false; // Exercise the handler's stale/programmatic custom-size guard.
      cadButton.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("CAD package export currently requires a registered recipe size."));
      selectedSvgButton.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledOnce());
      expect(saveFile.mock.calls[0]![0]).toBe("woven-shirt-One size.svg");
      delete window.electronAPI;

      const oneSizeDesign = workflow.snapshot.activeStyle.design;
      await workflow.saveActiveDesign({
        ...oneSizeDesign,
        workspace: { ...oneSizeDesign.workspace, view: "fabric", nestScope: "marker" },
      });
      reopenedRoot = document.createElement("div");
      document.body.append(reopenedRoot);
      mountApp(reopenedRoot, { projectWorkflow: workflow });
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(true);
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#nest-marker")!.title).toContain("approve a grade plan");
      expect(reopenedRoot.querySelector("#canvas-host")?.textContent).toContain("Create and approve a grade plan before generating a size run.");
      reopenedRoot.querySelector<HTMLButtonElement>("#load-pattern")!.click();
      await vi.waitFor(() => expect(reopenedRoot?.querySelector("#persist-status")?.textContent).toContain("Loaded"));
      clickId(reopenedRoot, "view-nest");
      expect(reopenedRoot.querySelector("#canvas-host")?.textContent).toContain("Create and approve a grade plan before generating a size run.");
      clickId(reopenedRoot, "view-spec");
      const customSpec = reopenedRoot.querySelector("#canvas-host table");
      expect(customSpec?.querySelector("tr")?.textContent).toContain("One size");
      const wovenRecipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const oneSizeBlock = wovenRecipe.draft(
        oneSizeDesign.measurements, oneSizeDesign.garmentOptions["woven-shirt"],
      );
      const wovenPoms = wovenRecipe.poms;
      const specRows = [...customSpec!.querySelectorAll("tr")].slice(1);
      expect(specRows.map((row) => row.children[0]?.textContent)).toEqual(wovenPoms.map((pom) => pom.label));
      expect(specRows.map((row) => row.children[2]?.textContent)).toEqual(
        wovenPoms.map((pom) => (Math.round(pom.measure(oneSizeBlock) * 10) / 10).toFixed(1)),
      );
      expect(customSpec?.textContent).not.toMatch(/\b(?:XS|S|M|L|XL)\b/);
      reopenedRoot.querySelector<HTMLButtonElement>("#garment-tee")!.dispatchEvent(new Event("click", { bubbles: true }));
      expect(reopenedRoot.querySelector("#current-garment")?.textContent).toBe("Woven shirt");
      reopenedRoot.querySelector<HTMLButtonElement>("#nest-marker")!.dispatchEvent(new Event("click", { bubbles: true }));
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(true);

      const activeRoot = reopenedRoot;
      expect(isCustomOneSizeStyle(workflow.snapshot.activeStyle)).toBe(true);
      const gradePlanReload = vi.spyOn(workflow, "loadGradePlan");
      clickId(activeRoot, "journey-step-measure");
      clickId(activeRoot, "journey-guided");
      await vi.waitFor(() => expect(activeRoot.querySelector(".measurement-capture-panel__field")).not.toBeNull(),
        { timeout: 20_000 });
      const changedCapture = activeRoot.querySelector<HTMLInputElement>(
        '[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]',
      )!;
      changedCapture.value = "104";
      changedCapture.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(gradePlanReload).toHaveBeenCalledWith("woven-shirt"), { timeout: 10_000 });
    } finally {
      delete window.electronAPI;
      workflow.close();
      reopenedRoot?.remove();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 240_000);

  it("freezes the reviewed standard graded outputs through the project manager", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-standard-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-27T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      reachExportStage(root);
      const manager = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      manager.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });
      expect(workflow.snapshot.exportManifests).toHaveLength(1);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 20_000);

  it("freezes the reviewed T06 V-neck outputs including the selected-size band SVG and Tech Pack", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-standard-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-27T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-tee-vneck-digital-v1");
      const bandLength = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      const bandWidth = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!;
      bandLength.value = "84";
      bandLength.dispatchEvent(new Event("input", { bubbles: true }));
      bandWidth.value = "2.4";
      bandWidth.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      reachExportStage(root);
      const manager = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      manager.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });
      expect(workflow.snapshot.exportManifests).toHaveLength(1);
      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.schemaVersion).toBe(4);
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-svg");
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-tech-pack-pdf");
      const frozenBand = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-vneck-band-svg");
      const frozenVBandTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-vneck-band-tech-pack-pdf");
      const frozenWholeRunTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "whole-run-tech-pack-pdf");
      expect(await frozenBand.artifact.bytes.text()).toContain('data-v-forming-join="start"');
      const techPackText = await frozenVBandTechPack.artifact.bytes.text();
      expect(techPackText).toContain("Measured selected-size body neckline");
      expect(techPackText).toContain("Finished width 2.4 cm");
      const wholeRunTechPackText = await frozenWholeRunTechPack.artifact.bytes.text();
      expect(wholeRunTechPackText).toContain("V-band output is available only in the selected-size V-band Tech Pack;");
      expect(wholeRunTechPackText).toContain("graded-size V-band instructions or pattern output.");
      expect(wholeRunTechPackText).not.toContain("V-band settings:");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 60_000);

  it("freezes the selected-size V-band for an approved custom-size grade plan", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const now = "2026-09-27T12:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-vneck-grade-plan-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    const starterRoot = document.createElement("div");
    const root = document.createElement("div");
    document.body.append(starterRoot, root);
    try {
      mountApp(starterRoot, { projectWorkflow: workflow });
      clickIfPresent(starterRoot, "welcome-start");
      clickId(starterRoot, "starter-tee-vneck-digital-v1");
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
          sourceLabel: "Synthetic digital test input; no physical fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(now) + index + 1).toISOString());
      }
      await workflow.loadMeasurementCapture("tee");
      await workflow.saveMeasurementCapture(session, []);
      const capturedDesign = materializeCustomSizeDesign(seededDesign, session);
      const customDesign = {
        ...capturedDesign,
        garmentOptions: {
          ...capturedDesign.garmentOptions,
          tee: { ...capturedDesign.garmentOptions.tee, teeVNeckDropCm: 5 },
        },
      };
      await workflow.createCustomSizeStyle("Synthetic V-neck grade plan", customDesign);

      const style = workflow.snapshot.activeStyle;
      const options: GarmentOptions = customDesign.garmentOptions.tee ?? {};
      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const sourceInputs = {
        measurements: Object.fromEntries(recipe.fields.map((field) => [field, customDesign.measurements[field]])),
        options: Object.fromEntries((recipe.options ?? []).flatMap((option) => {
          const value = options[option.id];
          return value === undefined ? [] : [[option.id, value]];
        })),
      };
      const sourceBlock = recipe.draft(customDesign.measurements, options);
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
      const created = gradePlan.createGradePlanDraft(
        contextResult.value.binding, contextResult.value.targets, at(0),
      );
      expect(created.ok).toBe(true);
      if (!created.ok) throw new Error(created.errors.join(" "));
      let plan = await workflow.saveGradePlan(created.value);
      const configured = gradePlan.configureGradePlan(created.value, {
        basis: {
          kind: "user-authored-digital-rule",
          decision: "Synthetic integration fixture only.",
          digitalRange: "S and M; no physical grading claim.",
        },
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
      const approvedPlan = await workflow.saveGradePlan(approved.value);

      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });
      reachExportStage(root);
      const exportedTechPacks = new Map<string, string>();
      const saveTechPack = vi.fn(async (filename: string, content: string) => {
        exportedTechPacks.set(filename, content);
        return { saved: true, filePath: filename };
      });
      window.electronAPI = { saveFile: saveTechPack };
      const exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "S";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));

      const selectedTechPack = root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!;
      expect(selectedTechPack.disabled).toBe(false);
      selectedTechPack.click();
      await vi.waitFor(() => expect(exportedTechPacks.has("tee-S-selected-techpack.pdf")).toBe(true), { timeout: 20_000 });
      const selectedTechPackText = exportedTechPacks.get("tee-S-selected-techpack.pdf")!;
      expect(selectedTechPackText).toContain("Provisional digital V-band construction");
      expect(selectedTechPackText).toContain("Measured selected-size body neckline");

      const wholeRunExport = root.querySelector<HTMLButtonElement>("#export-techpack")!;
      expect(wholeRunExport.disabled).toBe(false);
      wholeRunExport.click();
      await vi.waitFor(() => expect(exportedTechPacks.has("tee-techpack.pdf")).toBe(true), { timeout: 20_000 });
      const wholeRunExportText = exportedTechPacks.get("tee-techpack.pdf")!;
      expect(wholeRunExportText).toContain("V-band output is available only in the selected-size V-band Tech Pack;");
      expect(wholeRunExportText).toContain("graded-size V-band instructions or pattern output.");
      expect(wholeRunExportText).not.toContain("V-band settings:");

      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 20_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 60_000 });

      await vi.waitFor(() => expect(workflow.snapshot.exportManifests).toHaveLength(1), { timeout: 60_000 });
      expect(workflow.snapshot.exportManifests).toHaveLength(1);
      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.schemaVersion).toBe(4);
      expect(manifest.payload.approvalRefs).toHaveLength(1);
      expect(manifest.payload.approvalRefs[0]).toMatch(/^grade-plan-sha256:[0-9a-f]{64}$/);
      expect(workflow.snapshot.gradePlans).toContainEqual(approvedPlan);
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-svg");
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-vneck-band-tech-pack-pdf");
      const vBandTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-vneck-band-tech-pack-pdf");
      expect(await vBandTechPack.artifact.bytes.text()).toContain("Measured selected-size body neckline");
      const wholeRunTechPack = await workflow.readFrozenArtifact(manifest.manifestId, "whole-run-tech-pack-pdf");
      const wholeRunText = await wholeRunTechPack.artifact.bytes.text();
      expect(wholeRunText).toContain("selected-size V-band Tech Pack");
      expect(wholeRunText).not.toContain("V-band settings:");
    } finally {
      delete window.electronAPI;
      workflow.close();
      starterRoot.remove();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 120_000);

  it("gates whole-run outputs on exact plan readiness and invalidates approval after edits", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const now = "2026-09-27T06:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-grade-plan-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await workflow.loadMeasurementCapture("tee");
      let session = createMeasurementCaptureSession(webcrypto.randomUUID(), "tee", now, workflow.snapshot.activeStyle.id);
      for (const [index, definition] of getCaptureFieldDefinitions("tee").entries()) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Explicit digital test input; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(now) + index + 1).toISOString());
      }
      await workflow.saveMeasurementCapture(session, []);
      const customDesign = materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session);
      const teeStarter = STARTER_REGISTRY.entries.find((entry) => entry.entryId === "tee-classic-digital-v1")!;
      const customDesignWithStarterOrigin = {
        ...customDesign,
        workspace: { ...customDesign.workspace, starterOrigin: starterOriginForEntry(teeStarter) },
      };
      await workflow.createCustomSizeStyle("Grade Plan Test", customDesignWithStarterOrigin);
      expect(workflow.snapshot.activeStyle.design.workspace.starterOrigin?.entryId).toBe(teeStarter.entryId);
      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const options = customDesign.garmentOptions.tee ?? {};
      const sourceInputs = {
        measurements: Object.fromEntries(recipe.fields.map((field) => [field, customDesign.measurements[field]])),
        options: Object.fromEntries((recipe.options ?? []).flatMap((option) => {
          const value = options[option.id];
          return value === undefined ? [] : [[option.id, value]];
        })),
      };
      const sourceBlock = recipe.draft(customDesign.measurements, options);
      const fingerprint = await editEngine.semanticEditSourceFingerprint(
        recipe.name, sourceBlock, webcrypto as unknown as Crypto, sourceInputs,
      );
      await workflow.saveActiveDesign({
        ...workflow.snapshot.activeStyle.design,
        semanticEdits: semanticEditEngine.emptySemanticEditDocument(recipe.name, fingerprint, sourceInputs),
      });
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(
        root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')?.disabled,
        root.querySelector(".grade-plan-panel")?.textContent ?? root.textContent,
      ).toBe(false), { timeout: 20_000 });

      expect(root.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(false);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")?.textContent).toContain("Starting design:");
      const action = (name: string): HTMLButtonElement => root.querySelector<HTMLButtonElement>(`[data-grade-plan-action="${name}"]`)!;
      const edit = (selector: string, value: string): void => {
        const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const failedCreate = vi.spyOn(workflow, "saveGradePlan").mockRejectedValueOnce(new Error("synthetic grade-plan write failure"));
      action("create").click();
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic grade-plan write failure"));
      failedCreate.mockRestore();
      action("create").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Draft — not reviewed"));

      const basis = (): HTMLSelectElement => root.querySelector<HTMLSelectElement>("[data-grade-plan-basis]")!;
      const fillPlanMetadata = (): void => {
        basis().value = "user-authored-digital-rule";
        basis().dispatchEvent(new Event("change", { bubbles: true }));
        edit("[data-grade-plan-decision]", "Test product decision");
        edit("[data-grade-plan-digital-range]", "S through L; digital rules only");
        edit("[data-grade-plan-range]", "S, M, L; unsupported edges unresolved");
        edit("[data-grade-plan-base-size]", "m");
        edit("[data-grade-plan-sizes]", "S\nM\nL");
      };
      const failedDraftSave = vi.spyOn(workflow, "saveGradePlan").mockRejectedValueOnce("synthetic non-Error grade-plan failure");
      action("save-draft").click();
      await vi.waitFor(() => expect(root.textContent).toContain("The grade-plan action could not be completed."));
      failedDraftSave.mockRestore();
      basis().add(new Option("Unsupported", "unsupported"));
      basis().value = "unsupported";
      basis().dispatchEvent(new Event("change", { bubbles: true }));
      action("save-draft").click();
      await vi.waitFor(() => expect(root.textContent).toContain("Choose a supported grade-plan basis."));
      fillPlanMetadata();
      edit("[data-grade-plan-base-size]", "");
      action("save-draft").click();
      await vi.waitFor(() => expect(root.textContent).toContain("Name the plan’s base size."));
      fillPlanMetadata();
      edit("[data-grade-plan-sizes]", "S\ns\nL");
      action("save-draft").click();
      await vi.waitFor(() => expect(root.textContent).toContain("Size label “s” is duplicated."));
      fillPlanMetadata();
      action("save-draft").click();
      await vi.waitFor(() => expect(root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]").length).toBeGreaterThan(0));

      const invalidDelta = root.querySelector<HTMLInputElement>('[data-grade-plan-delta]:not([readonly])')!;
      Object.defineProperty(invalidDelta, "value", { configurable: true, get: () => "1e309" });
      action("save-draft").click();
      await vi.waitFor(() => expect(root.textContent).toContain("Each size change must be a finite number."));

      const exception = root.querySelector<HTMLInputElement>("[data-grade-plan-exception]")!;
      exception.checked = true;
      exception.dispatchEvent(new Event("input", { bubbles: true }));
      edit(`[data-grade-plan-exception-reason][data-target-id="${exception.dataset.targetId}"][data-size-label="${exception.dataset.sizeLabel}"]`, "Not used in the smallest size");
      for (const input of root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]")) {
        if (input.readOnly) continue;
        if (input.dataset.targetId === exception.dataset.targetId && input.dataset.sizeLabel === exception.dataset.sizeLabel) continue;
        input.value = "0";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      action("save-draft").click();
      await vi.waitFor(() => expect({
        disabled: action("review").disabled,
        issues: root.querySelector(".grade-plan-issues")?.textContent ?? null,
        status: root.querySelector(".grade-plan-status")?.textContent,
      }).toEqual({ disabled: false, issues: null, status: "Draft — not reviewed" }));
      action("review").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Reviewed; approval still required"));
      action("approve").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));
      expect((await workflow.loadGradePlan("tee"))?.status).toBe("approved");
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")?.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")?.title)
        .toContain("approved run must pass geometry and exact POM checks");

      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      await vi.waitFor(() => expect(root.querySelector("#project-freeze-guidance")?.textContent)
        .toContain("leaves a required drafting input unresolved"));
      expect(freeze.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);

      const approvedException = root.querySelector<HTMLInputElement>("[data-grade-plan-exception]:checked")!;
      const exceptionTargetId = approvedException.dataset.targetId!;
      const exceptionSizeLabel = approvedException.dataset.sizeLabel!;
      approvedException.checked = false;
      approvedException.dispatchEvent(new Event("input", { bubbles: true }));
      edit(`[data-grade-plan-exception-reason][data-target-id="${exceptionTargetId}"][data-size-label="${exceptionSizeLabel}"]`, "");
      const mismatchedPom = [...root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]")]
        .find((input) => input.dataset.targetId?.startsWith("pom.") && input.dataset.sizeLabel === "S")!;
      for (const input of root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]")) {
        if (input.readOnly) continue;
        input.value = "0";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      action("save-draft").click();
      await vi.waitFor(() => expect({
        disabled: action("review").disabled,
        issues: root.querySelector(".grade-plan-issues")?.textContent ?? null,
        status: root.querySelector(".grade-plan-status")?.textContent,
      }).toEqual({ disabled: false, issues: null, status: "Draft — not reviewed" }));
      action("review").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Reviewed; approval still required"));
      action("approve").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));

      const storedPlan = (await workflow.loadGradePlan("tee"))!;
      const binding = {
        projectId: storedPlan.projectId, styleId: storedPlan.styleId, recipeId: storedPlan.recipeId,
        revisionHeadId: storedPlan.revisionHeadId, captureRevision: storedPlan.captureRevision,
        fingerprint: storedPlan.fingerprint,
      };
      const targetIds = storedPlan.targets.map((target) => target.targetId);
      const changedAt = new Date(Date.parse(storedPlan.updatedAt) + 1_000).toISOString();
      const mismatchedDraft = gradePlan.setGradePlanDelta(storedPlan, mismatchedPom.dataset.targetId!, "S", 1, changedAt);
      expect(mismatchedDraft.ok).toBe(true);
      let mismatchPlan = mismatchedDraft.ok ? mismatchedDraft.value : storedPlan;
      mismatchPlan = await workflow.saveGradePlan(mismatchPlan);
      const mismatchedReview = gradePlan.reviewGradePlan(mismatchPlan,
        targetIds, binding, new Date(Date.parse(changedAt) + 1_000).toISOString());
      expect(mismatchedReview.ok).toBe(true);
      mismatchPlan = mismatchedReview.ok ? mismatchedReview.value : mismatchPlan;
      mismatchPlan = await workflow.saveGradePlan(mismatchPlan);
      const mismatchedApproval = gradePlan.approveGradePlan(mismatchPlan,
        targetIds, binding, new Date(Date.parse(changedAt) + 2_000).toISOString());
      expect(mismatchedApproval.ok).toBe(true);
      mismatchPlan = mismatchedApproval.ok ? mismatchedApproval.value : mismatchPlan;
      mismatchPlan = await workflow.saveGradePlan(mismatchPlan);
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });
      reachExportStage(root);
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#export-techpack")?.disabled).toBe(true));
      expect(root.querySelector<HTMLButtonElement>("#export-projector")?.disabled).toBe(true);
      const chestDuringVerification = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      const approvedChest = chestDuringVerification.value;
      chestDuringVerification.value = String(Number(approvedChest) + 1);
      chestDuringVerification.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "view-nest");
      expect(root.querySelector("#canvas-host [role='status']")?.textContent)
        .toContain("Saved semantic edits need review before the graded run can be generated.");
      const restoredChest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      restoredChest.value = approvedChest;
      restoredChest.dispatchEvent(new Event("input", { bubbles: true }));
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });
      reachExportStage(root);
      await vi.waitFor(() => expect(
        [...root.querySelector<HTMLSelectElement>("#export-size")!.options].map((option) => option.value),
      ).toContain("S"));
      let exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "__one-size__";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      exportSize.value = "S";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.title).toContain("difference");
      clickId(root, "view-fabric");
      expect(root.querySelector("#canvas-host [role='status']")?.textContent).toContain("Modeled chest circumference");
      const mismatchResetAt = new Date(Date.parse(mismatchPlan.updatedAt) + 1_000).toISOString();
      const resetDraft = gradePlan.setGradePlanDelta(mismatchPlan,
        mismatchedPom.dataset.targetId!, "S", 0, mismatchResetAt);
      expect(resetDraft.ok).toBe(true);
      let resetPlan = resetDraft.ok ? resetDraft.value : mismatchPlan;
      resetPlan = await workflow.saveGradePlan(resetPlan);
      const resetReview = gradePlan.reviewGradePlan(resetPlan,
        targetIds, binding, new Date(Date.parse(mismatchResetAt) + 1_000).toISOString());
      expect(resetReview.ok).toBe(true);
      resetPlan = resetReview.ok ? resetReview.value : resetPlan;
      resetPlan = await workflow.saveGradePlan(resetPlan);
      const resetApproval = gradePlan.approveGradePlan(resetPlan,
        targetIds, binding, new Date(Date.parse(mismatchResetAt) + 2_000).toISOString());
      expect(resetApproval.ok).toBe(true);
      resetPlan = resetApproval.ok ? resetApproval.value : resetPlan;
      await workflow.saveGradePlan(resetPlan);
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });
      reachExportStage(root);
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#export-techpack")?.disabled).toBe(false));
      expect(root.querySelector<HTMLButtonElement>("#export-projector")?.disabled).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")?.disabled).toBe(false);

      const baseSizeSelection = root.querySelector<HTMLSelectElement>("#export-size")!;
      baseSizeSelection.value = "__one-size__";
      baseSizeSelection.dispatchEvent(new Event("change", { bubbles: true }));
      const baseSizeFreeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      await vi.waitFor(() => expect(baseSizeFreeze.disabled).toBe(false));
      baseSizeFreeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      const pomException = [...root.querySelectorAll<HTMLInputElement>("[data-grade-plan-exception]")]
        .find((input) => input.dataset.targetId?.startsWith("pom.") && input.dataset.sizeLabel === "S")!;
      pomException.checked = true;
      pomException.dispatchEvent(new Event("input", { bubbles: true }));
      edit(`[data-grade-plan-exception-reason][data-target-id="${pomException.dataset.targetId}"][data-size-label="S"]`,
        "This POM does not apply to the smallest declared size.");
      const exceptionDelta = [...root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]")]
        .find((input) => input.dataset.targetId === pomException.dataset.targetId && input.dataset.sizeLabel === "S")!;
      exceptionDelta.value = "";
      exceptionDelta.dispatchEvent(new Event("input", { bubbles: true }));
      action("save-draft").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Draft — not reviewed"), { timeout: 20_000 });
      action("review").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Reviewed; approval still required"));
      action("approve").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));
      exportSize.value = "S";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      const projectManager = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      projectManager.open = true;
      const blockedFreeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      blockedFreeze.disabled = false;
      blockedFreeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("not ready"));
      exportSize.value = "M";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      const editorSnapshot = workflow.snapshot;
      const failedFreshnessRead = vi.spyOn(workflow.repository, "readActiveProject")
        .mockRejectedValueOnce(new Error("offline freshness check"));
      const blockedDownload = vi.fn(async () => ({ saved: true }));
      window.electronAPI = { saveFile: blockedDownload };
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("changed in another tab"));
      expect(blockedDownload).not.toHaveBeenCalled();
      expect(workflow.snapshot.project.id).toBe(editorSnapshot.project.id);
      expect(workflow.snapshot.activeStyle.id).toBe(editorSnapshot.activeStyle.id);
      failedFreshnessRead.mockRestore();
      delete window.electronAPI;
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));
      exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "M";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));
      clickId(root, "view-nest");
      expect(root.querySelector("#canvas-host svg")).not.toBeNull();
      clickId(root, "view-fabric");

      const storedApprovedPlan = (await workflow.loadGradePlan("tee"))!;
      const staleRevisionRead = vi.spyOn(workflow.repository, "readActiveProject").mockResolvedValueOnce({
        ...workflow.snapshot,
        activeStyle: { ...workflow.snapshot.activeStyle, id: "externally-selected-style", revisionHeadId: "stale-revision" },
      });
      const revisionPlanLoads = vi.spyOn(workflow.repository, "readGradePlan");
      const revisionPlanLoadCount = revisionPlanLoads.mock.calls.length;
      const staleRevisionDownload = vi.fn(async () => ({ saved: true }));
      window.electronAPI = { saveFile: staleRevisionDownload };
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("changed in another tab"));
      expect(staleRevisionDownload).not.toHaveBeenCalled();
      expect(workflow.snapshot.project.id).toBe(editorSnapshot.project.id);
      expect(workflow.snapshot.activeStyle.id).toBe(editorSnapshot.activeStyle.id);
      staleRevisionRead.mockRestore();
      delete window.electronAPI;
      await vi.waitFor(() => expect(revisionPlanLoads).toHaveBeenCalledTimes(revisionPlanLoadCount + 1));
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));
      revisionPlanLoads.mockRestore();
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#export-techpack")?.disabled).toBe(false));

      const stalePlanRead = vi.spyOn(workflow.repository, "readGradePlan").mockResolvedValueOnce({
        ...storedApprovedPlan,
        updatedAt: new Date(Date.parse(storedApprovedPlan.updatedAt) + 1_000).toISOString(),
      });
      const stalePlanReadCount = stalePlanRead.mock.calls.length;
      const stalePlanDownload = vi.fn(async () => ({ saved: true }));
      window.electronAPI = { saveFile: stalePlanDownload };
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("changed in another tab"));
      expect(stalePlanDownload).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(stalePlanRead).toHaveBeenCalledTimes(stalePlanReadCount + 2), { timeout: 20_000 });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Approved grade-plan record"));
      stalePlanRead.mockRestore();
      delete window.electronAPI;
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#export-techpack")?.disabled).toBe(false));
      exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "M";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));

      const missingProjectRead = vi.spyOn(workflow.repository, "readActiveProject").mockResolvedValueOnce(null);
      const missingProjectDownload = vi.fn(async () => ({ saved: true }));
      window.electronAPI = { saveFile: missingProjectDownload };
      root.querySelector<HTMLButtonElement>("#export-projector")!.click();
      await vi.waitFor(() => expect(root.querySelector("#persist-status")?.textContent)
        .toContain("changed in another tab"));
      expect(missingProjectRead).toHaveBeenCalledOnce();
      expect(missingProjectDownload).not.toHaveBeenCalled();
      missingProjectRead.mockRestore();
      delete window.electronAPI;
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"));
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#export-projector")?.disabled).toBe(false),
        { timeout: 20_000 });
      exportSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      exportSize.value = "M";
      exportSize.dispatchEvent(new Event("change", { bubbles: true }));

      const saveFile = vi.fn(async (filename: string, content: string) => ({ saved: true, filePath: `${filename}:${content.length}` }));
      window.electronAPI = { saveFile };
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
      expect(saveFile.mock.calls[0]![0]).toBe("tee-techpack.pdf");
      expect(saveFile.mock.calls[0]![1]).toContain("Tee - S - Pattern Piece Overview");
      const selectedTechPack = root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!;
      expect(selectedTechPack.disabled).toBe(false);
      selectedTechPack.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));
      expect(saveFile.mock.calls[1]![0]).toBe("tee-M-selected-techpack.pdf");
      expect(saveFile.mock.calls[1]![1]).toContain("Tee - M - Pattern Piece Overview \\(1/1\\)");
      expect(saveFile.mock.calls[1]![1]).toContain("Digital draft only; physical fit has not been validated.");
      expect(saveFile.mock.calls[1]![1]).not.toContain("Tee - S - Pattern Piece Overview");
      const exactBaseShoulder = String(recipe.poms.find((pom) => pom.label === "Shoulder seam")!.measure(sourceBlock));
      expect(saveFile.mock.calls[1]![1]).toContain(`(${exactBaseShoulder} cm) Tj`);
      root.querySelector<HTMLButtonElement>("#export-projector")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(3));
      expect(saveFile.mock.calls[2]![0]).toBe("tee-projector.svg");
      expect(saveFile.mock.calls[2]![1]).toContain('inkscape:label="Size S"');
      expect(saveFile.mock.calls[2]![1]).toContain("not applicable");

      // Capture the approved run before changing saved nesting controls.
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freezeButton = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freezeButton.disabled).toBe(false));
      freezeButton.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      clickId(root, "view-fabric");
      const scopePersistenceState = root.querySelector<HTMLElement>("#project-persistence-state")!.dataset.state;
      const scopeUndoDisabled = root.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled;
      const scopeRedoDisabled = root.querySelector<HTMLButtonElement>("#redo-pattern")!.disabled;
      root.querySelector<HTMLButtonElement>("#nest-marker")!.click();
      expect(root.querySelector<HTMLElement>("#project-persistence-state")!.dataset.state).toBe(scopePersistenceState);
      expect(root.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled).toBe(scopeUndoDisabled);
      expect(root.querySelector<HTMLButtonElement>("#redo-pattern")!.disabled).toBe(scopeRedoDisabled);
      await vi.waitFor(() => expect(root.querySelector("#canvas-host")?.textContent).toContain("cm wide"));
      expect(root.querySelector("#canvas-host")?.textContent).toContain("This POM does not apply to the smallest declared size.");
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4));
      expect(saveFile.mock.calls[3]![0]).toBe("tee-M.svg");
      delete window.electronAPI;

      // A real nesting-input edit invalidates the saved output base; changing
      // the single/marker preview mode above does not.
      const unsavedFabricWidth = root.querySelector<HTMLInputElement>("#fabric-width")!;
      unsavedFabricWidth.value = String(Number(unsavedFabricWidth.value) + 1);
      unsavedFabricWidth.dispatchEvent(new Event("input", { bubbles: true }));
      const editedFreezeButton = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(editedFreezeButton.disabled).toBe(false));
      editedFreezeButton.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
        .toContain("Save the current style before freezing outputs."));

      const reopenedRoot = document.createElement("div");
      document.body.append(reopenedRoot);
      const pendingSemanticFingerprint = vi.spyOn(semanticEditEngine, "semanticEditSourceFingerprint")
        .mockImplementation(() => new Promise<string>(() => undefined));
      mountApp(reopenedRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(reopenedRoot.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"));
      expect(reopenedRoot.querySelector<HTMLSelectElement>("#export-size")?.value).toBe("__one-size__");
      clickId(reopenedRoot, "view-nest");
      await vi.waitFor(() => expect(reopenedRoot.querySelector("#canvas-host")?.textContent)
        .toContain("The current grade-plan base could not be verified."));
      expect(reopenedRoot.querySelector<HTMLButtonElement>("#export-techpack")?.disabled).toBe(true);
      pendingSemanticFingerprint.mockRestore();
      reopenedRoot.remove();
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"), { timeout: 20_000 });

      edit("[data-grade-plan-range]", "Edited after approval");
      action("save-draft").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Draft — not reviewed"));
      expect((await workflow.loadGradePlan("tee"))?.status).toBe("draft");
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);

      basis().value = "population-source";
      basis().dispatchEvent(new Event("change", { bubbles: true }));
      edit("[data-grade-plan-population]", "Named digital population");
      edit("[data-grade-plan-source-name]", "User-supplied specification");
      edit("[data-grade-plan-source-version]", "2026 edition");
      edit("[data-grade-plan-source-scope]", "Declared sizes only");
      action("save-draft").click();
      await vi.waitFor(() => expect(root.querySelector("[data-grade-plan-population]")?.getAttribute("value"))
        .toBe("Named digital population"));

      const activeDesign = workflow.snapshot.activeStyle.design;
      await workflow.saveActiveDesign({
        ...activeDesign,
        measurements: { ...activeDesign.measurements, chest: activeDesign.measurements.chest + 1 },
      });
      clickId(root, "view-check");
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Stale — approval cannot be used"));
      action("refresh").click();
      await vi.waitFor(() => expect(root.textContent).toContain("Base refreshed. Re-enter the basis, size rules and every size change; prior approval was cleared."));

      fillPlanMetadata();
      action("save-draft").click();
      await vi.waitFor(() => expect(root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]").length)
        .toBeGreaterThan(0));
      for (const input of root.querySelectorAll<HTMLInputElement>("[data-grade-plan-delta]")) {
        if (input.readOnly) continue;
        input.value = "0";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      action("save-draft").click();
      await vi.waitFor(() => expect({
        disabled: action("review").disabled,
        issues: root.querySelector(".grade-plan-issues")?.textContent ?? null,
        status: root.querySelector(".grade-plan-status")?.textContent,
      }).toEqual({ disabled: false, issues: null, status: "Draft — not reviewed" }));
      action("review").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Reviewed; approval still required"));
      action("approve").click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent)
        .toBe("Approved grade-plan record"));
      reachExportStage(root);
      const gradedSize = root.querySelector<HTMLSelectElement>("#export-size")!;
      expect([...gradedSize.options].map((option) => option.value)).toContain("S");

      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "unsaved-approved-surface";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      root.querySelector<HTMLInputElement>("#surface-new-width")!.value = "10";
      root.querySelector<HTMLInputElement>("#surface-new-height")!.value = "6";
      clickId(root, "surface-add");
      await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));

      expect([...gradedSize.options].map((option) => option.value)).toEqual(["__one-size__"]);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.title)
        .toBe("Save the style, then refresh, review, and approve its grade plan before exporting graded sizes or whole-run files.");

      clickId(root, "view-check");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(false);
      expect(root.querySelector<HTMLElement>("[data-grade-plan-required]")?.textContent)
        .toContain("Save the style, then refresh, review, and approve its grade plan before exporting graded sizes or whole-run files.");
      expect(root.querySelector(".grade-plan-run-review")?.textContent)
        .toContain("Save the style, then refresh, review, and approve its grade plan before exporting graded sizes or whole-run files.");
      expect(root.querySelector(".grade-plan-run-review")?.textContent)
        .not.toContain("Every declared size passes geometry and exact POM reconciliation.");
      expect(root.querySelector(".grade-plan-run-size summary")?.textContent)
        .toContain("blocked — save the current style first");

      // Loading the saved base after an unsaved artwork edit must restore the
      // approved-size choices that were temporarily removed from the selector.
      clickId(root, "load-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#workspace-confirm")!.hidden).toBe(false));
      clickId(root, "workspace-confirm-accept");
      await vi.waitFor(() => expect([...root.querySelector<HTMLSelectElement>("#export-size")!.options]
        .map((option) => option.value)).toEqual(expect.arrayContaining(["S", "M", "L"])));
      clickIfPresent(root, "tutorial-skip");
      reachExportStage(root);
      // Load restores approved-size choices, but saved semantic edits still
      // block whole-run files until their source has been reviewed.
      const semanticBlocker = "Saved semantic edits need review before the graded run can be generated.";
      for (const id of ["#export-techpack", "#export-projector"]) {
        const output = root.querySelector<HTMLButtonElement>(id)!;
        expect(output.disabled).toBe(true);
        expect(output.title).toContain(semanticBlocker);
      }

      // A design edit after approval independently closes plan-driven exports
      // and removes graded options, even without an artwork edit.
      const restoredSelect = root.querySelector<HTMLSelectElement>("#export-size")!;
      const styleTarget = root.querySelector<HTMLSelectElement>("#style-target")!;
      const alternateStyle = [...styleTarget.options].find((option) => option.value !== styleTarget.value)!;
      styleTarget.value = alternateStyle.value;
      styleTarget.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.waitFor(() => expect([...restoredSelect.options].map((option) => option.value)).toEqual(["__one-size__"]));
      expect(root.querySelector<HTMLElement>("#project-persistence-state")!.dataset.state).toBe("unsaved");
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(true);

      const genericDesign = customDesign;
      await workflow.createCustomSizeStyle("Generic grade-plan fallback", {
        ...genericDesign,
        workspace: { ...genericDesign.workspace, starterOrigin: null },
      });
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "view-check");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(root.querySelector(".grade-plan-run-review")).not.toBeNull();
    } finally {
      delete window.electronAPI;
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 360_000);

  it("rejects a forced review action when the explicit grade plan is incomplete", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const now = "2026-09-27T06:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-grade-plan-review-guard-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await workflow.loadMeasurementCapture("tee");
      let session = createMeasurementCaptureSession(webcrypto.randomUUID(), "tee", now, workflow.snapshot.activeStyle.id);
      for (const [index, definition] of getCaptureFieldDefinitions("tee").entries()) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Explicit digital test input; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(now) + index + 1).toISOString());
      }
      await workflow.saveMeasurementCapture(session, []);
      await workflow.createCustomSizeStyle("Incomplete grade plan", materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session));
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')?.disabled).toBe(false));
      const forceAction = (name: string): void => {
        const button = document.createElement("button");
        button.dataset.gradePlanAction = name;
        root.querySelector("#style-host")!.append(button);
        button.click();
      };

      forceAction("refresh");
      await vi.waitFor(() => expect(root.textContent).toContain("There is no grade plan to refresh."));
      forceAction("review");
      await vi.waitFor(() => expect(root.textContent).toContain("Create a grade plan first."));
      forceAction("approve");
      await vi.waitFor(() => expect(root.textContent).toContain("Save and review your current edits before approval."));
      const createFailure = vi.spyOn(gradePlan, "createGradePlanDraft").mockReturnValueOnce({ ok: false, errors: ["synthetic grade-plan creation failure"] });
      forceAction("create");
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic grade-plan creation failure"));
      createFailure.mockRestore();
      root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".grade-plan-status")?.textContent).toBe("Draft — not reviewed"));

      root.querySelector<HTMLSelectElement>("[data-grade-plan-basis]")!.remove();
      forceAction("save-draft");
      await vi.waitFor(() => expect(root.textContent).toContain("The grade-plan form changed before it could be saved."));

      forceAction("create");
      await vi.waitFor(() => expect(root.textContent).toContain("A grade plan already exists for this style."));
      const freshFailure = vi.spyOn(gradePlan, "createGradePlanDraft").mockReturnValueOnce({ ok: false, errors: ["synthetic refreshed-base failure"] });
      forceAction("refresh");
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic refreshed-base failure"));
      freshFailure.mockRestore();

      const currentPlan = await workflow.loadGradePlan("tee");
      const draftForRefresh = vi.spyOn(gradePlan, "createGradePlanDraft").mockReturnValueOnce({ ok: true, value: currentPlan! });
      const parseFailure = vi.spyOn(gradePlan, "parseGradePlanRecord").mockReturnValueOnce({ ok: false, errors: ["synthetic refreshed-record failure"] });
      forceAction("refresh");
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic refreshed-record failure"));
      parseFailure.mockRestore();
      draftForRefresh.mockRestore();
      forceAction("refresh");
      await vi.waitFor(() => expect(root.textContent).toContain("Base refreshed. Re-enter the basis, size rules and every size change; prior approval was cleared."));
      forceAction("approve");
      await vi.waitFor(() => expect(root.textContent).toContain("Review the complete plan before approval."));

      const review = root.querySelector<HTMLButtonElement>('[data-grade-plan-action="review"]')!;
      expect(review.disabled).toBe(true);
      review.disabled = false;
      review.click();
      await vi.waitFor(() => expect(root.textContent)
        .toContain("Choose a named population/source or an explicit user-authored digital rule."));


      const range = root.querySelector<HTMLTextAreaElement>("[data-grade-plan-range]")!;
      range.value = "A transient edit";
      range.dispatchEvent(new Event("input", { bubbles: true }));
      forceAction("approve");
      await vi.waitFor(() => expect(root.textContent).toContain("Save and review your current edits before approval."));
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 90_000);

  it("discards stale grade-plan loads and reports failed context or repository loads", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const now = "2026-09-27T06:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-grade-plan-load-guards-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    const root = document.createElement("div");
    document.body.append(root);
    let replacementRoot: HTMLDivElement | null = null;
    let resolveLoad!: (value: Awaited<ReturnType<typeof workflow.loadGradePlan>>) => void;
    let rejectLoad!: (reason: unknown) => void;
    const switchStyle = async (styleId: string): Promise<void> => {
      root.querySelector<HTMLButtonElement>(`[data-project-action="switch"][data-style-id="${styleId}"]`)!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.id).toBe(styleId), { timeout: 10_000 });
    };
    try {
      const baseStyleId = workflow.snapshot.activeStyle.id;
      await workflow.loadMeasurementCapture("tee");
      let session = createMeasurementCaptureSession(webcrypto.randomUUID(), "tee", now, baseStyleId);
      for (const [index, definition] of getCaptureFieldDefinitions("tee").entries()) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Explicit digital test input; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(now) + index + 1).toISOString());
      }
      await workflow.saveMeasurementCapture(session, []);
      await workflow.createCustomSizeStyle("Grade Plan Load Test", materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session));
      const customStyleId = workflow.snapshot.activeStyle.id;

      vi.spyOn(gradePlanContext, "createGradePlanContext").mockResolvedValueOnce({ ok: false, errors: ["synthetic invalid grade-plan context"] });
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic invalid grade-plan context"));

      await switchStyle(baseStyleId);
      const failedLoad = vi.spyOn(workflow, "loadGradePlan").mockRejectedValueOnce("synthetic non-Error plan load failure");
      await switchStyle(customStyleId);
      await vi.waitFor(() => expect(root.textContent).toContain("The grade plan could not be loaded."));
      failedLoad.mockRestore();

      await switchStyle(baseStyleId);
      const failedErrorLoad = vi.spyOn(workflow, "loadGradePlan")
        .mockRejectedValueOnce(new Error("synthetic grade-plan load failure"));
      await switchStyle(customStyleId);
      await vi.waitFor(() => expect(root.textContent).toContain("synthetic grade-plan load failure"));
      failedErrorLoad.mockRestore();

      await switchStyle(baseStyleId);
      const staleSuccess = new Promise<Awaited<ReturnType<typeof workflow.loadGradePlan>>>((resolve) => { resolveLoad = resolve; });
      const successSpy = vi.spyOn(workflow, "loadGradePlan").mockReturnValueOnce(staleSuccess);
      await switchStyle(customStyleId);
      await vi.waitFor(() => expect(successSpy).toHaveBeenCalledOnce());
      await switchStyle(baseStyleId);
      resolveLoad(null);
      await Promise.resolve();
      successSpy.mockRestore();

      const staleFailure = new Promise<Awaited<ReturnType<typeof workflow.loadGradePlan>>>((_, reject) => { rejectLoad = reject; });
      const failureSpy = vi.spyOn(workflow, "loadGradePlan").mockReturnValueOnce(staleFailure);
      await switchStyle(customStyleId);
      await vi.waitFor(() => expect(failureSpy).toHaveBeenCalledOnce());
      await switchStyle(baseStyleId);
      rejectLoad("discard this stale failure");
      await Promise.resolve();
      failureSpy.mockRestore();

      const staleMountLoad = new Promise<Awaited<ReturnType<typeof workflow.loadGradePlan>>>((_, reject) => { rejectLoad = reject; });
      const staleMountSpy = vi.spyOn(workflow, "loadGradePlan").mockReturnValueOnce(staleMountLoad);
      await switchStyle(customStyleId);
      await vi.waitFor(() => expect(staleMountSpy).toHaveBeenCalledOnce());
      replacementRoot = document.createElement("div");
      document.body.append(replacementRoot);
      mountApp(replacementRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(replacementRoot!.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')?.disabled).toBe(false));
      rejectLoad("discard the prior mount's delayed failure");
      await new Promise((resolve) => setTimeout(resolve, 0));
      staleMountSpy.mockRestore();
      expect(root.textContent).not.toContain("The grade plan could not be loaded.");
    } finally {
      workflow.close();
      replacementRoot?.remove();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 120_000);

  it("keeps grade-plan creation blocked when a custom style has no saved measurement capture", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const factory = new IDBFactory();
    const name = `app-grade-plan-missing-capture-${Date.now()}`;
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name, factory, crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-27T06:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    let database: IDBDatabase | null = null;
    try {
      const capturedAt = "2026-09-27T06:00:00.000Z";
      let session = createMeasurementCaptureSession(
        webcrypto.randomUUID(), "tee", capturedAt, workflow.snapshot.activeStyle.id,
      );
      for (const [index, definition] of getCaptureFieldDefinitions("tee").entries()) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Digital test input; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, new Date(Date.parse(capturedAt) + index + 1).toISOString());
      }
      await workflow.saveMeasurementCapture(session, []);
      await workflow.createCustomSizeStyle("Missing capture test", materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session));
      const customStyleId = workflow.snapshot.activeStyle.id;

      database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = factory.open(name);
        request.onerror = () => reject(request.error ?? new Error("Could not open the local test database."));
        request.onsuccess = () => resolve(request.result);
      });
      const transaction = database.transaction("measurementCaptures", "readwrite");
      transaction.objectStore("measurementCaptures").delete([customStyleId, "tee"]);
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error ?? new Error("Could not remove the test capture."));
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove the test capture."));
      });
      database.close();
      database = null;

      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.textContent)
        .toContain("Save a measurement capture for this style before creating a grade plan."), { timeout: 10_000 });
      expect(root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')?.disabled).toBe(true);
      const unavailableAction = document.createElement("button");
      unavailableAction.dataset.gradePlanAction = "create";
      root.querySelector("#style-host")!.append(unavailableAction);
      unavailableAction.click();
      expect(await workflow.loadMeasurementCapture("tee")).toBeNull();
    } finally {
      database?.close();
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 30_000);

  it("evaluates custom one-size semantic edits only at step zero", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const capturedAt = "2026-09-26T18:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-one-size-semantic-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => capturedAt,
    });
    const root = document.createElement("div");
    document.body.append(root);
    let recoveredRoot: HTMLDivElement | null = null;
    const evaluateSpy = vi.spyOn(semanticEditEngine, "evaluateSemanticEditDocument");
    try {
      let session = createMeasurementCaptureSession(
        webcrypto.randomUUID(), "tee", capturedAt, workflow.snapshot.activeStyle.id,
      );
      for (const definition of getCaptureFieldDefinitions("tee")) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Digital test fixture; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, capturedAt);
      }
      await workflow.saveMeasurementCapture(session, []);
      const design = materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session);
      await workflow.createCustomSizeStyle("Custom one-size Tee", design);

      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const options = design.garmentOptions.tee ?? {};
      const sourceInputs = {
        measurements: Object.fromEntries(recipe.fields.map((field) => [field, design.measurements[field]])),
        options: Object.fromEntries((recipe.options ?? []).flatMap((option) => {
          const value = options[option.id];
          return value === undefined ? [] : [[option.id, value]];
        })),
      };
      const sourceBlock = recipe.draft(design.measurements, options);
      const fingerprint = await editEngine.semanticEditSourceFingerprint(
        recipe.name, sourceBlock, webcrypto as unknown as Crypto, sourceInputs,
      );
      const semanticEdits = editEngine.emptySemanticEditDocument(recipe.name, fingerprint, sourceInputs);
      await workflow.saveActiveDesign({ ...design, semanticEdits });

      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "view-edit");
      await vi.waitFor(() => expect(evaluateSpy).toHaveBeenCalled());
      const call = evaluateSpy.mock.lastCall!;
      expect(call[6]).toEqual([{ label: "One size", step: 0 }]);
      const evaluation = evaluateSpy.mock.results[evaluateSpy.mock.results.length - 1]!.value;
      expect(evaluation.sizes).toHaveLength(1);
      expect(evaluation.sizes[0]?.label).toBe("One size");
      expect(evaluation.sizes[0]?.step).toBe(0);
      expect(evaluation.canExportSize(0)).toBe(true);
      expect(evaluation.canExportSize(-1)).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);

      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      const originalChest = chest.value;
      chest.value = String(Number(chest.value) + 1);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled).toBe(false));
      clickId(root, "undo-pattern");
      expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe(originalChest);
      expect(root.querySelector<HTMLSelectElement>("#export-size")!.value).toBe("__one-size__");
      expect([...root.querySelector<HTMLSelectElement>("#export-size")!.options].map((option) => option.textContent))
        .toEqual(["One size"]);

      await vi.waitFor(() => expect(workflow.snapshot.activeRecovery).not.toBeNull(), { timeout: 20_000 });
      const recovery = workflow.snapshot.activeRecovery!.payload;
      await workflow.saveRecovery(workflow.snapshot.activeStyle.id, {
        ...recovery,
        workspace: { ...recovery.workspace, exportStep: 2 },
      });
      root.remove();
      recoveredRoot = document.createElement("div");
      document.body.append(recoveredRoot);
      mountApp(recoveredRoot, { projectWorkflow: workflow });
      clickId(recoveredRoot, "recovery-accept");
      expect(recoveredRoot.querySelector<HTMLSelectElement>("#export-size")!.value).toBe("__one-size__");
      expect([...recoveredRoot.querySelector<HTMLSelectElement>("#export-size")!.options].map((option) => option.textContent))
        .toEqual(["One size"]);
    } finally {
      evaluateSpy.mockRestore();
      workflow.close();
      recoveredRoot?.remove();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 60_000);

  it("waits for semantic source verification before binding grade-plan POMs to saved edits", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const capturedAt = "2026-09-26T20:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-grade-plan-semantic-source-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => capturedAt,
    });
    const root = document.createElement("div");
    document.body.append(root);
    let replacementRoot: HTMLDivElement | null = null;
    let staleStyleRoot: HTMLDivElement | null = null;
    let rebaseRoot: HTMLDivElement | null = null;
    let failedRoot: HTMLDivElement | null = null;
    let releaseFingerprint!: (value: string) => void;
    const fingerprintGate = new Promise<string>((resolve) => { releaseFingerprint = resolve; });
    let releaseStaleStyleFingerprint!: (value: string) => void;
    const staleStyleFingerprint = new Promise<string>((resolve) => { releaseStaleStyleFingerprint = resolve; });
    let resolveDelayedPlan!: (value: Awaited<ReturnType<typeof workflow.loadGradePlan>>) => void;
    const delayedPlan = new Promise<Awaited<ReturnType<typeof workflow.loadGradePlan>>>((resolve) => {
      resolveDelayedPlan = resolve;
    });
    let resolveStaleStylePlan!: (value: Awaited<ReturnType<typeof workflow.loadGradePlan>>) => void;
    const staleStylePlan = new Promise<Awaited<ReturnType<typeof workflow.loadGradePlan>>>((resolve) => {
      resolveStaleStylePlan = resolve;
    });
    let resolveReplacementPlanLoad!: () => void;
    const replacementPlanLoad = new Promise<void>((resolve) => { resolveReplacementPlanLoad = resolve; });
    let resolveReplacementCaptureLoad!: () => void;
    const replacementCaptureLoad = new Promise<void>((resolve) => { resolveReplacementCaptureLoad = resolve; });
    const restoreMocks: (() => void)[] = [];
    try {
      let session = createMeasurementCaptureSession(
        webcrypto.randomUUID(), "tee", capturedAt, workflow.snapshot.activeStyle.id,
      );
      for (const definition of getCaptureFieldDefinitions("tee")) {
        session = addCaptureReadingForField(session, definition.id, {
          id: webcrypto.randomUUID(),
          rawValue: String(definition.defaultValue),
          enteredUnit: definition.unit,
          provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
          evidenceStatus: "UNCONFIRMED",
          sourceLabel: "Digital test fixture; not a fit assessment.",
          captureMethod: null,
          capturedAt: null,
          measurer: null,
        }, capturedAt);
      }
      await workflow.saveMeasurementCapture(session, []);
      const design = materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session);
      await workflow.createCustomSizeStyle("Grade plan semantic source", design);

      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const options = design.garmentOptions.tee ?? {};
      const sourceInputs = {
        measurements: Object.fromEntries(recipe.fields.map((field) => [field, design.measurements[field]])),
        options: Object.fromEntries((recipe.options ?? []).flatMap((option) => {
          const value = options[option.id];
          return value === undefined ? [] : [[option.id, value]];
        })),
      };
      const sourceBlock = recipe.draft(design.measurements, options);
      const sourceFingerprint = await semanticEditEngine.semanticEditSourceFingerprint(
        recipe.name, sourceBlock, webcrypto as unknown as Crypto, sourceInputs,
      );
      const anchor = semanticEditEngine.semanticAnchorCatalog(recipe.name, sourceBlock)[0]!;
      const semanticDocument = semanticEditEngine.appendSemanticEditOperations(
        semanticEditEngine.emptySemanticEditDocument(recipe.name, sourceFingerprint, sourceInputs),
        [semanticEditEngine.createAnchorMoveOperation(recipe.name, sourceFingerprint, sourceBlock,
          "grade-plan-source-move", anchor.id, { x: 0.125, y: 0 })],
      );
      const expectedBlock = semanticEditEngine.evaluateSemanticEditDocument(recipe, design.measurements, options,
        semanticDocument, sourceFingerprint, sourceInputs, [{ label: "One size", step: 0 }]).sizes[0]!.block;
      expect(JSON.stringify(expectedBlock)).not.toBe(JSON.stringify(sourceBlock));
      await workflow.saveActiveDesign({ ...design, semanticEdits: semanticDocument });

      const fingerprintSpy = vi.spyOn(semanticEditEngine, "semanticEditSourceFingerprint")
        .mockReturnValue(fingerprintGate);
      const contextSpy = vi.spyOn(gradePlanContext, "createGradePlanContext");
      const loadGradePlan = workflow.loadGradePlan.bind(workflow);
      const delayedPlanSpy = vi.spyOn(workflow, "loadGradePlan").mockReturnValueOnce(delayedPlan)
        .mockImplementation(async (recipeId) => {
          const plan = await loadGradePlan(recipeId);
          resolveReplacementPlanLoad();
          return plan;
        });
      const loadCapture = workflow.loadMeasurementCapture.bind(workflow);
      let captureLoads = 0;
      const captureSpy = vi.spyOn(workflow, "loadMeasurementCapture").mockImplementation(async (recipeId) => {
        const capture = await loadCapture(recipeId);
        captureLoads++;
        if (captureLoads === 2) resolveReplacementCaptureLoad();
        return capture;
      });
      restoreMocks.push(() => fingerprintSpy.mockRestore(), () => contextSpy.mockRestore(),
        () => delayedPlanSpy.mockRestore(), () => captureSpy.mockRestore());
      mountApp(root, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')).not.toBeNull());
      expect(root.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')!.disabled).toBe(true);
      expect(root.textContent).toContain("Verifying the saved pattern before creating grade-plan targets…");
      expect(contextSpy).not.toHaveBeenCalled();

      replacementRoot = document.createElement("div");
      document.body.append(replacementRoot);
      mountApp(replacementRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(replacementRoot!.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')).not.toBeNull());
      expect(replacementRoot.textContent).toContain("Verifying the saved pattern before creating grade-plan targets…");
      resolveDelayedPlan(null);
      await replacementPlanLoad;
      await replacementCaptureLoad;
      await Promise.resolve();
      expect(contextSpy).not.toHaveBeenCalled();

      const snapshotGetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(workflow), "snapshot")!.get!.bind(workflow);
      let staleStyleVisible = false;
      const snapshotSpy = vi.spyOn(workflow, "snapshot", "get").mockImplementation(() => {
        const snapshot = snapshotGetter();
        return staleStyleVisible
          ? { ...snapshot, activeStyle: { ...snapshot.activeStyle, id: `${snapshot.activeStyle.id}-stale` } }
          : snapshot;
      });
      fingerprintSpy.mockReturnValueOnce(staleStyleFingerprint);
      delayedPlanSpy.mockReturnValueOnce(staleStylePlan);
      staleStyleRoot = document.createElement("div");
      document.body.append(staleStyleRoot);
      const loadsBeforeStaleStyleMount = delayedPlanSpy.mock.calls.length;
      mountApp(staleStyleRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(delayedPlanSpy.mock.calls.length).toBeGreaterThan(loadsBeforeStaleStyleMount));
      await workflow.loadMeasurementCapture("tee");
      staleStyleVisible = true;
      const snapshotReadsBeforeStaleResolution = snapshotSpy.mock.calls.length;
      resolveStaleStylePlan(null);
      await vi.waitFor(() => expect(snapshotSpy.mock.calls.length).toBeGreaterThan(snapshotReadsBeforeStaleResolution));
      staleStyleVisible = false;
      snapshotSpy.mockRestore();
      releaseStaleStyleFingerprint(sourceFingerprint);

      releaseFingerprint(sourceFingerprint);
      await vi.waitFor(() => expect(delayedPlanSpy.mock.calls.length).toBeGreaterThan(loadsBeforeStaleStyleMount + 1),
        { timeout: 10_000 });
      await vi.waitFor(() => expect(contextSpy).toHaveBeenCalled(), { timeout: 10_000 });
      expect(contextSpy.mock.calls[0]![4]).toEqual(expectedBlock);
      expect(contextSpy.mock.calls[0]![4]).not.toEqual(sourceBlock);

      const staleInputs = {
        measurements: { ...sourceInputs.measurements, chest: sourceInputs.measurements.chest + 1 },
        options: sourceInputs.options,
      };
      const staleDocument = semanticEditEngine.emptySemanticEditDocument(recipe.name, sourceFingerprint, staleInputs);
      await workflow.saveActiveDesign({ ...workflow.snapshot.activeStyle.design, semanticEdits: staleDocument });
      rebaseRoot = document.createElement("div");
      document.body.append(rebaseRoot);
      mountApp(rebaseRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(rebaseRoot!.textContent)
        .toContain("Review or rebase the saved pattern before creating grade-plan targets."), { timeout: 60_000 });
      expect(rebaseRoot.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')!.disabled).toBe(true);
      expect(rebaseRoot.textContent).toContain("The source pattern or its reviewed inputs changed.");

      await workflow.saveActiveDesign({ ...workflow.snapshot.activeStyle.design, semanticEdits: semanticDocument });
      fingerprintSpy.mockRejectedValueOnce("synthetic source verification failure");
      failedRoot = document.createElement("div");
      document.body.append(failedRoot);
      mountApp(failedRoot, { projectWorkflow: workflow });
      await vi.waitFor(() => expect(failedRoot!.textContent)
        .toContain("SHA-256 source verification is unavailable."));
      expect(failedRoot.querySelector<HTMLButtonElement>('[data-grade-plan-action="create"]')!.disabled).toBe(true);
    } finally {
      restoreMocks.forEach((restore) => restore());
      staleStyleRoot?.remove();
      replacementRoot?.remove();
      rebaseRoot?.remove();
      failedRoot?.remove();
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 120_000);

  it("reports a non-Error failure while saving a completed custom size", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-custom-size-error-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "welcome-start");
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());
      for (const definition of getCaptureFieldDefinitions("tee")) {
        const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
          .find((button) => button.dataset.fieldId === definition.id)!;
        preset.click();
      }
      vi.spyOn(workflow, "createCustomSizeStyle").mockRejectedValueOnce("synthetic style save failure");
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed"), { timeout: 20_000 });
      expect(root.querySelector("#project-persistence-state")?.textContent)
        .toBe("The custom one-size style could not be saved.");
      expect(workflow.snapshot.styles).toHaveLength(1);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 60_000);

  it("reports failed guided capture loads, including a non-Error rejection", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-capture-load-failure-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      now: () => "2026-09-24T16:00:00.000Z",
    });
    vi.spyOn(workflow, "loadMeasurementCapture")
      .mockRejectedValueOnce(new Error("synthetic capture load failure"))
      .mockRejectedValueOnce("synthetic non-Error capture load failure");
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector("#project-persistence-state")?.textContent)
        .toBe("synthetic capture load failure"));
      expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed");
      expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("start");

      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector("#project-persistence-state")?.textContent)
        .toBe("Saved guided measurements could not be loaded."));
      expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed");
      expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("start");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
    }
  }, 15_000);

  it("shows live front and back technical flats from one draft revision and refreshes on pattern edits", () => {
    localStorage.clear();
    const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
    const originalTextLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getComputedTextLength");
    Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value() {
      const text = this as SVGTextElement;
      return { x: 0, y: -0.2, width: (text.textContent?.length ?? 0) * 0.18, height: 0.25 };
    } });
    Object.defineProperty(SVGElement.prototype, "getComputedTextLength", { configurable: true, value() {
      return ((this as SVGTextElement).textContent?.length ?? 0) * 0.18;
    } });
    const root = mount();
    try {
      clickId(root, "view-flat");
      const front = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg");
      expect(front?.getAttribute("data-view-kind")).toBe("FRONT_FLAT");
      expect(Number.parseFloat(front?.style.width ?? "0")).toBeGreaterThanOrEqual(260);
      const frontRevision = front?.getAttribute("data-revision-id");
      expect(frontRevision).toMatch(/^live-draft:tee:/);
      expect([...front!.querySelectorAll("[data-revision-id]")].every((node) => node.getAttribute("data-revision-id") === frontRevision)).toBe(true);

      clickId(root, "technical-flat-back");
      const back = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg");
      expect(back?.getAttribute("data-view-kind")).toBe("BACK_FLAT");
      expect(back?.getAttribute("data-revision-id")).toBe(frontRevision);
      expect(root.querySelector<HTMLButtonElement>("#technical-flat-back")?.getAttribute("aria-pressed")).toBe("true");

      const length = root.querySelector<HTMLInputElement>('#input-length')!;
      length.value = String(Number(length.value) + 2);
      length.dispatchEvent(new Event("input", { bubbles: true }));
      const refreshed = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg");
      expect(refreshed?.getAttribute("data-revision-id")).not.toBe(frontRevision);
      expect(refreshed?.getAttribute("data-view-kind")).toBe("BACK_FLAT");

      clickId(root, "garment-polo");
      clickId(root, "view-flat");
      const poloFlat = root.querySelector<SVGSVGElement>("[data-technical-flat-svg] svg");
      expect(poloFlat?.getAttribute("data-recipe-id")).toBe("polo");
      expect(poloFlat?.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text").length).toBeGreaterThan(0);
      expect(root.querySelector("[data-technical-flat-issues]")).toBeNull();
    } finally {
      root.remove();
      localStorage.clear();
      if (originalGetBBox) Object.defineProperty(SVGElement.prototype, "getBBox", originalGetBBox);
      else delete (SVGElement.prototype as unknown as { getBBox?: unknown }).getBBox;
      if (originalTextLength) Object.defineProperty(SVGElement.prototype, "getComputedTextLength", originalTextLength);
      else delete (SVGElement.prototype as unknown as { getComputedTextLength?: unknown }).getComputedTextLength;
    }
  });
});
