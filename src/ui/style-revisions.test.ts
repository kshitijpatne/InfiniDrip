import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { createFieldObservationRecord } from "./field-provenance";
import { migrateLegacySaveFile } from "./project-records";
import { serialize } from "./persist";
import {
  CanonicalJsonError,
  canonicalizeJcs,
  createFrozenOutputManifest,
  createStyleRevision,
  FROZEN_ARTIFACT_IDS,
  jcsSha256Hex,
  parseFrozenOutputManifestRecord,
  parseStyleRevisionRecord,
  sha256Hex,
  verifyFrozenOutputManifest,
  verifyFrozenOutputManifestMetadata,
  verifyStyleRevision,
  type FrozenArtifactInput,
  type FrozenOutputManifestRecord,
} from "./style-revisions";

const crypto = webcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const REVISION_ID = "11111111-1111-4111-8111-111111111111";
const MANIFEST_ID = "22222222-2222-4222-8222-222222222222";

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
  it("hashes a parentless baseline, sorts source artwork, and verifies the strict record", async () => {
    const { style, fieldObservations } = fixture(["a", "b"]);
    const assetA = { assetId: "b", mimeType: "image/png", byteLength: 2, sha256: "a".repeat(64) };
    const assetB = { assetId: "a", mimeType: "image/svg+xml", byteLength: 3, sha256: "b".repeat(64) };
    const record = await createStyleRevision({
      styleId: STYLE_ID, revisionId: REVISION_ID, parentRevisionId: null, revisionNumber: 1,
      createdAt: TIME, design: style.design, fieldObservations,
      artwork: [assetA, assetB],
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
    }, crypto);
    expect(oppositeOrder.payload.artwork.map((asset) => asset.assetId)).toEqual(["a", "b"]);
    await expect(createStyleRevision({
      styleId: STYLE_ID, revisionId: "44444444-4444-4444-8444-444444444444", parentRevisionId: REVISION_ID, revisionNumber: 2,
      createdAt: TIME, design: style.design, fieldObservations,
      artwork: [assetA, { ...assetA }],
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
});
