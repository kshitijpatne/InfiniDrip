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
import { Edge, Piece, edgeLength, pieceEdge } from "./piece";
import { Block } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { ComponentResult, assembleComponents } from "./component";
import { iface, edgeRef } from "./stitch";
import { necklineEdge } from "./neckline";

const DART_INTAKE = 4; // cm taken up across the dart mouth on the side seam

export function draftFittedFront(m: Measurements): Piece {
  const d = derive(m);
  const { cNeck: cfNeck, hps, edge: neckline } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, m.armholeDepth);
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  // The dart's mouth opens ON the side seam, so closing the dart SHORTENS that
  // seam by the intake. The side must therefore run DART_INTAKE cm longer than
  // the back's, so the two match once the dart is sewn shut. The open front hem
  // consequently slants down at the side — that's a correct untrued flat pattern;
  // truing (levelling the hem after closing) comes with dart manipulation.
  const sideHem = point(d.chestWidthHalf, m.length + DART_INTAKE);
  const cfHem = point(0, m.length);

  // Bust point (dart apex): interior, below the underarm line, ~halfway in.
  const bustY = m.armholeDepth + (m.length - m.armholeDepth) * 0.28;
  const apex = point(d.chestWidthHalf * 0.55, bustY);
  // Mouth: a gap on the side seam, centred at bust height, DART_INTAKE cm tall.
  const mouthUpper = point(d.chestWidthHalf, bustY - DART_INTAKE / 2);
  const mouthLower = point(d.chestWidthHalf, bustY + DART_INTAKE / 2);

  const edges: Edge[] = [
    neckline,
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

/** A fitted block: a darted front, with the tee's back and sleeve reused as-is.
 *  Phase B3 (Slice 54, §2.4): the sleeve is fit to the armhole measured off
 *  THIS front (the real darted piece just drafted), not a re-derived generic
 *  one — the actual fix, even though the number comes out identical here
 *  because the fitted front reuses the tee front's exact armhole curve. */
export function draftFitted(m: Measurements): Block {
  const front: ComponentResult = {
    pieces: { front: draftFittedFront(m) },
    stitches: [],
    interfaces: { armhole: iface(edgeRef("front", "armhole")) },
  };
  const back = bodice(m, { position: "back" });
  const targetArmhole =
    edgeLength(pieceEdge(front.pieces.front, "armhole")) +
    edgeLength(pieceEdge(back.pieces.back, "armhole"));
  const sleeveResult = sleeveComponent(m, { targetArmhole });
  return assembleComponents(
    [front, back, sleeveResult],
    sleevedTopStitches(["sideUpper", "sideLower"], true)
  );
}
