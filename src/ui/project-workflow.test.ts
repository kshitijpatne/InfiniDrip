import { webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import { migrateLegacyRecovery, migrateLegacySaveFile, type RecoveryPayload } from "./project-records";
import { ProjectRepositoryError, type LoadedProject, type ProjectRepository } from "./project-repository";
import { changedPaths, openProjectWorkflow, ProjectWorkflow } from "./project-workflow";
import { createFieldObservationRecord, currentFieldObservation, getFieldDefinition } from "./field-provenance";
import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";

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

function withoutRevisionHeads(loaded: LoadedProject): LoadedProject {
  const styles = loaded.styles.map((style) => ({ ...style, revision: 1, revisionHeadId: null }));
  return {
    ...loaded,
    project: { ...loaded.project, revision: 1 },
    styles,
    activeStyle: styles.find((style) => style.id === loaded.activeStyle.id)!,
    styleRevisions: [],
  };
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

  it("keeps unchanged saves revision-stable and restores old content as a new child revision", async () => {
    const workflow = await open();
    const original = workflow.snapshot;
    const originalDesign = original.activeStyle.design;
    const originalHead = original.activeStyle.revisionHeadId;
    const saved = await workflow.saveActiveDesign(originalDesign);
    expect(saved.styleRevisions).toHaveLength(1);
    expect(saved.activeStyle.revisionHeadId).toBe(originalHead);

    await workflow.saveActiveDesign({ ...originalDesign, fabric: "#204060" });
    const restored = await workflow.restoreStyleRevision(originalHead!);
    expect(restored.activeStyle.design).toEqual(originalDesign);
    expect(restored.styleRevisions).toHaveLength(3);
    expect(restored.styleRevisions[2]?.parentRevisionId).toBe(restored.styleRevisions[1]?.revisionId);
    expect(restored.activeStyle.revisionHeadId).toBe(restored.styleRevisions[2]?.revisionId);
  });

  it("skips an identical field-history event without rewriting its append-only row", async () => {
    const workflow = await open();
    const payload = recoveryPayload();
    const changedInput = { recipeId: "tee", inputKind: "measurement" as const, inputKey: "chest" };
    await workflow.recordFieldHistory(STYLE_ID, payload, changedInput);
    const afterFirstInput = workflow.snapshot.fieldObservations.find((record) => record.styleId === STYLE_ID)!;
    await workflow.recordFieldHistory(STYLE_ID, payload, changedInput);
    expect(workflow.snapshot.fieldObservations.find((record) => record.styleId === STYLE_ID)).toBe(afterFirstInput);
  });

  it("verifies every retained revision against the actual source artwork before exposing or reloading it", async () => {
    const assetId = "local-1234567890abcdef1234567890abcdef-svg";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
    const records = new Map<string, StoredArtworkAsset>([[assetId, {
      assetId, name: "mark.svg", mimeType: "image/svg+xml", blob: new NodeBlob([svg], { type: "image/svg+xml" }) as unknown as Blob,
    }]]);
    const artworkStore: ArtworkAssetStore = {
      put: async (asset) => { records.set(asset.assetId, asset); },
      get: async (id) => records.get(id) ?? null,
      remove: async (id) => { records.delete(id); },
    };
    const workflow = await open({}, { artworkStore });
    const design = workflow.snapshot.activeStyle.design;
    const surface = {
      ...design.surface,
      "tee/Untitled tee": { styleName: "Untitled tee", placements: [{
        id: "front-mark", kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Studio mark", assetId,
      }] },
    } as typeof design.surface;
    await workflow.saveActiveDesign({ ...design, surface });
    await workflow.saveActiveDesign({ ...workflow.snapshot.activeStyle.design, fabric: "#204060" });
    const captured = workflow.snapshot.styleRevisions.find((revision) => revision.payload.artwork.length > 0);
    expect(captured?.payload.artwork).toHaveLength(1);
    expect(workflow.snapshot.styleRevisions.filter((revision) => revision.payload.artwork.length > 0)).toHaveLength(2);

    records.set(assetId, { assetId, name: "mark.svg", mimeType: "image/svg+xml", blob: new NodeBlob([`${svg} `], { type: "image/svg+xml" }) as unknown as Blob });
    await expect(workflow.restoreStyleRevision(captured!.revisionId)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("source artwork has changed or is unavailable"),
    });
    await expect(workflow.reload()).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("source artwork captured by style revision"),
    });
  });

  it("pins bundled artwork from its catalog and rejects unknown artwork IDs", async () => {
    const workflow = await open();
    const design = workflow.snapshot.activeStyle.design;
    const bundled = ARTWORK_CATALOG[0];
    const placements = [{
      id: "catalog-mark", kind: "print" as const, pieceRole: "body-front" as const, widthCm: 4, heightCm: 3,
      transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Catalog mark", assetId: bundled.assetId,
    }];
    const surface = {
      ...design.surface,
      "tee/Untitled tee": { styleName: "Untitled tee", placements },
    } as typeof design.surface;
    await workflow.saveActiveDesign({ ...design, surface });
    expect(workflow.snapshot.styleRevisions[workflow.snapshot.styleRevisions.length - 1]?.payload.artwork).toEqual([{
      assetId: bundled.assetId,
      mimeType: bundled.image.mimeType,
      byteLength: bundled.image.byteLength,
      sha256: bundled.image.sha256,
    }]);

    const unknown = {
      ...design.surface,
      "tee/Untitled tee": { styleName: "Untitled tee", placements: [{ ...placements[0], assetId: "unregistered-artwork" }] },
    } as typeof design.surface;
    await expect(workflow.saveActiveDesign({ ...design, surface: unknown })).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("cannot verify artwork unregistered-artwork"),
    });
  });

  it("fails closed when local source artwork storage is unavailable or its file is missing", async () => {
    const assetId = "local-1234567890abcdef1234567890abcdef-svg";
    const workflow = await open();
    const design = workflow.snapshot.activeStyle.design;
    const surface = {
      ...design.surface,
      "tee/Untitled tee": { styleName: "Untitled tee", placements: [{
        id: "missing-local", kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Missing mark", assetId,
      }] },
    } as typeof design.surface;
    await expect(workflow.saveActiveDesign({ ...design, surface })).rejects.toMatchObject({
      code: "unavailable",
      message: expect.stringContaining("local artwork storage is unavailable"),
    });

    const missingStore: ArtworkAssetStore = {
      put: async () => undefined,
      get: async () => null,
      remove: async () => undefined,
    };
    const withStore = await open({}, { artworkStore: missingStore });
    await expect(withStore.saveActiveDesign({ ...withStore.snapshot.activeStyle.design, surface })).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("referenced artwork local-1234567890abcdef1234567890abcdef-svg is missing"),
    });
  });

  it("skips malformed legacy surface entries while deriving artwork references", async () => {
    const workflow = await open();
    const design = workflow.snapshot.activeStyle.design;
    const malformed = { ...design.surface, legacyEmptySurface: null } as unknown as typeof design.surface;
    await expect(workflow.saveActiveDesign({ ...design, surface: malformed })).rejects.toThrow("Style revision failed strict validation");
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

  it("retries legacy revision-head seeding after a concurrent writer commits an unseeded project", async () => {
    const winner = await open();
    const unseeded = withoutRevisionHeads(winner.snapshot);
    const repository = {
      readActiveProject: vi.fn().mockResolvedValueOnce(unseeded).mockResolvedValueOnce(winner.snapshot),
      listProjects: vi.fn().mockResolvedValue([{ project: unseeded.project }]),
      loadProject: vi.fn()
        .mockResolvedValueOnce(unseeded)
        .mockResolvedValueOnce(unseeded)
        .mockResolvedValueOnce(winner.snapshot),
      saveProjectBundle: vi.fn()
        .mockRejectedValueOnce(new ProjectRepositoryError("conflict", "another tab initialized revision heads"))
        .mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    const recovered = await openProjectWorkflow({
      openRepository: async () => repository,
      now: () => TIME,
      revisionIdFactory: ids("2d5a56e2-6f48-4aef-9a01-5d36350a39c0"),
    });
    workflows.push(recovered);

    expect(repository.saveProjectBundle).toHaveBeenCalledTimes(2);
    expect(recovered.snapshot.activeStyle.revisionHeadId).toBe(winner.snapshot.activeStyle.revisionHeadId);
  });

  it("preserves already-seeded styles when migrating one legacy style in a mixed project", async () => {
    const winner = await open();
    await winner.createStyle("Second style", winner.snapshot.activeStyle.design);
    const seeded = winner.snapshot;
    const legacyStyleId = seeded.styles[0].id;
    const styles = seeded.styles.map((style) => style.id === legacyStyleId
      ? { ...style, revision: 1, revisionHeadId: null }
      : style);
    const partiallySeeded: LoadedProject = {
      ...seeded,
      project: { ...seeded.project, revision: seeded.project.revision - 1 },
      styles,
      activeStyle: styles.find((style) => style.id === seeded.activeStyle.id)!,
      styleRevisions: seeded.styleRevisions.filter((revision) => revision.styleId !== legacyStyleId),
    };
    const repository = {
      readActiveProject: vi.fn().mockResolvedValueOnce(partiallySeeded).mockResolvedValueOnce(seeded),
      listProjects: vi.fn().mockResolvedValue([{ project: partiallySeeded.project }]),
      loadProject: vi.fn().mockResolvedValueOnce(partiallySeeded).mockResolvedValueOnce(seeded),
      saveProjectBundle: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    const migrated = await openProjectWorkflow({ openRepository: async () => repository, now: () => TIME });
    workflows.push(migrated);

    expect(repository.saveProjectBundle).toHaveBeenCalledOnce();
    expect(migrated.snapshot.styles.every((style) => style.revisionHeadId !== null)).toBe(true);
  });

  it("fails closed when legacy revision seeding loses its project, observations, or conflict winner", async () => {
    const winner = await open();
    const unseeded = withoutRevisionHeads(winner.snapshot);
    const baseRepository = {
      readActiveProject: vi.fn().mockResolvedValue(unseeded),
      listProjects: vi.fn().mockResolvedValue([{ project: unseeded.project }]),
      loadProject: vi.fn(),
      saveProjectBundle: vi.fn(),
      close: vi.fn(),
    };

    const missingObservations = {
      ...baseRepository,
      loadProject: vi.fn().mockResolvedValueOnce({ ...unseeded, fieldObservations: [] }),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({ openRepository: async () => missingObservations, now: () => TIME }))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("no field-history record") });
    expect(missingObservations.close).toHaveBeenCalledOnce();

    const disappeared = {
      ...baseRepository,
      loadProject: vi.fn().mockResolvedValueOnce(unseeded).mockResolvedValueOnce(null),
      saveProjectBundle: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({ openRepository: async () => disappeared, now: () => TIME }))
      .rejects.toMatchObject({ code: "not-found", message: expect.stringContaining("disappeared while its immutable history was initialized") });

    const conflict = new ProjectRepositoryError("conflict", "another tab initialized revision heads");
    const noWinner = {
      ...baseRepository,
      saveProjectBundle: vi.fn().mockRejectedValueOnce(conflict),
      loadProject: vi.fn().mockResolvedValueOnce(unseeded).mockResolvedValueOnce(null),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({ openRepository: async () => noWinner, now: () => TIME }))
      .rejects.toMatchObject({ code: "not-found", message: expect.stringContaining("disappeared during revision initialization") });

    const failedSave = {
      ...baseRepository,
      saveProjectBundle: vi.fn().mockRejectedValueOnce(new ProjectRepositoryError("transaction", "write failed")),
      loadProject: vi.fn().mockResolvedValueOnce(unseeded),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({ openRepository: async () => failedSave, now: () => TIME }))
      .rejects.toMatchObject({ code: "transaction", message: "write failed" });
  });

  it("does not expose a project that disappears after revision initialization", async () => {
    const winner = await open();
    const repository = {
      readActiveProject: vi.fn().mockResolvedValueOnce(winner.snapshot).mockResolvedValueOnce(null),
      listProjects: vi.fn().mockResolvedValue([]),
      close: vi.fn(),
    } as unknown as ProjectRepository;
    await expect(openProjectWorkflow({ openRepository: async () => repository, now: () => TIME }))
      .rejects.toMatchObject({ code: "not-found", message: expect.stringContaining("finished without an active style") });
    expect(repository.close).toHaveBeenCalledOnce();
  });

  it.each(["already seeded", "still unseeded"] as const)(
    "reload recovers a concurrent revision initialization conflict when the winner is %s",
    async (winnerState) => {
      const workflow = await open();
      const unseeded = withoutRevisionHeads(workflow.snapshot);
      const conflict = new ProjectRepositoryError("conflict", "another tab initialized revision heads");
      vi.spyOn(workflow.repository, "readActiveProject").mockResolvedValue(unseeded);
      const save = vi.spyOn(workflow.repository, "saveProjectBundle")
        .mockRejectedValueOnce(conflict)
        .mockResolvedValue(workflow.snapshot.project);
      const load = vi.spyOn(workflow.repository, "loadProject");
      if (winnerState === "already seeded") load.mockResolvedValueOnce(workflow.snapshot);
      else load.mockResolvedValueOnce(unseeded).mockResolvedValueOnce(workflow.snapshot);

      const recovered = await workflow.reload();

      expect(save).toHaveBeenCalledTimes(winnerState === "already seeded" ? 1 : 2);
      expect(recovered.activeStyle.revisionHeadId).toBe(workflow.snapshot.activeStyle.revisionHeadId);
    },
  );

  it.each(["write failure", "missing concurrent project"] as const)(
    "propagates a revision-head retry %s during reload",
    async (failure) => {
      const workflow = await open();
      const unseeded = withoutRevisionHeads(workflow.snapshot);
      vi.spyOn(workflow.repository, "readActiveProject").mockResolvedValue(unseeded);
      const save = vi.spyOn(workflow.repository, "saveProjectBundle");
      const load = vi.spyOn(workflow.repository, "loadProject");
      if (failure === "write failure") {
        save.mockRejectedValueOnce(new ProjectRepositoryError("transaction", "revision write failed"));
        await expect(workflow.reload()).rejects.toMatchObject({ code: "transaction", message: "revision write failed" });
      } else {
        save.mockRejectedValueOnce(new ProjectRepositoryError("conflict", "another tab initialized revision heads"));
        load.mockResolvedValueOnce(null);
        await expect(workflow.reload()).rejects.toMatchObject({ code: "not-found", message: expect.stringContaining("disappeared during revision initialization") });
      }
    },
  );

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

  it("atomically persists the exact invalid raw field value and append-only observation across reload", async () => {
    const workflow = await open();
    const base = recoveryPayload();
    const payload: RecoveryPayload = {
      ...base,
      measurements: { ...base.measurements, chest: 9999 },
      rawMeasurements: { ...base.rawMeasurements, chest: "9999" },
    };
    await workflow.recordFieldHistory(STYLE_ID, payload, {
      recipeId: "tee", inputKind: "measurement", inputKey: "chest",
    });

    const definition = getFieldDefinition("tee", "chest")!;
    const current = currentFieldObservation(
      workflow.snapshot.fieldObservations.find((record) => record.styleId === STYLE_ID), definition,
    );
    expect(current).toMatchObject({
      rawValue: "9999",
      canonicalValue: 9999,
      provenance: "USER_CAPTURED",
      validationStatus: "INVALID",
      evidenceStatus: "UNCONFIRMED",
      confidence: "NOT_ASSESSED",
    });
    expect(workflow.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("9999");

    const reloaded = await workflow.reload();
    expect(currentFieldObservation(
      reloaded.fieldObservations.find((record) => record.styleId === STYLE_ID), definition,
    )).toMatchObject({ rawValue: "9999", canonicalValue: 9999, validationStatus: "INVALID" });
    expect(reloaded.activeRecovery?.payload.rawMeasurements.chest).toBe("9999");
  });

  it("rejects field history and saved-design updates when the active style identity or history is absent", async () => {
    const workflow = await open();
    const changedInput = { recipeId: "tee", inputKind: "measurement" as const, inputKey: "chest" };
    await expect(workflow.recordFieldHistory(STYLE_TWO_ID, recoveryPayload(), changedInput))
      .rejects.toMatchObject({ code: "conflict" });

    const state = workflow as unknown as { loaded: typeof workflow.snapshot };
    state.loaded = { ...workflow.snapshot, fieldObservations: [] };
    await expect(workflow.recordFieldHistory(STYLE_ID, recoveryPayload(), changedInput))
      .rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.saveActiveDesign(workflow.snapshot.activeStyle.design))
      .rejects.toMatchObject({ code: "invalid-data" });
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
    const editedSecond = await workflow.saveActiveDesign({ ...second.activeStyle.design, fabric: "#204060" });
    expect(editedSecond.styles.find((style) => style.id === STYLE_TWO_ID)?.design.fabric).toBe("#204060");
    expect(editedSecond.styles.find((style) => style.id === STYLE_ID)?.design.fabric).toBe("#204060");
    expect(await workflow.switchProject(PROJECT_ID)).toBe(editedSecond);
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

  it("switches to a separate local project and seeds its missing revision head", async () => {
    const workflow = await open();
    const migrated = migrateLegacySaveFile({
      json: serialize(STANDARD_M, "#204060"),
      projectId: OTHER_PROJECT_ID,
      styleId: STYLE_THREE_ID,
      migratedAt: NEXT_TIME,
      projectName: "Separate local project",
    });
    if (!migrated.ok) throw new Error(migrated.error);
    await workflow.repository.saveProjectBundle({
      project: migrated.value.project,
      styles: [migrated.value.style],
      fieldObservations: [createFieldObservationRecord(migrated.value.style, NEXT_TIME, "existing-local-style")],
      expectedProjectRevision: null,
    });

    const switched = await workflow.switchProject(OTHER_PROJECT_ID);
    expect(switched.project.id).toBe(OTHER_PROJECT_ID);
    expect(switched.activeStyle.id).toBe(STYLE_THREE_ID);
    expect(switched.activeStyle.revisionHeadId).toBe(switched.styleRevisions[0]?.revisionId);
    expect(switched.styleRevisions).toHaveLength(1);
  });

  it("compares leaf paths when nested recipe options are first added or removed", async () => {
    const workflow = await open();
    try {
      const baseline = workflow.snapshot.activeStyle;
      const baselineRevisionId = baseline.revisionHeadId!;
      const wovenWorkspace = {
        ...baseline.design.workspace,
        garment: "woven-shirt",
        targetStyle: "Relaxed woven shirt",
        stretchFabric: "Cotton woven",
      };
      await workflow.saveActiveDesign({
        ...baseline.design,
        workspace: wovenWorkspace,
        garmentOptions: { ...baseline.design.garmentOptions, "woven-shirt": {} },
      });
      const emptyWovenRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      expect(workflow.compareStyleRevisions(baselineRevisionId, emptyWovenRevisionId))
        .toContain("design.garmentOptions.woven-shirt");

      await workflow.saveActiveDesign({
        ...workflow.snapshot.activeStyle.design,
        garmentOptions: { ...workflow.snapshot.activeStyle.design.garmentOptions, "woven-shirt": { hemTurn: 2 } },
      });
      const hemRevisionId = workflow.snapshot.activeStyle.revisionHeadId!;
      expect(workflow.compareStyleRevisions(emptyWovenRevisionId, hemRevisionId))
        .toContain("design.garmentOptions.woven-shirt.hemTurn");
      expect(workflow.compareStyleRevisions(hemRevisionId, emptyWovenRevisionId))
        .toContain("design.garmentOptions.woven-shirt.hemTurn");
    } finally {
      workflow.close();
    }
  });

  it("preserves nested and root markers when revision payload shapes differ", async () => {
    expect(changedPaths({ options: {} }, { options: { newOption: { hemTurn: 2 } } }))
      .toEqual(["options.newOption.hemTurn"]);
    expect(changedPaths(undefined, { hemTurn: 2 })).toEqual(["hemTurn"]);
    expect(changedPaths(undefined, {})).toEqual(["$design"]);
    expect(changedPaths(null, { fabric: "#ffffff" })).toEqual(["$design"]);

    const workflow = await open();
    const base = workflow.snapshot.styleRevisions[0];
    await workflow.saveActiveDesign({
      ...workflow.snapshot.activeStyle.design,
      garmentOptions: { ...workflow.snapshot.activeStyle.design.garmentOptions, "woven-shirt": { hemTurn: 2 } },
    });
    const child = workflow.snapshot.styleRevisions.find((revision) => revision.parentRevisionId === base.revisionId)!;
    expect(workflow.compareStyleRevisions(base.revisionId, child.revisionId))
      .toContain("design.garmentOptions.woven-shirt.hemTurn");

    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...workflow.snapshot,
      styleRevisions: workflow.snapshot.styleRevisions.map((revision) => revision.revisionId === base.revisionId
        ? { ...revision, payload: { ...revision.payload, design: { ...revision.payload.design, garmentOptions: {} } } }
        : revision.revisionId === child.revisionId
          ? { ...revision, payload: { ...revision.payload, design: {
            ...revision.payload.design,
            garmentOptions: { "new-option": { hemTurn: 2 } } as typeof revision.payload.design.garmentOptions,
          } } }
          : revision),
    };
    expect(workflow.compareStyleRevisions(base.revisionId, child.revisionId)).toContain("design.garmentOptions.new-option.hemTurn");

    internals.loaded = {
      ...workflow.snapshot,
      styleRevisions: workflow.snapshot.styleRevisions.map((revision) => revision.revisionId === base.revisionId
        ? { ...revision, payload: { ...revision.payload, design: undefined as unknown as typeof revision.payload.design } }
        : revision.revisionId === child.revisionId
          ? { ...revision, payload: { ...revision.payload, design: {} as typeof revision.payload.design } }
          : revision),
    };
    expect(workflow.compareStyleRevisions(base.revisionId, child.revisionId)).toContain("design.$design");

    internals.loaded = {
      ...workflow.snapshot,
      styleRevisions: workflow.snapshot.styleRevisions.map((revision) => revision.revisionId === base.revisionId
        ? { ...revision, payload: { ...revision.payload, design: null as unknown as typeof revision.payload.design } }
        : revision.revisionId === child.revisionId
          ? { ...revision, payload: { ...revision.payload, design: { fabric: "#ffffff" } as typeof revision.payload.design } }
          : revision),
    };
    expect(workflow.compareStyleRevisions(base.revisionId, child.revisionId)).toContain("design.$design");
  });

  it("rejects stale output captures and verifies every historical artifact before download", async () => {
    const workflow = await open();
    const revisionId = workflow.snapshot.activeStyle.revisionHeadId!;
    await expect(workflow.freezeOutputs([], [], [], "00000000-0000-4000-8000-000000000000"))
      .rejects.toMatchObject({ code: "conflict" });
    await expect(workflow.readFrozenArtifact("missing-manifest", "selected-size-svg"))
      .rejects.toMatchObject({ code: "invalid-data" });

    const artifacts = [
      ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
      ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
      ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
    ] as const;
    const manifest = await workflow.freezeOutputs(artifacts.map(([artifactId, extension]) => ({
      artifactId,
      extension,
      displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `captured:${artifactId}`,
    })), [{ sizeId: "tee-step-1", label: "M" }], ["Digital only."], revisionId);
    await expect(workflow.readFrozenArtifact(manifest.manifestId, "missing-artifact"))
      .rejects.toMatchObject({ code: "not-found" });
    await expect(workflow.readFrozenArtifact(manifest.manifestId, "selected-size-svg"))
      .resolves.toMatchObject({ manifest: { manifestId: manifest.manifestId }, artifact: { artifactId: "selected-size-svg" } });

    const internals = workflow as unknown as { loaded: typeof workflow.snapshot };
    internals.loaded = {
      ...workflow.snapshot,
      exportManifests: workflow.snapshot.exportManifests.map((candidate) => candidate.manifestId === manifest.manifestId
        ? { ...candidate, artifacts: candidate.artifacts.map((artifact) => artifact.artifactId === "selected-size-svg"
          ? { ...artifact, bytes: new Blob(["changed:captured:size-svg"], { type: artifact.mediaType }) }
          : artifact) }
        : candidate),
    };
    await expect(workflow.readFrozenArtifact(manifest.manifestId, "selected-size-svg"))
      .rejects.toMatchObject({ code: "invalid-data" });
  });

  it("blocks edits and revision comparisons when the saved immutable head is missing", async () => {
    const workflow = await open();
    const revisionId = workflow.snapshot.activeStyle.revisionHeadId!;
    expect(() => workflow.compareStyleRevisions("missing-left", revisionId)).toThrow(ProjectRepositoryError);
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...workflow.snapshot,
      activeStyle: { ...workflow.snapshot.activeStyle, revisionHeadId: null },
      styles: workflow.snapshot.styles.map((style) => style.id === workflow.snapshot.activeStyle.id
        ? { ...style, revisionHeadId: null }
        : style),
    };
    await expect(workflow.saveActiveDesign({ ...workflow.snapshot.activeStyle.design, fabric: "#223344" }))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("no verified immutable revision head") });
  });

  it("reports a committed capture missing from the repository reload instead of presenting it", async () => {
    const workflow = await open();
    const revisionId = workflow.snapshot.activeStyle.revisionHeadId!;
    const artifacts = [
      ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
      ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
      ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
    ] as const;
    vi.spyOn(workflow.repository, "saveProjectBundle").mockResolvedValue(workflow.snapshot.project);
    await expect(workflow.freezeOutputs(artifacts.map(([artifactId, extension]) => ({
      artifactId,
      extension,
      displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `captured:${artifactId}`,
    })), [{ sizeId: "tee-step-1", label: "M" }], ["Digital only."], revisionId))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("not present after its atomic save") });
  });

  it("rejects missing or corrupted immutable revisions before restore", async () => {
    const workflow = await open();
    const revision = workflow.snapshot.styleRevisions.find((candidate) => candidate.revisionId === workflow.snapshot.activeStyle.revisionHeadId)!;
    await expect(workflow.restoreStyleRevision("missing-revision-id"))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("missing or failed its integrity check") });
    const internals = workflow as unknown as { loaded: typeof workflow.snapshot };
    internals.loaded = {
      ...workflow.snapshot,
      styleRevisions: workflow.snapshot.styleRevisions.map((candidate) => candidate.revisionId === revision.revisionId
        ? { ...candidate, revisionContentDigest: "0".repeat(64) }
        : candidate),
    };
    await expect(workflow.restoreStyleRevision(revision.revisionId))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("missing or failed its integrity check") });
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
