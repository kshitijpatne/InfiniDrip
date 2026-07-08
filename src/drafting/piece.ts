// A pattern piece is a closed outline made of edges. Each edge is either a
// straight line or a curve, and each carries a name ("armhole", "shoulder", ...)
// so other layers can ask for a specific edge — e.g. "how long is the armhole?".
// That naming is what will later let us check a sleeve cap against its armhole.

import { Point, distance, CubicBezier, cubicLength } from "../geometry";

export type Edge =
  | { readonly kind: "line"; readonly name: string; readonly start: Point; readonly end: Point }
  | { readonly kind: "curve"; readonly name: string; readonly curve: CubicBezier };

/** A dart marked on a piece: the two outline leg edges that meet at its apex.
 *  Naming the legs (not storing points) keeps the outline the single source of
 *  truth — edit the legs and the apex/mouth move with them. */
export interface Dart {
  readonly legs: readonly [string, string]; // [upper leg, lower leg] edge names
}

export interface Piece {
  readonly name: string;
  readonly onFold: boolean; // true => the left edge is a fold (a half-piece)
  readonly edges: readonly Edge[];
  readonly dart?: Dart; // optional: a piece may carry one marked dart
}

/** Where an edge begins. */
export function edgeStart(e: Edge): Point {
  return e.kind === "line" ? e.start : e.curve.start;
}

/** Where an edge ends. */
export function edgeEnd(e: Edge): Point {
  return e.kind === "line" ? e.end : e.curve.end;
}

/** Length of an edge in cm: a straight distance for a line, the curve length for a curve. */
export function edgeLength(e: Edge): number {
  return e.kind === "line" ? distance(e.start, e.end) : cubicLength(e.curve);
}

/** Find an edge by name, or fail loudly if it is not there. */
export function pieceEdge(piece: Piece, name: string): Edge {
  const found = piece.edges.find((e) => e.name === name);
  if (!found) throw new Error(`Piece "${piece.name}" has no edge named "${name}"`);
  return found;
}

/** Total length around the drafted outline. */
export function perimeter(piece: Piece): number {
  return piece.edges.reduce((sum, e) => sum + edgeLength(e), 0);
}
