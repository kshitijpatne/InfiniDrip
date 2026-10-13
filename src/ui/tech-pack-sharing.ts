import {
  FROZEN_TECH_PACK_ARTIFACT_LIMIT,
  jcsSha256Hex,
  sha256Hex,
  type StyleRevisionRecord,
} from "./style-revisions";
import type { TechPackRecord, TechPackScopedApproval } from "./tech-pack-records";

export const TECH_PACK_SHARE_ARTIFACTS = Object.freeze([
  { artifactId: "tech-pack-exchange-zip", extension: "zip", displayName: "production-pack.techpack.zip", mediaType: "application/zip" },
  { artifactId: "tech-pack-production-pdf", extension: "pdf", displayName: "production-pack.pdf", mediaType: "application/pdf" },
] as const);

export const TECH_PACK_SHARE_SECTIONS = Object.freeze([
  "identity", "materials-bom", "measurements-qa", "construction", "artwork", "sources-open-items", "approval-disclaimer",
] as const);

export interface TechPackShareScopeGroup {
  readonly id: string;
  readonly label: string;
  readonly fieldIds: readonly string[];
}

export interface TechPackShareArtifactInput {
  readonly artifactId: typeof TECH_PACK_SHARE_ARTIFACTS[number]["artifactId"];
  readonly extension: typeof TECH_PACK_SHARE_ARTIFACTS[number]["extension"];
  readonly displayName: string;
  readonly mediaType: typeof TECH_PACK_SHARE_ARTIFACTS[number]["mediaType"];
  readonly bytes: Uint8Array;
}

function fieldIds(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const fields: string[] = [];
  for (const entry of Object.values(value)) {
    if (typeof entry === "object" && entry !== null && !Array.isArray(entry)
      && typeof (entry as { readonly fieldId?: unknown }).fieldId === "string") {
      fields.push((entry as { readonly fieldId: string }).fieldId);
    }
  }
  return [...new Set(fields)].sort();
}

function displayValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function techPackShareScopeGroups(record: TechPackRecord): readonly TechPackShareScopeGroup[] {
  const groups: TechPackShareScopeGroup[] = [
    { id: "cover", label: "Style cover", fieldIds: fieldIds(record.cover) },
    ...record.materials.map((material, index) => ({
      id: `material:${material.id}`,
      label: `Material ${index + 1}: ${displayValue(material.name.value, "unnamed")}`,
      fieldIds: fieldIds(material),
    })),
    ...record.bomRows.map((row, index) => ({
      id: `bom:${row.id}`,
      label: `BOM row ${index + 1}: ${displayValue(row.componentRef.value, "unlabeled")}`,
      fieldIds: fieldIds(row),
    })),
    ...record.colorways.map((colorway, index) => ({
      id: `colorway:${colorway.id}`,
      label: `Colorway ${index + 1}: ${displayValue(colorway.name.value, "unnamed")}`,
      fieldIds: [...new Set([...fieldIds(colorway), ...colorway.assignments.flatMap((assignment) => fieldIds(assignment))])].sort(),
    })),
  ];
  return groups.filter((group) => group.fieldIds.length > 0);
}

export function techPackShareFieldIds(record: TechPackRecord): readonly string[] {
  return [...new Set(techPackShareScopeGroups(record).flatMap((group) => group.fieldIds))].sort();
}

function canonicalTime(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value;
}

function actorLabel(value: string): string {
  const actor = value.trim();
  if (!actor || actor.length > 120 || /[\u0000-\u001f\u007f]/.test(actor)) {
    throw new Error("Enter a local self-attested reviewer label of 1 to 120 printable characters.");
  }
  return actor;
}

function selectedScope(record: TechPackRecord, scopeFieldIds: readonly string[]): string[] {
  const available = new Set(techPackShareFieldIds(record));
  const selected = [...new Set(scopeFieldIds)];
  if (selected.length !== scopeFieldIds.length || selected.length === 0 || selected.some((id) => !available.has(id))) {
    throw new Error("Select one or more current Tech Pack fields for this review scope.");
  }
  return selected.sort();
}

function scopedApproval(
  record: TechPackRecord,
  state: TechPackScopedApproval["state"],
  actor: string,
  changedAt: string,
  scopeFieldIds: readonly string[],
  manifestId: string | null,
): TechPackRecord {
  if (!record.revisionId || record.revisionNumber < 1) throw new Error("Save the Tech Pack before starting a scoped review.");
  if (!canonicalTime(changedAt)) throw new Error("The local review time must use canonical ISO format.");
  return {
    ...record,
    updatedAt: changedAt,
    approval: {
      state,
      revisionId: record.revisionId,
      scopeFieldIds: [...scopeFieldIds],
      changedBy: actor,
      changedAt,
      manifestId,
    },
  };
}

export function startTechPackReview(
  record: TechPackRecord,
  actorInput: string,
  scopeFieldIds: readonly string[],
  changedAt: string,
): TechPackRecord {
  if (record.approval.state !== "DRAFT") throw new Error("Start review only from a saved Tech Pack draft.");
  return scopedApproval(record, "REVIEW", actorLabel(actorInput), changedAt, selectedScope(record, scopeFieldIds), null);
}

export function approveTechPackReview(record: TechPackRecord, actorInput: string, changedAt: string): TechPackRecord {
  if (record.approval.state !== "REVIEW" || record.approval.revisionId !== record.revisionId) {
    throw new Error("Approve only the current saved revision after its scoped review has started.");
  }
  return scopedApproval(record, "APPROVED", actorLabel(actorInput), changedAt,
    selectedScope(record, record.approval.scopeFieldIds), null);
}

export function freezeTechPackApproval(
  record: TechPackRecord,
  actorInput: string,
  manifestId: string,
  changedAt: string,
): TechPackRecord {
  if (record.approval.state !== "APPROVED" || record.approval.revisionId !== record.revisionId) {
    throw new Error("Freeze only the current saved revision with a scoped local approval.");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manifestId)) {
    throw new Error("The frozen-share manifest identity is invalid.");
  }
  return scopedApproval(record, "FROZEN_FOR_SHARE", actorLabel(actorInput), changedAt,
    selectedScope(record, record.approval.scopeFieldIds), manifestId);
}

export async function createTechPackApprovalRef(
  record: TechPackRecord,
  revision: StyleRevisionRecord,
  selectedSections: readonly string[],
  artifacts: readonly TechPackShareArtifactInput[],
  provider?: Crypto,
): Promise<string> {
  if (record.approval.state !== "APPROVED" || !record.revisionId
    || record.approval.revisionId !== record.revisionId || revision.revisionId !== record.revisionId
    || revision.styleId !== record.styleId) {
    throw new Error("The Tech Pack approval and immutable revision do not match.");
  }
  selectedScope(record, record.approval.scopeFieldIds);
  if (!selectedSections.length || new Set(selectedSections).size !== selectedSections.length
    || selectedSections.some((section) => !(TECH_PACK_SHARE_SECTIONS as readonly string[]).includes(section))) {
    throw new Error("The production-pack section selection is invalid.");
  }
  if (artifacts.length !== TECH_PACK_SHARE_ARTIFACTS.length) throw new Error("The frozen Tech Pack requires its ZIP and PDF artifacts.");
  const descriptors = [];
  for (const expected of TECH_PACK_SHARE_ARTIFACTS) {
    const artifact = artifacts.find((candidate) => candidate.artifactId === expected.artifactId);
    if (!artifact || artifact.extension !== expected.extension || artifact.mediaType !== expected.mediaType
      || !(artifact.bytes instanceof Uint8Array) || artifact.bytes.byteLength < 1
      || artifact.bytes.byteLength > FROZEN_TECH_PACK_ARTIFACT_LIMIT || !artifact.displayName.trim()) {
      throw new Error("A frozen Tech Pack artifact is missing or exceeds the 128 MiB per-file limit.");
    }
    descriptors.push({
      artifactId: artifact.artifactId,
      path: `artifacts/${artifact.artifactId}.${artifact.extension}`,
      displayName: artifact.displayName,
      mediaType: artifact.mediaType,
      byteLength: artifact.bytes.byteLength,
      sha256: await sha256Hex(artifact.bytes, provider),
    });
  }
  const approvalDigest = await jcsSha256Hex({
    protocol: "infinidrip-techpack-share-approval-v1",
    styleId: record.styleId,
    revisionId: revision.revisionId,
    revisionContentDigest: revision.revisionContentDigest,
    audience: "local-user",
    purpose: "digital-review-and-export",
    scopeFieldIds: [...record.approval.scopeFieldIds].sort(),
    approvedBy: record.approval.changedBy,
    approvedAt: record.approval.changedAt,
    selectedSections: [...selectedSections],
    artifacts: descriptors,
  }, provider);
  return `tech-pack-approval-sha256:${approvalDigest}`;
}
