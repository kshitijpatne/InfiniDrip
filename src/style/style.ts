// The style suggester. A "style" is just a region of the measurement space:
// a set of ranges that, together, describe a recognisable kind of garment.
//
//  - currentStyles: which style(s) the current measurements already sit inside
//  - nearbyStyles:  the closest styles you are NOT in, each with the smallest
//                   measurement change that would step you into it
//
// The style TABLE is garment-specific and lives on the recipe (recipe.styles); the
// logic here is garment-agnostic and takes the table as an argument. A tee's styles
// range over ease/length/sleeve; a skirt's over length/ease. The numbers are a
// sensible starting table, meant to be tuned against real references — the logic
// does not change when the numbers do.

import type { Measurements } from "../drafting";
import type { GarmentOptions } from "../drafting/options";

export interface StyleDef {
  readonly name: string;
  readonly ranges: Partial<Record<keyof Measurements, readonly [number, number]>>;
  readonly optionRanges?: readonly {
    readonly id: string;
    readonly label: string;
    readonly unit: string;
    readonly range: readonly [number, number];
  }[];
}

/** The tee/fitted style table (upper-body: ease, length, sleeve). */
export const TEE_STYLES: readonly StyleDef[] = [
  { name: "Fitted tee", ranges: { ease: [0, 6], length: [59, 74] } },
  { name: "Classic tee", ranges: { ease: [7, 12], length: [59, 74] } },
  { name: "Relaxed tee", ranges: { ease: [13, 18], length: [59, 74] } },
  { name: "Oversized tee", ranges: { ease: [19, 30], length: [59, 82] } },
  { name: "Crop tee", ranges: { ease: [0, 12], length: [40, 57] } },
  { name: "Boxy crop", ranges: { ease: [13, 30], length: [40, 57] } },
  { name: "Longline tee", ranges: { ease: [7, 18], length: [78, 100] } },
  { name: "Muscle tee", ranges: { ease: [0, 8], sleeveLength: [8, 12] } },
  { name: "Long-sleeve tee", ranges: { ease: [7, 14], sleeveLength: [55, 70] } },
];

/** Fitted is a construction category; ease remains a software input, not a fit claim. */
export const FITTED_STYLES: readonly StyleDef[] = [
  { name: "Fitted tee", ranges: { length: [59, 74] } },
  { name: "Cropped fitted tee", ranges: { length: [40, 57] } },
];
/** The skirt style table (lower-body: length by silhouette, ease by fit). */
export const SKIRT_STYLES: readonly StyleDef[] = [
  { name: "Mini skirt", ranges: { length: [40, 50] } },
  { name: "Knee skirt", ranges: { length: [55, 65] } },
  { name: "Midi skirt", ranges: { length: [70, 85] } },
  { name: "Maxi skirt", ranges: { length: [95, 120] } },
  { name: "Fitted skirt", ranges: { ease: [2, 6] } },
  { name: "Relaxed skirt", ranges: { ease: [10, 16] } },
];

/** The tank style table (upper-body, no sleeve field: ease and length only —
 *  TEE_STYLES' sleeve-keyed entries, Muscle/Long-sleeve, don't apply here). */
export const TANK_STYLES: readonly StyleDef[] = [
  { name: "Fitted tank", ranges: { ease: [0, 4], length: [59, 74] } },
  { name: "Classic tank", ranges: { ease: [5, 10], length: [59, 74] } },
  { name: "Relaxed tank", ranges: { ease: [11, 16], length: [59, 74] } },
  { name: "Crop tank", ranges: { ease: [0, 10], length: [40, 57] } },
  { name: "Longline tank", ranges: { ease: [5, 14], length: [78, 100] } },
];

/** Polo V1 is a loose short-sleeve knit polo. Names describe finished garment
 * type, not a tee surrogate; sleeve/collar variations remain explicitly out. */
export const POLO_STYLES: readonly StyleDef[] = [
  { name: "Low-ease polo", ranges: { ease: [3, 6], length: [59, 74] } },
  { name: "Classic polo", ranges: { ease: [7, 12], length: [59, 74] } },
  { name: "Relaxed polo", ranges: { ease: [13, 18], length: [59, 78] } },
  { name: "Cropped polo", ranges: { ease: [7, 12], length: [44, 57] } },
  { name: "Longline polo", ranges: { ease: [7, 18], length: [78, 100] } },
];

/** First woven shirt styles: the block is relaxed by construction, so the
 * style table distinguishes length and the amount of wearing ease around it. */
export const WOVEN_SHIRT_STYLES: readonly StyleDef[] = [
  { name: "Classic woven shirt", ranges: { ease: [10, 16], length: [62, 78] } },
  { name: "Relaxed woven shirt", ranges: { ease: [17, 24], length: [62, 82] } },
  { name: "Cropped woven shirt", ranges: { ease: [10, 24], length: [45, 60] } },
  { name: "Cropped boxy woven shirt", ranges: { ease: [10, 24], length: [45, 60] } },
  { name: "Longline woven shirt", ranges: { ease: [10, 24], length: [82, 100] } },
  { name: "Oversized loose-drop woven shirt", ranges: { ease: [25, 32], length: [62, 82] } },
];

/** The first trouser style table. Inseam is the finished lower-body length;
 * these names describe the target silhouette/fit envelope, not a fit claim. */
export const TROUSER_STYLES: readonly StyleDef[] = [
  // These option bands are digital category boundaries, not construction or fit standards.
  { name: "Relaxed straight trouser", ranges: { ease: [8, 14], inseam: [72, 84] }, optionRanges: [
    { id: "thighEase", label: "Thigh ease", unit: "cm", range: [0, 11.5] },
    { id: "kneeEase", label: "Knee ease", unit: "cm", range: [0, 11.5] },
    { id: "legOpening", label: "Leg opening", unit: "cm", range: [38, 51.5] },
  ] },
  { name: "Classic straight trouser", ranges: { ease: [4, 8], inseam: [72, 84] }, optionRanges: [
    { id: "thighEase", label: "Thigh ease", unit: "cm", range: [0, 11.5] },
    { id: "kneeEase", label: "Knee ease", unit: "cm", range: [0, 11.5] },
    { id: "legOpening", label: "Leg opening", unit: "cm", range: [38, 51.5] },
  ] },
  { name: "Tapered trouser", ranges: { ease: [4, 14], inseam: [72, 84] }, optionRanges: [
    { id: "thighEase", label: "Thigh ease", unit: "cm", range: [0, 11.5] },
    { id: "kneeEase", label: "Knee ease", unit: "cm", range: [0, 11.5] },
    { id: "legOpening", label: "Leg opening", unit: "cm", range: [25, 37.5] },
  ] },
  { name: "Wide-leg trouser", ranges: { ease: [8, 14], inseam: [72, 84] }, optionRanges: [
    { id: "thighEase", label: "Thigh ease", unit: "cm", range: [12, 20] },
    { id: "kneeEase", label: "Knee ease", unit: "cm", range: [12, 15] },
    { id: "legOpening", label: "Leg opening", unit: "cm", range: [52, 65] },
  ] },
  { name: "Cropped straight trouser", ranges: { ease: [8, 18], inseam: [55, 71] } },
  { name: "Long straight trouser", ranges: { ease: [8, 18], inseam: [85, 105] } },
];

/** One declared digital Jeans direction. Its ranges remain empty until product
 * targets are separately reviewed; this label is not a validated fit claim. */
export const JEANS_STYLES: readonly StyleDef[] = [
  { name: "Relaxed straight mid-rise jeans", ranges: {} },
];

/** One relaxed woven short style; recipe-owned length remains an option. */
export const SHORTS_STYLES: readonly StyleDef[] = [
  { name: "Relaxed woven shorts", ranges: { ease: [8, 16] } },
];

/** One signed change needed to move toward a style. */
export type Delta =
  | { readonly id: keyof Measurements; readonly change: number }
  | { readonly id: string; readonly label: string; readonly unit: string; readonly change: number };

export interface StyleMatch {
  readonly name: string;
  readonly deltas: readonly Delta[]; // empty means you are already in this style
  readonly distance: number;         // total change across ranged dimensions/options
  /** False means a required option is absent, so this target cannot be confirmed. */
  readonly optionsComplete: boolean;
}

// How far the measurements sit from a style, and the smallest nudge to enter it.
function measureAgainst(m: Measurements, def: StyleDef, options?: GarmentOptions): StyleMatch {
  const optionRanges = def.optionRanges ?? [];
  if (optionRanges.some(({ id }) => !Number.isFinite(options?.[id]))) {
    return { name: def.name, deltas: [], distance: Infinity, optionsComplete: false };
  }
  const entries = Object.entries(def.ranges) as [keyof Measurements, readonly [number, number]][];
  const deltas: Delta[] = [];
  let distance = 0;
  for (const [id, [min, max]] of entries) {
    const v = m[id];
    if (v < min) {
      deltas.push({ id, change: min - v });   // increase to reach the band
      distance += min - v;
    } else if (v > max) {
      deltas.push({ id, change: max - v });    // decrease to reach the band
      distance += v - max;
    }
  }
  for (const { id, label, unit, range: [min, max] } of optionRanges) {
    const value = options![id]!;
    if (value < min) {
      const change = min - value;
      deltas.push({ id: "option:" + id, label, unit, change });
      distance += change;
    } else if (value > max) {
      const change = max - value;
      deltas.push({ id: "option:" + id, label, unit, change });
      distance += value - max;
    }
  }
  return { name: def.name, deltas, distance, optionsComplete: true };
}

/** Names of the styles the current measurements already match. */
export function currentStyles(m: Measurements, styles: readonly StyleDef[], options?: GarmentOptions): string[] {
  return styles.filter((s) => measureAgainst(m, s, options).distance === 0).map((s) => s.name);
}

/** All style names, in table order — the selectable list of target fits. */
export function styleNames(styles: readonly StyleDef[]): string[] {
  return styles.map((s) => s.name);
}

/**
 * Measure the current measurements against ONE chosen style (the user's declared
 * target). Returns the signed deltas to reach it and whether you're already there.
 * Unknown names throw.
 */
export function matchStyle(
  m: Measurements, styleName: string, styles: readonly StyleDef[], options?: GarmentOptions,
): StyleMatch {
  const def = styles.find((s) => s.name === styleName);
  if (!def) throw new Error(`Unknown style: "${styleName}"`);
  return measureAgainst(m, def, options);
}

/** The closest styles you are not yet in, nearest first. */
export function nearbyStyles(
  m: Measurements, styles: readonly StyleDef[], limit = 3, options?: GarmentOptions,
): StyleMatch[] {
  return styles.map((s) => measureAgainst(m, s, options))
    .filter((match) => match.optionsComplete && match.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export interface StyleSuggestions {
  readonly current: string[];
  readonly nearby: StyleMatch[];
}

export function styleSuggestions(
  m: Measurements, styles: readonly StyleDef[], options?: GarmentOptions,
): StyleSuggestions {
  return { current: currentStyles(m, styles, options), nearby: nearbyStyles(m, styles, 3, options) };
}
