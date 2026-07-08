// The fitted garment — the first NON-tee recipe, and proof of the engine/recipe
// split: it reuses the tee's own back and sleeve untouched, and only swaps in a
// darted front. The front carries a side BUST DART: a wedge whose apex sits at
// the bust point and whose mouth opens on the side seam. Sew the two legs
// together and the flat panel cones over the bust — that's the shaping a boxy
// tee can't give.
//
// The dart lives IN the outline (two named leg edges meeting at the apex), so it
// draws truthfully and its apex is a real vertex the editor can grab. Truing the
// dart (re-closing the side seam so allowances match) is a later concern.

import { point } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece } from "./piece";
import { draftBack, draftSleeve, TshirtBlock } from "./tshirt";

const DART_INTAKE = 4; // cm taken up across the dart mouth on the side seam

export function draftFittedFront(m: Measurements): Piece {
  const d = derive(m);
  const cfNeck = point(0, d.frontNeckDepth);
  const hps = point(d.neckWidthHalf, 0);
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cfHem = point(0, m.length);

  // Bust point (dart apex): interior, below the underarm line, ~halfway in.
  const bustY = m.armholeDepth + (m.length - m.armholeDepth) * 0.28;
  const apex = point(d.chestWidthHalf * 0.55, bustY);
  // Mouth: a gap on the side seam, centred at bust height, DART_INTAKE cm tall.
  const mouthUpper = point(d.chestWidthHalf, bustY - DART_INTAKE / 2);
  const mouthLower = point(d.chestWidthHalf, bustY + DART_INTAKE / 2);

  const edges: Edge[] = [
    { kind: "curve", name: "neckline", curve: {
        start: cfNeck,
        control1: point(0, d.frontNeckDepth * 0.55),
        control2: point(d.neckWidthHalf * 0.45, 0),
        end: hps } },
    { kind: "line", name: "shoulder", start: hps, end: shoulder },
    { kind: "curve", name: "armhole", curve: {
        start: shoulder,
        control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
        control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
        end: underarm } },
    { kind: "line", name: "sideUpper", start: underarm, end: mouthUpper },
    { kind: "line", name: "bustDartUpper", start: mouthUpper, end: apex }, // mouthUpper -> apex
    { kind: "line", name: "bustDartLower", start: apex, end: mouthLower }, // apex -> mouthLower
    { kind: "line", name: "sideLower", start: mouthLower, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: cfHem },
    { kind: "line", name: "centerFront", start: cfHem, end: cfNeck },
  ];
  return {
    name: "fitted front",
    onFold: true,
    edges,
    dart: { legs: ["bustDartUpper", "bustDartLower"] },
  };
}

/** A fitted block: a darted front, with the tee's back and sleeve reused as-is. */
export function draftFitted(m: Measurements): TshirtBlock {
  return { front: draftFittedFront(m), back: draftBack(m), sleeve: draftSleeve(m) };
}
