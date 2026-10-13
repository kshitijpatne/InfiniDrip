import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { webcrypto } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { unzipSync, zipSync, Zip, ZipPassThrough, type Zippable } from "fflate";
import { describe, expect, it, vi } from "vitest";
import { GARMENTS, STANDARD_M } from "../drafting";
import { surfaceKey, type SurfaceBook } from "../surface/store";
import { createFieldObservationRecord } from "./field-provenance";
import { migrateLegacySaveFile } from "./project-records";
import { DEFAULT_WORKSPACE, defaultStretchFabricForGarment, serialize } from "./persist";
import {
  bindTechPackToRevision,
  parseTechPackRecord,
  type TechPackBomRow,
  type TechPackColorway,
  type TechPackField,
  type TechPackMaterial,
  type TechPackRecord,
} from "./tech-pack-records";
import { emptyTechPackPomRecordSet } from "./tech-pack-sample-qa-records";
import { emptyTechPackOperationRecordSetV2, unresolvedTechPackOperation } from "./tech-pack-operation-records";
import {
  canonicalizeJcs,
  createFrozenOutputManifest,
  createStyleRevision,
  sha256Hex,
  verifyFrozenOutputManifest,
  type FrozenArtifactInput,
  type StyleRevisionRecord,
} from "./style-revisions";
import {
  approveTechPackReview,
  createTechPackApprovalRef,
  startTechPackReview,
  TECH_PACK_SHARE_ARTIFACTS,
  techPackShareFieldIds,
} from "./tech-pack-sharing";
import {
  createProductionPackOutputs,
  computeProductionPackFieldDiff,
  previewProductionPackImport,
  ProductionPackError,
  PRODUCTION_PACK_ARCHIVE_LIMIT,
  PRODUCTION_PACK_EXPANDED_LIMIT,
  PRODUCTION_PACK_JSON_LIMIT,
  PRODUCTION_PACK_MAX_ATTACHMENTS,
  PRODUCTION_PACK_PRESETS,
  PRODUCTION_PACK_SECTIONS,
  type CreateProductionPackInput,
  type ProductionPackAttachmentInput,
  type ProductionPackSemanticFinding,
} from "./tech-pack-output";

const crypto = webcrypto as unknown as Crypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const TIME = "2026-09-24T16:00:00.000Z";
const LATER = "2026-09-24T16:05:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const TEE_STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const TEE_REVISION_ID = "11111111-1111-4111-8111-111111111111";
const TEE_NEXT_REVISION_ID = "22222222-2222-4222-8222-222222222222";
const WOVEN_STYLE_ID = "c53a1a03-ea2e-4c4f-82dc-14ac86a29896";
const WOVEN_REVISION_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "local-0123456789abcdef0123456789abcdef-png";
const ASSET_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);
const ARCHIVE_TIME = new Date(1980, 0, 1, 0, 0, 0);

interface Fixture {
  readonly revision: StyleRevisionRecord;
  readonly styleId: string;
  readonly record: TechPackRecord;
  readonly artwork: readonly { readonly assetId: string; readonly mimeType: string; readonly byteLength: number; readonly sha256: string }[];
  readonly attachment: ProductionPackAttachmentInput | null;
}

function capturedField<T extends string | null>(field: TechPackField<T>, value: T): TechPackField<T> {
  return {
    ...field,
    value,
    provenance: "USER_CAPTURED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: "VALID",
    sourceRef: null,
    method: "synthetic S775 fixture value",
    capturedBy: "S775 fixture builder",
    capturedAt: TIME,
    unresolvedReason: null,
    nextAction: null,
  };
}

function syntheticRecord(source: TechPackRecord, value: string): TechPackRecord {
  return {
    ...source,
    cover: { ...source.cover, styleName: capturedField(source.cover.styleName, value) },
  };
}

function unresolvedField<T extends string | number | boolean | null>(fieldId: string, semanticKind: string, unit: string | null = null): TechPackField<T> {
  return {
    fieldId,
    semanticKind: semanticKind as TechPackField["semanticKind"],
    value: null as T,
    unit,
    provenance: "UNRESOLVED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: "INVALID",
    sourceRef: null,
    method: null,
    capturedBy: null,
    capturedAt: null,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: "Synthetic fixture value has not been collected.",
    nextAction: "Capture this synthetic field in a test fixture.",
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
  };
}

function capturedValue<T extends string | number | boolean | null>(
  fieldId: string,
  semanticKind: string,
  value: T,
  unit: string | null = null,
): TechPackField<T> {
  return {
    fieldId,
    semanticKind: semanticKind as TechPackField["semanticKind"],
    value,
    unit,
    provenance: "USER_CAPTURED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: "VALID",
    sourceRef: null,
    method: "synthetic S775 test fixture",
    capturedBy: "S775 fixture builder",
    capturedAt: TIME,
    inputRefs: ["synthetic-input"],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: null,
    nextAction: null,
    evidenceRefs: ["synthetic-evidence"],
    confidence: "NOT_ASSESSED",
  };
}

function syntheticT01Rows(): {
  readonly materials: readonly TechPackMaterial[];
  readonly bomRows: readonly TechPackBomRow[];
  readonly colorways: readonly TechPackColorway[];
} {
  const materialId = "44444444-4444-4444-8444-444444444444";
  const rowId = "55555555-5555-4555-8555-555555555555";
  const material: TechPackMaterial = {
    id: materialId,
    category: "fabric",
    name: capturedValue("materials.synthetic.name", "MATERIAL_PROPERTY", "Synthetic sample fabric"),
    supplier: unresolvedField("materials.synthetic.supplier", "MATERIAL_PROPERTY"),
    articleId: unresolvedField("materials.synthetic.article", "MATERIAL_PROPERTY"),
    lotId: unresolvedField("materials.synthetic.lot", "MATERIAL_PROPERTY"),
    composition: unresolvedField("materials.synthetic.composition", "MATERIAL_PROPERTY"),
    construction: unresolvedField("materials.synthetic.construction", "MATERIAL_PROPERTY"),
    weight: capturedValue("materials.synthetic.weight", "MATERIAL_PROPERTY", 180, "g/m2"),
    usableWidth: unresolvedField("materials.synthetic.width", "MATERIAL_PROPERTY", "cm"),
    finish: unresolvedField("materials.synthetic.finish", "MATERIAL_PROPERTY"),
    color: unresolvedField("materials.synthetic.color", "MATERIAL_PROPERTY"),
    directionalBehavior: unresolvedField("materials.synthetic.direction", "MATERIAL_PROPERTY"),
    unitCost: unresolvedField("materials.synthetic.cost", "MATERIAL_PROPERTY", "USD"),
    currency: unresolvedField("materials.synthetic.currency", "MATERIAL_PROPERTY"),
    costBasis: unresolvedField("materials.synthetic.cost-basis", "MATERIAL_PROPERTY"),
  };
  const row: TechPackBomRow = {
    id: rowId,
    componentRef: capturedValue("bom.synthetic.component", "PANEL_GEOMETRY", "synthetic-front-panel"),
    placement: capturedValue("bom.synthetic.placement", "STYLE_CONTROL", "Synthetic main body"),
    materialId,
    quantity: capturedValue("bom.synthetic.quantity", "MATERIAL_PROPERTY", 1.25, "m"),
    quantityBasis: capturedValue("bom.synthetic.basis", "MATERIAL_PROPERTY", "per-garment"),
    requiredness: capturedValue("bom.synthetic.required", "STYLE_CONTROL", true),
  };
  const colorway: TechPackColorway = {
    id: "66666666-6666-4666-8666-666666666666",
    name: capturedValue("colorway.synthetic.name", "STYLE_CONTROL", "Synthetic blue"),
    assignments: [{
      id: "77777777-7777-4777-8777-777777777777",
      bomRowId: rowId,
      materialId,
      color: capturedValue("colorway.synthetic.fabric-color", "MATERIAL_PROPERTY", "Synthetic blue"),
    }],
  };
  return { materials: [material], bomRows: [row], colorways: [colorway] };
}

async function fixture(
  recipeId: "tee" | "woven-shirt",
  styleId: string,
  revisionId: string,
  options: {
    readonly withArtwork?: boolean;
    readonly schemaVersion?: 1 | 3;
    readonly operationCount?: number;
    readonly withT01Rows?: boolean;
  } = {},
): Promise<Fixture> {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const surface: SurfaceBook = options.withArtwork ? {
    [surfaceKey(recipe.name, recipe.styles[0]!.name)]: {
      styleName: recipe.styles[0]!.name,
      placements: [{
        id: "synthetic-art-placement", kind: "print", pieceRole: "body-front", widthCm: 4, heightCm: 3,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1,
        sourceName: "synthetic-local-art.png", assetId: ASSET_ID,
      }],
    },
  } : {};
  const workspace = {
    ...DEFAULT_WORKSPACE,
    garment: recipeId,
    targetStyle: recipe.styles[0]!.name,
    stretchFabric: defaultStretchFabricForGarment(recipeId),
    exportStep: recipe.sizes[0]!.step,
  };
  const migrated = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150", {}, workspace, undefined, surface),
    projectId: PROJECT_ID,
    styleId,
    migratedAt: TIME,
  });
  if (!migrated.ok) throw new Error(migrated.error);
  const style = migrated.value.style;
  const fieldObservations = createFieldObservationRecord(style, TIME, "existing-local-style");
  let techPack = bindTechPackToRevision(
    syntheticRecord(style.techPack, `Synthetic ${recipe.label} review fixture`), revisionId, 1, TIME,
  );
  if (options.withT01Rows) {
    const parsed = parseTechPackRecord({ ...techPack, ...syntheticT01Rows() });
    if (!parsed.ok) throw new Error(parsed.error);
    techPack = parsed.value;
  }
  if (options.schemaVersion === 3) {
    const operationData = emptyTechPackOperationRecordSetV2(recipeId);
    const operations = Array.from({ length: options.operationCount ?? 0 }, (_, index) =>
      unresolvedTechPackOperation(`synthetic-operation-${index + 1}`));
    const parsed = parseTechPackRecord({
      ...techPack,
      schemaVersion: 3,
      pomData: emptyTechPackPomRecordSet(recipeId),
      operationData: { ...operationData, operations },
    });
    if (!parsed.ok) throw new Error(parsed.error);
    techPack = parsed.value;
  }
  const artwork = options.withArtwork ? [{
    assetId: ASSET_ID,
    mimeType: "image/png",
    byteLength: ASSET_BYTES.byteLength,
    sha256: await sha256Hex(ASSET_BYTES, crypto),
  }] : [];
  const revision = await createStyleRevision({
    styleId,
    revisionId,
    parentRevisionId: null,
    revisionNumber: 1,
    createdAt: TIME,
    design: style.design,
    fieldObservations,
    artwork,
    techPack,
  }, crypto);
  return {
    revision,
    styleId,
    record: revision.payload.payloadVersion === 2 ? revision.payload.techPack : techPack,
    artwork,
    attachment: options.withArtwork ? {
      assetId: ASSET_ID,
      name: "synthetic-local-art.png",
      mediaType: "image/png",
      sourceLabel: "Synthetic fixture input",
      attribution: "Created for S775 output validation",
      bytes: ASSET_BYTES,
    } : null,
  };
}

async function revisionForRecord(value: Fixture, record: TechPackRecord, createdAt = TIME): Promise<StyleRevisionRecord> {
  const payload = value.revision.payload;
  if (payload.payloadVersion !== 2) throw new Error("Synthetic fixture must use a current style revision.");
  return createStyleRevision({
    styleId: value.styleId,
    revisionId: value.revision.revisionId,
    parentRevisionId: value.revision.parentRevisionId,
    revisionNumber: value.revision.revisionNumber,
    createdAt,
    design: payload.design,
    fieldObservations: payload.fieldObservations,
    artwork: value.artwork,
    techPack: record,
  }, crypto);
}

function exportInput(value: Fixture, overrides: Partial<CreateProductionPackInput> = {}): CreateProductionPackInput {
  return {
    record: value.record,
    revision: value.revision,
    currentHeadRevisionId: value.revision.revisionId,
    preset: "complete-pack",
    attachments: value.attachment ? [value.attachment] : [],
    crypto,
    ...overrides,
  };
}

function rewriteArchive(archiveBytes: Uint8Array, replaceRecord: unknown): Uint8Array {
  const entries = { ...unzipSync(archiveBytes) };
  entries["records/tech-pack.json"] = encoder.encode(canonicalizeJcs(replaceRecord));
  return zipSync(entries as Zippable, { mtime: ARCHIVE_TIME, level: 6 });
}

function rewriteManifest(
  archiveBytes: Uint8Array,
  change: (manifest: Record<string, unknown>) => Record<string, unknown>,
): Uint8Array {
  const entries = { ...unzipSync(archiveBytes) };
  const manifest = JSON.parse(decoder.decode(entries["manifest.json"]!)) as Record<string, unknown>;
  entries["manifest.json"] = encoder.encode(canonicalizeJcs(change(manifest)));
  return zipSync(entries as Zippable, { mtime: ARCHIVE_TIME, level: 6 });
}

function rewriteManifestText(archiveBytes: Uint8Array, value: string): Uint8Array {
  const entries = { ...unzipSync(archiveBytes) };
  entries["manifest.json"] = encoder.encode(value);
  return zipSync(entries as Zippable, { mtime: ARCHIVE_TIME, level: 6 });
}

function importInput(value: Fixture, archiveBytes: Uint8Array, extras: Record<string, unknown> = {}) {
  return {
    fileName: "S775-fixture.techpack.zip",
    archiveBytes,
    revisionHistory: [value.revision],
    currentHeadRevisionId: value.revision.revisionId,
    crypto,
    ...extras,
  };
}

function makeArchive(entries: Zippable): Uint8Array {
  return zipSync(entries, { mtime: ARCHIVE_TIME, level: 6 });
}

function lowLevelZip(entries: readonly { readonly name: string; readonly bytes: Uint8Array; readonly compression?: number }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const archive = new Zip((error, chunk) => {
    if (error) throw error;
    if (chunk) chunks.push(chunk.slice());
  });
  for (const entry of entries) {
    const file = new ZipPassThrough(entry.name);
    if (entry.compression !== undefined) file.compression = entry.compression;
    archive.add(file);
    file.push(entry.bytes, true);
  }
  archive.end();
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function virtualByteLengthBytes(byteLength: number, copiedByteLength = byteLength): Uint8Array {
  const bytes = new Uint8Array();
  Object.defineProperty(bytes, "byteLength", { value: byteLength });
  Object.defineProperty(bytes, "slice", { value: () => virtualByteLengthBytes(copiedByteLength) });
  return bytes;
}

function withZipSizeDeclaration(bytes: Uint8Array, fileName: string, expandedSize: number): Uint8Array {
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const nameBytes = encoder.encode(fileName);
  let localOffset = -1;
  for (let offset = 0; offset + 30 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) === 0x04034b50) {
      const nameLength = view.getUint16(offset + 26, true);
      const localName = result.slice(offset + 30, offset + 30 + nameLength);
      if (localName.length === nameBytes.length && localName.every((value, index) => value === nameBytes[index])) {
        localOffset = offset;
        view.setUint32(offset + 22, expandedSize, true);
        break;
      }
    }
  }
  if (localOffset < 0) throw new Error(`Could not find local ZIP entry ${fileName}.`);
  let centralFound = false;
  for (let offset = 0; offset + 46 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) === 0x02014b50) {
      const nameLength = view.getUint16(offset + 28, true);
      const centralName = result.slice(offset + 46, offset + 46 + nameLength);
      if (centralName.length === nameBytes.length && centralName.every((value, index) => value === nameBytes[index])) {
        view.setUint32(offset + 24, expandedSize, true);
        centralFound = true;
        break;
      }
    }
  }
  if (!centralFound) throw new Error(`Could not find central ZIP entry ${fileName}.`);
  return result;
}

function withZipCompressedSizeDeclaration(bytes: Uint8Array, fileName: string, compressedSize: number): Uint8Array {
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const targetName = encoder.encode(fileName);
  let localFound = false;
  for (let offset = 0; offset + 30 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) continue;
    const nameLength = view.getUint16(offset + 26, true);
    const name = result.subarray(offset + 30, offset + 30 + nameLength);
    if (name.length === targetName.length && name.every((value, index) => value === targetName[index])) {
      view.setUint32(offset + 18, compressedSize, true);
      localFound = true;
      break;
    }
  }
  let centralFound = false;
  for (let offset = 0; offset + 46 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    const nameLength = view.getUint16(offset + 28, true);
    const name = result.subarray(offset + 46, offset + 46 + nameLength);
    if (name.length === targetName.length && name.every((value, index) => value === targetName[index])) {
      view.setUint32(offset + 20, compressedSize, true);
      centralFound = true;
      break;
    }
  }
  if (!localFound || !centralFound) throw new Error(`Could not find ZIP entry ${fileName} for compressed-size mutation.`);
  return result;
}

function replaceZipEntryName(bytes: Uint8Array, fileName: string, replacement: string, central: boolean): Uint8Array {
  const from = encoder.encode(fileName);
  const to = encoder.encode(replacement);
  if (from.length !== to.length) throw new Error("ZIP name replacement must preserve its byte length.");
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const signature = central ? 0x02014b50 : 0x04034b50;
  const headerSize = central ? 46 : 30;
  const nameLengthOffset = central ? 28 : 26;
  let found = false;
  for (let offset = 0; offset + headerSize <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== signature) continue;
    const nameLength = view.getUint16(offset + nameLengthOffset, true);
    const nameOffset = offset + headerSize;
    const name = result.subarray(nameOffset, nameOffset + nameLength);
    if (name.length === from.length && name.every((value, index) => value === from[index])) {
      result.set(to, nameOffset);
      found = true;
      break;
    }
  }
  if (!found) throw new Error(`Could not find ${central ? "central" : "local"} ZIP entry ${fileName}.`);
  return result;
}

function corruptFirstDeflateByte(bytes: Uint8Array): Uint8Array {
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const index = 30 + nameLength + extraLength;
  result[index] = result[index]! ^ 0xff;
  return result;
}

function centralEndOffset(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.byteLength - 22; offset >= Math.max(0, bytes.byteLength - 22 - 65_535); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error("The fixture ZIP is missing its end record.");
}

function withLocalExpandedSize(bytes: Uint8Array, fileName: string, expandedSize: number): Uint8Array {
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const targetName = encoder.encode(fileName);
  for (let offset = 0; offset + 30 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) continue;
    const nameLength = view.getUint16(offset + 26, true);
    const name = result.subarray(offset + 30, offset + 30 + nameLength);
    if (name.length === targetName.length && name.every((value, index) => value === targetName[index])) {
      view.setUint32(offset + 22, expandedSize, true);
      return result;
    }
  }
  throw new Error(`Could not find local ZIP entry ${fileName}.`);
}

function withCentralExpandedSize(bytes: Uint8Array, fileName: string, expandedSize: number): Uint8Array {
  const result = bytes.slice();
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  const targetName = encoder.encode(fileName);
  for (let offset = 0; offset + 46 <= result.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    const nameLength = view.getUint16(offset + 28, true);
    const name = result.subarray(offset + 46, offset + 46 + nameLength);
    if (name.length === targetName.length && name.every((value, index) => value === targetName[index])) {
      view.setUint32(offset + 24, expandedSize, true);
      return result;
    }
  }
  throw new Error(`Could not find central ZIP entry ${fileName}.`);
}

function truncateFirstEntryPayload(bytes: Uint8Array): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) throw new Error("The fixture does not start with a local ZIP entry.");
  const compressedSize = view.getUint32(18, true);
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const dataOffset = 30 + nameLength + extraLength;
  if (compressedSize < 2) throw new Error("The first ZIP entry is too small to truncate.");
  return bytes.slice(0, dataOffset + Math.floor(compressedSize / 2));
}

describe("revision-bound production pack files", () => {
  it("writes and parses deterministic Tee and Woven Shirt PDF/ZIP files", async () => {
    const tee = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const woven = await fixture("woven-shirt", WOVEN_STYLE_ID, WOVEN_REVISION_ID);
    const outputDirectory = join(process.cwd(), "docs/research/epic18/S775-T04-output-package/generated");
    mkdirSync(outputDirectory, { recursive: true });
    for (const [label, input] of [["tee", tee], ["woven-shirt", woven]] as const) {
      const outputs = await createProductionPackOutputs(exportInput(input));
      const repeated = await createProductionPackOutputs(exportInput(input));
      expect(outputs.pdfBytes).toEqual(repeated.pdfBytes);
      expect(outputs.recordJson).toBe(repeated.recordJson);
      expect(outputs.archiveBytes).toEqual(repeated.archiveBytes);
      expect(outputs.manifest.selectedSections).toEqual(PRODUCTION_PACK_SECTIONS);
      expect(outputs.manifest.recordSchemaVersion).toBe(1);
      expect(outputs.presentation.omittedSections).toEqual([]);
      const pdf = await PDFDocument.load(outputs.pdfBytes);
      expect(pdf.getPageCount()).toBeGreaterThan(0);
      expect(pdf.getPage(0).getWidth()).toBeGreaterThan(500);
      const pdfText = decoder.decode(outputs.pdfBytes);
      expect(pdfText).toContain("Local digital review only");
      expect(pdfText).toContain("UNRESOLVED");
      const entries = unzipSync(outputs.archiveBytes);
      expect(Object.keys(entries)).toEqual([
        "manifest.json", "records/tech-pack.json", "documents/production-pack.pdf",
      ]);
      expect(entries["documents/production-pack.pdf"]).toEqual(outputs.pdfBytes);
      expect(decoder.decode(entries["records/tech-pack.json"])).toBe(outputs.recordJson);
      expect(JSON.parse(decoder.decode(entries["manifest.json"]))).toEqual(outputs.manifest);
      writeFileSync(join(outputDirectory, `${label}-production-pack.pdf`), outputs.pdfBytes);
      writeFileSync(join(outputDirectory, `${label}.techpack.zip`), outputs.archiveBytes);
    }
  });

  it("freezes actual synthetic Tee and Woven Shirt outputs as revision-bound binary shares", async () => {
    const examples = [
      await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID),
      await fixture("woven-shirt", WOVEN_STYLE_ID, WOVEN_REVISION_ID),
    ];
    for (let index = 0; index < examples.length; index += 1) {
      const value = examples[index]!;
      const revisionId = value.revision.revisionId;
      const review = startTechPackReview(value.record, "Synthetic local reviewer", techPackShareFieldIds(value.record), TIME);
      const approved = approveTechPackReview(review, "Synthetic local approver", LATER);
      const outputInput = exportInput(value, { record: approved });
      const outputs = await createProductionPackOutputs(outputInput);
      const repeated = await createProductionPackOutputs(outputInput);
      expect(repeated.archiveBytes).toEqual(outputs.archiveBytes);
      expect(repeated.pdfBytes).toEqual(outputs.pdfBytes);

      const shareArtifacts = TECH_PACK_SHARE_ARTIFACTS.map((artifact) => ({
        ...artifact,
        bytes: artifact.artifactId === "tech-pack-exchange-zip" ? outputs.archiveBytes : outputs.pdfBytes,
      }));
      const approvalRef = await createTechPackApprovalRef(
        approved, value.revision, outputs.manifest.selectedSections, shareArtifacts, crypto,
      );
      const artifacts: FrozenArtifactInput[] = shareArtifacts;
      const frozen = await createFrozenOutputManifest({
        manifestId: index === 0 ? "44444444-4444-4444-8444-444444444444" : "55555555-5555-4555-8555-555555555555",
        styleId: value.styleId,
        revision: value.revision,
        capturedAt: TIME,
        selectedSizes: [],
        selectedSections: outputs.manifest.selectedSections,
        unresolved: ["Synthetic local digital review only; physical fit and production readiness are not established."],
        artifacts,
        schemaVersion: 3,
        approvalRefs: [approvalRef],
      }, crypto);
      expect(frozen.payload.revisionId).toBe(revisionId);
      expect(frozen.payload.revisionContentDigest).toBe(value.revision.revisionContentDigest);
      expect(frozen.payload.selectedSections).toEqual(outputs.manifest.selectedSections);
      expect(await verifyFrozenOutputManifest(frozen, crypto)).toBe(true);
      expect(await PDFDocument.load(outputs.pdfBytes)).toBeDefined();

      const zip = frozen.artifacts.find((artifact) => artifact.artifactId === "tech-pack-exchange-zip")!;
      const pdf = frozen.artifacts.find((artifact) => artifact.artifactId === "tech-pack-production-pdf")!;
      expect(await sha256Hex(new Uint8Array(await zip.bytes.arrayBuffer()), crypto)).toBe(zip.sha256);
      expect(await sha256Hex(new Uint8Array(await pdf.bytes.arrayBuffer()), crypto)).toBe(pdf.sha256);
      const archive = unzipSync(new Uint8Array(await zip.bytes.arrayBuffer()));
      const pinnedT04Manifest = JSON.parse(decoder.decode(archive["manifest.json"]!));
      expect(pinnedT04Manifest.revisionId).toBe(revisionId);
      expect(pinnedT04Manifest.revisionContentDigest).toBe(value.revision.revisionContentDigest);
      expect(archive["documents/production-pack.pdf"]).toEqual(outputs.pdfBytes);
      const repeatedFreeze = await createFrozenOutputManifest({
        manifestId: frozen.manifestId,
        styleId: value.styleId,
        revision: value.revision,
        capturedAt: "2026-09-24T16:10:00.000Z",
        selectedSizes: [],
        selectedSections: outputs.manifest.selectedSections,
        unresolved: ["Synthetic local digital review only; physical fit and production readiness are not established."],
        artifacts,
        schemaVersion: 3,
        approvalRefs: [approvalRef],
      }, crypto);
      expect(repeatedFreeze.packetDigest).toBe(frozen.packetDigest);

      const label = index === 0 ? "tee" : "woven-shirt";
      const evidenceDirectory = join(process.cwd(), "docs/research/epic18/S778-T05-freeze/evidence/synthetic");
      mkdirSync(evidenceDirectory, { recursive: true });
      const frozenZipBytes = new Uint8Array(await zip.bytes.arrayBuffer());
      const frozenPdfBytes = new Uint8Array(await pdf.bytes.arrayBuffer());
      const frozenZipPath = join(evidenceDirectory, `frozen-${label}.techpack.zip`);
      const frozenPdfPath = join(evidenceDirectory, `frozen-${label}-production-pack.pdf`);
      const frozenManifestPath = join(evidenceDirectory, `frozen-${label}-manifest.json`);
      const frozenManifest = {
        ...frozen,
        artifacts: frozen.artifacts.map(({ bytes: _bytes, ...descriptor }) => descriptor),
      };
      writeFileSync(frozenZipPath, frozenZipBytes);
      writeFileSync(frozenPdfPath, frozenPdfBytes);
      writeFileSync(frozenManifestPath, `${canonicalizeJcs(frozenManifest)}\n`);
      expect(new Uint8Array(readFileSync(frozenZipPath))).toEqual(outputs.archiveBytes);
      expect(new Uint8Array(readFileSync(frozenPdfPath))).toEqual(outputs.pdfBytes);
      expect(JSON.parse(readFileSync(frozenManifestPath, "utf8")).payload).toEqual(frozen.payload);
      writeFileSync(join(evidenceDirectory, `frozen-${label}-report.json`), `${JSON.stringify({
        synthetic: true,
        sourceRevisionId: revisionId,
        sourceRevisionContentDigest: value.revision.revisionContentDigest,
        selectedSections: outputs.manifest.selectedSections,
        repeatGenerationBytesMatch: true,
        repeatFreezePacketDigest: repeatedFreeze.packetDigest,
        frozenPacketDigest: frozen.packetDigest,
        artifacts: [
          { name: `frozen-${label}.techpack.zip`, byteLength: frozenZipBytes.byteLength, sha256: zip.sha256 },
          { name: `frozen-${label}-production-pack.pdf`, byteLength: frozenPdfBytes.byteLength, sha256: pdf.sha256 },
        ],
      }, null, 2)}\n`);
    }
  });

  it("rejects oversized editable records before rendering and normalizes ZIP writer failures", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const oversizedName = "x".repeat(PRODUCTION_PACK_JSON_LIMIT + 1);
    const oversizedRecord: TechPackRecord = {
      ...value.record,
      cover: {
        ...value.record.cover,
        styleName: capturedField(value.record.cover.styleName, oversizedName),
      },
    };
    const oversizedRevision = await revisionForRecord(value, oversizedRecord);
    await expect(createProductionPackOutputs(exportInput({
      ...value, record: oversizedRecord, revision: oversizedRevision,
    }))).rejects.toMatchObject({ code: "limit-exceeded" });

    let zipWriterMode: "error" | "error-string" | "oversized" = "error";
    vi.resetModules();
    vi.doMock("fflate", async (importOriginal) => {
      const actual = await importOriginal<typeof import("fflate")>();
      return {
        ...actual,
        zipSync: () => {
          if (zipWriterMode === "error") throw new Error("Synthetic ZIP writer failure.");
          if (zipWriterMode === "error-string") throw "Synthetic non-Error ZIP writer failure";
          return virtualByteLengthBytes(PRODUCTION_PACK_ARCHIVE_LIMIT + 1);
        },
      };
    });
    try {
      const outputModule = await import("./tech-pack-output");
      await expect(outputModule.createProductionPackOutputs(exportInput(value)))
        .rejects.toMatchObject({ code: "invalid-package" });
      zipWriterMode = "error-string";
      await expect(outputModule.createProductionPackOutputs(exportInput(value)))
        .rejects.toMatchObject({ code: "invalid-package" });
      zipWriterMode = "oversized";
      await expect(outputModule.createProductionPackOutputs(exportInput(value)))
        .rejects.toMatchObject({ code: "limit-exceeded" });
    } finally {
      vi.doUnmock("fflate");
      vi.resetModules();
    }
  }, 30_000);

  it("renders the three presets, mandatory sections, omitted labels and schema-v3 content", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { schemaVersion: 3, operationCount: 20 });
    const complete = await createProductionPackOutputs(exportInput(value));
    expect(complete.presentation.record.operationData?.operations).toHaveLength(20);
    expect((await PDFDocument.load(complete.pdfBytes)).getPageCount()).toBeGreaterThan(1);
    const materials = await createProductionPackOutputs(exportInput(value, { preset: "materials-construction" }));
    expect(materials.manifest.selectedSections).toEqual(PRODUCTION_PACK_PRESETS["materials-construction"]);
    expect(materials.presentation.omittedSections).toEqual(["measurements-qa"]);
    expect(decoder.decode(materials.pdfBytes)).toContain("Sections omitted: measurements-qa");
    const qa = await createProductionPackOutputs(exportInput(value, { preset: "measurements-qa" }));
    expect(qa.manifest.selectedSections).toEqual(PRODUCTION_PACK_PRESETS["measurements-qa"]);
    expect(qa.presentation.omittedSections).toEqual(["materials-bom", "construction", "artwork"]);
    expect(decoder.decode(qa.pdfBytes)).toContain("measurements and QA.definitions.recipeId: \"tee\"");
    expect(decoder.decode(qa.pdfBytes)).toContain("Sections omitted: materials-bom, construction, artwork");
    const custom = await createProductionPackOutputs(exportInput(value, {
      selectedSections: ["construction"],
    }));
    expect(custom.manifest.selectedSections).toEqual(["identity", "construction", "sources-open-items", "approval-disclaimer"]);
    expect(custom.presentation.omittedSections).toEqual(["materials-bom", "measurements-qa", "artwork"]);
    expect(decoder.decode(custom.pdfBytes)).toContain("construction operations");
  });

  it("renders synthetic T01 materials, BOM quantities, boolean requiredness and colorway assignments", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withT01Rows: true });
    const output = await createProductionPackOutputs(exportInput(value));
    expect(output.recordJson).toContain("Synthetic sample fabric");
    expect(decoder.decode(output.pdfBytes)).toContain("180 g/m2");
    expect(decoder.decode(output.pdfBytes)).toContain("1.25 m");
    expect(decoder.decode(output.pdfBytes)).toContain("requiredness [bom.synthetic.required]: true");
    expect(decoder.decode(output.pdfBytes)).toContain("Synthetic blue");
  });

  it("lists an explicit no-open-items state when every synthetic cover field is recorded", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const cleanRecord: TechPackRecord = {
      ...value.record,
      cover: {
        styleCode: capturedField(value.record.cover.styleCode, "SYN-TEE"),
        styleName: capturedField(value.record.cover.styleName, "Synthetic closed review fixture"),
        ownerLabel: capturedField(value.record.cover.ownerLabel, "Synthetic owner"),
        intendedUse: capturedField(value.record.cover.intendedUse, "Synthetic structure-only review"),
        baseSizeId: capturedField(value.record.cover.baseSizeId, "synthetic-size"),
        measurementUnit: capturedField(value.record.cover.measurementUnit, "cm"),
      },
    };
    const revision = await revisionForRecord(value, cleanRecord);
    const output = await createProductionPackOutputs(exportInput({ ...value, revision, record: cleanRecord }));
    expect(decoder.decode(output.pdfBytes)).toContain("No explicit unresolved or conflicting field state is recorded in this snapshot.");
  });

  it("wraps long PDF fields and escapes punctuation and unsupported glyphs", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const printable = `${"A".repeat(100)}(synthetic)\\dash—multiply×snowman☃`;
    const record = {
      ...value.record,
      cover: { ...value.record.cover, styleName: capturedField(value.record.cover.styleName, printable) },
    };
    const revision = await revisionForRecord(value, record);
    const output = await createProductionPackOutputs(exportInput({ ...value, revision, record }));
    const pdfText = decoder.decode(output.pdfBytes);
    expect(pdfText).toContain(`${"A".repeat(80)}`);
    expect(pdfText).toContain("\\(synthetic\\)");
    expect(pdfText).toContain(`${"\\\\".repeat(2)}dash-multiplyxsnowman?`);
  });

  it("retains source conflicts and review scope in PDF and full JSON", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const payload = value.revision.payload;
    if (payload.payloadVersion !== 2) throw new Error("Synthetic fixture must use a current style revision.");
    const field = value.record.cover.styleCode;
    const conflicted: TechPackField<string | null> = {
      ...field,
      value: "Synthetic competing label",
      provenance: "USER_CAPTURED",
      evidenceStatus: "CONFLICT",
      validationStatus: "INVALID",
      sourceRef: "synthetic:two-sources",
      method: "synthetic comparison",
      capturedBy: "S775 fixture builder",
      capturedAt: TIME,
      evidenceRefs: ["source-a", "source-b"],
      unresolvedReason: "Synthetic values disagree.",
      nextAction: "Review the two synthetic references.",
    };
    const conflictedRecord = {
      ...value.record,
      cover: { ...value.record.cover, styleCode: conflicted },
    };
    const revision = await createStyleRevision({
      styleId: value.styleId,
      revisionId: value.revision.revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: payload.design,
      fieldObservations: payload.fieldObservations,
      artwork: value.artwork,
      techPack: conflictedRecord,
    }, crypto);
    const conflictedFixture: Fixture = { ...value, revision, record: conflictedRecord };
    const record = {
      ...conflictedRecord,
      approval: {
        state: "APPROVED" as const,
        revisionId: revision.revisionId,
        scopeFieldIds: [field.fieldId],
        changedBy: "synthetic reviewer",
        changedAt: TIME,
        manifestId: null,
      },
    };
    const output = await createProductionPackOutputs(exportInput(conflictedFixture, { record }));
    expect(output.presentation.approvalState).toBe("APPROVED");
    expect(output.presentation.approvalScopeFieldIds).toEqual([field.fieldId]);
    const pdfText = decoder.decode(output.pdfBytes);
    expect(pdfText).toContain("synthetic:two-sources");
    expect(pdfText).toContain("Synthetic values disagree.");
    expect(pdfText).toContain("synthetic reviewer");
    const archive = unzipSync(output.archiveBytes);
    expect(JSON.parse(decoder.decode(archive["records/tech-pack.json"]))).toEqual(record);
  });

  it("includes only revision-referenced local artwork and preserves its attribution and bytes", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withArtwork: true });
    const output = await createProductionPackOutputs(exportInput(value));
    const entries = unzipSync(output.archiveBytes);
    const attachment = output.manifest.artifacts[1]!;
    expect(attachment.path).toBe("attachments/local-0123456789abcdef0123456789abcdef-png-synthetic-local-art.png");
    expect(entries[attachment.path]).toEqual(ASSET_BYTES);
    expect(attachment.sourceLabel).toBe("Synthetic fixture input");
    expect(attachment.attribution).toBe("Created for S775 output validation");
    expect(decoder.decode(output.pdfBytes)).toContain(attachment.path);
    const excluded = await createProductionPackOutputs(exportInput(value, {
      preset: "measurements-qa",
      attachments: [],
    }));
    expect(excluded.manifest.artifacts).toHaveLength(1);
    expect(excluded.presentation.omittedSections).toContain("artwork");
    const excludedPreview = await previewProductionPackImport(importInput(value, excluded.archiveBytes));
    expect(excludedPreview.status).toBe("unchanged");
    await expect(createProductionPackOutputs(exportInput(value, { attachments: [] })))
      .rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, bytes: new Uint8Array([1, 2, 3]) }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, name: "../unsafe.png" }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, mediaType: "text/html" }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, mediaType: "image/jpeg" }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, sourceLabel: "bad\u0000label" }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      preset: "measurements-qa",
      attachments: [value.attachment!],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [value.attachment!, value.attachment!],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: null as never,
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, { attachments: [null] as never })))
      .rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, name: "   " }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    const noSourceLabel = await createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, name: "art", sourceLabel: "   ", attribution: null }],
    }));
    expect(noSourceLabel.manifest.artifacts[1]?.sourceLabel).toBeNull();
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, sourceLabel: "x".repeat(181) }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    const normalized = await createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, name: "雪", sourceLabel: null, attribution: null }],
    }));
    expect(normalized.manifest.artifacts[1]?.path).toContain("-artwork");
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: Array.from({ length: PRODUCTION_PACK_MAX_ATTACHMENTS + 1 }, (_, index) => ({
        ...value.attachment!, assetId: `extra-${index}`,
      })),
    }))).rejects.toMatchObject({ code: "limit-exceeded" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, assetId: "local-fedcba9876543210fedcba9876543210-png" }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, bytes: undefined } as never],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, bytes: {} as never }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    await expect(createProductionPackOutputs(exportInput(value, {
      attachments: [{ ...value.attachment!, bytes: new Uint8Array(ASSET_BYTES.length).fill(5) }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
    const currentPayload = value.revision.payload;
    if (currentPayload.payloadVersion !== 2) throw new Error("Synthetic fixture must use a current style revision.");
    const largeArtworkRevision = await createStyleRevision({
      styleId: value.styleId,
      revisionId: value.revision.revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: currentPayload.design,
      fieldObservations: currentPayload.fieldObservations,
      artwork: [{ ...value.artwork[0]!, byteLength: PRODUCTION_PACK_EXPANDED_LIMIT + 1 }],
      techPack: value.record,
    }, crypto);
    const virtualLargeBytes = new Proxy(new Uint8Array(), {
      get(target, property) {
        if (property === "byteLength") return PRODUCTION_PACK_EXPANDED_LIMIT + 1;
        return Reflect.get(target, property, target) as unknown;
      },
    }) as Uint8Array;
    await expect(createProductionPackOutputs(exportInput({ ...value, revision: largeArtworkRevision }, {
      attachments: [{ ...value.attachment!, bytes: virtualLargeBytes }],
    }))).rejects.toMatchObject({ code: "limit-exceeded" });

    const exactLimitHash = await sha256Hex(new Uint8Array([0]), crypto);
    const exactLimitRevision = await createStyleRevision({
      styleId: value.styleId,
      revisionId: value.revision.revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: currentPayload.design,
      fieldObservations: currentPayload.fieldObservations,
      artwork: [{ ...value.artwork[0]!, byteLength: 1, sha256: exactLimitHash }],
      techPack: value.record,
    }, crypto);
    await expect(createProductionPackOutputs(exportInput({ ...value, revision: exactLimitRevision }, {
      attachments: [{ ...value.attachment!, bytes: virtualByteLengthBytes(1, PRODUCTION_PACK_EXPANDED_LIMIT) }],
    }))).rejects.toMatchObject({ code: "limit-exceeded" });

    const payload = value.revision.payload;
    if (payload.payloadVersion !== 2) throw new Error("Synthetic fixture must use a current style revision.");
    const secondReference = { ...value.artwork[0]!, assetId: "local-fedcba9876543210fedcba9876543210-png" };
    const artworkSurfaceKey = Object.keys(payload.design.surface)[0]!;
    const artworkSurface = payload.design.surface[artworkSurfaceKey]!;
    const duplicateDesign = {
      ...payload.design,
      surface: {
        ...payload.design.surface,
        [artworkSurfaceKey]: {
          ...artworkSurface,
          placements: [
            ...artworkSurface.placements,
            { ...artworkSurface.placements[0]!, id: "synthetic-art-placement-2", assetId: secondReference.assetId },
          ],
        },
      },
    };
    const duplicateInputRevision = await createStyleRevision({
      styleId: value.styleId,
      revisionId: value.revision.revisionId,
      parentRevisionId: null,
      revisionNumber: 1,
      createdAt: TIME,
      design: duplicateDesign,
      fieldObservations: payload.fieldObservations,
      artwork: [...value.artwork, secondReference],
      techPack: value.record,
    }, crypto);
    await expect(createProductionPackOutputs(exportInput({ ...value, revision: duplicateInputRevision }, {
      attachments: [value.attachment!, { ...value.attachment! }],
    }))).rejects.toMatchObject({ code: "invalid-attachment" });
  });

  it("rejects uncommitted, stale, mismatched or malformed export inputs without saving", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    await expect(createProductionPackOutputs(exportInput(value, { currentHeadRevisionId: TEE_NEXT_REVISION_ID })))
      .rejects.toMatchObject({ code: "head-mismatch" });
    await expect(createProductionPackOutputs(exportInput(value, { currentHeadRevisionId: "" })))
      .rejects.toMatchObject({ code: "head-mismatch" });
    await expect(createProductionPackOutputs(exportInput(value, { record: { ...value.record, revisionNumber: 2 } as TechPackRecord })))
      .rejects.toMatchObject({ code: "invalid-record" });
    await expect(createProductionPackOutputs(exportInput(value, { revision: {} as StyleRevisionRecord })))
      .rejects.toMatchObject({ code: "invalid-revision" });
    const payload = value.revision.payload;
    if (payload.payloadVersion !== 2) throw new Error("Synthetic fixture must use a current style revision.");
    const { techPack: _techPack, ...legacyFields } = payload;
    const legacyPayload = { ...legacyFields, payloadVersion: 1 as const };
    const legacyRevision = {
      ...value.revision,
      payload: legacyPayload,
      revisionContentDigest: await sha256Hex(encoder.encode(canonicalizeJcs(legacyPayload)), crypto),
    } as StyleRevisionRecord;
    await expect(createProductionPackOutputs(exportInput(value, { revision: legacyRevision })))
      .rejects.toMatchObject({ code: "invalid-revision" });
    await expect(createProductionPackOutputs(exportInput(value, { preset: "unknown" as never })))
      .rejects.toMatchObject({ code: "invalid-section" });
    await expect(createProductionPackOutputs(exportInput(value, { selectedSections: ["identity", "identity"] })))
      .rejects.toMatchObject({ code: "invalid-section" });
    await expect(createProductionPackOutputs(exportInput(value, { selectedSections: ["not-a-section" as never] })))
      .rejects.toMatchObject({ code: "invalid-section" });
    await expect(createProductionPackOutputs(exportInput(value, { selectedSections: null as never })))
      .rejects.toMatchObject({ code: "invalid-section" });
    const invalidApprovedRecord = {
      ...value.record,
      approval: { ...value.record.approval, state: "APPROVED" as const, revisionId: TEE_NEXT_REVISION_ID,
        scopeFieldIds: [value.record.cover.styleCode.fieldId], changedBy: "reviewer", changedAt: TIME },
    };
    await expect(createProductionPackOutputs(exportInput(value, { record: invalidApprovedRecord })))
      .rejects.toMatchObject({ code: "invalid-record" });
  });
});

describe("read-only production pack import preview", () => {
  it("reports added and removed object paths in a deterministic field diff", () => {
    expect(computeProductionPackFieldDiff(
      { common: { unchanged: true }, beforeOnly: { value: 1 } },
      { common: { unchanged: true }, afterOnly: { value: 2 } },
    )).toEqual([
      { path: "afterOnly", change: "added", before: null, after: { value: 2 } },
      { path: "beforeOnly", change: "removed", before: { value: 1 }, after: null },
    ]);
    expect(computeProductionPackFieldDiff("before", "after")).toEqual([
      { path: "$", change: "changed", before: "before", after: "after" },
    ]);
  });

  it("treats unchanged files and metadata-only changes as no-op round-trips", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const preview = await previewProductionPackImport(importInput(value, output.archiveBytes));
    expect(preview.status).toBe("unchanged");
    expect(preview.diff).toEqual([]);
    expect(preview.candidateRecord).toBeNull();
    expect(preview.canApply).toBe(false);
    const timestampOnly = { ...value.record, updatedAt: LATER };
    const revisedZip = rewriteArchive(output.archiveBytes, timestampOnly);
    const metadataPreview = await previewProductionPackImport(importInput(value, revisedZip));
    expect(metadataPreview.status).toBe("unchanged");
    expect(metadataPreview.diff).toEqual([]);
    expect(metadataPreview.candidateRecord).toBeNull();
    expect(await previewProductionPackImport(importInput(value, output.archiveBytes, { fileName: "production-pack.pdf" }))
      .catch((error: unknown) => error)).toMatchObject({ code: "invalid-package" });
  });

  it("shows a complete field diff, strips imported approval and requires semantic validation", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const edited = syntheticRecord(value.record, "Synthetic revised label with (print) × detail");
    const forged = {
      ...edited,
      updatedAt: LATER,
      approval: {
        state: "APPROVED" as const,
        revisionId: value.revision.revisionId,
        scopeFieldIds: [value.record.cover.styleName.fieldId],
        changedBy: "untrusted package author",
        changedAt: TIME,
        manifestId: null,
      },
    };
    const importedZip = rewriteArchive(output.archiveBytes, forged);
    const withoutContext = await previewProductionPackImport(importInput(value, importedZip));
    expect(withoutContext.status).toBe("changed");
    expect(withoutContext.diff.map((entry) => entry.path)).toContain("cover.styleName.value");
    expect(withoutContext.candidateRecord).toBeNull();
    expect(withoutContext.canApply).toBe(false);
    expect(withoutContext.findings[0]?.path).toBe("validationContext");
    const validationCapture: { record?: TechPackRecord } = {};
    const accepted = await previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: (record: TechPackRecord) => { validationCapture.record = record; return []; },
    }));
    expect(accepted.status).toBe("changed");
    expect(accepted.canApply).toBe(true);
    expect(accepted.candidateRecord?.cover.styleName.value).toBe("Synthetic revised label with (print) × detail");
    expect(accepted.candidateRecord?.approval).toEqual({
      state: "DRAFT", revisionId: null, scopeFieldIds: [], changedBy: null, changedAt: null, manifestId: null,
    });
    expect(validationCapture.record?.approval.state).toBe("DRAFT");
    const retainedAttention: ProductionPackSemanticFinding[] = [
      { status: "CONFLICT", path: "cover.styleCode", message: "Synthetic sources disagree." },
      { status: "UNRESOLVED", path: "cover.ownerLabel", message: "Synthetic source is absent." },
    ];
    const withAttention = await previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => retainedAttention,
    }));
    expect(withAttention.canApply).toBe(true);
    expect(withAttention.findings).toEqual(retainedAttention);
    const rejected = await previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => [{ status: "INVALID", path: "cover.styleName", message: "Synthetic invalid value." }],
    }));
    expect(rejected.candidateRecord?.approval.state).toBe("DRAFT");
    expect(rejected.canApply).toBe(false);
    await expect(previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => { throw new Error("fixture validator failure"); },
    }))).rejects.toMatchObject({ code: "invalid-record" });
    await expect(previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => { throw "synthetic non-Error validator failure"; },
    }))).rejects.toMatchObject({ code: "invalid-record" });
    await expect(previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => ["invalid finding"] as never,
    }))).rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => null as never,
    }))).rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, importedZip, {
      validateCandidate: () => { throw new ProductionPackError("invalid-record", "Synthetic typed validator failure."); },
    }))).rejects.toMatchObject({ code: "invalid-record" });
  });

  it("keeps stale imports read-only, including stale no-op packages", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const changedRecord = syntheticRecord(value.record, "Synthetic edit from old base");
    const editedZip = rewriteArchive(output.archiveBytes, changedRecord);
    const nextPack = bindTechPackToRevision(value.record, TEE_NEXT_REVISION_ID, 2, LATER);
    const nextRevision = await createStyleRevision({
      styleId: value.styleId,
      revisionId: TEE_NEXT_REVISION_ID,
      parentRevisionId: value.revision.revisionId,
      revisionNumber: 2,
      createdAt: LATER,
      design: value.revision.payload.design,
      fieldObservations: value.revision.payload.fieldObservations,
      artwork: value.artwork,
      techPack: nextPack,
    }, crypto);
    const history = [value.revision, nextRevision];
    const changed = await previewProductionPackImport(importInput(value, editedZip, {
      revisionHistory: history,
      currentHeadRevisionId: nextRevision.revisionId,
      validateCandidate: () => [],
    }));
    expect(changed.status).toBe("stale");
    expect(changed.diff.length).toBeGreaterThan(0);
    expect(changed.candidateRecord).toBeNull();
    expect(changed.canApply).toBe(false);
    const unchanged = await previewProductionPackImport(importInput(value, output.archiveBytes, {
      revisionHistory: history,
      currentHeadRevisionId: nextRevision.revisionId,
      validateCandidate: () => [],
    }));
    expect(unchanged.status).toBe("stale");
    expect(unchanged.diff).toEqual([]);
  });

  it("validates actual archive, manifest, record, hashes, local history and attachment identity", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withArtwork: true });
    const output = await createProductionPackOutputs(exportInput(value));
    const validImport = await previewProductionPackImport(importInput(value, output.archiveBytes));
    expect(validImport.attachments).toHaveLength(1);
    const originalEntries = unzipSync(output.archiveBytes);
    const changedPdfEntries = { ...originalEntries, "documents/production-pack.pdf": new Uint8Array([1, 2, 3]) };
    await expect(previewProductionPackImport(importInput(value, makeArchive(changedPdfEntries as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const sameLengthPdf = originalEntries["documents/production-pack.pdf"]!.slice();
    sameLengthPdf[0] = sameLengthPdf[0]! ^ 0xff;
    await expect(previewProductionPackImport(importInput(value, makeArchive({
      ...originalEntries, "documents/production-pack.pdf": sameLengthPdf,
    } as Zippable)))).rejects.toMatchObject({ code: "invalid-package" });
    const changedAttachmentEntries = { ...originalEntries, [output.manifest.artifacts[1]!.path]: new Uint8Array([4, 5, 6]) };
    await expect(previewProductionPackImport(importInput(value, makeArchive(changedAttachmentEntries as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const missingAttachment = { ...originalEntries };
    delete missingAttachment[output.manifest.artifacts[1]!.path];
    await expect(previewProductionPackImport(importInput(value, makeArchive(missingAttachment as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const unexpected = { ...originalEntries, "notes.txt": encoder.encode("unexpected") };
    await expect(previewProductionPackImport(importInput(value, makeArchive(unexpected as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, { fileName: "bundle.zip" })))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, { revisionHistory: [] })))
      .rejects.toMatchObject({ code: "invalid-revision" });
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, { revisionHistory: null as never })))
      .rejects.toMatchObject({ code: "invalid-revision" });
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, { currentHeadRevisionId: WOVEN_REVISION_ID })))
      .rejects.toMatchObject({ code: "invalid-revision" });
    const corruptBase = { ...value.revision, revisionContentDigest: "0".repeat(64) } as StyleRevisionRecord;
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, {
      revisionHistory: [corruptBase],
    }))).rejects.toMatchObject({ code: "invalid-revision" });
    const corruptRecord = rewriteArchive(output.archiveBytes, { ...value.record, recipeVersion: "another-version" });
    await expect(previewProductionPackImport(importInput(value, corruptRecord))).rejects.toMatchObject({ code: "invalid-record" });
    const modifiedCreation = rewriteArchive(output.archiveBytes, { ...value.record, createdAt: LATER, updatedAt: LATER });
    await expect(previewProductionPackImport(importInput(value, modifiedCreation))).rejects.toMatchObject({ code: "invalid-record" });
    const invalidRecord = rewriteArchive(output.archiveBytes, { ...value.record, materials: null });
    await expect(previewProductionPackImport(importInput(value, invalidRecord))).rejects.toMatchObject({ code: "invalid-record" });
    const mismatchedBaseDigest = rewriteManifest(output.archiveBytes, (manifest) => ({
      ...manifest, revisionContentDigest: "f".repeat(64),
    }));
    await expect(previewProductionPackImport(importInput(value, mismatchedBaseDigest)))
      .rejects.toMatchObject({ code: "invalid-revision" });

    const otherStyle = await fixture("woven-shirt", WOVEN_STYLE_ID, WOVEN_REVISION_ID);
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes, {
      revisionHistory: [value.revision, otherStyle.revision],
      currentHeadRevisionId: otherStyle.revision.revisionId,
    }))).rejects.toMatchObject({ code: "invalid-revision" });

    const artworkFixture = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withArtwork: true });
    const artworkOutput = await createProductionPackOutputs(exportInput(artworkFixture));
    const incompatibleMedia = rewriteManifest(artworkOutput.archiveBytes, (manifest) => {
      const artifacts = manifest.artifacts as Record<string, unknown>[];
      return { ...manifest, artifacts: [artifacts[0], { ...artifacts[1], mediaType: "image/webp" }] };
    });
    await expect(previewProductionPackImport(importInput(artworkFixture, incompatibleMedia)))
      .rejects.toMatchObject({ code: "invalid-package" });
    const skippedArtworkSection = rewriteManifest(artworkOutput.archiveBytes, (manifest) => ({
      ...manifest,
      selectedSections: (manifest.selectedSections as string[]).filter((section) => section !== "artwork"),
    }));
    await expect(previewProductionPackImport(importInput(artworkFixture, skippedArtworkSection)))
      .rejects.toMatchObject({ code: "invalid-package" });
    const noArtworkEntry = { ...unzipSync(artworkOutput.archiveBytes) };
    delete noArtworkEntry[artworkOutput.manifest.artifacts[1]!.path];
    const noArtworkArtifactManifest = JSON.parse(decoder.decode(noArtworkEntry["manifest.json"]!)) as Record<string, unknown>;
    noArtworkArtifactManifest.artifacts = [artworkOutput.manifest.artifacts[0]];
    noArtworkEntry["manifest.json"] = encoder.encode(canonicalizeJcs(noArtworkArtifactManifest));
    await expect(previewProductionPackImport(importInput(artworkFixture, makeArchive(noArtworkEntry as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
  });

  it("rejects malformed, non-canonical, unsupported and mismatched manifests and JSON", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const badManifestUpdates: readonly ((manifest: Record<string, unknown>) => Record<string, unknown>)[] = [
      (manifest) => { const { format: _format, ...rest } = manifest; return rest; },
      (manifest) => ({ ...manifest, format: "wrong-format" }),
      (manifest) => ({ ...manifest, packageVersion: 2 }),
      (manifest) => ({ ...manifest, exporterVersion: "unknown-writer" }),
      (manifest) => ({ ...manifest, styleId: 7 }),
      (manifest) => ({ ...manifest, styleId: "" }),
      (manifest) => ({ ...manifest, recipeId: "" }),
      (manifest) => ({ ...manifest, recipeVersion: "" }),
      (manifest) => ({ ...manifest, revisionId: "" }),
      (manifest) => ({ ...manifest, revisionNumber: 0 }),
      (manifest) => ({ ...manifest, revisionNumber: 1.5 }),
      (manifest) => ({ ...manifest, revisionContentDigest: "bad-digest" }),
      (manifest) => ({ ...manifest, recordSchemaVersion: 4 }),
      (manifest) => ({ ...manifest, preset: "unknown-preset" }),
      (manifest) => ({ ...manifest, selectedSections: null }),
      (manifest) => ({ ...manifest, recordPath: "record.json" }),
      (manifest) => ({ ...manifest, artifacts: [] }),
      (manifest) => ({ ...manifest, artifacts: Array.from({ length: 130 }, () => manifest.artifacts && (manifest.artifacts as unknown[])[0]) }),
      (manifest) => ({ ...manifest, selectedSections: ["identity", "not-a-section", "sources-open-items", "approval-disclaimer"] }),
      (manifest) => ({ ...manifest, selectedSections: ["identity", "identity", "sources-open-items", "approval-disclaimer"] }),
      (manifest) => ({ ...manifest, selectedSections: ["identity", "approval-disclaimer", "sources-open-items"] }),
      (manifest) => ({ ...manifest, selectedSections: ["sources-open-items", "identity", "approval-disclaimer"] }),
      (manifest) => ({ ...manifest, selectedSections: ["identity", "approval-disclaimer"] }),
      (manifest) => ({ ...manifest, artifacts: [
        (manifest.artifacts as Record<string, unknown>[])[0],
        { ...(manifest.artifacts as Record<string, unknown>[])[0], path: "documents/production-pack.pdf" },
      ] }),
      (manifest) => {
        const pdf = (manifest.artifacts as Record<string, unknown>[])[0];
        const artwork = (assetId: string) => ({
          path: `attachments/${assetId}-artwork.png`, role: "artwork", mediaType: "image/png",
          byteLength: 1, sha256: "0".repeat(64), assetId, displayName: "artwork.png",
          sourceLabel: null, attribution: null,
        });
        return { ...manifest, artifacts: [pdf, artwork("b"), artwork("a")] };
      },
    ];
    for (const update of badManifestUpdates) {
      await expect(previewProductionPackImport(importInput(value, rewriteManifest(output.archiveBytes, update))))
        .rejects.toBeInstanceOf(ProductionPackError);
    }
    const invalidArtifactUpdates: readonly ((artifact: Record<string, unknown>) => Record<string, unknown>)[] = [
      (artifact) => { const { path: _path, ...rest } = artifact; return rest; },
      (artifact) => ({ ...artifact, path: "../escape.pdf" }),
      (artifact) => ({ ...artifact, role: 7 }),
      (artifact) => ({ ...artifact, mediaType: "application/octet-stream" }),
      (artifact) => ({ ...artifact, byteLength: 0 }),
      (artifact) => ({ ...artifact, sha256: "bad" }),
      (artifact) => ({ ...artifact, displayName: "" }),
      (artifact) => ({ ...artifact, sourceLabel: 7 }),
      (artifact) => ({ ...artifact, attribution: " padded " }),
      (artifact) => ({ ...artifact, sourceLabel: "bad\u0000label" }),
      (artifact) => ({ ...artifact, unexpected: true }),
      (artifact) => ({ ...artifact, assetId: ASSET_ID }),
      (artifact) => ({ ...artifact, attribution: "not-null" }),
    ];
    for (const update of invalidArtifactUpdates) {
      await expect(previewProductionPackImport(importInput(value, rewriteManifest(output.archiveBytes, (manifest) => ({
        ...manifest,
        artifacts: [(manifest.artifacts as Record<string, unknown>[]).map(update)[0]],
      }))))).rejects.toBeInstanceOf(ProductionPackError);
    }
    const artworkFixture = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withArtwork: true });
    const artworkOutput = await createProductionPackOutputs(exportInput(artworkFixture));
    const invalidArtworkMedia = rewriteManifest(artworkOutput.archiveBytes, (manifest) => {
      const artifacts = manifest.artifacts as Record<string, unknown>[];
      return { ...manifest, artifacts: [artifacts[0], { ...artifacts[1], mediaType: "application/octet-stream" }] };
    });
    await expect(previewProductionPackImport(importInput(artworkFixture, invalidArtworkMedia)))
      .rejects.toMatchObject({ code: "invalid-package" });
    const nonCanonical = rewriteManifestText(output.archiveBytes, JSON.stringify(output.manifest, null, 2));
    await expect(previewProductionPackImport(importInput(value, nonCanonical))).rejects.toMatchObject({ code: "invalid-package" });
    const unsafeNumberEntries = { ...unzipSync(output.archiveBytes) };
    const unsafeNumberManifest = JSON.parse(decoder.decode(unsafeNumberEntries["manifest.json"]!)) as Record<string, unknown>;
    const unsafeNumberArtifacts = unsafeNumberManifest.artifacts as Record<string, unknown>[];
    unsafeNumberArtifacts[0] = { ...unsafeNumberArtifacts[0], byteLength: 1e100 };
    unsafeNumberEntries["manifest.json"] = encoder.encode(JSON.stringify(unsafeNumberManifest));
    await expect(previewProductionPackImport(importInput(value, makeArchive(unsafeNumberEntries as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const brokenJson = rewriteManifestText(output.archiveBytes, "{not valid JSON");
    await expect(previewProductionPackImport(importInput(value, brokenJson))).rejects.toMatchObject({ code: "invalid-package" });
    const invalidUtf8 = { ...unzipSync(output.archiveBytes), "manifest.json": new Uint8Array([0xff, 0xfe]) };
    await expect(previewProductionPackImport(importInput(value, makeArchive(invalidUtf8 as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const missingRecord = { ...unzipSync(output.archiveBytes) };
    delete missingRecord["records/tech-pack.json"];
    await expect(previewProductionPackImport(importInput(value, makeArchive(missingRecord as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const missingManifest = { ...unzipSync(output.archiveBytes) };
    delete missingManifest["manifest.json"];
    await expect(previewProductionPackImport(importInput(value, makeArchive(missingManifest as Zippable))))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, new Uint8Array())))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, [] as never)))
      .rejects.toMatchObject({ code: "invalid-package" });
  });

  it("reports added and removed array records as field-level import changes", async () => {
    const blank = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const blankOutput = await createProductionPackOutputs(exportInput(blank));
    const withRows = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const sourceRows = syntheticT01Rows();
    const addedRecord = parseTechPackRecord({ ...withRows.record, ...sourceRows });
    if (!addedRecord.ok) throw new Error(addedRecord.error);
    const addedZip = rewriteArchive(blankOutput.archiveBytes, addedRecord.value);
    const addedPreview = await previewProductionPackImport(importInput(blank, addedZip, { validateCandidate: () => [] }));
    expect(addedPreview.diff.map((entry) => entry.change)).toContain("added");
    const populated = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID, { withT01Rows: true });
    const populatedOutput = await createProductionPackOutputs(exportInput(populated));
    const removedRecord: TechPackRecord = { ...populated.record, materials: [], bomRows: [], colorways: [] };
    const removedZip = rewriteArchive(populatedOutput.archiveBytes, removedRecord);
    const removedPreview = await previewProductionPackImport(importInput(populated, removedZip, { validateCandidate: () => [] }));
    expect(removedPreview.diff.map((entry) => entry.change)).toContain("removed");
  });

  it("rejects unsafe, duplicate, truncated, unsupported and oversized ZIP entries", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    await expect(previewProductionPackImport(importInput(value, makeArchive({ "../escape": encoder.encode("x") }))))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, makeArchive({ "C:/escape": encoder.encode("x") }))))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, makeArchive({ "folder\\escape": encoder.encode("x") }))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const duplicate = lowLevelZip([
      { name: "manifest.json", bytes: encoder.encode("{}") },
      { name: "manifest.json", bytes: encoder.encode("{}") },
    ]);
    await expect(previewProductionPackImport(importInput(value, duplicate))).rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, output.archiveBytes.slice(0, -12))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const unsupported = lowLevelZip([{ name: "manifest.json", bytes: encoder.encode("{}"), compression: 99 }]);
    await expect(previewProductionPackImport(importInput(value, unsupported))).rejects.toMatchObject({ code: "invalid-package" });
    const oversizedJson = withZipSizeDeclaration(output.archiveBytes, "manifest.json", PRODUCTION_PACK_JSON_LIMIT + 1);
    await expect(previewProductionPackImport(importInput(value, oversizedJson))).rejects.toMatchObject({ code: "limit-exceeded" });
    const oversizedExpanded = withZipSizeDeclaration(output.archiveBytes, "documents/production-pack.pdf", PRODUCTION_PACK_EXPANDED_LIMIT + 1);
    await expect(previewProductionPackImport(importInput(value, oversizedExpanded))).rejects.toMatchObject({ code: "limit-exceeded" });
    const oversizedInput = new Proxy(new Uint8Array(), {
      get(target, property) {
        if (property === "byteLength") return PRODUCTION_PACK_ARCHIVE_LIMIT + 1;
        return Reflect.get(target, property, target) as unknown;
      },
    }) as Uint8Array;
    await expect(previewProductionPackImport(importInput(value, oversizedInput))).rejects.toMatchObject({ code: "limit-exceeded" });
  });

  it("enforces compressed, per-file and aggregate ZIP size declarations before extraction", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const oversizedCompressed = withZipCompressedSizeDeclaration(
      output.archiveBytes, "manifest.json", PRODUCTION_PACK_ARCHIVE_LIMIT + 1,
    );
    await expect(previewProductionPackImport(importInput(value, oversizedCompressed)))
      .rejects.toMatchObject({ code: "limit-exceeded" });
    const oversizedAttachment = withZipSizeDeclaration(
      output.archiveBytes, "documents/production-pack.pdf", PRODUCTION_PACK_EXPANDED_LIMIT + 1,
    );
    await expect(previewProductionPackImport(importInput(value, oversizedAttachment)))
      .rejects.toMatchObject({ code: "limit-exceeded" });
    const oversizedJson = withZipSizeDeclaration(
      output.archiveBytes, "manifest.json", PRODUCTION_PACK_JSON_LIMIT + 1,
    );
    await expect(previewProductionPackImport(importInput(value, oversizedJson)))
      .rejects.toMatchObject({ code: "limit-exceeded" });

    const mandatory = { ...unzipSync(output.archiveBytes) };
    const firstAssetBytes = 2 * 1024 * 1024;
    const secondAssetDeclaration = 255 * 1024 * 1024;
    const twoAssets = makeArchive({
      ...mandatory,
      "attachments/a-x": new Uint8Array(firstAssetBytes),
      "attachments/b-x": encoder.encode("y"),
    });
    const aggregateOversized = withZipSizeDeclaration(
      withZipSizeDeclaration(twoAssets, "attachments/a-x", firstAssetBytes),
      "attachments/b-x", secondAssetDeclaration,
    );
    await expect(previewProductionPackImport(importInput(value, aggregateOversized)))
      .rejects.toMatchObject({ code: "limit-exceeded" });
  });

  it("rejects malformed ZIP member streams and local size mismatches", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    await expect(previewProductionPackImport(importInput(value, corruptFirstDeflateByte(output.archiveBytes))))
      .rejects.toMatchObject({ code: "invalid-package" });
    await expect(previewProductionPackImport(importInput(value, truncateFirstEntryPayload(output.archiveBytes))))
      .rejects.toMatchObject({ code: "invalid-package" });
    const invalidDeflate = lowLevelZip([{
      name: "manifest.json",
      bytes: new Uint8Array([0xff, 0xff]),
      compression: 8,
    }]);
    await expect(previewProductionPackImport(importInput(value, invalidDeflate)))
      .rejects.toMatchObject({ code: "invalid-package" });
    const view = new DataView(output.archiveBytes.buffer, output.archiveBytes.byteOffset, output.archiveBytes.byteLength);
    const nameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const manifestLength = view.getUint32(22, true);
    const localSizeMismatch = withLocalExpandedSize(
      output.archiveBytes, "manifest.json", manifestLength + 1,
    );
    expect(nameLength + extraLength).toBeGreaterThan(0);
    await expect(previewProductionPackImport(importInput(value, localSizeMismatch)))
      .rejects.toMatchObject({ code: "invalid-package" });
  });

  it("caps streamed expanded JSON and ZIP contents without trusting local size declarations", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    let mode: "json-limit" | "expanded-limit" | "start-throws" | "start-throws-string"
      | "push-throws" | "push-throws-string" | "stream-error" | "stream-error-string" | "unfinished" = "json-limit";
    vi.resetModules();
    vi.doMock("fflate", async (importOriginal) => {
      const actual = await importOriginal<typeof import("fflate")>();
      class SyntheticUnzip {
        constructor(private readonly onFile: (file: unknown) => void) {}

        register(_decoder: unknown): void {}

        push(_data: Uint8Array, _final?: boolean): void {
          if (mode === "push-throws") throw new Error("Synthetic ZIP reader failure.");
          if (mode === "push-throws-string") throw "Synthetic non-Error ZIP reader failure";
          const file: {
            name: string;
            compression: number;
            ondata?: (error: unknown, data: Uint8Array, final: boolean) => void;
            start: () => void;
          } = {
            name: mode === "expanded-limit" ? "attachments/expanded" : "manifest.json",
            compression: 0,
            start: () => {
              if (mode === "start-throws") throw new Error("Synthetic start failure.");
              if (mode === "start-throws-string") throw "Synthetic non-Error start failure";
              if (mode === "unfinished") return;
              if (mode === "stream-error") {
                file.ondata?.(new Error("Synthetic member stream failure."), new Uint8Array(), false);
                return;
              }
              if (mode === "stream-error-string") {
                file.ondata?.("Synthetic non-Error stream failure", new Uint8Array(), false);
                return;
              }
              const byteLength = mode === "json-limit"
                ? PRODUCTION_PACK_JSON_LIMIT + 1 : PRODUCTION_PACK_EXPANDED_LIMIT + 1;
              file.ondata?.(null, virtualByteLengthBytes(byteLength), false);
            },
          };
          this.onFile(file);
        }
      }
      return { ...actual, Unzip: SyntheticUnzip as unknown as typeof actual.Unzip };
    });
    try {
      const outputModule = await import("./tech-pack-output");
      const input = importInput(value, new Uint8Array([1]));
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "limit-exceeded" });
      mode = "expanded-limit";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "limit-exceeded" });
      mode = "start-throws";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "start-throws-string";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "push-throws";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "push-throws-string";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "stream-error";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "stream-error-string";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
      mode = "unfinished";
      await expect(outputModule.previewProductionPackImport(input)).rejects.toMatchObject({ code: "invalid-package" });
    } finally {
      vi.doUnmock("fflate");
      vi.resetModules();
    }
  });

  it("checks ZIP end records and central-directory names, lengths, sizes and duplicates", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const source = output.archiveBytes;
    const end = centralEndOffset(source);
    const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
    const directoryOffset = view.getUint32(end + 16, true);

    const inconsistentEnd = source.slice();
    new DataView(inconsistentEnd.buffer).setUint16(end + 8, 0, true);
    await expect(previewProductionPackImport(importInput(value, inconsistentEnd)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const badCentralSignature = source.slice();
    new DataView(badCentralSignature.buffer).setUint32(directoryOffset, 0, true);
    await expect(previewProductionPackImport(importInput(value, badCentralSignature)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const truncatedCentralName = source.slice();
    new DataView(truncatedCentralName.buffer).setUint16(directoryOffset + 28, 0xffff, true);
    await expect(previewProductionPackImport(importInput(value, truncatedCentralName)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const invalidUtf8 = source.slice();
    invalidUtf8[directoryOffset + 46] = 0xff;
    await expect(previewProductionPackImport(importInput(value, invalidUtf8)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const unsafeCentralName = replaceZipEntryName(source, "manifest.json", "../manifest.x", true);
    await expect(previewProductionPackImport(importInput(value, unsafeCentralName)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const missingCentralMember = replaceZipEntryName(
      source, "documents/production-pack.pdf", `attachments/${"a".repeat(15)}-x`, true,
    );
    await expect(previewProductionPackImport(importInput(value, missingCentralMember)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const wrongCentralSize = withCentralExpandedSize(
      source, "documents/production-pack.pdf", output.manifest.artifacts[0]!.byteLength + 1,
    );
    await expect(previewProductionPackImport(importInput(value, wrongCentralSize)))
      .rejects.toMatchObject({ code: "invalid-package" });

    const duplicateCentralName = lowLevelZip([
      { name: "manifest.json", bytes: encoder.encode("{}") },
      { name: "records/tech-pack.json", bytes: encoder.encode("{}") },
      { name: "documents/production-pack.pdf", bytes: encoder.encode("pdf") },
      { name: "attachments/a-x", bytes: encoder.encode("a") },
      { name: "attachments/b-x", bytes: encoder.encode("b") },
    ]);
    const duplicateCentral = replaceZipEntryName(duplicateCentralName, "attachments/b-x", "attachments/a-x", true);
    await expect(previewProductionPackImport(importInput(value, duplicateCentral)))
      .rejects.toMatchObject({ code: "invalid-package" });
  });

  it("limits ZIP entry count before opening the excess member", async () => {
    const value = await fixture("tee", TEE_STYLE_ID, TEE_REVISION_ID);
    const output = await createProductionPackOutputs(exportInput(value));
    const mandatory = { ...unzipSync(output.archiveBytes) };
    for (let index = 0; index < 129; index += 1) {
      mandatory[`attachments/asset-${index}-x`] = encoder.encode("x");
    }
    await expect(previewProductionPackImport(importInput(value, makeArchive(mandatory))))
      .rejects.toMatchObject({ code: "limit-exceeded" });
  });
});
