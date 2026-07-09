// Rotation about a pivot — the one move dart manipulation is built from.
//
// Closing a dart means swinging part of the pattern around its apex until the
// two legs meet. That swing is a rigid rotation: every seam it carries keeps its
// length, which is exactly why "moving a dart doesn't change the fit."

import { Point, point } from "./point";

/** Rotate `p` around `about` by `angle` radians (positive = toward +y from +x). */
export function rotatePoint(p: Point, about: Point, angle: number): Point {
  const dx = p.x - about.x;
  const dy = p.y - about.y;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return point(about.x + dx * c - dy * s, about.y + dx * s + dy * c);
}

/** The signed angle (radians) you must rotate `from` about `about` to reach `to`. */
export function angleBetween(from: Point, about: Point, to: Point): number {
  const a = Math.atan2(from.y - about.y, from.x - about.x);
  const b = Math.atan2(to.y - about.y, to.x - about.x);
  return Math.atan2(Math.sin(b - a), Math.cos(b - a)); // normalised to (-π, π]
}
