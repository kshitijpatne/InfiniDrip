// Plausibility & proportional coherence — the second and third tiers of guidance.
//
// The geometric checks (garment-check.ts) answer one question: "does this pattern
// sew together?" A chest of 160 cm sews together fine, so those checks stay silent
// while the draft is absurd. These two families answer what geometry can't:
//   • Plausibility — is each number sane for a real adult garment?
//   • Coherence    — are the numbers sane RELATIVE to each other?
// Both WARN, never clamp: the app cautions, the user decides (they might be drafting
// for a mascot costume — we flag, we don't forbid).
//
// WHERE THE NUMBERS COME FROM. There is no absolute size chart in the engine:
// grading is RELATIVE (per-step deltas around the user's own base), so it offers no
// ceiling or floor to read. These bounds are therefore declared here, seeded from
// published adult apparel size ranges and centred on STANDARD_M (the known-good
// sample). They are deliberately LOOSE — they catch the absurd (chest 160), not the
// merely unusual body. `ease` is omitted: easeRange already owns it.

import { Measurements } from "../drafting";
import type { Note } from "./guidance";

interface Bound {
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

/** Absolute plausible range per raw measurement, in cm, for one adult garment. */
export const MEASUREMENT_BOUNDS: Partial<Record<keyof Measurements, Bound>> = {
  chest: { min: 60, max: 140, label: "Chest" },
  shoulderWidth: { min: 30, max: 60, label: "Shoulder width" },
  bicep: { min: 20, max: 55, label: "Bicep" },
  length: { min: 45, max: 95, label: "Length" },
  armholeDepth: { min: 15, max: 35, label: "Armhole depth" },
  sleeveLength: { min: 5, max: 70, label: "Sleeve length" },
};

/** Warn for any raw measurement outside its plausible adult range. */
export function plausibilityChecks(m: Measurements): Note[] {
  return (Object.keys(MEASUREMENT_BOUNDS) as (keyof Measurements)[]).flatMap((key) => {
    const b = MEASUREMENT_BOUNDS[key]!;
    const v = m[key];
    if (v < b.min || v > b.max) {
      return [{
        level: "warn" as const,
        text: `${b.label} (${v} cm) is outside the usual range for an adult garment ` +
              `(${b.min}–${b.max} cm). Double-check the measurement.`,
      }];
    }
    return [];
  });
}

interface Ratio {
  readonly of: keyof Measurements;
  readonly per: keyof Measurements;
  readonly min: number;
  readonly max: number;
  readonly text: string;
}

// Proportional coherence: a body's parts scale together. A set can pass every
// absolute bound yet still be internally impossible — a narrow shoulder on a huge
// chest. Ratios are of/per, centred on STANDARD_M, with a generous band.
export const RATIO_BOUNDS: readonly Ratio[] = [
  { of: "shoulderWidth", per: "chest", min: 0.36, max: 0.54,
    text: "Shoulder width and chest look out of proportion" },
  { of: "length", per: "chest", min: 0.52, max: 0.90,
    text: "Body length and chest look out of proportion" },
  { of: "bicep", per: "chest", min: 0.28, max: 0.50,
    text: "Bicep and chest look out of proportion" },
];

/** Warn when two measurements are implausible relative to each other. */
export function coherenceChecks(m: Measurements): Note[] {
  return RATIO_BOUNDS.flatMap((r) => {
    const ratio = m[r.of] / m[r.per];
    if (ratio < r.min || ratio > r.max) {
      return [{
        level: "warn" as const,
        text: `${r.text} (ratio ${ratio.toFixed(2)}, usually ${r.min}–${r.max}). ` +
              `One of them may be off.`,
      }];
    }
    return [];
  });
}
