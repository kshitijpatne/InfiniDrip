// DXF export — the format CAD tools and professional cutters read. DXF is just
// text: pairs of (group code, value), one per line. We emit a minimal R12 file
// with old-style POLYLINE entities, which virtually every tool imports.
//
// Two differences from our internal world, both handled here:
//   - layers: cut lines go on a "CUT" layer, sew lines on "SEW", so the user can
//     toggle them apart in CAD.
//   - up is up: our y grows downward (screen style); CAD's y grows upward, so we
//     flip every y to height - y, otherwise the pattern imports upside down.
// Coordinates are in centimetres (same as everywhere else in the app).

import { Piece, AllowanceSpec } from "../drafting";
import { flattenPiece, layoutPieces, Polyline } from "./layout";

const num = (n: number): string => (Math.round(n * 1000) / 1000).toString();

/** One DXF (group code, value) pair: two lines. */
function pair(code: number, value: string | number): string {
  return `${code}\n${value}\n`;
}

/** A closed POLYLINE entity on `layer`, with y flipped to CAD's up-axis. */
function polyline(pts: Polyline, layer: string, height: number): string {
  let out = pair(0, "POLYLINE") + pair(8, layer) + pair(66, 1) + pair(70, 1);
  for (const p of pts) {
    out += pair(0, "VERTEX") + pair(8, layer) +
      pair(10, num(p.x)) + pair(20, num(height - p.y));
  }
  return out + pair(0, "SEQEND");
}

/** A minimal DXF of the pieces: cut lines on layer CUT, sew lines on layer SEW. */
export function exportDxf(pieces: readonly Piece[], allowance: AllowanceSpec): string {
  const layout = layoutPieces(pieces.map((p) => flattenPiece(p, allowance)));
  const entities = layout.pieces
    .map((p) => polyline(p.cut, "CUT", layout.height) + polyline(p.sew, "SEW", layout.height))
    .join("");
  return pair(0, "SECTION") + pair(2, "ENTITIES") + entities +
    pair(0, "ENDSEC") + pair(0, "EOF");
}
