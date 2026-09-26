import { webcrypto } from "node:crypto";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
// @ts-expect-error jsdom is a test runtime dependency without bundled TypeScript declarations.
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnzipPassThrough, Zip, ZipPassThrough } from "fflate";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import {
  appendSemanticEditOperations,
  createAnchorMoveOperation,
  emptySemanticEditDocument,
  semanticAnchorCatalog,
  semanticEditSourceFingerprint,
  undoSemanticEdit,
} from "../edit/semantic-edit";
import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";
import { DEFAULT_APPEARANCE } from "./appearance";
import { createFieldObservationRecord } from "./field-provenance";
import { ARTWORK_CATALOG } from "../surface/artwork-library/catalog";
import { migrateLegacyRecovery, migrateLegacySaveFile, type ProjectRecord, type RecoveryRecord, type StyleRecord } from "./project-records";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import { openProjectRepository, type ProjectBundleSnapshot, type ProjectRepository } from "./project-repository";
import {
  createProjectPackage,
  importProjectPackage,
  PROJECT_PACKAGE_MAX_ASSETS,
  PROJECT_PACKAGE_MAX_BYTES,
  PROJECT_PACKAGE_MAX_CONTENT_BYTES,
  PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS,
  PROJECT_PACKAGE_MAX_MANIFEST_BYTES,
  ProjectPackageError,
  readProjectPackage,
} from "./project-package";
import { createFrozenOutputManifest, createStyleRevision, FROZEN_ARTIFACT_IDS, jcsSha256Hex, sha256Hex } from "./style-revisions";

const crypto = webcrypto as unknown as Crypto;
const TIME = "2026-09-24T16:00:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const SECOND_PROJECT_ID = "c502163f-10be-4dce-89c9-35de897e9814";
const SECOND_STYLE_ID = "daef445b-e352-47a4-a552-d10447e9df08";
const ASSET_ID = "local-1234567890abcdef1234567890abcdef-png";
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
let sequence = 0;
const repositories: ProjectRepository[] = [];

function bundle(name = "Tee project", projectId = PROJECT_ID, styleId = STYLE_ID): { project: ProjectRecord; style: StyleRecord } {
  const surface = {
    "tee/Untitled tee": {
      styleName: "Untitled tee",
      placements: [{
        id: "front-mark", kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1,
        sourceName: "Studio reference", assetId: ASSET_ID,
      }],
    },
  };
  const migrated = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150", {}, undefined, undefined, surface),
    projectId,
    styleId,
    migratedAt: TIME,
    projectName: name,
  });
  if (!migrated.ok) throw new Error(migrated.error);
  return migrated.value;
}

function recoveryRecord(styleId = STYLE_ID): RecoveryRecord {
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
  const migrated = migrateLegacyRecovery(styleId, serializeRecovery(payload));
  if (!migrated.ok) throw new Error(migrated.error);
  return migrated.value;
}

function memoryAssets(): ArtworkAssetStore & { records: Map<string, StoredArtworkAsset> } {
  const records = new Map<string, StoredArtworkAsset>();
  return {
    records,
    async put(asset) {
      if (records.has(asset.assetId)) throw new Error("Artwork already exists.");
      records.set(asset.assetId, asset);
    },
    async get(id) { return records.get(id) ?? null; },
    async remove(id) { records.delete(id); },
  };
}

async function repository(): Promise<ProjectRepository> {
  const result = await openProjectRepository({
    name: `project-package-test-${++sequence}`,
    factory: new IDBFactory(),
    crypto,
  });
  repositories.push(result);
  return result;
}

function inspector(file: File) {
  return Promise.resolve({ name: file.name, mimeType: file.type as "image/png", blob: file });
}

function deterministicUuidFactory(): () => string {
  let next = 1;
  return () => `77777777-7777-4777-8777-${(next++).toString(16).padStart(12, "0")}`;
}

async function createSourcePackage(assets = memoryAssets(), projectName = "Tee project"): Promise<{
  blob: Blob;
  assets: ReturnType<typeof memoryAssets>;
}> {
  const source = bundle(projectName);
  assets.records.set(ASSET_ID, {
    assetId: ASSET_ID, name: "front.png", mimeType: "image/png", blob: new Blob([PNG], { type: "image/png" }),
  });
  const blob = await createProjectPackage({ project: source.project, styles: [source.style], recoveries: [] }, assets, { crypto });
  return { blob, assets };
}

async function createFrozenSourcePackage(): Promise<{
  blob: Blob;
  project: ProjectRecord;
  style: StyleRecord;
  observations: ReturnType<typeof createFieldObservationRecord>;
  revision: Awaited<ReturnType<typeof createStyleRevision>>;
  manifest: Awaited<ReturnType<typeof createFrozenOutputManifest>>;
}> {
  const source = bundle("Frozen package", SECOND_PROJECT_ID, SECOND_STYLE_ID);
  const { assetId: _assetId, ...placement } = source.style.design.surface["tee/Untitled tee"]!.placements[0] as import("../surface/placement").ArtworkPlacement;
  const style: StyleRecord = {
    ...source.style,
    revisionHeadId: null,
    design: {
      ...source.style.design,
      surface: { "tee/Untitled tee": { styleName: "Untitled tee", placements: [placement] } },
    },
  };
  const observations = createFieldObservationRecord(style, TIME, "existing-local-style");
  const revision = await createStyleRevision({
    styleId: style.id,
    revisionId: "11111111-1111-4111-8111-111111111111",
    parentRevisionId: null,
    revisionNumber: 1,
    createdAt: TIME,
    design: style.design,
    fieldObservations: observations,
    artwork: [],
  }, crypto);
  const currentStyle = { ...style, revisionHeadId: revision.revisionId };
  const outputText = "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\"/></svg>";
  const manifest = await createFrozenOutputManifest({
    manifestId: "22222222-2222-4222-8222-222222222222",
    styleId: currentStyle.id,
    revision,
    capturedAt: TIME,
    selectedSizes: [{ sizeId: "m", label: "M" }],
    unresolved: ["Physical fit, formal approval, supplier requirements and factory acceptance are not verified."],
    artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
      const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
      return {
        artifactId,
        extension,
        displayName: `${artifactId}.${extension}`,
        mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
        content: outputText,
      };
    }),
  }, crypto);
  const blob = await createProjectPackage({
    project: source.project,
    styles: [currentStyle],
    recoveries: [],
    fieldObservations: [observations],
    styleRevisions: [revision],
    exportManifests: [manifest],
  }, memoryAssets(), { crypto });
  return { blob, project: source.project, style: currentStyle, observations, revision, manifest };
}

async function createTwoAssetArchive(): Promise<{
  archive: Awaited<ReturnType<typeof readProjectPackage>>;
  ids: string[];
}> {
  const source = bundle();
  const ids = [1, 2].map((value) => `local-${value.toString(16).padStart(32, "0")}-png`);
  const [surfaceKey, surfaceRecord] = Object.entries(source.style.design.surface)[0]!;
  const first = (surfaceRecord.placements as readonly import("../surface/placement").ArtworkPlacement[])[0]!;
  const style: StyleRecord = {
    ...source.style,
    design: {
      ...source.style.design,
      surface: {
        ...source.style.design.surface,
        [surfaceKey]: {
          ...surfaceRecord,
          placements: ids.map((assetId, index) => ({
            ...first,
            id: `two-asset-${index}`,
            sourceName: `Two asset ${index}`,
            assetId,
          })),
        },
      },
    },
  };
  const project = { ...source.project, styleIds: [style.id], activeStyleId: style.id };
  const assets = memoryAssets();
  ids.forEach((assetId, index) => assets.records.set(assetId, {
    assetId,
    name: `two-${index}.png`,
    mimeType: "image/png",
    blob: new Blob([PNG, new Uint8Array([index])], { type: "image/png" }),
  }));
  const blob = await createProjectPackage({ project, styles: [style], recoveries: [] }, assets, { crypto });
  return { archive: await readProjectPackage(blob, { crypto }), ids };
}

function snapshotWithArtworkRefs(assetIds: readonly string[]): {
  project: ProjectRecord;
  styles: StyleRecord[];
  recoveries: [];
} {
  const source = bundle();
  const [surfaceKey, surfaceRecord] = Object.entries(source.style.design.surface)[0]!;
  const placement = (surfaceRecord.placements as readonly import("../surface/placement").ArtworkPlacement[])[0]!;
  const style: StyleRecord = {
    ...source.style,
    design: {
      ...source.style.design,
      surface: {
        ...source.style.design.surface,
        [surfaceKey]: {
          ...surfaceRecord,
          placements: assetIds.map((assetId, index) => ({
            ...placement,
            id: "package-ref-" + index,
            sourceName: "Package reference " + index,
            assetId,
          })),
        },
      },
    },
  };
  return {
    project: { ...source.project, styleIds: [style.id], activeStyleId: style.id },
    styles: [style],
    recoveries: [],
  };
}

async function duplicateEntryZip(): Promise<Blob> {
  const parts: BlobPart[] = [];
  return new Promise((resolve, reject) => {
    const zip = new Zip((error, chunk, final) => {
      if (error) { reject(error); return; }
      if (chunk.byteLength > 0) parts.push(chunk);
      if (final) resolve(new Blob(parts, { type: "application/zip" }));
    });
    for (const value of [1, 2]) {
      const entry = new ZipPassThrough("duplicate.bin");
      zip.add(entry);
      entry.push(new Uint8Array([value]), true);
    }
    zip.end();
  });
}

async function storedZip(entries: readonly { path: string; bytes: Uint8Array }[]): Promise<Blob> {
  const parts: BlobPart[] = [];
  return new Promise((resolve, reject) => {
    const zip = new Zip((error, chunk, final) => {
      if (error) { reject(error); return; }
      if (chunk.byteLength > 0) parts.push(chunk);
      if (final) resolve(new Blob(parts, { type: "application/zip" }));
    });
    for (const entry of entries) {
      const file = new ZipPassThrough(entry.path);
      zip.add(file);
      file.push(entry.bytes, true);
    }
    zip.end();
  });
}

async function replacePackageManifest(
  source: Blob,
  mutate: (manifest: Record<string, unknown>) => void,
  resign = true,
): Promise<Blob> {
  const archive = await readProjectPackage(source, { crypto });
  const manifest = JSON.parse(JSON.stringify(archive.manifest)) as Record<string, unknown>;
  mutate(manifest);
  if (resign) {
    const { packageSha256: _oldDigest, ...body } = manifest;
    const canonical = (value: unknown): string => {
      if (value === null || typeof value !== "object") return JSON.stringify(value);
      if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
      const record = value as Record<string, unknown>;
      return "{" + Object.keys(record).sort().map((key) => JSON.stringify(key) + ":" + canonical(record[key])).join(",") + "}";
    };
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(body)));
    manifest.packageSha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  const entries = [{ path: "manifest.json", bytes: new TextEncoder().encode(JSON.stringify(manifest)) }];
  for (const asset of archive.manifest.assets) {
    const entry = archive.entries.get(asset.path)!;
    entries.push({
      path: entry.path,
      bytes: new Uint8Array(await archive.blob.slice(entry.dataOffset, entry.dataOffset + entry.uncompressedSize).arrayBuffer()),
    });
  }
  const originalFrozen = archive.manifest.exportManifests ?? [];
  const revisedFrozen = Array.isArray(manifest.exportManifests)
    ? manifest.exportManifests as Array<Record<string, unknown>>
    : [];
  for (const revised of revisedFrozen) {
    if (typeof revised.manifestId !== "string" || !Array.isArray(revised.artifacts)) continue;
    const original = originalFrozen.find((record) => record.manifestId === revised.manifestId) ?? originalFrozen[0];
    if (!original) continue;
    for (const item of revised.artifacts) {
      if (typeof item !== "object" || item === null || typeof (item as Record<string, unknown>).archivePath !== "string") continue;
      const artifactId = (item as Record<string, unknown>).artifactId;
      const sourceArtifact = original.artifacts.find((artifact) => artifact.artifactId === artifactId) ?? original.artifacts[0];
      if (!sourceArtifact) continue;
      const entry = archive.entries.get(sourceArtifact.archivePath)!;
      entries.push({
        path: (item as Record<string, unknown>).archivePath as string,
        bytes: new Uint8Array(await archive.blob.slice(entry.dataOffset, entry.dataOffset + entry.uncompressedSize).arrayBuffer()),
      });
    }
  }
  return storedZip(entries);
}

async function rewritePackageBytes(
  source: Blob,
  rewrite: (path: string, bytes: Uint8Array) => Uint8Array,
): Promise<Blob> {
  const archive = await readProjectPackage(source, { crypto });
  const entries = await Promise.all([...archive.entries.values()].map(async (entry) => ({
    path: entry.path,
    bytes: rewrite(entry.path, new Uint8Array(await archive.blob.slice(
      entry.dataOffset,
      entry.dataOffset + entry.uncompressedSize,
    ).arrayBuffer())),
  })));
  return storedZip(entries);
}

async function makeVersionOnePackage(source: Blob): Promise<Blob> {
  const archive = await readProjectPackage(source, { crypto });
  const manifest = JSON.parse(JSON.stringify(archive.manifest)) as Record<string, unknown>;
  manifest.packageVersion = 1;
  delete manifest.fieldObservations;
  delete manifest.styleRevisions;
  delete manifest.exportManifests;
  manifest.styles = (manifest.styles as Array<Record<string, unknown>>).map((style) => {
    const legacy: Record<string, unknown> = { ...style, schemaVersion: 3 };
    delete legacy.revisionHeadId;
    if (typeof legacy.design === "object" && legacy.design !== null) {
      const { semanticEdits: _semanticEdits, ...legacyDesign } = legacy.design as Record<string, unknown>;
      legacy.design = legacyDesign;
    }
    return legacy;
  });
  manifest.assets = (manifest.assets as Array<Record<string, unknown>>).map((asset) => ({
    ...asset,
    attribution: ["Studio reference"],
  }));
  const { packageSha256: _oldDigest, ...body } = manifest;
  const canonical = (value: unknown): string => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  };
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(body)));
  manifest.packageSha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const entries = [{ path: "manifest.json", bytes: new TextEncoder().encode(JSON.stringify(manifest)) }];
  for (const asset of archive.manifest.assets) {
    const entry = archive.entries.get(asset.path)!;
    entries.push({
      path: entry.path,
      bytes: new Uint8Array(await archive.blob.slice(entry.dataOffset, entry.dataOffset + entry.uncompressedSize).arrayBuffer()),
    });
  }
  return storedZip(entries);
}

async function makeVersionTwoPackage(source: Blob): Promise<Blob> {
  return replacePackageManifest(source, (manifest) => {
    manifest.packageVersion = 2;
    delete manifest.styleRevisions;
    delete manifest.exportManifests;
    manifest.styles = (manifest.styles as Array<Record<string, unknown>>).map((style) => {
      const legacy: Record<string, unknown> = { ...style, schemaVersion: 3 };
      delete legacy.revisionHeadId;
      return legacy;
    });
    manifest.assets = (manifest.assets as Array<Record<string, unknown>>).map((asset) => ({
      ...asset,
      attribution: ["Studio reference"],
    }));
  });
}

function zipCallback(zip: Zip): (error: Error | null, chunk: Uint8Array, final: boolean) => void {
  return (zip as unknown as {
    ondata: (error: Error | null, chunk: Uint8Array, final: boolean) => void;
  }).ondata;
}

function findPackageEocd(bytes: Uint8Array): number {
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 22 - 0xffff); index -= 1) {
    if (new DataView(bytes.buffer, bytes.byteOffset + index, 4).getUint32(0, true) === 0x06054b50) return index;
  }
  throw new Error("Test ZIP did not contain an end-of-central-directory record.");
}

async function pressurePackage(label: string, assetSizes: readonly number[]): Promise<{
  packageBytes: number;
  copiedAssetBytes: number;
}> {
  const source = bundle(`Pressure ${label}`);
  const assetIds = assetSizes.map((_, index) => `local-${(index + 1).toString(16).padStart(32, "0")}-png`);
  const surfaceEntries = Object.entries(source.style.design.surface);
  const [surfaceKey, surfaceRecord] = surfaceEntries[0]!;
  const sourcePlacement = (surfaceRecord.placements as readonly import("../surface/placement").ArtworkPlacement[])[0]!;
  const placements = assetIds.map((assetId, index) => ({
    ...sourcePlacement,
    id: `pressure-${index}`,
    sourceName: `Pressure artwork ${index}`,
    assetId,
  }));
  const style: StyleRecord = {
    ...source.style,
    design: {
      ...source.style.design,
      surface: {
        ...source.style.design.surface,
        [surfaceKey]: { ...surfaceRecord, placements },
      },
    },
  };
  const project = { ...source.project, styleIds: [style.id], activeStyleId: style.id };
  const sourceAssets = memoryAssets();
  const blobs = new Map<number, Blob>();
  for (const size of new Set(assetSizes)) blobs.set(size, new Blob([new Uint8Array(size).fill(0x5a)], { type: "image/png" }));
  assetIds.forEach((assetId, index) => sourceAssets.records.set(assetId, {
    assetId,
    name: `pressure-${index}.png`,
    mimeType: "image/png",
    blob: blobs.get(assetSizes[index]!)!,
  }));

  const started = performance.now();
  let peakRss = process.memoryUsage().rss;
  const sampleMemory = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss); }, 20);
  try {
    const archiveBlob = await createProjectPackage({ project, styles: [style], recoveries: [] }, sourceAssets, { crypto });
    const archive = await readProjectPackage(archiveBlob, { crypto });
    expect(archive.manifest.assets).toHaveLength(assetSizes.length);
    expect(archive.manifest.assets.reduce((sum, asset) => sum + asset.byteLength, 0))
      .toBe(assetSizes.reduce((sum, size) => sum + size, 0));

    const target = await repository();
    const targetAssets = memoryAssets();
    const imported = await importProjectPackage(target, targetAssets, archive, false, {
      crypto,
      now: () => TIME,
      inspectAsset: inspector,
    });
    expect(imported).toMatchObject({ status: "imported", projectId: PROJECT_ID, importedAsCopy: false });
    expect(targetAssets.records.size).toBe(assetSizes.length);
    const copiedAssetBytes = [...targetAssets.records.values()].reduce((sum, asset) => sum + asset.blob.size, 0);
    expect(copiedAssetBytes).toBe(assetSizes.reduce((sum, size) => sum + size, 0));
    const elapsedMs = Math.round(performance.now() - started);
    console.info(`PROJECT_PACKAGE_PRESSURE ${JSON.stringify({
      label,
      assets: assetSizes.length,
      uncompressedBytes: copiedAssetBytes,
      archiveBytes: archiveBlob.size,
      elapsedMs,
      peakRssBytes: peakRss,
    })}`);
    return { packageBytes: archiveBlob.size, copiedAssetBytes };
  } finally {
    clearInterval(sampleMemory);
  }
}

afterEach(() => {
  for (const item of repositories.splice(0)) item.close();
  vi.restoreAllMocks();
});

describe("portable local project package", () => {
  it("rejects inconsistent immutable history and resolves only proven artwork references", async () => {
    const source = await createFrozenSourcePackage();
    const base: ProjectBundleSnapshot = {
      project: source.project,
      styles: [source.style],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [source.revision],
      exportManifests: [source.manifest],
    };
    const emptyAssets = memoryAssets();
    const makePackage = (snapshot: Partial<ProjectBundleSnapshot>, store = emptyAssets) => createProjectPackage({
      ...base,
      ...snapshot,
    }, store, { crypto });

    await expect(makePackage({ styleRevisions: [{ ...source.revision, styleId: PROJECT_ID }] }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("outside this project") });
    await expect(makePackage({ styleRevisions: [{ ...source.revision, revisionContentDigest: "0".repeat(64) }] }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("failed integrity validation") });
    await expect(makePackage({ exportManifests: [{ ...source.manifest, packetDigest: "0".repeat(64) }] }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("failed integrity validation") });
    await expect(makePackage({
      styles: [{ ...source.style, revisionHeadId: "33333333-3333-4333-8333-333333333333" }],
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("latest immutable revision") });
    await expect(makePackage({ styleRevisions: [], exportManifests: [] }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("no included history") });
    await expect(makePackage({
      styles: [{ ...source.style, revisionHeadId: null }],
      fieldObservations: [],
      styleRevisions: [],
      exportManifests: [],
    }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("no field-history baseline") });

    const surfaceEntry = Object.entries(source.style.design.surface)[0]!;
    const originalPlacement = surfaceEntry[1].placements[0] as import("../surface/placement").ArtworkPlacement;
    const withAsset = (assetId: string, baseStyle = source.style): StyleRecord => ({
      ...baseStyle,
      revisionHeadId: null,
      design: {
        ...baseStyle.design,
        surface: {
          ...baseStyle.design.surface,
          [surfaceEntry[0]]: {
            ...surfaceEntry[1],
            placements: [{ ...originalPlacement, assetId }],
          },
        },
      },
    });
    const unknownBaseline = withAsset("unknown-reference");
    await expect(makePackage({
      styles: [unknownBaseline],
      fieldObservations: [createFieldObservationRecord(unknownBaseline, TIME, "existing-local-style")],
      styleRevisions: [],
      exportManifests: [],
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("not available in the local catalog") });

    const manyAssetIds = Array.from({ length: PROJECT_PACKAGE_MAX_ASSETS + 1 }, (_, index) =>
      `local-${(index + 1).toString(16).padStart(32, "0")}-png`);
    const manyReferences: StyleRecord = {
      ...source.style,
      revisionHeadId: null,
      design: {
        ...source.style.design,
        surface: {
          ...source.style.design.surface,
          [surfaceEntry[0]]: {
            ...surfaceEntry[1],
            placements: manyAssetIds.map((assetId, index) => ({
              ...originalPlacement,
              id: `package-ref-${index}`,
              assetId,
            })),
          },
        },
      },
    };
    await expect(createProjectPackage({
      project: source.project,
      styles: [manyReferences],
      recoveries: [],
      fieldObservations: [createFieldObservationRecord(manyReferences, TIME, "existing-local-style")],
    }, emptyAssets, { crypto })).rejects.toMatchObject({
      code: "limit-exceeded",
      message: expect.stringContaining("at most 128 referenced artwork files"),
    });

    const missingLocal = withAsset(ASSET_ID);
    await expect(makePackage({
      styles: [missingLocal],
      fieldObservations: [createFieldObservationRecord(missingLocal, TIME, "existing-local-style")],
      styleRevisions: [],
      exportManifests: [],
    })).rejects.toMatchObject({ code: "missing-asset", message: expect.stringContaining("disappeared from local storage") });

    const bundledAssetId = ARTWORK_CATALOG[0]!.assetId;
    const bundledBaseline = withAsset(bundledAssetId);
    const bundledArchive = await createProjectPackage({
      project: source.project,
      styles: [bundledBaseline],
      recoveries: [],
      fieldObservations: [createFieldObservationRecord(bundledBaseline, TIME, "existing-local-style")],
    }, emptyAssets, { crypto });
    const bundledRead = await readProjectPackage(bundledArchive, { crypto });
    expect(bundledRead.manifest.styleRevisions[0]?.payload.artwork).toMatchObject([
      { assetId: bundledAssetId, mimeType: ARTWORK_CATALOG[0]!.image.mimeType },
    ]);

    const historicalAssetStyle = withAsset(ASSET_ID);
    const historicalObservations = createFieldObservationRecord(historicalAssetStyle, TIME, "existing-local-style");
    const first = await createStyleRevision({
      styleId: historicalAssetStyle.id,
      revisionId: "33333333-3333-4333-8333-333333333333",
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: historicalAssetStyle.design,
      fieldObservations: historicalObservations,
      artwork: [{ assetId: ASSET_ID, mimeType: "image/png", byteLength: PNG.byteLength, sha256: await sha256Hex(PNG, crypto) }],
    }, crypto);
    const latest = await createStyleRevision({
      styleId: source.style.id,
      revisionId: "44444444-4444-4444-8444-444444444444",
      parentRevisionId: first.revisionId,
      revisionNumber: 2,
      createdAt: TIME,
      design: source.style.design,
      fieldObservations: source.observations,
      artwork: [],
    }, crypto);
    const historicalOnlyAsset = memoryAssets();
    historicalOnlyAsset.records.set(ASSET_ID, {
      assetId: ASSET_ID,
      name: "historical.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const historicalPackage = await createProjectPackage({
      project: source.project,
      styles: [{ ...source.style, revisionHeadId: latest.revisionId }],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [first, latest],
    }, historicalOnlyAsset, { crypto });
    const historicalRead = await readProjectPackage(historicalPackage, { crypto });
    expect(historicalRead.manifest.assets.map((asset) => asset.assetId)).toContain(ASSET_ID);
  });

  it("enforces the immutable capture count and manifest-to-revision binding", async () => {
    const source = await createFrozenSourcePackage();
    const manyManifests = Array.from({ length: PROJECT_PACKAGE_MAX_FROZEN_MANIFESTS + 1 }, (_, index) => ({
      ...source.manifest,
      manifestId: `77777777-7777-4777-8777-${(index + 1).toString(16).padStart(12, "0")}`,
    }));
    await expect(createProjectPackage({
      project: source.project,
      styles: [source.style],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [source.revision],
      exportManifests: manyManifests,
    }, memoryAssets(), { crypto })).rejects.toMatchObject({
      code: "limit-exceeded",
      message: expect.stringContaining("at most 256 frozen output captures"),
    });

    const overLimitPackage = await replacePackageManifest(source.blob, (manifest) => {
      const original = (manifest.exportManifests as Array<Record<string, unknown>>)[0]!;
      manifest.exportManifests = manyManifests.map((record) => ({
        ...original,
        manifestId: record.manifestId,
        artifacts: (original.artifacts as Array<Record<string, unknown>>).map((artifact) => ({
          ...artifact,
          archivePath: `frozen/${record.manifestId}/${String(artifact.path).slice("artifacts/".length)}`,
        })),
      }));
    });
    await expect(readProjectPackage(overLimitPackage, { crypto })).rejects.toMatchObject({
      code: "limit-exceeded",
      message: expect.stringContaining("too many frozen output captures"),
    });

    const absentRevision = await createStyleRevision({
      styleId: source.style.id,
      revisionId: "88888888-8888-4888-8888-888888888888",
      parentRevisionId: source.revision.revisionId,
      revisionNumber: 2,
      createdAt: TIME,
      design: source.style.design,
      fieldObservations: source.observations,
      artwork: [],
    }, crypto);
    const absentManifest = await createFrozenOutputManifest({
      manifestId: "99999999-9999-4999-8999-999999999999",
      styleId: source.style.id,
      revision: absentRevision,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }],
      unresolved: ["Physical fit and factory acceptance are not verified."],
      artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
        const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
        return {
          artifactId,
          extension,
          displayName: `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\"/></svg>",
        };
      }),
    }, crypto);
    await expect(createProjectPackage({
      project: source.project,
      styles: [source.style],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [source.revision],
      exportManifests: [absentManifest],
    }, memoryAssets(), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("does not match an included immutable revision"),
    });
  });

  it("backs up a frozen artifact larger than the artwork cap but within its own limit", async () => {
    const source = await createFrozenSourcePackage();
    const largeBytes = 10 * 1024 * 1024 + 1;
    const largeManifest = await createFrozenOutputManifest({
      manifestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      styleId: source.style.id,
      revision: source.revision,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }],
      unresolved: ["Physical fit and factory acceptance are not verified."],
      artifacts: FROZEN_ARTIFACT_IDS.map((artifactId, index) => {
        const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
        return {
          artifactId,
          extension,
          displayName: `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: index === 0 ? "x".repeat(largeBytes) : "x",
        };
      }),
    }, crypto);
    const packed = await createProjectPackage({
      project: source.project,
      styles: [source.style],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [source.revision],
      exportManifests: [largeManifest],
    }, memoryAssets(), { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    expect(archive.frozenManifests[0]?.artifacts[0]?.byteLength).toBe(largeBytes);
    expect(archive.frozenManifests[0]?.artifacts[0]?.bytes.size).toBe(largeBytes);
  });

  it("surfaces streaming ZIP writer failures and enforces the generated archive limit", async () => {
    const source = bundle("Writer failure");
    const assets = memoryAssets();
    assets.records.set(ASSET_ID, {
      assetId: ASSET_ID,
      name: "front.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const snapshot = { project: source.project, styles: [source.style], recoveries: [] } as const;
    vi.spyOn(Zip.prototype, "terminate").mockImplementation(function (this: Zip) {
      zipCallback(this)(new Error("secondary writer termination"), new Uint8Array(), true);
    });
    vi.spyOn(Zip.prototype, "end").mockImplementation(function (this: Zip) {
      zipCallback(this)(new Error("synthetic streaming writer failure"), new Uint8Array(), false);
    });

    await expect(createProjectPackage(snapshot, assets, { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: "synthetic streaming writer failure",
    });
  });

  it("rejects an oversized ZIP writer chunk without retaining it", async () => {
    const source = bundle("Archive cap");
    const assets = memoryAssets();
    assets.records.set(ASSET_ID, {
      assetId: ASSET_ID,
      name: "front.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const snapshot = { project: source.project, styles: [source.style], recoveries: [] } as const;
    vi.spyOn(Zip.prototype, "terminate").mockImplementation(function (this: Zip) {
      zipCallback(this)(new Error("secondary writer termination"), new Uint8Array(), true);
    });
    vi.spyOn(Zip.prototype, "end").mockImplementation(function (this: Zip) {
      const overLimitChunk = new Proxy(new Uint8Array([1]), {
        get(target, key) {
          return key === "byteLength" ? PROJECT_PACKAGE_MAX_BYTES + 1 : Reflect.get(target, key, target);
        },
      });
      zipCallback(this)(null, overLimitChunk, false);
    });

    await expect(createProjectPackage(snapshot, assets, { crypto })).rejects.toMatchObject({
      code: "limit-exceeded",
      message: expect.stringContaining("256 MiB archive limit"),
    });
  });

  it("enforces the uncompressed package cap without allocating hundreds of megabytes", async () => {
    const source = await createFrozenSourcePackage();
    const artifactBytes = 13 * 1024 * 1024;
    const emptyDigest = await sha256Hex(new Uint8Array(0), crypto);
    const createSizedManifest = async (manifestId: string) => {
      const artifacts = source.manifest.artifacts.map((artifact) => ({
        ...artifact,
        byteLength: artifactBytes,
        sha256: emptyDigest,
        bytes: {
          size: artifactBytes,
          arrayBuffer: async () => new ArrayBuffer(0),
          stream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.close(); } }),
        } as unknown as Blob,
      }));
      const payload = {
        ...source.manifest.payload,
        artifacts: artifacts.map(({ bytes: _bytes, ...artifact }) => artifact),
      };
      return {
        ...source.manifest,
        manifestId,
        payload,
        packetDigest: await jcsSha256Hex(payload, crypto),
        artifacts,
      };
    };
    const manifests = await Promise.all([
      createSizedManifest("33333333-3333-4333-8333-333333333333"),
      createSizedManifest("44444444-4444-4444-8444-444444444444"),
      createSizedManifest("55555555-5555-4555-8555-555555555555"),
    ]);
    await expect(createProjectPackage({
      project: source.project,
      styles: [source.style],
      recoveries: [],
      fieldObservations: [source.observations],
      styleRevisions: [source.revision],
      exportManifests: manifests,
    }, memoryAssets(), { crypto })).rejects.toMatchObject({
      code: "limit-exceeded",
      message: expect.stringContaining("Project records, artwork and frozen outputs exceed the 256 MiB"),
    });
  });

  it("detects artwork and frozen-output changes during backup preparation and streaming", async () => {
    const source = bundle();
    const baseAsset: StoredArtworkAsset = {
      assetId: ASSET_ID,
      name: "front.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    };
    const snapshot = { project: source.project, styles: [source.style], recoveries: [] };
    const racingStore = (thirdRead: (asset: StoredArtworkAsset) => StoredArtworkAsset | null) => {
      const store = memoryAssets();
      store.records.set(ASSET_ID, baseAsset);
      let reads = 0;
      store.get = async (id) => {
        if (id !== ASSET_ID) return null;
        reads += 1;
        return reads === 3 ? thirdRead(baseAsset) : baseAsset;
      };
      return store;
    };

    await expect(createProjectPackage(snapshot, racingStore(() => null), { crypto }))
      .rejects.toMatchObject({ code: "missing-asset", message: expect.stringContaining("disappeared during backup creation") });

    const changedPng = new Uint8Array(PNG);
    changedPng[0] = changedPng[0]! ^ 1;
    await expect(createProjectPackage(snapshot, racingStore((asset) => ({
      ...asset,
      blob: new Blob([changedPng], { type: "image/png" }),
    })), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("changed during backup creation"),
    });

    const shortAssetBlob = {
      size: PNG.byteLength,
      type: "image/png",
      arrayBuffer: async () => PNG.buffer.slice(PNG.byteOffset, PNG.byteOffset + PNG.byteLength),
      stream: () => new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(PNG.slice(0, PNG.byteLength - 1));
          controller.close();
        },
      }),
    } as unknown as Blob;
    await expect(createProjectPackage(snapshot, racingStore((asset) => ({ ...asset, blob: shortAssetBlob })), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed during backup creation") });

    const frozen = await createFrozenSourcePackage();
    const firstOutput = frozen.manifest.artifacts[0]!;
    const originalBytes = new Uint8Array(await firstOutput.bytes.arrayBuffer());
    const changedAfterValidation = new Blob([originalBytes], { type: firstOutput.mediaType });
    let reads = 0;
    Object.defineProperty(changedAfterValidation, "arrayBuffer", {
      value: async () => {
        reads += 1;
        const bytes = new Uint8Array(originalBytes);
        if (reads === 2) bytes[0] = bytes[0]! ^ 1;
        return bytes.buffer;
      },
    });
    const changingManifest = {
      ...frozen.manifest,
      artifacts: frozen.manifest.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: changedAfterValidation }
        : artifact),
    };
    await expect(createProjectPackage({
      project: frozen.project,
      styles: [frozen.style],
      recoveries: [],
      fieldObservations: [frozen.observations],
      styleRevisions: [frozen.revision],
      exportManifests: [changingManifest],
    }, memoryAssets(), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("changed during backup creation"),
    });

    const shortOutputBlob = new Blob([originalBytes], { type: firstOutput.mediaType });
    Object.defineProperty(shortOutputBlob, "stream", {
      value: () => new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(originalBytes.slice(0, originalBytes.byteLength - 1));
          controller.close();
        },
      }),
    });
    const shorteningManifest = {
      ...frozen.manifest,
      artifacts: frozen.manifest.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: shortOutputBlob }
        : artifact),
    };
    await expect(createProjectPackage({
      project: frozen.project,
      styles: [frozen.style],
      recoveries: [],
      fieldObservations: [frozen.observations],
      styleRevisions: [frozen.revision],
      exportManifests: [shorteningManifest],
    }, memoryAssets(), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("changed during backup creation"),
    });
  });

  it("rejects tampered frozen-output archive metadata, revision links, and bytes", async () => {
    const source = await createFrozenSourcePackage();
    const mutateFirstManifest = (manifest: Record<string, unknown>, mutate: (record: Record<string, unknown>) => void) => {
      const records = manifest.exportManifests as Array<Record<string, unknown>>;
      mutate(records[0]!);
    };

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => {
        const artifacts = record.artifacts as Array<Record<string, unknown>>;
        artifacts[0]!.path = "artifacts/../unsupported.pdf";
      });
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("supported artifact filename") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => { record.artifacts = {}; });
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("metadata is malformed") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => {
        const artifacts = record.artifacts as unknown[];
        artifacts[0] = null;
      });
    }), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("artifact metadata is malformed"),
    });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => {
        const artifacts = record.artifacts as Array<Record<string, unknown>>;
        artifacts[0]!.artifactId = "unknown-output-kind";
      });
    }), { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("metadata failed strict validation"),
    });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => {
        const artifacts = record.artifacts as Array<Record<string, unknown>>;
        artifacts[0]!.archivePath = "frozen/22222222-2222-4222-8222-222222222222/wrong.pdf";
      });
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("archive paths or byte limits") });

    const foreign = bundle("Foreign revision", PROJECT_ID, PROJECT_ID);
    const foreignObservations = createFieldObservationRecord(foreign.style, TIME, "existing-local-style");
    const foreignRevision = await createStyleRevision({
      styleId: foreign.style.id,
      revisionId: "55555555-5555-4555-8555-555555555555",
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: foreign.style.design,
      fieldObservations: foreignObservations,
      artwork: [{ assetId: ASSET_ID, mimeType: "image/png", byteLength: PNG.byteLength, sha256: await sha256Hex(PNG, crypto) }],
    }, crypto);
    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      manifest.styleRevisions = [foreignRevision];
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("outside this project") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      const revisions = manifest.styleRevisions as Array<Record<string, unknown>>;
      manifest.styleRevisions = [revisions[0], revisions[0]];
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("IDs are duplicated") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      manifest.styleRevisions = [];
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("missing its immutable revision history") });

    const secondRevision = await createStyleRevision({
      styleId: source.style.id,
      revisionId: "66666666-6666-4666-8666-666666666666",
      parentRevisionId: "77777777-7777-4777-8777-777777777777",
      revisionNumber: 2,
      createdAt: TIME,
      design: source.style.design,
      fieldObservations: source.observations,
      artwork: [],
    }, crypto);
    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      const styles = manifest.styles as Array<Record<string, unknown>>;
      styles[0]!.revisionHeadId = secondRevision.revisionId;
      manifest.styleRevisions = [...(manifest.styleRevisions as Array<Record<string, unknown>>), secondRevision];
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("complete parent-linked chain") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      const records = manifest.exportManifests as Array<Record<string, unknown>>;
      records[0]!.revisionId = "88888888-8888-4888-8888-888888888888";
      (records[0]!.payload as Record<string, unknown>).revisionId = records[0]!.revisionId;
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("missing style or revision") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      const revisions = manifest.styleRevisions as Array<Record<string, unknown>>;
      revisions[0]!.revisionContentDigest = "0".repeat(64);
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("failed its content digest") });

    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => { record.packetDigest = "0".repeat(64); });
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("metadata digest") });

    const alternateRevision = await createStyleRevision({
      styleId: source.style.id,
      revisionId: source.revision.revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: {
        ...source.style.design,
        measurements: { ...source.style.design.measurements, chest: source.style.design.measurements.chest + 1 },
      },
      fieldObservations: source.observations,
      artwork: [],
    }, crypto);
    const alternateManifest = await createFrozenOutputManifest({
      manifestId: source.manifest.manifestId,
      styleId: source.style.id,
      revision: alternateRevision,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }],
      unresolved: ["Physical fit and factory acceptance are not verified."],
      artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
        const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
        return {
          artifactId,
          extension,
          displayName: `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\"/></svg>",
        };
      }),
    }, crypto);
    await expect(readProjectPackage(await replacePackageManifest(source.blob, (manifest) => {
      mutateFirstManifest(manifest, (record) => {
        record.packetDigest = alternateManifest.packetDigest;
        record.payload = alternateManifest.payload;
      });
    }), { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("does not match its pinned style revision") });

    const archive = await readProjectPackage(source.blob, { crypto });
    const artifactArchivePath = source.manifest.artifacts[0]!.path.replace(/^artifacts\//, `frozen/${source.manifest.manifestId}/`);
    const artifactEntry = archive.entries.get(artifactArchivePath)!;
    const corruptedOutput = await rewritePackageBytes(source.blob, (path, bytes) => {
      if (path !== artifactArchivePath) return bytes;
      bytes[0] = bytes[0]! ^ 1;
      return bytes;
    });
    await expect(readProjectPackage(corruptedOutput, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("failed its byte digest") });
    expect(artifactEntry.uncompressedSize).toBeGreaterThan(0);
  });

  it("round-trips immutable revision history and exact frozen artifacts through v3 and copy remapping", async () => {
    const source = bundle("Frozen archive", SECOND_PROJECT_ID, SECOND_STYLE_ID);
    const { assetId: _assetId, ...placement } = source.style.design.surface["tee/Untitled tee"]!.placements[0] as import("../surface/placement").ArtworkPlacement;
    const style: StyleRecord = {
      ...source.style,
      revisionHeadId: null,
      design: {
        ...source.style.design,
        surface: { "tee/Untitled tee": { styleName: "Untitled tee", placements: [placement] } },
      },
    };
    const observations = createFieldObservationRecord(style, TIME, "existing-local-style");
    const revision = await createStyleRevision({
      styleId: style.id,
      revisionId: "11111111-1111-4111-8111-111111111111",
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: style.design,
      fieldObservations: observations,
      artwork: [],
    }, crypto);
    const currentStyle = { ...style, revisionHeadId: revision.revisionId };
    const outputText = "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\"/></svg>";
    const frozen = await createFrozenOutputManifest({
      manifestId: "22222222-2222-4222-8222-222222222222",
      styleId: currentStyle.id,
      revision,
      capturedAt: TIME,
      selectedSizes: [{ sizeId: "m", label: "M" }],
      unresolved: ["Physical fit, formal approval, supplier requirements and factory acceptance are not verified."],
      artifacts: FROZEN_ARTIFACT_IDS.map((artifactId) => {
        const extension = artifactId.includes("dxf") ? "dxf" : artifactId.endsWith("svg") ? "svg" : "pdf";
        return {
          artifactId,
          extension,
          displayName: `${artifactId}.${extension}`,
          mediaType: extension === "svg" ? "image/svg+xml" : extension === "dxf" ? "image/vnd.dxf" : "application/pdf",
          content: outputText,
        };
      }),
    }, crypto);
    const store = memoryAssets();
    const packed = await createProjectPackage({
      project: source.project,
      styles: [currentStyle],
      recoveries: [],
      fieldObservations: [observations],
      styleRevisions: [revision],
      exportManifests: [frozen],
    }, store, { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    expect(archive.manifest.packageVersion).toBe(3);
    expect(archive.manifest.styleRevisions).toHaveLength(1);
    expect(archive.manifest.exportManifests[0]?.artifacts[0]?.archivePath)
      .toBe(`frozen/${frozen.manifestId}/selected-size-a0-pdf.pdf`);
    expect(await archive.frozenManifests[0]?.artifacts[0]?.bytes.text()).toBe(outputText);
    expect(await sha256Hex(new Uint8Array(await archive.frozenManifests[0]!.artifacts[0]!.bytes.arrayBuffer()), crypto))
      .toBe(frozen.artifacts[0]?.sha256);

    const target = await repository();
    const copied = await importProjectPackage(target, memoryAssets(), archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
    });
    expect(copied).toMatchObject({ status: "imported", importedAsCopy: true });
    if (copied.status !== "imported") throw new Error("Frozen package copy import did not complete.");
    const restored = await target.loadProject(copied.projectId);
    expect(restored?.styleRevisions).toHaveLength(1);
    expect(restored?.exportManifests).toHaveLength(1);
    expect(restored?.exportManifests[0]?.packetDigest).not.toBe(frozen.packetDigest);
    expect(await restored?.exportManifests[0]?.artifacts[0]?.bytes.text()).toBe(outputText);
    const reExported = await createProjectPackage({
      project: restored!.project,
      styles: restored!.styles,
      recoveries: [],
      fieldObservations: restored!.fieldObservations,
      styleRevisions: restored!.styleRevisions,
      exportManifests: restored!.exportManifests,
    }, memoryAssets(), { crypto });
    const reloaded = await readProjectPackage(reExported, { crypto });
    expect(await reloaded.frozenManifests[0]?.artifacts[0]?.bytes.text()).toBe(outputText);
  });

  it("remaps a multi-revision chain and its local artwork when copying a v3 package", async () => {
    const source = bundle("Revision chain", SECOND_PROJECT_ID, SECOND_STYLE_ID);
    const initialStyle = { ...source.style, revisionHeadId: null };
    const initialObservations = createFieldObservationRecord(initialStyle, TIME, "existing-local-style");
    const sourceArtwork = {
      assetId: ASSET_ID,
      mimeType: "image/png" as const,
      byteLength: PNG.byteLength,
      sha256: await sha256Hex(PNG, crypto),
    };
    const first = await createStyleRevision({
      styleId: initialStyle.id,
      revisionId: "11111111-1111-4111-8111-111111111111",
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: initialStyle.design,
      fieldObservations: initialObservations,
      artwork: [sourceArtwork],
    }, crypto);
    const currentDesign = {
      ...initialStyle.design,
      measurements: { ...initialStyle.design.measurements, chest: initialStyle.design.measurements.chest + 1 },
    };
    const currentStyle = { ...initialStyle, design: currentDesign, revisionHeadId: "22222222-2222-4222-8222-222222222222" };
    const currentObservations = createFieldObservationRecord(currentStyle, TIME, "existing-local-style");
    const second = await createStyleRevision({
      styleId: initialStyle.id,
      revisionId: currentStyle.revisionHeadId,
      parentRevisionId: first.revisionId,
      revisionNumber: 2,
      createdAt: TIME,
      design: currentDesign,
      fieldObservations: currentObservations,
      artwork: [sourceArtwork],
    }, crypto);
    const sourceAssets = memoryAssets();
    sourceAssets.records.set(ASSET_ID, {
      assetId: ASSET_ID,
      name: "front.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const packageBlob = await createProjectPackage({
      project: source.project,
      styles: [currentStyle],
      recoveries: [],
      fieldObservations: [currentObservations],
      styleRevisions: [first, second],
    }, sourceAssets, { crypto });
    const archive = await readProjectPackage(packageBlob, { crypto });
    const target = await repository();
    const targetAssets = memoryAssets();
    const copied = await importProjectPackage(target, targetAssets, archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
      inspectAsset: inspector,
    });
    expect(copied).toMatchObject({ status: "imported", importedAsCopy: true });
    if (copied.status !== "imported") throw new Error("Revision-chain copy did not complete.");
    const restored = await target.readProjectBundle(copied.projectId);
    const restoredRevisions = restored?.styleRevisions ?? [];
    expect(restoredRevisions).toHaveLength(2);
    expect(restoredRevisions[0]?.parentRevisionId).toBeNull();
    expect(restoredRevisions[1]?.parentRevisionId).toBe(restoredRevisions[0]?.revisionId);
    expect(restored?.styles[0]?.revisionHeadId).toBe(restoredRevisions[1]?.revisionId);
    const copiedPlacement = (restored?.styles[0]?.design.surface["tee/Untitled tee"]?.placements[0]) as import("../surface/placement").ArtworkPlacement | undefined;
    const copiedAssetId = copiedPlacement?.assetId;
    expect(copiedAssetId).not.toBe(ASSET_ID);
    expect(restoredRevisions.map((revision) => revision.payload.artwork[0]?.assetId)).toEqual([copiedAssetId, copiedAssetId]);
    expect(targetAssets.records.get(copiedAssetId ?? "")?.blob.size).toBe(PNG.byteLength);
  });

  it("preserves bundled artwork identity when copying revision history", async () => {
    const source = bundle("Bundled artwork copy");
    const builtInAsset = ARTWORK_CATALOG[0]!.assetId;
    const [surfaceKey, surfaceRecord] = Object.entries(source.style.design.surface)[0]!;
    const placement = surfaceRecord.placements[0] as import("../surface/placement").ArtworkPlacement;
    const style: StyleRecord = {
      ...source.style,
      revisionHeadId: null,
      design: {
        ...source.style.design,
        surface: {
          ...source.style.design.surface,
          [surfaceKey]: { ...surfaceRecord, placements: [{ ...placement, assetId: builtInAsset }] },
        },
      },
    };
    const project = { ...source.project, styleIds: [style.id], activeStyleId: style.id };
    const packageBlob = await createProjectPackage({ project, styles: [style], recoveries: [] }, memoryAssets(), { crypto });
    const archive = await readProjectPackage(packageBlob, { crypto });
    const target = await repository();
    const copied = await importProjectPackage(target, memoryAssets(), archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
    });
    expect(copied.status).toBe("imported");
    if (copied.status !== "imported") throw new Error("Bundled-art copy did not complete.");
    const restored = await target.readProjectBundle(copied.projectId);
    expect(restored?.styleRevisions?.[0]?.payload.artwork[0]?.assetId).toBe(builtInAsset);
    const restoredPlacement = (restored?.styles[0]?.design.surface[surfaceKey]?.placements[0]) as import("../surface/placement").ArtworkPlacement | undefined;
    expect(restoredPlacement?.assetId).toBe(builtInAsset);
  });

  it("rejects a mutated archive copy when frozen-output revision links or bytes no longer verify", async () => {
    const source = await createFrozenSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const originalFrozen = archive.frozenManifests[0]!;
    const missingRevisionId = "99999999-9999-4999-8999-999999999999";
    const missingRevision = {
      ...originalFrozen,
      revisionId: missingRevisionId,
      payload: { ...originalFrozen.payload, revisionId: missingRevisionId },
    };
    const targetWithMissingRevision = await repository();
    await expect(importProjectPackage(targetWithMissingRevision, memoryAssets(), {
      ...archive,
      frozenManifests: [missingRevision],
    }, true, { crypto, now: () => TIME, idFactory: deterministicUuidFactory() })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("points to a missing copied revision"),
    });
    expect(await targetWithMissingRevision.readActiveProject()).toBeNull();

    const originalArtifact = originalFrozen.artifacts[0]!;
    const changedArtifact = new Blob([new Uint8Array(originalArtifact.byteLength).fill(0x41)], { type: originalArtifact.mediaType });
    const changedFrozen = {
      ...originalFrozen,
      artifacts: originalFrozen.artifacts.map((artifact, index) => index === 0
        ? { ...artifact, bytes: changedArtifact }
        : artifact),
    };
    const targetWithChangedBytes = await repository();
    await expect(importProjectPackage(targetWithChangedBytes, memoryAssets(), {
      ...archive,
      frozenManifests: [changedFrozen],
    }, true, { crypto, now: () => TIME, idFactory: deterministicUuidFactory() })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("Copied frozen output"),
    });
    expect(await targetWithChangedBytes.readActiveProject()).toBeNull();
  });

  it("reads package v1 without inventing provenance and imports it as unresolved history", async () => {
    const source = await createSourcePackage();
    const legacyBlob = await makeVersionOnePackage(source.blob);
    const archive = await readProjectPackage(legacyBlob, { crypto });
    expect(archive.manifest.packageVersion).toBe(1);
    expect(archive.manifest.fieldObservations[0]?.observations[0]).toMatchObject({
      provenance: "UNRESOLVED",
      evidenceStatus: "UNCONFIRMED",
      confidence: "NOT_ASSESSED",
      recordedAt: null,
      sourceLabel: expect.stringContaining("version 1 did not record"),
    });
    const target = await repository();
    const imported = await importProjectPackage(target, memoryAssets(), archive, false, { crypto, inspectAsset: inspector });
    expect(imported.status).toBe("imported");
    const restored = await target.readProjectBundle(PROJECT_ID);
    expect(restored?.fieldObservations).toEqual(archive.manifest.fieldObservations);
    expect(restored?.styleRevisions).toHaveLength(1);
    expect(restored?.styles[0]?.revisionHeadId).toBe(restored?.styleRevisions?.[0]?.revisionId);
    expect(restored?.styles[0]?.design.semanticEdits).toBeNull();
  });

  it("copies package v2 with its saved semantic state and creates a new honest baseline revision", async () => {
    const source = await createSourcePackage();
    const legacyBlob = await makeVersionTwoPackage(source.blob);
    const archive = await readProjectPackage(legacyBlob, { crypto });
    expect(archive.manifest.packageVersion).toBe(2);
    expect(archive.manifest.styleRevisions).toHaveLength(0);
    expect(archive.manifest.styles[0]?.revisionHeadId).toBeNull();

    const target = await repository();
    const targetAssets = memoryAssets();
    const copied = await importProjectPackage(target, targetAssets, archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
      inspectAsset: inspector,
    });
    expect(copied).toMatchObject({ status: "imported", importedAsCopy: true });
    if (copied.status !== "imported") throw new Error("Version-two package copy did not complete.");
    const restored = await target.readProjectBundle(copied.projectId);
    expect(restored?.styleRevisions).toHaveLength(1);
    expect(restored?.styleRevisions?.[0]?.parentRevisionId).toBeNull();
    expect(restored?.styles[0]?.revisionHeadId).toBe(restored?.styleRevisions?.[0]?.revisionId);
    expect(restored?.styles[0]?.design.semanticEdits).toBe(archive.manifest.styles[0]?.design.semanticEdits);
    const copiedPlacement = (restored?.styles[0]?.design.surface["tee/Untitled tee"]?.placements[0]) as import("../surface/placement").ArtworkPlacement | undefined;
    const copiedAssetId = copiedPlacement?.assetId;
    expect(copiedAssetId).not.toBe(ASSET_ID);
    expect(targetAssets.records.get(copiedAssetId ?? "")?.blob.size).toBe(PNG.byteLength);
  });

  it("uses the global WebCrypto fallback and hashes nonzero-offset encoded byte views", async () => {
    const source = await createSourcePackage();
    const NativeTextEncoder = globalThis.TextEncoder;
    class OffsetTextEncoder extends NativeTextEncoder {
      override encode(input?: string): Uint8Array<ArrayBuffer> {
        const encoded = super.encode(input);
        const padded = new Uint8Array(encoded.byteLength + 4);
        padded.set(encoded, 2);
        return padded.subarray(2, 2 + encoded.byteLength);
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "TextEncoder");
    Object.defineProperty(globalThis, "TextEncoder", { configurable: true, writable: true, value: OffsetTextEncoder });
    try {
      expect(globalThis.crypto?.subtle).toBeDefined();
      expect(new TextEncoder().encode("view").byteOffset).toBeGreaterThan(0);
      const archive = await readProjectPackage(source.blob);
      expect(archive.manifest.project.id).toBe(PROJECT_ID);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "TextEncoder", descriptor);
    }
  });

  it("exports a strict stored ZIP and imports style artwork with byte identity", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    expect(archive.manifest.format).toBe("infinidrip-project");
    expect(archive.manifest.assets[0]).toMatchObject({ path: `assets/${ASSET_ID}`, attribution: expect.arrayContaining(["Studio reference"]) });

    const target = await repository();
    const targetAssets = memoryAssets();
    const imported = await importProjectPackage(target, targetAssets, archive, false, { crypto, inspectAsset: inspector });
    expect(imported).toEqual({ status: "imported", projectId: PROJECT_ID, importedAsCopy: false });
    const restored = await target.readProjectBundle(PROJECT_ID);
    expect(restored?.styles).toHaveLength(1);
    expect(restored?.styles[0]?.design.surface).toEqual(bundle().style.design.surface);
    expect([...new Uint8Array(await targetAssets.records.get(ASSET_ID)!.blob.arrayBuffer())]).toEqual([...PNG]);
    expect(await target.readProjectImportReceipt(archive.packageSha256)).toMatchObject({ projectId: PROJECT_ID, importedAsCopy: false });
  });

  it("enforces manifest-first ZIP order and rejects unlisted valid-shaped members", async () => {
    const source = await createSourcePackage();
    const original = await readProjectPackage(source.blob, { crypto });
    const entries = await Promise.all([...original.entries.values()].map(async (entry) => ({
      path: entry.path,
      bytes: new Uint8Array(await original.blob.slice(entry.dataOffset, entry.dataOffset + entry.uncompressedSize).arrayBuffer()),
    })));
    const manifest = entries.find((entry) => entry.path === "manifest.json")!;
    const nonManifest = entries.filter((entry) => entry.path !== "manifest.json");
    const manifestLast = await storedZip([...nonManifest, manifest]);
    await expect(readProjectPackage(manifestLast, { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("manifest must be the first ZIP entry"),
    });

    const unlisted = await storedZip([
      manifest,
      ...nonManifest,
      { path: "assets/local-99999999999999999999999999999999-png", bytes: new Uint8Array([0x7f]) },
    ]);
    await expect(readProjectPackage(unlisted, { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: expect.stringContaining("ZIP files and manifest asset entries do not match exactly"),
    });
  });

  it("normalizes non-Error failures from the package writer", async () => {
    const source = bundle();
    const assets = memoryAssets();
    assets.records.set(ASSET_ID, {
      assetId: ASSET_ID, name: "front.png", mimeType: "image/png", blob: new Blob([PNG], { type: "image/png" }),
    });
    await expect(createProjectPackage({ project: source.project, styles: [source.style], recoveries: [] }, assets, {
      crypto,
      onProgress: (value) => { if (value.phase === "write") throw "writer callback failed"; },
    })).rejects.toMatchObject({ code: "invalid-package", message: "ZIP processing failed." });
  });

  it("is idempotent for the same package and requires an explicit copy for source-ID collisions", async () => {
    const firstPackage = await createSourcePackage();
    const secondPackage = await createSourcePackage(memoryAssets(), "Revised source name");
    const target = await repository();
    const assets = memoryAssets();
    const options = { crypto, inspectAsset: inspector };
    const firstArchive = await readProjectPackage(firstPackage.blob, { crypto });
    const first = await importProjectPackage(target, assets, firstArchive, false, options);
    expect(first.status).toBe("imported");
    expect(await importProjectPackage(target, assets, firstArchive, false, options)).toMatchObject({ status: "already-imported" });

    const secondArchive = await readProjectPackage(secondPackage.blob, { crypto });
    expect(await importProjectPackage(target, assets, secondArchive, false, options)).toMatchObject({ status: "copy-required" });
    const copied = await importProjectPackage(target, assets, secondArchive, true, options);
    expect(copied).toMatchObject({ status: "imported", importedAsCopy: true });
    if (copied.status !== "imported") throw new Error("Copy import did not complete.");
    const copy = await target.loadProject(copied.projectId);
    expect(copy?.project.importedFrom).toEqual({ projectId: PROJECT_ID, styleIds: [STYLE_ID], packageSha256: secondArchive.packageSha256 });
    expect(copy?.activeStyle.design.surface).not.toEqual(bundle().style.design.surface);
    expect(assets.records.size).toBe(2);
  });

  it("rejects corruption and cancellation before touching project or asset storage", async () => {
    const source = await createSourcePackage();
    const bytes = new Uint8Array(await source.blob.arrayBuffer());
    bytes[45] ^= 0xff;
    const corrupted = new Blob([bytes], { type: "application/zip" });
    await expect(readProjectPackage(corrupted, { crypto })).rejects.toMatchObject({ code: "invalid-package" });
    const oversized = { size: PROJECT_PACKAGE_MAX_BYTES + 1 } as Blob;
    await expect(readProjectPackage(oversized, { crypto })).rejects.toMatchObject({ code: "limit-exceeded" });

    const target = await repository();
    const targetAssets = memoryAssets();
    const archive = await readProjectPackage(source.blob, { crypto });
    const controller = new AbortController();
    controller.abort();
    await expect(importProjectPackage(target, targetAssets, archive, false, { crypto, signal: controller.signal }))
      .rejects.toMatchObject({ code: "cancelled" });
    expect(await target.readActiveProject()).toBeNull();
    expect(targetAssets.records.size).toBe(0);
  });

  it("reports a streaming ZIP decoder error after structural preflight", async () => {
    const source = await createSourcePackage();
    vi.spyOn(UnzipPassThrough.prototype, "push").mockImplementation(function (this: UnzipPassThrough) {
      this.ondata(Object.assign(new Error("synthetic stored-entry decoder failure"), { code: 13 }), new Uint8Array(), true);
    });

    await expect(readProjectPackage(source.blob, { crypto })).rejects.toMatchObject({
      code: "invalid-package",
      message: "synthetic stored-entry decoder failure",
    });
  });

  it("rejects truncated, ZIP64, duplicate-path, unsafe-path, and unsupported-compression archives", async () => {
    const source = await createSourcePackage();
    const original = new Uint8Array(await source.blob.arrayBuffer());
    const findEocd = (bytes: Uint8Array): number => {
      for (let index = bytes.length - 22; index >= 0; index -= 1) {
        if (new DataView(bytes.buffer, bytes.byteOffset + index, 4).getUint32(0, true) === 0x06054b50) return index;
      }
      throw new Error("Test ZIP did not contain an end-of-central-directory record.");
    };
    const eocd = findEocd(original);
    await expect(readProjectPackage(new Blob([original.slice(0, original.length - 10)]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package" });

    const zip64 = original.slice();
    const zip64View = new DataView(zip64.buffer);
    zip64View.setUint16(eocd + 8, 0xffff, true);
    zip64View.setUint16(eocd + 10, 0xffff, true);
    await expect(readProjectPackage(new Blob([zip64]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("ZIP64") });

    await expect(readProjectPackage(await duplicateEntryZip(), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("duplicate entry") });

    const centralOffset = zip64View.getUint32(eocd + 16, true);
    const firstNameLength = zip64View.getUint16(centralOffset + 28, true);
    const secondCentral = centralOffset + 46 + firstNameLength;
    const secondLocal = zip64View.getUint32(secondCentral + 42, true);
    const nameLength = zip64View.getUint16(secondCentral + 28, true);
    const unsafePath = original.slice();
    unsafePath[secondCentral + 46] = 0x2e;
    unsafePath[secondLocal + 30] = 0x2e;
    await expect(readProjectPackage(new Blob([unsafePath]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("supported local artwork or frozen-output path") });

    const compressed = original.slice();
    new DataView(compressed.buffer).setUint16(secondCentral + 10, 8, true);
    await expect(readProjectPackage(new Blob([compressed]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("unsupported feature") });
    expect(nameLength).toBeGreaterThan(0);
  });

  it("rejects inconsistent ZIP envelope, entry, local-header, and descriptor fields", async () => {
    const source = await createSourcePackage();
    const valid = new Uint8Array(await source.blob.arrayBuffer());
    const eocd = findPackageEocd(valid);
    const initial = new DataView(valid.buffer, valid.byteOffset, valid.byteLength);
    const centralOffset = initial.getUint32(eocd + 16, true);
    const firstNameLength = initial.getUint16(centralOffset + 28, true);
    const secondCentral = centralOffset + 46 + firstNameLength;
    const secondNameLength = initial.getUint16(secondCentral + 28, true);
    const secondLocal = initial.getUint32(secondCentral + 42, true);
    const assetDataOffset = secondLocal + 30 + secondNameLength;
    const assetSize = initial.getUint32(secondCentral + 24, true);
    const descriptorOffset = assetDataOffset + assetSize;
    const mutations: Array<{ label: string; apply: (bytes: Uint8Array) => Uint8Array }> = [
      { label: "multi-disk archive", apply: (bytes) => { new DataView(bytes.buffer).setUint16(eocd + 4, 1, true); return bytes; } },
      { label: "directory on another disk", apply: (bytes) => { new DataView(bytes.buffer).setUint16(eocd + 6, 1, true); return bytes; } },
      { label: "disk entry count mismatch", apply: (bytes) => { new DataView(bytes.buffer).setUint16(eocd + 8, 1, true); return bytes; } },
      { label: "empty directory", apply: (bytes) => { const view = new DataView(bytes.buffer); view.setUint16(eocd + 8, 0, true); view.setUint16(eocd + 10, 0, true); return bytes; } },
      { label: "too many entries", apply: (bytes) => { const view = new DataView(bytes.buffer); view.setUint16(eocd + 8, 130, true); view.setUint16(eocd + 10, 130, true); return bytes; } },
      { label: "ZIP64 entry count", apply: (bytes) => { const view = new DataView(bytes.buffer); view.setUint16(eocd + 8, 0xffff, true); view.setUint16(eocd + 10, 0xffff, true); return bytes; } },
      { label: "ZIP64 directory length", apply: (bytes) => { new DataView(bytes.buffer).setUint32(eocd + 12, 0xffffffff, true); return bytes; } },
      { label: "ZIP64 directory offset", apply: (bytes) => { new DataView(bytes.buffer).setUint32(eocd + 16, 0xffffffff, true); return bytes; } },
      { label: "directory above manifest cap", apply: (bytes) => { new DataView(bytes.buffer).setUint32(eocd + 12, PROJECT_PACKAGE_MAX_MANIFEST_BYTES + 1, true); return bytes; } },
      { label: "directory offset inconsistency", apply: (bytes) => { new DataView(bytes.buffer).setUint32(eocd + 16, 1, true); return bytes; } },
      {
        label: "archive comment",
        apply: (bytes) => { const next = new Uint8Array(bytes.length + 1); next.set(bytes); new DataView(next.buffer).setUint16(eocd + 20, 1, true); return next; },
      },
      { label: "central directory signature", apply: (bytes) => { bytes[centralOffset] = 0; return bytes; } },
      { label: "central directory truncated", apply: (bytes) => { const view = new DataView(bytes.buffer); view.setUint16(eocd + 8, 3, true); view.setUint16(eocd + 10, 3, true); return bytes; } },
      { label: "unsupported version", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 6, 21, true); return bytes; } },
      { label: "unsupported flags", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 8, 0, true); return bytes; } },
      { label: "unsupported method", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 10, 8, true); return bytes; } },
      { label: "ZIP64 compressed size", apply: (bytes) => { new DataView(bytes.buffer).setUint32(centralOffset + 20, 0xffffffff, true); return bytes; } },
      { label: "ZIP64 uncompressed size", apply: (bytes) => { new DataView(bytes.buffer).setUint32(centralOffset + 24, 0xffffffff, true); return bytes; } },
      { label: "unequal stored sizes", apply: (bytes) => { const view = new DataView(bytes.buffer); view.setUint32(centralOffset + 20, view.getUint32(centralOffset + 20, true) + 1, true); return bytes; } },
      { label: "entry on another disk", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 34, 1, true); return bytes; } },
      { label: "unsupported internal attributes", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 36, 1, true); return bytes; } },
      { label: "unsupported external attributes", apply: (bytes) => { new DataView(bytes.buffer).setUint32(centralOffset + 38, 1, true); return bytes; } },
      { label: "missing path", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 28, 0, true); return bytes; } },
      { label: "oversized path", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 28, 221, true); return bytes; } },
      { label: "extra fields", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 30, 1, true); return bytes; } },
      { label: "entry comment", apply: (bytes) => { new DataView(bytes.buffer).setUint16(centralOffset + 32, 1, true); return bytes; } },
      { label: "unexpected entry offset", apply: (bytes) => { new DataView(bytes.buffer).setUint32(centralOffset + 42, 1, true); return bytes; } },
      { label: "non-ASCII path", apply: (bytes) => { bytes[centralOffset + 46] = 0xff; return bytes; } },
      { label: "local header signature", apply: (bytes) => { bytes[secondLocal] = 0; return bytes; } },
      { label: "local header flags", apply: (bytes) => { new DataView(bytes.buffer).setUint16(secondLocal + 6, 0, true); return bytes; } },
      { label: "local header method", apply: (bytes) => { new DataView(bytes.buffer).setUint16(secondLocal + 8, 8, true); return bytes; } },
      { label: "local header CRC", apply: (bytes) => { new DataView(bytes.buffer).setUint32(secondLocal + 14, 1, true); return bytes; } },
      { label: "local header sizes", apply: (bytes) => { new DataView(bytes.buffer).setUint32(secondLocal + 18, 1, true); return bytes; } },
      { label: "local header name length", apply: (bytes) => { new DataView(bytes.buffer).setUint16(secondLocal + 26, 1, true); return bytes; } },
      { label: "local header extra field", apply: (bytes) => { new DataView(bytes.buffer).setUint16(secondLocal + 28, 1, true); return bytes; } },
      { label: "local header path", apply: (bytes) => { bytes[secondLocal + 30] ^= 1; return bytes; } },
      { label: "descriptor CRC", apply: (bytes) => { new DataView(bytes.buffer).setUint32(descriptorOffset + 4, 1, true); return bytes; } },
      { label: "descriptor sizes", apply: (bytes) => { new DataView(bytes.buffer).setUint32(descriptorOffset + 8, 1, true); return bytes; } },
    ];
    for (const candidate of mutations) {
      const bytes = candidate.apply(valid.slice());
      await expect(readProjectPackage(new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer]), { crypto }), candidate.label)
        .rejects.toBeInstanceOf(ProjectPackageError);
    }
    const assetFirst = await storedZip([
      { path: "assets/" + ASSET_ID, bytes: PNG },
      { path: "manifest.json", bytes: new TextEncoder().encode("{}") },
    ]);
    await expect(readProjectPackage(assetFirst, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("manifest must be the first") });
  });

  it("rejects truncated descriptors, central-directory overlap, and stream/preflight disagreement", async () => {
    const source = await createSourcePackage();
    const original = new Uint8Array(await source.blob.arrayBuffer());
    const view = new DataView(original.buffer);
    const eocd = findPackageEocd(original);
    const directoryOffset = view.getUint32(eocd + 16, true);
    const localOffset = view.getUint32(directoryOffset + 42, true);
    const compressedSize = view.getUint32(directoryOffset + 20, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const descriptorOffset = localOffset + 30 + localNameLength + compressedSize;
    const spanEnd = descriptorOffset + 16;

    const truncatedDescriptor = {
      size: source.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === descriptorOffset && end === spanEnd) return new Blob([original.subarray(start, end - 1)]);
        return source.blob.slice(start, end, contentType);
      },
    } as Blob;
    await expect(readProjectPackage(truncatedDescriptor, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("descriptor") });

    const overlapBytes = original.slice();
    const overlapView = new DataView(overlapBytes.buffer);
    const entryCount = overlapView.getUint16(eocd + 10, true);
    const directoryBytes = overlapView.getUint32(eocd + 12, true);
    overlapView.setUint32(eocd + 16, directoryOffset - 1, true);
    overlapView.setUint32(eocd + 12, directoryBytes + 1, true);
    const tailStart = Math.max(0, source.blob.size - 22 - 65_535);
    const overlappingDirectory = {
      size: source.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === directoryOffset - 1 && end === eocd) {
          return new Blob([original.subarray(directoryOffset, eocd)], { type: contentType });
        }
        if (start === tailStart && end === undefined) return new Blob([overlapBytes.subarray(tailStart)]);
        return source.blob.slice(start, end, contentType);
      },
    } as Blob;
    expect(entryCount).toBeGreaterThan(0);
    await expect(readProjectPackage(overlappingDirectory, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("overlaps the central directory") });

    const noFileStream = {
      size: source.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === localOffset && end === spanEnd) {
          const bytes = original.slice(localOffset, spanEnd);
          bytes.fill(0, 0, 4);
          return new Blob([bytes], { type: contentType });
        }
        return source.blob.slice(start, end, contentType);
      },
    } as Blob;
    await expect(readProjectPackage(noFileStream, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("found no file") });

    const primitiveStreamError = {
      size: source.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === localOffset && end === spanEnd) {
          return {
            size: spanEnd - localOffset,
            stream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.error("stream failed"); } }),
          } as Blob;
        }
        return source.blob.slice(start, end, contentType);
      },
    } as Blob;
    await expect(readProjectPackage(primitiveStreamError, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: "ZIP processing failed." });

    const controller = new AbortController();
    await expect(readProjectPackage(source.blob, {
      crypto,
      signal: controller.signal,
      onProgress: (value) => { if (value.phase === "validate") controller.abort(); },
    })).rejects.toMatchObject({ code: "cancelled" });
  });

  it("rejects truncated local headers, unlisted bytes, and ZIP members that disagree with the manifest", async () => {
    const source = await createSourcePackage();
    const original = new Uint8Array(await source.blob.arrayBuffer());
    const eocd = findPackageEocd(original);
    const originalView = new DataView(original.buffer);
    const centralOffset = originalView.getUint32(eocd + 16, true);
    const manifestNameLength = originalView.getUint16(centralOffset + 28, true);
    const manifestLocalLength = 30 + manifestNameLength;
    const truncatedBlob = {
      size: source.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === 0 && end === manifestLocalLength) return new Blob([]);
        return source.blob.slice(start, end, contentType);
      },
    } as Blob;
    await expect(readProjectPackage(truncatedBlob, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("local header") });

    const injected = new Uint8Array(original.length + 1);
    injected.set(original.slice(0, centralOffset));
    injected[centralOffset] = 0x7f;
    injected.set(original.slice(centralOffset), centralOffset + 1);
    new DataView(injected.buffer).setUint32(eocd + 1 + 16, centralOffset + 1, true);
    await expect(readProjectPackage(new Blob([injected.buffer as ArrayBuffer]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("unlisted bytes") });

    const secondCentral = centralOffset + 46 + manifestNameLength;
    const secondNameLength = originalView.getUint16(secondCentral + 28, true);
    const secondLocal = originalView.getUint32(secondCentral + 42, true);
    const renamed = original.slice();
    const hexIndex = secondNameLength - 5;
    const nextHex = renamed[secondCentral + 46 + hexIndex] === 0x30 ? 0x31 : 0x30;
    renamed[secondCentral + 46 + hexIndex] = nextHex;
    renamed[secondLocal + 30 + hexIndex] = nextHex;
    await expect(readProjectPackage(new Blob([renamed.buffer as ArrayBuffer]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("does not match its manifest") });
  });

  it("rejects altered ZIP streams and declared-size expansion before project records are committed", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const asset = archive.manifest.assets[0]!;
    const originalEntry = archive.entries.get(asset.path)!;
    const unexpectedEntries = new Map(archive.entries);
    unexpectedEntries.set(asset.path, { ...originalEntry, path: "assets/local-ffffffffffffffffffffffffffffffff-png" });
    const target = await repository();
    await expect(importProjectPackage(target, memoryAssets(), {
      ...archive, entries: unexpectedEntries,
    }, false, { crypto, inspectAsset: inspector })).rejects.toMatchObject({ code: "invalid-package" });

    const oversizedEntries = new Map(archive.entries);
    oversizedEntries.set(asset.path, { ...originalEntry, uncompressedSize: 1 });
    await expect(importProjectPackage(target, memoryAssets(), {
      ...archive, entries: oversizedEntries,
    }, false, { crypto, inspectAsset: inspector })).rejects.toMatchObject({ code: "invalid-package" });
    expect(await target.readActiveProject()).toBeNull();

    const missingDuringValidation = new Map(archive.entries);
    missingDuringValidation.delete(asset.path);
    await expect(importProjectPackage(target, memoryAssets(), {
      ...archive, entries: missingDuringValidation,
    }, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("has no ZIP entry") });
    const removedDuringValidation = new Map(archive.entries);
    await expect(importProjectPackage(target, memoryAssets(), {
      ...archive, entries: removedDuringValidation,
    }, false, {
      crypto,
      inspectAsset: inspector,
      onProgress: (value) => { if (value.phase === "validate") removedDuringValidation.delete(asset.path); },
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("is missing from the ZIP") });
  });

  it("detects an artwork change between validation and staging and rejects altered inspector output", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const asset = archive.manifest.assets[0]!;
    const entry = archive.entries.get(asset.path)!;
    const manifestEntry = archive.entries.get("manifest.json")!;
    const manifestBytes = new Uint8Array(await archive.blob.slice(
      manifestEntry.dataOffset, manifestEntry.dataOffset + manifestEntry.uncompressedSize,
    ).arrayBuffer());
    const data = new Uint8Array(await archive.blob.slice(entry.dataOffset, entry.dataOffset + entry.uncompressedSize).arrayBuffer());
    data[0] ^= 1;
    const changedBlob = await storedZip([
      { path: "manifest.json", bytes: manifestBytes },
      { path: entry.path, bytes: data },
    ]);
    const changedArchive = await readProjectPackage(changedBlob, { crypto });
    const changedEntry = changedArchive.entries.get(asset.path)!;
    const reads = { count: 0 };
    const shiftingBlob = {
      size: archive.blob.size,
      slice(start?: number, end?: number, contentType?: string): Blob {
        if (start === entry.localOffset && end === entry.spanEnd) {
          reads.count += 1;
          return reads.count === 1
            ? archive.blob.slice(start, end, contentType)
            : changedArchive.blob.slice(changedEntry.localOffset, changedEntry.spanEnd, contentType);
        }
        return archive.blob.slice(start, end, contentType);
      },
    } as Blob;
    const mutableEntries = new Map(archive.entries);
    const target = await repository();
    await expect(importProjectPackage(target, memoryAssets(), {
      ...archive, blob: shiftingBlob, entries: mutableEntries,
    }, false, {
      crypto,
      inspectAsset: inspector,
      onProgress: (value) => {
        if (value.phase === "validate") mutableEntries.set(asset.path, { ...entry, crc32: changedEntry.crc32 });
      },
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed between validation and staging") });
    expect(reads.count).toBe(2);

    let inspection = 0;
    await expect(importProjectPackage(target, memoryAssets(), archive, false, {
      crypto,
      inspectAsset: async (file) => {
        inspection += 1;
        return inspection === 1
          ? { name: file.name, mimeType: "image/png", blob: file }
          : { name: file.name, mimeType: "image/png", blob: new Blob([PNG, new Uint8Array([1])], { type: "image/png" }) };
      },
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed during validation") });
    expect(inspection).toBe(2);

    let oversizeInspection = 0;
    await expect(importProjectPackage(target, memoryAssets(), archive, false, {
      crypto,
      inspectAsset: async (file) => {
        oversizeInspection += 1;
        return oversizeInspection === 1
          ? { name: file.name, mimeType: "image/png", blob: file }
          : {
            name: file.name,
            mimeType: "image/png",
            blob: { size: 10 * 1024 * 1024 + 1, type: "image/png", arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Blob,
          };
      },
    })).rejects.toMatchObject({ code: "limit-exceeded", message: expect.stringContaining("10 MiB") });
  });

  it("handles artwork write races, read-back failure, and concurrent duplicate imports safely", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const target = await repository();
    let gets = 0;
    const raceStore: ArtworkAssetStore = {
      put: async () => { throw new Error("write raced with another tab"); },
      get: async (id) => {
        gets += 1;
        return gets === 1 ? null : {
          assetId: id, name: "other.png", mimeType: "image/png",
          blob: new Blob([PNG, new Uint8Array([7])], { type: "image/png" }),
        };
      },
      remove: async () => undefined,
    };
    await expect(importProjectPackage(target, raceStore, archive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "conflict", message: expect.stringContaining("created or changed by another operation") });

    const nonErrorWriteFailure: ArtworkAssetStore = {
      put: async () => { throw "disk unavailable"; },
      get: async () => null,
      remove: async () => undefined,
    };
    await expect(importProjectPackage(target, nonErrorWriteFailure, archive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "storage", message: expect.stringContaining("storage failed") });

    const stored = new Map<string, StoredArtworkAsset>();
    const badReadback: ArtworkAssetStore = {
      put: async (assetRecord) => { stored.set(assetRecord.assetId, assetRecord); },
      get: async (id) => {
        gets += 1;
        return gets === 1 ? null : ({
          assetId: id, name: "wrong.png", mimeType: "image/jpeg",
          blob: new Blob([PNG], { type: "image/jpeg" }),
        } as unknown as StoredArtworkAsset);
      },
      remove: async (id) => { stored.delete(id); },
    };
    gets = 0;
    await expect(importProjectPackage(target, badReadback, archive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "storage", message: expect.stringContaining("read-back verification") });
    expect(stored.size).toBe(0);

    const concurrentRepository = new Proxy(target, {
      get(repositoryTarget, property) {
        if (property === "importProjectBundle") {
          return async () => ({
            status: "already-imported" as const,
            receipt: {
              packageSha256: archive.packageSha256,
              projectId: archive.manifest.project.id,
              importedAt: TIME,
              importedAsCopy: false,
            },
          });
        }
        const value = Reflect.get(repositoryTarget, property, repositoryTarget) as unknown;
        return typeof value === "function" ? value.bind(repositoryTarget) : value;
      },
    });
    const concurrentAssets = memoryAssets();
    const duplicate = await importProjectPackage(concurrentRepository, concurrentAssets, archive, false, {
      crypto, inspectAsset: inspector,
    });
    expect(duplicate.status).toBe("already-imported");
    expect(concurrentAssets.records.size).toBe(0);

    const orphaningAssets: ArtworkAssetStore = {
      put: async (assetRecord) => { concurrentAssets.records.set(assetRecord.assetId, assetRecord); },
      get: async (id) => concurrentAssets.records.get(id) ?? null,
      remove: async () => { throw new Error("cleanup is blocked"); },
    };
    await expect(importProjectPackage(concurrentRepository, orphaningAssets, archive, false, {
      crypto, inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "storage", message: expect.stringContaining("unreferenced") });

    const importFailure = (failure: unknown): ProjectRepository => new Proxy(target, {
      get(repositoryTarget, property) {
        if (property === "importProjectBundle") return async () => { throw failure; };
        const value = Reflect.get(repositoryTarget, property, repositoryTarget) as unknown;
        return typeof value === "function" ? value.bind(repositoryTarget) : value;
      },
    });
    const primitiveFailureAssets = memoryAssets();
    await expect(importProjectPackage(importFailure("transaction failed"), primitiveFailureAssets, archive, false, {
      crypto, inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "transaction", message: expect.stringContaining("Project import failed") });
    expect(primitiveFailureAssets.records.size).toBe(0);

    const quotaFailure = Object.assign(new Error("quota exhausted"), { code: "quota-exceeded" });
    await expect(importProjectPackage(importFailure(quotaFailure), memoryAssets(), archive, false, {
      crypto, inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "quota-exceeded", message: expect.stringContaining("quota exhausted") });
  });

  it("rejects malformed manifests, excess assets, stale hashes, and oversized JSON before import", async () => {
    const source = await createSourcePackage();
    const mutations: Array<{ label: string; mutate: (manifest: Record<string, unknown>) => void; resign?: boolean }> = [
      { label: "unknown manifest key", mutate: (manifest) => { manifest.extra = true; } },
      { label: "unsupported format", mutate: (manifest) => { manifest.format = "other"; } },
      { label: "unsupported package version", mutate: (manifest) => { manifest.packageVersion = 4; } },
      { label: "malformed field observations", mutate: (manifest) => { manifest.fieldObservations = [{}]; } },
      {
        label: "field history references a foreign style",
        mutate: (manifest) => {
          const observations = manifest.fieldObservations as Array<Record<string, unknown>>;
          observations[0] = { ...observations[0], styleId: "77777777-7777-4777-8777-777777777777" };
        },
      },
      { label: "missing field history", mutate: (manifest) => { manifest.fieldObservations = []; } },
      {
        label: "duplicate field history",
        mutate: (manifest) => {
          const observations = manifest.fieldObservations as unknown[];
          manifest.fieldObservations = [observations[0], observations[0]];
        },
      },
      { label: "malformed package digest", mutate: (manifest) => { manifest.packageSha256 = "bad"; }, resign: false },
      { label: "malformed project", mutate: (manifest) => { manifest.project = null; } },
      { label: "project/style membership mismatch", mutate: (manifest) => { manifest.styles = []; } },
      { label: "malformed style", mutate: (manifest) => { manifest.styles = [{}]; } },
      { label: "malformed recovery", mutate: (manifest) => { manifest.recoveries = [{}]; } },
      {
        label: "too many assets",
        mutate: (manifest) => {
          const assets = manifest.assets as unknown[];
          manifest.assets = Array.from({ length: 129 }, () => assets[0]);
        },
      },
      {
        label: "duplicate asset attribution",
        mutate: (manifest) => {
          const assets = manifest.assets as Array<Record<string, unknown>>;
          assets[0] = { ...assets[0], attribution: ["Studio reference", "Studio reference"] };
        },
      },
      {
        label: "attribution does not match saved placements",
        mutate: (manifest) => {
          const assets = manifest.assets as Array<Record<string, unknown>>;
          assets[0] = { ...assets[0], attribution: [] };
        },
      },
      {
        label: "unsafe artwork name",
        mutate: (manifest) => {
          const assets = manifest.assets as Array<Record<string, unknown>>;
          assets[0] = { ...assets[0], name: "../front.png" };
        },
      },
      {
        label: "duplicate asset identity",
        mutate: (manifest) => {
          const assets = manifest.assets as unknown[];
          manifest.assets = [assets[0], assets[0]];
        },
      },
      {
        label: "artwork IDs do not match style references",
        mutate: (manifest) => {
          const assets = manifest.assets as Array<Record<string, unknown>>;
          assets[0] = {
            ...assets[0],
            assetId: "local-ffffffffffffffffffffffffffffffff-png",
            path: "assets/local-ffffffffffffffffffffffffffffffff-png",
          };
        },
      },
      { label: "referenced artwork omitted from manifest", mutate: (manifest) => { manifest.assets = []; } },
    ];
    for (const candidate of mutations) {
      const malformed = await replacePackageManifest(source.blob, candidate.mutate, candidate.resign);
      await expect(readProjectPackage(malformed, { crypto }), candidate.label)
        .rejects.toBeInstanceOf(ProjectPackageError);
    }

    const noReferenceButExtraFile = await replacePackageManifest(source.blob, (manifest) => {
      const styles = manifest.styles as Array<Record<string, unknown>>;
      const style = styles[0]!;
      const design = style.design as Record<string, unknown>;
      const surface = design.surface as Record<string, Record<string, unknown>>;
      const [key, record] = Object.entries(surface)[0]!;
      const placements = record.placements as Array<Record<string, unknown>>;
      const nextRecord = { ...record, placements: placements.map(({ assetId: _assetId, ...placement }) => placement) };
      surface[key] = nextRecord;
      manifest.assets = [];
    });
    await expect(readProjectPackage(noReferenceButExtraFile, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package" });

    const staleDigest = await replacePackageManifest(source.blob, (manifest) => {
      const project = manifest.project as Record<string, unknown>;
      manifest.project = { ...project, name: "A changed but otherwise valid project name" };
    }, false);
    await expect(readProjectPackage(staleDigest, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("SHA-256") });

    const archive = await readProjectPackage(source.blob, { crypto });
    const originalManifest = new Uint8Array(await archive.blob.slice(
      archive.entries.get("manifest.json")!.dataOffset,
      archive.entries.get("manifest.json")!.dataOffset + archive.entries.get("manifest.json")!.uncompressedSize,
    ).arrayBuffer());
    await expect(readProjectPackage(await storedZip([
      { path: "manifest.json", bytes: new Uint8Array([...originalManifest, ...new Uint8Array(PROJECT_PACKAGE_MAX_MANIFEST_BYTES + 1 - originalManifest.length)]) },
      ...archive.manifest.assets.map((asset) => {
        const entry = archive.entries.get(asset.path)!;
        return {
          path: entry.path,
          bytes: new Uint8Array(),
        };
      }),
    ]), { crypto })).rejects.toMatchObject({ code: "limit-exceeded" });
    await expect(readProjectPackage(await storedZip([{ path: "manifest.json", bytes: new Uint8Array([0xff, 0xfe]) }]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(readProjectPackage(await storedZip([{ path: "manifest.json", bytes: new Uint8Array([0x7b]) }]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("not valid UTF-8 JSON") });
    await expect(readProjectPackage(await storedZip([{ path: "manifest.json", bytes: new TextEncoder().encode("[]") }]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(readProjectPackage(await storedZip([{ path: "manifest.json", bytes: new TextEncoder().encode("null") }]), { crypto }))
      .rejects.toMatchObject({ code: "invalid-package" });
  }, 30_000);

  it("validates artwork checksums and safe-image output before touching project storage", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const manifestEntry = archive.entries.get("manifest.json")!;
    const manifestBytes = new Uint8Array(await archive.blob.slice(
      manifestEntry.dataOffset, manifestEntry.dataOffset + manifestEntry.uncompressedSize,
    ).arrayBuffer());
    const asset = archive.manifest.assets[0]!;
    const assetEntry = archive.entries.get(asset.path)!;
    const changedBytes = new Uint8Array(await archive.blob.slice(
      assetEntry.dataOffset, assetEntry.dataOffset + assetEntry.uncompressedSize,
    ).arrayBuffer());
    changedBytes[0] ^= 0xff;

    const changedArchive = await readProjectPackage(await storedZip([
      { path: "manifest.json", bytes: manifestBytes },
      { path: assetEntry.path, bytes: changedBytes },
    ]), { crypto });
    const target = await repository();
    const assets = memoryAssets();
    await expect(importProjectPackage(target, assets, changedArchive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "invalid-package" });
    expect(await target.readActiveProject()).toBeNull();
    expect(assets.records.size).toBe(0);

    const rawCorruption = new Uint8Array(await archive.blob.arrayBuffer());
    rawCorruption[assetEntry.dataOffset] ^= 0xff;
    const crcArchive = await readProjectPackage(new Blob([rawCorruption.buffer as ArrayBuffer]), { crypto });
    await expect(importProjectPackage(target, assets, crcArchive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "invalid-package" });
    expect(await target.readActiveProject()).toBeNull();

    await expect(importProjectPackage(target, assets, archive, false, {
      crypto,
      inspectAsset: async (file) => ({ name: file.name, mimeType: "image/jpeg", blob: file }),
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("safe-image validation") });
    await expect(importProjectPackage(target, assets, archive, false, {
      crypto,
      inspectAsset: async () => { throw "inspector failed"; },
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("invalid image") });
    await expect(importProjectPackage(target, assets, archive, false, {
      crypto,
      inspectAsset: async (file) => ({ name: file.name, mimeType: file.type as "image/png", blob: new Blob([PNG, new Uint8Array([5])], { type: file.type }) }),
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed during safe-image validation") });
  });

  it("rejects orphaned or duplicate recovery records and remaps a valid recovery with copied style IDs", async () => {
    const source = await createSourcePackage();
    const orphaned = await replacePackageManifest(source.blob, (manifest) => {
      manifest.recoveries = [recoveryRecord(SECOND_STYLE_ID)];
    });
    await expect(readProjectPackage(orphaned, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("must reference a style") });

    const recovery = recoveryRecord();
    const duplicate = await replacePackageManifest(source.blob, (manifest) => {
      manifest.recoveries = [recovery, recovery];
    });
    await expect(readProjectPackage(duplicate, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("multiple recovery") });

    const valid = await replacePackageManifest(source.blob, (manifest) => {
      manifest.recoveries = [recovery];
    });
    const archive = await readProjectPackage(valid, { crypto });
    const target = await repository();
    const outcome = await importProjectPackage(target, memoryAssets(), archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
      inspectAsset: inspector,
    });
    expect(outcome).toMatchObject({ status: "imported", importedAsCopy: true });
    if (outcome.status !== "imported") throw new Error("Copy import did not complete.");
    const copied = await target.readProjectBundle(outcome.projectId);
    expect(copied?.recoveries).toHaveLength(1);
    expect(copied?.recoveries[0]?.styleId).toBe(copied?.styles[0]?.id);
    expect(copied?.recoveries[0]?.styleId).not.toBe(STYLE_ID);
  });

  it("preserves archived secondary styles while remapping an artwork-free project copy", async () => {
    const initial = bundle("Archived copy", SECOND_PROJECT_ID, STYLE_ID);
    const removeArtwork = (style: StyleRecord): StyleRecord => ({
      ...style,
      design: {
        ...style.design,
        surface: Object.fromEntries(Object.entries(style.design.surface).map(([key, record]) => [
          key,
          {
            ...record,
            placements: (record.placements as readonly import("../surface/placement").ArtworkPlacement[])
              .map(({ assetId: _assetId, ...placement }) => placement),
          },
        ])),
      },
    });
    const active = removeArtwork(initial.style);
    const archived = {
      ...removeArtwork(initial.style),
      id: SECOND_STYLE_ID,
      name: "Archived style",
      archivedAt: TIME,
    };
    const project = {
      ...initial.project,
      styleIds: [active.id, archived.id],
      activeStyleId: active.id,
    };
    const packed = await createProjectPackage({ project, styles: [active, archived], recoveries: [] }, memoryAssets(), { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    const target = await repository();
    const imported = await importProjectPackage(target, memoryAssets(), archive, true, {
      crypto,
      now: () => TIME,
      idFactory: deterministicUuidFactory(),
    });
    expect(imported).toMatchObject({ status: "imported", importedAsCopy: true });
    if (imported.status !== "imported") throw new Error("Copy import did not complete.");
    const copied = await target.loadProject(imported.projectId);
    expect(copied?.styles).toHaveLength(2);
    expect(copied?.styles.find((style) => style.name === "Archived style")?.archivedAt).toBe(TIME);
    expect(copied?.styles.every((style) => style.id !== STYLE_ID && style.id !== SECOND_STYLE_ID)).toBe(true);
  });

  it("round-trips semantic edit source, operation order, undo/redo history, and recovery in a project package", async () => {
    const source = bundle("Semantic backup");
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const options = defaultGarmentOptions(recipe.options ?? []);
    const sourceInputs = {
      measurements: Object.fromEntries(recipe.fields.map((field) => [field, STANDARD_M[field]])),
      options: Object.fromEntries((recipe.options ?? []).map((option) => [option.id, options[option.id]])),
    };
    const base = recipe.draft(STANDARD_M, options);
    const fingerprint = await semanticEditSourceFingerprint(recipe.name, base, crypto, sourceInputs);
    const anchors = semanticAnchorCatalog(recipe.name, base).filter((anchor) => anchor.roleId === "front");
    const first = createAnchorMoveOperation(recipe.name, fingerprint, base, "edit-1", anchors[0]!.id, { x: 0.05, y: 0 });
    const second = createAnchorMoveOperation(recipe.name, fingerprint, base, "edit-2", anchors[1]!.id, { x: 0, y: 0.05 });
    const edited = appendSemanticEditOperations(
      appendSemanticEditOperations(emptySemanticEditDocument(recipe.name, fingerprint, sourceInputs), [first]),
      [second],
    );
    const semanticEdits = undoSemanticEdit(edited);
    const style: StyleRecord = {
      ...source.style,
      design: { ...source.style.design, semanticEdits },
    };
    const recovery = recoveryRecord();
    const recoveries = [{
      ...recovery,
      payload: { ...recovery.payload, semanticEdits },
    }];
    const assets = memoryAssets();
    assets.records.set(ASSET_ID, {
      assetId: ASSET_ID, name: "front.png", mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const packed = await createProjectPackage({
      project: source.project, styles: [style], recoveries,
    }, assets, { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    const target = await repository();
    const targetAssets = memoryAssets();
    await importProjectPackage(target, targetAssets, archive, false, { crypto, inspectAsset: inspector });
    const imported = await target.readProjectBundle(PROJECT_ID);
    expect(imported?.styles[0]?.design.semanticEdits).toEqual(semanticEdits);
    expect(imported?.recoveries[0]?.payload.semanticEdits).toEqual(semanticEdits);
    expect((imported?.styles[0]?.design.semanticEdits as typeof semanticEdits).operations.map((operation) => operation.id))
      .toEqual(["edit-1"]);
    expect((imported?.styles[0]?.design.semanticEdits as typeof semanticEdits).future[0]?.map((operation) => operation.id))
      .toEqual(["edit-1", "edit-2"]);
  });

  it("rejects non-canonical import clocks and exhausts repeated invalid copy identities without writing", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const target = await repository();
    await expect(importProjectPackage(target, memoryAssets(), archive, false, {
      crypto,
      now: () => "yesterday",
      inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("canonical UTC") });
    const emptyTarget = await repository();
    await expect(importProjectPackage(emptyTarget, memoryAssets(), archive, true, {
      crypto,
      now: () => TIME,
      idFactory: () => "invalid-id",
      inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "storage", message: expect.stringContaining("Secure, unique project IDs") });
    expect(await emptyTarget.readActiveProject()).toBeNull();

    const noSecureIds = await repository();
    vi.stubGlobal("crypto", { subtle: crypto.subtle });
    try {
      await expect(importProjectPackage(noSecureIds, memoryAssets(), archive, true, {
        crypto,
        now: () => TIME,
        inspectAsset: inspector,
      })).rejects.toMatchObject({ code: "storage", message: expect.stringContaining("Secure IDs are unavailable") });
      expect(await noSecureIds.readActiveProject()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses the built-in safe SVG inspector when an importer does not provide an override", async () => {
    const source = bundle();
    const assetId = "local-abcdefabcdefabcdefabcdefabcdefab-svg";
    const [surfaceKey, surfaceRecord] = Object.entries(source.style.design.surface)[0]!;
    const placements = surfaceRecord.placements as readonly import("../surface/placement").ArtworkPlacement[];
    const style: StyleRecord = {
      ...source.style,
      design: {
        ...source.style.design,
        surface: {
          ...source.style.design.surface,
          [surfaceKey]: {
            ...surfaceRecord,
            placements: [{ ...placements[0]!, assetId, sourceName: "SVG source" }],
          },
        },
      },
    };
    const project = { ...source.project, styleIds: [style.id], activeStyleId: style.id };
    const sourceAssets = memoryAssets();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8"><rect width="12" height="8" fill="#336699"/></svg>';
    sourceAssets.records.set(assetId, {
      assetId, name: "front.svg", mimeType: "image/svg+xml", blob: new Blob([svg], { type: "image/svg+xml" }),
    });
    const packed = await createProjectPackage({ project, styles: [style], recoveries: [] }, sourceAssets, { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    const target = await repository();
    const targetAssets = memoryAssets();
    const dom = new JSDOM();
    vi.stubGlobal("DOMParser", dom.window.DOMParser);
    vi.stubGlobal("XMLSerializer", dom.window.XMLSerializer);
    try {
      const imported = await importProjectPackage(target, targetAssets, archive, false, { crypto });
      expect(imported).toEqual({ status: "imported", projectId: project.id, importedAsCopy: false });
      const stored = targetAssets.records.get(assetId)!;
      expect(stored.mimeType).toBe("image/svg+xml");
      expect(await stored.blob.text()).toContain("<svg");
      expect(await stored.blob.text()).toContain('width="12"');
    } finally {
      dom.window.close();
      vi.unstubAllGlobals();
    }
  });

  it("reuses identical asset bytes and requires an explicit copy when an asset ID has different bytes", async () => {
    const source = bundle("Distinct project", SECOND_PROJECT_ID, SECOND_STYLE_ID);
    const sourceAssets = memoryAssets();
    sourceAssets.records.set(ASSET_ID, {
      assetId: ASSET_ID, name: "front.png", mimeType: "image/png", blob: new Blob([PNG], { type: "image/png" }),
    });
    const blob = await createProjectPackage({ project: source.project, styles: [source.style], recoveries: [] }, sourceAssets, { crypto });
    const archive = await readProjectPackage(blob, { crypto });
    const identicalTarget = await repository();
    const identicalAssets = memoryAssets();
    const existing = { assetId: ASSET_ID, name: "already-here.png", mimeType: "image/png" as const, blob: new Blob([PNG], { type: "image/png" }) };
    identicalAssets.records.set(ASSET_ID, existing);
    const identicalPut = vi.spyOn(identicalAssets, "put");
    expect(await importProjectPackage(identicalTarget, identicalAssets, archive, false, { crypto, inspectAsset: inspector }))
      .toMatchObject({ status: "imported", projectId: SECOND_PROJECT_ID });
    expect(identicalPut).not.toHaveBeenCalled();
    expect(identicalAssets.records.get(ASSET_ID)).toBe(existing);

    const differentTarget = await repository();
    const differentAssets = memoryAssets();
    const original = { ...existing, blob: new Blob([PNG, new Uint8Array([99])], { type: "image/png" }) };
    differentAssets.records.set(ASSET_ID, original);
    const blocked = await importProjectPackage(differentTarget, differentAssets, archive, false, { crypto, inspectAsset: inspector });
    expect(blocked.status).toBe("copy-required");
    expect(blocked.status === "copy-required" && blocked.reason).toContain("artwork ID");
    const copied = await importProjectPackage(differentTarget, differentAssets, archive, true, {
      crypto, inspectAsset: inspector, now: () => TIME, idFactory: deterministicUuidFactory(),
    });
    expect(copied).toMatchObject({ status: "imported", importedAsCopy: true });
    if (copied.status !== "imported") throw new Error("Asset collision copy was not created.");
    const copy = await differentTarget.loadProject(copied.projectId);
    expect(copy?.project.importedFrom?.projectId).toBe(SECOND_PROJECT_ID);
    const copiedAssetId = (copy?.activeStyle.design.surface[Object.keys(copy.activeStyle.design.surface)[0]!]!.placements[0] as import("../surface/placement").ArtworkPlacement).assetId;
    expect(copiedAssetId).not.toBe(ASSET_ID);
    expect(differentAssets.records.get(ASSET_ID)).toBe(original);
    expect(differentAssets.records.get(copiedAssetId!)?.blob.size).toBe(PNG.byteLength);
  });

  it("reports a style-ID collision separately when the source project ID is new", async () => {
    const source = bundle("Style collision", SECOND_PROJECT_ID, STYLE_ID);
    const sourceAssets = memoryAssets();
    sourceAssets.records.set(ASSET_ID, {
      assetId: ASSET_ID, name: "front.png", mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    });
    const packed = await createProjectPackage({
      project: source.project, styles: [source.style], recoveries: [],
    }, sourceAssets, { crypto });
    const archive = await readProjectPackage(packed, { crypto });
    const target = await repository();
    await target.initializeFirstRun(PROJECT_ID, STYLE_ID, TIME);
    const result = await importProjectPackage(target, memoryAssets(), archive, false, { crypto, inspectAsset: inspector });
    expect(result.status).toBe("copy-required");
    expect(result.status === "copy-required" && result.reason).toContain("style ID");
  });

  it("cleans staged artwork after a repository abort and reports when cleanup itself fails", async () => {
    const { archive, ids } = await createTwoAssetArchive();
    const target = await repository();
    const targetAssets = memoryAssets();
    const originalAdd = IDBObjectStore.prototype.add;
    const addSpy = vi.spyOn(IDBObjectStore.prototype, "add").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === "imports") throw new DOMException("simulated package-receipt failure", "QuotaExceededError");
      return originalAdd.call(this, value, key);
    });
    await expect(importProjectPackage(target, targetAssets, archive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "quota-exceeded", message: expect.stringContaining("Staged artwork was removed") });
    addSpy.mockRestore();
    expect(targetAssets.records.size).toBe(0);
    expect(await target.readActiveProject()).toBeNull();
    await target.readProjectImportReceipt(archive.packageSha256);

    const cleanupTarget = await repository();
    let puts = 0;
    const staged = new Map<string, StoredArtworkAsset>();
    const cleanupAssets: ArtworkAssetStore = {
      async put(asset) {
        puts += 1;
        if (puts === 2) throw new Error("simulated storage write failure");
        staged.set(asset.assetId, asset);
      },
      async get(id) { return staged.get(id) ?? null; },
      async remove() { throw new Error("simulated cleanup failure"); },
    };
    await expect(importProjectPackage(cleanupTarget, cleanupAssets, archive, false, { crypto, inspectAsset: inspector }))
      .rejects.toMatchObject({ code: "storage", message: expect.stringContaining("unreferenced") });
    expect([...staged.keys()]).toEqual([ids[0]]);
    expect(await cleanupTarget.readActiveProject()).toBeNull();
  });

  it("cancels after staging begins and removes every asset staged by the incomplete import", async () => {
    const { archive } = await createTwoAssetArchive();
    const target = await repository();
    const controller = new AbortController();
    const staged = memoryAssets();
    const put = staged.put.bind(staged);
    vi.spyOn(staged, "put").mockImplementation(async (asset) => {
      await put(asset);
      if (staged.records.size === 1) controller.abort();
    });
    await expect(importProjectPackage(target, staged, archive, false, {
      crypto, signal: controller.signal, inspectAsset: inspector,
    })).rejects.toMatchObject({ code: "cancelled" });
    expect(staged.records.size).toBe(0);
    expect(await target.readActiveProject()).toBeNull();
  });

  it("leaves no project record or staged asset when the safe image inspection rejects", async () => {
    const source = await createSourcePackage();
    const archive = await readProjectPackage(source.blob, { crypto });
    const target = await repository();
    const assets = memoryAssets();
    await expect(importProjectPackage(target, assets, archive, false, {
      crypto,
      inspectAsset: async () => { throw new Error("fake image bytes"); },
    })).rejects.toBeInstanceOf(ProjectPackageError);
    expect(await target.readActiveProject()).toBeNull();
    expect(assets.records.size).toBe(0);
  });

  it("reports determinate, monotonic package progress and does not change source records", async () => {
    const source = await createSourcePackage();
    const progress = vi.fn();
    const snapshot = { project: bundle().project, styles: [bundle().style], recoveries: [] };
    const exported = await createProjectPackage(snapshot, source.assets, { crypto, onProgress: progress });
    expect(exported.size).toBeGreaterThan(0);
    const writes = progress.mock.calls.map(([value]) => value).filter((value) => value.phase === "write");
    expect(writes.length).toBeGreaterThan(0);
    const finalWrite = writes[writes.length - 1];
    expect(finalWrite).toMatchObject({ completedBytes: finalWrite.totalBytes });
    expect(source.assets.records.size).toBe(1);
  });

  it("enforces export asset, content, manifest, integrity, and cancellation boundaries", async () => {
    const ids = (count: number): string[] => Array.from({ length: count }, (_, index) =>
      "local-" + (index + 1).toString(16).padStart(32, "0") + "-png");
    const tooMany = snapshotWithArtworkRefs(ids(PROJECT_PACKAGE_MAX_ASSETS + 1));
    const untouchedStore = { put: vi.fn(), get: vi.fn(async () => null), remove: vi.fn() };
    await expect(createProjectPackage(tooMany, untouchedStore, { crypto }))
      .rejects.toMatchObject({ code: "limit-exceeded" });
    expect(untouchedStore.get).not.toHaveBeenCalled();

    const refIds = ids(26);
    const overLimitSnapshot = snapshotWithArtworkRefs(refIds);
    const sizes = [...Array.from({ length: 25 }, () => 10 * 1024 * 1024), 7 * 1024 * 1024];
    const fakeAssets = new Map<string, StoredArtworkAsset>();
    refIds.forEach((assetId, index) => fakeAssets.set(assetId, {
      assetId,
      name: "large-" + index + ".png",
      mimeType: "image/png",
      blob: { size: sizes[index]!, type: "image/png", arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Blob,
    }));
    const fakeStore: ArtworkAssetStore = {
      put: async () => undefined,
      get: async (assetId) => fakeAssets.get(assetId) ?? null,
      remove: async () => undefined,
    };
    await expect(createProjectPackage(overLimitSnapshot, fakeStore, { crypto }))
      .rejects.toMatchObject({ code: "limit-exceeded", message: expect.stringContaining("uncompressed") });

    const exactSnapshot = snapshotWithArtworkRefs(refIds);
    const exactSizes = [...Array.from({ length: 25 }, () => 10 * 1024 * 1024), 6 * 1024 * 1024];
    exactSizes.forEach((size, index) => {
      const assetId = refIds[index]!;
      fakeAssets.set(assetId, {
        assetId,
        name: "large-" + index + ".png",
        mimeType: "image/png",
        blob: { size, type: "image/png", arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Blob,
      });
    });
    await expect(createProjectPackage(exactSnapshot, fakeStore, { crypto }))
      .rejects.toMatchObject({ code: "limit-exceeded", message: expect.stringContaining("content") });
    expect(PROJECT_PACKAGE_MAX_CONTENT_BYTES).toBe(256 * 1024 * 1024);

    const noArt = snapshotWithArtworkRefs([]);
    const noAssets: ArtworkAssetStore = { put: async () => undefined, get: async () => null, remove: async () => undefined };
    await expect(createProjectPackage(noArt, noAssets, { crypto: {} as Crypto }))
      .rejects.toMatchObject({ code: "storage", message: expect.stringContaining("SHA-256 is unavailable") });
    const hugeManifest = {
      ...noArt,
      project: { ...noArt.project, name: "P".repeat(PROJECT_PACKAGE_MAX_MANIFEST_BYTES + 1) },
    };
    await expect(createProjectPackage(hugeManifest, noAssets, { crypto }))
      .rejects.toMatchObject({ code: "limit-exceeded", message: expect.stringContaining("manifest") });

    const missing = snapshotWithArtworkRefs([ASSET_ID]);
    await expect(createProjectPackage(missing, { put: async () => undefined, get: async () => null, remove: async () => undefined }, { crypto }))
      .rejects.toMatchObject({ code: "missing-asset" });
    const badAsset: StoredArtworkAsset = {
      assetId: ASSET_ID,
      name: "../unsafe.png",
      mimeType: "image/png",
      blob: new Blob([PNG], { type: "image/png" }),
    };
    await expect(createProjectPackage(missing, {
      put: async () => undefined, get: async () => badAsset, remove: async () => undefined,
    }, { crypto })).rejects.toMatchObject({ code: "invalid-package" });
    const unsupportedAsset = { ...badAsset, assetId: "local-1234567890abcdef1234567890abcdef-gif", name: "front.gif" };
    await expect(createProjectPackage(missing, {
      put: async () => undefined, get: async () => unsupportedAsset, remove: async () => undefined,
    }, { crypto })).rejects.toMatchObject({ code: "invalid-package" });

    const valid = await createSourcePackage();
    const validRecord = valid.assets.records.get(ASSET_ID)!;
    let reads = 0;
    const disappearing: ArtworkAssetStore = {
      put: async () => undefined,
      get: async () => ++reads === 1 ? validRecord : null,
      remove: async () => undefined,
    };
    await expect(createProjectPackage(snapshotWithArtworkRefs([ASSET_ID]), disappearing, { crypto }))
      .rejects.toMatchObject({ code: "missing-asset", message: expect.stringContaining("disappeared") });

    let changingReads = 0;
    const changedDuringExport: ArtworkAssetStore = {
      put: async () => undefined,
      get: async () => {
        changingReads += 1;
        return changingReads < 3 ? validRecord : {
          ...validRecord,
          blob: new Blob([PNG, new Uint8Array([4])], { type: "image/png" }),
        };
      },
      remove: async () => undefined,
    };
    await expect(createProjectPackage(snapshotWithArtworkRefs([ASSET_ID]), changedDuringExport, { crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed during backup") });

    const changingBlob = new Blob([PNG], { type: "image/png" });
    Object.defineProperty(changingBlob, "stream", {
      value: () => new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(PNG.slice(0, 2)); controller.close(); },
      }),
    });
    const shortStreamAsset = { ...validRecord, blob: changingBlob };
    await expect(createProjectPackage(snapshotWithArtworkRefs([ASSET_ID]), {
      put: async () => undefined, get: async () => shortStreamAsset, remove: async () => undefined,
    }, { crypto })).rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("changed during backup") });

    const progressBundle = bundle();
    await expect(createProjectPackage({ project: progressBundle.project, styles: [progressBundle.style], recoveries: [] }, valid.assets, {
      crypto,
      onProgress: (value) => { if (value.phase === "write") throw new Error("progress callback failed"); },
    })).rejects.toMatchObject({ code: "invalid-package", message: "progress callback failed" });
  });

  it("exports, validates, and imports bounded and near-cap package fixtures", async () => {
    const coverageRun = process.env.INFINIDRIP_COVERAGE === "1";
    const bounded = await pressurePackage(
      coverageRun ? "4-MiB-coverage" : "64-MiB",
      (coverageRun ? [1, 1, 1, 1] : [10, 10, 10, 10, 10, 10, 4])
        .map((mebibytes) => mebibytes * 1024 * 1024),
    );
    const boundedBytes = (coverageRun ? 4 : 64) * 1024 * 1024;
    expect(bounded.copiedAssetBytes).toBe(boundedBytes);
    expect(bounded.packageBytes).toBeLessThan(PROJECT_PACKAGE_MAX_BYTES);

    if (!coverageRun) {
      const nearCap = await pressurePackage("near-cap", Array.from({ length: 25 }, () => 10 * 1024 * 1024));
      expect(nearCap.copiedAssetBytes).toBe(250 * 1024 * 1024);
      expect(nearCap.packageBytes).toBeLessThan(PROJECT_PACKAGE_MAX_BYTES);
    }
  }, 300_000);
});
