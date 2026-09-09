// Component architecture, Phase B4 part 1 of 2 (Slice 55). Design: COMPONENT-ARCHITECTURE.md §6.
//
// Carries the Slice 47 finding into code: a neckline style preference is not
// a body measurement (§7) and shouldn't live on `Measurements` or be baked
// into the bodice — it's its own concern, extracted here.
//
// DELIBERATELY narrower than §6's end state. `NecklineParams` is typed with
// all four shapes now (so the taxonomy doesn't need a breaking change when
// "scoop"/"boat" ship with the shirt block), but this slice implements ONLY
// "crew" — the only shape anything drafts today — and `widthEase`/
// `frontDrop` both THROW if non-zero rather than being silently ignored. No
// recipe passes anything but `NECKLINE_DEFAULT` yet, so none of this is a
// live code path; a param that's quietly a no-op would be a footgun once one
// becomes live. The next slice ("adds shape/widthEase/frontDrop" per
// COMPONENT-ARCHITECTURE.md §9) is where real "v" curve math and the
// widthEase/frontDrop guardrails (`neckWidthHalf+widthEase >= shoulderHalf`,
// `frontNeckDepth+frontDrop >= armholeDepth`) actually get built — building
// them now, with nothing able to call them non-default, would be speculative.
//
// Byte-identity requirement (§6): with NECKLINE_DEFAULT, this must emit the
// EXACT neckline curve draftFront/draftBack emit today — same control
// points, including the 0.55 (front) / 0.6 (back) factor that used to live
// in bodice.ts's PanelOptions. That factor is genuinely part of "what a crew
// neckline looks like," not something a bodice should own — it moves here.

import { point, Point } from "../geometry";
import { Edge } from "./piece";

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
 *  bodice panel needs to place its OTHER edges, plus the "neckline" edge
 *  itself. `baseDepth` is the panel's already-derived depth (frontNeckDepth
 *  or backNeckDepth, from `derive(m)`) — this function doesn't compute
 *  depth from chest; it only shapes the curve at whatever depth it's given. */
export function necklineEdge(
  position: "front" | "back",
  neckWidthHalf: number,
  baseDepth: number,
  params: NecklineParams = NECKLINE_DEFAULT
): { readonly cNeck: Point; readonly hps: Point; readonly edge: Edge } {
  if (params.shape !== "crew") {
    throw new Error(`Neckline shape "${params.shape}" not yet implemented (Phase B4 part 1 — crew only)`);
  }
  if (params.widthEase !== 0 || params.frontDrop !== 0) {
    throw new Error("Neckline widthEase/frontDrop not yet implemented (Phase B4 part 1 — default-only)");
  }

  const cNeck = point(0, baseDepth);
  const hps = point(neckWidthHalf, 0);
  const edge: Edge = {
    kind: "curve",
    name: "neckline",
    curve: {
      start: cNeck,
      control1: point(0, baseDepth * crewControlFactor(position)),
      control2: point(neckWidthHalf * 0.45, 0),
      end: hps,
    },
  };
  return { cNeck, hps, edge };
}
