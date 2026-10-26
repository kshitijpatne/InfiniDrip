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

import { Measurements, derive } from "./measurements";
import { Block } from "./block";
import { Note } from "../guidance/note";
import { Stitch, edgeRef, iface, matchedNotch } from "./stitch";
import { bodice } from "./bodice";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { NecklineParams, necklineEdge } from "./neckline";
import { sleevelessArmhole } from "./armhole";
import { PieceNotches } from "./tshirt-notches";
import { Pom } from "./pom";
import { TEE_POMS } from "./tshirt-pom";
import { easeRange, armholeDepthCheck, shoulderCheck } from "./tshirt-guidance";
import type { GarmentOption, GarmentOptions } from "./options";

export const TANK_RACERBACK_ENTRY_ID = "tank-racerback-digital-v1";
export const TANK_RACERBACK_BACK_CUT_IN_OPTION_ID = "tankRacerbackBackCutInCm";
export const TANK_RACERBACK_BACK_CUT_IN_OPTION: GarmentOption = {
  id: TANK_RACERBACK_BACK_CUT_IN_OPTION_ID,
  label: "Back armhole cut-in (digital)",
  unit: "cm",
  help: "The value is the maximum inward movement of the N03 back armhole curve. It is a software geometry setting, not a sewn tolerance or fit result.",
  defaultValue: 3,
  min: 0,
  max: 6,
  step: 0.5,
  appliesToStarterEntryId: TANK_RACERBACK_ENTRY_ID,
};

export const TANK_N04_ENTRY_ID = "tank-square-neck-digital-v1";
export const TANK_N05_ENTRY_ID = "tank-v-neck-digital-v1";
export const TANK_N06_ENTRY_ID = "tank-cropped-digital-v1";
export const TANK_N07_ENTRY_ID = "tank-longline-digital-v1";
/** Internal route marker derived from saved starter identity; never a user option or persisted value. */
export const TANK_N05_PROFILE_ROUTE_KEY = "__tankN05Profile";
/** Internal route marker derived from saved starter identity; never a user option or persisted value. */
export const TANK_N06_PROFILE_ROUTE_KEY = "__tankN06Profile";
export const TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID = "tankSquareNeckCornerRadiusCm";
export const TANK_SQUARE_NECK_CORNER_RADIUS_OPTION: GarmentOption = {
  id: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID,
  label: "Square-corner easing (digital)",
  unit: "cm",
  help: "Rounds only the N04 front neckline corner in the digital outline. This is not a sewing radius or finish specification.",
  defaultValue: 0,
  min: 0,
  max: 1.5,
  step: 0.5,
  appliesToStarterEntryId: TANK_N04_ENTRY_ID,
  preserveInvalidWhenRestored: true,
};

/** Convert the displayed maximum contour movement to the shared Bezier control offset. */
export function tankRacerbackControlOffsetCm(maxContourShiftCm: number): number {
  return maxContourShiftCm / 0.75;
}

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

/** Front: a deep, round scoop — a tank's real default; v was a Slice 59
 *  stand-in, used only because it was the sole non-crew shape with real
 *  curve math at the time. Back: crew (unchanged).
 *  Functions of `Measurements`, not fixed constants (Slice 63): `frontDrop`
 *  now reads `m.neckDrop` — a real, user-adjustable measurement
 *  (TANK-RESEARCH.md found no single sourced scoop depth to hardcode, so it
 *  ships as a slider, guarded the same "warn, never clamp" way as every
 *  other field, not resolved by the engine picking a winner). `widthEase`
 *  now reads `m.neckWidthEase`, a per-side adjustment from the derived default.
 *
 *  The back MUST carry the same live `widthEase` as the front even though its
 *  shape stays crew — caught by `stitchChecks`, not assumed: the shoulder/
 *  strap point never moves on its own, so if only the front's neckline
 *  widens, its shoulder-to-neckline edge gets shorter than the back's
 *  un-widened one and the shoulder seam stops matching. Widening both sides
 *  by the same amount keeps the two shoulder points aligned; only the front
 *  also drops deeper. */
export function tankFrontNeckline(m: Measurements, options: GarmentOptions = {}): NecklineParams {
  if (Object.prototype.hasOwnProperty.call(options, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID)) {
    return {
      shape: "square",
      widthEase: m.neckWidthEase,
      frontDrop: m.neckDrop,
      squareCornerRadiusCm: options[TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID],
    };
  }
  if (options[TANK_N05_PROFILE_ROUTE_KEY] === 1) {
    return { shape: "v", widthEase: m.neckWidthEase, frontDrop: m.neckDrop };
  }
  return { shape: "scoop", widthEase: m.neckWidthEase, frontDrop: m.neckDrop };
}
export function tankBackNeckline(m: Measurements): NecklineParams {
  return { shape: "crew", widthEase: m.neckWidthEase, frontDrop: 0 };
}

export function draftTank(m: Measurements, options: GarmentOptions = {}): Block {
  return composeBlock(TANK_GRAMMAR, m, options);
}

/** A tank is the shared bodice grammar with the sleeve node intentionally
 * absent. Its two neckline parameter resolvers stay owned by the tank recipe,
 * while the resulting shoulder interfaces are still joined by composition. */
export const TANK_GRAMMAR = garmentGrammar(
  "tank",
  [
    componentNode("front", "bodice", bodice, (context) => ({
      position: "front" as const,
      necklineParams: tankFrontNeckline(context.measurements, context.options),
      strapWidth: context.measurements.strapWidth,
    })),
    componentNode("back", "bodice", bodice, (context) => ({
      position: "back" as const,
      necklineParams: tankBackNeckline(context.measurements),
      strapWidth: context.measurements.strapWidth,
      // Both cubic Bezier control points move horizontally, so midpoint movement is 0.75x their offset.
      // Convert the user's maximum contour displacement into that control-point offset.
      armholeCutInCm: tankRacerbackControlOffsetCm(context.options[TANK_RACERBACK_BACK_CUT_IN_OPTION_ID] ?? 0),
    })),
  ],
  () => TANK_STITCHES,
);

/** The tank's own guidance: sleevedTopGuidance minus armholeMatch (which
 *  calls rolePiece(block,"sleeve") — there is none here), PLUS (Slice 63)
 *  the "warn, never clamp" guardrails `necklineEdge()`/`sleevelessArmhole()`
 *  already compute but that no caller has surfaced to the person yet
 *  (a pre-existing gap in how those two functions' `notes` reach guidance,
 *  true for every garment, not introduced by this slice — flagged, not
 *  fixed wholesale here; fixed for the tank specifically, since `strapWidth`
 *  and `neckDrop` are real sliders now and their guardrails need to actually
 *  reach the person for "the guidance engine already handles synergy" to be
 *  true rather than aspirational). Recomputed here read-only, from the same
 *  functions `draftTank` calls — never a second, independently-derived copy
 *  of the geometry itself. */
export function tankGuidance(_block: Block, m: Measurements, options: GarmentOptions = {}): Note[] {
  const notes: (Note | null)[] = [
    easeRange(m, "tank"),
    armholeDepthCheck(m),
    shoulderCheck(m),
    options[TANK_N06_PROFILE_ROUTE_KEY] === 1 ? tankN06ArmholeLengthNote(m) : null,
  ];
  const d = derive(m);
  const front = necklineEdge(
    "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, m.armholeDepth, tankFrontNeckline(m, options));
  const armhole = sleevelessArmhole(
    front.hps.x + m.strapWidth, front.hps.x, d.shoulderHalf, d.shoulderSlope, d.chestWidthHalf, m.armholeDepth);
  const frontNotes = options[TANK_N05_PROFILE_ROUTE_KEY] === 1
    ? front.notes.map((note) => note.field === "neckDrop"
      ? { ...note, text: note.text.replace("neck scoop depth", "front neckline drop") }
      : note)
    : front.notes;
  return notes.filter((n): n is Note => n !== null).concat(frontNotes, armhole.notes);
}

/** N06 relationship guard. The saved inputs stay intact so users can correct the pair explicitly. */
export function tankN06ArmholeLengthNote(
  measurements: Pick<Measurements, "armholeDepth" | "length">,
): Note | null {
  const { armholeDepth, length } = measurements;
  if (!Number.isFinite(armholeDepth) || !Number.isFinite(length) || armholeDepth < length) return null;
  return {
    level: "warn",
    field: "armholeDepth",
    text: `Armhole depth (${armholeDepth} cm) must be less than body length (${length} cm). Keep both values unchanged; reduce armhole depth or increase body length before drafting or exporting.`,
  };
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
/** Tank reuses the source-backed Tee body methods, excluding the three sleeve POMs. */
export const TANK_POMS: readonly Pom[] = TEE_POMS.slice(0, 7);
