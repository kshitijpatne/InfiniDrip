// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { STANDARD_M } from "../drafting";
import { migrateLegacySaveFile, type SavedDesign } from "./project-records";
import { serialize } from "./persist";
import { ProjectManager, recoveryPayloadOrNull } from "./project-manager";
import type { LoadedProject } from "./project-repository";
import type { ProjectWorkflow } from "./project-workflow";
import { openProjectWorkflow } from "./project-workflow";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";
import { createProjectPackage, readProjectPackage } from "./project-package";
import { createFieldObservationRecord } from "./field-provenance";

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
  });
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
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Saved T01 as immutable style revision"));

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
      expect(rendered.host.querySelector(".project-revision-history")?.textContent).toContain("historical");
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
  }, 15_000);

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
    const onStyleLoaded = vi.fn();
    const flushPendingFieldObservations = vi.fn(async () => undefined);
    const manager = new ProjectManager({
      host, workflow, artworkStore,
      inspectAsset: async (file) => ({ name: file.name, mimeType: "image/svg+xml", blob: file }),
      savePackage: async (filename, blob) => { savedPackages.push({ filename, blob }); return savedPackages.length > 1; },
      confirm: () => permitCopy,
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

      unsaved = true;
      permitCopy = false;
      host.querySelector<HTMLSelectElement>("#project-select")!.value = localProjectId;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).not.toContain("Opening project"));
      expect(workflow.snapshot.project.id).toBe(copiedProjectId);
      permitCopy = true;
      host.querySelector<HTMLButtonElement>("[data-project-action='switch-project']")!.click();
      await vi.waitFor(() => expect(host.querySelector("#project-manager-status")?.textContent).toContain("Opened My designs"));
      expect(workflow.snapshot.project.id).toBe(localProjectId);

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
});
