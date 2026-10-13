import { describe, expect, it } from "vitest";
import { parseTechPackOperationRecordSet } from "./tech-pack-operation-records";
import { evaluateTechPackOperationRecordSet } from "./tech-pack-operation-validation";

const source = { uri: "docs/fixture.md", title: "Synthetic source", locator: "Fixture line 1" };

describe("T03 operation validation summary", () => {
  it("reports absent operations with an actionable next step", () => {
    const missing = evaluateTechPackOperationRecordSet(null);
    expect(missing.findings[0]).toMatchObject({ status: "ABSENT", path: "operations" });
    expect(missing.findings[0]?.nextAction).toContain("Decide whether this item applies");
    expect(evaluateTechPackOperationRecordSet({ schemaVersion: 2, recipeId: "tee", operations: [] }).counts.ABSENT).toBe(1);
  });

  it("reports each provenance category without treating defaults, estimates, or decisions as sourced", () => {
    const parsed = parseTechPackOperationRecordSet({
      schemaVersion: 2,
      recipeId: "tee",
      operations: [{
        id: "join-side-seams",
        name: { status: "SOURCE_CONFIRMED", value: "Synthetic join", source },
        sequence: { status: "UNRESOLVED", value: null, unresolvedReason: "Sequence is unknown.", nextAction: "Review a source." },
        componentRefs: { status: "CONFLICT", value: null, sourceRefs: [source, { ...source, uri: "docs/other.md" }], unresolvedReason: "References conflict.", nextAction: "Reconcile in S773." },
        seamRefs: { status: "RECIPE_DEFAULT", value: ["side-seam"], recipeId: "tee", recipeVersionMarker: "tee-default-v1", inAppLocator: "Recipe defaults / seams" },
        facts: [
          { factId: "method", value: { status: "ESTIMATE", value: "Synthetic method", method: "Fixture estimate", assumptions: "No external source." } },
          { factId: "finish", value: { status: "USER_DECISION", value: "Synthetic finish", rationale: "Fixture decision only." } },
        ],
      }],
    }, "tee");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = evaluateTechPackOperationRecordSet(parsed.value);
    expect(result.counts).toMatchObject({
      SOURCE_CONFIRMED: 1,
      UNRESOLVED: 1,
      CONFLICT: 1,
      RECIPE_DEFAULT: 1,
      ESTIMATE: 1,
      USER_DECISION: 1,
      ABSENT: 9,
    });
    expect(result.findings.find((finding) => finding.status === "RECIPE_DEFAULT")?.message).toContain("not source-confirmed");
    expect(result.findings.find((finding) => finding.status === "ESTIMATE")?.nextAction).toContain("approved source");
    expect(result.findings.find((finding) => finding.status === "USER_DECISION")?.message).toContain("Fixture decision only");
    expect(result.findings.find((finding) => finding.status === "CONFLICT")?.nextAction).toBe("Reconcile in S773.");
    expect(result.findings.find((finding) => finding.status === "SOURCE_CONFIRMED")?.nextAction).toContain("S773");
  });
});
