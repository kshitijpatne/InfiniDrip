// The tank — Phase C2's real test (COMPONENT-ARCHITECTURE.md §9): "add a
// genuinely new variant... it should take hours, not a slice-run." A tank is
// a bodice with NO sleeve and a v-neck front instead of crew — exactly the
// two axes Phase B built and never had a second real consumer for:
// - Sleeve component (B3): simply not called. No sleeve role, no cap-ease
//   stitch. The armhole stays a raw, bound edge (bias tape / self-binding in
//   construction, not sewn to anything else — real garment, not a gap).
// - Neckline's non-default params (B4, Slice 56): built with nothing able to
//   reach them; `BodiceParams.necklineParams` (this slice, bodice.ts) is that
//   wiring, done now that a real caller needs it.
//
// Everything else is reuse, not new code: `sleevedTopPanelChecks`/
// `frontHemWidth` from tshirt-checks.ts are NOT sleeve-specific despite the
// file name (verified by reading them, not assumed) — a hem-square check and
// a hem-length measurement, both panel properties. `sleevedTopGuidance` IS
// sleeve-specific (calls `rolePiece(block,"sleeve")`, would throw) — hence
// `tankGuidance` below, which is the same function minus `armholeMatch`.

import { Measurements } from "./measurements";
import { Block } from "./block";
import { Note } from "../guidance/note";
import { Stitch, edgeRef, iface, matchedNotch } from "./stitch";
import { assembleComponents } from "./component";
import { bodice } from "./bodice";
import { PieceNotches } from "./tshirt-notches";
import { Pom } from "./pom";
import { TSHIRT_POMS } from "./tshirt-pom";
import { easeRange, armholeDepthCheck, shoulderCheck } from "./tshirt-guidance";

/** Shoulder + side only — no sleeve underarm, no cap-ease. The armhole is
 *  drafted (by `bodice`) but stitched to nothing; it's a finished, bound
 *  edge, not a seam between two pieces. */
const TANK_STITCHES: readonly Stitch[] = [
  {
    label: "Shoulder seam (front ↔ back)",
    a: iface(edgeRef("front", "shoulder")),
    b: iface(edgeRef("back", "shoulder")),
  },
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "side")),
    b: iface(edgeRef("back", "side")),
  },
];

/** Front: a deep, round scoop (Slice 60) — a tank's real default; v was a
 *  Slice 59 stand-in, used only because it was the sole non-crew shape with
 *  real curve math at the time. Back: crew (unchanged). */
export function draftTank(m: Measurements): Block {
  const front = bodice(m, { position: "front", necklineParams: { shape: "scoop", widthEase: 0, frontDrop: 0 } });
  const back = bodice(m, { position: "back" });
  return assembleComponents([front, back], TANK_STITCHES);
}

/** The tank's own guidance: sleevedTopGuidance minus armholeMatch (which
 *  calls rolePiece(block,"sleeve") — there is none here). */
export function tankGuidance(_block: Block, m: Measurements): Note[] {
  const notes: (Note | null)[] = [easeRange(m), armholeDepthCheck(m), shoulderCheck(m)];
  return notes.filter((n): n is Note => n !== null);
}

const SHOULDER = TANK_STITCHES[0];
const SIDE = TANK_STITCHES[1];

export const TANK_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [matchedNotch(SHOULDER, "a", 0.5), matchedNotch(SIDE, "a", 0.5)],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(SHOULDER, "b", 0.5),
      matchedNotch(SHOULDER, "b", 0.5), // 2 = back reference (tee's own convention)
      matchedNotch(SIDE, "b", 0.5),
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
];

/** The tee's first 7 POMs (Body chest through Front neck drop) — the last 3
 *  (Sleeve length/bicep/hem) all read `rolePiece(b,"sleeve")`, which throws
 *  on a tank. */
export const TANK_POMS: readonly Pom[] = TSHIRT_POMS.slice(0, 7);
