import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import { migrateLegacyRecovery, type RecoveryPayload } from "./project-records";
import type { ProjectRepository } from "./project-repository";
import { openProjectWorkflow, ProjectWorkflow } from "./project-workflow";

const cryptoApi = webcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const NEXT_TIME = "2026-09-24T16:00:01.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const STYLE_TWO_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
const STYLE_THREE_ID = "1f8eafbf-9f75-4d82-9a43-3557ae359de8";
const OTHER_PROJECT_ID = "96c0ee20-bdba-41ba-a871-1930a9b58262";
let serial = 0;
const workflows: ProjectWorkflow[] = [];

function storage(values: Record<string, string> = {}): Pick<Storage, "getItem"> {
  return {
    getItem: vi.fn((key: string) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null),
  };
}

function repositoryOptions(): { repositoryOptions: { name: string; factory: IDBFactory; crypto: Crypto } } {
  const factory = new IDBFactory();
  const name = `project-workflow-${++serial}`;
  return { repositoryOptions: { name, factory, crypto: cryptoApi } };
}

function ids(...values: string[]): () => string {
  let index = 0;
  return () => values[index++] ?? STYLE_THREE_ID;
}

function recoveryPayload(): RecoveryPayload {
  const payload = {
    savedAt: 123,
    measurements: { ...STANDARD_M, chest: null },
    rawMeasurements: { chest: "", neck: "40" },
    fabric: "#3A4150",
    appearance: DEFAULT_APPEARANCE,
    garmentOptions: { tee: {} },
    rawOptions: { tee: {} },
    workspace: DEFAULT_WORKSPACE,
    materialSelectionExplicit: false,
    surface: {},
    rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
  };
  const parsed = migrateLegacyRecovery(STYLE_ID, serializeRecovery(payload));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value.payload;
}

async function open(values: Record<string, string> = {}, extra: Record<string, unknown> = {}): Promise<ProjectWorkflow> {
  const options = repositoryOptions();
  const workflow = await openProjectWorkflow({
    ...options,
    storage: storage(values),
    idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID, STYLE_THREE_ID),
    now: () => TIME,
    ...extra,
  });
  workflows.push(workflow);
  return workflow;
}

afterEach(() => {
  workflows.splice(0).forEach((workflow) => workflow.close());
  vi.unstubAllGlobals();
});

describe("local project/style workflow", () => {
  it("creates one first-run style when no legacy data exists and keeps recipe preset identity separate", async () => {
    const fakeStorage = storage();
    const options = repositoryOptions();
    const workflow = await openProjectWorkflow({
      ...options, storage: fakeStorage, idFactory: ids(PROJECT_ID, STYLE_ID), now: () => TIME,
    });
    workflows.push(workflow);
    expect(workflow.snapshot.project.styleIds).toEqual([STYLE_ID]);
    expect(workflow.snapshot.activeStyle.name).toBe("Untitled tee");
    expect(workflow.snapshot.activeStyle.recipeId).toBe("tee");
    expect(workflow.snapshot.activeStyle.recipePresetId).toBe(workflow.snapshot.activeStyle.design.workspace.targetStyle);
    expect(fakeStorage.getItem).toHaveBeenCalledTimes(2);
  });

  it("uses secure generated IDs and a canonical clock when callers do not inject them", async () => {
    const options = repositoryOptions();
    const workflow = await openProjectWorkflow({ ...options, storage: storage() });
    workflows.push(workflow);
    expect(workflow.snapshot.project.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(workflow.snapshot.activeStyle.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(new Date(workflow.snapshot.project.createdAt).toISOString()).toBe(workflow.snapshot.project.createdAt);
  });

  it("generates migration IDs and timestamps when legacy sources are present", async () => {
    const options = repositoryOptions();
    const workflow = await openProjectWorkflow({
      ...options,
      storage: storage({ patternworks_save_v1: serialize(STANDARD_M, "#3A4150") }),
    });
    workflows.push(workflow);
    expect(workflow.snapshot.activeStyle.recipeId).toBe("tee");
    expect(workflow.snapshot.project.id).not.toBe(workflow.snapshot.activeStyle.id);
  });

  it("fails closed when secure random IDs are unavailable", async () => {
    vi.stubGlobal("crypto", undefined);
    const options = repositoryOptions();
    await expect(openProjectWorkflow({ ...options, storage: storage() })).rejects.toMatchObject({ code: "unavailable" });
  });

  it("converges concurrent first-run tabs on one committed local project", async () => {
    const factory = new IDBFactory();
    const name = `project-workflow-concurrent-${++serial}`;
    const first = openProjectWorkflow({
      repositoryOptions: { name, factory, crypto: cryptoApi },
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID),
      now: () => TIME,
    });
    const second = openProjectWorkflow({
      repositoryOptions: { name, factory, crypto: cryptoApi },
      storage: storage(),
      idFactory: ids(OTHER_PROJECT_ID, STYLE_TWO_ID),
      now: () => TIME,
    });
    const [left, right] = await Promise.all([first, second]);
    workflows.push(left, right);
    expect(left.snapshot.project.id).toBe(right.snapshot.project.id);
    expect(left.snapshot.activeStyle.id).toBe(right.snapshot.activeStyle.id);
  });

  it("recovers a concurrent first-run or legacy migration winner by reading its active project", async () => {
    const winner = await open();
    const initializedRepo = {
      readActiveProject: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(winner.snapshot),
      initializeFirstRun: vi.fn().mockRejectedValue(new Error("another tab initialized first")),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    const initialized = await openProjectWorkflow({
      storage: storage(),
      idFactory: ids(STYLE_TWO_ID),
      now: () => TIME,
      openRepository: async () => initializedRepo,
    });
    workflows.push(initialized);
    expect(initialized.snapshot.project.id).toBe(winner.snapshot.project.id);

    const saveJson = serialize(STANDARD_M, "#3A4150");
    const migrationRepo = {
      readActiveProject: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(winner.snapshot),
      migrateLegacy: vi.fn().mockRejectedValue(new Error("another tab migrated first")),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    const migratedWinner = await openProjectWorkflow({
      storage: storage({ patternworks_save_v1: saveJson }),
      idFactory: ids(STYLE_TWO_ID, STYLE_THREE_ID),
      now: () => TIME,
      openRepository: async () => migrationRepo,
    });
    workflows.push(migratedWinner);
    expect(migratedWinner.snapshot.project.id).toBe(winner.snapshot.project.id);
  });

  it("rejects an impossible first-run success and closes the unusable repository", async () => {
    const repository = {
      readActiveProject: vi.fn(async () => null),
      initializeFirstRun: vi.fn(async () => ({})),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID),
      now: () => TIME,
      openRepository: async () => repository,
    })).rejects.toMatchObject({ code: "not-found" });
    expect(repository.close).toHaveBeenCalledOnce();
  });

  it("migrates saved and recovery data without changing either legacy source", async () => {
    const saveJson = serialize(STANDARD_M, "#3A4150");
    const recoveryJson = serializeRecovery(recoveryPayload());
    const fakeStorage = storage({ patternworks_save_v1: saveJson, patternworks_recovery_v1: recoveryJson });
    const options = repositoryOptions();
    const workflow = await openProjectWorkflow({
      ...options,
      storage: fakeStorage,
      idFactory: ids(PROJECT_ID, STYLE_ID),
      now: () => TIME,
    });
    workflows.push(workflow);
    expect(workflow.snapshot.activeStyle.design.measurements).toEqual(STANDARD_M);
    expect(workflow.snapshot.activeRecovery?.payload.rawMeasurements).toEqual({ chest: "", neck: "40" });
    expect(fakeStorage.getItem("patternworks_save_v1")).toBe(saveJson);
    expect(fakeStorage.getItem("patternworks_recovery_v1")).toBe(recoveryJson);
  });

  it("serializes saves, recovery, switching, naming, duplication, archive and restore without crossing styles", async () => {
    const workflow = await open();
    const original = workflow.snapshot.activeStyle;
    expect(await workflow.switchStyle(original.id)).toBe(workflow.snapshot);
    await workflow.saveRecovery(original.id, recoveryPayload());
    expect(workflow.snapshot.activeRecovery?.styleId).toBe(original.id);

    const changedDesign = { ...original.design, fabric: "#204060" };
    const saved = await workflow.saveActiveDesign(changedDesign);
    expect(saved.activeStyle.design.fabric).toBe("#204060");
    expect(saved.activeStyle.revision).toBe(original.revision + 1);
    expect(saved.activeRecovery).toBeNull();

    const second = await workflow.createStyle("Summer polo", original.design);
    expect(second.activeStyle.id).toBe(STYLE_TWO_ID);
    expect(second.activeStyle.name).toBe("Summer polo");
    expect(second.activeStyle.design.fabric).toBe(original.design.fabric);
    expect(second.project.styleIds).toEqual([STYLE_ID, STYLE_TWO_ID]);
    await workflow.saveRecovery(STYLE_TWO_ID, recoveryPayload());

    const switched = await workflow.switchStyle(STYLE_ID);
    expect(switched.activeStyle.id).toBe(STYLE_ID);
    expect(switched.activeStyle.design.fabric).toBe("#204060");
    expect(switched.activeRecovery).toBeNull();
    const renamed = await workflow.renameActiveStyle("Renamed tee");
    expect(renamed.activeStyle.name).toBe("Renamed tee");

    const archived = await workflow.archiveStyle(STYLE_TWO_ID);
    expect(archived.styles.find((style) => style.id === STYLE_TWO_ID)?.archivedAt).toBe(TIME);
    await expect(workflow.switchStyle(STYLE_TWO_ID)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.repository.selectActiveStyle(
      PROJECT_ID, STYLE_TWO_ID, archived.project.revision, "2026-09-24T16:00:02.000Z",
    )).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.archiveStyle(STYLE_TWO_ID)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.archiveStyle(STYLE_ID)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.archiveStyle("missing")).rejects.toMatchObject({ code: "not-found" });

    const restored = await workflow.restoreStyle(STYLE_TWO_ID);
    expect(restored.styles.find((style) => style.id === STYLE_TWO_ID)?.archivedAt).toBeNull();
    await expect(workflow.restoreStyle(STYLE_TWO_ID)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.restoreStyle("missing")).rejects.toMatchObject({ code: "not-found" });
    const activeSecond = await workflow.switchStyle(STYLE_TWO_ID);
    expect(activeSecond.activeRecovery?.styleId).toBe(STYLE_TWO_ID);
    await workflow.clearRecovery(STYLE_TWO_ID);
    expect(workflow.snapshot.activeRecovery).toBeNull();

    await expect(workflow.createStyle("renamed TEE", original.design)).rejects.toMatchObject({ code: "conflict" });
    await expect(workflow.createStyle("  ", original.design)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.renameActiveStyle(" ")).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.renameActiveStyle("Renamed tee")).rejects.toMatchObject({ code: "conflict" });
    await expect(workflow.switchStyle("missing")).rejects.toMatchObject({ code: "not-found" });
  });

  it("recovers its serialized queue after a failed operation and requires reload after a stale revision", async () => {
    const workflow = await open();
    await expect(workflow.renameActiveStyle(" ")).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.renameActiveStyle(undefined as unknown as string)).rejects.toMatchObject({ code: "invalid-data" });
    await workflow.renameActiveStyle("Recovered name");
    const current = workflow.snapshot;
    const time = "2026-09-24T16:00:02.000Z";
    await workflow.repository.saveProjectBundle({
      project: { ...current.project, revision: current.project.revision + 1, updatedAt: time },
      styles: current.styles,
      expectedProjectRevision: current.project.revision,
    });
    await expect(workflow.renameActiveStyle("Stale write")).rejects.toMatchObject({ code: "conflict" });
    expect((await workflow.reload()).activeStyle.name).toBe("Recovered name");
    expect((await workflow.renameActiveStyle("After reload")).activeStyle.name).toBe("After reload");
  });

  it("reports a missing project after a style-scoped save or explicit reload", async () => {
    const source = await open();
    const repository = {
      saveRecovery: vi.fn(async () => undefined),
      loadProject: vi.fn(async () => null),
      readActiveProject: vi.fn(async () => null),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    const missing = new ProjectWorkflow(repository, source.snapshot, ids(STYLE_TWO_ID), () => TIME);
    await expect(missing.saveRecovery(STYLE_ID, recoveryPayload())).rejects.toMatchObject({ code: "not-found" });
    await expect(missing.reload()).rejects.toMatchObject({ code: "not-found" });
  });

  it("does not initialize or overwrite data when migration sources are inaccessible or invalid", async () => {
    const inaccessible = repositoryOptions();
    const brokenStorage = { getItem: () => { throw new Error("blocked storage"); } };
    await expect(openProjectWorkflow({ ...inaccessible, storage: brokenStorage, idFactory: ids(PROJECT_ID, STYLE_ID), now: () => TIME })).rejects.toThrow("blocked storage");

    const invalid = repositoryOptions();
    const source = storage({ patternworks_save_v1: "{ invalid" });
    await expect(openProjectWorkflow({ ...invalid, storage: source, idFactory: ids(PROJECT_ID, STYLE_ID), now: () => TIME })).rejects.toMatchObject({ code: "invalid-data" });
    expect(source.getItem("patternworks_save_v1")).toBe("{ invalid");

    const unavailable = repositoryOptions();
    await expect(openProjectWorkflow({ ...unavailable, storage: undefined as unknown as Storage })).rejects.toMatchObject({ code: "unavailable" });
  });

  it("rejects invalid clocks and duplicate generated identities without losing its committed style", async () => {
    const options = repositoryOptions();
    const workflow = await openProjectWorkflow({
      ...options,
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID),
      now: () => TIME,
    });
    workflows.push(workflow);
    const invalidClock = new ProjectWorkflow(workflow.repository, workflow.snapshot, () => STYLE_TWO_ID, () => "yesterday");
    await expect(invalidClock.renameActiveStyle("Future")).rejects.toMatchObject({ code: "invalid-data" });
    const duplicateId = new ProjectWorkflow(workflow.repository, workflow.snapshot, () => STYLE_ID, () => NEXT_TIME);
    await expect(duplicateId.createStyle("Second", workflow.snapshot.activeStyle.design)).rejects.toMatchObject({ code: "invalid-data" });
    expect((await workflow.reload()).activeStyle.id).toBe(STYLE_ID);
  });
});
