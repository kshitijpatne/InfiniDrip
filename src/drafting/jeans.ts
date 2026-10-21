import { point } from "../geometry";
import { block, type Block } from "./block";
import type { Edge, Piece } from "./piece";
import { edgeRef, iface, type Stitch } from "./stitch";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import type { LowerBodyUpperMetrics } from "./lower-body-upper";
import type { Measurements } from "./measurements";
import {
  resolveJeansOptions,
  type JeansOptions,
} from "./jeans-contract";

export interface JeansDraftMetrics extends LowerBodyUpperMetrics {
  readonly finishedKnee: number;
  readonly hemY: number;
  /** Internal leg-shape station only; not an anatomical mapping or mark. */
  readonly kneeY: number;
}

/** One source-of-truth conversion from Jeans contract values to leg stations. */
export function jeansMetrics(
  measurements: Measurements,
  rawOptions: Partial<JeansOptions> = {},
): JeansDraftMetrics {
  const options = resolveJeansOptions(rawOptions);
  const upper = lowerBodyUpperMetrics(
    measurements,
    options,
    measurements.thigh + options.thighEase,
  );
  // Keep the existing lower-body shape station for digital transition math;
  // this position is not emitted as an anatomical knee mark.
  return {
    ...upper,
    finishedKnee: measurements.knee + options.kneeEase,
    hemY: upper.backCrotchY + measurements.inseam,
    kneeY: upper.backCrotchY + measurements.inseam * 0.52,
  };
}

function mirrorPoint(value: { readonly x: number; readonly y: number }) {
  return point(-value.x, value.y);
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

interface LegProfile {
  readonly sideWaist: ReturnType<typeof point>;
  readonly sideHip: ReturnType<typeof point>;
  readonly sideThigh: ReturnType<typeof point>;
  readonly sideKnee: ReturnType<typeof point>;
  readonly sideHem: ReturnType<typeof point>;
  readonly crotch: ReturnType<typeof point>;
  readonly innerThigh: ReturnType<typeof point>;
  readonly innerKnee: ReturnType<typeof point>;
  readonly innerHem: ReturnType<typeof point>;
}

function legProfile(
  measurements: Measurements,
  metrics: JeansDraftMetrics,
  options: JeansOptions,
): LegProfile {
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
    sideWaist: point(waistQ, 0),
    sideHip: point(seatQ, measurements.hipDepth),
    sideThigh: point(innerThighX + thighQ, metrics.thighY),
    sideKnee: point(innerKneeX + kneeQ, metrics.kneeY),
    sideHem: point(innerHemX + openingQ, metrics.hemY),
    crotch: point(crotchX, metrics.backCrotchY),
    innerThigh: point(innerThighX, metrics.thighY),
    innerKnee: point(innerKneeX, metrics.kneeY),
    innerHem: point(innerHemX, metrics.hemY),
  };
}

function legPiece(
  measurements: Measurements,
  metrics: JeansDraftMetrics,
  options: JeansOptions,
  position: "front" | "back",
  name: string,
): Piece {
  const profile = legProfile(measurements, metrics, options);
  const centerY = position === "front" ? metrics.frontCrotchY : metrics.backCrotchY;
  const centerName = position === "front" ? "centerFront" : "centerBack";
  const crotch: Edge = position === "front"
    ? {
      kind: "curve",
      name: "crotch",
      curve: {
        start: profile.crotch,
        control1: point(profile.crotch.x - 2.2, profile.crotch.y - 0.6),
        control2: point(profile.crotch.x - 2.6, centerY + 0.8),
        end: point(0, centerY),
      },
    }
    : {
      kind: "curve",
      name: "crotch",
      curve: {
        start: profile.crotch,
        control1: point(profile.crotch.x + 2.8, profile.crotch.y + 1.2),
        control2: point(profile.crotch.x + 3.7, centerY - 1.6),
        end: point(0, centerY),
      },
    };
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: point(0, 0), end: profile.sideWaist },
    { kind: "line", name: "sideUpper", start: profile.sideWaist, end: profile.sideHip },
    { kind: "line", name: "sideHipToThigh", start: profile.sideHip, end: profile.sideThigh },
    { kind: "line", name: "sideThighToKnee", start: profile.sideThigh, end: profile.sideKnee },
    { kind: "line", name: "sideKneeToHem", start: profile.sideKnee, end: profile.sideHem },
    { kind: "line", name: "hem", start: profile.sideHem, end: profile.innerHem },
    { kind: "line", name: "inseamLower", start: profile.innerHem, end: profile.innerKnee },
    { kind: "line", name: "inseamUpper", start: profile.innerKnee, end: profile.innerThigh },
    { kind: "line", name: "innerThighToCrotch", start: profile.innerThigh, end: profile.crotch },
    crotch,
    { kind: "line", name: centerName, start: point(0, centerY), end: point(0, 0) },
  ];
  return { name, onFold: false, edges };
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

/** The internal four-panel Jeans lower-body core; later slices add its other pieces. */
export function draftJeansCore(
  measurements: Measurements,
  rawOptions: Partial<JeansOptions> = {},
): Block {
  const options = resolveJeansOptions(rawOptions);
  const metrics = jeansMetrics(measurements, options);
  const frontLeft = legPiece(measurements, metrics, options, "front", "jeans front left");
  const backLeft = legPiece(measurements, metrics, options, "back", "jeans back left");
  const roles = {
    frontLeft,
    frontRight: mirrorPiece(frontLeft, "jeans front right"),
    backLeft,
    backRight: mirrorPiece(backLeft, "jeans back right"),
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
