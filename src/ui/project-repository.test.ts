import { webcrypto as nodeWebcrypto } from "node:crypto";
import { IDBFactory, IDBObjectStore, IDBTransaction } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import {
  migrateLegacyRecovery,
  migrateLegacySaveFile,
  parseStyleRecord,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";
import {
  PROJECT_DATABASE_VERSION,
  PROJECT_STORES,
  ProjectRepository,
  openProjectRepository,
} from "./project-repository";
import { createFieldObservationRecord, type FieldObservationRecord } from "./field-provenance";
import {
  createFrozenOutputManifest,
  createStyleRevision,
  FROZEN_ARTIFACT_IDS,
  type FrozenOutputManifestRecord,
  type StyleRevisionRecord,
} from "./style-revisions";

const webcrypto = nodeWebcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const NEXT_TIME = "2026-09-24T16:00:01.000Z";
const FABRIC = "#3A4150";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const OTHER_STYLE_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
const SECOND_STYLE_ID = "5d4f7fb2-fb7e-4ed1-85bc-4899ebd9a129";
const OTHER_PROJECT_ID = "1f8eafbf-9f75-4d82-9a43-3557ae359de8";
let nextDatabase = 0;
const names: string[] = [];

function databaseName(): string {
  const name = `project-repository-${++nextDatabase}`;
  names.push(name);
  return name;
}

function newFactory(): IDBFactory {
  return new IDBFactory();
}

function newBundle(projectId = PROJECT_ID, styleId = STYLE_ID): { project: ProjectRecord; style: StyleRecord } {
  const result = migrateLegacySaveFile({
    json: serialize(STANDARD_M, FABRIC), projectId, styleId, migratedAt: TIME,
  });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function recovery(styleId = STYLE_ID): RecoveryRecord {
  const payload = {
    savedAt: 123,
    measurements: { ...Object.fromEntries(Object.entries(STANDARD_M)), chest: null },
    rawMeasurements: { chest: "", neck: "40" },
    fabric: FABRIC,
    appearance: DEFAULT_APPEARANCE,
    garmentOptions: { tee: {} },
    rawOptions: { tee: {} },
    workspace: DEFAULT_WORKSPACE,
    materialSelectionExplicit: false,
    surface: {},
    rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
  };
  const parsed = migrateLegacyRecovery(styleId, serializeRecovery(payload));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

async function rawDatabase(factory: IDBFactory, name: string, version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = version === undefined ? factory.open(name) : factory.open(name, version);
    request.onerror = () => reject(request.error ?? new Error("Raw database open failed."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function rawPut(factory: IDBFactory, name: string, storeName: string, value: unknown): Promise<void> {
  const database = await rawDatabase(factory, name);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Raw put aborted."));
  });
  database.close();
}

async function rawDelete(factory: IDBFactory, name: string, storeName: string, key: IDBValidKey): Promise<void> {
  const database = await rawDatabase(factory, name);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Raw delete aborted."));
  });
  database.close();
}

async function rawGet(factory: IDBFactory, name: string, storeName: string, key: IDBValidKey): Promise<unknown> {
  const database = await rawDatabase(factory, name);
  const value = await new Promise<unknown>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Raw get failed."));
  });
  database.close();
  return value;
}

async function createVersionFourDatabase(
  factory: IDBFactory,
  name: string,
  rows: readonly { store: keyof typeof PROJECT_STORES; value: unknown }[] = [],
): Promise<void> {
  const keyPaths: Readonly<Record<Exclude<keyof typeof PROJECT_STORES, "styleRevisions" | "exportManifests">, string>> = {
    meta: "key",
    projects: "id",
    styles: "id",
    recoveries: "styleId",
    migrations: "sourceSha256",
    imports: "packageSha256",
    fieldObservations: "styleId",
  };
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(name, 4);
    request.onupgradeneeded = () => {
      for (const [store, keyPath] of Object.entries(keyPaths)) {
        request.result.createObjectStore(store, { keyPath });
      }
      for (const row of rows) request.transaction!.objectStore(PROJECT_STORES[row.store]).put(row.value);
    };
    request.onerror = () => reject(request.error ?? new Error("Version-four fixture open failed."));
    request.onsuccess = () => resolve(request.result);
  });
  database.close();
}

async function createVersionFiveDatabase(
  factory: IDBFactory,
  name: string,
  rows: readonly { store: keyof typeof PROJECT_STORES; value: unknown }[] = [],
): Promise<void> {
  const keyPaths: Readonly<Record<Exclude<keyof typeof PROJECT_STORES, "styleRevisions" | "exportManifests">, string>> = {
    meta: "key",
    projects: "id",
    styles: "id",
    recoveries: "styleId",
    migrations: "sourceSha256",
    imports: "packageSha256",
    fieldObservations: "styleId",
  };
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(name, 5);
    request.onupgradeneeded = () => {
      for (const [store, keyPath] of Object.entries(keyPaths)) {
        request.result.createObjectStore(store, { keyPath });
      }
      for (const row of rows) request.transaction!.objectStore(PROJECT_STORES[row.store]).put(row.value);
    };
    request.onerror = () => reject(request.error ?? new Error("Version-five fixture open failed."));
    request.onsuccess = () => resolve(request.result);
  });
  database.close();
}

function fieldHistory(style: StyleRecord): FieldObservationRecord {
  return createFieldObservationRecord(style, style.updatedAt, "existing-local-style");
}

function testUuid(value: number): string {
  return `00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

async function testRevision(
  style: StyleRecord,
  observations: FieldObservationRecord,
  revisionId: string,
  revisionNumber = 1,
  parentRevisionId: string | null = null,
  design: StyleRecord["design"] = style.design,
): Promise<StyleRevisionRecord> {
  return createStyleRevision({
    styleId: style.id,
    revisionId,
    parentRevisionId,
    revisionNumber,
    createdAt: TIME,
    design,
    fieldObservations: observations,
    artwork: [],
  }, webcrypto);
}

async function testFrozenManifest(
  revision: StyleRevisionRecord,
  manifestId: string,
): Promise<FrozenOutputManifestRecord> {
  return createFrozenOutputManifest({
    manifestId,
    styleId: revision.styleId,
    revision,
    capturedAt: TIME,
    selectedSizes: [{ sizeId: "tee-step-1", label: "M" }],
    unresolved: ["Physical fit and factory acceptance have not been verified."],
    artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
      const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
      return {
        artifactId,
        extension,
        displayName: `${artifactId}.${extension}`,
        mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
        content: `stored:${artifactId}`,
      };
    }),
  }, webcrypto);
}

function appendedFieldHistory(record: FieldObservationRecord): FieldObservationRecord {
  const revision = record.revision + 1;
  const first = record.observations[0];
  if (!first) throw new Error("A test style must define at least one field observation.");
  return {
    ...record,
    revision,
    updatedAt: NEXT_TIME,
    observations: [...record.observations, { ...first, revision, recordedAt: NEXT_TIME }],
  };
}

type OpenHarness = {
  result: IDBDatabase;
  error: DOMException | null;
  transaction: IDBTransaction | null;
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
  onblocked: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onsuccess: ((event: Event) => void) | null;
};

function controlledFactory(run: (request: OpenHarness) => void): IDBFactory {
  return {
    open: () => {
      const request = {
        result: { version: 1, close: vi.fn() },
        error: null,
        transaction: { abort: vi.fn() },
        onupgradeneeded: null,
        onblocked: null,
        onerror: null,
        onsuccess: null,
      } as unknown as OpenHarness;
      queueMicrotask(() => run(request));
      return request as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

async function rejectionCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("transactional project repository", () => {
  it("maps IndexedDB quota failures and rejects an unknown schema-upgrade path", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const bundle = newBundle();
    const putSpy = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(function () {
      throw Object.assign(new Error("disk full"), { name: "QuotaExceededError" });
    });
    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style], expectedProjectRevision: null,
    }), "quota-exceeded");
    putSpy.mockRestore();
    repository.close();

    await rejectionCode(openProjectRepository({
      name: databaseName(),
      factory: controlledFactory((request) => {
        const abort = vi.fn(() => { throw new Error("already aborting"); });
        request.transaction = { abort } as unknown as IDBTransaction;
        request.onupgradeneeded?.({ oldVersion: 9, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
        expect(abort).toHaveBeenCalledTimes(2);
        Object.defineProperty(request, "error", { value: { name: "AbortError" } });
        request.onerror?.(new Event("error"));
      }),
    }), "unavailable");
  });

  it("rejects malformed, foreign, duplicate, and rewritten field history while allowing append-only saves", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    const initialHistory = fieldHistory(bundle.style);
    const foreignStyle = newBundle(PROJECT_ID, OTHER_STYLE_ID).style;
    const foreignHistory = fieldHistory(foreignStyle);
    const nextProject = { ...bundle.project, revision: 2, updatedAt: NEXT_TIME };

    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style],
      fieldObservations: {} as FieldObservationRecord[], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style],
      fieldObservations: [{} as FieldObservationRecord], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style],
      fieldObservations: [foreignHistory], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style],
      fieldObservations: [initialHistory, initialHistory], expectedProjectRevision: null,
    }), "invalid-data");

    await repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style], fieldObservations: [initialHistory],
      expectedProjectRevision: null,
    });
    const appended = appendedFieldHistory(initialHistory);
    await repository.saveProjectBundle({
      project: nextProject, styles: [bundle.style], fieldObservations: [appended],
      expectedProjectRevision: bundle.project.revision,
    });

    const rewritten = {
      ...appended,
      observations: appended.observations.map((entry, index) => index === 0
        ? { ...entry, sourceLabel: `${entry.sourceLabel} (rewritten)` }
        : entry),
    };
    await rejectionCode(repository.saveProjectBundle({
      project: { ...nextProject, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [bundle.style], fieldObservations: [rewritten], expectedProjectRevision: 2,
    }), "invalid-data");
    const shortened = {
      ...appended,
      revision: initialHistory.revision,
      observations: initialHistory.observations,
    };
    await rejectionCode(repository.saveProjectBundle({
      project: { ...nextProject, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [bundle.style], fieldObservations: [shortened], expectedProjectRevision: 2,
    }), "invalid-data");
    const concurrentProject = { ...nextProject, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" };
    await rawPut(factory, name, PROJECT_STORES.projects, concurrentProject);
    await rejectionCode(repository.saveProjectBundle({
      project: concurrentProject,
      styles: [bundle.style], expectedProjectRevision: 2,
    }), "conflict");
    expect((await repository.readProjectBundle(PROJECT_ID))?.fieldObservations).toEqual([appended]);
    await rawPut(factory, name, PROJECT_STORES.fieldObservations, { schemaVersion: 1, styleId: STYLE_ID });
    await rejectionCode(repository.saveProjectBundle({
      project: { ...concurrentProject, revision: 4, updatedAt: "2026-09-24T16:00:03.000Z" },
      styles: [bundle.style], fieldObservations: [appended], expectedProjectRevision: 3,
    }), "invalid-data");
    repository.close();
  });

  it("validates field histories on package import and atomic recovery writes", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const imported = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID);
    const receipt = {
      packageSha256: "a".repeat(64), projectId: OTHER_PROJECT_ID, importedAt: TIME, importedAsCopy: false,
    };
    const importedHistory = fieldHistory(imported.style);
    const foreignHistory = fieldHistory(newBundle(OTHER_PROJECT_ID, SECOND_STYLE_ID).style);
    await rejectionCode(repository.importProjectBundle({
      project: imported.project, styles: [imported.style], recoveries: [], fieldObservations: [], receipt,
    }), "invalid-data");
    await rejectionCode(repository.importProjectBundle({
      project: imported.project, styles: [imported.style], recoveries: [],
      fieldObservations: [{} as FieldObservationRecord], receipt,
    }), "invalid-data");
    await rejectionCode(repository.importProjectBundle({
      project: imported.project, styles: [imported.style], recoveries: [],
      fieldObservations: [foreignHistory], receipt,
    }), "invalid-data");
    await rejectionCode(repository.importProjectBundle({
      project: imported.project, styles: [imported.style], recoveries: [],
      fieldObservations: [importedHistory, importedHistory], receipt,
    }), "invalid-data");

    const initial = newBundle();
    const initialHistory = fieldHistory(initial.style);
    await repository.saveProjectBundle({ project: initial.project, styles: [initial.style], expectedProjectRevision: null });
    const wrongStyleHistory = fieldHistory(newBundle(PROJECT_ID, OTHER_STYLE_ID).style);
    await rejectionCode(repository.saveRecovery(
      recovery(), 1, NEXT_TIME, wrongStyleHistory,
    ), "invalid-data");
    await rejectionCode(repository.saveRecovery(
      recovery(), 1, NEXT_TIME, {} as FieldObservationRecord,
    ), "invalid-data");
    await repository.saveRecovery(recovery(), 1, NEXT_TIME, appendedFieldHistory(initialHistory));
    expect((await repository.loadProject(PROJECT_ID))?.fieldObservations[0]?.revision)
      .toBe(initialHistory.revision + 1);

    const tamperedHistory = {
      ...initialHistory,
      observations: initialHistory.observations.map((entry, index) => index === 0
        ? { ...entry, sourceLabel: `${entry.sourceLabel} (changed elsewhere)` }
        : entry),
    };
    await rawPut(factory, name, PROJECT_STORES.fieldObservations, tamperedHistory);
    await rejectionCode(repository.saveRecovery(
      recovery(), 2, "2026-09-24T16:00:02.000Z", appendedFieldHistory(initialHistory),
    ), "conflict");
    await rawPut(factory, name, PROJECT_STORES.fieldObservations, { schemaVersion: 1, styleId: STYLE_ID });
    await rejectionCode(repository.saveRecovery(
      recovery(), 2, "2026-09-24T16:00:02.000Z", appendedFieldHistory(initialHistory),
    ), "invalid-data");
    await rawDelete(factory, name, PROJECT_STORES.fieldObservations, STYLE_ID);
    await rejectionCode(repository.saveRecovery(
      recovery(), 2, "2026-09-24T16:00:02.000Z", appendedFieldHistory(initialHistory),
    ), "invalid-data");
    repository.close();
  });

  it("fails closed when a stored style has missing or malformed source-aware history", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    await rawDelete(factory, name, PROJECT_STORES.fieldObservations, STYLE_ID);
    await rejectionCode(repository.loadProject(PROJECT_ID), "invalid-data");

    await rawPut(factory, name, PROJECT_STORES.fieldObservations, { styleId: STYLE_ID, observations: [] });
    await rejectionCode(repository.readProjectBundle(PROJECT_ID), "invalid-data");
    repository.close();
  });

  it("aborts a v3 schema upgrade when an existing style cannot be safely described", async () => {
    const factory = newFactory();
    const name = databaseName();
    const request = factory.open(name, 3);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore(PROJECT_STORES.meta, { keyPath: "key" });
        db.createObjectStore(PROJECT_STORES.projects, { keyPath: "id" });
        db.createObjectStore(PROJECT_STORES.styles, { keyPath: "id" });
        db.createObjectStore(PROJECT_STORES.recoveries, { keyPath: "styleId" });
        db.createObjectStore(PROJECT_STORES.migrations, { keyPath: "sourceSha256" });
        db.createObjectStore(PROJECT_STORES.imports, { keyPath: "packageSha256" });
      };
      request.onerror = () => reject(request.error ?? new Error("v3 database setup failed"));
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([PROJECT_STORES.styles], "readwrite");
      transaction.objectStore(PROJECT_STORES.styles).put({ id: STYLE_ID, schemaVersion: 99 });
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error("v3 fixture transaction aborted"));
    });
    database.close();

    await rejectionCode(openProjectRepository({ name, factory, crypto: webcrypto }), "unavailable");
    const unchanged = await rawDatabase(factory, name, 3);
    expect(unchanged.version).toBe(3);
    unchanged.close();
    expect(await rawGet(factory, name, PROJECT_STORES.styles, STYLE_ID))
      .toMatchObject({ id: STYLE_ID, schemaVersion: 99 });
  });

  it("upgrades the shipped v3 database with unresolved field history without changing saved records", async () => {
    const factory = newFactory();
    const name = databaseName();
    const initial = newBundle();
    const request = factory.open(name, 3);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore(PROJECT_STORES.meta, { keyPath: "key" });
        db.createObjectStore(PROJECT_STORES.projects, { keyPath: "id" });
        db.createObjectStore(PROJECT_STORES.styles, { keyPath: "id" });
        db.createObjectStore(PROJECT_STORES.recoveries, { keyPath: "styleId" });
        db.createObjectStore(PROJECT_STORES.migrations, { keyPath: "sourceSha256" });
        db.createObjectStore(PROJECT_STORES.imports, { keyPath: "packageSha256" });
      };
      request.onerror = () => reject(request.error ?? new Error("v3 database setup failed"));
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([PROJECT_STORES.meta, PROJECT_STORES.projects, PROJECT_STORES.styles], "readwrite");
      transaction.objectStore(PROJECT_STORES.projects).put(initial.project);
      transaction.objectStore(PROJECT_STORES.styles).put(initial.style);
      transaction.objectStore(PROJECT_STORES.meta).put({ key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID });
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error("v3 fixture transaction aborted"));
    });
    database.close();

    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const loaded = await repository.readActiveProject();
    expect(loaded?.project).toEqual(initial.project);
    expect(loaded?.activeStyle).toEqual(initial.style);
    expect(loaded?.fieldObservations).toHaveLength(1);
    expect(loaded?.fieldObservations[0]?.styleId).toBe(STYLE_ID);
    expect(loaded?.fieldObservations[0]?.observations[0]).toMatchObject({
      provenance: "UNRESOLVED",
      evidenceStatus: "UNCONFIRMED",
      recordedAt: null,
      sourceLabel: expect.stringContaining("predates field provenance"),
    });
    repository.close();
  });

  it("fails closed if a listed project disappears inside the read transaction", async () => {
    const project = newBundle().project;
    type FakeRequest<T> = { result: T; onsuccess: ((event: Event) => void) | null; onerror: ((event: Event) => void) | null };
    const request = <T>(result: T): IDBRequest<T> => {
      const item: FakeRequest<T> = { result, onsuccess: null, onerror: null };
      queueMicrotask(() => item.onsuccess?.(new Event("success")));
      return item as unknown as IDBRequest<T>;
    };
    const transaction = {
      oncomplete: null as (() => void) | null,
      onabort: null as (() => void) | null,
      onerror: null as (() => void) | null,
      objectStore: (name: string) => name === PROJECT_STORES.projects
        ? { getAll: () => request([project]), get: () => request(undefined) }
        : {},
      abort() { queueMicrotask(() => this.onabort?.()); },
    };
    const database = {
      transaction: () => transaction,
      close: vi.fn(),
      onversionchange: null,
    } as unknown as IDBDatabase;
    const repository = new ProjectRepository(database, webcrypto);
    await rejectionCode(repository.listProjects(), "invalid-data");
    repository.close();
  });

  it("creates and reopens the exact supported schema, persists active selection, and rejects use after close", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({
      project: bundle.project,
      styles: [bundle.style],
      expectedProjectRevision: null,
    });
    expect(await repository.readActiveProject()).toMatchObject({
      project: bundle.project, styles: [bundle.style], activeStyle: bundle.style, activeRecovery: null,
    });
    repository.close();
    repository.close();
    await rejectionCode(repository.loadProject(PROJECT_ID), "closed");
    const reopened = await openProjectRepository({ name, factory, crypto: webcrypto });
    expect(await reopened.loadProject(PROJECT_ID)).toMatchObject({ activeStyle: bundle.style });
    reopened.close();
  });

  it("returns no active project before a project has been selected", async () => {
    const repository = await openProjectRepository({ name: databaseName(), factory: newFactory(), crypto: webcrypto });
    expect(await repository.readActiveProject()).toBeNull();
    repository.close();
  });

  it("requests strict commit durability and falls back only when the host rejects the option", async () => {
    const factory = newFactory();
    const strictName = databaseName();
    const initializer = await openProjectRepository({ name: strictName, factory, crypto: webcrypto });
    initializer.close();
    const strictDatabase = await rawDatabase(factory, strictName);
    const strictSpy = vi.spyOn(strictDatabase, "transaction");
    const strictRepository = new ProjectRepository(strictDatabase, webcrypto);
    await strictRepository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
    expect(strictSpy.mock.calls.some(([, mode, options]) => mode === "readwrite" && options?.durability === "strict")).toBe(true);
    strictRepository.close();

    const fallbackName = databaseName();
    const fallbackInitializer = await openProjectRepository({ name: fallbackName, factory, crypto: webcrypto });
    fallbackInitializer.close();
    const fallbackDatabase = await rawDatabase(factory, fallbackName);
    const nativeTransaction = fallbackDatabase.transaction.bind(fallbackDatabase);
    const calls: Array<{ mode?: IDBTransactionMode; durability?: IDBTransactionDurability }> = [];
    vi.spyOn(fallbackDatabase, "transaction").mockImplementation(((stores: string | string[], mode?: IDBTransactionMode, options?: IDBTransactionOptions) => {
      calls.push({ mode, durability: options?.durability });
      if (mode === "readwrite" && options?.durability === "strict") throw new TypeError("durability options unsupported");
      return nativeTransaction(stores, mode);
    }) as typeof fallbackDatabase.transaction);
    const fallbackRepository = new ProjectRepository(fallbackDatabase, webcrypto);
    await fallbackRepository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
    expect(calls).toContainEqual({ mode: "readwrite", durability: "strict" });
    expect(calls).toContainEqual({ mode: "readwrite", durability: undefined });
    fallbackRepository.close();

    const failedFallbackName = databaseName();
    const failedFallbackInit = await openProjectRepository({ name: failedFallbackName, factory, crypto: webcrypto });
    failedFallbackInit.close();
    const failedFallbackDatabase = await rawDatabase(factory, failedFallbackName);
    vi.spyOn(failedFallbackDatabase, "transaction").mockImplementation(((
      _stores: string | string[], mode?: IDBTransactionMode, options?: IDBTransactionOptions,
    ) => {
      if (mode === "readwrite" && options?.durability === "strict") throw new TypeError("unsupported options");
      throw new Error("fallback transaction failed");
    }) as typeof failedFallbackDatabase.transaction);
    const failedFallbackRepository = new ProjectRepository(failedFallbackDatabase, webcrypto);
    await rejectionCode(failedFallbackRepository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME), "transaction");
    failedFallbackRepository.close();
  });

  it("initializes a first-run project only once and validates project and style identity on switching", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const initialized = await repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
    expect(initialized.revision).toBe(1);
    await rejectionCode(repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME), "already-initialized");
    await rejectionCode(repository.initializeFirstRun("bad", STYLE_ID, TIME), "invalid-data");
    await expect(repository.selectActiveStyle("missing", STYLE_ID, 1, NEXT_TIME)).rejects.toMatchObject({ code: "not-found" });
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, OTHER_STYLE_ID, 1, NEXT_TIME), "not-found");
    const second = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID);
    await repository.saveProjectBundle({ project: second.project, styles: [second.style], expectedProjectRevision: null });
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, OTHER_STYLE_ID, 1, NEXT_TIME), "invalid-data");
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 99, NEXT_TIME), "conflict");
    repository.close();
  });

  it("persists immutable style revisions and frozen outputs as one verifiable history", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    try {
      await repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
      const initial = await repository.readProjectBundle(PROJECT_ID);
      if (!initial) throw new Error("First-run project was not persisted.");
      const initialStyle = initial.styles[0]!;
      const initialObservations = initial.fieldObservations![0]!;
      const firstRevision = await createStyleRevision({
        styleId: STYLE_ID,
        revisionId: "11111111-1111-4111-8111-111111111111",
        parentRevisionId: null,
        revisionNumber: 1,
        createdAt: TIME,
        design: initialStyle.design,
        fieldObservations: initialObservations,
        artwork: [],
      }, webcrypto);
      const seededStyle = { ...initialStyle, revision: 2, updatedAt: NEXT_TIME, revisionHeadId: firstRevision.revisionId };
      const seededProject = { ...initial.project, revision: 2, updatedAt: NEXT_TIME };
      await repository.saveProjectBundle({
        project: seededProject,
        styles: [seededStyle],
        fieldObservations: [initialObservations],
        styleRevisions: [firstRevision],
        expectedProjectRevision: initial.project.revision,
      });

      const frozen = await createFrozenOutputManifest({
        manifestId: "22222222-2222-4222-8222-222222222222",
        styleId: STYLE_ID,
        revision: firstRevision,
        capturedAt: TIME,
        selectedSizes: [{ sizeId: "tee-step-1", label: "M" }],
        unresolved: ["Physical fit and factory acceptance have not been verified."],
        artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
          const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
          return {
            artifactId,
            extension,
            displayName: `${artifactId}.${extension}`,
            mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
            content: `stored:${artifactId}`,
          };
        }),
      }, webcrypto);
      const afterSeed = await repository.readProjectBundle(PROJECT_ID);
      if (!afterSeed) throw new Error("Seeded project was not readable.");
      await repository.saveProjectBundle({
        project: { ...afterSeed.project, revision: afterSeed.project.revision + 1, updatedAt: "2026-09-24T16:00:02.000Z" },
        styles: afterSeed.styles,
        fieldObservations: afterSeed.fieldObservations,
        exportManifests: [frozen],
        expectedProjectRevision: afterSeed.project.revision,
      });

      const current = await repository.readProjectBundle(PROJECT_ID);
      if (!current) throw new Error("Frozen project was not readable.");
      const currentStyle = current.styles[0]!;
      const currentObservations = current.fieldObservations![0]!;
      const editedDesign = {
        ...currentStyle.design,
        measurements: { ...currentStyle.design.measurements, chest: currentStyle.design.measurements.chest + 1 },
      };
      const nextObservations = appendedFieldHistory(currentObservations);
      const secondRevision = await createStyleRevision({
        styleId: STYLE_ID,
        revisionId: "33333333-3333-4333-8333-333333333333",
        parentRevisionId: firstRevision.revisionId,
        revisionNumber: 2,
        createdAt: "2026-09-24T16:00:03.000Z",
        design: editedDesign,
        fieldObservations: nextObservations,
        artwork: [],
      }, webcrypto);
      await repository.saveProjectBundle({
        project: { ...current.project, revision: current.project.revision + 1, updatedAt: "2026-09-24T16:00:03.000Z" },
        styles: [{ ...currentStyle, revision: currentStyle.revision + 1, updatedAt: "2026-09-24T16:00:03.000Z", design: editedDesign, revisionHeadId: secondRevision.revisionId }],
        fieldObservations: [nextObservations],
        styleRevisions: [secondRevision],
        expectedProjectRevision: current.project.revision,
      });

      const loaded = await repository.loadProject(PROJECT_ID);
      expect(loaded?.styleRevisions.map((revision) => revision.revisionId)).toEqual([
        firstRevision.revisionId, secondRevision.revisionId,
      ]);
      expect(loaded?.activeStyle.revisionHeadId).toBe(secondRevision.revisionId);
      expect(loaded?.exportManifests).toHaveLength(1);
      expect(await loaded?.exportManifests?.[0]?.artifacts[0]?.bytes.text()).toBe("stored:selected-size-a0-pdf");

      await expect(repository.saveProjectBundle({
        project: { ...loaded!.project, revision: loaded!.project.revision + 1, updatedAt: "2026-09-24T16:00:04.000Z" },
        styles: [{
          ...loaded!.activeStyle,
          design: {
            ...loaded!.activeStyle.design,
            measurements: {
              ...loaded!.activeStyle.design.measurements,
              chest: loaded!.activeStyle.design.measurements.chest + 1,
            },
          },
        }],
        fieldObservations: loaded!.fieldObservations,
        expectedProjectRevision: loaded!.project.revision,
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("must append one immutable revision") });
    } finally {
      repository.close();
    }
  });

  it("validates immutable inputs and atomically seeds a new style with its frozen outputs", async () => {
    const repository = await openProjectRepository({ name: databaseName(), factory: newFactory(), crypto: webcrypto });
    try {
      const bundle = newBundle();
      const revisionId = testUuid(101);
      const style = { ...bundle.style, revisionHeadId: revisionId };
      const observations = fieldHistory(style);
      const revision = await testRevision(style, observations, revisionId);
      const manifest = await testFrozenManifest(revision, testUuid(201));
      const input = {
        project: bundle.project,
        styles: [style],
        fieldObservations: [observations],
        styleRevisions: [revision],
        exportManifests: [manifest],
        expectedProjectRevision: null,
      } as const;

      await expect(repository.saveProjectBundle({ ...input, styleRevisions: "not-a-list" as never }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("must be a list") });
      await expect(repository.saveProjectBundle({
        ...input,
        styleRevisions: [{ ...revision, revisionContentDigest: "0".repeat(64) }],
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("SHA-256 validation") });
      await expect(repository.saveProjectBundle({ ...input, styleRevisions: [revision, revision] }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("duplicate revision IDs") });

      await expect(repository.saveProjectBundle({ ...input, exportManifests: "not-a-list" as never }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("must be a list") });
      const corruptedManifest: FrozenOutputManifestRecord = {
        ...manifest,
        artifacts: manifest.artifacts.map((artifact, index) => index === 0
          ? { ...artifact, bytes: new Blob(["tampered bytes"]) }
          : artifact),
      };
      await expect(repository.saveProjectBundle({ ...input, exportManifests: [corruptedManifest] }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("integrity validation") });
      await expect(repository.saveProjectBundle({ ...input, exportManifests: [manifest, manifest] }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("duplicate frozen manifest IDs") });

      const foreign = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID);
      const foreignRevision = await testRevision(foreign.style, fieldHistory(foreign.style), testUuid(102));
      await expect(repository.saveProjectBundle({ ...input, styleRevisions: [foreignRevision] }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("must belong to a style") });
      await expect(repository.saveProjectBundle({ ...input, styleRevisions: [], exportManifests: [] }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("not inserted with it") });
      await expect(repository.readProjectBundle(PROJECT_ID)).resolves.toBeNull();

      await repository.saveProjectBundle(input);
      const loaded = await repository.readProjectBundle(PROJECT_ID);
      expect(loaded?.styles[0]?.revisionHeadId).toBe(revisionId);
      expect(loaded?.styleRevisions).toEqual([revision]);
      expect(loaded?.exportManifests).toHaveLength(1);
      expect(await loaded?.exportManifests?.[0]?.artifacts[0]?.bytes.text()).toBe("stored:selected-size-a0-pdf");
    } finally {
      repository.close();
    }
  });

  it("rejects invalid revision transitions without moving the saved head", async () => {
    const seedExisting = async () => {
      const factory = newFactory();
      const name = databaseName();
      const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
      await repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
      const initial = await repository.readProjectBundle(PROJECT_ID);
      if (!initial) throw new Error("First-run project was not persisted.");
      const observations = initial.fieldObservations![0]!;
      const firstRevision = await testRevision(initial.styles[0]!, observations, testUuid(701));
      const style = {
        ...initial.styles[0]!,
        revision: initial.styles[0]!.revision + 1,
        updatedAt: NEXT_TIME,
        revisionHeadId: firstRevision.revisionId,
      };
      const project = { ...initial.project, revision: initial.project.revision + 1, updatedAt: NEXT_TIME };
      await repository.saveProjectBundle({
        project,
        styles: [style],
        fieldObservations: [observations],
        styleRevisions: [firstRevision],
        expectedProjectRevision: initial.project.revision,
      });
      return { factory, name, repository, project, style, observations, firstRevision };
    };
    const save = (
      state: Awaited<ReturnType<typeof seedExisting>>,
      style: StyleRecord,
      revisions: readonly StyleRevisionRecord[],
      observations: FieldObservationRecord = state.observations,
      manifests: readonly FrozenOutputManifestRecord[] = [],
    ) => state.repository.saveProjectBundle({
      project: { ...state.project, revision: state.project.revision + 1, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [style],
      fieldObservations: [observations],
      styleRevisions: revisions,
      exportManifests: manifests,
      expectedProjectRevision: state.project.revision,
    });

    const movedHead = await seedExisting();
    try {
      await expect(save(movedHead, {
        ...movedHead.style,
        revision: movedHead.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        revisionHeadId: testUuid(702),
      }, [])).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("cannot move") });
      expect((await movedHead.repository.readProjectBundle(PROJECT_ID))?.styles[0]?.revisionHeadId)
        .toBe(movedHead.firstRevision.revisionId);
    } finally {
      movedHead.repository.close();
    }

    const multipleChildren = await seedExisting();
    try {
      const child = await testRevision(multipleChildren.style, multipleChildren.observations, testUuid(703), 2,
        multipleChildren.firstRevision.revisionId);
      const grandchild = await testRevision(multipleChildren.style, multipleChildren.observations, testUuid(704), 3,
        child.revisionId);
      await expect(save(multipleChildren, {
        ...multipleChildren.style,
        revision: multipleChildren.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        revisionHeadId: grandchild.revisionId,
      }, [child, grandchild])).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("at most one child") });
    } finally {
      multipleChildren.repository.close();
    }

    const wrongParent = await seedExisting();
    try {
      const design = {
        ...wrongParent.style.design,
        measurements: { ...wrongParent.style.design.measurements, chest: wrongParent.style.design.measurements.chest + 1 },
      };
      const child = await testRevision(wrongParent.style, wrongParent.observations, testUuid(705), 2, testUuid(997), design);
      await expect(save(wrongParent, {
        ...wrongParent.style,
        revision: wrongParent.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        design,
        revisionHeadId: child.revisionId,
      }, [child])).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("extend its current head") });
    } finally {
      wrongParent.repository.close();
    }

    const staleHead = await seedExisting();
    try {
      const child = await testRevision(staleHead.style, staleHead.observations, testUuid(706), 3,
        staleHead.firstRevision.revisionId);
      await expect(save(staleHead, {
        ...staleHead.style,
        revision: staleHead.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        revisionHeadId: child.revisionId,
      }, [child])).rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("head changed") });
    } finally {
      staleHead.repository.close();
    }

    const observationMismatch = await seedExisting();
    try {
      const design = {
        ...observationMismatch.style.design,
        measurements: { ...observationMismatch.style.design.measurements, chest: observationMismatch.style.design.measurements.chest + 1 },
      };
      const nextObservations = appendedFieldHistory(observationMismatch.observations);
      const child = await testRevision(observationMismatch.style, observationMismatch.observations,
        testUuid(707), 2, observationMismatch.firstRevision.revisionId, design);
      await expect(save(observationMismatch, {
        ...observationMismatch.style,
        revision: observationMismatch.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        design,
        revisionHeadId: child.revisionId,
      }, [child], nextObservations)).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("exact current field-observation") });
    } finally {
      observationMismatch.repository.close();
    }

    const unseededFactory = newFactory();
    const unseededName = databaseName();
    const unseededRepo = await openProjectRepository({ name: unseededName, factory: unseededFactory, crypto: webcrypto });
    try {
      await unseededRepo.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
      const initial = await unseededRepo.readProjectBundle(PROJECT_ID);
      if (!initial) throw new Error("Unseeded style was not persisted.");
      const style = initial.styles[0]!;
      const observations = initial.fieldObservations![0]!;
      const orphan = await testRevision(style, observations, testUuid(708));
      await rawPut(unseededFactory, unseededName, PROJECT_STORES.styleRevisions, orphan);
      const child = await testRevision(style, observations, testUuid(709));
      await expect(unseededRepo.saveProjectBundle({
        project: { ...initial.project, revision: initial.project.revision + 1, updatedAt: NEXT_TIME },
        styles: [{ ...style, revision: style.revision + 1, updatedAt: NEXT_TIME, revisionHeadId: child.revisionId }],
        fieldObservations: [observations],
        styleRevisions: [child],
        expectedProjectRevision: initial.project.revision,
      })).rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("unseeded style") });
    } finally {
      unseededRepo.close();
    }

    const newProject = newBundle(OTHER_PROJECT_ID, SECOND_STYLE_ID);
    const newObservations = fieldHistory(newProject.style);
    const rejectNewStyle = async (
      style: StyleRecord,
      revisions: readonly StyleRevisionRecord[],
      message: string,
      observations: FieldObservationRecord = newObservations,
      manifests: readonly FrozenOutputManifestRecord[] = [],
    ) => {
      const repo = await openProjectRepository({ name: databaseName(), factory: newFactory(), crypto: webcrypto });
      try {
        await expect(repo.saveProjectBundle({
          project: newProject.project,
          styles: [style],
          fieldObservations: [observations],
          styleRevisions: revisions,
          exportManifests: manifests,
          expectedProjectRevision: null,
        })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining(message) });
        await expect(repo.readProjectBundle(newProject.project.id)).resolves.toBeNull();
      } finally {
        repo.close();
      }
    };

    const invalidInitial = await testRevision(newProject.style, newObservations, testUuid(710), 2, testUuid(996));
    await rejectNewStyle({ ...newProject.style, revisionHeadId: invalidInitial.revisionId }, [invalidInitial], "exactly one parentless revision");

    const editDesign = {
      ...newProject.style.design,
      measurements: { ...newProject.style.design.measurements, chest: newProject.style.design.measurements.chest + 1 },
    };
    const designMismatch = await testRevision(newProject.style, newObservations, testUuid(711));
    await rejectNewStyle({ ...newProject.style, revisionHeadId: designMismatch.revisionId, design: editDesign },
      [designMismatch], "exactly one parentless revision");

    const newerObservations = appendedFieldHistory(newObservations);
    const observationSnapshot = await testRevision(newProject.style, newObservations, testUuid(712));
    await rejectNewStyle({
      ...newProject.style,
      updatedAt: NEXT_TIME,
      revisionHeadId: observationSnapshot.revisionId,
    }, [observationSnapshot], "new style field history", newerObservations);

    const manifestRevision = await testRevision(newProject.style, newObservations, testUuid(713));
    const alternate = await testRevision(newProject.style, newObservations, manifestRevision.revisionId, 1, null, editDesign);
    const mismatchedManifest = await testFrozenManifest(alternate, testUuid(714));
    await rejectNewStyle({ ...newProject.style, revisionHeadId: manifestRevision.revisionId },
      [manifestRevision], "same digest", newObservations, [mismatchedManifest]);
  });

  it("fails closed on tampered revision chains and frozen output manifests", async () => {
    const seed = async () => {
      const factory = newFactory();
      const name = databaseName();
      const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
      await repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
      const initial = await repository.readProjectBundle(PROJECT_ID);
      if (!initial) throw new Error("First-run project was not persisted.");
      const style = initial.styles[0]!;
      const observations = initial.fieldObservations![0]!;
      const revision = await testRevision(style, observations, testUuid(301));
      const persistedStyle = { ...style, revision: style.revision + 1, updatedAt: NEXT_TIME, revisionHeadId: revision.revisionId };
      await repository.saveProjectBundle({
        project: { ...initial.project, revision: initial.project.revision + 1, updatedAt: NEXT_TIME },
        styles: [persistedStyle],
        fieldObservations: [observations],
        styleRevisions: [revision],
        expectedProjectRevision: initial.project.revision,
      });
      return { factory, name, repository, style: persistedStyle, observations, revision };
    };

    const corruptedDigest = await seed();
    try {
      await rawPut(corruptedDigest.factory, corruptedDigest.name, PROJECT_STORES.styleRevisions, {
        ...corruptedDigest.revision,
        revisionContentDigest: "f".repeat(64),
      });
      await rejectionCode(corruptedDigest.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      corruptedDigest.repository.close();
    }

    const malformedRevisionRow = await seed();
    try {
      await rawPut(malformedRevisionRow.factory, malformedRevisionRow.name, PROJECT_STORES.styleRevisions, {
        revisionId: testUuid(305),
        styleId: STYLE_ID,
      });
      await rejectionCode(malformedRevisionRow.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      malformedRevisionRow.repository.close();
    }

    const malformedManifestRow = await seed();
    try {
      await rawPut(malformedManifestRow.factory, malformedManifestRow.name, PROJECT_STORES.exportManifests, {
        manifestId: testUuid(404),
        styleId: STYLE_ID,
      });
      await rejectionCode(malformedManifestRow.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      malformedManifestRow.repository.close();
    }

    const unheadedHistory = await seed();
    try {
      await rawPut(unheadedHistory.factory, unheadedHistory.name, PROJECT_STORES.styles, {
        ...unheadedHistory.style,
        revisionHeadId: null,
      });
      await rejectionCode(unheadedHistory.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      unheadedHistory.repository.close();
    }

    const missingHistory = await seed();
    try {
      await rawDelete(missingHistory.factory, missingHistory.name, PROJECT_STORES.styleRevisions, missingHistory.revision.revisionId);
      await rejectionCode(missingHistory.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      missingHistory.repository.close();
    }

    const invalidInitial = await seed();
    try {
      const invalid = await testRevision(invalidInitial.style, invalidInitial.observations, testUuid(302), 1, testUuid(999));
      await rawDelete(invalidInitial.factory, invalidInitial.name, PROJECT_STORES.styleRevisions, invalidInitial.revision.revisionId);
      await rawPut(invalidInitial.factory, invalidInitial.name, PROJECT_STORES.styleRevisions, invalid);
      await rawPut(invalidInitial.factory, invalidInitial.name, PROJECT_STORES.styles, {
        ...invalidInitial.style,
        revisionHeadId: invalid.revisionId,
      });
      await rejectionCode(invalidInitial.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      invalidInitial.repository.close();
    }

    const brokenChain = await seed();
    try {
      const design = {
        ...brokenChain.style.design,
        measurements: { ...brokenChain.style.design.measurements, chest: brokenChain.style.design.measurements.chest + 1 },
      };
      const child = await testRevision(brokenChain.style, brokenChain.observations, testUuid(303), 2, testUuid(998), design);
      await rawPut(brokenChain.factory, brokenChain.name, PROJECT_STORES.styleRevisions, child);
      await rawPut(brokenChain.factory, brokenChain.name, PROJECT_STORES.styles, {
        ...brokenChain.style,
        revision: brokenChain.style.revision + 1,
        updatedAt: "2026-09-24T16:00:02.000Z",
        design,
        revisionHeadId: child.revisionId,
      });
      await rejectionCode(brokenChain.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      brokenChain.repository.close();
    }

    const changedStyle = await seed();
    try {
      await rawPut(changedStyle.factory, changedStyle.name, PROJECT_STORES.styles, {
        ...changedStyle.style,
        design: {
          ...changedStyle.style.design,
          measurements: { ...changedStyle.style.design.measurements, chest: changedStyle.style.design.measurements.chest + 1 },
        },
      });
      await rejectionCode(changedStyle.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      changedStyle.repository.close();
    }

    const badPacketDigest = await seed();
    try {
      const manifest = await testFrozenManifest(badPacketDigest.revision, testUuid(401));
      await rawPut(badPacketDigest.factory, badPacketDigest.name, PROJECT_STORES.exportManifests, {
        ...manifest,
        packetDigest: "e".repeat(64),
      });
      await rejectionCode(badPacketDigest.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      badPacketDigest.repository.close();
    }

    const missingManifestRevision = await seed();
    try {
      const child = await testRevision(
        missingManifestRevision.style,
        missingManifestRevision.observations,
        testUuid(304),
        2,
        missingManifestRevision.revision.revisionId,
      );
      await rawPut(missingManifestRevision.factory, missingManifestRevision.name, PROJECT_STORES.exportManifests,
        await testFrozenManifest(child, testUuid(402)));
      await rejectionCode(missingManifestRevision.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      missingManifestRevision.repository.close();
    }

    const mismatchedManifestRevision = await seed();
    try {
      const alternateDesign = {
        ...mismatchedManifestRevision.style.design,
        measurements: {
          ...mismatchedManifestRevision.style.design.measurements,
          chest: mismatchedManifestRevision.style.design.measurements.chest + 1,
        },
      };
      const alternate = await testRevision(
        mismatchedManifestRevision.style,
        mismatchedManifestRevision.observations,
        mismatchedManifestRevision.revision.revisionId,
        1,
        null,
        alternateDesign,
      );
      await rawPut(mismatchedManifestRevision.factory, mismatchedManifestRevision.name, PROJECT_STORES.exportManifests,
        await testFrozenManifest(alternate, testUuid(403)));
      await rejectionCode(mismatchedManifestRevision.repository.loadProject(PROJECT_ID), "invalid-data");
    } finally {
      mismatchedManifestRevision.repository.close();
    }
  });

  it("validates and restores imported revision history with its frozen outputs atomically", async () => {
    const repository = await openProjectRepository({ name: databaseName(), factory: newFactory(), crypto: webcrypto });
    try {
      const bundle = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID);
      const observations = fieldHistory(bundle.style);
      const revisionId = testUuid(501);
      const revision = await testRevision(bundle.style, observations, revisionId);
      const style = { ...bundle.style, revisionHeadId: revisionId };
      const receipt = (index: number) => ({
        packageSha256: index.toString(16).padStart(64, "0"),
        projectId: bundle.project.id,
        importedAt: TIME,
        importedAsCopy: false,
      });
      const base = {
        project: bundle.project,
        styles: [style],
        recoveries: [],
        fieldObservations: [observations],
      } as const;

      await expect(repository.importProjectBundle({ ...base, receipt: receipt(1) }))
        .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("missing its immutable revision head") });

      const brokenChild = await testRevision(
        style,
        observations,
        testUuid(502),
        2,
        testUuid(998),
        {
          ...style.design,
          measurements: { ...style.design.measurements, chest: style.design.measurements.chest + 1 },
        },
      );
      await expect(repository.importProjectBundle({
        ...base,
        styles: [{ ...style, revisionHeadId: brokenChild.revisionId }],
        styleRevisions: [revision, brokenChild],
        receipt: receipt(2),
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("invalid sequence or parent chain") });

      await expect(repository.importProjectBundle({
        ...base,
        styles: [bundle.style],
        styleRevisions: [revision],
        receipt: receipt(3),
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("unseeded style") });

      const foreign = newBundle(PROJECT_ID, STYLE_ID);
      const foreignRevision = await testRevision(foreign.style, fieldHistory(foreign.style), testUuid(503));
      await expect(repository.importProjectBundle({
        ...base,
        styles: [bundle.style],
        styleRevisions: [foreignRevision],
        receipt: receipt(4),
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("must belong to a style") });

      const absentRevision = await testRevision(style, observations, testUuid(504), 2, revisionId);
      const absentManifest = await testFrozenManifest(absentRevision, testUuid(601));
      await expect(repository.importProjectBundle({
        ...base,
        styleRevisions: [revision],
        exportManifests: [absentManifest],
        receipt: receipt(5),
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("missing or mismatched revision") });
      await expect(repository.readProjectBundle(bundle.project.id)).resolves.toBeNull();

      const alternateDesign = {
        ...style.design,
        measurements: { ...style.design.measurements, chest: style.design.measurements.chest + 1 },
      };
      const alternateRevision = await testRevision(style, observations, revisionId, 1, null, alternateDesign);
      const mismatchedManifest = await testFrozenManifest(alternateRevision, testUuid(602));
      await expect(repository.importProjectBundle({
        ...base,
        styleRevisions: [revision],
        exportManifests: [mismatchedManifest],
        receipt: receipt(6),
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("missing or mismatched revision") });
      await expect(repository.readProjectBundle(bundle.project.id)).resolves.toBeNull();

      const manifest = await testFrozenManifest(revision, testUuid(603));
      await expect(repository.importProjectBundle({
        ...base,
        styleRevisions: [revision],
        exportManifests: [manifest],
        receipt: receipt(7),
      })).resolves.toMatchObject({ status: "imported", project: { id: bundle.project.id } });
      const restored = await repository.readProjectBundle(bundle.project.id);
      expect(restored?.styleRevisions).toEqual([revision]);
      expect(restored?.exportManifests).toHaveLength(1);
      expect(await restored?.exportManifests?.[0]?.artifacts[0]?.bytes.text()).toBe("stored:selected-size-a0-pdf");
    } finally {
      repository.close();
    }
  });

  it("upgrades version-one style records transactionally and leaves malformed version-one data intact", async () => {
    const factory = newFactory();
    const name = databaseName();
    const bundle = newBundle();
    const legacyStyle: Record<string, unknown> = { ...bundle.style, schemaVersion: 1 };
    delete legacyStyle.archivedAt;
    delete legacyStyle.revisionHeadId;
    const legacyDesign = { ...bundle.style.design } as Record<string, unknown>;
    delete legacyDesign.semanticEdits;
    legacyStyle.design = legacyDesign;
    const legacyProject: Record<string, unknown> = { ...bundle.project, schemaVersion: 1 };
    delete legacyProject.importedFrom;
    const legacyRecovery = { ...recovery(), schemaVersion: 1 } as unknown as Record<string, unknown>;
    const legacyRecoveryPayload = { ...(legacyRecovery.payload as Record<string, unknown>) };
    delete legacyRecoveryPayload.semanticEdits;
    legacyRecovery.payload = legacyRecoveryPayload;
    const versionOne = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(PROJECT_STORES.meta, { keyPath: "key" });
        request.result.createObjectStore(PROJECT_STORES.projects, { keyPath: "id" });
        request.result.createObjectStore(PROJECT_STORES.styles, { keyPath: "id" });
        request.result.createObjectStore(PROJECT_STORES.recoveries, { keyPath: "styleId" });
        request.result.createObjectStore(PROJECT_STORES.migrations, { keyPath: "sourceSha256" });
        const transaction = request.transaction!;
        transaction.objectStore(PROJECT_STORES.projects).put(legacyProject);
        transaction.objectStore(PROJECT_STORES.styles).put(legacyStyle);
        transaction.objectStore(PROJECT_STORES.recoveries).put(legacyRecovery);
        transaction.objectStore(PROJECT_STORES.meta).put({ key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    versionOne.close();
    const upgraded = await openProjectRepository({ name, factory, crypto: webcrypto });
    expect((await upgraded.readActiveProject())?.activeStyle).toMatchObject({
      id: STYLE_ID, schemaVersion: 4, archivedAt: null, revisionHeadId: null,
      design: { ...bundle.style.design, semanticEdits: null },
    });
    expect((await upgraded.readActiveProject())?.project).toMatchObject({ schemaVersion: 2, importedFrom: null });
    expect((await upgraded.readActiveProject())?.activeRecovery).toMatchObject({
      schemaVersion: 2, styleId: STYLE_ID, payload: { semanticEdits: null },
    });
    upgraded.close();

    const malformedName = databaseName();
    const malformed = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(malformedName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(PROJECT_STORES.meta, { keyPath: "key" });
        request.result.createObjectStore(PROJECT_STORES.projects, { keyPath: "id" });
        request.result.createObjectStore(PROJECT_STORES.styles, { keyPath: "id" });
        request.result.createObjectStore(PROJECT_STORES.recoveries, { keyPath: "styleId" });
        request.result.createObjectStore(PROJECT_STORES.migrations, { keyPath: "sourceSha256" });
        request.transaction!.objectStore(PROJECT_STORES.styles).put({ id: STYLE_ID, schemaVersion: 1 });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    malformed.close();
    await rejectionCode(openProjectRepository({ name: malformedName, factory, crypto: webcrypto }), "unavailable");
    const preserved = await rawDatabase(factory, malformedName);
    expect(preserved.version).toBe(1);
    const malformedStyle = await new Promise<unknown>((resolve, reject) => {
      const transaction = preserved.transaction(PROJECT_STORES.styles, "readonly");
      const request = transaction.objectStore(PROJECT_STORES.styles).get(STYLE_ID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(malformedStyle).toEqual({ id: STYLE_ID, schemaVersion: 1 });
    preserved.close();
  });

  it("upgrades IndexedDB v4 edit-state records atomically, idempotently, and preserves malformed data on rollback", async () => {
    const factory = newFactory();
    const name = databaseName();
    const legacy = newBundle();
    const current = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    const project: ProjectRecord = { ...legacy.project, styleIds: [STYLE_ID, OTHER_STYLE_ID] };
    const oldDesign = { ...legacy.style.design } as Record<string, unknown>;
    delete oldDesign.semanticEdits;
    const oldStyle = { ...legacy.style, schemaVersion: 2, design: oldDesign };
    delete (oldStyle as { revisionHeadId?: string | null }).revisionHeadId;
    const oldRecoveryBase = recovery(STYLE_ID);
    const oldRecoveryPayload = { ...oldRecoveryBase.payload } as Record<string, unknown>;
    delete oldRecoveryPayload.semanticEdits;
    const oldRecovery = { schemaVersion: 1, styleId: STYLE_ID, payload: oldRecoveryPayload };
    const currentRecovery = recovery(OTHER_STYLE_ID);
    await createVersionFourDatabase(factory, name, [
      { store: "projects", value: project },
      { store: "styles", value: oldStyle },
      { store: "styles", value: current.style },
      { store: "recoveries", value: oldRecovery },
      { store: "recoveries", value: currentRecovery },
      { store: "meta", value: { key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID } },
      { store: "fieldObservations", value: fieldHistory(legacy.style) },
      { store: "fieldObservations", value: fieldHistory(current.style) },
    ]);

    const upgraded = await openProjectRepository({ name, factory, crypto: webcrypto });
    const loaded = await upgraded.readActiveProject();
    expect(loaded?.project).toEqual(project);
    expect(loaded?.styles).toEqual([
      { ...legacy.style, schemaVersion: 4, archivedAt: null, revisionHeadId: null, design: { ...legacy.style.design, semanticEdits: null } },
      current.style,
    ]);
    expect(loaded?.activeRecovery).toEqual({
      ...oldRecoveryBase, schemaVersion: 2, payload: { ...oldRecoveryBase.payload, semanticEdits: null },
    });
    expect(loaded?.fieldObservations).toHaveLength(2);
    upgraded.close();

    const reopened = await openProjectRepository({ name, factory, crypto: webcrypto });
    expect((await reopened.readActiveProject())?.styles).toEqual(loaded?.styles);
    reopened.close();
    const upgradedRaw = await rawDatabase(factory, name);
    expect(upgradedRaw.version).toBe(6);
    upgradedRaw.close();

    const emptyName = databaseName();
    await createVersionFourDatabase(factory, emptyName);
    const emptyUpgrade = await openProjectRepository({ name: emptyName, factory, crypto: webcrypto });
    emptyUpgrade.close();
    const emptyRaw = await rawDatabase(factory, emptyName);
    expect(emptyRaw.version).toBe(6);
    emptyRaw.close();

    const malformedName = databaseName();
    const invalidRecovery = { ...oldRecovery, schemaVersion: 99 };
    await createVersionFourDatabase(factory, malformedName, [
      { store: "styles", value: oldStyle },
      { store: "recoveries", value: invalidRecovery },
    ]);
    await rejectionCode(openProjectRepository({ name: malformedName, factory, crypto: webcrypto }), "unavailable");
    const preserved = await rawDatabase(factory, malformedName);
    expect(preserved.version).toBe(4);
    const transaction = preserved.transaction([PROJECT_STORES.styles, PROJECT_STORES.recoveries], "readonly");
    const preservedStyle = await new Promise<unknown>((resolve, reject) => {
      const request = transaction.objectStore(PROJECT_STORES.styles).get(STYLE_ID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const preservedRecovery = await new Promise<unknown>((resolve, reject) => {
      const request = transaction.objectStore(PROJECT_STORES.recoveries).get(STYLE_ID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(preservedStyle).toEqual(oldStyle);
    expect(preservedRecovery).toEqual(invalidRecovery);
    preserved.close();

    const malformedStyleName = databaseName();
    const invalidStyle = { ...oldStyle, design: { ...oldStyle.design, unexpected: true } };
    await createVersionFourDatabase(factory, malformedStyleName, [{ store: "styles", value: invalidStyle }]);
    await rejectionCode(openProjectRepository({ name: malformedStyleName, factory, crypto: webcrypto }), "unavailable");
    const malformedStyleDb = await rawDatabase(factory, malformedStyleName);
    expect(malformedStyleDb.version).toBe(4);
    malformedStyleDb.close();
    expect(await rawGet(factory, malformedStyleName, PROJECT_STORES.styles, STYLE_ID)).toEqual(invalidStyle);
  });

  it("upgrades the shipped v5 schema by adding an explicit null revision head without replacing saved data", async () => {
    const factory = newFactory();
    const name = databaseName();
    const bundle = newBundle();
    const legacyStyle: Record<string, unknown> = { ...bundle.style, schemaVersion: 3 };
    delete legacyStyle.revisionHeadId;
    expect(parseStyleRecord(legacyStyle).ok).toBe(true);
    const observations = fieldHistory(bundle.style);
    await createVersionFiveDatabase(factory, name, [
      { store: "meta", value: { key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID } },
      { store: "projects", value: bundle.project },
      { store: "styles", value: legacyStyle },
      { store: "fieldObservations", value: observations },
    ]);

    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    try {
      const loaded = await repository.readActiveProject();
      expect(loaded?.activeStyle).toMatchObject({
        id: STYLE_ID,
        schemaVersion: 4,
        revisionHeadId: null,
        design: bundle.style.design,
      });
      expect(loaded?.project).toEqual(bundle.project);
      expect(loaded?.fieldObservations).toEqual([observations]);
    } finally {
      repository.close();
    }
    const upgradedDatabase = await rawDatabase(factory, name);
    expect(upgradedDatabase.version).toBe(PROJECT_DATABASE_VERSION);
    const upgradedSchema = upgradedDatabase.transaction(PROJECT_STORES.styleRevisions).objectStore(PROJECT_STORES.styleRevisions);
    expect(upgradedSchema.indexNames.contains("styleId")).toBe(true);
    expect(upgradedSchema.indexNames.contains("styleIdAndNumber")).toBe(true);
    upgradedDatabase.close();

    const malformedName = databaseName();
    const malformedFutureStyle: Record<string, unknown> = { ...bundle.style, schemaVersion: 4 };
    delete malformedFutureStyle.revisionHeadId;
    await createVersionFiveDatabase(factory, malformedName, [
      { store: "meta", value: { key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID } },
      { store: "projects", value: bundle.project },
      { store: "styles", value: malformedFutureStyle },
      { store: "fieldObservations", value: observations },
    ]);
    await rejectionCode(openProjectRepository({ name: malformedName, factory, crypto: webcrypto }), "unavailable");
    const unchanged = await rawDatabase(factory, malformedName, 5);
    expect(unchanged.version).toBe(5);
    expect(await rawGet(factory, malformedName, PROJECT_STORES.styles, STYLE_ID))
      .toEqual(malformedFutureStyle);
    unchanged.close();
  });

  it("aborts every v5 revision-head cursor failure and tolerates a completed or absent upgrade cursor", async () => {
    const style = { ...newBundle().style, schemaVersion: 3 } as Record<string, unknown>;
    delete style.revisionHeadId;
    const exercise = async (
      failure: "missing-transaction" | "open" | "request-error" | "invalid-record" | "update" | "continue" | "empty" | "valid",
    ): Promise<void> => {
      const cursorRequest = {
        result: failure === "empty" ? null : {
          value: failure === "invalid-record" ? [] : style,
          update: () => { if (failure === "update") throw new Error("revision cursor update failed"); },
          continue: () => { if (failure === "continue") throw new Error("revision cursor continuation failed"); },
        },
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const transaction = {
        abort: vi.fn(),
        objectStore: () => {
          if (failure === "open") throw new Error("style store unavailable");
          return { openCursor: () => cursorRequest };
        },
      };
      const fakeFactory = controlledFactory((request) => {
        request.result = {
          version: PROJECT_DATABASE_VERSION,
          objectStoreNames: { contains: () => true },
          createObjectStore: vi.fn(),
        } as unknown as IDBDatabase;
        request.transaction = failure === "missing-transaction" ? null : transaction as unknown as IDBTransaction;
        request.onupgradeneeded?.({ oldVersion: 5, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
        if (failure === "request-error") cursorRequest.onerror?.(new Event("error"));
        else if (failure !== "missing-transaction") cursorRequest.onsuccess?.(new Event("success"));
        try {
          expect(transaction.abort, failure).toHaveBeenCalledTimes(
            ["open", "request-error", "invalid-record", "update", "continue"].includes(failure) ? 1 : 0,
          );
        } finally {
          Object.defineProperty(request, "error", { value: { name: "AbortError" } });
          request.onerror?.(new Event("error"));
        }
      });
      await rejectionCode(openProjectRepository({ name: databaseName(), factory: fakeFactory }), "unavailable");
    };

    for (const failure of ["missing-transaction", "open", "request-error", "invalid-record", "update", "continue", "empty", "valid"] as const) {
      await exercise(failure);
    }
  });

  it("aborts each v4 edit-state cursor failure instead of partially upgrading records", async () => {
    const missingTransaction = controlledFactory((request) => {
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = null;
      request.onupgradeneeded?.({ oldVersion: 4, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: missingTransaction }), "unavailable");

    const exercise = async (
      failingStore: typeof PROJECT_STORES.styles | typeof PROJECT_STORES.recoveries,
      failure: "invalid-record" | "read" | "write" | "open",
    ): Promise<void> => {
      const style = failure === "invalid-record" && failingStore === PROJECT_STORES.styles
        ? [] : newBundle().style;
      const styleRecovery = recovery();
      const recoveryRecord = failure === "invalid-record" && failingStore === PROJECT_STORES.recoveries
        ? { ...styleRecovery, schemaVersion: 99 } : styleRecovery;
      const makeCursorRequest = (store: string, value: unknown) => {
        const cursor = {
          value,
          update: () => {
            if (store === failingStore && failure === "write") throw new Error("cursor update failed");
          },
          continue: vi.fn(),
        };
        if (store === failingStore && failure === "read") {
          Object.defineProperty(cursor, "value", { get: () => { throw new Error("cursor read failed"); } });
        }
        return { result: value === null ? null : cursor, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
      };
      const requests = {
        [PROJECT_STORES.styles]: makeCursorRequest(PROJECT_STORES.styles, style),
        [PROJECT_STORES.recoveries]: makeCursorRequest(PROJECT_STORES.recoveries, recoveryRecord),
      };
      const transaction = {
        abort: vi.fn(),
        objectStore: (store: string) => ({
          openCursor: () => {
            if (store === failingStore && failure === "open") throw new Error("cursor unavailable");
            return requests[store as keyof typeof requests];
          },
        }),
      } as unknown as IDBTransaction;
      const factory = controlledFactory((request) => {
        request.result = {
          version: PROJECT_DATABASE_VERSION,
          objectStoreNames: { contains: () => true },
          createObjectStore: vi.fn(),
        } as unknown as IDBDatabase;
        request.transaction = transaction;
        request.onupgradeneeded?.({ oldVersion: 4, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
        for (const cursorRequest of Object.values(requests)) cursorRequest.onsuccess?.(new Event("success"));
        expect(transaction.abort).toHaveBeenCalledOnce();
        Object.defineProperty(request, "error", { value: { name: "AbortError" } });
        request.onerror?.(new Event("error"));
      });
      await rejectionCode(openProjectRepository({ name: databaseName(), factory }), "unavailable");
    };

    for (const failure of ["invalid-record", "read", "write", "open"] as const) {
      await exercise(PROJECT_STORES.styles, failure);
      await exercise(PROJECT_STORES.recoveries, failure);
    }
  });

  it("writes and clears style recovery independently while rejecting missing or malformed targets", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    const recoverySavedProject = await repository.saveRecovery(recovery(), bundle.project.revision, NEXT_TIME);
    expect(recoverySavedProject.revision).toBe(bundle.project.revision + 1);
    expect((await repository.loadProject(PROJECT_ID))?.activeRecovery?.payload.rawMeasurements).toEqual({ chest: "", neck: "40" });
    await rejectionCode(repository.saveRecovery({} as RecoveryRecord, 2, TIME), "invalid-data");
    await rejectionCode(repository.saveRecovery(recovery(), 0, TIME), "invalid-data");
    await rejectionCode(repository.saveRecovery(recovery(), 2, "not-a-time"), "invalid-data");
    await rejectionCode(repository.saveRecovery(recovery(OTHER_STYLE_ID), 2, TIME), "not-found");
    await repository.clearRecovery(STYLE_ID, recoverySavedProject.revision, "2026-09-24T16:00:02.000Z");
    expect((await repository.loadProject(PROJECT_ID))?.activeRecovery).toBeNull();
    const unchangedProject = await repository.clearRecovery(STYLE_ID, 3, "2026-09-24T16:00:02.000Z");
    expect(unchangedProject.revision).toBe(3);
    await rejectionCode(repository.clearRecovery(" ", 3, TIME), "invalid-data");
    await rejectionCode(repository.clearRecovery(OTHER_STYLE_ID, 3, TIME), "not-found");
    await rejectionCode(repository.clearRecovery(STYLE_ID, 0, TIME), "invalid-data");
    await rejectionCode(repository.clearRecovery(STYLE_ID, 3, "not-a-time"), "invalid-data");
    repository.close();
  });

  it("uses project revision compare-and-swap to prevent cross-tab recovery overwrites and stale clears", async () => {
    const factory = newFactory();
    const name = databaseName();
    const first = await openProjectRepository({ name, factory, crypto: webcrypto });
    const second = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await first.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    expect((await first.loadProject(PROJECT_ID))?.project.revision).toBe(1);
    expect((await second.loadProject(PROJECT_ID))?.project.revision).toBe(1);

    const original = recovery();
    const winningRecovery: RecoveryRecord = {
      ...original,
      payload: { ...original.payload, rawMeasurements: { chest: "98", neck: "44" } },
    };
    await first.saveRecovery(winningRecovery, 1, NEXT_TIME);
    await rejectionCode(second.saveRecovery(recovery(), 1, "2026-09-24T16:00:02.000Z"), "conflict");
    const afterConflict = await second.loadProject(PROJECT_ID);
    expect(afterConflict?.project.revision).toBe(2);
    expect(afterConflict?.activeRecovery?.payload.rawMeasurements).toEqual({ chest: "98", neck: "44" });

    await rejectionCode(second.clearRecovery(STYLE_ID, 1, "2026-09-24T16:00:03.000Z"), "conflict");
    await second.clearRecovery(STYLE_ID, 2, "2026-09-24T16:00:03.000Z");
    expect((await first.loadProject(PROJECT_ID))?.activeRecovery).toBeNull();
    first.close();
    second.close();
  });

  it("rejects recovery records for stored styles that are no longer listed by their project", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const first = newBundle();
    const second = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    const project = { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID] };
    await repository.saveProjectBundle({
      project,
      styles: [first.style, second.style],
      expectedProjectRevision: null,
    });
    await rawPut(factory, name, PROJECT_STORES.projects, {
      ...project,
      styleIds: [STYLE_ID],
    });
    await rejectionCode(repository.saveRecovery(recovery(OTHER_STYLE_ID), 1, NEXT_TIME), "invalid-data");
    await rejectionCode(repository.clearRecovery(OTHER_STYLE_ID, 1, NEXT_TIME), "invalid-data");
    repository.close();
  });

  it("preserves recovery validation for orphaned, malformed, and exhausted project records", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });

    const orphan = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID).style;
    await rawPut(factory, name, PROJECT_STORES.styles, orphan);
    await rejectionCode(repository.saveRecovery(recovery(OTHER_STYLE_ID), 1, NEXT_TIME), "not-found");
    await rejectionCode(repository.clearRecovery(OTHER_STYLE_ID, 1, NEXT_TIME), "not-found");

    await rawPut(factory, name, PROJECT_STORES.projects, { ...bundle.project, revision: 0 });
    await rejectionCode(repository.saveRecovery(recovery(), 1, NEXT_TIME), "invalid-data");
    await rejectionCode(repository.clearRecovery(STYLE_ID, 1, NEXT_TIME), "invalid-data");

    const exhausted = { ...bundle.project, revision: Number.MAX_SAFE_INTEGER, updatedAt: NEXT_TIME };
    await rawPut(factory, name, PROJECT_STORES.projects, exhausted);
    await rejectionCode(repository.saveRecovery(recovery(), Number.MAX_SAFE_INTEGER, "2026-09-24T16:00:02.000Z"), "invalid-data");
    await rawPut(factory, name, PROJECT_STORES.recoveries, { styleId: STYLE_ID, schemaVersion: -1 });
    await rejectionCode(repository.clearRecovery(STYLE_ID, Number.MAX_SAFE_INTEGER, "2026-09-24T16:00:02.000Z"), "invalid-data");
    await rawPut(factory, name, PROJECT_STORES.recoveries, recovery());
    await rejectionCode(repository.clearRecovery(STYLE_ID, Number.MAX_SAFE_INTEGER, "2026-09-24T16:00:02.000Z"), "invalid-data");
    repository.close();
  });

  it("cannot make an archived style active through the repository boundary", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const first = newBundle();
    const second = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    const project = { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID] };
    await repository.saveProjectBundle({ project, styles: [first.style, second.style], expectedProjectRevision: null });
    await repository.saveProjectBundle({
      project: { ...project, revision: 2, updatedAt: NEXT_TIME },
      styles: [first.style, { ...second.style, archivedAt: NEXT_TIME, revision: 2, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 1,
    });
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, OTHER_STYLE_ID, 2, "2026-09-24T16:00:02.000Z"), "invalid-data");
    expect((await repository.readActiveProject())?.activeStyle.id).toBe(STYLE_ID);
    repository.close();
  });

  it("atomically saves, clears recovery, and switches among styles in the same project", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const first = newBundle();
    const second = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    const twoStyleProject = {
      ...first.project,
      styleIds: [STYLE_ID, OTHER_STYLE_ID],
      updatedAt: NEXT_TIME,
      revision: 1,
    };
    await repository.saveProjectBundle({
      project: twoStyleProject,
      styles: [first.style, second.style],
      recoveries: [recovery(STYLE_ID)],
      expectedProjectRevision: null,
    });
    expect((await repository.loadProject(PROJECT_ID))?.activeRecovery?.styleId).toBe(STYLE_ID);
    const switched = await repository.selectActiveStyle(PROJECT_ID, OTHER_STYLE_ID, 1, NEXT_TIME);
    expect(switched.activeStyleId).toBe(OTHER_STYLE_ID);
    expect(switched.revision).toBe(2);
    expect((await repository.readActiveProject())?.activeStyle.id).toBe(OTHER_STYLE_ID);
    await repository.saveProjectBundle({
      project: { ...switched, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [first.style, second.style],
      clearRecoveryStyleIds: [STYLE_ID],
      expectedProjectRevision: 2,
    });
    expect((await repository.loadProject(PROJECT_ID))?.activeRecovery).toBeNull();
    repository.close();
  });

  it("rejects stale CAS writes and stale style revisions without changing the saved snapshot", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    await repository.saveProjectBundle({
      project: { ...bundle.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [{ ...bundle.style, revision: 2, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 1,
    });
    await rejectionCode(repository.saveProjectBundle({
      project: { ...bundle.project, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [{ ...bundle.style, revision: 1 }],
      expectedProjectRevision: 2,
    }), "conflict");
    expect((await repository.loadProject(PROJECT_ID))?.project.revision).toBe(2);
    await rejectionCode(repository.saveProjectBundle({
      project: { ...bundle.project, revision: 3, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [{ ...bundle.style, revision: 2, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 0,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: { ...bundle.project, revision: 4, updatedAt: "2026-09-24T16:00:02.000Z" },
      styles: [{ ...bundle.style, revision: 2, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 2,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: { ...bundle.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [{ ...bundle.style, revision: 0, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 1,
    }), "invalid-data");
    repository.close();
  });

  it("prevents style removal, cross-project style identity reuse, and invalid recovery operations", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const first = newBundle();
    const second = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    await repository.saveProjectBundle({
      project: { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID] },
      styles: [first.style, second.style],
      expectedProjectRevision: null,
    });
    await rejectionCode(repository.saveProjectBundle({
      project: { ...first.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [first.style],
      expectedProjectRevision: 1,
    }), "invalid-data");
    const other = newBundle(OTHER_PROJECT_ID, STYLE_ID);
    await rejectionCode(repository.saveProjectBundle({
      project: other.project,
      styles: [other.style],
      expectedProjectRevision: null,
    }), "conflict");
    await rejectionCode(repository.saveProjectBundle({
      project: { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID], revision: 2, updatedAt: NEXT_TIME },
      styles: [first.style, second.style],
      recoveries: [recovery(OTHER_STYLE_ID)],
      clearRecoveryStyleIds: [OTHER_STYLE_ID],
      expectedProjectRevision: 1,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: { ...first.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [first.style, second.style],
      clearRecoveryStyleIds: ["unknown"],
      expectedProjectRevision: 1,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID], revision: 2, updatedAt: NEXT_TIME },
      styles: [first.style, second.style],
      clearRecoveryStyleIds: [STYLE_ID, STYLE_ID],
      expectedProjectRevision: 1,
    }), "invalid-data");
    repository.close();
  });

  it("fails closed for malformed records, active pointers, and missing style or project IDs", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await rejectionCode(repository.saveProjectBundle({
      project: { ...bundle.project, name: "" }, styles: [bundle.style], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(repository.saveProjectBundle({
      project: bundle.project, styles: [bundle.style], recoveries: [recovery(OTHER_STYLE_ID)], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 1, "yesterday"), "invalid-data");
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 0, TIME), "invalid-data");
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 1, TIME), "not-found");
    expect(await repository.loadProject(PROJECT_ID)).toBeNull();
    await rawPut(factory, name, PROJECT_STORES.meta, { key: "activeSelection", projectId: 5, styleId: STYLE_ID });
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    const arraySelection = Object.assign(["malformed"], {
      key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID,
    });
    await rawPut(factory, name, PROJECT_STORES.meta, arraySelection);
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    await rawPut(factory, name, PROJECT_STORES.meta, { key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID });
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    const second = newBundle(PROJECT_ID, OTHER_STYLE_ID);
    const first = newBundle();
    await repository.saveProjectBundle({
      project: { ...first.project, styleIds: [STYLE_ID, OTHER_STYLE_ID] },
      styles: [first.style, second.style], expectedProjectRevision: null,
    });
    await rawPut(factory, name, PROJECT_STORES.meta, { key: "activeSelection", projectId: PROJECT_ID, styleId: OTHER_STYLE_ID });
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    await rawPut(factory, name, PROJECT_STORES.meta, { key: "activeSelection", projectId: OTHER_PROJECT_ID, styleId: STYLE_ID });
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    await rawPut(factory, name, PROJECT_STORES.meta, { key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID });
    await rawPut(factory, name, PROJECT_STORES.recoveries, { schemaVersion: 99, styleId: STYLE_ID, payload: {} });
    await rejectionCode(repository.readActiveProject(), "invalid-data");
    repository.close();
  });

  it("rejects malformed stored projects/styles and malformed or duplicate recovery input", async () => {
    const factory = newFactory();
    const name = databaseName();
    const initialize = await openProjectRepository({ name, factory, crypto: webcrypto });
    initialize.close();
    await rawPut(factory, name, PROJECT_STORES.projects, { id: PROJECT_ID, revision: 1 });
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    await rejectionCode(repository.saveProjectBundle({
      project: { ...newBundle().project, revision: 2, updatedAt: NEXT_TIME },
      styles: [newBundle().style], expectedProjectRevision: 1,
    }), "invalid-data");
    await rejectionCode(repository.loadProject(PROJECT_ID), "invalid-data");
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 1, NEXT_TIME), "invalid-data");
    repository.close();

    const malformedStyleName = databaseName();
    const styleInit = await openProjectRepository({ name: malformedStyleName, factory, crypto: webcrypto });
    styleInit.close();
    const bundle = newBundle();
    await rawPut(factory, malformedStyleName, PROJECT_STORES.projects, bundle.project);
    await rawPut(factory, malformedStyleName, PROJECT_STORES.styles, { ...bundle.style, revision: -1 });
    const badStyleRepo = await openProjectRepository({ name: malformedStyleName, factory, crypto: webcrypto });
    await rejectionCode(badStyleRepo.loadProject(PROJECT_ID), "invalid-data");
    await rejectionCode(badStyleRepo.selectActiveStyle(PROJECT_ID, STYLE_ID, 1, NEXT_TIME), "invalid-data");
    await rejectionCode(badStyleRepo.saveRecovery(recovery(), 1, NEXT_TIME), "invalid-data");
    await rejectionCode(badStyleRepo.clearRecovery(STYLE_ID, 1, NEXT_TIME), "invalid-data");
    await rejectionCode(badStyleRepo.saveProjectBundle({
      project: { ...bundle.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [bundle.style], expectedProjectRevision: 1,
    }), "invalid-data");
    badStyleRepo.close();

    const recoveryRepo = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const valid = newBundle();
    await rejectionCode(recoveryRepo.saveProjectBundle({
      project: valid.project, styles: [valid.style],
      recoveries: [recovery(), recovery()], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(recoveryRepo.saveProjectBundle({
      project: valid.project, styles: [valid.style],
      recoveries: [{} as RecoveryRecord], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(recoveryRepo.saveProjectBundle({
      project: valid.project, styles: [valid.style],
      recoveries: "not-a-list" as unknown as RecoveryRecord[], expectedProjectRevision: null,
    }), "invalid-data");
    await rejectionCode(recoveryRepo.saveProjectBundle({
      project: valid.project, styles: [valid.style],
      clearRecoveryStyleIds: "not-a-list" as unknown as string[], expectedProjectRevision: null,
    }), "invalid-data");
    repository.close();
    recoveryRepo.close();
  });

  it("rejects unsupported database versions and incompatible object-store schemas without mutation", async () => {
    const factory = newFactory();
    const wrongName = databaseName();
    const wrong = await rawDatabase(factory, wrongName, 1);
    wrong.close();
    const wrongDb = await rawDatabase(factory, wrongName);
    // A database with no declared stores cannot be created by the raw open path; create a separate wrong schema.
    wrongDb.close();
    const unsupportedName = databaseName();
    const future = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(unsupportedName, PROJECT_DATABASE_VERSION + 1);
      request.onupgradeneeded = () => request.result.createObjectStore("future", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    future.close();
    await rejectionCode(openProjectRepository({ name: unsupportedName, factory, crypto: webcrypto }), "unsupported-version");
    const wrongPathName = databaseName();
    const wrongPath = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(wrongPathName, PROJECT_DATABASE_VERSION);
      request.onupgradeneeded = () => {
        for (const store of Object.values(PROJECT_STORES)) request.result.createObjectStore(store, { keyPath: "wrong" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    wrongPath.close();
    await rejectionCode(openProjectRepository({ name: wrongPathName, factory, crypto: webcrypto }), "unsupported-version");
    const missingStoreName = databaseName();
    const missingStore = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(missingStoreName, PROJECT_DATABASE_VERSION);
      request.onupgradeneeded = () => {
        for (const store of [...Object.values(PROJECT_STORES).slice(0, 4), "wrong"]) {
          request.result.createObjectStore(store, { keyPath: "key" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    missingStore.close();
    await rejectionCode(openProjectRepository({ name: missingStoreName, factory }), "unsupported-version");
    await rejectionCode(openProjectRepository({ name: databaseName(), factory, requestedVersion: 1 }), "unsupported-version");
    await rejectionCode(openProjectRepository({ name: databaseName(), factory, requestedVersion: 0 }), "invalid-data");
  });

  it("migrates legacy SaveFile versions, recovery-only data, and is idempotent by source fingerprint", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const saveJson = serialize(STANDARD_M, FABRIC);
    const recoveryJson = serializeRecovery(recovery().payload);
    const input = { saveJson, recoveryJson, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME };
    const before = { ...input };
    expect(await repository.migrateLegacy(input)).toMatchObject({ status: "migrated" });
    expect(input).toEqual(before);
    expect((await repository.loadProject(PROJECT_ID))?.activeRecovery?.styleId).toBe(STYLE_ID);
    expect(await repository.migrateLegacy(input)).toMatchObject({ status: "already-migrated" });
    repository.close();

    const recoveryOnly = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    expect(await recoveryOnly.migrateLegacy({
      saveJson: null, recoveryJson, projectId: OTHER_PROJECT_ID, styleId: OTHER_STYLE_ID, migratedAt: TIME,
    })).toMatchObject({ status: "migrated" });
    expect((await recoveryOnly.loadProject(OTHER_PROJECT_ID))?.activeStyle.design.workspace.garment).toBe("tee");
    recoveryOnly.close();

    const platformCrypto = await openProjectRepository({ name: databaseName(), factory });
    await expect(platformCrypto.migrateLegacy({
      saveJson: null, recoveryJson, projectId: "56c1c36a-1464-4be7-98df-998ce7655e01",
      styleId: "f0edfa0e-6104-46f5-88fd-ccf8b8c99542", migratedAt: TIME,
    })).resolves.toMatchObject({ status: "migrated" });
    platformCrypto.close();
  });

  it("rejects a corrupt persisted migration marker before trusting its fingerprint", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const input = {
      saveJson: serialize(STANDARD_M, FABRIC), recoveryJson: null,
      projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
    };
    const first = await repository.migrateLegacy(input);
    if (first.status !== "migrated") throw new Error("Initial legacy migration did not run.");
    await rawPut(factory, name, PROJECT_STORES.migrations, {
      sourceSha256: first.record.sourceSha256, schemaVersion: 99,
    });
    await rejectionCode(repository.migrateLegacy(input), "invalid-data");
    repository.close();
  });

  it("rolls back every destination record if legacy migration is interrupted before its marker write", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const input = {
      saveJson: serialize(STANDARD_M, FABRIC), recoveryJson: serializeRecovery(recovery().payload),
      projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
    };
    const originalPut = IDBObjectStore.prototype.put;
    const failure = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === PROJECT_STORES.migrations) throw new Error("simulated interrupted marker commit");
      return originalPut.call(this, value, key);
    });
    await rejectionCode(repository.migrateLegacy(input), "transaction");
    failure.mockRestore();
    expect(await repository.readActiveProject()).toBeNull();
    expect(await repository.loadProject(PROJECT_ID)).toBeNull();
    expect(input.saveJson).toContain('"v": 6');
    expect((await repository.migrateLegacy(input)).status).toBe("migrated");
    repository.close();
  });

  it("refuses to advance a project revision beyond the safe integer range", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    await rawPut(factory, name, PROJECT_STORES.projects, { ...bundle.project, revision: Number.MAX_SAFE_INTEGER });
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, Number.MAX_SAFE_INTEGER, NEXT_TIME), "invalid-data");
    repository.close();
  });

  it("keeps legacy data and destination unchanged for no data, invalid payloads, missing SHA-256, initialized storage, and collisions", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    await rejectionCode(repository.migrateLegacy({ saveJson: null, recoveryJson: null, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME }), "no-legacy-data");
    await rejectionCode(repository.migrateLegacy({ saveJson: "{", recoveryJson: null, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME }), "invalid-data");
    await rejectionCode(repository.migrateLegacy({ saveJson: null, recoveryJson: "{", projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME }), "invalid-data");
    const initialized = newBundle();
    await repository.saveProjectBundle({ project: initialized.project, styles: [initialized.style], expectedProjectRevision: null });
    await rejectionCode(repository.migrateLegacy({ saveJson: serialize(STANDARD_M, FABRIC), recoveryJson: null, projectId: OTHER_PROJECT_ID, styleId: OTHER_STYLE_ID, migratedAt: TIME }), "already-initialized");
    repository.close();

    const noCryptoName = databaseName();
    const noCrypto = await openProjectRepository({ name: noCryptoName, factory, crypto: webcrypto });
    noCrypto.close();
    const noSubtleRepository = new ProjectRepository(await rawDatabase(factory, noCryptoName), {} as Crypto);
    await rejectionCode(noSubtleRepository.migrateLegacy({
      saveJson: serialize(STANDARD_M, FABRIC), recoveryJson: null, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
    }), "unavailable");
    noSubtleRepository.close();

    const collisionName = databaseName();
    const collisionInit = await openProjectRepository({ name: collisionName, factory, crypto: webcrypto });
    collisionInit.close();
    await rawPut(factory, collisionName, PROJECT_STORES.styles, newBundle().style);
    const collision = await openProjectRepository({ name: collisionName, factory, crypto: webcrypto });
    await rejectionCode(collision.migrateLegacy({
      saveJson: serialize(STANDARD_M, FABRIC), recoveryJson: null, projectId: OTHER_PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
    }), "conflict");
    collision.close();
  });

  it("notifies and closes on database version change, then refuses the newer schema", async () => {
    const factory = newFactory();
    const name = databaseName();
    const onVersionChange = vi.fn(() => { throw new Error("UI callback is unavailable"); });
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto, onVersionChange });
    const upgrade = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, PROJECT_DATABASE_VERSION + 1);
      request.onupgradeneeded = () => request.result.createObjectStore("future", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    expect(onVersionChange).toHaveBeenCalledOnce();
    upgrade.close();
    await rejectionCode(openProjectRepository({ name, factory, crypto: webcrypto }), "unsupported-version");
    await rejectionCode(repository.loadProject(PROJECT_ID), "closed");
  });

  it("closes a stale connection when no version-change callback was configured", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory });
    const upgrade = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, PROJECT_DATABASE_VERSION + 1);
      request.onupgradeneeded = () => request.result.createObjectStore("future", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    upgrade.close();
    await rejectionCode(repository.loadProject(PROJECT_ID), "closed");
  });

  it("classifies blocked, failed, malformed, and late IndexedDB open events", async () => {
    const blocked = controlledFactory((request) => {
      request.onblocked?.(new Event("blocked"));
      request.onblocked?.(new Event("blocked"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: blocked }), "blocked");

    const versionFailure = controlledFactory((request) => {
      Object.defineProperty(request, "error", { value: { name: "VersionError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: versionFailure }), "unsupported-version");

    const genericFailure = controlledFactory((request) => request.onerror?.(new Event("error")));
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: genericFailure }), "unavailable");

    const lateError = controlledFactory((request) => {
      request.onblocked?.(new Event("blocked"));
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: lateError }), "blocked");

    const unsupportedSchema = controlledFactory((request) => {
      request.result = { version: 2, close: vi.fn() } as unknown as IDBDatabase;
      request.onsuccess?.(new Event("success"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: unsupportedSchema }), "unsupported-version");

    const names: string[] = [...Object.values(PROJECT_STORES)];
    const wrongKeyPath = controlledFactory((request) => {
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        close: vi.fn(),
        objectStoreNames: { length: names.length, contains: (name: string) => names.includes(name) },
        transaction: () => ({ objectStore: () => ({ keyPath: "wrong" }) }),
      } as unknown as IDBDatabase;
      request.onsuccess?.(new Event("success"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: wrongKeyPath }), "unsupported-version");

    const schemaReadThrows = controlledFactory((request) => {
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        close: vi.fn(),
        objectStoreNames: { length: names.length, contains: (name: string) => names.includes(name) },
        transaction: () => { throw new Error("schema read unavailable"); },
      } as unknown as IDBDatabase;
      request.onsuccess?.(new Event("success"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: schemaReadThrows }), "unsupported-version");

    const rejectedUpgrade = controlledFactory((request) => {
      request.onupgradeneeded?.({ oldVersion: 1, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      expect(request.transaction?.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: rejectedUpgrade }), "unavailable");

    const upgradeCursor = { result: null as unknown, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const upgradeAbort = vi.fn();
    const upgradeCreateStore = vi.fn();
    const expectedUpgrade = controlledFactory((request) => {
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        close: vi.fn(),
        objectStoreNames: { contains: (name: string) => name !== PROJECT_STORES.imports },
        createObjectStore: upgradeCreateStore,
      } as unknown as IDBDatabase;
      request.transaction = {
        abort: upgradeAbort,
        objectStore: () => ({ openCursor: () => upgradeCursor }),
      } as unknown as IDBTransaction;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      upgradeCursor.onsuccess?.(new Event("success"));
      expect(upgradeAbort).not.toHaveBeenCalled();
      expect(upgradeCreateStore).toHaveBeenCalledWith(PROJECT_STORES.imports, { keyPath: "packageSha256" });
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: expectedUpgrade }), "unavailable");

    const cursorErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const cursorErrorTransaction = {
      abort: vi.fn(),
      objectStore: () => ({ openCursor: () => cursorErrorRequest }),
    };
    const cursorError = controlledFactory((request) => {
      request.transaction = cursorErrorTransaction as unknown as IDBTransaction;
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      cursorErrorRequest.onerror?.(new Event("error"));
      expect(cursorErrorTransaction.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: cursorError }), "unavailable");

    const invalidCursorRequest = {
      result: { value: [] as unknown[], update: vi.fn(), continue: vi.fn() },
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const invalidCursorTransaction = { abort: vi.fn(), objectStore: () => ({ openCursor: () => invalidCursorRequest }) };
    const invalidCursor = controlledFactory((request) => {
      request.transaction = invalidCursorTransaction as unknown as IDBTransaction;
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      invalidCursorRequest.onsuccess?.(new Event("success"));
      expect(invalidCursorTransaction.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: invalidCursor }), "unavailable");

    const legacyValue: Record<string, unknown> = { ...newBundle().style, schemaVersion: 1 };
    delete legacyValue.archivedAt;
    delete legacyValue.revisionHeadId;
    const throwingCursorRequest = {
      result: {
        value: legacyValue,
        update: () => { throw new Error("cursor update failed"); },
        continue: vi.fn(),
      },
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const throwingCursorTransaction = { abort: vi.fn(), objectStore: () => ({ openCursor: () => throwingCursorRequest }) };
    const throwingCursor = controlledFactory((request) => {
      request.transaction = throwingCursorTransaction as unknown as IDBTransaction;
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      throwingCursorRequest.onsuccess?.(new Event("success"));
      expect(throwingCursorTransaction.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: throwingCursor }), "unavailable");

    const missingTransaction = controlledFactory((request) => {
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = null;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: missingTransaction }), "unavailable");

    const lateSuccess = controlledFactory((request) => {
      request.onblocked?.(new Event("blocked"));
      request.onsuccess?.(new Event("success"));
      expect((request.result as unknown as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalledOnce();
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: lateSuccess }), "blocked");
  });

  it("aborts every malformed or unavailable version-one project and style record upgrade", async () => {
    const triggerUpgrade = async (
      oldVersion: number,
      transaction: IDBTransaction | null,
      triggerRequests: () => void,
    ): Promise<void> => {
      const factory = controlledFactory((request) => {
        request.result = {
          version: PROJECT_DATABASE_VERSION,
          objectStoreNames: { contains: () => true },
          createObjectStore: vi.fn(),
        } as unknown as IDBDatabase;
        request.transaction = transaction;
        request.onupgradeneeded?.({ oldVersion, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
        triggerRequests();
        Object.defineProperty(request, "error", { value: { name: "AbortError" } });
        request.onerror?.(new Event("error"));
      });
      await rejectionCode(openProjectRepository({ name: databaseName(), factory }), "unavailable");
    };

    // A missing IndexedDB upgrade transaction must be handled without throwing.
    await triggerUpgrade(1, null, () => undefined);
    await triggerUpgrade(2, null, () => undefined);

    const assertAbortedCursor = async (
      oldVersion: number,
      value: unknown,
      update: () => void = vi.fn(),
    ): Promise<void> => {
      const cursorRequest = (cursorValue: unknown, cursorUpdate: () => void = vi.fn()) => ({
        result: cursorValue === null ? null : { value: cursorValue, update: cursorUpdate, continue: vi.fn() },
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      });
      const requests = {
        [PROJECT_STORES.projects]: cursorRequest(value, update),
        [PROJECT_STORES.styles]: cursorRequest(null),
        [PROJECT_STORES.recoveries]: cursorRequest(null),
      };
      const transaction = {
        abort: vi.fn(),
        objectStore: (name: string) => ({ openCursor: () => requests[name as keyof typeof requests] }),
      } as unknown as IDBTransaction;
      await triggerUpgrade(oldVersion, transaction, () => {
        for (const request of Object.values(requests)) request.onsuccess?.(new Event("success"));
        expect(transaction.abort).toHaveBeenCalled();
      });
    };

    await assertAbortedCursor(2, []);
    await assertAbortedCursor(2, { id: PROJECT_ID, schemaVersion: 99 });
    await assertAbortedCursor(2, { ...newBundle().project, schemaVersion: 1, unexpected: true });
    const legacyProject: Record<string, unknown> = { ...newBundle().project, schemaVersion: 1 };
    delete legacyProject.importedFrom;
    await assertAbortedCursor(2, legacyProject, () => {
      throw new Error("project cursor update failed");
    });

    const projectOpenCursorThrows = controlledFactory((request) => {
      const emptyCursor = { result: null, onsuccess: null, onerror: null };
      const transaction = {
        abort: vi.fn(),
        objectStore: (name: string) => {
          if (name === PROJECT_STORES.projects) throw new Error("project store is unavailable");
          return { openCursor: () => emptyCursor };
        },
      };
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = transaction as unknown as IDBTransaction;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      expect(transaction.abort).toHaveBeenCalled();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: projectOpenCursorThrows }), "unavailable");

    const styleOpenCursorThrows = controlledFactory((request) => {
      const emptyCursor = { result: null, onsuccess: null, onerror: null };
      const transaction = {
        abort: vi.fn(),
        objectStore: (name: string) => {
          if (name === PROJECT_STORES.styles) throw new Error("style store is unavailable");
          return { openCursor: () => emptyCursor };
        },
      };
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = transaction as unknown as IDBTransaction;
      request.onupgradeneeded?.({ oldVersion: 1, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      expect(transaction.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: styleOpenCursorThrows }), "unavailable");

    const styleRequest = {
      result: { value: [], update: vi.fn(), continue: vi.fn() },
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const projectRequest = {
      result: null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const recoveryRequest = {
      result: null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const styleTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => ({
        [PROJECT_STORES.styles]: styleRequest,
        [PROJECT_STORES.projects]: projectRequest,
        [PROJECT_STORES.recoveries]: recoveryRequest,
      }[name] ?? projectRequest) }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleTransaction, () => {
      styleRequest.onsuccess?.(new Event("success"));
      projectRequest.onsuccess?.(new Event("success"));
      recoveryRequest.onsuccess?.(new Event("success"));
      expect(styleTransaction.abort).toHaveBeenCalledOnce();
    });

    const styleErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const projectAfterStyleErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const recoveryAfterStyleErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const styleErrorTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => ({
        [PROJECT_STORES.styles]: styleErrorRequest,
        [PROJECT_STORES.projects]: projectAfterStyleErrorRequest,
        [PROJECT_STORES.recoveries]: recoveryAfterStyleErrorRequest,
      }[name] ?? projectAfterStyleErrorRequest) }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleErrorTransaction, () => {
      styleErrorRequest.onerror?.(new Event("error"));
      projectAfterStyleErrorRequest.onsuccess?.(new Event("success"));
      recoveryAfterStyleErrorRequest.onsuccess?.(new Event("success"));
      expect(styleErrorTransaction.abort).toHaveBeenCalledOnce();
    });

    const legacyStyle: Record<string, unknown> = { ...newBundle().style, schemaVersion: 1 };
    delete legacyStyle.archivedAt;
    delete legacyStyle.revisionHeadId;
    const legacyStyleDesign = { ...newBundle().style.design } as Record<string, unknown>;
    delete legacyStyleDesign.semanticEdits;
    legacyStyle.design = legacyStyleDesign;
    const styleUpdateRequest = {
      result: { value: legacyStyle, update: () => { throw new Error("style cursor update failed"); }, continue: vi.fn() },
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const emptyProjectRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const emptyRecoveryRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const styleUpdateTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => ({
        [PROJECT_STORES.styles]: styleUpdateRequest,
        [PROJECT_STORES.projects]: emptyProjectRequest,
        [PROJECT_STORES.recoveries]: emptyRecoveryRequest,
      }[name] ?? emptyProjectRequest) }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleUpdateTransaction, () => {
      styleUpdateRequest.onsuccess?.(new Event("success"));
      emptyProjectRequest.onsuccess?.(new Event("success"));
      emptyRecoveryRequest.onsuccess?.(new Event("success"));
      expect(styleUpdateTransaction.abort).toHaveBeenCalledOnce();
    });
  });

  it("rolls back when an IndexedDB write aborts and rejects factories or transactions that fail", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    const initial = newBundle();
    await repository.saveProjectBundle({ project: initial.project, styles: [initial.style], expectedProjectRevision: null });
    const originalPut = IDBObjectStore.prototype.put;
    const putSpy = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (typeof value === "object" && value !== null && "id" in value && value.id === PROJECT_ID && "revision" in value && value.revision === 2) {
        throw new Error("simulated durable write failure");
      }
      return originalPut.call(this, value, key);
    });
    await rejectionCode(repository.saveProjectBundle({
      project: { ...initial.project, revision: 2, updatedAt: NEXT_TIME },
      styles: [{ ...initial.style, revision: 2, updatedAt: NEXT_TIME }],
      expectedProjectRevision: 1,
    }), "transaction");
    putSpy.mockRestore();
    expect((await repository.loadProject(PROJECT_ID))?.project.revision).toBe(1);
    repository.close();

    await rejectionCode(openProjectRepository({ factory: undefined as unknown as IDBFactory }), "unavailable");
    const throwingDatabase = { transaction: () => { throw "storage gone"; }, close: () => undefined } as unknown as IDBDatabase;
    const throwingRepository = new ProjectRepository(throwingDatabase, webcrypto);
    await rejectionCode(throwingRepository.readActiveProject(), "transaction");
    throwingRepository.close();
  });

  it("propagates IndexedDB request and transaction errors after an automatic constraint abort", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const bundle = newBundle();
    await repository.saveProjectBundle({ project: bundle.project, styles: [bundle.style], expectedProjectRevision: null });
    const originalGet = IDBObjectStore.prototype.get;
    const getSpy = vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(function (this: IDBObjectStore, key: IDBValidKey | IDBKeyRange) {
      if (this.name === PROJECT_STORES.projects && key === PROJECT_ID) {
        return this.add(bundle.project) as IDBRequest<unknown>;
      }
      return originalGet.call(this, key);
    });
    await rejectionCode(repository.selectActiveStyle(PROJECT_ID, STYLE_ID, 1, NEXT_TIME), "transaction");
    getSpy.mockRestore();
    const abortSpy = vi.spyOn(IDBTransaction.prototype, "abort").mockImplementation(() => {
      throw new Error("transaction already completed");
    });
    await rejectionCode(repository.selectActiveStyle(OTHER_PROJECT_ID, STYLE_ID, 1, NEXT_TIME), "not-found");
    expect(abortSpy).toHaveBeenCalledOnce();
    abortSpy.mockRestore();
    repository.close();
  });

  it("uses the request error fallback when a host omits its DOMException", async () => {
    const factory = newFactory();
    const repository = await openProjectRepository({ name: databaseName(), factory, crypto: webcrypto });
    const originalGet = IDBObjectStore.prototype.get;
    const requestSpy = vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(function (this: IDBObjectStore, key: IDBValidKey | IDBKeyRange) {
      if (this.name === PROJECT_STORES.projects && key === PROJECT_ID) {
        const failedRequest = {
          error: null,
          set onsuccess(_handler: ((event: Event) => void) | null) { /* No success event. */ },
          set onerror(handler: ((event: Event) => void) | null) {
            if (handler) queueMicrotask(() => handler(new Event("error")));
          },
        };
        return failedRequest as unknown as IDBRequest<unknown>;
      }
      return originalGet.call(this, key);
    });
    await rejectionCode(repository.loadProject(PROJECT_ID), "transaction");
    requestSpy.mockRestore();
    repository.close();
  });

  it("validates project switching, collision checks, package receipts, imported bundles, and recovery reads", async () => {
    const factory = newFactory();
    const name = databaseName();
    const repository = await openProjectRepository({ name, factory, crypto: webcrypto });
    try {
      await repository.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
      const incoming = newBundle(OTHER_PROJECT_ID, OTHER_STYLE_ID);
      const receipt = {
        packageSha256: "a".repeat(64),
        projectId: OTHER_PROJECT_ID,
        importedAt: TIME,
        importedAsCopy: false,
      };
      expect(await repository.hasStyleIdCollision([OTHER_STYLE_ID])).toBe(false);
      expect(await repository.hasStyleIdCollision([STYLE_ID])).toBe(true);
      await rejectionCode(repository.hasStyleIdCollision([""]), "invalid-data");
      await rejectionCode(repository.selectActiveProject(""), "invalid-data");
      await rejectionCode(repository.selectActiveProject("77777777-7777-4777-8777-777777777777"), "not-found");
      await expect(repository.readProjectBundle("77777777-7777-4777-8777-777777777777")).resolves.toBeNull();
      await expect(repository.readProjectImportReceipt("b".repeat(64))).resolves.toBeNull();
      await rejectionCode(repository.readProjectImportReceipt("not-a-digest"), "invalid-data");
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        receipt: { ...receipt, projectId: PROJECT_ID },
      }), "invalid-data");
      await rejectionCode(repository.importProjectBundle({
        project: { ...incoming.project, name: "" },
        styles: [incoming.style],
        recoveries: [],
        receipt,
      }), "invalid-data");
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        receipt: null as unknown as typeof receipt,
      }), "invalid-data");
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        receipt: { ...receipt, importedAsCopy: true },
      }), "invalid-data");
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [recovery(STYLE_ID)],
        receipt,
      }), "invalid-data");

      const orphanRevision = await createStyleRevision({
        styleId: incoming.style.id,
        revisionId: "11111111-1111-4111-8111-111111111111",
        parentRevisionId: null,
        revisionNumber: 1,
        design: incoming.style.design,
        fieldObservations: fieldHistory(incoming.style),
        artwork: [],
        createdAt: TIME,
      }, webcrypto);
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        fieldObservations: [fieldHistory(incoming.style)],
        styleRevisions: [orphanRevision],
        receipt,
      }), "invalid-data");
      expect(await repository.readProjectBundle(incoming.project.id)).toBeNull();
      expect(await repository.readProjectImportReceipt(receipt.packageSha256)).toBeNull();

      expect(await repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [recovery(OTHER_STYLE_ID)],
        receipt,
      })).toMatchObject({ status: "imported", project: { id: OTHER_PROJECT_ID } });
      expect(await repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        receipt,
      })).toMatchObject({ status: "already-imported", receipt });
      expect(await repository.readProjectImportReceipt(receipt.packageSha256)).toEqual(receipt);
      expect((await repository.readProjectBundle(OTHER_PROJECT_ID))?.recoveries).toEqual([recovery(OTHER_STYLE_ID)]);
      expect(await repository.listProjects()).toHaveLength(2);
      expect((await repository.selectActiveProject(OTHER_PROJECT_ID)).project.id).toBe(OTHER_PROJECT_ID);
      expect(await repository.selectActiveProject(OTHER_PROJECT_ID)).toMatchObject({ project: { id: OTHER_PROJECT_ID } });
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project,
        styles: [incoming.style],
        recoveries: [],
        receipt: { ...receipt, packageSha256: "b".repeat(64) },
      }), "conflict");

      await rawPut(factory, name, PROJECT_STORES.imports, {
        packageSha256: receipt.packageSha256, projectId: "invalid", importedAt: "yesterday", importedAsCopy: false,
      });
      await rejectionCode(repository.importProjectBundle({
        project: incoming.project, styles: [incoming.style], recoveries: [], receipt,
      }), "invalid-data");

      const styleCollision = newBundle("77777777-7777-4777-8777-777777777777", STYLE_ID);
      await rejectionCode(repository.importProjectBundle({
        project: styleCollision.project,
        styles: [styleCollision.style],
        recoveries: [],
        receipt: {
          packageSha256: "c".repeat(64),
          projectId: styleCollision.project.id,
          importedAt: TIME,
          importedAsCopy: false,
        },
      }), "conflict");

      const copy = newBundle("88888888-8888-4888-8888-888888888888", "99999999-9999-4999-8999-999999999999");
      const copiedProject = {
        ...copy.project,
        importedFrom: { projectId: PROJECT_ID, styleIds: [STYLE_ID], packageSha256: "d".repeat(64) },
      };
      expect(await repository.importProjectBundle({
        project: copiedProject,
        styles: [copy.style],
        recoveries: [],
        receipt: {
          packageSha256: "e".repeat(64),
          projectId: copiedProject.id,
          importedAt: TIME,
          importedAsCopy: true,
        },
      })).toMatchObject({ status: "imported" });

      await rawPut(factory, name, PROJECT_STORES.imports, {
        packageSha256: "f".repeat(64), projectId: "invalid", importedAt: "yesterday", importedAsCopy: false,
      });
      await rejectionCode(repository.readProjectImportReceipt("f".repeat(64)), "invalid-data");

      const current = await repository.readProjectBundle(OTHER_PROJECT_ID);
      if (!current) throw new Error("Imported project unexpectedly disappeared.");
      const second = newBundle(OTHER_PROJECT_ID, SECOND_STYLE_ID);
      await repository.saveProjectBundle({
        project: {
          ...current.project,
          styleIds: [...current.project.styleIds, SECOND_STYLE_ID],
          revision: current.project.revision + 1,
          updatedAt: NEXT_TIME,
        },
        styles: [...current.styles, second.style],
        recoveries: current.recoveries,
        expectedProjectRevision: current.project.revision,
      });
      await rawPut(factory, name, PROJECT_STORES.recoveries, { styleId: SECOND_STYLE_ID, payload: null });
      await rejectionCode(repository.readProjectBundle(OTHER_PROJECT_ID), "invalid-data");
      const archived = { ...incoming.style, archivedAt: TIME };
      await rawPut(factory, name, PROJECT_STORES.styles, archived);
      await rejectionCode(repository.selectActiveProject(OTHER_PROJECT_ID), "invalid-data");
      await rawPut(factory, name, PROJECT_STORES.projects, { id: "77777777-7777-4777-8777-777777777777" });
      await rejectionCode(repository.listProjects(), "invalid-data");
    } finally {
      repository.close();
    }
  });
});
