import { webcrypto as nodeWebcrypto } from "node:crypto";
import { IDBFactory, IDBObjectStore, IDBTransaction } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import {
  migrateLegacyRecovery,
  migrateLegacySaveFile,
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

  it("upgrades version-one style records transactionally and leaves malformed version-one data intact", async () => {
    const factory = newFactory();
    const name = databaseName();
    const bundle = newBundle();
    const legacyStyle: Record<string, unknown> = { ...bundle.style, schemaVersion: 1 };
    delete legacyStyle.archivedAt;
    const legacyProject: Record<string, unknown> = { ...bundle.project, schemaVersion: 1 };
    delete legacyProject.importedFrom;
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
        transaction.objectStore(PROJECT_STORES.meta).put({ key: "activeSelection", projectId: PROJECT_ID, styleId: STYLE_ID });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    versionOne.close();
    const upgraded = await openProjectRepository({ name, factory, crypto: webcrypto });
    expect((await upgraded.readActiveProject())?.activeStyle).toMatchObject({
      id: STYLE_ID, schemaVersion: 2, archivedAt: null, design: bundle.style.design,
    });
    expect((await upgraded.readActiveProject())?.project).toMatchObject({ schemaVersion: 2, importedFrom: null });
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
    expect(input.saveJson).toContain('"v": 5');
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
      request.onupgradeneeded?.({ oldVersion: 1, newVersion: 2 } as IDBVersionChangeEvent);
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
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: 3 } as IDBVersionChangeEvent);
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
      const request = {
        result: { value, update, continue: vi.fn() },
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const transaction = {
        abort: vi.fn(),
        objectStore: () => ({ openCursor: () => request }),
      } as unknown as IDBTransaction;
      await triggerUpgrade(oldVersion, transaction, () => {
        request.onsuccess?.(new Event("success"));
        expect(transaction.abort).toHaveBeenCalledOnce();
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
      const transaction = { abort: vi.fn(), objectStore: () => { throw new Error("project store is unavailable"); } };
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = transaction as unknown as IDBTransaction;
      request.onupgradeneeded?.({ oldVersion: 2, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      expect(transaction.abort).toHaveBeenCalledOnce();
      Object.defineProperty(request, "error", { value: { name: "AbortError" } });
      request.onerror?.(new Event("error"));
    });
    await rejectionCode(openProjectRepository({ name: databaseName(), factory: projectOpenCursorThrows }), "unavailable");

    const styleOpenCursorThrows = controlledFactory((request) => {
      const transaction = { abort: vi.fn(), objectStore: () => { throw new Error("style store is unavailable"); } };
      request.result = {
        version: PROJECT_DATABASE_VERSION,
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
      } as unknown as IDBDatabase;
      request.transaction = transaction as unknown as IDBTransaction;
      request.onupgradeneeded?.({ oldVersion: 1, newVersion: PROJECT_DATABASE_VERSION } as IDBVersionChangeEvent);
      expect(transaction.abort).toHaveBeenCalledTimes(2);
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
    const styleTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => name === PROJECT_STORES.styles ? styleRequest : projectRequest }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleTransaction, () => {
      styleRequest.onsuccess?.(new Event("success"));
      projectRequest.onsuccess?.(new Event("success"));
      expect(styleTransaction.abort).toHaveBeenCalledOnce();
    });

    const styleErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const projectAfterStyleErrorRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const styleErrorTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => name === PROJECT_STORES.styles ? styleErrorRequest : projectAfterStyleErrorRequest }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleErrorTransaction, () => {
      styleErrorRequest.onerror?.(new Event("error"));
      projectAfterStyleErrorRequest.onsuccess?.(new Event("success"));
      expect(styleErrorTransaction.abort).toHaveBeenCalledOnce();
    });

    const legacyStyle: Record<string, unknown> = { ...newBundle().style, schemaVersion: 1 };
    delete legacyStyle.archivedAt;
    const styleUpdateRequest = {
      result: { value: legacyStyle, update: () => { throw new Error("style cursor update failed"); }, continue: vi.fn() },
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const emptyProjectRequest = { result: null, onsuccess: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null };
    const styleUpdateTransaction = {
      abort: vi.fn(),
      objectStore: (name: string) => ({ openCursor: () => name === PROJECT_STORES.styles ? styleUpdateRequest : emptyProjectRequest }),
    } as unknown as IDBTransaction;
    await triggerUpgrade(1, styleUpdateTransaction, () => {
      styleUpdateRequest.onsuccess?.(new Event("success"));
      emptyProjectRequest.onsuccess?.(new Event("success"));
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
