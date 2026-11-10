// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Blob as NodeBlob } from "node:buffer";

import { webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { exportablePieces, applySelectedCaptureValue, captureSessionForRecipe, captureSessionMatchesRecipe, type CaptureDraft, guidedCaptureStageBlocker, materialSnapshotFromExistingState, mountApp, unmountApp, serializeCaptureDrafts, renderForCaptureSession, semanticEditorHandles, stageBlockerFromNote } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";

import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";

import { GARMENTS } from "../drafting";

import * as semanticEditEngine from "../edit/semantic-edit";

import { DEFAULT_APPEARANCE } from "./appearance";

import { WOVEN_SHIRT_CROPPED_BOXY_ENTRY_ID } from "./starter-registry";

import { getCaptureFieldDefinitions, getFieldDefinitions } from "./field-provenance";

import { assessCaptureField, addCaptureReadingForField, createMeasurementCaptureSession, selectCaptureReading } from "./measurement-capture";

import * as measurementHelp from "./measurement-help";

import { EMPTY_TRANSFORM } from "../surface/placement";

import { surfaceAdd, surfaceKey } from "../surface/store";

import { createProductionPackOutputs, PRODUCTION_PACK_ARCHIVE_LIMIT } from "./tech-pack-output";

import { parseTechPackPomRecordSet } from "./tech-pack-sample-qa-records";

import type { TechPackRecord } from "./tech-pack-records";

import * as productionPackOutput from "./tech-pack-output";

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

async function addSyntheticNumericQaAndScopedReview(
  workflow: Awaited<ReturnType<typeof openProjectWorkflow>>,
): Promise<void> {
  const initial = workflow.snapshot;
  const recipeId = initial.activeStyle.recipeId;
  if (recipeId !== "tee" && recipeId !== "woven-shirt") throw new Error(`Unsupported test recipe ${recipeId}`);
  const targetRevision = initial.styleRevisions.find((revision) => revision.revisionId === initial.activeStyle.revisionHeadId)!;
  const pomData = parseTechPackPomRecordSet({
    schemaVersion: 1,
    definitions: {
      schemaVersion: 1,
      recipeId,
      definitions: [{
        id: "synthetic.finished-chest",
        label: "Synthetic finished chest width",
        method: { status: "UNRESOLVED", value: null, unresolvedReason: "Synthetic fixture only.", nextAction: "Replace with an identified construction source." },
        landmarks: { status: "UNRESOLVED", value: null, unresolvedReason: "Synthetic fixture only.", nextAction: "Record reviewed measurement landmarks." },
        unit: "cm",
        tolerance: { status: "UNRESOLVED", value: null, unresolvedReason: "Synthetic fixture only.", nextAction: "Review a sourced tolerance." },
        sizeRangeSource: { status: "UNRESOLVED", value: null, unresolvedReason: "Synthetic fixture only.", nextAction: "Attach a reviewed size range." },
        gradeRuleSource: { status: "UNRESOLVED", value: null, unresolvedReason: "Synthetic fixture only.", nextAction: "Attach a versioned grade rule." },
      }],
    },
    sampleQaRounds: [{
      id: "20000000-0000-4000-8000-000000000017",
      targetRevisionId: targetRevision.revisionId,
      targetRevisionNumber: targetRevision.revisionNumber,
      sampleLabel: "Synthetic sample; no physical garment",
      sampleSizeId: "M",
      recordedAt: "2026-10-13T09:00:00.000Z",
      recordedBy: "S777 synthetic fixture",
      readings: [{
        pomDefinitionId: "synthetic.finished-chest",
        status: "MEASURED",
        actualValue: 52.25,
        unit: "cm",
        method: "Synthetic numeric value for import review only.",
        evidenceRefs: ["S777 synthetic fixture"],
        unresolvedReason: null,
        nextAction: null,
      }],
      qaObservations: [],
    }],
  }, recipeId);
  if (!pomData.ok) throw new Error(pomData.error);
  const numericRecord = await workflow.saveActiveTechPack({
    ...initial.activeStyle.techPack,
    schemaVersion: 2,
    pomData: pomData.value,
  } as TechPackRecord);
  const reviewedPack = {
    ...numericRecord.activeStyle.techPack,
    approval: {
      state: "REVIEW" as const,
      revisionId: numericRecord.activeStyle.revisionHeadId,
      scopeFieldIds: [numericRecord.activeStyle.techPack.cover.styleName.fieldId],
      changedBy: "S777 synthetic reviewer",
      changedAt: "2026-10-13T09:05:00.000Z",
      manifestId: null,
    },
  };
  const internals = workflow as unknown as { loaded: typeof numericRecord };
  internals.loaded = {
    ...numericRecord,
    activeStyle: { ...numericRecord.activeStyle, techPack: reviewedPack },
    styles: numericRecord.styles.map((style) => style.id === numericRecord.activeStyle.id
      ? { ...style, techPack: reviewedPack }
      : style),
  };
  await workflow.saveActiveDesign(numericRecord.activeStyle.design);
}

async function syntheticChangedPack(
  workflow: Awaited<ReturnType<typeof openProjectWorkflow>>,
  options: { readonly invalidSampleTarget?: boolean } = {},
): Promise<Uint8Array> {
  const loaded = workflow.snapshot;
  const revision = loaded.styleRevisions.find((item) => item.revisionId === loaded.activeStyle.revisionHeadId)!;
  if (revision.payload.payloadVersion !== 2) throw new Error("The S777 fixture requires a current style revision.");
  const outputs = await createProductionPackOutputs({
    record: loaded.activeStyle.techPack,
    revision,
    currentHeadRevisionId: revision.revisionId,
    preset: "complete-pack",
    attachments: [],
    crypto: webcrypto as unknown as Crypto,
  });
  const entries = unzipSync(outputs.archiveBytes);
  const record = JSON.parse(strFromU8(entries["records/tech-pack.json"]!)) as {
    pomData?: { sampleQaRounds: { targetRevisionId: string; readings: { actualValue: number }[] }[] };
  };
  const reading = record.pomData?.sampleQaRounds[0]?.readings[0];
  if (!reading) throw new Error("The synthetic numeric QA reading is missing from the exported record.");
  reading.actualValue = 52.375;
  if (options.invalidSampleTarget) {
    const round = record.pomData!.sampleQaRounds[0]!;
    round.targetRevisionId = "99999999-9999-4999-8999-999999999999";
  }
  entries["records/tech-pack.json"] = strToU8(JSON.stringify(record));
  return zipSync(entries);
}

function selectTechPackImport(
  root: HTMLElement,
  fileName: string,
  bytes: Uint8Array,
  reportedSize = bytes.byteLength,
  readFile?: () => Promise<ArrayBuffer>,
): void {
  const input = root.querySelector<HTMLInputElement>("[data-production-pack-import-file]")!;
  const file = {
    name: fileName,
    size: reportedSize,
    arrayBuffer: readFile ?? (async () => bytes.slice().buffer as ArrayBuffer),
  } as File;
  Object.defineProperty(input, "files", { configurable: true, value: [file] as unknown as FileList });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function deferredS777<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

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

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
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

  it("fails unresolved material and missing ease guidance to null without inference", () => {
    const snapshot = materialSnapshotFromExistingState({
      revisionLabel: "Design revision test",
      stretchFabric: { name: "Unresolved", family: "woven", stretchPercent: 0 },
      notes: [],
      color: "#123456",
      appearance: DEFAULT_APPEARANCE,
    });
    expect(snapshot).toMatchObject({
      revisionLabel: "Design revision test",
      fabric: null,
      easeGuidance: null,
      compatibility: {
        state: "unknown",
        detail: "The app has no separate fabric/material compatibility assessment.",
      },
      color: "#123456",
      appearance: DEFAULT_APPEARANCE,
    });
  });

  it("persists Single/Marker as a preview preference without dirtying or adding undo history", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-nesting-scope-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-09-28T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      const state = root.querySelector<HTMLElement>("#project-persistence-state")!;
      expect(state.dataset.state).toBe("saved");
      expect(root.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#redo-pattern")!.disabled).toBe(true);
      clickId(root, "view-fabric");
      root.querySelector<HTMLButtonElement>("#nest-marker")!.click();
      expect(root.querySelector<HTMLButtonElement>("#nest-marker")!.getAttribute("aria-pressed")).toBe("true");
      expect(state.dataset.state).toBe("saved");
      expect(root.querySelector<HTMLButtonElement>("#undo-pattern")!.disabled).toBe(true);
      expect(root.querySelector<HTMLButtonElement>("#redo-pattern")!.disabled).toBe(true);

      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.design.workspace.nestScope).toBe("marker"));
      expect(state.dataset.state).toBe("saved");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);

  it("shows the revision-bound production pack as unavailable without a saved local style", () => {
    let productionPackClick: EventListener | null = null;
    const originalAddEventListener = HTMLElement.prototype.addEventListener;
    const addEventListener = vi.spyOn(HTMLElement.prototype, "addEventListener").mockImplementation(function (
      this: HTMLElement,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (this.id === "production-pack-host" && type === "click" && typeof listener === "function") {
        productionPackClick = listener;
      }
      originalAddEventListener.call(this, type, listener, options);
    });
    const root = mount();
    addEventListener.mockRestore();
    const panel = root.querySelector("#production-pack-host")!;
    expect(panel.textContent).toContain("Open a saved local style");
    expect(root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.disabled).toBe(true);
    expect(root.querySelector<HTMLSelectElement>("#production-pack-preset")!.disabled).toBe(true);
    root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const unavailableDownload = document.createElement("button");
    unavailableDownload.dataset.productionPackDownload = "pdf";
    panel.append(unavailableDownload);
    unavailableDownload.click();
    const unavailableTableControl = document.createElement("button");
    unavailableTableControl.dataset.packTableScroll = "end";
    panel.append(unavailableTableControl);
    unavailableTableControl.click();
    const unrelatedClick = document.createElement("button");
    panel.append(unrelatedClick);
    unrelatedClick.click();
    productionPackClick!({ target: document.createTextNode("not an element") } as unknown as Event);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });

  it("generates the production pack from the current saved revision, applies presets, and rejects a later revision", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      const generate = (): HTMLButtonElement => root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!;
      generate().click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      const originalHead = workflow.snapshot.activeStyle.revisionHeadId!;
      expect(root.querySelector(".tech-pack-ready")!.getAttribute("data-revision-id")).toBe(originalHead);
      expect(root.querySelector('[data-pack-section="materials-bom"]')).not.toBeNull();

      const preset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      preset.value = "measurements-qa";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent).toContain("Section selection changed");
      generate().click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      expect(root.querySelector('[data-pack-section="measurements-qa"]')).not.toBeNull();
      expect(root.querySelector('[data-pack-section="materials-bom"]')).toBeNull();

      const tableWrap = root.querySelector<HTMLDivElement>(".tech-pack-open-table-wrap")!;
      Object.defineProperty(tableWrap, "scrollWidth", { configurable: true, value: 560 });
      Object.defineProperty(tableWrap, "clientWidth", { configurable: true, value: 300 });
      tableWrap.scrollLeft = 42;
      root.querySelector<HTMLButtonElement>('[data-pack-table-scroll="start"]')!.click();
      expect(tableWrap.scrollLeft).toBe(0);
      root.querySelector<HTMLButtonElement>('[data-pack-table-scroll="end"]')!.click();
      expect(tableWrap.scrollLeft).toBe(260);
      Object.defineProperty(tableWrap, "scrollWidth", { configurable: true, value: 100 });
      Object.defineProperty(tableWrap, "clientWidth", { configurable: true, value: 300 });
      root.querySelector<HTMLButtonElement>('[data-pack-table-scroll="end"]')!.click();
      expect(tableWrap.scrollLeft).toBe(0);

      const current = workflow.snapshot.activeStyle.techPack;
      const currentName = current.cover.styleName;
      await workflow.saveActiveTechPack({
        ...current,
        cover: {
          ...current.cover,
          styleName: {
            ...currentName,
            value: "Synthetic UIQ-10 review fixture",
            provenance: "USER_CAPTURED",
            evidenceStatus: "UNCONFIRMED",
            validationStatus: "VALID",
            method: "synthetic UIQ-10 test value",
            capturedBy: "S776 integration test",
            capturedAt: "2026-10-01T12:00:00.000Z",
            unresolvedReason: null,
            nextAction: null,
          },
        },
      });
      expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(originalHead);
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent)
        .toContain("changed while this tab was inactive"));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      expect(generate().disabled).toBe(true);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("previews an editable numeric package without saving, then explicitly applies it as a DRAFT revision", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:10:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      expect(workflow.snapshot.activeStyle.recipeId).toBe("tee");
      await addSyntheticNumericQaAndScopedReview(workflow);
      const baseHeadId = workflow.snapshot.activeStyle.revisionHeadId!;
      const baseRevisionNumber = workflow.snapshot.activeStyle.techPack.revisionNumber;
      expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("REVIEW");
      expect(workflow.snapshot.activeStyle.techPack.approval.scopeFieldIds).toEqual([
        workflow.snapshot.activeStyle.techPack.cover.styleName.fieldId,
      ]);

      mountApp(root, { projectWorkflow: workflow });
      selectTechPackImport(root, "synthetic-tee.techpack.zip", await syntheticChangedPack(workflow));
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("52.375"));
      expect(reviewHost.textContent).toContain("52.25");
      expect(reviewHost.textContent).toContain("actualValue");
      expect(reviewHost.textContent).toContain("REVIEW");
      expect(reviewHost.textContent).toContain("cover.styleName");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(baseHeadId);
      expect(workflow.snapshot.activeStyle.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(52.25);
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull();

      const diffRegion = reviewHost.querySelector<HTMLDivElement>(".tech-pack-import-table-wrap")!;
      const keyboardEvent = (key: string): KeyboardEvent => new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      Object.defineProperty(diffRegion, "clientWidth", { configurable: true, value: 0 });
      Object.defineProperty(diffRegion, "scrollWidth", { configurable: true, value: 0 });
      const noOverflowArrow = keyboardEvent("ArrowRight");
      diffRegion.dispatchEvent(noOverflowArrow);
      expect(diffRegion.scrollLeft).toBe(0);
      expect(noOverflowArrow.defaultPrevented).toBe(false);
      Object.defineProperty(diffRegion, "clientWidth", { configurable: true, value: 300 });
      Object.defineProperty(diffRegion, "scrollWidth", { configurable: true, value: 520 });
      diffRegion.dispatchEvent(keyboardEvent("ArrowRight"));
      expect(diffRegion.scrollLeft).toBe(220);
      diffRegion.dispatchEvent(keyboardEvent("ArrowLeft"));
      expect(diffRegion.scrollLeft).toBe(0);
      const leftAtStart = keyboardEvent("ArrowLeft");
      diffRegion.dispatchEvent(leftAtStart);
      expect(leftAtStart.defaultPrevented).toBe(false);
      diffRegion.dispatchEvent(keyboardEvent("ArrowDown"));
      reviewHost.dispatchEvent(keyboardEvent("ArrowRight"));
      const textEventTarget = document.createTextNode("keyboard target guard");
      Object.defineProperty(textEventTarget, "closest", { configurable: true, value: () => null });
      reviewHost.append(textEventTarget);
      textEventTarget.dispatchEvent(keyboardEvent("ArrowRight"));
      textEventTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      textEventTarget.remove();

      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("Saved"));
      expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(baseHeadId);
      expect(workflow.snapshot.activeStyle.techPack.revisionNumber).toBe(baseRevisionNumber + 1);
      expect(workflow.snapshot.activeStyle.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(52.375);
      expect(workflow.snapshot.activeStyle.techPack.approval).toMatchObject({ state: "DRAFT", scopeFieldIds: [], revisionId: null });
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("invalidates a reviewed package when the saved head moves before explicit apply", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-race-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:20:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      const baseHeadId = workflow.snapshot.activeStyle.revisionHeadId!;
      mountApp(root, { projectWorkflow: workflow });
      selectTechPackImport(root, "synthetic-race.techpack.zip", await syntheticChangedPack(workflow));
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      await vi.waitFor(() => expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull());

      const current = workflow.snapshot.activeStyle.techPack;
      const round = current.pomData!.sampleQaRounds[0]!;
      await workflow.saveActiveTechPack({
        ...current,
        pomData: {
          ...current.pomData!,
          sampleQaRounds: [{
            ...round,
            readings: [{ ...round.readings[0]!, actualValue: 53.25 }],
          }],
        },
      });
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')?.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toMatch(/changed after preview|Select the package again/));
      expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(baseHeadId);
      expect(workflow.snapshot.activeStyle.techPack.revisionNumber).toBe(3);
      expect(workflow.snapshot.activeStyle.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(53.25);
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).toBeNull();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("invalidates a reviewed package when a project-manager update observes a changed saved head", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-observer-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:22:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      mountApp(root, { projectWorkflow: workflow });
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      const beforeImport = workflow.snapshot.activeStyle.techPack;
      const beforeImportRound = beforeImport.pomData!.sampleQaRounds[0]!;
      await workflow.saveActiveTechPack({
        ...beforeImport,
        pomData: {
          ...beforeImport.pomData!,
          sampleQaRounds: [{ ...beforeImportRound, readings: [{ ...beforeImportRound.readings[0]!, actualValue: 54.125 }] }],
        },
      });
      root.querySelector("#project-manager-host")!.append(document.createTextNode("saved project update before import"));
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("saved style revision or its review scope changed"));
      selectTechPackImport(root, "synthetic-observer.techpack.zip", await syntheticChangedPack(workflow));
      await vi.waitFor(() => expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull());

      const current = workflow.snapshot.activeStyle.techPack;
      const round = current.pomData!.sampleQaRounds[0]!;
      await workflow.saveActiveTechPack({
        ...current,
        pomData: {
          ...current.pomData!,
          sampleQaRounds: [{ ...round, readings: [{ ...round.readings[0]!, actualValue: 54.25 }] }],
        },
      });
      root.querySelector("#project-manager-host")!.append(document.createTextNode("saved project update"));
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("saved style revision or scoped approval changed after preview"));
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).toBeNull();
      expect(workflow.snapshot.activeStyle.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(54.25);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("ignores superseded import work while reading the head, file, preview, and final head", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-cancel-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:24:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      mountApp(root, { projectWorkflow: workflow });
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      const packageBytes = await syntheticChangedPack(workflow);
      const brokenBytes = new Uint8Array([80, 75, 3, 4]);
      const expectReplacementError = async (): Promise<void> => {
        await vi.waitFor(() => expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP"));
      };
      const flushPendingWork = async (): Promise<void> => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      };
      const originalLoad = workflow.repository.loadProject.bind(workflow.repository);

      const headGate = deferredS777<Awaited<ReturnType<typeof workflow.repository.loadProject>>>();
      const headStarted = deferredS777<void>();
      const delayedHead = vi.spyOn(workflow.repository, "loadProject").mockImplementationOnce(async () => {
        headStarted.resolve(undefined);
        return await headGate.promise;
      });
      selectTechPackImport(root, "waiting-for-head.techpack.zip", packageBytes);
      await headStarted.promise;
      selectTechPackImport(root, "replacement-head-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      headGate.resolve(workflow.snapshot);
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      delayedHead.mockRestore();

      const fileGate = deferredS777<ArrayBuffer>();
      const fileStarted = deferredS777<void>();
      selectTechPackImport(root, "waiting-for-file.techpack.zip", packageBytes, packageBytes.byteLength, async () => {
        fileStarted.resolve(undefined);
        return await fileGate.promise;
      });
      await fileStarted.promise;
      selectTechPackImport(root, "replacement-file-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      fileGate.resolve(packageBytes.slice().buffer as ArrayBuffer);
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");

      const previewGate = deferredS777<Awaited<ReturnType<typeof productionPackOutput.previewProductionPackImport>>>();
      const previewStarted = deferredS777<Awaited<ReturnType<typeof productionPackOutput.previewProductionPackImport>>>();
      const originalPreview = productionPackOutput.previewProductionPackImport.bind(productionPackOutput);
      const delayedPreview = vi.spyOn(productionPackOutput, "previewProductionPackImport").mockImplementationOnce(async (options) => {
        const preview = await originalPreview(options);
        previewStarted.resolve(preview);
        return await previewGate.promise;
      });
      selectTechPackImport(root, "waiting-for-preview.techpack.zip", packageBytes);
      const pendingPreview = await previewStarted.promise;
      selectTechPackImport(root, "replacement-preview-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      previewGate.resolve(pendingPreview);
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      delayedPreview.mockRestore();

      const finalHeadGate = deferredS777<Awaited<ReturnType<typeof workflow.repository.loadProject>>>();
      const finalHeadStarted = deferredS777<void>();
      let loadCount = 0;
      const delayedFinalHead = vi.spyOn(workflow.repository, "loadProject").mockImplementation(async (projectId) => {
        loadCount += 1;
        if (loadCount === 2) {
          finalHeadStarted.resolve(undefined);
          return await finalHeadGate.promise;
        }
        return await originalLoad(projectId);
      });
      selectTechPackImport(root, "waiting-for-final-head.techpack.zip", packageBytes);
      await finalHeadStarted.promise;
      selectTechPackImport(root, "replacement-final-head-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      finalHeadGate.resolve(workflow.snapshot);
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      delayedFinalHead.mockRestore();

      const failedHeadGate = deferredS777<Awaited<ReturnType<typeof workflow.repository.loadProject>>>();
      const failedHeadStarted = deferredS777<void>();
      const delayedFailedHead = vi.spyOn(workflow.repository, "loadProject").mockImplementationOnce(async () => {
        failedHeadStarted.resolve(undefined);
        return await failedHeadGate.promise;
      });
      selectTechPackImport(root, "waiting-before-reader-error.techpack.zip", packageBytes);
      await failedHeadStarted.promise;
      selectTechPackImport(root, "replacement-reader-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      failedHeadGate.reject(new Error("superseded reader failure"));
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      delayedFailedHead.mockRestore();

      const originalHead = workflow.snapshot.activeStyle.revisionHeadId;
      selectTechPackImport(root, "apply-waiting-for-head.techpack.zip", packageBytes);
      await vi.waitFor(() => expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull());
      const applyHeadGate = deferredS777<Awaited<ReturnType<typeof workflow.repository.loadProject>>>();
      const applyHeadStarted = deferredS777<void>();
      const delayedApplyHead = vi.spyOn(workflow.repository, "loadProject").mockImplementationOnce(async () => {
        applyHeadStarted.resolve(undefined);
        return await applyHeadGate.promise;
      });
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await applyHeadStarted.promise;
      selectTechPackImport(root, "replacement-apply-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      applyHeadGate.resolve(workflow.snapshot);
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(originalHead);
      delayedApplyHead.mockRestore();

      const saveGate = deferredS777<typeof workflow.snapshot>();
      const saveStarted = deferredS777<void>();
      const delayedSave = vi.spyOn(workflow, "saveActiveTechPack").mockImplementationOnce(async () => {
        saveStarted.resolve(undefined);
        return await saveGate.promise;
      });
      selectTechPackImport(root, "apply-waiting-for-save.techpack.zip", packageBytes);
      await vi.waitFor(() => expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull());
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await saveStarted.promise;
      selectTechPackImport(root, "replacement-save-error.techpack.zip", brokenBytes);
      await expectReplacementError();
      saveGate.reject(new Error("superseded save failure"));
      await flushPendingWork();
      expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("ZIP");
      expect(reviewHost.textContent).not.toContain("Apply could not be confirmed");
      delayedSave.mockRestore();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);

  it("invalidates changed saved review scope and reports current and unknown history-read failures", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-scope-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:26:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      mountApp(root, { projectWorkflow: workflow });
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      const bytes = await syntheticChangedPack(workflow);
      const original = workflow.snapshot;
      const changedApprovalSnapshot = {
        ...original,
        activeStyle: {
          ...original.activeStyle,
          techPack: {
            ...original.activeStyle.techPack,
            approval: {
              ...original.activeStyle.techPack.approval,
              scopeFieldIds: [...original.activeStyle.techPack.approval.scopeFieldIds, "cover.styleCode"],
            },
          },
        },
      } as typeof workflow.snapshot;

      const beforeReview = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(changedApprovalSnapshot);
      const firstRead = vi.fn(async () => bytes.slice().buffer as ArrayBuffer);
      selectTechPackImport(root, "changed-scope-before-review.techpack.zip", bytes, bytes.byteLength, firstRead);
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("changed before package review"));
      expect(firstRead).not.toHaveBeenCalled();
      beforeReview.mockRestore();

      const originalLoad = workflow.repository.loadProject.bind(workflow.repository);
      let loadCount = 0;
      const whileChecking = vi.spyOn(workflow.repository, "loadProject").mockImplementation(async (projectId) => {
        loadCount += 1;
        return loadCount === 1 ? await originalLoad(projectId) : changedApprovalSnapshot;
      });
      selectTechPackImport(root, "changed-scope-during-review.techpack.zip", bytes);
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("changed while this package was being checked"));
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).toBeNull();
      whileChecking.mockRestore();

      const readError = vi.spyOn(workflow.repository, "loadProject").mockRejectedValueOnce(new Error("Local revision history is unavailable."));
      selectTechPackImport(root, "history-error.techpack.zip", bytes);
      await vi.waitFor(() => expect(reviewHost.querySelector('[role="alert"]')?.textContent).toContain("Local revision history is unavailable."));
      readError.mockRestore();

      const unknownError = vi.spyOn(workflow.repository, "loadProject").mockRejectedValueOnce("untyped history error");
      selectTechPackImport(root, "unknown-history-error.techpack.zip", bytes);
      await vi.waitFor(() => expect(reviewHost.querySelector('[role="alert"]')?.textContent)
        .toContain("could not be checked against local revision history"));
      unknownError.mockRestore();

      let finalReadCount = 0;
      const missingFinalHead = {
        ...workflow.snapshot,
        activeStyle: { ...workflow.snapshot.activeStyle, revisionHeadId: null },
      } as typeof workflow.snapshot;
      const failedFinalRead = vi.spyOn(workflow.repository, "loadProject").mockImplementation(async (projectId) => {
        finalReadCount += 1;
        if (finalReadCount === 2) return missingFinalHead;
        return await originalLoad(projectId);
      });
      selectTechPackImport(root, "final-history-error.techpack.zip", bytes);
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("This style has no saved revision head."));
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).toBeNull();
      failedFinalRead.mockRestore();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);

  it("rechecks the head before apply, contains failed saves, and ignores a disposed completion", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-apply-guards-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:28:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      mountApp(root, { projectWorkflow: workflow });
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      const pack = async (name: string): Promise<void> => {
        selectTechPackImport(root, name, await syntheticChangedPack(workflow));
        await vi.waitFor(() => expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).not.toBeNull());
      };
      const baseHead = workflow.snapshot.activeStyle.revisionHeadId;
      const missingFreshHead = {
        ...workflow.snapshot,
        activeStyle: { ...workflow.snapshot.activeStyle, revisionHeadId: null },
      } as typeof workflow.snapshot;

      await pack("fresh-head-check.techpack.zip");
      const freshHead = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(missingFreshHead);
      const saveNotAttempted = vi.spyOn(workflow, "saveActiveTechPack");
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("No apply was attempted"));
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(baseHead);
      expect(saveNotAttempted).not.toHaveBeenCalled();
      freshHead.mockRestore();
      saveNotAttempted.mockRestore();

      await pack("invalid-saved-context.techpack.zip");
      const invalidSave = vi.spyOn(workflow, "saveActiveTechPack").mockResolvedValueOnce(missingFreshHead);
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("Saved"));
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("no saved revision head");
      invalidSave.mockRestore();

      await pack("save-error.techpack.zip");
      const failedSave = vi.spyOn(workflow, "saveActiveTechPack").mockRejectedValueOnce(new Error("local write failed"));
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("Apply could not be confirmed"));
      expect(reviewHost.textContent).toContain("local write failed");
      failedSave.mockRestore();

      await pack("unknown-save-error.techpack.zip");
      const unknownSave = vi.spyOn(workflow, "saveActiveTechPack").mockRejectedValueOnce("untyped local write error");
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("The save path returned an unknown error."));
      unknownSave.mockRestore();

      await pack("disposed-save.techpack.zip");
      const savedGate = deferredS777<typeof workflow.snapshot>();
      const savedStarted = deferredS777<void>();
      const delayedSave = vi.spyOn(workflow, "saveActiveTechPack").mockImplementationOnce(async () => {
        savedStarted.resolve(undefined);
        return await savedGate.promise;
      });
      reviewHost.querySelector<HTMLButtonElement>('[data-production-pack-import-action="apply"]')!.click();
      await savedStarted.promise;
      mount();
      savedGate.resolve(workflow.snapshot);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      expect(reviewHost.textContent).toContain("Saving the reviewed changes");
      expect(reviewHost.textContent).not.toContain("Saved");
      delayedSave.mockRestore();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);

  it("rejects oversized packages before reading and asks for a saved local style", async () => {
    const root = mount();
    const readFile = vi.fn(async () => new ArrayBuffer(1));
    const importHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
    importHost.dispatchEvent(new Event("change"));
    const input = importHost.querySelector<HTMLInputElement>("[data-production-pack-import-file]")!;
    Object.defineProperty(input, "files", { configurable: true, value: [] as unknown as FileList });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(importHost.textContent).toContain("No package selected.");
    const unexpectedApply = document.createElement("button");
    unexpectedApply.dataset.productionPackImportAction = "apply";
    importHost.append(unexpectedApply);
    unexpectedApply.click();
    unexpectedApply.remove();
    selectTechPackImport(root, "oversized.techpack.zip", new Uint8Array([1]), PRODUCTION_PACK_ARCHIVE_LIMIT + 1, readFile);
    await vi.waitFor(() => expect(root.querySelector("#production-pack-import-review-host")?.textContent)
      .toContain("256 MiB compressed archive limit"));
    expect(readFile).not.toHaveBeenCalled();

    selectTechPackImport(root, "without-style.techpack.zip", new Uint8Array([1]), 1, readFile);
    await vi.waitFor(() => expect(root.querySelector("#production-pack-import-review-host")?.textContent)
      .toContain("Open a saved local style"));
    expect(readFile).not.toHaveBeenCalled();
  });

  it("keeps a candidate with a sample round outside immutable history read-only", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-semantic-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:25:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      await addSyntheticNumericQaAndScopedReview(workflow);
      const baseHeadId = workflow.snapshot.activeStyle.revisionHeadId;
      mountApp(root, { projectWorkflow: workflow });
      selectTechPackImport(root, "invalid-sample-target.techpack.zip",
        await syntheticChangedPack(workflow, { invalidSampleTarget: true }));
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("existing revision in this style's immutable history"));
      expect(reviewHost.textContent).toContain("INVALID");
      expect(reviewHost.textContent).toContain("52.375");
      expect(reviewHost.querySelector('[data-production-pack-import-action="apply"]')).toBeNull();

      const unexpectedApply = document.createElement("button");
      unexpectedApply.dataset.productionPackImportAction = "apply";
      reviewHost.append(unexpectedApply);
      unexpectedApply.click();
      await Promise.resolve();
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(baseHeadId);
      expect(workflow.snapshot.activeStyle.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(52.25);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("shows a malformed-package correction and invalidates preview when the fresh head cannot be verified", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-tech-pack-import-invalid-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T09:30:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      const baseHeadId = workflow.snapshot.activeStyle.revisionHeadId;
      selectTechPackImport(root, "broken.techpack.zip", new Uint8Array([80, 75, 3, 4]));
      const reviewHost = root.querySelector<HTMLDivElement>("#production-pack-import-review-host")!;
      await vi.waitFor(() => expect(reviewHost.querySelector('[role="alert"]')?.textContent)
        .toContain("ZIP"));
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(baseHeadId);

      const unresolvedHead = {
        ...workflow.snapshot,
        activeStyle: { ...workflow.snapshot.activeStyle, revisionHeadId: null },
      } as typeof workflow.snapshot;
      const freshLoad = vi.spyOn(workflow.repository, "loadProject").mockResolvedValue(unresolvedHead);
      const readFile = vi.fn(async () => new ArrayBuffer(1));
      selectTechPackImport(root, "unverified-head.techpack.zip", new Uint8Array([1]), 1, readFile);
      await vi.waitFor(() => expect(reviewHost.querySelector('[role="alert"]')?.textContent)
        .toContain("saved revision head"));
      expect(readFile).not.toHaveBeenCalled();
      freshLoad.mockRestore();

      const internals = workflow as unknown as { loaded: typeof workflow.snapshot };
      internals.loaded = {
        ...workflow.snapshot,
        activeStyle: { ...workflow.snapshot.activeStyle, revisionHeadId: null },
      };
      selectTechPackImport(root, "missing-head.techpack.zip", new Uint8Array([1]), 1, readFile);
      await vi.waitFor(() => expect(reviewHost.textContent).toContain("no saved revision head"));
      expect(readFile).not.toHaveBeenCalled();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("keeps malformed or mismatched saved revision identities unavailable", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-invalid-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const base = workflow.snapshot;
    const mutableWorkflow = workflow as unknown as { loaded: typeof base };
    const cases: Array<{ name: string; loaded: typeof base; message: string }> = [
      {
        name: "missing head",
        loaded: { ...base, activeStyle: { ...base.activeStyle, revisionHeadId: null } },
        message: "no saved revision head",
      },
      {
        name: "missing revision",
        loaded: { ...base, styleRevisions: [] },
        message: "no verified current tech-pack snapshot",
      },
      {
        name: "unsupported snapshot version",
        loaded: {
          ...base,
          styleRevisions: base.styleRevisions.map((revision) => ({
            ...revision,
            payload: { ...revision.payload, payloadVersion: 1 },
          })) as unknown as typeof base.styleRevisions,
        },
        message: "no verified current tech-pack snapshot",
      },
      {
        name: "revision style identity",
        loaded: {
          ...base,
          styleRevisions: base.styleRevisions.map((revision, index) => index === 0
            ? { ...revision, styleId: "00000000-0000-4000-8000-000000000001" }
            : revision),
        },
        message: "identities do not match",
      },
      {
        name: "record revision identity",
        loaded: {
          ...base,
          activeStyle: {
            ...base.activeStyle,
            techPack: { ...base.activeStyle.techPack, revisionId: "00000000-0000-4000-8000-000000000002" },
          },
        },
        message: "identities do not match",
      },
    ];
    try {
      for (const [index, scenario] of cases.entries()) {
        mutableWorkflow.loaded = scenario.loaded;
        const root = document.createElement("div");
        document.body.append(root);
        mountApp(root, { projectWorkflow: workflow });
        expect(root.querySelector("#production-pack-host")?.textContent, scenario.name).toContain(scenario.message);
        expect(root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')?.disabled, scenario.name).toBe(true);
        root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
        const unavailableDownload = document.createElement("button");
        unavailableDownload.dataset.productionPackDownload = "pdf";
        root.querySelector("#production-pack-host")!.append(unavailableDownload);
        unavailableDownload.click();
        root.remove();
        mutableWorkflow.loaded = base;
        if (index < cases.length - 1) await Promise.resolve();
      }
    } finally {
      mutableWorkflow.loaded = base;
      workflow.close();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("updates section selection only for valid controls and retains focus through rerender", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-sections-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      const panel = root.querySelector<HTMLElement>("#production-pack-host")!;
      const preset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      preset.value = "not-a-preset";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLSelectElement>("#production-pack-preset")?.value).toBe("");

      preset.focus();
      preset.value = "materials-construction";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      expect(document.activeElement).toBe(root.querySelector("#production-pack-preset"));
      expect(root.querySelector('[data-pack-section-toggle="construction"]')).not.toBeNull();
      expect(root.querySelector<HTMLInputElement>('[data-pack-section-toggle="measurements-qa"]')?.checked).toBe(false);

      preset.value = "measurements-qa";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      const addArtwork = root.querySelector<HTMLInputElement>('[data-pack-section-toggle="artwork"]')!;
      addArtwork.checked = true;
      addArtwork.focus();
      addArtwork.dispatchEvent(new Event("change", { bubbles: true }));
      expect(document.activeElement).toBe(root.querySelector('[data-pack-section-toggle="artwork"]'));
      expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent).toContain("Section selection changed");

      const removeArtwork = root.querySelector<HTMLInputElement>('[data-pack-section-toggle="artwork"]')!;
      removeArtwork.checked = false;
      removeArtwork.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>('[data-pack-section-toggle="artwork"]')?.checked).toBe(false);

      const unrelatedInput = document.createElement("input");
      panel.append(unrelatedInput);
      unrelatedInput.dispatchEvent(new Event("change", { bubbles: true }));
      panel.dispatchEvent(new Event("change", { bubbles: true }));
      const textTarget = document.createTextNode("not an action element");
      panel.append(textTarget);
      panel.addEventListener("click", (event) => event.stopPropagation(), { once: true });
      textTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const unrelatedAction = document.createElement("button");
      unrelatedAction.dataset.productionPackAction = "unknown";
      panel.append(unrelatedAction);
      unrelatedAction.click();
      panel.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 20_000);

  it("includes referenced local artwork and reports missing or unreadable local files", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const assets = memoryArtworkStore();
    const assetId = "local-0123456789abcdef0123456789abcdef-png";
    const storedAsset: StoredArtworkAsset = {
      assetId,
      name: "synthetic-logo.png",
      mimeType: "image/png",
      blob: new NodeBlob(["synthetic local artwork bytes"], { type: "image/png" }) as unknown as Blob,
    };
    assets.records.set(assetId, storedAsset);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-artwork-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
      artworkStore: assets.store,
    });
    const style = workflow.snapshot.activeStyle;
    const design = style.design;
    const key = surfaceKey(style.recipeId, style.name);
    const nextSurface = surfaceAdd(design.surface, key, style.name, {
      id: "synthetic-logo",
      kind: "print",
      pieceRole: "front",
      widthCm: 5,
      heightCm: 5,
      transform: EMPTY_TRANSFORM,
      zOrder: 1,
      sourceName: "",
      assetId,
    });
    await workflow.saveActiveDesign({ ...design, surface: nextSurface });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets.store });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      expect(root.querySelector(".tech-pack-ready")?.textContent).toContain("synthetic-logo.png");
      expect(root.querySelector(".tech-pack-ready")?.textContent).toContain("Revision-bound local artwork attachments");
      expect(root.querySelector(".tech-pack-ready")?.textContent).toContain("User-provided local artwork");

      assets.records.delete(assetId);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')?.click();
      await vi.waitFor(() => expect(root.querySelector('#production-pack-host [role="status"]')?.textContent)
        .toContain("Local artwork"));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();

      vi.mocked(assets.store.get).mockRejectedValueOnce("local profile unavailable");
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')?.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("Check the saved revision and local artwork, then retry."));

      const pendingAsset = deferred<StoredArtworkAsset | null>();
      vi.mocked(assets.store.get).mockReturnValueOnce(pendingAsset.promise);
      const beforePendingRead = vi.mocked(assets.store.get).mock.calls.length;
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(vi.mocked(assets.store.get).mock.calls.length).toBe(beforePendingRead + 1));
      const preset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      preset.value = "measurements-qa";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      pendingAsset.resolve(null);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent)
        .toContain("Section selection changed");

      assets.records.set(assetId, storedAsset);
      const completePreset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      completePreset.value = "complete-pack";
      completePreset.dispatchEvent(new Event("change", { bubbles: true }));
      const detachedAssetRead = deferred<StoredArtworkAsset | null>();
      vi.mocked(assets.store.get).mockReturnValueOnce(detachedAssetRead.promise);
      const beforeDetachedAsset = vi.mocked(assets.store.get).mock.calls.length;
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(vi.mocked(assets.store.get).mock.calls.length).toBe(beforeDetachedAsset + 1));
      mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets.store });
      detachedAssetRead.resolve(storedAsset);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("No preview has been generated");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("resolves bundled artwork only from the local app origin and rejects failed or redirected reads", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const bundled = ARTWORK_CATALOG[0]!;
    const mutableImage = bundled.image as { localImageUrl: string };
    const originalImageUrl = mutableImage.localImageUrl;
    const styleName = "Bundled artwork review";
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-bundled-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const style = workflow.snapshot.activeStyle;
    await workflow.saveActiveDesign({
      ...style.design,
      surface: surfaceAdd(style.design.surface, surfaceKey(style.recipeId, style.name), style.name, {
        id: "bundled-textile-study",
        kind: "print",
        pieceRole: "front",
        widthCm: 8,
        heightCm: 8,
        transform: EMPTY_TRANSFORM,
        zOrder: 1,
        sourceName: styleName,
        assetId: bundled.assetId,
      }),
    });
    const root = document.createElement("div");
    document.body.append(root);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      url: "",
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as Response));
    try {
      mountApp(root, { projectWorkflow: workflow });
      const base = workflow.snapshot;
      const headId = base.activeStyle.revisionHeadId!;
      const head = base.styleRevisions.find((revision) => revision.revisionId === headId)!;
      const replaceHead = (revision: typeof head): typeof base => ({
        ...base,
        styleRevisions: base.styleRevisions.map((candidate) => candidate.revisionId === headId ? revision : candidate),
      });
      const unknownReferenceRevision = {
        ...head,
        payload: {
          ...head.payload,
          artwork: [{ assetId: "builtin-not-in-catalog", mimeType: "image/png", byteLength: 1, sha256: "a".repeat(64) }],
        },
      } as typeof head;
      const missingBundledRecord = vi.spyOn(workflow.repository, "loadProject")
        .mockResolvedValueOnce(replaceHead(unknownReferenceRevision));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("not available as a bundled or local asset"));
      missingBundledRecord.mockRestore();

      const design = head.payload.design;
      const key = surfaceKey(base.activeStyle.recipeId, base.activeStyle.name);
      const malformedPlacementRevision = {
        ...head,
        payload: {
          ...head.payload,
          design: {
            ...design,
            surface: {
              ...design.surface,
              [key]: { styleName: base.activeStyle.name, placements: ["non-object raw placement"] },
            },
          },
        },
      } as typeof head;
      const malformedPlacement = vi.spyOn(workflow.repository, "loadProject")
        .mockResolvedValueOnce(replaceHead(malformedPlacementRevision));
      mutableImage.localImageUrl = `${window.location.origin}/bundled-artwork.jpg`;
      vi.stubGlobal("fetch", fetchMock);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("The saved style revision is invalid or has no supported tech-pack snapshot."));
      malformedPlacement.mockRestore();

      const fetchCountBeforeOriginCheck = fetchMock.mock.calls.length;
      mutableImage.localImageUrl = "https://remote.invalid/artwork.jpg";
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("not available from this app's local origin"));
      expect(fetchMock).toHaveBeenCalledTimes(fetchCountBeforeOriginCheck);

      mutableImage.localImageUrl = `${window.location.origin}/bundled-artwork.jpg`;
      fetchMock.mockImplementationOnce(async () => ({
        ok: false,
        status: 503,
        url: "",
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("could not be read (HTTP 503)"));

      fetchMock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        url: "https://remote.invalid/redirected-artwork.jpg",
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as Response));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("redirected outside the local app origin"));

      fetchMock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        url: "",
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as Response));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("does not match the saved revision"));
      expect(fetchMock).toHaveBeenCalledTimes(4);
    } finally {
      mutableImage.localImageUrl = originalImageUrl;
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 25_000);

  it("freezes approved local Tech Pack files only while the scoped revision binding stays current", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-tech-pack-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T12:00:00.000Z",
    });
    const initial = workflow.snapshot;
    const revisionId = initial.activeStyle.revisionHeadId;
    if (!revisionId) throw new Error("The synthetic initial style has no saved revision.");
    const scopeFieldIds = [initial.activeStyle.techPack.cover.styleName.fieldId];
    await workflow.beginActiveTechPackReview("Synthetic S778 reviewer", scopeFieldIds, revisionId);
    await workflow.approveActiveTechPackReview("Synthetic S778 approver", revisionId);
    const approved = workflow.snapshot;
    const changed = {
      ...approved,
      activeStyle: {
        ...approved.activeStyle,
        techPack: {
          ...approved.activeStyle.techPack,
          approval: {
            ...approved.activeStyle.techPack.approval,
            scopeFieldIds: [...scopeFieldIds, approved.activeStyle.techPack.cover.styleCode.fieldId],
          },
        },
      },
    };
    const root = mount({ projectWorkflow: workflow });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    try {
      clickIfPresent(root, "welcome-skip");
      clickId(root, "journey-step-fit");
      const details = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      if (!details.open) details.querySelector("summary")!.click();
      await vi.waitFor(() => expect(root.querySelector(".project-tech-pack-share")).not.toBeNull());
      const preset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      preset.value = "measurements-qa";
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      const originalLoad = workflow.repository.loadProject.bind(workflow.repository);
      const staleBeforeGeneration = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(changed);
      root.querySelector<HTMLButtonElement>('[data-project-action="freeze-tech-pack-share"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
        .toContain("changed in another window"), { timeout: 20000 });
      expect(staleBeforeGeneration).toHaveBeenCalledOnce();
      expect(confirm).not.toHaveBeenCalled();
      staleBeforeGeneration.mockRestore();

      const missingFreshStyle = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(null);
      root.querySelector<HTMLButtonElement>('[data-project-action="freeze-tech-pack-share"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
        .toContain("Open a saved local style"), { timeout: 20000 });
      expect(missingFreshStyle).toHaveBeenCalledOnce();
      expect(confirm).not.toHaveBeenCalled();
      missingFreshStyle.mockRestore();

      let reads = 0;
      const staleRead = vi.spyOn(workflow.repository, "loadProject").mockImplementation(async (projectId) => {
        reads += 1;
        return reads === 2 ? changed : originalLoad(projectId);
      });
      const freezeAction = root.querySelector<HTMLButtonElement>('[data-project-action="freeze-tech-pack-share"]');
      if (!freezeAction) throw new Error(`The approved share action did not render: share=${root.querySelector(".project-tech-pack-share")?.textContent} details=${root.querySelector(".project-manager-details")?.outerHTML.slice(-1800)}`);
      freezeAction.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
        .toContain("changed while the frozen Tech Pack files were generating"), { timeout: 20000 });
      expect(reads).toBe(2);
      expect(confirm).not.toHaveBeenCalled();
      expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED");
      staleRead.mockRestore();

      const completePreset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      completePreset.value = "complete-pack";
      completePreset.dispatchEvent(new Event("change", { bubbles: true }));
      root.querySelector<HTMLButtonElement>('[data-project-action="freeze-tech-pack-share"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
        .toContain("Frozen 2 Tech Pack share files"), { timeout: 45000 });
      expect(confirm).toHaveBeenCalledOnce();
      expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("FROZEN_FOR_SHARE");
      const frozenShares = workflow.snapshot.exportManifests.filter((manifest) => manifest.schemaVersion === 3);
      expect(frozenShares).toHaveLength(1);
      expect(frozenShares[0].payload.selectedSections).toContain("artwork");
      expect(workflow.snapshot.activeStyle.techPack.approval.revisionId).toBe(revisionId);
    } finally {
      workflow.close();
      localStorage.clear();
    }
  }, 60000);

  it("fails closed when the approved share loses a valid current Tech Pack context before generation", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-tech-pack-freeze-context-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-13T12:00:00.000Z",
    });
    const initial = workflow.snapshot;
    const revisionId = initial.activeStyle.revisionHeadId;
    if (!revisionId) throw new Error("The synthetic initial style has no saved revision.");
    const scopeFieldIds = [initial.activeStyle.techPack.cover.styleName.fieldId];
    await workflow.beginActiveTechPackReview("Synthetic S778 reviewer", scopeFieldIds, revisionId);
    await workflow.approveActiveTechPackReview("Synthetic S778 approver", revisionId);
    const approved = workflow.snapshot;
    const unapproved = {
      ...approved,
      activeStyle: {
        ...approved.activeStyle,
        techPack: {
          ...approved.activeStyle.techPack,
          approval: { ...approved.activeStyle.techPack.approval, state: "REVIEW" as const },
        },
      },
    };
    const missingRevision = { ...approved, styleRevisions: [] };
    const root = mount({ projectWorkflow: workflow });
    try {
      clickIfPresent(root, "welcome-skip");
      clickId(root, "journey-step-fit");
      const details = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
      if (!details.open) details.querySelector("summary")!.click();
      await vi.waitFor(() => expect(root.querySelector(".project-tech-pack-share")).not.toBeNull());
      const originalSnapshot = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(workflow), "snapshot")!.get!;
      const assertCallbackRejectsSnapshot = async (replacement: typeof approved, message: string): Promise<void> => {
        let reads = 0;
        Object.defineProperty(workflow, "snapshot", {
          configurable: true,
          get: () => ++reads === 1 ? originalSnapshot.call(workflow) : replacement,
        });
        try {
          root.querySelector<HTMLButtonElement>('[data-project-action="freeze-tech-pack-share"]')!.click();
        } finally {
          Reflect.deleteProperty(workflow, "snapshot");
        }
        await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent)
          .toContain(message), { timeout: 20000 });
      };
      await assertCallbackRejectsSnapshot(unapproved, "Approve the current saved Tech Pack revision");
      await assertCallbackRejectsSnapshot(missingRevision, "no verified current tech-pack snapshot");
    } finally {
      workflow.close();
      localStorage.clear();
    }
  }, 60000);

  it("discards stale generation work and rechecks ready previews after saved-state or tab changes", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-freshness-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const base = workflow.snapshot;
    const changed = {
      ...base,
      activeStyle: {
        ...base.activeStyle,
        techPack: {
          ...base.activeStyle.techPack,
          approval: {
            ...base.activeStyle.techPack.approval,
            scopeFieldIds: [...base.activeStyle.techPack.approval.scopeFieldIds, "cover.styleCode"],
          },
        },
      },
    };
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      const originalLoadProject = workflow.repository.loadProject.bind(workflow.repository);
      const earlyRead = deferred<typeof base | null>();
      const earlyLoad = vi.spyOn(workflow.repository, "loadProject").mockReturnValueOnce(earlyRead.promise);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(earlyLoad).toHaveBeenCalledTimes(1));
      const earlyPreset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      earlyPreset.value = "measurements-qa";
      earlyPreset.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("Section selection changed");
      earlyRead.resolve(base);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      earlyLoad.mockRestore();

      const detachedRead = deferred<typeof base | null>();
      const detachedLoad = vi.spyOn(workflow.repository, "loadProject").mockReturnValueOnce(detachedRead.promise);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(detachedLoad).toHaveBeenCalledTimes(1));
      mountApp(root, { projectWorkflow: workflow });
      detachedRead.resolve(base);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("No preview has been generated");
      detachedLoad.mockRestore();

      const lateRead = deferred<typeof base | null>();
      let readCount = 0;
      const loadProject = vi.spyOn(workflow.repository, "loadProject").mockImplementation((projectId) => {
        readCount++;
        return readCount === 2 ? lateRead.promise : originalLoadProject(projectId);
      });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(readCount).toBe(2));
      lateRead.resolve(changed);
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("review scope changed while the preview was generating"));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      loadProject.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      const postOutputRead = deferred<typeof base | null>();
      let postOutputReadCount = 0;
      const postOutputLoad = vi.spyOn(workflow.repository, "loadProject").mockImplementation((projectId) => {
        postOutputReadCount++;
        return postOutputReadCount === 2 ? postOutputRead.promise : originalLoadProject(projectId);
      });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(postOutputReadCount).toBe(2));
      const pendingPreset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      pendingPreset.value = "measurements-qa";
      pendingPreset.dispatchEvent(new Event("change", { bubbles: true }));
      postOutputRead.resolve(base);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("Section selection changed");
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      postOutputLoad.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      const noCurrentProject = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(null);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("Open a saved local style"));
      noCurrentProject.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      const changedBeforeGeneration = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(changed);
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("changed in another window"));
      changedBeforeGeneration.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      const readFailure = vi.spyOn(workflow.repository, "loadProject")
        .mockRejectedValueOnce(new Error("read-only local store"));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("The production-pack preview could not be generated. read-only local store"));
      readFailure.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());

      root.querySelector<HTMLElement>("#project-manager-host")!.setAttribute("data-recheck", "same-binding");
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());

      const mutableWorkflow = workflow as unknown as { loaded: typeof base };
      const missingHead = {
        ...base,
        activeStyle: { ...base.activeStyle, revisionHeadId: null },
      };
      mutableWorkflow.loaded = missingHead;
      root.querySelector<HTMLElement>("#project-persistence-state")!.textContent = "Current revision missing";
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("no saved revision head"));
      const invalidContextPreset = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      invalidContextPreset.value = "materials-construction";
      invalidContextPreset.dispatchEvent(new Event("change", { bubbles: true }));
      expect(root.querySelector("#production-pack-host")?.textContent).toContain("no saved revision head");
      mutableWorkflow.loaded = base;
      root.querySelector<HTMLElement>("#project-persistence-state")!.textContent = "Saved in this style";
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("saved style revision or its review scope changed"));
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());

      mutableWorkflow.loaded = changed;
      root.querySelector<HTMLElement>("#project-persistence-state")!.textContent = "Saved review scope changed";
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("saved style revision or its review scope changed"));
      expect(root.querySelector(".tech-pack-ready")).toBeNull();
      mutableWorkflow.loaded = base;
      root.querySelector<HTMLElement>("#project-persistence-state")!.textContent = "Saved in this style";
      await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
        .toContain("saved style revision or its review scope changed"));

      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      const freshRead = vi.spyOn(workflow.repository, "loadProject");
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(freshRead).toHaveBeenCalledTimes(1));
      expect(root.querySelector(".tech-pack-ready")).not.toBeNull();

      const priorVisibility = Object.getOwnPropertyDescriptor(document, "visibilityState");
      try {
        Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
        const hiddenCallCount = freshRead.mock.calls.length;
        document.dispatchEvent(new Event("visibilitychange"));
        await Promise.resolve();
        expect(freshRead).toHaveBeenCalledTimes(hiddenCallCount);
        Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
        document.dispatchEvent(new Event("visibilitychange"));
        await vi.waitFor(() => expect(freshRead).toHaveBeenCalledTimes(hiddenCallCount + 1));
        freshRead.mockRejectedValueOnce(new Error("local revision store unavailable"));
        window.dispatchEvent(new Event("focus"));
        await vi.waitFor(() => expect(root.querySelector("#production-pack-host")?.textContent)
          .toContain("current saved revision could not be checked"));
      } finally {
        if (priorVisibility) Object.defineProperty(document, "visibilityState", priorVisibility);
        else Reflect.deleteProperty(document, "visibilityState");
      }
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const blockedDownload = document.createElement("button");
      blockedDownload.dataset.productionPackDownload = "pdf";
      root.querySelector("#production-pack-host")!.append(blockedDownload);
      blockedDownload.click();
      freshRead.mockRestore();
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 90_000);

  it("downloads both revision-matched outputs and blocks stale or unsupported downloads", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `app-production-pack-download-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-01T12:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    const originalUrl = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const originalRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    const createUrl = vi.fn(() => "blob:synthetic-production-pack");
    const revokeUrl = vi.fn();
    const downloads: HTMLAnchorElement[] = [];
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this);
    });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeUrl });
    try {
      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());

      for (const [kind, expectedName] of [
        ["pdf", "production-pack.pdf"],
        ["archive", "techpack.zip"],
      ] as const) {
        root.querySelector<HTMLButtonElement>(`[data-production-pack-download="${kind}"]`)!.click();
        await vi.waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(kind === "pdf" ? 1 : 2));
        expect(downloads[downloads.length - 1]?.download).toContain(expectedName);
      }
      expect(createUrl).toHaveBeenCalledTimes(2);
      await vi.waitFor(() => expect(revokeUrl).toHaveBeenCalledTimes(2), { timeout: 5_000 });
      expect(revokeUrl).toHaveBeenCalledTimes(2);

      const pendingDownloadRead = deferred<typeof workflow.snapshot | null>();
      const pendingDownload = vi.spyOn(workflow.repository, "loadProject").mockReturnValueOnce(pendingDownloadRead.promise);
      root.querySelector<HTMLButtonElement>('[data-production-pack-download="pdf"]')!.click();
      await vi.waitFor(() => expect(pendingDownload).toHaveBeenCalledTimes(1));
      const selectionDuringDownload = root.querySelector<HTMLSelectElement>("#production-pack-preset")!;
      selectionDuringDownload.value = "measurements-qa";
      selectionDuringDownload.dispatchEvent(new Event("change", { bubbles: true }));
      pendingDownloadRead.resolve(workflow.snapshot);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent)
        .toContain("Section selection changed");
      expect(anchorClick).toHaveBeenCalledTimes(2);
      pendingDownload.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      const detachedDownloadRead = deferred<typeof workflow.snapshot | null>();
      const detachedDownload = vi.spyOn(workflow.repository, "loadProject").mockReturnValueOnce(detachedDownloadRead.promise);
      root.querySelector<HTMLButtonElement>('[data-production-pack-download="pdf"]')!.click();
      await vi.waitFor(() => expect(detachedDownload).toHaveBeenCalledTimes(1));
      mountApp(root, { projectWorkflow: workflow });
      detachedDownloadRead.resolve(workflow.snapshot);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      expect(anchorClick).toHaveBeenCalledTimes(2);
      detachedDownload.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      const loadProject = vi.spyOn(workflow.repository, "loadProject").mockResolvedValueOnce(null);
      root.querySelector<HTMLButtonElement>('[data-production-pack-download="pdf"]')!.click();
      await vi.waitFor(() => expect(root.querySelector('#production-pack-host [role="alert"]')?.textContent)
        .toContain("no longer matches the saved revision"));
      expect(anchorClick).toHaveBeenCalledTimes(2);
      loadProject.mockRestore();

      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      createUrl.mockImplementationOnce(() => { throw new Error("blocked blob URL"); });
      root.querySelector<HTMLButtonElement>('[data-production-pack-download="archive"]')!.click();
      await vi.waitFor(() => expect(root.querySelector('#production-pack-host [role="status"]')?.textContent)
        .toContain("editable ZIP download could not start"));
      expect(anchorClick).toHaveBeenCalledTimes(2);

      mountApp(root, { projectWorkflow: workflow });
      root.querySelector<HTMLButtonElement>('[data-production-pack-action="generate"]')!.click();
      await vi.waitFor(() => expect(root.querySelector(".tech-pack-ready")).not.toBeNull());
      createUrl.mockImplementationOnce(() => { throw "blocked PDF URL"; });
      root.querySelector<HTMLButtonElement>('[data-production-pack-download="pdf"]')!.click();
      await vi.waitFor(() => expect(root.querySelector('#production-pack-host [role="status"]')?.textContent)
        .toContain("The PDF download could not start. Check browser download support, then retry."));
    } finally {
      workflow.close();
      root.remove();
      anchorClick.mockRestore();
      if (originalUrl) Object.defineProperty(URL, "createObjectURL", originalUrl);
      else Reflect.deleteProperty(URL, "createObjectURL");
      if (originalRevoke) Object.defineProperty(URL, "revokeObjectURL", originalRevoke);
      else Reflect.deleteProperty(URL, "revokeObjectURL");
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 90_000);

  it("serializes only meaningful saved drafts and preserves every optional draft field", () => {
    const session = createMeasurementCaptureSession(
      "00000000-0000-4000-8000-000000000016", "woven-shirt", "2026-09-26T00:00:00.000Z",
    );
    const [raw, unit, source, method, date, measurer, empty] = session.fields;
    const drafts = new Map<string, CaptureDraft>([
      [raw!.fieldId, { rawValue: "12", unit: "cm", error: null, sourceNote: "", method: "", captureDate: "", measurer: "" }],
      [unit!.fieldId, { rawValue: "", unit: "in", error: null, sourceNote: "", method: "", captureDate: "", measurer: "" }],
      [source!.fieldId, { rawValue: "", unit: source!.unit, error: null, sourceNote: "noted", method: "", captureDate: "", measurer: "" }],
      [method!.fieldId, { rawValue: "", unit: method!.unit, error: null, sourceNote: "", method: "tape", captureDate: "", measurer: "" }],
      [date!.fieldId, { rawValue: "", unit: date!.unit, error: null, sourceNote: "", method: "", captureDate: "2026-09-25", measurer: "" }],
      [measurer!.fieldId, { rawValue: "", unit: measurer!.unit, error: null, sourceNote: "", method: "", captureDate: "", measurer: "HELPER" }],
      [empty!.fieldId, { rawValue: "", unit: empty!.unit, error: null, sourceNote: "", method: "", captureDate: "", measurer: "" }],
    ]);
    const serialized = serializeCaptureDrafts(session, drafts);
    expect(serialized).toHaveLength(6);
    expect(serialized.map((draft) => draft.fieldId)).toEqual(session.fields.slice(0, 6).map((field) => field.fieldId));
    expect(serialized[0]).toMatchObject({ fieldId: raw!.fieldId, rawValue: "12", enteredUnit: "cm" });
    expect(serialized[1]).toMatchObject({ fieldId: unit!.fieldId, rawValue: "", enteredUnit: "in" });
    expect(serialized[2]).toMatchObject({ fieldId: source!.fieldId, sourceNote: "noted" });
    expect(serialized[3]).toMatchObject({ fieldId: method!.fieldId, captureMethod: "tape" });
    expect(serialized[4]).toMatchObject({ fieldId: date!.fieldId, captureDate: "2026-09-25" });
    expect(serialized[5]).toMatchObject({ fieldId: measurer!.fieldId, measurer: "HELPER" });
    expect(serializeCaptureDrafts(session, new Map())).toEqual([]);
  });

  it("keeps semantic-editor and export helper boundaries safe for missing roles and stale output", () => {
    expect(semanticEditorHandles("tee", { roles: {}, stitches: [] }, "front")).toEqual([]);
    const source = { roles: {}, stitches: [] };
    expect(exportablePieces(source, true)).toEqual([]);
    expect(() => exportablePieces(source, false)).toThrow(/pattern export is paused/);
    expect(() => exportablePieces(null, true)).toThrow(/pattern export is paused/);
  });

  it("fails closed when the guided capture session is missing, belongs to another recipe, or is incomplete", () => {
    expect(guidedCaptureStageBlocker(null, "woven-shirt")).toMatchObject({
      message: "Start guided capture for the selected garment before continuing.", step: "measure",
    });
    const teeSession = createMeasurementCaptureSession("00000000-0000-4000-8000-000000000001", "tee", "2026-09-26T00:00:00.000Z");
    expect(captureSessionMatchesRecipe(null, "woven-shirt")).toBe(false);
    expect(captureSessionMatchesRecipe(teeSession, "woven-shirt")).toBe(false);
    expect(captureSessionMatchesRecipe(teeSession, "tee")).toBe(true);
    const create = vi.fn(() => createMeasurementCaptureSession(
      "00000000-0000-4000-8000-000000000005", "woven-shirt", "2026-09-26T00:00:00.000Z",
    ));
    expect(captureSessionForRecipe(teeSession, "tee", create)).toBe(teeSession);
    expect(captureSessionForRecipe(teeSession, "woven-shirt", create)).toBe(create.mock.results[0]!.value);
    expect(captureSessionForRecipe(null, "woven-shirt", create)).toBe(create.mock.results[1]!.value);
    expect(create).toHaveBeenCalledTimes(2);
    const render = vi.fn(() => "rendered panel");
    expect(renderForCaptureSession(null, "woven-shirt", render)).toBe("");
    expect(renderForCaptureSession(teeSession, "woven-shirt", render)).toBe("");
    expect(renderForCaptureSession(teeSession, "tee", render)).toBe("rendered panel");
    expect(render).toHaveBeenCalledOnce();
    expect(guidedCaptureStageBlocker(teeSession, "woven-shirt")).toMatchObject({
      message: "Start guided capture for the selected garment before continuing.", step: "measure",
    });
    const wovenSession = createMeasurementCaptureSession("00000000-0000-4000-8000-000000000002", "woven-shirt", "2026-09-26T00:00:00.000Z");
    expect(guidedCaptureStageBlocker(wovenSession, "woven-shirt")).toMatchObject({
      step: "measure", field: getFieldDefinitions("woven-shirt")[0]!.id,
    });
    const captureTime = "2026-09-26T00:00:00.000Z";
    const invalidWovenCapture = getCaptureFieldDefinitions("woven-shirt").reduce((session, definition, index) =>
      addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 20).padStart(12, "0")}`,
        rawValue: definition.inputKey === "length" ? "45" : String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Explicit test value",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      }, captureTime), createMeasurementCaptureSession(
        "00000000-0000-4000-8000-000000000003", "woven-shirt", captureTime,
      ));
    expect(guidedCaptureStageBlocker(invalidWovenCapture, "woven-shirt")).toMatchObject({
      step: "measure", field: "body.wear-line-to-hip-level",
      message: expect.stringContaining("hip station at y=51.35 cm, below the hem at y=45 cm"),
    });
    expect(guidedCaptureStageBlocker(invalidWovenCapture, "woven-shirt", WOVEN_SHIRT_CROPPED_BOXY_ENTRY_ID))
      .toBeNull();

    const tankCaptureTime = "2026-09-26T00:00:00.000Z";
    const tankWithOnlyNeckDropMissing = getCaptureFieldDefinitions("tank")
      .filter((definition) => definition.inputKey !== "neckDrop")
      .reduce((session, definition, index) => addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 240).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Explicit test value",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      }, tankCaptureTime), createMeasurementCaptureSession(
        "00000000-0000-4000-8000-000000000004", "tank", tankCaptureTime,
      ));
    expect(guidedCaptureStageBlocker(tankWithOnlyNeckDropMissing, "tank", "tank-high-neck-digital-v1"))
      .toMatchObject({
        field: "style.tank-neck-drop", step: "measure",
        message: "Additional front neckline drop needs an explicit value or a selected digital preset.",
      });
    expect(guidedCaptureStageBlocker(tankWithOnlyNeckDropMissing, "tank", "tank-classic-scoop-digital-v1"))
      .toMatchObject({
        field: "style.tank-neck-drop", step: "measure",
        message: "Neck scoop depth needs an explicit value or a selected digital preset.",
      });
  });

  it("does not apply a selected reading while its evidence is conflicting", () => {
    const recipeId = "tee";
    const field = getFieldDefinitions(recipeId)[0]!;
    const now = "2026-09-26T00:00:00.000Z";
    const initial = createMeasurementCaptureSession("00000000-0000-4000-8000-000000000003", recipeId, now);
    const withConflict = addCaptureReadingForField(initial, field.id, {
      id: "00000000-0000-4000-8000-000000000004",
      rawValue: String(field.defaultValue),
      enteredUnit: field.unit,
      provenance: "USER_CAPTURED",
      evidenceStatus: "CONFLICT",
      sourceLabel: "Conflicting source record",
      captureMethod: null,
      capturedAt: null,
      measurer: null,
    }, now);
    const selected = selectCaptureReading(withConflict, field.id, "00000000-0000-4000-8000-000000000004", now);
    expect(guidedCaptureStageBlocker(selected, recipeId)).toMatchObject({ step: "measure", field: field.id });
    const captureField = selected.fields.find((candidate) => candidate.fieldId === field.id)!;
    expect(captureField.readings.find((reading) => reading.id === captureField.selectedReadingId)).toMatchObject({
      canonicalValue: field.defaultValue,
      evidenceStatus: "CONFLICT",
    });
    expect(assessCaptureField(captureField, recipeId).issue).toBe("conflicting-evidence");
    const apply = vi.fn();
    applySelectedCaptureValue(selected, recipeId, field.id, apply);
    expect(apply).not.toHaveBeenCalled();

    const resolvedId = "00000000-0000-4000-8000-000000000005";
    const resolvedSession = selectCaptureReading(addCaptureReadingForField(initial, field.id, {
      id: resolvedId,
      rawValue: String(field.defaultValue),
      enteredUnit: field.unit,
      provenance: "USER_CAPTURED",
      evidenceStatus: "UNCONFIRMED",
      sourceLabel: "Explicit test value",
      captureMethod: null,
      capturedAt: null,
      measurer: null,
    }, now), field.id, resolvedId, now);
    const applyResolved = vi.fn();
    applySelectedCaptureValue(resolvedSession, recipeId, field.id, applyResolved);
    expect(applyResolved).toHaveBeenCalledWith(field, field.defaultValue);
  });

  it("shows a render failure and disables exports when the current source throws", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    for (const [failure, expected] of [
      [new Error("render source failure"), "render source failure"],
      ["non-Error render failure", "could not be rendered because a recipe source check failed"],
    ] as const) {
      const draftSpy = vi.spyOn(recipe, "draft").mockImplementation(() => { throw failure; });
      try {
        const root = mount();
        expect(root.querySelector<HTMLElement>("[data-render-failed]")?.textContent).toContain(expected);
        expect([...root.querySelectorAll<HTMLButtonElement>("#export-host button")].every((button) => button.disabled)).toBe(true);
      } finally {
        draftSpy.mockRestore();
      }
    }
  });

  it("reports the refreshed and on-demand outputs for a changed measurement", () => {
    const root = mount();
    const input = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    input.value = "101";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const status = root.querySelector<HTMLElement>("#field-impact-status")!;
    expect(status.hidden).toBe(false);
    expect(status.dataset.fieldId).toBe("body.chest-girth");
    expect(status.textContent).toContain("Changing Chest invalidates for recomputation: pattern pieces");
    expect(status.textContent).toContain("The open view updates now; other views and exports rebuild on open/export.");
    expect(status.textContent).toContain("graded measurements and pattern pieces");
    expect(status.textContent).toContain("SVG, DXF, tiled PDF");
    expect(status.textContent).toContain("surface-art sheet SVG");
  });

  it("maps woven hem turn to cutting outputs while keeping finished POMs independent", () => {
    const root = mount();
    clickId(root, "garment-woven-shirt");
    const input = root.querySelector<HTMLInputElement>('input[data-option="hemTurn"]')!;
    input.value = "1.2";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const status = root.querySelector<HTMLElement>("#field-impact-status")!;
    expect(status.textContent).toContain("pattern pieces");
    expect(status.textContent).toContain("graded measurements and pattern pieces");
    expect(status.textContent).not.toContain("Not represented in current outputs");
    expect(status.textContent).toContain("POM/spec values");
    expect(status.textContent).toContain("Unaffected:");
  });

  it("warns when tank shoulder width is not consumed by the drafted pattern", () => {
    const root = mount();
    clickId(root, "garment-tank");
    const input = root.querySelector<HTMLInputElement>('input[data-field="shoulderWidth"]')!;
    input.value = "46";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const status = root.querySelector<HTMLElement>("#field-impact-status")!;
    expect(status.textContent).toContain("body/assembled illustration and shoulder-width guidance/check status");
    expect(status.textContent).toContain("Not represented in current outputs");
    expect(status.textContent).toContain("Body shoulder width does not determine the tank pattern's strap width");
    expect(status.textContent).toContain("Review or change Strap width to change the strap/armhole geometry");
    expect(status.textContent).toContain("unchanged pattern geometry is not evidence of fit");
  });

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
    localStorage.clear();
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
    const measure = root.querySelector<HTMLButtonElement>("#journey-step-measure")!;
    expect(measure.getAttribute("aria-label")).toBe("2 Measure");
    expect(measure.dataset.stageState).toBe("pending");
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-measure")!.getAttribute("aria-label"))
      .toBe("2 Measure — current stage");
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-measure")!.getAttribute("aria-label"))
      .toBe("2 Measure — complete");
  });

  it("keeps the Classic Tee chest allowance optional, independent, resettable, and persistent", async () => {
    localStorage.clear();
    let root = mount();
    const chooseStyle = (name: string): void => {
      const target = root.querySelector<HTMLSelectElement>("#style-target")!;
      target.value = name;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const modeledChest = (): string => root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent!;
    chooseStyle("Classic tee");

    let chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-option-mode="chestEase"]')!.textContent)
      .toContain("Inherited from shared fit allowance: 10 cm");

    const sharedEase = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    sharedEase.value = "5";
    sharedEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(modeledChest()).toBe("105 cm");
    expect(chestEase.disabled).toBe(true);
    root.querySelector<HTMLButtonElement>('[data-set-option="chestEase"]')!.click();
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.disabled).toBe(false);
    expect(chestEase.value).toBe("5");
    expect(chestEase.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector<HTMLElement>("#error-option-chestEase")!.textContent).toContain("7");

    chestEase.value = "8";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(chestEase.getAttribute("aria-invalid")).toBe("false");
    expect(modeledChest()).toBe("108 cm");
    chestEase.value = "";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(chestEase.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector<HTMLElement>('[data-option-mode="chestEase"]')!.textContent)
      .toContain("enter a number");
    chestEase.value = "8";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-reset-option="chestEase"]')!.click();
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.disabled).toBe(true);
    expect(modeledChest()).toBe("105 cm");

    root.querySelector<HTMLButtonElement>('[data-set-option="chestEase"]')!.click();
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    chestEase.value = "8";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    root.remove();

    root = mount();
    chooseStyle("Classic tee");
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.value).toBe("8");
    expect(chestEase.disabled).toBe(false);
    expect(modeledChest()).toBe("108 cm");
    const staleSet = root.querySelector<HTMLButtonElement>('[data-set-option="chestEase"]')!;
    const staleReset = root.querySelector<HTMLButtonElement>('[data-reset-option="chestEase"]')!;
    chooseStyle("Relaxed tee");
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input[data-option="waistDartIntake"]')).toBeNull();
    expect(modeledChest()).toBe("105 cm");
    staleSet.click();
    staleReset.click();
    chooseStyle("Classic tee");
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.value).toBe("8");
    expect(modeledChest()).toBe("108 cm");
    clickId(root, "garment-polo");
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input[data-option="placketLength"]')).not.toBeNull();
    clickId(root, "garment-skirt");
    expect(root.querySelector<HTMLElement>('[data-finished="hip"]')!.textContent).toBe("105 cm");
    clickId(root, "garment-trouser");
    expect(root.querySelector<HTMLElement>('[data-finished="waist"]')!.textContent).toBe("89 cm");
    expect(root.querySelector<HTMLElement>('[data-finished="hip"]')!.textContent).toBe("105 cm");
    clickId(root, "garment-fitted");
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    clickId(root, "garment-tee");
    chooseStyle("Classic tee");
    chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    expect(chestEase.value).toBe("8");
    expect(modeledChest()).toBe("108 cm");
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    clickId(root, "view-edit");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
  });

  it("validates semantic editing with an explicit Classic Tee chest allowance", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const fingerprintSpy = vi.spyOn(semanticEditEngine, "semanticEditSourceFingerprint");
    const root = mount();
    clickId(root, "garment-tee");
    const style = root.querySelector<HTMLSelectElement>("#style-target")!;
    style.value = "Classic tee";
    style.dispatchEvent(new Event("change", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-set-option="chestEase"]')!.click();
    const chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    chestEase.value = "8";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(chestEase.getAttribute("aria-invalid")).toBe("false");
    clickId(root, "view-edit");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const lastFingerprintCall = fingerprintSpy.mock.calls[fingerprintSpy.mock.calls.length - 1];
    expect(lastFingerprintCall?.[3]?.options).toEqual({ chestEase: 8 });
  });

  it("opens the guided capture route with recipe help and keeps the full editor available", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-woven-shirt");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-measure")!.dataset.stageState).toBe("pending");
    expect(root.querySelector<HTMLButtonElement>("#journey-guided")!.textContent).toBe("Guide my measurements");
    const captureWithoutSession = document.createElement("button");
    captureWithoutSession.dataset.action = "capture-add-reading";
    captureWithoutSession.dataset.fieldId = "body.chest-girth";
    root.append(captureWithoutSession);
    captureWithoutSession.click();
    captureWithoutSession.remove();

    const fallbackDefinition = getFieldDefinitions("woven-shirt")[0]!;
    const originalHelpLookup = measurementHelp.measurementHelpFor;
    const missingHelp = vi.spyOn(measurementHelp, "measurementHelpFor").mockImplementation((recipeId, fieldId) =>
      fieldId === fallbackDefinition.id ? null : originalHelpLookup(recipeId, fieldId));
    const originalCrypto = globalThis.crypto;
    const captureFallbackCrypto = new Proxy(originalCrypto, {
      get(target, property) {
        if (property === "randomUUID") return undefined;
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    try {
      vi.stubGlobal("crypto", captureFallbackCrypto);
      clickId(root, "journey-guided");
      const fallbackCaveat = root.querySelector<HTMLElement>(
        `[data-field-id="${fallbackDefinition.id}"] .measurement-capture-panel__caveat`,
      )!;
      expect(fallbackCaveat.textContent).toContain(fallbackDefinition.captureBoundary);
    } finally {
      vi.stubGlobal("crypto", originalCrypto);
      missingHelp.mockRestore();
    }
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLElement>("#controls-panel")!.style.display).toBe("none");
    expect(root.querySelectorAll(".measurement-capture-panel__field")).toHaveLength(getCaptureFieldDefinitions("woven-shirt").length);
    expect(root.querySelector(".measurement-capture-panel__field")!.textContent).toContain("How the draft uses it");
    expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(true);

    const uninitializedDraftFailure = document.createElement("button");
    uninitializedDraftFailure.dataset.action = "capture-add-reading";
    uninitializedDraftFailure.dataset.fieldId = "body.neck-base-girth";
    root.append(uninitializedDraftFailure);
    const throwingErrorCrypto = new Proxy(originalCrypto, {
      get(target, property) {
        if (property === "randomUUID") return () => { throw new Error("synthetic capture failure"); };
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    try {
      vi.stubGlobal("crypto", throwingErrorCrypto);
      uninitializedDraftFailure.click();
    } finally {
      vi.stubGlobal("crypto", originalCrypto);
      uninitializedDraftFailure.remove();
    }
    expect(root.querySelector<HTMLElement>("#g03-measurement-capture-status")!.textContent)
      .toContain("synthetic capture failure");

    const initialChestUnit = root.querySelector<HTMLSelectElement>(
      '[data-action="capture-change-unit"][data-field-id="body.chest-girth"]',
    )!;
    initialChestUnit.dispatchEvent(new Event("change", { bubbles: true }));
    const staleCaptureInput = document.createElement("input");
    staleCaptureInput.dataset.action = "capture-edit-raw";
    staleCaptureInput.dataset.fieldId = "stale.capture-field";
    root.append(staleCaptureInput);
    staleCaptureInput.dispatchEvent(new Event("input", { bubbles: true }));
    staleCaptureInput.remove();
    const unnamedCaptureInput = document.createElement("input");
    unnamedCaptureInput.dataset.action = "capture-edit-raw";
    root.append(unnamedCaptureInput);
    unnamedCaptureInput.dispatchEvent(new Event("input", { bubbles: true }));
    unnamedCaptureInput.remove();
    const staleCaptureSelect = document.createElement("select");
    staleCaptureSelect.dataset.action = "capture-change-unit";
    staleCaptureSelect.dataset.fieldId = "stale.capture-unit-field";
    staleCaptureSelect.value = "in";
    root.append(staleCaptureSelect);
    staleCaptureSelect.dispatchEvent(new Event("change", { bubbles: true }));
    staleCaptureSelect.remove();
    const unnamedCaptureSelect = document.createElement("select");
    unnamedCaptureSelect.dataset.action = "capture-change-unit";
    root.append(unnamedCaptureSelect);
    unnamedCaptureSelect.dispatchEvent(new Event("change", { bubbles: true }));
    unnamedCaptureSelect.remove();
    const unnamedCaptureAction = document.createElement("button");
    unnamedCaptureAction.dataset.action = "capture-add-reading";
    root.append(unnamedCaptureAction);
    unnamedCaptureAction.click();
    unnamedCaptureAction.remove();
    const missingReadingId = document.createElement("button");
    missingReadingId.dataset.action = "capture-select-reading";
    missingReadingId.dataset.fieldId = "body.chest-girth";
    root.append(missingReadingId);
    missingReadingId.click();
    missingReadingId.remove();
    const nonErrorCaptureFailure = document.createElement("button");
    nonErrorCaptureFailure.dataset.action = "capture-add-reading";
    nonErrorCaptureFailure.dataset.fieldId = "stale.capture-error-field";
    root.append(nonErrorCaptureFailure);
    const throwingCrypto = new Proxy(originalCrypto, {
      get(target, property) {
        if (property === "randomUUID") return () => { throw "synthetic capture failure"; };
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    try {
      vi.stubGlobal("crypto", throwingCrypto);
      nonErrorCaptureFailure.click();
    } finally {
      vi.stubGlobal("crypto", originalCrypto);
      nonErrorCaptureFailure.remove();
    }
    expect(root.querySelector<HTMLElement>("#g03-measurement-capture-status")!.textContent)
      .toContain("This value could not be recorded.");

    const correction = root.querySelector<HTMLButtonElement>("#journey-correction")!;
    const correctionInput = root.querySelector<HTMLInputElement>(
      `[data-action="capture-edit-raw"][data-field-id="${correction.dataset.correctionField}"]`,
    )!;
    const focusCorrection = vi.spyOn(correctionInput, "focus");
    clickId(root, "journey-correction");
    expect(focusCorrection).toHaveBeenCalledOnce();
    const chest = root.querySelector<HTMLInputElement>('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]')!;
    chest.value = "40.5";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const unit = root.querySelector<HTMLSelectElement>('[data-action="capture-change-unit"][data-field-id="body.chest-girth"]')!;
    unit.value = "in";
    unit.dispatchEvent(new Event("change", { bubbles: true }));
    const optional = chest.closest("li")!.querySelector<HTMLDetailsElement>(".measurement-capture-panel__optional-details")!;
    optional.open = true;
    const sourceNote = optional.querySelector<HTMLInputElement>('[data-action="capture-edit-source"]')!;
    sourceNote.value = "User's sewing notebook";
    sourceNote.dispatchEvent(new Event("input", { bubbles: true }));
    const methodNote = optional.querySelector<HTMLInputElement>('[data-action="capture-edit-method"]')!;
    methodNote.value = "User supplied method note";
    methodNote.dispatchEvent(new Event("input", { bubbles: true }));
    const dateNote = optional.querySelector<HTMLInputElement>('[data-action="capture-edit-date"]')!;
    dateNote.value = "2026-09-25";
    dateNote.dispatchEvent(new Event("input", { bubbles: true }));
    const measurer = optional.querySelector<HTMLSelectElement>('[data-action="capture-change-measurer"]')!;
    measurer.value = "HELPER";
    measurer.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, chest.closest("li")!.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!.id);
    expect(root.querySelector('[data-reading-id] .measurement-capture-panel__reading-summary')!.textContent)
      .toContain("40.5” in = 102.87 cm");
    const chestReadingDetails = root.querySelector<HTMLElement>('[data-field-id="body.chest-girth"] .measurement-capture-panel__reading-details')!;
    expect(chestReadingDetails.textContent).toContain("Source: User's sewing notebook");
    expect(chestReadingDetails.textContent).toContain("Method: User supplied method note");
    expect(chestReadingDetails.textContent).toContain("Captured: 2026-09-25 (UTC)");
    expect(chestReadingDetails.textContent).toContain("Measured by: a helper");

    const firstReading = root.querySelector<HTMLElement>('[data-field-id="body.chest-girth"] [data-reading-id]')!.dataset.readingId!;
    const repeatedChest = root.querySelector<HTMLInputElement>('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]')!;
    repeatedChest.value = "40.75";
    repeatedChest.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, repeatedChest.closest("li")!.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!.id);
    expect(root.querySelector<HTMLElement>('[data-field-id="body.chest-girth"]')!.dataset.state).toBe("ambiguous");
    const chooseFirst = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-select-reading"]')]
      .find((button) => button.dataset.readingId === firstReading)!;
    clickId(root, chooseFirst.id);
    expect(root.querySelector<HTMLElement>('[data-field-id="body.chest-girth"]')!.dataset.state).toBe("resolved");
    expect(root.querySelector<HTMLInputElement>('#controls-panel input[data-field="chest"]')!.value).toBe("102.87");

    const option = getCaptureFieldDefinitions("woven-shirt").find((definition) => definition.inputKind === "option")!;
    const optionPreset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
      .find((button) => button.dataset.fieldId === option.id)!;
    clickId(root, optionPreset.id);
    const optionInput = [...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-option]")]
      .find((input) => input.dataset.option === option.inputKey)!;
    expect(optionInput.value).toBe(String(option.defaultValue));

    const finishedLength = root.querySelector<HTMLInputElement>(
      '[data-action="capture-edit-raw"][data-field-id="target.top-hps-to-hem"]',
    )!;
    finishedLength.value = "62";
    finishedLength.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, finishedLength.closest("li")!.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!.id);
    expect(root.querySelector<HTMLElement>(
      '[data-field-id="target.top-hps-to-hem"] .measurement-capture-panel__reading-details',
    )!.textContent).toContain("Source: User-selected digital target or design value.");

    const rejectedField = getCaptureFieldDefinitions("woven-shirt").find((definition) =>
      definition.id !== "body.chest-girth" && definition.id !== option.id)!;
    const rejectedInput = [...root.querySelectorAll<HTMLInputElement>('[data-action="capture-edit-raw"]')]
      .find((input) => input.dataset.fieldId === rejectedField.id)!;
    rejectedInput.value = "1".repeat(4097);
    rejectedInput.dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, rejectedInput.closest("li")!.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!.id);
    expect(root.querySelector<HTMLElement>(`[data-field-id="${rejectedField.id}"] .measurement-capture-panel__draft-error`)!.textContent)
      .toContain("raw value is invalid");

    for (const definition of getCaptureFieldDefinitions("woven-shirt")) {
      const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
        .find((button) => button.dataset.fieldId === definition.id)!;
      clickId(root, preset.id);
    }
    expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);

    clickId(root, "journey-next");
    expect(root.querySelector<HTMLButtonElement>("#journey-step-measure")!.dataset.stageState).toBe("complete");
    expect(root.querySelector<HTMLElement>("#controls-panel")!.style.display).not.toBe("none");
    expect(root.querySelector<HTMLInputElement>('#controls-panel input[data-field="chest"]')!.value).toBe("100");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("fit");
  });

  it("renders and gates guided capture against every current recipe field list", () => {
    const semanticLabels = {
      BODY_MEASURE: "Body input",
      GARMENT_MEASURE: "Finished-garment target",
      FINISHED_POM: "Derived output",
      PATTERN_PARAMETER: "Pattern target",
      STYLE_CONTROL: "Style control",
    } as const;
    const frameLabels = {
      body: "the wearer's body",
      "finished-garment": "the finished garment",
      pattern: "the flat pattern",
      "design-control": "a design choice",
    } as const;
    for (const recipe of GARMENTS) {
      localStorage.clear();
      const root = mount();
      clickId(root, `garment-${recipe.name}`);
      clickId(root, "journey-guided");

      const fields = [...root.querySelectorAll<HTMLElement>(".measurement-capture-panel__field")];
      const definitions = getCaptureFieldDefinitions(recipe.name);
      expect(fields.map((field) => field.dataset.fieldId), recipe.name)
        .toEqual(definitions.map((definition) => definition.id));
      for (let index = 0; index < fields.length; index += 1) {
        expect(fields[index]!.querySelector("legend")?.textContent, recipe.name)
          .toBe(definitions[index]!.label);
        expect(fields[index]!.querySelector(".measurement-capture-panel__kind")?.textContent, recipe.name)
          .toContain(semanticLabels[definitions[index]!.semanticKind]);
        expect(fields[index]!.querySelector(".measurement-capture-panel__kind")?.textContent, recipe.name)
          .toContain(frameLabels[definitions[index]!.referenceFrame]);
      }
      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled, recipe.name).toBe(true);

      for (const definition of definitions) {
        const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
          .find((button) => button.dataset.fieldId === definition.id);
        expect(preset, recipe.name).toBeDefined();
        clickId(root, preset!.id);
      }
      expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled, recipe.name).toBe(false);
      if (recipe.name === "woven-shirt") {
        const lengthDefinition = definitions.find((definition) => definition.inputKey === "length")!;
        const lengthField = root.querySelector<HTMLElement>(`[data-field-id="${lengthDefinition.id}"]`)!;
        const lengthInput = lengthField.querySelector<HTMLInputElement>('[data-action="capture-edit-raw"]')!;
        lengthInput.value = "45";
        lengthInput.dispatchEvent(new Event("input", { bubbles: true }));
        clickId(root, lengthField.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!.id);
        expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(true);
        const secondLength = [...root.querySelectorAll<HTMLButtonElement>(
          `[data-field-id="${lengthDefinition.id}"] [data-action="capture-select-reading"]`,
        )].find((button) => button.textContent?.includes("reading 2"))!;
        clickId(root, secondLength.id);
        expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(true);
        expect(root.querySelector<HTMLElement>("#journey-blocker")!.textContent)
          .toContain("hip station at y=51.35 cm, below the hem at y=45 cm");
        const firstLength = [...root.querySelectorAll<HTMLButtonElement>(
          `[data-field-id="${lengthDefinition.id}"] [data-action="capture-select-reading"]`,
        )].find((button) => button.textContent?.includes("reading 1"))!;
        clickId(root, firstLength.id);
        expect(root.querySelector("#journey-blocker")).toBeNull();
        expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
      }
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#journey-step-measure")!.dataset.stageState, recipe.name)
        .toBe("complete");
      root.remove();
      // Do not retain each detached app tree until the full recipe matrix ends.
      mountedRoots.delete(root);
    }
  });

  it("replaces the active canvas with Assembled, then returns to the same view", () => {
    localStorage.clear();
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

  it("keeps the same +/- and range contract for recipe options, nesting width, and Edit coordinates", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
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
    const after = [...root.querySelectorAll<HTMLInputElement>("input")]
      .find((input) => input.id === coordinate.id)!;
    expect(Number(after.value)).toBeCloseTo(before + 0.1, 5);
    expect(after.closest<HTMLElement>("[data-range-control]")!.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("Open range");
    expect(after.closest<HTMLElement>("[data-range-control]")!.querySelector<HTMLElement>("[data-range-marker]")!.style.display)
      .toBe("none");
  });

  it("falls back to the original control if a stepper event detaches its input", () => {
    const root = mount();
    const input = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    input.addEventListener("input", () => input.remove(), { once: true });
    const plus = input.closest<HTMLElement>("[data-range-control]")!
      .querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!;
    expect(() => plus.click()).not.toThrow();
    expect(input.isConnected).toBe(false);
  });

  it("preserves an out-of-range field with an actionable correction on change", () => {
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    const control = chest.closest<HTMLElement>("[data-range-control]")!;
    chest.value = "59";
    chest.dispatchEvent(new Event("input"));
    expect(control.dataset.rangeState).toBe("under");
    expect(control.querySelector("[data-range-rail]")!.getAttribute("aria-label"))
      .toContain("below minimum");
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
});
