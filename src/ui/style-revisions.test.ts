import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { createFieldObservationRecord } from "./field-provenance";
import { migrateLegacySaveFile } from "./project-records";
import { serialize } from "./persist";
import { bindTechPackToRevision } from "./tech-pack-records";
import { emptyTechPackPomRecordSet } from "./tech-pack-sample-qa-records";
import { emptyTechPackOperationRecordSetV2, unresolvedTechPackOperation } from "./tech-pack-operation-records";
import {
  CanonicalJsonError,
  canonicalizeJcs,
  createFrozenOutputManifest,
  createStyleRevision,
  FROZEN_ARTIFACT_IDS,
  FROZEN_TECH_PACK_ARTIFACT_LIMIT,
  GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
  TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION,
  jcsSha256Hex,
  parseFrozenOutputManifestRecord,
  parseStyleRevisionRecord,
  reidentifyStyleRevisionForCopy,
  sha256Hex,
  STYLE_REVISION_LEGACY_PAYLOAD_VERSION,
  STYLE_REVISION_PAYLOAD_VERSION,
  verifyFrozenOutputManifest,
  verifyFrozenOutputManifestMetadata,
  verifyStyleRevision,
  type FrozenArtifactInput,
  type FrozenOutputManifestRecord,
  type CurrentStyleRevisionPayload,
  type LegacyStyleRevisionPayload,
  type StyleRevisionRecord,
} from "./style-revisions";

const crypto = webcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const REVISION_ID = "11111111-1111-4111-8111-111111111111";
const MANIFEST_ID = "22222222-2222-4222-8222-222222222222";

class OversizedTechPackBytes extends Uint8Array {
  override get byteLength(): number { return FROZEN_TECH_PACK_ARTIFACT_LIMIT + 1; }
}

function revisionPack(style: ReturnType<typeof fixture>["style"], revisionId: string, revisionNumber: number) {
  return bindTechPackToRevision(style.techPack, revisionId, revisionNumber, TIME);
}

function fixture(assetIds: readonly string[] = []) {
  const surface = assetIds.length ? {
    "tee/Untitled tee": {
      styleName: "Untitled tee",
      placements: assetIds.map((assetId, index) => ({
        id: `mark-${index}`, kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
        transform: { dx: index, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: index + 1,
        sourceName: `Source ${index}`, assetId,
      })),
    },
  } : undefined;
  const result = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150", {}, undefined, undefined, surface),
    projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
  });
  if (!result.ok) throw new Error(result.error);
  const style = result.value.style;
  const fieldObservations = createFieldObservationRecord(style, TIME, "existing-local-style");
  return { style, fieldObservations };
}

async function revisionFixture() {
  const { style, fieldObservations } = fixture();
  return createStyleRevision({
    styleId: STYLE_ID,
    revisionId: REVISION_ID,
    parentRevisionId: null,
    revisionNumber: 1,
    createdAt: TIME,
    design: style.design,
    fieldObservations,
    artwork: [],
    techPack: revisionPack(style, REVISION_ID, 1),
  }, crypto);
}

function frozenInputs(content = "exact output bytes"): FrozenArtifactInput[] {
  return FROZEN_ARTIFACT_IDS.map((artifactId) => {
    const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
    return {
      artifactId,
      extension,
      displayName: `${artifactId}.${extension}`,
      mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
      content,
    };
  });
}

async function frozenFixture(): Promise<FrozenOutputManifestRecord> {
  return createFrozenOutputManifest({
    manifestId: MANIFEST_ID,
    styleId: STYLE_ID,
    revision: await revisionFixture(),
    capturedAt: TIME,
    selectedSizes: [{ sizeId: "tee-step-1", label: "S" }],
    unresolved: ["Physical fit, supplier requirements, and factory acceptance are not verified."],
    artifacts: frozenInputs(),
  }, crypto);
}

afterEach(() => vi.restoreAllMocks());

describe("RFC 8785 canonical JSON for immutable style records", () => {
  it("sorts keys by UTF-16 code units, preserves arrays, and uses ECMAScript number and escaping rules", () => {
    expect(canonicalizeJcs({ z: true, a: "quote\" slash\\ newline\n", "\uE000": 2, "\u{10000}": 1 }))
      .toBe('{"a":"quote\\\" slash\\\\ newline\\n","z":true,"𐀀":1,"":2}');
    expect(canonicalizeJcs([-0, Number.MAX_SAFE_INTEGER, 0.000001, 1e-7, null]))
      .toBe("[0,9007199254740991,0.000001,1e-7,null]");
    expect(canonicalizeJcs([false])).toBe("[false]");
    expect(canonicalizeJcs(Object.assign(Object.create(null) as Record<string, unknown>, { x: 1 }))).toBe('{"x":1}');
  });

  it("rejects values outside the interoperable JSON subset without evaluating accessors", () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const sparse = new Array(1);
    const extraArray = [1] as number[] & { extra?: number };
    extraArray.extra = 2;
    const symbolArray = [1];
    Object.defineProperty(symbolArray, Symbol("extra"), { value: 1 });
    const symbolObject = { x: 1, [Symbol("extra")]: 2 };
    const hidden = { x: 1 };
    Object.defineProperty(hidden, "hidden", { value: 2, enumerable: false });
    const getter = vi.fn(() => 1);
    const accessor = Object.defineProperty({}, "x", { enumerable: true, get: getter });
    const arrayGetter = vi.fn(() => 1);
    const accessorArray: unknown[] = [1];
    Object.defineProperty(accessorArray, "0", { configurable: true, get: arrayGetter });
    class NonPlain { readonly x = 1; }
    const invalid: unknown[] = [
      undefined, () => 1, 1n, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1,
      "\ud800", { "\udfff": 1 }, cycle, sparse, extraArray, symbolArray, symbolObject, hidden, accessor, accessorArray, new Date(), new NonPlain(),
    ];
    for (const value of invalid) expect(() => canonicalizeJcs(value)).toThrow(CanonicalJsonError);
    expect(getter).not.toHaveBeenCalled();
    expect(arrayGetter).not.toHaveBeenCalled();
  });

  it("matches the SHA-256 known-answer vector and rejects missing WebCrypto", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"), crypto))
      .toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    vi.stubGlobal("crypto", crypto);
    expect(await sha256Hex(new TextEncoder().encode("abc")))
      .toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await jcsSha256Hex({ b: 2, a: 1 }, crypto)).toBe(await sha256Hex(new TextEncoder().encode('{"a":1,"b":2}'), crypto));
    await expect(sha256Hex(new Uint8Array([1]), {} as Crypto)).rejects.toThrow("SHA-256 is unavailable");
  });
});

describe("immutable revision and frozen output records", () => {
  it("retains historical v1 payload identity and binds v2 T01 content into the digest", async () => {
    const current = await revisionFixture();
    expect(current.payload.payloadVersion).toBe(STYLE_REVISION_PAYLOAD_VERSION);
    const v2Payload = current.payload as CurrentStyleRevisionPayload;
    expect(v2Payload).toHaveProperty("techPack");

    const { techPack: _techPack, ...v1Fields } = v2Payload;
    // Recreate the historical v1 catalog: these Tee style-control observations
    // were added after v1 and must not alter its fixed legacy payload digest.
    const historicalDesign = {
      ...v2Payload.design,
      workspace: { ...v2Payload.design.workspace },
    };
    delete historicalDesign.workspace.starterOrigin;
    const historicalObservations = v2Payload.fieldObservations.observations
      .filter((observation) => observation.semanticId !== "style.tee.chest-ease"
        && observation.semanticId !== "style.tee.tee-vneck-drop-cm");
    const legacyPayload: LegacyStyleRevisionPayload = {
      ...v1Fields,
      design: historicalDesign,
      fieldObservations: {
        ...v2Payload.fieldObservations,
        revision: historicalObservations.length,
        observations: historicalObservations,
      },
      payloadVersion: STYLE_REVISION_LEGACY_PAYLOAD_VERSION,
    };
    const legacy: StyleRevisionRecord = {
      ...current,
      payload: legacyPayload,
      revisionContentDigest: await jcsSha256Hex(legacyPayload, crypto),
    };
    expect(Object.keys(legacyPayload)).toEqual([
      "payloadVersion", "styleId", "revisionId", "parentRevisionId", "revisionNumber",
      "ruleVersions", "design", "fieldObservations", "artwork",
    ]);
    expect(parseStyleRevisionRecord(legacy)).toEqual(legacy);
    expect(await verifyStyleRevision(legacy, crypto)).toBe(true);
    expect(legacyPayload).not.toHaveProperty("techPack");
    expect(legacy.revisionContentDigest).toBe("d904fb60a5c6050c2820ffa1a99236e3eea5b19dbe1623471789698192606087");

    const nextUpdatedAt = "2026-09-24T16:00:01.000Z";
    const changedTechPack = { ...v2Payload.techPack, updatedAt: nextUpdatedAt };
    const changed = await createStyleRevision({
      styleId: current.styleId,
      revisionId: current.revisionId,
      parentRevisionId: current.parentRevisionId,
      revisionNumber: current.revisionNumber,
      createdAt: current.createdAt,
      design: v2Payload.design,
      fieldObservations: v2Payload.fieldObservations,
      artwork: v2Payload.artwork,
      techPack: changedTechPack,
    }, crypto);
    expect(changed.revisionContentDigest).not.toBe(current.revisionContentDigest);
    expect(parseStyleRevisionRecord({
      ...current,
      payload: { ...v2Payload, techPack: { ...v2Payload.techPack, revisionNumber: 2 } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({ ...current, payload: { ...v2Payload, payloadVersion: 3 } })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...current,
      payload: { ...v2Payload, techPack: { ...v2Payload.techPack, styleId: PROJECT_ID } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...current,
      payload: { ...v2Payload, techPack: { ...v2Payload.techPack, recipeId: "skirt" } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...current,
      payload: { ...v2Payload, techPack: { ...v2Payload.techPack, revisionId: "33333333-3333-4333-8333-333333333333" } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...current,
      payload: {
        ...v2Payload,
        techPack: {
          ...v2Payload.techPack,
          approval: {
            state: "REVIEW",
            revisionId: current.revisionId,
            scopeFieldIds: [v2Payload.techPack.cover.styleCode.fieldId],
            changedBy: "fixture reviewer",
            changedAt: TIME,
            manifestId: null,
          },
        },
      },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...current,
      payload: { ...v2Payload, techPack: { ...v2Payload.techPack, unexpected: true } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({ ...current, payload: { ...v2Payload, techPack: undefined } })).toBeNull();
    expect(await verifyStyleRevision({
      ...current,
      payload: { ...v2Payload, techPack: changedTechPack },
    } as StyleRevisionRecord, crypto)).toBe(false);

    const legacyManifest = await createFrozenOutputManifest({
      manifestId: MANIFEST_ID,
      styleId: STYLE_ID,
      revision: legacy,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "tee-step-1", label: "M" }],
      unresolved: ["Physical fit and factory acceptance have not been verified."],
      artifacts: frozenInputs(),
    }, crypto);
    expect(legacyManifest.payload.revisionContentDigest).toBe(legacy.revisionContentDigest);
    expect(await verifyFrozenOutputManifest(legacyManifest, crypto)).toBe(true);

    const reidentifyInput = {
      source: current,
      styleId: STYLE_ID,
      revisionId: "33333333-3333-4333-8333-333333333333",
      parentRevisionId: REVISION_ID,
      design: v2Payload.design,
      fieldObservations: v2Payload.fieldObservations,
      artwork: v2Payload.artwork,
      createdAt: TIME,
    };
    await expect(reidentifyStyleRevisionForCopy(reidentifyInput, crypto))
      .rejects.toThrow("requires its remapped T01 snapshot");
    await expect(reidentifyStyleRevisionForCopy({
      ...reidentifyInput,
      source: legacy,
      techPack: v2Payload.techPack,
    }, crypto)).rejects.toThrow("must retain its legacy payload shape");
    await expect(reidentifyStyleRevisionForCopy({
      ...reidentifyInput,
      source: legacy,
      styleId: PROJECT_ID,
      revisionId: "44444444-4444-4444-8444-444444444444",
      parentRevisionId: null,
    }, crypto)).rejects.toThrow("Copied legacy style revision failed strict validation");
    await expect(reidentifyStyleRevisionForCopy({
      ...reidentifyInput,
      source: { ...current, revisionContentDigest: "0".repeat(64) },
      techPack: v2Payload.techPack,
    }, crypto)).rejects.toThrow("Only an integrity-verified source revision");
  });

  it("keeps revision payload v2 while operation schema-v3 content participates in its digest", async () => {
    const { style, fieldObservations } = fixture();
    const operationData = emptyTechPackOperationRecordSetV2("tee");
    const techPack = bindTechPackToRevision({
      ...style.techPack,
      recipeId: "tee",
      schemaVersion: 3,
      pomData: emptyTechPackPomRecordSet("tee"),
      operationData,
    }, REVISION_ID, 1, TIME);
    const revision = await createStyleRevision({
      styleId: STYLE_ID,
      revisionId: REVISION_ID,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: style.design,
      fieldObservations,
      artwork: [],
      techPack,
    }, crypto);
    expect(revision.payload.payloadVersion).toBe(STYLE_REVISION_PAYLOAD_VERSION);
    expect(parseStyleRevisionRecord(revision)).toEqual(revision);
    expect(await verifyStyleRevision(revision, crypto)).toBe(true);

    const changedOperationData = { ...operationData, operations: [unresolvedTechPackOperation("operation-1")] };
    const changedTechPack = { ...techPack, operationData: changedOperationData };
    const changed = await createStyleRevision({
      styleId: STYLE_ID,
      revisionId: REVISION_ID,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: style.design,
      fieldObservations,
      artwork: [],
      techPack: changedTechPack,
    }, crypto);
    expect(changed.revisionContentDigest).not.toBe(revision.revisionContentDigest);
    expect(await verifyStyleRevision({
      ...revision,
      payload: { ...revision.payload, techPack: changedTechPack },
    } as StyleRevisionRecord, crypto)).toBe(false);
  });

  it("hashes a parentless baseline, sorts source artwork, and verifies the strict record", async () => {
    const { style, fieldObservations } = fixture(["a", "b"]);
    const assetA = { assetId: "b", mimeType: "image/png", byteLength: 2, sha256: "a".repeat(64) };
    const assetB = { assetId: "a", mimeType: "image/svg+xml", byteLength: 3, sha256: "b".repeat(64) };
    const record = await createStyleRevision({
      styleId: STYLE_ID, revisionId: REVISION_ID, parentRevisionId: null, revisionNumber: 1,
      createdAt: TIME, design: style.design, fieldObservations,
      artwork: [assetA, assetB],
      techPack: revisionPack(style, REVISION_ID, 1),
    }, crypto);
    expect(record.payload.artwork.map((asset) => asset.assetId)).toEqual(["a", "b"]);
    expect(parseStyleRevisionRecord(record)).toEqual(record);
    expect(await verifyStyleRevision(record, crypto)).toBe(true);
    expect(await verifyStyleRevision({ ...record, revisionNumber: 2 }, crypto)).toBe(false);
    expect(parseStyleRevisionRecord({ ...record, extra: true })).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, revisionNumber: 0 })).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, createdAt: "2026-09-24" })).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, createdAt: "not-a-date" })).toBeNull();
    expect(parseStyleRevisionRecord([])).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, payload: { ...record.payload, styleId: PROJECT_ID } })).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, payload: { ...record.payload, artwork: [assetA, assetA] } })).toBeNull();
    expect(parseStyleRevisionRecord({ ...record, payload: { ...record.payload, design: {} } })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...record,
      payload: { ...record.payload, fieldObservations: { ...fieldObservations, styleId: PROJECT_ID } },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...record,
      payload: { ...record.payload, artwork: [...record.payload.artwork].reverse() },
    })).toBeNull();
    expect(parseStyleRevisionRecord({
      ...record,
      payload: { ...record.payload, artwork: [record.payload.artwork[0]!, { ...record.payload.artwork[1]!, assetId: "c" }] },
    })).toBeNull();
    const oppositeOrder = await createStyleRevision({
      styleId: STYLE_ID, revisionId: "33333333-3333-4333-8333-333333333333", parentRevisionId: REVISION_ID, revisionNumber: 2,
      createdAt: TIME, design: style.design, fieldObservations,
      artwork: [assetB, assetA],
      techPack: revisionPack(style, "33333333-3333-4333-8333-333333333333", 2),
    }, crypto);
    expect(oppositeOrder.payload.artwork.map((asset) => asset.assetId)).toEqual(["a", "b"]);
    await expect(createStyleRevision({
      styleId: STYLE_ID, revisionId: "44444444-4444-4444-8444-444444444444", parentRevisionId: REVISION_ID, revisionNumber: 2,
      createdAt: TIME, design: style.design, fieldObservations,
      artwork: [assetA, { ...assetA }],
      techPack: revisionPack(style, "44444444-4444-4444-8444-444444444444", 2),
    }, crypto)).rejects.toThrow("strict validation");
  });

  it("creates seven exact frozen files with a canonical packet digest and detects byte or descriptor tampering", async () => {
    const record = await frozenFixture();
    expect(record.artifacts.map((artifact) => artifact.artifactId)).toEqual([...FROZEN_ARTIFACT_IDS].sort());
    const shuffled = await createFrozenOutputManifest({
      manifestId: "33333333-3333-4333-8333-333333333333",
      styleId: STYLE_ID,
      revision: await revisionFixture(),
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "tee-step-1", label: "S" }],
      unresolved: ["Digital capture does not establish physical fit."],
      artifacts: [...frozenInputs()].reverse(),
    }, crypto);
    expect(shuffled.artifacts.map((artifact) => artifact.artifactId)).toEqual([...FROZEN_ARTIFACT_IDS].sort());
    expect(parseFrozenOutputManifestRecord(record)).toEqual(record);
    expect(await verifyFrozenOutputManifest(record, crypto)).toBe(true);
    expect(await verifyFrozenOutputManifestMetadata(record, crypto)).toBe(true);
    const samePayload = await createFrozenOutputManifest({
      manifestId: "33333333-3333-4333-8333-333333333333",
      styleId: STYLE_ID,
      revision: await revisionFixture(),
      capturedAt: "2026-09-24T17:00:00.000Z",
      selectedSizes: [{ sizeId: "tee-step-1", label: "S" }],
      unresolved: ["Physical fit, supplier requirements, and factory acceptance are not verified."],
      artifacts: frozenInputs(),
    }, crypto);
    expect(samePayload.packetDigest).toBe(record.packetDigest);
    const corruptBytes: FrozenOutputManifestRecord = {
      ...record,
      artifacts: record.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: new Blob(["changed"], { type: artifact.mediaType }) }
        : artifact),
    };
    expect(await verifyFrozenOutputManifest(corruptBytes, crypto)).toBe(false);
    const sameSizeCorruptBytes: FrozenOutputManifestRecord = {
      ...record,
      artifacts: record.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: new Blob(["wrong output bytes"], { type: artifact.mediaType }) }
        : artifact),
    };
    expect(await verifyFrozenOutputManifest(sameSizeCorruptBytes, crypto)).toBe(false);
    expect(await verifyFrozenOutputManifestMetadata({ ...record, packetDigest: "0".repeat(64) }, crypto)).toBe(false);
    expect(await verifyFrozenOutputManifestMetadata({
      ...record,
      payload: { ...record.payload, revisionId: "33333333-3333-4333-8333-333333333333" },
    }, crypto)).toBe(false);
    expect(await verifyFrozenOutputManifestMetadata({
      ...record,
      artifacts: record.artifacts.slice(1),
    }, crypto)).toBe(false);
    expect(parseFrozenOutputManifestRecord({ ...record, extra: true })).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, capturedAt: "2026-09-24" })).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, capturedAt: "not-a-date" })).toBeNull();
    expect(parseFrozenOutputManifestRecord([])).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, payload: { ...record.payload, approvalRefs: ["approved"] } })).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, payload: { ...record.payload, selectedSizes: [] } })).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, payload: { ...record.payload, unresolved: [] } })).toBeNull();
    expect(parseFrozenOutputManifestRecord({ ...record, payload: { ...record.payload, unresolved: [null] as unknown as string[] } })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...record,
      payload: { ...record.payload, artifacts: record.payload.artifacts.slice(1) },
    })).toBeNull();
    const wrongByteLength: FrozenOutputManifestRecord = {
      ...record,
      artifacts: record.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: { size: artifact.byteLength + 1, arrayBuffer: async () => new ArrayBuffer(0) } as Blob }
        : artifact),
    };
    expect(parseFrozenOutputManifestRecord(wrongByteLength)).toBeNull();
    const missingRequiredArtifact: FrozenOutputManifestRecord = {
      ...record,
      artifacts: record.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, artifactId: "a-output", path: "artifacts/a-output.pdf" }
        : artifact),
      payload: {
        ...record.payload,
        artifacts: record.payload.artifacts.map((artifact, index) => index === 0
          ? { ...artifact, artifactId: "a-output", path: "artifacts/a-output.pdf" }
          : artifact),
      },
    };
    expect(parseFrozenOutputManifestRecord(missingRequiredArtifact)).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...record,
      artifacts: [...record.artifacts].reverse(),
      payload: { ...record.payload, artifacts: [...record.payload.artifacts].reverse() },
    })).toBeNull();
    const overArtifactCount: FrozenOutputManifestRecord = {
      ...record,
      artifacts: Array.from({ length: 17 }, (_, index) => record.artifacts[index % record.artifacts.length]!),
      payload: { ...record.payload, artifacts: Array.from({ length: 17 }, (_, index) => record.payload.artifacts[index % record.payload.artifacts.length]!) },
    };
    expect(parseFrozenOutputManifestRecord(overArtifactCount)).toBeNull();
    const overTotal: FrozenOutputManifestRecord = {
      ...record,
      artifacts: record.artifacts.map((artifact) => ({ ...artifact, byteLength: 20 * 1024 * 1024, bytes: { size: 20 * 1024 * 1024, arrayBuffer: async () => new ArrayBuffer(0) } as Blob })),
      payload: { ...record.payload, artifacts: record.payload.artifacts.map((artifact) => ({ ...artifact, byteLength: 20 * 1024 * 1024 })) },
    };
    expect(parseFrozenOutputManifestRecord(overTotal)).toBeNull();
  });

  it("binds a custom frozen output capture to the exact approved grade-plan digest", async () => {
    const approvalRefs = [`grade-plan-sha256:${"a".repeat(64)}`];
    const record = await createFrozenOutputManifest({
      manifestId: "33333333-3333-4333-8333-333333333333",
      styleId: STYLE_ID,
      revision: await revisionFixture(),
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "tee-grade-plan-2-M", label: "M" }],
      unresolved: ["Physical fit is not verified."],
      artifacts: frozenInputs(),
      schemaVersion: GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION,
      approvalRefs,
    }, crypto);
    expect(record.schemaVersion).toBe(2);
    expect(record.payload.approvalRefs).toEqual(approvalRefs);
    expect(parseFrozenOutputManifestRecord(record)).toEqual(record);
    expect(await verifyFrozenOutputManifest(record, crypto)).toBe(true);
    expect(parseFrozenOutputManifestRecord({
      ...record,
      payload: { ...record.payload, approvalRefs: ["grade-plan-sha256:short"] },
    })).toBeNull();
  });

  it("stores deterministic binary Tech Pack share artifacts and exact selected sections", async () => {
    const revision = await revisionFixture();
    const approvalRefs = [`tech-pack-approval-sha256:${"b".repeat(64)}`];
    const artifacts: FrozenArtifactInput[] = [
      { artifactId: "tech-pack-production-pdf", extension: "pdf", displayName: "production-pack.pdf", mediaType: "application/pdf", bytes: new Uint8Array([37, 80, 68, 70, 0, 255]) },
      { artifactId: "tech-pack-exchange-zip", extension: "zip", displayName: "production-pack.techpack.zip", mediaType: "application/zip", bytes: new Uint8Array([80, 75, 3, 4, 0, 255]) },
    ];
    const input = {
      manifestId: MANIFEST_ID,
      styleId: STYLE_ID,
      revision,
      capturedAt: TIME,
      selectedSizes: [],
      selectedSections: ["identity", "materials-bom", "approval-disclaimer"],
      unresolved: ["Local digital review only; physical fit and production readiness are not established."],
      artifacts,
      schemaVersion: TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION as typeof TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION,
      approvalRefs,
    };
    const manifest = await createFrozenOutputManifest(input, crypto);
    expect(manifest.schemaVersion).toBe(3);
    expect(manifest.payload.exporterVersion).toBe("infinidrip-techpack-share-v1");
    expect(manifest.payload.selectedSections).toEqual(input.selectedSections);
    expect(manifest.payload.selectedSizes).toEqual([]);
    expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toEqual([
      "tech-pack-exchange-zip", "tech-pack-production-pdf",
    ]);
    expect([...new Uint8Array(await manifest.artifacts[0]!.bytes.arrayBuffer())]).toEqual([80, 75, 3, 4, 0, 255]);
    expect(parseFrozenOutputManifestRecord(manifest)).toEqual(manifest);
    expect(await verifyFrozenOutputManifest(manifest, crypto)).toBe(true);
    const repeated = await createFrozenOutputManifest({ ...input, capturedAt: "2026-10-13T17:00:00.000Z" }, crypto);
    expect(repeated.packetDigest).toBe(manifest.packetDigest);

    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      payload: { ...manifest.payload, selectedSections: ["identity", "identity"] },
    })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      payload: { ...manifest.payload, selectedSections: ["unknown"] },
    })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      payload: { ...manifest.payload, approvalRefs: ["grade-plan-sha256:" + "b".repeat(64)] },
    })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      payload: { ...manifest.payload, exporterVersion: "infinidrip-exporters-v1" },
    })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      payload: Object.fromEntries(Object.entries(manifest.payload).filter(([key]) => key !== "selectedSections")),
    })).toBeNull();
    expect(parseFrozenOutputManifestRecord({
      ...manifest,
      artifacts: manifest.artifacts.map((artifact) => artifact.artifactId === "tech-pack-exchange-zip"
        ? { ...artifact, mediaType: "application/octet-stream" } : artifact),
    })).toBeNull();
    const wrongZipPath = "artifacts/tech-pack-exchange-zip.bin";
    const zipPathMismatch = {
      ...manifest,
      artifacts: manifest.artifacts.map((artifact) => artifact.artifactId === "tech-pack-exchange-zip"
        ? { ...artifact, path: wrongZipPath } : artifact),
      payload: {
        ...manifest.payload,
        artifacts: manifest.payload.artifacts.map((artifact) => artifact.artifactId === "tech-pack-exchange-zip"
          ? { ...artifact, path: wrongZipPath } : artifact),
      },
    };
    expect(parseFrozenOutputManifestRecord(zipPathMismatch)).toBeNull();
    const pdfMediaTypeMismatch = {
      ...manifest,
      artifacts: manifest.artifacts.map((artifact) => artifact.artifactId === "tech-pack-production-pdf"
        ? { ...artifact, mediaType: "application/octet-stream" } : artifact),
      payload: {
        ...manifest.payload,
        artifacts: manifest.payload.artifacts.map((artifact) => artifact.artifactId === "tech-pack-production-pdf"
          ? { ...artifact, mediaType: "application/octet-stream" } : artifact),
      },
    };
    expect(parseFrozenOutputManifestRecord(pdfMediaTypeMismatch)).toBeNull();
  });

  it("rejects incomplete or over-limit binary Tech Pack freezes", async () => {
    const revision = await revisionFixture();
    const schemaVersion: typeof TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION = TECH_PACK_SHARE_EXPORT_MANIFEST_SCHEMA_VERSION;
    const artifacts: FrozenArtifactInput[] = [
      { artifactId: "tech-pack-exchange-zip", extension: "zip", displayName: "production.zip", mediaType: "application/zip", bytes: new Uint8Array([1]) },
      { artifactId: "tech-pack-production-pdf", extension: "pdf", displayName: "production.pdf", mediaType: "application/pdf", bytes: new Uint8Array([2]) },
    ];
    const base = {
      manifestId: MANIFEST_ID, styleId: STYLE_ID, revision, capturedAt: TIME,
      selectedSizes: [] as const, selectedSections: ["identity"], unresolved: ["Local-only."], artifacts,
      schemaVersion, approvalRefs: [`tech-pack-approval-sha256:${"c".repeat(64)}`],
    };
    await expect(createFrozenOutputManifest({ ...base, selectedSizes: [{ sizeId: "m", label: "M" }] }, crypto))
      .rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, selectedSections: [] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, selectedSections: ["not-a-section"] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, selectedSections: ["identity", "identity"] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: [] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: ["invalid"] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: [undefined as unknown as string] }, crypto))
      .rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, artifacts: artifacts.slice(1) }, crypto)).rejects.toThrow("complete supported artifact set");
    await expect(createFrozenOutputManifest({ ...base, artifacts: artifacts.map((artifact) => ({ ...artifact, bytes: undefined })) }, crypto))
      .rejects.toThrow("empty or exceeds");
    const oversized = artifacts.map((artifact) => ({ ...artifact, bytes: new OversizedTechPackBytes([1]) }));
    await expect(createFrozenOutputManifest({ ...base, artifacts: oversized }, crypto)).rejects.toThrow("128 MiB per-file limit");
    await expect(createFrozenOutputManifest({ ...base, unresolved: [] }, crypto)).rejects.toThrow("identity or capture inputs");
  });

  it("rejects partial, duplicate, empty, oversized, or unsafe output sets before a capture is returned", async () => {
    const revision = await revisionFixture();
    const base = {
      manifestId: MANIFEST_ID,
      styleId: STYLE_ID,
      revision,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }],
      unresolved: ["Physical validation remains outstanding."],
    };
    await expect(createFrozenOutputManifest({ ...base, artifacts: frozenInputs().slice(1) }, crypto)).rejects.toThrow("complete supported artifact set");
    await expect(createFrozenOutputManifest({ ...base, selectedSizes: [], artifacts: frozenInputs() }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, unresolved: [], artifacts: frozenInputs() }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, selectedSizes: [{ sizeId: "", label: "" }], artifacts: frozenInputs() }, crypto)).rejects.toThrow("strict validation");
    const duplicate = frozenInputs();
    duplicate[1] = { ...duplicate[1]!, artifactId: duplicate[0]!.artifactId };
    await expect(createFrozenOutputManifest({ ...base, artifacts: duplicate }, crypto)).rejects.toThrow("IDs must be unique");
    const unsafe = frozenInputs();
    unsafe[0] = { ...unsafe[0]!, extension: "../svg" };
    await expect(createFrozenOutputManifest({ ...base, artifacts: unsafe }, crypto)).rejects.toThrow("identity, extension");
    const empty = frozenInputs();
    empty[0] = { ...empty[0]!, content: "" };
    await expect(createFrozenOutputManifest({ ...base, artifacts: empty }, crypto)).rejects.toThrow("empty or exceeds");
    const missingContent = frozenInputs();
    missingContent[0] = { ...missingContent[0]!, content: undefined };
    await expect(createFrozenOutputManifest({ ...base, artifacts: missingContent }, crypto)).rejects.toThrow("empty or exceeds");
    const tooLarge = frozenInputs();
    tooLarge[0] = { ...tooLarge[0]!, content: "x".repeat(32 * 1024 * 1024 + 1) };
    await expect(createFrozenOutputManifest({ ...base, artifacts: tooLarge }, crypto)).rejects.toThrow("empty or exceeds");
    const overAggregateLimit = frozenInputs();
    const aggregateContent = "x".repeat(19 * 1024 * 1024);
    for (let index = 0; index < overAggregateLimit.length; index += 1) {
      overAggregateLimit[index] = { ...overAggregateLimit[index]!, content: aggregateContent };
    }
    await expect(createFrozenOutputManifest({ ...base, artifacts: overAggregateLimit }, crypto)).rejects.toThrow("128 MiB per-manifest limit");
    await expect(createFrozenOutputManifest({ ...base, manifestId: "bad-id", artifacts: frozenInputs() }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, capturedAt: "2026-09-24", artifacts: frozenInputs() }, crypto)).rejects.toThrow("identity or capture inputs");
  });

  it("requires exactly one well-formed grade-plan approval reference for schema two", async () => {
    const revision = await revisionFixture();
    const schemaVersion: typeof GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION = GRADE_PLAN_EXPORT_MANIFEST_SCHEMA_VERSION;
    const base = {
      manifestId: MANIFEST_ID, styleId: STYLE_ID, revision, capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }], unresolved: ["Digital only."],
      artifacts: frozenInputs(), schemaVersion,
    };
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: [] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: ["grade-plan-sha256:invalid"] }, crypto)).rejects.toThrow("identity or capture inputs");
    await expect(createFrozenOutputManifest({ ...base, approvalRefs: [undefined as unknown as string] }, crypto))
      .rejects.toThrow("identity or capture inputs");
  });
});
