import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, blockPieces, defaultGarmentOptions } from "../drafting";
import { gradedMarkerForRun, exportProjectorSvg, exportTechPackV2ForGradePlan } from "../export";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_APPEARANCE } from "./appearance";
import { createMeasurementCaptureSession } from "./measurement-capture";
import type { MeasurementCaptureRecord, StyleRecord } from "./project-records";
import { DEFAULT_WORKSPACE, defaultStretchFabricForGarment, deserialize, serialize } from "./persist";
import {
  approveGradePlan, configureGradePlan, createGradePlanDraft, reviewGradePlan, setGradePlanDelta,
  type GradePlanRecord,
} from "./grade-plan";
import { createGradePlanContext, type GradePlanContext } from "./grade-plan-context";
import { evaluateGradePlanRun } from "./grade-plan-run";

const PROJECT_ID = "0f8b8e2a-7c1d-4a5e-9b3f-2d6c8a1e4f70";
const STYLE_ID = "5a1c3e7b-2f4d-4e6a-8c9b-1d3f5a7c9e0b";
const HEAD_ID = "c3d5e7f9-1a2b-4c3d-a4e5-f6a7b8c9d0e1";
const T0 = "2026-09-27T08:00:00.000Z";
const T1 = "2026-09-27T08:01:00.000Z";
const T2 = "2026-09-27T08:02:00.000Z";
const T3 = "2026-09-27T08:03:00.000Z";
const T4 = "2026-09-27T08:04:00.000Z";

function styleFor(recipeId = "tee"): StyleRecord {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const result = deserialize(serialize(STANDARD_M, "#3A4150", {
    [recipeId]: defaultGarmentOptions(recipe.options ?? []),
  }, {
    ...DEFAULT_WORKSPACE, garment: recipeId, targetStyle: recipe.styles[0]!.name,
    stretchFabric: defaultStretchFabricForGarment(recipeId), exportStep: 0, nestScope: "single",
  }, DEFAULT_APPEARANCE));
  if (!result.ok) throw new Error(result.error);
  const { ok: _ok, ...design } = result;
  return {
    schemaVersion: 5, id: STYLE_ID, projectId: PROJECT_ID, name: "Custom base", recipeId,
    recipePresetId: design.workspace.targetStyle, createdAt: T0, updatedAt: T0, revision: 1,
    archivedAt: null, revisionHeadId: HEAD_ID, sizeMode: "custom-one-size", design,
  };
}

function captureFor(recipeId: string): MeasurementCaptureRecord {
  return {
    schemaVersion: 1, styleId: STYLE_ID, projectId: PROJECT_ID, recipeId, revision: 4,
    updatedAt: T0, session: createMeasurementCaptureSession(STYLE_ID, recipeId, T0), drafts: [],
  };
}

function unwrap<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly errors: readonly string[] }): T {
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.value;
}

async function fixture(recipeId = "tee"): Promise<{ recipe: typeof GARMENTS[number]; style: StyleRecord; context: GradePlanContext; plan: GradePlanRecord }> {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const style = styleFor(recipeId);
  const context = unwrap(await createGradePlanContext(PROJECT_ID, style, captureFor(recipeId)));
  let plan = unwrap(createGradePlanDraft(context.binding, context.targets, T0));
  const sizes = [{ label: "S", position: -1 }, { label: "M", position: 0 }, { label: "L", position: 1 }];
  plan = unwrap(configureGradePlan(plan, {
    basis: { kind: "user-authored-digital-rule", decision: "Digital fixture only", digitalRange: "S-L" },
    declaredRange: "S-L; no physical fit claim", baseSizeLabel: "M", sizes, exceptions: [],
  }, T1));
  for (const target of plan.targets) {
    plan = unwrap(setGradePlanDelta(plan, target.targetId, "S", 0, T2));
    plan = unwrap(setGradePlanDelta(plan, target.targetId, "L", 0, T2));
  }
  plan = unwrap(reviewGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T3));
  plan = unwrap(approveGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
  return { recipe, style, context, plan };
}

describe("approved grade-plan drafting and exact reconciliation", () => {
  it("drafts each explicit size from authored inputs for all seven recipes without using legacy grades", async () => {
    for (const recipe of GARMENTS) {
      const values = await fixture(recipe.name);
      const recipeWithoutLegacyGradeAccess = { ...values.recipe, grade: new Proxy(values.recipe.grade, {
        ownKeys: () => { throw new Error("custom plan must not consult legacy grade rules"); },
      }) };
      const result = evaluateGradePlanRun(recipeWithoutLegacyGradeAccess, values.style.design.measurements,
        values.style.design.garmentOptions[recipe.name] ?? {}, values.plan, values.context);
      expect(result.recipeId).toBe(recipe.name);
      expect(result.approved).toBe(true);
      expect(result.sizes).toHaveLength(3);
      expect(result.sizes.map((size) => size.label)).toEqual(["S", "M", "L"]);
      expect(result.sizes.every((size) => size.block !== null)).toBe(true);
      expect(result.sizes.every((size) => size.poms.length === recipe.poms.length)).toBe(true);
      expect(result.wholeRunReady).toBe(true);
    }
  });

  it("parses Tech Pack and Projector outputs and reconciles cutting pieces for all seven declared runs", async () => {
    for (const recipe of GARMENTS) {
      const values = await fixture(recipe.name);
      const result = evaluateGradePlanRun(recipe, values.style.design.measurements,
        values.style.design.garmentOptions[recipe.name] ?? {}, values.plan, values.context);
      expect(result.wholeRunReady).toBe(true);
      const run = result.sizes.map((size) => ({
        label: size.label, measurements: size.measurements!, options: size.options!, block: size.block!,
      }));
      const techPack = exportTechPackV2ForGradePlan(recipe, run, undefined, undefined, [], "Grade plan test",
        values.plan.baseSizeLabel!);
      const parsedTechPack = await PDFDocument.load(new TextEncoder().encode(techPack), { updateMetadata: false });
      expect(parsedTechPack.getPageCount()).toBeGreaterThan(run.length);
      for (const size of run) expect(techPack).toContain(`${recipe.label} - ${size.label}`);

      const projectorRun = result.sizes.map((size) => ({
        label: size.label, step: size.position, block: size.block!, allowances: recipe.allowances,
      }));
      const projector = exportProjectorSvg(recipe, values.style.design.measurements,
        values.style.design.garmentOptions[recipe.name] ?? {}, projectorRun);
      for (const size of result.sizes) expect(projector).toContain(`inkscape:label="Size ${size.label}"`);

      const marker = gradedMarkerForRun(recipe, result.sizes.map((size) => ({
        label: size.label, block: size.block!, allowances: recipe.allowances,
      })), 150);
      const expectedPieceCount = result.sizes.reduce((count, size) => count + blockPieces(size.block!).length, 0);
      expect(marker.placed).toHaveLength(expectedPieceCount);
      for (const size of result.sizes) {
        expect(marker.placed.some((piece) => piece.name.startsWith(`${size.label} `))).toBe(true);
      }
    }
  });

  it("blocks exact POM mismatches after nonzero inputs and option deltas from an off-center base", async () => {
    for (const recipe of GARMENTS) {
      const values = await fixture(recipe.name);
      const required = values.plan.targets;
      const sizes = [{ label: "S", position: 0 }, { label: "M", position: 1 }, { label: "L", position: 2 }];
      let plan = unwrap(configureGradePlan(values.plan, {
        basis: values.plan.basis!, declaredRange: values.plan.declaredRange,
        baseSizeLabel: "S", sizes, exceptions: [],
      }, T4));
      for (const target of required.filter((entry) => entry.kind !== "pom")) {
        if (target.kind === "measurement") {
          plan = unwrap(setGradePlanDelta(plan, target.targetId, "M", 1, T4));
          plan = unwrap(setGradePlanDelta(plan, target.targetId, "L", 2, T4));
        } else {
          const definition = recipe.options!.find((option) => option.id === target.targetId.slice(`option.${recipe.name}.`.length))!;
          const plus = target.baseValue + definition.step <= definition.max;
          const unit = plus ? definition.step : -definition.step;
          plan = unwrap(setGradePlanDelta(plan, target.targetId, "M", unit, T4));
          plan = unwrap(setGradePlanDelta(plan, target.targetId, "L", plus && target.baseValue + 2 * definition.step <= definition.max
            ? 2 * definition.step : unit, T4));
        }
      }
      for (const target of required.filter((entry) => entry.kind === "pom")) {
        plan = unwrap(setGradePlanDelta(plan, target.targetId, "M", 0, T4));
        plan = unwrap(setGradePlanDelta(plan, target.targetId, "L", 0, T4));
      }
      const optionTarget = required.find((target) => target.kind === "option");
      plan = unwrap(reviewGradePlan(plan, required.map((target) => target.targetId), values.context.binding, T4));
      plan = unwrap(approveGradePlan(plan, required.map((target) => target.targetId), values.context.binding, T4));
      const result = evaluateGradePlanRun(recipe, values.style.design.measurements,
        values.style.design.garmentOptions[recipe.name] ?? {}, plan, values.context);
      // The POM targets remain independently authored as unchanged from the
      // base (zero deltas). They are deliberately not back-filled from the
      // geometry produced by this same evaluator; changed inputs must expose
      // mismatches and block whole-run release.
      expect(result.wholeRunReady).toBe(false);
      expect(result.sizes[0]!.position).toBe(0);
      expect(result.sizes[0]!.measurements).toEqual(values.style.design.measurements);
      expect(result.sizes[0]!.options).toEqual(values.style.design.garmentOptions[recipe.name] ?? {});
      expect(JSON.stringify(result.sizes[0]!.block)).toBe(JSON.stringify(recipe.draft(
        values.style.design.measurements, values.style.design.garmentOptions[recipe.name] ?? {},
      )));
      expect(result.sizes[1]!.measurements).not.toEqual(result.sizes[0]!.measurements);
      expect(result.sizes[2]!.measurements).not.toEqual(result.sizes[1]!.measurements);
      expect(result.sizes[0]!.ready).toBe(true);
      expect(result.sizes.slice(1).every((size) => !size.ready)).toBe(true);
      expect(result.sizes.flatMap((size) => size.poms).some((pom) => !pom.matches)).toBe(true);
      for (const size of result.sizes) {
        for (const pom of size.poms) {
          expect(pom.matches).toBe(pom.expected === pom.actual);
          expect(pom.difference).toBe(pom.actual === null || pom.expected === null ? null : pom.actual - pom.expected);
        }
      }
      if (optionTarget) expect(result.sizes[1]!.options).not.toEqual(result.sizes[0]!.options);
    }
  });

  it("blocks when no approved current plan or a current target catalog is unavailable", async () => {
    const { recipe, style, context, plan } = await fixture();
    expect(evaluateGradePlanRun(recipe, style.design.measurements, {}, null, context)).toMatchObject({
      recipeId: recipe.name, approved: false, wholeRunReady: false, sizes: [],
    });
    expect(evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, null).issues[0])
      .toContain("base could not be verified");
    const changed = { ...context, targets: context.targets.map((target, index) => index === 0
      ? { ...target, baseValue: target.baseValue + 1 } : target) };
    expect(evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, changed).issues.join(" "))
      .toContain("target catalog or base values changed");
    const missingTarget = { ...context, targets: context.targets.slice(1) };
    expect(evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, missingTarget).issues.join(" "))
      .toContain("target catalog or base values changed");
    const wrongRecipe = { ...recipe, name: "different-recipe" } as typeof recipe;
    expect(evaluateGradePlanRun(wrongRecipe, style.design.measurements, {}, plan, context).issues.join(" "))
      .toContain("not current and approved");
  });

  it("requires exact raw POM equality and reports the target, generated value, and difference", async () => {
    const { recipe, style, context, plan: original } = await fixture();
    const firstPom = original.targets.find((target) => target.kind === "pom")!;
    let plan = original;
    plan = unwrap(setGradePlanDelta(plan, firstPom.targetId, "S", 0.01, T4));
    plan = unwrap(reviewGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    plan = unwrap(approveGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    const result = evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, context);
    expect(result.wholeRunReady).toBe(false);
    const pom = result.sizes[0]!.poms.find((entry) => entry.targetId === firstPom.targetId)!;
    expect(pom).toMatchObject({ expected: firstPom.baseValue + 0.01, difference: expect.any(Number), matches: false });
    expect(result.sizes[0]!.issues.join(" ")).toContain("target");
  });

  it("blocks out-of-range inputs and unsupported measurement exceptions without clamping", async () => {
    const { recipe, style, context, plan: original } = await fixture();
    const chest = original.targets.find((target) => target.targetId === "measurement.chest")!;
    let plan = unwrap(setGradePlanDelta(original, chest.targetId, "S", -200, T4));
    plan = unwrap(reviewGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    plan = unwrap(approveGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    const invalid = evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, context).sizes[0]!;
    expect(invalid.block).toBeNull();
    expect(invalid.issues.join(" ")).toContain("outside the supported");

    let exceptionPlan = unwrap(configureGradePlan(original, {
      basis: original.basis!, declaredRange: original.declaredRange, baseSizeLabel: original.baseSizeLabel,
      sizes: original.sizes, exceptions: [{ targetId: chest.targetId, sizeLabel: "S", reason: "not provided" }],
    }, T4));
    for (const target of exceptionPlan.targets) {
      exceptionPlan = unwrap(setGradePlanDelta(exceptionPlan, target.targetId, "S", target.targetId === chest.targetId ? null : 0, T4));
    }
    exceptionPlan = unwrap(reviewGradePlan(exceptionPlan, context.targets.map((target) => target.targetId), context.binding, T4));
    exceptionPlan = unwrap(approveGradePlan(exceptionPlan, context.targets.map((target) => target.targetId), context.binding, T4));
    expect(evaluateGradePlanRun(recipe, style.design.measurements, {}, exceptionPlan, context).sizes[0]!.issues.join(" "))
      .toContain("leaves a required drafting input unresolved");
  });

  it("identifies POM not-applicable exceptions and permits only that output row with its reason", async () => {
    const { recipe, style, context, plan: original } = await fixture();
    const pomTarget = original.targets.find((target) => target.kind === "pom")!;
    let plan = unwrap(configureGradePlan(original, {
      basis: original.basis!, declaredRange: original.declaredRange, baseSizeLabel: original.baseSizeLabel,
      sizes: original.sizes,
      exceptions: [{ targetId: pomTarget.targetId, sizeLabel: "S", reason: "Feature is absent at this size." }],
    }, T4));
    for (const target of plan.targets) {
      plan = unwrap(setGradePlanDelta(plan, target.targetId, "S", target.targetId === pomTarget.targetId ? null : 0, T4));
    }
    plan = unwrap(reviewGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    plan = unwrap(approveGradePlan(plan, context.targets.map((target) => target.targetId), context.binding, T4));
    const result = evaluateGradePlanRun(recipe, style.design.measurements, {}, plan, context);
    expect(result.sizes[0]!.poms.find((entry) => entry.targetId === pomTarget.targetId)).toMatchObject({
      expected: null, actual: null, exceptionReason: "Feature is absent at this size.", matches: false,
    });
    expect(result.sizes[0]!.ready).toBe(true);
  });

  it("rejects unsupported option increments, drafting failures, recipe geometry failures and edit replay errors", async () => {
    const { recipe, style, context, plan: original } = await fixture("woven-shirt");
    const optionTarget = original.targets.find((target) => target.kind === "option")!;
    let optionPlan = unwrap(setGradePlanDelta(original, optionTarget.targetId, "S", 0.25, T4));
    optionPlan = unwrap(reviewGradePlan(optionPlan, context.targets.map((target) => target.targetId), context.binding, T4));
    optionPlan = unwrap(approveGradePlan(optionPlan, context.targets.map((target) => target.targetId), context.binding, T4));
    expect(evaluateGradePlanRun(recipe, style.design.measurements, style.design.garmentOptions[recipe.name]!, optionPlan, context)
      .sizes[0]!.issues.join(" ")).toContain("range or increment");

    const tee = await fixture();
    const throwing = { ...tee.recipe, draft: () => { throw new Error("draft failed"); } };
    expect(evaluateGradePlanRun(throwing, tee.style.design.measurements, {}, tee.plan, tee.context).sizes[0]!.issues.join(" "))
      .toContain("draft failed");
    const failedChecks = { ...tee.recipe, checks: () => [{ name: "shape", ok: false, detail: "invalid" }] };
    expect(evaluateGradePlanRun(failedChecks, tee.style.design.measurements, {}, tee.plan, tee.context).sizes[0]!.issues.join(" "))
      .toContain("shape — invalid");
    const adjusted = evaluateGradePlanRun(tee.recipe, tee.style.design.measurements, {}, tee.plan, tee.context,
      (_size, _measurements, _options, block) => ({ block, issues: ["anchor missing"] }));
    expect(adjusted.sizes[0]!.issues.join(" ")).toContain("anchor missing");
  });

  it("blocks absent or unsupported target rows and reports POM measurement failures", async () => {
    const tee = await fixture();
    const firstPom = tee.plan.targets.find((target) => target.kind === "pom")!;
    const recipeWithoutPom = { ...tee.recipe, poms: tee.recipe.poms.filter((pom) =>
      `pom.${tee.recipe.name}.${encodeURIComponent(pom.label)}` !== firstPom.targetId) };
    const missingPom = evaluateGradePlanRun(recipeWithoutPom, tee.style.design.measurements, {}, tee.plan, tee.context);
    expect(missingPom.sizes[0]!.issues.join(" ")).toContain("no computable target and drafted POM");

    const unsupportedMeasurement = { ...tee.recipe, fields: tee.recipe.fields.filter((field) => field !== "chest") };
    expect(evaluateGradePlanRun(unsupportedMeasurement, tee.style.design.measurements, {}, tee.plan, tee.context)
      .sizes[0]!.issues.join(" ")).toContain("not a current input");

    const throwingPom = { ...tee.recipe, poms: tee.recipe.poms.map((pom, index) => index === 0
      ? { ...pom, measure: () => { throw new Error("POM unavailable"); } } : pom) };
    expect(evaluateGradePlanRun(throwingPom, tee.style.design.measurements, {}, tee.plan, tee.context)
      .sizes[0]!.issues.join(" ")).toContain("POM unavailable");
    const nonErrorDraft = { ...tee.recipe, draft: () => { throw "draft unavailable"; } };
    expect(evaluateGradePlanRun(nonErrorDraft, tee.style.design.measurements, {}, tee.plan, tee.context)
      .sizes[0]!.issues.join(" ")).toContain("drafting failed");
    const nonErrorPom = { ...tee.recipe, poms: tee.recipe.poms.map((pom, index) => index === 0
      ? { ...pom, measure: () => { throw "POM unavailable"; } } : pom) };
    expect(evaluateGradePlanRun(nonErrorPom, tee.style.design.measurements, {}, tee.plan, tee.context)
      .sizes[0]!.issues.join(" ")).toContain("POM could not be measured");

    const measurement = tee.plan.targets.find((target) => target.targetId === "measurement.chest")!;
    const infinitePlan = { ...tee.plan, targets: tee.plan.targets.map((target) => target.targetId === measurement.targetId
      ? { ...target, baseValue: Number.POSITIVE_INFINITY } : target) } as GradePlanRecord;
    const infiniteContext = { ...tee.context, targets: tee.context.targets.map((target) => target.targetId === measurement.targetId
      ? { ...target, baseValue: Number.POSITIVE_INFINITY } : target) };
    expect(evaluateGradePlanRun(tee.recipe, tee.style.design.measurements, {}, infinitePlan, infiniteContext)
      .sizes[0]!.issues.join(" ")).toContain("is not finite");

    const woven = await fixture("woven-shirt");
    const option = woven.plan.targets.find((target) => target.kind === "option")!;
    const renamedOptionId = `option.${woven.recipe.name}.unsupported-control`;
    const unsupportedPlan = { ...woven.plan, targets: woven.plan.targets.map((target) => target.targetId === option.targetId
      ? { ...target, targetId: renamedOptionId } : target) } as GradePlanRecord;
    const unsupportedContext = { ...woven.context, targets: woven.context.targets.map((target) => target.targetId === option.targetId
      ? { ...target, targetId: renamedOptionId } : target) };
    expect(evaluateGradePlanRun(woven.recipe, woven.style.design.measurements, {}, unsupportedPlan, unsupportedContext)
      .sizes[0]!.issues.join(" ")).toContain("not a current control");
    const invalidIncrement = { ...woven.recipe, options: woven.recipe.options!.map((entry) => entry.id === option.targetId.slice(`option.${woven.recipe.name}.`.length)
      ? { ...entry, step: 0 } : entry) };
    expect(evaluateGradePlanRun(invalidIncrement, woven.style.design.measurements, {}, woven.plan, woven.context)
      .sizes[0]!.issues.join(" ")).toContain("range or increment");
  });
});
