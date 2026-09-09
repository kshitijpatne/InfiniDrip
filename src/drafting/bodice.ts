// Component architecture, Phase B2 (Slice 53). Design: COMPONENT-ARCHITECTURE.md §2.2, §5.
//
// The duplication §2.2 measured: draftFront and draftBack were ~90% identical
// — same hps/shoulder/underarm/sideHem, same shoulder/armhole/side/hem edges
// with the same control points — differing in exactly three things: neck
// depth, the neckline curve's first control point, and the centre edge's
// name. `bodicePanel` below is that shared 90%, taking the three differences
// as params; `bodice`, the Component, supplies them for "front" vs "back".
//
// Scope, deliberately narrow: this closes the draftFront/draftBack
// duplication ONLY, per B2's own scope. The fitted front (`fitted.ts`) shares
// the same neckline/shoulder/armhole prefix but then diverges into dart
// edges and a shifted hem — real, different geometry, not more of this same
// duplication. Folding it into `bodice` too is a real candidate for a later
// slice, not assumed here.

import { point } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece } from "./piece";
import { Component } from "./component";
import { iface, edgeRef } from "./stitch";

export interface BodiceParams {
  readonly position: "front" | "back";
}

interface PanelOptions {
  readonly neckDepth: number;
  readonly necklineControl1Factor: number; // control1.y = neckDepth * this
  readonly centerEdgeName: string;
  readonly pieceName: string;
}

/** The shared 90%: neckline, shoulder, armhole, side, hem — everything
 *  draftFront and draftBack agreed on, parameterised by the three things
 *  they didn't. */
function bodicePanel(m: Measurements, opts: PanelOptions): Piece {
  const d = derive(m);
  const cNeck = point(0, opts.neckDepth);
  const hps = point(d.neckWidthHalf, 0);
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cHem = point(0, m.length);

  const edges: Edge[] = [
    { kind: "curve", name: "neckline", curve: {
        start: cNeck,
        control1: point(0, opts.neckDepth * opts.necklineControl1Factor),
        control2: point(d.neckWidthHalf * 0.45, 0),
        end: hps } },
    { kind: "line", name: "shoulder", start: hps, end: shoulder },
    { kind: "curve", name: "armhole", curve: {
        start: shoulder,
        control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
        control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
        end: underarm } },
    { kind: "line", name: "side", start: underarm, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: cHem },
    { kind: "line", name: opts.centerEdgeName, start: cHem, end: cNeck },
  ];
  return { name: opts.pieceName, onFold: true, edges };
}

/** The Bodice component: one call drafts ONE panel (front or back) — a
 *  recipe calls it twice and assembles both, same as it would call any other
 *  Component twice for a symmetric pair. Exposes its own "armhole" interface
 *  so a later Sleeve component (B3) can read it without the recipe having to
 *  know the panel's internal edge names. */
export const bodice: Component<BodiceParams> = (m, params) => {
  const d = derive(m);
  const opts: PanelOptions =
    params.position === "front"
      ? { neckDepth: d.frontNeckDepth, necklineControl1Factor: 0.55, centerEdgeName: "centerFront", pieceName: "front" }
      : { neckDepth: d.backNeckDepth, necklineControl1Factor: 0.6, centerEdgeName: "centerBack", pieceName: "back" };
  const piece = bodicePanel(m, opts);
  return {
    pieces: { [params.position]: piece },
    stitches: [],
    interfaces: { armhole: iface(edgeRef(params.position, "armhole")) },
  };
};
