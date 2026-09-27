import { describe, expect, it } from "vitest";
import {
  approveGradePlan,
  configureGradePlan,
  createGradePlanDraft,
  reviewGradePlan,
  setGradePlanDelta,
  type GradePlanBaseBinding,
  type GradePlanRecord,
} from "./grade-plan";
import { gradePlanPanelMarkup, type GradePlanPanelModel } from "./grade-plan-panel";

const time = "2026-09-24T16:00:00.000Z";
const binding: GradePlanBaseBinding = {
  projectId: "b53a1a03-ea2e-4c4f-82dc-14ac86a29895",
  styleId: "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4",
  recipeId: "tee",
  revisionHeadId: "5d4f7fb2-fb7e-4ed1-85bc-4899ebd9a129",
  captureRevision: 1,
  fingerprint: "a".repeat(64),
};
const target = { targetId: "measurement.chest", kind: "measurement" as const, label: "Chest", unit: "cm", baseValue: 96 };

function completePlan(): GradePlanRecord {
  const created = createGradePlanDraft(binding, [target], time);
  if (!created.ok) throw new Error(created.errors.join("; "));
  const configured = configureGradePlan(created.value, {
    basis: {
      kind: "population-source", population: "Adult population", sourceName: "Pattern source",
      sourceVersion: "2026", sourceScope: "Digital base sizes only",
    },
    declaredRange: "S to L; no extended sizes",
    baseSizeLabel: "M",
    sizes: [{ label: "S", position: -1 }, { label: "M", position: 0 }, { label: "L", position: 1 }],
    exceptions: [],
  }, time);
  if (!configured.ok) throw new Error(configured.errors.join("; "));
  const small = setGradePlanDelta(configured.value, target.targetId, "S", -2, time);
  if (!small.ok) throw new Error(small.errors.join("; "));
  const large = setGradePlanDelta(small.value, target.targetId, "L", 2, time);
  if (!large.ok) throw new Error(large.errors.join("; "));
  const reviewed = reviewGradePlan(large.value, [target.targetId], binding, time);
  if (!reviewed.ok) throw new Error(reviewed.errors.join("; "));
  const approved = approveGradePlan(reviewed.value, [target.targetId], binding, time);
  if (!approved.ok) throw new Error(approved.errors.join("; "));
  return approved.value;
}

function model(plan: GradePlanRecord | null, updates: Partial<GradePlanPanelModel> = {}): GradePlanPanelModel {
  return {
    recipeLabel: "Woven tee",
    plan,
    stale: false,
    canCreate: false,
    createBlocker: null,
    message: null,
    ...updates,
  };
}

describe("grade-plan panel markup", () => {
  it("explains an empty plan and keeps creation blocked until prerequisites exist", () => {
    const blocked = gradePlanPanelMarkup(model(null, {
      createBlocker: "Save a measurement capture first.",
      canCreate: false,
    }));
    expect(blocked).toContain("There is no grade plan for this Woven tee style yet.");
    expect(blocked).toContain("Save a measurement capture first.");
    expect(blocked).toContain("data-grade-plan-action=\"create\" disabled");

    const ready = gradePlanPanelMarkup(model(null, { canCreate: true }));
    expect(ready).toContain("data-grade-plan-action=\"create\"");
    expect(ready).not.toContain("data-grade-plan-action=\"create\" disabled");
  });

  it("shows a failed first-plan write when no record exists yet", () => {
    const html = gradePlanPanelMarkup(model(null, { canCreate: true, message: "Local grade-plan storage is unavailable." }));
    expect(html).toContain('<p role="status">Local grade-plan storage is unavailable.</p>');
  });

  it("renders an unfinished digital rule, missing deltas, and size exceptions", () => {
    const source = completePlan();
    const draft: GradePlanRecord = {
      ...source,
      basis: { kind: "user-authored-digital-rule", decision: "Design-led", digitalRange: "S–L" },
      baseSizeLabel: null,
      status: "draft",
      reviewedAt: null,
      approvedAt: null,
      targets: [{ ...source.targets[0]!, deltas: [
        { sizeLabel: "S", deltaFromBase: null },
        { sizeLabel: "M", deltaFromBase: 0 },
        { sizeLabel: "L", deltaFromBase: null },
      ] }],
      exceptions: [{ targetId: target.targetId, sizeLabel: "L", reason: "Not used in this size" }],
    };
    const html = gradePlanPanelMarkup(model(draft));

    expect(html).toContain('data-grade-plan-basis-fields="population-source" hidden');
    expect(html).toContain('data-grade-plan-basis-fields="user-authored-digital-rule">');
    expect(html).toContain('data-grade-plan-decision maxlength="240" value="Design-led"');
    expect(html).toContain('data-grade-plan-base-size maxlength="48" value=""');
    expect(html).toContain('data-grade-plan-exception data-target-id="measurement.chest" data-size-label="L" checked');
    expect(html).toContain('data-grade-plan-exception-reason data-target-id="measurement.chest" data-size-label="L" maxlength="240">Not used in this size');
    expect(html).toContain('data-grade-plan-delta data-target-id="measurement.chest" data-size-label="S" value=""');

    const noBasis = gradePlanPanelMarkup(model({ ...draft, basis: null }));
    expect(noBasis).toContain('<option value="" selected>Choose a basis</option>');
  });

  it("escapes user-authored source text and exposes draft issues and editing controls", () => {
    const draft = completePlan();
    const unreviewed = { ...draft, status: "draft" as const, reviewedAt: null, approvedAt: null };
    const unsafe = { ...unreviewed, basis: {
      kind: "population-source" as const,
      population: "<script>bad()</script>", sourceName: "A & B", sourceVersion: "v1", sourceScope: "Digital",
    } };
    const markup = gradePlanPanelMarkup(model(unsafe));
    expect(markup).toContain("&lt;script&gt;bad()&lt;/script&gt;");
    expect(markup).not.toContain("<script>bad()");
    expect(markup).toContain("data-grade-plan-basis-fields=\"population-source\"");
    expect(markup).toContain("data-grade-plan-action=\"save-draft\"");
    expect(markup).toContain("data-grade-plan-action=\"review\"");
    expect(markup).toContain("Approval records your review");
  });

  it("shows stale plans as unusable and offers a base refresh", () => {
    const markup = gradePlanPanelMarkup(model(completePlan(), {
      stale: true,
      message: "The current base changed.",
    }));
    expect(markup).toContain("Stale — approval cannot be used");
    expect(markup).toContain("The current base changed.");
    expect(markup).toContain("data-grade-plan-action=\"refresh\"");
    expect(markup).toMatch(/data-grade-plan-action="approve" disabled/);
  });

  it("distinguishes reviewed and approved states and renders explicit size changes", () => {
    const approved = completePlan();
    const reviewed: GradePlanRecord = { ...approved, status: "reviewed", approvedAt: null };
    const reviewMarkup = gradePlanPanelMarkup(model(reviewed));
    expect(reviewMarkup).toContain("Reviewed; approval still required");
    expect(reviewMarkup).toContain("data-grade-plan-action=\"approve\"");

    const approvedMarkup = gradePlanPanelMarkup(model(approved));
    expect(approvedMarkup).toContain("Approved grade-plan record");
    expect(approvedMarkup).toContain("data-grade-plan-delta");
    expect(approvedMarkup).toContain("Chest");
    expect(approvedMarkup).toContain("S change from base");
    expect(approvedMarkup).toContain("value=\"-2\"");
  });
});
