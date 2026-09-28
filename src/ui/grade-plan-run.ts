/** Plan-driven custom-style drafting. This module never consults legacy grade rules. */
import type { Block } from "../drafting/block";
import type { Measurements } from "../drafting/measurements";
import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe } from "../drafting/recipe";
import { FIELDS } from "./controls";
import {
  gradePlanCompletionIssues,
  gradePlanIsStale,
  type GradePlanRecord,
  type GradePlanTarget,
} from "./grade-plan";
import type { GradePlanContext } from "./grade-plan-context";

export interface GradePlanPomResult {
  readonly targetId: string;
  readonly label: string;
  readonly unit: string;
  readonly expected: number | null;
  readonly actual: number | null;
  readonly difference: number | null;
  readonly exceptionReason: string | null;
  readonly matches: boolean;
}

export interface GradePlanRunSize {
  readonly label: string;
  readonly position: number;
  readonly measurements: Measurements | null;
  readonly options: GarmentOptions | null;
  readonly block: Block | null;
  readonly poms: readonly GradePlanPomResult[];
  readonly issues: readonly string[];
  readonly ready: boolean;
}

export interface GradePlanRunEvaluation {
  readonly recipeId: GarmentRecipe["name"];
  readonly sizes: readonly GradePlanRunSize[];
  readonly issues: readonly string[];
  readonly approved: boolean;
  readonly wholeRunReady: boolean;
}

export type GradePlanBlockAdjustment = (
  size: { readonly label: string; readonly position: number },
  measurements: Measurements,
  options: GarmentOptions,
  block: Block,
) => { readonly block: Block; readonly issues: readonly string[] };

const key = (value: string): string => value.toLocaleLowerCase("en-US");

function planException(plan: GradePlanRecord, targetId: string, sizeLabel: string) {
  return plan.exceptions.find((entry) => entry.targetId === targetId && key(entry.sizeLabel) === key(sizeLabel));
}

function deltaFor(target: GradePlanTarget, sizeLabel: string): number | null {
  return target.deltas.find((entry) => key(entry.sizeLabel) === key(sizeLabel))?.deltaFromBase ?? null;
}

function sameTargetCatalog(plan: GradePlanRecord, context: GradePlanContext): boolean {
  if (plan.targets.length !== context.targets.length) return false;
  const expected = new Map(context.targets.map((target) => [target.targetId, target]));
  return plan.targets.every((target) => {
    const current = expected.get(target.targetId);
    return !!current && current.kind === target.kind && current.label === target.label
      && current.unit === target.unit && current.baseValue === target.baseValue;
  });
}

function inStepRange(value: number, min: number, max: number, step: number): boolean {
  if (!Number.isFinite(value) || value < min || value > max || !(step > 0)) return false;
  const position = (value - min) / step;
  return Math.abs(position - Math.round(position)) < 1e-8;
}

/**
 * Draft an approved plan's explicitly declared sizes and compare every POM to
 * its independent authored target. Exceptions are only supported for POMs;
 * an exception on a required measurement/control leaves an unresolved input.
 */
export function evaluateGradePlanRun(
  recipe: GarmentRecipe,
  baseMeasurements: Measurements,
  baseOptions: GarmentOptions,
  plan: GradePlanRecord | null,
  context: GradePlanContext | null,
  adjustBlock?: GradePlanBlockAdjustment,
): GradePlanRunEvaluation {
  const blockers: string[] = [];
  const approved = !!plan && !!context && plan.status === "approved"
    && !gradePlanIsStale(plan, context.binding)
    && plan.projectId === context.binding.projectId
    && plan.styleId === context.binding.styleId
    && plan.recipeId === recipe.name
    && context.binding.recipeId === recipe.name;
  if (!plan) blockers.push("Create and approve a grade plan before generating a size run.");
  else if (!context) blockers.push("The current grade-plan base could not be verified.");
  else if (!approved) blockers.push("The grade plan is not current and approved for this style and recipe.");
  if (plan && context) {
    blockers.push(...gradePlanCompletionIssues(plan, context.targets.map((target) => target.targetId)));
    if (!sameTargetCatalog(plan, context)) blockers.push("The approved target catalog or base values changed; refresh and review the plan again.");
  }
  if (!approved || !plan || !context || blockers.length > 0) {
    return { recipeId: recipe.name, sizes: [], issues: [...new Set(blockers)], approved, wholeRunReady: false };
  }

  const measurementFields = new Map(FIELDS.map((field) => [String(field.id), field]));
  const optionDefinitions = new Map((recipe.options ?? []).map((option) => [option.id, option]));
  const evaluated = plan.sizes.map((size): GradePlanRunSize => {
    const issues: string[] = [];
    const measurements = { ...baseMeasurements } as { -readonly [K in keyof Measurements]: number };
    const options: Record<string, number> = { ...baseOptions };
    for (const target of plan.targets) {
      if (target.kind === "pom") continue;
      const exception = planException(plan, target.targetId, size.label);
      const delta = deltaFor(target, size.label);
      if (exception || delta === null) {
        issues.push(`${target.label} at ${size.label} leaves a required drafting input unresolved.`);
        continue;
      }
      const value = target.baseValue + delta;
      if (!Number.isFinite(value)) {
        issues.push(`${target.label} at ${size.label} is not finite.`);
        continue;
      }
      if (target.kind === "measurement") {
        const field = measurementFields.get(target.targetId.slice("measurement.".length));
        if (!field || !(recipe.fields as readonly string[]).includes(String(field.id))) {
          issues.push(`${target.label} is not a current input for ${recipe.label}.`);
          continue;
        }
        if (value < field.min || value > field.max) {
          issues.push(`${target.label} at ${size.label} is outside the supported ${field.min}–${field.max} ${target.unit} input range.`);
          continue;
        }
        measurements[field.id] = value;
      } else {
        const optionId = target.targetId.slice(`option.${recipe.name}.`.length);
        const option = optionDefinitions.get(optionId);
        if (!option || target.targetId !== `option.${recipe.name}.${optionId}`) {
          issues.push(`${target.label} is not a current control for ${recipe.label}.`);
          continue;
        }
        if (!inStepRange(value, option.min, option.max, option.step)) {
          issues.push(`${target.label} at ${size.label} is outside its supported range or increment.`);
          continue;
        }
        options[option.id] = value;
      }
    }

    let block: Block | null = null;
    if (issues.length === 0) {
      try {
        block = recipe.draft(measurements, options);
        if (adjustBlock) {
          const adjusted = adjustBlock(size, measurements, options, block);
          block = adjusted.block;
          issues.push(...adjusted.issues.map((issue) => `${size.label}: ${issue}`));
        }
        for (const check of recipe.checks(block, measurements)) {
          if (!check.ok) issues.push(`${size.label}: ${check.name} — ${check.detail}`);
        }
      } catch (error) {
        issues.push(error instanceof Error ? `${size.label}: ${error.message}` : `${size.label}: drafting failed.`);
      }
    }
    const poms = plan.targets.filter((target) => target.kind === "pom").map((target): GradePlanPomResult => {
      const exception = planException(plan, target.targetId, size.label);
      const delta = deltaFor(target, size.label);
      if (exception) return {
        targetId: target.targetId, label: target.label, unit: target.unit,
        expected: null, actual: null, difference: null, exceptionReason: exception.reason, matches: false,
      };
      // A current complete approved plan has a numeric delta for every
      // applicable POM; incomplete rows exit at gradePlanCompletionIssues.
      const expected = target.baseValue + delta!;
      const pom = recipe.poms.find((candidate) => `pom.${recipe.name}.${encodeURIComponent(candidate.label)}` === target.targetId);
      if (!pom || !block || expected === null || !Number.isFinite(expected)) {
        issues.push(`${target.label} at ${size.label} has no computable target and drafted POM.`);
        return {
          targetId: target.targetId, label: target.label, unit: target.unit,
          expected, actual: null, difference: null, exceptionReason: null, matches: false,
        };
      }
      try {
        const actual = pom.measure(block);
        const difference = actual - expected;
        const matches = Number.isFinite(actual) && difference === 0;
        if (!matches) issues.push(`${target.label} at ${size.label}: target ${expected} ${target.unit}, generated ${actual} ${target.unit}, difference ${difference} ${target.unit}.`);
        return {
          targetId: target.targetId, label: target.label, unit: target.unit,
          expected, actual, difference, exceptionReason: null, matches,
        };
      } catch (error) {
        issues.push(error instanceof Error ? `${target.label} at ${size.label}: ${error.message}` : `${target.label} at ${size.label}: POM could not be measured.`);
        return {
          targetId: target.targetId, label: target.label, unit: target.unit,
          expected, actual: null, difference: null, exceptionReason: null, matches: false,
        };
      }
    });
    return {
      label: size.label,
      position: size.position,
      measurements: issues.some((issue) => issue.includes("leaves a required drafting input unresolved.")) ? null : measurements,
      options: issues.some((issue) => issue.includes("leaves a required drafting input unresolved.")) ? null : options,
      block,
      poms,
      issues: [...new Set(issues)],
      ready: block !== null && issues.length === 0
        && poms.every((pom) => pom.matches || pom.exceptionReason !== null),
    };
  });
  const allIssues = [...evaluated.flatMap((size) => size.issues)];
  return {
    recipeId: recipe.name,
    sizes: evaluated,
    issues: [...new Set(allIssues)],
    approved: true,
    wholeRunReady: evaluated.length > 0 && evaluated.every((size) => size.ready),
  };
}
