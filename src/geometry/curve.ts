// Pattern edges are rarely straight: necklines, armholes, and sleeve caps are
// curves. We model them as cubic Béziers and, crucially, measure their length.
// That length is what lets us later check that a sleeve cap matches its armhole.

import { Point, distance } from "./point";

export interface CubicBezier {
  readonly start: Point;
  readonly control1: Point;
  readonly control2: Point;
  readonly end: Point;
}

/** The point on a cubic Bézier at parameter t in [0, 1]. */
export function cubicPoint(c: CubicBezier, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.start.x + b * c.control1.x + d * c.control2.x + e * c.end.x,
    y: a * c.start.y + b * c.control1.y + d * c.control2.y + e * c.end.y,
  };
}

/**
 * Length of a cubic Bézier, found by walking it in straight steps and summing
 * them. More segments means more accuracy; 64 is well under a millimetre of
 * error at garment scale.
 */
export function cubicLength(c: CubicBezier, segments = 64): number {
  let total = 0;
  let prev = c.start;
  for (let i = 1; i <= segments; i++) {
    const next = cubicPoint(c, i / segments);
    total += distance(prev, next);
    prev = next;
  }
  return total;
}


/* adding a quadratic bezier function here, would write a func with 3 points, start, control, end. then the 
quadratic point will find a point on the quadratic curve between start and end, if im right, and the quadratic length will measure the distances between each point beginning from start -> quadratic points -> end,
and then summing them to find the length of the curve */