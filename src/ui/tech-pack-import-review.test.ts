import { describe, expect, it } from "vitest";
import type { ProductionPackImportPreview } from "./tech-pack-output";
import type { StyleRevisionRecord } from "./style-revisions";
import type { TechPackScopedApproval } from "./tech-pack-records";
import {
  productionPackImportCandidateEligible,
  renderTechPackImportReview,
  type TechPackImportReviewState,
} from "./tech-pack-import-review";

const approval: TechPackScopedApproval = {
  state: "REVIEW" as const,
  revisionId: "revision-current",
  scopeFieldIds: ["pomData.sampleQaRounds[0].readings[0].actualValue"],
  changedBy: "local reviewer",
  changedAt: "2026-10-13T09:00:00.000Z",
  manifestId: null,
};

function revision(revisionId: string): StyleRevisionRecord {
  return {
    styleId: "style-<synthetic>",
    revisionId,
    revisionNumber: revisionId === "revision-base" ? 1 : 2,
    revisionContentDigest: "sha256:<exact-digest>",
    payload: { payloadVersion: 2, techPack: { approval } },
  } as unknown as StyleRevisionRecord;
}

function preview(overrides: Partial<ProductionPackImportPreview> = {}): ProductionPackImportPreview {
  return {
    status: "changed",
    baseRevision: revision("revision-base"),
    currentHead: revision("revision-base"),
    diff: [{
      path: "pomData.sampleQaRounds[0].readings[0].actualValue",
      change: "changed",
      before: 52.25,
      after: 52.375,
    }],
    candidateRecord: {} as ProductionPackImportPreview["candidateRecord"],
    canApply: true,
    findings: [],
    attachments: [],
    ...overrides,
  };
}

function reviewState(
  fileName: string,
  result: ProductionPackImportPreview = preview(),
  currentApproval: TechPackScopedApproval = approval,
): TechPackImportReviewState {
  return { kind: "preview", fileName, result, currentApproval };
}

describe("renderTechPackImportReview", () => {
  it("renders an accessible picker and empty and in-progress states", () => {
    const idle = renderTechPackImportReview({ kind: "idle" });
    expect(idle).toContain('type="file"');
    expect(idle).toContain(".techpack.zip");
    expect(idle).toContain("No package selected.");
    expect(renderTechPackImportReview({ kind: "reading", fileName: "review & check.zip" }))
      .toContain("Checking review &amp; check.zip");
  });

  it("escapes errors and shows successful application as a new draft revision", () => {
    expect(renderTechPackImportReview({ kind: "error", message: "Bad <zip> & 'data'" }))
      .toContain("Bad &lt;zip&gt; &amp; &#39;data&#39;");
    expect(renderTechPackImportReview({ kind: "invalidated", message: "The head changed." }))
      .toContain("The head changed.");
    const applied = renderTechPackImportReview({
      kind: "applied", styleId: "tee", previousRevisionNumber: 4, revisionNumber: 5,
    });
    expect(applied).toContain("tee");
    expect(applied).toContain("immutable revision r5 (from r4)");
    expect(applied).toContain("DRAFT with no approved scope");
  });

  it("shows exact numeric field diffs, current scoped approval, findings and explicit apply", () => {
    const markup = renderTechPackImportReview(reviewState(
      "Tee <review>.techpack.zip",
      preview({
        findings: [{
          status: "UNRESOLVED", path: "pomData.definitions", message: "Source not supplied & still open.",
        }],
        attachments: [{ path: "attachments/synthetic.png", role: "artwork", mediaType: "image/png", byteLength: 5,
          sha256: "a".repeat(64), assetId: "local-asset", displayName: "Synthetic", sourceLabel: "Fixture", attribution: null }],
      }),
    ));

    expect(markup).toContain("Tee &lt;review&gt;.techpack.zip");
    expect(markup).toContain("52.25");
    expect(markup).toContain("52.375");
    expect(markup).toContain("pomData.sampleQaRounds[0].readings[0].actualValue");
    expect(markup).toContain("REVIEW");
    expect(markup).toContain("Scoped fields");
    expect(markup).toContain("Source not supplied &amp; still open.");
    expect(markup).toContain("1 read-only artwork attachment descriptor(s)");
    expect(markup).toContain('data-production-pack-import-action="apply"');
    expect(markup).toContain("Applying authored changes creates a new immutable revision in DRAFT");
  });

  it("keeps unchanged and stale previews read-only and explains an ineligible changed record", () => {
    const unchanged = renderTechPackImportReview(reviewState("same.techpack.zip",
      preview({ status: "unchanged", diff: [], candidateRecord: null, canApply: false })));
    expect(unchanged).toContain("no style revision will be created");
    expect(unchanged).toContain("No authored fields differ");
    expect(unchanged).not.toContain('data-production-pack-import-action="apply"');

    const stale = renderTechPackImportReview(reviewState("old.techpack.zip",
      preview({ status: "stale", currentHead: revision("revision-current"), candidateRecord: null, canApply: false })));
    expect(stale).toContain("older style revision");
    expect(stale).not.toContain('data-production-pack-import-action="apply"');

    const blocked = renderTechPackImportReview(reviewState("invalid-semantic.techpack.zip", preview({ canApply: false })));
    expect(blocked).toContain("read-only because it has no eligible candidate");
    expect(blocked).not.toContain('data-production-pack-import-action="apply"');

    const invalidFinding = renderTechPackImportReview(reviewState("invalid-finding.techpack.zip", preview({
      findings: [{ status: "INVALID", path: "pomData", message: "Candidate must remain read-only." }],
    })));
    expect(invalidFinding).toContain("Candidate must remain read-only.");
    expect(invalidFinding).toContain("read-only because it has no eligible candidate");
    expect(invalidFinding).not.toContain('data-production-pack-import-action="apply"');

    expect(productionPackImportCandidateEligible(preview({
      findings: [{ status: "INVALID", path: "pomData", message: "Not eligible." }],
    }))).toBe(false);
    expect(productionPackImportCandidateEligible(preview({ candidateRecord: null }))).toBe(false);
    expect(productionPackImportCandidateEligible(preview({ canApply: false }))).toBe(false);
    expect(productionPackImportCandidateEligible(preview({
      status: "unchanged", candidateRecord: null, canApply: false,
    }))).toBe(false);
  });

  it("handles legacy approval metadata and every diff value kind without hiding content", () => {
    const emptyScopeRevision = {
      ...revision("revision-base"),
      payload: { payloadVersion: 2, techPack: { approval: { ...approval, state: "DRAFT", revisionId: null, scopeFieldIds: [] } } },
    } as unknown as StyleRevisionRecord;
    const first = preview({
      baseRevision: emptyScopeRevision,
      diff: [
        { path: "field.string", change: "added", before: undefined, after: "x\n<&" },
        { path: "field.object", change: "removed", before: { mm: 1 }, after: null },
        { path: "field.symbol", change: "changed", before: Symbol("opaque"), after: false },
      ],
    });
    const markup = renderTechPackImportReview(reviewState("exact.techpack.zip", first));
    expect(markup).toContain("&quot;x\\n&lt;&amp;&quot;");
    expect(markup).toContain("{&quot;mm&quot;:1}");
    expect(markup).toContain("null");
    expect(markup).toContain("Symbol(opaque)");

    const emptyScope = renderTechPackImportReview(reviewState("draft.techpack.zip", preview(),
      { ...approval, state: "DRAFT", revisionId: null, scopeFieldIds: [] }));
    expect(emptyScope).toContain("No fields are in the saved review scope.");
    expect(emptyScope).toContain("approval revision: <code>none</code>");
  });

  it("accepts the complete render-state union", () => {
    const states: readonly TechPackImportReviewState[] = [
      { kind: "idle" },
      { kind: "reading", fileName: "x.techpack.zip" },
      { kind: "applying", fileName: "x.techpack.zip" },
      { kind: "error", message: "bad" },
      { kind: "invalidated", message: "stale" },
      { kind: "applied", styleId: "tee", previousRevisionNumber: 1, revisionNumber: 2 },
      reviewState("x.techpack.zip"),
    ];
    expect(states.map((state) => renderTechPackImportReview(state))).toHaveLength(7);
  });
});
