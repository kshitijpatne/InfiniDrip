import { point, type CubicBezier } from "../geometry";
import type { Note } from "../guidance/note";
import { bodice } from "./bodice";
import { block, type Block } from "./block";
import { derive, type Measurements } from "./measurements";
import { necklineEdge, type NecklineParams } from "./neckline";
import { crewneckBandPiece } from "./crewneck-components";
import { edgeEnd, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import { edgeRef, iface, interfaceLength, type Interface, type Stitch } from "./stitch";
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
  "cuffLeft",
  "cuffRight",
  "hemBand",
] as const;

export type HoodieHoodRole =
  | "hoodOuterLeft"
  | "hoodOuterRight"
  | "hoodLiningLeft"
  | "hoodLiningRight";

export interface HoodieDraftOptions {
  readonly hoodNecklineWidthEase: number;
  readonly hoodNecklineFrontDrop: number;
  readonly hoodHeight: number;
  readonly hoodDepth: number;
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
  front: Piece,
  back: Piece,
  options: HoodieDraftOptions,
): Piece {
  const frontNeckline = pieceEdge(front, "neckline") as Extract<Edge, { readonly kind: "curve" }>;
  const backNeckline = pieceEdge(back, "neckline") as Extract<Edge, { readonly kind: "curve" }>;
  const frontSeam = {
    kind: "curve" as const,
    name: "necklineFront",
    curve: frontNeckline.curve,
  };
  const backSeam = reverseCurve(backNeckline, "necklineBack") as Extract<Edge, { readonly kind: "curve" }>;
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
  const front = hoodiePiece(bodice(measurements, { position: "front", necklineParams }), "front");
  const back = hoodiePiece(bodice(measurements, { position: "back", necklineParams }), "back");
  const body = block({ front, back }, []);
  const targetArmhole = interfaceLength(
    body,
    iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
  );
  const sleeveTemplate = sleevePiece(sleeve(measurements, { targetArmhole }));
  const sleeveLeft = { ...sleeveTemplate, name: "left hoodie set-in sleeve" };
  const sleeveRight = { ...sleeveTemplate, name: "right hoodie set-in sleeve" };

  const hoodOuterLeft = hoodSidePiece("left", "outer", front, back, options);
  const hoodOuterRight = hoodSidePiece("right", "outer", front, back, options);
  const hoodLiningLeft = hoodSidePiece("left", "lining", front, back, options);
  const hoodLiningRight = hoodSidePiece("right", "lining", front, back, options);
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

  const roles = {
    front,
    back,
    sleeveLeft,
    sleeveRight,
    hoodOuterLeft,
    hoodOuterRight,
    hoodLiningLeft,
    hoodLiningRight,
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
  options: Pick<HoodieDraftOptions, "hoodNecklineWidthEase" | "hoodNecklineFrontDrop">,
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
  return [...front.notes, ...back.notes].map((note) => ({
    ...note,
    field: note.field === "neckWidthEase" ? "hoodNecklineWidthEase" : "hoodNecklineFrontDrop",
  }));
}
