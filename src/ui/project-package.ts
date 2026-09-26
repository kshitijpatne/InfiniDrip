/** Strict, local-only .zip backup format for versioned project/style bundles. */
import { Zip, ZipPassThrough, Unzip, UnzipPassThrough } from "fflate";
import { inspectArtworkFile, type InspectedArtworkFile } from "../surface/artwork-file";
import {
  createLocalArtworkAssetId,
  isLocalArtworkAssetId,
  type ArtworkAssetStore,
  type StoredArtworkAsset,
} from "../surface/artwork-store";
import {
  createFieldObservationRecord,
  parseFieldObservationRecord,
  remapFieldObservationStyleId,
  type FieldObservationRecord,
} from "./field-provenance";
import {
  createStyleRevision,
  FROZEN_ARTIFACT_LIMIT,
  FROZEN_ARTIFACT_IDS,
  jcsSha256Hex,
  parseFrozenOutputManifestRecord,
  parseStyleRevisionRecord,
  verifyFrozenOutputManifest,
  verifyFrozenOutputManifestMetadata,
  verifyStyleRevision,
  type FrozenOutputManifestRecord,
  type RevisionManifestArtifact,
  type StyleRevisionRecord,
} from "./style-revisions";
import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";
import {
  parseProjectRecord,
  parseRecoveryRecord,
  parseStyleRecord,
  validateProjectBundle,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";
import {
  type ImportProjectBundleOutcome,
  type ProjectBundleSnapshot,
  type ProjectImportReceipt,
  type ProjectRepository,
} from "./project-repository";

export const PROJECT_PACKAGE_FORMAT = "infinidrip-project";
export const PROJECT_PACKAGE_VERSION = 3;
export const PROJECT_PACKAGE_MAX_BYTES = 256 * 1024 * 1024;
export const PROJECT_PACKAGE_MAX_CONTENT_BYTES = 256 * 1024 * 1024;
export const PROJECT_PACKAGE_MAX_ASSETS = 128;
export const PROJECT_PACKAGE_MAX_MANIFEST_BYTES = 32 * 1024 * 1024;
export const PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS = 256;
export const PROJECT_PACKAGE_MAX_FROZEN_ARTIFACTS = PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS * FROZEN_ARTIFACT_IDS.length;
export const PROJECT_PACKAGE_MAX_ZIP_ENTRIES = PROJECT_PACKAGE_MAX_ASSETS + PROJECT_PACKAGE_MAX_FROZEN_ARTIFACTS + 1;
const ZIP_EOCD_BYTES = 22;
const ZIP_EOCD_MAX_COMMENT = 0xffff;
const ZIP_LOCAL_HEADER_BYTES = 30;
const ZIP_CENTRAL_HEADER_BYTES = 46;
const ZIP_DATA_DESCRIPTOR_BYTES = 16;
const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);
const ASSET_MIME_BY_SUFFIX = Object.freeze({
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
} as const);

export type ProjectPackageErrorCode =
  | "cancelled"
  | "invalid-package"
  | "limit-exceeded"
  | "missing-asset"
  | "conflict"
  | "storage"
  | "quota-exceeded"
  | "transaction";

export class ProjectPackageError extends Error {
  readonly code: ProjectPackageErrorCode;

  constructor(code: ProjectPackageErrorCode, message: string) {
    super(message);
    this.name = "ProjectPackageError";
    this.code = code;
  }
}

export interface ProjectPackageProgress {
  readonly phase: "prepare" | "write" | "validate" | "stage" | "commit";
  readonly completedBytes: number;
  readonly totalBytes: number;
}

export interface ProjectPackageOptions {
  readonly crypto?: Crypto;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: ProjectPackageProgress) => void;
  readonly now?: () => string;
  readonly idFactory?: () => string;
  readonly revisionIdFactory?: () => string;
  readonly inspectAsset?: (file: File) => Promise<InspectedArtworkFile>;
}

export interface ProjectPackageAssetRecord {
  readonly assetId: string;
  readonly path: string;
  readonly name: string;
  readonly mimeType: keyof typeof ASSET_MIME_BY_SUFFIX;
  readonly byteLength: number;
  readonly sha256: string;
  /** Existing placement source labels are preserved verbatim; no rights claim is inferred. */
  readonly attribution: readonly string[];
}

export interface ProjectPackageManifest {
  readonly format: typeof PROJECT_PACKAGE_FORMAT;
  readonly packageVersion: 1 | 2 | typeof PROJECT_PACKAGE_VERSION;
  readonly packageSha256: string;
  readonly project: ProjectRecord;
  readonly styles: readonly StyleRecord[];
  readonly recoveries: readonly RecoveryRecord[];
  readonly fieldObservations: readonly FieldObservationRecord[];
  readonly styleRevisions: readonly StyleRevisionRecord[];
  readonly exportManifests: readonly ProjectPackageFrozenManifest[];
  readonly assets: readonly ProjectPackageAssetRecord[];
}

export interface ProjectPackageFrozenArtifact extends Omit<RevisionManifestArtifact, "bytes"> {
  readonly archivePath: string;
}

/** JSON-only metadata; exact bytes live in separately hashed ZIP members. */
export interface ProjectPackageFrozenManifest extends Omit<FrozenOutputManifestRecord, "artifacts"> {
  readonly artifacts: readonly ProjectPackageFrozenArtifact[];
}

export interface ProjectPackageEntry {
  readonly path: string;
  readonly localOffset: number;
  readonly dataOffset: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly crc32: number;
  readonly spanEnd: number;
}

export interface ProjectPackageArchive {
  readonly blob: Blob;
  readonly manifest: ProjectPackageManifest;
  readonly entries: ReadonlyMap<string, ProjectPackageEntry>;
  readonly frozenManifests: readonly FrozenOutputManifestRecord[];
  readonly packageSha256: string;
}

export type ProjectPackageImportOutcome =
  | { readonly status: "imported"; readonly projectId: string; readonly importedAsCopy: boolean }
  | { readonly status: "already-imported"; readonly receipt: ProjectImportReceipt }
  | { readonly status: "copy-required"; readonly reason: string };
type ProjectPackageImportedOutcome = Exclude<ProjectPackageImportOutcome, { readonly status: "copy-required" }>;

function progress(options: ProjectPackageOptions, phase: ProjectPackageProgress["phase"], completedBytes: number, totalBytes: number): void {
  checkCancelled(options.signal);
  options.onProgress?.({ phase, completedBytes, totalBytes });
  checkCancelled(options.signal);
}

function blobPart(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function checkCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ProjectPackageError("cancelled", "Project package operation was canceled; no project records were changed.");
}

function subtleCrypto(options: ProjectPackageOptions): SubtleCrypto {
  const subtle = (options.crypto ?? globalThis.crypto)?.subtle;
  if (!subtle) throw new ProjectPackageError("storage", "SHA-256 is unavailable in this app context.");
  return subtle;
}

async function sha256(bytes: Uint8Array, options: ProjectPackageOptions): Promise<string> {
  const directBuffer = bytes.buffer;
  let input: ArrayBuffer;
  if (directBuffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === directBuffer.byteLength) {
    input = directBuffer;
  } else {
    input = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(input).set(bytes);
  }
  const digest = await subtleCrypto(options).digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => hasOwn(value, key));
}

function mimeForAssetId(assetId: string): ProjectPackageAssetRecord["mimeType"] | null {
  const suffix = assetId.slice(assetId.lastIndexOf("-") + 1) as keyof typeof ASSET_MIME_BY_SUFFIX;
  return hasOwn(ASSET_MIME_BY_SUFFIX, suffix) ? suffix : null;
}

function assetRefs(styles: readonly StyleRecord[]): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();
  for (const style of styles) {
    for (const surface of Object.values(style.design.surface)) {
      for (const placement of surface.placements as readonly import("../surface/placement").ArtworkPlacement[]) {
        const assetId = placement.assetId;
        if (!assetId || !isLocalArtworkAssetId(assetId)) continue;
        const labels = refs.get(assetId) ?? new Set<string>();
        labels.add(placement.sourceName);
        refs.set(assetId, labels);
      }
    }
  }
  return refs;
}

function addDesignAssetRefs(refs: Map<string, Set<string>>, design: StyleRecord["design"], revisionId: string): void {
  for (const surface of Object.values(design.surface)) {
    for (const placement of surface.placements as readonly import("../surface/placement").ArtworkPlacement[]) {
      const assetId = placement.assetId;
      if (!assetId || !isLocalArtworkAssetId(assetId)) continue;
      const labels = refs.get(assetId) ?? new Set<string>();
      labels.add(`revision:${revisionId}`);
      refs.set(assetId, labels);
    }
  }
}

function historyAssetRefs(styles: readonly StyleRecord[], revisions: readonly StyleRevisionRecord[]): Map<string, Set<string>> {
  const refs = assetRefs(styles);
  for (const revision of revisions) addDesignAssetRefs(refs, revision.payload.design, revision.revisionId);
  return refs;
}

function frozenArchivePath(manifestId: string, artifactPath: string): string {
  const filename = artifactPath.slice("artifacts/".length);
  if (!/^[a-z0-9][a-z0-9-]{0,63}\.[a-z0-9]{1,8}$/.test(filename)) {
    throw new ProjectPackageError("invalid-package", "Frozen output path is not a supported artifact filename.");
  }
  return `frozen/${manifestId}/${filename}`;
}

function packageFrozenManifest(record: FrozenOutputManifestRecord): ProjectPackageFrozenManifest {
  return {
    ...record,
    artifacts: record.artifacts.map(({ bytes: _bytes, ...artifact }) => ({
      ...artifact,
      archivePath: frozenArchivePath(record.manifestId, artifact.path),
    })),
  };
}

async function normalizeSnapshotHistory(
  snapshot: ProjectBundleSnapshot,
  artworkStore: ArtworkAssetStore,
  options: ProjectPackageOptions,
): Promise<{ styles: StyleRecord[]; revisions: StyleRevisionRecord[]; manifests: FrozenOutputManifestRecord[] }> {
  const idFactory = options.revisionIdFactory ?? freshUuid;
  const usedIds = new Set<string>();
  const revisions = [...(snapshot.styleRevisions ?? [])];
  const manifests = [...(snapshot.exportManifests ?? [])];
  const styles = [...snapshot.styles];
  for (const id of [snapshot.project.id, ...styles.map((style) => style.id)]) usedIds.add(id.toLowerCase());
  const observations = new Map((snapshot.fieldObservations ?? styles.map((style) =>
    createFieldObservationRecord(style, style.updatedAt, "existing-local-style"))).map((record) => [record.styleId, record]));
  if (historyAssetRefs(styles, revisions).size > PROJECT_PACKAGE_MAX_ASSETS) {
    throw new ProjectPackageError("limit-exceeded", `A package can contain at most ${PROJECT_PACKAGE_MAX_ASSETS} referenced artwork files.`);
  }
  subtleCrypto(options);
  if (revisions.some((revision) => !styles.some((style) => style.id === revision.styleId))) {
    throw new ProjectPackageError("invalid-package", "A style revision references a style outside this project.");
  }
  for (const revision of revisions) {
    if (!parseStyleRevisionRecord(revision) || !await verifyStyleRevision(revision, options.crypto)) {
      throw new ProjectPackageError("invalid-package", `Style revision ${revision.revisionId} failed integrity validation.`);
    }
    usedIds.add(revision.revisionId.toLowerCase());
  }
  for (const manifest of manifests) {
    if (!parseFrozenOutputManifestRecord(manifest) || !await verifyFrozenOutputManifest(manifest, options.crypto)) {
      throw new ProjectPackageError("invalid-package", `Frozen output manifest ${manifest.manifestId} failed integrity validation.`);
    }
    usedIds.add(manifest.manifestId.toLowerCase());
  }
  for (let index = 0; index < styles.length; index += 1) {
    const style = styles[index]!;
    const history = revisions.filter((revision) => revision.styleId === style.id).sort((a, b) => a.revisionNumber - b.revisionNumber);
    if (history.length > 0) {
      if (!style.revisionHeadId || history[history.length - 1]?.revisionId !== style.revisionHeadId
        || history[0]?.parentRevisionId !== null || history[0]?.revisionNumber !== 1
        || history.some((revision, at) => revision.revisionNumber !== at + 1
          || revision.parentRevisionId !== (at === 0 ? null : history[at - 1]!.revisionId))
        || canonical(history[history.length - 1]!.payload.design) !== canonical(style.design)) {
        throw new ProjectPackageError("invalid-package", `Style ${style.id} does not point to the latest immutable revision.`);
      }
      continue;
    }
    if (style.revisionHeadId !== null) {
      throw new ProjectPackageError("invalid-package", `Style ${style.id} has a revision head but no included history.`);
    }
    const revisionId = uniqueUuid(idFactory, usedIds);
    const fieldObservations = observations.get(style.id);
    if (!fieldObservations) throw new ProjectPackageError("invalid-package", `Style ${style.id} has no field-history baseline.`);
    const references = new Set<string>();
    for (const surface of Object.values(style.design.surface)) {
      for (const placement of surface.placements as readonly import("../surface/placement").ArtworkPlacement[]) {
        if (placement.assetId) references.add(placement.assetId);
      }
    }
    const artwork = [];
    for (const assetId of [...references].sort()) {
      if (!isLocalArtworkAssetId(assetId)) {
        const bundled = ARTWORK_CATALOG.find((record) => record.assetId === assetId);
        if (!bundled) throw new ProjectPackageError("invalid-package", `Baseline revision artwork ${assetId} is not available in the local catalog.`);
        artwork.push({ assetId, mimeType: bundled.image.mimeType, byteLength: bundled.image.byteLength, sha256: bundled.image.sha256 });
        continue;
      }
      const asset = await artworkStore.get(assetId);
      if (!asset) throw new ProjectPackageError("missing-asset", `Baseline revision artwork ${assetId} disappeared from local storage during backup preparation.`);
      artwork.push({ assetId, mimeType: asset.mimeType, byteLength: asset.blob.size, sha256: await hashBlob(asset.blob, options) });
    }
    revisions.push(await createStyleRevision({
      styleId: style.id,
      revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: style.updatedAt,
      design: style.design,
      fieldObservations,
      artwork,
    }, options.crypto));
    styles[index] = { ...style, revisionHeadId: revisionId };
  }
  if (manifests.length > PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS) {
    throw new ProjectPackageError("limit-exceeded", `A package can include at most ${PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS} frozen output captures.`);
  }
  const revisionById = new Map(revisions.map((revision) => [revision.revisionId, revision]));
  for (const manifest of manifests) {
    const revision = revisionById.get(manifest.revisionId);
    if (!revision || revision.styleId !== manifest.styleId
      || revision.revisionContentDigest !== manifest.payload.revisionContentDigest) {
      throw new ProjectPackageError("invalid-package", `Frozen output manifest ${manifest.manifestId} does not match an included immutable revision.`);
    }
  }
  return { styles, revisions, manifests };
}

function safeAssetMetadata(asset: StoredArtworkAsset): void {
  const suffix = mimeForAssetId(asset.assetId);
  if (!isLocalArtworkAssetId(asset.assetId) || suffix === null || ASSET_MIME_BY_SUFFIX[suffix] !== asset.mimeType
    || typeof asset.name !== "string" || asset.name.length < 1 || asset.name.length > 180
    || /[\\/\u0000-\u001f\u007f]/.test(asset.name) || asset.blob.size <= 0
    || asset.blob.size > 10 * 1024 * 1024 || asset.blob.type !== asset.mimeType
    || (asset.mimeType === "image/svg+xml" && asset.blob.size > 2 * 1024 * 1024)) {
    throw new ProjectPackageError("invalid-package", "A referenced artwork record has invalid metadata or exceeds its existing file limit.");
  }
}

function concat(chunks: readonly Uint8Array[], length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function throwZipError(error: unknown): never {
  if (error instanceof ProjectPackageError) throw error;
  throw new ProjectPackageError("invalid-package", error instanceof Error ? error.message : "ZIP processing failed.");
}

async function hashBlob(
  blob: Blob,
  options: ProjectPackageOptions,
  maxBytes = 10 * 1024 * 1024,
  limitMessage = "Artwork files must be 10 MiB or smaller.",
): Promise<string> {
  if (blob.size > maxBytes) throw new ProjectPackageError("limit-exceeded", limitMessage);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return sha256(bytes, options);
}

/** Streams each artwork file into the capped, uncompressed ZIP package writer. */
export async function createProjectPackage(
  snapshot: ProjectBundleSnapshot,
  artworkStore: ArtworkAssetStore,
  options: ProjectPackageOptions = {},
): Promise<Blob> {
  const history = await normalizeSnapshotHistory(snapshot, artworkStore, options);
  const refs = historyAssetRefs(history.styles, history.revisions);
  const assetRecords: ProjectPackageAssetRecord[] = [];
  const sourceAssets: StoredArtworkAsset[] = [];
  let assetBytes = 0;
  const referenced = [...refs.keys()].sort();
  for (const assetId of referenced) {
    checkCancelled(options.signal);
    const asset = await artworkStore.get(assetId);
    if (!asset) throw new ProjectPackageError("missing-asset", `Project backup is blocked because artwork ${assetId} disappeared from local storage during backup creation.`);
    safeAssetMetadata(asset);
    assetBytes += asset.blob.size;
    if (assetBytes > PROJECT_PACKAGE_MAX_CONTENT_BYTES) {
      throw new ProjectPackageError("limit-exceeded", "Referenced artwork exceeds the 256 MiB uncompressed project-package limit.");
    }
    sourceAssets.push(asset);
  }
  let completed = 0;
  for (const asset of sourceAssets) {
    checkCancelled(options.signal);
    const assetSha = await hashBlob(asset.blob, options);
    const suffix = mimeForAssetId(asset.assetId)!;
    assetRecords.push({
      assetId: asset.assetId,
      path: `assets/${asset.assetId}`,
      name: asset.name,
      mimeType: suffix,
      byteLength: asset.blob.size,
      sha256: assetSha,
      attribution: [...refs.get(asset.assetId)!].sort(),
    });
    completed += asset.blob.size;
    progress(options, "prepare", completed, assetBytes);
  }

  const packageManifests = history.manifests.map(packageFrozenManifest);
  const frozenArtifacts = history.manifests.flatMap((record) => record.artifacts.map((artifact) => ({
    path: frozenArchivePath(record.manifestId, artifact.path),
    blob: artifact.bytes,
    byteLength: artifact.byteLength,
    sha256: artifact.sha256,
    name: artifact.displayName,
  })));
  for (const artifact of frozenArtifacts) {
    if (artifact.blob.size !== artifact.byteLength
      || await hashBlob(artifact.blob, options, FROZEN_ARTIFACT_LIMIT, "Frozen outputs must be 32 MiB or smaller.") !== artifact.sha256) {
      throw new ProjectPackageError("invalid-package", `Frozen output ${artifact.name} changed during backup creation.`);
    }
    assetBytes += artifact.byteLength;
    if (assetBytes > PROJECT_PACKAGE_MAX_CONTENT_BYTES) {
      throw new ProjectPackageError("limit-exceeded", "Project records, artwork and frozen outputs exceed the 256 MiB uncompressed package limit.");
    }
  }
  const body: Omit<ProjectPackageManifest, "packageSha256"> = {
    format: PROJECT_PACKAGE_FORMAT,
    packageVersion: PROJECT_PACKAGE_VERSION,
    project: snapshot.project,
    styles: history.styles,
    recoveries: snapshot.recoveries,
    fieldObservations: snapshot.fieldObservations ?? snapshot.styles.map((style) =>
      createFieldObservationRecord(style, style.updatedAt, "existing-local-style")),
    styleRevisions: history.revisions,
    exportManifests: packageManifests,
    assets: assetRecords,
  };
  const packageSha256 = await sha256(new TextEncoder().encode(canonical(body)), options);
  const manifest: ProjectPackageManifest = { ...body, packageSha256 };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  if (manifestBytes.byteLength > PROJECT_PACKAGE_MAX_MANIFEST_BYTES) {
    throw new ProjectPackageError("limit-exceeded", "Project manifest exceeds the 1 MiB package limit.");
  }
  const contentBytes = assetBytes;
  if (contentBytes + manifestBytes.byteLength > PROJECT_PACKAGE_MAX_CONTENT_BYTES) {
    throw new ProjectPackageError("limit-exceeded", "Project package content exceeds the 256 MiB uncompressed limit.");
  }
  const parts: BlobPart[] = [];
  let archiveBytes = 0;
  let writeCompleted = 0;
  let failure: ProjectPackageError | null = null;
  let resolveZip!: (archive: Blob) => void;
  let rejectZip!: (error: ProjectPackageError) => void;
  const result = new Promise<Blob>((resolve, reject) => { resolveZip = resolve; rejectZip = reject; });
  let zip!: Zip;
  zip = new Zip((error, chunk, final) => {
    if (failure) return;
    if (error) {
      failure = new ProjectPackageError("invalid-package", error.message);
      rejectZip(failure);
      return;
    }
    if (chunk.byteLength > 0) {
      archiveBytes += chunk.byteLength;
      if (archiveBytes > PROJECT_PACKAGE_MAX_BYTES) {
        failure = new ProjectPackageError("limit-exceeded", "Generated project backup exceeds the 256 MiB archive limit.");
        zip.terminate();
        rejectZip(failure);
        return;
      }
      parts.push(chunk);
    }
    if (final) resolveZip(new Blob(parts, { type: "application/zip" }));
  });

  try {
    const manifestFile = new ZipPassThrough("manifest.json");
    zip.add(manifestFile);
    manifestFile.push(manifestBytes, true);
    writeCompleted = manifestBytes.byteLength;
    progress(options, "write", writeCompleted, manifestBytes.byteLength + contentBytes);
    for (const record of assetRecords) {
      checkCancelled(options.signal);
      const asset = await artworkStore.get(record.assetId);
      if (!asset) throw new ProjectPackageError("missing-asset", `Artwork ${record.assetId} disappeared during backup creation.`);
      safeAssetMetadata(asset);
      if (asset.blob.size !== record.byteLength || await hashBlob(asset.blob, options) !== record.sha256) {
        throw new ProjectPackageError("invalid-package", `Artwork ${record.assetId} changed during backup creation; retry the backup.`);
      }
      const file = new ZipPassThrough(record.path);
      zip.add(file);
      let length = 0;
      const reader = asset.blob.stream().getReader();
      try {
        while (true) {
          checkCancelled(options.signal);
          const next = await reader.read();
          if (next.done) break;
          const chunk = next.value;
          length += chunk.byteLength;
          file.push(chunk);
          writeCompleted += chunk.byteLength;
          progress(options, "write", writeCompleted, manifestBytes.byteLength + contentBytes);
        }
        file.push(new Uint8Array(0), true);
      } finally {
        reader.releaseLock();
      }
      if (length !== record.byteLength) {
        throw new ProjectPackageError("invalid-package", `Artwork ${record.assetId} changed during backup creation; retry the backup.`);
      }
    }
    for (const artifact of frozenArtifacts) {
      checkCancelled(options.signal);
      const file = new ZipPassThrough(artifact.path);
      zip.add(file);
      let length = 0;
      const reader = artifact.blob.stream().getReader();
      try {
        while (true) {
          checkCancelled(options.signal);
          const next = await reader.read();
          if (next.done) break;
          const chunk = next.value;
          length += chunk.byteLength;
          file.push(chunk);
          writeCompleted += chunk.byteLength;
          progress(options, "write", writeCompleted, manifestBytes.byteLength + contentBytes);
        }
        file.push(new Uint8Array(0), true);
      } finally {
        reader.releaseLock();
      }
      if (length !== artifact.byteLength) {
        throw new ProjectPackageError("invalid-package", `Frozen output ${artifact.name} changed during backup creation.`);
      }
    }
    zip.end();
    return await result;
  } catch (error) {
    const packageError = error instanceof ProjectPackageError ? error
      : new ProjectPackageError("invalid-package", error instanceof Error ? error.message : "ZIP processing failed.");
    failure = packageError;
    zip.terminate();
    rejectZip(packageError);
    await result.catch(() => undefined);
    throw packageError;
  }
}

function findEocd(bytes: Uint8Array, absoluteStart: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - ZIP_EOCD_BYTES; offset >= Math.max(0, bytes.length - ZIP_EOCD_BYTES - ZIP_EOCD_MAX_COMMENT); offset -= 1) {
    if (view.getUint32(offset, true) !== 0x06054b50) continue;
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + ZIP_EOCD_BYTES + commentLength === bytes.length) return absoluteStart + offset;
  }
  throw new ProjectPackageError("invalid-package", "The selected file is not a complete supported ZIP project package.");
}

function asciiName(bytes: Uint8Array): string {
  if (bytes.some((byte) => byte > 0x7f)) throw new ProjectPackageError("invalid-package", "Package entry names must be safe ASCII paths.");
  return String.fromCharCode(...bytes);
}

async function preflightZip(blob: Blob): Promise<Map<string, ProjectPackageEntry>> {
  if (blob.size < ZIP_EOCD_BYTES || blob.size > PROJECT_PACKAGE_MAX_BYTES) {
    throw new ProjectPackageError("limit-exceeded", "Project backup must be a ZIP archive no larger than 256 MiB.");
  }
  const tailStart = Math.max(0, blob.size - ZIP_EOCD_BYTES - ZIP_EOCD_MAX_COMMENT);
  const tail = new Uint8Array(await blob.slice(tailStart).arrayBuffer());
  const eocdOffset = findEocd(tail, tailStart);
  const eocdInTail = eocdOffset - tailStart;
  const end = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const disk = end.getUint16(eocdInTail + 4, true);
  const directoryDisk = end.getUint16(eocdInTail + 6, true);
  const diskCount = end.getUint16(eocdInTail + 8, true);
  const count = end.getUint16(eocdInTail + 10, true);
  const directoryBytes = end.getUint32(eocdInTail + 12, true);
  const directoryOffset = end.getUint32(eocdInTail + 16, true);
  const commentLength = end.getUint16(eocdInTail + 20, true);
  if (disk !== 0 || directoryDisk !== 0 || diskCount !== count || count < 1
    || count > PROJECT_PACKAGE_MAX_ZIP_ENTRIES || count === 0xffff
    || directoryBytes === 0xffffffff || directoryOffset === 0xffffffff
    || commentLength !== 0 || directoryBytes > PROJECT_PACKAGE_MAX_MANIFEST_BYTES
    || directoryOffset + directoryBytes !== eocdOffset) {
    throw new ProjectPackageError("invalid-package", "ZIP uses multiple disks, ZIP64, comments, or inconsistent directory limits.");
  }
  const directory = new Uint8Array(await blob.slice(directoryOffset, directoryOffset + directoryBytes).arrayBuffer());
  const view = new DataView(directory.buffer, directory.byteOffset, directory.byteLength);
  const entries = new Map<string, ProjectPackageEntry>();
  let position = 0;
  let expectedLocalOffset = 0;
  for (let index = 0; index < count; index += 1) {
    if (position + ZIP_CENTRAL_HEADER_BYTES > directory.byteLength || view.getUint32(position, true) !== 0x02014b50) {
      throw new ProjectPackageError("invalid-package", "ZIP central directory is truncated or malformed.");
    }
    const versionNeeded = view.getUint16(position + 6, true);
    const flags = view.getUint16(position + 8, true);
    const method = view.getUint16(position + 10, true);
    const crc = view.getUint32(position + 16, true);
    const compressedSize = view.getUint32(position + 20, true);
    const uncompressedSize = view.getUint32(position + 24, true);
    const nameLength = view.getUint16(position + 28, true);
    const extraLength = view.getUint16(position + 30, true);
    const commentSize = view.getUint16(position + 32, true);
    const startDisk = view.getUint16(position + 34, true);
    const internalAttributes = view.getUint16(position + 36, true);
    const externalAttributes = view.getUint32(position + 38, true);
    const localOffset = view.getUint32(position + 42, true);
    const fullLength = ZIP_CENTRAL_HEADER_BYTES + nameLength + extraLength + commentSize;
    if (position + fullLength > directory.byteLength || versionNeeded > 20 || flags !== 0x0008 || method !== 0
      || compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff
      || compressedSize !== uncompressedSize || startDisk !== 0 || internalAttributes !== 0 || externalAttributes !== 0
      || nameLength < 1 || nameLength > 220 || extraLength !== 0 || commentSize !== 0
      || localOffset !== expectedLocalOffset) {
      throw new ProjectPackageError("invalid-package", "ZIP entry uses an unsupported feature or exceeds a strict package boundary.");
    }
    const path = asciiName(directory.subarray(position + ZIP_CENTRAL_HEADER_BYTES, position + ZIP_CENTRAL_HEADER_BYTES + nameLength));
    if (entries.has(path)) throw new ProjectPackageError("invalid-package", `ZIP contains duplicate entry ${path}.`);
    const localBytes = new Uint8Array(await blob.slice(localOffset, localOffset + ZIP_LOCAL_HEADER_BYTES + nameLength).arrayBuffer());
    if (localBytes.byteLength !== ZIP_LOCAL_HEADER_BYTES + nameLength) {
      throw new ProjectPackageError("invalid-package", `ZIP local header for ${path} is truncated.`);
    }
    const local = new DataView(localBytes.buffer, localBytes.byteOffset, localBytes.byteLength);
    if (local.getUint32(0, true) !== 0x04034b50 || local.getUint16(6, true) !== flags
      || local.getUint16(8, true) !== method || local.getUint32(14, true) !== 0
      || local.getUint32(18, true) !== 0 || local.getUint32(22, true) !== 0
      || local.getUint16(26, true) !== nameLength || local.getUint16(28, true) !== 0
      || asciiName(localBytes.subarray(ZIP_LOCAL_HEADER_BYTES)) !== path) {
      throw new ProjectPackageError("invalid-package", `ZIP local header for ${path} does not match its directory record.`);
    }
    const dataOffset = localOffset + ZIP_LOCAL_HEADER_BYTES + nameLength;
    const descriptorOffset = dataOffset + compressedSize;
    const descriptor = new Uint8Array(await blob.slice(descriptorOffset, descriptorOffset + ZIP_DATA_DESCRIPTOR_BYTES).arrayBuffer());
    if (descriptor.byteLength !== ZIP_DATA_DESCRIPTOR_BYTES) throw new ProjectPackageError("invalid-package", `ZIP data descriptor for ${path} is truncated.`);
    const descriptorView = new DataView(descriptor.buffer, descriptor.byteOffset, descriptor.byteLength);
    if (descriptorView.getUint32(0, true) !== 0x08074b50 || descriptorView.getUint32(4, true) !== crc
      || descriptorView.getUint32(8, true) !== compressedSize || descriptorView.getUint32(12, true) !== uncompressedSize) {
      throw new ProjectPackageError("invalid-package", `ZIP data descriptor for ${path} is inconsistent.`);
    }
    const spanEnd = descriptorOffset + ZIP_DATA_DESCRIPTOR_BYTES;
    if (spanEnd > directoryOffset) throw new ProjectPackageError("invalid-package", `ZIP entry ${path} overlaps the central directory.`);
    entries.set(path, { path, localOffset, dataOffset, compressedSize, uncompressedSize, crc32: crc, spanEnd });
    expectedLocalOffset = spanEnd;
    position += fullLength;
  }
  if (position !== directory.byteLength || expectedLocalOffset !== directoryOffset || !entries.has("manifest.json")) {
    throw new ProjectPackageError("invalid-package", "ZIP contains unlisted bytes, unsupported entries, or no leading manifest.");
  }
  const ordered = [...entries.values()];
  if (ordered[0]?.path !== "manifest.json") throw new ProjectPackageError("invalid-package", "The package manifest must be the first ZIP entry.");
  for (const entry of ordered.slice(1)) {
    if (!/^assets\/local-[0-9a-f]{32}-(?:png|jpg|webp|svg)$/i.test(entry.path)
      && !/^frozen\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[a-z0-9][a-z0-9-]{0,63}\.[a-z0-9]{1,8}$/i.test(entry.path)) {
      throw new ProjectPackageError("invalid-package", `ZIP entry path ${entry.path} is not a supported local artwork or frozen-output path.`);
    }
  }
  return entries;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    table[index] = crc >>> 0;
  }
  return table;
})();

function updateCrc32(crc: number, bytes: Uint8Array): number {
  let current = crc;
  for (const byte of bytes) current = CRC_TABLE[(current ^ byte) & 0xff]! ^ (current >>> 8);
  return current >>> 0;
}

async function inflateStoredEntry(
  blob: Blob,
  entry: ProjectPackageEntry,
  options: ProjectPackageOptions,
  phase: "validate" | "stage",
  completedBefore: number,
  total: number,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  let crc = 0xffffffff;
  let fileCount = 0;
  let outputFailure: Error | null = null;
  let settled = false;
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const completed = new Promise<void>((resolve, reject) => {
    finish = () => { if (!settled) { settled = true; resolve(); } };
    fail = (error) => { if (!settled) { settled = true; reject(error); } };
  });
  void completed.catch(() => undefined);
  const unzip = new Unzip((file) => {
    fileCount += 1;
    if (fileCount !== 1 || file.name !== entry.path || file.compression !== 0) {
      outputFailure = new Error("ZIP streaming reader found an unexpected member or compression method.");
      fail(outputFailure);
      return;
    }
    file.ondata = (error, chunk, final) => {
      if (error) {
        outputFailure = error;
        fail(error);
        return;
      }
      if (chunk.byteLength > 0) {
        length += chunk.byteLength;
        if (length > entry.uncompressedSize || length > PROJECT_PACKAGE_MAX_CONTENT_BYTES) {
          outputFailure = new Error("ZIP entry expands beyond its declared size.");
          fail(outputFailure);
          return;
        }
        crc = updateCrc32(crc, chunk);
        chunks.push(chunk.slice());
        progress(options, phase, completedBefore + length, total);
      }
      if (final) finish();
    };
    file.start();
  });
  unzip.register(UnzipPassThrough);
  try {
    const reader = blob.slice(entry.localOffset, entry.spanEnd).stream().getReader();
    try {
      while (true) {
        checkCancelled(options.signal);
        const chunk = await reader.read();
        if (chunk.done) {
          unzip.push(new Uint8Array(0), true);
          if (fileCount === 0 && !settled) fail(new Error("ZIP streaming reader found no file for the selected entry."));
          break;
        }
        unzip.push(chunk.value, false);
      }
    } finally {
      reader.releaseLock();
    }
    await completed;
  } catch (error) {
    throwZipError(outputFailure ?? error);
  }
  if (fileCount !== 1 || length !== entry.uncompressedSize || ((crc ^ 0xffffffff) >>> 0) !== entry.crc32) {
    throw new ProjectPackageError("invalid-package", `ZIP entry ${entry.path} failed its size or CRC check.`);
  }
  return concat(chunks, length);
}

function parsePackageFrozenManifest(value: unknown): ProjectPackageFrozenManifest {
  if (typeof value !== "object" || value === null || Array.isArray(value)
    || !Array.isArray((value as Record<string, unknown>).artifacts)) {
    throw new ProjectPackageError("invalid-package", "Frozen output manifest metadata is malformed.");
  }
  const raw = value as Record<string, unknown>;
  const rawArtifacts = raw.artifacts as unknown[];
  const artifacts = rawArtifacts.map((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new ProjectPackageError("invalid-package", "Frozen output artifact metadata is malformed.");
    }
    const artifact = entry as Record<string, unknown>;
    if (typeof artifact.byteLength !== "number" || !Number.isSafeInteger(artifact.byteLength)
      || artifact.byteLength < 1 || typeof artifact.path !== "string"
      || typeof raw.manifestId !== "string" || artifact.archivePath !== frozenArchivePath(raw.manifestId, artifact.path)) {
      throw new ProjectPackageError("invalid-package", "Frozen output archive paths or byte limits are invalid.");
    }
    return {
      artifactId: artifact.artifactId,
      path: artifact.path,
      displayName: artifact.displayName,
      mediaType: artifact.mediaType,
      byteLength: artifact.byteLength,
      sha256: artifact.sha256,
      bytes: metadataOnlyBlob(artifact.byteLength),
    };
  });
  const parsed = parseFrozenOutputManifestRecord({ ...raw, artifacts });
  if (!parsed) throw new ProjectPackageError("invalid-package", "Frozen output manifest metadata failed strict validation.");
  return { ...parsed, artifacts: rawArtifacts as ProjectPackageFrozenArtifact[] };
}

function metadataOnlyBlob(size: number): Blob {
  const placeholder = Object.create(Blob.prototype) as Blob;
  Object.defineProperty(placeholder, "size", { value: size, enumerable: true });
  return placeholder;
}

function validateManifestShape(value: unknown): ProjectPackageManifest {
  const version = typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>).packageVersion : undefined;
  const expectedKeys = version === 1
    ? ["format", "packageVersion", "packageSha256", "project", "styles", "recoveries", "assets"]
    : version === 2
      ? ["format", "packageVersion", "packageSha256", "project", "styles", "recoveries", "fieldObservations", "assets"]
      : ["format", "packageVersion", "packageSha256", "project", "styles", "recoveries", "fieldObservations", "styleRevisions", "exportManifests", "assets"];
  if (!exactObject(value, expectedKeys)
    || value.format !== PROJECT_PACKAGE_FORMAT || (value.packageVersion !== 1 && value.packageVersion !== 2 && value.packageVersion !== PROJECT_PACKAGE_VERSION)
    || typeof value.packageSha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.packageSha256)
    || !Array.isArray(value.styles) || !Array.isArray(value.recoveries) || !Array.isArray(value.assets)
    || (value.packageVersion >= 2 && !Array.isArray(value.fieldObservations))
    || (value.packageVersion === PROJECT_PACKAGE_VERSION && (!Array.isArray(value.styleRevisions) || !Array.isArray(value.exportManifests)))) {
    throw new ProjectPackageError("invalid-package", "Project package manifest is incomplete, unknown, or unsupported.");
  }
  const project = parseProjectRecord(value.project);
  if (!project.ok) throw new ProjectPackageError("invalid-package", project.error);
  const styles = value.styles.map((style) => {
    // Package v1 predates semantic edit documents. Its style record used the
    // prior v2 design shape even when its style schema marker was 3, so map
    // that exact legacy package case through the existing v2 upgrader.
    const legacyV1Style = value.packageVersion === 1
      && typeof style === "object" && style !== null && !Array.isArray(style)
      && (style as Record<string, unknown>).schemaVersion === 3
      && typeof (style as Record<string, unknown>).design === "object"
      && (style as Record<string, unknown>).design !== null
      && !Object.prototype.hasOwnProperty.call((style as Record<string, unknown>).design, "semanticEdits");
    const parsed = parseStyleRecord(legacyV1Style
      ? { ...(style as Record<string, unknown>), schemaVersion: 2 }
      : style);
    if (!parsed.ok) throw new ProjectPackageError("invalid-package", parsed.error);
    return parsed.value;
  });
  const bundle = validateProjectBundle(project.value, styles);
  if (!bundle.ok) throw new ProjectPackageError("invalid-package", bundle.error);
  const styleIds = new Set(styles.map((style) => style.id));
  const suppliedFieldObservations = Array.isArray(value.fieldObservations) ? value.fieldObservations : [];
  const recoveries = value.recoveries.map((recovery) => {
    const parsed = parseRecoveryRecord(recovery);
    if (!parsed.ok) throw new ProjectPackageError("invalid-package", parsed.error);
    if (!styleIds.has(parsed.value.styleId)) throw new ProjectPackageError("invalid-package", "Recovery data must reference a style in this project.");
    return parsed.value;
  });
  if (new Set(recoveries.map((recovery) => recovery.styleId)).size !== recoveries.length) {
    throw new ProjectPackageError("invalid-package", "Manifest has multiple recovery records for one style.");
  }
  const fieldObservations: FieldObservationRecord[] = value.packageVersion === 1
    ? bundle.value.styles.map((style) => createFieldObservationRecord(style, style.updatedAt, "package-v1"))
    : suppliedFieldObservations.map((record) => {
      const parsed = parseFieldObservationRecord(record);
      if (!parsed.ok) throw new ProjectPackageError("invalid-package", parsed.error);
      if (!styleIds.has(parsed.value.styleId)) {
        throw new ProjectPackageError("invalid-package", "Field history must reference a style in this project.");
      }
      return parsed.value;
    });
  if (fieldObservations.length !== styles.length
    || new Set(fieldObservations.map((record) => record.styleId)).size !== fieldObservations.length
    || styles.some((style) => !fieldObservations.some((record) => record.styleId === style.id))) {
    throw new ProjectPackageError("invalid-package", "Every style must have exactly one source-aware field history record.");
  }
  const suppliedRevisions = Array.isArray(value.styleRevisions) ? value.styleRevisions : [];
  const styleRevisions: StyleRevisionRecord[] = value.packageVersion < 3 ? [] : suppliedRevisions.map((revision: unknown) => {
    const parsed = parseStyleRevisionRecord(revision);
    if (!parsed || !styleIds.has(parsed.styleId)) {
      throw new ProjectPackageError("invalid-package", "A style revision is malformed or references a style outside this project.");
    }
    return parsed;
  });
  if (new Set(styleRevisions.map((revision) => revision.revisionId)).size !== styleRevisions.length) {
    throw new ProjectPackageError("invalid-package", "Package style revision IDs are duplicated.");
  }
  for (const style of styles) {
    const history = styleRevisions.filter((revision) => revision.styleId === style.id)
      .sort((left, right) => left.revisionNumber - right.revisionNumber);
    if (history.length === 0) {
      if (value.packageVersion === 3 || style.revisionHeadId !== null) {
        throw new ProjectPackageError("invalid-package", `Style ${style.id} is missing its immutable revision history.`);
      }
      continue;
    }
    if (history[0]!.revisionNumber !== 1 || history[0]!.parentRevisionId !== null
      || history.some((revision, index) => revision.revisionNumber !== index + 1
        || revision.parentRevisionId !== (index === 0 ? null : history[index - 1]!.revisionId))
      || style.revisionHeadId !== history[history.length - 1]!.revisionId) {
      throw new ProjectPackageError("invalid-package", `Style ${style.id} revision history is not a complete parent-linked chain.`);
    }
  }
  const suppliedManifests = Array.isArray(value.exportManifests) ? value.exportManifests : [];
  const exportManifests: ProjectPackageFrozenManifest[] = value.packageVersion < 3 ? [] : suppliedManifests.map(parsePackageFrozenManifest);
  if (exportManifests.length > PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS) {
    throw new ProjectPackageError("limit-exceeded", "Package contains too many frozen output captures or artifacts.");
  }
  const revisionIds = new Set(styleRevisions.map((revision) => revision.revisionId));
  if (exportManifests.some((manifest) => !styleIds.has(manifest.styleId) || !revisionIds.has(manifest.revisionId))) {
    throw new ProjectPackageError("invalid-package", "A frozen output capture references a missing style or revision.");
  }
  if (value.assets.length > PROJECT_PACKAGE_MAX_ASSETS) {
    throw new ProjectPackageError("limit-exceeded", `A package can contain at most ${PROJECT_PACKAGE_MAX_ASSETS} artwork files.`);
  }
  const assets = value.assets.map((asset): ProjectPackageAssetRecord => {
    const keys = ["assetId", "path", "name", "mimeType", "byteLength", "sha256", "attribution"];
    if (!exactObject(asset, keys) || typeof asset.assetId !== "string" || !isLocalArtworkAssetId(asset.assetId)
      || typeof asset.path !== "string" || asset.path !== `assets/${asset.assetId}`
      || typeof asset.name !== "string" || asset.name.length < 1 || asset.name.length > 180
      || /[\\/\u0000-\u001f\u007f]/.test(asset.name)
      || typeof asset.mimeType !== "string" || !hasOwn(ASSET_MIME_BY_SUFFIX, asset.mimeType)
      || mimeForAssetId(asset.assetId) !== asset.mimeType
      || typeof asset.byteLength !== "number" || !Number.isSafeInteger(asset.byteLength) || asset.byteLength < 1
      || asset.byteLength > 10 * 1024 * 1024 || (asset.mimeType === "svg" && asset.byteLength > 2 * 1024 * 1024)
      || typeof asset.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(asset.sha256)
      || !Array.isArray(asset.attribution) || !asset.attribution.every((label) => typeof label === "string")) {
      throw new ProjectPackageError("invalid-package", "Project package asset metadata is malformed or exceeds the local artwork limits.");
    }
    if (new Set(asset.attribution).size !== asset.attribution.length) {
      throw new ProjectPackageError("invalid-package", "Project package asset attribution labels are duplicated.");
    }
    return asset as unknown as ProjectPackageAssetRecord;
  });
  if (new Set(assets.map((asset) => asset.assetId)).size !== assets.length) {
    throw new ProjectPackageError("invalid-package", "Project package asset IDs are duplicated.");
  }
  const refs = historyAssetRefs(styles, styleRevisions);
  if (refs.size !== assets.length) throw new ProjectPackageError("invalid-package", "Manifest artwork does not exactly match the current and historical local artwork references.");
  for (const asset of assets) {
    const labels = [...(refs.get(asset.assetId) ?? [])].sort();
    if (JSON.stringify(labels) !== JSON.stringify([...asset.attribution].sort())) {
      throw new ProjectPackageError("invalid-package", `Attribution labels for ${asset.assetId} do not match the saved placements.`);
    }
  }
  return {
    format: PROJECT_PACKAGE_FORMAT,
    packageVersion: value.packageVersion as ProjectPackageManifest["packageVersion"],
    packageSha256: value.packageSha256,
    project: project.value,
    styles: bundle.value.styles,
    recoveries,
    fieldObservations,
    styleRevisions,
    exportManifests,
    assets,
  };
}

export async function readProjectPackage(
  blob: Blob,
  options: ProjectPackageOptions = {},
): Promise<ProjectPackageArchive> {
  const entries = await preflightZip(blob);
  const manifestEntry = entries.get("manifest.json")!;
  if (manifestEntry.uncompressedSize > PROJECT_PACKAGE_MAX_MANIFEST_BYTES) {
    throw new ProjectPackageError("limit-exceeded", "Project package manifest exceeds the 32 MiB limit.");
  }
  const manifestBytes = await inflateStoredEntry(blob, manifestEntry, options, "validate", 0, manifestEntry.uncompressedSize);
  let parsed: unknown;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes);
    parsed = JSON.parse(text);
  } catch {
    throw new ProjectPackageError("invalid-package", "Project package manifest is not valid UTF-8 JSON.");
  }
  const manifest = validateManifestShape(parsed);
  const expectedEntries = new Map<string, number>();
  for (const asset of manifest.assets) expectedEntries.set(asset.path, asset.byteLength);
  for (const frozen of manifest.exportManifests) {
    for (const artifact of frozen.artifacts) expectedEntries.set(artifact.archivePath, artifact.byteLength);
  }
  if (entries.size !== expectedEntries.size + 1) throw new ProjectPackageError("invalid-package", "ZIP files and manifest asset entries do not match exactly.");
  // Preflight pins the manifest first. Its exact count, unique paths, and this
  // membership/length pass prove every expected member exists.
  for (const entry of [...entries.values()].slice(1)) {
    const expectedLength = expectedEntries.get(entry.path);
    if (expectedLength === undefined || entry.uncompressedSize !== expectedLength) {
      throw new ProjectPackageError("invalid-package", `ZIP member ${entry.path} does not match its manifest record.`);
    }
  }
  const rawManifest = parsed as Record<string, unknown>;
  const packageSha256 = rawManifest.packageSha256 as string;
  const { packageSha256: _digest, ...body } = rawManifest;
  const actualDigest = await sha256(new TextEncoder().encode(canonical(body)), options);
  if (actualDigest !== packageSha256) throw new ProjectPackageError("invalid-package", "Project package manifest SHA-256 does not match its contents.");
  for (const revision of manifest.styleRevisions) {
    if (!await verifyStyleRevision(revision, options.crypto)) {
      throw new ProjectPackageError("invalid-package", `Style revision ${revision.revisionId} failed its content digest.`);
    }
  }
  const frozenManifests: FrozenOutputManifestRecord[] = [];
  for (const metadata of manifest.exportManifests) {
    const artifacts: RevisionManifestArtifact[] = [];
    for (const artifact of metadata.artifacts) {
      const entry = entries.get(artifact.archivePath)!;
      // Exact member-set validation above proves this lookup exists.
      const bytes = await inflateStoredEntry(blob, entry, options, "validate", 0, entry.uncompressedSize);
      if (bytes.byteLength !== artifact.byteLength || await sha256(bytes, options) !== artifact.sha256) {
        throw new ProjectPackageError("invalid-package", `Frozen output ${artifact.artifactId} failed its byte digest.`);
      }
      artifacts.push({
        artifactId: artifact.artifactId,
        path: artifact.path,
        displayName: artifact.displayName,
        mediaType: artifact.mediaType,
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
        bytes: new Blob([blobPart(bytes)], { type: artifact.mediaType }),
      });
    }
    const record = { ...metadata, artifacts } as FrozenOutputManifestRecord;
    if (!parseFrozenOutputManifestRecord(record) || !await verifyFrozenOutputManifestMetadata(record, options.crypto)) {
      throw new ProjectPackageError("invalid-package", `Frozen output manifest ${metadata.manifestId} failed its metadata digest.`);
    }
    const revision = manifest.styleRevisions.find((candidate) => candidate.revisionId === record.revisionId);
    if (!revision || revision.revisionContentDigest !== record.payload.revisionContentDigest || revision.styleId !== record.styleId) {
      throw new ProjectPackageError("invalid-package", `Frozen output manifest ${record.manifestId} does not match its pinned style revision.`);
    }
    frozenManifests.push(record);
  }
  return { blob, manifest, entries, frozenManifests, packageSha256 };
}

async function validateArchiveAssets(
  archive: ProjectPackageArchive,
  options: ProjectPackageOptions,
): Promise<void> {
  const total = archive.entries.get("manifest.json")!.uncompressedSize
    + archive.manifest.assets.reduce((sum, asset) => sum + asset.byteLength, 0);
  let completed = archive.entries.get("manifest.json")!.uncompressedSize;
  const inspect = options.inspectAsset ?? ((file: File) => inspectArtworkFile(file));
  for (const record of archive.manifest.assets) {
    checkCancelled(options.signal);
    const entry = archive.entries.get(record.path);
    if (!entry) throw new ProjectPackageError("invalid-package", `Package asset ${record.assetId} has no ZIP entry.`);
    const bytes = await inflateStoredEntry(archive.blob, entry, options, "validate", completed, total);
    if (await sha256(bytes, options) !== record.sha256) throw new ProjectPackageError("invalid-package", `Artwork ${record.assetId} failed its SHA-256 check.`);
    const file = new File([blobPart(bytes)], record.name, { type: ASSET_MIME_BY_SUFFIX[record.mimeType] });
    let inspected: InspectedArtworkFile;
    try {
      inspected = await inspect(file);
    } catch (error) {
      throw new ProjectPackageError("invalid-package", `Artwork ${record.name} failed the local safe-image validator: ${error instanceof Error ? error.message : "invalid image"}`);
    }
    if (inspected.mimeType !== ASSET_MIME_BY_SUFFIX[record.mimeType]
      || inspected.blob.size !== record.byteLength || await hashBlob(inspected.blob, options) !== record.sha256) {
      throw new ProjectPackageError("invalid-package", `Artwork ${record.name} changed during safe-image validation.`);
    }
    completed += bytes.byteLength;
  }
}

function copyName(name: string): string {
  const prefix = "Copy of ";
  return `${prefix}${name}`.slice(0, 80);
}

function remapDesign(style: StyleRecord, assets: ReadonlyMap<string, string>): StyleRecord["design"] {
  return remapSavedDesign(style.design, assets);
}

function remapSavedDesign(design: StyleRecord["design"], assets: ReadonlyMap<string, string>): StyleRecord["design"] {
  const surface = Object.fromEntries(Object.entries(design.surface).map(([key, record]) => [key, {
    ...record,
    placements: (record.placements as readonly import("../surface/placement").ArtworkPlacement[]).map((placement) => {
      const assetId = placement.assetId;
      return assetId && assets.has(assetId) ? { ...placement, assetId: assets.get(assetId)! } : placement;
    }),
  }]));
  return { ...design, surface };
}

async function verifiedAssetBlob(
  archive: ProjectPackageArchive,
  asset: ProjectPackageAssetRecord,
  options: ProjectPackageOptions,
  completedBytes: number,
  totalBytes: number,
): Promise<Blob> {
  const entry = archive.entries.get(asset.path);
  if (!entry) throw new ProjectPackageError("invalid-package", `Artwork ${asset.assetId} is missing from the ZIP.`);
  const bytes = await inflateStoredEntry(archive.blob, entry, options, "stage", completedBytes, totalBytes);
  if (bytes.byteLength !== asset.byteLength || await sha256(bytes, options) !== asset.sha256) {
    throw new ProjectPackageError("invalid-package", `Artwork ${asset.assetId} changed between validation and staging.`);
  }
  const inspect = options.inspectAsset ?? ((file: File) => inspectArtworkFile(file));
  const inspected = await inspect(new File([blobPart(bytes)], asset.name, { type: ASSET_MIME_BY_SUFFIX[asset.mimeType] }));
  if (inspected.mimeType !== ASSET_MIME_BY_SUFFIX[asset.mimeType]
    || await hashBlob(inspected.blob, options) !== asset.sha256) {
    throw new ProjectPackageError("invalid-package", `Artwork ${asset.name} changed during validation.`);
  }
  return inspected.blob;
}

async function makeCopy(
  manifest: ProjectPackageManifest,
  frozenManifests: readonly FrozenOutputManifestRecord[],
  packageSha256: string,
  assetMap: ReadonlyMap<string, string>,
  now: string,
  idFactory: () => string,
  crypto?: Crypto,
): Promise<{
  project: ProjectRecord;
  styles: StyleRecord[];
  recoveries: RecoveryRecord[];
  fieldObservations: FieldObservationRecord[];
  styleRevisions: StyleRevisionRecord[];
  exportManifests: FrozenOutputManifestRecord[];
}> {
  const usedIds = new Set([
    manifest.project.id,
    ...manifest.project.styleIds,
    ...manifest.styleRevisions.map((revision) => revision.revisionId),
    ...frozenManifests.map((record) => record.manifestId),
  ].map((id) => id.toLowerCase()));
  const projectId = uniqueUuid(idFactory, usedIds);
  const styleIds = new Map(manifest.styles.map((style) => [style.id, uniqueUuid(idFactory, usedIds)]));
  const revisionIds = new Map(manifest.styleRevisions.map((revision) => [revision.revisionId, uniqueUuid(idFactory, usedIds)]));
  const manifestIds = new Map(frozenManifests.map((record) => [record.manifestId, uniqueUuid(idFactory, usedIds)]));
  const project: ProjectRecord = {
    ...manifest.project,
    id: projectId,
    name: copyName(manifest.project.name),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    styleIds: manifest.project.styleIds.map((id) => styleIds.get(id)!),
    activeStyleId: styleIds.get(manifest.project.activeStyleId)!,
    importedFrom: {
      projectId: manifest.project.id,
      styleIds: [...manifest.project.styleIds],
      packageSha256,
    },
  };
  const styles = manifest.styles.map((style) => ({
    ...style,
    id: styleIds.get(style.id)!,
    projectId,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    revisionHeadId: style.revisionHeadId === null ? null : revisionIds.get(style.revisionHeadId)!,
    archivedAt: style.archivedAt === null ? null : now,
    design: remapDesign(style, assetMap),
  }));
  const recoveries = manifest.recoveries.map((recovery) => ({
    ...recovery,
    styleId: styleIds.get(recovery.styleId)!,
  }));
  const fieldObservations = manifest.fieldObservations.map((record) =>
    remapFieldObservationStyleId(record, styleIds.get(record.styleId)!));
  const styleRevisions: StyleRevisionRecord[] = [];
  for (const revision of manifest.styleRevisions) {
    const styleId = styleIds.get(revision.styleId)!;
    const revisionId = revisionIds.get(revision.revisionId)!;
    const parentRevisionId = revision.parentRevisionId === null ? null : revisionIds.get(revision.parentRevisionId)!;
    styleRevisions.push(await createStyleRevision({
      styleId,
      revisionId,
      parentRevisionId,
      revisionNumber: revision.revisionNumber,
      createdAt: revision.createdAt,
      design: remapSavedDesign(revision.payload.design, assetMap),
      fieldObservations: remapFieldObservationStyleId(revision.payload.fieldObservations, styleId),
      artwork: revision.payload.artwork.map((asset) => ({
        ...asset,
        assetId: assetMap.get(asset.assetId) ?? asset.assetId,
      })),
    }, crypto));
  }
  const revisionById = new Map(styleRevisions.map((revision) => [revision.revisionId, revision]));
  const exportManifests: FrozenOutputManifestRecord[] = [];
  for (const frozen of frozenManifests) {
    const styleId = styleIds.get(frozen.styleId)!;
    const revisionId = revisionIds.get(frozen.revisionId)!;
    const revision = revisionById.get(revisionId);
    if (!revision) throw new ProjectPackageError("invalid-package", `Frozen output ${frozen.manifestId} points to a missing copied revision.`);
    const payload = {
      ...frozen.payload,
      styleId,
      revisionId,
      revisionContentDigest: revision.revisionContentDigest,
    };
    const record: FrozenOutputManifestRecord = {
      ...frozen,
      manifestId: manifestIds.get(frozen.manifestId)!,
      styleId,
      revisionId,
      payload,
      packetDigest: await jcsSha256Hex(payload, crypto),
      artifacts: frozen.artifacts,
    };
    if (!parseFrozenOutputManifestRecord(record) || !await verifyFrozenOutputManifest(record, crypto)) {
      throw new ProjectPackageError("invalid-package", `Copied frozen output ${record.manifestId} failed integrity validation.`);
    }
    exportManifests.push(record);
  }
  return { project, styles, recoveries, fieldObservations, styleRevisions, exportManifests };
}

function canonicalNow(): string {
  return new Date().toISOString();
}

function freshUuid(): string {
  if (!globalThis.crypto?.randomUUID) throw new ProjectPackageError("storage", "Secure IDs are unavailable; import was not started.");
  return globalThis.crypto.randomUUID();
}

function uniqueUuid(idFactory: () => string, used: Set<string>): string {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const value = idFactory();
    if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      && !used.has(value.toLowerCase())) {
      used.add(value.toLowerCase());
      return value;
    }
  }
  throw new ProjectPackageError("storage", "Secure, unique project IDs could not be created; import was not started.");
}

function canonicalTimestamp(now: string): string {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== now) throw new ProjectPackageError("invalid-package", "Import time must be canonical UTC ISO time.");
  return now;
}

/** Verifies the whole archive before writing, stages artwork, then commits records atomically. */
export function importProjectPackage(
  repository: ProjectRepository,
  artworkStore: ArtworkAssetStore,
  archive: ProjectPackageArchive,
  asCopy: true,
  options?: ProjectPackageOptions,
): Promise<ProjectPackageImportedOutcome>;
export function importProjectPackage(
  repository: ProjectRepository,
  artworkStore: ArtworkAssetStore,
  archive: ProjectPackageArchive,
  asCopy: false,
  options?: ProjectPackageOptions,
): Promise<ProjectPackageImportOutcome>;
export async function importProjectPackage(
  repository: ProjectRepository,
  artworkStore: ArtworkAssetStore,
  archive: ProjectPackageArchive,
  asCopy: boolean,
  options: ProjectPackageOptions = {},
): Promise<ProjectPackageImportOutcome> {
  checkCancelled(options.signal);
  const priorReceipt = await repository.readProjectImportReceipt(archive.packageSha256);
  if (priorReceipt) return { status: "already-imported", receipt: priorReceipt };
  const projectCollision = await repository.loadProject(archive.manifest.project.id);
  const styleCollision = await repository.hasStyleIdCollision(archive.manifest.styles.map((style) => style.id));
  let assetCollision = false;
  const currentAssets = new Map<string, StoredArtworkAsset | null>();
  for (const asset of archive.manifest.assets) {
    checkCancelled(options.signal);
    const existing = await artworkStore.get(asset.assetId);
    currentAssets.set(asset.assetId, existing);
    if (!existing) continue;
    safeAssetMetadata(existing);
    if (await hashBlob(existing.blob, options) !== asset.sha256) assetCollision = true;
  }
  if (!asCopy && (projectCollision || styleCollision || assetCollision)) {
    return {
      status: "copy-required",
      reason: projectCollision
        ? "A project with these source IDs is already on this device. Importing a separate copy keeps both versions safe."
        : styleCollision
          ? "A style ID in this backup is already on this device. Importing a separate copy keeps both versions safe."
        : "An artwork ID on this device contains different bytes. Importing a separate copy keeps the existing artwork unchanged.",
    };
  }
  await validateArchiveAssets(archive, options);
  const now = canonicalTimestamp((options.now ?? canonicalNow)());
  const uuid = options.idFactory ?? freshUuid;
  const assetMap = new Map<string, string>();
  const usedAssetIds = new Set<string>();
  for (const asset of archive.manifest.assets) {
    assetMap.set(asset.assetId, asCopy
      ? createLocalArtworkAssetId(ASSET_MIME_BY_SUFFIX[asset.mimeType], uniqueUuid(uuid, usedAssetIds))
      : asset.assetId);
  }
  const sourceBundle = asCopy
    ? await makeCopy(archive.manifest, archive.frozenManifests, archive.packageSha256, assetMap, now, uuid, options.crypto)
    : {
      project: archive.manifest.project,
      styles: [...archive.manifest.styles],
      recoveries: [...archive.manifest.recoveries],
      fieldObservations: [...archive.manifest.fieldObservations],
      styleRevisions: [...archive.manifest.styleRevisions],
      exportManifests: [...archive.frozenManifests],
    };
  const stagedIds: string[] = [];
  let completed = 0;
  const total = archive.manifest.assets.reduce((sum, asset) => sum + asset.byteLength, 0);
  try {
    for (const asset of archive.manifest.assets) {
      checkCancelled(options.signal);
      const blob = await verifiedAssetBlob(archive, asset, options, completed, total);
      const targetId = assetMap.get(asset.assetId)!;
      const existing = currentAssets.get(asset.assetId) ?? null;
      const canReuse = !asCopy && existing !== null && await hashBlob(existing.blob, options) === asset.sha256;
      if (!canReuse) {
        try {
          await artworkStore.put({
            assetId: targetId,
            name: asset.name,
            mimeType: ASSET_MIME_BY_SUFFIX[asset.mimeType],
            blob,
          });
          stagedIds.push(targetId);
        } catch (error) {
          const raced = await artworkStore.get(targetId).catch(() => null);
          if (!raced) {
            throw new ProjectPackageError("storage", `Local artwork storage could not save ${asset.name}: ${error instanceof Error ? error.message : "storage failed"}`);
          }
          if (await hashBlob(raced.blob, options) !== asset.sha256) {
            throw new ProjectPackageError("conflict", `Artwork ${targetId} was created or changed by another operation; retry as a copy.`);
          }
        }
        const stored = await artworkStore.get(targetId);
        if (!stored || stored.mimeType !== ASSET_MIME_BY_SUFFIX[asset.mimeType]
          || stored.blob.size !== asset.byteLength || await hashBlob(stored.blob, options) !== asset.sha256) {
          throw new ProjectPackageError("storage", `Staged artwork ${targetId} failed its read-back verification.`);
        }
      }
      completed += asset.byteLength;
    }
    progress(options, "commit", completed, total);
    const normalizedHistory = await normalizeSnapshotHistory({
      project: sourceBundle.project,
      styles: sourceBundle.styles,
      recoveries: sourceBundle.recoveries,
      fieldObservations: sourceBundle.fieldObservations,
      styleRevisions: sourceBundle.styleRevisions,
      exportManifests: sourceBundle.exportManifests,
    }, artworkStore, options);
    const bundle = {
      ...sourceBundle,
      styles: normalizedHistory.styles,
      styleRevisions: normalizedHistory.revisions,
      exportManifests: normalizedHistory.manifests,
    };
    const receipt: ProjectImportReceipt = {
      packageSha256: archive.packageSha256,
      projectId: bundle.project.id,
      importedAt: now,
      importedAsCopy: asCopy,
    };
    const result: ImportProjectBundleOutcome = await repository.importProjectBundle({
      ...bundle,
      recoveries: bundle.recoveries,
      receipt,
    });
    if (result.status === "already-imported") {
      const failures = await cleanupAssets(artworkStore, stagedIds);
      if (failures.length > 0) throw new ProjectPackageError("storage", `A concurrent import completed first, but unreferenced staged artwork could not be removed: ${failures.join(", ")}.`);
      return { status: "already-imported", receipt: result.receipt };
    }
    return { status: "imported", projectId: result.project.id, importedAsCopy: asCopy };
  } catch (error) {
    const cleanupErrors = await cleanupAssets(artworkStore, stagedIds);
    if (error instanceof ProjectPackageError && cleanupErrors.length === 0) throw error;
    const message = error instanceof Error ? error.message : "Project import failed.";
    const cleanupMessage = cleanupErrors.length ? ` Staged artwork cleanup also failed for ${cleanupErrors.join(", ")}; it is unreferenced.` : " Staged artwork was removed; the project records were not committed.";
    const repositoryCode = typeof error === "object" && error !== null && "code" in error ? error.code : null;
    const code = error instanceof ProjectPackageError ? error.code : repositoryCode === "quota-exceeded" ? "quota-exceeded" : "transaction";
    throw new ProjectPackageError(code, `${message}${cleanupMessage}`);
  }
}

async function cleanupAssets(store: ArtworkAssetStore, ids: readonly string[]): Promise<string[]> {
  const failures: string[] = [];
  for (const id of [...ids].reverse()) {
    try { await store.remove(id); } catch { failures.push(id); }
  }
  return failures;
}
