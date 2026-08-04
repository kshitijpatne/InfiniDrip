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
import type { Note } from "./note";

interface Bound {
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

/** Absolute plausible range per raw measurement, in cm, for one adult garment. */
export const MEASUREMENT_BOUNDS: Partial<Record<keyof Measurements, Bound>> = {
  chest: { min: 60, max: 140, label: "Chest" },
  shoulderWidth: { min: 30, max: 60, label: "Shoulder width" },
  waist: { min: 50, max: 140, label: "Waist" },
  hip: { min: 60, max: 150, label: "Hip" },
  bicep: { min: 20, max: 55, label: "Bicep" },
  length: { min: 45, max: 95, label: "Length" },
  armholeDepth: { min: 15, max: 35, label: "Armhole depth" },
  sleeveLength: { min: 5, max: 70, label: "Sleeve length" },
};

/** The raw fields whose OWN value is outside its plausible bound, SCOPED to the
 *  fields this garment actually exposes (`recipe.fields`). A field the garment
 *  doesn't use — chest, on a skirt — sits frozen at its default and was never
 *  offered to the user to fix, so it must never be flagged. The single source of
 *  truth for "which inputs to flag" — used for the note text below and for the
 *  amber field outline in the UI. */
export function implausibleFields(
  m: Measurements,
  fields: readonly (keyof Measurements)[],
): (keyof Measurements)[] {
  return (Object.keys(MEASUREMENT_BOUNDS) as (keyof Measurements)[])
    .filter((key) => fields.includes(key))
    .filter((key) => {
      const b = MEASUREMENT_BOUNDS[key]!;
      return m[key] < b.min || m[key] > b.max;
    });
}

/** Warn for any raw measurement outside its plausible adult range — scoped to
 *  the garment's own fields (see implausibleFields). */
export function plausibilityChecks(
  m: Measurements,
  fields: readonly (keyof Measurements)[],
): Note[] {
  return implausibleFields(m, fields).map((key) => {
    const b = MEASUREMENT_BOUNDS[key]!;
    return {
      level: "warn" as const,
      text: `${b.label} (${m[key]} cm) is outside the usual range for an adult garment ` +
            `(${b.min}–${b.max} cm). Double-check the measurement.`,
    };
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

/** Warn when two measurements are implausible relative to each other — SCOPED to
 *  the garment's own fields. A ratio needs BOTH its fields exposed by the current
 *  garment; the tee's three ratios all lean on chest, so a garment that doesn't
 *  measure chest (a skirt) skips them rather than judging a frozen default. */
export function coherenceChecks(
  m: Measurements,
  fields: readonly (keyof Measurements)[],
): Note[] {
  return RATIO_BOUNDS.filter((r) => fields.includes(r.of) && fields.includes(r.per)).flatMap((r) => {
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

/** True when every sanity check passes — no out-of-range field and no bad ratio,
 *  both scoped to the garment's own fields. The one gate the UI reads to decide
 *  whether a green "validated" signal has earned the right to show. Geometric
 *  soundness is necessary but NOT sufficient: a set can sew together (garment-check
 *  ok) yet still be an impossible body. */
export function measurementsPlausible(
  m: Measurements,
  fields: readonly (keyof Measurements)[],
): boolean {
  return implausibleFields(m, fields).length === 0 && coherenceChecks(m, fields).length === 0;
}
