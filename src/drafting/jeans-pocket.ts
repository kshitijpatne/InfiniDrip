import { cubicLength, cubicPoint, point, type Point } from "../geometry";
import { pieceEdge, type Edge, type Piece } from "./piece";
import type { JeansOptions } from "./jeans-contract";

type CurveEdge = Extract<Edge, { readonly kind: "curve" }>;

export interface JeansFrontPocketPieces {
  readonly front: Piece;
  readonly facing: Piece;
  readonly bag: Piece;
  readonly stay: Piece;
}

const OPTION_RANGES = {
  frontPocketOpening: [10, 22],
  frontPocketDrop: [2, 12],
  frontPocketCurveDepth: [1, 6],
  frontPocketBagDepth: [16, 35],
} as const;

const INNER_EDGE_NAMES = new Set([
  "centerFront",
  "crotch",
  "innerThighToCrotch",
  "inseamUpper",
  "inseamLower",
]);

const POCKET_STAY_WIDTH = 1.5; // Digital maximum strip width; not a sourced stay standard.
const BAG_EDGE_CLEARANCE = 2.25; // Digital in-panel placement margin; not a seam allowance.

function straightEdge(front: Piece, name: string): Extract<Edge, { readonly kind: "line" }> {
  const edge = pieceEdge(front, name);
  if (edge.kind !== "line") throw new Error(`Jeans front pocket requires "${name}" to be a straight edge.`);
  return edge;
}

function requireOptionRange(value: number, name: keyof typeof OPTION_RANGES): void {
  const [minimum, maximum] = OPTION_RANGES[name];
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be a finite value from ${minimum} to ${maximum} cm; received ${String(value)}.`);
  }
}

function makeOpening(start: Point, end: Point, depth: number): CurveEdge {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.hypot(dx, dy);
  const normal = point(-dy / chord, dx / chord);
  return {
    kind: "curve",
    name: "pocketOpening",
    curve: {
      start,
      control1: point(start.x + dx * 0.3 + normal.x * depth, start.y + dy * 0.3 + normal.y * depth),
      control2: point(start.x + dx * 0.72 + normal.x * depth, start.y + dy * 0.72 + normal.y * depth),
      end,
    },
  };
}

function solveOpening(
  end: Point,
  targetLength: number,
  depth: number,
): CurveEdge {
  const atCenterFront = makeOpening(point(0, 0), end, depth);
  const atSide = makeOpening(point(end.x, 0), end, depth);
  const maximumLength = cubicLength(atCenterFront.curve);
  const minimumLength = cubicLength(atSide.curve);
  if (!Number.isFinite(maximumLength) || !Number.isFinite(minimumLength) ||
      targetLength < minimumLength || targetLength > maximumLength) {
    throw new RangeError(
      `Jeans front pocket opening ${targetLength} cm cannot fit the selected ${end.y} cm drop and ${depth} cm scoop depth; adjust the opening, drop, or scoop depth.`,
    );
  }

  let lower = 0;
  let upper = end.x;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const middle = (lower + upper) / 2;
    const candidate = makeOpening(point(middle, 0), end, depth);
    if (cubicLength(candidate.curve) > targetLength) lower = middle;
    else upper = middle;
  }
  return makeOpening(point((lower + upper) / 2, 0), end, depth);
}

function reverseCurve(edge: CurveEdge, name: string): CurveEdge {
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

function pointsAtY(edge: Edge, y: number): number[] {
  if (edge.kind === "line") {
    const low = Math.min(edge.start.y, edge.end.y);
    const high = Math.max(edge.start.y, edge.end.y);
    if (y < low || y > high) return [];
    if (edge.start.y === edge.end.y) return [edge.start.x, edge.end.x];
    const t = (y - edge.start.y) / (edge.end.y - edge.start.y);
    return [edge.start.x + (edge.end.x - edge.start.x) * t];
  }

  const intersections: number[] = [];
  let previous = edge.curve.start;
  for (let index = 1; index <= 64; index += 1) {
    const current = cubicPoint(edge.curve, index / 64);
    const low = Math.min(previous.y, current.y);
    const high = Math.max(previous.y, current.y);
    if (y >= low && y <= high) {
      if (previous.y === current.y) intersections.push(previous.x, current.x);
      else {
        const t = (y - previous.y) / (current.y - previous.y);
        intersections.push(previous.x + (current.x - previous.x) * t);
      }
    }
    previous = current;
  }
  return intersections;
}

function boundaryXAtY(front: Piece, y: number, inner: boolean): number {
  const values = front.edges.flatMap((edge) => {
    const selected = inner
      ? INNER_EDGE_NAMES.has(edge.name)
      : edge.name.startsWith("side");
    return selected ? pointsAtY(edge, y) : [];
  });
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new RangeError(`Jeans front pocket bag has no finite ${inner ? "inner" : "side"} boundary at ${y} cm.`);
  }
  return inner ? Math.min(...values) : Math.max(...values);
}

function maximumCurveY(edge: CurveEdge): number {
  let maximum = edge.curve.start.y;
  for (let index = 1; index <= 64; index += 1) {
    maximum = Math.max(maximum, cubicPoint(edge.curve, index / 64).y);
  }
  return maximum;
}

function replaceFrontOpening(front: Piece, opening: CurveEdge, sideDrop: Point): Piece {
  const waist = straightEdge(front, "waist");
  const sideToYoke = straightEdge(front, "sideWaistToYoke");
  const yokeToHip = straightEdge(front, "sideYokeToHip");

  const start = opening.curve.start;
  const yoke = sideToYoke.end;
  const sideHip = yokeToHip.end;
  const edges: Edge[] = [];
  for (const edge of front.edges) {
    if (edge.name === "waist") {
      edges.push({ kind: "line", name: "waist", start: waist.start, end: start }, opening);
    } else if (edge.name === "sideWaistToYoke") {
      if (sideDrop.y < yoke.y) {
        edges.push({ kind: "line", name: "sidePocketDropToYoke", start: sideDrop, end: yoke });
      }
    } else if (edge.name === "sideYokeToHip") {
      if (sideDrop.y < yoke.y) edges.push(edge);
      else edges.push({ kind: "line", name: "sidePocketDropToHip", start: sideDrop, end: sideHip });
    } else {
      edges.push(edge);
    }
  }
  return { ...front, edges };
}

/** Replace the front's upper waist/side corner with one measured scoop cut.
 * All dimensions here are product-model values; no physical fit is implied. */
export function buildJeansFrontPocket(front: Piece, options: JeansOptions): JeansFrontPocketPieces {
  requireOptionRange(options.frontPocketOpening, "frontPocketOpening");
  requireOptionRange(options.frontPocketDrop, "frontPocketDrop");
  requireOptionRange(options.frontPocketCurveDepth, "frontPocketCurveDepth");
  requireOptionRange(options.frontPocketBagDepth, "frontPocketBagDepth");

  const sideWaistToYoke = straightEdge(front, "sideWaistToYoke");
  const sideYokeToHip = straightEdge(front, "sideYokeToHip");
  const sideWaist = sideWaistToYoke.start;
  const sideHip = sideYokeToHip.end;
  const sideDropRatio = options.frontPocketDrop / sideHip.y;
  if (!Number.isFinite(sideDropRatio) || sideDropRatio <= 0 || sideDropRatio >= 1) {
    throw new RangeError(`frontPocketDrop ${options.frontPocketDrop} cm must fall between the Jeans waist and hip stations.`);
  }
  const sideDrop = point(
    sideWaist.x + (sideHip.x - sideWaist.x) * sideDropRatio,
    options.frontPocketDrop,
  );
  const opening = solveOpening(sideDrop, options.frontPocketOpening, options.frontPocketCurveDepth);

  const facedFront = replaceFrontOpening(front, opening, sideDrop);
  const facing: Piece = {
    name: "jeans front pocket facing left",
    onFold: false,
    edges: [
      { kind: "line", name: "waistFacing", start: opening.curve.start, end: sideWaist },
      { kind: "line", name: "sideFacing", start: sideWaist, end: sideDrop },
      reverseCurve(opening, "opening"),
    ],
  };

  const bottomY = maximumCurveY(opening) + options.frontPocketBagDepth;
  const innerX = boundaryXAtY(front, bottomY, true);
  const sideX = boundaryXAtY(front, bottomY, false);
  const bottomLeft = point(innerX + BAG_EDGE_CLEARANCE, bottomY);
  const bottomRight = point(sideX - BAG_EDGE_CLEARANCE, bottomY);
  if (!(bottomLeft.x < bottomRight.x)) {
    throw new RangeError("Jeans front pocket bag does not fit between the front rise and side seam; reduce bag depth or opening/drop.");
  }
  const bag: Piece = {
    name: "jeans front pocket bag left",
    onFold: false,
    edges: [
      opening,
      { kind: "line", name: "bagRight", start: sideDrop, end: bottomRight },
      { kind: "line", name: "bagBottom", start: bottomRight, end: bottomLeft },
      { kind: "line", name: "bagClose", start: bottomLeft, end: opening.curve.start },
    ],
  };

  const stayWidth = Math.min(POCKET_STAY_WIDTH, opening.curve.start.x - 0.75, BAG_EDGE_CLEARANCE - 0.75);
  if (!(stayWidth > 0)) {
    throw new RangeError("The selected Jeans pocket opening leaves no room for the localized pocket stay; shorten the opening.");
  }
  const stayTop = point(opening.curve.start.x - stayWidth, 0);
  const stayBottom = point(bottomLeft.x - stayWidth, bottomY);
  const stay: Piece = {
    name: "jeans front pocket stay left",
    onFold: false,
    edges: [
      { kind: "line", name: "stayJoin", start: opening.curve.start, end: bottomLeft },
      { kind: "line", name: "stayLower", start: bottomLeft, end: stayBottom },
      { kind: "line", name: "stayInboard", start: stayBottom, end: stayTop },
      { kind: "line", name: "stayTop", start: stayTop, end: opening.curve.start },
    ],
  };

  return { front: facedFront, facing, bag, stay };
}
