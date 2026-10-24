// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { GARMENTS, STANDARD_M, TEE_RAGLAN } from "../drafting";
import {
  BRAND_PROFILE_PROJECT_RECORD_VERSION,
  CUSTOM_ONE_SIZE_MODE,
  CUSTOM_STYLE_RECORD_VERSION,
  migrateLegacySaveFile,
  projectScenarios,
  type SavedDesign,
  type StyleRecord,
} from "./project-records";
import { serialize } from "./persist";
import { ProjectManager, recoveryPayloadOrNull } from "./project-manager";
import type { LoadedProject } from "./project-repository";
import type { ProjectWorkflow, TechPackShareFreezeInput } from "./project-workflow";
import { openProjectWorkflow } from "./project-workflow";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";
import type { InspectedArtworkFile } from "../surface/artwork-file";
import { BRAND_PROFILE_RECORD_VERSION, type BrandProfileRecord } from "./brand-profile-records";
import { createProjectPackage, PROJECT_PACKAGE_MAX_ASSETS, readProjectPackage } from "./project-package";
import { createFieldObservationRecord } from "./field-provenance";
import * as techPackT02Validation from "./tech-pack-t02-validation";
import * as techPackOperationReconciliation from "./tech-pack-operation-reconciliation";
import { emptyTechPackPomRecordSet } from "./tech-pack-sample-qa-records";
import {
  TECH_PACK_OPERATION_MAX_RECORDS,
  emptyTechPackOperationRecordSetV2,
  unresolvedTechPackOperation,
} from "./tech-pack-operation-records";
import { TECH_PACK_SHARE_ARTIFACTS } from "./tech-pack-sharing";
import { bindTechPackToRevision, createEmptyTechPackRecord, type TechPackRecord } from "./tech-pack-records";
import type { ScenarioRecord } from "./scenario-records";

const TIME = "2026-09-24T16:00:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const STYLE_TWO_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
let techPackDatabaseSerial = 0;

afterEach(() => {
  document.body.replaceChildren();
});

async function techPackHarness(options: {
  readonly techPackIdFactory?: () => string;
  readonly confirm?: (message: string) => boolean;
  readonly canFreezeOutputs?: () => boolean;
  readonly getFreezeBlocker?: () => string | null;
  readonly getTechPackShareOutput?: (revisionId: string, workflow: ProjectWorkflow) => Promise<TechPackShareFreezeInput | null>;
  readonly artworkStore?: ArtworkAssetStore;
  readonly inspectAsset?: (file: File) => Promise<InspectedArtworkFile>;
  readonly initialBrandProfile?: BrandProfileRecord;
} = {}) {
  let sequence = 0;
  const ids = [PROJECT_ID, STYLE_ID];
  const fallback = (): string => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  const workflow = await openProjectWorkflow({
    repositoryOptions: {
      name: `project-manager-t01-${++techPackDatabaseSerial}`,
      factory: new IDBFactory(),
      crypto: webcrypto as unknown as Crypto,
    },
    storage: { getItem: () => null },
    idFactory: () => ids.shift() ?? fallback(),
    now: () => TIME,
    ...(options.artworkStore ? { artworkStore: options.artworkStore } : {}),
  });
  if (options.initialBrandProfile) await workflow.saveBrandProfile(options.initialBrandProfile);
  const host = document.createElement("div");
  document.body.append(host);
  let currentDesign = workflow.snapshot.activeStyle.design;
  let unsavedChanges = false;
  const onStyleLoaded = vi.fn();
  const manager = new ProjectManager({
    host,
    workflow,
    getCurrentDesign: () => currentDesign,
    getBlankDesign: () => workflow.snapshot.activeStyle.design,
    hasUnsavedChanges: () => unsavedChanges,
    onStyleLoaded,
    setBusy: vi.fn(),
    canFreezeOutputs: options.canFreezeOutputs ?? (() => true),
    getFrozenOutputSet: () => null,
    ...(options.artworkStore ? { artworkStore: options.artworkStore } : {}),
    ...(options.inspectAsset ? { inspectAsset: options.inspectAsset } : {}),
    ...(options.getTechPackShareOutput ? {
      getTechPackShareOutput: (revisionId: string) => options.getTechPackShareOutput!(revisionId, workflow),
    } : {}),
    ...(options.techPackIdFactory ? { techPackIdFactory: options.techPackIdFactory } : {}),
    ...(options.confirm ? { confirm: options.confirm } : {}),
    ...(options.getFreezeBlocker ? { getFreezeBlocker: options.getFreezeBlocker } : {}),
  });
  host.querySelector<HTMLDetailsElement>(".project-manager-details")!.querySelector("summary")!.click();
  await vi.waitFor(() => expect(host.querySelector(".t01-editor")).not.toBeNull());
  return {
    workflow,
    host,
    manager,
    onStyleLoaded,
    setCurrentDesign: (design: SavedDesign) => { currentDesign = design; },
    setUnsavedChanges: (value: boolean) => { unsavedChanges = value; },
    close: () => {
      workflow.close();
      host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
    },
  };
}

function editT01Field(host: HTMLElement, fieldId: string, property: string, value: string): void {
  const control = host.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    `[data-t01-field-id="${fieldId}"][data-t01-field-property="${property}"]`,
  );
  if (!control) throw new Error(`Missing T01 control ${fieldId}.${property}`);
  control.value = value;
  const type = control instanceof HTMLSelectElement ? "change" : "input";
  control.dispatchEvent(new Event(type, { bubbles: true }));
}

function clickT01Action(host: HTMLElement, action: string, forceDisabled = false): void {
  const button = host.querySelector<HTMLButtonElement>(`[data-t01-action="${action}"]`);
  if (!button) throw new Error(`Missing T01 action ${action}`);
  if (forceDisabled) button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  else button.click();
}

function editCollectionField(host: HTMLElement, selector: string, value: string): void {
  const control = host.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
  if (!control) throw new Error(`Missing collection control ${selector}`);
  control.value = value;
  const type = control instanceof HTMLSelectElement ? "change" : "input";
  control.dispatchEvent(new Event(type, { bubbles: true }));
}

function editScenarioField(host: HTMLElement, selector: string, value: string): void {
  const control = host.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
  if (!control) throw new Error(`Missing scenario control ${selector}`);
  control.value = value;
  const type = control instanceof HTMLSelectElement ? "change" : "input";
  control.dispatchEvent(new Event(type, { bubbles: true }));
}

function clickCollectionAction(host: HTMLElement, action: string, selector = ""): void {
  const button = host.querySelector<HTMLButtonElement>(`[data-collection-action="${action}"]${selector}`);
  if (!button) throw new Error(`Missing collection action ${action}${selector}`);
  button.click();
}

function clickT02Action(host: HTMLElement, action: string, roundId?: string): void {
  const suffix = roundId ? `[data-t02-round-id="${roundId}"]` : "";
  const button = host.querySelector<HTMLButtonElement>(`[data-t02-action="${action}"]${suffix}`);
  if (!button) throw new Error(`Missing T02 action ${action}`);
  button.click();
}

function clickT03Action(host: HTMLElement, action: string, operationId?: string): void {
  const suffix = operationId ? `[data-t03-operation-id="${operationId}"]` : "";
  const button = host.querySelector<HTMLButtonElement>(`[data-t03-action="${action}"]${suffix}`);
  if (!button) throw new Error(`Missing T03 action ${action}`);
  button.click();
}

function editT02Control(host: HTMLElement, selector: string, value: string): void {
  const control = host.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
  if (!control) throw new Error(`Missing T02 control ${selector}`);
  control.value = value;
  const type = control instanceof HTMLSelectElement ? "change" : "input";
  control.dispatchEvent(new Event(type, { bubbles: true }));
}

function loadedProject(): LoadedProject {
  const result = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150"), projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
  });
  if (!result.ok) throw new Error(result.error);
  const second = { ...result.value.style, id: STYLE_TWO_ID, name: "Second style" };
  const project = { ...result.value.project, styleIds: [STYLE_ID, STYLE_TWO_ID] };
  return {
    project,
    styles: [result.value.style, second],
    activeStyle: result.value.style,
    activeRecovery: null,
    fieldObservations: [
      createFieldObservationRecord(result.value.style, TIME, "existing-local-style"),
      createFieldObservationRecord(second, TIME, "existing-local-style"),
    ],
    styleRevisions: [],
    exportManifests: [],
  };
}

function memoryArtworkStore(initial: readonly StoredArtworkAsset[] = []): {
  readonly store: ArtworkAssetStore;
  readonly assets: Map<string, StoredArtworkAsset>;
} {
  const assets = new Map(initial.map((asset) => [asset.assetId, asset]));
  return {
    assets,
    store: {
      put: vi.fn(async (asset) => { assets.set(asset.assetId, asset); }),
      get: vi.fn(async (assetId) => assets.get(assetId) ?? null),
      remove: vi.fn(async (assetId) => { assets.delete(assetId); }),
    },
  };
}

function selectArtworkFiles(input: HTMLInputElement, files: readonly File[]): void {
  Object.defineProperty(input, "files", { configurable: true, value: files });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function harness(initialStatusMessage?: string, getFreezeBlocker?: () => string | null) {
  const initial = loadedProject();
  let snapshot = initial;
  const second = { ...initial.styles[1], archivedAt: null };
  const loadedSecond: LoadedProject = {
    project: { ...initial.project, activeStyleId: STYLE_TWO_ID },
    styles: [initial.styles[0], second], activeStyle: second,
    activeRecovery: { schemaVersion: 2, styleId: STYLE_TWO_ID, payload: {} } as LoadedProject["activeRecovery"],
    fieldObservations: initial.fieldObservations,
    styleRevisions: [],
    exportManifests: [],
  };
  const workflow = {
    get snapshot() { return snapshot; },
    createStyle: vi.fn(async (name: string) => {
      const created = { ...second, name };
      snapshot = { ...loadedSecond, styles: [initial.styles[0], created], activeStyle: created };
      return snapshot;
    }),
    renameActiveStyle: vi.fn(async (name: string) => {
      const renamed = { ...snapshot.activeStyle, name };
      snapshot = { ...snapshot, styles: snapshot.styles.map((style) => style.id === renamed.id ? renamed : style), activeStyle: renamed };
      return snapshot;
    }),
    reload: vi.fn(async () => { snapshot = loadedSecond; return snapshot; }),
    switchStyle: vi.fn(async (id: string) => { snapshot = id === STYLE_ID ? initial : loadedSecond; return snapshot; }),
    archiveStyle: vi.fn(async () => {
      const archived = { ...initial.styles[1], archivedAt: TIME };
      snapshot = { ...initial, styles: [initial.styles[0], archived] };
      return { ...snapshot, styles: [initial.styles[0]] };
    }),
    restoreStyle: vi.fn(async () => {
      snapshot = { ...loadedSecond, styles: [initial.styles[0]] };
      return snapshot;
    }),
  } as unknown as ProjectWorkflow;
  const host = document.createElement("div");
  document.body.append(host);
  const setBusy = vi.fn();
  const onStyleLoaded = vi.fn();
  let currentDesign: SavedDesign | null = initial.activeStyle.design;
  let unsavedChanges = true;
  const manager = new ProjectManager({
    host,
    workflow,
    getCurrentDesign: () => currentDesign,
    getBlankDesign: () => initial.activeStyle.design,
    hasUnsavedChanges: () => unsavedChanges,
    onStyleLoaded,
    setBusy,
    initialStatusMessage,
    getFreezeBlocker,
  });
  return {
    host, manager, workflow, setBusy, onStyleLoaded,
    setCurrentDesign: (value: SavedDesign | null) => { currentDesign = value; },
    setUnsavedChanges: (value: boolean) => { unsavedChanges = value; },
    setSnapshot: (value: LoadedProject) => { snapshot = value; },
  };
}

async function clickAndSettle(host: HTMLElement, selector: string): Promise<void> {
  host.querySelector<HTMLButtonElement>(selector)!.click();
  await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).not.toBe("Saving the style change…"));
}

describe("accessible project and style manager", () => {
  it("keeps keyboard focus on the replacement disclosure summary after it opens", () => {
    const { host } = harness();
    const details = host.querySelector<HTMLDetailsElement>(".project-manager-details")!;
    const originalSummary = details.querySelector("summary")!;

    originalSummary.focus();
    details.open = true;
    details.dispatchEvent(new Event("toggle", { bubbles: true }));

    const replacementDetails = host.querySelector<HTMLDetailsElement>(".project-manager-details")!;
    const replacementSummary = replacementDetails.querySelector("summary")!;
    expect(replacementDetails.open).toBe(true);
    expect(replacementSummary).not.toBe(originalSummary);
    expect(document.activeElement).toBe(replacementSummary);
  });

  it("does not move focus to the disclosure when another control had focus", () => {
    const { host } = harness();
    const details = host.querySelector<HTMLDetailsElement>(".project-manager-details")!;
    const externalControl = document.createElement("button");
    document.body.append(externalControl);
    externalControl.focus();

    details.open = true;
    details.dispatchEvent(new Event("toggle", { bubbles: true }));

    expect(host.querySelector<HTMLDetailsElement>(".project-manager-details")!.open).toBe(true);
    expect(document.activeElement).toBe(externalControl);
  });

  it("keeps a saved Classic-only option out of non-Classic Tee T02 and T03 evaluation", async () => {
    const t02 = vi.spyOn(techPackT02Validation, "evaluateTechPackT02");
    const t03 = vi.spyOn(techPackOperationReconciliation, "buildTechPackReferenceReconciliation");
    const state = await techPackHarness();
    try {
      const { workflow, manager } = state;
      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const nonClassic = recipe.styles.find((candidate) => candidate.name !== "Classic tee")!;
      const design = workflow.snapshot.activeStyle.design;
      await workflow.saveActiveDesign({
        ...design,
        workspace: { ...design.workspace, targetStyle: nonClassic.name },
        garmentOptions: { ...design.garmentOptions, tee: { ...design.garmentOptions.tee, chestEase: 8 } },
      });
      t02.mockClear();
      t03.mockClear();
      manager.refresh();

      expect(t02).toHaveBeenCalledWith(expect.objectContaining({
        recipe,
        options: expect.not.objectContaining({ chestEase: 8 }),
      }));
      expect(t03).toHaveBeenCalledWith(expect.anything(), recipe, expect.anything(),
        expect.not.objectContaining({ chestEase: 8 }), expect.anything());
      expect(workflow.snapshot.activeStyle.design.garmentOptions.tee?.chestEase).toBe(8);
    } finally {
      t02.mockRestore();
      t03.mockRestore();
      state.close();
    }
  });

  it("resolves the saved Tee construction for T02 POM review", async () => {
    const t02 = vi.spyOn(techPackT02Validation, "evaluateTechPackT02");
    const state = await techPackHarness();
    try {
      const design = state.workflow.snapshot.activeStyle.design;
      await state.workflow.saveActiveDesign({
        ...design,
        workspace: { ...design.workspace, teeConstruction: "raglan" },
      });
      t02.mockClear();
      state.manager.refresh();
      expect(t02).toHaveBeenCalledWith(expect.objectContaining({ recipe: TEE_RAGLAN }));
    } finally {
      t02.mockRestore();
      state.close();
    }
  });

  it("handles missing option definitions and unsupported T03 recipe references", async () => {
    const t02 = vi.spyOn(techPackT02Validation, "evaluateTechPackT02");
    const t03 = vi.spyOn(techPackOperationReconciliation, "buildTechPackReferenceReconciliation");
    const state = await techPackHarness();
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const optionsDescriptor = Object.getOwnPropertyDescriptor(recipe, "options");
    try {
      const { workflow, manager } = state;
      const nonClassic = recipe.styles.find((candidate) => candidate.name !== "Classic tee")!;
      const design = workflow.snapshot.activeStyle.design;
      await workflow.saveActiveDesign({
        ...design,
        workspace: { ...design.workspace, targetStyle: nonClassic.name },
        garmentOptions: { ...design.garmentOptions, tee: { ...design.garmentOptions.tee, chestEase: 8 } },
      });

      Object.defineProperty(recipe, "options", { ...optionsDescriptor, value: undefined });
      t02.mockClear();
      t03.mockClear();
      manager.refresh();
      expect(t02).toHaveBeenCalledWith(expect.objectContaining({ recipe, options: {} }));
      expect(t03).toHaveBeenCalledWith(expect.anything(), recipe, expect.anything(), {}, expect.anything());

      const record = workflow.snapshot.activeStyle.techPack;
      if (!record) throw new Error("The Tech Pack fixture did not create a record.");
      (manager as unknown as { techPackDraft: TechPackRecord | null }).techPackDraft = {
        ...record,
        recipeId: "unsupported-recipe",
      };
      t02.mockClear();
      t03.mockClear();
      manager.refresh();
      expect(t02).not.toHaveBeenCalled();
      expect(t03).toHaveBeenCalledWith(expect.objectContaining({ recipeId: "unsupported-recipe" }),
        null, expect.objectContaining({ ease: 10 }), {}, null);
    } finally {
      if (optionsDescriptor) Object.defineProperty(recipe, "options", optionsDescriptor);
      t02.mockRestore();
      t03.mockRestore();
      state.close();
    }
  });

  it("uses a custom one-size base only when its size ID is nonempty", () => {
    const state = harness();
    const { host, manager, workflow, setSnapshot } = state;
    host.querySelector<HTMLDetailsElement>(".project-manager-details")!.querySelector("summary")!.click();
    const initial = workflow.snapshot;
    const baseStyle = initial.activeStyle;
    const customStyle = (baseSizeId: string | null): StyleRecord => ({
      ...baseStyle,
      schemaVersion: CUSTOM_STYLE_RECORD_VERSION,
      sizeMode: CUSTOM_ONE_SIZE_MODE,
      techPack: {
        ...baseStyle.techPack,
        cover: {
          ...baseStyle.techPack.cover,
          baseSizeId: { ...baseStyle.techPack.cover.baseSizeId, value: baseSizeId },
        },
      },
    });
    const refreshForSize = (baseSizeId: string | null): void => {
      const style = customStyle(baseSizeId);
      setSnapshot({ ...initial, activeStyle: style, styles: initial.styles.map((candidate) => candidate.id === style.id ? style : candidate) });
      manager.refresh();
    };

    refreshForSize(null);
    expect(host.querySelector("[data-t02-validation-summary]")?.textContent).toContain("size run needs action");
    expect(host.querySelector(".t02-validation")?.textContent).toContain("Recipe size run: No sizes declared.");
    refreshForSize("   ");
    expect(host.querySelector(".t02-validation")?.textContent).toContain("Recipe size run: No sizes declared.");
    refreshForSize("M");
    expect(host.querySelector(".t02-validation")?.textContent).toContain("Recipe size run: M.");
  });

  it("edits and saves revision-bound T02 POM actuals and QA observations", async () => {
    let nextId = 701;
    const state = await techPackHarness({
      techPackIdFactory: () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
      confirm: () => true,
    });
    try {
      const { workflow, host, manager } = state;
      expect(host.querySelector(".t02-editor")).not.toBeNull();
      const parentRevision = workflow.snapshot.styleRevisions.find((revision) =>
        revision.styleId === workflow.snapshot.activeStyle.id && revision.revisionId === workflow.snapshot.activeStyle.revisionHeadId);
      expect(parentRevision).toBeDefined();

      host.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!.value = "chest-width";
      host.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!.value = "Chest width";
      host.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!.value = "cm";
      clickT02Action(host, "add-definition");
      expect(host.querySelector("[data-t02-definition-id='chest-width']")?.textContent).toContain("Method UNRESOLVED");

      const definitions = host.querySelector<HTMLTextAreaElement>("[data-t02-input='definitions']")!;
      const validDefinitionJson = definitions.value;
      definitions.value = "{";
      definitions.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("valid JSON");
      definitions.value = validDefinitionJson;
      definitions.dispatchEvent(new Event("input", { bubbles: true }));

      const revisionSelect = host.querySelector<HTMLSelectElement>("[data-t02-new-round-revision]")!;
      revisionSelect.value = parentRevision!.revisionId;
      host.querySelector<HTMLInputElement>("[data-t02-new-round-label]")!.value = "First sample";
      host.querySelector<HTMLInputElement>("[data-t02-new-round-size]")!.value = "M";
      host.querySelector<HTMLInputElement>("[data-t02-new-round-recorder]")!.value = "Local maker";
      clickT02Action(host, "add-round");
      const round = host.querySelector<HTMLElement>(".t02-round");
      const roundId = round?.dataset.t02Round;
      expect(roundId).toBeDefined();
      expect(round?.querySelector("[data-t02-target-revision]")?.textContent).toContain(`r${parentRevision!.revisionNumber}`);
      expect(round?.querySelector("[data-t02-target-revision]")?.textContent).toContain("Editing this round will not retarget it.");

      const readingHost = host.querySelector<HTMLElement>(".t02-add-reading")!;
      readingHost.querySelector<HTMLSelectElement>(`[data-t02-new-reading-pom="${roundId}"]`)!.value = "chest-width";
      readingHost.querySelector<HTMLInputElement>(`[data-t02-new-reading-value="${roundId}"]`)!.value = "52.5";
      readingHost.querySelector<HTMLInputElement>(`[data-t02-new-reading-method="${roundId}"]`)!.value = "Measured flat with tape";
      readingHost.querySelector<HTMLTextAreaElement>(`[data-t02-new-reading-evidence="${roundId}"]`)!.value = "local-note-1";
      clickT02Action(host, "add-measured-reading", roundId);
      expect(host.querySelector(`[data-t02-reading='chest-width']`)?.textContent).toContain("Recorded sample actual");
      expect(host.querySelector("[data-t02-predicted-value]")).toBeNull();

      const observationHost = host.querySelector<HTMLElement>(".t02-add-observation")!;
      observationHost.querySelector<HTMLSelectElement>(`[data-t02-new-observation-status="${roundId}"]`)!.value = "OBSERVED";
      observationHost.querySelector<HTMLTextAreaElement>(`[data-t02-new-observation-note="${roundId}"]`)!.value = "Sample seam was observed for this review.";
      clickT02Action(host, "add-observation", roundId);
      expect(host.querySelector<HTMLSelectElement>(".t02-observation select")?.value).toBe("OBSERVED");
      expect(host.querySelector(".t02-observation")?.textContent).toContain("Sample seam was observed");
      expect(host.querySelector(".t02-observation select")?.textContent).not.toMatch(/pass|fail/i);

      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Saved the tech pack as immutable style revision"));
      const saved = workflow.snapshot.activeStyle.techPack;
      expect(saved.schemaVersion).toBe(2);
      expect(saved.pomData?.sampleQaRounds).toHaveLength(1);
      expect(saved.pomData?.sampleQaRounds[0].targetRevisionId).toBe(parentRevision!.revisionId);
      expect(saved.pomData?.sampleQaRounds[0].targetRevisionNumber).toBe(parentRevision!.revisionNumber);
      expect(saved.pomData?.sampleQaRounds[0].readings[0]).toMatchObject({
        pomDefinitionId: "chest-width", status: "MEASURED", actualValue: 52.5, unit: "cm", method: "Measured flat with tape",
      });
      expect(saved.pomData?.sampleQaRounds[0].qaObservations[0]).toMatchObject({
        status: "OBSERVED", note: "Sample seam was observed for this review.",
      });
      expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(parentRevision!.revisionId);

      const managerActions = manager as unknown as {
        handle(action: "save-tech-pack" | "discard-tech-pack" | "export-package" | "freeze-outputs"): Promise<void>;
        freezeOutputs(): Promise<void>;
        confirmTechPackDraftDiscard(): boolean;
      };
      await managerActions.handle("save-tech-pack");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("There are no unsaved tech-pack edits to save");
      const actual = host.querySelector<HTMLInputElement>("[data-t02-property='actualValue']")!;
      actual.value = "52.5";
      actual.dispatchEvent(new Event("input", { bubbles: true }));
      await managerActions.handle("save-tech-pack");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("No tech-pack content changed");

      host.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!.value = "waist-width";
      host.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!.value = "Waist width";
      host.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!.value = "cm";
      clickT02Action(host, "add-definition");
      expect(managerActions.confirmTechPackDraftDiscard()).toBe(true);
      expect(host.querySelector("#project-freeze-guidance")?.textContent).toContain("unsaved tech-pack edits");
      await managerActions.handle("export-package");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unsaved tech-pack edits before exporting");
      await managerActions.handle("freeze-outputs");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unsaved tech-pack edits before freezing");
      await managerActions.freezeOutputs();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unsaved tech-pack edits before freezing");
      await managerActions.handle("discard-tech-pack");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved tech-pack edits were discarded");
    } finally {
      state.close();
    }
  }, 20_000);

  it("edits T03 provenance, adds/removes unresolved shells, blocks invalid JSON, and saves/reloads schema v3", async () => {
    const state = await techPackHarness({ confirm: () => true });
    try {
      const { host, workflow } = state;
      expect(host.querySelector(".t03-editor")).not.toBeNull();
      expect(host.querySelector(".t03-reference-reconciliation [data-t03-component-id]")).not.toBeNull();
      expect(host.querySelector(".t03-reference-reconciliation [data-t03-seam-id]")).not.toBeNull();
      expect(host.querySelector(".t03-reference-reconciliation")?.textContent).toContain("do not establish sewability, physical fit, or production validity");
      const initialRevisionId = workflow.snapshot.activeStyle.revisionHeadId;
      const editor = host.querySelector<HTMLTextAreaElement>("[data-t03-input='operations']")!;
      const empty = editor.value;

      editor.value = "{";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("valid JSON");
      expect(host.querySelector(".t03-validation-error")?.textContent).toContain("valid JSON");
      editor.value = empty;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("[data-t03-validation-counts]")?.textContent).toContain("ABSENT 1");

      clickT03Action(host, "add-unresolved-operation");
      expect(host.querySelector("[data-t03-operation-id='operation-1']")?.textContent).toContain("unresolved");
      clickT03Action(host, "remove-operation", "operation-1");
      expect(host.querySelector("[data-t03-operation-id='operation-1']")).toBeNull();
      clickT03Action(host, "add-unresolved-operation");

      const drafted = JSON.parse(host.querySelector<HTMLTextAreaElement>("[data-t03-input='operations']")!.value) as {
        operations: Array<Record<string, unknown>>;
      };
      drafted.operations[0]!.name = { status: "USER_DECISION", value: "Synthetic join step", rationale: "Synthetic UI test only." };
      drafted.operations[0]!.sequence = { status: "ESTIMATE", value: 1, method: "Fixture ordering", assumptions: "Synthetic UI test only." };
      const edited = host.querySelector<HTMLTextAreaElement>("[data-t03-input='operations']")!;
      edited.value = JSON.stringify(drafted, null, 2);
      edited.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("[data-t03-validation-counts]")?.textContent)
        .toBe("ABSENT 11 · UNRESOLVED 2 · CONFLICT 0 · RECIPE DEFAULT 0 · ESTIMATE 1 · USER DECISION 1 · SOURCE CONFIRMED 0");
      expect(host.querySelector("[data-t03-operation-id='operation-1']")?.textContent)
        .toContain("Name USER_DECISION · sequence ESTIMATE · components UNRESOLVED · seams UNRESOLVED");

      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Saved the tech pack as immutable style revision"));
      const saved = workflow.snapshot.activeStyle.techPack;
      const head = workflow.snapshot.styleRevisions.find((revision) => revision.revisionId === saved.revisionId)!;
      expect(saved.schemaVersion).toBe(3);
      expect(saved.pomData).toBeDefined();
      expect(saved.operationData?.schemaVersion).toBe(2);
      expect(saved.operationData?.operations[0]?.name.status).toBe("USER_DECISION");
      expect(saved.operationData?.operations[0]?.sequence.status).toBe("ESTIMATE");
      expect(head.payload.payloadVersion).toBe(2);
      if (head.payload.payloadVersion === 2) expect(head.payload.techPack.operationData).toEqual(saved.operationData);
      expect(saved.revisionId).not.toBe(initialRevisionId);

      await workflow.reload();
      expect(workflow.snapshot.activeStyle.techPack.operationData).toEqual(saved.operationData);
      await expect(workflow.saveActiveTechPack({ ...saved, revisionId: initialRevisionId })).rejects.toMatchObject({ code: "conflict" });
    } finally {
      state.close();
    }
  }, 20_000);

  it("rejects disconnected, malformed, unsupported, and over-limit T03 drafts and actions", async () => {
    const state = await techPackHarness();
    try {
      const { host, manager, workflow } = state;
      const record = workflow.snapshot.activeStyle.techPack;
      const direct = manager as unknown as {
        techPackDraft: any;
        techPackDefinitionsJsonDraft: string | null;
        techPackOperationsJsonDraft: string | null;
        t03Data(candidate: any): any;
        t03DataWithPendingDraft(candidate: any): any;
        pendingTechPackJsonError(candidate: any): string;
        applyT02Draft(candidate: any, data: any): void;
        applyT03Draft(candidate: any, data: any): void;
        updateT03OperationFeedback(data: any, error: string | null): void;
        updateT03TechPackFromControl(target: HTMLTextAreaElement): void;
        handleT03TechPackAction(target: HTMLElement): void;
        render(): void;
      };
      const emptyOperations = emptyTechPackOperationRecordSetV2("tee");
      const emptyPom = emptyTechPackPomRecordSet("tee");
      const action = (name: string, operationId?: string): HTMLElement => {
        const target = document.createElement("button");
        target.dataset.t03Action = name;
        if (operationId !== undefined) target.dataset.t03OperationId = operationId;
        return target;
      };

      direct.applyT03Draft(record, emptyOperations);
      expect(direct.t03Data(direct.techPackDraft)).toEqual(emptyOperations);
      direct.applyT02Draft(direct.techPackDraft, emptyPom);
      expect(direct.techPackDraft.operationData).toEqual(emptyOperations);
      expect(direct.pendingTechPackJsonError(direct.techPackDraft)).toBe("");

      direct.techPackOperationsJsonDraft = "{";
      expect(direct.t03DataWithPendingDraft(direct.techPackDraft).error).toContain("valid JSON");
      direct.techPackOperationsJsonDraft = JSON.stringify({ ...emptyOperations, extra: true });
      expect(direct.pendingTechPackJsonError(direct.techPackDraft)).toContain("unknown fields");
      direct.techPackDefinitionsJsonDraft = "{";
      expect(direct.pendingTechPackJsonError(direct.techPackDraft)).toContain("POM definition needs attention");
      direct.techPackDefinitionsJsonDraft = null;
      direct.techPackOperationsJsonDraft = null;

      expect(direct.t03Data({ ...record, recipeId: "custom" })).toBeNull();
      direct.applyT03Draft({ ...record, recipeId: "custom" }, emptyOperations);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("supported recipe");
      direct.applyT03Draft(record, { schemaVersion: 2, recipeId: "polo", operations: [] });
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("operation edit needs attention");

      const textarea = document.createElement("textarea");
      textarea.dataset.t03Input = "operations";
      direct.techPackDraft = { ...record, styleId: "another-style" };
      textarea.value = JSON.stringify(emptyOperations);
      direct.updateT03TechPackFromControl(textarea);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("belongs to another style");
      direct.techPackDraft = null;
      textarea.value = "{";
      direct.updateT03TechPackFromControl(textarea);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("valid JSON");
      textarea.value = JSON.stringify({ ...emptyOperations, extra: true });
      direct.updateT03TechPackFromControl(textarea);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("needs attention");

      direct.techPackDraft = { ...record, styleId: "another-style" };
      direct.handleT03TechPackAction(action("add-unresolved-operation"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("belongs to another style");
      direct.techPackDraft = record;
      direct.techPackOperationsJsonDraft = "{";
      direct.handleT03TechPackAction(action("add-unresolved-operation"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("needs attention");
      direct.techPackOperationsJsonDraft = null;
      direct.techPackDraft = { ...record, recipeId: "custom" };
      direct.render();
      expect(host.querySelector(".t03-editor")?.textContent).toContain("This recipe is not supported by the T03 operation record");
      direct.handleT03TechPackAction(action("add-unresolved-operation"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no T03 operation record contract");

      direct.techPackDraft = { ...record, schemaVersion: 3, pomData: emptyPom, operationData: emptyOperations };
      direct.handleT03TechPackAction(action("remove-operation", "missing"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no longer exists");
      direct.handleT03TechPackAction(action("unknown"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("not supported");

      const collidingOperations = { ...emptyOperations, operations: [unresolvedTechPackOperation("operation-1")] };
      direct.techPackDraft = { ...record, schemaVersion: 3, pomData: emptyPom, operationData: collidingOperations };
      direct.handleT03TechPackAction(action("add-unresolved-operation"));
      expect(host.querySelectorAll(".t03-operation")).toHaveLength(2);

      const maximumOperations = {
        ...emptyOperations,
        operations: Array.from({ length: TECH_PACK_OPERATION_MAX_RECORDS }, (_unused, index) =>
          unresolvedTechPackOperation(`operation-${index + 1}`)),
      };
      direct.techPackDraft = { ...record, schemaVersion: 3, pomData: emptyPom, operationData: maximumOperations };
      direct.techPackOperationsJsonDraft = null;
      direct.handleT03TechPackAction(action("add-unresolved-operation"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("exceeds the operation limit");

      const feedbackEditor = host.querySelector<HTMLElement>(".t03-editor")!;
      feedbackEditor.querySelector(".t03-validation")!.remove();
      direct.updateT03OperationFeedback(null, "validation target missing");
      expect(feedbackEditor.querySelector(".t03-validation")).toBeNull();
      feedbackEditor.remove();
      direct.updateT03OperationFeedback(null, "editor target missing");
    } finally {
      state.close();
    }
  });

  it("validates T02 collection actions and edits each sample/QA observation field", async () => {
    let nextId = 801;
    const state = await techPackHarness({
      techPackIdFactory: () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
      confirm: () => true,
    });
    try {
      const { host, workflow, manager } = state;
      const parentRevision = workflow.snapshot.styleRevisions.find((revision) =>
        revision.styleId === workflow.snapshot.activeStyle.id && revision.revisionId === workflow.snapshot.activeStyle.revisionHeadId)!;
      const addDefinition = (id: string, label: string) => {
        host.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!.value = id;
        host.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!.value = label;
        host.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!.value = "cm";
        clickT02Action(host, "add-definition");
      };
      addDefinition("chest-width", "Chest width");
      addDefinition("body-length", "Body length");

      const addRound = host.querySelector<HTMLButtonElement>("[data-t02-action='add-round']")!;
      addRound.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing style revision");
      const revisionSelect = host.querySelector<HTMLSelectElement>("[data-t02-new-round-revision]")!;
      revisionSelect.value = "00000000-0000-4000-8000-000000009999";
      host.querySelector<HTMLInputElement>("[data-t02-new-round-label]")!.value = "Sample";
      host.querySelector<HTMLInputElement>("[data-t02-new-round-size]")!.value = "M";
      host.querySelector<HTMLInputElement>("[data-t02-new-round-recorder]")!.value = "Maker";
      addRound.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing style revision");
      revisionSelect.value = parentRevision.revisionId;
      addRound.click();
      const roundId = host.querySelector<HTMLElement>(".t02-round")!.dataset.t02Round!;

      editT02Control(host, `[data-t02-input='round'][data-t02-round-id='${roundId}'][data-t02-property='sampleLabel']`, "Revised sample label");
      editT02Control(host, `[data-t02-input='round'][data-t02-round-id='${roundId}'][data-t02-property='sampleSizeId']`, "L");
      editT02Control(host, `[data-t02-input='round'][data-t02-round-id='${roundId}'][data-t02-property='recordedBy']`, "Reviewer");

      const measuredForm = host.querySelector<HTMLElement>(".t02-add-reading")!;
      const measuredSelect = measuredForm.querySelector<HTMLSelectElement>(`[data-t02-new-reading-pom='${roundId}']`)!;
      measuredSelect.value = "chest-width";
      clickT02Action(host, "add-measured-reading", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("explicit finite sample actual");
      measuredForm.querySelector<HTMLInputElement>(`[data-t02-new-reading-value='${roundId}']`)!.value = "51.25";
      measuredForm.querySelector<HTMLInputElement>(`[data-t02-new-reading-method='${roundId}']`)!.value = "Tape flat";
      clickT02Action(host, "add-measured-reading", roundId);
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='chest-width'][data-t02-property='actualValue']`, "");
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='chest-width'][data-t02-property='actualValue']`, "51.5");
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='chest-width'][data-t02-property='method']`, "Measure laid flat");
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='chest-width'][data-t02-property='evidenceRefs']`, "photo-1\nmaker-note-2");

      const unresolvedForm = host.querySelector<HTMLElement>(".t02-add-unresolved-reading")!;
      unresolvedForm.querySelector<HTMLSelectElement>(`[data-t02-new-unresolved-pom='${roundId}']`)!.value = "body-length";
      clickT02Action(host, "add-unresolved-reading", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("reason and actionable next step");
      unresolvedForm.querySelector<HTMLInputElement>(`[data-t02-new-unresolved-reason='${roundId}']`)!.value = "Sample not available";
      unresolvedForm.querySelector<HTMLInputElement>(`[data-t02-new-unresolved-action='${roundId}']`)!.value = "Measure next sample";
      clickT02Action(host, "add-unresolved-reading", roundId);
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='body-length'][data-t02-property='unresolvedReason']`, "Awaiting sample");
      editT02Control(host, `[data-t02-input='reading'][data-t02-round-id='${roundId}'][data-t02-pom-id='body-length'][data-t02-property='nextAction']`, "Measure the received sample");

      const observationForm = host.querySelector<HTMLElement>(".t02-add-observation")!;
      const observationStatus = observationForm.querySelector<HTMLSelectElement>(`[data-t02-new-observation-status='${roundId}']`)!;
      observationStatus.value = "UNRESOLVED";
      clickT02Action(host, "add-observation", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("enter a note");
      observationForm.querySelector<HTMLTextAreaElement>(`[data-t02-new-observation-note='${roundId}']`)!.value = "Need a seam review";
      clickT02Action(host, "add-observation", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unresolved items also need a next action");
      observationForm.querySelector<HTMLInputElement>(`[data-t02-new-observation-action='${roundId}']`)!.value = "Review after pressing";
      clickT02Action(host, "add-observation", roundId);
      const observationId = host.querySelector<HTMLElement>(".t02-observation")!.dataset.t02Observation!;
      editT02Control(host, `[data-t02-input='observation'][data-t02-observation-id='${observationId}'][data-t02-property='status']`, "OBSERVED");
      editT02Control(host, `[data-t02-input='observation'][data-t02-observation-id='${observationId}'][data-t02-property='note']`, "Seam reviewed");
      editT02Control(host, `[data-t02-input='observation'][data-t02-observation-id='${observationId}'][data-t02-property='nextAction']`, "");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved T02 edits");

      host.querySelector<HTMLButtonElement>(`[data-t02-action='remove-definition'][data-t02-pom-id='chest-width']`)!.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Remove this POM's sample readings");
      host.querySelector<HTMLButtonElement>(`[data-t02-action='remove-reading'][data-t02-pom-id='body-length']`)!.click();
      host.querySelector<HTMLButtonElement>(`[data-t02-action='remove-definition'][data-t02-pom-id='body-length']`)!.click();
      expect(host.querySelector("[data-t02-definition-id='body-length']")).toBeNull();

      const extraObservationStatus = host.querySelector<HTMLSelectElement>(`[data-t02-new-observation-status='${roundId}']`)!;
      extraObservationStatus.value = "OBSERVED";
      host.querySelector<HTMLTextAreaElement>(`[data-t02-new-observation-note='${roundId}']`)!.value = "Second note";
      clickT02Action(host, "add-observation", roundId);
      const secondObservationId = host.querySelectorAll<HTMLElement>(".t02-observation")[1]!.dataset.t02Observation!;
      host.querySelector<HTMLButtonElement>(`[data-t02-action='remove-observation'][data-t02-observation-id='${secondObservationId}']`)!.click();
      expect(host.querySelectorAll(".t02-observation")).toHaveLength(1);

      const unknownAction = document.createElement("button");
      unknownAction.dataset.t02Action = "unsupported";
      host.querySelector(".project-manager")!.append(unknownAction);
      unknownAction.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("not supported");

      const validDefinitions = host.querySelector<HTMLTextAreaElement>("[data-t02-input='definitions']")!.value;
      const definitions = host.querySelector<HTMLTextAreaElement>("[data-t02-input='definitions']")!;
      definitions.value = "{";
      definitions.dispatchEvent(new Event("input", { bubbles: true }));
      (manager as unknown as { handleT02TechPackAction(target: HTMLElement): void }).handleT02TechPackAction(unknownAction);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("POM definition needs attention");
      definitions.value = validDefinitions;
      definitions.dispatchEvent(new Event("input", { bubbles: true }));

      definitions.value = "[]";
      definitions.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("POM definition needs attention");
      const pendingControl = document.createElement("input");
      pendingControl.dataset.t02Input = "round";
      pendingControl.dataset.t02RoundId = roundId;
      pendingControl.dataset.t02Property = "sampleLabel";
      pendingControl.value = "Pending edit";
      (manager as unknown as { updateT02TechPackFromControl(target: HTMLInputElement): void }).updateT02TechPackFromControl(pendingControl);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("POM definition needs attention");
      (manager as unknown as { handleT02TechPackAction(target: HTMLElement): void }).handleT02TechPackAction(unknownAction);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("POM definition needs attention");
      definitions.value = validDefinitions;
      definitions.dispatchEvent(new Event("input", { bubbles: true }));

      const definitionForm = host.querySelector<HTMLElement>(".t02-add-definition")!;
      const newPomId = definitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!;
      const newPomLabel = definitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!;
      const newPomUnit = definitionForm.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!;
      newPomId.value = "waist-width";
      newPomLabel.value = "";
      newPomUnit.value = "cm";
      clickT02Action(host, "add-definition");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("stable POM ID, label, and unit");
      newPomLabel.value = "Waist width";
      newPomUnit.value = "";
      clickT02Action(host, "add-definition");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("stable POM ID, label, and unit");
      newPomUnit.value = "cm";
      newPomId.value = "chest-width";
      clickT02Action(host, "add-definition");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("T02 change needs attention");

      const invokeAction = (action: string, round?: string, pom?: string, observation?: string) => {
        const button = document.createElement("button");
        button.dataset.t02Action = action;
        if (round !== undefined) button.dataset.t02RoundId = round;
        if (pom !== undefined) button.dataset.t02PomId = pom;
        if (observation !== undefined) button.dataset.t02ObservationId = observation;
        host.querySelector(".project-manager")!.append(button);
        button.click();
        button.remove();
      };
      invokeAction("remove-definition");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("POM definition is missing");
      invokeAction("remove-round");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("sample/QA round is missing");
      for (const action of ["add-measured-reading", "add-unresolved-reading", "remove-reading", "add-observation", "remove-observation"]) {
        invokeAction(action, "missing-round");
        expect(host.querySelector("#project-manager-status")?.textContent).toContain("sample/QA round is missing");
      }

      const direct = manager as unknown as {
        updateT02TechPackFromControl(target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void;
        handleT02TechPackAction(target: HTMLElement): void;
        techPackDraft: unknown;
      };
      const makeInput = (kind?: string, round = roundId, property?: string, pom?: string, observation?: string, value = "") => {
        const input = document.createElement("input");
        input.value = value;
        if (kind !== undefined) input.dataset.t02Input = kind;
        if (round !== undefined) input.dataset.t02RoundId = round;
        if (property !== undefined) input.dataset.t02Property = property;
        if (pom !== undefined) input.dataset.t02PomId = pom;
        if (observation !== undefined) input.dataset.t02ObservationId = observation;
        return input;
      };
      direct.updateT02TechPackFromControl(makeInput("round", "missing-round", "sampleLabel"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no longer connected");
      direct.updateT02TechPackFromControl(makeInput(undefined, roundId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no longer connected");
      direct.updateT02TechPackFromControl(makeInput("reading", roundId, "method", "missing-pom"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("reading no longer exists");
      direct.updateT02TechPackFromControl(makeInput("reading", roundId, "unsupported", "chest-width"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("not connected to a supported record field");
      direct.updateT02TechPackFromControl(makeInput("observation", roundId, "note", undefined, "missing-observation"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("QA observation no longer exists");
      direct.updateT02TechPackFromControl(makeInput("observation", roundId, "unsupported", undefined, observationId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("not connected to a supported record field");
      direct.updateT02TechPackFromControl(makeInput("round", roundId, "unsupported"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("not connected to a supported record field");

      const noFormAction = (action: string, targetRound?: string) => {
        const button = document.createElement("button");
        button.dataset.t02Action = action;
        if (targetRound !== undefined) button.dataset.t02RoundId = targetRound;
        direct.handleT02TechPackAction(button);
      };
      noFormAction("add-definition");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("stable POM ID, label, and unit");
      noFormAction("add-round");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing style revision");
      noFormAction("add-measured-reading", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing POM definition");

      const roundForm = host.querySelector<HTMLElement>(".t02-add-round")!;
      roundForm.querySelector<HTMLSelectElement>("[data-t02-new-round-revision]")!.value = parentRevision.revisionId;
      roundForm.querySelector<HTMLInputElement>("[data-t02-new-round-label]")!.value = "Second sample";
      roundForm.querySelector<HTMLInputElement>("[data-t02-new-round-size]")!.value = "L";
      roundForm.querySelector<HTMLInputElement>("[data-t02-new-round-recorder]")!.value = "Reviewer";
      clickT02Action(host, "add-round");
      expect(host.querySelectorAll(".t02-round")).toHaveLength(2);

      const addDefinitionForm = host.querySelector<HTMLElement>(".t02-add-definition")!;
      addDefinitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!.value = "waist-width";
      addDefinitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!.value = "Waist width";
      addDefinitionForm.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!.value = "cm";
      clickT02Action(host, "add-definition");
      const secondDefinitionForm = host.querySelector<HTMLElement>(".t02-add-definition")!;
      secondDefinitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")!.value = "neck-width";
      secondDefinitionForm.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")!.value = "Neck width";
      secondDefinitionForm.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")!.value = "cm";
      clickT02Action(host, "add-definition");

      const makeReadingForm = (className: string, action: string, targetRound: string, pom: string) => {
        const form = document.createElement("div");
        form.className = className;
        const select = document.createElement("select");
        select.dataset.t02NewReadingPom = targetRound;
        select.dataset.t02NewUnresolvedPom = targetRound;
        select.value = pom;
        const option = document.createElement("option");
        option.value = pom;
        option.textContent = pom;
        select.append(option);
        form.append(select);
        const button = document.createElement("button");
        button.dataset.t02Action = action;
        button.dataset.t02RoundId = targetRound;
        form.append(button);
        host.querySelector(".project-manager")!.append(form);
        return { form, button };
      };
      const measuredMissingMethod = makeReadingForm("t02-add-reading", "add-measured-reading", roundId, "waist-width");
      const measuredActual = document.createElement("input");
      measuredActual.type = "number";
      measuredActual.dataset.t02NewReadingValue = roundId;
      measuredActual.value = "50";
      measuredMissingMethod.form.append(measuredActual);
      measuredMissingMethod.button.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("measurement method");
      measuredMissingMethod.form.remove();

      const measuredWithoutEvidence = makeReadingForm("t02-add-reading", "add-measured-reading", roundId, "waist-width");
      const measuredValue = document.createElement("input");
      measuredValue.type = "number";
      measuredValue.dataset.t02NewReadingValue = roundId;
      measuredValue.value = "50";
      const measuredMethod = document.createElement("input");
      measuredMethod.dataset.t02NewReadingMethod = roundId;
      measuredMethod.value = "Laid flat with tape";
      measuredWithoutEvidence.form.append(measuredValue, measuredMethod);
      measuredWithoutEvidence.button.click();
      measuredWithoutEvidence.form.remove();

      const duplicateMeasured = makeReadingForm("t02-add-reading", "add-measured-reading", roundId, "waist-width");
      duplicateMeasured.button.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no reading in this round");
      duplicateMeasured.form.remove();

      const unresolvedWithoutFields = makeReadingForm("t02-add-unresolved-reading", "add-unresolved-reading", roundId, "neck-width");
      unresolvedWithoutFields.button.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unresolved sample reading needs");
      const unresolvedReason = document.createElement("input");
      unresolvedReason.dataset.t02NewUnresolvedReason = roundId;
      unresolvedReason.value = "No sample received";
      const unresolvedAction = document.createElement("input");
      unresolvedAction.dataset.t02NewUnresolvedAction = roundId;
      unresolvedAction.value = "Measure the next sample";
      unresolvedWithoutFields.form.append(unresolvedReason, unresolvedAction);
      unresolvedWithoutFields.button.click();
      unresolvedWithoutFields.form.remove();

      const observationWithoutHost = document.createElement("button");
      observationWithoutHost.dataset.t02Action = "add-observation";
      observationWithoutHost.dataset.t02RoundId = roundId;
      direct.handleT02TechPackAction(observationWithoutHost);
      const manualObservationForm = document.createElement("div");
      manualObservationForm.className = "t02-add-observation";
      const manualObservationStatus = document.createElement("select");
      manualObservationStatus.dataset.t02NewObservationStatus = roundId;
      manualObservationStatus.value = "UNRESOLVED";
      const unresolvedStatusOption = document.createElement("option");
      unresolvedStatusOption.value = "UNRESOLVED";
      unresolvedStatusOption.textContent = "Unresolved";
      manualObservationStatus.append(unresolvedStatusOption);
      manualObservationForm.append(manualObservationStatus);
      const observationButton = document.createElement("button");
      observationButton.dataset.t02Action = "add-observation";
      observationButton.dataset.t02RoundId = roundId;
      manualObservationForm.append(observationButton);
      host.querySelector(".project-manager")!.append(manualObservationForm);
      observationButton.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("enter a note");
      const observationNote = document.createElement("textarea");
      observationNote.dataset.t02NewObservationNote = roundId;
      observationNote.value = "A seam remains to review.";
      manualObservationForm.append(observationNote);
      observationButton.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unresolved items also need a next action");
      const observationAction = document.createElement("input");
      observationAction.dataset.t02NewObservationAction = roundId;
      observationAction.value = "Review after sewing";
      manualObservationForm.append(observationAction);
      observationButton.click();
      manualObservationForm.remove();

      const latestObservationId = host.querySelectorAll<HTMLElement>(".t02-observation")[1]!.dataset.t02Observation!;
      direct.updateT02TechPackFromControl(makeInput("round", roundId, "sampleLabel", undefined, undefined, "Revised sample label"));
      const latestActual = makeInput("reading", roundId, "actualValue", "waist-width") as HTMLInputElement;
      latestActual.type = "number";
      latestActual.value = "50";
      direct.updateT02TechPackFromControl(latestActual);
      direct.updateT02TechPackFromControl(makeInput("observation", roundId, "nextAction", undefined, observationId, "Review the sample"));
      direct.updateT02TechPackFromControl(makeInput("observation", roundId, "status", undefined, observationId, "UNRESOLVED"));
      const missingObservationId = document.createElement("button");
      missingObservationId.dataset.t02Action = "remove-observation";
      missingObservationId.dataset.t02RoundId = roundId;
      direct.handleT02TechPackAction(missingObservationId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("QA observation is missing");
      invokeAction("remove-reading", roundId);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("sample reading is missing");
      invokeAction("remove-reading", roundId, "waist-width");
      invokeAction("remove-observation", roundId, undefined, latestObservationId);
      const secondRoundId = host.querySelectorAll<HTMLElement>(".t02-round")[1]!.dataset.t02Round!;
      host.querySelector<HTMLButtonElement>(`[data-t02-action='remove-round'][data-t02-round-id='${secondRoundId}']`)!.click();
      expect(host.querySelectorAll(".t02-round")).toHaveLength(1);

      const baseRecord = workflow.snapshot.activeStyle.techPack;
      const validDraft = direct.techPackDraft;
      direct.techPackDraft = { ...baseRecord, recipeId: "unsupported" };
      const unavailableAction = document.createElement("button");
      unavailableAction.dataset.t02Action = "unsupported";
      direct.handleT02TechPackAction(unavailableAction);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no T02 POM record contract");
      const unsupportedDefinitions = document.createElement("textarea");
      unsupportedDefinitions.dataset.t02Input = "definitions";
      unsupportedDefinitions.value = "[]";
      direct.updateT02TechPackFromControl(unsupportedDefinitions);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no T02 POM record contract");
      direct.updateT02TechPackFromControl(makeInput("round", roundId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("no T02 POM record contract");
      direct.techPackDraft = validDraft;

      await workflow.createStyle("New style", workflow.snapshot.activeStyle.design);
      direct.updateT02TechPackFromControl(makeInput("round", roundId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("belongs to another style");
      direct.handleT02TechPackAction(unavailableAction);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("belongs to another style");
    } finally {
      state.close();
    }
  }, 60_000);

  it("edits and saves T01 from the project manager as one revision without replacing editor state", async () => {
    const state = await techPackHarness();
    try {
      const { workflow, host, manager } = state;
      const original = workflow.snapshot;
      const parentId = original.activeStyle.revisionHeadId!;
      const originalDesign = original.activeStyle.design;

      editT01Field(host, "cover.styleCode", "value", "TS-767");
      editT01Field(host, "cover.styleCode", "provenance", "USER_CAPTURED");
      editT01Field(host, "cover.styleCode", "provenance", "INHERITED");
      editT01Field(host, "cover.styleCode", "inheritedRevisionId", parentId);
      editT01Field(host, "cover.styleCode", "inheritedProvenance", "USER_CAPTURED");
      editT01Field(host, "cover.styleCode", "inheritedSourceRef", "parent-review-fixture");
      editT01Field(host, "cover.styleCode", "provenance", "USER_CAPTURED");
      editT01Field(host, "cover.styleCode", "evidenceStatus", "USER_CONFIRMED");
      editT01Field(host, "cover.styleCode", "validationStatus", "VALID");
      editT01Field(host, "cover.styleCode", "method", "Entered by the maker");
      editT01Field(host, "cover.styleCode", "capturedBy", "local maker");
      editT01Field(host, "cover.styleCode", "capturedAt", "2026-09-24T16:00:01.000Z");
      editT01Field(host, "cover.styleCode", "inputRefs", "maker-notes\nfit-session");
      editT01Field(host, "cover.styleCode", "evidenceRefs", "measurement-photo\nsource-document");
      editT01Field(host, "cover.styleCode", "unresolvedReason", "");
      editT01Field(host, "cover.styleCode", "nextAction", "");
      const unsupportedFieldProperty = document.createElement("input");
      unsupportedFieldProperty.dataset.t01Input = "true";
      unsupportedFieldProperty.dataset.t01FieldId = "cover.styleCode";
      unsupportedFieldProperty.dataset.t01FieldProperty = "unsupported";
      unsupportedFieldProperty.value = "ignored-property";
      host.append(unsupportedFieldProperty);
      unsupportedFieldProperty.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved T01 edits");
      unsupportedFieldProperty.remove();
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(false);
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")?.disabled).toBe(true);
      expect(host.querySelector("#project-freeze-guidance")?.textContent).toContain("unsaved T01 edits");
      await (manager as unknown as { freezeOutputs(): Promise<void> }).freezeOutputs();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("unsaved T01 edits");
      state.setUnsavedChanges(true);
      editT01Field(host, "cover.styleCode", "value", "TS-767");
      expect(host.querySelector("#project-freeze-guidance")?.textContent)
        .toContain("Save the current style before freezing outputs");

      const designDraft = {
        ...originalDesign,
        measurements: { ...originalDesign.measurements, chest: originalDesign.measurements.chest + 2 },
      };
      state.setCurrentDesign(designDraft);
      state.setUnsavedChanges(true);
      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(
        () => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Saved T01 as immutable style revision"),
        { timeout: 15_000 },
      );

      const saved = workflow.snapshot;
      const appended = saved.styleRevisions.filter((revision) => revision.parentRevisionId === parentId);
      expect(appended).toHaveLength(1);
      expect(saved.styleRevisions).toHaveLength(original.styleRevisions.length + 1);
      expect(saved.activeStyle.revisionHeadId).toBe(appended[0]?.revisionId);
      expect(saved.activeStyle.design).toEqual(originalDesign);
      expect(saved.activeStyle.techPack).toMatchObject({
        revisionId: saved.activeStyle.revisionHeadId,
        revisionNumber: original.activeStyle.techPack.revisionNumber + 1,
        approval: { state: "DRAFT", revisionId: null, scopeFieldIds: [], changedBy: null, changedAt: null, manifestId: null },
        cover: { styleCode: {
          value: "TS-767", provenance: "USER_CAPTURED", inheritedFrom: null, method: "Entered by the maker",
          inputRefs: ["maker-notes", "fit-session"], evidenceRefs: ["measurement-photo", "source-document"],
        } },
      });
      expect(state.onStyleLoaded).not.toHaveBeenCalled();
      expect(state.manager).toBe(manager);
      expect(state.host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
    } finally {
      state.close();
    }
  }, 60_000);

  it("discards T01 drafts and blocks backup or freezing until the draft is resolved", async () => {
    const state = await techPackHarness();
    try {
      const { workflow, host, manager } = state;
      const handle = (manager as unknown as {
        handle(action: "discard-tech-pack" | "export-package" | "freeze-outputs"): Promise<void>;
      }).handle.bind(manager);
      const revisionHead = workflow.snapshot.activeStyle.revisionHeadId;

      editT01Field(host, "cover.styleCode", "value", "DRAFT-TO-DISCARD");
      await handle("discard-tech-pack");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved T01 edits were discarded");
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(revisionHead);

      editT01Field(host, "cover.styleCode", "value", "DRAFT-TO-KEEP-LOCAL");
      await handle("export-package");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("before exporting a project backup");
      await handle("freeze-outputs");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("before freezing outputs");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(revisionHead);
      expect(workflow.snapshot.exportManifests).toHaveLength(0);
    } finally {
      state.close();
    }
  }, 20_000);

  it("reports empty and unchanged T01 save requests without adding a revision", async () => {
    const state = await techPackHarness();
    try {
      const { workflow, host, manager } = state;
      const initial = workflow.snapshot;
      const save = vi.spyOn(workflow, "saveActiveTechPack").mockResolvedValue(initial);
      const handle = (manager as unknown as {
        handle(action: "save-tech-pack"): Promise<void>;
      }).handle.bind(manager);

      await handle("save-tech-pack");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("There are no unsaved T01 edits");
      expect(save).not.toHaveBeenCalled();

      editT01Field(host, "cover.styleCode", "value", "UNCHANGED-RESPONSE");
      await handle("save-tech-pack");
      expect(save).toHaveBeenCalledTimes(1);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("No T01 content changed");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(initial.activeStyle.revisionHeadId);
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true);
    } finally {
      state.close();
    }
  }, 20_000);

  it("confirms before leaving a T01 draft and respects the maker's response", async () => {
    let allowDiscard = false;
    const confirm = vi.fn(() => allowDiscard);
    const state = await techPackHarness({ confirm });
    try {
      const { host, manager, workflow } = state;
      const confirmDraftDiscard = (manager as unknown as {
        confirmTechPackDraftDiscard(): boolean;
      }).confirmTechPackDraftDiscard.bind(manager);
      const handle = (manager as unknown as {
        handle(action: "switch-project"): Promise<void>;
      }).handle.bind(manager);
      const revisionHead = workflow.snapshot.activeStyle.revisionHeadId;

      expect(confirmDraftDiscard()).toBe(true);
      expect(confirm).not.toHaveBeenCalled();

      editT01Field(host, "cover.styleCode", "value", "UNSAVED-T01");
      expect(confirmDraftDiscard()).toBe(false);
      await handle("switch-project");
      expect(confirm).toHaveBeenCalledTimes(2);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved T01 edits");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(revisionHead);

      allowDiscard = true;
      await handle("switch-project");
      expect(confirm).toHaveBeenCalledTimes(3);
      expect(host.querySelector("#project-manager-status")?.textContent).toBe("That project is already open.");
      expect(workflow.snapshot.activeStyle.revisionHeadId).toBe(revisionHead);
    } finally {
      state.close();
    }
  }, 20_000);

  it("rejects disconnected T01 controls and collection actions from a stale style draft", async () => {
    const state = await techPackHarness();
    try {
      const { host, manager, workflow } = state;
      const disconnected = document.createElement("input");
      disconnected.dataset.t01Input = "true";
      host.append(disconnected);
      disconnected.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("T01 control is not connected to a record field");
      disconnected.remove();

      const foreignDetails = document.createElement("details");
      host.append(foreignDetails);
      foreignDetails.dispatchEvent(new Event("toggle", { bubbles: true }));
      foreignDetails.remove();

      const missingField = document.createElement("input");
      missingField.dataset.t01Input = "true";
      missingField.dataset.t01FieldId = "missing.field";
      host.append(missingField);
      missingField.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("edited T01 field is not in the current record");
      missingField.remove();

      const nonFiniteNumber = document.createElement("input");
      nonFiniteNumber.type = "number";
      nonFiniteNumber.value = "2";
      nonFiniteNumber.dataset.t01Input = "true";
      nonFiniteNumber.dataset.t01FieldId = "cover.styleCode";
      Object.defineProperty(nonFiniteNumber, "valueAsNumber", { configurable: true, value: Number.NaN });
      host.append(nonFiniteNumber);
      nonFiniteNumber.dispatchEvent(new Event("input", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Enter a finite numeric value");
      nonFiniteNumber.remove();

      editT01Field(host, "cover.styleCode", "value", "OLD-STYLE-DRAFT");
      const previousStyleId = workflow.snapshot.activeStyle.id;
      await workflow.createStyle("Second T01 style", workflow.snapshot.activeStyle.design);
      expect(workflow.snapshot.activeStyle.id).not.toBe(previousStyleId);
      manager.refresh();
      expect(host.querySelector(".t01-editor")).not.toBeNull();
      clickT01Action(host, "add-colorway");
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("belongs to another style. Reload the active project");
      expect(workflow.snapshot.activeStyle.techPack.colorways).toHaveLength(0);
      editT01Field(host, "cover.styleCode", "value", "LATE-OLD-STYLE-INPUT");
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("belongs to another style. Reload the active project");
      expect(workflow.snapshot.activeStyle.techPack.cover.styleCode.value).not.toBe("LATE-OLD-STYLE-INPUT");
    } finally {
      state.close();
    }
  }, 20_000);

  it("adds, explicitly links, and safely removes local T01 material, BOM, colorway, and assignment records", async () => {
    const generatedIds = [
      "80000000-0000-4000-8000-000000000001", // colorway
      "80000000-0000-4000-8000-000000000002", // fabric
      "80000000-0000-4000-8000-000000000003", // trim
      "80000000-0000-4000-8000-000000000004", // BOM row
      "80000000-0000-4000-8000-000000000005", // assignment
      "80000000-0000-4000-8000-000000000006", // second BOM row
      "80000000-0000-4000-8000-000000000007", // second colorway
      "80000000-0000-4000-8000-000000000008", // second colorway assignment
    ];
    const colorwayId = "80000000-0000-4000-8000-000000000001";
    const secondColorwayId = "80000000-0000-4000-8000-000000000007";
    const secondAssignmentId = "80000000-0000-4000-8000-000000000008";
    const state = await techPackHarness({ techPackIdFactory: () => generatedIds.shift()! });
    try {
      const { host, manager, workflow } = state;
      const save = vi.spyOn(workflow, "saveActiveTechPack");
      clickT01Action(host, "add-bom-row", true);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Add a material before adding a BOM row");

      clickT01Action(host, "add-colorway");
      expect(host.querySelector(`[data-t01-colorway="${colorwayId}"]`)).not.toBeNull();
      const addAssignment = host.querySelector<HTMLButtonElement>(
        `[data-t01-colorway="${colorwayId}"] [data-t01-action="add-assignment"]`,
      )!;
      addAssignment.dataset.t01ColorwayId = "missing-colorway";
      addAssignment.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("selected colorway is no longer in this T01 record");
      addAssignment.dataset.t01ColorwayId = colorwayId;
      clickT01Action(host, "add-assignment", true);
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing BOM row and material");

      clickT01Action(host, "add-fabric");
      clickT01Action(host, "add-trim");
      const fabricId = "80000000-0000-4000-8000-000000000002";
      const trimId = "80000000-0000-4000-8000-000000000003";
      expect(host.querySelector(`[data-t01-material="${fabricId}"]`)).not.toBeNull();
      expect(host.querySelector(`[data-t01-material="${trimId}"]`)?.getAttribute("data-t01-material-category")).toBe("trim");

      const unattachedBomAction = document.createElement("button");
      unattachedBomAction.type = "button";
      unattachedBomAction.dataset.t01Action = "add-bom-row";
      host.append(unattachedBomAction);
      unattachedBomAction.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose a material for this BOM row");
      unattachedBomAction.remove();

      const materialCategory = host.querySelector<HTMLSelectElement>(`[data-t01-material-id="${fabricId}"][data-t01-material-field="category"]`)!;
      materialCategory.value = "bad-category";
      materialCategory.dispatchEvent(new Event("change", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose Fabric or Trim");
      await (manager as unknown as {
        handle(action: "save-tech-pack"): Promise<void>;
      }).handle.call(manager, "save-tech-pack");
      expect(save).not.toHaveBeenCalled();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose Fabric or Trim");
      const repairedCategory = host.querySelector<HTMLSelectElement>(`[data-t01-material-id="${fabricId}"][data-t01-material-field="category"]`)!;
      repairedCategory.value = "fabric";
      repairedCategory.dispatchEvent(new Event("change", { bubbles: true }));

      const newBomMaterial = host.querySelector<HTMLSelectElement>("[data-t01-new-bom-material]")!;
      clickT01Action(host, "add-bom-row");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose a material for this BOM row");
      newBomMaterial.value = fabricId;
      clickT01Action(host, "add-bom-row");
      const rowId = "80000000-0000-4000-8000-000000000004";
      expect(host.querySelector(`[data-t01-bom-row="${rowId}"]`)).not.toBeNull();

      host.querySelector<HTMLSelectElement>(`[data-t01-colorway="${colorwayId}"] [data-t01-new-assignment-row]`)!.value = rowId;
      host.querySelector<HTMLSelectElement>(`[data-t01-colorway="${colorwayId}"] [data-t01-new-assignment-material]`)!.value = fabricId;
      clickT01Action(host, "add-assignment");
      const assignmentId = "80000000-0000-4000-8000-000000000005";
      expect(host.querySelector(`[data-t01-assignment="${assignmentId}"]`)).not.toBeNull();
      expect(host.querySelector(`[data-t01-assignment="${assignmentId}"]`)?.getAttribute("data-t01-assignment-bom-row")).toBe(rowId);
      host.querySelector<HTMLSelectElement>(`[data-t01-colorway="${colorwayId}"] [data-t01-new-assignment-row]`)!.value = rowId;
      host.querySelector<HTMLSelectElement>(`[data-t01-colorway="${colorwayId}"] [data-t01-new-assignment-material]`)!.value = fabricId;
      clickT01Action(host, "add-assignment");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("already has an assignment for that BOM row");
      expect(host.querySelectorAll(`[data-t01-assignment="${assignmentId}"]`)).toHaveLength(1);

      const secondBomMaterial = host.querySelector<HTMLSelectElement>("[data-t01-new-bom-material]")!;
      secondBomMaterial.value = trimId;
      clickT01Action(host, "add-bom-row");
      const secondRowId = "80000000-0000-4000-8000-000000000006";
      expect(host.querySelector(`[data-t01-bom-row="${secondRowId}"]`)).not.toBeNull();
      clickT01Action(host, "add-colorway");
      expect(host.querySelector(`[data-t01-colorway="${secondColorwayId}"]`)).not.toBeNull();
      const unattachedAssignmentAction = document.createElement("button");
      unattachedAssignmentAction.type = "button";
      unattachedAssignmentAction.dataset.t01Action = "add-assignment";
      unattachedAssignmentAction.dataset.t01ColorwayId = secondColorwayId;
      host.append(unattachedAssignmentAction);
      unattachedAssignmentAction.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an existing BOM row and material");
      unattachedAssignmentAction.remove();
      const secondColorway = host.querySelector(`[data-t01-colorway="${secondColorwayId}"]`)!;
      secondColorway.querySelector<HTMLSelectElement>("[data-t01-new-assignment-row]")!.value = secondRowId;
      secondColorway.querySelector<HTMLSelectElement>("[data-t01-new-assignment-material]")!.value = fabricId;
      secondColorway.querySelector<HTMLButtonElement>('[data-t01-action="add-assignment"]')!.click();
      expect(host.querySelector(`[data-t01-assignment="${secondAssignmentId}"]`)).not.toBeNull();
      const secondRowMaterial = host.querySelector<HTMLSelectElement>(
        `[data-t01-bom-field="materialId"][data-t01-bom-row-id="${secondRowId}"]`,
      )!;
      secondRowMaterial.value = fabricId;
      secondRowMaterial.dispatchEvent(new Event("change", { bubbles: true }));
      expect(secondRowMaterial.value).toBe(fabricId);
      secondRowMaterial.value = trimId;
      secondRowMaterial.dispatchEvent(new Event("change", { bubbles: true }));
      const assignmentRow = host.querySelector<HTMLSelectElement>(
        `[data-t01-assignment-field="bomRowId"][data-t01-assignment-id="${assignmentId}"]`,
      )!;
      assignmentRow.value = secondRowId;
      assignmentRow.dispatchEvent(new Event("change", { bubbles: true }));
      expect(assignmentRow.value).toBe(secondRowId);
      assignmentRow.value = rowId;
      assignmentRow.dispatchEvent(new Event("change", { bubbles: true }));
      const assignmentMaterial = host.querySelector<HTMLSelectElement>(
        `[data-t01-assignment-field="materialId"][data-t01-assignment-id="${assignmentId}"]`,
      )!;
      assignmentMaterial.value = trimId;
      assignmentMaterial.dispatchEvent(new Event("change", { bubbles: true }));
      expect(assignmentMaterial.value).toBe(trimId);
      assignmentMaterial.value = fabricId;
      assignmentMaterial.dispatchEvent(new Event("change", { bubbles: true }));

      const unsupportedAssignmentField = document.createElement("select");
      unsupportedAssignmentField.dataset.t01Input = "true";
      unsupportedAssignmentField.dataset.t01AssignmentField = "unsupported";
      unsupportedAssignmentField.dataset.t01AssignmentId = assignmentId;
      host.append(unsupportedAssignmentField);
      unsupportedAssignmentField.dispatchEvent(new Event("change", { bubbles: true }));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("colorway assignment field is unsupported");
      unsupportedAssignmentField.remove();
      assignmentMaterial.dispatchEvent(new Event("change", { bubbles: true }));

      editT01Field(host, `material.${fabricId}.unitCost`, "value", "2.75");
      editT01Field(host, `material.${fabricId}.currency`, "value", "USD");
      editT01Field(host, `material.${fabricId}.costBasis`, "value", "per metre");
      editT01Field(host, `material.${fabricId}.weight`, "unit", "g/m²");
      editT01Field(host, `bom.${rowId}.quantity`, "value", "3.5");
      editT01Field(host, `bom.${rowId}.quantityBasis`, "value", "per-garment");
      const unitCost = host.querySelector<HTMLInputElement>(`[data-t01-field-id="material.${fabricId}.unitCost"][data-t01-field-property="value"]`);
      const currency = host.querySelector<HTMLInputElement>(`[data-t01-field-id="material.${fabricId}.currency"][data-t01-field-property="value"]`);
      const costBasis = host.querySelector<HTMLInputElement>(`[data-t01-field-id="material.${fabricId}.costBasis"][data-t01-field-property="value"]`);
      const quantity = host.querySelector<HTMLInputElement>(`[data-t01-field-id="bom.${rowId}.quantity"][data-t01-field-property="value"]`);
      const quantityBasis = host.querySelector<HTMLInputElement>(`[data-t01-field-id="bom.${rowId}.quantityBasis"][data-t01-field-property="value"]`);
      expect(unitCost?.value).toBe("2.75");
      expect(currency?.value).toBe("USD");
      expect(costBasis?.value).toBe("per metre");
      expect(host.querySelector<HTMLInputElement>(
        `[data-t01-field-id="material.${fabricId}.weight"][data-t01-field-property="unit"]`,
      )?.value).toBe("g/m²");
      expect(quantity?.value).toBe("3.5");
      expect(quantityBasis?.value).toBe("per-garment");
      expect(host.querySelector("[data-t01-total]")).toBeNull();

      const requiredness = host.querySelector<HTMLSelectElement>(`[data-t01-bom-field="requiredness"][data-t01-bom-row-id="${rowId}"]`)!;
      requiredness.value = "false";
      requiredness.dispatchEvent(new Event("change", { bubbles: true }));
      requiredness.value = "";
      requiredness.dispatchEvent(new Event("change", { bubbles: true }));
      editT01Field(host, `material.${fabricId}.weight`, "value", "");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Unsaved T01 edits");

      const removeFabric = host.querySelector<HTMLButtonElement>(
        `[data-t01-material="${fabricId}"] [data-t01-action="remove-material"]`,
      )!;
      removeFabric.dataset.t01MaterialId = "missing-material";
      removeFabric.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("selected material is missing");
      expect(host.querySelector(`[data-t01-material="${fabricId}"]`)).not.toBeNull();
      removeFabric.dataset.t01MaterialId = fabricId;
      removeFabric.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Reassign or remove BOM rows");
      const removeBomRow = host.querySelector<HTMLButtonElement>(
        `[data-t01-bom-row="${rowId}"] [data-t01-action="remove-bom-row"]`,
      )!;
      removeBomRow.dataset.t01BomRowId = "missing-bom-row";
      removeBomRow.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("selected BOM row is missing");
      expect(host.querySelector(`[data-t01-bom-row="${rowId}"]`)).not.toBeNull();
      removeBomRow.dataset.t01BomRowId = rowId;
      removeBomRow.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Remove colorway assignments");
      host.querySelector<HTMLButtonElement>(
        `[data-t01-assignment="${secondAssignmentId}"] [data-t01-action="remove-assignment"]`,
      )!.click();
      expect(host.querySelector(`[data-t01-assignment="${secondAssignmentId}"]`)).toBeNull();
      const removeAssignment = host.querySelector<HTMLButtonElement>(
        `[data-t01-assignment="${assignmentId}"] [data-t01-action="remove-assignment"]`,
      )!;
      removeAssignment.dataset.t01AssignmentId = "missing-assignment";
      removeAssignment.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("selected colorway assignment is missing");
      expect(host.querySelector(`[data-t01-assignment="${assignmentId}"]`)).not.toBeNull();
      removeAssignment.dataset.t01AssignmentId = assignmentId;
      removeAssignment.click();
      expect(host.querySelector(`[data-t01-assignment="${assignmentId}"]`)).toBeNull();
      clickT01Action(host, "remove-bom-row");
      expect(host.querySelector(`[data-t01-bom-row="${rowId}"]`)).toBeNull();
      clickT01Action(host, "remove-bom-row");
      expect(host.querySelector(`[data-t01-bom-row="${secondRowId}"]`)).toBeNull();
      clickT01Action(host, "remove-material");
      expect(host.querySelector(`[data-t01-material="${fabricId}"]`)).toBeNull();
      clickT01Action(host, "remove-material");
      expect(host.querySelector(`[data-t01-material="${trimId}"]`)).toBeNull();
      const removeColorway = host.querySelector<HTMLButtonElement>(
        `[data-t01-colorway="${colorwayId}"] [data-t01-action="remove-colorway"]`,
      )!;
      removeColorway.dataset.t01ColorwayId = "missing-colorway";
      removeColorway.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("selected colorway is missing");
      expect(host.querySelector(`[data-t01-colorway="${colorwayId}"]`)).not.toBeNull();
      removeColorway.dataset.t01ColorwayId = colorwayId;
      removeColorway.click();
      expect(host.querySelector(`[data-t01-colorway="${colorwayId}"]`)).toBeNull();

      const unsupportedAction = document.createElement("button");
      unsupportedAction.type = "button";
      unsupportedAction.dataset.t01Action = "unsupported-action";
      host.append(unsupportedAction);
      unsupportedAction.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toBe("That T01 collection action is not supported.");
    } finally {
      state.close();
    }
  });

  it("uses secure browser IDs as a fallback and rejects an empty generated ID", async () => {
    const browserId = "90000000-0000-4000-8000-000000000001";
    vi.stubGlobal("crypto", { randomUUID: () => browserId });
    try {
      const fallback = await techPackHarness();
      try {
        clickT01Action(fallback.host, "add-colorway");
        expect(fallback.host.querySelector(`[data-t01-colorway="${browserId}"]`)).not.toBeNull();
      } finally {
        fallback.close();
      }
    } finally {
      vi.unstubAllGlobals();
    }

    const rejected = await techPackHarness({ techPackIdFactory: () => "" });
    try {
      const action = document.createElement("button");
      action.dataset.t01Action = "add-colorway";
      expect(() => (rejected.manager as unknown as {
        handleTechPackAction(target: HTMLElement): void;
      }).handleTechPackAction(action)).toThrow("Secure local IDs are unavailable");
      expect(rejected.workflow.snapshot.activeStyle.techPack.colorways).toHaveLength(0);
    } finally {
      rejected.close();
    }
  }, 15_000);

  it("uses the exact legacy project message by default and the clearer local-storage message when enabled", () => {
    const legacy = harness();
    const clarity = harness("Project data is stored locally on this device.");
    try {
      expect(legacy.host.querySelector<HTMLElement>("#project-manager-status")?.textContent)
        .toBe("Saved project is ready on this device.");
      expect(clarity.host.querySelector<HTMLElement>("#project-manager-status")?.textContent)
        .toBe("Project data is stored locally on this device.");
    } finally {
      legacy.host.remove();
      clarity.host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
    }
  });

  it("maps absent and present style recovery to the runtime payload consistently", () => {
    const loaded = loadedProject();
    expect(recoveryPayloadOrNull(loaded)).toBeNull();
    expect(recoveryPayloadOrNull({
      ...loaded,
      activeRecovery: { schemaVersion: 2, styleId: STYLE_ID, payload: { fabric: "#123456" } } as NonNullable<LoadedProject["activeRecovery"]>,
    })).toEqual({ fabric: "#123456" });
  });

  it("shows an actionable existing freeze blocker without enabling output capture", async () => {
    const { host, manager, setUnsavedChanges } = harness(undefined, () => "Review the approved plan first.");
    try {
      (manager as unknown as { busy: boolean }).busy = true;
      (manager as unknown as { updateTechPackStatus(message: string): void }).updateTechPackStatus("Working locally.");
      expect(host.querySelector("#project-freeze-guidance")?.textContent).toBe("");
      (manager as unknown as { busy: boolean }).busy = false;
      setUnsavedChanges(false);
      manager.refresh();
      expect(host.querySelector("#project-freeze-guidance")?.textContent)
        .toBe("Review the approved plan first.");
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")?.disabled).toBe(true);
    } finally {
      host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
    }

    const getFreezeBlocker = vi.fn(() => null);
    const ready = await techPackHarness({ getFreezeBlocker });
    try {
      (ready.manager as unknown as { updateTechPackStatus(message: string): void }).updateTechPackStatus("Ready.");
      expect(ready.host.querySelector("#project-manager-status")?.textContent).toBe("Ready.");
      expect(getFreezeBlocker).toHaveBeenCalled();
      expect(ready.host.querySelector("#project-freeze-guidance")?.textContent).toBe("");
      expect(ready.host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")?.disabled).toBe(false);
    } finally {
      ready.close();
    }

    const needsReview = await techPackHarness({ canFreezeOutputs: () => false, getFreezeBlocker: () => null });
    try {
      (needsReview.manager as unknown as { updateTechPackStatus(message: string): void }).updateTechPackStatus("Review needed.");
      expect(needsReview.host.querySelector("#project-freeze-guidance")?.textContent)
        .toBe("Review Style and Check, resolve digital blockers, and make sure the current style is saved before freezing outputs.");
      expect(needsReview.host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")?.disabled).toBe(true);
    } finally {
      needsReview.close();
    }
  });

  it("labels unmatched frozen revisions as historical and forwards restore recovery to the editor", async () => {
    const rendered = harness();
    try {
      const snapshot = loadedProject();
      const knownRevisionId = "77777777-7777-4777-8777-777777777777";
      rendered.setSnapshot({
        ...snapshot,
        styleRevisions: [{
          revisionId: knownRevisionId,
          styleId: STYLE_ID,
          revisionNumber: 7,
          createdAt: TIME,
          parentRevisionId: null,
          revisionContentDigest: "c".repeat(64),
        } as unknown as LoadedProject["styleRevisions"][number]],
        exportManifests: [
          {
            manifestId: "33333333-3333-4333-8333-333333333333",
            styleId: STYLE_ID,
            revisionId: "44444444-4444-4444-8444-444444444444",
            capturedAt: TIME,
            packetDigest: "a".repeat(64),
            payload: { revisionId: "44444444-4444-4444-8444-444444444444" },
            artifacts: [{ artifactId: "selected-size-svg", displayName: "old.svg", byteLength: 8, sha256: "b".repeat(64) }],
          } as unknown as LoadedProject["exportManifests"][number],
          {
            manifestId: "88888888-8888-4888-8888-888888888888",
            styleId: STYLE_ID,
            revisionId: knownRevisionId,
            capturedAt: TIME,
            packetDigest: "d".repeat(64),
            payload: { revisionId: knownRevisionId },
            artifacts: [{ artifactId: "selected-size-svg", displayName: "captured.svg", byteLength: 10, sha256: "e".repeat(64) }],
          } as unknown as LoadedProject["exportManifests"][number],
        ],
      });
      rendered.manager.refresh();
      expect(rendered.host.querySelector(".project-revision-history")?.textContent)
        .toContain("Historical r7 · stale for current revision");
    } finally {
      rendered.host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
    }

    const restoredManager = harness();
    try {
      restoredManager.setUnsavedChanges(false);
      const base = loadedProject();
      const loaded: LoadedProject = {
        ...base,
        activeStyle: { ...base.activeStyle, revisionHeadId: "55555555-5555-4555-8555-555555555555" },
        activeRecovery: {
          schemaVersion: 2,
          styleId: STYLE_ID,
          payload: { fabric: "#123456" },
        } as LoadedProject["activeRecovery"],
        styleRevisions: [],
      };
      const workflow = restoredManager.workflow as unknown as {
        restoreStyleRevision: (revisionId: string) => Promise<LoadedProject>;
      };
      workflow.restoreStyleRevision = vi.fn(async () => loaded);
      const target = document.createElement("button");
      target.dataset.revisionId = "66666666-6666-4666-8666-666666666666";
      await (restoredManager.manager as unknown as {
        handle(action: string, styleId?: string, target?: HTMLElement | null): Promise<void>;
      }).handle("restore-revision", undefined, target);
      expect(restoredManager.onStyleLoaded).toHaveBeenCalledWith(loaded, { fabric: "#123456" });
      expect(restoredManager.host.querySelector("#project-manager-status")?.textContent).toContain("Restored revision as rnew.");
    } finally {
      restoredManager.host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
    }
  });

  it("compares and restores immutable revisions, freezes all seven exact outputs, and retrieves stored bytes", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const projectId = "11111111-1111-4111-8111-111111111111";
    const styleId = "22222222-2222-4222-8222-222222222222";
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `project-revision-ui-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: { getItem: () => null },
      idFactory: (() => {
        const ids = [projectId, styleId];
        return () => ids.shift() ?? "33333333-3333-4333-8333-333333333333";
      })(),
      now: () => TIME,
    });
    const host = document.createElement("div");
    document.body.append(host);
    const onStyleLoaded = vi.fn();
    const downloaded: Array<{ filename: string; content: string }> = [];
    let unsaved = false;
    let permitDownload = true;
    const allArtifacts = [
      ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
      ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
      ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
    ] as const;
    const manager = new ProjectManager({
      host,
      workflow,
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => unsaved,
      onStyleLoaded,
      setBusy: vi.fn(),
      confirm: () => false,
      canFreezeOutputs: () => true,
      getFrozenOutputSet: () => ({
        selectedSizes: [{ sizeId: "tee-step-1", label: "S" }],
        artifacts: allArtifacts.map(([artifactId, extension]) => ({
          artifactId,
          extension,
          displayName: artifactId === "selected-size-svg" ? "../unsafe.svg" : `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: `frozen:${artifactId}`,
        })),
      }),
      saveFrozenArtifact: async (filename, bytes) => {
        downloaded.push({ filename, content: await bytes.text() });
        return permitDownload;
      },
    });
    try {
      const firstRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      const changed = {
        ...workflow.snapshot.activeStyle.design,
        measurements: { ...workflow.snapshot.activeStyle.design.measurements, chest: workflow.snapshot.activeStyle.design.measurements.chest + 5 },
      };
      await workflow.saveActiveDesign(changed);
      manager.refresh();
      const secondRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      expect(secondRevisionId).not.toBe(firstRevisionId);
      expect(workflow.compareStyleRevisions(firstRevisionId, secondRevisionId)).toContain("design.measurements.chest");
      host.querySelector<HTMLSelectElement>("#revision-left")!.value = firstRevisionId;
      host.querySelector<HTMLSelectElement>("#revision-left")!.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLSelectElement>("#revision-right")!.value = secondRevisionId;
      host.querySelector<HTMLSelectElement>("#revision-right")!.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLButtonElement>("[data-project-action='compare-revisions']")!.click();
      expect(host.querySelector(".project-revision-comparison")?.textContent).toContain("design.measurements.chest");
      expect(host.querySelector(".project-revision-comparison")?.textContent).toContain("fieldObservations");

      const restore = host.querySelector<HTMLButtonElement>(`[data-project-action='restore-revision'][data-revision-id='${firstRevisionId}']`)!;
      restore.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Restored revision as r3"));
      expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(STANDARD_M.chest);
      expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(firstRevisionId);
      expect(workflow.snapshot.styleRevisions).toHaveLength(3);
      expect(onStyleLoaded).toHaveBeenCalledOnce();

      host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Frozen 7 outputs"));
      expect(workflow.snapshot.exportManifests).toHaveLength(1);
      expect(workflow.snapshot.exportManifests[0]?.artifacts).toHaveLength(7);
      const frozen = workflow.snapshot.exportManifests[0]!;
      const selectedSvg = frozen.artifacts.find((artifact) => artifact.artifactId === "selected-size-svg")!;
      host.querySelector<HTMLButtonElement>(`[data-project-action='download-frozen'][data-manifest-id='${frozen.manifestId}'][data-artifact-id='selected-size-svg']`)!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Downloaded stored bytes"));
      expect(downloaded).toEqual([{ filename: "..-unsafe.svg", content: "frozen:selected-size-svg" }]);
      expect(selectedSvg.bytes.size).toBe(new TextEncoder().encode("frozen:selected-size-svg").byteLength);

      permitDownload = false;
      host.querySelector<HTMLButtonElement>(`[data-project-action='download-frozen'][data-manifest-id='${frozen.manifestId}'][data-artifact-id='selected-size-dxf']`)!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Download canceled"));

      unsaved = true;
      manager.refresh();
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")?.disabled).toBe(true);
      await (manager as unknown as { freezeOutputs(): Promise<void> }).freezeOutputs();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save the current style");
      host.querySelector<HTMLButtonElement>(`[data-project-action='restore-revision'][data-revision-id='${firstRevisionId}']`)!.click();
      expect(workflow.snapshot.styleRevisions).toHaveLength(3);
      expect(host.querySelector("#project-manager-status")?.textContent).not.toContain("Restoring immutable revision");
    } finally {
      workflow.close();
      host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
      vi.unstubAllGlobals();
    }
  });

  it("reports missing revision and frozen-file identities and blocks captures without a ready output set", async () => {
    const { host, manager, workflow, setUnsavedChanges } = harness();
    setUnsavedChanges(false);
    manager.refresh();
    expect(host.querySelector("#project-freeze-guidance")?.textContent).toContain("Review Style and Check");
    await (manager as unknown as { freezeOutputs(): Promise<void> }).freezeOutputs();
    expect(host.querySelector("#project-manager-status")?.textContent).toContain("not ready");
    expect(workflow.snapshot.activeStyle.revisionHeadId).toBeNull();
    const missingRevision = document.createElement("button");
    missingRevision.dataset.projectAction = "restore-revision";
    host.append(missingRevision);
    missingRevision.click();
    expect(host.querySelector("#project-manager-status")?.textContent).toContain("missing its identity");
    const missingArtifact = document.createElement("button");
    missingArtifact.dataset.projectAction = "download-frozen";
    missingArtifact.dataset.manifestId = "missing";
    host.append(missingArtifact);
    missingArtifact.click();
    expect(host.querySelector("#project-manager-status")?.textContent).toContain("missing its identity");
  });

  it("handles identical and failed comparisons, then browser-downloads the stored frozen bytes", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const projectId = "11111111-1111-4111-8111-111111111111";
    const styleId = "22222222-2222-4222-8222-222222222222";
    const ids = [projectId, styleId];
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `project-revision-browser-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: { getItem: () => null },
      idFactory: () => ids.shift() ?? "33333333-3333-4333-8333-333333333333",
      now: () => TIME,
    });
    const host = document.createElement("div");
    document.body.append(host);
    const manager = new ProjectManager({
      host,
      workflow,
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
      canFreezeOutputs: () => true,
      getFrozenOutputSet: () => ({
        selectedSizes: [{ sizeId: "tee-step-1", label: "M" }],
        artifacts: [
          ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
          ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
          ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
        ].map(([artifactId, extension]) => ({
          artifactId: artifactId!, extension: extension!, displayName: `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: `frozen:${artifactId}`,
        })),
      }),
    });
    try {
      const firstRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      await workflow.saveActiveDesign({
        ...workflow.snapshot.activeStyle.design,
        measurements: { ...workflow.snapshot.activeStyle.design.measurements, chest: workflow.snapshot.activeStyle.design.measurements.chest + 1 },
      });
      manager.refresh();
      const left = host.querySelector<HTMLSelectElement>("#revision-left")!;
      const right = host.querySelector<HTMLSelectElement>("#revision-right")!;
      left.value = firstRevisionId;
      right.value = firstRevisionId;
      const compare = host.querySelector<HTMLButtonElement>("[data-project-action='compare-revisions']")!;
      compare.disabled = false;
      compare.click();
      expect(host.querySelector(".project-revision-comparison")?.textContent)
        .toBe("The saved design and field history are identical.");

      host.querySelector("#revision-left")?.remove();
      host.querySelector("#revision-right")?.remove();
      host.querySelector("[data-project-action='compare-revisions']")?.remove();
      const fallbackCompare = document.createElement("button");
      fallbackCompare.dataset.projectAction = "compare-revisions";
      host.append(fallbackCompare);
      fallbackCompare.click();
      expect(host.querySelector(".project-revision-comparison")?.textContent)
        .toBe("The saved design and field history are identical.");

      vi.spyOn(workflow, "compareStyleRevisions").mockImplementation(() => { throw new Error("comparison source failed"); });
      host.querySelector("[data-project-action='compare-revisions']")!.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
      expect(host.querySelector(".project-revision-comparison")?.textContent).toBe("comparison source failed");

      await (manager as unknown as { freezeOutputs(): Promise<void> }).freezeOutputs();
      const manifest = workflow.snapshot.exportManifests[0]!;
      const artifact = manifest.artifacts[0]!;
      vi.spyOn(workflow, "readFrozenArtifact").mockResolvedValue({
        manifest,
        artifact: { ...artifact, displayName: "", bytes: artifact.bytes },
      });
      const urlApi = { createObjectURL: vi.fn(() => "blob:frozen-output"), revokeObjectURL: vi.fn() };
      vi.stubGlobal("URL", urlApi);
      const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
      const download = document.createElement("button");
      download.dataset.projectAction = "download-frozen";
      download.dataset.manifestId = manifest.manifestId;
      download.dataset.artifactId = artifact.artifactId;
      host.append(download);
      download.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Downloaded stored bytes for frozen-output"));
      expect(urlApi.createObjectURL).toHaveBeenCalledOnce();
      expect(anchorClick).toHaveBeenCalledOnce();
    } finally {
      workflow.close();
      host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
      vi.unstubAllGlobals();
    }
  });

  it("creates, duplicates, renames, switches, archives, and restores styles", async () => {
    const { host, workflow, setBusy, onStyleLoaded, setUnsavedChanges, setSnapshot, manager } = harness();
    expect(host.textContent).toContain("Current style: Untitled tee");
    expect(host.querySelectorAll("[data-project-action='switch']")).toHaveLength(2);
    expect(host.textContent).toContain("No archived styles.");
    host.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;

    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "A <bright> & \"bold\" 'look'";
    host.querySelector<HTMLInputElement>("#project-style-name")!.dispatchEvent(new Event("input", { bubbles: true }));
    manager.refresh("Refreshing local project list.");
    expect(host.querySelector<HTMLInputElement>("#project-style-name")?.value).toBe("A <bright> & \"bold\" 'look'");
    await clickAndSettle(host, "[data-project-action='create']");
    expect(workflow.createStyle).toHaveBeenCalledWith("A <bright> & \"bold\" 'look'", expect.any(Object), "first-run-default");
    const escapedArchiveButtons = [...host.querySelectorAll<HTMLButtonElement>("button[aria-label^='Archive A']")];
    expect(escapedArchiveButtons[escapedArchiveButtons.length - 1]?.getAttribute("aria-label"))
      .toBe(`Archive A <bright> & "bold" 'look'`);
    expect(host.querySelector<HTMLDetailsElement>(".project-manager-details")!.open).toBe(true);
    expect(onStyleLoaded).toHaveBeenCalledOnce();
    expect(setBusy).toHaveBeenNthCalledWith(1, true);
    expect(setBusy).toHaveBeenNthCalledWith(2, false);

    await clickAndSettle(host, "[data-project-action='duplicate']");
    expect(workflow.createStyle).toHaveBeenLastCalledWith("Copy of A <bright> & \"bold\" 'look'", expect.any(Object), "copied-style");
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Renamed";
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(workflow.renameActiveStyle).toHaveBeenCalledWith("Renamed");
    await clickAndSettle(host, "[data-project-action='reload']");
    expect(workflow.reload).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("latest stored project version is now loaded");
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    expect(workflow.switchStyle).toHaveBeenCalledWith(STYLE_ID);
    expect(host.textContent).toContain("latest stored version remains available");
    const second = workflow.snapshot.styles.find((style) => style.id === STYLE_TWO_ID)!;
    const noRecoveryReload = {
      ...workflow.snapshot,
      project: { ...workflow.snapshot.project, activeStyleId: STYLE_TWO_ID },
      activeStyle: second,
      activeRecovery: null,
    } as LoadedProject;
    setUnsavedChanges(false);
    setSnapshot(noRecoveryReload);
    vi.mocked(workflow.reload).mockResolvedValueOnce(noRecoveryReload);
    await clickAndSettle(host, "[data-project-action='reload']");
    expect(onStyleLoaded).toHaveBeenLastCalledWith(noRecoveryReload, null);
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    expect(workflow.switchStyle).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Switched to Untitled tee.");
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_TWO_ID}']`);
    expect(onStyleLoaded).toHaveBeenLastCalledWith(
      expect.objectContaining({ activeStyle: expect.objectContaining({ id: STYLE_TWO_ID }) }), {},
    );
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    await clickAndSettle(host, `[data-project-action='archive'][data-style-id='${STYLE_TWO_ID}']`);
    expect(workflow.archiveStyle).toHaveBeenCalledWith(STYLE_TWO_ID);
    expect(host.textContent).toContain("Archived style.");
    expect(host.textContent).toContain("Archived styles");
    await clickAndSettle(host, `[data-project-action='restore'][data-style-id='${STYLE_TWO_ID}']`);
    expect(workflow.restoreStyle).toHaveBeenCalledWith(STYLE_TWO_ID);
    expect(host.textContent).toContain("Restored style.");

    const archivedSnapshot = loadedProject();
    const archivedStyle = { ...archivedSnapshot.styles[1], archivedAt: TIME };
    setSnapshot({ ...archivedSnapshot, styles: [archivedSnapshot.styles[0], archivedStyle] });
    manager.refresh();
    const namedRestore = loadedProject();
    vi.mocked(workflow.restoreStyle).mockResolvedValueOnce(namedRestore);
    await clickAndSettle(host, `[data-project-action='restore'][data-style-id='${STYLE_TWO_ID}']`);
    expect(host.textContent).toContain("Restored Second style.");

    setSnapshot(loadedProject());
    manager.refresh();
    vi.mocked(workflow.archiveStyle).mockResolvedValueOnce(loadedProject());
    await clickAndSettle(host, `[data-project-action='archive'][data-style-id='${STYLE_TWO_ID}']`);
    expect(host.textContent).toContain("Archived Second style.");
    expect(onStyleLoaded).toHaveBeenCalledTimes(8);
  }, 30_000);

  it("exports, imports a clean-profile package, handles idempotency/copy conflicts, and switches projects", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("File", NodeFile);
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const localProjectId = "11111111-1111-4111-8111-111111111111";
    const localStyleId = "22222222-2222-4222-8222-222222222222";
    const sourceProjectId = "33333333-3333-4333-8333-333333333333";
    const sourceStyleId = "44444444-4444-4444-8444-444444444444";
    const copiedProjectId = "55555555-5555-4555-8555-555555555555";
    const copiedStyleId = "66666666-6666-4666-8666-666666666666";
    const assetId = "local-1234567890abcdef1234567890abcdef-svg";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
    const surface = { "tee/Untitled tee": { styleName: "Untitled tee", placements: [{
      id: "front-mark", kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
      transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Studio mark", assetId,
    }] } };
    const source = migrateLegacySaveFile({
      json: serialize(STANDARD_M, "#3A4150", {}, undefined, undefined, surface),
      projectId: sourceProjectId, styleId: sourceStyleId, migratedAt: TIME, projectName: "Imported / Source",
    });
    if (!source.ok) throw new Error(source.error);
    const sourceAssets = new Map<string, StoredArtworkAsset>([[assetId, {
      assetId, name: "mark.svg", mimeType: "image/svg+xml", blob: new NodeBlob([svg], { type: "image/svg+xml" }),
    } as unknown as StoredArtworkAsset]]);
    const artworkStore: ArtworkAssetStore = {
      async put(asset) { if (sourceAssets.has(asset.assetId)) throw new Error("Artwork already exists."); sourceAssets.set(asset.assetId, asset); },
      async get(id) { return sourceAssets.get(id) ?? null; },
      async remove(id) { sourceAssets.delete(id); },
    };
    const sourcePackage = await createProjectPackage({ project: source.value.project, styles: [source.value.style], recoveries: [] }, artworkStore, {
      crypto: webcrypto as unknown as Crypto,
    });
    const inputFile = async (blob: Blob, name: string): Promise<File> => new NodeFile([await blob.arrayBuffer()], name, { type: "application/zip" }) as unknown as File;
    const setFile = (host: HTMLElement, file: File): void => {
      const input = host.querySelector<HTMLInputElement>("#project-package-file")!;
      Object.defineProperty(input, "files", { configurable: true, value: [file] });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const idValues = [localProjectId, localStyleId];
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: `project-manager-package-${Date.now()}`, factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: localStorage,
      idFactory: () => idValues.shift() ?? "77777777-7777-4777-8777-777777777777",
      now: () => TIME,
      artworkStore,
    });
    const host = document.createElement("div");
    document.body.append(host);
    const savedPackages: Array<{ filename: string; blob: Blob }> = [];
    const copyIds = ["77777777-7777-4777-8777-777777777777", copiedProjectId, copiedStyleId];
    let permitCopy = false;
    let unsaved = false;
    const confirm = vi.fn(() => permitCopy);
    const onStyleLoaded = vi.fn();
    const flushPendingFieldObservations = vi.fn(async () => undefined);
    const manager = new ProjectManager({
      host, workflow, artworkStore,
      inspectAsset: async (file) => ({ name: file.name, mimeType: "image/svg+xml", blob: file }),
      savePackage: async (filename, blob) => { savedPackages.push({ filename, blob }); return savedPackages.length > 1; },
      confirm,
      packageOptions: { now: () => TIME, idFactory: () => copyIds.shift() ?? "77777777-7777-4777-8777-777777777777" },
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => unsaved,
      onStyleLoaded,
      setBusy: vi.fn(),
      flushPendingFieldObservations,
      hasPendingFieldObservations: () => true,
    });
    try {
      setFile(host, await inputFile(sourcePackage, "source.infinidrip.zip"));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Imported project: Imported / Source"));
      expect(flushPendingFieldObservations).toHaveBeenCalled();
      expect(workflow.snapshot.project.id).toBe(sourceProjectId);
      expect(onStyleLoaded).toHaveBeenLastCalledWith(
        expect.objectContaining({ project: expect.objectContaining({ id: sourceProjectId }), activeRecovery: null }), null,
      );
      expect(sourceAssets.has(assetId)).toBe(true);

      setFile(host, await inputFile(sourcePackage, "source.infinidrip.zip"));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("already imported"));

      await workflow.renameActiveStyle("Revised source style");
      manager.refresh();
      host.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Backup export canceled"));
      expect(savedPackages[0]!.filename).toMatch(/\.infinidrip\.zip$/);
      host.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Project backup exported"));
      const conflictPackage = savedPackages[1]!.blob;
      const validArchive = await readProjectPackage(conflictPackage, { crypto: webcrypto as unknown as Crypto });
      expect(validArchive.manifest.styles[0]?.name).toBe("Revised source style");

      permitCopy = false;
      setFile(host, await inputFile(conflictPackage, "conflict.infinidrip.zip"));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("import canceled"));
      expect(workflow.snapshot.project.id).toBe(sourceProjectId);

      permitCopy = true;
      setFile(host, await inputFile(conflictPackage, "conflict.infinidrip.zip"));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Imported a separate copy"));
      expect(workflow.snapshot.project.id).toBe(copiedProjectId);
      expect(workflow.snapshot.project.importedFrom).toMatchObject({ projectId: sourceProjectId, styleIds: [sourceStyleId] });
      expect(await workflow.repository.listProjects()).toHaveLength(3);

      setFile(host, await inputFile(conflictPackage, "conflict.infinidrip.zip"));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("already imported"));

      host.querySelector<HTMLDetailsElement>(".project-manager-details")!.querySelector("summary")!.click();
      await vi.waitFor(() => expect(host.querySelector(".project-collection-editor")).not.toBeNull());
      clickCollectionAction(host, "add-collection");
      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Switch draft only");
      unsaved = false;
      permitCopy = false;
      confirm.mockClear();
      host.querySelector<HTMLSelectElement>("#project-select")!.value = localProjectId;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Switching projects will discard unsaved collection edits")));
      expect(workflow.snapshot.project.id).toBe(copiedProjectId);
      expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Switch draft only");
      permitCopy = true;
      confirm.mockClear();
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.project.id).toBe(localProjectId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Opened My designs");
      expect(workflow.snapshot.project.id).toBe(localProjectId);
      expect(host.querySelector('[data-ce-scope="collection"][data-ce-field="name"]')).toBeNull();

      unsaved = true;
      permitCopy = false;
      confirm.mockClear();
      host.querySelector<HTMLSelectElement>("#project-select")!.value = copiedProjectId;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.stringContaining("This design has unsaved edits")));
      expect(workflow.snapshot.project.id).toBe(localProjectId);
      permitCopy = true;
      confirm.mockClear();
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.project.id).toBe(copiedProjectId));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Opened");
      expect(workflow.snapshot.project.id).toBe(copiedProjectId);

      unsaved = false;
      host.querySelector<HTMLSelectElement>("#project-select")!.value = localProjectId;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Opened My designs"));
      host.querySelector<HTMLSelectElement>("#project-select")!.value = localProjectId;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("already open"));
    } finally {
      workflow.close();
      host.remove();
      document.body.querySelectorAll("#project-operation-cancel").forEach((element) => element.remove());
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  }, 15_000);

  it("shows storage, oversize, malformed, and cancel feedback for package actions", async () => {
    const { workflow } = harness();
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("File", NodeFile);
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const noStoreHost = document.createElement("div");
    document.body.append(noStoreHost);
    const noStore = new ProjectManager({
      host: noStoreHost,
      workflow,
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
    });
    const exportAction = document.createElement("button");
    exportAction.dataset.projectAction = "export-package";
    noStoreHost.append(exportAction);
    exportAction.click();
    expect(noStoreHost.textContent).toContain("local artwork storage is not connected");
    const importAction = document.createElement("button");
    importAction.dataset.projectAction = "import-package";
    noStoreHost.append(importAction);
    importAction.click();
    expect(noStoreHost.textContent).toContain("local artwork storage is not connected");
    await (noStore as unknown as { importPackage(file: File): Promise<void> }).importPackage(
      new NodeFile(["unused"], "unused.zip", { type: "application/zip" }) as unknown as File,
    );
    expect(noStoreHost.textContent).toContain("local artwork storage is not connected");
    noStore.refresh("Reset");

    const assetStore: ArtworkAssetStore = { put: vi.fn(), get: vi.fn(async () => null), remove: vi.fn() };
    const host2 = document.createElement("div");
    document.body.append(host2);
    const manager = new ProjectManager({
      host: host2, workflow, artworkStore: assetStore,
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
      savePackage: async () => false,
    });
    const large = { size: 256 * 1024 * 1024 + 1 } as File;
    const fileInput = host2.querySelector<HTMLInputElement>("#project-package-file")!;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [large] });
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(host2.textContent).toContain("no larger than 256 MiB"));
    await vi.waitFor(() => expect(host2.querySelector(".project-manager")?.getAttribute("aria-busy")).toBe("false"));

    const invalid = new NodeFile(["not a ZIP archive; this content is not valid."], "bad.zip", { type: "application/zip" }) as unknown as File;
    await (manager as unknown as { importPackage(file: File): Promise<void> }).importPackage(invalid);
    expect(host2.querySelector("#project-manager-status")?.textContent).toContain("complete supported ZIP");
    noStoreHost.remove();
    host2.remove();
    document.querySelector("#project-operation-cancel")?.remove();
    manager.refresh("done");
    vi.unstubAllGlobals();
  });

  it("keeps a package import behind an unresolved field-history save", async () => {
    const { host: projectHost, workflow } = harness();
    vi.stubGlobal("File", NodeFile);
    const imported = vi.fn();
    new ProjectManager({
      host: projectHost,
      workflow,
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: imported,
      setBusy: vi.fn(),
      flushPendingFieldObservations: async () => { throw new Error("field history is still saving"); },
      hasPendingFieldObservations: () => true,
    });
    const input = projectHost.querySelector<HTMLInputElement>("#project-package-file")!;
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new NodeFile(["not imported"], "held.zip", { type: "application/zip" })],
    });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(projectHost.querySelector("#project-manager-status")?.textContent)
      .toContain("field history is still saving"));
    expect(imported).not.toHaveBeenCalled();
    projectHost.remove();
    document.querySelector("#project-operation-cancel")?.remove();
    vi.unstubAllGlobals();
  });

  it("uses the browser download fallback and accepts an empty local-project selection", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const projectId = "11111111-1111-4111-8111-111111111111";
    const styleId = "22222222-2222-4222-8222-222222222222";
    const generatedIds = [projectId, styleId];
    const workflow = await openProjectWorkflow({
      repositoryOptions: { name: "project-manager-download-" + Date.now(), factory: new IDBFactory(), crypto: webcrypto as unknown as Crypto },
      storage: { getItem: () => null },
      idFactory: () => generatedIds.shift() ?? "33333333-3333-4333-8333-333333333333",
      now: () => TIME,
    });
    const savedBundle = await workflow.repository.readProjectBundle(projectId);
    if (!savedBundle) throw new Error("Initial project bundle is missing.");
    await workflow.repository.saveProjectBundle({
      project: {
        ...savedBundle.project,
        name: "🧵",
        revision: savedBundle.project.revision + 1,
        updatedAt: "2026-09-24T16:00:01.000Z",
      },
      styles: savedBundle.styles,
      expectedProjectRevision: savedBundle.project.revision,
    });
    const host = document.createElement("div");
    document.body.append(host);
    const urlApi = { createObjectURL: vi.fn(() => "blob:backup"), revokeObjectURL: vi.fn() };
    vi.stubGlobal("URL", urlApi);
    let downloadedName = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download;
    });
    const downloadManager = new ProjectManager({
      host,
      workflow,
      artworkStore: { put: async () => undefined, get: async () => null, remove: async () => undefined },
      getCurrentDesign: () => workflow.snapshot.activeStyle.design,
      getBlankDesign: () => workflow.snapshot.activeStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
    });
    try {
      const progress = (downloadManager as unknown as {
        packageOptions(signal: AbortSignal): {
          onProgress(value: { phase: "commit"; completedBytes: number; totalBytes: number }): void;
        };
      }).packageOptions(new AbortController().signal);
      progress.onProgress({ phase: "commit", completedBytes: 0, totalBytes: 0 });
      expect(host.querySelector(".project-package-progress-label")?.textContent).toContain("100%");
      downloadManager.refresh();
      host.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLInputElement>("#project-package-file")!.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLSelectElement>("#project-select")!.value = "";
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose a local project first");

      host.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Project backup exported"));
      expect(urlApi.createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      await vi.waitFor(() => expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:backup"));
      expect(downloadedName).toBe("project.infinidrip.zip");
      expect(workflow.snapshot.project.id).toBe(projectId);

      const missingHost = document.createElement("div");
      document.body.append(missingHost);
      vi.spyOn(workflow.repository, "readProjectBundle").mockResolvedValueOnce(null);
      new ProjectManager({
        host: missingHost,
        workflow,
        artworkStore: { put: async () => undefined, get: async () => null, remove: async () => undefined },
        getCurrentDesign: () => workflow.snapshot.activeStyle.design,
        getBlankDesign: () => workflow.snapshot.activeStyle.design,
        hasUnsavedChanges: () => false,
        onStyleLoaded: vi.fn(),
        setBusy: vi.fn(),
      });
      missingHost.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(missingHost.querySelector("#project-manager-status")?.textContent).toContain("disappeared before its backup"));
      missingHost.remove();

      const cancelHost = document.createElement("div");
      document.body.append(cancelHost);
      let finishSave!: (saved: boolean) => void;
      const cancelManager = new ProjectManager({
        host: cancelHost,
        workflow,
        artworkStore: { put: async () => undefined, get: async () => null, remove: async () => undefined },
        getCurrentDesign: () => workflow.snapshot.activeStyle.design,
        getBlankDesign: () => workflow.snapshot.activeStyle.design,
        hasUnsavedChanges: () => false,
        onStyleLoaded: vi.fn(),
        setBusy: vi.fn(),
        savePackage: () => new Promise<boolean>((resolve) => { finishSave = resolve; }),
      });
      cancelHost.querySelector<HTMLButtonElement>("[data-project-action='export-package']")!.click();
      await vi.waitFor(() => expect(finishSave).toBeTypeOf("function"));
      document.querySelector<HTMLButtonElement>("#project-operation-cancel button")!.click();
      finishSave(false);
      await vi.waitFor(() => expect(cancelHost.querySelector("#project-manager-status")?.textContent).toContain("Backup export canceled"));
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      expect((cancelManager as unknown as { confirm(message: string): boolean }).confirm("fallback")).toBe(false);
      confirm.mockReturnValue(true);
      expect((cancelManager as unknown as { confirm(message: string): boolean }).confirm("fallback")).toBe(true);
      cancelHost.remove();
    } finally {
      workflow.close();
      host.remove();
      document.querySelector("#project-operation-cancel")?.remove();
      vi.unstubAllGlobals();
    }
  });

  it("keeps invalid duplicates visible and reports conflicts, generic failures, and missing style IDs", async () => {
    const { host, workflow, setCurrentDesign } = harness();
    setCurrentDesign(null);
    host.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    expect(host.textContent).toContain("Correct invalid design values before duplicating");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(Object.assign(new Error("stale"), { code: "conflict" }));
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Conflict";
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("changed in another tab");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(new Error("Storage is unavailable."));
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("Storage is unavailable.");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(null);
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("The style change failed.");

    const missing = document.createElement("button");
    missing.dataset.projectAction = "archive";
    missing.textContent = "Missing ID";
    host.append(missing);
    missing.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(host.textContent).toContain("missing its style ID"));

    const unsupported = document.createElement("button");
    unsupported.dataset.projectAction = "future";
    host.append(unsupported);
    unsupported.click();
    expect(host.textContent).toContain("not supported");
    const text = document.createTextNode("non-element click target");
    host.append(text);
    text.dispatchEvent(new Event("click", { bubbles: true }));
    host.click();
  });

  it("rejects overlapping actions while the repository operation is pending and bounds copied names", async () => {
    const { host, workflow, setBusy } = harness();
    let finish!: (value: LoadedProject) => void;
    vi.mocked(workflow.createStyle).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Slow style";
    host.querySelector<HTMLButtonElement>("[data-project-action='create']")!.click();
    host.querySelector<HTMLButtonElement>("[data-project-action='create']")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(setBusy).toHaveBeenCalledTimes(1);
    finish(loadedProject());
    await vi.waitFor(() => expect(setBusy).toHaveBeenCalledTimes(2));

    const longLoaded = loadedProject();
    const longStyle = { ...longLoaded.activeStyle, name: "L".repeat(80) };
    const longWorkflow = {
      ...workflow,
      snapshot: { ...longLoaded, activeStyle: longStyle },
      createStyle: vi.fn(async () => longLoaded),
    } as unknown as ProjectWorkflow;
    const host2 = document.createElement("div");
    const manager2 = new ProjectManager({
      host: host2,
      workflow: longWorkflow,
      getCurrentDesign: () => longStyle.design,
      getBlankDesign: () => longStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
    });
    host2.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    await vi.waitFor(() => expect(vi.mocked(longWorkflow.createStyle)).toHaveBeenCalled());
    const copiedName = vi.mocked(longWorkflow.createStyle).mock.calls[0][0];
    expect(copiedName.length).toBeLessThanOrEqual(80);
    expect(copiedName.endsWith("…")).toBe(true);
    manager2.refresh("Done");
  });

  it("offers an explicit scoped review, approval and exact local Tech Pack freeze flow", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    const urlApi = { createObjectURL: vi.fn(() => "blob:tech-pack-share"), revokeObjectURL: vi.fn() };
    vi.stubGlobal("URL", urlApi);
    let downloadedName = "";
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download;
    });
    const confirm = vi.fn(() => true);
    const state = await techPackHarness({
      confirm,
      getTechPackShareOutput: async (revisionId, workflow) => {
        const revision = workflow.snapshot.styleRevisions.find((candidate) => candidate.revisionId === revisionId)!;
        return {
          revisionId,
          revisionContentDigest: revision.revisionContentDigest,
          selectedSections: ["identity", "approval-disclaimer"],
          artifacts: TECH_PACK_SHARE_ARTIFACTS.map((artifact, index) => ({
            ...artifact,
            bytes: new Uint8Array([80 + index, 75, 0, 255]),
          })),
        };
      },
    });
    try {
      const { workflow, host, onStyleLoaded } = state;
      const revisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      const coverScope = host.querySelector<HTMLInputElement>("[data-tech-pack-share-scope='cover']")!;
      coverScope.checked = true;
      coverScope.dispatchEvent(new Event("change", { bubbles: true }));
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']")?.disabled).toBe(false);
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local reviewer";
      host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']")!.click();
      await vi.waitFor(
        () => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("REVIEW"),
        { timeout: 15_000 },
      );
      await vi.waitFor(() => expect(host.querySelector<HTMLButtonElement>("[data-project-action='approve-tech-pack-review']")?.disabled).toBe(false));
      expect(host.textContent).toContain("6 fields are bound to this approval");
      expect(onStyleLoaded).toHaveBeenCalled();

      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local approver";
      host.querySelector<HTMLButtonElement>("[data-project-action='approve-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED"));
      await vi.waitFor(() => expect(host.querySelector<HTMLButtonElement>("[data-project-action='freeze-tech-pack-share']")?.disabled).toBe(false));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local freezer";
      host.querySelector<HTMLButtonElement>("[data-project-action='freeze-tech-pack-share']")!.click();
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>(".project-manager")?.getAttribute("aria-busy")).toBe("true"));
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>(".project-manager")?.getAttribute("aria-busy")).toBe("false"));
      expect(workflow.snapshot.activeStyle.techPack.approval.state, host.querySelector("#project-manager-status")?.textContent).toBe("FROZEN_FOR_SHARE");
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining(`revision ${revisionId}`));
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("production-pack.techpack.zip"));
      expect(host.textContent).toContain("Frozen 2 Tech Pack share files");
      expect(host.textContent).toContain("Download production-pack.pdf");
      expect(host.textContent).toContain("Current for saved revision");
      host.querySelector<HTMLButtonElement>("[data-project-action='download-frozen'][data-artifact-id='tech-pack-production-pdf']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Downloaded stored bytes for production-pack.pdf"));
      expect(urlApi.createObjectURL).toHaveBeenCalledOnce();
      expect(downloadedName).toBe("production-pack.pdf");
      await vi.waitFor(() => expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:tech-pack-share"));

      const originalManifest = workflow.snapshot.exportManifests.find((candidate) => candidate.schemaVersion === 3)!;
      const originalZip = [...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-exchange-zip")).artifact.bytes.arrayBuffer())];
      const originalPdf = [...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-production-pdf")).artifact.bytes.arrayBuffer())];
      const originalRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;

      editT01Field(host, "cover.styleCode", "value", "TP-EDITED-AFTER-SHARE");
      editT01Field(host, "cover.styleCode", "provenance", "USER_CAPTURED");
      editT01Field(host, "cover.styleCode", "evidenceStatus", "USER_CONFIRMED");
      editT01Field(host, "cover.styleCode", "validationStatus", "VALID");
      editT01Field(host, "cover.styleCode", "method", "Edited after the local share");
      editT01Field(host, "cover.styleCode", "capturedBy", "local maker");
      editT01Field(host, "cover.styleCode", "capturedAt", "2026-09-24T16:00:02.000Z");
      editT01Field(host, "cover.styleCode", "unresolvedReason", "");
      editT01Field(host, "cover.styleCode", "nextAction", "");
      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(originalRevisionId));
      await vi.waitFor(() => expect(host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")?.disabled).toBe(true));
      expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("DRAFT");
      expect(host.textContent).toContain("Earlier frozen Tech Pack shares are historical and stale for the current saved revision");
      expect(host.textContent).toContain("Their original bytes remain available under Immutable revisions");
      expect(host.textContent).toContain("Start a new scoped review, approve it and freeze a new share");
      expect(host.textContent).toContain("Historical r1 · stale for current revision");
      expect(host.querySelector<HTMLButtonElement>(`[data-project-action='download-frozen'][data-manifest-id='${originalManifest.manifestId}'][data-artifact-id='tech-pack-production-pdf']`)).not.toBeNull();
      expect([...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-exchange-zip")).artifact.bytes.arrayBuffer())]).toEqual(originalZip);
      expect([...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-production-pdf")).artifact.bytes.arrayBuffer())]).toEqual(originalPdf);

      const currentScope = host.querySelector<HTMLInputElement>("[data-tech-pack-share-scope='cover']")!;
      currentScope.checked = true;
      currentScope.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Current revision reviewer";
      host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("REVIEW"));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Current revision approver";
      host.querySelector<HTMLButtonElement>("[data-project-action='approve-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED"));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Current revision freezer";
      host.querySelector<HTMLButtonElement>("[data-project-action='freeze-tech-pack-share']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("FROZEN_FOR_SHARE"));
      await vi.waitFor(() => expect(host.textContent).toContain("Current for saved revision"));
      expect(host.textContent).toContain("Historical r1 · stale for current revision");
      expect(workflow.snapshot.exportManifests.filter((candidate) => candidate.schemaVersion === 3)).toHaveLength(2);
      expect([...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-exchange-zip")).artifact.bytes.arrayBuffer())]).toEqual(originalZip);
      expect([...new Uint8Array(await (await workflow.readFrozenArtifact(originalManifest.manifestId,
        "tech-pack-production-pdf")).artifact.bytes.arrayBuffer())]).toEqual(originalPdf);
    } finally {
      state.close();
      anchorClick.mockRestore();
      vi.unstubAllGlobals();
    }
  }, 60_000);

  it("shows stale-share guidance for all seven supported recipe IDs", async () => {
    const state = await techPackHarness();
    try {
      const renderShareControls = (state.manager as unknown as {
        renderTechPackShareControls(record: TechPackRecord, loaded: LoadedProject): string;
      }).renderTechPackShareControls.bind(state.manager);
      const base = state.workflow.snapshot;
      const currentRevisionId = "11111111-1111-4111-8111-111111111111";
      const priorRevisionId = "22222222-2222-4222-8222-222222222222";
      for (const recipe of GARMENTS) {
        const record = bindTechPackToRevision(
          createEmptyTechPackRecord(STYLE_ID, recipe.name, TIME, TIME), currentRevisionId, 2, TIME,
        );
        const loaded: LoadedProject = {
          ...base,
          activeStyle: {
            ...base.activeStyle,
            recipeId: recipe.name,
            revisionHeadId: currentRevisionId,
            techPack: record,
          },
          exportManifests: [{
            schemaVersion: 3,
            manifestId: "33333333-3333-4333-8333-333333333333",
            styleId: STYLE_ID,
            revisionId: priorRevisionId,
          } as unknown as LoadedProject["exportManifests"][number]],
        };
        const markup = renderShareControls(record, loaded);
        expect(markup, recipe.name).toContain("Earlier frozen Tech Pack shares are historical and stale for the current saved revision");
        expect(markup, recipe.name).toContain("Their original bytes remain available under Immutable revisions");
        expect(markup, recipe.name).toContain("Start a new scoped review, approve it and freeze a new share");
      }
    } finally {
      state.close();
    }
  });

  it("blocks review and freeze actions without a saved revision, clean draft or explicit scope", async () => {
    const state = await techPackHarness();
    const { workflow, host, manager } = state;
    const actions = manager as unknown as {
      beginTechPackReview(): Promise<void>;
      approveTechPackReview(): Promise<void>;
      freezeTechPackShare(): Promise<void>;
    };
    try {
      state.setUnsavedChanges(true);
      await actions.beginTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save or discard current edits before starting review");
      await actions.approveTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save or discard current edits before approving");
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save or discard current edits before freezing");

      state.setUnsavedChanges(false);
      const saved = workflow.snapshot;
      const internals = workflow as unknown as { loaded: LoadedProject };
      internals.loaded = { ...saved, activeStyle: { ...saved.activeStyle, revisionHeadId: null } };
      await actions.beginTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save the style before starting");
      await actions.approveTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("saved style has no revision to approve");
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("current scoped approval");
      internals.loaded = saved;

      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.remove();
      await actions.beginTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("self-attested reviewer label");
      manager.refresh();
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local reviewer";
      await actions.beginTechPackReview();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Select one or more current Tech Pack fields"));
      const scope = host.querySelector<HTMLInputElement>("[data-tech-pack-share-scope='cover']")!;
      scope.checked = true;
      scope.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local reviewer";
      host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("REVIEW"));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.remove();
      await actions.approveTechPackReview();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("self-attested reviewer label");
      manager.refresh();
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local approver";
      host.querySelector<HTMLButtonElement>("[data-project-action='approve-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED"));
      manager.refresh();
      expect(host.querySelector<HTMLButtonElement>("[data-project-action='freeze-tech-pack-share']")?.disabled).toBe(true);
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("current scoped approval and Tech Pack output generator are required");
      const approved = workflow.snapshot;
      internals.loaded = {
        ...approved,
        activeStyle: {
          ...approved.activeStyle,
          techPack: { ...approved.activeStyle.techPack, approval: { ...approved.activeStyle.techPack.approval, state: "FROZEN_FOR_SHARE", manifestId: null } },
        },
      };
      manager.refresh();
      expect(host.textContent).toContain("Frozen manifest unavailable");
    } finally {
      state.close();
    }
  }, 60_000);

  it("retains approval when frozen-share generation is missing, mismatched, or canceled", async () => {
    type OutputMode = "missing" | "mismatch" | "valid";
    let outputMode: OutputMode = "missing";
    const state = await techPackHarness({
      confirm: () => false,
      getTechPackShareOutput: async (revisionId, workflow) => {
        if (outputMode === "missing") return null;
        const revision = workflow.snapshot.styleRevisions.find((candidate) => candidate.revisionId === revisionId)!;
        return {
          revisionId: outputMode === "mismatch" ? "33333333-3333-4333-8333-333333333333" : revisionId,
          revisionContentDigest: revision.revisionContentDigest,
          selectedSections: ["identity"],
          artifacts: TECH_PACK_SHARE_ARTIFACTS.map((artifact) => ({ ...artifact, bytes: new Uint8Array([1, 2, 3]) })),
        };
      },
    });
    const { workflow, host, manager } = state;
    const actions = manager as unknown as { freezeTechPackShare(): Promise<void> };
    try {
      const scope = host.querySelector<HTMLInputElement>("[data-tech-pack-share-scope='cover']")!;
      scope.checked = true;
      scope.dispatchEvent(new Event("change", { bubbles: true }));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local reviewer";
      host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("REVIEW"));
      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.value = "Local approver";
      host.querySelector<HTMLButtonElement>("[data-project-action='approve-tech-pack-review']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED"));

      host.querySelector<HTMLInputElement>("#tech-pack-share-actor")!.remove();
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("generated Tech Pack files do not match");
      outputMode = "mismatch";
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("generated Tech Pack files do not match");
      outputMode = "valid";
      await actions.freezeTechPackShare();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Local share freeze canceled");
      expect(workflow.snapshot.activeStyle.techPack.approval.state).toBe("APPROVED");
    } finally {
      state.close();
    }
  }, 20_000);

  it("edits and saves a local Brand Profile only after explicit save, including staged artwork and text guidance", async () => {
    const { store, assets } = memoryArtworkStore();
    let nextId = 0;
    const inspectAsset = vi.fn(async (file: File): Promise<InspectedArtworkFile> => ({
      name: file.name,
      mimeType: "image/png",
      blob: new NodeBlob(["validated-image"], { type: "image/png" }) as unknown as Blob,
    }));
    const state = await techPackHarness({
      artworkStore: store,
      inspectAsset,
      techPackIdFactory: () => `a3333333-3333-4333-8333-${String(++nextId).padStart(12, "0")}`,
    });
    try {
      const { host, workflow } = state;
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="add-color"]')!.click();
      let color = host.querySelector<HTMLElement>("[data-brand-profile-color-row]")!;
      const colorId = color.dataset.brandProfileColorRow!;
      const colorName = color.querySelector<HTMLInputElement>('[data-brand-profile-color-field="name"]')!;
      colorName.value = "Indigo";
      colorName.dispatchEvent(new Event("input", { bubbles: true }));
      const colorHex = color.querySelector<HTMLInputElement>('[data-brand-profile-color-field="hex"]')!;
      colorHex.value = "#112233";
      colorHex.dispatchEvent(new Event("input", { bubbles: true }));

      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="add-rule"]')!.click();
      let rule = host.querySelector<HTMLElement>("[data-brand-profile-rule-row]")!;
      const ruleId = rule.dataset.brandProfileRuleRow!;
      const scope = rule.querySelector<HTMLSelectElement>('[data-brand-profile-rule-field="scope"]')!;
      scope.value = "supplier";
      scope.dispatchEvent(new Event("change", { bubbles: true }));
      rule = host.querySelector<HTMLElement>(`[data-brand-profile-rule-row="${ruleId}"]`)!;
      const kind = rule.querySelector<HTMLSelectElement>('[data-brand-profile-rule-field="kind"]')!;
      kind.value = "supplier-constraint";
      kind.dispatchEvent(new Event("change", { bubbles: true }));
      rule = host.querySelector<HTMLElement>(`[data-brand-profile-rule-row="${ruleId}"]`)!;
      const description = rule.querySelector<HTMLTextAreaElement>('[data-brand-profile-rule-field="description"]')!;
      description.value = "Use the approved Indigo palette token.";
      description.dispatchEvent(new Event("input", { bubbles: true }));

      const file = new NodeFile(["image"], "indigo-mark.png", { type: "image/png" }) as unknown as File;
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [file]);
      expect(inspectAsset).not.toHaveBeenCalled();
      expect(store.put).not.toHaveBeenCalled();
      expect(host.querySelector("[data-brand-profile-staged-files]")?.textContent).toContain("indigo-mark.png");

      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="save-profile"]')!.click();
      await vi.waitFor(() => expect("brandProfile" in workflow.snapshot.project).toBe(true));
      await vi.waitFor(() => expect(host.querySelector("[data-brand-profile-assets-status]")?.textContent).toContain("resolve locally"));
      const saved = "brandProfile" in workflow.snapshot.project ? workflow.snapshot.project.brandProfile : null;
      expect(saved?.colors).toEqual([{ id: colorId, name: "Indigo", hex: "#112233" }]);
      expect(saved?.rules).toEqual([{ id: ruleId, scope: "supplier", kind: "supplier-constraint", description: "Use the approved Indigo palette token." }]);
      expect(saved?.artworkAssetIds).toHaveLength(1);
      expect(inspectAsset).toHaveBeenCalledTimes(1);
      expect(store.put).toHaveBeenCalledTimes(1);
      expect(assets.size).toBe(1);

      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="add-color"]')!.click();
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="discard-profile"]')!.click();
      const reloaded = "brandProfile" in workflow.snapshot.project ? workflow.snapshot.project.brandProfile : null;
      expect(reloaded?.colors).toHaveLength(1);
      expect(host.querySelectorAll("[data-brand-profile-color-row]")).toHaveLength(1);
    } finally {
      state.close();
    }
  });

  it("confirms discarding a dirty profile on reload and replaces it with the latest same-project profile", async () => {
    const initialBrandProfile: BrandProfileRecord = {
      schemaVersion: BRAND_PROFILE_RECORD_VERSION,
      colors: [{ id: "a4444444-4444-4444-8444-000000000004", name: "Indigo v1", hex: "#112233" }],
      artworkAssetIds: [],
      rules: [],
    };
    const latestBrandProfile: BrandProfileRecord = {
      ...initialBrandProfile,
      colors: [{ ...initialBrandProfile.colors[0], name: "Indigo v2", hex: "#445566" }],
    };
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const state = await techPackHarness({ initialBrandProfile, confirm });
    try {
      const { host, workflow } = state;
      const saveProfile = host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")!;
      const colorName = host.querySelector<HTMLInputElement>("[data-brand-profile-color-field='name']")!;
      colorName.value = "Stale local v1";
      colorName.dispatchEvent(new Event("input", { bubbles: true }));
      expect(saveProfile.disabled).toBe(false);

      await workflow.saveBrandProfile(latestBrandProfile);
      const reloadSpy = vi.spyOn(workflow, "reload");
      const saveProfileSpy = vi.spyOn(workflow, "saveBrandProfile");

      await clickAndSettle(host, "[data-project-action='reload']");
      expect(confirm).toHaveBeenCalledWith(
        "Reloading the project will discard unsaved Brand Profile edits and staged artwork files. Continue?",
      );
      expect(reloadSpy).not.toHaveBeenCalled();
      expect(colorName.value).toBe("Stale local v1");
      expect(saveProfile.disabled).toBe(false);

      await clickAndSettle(host, "[data-project-action='reload']");
      expect(reloadSpy).toHaveBeenCalledOnce();
      expect(saveProfileSpy).not.toHaveBeenCalled();
      const reloadedName = host.querySelector<HTMLInputElement>("[data-brand-profile-color-field='name']")!;
      expect(reloadedName.value).toBe("Indigo v2");
      expect(host.querySelector<HTMLInputElement>("[data-brand-profile-color-field='hex']")?.value).toBe("#445566");
      expect(host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")?.disabled).toBe(true);
      expect(host.querySelector<HTMLButtonElement>("[data-brand-profile-action='discard-profile']")?.disabled).toBe(true);
      expect("brandProfile" in workflow.snapshot.project && workflow.snapshot.project.brandProfile).toEqual(latestBrandProfile);
    } finally {
      state.close();
    }
  });

  it("blocks a Brand Profile artwork save that would exceed the project backup asset limit", async () => {
    const assets: StoredArtworkAsset[] = Array.from({ length: PROJECT_PACKAGE_MAX_ASSETS }, (_, index) => {
      const assetId = `local-${String(index + 1).padStart(32, "0")}-png`;
      return {
        assetId,
        name: `existing-${index + 1}.png`,
        mimeType: "image/png",
        blob: new NodeBlob(["image"], { type: "image/png" }) as unknown as Blob,
      };
    });
    const initialBrandProfile: BrandProfileRecord = {
      schemaVersion: BRAND_PROFILE_RECORD_VERSION,
      colors: [{ id: "a4444444-4444-4444-8444-000000000004", name: "Indigo", hex: "#112233" }],
      artworkAssetIds: assets.map((asset) => asset.assetId),
      rules: [],
    };
    const { store } = memoryArtworkStore(assets);
    const inspectAsset = vi.fn(async (file: File): Promise<InspectedArtworkFile> => ({
      name: file.name,
      mimeType: "image/png",
      blob: new NodeBlob(["validated-image"], { type: "image/png" }) as unknown as Blob,
    }));
    const state = await techPackHarness({ artworkStore: store, inspectAsset, initialBrandProfile });
    try {
      const { host, workflow } = state;
      const originalProfile = workflow.snapshot.project.schemaVersion === BRAND_PROFILE_PROJECT_RECORD_VERSION
        ? workflow.snapshot.project.brandProfile : null;
      const originalRevision = workflow.snapshot.project.revision;
      const colorName = host.querySelector<HTMLInputElement>("[data-brand-profile-color-field='name']")!;
      colorName.value = "Indigo updated";
      colorName.dispatchEvent(new Event("input", { bubbles: true }));
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [
        new NodeFile(["image"], "additional.png", { type: "image/png" }) as unknown as File,
      ]);
      await vi.waitFor(() => expect(host.querySelector("[data-brand-profile-assets-status]")?.textContent)
        .toContain("All existing artwork references resolve locally"));

      host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain(`at most ${PROJECT_PACKAGE_MAX_ASSETS} referenced artwork files`));

      expect(inspectAsset).not.toHaveBeenCalled();
      expect(store.put).not.toHaveBeenCalled();
      expect(workflow.snapshot.project.revision).toBe(originalRevision);
      expect(workflow.snapshot.project.schemaVersion === BRAND_PROFILE_PROJECT_RECORD_VERSION
        && workflow.snapshot.project.brandProfile).toEqual(originalProfile);
      expect(host.querySelector("[data-brand-profile-staged-files]")?.textContent).toContain("additional.png");
    } finally {
      state.close();
    }
  });

  it("discards staged files without writing and removes only new files when profile save fails", async () => {
    const { store, assets } = memoryArtworkStore();
    const inspectAsset = vi.fn(async (file: File): Promise<InspectedArtworkFile> => ({
      name: file.name,
      mimeType: "image/png",
      blob: new NodeBlob(["validated-image"], { type: "image/png" }) as unknown as Blob,
    }));
    const state = await techPackHarness({ artworkStore: store, inspectAsset });
    try {
      const { host, workflow } = state;
      const file = new NodeFile(["image"], "discard-me.png", { type: "image/png" }) as unknown as File;
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [file]);
      expect(store.put).not.toHaveBeenCalled();
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="discard-profile"]')!.click();
      expect(host.querySelector("[data-brand-profile-staged-files]")?.textContent).toContain("No new files staged");
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("nothing was written");
      expect(store.put).not.toHaveBeenCalled();

      vi.spyOn(workflow, "saveBrandProfile").mockRejectedValue(new Error("simulated project revision conflict"));
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [file]);
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="save-profile"]')!.click();
      await vi.waitFor(() => expect(store.remove).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("simulated project revision conflict"));
      expect(inspectAsset).toHaveBeenCalledTimes(1);
      expect(store.put).toHaveBeenCalledTimes(1);
      expect(assets.size).toBe(0);
    } finally {
      state.close();
    }
  });

  it("surfaces artwork cleanup failures and preserves profile-save errors when cleanup is unavailable", async () => {
    const noStoreProfile: BrandProfileRecord = {
      schemaVersion: BRAND_PROFILE_RECORD_VERSION,
      colors: [{ id: "a4444444-4444-4444-8444-000000000004", name: "Indigo", hex: "#112233" }],
      artworkAssetIds: [],
      rules: [],
    };
    const noStoreState = await techPackHarness({ initialBrandProfile: noStoreProfile });
    try {
      const { host, workflow } = noStoreState;
      vi.spyOn(workflow, "saveBrandProfile").mockRejectedValue(new Error("simulated project revision conflict"));
      const colorName = host.querySelector<HTMLInputElement>("[data-brand-profile-color-field='name']")!;
      colorName.value = "Deep Indigo";
      colorName.dispatchEvent(new Event("input", { bubbles: true }));
      host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("simulated project revision conflict"));
    } finally {
      noStoreState.close();
    }

    const unavailableStorageState = await techPackHarness();
    try {
      const { host, workflow } = unavailableStorageState;
      const saveProfile = vi.spyOn(workflow, "saveBrandProfile");
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [
        new NodeFile(["image"], "unavailable-storage.png", { type: "image/png" }) as unknown as File,
      ]);
      const saveButton = host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")!;
      expect(saveButton.disabled).toBe(false);
      saveButton.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Local artwork storage is unavailable; no Brand Profile files were saved."));
      expect(saveProfile).not.toHaveBeenCalled();
    } finally {
      unavailableStorageState.close();
    }

    const { store, assets } = memoryArtworkStore();
    vi.mocked(store.remove).mockRejectedValue(new Error("simulated local storage failure"));
    const inspectAsset = vi.fn(async (file: File): Promise<InspectedArtworkFile> => ({
      name: file.name,
      mimeType: "image/png",
      blob: new NodeBlob(["validated-image"], { type: "image/png" }) as unknown as Blob,
    }));
    const state = await techPackHarness({ artworkStore: store, inspectAsset });
    try {
      const { host, workflow } = state;
      vi.spyOn(workflow, "saveBrandProfile").mockRejectedValue(new Error("simulated project revision conflict"));
      selectArtworkFiles(host.querySelector<HTMLInputElement>("#brand-profile-artwork-files")!, [
        new NodeFile(["image"], "retain-for-diagnosis.png", { type: "image/png" }) as unknown as File,
      ]);
      host.querySelector<HTMLButtonElement>("[data-brand-profile-action='save-profile']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("could not be removed during cleanup"));
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("simulated project revision conflict");
      expect(store.remove).toHaveBeenCalledTimes(1);
      expect(assets.size).toBe(1);
    } finally {
      state.close();
    }
  });

  it("shows unresolved local artwork, blocks save and apply, and offers a corrective removal", async () => {
    const assetId = "local-11111111111141118111000000000001-png";
    const asset: StoredArtworkAsset = {
      assetId,
      name: "brand-mark.png",
      mimeType: "image/png",
      blob: new NodeBlob(["image"], { type: "image/png" }) as unknown as Blob,
    };
    const { store, assets } = memoryArtworkStore([asset]);
    const initialBrandProfile: BrandProfileRecord = {
      schemaVersion: BRAND_PROFILE_RECORD_VERSION,
      colors: [{ id: "a4444444-4444-4444-8444-000000000004", name: "Teal", hex: "#167C80" }],
      artworkAssetIds: [assetId],
      rules: [],
    };
    const state = await techPackHarness({ artworkStore: store, initialBrandProfile });
    try {
      const { host, manager, workflow } = state;
      assets.delete(assetId);
      manager.refresh();
      await vi.waitFor(() => expect(host.querySelector("[data-brand-profile-assets-status]")?.textContent).toContain("1 artwork reference(s) are missing"));
      expect(host.querySelector("[data-brand-profile-asset-row]")?.textContent).toContain("Missing from local storage");
      expect(host.querySelector<HTMLButtonElement>('[data-brand-profile-action="remove-artwork"]')?.textContent).toContain("Remove missing reference");

      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="add-color"]')!.click();
      const saveButton = host.querySelector<HTMLButtonElement>('[data-brand-profile-action="save-profile"]')!;
      expect(saveButton.disabled).toBe(true);
      expect(host.querySelector<HTMLButtonElement>('[data-brand-profile-action="apply-color"]')?.disabled).toBe(true);
      const saveProfile = vi.spyOn(workflow, "saveBrandProfile");
      saveButton.disabled = false;
      saveButton.click();
      expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Remove or restore every missing local artwork reference before saving the Brand Profile.");
      expect(saveProfile).not.toHaveBeenCalled();
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="remove-artwork"]')!.click();
      expect(host.querySelector("[data-brand-profile-assets-status]")?.textContent).toContain("resolve locally");
      expect(host.querySelector<HTMLButtonElement>('[data-brand-profile-action="save-profile"]')?.disabled).toBe(false);
    } finally {
      state.close();
    }
  });

  it("applies one selected palette color to the pending colorway field with truthful provenance, then saves the revision explicitly", async () => {
    const colorId = "a5555555-5555-4555-8555-000000000005";
    const colorwayId = "80000000-0000-4000-8000-000000000001";
    const materialId = "80000000-0000-4000-8000-000000000002";
    const rowId = "80000000-0000-4000-8000-000000000003";
    const assignmentId = "80000000-0000-4000-8000-000000000004";
    const generatedIds = [colorwayId, materialId, rowId, assignmentId];
    const initialBrandProfile: BrandProfileRecord = {
      schemaVersion: BRAND_PROFILE_RECORD_VERSION,
      colors: [{ id: colorId, name: "Indigo", hex: "#112233" }],
      artworkAssetIds: [],
      rules: [],
    };
    const state = await techPackHarness({ initialBrandProfile, techPackIdFactory: () => generatedIds.shift()! });
    try {
      const { host, manager, workflow } = state;
      const initialRevision = workflow.snapshot.activeStyle.techPack.revisionNumber;
      clickT01Action(host, "add-colorway");
      clickT01Action(host, "add-fabric");
      host.querySelector<HTMLSelectElement>("[data-t01-new-bom-material]")!.value = materialId;
      clickT01Action(host, "add-bom-row");
      const colorway = host.querySelector<HTMLElement>(`[data-t01-colorway="${colorwayId}"]`)!;
      colorway.querySelector<HTMLSelectElement>("[data-t01-new-assignment-row]")!.value = rowId;
      colorway.querySelector<HTMLSelectElement>("[data-t01-new-assignment-material]")!.value = materialId;
      clickT01Action(host, "add-assignment");
      expect(host.querySelector(`[data-t01-assignment="${assignmentId}"]`)).not.toBeNull();

      const colorSelect = host.querySelector<HTMLSelectElement>("[data-brand-profile-color-selection]")!;
      colorSelect.value = colorId;
      colorSelect.dispatchEvent(new Event("change", { bubbles: true }));
      const assignmentSelect = host.querySelector<HTMLSelectElement>("[data-brand-profile-assignment-selection]")!;
      assignmentSelect.value = assignmentId;
      assignmentSelect.dispatchEvent(new Event("change", { bubbles: true }));
      expect(host.querySelector("[data-brand-profile-conflict]")?.textContent).toContain("differs from assignment.");
      expect(host.querySelector<HTMLButtonElement>('[data-brand-profile-action="apply-color"]')?.disabled).toBe(false);

      const savedTechPack = workflow.snapshot.activeStyle.techPack;
      expect(savedTechPack.colorways.flatMap((entry) => entry.assignments).find((entry) => entry.id === assignmentId)?.color.value).toBeUndefined();
      host.querySelector<HTMLButtonElement>('[data-brand-profile-action="apply-color"]')!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent)
        .toContain("Save the Tech Pack revision to commit this design value."));
      const pending = (manager as unknown as { techPackDraft: TechPackRecord }).techPackDraft;
      const pendingField = pending.colorways.flatMap((entry) => entry.assignments).find((entry) => entry.id === assignmentId)!.color;
      expect(pendingField.value).toBe("#112233");
      expect(pendingField.provenance).toBe("USER_SELECTED");
      expect(pendingField.evidenceStatus).toBe("USER_CONFIRMED");
      expect(pendingField.validationStatus).toBe("VALID");
      expect(pendingField.sourceRef).toBe(`brand-profile-color:${colorId}`);
      expect(pendingField.method).toContain("design intent");
      expect(pendingField.method).toContain("not verified");
      expect(pendingField.capturedBy).toBe("Local user");
      expect(new Date(pendingField.capturedAt!).toISOString()).toBe(pendingField.capturedAt);
      expect(pendingField.inputRefs).toEqual([]);
      expect(pendingField.ruleId).toBeNull();
      expect(pendingField.ruleVersion).toBeNull();
      expect(pendingField.inheritedFrom).toBeNull();
      expect(pendingField.unresolvedReason).toBeNull();
      expect(pendingField.nextAction).toBeNull();
      expect(pendingField.evidenceRefs).toEqual([]);
      expect(workflow.snapshot.activeStyle.techPack.revisionNumber).toBe(initialRevision);
      expect(workflow.snapshot.activeStyle.techPack.colorways.flatMap((entry) => entry.assignments).find((entry) => entry.id === assignmentId)?.color.value).toBeUndefined();

      const privateManager = manager as unknown as {
        applyBrandProfileColor(): Promise<void>;
        brandProfileDraft: BrandProfileRecord;
        missingBrandProfileAssets(profile: BrandProfileRecord): Promise<string[]>;
        selectedBrandProfileAssignmentId: string;
        techPackDraft: TechPackRecord | null;
      };
      const savedProfileDraft = privateManager.brandProfileDraft;
      const pendingBeforeGuards = privateManager.techPackDraft;
      const savedTechPackBeforeGuards = workflow.snapshot.activeStyle.techPack;
      const projectRevisionBeforeGuards = workflow.snapshot.project.revision;
      privateManager.brandProfileDraft = {
        ...savedProfileDraft,
        colors: savedProfileDraft.colors.map((color) => ({ ...color, name: `${color.name} edit` })),
      };
      await privateManager.applyBrandProfileColor();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Save or discard Brand Profile edits");
      expect(privateManager.techPackDraft).toEqual(pendingBeforeGuards);
      expect(workflow.snapshot.activeStyle.techPack).toEqual(savedTechPackBeforeGuards);
      expect(workflow.snapshot.project.revision).toBe(projectRevisionBeforeGuards);
      privateManager.brandProfileDraft = savedProfileDraft;

      const selectedAssignmentId = privateManager.selectedBrandProfileAssignmentId;
      privateManager.selectedBrandProfileAssignmentId = "80000000-0000-4000-8000-ffffffffffff";
      await privateManager.applyBrandProfileColor();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("Choose an available saved profile color and Tech Pack assignment");
      expect(privateManager.techPackDraft).toEqual(pendingBeforeGuards);
      expect(workflow.snapshot.activeStyle.techPack).toEqual(savedTechPackBeforeGuards);
      expect(workflow.snapshot.project.revision).toBe(projectRevisionBeforeGuards);
      privateManager.selectedBrandProfileAssignmentId = selectedAssignmentId;

      await privateManager.applyBrandProfileColor();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("already matches");
      const originalMissingAssets = privateManager.missingBrandProfileAssets.bind(manager);
      privateManager.techPackDraft = {
        ...pending,
        colorways: pending.colorways.map((colorway) => ({
          ...colorway,
          assignments: colorway.assignments.map((item) => item.id === assignmentId
            ? { ...item, color: { ...item.color, value: null } }
            : item),
        })),
      };
      privateManager.missingBrandProfileAssets = async () => {
        privateManager.techPackDraft = pending;
        return [];
      };
      await privateManager.applyBrandProfileColor();
      expect(host.querySelector("#project-manager-status")?.textContent).toContain("already matches");
      privateManager.missingBrandProfileAssets = originalMissingAssets;
      privateManager.techPackDraft = pending;

      const saveRevision = host.querySelector<HTMLButtonElement>('[data-project-action="save-tech-pack"]')!;
      expect(saveRevision.disabled).toBe(false);
      saveRevision.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.techPack.revisionNumber).toBeGreaterThan(initialRevision));
      const committedField = workflow.snapshot.activeStyle.techPack.colorways.flatMap((entry) => entry.assignments)
        .find((entry) => entry.id === assignmentId)!.color;
      expect(committedField.value).toBe("#112233");
      expect(committedField.sourceRef).toBe(`brand-profile-color:${colorId}`);
    } finally {
      state.close();
    }
  }, 10_000);

  it("renders the collection matrix and saved scenario comparison without mutating sources", async () => {
    const state = await techPackHarness();
    try {
      const { host, workflow } = state;
      const firstRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      await workflow.saveActiveDesign({ ...workflow.snapshot.activeStyle.design, fabric: "#204060" });
      const currentRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      const rows = [
        { id: "44000000-0000-4000-8000-000000000002", sizePlanId: "44000000-0000-4000-8000-000000000003", styleRevisionId: firstRevisionId, code: "TEE-OLD" },
        { id: "44000000-0000-4000-8000-000000000004", sizePlanId: "44000000-0000-4000-8000-000000000005", styleRevisionId: currentRevisionId, code: "TEE-CURRENT" },
      ];
      const collection = {
        schemaVersion: 1 as const,
        id: "44000000-0000-4000-8000-000000000001",
        projectId: workflow.snapshot.project.id,
        name: "Spring line",
        createdAt: TIME,
        updatedAt: TIME,
        revision: 1,
        skus: rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.code,
          styleId: workflow.snapshot.activeStyle.id,
          styleRevisionId: row.styleRevisionId,
          sizePlan: { id: row.sizePlanId, name: "Core sizes", sizeIds: ["m"] },
          colorways: [],
          variants: [],
        })),
        sharedMaterialGroups: [],
      };
      await workflow.saveCollections([collection]);
      await workflow.saveScenarios([
        {
          schemaVersion: 1,
          id: "44000000-0000-4000-8000-000000000006",
          projectId: workflow.snapshot.project.id,
          collectionId: collection.id,
          name: "Spring baseline",
          revision: 1,
          createdAt: TIME,
          updatedAt: TIME,
          evaluationDate: "2026-10-24",
          currencyCode: "USD",
          units: [], prices: [], costs: [], moqs: [], capacityDelivery: [],
        },
        {
          schemaVersion: 1,
          id: "44000000-0000-4000-8000-000000000007",
          projectId: workflow.snapshot.project.id,
          collectionId: collection.id,
          name: "Summer comparison",
          revision: 1,
          createdAt: TIME,
          updatedAt: TIME,
          evaluationDate: "2026-10-24",
          currencyCode: "EUR",
          units: [], prices: [], costs: [], moqs: [], capacityDelivery: [],
        },
      ]);
      const savedProject = structuredClone(workflow.snapshot.project);
      const savedRevisions = structuredClone(workflow.snapshot.styleRevisions);
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      await vi.waitFor(() => expect(host.textContent).toContain("Collection and SKU matrix"));
      expect(host.textContent).toContain("Stale pin — still uses saved revision r1; current style head is r2.");
      expect(host.textContent).toContain("Current pin — saved revision r2 is the current style head.");
      expect(host.textContent).toContain("Stale pins stay on their saved revision.");
      expect(host.textContent).toContain("TEE-OLD · TEE-OLD");
      expect(host.textContent).toContain("Core sizes · m");
      expect(host.querySelector("[data-scenario-comparison='true']")).not.toBeNull();
      expect(host.querySelectorAll(".scenario-comparison thead th[scope='col']")).toHaveLength(3);
      expect(host.textContent).toContain("Spring baseline");
      expect(host.textContent).toContain("Summer comparison");
      expect(host.textContent).toContain("stale");
      expect(host.textContent).toContain("current");
      expect(host.querySelector("[data-collection-action='repin']")).toBeNull();
      expect(host.querySelector("[data-collection-action='edit']")).toBeNull();
      expect(workflow.snapshot.project).toEqual(savedProject);
      expect(workflow.snapshot.styleRevisions).toEqual(savedRevisions);
    } finally {
      state.close();
    }
  });

  it("edits collection drafts, advances metadata only on successful changed saves, and confirms reload discard", async () => {
    let allowDiscard = false;
    const confirm = vi.fn(() => allowDiscard);
    const state = await techPackHarness({ confirm });
    try {
      const { host, workflow } = state;
      expect(host.querySelector(".project-collection-editor")).not.toBeNull();
      clickCollectionAction(host, "add-collection");
      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Spring edit");
      expect(host.querySelector<HTMLButtonElement>('[data-collection-action="save"]')?.disabled).toBe(false);
      expect(workflow.snapshot.project.schemaVersion).not.toBe(4);

      clickCollectionAction(host, "save");
      await vi.waitFor(() => expect(workflow.snapshot.project.schemaVersion).toBe(4));
      const firstProject = workflow.snapshot.project;
      if (firstProject.schemaVersion !== 4) throw new Error("Collection save did not upgrade to schema v4.");
      expect(firstProject.collections).toHaveLength(1);
      const firstSaved = firstProject.collections[0]!;
      expect(firstSaved).toMatchObject({ name: "Spring edit", revision: 1 });
      expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Spring edit");

      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Summer edit");
      clickCollectionAction(host, "save");
      await vi.waitFor(() => {
        const current = workflow.snapshot.project;
        return expect(current.schemaVersion === 4 && current.collections[0]?.revision).toBe(2);
      });
      const secondProject = workflow.snapshot.project;
      if (secondProject.schemaVersion !== 4) throw new Error("Changed collection save did not retain schema v4.");
      const secondSaved = secondProject.collections[0]!;
      expect(Date.parse(secondSaved.updatedAt)).toBeGreaterThan(Date.parse(firstSaved.updatedAt));

      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Discarded draft");
      clickCollectionAction(host, "discard");
      expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Summer edit");

      const savedProject = structuredClone(workflow.snapshot.project);
      const saveSpy = vi.spyOn(workflow, "saveCollections").mockRejectedValueOnce(new Error("Simulated compare-and-swap conflict."));
      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Rejected draft");
      clickCollectionAction(host, "save");
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Simulated compare-and-swap conflict"));
      expect(workflow.snapshot.project).toEqual(savedProject);
      expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Rejected draft");

      const reloadSpy = vi.spyOn(workflow, "reload");
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("discard unsaved collection edits"));
      expect(reloadSpy).not.toHaveBeenCalled();
      expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Rejected draft");

      allowDiscard = true;
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      await vi.waitFor(() => expect(host.querySelector<HTMLInputElement>('[data-ce-scope="collection"][data-ce-field="name"]')?.value).toBe("Summer edit"));
      expect(reloadSpy).toHaveBeenCalledOnce();
      expect(workflow.snapshot.project).toEqual(savedProject);
      saveSpy.mockRestore();
    } finally {
      state.close();
    }
  });

  it("edits, saves, reloads, and repairs a two-variant scenario while guarding dirty project navigation", async () => {
    let allowDiscard = false;
    const confirm = vi.fn(() => allowDiscard);
    let idSerial = 200;
    const idFactory = () => `77000000-0000-4000-8000-${String(idSerial++).padStart(12, "0")}`;
    const state = await techPackHarness({ confirm, techPackIdFactory: idFactory });
    try {
      const { host, workflow } = state;
      clickT01Action(host, "add-colorway");
      const sourceColorwayId = host.querySelector<HTMLElement>("[data-t01-colorway]")!.dataset.t01Colorway!;
      const oldRevisionId = workflow.snapshot.activeStyle.revisionHeadId;
      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(oldRevisionId));
      const collectionId = idFactory();
      const skuId = idFactory();
      const sizePlanId = idFactory();
      const localColorwayId = idFactory();
      const firstVariantId = idFactory();
      const secondVariantId = idFactory();
      const collection = {
        schemaVersion: 1 as const,
        id: collectionId,
        projectId: workflow.snapshot.project.id,
        name: "Two-size tee",
        createdAt: TIME,
        updatedAt: TIME,
        revision: 1,
        skus: [{
          id: skuId,
          code: "TEE-CORE",
          name: "Core tee",
          styleId: workflow.snapshot.activeStyle.id,
          styleRevisionId: workflow.snapshot.activeStyle.revisionHeadId!,
          sizePlan: { id: sizePlanId, name: "Core sizes", sizeIds: ["M", "L"] },
          colorways: [{ id: localColorwayId, name: "Ink", sourceColorwayId }],
          variants: [
            { id: firstVariantId, skuCode: "TEE-M-INK", sizeId: "M", colorwayId: localColorwayId },
            { id: secondVariantId, skuCode: "TEE-L-INK", sizeId: "L", colorwayId: localColorwayId },
          ],
        }],
        sharedMaterialGroups: [],
      };
      await workflow.saveCollections([collection]);
      state.manager.refresh();
      expect(host.textContent).toContain("Scenario planner");
      expect(host.querySelectorAll("[data-scenario-action='create']")).toHaveLength(1);
      host.querySelector<HTMLButtonElement>("[data-scenario-action='create']")!.click();
      expect(host.querySelectorAll('[data-se-row-kind="units"][data-se-field="units"]')).toHaveLength(2);
      expect(host.querySelectorAll('[data-se-row-kind="prices"][data-se-field="amount"]')).toHaveLength(2);
      expect(host.querySelectorAll('[data-se-row-kind="costs"][data-se-field="amount"]')).toHaveLength(2);

      const draftScenarioId = host.querySelector<HTMLInputElement>('[data-se-row-kind="units"][data-se-field="units"]')?.dataset.seScenario;
      if (!draftScenarioId) throw new Error("Created scenario draft does not expose its ID.");
      editScenarioField(host, `[data-se-scenario="${draftScenarioId}"][data-se-field="name"]`, "Live draft comparison");
      expect(host.querySelector(".scenario-comparison")?.textContent).toContain("Live draft comparison");

      editScenarioField(host, '[data-se-row-kind="units"][data-se-field="units"]', "not-an-integer");
      expect(host.textContent).toContain("PLANNED_UNITS_INVALID");
      expect(host.querySelector<HTMLElement>("[data-scenario-result]")?.textContent).toContain("Calculation state: blocked");
      expect(host.querySelector(".scenario-comparison")?.textContent).toContain("PLANNED_UNITS_INVALID");
      host.querySelector<HTMLButtonElement>("[data-scenario-action='save']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.project.schemaVersion).toBe(5));
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Saved scenario drafts"));
      if (workflow.snapshot.project.schemaVersion !== 5) throw new Error("Scenario save did not create schema v5.");
      const scenarioId = workflow.snapshot.project.scenarios[0]!.id;
      expect(workflow.snapshot.project.scenarios[0]!.units[0]!.units).toBe("not-an-integer");

      const reload = vi.spyOn(workflow, "reload");
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Reloaded"));
      await vi.waitFor(() => expect(host.querySelector<HTMLInputElement>(
        `[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`,
      )?.value).toBe("not-an-integer"));
      expect(reload).toHaveBeenCalledOnce();

      editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-field="evaluationDate"]`, "2026-09-24");
      editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-field="currencyCode"]`, "USD");
      const unitRows = [...host.querySelectorAll<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)];
      unitRows.forEach((control, index) => {
        control.value = index === 0 ? "10" : "5";
        control.dispatchEvent(new Event("input", { bubbles: true }));
      });
      for (const kind of ["prices", "costs"] as const) {
        const amounts = [...host.querySelectorAll<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="${kind}"][data-se-field="amount"]`)];
        amounts.forEach((control) => {
          control.value = kind === "prices" ? "12.50" : "4.00";
          control.dispatchEvent(new Event("input", { bubbles: true }));
        });
        for (const control of host.querySelectorAll<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="${kind}"][data-se-field="currencyCode"]`)) {
          control.value = "USD";
          control.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      for (const rowKind of ["units", "prices", "costs"] as const) {
        const rowIds = new Set([...host.querySelectorAll<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="${rowKind}"][data-se-nested="provenance"][data-se-field="kind"]`)]
          .map((control) => control.dataset.seRowId!));
        for (const rowId of rowIds) {
          for (const [field, value] of [["kind", "user-input"], ["sourceLabel", "Plan"], ["asOf", "2026-09-01"], ["validThrough", "2026-10-01"]]) {
            editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-row-kind="${rowKind}"][data-se-row-id="${rowId}"][data-se-nested="provenance"][data-se-field="${field}"]`, value);
          }
        }
      }
      expect(host.querySelector<HTMLElement>(`[data-scenario-result="${scenarioId}"]`)?.textContent).toContain("Calculation state: partial");
      expect(host.querySelector<HTMLElement>(`[data-scenario-result="${scenarioId}"]`)?.textContent).toContain("Total margin");
      host.querySelector<HTMLButtonElement>("[data-scenario-action='save']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.project.schemaVersion === 5
        && workflow.snapshot.project.scenarios[0]?.units[0]?.units).toBe("10"));
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Saved scenario drafts"));

      editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`, "98");
      host.querySelector<HTMLButtonElement>("[data-scenario-action='discard']")!.click();
      expect(host.querySelector<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)?.value).toBe("10");

      editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`, "99");
      reload.mockClear();
      const beforeCancelledReload = reload;
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("only unsaved scenario editor edits"));
      expect(beforeCancelledReload).not.toHaveBeenCalled();
      expect(host.querySelector<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)?.value).toBe("99");
      allowDiscard = true;
      host.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Reloaded"));
      await vi.waitFor(() => expect(host.querySelector<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)?.value).toBe("10"));

      allowDiscard = false;
      editScenarioField(host, `[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`, "77");
      const projectSelect = host.querySelector<HTMLSelectElement>("#project-select")!;
      const otherProject = document.createElement("option");
      otherProject.value = "88000000-0000-4000-8000-000000000001";
      otherProject.textContent = "Other local project";
      projectSelect.add(otherProject);
      projectSelect.value = otherProject.value;
      const switchProject = vi.spyOn(workflow, "switchProject").mockResolvedValue(workflow.snapshot);
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining("only unsaved scenario editor edits"));
      expect(switchProject).not.toHaveBeenCalled();
      expect(host.querySelector<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)?.value).toBe("77");
      allowDiscard = true;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(switchProject).toHaveBeenCalledOnce());
      await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Opened"));
      expect(host.querySelector<HTMLInputElement>(`[data-se-scenario="${scenarioId}"][data-se-row-kind="units"][data-se-field="units"]`)?.value).toBe("10");
      switchProject.mockRestore();
      reload.mockRestore();
      beforeCancelledReload.mockRestore();
    } finally {
      state.close();
    }
  }, 10_000);

  it("keeps an over-cap Add-missing action atomic and shows the row recovery guidance", async () => {
    let idSerial = 30_000;
    const idFactory = () => `77000000-0000-4000-8000-${String(idSerial++).padStart(12, "0")}`;
    const state = await techPackHarness({ techPackIdFactory: idFactory });
    try {
      const { host, workflow } = state;
      clickT01Action(host, "add-colorway");
      const sourceColorwayId = host.querySelector<HTMLElement>("[data-t01-colorway]")!.dataset.t01Colorway!;
      const oldRevisionId = workflow.snapshot.activeStyle.revisionHeadId;
      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(oldRevisionId));

      const collectionId = idFactory();
      const localColorwayId = idFactory();
      const variantId = idFactory();
      const collection = {
        schemaVersion: 1 as const,
        id: collectionId,
        projectId: workflow.snapshot.project.id,
        name: "Boundary collection",
        createdAt: TIME,
        updatedAt: TIME,
        revision: 1,
        skus: [{
          id: idFactory(),
          code: "TEE-CORE",
          name: "Core tee",
          styleId: workflow.snapshot.activeStyle.id,
          styleRevisionId: workflow.snapshot.activeStyle.revisionHeadId!,
          sizePlan: { id: idFactory(), name: "Core sizes", sizeIds: ["M"] },
          colorways: [{ id: localColorwayId, name: "Ink", sourceColorwayId }],
          variants: [{ id: variantId, skuCode: "TEE-M-INK", sizeId: "M", colorwayId: localColorwayId }],
        }],
        sharedMaterialGroups: [],
      };
      await workflow.saveCollections([collection]);
      const blankProvenance = { kind: "", sourceLabel: "", asOf: "", validThrough: "" };
      const scenario: ScenarioRecord = {
        schemaVersion: 1,
        id: idFactory(),
        projectId: workflow.snapshot.project.id,
        collectionId,
        name: "Near-capacity draft",
        revision: 1,
        createdAt: TIME,
        updatedAt: TIME,
        evaluationDate: "",
        currencyCode: "",
        units: Array.from({ length: 498 }, (_, index) => ({
          id: idFactory(), variantId: `unresolved-${index}`, units: "", provenance: blankProvenance,
        })),
        prices: [],
        costs: [],
        moqs: [],
        capacityDelivery: [],
      };
      await workflow.saveScenarios([scenario]);
      state.manager.refresh();
      const savedBefore = JSON.stringify(projectScenarios(workflow.snapshot.project));
      expect(host.querySelectorAll(`[data-se-scenario="${scenario.id}"][data-se-row-kind="units"][data-se-field="units"]`)).toHaveLength(498);

      host.querySelector<HTMLButtonElement>(`[data-scenario-action="add-missing"][data-se-scenario="${scenario.id}"]`)!.click();

      const status = host.querySelector<HTMLElement>("#project-manager-status")?.textContent ?? "";
      expect(status).toContain("needs 3 rows; 2 rows are available");
      expect(status).toContain("Reduce or split the collection");
      expect(JSON.stringify(projectScenarios(workflow.snapshot.project))).toBe(savedBefore);
      expect(host.querySelectorAll(`[data-se-scenario="${scenario.id}"][data-se-row-kind="units"][data-se-field="units"]`)).toHaveLength(498);
      expect(host.querySelectorAll(`[data-se-scenario="${scenario.id}"][data-se-row-kind="prices"][data-se-field="amount"]`)).toHaveLength(0);
      expect(host.querySelectorAll(`[data-se-scenario="${scenario.id}"][data-se-row-kind="costs"][data-se-field="amount"]`)).toHaveLength(0);
      expect(host.querySelector<HTMLButtonElement>("[data-scenario-action='save']")?.disabled).toBe(true);
      expect(host.querySelector<HTMLButtonElement>("[data-scenario-action='discard']")?.disabled).toBe(true);
    } finally {
      state.close();
    }
  });

  it("confirms graph deletion consequences and keeps SKU material references repairable", async () => {
    let allowDelete = false;
    const confirm = vi.fn(() => allowDelete);
    const state = await techPackHarness({ confirm });
    try {
      const { host, workflow } = state;

      clickT01Action(host, "add-colorway");
      clickT01Action(host, "add-fabric");
      const frozenColorwayId = host.querySelector<HTMLElement>("[data-t01-colorway]")!.dataset.t01Colorway!;
      const frozenMaterialId = host.querySelector<HTMLElement>("[data-t01-material]")!.dataset.t01Material!;
      const initialHeadId = workflow.snapshot.activeStyle.revisionHeadId;
      host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']")!.click();
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.revisionHeadId).not.toBe(initialHeadId));
      const frozenRevision = workflow.snapshot.styleRevisions.find(
        (revision) => revision.revisionId === workflow.snapshot.activeStyle.revisionHeadId,
      )!;
      expect(frozenRevision.payload.payloadVersion).toBe(2);
      if (frozenRevision.payload.payloadVersion !== 2) throw new Error("Fixture requires a frozen T01 v2 source revision.");
      expect(frozenRevision.payload.techPack.colorways.map((entry) => entry.id)).toContain(frozenColorwayId);
      expect(frozenRevision.payload.techPack.materials.map((entry) => entry.id)).toContain(frozenMaterialId);

      const sourceStyles = structuredClone(workflow.snapshot.styles);
      clickCollectionAction(host, "add-collection");
      editCollectionField(host, '[data-ce-scope="collection"][data-ce-field="name"]', "Capsule");
      const addSku = (): string => {
        clickCollectionAction(host, "add-sku");
        const inputs = host.querySelectorAll<HTMLInputElement>('[data-ce-scope="sku"][data-ce-field="code"]');
        return inputs.item(inputs.length - 1)!.dataset.ceSkuId!;
      };
      const fillSku = (skuId: string, code: string): void => {
        editCollectionField(host, `[data-ce-scope="sku"][data-ce-sku-id="${skuId}"][data-ce-field="code"]`, code);
        editCollectionField(host, `[data-ce-scope="sku"][data-ce-sku-id="${skuId}"][data-ce-field="name"]`, `${code} name`);
        editCollectionField(host, `[data-ce-scope="sku"][data-ce-sku-id="${skuId}"][data-ce-field="styleId"]`, workflow.snapshot.activeStyle.id);
        editCollectionField(host, `[data-ce-scope="sku"][data-ce-sku-id="${skuId}"][data-ce-field="styleRevisionId"]`, workflow.snapshot.activeStyle.revisionHeadId!);
        editCollectionField(host, `[data-ce-scope="sizePlan"][data-ce-sku-id="${skuId}"][data-ce-field="name"]`, "Core sizes");
        editCollectionField(host, `[data-ce-scope="sizePlan"][data-ce-sku-id="${skuId}"][data-ce-field="sizeIds"]`, "M");
      };
      const skuOne = addSku();
      fillSku(skuOne, "CAP-A");
      const skuTwo = addSku();
      fillSku(skuTwo, "CAP-B");

      clickCollectionAction(host, "add-colorway", `[data-ce-sku-id="${skuOne}"]`);
      const colorwayName = host.querySelector<HTMLInputElement>(
        `[data-ce-scope="colorway"][data-ce-sku-id="${skuOne}"][data-ce-field="name"]`,
      )!;
      const colorwayId = colorwayName.dataset.ceRecordId!;
      editCollectionField(host,
        `[data-ce-scope="colorway"][data-ce-sku-id="${skuOne}"][data-ce-record-id="${colorwayId}"][data-ce-field="name"]`,
        "Ink",
      );
      editCollectionField(host,
        `[data-ce-scope="colorway"][data-ce-sku-id="${skuOne}"][data-ce-record-id="${colorwayId}"][data-ce-field="sourceColorwayId"]`,
        frozenColorwayId,
      );
      clickCollectionAction(host, "add-variant", `[data-ce-sku-id="${skuOne}"]`);
      const variantCode = host.querySelector<HTMLInputElement>(
        `[data-ce-scope="variant"][data-ce-sku-id="${skuOne}"][data-ce-field="skuCode"]`,
      )!;
      const variantId = variantCode.dataset.ceRecordId!;
      editCollectionField(host,
        `[data-ce-scope="variant"][data-ce-sku-id="${skuOne}"][data-ce-record-id="${variantId}"][data-ce-field="skuCode"]`,
        "CAP-A-M-INK",
      );
      editCollectionField(host,
        `[data-ce-scope="variant"][data-ce-sku-id="${skuOne}"][data-ce-record-id="${variantId}"][data-ce-field="sizeId"]`,
        "M",
      );
      editCollectionField(host,
        `[data-ce-scope="variant"][data-ce-sku-id="${skuOne}"][data-ce-record-id="${variantId}"][data-ce-field="colorwayId"]`,
        colorwayId,
      );

      clickCollectionAction(host, "add-group");
      const firstGroupAdd = host.querySelector<HTMLButtonElement>('[data-collection-action="add-member"]')!;
      const group = firstGroupAdd.dataset.ceRecordId!;
      editCollectionField(host, `[data-ce-scope="group"][data-ce-record-id="${group}"][data-ce-field="name"]`, "Shared fabric");
      clickCollectionAction(host, "add-group");
      const groupIds = host.querySelectorAll<HTMLButtonElement>('[data-collection-action="add-member"]');
      const unusedGroup = groupIds.item(1)!.dataset.ceRecordId!;
      clickCollectionAction(host, "delete-group", `[data-ce-record-id="${unusedGroup}"]`);
      clickCollectionAction(host, "add-member", `[data-ce-record-id="${group}"]`);
      clickCollectionAction(host, "add-member", `[data-ce-record-id="${group}"]`);
      clickCollectionAction(host, "add-member", `[data-ce-record-id="${group}"]`);
      editCollectionField(host, `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="0"][data-ce-field="skuId"]`, skuOne);
      editCollectionField(host, `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="1"][data-ce-field="skuId"]`, skuTwo);
      editCollectionField(host, `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="0"][data-ce-field="materialId"]`, frozenMaterialId);
      editCollectionField(host, `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="1"][data-ce-field="materialId"]`, frozenMaterialId);
      clickCollectionAction(host, "delete-member", `[data-ce-record-id="${group}"][data-ce-index="2"]`);

      clickCollectionAction(host, "delete-sku", `[data-ce-sku-id="${skuOne}"]`);
      expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("removes 1 nested variant(s)"));
      expect(host.querySelectorAll(".project-collection-editor-sku")).toHaveLength(2);
      expect(host.querySelector(`[data-ce-scope="variant"][data-ce-record-id="${variantId}"]`)).not.toBeNull();

      allowDelete = true;
      clickCollectionAction(host, "delete-sku", `[data-ce-sku-id="${skuOne}"]`);
      expect(host.querySelectorAll(".project-collection-editor-sku")).toHaveLength(1);
      expect(host.querySelector(`[data-ce-scope="variant"][data-ce-record-id="${variantId}"]`)).toBeNull();
      expect(host.textContent).toContain("collection.sharedMaterialGroups[0].members[0].skuId: reference a SKU in this collection.");
      expect(host.textContent).toContain(`Unresolved saved ID · ${skuOne}`);
      expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("Shared-material member references will remain in the draft"));

      allowDelete = false;
      clickCollectionAction(host, "delete-collection");
      expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("1 SKU row(s), 0 nested variant(s), and 1 shared-material group(s)"));
      expect(host.querySelectorAll(".project-collection-editor-card")).toHaveLength(1);
      expect(host.querySelectorAll(".project-collection-editor-sku")).toHaveLength(1);
      expect(host.querySelectorAll('[data-ce-scope="member"][data-ce-field="skuId"]')).toHaveLength(2);
      expect(host.querySelector<HTMLInputElement>(
        `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="0"][data-ce-field="skuId"]`,
      )?.value).toBe(skuOne);
      expect(host.querySelector<HTMLInputElement>(
        `[data-ce-scope="member"][data-ce-record-id="${group}"][data-ce-index="1"][data-ce-field="materialId"]`,
      )?.value).toBe(frozenMaterialId);
      expect(host.textContent).toContain("collection.sharedMaterialGroups[0].members[0].skuId: reference a SKU in this collection.");

      allowDelete = true;
      clickCollectionAction(host, "delete-collection");
      expect(host.querySelectorAll(".project-collection-editor-card")).toHaveLength(0);
      expect(workflow.snapshot.styles).toEqual(sourceStyles);
      expect(workflow.snapshot.project.schemaVersion).not.toBe(4);
    } finally {
      state.close();
    }
  });
});
