// Recipe tables for the Epic 3 trouser block.
//
// These functions read the assembled block, not the UI state or a second set
// of drafting formulas. A spec row therefore measures the same live edges the
// renderer, stitch checker, and exports already carry.

import { distance } from "../geometry";
import { Block, rolePiece } from "./block";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { GradeRule, SizeStep } from "./grading";
import { TSHIRT_SIZES } from "./tshirt-grade";
import { Pom, seam, spanY } from "./pom";
import type { TechPack } from "./recipe";

/** cm added per +1 size step. Ease and recipe options remain constant in V1. */
export const TROUSER_GRADE: GradeRule = {
  waist: 4,
  hip: 4,
  hipDepth: 1,
  crotchDepth: 1,
  thigh: 2,
  knee: 1.5,
  inseam: 1.5,
};

/** The same ordered XS–XL run used by the existing size-run engine. */
export const TROUSER_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

function pointMarkY(b: Block, role: string, name: string): number {
  const mark = rolePiece(b, role).marks!.find((candidate) => candidate.name === name)!;
  return (mark as Extract<typeof mark, { at: { y: number } }>).at.y;
}

const front = (b: Block) => rolePiece(b, "frontLeft");
const back = (b: Block) => rolePiece(b, "backLeft");
const band = (b: Block) => rolePiece(b, "waistband");
const bag = (b: Block, role: "pocketBagLeft" | "pocketBagRight") => rolePiece(b, role);

/** Finished POMs for the assembled V1 trouser. Labels explicitly distinguish
 * body reference values from finished garment values. */
export const TROUSER_POMS: readonly Pom[] = [
  {
    label: "Waist (finished)",
    tolerance: 1.0,
    measure: (b) => 4 * seam(front(b), "waist"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "waist")),
  },
  {
    label: "Waistband depth (finished)",
    tolerance: 0.2,
    measure: (b) => seam(band(b), "endRight"),
  },
  {
    label: "Seat / hip (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * edgeEnd(pieceEdge(front(b), "sideUpper")).x,
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
  },
  {
    label: "Hip depth (body reference)",
    tolerance: 0.5,
    measure: (b) => spanY(front(b), { edge: "waist", at: "start" }, { edge: "sideUpper", at: "end" }),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
  },
  {
    label: "Front rise (finished incl. waistband)",
    tolerance: 0.8,
    measure: (b) => spanY(front(b), { edge: "centerFront", at: "start" }, { edge: "centerFront", at: "end" }) + seam(band(b), "endRight"),
    anchor: (b) => edgeStart(pieceEdge(front(b), "centerFront")),
  },
  {
    label: "Back rise (finished incl. waistband)",
    tolerance: 0.8,
    measure: (b) => spanY(back(b), { edge: "centerBack", at: "start" }, { edge: "centerBack", at: "end" }) + seam(band(b), "endRight"),
  },
  {
    label: "Thigh (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * distance(
      edgeEnd(pieceEdge(front(b), "sideHipToThigh")),
      edgeStart(pieceEdge(front(b), "innerThighToCrotch")),
    ),
  },
  {
    label: "Knee (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * distance(
      edgeEnd(pieceEdge(front(b), "sideThighToKnee")),
      edgeEnd(pieceEdge(front(b), "inseamLower")),
    ),
  },
  {
    label: "Inseam (finished seam)",
    tolerance: 1.0,
    measure: (b) => seam(front(b), "innerThighToCrotch") + seam(front(b), "inseamUpper") + seam(front(b), "inseamLower"),
  },
  {
    label: "Outseam (finished incl. waistband)",
    tolerance: 1.0,
    measure: (b) => seam(front(b), "sideUpper") + seam(front(b), "sideHipToThigh") + seam(front(b), "sideThighToKnee") + seam(front(b), "sideKneeToHem") + seam(band(b), "endRight"),
  },
  {
    label: "Leg opening (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * seam(front(b), "hem"),
    anchor: (b) => edgeStart(pieceEdge(front(b), "hem")),
  },
  {
    label: "Front fly length (finished)",
    tolerance: 0.3,
    measure: (b) => seam(rolePiece(b, "flyShield"), "left"),
  },
  {
    label: "Left pocket opening (finished)",
    tolerance: 0.4,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "opening"),
  },
  {
    label: "Right pocket opening (finished)",
    tolerance: 0.4,
    measure: (b) => seam(bag(b, "pocketBagRight"), "opening"),
  },
  {
    label: "Pocket bag depth (finished)",
    tolerance: 0.5,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagLower"),
  },
  {
    label: "Pocket bag width (finished)",
    tolerance: 0.5,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagOuter"),
  },
  {
    label: "Pocket drop (finished placement)",
    tolerance: 0.5,
    measure: (b) => pointMarkY(b, "frontLeft", "pocketOpeningStart"),
  },
];

/** V1 woven-trouser bill of materials and ordered operations. Quantities and
 * hardware remain provisional until a physical/material sample exists. */
export const TROUSER_TECH_PACK: TechPack = {
  bom: [
    { material: "Midweight woven fabric", placement: "Four leg panels, waistband & pocket bags", qty: "1.8 m" },
    { material: "Lightweight fusible interfacing", placement: "Waistband & fly shield", qty: "0.25 m" },
    { material: "Trouser zipper", placement: "Front fly", qty: "1" },
    { material: "Hook-and-bar fastening", placement: "Waistband", qty: "1 set" },
    { material: "All-purpose sewing thread", placement: "All seams and topstitching", qty: "1 spool" },
  ],
  construction: [
    "Fuse the waistband and fly-support areas according to the selected woven fabric instructions.",
    "Sew each pocket bag to its marked front opening; turn, press, and secure the bag edge inside the front panel.",
    "Join each front leg to its matching back leg at the side seam, matching the side balance notches.",
    "Sew the front and back inseams, then close the centre-back seam between the two back panels.",
    "Install the zipper behind the marked front fly and secure the fly shield and waistband fastening.",
    "Join the separate waistband to the four-leg waist perimeter, matching centre and closure marks.",
    "Press the seams, turn up the deeper hem allowance, and inspect the pocket openings and waistband ends.",
  ],
};
