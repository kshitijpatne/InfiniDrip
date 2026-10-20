// Jogger-owned production tables. Every measurement is read from the drafted
// block so grade, POM and export consumers share the same geometry.

import { distance } from "../geometry";
import { Block, rolePiece } from "./block";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { matchedNotch, interfaceLength } from "./stitch";
import { JOGGER_LEG_STITCHES } from "./jogger";
import { GradeRule, SizeStep } from "./grading";
import { TSHIRT_SIZES } from "./tshirt-grade";
import { Pom, seam, spanY } from "./pom";
import type { TechPack } from "./recipe";
import type { AllowanceSpec } from "./allowance";
import type { PieceNotches } from "./tshirt-notches";
import type { GarmentOptions } from "./options";
import { JOGGER_DEFAULT_OPTIONS, JOGGER_OPTION_DEFINITIONS } from "./jogger-contract";

/** Digital XS–XL redraft steps; these are not absolute size promises. */
export const JOGGER_GRADE: GradeRule = {
  waist: 4,
  hip: 4,
  hipDepth: 1,
  crotchDepth: 1,
  thigh: 2,
  knee: 1.5,
  inseam: 1.5,
};

export const JOGGER_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

/** All Jogger pieces are cut off-fold. The 1 cm general / 2 cm hem values
 * follow the shipped Trouser software table; they are digital defaults, not
 * source-confirmed or physically validated Jogger seam allowances. */
export const JOGGER_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    hem: 2,
    waist: 1,
    centerFront: 1,
    centerBack: 1,
    crotch: 1,
    sideUpper: 1,
    sideHipToThigh: 1,
    sideThighToKnee: 1,
    sideKneeToHem: 1,
    inseamLower: 1,
    inseamUpper: 1,
    innerThighToCrotch: 1,
    top: 1,
    bottom: 1,
    endRight: 1,
    endLeft: 1,
    opening: 1,
    bagLower: 1,
    bagOuter: 1,
    bagClose: 1,
  },
};

const leftSide = JOGGER_LEG_STITCHES[0];
const rightSide = JOGGER_LEG_STITCHES[1];
const leftInseam = JOGGER_LEG_STITCHES[2];
const rightInseam = JOGGER_LEG_STITCHES[3];
const centerBack = JOGGER_LEG_STITCHES[4];

/** Jogger balance notches and grainlines resolve against its actual pieces. */
export const JOGGER_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "jogger front left",
    notches: [
      { edgeName: "waist", t: 0.5 },
      matchedNotch(leftSide, "a", 0.5, 0),
      matchedNotch(leftSide, "a", 0.5, 2),
      matchedNotch(leftInseam, "a", 0.5, 1),
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "jogger front right",
    notches: [
      { edgeName: "waist", t: 0.5 },
      matchedNotch(rightSide, "a", 0.5, 0),
      matchedNotch(rightSide, "a", 0.5, 2),
      matchedNotch(rightInseam, "a", 0.5, 1),
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "jogger back left",
    notches: [
      { edgeName: "waist", t: 0.5 },
      matchedNotch(leftSide, "b", 0.5, 3),
      matchedNotch(leftSide, "b", 0.5, 1),
      matchedNotch(leftInseam, "b", 0.5, 1),
      matchedNotch(centerBack, "a", 0.5),
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "jogger back right",
    notches: [
      { edgeName: "waist", t: 0.5 },
      matchedNotch(rightSide, "b", 0.5, 3),
      matchedNotch(rightSide, "b", 0.5, 1),
      matchedNotch(rightInseam, "b", 0.5, 1),
      matchedNotch(centerBack, "b", 0.5),
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "jogger waistband casing",
    notches: [
      { edgeName: "top", t: 0.5 },
      { edgeName: "bottom", t: 0.125 },
      { edgeName: "bottom", t: 0.375 },
      { edgeName: "bottom", t: 0.625 },
      { edgeName: "bottom", t: 0.875 },
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  ...["jogger pocket bag left", "jogger pocket bag right"].map((pieceName) => ({
    pieceName,
    notches: [{ edgeName: "opening", t: 0.5 }, { edgeName: "bagOuter", t: 0.5 }],
    grainline: { topEdge: "opening", topT: 0.5, bottomEdge: "bagOuter", bottomT: 0.5 },
  })),
];

const front = (b: Block) => rolePiece(b, "frontLeft");
const back = (b: Block) => rolePiece(b, "backLeft");
const casing = (b: Block) => rolePiece(b, "waistband");
const pocket = (b: Block, role: "pocketBagLeft" | "pocketBagRight") => rolePiece(b, role);
const pocketJoinLength = (b: Block, label: string) => {
  const stitch = b.stitches.find((candidate) => candidate.label === label)!;
  return interfaceLength(b, stitch.a);
};

/** POMs are live digital values; the hip-depth row is explicitly a body
 * reference carried through unchanged by the lower-body draft station. */
export const JOGGER_POMS: readonly Pom[] = [
  { label: "Waist (finished)", measure: (b) => 4 * seam(front(b), "waist") },
  { label: "Seat / hip (finished)", measure: (b) => 4 * edgeEnd(pieceEdge(front(b), "sideUpper")).x },
  { label: "Hip depth (body reference)", measure: (b) => spanY(front(b), { edge: "waist", at: "start" }, { edge: "sideUpper", at: "end" }) },
  {
    label: "Front rise (finished incl. casing)",
    measure: (b) => spanY(front(b), { edge: "centerFront", at: "start" }, { edge: "centerFront", at: "end" }) + seam(casing(b), "endRight"),
  },
  {
    label: "Back rise (finished incl. casing)",
    measure: (b) => spanY(back(b), { edge: "centerBack", at: "start" }, { edge: "centerBack", at: "end" }) + seam(casing(b), "endRight"),
  },
  {
    label: "Thigh (finished)",
    measure: (b) => 4 * distance(edgeEnd(pieceEdge(front(b), "sideHipToThigh")), edgeStart(pieceEdge(front(b), "innerThighToCrotch"))),
  },
  {
    label: "Knee (finished)",
    measure: (b) => 4 * distance(edgeEnd(pieceEdge(front(b), "sideThighToKnee")), edgeEnd(pieceEdge(front(b), "inseamLower"))),
  },
  {
    label: "Inseam (finished seam)",
    measure: (b) => seam(front(b), "innerThighToCrotch") + seam(front(b), "inseamUpper") + seam(front(b), "inseamLower"),
  },
  {
    label: "Outseam (finished incl. casing)",
    measure: (b) => seam(front(b), "sideUpper") + seam(front(b), "sideHipToThigh") + seam(front(b), "sideThighToKnee") + seam(front(b), "sideKneeToHem") + seam(casing(b), "endRight"),
  },
  { label: "Leg opening (finished)", measure: (b) => 4 * seam(front(b), "hem") },
  { label: "Casing depth (finished)", measure: (b) => seam(casing(b), "endRight") },
  { label: "Left pocket opening (finished seam)", measure: (b) => pocketJoinLength(b, "Left slant pocket opening to bag") },
  { label: "Right pocket opening (finished seam)", measure: (b) => pocketJoinLength(b, "Right slant pocket opening to bag") },
  { label: "Pocket bag depth (finished)", measure: (b) => seam(pocket(b, "pocketBagLeft"), "bagLower") },
  { label: "Pocket bag width (finished)", measure: (b) => seam(pocket(b, "pocketBagLeft"), "bagOuter") },
];

/** User-measured quantities remain explicit; no hardware length is inferred. */
export const JOGGER_TECH_PACK: TechPack = {
  bom: [
    { material: "Knit main fabric", placement: "Four leg panels, casing and pocket bags", qty: "User-entered after layout; single-bolt estimate only" },
    { material: "Elastic", placement: "Separate waist casing", qty: "User-measured and test-fit; do not calculate cut length" },
    { material: "Self-fabric drawcord", placement: "Centre-front casing exits", qty: "User-selected and measured; digital option is a seed" },
    { material: "Sewing thread", placement: "All seams and casing channel", qty: "User-selected" },
  ],
  construction: [
    "Cut the four leg panels, separate casing and paired pocket bags in the selected knit; keep every piece in the same grain direction.",
    "Sew each pocket bag to its matching marked front opening, then secure the bag inside the front panel.",
    "Join each front leg to its matching back leg at the side seam, matching the Jogger side balance notches.",
    "Sew the front and back inseams, then close the centre-back rise, matching the Jogger seam notches.",
    "Join the casing ends, then attach its lower edge to the four-panel waist, matching the quarter marks.",
    "Measure and test-fit the chosen elastic; enter its actual cut length. Do not use a fixed waist-reduction rule.",
    "Form the elastic and drawcord channels on the marked casing lines; keep both channels clear of the casing edges.",
    "When drawcord exits are enabled, finish both marked centre-front buttonholes and pass the user-measured cord through them.",
    "Stitch through all layers at the centre-back retention mark to keep the drawcord from pulling out.",
    "Press seams and turn up the plain leg hems using the deeper hem allowance.",
  ],
};

/**
 * Keep the non-geometric drawcord-length seed visible in the Tech Pack while
 * stating plainly that it is not a finished or cut length instruction.
 */
export function joggerTechPackForOptions(options: GarmentOptions): TechPack {
  const definition = JOGGER_OPTION_DEFINITIONS.find((item) => item.id === "drawcordLength")!;
  const seed = options.drawcordLength ?? JOGGER_DEFAULT_OPTIONS.drawcordLength;
  const valid = Number.isFinite(seed) && seed >= definition.min && seed <= definition.max;
  const disclosure = valid
    ? `Digital drawcord seed: ${seed} cm (not a cut length); measure/test-fit cord before cutting.`
    : `Digital drawcord-length seed: ${String(seed)} cm is outside the ${definition.min}–${definition.max} cm control range. Correct the seed, then measure and test-fit the finished cord; this value is not a cut length.`;
  return {
    ...JOGGER_TECH_PACK,
    construction: [disclosure, ...JOGGER_TECH_PACK.construction],
  };
}
