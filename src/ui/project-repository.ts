/** IndexedDB persistence for the local, versioned project/style model. */
import { DEFAULT_APPEARANCE } from "./appearance";
import {
  DEFAULT_WORKSPACE,
  serialize,
} from "./persist";
import { DEFAULT_FABRIC } from "../render";
import { STANDARD_M } from "../drafting";
import {
  MIGRATION_RECORD_VERSION,
  isCustomOneSizeStyle,
  LEGACY_STYLE_RECORD_KEYS,
  LEGACY_PROJECT_RECORD_KEYS,
  isMeasurementCaptureSessionSuccessor,
  migrateLegacySaveFile,
  migrateLegacyRecovery,
  parseMeasurementCaptureRecord,
  parseMigrationRecord,
  parseProjectRecord,
  parseRecoveryRecord,
  parseStyleRecord,
  validateProjectBundle,
  type MeasurementCaptureRecord,
  type MigrationRecord,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";
import {
  parseGradePlanRecord,
  type GradePlanRecord,
} from "./grade-plan";
import {
  createFieldObservationRecord,
  parseFieldObservationRecord,
  type FieldObservationRecord,
} from "./field-provenance";
import {
  parseFrozenOutputManifestRecord,
  parseStyleRevisionRecord,
  canonicalizeJcs,
  jcsSha256Hex,
  verifyFrozenOutputManifestMetadata,
  verifyFrozenOutputManifest,
  verifyStyleRevision,
  type FrozenOutputManifestRecord,
  type StyleRevisionRecord,
} from "./style-revisions";

export const PROJECT_DATABASE_NAME = "infinidrip-projects";
export const PROJECT_DATABASE_VERSION = 8;
export const PROJECT_STORES = Object.freeze({
  meta: "meta",
  projects: "projects",
  styles: "styles",
  recoveries: "recoveries",
  migrations: "migrations",
  imports: "imports",
  fieldObservations: "fieldObservations",
  styleRevisions: "styleRevisions",
  exportManifests: "exportManifests",
  measurementCaptures: "measurementCaptures",
  gradePlans: "gradePlans",
});
const ACTIVE_SELECTION_KEY = "activeSelection";
const ALL_STORES = Object.values(PROJECT_STORES);
const OPEN_KEYS = ["key", "projectId", "styleId"];
const CAPTURE_KEY_PATH = Object.freeze(["styleId", "recipeId"]);
const GRADE_PLAN_KEY_PATH = Object.freeze(["styleId", "recipeId"]);
const STORE_KEY_PATHS: Readonly<Record<string, string | readonly string[]>> = Object.freeze({
  [PROJECT_STORES.meta]: "key",
  [PROJECT_STORES.projects]: "id",
  [PROJECT_STORES.styles]: "id",
  [PROJECT_STORES.recoveries]: "styleId",
  [PROJECT_STORES.migrations]: "sourceSha256",
  [PROJECT_STORES.imports]: "packageSha256",
  [PROJECT_STORES.fieldObservations]: "styleId",
  [PROJECT_STORES.styleRevisions]: "revisionId",
  [PROJECT_STORES.exportManifests]: "manifestId",
  [PROJECT_STORES.measurementCaptures]: CAPTURE_KEY_PATH,
  [PROJECT_STORES.gradePlans]: GRADE_PLAN_KEY_PATH,
});

export type RepositoryErrorCode =
  | "unavailable"
  | "blocked"
  | "unsupported-version"
  | "closed"
  | "not-found"
  | "conflict"
  | "invalid-data"
  | "quota-exceeded"
  | "no-legacy-data"
  | "already-initialized"
  | "transaction";

export class ProjectRepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = "ProjectRepositoryError";
    this.code = code;
  }
}

export interface ProjectRepositoryOptions {
  /** Alternate names and factories are used for isolated profiles and tests. */
  readonly name?: string;
  readonly requestedVersion?: number;
  readonly factory?: IDBFactory;
  readonly crypto?: Crypto;
  readonly onVersionChange?: () => void;
}

export interface LoadedProject {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly activeStyle: StyleRecord;
  readonly activeRecovery: RecoveryRecord | null;
  readonly fieldObservations: readonly FieldObservationRecord[];
  readonly styleRevisions: readonly StyleRevisionRecord[];
  readonly exportManifests: readonly FrozenOutputManifestRecord[];
  /** Present only when at least one style has a stored G03 grade plan. */
  readonly gradePlans?: readonly GradePlanRecord[];
}

export interface ProjectBundleSnapshot {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries: readonly RecoveryRecord[];
  readonly fieldObservations?: readonly FieldObservationRecord[];
  readonly styleRevisions?: readonly StyleRevisionRecord[];
  readonly exportManifests?: readonly FrozenOutputManifestRecord[];
  /** Present only when at least one style has a stored G03 capture session. */
  readonly measurementCaptures?: readonly MeasurementCaptureRecord[];
  /** Present only when at least one style has a stored G03 grade plan. */
  readonly gradePlans?: readonly GradePlanRecord[];
}

export interface SaveProjectBundleInput {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries?: readonly RecoveryRecord[];
  /** Append-only provenance records written atomically with style/project changes. */
  readonly fieldObservations?: readonly FieldObservationRecord[];
  /** New immutable history rows, validated before the transaction and inserted atomically. */
  readonly styleRevisions?: readonly StyleRevisionRecord[];
  /** New immutable output captures, validated before the transaction and inserted atomically. */
  readonly exportManifests?: readonly FrozenOutputManifestRecord[];
  /**
   * New recipe-matched capture sessions, validated before the transaction and
   * inserted atomically with the style/project rows. Each entry must name a
   * style in this bundle with the same project ID and recipe, carry revision 1,
   * and have no stored session for its style/recipe key.
   */
  readonly measurementCaptures?: readonly MeasurementCaptureRecord[];
  /**
   * New recipe-matched grade plans, validated before the transaction and
   * inserted atomically with the style/project rows. Each entry must name a
   * custom one-size style in this bundle with the same project ID and recipe,
   * carry revision 1, reference that style's saved immutable revision head and
   * saved capture revision, and have no stored plan for its style/recipe key.
   */
  readonly gradePlans?: readonly GradePlanRecord[];
  /** Exact approved record required by a schema-v2 custom grade-plan freeze. */
  readonly gradePlanFreeze?: { readonly record: GradePlanRecord; readonly approvalRef: string };
  /** Removes a style's old crash-recovery payload in the same atomic save. */
  readonly clearRecoveryStyleIds?: readonly string[];
  /** null creates a project; a number is a compare-and-swap revision. */
  readonly expectedProjectRevision: number | null;
}

export interface ProjectImportReceipt {
  readonly packageSha256: string;
  readonly projectId: string;
  readonly importedAt: string;
  readonly importedAsCopy: boolean;
}

export interface ImportProjectBundleInput {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries: readonly RecoveryRecord[];
  readonly fieldObservations?: readonly FieldObservationRecord[];
  readonly styleRevisions?: readonly StyleRevisionRecord[];
  readonly exportManifests?: readonly FrozenOutputManifestRecord[];
  readonly measurementCaptures?: readonly MeasurementCaptureRecord[];
  readonly gradePlans?: readonly GradePlanRecord[];
  readonly receipt: ProjectImportReceipt;
}

export type ImportProjectBundleOutcome =
  | { readonly status: "imported"; readonly project: ProjectRecord }
  | { readonly status: "already-imported"; readonly receipt: ProjectImportReceipt };

export interface LegacyMigrationInput {
  readonly saveJson: string | null;
  readonly recoveryJson: string | null;
  readonly projectId: string;
  readonly styleId: string;
  readonly migratedAt: string;
}

export type LegacyMigrationOutcome =
  | { readonly status: "migrated"; readonly record: MigrationRecord }
  | { readonly status: "already-migrated"; readonly record: MigrationRecord };

interface ActiveSelection {
  readonly key: typeof ACTIVE_SELECTION_KEY;
  readonly projectId: string;
  readonly styleId: string;
}

function asRepositoryError(error: unknown): ProjectRepositoryError {
  if (error instanceof ProjectRepositoryError) return error;
  const message = error instanceof Error ? error.message : "Unknown IndexedDB error.";
  if (typeof error === "object" && error !== null && "name" in error && error.name === "QuotaExceededError") {
    return new ProjectRepositoryError("quota-exceeded", `Local project storage is full; the previous saved version is intact. Export a project backup or free local space, then retry. ${message}`);
  }
  return new ProjectRepositoryError("transaction", `Project storage transaction failed: ${message}`);
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionFinished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

async function inTransaction<T>(
  database: IDBDatabase,
  storeNames: readonly string[],
  mode: IDBTransactionMode,
  operation: (transaction: IDBTransaction) => Promise<T>,
): Promise<T> {
  let transaction: IDBTransaction;
  try {
    transaction = mode === "readwrite"
      ? database.transaction([...storeNames], mode, { durability: "strict" })
      : database.transaction([...storeNames], mode);
  } catch (error) {
    if (mode !== "readwrite" || !(error instanceof TypeError)) throw asRepositoryError(error);
    try {
      // Older implementations may reject the durability options dictionary.
      transaction = database.transaction([...storeNames], mode);
    } catch (fallbackError) {
      throw asRepositoryError(fallbackError);
    }
  }
  const finished = transactionFinished(transaction);
  try {
    const result = await operation(transaction);
    await finished;
    return result;
  } catch (error) {
    try { transaction.abort(); } catch { /* The transaction may already have aborted or completed. */ }
    await finished.catch(() => undefined);
    throw asRepositoryError(error);
  }
}

function createSchema(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(PROJECT_STORES.meta)) {
    database.createObjectStore(PROJECT_STORES.meta, { keyPath: "key" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.projects)) {
    database.createObjectStore(PROJECT_STORES.projects, { keyPath: "id" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.styles)) {
    database.createObjectStore(PROJECT_STORES.styles, { keyPath: "id" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.recoveries)) {
    database.createObjectStore(PROJECT_STORES.recoveries, { keyPath: "styleId" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.migrations)) {
    database.createObjectStore(PROJECT_STORES.migrations, { keyPath: "sourceSha256" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.imports)) {
    database.createObjectStore(PROJECT_STORES.imports, { keyPath: "packageSha256" });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.fieldObservations)) {
    database.createObjectStore(PROJECT_STORES.fieldObservations, { keyPath: "styleId" });
  }
  createImmutableHistoryStores(database);
  createMeasurementCaptureStore(database);
  createGradePlanStore(database);
}

/** Additive v7 store: one capture session per style and recipe, never read by the design save path. */
function createMeasurementCaptureStore(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(PROJECT_STORES.measurementCaptures)) {
    const captures = database.createObjectStore(PROJECT_STORES.measurementCaptures, { keyPath: [...CAPTURE_KEY_PATH] });
    captures.createIndex("styleId", "styleId", { unique: false });
  }
}

/** Additive v8 store: one grade plan per custom one-size style and recipe, never read by the design save path. */
function createGradePlanStore(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(PROJECT_STORES.gradePlans)) {
    const plans = database.createObjectStore(PROJECT_STORES.gradePlans, { keyPath: [...GRADE_PLAN_KEY_PATH] });
    plans.createIndex("styleId", "styleId", { unique: false });
    plans.createIndex("projectId", "projectId", { unique: false });
  }
}

function createImmutableHistoryStores(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(PROJECT_STORES.styleRevisions)) {
    const revisions = database.createObjectStore(PROJECT_STORES.styleRevisions, { keyPath: "revisionId" });
    revisions.createIndex("styleId", "styleId", { unique: false });
    revisions.createIndex("styleIdAndNumber", ["styleId", "revisionNumber"], { unique: true });
  }
  if (!database.objectStoreNames.contains(PROJECT_STORES.exportManifests)) {
    const manifests = database.createObjectStore(PROJECT_STORES.exportManifests, { keyPath: "manifestId" });
    manifests.createIndex("styleId", "styleId", { unique: false });
    manifests.createIndex("styleIdAndCapturedAt", ["styleId", "capturedAt"], { unique: false });
  }
}

function upgradeStyleRevisionHeads(transaction: IDBTransaction | null): void {
  if (!transaction) return;
  try {
    const request = transaction.objectStore(PROJECT_STORES.styles).openCursor();
    request.onerror = () => transaction.abort();
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        const parsed = parseStyleRecord(cursor.value);
        if (!parsed.ok) {
          transaction.abort();
          return;
        }
        cursor.update({ ...parsed.value, revisionHeadId: null });
        cursor.continue();
      } catch {
        transaction.abort();
      }
    };
  } catch {
    transaction.abort();
  }
}

function upgradeProjectRecordsV1(transaction: IDBTransaction | null): void {
  if (!transaction) return;
  try {
    const request = transaction.objectStore(PROJECT_STORES.projects).openCursor();
    request.onerror = () => transaction.abort();
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        const value = cursor.value;
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          transaction.abort();
          return;
        }
        const keys = Object.keys(value);
        if (keys.length !== LEGACY_PROJECT_RECORD_KEYS.length
          || !LEGACY_PROJECT_RECORD_KEYS.every((key) => Object.prototype.hasOwnProperty.call(value, key))
          || (value as { schemaVersion?: unknown }).schemaVersion !== 1) {
          transaction.abort();
          return;
        }
        cursor.update({ ...value, schemaVersion: 2, importedFrom: null });
        cursor.continue();
      } catch {
        transaction.abort();
      }
    };
  } catch {
    transaction.abort();
  }
}

function addFieldObservationStore(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(PROJECT_STORES.fieldObservations)) {
    database.createObjectStore(PROJECT_STORES.fieldObservations, { keyPath: "styleId" });
  }
}

function seedFieldObservations(
  transaction: IDBTransaction | null,
  upgradeStyleV1 = false,
  upgradeEditStyles = false,
): void {
  if (!transaction) return;
  try {
    const store = transaction.objectStore(PROJECT_STORES.styles);
    const observations = transaction.objectStore(PROJECT_STORES.fieldObservations);
    const request = store.openCursor();
    request.onerror = () => transaction.abort();
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        let styleValue = cursor.value;
        if (upgradeStyleV1) {
          if (typeof styleValue !== "object" || styleValue === null || Array.isArray(styleValue)) {
            transaction.abort();
            return;
          }
          const keys = Object.keys(styleValue);
          if (keys.length !== LEGACY_STYLE_RECORD_KEYS.length
            || !LEGACY_STYLE_RECORD_KEYS.every((key) => Object.prototype.hasOwnProperty.call(styleValue, key))
            || (styleValue as { schemaVersion?: unknown }).schemaVersion !== 1) {
            transaction.abort();
            return;
          }
          styleValue = { ...styleValue, schemaVersion: 2, archivedAt: null };
        }
        const parsed = parseStyleRecord(styleValue);
        if (!parsed.ok) {
          transaction.abort();
          return;
        }
        if (upgradeEditStyles) {
          cursor.update(parsed.value);
        }
        observations.add(createFieldObservationRecord(parsed.value, parsed.value.updatedAt, "existing-local-style"));
        cursor.continue();
      } catch {
        transaction.abort();
      }
    };
  } catch {
    transaction.abort();
  }
}

function upgradeEditStateStyles(transaction: IDBTransaction | null): void {
  if (!transaction) return;
  try {
    const request = transaction.objectStore(PROJECT_STORES.styles).openCursor();
    request.onerror = () => transaction.abort();
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        const parsed = parseStyleRecord(cursor.value);
        if (!parsed.ok) {
          transaction.abort();
          return;
        }
        cursor.update(parsed.value);
        cursor.continue();
      } catch {
        transaction.abort();
      }
    };
  } catch {
    transaction.abort();
  }
}

function upgradeEditStateRecoveries(transaction: IDBTransaction | null): void {
  if (!transaction) return;
  try {
    const request = transaction.objectStore(PROJECT_STORES.recoveries).openCursor();
    request.onerror = () => transaction.abort();
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        const parsed = parseRecoveryRecord(cursor.value);
        if (!parsed.ok) {
          transaction.abort();
          return;
        }
        cursor.update(parsed.value);
        cursor.continue();
      } catch {
        transaction.abort();
      }
    };
  } catch {
    transaction.abort();
  }
}

function hasSupportedSchema(database: IDBDatabase): boolean {
  try {
    if (database.objectStoreNames.length !== ALL_STORES.length
      || !ALL_STORES.every((name) => database.objectStoreNames.contains(name))) return false;
    const transaction = database.transaction([...ALL_STORES], "readonly");
    if (!ALL_STORES.every((name) =>
      JSON.stringify(transaction.objectStore(name).keyPath) === JSON.stringify(STORE_KEY_PATHS[name]))) return false;
    const revisions = transaction.objectStore(PROJECT_STORES.styleRevisions);
    const manifests = transaction.objectStore(PROJECT_STORES.exportManifests);
    const captures = transaction.objectStore(PROJECT_STORES.measurementCaptures);
    const plans = transaction.objectStore(PROJECT_STORES.gradePlans);
    return revisions.indexNames.contains("styleId") && revisions.indexNames.contains("styleIdAndNumber")
      && manifests.indexNames.contains("styleId") && manifests.indexNames.contains("styleIdAndCapturedAt")
      && captures.indexNames.contains("styleId")
      && plans.indexNames.contains("styleId") && plans.indexNames.contains("projectId");
  } catch {
    return false;
  }
}

function validActiveSelection(value: unknown): value is ActiveSelection {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length === OPEN_KEYS.length
    && OPEN_KEYS.every((key) => Object.prototype.hasOwnProperty.call(record, key))
    && record.key === ACTIVE_SELECTION_KEY
    && typeof record.projectId === "string"
    && typeof record.styleId === "string";
}

function selection(projectId: string, styleId: string): ActiveSelection {
  return { key: ACTIVE_SELECTION_KEY, projectId, styleId };
}

function parseRecoveryInputs(records: readonly RecoveryRecord[] | undefined, styleIds: readonly string[]): RecoveryRecord[] {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw new ProjectRepositoryError("invalid-data", "Recovery records must be a list.");
  const parsed: RecoveryRecord[] = [];
  for (const input of records) {
    const record = parseRecoveryRecord(input);
    if (!record.ok) throw new ProjectRepositoryError("invalid-data", record.error);
    if (!styleIds.includes(record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "Recovery data must belong to a style in this project.");
    }
    if (parsed.some((item) => item.styleId === record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate recovery records.");
    }
    parsed.push(record.value);
  }
  return parsed;
}

function parseFieldObservationInputs(
  records: readonly FieldObservationRecord[] | undefined,
  styleIds: readonly string[],
): FieldObservationRecord[] {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw new ProjectRepositoryError("invalid-data", "Field observation records must be a list.");
  const parsed: FieldObservationRecord[] = [];
  for (const input of records) {
    const record = parseFieldObservationRecord(input);
    if (!record.ok) throw new ProjectRepositoryError("invalid-data", record.error);
    if (!styleIds.includes(record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "Field observations must belong to a style in this project.");
    }
    if (parsed.some((item) => item.styleId === record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate field observation records.");
    }
    parsed.push(record.value);
  }
  return parsed;
}

async function parseStyleRevisionInputs(
  values: readonly StyleRevisionRecord[] | undefined,
  crypto?: Crypto,
): Promise<StyleRevisionRecord[]> {
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new ProjectRepositoryError("invalid-data", "Style revisions must be a list.");
  const parsed: StyleRevisionRecord[] = [];
  for (const value of values) {
    const record = parseStyleRevisionRecord(value);
    if (!record || !await verifyStyleRevision(record, crypto)) {
      throw new ProjectRepositoryError("invalid-data", "A new immutable style revision failed strict schema or SHA-256 validation.");
    }
    if (parsed.some((previous) => previous.revisionId === record.revisionId)) {
      throw new ProjectRepositoryError("invalid-data", "A style bundle contains duplicate revision IDs.");
    }
    parsed.push(record);
  }
  return parsed;
}

async function parseExportManifestInputs(
  values: readonly FrozenOutputManifestRecord[] | undefined,
  crypto?: Crypto,
): Promise<FrozenOutputManifestRecord[]> {
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new ProjectRepositoryError("invalid-data", "Frozen output manifests must be a list.");
  const parsed: FrozenOutputManifestRecord[] = [];
  for (const value of values) {
    const record = parseFrozenOutputManifestRecord(value);
    if (!record || !await verifyFrozenOutputManifest(record, crypto)) {
      throw new ProjectRepositoryError("invalid-data", "A frozen output manifest or its stored artifact bytes failed integrity validation.");
    }
    if (parsed.some((previous) => previous.manifestId === record.manifestId)) {
      throw new ProjectRepositoryError("invalid-data", "A style bundle contains duplicate frozen manifest IDs.");
    }
    parsed.push(record);
  }
  return parsed;
}

function isAppendOnlyExtension(previous: FieldObservationRecord, next: FieldObservationRecord): boolean {
  if (previous.styleId !== next.styleId || previous.definitionVersion !== next.definitionVersion
    || next.revision < previous.revision || next.observations.length < previous.observations.length) return false;
  return previous.observations.every((observation, index) =>
    JSON.stringify(observation) === JSON.stringify(next.observations[index]));
}

function parseRecoveryClears(ids: readonly string[] | undefined, styleIds: readonly string[]): string[] {
  if (ids === undefined) return [];
  if (!Array.isArray(ids)) throw new ProjectRepositoryError("invalid-data", "Recovery clear IDs must be a list.");
  if (new Set(ids).size !== ids.length || ids.some((id) => !styleIds.includes(id))) {
    throw new ProjectRepositoryError("invalid-data", "Recovery clear IDs must be unique styles in this project.");
  }
  return [...ids];
}

function parseMeasurementCaptureInputs(
  records: readonly MeasurementCaptureRecord[] | undefined,
  projectId: string,
  styleIds: readonly string[],
): MeasurementCaptureRecord[] {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw new ProjectRepositoryError("invalid-data", "Measurement capture records must be a list.");
  const parsed: MeasurementCaptureRecord[] = [];
  for (const input of records) {
    const record = parseMeasurementCaptureRecord(input);
    if (!record.ok) throw new ProjectRepositoryError("invalid-data", record.error);
    if (record.value.projectId !== projectId || !styleIds.includes(record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "Measurement capture sessions must belong to a style in this project.");
    }
    if (parsed.some((item) => item.styleId === record.value.styleId && item.recipeId === record.value.recipeId)) {
      throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate capture sessions for one style and recipe.");
    }
    parsed.push(record.value);
  }
  return parsed;
}

/** Resolves the one existing, available style that owns a capture session or grade plan. */
async function styleOwnerInTransaction(transaction: IDBTransaction, styleId: string): Promise<StyleRecord> {
  const styleInput = await requestValue<unknown>(transaction.objectStore(PROJECT_STORES.styles).get(styleId));
  if (styleInput === undefined) throw new ProjectRepositoryError("not-found", "The capture session's style does not exist.");
  const style = parseStyleRecord(styleInput);
  if (!style.ok) throw new ProjectRepositoryError("invalid-data", style.error);
  const projectInput = await requestValue<unknown>(transaction.objectStore(PROJECT_STORES.projects).get(style.value.projectId));
  if (projectInput === undefined) throw new ProjectRepositoryError("not-found", "The capture session's project does not exist.");
  const project = parseProjectRecord(projectInput);
  if (!project.ok) throw new ProjectRepositoryError("invalid-data", project.error);
  if (!project.value.styleIds.includes(styleId)) {
    throw new ProjectRepositoryError("invalid-data", "The capture session's style is not listed by its project.");
  }
  if (style.value.archivedAt !== null) {
    throw new ProjectRepositoryError("invalid-data", "An archived style's capture session is read-only; restore the style first.");
  }
  return style.value;
}

function storedCapture(input: unknown, styleId: string, recipeId: string, projectId: string): MeasurementCaptureRecord {
  const parsed = parseMeasurementCaptureRecord(input);
  if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
  if (parsed.value.styleId !== styleId || parsed.value.recipeId !== recipeId || parsed.value.projectId !== projectId) {
    throw new ProjectRepositoryError("invalid-data", "A stored capture session is linked to a different style, recipe, or project.");
  }
  return parsed.value;
}

function parseGradePlanInputs(
  records: readonly GradePlanRecord[] | undefined,
  projectId: string,
  styleIds: readonly string[],
): GradePlanRecord[] {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw new ProjectRepositoryError("invalid-data", "Grade-plan records must be a list.");
  const parsed: GradePlanRecord[] = [];
  for (const input of records) {
    const record = parseGradePlanRecord(input);
    if (!record.ok) throw new ProjectRepositoryError("invalid-data", record.errors.join("; "));
    if (record.value.projectId !== projectId || !styleIds.includes(record.value.styleId)) {
      throw new ProjectRepositoryError("invalid-data", "Grade-plan records must belong to a style in this project.");
    }
    if (parsed.some((item) => item.styleId === record.value.styleId && item.recipeId === record.value.recipeId)) {
      throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate grade plans for one style and recipe.");
    }
    parsed.push(record.value);
  }
  return parsed;
}

function storedGradePlan(input: unknown, styleId: string, recipeId: string, projectId: string): GradePlanRecord {
  const parsed = parseGradePlanRecord(input);
  if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.errors.join("; "));
  if (parsed.value.styleId !== styleId || parsed.value.recipeId !== recipeId || parsed.value.projectId !== projectId) {
    throw new ProjectRepositoryError("invalid-data", "A stored grade plan is linked to a different style, recipe, or project.");
  }
  return parsed.value;
}

function findInputCapture(
  records: readonly MeasurementCaptureRecord[],
  styleId: string,
  recipeId: string,
): MeasurementCaptureRecord | undefined {
  for (const record of records) {
    if (record.styleId === styleId && record.recipeId === recipeId) return record;
  }
  return undefined;
}

/** Resolves the saved capture session a grade plan is bound to; corrupt or foreign rows fail closed. */
async function requireStoredPlanCapture(
  transaction: IDBTransaction,
  plan: GradePlanRecord,
): Promise<MeasurementCaptureRecord> {
  const storedInput = await requestValue<unknown>(
    transaction.objectStore(PROJECT_STORES.measurementCaptures).get([plan.styleId, plan.recipeId]),
  );
  if (storedInput === undefined) {
    throw new ProjectRepositoryError("invalid-data", "A grade plan requires its matching saved measurement capture session.");
  }
  return storedCapture(storedInput, plan.styleId, plan.recipeId, plan.projectId);
}

/** Checks a plan against the style row being saved and the capture it names; stale bases fail closed. */
function assertGradePlanBase(plan: GradePlanRecord, style: StyleRecord, capture: MeasurementCaptureRecord): void {
  if (style.recipeId !== plan.recipeId) {
    throw new ProjectRepositoryError("invalid-data", "Grade-plan recipe must match its style recipe.");
  }
  if (style.revisionHeadId === null || style.revisionHeadId !== plan.revisionHeadId) {
    throw new ProjectRepositoryError("invalid-data", "The grade plan names a different revision head than the saved style; refresh the grade-plan base before saving.");
  }
  if (capture.revision !== plan.captureRevision) {
    throw new ProjectRepositoryError("invalid-data", "The grade plan names a different capture revision than the saved session; refresh the grade-plan base before saving.");
  }
}

async function bundleInTransaction(
  transaction: IDBTransaction,
  projectId: string,
  expectedActiveStyleId?: string,
): Promise<LoadedProject | null> {
  const projectInput = await requestValue(transaction.objectStore(PROJECT_STORES.projects).get(projectId));
  if (projectInput === undefined) return null;
  const project = parseProjectRecord(projectInput);
  if (!project.ok) throw new ProjectRepositoryError("invalid-data", project.error);
  if (expectedActiveStyleId !== undefined && project.value.activeStyleId !== expectedActiveStyleId) {
    throw new ProjectRepositoryError("invalid-data", "Active project/style metadata is inconsistent.");
  }
  const styleInputs = await Promise.all(project.value.styleIds.map((id) =>
    requestValue(transaction.objectStore(PROJECT_STORES.styles).get(id))));
  const bundle = validateProjectBundle(project.value, styleInputs);
  if (!bundle.ok) throw new ProjectRepositoryError("invalid-data", bundle.error);
  // validateProjectBundle proves that every listed ID has exactly one record;
  // ProjectRecord validation proves the active style ID is in that list.
  const activeStyle = bundle.value.styles.find((style) => style.id === project.value.activeStyleId)!;
  const recoveryInput = await requestValue(transaction.objectStore(PROJECT_STORES.recoveries).get(activeStyle.id));
  let activeRecovery: RecoveryRecord | null = null;
  if (recoveryInput !== undefined) {
    const recovery = parseRecoveryRecord(recoveryInput);
    if (!recovery.ok) throw new ProjectRepositoryError("invalid-data", recovery.error);
    activeRecovery = recovery.value;
  }
  const fieldObservations: FieldObservationRecord[] = [];
  const styleRevisions: StyleRevisionRecord[] = [];
  const exportManifests: FrozenOutputManifestRecord[] = [];
  const gradePlans: GradePlanRecord[] = [];
  const revisionStore = transaction.objectStore(PROJECT_STORES.styleRevisions).index("styleId");
  const manifestStore = transaction.objectStore(PROJECT_STORES.exportManifests).index("styleId");
  const gradePlanStore = transaction.objectStore(PROJECT_STORES.gradePlans).index("styleId");
  for (const style of bundle.value.styles) {
    const input = await requestValue<unknown>(transaction.objectStore(PROJECT_STORES.fieldObservations).get(style.id));
    if (input === undefined) throw new ProjectRepositoryError("invalid-data", "A style is missing its source-aware field history.");
    const parsed = parseFieldObservationRecord(input);
    if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
    fieldObservations.push(parsed.value);
    const revisions = await requestValue<unknown[]>(revisionStore.getAll(style.id));
    for (const input of revisions) {
      const revision = parseStyleRevisionRecord(input);
      if (!revision || revision.styleId !== style.id) throw new ProjectRepositoryError("invalid-data", "A style revision record is malformed or belongs to another style.");
      styleRevisions.push(revision);
    }
    const manifests = await requestValue<unknown[]>(manifestStore.getAll(style.id));
    for (const input of manifests) {
      const manifest = parseFrozenOutputManifestRecord(input);
      if (!manifest || manifest.styleId !== style.id) throw new ProjectRepositoryError("invalid-data", "A frozen output manifest is malformed or belongs to another style.");
      exportManifests.push(manifest);
    }
    // Index order follows the [styleId, recipeId] primary key, so loaded plans are deterministic.
    for (const input of await requestValue<unknown[]>(gradePlanStore.getAll(style.id))) {
      const parsedPlan = parseGradePlanRecord(input);
      if (!parsedPlan.ok) throw new ProjectRepositoryError("invalid-data", parsedPlan.errors.join("; "));
      gradePlans.push(storedGradePlan(input, style.id, parsedPlan.value.recipeId, project.value.id));
    }
  }
  styleRevisions.sort((left, right) => left.styleId.localeCompare(right.styleId) || left.revisionNumber - right.revisionNumber);
  exportManifests.sort((left, right) => left.styleId.localeCompare(right.styleId)
    || left.capturedAt.localeCompare(right.capturedAt) || left.manifestId.localeCompare(right.manifestId));
  return {
    project: bundle.value.project,
    styles: bundle.value.styles,
    activeStyle,
    activeRecovery,
    fieldObservations,
    styleRevisions,
    exportManifests,
    ...(gradePlans.length > 0 ? { gradePlans } : {}),
  };
}

async function verifyLoadedHistory(loaded: LoadedProject, crypto?: Crypto): Promise<LoadedProject> {
  const revisionsByStyle = new Map<string, StyleRevisionRecord[]>();
  for (const revision of loaded.styleRevisions) {
    if (!await verifyStyleRevision(revision, crypto)) {
      throw new ProjectRepositoryError("invalid-data", `Style revision ${revision.revisionId} failed its SHA-256 integrity check.`);
    }
    const list = revisionsByStyle.get(revision.styleId) ?? [];
    list.push(revision);
    revisionsByStyle.set(revision.styleId, list);
  }
  for (const style of loaded.styles) {
    const revisions = (revisionsByStyle.get(style.id) ?? []).sort((left, right) => left.revisionNumber - right.revisionNumber);
    if (style.revisionHeadId === null) {
      if (revisions.length !== 0) throw new ProjectRepositoryError("invalid-data", "A style has revision rows but no revision head.");
      continue;
    }
    if (revisions.length === 0 || revisions[0]!.revisionNumber !== 1 || revisions[0]!.parentRevisionId !== null) {
      throw new ProjectRepositoryError("invalid-data", "A style revision history has no valid initial parentless revision.");
    }
    for (let index = 0; index < revisions.length; index += 1) {
      const revision = revisions[index]!;
      const previous = revisions[index - 1];
      if (revision.revisionNumber !== index + 1
        || (index > 0 && (revision.parentRevisionId !== previous!.revisionId
          || revision.revisionNumber !== previous!.revisionNumber + 1))) {
        throw new ProjectRepositoryError("invalid-data", "A style revision history has a missing, reordered, or broken parent link.");
      }
    }
    const head = revisions[revisions.length - 1]!;
    if (head.revisionId !== style.revisionHeadId || canonicalizeJcs(head.payload.design) !== canonicalizeJcs(style.design)) {
      throw new ProjectRepositoryError("invalid-data", "The saved style does not match its immutable revision head.");
    }
  }
  for (const manifest of loaded.exportManifests) {
    if (!await verifyFrozenOutputManifestMetadata(manifest, crypto)) {
      throw new ProjectRepositoryError("invalid-data", `Frozen output manifest ${manifest.manifestId} failed its packet-digest integrity check.`);
    }
    const revision = loaded.styleRevisions.find((candidate) => candidate.revisionId === manifest.revisionId);
    if (!revision || revision.styleId !== manifest.styleId
      || revision.revisionContentDigest !== manifest.payload.revisionContentDigest) {
      throw new ProjectRepositoryError("invalid-data", `Frozen output manifest ${manifest.manifestId} points to a missing or mismatched revision.`);
    }
  }
  return loaded;
}

function validExpectedRevision(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 1);
}

function parseProjectImportReceipt(value: unknown): ProjectImportReceipt | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = ["packageSha256", "projectId", "importedAt", "importedAsCopy"];
  if (Object.keys(record).length !== keys.length || !keys.every((key) => Object.prototype.hasOwnProperty.call(record, key))
    || typeof record.packageSha256 !== "string" || !/^[0-9a-f]{64}$/.test(record.packageSha256)
    || typeof record.projectId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.projectId)
    || typeof record.importedAt !== "string" || !Number.isFinite(Date.parse(record.importedAt))
    || new Date(Date.parse(record.importedAt)).toISOString() !== record.importedAt
    || typeof record.importedAsCopy !== "boolean") return null;
  return record as unknown as ProjectImportReceipt;
}

function buildDefaultSaveJson(): string {
  return serialize(STANDARD_M, DEFAULT_FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE);
}

export async function openProjectRepository(options: ProjectRepositoryOptions = {}): Promise<ProjectRepository> {
  const name = options.name ?? PROJECT_DATABASE_NAME;
  const requestedVersion = options.requestedVersion ?? PROJECT_DATABASE_VERSION;
  const factory = options.factory ?? globalThis.indexedDB;
  if (!factory || typeof factory.open !== "function") {
    throw new ProjectRepositoryError("unavailable", "IndexedDB is not available in this application context.");
  }
  if (typeof name !== "string" || name.trim().length === 0 || !Number.isInteger(requestedVersion)
    || requestedVersion < 1) {
    throw new ProjectRepositoryError("invalid-data", "Project database name or requested version is invalid.");
  }
  if (requestedVersion !== PROJECT_DATABASE_VERSION) {
    throw new ProjectRepositoryError("unsupported-version", `This application supports project storage schema version ${PROJECT_DATABASE_VERSION} only.`);
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = factory.open(name, requestedVersion);
    request.onupgradeneeded = (event) => {
      try {
        if (event.oldVersion === 0 && event.newVersion === PROJECT_DATABASE_VERSION) {
          createSchema(request.result);
        } else if (event.oldVersion === 1 && event.newVersion === PROJECT_DATABASE_VERSION) {
          if (!request.result.objectStoreNames.contains(PROJECT_STORES.imports)) {
            request.result.createObjectStore(PROJECT_STORES.imports, { keyPath: "packageSha256" });
          }
          addFieldObservationStore(request.result);
          seedFieldObservations(request.transaction, true, true);
          upgradeProjectRecordsV1(request.transaction);
          upgradeEditStateRecoveries(request.transaction);
        } else if (event.oldVersion === 2 && event.newVersion === PROJECT_DATABASE_VERSION) {
          if (!request.result.objectStoreNames.contains(PROJECT_STORES.imports)) {
            request.result.createObjectStore(PROJECT_STORES.imports, { keyPath: "packageSha256" });
          }
          addFieldObservationStore(request.result);
          seedFieldObservations(request.transaction, false, true);
          upgradeProjectRecordsV1(request.transaction);
          upgradeEditStateRecoveries(request.transaction);
        } else if (event.oldVersion === 3 && event.newVersion === PROJECT_DATABASE_VERSION) {
          addFieldObservationStore(request.result);
          seedFieldObservations(request.transaction, false, true);
          upgradeEditStateRecoveries(request.transaction);
        } else if (event.oldVersion === 4 && event.newVersion === PROJECT_DATABASE_VERSION) {
          upgradeEditStateStyles(request.transaction);
          upgradeEditStateRecoveries(request.transaction);
        } else if (event.oldVersion === 5 && event.newVersion === PROJECT_DATABASE_VERSION) {
          // The v6 transition is additive: store creation and a strict style
          // schema upgrade only. Hashing/seed rows happen after the upgrade.
        } else if (event.oldVersion === 6 && event.newVersion === PROJECT_DATABASE_VERSION) {
          // The v7 transition only adds the empty capture-session store; no
          // existing project, style, history, or output row is rewritten.
        } else if (event.oldVersion === 7 && event.newVersion === PROJECT_DATABASE_VERSION) {
          // The v8 transition only adds the empty grade-plan store; no
          // existing project, style, history, output, or capture row is rewritten.
        } else {
          request.transaction?.abort();
          return;
        }
        createImmutableHistoryStores(request.result);
        createMeasurementCaptureStore(request.result);
        createGradePlanStore(request.result);
        if (event.oldVersion === 5) upgradeStyleRevisionHeads(request.transaction);
      } catch {
        try { request.transaction?.abort(); } catch { /* The upgrade transaction may already be aborting. */ }
      }
    };
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      reject(new ProjectRepositoryError("blocked", "Close other InfiniDrip tabs, then retry opening project storage."));
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      if (request.error?.name === "VersionError") {
        reject(new ProjectRepositoryError("unsupported-version", "Project storage was created by a newer application version."));
      } else {
        const reason = request.error ? ` ${request.error.name}: ${request.error.message}` : "";
        reject(new ProjectRepositoryError("unavailable", `Project storage could not be opened. Existing saved data was not changed.${reason}`));
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled || database.version !== PROJECT_DATABASE_VERSION || !hasSupportedSchema(database)) {
        database.close();
        if (!settled) {
          settled = true;
          reject(new ProjectRepositoryError("unsupported-version", "Project storage schema is not supported by this application."));
        }
        return;
      }
      settled = true;
      resolve(new ProjectRepository(database, options.crypto ?? globalThis.crypto, options.onVersionChange));
    };
  });
}

export class ProjectRepository {
  private closed = false;

  constructor(
    private readonly database: IDBDatabase,
    private readonly cryptoApi: Crypto | undefined,
    onVersionChange?: () => void,
  ) {
    database.onversionchange = () => {
      this.closed = true;
      database.close();
      try { onVersionChange?.(); } catch { /* UI notification must not keep a stale connection open. */ }
    };
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.database.close();
  }

  private ensureOpen(): void {
    if (this.closed) throw new ProjectRepositoryError("closed", "Project storage connection is closed. Reopen it and retry.");
  }

  async loadProject(projectId: string): Promise<LoadedProject | null> {
    this.ensureOpen();
    const loaded = await inTransaction(this.database,
      ALL_STORES, "readonly",
      (transaction) => bundleInTransaction(transaction, projectId));
    return loaded ? verifyLoadedHistory(loaded, this.cryptoApi) : null;
  }

  async readProjectBundle(projectId: string): Promise<ProjectBundleSnapshot | null> {
    this.ensureOpen();
    const snapshot = await inTransaction(this.database,
      ALL_STORES, "readonly",
      async (transaction) => {
        const loaded = await bundleInTransaction(transaction, projectId);
        if (!loaded) return null;
        const recoveries: RecoveryRecord[] = [];
        for (const style of loaded.styles) {
          const input = await requestValue<RecoveryRecord | undefined>(
            transaction.objectStore(PROJECT_STORES.recoveries).get(style.id),
          );
          if (input === undefined) continue;
          const parsed = parseRecoveryRecord(input);
          if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
          recoveries.push(parsed.value);
        }
        const measurementCaptures: MeasurementCaptureRecord[] = [];
        const captureIndex = transaction.objectStore(PROJECT_STORES.measurementCaptures).index("styleId");
        for (const style of loaded.styles) {
          // Index order follows the [styleId, recipeId] primary key, so backups are deterministic.
          for (const input of await requestValue<unknown[]>(captureIndex.getAll(style.id))) {
            // The compound key path guarantees an indexed row carries a recipe key; parsing validates it.
            const recipeId = (input as { readonly recipeId: string }).recipeId;
            measurementCaptures.push(storedCapture(input, style.id, recipeId, loaded.project.id));
          }
        }
        return {
          project: loaded.project,
          styles: loaded.styles,
          recoveries,
          fieldObservations: loaded.fieldObservations,
          styleRevisions: loaded.styleRevisions,
          exportManifests: loaded.exportManifests,
          ...(measurementCaptures.length > 0 ? { measurementCaptures } : {}),
          ...(loaded.gradePlans === undefined ? {} : { gradePlans: loaded.gradePlans }),
        };
      });
    if (!snapshot) return null;
    await verifyLoadedHistory({
      project: snapshot.project,
      styles: snapshot.styles,
      activeStyle: snapshot.styles.find((style) => style.id === snapshot.project.activeStyleId)!,
      activeRecovery: snapshot.recoveries.find((recovery) => recovery.styleId === snapshot.project.activeStyleId) ?? null,
      fieldObservations: snapshot.fieldObservations,
      styleRevisions: snapshot.styleRevisions,
      exportManifests: snapshot.exportManifests,
    }, this.cryptoApi);
    return snapshot;
  }

  async readActiveProject(): Promise<LoadedProject | null> {
    this.ensureOpen();
    const loaded = await inTransaction(this.database, ALL_STORES, "readonly", async (transaction) => {
      const stored = await requestValue(transaction.objectStore(PROJECT_STORES.meta).get(ACTIVE_SELECTION_KEY));
      if (stored === undefined) return null;
      if (!validActiveSelection(stored)) {
        throw new ProjectRepositoryError("invalid-data", "Active project selection is malformed.");
      }
      const loaded = await bundleInTransaction(transaction, stored.projectId, stored.styleId);
      if (!loaded) throw new ProjectRepositoryError("invalid-data", "Active project selection points to a missing project.");
      return loaded;
    });
    return loaded ? verifyLoadedHistory(loaded, this.cryptoApi) : null;
  }

  async listProjects(): Promise<readonly LoadedProject[]> {
    this.ensureOpen();
    const loaded = await inTransaction(this.database, ALL_STORES, "readonly", async (transaction) => {
      const inputs = await requestValue<ProjectRecord[]>(transaction.objectStore(PROJECT_STORES.projects).getAll());
      const projects = inputs.map((input) => {
        const parsed = parseProjectRecord(input);
        if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
        return parsed.value;
      }).sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
      const loaded: LoadedProject[] = [];
      for (const project of projects) {
        const entry = await bundleInTransaction(transaction, project.id);
        if (!entry) throw new ProjectRepositoryError("invalid-data", "A listed project disappeared during its read transaction.");
        loaded.push(entry);
      }
      return loaded;
    });
    return Promise.all(loaded.map((project) => verifyLoadedHistory(project, this.cryptoApi)));
  }

  async selectActiveProject(projectId: string): Promise<LoadedProject> {
    this.ensureOpen();
    if (typeof projectId !== "string" || projectId.trim().length === 0) {
      throw new ProjectRepositoryError("invalid-data", "Project ID is invalid.");
    }
    return inTransaction(this.database, ALL_STORES, "readwrite", async (transaction) => {
      const loaded = await bundleInTransaction(transaction, projectId);
      if (!loaded) throw new ProjectRepositoryError("not-found", "Project does not exist.");
      transaction.objectStore(PROJECT_STORES.meta).put(selection(projectId, loaded.activeStyle.id));
      return loaded;
    });
  }

  async hasStyleIdCollision(styleIds: readonly string[]): Promise<boolean> {
    this.ensureOpen();
    if (!Array.isArray(styleIds) || styleIds.some((id) => typeof id !== "string" || id.trim().length === 0)) {
      throw new ProjectRepositoryError("invalid-data", "Style collision check requires valid IDs.");
    }
    return inTransaction(this.database, [PROJECT_STORES.styles], "readonly", async (transaction) => {
      const store = transaction.objectStore(PROJECT_STORES.styles);
      for (const id of styleIds) {
        if (await requestValue<StyleRecord | undefined>(store.get(id)) !== undefined) return true;
      }
      return false;
    });
  }

  async readProjectImportReceipt(packageSha256: string): Promise<ProjectImportReceipt | null> {
    this.ensureOpen();
    if (typeof packageSha256 !== "string" || !/^[0-9a-f]{64}$/.test(packageSha256)) {
      throw new ProjectRepositoryError("invalid-data", "Project package SHA-256 is invalid.");
    }
    return inTransaction(this.database, [PROJECT_STORES.imports], "readonly", async (transaction) => {
      const receipt = await requestValue<ProjectImportReceipt | undefined>(
        transaction.objectStore(PROJECT_STORES.imports).get(packageSha256),
      );
      if (receipt === undefined) return null;
      const parsed = parseProjectImportReceipt(receipt);
      if (!parsed) throw new ProjectRepositoryError("invalid-data", "Project package import receipt is malformed.");
      return parsed;
    });
  }

  async importProjectBundle(input: ImportProjectBundleInput): Promise<ImportProjectBundleOutcome> {
    this.ensureOpen();
    const bundle = validateProjectBundle(input.project, input.styles);
    if (!bundle.ok) throw new ProjectRepositoryError("invalid-data", bundle.error);
    const recoveries = parseRecoveryInputs(input.recoveries, bundle.value.project.styleIds);
    const fieldObservations = parseFieldObservationInputs(
      input.fieldObservations ?? bundle.value.styles.map((style) =>
        createFieldObservationRecord(style, style.updatedAt, "package-v1")),
      bundle.value.project.styleIds,
    );
    if (fieldObservations.length !== bundle.value.styles.length) {
      throw new ProjectRepositoryError("invalid-data", "Every imported style must include its field observation history.");
    }
    const styleRevisions = await parseStyleRevisionInputs(input.styleRevisions, this.cryptoApi);
    const exportManifests = await parseExportManifestInputs(input.exportManifests, this.cryptoApi);
    const revisionIds = new Set(styleRevisions.map((revision) => revision.revisionId));
    for (const style of bundle.value.styles) {
      if (style.revisionHeadId !== null && !revisionIds.has(style.revisionHeadId)) {
        throw new ProjectRepositoryError("invalid-data", "An imported style is missing its immutable revision head.");
      }
      const history = styleRevisions.filter((revision) => revision.styleId === style.id).sort((left, right) => left.revisionNumber - right.revisionNumber);
      if (style.revisionHeadId === null) {
        if (history.length !== 0) {
          throw new ProjectRepositoryError("invalid-data", "An imported unseeded style cannot contain immutable revision rows.");
        }
        continue;
      }
      if (style.revisionHeadId !== null && (history.length === 0 || history[history.length - 1]!.revisionId !== style.revisionHeadId
        || history[0]!.revisionNumber !== 1 || history[0]!.parentRevisionId !== null
        || history.some((revision, index) => revision.revisionNumber !== index + 1
          || (index > 0 && revision.parentRevisionId !== history[index - 1]!.revisionId)))) {
        throw new ProjectRepositoryError("invalid-data", "An imported style revision history has an invalid sequence or parent chain.");
      }
    }
    if (styleRevisions.some((revision) => !bundle.value.project.styleIds.includes(revision.styleId))
      || exportManifests.some((manifest) => !bundle.value.project.styleIds.includes(manifest.styleId))) {
      throw new ProjectRepositoryError("invalid-data", "Imported immutable history must belong to a style in the imported project.");
    }
    const measurementCaptures = parseMeasurementCaptureInputs(
      input.measurementCaptures, bundle.value.project.id, bundle.value.project.styleIds,
    );
    const gradePlans = parseGradePlanInputs(input.gradePlans, bundle.value.project.id, bundle.value.project.styleIds);
    for (const style of bundle.value.styles) {
      if (isCustomOneSizeStyle(style) && !measurementCaptures.some((record) => record.styleId === style.id
        && record.projectId === style.projectId && record.recipeId === style.recipeId)) {
        throw new ProjectRepositoryError("invalid-data", "A custom one-size style must be imported with its matching measurement capture session.");
      }
    }
    const stylesById = new Map(bundle.value.styles.map((style) => [style.id, style]));
    for (const plan of gradePlans) {
      const style = stylesById.get(plan.styleId)!;
      if (!isCustomOneSizeStyle(style)) {
        throw new ProjectRepositoryError("invalid-data", "Grade plans are supported only for custom one-size styles.");
      }
      if (style.recipeId !== plan.recipeId) {
        throw new ProjectRepositoryError("invalid-data", "Grade-plan recipe must match its style recipe.");
      }
      const capture = findInputCapture(measurementCaptures, plan.styleId, plan.recipeId);
      // The custom-style validation above requires a capture for this exact
      // style and recipe before any grade plan can be imported.
      assertGradePlanBase(plan, style, capture!);
    }
    const receipt = parseProjectImportReceipt(input.receipt);
    if (!receipt || receipt.projectId !== bundle.value.project.id) {
      throw new ProjectRepositoryError("invalid-data", "Project package import receipt does not match the imported project.");
    }
    if (input.receipt.importedAsCopy && bundle.value.project.importedFrom === null) {
      throw new ProjectRepositoryError("invalid-data", "An imported copy must retain its source project lineage.");
    }
    return inTransaction(this.database, ALL_STORES, "readwrite", async (transaction) => {
      const imports = transaction.objectStore(PROJECT_STORES.imports);
      const existingReceipt = await requestValue<ProjectImportReceipt | undefined>(
        imports.get(receipt.packageSha256),
      );
      if (existingReceipt !== undefined) {
        const parsed = parseProjectImportReceipt(existingReceipt);
        if (!parsed) throw new ProjectRepositoryError("invalid-data", "Project package import receipt is malformed.");
        return { status: "already-imported", receipt: parsed };
      }
      const projects = transaction.objectStore(PROJECT_STORES.projects);
      if (await requestValue<ProjectRecord | undefined>(projects.get(bundle.value.project.id)) !== undefined) {
        throw new ProjectRepositoryError("conflict", "A project with this ID already exists; import this package as a copy.");
      }
      const styles = transaction.objectStore(PROJECT_STORES.styles);
      for (const style of bundle.value.styles) {
        if (await requestValue<StyleRecord | undefined>(styles.get(style.id)) !== undefined) {
          throw new ProjectRepositoryError("conflict", "A style ID already exists; import this package as a copy.");
        }
      }
      projects.add(bundle.value.project);
      for (const style of bundle.value.styles) styles.add(style);
      const revisionStore = transaction.objectStore(PROJECT_STORES.styleRevisions);
      const manifestStore = transaction.objectStore(PROJECT_STORES.exportManifests);
      for (const revision of styleRevisions) revisionStore.add(revision);
      for (const manifest of exportManifests) {
        const target = styleRevisions.find((revision) => revision.revisionId === manifest.revisionId);
        if (!target || target.styleId !== manifest.styleId
          || target.revisionContentDigest !== manifest.payload.revisionContentDigest) {
          throw new ProjectRepositoryError("invalid-data", "Imported frozen output manifest references a missing or mismatched revision.");
        }
        manifestStore.add(manifest);
      }
      for (const recovery of recoveries) transaction.objectStore(PROJECT_STORES.recoveries).add(recovery);
      for (const record of fieldObservations) transaction.objectStore(PROJECT_STORES.fieldObservations).add(record);
      for (const record of measurementCaptures) transaction.objectStore(PROJECT_STORES.measurementCaptures).add(record);
      for (const plan of gradePlans) transaction.objectStore(PROJECT_STORES.gradePlans).add(plan);
      transaction.objectStore(PROJECT_STORES.meta).put(selection(
        bundle.value.project.id,
        bundle.value.project.activeStyleId,
      ));
      imports.add(receipt);
      return { status: "imported", project: bundle.value.project };
    });
  }

  async saveProjectBundle(input: SaveProjectBundleInput): Promise<ProjectRecord> {
    return this.writeProjectBundle(input, false);
  }

  private async writeProjectBundle(input: SaveProjectBundleInput, requireEmptyRepository: boolean): Promise<ProjectRecord> {
    this.ensureOpen();
    const bundle = validateProjectBundle(input.project, input.styles);
    if (!bundle.ok) throw new ProjectRepositoryError("invalid-data", bundle.error);
    if (!validExpectedRevision(input.expectedProjectRevision)) {
      throw new ProjectRepositoryError("invalid-data", "Expected project revision is invalid.");
    }
    const expected = input.expectedProjectRevision;
    if ((expected === null && bundle.value.project.revision !== 1)
      || (expected !== null && bundle.value.project.revision !== expected + 1)) {
      throw new ProjectRepositoryError("invalid-data", "Project revision must be 1 for creation or advance exactly once.");
    }
    const recoveries = parseRecoveryInputs(input.recoveries, bundle.value.project.styleIds);
    const fieldObservations = parseFieldObservationInputs(input.fieldObservations, bundle.value.project.styleIds);
    const styleRevisions = await parseStyleRevisionInputs(input.styleRevisions, this.cryptoApi);
    const exportManifests = await parseExportManifestInputs(input.exportManifests, this.cryptoApi);
    const measurementCaptures = parseMeasurementCaptureInputs(
      input.measurementCaptures, bundle.value.project.id, bundle.value.project.styleIds,
    );
    const gradePlans = parseGradePlanInputs(
      input.gradePlans, bundle.value.project.id, bundle.value.project.styleIds,
    );
    const expectedFreezePlan = input.gradePlanFreeze
      ? parseGradePlanRecord(input.gradePlanFreeze.record)
      : null;
    if (input.gradePlanFreeze && (!expectedFreezePlan?.ok
      || expectedFreezePlan.value.status !== "approved"
      || !/^grade-plan-sha256:[0-9a-f]{64}$/.test(input.gradePlanFreeze.approvalRef))) {
      throw new ProjectRepositoryError("invalid-data", "A frozen graded run needs the exact approved grade-plan record and digest reference.");
    }
    if (input.gradePlanFreeze && expectedFreezePlan?.ok
      && input.gradePlanFreeze.approvalRef !== `grade-plan-sha256:${await jcsSha256Hex(expectedFreezePlan.value, this.cryptoApi)}`) {
      throw new ProjectRepositoryError("invalid-data", "A frozen grade-plan approval reference must be the canonical digest of the exact approved plan.");
    }
    const bundleStylesById = new Map(bundle.value.styles.map((style) => [style.id, style]));
    for (const record of measurementCaptures) {
      const style = bundleStylesById.get(record.styleId)!;
      if (style.recipeId !== record.recipeId) {
        throw new ProjectRepositoryError("invalid-data", "Measurement capture recipe must match its style recipe.");
      }
      if (record.revision !== 1) {
        throw new ProjectRepositoryError("invalid-data", "Measurement capture revision must be 1 for creation in a project bundle.");
      }
      if (style.archivedAt !== null) {
        throw new ProjectRepositoryError("invalid-data", "An archived style's capture session is read-only; restore the style first.");
      }
    }
    for (const plan of gradePlans) {
      const style = bundleStylesById.get(plan.styleId)!;
      if (!isCustomOneSizeStyle(style)) {
        throw new ProjectRepositoryError("invalid-data", "Grade plans are supported only for custom one-size styles.");
      }
      if (style.recipeId !== plan.recipeId) {
        throw new ProjectRepositoryError("invalid-data", "Grade-plan recipe must match its style recipe.");
      }
      if (plan.revision !== 1) {
        throw new ProjectRepositoryError("invalid-data", "Grade-plan revision must be 1 for creation in a project bundle.");
      }
      if (style.archivedAt !== null) {
        throw new ProjectRepositoryError("invalid-data", "An archived style's grade plan is read-only; restore the style first.");
      }
    }
    const clearRecoveryStyleIds = parseRecoveryClears(input.clearRecoveryStyleIds, bundle.value.project.styleIds);
    if (recoveries.some((recovery) => clearRecoveryStyleIds.includes(recovery.styleId))) {
      throw new ProjectRepositoryError("invalid-data", "A recovery record cannot be saved and cleared in the same bundle.");
    }
    const revisionsByStyle = new Map<string, StyleRevisionRecord[]>();
    for (const revision of styleRevisions) {
      const rows = revisionsByStyle.get(revision.styleId) ?? [];
      rows.push(revision);
      revisionsByStyle.set(revision.styleId, rows);
    }
    if (styleRevisions.some((revision) => !bundle.value.project.styleIds.includes(revision.styleId))
      || exportManifests.some((manifest) => !bundle.value.project.styleIds.includes(manifest.styleId))) {
      throw new ProjectRepositoryError("invalid-data", "Immutable history must belong to a style in the saved project.");
    }
    return inTransaction(this.database, ALL_STORES, "readwrite", async (transaction) => {
      const projects = transaction.objectStore(PROJECT_STORES.projects);
      const styles = transaction.objectStore(PROJECT_STORES.styles);
      if (requireEmptyRepository) {
        const [activeSelection, existingProjects] = await Promise.all([
          requestValue(transaction.objectStore(PROJECT_STORES.meta).get(ACTIVE_SELECTION_KEY)),
          requestValue<ProjectRecord[]>(projects.getAll()),
        ]);
        if (activeSelection !== undefined || existingProjects.length > 0) {
          throw new ProjectRepositoryError("already-initialized", "A local project already exists; first-run setup was not repeated.");
        }
      }
      const current = await requestValue<ProjectRecord | undefined>(projects.get(bundle.value.project.id));
      let currentProject: ProjectRecord | undefined;
      if (current !== undefined) {
        const parsedCurrent = parseProjectRecord(current);
        if (!parsedCurrent.ok) throw new ProjectRepositoryError("invalid-data", parsedCurrent.error);
        currentProject = parsedCurrent.value;
      }
      if ((expected === null && currentProject !== undefined)
        || (expected !== null && (!currentProject || currentProject.revision !== expected))) {
        throw new ProjectRepositoryError("conflict", "Project changed in another tab; reload or save a separate copy.");
      }
      const allStyles = await requestValue<StyleRecord[]>(styles.getAll());
      if (input.gradePlanFreeze && expectedFreezePlan?.ok) {
        const expectedPlan = expectedFreezePlan.value;
        const storedInput = await requestValue<unknown>(transaction.objectStore(PROJECT_STORES.gradePlans)
          .get([expectedPlan.styleId, expectedPlan.recipeId]));
        const storedPlan = storedInput === undefined
          ? null : storedGradePlan(storedInput, expectedPlan.styleId, expectedPlan.recipeId, expectedPlan.projectId);
        const style = allStyles.map((candidate) => parseStyleRecord(candidate))
          .find((candidate) => candidate.ok && candidate.value.id === expectedPlan.styleId);
        if (!storedPlan || canonicalizeJcs(storedPlan) !== canonicalizeJcs(expectedPlan)
          || !style?.ok || style.value.revisionHeadId !== expectedPlan.revisionHeadId) {
          throw new ProjectRepositoryError("conflict", "The approved grade plan or its saved base changed while outputs were being frozen; reload and recheck the run.");
        }
        const capture = await requireStoredPlanCapture(transaction, expectedPlan);
        assertGradePlanBase(expectedPlan, style.value, capture);
        const matchingManifest = exportManifests.find((manifest) => manifest.styleId === expectedPlan.styleId);
        if (!matchingManifest || matchingManifest.schemaVersion !== 2
          || matchingManifest.payload.approvalRefs.length !== 1
          || matchingManifest.payload.approvalRefs[0] !== input.gradePlanFreeze.approvalRef) {
          throw new ProjectRepositoryError("invalid-data", "The frozen output manifest is not bound to the reviewed grade plan.");
        }
      }
      const observationStore = transaction.objectStore(PROJECT_STORES.fieldObservations);
      const revisionStore = transaction.objectStore(PROJECT_STORES.styleRevisions);
      const manifestStore = transaction.objectStore(PROJECT_STORES.exportManifests);
      const captureStore = transaction.objectStore(PROJECT_STORES.measurementCaptures);
      const gradePlanStore = transaction.objectStore(PROJECT_STORES.gradePlans);
      for (const record of measurementCaptures) {
        if (await requestValue<unknown>(captureStore.get([record.styleId, record.recipeId])) !== undefined) {
          throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate capture sessions for one style and recipe.");
        }
      }
      for (const plan of gradePlans) {
        if (await requestValue<unknown>(gradePlanStore.get([plan.styleId, plan.recipeId])) !== undefined) {
          throw new ProjectRepositoryError("invalid-data", "A project bundle contains duplicate grade plans for one style and recipe.");
        }
      }
      for (const plan of gradePlans) {
        const style = bundleStylesById.get(plan.styleId)!;
        const inputCapture = findInputCapture(measurementCaptures, plan.styleId, plan.recipeId);
        const capture = inputCapture ?? await requireStoredPlanCapture(transaction, plan);
        assertGradePlanBase(plan, style, capture);
      }
      for (const style of bundle.value.styles) {
        if (!isCustomOneSizeStyle(style) || measurementCaptures.some((record) => record.styleId === style.id
          && record.projectId === style.projectId && record.recipeId === style.recipeId)) continue;
        const storedInput = await requestValue<unknown>(captureStore.get([style.id, style.recipeId]));
        const stored = storedInput === undefined ? null : parseMeasurementCaptureRecord(storedInput);
        if (!stored?.ok || stored.value.projectId !== style.projectId || stored.value.styleId !== style.id
          || stored.value.recipeId !== style.recipeId) {
          throw new ProjectRepositoryError("invalid-data", "A custom one-size style requires its matching saved measurement capture session.");
        }
      }
      const incomingObservations = new Map(fieldObservations.map((record) => [record.styleId, record]));
      const nextObservations: FieldObservationRecord[] = [];
      const incomingIds = new Set(bundle.value.styles.map((style) => style.id));
      const existingStyles = new Map<string, StyleRecord>();
      for (const existing of allStyles) {
        const parsed = parseStyleRecord(existing);
        if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
        existingStyles.set(parsed.value.id, parsed.value);
        if (parsed.value.projectId === bundle.value.project.id && !incomingIds.has(parsed.value.id)) {
          throw new ProjectRepositoryError("invalid-data", "A style cannot be removed from a project by a bundle save.");
        }
      }
      for (const style of bundle.value.styles) {
        const existing = existingStyles.get(style.id);
        if (existing && isCustomOneSizeStyle(existing) && style.recipeId !== existing.recipeId) {
          throw new ProjectRepositoryError("invalid-data", "A custom one-size style cannot change its recipe.");
        }
        if (existing && existing.projectId !== style.projectId) {
          throw new ProjectRepositoryError("conflict", "A style ID already belongs to another project.");
        }
        if (existing && style.revision < existing.revision) {
          throw new ProjectRepositoryError("conflict", "A stale style revision cannot replace a newer saved style.");
        }
        const appended = revisionsByStyle.get(style.id) ?? [];
        if (appended.length > 1) throw new ProjectRepositoryError("invalid-data", "A single style save may append at most one child revision.");
        if (existing) {
          const designChanged = canonicalizeJcs(existing.design) !== canonicalizeJcs(style.design);
          if (designChanged && appended.length !== 1) {
            throw new ProjectRepositoryError("invalid-data", "A changed saved design must append one immutable revision.");
          }
          if (appended.length === 0 && style.revisionHeadId !== existing.revisionHeadId) {
            throw new ProjectRepositoryError("invalid-data", "A style revision head cannot move without an appended revision row.");
          }
          if (appended.length === 1) {
            const next = appended[0]!;
            if (next.styleId !== style.id || next.parentRevisionId !== existing.revisionHeadId
              || style.revisionHeadId !== next.revisionId
              || canonicalizeJcs(next.payload.design) !== canonicalizeJcs(style.design)) {
              throw new ProjectRepositoryError("invalid-data", "A new revision must snapshot this style and extend its current head.");
            }
            const priorRows = await requestValue<unknown[]>(revisionStore.index("styleId").getAll(style.id));
            if (existing.revisionHeadId === null) {
              if (priorRows.length !== 0 || next.revisionNumber !== 1 || next.parentRevisionId !== null) {
                throw new ProjectRepositoryError("conflict", "An unseeded style cannot attach a non-initial revision.");
              }
            } else {
              const headInput = await requestValue<unknown>(revisionStore.get(existing.revisionHeadId));
              const head = parseStyleRevisionRecord(headInput);
              if (!head || head.revisionNumber + 1 !== next.revisionNumber || next.parentRevisionId !== head.revisionId) {
                throw new ProjectRepositoryError("conflict", "The immutable style revision head changed; reload before saving.");
              }
            }
            const nextObservations = incomingObservations.get(style.id);
            if (!nextObservations || canonicalizeJcs(next.payload.fieldObservations) !== canonicalizeJcs(nextObservations)) {
              throw new ProjectRepositoryError("invalid-data", "A new revision must freeze the exact current field-observation record.");
            }
          }
        } else if (appended.length > 0) {
          const initial = appended[0]!;
          if (appended.length !== 1 || initial.parentRevisionId !== null || initial.revisionNumber !== 1
            || style.revisionHeadId !== initial.revisionId
            || canonicalizeJcs(initial.payload.design) !== canonicalizeJcs(style.design)) {
            throw new ProjectRepositoryError("invalid-data", "A newly created style must start with exactly one parentless revision.");
          }
          const initialObservations = incomingObservations.get(style.id);
          if (!initialObservations || canonicalizeJcs(initial.payload.fieldObservations) !== canonicalizeJcs(initialObservations)) {
            throw new ProjectRepositoryError("invalid-data", "The initial revision must freeze the new style field history.");
          }
        } else if (style.revisionHeadId !== null) {
          throw new ProjectRepositoryError("invalid-data", "A new style cannot point at a revision that was not inserted with it.");
        }
        const priorInput = await requestValue<unknown>(observationStore.get(style.id));
        const incoming = incomingObservations.get(style.id);
        if (priorInput !== undefined) {
          const prior = parseFieldObservationRecord(priorInput);
          if (!prior.ok) throw new ProjectRepositoryError("invalid-data", prior.error);
          if (incoming && !isAppendOnlyExtension(prior.value, incoming)) {
            throw new ProjectRepositoryError("invalid-data", "Field value history must preserve every earlier observation.");
          }
        } else {
          nextObservations.push(incoming
            ?? createFieldObservationRecord(style, style.updatedAt, "existing-local-style"));
        }
        if (incoming && priorInput !== undefined) nextObservations.push(incoming);
      }
      projects.put(bundle.value.project);
      for (const style of bundle.value.styles) styles.put(style);
      for (const record of measurementCaptures) captureStore.add(record);
      for (const plan of gradePlans) gradePlanStore.add(plan);
      for (const revision of styleRevisions) revisionStore.add(revision);
      for (const manifest of exportManifests) {
        const targetRevision = revisionsByStyle.get(manifest.styleId)?.find((revision) => revision.revisionId === manifest.revisionId)
          ?? parseStyleRevisionRecord(await requestValue<unknown>(revisionStore.get(manifest.revisionId)));
        if (!targetRevision || targetRevision.styleId !== manifest.styleId
          || targetRevision.revisionContentDigest !== manifest.payload.revisionContentDigest) {
          throw new ProjectRepositoryError("invalid-data", "A frozen manifest must point to an immutable revision with the same digest.");
        }
        manifestStore.add(manifest);
      }
      for (const record of nextObservations) observationStore.put(record);
      for (const recovery of recoveries) transaction.objectStore(PROJECT_STORES.recoveries).put(recovery);
      for (const styleId of clearRecoveryStyleIds) transaction.objectStore(PROJECT_STORES.recoveries).delete(styleId);
      transaction.objectStore(PROJECT_STORES.meta).put(selection(
        bundle.value.project.id,
        bundle.value.project.activeStyleId,
      ));
      return bundle.value.project;
    });
  }

  async saveRecovery(
    recordInput: RecoveryRecord,
    expectedProjectRevision: number,
    updatedAt: string,
    fieldObservationInput?: FieldObservationRecord,
  ): Promise<ProjectRecord> {
    this.ensureOpen();
    const parsedRecovery = parseRecoveryRecord(recordInput);
    if (!parsedRecovery.ok) throw new ProjectRepositoryError("invalid-data", parsedRecovery.error);
    if (!Number.isSafeInteger(expectedProjectRevision) || expectedProjectRevision < 1) {
      throw new ProjectRepositoryError("invalid-data", "Expected project revision is invalid.");
    }
    const timestamp = Date.parse(updatedAt);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== updatedAt) {
      throw new ProjectRepositoryError("invalid-data", "Updated timestamp must be canonical UTC ISO time.");
    }
    const fieldObservation = fieldObservationInput === undefined
      ? undefined
      : parseFieldObservationRecord(fieldObservationInput);
    if (fieldObservationInput !== undefined && !fieldObservation!.ok) {
      throw new ProjectRepositoryError("invalid-data", fieldObservation!.error);
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries, PROJECT_STORES.fieldObservations], "readwrite", async (transaction) => {
      const storedRecovery = parsedRecovery.value;
      const styleId = storedRecovery.styleId;
      const storedStyle = await requestValue<StyleRecord | undefined>(transaction.objectStore(PROJECT_STORES.styles).get(styleId));
      if (storedStyle === undefined) throw new ProjectRepositoryError("not-found", "Recovery style does not exist.");
      const style = parseStyleRecord(storedStyle);
      if (!style.ok) throw new ProjectRepositoryError("invalid-data", style.error);
      const projectInput = await requestValue<ProjectRecord | undefined>(transaction.objectStore(PROJECT_STORES.projects).get(style.value.projectId));
      if (projectInput === undefined) throw new ProjectRepositoryError("not-found", "Recovery project does not exist.");
      const project = parseProjectRecord(projectInput);
      if (!project.ok) throw new ProjectRepositoryError("invalid-data", project.error);
      if (style.value.projectId !== project.value.id || !project.value.styleIds.includes(styleId)) {
        throw new ProjectRepositoryError("invalid-data", "Recovery style does not belong to this project.");
      }
      if (project.value.revision !== expectedProjectRevision) {
        throw new ProjectRepositoryError("conflict", "Project changed in another tab; reload before saving recovery.");
      }
      if (fieldObservation?.ok) {
        const record = fieldObservation.value;
        if (record.styleId !== styleId) throw new ProjectRepositoryError("invalid-data", "Field history must belong to the recovery style.");
        const store = transaction.objectStore(PROJECT_STORES.fieldObservations);
        const priorInput = await requestValue<unknown>(store.get(styleId));
        if (priorInput === undefined) throw new ProjectRepositoryError("invalid-data", "The style has no initialized field observation history.");
        const prior = parseFieldObservationRecord(priorInput);
        if (!prior.ok) throw new ProjectRepositoryError("invalid-data", prior.error);
        if (!isAppendOnlyExtension(prior.value, record)) {
          throw new ProjectRepositoryError("conflict", "Field history changed in another tab; reload before recording the edit.");
        }
        store.put(record);
      }
      const updatedProject: ProjectRecord = {
        ...project.value,
        revision: project.value.revision + 1,
        updatedAt,
      };
      const validatedProject = parseProjectRecord(updatedProject);
      if (!validatedProject.ok) throw new ProjectRepositoryError("invalid-data", validatedProject.error);
      transaction.objectStore(PROJECT_STORES.projects).put(validatedProject.value);
      transaction.objectStore(PROJECT_STORES.recoveries).put(parsedRecovery.value);
      return validatedProject.value;
    });
  }

  async clearRecovery(styleId: string, expectedProjectRevision: number, updatedAt: string): Promise<ProjectRecord> {
    this.ensureOpen();
    if (typeof styleId !== "string" || styleId.trim().length === 0) {
      throw new ProjectRepositoryError("invalid-data", "Recovery style ID is invalid.");
    }
    if (!Number.isSafeInteger(expectedProjectRevision) || expectedProjectRevision < 1) {
      throw new ProjectRepositoryError("invalid-data", "Expected project revision is invalid.");
    }
    const timestamp = Date.parse(updatedAt);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== updatedAt) {
      throw new ProjectRepositoryError("invalid-data", "Updated timestamp must be canonical UTC ISO time.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries], "readwrite", async (transaction) => {
      const stored = await requestValue<StyleRecord | undefined>(transaction.objectStore(PROJECT_STORES.styles).get(styleId));
      if (stored === undefined) throw new ProjectRepositoryError("not-found", "Recovery style does not exist.");
      const style = parseStyleRecord(stored);
      if (!style.ok) throw new ProjectRepositoryError("invalid-data", style.error);
      const projectInput = await requestValue<ProjectRecord | undefined>(transaction.objectStore(PROJECT_STORES.projects).get(style.value.projectId));
      if (projectInput === undefined) throw new ProjectRepositoryError("not-found", "Recovery project does not exist.");
      const project = parseProjectRecord(projectInput);
      if (!project.ok) throw new ProjectRepositoryError("invalid-data", project.error);
      if (!project.value.styleIds.includes(styleId)) {
        throw new ProjectRepositoryError("invalid-data", "Recovery style does not belong to this project.");
      }
      if (project.value.revision !== expectedProjectRevision) {
        throw new ProjectRepositoryError("conflict", "Project changed in another tab; reload before clearing recovery.");
      }
      const recoveries = transaction.objectStore(PROJECT_STORES.recoveries);
      const existingRecovery = await requestValue<RecoveryRecord | undefined>(recoveries.get(styleId));
      if (existingRecovery === undefined) return project.value;
      const parsedExistingRecovery = parseRecoveryRecord(existingRecovery);
      if (!parsedExistingRecovery.ok) throw new ProjectRepositoryError("invalid-data", parsedExistingRecovery.error);
      const updatedProject: ProjectRecord = {
        ...project.value,
        revision: project.value.revision + 1,
        updatedAt,
      };
      const validatedProject = parseProjectRecord(updatedProject);
      if (!validatedProject.ok) throw new ProjectRepositoryError("invalid-data", validatedProject.error);
      recoveries.delete(styleId);
      transaction.objectStore(PROJECT_STORES.projects).put(validatedProject.value);
      return validatedProject.value;
    });
  }

  /** Reads one style's capture session for one recipe; null when none was saved. */
  async readMeasurementCapture(styleId: string, recipeId: string): Promise<MeasurementCaptureRecord | null> {
    this.ensureOpen();
    if (typeof styleId !== "string" || typeof recipeId !== "string" || recipeId.length === 0) {
      throw new ProjectRepositoryError("invalid-data", "Capture style or recipe ID is invalid.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.measurementCaptures], "readonly",
      async (transaction) => {
        const style = await styleOwnerInTransaction(transaction, styleId);
        const input = await requestValue<unknown>(
          transaction.objectStore(PROJECT_STORES.measurementCaptures).get([styleId, recipeId]),
        );
        return input === undefined ? null : storedCapture(input, styleId, recipeId, style.projectId);
      });
  }

  /**
   * Writes only the capture store. `expectedRevision` is null to create the
   * style/recipe session, otherwise the stored capture revision it replaces.
   * Project, style, recovery, history and output rows are never written here.
   */
  async saveMeasurementCapture(
    recordInput: MeasurementCaptureRecord,
    expectedRevision: number | null,
  ): Promise<MeasurementCaptureRecord> {
    this.ensureOpen();
    const parsed = parseMeasurementCaptureRecord(recordInput);
    if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
    if (!validExpectedRevision(expectedRevision)) {
      throw new ProjectRepositoryError("invalid-data", "Expected capture revision is invalid.");
    }
    const record = parsed.value;
    if (record.revision !== (expectedRevision === null ? 1 : expectedRevision + 1)) {
      throw new ProjectRepositoryError("invalid-data", "Capture revision must be 1 for creation or advance exactly once.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.measurementCaptures], "readwrite",
      async (transaction) => {
        const style = await styleOwnerInTransaction(transaction, record.styleId);
        if (style.projectId !== record.projectId) {
          throw new ProjectRepositoryError("invalid-data", "The capture session names a different project than its style.");
        }
        const store = transaction.objectStore(PROJECT_STORES.measurementCaptures);
        const priorInput = await requestValue<unknown>(store.get([record.styleId, record.recipeId]));
        const prior = priorInput === undefined ? null : storedCapture(priorInput, record.styleId, record.recipeId, style.projectId);
        if ((prior?.revision ?? null) !== expectedRevision) {
          throw new ProjectRepositoryError("conflict", "This capture session changed in another tab; reload it before saving.");
        }
        if (prior && (!isMeasurementCaptureSessionSuccessor(prior.session, record.session)
          || Date.parse(record.updatedAt) < Date.parse(prior.updatedAt))) {
          throw new ProjectRepositoryError("conflict", "A stale or different capture session cannot replace the saved readings.");
        }
        store.put(record);
        return record;
      });
  }

  /** Reads one custom one-size style's grade plan for one recipe; null when none was saved. */
  async readGradePlan(styleId: string, recipeId: string): Promise<GradePlanRecord | null> {
    this.ensureOpen();
    if (typeof styleId !== "string" || typeof recipeId !== "string" || recipeId.length === 0) {
      throw new ProjectRepositoryError("invalid-data", "Grade-plan style or recipe ID is invalid.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.gradePlans], "readonly",
      async (transaction) => {
        const style = await styleOwnerInTransaction(transaction, styleId);
        const input = await requestValue<unknown>(
          transaction.objectStore(PROJECT_STORES.gradePlans).get([styleId, recipeId]),
        );
        return input === undefined ? null : storedGradePlan(input, styleId, recipeId, style.projectId);
      });
  }

  /**
   * Writes only the grade-plan store. `expectedRevision` is null to create the
   * style/recipe plan, otherwise the stored plan revision it replaces.
   * The plan must name its custom one-size style's project, recipe, saved
   * immutable revision head, and saved capture revision. Project, style,
   * recovery, history, capture, and output rows are never written here.
   */
  async saveGradePlan(
    recordInput: GradePlanRecord,
    expectedRevision: number | null,
  ): Promise<GradePlanRecord> {
    this.ensureOpen();
    const parsed = parseGradePlanRecord(recordInput);
    if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.errors.join("; "));
    if (!validExpectedRevision(expectedRevision)) {
      throw new ProjectRepositoryError("invalid-data", "Expected grade-plan revision is invalid.");
    }
    const record = parsed.value;
    if (record.revision !== (expectedRevision === null ? 1 : expectedRevision + 1)) {
      throw new ProjectRepositoryError("invalid-data", "Grade-plan revision must be 1 for creation or advance exactly once.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.measurementCaptures, PROJECT_STORES.gradePlans],
      "readwrite",
      async (transaction) => {
        const style = await styleOwnerInTransaction(transaction, record.styleId);
        if (style.projectId !== record.projectId) {
          throw new ProjectRepositoryError("invalid-data", "The grade plan names a different project than its style.");
        }
        if (!isCustomOneSizeStyle(style)) {
          throw new ProjectRepositoryError("invalid-data", "Grade plans are supported only for custom one-size styles.");
        }
        const capture = await requireStoredPlanCapture(transaction, record);
        assertGradePlanBase(record, style, capture);
        const store = transaction.objectStore(PROJECT_STORES.gradePlans);
        const priorInput = await requestValue<unknown>(store.get([record.styleId, record.recipeId]));
        const prior = priorInput === undefined
          ? null
          : storedGradePlan(priorInput, record.styleId, record.recipeId, style.projectId);
        if ((prior?.revision ?? null) !== expectedRevision) {
          throw new ProjectRepositoryError("conflict", "This grade plan changed in another tab; reload it before saving.");
        }
        store.put(record);
        return record;
      });
  }

  async selectActiveStyle(projectId: string, styleId: string, expectedProjectRevision: number, updatedAt: string): Promise<ProjectRecord> {
    this.ensureOpen();
    if (!Number.isSafeInteger(expectedProjectRevision) || expectedProjectRevision < 1) {
      throw new ProjectRepositoryError("invalid-data", "Expected project revision is invalid.");
    }
    const timestamp = Date.parse(updatedAt);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== updatedAt) {
      throw new ProjectRepositoryError("invalid-data", "Updated timestamp must be canonical UTC ISO time.");
    }
    return inTransaction(this.database,
      [PROJECT_STORES.meta, PROJECT_STORES.projects, PROJECT_STORES.styles], "readwrite",
      async (transaction) => {
        const projects = transaction.objectStore(PROJECT_STORES.projects);
        const projectInput = await requestValue<ProjectRecord | undefined>(projects.get(projectId));
        if (!projectInput) throw new ProjectRepositoryError("not-found", "Project does not exist.");
        const project = parseProjectRecord(projectInput);
        if (!project.ok) throw new ProjectRepositoryError("invalid-data", project.error);
        if (project.value.revision !== expectedProjectRevision) {
          throw new ProjectRepositoryError("conflict", "Project changed in another tab; reload before switching styles.");
        }
        const styleInput = await requestValue<StyleRecord | undefined>(transaction.objectStore(PROJECT_STORES.styles).get(styleId));
        if (!styleInput) throw new ProjectRepositoryError("not-found", "Selected style does not exist.");
        const style = parseStyleRecord(styleInput);
        if (!style.ok) throw new ProjectRepositoryError("invalid-data", style.error);
        if (style.value.projectId !== project.value.id || !project.value.styleIds.includes(style.value.id)) {
          throw new ProjectRepositoryError("invalid-data", "Selected style does not belong to this project.");
        }
        if (style.value.archivedAt !== null) {
          throw new ProjectRepositoryError("invalid-data", "An archived style cannot become active; restore it first.");
        }
        const updated: ProjectRecord = {
          ...project.value,
          activeStyleId: style.value.id,
          revision: project.value.revision + 1,
          updatedAt,
        };
        const validated = parseProjectRecord(updated);
        if (!validated.ok) throw new ProjectRepositoryError("invalid-data", validated.error);
        projects.put(validated.value);
        transaction.objectStore(PROJECT_STORES.meta).put(selection(project.value.id, style.value.id));
        return validated.value;
      });
  }

  async initializeFirstRun(projectId: string, styleId: string, now: string): Promise<ProjectRecord> {
    this.ensureOpen();
    const migration = migrateLegacySaveFile({
      json: buildDefaultSaveJson(), projectId, styleId, migratedAt: now,
    });
    if (!migration.ok) throw new ProjectRepositoryError("invalid-data", migration.error);
    return this.writeProjectBundle({
      project: migration.value.project,
      styles: [migration.value.style],
      fieldObservations: [createFieldObservationRecord(migration.value.style, now, "first-run-default")],
      expectedProjectRevision: null,
    }, true);
  }

  async migrateLegacy(input: LegacyMigrationInput): Promise<LegacyMigrationOutcome> {
    this.ensureOpen();
    if (input.saveJson === null && input.recoveryJson === null) {
      throw new ProjectRepositoryError("no-legacy-data", "There is no legacy save or recovery record to migrate.");
    }
    const designJson = input.saveJson ?? buildDefaultSaveJson();
    const migrated = migrateLegacySaveFile({
      json: designJson,
      projectId: input.projectId,
      styleId: input.styleId,
      migratedAt: input.migratedAt,
    });
    if (!migrated.ok) throw new ProjectRepositoryError("invalid-data", migrated.error);
    const recoveryResult = input.recoveryJson === null
      ? null
      : migrateLegacyRecovery(input.styleId, input.recoveryJson);
    if (recoveryResult && !recoveryResult.ok) {
      throw new ProjectRepositoryError("invalid-data", recoveryResult.error);
    }
    const sourceSha256 = await this.sourceFingerprint(input.saveJson, input.recoveryJson);
    // migrateLegacySaveFile validated the IDs, UTC timestamp, and source
    // version; sourceFingerprint emits a local SHA-256 and this key tuple is
    // constant, so these typed values satisfy MigrationRecord directly.
    const marker: MigrationRecord = {
      schemaVersion: MIGRATION_RECORD_VERSION,
      sourceKeys: ["patternworks_save_v1", "patternworks_recovery_v1"],
      sourceSaveVersion: input.saveJson === null ? null : migrated.value.sourceVersion,
      sourceSha256,
      migratedAt: input.migratedAt,
      projectId: migrated.value.project.id,
      styleId: migrated.value.style.id,
    };
    const recoveries = recoveryResult?.ok ? [recoveryResult.value] : [];
    const fieldObservations = [createFieldObservationRecord(migrated.value.style, input.migratedAt, "legacy-save")];
    return inTransaction(this.database, ALL_STORES, "readwrite", async (transaction) => {
      const migrations = transaction.objectStore(PROJECT_STORES.migrations);
      const existingMarker = await requestValue<MigrationRecord | undefined>(migrations.get(sourceSha256));
      if (existingMarker !== undefined) {
        const existing = parseMigrationRecord(existingMarker);
        if (!existing.ok) throw new ProjectRepositoryError("invalid-data", existing.error);
        return { status: "already-migrated", record: existing.value };
      }
      const meta = transaction.objectStore(PROJECT_STORES.meta);
      const active = await requestValue(meta.get(ACTIVE_SELECTION_KEY));
      if (active !== undefined) {
        throw new ProjectRepositoryError("already-initialized", "A project is already active; legacy data was left untouched.");
      }
      const projects = transaction.objectStore(PROJECT_STORES.projects);
      const styles = transaction.objectStore(PROJECT_STORES.styles);
      if (await requestValue(projects.get(migrated.value.project.id)) !== undefined
        || await requestValue(styles.get(migrated.value.style.id)) !== undefined) {
        throw new ProjectRepositoryError("conflict", "Migration destination ID already exists; legacy data was left untouched.");
      }
      projects.put(migrated.value.project);
      styles.put(migrated.value.style);
      for (const recovery of recoveries) transaction.objectStore(PROJECT_STORES.recoveries).put(recovery);
      transaction.objectStore(PROJECT_STORES.fieldObservations).put(fieldObservations[0]);
      meta.put(selection(migrated.value.project.id, migrated.value.style.id));
      migrations.put(marker);
      return { status: "migrated", record: marker };
    });
  }

  private async sourceFingerprint(saveJson: string | null, recoveryJson: string | null): Promise<string> {
    const subtle = this.cryptoApi?.subtle;
    if (!subtle) throw new ProjectRepositoryError("unavailable", "SHA-256 is unavailable; legacy storage was not changed.");
    const framed = JSON.stringify([
      ["patternworks_save_v1", saveJson],
      ["patternworks_recovery_v1", recoveryJson],
    ]);
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(framed));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}
