// The measurement controls, kept as pure logic: the list of fields, and the
// rules for turning what a person types into a valid measurement. No DOM here,
// so every rule is tested directly.

import { Measurements } from "../drafting";

export interface Field {
  readonly id: keyof Measurements;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const FIELDS: readonly Field[] = [
  { id: "chest", label: "Chest", min: 60, max: 160, step: 1 },
  { id: "shoulderWidth", label: "Shoulder width", min: 30, max: 70, step: 1 },
  { id: "bicep", label: "Bicep", min: 20, max: 60, step: 1 },
  { id: "length", label: "Length", min: 40, max: 100, step: 1 },
  { id: "armholeDepth", label: "Armhole depth", min: 12, max: 40, step: 1 },
  { id: "sleeveLength", label: "Sleeve length", min: 8, max: 70, step: 1 },
  { id: "waist", label: "Waist", min: 50, max: 140, step: 1 },
  { id: "hip", label: "Hip", min: 60, max: 150, step: 1 },
  { id: "hipDepth", label: "Hip depth", min: 10, max: 40, step: 1 },
  { id: "ease", label: "Ease", min: 0, max: 30, step: 1 },
  // Slice 63 — sleeveless-only fields (today: the tank). Ranges wider than
  // MEASUREMENT_BOUNDS's "usual" band, same convention as every field above.
  { id: "strapWidth", label: "Strap width", min: 3, max: 30, step: 0.5 },
  { id: "neckDrop", label: "Neck scoop depth", min: 0, max: 18, step: 0.5 },
];

/** Keep a number within [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Apply a typed-in value to the measurements. Non-numeric input is ignored
 * (the measurements are returned unchanged); valid input is clamped to the
 * field's range. Always returns a new object — the original is never mutated.
 */
export function applyChange(m: Measurements, field: Field, raw: string): Measurements {
  const n = Number(raw);
  if (Number.isNaN(n)) return m;
  return { ...m, [field.id]: clamp(n, field.min, field.max) };
}
