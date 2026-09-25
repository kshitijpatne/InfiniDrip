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
  LEGACY_STYLE_RECORD_KEYS,
  LEGACY_PROJECT_RECORD_KEYS,
  migrateLegacySaveFile,
  migrateLegacyRecovery,
  parseMigrationRecord,
  parseProjectRecord,
  parseRecoveryRecord,
  parseStyleRecord,
  validateProjectBundle,
  type MigrationRecord,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";
import {
  createFieldObservationRecord,
  parseFieldObservationRecord,
  type FieldObservationRecord,
} from "./field-provenance";

export const PROJECT_DATABASE_NAME = "infinidrip-projects";
export const PROJECT_DATABASE_VERSION = 5;
export const PROJECT_STORES = Object.freeze({
  meta: "meta",
  projects: "projects",
  styles: "styles",
  recoveries: "recoveries",
  migrations: "migrations",
  imports: "imports",
  fieldObservations: "fieldObservations",
});
const ACTIVE_SELECTION_KEY = "activeSelection";
const ALL_STORES = Object.values(PROJECT_STORES);
const OPEN_KEYS = ["key", "projectId", "styleId"];
const STORE_KEY_PATHS: Readonly<Record<string, string>> = Object.freeze({
  [PROJECT_STORES.meta]: "key",
  [PROJECT_STORES.projects]: "id",
  [PROJECT_STORES.styles]: "id",
  [PROJECT_STORES.recoveries]: "styleId",
  [PROJECT_STORES.migrations]: "sourceSha256",
  [PROJECT_STORES.imports]: "packageSha256",
  [PROJECT_STORES.fieldObservations]: "styleId",
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
}

export interface ProjectBundleSnapshot {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries: readonly RecoveryRecord[];
  readonly fieldObservations?: readonly FieldObservationRecord[];
}

export interface SaveProjectBundleInput {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries?: readonly RecoveryRecord[];
  /** Append-only provenance records written atomically with style/project changes. */
  readonly fieldObservations?: readonly FieldObservationRecord[];
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
        if (upgradeEditStyles && parsed.value.schemaVersion === 3
          && (styleValue as { schemaVersion?: unknown }).schemaVersion !== 3) {
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
    return ALL_STORES.every((name) => transaction.objectStore(name).keyPath === STORE_KEY_PATHS[name]);
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
  for (const style of bundle.value.styles) {
    const input = await requestValue<unknown>(transaction.objectStore(PROJECT_STORES.fieldObservations).get(style.id));
    if (input === undefined) throw new ProjectRepositoryError("invalid-data", "A style is missing its source-aware field history.");
    const parsed = parseFieldObservationRecord(input);
    if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
    fieldObservations.push(parsed.value);
  }
  return { project: bundle.value.project, styles: bundle.value.styles, activeStyle, activeRecovery, fieldObservations };
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
        } else {
          request.transaction?.abort();
        }
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
        reject(new ProjectRepositoryError("unavailable", "Project storage could not be opened. Existing saved data was not changed."));
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
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries, PROJECT_STORES.fieldObservations], "readonly",
      (transaction) => bundleInTransaction(transaction, projectId));
  }

  async readProjectBundle(projectId: string): Promise<ProjectBundleSnapshot | null> {
    this.ensureOpen();
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries, PROJECT_STORES.fieldObservations], "readonly",
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
        return {
          project: loaded.project,
          styles: loaded.styles,
          recoveries,
          fieldObservations: loaded.fieldObservations,
        };
      });
  }

  async readActiveProject(): Promise<LoadedProject | null> {
    this.ensureOpen();
    return inTransaction(this.database, ALL_STORES, "readonly", async (transaction) => {
      const stored = await requestValue(transaction.objectStore(PROJECT_STORES.meta).get(ACTIVE_SELECTION_KEY));
      if (stored === undefined) return null;
      if (!validActiveSelection(stored)) {
        throw new ProjectRepositoryError("invalid-data", "Active project selection is malformed.");
      }
      const loaded = await bundleInTransaction(transaction, stored.projectId, stored.styleId);
      if (!loaded) throw new ProjectRepositoryError("invalid-data", "Active project selection points to a missing project.");
      return loaded;
    });
  }

  async listProjects(): Promise<readonly LoadedProject[]> {
    this.ensureOpen();
    return inTransaction(this.database, ALL_STORES, "readonly", async (transaction) => {
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
      for (const recovery of recoveries) transaction.objectStore(PROJECT_STORES.recoveries).add(recovery);
      for (const record of fieldObservations) transaction.objectStore(PROJECT_STORES.fieldObservations).add(record);
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
    const clearRecoveryStyleIds = parseRecoveryClears(input.clearRecoveryStyleIds, bundle.value.project.styleIds);
    if (recoveries.some((recovery) => clearRecoveryStyleIds.includes(recovery.styleId))) {
      throw new ProjectRepositoryError("invalid-data", "A recovery record cannot be saved and cleared in the same bundle.");
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
      const observationStore = transaction.objectStore(PROJECT_STORES.fieldObservations);
      const incomingObservations = new Map(fieldObservations.map((record) => [record.styleId, record]));
      const nextObservations: FieldObservationRecord[] = [];
      const incomingIds = new Set(bundle.value.styles.map((style) => style.id));
      for (const existing of allStyles) {
        const parsed = parseStyleRecord(existing);
        if (!parsed.ok) throw new ProjectRepositoryError("invalid-data", parsed.error);
        if (parsed.value.projectId === bundle.value.project.id && !incomingIds.has(parsed.value.id)) {
          throw new ProjectRepositoryError("invalid-data", "A style cannot be removed from a project by a bundle save.");
        }
      }
      for (const style of bundle.value.styles) {
        const existing = await requestValue<StyleRecord | undefined>(styles.get(style.id));
        if (existing && existing.projectId !== style.projectId) {
          throw new ProjectRepositoryError("conflict", "A style ID already belongs to another project.");
        }
        if (existing && style.revision < existing.revision) {
          throw new ProjectRepositoryError("conflict", "A stale style revision cannot replace a newer saved style.");
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
