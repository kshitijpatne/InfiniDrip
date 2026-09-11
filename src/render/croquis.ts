// Shared measurement-honest croquis geometry. These figures are presentation
// scaffolding only: they do not draft pattern pieces and never enter exports.
// Front, side, and back are named separately so a future view cannot silently
// substitute a front figure for a side or back representation.

import { Measurements, derive } from "../drafting";

export type CroquisRegion = "upper" | "lower";
export type CroquisView = "front" | "side" | "back";

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** A reusable upper-body croquis path. The front/back figures share the same
 * measured envelope; the side figure is deliberately schematic until a side
 * measurement set exists. */
export function upperCroquisPath(m: Measurements, view: CroquisView): string {
  const d = derive(m);
  if (view === "side") {
    const half = Math.max(2, d.chestWidthHalf * 0.22);
    return `M 0 0 C ${round(half)} ${round(m.armholeDepth * 0.25)} ${round(half)} ${round(m.armholeDepth * 0.75)} ${round(half * 0.8)} ${round(m.armholeDepth)} L ${round(half * 0.8)} ${round(m.length)} L ${round(-half * 0.8)} ${round(m.length)} L ${round(-half * 0.8)} ${round(m.armholeDepth)} C ${round(-half)} ${round(m.armholeDepth * 0.75)} ${round(-half)} ${round(m.armholeDepth * 0.25)} 0 0 Z`;
  }
  const half = d.chestWidthHalf;
  const shoulder = d.shoulderHalf;
  const slope = d.shoulderSlope;
  const neck = d.neckWidthHalf;
  const sleeve = m.sleeveLength;
  const y1 = slope + m.armholeDepth * 0.3;
  const y2 = y1 + m.bicep * 0.4;
  const side = view === "front" ? 1 : -1;
  const mirror = (x: number): number => side * x;
  return [
    `M ${round(mirror(neck))} 0`,
    `L ${round(mirror(shoulder))} ${round(slope)}`,
    `L ${round(mirror(shoulder + sleeve))} ${round(y1)}`,
    `L ${round(mirror(shoulder + sleeve - 2))} ${round(y2)}`,
    `L ${round(mirror(half))} ${round(m.armholeDepth)}`,
    `L ${round(mirror(half))} ${round(m.length)}`,
    `L ${round(mirror(-half))} ${round(m.length)}`,
    `L ${round(mirror(-half))} ${round(m.armholeDepth)}`,
    `L ${round(mirror(-shoulder - sleeve + 2))} ${round(y2)}`,
    `L ${round(mirror(-shoulder - sleeve))} ${round(y1)}`,
    `L ${round(mirror(-shoulder))} ${round(slope)}`,
    `L ${round(mirror(-neck))} 0 Z`,
  ].join(" ");
}

/** Reusable lower-body croquis paths. The lower front/back are identical at
 * this measurement level; the side is a truthful profile envelope, not a
 * drape simulation. */
export function lowerCroquisPath(m: Measurements, view: CroquisView): string {
  const waist = (m.waist + m.ease) / 4;
  const hip = (m.hip + m.ease) / 4;
  if (view === "side") {
    return `M 0 0 C ${round(hip * 0.35)} ${round(m.hipDepth * 0.4)} ${round(hip * 0.45)} ${round(m.hipDepth * 0.8)} ${round(hip * 0.35)} ${round(m.hipDepth)} L ${round(hip * 0.35)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.hipDepth)} C ${round(-hip * 0.25)} ${round(m.hipDepth * 0.7)} ${round(-waist * 0.6)} ${round(m.hipDepth * 0.3)} 0 0 Z`;
  }
  return [
    `M ${round(-waist)} 0 L ${round(waist)} 0`,
    `L ${round(hip)} ${round(m.hipDepth)}`,
    `L ${round(hip)} ${round(m.length)}`,
    `L ${round(-hip)} ${round(m.length)}`,
    `L ${round(-hip)} ${round(m.hipDepth)} Z`,
  ].join(" ");
}

/** One public entry point for callers that select a croquis by region/view. */
export function croquisPath(region: CroquisRegion, m: Measurements, view: CroquisView): string {
  return region === "upper" ? upperCroquisPath(m, view) : lowerCroquisPath(m, view);
}
