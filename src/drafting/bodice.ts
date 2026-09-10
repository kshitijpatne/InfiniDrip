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
//
// Phase B4 part 1 (Slice 55): the neckline curve itself — including the
// 0.55/0.6 control-point factor this file used to own as
// `necklineControl1Factor` — moved out to `neckline.ts`. This file now only
// knows the DEPTH each side derives from chest measurements; the shape of
// the curve at that depth belongs to the Neckline component.

import { point } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece } from "./piece";
import { Component } from "./component";
import { iface, edgeRef } from "./stitch";
import { necklineEdge, NecklineParams, NECKLINE_DEFAULT } from "./neckline";
import { sleevelessArmhole } from "./armhole";

export interface BodiceParams {
  readonly position: "front" | "back";
  /** Optional (Phase C2, Slice 59) — defaults to NECKLINE_DEFAULT (crew),
   *  the ONLY value tee/fitted have ever passed, so this is additive: their
   *  output is unaffected. The tank is the first caller to pass something
   *  else (a v-neck front), which is the whole reason this exists — Slice
   *  56 built real non-default neckline behaviour with nothing able to
   *  reach it yet; this is that wiring, done once a real second consumer
   *  needed it, not speculatively ahead of one. */
  readonly necklineParams?: NecklineParams;
  /** Optional (Slice 63) — undefined (the default) draws the SLEEVED
   *  armhole curve, byte-identical to every panel before this slice. A
   *  sleeveless garment passes `m.strapWidth`, which swaps in
   *  `sleevelessArmhole()`'s curve instead — see armhole.ts and
   *  TANK-RESEARCH.md for why this needed its own curve rather than
   *  reusing the sleeved one. */
  readonly strapWidth?: number;
}

interface PanelOptions {
  readonly neckDepth: number;
  readonly centerEdgeName: string;
  readonly pieceName: string;
}

/** The shared 90%: neckline, shoulder, armhole, side, hem — everything
 *  draftFront and draftBack agreed on, parameterised by the three things
 *  they didn't. */
function bodicePanel(
  m: Measurements,
  position: "front" | "back",
  opts: PanelOptions,
  necklineParams: NecklineParams,
  strapWidth: number | undefined
): Piece {
  const d = derive(m);
  const { cNeck, hps, edge: neckline } = necklineEdge(
    position, d.neckWidthHalf, opts.neckDepth, d.shoulderHalf, m.armholeDepth, necklineParams
  );
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cHem = point(0, m.length);

  // Sleeved (default): the shoulder point sits at the TRUE shoulder edge,
  // and the armhole curve is shaped to receive a set-in sleeve cap.
  // Sleeveless (`strapWidth` given): the strap sits IN from that edge, and
  // the armhole is `sleevelessArmhole()`'s open-scoop curve instead — see
  // armhole.ts.
  const shoulderEdges: Edge[] =
    strapWidth === undefined
      ? (() => {
          const shoulder = point(d.shoulderHalf, d.shoulderSlope);
          return [
            { kind: "line", name: "shoulder", start: hps, end: shoulder },
            { kind: "curve", name: "armhole", curve: {
                start: shoulder,
                control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
                control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
                end: underarm } },
          ];
        })()
      : (() => {
          const { strap, edge } = sleevelessArmhole(
            strapWidth, hps.x, d.shoulderHalf, d.shoulderSlope, d.chestWidthHalf, m.armholeDepth);
          return [
            { kind: "line", name: "shoulder", start: hps, end: strap },
            edge,
          ];
        })();

  const edges: Edge[] = [
    neckline,
    ...shoulderEdges,
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
      ? { neckDepth: d.frontNeckDepth, centerEdgeName: "centerFront", pieceName: "front" }
      : { neckDepth: d.backNeckDepth, centerEdgeName: "centerBack", pieceName: "back" };
  const piece = bodicePanel(m, params.position, opts, params.necklineParams ?? NECKLINE_DEFAULT, params.strapWidth);
  return {
    pieces: { [params.position]: piece },
    stitches: [],
    interfaces: { armhole: iface(edgeRef(params.position, "armhole")) },
  };
};
