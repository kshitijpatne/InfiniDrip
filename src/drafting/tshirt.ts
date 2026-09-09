// The drafting engine: measurements in, t-shirt block out.
//
// Coordinate convention (all cm): each piece has its own frame, x increases
// right, y increases down (matching SVG). FRONT and BACK are half-pieces cut on
// the fold — the fold is the left edge (x = 0). SLEEVE is a full, symmetric piece.
//
// Pieces are built by placing named construction points, then joining them with
// named straight or curved edges. Curve control points bend an edge toward
// themselves without touching — that is how necklines and armholes scoop.
//
// The sleeve cap is special: its length is fitted to the armhole length (plus a
// little ease) so the sleeve actually sews into the armhole — see draftSleeve.

import { Measurements } from "./measurements";
import { Piece, edgeLength, pieceEdge } from "./piece";
import { Block } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { assembleComponents } from "./component";

/** Thin wrapper over the Bodice component (Phase B2, Slice 53) — kept so
 *  existing callers (armholeLength below, fitted.ts's draftBack reuse,
 *  tests) don't need to know a component exists underneath. */
export function draftFront(m: Measurements): Piece {
  return bodice(m, { position: "front" }).pieces.front;
}

export function draftBack(m: Measurements): Piece {
  return bodice(m, { position: "back" }).pieces.back;
}

/** Total armhole length (front + back) of a GENERIC tee bodice — a
 *  re-derivation, kept for callers with no real assembled bodice on hand
 *  (direct tests, the legacy draftSleeve wrapper below). Phase B3 (Slice
 *  54, §2.4): production drafting no longer goes through this — draftTshirt
 *  and draftFitted measure the armhole off the ACTUAL pieces they just
 *  assembled instead, so a future bodice whose armhole genuinely differs
 *  can no longer silently fit a sleeve to the wrong number. */
export function armholeLength(m: Measurements): number {
  return edgeLength(pieceEdge(draftFront(m), "armhole")) +
         edgeLength(pieceEdge(draftBack(m), "armhole"));
}

/** Thin wrapper over the Sleeve component (Phase B3, Slice 54), fit to the
 *  GENERIC tee armhole above — kept for direct callers/tests. Real recipes
 *  call the `sleeve` component directly with their own measured armhole. */
export function draftSleeve(m: Measurements): Piece {
  return sleeveComponent(m, { targetArmhole: armholeLength(m) }).pieces.sleeve;
}

/** Draft a complete t-shirt block from one set of measurements. */
export function draftTshirt(m: Measurements): Block {
  const front = bodice(m, { position: "front" });
  const back = bodice(m, { position: "back" });
  const targetArmhole =
    edgeLength(pieceEdge(front.pieces.front, "armhole")) +
    edgeLength(pieceEdge(back.pieces.back, "armhole"));
  const sleeveResult = sleeveComponent(m, { targetArmhole });
  return assembleComponents([front, back, sleeveResult], sleevedTopStitches(["side"], false));
}
