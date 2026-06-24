// The export spine. Screen rendering is for looking at; export is for *making*.
// So here a piece becomes plain, true-scale geometry — every coordinate is a real
// centimetre — that any file format (SVG, DXF, later PDF) can write out verbatim.
//
//  flattenPiece : one Piece     -> two polylines (the sew line and the cut line)
//  layoutPieces : many flats    -> the same pieces packed side by side, no overlap
//
// Curves are already sampled into points by the seam-allowance sampler, so a
// "polyline" (a list of points) is all a plotter or cutter ever needs.

import { Point } from "../geometry";
import { Piece } from "../drafting";
import { outlinePoints, seamAllowance } from "../render";

/** A flattened outline: a closed loop of points, in centimetres. */
export type Polyline = readonly Point[];

export interface FlatPiece {
  readonly name: string;
  readonly sew: Polyline; // the stitching line (sew here)
  readonly cut: Polyline; // the cutting line = sew line + allowance (cut here)
}

/** Flatten one piece into true-scale sew and cut polylines. */
export function flattenPiece(piece: Piece, allowance: number): FlatPiece {
  return {
    name: piece.name,
    sew: outlinePoints(piece),
    cut: seamAllowance(piece, allowance),
  };
}

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

/** The box a polyline occupies. */
export function polylineBounds(pts: Polyline): Bounds {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export interface PlacedPiece {
  readonly name: string;
  readonly sew: Polyline; // translated into layout space
  readonly cut: Polyline;
}

export interface Layout {
  readonly pieces: readonly PlacedPiece[];
  readonly width: number; // cm
  readonly height: number; // cm
}

const MARGIN = 1; // cm border around the whole sheet
const GAP = 2; // cm of empty space between pieces

function translate(pts: Polyline, dx: number, dy: number): Polyline {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * Pack pieces left to right at true scale, tops aligned, separated by `gap` cm.
 * Placement uses the *cut* bounds, so the cutting lines never touch.
 */
export function layoutPieces(
  pieces: readonly FlatPiece[],
  gap = GAP,
  margin = MARGIN
): Layout {
  let cursor = margin;
  let maxH = 0;
  const placed = pieces.map((fp) => {
    const b = polylineBounds(fp.cut);
    const dx = cursor - b.minX;
    const dy = margin - b.minY;
    cursor += b.width + gap;
    maxH = Math.max(maxH, b.height);
    return { name: fp.name, sew: translate(fp.sew, dx, dy), cut: translate(fp.cut, dx, dy) };
  });
  const width = pieces.length > 0 ? cursor - gap + margin : margin * 2;
  return { pieces: placed, width, height: margin + maxH + margin };
}
