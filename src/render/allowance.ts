// Seam allowance: the "cutting line" that sits a fixed distance outside the
// sewing outline. You sew on the inner line and cut on this outer one.
// We sample the outline into points, then push every point outward along the
// outline's normal — a simple, general offset that works for any piece shape.

import { Point, cubicPoint } from "../geometry";
import { Piece } from "../drafting";

const SAMPLES = 14;
const round = (n: number): number => Math.round(n * 1000) / 1000;

function outlinePoints(piece: Piece): Point[] {
  const pts: Point[] = [];
  for (const e of piece.edges) {
    if (e.kind === "line") pts.push(e.start);
    else for (let i = 0; i < SAMPLES; i++) pts.push(cubicPoint(e.curve, i / SAMPLES));
  }
  return pts;
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

function offsetBy(pts: Point[], d: number): Point[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const a = normal(p.x - prev.x, p.y - prev.y);
    const b = normal(next.x - p.x, next.y - p.y);
    const mx = a.x + b.x, my = a.y + b.y;
    const l = Math.hypot(mx, my);
    return { x: p.x + (mx / l) * d, y: p.y + (my / l) * d };
  });
}

/** The cutting line: the sewing outline pushed outward by `allowance` cm. */
export function seamAllowance(piece: Piece, allowance: number): Point[] {
  const pts = outlinePoints(piece);
  const out = offsetBy(pts, allowance);
  const inn = offsetBy(pts, -allowance);
  return area(out) > area(inn) ? out : inn; // the outward loop is the larger one
}

/** That cutting line as an SVG path "d" string. */
export function seamAllowancePath(piece: Piece, allowance: number): string {
  return seamAllowance(piece, allowance)
    .map((p, i) => `${i ? "L" : "M"} ${round(p.x)} ${round(p.y)}`)
    .join(" ") + " Z";
}
