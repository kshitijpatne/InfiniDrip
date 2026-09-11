// The neckline collar, as an SVG path fragment — the single place render/body.ts
// and render/garment.ts both turn a REAL drafted neckline shape (crew/v/scoop,
// from drafting/neckline.ts's necklineEdge()) into drawable curve commands.
//
// Slice 61 fix ("no silent geometry reuse", PROJECT-STATE.md's Tank rework):
// both callers used to draw their own fixed placeholder curve regardless of
// what the garment actually drafted — a tank's deep scoop and a tee's crew
// read identically on the body/garment views. This is the one function that
// closes that gap; every neckline is now drawn from the same shape math the
// pattern itself uses.
//
// Both callers draw one full torso outline, half-mirrored around x = 0, and
// reach this point having just arrived at the LEFT high-point-shoulder
// (-hps.x, 0) by walking down the left shoulder/side/hem/side/shoulder. This
// fragment continues that same path: left hps -> centre-front -> right hps,
// so a plain `Z` (or an explicit `L` back to the start point) closes the
// outline. `necklineEdge()` only ever computes the RIGHT half (centre -> hps);
// the left half is that same curve mirrored in x AND traversed backwards
// (hps -> centre) — reversing a cubic swaps its two control points, and
// mirroring negates every x, including the control points'.

import { Point } from "../geometry";
import { Edge } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** `cNeck`/`hps`/`edge` are exactly `necklineEdge()`'s own return values —
 *  this function only re-expresses them as path commands, it computes
 *  nothing new. Assumes the pen is already at the LEFT hps (-hps.x, 0). */
export function necklinePathCommand(cNeck: Point, hps: Point, edge: Edge): string {
  if (edge.kind === "line") {
    // A real V: two straight seams meeting at the point, mirrored either side.
    return `L ${round(cNeck.x)} ${round(cNeck.y)} L ${round(hps.x)} ${round(hps.y)}`;
  }
  const c = edge.curve;
  const left = `C ${round(-c.control2.x)} ${round(c.control2.y)} ` +
    `${round(-c.control1.x)} ${round(c.control1.y)} ${round(cNeck.x)} ${round(cNeck.y)}`;
  const right = `C ${round(c.control1.x)} ${round(c.control1.y)} ` +
    `${round(c.control2.x)} ${round(c.control2.y)} ${round(hps.x)} ${round(hps.y)}`;
  return `${left} ${right}`;
}

/** Render one drafted armhole edge. `mirrored` traverses the mirrored edge
 * from underarm back to strap, matching the reverse walk of a full outline. */
export function armholePathCommand(edge: Edge, mirrored = false): string {
  if (edge.kind !== "curve") {
    return `L ${round(mirrored ? -edge.end.x : edge.end.x)} ${round(edge.end.y)}`;
  }
  const c = edge.curve;
  if (mirrored) {
    return `C ${round(-c.control2.x)} ${round(c.control2.y)} ` +
      `${round(-c.control1.x)} ${round(c.control1.y)} ${round(-c.start.x)} ${round(c.start.y)}`;
  }
  return `C ${round(c.control1.x)} ${round(c.control1.y)} ` +
    `${round(c.control2.x)} ${round(c.control2.y)} ${round(c.end.x)} ${round(c.end.y)}`;
}
