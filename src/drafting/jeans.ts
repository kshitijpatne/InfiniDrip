import { point } from "../geometry";
import { block, type Block } from "./block";
import { edgeLength, type Edge, type Piece } from "./piece";
import { edgeRef, iface, type Stitch } from "./stitch";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import type { LowerBodyUpperMetrics } from "./lower-body-upper";
import type { Measurements } from "./measurements";
import { buildJeansFrontPocket } from "./jeans-pocket";
import { buildJeansCoinBackPockets } from "./jeans-coin-back-pockets";
import { buildJeansFly } from "./jeans-fly";
import { buildJeansWaistband } from "./jeans-waistband";
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

type CurveEdge = Extract<Edge, { readonly kind: "curve" }>;

function frontPiece(
  measurements: Measurements,
  metrics: JeansDraftMetrics,
  options: JeansOptions,
  name: string,
): Piece {
  const profile = legProfile(measurements, metrics, options);
  const yokeSideY = options.yokeDepth / 2;
  const yokeSideRatio = yokeSideY / measurements.hipDepth;
  const sideYoke = point(
    profile.sideWaist.x + (profile.sideHip.x - profile.sideWaist.x) * yokeSideRatio,
    yokeSideY,
  );
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: point(0, 0), end: profile.sideWaist },
    { kind: "line", name: "sideWaistToYoke", start: profile.sideWaist, end: sideYoke },
    { kind: "line", name: "sideYokeToHip", start: sideYoke, end: profile.sideHip },
    { kind: "line", name: "sideHipToThigh", start: profile.sideHip, end: profile.sideThigh },
    { kind: "line", name: "sideThighToKnee", start: profile.sideThigh, end: profile.sideKnee },
    { kind: "line", name: "sideKneeToHem", start: profile.sideKnee, end: profile.sideHem },
    { kind: "line", name: "hem", start: profile.sideHem, end: profile.innerHem },
    { kind: "line", name: "inseamLower", start: profile.innerHem, end: profile.innerKnee },
    { kind: "line", name: "inseamUpper", start: profile.innerKnee, end: profile.innerThigh },
    { kind: "line", name: "innerThighToCrotch", start: profile.innerThigh, end: profile.crotch },
    {
      kind: "curve",
      name: "crotch",
      curve: {
        start: profile.crotch,
        control1: point(profile.crotch.x - 2.2, profile.crotch.y - 0.6),
        control2: point(profile.crotch.x - 2.6, metrics.frontCrotchY + 0.8),
        end: point(0, metrics.frontCrotchY),
      },
    },
    { kind: "line", name: "centerFront", start: point(0, metrics.frontCrotchY), end: point(0, 0) },
  ];
  return { name, onFold: false, edges };
}

function offsetCurveControls(edge: CurveEdge, normal: ReturnType<typeof point>, amount: number): CurveEdge {
  return {
    ...edge,
    curve: {
      ...edge.curve,
      control1: point(
        edge.curve.control1.x + normal.x * amount,
        edge.curve.control1.y + normal.y * amount,
      ),
      control2: point(
        edge.curve.control2.x + normal.x * amount,
        edge.curve.control2.y + normal.y * amount,
      ),
    },
  };
}

/** Add an exact positive arc-length difference by offsetting both controls. */
function curveWithExtraLength(
  edge: CurveEdge,
  normal: ReturnType<typeof point>,
  extraLength: number,
): CurveEdge {
  if (extraLength === 0) return edge;
  if (!Number.isFinite(extraLength) || extraLength < 0) {
    // Preserve invalid raw input in the geometry; later Jeans guidance owns
    // explaining unsupported values. This is intentionally not a clamp.
    return offsetCurveControls(edge, normal, extraLength);
  }

  const targetLength = edgeLength(edge) + extraLength;
  let lower = 0;
  let upper = Math.max(extraLength, 0.1);
  let upperLength = edgeLength(offsetCurveControls(edge, normal, upper));
  for (let attempt = 0; attempt < 20 && upperLength < targetLength; attempt += 1) {
    upper *= 2;
    upperLength = edgeLength(offsetCurveControls(edge, normal, upper));
  }
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const middle = (lower + upper) / 2;
    const middleLength = edgeLength(offsetCurveControls(edge, normal, middle));
    if (middleLength < targetLength) lower = middle;
    else upper = middle;
  }
  // Keep the result on the shorter side of the numerical target so the
  // declared upper ease bound is never exceeded by floating-point rounding.
  return offsetCurveControls(edge, normal, lower);
}

function yokeCurve(
  center: ReturnType<typeof point>,
  side: ReturnType<typeof point>,
): { readonly edge: CurveEdge; readonly normal: ReturnType<typeof point> } {
  const dx = side.x - center.x;
  const dy = side.y - center.y;
  const chord = Math.hypot(dx, dy);
  const normal = point(-dy / chord, dx / chord);
  return {
    edge: {
      kind: "curve",
      name: "yokeJoin",
      curve: {
        start: center,
        control1: point(center.x + dx * 0.3 + normal.x * 0.6, center.y + dy * 0.3 + normal.y * 0.6),
        control2: point(center.x + dx * 0.72 + normal.x * 0.6, center.y + dy * 0.72 + normal.y * 0.6),
        end: side,
      },
    },
    normal,
  };
}

function backPieces(
  measurements: Measurements,
  metrics: JeansDraftMetrics,
  options: JeansOptions,
): { readonly yoke: Piece; readonly lower: Piece } {
  const profile = legProfile(measurements, metrics, options);
  const yokeSideY = options.yokeDepth / 2;
  const yokeSideRatio = yokeSideY / measurements.hipDepth;
  const sideYoke = point(
    profile.sideWaist.x + (profile.sideHip.x - profile.sideWaist.x) * yokeSideRatio,
    yokeSideY,
  );
  const centerYoke = point(0, options.yokeDepth);
  const baseYokeSeam = yokeCurve(centerYoke, sideYoke);
  const lowerYokeSeam = curveWithExtraLength(
    baseYokeSeam.edge,
    baseYokeSeam.normal,
    options.yokeEase,
  );
  const lowerYoke: Piece = {
    name: "jeans back lower left",
    onFold: false,
    edges: [
      lowerYokeSeam,
      { kind: "line", name: "sideYokeToHip", start: sideYoke, end: profile.sideHip },
      { kind: "line", name: "sideHipToThigh", start: profile.sideHip, end: profile.sideThigh },
      { kind: "line", name: "sideThighToKnee", start: profile.sideThigh, end: profile.sideKnee },
      { kind: "line", name: "sideKneeToHem", start: profile.sideKnee, end: profile.sideHem },
      { kind: "line", name: "hem", start: profile.sideHem, end: profile.innerHem },
      { kind: "line", name: "inseamLower", start: profile.innerHem, end: profile.innerKnee },
      { kind: "line", name: "inseamUpper", start: profile.innerKnee, end: profile.innerThigh },
      { kind: "line", name: "innerThighToCrotch", start: profile.innerThigh, end: profile.crotch },
      {
        kind: "curve",
        name: "crotch",
        curve: {
          start: profile.crotch,
          control1: point(profile.crotch.x + 2.8, profile.crotch.y + 1.2),
          control2: point(profile.crotch.x + 3.7, metrics.backCrotchY - 1.6),
          end: point(0, metrics.backCrotchY),
        },
      },
      { kind: "line", name: "centerBackLower", start: point(0, metrics.backCrotchY), end: centerYoke },
    ],
  };
  const yoke: Piece = {
    name: "jeans back yoke left",
    onFold: false,
    edges: [
      { kind: "line", name: "centerBackYoke", start: point(0, 0), end: centerYoke },
      baseYokeSeam.edge,
      { kind: "line", name: "sideWaistToYoke", start: sideYoke, end: profile.sideWaist },
      { kind: "line", name: "waist", start: profile.sideWaist, end: point(0, 0) },
    ],
  };
  return { yoke, lower: lowerYoke };
}

const frontSideInterface = (frontRole: string, facingRole: string, front: Piece) => {
  const dropToYoke = front.edges.some(({ name }) => name === "sidePocketDropToYoke");
  return iface(
    edgeRef(facingRole, "sideFacing"),
    ...(dropToYoke
      ? [edgeRef(frontRole, "sidePocketDropToYoke"), edgeRef(frontRole, "sideYokeToHip")]
      : [edgeRef(frontRole, "sidePocketDropToHip")]),
    edgeRef(frontRole, "sideHipToThigh"),
    edgeRef(frontRole, "sideThighToKnee"),
    edgeRef(frontRole, "sideKneeToHem"),
  );
};

const backSideInterface = (yokeRole: string, lowerRole: string) => iface(
  edgeRef(yokeRole, "sideWaistToYoke"),
  edgeRef(lowerRole, "sideYokeToHip"),
  edgeRef(lowerRole, "sideHipToThigh"),
  edgeRef(lowerRole, "sideThighToKnee"),
  edgeRef(lowerRole, "sideKneeToHem"),
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
  const leftPocket = buildJeansFrontPocket(
    frontPiece(measurements, metrics, options, "jeans front left"),
    options,
  );
  const frontLeft = leftPocket.front;
  const back = backPieces(measurements, metrics, options);
  const frontRight = mirrorPiece(frontLeft, "jeans front right");
  const pocketFacingRight = mirrorPiece(leftPocket.facing, "jeans front pocket facing right");
  const pocketFeatures = buildJeansCoinBackPockets(
    pocketFacingRight,
    back.lower,
    mirrorPiece(back.lower, "jeans back lower right"),
    options,
  );
  const fly = buildJeansFly(frontLeft, frontRight, options);
  const backYokeRight = mirrorPiece(back.yoke, "jeans back yoke right");
  const waistband = buildJeansWaistband({
    frontLeft: fly.frontLeft,
    frontRight: fly.frontRight,
    pocketFacingLeft: leftPocket.facing,
    pocketFacingRight,
    backYokeLeft: back.yoke,
    backYokeRight,
    coinPocket: pocketFeatures.coinPocket,
    backPocketLeft: pocketFeatures.backPocketLeft,
    backPocketRight: pocketFeatures.backPocketRight,
    options,
  });
  const roles = {
    frontLeft: fly.frontLeft,
    frontRight: fly.frontRight,
    backYokeLeft: back.yoke,
    backYokeRight,
    backLowerLeft: pocketFeatures.backLowerLeft,
    backLowerRight: pocketFeatures.backLowerRight,
    pocketFacingLeft: leftPocket.facing,
    pocketFacingRight,
    pocketBagLeft: leftPocket.bag,
    pocketBagRight: mirrorPiece(leftPocket.bag, "jeans front pocket bag right"),
    pocketStayLeft: leftPocket.stay,
    pocketStayRight: mirrorPiece(leftPocket.stay, "jeans front pocket stay right"),
    pocketFacingExtensionRight: pocketFeatures.facingExtensionRight,
    coinPocket: pocketFeatures.coinPocket,
    backPocketLeft: pocketFeatures.backPocketLeft,
    backPocketRight: pocketFeatures.backPocketRight,
    flyFacingUnderlapRight: fly.facingUnderlapRight,
    flyShield: fly.shield,
    waistbandOuterLeft: waistband.outerLeft,
    waistbandOuterRight: waistband.outerRight,
    waistbandInnerLeft: waistband.innerLeft,
    waistbandInnerRight: waistband.innerRight,
    beltLoopStrip: waistband.beltLoopStrip,
  };
  const stitches: readonly Stitch[] = [
    { label: "Left side seam (front ↔ back)", a: frontSideInterface("frontLeft", "pocketFacingLeft", fly.frontLeft), b: backSideInterface("backYokeLeft", "backLowerLeft") },
    { label: "Right side seam (front ↔ back)", a: frontSideInterface("frontRight", "pocketFacingRight", roles.frontRight), b: backSideInterface("backYokeRight", "backLowerRight") },
    { label: "Left inseam (front ↔ back)", a: inseamInterface("frontLeft"), b: inseamInterface("backLowerLeft") },
    { label: "Right inseam (front ↔ back)", a: inseamInterface("frontRight"), b: inseamInterface("backLowerRight") },
    { label: "Left back yoke join (back lower longer)", a: iface(edgeRef("backLowerLeft", "yokeJoin")), b: iface(edgeRef("backYokeLeft", "yokeJoin")), ease: { lo: 0, hi: options.yokeEase } },
    { label: "Right back yoke join (back lower longer)", a: iface(edgeRef("backLowerRight", "yokeJoin")), b: iface(edgeRef("backYokeRight", "yokeJoin")), ease: { lo: 0, hi: options.yokeEase } },
    { label: "Center-back yoke seam (left ↔ right)", a: iface(edgeRef("backYokeLeft", "centerBackYoke")), b: iface(edgeRef("backYokeRight", "centerBackYoke")) },
    { label: "Center-back lower seam (left ↔ right)", a: iface(edgeRef("backLowerLeft", "centerBackLower")), b: iface(edgeRef("backLowerRight", "centerBackLower")) },
    { label: "Left front pocket opening (front ↔ facing)", a: iface(edgeRef("frontLeft", "pocketOpening")), b: iface(edgeRef("pocketFacingLeft", "opening")) },
    { label: "Right front pocket opening (front ↔ facing)", a: iface(edgeRef("frontRight", "pocketOpening")), b: iface(edgeRef("pocketFacingRight", "opening")) },
    { label: "Left pocket facing ↔ bag opening", a: iface(edgeRef("pocketFacingLeft", "opening")), b: iface(edgeRef("pocketBagLeft", "pocketOpening")) },
    { label: "Right pocket facing ↔ bag opening", a: iface(edgeRef("pocketFacingRight", "opening")), b: iface(edgeRef("pocketBagRight", "pocketOpening")) },
    { label: "Right coin-facing extension ↔ facing", a: iface(edgeRef("pocketFacingExtensionRight", "facingJoin")), b: iface(edgeRef("pocketFacingRight", "sideFacing")) },
    { label: "Left localized pocket stay ↔ bag", a: iface(edgeRef("pocketStayLeft", "stayJoin")), b: iface(edgeRef("pocketBagLeft", "bagClose")) },
    { label: "Right localized pocket stay ↔ bag", a: iface(edgeRef("pocketStayRight", "stayJoin")), b: iface(edgeRef("pocketBagRight", "bagClose")) },
    ...fly.stitches,
    ...waistband.stitches,
  ];
  return block(roles, stitches);
}
