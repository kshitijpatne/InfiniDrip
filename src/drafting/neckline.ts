// Component architecture, Phase B4 part 1 of 2 (Slice 55) + part 2 (Slice
// 56) + Slice 60 (real scoop). Design: COMPONENT-ARCHITECTURE.md §6.
//
// Carries the Slice 47 finding into code: a neckline style preference is not
// a body measurement (§7) and shouldn't live on `Measurements` or be baked
// into the bodice — it's its own concern, extracted here.
//
// Part 1 (Slice 55): only "crew" implemented. Part 2 (Slice 56): "v" got
// real curve math, widthEase/frontDrop and both guardrails became real.
// "scoop" stayed thrown at both points — deferred to "ships with the shirt
// block" per §6's own scope decision (§11 Q2).
//
// Slice 60 closes "scoop" early, ahead of that plan, because the tank (Slice
// 59) needed it for real: a v-neck was picked there only because it was the
// only non-crew shape that existed, not because it's the right default for a
// tank — a tank is normally a deep, round scoop. `scoopControlFactors` below
// is a genuinely new design decision with no prior spec to match (unlike
// crew's factors, inherited byte-identical from the original hand-drafted
// curve): a rounder, wider bezier than crew — deeper first control point
// (0.85/0.8 vs crew's 0.55/0.6), wider second control point (0.65 vs crew's
// 0.45). Starting numbers, not claimed exact — same posture as the original
// crew constants, tunable against a real reference later. "boat" still
// throws; no curve math for it exists anywhere.
//
// Deliberately NOT done: NecklineParams is still not part of every recipe's
// public surface — only bodice.ts's BodiceParams (Slice 59) accepts it, and
// only the tank passes a non-default value. No UI control lets a person pick
// a neckline shape yet.
//
// Byte-identity requirement (§6), still true at NECKLINE_DEFAULT: with
// `{shape:"crew", widthEase:0, frontDrop:0}`, this must emit the EXACT
// neckline curve draftFront/draftBack emit today.

import { point, Point } from "../geometry";
import { Edge } from "./piece";
import type { Note } from "../guidance/note";

export interface NecklineParams {
  readonly shape: "crew" | "v" | "scoop" | "boat";
  readonly widthEase: number;  // cm added per side to the derived default; 0 = today
  readonly frontDrop: number;  // cm added to the derived front depth; 0 = today
}

export const NECKLINE_DEFAULT: NecklineParams = { shape: "crew", widthEase: 0, frontDrop: 0 };

/** The crew neckline's control-point factors: how far down the fold the
 *  first control point sits (fraction of depth), and how far across the
 *  second control point sits (fraction of width). Front and back use
 *  different depth factors — the same asymmetry `bodice.ts` always drew, now
 *  owned by the shape that produces it instead of passed in from outside. */
function crewControlFactors(position: "front" | "back"): { c1: number; c2: number } {
  return { c1: position === "front" ? 0.55 : 0.6, c2: 0.45 };
}

/** The scoop neckline (Slice 60): a deeper, wider bezier than crew — a real
 *  U-shape rather than a rounded crew. Numbers are a starting design
 *  decision (see file header), not inherited from any prior hand-drafted
 *  curve. */
function scoopControlFactors(position: "front" | "back"): { c1: number; c2: number } {
  return { c1: position === "front" ? 0.85 : 0.8, c2: 0.65 };
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
    const { c1, c2 } = params.shape === "scoop" ? scoopControlFactors(position) : crewControlFactors(position);
    edge = { kind: "curve", name: "neckline", curve: {
        start: cNeck,
        control1: point(0, depth * c1),
        control2: point(effectiveWidthHalf * c2, 0),
        end: hps,
      } };
  }

  return { cNeck, hps, edge, notes };
}
