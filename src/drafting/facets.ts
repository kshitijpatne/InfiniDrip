// Body vs finished — so a displayed measurement is never ambiguous.
// "Chest 100" means nothing on its own: is that the wearer's body, or the shirt?
// Each raw field is either a BODY measurement (taken off a person; the garment may
// add ease) or a FINISHED dimension (a garment size chosen directly). Where ease
// turns a body number into a garment one, the finished value can be shown too.
//
// Every classification below traces to how the draft actually USES the number:
//   chest         — draft width is (chest + ease)/4  → BODY, full ease around it
//   bicep         — sleeve width is bicep + ease*0.5 → BODY, half ease around it
//   shoulderWidth — used directly (shoulderWidth/2)  → BODY, no ease
//   length, armholeDepth, sleeveLength — used as garment coordinates → FINISHED

import { Measurements } from "./measurements";

export type MeasureRole = "body" | "finished";

export interface MeasureFacet {
  readonly role: MeasureRole;
  readonly circumference: boolean; // a girth (show "circ") vs a flat length
  readonly finished?: number;      // present only when ease makes it differ from the entered value
}

type RawField = Exclude<keyof Measurements, "ease">;

/** Value-independent classification per field. `ease` is a parameter, not a
 *  measurement, so it is deliberately absent. */
export const MEASURE_ROLE: Record<RawField, { role: MeasureRole; circumference: boolean }> = {
  chest: { role: "body", circumference: true },
  bicep: { role: "body", circumference: true },
  shoulderWidth: { role: "body", circumference: false },
  waist: { role: "body", circumference: true },
  hip: { role: "body", circumference: true },
  length: { role: "finished", circumference: false },
  armholeDepth: { role: "finished", circumference: false },
  sleeveLength: { role: "finished", circumference: false },
};

/** The finished (garment) value where ease changes it; undefined otherwise. Mirrors
 *  exactly how the draft consumes ease — chest gains full ease around the body, the
 *  sleeve gains half the ease around the bicep. */
function finishedOf(m: Measurements, field: RawField): number | undefined {
  if (field === "chest") return m.chest + m.ease;
  if (field === "bicep") return m.bicep + m.ease * 0.5;
  return undefined;
}

/** Body-vs-finished facet for one field, with the finished value filled in where
 *  ease applies. The exposed datum a UI renders — it never recomputes ease itself. */
export function measurementFacet(m: Measurements, field: RawField): MeasureFacet {
  const base = MEASURE_ROLE[field];
  const finished = finishedOf(m, field);
  return finished === undefined ? base : { ...base, finished };
}

/** A short label for a field ("body · circ", "finished"), or null for a non-
 *  measurement parameter like ease. Static — depends on the field, not its value. */
export function roleTag(field: string): string | null {
  if (!(field in MEASURE_ROLE)) return null;
  const f = MEASURE_ROLE[field as RawField];
  return f.role + (f.circumference ? " · circ" : "");
}
