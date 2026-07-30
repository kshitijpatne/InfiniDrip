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

export interface StyleDef {
  readonly name: string;
  readonly ranges: Partial<Record<keyof Measurements, readonly [number, number]>>;
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

/** The skirt style table (lower-body: length by silhouette, ease by fit). */
export const SKIRT_STYLES: readonly StyleDef[] = [
  { name: "Mini skirt", ranges: { length: [40, 50] } },
  { name: "Knee skirt", ranges: { length: [55, 65] } },
  { name: "Midi skirt", ranges: { length: [70, 85] } },
  { name: "Maxi skirt", ranges: { length: [95, 120] } },
  { name: "Fitted skirt", ranges: { ease: [2, 6] } },
  { name: "Relaxed skirt", ranges: { ease: [10, 16] } },
];

/** One measurement change needed to move toward a style (signed, in cm). */
export interface Delta {
  readonly id: keyof Measurements;
  readonly change: number;
}

export interface StyleMatch {
  readonly name: string;
  readonly deltas: readonly Delta[]; // empty means you are already in this style
  readonly distance: number;         // total cm of change to reach it
}

// How far the measurements sit from a style, and the smallest nudge to enter it.
function measureAgainst(m: Measurements, def: StyleDef): StyleMatch {
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
  return { name: def.name, deltas, distance };
}

/** Names of the styles the current measurements already match. */
export function currentStyles(m: Measurements, styles: readonly StyleDef[]): string[] {
  return styles.filter((s) => measureAgainst(m, s).distance === 0).map((s) => s.name);
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
export function matchStyle(m: Measurements, styleName: string, styles: readonly StyleDef[]): StyleMatch {
  const def = styles.find((s) => s.name === styleName);
  if (!def) throw new Error(`Unknown style: "${styleName}"`);
  return measureAgainst(m, def);
}

/** The closest styles you are not yet in, nearest first. */
export function nearbyStyles(m: Measurements, styles: readonly StyleDef[], limit = 3): StyleMatch[] {
  return styles.map((s) => measureAgainst(m, s))
    .filter((match) => match.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export interface StyleSuggestions {
  readonly current: string[];
  readonly nearby: StyleMatch[];
}

export function styleSuggestions(m: Measurements, styles: readonly StyleDef[]): StyleSuggestions {
  return { current: currentStyles(m, styles), nearby: nearbyStyles(m, styles) };
}
