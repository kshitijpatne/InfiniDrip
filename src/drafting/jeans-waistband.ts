import { distance, point, type Point } from "../geometry";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
import { edgeLength, pieceEdge, type Edge, type Piece } from "./piece";
import { edgeRef, iface, type Stitch } from "./stitch";
import type { JeansOptions } from "./jeans-contract";

export const JEANS_WAISTBAND_LOOP_CLEARANCE_CM = 1;

const LOOP_COUNT = 6;
const LOOP_END_FOLD_CM = 1;
const BUTTONHOLE_AXIS_HALF_LENGTH_CM = 0.5;
const POINT_TOLERANCE_CM = 1e-7;
const SIDE_LOOP_FROM_SIDE_SEAM_CM = 3.8;
const REAR_LOOP_FROM_CENTER_BACK_CM = 2;
const OPTION_RANGES = {
  waistbandDepth: [2, 8],
  waistbandExtension: [1, 3],
  beltLoopWidth: [0.5, 1.5],
} as const;

type LineEdge = Extract<Edge, { readonly kind: "line" }>;
type CurveEdge = Extract<Edge, { readonly kind: "curve" }>;
type WaistbandOption = keyof typeof OPTION_RANGES;

export interface JeansWaistbandInputs {
  readonly frontLeft: Piece;
  readonly frontRight: Piece;
  readonly pocketFacingLeft: Piece;
  readonly pocketFacingRight: Piece;
  readonly backYokeLeft: Piece;
  readonly backYokeRight: Piece;
  readonly coinPocket: Piece;
  readonly backPocketLeft: Piece;
  readonly backPocketRight: Piece;
  readonly options: JeansOptions;
}

export interface JeansWaistbandPieces {
  readonly outerLeft: Piece;
  readonly outerRight: Piece;
  readonly innerLeft: Piece;
  readonly innerRight: Piece;
  readonly beltLoopStrip: Piece;
  readonly stitches: readonly Stitch[];
}

interface HalfLengths {
  readonly frontCore: number;
  readonly front: number;
  readonly back: number;
}

interface LoopLocation {
  readonly name: string;
  readonly center: number;
}

function requireOptionRange(value: number, name: WaistbandOption): void {
  const [minimum, maximum] = OPTION_RANGES[name];
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be a finite value from ${minimum} to ${maximum} cm; received ${String(value)}.`);
  }
}

function lineEdge(piece: Piece, name: string): LineEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "line") {
    throw new RangeError(`Jeans waistband requires ${piece.name} "${name}" to be a straight edge; correct the Jeans waist topology.`);
  }
  return edge;
}

function curveEdge(piece: Piece, name: string): CurveEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "curve") {
    throw new RangeError(`Jeans waistband requires ${piece.name} "${name}" to be a curved pocket edge; correct the Jeans pocket topology.`);
  }
  return edge;
}

function finitePoint(value: Point): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function requireSamePoint(actual: Point, expected: Point, relationship: string): void {
  if (!finitePoint(actual) || !finitePoint(expected)) {
    throw new RangeError(`Jeans waistband cannot resolve a finite ${relationship}; correct the live Jeans waist geometry.`);
  }
  if (distance(actual, expected) > POINT_TOLERANCE_CM) {
    throw new RangeError(`Jeans waistband ${relationship} do not meet; correct the live Jeans pocket and side-seam geometry.`);
  }
}

function finitePositiveLength(edge: LineEdge, relationship: string): number {
  if (![edge.start, edge.end].every(finitePoint)) {
    throw new RangeError(`Jeans waistband requires finite ${relationship}; correct the live Jeans waist geometry.`);
  }
  const length = edgeLength(edge);
  if (!Number.isFinite(length) || length <= 0) {
    throw new RangeError(`Jeans waistband requires a positive ${relationship}; correct the live Jeans waist geometry.`);
  }
  return length;
}

function halfLengths(
  front: Piece,
  facing: Piece,
  backYoke: Piece,
  side: "wearer-left" | "wearer-right",
): HalfLengths {
  const frontWaist = lineEdge(front, "waist");
  const pocketOpening = curveEdge(front, "pocketOpening");
  const facingWaist = lineEdge(facing, "waistFacing");
  const backWaist = lineEdge(backYoke, "waist");
  const centerBackYoke = lineEdge(backYoke, "centerBackYoke");

  requireSamePoint(frontWaist.end, pocketOpening.curve.start, `${side} front waist and pocket opening`);
  requireSamePoint(facingWaist.start, pocketOpening.curve.start, `${side} pocket opening and facing waist`);
  requireSamePoint(facingWaist.end, backWaist.start, `${side} facing waist and side seam`);
  requireSamePoint(backWaist.end, centerBackYoke.start, `${side} waistband and center-back join`);
  if (![pocketOpening.curve.start, pocketOpening.curve.control1, pocketOpening.curve.control2, pocketOpening.curve.end]
    .every(finitePoint)) {
    throw new RangeError(`Jeans waistband cannot place the ${side} front loop from a non-finite pocket curve; correct the frontPocket options.`);
  }

  return {
    frontCore: finitePositiveLength(frontWaist, `${side} front waist edge`),
    front: finitePositiveLength(frontWaist, `${side} front waist edge`)
      + finitePositiveLength(facingWaist, `${side} pocket-facing waist edge`),
    back: finitePositiveLength(backWaist, `${side} back waist edge`),
  };
}

function requirePocketBelowWaist(piece: Piece): void {
  const top = lineEdge(piece, "pocketTop");
  if (![top.start, top.end].every(finitePoint)) {
    // Preserve upstream invalid geometry for the later Jeans guidance layer;
    // the waistband must not replace a raw non-finite pocket/yoke value.
    return;
  }
  const topY = Math.min(top.start.y, top.end.y);
  if (topY < JEANS_WAISTBAND_LOOP_CLEARANCE_CM) {
    throw new RangeError(
      `${piece.name} must remain at least ${JEANS_WAISTBAND_LOOP_CLEARANCE_CM} cm below the live waist for the provisional loop-clearance screen; adjust its placement options.`,
    );
  }
}

function loopLocations(lengths: HalfLengths, width: number, side: "left" | "right"): readonly LoopLocation[] {
  const frontClearance = JEANS_WAISTBAND_LOOP_CLEARANCE_CM;
  const frontAvailable = lengths.front - lengths.frontCore;
  if (frontAvailable < frontClearance + width) {
    throw new RangeError(
      `beltLoopWidth ${width} cm leaves less than ${frontClearance} cm from the ${side} front pocket-waist intersection; reduce beltLoopWidth or revise the frontPocket options.`,
    );
  }
  const total = lengths.front + lengths.back;
  const halfWidth = width / 2;
  const locations: readonly LoopLocation[] = [
    { name: "front", center: lengths.frontCore + frontClearance + halfWidth },
    { name: "side", center: lengths.front + SIDE_LOOP_FROM_SIDE_SEAM_CM },
    { name: "rear", center: total - REAR_LOOP_FROM_CENTER_BACK_CM },
  ];
  for (const location of locations) {
    const end = location.center + halfWidth;
    if (end > total) {
      throw new RangeError(`beltLoopWidth ${width} cm puts the ${side} ${location.name} loop outside the live waistband; adjust the relevant waist dimensions.`);
    }
  }
  for (let index = 1; index < locations.length; index += 1) {
    const previous = locations[index - 1]!;
    const current = locations[index]!;
    const clearGap = current.center - previous.center - width;
    if (clearGap < JEANS_WAISTBAND_LOOP_CLEARANCE_CM) {
      throw new RangeError(
        `The ${side} ${previous.name} and ${current.name} loops leave less than ${JEANS_WAISTBAND_LOOP_CLEARANCE_CM} cm between their full footprints; adjust waistband or pocket dimensions.`,
      );
    }
  }
  // The rear center is fixed 2 cm from center back; the supported maximum
  // finished width is 1.5 cm, so its nearest edge remains 1.25 cm clear.
  return locations;
}

function halfPiece(
  name: string,
  lengths: HalfLengths,
  depth: number,
  extension: number,
  sideStationMarks: readonly PatternMark[],
  specialMarks: readonly PatternMark[] = [],
): Piece {
  const frontSide = point(lengths.front, 0);
  const centerBack = point(lengths.front + lengths.back, 0);
  const centerBackTop = point(centerBack.x, -depth);
  const frontSideTop = point(frontSide.x, -depth);
  const centerFrontTop = point(0, -depth);
  const extensionTop = point(-extension, -depth);
  const extensionBottom = point(-extension, 0);
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "frontWaistSeam", start: point(0, 0), end: frontSide },
      { kind: "line", name: "backWaistSeam", start: frontSide, end: centerBack },
      { kind: "line", name: "centerBackJoin", start: centerBack, end: centerBackTop },
      { kind: "line", name: "backTop", start: centerBackTop, end: frontSideTop },
      { kind: "line", name: "frontTop", start: frontSideTop, end: centerFrontTop },
      { kind: "line", name: "closureExtensionTop", start: centerFrontTop, end: extensionTop },
      { kind: "line", name: "closureEnd", start: extensionTop, end: extensionBottom },
      { kind: "line", name: "closureExtensionBottom", start: extensionBottom, end: point(0, 0) },
    ],
    marks: [
      pointMark("placementPoint", "centerFrontWaistStart", point(0, 0), "CF"),
      lineMark("placementLine", "sideSeamStation", frontSide, frontSideTop, "Side"),
      ...sideStationMarks,
      ...specialMarks,
    ],
  };
}

function loopAnchorMarks(locations: readonly LoopLocation[], depth: number, width: number): PatternMark[] {
  return locations.flatMap(({ name, center }) => {
    const startX = center - width / 2;
    const endX = center + width / 2;
    const label = name === "front" ? "F" : name === "side" ? "S" : "R";
    return [
      lineMark("placementLine", `beltLoop-${name}-upper`, point(startX, -depth), point(endX, -depth), label),
      lineMark("placementLine", `beltLoop-${name}-lower`, point(startX, 0), point(endX, 0)),
    ];
  });
}

function makeLoopStrip(width: number, segmentLength: number): Piece {
  const rawWidth = width * 3;
  const totalLength = segmentLength * LOOP_COUNT;
  const marks: PatternMark[] = [
    lineMark("foldLine", "beltLoop-fold-third-left", point(rawWidth / 3, 0), point(rawWidth / 3, totalLength), "Fold"),
    lineMark("foldLine", "beltLoop-fold-third-right", point(rawWidth * 2 / 3, 0), point(rawWidth * 2 / 3, totalLength)),
  ];
  for (let index = 1; index < LOOP_COUNT; index += 1) {
    const y = segmentLength * index;
    marks.push(lineMark("cutLine", `beltLoop-segment-cut-${index}`, point(0, y), point(rawWidth, y)));
  }
  return {
    name: "jeans belt-loop strip",
    onFold: false,
    edges: [
      { kind: "line", name: "stripStart", start: point(0, 0), end: point(rawWidth, 0) },
      { kind: "line", name: "stripOuter", start: point(rawWidth, 0), end: point(rawWidth, totalLength) },
      { kind: "line", name: "stripEnd", start: point(rawWidth, totalLength), end: point(0, totalLength) },
      { kind: "line", name: "stripInner", start: point(0, totalLength), end: point(0, 0) },
    ],
    marks,
  };
}

function closureMarks(side: "left" | "right", depth: number, extension: number): PatternMark[] {
  const center = point(-extension / 2, -depth / 2);
  if (side === "right") return [pointMark("button", "waistbandButton", center, "Btn")];
  const halfAxis = BUTTONHOLE_AXIS_HALF_LENGTH_CM;
  return [
    pointMark("buttonhole", "waistbandButtonholeCenter", center, "B.hole"),
    lineMark(
      "placementLine",
      "waistbandButtonholeOrientationOnly",
      point(center.x - halfAxis, center.y),
      point(center.x + halfAxis, center.y),
      "axis only",
    ),
  ];
}

export function buildJeansWaistband(
  input: JeansWaistbandInputs,
): JeansWaistbandPieces {
  const { options } = input;
  requireOptionRange(options.waistbandDepth, "waistbandDepth");
  requireOptionRange(options.waistbandExtension, "waistbandExtension");
  requireOptionRange(options.beltLoopWidth, "beltLoopWidth");
  requirePocketBelowWaist(input.coinPocket);
  requirePocketBelowWaist(input.backPocketLeft);
  requirePocketBelowWaist(input.backPocketRight);

  const leftLengths = halfLengths(input.frontLeft, input.pocketFacingLeft, input.backYokeLeft, "wearer-left");
  const rightLengths = halfLengths(input.frontRight, input.pocketFacingRight, input.backYokeRight, "wearer-right");
  const leftLoops = loopLocations(leftLengths, options.beltLoopWidth, "left");
  const rightLoops = loopLocations(rightLengths, options.beltLoopWidth, "right");
  const sideMarks = (lengths: HalfLengths): PatternMark[] => [
    pointMark("placementPoint", "centerBackWaistEnd", point(lengths.front + lengths.back, 0), "CB"),
  ];
  const leftLoopMarks = loopAnchorMarks(leftLoops, options.waistbandDepth, options.beltLoopWidth);
  const rightLoopMarks = loopAnchorMarks(rightLoops, options.waistbandDepth, options.beltLoopWidth);
  const outerLeft = halfPiece(
    "jeans outer waistband left",
    leftLengths,
    options.waistbandDepth,
    options.waistbandExtension,
    sideMarks(leftLengths),
    leftLoopMarks.concat(closureMarks("left", options.waistbandDepth, options.waistbandExtension)),
  );
  const outerRight = halfPiece(
    "jeans outer waistband right",
    rightLengths,
    options.waistbandDepth,
    options.waistbandExtension,
    sideMarks(rightLengths),
    rightLoopMarks.concat(closureMarks("right", options.waistbandDepth, options.waistbandExtension)),
  );
  const innerLeft = halfPiece(
    "jeans inner waistband left",
    leftLengths,
    options.waistbandDepth,
    options.waistbandExtension,
    sideMarks(leftLengths),
  );
  const innerRight = halfPiece(
    "jeans inner waistband right",
    rightLengths,
    options.waistbandDepth,
    options.waistbandExtension,
    sideMarks(rightLengths),
  );
  const beltLoopStrip = makeLoopStrip(
    options.beltLoopWidth,
    options.waistbandDepth + LOOP_END_FOLD_CM * 2,
  );

  return {
    outerLeft,
    outerRight,
    innerLeft,
    innerRight,
    beltLoopStrip,
    stitches: [
      {
        label: "Left front waist ↔ outer waistband",
        a: iface(edgeRef("waistbandOuterLeft", "frontWaistSeam")),
        b: iface(edgeRef("frontLeft", "waist"), edgeRef("pocketFacingLeft", "waistFacing")),
      },
      {
        label: "Left back waist ↔ outer waistband",
        a: iface(edgeRef("waistbandOuterLeft", "backWaistSeam")),
        b: iface(edgeRef("backYokeLeft", "waist")),
      },
      {
        label: "Right front waist ↔ outer waistband",
        a: iface(edgeRef("waistbandOuterRight", "frontWaistSeam")),
        b: iface(edgeRef("frontRight", "waist"), edgeRef("pocketFacingRight", "waistFacing")),
      },
      {
        label: "Right back waist ↔ outer waistband",
        a: iface(edgeRef("waistbandOuterRight", "backWaistSeam")),
        b: iface(edgeRef("backYokeRight", "waist")),
      },
      {
        label: "Left outer ↔ inner waistband top",
        a: iface(edgeRef("waistbandOuterLeft", "backTop"), edgeRef("waistbandOuterLeft", "frontTop"), edgeRef("waistbandOuterLeft", "closureExtensionTop")),
        b: iface(
          edgeRef("waistbandInnerLeft", "closureExtensionTop", true),
          edgeRef("waistbandInnerLeft", "frontTop", true),
          edgeRef("waistbandInnerLeft", "backTop", true),
        ),
      },
      {
        label: "Right outer ↔ inner waistband top",
        a: iface(edgeRef("waistbandOuterRight", "backTop"), edgeRef("waistbandOuterRight", "frontTop"), edgeRef("waistbandOuterRight", "closureExtensionTop")),
        b: iface(
          edgeRef("waistbandInnerRight", "closureExtensionTop", true),
          edgeRef("waistbandInnerRight", "frontTop", true),
          edgeRef("waistbandInnerRight", "backTop", true),
        ),
      },
      {
        label: "Left outer ↔ inner waistband closure end",
        a: iface(edgeRef("waistbandOuterLeft", "closureEnd")),
        b: iface(edgeRef("waistbandInnerLeft", "closureEnd", true)),
      },
      {
        label: "Right outer ↔ inner waistband closure end",
        a: iface(edgeRef("waistbandOuterRight", "closureEnd")),
        b: iface(edgeRef("waistbandInnerRight", "closureEnd", true)),
      },
      {
        label: "Center-back outer waistband join",
        a: iface(edgeRef("waistbandOuterLeft", "centerBackJoin")),
        b: iface(edgeRef("waistbandOuterRight", "centerBackJoin", true)),
      },
      {
        label: "Center-back inner waistband join",
        a: iface(edgeRef("waistbandInnerLeft", "centerBackJoin")),
        b: iface(edgeRef("waistbandInnerRight", "centerBackJoin", true)),
      },
    ],
  };
}
