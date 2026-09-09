// Component architecture, Phase B4 part 1 of 2 (Slice 55) + part 2 (Slice
// 56). Design: COMPONENT-ARCHITECTURE.md §6.
//
// Carries the Slice 47 finding into code: a neckline style preference is not
// a body measurement (§7) and shouldn't live on `Measurements` or be baked
// into the bodice — it's its own concern, extracted here.
//
// Part 1 (Slice 55) was deliberately narrower than §6's end state: only
// "crew" implemented, widthEase/frontDrop both threw if non-zero. Part 2
// closes that gap for real: "v" now has actual curve math (a straight line
// to a point — the true-to-life V, no curve), widthEase/frontDrop are
// genuinely applied, and the two "warn, never clamp" guardrails §6 specifies
// are real and exercised. "scoop"/"boat" still throw — no curve math for
// them exists anywhere, and they ship with the shirt block per §6's own
// scope decision (§11 Q2), not invented speculatively here.
//
// Deliberately NOT done this slice (flagged before building, Slice 56
// scoping): NecklineParams is NOT threaded through BodiceParams or any
// recipe. A v-neck tee isn't draftable end-to-end yet — nothing outside
// this file's own tests can reach a non-default NecklineParams. That's a
// real, separate "wire it to something a person can reach" slice, once a UI
// control exists to drive it; building that wiring speculatively now, with
// no control to test it against, would be exactly backwards from how every
// other Phase B slice proved itself against something real.
//
// Byte-identity requirement (§6), still true at NECKLINE_DEFAULT after this
// slice: with `{shape:"crew", widthEase:0, frontDrop:0}`, this must emit the
// EXACT neckline curve draftFront/draftBack emit today — same control
// points, including the 0.55 (front) / 0.6 (back) factor that used to live
// in bodice.ts's PanelOptions.

import { point, Point } from "../geometry";
import { Edge } from "./piece";
import type { Note } from "../guidance/note";

export interface NecklineParams {
  readonly shape: "crew" | "v" | "scoop" | "boat";
  readonly widthEase: number;  // cm added per side to the derived default; 0 = today
  readonly frontDrop: number;  // cm added to the derived front depth; 0 = today
}

export const NECKLINE_DEFAULT: NecklineParams = { shape: "crew", widthEase: 0, frontDrop: 0 };

/** The crew neckline's control-point factor: how far down the fold the first
 *  control point sits, as a fraction of the neck depth. Front and back use
 *  different factors — the same asymmetry `bodice.ts` always drew, now
 *  owned by the shape that produces it instead of passed in from outside. */
function crewControlFactor(position: "front" | "back"): number {
  return position === "front" ? 0.55 : 0.6;
}

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
  if (params.shape !== "crew" && params.shape !== "v") {
    throw new Error(`Neckline shape "${params.shape}" not yet implemented (crew and v only)`);
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

  const edge: Edge =
    params.shape === "v"
      ? { kind: "line", name: "neckline", start: cNeck, end: hps } // a real V: two straight seams meeting at a point, no curve
      : { kind: "curve", name: "neckline", curve: {
            start: cNeck,
            control1: point(0, depth * crewControlFactor(position)),
            control2: point(effectiveWidthHalf * 0.45, 0),
            end: hps,
          } };

  return { cNeck, hps, edge, notes };
}
