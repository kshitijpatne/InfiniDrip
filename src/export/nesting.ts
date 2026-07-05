// Fabric nesting — the estimator. Given the pieces and a bolt width, how long a
// length of cloth do you need, and how much of it is actually pattern?
//
// This is a *layout helper, not a production marker*. It packs by bounding box
// with the grain kept upright (no rotation): for an axis-aligned box under a
// grain constraint, 0 and 180 give the identical box and 90 would tip the grain
// sideways, so rotation cannot tighten this kind of nest — real interlock needs
// polygon nesting (a no-fit-polygon), which is out of scope. What it *can* do
// honestly is a width-aware shelf pack and a true-area utilization read-out.
//
//   nestPieces : flats + bolt width -> placed pieces, fabric length, utilization
//
// It rides the same FlatPiece/PlacedPiece spine as layoutPieces, and — like the
// rest of export — it never mutates: placement is pure translation of copies.

import { Polyline, FlatPiece, PlacedPiece, polylineBounds } from "./layout";

/** Absolute area enclosed by a closed polyline (the shoelace formula), cm². */
export function polygonArea(pts: Polyline): number {
  let twice = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    twice += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twice) / 2;
}

export interface NestResult {
  readonly placed: readonly PlacedPiece[];
  readonly fabricWidth: number; // cm — the bolt width (given)
  readonly fabricLength: number; // cm — how far down the bolt the nest reaches
  readonly utilization: number; // 0..1 — piece area ÷ sheet area (true, not bbox)
  readonly fits: boolean; // false if any piece is wider than the usable width
}

const MARGIN = 1; // cm border along the cloth edges
const GAP = 2; // cm of empty cloth between pieces

function translate(pts: Polyline, dx: number, dy: number): Polyline {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * Shelf-pack pieces down a bolt of `fabricWidth` cm. Tallest pieces first, laid
 * left to right on a shelf; when the next piece would run past the width, a new
 * shelf starts below. Fabric length is where the last shelf ends.
 * Utilization uses each piece's *cut* area (real cloth consumed, gaps excluded).
 */
export function nestPieces(
  pieces: readonly FlatPiece[],
  fabricWidth: number,
  gap = GAP,
  margin = MARGIN
): NestResult {
  const usable = fabricWidth - margin; // right edge pieces may reach
  // Tallest-first packs shelves tighter; copy before sorting (never mutate input).
  const order = [...pieces].sort(
    (a, b) => polylineBounds(b.cut).height - polylineBounds(a.cut).height
  );

  let shelfX = margin;
  let shelfY = margin;
  let shelfH = 0;
  let fits = true;

  const placed = order.map((fp) => {
    const box = polylineBounds(fp.cut);
    if (box.width > usable - margin) fits = false;
    // Wrap to a new shelf if this piece would overrun the width (but never on an
    // empty shelf — a too-wide piece still has to go somewhere).
    if (shelfX > margin && shelfX + box.width > usable) {
      shelfY += shelfH + gap;
      shelfX = margin;
      shelfH = 0;
    }
    const dx = shelfX - box.minX;
    const dy = shelfY - box.minY;
    shelfX += box.width + gap;
    shelfH = Math.max(shelfH, box.height);
    return { name: fp.name, sew: translate(fp.sew, dx, dy), cut: translate(fp.cut, dx, dy) };
  });

  const fabricLength = pieces.length > 0 ? shelfY + shelfH + margin : margin * 2;
  const used = order.reduce((sum, fp) => sum + polygonArea(fp.cut), 0);
  const utilization = used / (fabricWidth * fabricLength);
  return { placed, fabricWidth, fabricLength, utilization, fits };
}
