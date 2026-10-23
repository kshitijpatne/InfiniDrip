import { point } from "../geometry";
import type { CubicBezier, Point } from "../geometry";
import { block } from "./block";
import type { Block } from "./block";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import type { Edge, Piece } from "./piece";
import { lineMark } from "./pattern-mark";
import { edgeRef, iface } from "./stitch";
import type { Stitch } from "./stitch";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import type { LowerBodyUpperMetrics } from "./lower-body-upper";
import type { Measurements } from "./measurements";
import {
  DEFAULT_SHORTS_GEOMETRY_OPTIONS,
  SHORTS_LEG_ROLE_IDS,
} from "./shorts-contract";
import type { ShortsGeometryOptions } from "./shorts-contract";

export type ShortsMeasurements = Pick<
  Measurements,
  "waist" | "hip" | "hipDepth" | "crotchDepth" | "thigh" | "ease"
>;

export interface ShortsDraftMetrics extends LowerBodyUpperMetrics {
  readonly shortsInseam: number;
  readonly hemOpening: number;
  readonly hemY: number;
}

/** Preserve finite out-of-range values so later guidance can show them as entered. */
export function resolveShortsGeometryOptions(
  raw: Partial<ShortsGeometryOptions> = {},
): ShortsGeometryOptions {
  return {
    shortsInseam: raw.shortsInseam ?? DEFAULT_SHORTS_GEOMETRY_OPTIONS.shortsInseam,
    hemOpening: raw.hemOpening ?? DEFAULT_SHORTS_GEOMETRY_OPTIONS.hemOpening,
    frontRiseEase: raw.frontRiseEase ?? DEFAULT_SHORTS_GEOMETRY_OPTIONS.frontRiseEase,
    backRiseEase: raw.backRiseEase ?? DEFAULT_SHORTS_GEOMETRY_OPTIONS.backRiseEase,
    waistbandDepth: raw.waistbandDepth ?? DEFAULT_SHORTS_GEOMETRY_OPTIONS.waistbandDepth,
  };
}

/** shortsInseam is the vertical crotch-to-hem station, not sewn seam length. */
export function shortsMetrics(
  measurements: ShortsMeasurements,
  rawOptions: Partial<ShortsGeometryOptions> = {},
): ShortsDraftMetrics {
  const options = resolveShortsGeometryOptions(rawOptions);
  const upper = lowerBodyUpperMetrics(measurements, options, measurements.thigh);
  return {
    ...upper,
    shortsInseam: options.shortsInseam,
    hemOpening: options.hemOpening,
    hemY: upper.backCrotchY + options.shortsInseam,
  };
}

const mirrorPoint = (value: Point): Point => point(-value.x, value.y);

function midpoint(a: Point, b: Point): Point {
  return point((a.x + b.x) / 2, (a.y + b.y) / 2);
}

function withPressCrease(piece: Piece, label: string): Piece {
  const sideThigh = edgeStart(pieceEdge(piece, "sideThighToHem"));
  const innerThigh = edgeEnd(pieceEdge(piece, "inseamThighToHem"));
  const sideHem = edgeEnd(pieceEdge(piece, "sideThighToHem"));
  const innerHem = edgeStart(pieceEdge(piece, "inseamThighToHem"));
  return {
    ...piece,
    marks: [
      lineMark(
        "placementLine",
        "pressCrease",
        midpoint(sideThigh, innerThigh),
        midpoint(sideHem, innerHem),
        label,
      ),
    ],
  };
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
  };
}

function legPiece(
  measurements: ShortsMeasurements,
  metrics: ShortsDraftMetrics,
  position: "front" | "back",
  name: string,
): Piece {
  // Retain the current trouser seat/crotch/upper-thigh coordinate seeds for this digital derivative.
  // These inherited offsets are not source-certified fit rules or physical-fit evidence.
  const waistQuarter = metrics.finishedWaist / 4;
  const seatQuarter = metrics.finishedSeat / 4;
  const thighQuarter = metrics.finishedThigh / 4;
  const crotchX = seatQuarter * 0.32;
  const innerThighX = crotchX - 1.5;
  const innerHemX = crotchX - 2;
  const sideWaist = point(waistQuarter, 0);
  const sideHip = point(seatQuarter, measurements.hipDepth);
  const sideThigh = point(innerThighX + thighQuarter, metrics.thighY);
  const innerThigh = point(innerThighX, metrics.thighY);
  // Each of four leg panels contributes one quarter of the finished opening.
  const sideHem = point(innerHemX + metrics.hemOpening / 4, metrics.hemY);
  const innerHem = point(innerHemX, metrics.hemY);
  const crotch = point(crotchX, metrics.backCrotchY);
  const centerY = position === "front" ? metrics.frontCrotchY : metrics.backCrotchY;
  const crotchCurve: CubicBezier = position === "front"
    ? {
        start: crotch,
        control1: point(crotch.x - 2.2, crotch.y - 0.6),
        control2: point(crotch.x - 2.6, centerY + 0.8),
        end: point(0, centerY),
      }
    : {
        start: crotch,
        control1: point(crotch.x + 2.8, crotch.y + 1.2),
        control2: point(crotch.x + 3.7, centerY - 1.6),
        end: point(0, centerY),
      };
  const centerName = position === "front" ? "centerFront" : "centerBack";
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: point(0, 0), end: sideWaist },
    { kind: "line", name: "sideUpper", start: sideWaist, end: sideHip },
    { kind: "line", name: "sideHipToThigh", start: sideHip, end: sideThigh },
    { kind: "line", name: "sideThighToHem", start: sideThigh, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: innerHem },
    { kind: "line", name: "inseamThighToHem", start: innerHem, end: innerThigh },
    { kind: "line", name: "innerThighToCrotch", start: innerThigh, end: crotch },
    { kind: "curve", name: "crotch", curve: crotchCurve },
    { kind: "line", name: centerName, start: point(0, centerY), end: point(0, 0) },
  ];
  return { name, onFold: false, edges };
}

const sideInterface = (role: string) => iface(
  edgeRef(role, "sideUpper"),
  edgeRef(role, "sideHipToThigh"),
  edgeRef(role, "sideThighToHem"),
);

const inseamInterface = (role: string) => iface(
  edgeRef(role, "inseamThighToHem"),
  edgeRef(role, "innerThighToCrotch"),
);

/** Draft the four base panels; S1097 adds the other five component roles. */
export function draftShortsLegs(
  measurements: ShortsMeasurements,
  rawOptions: Partial<ShortsGeometryOptions> = {},
): Block {
  const metrics = shortsMetrics(measurements, rawOptions);
  const front = legPiece(measurements, metrics, "front", "shorts front left");
  const back = legPiece(measurements, metrics, "back", "shorts back left");
  const frontRight = mirrorPiece(front, "shorts front right");
  const backRight = mirrorPiece(back, "shorts back right");
  const frontLeftWithCrease = withPressCrease(front, "front press crease");
  const frontRightWithCrease = withPressCrease(frontRight, "front press crease");
  const backLeftWithCrease = withPressCrease(back, "back press crease");
  const backRightWithCrease = withPressCrease(backRight, "back press crease");
  const roles = {
    frontLeft: frontLeftWithCrease,
    frontRight: frontRightWithCrease,
    backLeft: backLeftWithCrease,
    backRight: backRightWithCrease,
  };
  const stitches: readonly Stitch[] = [
    { label: "Left side seam (front ↔ back)", a: sideInterface("frontLeft"), b: sideInterface("backLeft") },
    { label: "Right side seam (front ↔ back)", a: sideInterface("frontRight"), b: sideInterface("backRight") },
    { label: "Left inseam (front ↔ back)", a: inseamInterface("frontLeft"), b: inseamInterface("backLeft") },
    { label: "Right inseam (front ↔ back)", a: inseamInterface("frontRight"), b: inseamInterface("backRight") },
    { label: "Center-back seam (left ↔ right)", a: iface(edgeRef("backLeft", "centerBack")), b: iface(edgeRef("backRight", "centerBack")) },
  ];
  return block(roles, stitches);
}

export const SHORTS_BASE_ROLE_IDS = SHORTS_LEG_ROLE_IDS;
