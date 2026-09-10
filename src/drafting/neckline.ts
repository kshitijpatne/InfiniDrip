// Component architecture, Phase B4 part 1 of 2 (Slice 55) + part 2 (Slice
// 56) + Slice 60 (real scoop, since superseded) + Slice 62 (curve
// construction rebuilt from scratch — see below). Design:
// COMPONENT-ARCHITECTURE.md §6.
//
// Carries the Slice 47 finding into code: a neckline style preference is not
// a body measurement (§7) and shouldn't live on `Measurements` or be baked
// into the bodice — it's its own concern, extracted here.
//
// Part 1 (Slice 55): only "crew" implemented. Part 2 (Slice 56): "v" got
// real curve math, widthEase/frontDrop and both guardrails became real.
// Slice 60 added "scoop" as its own curve shape (`scoopControlFactors`).
// "boat" still throws; no curve math for it exists anywhere.
//
// Slice 62 rewrite — why the old curve construction was wrong. Slice 61
// finally rendered this curve, unmirrored, on every view (body, garment,
// AND the actual cut pattern) and it read as a sharp V-plunge, not a round
// neckline — on the tee, the fitted, and the tank, front and back. Root
// cause, confirmed by sampling the actual Bézier and checking tangents at
// both endpoints: the OLD `control1` sat directly above centre-front
// (`point(0, depth * c1)`) — a control point on the SAME axis as the curve's
// own start point gives the curve a VERTICAL tangent at centre front, i.e.
// the curve leaves the fold running ALONG the fold, not away from it. Every
// independent pattern-drafting source agrees this is the one rule that
// matters here: a curved neckline must meet centre front (and centre back)
// at a RIGHT ANGLE to the fold, or cutting on the fold creates a peak/spike
// exactly where the two mirrored halves meet — which is exactly the bug.
// The old `control2` had the same problem at the shoulder end (sitting on
// the y=0 axis, parallel to the shoulder line instead of angled into it).
//
// The fix: swap which axis each control point leans on. `control1` (near
// centre front) now sits mostly ACROSS (large x, y pinned at the full
// depth) — tangent leaves the fold horizontally, perpendicular to it.
// `control2` (near the shoulder) now sits mostly DOWN (x pinned at the full
// width, small y) — tangent arrives near-vertically into the shoulder
// point, which is what makes the curve read as rounded rather than pointed
// there too. `K = 0.5523` is the standard cubic-Bézier constant for
// approximating a quarter-ellipse arc — this IS a real quarter-ellipse from
// (0, depth) to (width, 0), not an arbitrary curve shape; verified by
// rendering it, mirroring it, and confirming the join at centre front is a
// smooth round bottom with no seam.
//
// `scoopControlFactors` is GONE. Once the tangent rule is enforced, the
// curve's shape is fully determined by its two endpoints — there is no
// remaining degree of freedom for "rounder control points" to express a
// different shape. This matches what every drafting source says a scoop
// actually is: the SAME curve as crew, just deeper and wider — "for a scoop
// neck, you simply lower the curve at centre front, and widen at the
// shoulder if you want it wider" (Patternmaking: Easy Neckline Alterations).
// So `necklineEdge` no longer branches on "crew" vs "scoop" for curve
// shape — a scoop is just crew geometry plus `frontDrop`/`widthEase`, which
// the params already carried. `tank.ts` now declares the tank's scoop as
// `{ shape: "scoop", widthEase: 1.5, frontDrop: 5 }` — a genuinely deeper,
// wider curve. These two numbers are explicitly a starting decision, not a
// sourced exact: multiple references agree a scoop has no universal radius,
// width, depth, shoulder endpoint, or drafting formula — it's defined by
// depth/width relative to crew, not a fixed spec. Rendered and eyeballed
// against real scoop-tee references before landing on 5/1.5.
//
// Deliberately NOT done: NecklineParams is still not part of every recipe's
// public surface — only bodice.ts's BodiceParams (Slice 59) accepts it, and
// only the tank passes a non-default value (via `recipe.ts`'s
// `frontNeckline`/`backNeckline`, Slice 61). No UI control lets a person
// pick a neckline shape yet.
//
// Byte-identity requirement (§6) — DELIBERATELY BROKEN this slice, with
// Kshitij's explicit sign-off: the OLD "byte-identical to today" baseline
// encoded the spiked curve. Slice 62 moves `regression.test.ts`'s tee/
// fitted SVG/DXF/PDF/tech-pack baseline for the first time since Slice 45
// (which moved only the tech-pack hash). The shape everything now matches
// is the corrected quarter-ellipse curve, not the old one.

import { point, Point } from "../geometry";
import { Edge } from "./piece";
import type { Note } from "../guidance/note";

export interface NecklineParams {
  readonly shape: "crew" | "v" | "scoop" | "boat";
  readonly widthEase: number;  // cm added per side to the derived default; 0 = today
  readonly frontDrop: number;  // cm added to the derived front depth; 0 = today
}

export const NECKLINE_DEFAULT: NecklineParams = { shape: "crew", widthEase: 0, frontDrop: 0 };

/** The cubic-Bézier constant for approximating a quarter-ellipse arc with
 *  one Bézier segment (the standard circle/ellipse-approximation constant,
 *  4/3 * (sqrt(2) - 1) rounded). Shared by every curved neckline shape —
 *  crew and scoop no longer differ in curve CONSTRUCTION, only in the
 *  depth/width fed into it (see file header). */
const QUARTER_ELLIPSE_K = 0.5523;

/** One side's neckline: the high-point-shoulder and centre-fold points every
 *  bodice panel needs to place its OTHER edges, the "neckline" edge itself,
 *  and any "warn, never clamp" guidance notes the chosen params triggered.
 *  `baseDepth` is the panel's already-derived depth (frontNeckDepth or
 *  backNeckDepth, from `derive(m)`) BEFORE `frontDrop` — this function
 *  doesn't compute depth from chest, only shapes/positions the curve.
 *  `shoulderHalf`/`armholeDepth` exist ONLY for the two guardrail checks
 *  below; at NECKLINE_DEFAULT neither can fire. */
export function necklineEdge(
  position: "front" | "back",
  neckWidthHalf: number,
  baseDepth: number,
  shoulderHalf: number,
  armholeDepth: number,
  params: NecklineParams = NECKLINE_DEFAULT
): { readonly cNeck: Point; readonly hps: Point; readonly edge: Edge; readonly notes: readonly Note[] } {
  if (params.shape !== "crew" && params.shape !== "v" && params.shape !== "scoop") {
    throw new Error(`Neckline shape "${params.shape}" not yet implemented (crew, v, and scoop only)`);
  }

  const effectiveWidthHalf = neckWidthHalf + params.widthEase;
  const depth = position === "front" ? baseDepth + params.frontDrop : baseDepth;

  // Warn, never clamp (the project's standing rule) — the numbers below may
  // describe an invalid pattern, but drafting proceeds anyway; the person
  // decides what to do about it.
  const notes: Note[] = [];
  if (effectiveWidthHalf >= shoulderHalf) {
    notes.push({ level: "warn", text: "The neckline is wide enough to reach the shoulder seam." });
  }
  if (position === "front" && depth >= armholeDepth) {
    notes.push({ level: "warn", text: "The front neckline drops below the underarm." });
  }

  const cNeck = point(0, depth);
  const hps = point(effectiveWidthHalf, 0);

  let edge: Edge;
  if (params.shape === "v") {
    edge = { kind: "line", name: "neckline", start: cNeck, end: hps }; // a real V: two straight seams meeting at a point, no curve
  } else {
    // A true quarter-ellipse from cNeck to hps: control1 leans ACROSS (its y
    // is pinned at the full depth), giving a HORIZONTAL tangent at cNeck —
    // perpendicular to the centre-front fold, per the drafting rule this
    // slice fixes. control2 leans DOWN (its x is pinned at the full width),
    // giving a near-vertical tangent into the shoulder point.
    edge = { kind: "curve", name: "neckline", curve: {
        start: cNeck,
        control1: point(effectiveWidthHalf * QUARTER_ELLIPSE_K, depth),
        control2: point(effectiveWidthHalf, depth * QUARTER_ELLIPSE_K),
        end: hps,
      } };
  }

  return { cNeck, hps, edge, notes };
}
