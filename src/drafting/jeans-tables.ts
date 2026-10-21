import type { GrainlineRule, NotchRule } from "../render/notch";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { rolePiece, type Block } from "./block";
import type { PieceNotches } from "./tshirt-notches";

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
