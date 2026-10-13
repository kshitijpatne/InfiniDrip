import { Unzip, UnzipInflate, UnzipPassThrough, zipSync, type Zippable } from "fflate";
import { assemblePdf, PAGE_A4, pt } from "../export/pdf";
import {
  canonicalizeJcs,
  parseStyleRevisionRecord,
  sha256Hex,
  verifyStyleRevision,
  type CurrentStyleRevisionPayload,
  type StyleRevisionRecord,
} from "./style-revisions";
import {
  parseTechPackRecord,
  techPackRevisionContent,
  type TechPackRecord,
} from "./tech-pack-records";

export const PRODUCTION_PACK_FORMAT = "infinidrip-techpack";
export const PRODUCTION_PACK_VERSION = 1;
export const PRODUCTION_PACK_EXPORTER_VERSION = "tech-pack-output-v1";
export const PRODUCTION_PACK_ARCHIVE_LIMIT = 256 * 1024 * 1024;
export const PRODUCTION_PACK_EXPANDED_LIMIT = 256 * 1024 * 1024;
export const PRODUCTION_PACK_MAX_ATTACHMENTS = 128;
export const PRODUCTION_PACK_MAX_ENTRIES = PRODUCTION_PACK_MAX_ATTACHMENTS + 3;
export const PRODUCTION_PACK_JSON_LIMIT = 32 * 1024 * 1024;

export const PRODUCTION_PACK_SECTIONS = Object.freeze([
  "identity",
  "materials-bom",
  "measurements-qa",
  "construction",
  "artwork",
  "sources-open-items",
  "approval-disclaimer",
] as const);

export type ProductionPackSection = typeof PRODUCTION_PACK_SECTIONS[number];
export type ProductionPackPreset = "complete-pack" | "materials-construction" | "measurements-qa";

export const PRODUCTION_PACK_PRESETS: Readonly<Record<ProductionPackPreset, readonly ProductionPackSection[]>> = Object.freeze({
  "complete-pack": PRODUCTION_PACK_SECTIONS,
  "materials-construction": Object.freeze([
    "identity", "materials-bom", "construction", "artwork", "sources-open-items", "approval-disclaimer",
  ] as const),
  "measurements-qa": Object.freeze([
    "identity", "measurements-qa", "sources-open-items", "approval-disclaimer",
  ] as const),
});

export type ProductionPackErrorCode =
  | "invalid-revision"
  | "head-mismatch"
  | "invalid-record"
  | "invalid-section"
  | "invalid-attachment"
  | "limit-exceeded"
  | "invalid-package";

export class ProductionPackError extends Error {
  readonly code: ProductionPackErrorCode;

  constructor(code: ProductionPackErrorCode, message: string) {
    super(message);
    this.name = "ProductionPackError";
    this.code = code;
  }
}

export interface ProductionPackAttachmentInput {
  readonly assetId: string;
  readonly name: string;
  readonly mediaType: string;
  readonly sourceLabel: string | null;
  readonly attribution: string | null;
  readonly bytes: Uint8Array;
}

export interface ProductionPackArtifactDescriptor {
  readonly path: string;
  readonly role: "production-pdf" | "artwork";
  readonly mediaType: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly assetId: string | null;
  readonly displayName: string;
  readonly sourceLabel: string | null;
  readonly attribution: string | null;
}

export interface ProductionPackManifest {
  readonly format: typeof PRODUCTION_PACK_FORMAT;
  readonly packageVersion: typeof PRODUCTION_PACK_VERSION;
  readonly exporterVersion: typeof PRODUCTION_PACK_EXPORTER_VERSION;
  readonly styleId: string;
  readonly recipeId: string;
  readonly recipeVersion: string;
  readonly revisionId: string;
  readonly revisionNumber: number;
  readonly revisionContentDigest: string;
  readonly recordSchemaVersion: 1 | 2 | 3;
  readonly preset: ProductionPackPreset;
  readonly selectedSections: readonly ProductionPackSection[];
  readonly recordPath: "records/tech-pack.json";
  readonly artifacts: readonly ProductionPackArtifactDescriptor[];
}

export interface ProductionPackPresentationModel {
  readonly format: typeof PRODUCTION_PACK_FORMAT;
  readonly fileName: "production-pack.pdf";
  readonly mediaType: "application/pdf";
  readonly styleId: string;
  readonly recipeId: string;
  readonly recipeVersion: string;
  readonly revisionId: string;
  readonly revisionNumber: number;
  readonly revisionContentDigest: string;
  readonly approvalState: TechPackRecord["approval"]["state"];
  readonly approvalRevisionId: string | null;
  readonly approvalScopeFieldIds: readonly string[];
  readonly selectedSections: readonly ProductionPackSection[];
  readonly omittedSections: readonly ProductionPackSection[];
  readonly record: TechPackRecord;
  readonly disclaimer: "Local digital review only; no supplier or production acceptance is established.";
}

export interface ProductionPackOutputs {
  readonly pdfBytes: Uint8Array;
  readonly archiveBytes: Uint8Array;
  readonly recordJson: string;
  readonly manifest: ProductionPackManifest;
  readonly presentation: ProductionPackPresentationModel;
}

export interface CreateProductionPackInput {
  readonly record: TechPackRecord;
  readonly revision: StyleRevisionRecord;
  readonly currentHeadRevisionId: string;
  readonly preset: ProductionPackPreset;
  /** The user-selected final sections. Required sections are always restored. */
  readonly selectedSections?: readonly ProductionPackSection[];
  readonly attachments: readonly ProductionPackAttachmentInput[];
  readonly crypto?: Crypto;
}

export interface ProductionPackFieldDiff {
  readonly path: string;
  readonly change: "added" | "removed" | "changed";
  readonly before: unknown;
  readonly after: unknown;
}

export interface ProductionPackSemanticFinding {
  readonly status: "INVALID" | "CONFLICT" | "UNRESOLVED";
  readonly path: string;
  readonly message: string;
}

export interface ProductionPackImportPreview {
  readonly status: "unchanged" | "changed" | "stale";
  readonly baseRevision: StyleRevisionRecord;
  readonly currentHead: StyleRevisionRecord;
  readonly diff: readonly ProductionPackFieldDiff[];
  readonly candidateRecord: TechPackRecord | null;
  readonly canApply: boolean;
  readonly findings: readonly ProductionPackSemanticFinding[];
  readonly attachments: readonly ProductionPackArtifactDescriptor[];
}

export interface PreviewProductionPackImportInput {
  readonly fileName: string;
  readonly archiveBytes: Uint8Array;
  readonly revisionHistory: readonly StyleRevisionRecord[];
  readonly currentHeadRevisionId: string;
  readonly validateCandidate?: (record: TechPackRecord) => readonly ProductionPackSemanticFinding[];
  readonly crypto?: Crypto;
}

interface ExtractedArchive {
  readonly entries: ReadonlyMap<string, Uint8Array>;
  readonly expandedBytes: number;
}

const SECTION_LABELS: Readonly<Record<ProductionPackSection, string>> = Object.freeze({
  identity: "Style and revision identity",
  "materials-bom": "Materials, BOM and colorways",
  "measurements-qa": "Measurements and sample QA",
  construction: "Construction operations and references",
  artwork: "Local artwork and placements",
  "sources-open-items": "Sources, provenance and open items",
  "approval-disclaimer": "Approval scope and review disclaimer",
});

const REQUIRED_SECTIONS = new Set<ProductionPackSection>([
  "identity", "sources-open-items", "approval-disclaimer",
]);
const SAFE_ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SAFE_ATTACHMENT_PATH = /^attachments\/[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const MAX_NAME_LENGTH = 180;
const MAX_PDF_LINES_PER_PAGE = 46;
const PDF_BODY_CHARACTERS = 84;
const FIXED_ZIP_TIME = new Date(1980, 0, 1, 0, 0, 0);
const encoder = new TextEncoder();
const fatalUtf8 = new TextDecoder("utf-8", { fatal: true });

function fail(code: ProductionPackErrorCode, message: string): never {
  throw new ProductionPackError(code, message);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function orderedSections(
  preset: ProductionPackPreset,
  selectedSections: readonly ProductionPackSection[] | undefined,
): ProductionPackSection[] {
  if (!Object.prototype.hasOwnProperty.call(PRODUCTION_PACK_PRESETS, preset)) {
    fail("invalid-section", "Choose one of the supported production-pack section presets.");
  }
  const requested = selectedSections === undefined ? PRODUCTION_PACK_PRESETS[preset] : selectedSections;
  if (!Array.isArray(requested)) fail("invalid-section", "Selected production-pack sections must be a list.");
  const selected = new Set<ProductionPackSection>();
  for (const section of requested) {
    if (!(PRODUCTION_PACK_SECTIONS as readonly string[]).includes(section)) {
      fail("invalid-section", `Unsupported production-pack section: ${String(section)}.`);
    }
    if (selected.has(section)) fail("invalid-section", `The ${section} section was selected more than once.`);
    selected.add(section);
  }
  for (const section of REQUIRED_SECTIONS) selected.add(section);
  return PRODUCTION_PACK_SECTIONS.filter((section) => selected.has(section));
}

type CurrentStyleRevisionRecord = StyleRevisionRecord & { readonly payload: CurrentStyleRevisionPayload };

function plainRevision(value: unknown, crypto?: Crypto): Promise<CurrentStyleRevisionRecord> {
  const parsed = parseStyleRevisionRecord(value);
  if (!parsed) fail("invalid-revision", "The saved style revision is invalid or has no supported tech-pack snapshot.");
  return verifyStyleRevision(parsed, crypto).then((verified) => {
    if (!verified) fail("invalid-revision", "The saved style revision digest does not verify; save or restore a valid revision before export.");
    if (parsed.payload.payloadVersion !== 2) {
      fail("invalid-revision", "This historical style revision has no immutable tech-pack snapshot; create a current saved revision before export.");
    }
    return parsed as CurrentStyleRevisionRecord;
  });
}

async function validatedExportInputs(input: CreateProductionPackInput): Promise<{
  readonly record: TechPackRecord;
  readonly revision: StyleRevisionRecord;
  readonly sections: ProductionPackSection[];
}> {
  const revision = await plainRevision(input.revision, input.crypto);
  if (!input.currentHeadRevisionId || input.currentHeadRevisionId !== revision.revisionId) {
    fail("head-mismatch", "The selected tech-pack revision is not the current saved head. Reload the style and export its current revision.");
  }
  const parsedRecord = parseTechPackRecord(input.record);
  if (!parsedRecord.ok) fail("invalid-record", `The saved tech-pack record is invalid: ${parsedRecord.error}`);
  const record = parsedRecord.value;
  const revisionRecord = revision.payload.techPack;
  if (record.styleId !== revision.styleId || record.recipeId !== revisionRecord.recipeId
    || record.recipeVersion !== revisionRecord.recipeVersion || record.revisionId !== revision.revisionId
    || record.revisionNumber !== revision.revisionNumber
    || canonicalizeJcs(techPackRevisionContent(record)) !== canonicalizeJcs(techPackRevisionContent(revisionRecord))) {
    fail("invalid-record", "The editable tech-pack record does not match this committed style revision. Save or reconcile the current record, then export again.");
  }
  return { record, revision, sections: orderedSections(input.preset, input.selectedSections) };
}

function normalizeLabel(value: string | null, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > MAX_NAME_LENGTH || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    fail("invalid-attachment", `${label} must be valid plain text up to ${MAX_NAME_LENGTH} characters.`);
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function safeFileName(name: string): string {
  if (/[\\/\u0000-\u001f\u007f]/.test(name)) {
    fail("invalid-attachment", "An artwork attachment name is empty, unsafe, or too long.");
  }
  const normalized = name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-");
  const trimmed = normalized.replace(/^\.+/, "").replace(/^-+/, "").slice(0, 180);
  return trimmed.length ? trimmed : "artwork";
}

function allowedArtworkMediaType(value: string): boolean {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp" || value === "image/svg+xml";
}

async function prepareAttachments(
  input: readonly ProductionPackAttachmentInput[],
  revision: StyleRevisionRecord,
  selectedSections: readonly ProductionPackSection[],
  crypto?: Crypto,
): Promise<{ readonly descriptors: ProductionPackArtifactDescriptor[]; readonly bytesByPath: ReadonlyMap<string, Uint8Array> }> {
  if (!Array.isArray(input)) fail("invalid-attachment", "Artwork attachments must be a list of local files.");
  if (input.length > PRODUCTION_PACK_MAX_ATTACHMENTS) {
    fail("limit-exceeded", `A production pack can include at most ${PRODUCTION_PACK_MAX_ATTACHMENTS} artwork attachments.`);
  }
  const artworkSelected = selectedSections.includes("artwork");
  if (!artworkSelected && input.length > 0) {
    fail("invalid-attachment", "Remove artwork attachments when the artwork section is not selected.");
  }
  if (input.some((attachment) => !isObject(attachment))) {
    fail("invalid-attachment", "Each artwork attachment must include its saved asset identity and local bytes.");
  }
  const referenced = revision.payload.artwork;
  if (artworkSelected && input.length !== referenced.length) {
    fail("invalid-attachment", "The selected artwork section requires the exact local artwork files referenced by this saved revision.");
  }
  const byId = new Map(input.map((attachment) => [attachment.assetId, attachment]));
  if (byId.size !== input.length) fail("invalid-attachment", "An artwork attachment is listed more than once.");
  const descriptors: ProductionPackArtifactDescriptor[] = [];
  const bytesByPath = new Map<string, Uint8Array>();
  let attachmentBytes = 0;
  for (const reference of referenced) {
    const attachment = byId.get(reference.assetId);
    if (!artworkSelected) continue;
    if (!attachment) fail("invalid-attachment", `Local artwork ${reference.assetId} is missing; re-add it in the artwork flow before export.`);
    if (!allowedArtworkMediaType(attachment.mediaType) || attachment.mediaType !== reference.mimeType
      || typeof attachment.bytes !== "object" || !(attachment.bytes instanceof Uint8Array)
      || attachment.bytes.byteLength !== reference.byteLength || !attachment.name) {
      fail("invalid-attachment", `Local artwork ${reference.assetId} does not match the saved revision. Re-add or reconcile this asset before export.`);
    }
    attachmentBytes += attachment.bytes.byteLength;
    if (attachmentBytes > PRODUCTION_PACK_EXPANDED_LIMIT) {
      fail("limit-exceeded", "The local artwork exceeds the 256 MiB expanded production-pack limit.");
    }
    const sha256 = await sha256Hex(attachment.bytes, crypto);
    if (sha256 !== reference.sha256) {
      fail("invalid-attachment", `Local artwork ${reference.assetId} changed since this revision was saved; re-add it before export.`);
    }
    const displayName = normalizeLabel(attachment.name, "Artwork display name");
    if (!displayName) fail("invalid-attachment", "Artwork needs a readable local display name.");
    const path = `attachments/${attachment.assetId}-${safeFileName(displayName)}`;
    const descriptor: ProductionPackArtifactDescriptor = {
      path,
      role: "artwork",
      mediaType: attachment.mediaType,
      byteLength: attachment.bytes.byteLength,
      sha256,
      assetId: attachment.assetId,
      displayName,
      sourceLabel: normalizeLabel(attachment.sourceLabel, "Artwork source label"),
      attribution: normalizeLabel(attachment.attribution, "Artwork attribution"),
    };
    descriptors.push(descriptor);
    bytesByPath.set(path, attachment.bytes.slice());
  }
  descriptors.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return { descriptors, bytesByPath };
}

function quoted(value: unknown): string {
  if (value === null || value === undefined) return "not recorded";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function isFieldValue(value: Record<string, unknown>): value is Record<string, unknown> & { readonly fieldId: string } {
  return typeof value.fieldId === "string" && Object.prototype.hasOwnProperty.call(value, "provenance");
}

function appendDataLines(lines: string[], path: string, value: unknown): void {
  if (value === null || value === undefined || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    lines.push(`${path}: ${quoted(value)}`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) lines.push(`${path}: no entries recorded`);
    else value.forEach((entry, index) => appendDataLines(lines, `${path}[${index + 1}]`, entry));
    return;
  }
  const object = value as Record<string, unknown>;
  if (isFieldValue(object)) {
    const fieldName = ` [${String(object.fieldId)}]`;
    const unit = typeof object.unit === "string" ? ` ${object.unit}` : "";
    lines.push(`${path}${fieldName}: ${quoted(object.value)}${unit}`);
    for (const key of ["provenance", "evidenceStatus", "validationStatus", "sourceRef", "method", "capturedBy", "capturedAt", "unresolvedReason", "nextAction"]) {
      const item = object[key];
      if (item !== null && item !== undefined && item !== "") lines.push(`  ${key}: ${quoted(item)}`);
    }
    for (const key of ["inputRefs", "evidenceRefs", "inheritedFrom"]) {
      const item = object[key];
      if (item !== null && item !== undefined && (!Array.isArray(item) || item.length > 0)) {
        lines.push(`  ${key}: ${quoted(item)}`);
      }
    }
    return;
  }
  const keys = Object.keys(object).sort();
  for (const key of keys) appendDataLines(lines, `${path}.${key}`, object[key]);
}

function attentionLines(value: unknown, path: string, lines: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => attentionLines(entry, `${path}[${index + 1}]`, lines));
    return;
  }
  if (!isObject(value)) return;
  if (Object.prototype.hasOwnProperty.call(value, "approval") && path === "record") {
    const { approval: _approval, ...content } = value;
    attentionLines(content, path, lines);
    return;
  }
  if (isFieldValue(value)) {
    const statuses = [value.provenance, value.evidenceStatus, value.validationStatus].filter((item) => typeof item === "string");
    const unresolved = value.unresolvedReason ?? value.nextAction;
    if (statuses.some((status) => status === "UNRESOLVED" || status === "CONFLICT" || status === "INVALID") || unresolved) {
      lines.push(`${path} [${String(value.fieldId)}]: value=${quoted(value.value)}; ${statuses.join(" / ")}`);
      if (value.sourceRef !== null && value.sourceRef !== undefined) lines.push(`  source: ${quoted(value.sourceRef)}`);
      if (value.unresolvedReason) lines.push(`  reason: ${quoted(value.unresolvedReason)}`);
      if (value.nextAction) lines.push(`  next action: ${quoted(value.nextAction)}`);
    }
    return;
  }
  const statuses = [value.state, value.status, value.provenance, value.evidenceStatus, value.validationStatus];
  const hasAttention = statuses.some((status) => status === "UNRESOLVED" || status === "CONFLICT" || status === "INVALID" || status === "UNKNOWN");
  if (hasAttention) {
    lines.push(`${path}: ${statuses.filter((status) => typeof status === "string").join(" / ")}`);
  }
  for (const key of Object.keys(value).sort()) attentionLines(value[key], `${path}.${key}`, lines);
}

function wrapLine(line: string, maximum: number): string[] {
  const words = line.split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maximum) {
      if (current) wrapped.push(current);
      current = "";
      for (let offset = 0; offset < word.length; offset += maximum) wrapped.push(word.slice(offset, offset + maximum));
    } else if (!current) current = word;
    else if (current.length + 1 + word.length <= maximum) current += ` ${word}`;
    else {
      wrapped.push(current);
      current = word;
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

function pdfLiteral(value: string): string {
  let output = "";
  for (const character of value) {
    if (character === "\\" || character === "(" || character === ")") output += `\\${character}`;
    else if (character === "–" || character === "—") output += "-";
    else if (character === "×") output += "x";
    else {
      const code = character.charCodeAt(0);
      output += code < 32 || code > 126 ? "?" : character;
    }
  }
  return output;
}

function pdfText(xCm: number, yFromTopCm: number, fontSize: number, value: string): string {
  return `BT /F1 ${fontSize} Tf ${pt(xCm)} ${pt(PAGE_A4.height - yFromTopCm)} Td (${pdfLiteral(value)}) Tj ET`;
}

function sectionLines(
  section: ProductionPackSection,
  record: TechPackRecord,
  revision: StyleRevisionRecord,
  preset: ProductionPackPreset,
  selected: readonly ProductionPackSection[],
  attachments: readonly ProductionPackArtifactDescriptor[],
): string[] {
  const lines: string[] = [];
  if (section === "identity") {
    lines.push(`Style ID: ${record.styleId}`);
    lines.push(`Style code: ${quoted(record.cover.styleCode.value)}`);
    lines.push(`Style name: ${quoted(record.cover.styleName.value)}`);
    lines.push(`Recipe: ${record.recipeId} (${record.recipeVersion})`);
    lines.push(`Saved revision: r${revision.revisionNumber} (${revision.revisionId})`);
    lines.push(`Revision content SHA-256: ${revision.revisionContentDigest}`);
    lines.push(`Selected preset: ${preset}`);
    const omitted = PRODUCTION_PACK_SECTIONS.filter((entry) => !selected.includes(entry));
    lines.push(`Sections omitted: ${omitted.length ? omitted.join(", ") : "none"}`);
    appendDataLines(lines, "cover", record.cover);
  } else if (section === "materials-bom") {
    appendDataLines(lines, "materials", record.materials);
    appendDataLines(lines, "BOM rows", record.bomRows);
    appendDataLines(lines, "colorways", record.colorways);
  } else if (section === "measurements-qa") {
    if (record.pomData === undefined) lines.push("No T02 measurement or sample-QA record is present.");
    else appendDataLines(lines, "measurements and QA", record.pomData);
  } else if (section === "construction") {
    if (record.operationData === undefined) lines.push("No T03 construction operation record is present.");
    else appendDataLines(lines, "construction operations", record.operationData);
  } else if (section === "artwork") {
    const surface = revision.payload.design.surface;
    appendDataLines(lines, "saved local artwork placements", Object.keys(surface).length ? surface : null);
    if (attachments.length === 0) lines.push("No local artwork attachment bytes are included.");
    for (const attachment of attachments) {
      lines.push(`Attachment: ${attachment.displayName} (${attachment.path}; ${attachment.mediaType}; ${attachment.byteLength} bytes)`);
      lines.push(`  source label: ${quoted(attachment.sourceLabel)}`);
      lines.push(`  attribution: ${quoted(attachment.attribution)}`);
      lines.push(`  SHA-256: ${attachment.sha256}`);
    }
  } else if (section === "sources-open-items") {
    attentionLines(record, "record", lines);
    if (record.revisionId !== null && revision.payload.artwork.length > 0 && !selected.includes("artwork")) {
      lines.push(`Artwork is not selected for this PDF; ${revision.payload.artwork.length} saved local artwork reference(s) remain in the revision.`);
    }
    if (lines.length === 0) lines.push("No explicit unresolved or conflicting field state is recorded in this snapshot.");
    lines.push("The structured JSON retains the complete record, provenance, conflicts, unknowns and unresolved next actions.");
  } else {
    lines.push(`Review state: ${record.approval.state}`);
    lines.push(`Approval revision: ${quoted(record.approval.revisionId)}`);
    lines.push(`Approval scope field IDs: ${record.approval.scopeFieldIds.length ? record.approval.scopeFieldIds.join(", ") : "none"}`);
    lines.push(`Review actor: ${quoted(record.approval.changedBy)}`);
    lines.push(`Review recorded at: ${quoted(record.approval.changedAt)}`);
    lines.push("Local digital review only. This file does not establish supplier acceptance, physical fit, factory acceptance, compliance or production release.");
  }
  return lines;
}

function productionPdf(
  record: TechPackRecord,
  revision: StyleRevisionRecord,
  preset: ProductionPackPreset,
  selected: readonly ProductionPackSection[],
  attachments: readonly ProductionPackArtifactDescriptor[],
): Uint8Array {
  const streams: string[] = [];
  for (const section of selected) {
    const dataLines = sectionLines(section, record, revision, preset, selected, attachments)
      .flatMap((line) => wrapLine(line, PDF_BODY_CHARACTERS));
    const pageCount = Math.max(1, Math.ceil(dataLines.length / MAX_PDF_LINES_PER_PAGE));
    for (let page = 0; page < pageCount; page += 1) {
      const pageLines = dataLines.slice(page * MAX_PDF_LINES_PER_PAGE, (page + 1) * MAX_PDF_LINES_PER_PAGE);
      const pageLabel = `${SECTION_LABELS[section]} (${page + 1}/${pageCount})`;
      const operators = [
        pdfText(1.5, 1.45, 14, "InfiniDrip production pack"),
        pdfText(1.5, 2.1, 9, `Style ${record.styleId}  |  Recipe ${record.recipeId}  |  Revision r${revision.revisionNumber}`),
        pdfText(1.5, 2.75, 11, pageLabel),
        ...pageLines.map((line, index) => pdfText(1.5, 3.4 + index * 0.5, 8, line)),
        pdfText(1.5, 28.6, 7, "Local digital review only; no supplier or production acceptance is established."),
      ];
      streams.push(operators.join("\n"));
    }
  }
  return encoder.encode(assemblePdf(streams, PAGE_A4));
}

function sumBytes(values: readonly Uint8Array[]): number {
  return values.reduce((total, value) => total + value.byteLength, 0);
}

function safeArchivePath(path: string): boolean {
  if (path.length === 0 || path.length > 512 || path.startsWith("/") || path.includes("\\")
    || path.includes("\u0000") || /^[A-Za-z]:/.test(path)) return false;
  const parts = path.split("/");
  return parts.every((part) => part.length > 0 && part !== "." && part !== ".."
    && !/[\u0000-\u001f\u007f]/.test(part));
}

function concatenateChunks(chunks: readonly Uint8Array[], byteLength: number): Uint8Array {
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function archiveEntryAllowed(path: string): boolean {
  return path === "manifest.json" || path === "records/tech-pack.json"
    || path === "documents/production-pack.pdf" || SAFE_ATTACHMENT_PATH.test(path);
}

function validateArchiveDirectory(archiveBytes: Uint8Array, entries: ReadonlyMap<string, Uint8Array>): void {
  const view = new DataView(archiveBytes.buffer, archiveBytes.byteOffset, archiveBytes.byteLength);
  const minimumOffset = Math.max(0, archiveBytes.byteLength - 22 - 65_535);
  let endOffset = -1;
  for (let offset = archiveBytes.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) fail("invalid-package", "The ZIP end record is missing or truncated.");
  const commentLength = view.getUint16(endOffset + 20, true);
  const disk = view.getUint16(endOffset + 4, true);
  const directoryDisk = view.getUint16(endOffset + 6, true);
  const entriesOnDisk = view.getUint16(endOffset + 8, true);
  const totalEntries = view.getUint16(endOffset + 10, true);
  const directorySize = view.getUint32(endOffset + 12, true);
  const directoryOffset = view.getUint32(endOffset + 16, true);
  if (endOffset + 22 + commentLength !== archiveBytes.byteLength || disk !== 0 || directoryDisk !== 0
    || entriesOnDisk !== totalEntries || totalEntries !== entries.size
    || directoryOffset + directorySize !== endOffset) {
    fail("invalid-package", "The ZIP end record or central directory is incomplete or inconsistent with its files.");
  }
  const centralNames = new Set<string>();
  let offset = directoryOffset;
  while (offset < endOffset) {
    if (offset + 46 > endOffset || view.getUint32(offset, true) !== 0x02014b50) {
      fail("invalid-package", "The ZIP central directory contains an invalid or truncated entry.");
    }
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const nextOffset = offset + 46 + nameLength + extraLength + entryCommentLength;
    if (nextOffset > endOffset) fail("invalid-package", "The ZIP central directory contains a truncated entry name or field.");
    let name: string;
    try {
      name = fatalUtf8.decode(archiveBytes.subarray(offset + 46, offset + 46 + nameLength));
    } catch {
      fail("invalid-package", "The ZIP central directory contains a non-UTF-8 path.");
    }
    if (!safeArchivePath(name) || !archiveEntryAllowed(name) || centralNames.has(name)) {
      fail("invalid-package", `The ZIP central directory contains an unsafe, duplicate or unexpected path: ${name}.`);
    }
    const extracted = entries.get(name);
    if (!extracted || view.getUint32(offset + 24, true) !== extracted.byteLength) {
      fail("invalid-package", `The ZIP central directory does not match extracted entry ${name}.`);
    }
    centralNames.add(name);
    offset = nextOffset;
  }
}

function extractArchive(archiveBytes: Uint8Array): ExtractedArchive {
  if (!(archiveBytes instanceof Uint8Array) || archiveBytes.byteLength === 0) {
    fail("invalid-package", "Choose a non-empty .techpack.zip file.");
  }
  if (archiveBytes.byteLength > PRODUCTION_PACK_ARCHIVE_LIMIT) {
    fail("limit-exceeded", "The .techpack.zip file exceeds the 256 MiB compressed archive limit.");
  }
  const entries = new Map<string, Uint8Array>();
  const chunksByPath = new Map<string, Uint8Array[]>();
  let expandedBytes = 0;
  let declaredExpandedBytes = 0;
  let extractionError: unknown;
  const unzip = new Unzip((file) => {
    if (extractionError) return;
    try {
      if (!safeArchivePath(file.name) || !archiveEntryAllowed(file.name)) {
        fail("invalid-package", `The ZIP contains an unsafe or unexpected path: ${file.name}.`);
      }
      if (entries.has(file.name) || chunksByPath.has(file.name)) {
        fail("invalid-package", `The ZIP contains a duplicate entry: ${file.name}.`);
      }
      if (entries.size + chunksByPath.size >= PRODUCTION_PACK_MAX_ENTRIES) {
        fail("limit-exceeded", `The ZIP contains more than ${PRODUCTION_PACK_MAX_ENTRIES} entries.`);
      }
      if (file.compression !== 0 && file.compression !== 8) {
        fail("invalid-package", `The ZIP entry ${file.name} uses unsupported compression.`);
      }
      // fflate's ZIP32 reader exposes unsigned 32-bit sizes or undefined; the
      // policy caps below reject every value outside the supported bounds.
      if (file.size !== undefined && file.size > PRODUCTION_PACK_ARCHIVE_LIMIT) {
        fail("limit-exceeded", `The ZIP entry ${file.name} exceeds the compressed archive limit.`);
      }
      if (file.originalSize !== undefined) {
        if (file.name !== "manifest.json" && file.name !== "records/tech-pack.json"
          && file.originalSize > PRODUCTION_PACK_EXPANDED_LIMIT) {
          fail("limit-exceeded", `The ZIP entry ${file.name} exceeds the expanded archive limit.`);
        }
        if ((file.name === "manifest.json" || file.name === "records/tech-pack.json")
          && file.originalSize > PRODUCTION_PACK_JSON_LIMIT) {
          fail("limit-exceeded", `The ZIP entry ${file.name} exceeds the 32 MiB JSON limit.`);
        }
        declaredExpandedBytes += file.originalSize;
        if (declaredExpandedBytes > PRODUCTION_PACK_EXPANDED_LIMIT) {
          fail("limit-exceeded", "The ZIP's declared expanded contents exceed the 256 MiB limit.");
        }
      }
      const chunks: Uint8Array[] = [];
      let fileBytes = 0;
      chunksByPath.set(file.name, chunks);
      file.ondata = (error, data, final) => {
        if (error) {
          extractionError = error;
          return;
        }
        fileBytes += data.byteLength;
        expandedBytes += data.byteLength;
        if (expandedBytes > PRODUCTION_PACK_EXPANDED_LIMIT) {
          extractionError = new ProductionPackError("limit-exceeded", "The ZIP's extracted contents exceed the 256 MiB limit.");
          return;
        }
        if ((file.name === "manifest.json" || file.name === "records/tech-pack.json")
          && fileBytes > PRODUCTION_PACK_JSON_LIMIT) {
          extractionError = new ProductionPackError("limit-exceeded", `The ZIP entry ${file.name} exceeds the 32 MiB JSON limit.`);
          return;
        }
        if (data.byteLength) chunks.push(data.slice());
        if (final) {
          if (file.originalSize !== undefined && fileBytes !== file.originalSize) {
            extractionError = new ProductionPackError("invalid-package", `The ZIP entry ${file.name} is truncated or has a mismatched expanded size.`);
            return;
          }
          entries.set(file.name, concatenateChunks(chunks, fileBytes));
          chunksByPath.delete(file.name);
        }
      };
      try {
        file.start();
      } catch (error) {
        extractionError = new ProductionPackError("invalid-package", `Could not decompress ZIP entry ${file.name}: ${error instanceof Error ? error.message : "invalid compressed data"}`);
      }
    } catch (error) {
      extractionError = error;
    }
  });
  unzip.register(UnzipPassThrough);
  unzip.register(UnzipInflate);
  try {
    unzip.push(archiveBytes, true);
  } catch (error) {
    if (!extractionError) extractionError = error;
  }
  if (extractionError) {
    if (extractionError instanceof ProductionPackError) throw extractionError;
    fail("invalid-package", `Could not read the .techpack.zip file: ${extractionError instanceof Error ? extractionError.message : "invalid ZIP data"}`);
  }
  if (chunksByPath.size > 0) fail("invalid-package", "The .techpack.zip file ended before all entries were complete.");
  validateArchiveDirectory(archiveBytes, entries);
  return { entries, expandedBytes };
}

function readUtf8Json(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(fatalUtf8.decode(bytes)) as unknown;
  } catch {
    fail("invalid-package", `${label} is not valid UTF-8 JSON.`);
  }
}

function validLabel(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.length <= MAX_NAME_LENGTH
    && value.trim() === value && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value));
}

function parseManifest(value: unknown): ProductionPackManifest {
  const keys = [
    "format", "packageVersion", "exporterVersion", "styleId", "recipeId", "recipeVersion",
    "revisionId", "revisionNumber", "revisionContentDigest", "recordSchemaVersion", "preset",
    "selectedSections", "recordPath", "artifacts",
  ];
  if (!exactKeys(value, keys) || value.format !== PRODUCTION_PACK_FORMAT
    || value.packageVersion !== PRODUCTION_PACK_VERSION || value.exporterVersion !== PRODUCTION_PACK_EXPORTER_VERSION
    || typeof value.styleId !== "string" || !value.styleId || typeof value.recipeId !== "string" || !value.recipeId
    || typeof value.recipeVersion !== "string" || !value.recipeVersion || typeof value.revisionId !== "string" || !value.revisionId
    || !Number.isSafeInteger(value.revisionNumber) || (value.revisionNumber as number) < 1
    || typeof value.revisionContentDigest !== "string" || !SHA256.test(value.revisionContentDigest)
    || ![1, 2, 3].includes(value.recordSchemaVersion as number)
    || typeof value.preset !== "string" || !Object.prototype.hasOwnProperty.call(PRODUCTION_PACK_PRESETS, value.preset)
    || !Array.isArray(value.selectedSections) || value.recordPath !== "records/tech-pack.json"
    || !Array.isArray(value.artifacts) || value.artifacts.length < 1 || value.artifacts.length > PRODUCTION_PACK_MAX_ATTACHMENTS + 1) {
    fail("invalid-package", "The ZIP manifest has an unsupported or incomplete production-pack schema.");
  }
  const selectedSections = value.selectedSections as unknown[];
  const selectedSet = new Set<string>();
  for (const section of selectedSections) {
    if (typeof section !== "string" || !(PRODUCTION_PACK_SECTIONS as readonly string[]).includes(section) || selectedSet.has(section)) {
      fail("invalid-package", "The ZIP manifest contains an unknown or repeated section ID.");
    }
    selectedSet.add(section);
  }
  if ([...REQUIRED_SECTIONS].some((section) => !selectedSet.has(section))) {
    fail("invalid-package", "The ZIP manifest omits an always-required section.");
  }
  const ordered = PRODUCTION_PACK_SECTIONS.filter((section) => selectedSet.has(section));
  if (ordered.some((section, index) => selectedSections[index] !== section)) {
    fail("invalid-package", "The ZIP manifest sections are not in the supported display order.");
  }
  const artifacts: ProductionPackArtifactDescriptor[] = [];
  const paths = new Set<string>();
  const assetIds = new Set<string>();
  let priorPath = "";
  for (let index = 0; index < value.artifacts.length; index += 1) {
    const artifact = value.artifacts[index];
    const artifactKeys = ["path", "role", "mediaType", "byteLength", "sha256", "assetId", "displayName", "sourceLabel", "attribution"];
    if (!exactKeys(artifact, artifactKeys) || typeof artifact.path !== "string" || !safeArchivePath(artifact.path)
      || typeof artifact.role !== "string" || typeof artifact.mediaType !== "string"
      || !Number.isSafeInteger(artifact.byteLength) || (artifact.byteLength as number) <= 0
      || typeof artifact.sha256 !== "string" || !SHA256.test(artifact.sha256)
      || typeof artifact.displayName !== "string" || !artifact.displayName || artifact.displayName.length > MAX_NAME_LENGTH
      || !validLabel(artifact.sourceLabel) || !validLabel(artifact.attribution)
      || paths.has(artifact.path) || (index > 1 && artifact.path <= priorPath)) {
      fail("invalid-package", "The ZIP manifest contains an invalid, repeated or unordered artifact descriptor.");
    }
    paths.add(artifact.path);
    priorPath = artifact.path;
    if (index === 0) {
      if (artifact.path !== "documents/production-pack.pdf" || artifact.role !== "production-pdf"
        || artifact.mediaType !== "application/pdf" || artifact.assetId !== null
        || artifact.displayName !== "production-pack.pdf" || artifact.sourceLabel !== null || artifact.attribution !== null) {
        fail("invalid-package", "The manifest's first artifact must describe the production PDF.");
      }
    } else {
      if (artifact.role !== "artwork" || artifact.assetId === null || typeof artifact.assetId !== "string"
        || !SAFE_ASSET_ID.test(artifact.assetId) || assetIds.has(artifact.assetId)
        || !allowedArtworkMediaType(artifact.mediaType)
        || artifact.path !== `attachments/${artifact.assetId}-${safeFileName(artifact.displayName)}`
        || !SAFE_ATTACHMENT_PATH.test(artifact.path)) {
        fail("invalid-package", "The manifest contains an unsafe or inconsistent artwork attachment descriptor.");
      }
      assetIds.add(artifact.assetId);
    }
    artifacts.push(artifact as unknown as ProductionPackArtifactDescriptor);
  }
  if (!selectedSet.has("artwork") && artifacts.length > 1) {
    fail("invalid-package", "The ZIP includes artwork attachments when the artwork section was not selected.");
  }
  return value as unknown as ProductionPackManifest;
}

function assertExpectedEntries(entries: ReadonlyMap<string, Uint8Array>, manifest: ProductionPackManifest): void {
  const expected = new Set(["manifest.json", "records/tech-pack.json", "documents/production-pack.pdf"]);
  for (const artifact of manifest.artifacts.slice(1)) expected.add(artifact.path);
  if (entries.size !== expected.size || [...expected].some((path) => !entries.has(path))) {
    fail("invalid-package", "The ZIP entries do not exactly match the manifest; remove unexpected files or re-export the package.");
  }
  for (const artifact of manifest.artifacts) {
    const bytes = entries.get(artifact.path);
    if (!bytes || bytes.byteLength !== artifact.byteLength) {
      fail("invalid-package", `The artifact ${artifact.path} is missing or has a mismatched byte length.`);
    }
  }
}

async function resolveHistoryRevision(
  revisionHistory: readonly StyleRevisionRecord[],
  revisionId: string,
  crypto?: Crypto,
): Promise<StyleRevisionRecord> {
  if (!Array.isArray(revisionHistory)) fail("invalid-revision", "Local revision history is unavailable; reload this style before importing.");
  const candidates = revisionHistory.filter((revision) => isObject(revision) && revision.revisionId === revisionId);
  if (candidates.length !== 1) fail("invalid-revision", "The production pack's base or current head is missing or ambiguous in local verified history.");
  const revision = await plainRevision(candidates[0], crypto);
  return revision;
}

const MISSING = Symbol("missing");

export function computeProductionPackFieldDiff(before: unknown, after: unknown): ProductionPackFieldDiff[] {
  const diff: ProductionPackFieldDiff[] = [];
  const visit = (left: unknown | typeof MISSING, right: unknown | typeof MISSING, path: string): void => {
    if (left === MISSING) {
      diff.push({ path, change: "added", before: null, after: right });
      return;
    }
    if (right === MISSING) {
      diff.push({ path, change: "removed", before: left, after: null });
      return;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      const length = Math.max(left.length, right.length);
      for (let index = 0; index < length; index += 1) {
        visit(index < left.length ? left[index] : MISSING, index < right.length ? right[index] : MISSING, `${path}[${index}]`);
      }
      return;
    }
    if (isObject(left) && isObject(right)) {
      const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
      for (const key of keys) {
        visit(Object.prototype.hasOwnProperty.call(left, key) ? left[key] : MISSING,
          Object.prototype.hasOwnProperty.call(right, key) ? right[key] : MISSING,
          path ? `${path}.${key}` : key);
      }
      return;
    }
    if (canonicalizeJcs(left) !== canonicalizeJcs(right)) {
      diff.push({ path: path || "$", change: "changed", before: left, after: right });
    }
  };
  visit(before, after, "");
  return diff;
}

function normalizeFindings(value: unknown): ProductionPackSemanticFinding[] {
  if (!Array.isArray(value)) fail("invalid-package", "The semantic validator returned an invalid result; no import candidate can be applied.");
  const findings: ProductionPackSemanticFinding[] = [];
  for (const finding of value) {
    if (!exactKeys(finding, ["status", "path", "message"])
      || !["INVALID", "CONFLICT", "UNRESOLVED"].includes(finding.status as string)
      || typeof finding.path !== "string" || !finding.path || typeof finding.message !== "string" || !finding.message) {
      fail("invalid-package", "The semantic validator returned an invalid finding; no import candidate can be applied.");
    }
    findings.push(finding as unknown as ProductionPackSemanticFinding);
  }
  return findings;
}

/**
 * Validates an exchange ZIP against local immutable history and returns a
 * review-only field diff. This function never saves records or artwork.
 */
export async function previewProductionPackImport(
  input: PreviewProductionPackImportInput,
): Promise<ProductionPackImportPreview> {
  if (typeof input.fileName !== "string" || !input.fileName.toLowerCase().endsWith(".techpack.zip")) {
    fail("invalid-package", "Import accepts only a .techpack.zip exchange package; the standalone PDF cannot be imported.");
  }
  const extracted = extractArchive(input.archiveBytes);
  const manifestBytes = extracted.entries.get("manifest.json");
  const recordBytes = extracted.entries.get("records/tech-pack.json");
  if (!manifestBytes || !recordBytes) fail("invalid-package", "The ZIP is missing its manifest or editable tech-pack record.");
  const manifestUnknown = readUtf8Json(manifestBytes, "The production-pack manifest");
  const manifest = parseManifest(manifestUnknown);
  if (canonicalizeJcs(manifest) !== fatalUtf8.decode(manifestBytes)) {
    fail("invalid-package", "The production-pack manifest is not canonical JSON; re-export the package before import.");
  }
  assertExpectedEntries(extracted.entries, manifest);
  const parsedRecord = parseTechPackRecord(readUtf8Json(recordBytes, "The editable tech-pack record"));
  if (!parsedRecord.ok) fail("invalid-record", `The editable tech-pack record is invalid: ${parsedRecord.error}`);
  const imported = parsedRecord.value;
  if (imported.styleId !== manifest.styleId || imported.recipeId !== manifest.recipeId
    || imported.recipeVersion !== manifest.recipeVersion || imported.revisionId !== manifest.revisionId
    || imported.revisionNumber !== manifest.revisionNumber || imported.schemaVersion !== manifest.recordSchemaVersion) {
    fail("invalid-record", "The editable record's style, recipe, schema or base revision identity differs from the manifest.");
  }
  for (const artifact of manifest.artifacts) {
    const bytes = extracted.entries.get(artifact.path)!;
    if (await sha256Hex(bytes, input.crypto) !== artifact.sha256) {
      fail("invalid-package", `The immutable artifact ${artifact.path} failed its SHA-256 check; restore the original file or re-export.`);
    }
  }
  const baseRevision = await resolveHistoryRevision(input.revisionHistory, manifest.revisionId, input.crypto);
  if (baseRevision.styleId !== manifest.styleId || baseRevision.revisionNumber !== manifest.revisionNumber
    || baseRevision.revisionContentDigest !== manifest.revisionContentDigest
    || baseRevision.payload.payloadVersion !== 2) {
    fail("invalid-revision", "The production pack's base revision does not match this style's verified local history.");
  }
  const baseRecord = baseRevision.payload.techPack;
  if (baseRecord.recipeId !== manifest.recipeId || baseRecord.recipeVersion !== manifest.recipeVersion
    || baseRecord.schemaVersion !== manifest.recordSchemaVersion || imported.createdAt !== baseRecord.createdAt) {
    fail("invalid-record", "The editable record changed immutable recipe or creation identity; restore those fields before import.");
  }
  const artwork = manifest.artifacts.slice(1);
  const artworkSelected = manifest.selectedSections.includes("artwork");
  if ((artworkSelected && artwork.length !== baseRevision.payload.artwork.length)
    || (!artworkSelected && artwork.length !== 0)) {
    fail("invalid-package", "The artwork descriptors do not match the base revision's local artwork references.");
  }
  for (let index = 0; index < artwork.length; index += 1) {
    const artifact = artwork[index];
    const reference = baseRevision.payload.artwork.find((item) => item.assetId === artifact.assetId);
    if (!reference || artifact.mediaType !== reference.mimeType || artifact.byteLength !== reference.byteLength
      || artifact.sha256 !== reference.sha256) {
      fail("invalid-package", `Artwork ${artifact.assetId} differs from the base revision; re-export from the local artwork store.`);
    }
  }
  const currentHead = await resolveHistoryRevision(input.revisionHistory, input.currentHeadRevisionId, input.crypto);
  if (currentHead.styleId !== manifest.styleId) fail("invalid-revision", "The current local style head belongs to a different style.");
  const diff = computeProductionPackFieldDiff(techPackRevisionContent(baseRecord), techPackRevisionContent(imported));
  const stale = currentHead.revisionId !== baseRevision.revisionId;
  if (stale) {
    return { status: "stale", baseRevision, currentHead, diff, candidateRecord: null, canApply: false, findings: [], attachments: artwork };
  }
  if (diff.length === 0) {
    return { status: "unchanged", baseRevision, currentHead, diff, candidateRecord: null, canApply: false, findings: [], attachments: artwork };
  }
  if (typeof input.validateCandidate !== "function") {
    const findings: ProductionPackSemanticFinding[] = [{
      status: "UNRESOLVED",
      path: "validationContext",
      message: "Existing semantic validation was not supplied; this preview is read-only until the caller can validate the candidate.",
    }];
    return { status: "changed", baseRevision, currentHead, diff, candidateRecord: null, canApply: false, findings, attachments: artwork };
  }
  const candidateRecord: TechPackRecord = {
    ...imported,
    approval: {
      state: "DRAFT",
      revisionId: null,
      scopeFieldIds: [],
      changedBy: null,
      changedAt: null,
      manifestId: null,
    },
  };
  let findings: ProductionPackSemanticFinding[];
  try {
    findings = normalizeFindings(input.validateCandidate(candidateRecord));
  } catch (error) {
    if (error instanceof ProductionPackError) throw error;
    fail("invalid-record", `Existing semantic validation could not evaluate this candidate: ${error instanceof Error ? error.message : "validator failed"}`);
  }
  return {
    status: "changed",
    baseRevision,
    currentHead,
    diff,
    candidateRecord,
    canApply: !findings.some((finding) => finding.status === "INVALID"),
    findings,
    attachments: artwork,
  };
}

export async function createProductionPackOutputs(input: CreateProductionPackInput): Promise<ProductionPackOutputs> {
  const { record, revision, sections } = await validatedExportInputs(input);
  const recordJson = canonicalizeJcs(record);
  const recordBytes = encoder.encode(recordJson);
  if (recordBytes.byteLength > PRODUCTION_PACK_JSON_LIMIT) {
    fail("limit-exceeded", "The editable tech-pack JSON exceeds the 32 MiB record limit.");
  }
  const prepared = await prepareAttachments(input.attachments, revision, sections, input.crypto);
  const pdfBytes = productionPdf(record, revision, input.preset, sections, prepared.descriptors);
  const pdfDescriptor: ProductionPackArtifactDescriptor = {
    path: "documents/production-pack.pdf",
    role: "production-pdf",
    mediaType: "application/pdf",
    byteLength: pdfBytes.byteLength,
    sha256: await sha256Hex(pdfBytes, input.crypto),
    assetId: null,
    displayName: "production-pack.pdf",
    sourceLabel: null,
    attribution: null,
  };
  const artifacts = [pdfDescriptor, ...prepared.descriptors];
  const manifest: ProductionPackManifest = {
    format: PRODUCTION_PACK_FORMAT,
    packageVersion: PRODUCTION_PACK_VERSION,
    exporterVersion: PRODUCTION_PACK_EXPORTER_VERSION,
    styleId: record.styleId,
    recipeId: record.recipeId,
    recipeVersion: record.recipeVersion,
    revisionId: revision.revisionId,
    revisionNumber: revision.revisionNumber,
    revisionContentDigest: revision.revisionContentDigest,
    recordSchemaVersion: record.schemaVersion,
    preset: input.preset,
    selectedSections: sections,
    recordPath: "records/tech-pack.json",
    artifacts,
  };
  const manifestBytes = encoder.encode(canonicalizeJcs(manifest));
  const expandedBytes = sumBytes([
    manifestBytes, recordBytes, pdfBytes, ...[...prepared.bytesByPath.values()],
  ]);
  if (expandedBytes > PRODUCTION_PACK_EXPANDED_LIMIT) {
    fail("limit-exceeded", "The production-pack files exceed the 256 MiB expanded archive limit.");
  }
  const zipEntries: Zippable = {};
  zipEntries["manifest.json"] = [manifestBytes, { mtime: FIXED_ZIP_TIME, level: 6 }];
  zipEntries["records/tech-pack.json"] = [recordBytes, { mtime: FIXED_ZIP_TIME, level: 6 }];
  zipEntries["documents/production-pack.pdf"] = [pdfBytes, { mtime: FIXED_ZIP_TIME, level: 6 }];
  for (const descriptor of prepared.descriptors) {
    zipEntries[descriptor.path] = [prepared.bytesByPath.get(descriptor.path)!, { mtime: FIXED_ZIP_TIME, level: 6 }];
  }
  let archiveBytes: Uint8Array;
  try {
    archiveBytes = zipSync(zipEntries, { mtime: FIXED_ZIP_TIME, level: 6 });
  } catch (error) {
    fail("invalid-package", `Could not create the deterministic tech-pack ZIP: ${error instanceof Error ? error.message : "ZIP writer failed"}`);
  }
  if (archiveBytes.byteLength > PRODUCTION_PACK_ARCHIVE_LIMIT) {
    fail("limit-exceeded", "The production-pack ZIP exceeds the 256 MiB compressed archive limit.");
  }
  const omittedSections = PRODUCTION_PACK_SECTIONS.filter((section) => !sections.includes(section));
  return {
    pdfBytes,
    archiveBytes,
    recordJson,
    manifest,
    presentation: {
      format: PRODUCTION_PACK_FORMAT,
      fileName: "production-pack.pdf",
      mediaType: "application/pdf",
      styleId: record.styleId,
      recipeId: record.recipeId,
      recipeVersion: record.recipeVersion,
      revisionId: revision.revisionId,
      revisionNumber: revision.revisionNumber,
      revisionContentDigest: revision.revisionContentDigest,
      approvalState: record.approval.state,
      approvalRevisionId: record.approval.revisionId,
      approvalScopeFieldIds: record.approval.scopeFieldIds,
      selectedSections: sections,
      omittedSections,
      record,
      disclaimer: "Local digital review only; no supplier or production acceptance is established.",
    },
  };
}
