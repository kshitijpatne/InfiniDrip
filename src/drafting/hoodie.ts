import { point, type CubicBezier } from "../geometry";
import { lineMark } from "./pattern-mark";
import type { HoodiePouchOptions, HoodieShapeOptions } from "./hoodie-contract";
import type { Note } from "../guidance/note";
import { bodice } from "./bodice";
import { block, type Block } from "./block";
import { derive, type Measurements } from "./measurements";
import { necklineEdge, type NecklineParams } from "./neckline";
import { crewneckBandPiece } from "./crewneck-components";
import { edgeEnd, edgeLength, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import { edgeRef, iface, interfaceLength, markRef, type Interface, type Stitch } from "./stitch";
import { sleeve } from "./sleeve";

export const HOODIE_ROLE_ORDER = [
  "front",
  "back",
  "sleeveLeft",
  "sleeveRight",
  "hoodOuterLeft",
  "hoodOuterRight",
  "hoodLiningLeft",
  "hoodLiningRight",
  "pocket",
  "cuffLeft",
  "cuffRight",
  "hemBand",
] as const;

export type HoodieHoodRole =
  | "hoodOuterLeft"
  | "hoodOuterRight"
  | "hoodLiningLeft"
  | "hoodLiningRight";

export interface HoodieDraftOptions extends HoodieShapeOptions, HoodiePouchOptions {
  readonly cuffLength: number;
  readonly cuffDepth: number;
  readonly hemBandLength: number;
  readonly hemBandDepth: number;
}

export interface HoodieHoodNeckMeasurement {
  readonly role: HoodieHoodRole;
  readonly hoodNecklineCm: number;
  readonly differenceFromGarmentCm: number;
}

export interface HoodieNecklineMeasurements {
  readonly garmentHalfNecklineCm: number;
  readonly hoodPieces: readonly HoodieHoodNeckMeasurement[];
}

const GARMENT_HALF_NECKLINE: Interface = iface(
  edgeRef("front", "neckline"),
  edgeRef("back", "neckline", true),
);

const HOOD_ROLES: readonly HoodieHoodRole[] = [
  "hoodOuterLeft",
  "hoodOuterRight",
  "hoodLiningLeft",
  "hoodLiningRight",
];

function hoodieNecklineParams(options: HoodieDraftOptions): NecklineParams {
  return {
    shape: "scoop",
    widthEase: options.hoodNecklineWidthEase,
    frontDrop: options.hoodNecklineFrontDrop,
  };
}

function reverseCurve(edge: Extract<Edge, { readonly kind: "curve" }>, name: string): Edge {
  return {
    kind: "curve",
    name,
    curve: {
      start: edge.curve.end,
      control1: edge.curve.control2,
      control2: edge.curve.control1,
      end: edge.curve.start,
    },
  };
}

const HOOD_NECK_EASE_MIN = 0;
const HOOD_NECK_EASE_MAX = 6;
const HOOD_NECK_EASE_TOLERANCE_CM = 0.01;
const HOOD_NECK_EASE_MEASUREMENT_ROUNDOFF_CM = 1e-12;
const HOOD_NECK_EASE_UPPER_ROUNDOFF_MARGIN_CM = 0.005;

interface HoodieNeckSeams {
  readonly front: Extract<Edge, { readonly kind: "curve" }>;
  readonly back: Extract<Edge, { readonly kind: "curve" }>;
}

type HoodieNeckSeamIssue = "range" | "unrepresentable";

interface HoodieNeckSeamResult {
  readonly seams: HoodieNeckSeams;
  readonly issue?: HoodieNeckSeamIssue;
}

function curveWithDeviationScale(curve: CubicBezier, scale: number): CubicBezier {
  const straightControl1 = point(
    curve.start.x + (curve.end.x - curve.start.x) / 3,
    curve.start.y + (curve.end.y - curve.start.y) / 3,
  );
  const straightControl2 = point(
    curve.start.x + 2 * (curve.end.x - curve.start.x) / 3,
    curve.start.y + 2 * (curve.end.y - curve.start.y) / 3,
  );
  return {
    ...curve,
    control1: point(
      curve.control1.x,
      straightControl1.y + (curve.control1.y - straightControl1.y) * scale,
    ),
    control2: point(
      curve.control2.x,
      straightControl2.y + (curve.control2.y - straightControl2.y) * scale,
    ),
  };
}

function seamsAtDeviationScale(seams: HoodieNeckSeams, scale: number): HoodieNeckSeams {
  return {
    front: { ...seams.front, curve: curveWithDeviationScale(seams.front.curve, scale) },
    back: { ...seams.back, curve: curveWithDeviationScale(seams.back.curve, scale) },
  };
}

function hoodieNeckSeamLength(seams: HoodieNeckSeams): number {
  return edgeLength(seams.front) + edgeLength(seams.back);
}

function adjustHoodieNeckSeams(
  frontNeckline: Extract<Edge, { readonly kind: "curve" }>,
  backNeckline: Extract<Edge, { readonly kind: "curve" }>,
  ease: number,
): HoodieNeckSeamResult {
  const seams: HoodieNeckSeams = {
    front: { kind: "curve", name: "necklineFront", curve: frontNeckline.curve },
    back: reverseCurve(backNeckline, "necklineBack") as Extract<Edge, { readonly kind: "curve" }>,
  };
  if (!Number.isFinite(ease) || ease < HOOD_NECK_EASE_MIN || ease > HOOD_NECK_EASE_MAX) {
    return { seams, issue: "range" };
  }
  if (ease === 0) return { seams };

  const baseLength = hoodieNeckSeamLength(seams);
  const targetLength = baseLength + ease - (ease === HOOD_NECK_EASE_MAX
    ? HOOD_NECK_EASE_UPPER_ROUNDOFF_MARGIN_CM
    : 0);
  if (!Number.isFinite(baseLength) || !Number.isFinite(targetLength)) {
    return { seams, issue: "unrepresentable" };
  }

  let lowerScale = 1;
  let upperScale = 64;

  for (let iteration = 0; iteration < 52; iteration += 1) {
    const middleScale = (lowerScale + upperScale) / 2;
    const middleLength = hoodieNeckSeamLength(seamsAtDeviationScale(seams, middleScale));
    if (Number.isFinite(middleLength) && middleLength < targetLength) {
      lowerScale = middleScale;
    } else {
      upperScale = middleScale;
    }
  }
  const adjusted = seamsAtDeviationScale(seams, (lowerScale + upperScale) / 2);
  const adjustedLength = hoodieNeckSeamLength(adjusted);
  if (!Number.isFinite(adjustedLength) || Math.abs(adjustedLength - targetLength) > HOOD_NECK_EASE_TOLERANCE_CM) {
    return { seams, issue: "unrepresentable" };
  }
  return { seams: adjusted };
}

function mirrorCurveAcrossCenterFront(curve: CubicBezier): CubicBezier {
  return {
    start: point(-curve.start.x, curve.start.y),
    control1: point(-curve.control1.x, curve.control1.y),
    control2: point(-curve.control2.x, curve.control2.y),
    end: point(-curve.end.x, curve.end.y),
  };
}

function hoodSidePiece(
  side: "left" | "right",
  layer: "outer" | "lining",
  neckSeams: HoodieNeckSeams,
  options: HoodieDraftOptions,
): Piece {
  const frontSeam = neckSeams.front;
  const backSeam = neckSeams.back;
  const centerFront = edgeStart(frontSeam);
  const centerBack = edgeEnd(backSeam);
  const crown = point(-options.hoodDepth, -options.hoodHeight);
  const centerBackSeam: Edge = {
    kind: "curve",
    name: "centerBack",
    curve: {
      start: centerBack,
      control1: point(-options.hoodDepth * 0.25, centerBack.y - options.hoodHeight * 0.18),
      control2: point(-options.hoodDepth * 0.78, -options.hoodHeight * 0.82),
      end: crown,
    },
  };
  const faceOpening: Edge = {
    kind: "curve",
    name: "faceOpening",
    curve: {
      start: crown,
      control1: point(-options.hoodDepth * 0.78, -options.hoodHeight * 0.72),
      control2: point(-options.hoodDepth * 0.22, centerFront.y - options.hoodHeight * 0.18),
      end: centerFront,
    },
  };
  const draftedEdges = [frontSeam, backSeam, centerBackSeam, faceOpening];
  const edges = side === "left"
    ? draftedEdges
    : draftedEdges.map((edge) => ({
        ...edge,
        curve: mirrorCurveAcrossCenterFront(edge.curve),
      }));
  const sideName = side === "left" ? "left" : "right";
  return {
    name: `hoodie ${sideName} ${layer} hood side`,
    onFold: false,
    edges,
  };
}

interface HoodiePouchGeometry {
  readonly piece: Piece;
  readonly front: Piece;
}

/** Derive the on-fold half pouch from the live front hem attachment seam. */
function hoodiePouchGeometry(
  front: Piece,
  options: HoodiePouchOptions,
): HoodiePouchGeometry | undefined {
  if (options.pocketWidth === 0 || options.pocketHeight === 0) return undefined;

  const hem = pieceEdge(front, "hem");
  const hemY = (edgeStart(hem).y + edgeEnd(hem).y) / 2;
  const bottomY = hemY - options.pocketHemClearance;
  const topY = bottomY - options.pocketHeight;
  const halfWidth = options.pocketWidth / 2;
  const foldTop = point(0, topY);
  const foldBottom = point(0, bottomY);
  const outerTop = point(halfWidth, topY);
  const openingAngleRadians = options.pocketOpeningAngle * Math.PI / 180;
  const openingBottom = point(
    halfWidth - options.pocketOpeningLength * Math.cos(openingAngleRadians),
    topY + options.pocketOpeningLength * Math.sin(openingAngleRadians),
  );
  const outerBottom = point(halfWidth, bottomY);
  const piece: Piece = {
    name: "Hoodie kangaroo pouch",
    onFold: true,
    edges: [
      { kind: "line", name: "top", start: foldTop, end: outerTop },
      { kind: "line", name: "opening", start: outerTop, end: openingBottom },
      { kind: "line", name: "side", start: openingBottom, end: outerBottom },
      { kind: "line", name: "bottom", start: outerBottom, end: foldBottom },
      { kind: "line", name: "fold", start: foldBottom, end: foldTop },
    ],
    marks: [
      lineMark("placementLine", "sideOpening", outerTop, openingBottom, "LEAVE OPEN", "instruction"),
    ],
  };
  const placementMarks = [
    ...front.marks!,
    lineMark("placementLine", "kangarooPouchTop", foldTop, outerTop, "POUCH TOP"),
    lineMark("placementLine", "kangarooPouchOpening", outerTop, openingBottom, "SIDE OPENING", "instruction"),
    lineMark("placementLine", "kangarooPouchSide", openingBottom, outerBottom, "POUCH SIDE"),
    lineMark("placementLine", "kangarooPouchBottom", outerBottom, foldBottom, "POUCH BOTTOM"),
  ];
  return { piece, front: { ...front, marks: placementMarks } };
}

const HOODIE_POUCH_STITCHES: readonly Stitch[] = [
  {
    label: "Hoodie kangaroo pouch top ↔ front placement",
    a: iface(edgeRef("pocket", "top")),
    b: iface(markRef("front", "kangarooPouchTop", "left")),
  },
  {
    label: "Hoodie kangaroo pouch side ↔ front placement",
    a: iface(edgeRef("pocket", "side")),
    b: iface(markRef("front", "kangarooPouchSide", "left")),
  },
  {
    label: "Hoodie kangaroo pouch bottom ↔ front placement",
    a: iface(edgeRef("pocket", "bottom")),
    b: iface(markRef("front", "kangarooPouchBottom", "left")),
  },
];

function bandClosureStitch(role: "cuffLeft" | "cuffRight" | "hemBand"): Stitch {
  return {
    label: `Hoodie band end closure: ${role}`,
    a: iface(edgeRef(role, "sideRight")),
    b: iface(edgeRef(role, "sideLeft")),
  };
}

function sleeveUnderarmStitch(role: "sleeveLeft" | "sleeveRight"): Stitch {
  return {
    label: `Hoodie sleeve underarm: ${role}`,
    a: iface(edgeRef(role, "sideRight")),
    b: iface(edgeRef(role, "sideLeft")),
  };
}

function sleeveCapStitch(role: "sleeveLeft" | "sleeveRight"): Stitch {
  return {
    label: `Hoodie set-in sleeve cap: ${role}`,
    a: iface(edgeRef(role, "capLeft"), edgeRef(role, "capRight")),
    b: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
    ease: { lo: -1, hi: 4 },
  };
}

function hoodNecklineStitch(role: "hoodOuterLeft" | "hoodOuterRight"): Stitch {
  return {
    label: `Hoodie hood-to-neckline attachment: ${role}`,
    a: iface(edgeRef(role, "necklineFront"), edgeRef(role, "necklineBack")),
    b: GARMENT_HALF_NECKLINE,
    // Cubic length is sampled in opposite traversal directions on the mirrored
    // interface; this sub-nanometer slack covers only floating-point roundoff.
    ease: { lo: HOOD_NECK_EASE_MIN - HOOD_NECK_EASE_MEASUREMENT_ROUNDOFF_CM, hi: HOOD_NECK_EASE_MAX },
  };
}

function hoodiePiece(result: ReturnType<typeof bodice>, role: "front" | "back"): Piece {
  return result.pieces[role]!;
}

function sleevePiece(result: ReturnType<typeof sleeve>): Piece {
  return result.pieces.sleeve!;
}

/**
 * Draft the unregistered Hoodie block from live bodice/armhole geometry. The
 * garment neckline is widened equally front/back; only the front is lowered.
 * Hoodie-specific controls remain required inputs so this geometry layer does
 * not publish recipe defaults or silently replace missing/invalid values.
 */
export function draftHoodie(
  measurements: Measurements,
  options: HoodieDraftOptions,
): Block {
  const necklineParams = hoodieNecklineParams(options);
  const front: Piece = {
    ...hoodiePiece(bodice(measurements, { position: "front", necklineParams }), "front"),
    marks: [],
  };
  const back = hoodiePiece(bodice(measurements, { position: "back", necklineParams }), "back");
  const body = block({ front, back }, []);
  const neckSeams = adjustHoodieNeckSeams(
    pieceEdge(front, "neckline") as Extract<Edge, { readonly kind: "curve" }>,
    pieceEdge(back, "neckline") as Extract<Edge, { readonly kind: "curve" }>,
    options.hoodNeckEase,
  ).seams;
  const targetArmhole = interfaceLength(
    body,
    iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
  );
  const sleeveTemplate = sleevePiece(sleeve(measurements, { targetArmhole }));
  const sleeveLeft = { ...sleeveTemplate, name: "left hoodie set-in sleeve" };
  const sleeveRight = { ...sleeveTemplate, name: "right hoodie set-in sleeve" };

  const hoodOuterLeft = hoodSidePiece("left", "outer", neckSeams, options);
  const hoodOuterRight = hoodSidePiece("right", "outer", neckSeams, options);
  const hoodLiningLeft = hoodSidePiece("left", "lining", neckSeams, options);
  const hoodLiningRight = hoodSidePiece("right", "lining", neckSeams, options);
  const cuffLeft = {
    ...crewneckBandPiece("cuffLeft", options.cuffLength, options.cuffDepth),
    name: "left hoodie rib cuff",
  };
  const cuffRight = {
    ...crewneckBandPiece("cuffRight", options.cuffLength, options.cuffDepth),
    name: "right hoodie rib cuff",
  };
  const hemBand = {
    ...crewneckBandPiece("hemBand", options.hemBandLength, options.hemBandDepth),
    name: "hoodie rib hem band",
  };

  const pouch = hoodiePouchGeometry(front, options);
  const frontWithPouchMarks = pouch?.front ?? front;

  const roles = {
    front: frontWithPouchMarks,
    back,
    sleeveLeft,
    sleeveRight,
    hoodOuterLeft,
    hoodOuterRight,
    hoodLiningLeft,
    hoodLiningRight,
    ...(pouch === undefined ? {} : { pocket: pouch.piece }),
    cuffLeft,
    cuffRight,
    hemBand,
  };
  const stitches: readonly Stitch[] = [
    {
      label: "Hoodie shoulder seams",
      a: iface(edgeRef("front", "shoulder")),
      b: iface(edgeRef("back", "shoulder")),
    },
    {
      label: "Hoodie side seams",
      a: iface(edgeRef("front", "side")),
      b: iface(edgeRef("back", "side")),
    },
    sleeveUnderarmStitch("sleeveLeft"),
    sleeveUnderarmStitch("sleeveRight"),
    sleeveCapStitch("sleeveLeft"),
    sleeveCapStitch("sleeveRight"),
    hoodNecklineStitch("hoodOuterLeft"),
    hoodNecklineStitch("hoodOuterRight"),
    bandClosureStitch("cuffLeft"),
    bandClosureStitch("cuffRight"),
    bandClosureStitch("hemBand"),
    ...(pouch === undefined ? [] : HOODIE_POUCH_STITCHES),
  ];
  return block(roles, stitches);
}

/** Walk the garment's real half-neckline and every outer/lining hood seam. */
export function hoodieNecklineMeasurements(drafted: Block): HoodieNecklineMeasurements {
  const garmentHalfNecklineCm = interfaceLength(drafted, GARMENT_HALF_NECKLINE);
  const hoodPieces = HOOD_ROLES.map((role) => {
    const hoodInterface = iface(edgeRef(role, "necklineFront"), edgeRef(role, "necklineBack"));
    const hoodNecklineCm = interfaceLength(drafted, hoodInterface);
    return {
      role,
      hoodNecklineCm,
      differenceFromGarmentCm: hoodNecklineCm - garmentHalfNecklineCm,
    };
  });
  return { garmentHalfNecklineCm, hoodPieces };
}

/** Preserve the existing warn-never-clamp neckline checks under Hoodie keys. */
export function hoodieNecklineNotes(
  measurements: Measurements,
  options: Pick<HoodieDraftOptions, "hoodNecklineWidthEase" | "hoodNecklineFrontDrop" | "hoodNeckEase">,
): readonly Note[] {
  const derived = derive(measurements);
  const params: NecklineParams = {
    shape: "scoop",
    widthEase: options.hoodNecklineWidthEase,
    frontDrop: options.hoodNecklineFrontDrop,
  };
  const front = necklineEdge(
    "front",
    derived.neckWidthHalf,
    derived.frontNeckDepth,
    derived.shoulderHalf,
    measurements.armholeDepth,
    params,
  );
  const back = necklineEdge(
    "back",
    derived.neckWidthHalf,
    derived.backNeckDepth,
    derived.shoulderHalf,
    measurements.armholeDepth,
    params,
  );
  const notes: Note[] = [...front.notes, ...back.notes].map((note) => ({
    ...note,
    field: note.field === "neckWidthEase" ? "hoodNecklineWidthEase" : "hoodNecklineFrontDrop",
  }));
  const seamResult = adjustHoodieNeckSeams(
    front.edge as Extract<Edge, { readonly kind: "curve" }>,
    back.edge as Extract<Edge, { readonly kind: "curve" }>,
    options.hoodNeckEase,
  );
  if (seamResult.issue === "range") {
    const value = Number.isFinite(options.hoodNeckEase) ? `${options.hoodNeckEase} cm` : String(options.hoodNeckEase);
    notes.push({
      field: "hoodNeckEase",
      level: "warn",
      text: `Hood-to-neckline ease (${value}) is outside the supported ${HOOD_NECK_EASE_MIN}–${HOOD_NECK_EASE_MAX} cm range — adjust it into that range.`,
    });
  } else if (seamResult.issue === "unrepresentable") {
    notes.push({
      field: "hoodNeckEase",
      level: "warn",
      text: `Hood-to-neckline ease of ${options.hoodNeckEase} cm cannot be represented by a finite neck seam — reduce it within ${HOOD_NECK_EASE_MIN}–${HOOD_NECK_EASE_MAX} cm.`,
    });
  }
  return notes;
}
