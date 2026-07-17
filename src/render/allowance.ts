// Seam allowance: the "cutting line" that sits outside the sewing outline. You
// sew on the inner line and cut on this outer one.
//
// We sample the outline into points — each one tagged with the edge it came from,
// because allowance is PER EDGE (a hem turns up deep, a fold gets none) — and then
// push the outline outward.
//
// THE CORNER RULE. At a corner the offset point must sit `dIn` away from the
// incoming edge AND `dOut` away from the outgoing one. That is two equations in
// two unknowns:
//
//     w · nIn  = dIn
//     w · nOut = dOut          (w = how far the corner moves; n = edge normals)
//
// One 2x2 solve gives the exact answer for equal AND unequal allowances. Sliding
// the corner along the bisector by `d` — the obvious shortcut — is WRONG: it lands
// at `d` when the true distance is `d / cos(angle/2)`, so a 1 cm allowance came out
// ~7 mm at a right angle. (That was a real bug, fixed here; the old tests only
// asserted the outline "got bigger", never that it got bigger by the right amount.)
//
// When two consecutive segments are collinear the solve is degenerate (parallel
// normals, zero determinant) — that is the common case inside a sampled curve, so
// we fall back to a plain perpendicular push, which is exact in that limit.

import { Point, cubicPoint } from "../geometry";
import { Piece, AllowanceSpec, allowanceFor } from "../drafting";

const SAMPLES = 14;
const FLAT = 1e-9; // |det| below this = the two segments are collinear
const round = (n: number): number => Math.round(n * 1000) / 1000;

/** One sampled outline point, tagged with the edge that produced it. */
export interface OutlineSample {
  readonly point: Point;
  readonly edgeName: string;
}

/**
 * The sewing outline as points, each tagged with its edge.
 * The segment LEAVING sample i belongs to sample i's edge — a line edge emits its
 * start, a curve emits its samples, so the run of points from an edge is exactly
 * the span that edge covers.
 */
export function outlineSamples(piece: Piece): OutlineSample[] {
  const out: OutlineSample[] = [];
  for (const e of piece.edges) {
    if (e.kind === "line") out.push({ point: e.start, edgeName: e.name });
    else for (let i = 0; i < SAMPLES; i++) {
      out.push({ point: cubicPoint(e.curve, i / SAMPLES), edgeName: e.name });
    }
  }
  return out;
}

/** The sewing outline as bare points. */
export function outlinePoints(piece: Piece): Point[] {
  return outlineSamples(piece).map((s) => s.point);
}

function area(pts: Point[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

function normal(dx: number, dy: number): Point {
  const l = Math.hypot(dx, dy);
  return { x: dy / l, y: -dx / l };
}

/** Push the outline out (or in, for a negative sign) by each edge's own allowance. */
function offsetOutline(samples: OutlineSample[], spec: AllowanceSpec, sign: number): Point[] {
  const n = samples.length;
  return samples.map((s, i) => {
    const prev = samples[(i - 1 + n) % n];
    const next = samples[(i + 1) % n];
    const p = s.point;
    const nIn = normal(p.x - prev.point.x, p.y - prev.point.y);
    const nOut = normal(next.point.x - p.x, next.point.y - p.y);
    const dIn = sign * allowanceFor(spec, prev.edgeName); // the segment arriving here
    const dOut = sign * allowanceFor(spec, s.edgeName); // the segment leaving here

    const det = nIn.x * nOut.y - nIn.y * nOut.x;
    if (Math.abs(det) < FLAT) {
      return { x: p.x + nIn.x * dIn, y: p.y + nIn.y * dIn }; // collinear: straight push
    }
    return {
      x: p.x + (dIn * nOut.y - dOut * nIn.y) / det,
      y: p.y + (dOut * nIn.x - dIn * nOut.x) / det,
    };
  });
}

/** The cutting line: the sewing outline pushed outward by each edge's allowance. */
export function seamAllowance(piece: Piece, spec: AllowanceSpec): Point[] {
  const samples = outlineSamples(piece);
  const out = offsetOutline(samples, spec, 1);
  const inn = offsetOutline(samples, spec, -1);
  return area(out) > area(inn) ? out : inn; // the outward loop is the larger one
}

/** That cutting line as an SVG path "d" string. */
export function seamAllowancePath(piece: Piece, spec: AllowanceSpec): string {
  return seamAllowance(piece, spec)
    .map((p, i) => `${i ? "L" : "M"} ${round(p.x)} ${round(p.y)}`)
    .join(" ") + " Z";
}
