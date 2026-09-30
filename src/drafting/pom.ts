// Points of measure (POM) — the pattern measuring itself.
//
// A point of measure is just a geometry query on the named edges the draft
// already carries: the length of a seam, or the straight distance between two
// named points. Nothing is stored — every value is read live off the drafted
// geometry, so it's always correct and it grades for free.
//
//   specSheet(gradedSizes, poms)  →  one row per POM, one column per size
//
// The query helpers here are garment-agnostic engine; *which* POMs a tee reports
// is recipe (tshirt-pom.ts).

import { Piece, edgeLength, pieceEdge, edgeStart, edgeEnd } from "./piece";
import { Block } from "./block";
import { GradedSize } from "./grading";
import { Point } from "../geometry";

/** Length of a named seam (a straight line or a curve). */
export function seam(piece: Piece, edge: string): number {
  return edgeLength(pieceEdge(piece, edge));
}

/** A named point on a piece: one end of a named edge. */
export interface PointRef {
  readonly edge: string;
  readonly at: "start" | "end";
}

function pointOf(piece: Piece, ref: PointRef): { x: number; y: number } {
  const e = pieceEdge(piece, ref.edge);
  return ref.at === "start" ? edgeStart(e) : edgeEnd(e);
}

/** Horizontal distance between two named points (a width). */
export function spanX(piece: Piece, a: PointRef, b: PointRef): number {
  return Math.abs(pointOf(piece, a).x - pointOf(piece, b).x);
}

/** Vertical distance between two named points (a length/drop). */
export function spanY(piece: Piece, a: PointRef, b: PointRef): number {
  return Math.abs(pointOf(piece, a).y - pointOf(piece, b).y);
}

/** A point of measure: a label and how to read it off a drafted block, in cm. */
export interface Pom {
  readonly label: string;
  readonly measure: (block: Block) => number;
  /** Optional source point on the mapped front role for FRONT_FLAT callouts. */
  readonly anchor?: (block: Block) => Point;
  /** Optional source point on the mapped back role for BACK_FLAT callouts. */
  readonly backAnchor?: (block: Block) => Point;
  /** Optional authored mark entity on the back face for construction-specific callouts. */
  readonly backMarkAnchor?: { readonly roleId: string; readonly markName: string };
  /**
   * Optional production tolerance in cm — how far a finished garment may drift
   * from the spec on this measure before it's a reject. A property of the POINT
   * OF MEASURE, not the size: a chest tolerance is the same ±1 cm at XS and XL.
   * POMs without one show a blank tolerance cell (the spec doesn't invent a
   * number it wasn't given).
   */
  readonly tolerance?: number;
}

export interface SpecRow {
  readonly label: string;
  readonly values: readonly number[]; // one per graded size, cm, rounded to 0.1
  readonly tolerance?: number; // cm, ± ; same across all sizes (a POM property)
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Run every POM across every graded size → the finished spec sheet. */
export function specSheet(
  graded: readonly GradedSize[],
  poms: readonly Pom[]
): SpecRow[] {
  return poms.map((pom) => ({
    label: pom.label,
    values: graded.map((g) => round1(pom.measure(g.block))),
    tolerance: pom.tolerance,
  }));
}
