import type { LoadedProject, ProjectRepositoryError } from "./project-repository";
import type { RecoveryPayload, SavedDesign, StyleRecord } from "./project-records";
import { ProjectWorkflow } from "./project-workflow";
import type { ArtworkAssetStore } from "../surface/artwork-store";
import type { InspectedArtworkFile } from "../surface/artwork-file";
import {
  createProjectPackage,
  importProjectPackage,
  ProjectPackageError,
  readProjectPackage,
  type ProjectPackageOptions,
  type ProjectPackageProgress,
} from "./project-package";
import type { FrozenArtifactInput } from "./style-revisions";
import type { GradePlanRecord } from "./grade-plan";
import type { FieldEvidenceStatus, FieldProvenance, FieldValidationStatus } from "./field-provenance";
import type {
  TechPackBomRow,
  TechPackColorway,
  TechPackColorwayAssignment,
  TechPackField,
  TechPackFieldValue,
  TechPackMaterial,
  TechPackRecord,
  TechPackSemanticKind,
} from "./tech-pack-records";
import { renderTechPackEditor } from "./tech-pack-editor";

export interface ProjectManagerOptions {
  readonly host: HTMLElement;
  readonly workflow: ProjectWorkflow;
  readonly getCurrentDesign: () => SavedDesign | null;
  readonly getBlankDesign: () => SavedDesign;
  readonly hasUnsavedChanges: () => boolean;
  readonly onStyleLoaded: (loaded: LoadedProject, recovery: RecoveryPayload | null) => void;
  readonly setBusy: (busy: boolean) => void;
  readonly flushPendingFieldObservations?: () => Promise<void>;
  readonly hasPendingFieldObservations?: () => boolean;
  readonly artworkStore?: ArtworkAssetStore;
  readonly inspectAsset?: (file: File) => Promise<InspectedArtworkFile>;
  readonly savePackage?: (filename: string, blob: Blob) => Promise<boolean>;
  readonly canFreezeOutputs?: () => boolean;
  readonly getFreezeBlocker?: () => string | null;
  readonly getFrozenOutputSet?: () => {
    readonly artifacts: readonly FrozenArtifactInput[];
    readonly selectedSizes: readonly { readonly sizeId: string; readonly label: string }[];
    readonly schemaVersion?: 1 | 2;
    readonly approvalRefs?: readonly string[];
    readonly gradePlanFreeze?: { readonly record: GradePlanRecord; readonly approvalRef: string };
  } | null | Promise<{
    readonly artifacts: readonly FrozenArtifactInput[];
    readonly selectedSizes: readonly { readonly sizeId: string; readonly label: string }[];
    readonly schemaVersion?: 1 | 2;
    readonly approvalRefs?: readonly string[];
    readonly gradePlanFreeze?: { readonly record: GradePlanRecord; readonly approvalRef: string };
  } | null>;
  readonly saveFrozenArtifact?: (filename: string, bytes: Blob, mediaType: string) => Promise<boolean>;
  readonly confirm?: (message: string) => boolean;
  readonly packageOptions?: Pick<ProjectPackageOptions, "idFactory" | "now">;
  readonly initialStatusMessage?: string;
  readonly techPackIdFactory?: () => string;
}

type ProjectAction = "create" | "duplicate" | "rename" | "reload" | "switch" | "archive" | "restore"
  | "switch-project" | "export-package" | "import-package" | "compare-revisions" | "restore-revision"
  | "freeze-outputs" | "download-frozen" | "save-tech-pack" | "discard-tech-pack";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function errorMessage(error: unknown): string {
  const repositoryError = error as Partial<ProjectRepositoryError> | null;
  if (repositoryError?.code === "conflict") return "This project changed in another tab. Reload it before continuing.";
  if (error instanceof Error && error.message) return error.message;
  return "The style change failed. The saved project was left unchanged.";
}

function styleLabel(style: StyleRecord): string {
  return `${style.name} · ${style.recipeId} · ${style.recipePresetId}`;
}

function projectPackageFilename(name: string): string {
  const safe = name.normalize("NFKC").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
  return `${safe}.infinidrip.zip`;
}

function unresolvedTechPackField<T extends TechPackFieldValue>(
  fieldId: string,
  semanticKind: TechPackSemanticKind,
): TechPackField<T> {
  return {
    fieldId,
    semanticKind,
    value: null as T,
    unit: null,
    provenance: "UNRESOLVED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: "INVALID",
    sourceRef: null,
    method: null,
    capturedBy: null,
    capturedAt: null,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: "No sourced value has been entered.",
    nextAction: "Enter a value with its source, or record why it remains unknown and the next action.",
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
  };
}

function emptyTechPackMaterial(id: string): TechPackMaterial {
  const field = <T extends TechPackFieldValue>(name: string, kind: TechPackSemanticKind) =>
    unresolvedTechPackField<T>(`material.${id}.${name}`, kind);
  return {
    id,
    category: "fabric",
    name: field<string | null>("name", "MATERIAL_PROPERTY"),
    supplier: field<string | null>("supplier", "MATERIAL_PROPERTY"),
    articleId: field<string | null>("articleId", "MATERIAL_PROPERTY"),
    lotId: field<string | null>("lotId", "MATERIAL_PROPERTY"),
    composition: field<string | null>("composition", "MATERIAL_PROPERTY"),
    construction: field<string | null>("construction", "MATERIAL_PROPERTY"),
    weight: field<number | null>("weight", "MATERIAL_PROPERTY"),
    usableWidth: field<number | null>("usableWidth", "MATERIAL_PROPERTY"),
    finish: field<string | null>("finish", "MATERIAL_PROPERTY"),
    color: field<string | null>("color", "MATERIAL_PROPERTY"),
    directionalBehavior: field<string | null>("directionalBehavior", "MATERIAL_PROPERTY"),
    unitCost: field<number | null>("unitCost", "MATERIAL_PROPERTY"),
    currency: field<string | null>("currency", "MATERIAL_PROPERTY"),
    costBasis: field<string | null>("costBasis", "MATERIAL_PROPERTY"),
  };
}

function emptyTechPackBomRow(id: string, materialId: string): TechPackBomRow {
  const field = <T extends TechPackFieldValue>(name: string, kind: TechPackSemanticKind) =>
    unresolvedTechPackField<T>(`bom.${id}.${name}`, kind);
  return {
    id,
    componentRef: field<string | null>("componentRef", "PANEL_GEOMETRY"),
    placement: field<string | null>("placement", "STYLE_CONTROL"),
    materialId,
    quantity: field<number | null>("quantity", "MATERIAL_PROPERTY"),
    quantityBasis: field<TechPackBomRow["quantityBasis"]["value"]>("quantityBasis", "MATERIAL_PROPERTY"),
    requiredness: field<boolean | null>("requiredness", "STYLE_CONTROL"),
  };
}

function emptyTechPackColorway(id: string): TechPackColorway {
  return {
    id,
    name: unresolvedTechPackField<string | null>(`colorway.${id}.name`, "STYLE_CONTROL"),
    assignments: [],
  };
}

function emptyTechPackAssignment(
  id: string,
  bomRowId: string,
  materialId: string,
): TechPackColorwayAssignment {
  return {
    id,
    bomRowId,
    materialId,
    color: unresolvedTechPackField<string | null>(`assignment.${id}.color`, "MATERIAL_PROPERTY"),
  };
}

function techPackRecordId(factory?: () => string): string {
  const id = factory?.() ?? globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error("Secure local IDs are unavailable; the tech-pack change was not applied.");
  return id;
}

function isTechPackField(value: unknown): value is TechPackField<TechPackFieldValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && typeof (value as { readonly fieldId?: unknown }).fieldId === "string";
}

function updateTechPackField(
  record: TechPackRecord,
  fieldId: string,
  property: string,
  value: unknown,
): TechPackRecord | null {
  let found = false;
  const update = (field: TechPackField<TechPackFieldValue>): TechPackField<TechPackFieldValue> => {
    if (field.fieldId !== fieldId) return field;
    found = true;
    if (property === "inheritedRevisionId" || property === "inheritedProvenance" || property === "inheritedSourceRef") {
      const prior = field.inheritedFrom;
      const inheritedFrom = {
        revisionId: prior?.revisionId ?? "",
        provenance: prior?.provenance ?? ("" as Exclude<FieldProvenance, "INHERITED" | "UNRESOLVED">),
        sourceRef: prior?.sourceRef ?? null,
      };
      if (property === "inheritedRevisionId") inheritedFrom.revisionId = value as string;
      if (property === "inheritedProvenance") inheritedFrom.provenance = value as Exclude<FieldProvenance, "INHERITED" | "UNRESOLVED">;
      if (property === "inheritedSourceRef") inheritedFrom.sourceRef = value as string | null;
      return { ...field, inheritedFrom };
    }
    if (property === "provenance" && value !== "INHERITED" && field.inheritedFrom !== null) {
      return { ...field, provenance: value as FieldProvenance, inheritedFrom: null };
    }
    if (property === "value") return { ...field, value: value as TechPackFieldValue };
    if (property === "unit") return { ...field, unit: value as string | null };
    if (property === "provenance") return { ...field, provenance: value as FieldProvenance };
    if (property === "evidenceStatus") return { ...field, evidenceStatus: value as FieldEvidenceStatus };
    if (property === "validationStatus") return { ...field, validationStatus: value as FieldValidationStatus };
    if (property === "sourceRef" || property === "method" || property === "capturedBy" || property === "capturedAt"
      || property === "ruleId" || property === "ruleVersion" || property === "unresolvedReason" || property === "nextAction") {
      return { ...field, [property]: value as string | null };
    }
    if (property === "inputRefs" || property === "evidenceRefs") {
      return { ...field, [property]: value as readonly string[] };
    }
    return field;
  };
  const updateFields = <T extends object>(source: T): T => {
    let changed = false;
    const result = { ...source } as Record<string, unknown>;
    for (const [key, member] of Object.entries(source)) {
      if (!isTechPackField(member)) continue;
      const next = update(member);
      if (next !== member) {
        result[key] = next;
        changed = true;
      }
    }
    return changed ? result as T : source;
  };
  const cover = updateFields(record.cover);
  const materials = record.materials.map((material) => updateFields(material));
  const bomRows = record.bomRows.map((row) => updateFields(row));
  const colorways = record.colorways.map((colorway) => ({
    ...colorway,
    ...updateFields(colorway),
    assignments: colorway.assignments.map((assignment) => updateFields(assignment)),
  }));
  return found ? { ...record, cover, materials, bomRows, colorways } : null;
}

function techPackControlValue(target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, property: string): unknown {
  if (property === "inputRefs" || property === "evidenceRefs") {
    return target.value.split(/\r?\n/).filter((entry) => entry.length > 0);
  }
  if (property === "value") {
    if (target instanceof HTMLInputElement && target.type === "number") {
      if (target.value === "") return null;
      return Number.isFinite(target.valueAsNumber) ? target.valueAsNumber : Number.NaN;
    }
    if (target instanceof HTMLSelectElement && ["", "true", "false"].includes(target.value)) {
      return target.value === "" ? null : target.value === "true";
    }
    return target.value === "" ? null : target.value;
  }
  if (property === "inheritedRevisionId") return target.value;
  if (property === "value" || property === "unit" || property === "sourceRef" || property === "method"
    || property === "capturedBy" || property === "capturedAt" || property === "ruleId" || property === "ruleVersion"
    || property === "unresolvedReason" || property === "nextAction" || property === "inheritedSourceRef") return target.value === "" ? null : target.value;
  return target.value;
}

function progressLabel(value: ProjectPackageProgress): string {
  const percent = value.totalBytes === 0 ? 100 : Math.min(100, Math.floor((value.completedBytes / value.totalBytes) * 100));
  const phase = value.phase === "prepare" ? "Preparing artwork" : value.phase === "write" ? "Writing backup"
    : value.phase === "validate" ? "Checking package" : value.phase === "stage" ? "Staging artwork" : "Saving project records";
  return `${phase} · ${percent}%`;
}

export function recoveryPayloadOrNull(loaded: LoadedProject): RecoveryPayload | null {
  const recovery = loaded.activeRecovery;
  return recovery ? recovery.payload : null;
}

export class ProjectManager {
  private message: string;
  private busy = false;
  private controller: AbortController | null = null;
  private progressState: ProjectPackageProgress | null = null;
  private progressPaintedBytes = 0;
  private styleNameDraft = "";
  private revisionComparison = "";
  private compareLeftId = "";
  private compareRightId = "";
  private techPackDraft: TechPackRecord | null = null;
  private techPackInputError = "";
  private projectManagerOpen = false;
  private projects: readonly LoadedProject[];
  private readonly cancelPortal: HTMLDivElement;

  constructor(private readonly options: ProjectManagerOptions) {
    this.message = options.initialStatusMessage ?? "Saved project is ready on this device.";
    this.projects = [options.workflow.snapshot];
    let portal = document.querySelector<HTMLDivElement>("#project-operation-cancel");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "project-operation-cancel";
      portal.className = "project-operation-cancel";
      portal.innerHTML = `<span role="status" aria-live="polite">Project backup in progress.</span><button type="button">Cancel</button>`;
      document.body.append(portal);
    }
    this.cancelPortal = portal;
    this.cancelPortal.querySelector("button")!.onclick = () => this.controller?.abort();
    options.host.addEventListener("toggle", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLDetailsElement) || !target.classList.contains("project-manager-details")) return;
      if (target.open === this.projectManagerOpen) return;
      this.projectManagerOpen = target.open;
      this.render();
    }, true);
    options.host.addEventListener("input", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.id === "project-style-name") {
        this.styleNameDraft = target.value;
        return;
      }
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        if (target.dataset.t01Input === "true") this.updateTechPackFromControl(target);
      }
    });
    options.host.addEventListener("click", (event) => {
      const t01Target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-t01-action]") : null;
      if (t01Target && !this.busy) {
        event.preventDefault();
        this.handleTechPackAction(t01Target);
        return;
      }
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-project-action]") : null;
      const action = target?.dataset.projectAction as ProjectAction | undefined;
      if (!action || this.busy) return;
      event.preventDefault();
      if (action === "import-package") {
        void this.handle(action, target?.dataset.styleId, target);
        return;
      }
      if (!this.options.flushPendingFieldObservations
        || this.options.hasPendingFieldObservations?.() === false) {
        void this.handle(action, target?.dataset.styleId, target);
        return;
      }
      void this.runAfterFieldHistory(() => this.handle(action, target?.dataset.styleId, target));
    });
    options.host.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.id === "revision-left") {
        this.compareLeftId = target.value;
        return;
      }
      if (target instanceof HTMLSelectElement && target.id === "revision-right") {
        this.compareRightId = target.value;
        return;
      }
      if (target instanceof HTMLSelectElement && target.dataset.t01Input === "true") {
        this.updateTechPackFromControl(target);
        return;
      }
      if (!(target instanceof HTMLInputElement) || target.id !== "project-package-file") return;
      const file = target.files?.[0] ?? null;
      target.value = "";
      if (file) {
        if (this.options.flushPendingFieldObservations
          && this.options.hasPendingFieldObservations?.() !== false) {
          void this.runAfterFieldHistory(() => this.importPackage(file));
        }
        else void this.importPackage(file);
      }
    });
    this.render();
    const repository = options.workflow.repository as ProjectWorkflow["repository"] | undefined;
    if (repository && typeof repository.listProjects === "function") {
      void repository.listProjects().then((projects) => { this.projects = projects; this.render(); }).catch(() => undefined);
    }
  }

  refresh(message?: string): void {
    if (message !== undefined) this.message = message;
    this.render();
  }

  private currentTechPackRecord(): TechPackRecord | null {
    const active = this.options.workflow.snapshot.activeStyle;
    if (this.techPackDraft && this.techPackDraft.styleId !== active.id) return null;
    return this.techPackDraft ?? active.techPack;
  }

  private updateTechPackStatus(message: string): void {
    this.message = message;
    const status = this.options.host.querySelector<HTMLElement>("#project-manager-status");
    if (status) status.textContent = message;
    const save = this.options.host.querySelector<HTMLButtonElement>("[data-project-action='save-tech-pack']");
    if (save) save.disabled = this.busy || this.techPackDraft === null || this.techPackInputError.length > 0;
    const discard = this.options.host.querySelector<HTMLButtonElement>("[data-project-action='discard-tech-pack']");
    if (discard) discard.disabled = this.busy || this.techPackDraft === null;
    const freeze = this.options.host.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']");
    const hasUnsavedDesign = this.options.hasUnsavedChanges();
    const outputsReady = this.options.canFreezeOutputs?.() === true;
    const freezeBlocker = this.options.getFreezeBlocker?.() ?? null;
    const canFreeze = !this.busy && !hasUnsavedDesign && this.techPackDraft === null && outputsReady && freezeBlocker === null;
    if (freeze) freeze.disabled = !canFreeze;
    const guidance = this.busy ? "" : hasUnsavedDesign
      ? "Save the current style before freezing outputs."
      : this.techPackDraft !== null
        ? "Save or discard the unsaved T01 edits before freezing outputs."
        : freezeBlocker ?? (outputsReady ? "" : "Review Style and Check, resolve digital blockers, and make sure the current style is saved before freezing outputs.");
    const freezeGuidance = this.options.host.querySelector<HTMLElement>("#project-freeze-guidance");
    if (freezeGuidance) freezeGuidance.textContent = guidance;
  }

  private updateTechPackFromControl(target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T01 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const fieldId = target.dataset.t01FieldId;
    const property = target.dataset.t01FieldProperty ?? (fieldId ? "value" : undefined);
    let updated: TechPackRecord | null = null;
    if (fieldId && property) {
      const value = techPackControlValue(target, property);
      if (typeof value === "number" && Number.isNaN(value)) {
        this.techPackInputError = "Enter a finite numeric value or leave the quantity explicitly unknown.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      updated = updateTechPackField(record, fieldId, property, value);
      if (!updated) {
        this.techPackInputError = "The edited T01 field is not in the current record. Reload before continuing.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
    } else if (target.dataset.t01MaterialField === "category" && target.dataset.t01MaterialId) {
      if (target.value !== "fabric" && target.value !== "trim") {
        this.techPackInputError = "Choose Fabric or Trim for this material.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      const materialId = target.dataset.t01MaterialId;
      updated = {
        ...record,
        materials: record.materials.map((material) => material.id === materialId
          ? { ...material, category: target.value as TechPackMaterial["category"] }
          : material),
      };
    } else if (target.dataset.t01BomField === "materialId" && target.dataset.t01BomRowId) {
      const rowId = target.dataset.t01BomRowId;
      updated = {
        ...record,
        bomRows: record.bomRows.map((row) => row.id === rowId ? { ...row, materialId: target.value } : row),
      };
    } else if (target.dataset.t01AssignmentField && target.dataset.t01AssignmentId) {
      const assignmentId = target.dataset.t01AssignmentId;
      const propertyName = target.dataset.t01AssignmentField;
      if (propertyName !== "bomRowId" && propertyName !== "materialId") {
        this.techPackInputError = "The colorway assignment field is unsupported. Reload the editor before continuing.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      updated = {
        ...record,
        colorways: record.colorways.map((colorway) => ({
          ...colorway,
          assignments: colorway.assignments.map((assignment) => assignment.id === assignmentId
            ? { ...assignment, [propertyName]: target.value }
            : assignment),
        })),
      };
    }
    if (!updated) {
      this.techPackInputError = "The edited T01 control is not connected to a record field.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    this.techPackDraft = updated;
    this.techPackInputError = "";
    this.updateTechPackStatus("Unsaved T01 edits. Save the tech pack to create one immutable revision.");
  }

  private discardTechPackDraft(): void {
    this.techPackDraft = null;
    this.techPackInputError = "";
  }

  private handleTechPackAction(target: HTMLElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T01 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const action = target.dataset.t01Action;
    const nextId = () => techPackRecordId(this.options.techPackIdFactory);
    let updated: TechPackRecord;
    const message = "Unsaved T01 edits. Save the tech pack to create one immutable revision.";
    if (action === "add-fabric" || action === "add-trim") {
      const material = emptyTechPackMaterial(nextId());
      updated = { ...record, materials: [...record.materials, { ...material, category: action === "add-fabric" ? "fabric" : "trim" }] };
    } else if (action === "add-bom-row") {
      if (record.materials.length === 0) {
        this.updateTechPackStatus("Add a material before adding a BOM row; each row must reference an existing material.");
        return;
      }
      const select = target.closest<HTMLElement>(".t01-bom")?.querySelector<HTMLSelectElement>("[data-t01-new-bom-material]");
      const materialId = select?.value ?? "";
      if (!record.materials.some((material) => material.id === materialId)) {
        this.updateTechPackStatus("Choose a material for this BOM row before adding it.");
        return;
      }
      updated = { ...record, bomRows: [...record.bomRows, emptyTechPackBomRow(nextId(), materialId)] };
    } else if (action === "add-colorway") {
      updated = { ...record, colorways: [...record.colorways, emptyTechPackColorway(nextId())] };
    } else if (action === "add-assignment") {
      const colorwayId = target.dataset.t01ColorwayId;
      const colorwayHost = target.closest<HTMLElement>("[data-t01-colorway]");
      const rowId = colorwayHost?.querySelector<HTMLSelectElement>("[data-t01-new-assignment-row]")?.value ?? "";
      const materialId = colorwayHost?.querySelector<HTMLSelectElement>("[data-t01-new-assignment-material]")?.value ?? "";
      if (!record.colorways.some((colorway) => colorway.id === colorwayId)) {
        this.updateTechPackStatus("The selected colorway is no longer in this T01 record. Reload before adding an assignment.");
        return;
      }
      if (!record.bomRows.some((row) => row.id === rowId) || !record.materials.some((material) => material.id === materialId)) {
        this.updateTechPackStatus("Choose an existing BOM row and material before adding this colorway assignment.");
        return;
      }
      const duplicate = record.colorways.find((colorway) => colorway.id === colorwayId)
        ?.assignments.some((assignment) => assignment.bomRowId === rowId);
      if (duplicate) {
        this.updateTechPackStatus("This colorway already has an assignment for that BOM row. Edit or remove it before adding another.");
        return;
      }
      updated = {
        ...record,
        colorways: record.colorways.map((colorway) => colorway.id === colorwayId
          ? { ...colorway, assignments: [...colorway.assignments, emptyTechPackAssignment(nextId(), rowId, materialId)] }
          : colorway),
      };
    } else if (action === "remove-material") {
      const materialId = target.dataset.t01MaterialId;
      if (!materialId || !record.materials.some((material) => material.id === materialId)) {
        this.updateTechPackStatus("The selected material is missing from this T01 record. Reload before removing it.");
        return;
      }
      if (record.bomRows.some((row) => row.materialId === materialId)
        || record.colorways.some((colorway) => colorway.assignments.some((assignment) => assignment.materialId === materialId))) {
        this.updateTechPackStatus("Reassign or remove BOM rows and colorway assignments that reference this material before removing it.");
        return;
      }
      updated = { ...record, materials: record.materials.filter((material) => material.id !== materialId) };
    } else if (action === "remove-bom-row") {
      const rowId = target.dataset.t01BomRowId;
      if (!rowId || !record.bomRows.some((row) => row.id === rowId)) {
        this.updateTechPackStatus("The selected BOM row is missing from this T01 record. Reload before removing it.");
        return;
      }
      if (record.colorways.some((colorway) => colorway.assignments.some((assignment) => assignment.bomRowId === rowId))) {
        this.updateTechPackStatus("Remove colorway assignments for this BOM row before removing the row.");
        return;
      }
      updated = { ...record, bomRows: record.bomRows.filter((row) => row.id !== rowId) };
    } else if (action === "remove-colorway") {
      const colorwayId = target.dataset.t01ColorwayId;
      if (!colorwayId || !record.colorways.some((colorway) => colorway.id === colorwayId)) {
        this.updateTechPackStatus("The selected colorway is missing from this T01 record. Reload before removing it.");
        return;
      }
      updated = { ...record, colorways: record.colorways.filter((colorway) => colorway.id !== colorwayId) };
    } else if (action === "remove-assignment") {
      const colorwayId = target.dataset.t01ColorwayId;
      const assignmentId = target.dataset.t01AssignmentId;
      const colorway = record.colorways.find((candidate) => candidate.id === colorwayId);
      if (!colorway || !assignmentId || !colorway.assignments.some((assignment) => assignment.id === assignmentId)) {
        this.updateTechPackStatus("The selected colorway assignment is missing from this T01 record. Reload before removing it.");
        return;
      }
      updated = {
        ...record,
        colorways: record.colorways.map((candidate) => candidate.id === colorwayId
          ? { ...candidate, assignments: candidate.assignments.filter((assignment) => assignment.id !== assignmentId) }
          : candidate),
      };
    } else {
      this.updateTechPackStatus("That T01 collection action is not supported.");
      return;
    }
    this.techPackDraft = updated;
    this.techPackInputError = "";
    this.updateTechPackStatus(message);
    this.render();
  }

  private confirmTechPackDraftDiscard(): boolean {
    if (!this.techPackDraft) return true;
    return this.confirm("Discard the unsaved T01 editor changes? The saved tech-pack revision will remain unchanged.");
  }

  private renderStyles(styles: readonly StyleRecord[], activeId: string): string {
    const available = styles.filter((style) => style.archivedAt === null);
    const archived = styles.filter((style) => style.archivedAt !== null);
    return `<section class="project-style-list" aria-labelledby="available-styles-title">` +
      `<h3 id="available-styles-title">Available styles</h3><ul>` + available.map((style) =>
        `<li><button type="button" data-project-action="switch" data-style-id="${escapeHtml(style.id)}"` +
        ` aria-current="${style.id === activeId ? "true" : "false"}"${style.id === activeId || this.busy ? " disabled" : ""}>` +
        `${escapeHtml(styleLabel(style))}${style.id === activeId ? " · Current" : ""}</button>` +
        `<button type="button" data-project-action="archive" data-style-id="${escapeHtml(style.id)}"` +
        `${style.id === activeId || this.busy ? " disabled" : ""} aria-label="Archive ${escapeHtml(style.name)}">Archive</button></li>`
      ).join("") + `</ul></section>` +
      `<section class="project-style-list" aria-labelledby="archived-styles-title">` +
      `<h3 id="archived-styles-title">Archived styles</h3>` +
      (archived.length ? `<ul>${archived.map((style) =>
        `<li><span>${escapeHtml(styleLabel(style))}</span>` +
        `<button type="button" data-project-action="restore" data-style-id="${escapeHtml(style.id)}"` +
        `${this.busy ? " disabled" : ""} aria-label="Restore ${escapeHtml(style.name)}">Restore</button></li>`
      ).join("")}</ul>` : `<p>No archived styles.</p>`) + `</section>`;
  }

  private renderRevisionHistory(loaded: LoadedProject): string {
    const revisions = loaded.styleRevisions.filter((revision) => revision.styleId === loaded.activeStyle.id)
      .slice().sort((left, right) => right.revisionNumber - left.revisionNumber);
    const manifests = loaded.exportManifests.filter((manifest) => manifest.styleId === loaded.activeStyle.id)
      .slice().sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
    const leftId = revisions.some((revision) => revision.revisionId === this.compareLeftId)
      ? this.compareLeftId : revisions[0]?.revisionId ?? "";
    const rightId = revisions.some((revision) => revision.revisionId === this.compareRightId)
      ? this.compareRightId : revisions[1]?.revisionId ?? revisions[0]?.revisionId ?? "";
    const revisionOptions = (selectedId: string): string => revisions.map((revision) =>
      `<option value="${escapeHtml(revision.revisionId)}"${revision.revisionId === selectedId ? " selected" : ""}>r${revision.revisionNumber} · ${escapeHtml(revision.createdAt)} · ${revision.revisionContentDigest.slice(0, 12)}</option>`).join("");
    const historyRows = revisions.length ? `<ol>${revisions.map((revision) =>
      `<li><span>r${revision.revisionNumber} · ${escapeHtml(revision.createdAt)} · ${revision.parentRevisionId ? `parent ${escapeHtml(revision.parentRevisionId.slice(0, 8))}` : "baseline"}` +
      `<br><code>${escapeHtml(revision.revisionContentDigest)}</code> · SHA-256 verified</span>` +
      `<button type="button" data-project-action="restore-revision" data-revision-id="${escapeHtml(revision.revisionId)}"` +
      `${this.busy || revision.revisionId === loaded.activeStyle.revisionHeadId ? " disabled" : ""}>Restore as new revision</button></li>`
    ).join("")}</ol>` : `<p>No immutable revision history is available.</p>`;
    const frozenRows = manifests.length ? `<ol>${manifests.map((manifest) =>
      `<li><span>Captured ${escapeHtml(manifest.capturedAt)} · r${manifest.payload.revisionId === loaded.activeStyle.revisionHeadId
        ? "current" : escapeHtml(revisions.find((revision) => revision.revisionId === manifest.revisionId)?.revisionNumber?.toString() ?? "historical")}` +
      `<br><code>${escapeHtml(manifest.packetDigest)}</code> · ${manifest.artifacts.length} verified files</span>` +
      `<ul>${manifest.artifacts.map((artifact) => `<li><button type="button" data-project-action="download-frozen"` +
        ` data-manifest-id="${escapeHtml(manifest.manifestId)}" data-artifact-id="${escapeHtml(artifact.artifactId)}"${this.busy ? " disabled" : ""}>Download ${escapeHtml(artifact.displayName)}</button>` +
        ` · ${artifact.byteLength} bytes · SHA-256 ${escapeHtml(artifact.sha256.slice(0, 12))}</li>`).join("")}</ul></li>`
    ).join("")}</ol>` : `<p>No frozen output captures.</p>`;
    const hasUnsavedChanges = this.options.hasUnsavedChanges();
    const hasUnsavedTechPack = this.techPackDraft !== null;
    const outputsReady = this.options.canFreezeOutputs?.() === true;
    const freezeBlocker = this.options.getFreezeBlocker?.() ?? null;
    const canFreeze = !this.busy && !hasUnsavedChanges && !hasUnsavedTechPack && outputsReady && freezeBlocker === null;
    const freezeGuidance = this.busy ? "" : hasUnsavedChanges
      ? "Save the current style before freezing outputs."
      : hasUnsavedTechPack
        ? "Save or discard the unsaved T01 edits before freezing outputs."
        : freezeBlocker ?? (outputsReady ? "" : "Review Style and Check, resolve digital blockers, and make sure the current style is saved before freezing outputs.");
    return `<section class="project-revision-history" aria-labelledby="revision-history-title">` +
      `<h3 id="revision-history-title">Immutable revisions</h3>` +
      `<p>Revision digests verify saved digital content. They do not establish fit or factory acceptance.</p>${historyRows}` +
      `<div class="project-revision-compare"><label for="revision-left">Compare</label><select id="revision-left"${this.busy || revisions.length < 2 ? " disabled" : ""}>${revisionOptions(leftId)}</select>` +
      `<label for="revision-right">with</label><select id="revision-right"${this.busy || revisions.length < 2 ? " disabled" : ""}>${revisionOptions(rightId)}</select>` +
      `<button type="button" data-project-action="compare-revisions"${this.busy || revisions.length < 2 ? " disabled" : ""}>Compare revisions</button></div>` +
      `<p class="project-revision-comparison" role="status" aria-live="polite">${escapeHtml(this.revisionComparison)}</p>` +
      `<button type="button" data-project-action="freeze-outputs" aria-describedby="project-freeze-guidance"${canFreeze ? "" : " disabled"}>Freeze seven current digital outputs</button>` +
      `<p id="project-freeze-guidance" class="project-freeze-guidance" role="status" aria-live="polite">${escapeHtml(freezeGuidance)}</p>` +
      `<p>Freezing records the current selected size and whole-run exports. It does not certify physical fit, approval, supplier requirements or factory acceptance.</p>` +
      `<h4>Frozen output captures</h4>${frozenRows}</section>`;
  }

  private render(): void {
    const loaded = this.options.workflow.snapshot;
    const open = this.options.host.querySelector<HTMLDetailsElement>(".project-manager-details")?.open ?? false;
    this.projectManagerOpen = open;
    const techPackEditor = open
      ? `<section class="project-tech-pack" aria-label="Living technical pack T01">` +
        `<h3>Living technical pack · T01</h3>` +
        `<p>Editable production-planning values for ${escapeHtml(loaded.activeStyle.recipeId)}. Unknowns and their next actions remain visible. Saving creates one immutable revision; this does not verify physical fit, supplier facts, or factory acceptance.</p>` +
        `<div class="project-tech-pack-actions">` +
        `<button type="button" data-project-action="save-tech-pack"${this.busy || !this.techPackDraft || this.techPackInputError ? " disabled" : ""}>Save T01 revision</button>` +
        `<button type="button" data-project-action="discard-tech-pack"${this.busy || !this.techPackDraft ? " disabled" : ""}>Discard T01 edits</button></div>` +
        `${renderTechPackEditor({ record: this.currentTechPackRecord() ?? loaded.activeStyle.techPack, recipeLabel: loaded.activeStyle.recipeId, disabled: this.busy })}` +
        `</section>`
      : "";
    this.options.host.innerHTML = `<details class="project-manager-details"${open ? " open" : ""}>` +
      `<summary>Project & styles · ${escapeHtml(loaded.activeStyle.name)}</summary>` +
      `<div class="project-manager" aria-busy="${this.busy}">` +
      `<p class="project-current"><strong>${escapeHtml(loaded.project.name)}</strong>` +
      `<span>Current style: ${escapeHtml(loaded.activeStyle.name)}</span></p>` +
      `<p id="project-manager-status" role="status" aria-live="polite">${escapeHtml(this.message)}</p>` +
      `${this.progressState ? `<progress id="project-package-progress" max="${Math.max(1, this.progressState.totalBytes)}" value="${Math.min(this.progressState.completedBytes, this.progressState.totalBytes)}" aria-label="Project package progress"></progress><p class="project-package-progress-label">${escapeHtml(progressLabel(this.progressState))}</p>` : ""}` +
      `<section class="project-backup-controls" aria-label="Project backup and switching">` +
      `<label for="project-select">Local project</label><select id="project-select"${this.busy ? " disabled" : ""}>` +
      this.projects.map((project) => `<option value="${escapeHtml(project.project.id)}"${project.project.id === loaded.project.id ? " selected" : ""}>${escapeHtml(project.project.name)}</option>`).join("") +
      `</select><button type="button" data-project-action="switch-project"${this.busy ? " disabled" : ""}>Open selected project</button>` +
      `<div class="project-manager-actions"><button type="button" data-project-action="export-package"${this.busy || !this.options.artworkStore ? " disabled" : ""}>Export project backup</button>` +
      `<button type="button" data-project-action="import-package"${this.busy || !this.options.artworkStore ? " disabled" : ""}>Import project backup</button></div>` +
      `<input id="project-package-file" type="file" accept=".zip,application/zip" hidden aria-label="Choose an InfiniDrip project backup"/>` +
      `</section>` +
      `<label for="project-style-name">Style name</label>` +
      `<input id="project-style-name" type="text" maxlength="80" autocomplete="off" placeholder="Name a new style or rename this one" value="${escapeHtml(this.styleNameDraft)}">` +
      `<div class="project-manager-actions">` +
      `<button type="button" data-project-action="create"${this.busy ? " disabled" : ""}>Create blank style</button>` +
      `<button type="button" data-project-action="duplicate"${this.busy ? " disabled" : ""}>Duplicate current design</button>` +
      `<button type="button" data-project-action="rename"${this.busy ? " disabled" : ""}>Rename current style</button>` +
      `<button type="button" data-project-action="reload"${this.busy ? " disabled" : ""}>Reload project</button>` +
      `</div>` + this.renderStyles(loaded.styles, loaded.activeStyle.id) + techPackEditor +
      this.renderRevisionHistory(loaded) + `</div></details>`;
    this.cancelPortal.hidden = !(this.busy && this.controller);
    if (this.busy && this.controller) {
      this.cancelPortal.querySelector("span")!.textContent = this.message;
    }
  }

  private async run(operation: () => Promise<void>, message = "Saving the style change…"): Promise<void> {
    this.busy = true;
    this.message = message;
    this.options.setBusy(true);
    this.render();
    try {
      await operation();
    } catch (error) {
      this.message = errorMessage(error);
    } finally {
      this.busy = false;
      this.controller = null;
      this.progressState = null;
      this.options.setBusy(false);
      this.render();
    }
  }

  private async runAfterFieldHistory(operation: () => Promise<void>): Promise<void> {
    try {
      await this.options.flushPendingFieldObservations?.();
      await operation();
    } catch (error) {
      this.message = errorMessage(error);
      this.render();
    }
  }

  private nameInput(): HTMLInputElement {
    return this.options.host.querySelector<HTMLInputElement>("#project-style-name")!;
  }

  private async handle(action: ProjectAction, styleId?: string, target?: HTMLElement | null): Promise<void> {
    if (action === "save-tech-pack") {
      const candidate = this.techPackDraft;
      if (!candidate) {
        this.message = "There are no unsaved T01 edits to save.";
        this.render();
        return;
      }
      if (this.techPackInputError) {
        this.message = this.techPackInputError;
        this.render();
        return;
      }
      return this.run(async () => {
        const loaded = await this.options.workflow.saveActiveTechPack(candidate);
        this.discardTechPackDraft();
        const revisionNumber = loaded.activeStyle.techPack.revisionNumber;
        this.message = loaded.activeStyle.revisionHeadId === candidate.revisionId
          ? `No T01 content changed; the saved style revision remains r${revisionNumber}.`
          : `Saved T01 as immutable style revision r${revisionNumber}. The design editor's unsaved edits, if any, remain in place.`;
      }, "Saving the tech-pack revision…");
    }
    if (action === "discard-tech-pack") {
      this.discardTechPackDraft();
      this.message = "Unsaved T01 edits were discarded; the saved tech-pack revision is unchanged.";
      this.render();
      return;
    }
    if (this.techPackDraft && (action === "export-package" || action === "freeze-outputs")) {
      this.message = action === "export-package"
        ? "Save or discard the unsaved T01 edits before exporting a project backup."
        : "Save or discard the unsaved T01 edits before freezing outputs.";
      this.render();
      return;
    }
    const mayLeaveT01Draft = action === "import-package" || action === "switch-project" || action === "create"
      || action === "duplicate" || action === "reload" || action === "switch" || action === "restore-revision";
    if (this.techPackDraft && mayLeaveT01Draft && !this.confirmTechPackDraftDiscard()) return;
    if (action === "export-package") return this.exportPackage();
    if (action === "import-package") {
      this.options.host.querySelector<HTMLInputElement>("#project-package-file")?.click();
      return;
    }
    if (action === "compare-revisions") {
      const left = this.options.host.querySelector<HTMLSelectElement>("#revision-left")?.value ?? this.compareLeftId;
      const right = this.options.host.querySelector<HTMLSelectElement>("#revision-right")?.value ?? this.compareRightId;
      try {
        const paths = this.options.workflow.compareStyleRevisions(left, right);
        this.revisionComparison = paths.length ? paths.map((path) => `• ${path}`).join("\n") : "The saved design and field history are identical.";
        this.compareLeftId = left;
        this.compareRightId = right;
      } catch (error) {
        this.revisionComparison = errorMessage(error);
      }
      this.render();
      return;
    }
    if (action === "restore-revision") {
      const revisionId = target?.dataset.revisionId;
      if (!revisionId) {
        this.message = "The selected revision is missing its identity.";
        this.render();
        return;
      }
      if (this.options.hasUnsavedChanges() && !this.confirm("Restore this saved revision as a new version? Unsaved editor changes will be replaced.")) return;
      return this.run(async () => {
        const loaded = await this.options.workflow.restoreStyleRevision(revisionId);
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.discardTechPackDraft();
        this.revisionComparison = "";
        const head = loaded.styleRevisions.find((revision) => revision.revisionId === loaded.activeStyle.revisionHeadId);
        this.message = `Restored revision as r${head?.revisionNumber ?? "new"}.`;
      }, "Restoring immutable revision…");
    }
    if (action === "freeze-outputs") return this.freezeOutputs();
    if (action === "download-frozen") {
      const manifestId = target?.dataset.manifestId;
      const artifactId = target?.dataset.artifactId;
      if (!manifestId || !artifactId) {
        this.message = "The selected frozen artifact is missing its identity.";
        this.render();
        return;
      }
      return this.downloadFrozenArtifact(manifestId, artifactId);
    }
    if (action === "switch-project") {
      const selectedId = this.options.host.querySelector<HTMLSelectElement>("#project-select")?.value;
      if (!selectedId) {
        this.message = "Choose a local project first.";
        this.render();
        return;
      }
      if (selectedId === this.options.workflow.snapshot.project.id) {
        this.message = "That project is already open.";
        this.render();
        return;
      }
      if (this.options.hasUnsavedChanges() && !this.confirm(
        "This design has unsaved edits. Switch projects and keep the current project's last saved version?")) return;
      return this.run(async () => {
        const loaded = await this.options.workflow.switchProject(selectedId);
        this.options.onStyleLoaded(loaded, recoveryPayloadOrNull(loaded));
        this.discardTechPackDraft();
        this.projects = await this.options.workflow.repository.listProjects();
        this.message = `Opened ${loaded.project.name}.`;
      }, "Opening project…");
    }
    if (action === "create") {
      const name = this.nameInput().value;
      return this.run(async () => {
        const loaded = await this.options.workflow.createStyle(name, this.options.getBlankDesign(), "first-run-default");
        this.styleNameDraft = "";
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.discardTechPackDraft();
        this.message = `Created ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "duplicate") {
      const design = this.options.getCurrentDesign();
      if (!design) {
        this.message = "Correct invalid design values before duplicating this style.";
        this.render();
        return;
      }
      const base = `Copy of ${this.options.workflow.snapshot.activeStyle.name}`;
      const name = base.length <= 80 ? base : `${base.slice(0, 74)}…`;
      return this.run(async () => {
        const loaded = await this.options.workflow.createStyle(name, design, "copied-style");
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.discardTechPackDraft();
        this.message = `Created a copy named ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "rename") {
      const name = this.nameInput().value;
      return this.run(async () => {
        const loaded = await this.options.workflow.renameActiveStyle(name);
        this.styleNameDraft = "";
        this.message = `Renamed style to ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "reload") {
      const hadUnsaved = this.options.hasUnsavedChanges();
      return this.run(async () => {
        const loaded = await this.options.workflow.reload();
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.discardTechPackDraft();
        this.message = hadUnsaved
          ? `Reloaded ${loaded.activeStyle.name}. The latest stored project version is now loaded.`
          : `Reloaded ${loaded.activeStyle.name}.`;
      });
    }
    if (action !== "switch" && action !== "archive" && action !== "restore") {
      this.message = "That style action is not supported.";
      this.render();
      return;
    }
    if (!styleId) {
      this.message = "The selected style action is missing its style ID.";
      this.render();
      return;
    }
    if (action === "switch") {
      const hadUnsaved = this.options.hasUnsavedChanges();
      return this.run(async () => {
        const loaded = await this.options.workflow.switchStyle(styleId);
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.discardTechPackDraft();
        this.message = hadUnsaved
          ? `Switched to ${loaded.activeStyle.name}. The previous style's latest stored version remains available.`
          : `Switched to ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "archive") {
      return this.run(async () => {
        const loaded = await this.options.workflow.archiveStyle(styleId);
        this.message = `Archived ${loaded.styles.find((style) => style.id === styleId)?.name ?? "style"}.`;
      });
    }
    if (action === "restore") {
      return this.run(async () => {
        const loaded = await this.options.workflow.restoreStyle(styleId);
        this.message = `Restored ${loaded.styles.find((style) => style.id === styleId)?.name ?? "style"}.`;
      });
    }
  }

  private async freezeOutputs(): Promise<void> {
    if (this.techPackDraft !== null) {
      this.message = "Save or discard the unsaved T01 edits before freezing outputs.";
      this.render();
      return;
    }
    if (this.options.hasUnsavedChanges()) {
      this.message = "Save the current style before freezing outputs.";
      this.render();
      return;
    }
    const outputSet = await this.options.getFrozenOutputSet?.();
    const revisionId = this.options.workflow.snapshot.activeStyle.revisionHeadId;
    if (!outputSet || !this.options.canFreezeOutputs?.() || !revisionId) {
      this.message = "The seven digital outputs are not ready. Review the current style and digital checks first.";
      this.render();
      return;
    }
    return this.run(async () => {
      const manifest = await this.options.workflow.freezeOutputs(
        outputSet.artifacts,
        outputSet.selectedSizes,
        ["Physical fit, formal colorway approval, supplier-specific requirements and factory acceptance are not verified by this digital capture."],
        revisionId,
        {
          schemaVersion: outputSet.schemaVersion,
          approvalRefs: outputSet.approvalRefs,
          gradePlanFreeze: outputSet.gradePlanFreeze,
        },
      );
      this.message = `Frozen ${manifest.artifacts.length} outputs for revision ${manifest.revisionId.slice(0, 8)} · SHA-256 ${manifest.packetDigest.slice(0, 12)}.`;
    }, "Freezing exact digital output bytes…");
  }

  private async downloadFrozenArtifact(manifestId: string, artifactId: string): Promise<void> {
    return this.run(async () => {
      const { artifact } = await this.options.workflow.readFrozenArtifact(manifestId, artifactId);
      const filename = artifact.displayName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").slice(0, 120) || "frozen-output";
      const saved = this.options.saveFrozenArtifact
        ? await this.options.saveFrozenArtifact(filename, artifact.bytes, artifact.mediaType)
        : await this.downloadPackage(filename, artifact.bytes);
      this.message = saved ? `Downloaded stored bytes for ${filename}.` : `Download canceled for ${filename}.`;
    }, "Verifying frozen output bytes…");
  }

  private packageOptions(signal: AbortSignal) {
    return {
      signal,
      inspectAsset: this.options.inspectAsset,
      ...this.options.packageOptions,
      onProgress: (value: ProjectPackageProgress): void => {
        if (value.phase === "commit") this.controller = null;
        const shouldPaint = value.completedBytes >= this.progressPaintedBytes + 1024 * 1024
          || value.completedBytes >= value.totalBytes || value.phase !== this.progressState?.phase;
        this.progressState = value;
        if (shouldPaint) {
          this.progressPaintedBytes = value.completedBytes;
          this.message = progressLabel(value);
          this.render();
        }
      },
    };
  }

  private async exportPackage(): Promise<void> {
    const artworkStore = this.options.artworkStore;
    if (!artworkStore) {
      this.message = "Project backup is unavailable because local artwork storage is not connected.";
      this.render();
      return;
    }
    return this.run(async () => {
      const controller = new AbortController();
      this.controller = controller;
      this.progressPaintedBytes = 0;
      this.render();
      const snapshot = await this.options.workflow.repository.readProjectBundle(this.options.workflow.snapshot.project.id);
      if (!snapshot) throw new ProjectPackageError("storage", "The active project disappeared before its backup could be created.");
      const blob = await createProjectPackage(snapshot, artworkStore, this.packageOptions(controller.signal));
      const saved = this.options.savePackage
        ? await this.options.savePackage(projectPackageFilename(snapshot.project.name), blob)
        : await this.downloadPackage(projectPackageFilename(snapshot.project.name), blob);
      this.message = saved ? "Project backup exported." : "Backup export canceled; the project was unchanged.";
    }, "Preparing project backup…");
  }

  private async importPackage(file: File): Promise<void> {
    const artworkStore = this.options.artworkStore;
    if (!artworkStore) {
      this.message = "Project backup is unavailable because local artwork storage is not connected.";
      this.render();
      return;
    }
    return this.run(async () => {
      const controller = new AbortController();
      this.controller = controller;
      this.progressPaintedBytes = 0;
      this.render();
      if (file.size > 256 * 1024 * 1024) throw new ProjectPackageError("limit-exceeded", "Project backup must be no larger than 256 MiB.");
      const archive = await readProjectPackage(file, this.packageOptions(controller.signal));
      const options = this.packageOptions(controller.signal);
      const initialResult = await importProjectPackage(
        this.options.workflow.repository, artworkStore, archive, false, options,
      );
      let result: Exclude<typeof initialResult, { readonly status: "copy-required" }>;
      if (initialResult.status === "copy-required") {
        const confirmCopy = (message: string): boolean => this.confirm(message);
        if (!confirmCopy(initialResult.reason + "\n\nImport this backup as a separate copy?")) {
          this.message = "Project backup import canceled; local data was unchanged.";
          return;
        }
        result = await importProjectPackage(
          this.options.workflow.repository, artworkStore, archive, true, options,
        );
      } else {
        result = initialResult;
      }
      if (result.status === "already-imported") {
        this.message = `This project backup was already imported on ${new Date(result.receipt.importedAt).toLocaleString()}.`;
        this.projects = await this.options.workflow.repository.listProjects();
        return;
      }
      const loaded = await this.options.workflow.reload();
      this.options.onStyleLoaded(loaded, recoveryPayloadOrNull(loaded));
      this.discardTechPackDraft();
      this.projects = await this.options.workflow.repository.listProjects();
      this.message = result.importedAsCopy
        ? `Imported a separate copy: ${loaded.project.name}.`
        : `Imported project: ${loaded.project.name}.`;
    }, "Checking project backup…");
  }

  private async downloadPackage(filename: string, blob: Blob): Promise<boolean> {
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      return true;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  private confirm(message: string): boolean {
    return this.options.confirm ? this.options.confirm(message) : window.confirm(message);
  }
}
