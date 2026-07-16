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

import { point, CubicBezier, cubicLength } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece, edgeLength, pieceEdge } from "./piece";
import { Block, block } from "./block";

export function draftFront(m: Measurements): Piece {
  const d = derive(m);
  const cfNeck = point(0, d.frontNeckDepth);          // centre-front neck (on the fold)
  const hps = point(d.neckWidthHalf, 0);              // high point shoulder
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cfHem = point(0, m.length);

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
    { kind: "line", name: "side", start: underarm, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: cfHem },
    { kind: "line", name: "centerFront", start: cfHem, end: cfNeck },
  ];
  return { name: "front", onFold: true, edges };
}

export function draftBack(m: Measurements): Piece {
  const d = derive(m);
  const cbNeck = point(0, d.backNeckDepth);           // back neck barely dips
  const hps = point(d.neckWidthHalf, 0);
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cbHem = point(0, m.length);

  const edges: Edge[] = [
    { kind: "curve", name: "neckline", curve: {
        start: cbNeck,
        control1: point(0, d.backNeckDepth * 0.6),
        control2: point(d.neckWidthHalf * 0.45, 0),
        end: hps } },
    { kind: "line", name: "shoulder", start: hps, end: shoulder },
    { kind: "curve", name: "armhole", curve: {
        start: shoulder,
        control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
        control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
        end: underarm } },
    { kind: "line", name: "side", start: underarm, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: cbHem },
    { kind: "line", name: "centerBack", start: cbHem, end: cbNeck },
  ];
  return { name: "back", onFold: true, edges };
}

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

/** Total armhole length (front + back) — what the sleeve cap must match. */
export function armholeLength(m: Measurements): number {
  return edgeLength(pieceEdge(draftFront(m), "armhole")) +
         edgeLength(pieceEdge(draftBack(m), "armhole"));
}

export function draftSleeve(m: Measurements): Piece {
  const width = m.bicep + m.ease * 0.5;
  const capHeight = solveCapHeight(width, armholeLength(m) + CAP_EASE);
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
  return { name: "sleeve", onFold: false, edges };
}

/** Draft a complete t-shirt block from one set of measurements. */
export function draftTshirt(m: Measurements): Block {
  return block({ front: draftFront(m), back: draftBack(m), sleeve: draftSleeve(m) });
}
