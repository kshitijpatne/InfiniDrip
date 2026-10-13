import { webcrypto } from "node:crypto";
import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting";
import { createFieldObservationRecord } from "./field-provenance";
import { migrateLegacySaveFile } from "./project-records";
import { serialize } from "./persist";
import { bindTechPackToRevision, type TechPackRecord } from "./tech-pack-records";
import { createStyleRevision } from "./style-revisions";
import {
  approveTechPackReview,
  createTechPackApprovalRef,
  freezeTechPackApproval,
  startTechPackReview,
  techPackShareFieldIds,
  techPackShareScopeGroups,
  TECH_PACK_SHARE_ARTIFACTS,
  TECH_PACK_SHARE_SECTIONS,
  type TechPackShareArtifactInput,
} from "./tech-pack-sharing";

const crypto = webcrypto as unknown as Crypto;
const TIME = "2026-10-13T16:00:00.000Z";
const NEXT = "2026-10-13T16:00:01.000Z";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const REVISION_ID = "11111111-1111-4111-8111-111111111111";
const MANIFEST_ID = "22222222-2222-4222-8222-222222222222";

async function fixture() {
  const migrated = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150", {}),
    projectId: "a02b8322-8f57-46bb-9d16-16ac1fcf6811",
    styleId: STYLE_ID,
    migratedAt: TIME,
  });
  if (!migrated.ok) throw new Error(migrated.error);
  const style = migrated.value.style;
  const record = bindTechPackToRevision(style.techPack, REVISION_ID, 1, TIME);
  const revision = await createStyleRevision({
    styleId: STYLE_ID,
    revisionId: REVISION_ID,
    parentRevisionId: null,
    revisionNumber: 1,
    createdAt: TIME,
    design: style.design,
    fieldObservations: createFieldObservationRecord(style, TIME, "existing-local-style"),
    artwork: [],
    techPack: record,
  }, crypto);
  return { record, revision };
}

function outputs(): TechPackShareArtifactInput[] {
  return TECH_PACK_SHARE_ARTIFACTS.map((artifact, index) => ({
    ...artifact,
    bytes: new Uint8Array([index + 1, 0, 255]),
  }));
}

describe("scoped local Tech Pack sharing", () => {
  it("lists stable field groups and binds review, approval and freeze to the saved revision", async () => {
    const { record, revision } = await fixture();
    const groups = techPackShareScopeGroups(record);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: "cover", label: "Style cover" });
    expect(groups[0]?.fieldIds).toContain("cover.styleName");
    expect(techPackShareFieldIds(record)).toEqual([...techPackShareFieldIds(record)].sort());

    const scope = [record.cover.styleName.fieldId, record.cover.styleCode.fieldId];
    const review = startTechPackReview(record, "Local sample reviewer", scope, TIME);
    expect(review.approval).toEqual({
      state: "REVIEW", revisionId: REVISION_ID, scopeFieldIds: [...scope].sort(),
      changedBy: "Local sample reviewer", changedAt: TIME, manifestId: null,
    });
    const approved = approveTechPackReview(review, "Local sample approver", NEXT);
    expect(approved.approval).toMatchObject({ state: "APPROVED", revisionId: REVISION_ID, changedBy: "Local sample approver", changedAt: NEXT });
    expect(approved.approval.scopeFieldIds).toEqual(review.approval.scopeFieldIds);
    const frozen = freezeTechPackApproval(approved, "Local freezer", MANIFEST_ID, "2026-10-13T16:00:02.000Z");
    expect(frozen.approval).toMatchObject({
      state: "FROZEN_FOR_SHARE", revisionId: REVISION_ID, manifestId: MANIFEST_ID,
      changedBy: "Local freezer", changedAt: "2026-10-13T16:00:02.000Z",
    });

    const approvedRecord = { ...approved, approval: { ...approved.approval, scopeFieldIds: [...scope].sort() } };
    const files = outputs();
    const digest = await createTechPackApprovalRef(approvedRecord, revision, ["identity", "approval-disclaimer"], files, crypto);
    expect(digest).toMatch(/^tech-pack-approval-sha256:[0-9a-f]{64}$/);
    expect(await createTechPackApprovalRef(approvedRecord, revision, ["identity", "approval-disclaimer"], files, crypto)).toBe(digest);
    expect([...TECH_PACK_SHARE_SECTIONS]).toContain("identity");
  });

  it("groups material, BOM and colorway fields and gives empty values readable labels", async () => {
    const { record } = await fixture();
    const expanded = {
      ...record,
      materials: [{
        id: "material-1", category: "fabric", name: { fieldId: "material.name", value: "Cotton" },
        supplier: { fieldId: "material.supplier", value: null },
      }],
      bomRows: [{
        id: "bom-1", componentRef: { fieldId: "bom.component", value: null },
        materialId: "material-1", quantity: { fieldId: "bom.quantity", value: null },
      }],
      colorways: [{
        id: "colorway-1", name: { fieldId: "colorway.name", value: "" },
        assignments: [{ id: "assignment-1", color: { fieldId: "assignment.color", value: "Navy" } }],
      }],
    } as unknown as TechPackRecord;
    expect(techPackShareScopeGroups(expanded)).toEqual([
      expect.objectContaining({ id: "cover" }),
      expect.objectContaining({ id: "material:material-1", label: "Material 1: Cotton", fieldIds: ["material.name", "material.supplier"] }),
      expect.objectContaining({ id: "bom:bom-1", label: "BOM row 1: unlabeled", fieldIds: ["bom.component", "bom.quantity"] }),
      expect.objectContaining({ id: "colorway:colorway-1", label: "Colorway 1: unnamed", fieldIds: ["assignment.color", "colorway.name"] }),
    ]);
    const empty = { ...record, cover: {
      emptyList: [],
      emptyValue: null,
      rawText: "not a field record",
      malformedField: { fieldId: 7 },
    } } as unknown as TechPackRecord;
    expect(techPackShareScopeGroups(empty)).toEqual([]);
    const invalidRoot = { ...record, cover: [] } as unknown as TechPackRecord;
    expect(techPackShareScopeGroups(invalidRoot)).toEqual([]);
  });

  it("rejects missing, stale, duplicate and malformed review choices", async () => {
    const { record } = await fixture();
    const fieldId = record.cover.styleName.fieldId;
    expect(() => startTechPackReview({ ...record, revisionId: null }, "Reviewer", [fieldId], TIME)).toThrow("Save the Tech Pack");
    expect(() => startTechPackReview(record, "Reviewer", [fieldId], "not-a-time")).toThrow("canonical ISO");
    expect(() => startTechPackReview(record, " \n ", [fieldId], TIME)).toThrow("self-attested");
    expect(() => startTechPackReview(record, "x".repeat(121), [fieldId], TIME)).toThrow("self-attested");
    expect(() => startTechPackReview(record, "reviewer\tname", [fieldId], TIME)).toThrow("self-attested");
    expect(() => startTechPackReview(record, "Reviewer", [], TIME)).toThrow("Select one or more");
    expect(() => startTechPackReview(record, "Reviewer", ["not-a-field"], TIME)).toThrow("Select one or more");
    expect(() => startTechPackReview(record, "Reviewer", [fieldId, fieldId], TIME)).toThrow("Select one or more");
    const review = startTechPackReview(record, "Reviewer", [fieldId], TIME);
    expect(() => startTechPackReview(review, "Reviewer", [fieldId], NEXT)).toThrow("Start review only");
    expect(() => approveTechPackReview(record, "Approver", NEXT)).toThrow("Approve only");
    expect(() => approveTechPackReview({ ...review, revisionId: "33333333-3333-4333-8333-333333333333" }, "Approver", NEXT)).toThrow("Approve only");
    expect(() => approveTechPackReview(review, " \n ", NEXT)).toThrow("self-attested");
    expect(() => freezeTechPackApproval(review, "Freezer", MANIFEST_ID, NEXT)).toThrow("Freeze only");
    const approved = approveTechPackReview(review, "Approver", NEXT);
    expect(() => freezeTechPackApproval(approved, "Freezer", "invalid", NEXT)).toThrow("manifest identity");
    expect(() => freezeTechPackApproval(approved, " \n ", MANIFEST_ID, NEXT)).toThrow("self-attested");
  });

  it("binds digest and scope to the output files and rejects invalid output identities", async () => {
    const { record, revision } = await fixture();
    const approved = approveTechPackReview(startTechPackReview(record, "Reviewer", [record.cover.styleName.fieldId], TIME), "Approver", NEXT);
    const files = outputs();
    await expect(createTechPackApprovalRef({ ...approved, approval: { ...approved.approval, state: "REVIEW" } }, revision,
      ["identity"], files, crypto)).rejects.toThrow("approval and immutable revision");
    await expect(createTechPackApprovalRef(approved, { ...revision, revisionId: "33333333-3333-4333-8333-333333333333" },
      ["identity"], files, crypto)).rejects.toThrow("approval and immutable revision");
    await expect(createTechPackApprovalRef(approved, revision, [], files, crypto)).rejects.toThrow("section selection");
    await expect(createTechPackApprovalRef(approved, revision, ["identity", "identity"], files, crypto)).rejects.toThrow("section selection");
    await expect(createTechPackApprovalRef(approved, revision, ["unknown"], files, crypto)).rejects.toThrow("section selection");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], files.slice(1), crypto)).rejects.toThrow("requires its ZIP and PDF");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], [files[0]!, files[0]!], crypto)).rejects.toThrow("artifact is missing");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], [{ ...files[0]!, extension: "pdf" }, files[1]!], crypto))
      .rejects.toThrow("artifact is missing");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], [{ ...files[0]!, mediaType: "text/plain" } as unknown as TechPackShareArtifactInput, files[1]!], crypto))
      .rejects.toThrow("artifact is missing");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], [{ ...files[0]!, bytes: new Uint8Array() }, files[1]!], crypto))
      .rejects.toThrow("artifact is missing");
    await expect(createTechPackApprovalRef(approved, revision, ["identity"], [{ ...files[0]!, displayName: " " }, files[1]!], crypto))
      .rejects.toThrow("artifact is missing");
  });
});
