// Sewability for the sleeved-top family (tee + fitted), owned by the recipe.
//
// Phase A2 (Slice 49 built the proof; this slice acts on it — see
// COMPONENT-ARCHITECTURE.md §9). The seam facts (shoulder, side, sleeve
// underarm, sleeve-cap ease, dart) are no longer hand-checked here — they're
// declared as data (`sleevedTopStitches`) and verified generically by
// `stitchChecks`. What's left in this file is only what genuinely isn't a
// stitch: a hem being square to the fold is a property of ONE panel, not a
// seam between two — there's no "other side" to compare it to.
//
// `dartLegCheck` and `frontHemWidth` are UNCHANGED by this migration — the
// dart-leg fact is now also expressed as a stitch (equivalent, proven in
// stitch.test.ts), but the standalone function stays: it's independently
// useful and independently tested (garment-check.test.ts's failing-leg case).

import { Block, rolePiece } from "./block";
import { Measurements } from "./measurements";
import { pieceEdge, edgeLength, edgeStart, edgeEnd } from "./piece";
import { dartOf } from "./dart";
import { CheckResult, matchLengths, squareCorner } from "../guidance/check";
import { Stitch, edgeRef, iface } from "./stitch";

/** A dart closes cleanly only if its two legs are the same length. Null when the
 *  garment has no front dart. Kept as a standalone check (not just a stitch):
 *  useful anywhere a single dart needs verifying on its own, and already
 *  covered by its own tests. */
export function dartLegCheck(block: Block): CheckResult | null {
  const d = dartOf(rolePiece(block, "front"));
  if (!d) return null;
  const legs = rolePiece(block, "front").dart!.legs.map((n) => edgeLength(pieceEdge(rolePiece(block, "front"), n)));
  return matchLengths("Dart legs equal", legs[0], legs[1]);
}

/**
 * The stitches for a sleeved top, parameterised by the two facts tee and
 * fitted differ on: which front edge(s) form the side seam, and whether the
 * front carries a dart (structural per recipe — a tee never has one, a
 * fitted front always does, at every measurement; not a per-block fact to
 * detect, so it's a plain argument here rather than a runtime check).
 */
export function sleevedTopStitches(frontSideEdges: readonly string[], hasDart: boolean): Stitch[] {
  const stitches: Stitch[] = [
    {
      label: "Shoulder seam (front ↔ back)",
      a: iface(edgeRef("front", "shoulder")),
      b: iface(edgeRef("back", "shoulder")),
    },
    {
      label: "Side seam (front ↔ back)",
      a: iface(...frontSideEdges.map((e) => edgeRef("front", e))),
      b: iface(edgeRef("back", "side")),
    },
    {
      label: "Sleeve underarm (left ↔ right)",
      a: iface(edgeRef("sleeve", "sideLeft")),
      b: iface(edgeRef("sleeve", "sideRight")),
    },
    {
      label: "Sleeve-cap ease",
      a: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
      b: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
      ease: { lo: -1, hi: 4 },
    },
  ];
  if (hasDart) {
    stitches.push({
      label: "Dart legs equal",
      a: iface(edgeRef("front", "bustDartUpper")),
      b: iface(edgeRef("front", "bustDartLower")),
    });
  }
  return stitches;
}

/** What's left once the stitches above are declared: a hem being square to
 *  the fold, true only for the garments whose front hem was trued (an
 *  untrued darted front opts out — same rule as before this migration). */
export function sleevedTopPanelChecks(
  hemSquareToFold: boolean
): (block: Block, m: Measurements) => CheckResult[] {
  return (b) => {
    if (!hemSquareToFold) return [];
    const hem = pieceEdge(rolePiece(b, "front"), "hem");
    return [
      squareCorner(
        "Hem square to the fold",
        edgeStart(hem),
        edgeEnd(hem),
        edgeEnd(pieceEdge(rolePiece(b, "front"), "centerFront"))
      ),
    ];
  };
}

/** Ordering metric for the size-run check: the front hem width. Recipe-owned so a
 *  different garment can order its run by whatever edge defines its size. */
export function frontHemWidth(block: Block): number {
  return edgeLength(pieceEdge(rolePiece(block, "front"), "hem"));
}
