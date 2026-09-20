// Headless placement math — artwork rectangles into true-scale polygons.
//
// Operates on plain data only: no drafting, render, or export imports. Callers
// pass validated placements (see placementError in ./placement); this module
// measures, it never judges. Thresholds and warnings belong to guidance.

import { Point, point } from "../geometry/point";
import { rotatePoint } from "../geometry/rotate";
import type { PlacementTransform } from "./placement";

export interface BoundingBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * Four artwork corners after scale, rotation about the artwork centre, then
 * translation — in centimetres on the drafting plane. Order stays cyclic, so
 * the result is always a simple quadrilateral for well-formed input.
 */
export function artworkCorners(widthCm: number, heightCm: number, t: PlacementTransform): Point[] {
  const hw = (widthCm * t.scale) / 2;
  const hh = (heightCm * t.scale) / 2;
  const centre = point(t.dx, t.dy);
  const angle = (t.rotationDeg * Math.PI) / 180;
  return [
    rotatePoint(point(-hw, -hh), point(0, 0), angle),
    rotatePoint(point(hw, -hh), point(0, 0), angle),
    rotatePoint(point(hw, hh), point(0, 0), angle),
    rotatePoint(point(-hw, hh), point(0, 0), angle),
  ].map((corner) => point(corner.x + centre.x, corner.y + centre.y));
}

/** Axis-aligned bounds of a polygon, or null for an empty ring. */
export function boundingBox(polygon: readonly Point[]): BoundingBox | null {
  if (polygon.length === 0) return null;
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** True when two boxes share any area or edge. Touching counts as overlap. */
export function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/** True when every edge of `inner` sits inside or exactly on `outer`.
 * Edge-touching counts as contained, matching the overlap convention. */
export function boxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  return outer.minX <= inner.minX && inner.maxX <= outer.maxX &&
    outer.minY <= inner.minY && inner.maxY <= outer.maxY;
}

export interface Resolution {
  readonly xPxPerCm: number;
  readonly yPxPerCm: number;
}

/**
 * Source pixels per printed centimetre at the placed scale. Null when the
 * rating cannot be computed (non-finite or non-positive inputs) — guidance
 * treats unratable as unknown, never as a failure.
 */
export function effectiveResolution(
  sourcePxWidth: number,
  sourcePxHeight: number,
  widthCm: number,
  heightCm: number,
  scale: number,
): Resolution | null {
  const inputs = [sourcePxWidth, sourcePxHeight, widthCm, heightCm, scale];
  if (!inputs.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  if (sourcePxWidth <= 0 || sourcePxHeight <= 0 || widthCm <= 0 || heightCm <= 0 || scale <= 0) return null;
  return { xPxPerCm: sourcePxWidth / (widthCm * scale), yPxPerCm: sourcePxHeight / (heightCm * scale) };
}
