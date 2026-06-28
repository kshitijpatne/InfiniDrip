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

export interface PieceNotches {
  readonly pieceName: string;
  readonly notches: readonly NotchRule[];
  readonly grainline: GrainlineRule;
}

/** The complete notch + grainline recipe for a t-shirt. */
export const TSHIRT_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "side",     t: 0.5 },
      { edgeName: "armhole",  t: 0.33 },
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "side",     t: 0.5 },
      { edgeName: "armhole",  t: 0.33 },
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "sleeve",
    notches: [
      { edgeName: "capLeft",   t: 0.5 },
      { edgeName: "capRight",  t: 0.5 },
      { edgeName: "sideLeft",  t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ],
    grainline: { topEdge: "capLeft", topT: 1.0, bottomEdge: "hem", bottomT: 0.5 },
  },
];
