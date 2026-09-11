// Tank rework, step 3 (Slice 63). Design: TANK-RESEARCH.md, Finding 2.
//
// draftTank() has, until now, reused bodicePanel's sleeved armhole curve
// unmodified — a curve shaped to smoothly receive a set-in sleeve cap. A
// sleeveless garment has nothing to fit there. Every source in
// TANK-RESEARCH.md agrees on the mechanism (not a numeric spec — there
// isn't one): the strap sits IN from the true shoulder point, and the
// curve between the strap and the underarm reads as an open scoop rather
// than a sleeve seat, cutting further toward the centreline than the
// sleeved curve does at the same depth.
//
// Both endpoints stay anchored to numbers this codebase already derives
// (`chestWidthHalf`, `armholeDepth`) — Finding 2 confirmed the underarm
// point itself doesn't move, only the curve's shape between the strap and
// it. The one genuinely new, non-derived number is `strapWidth` — and
// Slice 63's whole point is that this does NOT get a single hardcoded
// value: TANK-RESEARCH.md's own sources disagreed on it (12-15cm
// spaghetti-adjacent vs ~18.5cm classic-tank), so it ships as a real
// Measurements field the person dials in themselves, guarded the same
// "warn, never clamp" way every other measurement is — not resolved by
// picking a winner.
//
// The curve's CONTROL-POINT shape (how far it bulges inward relative to
// the straight strap-to-underarm line) has no sourced spec either — unlike
// the neckline fix, there's no "must meet at a right angle" rule to anchor
// to here. Treated the same way the scoop neckline numbers were (Slice 60,
// 62): a starting decision, rendered and eyeballed, not claimed exact.

import { point, Point } from "../geometry";
import { Edge } from "./piece";
import type { Note } from "../guidance/note";

/** How far the curve's control points pull in toward the centreline,
 *  relative to the straight line from strap to underarm — a starting
 *  decision (see file header), not a sourced exact. */
const SCOOP_PULL = 0.35;

/** The strap + armhole for a sleeveless garment: the point where the strap
 *  meets the shoulder line, the underarm point (unchanged from the sleeved
 *  armhole — TANK-RESEARCH.md Finding 2), the "armhole" edge itself, and
 *  any "warn, never clamp" notes the chosen `strapWidth` triggered.
 *  `neckWidthHalf` is the neckline's OWN half-width at the shoulder line
 *  (i.e. `hps.x`, already computed by whichever `necklineEdge()` call this
 *  panel made) — needed only for the "strap narrower than the neckline"
 *  guardrail below; `shoulderHalf` only for the "strap wider than the
 *  shoulder" one. Neither can fire unless the person dials `strapWidth`
 *  somewhere the derived defaults never put it. */
export function sleevelessArmhole(
  strapWidth: number,
  neckWidthHalf: number,
  shoulderHalf: number,
  shoulderSlope: number,
  chestWidthHalf: number,
  armholeDepth: number
): { readonly strap: Point; readonly underarm: Point; readonly edge: Edge; readonly notes: readonly Note[] } {
  const notes: Note[] = [];
  if (strapWidth <= neckWidthHalf) {
    notes.push({ level: "warn", text: "The strap is as narrow as (or narrower than) the neckline — increase strap width or reduce neckline width." });
  }
  if (strapWidth >= shoulderHalf) {
    notes.push({ level: "warn", text: "The strap reaches the full shoulder width — reduce strap width to create an armhole cutout." });
  }

  const strap = point(strapWidth, shoulderSlope);
  const underarm = point(chestWidthHalf, armholeDepth);

  // Pull the curve's two control points in toward the centreline, relative
  // to the straight strap-to-underarm line, so the armhole reads as cut
  // further in than the sleeved curve — an open scoop, not a sleeve seat.
  const dx = underarm.x - strap.x;
  const dy = underarm.y - strap.y;
  const edge: Edge = {
    kind: "curve", name: "armhole", curve: {
      start: strap,
      control1: point(strap.x + dx * 0.25 - dx * SCOOP_PULL, strap.y + dy * 0.25),
      control2: point(strap.x + dx * 0.75 - dx * SCOOP_PULL, strap.y + dy * 0.75),
      end: underarm,
    },
  };

  return { strap, underarm, edge, notes };
}
