import type { GrainlineRule, NotchRule } from "../render/notch";
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
  { edgeName: "sideWaistToYoke", t: 1 },
  { edgeName: "sideYokeToHip", t: 1 },
  { edgeName: "inseamUpper", t: 0.5 },
];

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
];
