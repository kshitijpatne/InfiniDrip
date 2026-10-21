import { cubicPoint, point, type Point } from "../geometry";
import { allowanceFor } from "./allowance";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
import { edgeEnd, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import type { JeansOptions } from "./jeans-contract";
import { JEANS_ALLOWANCES } from "./jeans-tables";

export const JEANS_POCKET_KEEP_OUT_CM = allowanceFor(JEANS_ALLOWANCES, "pocketTop");

const OPTION_RANGES = {
  coinPocketWidth: [5, 10],
  coinPocketHeight: [5, 10],
  backPocketWidth: [10, 20],
  backPocketHeight: [10, 22],
  backPocketDrop: [2, 15],
  backPocketOffset: [2, 15],
} as const;

type PocketOption = keyof typeof OPTION_RANGES;
type LineEdge = Extract<Edge, { readonly kind: "line" }>;
type CurveEdge = Extract<Edge, { readonly kind: "curve" }>;
type PlacementLineMark = Extract<PatternMark, { readonly start: Point; readonly end: Point }> & {
  readonly kind: "placementLine";
};
type PointPlacementMark = Extract<PatternMark, { readonly at: Point }>;

interface RectPocketPiece extends Omit<Piece, "edges" | "marks"> {
  readonly edges: readonly LineEdge[];
  readonly marks: readonly PointPlacementMark[];
}

interface PocketRect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface JeansCoinBackPocketPieces {
  readonly facingExtensionRight: Piece;
  readonly coinPocket: Piece;
  readonly backPocketLeft: Piece;
  readonly backPocketRight: Piece;
  readonly backLowerLeft: Piece;
  readonly backLowerRight: Piece;
}

function requireOptionRange(value: number, name: PocketOption): void {
  const [minimum, maximum] = OPTION_RANGES[name];
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be from ${minimum} to ${maximum} cm; received ${String(value)}.`);
  }
}

function requireLine(piece: Piece, name: string): LineEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "line") throw new RangeError(`Jeans pocket host requires straight edge "${name}".`);
  return edge;
}

function requireCurve(piece: Piece, name: string): CurveEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "curve") throw new RangeError(`Jeans pocket host requires curved edge "${name}".`);
  return edge;
}

function derivativeRoots(values: readonly [number, number, number, number]): number[] {
  const [start, control1, control2, end] = values;
  const a = -start + 3 * control1 - 3 * control2 + end;
  const b = 2 * (start - 2 * control1 + control2);
  const c = control1 - start;
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b - root) / (2 * a), (-b + root) / (2 * a)];
}

function maximumCurveY(curve: CurveEdge["curve"], fromT = 0, toT = 1): number {
  let maximum = Math.max(cubicPoint(curve, fromT).y, cubicPoint(curve, toT).y);
  const roots = derivativeRoots([
    curve.start.y,
    curve.control1.y,
    curve.control2.y,
    curve.end.y,
  ]);
  for (const t of roots) {
    if (t > fromT && t < toT) maximum = Math.max(maximum, cubicPoint(curve, t).y);
  }
  return maximum;
}

function parameterAtX(curve: CurveEdge["curve"], x: number): number {
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (cubicPoint(curve, middle).x < x) lower = middle;
    else upper = middle;
  }
  return (lower + upper) / 2;
}

function maximumYokeYInSpan(yoke: CurveEdge, left: number, right: number): number {
  const seamLeft = Math.max(left, yoke.curve.start.x);
  const seamRight = Math.min(right, yoke.curve.end.x);
  if (seamLeft > seamRight) {
    throw new RangeError("Back pocket does not overlap the lower-yoke seam; increase its inboard offset or reduce its width.");
  }
  return maximumCurveY(
    yoke.curve,
    parameterAtX(yoke.curve, seamLeft),
    parameterAtX(yoke.curve, seamRight),
  );
}

function sideEdges(piece: Piece): LineEdge[] {
  return piece.edges.filter((edge): edge is LineEdge => edge.kind === "line" && edge.name.startsWith("side"));
}

function minimumSideXInRange(piece: Piece, top: number, bottom: number): number {
  const values: number[] = [];
  for (const edge of sideEdges(piece)) {
    const low = Math.max(top, Math.min(edge.start.y, edge.end.y));
    const high = Math.min(bottom, Math.max(edge.start.y, edge.end.y));
    if (low > high) continue;
    const yValues = low === high ? [low] : [low, high];
    for (const y of yValues) {
      if (edge.start.y === edge.end.y) values.push(Math.min(edge.start.x, edge.end.x));
      else {
        const t = (y - edge.start.y) / (edge.end.y - edge.start.y);
        values.push(edge.start.x + (edge.end.x - edge.start.x) * t);
      }
    }
  }
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new RangeError("Back pocket has no finite side seam across its containment envelope.");
  }
  return Math.min(...values);
}

function rectangleMarks(prefix: string, rect: PocketRect): PlacementLineMark[] {
  const topLeft = point(rect.left, rect.top);
  const topRight = point(rect.right, rect.top);
  const bottomRight = point(rect.right, rect.bottom);
  const bottomLeft = point(rect.left, rect.bottom);
  return [
    lineMark("placementLine", `${prefix}-top`, topLeft, topRight) as PlacementLineMark,
    lineMark("placementLine", `${prefix}-outer`, topRight, bottomRight) as PlacementLineMark,
    lineMark("placementLine", `${prefix}-bottom`, bottomRight, bottomLeft) as PlacementLineMark,
    lineMark("placementLine", `${prefix}-inner`, bottomLeft, topLeft) as PlacementLineMark,
  ];
}

function mirrorPlacementLines(marks: readonly PlacementLineMark[]): PlacementLineMark[] {
  return marks.map((mark) => lineMark(
    mark.kind,
    mark.name.replace("left", "right"),
    mirrorPoint(mark.start),
    mirrorPoint(mark.end),
  ) as PlacementLineMark);
}

function mirrorPoint(value: Point): Point {
  return point(-value.x, value.y);
}

function mirrorPiece(piece: RectPocketPiece, name: string): RectPocketPiece {
  return {
    ...piece,
    name,
    edges: piece.edges.map((edge) => ({
      ...edge,
      start: mirrorPoint(edge.start),
      end: mirrorPoint(edge.end),
    })),
    marks: piece.marks.map((mark) => ({
      ...mark,
      name: mark.name.replace("left", "right"),
      at: mirrorPoint(mark.at),
    })),
  };
}

function pocketPiece(name: string, rect: PocketRect): RectPocketPiece {
  const topLeft = point(rect.left, rect.top);
  const topRight = point(rect.right, rect.top);
  const bottomRight = point(rect.right, rect.bottom);
  const bottomLeft = point(rect.left, rect.bottom);
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "pocketTop", start: topLeft, end: topRight },
      { kind: "line", name: "pocketOuter", start: topRight, end: bottomRight },
      { kind: "line", name: "pocketBottom", start: bottomRight, end: bottomLeft },
      { kind: "line", name: "pocketInner", start: bottomLeft, end: topLeft },
    ],
    marks: [
      pointMark("placementPoint", `${name}-top-outer`, topLeft) as PointPlacementMark,
      pointMark("placementPoint", `${name}-top-inner`, topRight) as PointPlacementMark,
    ],
  };
}

function withMarks(piece: Piece, marks: readonly PatternMark[]): Piece {
  return { ...piece, marks: [...(piece.marks ?? []), ...marks] };
}

function buildCoinFacingExtension(
  facingRight: Piece,
  options: JeansOptions,
): { readonly extension: Piece; readonly coinPocket: Piece } {
  requireOptionRange(options.coinPocketWidth, "coinPocketWidth");
  requireOptionRange(options.coinPocketHeight, "coinPocketHeight");
  const facingSide = requireLine(facingRight, "sideFacing");
  const sideWaist = edgeStart(facingSide);
  const sideDrop = edgeEnd(facingSide);
  const topAllowance = allowanceFor(JEANS_ALLOWANCES, "pocketTop", "jeans coin pocket");
  const sideAllowance = allowanceFor(JEANS_ALLOWANCES, "pocketInner", "jeans coin pocket");
  const bottomAllowance = allowanceFor(JEANS_ALLOWANCES, "pocketBottom", "jeans coin pocket");
  const top = sideDrop.y + topAllowance;
  const bottom = top + options.coinPocketHeight;
  const panelBottom = bottom + bottomAllowance;

  const outerX = Math.max(sideWaist.x, sideDrop.x);
  const innerX = outerX + options.coinPocketWidth + 2 * sideAllowance;
  const hostRect: PocketRect = {
    left: outerX + sideAllowance,
    right: outerX + sideAllowance + options.coinPocketWidth,
    top,
    bottom,
  };
  const joinStart = sideDrop;
  const joinEnd = sideWaist;
  // Step the descending outer edge one pocket allowance beyond the widest
  // endpoint of the joined facing seam. This keeps the seam and top edge apart
  // while preserving the coin pocket's existing host rectangle.
  const waistRelief = point(Math.min(sideWaist.x, sideDrop.x) - sideAllowance, sideWaist.y);
  const outerBottom = point(waistRelief.x, panelBottom);
  const innerBottom = point(innerX, panelBottom);
  const innerTop = point(innerX, sideDrop.y);
  const extension: Piece = {
    name: "jeans right coin-pocket facing extension",
    onFold: false,
    edges: [
      { kind: "line", name: "facingJoin", start: joinStart, end: joinEnd },
      { kind: "line", name: "extensionWaistRelief", start: joinEnd, end: waistRelief },
      { kind: "line", name: "extensionOuter", start: waistRelief, end: outerBottom },
      { kind: "line", name: "extensionBottom", start: outerBottom, end: innerBottom },
      { kind: "line", name: "extensionInner", start: innerBottom, end: innerTop },
      { kind: "line", name: "extensionTop", start: innerTop, end: joinStart },
    ],
    marks: rectangleMarks("coin-pocket-placement", hostRect),
  };
  return {
    extension,
    coinPocket: pocketPiece("jeans coin pocket", hostRect),
  };
}

function backPocketRect(
  lower: Piece,
  options: JeansOptions,
): PocketRect {
  const yoke = requireCurve(lower, "yokeJoin");
  const yokeCoordinates = [
    yoke.curve.start,
    yoke.curve.control1,
    yoke.curve.control2,
    yoke.curve.end,
  ];
  if (!yokeCoordinates.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))) {
    return { left: Number.NaN, right: Number.NaN, top: Number.NaN, bottom: Number.NaN };
  }
  const center = edgeStart(requireLine(lower, "centerBackLower"));
  const knee = edgeEnd(requireLine(lower, "sideThighToKnee"));
  const hem = edgeStart(requireLine(lower, "hem"));
  let top = yoke.curve.start.y + options.backPocketDrop;
  let left = 0;
  let right = 0;
  let minSideX = 0;
  let resolved = false;
  for (let iteration = 0; iteration < 16; iteration += 1) {
    minSideX = minimumSideXInRange(
      lower,
      top - JEANS_POCKET_KEEP_OUT_CM,
      top + options.backPocketHeight + JEANS_POCKET_KEEP_OUT_CM,
    );
    right = minSideX - options.backPocketOffset;
    left = right - options.backPocketWidth;
    const yokeMax = maximumYokeYInSpan(yoke, left - JEANS_POCKET_KEEP_OUT_CM, right + JEANS_POCKET_KEEP_OUT_CM);
    const nextTop = yokeMax + options.backPocketDrop;
    if (Math.abs(nextTop - top) < 1e-9) {
      top = nextTop;
      resolved = true;
      break;
    }
    top = nextTop;
  }
  if (!resolved) {
    throw new RangeError("Back pocket placement did not resolve against the live side and yoke seams; adjust its width, offset, or drop.");
  }

  const bottom = top + options.backPocketHeight;
  minSideX = minimumSideXInRange(lower, top - JEANS_POCKET_KEEP_OUT_CM, bottom + JEANS_POCKET_KEEP_OUT_CM);
  right = minSideX - options.backPocketOffset;
  left = right - options.backPocketWidth;
  if (left - JEANS_POCKET_KEEP_OUT_CM < center.x) {
    throw new RangeError(`Back pocket and its ${JEANS_POCKET_KEEP_OUT_CM} cm allowance envelope reach the center-back seam; increase backPocketOffset or reduce backPocketWidth.`);
  }
  if (bottom + JEANS_POCKET_KEEP_OUT_CM >= knee.y) {
    throw new RangeError(`Back pocket and its ${JEANS_POCKET_KEEP_OUT_CM} cm allowance envelope reach the lower-leg station; reduce backPocketHeight or backPocketDrop.`);
  }
  if (bottom + JEANS_POCKET_KEEP_OUT_CM >= hem.y) {
    throw new RangeError(`Back pocket and its ${JEANS_POCKET_KEEP_OUT_CM} cm allowance envelope reach the hem; reduce backPocketHeight or backPocketDrop.`);
  }
  return { left, right, top, bottom };
}

export function buildJeansCoinBackPockets(
  facingRight: Piece,
  backLowerLeft: Piece,
  backLowerRight: Piece,
  options: JeansOptions,
): JeansCoinBackPocketPieces {
  requireOptionRange(options.backPocketWidth, "backPocketWidth");
  requireOptionRange(options.backPocketHeight, "backPocketHeight");
  requireOptionRange(options.backPocketDrop, "backPocketDrop");
  requireOptionRange(options.backPocketOffset, "backPocketOffset");

  const coin = buildCoinFacingExtension(facingRight, options);
  const rect = backPocketRect(backLowerLeft, options);
  const leftPocket = pocketPiece("jeans back patch pocket left", rect);
  const rightPocket = mirrorPiece(leftPocket, "jeans back patch pocket right");
  const hostMarksLeft = rectangleMarks("left-back-pocket-placement", rect);
  const hostMarksRight = mirrorPlacementLines(hostMarksLeft);

  return {
    facingExtensionRight: coin.extension,
    coinPocket: coin.coinPocket,
    backPocketLeft: leftPocket,
    backPocketRight: rightPocket,
    backLowerLeft: withMarks(backLowerLeft, hostMarksLeft),
    backLowerRight: withMarks(backLowerRight, hostMarksRight),
  };
}
