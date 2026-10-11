import type { AllowanceSpec, Edge, Piece } from "../drafting";
import { allowanceFor } from "../drafting";
import type { CubicBezier, Point } from "../geometry";
import { cubicPoint } from "../geometry";
import type { Polyline } from "./layout";

export const CUT_GEOMETRY_ALGORITHM = "adaptive-normal-offset/1" as const;

const CHORD_TOLERANCE_CM = 0.0001;
const MAX_PARAMETER_SPAN = 1 / 64;
const MAX_DEPTH = 18;
const MAX_POINTS = 12000;
const EPSILON = 1e-10;

type Vector = Point;

function add(a: Point, b: Point): Point { return { x: a.x + b.x, y: a.y + b.y }; }
function subtract(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y }; }
function scale(a: Point, n: number): Point { return { x: a.x * n, y: a.y * n }; }
function cross(a: Point, b: Point): number { return a.x * b.y - a.y * b.x; }
function length(a: Point): number { return Math.hypot(a.x, a.y); }
function distance(a: Point, b: Point): number { return length(subtract(a, b)); }

function tangent(edge: Edge, t: number): Vector {
  if (edge.kind === "line") return subtract(edge.end, edge.start);
  const c = edge.curve;
  const u = 1 - t;
  return {
    x: 3 * u * u * (c.control1.x - c.start.x) + 6 * u * t * (c.control2.x - c.control1.x) + 3 * t * t * (c.end.x - c.control2.x),
    y: 3 * u * u * (c.control1.y - c.start.y) + 6 * u * t * (c.control2.y - c.control1.y) + 3 * t * t * (c.end.y - c.control2.y),
  };
}

function sourcePoint(edge: Edge, t: number): Point {
  return edge.kind === "line"
    ? add(edge.start, scale(subtract(edge.end, edge.start), t))
    : cubicPoint(edge.curve, t);
}

function offsetPoint(edge: Edge, t: number, amount: number, sign: number): Point {
  const direction = tangent(edge, t);
  const magnitude = length(direction);
  if (!Number.isFinite(magnitude) || magnitude < EPSILON) {
    throw new Error(`Cannot offset degenerate tangent on edge "${edge.name}"`);
  }
  const rightNormal = { x: direction.y / magnitude, y: -direction.x / magnitude };
  const point = add(sourcePoint(edge, t), scale(rightNormal, sign * amount));
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`Cannot form a finite offset on edge "${edge.name}"`);
  }
  return point;
}

function distanceToChord(point: Point, start: Point, end: Point, fraction: number): number {
  const onChord = add(start, scale(subtract(end, start), fraction));
  return distance(point, onChord);
}

function adaptiveCurveParameters(edge: Extract<Edge, { kind: "curve" }>, amount: number, sign: number): number[] {
  const parameters = [0];
  const subdivide = (t0: number, p0: Point, t1: number, p1: Point, depth: number): void => {
    const span = t1 - t0;
    const q1 = t0 + span * 0.25;
    const middle = t0 + span * 0.5;
    const q3 = t0 + span * 0.75;
    const p25 = offsetPoint(edge, q1, amount, sign);
    const p50 = offsetPoint(edge, middle, amount, sign);
    const p75 = offsetPoint(edge, q3, amount, sign);
    const deviation = Math.max(
      distanceToChord(p25, p0, p1, 0.25),
      distanceToChord(p50, p0, p1, 0.5),
      distanceToChord(p75, p0, p1, 0.75),
    );
    if (deviation <= CHORD_TOLERANCE_CM && span <= MAX_PARAMETER_SPAN) {
      parameters.push(t1);
      if (parameters.length > MAX_POINTS) throw new Error(`Adaptive offset point limit exceeded on edge "${edge.name}"`);
      return;
    }
    if (depth >= MAX_DEPTH) throw new Error(`Adaptive offset did not converge on edge "${edge.name}"`);
    subdivide(t0, p0, middle, p50, depth + 1);
    subdivide(middle, p50, t1, p1, depth + 1);
  };
  subdivide(0, offsetPoint(edge, 0, amount, sign), 1, offsetPoint(edge, 1, amount, sign), 0);
  return parameters;
}

function intersectOffsetTangents(previous: Edge, current: Edge, amountPrevious: number, amountCurrent: number, sign: number): Point[] {
  const previousPoint = offsetPoint(previous, 1, amountPrevious, sign);
  const currentPoint = offsetPoint(current, 0, amountCurrent, sign);
  const previousDirection = tangent(previous, 1);
  const currentDirection = tangent(current, 0);
  const denominator = cross(previousDirection, currentDirection);
  if (Math.abs(denominator) < EPSILON) {
    if (distance(previousPoint, currentPoint) < EPSILON) return [scale(add(previousPoint, currentPoint), 0.5)];
    return [previousPoint, currentPoint];
  }
  const parameter = cross(subtract(currentPoint, previousPoint), currentDirection) / denominator;
  const intersection = add(previousPoint, scale(previousDirection, parameter));
  if (!Number.isFinite(intersection.x) || !Number.isFinite(intersection.y)) {
    throw new Error(`Offset join is not finite between "${previous.name}" and "${current.name}"`);
  }
  const bound = Math.max(1, amountPrevious, amountCurrent) * 1000;
  if (distance(intersection, previousPoint) > bound || distance(intersection, currentPoint) > bound) {
    throw new Error(`Offset join is unbounded between "${previous.name}" and "${current.name}"`);
  }
  return [intersection];
}

function signedArea(points: readonly Point[]): number {
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]!;
    const b = points[(index + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function properCrossing(a: Point, b: Point, c: Point, d: Point): boolean {
  const ab = subtract(b, a);
  const cd = subtract(d, c);
  const denominator = cross(ab, cd);
  if (Math.abs(denominator) < EPSILON) return false;
  const ca = subtract(c, a);
  const t = cross(ca, cd) / denominator;
  const u = cross(ca, ab) / denominator;
  return t > EPSILON && t < 1 - EPSILON && u > EPSILON && u < 1 - EPSILON;
}

function trimOffsetLoops(points: Point[]): Point[] {
  let current = points;
  for (;;) {
    let trimmed: Point[] | null = null;
    const count = current.length;
    for (let i = 0; i < count && trimmed === null; i += 1) {
      const nextI = (i + 1) % count;
      for (let j = i + 2; j < count; j += 1) {
        if (i === 0 && j === count - 1) continue;
        const a = current[i]!;
        const b = current[nextI]!;
        const c = current[j]!;
        const d = current[(j + 1) % count]!;
        if (!properCrossing(a, b, c, d)) continue;
        const ab = subtract(b, a);
        const cd = subtract(d, c);
        const denominator = cross(ab, cd);
        const t = cross(subtract(c, a), cd) / denominator;
        const hit = add(a, scale(ab, t));
        trimmed = [...current.slice(0, i + 1), hit, ...current.slice(j + 1)];
        break;
      }
    }
    if (trimmed === null) return current;
    current = trimmed;
  }
}

function offsetWalk(piece: Piece, spec: AllowanceSpec, sign: number): Point[] {
  const edges = piece.edges;
  if (edges.length < 2) throw new Error(`Piece "${piece.name}" requires at least two edges`);
  const amounts = edges.map((edge) => allowanceFor(spec, edge.name, piece.name));
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    throw new Error(`Piece "${piece.name}" has an invalid seam allowance`);
  }
  const result: Point[] = [];
  for (let index = 0; index < edges.length; index += 1) {
    const previousIndex = (index - 1 + edges.length) % edges.length;
    const edge = edges[index]!;
    const previous = edges[previousIndex]!;
    result.push(...intersectOffsetTangents(previous, edge, amounts[previousIndex]!, amounts[index]!, sign));
    if (edge.kind === "curve") {
      const params = adaptiveCurveParameters(edge, amounts[index]!, sign);
      for (const parameter of params) result.push(offsetPoint(edge, parameter, amounts[index]!, sign));
    } else {
      result.push(offsetPoint(edge, 0, amounts[index]!, sign));
      result.push(offsetPoint(edge, 1, amounts[index]!, sign));
    }
    if (result.length > MAX_POINTS) throw new Error(`Adaptive offset point limit exceeded on piece "${piece.name}"`);
  }
  return result;
}

/** Candidate-only, adaptive true-normal offset. The legacy renderer/exporter is untouched. */
export function adaptiveSeamAllowance(piece: Piece, spec: AllowanceSpec): Polyline {
  const sourcePoints = piece.edges.flatMap((edge) => edge.kind === "line"
    ? [edge.start, edge.end]
    : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]);
  if (sourcePoints.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new Error(`Piece "${piece.name}" has non-finite source geometry`);
  }
  const right = trimOffsetLoops(offsetWalk(piece, spec, 1));
  const left = trimOffsetLoops(offsetWalk(piece, spec, -1));
  const candidates = [right, left].sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
  const outside = candidates[0]!;
  if (Math.abs(signedArea(outside)) < EPSILON) {
    throw new Error(`Adaptive offset is not a simple closed outline for piece "${piece.name}"`);
  }
  return outside;
}

export function adaptiveCurvePoint(curve: CubicBezier, t: number, allowance: number, sign = 1): Point {
  const edge: Edge = { kind: "curve", name: "curve", curve };
  return offsetPoint(edge, t, allowance, sign);
}
