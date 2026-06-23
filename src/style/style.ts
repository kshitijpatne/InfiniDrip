// The style suggester. A "style" is just a region of the measurement space:
// a set of ranges that, together, describe a recognisable kind of t-shirt.
//
//  - currentStyles: which style(s) the current measurements already sit inside
//  - nearbyStyles:  the closest styles you are NOT in, each with the smallest
//                   measurement change that would step you into it
//
// The definitions below are a sensible starting table, meant to be tuned against
// real references — the logic does not change when the numbers do.

import { Measurements } from "../drafting";

interface StyleDef {
  readonly name: string;
  readonly ranges: Partial<Record<keyof Measurements, readonly [number, number]>>;
}

const STYLES: readonly StyleDef[] = [
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
export function currentStyles(m: Measurements): string[] {
  return STYLES.filter((s) => measureAgainst(m, s).distance === 0).map((s) => s.name);
}

/** The closest styles you are not yet in, nearest first. */
export function nearbyStyles(m: Measurements, limit = 3): StyleMatch[] {
  return STYLES.map((s) => measureAgainst(m, s))
    .filter((match) => match.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export interface StyleSuggestions {
  readonly current: string[];
  readonly nearby: StyleMatch[];
}

export function styleSuggestions(m: Measurements): StyleSuggestions {
  return { current: currentStyles(m), nearby: nearbyStyles(m) };
}
