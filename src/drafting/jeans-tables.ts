import type { GrainlineRule, NotchRule } from "../render/notch";
import type { AllowanceSpec } from "./allowance";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { rolePiece, type Block } from "./block";
import type { PieceNotches } from "./tshirt-notches";
import type { BomRow, TechPack } from "./recipe";

const FRONT_GRAINLINE: GrainlineRule = {
  topEdge: "waist",
  topT: 0.5,
  bottomEdge: "hem",
  bottomT: 0.5,
};

const BACK_YOKE_GRAINLINE: GrainlineRule = {
  topEdge: "waist",
  topT: 0.5,
  bottomEdge: "yokeJoin",
  bottomT: 0.5,
};

const BACK_LOWER_GRAINLINE: GrainlineRule = {
  topEdge: "yokeJoin",
  topT: 0.2,
  bottomEdge: "hem",
  bottomT: 0.5,
};

const FRONT_NOTCHES: readonly NotchRule[] = [
  { edgeName: "pocketOpening", t: 0.5 },
  { edgeName: "sideHipToThigh", t: 0 },
  { edgeName: "inseamUpper", t: 0.5 },
];

const POCKET_FACING_GRAINLINE: GrainlineRule = {
  topEdge: "waistFacing",
  topT: 0.5,
  bottomEdge: "sideFacing",
  bottomT: 0.5,
};

const POCKET_BAG_GRAINLINE: GrainlineRule = {
  topEdge: "pocketOpening",
  topT: 0.5,
  bottomEdge: "bagBottom",
  bottomT: 0.5,
};

const POCKET_STAY_GRAINLINE: GrainlineRule = {
  topEdge: "stayTop",
  topT: 0.5,
  bottomEdge: "stayLower",
  bottomT: 0.5,
};

const COIN_FACING_EXTENSION_GRAINLINE: GrainlineRule = {
  topEdge: "facingJoin",
  topT: 0.5,
  bottomEdge: "extensionBottom",
  bottomT: 0.5,
};

const PATCH_POCKET_GRAINLINE: GrainlineRule = {
  topEdge: "pocketTop",
  topT: 0.5,
  bottomEdge: "pocketBottom",
  bottomT: 0.5,
};

const BACK_YOKE_NOTCHES: readonly NotchRule[] = [
  { edgeName: "sideWaistToYoke", t: 0 },
  { edgeName: "yokeJoin", t: 0.5 },
  { edgeName: "centerBackYoke", t: 0.5 },
];

const BACK_LOWER_NOTCHES: readonly NotchRule[] = [
  { edgeName: "sideYokeToHip", t: 1 },
  { edgeName: "yokeJoin", t: 0.5 },
  { edgeName: "centerBackLower", t: 0.5 },
  { edgeName: "inseamUpper", t: 0.5 },
];

/** Rule-based notches and grain for the internal Jeans draft roles. */
export const JEANS_NOTCHES: readonly PieceNotches[] = [
  { pieceName: "jeans front left", notches: FRONT_NOTCHES, grainline: FRONT_GRAINLINE },
  { pieceName: "jeans front right", notches: FRONT_NOTCHES, grainline: FRONT_GRAINLINE },
  { pieceName: "jeans back yoke left", notches: BACK_YOKE_NOTCHES, grainline: BACK_YOKE_GRAINLINE },
  { pieceName: "jeans back yoke right", notches: BACK_YOKE_NOTCHES, grainline: BACK_YOKE_GRAINLINE },
  { pieceName: "jeans back lower left", notches: BACK_LOWER_NOTCHES, grainline: BACK_LOWER_GRAINLINE },
  { pieceName: "jeans back lower right", notches: BACK_LOWER_NOTCHES, grainline: BACK_LOWER_GRAINLINE },
  { pieceName: "jeans front pocket facing left", notches: [{ edgeName: "opening", t: 0.5 }], grainline: POCKET_FACING_GRAINLINE },
  { pieceName: "jeans front pocket facing right", notches: [{ edgeName: "opening", t: 0.5 }], grainline: POCKET_FACING_GRAINLINE },
  { pieceName: "jeans front pocket bag left", notches: [{ edgeName: "pocketOpening", t: 0.5 }], grainline: POCKET_BAG_GRAINLINE },
  { pieceName: "jeans front pocket bag right", notches: [{ edgeName: "pocketOpening", t: 0.5 }], grainline: POCKET_BAG_GRAINLINE },
  { pieceName: "jeans front pocket stay left", notches: [{ edgeName: "stayJoin", t: 0.5 }], grainline: POCKET_STAY_GRAINLINE },
  { pieceName: "jeans front pocket stay right", notches: [{ edgeName: "stayJoin", t: 0.5 }], grainline: POCKET_STAY_GRAINLINE },
  { pieceName: "jeans right coin-pocket facing extension", notches: [{ edgeName: "facingJoin", t: 0.5 }], grainline: COIN_FACING_EXTENSION_GRAINLINE },
  { pieceName: "jeans coin pocket", notches: [{ edgeName: "pocketTop", t: 0.5 }], grainline: PATCH_POCKET_GRAINLINE },
  { pieceName: "jeans back patch pocket left", notches: [{ edgeName: "pocketTop", t: 0.5 }], grainline: PATCH_POCKET_GRAINLINE },
  { pieceName: "jeans back patch pocket right", notches: [{ edgeName: "pocketTop", t: 0.5 }], grainline: PATCH_POCKET_GRAINLINE },
];

/** Keep the back-yoke side notch at its live station when the pocket drop
 * moves that station from the front panel onto the pocket-facing side seam. */
export function jeansNotchesForDraft(draft: Block): readonly PieceNotches[] {
  const front = rolePiece(draft, "frontLeft");
  const facing = rolePiece(draft, "pocketFacingLeft");
  const yoke = rolePiece(draft, "backYokeLeft");
  const yokePoint = edgeStart(pieceEdge(yoke, "sideWaistToYoke"));
  const frontKeepsYokeStation = front.edges.some(({ name }) => name === "sidePocketDropToYoke");
  const facingSide = pieceEdge(facing, "sideFacing");
  const yokeRule: NotchRule = frontKeepsYokeStation
    ? { edgeName: "sidePocketDropToYoke", t: 1 }
    : { edgeName: "sideFacing", t: (yokePoint.y - edgeStart(facingSide).y) /
      (edgeEnd(facingSide).y - edgeStart(facingSide).y) };

  return JEANS_NOTCHES.map((rule) => {
    const isFront = rule.pieceName === "jeans front left" || rule.pieceName === "jeans front right";
    const isFacing = rule.pieceName === "jeans front pocket facing left" ||
      rule.pieceName === "jeans front pocket facing right";
    if (isFront && frontKeepsYokeStation) return { ...rule, notches: [...rule.notches, yokeRule] };
    if (isFacing && !frontKeepsYokeStation) return { ...rule, notches: [...rule.notches, yokeRule] };
    return rule;
  });
}

export const JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM = 1.9;

/** Digital Jeans cut map based on the named, pattern-specific source examples. */
export const JEANS_ALLOWANCES: AllowanceSpec = {
  default: 1.6,
  byEdge: {
    hem: 3.8,
    pocketTop: JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM,
  },
  byPieceEdge: {
    "jeans fly shield": { shieldBottom: 0.6 },
    "jeans front pocket bag left": { bagClose: 1.0 },
    "jeans front pocket bag right": { bagClose: 1.0 },
    "jeans belt-loop strip": {
      stripStart: 0,
      stripOuter: 0,
      stripEnd: 0,
      stripInner: 0,
    },
  },
};

export const JEANS_PRIMARY_TOPSTITCH_CM = 0.3;
export const JEANS_SECONDARY_TOPSTITCH_SPACING_CM = 0.6;

export interface JeansCutRoleQuantity {
  readonly role: string;
  readonly pieceName: string;
  readonly quantity: number;
  readonly note?: string;
}

/** Separate named cut roles are listed once; strip yield is reported separately. */
export const JEANS_CUT_ROLE_QUANTITIES: readonly JeansCutRoleQuantity[] = [
  { role: "frontLeft", pieceName: "jeans front left", quantity: 1 },
  { role: "frontRight", pieceName: "jeans front right", quantity: 1 },
  { role: "backYokeLeft", pieceName: "jeans back yoke left", quantity: 1 },
  { role: "backYokeRight", pieceName: "jeans back yoke right", quantity: 1 },
  { role: "backLowerLeft", pieceName: "jeans back lower left", quantity: 1 },
  { role: "backLowerRight", pieceName: "jeans back lower right", quantity: 1 },
  { role: "pocketFacingLeft", pieceName: "jeans front pocket facing left", quantity: 1 },
  { role: "pocketFacingRight", pieceName: "jeans front pocket facing right", quantity: 1 },
  { role: "pocketBagLeft", pieceName: "jeans front pocket bag left", quantity: 1 },
  { role: "pocketBagRight", pieceName: "jeans front pocket bag right", quantity: 1 },
  { role: "pocketStayLeft", pieceName: "jeans front pocket stay left", quantity: 1 },
  { role: "pocketStayRight", pieceName: "jeans front pocket stay right", quantity: 1 },
  { role: "pocketFacingExtensionRight", pieceName: "jeans right coin-pocket facing extension", quantity: 1 },
  { role: "coinPocket", pieceName: "jeans coin pocket", quantity: 1 },
  { role: "backPocketLeft", pieceName: "jeans back patch pocket left", quantity: 1 },
  { role: "backPocketRight", pieceName: "jeans back patch pocket right", quantity: 1 },
  { role: "flyFacingUnderlapRight", pieceName: "jeans right fly facing and underlap", quantity: 1 },
  { role: "flyShield", pieceName: "jeans fly shield", quantity: 1 },
  { role: "waistbandOuterLeft", pieceName: "jeans outer waistband left", quantity: 1 },
  { role: "waistbandOuterRight", pieceName: "jeans outer waistband right", quantity: 1 },
  { role: "waistbandInnerLeft", pieceName: "jeans inner waistband left", quantity: 1 },
  { role: "waistbandInnerRight", pieceName: "jeans inner waistband right", quantity: 1 },
  {
    role: "beltLoopStrip",
    pieceName: "jeans belt-loop strip",
    quantity: 1,
    note: "One cut strip yields six loop segments; fabric consumption and marker yield are unknown.",
  },
];

export interface JeansConstructionStep {
  readonly order: number;
  readonly action: string;
  readonly roles: readonly string[];
}

/** Ordered digital workflow notes; they are not physical sewing validation. */
export const JEANS_CONSTRUCTION_STEPS: readonly JeansConstructionStep[] = [
  {
    order: 1,
    action: "Prepare the listed pieces and use their notches, grainlines, construction marks, and Jeans allowance map.",
    roles: JEANS_CUT_ROLE_QUANTITIES.map(({ role }) => role),
  },
  {
    order: 2,
    action: "Turn and topstitch the coin and back-pocket tops, then attach the pockets at their placement marks; the marked bartacks and six rivets are digital callouts, with rivets optional.",
    roles: ["coinPocket", "backPocketLeft", "backPocketRight", "backLowerLeft", "backLowerRight", "pocketFacingExtensionRight"],
  },
  {
    order: 3,
    action: "Assemble the front pocket bags, facings, and stays; sew the first bag pass, trim it to the recorded 0.3 cm, then secure it with the recorded 0.6 cm pass.",
    roles: ["frontLeft", "frontRight", "pocketFacingLeft", "pocketFacingRight", "pocketBagLeft", "pocketBagRight", "pocketStayLeft", "pocketStayRight"],
  },
  {
    order: 4,
    action: "Join the back yokes with the paired marked rows; after sewing, the named back-side allowance is digitally noted for trimming to 0.6 cm.",
    roles: ["backYokeLeft", "backYokeRight", "backLowerLeft", "backLowerRight"],
  },
  {
    order: 5,
    action: "Install the fly zipper and shield at their placement marks, then sew the two marked fly bartacks.",
    roles: ["frontLeft", "frontRight", "flyFacingUnderlapRight", "flyShield"],
  },
  {
    order: 6,
    action: "Join the center-back seat, inseams, and side seams at their matching role interfaces; retain the paired flat-felled yoke/inseam rows and the source's regular side-seam treatment.",
    roles: ["frontLeft", "frontRight", "backLowerLeft", "backLowerRight"],
  },
  {
    order: 7,
    action: "Join the waistband halves at center back, attach the outer waistband to the waist, turn the inner layer, and topstitch at the marked rows.",
    roles: ["waistbandOuterLeft", "waistbandOuterRight", "waistbandInnerLeft", "waistbandInnerRight"],
  },
  {
    order: 8,
    action: "Cut six loop segments from the single strip, fold and topstitch them, then attach each at its paired waistband anchors; set the single button at the wearer-right waistband cue.",
    roles: ["beltLoopStrip", "waistbandOuterLeft", "waistbandOuterRight"],
  },
  {
    order: 9,
    action: "Turn and stitch each leg hem using the mapped 3.8 cm cut allowance.",
    roles: ["frontLeft", "frontRight", "backLowerLeft", "backLowerRight"],
  },
];

export const JEANS_BOM: readonly BomRow[] = [
  {
    material: "Shell fabric (denim or other selected woven)",
    placement: "All Jeans cut roles",
    qty: "Unknown; size, fabric width, marker, and process are unselected.",
  },
  {
    material: "Pocketing fabric",
    placement: "Front pocket bags",
    qty: "Unknown; marker and selected fabric width are required.",
  },
  {
    material: "Interfacing",
    placement: "Waistband/fly as selected",
    qty: "Unknown; material and construction choice are unselected.",
  },
  { material: "Jeans zipper", placement: "Fly", qty: "1; size and length unconfirmed." },
  { material: "Jeans button", placement: "Wearer-right waistband", qty: "1; size and compatibility unconfirmed." },
  {
    material: "Jeans rivets (optional)",
    placement: "Two front scoop pockets and coin pocket",
    qty: "6 optional; size, tool, supplier, and material compatibility unconfirmed.",
  },
  { material: "Sewing thread", placement: "Seams and topstitching", qty: "Unknown; type and consumption unvalidated." },
];

export const JEANS_TECH_PACK: TechPack = {
  bom: JEANS_BOM,
  constructionNotice: "Internal digital draft notes only. Verify material, hardware compatibility, seam bulk, tools, and physical sewing order before use; no InfiniDrip Jeans has been sewn or fit validated.",
  construction: JEANS_CONSTRUCTION_STEPS.map(({ order, action }) => `${order}. ${action}`),
};
