// T-shirt notch and grainline recipe.
// Pure rule tables — engine-agnostic. The engine (notch.ts) resolves these
// against live pieces; this file only says *which* notches the t-shirt needs.
//
// Convention used (one documented standard):
//   • 1 notch  = front reference
//   • 2 notches = back reference
//
// All positions are fractional (t ∈ [0, 1]) along the named edge.

import { NotchRule, GrainlineRule } from "../render/notch";
import { sleevedTopStitches } from "./tshirt-checks";
import { matchedNotch } from "./stitch";

export interface PieceNotches {
  readonly pieceName: string;
  readonly notches: readonly NotchRule[];
  readonly grainline: GrainlineRule;
}

// Phase A3 (Slice 51): the tee's own stitches — the SAME data stitchChecks
// verifies these seams against. A matched notch below can now never name an
// edge this seam doesn't actually have. Cap-ease is deliberately excluded:
// it's a multi-edge, EASED interface, so there's no single matched point —
// the armhole/cap notches stay hand-authored, same boundary as A2's
// panel-owned hem/waist-square checks.
const [SHOULDER, SIDE, UNDERARM] = sleevedTopStitches(["side"], false);

/** The complete notch + grainline recipe for a t-shirt. */
export const TSHIRT_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      matchedNotch(SHOULDER, "a", 0.5),
      matchedNotch(SIDE, "a", 0.5),
      { edgeName: "armhole", t: 0.33 }, // sleeve-cap ease — not a matched point
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(SHOULDER, "b", 0.5),
      matchedNotch(SHOULDER, "b", 0.5), // 2 = back reference (Slice 1's convention)
      matchedNotch(SIDE, "b", 0.5),
      { edgeName: "armhole", t: 0.33 },
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "sleeve",
    notches: [
      { edgeName: "capLeft", t: 0.5 },  // sleeve-cap ease — not a matched point
      { edgeName: "capRight", t: 0.5 },
      matchedNotch(UNDERARM, "a", 0.5),
      matchedNotch(UNDERARM, "b", 0.5),
    ],
    grainline: { topEdge: "capLeft", topT: 1.0, bottomEdge: "hem", bottomT: 0.5 },
  },
];
