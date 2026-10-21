import { cubicPoint, distance, point, type Point } from "../geometry";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
import { JEANS_ALLOWANCES } from "./jeans-tables";
import { edgeLength, pieceEdge, type Edge, type Piece } from "./piece";
import { edgeRef, iface, type Stitch } from "./stitch";
import type { JeansOptions } from "./jeans-contract";

export const JEANS_FLY_POCKET_KEEPOUT_CM = JEANS_ALLOWANCES.default;
const FLY_LENGTH_RANGE = [8, 25] as const;
const EXTENSION_WIDTH_RANGE = [2.5, 5] as const;
const RISE_CLEARANCE_CM = 1;
const WAIST_EDGE_REMAINDER_CM = 1;
const CURVE_CLEARANCE_SAMPLES = 256;

type LineEdge = Extract<Edge, { readonly kind: "line" }>;
type CurveEdge = Extract<Edge, { readonly kind: "curve" }>;

export interface JeansFlyPieces {
  readonly frontLeft: Piece;
  readonly frontRight: Piece;
  readonly facingUnderlapRight: Piece;
  readonly shield: Piece;
  readonly stitches: readonly Stitch[];
}

function requireRange(value: number, field: string, range: readonly [number, number]): void {
  if (!Number.isFinite(value) || value < range[0] || value > range[1]) {
    throw new RangeError(`${field} must be a finite value from ${range[0]} to ${range[1]} cm; received ${String(value)}.`);
  }
}

function lineEdge(piece: Piece, name: string): LineEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "line") {
    throw new RangeError(`Jeans fly requires the ${piece.name} "${name}" edge to be straight.`);
  }
  return edge;
}

function curveEdge(piece: Piece, name: string): CurveEdge {
  const edge = pieceEdge(piece, name);
  if (edge.kind !== "curve") {
    throw new RangeError(`Jeans fly requires the ${piece.name} "${name}" pocket edge to be curved.`);
  }
  return edge;
}

function finitePoint(value: Point): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function withMarks(piece: Piece, marks: readonly PatternMark[]): Piece {
  return { ...piece, marks: [...(piece.marks ?? []), ...marks] };
}

function distanceFromCurveToExtension(curve: CurveEdge, width: number, length: number): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= CURVE_CLEARANCE_SAMPLES; index += 1) {
    const sample = cubicPoint(curve.curve, index / CURVE_CLEARANCE_SAMPLES);
    const dx = Math.max(0, -sample.x, sample.x - width);
    const dy = Math.max(0, -sample.y, sample.y - length);
    minimum = Math.min(minimum, Math.hypot(dx, dy));
  }
  return minimum;
}

function extendWearerRightFront(front: Piece, width: number, length: number): Piece {
  const waist = lineEdge(front, "waist");
  const centerFront = lineEdge(front, "centerFront");
  const top = centerFront.end;
  const crotch = centerFront.start;

  if (![waist.start, waist.end, centerFront.start, centerFront.end, top, crotch].every(finitePoint)) {
    throw new RangeError("Jeans fly requires finite front waist and center-front geometry; adjust the front rise or measurements.");
  }
  if (crotch.x !== 0 || length > crotch.y - RISE_CLEARANCE_CM) {
    throw new RangeError(
      `flyLength ${length} cm must stop at least ${RISE_CLEARANCE_CM} cm above the live front crotch transition at ${crotch.y} cm; reduce flyLength or adjust the front rise.`,
    );
  }
  if (edgeLength(waist) - width < WAIST_EDGE_REMAINDER_CM) {
    throw new RangeError(
      `flyExtensionWidth ${width} cm leaves less than ${WAIST_EDGE_REMAINDER_CM} cm on the wearer-right waist edge; reduce flyExtensionWidth.`,
    );
  }

  const stop = point(0, length);
  const extendedEdges: Edge[] = [];
  for (const edge of front.edges) {
    if (edge.name === "waist") {
      const line = edge as LineEdge;
      extendedEdges.push({ ...line, start: point(width, top.y) });
    } else if (edge.name === "centerFront") {
      const line = edge as LineEdge;
      extendedEdges.push({ ...line, end: stop });
      extendedEdges.push(
        { kind: "line", name: "flyExtensionBottom", start: stop, end: point(width, length) },
        { kind: "line", name: "flyExtensionJoin", start: point(width, length), end: point(width, top.y) },
      );
    } else {
      extendedEdges.push(edge);
    }
  }

  return withMarks({ ...front, edges: extendedEdges }, [
    lineMark("foldLine", "flyExtensionFold", top, stop, "extension fold"),
    pointMark("placementPoint", "flyZipperTop", top, "zipper start"),
    pointMark("placementPoint", "flyZipperStop", stop, "zip stop"),
  ]);
}

function facingUnderlap(width: number, length: number): Piece {
  const topLeft = point(0, 0);
  const topRight = point(width, 0);
  const bottomRight = point(width, length);
  const bottomLeft = point(0, length);
  return {
    name: "jeans right fly facing and underlap",
    onFold: false,
    edges: [
      { kind: "line", name: "facingTop", start: topLeft, end: topRight },
      { kind: "line", name: "shieldJoin", start: topRight, end: bottomRight },
      { kind: "line", name: "facingBottom", start: bottomRight, end: bottomLeft },
      { kind: "line", name: "frontJoin", start: bottomLeft, end: topLeft },
    ],
    marks: [
      lineMark("placementLine", "zipperPlacement", point(width * 0.5, 0), point(width * 0.5, length), "zipper line"),
      pointMark("placementPoint", "zipperStopNotch", point(width * 0.5, length), "stop notch"),
    ],
  };
}

function zipperShield(width: number, length: number): Piece {
  const topLeft = point(0, 0);
  const topRight = point(width, 0);
  const bottomRight = point(width * 0.8, length);
  const bottomLeft = point(0, length);
  const tackLeft = width * 0.3;
  const tackRight = width * 0.7;
  return {
    name: "jeans fly shield",
    onFold: false,
    edges: [
      { kind: "line", name: "shieldTop", start: topLeft, end: topRight },
      { kind: "line", name: "shieldOuter", start: topRight, end: bottomRight },
      { kind: "line", name: "shieldBottom", start: bottomRight, end: bottomLeft },
      { kind: "line", name: "underlapJoin", start: bottomLeft, end: topLeft },
    ],
    marks: [
      lineMark("foldLine", "shieldFold", point(width * 0.5, 0), point(width * 0.4, length), "shield fold"),
      lineMark("placementLine", "flyBartackUpper", point(tackLeft, 1), point(tackRight, 1), "upper bartack"),
      lineMark("placementLine", "flyBartackLower", point(tackLeft, length - 1), point(tackRight, length - 1), "lower bartack"),
    ],
  };
}

/** Draft the jeans-specific asymmetric fly. Dimensions are digital product
 * inputs; the construction relationship is source-backed, not physical proof. */
export function buildJeansFly(
  frontLeft: Piece,
  frontRight: Piece,
  options: JeansOptions,
): JeansFlyPieces {
  requireRange(options.flyLength, "flyLength", FLY_LENGTH_RANGE);
  requireRange(options.flyExtensionWidth, "flyExtensionWidth", EXTENSION_WIDTH_RANGE);

  const pocketOpening = curveEdge(frontLeft, "pocketOpening");
  const pocketCoordinates = [
    pocketOpening.curve.start,
    pocketOpening.curve.control1,
    pocketOpening.curve.control2,
    pocketOpening.curve.end,
  ];
  if (!pocketCoordinates.every(finitePoint)) {
    throw new RangeError("Jeans fly cannot check a non-finite front pocket opening; correct the frontPocket options first.");
  }
  const clearance = distanceFromCurveToExtension(
    pocketOpening,
    options.flyExtensionWidth,
    options.flyLength,
  );
  if (clearance < JEANS_FLY_POCKET_KEEPOUT_CM - 1e-6) {
    throw new RangeError(
      `flyLength ${options.flyLength} cm and flyExtensionWidth ${options.flyExtensionWidth} cm leave less than the allowance-based ${JEANS_FLY_POCKET_KEEPOUT_CM} cm digital clearance to frontPocketOpening; reduce flyLength/flyExtensionWidth or revise the frontPocket settings.`,
    );
  }

  const rightWaist = lineEdge(frontRight, "waist");
  const rightCenterFront = lineEdge(frontRight, "centerFront");
  const top = rightCenterFront.end;
  const leftCenterFront = lineEdge(frontLeft, "centerFront");
  const coverTop = leftCenterFront.end;
  const coverCrotch = leftCenterFront.start;
  if (!finitePoint(coverTop) || !finitePoint(coverCrotch)) {
    throw new RangeError("Jeans fly cover requires finite wearer-left front waist and center-front geometry.");
  }
  if (Math.abs(coverTop.x) > 1e-7 || Math.abs(coverTop.y) > 1e-7) {
    throw new RangeError("Jeans fly cover must meet the wearer-left front waist at center front; adjust the front waist/rise draft.");
  }
  if (coverCrotch.x !== 0 || options.flyLength > coverCrotch.y - RISE_CLEARANCE_CM) {
    throw new RangeError(
      `flyLength ${options.flyLength} cm must stop at least ${RISE_CLEARANCE_CM} cm above the wearer-left front crotch transition at ${coverCrotch.y} cm; reduce flyLength or adjust the front rise.`,
    );
  }
  // The extension start is the live center-front point on the waist seam. Its
  // position stays inside the real waist interface that S1150 will join.
  if (!finitePoint(top) || distance(top, rightWaist.start) > 1e-7 || !finitePoint(rightWaist.end)) {
    throw new RangeError("Jeans fly top must share the live wearer-right waist interface; adjust the front waist draft.");
  }

  const length = options.flyLength;
  const width = options.flyExtensionWidth;
  const stop = point(0, length);
  const extendedFront = extendWearerRightFront(frontRight, width, length);
  const markedCover = withMarks(frontLeft, [
    lineMark("placementLine", "flyCoverStitch", coverTop, stop),
    pointMark("placementPoint", "flyClosureTop", coverTop, "CF closure"),
    pointMark("placementPoint", "flyClosureStop", stop, "fly stop"),
  ]);
  const facing = facingUnderlap(width, length);
  const shield = zipperShield(width, length);

  return {
    frontLeft: markedCover,
    frontRight: extendedFront,
    facingUnderlapRight: facing,
    shield,
    stitches: [
      {
        label: "Wearer-right fly extension ↔ facing/underlap",
        a: iface(edgeRef("frontRight", "flyExtensionJoin")),
        b: iface(edgeRef("flyFacingUnderlapRight", "frontJoin")),
      },
      {
        label: "Fly facing/underlap ↔ shield",
        a: iface(edgeRef("flyFacingUnderlapRight", "shieldJoin")),
        b: iface(edgeRef("flyShield", "underlapJoin")),
      },
    ],
  };
}
