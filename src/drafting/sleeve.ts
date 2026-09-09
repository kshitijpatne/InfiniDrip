// Component architecture, Phase B3 (Slice 54). Design: COMPONENT-ARCHITECTURE.md §2.4, §5.
//
// The latent coupling §2.4 documented: draftSleeve fit its cap to
// armholeLength(m) — a RE-DRAFTED tee bodice — not to the bodice actually
// present in the block being assembled. At STANDARD_M this was harmless only
// because fitted's front reuses the tee front's exact armhole curve; any
// future bodice whose armhole genuinely differs (raglan, dropped shoulder, a
// shirt block) would silently get a sleeve fitted to a number from a
// DIFFERENT garment. The fix: the Sleeve component takes `targetArmhole` as
// a param — the caller passes in the REAL length measured off the pieces it
// just assembled, not a re-derivation.

import { point, CubicBezier, cubicLength } from "../geometry";
import { Edge } from "./piece";
import { Component } from "./component";

// A sleeve cap is eased slightly longer than the armhole it sets into.
const CAP_EASE = 1.5;

// The two halves of the sleeve cap as Bézier curves, for a given width/height.
// Used both to measure the cap (when fitting it) and to build the real edges,
// so the measured length always equals the drawn length.
function capCurves(width: number, capHeight: number): readonly [CubicBezier, CubicBezier] {
  const half = width / 2;
  const left: CubicBezier = {
    start: point(0, capHeight),
    control1: point(half * 0.5, capHeight),
    control2: point(half * 0.55, capHeight * 0.15),
    end: point(half, 0),
  };
  const right: CubicBezier = {
    start: point(half, 0),
    control1: point(width - half * 0.55, capHeight * 0.15),
    control2: point(width - half * 0.5, capHeight),
    end: point(width, capHeight),
  };
  return [left, right];
}

function capLengthFor(width: number, capHeight: number): number {
  const [left, right] = capCurves(width, capHeight);
  return cubicLength(left) + cubicLength(right);
}

// The cap gets longer as it gets taller, so we binary-search the height that
// makes the cap the target length. (If the bicep is so wide that even a flat
// cap is too long, this lands at ~0 and the guidance layer flags the conflict.)
function solveCapHeight(width: number, target: number): number {
  let lo = 0;
  let hi = width;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (capLengthFor(width, mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface SleeveParams {
  /** The REAL total armhole length (front + back) of the bodice this sleeve
   *  is being set into — measured off the actual assembled pieces, not
   *  re-derived from a generic one. */
  readonly targetArmhole: number;
}

/** The Sleeve component. No exposed interfaces yet: nothing downstream
 *  attaches onto a sleeve today (only the recipe's cap-ease stitch attaches
 *  ONTO it, from the armhole side) — added if a real second consumer needs
 *  one, not speculatively. */
export const sleeve: Component<SleeveParams> = (m, params) => {
  const width = m.bicep + m.ease * 0.5;
  const capHeight = solveCapHeight(width, params.targetArmhole + CAP_EASE);
  const taper = 3;
  const hemY = capHeight + m.sleeveLength;
  const [capLeft, capRight] = capCurves(width, capHeight);
  const rightHem = point(width - taper, hemY);
  const leftHem = point(taper, hemY);

  const edges: Edge[] = [
    { kind: "curve", name: "capLeft", curve: capLeft },
    { kind: "curve", name: "capRight", curve: capRight },
    { kind: "line", name: "sideRight", start: point(width, capHeight), end: rightHem },
    { kind: "line", name: "hem", start: rightHem, end: leftHem },
    { kind: "line", name: "sideLeft", start: leftHem, end: point(0, capHeight) },
  ];
  return {
    pieces: { sleeve: { name: "sleeve", onFold: false, edges } },
    stitches: [],
    interfaces: {},
  };
};
