// Shorts-only construction and output metadata. These tables are prepared
// against the live nine-role draft; S1099 owns recipe registration/consumption.

import { distance, Point } from "../geometry";
import { Block, rolePiece } from "./block";
import { edgeEnd, pieceEdge } from "./piece";
import { GradeRule, SizeStep } from "./grading";
import { TSHIRT_SIZES } from "./tshirt-grade";
import { Pom, seam, spanY } from "./pom";
import type { TechPack } from "./recipe";
import type { PieceNotches } from "./tshirt-notches";
import type { PatternMark } from "./pattern-mark";

/** Woven starting map; these values are not universal construction standards. */
export const SHORTS_ALLOWANCES = {
  default: 1,
  byEdge: { hem: 2.5 },
} as const;

const LEG_MATCH_NOTCHES = [
  { edgeName: "waist", t: 0.5 },
  { edgeName: "sideUpper", t: 0.5 },
  { edgeName: "sideHipToThigh", t: 0.5 },
  { edgeName: "sideThighToHem", t: 0.5 },
  { edgeName: "inseamThighToHem", t: 0.5 },
  { edgeName: "innerThighToCrotch", t: 0.5 },
] as const;

const LEG_GRAINLINE = {
  topEdge: "waist",
  topT: 0.5,
  bottomEdge: "hem",
  bottomT: 0.5,
} as const;

/** Rules use piece names because that is the exporter's stable lookup key. */
export const SHORTS_NOTCHES: readonly PieceNotches[] = [
  ...["shorts front left", "shorts front right"].map((pieceName) => ({
    pieceName,
    notches: LEG_MATCH_NOTCHES,
    grainline: LEG_GRAINLINE,
  })),
  ...["shorts back left", "shorts back right"].map((pieceName) => ({
    pieceName,
    notches: [...LEG_MATCH_NOTCHES, { edgeName: "centerBack", t: 0.5 }],
    grainline: LEG_GRAINLINE,
  })),
  {
    pieceName: "shorts waistband",
    notches: [
      { edgeName: "bottom", t: 0.125 },
      { edgeName: "bottom", t: 0.375 },
      { edgeName: "bottom", t: 0.625 },
      { edgeName: "bottom", t: 0.875 },
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  {
    pieceName: "shorts fly shield",
    notches: [
      { edgeName: "left", t: 0.5 },
      { edgeName: "right", t: 0.5 },
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  {
    pieceName: "shorts fly underlap",
    notches: [
      { edgeName: "shieldEdge", t: 0.5 },
      { edgeName: "frontEdge", t: 0.5 },
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  ...["shorts pocket bag left", "shorts pocket bag right"].map((pieceName) => ({
    pieceName,
    notches: [{ edgeName: "opening", t: 0.5 }],
    grainline: { topEdge: "opening", topT: 0.5, bottomEdge: "bagOuter", bottomT: 0.5 },
  })),
];

/** Inherited digital lower-body increments; no knee or inseam option grades. */
export const SHORTS_GRADE: GradeRule = {
  waist: 4,
  hip: 4,
  hipDepth: 1,
  crotchDepth: 1,
  thigh: 2,
};

/** Five-size XS–XL run, with the supplied M body values at step zero. */
export const SHORTS_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

const front = (b: Block) => rolePiece(b, "frontLeft");
const back = (b: Block) => rolePiece(b, "backLeft");
const band = (b: Block) => rolePiece(b, "waistband");
const shield = (b: Block) => rolePiece(b, "flyShield");
const bag = (b: Block, role: "pocketBagLeft" | "pocketBagRight") => rolePiece(b, role);

function lineMarkLength(b: Block, role: string, name: string): number {
  const mark = rolePiece(b, role).marks!.find((candidate) => candidate.name === name)!;
  const line = mark as Extract<PatternMark, { start: Point }>;
  return distance(line.start, line.end);
}

function pointMarkY(b: Block, role: string, name: string): number {
  const mark = rolePiece(b, role).marks!.find((candidate) => candidate.name === name)!;
  return (mark as Extract<PatternMark, { at: Point }>).at.y;
}

/** POMs read live geometry; no knee or trouser-length station is synthesized. */
export const SHORTS_POMS: readonly Pom[] = [
  {
    label: "Waist (finished)",
    measure: (b) => 4 * seam(front(b), "waist"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "waist")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "waist",
  },
  {
    label: "Waistband depth (finished)",
    measure: (b) => seam(band(b), "endRight"),
    frontMarkAnchor: { roleId: "waistband", markName: "centerFront", point: "at" },
    backMarkAnchor: { roleId: "waistband", markName: "centerBack" },
  },
  {
    label: "Seat / hip (finished)",
    measure: (b) => 4 * edgeEnd(pieceEdge(front(b), "sideUpper")).x,
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "sideUpper",
  },
  {
    label: "Hip depth (body reference)",
    measure: (b) => spanY(front(b), { edge: "waist", at: "start" }, { edge: "sideUpper", at: "end" }),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "sideUpper",
  },
  {
    label: "Front rise (finished incl. waistband)",
    measure: (b) => spanY(front(b), { edge: "centerFront", at: "start" }, { edge: "centerFront", at: "end" }) + seam(band(b), "endRight"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "centerFront")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "centerFront",
  },
  {
    label: "Back rise (finished incl. waistband)",
    measure: (b) => spanY(back(b), { edge: "centerBack", at: "start" }, { edge: "centerBack", at: "end" }) + seam(band(b), "endRight"),
    backAnchor: (b) => edgeEnd(pieceEdge(back(b), "centerBack")),
    backAnchorRoleId: "backLeft",
    backAnchorEdgeId: "centerBack",
  },
  {
    label: "Thigh (finished)",
    measure: (b) => 4 * distance(
      edgeEnd(pieceEdge(front(b), "sideHipToThigh")),
      edgeEnd(pieceEdge(front(b), "inseamThighToHem")),
    ),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideHipToThigh")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "sideHipToThigh",
  },
  {
    label: "Shorts length (modeled vertical crotch-to-hem station)",
    measure: (b) => spanY(front(b), { edge: "innerThighToCrotch", at: "end" }, { edge: "hem", at: "start" }),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "innerThighToCrotch")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "innerThighToCrotch",
  },
  {
    label: "Inseam (finished seam length)",
    measure: (b) => seam(front(b), "innerThighToCrotch") + seam(front(b), "inseamThighToHem"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "innerThighToCrotch")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "innerThighToCrotch",
  },
  {
    label: "Outseam (finished incl. waistband)",
    measure: (b) => seam(front(b), "sideUpper") + seam(front(b), "sideHipToThigh") + seam(front(b), "sideThighToHem") + seam(band(b), "endRight"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideThighToHem")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "sideThighToHem",
  },
  {
    label: "Leg opening (finished)",
    measure: (b) => 4 * seam(front(b), "hem"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "hem")),
    anchorRoleId: "frontLeft",
    anchorEdgeId: "hem",
  },
  {
    label: "Front fly length (finished)",
    measure: (b) => seam(shield(b), "left"),
    anchorRoleId: "frontLeft",
    frontMarkAnchor: { roleId: "frontLeft", markName: "flyEdge", point: "end" },
  },
  {
    label: "Left pocket opening (finished)",
    measure: (b) => lineMarkLength(b, "frontLeft", "pocketOpening"),
    anchorRoleId: "frontLeft",
    frontMarkAnchor: { roleId: "frontLeft", markName: "pocketOpening", point: "start" },
  },
  {
    label: "Right pocket opening (finished)",
    measure: (b) => lineMarkLength(b, "frontRight", "pocketOpening"),
    anchorRoleId: "frontRight",
    frontMarkAnchor: { roleId: "frontRight", markName: "pocketOpening", point: "start" },
  },
  {
    label: "Pocket bag depth (finished)",
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagLower"),
  },
  {
    label: "Pocket bag width (finished)",
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagOuter"),
  },
  {
    label: "Pocket drop (finished placement)",
    measure: (b) => pointMarkY(b, "frontLeft", "pocketOpeningStart"),
    anchorRoleId: "frontLeft",
    frontMarkAnchor: { roleId: "frontLeft", markName: "pocketOpeningStart", point: "at" },
  },
];

/** Draft BOM and operations; consumption and physical method remain unverified. */
export const SHORTS_TECH_PACK: TechPack = {
  constructionNotice: "Digital construction guidance only. Confirm fabric compatibility, marker-based consumption, hardware, hem turn, and sample sewability before cutting; no physical fit or production validation is claimed.",
  bom: [
    { material: "Midweight stable woven shell", placement: "Four leg panels, waistband, and fly pieces", qty: "TBD by size, fabric width, and marker" },
    { material: "Self fabric or compatible pocketing", placement: "Paired pocket bags", qty: "TBD by marker" },
    { material: "Lightweight fusible interfacing", placement: "Waistband and fly support", qty: "TBD; verify material compatibility" },
    { material: "Short zipper", placement: "Front fly", qty: "1; choose a length compatible with the modeled fly" },
    { material: "Waistband button", placement: "Waistband fastening", qty: "1; fastening method remains provisional" },
    { material: "All-purpose sewing thread", placement: "Seams and topstitching", qty: "TBD by material and stitch plan" },
  ],
  construction: [
    "Prepare the paired pocket bags and match each opening to its marked front-panel line.",
    "Attach and close each bag at its front opening; turn, press, and secure the free bag edge.",
    "Prepare the fly with the shield and underlap, then finish the front rise.",
    "Join the back rise between the left and right back panels.",
    "Join the left and right inseams, matching the balance notches.",
    "Join the left and right side seams, matching the balance notches.",
    "Attach the waistband to the four leg waist edges, close its short ends, and apply the selected fastening.",
    "Press the seams, turn the named hem allowance, and finish both straight hems.",
  ],
};
