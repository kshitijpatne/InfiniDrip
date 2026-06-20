// A point is the atom of every pattern: a position on the drafting plane.
// All coordinates are in centimetres, so geometry maps straight to real cloth.

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Make a point. */
export function point(x: number, y: number): Point {
  return { x, y };
}

/** Straight-line distance between two points, in centimetres. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Linear interpolation: t = 0 returns a, t = 1 returns b, 0.5 the midpoint. */
export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
