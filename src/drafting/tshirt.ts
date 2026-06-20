// The drafting engine: measurements in, t-shirt block out.
//
// Coordinate convention (all cm): each piece has its own frame, x increases
// right, y increases down (matching SVG). FRONT and BACK are half-pieces cut on
// the fold — the fold is the left edge (x = 0). SLEEVE is a full, symmetric piece.
//
// Every piece is built by placing a few named construction points, then joining
// them with named straight or curved edges. Curve control points bend an edge
// toward themselves without touching — that is how necklines and armholes scoop.

import { point } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece } from "./piece";

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

export function draftSleeve(m: Measurements): Piece {
  const width = m.bicep + m.ease * 0.5; // sleeve width, with a little ease
  const half = width / 2;
  const capHeight = m.armholeDepth * 0.55;
  const taper = 3;                       // sleeve narrows slightly toward the hem
  const hemY = capHeight + m.sleeveLength;

  const leftUnderarm = point(0, capHeight);
  const capTop = point(half, 0);
  const rightUnderarm = point(width, capHeight);
  const rightHem = point(width - taper, hemY);
  const leftHem = point(taper, hemY);

  const edges: Edge[] = [
    { kind: "curve", name: "capLeft", curve: {
        start: leftUnderarm,
        control1: point(half * 0.5, capHeight),
        control2: point(half * 0.55, capHeight * 0.15),
        end: capTop } },
    { kind: "curve", name: "capRight", curve: {
        start: capTop,
        control1: point(width - half * 0.55, capHeight * 0.15),
        control2: point(width - half * 0.5, capHeight),
        end: rightUnderarm } },
    { kind: "line", name: "sideRight", start: rightUnderarm, end: rightHem },
    { kind: "line", name: "hem", start: rightHem, end: leftHem },
    { kind: "line", name: "sideLeft", start: leftHem, end: leftUnderarm },
  ];
  return { name: "sleeve", onFold: false, edges };
}

export interface TshirtBlock {
  readonly front: Piece;
  readonly back: Piece;
  readonly sleeve: Piece;
}

/** Draft a complete t-shirt block from one set of measurements. */
export function draftTshirt(m: Measurements): TshirtBlock {
  return { front: draftFront(m), back: draftBack(m), sleeve: draftSleeve(m) };
}
