// Component architecture, Phase B5 (Slice 57). Design: COMPONENT-ARCHITECTURE.md §5.
//
// Different character from B1-B4: there is no existing waistband code
// anywhere to extract or de-duplicate — the skirt's "waist" has only ever
// been a raw edge on the panel. This is Phase B's first genuinely NEW
// component, not a refactor, and §5's taxonomy only sketches two params
// (`depth`, `closure`), unlike Neckline's fully-specified §6. Design
// decided and flagged before building (Slice 57 scoping):
//
// GEOMETRY. A plain strip, cut on the fold exactly like the skirt's own
// front/back panels — same convention, so it sews together the same way:
// the fold (x=0) is one short end, the "seam" edge (length = half the
// finished waist circumference) sews to the front+back waist edges
// combined, the "end" edge is the other short end (where the closure
// sits), and "top" is the outer fold-over edge. Cut on a fold, this doubles
// to the FULL waist circumference — the same number the front panel's own
// "Waist (finished)" POM already reports, by construction (proven in
// waistband.test.ts, not asserted).
//
// CLOSURE — deliberately geometry-inert. A button vs. a hook-and-bar
// waistband are cut IDENTICALLY in real patternmaking; the closure only
// changes hardware/notions (already listed in recipe.ts's BOM), never the
// pattern shape. Typed here because §5 lists it as the component's param,
// but the geometry never reads it — unlike Neckline's `shape`, where an
// unimplemented value WOULD have changed the curve, `closure` genuinely
// has nothing to implement at the drafting layer.

import { point } from "../geometry";
import { Edge } from "./piece";
import { Component } from "./component";

export interface WaistbandParams {
  readonly depth: number; // cm, the band's height
  readonly closure: "button" | "hook"; // BOM/notions only — see file header
}

export const WAISTBAND_DEFAULT: WaistbandParams = { depth: 3.5, closure: "button" };

/** The Waistband component: one call drafts the whole band (cut on fold,
 *  like every other skirt piece), sized to the SAME finished waist the
 *  front/back panels already draft to. No exposed interfaces — nothing
 *  downstream attaches onto a waistband; only the recipe wires its own
 *  stitch INTO the "seam" edge from outside. */
export const waistband: Component<WaistbandParams> = (m, params) => {
  const halfCirc = (m.waist + m.ease) / 2; // half the finished circumference; doubled by the fold
  const depth = params.depth;

  const foldTop = point(0, 0);
  const endTop = point(halfCirc, 0);
  const endBottom = point(halfCirc, depth);
  const foldBottom = point(0, depth);

  const edges: Edge[] = [
    { kind: "line", name: "top", start: foldTop, end: endTop },
    { kind: "line", name: "end", start: endTop, end: endBottom },       // the closure end
    { kind: "line", name: "seam", start: endBottom, end: foldBottom },  // sews to front.waist + back.waist
    { kind: "line", name: "fold", start: foldBottom, end: foldTop },
  ];

  return {
    pieces: { waistband: { name: "waistband", onFold: true, edges } },
    stitches: [],
    interfaces: {},
  };
};
