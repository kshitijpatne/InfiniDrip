import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions, type GarmentRecipe } from "../drafting";
import { createEmptyTechPackRecord, type TechPackRecord } from "./tech-pack-records";
import {
  emptyTechPackPomRecordSet,
  type TechPackPomRecordSet,
  type TechPackPomSampleQaRound,
} from "./tech-pack-sample-qa-records";
import {
  TECH_PACK_POM_RECIPE_IDS,
  type TechPackPomDefinition,
  type TechPackPomRecipeId,
  type TechPackPomSourcedValue,
} from "./tech-pack-pom-records";
import { evaluateTechPackT02 } from "./tech-pack-t02-validation";

const TIME = "2026-10-13T02:00:00.000Z";
const SOURCE = { uri: "https://example.test/tech-pack", title: "Approved size spec", locator: "Page 4, table 2" };

function confirmed<T>(value: T): TechPackPomSourcedValue<T> {
  return { status: "SOURCE_CONFIRMED", value, source: SOURCE };
}

function definition(recipe: GarmentRecipe, label: string, index: number): TechPackPomDefinition {
  const base = recipe.sizes.find((size) => size.step === 0)!.label;
  return {
    id: `pom-${index}`,
    label,
    unit: "cm",
    method: confirmed({ kind: "STRAIGHT_LINE", instructions: "Measure between the cited landmarks." }),
    landmarks: confirmed([{ id: "start", label: "Start landmark" }, { id: "end", label: "End landmark" }]),
    tolerance: confirmed({ lowerDelta: -0.5, upperDelta: 0.5 }),
    sizeRangeSource: confirmed({ rangeLabel: "Supported run", sizeIds: recipe.sizes.map((size) => size.label), baseSizeId: base }),
    gradeRuleSource: confirmed({ ruleId: "approved-grade", version: "1" }),
  };
}

function record(recipeId: string, baseSizeId: string | null): TechPackRecord {
  const empty = createEmptyTechPackRecord("00000000-0000-4000-8000-000000000001", recipeId, TIME, TIME);
  const baseField = {
    ...empty.cover.baseSizeId,
    value: baseSizeId,
    provenance: baseSizeId === null ? "UNRESOLVED" as const : "USER_SELECTED" as const,
    evidenceStatus: baseSizeId === null ? "UNCONFIRMED" as const : "USER_CONFIRMED" as const,
    validationStatus: baseSizeId === null ? "INVALID" as const : "VALID" as const,
    unresolvedReason: baseSizeId === null ? "Base size not sourced." : null,
    nextAction: baseSizeId === null ? "Record the base size." : null,
  };
  return { ...empty, cover: { ...empty.cover, baseSizeId: baseField } };
}

function dataFor(recipe: GarmentRecipe, definitions: readonly TechPackPomDefinition[]): TechPackPomRecordSet {
  const empty = emptyTechPackPomRecordSet(recipe.name as TechPackPomRecipeId);
  return { ...empty, definitions: { ...empty.definitions, definitions } };
}

function round(sampleSizeId: string): TechPackPomSampleQaRound {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    targetRevisionId: "00000000-0000-4000-8000-000000000201",
    targetRevisionNumber: 1,
    sampleLabel: "Fit sample",
    sampleSizeId,
    recordedAt: TIME,
    recordedBy: "Reviewer",
    readings: [],
    qaObservations: [],
  };
}

function evaluate(recipe: GarmentRecipe, input?: {
  readonly record?: TechPackRecord;
  readonly data?: TechPackPomRecordSet;
  readonly measurements?: typeof STANDARD_M;
  readonly recipeOverride?: GarmentRecipe;
  readonly sizeSteps?: GarmentRecipe["sizes"];
}) {
  const target = input?.recipeOverride ?? recipe;
  return evaluateTechPackT02({
    record: input?.record ?? record(recipe.name, recipe.sizes.find((size) => size.step === 0)?.label ?? null),
    data: input?.data ?? dataFor(recipe, recipe.poms.map((pom, index) => definition(recipe, pom.label, index))),
    recipe: target,
    measurements: input?.measurements ?? STANDARD_M,
    options: defaultGarmentOptions(recipe.options ?? []),
    sizeSteps: input?.sizeSteps ?? recipe.sizes,
  });
}

describe("T02 source-aware callout and size-run checks", () => {
  it("checks every existing recipe and calculates separate finite pattern predictions", () => {
    expect(TECH_PACK_POM_RECIPE_IDS).toEqual([...GARMENTS.map((recipe) => recipe.name), "jeans"]);
    for (const recipe of GARMENTS) {
      const result = evaluate(recipe);
      expect(result.ready, recipe.name).toBe(true);
      expect(result.completeCalloutCount, recipe.name).toBe(recipe.poms.length);
      expect(result.sizeRunReady, recipe.name).toBe(true);
      expect(result.sizeIds, recipe.name).toEqual(recipe.sizes.map((size) => size.label));
      expect(result.predictions, recipe.name).toHaveLength(recipe.poms.length);
      expect(result.predictions.flatMap((pom) => pom.values).every((value) => value.value !== null), recipe.name).toBe(true);
    }
  });

  it("keeps missing sources actionable and does not infer a POM definition", () => {
    const recipe = GARMENTS[0]!;
    const result = evaluate(recipe, { data: emptyTechPackPomRecordSet(recipe.name as TechPackPomRecipeId), record: record(recipe.name, null) });
    expect(result.ready).toBe(false);
    expect(result.completeCalloutCount).toBe(0);
    expect(result.findings.some((finding) => finding.field === "POM definition"
      && finding.status === "UNRESOLVED" && finding.nextAction.includes("exact label"))).toBe(true);
    expect(result.findings.some((finding) => finding.field === "Style base size"
      && finding.nextAction === "Record the base size.")).toBe(true);
    expect(result.findings.some((finding) => finding.field === "Size run" && finding.status === "UNRESOLVED")).toBe(true);
    expect(result.predictions.every((pom) => pom.values.every((value) => value.value !== null))).toBe(true);
  });

  it("preserves conflicting source status and its resolution action", () => {
    const recipe = GARMENTS[0]!;
    const definitions = recipe.poms.map((pom, index) => definition(recipe, pom.label, index));
    const conflicted = {
      ...definitions[0]!,
      tolerance: {
        status: "CONFLICT" as const,
        value: null,
        sourceRefs: [SOURCE, { ...SOURCE, uri: "https://example.test/second" }],
        unresolvedReason: "Two approved specs disagree.",
        nextAction: "Ask the owner to resolve the source conflict.",
      },
    };
    const result = evaluate(recipe, { data: dataFor(recipe, [conflicted, ...definitions.slice(1)]) });
    expect(result.findings).toContainEqual(expect.objectContaining({
      calloutLabel: recipe.poms[0]!.label,
      field: "Tolerance",
      status: "CONFLICT",
      message: "Two approved specs disagree.",
      nextAction: "Ask the owner to resolve the source conflict.",
    }));
  });

  it("rejects missing, duplicate, and unmatched exact-label callouts", () => {
    const recipe = GARMENTS[0]!;
    const valid = recipe.poms.map((pom, index) => definition(recipe, pom.label, index));
    const duplicate = { ...valid[0]!, id: "pom-duplicate" };
    const extra = definition(recipe, "Unmapped custom callout", 99);
    const result = evaluate(recipe, { data: dataFor(recipe, [duplicate, ...valid.slice(0, -1), extra]) });
    expect(result.findings.some((finding) => finding.status === "INVALID" && finding.message.includes("More than one"))).toBe(true);
    expect(result.findings.some((finding) => finding.status === "INVALID" && finding.message.includes("does not match"))).toBe(true);
    expect(result.findings.some((finding) => finding.status === "UNRESOLVED" && finding.message.includes("No T02 definition"))).toBe(true);
  });

  it("rejects inconsistent sourced ranges and out-of-range sample sizes without changing the sample", () => {
    const recipe = GARMENTS[0]!;
    const definitions = recipe.poms.map((pom, index) => definition(recipe, pom.label, index));
    const first = definitions[0]!;
    const second = definitions[1]!;
    const inconsistent = [
      { ...first, sizeRangeSource: confirmed({ rangeLabel: "Different run", sizeIds: ["M"], baseSizeId: "M" }) },
      ...definitions.slice(1).map((item) => item.id === second.id
        ? { ...item, sizeRangeSource: confirmed({ rangeLabel: "Other run", sizeIds: ["M", "L"], baseSizeId: "M" }) }
        : item),
    ];
    const data = { ...dataFor(recipe, inconsistent), sampleQaRounds: [round("XXL")] };
    const result = evaluate(recipe, { data });
    expect(result.findings.some((finding) => finding.message.includes("different size ranges"))).toBe(true);
    expect(result.findings.some((finding) => finding.field === "Sample size" && finding.message.includes("XXL"))).toBe(true);
    expect(data.sampleQaRounds[0]!.sampleSizeId).toBe("XXL");
  });

  it("rejects recipe and style base-size mismatches", () => {
    const recipe = GARMENTS[0]!;
    const result = evaluate(recipe, { record: record("polo", "S") });
    expect(result.findings.some((finding) => finding.field === "Recipe" && finding.status === "INVALID")).toBe(true);
    expect(result.findings.some((finding) => finding.field === "Style base size" && finding.message.includes("does not match"))).toBe(true);
  });

  it("reports invalid base-size fields and recipe runs with duplicate sizes or bases", () => {
    const recipe = GARMENTS[0]!;
    const baseRecord = record(recipe.name, "M");
    const invalidRecord = { ...baseRecord, cover: { ...baseRecord.cover, baseSizeId: {
      ...baseRecord.cover.baseSizeId,
      validationStatus: "INVALID" as const,
      unresolvedReason: "The selected size is invalid.",
      nextAction: "Select a listed size.",
    } } };
    const duplicateSizes = [{ label: "M", step: 0 }, { label: "M", step: 0 }];
    const result = evaluate(recipe, { record: invalidRecord, sizeSteps: duplicateSizes });
    expect(result.findings.some((finding) => finding.message === "The selected size is invalid.")).toBe(true);
    expect(result.findings.some((finding) => finding.message.includes("duplicate size IDs"))).toBe(true);
    expect(result.findings.some((finding) => finding.message.includes("exactly one base step"))).toBe(true);

    const missingUnresolvedDetails = record(recipe.name, null);
    const unresolvedFallbackRecord = {
      ...missingUnresolvedDetails,
      cover: { ...missingUnresolvedDetails.cover, baseSizeId: {
        ...missingUnresolvedDetails.cover.baseSizeId,
        unresolvedReason: null,
        nextAction: null,
      } },
    };
    const unresolvedFallback = evaluate(recipe, { record: unresolvedFallbackRecord });
    expect(unresolvedFallback.findings.some((finding) => finding.message === "The T01 style base size is not recorded.")).toBe(true);
    expect(unresolvedFallback.findings.some((finding) => finding.nextAction === "Record the style base size before approving a size run.")).toBe(true);

    const invalidFallback = {
      ...baseRecord,
      cover: { ...baseRecord.cover, baseSizeId: {
        ...baseRecord.cover.baseSizeId,
        validationStatus: "INVALID" as const,
        unresolvedReason: null,
        nextAction: null,
      } },
    };
    const invalidFallbackResult = evaluate(recipe, { record: invalidFallback });
    expect(invalidFallbackResult.findings.some((finding) => finding.message === "The T01 style base size is marked invalid.")).toBe(true);
    expect(invalidFallbackResult.findings.some((finding) => finding.nextAction === "Correct the T01 base-size field before approving a size run.")).toBe(true);
  });

  it("reports an empty custom size run and emits no recipe predictions", () => {
    const recipe = GARMENTS[0]!;
    const result = evaluate(recipe, { sizeSteps: [] });
    expect(result.sizeIds).toEqual([]);
    expect(result.findings.some((finding) => finding.field === "Size run"
      && finding.message === "The recipe declares no sizes.")).toBe(true);
    expect(result.predictions.every((pom) => pom.values.length === 0)).toBe(true);
  });

  it("does not replace missing or non-finite pattern values when grading fails", () => {
    const recipe = GARMENTS[0]!;
    const throwingRecipe = { ...recipe, draft: () => { throw "unavailable inputs"; } } as GarmentRecipe;
    const result = evaluate(recipe, { recipeOverride: throwingRecipe });
    expect(result.findings.some((finding) => finding.message.includes("Pattern calculation failed"))).toBe(true);
    expect(result.predictions.every((pom) => pom.values.every((value) => value.value === null))).toBe(true);

    const nonFiniteRecipe = { ...recipe, poms: [{ ...recipe.poms[0]!, measure: () => Number.POSITIVE_INFINITY }, ...recipe.poms.slice(1)] };
    const nonFinite = evaluate(recipe, { recipeOverride: nonFiniteRecipe });
    expect(nonFinite.findings.some((finding) => finding.field === "Pattern prediction" && finding.message.includes("not finite"))).toBe(true);
  });

  it("rejects sourced runs whose size order or base does not match the active recipe", () => {
    const recipe = GARMENTS[0]!;
    const definitions = recipe.poms.map((pom, index) => {
      const current = definition(recipe, pom.label, index);
      if (index !== 0) return current;
      return {
        ...current,
        sizeRangeSource: confirmed({ rangeLabel: "Mismatched", sizeIds: [...recipe.sizes].reverse().map((size) => size.label), baseSizeId: "XS" }),
      };
    });
    const result = evaluate(recipe, { data: dataFor(recipe, definitions) });
    expect(result.findings.some((finding) => finding.field === "Size run" && finding.message.includes("does not match the recipe run"))).toBe(true);
    expect(result.findings.some((finding) => finding.field === "Base size" && finding.message.includes("does not match the recipe base"))).toBe(true);
  });

  it("rejects a source range with a base size outside that range", () => {
    const recipe = GARMENTS[0]!;
    const definitions = recipe.poms.map((pom, index) => {
      const current = definition(recipe, pom.label, index);
      return index === 0 ? {
        ...current,
        sizeRangeSource: confirmed({ rangeLabel: "Malformed", sizeIds: ["XS", "S"], baseSizeId: "M" }),
      } : current;
    });
    const result = evaluate(recipe, { data: dataFor(recipe, definitions) });
    expect(result.findings.some((finding) => finding.message.includes("base size is not a member"))).toBe(true);
  });

  it("reports a POM measurement exception as an actionable prediction issue", () => {
    const recipe = GARMENTS[0]!;
    const throwingPom = { ...recipe.poms[0]!, measure: () => { throw new Error("missing point mark"); } };
    const recipeOverride = { ...recipe, poms: [throwingPom, ...recipe.poms.slice(1)] };
    const result = evaluate(recipe, { recipeOverride });
    expect(result.findings.some((finding) => finding.message.includes("missing point mark")
      && finding.nextAction.includes("no value was substituted"))).toBe(true);
  });
});
