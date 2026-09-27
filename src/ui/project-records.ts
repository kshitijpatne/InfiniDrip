/** Strict, versioned records for the local multi-style project repository.
 * The legacy SaveFile format remains owned by persist.ts; this module only
 * validates its canonical record envelope and performs pure conversion. */
import type { RecoveryFile, SaveFile } from "./persist";
import {
  RECOVERY_VERSION,
  SAVE_VERSION,
  deserialize,
  deserializeRecovery,
} from "./persist";
import { FIELDS } from "./controls";
import { getFieldDefinitions } from "./field-provenance";
import {
  parseMeasurementCaptureSession,
  type CaptureMeasurer,
  type MeasurementCaptureSession,
} from "./measurement-capture";

export const PROJECT_RECORD_VERSION = 2;
/** Every existing and legacy-shaped style; v1–v3 records normalize to this shape. */
export const STYLE_RECORD_VERSION = 4;
/** Only a newly created G03 custom one-size style. It is never produced by upgrading a legacy style. */
export const CUSTOM_STYLE_RECORD_VERSION = 5;
/** A single custom digital size with no inherited or approved grade plan. */
export const CUSTOM_ONE_SIZE_MODE = "custom-one-size";
export const RECOVERY_RECORD_VERSION = 2;
export const MIGRATION_RECORD_VERSION = 1;
export const MEASUREMENT_CAPTURE_RECORD_VERSION = 1;

export interface ProjectRecord {
  readonly schemaVersion: typeof PROJECT_RECORD_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly styleIds: readonly string[];
  readonly activeStyleId: string;
  /** Source IDs and verified source-package digest when a project was imported as a copy. */
  readonly importedFrom: ImportedFrom | null;
}

export interface ImportedFrom {
  readonly projectId: string;
  readonly styleIds: readonly string[];
  readonly packageSha256: string;
}

export type SavedDesign = Omit<SaveFile, "v">;

interface StyleRecordFields {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly recipeId: string;
  readonly recipePresetId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  /** Null while available; an ISO timestamp while retained in the archive. */
  readonly archivedAt: string | null;
  /** Immutable design-history head; null only until the explicit S239 seed completes. */
  readonly revisionHeadId: string | null;
  readonly design: SavedDesign;
}

export interface LegacyStyleRecord extends StyleRecordFields {
  readonly schemaVersion: typeof STYLE_RECORD_VERSION;
}

export interface CustomOneSizeStyleRecord extends StyleRecordFields {
  readonly schemaVersion: typeof CUSTOM_STYLE_RECORD_VERSION;
  readonly sizeMode: typeof CUSTOM_ONE_SIZE_MODE;
}

export type StyleRecord = LegacyStyleRecord | CustomOneSizeStyleRecord;

export function isCustomOneSizeStyle(style: StyleRecord): style is CustomOneSizeStyleRecord {
  return style.schemaVersion === CUSTOM_STYLE_RECORD_VERSION;
}

export type RecoveryPayload = Omit<RecoveryFile, "v">;

export interface RecoveryRecord {
  readonly schemaVersion: typeof RECOVERY_RECORD_VERSION;
  readonly styleId: string;
  readonly payload: RecoveryPayload;
}

export interface MigrationRecord {
  readonly schemaVersion: typeof MIGRATION_RECORD_VERSION;
  readonly sourceKeys: readonly ["patternworks_save_v1", "patternworks_recovery_v1"];
  readonly sourceSaveVersion: number | null;
  readonly sourceSha256: string;
  readonly migratedAt: string;
  readonly projectId: string;
  readonly styleId: string;
}

/** Text the user typed for a field but has not added as a reading. It is never
 * parsed, converted, rounded, or treated as a recorded measurement. */
export interface MeasurementCaptureDraft {
  readonly fieldId: string;
  readonly rawValue: string;
  readonly enteredUnit: string;
  readonly sourceNote: string;
  readonly captureMethod: string;
  /** Empty, or the calendar date (YYYY-MM-DD) chosen in the optional date input. */
  readonly captureDate: string;
  readonly measurer: CaptureMeasurer | "";
}

/** One unfinished G03 capture session for exactly one style, project and recipe. */
export interface MeasurementCaptureRecord {
  readonly schemaVersion: typeof MEASUREMENT_CAPTURE_RECORD_VERSION;
  readonly styleId: string;
  readonly projectId: string;
  readonly recipeId: string;
  /** Compare-and-swap revision of this capture record only; never a project or style revision. */
  readonly revision: number;
  readonly updatedAt: string;
  readonly session: MeasurementCaptureSession;
  /** Unrecorded entries in the session's field order, at most one per field. */
  readonly drafts: readonly MeasurementCaptureDraft[];
}

export type RecordResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

export interface LegacySaveMigrationInput {
  readonly json: string;
  readonly projectId: string;
  readonly styleId: string;
  readonly migratedAt: string;
  readonly projectName?: string;
}

export interface LegacySaveMigration {
  readonly project: ProjectRecord;
  readonly style: StyleRecord;
  readonly sourceVersion: number;
}

const PROJECT_KEYS = ["schemaVersion", "id", "name", "createdAt", "updatedAt", "revision", "styleIds", "activeStyleId", "importedFrom"];
export const LEGACY_PROJECT_RECORD_KEYS = Object.freeze(["schemaVersion", "id", "name", "createdAt", "updatedAt", "revision", "styleIds", "activeStyleId"]);
const STYLE_V3_KEYS = ["schemaVersion", "id", "projectId", "name", "recipeId", "recipePresetId", "createdAt", "updatedAt", "revision", "archivedAt", "design"];
const STYLE_KEYS = [...STYLE_V3_KEYS, "revisionHeadId"];
const STYLE_V2_KEYS = STYLE_V3_KEYS;
const CUSTOM_STYLE_KEYS = [...STYLE_KEYS, "sizeMode"];
export const LEGACY_STYLE_RECORD_KEYS = Object.freeze(["schemaVersion", "id", "projectId", "name", "recipeId", "recipePresetId", "createdAt", "updatedAt", "revision", "design"]);
const RECOVERY_KEYS = ["schemaVersion", "styleId", "payload"];
const MIGRATION_KEYS = ["schemaVersion", "sourceKeys", "sourceSaveVersion", "sourceSha256", "migratedAt", "projectId", "styleId"];
const DESIGN_V5_KEYS = ["measurements", "fabric", "appearance", "garmentOptions", "workspace", "surface", "nestingIntelligence"];
const DESIGN_KEYS = [...DESIGN_V5_KEYS, "semanticEdits"];
const WORKSPACE_KEYS = ["garment", "targetStyle", "stretchFabric", "view", "bodyCroquisView", "exportStep", "fabricWidth", "nestScope"];
const APPEARANCE_KEYS = ["texture", "shine"];
const NESTING_KEYS = ["bufferPct", "availableLengthCm", "napAware"];
const RECOVERY_PAYLOAD_KEYS = [
  "savedAt", "measurements", "rawMeasurements", "fabric", "appearance", "garmentOptions",
  "rawOptions", "workspace", "materialSelectionExplicit", "surface", "rawNestingIntelligence",
  "semanticEdits",
];
const LEGACY_RECOVERY_PAYLOAD_KEYS = RECOVERY_PAYLOAD_KEYS.filter((key) => key !== "semanticEdits");
const CAPTURE_RECORD_KEYS = ["schemaVersion", "styleId", "projectId", "recipeId", "revision", "updatedAt", "session", "drafts"];
const CAPTURE_DRAFT_KEYS = ["fieldId", "rawValue", "enteredUnit", "sourceNote", "captureMethod", "captureDate", "measurer"];
const CAPTURE_DRAFT_MEASURERS = new Set(["", "SELF", "HELPER", "IMPORTED", "OTHER"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function hasExactKeys(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (!object(value)) return false;
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function validName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 80;
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function parseSavedDesign(value: unknown, legacy = false): RecordResult<SavedDesign> {
  if (!hasExactKeys(value, legacy ? DESIGN_V5_KEYS : DESIGN_KEYS)) return fail("Style design fields are incomplete or unknown.");
  const measurementKeys = FIELDS.map((field) => field.id);
  if (!hasExactKeys(value.measurements, measurementKeys)) return fail("Style measurements do not match this record schema.");
  if (!hasExactKeys(value.workspace, WORKSPACE_KEYS)) return fail("Style workspace fields are incomplete or unknown.");
  if (!hasExactKeys(value.appearance, APPEARANCE_KEYS)) return fail("Style appearance fields are incomplete or unknown.");
  if (!hasExactKeys(value.nestingIntelligence, NESTING_KEYS)) return fail("Style nesting fields are incomplete or unknown.");
  let parsed: ReturnType<typeof deserialize>;
  try {
    parsed = deserialize(JSON.stringify({ v: SAVE_VERSION, ...value, semanticEdits: legacy ? null : value.semanticEdits }));
  } catch {
    return fail("Style design cannot be serialized.");
  }
  if (!parsed.ok) return fail(parsed.error);
  const { ok: _ok, ...design } = parsed;
  return { ok: true, value: design };
}

/** Strict parser for the current persisted design contract used by immutable snapshots. */
export function parseSavedDesignRecord(value: unknown): RecordResult<SavedDesign> {
  return parseSavedDesign(value);
}

export function parseProjectRecord(value: unknown): RecordResult<ProjectRecord> {
  if (!hasExactKeys(value, PROJECT_KEYS)) return fail("Project record fields are incomplete or unknown.");
  if (value.schemaVersion !== PROJECT_RECORD_VERSION) return fail("Unsupported project record schema version.");
  if (!validUuid(value.id) || !validName(value.name) || !validTimestamp(value.createdAt)
    || !validTimestamp(value.updatedAt) || !validRevision(value.revision)) {
    return fail("Project identity, name, timestamps, or revision are invalid.");
  }
  if (Date.parse(value.updatedAt) < Date.parse(value.createdAt)) return fail("Project updatedAt precedes createdAt.");
  if (!Array.isArray(value.styleIds) || value.styleIds.length === 0
    || !value.styleIds.every(validUuid) || new Set(value.styleIds).size !== value.styleIds.length) {
    return fail("Project style IDs must be a non-empty unique list of UUIDs.");
  }
  if (!validUuid(value.activeStyleId) || !value.styleIds.includes(value.activeStyleId)) {
    return fail("Project activeStyleId must reference a listed style.");
  }
  if (value.importedFrom !== null) {
    const importedFrom = value.importedFrom;
    if (!hasExactKeys(importedFrom, ["projectId", "styleIds", "packageSha256"])
      || !validUuid(importedFrom.projectId)
      || !Array.isArray(importedFrom.styleIds) || importedFrom.styleIds.length === 0
      || importedFrom.projectId === value.id
      || importedFrom.styleIds.length !== value.styleIds.length
      || !importedFrom.styleIds.every(validUuid) || new Set(importedFrom.styleIds).size !== importedFrom.styleIds.length
      || typeof importedFrom.packageSha256 !== "string" || !SHA256.test(importedFrom.packageSha256)) {
      return fail("Project import lineage is malformed.");
    }
  }
  return { ok: true, value: value as unknown as ProjectRecord };
}

export function parseStyleRecord(value: unknown): RecordResult<StyleRecord> {
  if (!object(value) || ![1, 2, 3, STYLE_RECORD_VERSION, CUSTOM_STYLE_RECORD_VERSION].includes(value.schemaVersion as number)) {
    return fail("Unsupported style record schema version.");
  }
  const version = value.schemaVersion as number;
  const custom = version === CUSTOM_STYLE_RECORD_VERSION;
  // A size marker is meaningful only on the custom schema; it is never ignored
  // on, or silently removed from, a legacy-shaped record.
  if (!custom && Object.prototype.hasOwnProperty.call(value, "sizeMode")) {
    return fail("Only style schema v5 custom one-size records may declare a size mode.");
  }
  if (version === 1 ? !hasExactKeys(value, LEGACY_STYLE_RECORD_KEYS)
    : version < 4 ? !hasExactKeys(value, STYLE_V2_KEYS)
      : !hasExactKeys(value, custom ? CUSTOM_STYLE_KEYS : STYLE_KEYS)) {
    return fail("Style record fields are incomplete or unknown.");
  }
  if (custom && value.sizeMode !== CUSTOM_ONE_SIZE_MODE) {
    return fail(`Style schema v5 size mode must be exactly "${CUSTOM_ONE_SIZE_MODE}".`);
  }
  if (!validUuid(value.id) || !validUuid(value.projectId) || !validName(value.name)
    || typeof value.recipeId !== "string" || value.recipeId.length === 0
    || typeof value.recipePresetId !== "string" || value.recipePresetId.length === 0
    || !validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt)
    || !validRevision(value.revision)
    || (version >= STYLE_RECORD_VERSION && value.revisionHeadId !== null && !validUuid(value.revisionHeadId))
    || (version > 1 && value.archivedAt !== null && !validTimestamp(value.archivedAt))) {
    return fail("Style identity, name, recipe, timestamps, or revision are invalid.");
  }
  if (Date.parse(value.updatedAt) < Date.parse(value.createdAt)) return fail("Style updatedAt precedes createdAt.");
  // Style schema v3 already persists semantic edits. The v4 bump adds only the
  // immutable revision head, so v3 designs must retain their edit document
  // while v1/v2 designs still receive the legacy null default.
  const design = parseSavedDesign(value.design, version < 3);
  if (!design.ok) return fail(design.error);
  if (design.value.workspace.garment !== value.recipeId
    || design.value.workspace.targetStyle !== value.recipePresetId) {
    return fail("Style recipe identity does not match its saved workspace.");
  }
  // The custom schema already has the current shape; keep its version and size mode exactly.
  if (custom) return { ok: true, value: { ...value, design: design.value } as unknown as StyleRecord };
  return { ok: true, value: {
    ...value,
    schemaVersion: STYLE_RECORD_VERSION,
    archivedAt: version === 1 ? null : value.archivedAt,
    revisionHeadId: version < STYLE_RECORD_VERSION ? null : value.revisionHeadId,
    design: design.value,
  } as unknown as StyleRecord };
}

export function parseRecoveryRecord(value: unknown): RecordResult<RecoveryRecord> {
  if (!hasExactKeys(value, RECOVERY_KEYS)) return fail("Recovery record fields are incomplete or unknown.");
  if (value.schemaVersion !== 1 && value.schemaVersion !== RECOVERY_RECORD_VERSION) return fail("Unsupported recovery record schema version.");
  const legacy = value.schemaVersion === 1;
  if (!validUuid(value.styleId) || !hasExactKeys(value.payload, legacy ? LEGACY_RECOVERY_PAYLOAD_KEYS : RECOVERY_PAYLOAD_KEYS)) {
    return fail("Recovery identity or payload fields are invalid.");
  }
  let parsed: ReturnType<typeof deserializeRecovery>;
  try {
    parsed = deserializeRecovery(JSON.stringify({ v: RECOVERY_VERSION, ...value.payload, semanticEdits: legacy ? null : value.payload.semanticEdits }));
  } catch {
    return fail("Recovery payload cannot be serialized.");
  }
  if (!parsed.ok) return fail(parsed.error);
  const { ok: _ok, ...payload } = parsed;
  return { ok: true, value: { schemaVersion: RECOVERY_RECORD_VERSION, styleId: value.styleId, payload } };
}

export function parseMigrationRecord(value: unknown): RecordResult<MigrationRecord> {
  if (!hasExactKeys(value, MIGRATION_KEYS)) return fail("Migration record fields are incomplete or unknown.");
  if (value.schemaVersion !== MIGRATION_RECORD_VERSION) return fail("Unsupported migration record schema version.");
  if (!Array.isArray(value.sourceKeys) || value.sourceKeys.length !== 2
    || value.sourceKeys[0] !== "patternworks_save_v1" || value.sourceKeys[1] !== "patternworks_recovery_v1") {
    return fail("Migration source keys are invalid.");
  }
  if (value.sourceSaveVersion !== null
    && (typeof value.sourceSaveVersion !== "number" || !Number.isInteger(value.sourceSaveVersion)
      || value.sourceSaveVersion < 1 || value.sourceSaveVersion > SAVE_VERSION)) {
    return fail("Migration source SaveFile version is invalid.");
  }
  if (typeof value.sourceSha256 !== "string" || !SHA256.test(value.sourceSha256)
    || !validTimestamp(value.migratedAt) || !validUuid(value.projectId) || !validUuid(value.styleId)) {
    return fail("Migration fingerprint, timestamp, or destination IDs are invalid.");
  }
  return { ok: true, value: value as unknown as MigrationRecord };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function validDraft(value: unknown, session: MeasurementCaptureSession): value is MeasurementCaptureDraft {
  if (!hasExactKeys(value, CAPTURE_DRAFT_KEYS)) return false;
  const definition = getFieldDefinitions(session.recipeId).find((candidate) => candidate.id === value.fieldId);
  return definition !== undefined
    && typeof value.rawValue === "string" && value.rawValue.length <= 4096
    && typeof value.enteredUnit === "string"
    && (value.enteredUnit === definition.unit
      || (definition.unit === "cm" && (value.enteredUnit === "cm" || value.enteredUnit === "in")))
    && typeof value.sourceNote === "string" && value.sourceNote.length <= 500
    && typeof value.captureMethod === "string" && value.captureMethod.length <= 256
    && typeof value.captureDate === "string" && (value.captureDate === "" || validCalendarDate(value.captureDate))
    && typeof value.measurer === "string" && CAPTURE_DRAFT_MEASURERS.has(value.measurer);
}

/** Strict parser for a persisted capture session plus its unrecorded entry drafts. */
export function parseMeasurementCaptureRecord(value: unknown): RecordResult<MeasurementCaptureRecord> {
  if (!hasExactKeys(value, CAPTURE_RECORD_KEYS)) return fail("Measurement capture record fields are incomplete or unknown.");
  if (value.schemaVersion !== MEASUREMENT_CAPTURE_RECORD_VERSION) return fail("Unsupported measurement capture record schema version.");
  if (!validUuid(value.styleId) || !validUuid(value.projectId) || typeof value.recipeId !== "string"
    || !validRevision(value.revision) || !validTimestamp(value.updatedAt)) {
    return fail("Measurement capture record identity, revision, or timestamp is invalid.");
  }
  const session = parseMeasurementCaptureSession(value.session);
  if (!session.ok) return fail(session.error);
  if (session.value.styleId !== value.styleId || session.value.recipeId !== value.recipeId) {
    return fail("Measurement capture session does not belong to this record's style and recipe.");
  }
  if (!Array.isArray(value.drafts)) return fail("Measurement capture drafts must be a list.");
  let previousIndex = -1;
  for (const draft of value.drafts) {
    if (!validDraft(draft, session.value)) return fail("A measurement capture draft is malformed or does not match its recipe field.");
    const index = session.value.fields.findIndex((field) => field.fieldId === draft.fieldId);
    if (index <= previousIndex) return fail("Measurement capture drafts must be unique and in recipe field order.");
    previousIndex = index;
  }
  return { ok: true, value: value as unknown as MeasurementCaptureRecord };
}

/** True when `next` is the same session with every earlier reading kept exactly.
 * Selections may change; readings are never removed, reordered, or rewritten. */
export function isMeasurementCaptureSessionSuccessor(
  prior: MeasurementCaptureSession,
  next: MeasurementCaptureSession,
): boolean {
  if (prior.id !== next.id || prior.styleId !== next.styleId || prior.recipeId !== next.recipeId
    || prior.createdAt !== next.createdAt || next.revision < prior.revision
    || Date.parse(next.updatedAt) < Date.parse(prior.updatedAt)) return false;
  if (next.revision === prior.revision) return canonicalJson(prior) === canonicalJson(next);
  // Both sessions parsed against the same recipe definitions, so fields align by index.
  return prior.fields.every((field, index) => field.readings.every((reading, at) =>
    canonicalJson(reading) === canonicalJson(next.fields[index]!.readings[at])));
}

export function validateProjectBundle(
  projectInput: unknown,
  styleInputs: readonly unknown[],
): RecordResult<{ readonly project: ProjectRecord; readonly styles: readonly StyleRecord[] }> {
  const project = parseProjectRecord(projectInput);
  if (!project.ok) return fail(project.error);
  if (!Array.isArray(styleInputs) || styleInputs.length !== project.value.styleIds.length) {
    return fail("Project style records do not match the project's style list.");
  }
  const styles: StyleRecord[] = [];
  for (const input of styleInputs) {
    const style = parseStyleRecord(input);
    if (!style.ok) return fail(style.error);
    if (style.value.projectId !== project.value.id || !project.value.styleIds.includes(style.value.id)) {
      return fail("A style record is not linked to its project.");
    }
    styles.push(style.value);
  }
  if (new Set(styles.map((style) => style.id)).size !== styles.length) {
    return fail("Project style records contain duplicate IDs.");
  }
  const active = styles.find((style) => style.id === project.value.activeStyleId);
  if (!active || active.archivedAt !== null) return fail("The active style must exist and cannot be archived.");
  return { ok: true, value: { project: project.value, styles } };
}

export function migrateLegacySaveFile(input: LegacySaveMigrationInput): RecordResult<LegacySaveMigration> {
  let source: unknown;
  try {
    source = JSON.parse(input.json);
  } catch {
    return fail("Legacy SaveFile is not valid JSON.");
  }
  if (!object(source) || !Number.isInteger(source.v)) return fail("Legacy SaveFile version is missing or invalid.");
  const migrated = deserialize(input.json);
  if (!migrated.ok) return fail(migrated.error);
  const { ok: _ok, ...design } = migrated;
  const projectId = input.projectId;
  const styleId = input.styleId;
  const project: ProjectRecord = {
    schemaVersion: PROJECT_RECORD_VERSION,
    id: projectId,
    name: input.projectName ?? "My designs",
    createdAt: input.migratedAt,
    updatedAt: input.migratedAt,
    revision: 1,
    styleIds: [styleId],
    activeStyleId: styleId,
    importedFrom: null,
  };
  const style: StyleRecord = {
    schemaVersion: STYLE_RECORD_VERSION,
    id: styleId,
    projectId,
    name: `Untitled ${design.workspace.garment}`,
    recipeId: design.workspace.garment,
    recipePresetId: design.workspace.targetStyle,
    createdAt: input.migratedAt,
    updatedAt: input.migratedAt,
    revision: 1,
    archivedAt: null,
    revisionHeadId: null,
    design,
  };
  const bundle = validateProjectBundle(project, [style]);
  if (!bundle.ok) return fail(bundle.error);
  return {
    ok: true,
    value: { project: bundle.value.project, style: bundle.value.styles[0], sourceVersion: source.v as number },
  };
}

export function migrateLegacyRecovery(styleId: string, json: string): RecordResult<RecoveryRecord> {
  let source: unknown;
  try {
    source = JSON.parse(json);
  } catch {
    return fail("Legacy recovery data is not valid JSON.");
  }
  if (!object(source) || source.v !== RECOVERY_VERSION) return fail("Legacy recovery version is missing or unsupported.");
  const parsed = deserializeRecovery(json);
  if (!parsed.ok) return fail(parsed.error);
  const { ok: _ok, ...payload } = parsed;
  return parseRecoveryRecord({ schemaVersion: RECOVERY_RECORD_VERSION, styleId, payload });
}
