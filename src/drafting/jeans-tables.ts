import type { GrainlineRule, NotchRule } from "../render/notch";
import { distance } from "../geometry";
import type { AllowanceSpec } from "./allowance";
import { edgeEnd, edgeStart, pieceEdge, edgeLength } from "./piece";
import { rolePiece, type Block } from "./block";
import type { PieceNotches } from "./tshirt-notches";
import type { BomRow, TechPack } from "./recipe";
import type { GradeRule, SizeStep } from "./grading";
import type { Pom } from "./pom";
import { interfaceLength } from "./stitch";
import { TROUSER_GRADE, TROUSER_SIZES } from "./trouser-tables";

/** Jeans uses the reviewed lower-body redraft rule and its XS–XL steps. */
export const JEANS_GRADE: GradeRule = TROUSER_GRADE;
export const JEANS_SIZES: readonly SizeStep[] = TROUSER_SIZES;

export interface JeansPomLandmark {
  readonly id: string;
  readonly label: string;
}

export interface JeansPomDefinition {
  readonly id: string;
  readonly label: string;
  readonly methodKind: "STRAIGHT_LINE" | "EDGE_LENGTH" | "CLOSED_GIRTH" | "OTHER";
  readonly instructions: string;
  readonly landmarks: readonly JeansPomLandmark[];
  /** Stable code locator used by the recipe-scoped T02 source record. */
  readonly sourceLocator: string;
  readonly measure: Pom["measure"];
}

const role = (draft: Block, name: string) => rolePiece(draft, name);
const edge = (draft: Block, roleName: string, edgeName: string) => pieceEdge(role(draft, roleName), edgeName);

/** Live modeled POMs. These describe digital cut/seam geometry, not sewn fit. */
export const JEANS_POM_DEFINITIONS: readonly JeansPomDefinition[] = [
  {
    id: "jeans.waist.finished",
    label: "Waist circumference (modeled)",
    methodKind: "CLOSED_GIRTH",
    instructions: "Sum the front-panel and pocket-facing waist edges on both sides, plus both back-yoke waist seams on the assembled digital pattern.",
    landmarks: [
      { id: "front.waist.start", label: "Front center waist seam" },
      { id: "front.waist.end", label: "Front side waist seam" },
      { id: "pocket-facing.waist.left", label: "Left pocket-facing waist join" },
      { id: "pocket-facing.waist.right", label: "Right pocket-facing waist join" },
      { id: "back-yoke.waist.start", label: "Back side waist seam" },
      { id: "back-yoke.waist.end", label: "Back center waist seam" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.waist.finished",
    measure: (draft) => 2 * (
      edgeLength(edge(draft, "frontLeft", "waist")) +
      edgeLength(edge(draft, "pocketFacingLeft", "waistFacing")) +
      edgeLength(edge(draft, "backYokeLeft", "waist"))
    ),
  },
  {
    id: "jeans.seat.finished",
    label: "Seat circumference (modeled)",
    methodKind: "CLOSED_GIRTH",
    instructions: "Multiply the live center-front-to-side hip station by four across the front and back pattern quadrants.",
    landmarks: [{ id: "front.side.hip", label: "Front side seam at the drafted hip station" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.seat.finished",
    measure: (draft) => 4 * edgeEnd(edge(draft, "frontLeft", "sideYokeToHip")).x,
  },
  {
    id: "jeans.front-rise.finished",
    label: "Front rise including waistband (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the center-front rise seam and add the live waistband closure-end depth.",
    landmarks: [
      { id: "front.center-waist", label: "Front center waist seam" },
      { id: "front.center-crotch", label: "Front center crotch seam" },
      { id: "waistband.closure-end", label: "Waistband closure-end depth" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.front-rise.finished",
    measure: (draft) => edgeLength(edge(draft, "frontLeft", "centerFront")) + edgeLength(edge(draft, "waistbandOuterLeft", "closureEnd")),
  },
  {
    id: "jeans.back-rise.finished",
    label: "Back rise including waistband (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Sum the center-back lower seam, center-back yoke seam, and live waistband closure-end depth.",
    landmarks: [
      { id: "back.center-crotch", label: "Back center crotch seam" },
      { id: "back.yoke-center", label: "Center-back yoke seam" },
      { id: "waistband.closure-end", label: "Waistband closure-end depth" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.back-rise.finished",
    measure: (draft) => edgeLength(edge(draft, "backLowerLeft", "centerBackLower")) +
      edgeLength(edge(draft, "backYokeLeft", "centerBackYoke")) +
      edgeLength(edge(draft, "waistbandOuterLeft", "closureEnd")),
  },
  {
    id: "jeans.thigh.finished",
    label: "Thigh circumference (modeled)",
    methodKind: "CLOSED_GIRTH",
    instructions: "Multiply the live side-to-inseam thigh station width by four pattern quadrants.",
    landmarks: [
      { id: "leg.side.thigh", label: "Side seam at the drafted thigh station" },
      { id: "leg.inseam.thigh", label: "Inseam at the drafted thigh station" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.thigh.finished",
    measure: (draft) => 4 * distance(
      edgeEnd(edge(draft, "frontLeft", "sideHipToThigh")),
      edgeEnd(edge(draft, "frontLeft", "inseamUpper")),
    ),
  },
  {
    id: "jeans.knee.station.finished",
    label: "Modeled knee-station circumference",
    methodKind: "CLOSED_GIRTH",
    instructions: "Multiply the digital side-to-inseam width at the pattern's internal knee transition station by four; this is not an anatomical knee mapping.",
    landmarks: [
      { id: "leg.side.knee-station", label: "Side seam at the internal leg transition station" },
      { id: "leg.inseam.knee-station", label: "Inseam at the internal leg transition station" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.knee.station.finished",
    measure: (draft) => 4 * distance(
      edgeEnd(edge(draft, "frontLeft", "sideThighToKnee")),
      edgeEnd(edge(draft, "frontLeft", "inseamLower")),
    ),
  },
  {
    id: "jeans.inseam.finished",
    label: "Inseam seam length (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Sum the three live front-panel inseam edges from crotch transition to hem.",
    landmarks: [
      { id: "leg.inner-crotch", label: "Inner thigh to crotch transition" },
      { id: "leg.inseam-upper", label: "Upper inseam" },
      { id: "leg.inseam-lower", label: "Lower inseam to hem" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.inseam.finished",
    measure: (draft) => edgeLength(edge(draft, "frontLeft", "innerThighToCrotch")) +
      edgeLength(edge(draft, "frontLeft", "inseamUpper")) +
      edgeLength(edge(draft, "frontLeft", "inseamLower")),
  },
  {
    id: "jeans.outseam.finished",
    label: "Outseam including waistband (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Sum one live side-seam path from waist to hem, including the waistband depth.",
    landmarks: [
      { id: "leg.side-waist", label: "Side waist seam" },
      { id: "leg.side-hip", label: "Side seam through hip station" },
      { id: "leg.side-thigh", label: "Side seam through thigh station" },
      { id: "leg.side-knee", label: "Side seam through internal knee station" },
      { id: "leg.side-hem", label: "Side seam at hem" },
      { id: "waistband.closure-end", label: "Waistband closure-end depth" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.outseam.finished",
    measure: (draft) => interfaceLength(draft, draft.stitches.find(({ label }) => label === "Left side seam (front ↔ back)")!.a) +
      edgeLength(edge(draft, "waistbandOuterLeft", "closureEnd")),
  },
  {
    id: "jeans.leg-opening.finished",
    label: "Leg opening circumference (modeled)",
    methodKind: "CLOSED_GIRTH",
    instructions: "Multiply the live front-panel hem edge width by four pattern quadrants.",
    landmarks: [{ id: "leg.hem.front", label: "Front panel hem edge" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.leg-opening.finished",
    measure: (draft) => 4 * edgeLength(edge(draft, "frontLeft", "hem")),
  },
  {
    id: "jeans.waistband.depth.finished",
    label: "Waistband depth (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the vertical closure-end edge on the live outer waistband piece.",
    landmarks: [{ id: "waistband.closure-end", label: "Waistband closure end" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.waistband.depth.finished",
    measure: (draft) => edgeLength(edge(draft, "waistbandOuterLeft", "closureEnd")),
  },
  {
    id: "jeans.back-yoke.depth.center",
    label: "Center-back yoke depth (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the live center-back yoke edge from waist seam to yoke join.",
    landmarks: [
      { id: "back.waist.center", label: "Center-back waist seam" },
      { id: "back.yoke.center", label: "Center-back yoke join" },
    ],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.back-yoke.depth.center",
    measure: (draft) => edgeLength(edge(draft, "backYokeLeft", "centerBackYoke")),
  },
  {
    id: "jeans.front-pocket.opening.left",
    label: "Left front pocket opening seam (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the curved opening edge on the live left front piece.",
    landmarks: [{ id: "front.pocket.opening.left", label: "Left front pocket opening curve" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.front-pocket.opening.left",
    measure: (draft) => edgeLength(edge(draft, "frontLeft", "pocketOpening")),
  },
  {
    id: "jeans.coin-pocket.width.cut",
    label: "Coin pocket cut width (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the top edge of the live coin-pocket cut piece.",
    landmarks: [{ id: "coin-pocket.top", label: "Coin pocket top cut edge" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.coin-pocket.width.cut",
    measure: (draft) => edgeLength(edge(draft, "coinPocket", "pocketTop")),
  },
  {
    id: "jeans.coin-pocket.height.cut",
    label: "Coin pocket cut height (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the outer edge of the live coin-pocket cut piece.",
    landmarks: [{ id: "coin-pocket.outer", label: "Coin pocket outer cut edge" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.coin-pocket.height.cut",
    measure: (draft) => edgeLength(edge(draft, "coinPocket", "pocketOuter")),
  },
  {
    id: "jeans.back-pocket.width.cut",
    label: "Back pocket cut width (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the top edge of the live back patch-pocket cut piece.",
    landmarks: [{ id: "back-pocket.top", label: "Back patch pocket top cut edge" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.back-pocket.width.cut",
    measure: (draft) => edgeLength(edge(draft, "backPocketLeft", "pocketTop")),
  },
  {
    id: "jeans.back-pocket.height.cut",
    label: "Back pocket cut height (modeled)",
    methodKind: "EDGE_LENGTH",
    instructions: "Measure the outer edge of the live back patch-pocket cut piece.",
    landmarks: [{ id: "back-pocket.outer", label: "Back patch pocket outer cut edge" }],
    sourceLocator: "JEANS_POM_DEFINITIONS.jeans.back-pocket.height.cut",
    measure: (draft) => edgeLength(edge(draft, "backPocketLeft", "pocketOuter")),
  },
];

/** Generic spec-sheet shape backed by the live digital POM functions above. */
export const JEANS_POMS: readonly Pom[] = JEANS_POM_DEFINITIONS.map(({ label, measure }) => ({ label, measure }));

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

const FLY_FACING_GRAINLINE: GrainlineRule = {
  topEdge: "facingTop",
  topT: 0.5,
  bottomEdge: "facingBottom",
  bottomT: 0.5,
};

const FLY_SHIELD_GRAINLINE: GrainlineRule = {
  topEdge: "shieldTop",
  topT: 0.5,
  bottomEdge: "shieldBottom",
  bottomT: 0.5,
};

const WAISTBAND_GRAINLINE: GrainlineRule = {
  topEdge: "frontTop",
  topT: 0.5,
  bottomEdge: "backTop",
  bottomT: 0.5,
};

const BELT_LOOP_STRIP_GRAINLINE: GrainlineRule = {
  topEdge: "stripStart",
  topT: 0.5,
  bottomEdge: "stripEnd",
  bottomT: 0.5,
};

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
  {
    pieceName: "jeans right fly facing and underlap",
    notches: [{ edgeName: "facingTop", t: 0.5 }],
    grainline: FLY_FACING_GRAINLINE,
  },
  {
    pieceName: "jeans fly shield",
    notches: [{ edgeName: "shieldBottom", t: 0.5 }],
    grainline: FLY_SHIELD_GRAINLINE,
  },
  ...[
    "jeans outer waistband left",
    "jeans outer waistband right",
    "jeans inner waistband left",
    "jeans inner waistband right",
  ].map((pieceName) => ({
    pieceName,
    notches: [
      { edgeName: "frontWaistSeam", t: 1 },
      { edgeName: "centerBackJoin", t: 0.5 },
    ],
    grainline: WAISTBAND_GRAINLINE,
  })),
  {
    pieceName: "jeans belt-loop strip",
    notches: [
      { edgeName: "stripStart", t: 1 / 3 },
      { edgeName: "stripStart", t: 2 / 3 },
    ],
    grainline: BELT_LOOP_STRIP_GRAINLINE,
  },
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
