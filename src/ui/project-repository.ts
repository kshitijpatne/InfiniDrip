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

export const PROJECT_DATABASE_NAME = "infinidrip-projects";
export const PROJECT_DATABASE_VERSION = 2;
export const PROJECT_STORES = Object.freeze({
  meta: "meta",
  projects: "projects",
  styles: "styles",
  recoveries: "recoveries",
  migrations: "migrations",
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
});

export type RepositoryErrorCode =
  | "unavailable"
  | "blocked"
  | "unsupported-version"
  | "closed"
  | "not-found"
  | "conflict"
  | "invalid-data"
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
}

export interface SaveProjectBundleInput {
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries?: readonly RecoveryRecord[];
  /** Removes a style's old crash-recovery payload in the same atomic save. */
  readonly clearRecoveryStyleIds?: readonly string[];
  /** null creates a project; a number is a compare-and-swap revision. */
  readonly expectedProjectRevision: number | null;
}

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
}

function upgradeStyleRecordsV1(transaction: IDBTransaction | null): void {
  if (!transaction) return;
  try {
    const store = transaction.objectStore(PROJECT_STORES.styles);
    const request = store.openCursor();
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
        if (keys.length !== LEGACY_STYLE_RECORD_KEYS.length
          || !LEGACY_STYLE_RECORD_KEYS.every((key) => Object.prototype.hasOwnProperty.call(value, key))
          || (value as { schemaVersion?: unknown }).schemaVersion !== 1) {
          transaction.abort();
          return;
        }
        cursor.update({ ...value, schemaVersion: 2, archivedAt: null });
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
  return { project: bundle.value.project, styles: bundle.value.styles, activeStyle, activeRecovery };
}

function validExpectedRevision(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 1);
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
      if (event.oldVersion === 0 && event.newVersion === PROJECT_DATABASE_VERSION) {
        createSchema(request.result);
      } else if (event.oldVersion === 1 && event.newVersion === PROJECT_DATABASE_VERSION) {
        upgradeStyleRecordsV1(request.transaction);
      } else {
        request.transaction?.abort();
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
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries], "readonly",
      (transaction) => bundleInTransaction(transaction, projectId));
  }

  async readActiveProject(): Promise<LoadedProject | null> {
    this.ensureOpen();
    return inTransaction(this.database, ALL_STORES.slice(0, 4), "readonly", async (transaction) => {
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
      }
      projects.put(bundle.value.project);
      for (const style of bundle.value.styles) styles.put(style);
      for (const recovery of recoveries) transaction.objectStore(PROJECT_STORES.recoveries).put(recovery);
      for (const styleId of clearRecoveryStyleIds) transaction.objectStore(PROJECT_STORES.recoveries).delete(styleId);
      transaction.objectStore(PROJECT_STORES.meta).put(selection(
        bundle.value.project.id,
        bundle.value.project.activeStyleId,
      ));
      return bundle.value.project;
    });
  }

  async saveRecovery(recordInput: RecoveryRecord, expectedProjectRevision: number, updatedAt: string): Promise<ProjectRecord> {
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
    return inTransaction(this.database,
      [PROJECT_STORES.projects, PROJECT_STORES.styles, PROJECT_STORES.recoveries], "readwrite", async (transaction) => {
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
