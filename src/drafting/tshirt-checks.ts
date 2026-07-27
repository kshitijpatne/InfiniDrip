// Sewability checks for the sleeved-top family (tee + fitted), owned by the recipe.
//
// These are the garment-SPECIFIC facts the production-readiness checker used to
// hard-code: which front edges make the side seam, the sleeve-cap ease band, the
// square hem, the dart legs. A skirt has none of them. Moving them onto the recipe
// (as `sewabilityChecks`) is what lets `garmentReport` run a structurally different
// garment without asking every block for a "sleeve" and throwing when there isn't
// one. The engine now calls `recipe.sewabilityChecks(block, m)`; it never names a
// seam itself.
//
// Lives in the drafting layer (with the recipe it belongs to) and imports the pure
// check primitives directly from `../guidance/check` — that module depends only on
// geometry, so there is no drafting↔guidance cycle.

import { Block } from "./block";
import { Measurements } from "./measurements";
import { rolePiece } from "./block";
import { pieceEdge, edgeLength, edgeStart, edgeEnd } from "./piece";
import { dartOf } from "./dart";
import { CheckResult, matchLengths, inBand, squareCorner } from "../guidance/check";

// A sleeve cap is eased a touch longer than its armhole; outside this band the
// sleeve either won't reach or won't set in. (Matches the guidance layer.)
const CAP_EASE_LO = -1;
const CAP_EASE_HI = 4;

/** Sum the named front edges — a darted front splits its side around the mouth. */
function sideSeamLength(block: Block, edges: readonly string[]): number {
  return edges.reduce((sum, name) => sum + edgeLength(pieceEdge(rolePiece(block, "front"), name)), 0);
}

/** A dart closes cleanly only if its two legs are the same length. Null when the
 *  garment has no front dart. */
export function dartLegCheck(block: Block): CheckResult | null {
  const d = dartOf(rolePiece(block, "front"));
  if (!d) return null;
  const legs = rolePiece(block, "front").dart!.legs.map((n) => edgeLength(pieceEdge(rolePiece(block, "front"), n)));
  return matchLengths("Dart legs equal", legs[0], legs[1]);
}

/** The sewability-check function for a sleeved top, parameterised by the two facts
 *  tee and fitted differ on: which front edge(s) form the side seam, and whether the
 *  hem is trued square to the fold (an untrued darted front opts out). */
export function sleevedTopChecks(
  frontSideEdges: readonly string[],
  hemSquareToFold: boolean
): (block: Block, m: Measurements) => CheckResult[] {
  return (b) => {
    const checks: CheckResult[] = [
      matchLengths(
        "Shoulder seam (front ↔ back)",
        edgeLength(pieceEdge(rolePiece(b, "front"), "shoulder")),
        edgeLength(pieceEdge(rolePiece(b, "back"), "shoulder"))
      ),
      matchLengths(
        "Side seam (front ↔ back)",
        sideSeamLength(b, frontSideEdges),
        edgeLength(pieceEdge(rolePiece(b, "back"), "side"))
      ),
      matchLengths(
        "Sleeve underarm (left ↔ right)",
        edgeLength(pieceEdge(rolePiece(b, "sleeve"), "sideLeft")),
        edgeLength(pieceEdge(rolePiece(b, "sleeve"), "sideRight"))
      ),
      inBand(
        "Sleeve-cap ease",
        edgeLength(pieceEdge(rolePiece(b, "sleeve"), "capLeft")) + edgeLength(pieceEdge(rolePiece(b, "sleeve"), "capRight")) -
          (edgeLength(pieceEdge(rolePiece(b, "front"), "armhole")) + edgeLength(pieceEdge(rolePiece(b, "back"), "armhole"))),
        CAP_EASE_LO,
        CAP_EASE_HI
      ),
    ];

    if (hemSquareToFold) {
      const hem = pieceEdge(rolePiece(b, "front"), "hem");
      checks.push(
        squareCorner("Hem square to the fold", edgeStart(hem), edgeEnd(hem), edgeEnd(pieceEdge(rolePiece(b, "front"), "centerFront")))
      );
    }

    const dart = dartLegCheck(b);
    if (dart) checks.push(dart);

    return checks;
  };
}

/** Ordering metric for the size-run check: the front hem width. Recipe-owned so a
 *  different garment can order its run by whatever edge defines its size. */
export function frontHemWidth(block: Block): number {
  return edgeLength(pieceEdge(rolePiece(block, "front"), "hem"));
}
