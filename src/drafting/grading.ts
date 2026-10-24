// Grading — the crown jewel, and almost free.
//
// A graded size run is NOT special pattern math. It's the existing pure engine
// run in a loop: take the user's measurements as the BASE size, nudge them up and
// down by a per-size increment, and re-draft. One `draftTshirt` call per size.
//
//   base measurements  ──(+ grade deltas per size)──►  one Measurements per size
//                       ──(draftTshirt each)────────►  one TshirtBlock per size
//
// Because every size is a real re-draft, notches/grainlines/seam-allowance all
// regrade automatically (they're rules on live geometry, not saved points), and
// the user's ease carries through untouched — ease is never in the grade table.

import { Measurements } from "./measurements";
import { Block } from "./block";
import { GarmentOptions } from "./options";

/** One size's position in the run: 0 = base, -1 a size down, +1 a size up. */
export interface SizeStep {
  readonly label: string;
  readonly step: number;
}

/** cm added per +1 size step, per measurement. Omitted fields (e.g. ease) don't grade. */
export type GradeRule = Partial<Record<keyof Measurements, number>>;

export interface GradedSize {
  readonly label: string;
  readonly step: number;
  readonly measurements: Measurements;
  readonly block: Block;
}

/** Context for resolving recipe-owned numeric options at a graded size. */
export interface GradeOptionResolutionContext {
  readonly baseMeasurements: Measurements;
  readonly sizeMeasurements: Measurements;
  readonly step: number;
  readonly draft: (m: Measurements, options?: GarmentOptions) => Block;
  readonly baseOptions: GarmentOptions;
}

/**
 * Optional recipe rule for deriving non-base-size options from the explicit
 * base-size options. The callback receives the original draft so it can use
 * real recipe geometry; it owns validation and actionable error reporting.
 */
export type GradeOptionResolver = (context: GradeOptionResolutionContext) => GarmentOptions;

/** Apply a grade rule to the base at a given step (step 0 returns the base as-is). */
export function gradeMeasurements(
  base: Measurements,
  rule: GradeRule,
  step: number
): Measurements {
  const out = { ...base } as { -readonly [K in keyof Measurements]: number };
  (Object.keys(rule) as (keyof Measurements)[]).forEach((key) => {
    out[key] = base[key] + (rule[key] as number) * step;
  });
  return out;
}

/**
 * Draft one garment at one size step — the base measurements nudged by the grade,
 * then re-drafted. This is the single size that per-size export downloads, and it
 * is exactly what `gradeRun` produces for that step, so every view agrees on what
 * a size is.
 */
export function draftAtSize(
  base: Measurements,
  rule: GradeRule,
  step: number,
  draft: (m: Measurements, options?: GarmentOptions) => Block,
  options: GarmentOptions = {},
  resolveOptionsForSize?: GradeOptionResolver,
): Block {
  const measurements = gradeMeasurements(base, rule, step);
  const resolvedOptions = resolveOptionsForSize && step !== 0
    ? resolveOptionsForSize({
      baseMeasurements: base,
      sizeMeasurements: measurements,
      step,
      draft,
      baseOptions: options,
    })
    : options;
  return draft(measurements, resolvedOptions);
}

/**
 * Re-draft the engine across a whole size run, anchored on `base`.
 * Returns one entry per size, in the order the steps are given.
 */
export function gradeRun(
  base: Measurements,
  rule: GradeRule,
  sizes: readonly SizeStep[],
  draft: (m: Measurements, options?: GarmentOptions) => Block,
  options: GarmentOptions = {},
  resolveOptionsForSize?: GradeOptionResolver,
): GradedSize[] {
  return sizes.map((s) => {
    const measurements = gradeMeasurements(base, rule, s.step);
    return {
      label: s.label,
      step: s.step,
      measurements,
      block: draftAtSize(base, rule, s.step, draft, options, resolveOptionsForSize),
    };
  });
}
