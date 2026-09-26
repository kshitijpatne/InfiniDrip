import type { FieldObservationRecord } from "./field-provenance";
import { parseFieldObservationRecord } from "./field-provenance";
import { parseSavedDesignRecord, type SavedDesign } from "./project-records";

export const STYLE_REVISION_SCHEMA_VERSION = 1;
export const STYLE_REVISION_PAYLOAD_VERSION = 1;
export const EXPORT_MANIFEST_SCHEMA_VERSION = 1;
export const EXPORTER_CONTRACT_VERSION = "infinidrip-exporters-v1";
export const STYLE_REVISION_RULE_VERSIONS = Object.freeze({
  designRecord: "savefile-v6",
  fieldHistory: "field-observations-v1",
  draftAndGrade: "recipe-rules-v1",
  outputDependencyMap: "artifact-dependencies-v1",
});

export interface RevisionArtworkDigest {
  readonly assetId: string;
  readonly mimeType: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface StyleRevisionPayload {
  readonly payloadVersion: typeof STYLE_REVISION_PAYLOAD_VERSION;
  readonly styleId: string;
  readonly revisionId: string;
  readonly parentRevisionId: string | null;
  readonly revisionNumber: number;
  readonly ruleVersions: typeof STYLE_REVISION_RULE_VERSIONS;
  readonly design: SavedDesign;
  readonly fieldObservations: FieldObservationRecord;
  readonly artwork: readonly RevisionArtworkDigest[];
}

export interface StyleRevisionRecord {
  readonly schemaVersion: typeof STYLE_REVISION_SCHEMA_VERSION;
  readonly revisionId: string;
  readonly styleId: string;
  readonly revisionNumber: number;
  readonly parentRevisionId: string | null;
  readonly createdAt: string;
  readonly canonicalization: "RFC8785";
  readonly digestAlgorithm: "SHA-256";
  readonly revisionContentDigest: string;
  readonly payload: StyleRevisionPayload;
}

export interface RevisionManifestArtifact {
  readonly artifactId: string;
  readonly path: string;
  readonly displayName: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly bytes: Blob;
}

export interface FrozenOutputManifestPayload {
  readonly schemaVersion: typeof EXPORT_MANIFEST_SCHEMA_VERSION;
  readonly styleId: string;
  readonly revisionId: string;
  readonly revisionContentDigest: string;
  readonly audience: "local-user";
  readonly purpose: "digital-review-and-export";
  readonly selectedSizes: readonly { readonly sizeId: string; readonly label: string }[];
  readonly selectedColorwayIds: readonly string[];
  readonly ruleVersions: typeof STYLE_REVISION_RULE_VERSIONS;
  readonly exporterVersion: typeof EXPORTER_CONTRACT_VERSION;
  readonly approvalRefs: readonly string[];
  readonly unresolved: readonly string[];
  readonly artifacts: readonly Omit<RevisionManifestArtifact, "bytes">[];
}

export interface FrozenOutputManifestRecord {
  readonly schemaVersion: typeof EXPORT_MANIFEST_SCHEMA_VERSION;
  readonly manifestId: string;
  readonly styleId: string;
  readonly revisionId: string;
  readonly capturedAt: string;
  readonly canonicalization: "RFC8785";
  readonly digestAlgorithm: "SHA-256";
  readonly packetDigest: string;
  readonly payload: FrozenOutputManifestPayload;
  readonly artifacts: readonly RevisionManifestArtifact[];
}

export interface FrozenArtifactInput {
  readonly artifactId: string;
  readonly extension: string;
  readonly displayName: string;
  readonly mediaType: string;
  readonly content: string;
}

export const FROZEN_ARTIFACT_LIMIT = 32 * 1024 * 1024;
export const FROZEN_MANIFEST_ARTIFACT_LIMIT = 16;
export const FROZEN_MANIFEST_TOTAL_LIMIT = 128 * 1024 * 1024;
export const FROZEN_ARTIFACT_IDS = Object.freeze([
  "selected-size-a0-pdf",
  "selected-size-dxf",
  "selected-size-svg",
  "selected-size-tiled-pdf",
  "whole-run-projector-svg",
  "whole-run-surface-sheet-svg",
  "whole-run-tech-pack-pdf",
]);
const SHA256 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;
  return new Date(Date.parse(value)).toISOString() === value;
}

function isDigest(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

export function parseStyleRevisionRecord(value: unknown): StyleRevisionRecord | null {
  const recordKeys = ["schemaVersion", "revisionId", "styleId", "revisionNumber", "parentRevisionId", "createdAt", "canonicalization", "digestAlgorithm", "revisionContentDigest", "payload"];
  const payloadKeys = ["payloadVersion", "styleId", "revisionId", "parentRevisionId", "revisionNumber", "ruleVersions", "design", "fieldObservations", "artwork"];
  const ruleKeys = Object.keys(STYLE_REVISION_RULE_VERSIONS);
  if (!exactKeys(value, recordKeys) || value.schemaVersion !== STYLE_REVISION_SCHEMA_VERSION
    || !UUID.test(String(value.revisionId)) || !UUID.test(String(value.styleId))
    || !Number.isSafeInteger(value.revisionNumber) || (value.revisionNumber as number) < 1
    || (value.parentRevisionId !== null && !UUID.test(String(value.parentRevisionId)))
    || !canonicalTimestamp(value.createdAt) || value.canonicalization !== "RFC8785"
    || value.digestAlgorithm !== "SHA-256" || !isDigest(value.revisionContentDigest)
    || !exactKeys(value.payload, payloadKeys)) return null;
  const payload = value.payload as Record<string, unknown>;
  const payloadRules = payload.ruleVersions as Record<string, unknown>;
  const parsedDesign = parseSavedDesignRecord(payload.design);
  const parsedObservations = parseFieldObservationRecord(payload.fieldObservations);
  if (payload.payloadVersion !== STYLE_REVISION_PAYLOAD_VERSION || payload.styleId !== value.styleId
    || payload.revisionId !== value.revisionId || payload.parentRevisionId !== value.parentRevisionId
    || payload.revisionNumber !== value.revisionNumber || !exactKeys(payload.ruleVersions, ruleKeys)
    || ruleKeys.some((key) => payloadRules[key] !== (STYLE_REVISION_RULE_VERSIONS as Record<string, string>)[key])
    || !parsedDesign.ok || !parsedObservations.ok || parsedObservations.value.styleId !== payload.styleId
    || !Array.isArray(payload.artwork)) return null;
  const references = new Set<string>();
  for (const surface of Object.values(parsedDesign.value.surface) as readonly { readonly placements: readonly { readonly assetId?: string }[] }[]) {
    for (const placement of surface.placements) if (placement.assetId) references.add(placement.assetId);
  }
  const artworkIds = new Set<string>();
  let priorAssetId = "";
  for (const asset of payload.artwork) {
    if (!exactKeys(asset, ["assetId", "mimeType", "byteLength", "sha256"])
      || typeof asset.assetId !== "string" || !asset.assetId || artworkIds.has(asset.assetId)
      || typeof asset.mimeType !== "string" || !asset.mimeType
      || !Number.isSafeInteger(asset.byteLength) || (asset.byteLength as number) <= 0 || !isDigest(asset.sha256)) return null;
    if (asset.assetId <= priorAssetId) return null;
    priorAssetId = asset.assetId;
    artworkIds.add(asset.assetId);
  }
  if (artworkIds.size !== references.size || [...references].some((assetId) => !artworkIds.has(assetId))) return null;
  return value as unknown as StyleRevisionRecord;
}

export function parseFrozenOutputManifestRecord(value: unknown): FrozenOutputManifestRecord | null {
  const recordKeys = ["schemaVersion", "manifestId", "styleId", "revisionId", "capturedAt", "canonicalization", "digestAlgorithm", "packetDigest", "payload", "artifacts"];
  const payloadKeys = ["schemaVersion", "styleId", "revisionId", "revisionContentDigest", "audience", "purpose", "selectedSizes", "selectedColorwayIds", "ruleVersions", "exporterVersion", "approvalRefs", "unresolved", "artifacts"];
  const ruleKeys = Object.keys(STYLE_REVISION_RULE_VERSIONS);
  if (!exactKeys(value, recordKeys) || value.schemaVersion !== EXPORT_MANIFEST_SCHEMA_VERSION
    || !UUID.test(String(value.manifestId)) || !UUID.test(String(value.styleId)) || !UUID.test(String(value.revisionId))
    || !canonicalTimestamp(value.capturedAt) || value.canonicalization !== "RFC8785"
    || value.digestAlgorithm !== "SHA-256" || !isDigest(value.packetDigest)
    || !exactKeys(value.payload, payloadKeys) || !Array.isArray(value.artifacts)) return null;
  const payload = value.payload as Record<string, unknown>;
  const payloadRules = payload.ruleVersions as Record<string, unknown>;
  if (payload.schemaVersion !== EXPORT_MANIFEST_SCHEMA_VERSION || payload.styleId !== value.styleId
    || payload.revisionId !== value.revisionId || !isDigest(payload.revisionContentDigest)
    || payload.audience !== "local-user" || payload.purpose !== "digital-review-and-export"
    || !Array.isArray(payload.selectedSizes) || payload.selectedSizes.length !== 1 || !Array.isArray(payload.selectedColorwayIds)
    || !exactKeys(payload.ruleVersions, ruleKeys)
    || ruleKeys.some((key) => payloadRules[key] !== (STYLE_REVISION_RULE_VERSIONS as Record<string, string>)[key])
    || payload.exporterVersion !== EXPORTER_CONTRACT_VERSION || !Array.isArray(payload.approvalRefs)
    || payload.approvalRefs.length !== 0 || !Array.isArray(payload.unresolved) || payload.unresolved.length < 1
    || !Array.isArray(payload.artifacts)) return null;
  for (const size of payload.selectedSizes) {
    if (!exactKeys(size, ["sizeId", "label"]) || typeof size.sizeId !== "string" || !size.sizeId
      || typeof size.label !== "string" || !size.label) return null;
  }
  if (![payload.selectedColorwayIds, payload.unresolved].every((list) => list.every((entry) => typeof entry === "string"))) return null;
  if (value.artifacts.length > FROZEN_MANIFEST_ARTIFACT_LIMIT) return null;
  if (value.artifacts.length !== FROZEN_ARTIFACT_IDS.length || value.artifacts.length !== payload.artifacts.length) return null;
  const ids = new Set<string>();
  let priorArtifactId = "";
  let byteTotal = 0;
  for (let index = 0; index < value.artifacts.length; index += 1) {
    const artifact = value.artifacts[index] as Record<string, unknown>;
    const descriptor = payload.artifacts[index] as Record<string, unknown>;
    const keys = ["artifactId", "path", "displayName", "mediaType", "byteLength", "sha256"];
    if (!exactKeys(artifact, [...keys, "bytes"]) || !exactKeys(descriptor, keys)
      || typeof artifact.artifactId !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(artifact.artifactId)
      || ids.has(artifact.artifactId) || artifact.artifactId <= priorArtifactId || artifact.path !== descriptor.path
      || artifact.displayName !== descriptor.displayName || artifact.mediaType !== descriptor.mediaType
      || artifact.byteLength !== descriptor.byteLength || artifact.sha256 !== descriptor.sha256
      || artifact.path !== `artifacts/${artifact.artifactId}.${String(artifact.path).split(".").pop()}`
      || typeof artifact.displayName !== "string" || !artifact.displayName
      || typeof artifact.mediaType !== "string" || !artifact.mediaType
      || !Number.isSafeInteger(artifact.byteLength) || (artifact.byteLength as number) < 1
      || typeof artifact.path !== "string" || !/^artifacts\/[a-z0-9][a-z0-9-]{0,63}\.[a-z0-9]{1,8}$/.test(artifact.path)
      || (artifact.byteLength as number) > FROZEN_ARTIFACT_LIMIT || !isDigest(artifact.sha256)
      || typeof artifact.bytes !== "object" || artifact.bytes === null
      || typeof (artifact.bytes as Blob).arrayBuffer !== "function" || typeof (artifact.bytes as Blob).size !== "number"
      || (artifact.bytes as Blob).size !== artifact.byteLength) return null;
    ids.add(artifact.artifactId);
    priorArtifactId = artifact.artifactId;
    byteTotal += artifact.byteLength as number;
    if (byteTotal > FROZEN_MANIFEST_TOTAL_LIMIT) return null;
  }
  if (FROZEN_ARTIFACT_IDS.some((id) => !ids.has(id))) return null;
  return value as unknown as FrozenOutputManifestRecord;
}

export class CanonicalJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalJsonError";
  }
}

function validUnicodeScalarString(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

function exactArrayIndexes(value: readonly unknown[]): boolean {
  const names = Object.getOwnPropertyNames(value);
  if (names.length !== value.length + 1 || !names.includes("length")) return false;
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !("value" in descriptor)) return false;
  }
  return Object.getOwnPropertySymbols(value).length === 0;
}

function canonical(value: unknown, stack: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    if (!validUnicodeScalarString(value)) throw new CanonicalJsonError("JCS input contains an unpaired UTF-16 surrogate.");
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new CanonicalJsonError("JCS input contains a non-finite number.");
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new CanonicalJsonError("JCS input contains an integer outside the interoperable safe-integer range.");
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "object" || value === undefined) {
    throw new CanonicalJsonError("JCS input contains a value that JSON cannot represent.");
  }
  if (stack.has(value)) throw new CanonicalJsonError("JCS input contains a cycle.");
  stack.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || !exactArrayIndexes(value)) {
        throw new CanonicalJsonError("JCS arrays must be dense arrays with no extra properties.");
      }
      return `[${value.map((item) => canonical(item, stack)).join(",")}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new CanonicalJsonError("JCS objects must be plain JSON objects.");
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new CanonicalJsonError("JCS objects cannot contain symbol properties.");
    }
    const names = Object.getOwnPropertyNames(value);
    const keys = Object.keys(value);
    if (keys.length !== names.length) throw new CanonicalJsonError("JCS objects cannot contain non-enumerable properties.");
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor) || !validUnicodeScalarString(key)) {
        throw new CanonicalJsonError("JCS object keys must be valid Unicode data properties.");
      }
    }
    keys.sort(); // ECMAScript string order compares UTF-16 code units as RFC 8785 requires.
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key], stack)}`).join(",")}}`;
  } finally {
    stack.delete(value);
  }
}

/** RFC 8785 canonical JSON for validated application records. */
export function canonicalizeJcs(value: unknown): string {
  return canonical(value, new Set());
}

function subtleCrypto(provider?: Crypto): SubtleCrypto {
  const subtle = (provider ?? globalThis.crypto)?.subtle;
  if (!subtle) throw new Error("SHA-256 is unavailable in this application context.");
  return subtle;
}

export async function sha256Hex(bytes: Uint8Array, provider?: Crypto): Promise<string> {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = await subtleCrypto(provider).digest("SHA-256", input.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function jcsSha256Hex(value: unknown, provider?: Crypto): Promise<string> {
  return sha256Hex(new TextEncoder().encode(canonicalizeJcs(value)), provider);
}

export async function createFrozenOutputManifest(input: {
  readonly manifestId: string;
  readonly styleId: string;
  readonly revision: StyleRevisionRecord;
  readonly capturedAt: string;
  readonly selectedSizes: readonly { readonly sizeId: string; readonly label: string }[];
  readonly unresolved: readonly string[];
  readonly artifacts: readonly FrozenArtifactInput[];
}, provider?: Crypto): Promise<FrozenOutputManifestRecord> {
  if (!UUID.test(input.manifestId) || input.styleId !== input.revision.styleId
    || !canonicalTimestamp(input.capturedAt) || input.selectedSizes.length !== 1
    || input.unresolved.length < 1 || input.artifacts.length < 1
    || input.artifacts.length > FROZEN_MANIFEST_ARTIFACT_LIMIT) {
    throw new Error("Frozen output manifest identity or capture inputs are invalid.");
  }
  const sorted = [...input.artifacts].sort((left, right) => left.artifactId < right.artifactId ? -1 : left.artifactId > right.artifactId ? 1 : 0);
  if (new Set(sorted.map((artifact) => artifact.artifactId)).size !== sorted.length) throw new Error("Frozen output artifact IDs must be unique.");
  if (sorted.length !== FROZEN_ARTIFACT_IDS.length
    || FROZEN_ARTIFACT_IDS.some((id) => !sorted.some((artifact) => artifact.artifactId === id))) {
    throw new Error("Frozen output manifest must contain the complete supported artifact set.");
  }
  let total = 0;
  const artifacts: RevisionManifestArtifact[] = [];
  for (const artifact of sorted) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(artifact.artifactId)
      || !/^[a-z0-9]{1,8}$/.test(artifact.extension) || !artifact.displayName.trim()
      || !/^[\w.+-]+(?:\/[\w.+-]+)?$/.test(artifact.mediaType)) {
      throw new Error("Frozen output artifact identity, extension, name, or media type is invalid.");
    }
    const bytes = new TextEncoder().encode(artifact.content);
    if (bytes.byteLength < 1 || bytes.byteLength > FROZEN_ARTIFACT_LIMIT) throw new Error("A frozen output artifact is empty or exceeds the 32 MiB per-file limit.");
    total += bytes.byteLength;
    if (total > FROZEN_MANIFEST_TOTAL_LIMIT) throw new Error("Frozen outputs exceed the 128 MiB per-manifest limit.");
    artifacts.push({
      artifactId: artifact.artifactId,
      path: `artifacts/${artifact.artifactId}.${artifact.extension}`,
      displayName: artifact.displayName,
      mediaType: artifact.mediaType,
      byteLength: bytes.byteLength,
      sha256: await sha256Hex(bytes, provider),
      bytes: new Blob([bytes], { type: artifact.mediaType }),
    });
  }
  const payload: FrozenOutputManifestPayload = {
    schemaVersion: EXPORT_MANIFEST_SCHEMA_VERSION,
    styleId: input.styleId,
    revisionId: input.revision.revisionId,
    revisionContentDigest: input.revision.revisionContentDigest,
    audience: "local-user",
    purpose: "digital-review-and-export",
    selectedSizes: [...input.selectedSizes],
    selectedColorwayIds: [],
    ruleVersions: STYLE_REVISION_RULE_VERSIONS,
    exporterVersion: EXPORTER_CONTRACT_VERSION,
    approvalRefs: [],
    unresolved: [...input.unresolved],
    artifacts: artifacts.map(({ bytes: _bytes, ...descriptor }) => descriptor),
  };
  const record: FrozenOutputManifestRecord = {
    schemaVersion: EXPORT_MANIFEST_SCHEMA_VERSION,
    manifestId: input.manifestId,
    styleId: input.styleId,
    revisionId: input.revision.revisionId,
    capturedAt: input.capturedAt,
    canonicalization: "RFC8785",
    digestAlgorithm: "SHA-256",
    packetDigest: await jcsSha256Hex(payload, provider),
    payload,
    artifacts,
  };
  if (!parseFrozenOutputManifestRecord(record)) throw new Error("Frozen output manifest failed strict validation.");
  return record;
}

export async function createStyleRevision(
  input: Omit<StyleRevisionPayload, "payloadVersion" | "ruleVersions"> & { readonly createdAt: string },
  provider?: Crypto,
): Promise<StyleRevisionRecord> {
  const payload: StyleRevisionPayload = {
    payloadVersion: STYLE_REVISION_PAYLOAD_VERSION,
    styleId: input.styleId,
    revisionId: input.revisionId,
    parentRevisionId: input.parentRevisionId,
    revisionNumber: input.revisionNumber,
    ruleVersions: STYLE_REVISION_RULE_VERSIONS,
    design: input.design,
    fieldObservations: input.fieldObservations,
    artwork: [...input.artwork].sort((left, right) => left.assetId < right.assetId ? -1 : left.assetId > right.assetId ? 1 : 0),
  };
  const revisionContentDigest = await jcsSha256Hex(payload, provider);
  const record: StyleRevisionRecord = {
    schemaVersion: STYLE_REVISION_SCHEMA_VERSION,
    revisionId: input.revisionId,
    styleId: input.styleId,
    revisionNumber: input.revisionNumber,
    parentRevisionId: input.parentRevisionId,
    createdAt: input.createdAt,
    canonicalization: "RFC8785",
    digestAlgorithm: "SHA-256",
    revisionContentDigest,
    payload,
  };
  if (!parseStyleRevisionRecord(record)) throw new Error("Style revision failed strict validation.");
  return record;
}

export async function verifyStyleRevision(record: StyleRevisionRecord, provider?: Crypto): Promise<boolean> {
  if (record.schemaVersion !== STYLE_REVISION_SCHEMA_VERSION || record.canonicalization !== "RFC8785"
    || record.digestAlgorithm !== "SHA-256" || record.payload.revisionId !== record.revisionId
    || record.payload.styleId !== record.styleId || record.payload.parentRevisionId !== record.parentRevisionId
    || record.payload.revisionNumber !== record.revisionNumber) return false;
  return await jcsSha256Hex(record.payload, provider) === record.revisionContentDigest;
}

export function packetDigestPayload(record: FrozenOutputManifestRecord): FrozenOutputManifestPayload {
  return record.payload;
}

export async function verifyFrozenOutputManifest(record: FrozenOutputManifestRecord, provider?: Crypto): Promise<boolean> {
  if (!await verifyFrozenOutputManifestMetadata(record, provider)) return false;
  for (let index = 0; index < record.artifacts.length; index += 1) {
    const artifact = record.artifacts[index]!;
    if (artifact.bytes.size !== artifact.byteLength
      || await sha256Hex(new Uint8Array(await artifact.bytes.arrayBuffer()), provider) !== artifact.sha256) return false;
  }
  return true;
}

export async function verifyFrozenOutputManifestMetadata(record: FrozenOutputManifestRecord, provider?: Crypto): Promise<boolean> {
  if (record.schemaVersion !== EXPORT_MANIFEST_SCHEMA_VERSION || record.canonicalization !== "RFC8785"
    || record.digestAlgorithm !== "SHA-256" || record.payload.styleId !== record.styleId
    || record.payload.revisionId !== record.revisionId) return false;
  if (await jcsSha256Hex(packetDigestPayload(record), provider) !== record.packetDigest) return false;
  if (record.artifacts.length !== record.payload.artifacts.length) return false;
  for (let index = 0; index < record.artifacts.length; index += 1) {
    const artifact = record.artifacts[index]!;
    const descriptor = record.payload.artifacts[index]!;
    if (artifact.artifactId !== descriptor.artifactId || artifact.path !== descriptor.path
      || artifact.displayName !== descriptor.displayName || artifact.mediaType !== descriptor.mediaType
      || artifact.byteLength !== descriptor.byteLength || artifact.sha256 !== descriptor.sha256
      || artifact.bytes.size !== artifact.byteLength) {
      return false;
    }
  }
  return true;
}
