// The reusable lower-body leg block for Epic 3.
//
// This slice owns the four leg panels only. Waistband, fly, and pocket
// components arrive in later slices so each seam boundary is introduced and
// verified separately. Coordinates are centimetres, x increases toward the
// side seam, and y increases down from the body-panel waist reference.
//
// The curve is deliberately transparent digital drafting geometry: front and
// back crotch curves are separate cubic Béziers, while the inner leg and side
// profile are shared so the sewn inseams and side seams match exactly. It is a
// coherent approximation, not a universal fit formula.

import { point } from "../geometry";
import { Block, block } from "./block";
import { Edge, Piece } from "./piece";
import { lineMark, pointMark, PatternMark } from "./pattern-mark";
import { edgeRef, iface, Stitch } from "./stitch";
import { DEFAULT_TROUSER_OPTIONS, resolveTrouserOptions, TrouserOptions } from "./trouser-contract";
import { Measurements } from "./measurements";

export interface TrouserDraftMetrics {
  readonly finishedWaist: number;
  readonly finishedSeat: number;
  readonly finishedThigh: number;
  readonly finishedKnee: number;
  readonly frontRise: number;
  readonly backRise: number;
  readonly frontCrotchY: number;
  readonly backCrotchY: number;
  readonly hemY: number;
  readonly kneeY: number;
  readonly thighY: number;
}

/** One source-of-truth conversion from the contract to drafted stations. */
export function trouserMetrics(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): TrouserDraftMetrics {
  const options = resolveTrouserOptions(rawOptions);
  const frontRise = m.crotchDepth + options.frontRiseEase;
  const backRise = m.crotchDepth + options.backRiseEase;
  const frontCrotchY = frontRise - options.waistbandDepth;
  const backCrotchY = backRise - options.waistbandDepth;
  // The common inner crotch station keeps the front/back inseams sewable while
  // the center-front/center-back endpoints still expose separate rise values.
  const hemY = backCrotchY + m.inseam;
  return {
    finishedWaist: m.waist + m.ease,
    finishedSeat: m.hip + m.ease,
    finishedThigh: m.thigh + options.thighEase,
    finishedKnee: m.knee + options.kneeEase,
    frontRise,
    backRise,
    frontCrotchY,
    backCrotchY,
    hemY,
    kneeY: backCrotchY + m.inseam * 0.52,
    thighY: backCrotchY + 2.5,
  };
}

const profilePoints = (
  m: Measurements, metrics: TrouserDraftMetrics, options: TrouserOptions
) => {
  const waistQ = metrics.finishedWaist / 4;
  const seatQ = metrics.finishedSeat / 4;
  const thighQ = metrics.finishedThigh / 4;
  const kneeQ = metrics.finishedKnee / 4;
  const openingQ = options.legOpening / 4;
  const crotchX = seatQ * 0.32;
  const innerThighX = crotchX - 1.5;
  const innerKneeX = crotchX - 1.8;
  const innerHemX = crotchX - 2;
  return {
    waistQ,
    seatQ,
    sideWaist: point(waistQ, 0),
    sideHip: point(seatQ, m.hipDepth),
    sideThigh: point(innerThighX + thighQ, metrics.thighY),
    sideKnee: point(innerKneeX + kneeQ, metrics.kneeY),
    sideHem: point(innerHemX + openingQ, metrics.hemY),
    crotch: point(crotchX, metrics.backCrotchY),
    innerThigh: point(innerThighX, metrics.thighY),
    innerKnee: point(innerKneeX, metrics.kneeY),
    innerHem: point(innerHemX, metrics.hemY),
  };
};

function legMarks(
  waistQ: number, sideHemX: number, metrics: TrouserDraftMetrics, name: string
): PatternMark[] {
  const creaseX = (waistQ + sideHemX) / 2;
  return [
    lineMark("placementLine", "creaseLine", point(creaseX, 0), point(creaseX, metrics.hemY), "front crease"),
    pointMark("placementPoint", "hipLine", point(creaseX, metrics.thighY - 2.5), "hip balance"),
    pointMark("placementPoint", "kneeLine", point(creaseX, metrics.kneeY), "knee"),
    pointMark("placementPoint", "grainTop", point(creaseX, 4), `${name} grain`),
  ];
}

function legPiece(
  m: Measurements, metrics: TrouserDraftMetrics, options: TrouserOptions,
  position: "front" | "back", name: string
): Piece {
  const p = profilePoints(m, metrics, options);
  const centerY = position === "front" ? metrics.frontCrotchY : metrics.backCrotchY;
  const centerName = position === "front" ? "centerFront" : "centerBack";
  const crotch: Edge = position === "front"
    ? {
        kind: "curve", name: "crotch", curve: {
          start: p.crotch,
          control1: point(p.crotch.x - 2.2, p.crotch.y - 0.6),
          control2: point(p.crotch.x - 2.6, centerY + 0.8),
          end: point(0, centerY),
        },
      }
    : {
        kind: "curve", name: "crotch", curve: {
          start: p.crotch,
          control1: point(p.crotch.x + 2.8, p.crotch.y + 1.2),
          control2: point(p.crotch.x + 3.7, centerY - 1.6),
          end: point(0, centerY),
        },
      };
  const sideThigh = p.sideThigh;
  const sideKnee = p.sideKnee;
  const sideHem = p.sideHem;
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: point(0, 0), end: p.sideWaist },
    { kind: "line", name: "sideUpper", start: p.sideWaist, end: p.sideHip },
    { kind: "line", name: "sideHipToThigh", start: p.sideHip, end: sideThigh },
    { kind: "line", name: "sideThighToKnee", start: sideThigh, end: sideKnee },
    { kind: "line", name: "sideKneeToHem", start: sideKnee, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: p.innerHem },
    { kind: "line", name: "inseamLower", start: p.innerHem, end: p.innerKnee },
    { kind: "line", name: "inseamUpper", start: p.innerKnee, end: p.innerThigh },
    { kind: "line", name: "innerThighToCrotch", start: p.innerThigh, end: p.crotch },
    crotch,
    { kind: "line", name: centerName, start: point(0, centerY), end: point(0, 0) },
  ];
  return {
    name,
    onFold: false,
    edges,
    marks: legMarks(metrics.finishedWaist / 4, sideHem.x, metrics, name),
  };
}

function mirrorPoint(p: { readonly x: number; readonly y: number }) {
  return point(-p.x, p.y);
}

function mirrorPiece(piece: Piece, name: string): Piece {
  return {
    ...piece,
    name,
    edges: piece.edges.map((edge): Edge => edge.kind === "line"
      ? { ...edge, start: mirrorPoint(edge.start), end: mirrorPoint(edge.end) }
      : { ...edge, curve: {
          ...edge.curve,
          start: mirrorPoint(edge.curve.start),
          control1: mirrorPoint(edge.curve.control1),
          control2: mirrorPoint(edge.curve.control2),
          end: mirrorPoint(edge.curve.end),
        } }),
    marks: piece.marks?.map((mark): PatternMark => "at" in mark
      ? { ...mark, at: mirrorPoint(mark.at) }
      : { ...mark, start: mirrorPoint(mark.start), end: mirrorPoint(mark.end) }),
  };
}

const sideInterface = (role: string) => iface(
  edgeRef(role, "sideUpper"),
  edgeRef(role, "sideHipToThigh"),
  edgeRef(role, "sideThighToKnee"),
  edgeRef(role, "sideKneeToHem"),
);

const inseamInterface = (role: string) => iface(
  edgeRef(role, "inseamLower"),
  edgeRef(role, "inseamUpper"),
  edgeRef(role, "innerThighToCrotch"),
);

/** The four-panel leg block used by later waistband/fly/pocket assembly. */
export function draftTrouserLegs(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Block {
  const options = resolveTrouserOptions(rawOptions);
  const metrics = trouserMetrics(m, options);
  const front = legPiece(m, metrics, options, "front", "trouser front left");
  const back = legPiece(m, metrics, options, "back", "trouser back left");
  const frontRight = mirrorPiece(front, "trouser front right");
  const backRight = mirrorPiece(back, "trouser back right");
  const roles = { frontLeft: front, frontRight, backLeft: back, backRight };
  const stitches: readonly Stitch[] = [
    { label: "Left side seam (front ↔ back)", a: sideInterface("frontLeft"), b: sideInterface("backLeft") },
    { label: "Right side seam (front ↔ back)", a: sideInterface("frontRight"), b: sideInterface("backRight") },
    { label: "Left inseam (front ↔ back)", a: inseamInterface("frontLeft"), b: inseamInterface("backLeft") },
    { label: "Right inseam (front ↔ back)", a: inseamInterface("frontRight"), b: inseamInterface("backRight") },
    { label: "Center-back seam (left ↔ right)", a: iface(edgeRef("backLeft", "centerBack")), b: iface(edgeRef("backRight", "centerBack")) },
  ];
  return block(roles, stitches);
}

/** Public defaults make the contract easy to inspect in tests and later
 * components without making callers reconstruct the option table. */
export const TROUSER_LEG_DEFAULT_OPTIONS = DEFAULT_TROUSER_OPTIONS;
