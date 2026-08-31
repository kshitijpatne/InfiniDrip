// The Fit Validation Loop's pure core (Slice 45).
//
// The checker (garment-check.ts) verifies SEWABILITY — do seam lengths agree,
// is the hem square. It has never verified FIT, and says so honestly. This
// module is what closes that gap: a garment is exported, sewn, measured by
// hand, and the real numbers are compared against what the engine predicted.
//
// Two pure functions, no UI:
//   sampleSpec(recipe, m)          — every POM's predicted value at the exact
//                                     block that gets cut (recipe.draft(m), the
//                                     same block the tech-pack sketch draws).
//   compareFit(predicted, actual)  — per-POM delta + pass/fail against the
//                                     POM's own declared tolerance.
//
// There is deliberately no in-app field to type "actual" measurements back in
// yet. The loop closes on paper: print the Fit Record page (export/techpack.ts),
// sew the sample size, measure it, and run the numbers through compareFit by
// hand. Every later garment block reuses this same harness.

import { GarmentRecipe } from "./recipe";
import { Measurements } from "./measurements";

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** One POM's predicted value at the sample (base) size, with its tolerance. */
export interface PredictedPom {
  readonly label: string;
  readonly value: number; // cm, rounded to 0.1 — matches the printed Fit Record
  readonly tolerance?: number; // cm, ± — same field as Pom.tolerance
}

/**
 * Every POM's predicted value, read off the SAME block the tech-pack sketch and
 * Fit Record page draw: `recipe.draft(m)`, the sample size. One source, so the
 * sketch, the printed sheet, and this comparator can never quietly disagree.
 */
export function sampleSpec(recipe: GarmentRecipe, m: Measurements): PredictedPom[] {
  const block = recipe.draft(m);
  return recipe.poms.map((pom) => ({
    label: pom.label,
    value: round1(pom.measure(block)),
    tolerance: pom.tolerance,
  }));
}

/** One POM's real-world result: what was predicted vs what the sewn garment measured. */
export interface FitResult {
  readonly label: string;
  readonly predicted: number;
  readonly actual: number;
  readonly delta: number; // actual - predicted, cm (negative = ran small)
  readonly tolerance?: number;
  /**
   * true/false when the POM has a declared tolerance; null when it doesn't —
   * we never invent a pass/fail on a number the recipe wasn't given a
   * tolerance for, the same honesty rule the printed tolerance column follows.
   */
  readonly withinTolerance: boolean | null;
}

/**
 * Compare a sewn garment's real measurements against the predicted spec.
 * `actual` is keyed by POM label — the same labels printed on the Fit Record
 * sheet, so transcribing the sheet by hand is the whole integration.
 *
 * Throws if `actual` is missing a label the spec predicted: a silent
 * `undefined` comparison would report a false pass, which is worse than
 * refusing to report anything for that POM.
 */
export function compareFit(
  predicted: readonly PredictedPom[],
  actual: Readonly<Record<string, number>>
): FitResult[] {
  return predicted.map((p) => {
    const a = actual[p.label];
    if (a === undefined) {
      throw new Error(`No actual measurement recorded for "${p.label}"`);
    }
    const delta = round1(a - p.value);
    return {
      label: p.label,
      predicted: p.value,
      actual: a,
      delta,
      tolerance: p.tolerance,
      withinTolerance: p.tolerance === undefined ? null : Math.abs(delta) <= p.tolerance,
    };
  });
}
