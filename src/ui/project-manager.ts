import type { LoadedProject, ProjectRepositoryError } from "./project-repository";
import { isCustomOneSizeStyle } from "./project-records";
import type { RecoveryPayload, SavedDesign, StyleRecord } from "./project-records";
import { GARMENTS, garmentOptionsForStyle } from "../drafting";
import { ProjectWorkflow, type TechPackShareFreezeInput } from "./project-workflow";
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
import {
  TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION,
  VNECK_BAND_EXPORT_MANIFEST_SCHEMA_VERSION,
  type FrozenArtifactInput,
} from "./style-revisions";
import type { GradePlanRecord } from "./grade-plan";
import type { FieldEvidenceStatus, FieldProvenance, FieldValidationStatus } from "./field-provenance";
import { TECH_PACK_T02_RECORD_VERSION, TECH_PACK_T03_RECORD_VERSION, parseTechPackRecord } from "./tech-pack-records";
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
import { renderTechPackT02Editor } from "./tech-pack-t02-editor";
import { evaluateTechPackT02 } from "./tech-pack-t02-validation";
import {
  renderTechPackOperationEditor,
  renderTechPackOperationRows,
  renderTechPackOperationValidation,
} from "./tech-pack-operation-editor";
import { evaluateTechPackOperationRecordSet } from "./tech-pack-operation-validation";
import { buildTechPackReferenceReconciliation } from "./tech-pack-operation-reconciliation";
import {
  TECH_PACK_OPERATION_RECIPE_IDS,
  TECH_PACK_OPERATION_RECORD_VERSION_V2,
  emptyTechPackOperationRecordSetV2,
  parseTechPackOperationRecordSet,
  unresolvedTechPackOperation,
  type TechPackOperationRecipeId,
  type TechPackOperationRecordSet,
} from "./tech-pack-operation-records";
import { TECH_PACK_POM_RECIPE_IDS, TECH_PACK_POM_UNITS, type TechPackPomDefinition, type TechPackPomRecipeId } from "./tech-pack-pom-records";
import { techPackShareScopeGroups } from "./tech-pack-sharing";
import {
  emptyTechPackPomRecordSet,
  parseTechPackPomRecordSet,
  type TechPackPomRecordSet,
  type TechPackPomSampleQaRound,
  type TechPackPomSampleReading,
  type TechPackPomQaObservation,
} from "./tech-pack-sample-qa-records";

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
    readonly schemaVersion?: 1 | 2 | typeof VNECK_BAND_EXPORT_MANIFEST_SCHEMA_VERSION;
    readonly approvalRefs?: readonly string[];
    readonly gradePlanFreeze?: { readonly record: GradePlanRecord; readonly approvalRef: string };
  } | null | Promise<{
    readonly artifacts: readonly FrozenArtifactInput[];
    readonly selectedSizes: readonly { readonly sizeId: string; readonly label: string }[];
    readonly schemaVersion?: 1 | 2 | typeof VNECK_BAND_EXPORT_MANIFEST_SCHEMA_VERSION;
    readonly approvalRefs?: readonly string[];
    readonly gradePlanFreeze?: { readonly record: GradePlanRecord; readonly approvalRef: string };
  } | null>;
  readonly getTechPackShareOutput?: (expectedRevisionId: string) => Promise<TechPackShareFreezeInput | null>;
  readonly saveFrozenArtifact?: (filename: string, bytes: Blob, mediaType: string) => Promise<boolean>;
  readonly confirm?: (message: string) => boolean;
  readonly packageOptions?: Pick<ProjectPackageOptions, "idFactory" | "now">;
  readonly initialStatusMessage?: string;
  readonly techPackIdFactory?: () => string;
}

type ProjectAction = "create" | "duplicate" | "rename" | "reload" | "switch" | "archive" | "restore"
  | "switch-project" | "export-package" | "import-package" | "compare-revisions" | "restore-revision"
  | "freeze-outputs" | "download-frozen" | "save-tech-pack" | "discard-tech-pack"
  | "begin-tech-pack-review" | "approve-tech-pack-review" | "freeze-tech-pack-share";

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
  private techPackDefinitionsJsonDraft: string | null = null;
  private techPackOperationsJsonDraft: string | null = null;
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
      const summaryHadFocus = target.querySelector("summary") === document.activeElement;
      this.projectManagerOpen = target.open;
      this.render();
      if (summaryHadFocus) {
        this.options.host.querySelector<HTMLElement>(".project-manager-details > summary")?.focus();
      }
    }, true);
    options.host.addEventListener("input", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.id === "project-style-name") {
        this.styleNameDraft = target.value;
        return;
      }
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        if (target.dataset.t01Input === "true") this.updateTechPackFromControl(target);
        else if (target.dataset.t02Input) this.updateT02TechPackFromControl(target);
        else if (target.dataset.t03Input === "operations" && target instanceof HTMLTextAreaElement) this.updateT03TechPackFromControl(target);
      }
    });
    options.host.addEventListener("click", (event) => {
      const t03Target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-t03-action]") : null;
      if (t03Target && !this.busy) {
        event.preventDefault();
        this.handleT03TechPackAction(t03Target);
        return;
      }
      const t02Target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-t02-action]") : null;
      if (t02Target && !this.busy) {
        event.preventDefault();
        this.handleT02TechPackAction(t02Target);
        return;
      }
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
      if (target instanceof HTMLInputElement && target.dataset.techPackShareScope) {
        const groups = techPackShareScopeGroups(this.options.workflow.snapshot.activeStyle.techPack);
        const chosenIds = new Set([...this.options.host.querySelectorAll<HTMLInputElement>("[data-tech-pack-share-scope]:checked")]
          .map((input) => input.dataset.techPackShareScope));
        const count = groups.filter((group) => chosenIds.has(group.id))
          .reduce((sum, group) => sum + group.fieldIds.length, 0);
        const start = this.options.host.querySelector<HTMLButtonElement>("[data-project-action='begin-tech-pack-review']");
        if (start) start.disabled = this.busy || this.techPackDraft !== null || this.options.hasUnsavedChanges() || count === 0;
        const status = this.options.host.querySelector<HTMLElement>("[data-tech-pack-share-scope-count]");
        if (status) status.textContent = `${count} fields selected`;
        return;
      }
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
      if (target instanceof HTMLSelectElement && target.dataset.t02Input) {
        this.updateT02TechPackFromControl(target);
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
        ? this.techPackDraft.schemaVersion === 1
          ? "Save or discard the unsaved T01 edits before freezing outputs."
          : "Save or discard unsaved tech-pack edits before freezing outputs."
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
    this.techPackInputError = this.pendingTechPackJsonError(updated);
    this.updateTechPackStatus("Unsaved T01 edits. Save the tech pack to create one immutable revision.");
  }

  private discardTechPackDraft(): void {
    this.techPackDraft = null;
    this.techPackDefinitionsJsonDraft = null;
    this.techPackOperationsJsonDraft = null;
    this.techPackInputError = "";
  }

  private t02Data(record: TechPackRecord): TechPackPomRecordSet | null {
    if (record.pomData) return record.pomData;
    if (!TECH_PACK_POM_RECIPE_IDS.includes(record.recipeId as TechPackPomRecipeId)) return null;
    return emptyTechPackPomRecordSet(record.recipeId as TechPackPomRecipeId);
  }

  private t02DataWithPendingDefinitionDraft(record: TechPackRecord): { data: TechPackPomRecordSet | null; error: string | null } {
    const data = this.t02Data(record);
    if (!data || this.techPackDefinitionsJsonDraft === null) return { data, error: null };
    try {
      const parsedJson: unknown = JSON.parse(this.techPackDefinitionsJsonDraft);
      const parsed = parseTechPackPomRecordSet({ ...data, definitions: parsedJson }, record.recipeId);
      return parsed.ok ? { data: parsed.value, error: null } : { data: null, error: parsed.error };
    } catch {
      return { data: null, error: "POM definitions must be valid JSON matching the displayed schema." };
    }
  }

  private applyT02Draft(record: TechPackRecord, data: TechPackPomRecordSet): void {
    const candidate: TechPackRecord = record.schemaVersion === TECH_PACK_T03_RECORD_VERSION
      ? { ...record, pomData: data }
      : { ...record, schemaVersion: TECH_PACK_T02_RECORD_VERSION, pomData: data };
    const parsed = parseTechPackRecord(candidate);
    this.techPackDraft = parsed.ok ? parsed.value : candidate;
    this.techPackInputError = parsed.ok ? this.pendingTechPackJsonError(parsed.value) : parsed.error;
    this.updateTechPackStatus(parsed.ok
      ? "Unsaved T02 edits. Save the tech pack to create one immutable revision."
      : `T02 edit needs attention: ${parsed.error}`);
  }

  private t03Data(record: TechPackRecord): TechPackOperationRecordSet | null {
    if (record.operationData) return record.operationData;
    if (!TECH_PACK_OPERATION_RECIPE_IDS.includes(record.recipeId as TechPackOperationRecipeId)) return null;
    return emptyTechPackOperationRecordSetV2(record.recipeId as TechPackOperationRecipeId);
  }

  private t03DataWithPendingDraft(record: TechPackRecord): { data: TechPackOperationRecordSet | null; error: string | null } {
    const data = this.t03Data(record);
    if (!data || this.techPackOperationsJsonDraft === null) return { data, error: null };
    try {
      const parsedJson: unknown = JSON.parse(this.techPackOperationsJsonDraft);
      const parsed = parseTechPackOperationRecordSet(parsedJson, record.recipeId as TechPackOperationRecipeId);
      return parsed.ok ? { data: parsed.value, error: null } : { data: null, error: parsed.error };
    } catch {
      return { data: null, error: "T03 operation records must be valid JSON matching the displayed schema." };
    }
  }

  private pendingTechPackJsonError(record: TechPackRecord): string {
    const t02 = this.t02DataWithPendingDefinitionDraft(record);
    if (t02.error) return `POM definition needs attention: ${t02.error}`;
    const t03 = this.t03DataWithPendingDraft(record);
    return t03.error ? `T03 operation record needs attention: ${t03.error}` : "";
  }

  private applyT03Draft(record: TechPackRecord, data: TechPackOperationRecordSet): void {
    const pomData = record.pomData ?? (TECH_PACK_POM_RECIPE_IDS.includes(record.recipeId as TechPackPomRecipeId)
      ? emptyTechPackPomRecordSet(record.recipeId as TechPackPomRecipeId)
      : null);
    if (!pomData) {
      this.techPackInputError = "T03 operation editing requires a supported recipe with a T02 record contract.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const candidate: TechPackRecord = {
      ...record,
      schemaVersion: TECH_PACK_T03_RECORD_VERSION,
      pomData,
      operationData: data,
    };
    const parsed = parseTechPackRecord(candidate);
    this.techPackDraft = parsed.ok ? parsed.value : candidate;
    this.techPackInputError = parsed.ok ? this.pendingTechPackJsonError(parsed.value) : parsed.error;
    this.updateTechPackStatus(parsed.ok
      ? "Unsaved T03 operation edits. Save the tech pack to create one immutable revision."
      : `T03 operation edit needs attention: ${parsed.error}`);
  }

  private updateT03TechPackFromControl(target: HTMLTextAreaElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T03 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    this.techPackOperationsJsonDraft = target.value;
    let operationData: unknown;
    try {
      operationData = JSON.parse(target.value);
    } catch {
      const error = "T03 operation records must be valid JSON matching the displayed schema.";
      this.techPackInputError = error;
      this.updateTechPackStatus(this.techPackInputError);
      this.updateT03OperationFeedback(null, error);
      return;
    }
    const parsed = parseTechPackOperationRecordSet(operationData, record.recipeId as TechPackOperationRecipeId);
    if (!parsed.ok) {
      const error = `T03 operation record needs attention: ${parsed.error}`;
      this.techPackInputError = error;
      this.updateTechPackStatus(this.techPackInputError);
      this.updateT03OperationFeedback(null, error);
      return;
    }
    this.applyT03Draft(record, parsed.value);
    this.updateT03OperationFeedback(parsed.value, null);
  }

  private updateT03OperationFeedback(data: TechPackOperationRecordSet | null, error: string | null): void {
    const editor = this.options.host.querySelector<HTMLElement>(".t03-editor");
    if (!editor) return;
    const operations = editor.querySelector<HTMLElement>(".t03-operations");
    if (data && operations) operations.innerHTML = renderTechPackOperationRows(data, this.busy);
    const validation = editor.querySelector<HTMLElement>(".t03-validation");
    if (!validation) return;
    validation.innerHTML = renderTechPackOperationValidation(
      data ? evaluateTechPackOperationRecordSet(data) : null,
      error,
    );
  }

  private handleT03TechPackAction(target: HTMLElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T03 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const pending = this.t03DataWithPendingDraft(record);
    if (pending.error) {
      this.techPackInputError = `T03 operation record needs attention: ${pending.error}`;
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    if (!pending.data) {
      this.techPackInputError = "This recipe has no T03 operation record contract.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    let operations = [...pending.data.operations];
    const action = target.dataset.t03Action;
    if (action === "add-unresolved-operation") {
      let sequence = 1;
      let operationId = `operation-${sequence}`;
      while (operations.some((operation) => operation.id === operationId)) {
        sequence += 1;
        operationId = `operation-${sequence}`;
      }
      operations.push(unresolvedTechPackOperation(operationId));
    } else if (action === "remove-operation") {
      const operationId = target.dataset.t03OperationId;
      if (!operationId || !operations.some((operation) => operation.id === operationId)) {
        this.techPackInputError = "The selected T03 operation no longer exists.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      operations = operations.filter((operation) => operation.id !== operationId);
    } else {
      this.techPackInputError = "That T03 operation action is not supported.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const parsed = parseTechPackOperationRecordSet({
      schemaVersion: TECH_PACK_OPERATION_RECORD_VERSION_V2,
      recipeId: pending.data.recipeId,
      operations,
    }, record.recipeId as TechPackOperationRecipeId);
    if (!parsed.ok) {
      this.techPackInputError = `T03 operation edit needs attention: ${parsed.error}`;
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    this.techPackOperationsJsonDraft = JSON.stringify(parsed.value, null, 2);
    this.applyT03Draft(record, parsed.value);
    this.render();
  }

  private updateT02TechPackFromControl(target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T02 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const inputKind = target.dataset.t02Input;
    if (inputKind === "definitions" && target instanceof HTMLTextAreaElement) {
      this.techPackDefinitionsJsonDraft = target.value;
      let definitions: unknown;
      try {
        definitions = JSON.parse(target.value);
      } catch {
        this.techPackInputError = "POM definitions must be valid JSON matching the displayed schema.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      const prior = this.t02Data(record);
      if (!prior) {
        this.techPackInputError = "This recipe has no T02 POM record contract.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      const parsed = parseTechPackPomRecordSet({ ...prior, definitions }, record.recipeId);
      if (!parsed.ok) {
        this.techPackInputError = `POM definition needs attention: ${parsed.error}`;
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      this.applyT02Draft(record, parsed.value);
      return;
    }
    const pending = this.t02DataWithPendingDefinitionDraft(record);
    const data = pending.data;
    if (pending.error) {
      this.techPackInputError = `POM definition needs attention: ${pending.error}`;
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    if (!data) {
      this.techPackInputError = "This recipe has no T02 POM record contract.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const roundId = target.dataset.t02RoundId;
    const round = data.sampleQaRounds.find((candidate) => candidate.id === roundId);
    if (!round || !inputKind) {
      this.techPackInputError = "The edited T02 control is no longer connected to a sample/QA record.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const property = target.dataset.t02Property;
    const value = target.value;
    let updatedRound: TechPackPomSampleQaRound | null = null;
    if (inputKind === "round" && (property === "sampleLabel" || property === "sampleSizeId" || property === "recordedBy")) {
      updatedRound = { ...round, [property]: value };
    } else if (inputKind === "reading") {
      const pomId = target.dataset.t02PomId;
      const reading = round.readings.find((candidate) => candidate.pomDefinitionId === pomId);
      if (!reading || !property) {
        this.techPackInputError = "The edited T02 reading no longer exists. Reload before continuing.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      let next: TechPackPomSampleReading | null = null;
      if (reading.status === "MEASURED" && property === "actualValue" && target instanceof HTMLInputElement) {
        next = { ...reading, actualValue: target.value === "" ? null : target.valueAsNumber };
      } else if (reading.status === "MEASURED" && property === "method") {
        next = { ...reading, method: value };
      } else if (reading.status === "MEASURED" && property === "evidenceRefs" && target instanceof HTMLTextAreaElement) {
        next = { ...reading, evidenceRefs: value.split(/\r?\n/).filter((entry) => entry.length > 0) };
      } else if (reading.status === "UNRESOLVED" && property === "unresolvedReason") {
        next = { ...reading, unresolvedReason: value };
      } else if (reading.status === "UNRESOLVED" && property === "nextAction") {
        next = { ...reading, nextAction: value };
      }
      if (next) updatedRound = { ...round, readings: round.readings.map((candidate) => candidate.pomDefinitionId === pomId ? next! : candidate) };
    } else if (inputKind === "observation") {
      const observationId = target.dataset.t02ObservationId;
      const observation = round.qaObservations.find((candidate) => candidate.id === observationId);
      if (!observation || !property) {
        this.techPackInputError = "The edited T02 QA observation no longer exists. Reload before continuing.";
        this.updateTechPackStatus(this.techPackInputError);
        return;
      }
      let next: TechPackPomQaObservation | null = null;
      if (property === "status" && (value === "OBSERVED" || value === "UNRESOLVED")) {
        next = { ...observation, status: value };
      } else if (property === "note") {
        next = { ...observation, note: value };
      } else if (property === "nextAction") {
        next = { ...observation, nextAction: value === "" ? null : value };
      }
      if (next) updatedRound = { ...round, qaObservations: round.qaObservations.map((candidate) => candidate.id === observationId ? next! : candidate) };
    }
    if (!updatedRound) {
      this.techPackInputError = "The edited T02 control is not connected to a supported record field.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const updatedData = { ...data, sampleQaRounds: data.sampleQaRounds.map((candidate) => candidate.id === roundId ? updatedRound! : candidate) };
    this.applyT02Draft(record, updatedData);
  }

  private handleT02TechPackAction(target: HTMLElement): void {
    const record = this.currentTechPackRecord();
    if (!record) {
      this.techPackInputError = "This T02 edit belongs to another style. Reload the active project before continuing.";
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    const pending = this.t02DataWithPendingDefinitionDraft(record);
    const data = pending.data;
    if (pending.error) {
      this.techPackInputError = `POM definition needs attention: ${pending.error}`;
      this.updateTechPackStatus(this.techPackInputError);
      return;
    }
    if (!data) {
      this.updateTechPackStatus("This recipe has no T02 POM record contract.");
      return;
    }
    const action = target.dataset.t02Action;
    const id = () => techPackRecordId(this.options.techPackIdFactory);
    const rounds = [...data.sampleQaRounds];
    const definitions = [...data.definitions.definitions];
    let nextData: TechPackPomRecordSet = data;
    const roundId = target.dataset.t02RoundId;
    const round = rounds.find((candidate) => candidate.id === roundId);
    const invalid = (message: string): void => { this.updateTechPackStatus(message); };
    if (action === "add-definition") {
      const host = target.closest<HTMLElement>(".t02-add-definition");
      const pomId = host?.querySelector<HTMLInputElement>("[data-t02-new-pom-id]")?.value ?? "";
      const label = host?.querySelector<HTMLInputElement>("[data-t02-new-pom-label]")?.value ?? "";
      const unit = host?.querySelector<HTMLSelectElement>("[data-t02-new-pom-unit]")?.value ?? "";
      if (!pomId.trim() || !label.trim() || !TECH_PACK_POM_UNITS.includes(unit as TechPackPomDefinition["unit"])) {
        invalid("Enter an explicit stable POM ID, label, and unit before adding the definition."); return;
      }
      const unresolved = (fact: string) => ({
        status: "UNRESOLVED" as const, value: null, unresolvedReason: "No source has been recorded for this POM fact.",
        nextAction: `Review an authoritative garment source for ${fact}.`,
      });
      const definition: TechPackPomDefinition = {
        id: pomId.trim(), label: label.trim(), unit: unit as TechPackPomDefinition["unit"],
        method: unresolved("the measurement method"), landmarks: unresolved("the measurement landmarks"),
        tolerance: unresolved("the tolerance"), sizeRangeSource: unresolved("the size range"), gradeRuleSource: unresolved("the grade rule"),
      };
      nextData = { ...data, definitions: { ...data.definitions, definitions: [...definitions, definition] } };
      this.techPackDefinitionsJsonDraft = null;
    } else if (action === "remove-definition") {
      const pomId = target.dataset.t02PomId;
      if (!pomId || !definitions.some((definition) => definition.id === pomId)) { invalid("The selected POM definition is missing from this T02 record."); return; }
      if (rounds.some((candidate) => candidate.readings.some((reading) => reading.pomDefinitionId === pomId))) {
        invalid("Remove this POM's sample readings before removing its definition."); return;
      }
      nextData = { ...data, definitions: { ...data.definitions, definitions: definitions.filter((definition) => definition.id !== pomId) } };
      this.techPackDefinitionsJsonDraft = null;
    } else if (action === "add-round") {
      const host = target.closest<HTMLElement>(".t02-add-round");
      const revisionId = host?.querySelector<HTMLSelectElement>("[data-t02-new-round-revision]")?.value ?? "";
      const sampleLabel = host?.querySelector<HTMLInputElement>("[data-t02-new-round-label]")?.value.trim() ?? "";
      const sampleSizeId = host?.querySelector<HTMLInputElement>("[data-t02-new-round-size]")?.value.trim() ?? "";
      const recordedBy = host?.querySelector<HTMLInputElement>("[data-t02-new-round-recorder]")?.value.trim() ?? "";
      const activeStyleId = this.options.workflow.snapshot.activeStyle.id;
      const revision = this.options.workflow.snapshot.styleRevisions.find((candidate) => candidate.styleId === activeStyleId && candidate.revisionId === revisionId);
      if (!revision || !sampleLabel || !sampleSizeId || !recordedBy) {
        invalid("Choose an existing style revision and enter a sample label, size ID, and recorder before creating this round."); return;
      }
      rounds.push({ id: id(), targetRevisionId: revision.revisionId, targetRevisionNumber: revision.revisionNumber,
        sampleLabel, sampleSizeId, recordedAt: new Date().toISOString(), recordedBy, readings: [], qaObservations: [] });
      nextData = { ...data, sampleQaRounds: rounds };
    } else if (action === "remove-round") {
      if (!roundId || !round) { invalid("The selected sample/QA round is missing."); return; }
      nextData = { ...data, sampleQaRounds: rounds.filter((candidate) => candidate.id !== roundId) };
    } else if (action === "add-measured-reading" || action === "add-unresolved-reading") {
      if (!round) { invalid("The selected sample/QA round is missing."); return; }
      const host = target.closest<HTMLElement>(action === "add-measured-reading" ? ".t02-add-reading" : ".t02-add-unresolved-reading");
      const selector = action === "add-measured-reading" ? `[data-t02-new-reading-pom="${round.id}"]` : `[data-t02-new-unresolved-pom="${round.id}"]`;
      const pomId = host?.querySelector<HTMLSelectElement>(selector)?.value ?? "";
      const definition = definitions.find((candidate) => candidate.id === pomId);
      if (!definition || round.readings.some((reading) => reading.pomDefinitionId === pomId)) {
        invalid("Choose an existing POM definition that has no reading in this round."); return;
      }
      let reading: TechPackPomSampleReading;
      if (action === "add-measured-reading") {
        const actual = host?.querySelector<HTMLInputElement>(`[data-t02-new-reading-value="${round.id}"]`);
        const method = host?.querySelector<HTMLInputElement>(`[data-t02-new-reading-method="${round.id}"]`)?.value.trim() ?? "";
        const evidence = host?.querySelector<HTMLTextAreaElement>(`[data-t02-new-reading-evidence="${round.id}"]`)?.value ?? "";
        if (!actual || actual.value === "" || !Number.isFinite(actual.valueAsNumber) || !method) {
          invalid("Enter an explicit finite sample actual and measurement method."); return;
        }
        reading = { pomDefinitionId: pomId, status: "MEASURED", actualValue: actual.valueAsNumber, unit: definition.unit, method,
          evidenceRefs: evidence.split(/\r?\n/).filter((entry) => entry.length > 0), unresolvedReason: null, nextAction: null };
      } else {
        const reason = host?.querySelector<HTMLInputElement>(`[data-t02-new-unresolved-reason="${round.id}"]`)?.value.trim() ?? "";
        const nextAction = host?.querySelector<HTMLInputElement>(`[data-t02-new-unresolved-action="${round.id}"]`)?.value.trim() ?? "";
        if (!reason || !nextAction) { invalid("An unresolved sample reading needs a reason and actionable next step."); return; }
        reading = { pomDefinitionId: pomId, status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: reason, nextAction };
      }
      const updatedRound = { ...round, readings: [...round.readings, reading] };
      nextData = { ...data, sampleQaRounds: rounds.map((candidate) => candidate.id === round.id ? updatedRound : candidate) };
    } else if (action === "remove-reading") {
      if (!round) { invalid("The selected sample/QA round is missing."); return; }
      const pomId = target.dataset.t02PomId;
      if (!pomId || !round.readings.some((reading) => reading.pomDefinitionId === pomId)) { invalid("The selected sample reading is missing."); return; }
      nextData = { ...data, sampleQaRounds: rounds.map((candidate) => candidate.id === round.id
        ? { ...candidate, readings: candidate.readings.filter((reading) => reading.pomDefinitionId !== pomId) } : candidate) };
    } else if (action === "add-observation") {
      if (!round) { invalid("The selected sample/QA round is missing."); return; }
      const host = target.closest<HTMLElement>(".t02-add-observation");
      const status = host?.querySelector<HTMLSelectElement>(`[data-t02-new-observation-status="${round.id}"]`)?.value ?? "";
      const note = host?.querySelector<HTMLTextAreaElement>(`[data-t02-new-observation-note="${round.id}"]`)?.value.trim() ?? "";
      const actionText = host?.querySelector<HTMLInputElement>(`[data-t02-new-observation-action="${round.id}"]`)?.value.trim() ?? "";
      if ((status !== "OBSERVED" && status !== "UNRESOLVED") || !note || (status === "UNRESOLVED" && !actionText)) {
        invalid("Choose Observed or Unresolved and enter a note; unresolved items also need a next action."); return;
      }
      const observation: TechPackPomQaObservation = { id: id(), status, note, nextAction: actionText || null };
      nextData = { ...data, sampleQaRounds: rounds.map((candidate) => candidate.id === round.id
        ? { ...candidate, qaObservations: [...candidate.qaObservations, observation] } : candidate) };
    } else if (action === "remove-observation") {
      if (!round) { invalid("The selected sample/QA round is missing."); return; }
      const observationId = target.dataset.t02ObservationId;
      if (!observationId || !round.qaObservations.some((observation) => observation.id === observationId)) { invalid("The selected QA observation is missing."); return; }
      nextData = { ...data, sampleQaRounds: rounds.map((candidate) => candidate.id === round.id
        ? { ...candidate, qaObservations: candidate.qaObservations.filter((observation) => observation.id !== observationId) } : candidate) };
    } else {
      invalid("That T02 sample/QA action is not supported."); return;
    }
    const parsed = parseTechPackPomRecordSet(nextData, record.recipeId);
    if (!parsed.ok) { invalid(`T02 change needs attention: ${parsed.error}`); return; }
    this.applyT02Draft(record, parsed.value);
    this.render();
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
    return this.confirm(this.techPackDraft.schemaVersion === 1
      ? "Discard the unsaved T01 editor changes? The saved tech-pack revision will remain unchanged."
      : "Discard the unsaved tech-pack editor changes? The saved revision will remain unchanged.");
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

  private renderTechPackShareControls(record: TechPackRecord, loaded: LoadedProject): string {
    const approval = record.approval;
    const groups = techPackShareScopeGroups(record);
    const selected = new Set(approval.scopeFieldIds);
    const state = approval.state;
    const hasHistoricalShare = loaded.exportManifests.some((manifest) => manifest.styleId === record.styleId
      && manifest.schemaVersion === TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION
      && manifest.revisionId !== loaded.activeStyle.revisionHeadId);
    const unsaved = this.techPackDraft !== null || this.options.hasUnsavedChanges();
    const stageLabel = state === "DRAFT" ? "Draft" : state === "REVIEW" ? "In review"
      : state === "APPROVED" ? "Scoped approval recorded" : "Frozen for local share";
    const stageAction = state === "DRAFT" ? "begin-tech-pack-review"
      : state === "REVIEW" ? "approve-tech-pack-review"
        : state === "APPROVED" ? "freeze-tech-pack-share" : null;
    const stageText = unsaved ? "Save or discard current edits before changing local review or share state."
      : state === "DRAFT" ? "Select the fields included in this review."
      : state === "REVIEW" ? "Review scope is locked to these saved fields."
        : state === "APPROVED" ? "The local share will bind the ZIP, PDF, selected sections and current revision."
          : `Frozen manifest ${approval.manifestId ?? "unavailable"}`;
    const historicalShareNextStep = state === "DRAFT"
      ? "Start a new scoped review, approve it and freeze a new share before sharing this revision."
      : state === "REVIEW"
        ? "Complete and approve the current scoped review, then freeze a new share before sharing this revision."
        : state === "APPROVED"
          ? "Freeze the current approved revision to create a new share."
          : "A current share now exists; use Immutable revisions to retrieve earlier files.";
    const selectedCount = approval.scopeFieldIds.length;
    const disabled = this.busy || unsaved || !record.revisionId;
    const stageDisabled = disabled || groups.length === 0 || (state === "DRAFT" && selectedCount === 0)
      || (state === "APPROVED" && !this.options.getTechPackShareOutput);
    const scopeControls = groups.map((group) => {
      const checked = group.fieldIds.every((fieldId) => selected.has(fieldId));
      return `<label><input type="checkbox" data-tech-pack-share-scope="${escapeHtml(group.id)}"${checked ? " checked" : ""}`
        + `${disabled || state !== "DRAFT" ? " disabled" : ""}> ${escapeHtml(group.label)} · ${group.fieldIds.length} fields</label>`;
    }).join("");
    const actor = approval.changedBy ?? "";
    return `<section class="project-tech-pack-share" aria-label="Local Tech Pack review and share">`
      + `<h4>Scoped local review and share</h4>`
      + `<p>State: <strong>${stageLabel}</strong> · saved revision ${escapeHtml(record.revisionId ?? "not saved")}. `
      + `Reviewer labels are self-attested locally; this does not establish identity, physical fit, supplier acceptance or production readiness.</p>`
      + (hasHistoricalShare ? `<p class="project-tech-pack-share-stale" role="status" aria-live="polite">Earlier frozen Tech Pack shares are historical and stale for the current saved revision. Their original bytes remain available under Immutable revisions. ${historicalShareNextStep}</p>` : "")
      + `<label for="tech-pack-share-actor">Local reviewer label (self-attested)</label>`
      + `<input id="tech-pack-share-actor" type="text" maxlength="120" autocomplete="name" value="${escapeHtml(actor)}"${disabled ? " disabled" : ""}>`
      + `<fieldset><legend>Fields in this review scope</legend>${scopeControls}</fieldset>`
      + `<p>${escapeHtml(stageText)} <span data-tech-pack-share-scope-count>${state === "DRAFT" ? "0 fields selected" : `${selectedCount} fields are bound to this approval`}</span></p>`
      + (stageAction ? `<button type="button" data-project-action="${stageAction}"${stageDisabled ? " disabled" : ""}>`
        + `${state === "DRAFT" ? "Start review for selected fields" : state === "REVIEW" ? "Approve this revision and scope" : "Freeze local share"}</button>` : "")
      + `<p>Editing and saving a new Tech Pack revision returns its review state to Draft and keeps earlier frozen bytes available.</p>`
      + `</section>`;
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
    const frozenRows = manifests.length ? `<ol>${manifests.map((manifest) => {
      const sourceRevision = revisions.find((revision) => revision.revisionId === manifest.revisionId);
      const revisionStatus = manifest.revisionId === loaded.activeStyle.revisionHeadId
        ? "Current for saved revision"
        : `Historical${sourceRevision ? ` r${sourceRevision.revisionNumber}` : ""} · stale for current revision`;
      return `<li><span>Captured ${escapeHtml(manifest.capturedAt)} · ${revisionStatus}` +
      `<br><code>${escapeHtml(manifest.packetDigest)}</code> · ${manifest.artifacts.length} verified files</span>` +
      `<ul>${manifest.artifacts.map((artifact) => `<li><button type="button" data-project-action="download-frozen"` +
        ` data-manifest-id="${escapeHtml(manifest.manifestId)}" data-artifact-id="${escapeHtml(artifact.artifactId)}"${this.busy ? " disabled" : ""}>Download ${escapeHtml(artifact.displayName)}</button>` +
        ` · ${artifact.byteLength} bytes · SHA-256 ${escapeHtml(artifact.sha256.slice(0, 12))}</li>`).join("")}</ul></li>`
    }).join("")}</ol>` : `<p>No frozen output captures.</p>`;
    const hasUnsavedChanges = this.options.hasUnsavedChanges();
    const hasUnsavedTechPack = this.techPackDraft !== null;
    const outputsReady = this.options.canFreezeOutputs?.() === true;
    const freezeBlocker = this.options.getFreezeBlocker?.() ?? null;
    const canFreeze = !this.busy && !hasUnsavedChanges && !hasUnsavedTechPack && outputsReady && freezeBlocker === null;
    const freezeGuidance = this.busy ? "" : hasUnsavedChanges
      ? "Save the current style before freezing outputs."
      : hasUnsavedTechPack
        ? this.techPackDraft?.schemaVersion === 1
          ? "Save or discard the unsaved T01 edits before freezing outputs."
          : "Save or discard unsaved tech-pack edits before freezing outputs."
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
    const activeTechPackRecord = open ? this.currentTechPackRecord() ?? loaded.activeStyle.techPack : null;
    const pendingT02 = activeTechPackRecord ? this.t02DataWithPendingDefinitionDraft(activeTechPackRecord) : null;
    const t02Recipe = activeTechPackRecord ? GARMENTS.find((recipe) => recipe.name === activeTechPackRecord.recipeId) : undefined;
    const customOneSizeId = activeTechPackRecord?.cover.baseSizeId.value;
    const t02SizeSteps = t02Recipe
      ? isCustomOneSizeStyle(loaded.activeStyle)
        ? typeof customOneSizeId === "string" && customOneSizeId.trim().length > 0
          ? [{ label: customOneSizeId, step: 0 }]
          : []
        : t02Recipe.sizes
      : [];
    const t02Validation = activeTechPackRecord && pendingT02?.data && t02Recipe
      ? evaluateTechPackT02({
          record: activeTechPackRecord,
          data: pendingT02.data,
          recipe: t02Recipe,
          measurements: loaded.activeStyle.design.measurements,
          options: garmentOptionsForStyle(t02Recipe.options ?? [],
            loaded.activeStyle.design.garmentOptions[t02Recipe.name] ?? {}, loaded.activeStyle.design.workspace.targetStyle, false),
          sizeSteps: t02SizeSteps,
        })
      : null;
    const pendingT03 = activeTechPackRecord ? this.t03DataWithPendingDraft(activeTechPackRecord) : null;
    const t03Validation = evaluateTechPackOperationRecordSet(pendingT03?.data ?? null);
    const t03ReferenceReconciliation = activeTechPackRecord
      ? buildTechPackReferenceReconciliation(
          activeTechPackRecord,
          t02Recipe ?? null,
          loaded.activeStyle.design.measurements,
          t02Recipe ? garmentOptionsForStyle(t02Recipe.options ?? [],
            loaded.activeStyle.design.garmentOptions[t02Recipe.name] ?? {}, loaded.activeStyle.design.workspace.targetStyle, false) : {},
          pendingT03?.data ?? null,
        )
      : null;
    const techPackEditor = open && activeTechPackRecord
      ? `<section class="project-tech-pack" aria-label="Living technical pack">` +
        `<h3>Living technical pack · T01, T02 and T03</h3>` +
        `<p>Editable production-planning values for ${escapeHtml(loaded.activeStyle.recipeId)}. Unknowns and their next actions remain visible. Saving creates one immutable revision; this does not verify physical fit, supplier facts, or factory acceptance.</p>` +
        `<div class="project-tech-pack-actions">` +
        `<button type="button" data-project-action="save-tech-pack"${this.busy || !this.techPackDraft || this.techPackInputError ? " disabled" : ""}>Save tech-pack revision</button>` +
        `<button type="button" data-project-action="discard-tech-pack"${this.busy || !this.techPackDraft ? " disabled" : ""}>Discard tech-pack edits</button></div>` +
        `${this.renderTechPackShareControls(activeTechPackRecord, loaded)}` +
        `${renderTechPackEditor({ record: activeTechPackRecord, recipeLabel: loaded.activeStyle.recipeId, disabled: this.busy })}` +
        `${renderTechPackT02Editor({
          record: activeTechPackRecord,
          revisions: loaded.styleRevisions.filter((revision) => revision.styleId === loaded.activeStyle.id)
            .map((revision) => ({ revisionId: revision.revisionId, revisionNumber: revision.revisionNumber })),
          definitionsJsonDraft: this.techPackDefinitionsJsonDraft,
          disabled: this.busy,
          validation: t02Validation,
          validationError: pendingT02?.error,
        })}` +
        `${renderTechPackOperationEditor({
          record: activeTechPackRecord,
          operationsJsonDraft: this.techPackOperationsJsonDraft,
          disabled: this.busy,
          validation: t03Validation,
          validationError: pendingT03?.error,
          referenceReconciliation: t03ReferenceReconciliation,
        })}` +
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
        this.message = this.currentTechPackRecord()?.schemaVersion === 1
          ? "There are no unsaved T01 edits to save."
          : "There are no unsaved tech-pack edits to save.";
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
        this.message = candidate.schemaVersion === 1
          ? loaded.activeStyle.revisionHeadId === candidate.revisionId
            ? `No T01 content changed; the saved style revision remains r${revisionNumber}.`
            : `Saved T01 as immutable style revision r${revisionNumber}. The design editor's unsaved edits, if any, remain in place.`
          : loaded.activeStyle.revisionHeadId === candidate.revisionId
            ? `No tech-pack content changed; the saved style revision remains r${revisionNumber}.`
            : `Saved the tech pack as immutable style revision r${revisionNumber}. The design editor's unsaved edits, if any, remain in place.`;
      }, "Saving the tech-pack revision…");
    }
    if (action === "discard-tech-pack") {
      const wasLegacyT01 = this.techPackDraft?.schemaVersion === 1;
      this.discardTechPackDraft();
      this.message = wasLegacyT01
        ? "Unsaved T01 edits were discarded; the saved tech-pack revision is unchanged."
        : "Unsaved tech-pack edits were discarded; the saved revision is unchanged.";
      this.render();
      return;
    }
    if (action === "begin-tech-pack-review") return this.beginTechPackReview();
    if (action === "approve-tech-pack-review") return this.approveTechPackReview();
    if (action === "freeze-tech-pack-share") return this.freezeTechPackShare();
    if (this.techPackDraft && (action === "export-package" || action === "freeze-outputs")) {
      const legacyT01 = this.techPackDraft.schemaVersion === 1;
      this.message = action === "export-package"
        ? legacyT01 ? "Save or discard the unsaved T01 edits before exporting a project backup." : "Save or discard unsaved tech-pack edits before exporting a project backup."
        : legacyT01 ? "Save or discard the unsaved T01 edits before freezing outputs." : "Save or discard unsaved tech-pack edits before freezing outputs.";
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
      this.message = this.techPackDraft.schemaVersion === 1
        ? "Save or discard the unsaved T01 edits before freezing outputs."
        : "Save or discard unsaved tech-pack edits before freezing outputs.";
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

  private async beginTechPackReview(): Promise<void> {
    if (this.techPackDraft || this.options.hasUnsavedChanges()) {
      this.message = "Save or discard current edits before starting review of the saved Tech Pack revision.";
      this.render();
      return;
    }
    const loaded = this.options.workflow.snapshot;
    const revisionId = loaded.activeStyle.revisionHeadId;
    if (!revisionId) {
      this.message = "Save the style before starting a scoped Tech Pack review.";
      this.render();
      return;
    }
    const selectedGroups = new Set([...this.options.host.querySelectorAll<HTMLInputElement>("[data-tech-pack-share-scope]:checked")]
      .map((input) => input.dataset.techPackShareScope));
    const scopeFieldIds = techPackShareScopeGroups(loaded.activeStyle.techPack)
      .filter((group) => selectedGroups.has(group.id)).flatMap((group) => group.fieldIds);
    const actor = this.options.host.querySelector<HTMLInputElement>("#tech-pack-share-actor")?.value ?? "";
    return this.run(async () => {
      const updated = await this.options.workflow.beginActiveTechPackReview(actor, scopeFieldIds, revisionId);
      this.options.onStyleLoaded(updated, recoveryPayloadOrNull(updated));
      this.message = `Started local review for ${scopeFieldIds.length} fields on revision ${revisionId.slice(0, 8)}. The reviewer label is self-attested.`;
    }, "Starting scoped local review…");
  }

  private async approveTechPackReview(): Promise<void> {
    if (this.techPackDraft || this.options.hasUnsavedChanges()) {
      this.message = "Save or discard current edits before approving the saved Tech Pack revision.";
      this.render();
      return;
    }
    const loaded = this.options.workflow.snapshot;
    const revisionId = loaded.activeStyle.revisionHeadId;
    if (!revisionId) {
      this.message = "The saved style has no revision to approve.";
      this.render();
      return;
    }
    const actor = this.options.host.querySelector<HTMLInputElement>("#tech-pack-share-actor")?.value ?? "";
    return this.run(async () => {
      const updated = await this.options.workflow.approveActiveTechPackReview(actor, revisionId);
      this.options.onStyleLoaded(updated, recoveryPayloadOrNull(updated));
      this.message = `Recorded scoped local approval for revision ${revisionId.slice(0, 8)}. The reviewer label is self-attested.`;
    }, "Recording scoped local approval…");
  }

  private async freezeTechPackShare(): Promise<void> {
    if (this.techPackDraft || this.options.hasUnsavedChanges()) {
      this.message = "Save or discard current edits before freezing a Tech Pack share.";
      this.render();
      return;
    }
    const loaded = this.options.workflow.snapshot;
    const revisionId = loaded.activeStyle.revisionHeadId;
    const record = loaded.activeStyle.techPack;
    const callback = this.options.getTechPackShareOutput;
    if (!revisionId || record.approval.state !== "APPROVED" || !callback) {
      this.message = "A current scoped approval and Tech Pack output generator are required before freezing a local share.";
      this.render();
      return;
    }
    const actor = this.options.host.querySelector<HTMLInputElement>("#tech-pack-share-actor")?.value ?? "";
    return this.run(async () => {
      const output = await callback(revisionId);
      if (!output || output.revisionId !== revisionId) {
        throw new Error("The generated Tech Pack files do not match the current saved revision. Reload and retry.");
      }
      const artifacts = output.artifacts.map((artifact) => `${artifact.displayName} (${artifact.bytes.byteLength} bytes)`).join("; ");
      const prompt = `Freeze the local Tech Pack share for ${loaded.activeStyle.name}, revision ${revisionId} (${output.revisionContentDigest})?\n\n` +
        `Scope: ${record.approval.scopeFieldIds.length} saved fields\n` +
        `Production-pack sections: ${output.selectedSections.join(", ")}\n` +
        `Files: ${artifacts}\n\n` +
        `This stores exact ZIP and PDF bytes locally. The reviewer label is self-attested; this does not establish physical fit, supplier acceptance or production readiness.`;
      if (!this.confirm(prompt)) {
        this.message = "Local share freeze canceled; the scoped approval remains available.";
        return;
      }
      const manifest = await this.options.workflow.freezeTechPackShare(actor, output);
      const latest = this.options.workflow.snapshot;
      this.options.onStyleLoaded(latest, recoveryPayloadOrNull(latest));
      this.message = `Frozen ${manifest.artifacts.length} Tech Pack share files for revision ${manifest.revisionId.slice(0, 8)} · SHA-256 ${manifest.packetDigest.slice(0, 12)}.`;
    }, "Generating and freezing exact Tech Pack share bytes…");
  }

  private async downloadFrozenArtifact(manifestId: string, artifactId: string): Promise<void> {
    return this.run(async () => {
      const { manifest, artifact } = await this.options.workflow.readFrozenArtifact(manifestId, artifactId);
      const filename = artifact.displayName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").slice(0, 120) || "frozen-output";
      const saved = manifest.schemaVersion === 3
        ? await this.downloadPackage(filename, artifact.bytes)
        : this.options.saveFrozenArtifact
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
