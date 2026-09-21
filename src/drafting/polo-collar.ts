// Epic 11 / Slice 155: the shared pure collar-and-stand geometry contract.
//
// A Polo neckline is two real drafted arcs (back fold -> shoulder and front
// fold -> shoulder), not one pre-summed number. This module unwraps those arcs
// into a centre-back -> shoulder -> centre-front path, preserves their measured
// length while applying the user-owned front rise, and returns the same seam
// facts that drafting and the schematic render will consume in later slices.
// It deliberately has no recipe, UI, or render imports.

import { cubicPoint, Point, point } from "../geometry";
import { Edge, edgeEnd, edgeLength, edgeStart } from "./piece";

const SOLVER_ITERATIONS = 40;
const LENGTH_TOLERANCE = 0.0001;
const EPSILON = 0.000001;

export interface PoloNecklineInputs {
  /** The drafted front neckline, ordered centre-front fold -> shoulder. */
  readonly front: Edge;
  /** The drafted back neckline, ordered centre-back fold -> shoulder. */
  readonly back: Edge;
}

export interface PoloCollarOptions {
  readonly standHeight: number;
  readonly standFrontRise: number;
  readonly collarLeafDepth: number;
  readonly collarPointExtension: number;
}

export type PoloCollarLandmarkName = "centerBack" | "shoulder" | "centerFront";

export interface PoloCollarLandmark {
  readonly name: PoloCollarLandmarkName;
  /** Arc length measured from the centre-back end of this seam. */
  readonly arcLengthFromCenterBack: number;
  readonly point: Point;
  readonly edgeName: string;
  /** Bezier parameter on the named segment, not a distance fraction. */
  readonly t: number;
}

/** A seam path keeps its physical segments and its measured length together. */
export interface PoloSeamPath {
  readonly segments: readonly Edge[];
  readonly length: number;
  readonly landmarks: readonly PoloCollarLandmark[];
}

export interface PoloCollarOutline {
  /** The collar base, ordered centre-back -> centre-front. */
  readonly base: PoloSeamPath;
  /** The fold edge is ordered outer centre-back -> base centre-back. */
  readonly centerBack: Edge;
  /** The pointed front edge is ordered base centre-front -> point. */
  readonly frontTip: Edge;
  /** The outer leaf edge is ordered point -> outer centre-back. */
  readonly outer: Edge;
}

export type PoloCollarIssueCode =
  | "non-finite-input"
  | "empty-neckline"
  | "negative-dimension"
  | "stand-rise-exceeds-height"
  | "front-rise-unsolved"
  | "seam-reverses"
  | "collar-point-dominates"
  | "collar-outline-self-intersects"
  | "non-finite-output";

export interface PoloCollarIssue {
  readonly code: PoloCollarIssueCode;
  readonly field: string;
  readonly text: string;
}

export interface PoloCollarGeometry {
  readonly valid: boolean;
  readonly issues: readonly PoloCollarIssue[];
  /** The shaped seam attaching the outer stand to the body neckline. */
  readonly lowerStand: PoloSeamPath;
  /** The measured upper stand seam used by both collar bases. */
  readonly upperStand: PoloSeamPath;
  /** Equal paired collar bases; turn-of-cloth differential is deferred. */
  readonly collarBase: PoloSeamPath;
  readonly collar: PoloCollarOutline;
  readonly targetNecklineLength: number;
}

export interface PoloCollarGeometryResult {
  readonly geometry: PoloCollarGeometry | null;
  readonly issues: readonly PoloCollarIssue[];
}

function finitePoint(value: Point): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function finiteEdge(edge: Edge): boolean {
  if (edge.kind === "line") return finitePoint(edge.start) && finitePoint(edge.end);
  return finitePoint(edge.curve.start) && finitePoint(edge.curve.control1) &&
    finitePoint(edge.curve.control2) && finitePoint(edge.curve.end);
}

function mapEdge(edge: Edge, map: (value: Point) => Point, name = edge.name): Edge {
  if (edge.kind === "line") {
    return { kind: "line", name, start: map(edge.start), end: map(edge.end) };
  }
  return {
    kind: "curve",
    name,
    curve: {
      start: map(edge.curve.start),
      control1: map(edge.curve.control1),
      control2: map(edge.curve.control2),
      end: map(edge.curve.end),
    },
  };
}

export function reversePoloEdge(edge: Edge, name = edge.name): Edge {
  if (edge.kind === "line") {
    return { kind: "line", name, start: edge.end, end: edge.start };
  }
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

function translateEdge(edge: Edge, dx: number, dy: number, name = edge.name): Edge {
  return mapEdge(edge, (value) => point(value.x + dx, value.y + dy), name);
}

/** Apply a cubic smooth-step vertical lift: zero at the shoulder and full at
 * centre-front, with zero tangent at both ends. */
function frontRiseEdge(edge: Edge, rise: number, name: string): Edge {
  if (edge.kind === "line" && Math.abs(rise) <= EPSILON) return { ...edge, name };
  const curve = edge.kind === "curve"
    ? edge.curve
    : {
        start: edge.start,
        control1: point(edge.start.x + (edge.end.x - edge.start.x) / 3,
          edge.start.y + (edge.end.y - edge.start.y) / 3),
        control2: point(edge.start.x + 2 * (edge.end.x - edge.start.x) / 3,
          edge.start.y + 2 * (edge.end.y - edge.start.y) / 3),
        end: edge.end,
      };
  return {
    kind: "curve",
    name,
    curve: {
      start: curve.start,
      control1: curve.control1,
      control2: point(curve.control2.x, curve.control2.y - rise),
      end: point(curve.end.x, curve.end.y - rise),
    },
  };
}

/** Lift the upper seam by the chosen stand depth while retaining a subtle
 * front-rise blend. Endpoints remain exactly standHeight apart; the interior
 * control point is allowed to change the measured upper seam length. */
function upperFrontEdge(edge: Edge, height: number, rise: number, name: string): Edge {
  if (edge.kind === "line") return translateEdge(edge, 0, -height, name);
  const curve = edge.curve;
  return {
    kind: "curve",
    name,
    curve: {
      start: point(curve.start.x, curve.start.y - height),
      control1: point(curve.control1.x, curve.control1.y - height),
      control2: point(curve.control2.x, curve.control2.y - height + rise),
      end: point(curve.end.x, curve.end.y - height),
    },
  };
}

function scaleX(edge: Edge, anchorX: number, scale: number, name = edge.name): Edge {
  return mapEdge(edge, (value) => point(anchorX + (value.x - anchorX) * scale, value.y), name);
}

function solveHorizontalScale(edge: Edge, target: number, anchorX: number): { readonly scale: number; readonly solved: boolean } {
  const lengthAt = (scale: number): number => edgeLength(scaleX(edge, anchorX, scale));
  const atZero = lengthAt(0);
  const atOne = lengthAt(1);
  if (!Number.isFinite(atZero) || !Number.isFinite(atOne) || !Number.isFinite(target) || atZero > target + LENGTH_TOLERANCE) {
    return { scale: 1, solved: false };
  }
  if (Math.abs(atOne - target) <= LENGTH_TOLERANCE) return { scale: 1, solved: true };

  let low = 0;
  let high = 1;
  let highLength = atOne;
  while (highLength < target && high < 1024) {
    high *= 2;
    highLength = lengthAt(high);
  }
  if (!Number.isFinite(highLength) || highLength < target) return { scale: 1, solved: false };

  for (let i = 0; i < SOLVER_ITERATIONS; i += 1) {
    const middle = (low + high) / 2;
    if (lengthAt(middle) < target) low = middle;
    else high = middle;
  }
  return { scale: (low + high) / 2, solved: true };
}

function seamPath(back: Edge, front: Edge): PoloSeamPath {
  const backLength = edgeLength(back);
  const frontLength = edgeLength(front);
  const centerBack = edgeStart(back);
  const shoulder = edgeEnd(back);
  const centerFront = edgeEnd(front);
  const backName = back.name;
  const frontName = front.name;
  return {
    segments: [back, front],
    length: backLength + frontLength,
    landmarks: [
      { name: "centerBack", arcLengthFromCenterBack: 0, point: centerBack, edgeName: backName, t: 0 },
      { name: "shoulder", arcLengthFromCenterBack: backLength, point: shoulder, edgeName: backName, t: 1 },
      { name: "centerFront", arcLengthFromCenterBack: backLength + frontLength, point: centerFront, edgeName: frontName, t: 1 },
    ],
  };
}

function issue(code: PoloCollarIssueCode, field: string, text: string): PoloCollarIssue {
  return { code, field, text };
}

function sampleEdge(edge: Edge, segments = 24): Point[] {
  if (edge.kind === "line") return [edge.start, edge.end];
  return Array.from({ length: segments + 1 }, (_, index) => cubicPoint(edge.curve, index / segments));
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return Math.min(a.x, b.x) - EPSILON <= c.x && c.x <= Math.max(a.x, b.x) + EPSILON &&
    Math.min(a.y, b.y) - EPSILON <= c.y && c.y <= Math.max(a.y, b.y) + EPSILON;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  const proper = ((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
    ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON));
  if (proper) return true;
  return Math.abs(abC) <= EPSILON && onSegment(a, b, c) ||
    Math.abs(abD) <= EPSILON && onSegment(a, b, d) ||
    Math.abs(cdA) <= EPSILON && onSegment(c, d, a) ||
    Math.abs(cdB) <= EPSILON && onSegment(c, d, b);
}

function outlineSelfIntersects(outline: PoloCollarOutline): boolean {
  const points = [
    ...outline.base.segments.flatMap((edge, index) => sampleEdge(edge, 24).slice(index === 0 ? 0 : 1)),
    ...sampleEdge(outline.frontTip).slice(1),
    ...sampleEdge(outline.outer).slice(1),
    ...sampleEdge(outline.centerBack).slice(1),
  ];
  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = i + 1; j < points.length - 1; j += 1) {
      if (j === i + 1 || (i === 0 && j === points.length - 2)) continue;
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) return true;
    }
  }
  return false;
}

function pathReverses(path: PoloSeamPath): boolean {
  const points = path.segments.flatMap((edge, index) => sampleEdge(edge, 24).slice(index === 0 ? 0 : 1));
  return points.some((current, index) => index > 0 && current.x < points[index - 1].x - 0.001);
}

function outputFinite(geometry: PoloCollarGeometry): boolean {
  const edges = [
    ...geometry.lowerStand.segments,
    ...geometry.upperStand.segments,
    ...geometry.collarBase.segments,
    geometry.collar.centerBack,
    geometry.collar.frontTip,
    geometry.collar.outer,
  ];
  return edges.every(finiteEdge) && [
    ...geometry.lowerStand.landmarks,
    ...geometry.upperStand.landmarks,
    ...geometry.collarBase.landmarks,
  ].every((landmark) => finitePoint(landmark.point) && Number.isFinite(landmark.arcLengthFromCenterBack));
}

/**
 * Build the shaped stand/collar facts for one drafted size.
 *
 * The result intentionally preserves invalid finite choices as finite
 * geometry plus explicit issues. That lets later guidance name the raw option
 * instead of clamping it or losing the draft. Non-finite source geometry has
 * no truthful fallback and returns `geometry: null`.
 */
export function buildPoloCollarGeometry(
  neckline: PoloNecklineInputs,
  options: PoloCollarOptions,
): PoloCollarGeometryResult {
  const issues: PoloCollarIssue[] = [];
  const inputEdges = [neckline.back, neckline.front];
  if (!inputEdges.every(finiteEdge) || !Object.values(options).every(Number.isFinite)) {
    issues.push(issue("non-finite-input", "polo-collar", "Polo collar geometry needs finite neckline coordinates and finite collar options."));
    return { geometry: null, issues };
  }
  if (edgeLength(neckline.back) <= EPSILON || edgeLength(neckline.front) <= EPSILON) {
    issues.push(issue("empty-neckline", "polo-collar", "The front and back neckline interfaces must both have positive measured length."));
    return { geometry: null, issues };
  }
  if (options.standHeight < 0 || options.standFrontRise < 0 || options.collarLeafDepth < 0 || options.collarPointExtension < 0) {
    issues.push(issue("negative-dimension", "polo-collar", "Collar and stand dimensions must be non-negative; restore the declared option ranges."));
  }
  if (options.standFrontRise > options.standHeight) {
    issues.push(issue("stand-rise-exceeds-height", "standFrontRise", `Stand front rise (${options.standFrontRise} cm) exceeds stand height (${options.standHeight} cm); reduce rise or increase stand height.`));
  }

  const backStart = edgeStart(neckline.back);
  const backEnd = edgeEnd(neckline.back);
  const frontEnd = edgeEnd(neckline.front);
  const normalizedBack = mapEdge(neckline.back, (value) => point(value.x - backStart.x, value.y - backStart.y), "backNeckline");
  const normalizedFrontForward = mapEdge(neckline.front, (value) => point(
    backEnd.x - backStart.x + (frontEnd.x - value.x),
    backEnd.y - backStart.y + (value.y - frontEnd.y),
  ), "frontNeckline");
  const normalizedFront = reversePoloEdge(normalizedFrontForward, "frontNeckline");
  const frontRisen = frontRiseEdge(normalizedFront, options.standFrontRise, "frontNeckline");
  const frontTarget = edgeLength(neckline.front);
  const anchorX = edgeStart(frontRisen).x;
  const solved = solveHorizontalScale(frontRisen, frontTarget, anchorX);
  if (!solved.solved) {
    issues.push(issue("front-rise-unsolved", "standFrontRise", "The selected front rise cannot preserve the drafted front neckline length; reduce the rise or restore the declared range."));
  }
  const shapedFront = scaleX(frontRisen, anchorX, solved.scale, "frontNeckline");
  const lowerStand = seamPath(normalizedBack, shapedFront);
  const upperStand = seamPath(
    translateEdge(normalizedBack, 0, -options.standHeight, "backCollar"),
    upperFrontEdge(shapedFront, options.standHeight, options.standFrontRise, "frontCollar"),
  );
  const collarBase = seamPath(
    translateEdge(upperStand.segments[0], 0, 0, "backCollarBase"),
    translateEdge(upperStand.segments[1], 0, 0, "frontCollarBase"),
  );

  const baseCenterBack = collarBase.landmarks[0].point;
  const baseCenterFront = collarBase.landmarks[2].point;
  const outerCenterBack = point(baseCenterBack.x, baseCenterBack.y + options.collarLeafDepth);
  const tip = point(baseCenterFront.x + options.collarPointExtension, baseCenterFront.y + options.collarLeafDepth);
  const collar: PoloCollarOutline = {
    base: collarBase,
    centerBack: { kind: "line", name: "centerBack", start: outerCenterBack, end: baseCenterBack },
    frontTip: { kind: "line", name: "frontTip", start: baseCenterFront, end: tip },
    outer: {
      kind: "curve",
      name: "outer",
      curve: {
        start: tip,
        control1: point(tip.x - options.collarPointExtension * 0.35, tip.y),
        control2: point(outerCenterBack.x + (baseCenterFront.x - baseCenterBack.x) * 0.2, outerCenterBack.y),
        end: outerCenterBack,
      },
    },
  };

  if (options.collarPointExtension * 2 >= options.collarLeafDepth && options.collarLeafDepth >= 0) {
    issues.push(issue("collar-point-dominates", "collarPointExtension", `Collar point extension (${options.collarPointExtension} cm) overwhelms the leaf depth (${options.collarLeafDepth} cm); reduce the extension or increase leaf depth.`));
  }
  if (pathReverses(lowerStand) || pathReverses(upperStand)) {
    issues.push(issue("seam-reverses", "polo-collar", "The shaped stand seam reverses along the centre-back to centre-front path; restore the nearest declared collar option range."));
  }
  if (outlineSelfIntersects(collar)) {
    issues.push(issue("collar-outline-self-intersects", "collarPointExtension", "The collar outline self-intersects; reduce point extension or increase leaf depth."));
  }

  const geometry: PoloCollarGeometry = {
    valid: issues.length === 0,
    issues,
    lowerStand,
    upperStand,
    collarBase,
    collar,
    targetNecklineLength: edgeLength(neckline.back) + edgeLength(neckline.front),
  };
  if (!outputFinite(geometry)) {
    issues.push(issue("non-finite-output", "polo-collar", "The collar solver produced non-finite geometry; restore the nearest declared option ranges."));
    return { geometry: null, issues };
  }
  return { geometry: { ...geometry, valid: issues.length === 0, issues }, issues };
}
