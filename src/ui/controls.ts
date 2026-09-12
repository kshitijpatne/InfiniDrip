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
  { id: "neck", label: "Neck", min: 25, max: 70, step: 0.5 },
  { id: "shoulderWidth", label: "Shoulder width", min: 30, max: 70, step: 1 },
  { id: "bicep", label: "Bicep", min: 20, max: 60, step: 1 },
  { id: "length", label: "Length", min: 40, max: 100, step: 1 },
  { id: "armholeDepth", label: "Armhole depth", min: 12, max: 40, step: 1 },
  { id: "sleeveLength", label: "Sleeve length", min: 8, max: 70, step: 1 },
  { id: "waist", label: "Waist", min: 50, max: 140, step: 1 },
  { id: "hip", label: "Hip", min: 60, max: 150, step: 1 },
  { id: "hipDepth", label: "Hip depth", min: 10, max: 40, step: 1 },
  { id: "crotchDepth", label: "Crotch depth (sitting)", min: 16, max: 40, step: 0.5 },
  { id: "thigh", label: "Thigh girth", min: 40, max: 90, step: 1 },
  { id: "knee", label: "Knee girth", min: 30, max: 70, step: 1 },
  { id: "inseam", label: "Inseam (finished)", min: 55, max: 105, step: 1 },
  { id: "ease", label: "Ease", min: -30, max: 30, step: 1 },
  // Slice 63 — sleeveless-only fields (today: the tank). Ranges wider than
  // MEASUREMENT_BOUNDS's "usual" band, same convention as every field above.
  { id: "strapWidth", label: "Strap width (finished)", min: 0, max: 15, step: 0.5 },
  { id: "neckDrop", label: "Neck scoop depth", min: 0, max: 18, step: 0.5 },
  { id: "neckWidthEase", label: "Neckline width adjustment", min: -4, max: 12, step: 0.5 },
];

/** Shared edit/save validation. Values are never replaced by a hidden bound. */
export function inputError(value: number, field: Pick<Field, "label" | "min" | "max">): string | null {
  if (!Number.isFinite(value)) return `${field.label}: enter a finite number.`;
  if (value < field.min || value > field.max) return `${field.label}: enter ${field.min}–${field.max}.`;
  return null;
}

/**
 * Preserve typed numbers verbatim, including out-of-range values. An empty or
 * nonnumeric field becomes NaN, an explicit incomplete state that cannot draft.
 */
export function applyChange(m: Measurements, field: Field, raw: string): Measurements {
  return { ...m, [field.id]: raw.trim() === "" ? NaN : Number(raw) };
}
