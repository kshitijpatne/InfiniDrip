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
import { componentNode, composeBlock, garmentGrammar } from "./grammar";

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

/** The tee composition is the smallest real grammar: two bodice instances
 * feed the sleeve's target from their exposed armhole interfaces. Keeping the
 * resolver here makes the dependency visible without changing the public
 * `draftTshirt(m): Block` seam. */
export const TEE_GRAMMAR = garmentGrammar(
  "tee",
  [
    componentNode("front", "bodice", bodice, () => ({ position: "front" as const })),
    componentNode("back", "bodice", bodice, () => ({ position: "back" as const })),
    componentNode(
      "sleeve",
      "sleeve",
      sleeveComponent,
      (context) => ({
        targetArmhole:
          context.interfaceLength("front", "armhole") +
          context.interfaceLength("back", "armhole"),
      }),
      ["front", "back"],
    ),
  ],
  () => sleevedTopStitches(["side"], false),
);

/** Draft a complete t-shirt block from one set of measurements. */
export function draftTshirt(m: Measurements): Block {
  return composeBlock(TEE_GRAMMAR, m);
}
