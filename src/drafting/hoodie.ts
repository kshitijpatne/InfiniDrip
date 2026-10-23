import { cubicPoint, point, type CubicBezier, type Point } from "../geometry";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
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
import type { Component, ComponentResult } from "./component";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import type { GarmentOptions } from "./options";

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
const HOOD_FRONT_OVERLAP_MIN = 0;
const HOOD_FRONT_OVERLAP_MAX = 8;
const HOOD_FRONT_OVERLAP_EDGE_DROP_CM = 1.25;
// Match semantic-edit's 14 curve samples so a repaired outline also passes its gate.
const HOOD_FACE_CROSSING_SAMPLES = 14;
const HOOD_FACE_OUTLINE_VALIDATION_SAMPLES = 128;
const HOOD_FACE_CROSSING_STEP_CM = 0.25;
const HOOD_FACE_MAX_SEARCH_HEIGHT_CM = 50; // Matches hoodie-contract's authored hoodHeight maximum.
const HOOD_FACE_MIN_OVERLAP_TURN_SINE = 0.65;
const HOOD_CASING_WIDTH_MIN = 0;
const HOOD_CASING_WIDTH_MAX = 5.5;
const HOOD_DRAWCORD_LENGTH_MIN = 60;
const HOOD_DRAWCORD_LENGTH_MAX = 180;
const HOOD_EXIT_SPACING_MIN = 4;
const HOOD_EXIT_SPACING_MAX = 16;
const HOOD_CASING_GUIDE_SEGMENTS = 32;
const HOOD_CASING_MIN_FACE_COVERAGE = 0.5;

function cubicTangent(curve: CubicBezier, t: number): Point {
  const u = 1 - t;
  return point(
    3 * u * u * (curve.control1.x - curve.start.x) +
      6 * u * t * (curve.control2.x - curve.control1.x) +
      3 * t * t * (curve.end.x - curve.control2.x),
    3 * u * u * (curve.control1.y - curve.start.y) +
      6 * u * t * (curve.control2.y - curve.control1.y) +
      3 * t * t * (curve.end.y - curve.control2.y),
  );
}

function outlinePoints(edges: readonly Edge[], segmentsPerCurve = 64): readonly Point[] {
  const points: Point[] = [];
  for (const edge of edges) {
    const edgePoints = edge.kind === "line"
      ? [edge.start, edge.end]
      : Array.from({ length: segmentsPerCurve + 1 }, (_, index) =>
          cubicPoint(edge.curve, index / segmentsPerCurve));
    points.push(...edgePoints.slice(points.length === 0 ? 0 : 1));
  }
  return points;
}

function pointInsidePolygon(value: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index]!;
    const previousPoint = polygon[previous]!;
    const crosses = (currentPoint.y > value.y) !== (previousPoint.y > value.y) &&
      value.x < (previousPoint.x - currentPoint.x) * (value.y - currentPoint.y) /
        (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function inwardNormal(
  curve: CubicBezier,
  t: number,
  polygon: readonly Point[],
): Point | undefined {
  const tangent = cubicTangent(curve, t);
  const magnitude = Math.hypot(tangent.x, tangent.y);
  if (!Number.isFinite(magnitude) || magnitude <= 1e-9) return undefined;
  const forward = point(-tangent.y / magnitude, tangent.x / magnitude);
  const reverse = point(-forward.x, -forward.y);
  const onEdge = cubicPoint(curve, t);
  const probeDistance = 0.005;
  const forwardProbe = point(
    onEdge.x + forward.x * probeDistance,
    onEdge.y + forward.y * probeDistance,
  );
  if (pointInsidePolygon(forwardProbe, polygon)) return forward;
  const reverseProbe = point(
    onEdge.x + reverse.x * probeDistance,
    onEdge.y + reverse.y * probeDistance,
  );
  return pointInsidePolygon(reverseProbe, polygon) ? reverse : undefined;
}

function offsetFacePoint(
  curve: CubicBezier,
  t: number,
  offset: number,
  polygon: readonly Point[],
): Point | undefined {
  const onEdge = cubicPoint(curve, t);
  const normal = inwardNormal(curve, t, polygon);
  if (normal === undefined) return undefined;
  const result = point(onEdge.x + normal.x * offset, onEdge.y + normal.y * offset);
  return Number.isFinite(result.x) && Number.isFinite(result.y) && pointInsidePolygon(result, polygon)
    ? result
    : undefined;
}

function casingOffsetPath(
  curve: CubicBezier,
  offset: number,
  polygon: readonly Point[],
): readonly Point[] {
  const sampled: (Point | undefined)[] = [];
  for (let index = 0; index <= HOOD_CASING_GUIDE_SEGMENTS; index += 1) {
    sampled.push(offsetFacePoint(
      curve,
      index / HOOD_CASING_GUIDE_SEGMENTS,
      offset,
      polygon,
    ));
  }
  const startIndex = sampled.findIndex((value) => value !== undefined);
  if (startIndex < 0) return [];
  const points: Point[] = [];
  for (let index = startIndex; index < sampled.length; index += 1) {
    const currentPoint = sampled[index];
    if (currentPoint === undefined) break;
    points.push(currentPoint);
  }
  return points;
}

function casingFoldMarks(points: readonly Point[]): readonly PatternMark[] {
  return points.slice(0, -1).map((start, index) => lineMark(
    "foldLine",
    `hoodCasingFold-${index + 1}`,
    start,
    points[index + 1]!,
    index === 0 ? "CASING FOLD" : undefined,
    index === 0 ? "instruction" : undefined,
  ));
}

function exitPointAtSpacing(points: readonly Point[], spacing: number, polygon: readonly Point[]): Point | undefined {
  const targetX = -spacing / 2;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const minimumX = Math.min(start.x, end.x);
    const maximumX = Math.max(start.x, end.x);
    if (targetX < minimumX || targetX > maximumX || Math.abs(end.x - start.x) <= 1e-9) continue;
    const amount = (targetX - start.x) / (end.x - start.x);
    const result = point(targetX, start.y + (end.y - start.y) * amount);
    if (pointInsidePolygon(result, polygon)) return result;
  }
  return undefined;
}

function hoodieCasingMarks(
  faceOpening: CubicBezier,
  edges: readonly Edge[],
  options: HoodieDraftOptions,
): readonly PatternMark[] {
  const width = options.hoodCasingWidth;
  if (!Number.isFinite(width) || width <= HOOD_CASING_WIDTH_MIN || width > HOOD_CASING_WIDTH_MAX) return [];
  const polygon = outlinePoints(edges);
  const foldPath = casingOffsetPath(faceOpening, width, polygon);
  const minimumGuidePoints = Math.ceil(
    (HOOD_CASING_GUIDE_SEGMENTS + 1) * HOOD_CASING_MIN_FACE_COVERAGE,
  );
  if (foldPath.length < minimumGuidePoints) return [];
  const marks = [...casingFoldMarks(foldPath)];
  const spacing = options.hoodExitSpacing;
  if (!Number.isFinite(spacing) || spacing < HOOD_EXIT_SPACING_MIN || spacing > HOOD_EXIT_SPACING_MAX) return marks;
  const casingMidline = casingOffsetPath(faceOpening, width / 2, polygon);
  const exit = exitPointAtSpacing(casingMidline, spacing, polygon);
  if (exit === undefined) return marks;
  marks.push(pointMark("buttonhole", "hoodDrawcordExit", exit, "DRAWCORD EXIT", "instruction"));
  return marks;
}

function mirrorMarkAcrossCenterFront(mark: PatternMark): PatternMark {
  return "at" in mark
    ? { ...mark, at: point(-mark.at.x, mark.at.y) }
    : {
        ...mark,
        start: point(-mark.start.x, mark.start.y),
        end: point(-mark.end.x, mark.end.y),
      };
}

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

function mirrorEdgeAcrossCenterFront(edge: Edge): Edge {
  if (edge.kind === "line") {
    return {
      ...edge,
      start: point(-edge.start.x, edge.start.y),
      end: point(-edge.end.x, edge.end.y),
    };
  }
  return { ...edge, curve: mirrorCurveAcrossCenterFront(edge.curve) };
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsProperlyIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC > 1e-9 && abD < -1e-9) || (abC < -1e-9 && abD > 1e-9)) &&
    ((cdA > 1e-9 && cdB < -1e-9) || (cdA < -1e-9 && cdB > 1e-9));
}

function curvesIntersect(first: CubicBezier, second: CubicBezier, samples = HOOD_FACE_CROSSING_SAMPLES): boolean {
  const firstPoints = Array.from({ length: samples + 1 }, (_, index) =>
    cubicPoint(first, index / samples));
  const secondPoints = Array.from({ length: samples + 1 }, (_, index) =>
    cubicPoint(second, index / samples));
  for (let firstIndex = 0; firstIndex < samples; firstIndex += 1) {
    const a = firstPoints[firstIndex]!;
    const b = firstPoints[firstIndex + 1]!;
    for (let secondIndex = 0; secondIndex < samples; secondIndex += 1) {
      const c = secondPoints[secondIndex]!;
      const d = secondPoints[secondIndex + 1]!;
      if (Math.max(a.x, b.x) + 1e-8 < Math.min(c.x, d.x) ||
          Math.max(c.x, d.x) + 1e-8 < Math.min(a.x, b.x) ||
          Math.max(a.y, b.y) + 1e-8 < Math.min(c.y, d.y) ||
          Math.max(c.y, d.y) + 1e-8 < Math.min(a.y, b.y)) continue;
      if (segmentsProperlyIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

function curveIntersectsSegment(curve: CubicBezier, start: Point, end: Point): boolean {
  let previous = cubicPoint(curve, 0);
  for (let index = 1; index <= HOOD_FACE_OUTLINE_VALIDATION_SAMPLES; index += 1) {
    const current = cubicPoint(curve, index / HOOD_FACE_OUTLINE_VALIDATION_SAMPLES);
    if (Math.max(previous.x, current.x) + 1e-8 >= Math.min(start.x, end.x) &&
        Math.max(start.x, end.x) + 1e-8 >= Math.min(previous.x, current.x) &&
        Math.max(previous.y, current.y) + 1e-8 >= Math.min(start.y, end.y) &&
        Math.max(start.y, end.y) + 1e-8 >= Math.min(previous.y, current.y) &&
        segmentsProperlyIntersect(previous, current, start, end)) return true;
    previous = current;
  }
  return false;
}

function faceOpeningHasStableOverlapTurn(faceOpening: CubicBezier, centerFront: Point): boolean {
  const outgoingLength = Math.hypot(centerFront.x - faceOpening.end.x, centerFront.y - faceOpening.end.y);
  if (Number.isFinite(outgoingLength) && outgoingLength <= Number.EPSILON) return true;
  const lastSample = cubicPoint(
    faceOpening,
    (HOOD_FACE_CROSSING_SAMPLES - 1) / HOOD_FACE_CROSSING_SAMPLES,
  );
  const incoming = {
    x: faceOpening.end.x - lastSample.x,
    y: faceOpening.end.y - lastSample.y,
  };
  const outgoing = {
    x: centerFront.x - faceOpening.end.x,
    y: centerFront.y - faceOpening.end.y,
  };
  const scale = Math.hypot(incoming.x, incoming.y) * Math.hypot(outgoing.x, outgoing.y);
  if (!Number.isFinite(scale) || scale <= Number.EPSILON) return false;
  const sine = Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x) / scale;
  return Number.isFinite(sine) && sine >= HOOD_FACE_MIN_OVERLAP_TURN_SINE;
}

function keepFaceOpeningClearOfFrontSeam(
  frontSeam: CubicBezier,
  faceOpening: CubicBezier,
  hoodHeight: number,
  centerFront: Point,
): CubicBezier {
  // Match the validator's 14-sample cadence while searching derived handles.
  // A near-reversal at the overlap connector can create an extreme miter even
  // after the curve crossing is gone, so check the terminal turn as well.
  const initiallyClear = !curvesIntersect(frontSeam, faceOpening);
  if (initiallyClear && faceOpeningHasStableOverlapTurn(faceOpening, centerFront)) return faceOpening;

  // Move only the derived terminal handle downward in y-down pattern
  // coordinates. Raw option values and endpoints remain intact; unresolved
  // collisions still reach semantic-edit validation.
  let adjusted = faceOpening;
  let firstClearCandidate: CubicBezier | undefined = initiallyClear ? faceOpening : undefined;
  for (let offset = HOOD_FACE_CROSSING_STEP_CM; offset <= hoodHeight; offset += HOOD_FACE_CROSSING_STEP_CM) {
    adjusted = {
      ...faceOpening,
      control2: { ...faceOpening.control2, y: faceOpening.control2.y + offset },
    };
    if (curvesIntersect(frontSeam, adjusted)) continue;
    firstClearCandidate ??= adjusted;
    if (faceOpeningHasStableOverlapTurn(adjusted, centerFront)) return adjusted;
  }
  return firstClearCandidate ?? adjusted;
}

function createFaceOpeningCurve(
  centerFront: Point,
  endpoint: Point,
  hoodDepth: number,
  hoodHeight: number,
): CubicBezier {
  return {
    start: point(-hoodDepth, -hoodHeight),
    control1: point(-hoodDepth * 0.78, -hoodHeight * 0.72),
    control2: point(-hoodDepth * 0.22, centerFront.y - hoodHeight * 0.18),
    end: endpoint,
  };
}

function resolveFrontOverlapGeometry(
  frontSeam: CubicBezier,
  centerFront: Point,
  overlap: number,
  hoodDepth: number,
  hoodHeight: number,
): { readonly endpoint: Point; readonly faceOpening: CubicBezier } {
  // Prefer the largest digital endpoint drop that clears both the connector
  // and a fine-sampled outline check. Keep the same 0.25 cm candidate cadence
  // used by the derived-handle search; no raw option is modified.
  const fallbackEndpoint = point(centerFront.x + overlap / 2, centerFront.y);
  let fallback = {
    endpoint: fallbackEndpoint,
    faceOpening: createFaceOpeningCurve(centerFront, fallbackEndpoint, hoodDepth, hoodHeight),
  };
  // Invalid dimensions are blocked by recipe guidance. Keep their raw-derived
  // fallback geometry, and never search with an unbounded or unsupported height.
  if (!Number.isFinite(hoodDepth) || !Number.isFinite(hoodHeight) ||
      hoodHeight > HOOD_FACE_MAX_SEARCH_HEIGHT_CM) return fallback;

  const dropSteps = overlap > HOOD_FRONT_OVERLAP_MIN
    ? Math.round(HOOD_FRONT_OVERLAP_EDGE_DROP_CM / HOOD_FACE_CROSSING_STEP_CM)
    : 0;
  for (let step = dropSteps; step >= 0; step -= 1) {
    const drop = step * HOOD_FACE_CROSSING_STEP_CM;
    const endpoint = point(centerFront.x + overlap / 2, centerFront.y + drop);
    if (overlap > HOOD_FRONT_OVERLAP_MIN && curveIntersectsSegment(frontSeam, endpoint, centerFront)) continue;
    const candidate = createFaceOpeningCurve(centerFront, endpoint, hoodDepth, hoodHeight);
    const faceOpening = keepFaceOpeningClearOfFrontSeam(frontSeam, candidate, hoodHeight, centerFront);
    const noCrossing = !curvesIntersect(frontSeam, faceOpening, HOOD_FACE_OUTLINE_VALIDATION_SAMPLES);
    const stableTurn = overlap <= HOOD_FRONT_OVERLAP_MIN || faceOpeningHasStableOverlapTurn(faceOpening, centerFront);
    if (noCrossing && stableTurn) return { endpoint, faceOpening };
    if (noCrossing) fallback = { endpoint, faceOpening };
  }
  return fallback;
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
  const overlap = Number.isFinite(options.hoodFrontOverlap) &&
    options.hoodFrontOverlap >= HOOD_FRONT_OVERLAP_MIN &&
    options.hoodFrontOverlap <= HOOD_FRONT_OVERLAP_MAX
    ? options.hoodFrontOverlap
    : HOOD_FRONT_OVERLAP_MIN;
  const resolvedFrontOverlap = resolveFrontOverlapGeometry(
    frontSeam.curve,
    centerFront,
    overlap,
    options.hoodDepth,
    options.hoodHeight,
  );
  const frontOverlapEndpoint = resolvedFrontOverlap.endpoint;
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
    curve: resolvedFrontOverlap.faceOpening,
  };
  const overlapConnector: Edge | undefined = overlap > HOOD_FRONT_OVERLAP_MIN
    ? {
        kind: "line",
        name: "frontOverlap",
        start: frontOverlapEndpoint,
        end: centerFront,
      }
    : undefined;
  const draftedEdges = [frontSeam, backSeam, centerBackSeam, faceOpening,
    ...(overlapConnector === undefined ? [] : [overlapConnector])];
  const leftMarks = layer === "outer"
    ? hoodieCasingMarks(faceOpening.curve, draftedEdges, options)
    : [];
  const edges = side === "left"
    ? draftedEdges
    : draftedEdges.map(mirrorEdgeAcrossCenterFront);
  const marks = side === "left"
    ? leftMarks
    : leftMarks.map(mirrorMarkAcrossCenterFront);
  const sideName = side === "left" ? "left" : "right";
  return {
    name: `hoodie ${sideName} ${layer} hood side`,
    onFold: false,
    edges,
    ...(marks.length === 0 ? {} : { marks }),
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
function draftHoodieBlock(
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

const hoodieRecipeComponent: Component<HoodieDraftOptions> = (measurements, options): ComponentResult => {
  const drafted = draftHoodieBlock(measurements, options);
  return { pieces: drafted.roles, stitches: drafted.stitches, interfaces: {} };
};

/** The Hoodie block remains one integrated source component until its
 * independently authored hood, pouch, and band nodes are separated. */
export const HOODIE_GRAMMAR = garmentGrammar("hoodie", [
  componentNode("hoodie", "integrated-hoodie", hoodieRecipeComponent,
    (context) => context.options as HoodieDraftOptions),
]);

export function draftHoodie(
  measurements: Measurements,
  options: HoodieDraftOptions,
): Block {
  return composeBlock(HOODIE_GRAMMAR, measurements, options as GarmentOptions);
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
  options: Pick<HoodieDraftOptions, "hoodNecklineWidthEase" | "hoodNecklineFrontDrop" | "hoodNeckEase" | "hoodFrontOverlap">,
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
  if (!Number.isFinite(options.hoodFrontOverlap) ||
      options.hoodFrontOverlap < HOOD_FRONT_OVERLAP_MIN ||
      options.hoodFrontOverlap > HOOD_FRONT_OVERLAP_MAX) {
    const value = Number.isFinite(options.hoodFrontOverlap)
      ? `${options.hoodFrontOverlap} cm`
      : String(options.hoodFrontOverlap);
    notes.push({
      field: "hoodFrontOverlap",
      level: "warn",
      text: `Hood front overlap (${value}) is outside the supported ${HOOD_FRONT_OVERLAP_MIN}–${HOOD_FRONT_OVERLAP_MAX} cm range — adjust it into that range.`,
    });
  }
  return notes;
}

/** Report casing/exit option problems without replacing the user's raw values. */
export function hoodieCasingNotes(
  measurements: Measurements,
  options: HoodieDraftOptions,
): readonly Note[] {
  const notes: Note[] = [];
  const casingValid = Number.isFinite(options.hoodCasingWidth) &&
    options.hoodCasingWidth >= HOOD_CASING_WIDTH_MIN &&
    options.hoodCasingWidth <= HOOD_CASING_WIDTH_MAX;
  const spacingValid = Number.isFinite(options.hoodExitSpacing) &&
    options.hoodExitSpacing >= HOOD_EXIT_SPACING_MIN &&
    options.hoodExitSpacing <= HOOD_EXIT_SPACING_MAX;
  const drawcordValid = Number.isFinite(options.hoodDrawcordLength) &&
    options.hoodDrawcordLength >= HOOD_DRAWCORD_LENGTH_MIN &&
    options.hoodDrawcordLength <= HOOD_DRAWCORD_LENGTH_MAX;

  if (!casingValid) {
    const value = Number.isFinite(options.hoodCasingWidth)
      ? `${options.hoodCasingWidth} cm`
      : String(options.hoodCasingWidth);
    notes.push({
      field: "hoodCasingWidth",
      level: "warn",
      text: `Hood casing width (${value}) is outside the supported ${HOOD_CASING_WIDTH_MIN}–${HOOD_CASING_WIDTH_MAX} cm range — adjust it into that range.`,
    });
  }
  if (!drawcordValid) {
    const value = Number.isFinite(options.hoodDrawcordLength)
      ? `${options.hoodDrawcordLength} cm`
      : String(options.hoodDrawcordLength);
    notes.push({
      field: "hoodDrawcordLength",
      level: "warn",
      text: `Drawcord length (${value}) is outside the supported ${HOOD_DRAWCORD_LENGTH_MIN}–${HOOD_DRAWCORD_LENGTH_MAX} cm digital range — adjust it into that range; this is not a cut length.`,
    });
  }
  if (!spacingValid) {
    const value = Number.isFinite(options.hoodExitSpacing)
      ? `${options.hoodExitSpacing} cm`
      : String(options.hoodExitSpacing);
    notes.push({
      field: "hoodExitSpacing",
      level: "warn",
      text: `Hood drawcord exit spacing (${value}) is outside the supported ${HOOD_EXIT_SPACING_MIN}–${HOOD_EXIT_SPACING_MAX} cm range — adjust it into that range.`,
    });
  }

  if (casingValid && options.hoodCasingWidth === HOOD_CASING_WIDTH_MIN) {
    if (drawcordValid) {
      notes.push({
        field: "hoodDrawcordLength",
        level: "warn",
        text: `Drawcord length (${options.hoodDrawcordLength} cm) is unused while hood casing width is zero — increase casing width to add the casing and exits.`,
      });
    }
    return notes;
  }

  if (casingValid) {
    const drafted = draftHoodie(measurements, options);
    const leftMarks = drafted.roles.hoodOuterLeft?.marks ?? [];
    const hasCasingGuide = leftMarks.some((mark) =>
      mark.kind === "foldLine" && mark.name.startsWith("hoodCasingFold-"));
    const hasExit = leftMarks.some((mark) => mark.kind === "buttonhole" && mark.name === "hoodDrawcordExit");
    if (!hasCasingGuide) {
      notes.push({
        field: "hoodCasingWidth",
        level: "warn",
        text: `Hood casing width of ${options.hoodCasingWidth} cm cannot be represented inside this hood face — reduce the width or adjust the hood shape.`,
      });
    } else if (spacingValid && !hasExit) {
      notes.push({
        field: "hoodExitSpacing",
        level: "warn",
        text: `Hood drawcord exits ${options.hoodExitSpacing} cm apart do not fit on this casing — reduce exit spacing or adjust casing width and hood shape.`,
      });
    }
  }
  return notes;
}
