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

export const PROJECT_RECORD_VERSION = 2;
export const STYLE_RECORD_VERSION = 4;
export const RECOVERY_RECORD_VERSION = 2;
export const MIGRATION_RECORD_VERSION = 1;

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

export interface StyleRecord {
  readonly schemaVersion: typeof STYLE_RECORD_VERSION;
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
  if (!object(value) || ![1, 2, 3, STYLE_RECORD_VERSION].includes(value.schemaVersion as number)) {
    return fail("Unsupported style record schema version.");
  }
  const version = value.schemaVersion as number;
  if (version === 1 ? !hasExactKeys(value, LEGACY_STYLE_RECORD_KEYS)
    : version < 4 ? !hasExactKeys(value, STYLE_V2_KEYS) : !hasExactKeys(value, STYLE_KEYS)) {
    return fail("Style record fields are incomplete or unknown.");
  }
  if (!validUuid(value.id) || !validUuid(value.projectId) || !validName(value.name)
    || typeof value.recipeId !== "string" || value.recipeId.length === 0
    || typeof value.recipePresetId !== "string" || value.recipePresetId.length === 0
    || !validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt)
    || !validRevision(value.revision)
    || (version === STYLE_RECORD_VERSION && value.revisionHeadId !== null && !validUuid(value.revisionHeadId))
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
