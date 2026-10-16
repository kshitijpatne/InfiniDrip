import { webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import {
  CUSTOM_STYLE_RECORD_VERSION,
  migrateLegacyRecovery,
  migrateLegacySaveFile,
  type MeasurementCaptureDraft,
  type RecoveryPayload,
} from "./project-records";
import {
  addCaptureReadingForField,
  createMeasurementCaptureSession,
  selectCaptureReading,
  type NewCaptureReading,
} from "./measurement-capture";
import { ProjectRepositoryError, type LoadedProject, type ProjectRepository } from "./project-repository";
import { changedPaths, openProjectWorkflow, ProjectWorkflow } from "./project-workflow";
import { approveGradePlan, createGradePlanDraft, reviewGradePlan, updateGradePlanDraft } from "./grade-plan";
import { createGradePlanContext } from "./grade-plan-context";
import { createFieldObservationRecord, currentFieldObservation, getCaptureFieldDefinitions, getFieldDefinition } from "./field-provenance";
import { materializeCustomSizeDesign } from "./custom-size-materialization";
import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";
import { GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION, jcsSha256Hex, verifyFrozenOutputManifest } from "./style-revisions";
import { parseTechPackRecord, type TechPackRecord } from "./tech-pack-records";
import { TECH_PACK_SHARE_ARTIFACTS } from "./tech-pack-sharing";
import { parseTechPackPomRecordSet } from "./tech-pack-sample-qa-records";

const cryptoApi = webcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const NEXT_TIME = "2026-09-24T16:00:01.000Z";
const AFTER_TIME = "2026-09-24T16:00:02.000Z";
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

function capturedTechPackText(
  field: TechPackRecord["cover"]["styleCode"],
  value: string,
): TechPackRecord["cover"]["styleCode"] {
  return {
    ...field,
    value,
    provenance: "USER_CAPTURED",
    evidenceStatus: "USER_CONFIRMED",
    validationStatus: "VALID",
    method: "entered in the local tech-pack editor",
    capturedBy: "S767 test user",
    capturedAt: NEXT_TIME,
    unresolvedReason: null,
    nextAction: null,
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
    expect(workflow.initializedFirstRun).toBe(true);
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
    const originalTechPack = original.activeStyle.techPack;
    const saved = await workflow.saveActiveDesign(originalDesign);
    expect(saved.styleRevisions).toHaveLength(1);
    expect(saved.activeStyle.revisionHeadId).toBe(originalHead);
    expect(saved.activeStyle.techPack).toEqual(originalTechPack);

    await workflow.saveActiveDesign({ ...originalDesign, fabric: "#204060" });
    const revisedTechPack = workflow.snapshot.activeStyle.techPack;
    expect({ ...revisedTechPack, revisionId: originalTechPack.revisionId, revisionNumber: originalTechPack.revisionNumber })
      .toEqual(originalTechPack);
    expect(revisedTechPack.revisionId).toBe(workflow.snapshot.activeStyle.revisionHeadId);
    expect(revisedTechPack.revisionNumber).toBe(2);
    const restored = await workflow.restoreStyleRevision(originalHead!);
    expect(restored.activeStyle.design).toEqual(originalDesign);
    expect(restored.styleRevisions).toHaveLength(3);
    expect(restored.styleRevisions[2]?.parentRevisionId).toBe(restored.styleRevisions[1]?.revisionId);
    expect(restored.activeStyle.revisionHeadId).toBe(restored.styleRevisions[2]?.revisionId);
  });

  it("saves an authored T01 edit as one v2 child, resets review and preserves recovery and frozen bytes", async () => {
    let now = TIME;
    const workflow = await open({}, { now: () => now });
    const originalDesign = workflow.snapshot.activeStyle.design;
    const originalHead = workflow.snapshot.activeStyle.revisionHeadId!;
    await workflow.saveRecovery(STYLE_ID, recoveryPayload());
    now = NEXT_TIME;
    const artifactTypes = [
      ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
      ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
      ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
    ] as const;
    const frozen = await workflow.freezeOutputs(artifactTypes.map(([artifactId, extension]) => ({
      artifactId,
      extension,
      displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `frozen:${artifactId}`,
    })), [{ sizeId: "tee-step-1", label: "M" }], ["Digital output only."], originalHead);
    const before = workflow.snapshot;
    const stored = before.activeStyle.techPack;
    const candidate: TechPackRecord = {
      ...stored,
      cover: { ...stored.cover, styleCode: capturedTechPackText(stored.cover.styleCode, "TP-01") },
      approval: {
        state: "REVIEW",
        revisionId: stored.revisionId,
        scopeFieldIds: [stored.cover.styleCode.fieldId],
        changedBy: "S767 test reviewer",
        changedAt: NEXT_TIME,
        manifestId: null,
      },
    };
    now = AFTER_TIME;

    const saved = await workflow.saveActiveTechPack(candidate);

    const appended = saved.styleRevisions.filter((revision) => revision.parentRevisionId === originalHead);
    expect(saved.styleRevisions).toHaveLength(before.styleRevisions.length + 1);
    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({
      revisionId: saved.activeStyle.revisionHeadId,
      revisionNumber: stored.revisionNumber + 1,
      parentRevisionId: originalHead,
      payload: {
        payloadVersion: 2,
        design: originalDesign,
        techPack: {
          ...candidate,
          revisionId: saved.activeStyle.revisionHeadId,
          revisionNumber: stored.revisionNumber + 1,
          updatedAt: AFTER_TIME,
          approval: { state: "DRAFT", revisionId: null, scopeFieldIds: [], changedBy: null, changedAt: null, manifestId: null },
        },
      },
    });
    expect(saved.activeStyle.design).toEqual(originalDesign);
    expect(saved.activeStyle.techPack.approval.state).toBe("DRAFT");
    expect(saved.activeStyle.techPack.revisionId).toBe(saved.activeStyle.revisionHeadId);
    expect(saved.activeStyle.techPack.cover.styleCode.value).toBe("TP-01");
    expect(saved.activeRecovery).toEqual(before.activeRecovery);
    expect(saved.exportManifests.find((manifest) => manifest.manifestId === frozen.manifestId)?.revisionId)
      .toBe(originalHead);
    expect(frozen.revisionId).toBe(originalHead);
    const frozenArtifact = await workflow.readFrozenArtifact(frozen.manifestId, "selected-size-svg");
    expect(await frozenArtifact.artifact.bytes.text()).toBe("frozen:selected-size-svg");
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "conflict",
      message: expect.stringContaining("older style revision"),
    });
  });

  it("persists T02 definitions and actual readings against an existing revision without changing predictions", async () => {
    const workflow = await open();
    const before = workflow.snapshot;
    const targetRevisionId = before.activeStyle.revisionHeadId!;
    const pomData = parseTechPackPomRecordSet({
      schemaVersion: 1,
      definitions: {
        schemaVersion: 1,
        recipeId: "tee",
        definitions: [{
          id: "finished.chest",
          label: "Finished chest width",
          method: { status: "SOURCE_CONFIRMED", value: { kind: "STRAIGHT_LINE", instructions: "Measure flat at the cited landmarks." }, source: { uri: "docs/research/pom.md", title: "Reviewed POM", locator: "Table 1" } },
          landmarks: { status: "SOURCE_CONFIRMED", value: [{ id: "side.chest", label: "Side seam at chest level" }], source: { uri: "docs/research/pom.md", title: "Reviewed POM", locator: "Table 1" } },
          unit: "cm",
          tolerance: { status: "UNRESOLVED", value: null, unresolvedReason: "No reviewed source establishes tolerance.", nextAction: "Review a source before entering tolerance." },
          sizeRangeSource: { status: "UNRESOLVED", value: null, unresolvedReason: "No reviewed size chart is attached.", nextAction: "Attach a sourced size range." },
          gradeRuleSource: { status: "UNRESOLVED", value: null, unresolvedReason: "No reviewed grade rule is attached.", nextAction: "Attach a versioned grade rule." },
        }],
      },
      sampleQaRounds: [{
        id: "20000000-0000-4000-8000-000000000003",
        targetRevisionId,
        targetRevisionNumber: 1,
        sampleLabel: "Proto A",
        sampleSizeId: "M",
        recordedAt: TIME,
        recordedBy: "Local reviewer",
        readings: [{
          pomDefinitionId: "finished.chest",
          status: "MEASURED",
          actualValue: 52.25,
          unit: "cm",
          method: "Tape across the finished flat garment at the listed landmark.",
          evidenceRefs: ["local-note-1"],
          unresolvedReason: null,
          nextAction: null,
        }],
        qaObservations: [],
      }],
    }, "tee");
    expect(pomData.ok).toBe(true);
    if (!pomData.ok) return;
    const candidate: TechPackRecord = {
      ...before.activeStyle.techPack,
      schemaVersion: 2,
      pomData: pomData.value,
    };

    const saved = await workflow.saveActiveTechPack(candidate);
    const head = saved.styleRevisions.find((revision) => revision.revisionId === saved.activeStyle.revisionHeadId)!;
    expect(saved.activeStyle.techPack.schemaVersion).toBe(2);
    expect(head.payload.payloadVersion).toBe(2);
    if (head.payload.payloadVersion === 2) {
      expect(head.payload.techPack.pomData?.sampleQaRounds[0]?.targetRevisionId).toBe(targetRevisionId);
      expect(head.payload.techPack.pomData?.sampleQaRounds[0]?.readings[0]?.actualValue).toBe(52.25);
      expect(head.payload.techPack.pomData?.sampleQaRounds[0]?.readings[0]).not.toHaveProperty("predictedValue");
    }
    expect(saved.activeStyle.revisionHeadId).not.toBe(targetRevisionId);

    const invalidTarget = {
      ...saved.activeStyle.techPack,
      pomData: {
        ...pomData.value,
        sampleQaRounds: pomData.value.sampleQaRounds.map((round) => ({
          ...round,
          targetRevisionId: "99999999-9999-4999-8999-999999999999",
        })),
      },
    } as TechPackRecord;
    const beforeInvalidSave = await workflow.repository.readProjectBundle(PROJECT_ID);
    await expect(workflow.saveActiveTechPack(invalidTarget)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("existing revision in this style's immutable history"),
    });
    await expect(workflow.repository.readProjectBundle(PROJECT_ID)).resolves.toEqual(beforeInvalidSave);
  });

  it("rejects stale T01 compare-and-swap without partially changing any stored project rows", async () => {
    const settings = { ...repositoryOptions(), storage: storage(), idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID), now: () => TIME };
    const editorTab = await openProjectWorkflow(settings);
    workflows.push(editorTab);
    const otherTab = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(otherTab);
    const base = editorTab.snapshot.activeStyle.techPack;
    const staleCandidate: TechPackRecord = {
      ...base,
      cover: { ...base.cover, styleCode: capturedTechPackText(base.cover.styleCode, "STALE-TP") },
    };
    await otherTab.saveActiveDesign({ ...otherTab.snapshot.activeStyle.design, fabric: "#204060" });
    const beforeRejectedSave = await editorTab.repository.readProjectBundle(PROJECT_ID);
    await expect(editorTab.saveActiveTechPack(staleCandidate)).rejects.toMatchObject({ code: "conflict" });
    const afterRejectedSave = await editorTab.repository.readProjectBundle(PROJECT_ID);
    expect(afterRejectedSave).toEqual(beforeRejectedSave);
  });

  it("validates T01 identity and authored records before making any revision write", async () => {
    const workflow = await open();
    const stored = workflow.snapshot.activeStyle.techPack;
    const base: TechPackRecord = {
      ...stored,
      cover: { ...stored.cover, styleCode: capturedTechPackText(stored.cover.styleCode, "TP-02") },
    };
    const mismatchedIdentity: TechPackRecord = { ...base, styleId: STYLE_TWO_ID };
    const mismatchedHead: TechPackRecord = { ...base, revisionId: "00000000-0000-4000-8000-000000000099" };
    const mismatchedNumber: TechPackRecord = { ...base, revisionNumber: base.revisionNumber + 1 };
    const mismatchedRecipe: TechPackRecord = { ...base, recipeId: "skirt" };
    const mismatchedVersion: TechPackRecord = { ...base, recipeVersion: "another-unverified-version" };
    const mismatchedCreated: TechPackRecord = { ...base, createdAt: "2026-09-24T15:00:00.000Z" };
    const invalidRecord: TechPackRecord = {
      ...base,
      cover: { ...base.cover, styleName: { ...base.cover.styleName, fieldId: base.cover.styleCode.fieldId } },
    };
    const staleCandidates = [
      mismatchedIdentity, mismatchedHead, mismatchedNumber, mismatchedRecipe,
      mismatchedVersion, mismatchedCreated,
    ];
    const before = await workflow.repository.readProjectBundle(PROJECT_ID);
    for (const candidate of staleCandidates) {
      await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({ code: "conflict" });
    }
    await expect(workflow.saveActiveTechPack(invalidRecord)).rejects.toMatchObject({ code: "invalid-data" });
    const after = await workflow.repository.readProjectBundle(PROJECT_ID);
    expect(after).toEqual(before);
  });

  it("rejects an active T01 edit with missing field history before saving", async () => {
    const workflow = await open();
    const base = workflow.snapshot;
    const candidate: TechPackRecord = {
      ...base.activeStyle.techPack,
      cover: {
        ...base.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(base.activeStyle.techPack.cover.styleCode, "TP-06"),
      },
    };
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = { ...base, fieldObservations: [] };
    const before = await workflow.repository.readProjectBundle(PROJECT_ID);
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("no field history record"),
    });
    expect(await workflow.repository.readProjectBundle(PROJECT_ID)).toEqual(before);
  });

  it("saves T01 on the active style without replacing any other style in the project", async () => {
    const workflow = await open();
    const originalFirst = workflow.snapshot.activeStyle;
    await workflow.createStyle("Second tee style", originalFirst.design);
    await workflow.switchStyle(STYLE_ID);
    const base = workflow.snapshot;
    const candidate: TechPackRecord = {
      ...base.activeStyle.techPack,
      cover: {
        ...base.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(base.activeStyle.techPack.cover.styleCode, "TP-07"),
      },
    };

    const saved = await workflow.saveActiveTechPack(candidate);

    expect(saved.styles).toHaveLength(2);
    expect(saved.styles.find((style) => style.id === STYLE_TWO_ID)).toEqual(base.styles.find((style) => style.id === STYLE_TWO_ID));
    expect(saved.styles.find((style) => style.id === STYLE_ID)?.techPack.cover.styleCode.value).toBe("TP-07");
  });

  it("rejects T01 saves when the active style is archived or its immutable head is missing", async () => {
    const workflow = await open();
    const validCandidate: TechPackRecord = {
      ...workflow.snapshot.activeStyle.techPack,
      cover: {
        ...workflow.snapshot.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(workflow.snapshot.activeStyle.techPack.cover.styleCode, "TP-03"),
      },
    };
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...workflow.snapshot,
      activeStyle: { ...workflow.snapshot.activeStyle, archivedAt: TIME },
    };
    await expect(workflow.saveActiveTechPack(validCandidate)).rejects.toMatchObject({ code: "invalid-data" });
    const current = workflow.snapshot;
    const missingHeadStyle = {
      ...current.activeStyle,
      archivedAt: null,
      revisionHeadId: null,
      techPack: {
        ...current.activeStyle.techPack,
        revisionId: null,
        revisionNumber: 0,
        approval: { state: "DRAFT" as const, revisionId: null, scopeFieldIds: [], changedBy: null, changedAt: null, manifestId: null },
      },
    };
    internals.loaded = {
      ...current,
      activeStyle: missingHeadStyle,
      styles: current.styles.map((style) => style.id === missingHeadStyle.id ? missingHeadStyle : style),
    };
    await expect(workflow.saveActiveTechPack({ ...validCandidate, revisionId: null, revisionNumber: 0 }))
      .rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("matching verified immutable revision head") });
  });

  it("rejects a head owned by another style or carrying a different revision number", async () => {
    const workflow = await open();
    const base = workflow.snapshot;
    const headId = base.activeStyle.revisionHeadId!;
    const candidate: TechPackRecord = {
      ...base.activeStyle.techPack,
      cover: {
        ...base.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(base.activeStyle.techPack.cover.styleCode, "TP-03A"),
      },
    };
    const internals = workflow as unknown as { loaded: LoadedProject };
    const head = base.styleRevisions.find((revision) => revision.revisionId === headId)!;
    internals.loaded = {
      ...base,
      styleRevisions: base.styleRevisions.map((revision) => revision.revisionId === headId
        ? { ...revision, styleId: STYLE_TWO_ID }
        : revision),
    };
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("belongs to another style"),
    });
    internals.loaded = {
      ...base,
      styleRevisions: base.styleRevisions.map((revision) => revision.revisionId === headId
        ? { ...revision, revisionNumber: head.revisionNumber + 1 }
        : revision),
    };
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("matching verified immutable revision head"),
    });
  });

  it("rejects an active style whose live T01 revision or recipe identity is internally inconsistent", async () => {
    const workflow = await open();
    const base = workflow.snapshot;
    const candidate: TechPackRecord = {
      ...base.activeStyle.techPack,
      cover: {
        ...base.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(base.activeStyle.techPack.cover.styleCode, "TP-03C"),
      },
    };
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...base,
      activeStyle: {
        ...base.activeStyle,
        techPack: { ...base.activeStyle.techPack, revisionId: null, revisionNumber: 0 },
      },
    };
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "conflict",
      message: expect.stringContaining("no longer matches the active style head"),
    });
    internals.loaded = {
      ...base,
      activeStyle: { ...base.activeStyle, recipeId: "skirt" },
    };
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("T01 recipe does not match"),
    });
  });

  it("allows a T01 child to be based on a historical v1 head without retrofitting that parent", async () => {
    const workflow = await open();
    const base = workflow.snapshot;
    const headId = base.activeStyle.revisionHeadId!;
    const head = base.styleRevisions.find((revision) => revision.revisionId === headId)!;
    if (head.payload.payloadVersion !== 2) throw new Error("Expected the test setup to start at a v2 head.");
    const { techPack: _techPack, ...legacyPayload } = head.payload;
    const legacyHead = {
      ...head,
      payload: { ...legacyPayload, payloadVersion: 1 },
    } as typeof head;
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...base,
      styleRevisions: base.styleRevisions.map((revision) => revision.revisionId === headId ? legacyHead : revision),
    };
    const candidate: TechPackRecord = {
      ...base.activeStyle.techPack,
      cover: {
        ...base.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(base.activeStyle.techPack.cover.styleCode, "TP-03B"),
      },
    };

    const saved = await workflow.saveActiveTechPack(candidate);

    expect(saved.styleRevisions.find((revision) => revision.revisionId === headId)?.payload.payloadVersion).toBe(2);
    expect(saved.styleRevisions.filter((revision) => revision.parentRevisionId === headId)).toHaveLength(1);
    expect(saved.activeStyle.techPack.cover.styleCode.value).toBe("TP-03B");
  });

  it("keeps no-op T01 saves stable and rejects a live record that differs from its v2 head", async () => {
    const workflow = await open();
    const before = workflow.snapshot;
    const same = await workflow.saveActiveTechPack(before.activeStyle.techPack);
    expect(same).toBe(before);

    const headId = before.activeStyle.revisionHeadId!;
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...before,
      styleRevisions: before.styleRevisions.map((revision) => revision.revisionId === headId
        && revision.payload.payloadVersion === 2
        ? {
          ...revision,
          payload: {
            ...revision.payload,
            techPack: {
              ...revision.payload.techPack,
              cover: {
                ...revision.payload.techPack.cover,
                styleCode: { ...revision.payload.techPack.cover.styleCode, value: "different head content" },
              },
            },
          },
        }
        : revision),
    };
    const candidate: TechPackRecord = {
      ...before.activeStyle.techPack,
      cover: {
        ...before.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(before.activeStyle.techPack.cover.styleCode, "TP-04"),
      },
    };
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("does not match its immutable revision head"),
    });
  });

  it("reports a purported successful bundle write missing its T01 child", async () => {
    const workflow = await open();
    const candidate: TechPackRecord = {
      ...workflow.snapshot.activeStyle.techPack,
      cover: {
        ...workflow.snapshot.activeStyle.techPack.cover,
        styleCode: capturedTechPackText(workflow.snapshot.activeStyle.techPack.cover.styleCode, "TP-05"),
      },
    };
    const before = await workflow.repository.readProjectBundle(PROJECT_ID);
    vi.spyOn(workflow.repository, "saveProjectBundle").mockResolvedValue(workflow.snapshot.project);
    await expect(workflow.saveActiveTechPack(candidate)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("not present after its atomic save"),
    });
    expect(await workflow.repository.readProjectBundle(PROJECT_ID)).toEqual(before);
  });

  it("commits a T01-only edit as one child revision and keeps same-revision review metadata", async () => {
    const workflow = await open();
    const initial = workflow.snapshot;
    const initialStyle = initial.activeStyle;
    const headId = initialStyle.revisionHeadId!;
    const styleCode = {
      ...initialStyle.techPack.cover.styleCode,
      value: "TP-001",
      provenance: "USER_CAPTURED" as const,
      evidenceStatus: "USER_CONFIRMED" as const,
      validationStatus: "VALID" as const,
      method: "entered from an identified source",
      capturedBy: "fixture maintainer",
      capturedAt: TIME,
      unresolvedReason: null,
      nextAction: null,
    };
    const reviewedPack = {
      ...initialStyle.techPack,
      updatedAt: NEXT_TIME,
      approval: {
        state: "REVIEW" as const,
        revisionId: headId,
        scopeFieldIds: [styleCode.fieldId],
        changedBy: "fixture reviewer",
        changedAt: TIME,
        manifestId: null,
      },
    };
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...initial,
      activeStyle: { ...initialStyle, techPack: reviewedPack },
      styles: initial.styles.map((style) => style.id === initialStyle.id
        ? { ...style, techPack: reviewedPack }
        : style),
    };

    const reviewed = await workflow.saveActiveDesign(initialStyle.design);
    expect(reviewed.styleRevisions).toHaveLength(1);
    expect(reviewed.activeStyle.revisionHeadId).toBe(headId);
    expect(reviewed.activeStyle.techPack.approval).toEqual(reviewedPack.approval);
    expect(reviewed.activeStyle.techPack.updatedAt).toBe(NEXT_TIME);

    const authoredPack = { ...reviewed.activeStyle.techPack, cover: { ...reviewed.activeStyle.techPack.cover, styleCode } };
    internals.loaded = {
      ...reviewed,
      activeStyle: { ...reviewed.activeStyle, techPack: authoredPack },
      styles: reviewed.styles.map((style) => style.id === reviewed.activeStyle.id
        ? { ...style, techPack: authoredPack }
        : style),
    };
    const changed = await workflow.saveActiveDesign(initialStyle.design);
    const newHead = changed.styleRevisions[1]!;
    expect(changed.styleRevisions).toHaveLength(2);
    expect(newHead.parentRevisionId).toBe(headId);
    expect(newHead.payload.payloadVersion).toBe(2);
    if (newHead.payload.payloadVersion !== 2) throw new Error("A new T01 revision must use payload v2.");
    expect(newHead.payload.design).toEqual(initialStyle.design);
    expect(newHead.payload.techPack.cover.styleCode.value).toBe("TP-001");
    expect(changed.activeStyle.revisionHeadId).toBe(newHead.revisionId);
    expect(changed.activeStyle.techPack.revisionId).toBe(newHead.revisionId);
    expect(changed.activeStyle.techPack.approval.state).toBe("DRAFT");
  });

  it("stores scoped review overlays and freezes exact binary Tech Pack bytes against the saved head", async () => {
    const workflow = await open();
    await workflow.createStyle("Secondary freeze fixture", workflow.snapshot.activeStyle.design);
    const initial = workflow.snapshot;
    const revisionId = initial.activeStyle.revisionHeadId!;
    const revision = initial.styleRevisions.find((row) => row.revisionId === revisionId)!;
    const originalRevisionCount = initial.styleRevisions.length;
    const scope = [initial.activeStyle.techPack.cover.styleName.fieldId];

    await expect(workflow.beginActiveTechPackReview("Reviewer", scope, "33333333-3333-4333-8333-333333333333"))
      .rejects.toMatchObject({ code: "conflict" });
    const internals = workflow as unknown as {
      loaded: LoadedProject;
      saveTechPackApprovalOverlay(candidate: TechPackRecord, time: string, expectedRevisionId: string): Promise<LoadedProject>;
    };
    internals.loaded = {
      ...initial,
      activeStyle: {
        ...initial.activeStyle,
        techPack: { ...initial.activeStyle.techPack, revisionId: "33333333-3333-4333-8333-333333333333" },
      },
    };
    await expect(workflow.beginActiveTechPackReview("Reviewer", scope, revisionId))
      .rejects.toMatchObject({ code: "conflict" });
    internals.loaded = initial;
    internals.loaded = { ...initial, activeStyle: { ...initial.activeStyle, revisionHeadId: null } };
    await expect(internals.saveTechPackApprovalOverlay(initial.activeStyle.techPack, TIME, revisionId))
      .rejects.toMatchObject({ code: "conflict" });
    internals.loaded = {
      ...initial,
      activeStyle: { ...initial.activeStyle, archivedAt: TIME },
    };
    await expect(internals.saveTechPackApprovalOverlay(initial.activeStyle.techPack, TIME, revisionId))
      .rejects.toMatchObject({ code: "invalid-data" });
    internals.loaded = initial;
    const alteredTechPack = {
      ...initial.activeStyle.techPack,
      cover: {
        ...initial.activeStyle.techPack.cover,
        styleName: { ...initial.activeStyle.techPack.cover.styleName, value: "Changed candidate content" },
      },
    };
    await expect(internals.saveTechPackApprovalOverlay(alteredTechPack, TIME, revisionId))
      .rejects.toMatchObject({ code: "invalid-data" });
    await expect(internals.saveTechPackApprovalOverlay(null as unknown as TechPackRecord, TIME, revisionId))
      .rejects.toMatchObject({ code: "invalid-data" });
    const mismatchedRevisionCandidate = {
      ...initial.activeStyle.techPack,
      revisionId: "33333333-3333-4333-8333-333333333333",
    };
    expect(parseTechPackRecord(mismatchedRevisionCandidate).ok).toBe(true);
    await expect(internals.saveTechPackApprovalOverlay(mismatchedRevisionCandidate, TIME, revisionId))
      .rejects.toMatchObject({
        code: "invalid-data",
        message: expect.stringContaining("cannot edit the saved Tech Pack content"),
      });

    await expect(workflow.approveActiveTechPackReview("Approver", "33333333-3333-4333-8333-333333333333"))
      .rejects.toMatchObject({ code: "conflict" });
    const reviewed = await workflow.beginActiveTechPackReview("Reviewer", scope, revisionId);
    expect(reviewed.activeStyle.techPack.approval.state).toBe("REVIEW");
    expect(reviewed.activeStyle.revisionHeadId).toBe(revisionId);
    expect(reviewed.styleRevisions).toHaveLength(originalRevisionCount);
    const approved = await workflow.approveActiveTechPackReview("Approver", revisionId);
    expect(approved.activeStyle.techPack.approval.state).toBe("APPROVED");
    expect(approved.activeStyle.techPack.approval.scopeFieldIds).toEqual(scope);
    expect(approved.styleRevisions).toHaveLength(originalRevisionCount);

    const output = {
      revisionId,
      revisionContentDigest: revision.revisionContentDigest,
      selectedSections: ["identity", "approval-disclaimer"],
      artifacts: TECH_PACK_SHARE_ARTIFACTS.map((artifact, index) => ({
        ...artifact,
        bytes: new Uint8Array([80 + index, 75, 0, 255]),
      })),
    };
    await expect(workflow.freezeTechPackShare("Freezer", { ...output, revisionContentDigest: "0".repeat(64) }))
      .rejects.toMatchObject({ code: "conflict" });
    const currentlyApproved = workflow.snapshot;
    internals.loaded = { ...currentlyApproved, activeStyle: { ...currentlyApproved.activeStyle, archivedAt: TIME } };
    await expect(workflow.freezeTechPackShare("Freezer", output)).rejects.toMatchObject({ code: "invalid-data" });
    internals.loaded = currentlyApproved;
    const manifest = await workflow.freezeTechPackShare("Freezer", output);
    expect(manifest.schemaVersion).toBe(3);
    expect(manifest.payload.revisionId).toBe(revisionId);
    expect(manifest.payload.selectedSections).toEqual(output.selectedSections);
    expect(manifest.artifacts.map((artifact) => artifact.byteLength)).toEqual([4, 4]);
    expect(await verifyFrozenOutputManifest(manifest, cryptoApi)).toBe(true);
    expect(workflow.snapshot.activeStyle.techPack.approval).toMatchObject({
      state: "FROZEN_FOR_SHARE", revisionId, manifestId: manifest.manifestId, changedBy: "Freezer",
    });
    expect(workflow.snapshot.styleRevisions).toHaveLength(originalRevisionCount);
    const savedZip = await workflow.readFrozenArtifact(manifest.manifestId, "tech-pack-exchange-zip");
    expect([...new Uint8Array(await savedZip.artifact.bytes.arrayBuffer())]).toEqual([80, 75, 0, 255]);
  });

  it("reports a frozen Tech Pack whose saved bytes fail post-commit reload verification", async () => {
    const workflow = await open();
    const initial = workflow.snapshot;
    const revisionId = initial.activeStyle.revisionHeadId!;
    const revision = initial.styleRevisions.find((row) => row.revisionId === revisionId)!;
    const scope = [initial.activeStyle.techPack.cover.styleName.fieldId];
    await workflow.beginActiveTechPackReview("Reviewer", scope, revisionId);
    await workflow.approveActiveTechPackReview("Approver", revisionId);
    const output = {
      revisionId,
      revisionContentDigest: revision.revisionContentDigest,
      selectedSections: ["identity"],
      artifacts: TECH_PACK_SHARE_ARTIFACTS.map((artifact) => ({ ...artifact, bytes: new Uint8Array([1, 2, 3]) })),
    };
    const originalLoad = workflow.repository.loadProject.bind(workflow.repository);
    const hideCommittedManifest = vi.spyOn(workflow.repository, "loadProject").mockImplementation(async (projectId) => {
      const loaded = await originalLoad(projectId);
      return loaded?.exportManifests.some((manifest) => manifest.schemaVersion === 3)
        ? { ...loaded, exportManifests: [] } : loaded;
    });
    await expect(workflow.freezeTechPackShare("Freezer", output)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("not present with verified bytes after its atomic save"),
    });
    hideCommittedManifest.mockRestore();
    const recovered = await workflow.reload();
    expect(recovered.exportManifests.filter((manifest) => manifest.schemaVersion === 3)).toHaveLength(1);
    expect(recovered.activeStyle.techPack.approval.state).toBe("FROZEN_FOR_SHARE");
  });

  it("invalidates a frozen share when a saved design dependency changes while preserving its exact files", async () => {
    const workflow = await open();
    const initial = workflow.snapshot;
    const revisionId = initial.activeStyle.revisionHeadId!;
    const revision = initial.styleRevisions.find((row) => row.revisionId === revisionId)!;
    const scope = [initial.activeStyle.techPack.cover.styleName.fieldId];
    await workflow.beginActiveTechPackReview("Reviewer", scope, revisionId);
    await workflow.approveActiveTechPackReview("Approver", revisionId);
    const output = {
      revisionId,
      revisionContentDigest: revision.revisionContentDigest,
      selectedSections: ["identity", "approval-disclaimer"],
      artifacts: TECH_PACK_SHARE_ARTIFACTS.map((artifact, index) => ({
        ...artifact,
        bytes: new Uint8Array([100 + index, 75, 0, 255]),
      })),
    };
    const frozen = await workflow.freezeTechPackShare("Freezer", output);
    const before = await Promise.all(["tech-pack-exchange-zip", "tech-pack-production-pdf"].map(async (artifactId) => {
      const saved = await workflow.readFrozenArtifact(frozen.manifestId, artifactId);
      return [...new Uint8Array(await saved.artifact.bytes.arrayBuffer())];
    }));

    const changed = await workflow.saveActiveDesign({ ...initial.activeStyle.design, fabric: "#204060" });

    expect(changed.activeStyle.revisionHeadId).not.toBe(revisionId);
    expect(changed.activeStyle.techPack.approval).toMatchObject({
      state: "DRAFT", revisionId: null, scopeFieldIds: [], changedBy: null, changedAt: null, manifestId: null,
    });
    expect(changed.exportManifests.find((manifest) => manifest.manifestId === frozen.manifestId)).toEqual(frozen);
    expect(await Promise.all(["tech-pack-exchange-zip", "tech-pack-production-pdf"].map(async (artifactId) => {
      const saved = await workflow.readFrozenArtifact(frozen.manifestId, artifactId);
      return [...new Uint8Array(await saved.artifact.bytes.arrayBuffer())];
    }))).toEqual(before);
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
      const changedRecipe = await workflow.saveActiveDesign({
        ...baseline.design,
        workspace: wovenWorkspace,
        garmentOptions: { ...baseline.design.garmentOptions, "woven-shirt": {} },
      });
      expect(changedRecipe.activeStyle.techPack).toMatchObject({
        styleId: baseline.id,
        recipeId: "woven-shirt",
        recipeVersion: "unversioned",
        revisionId: changedRecipe.activeStyle.revisionHeadId,
        revisionNumber: 2,
        approval: { state: "DRAFT", revisionId: null, scopeFieldIds: [] },
      });
      expect(changedRecipe.activeStyle.techPack.cover).toEqual(baseline.techPack.cover);
      expect(changedRecipe.activeStyle.techPack.createdAt).toBe(changedRecipe.activeStyle.updatedAt);
      expect(changedRecipe.activeStyle.techPack.updatedAt).toBe(changedRecipe.activeStyle.updatedAt);
      expect(parseTechPackRecord(changedRecipe.activeStyle.techPack).ok).toBe(true);
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

  it("rejects a recipe change with populated T01 data before any project write", async () => {
    const workflow = await open();
    const before = await workflow.repository.readProjectBundle(PROJECT_ID);
    const current = workflow.snapshot;
    const baseTechPack = current.activeStyle.techPack;
    const styleCode = {
      ...baseTechPack.cover.styleCode,
      value: "TP-001",
      provenance: "USER_CAPTURED" as const,
      evidenceStatus: "USER_CONFIRMED" as const,
      validationStatus: "VALID" as const,
      method: "entered from an identified source",
      capturedBy: "fixture maintainer",
      capturedAt: TIME,
      unresolvedReason: null,
      nextAction: null,
    };
    const populatedTechPack = {
      ...baseTechPack,
      cover: { ...baseTechPack.cover, styleCode },
    };
    expect(parseTechPackRecord(populatedTechPack).ok).toBe(true);
    const populatedStyle = { ...current.activeStyle, techPack: populatedTechPack };
    const internals = workflow as unknown as { loaded: LoadedProject };
    internals.loaded = {
      ...current,
      activeStyle: populatedStyle,
      styles: current.styles.map((style) => style.id === populatedStyle.id ? populatedStyle : style),
    };
    const saveBundle = vi.spyOn(workflow.repository, "saveProjectBundle");
    const changedRecipe = {
      ...populatedStyle.design,
      workspace: {
        ...populatedStyle.design.workspace,
        garment: "woven-shirt",
        targetStyle: "Relaxed woven shirt",
        stretchFabric: "Cotton woven",
      },
      garmentOptions: { ...populatedStyle.design.garmentOptions, "woven-shirt": {} },
    };

    await expect(workflow.saveActiveDesign(changedRecipe)).rejects.toMatchObject({
      code: "invalid-data",
      message: expect.stringContaining("Create a separate style instead of moving pack facts across recipes"),
    });
    expect(saveBundle).not.toHaveBeenCalled();
    expect(await workflow.repository.readProjectBundle(PROJECT_ID)).toEqual(before);
    expect(workflow.snapshot.activeStyle.techPack).toEqual(populatedTechPack);
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

describe("G03 capture persistence through the project workflow", () => {
  const CHEST = "body.chest-girth";
  const SESSION_ONE = "3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90";
  const SESSION_TWO = "c200916f-baa3-4373-87f8-8d7481fb6053";
  const READING_ONE = "d34a5104-ae25-4b54-9a2b-fcc35237ff71";
  const READING_TWO = "e78e0c40-ae1a-4d03-9470-80345f994734";
  const reading = (id: string, rawValue: string, enteredUnit: string): NewCaptureReading => ({
    id,
    rawValue,
    enteredUnit,
    provenance: "USER_CAPTURED",
    evidenceStatus: "UNCONFIRMED",
    sourceLabel: "User-entered value; capture method and technique not qualified.",
    captureMethod: "Tape over a T-shirt",
    capturedAt: "2026-09-24T00:00:00.000Z",
    measurer: "HELPER",
  });
  const draft = (overrides: Partial<MeasurementCaptureDraft> = {}): MeasurementCaptureDraft => ({
    fieldId: CHEST, rawValue: "", enteredUnit: "cm", sourceNote: "", captureMethod: "", captureDate: "", measurer: "",
    ...overrides,
  });
  const captureSettings = () => ({
    ...repositoryOptions(),
    storage: storage(),
    idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID, STYLE_THREE_ID),
    now: () => TIME,
  });

  it("starts empty and reloads readings, explicit selection, and unrecorded drafts without touching design state", async () => {
    const artworkStore = { put: vi.fn(), get: vi.fn(async () => null), remove: vi.fn() };
    const settings = { ...captureSettings(), artworkStore };
    const workflow = await openProjectWorkflow(settings);
    workflows.push(workflow);
    const before = await workflow.repository.readProjectBundle(PROJECT_ID);
    const snapshotBefore = workflow.snapshot;
    expect(await workflow.loadMeasurementCapture("tee")).toBeNull();

    const empty = createMeasurementCaptureSession(SESSION_ONE, "tee", TIME, STYLE_ID);
    const later = empty.fields[empty.fields.findIndex((field) => field.fieldId === CHEST) + 1]!;
    const laterDraft = draft({ fieldId: later.fieldId, rawValue: "abc", enteredUnit: later.unit });
    const chestDraft = draft({
      rawValue: "40 1/8", enteredUnit: "in", sourceNote: "Tape note", captureMethod: "Snug", captureDate: "2026-09-24", measurer: "SELF",
    });
    const pending = await workflow.saveMeasurementCapture(empty, [laterDraft, chestDraft]);
    expect(pending).toMatchObject({ revision: 1, styleId: STYLE_ID, projectId: PROJECT_ID, recipeId: "tee" });
    expect(pending.drafts).toEqual([chestDraft, laterDraft]);
    expect(pending.session.fields.every((field) => field.readings.length === 0)).toBe(true);

    // Only an explicit Add reading turns entered text into a reading; the other draft stays unrecorded.
    const recorded = addCaptureReadingForField(empty, CHEST, reading(READING_ONE, "40.125", "in"), "2026-09-24T16:00:01.000Z");
    const repeated = addCaptureReadingForField(recorded, CHEST, reading(READING_TWO, "102", "cm"), "2026-09-24T16:00:02.000Z");
    await workflow.saveMeasurementCapture(repeated, [laterDraft]);
    const selected = selectCaptureReading(repeated, CHEST, READING_TWO, "2026-09-24T16:00:03.000Z");
    const saved = await workflow.saveMeasurementCapture(selected, [laterDraft]);
    expect(saved.revision).toBe(3);

    const reopened = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(reopened);
    const loaded = await reopened.loadMeasurementCapture("tee");
    expect(loaded).toEqual(saved);
    const chest = loaded!.session.fields.find((field) => field.fieldId === CHEST)!;
    expect(chest.readings.map((item) => [item.rawValue, item.enteredUnit, item.canonicalValue, item.measurer]))
      .toEqual([["40.125", "in", 101.9175, "HELPER"], ["102", "cm", 102, "HELPER"]]);
    expect(chest.selectedReadingId).toBe(READING_TWO);
    expect(loaded!.drafts).toEqual([laterDraft]);
    expect(loaded!.session.fields.find((field) => field.fieldId === later.fieldId)!.readings).toEqual([]);

    const after = await reopened.repository.readProjectBundle(PROJECT_ID);
    if (!after) throw new Error("Project disappeared after capture saves.");
    const { measurementCaptures, ...unchanged } = after;
    expect(unchanged).toEqual(before);
    expect(measurementCaptures).toEqual([saved]);
    expect(reopened.snapshot.project).toEqual(snapshotBefore.project);
    expect(reopened.snapshot.activeStyle).toEqual(snapshotBefore.activeStyle);
    expect(reopened.snapshot.activeRecovery).toEqual(snapshotBefore.activeRecovery);
    expect(reopened.snapshot.fieldObservations).toEqual(snapshotBefore.fieldObservations);
    expect(reopened.snapshot.styleRevisions).toEqual(snapshotBefore.styleRevisions);
    expect(reopened.snapshot.exportManifests).toEqual(snapshotBefore.exportManifests);
    expect(artworkStore.put).not.toHaveBeenCalled();
    expect(artworkStore.remove).not.toHaveBeenCalled();
  });

  it("keeps a second style/recipe independent and refuses cross-style, stale, unread, or malformed saves", async () => {
    const settings = captureSettings();
    const tabOne = await openProjectWorkflow(settings);
    workflows.push(tabOne);
    const tee = createMeasurementCaptureSession(SESSION_ONE, "tee", TIME, STYLE_ID);
    const teeRecord = await tabOne.saveMeasurementCapture(tee, []);
    await tabOne.createStyle("Skirt study", tabOne.snapshot.activeStyle.design);
    expect(tabOne.snapshot.activeStyle.id).toBe(STYLE_TWO_ID);
    const skirt = createMeasurementCaptureSession(SESSION_TWO, "skirt", TIME, STYLE_TWO_ID);
    const skirtRecord = await tabOne.saveMeasurementCapture(skirt, [draft({ fieldId: skirt.fields[0]!.fieldId, rawValue: "72" })]);
    await expect(tabOne.saveMeasurementCapture(tee, [])).rejects.toMatchObject({ code: "conflict" });
    expect(await tabOne.loadMeasurementCapture("tee")).toBeNull();
    expect(await tabOne.loadMeasurementCapture("skirt")).toEqual(skirtRecord);

    await tabOne.switchStyle(STYLE_ID);
    expect(await tabOne.loadMeasurementCapture("skirt")).toBeNull();
    expect(await tabOne.loadMeasurementCapture("tee")).toEqual(teeRecord);
    const tabTwo = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(tabTwo);
    expect(await tabTwo.loadMeasurementCapture("tee")).toEqual(teeRecord);
    const withReading = addCaptureReadingForField(tee, CHEST, reading(READING_ONE, "101", "cm"), "2026-09-24T16:00:01.000Z");
    expect((await tabOne.saveMeasurementCapture(withReading, [])).revision).toBe(2);
    await expect(tabTwo.saveMeasurementCapture(tee, [draft({ rawValue: "99" })])).rejects.toMatchObject({ code: "conflict" });
    const refreshed = await tabTwo.loadMeasurementCapture("tee");
    expect(refreshed?.session).toEqual(withReading);
    expect((await tabTwo.saveMeasurementCapture(refreshed!.session, [draft({ rawValue: "99" })])).revision).toBe(3);

    const unread = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(unread);
    await expect(unread.saveMeasurementCapture(withReading, [])).rejects.toMatchObject({ code: "conflict" });
    await expect(tabTwo.saveMeasurementCapture(withReading, [draft({ fieldId: "body.unknown" }), draft()]))
      .rejects.toMatchObject({ code: "invalid-data" });
    await expect(tabTwo.saveMeasurementCapture(withReading, [draft(), draft({ fieldId: "body.unknown" })]))
      .rejects.toMatchObject({ code: "invalid-data" });
    const latest = await unread.loadMeasurementCapture("tee");
    expect(latest?.revision).toBe(3);
    expect(latest?.drafts).toEqual([draft({ rawValue: "99" })]);
  });

  it("creates and reloads one custom one-size style with an atomic, source-preserving capture copy", async () => {
    const settings = {
      ...repositoryOptions(),
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID, SESSION_TWO),
      now: () => NEXT_TIME,
    };
    const workflow = await openProjectWorkflow(settings);
    workflows.push(workflow);
    await workflow.loadMeasurementCapture("tee");
    let session = createMeasurementCaptureSession(SESSION_ONE, "tee", TIME, STYLE_ID);
    getCaptureFieldDefinitions("tee").forEach((definition, index) => {
      const isBody = definition.semanticKind === "BODY_MEASURE";
      session = addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 201).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: isBody ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: isBody ? "User reading; method remains unqualified." : "Digital construction target or setting.",
        captureMethod: isBody ? "Tape; technique unqualified" : null,
        capturedAt: isBody ? "2026-09-24T00:00:00.000Z" : null,
        measurer: isBody ? "HELPER" : null,
      }, NEXT_TIME);
    });
    const originalCapture = await workflow.saveMeasurementCapture(session, []);
    const design = materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session);
    const created = await workflow.createCustomSizeStyle("Custom Tee", design);

    expect(created.styles).toHaveLength(2);
    expect(created.activeStyle).toMatchObject({
      id: STYLE_TWO_ID,
      name: "Custom Tee",
      schemaVersion: CUSTOM_STYLE_RECORD_VERSION,
      sizeMode: "custom-one-size",
      recipeId: "tee",
      recipePresetId: design.workspace.targetStyle,
      design,
    });
    await expect(workflow.saveActiveDesign({
      ...design,
      workspace: { ...design.workspace, exportStep: 2 },
    })).rejects.toMatchObject({ code: "invalid-data", message: "A custom one-size style must stay on export step 0." });
    expect(workflow.snapshot.activeStyle.design.workspace.exportStep).toBe(0);
    const copiedCapture = await workflow.loadMeasurementCapture("tee");
    expect(copiedCapture).toMatchObject({
      styleId: STYLE_TWO_ID,
      projectId: PROJECT_ID,
      recipeId: "tee",
      revision: 1,
      session: { styleId: STYLE_TWO_ID, revision: originalCapture.session.revision + 1 },
      drafts: [],
    });
    expect(copiedCapture?.session.id).not.toBe(originalCapture.session.id);
    const capturedChest = currentFieldObservation(
      created.fieldObservations.find((record) => record.styleId === STYLE_TWO_ID)!, getFieldDefinition("tee", "chest")!,
    );
    expect(capturedChest).toMatchObject({
      provenance: "USER_CAPTURED",
      sourceLabel: "User reading; method remains unqualified.",
      recordedAt: null,
    });

    const reopened = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(reopened);
    const persistedCapture = await reopened.loadMeasurementCapture("tee");
    expect(persistedCapture).toEqual(copiedCapture);
    await reopened.switchStyle(STYLE_ID);
    expect(await reopened.loadMeasurementCapture("tee")).toEqual(originalCapture);
  });

  it("loads and saves grade plans through the active style with compare-and-swap", async () => {
    const base = repositoryOptions();
    const settings = {
      ...base,
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID, SESSION_TWO),
      now: () => NEXT_TIME,
    };
    const workflow = await openProjectWorkflow(settings);
    workflows.push(workflow);
    await workflow.loadMeasurementCapture("tee");
    let session = createMeasurementCaptureSession(SESSION_ONE, "tee", TIME, STYLE_ID);
    getCaptureFieldDefinitions("tee").forEach((definition, index) => {
      const body = definition.semanticKind === "BODY_MEASURE";
      session = addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 401).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue), enteredUnit: definition.unit,
        provenance: body ? "USER_CAPTURED" : "USER_SELECTED", evidenceStatus: "UNCONFIRMED",
        sourceLabel: body ? "User reading; method remains unqualified." : "Digital construction target or setting.",
        captureMethod: body ? "Tape; technique unqualified" : null,
        capturedAt: body ? "2026-09-24T00:00:00.000Z" : null, measurer: body ? "HELPER" : null,
      }, NEXT_TIME);
    });
    await workflow.saveMeasurementCapture(session, []);
    const design = materializeCustomSizeDesign(workflow.snapshot.activeStyle.design, session);
    await workflow.createCustomSizeStyle("Custom Tee", design);
    const capture = await workflow.loadMeasurementCapture("tee");
    if (!capture) throw new Error("Custom style capture was not copied.");
    const context = await createGradePlanContext(PROJECT_ID, workflow.snapshot.activeStyle, capture, cryptoApi);
    if (!context.ok) throw new Error(context.errors.join("; "));
    expect(await workflow.loadGradePlan("tee")).toBeNull();
    expect(workflow.snapshot.gradePlans).toBeUndefined();
    const draftPlan = createGradePlanDraft(context.value.binding, context.value.targets, NEXT_TIME);
    if (!draftPlan.ok) throw new Error(draftPlan.errors.join("; "));

    const concurrent = await openProjectWorkflow({ ...settings, storage: storage() });
    workflows.push(concurrent);
    expect(await concurrent.loadGradePlan("tee")).toBeNull();
    const saved = await workflow.saveGradePlan(draftPlan.value);
    expect(saved).toEqual(draftPlan.value);
    expect(workflow.snapshot.gradePlans).toEqual([saved]);
    expect(await workflow.loadGradePlan("tee")).toEqual(saved);
    expect(await workflow.loadGradePlan("skirt")).toBeNull();
    expect(workflow.snapshot.gradePlans).toEqual([saved]);
    await expect(concurrent.saveGradePlan(draftPlan.value)).rejects.toMatchObject({ code: "conflict" });
    expect(await concurrent.loadGradePlan("tee")).toEqual(saved);
    await expect(workflow.saveGradePlan({ ...saved, projectId: OTHER_PROJECT_ID })).rejects.toMatchObject({ code: "conflict" });

    let complete = updateGradePlanDraft(saved, {
      basis: { kind: "user-authored-digital-rule", decision: "Explicit test plan", digitalRange: "S-L" },
      declaredRange: "S-L digital only", baseSizeLabel: "M",
      sizes: [{ label: "S", position: -1 }, { label: "M", position: 0 }, { label: "L", position: 1 }],
      exceptions: [],
      targets: saved.targets.map((target) => ({ ...target, deltas: [
        { sizeLabel: "S", deltaFromBase: 0 }, { sizeLabel: "M", deltaFromBase: 0 }, { sizeLabel: "L", deltaFromBase: 0 },
      ] })),
    }, "2026-09-24T16:00:02.000Z");
    if (!complete.ok) throw new Error(complete.errors.join("; "));
    let reviewed = reviewGradePlan(complete.value, context.value.targets.map((target) => target.targetId), context.value.binding,
      "2026-09-24T16:00:03.000Z");
    if (!reviewed.ok) throw new Error(reviewed.errors.join("; "));
    const approved = approveGradePlan(reviewed.value, context.value.targets.map((target) => target.targetId), context.value.binding,
      "2026-09-24T16:00:04.000Z");
    if (!approved.ok) throw new Error(approved.errors.join("; "));
    await workflow.saveGradePlan(complete.value);
    await workflow.saveGradePlan(reviewed.value);
    const persistedApproval = await workflow.saveGradePlan(approved.value);
    const approvalRef = `grade-plan-sha256:${await jcsSha256Hex(persistedApproval, cryptoApi)}`;
    const freezeArtifacts = [
      ["selected-size-a0-pdf", "pdf"], ["selected-size-dxf", "dxf"], ["selected-size-svg", "svg"],
      ["selected-size-tiled-pdf", "pdf"], ["whole-run-projector-svg", "svg"],
      ["whole-run-surface-sheet-svg", "svg"], ["whole-run-tech-pack-pdf", "pdf"],
    ] as const;
    const frozen = await workflow.freezeOutputs(freezeArtifacts.map(([artifactId, extension]) => ({
      artifactId, extension, displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `custom:${artifactId}`,
    })), [{ sizeId: "tee-grade-plan-4-M", label: "M" }], ["Digital only."],
    workflow.snapshot.activeStyle.revisionHeadId!, {
      schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
      approvalRefs: [approvalRef],
      gradePlanFreeze: { record: persistedApproval, approvalRef },
    });
    expect(frozen).toMatchObject({ schemaVersion: 2, payload: { approvalRefs: [approvalRef] } });

    const captureAgain = (suffix: string) => freezeArtifacts.map(([artifactId, extension]) => ({
      artifactId, extension, displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `${suffix}:${artifactId}`,
    }));
    await expect(workflow.freezeOutputs(captureAgain("bad-reference"), [{ sizeId: "tee-grade-plan-4-M", label: "M" }],
      ["Digital only."], workflow.snapshot.activeStyle.revisionHeadId!, {
        schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
        approvalRefs: [approvalRef],
        gradePlanFreeze: { record: persistedApproval, approvalRef: "invalid-digest" },
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("exact approved grade-plan") });
    const differentValidRef = `grade-plan-sha256:${"f".repeat(64)}`;
    await expect(workflow.freezeOutputs(captureAgain("mismatched-reference"), [{ sizeId: "tee-grade-plan-4-M", label: "M" }],
      ["Digital only."], workflow.snapshot.activeStyle.revisionHeadId!, {
        schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
        approvalRefs: [differentValidRef],
        gradePlanFreeze: { record: persistedApproval, approvalRef: differentValidRef },
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("canonical digest of the exact approved plan") });
    await expect(workflow.freezeOutputs(captureAgain("unbound-manifest"), [{ sizeId: "tee-grade-plan-4-M", label: "M" }],
      ["Digital only."], workflow.snapshot.activeStyle.revisionHeadId!, {
        schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
        approvalRefs: [differentValidRef],
        gradePlanFreeze: { record: persistedApproval, approvalRef },
      })).rejects.toMatchObject({ code: "invalid-data", message: expect.stringContaining("not bound to the reviewed grade plan") });

    const changedAfterFreeze = updateGradePlanDraft(persistedApproval, {
      basis: persistedApproval.basis!, declaredRange: persistedApproval.declaredRange,
      baseSizeLabel: persistedApproval.baseSizeLabel, sizes: persistedApproval.sizes,
      exceptions: persistedApproval.exceptions,
      targets: persistedApproval.targets.map((target, index) => index === 0 ? {
        ...target, deltas: target.deltas.map((delta) => delta.sizeLabel === "S"
          ? { ...delta, deltaFromBase: 1 } : delta),
      } : target),
    }, "2026-09-24T16:00:05.000Z");
    if (!changedAfterFreeze.ok) throw new Error(changedAfterFreeze.errors.join("; "));
    await concurrent.loadGradePlan("tee");
    await concurrent.saveGradePlan(changedAfterFreeze.value);
    await expect(workflow.freezeOutputs(freezeArtifacts.map(([artifactId, extension]) => ({
      artifactId, extension, displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content: `stale:${artifactId}`,
    })), [{ sizeId: "tee-grade-plan-4-M", label: "M" }], ["Digital only."],
    workflow.snapshot.activeStyle.revisionHeadId!, {
      schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
      approvalRefs: [approvalRef],
      gradePlanFreeze: { record: persistedApproval, approvalRef },
    })).rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("approved grade plan") });

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = base.repositoryOptions.factory.open(base.repositoryOptions.name);
      request.onerror = () => reject(request.error ?? new Error("Could not open the plan-removal fixture database."));
      request.onsuccess = () => resolve(request.result);
    });
    const removal = database.transaction("gradePlans", "readwrite");
    removal.objectStore("gradePlans").delete([workflow.snapshot.activeStyle.id, "tee"]);
    await new Promise<void>((resolve, reject) => {
      removal.oncomplete = () => resolve();
      removal.onabort = () => reject(removal.error ?? new Error("Could not remove the stored plan fixture."));
      removal.onerror = () => reject(removal.error ?? new Error("Could not remove the stored plan fixture."));
    });
    database.close();
    await workflow.reload();
    await expect(workflow.freezeOutputs(captureAgain("missing-stored-plan"), [{ sizeId: "tee-grade-plan-4-M", label: "M" }],
      ["Digital only."], workflow.snapshot.activeStyle.revisionHeadId!, {
        schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
        approvalRefs: [approvalRef],
        gradePlanFreeze: { record: persistedApproval, approvalRef },
      })).rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("approved grade plan or its saved base changed") });
  });

  it("duplicates a custom style only with its saved source capture and keeps the recipe", async () => {
    const settings = {
      ...repositoryOptions(),
      storage: storage(),
      idFactory: ids(PROJECT_ID, STYLE_ID, STYLE_TWO_ID, SESSION_TWO, STYLE_THREE_ID,
        "33b9700e-33a3-4933-a980-c5301c2c3b29"),
      now: () => NEXT_TIME,
    };
    const workflow = await openProjectWorkflow(settings);
    workflows.push(workflow);
    const design = workflow.snapshot.activeStyle.design;
    await expect(workflow.createCustomSizeStyle("Missing capture", design))
      .rejects.toMatchObject({ code: "not-found" });

    await workflow.loadMeasurementCapture("tee");
    let session = createMeasurementCaptureSession(SESSION_ONE, "tee", TIME, STYLE_ID);
    getCaptureFieldDefinitions("tee").forEach((definition, index) => {
      const isBody = definition.semanticKind === "BODY_MEASURE";
      session = addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 301).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: isBody ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Explicit digital capture fixture.",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      }, NEXT_TIME);
    });
    await workflow.saveMeasurementCapture(session, []);
    const custom = await workflow.createCustomSizeStyle("Custom Tee", design);
    const customDesign = custom.activeStyle.design;
    const sourceCapture = await workflow.loadMeasurementCapture("tee");
    const changedRecipe = {
      ...customDesign,
      workspace: { ...customDesign.workspace, garment: "skirt" },
    };
    await expect(workflow.saveActiveDesign(changedRecipe)).rejects.toMatchObject({ code: "invalid-data" });
    await expect(workflow.createStyle("Invalid recipe copy", changedRecipe)).rejects.toMatchObject({ code: "invalid-data" });

    // A freshly opened workflow has no in-memory capture cache. It must recover
    // the source capture from the repository before it duplicates the style.
    const uncached = new ProjectWorkflow(
      workflow.repository, custom, ids(STYLE_THREE_ID, "33b9700e-33a3-4933-a980-c5301c2c3b29"), () => NEXT_TIME,
    );
    const readCapture = vi.spyOn(workflow.repository, "readMeasurementCapture").mockResolvedValueOnce(null);
    try {
      await expect(uncached.createStyle("Missing source capture", customDesign))
        .rejects.toMatchObject({ code: "not-found" });
    } finally {
      readCapture.mockRestore();
    }
    const duplicate = await uncached.createStyle("Copy of Custom Tee", customDesign);

    expect(duplicate.styles).toHaveLength(3);
    expect(duplicate.activeStyle).toMatchObject({ name: "Copy of Custom Tee", recipeId: "tee", sizeMode: "custom-one-size" });
    const copied = await uncached.loadMeasurementCapture("tee");
    expect(copied).toMatchObject({ styleId: duplicate.activeStyle.id, recipeId: "tee" });
    expect(copied?.session.id).not.toBe(sourceCapture?.session.id);
  });
});
