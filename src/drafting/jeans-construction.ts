import { cubicPoint, point, type Point } from "../geometry";
import { rolePiece, type Block } from "./block";
import { edgeEnd, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
import {
  JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM,
  JEANS_PRIMARY_TOPSTITCH_CM,
  JEANS_SECONDARY_TOPSTITCH_SPACING_CM,
} from "./jeans-tables";

const CURVE_SECTIONS = 16;
const BACKTACK_LENGTH_CM = 0.8;
const BACKTACK_INSET_CM = 1;
const FLAT_FELL_ROW_OFFSETS = [
  JEANS_PRIMARY_TOPSTITCH_CM,
  JEANS_PRIMARY_TOPSTITCH_CM + JEANS_SECONDARY_TOPSTITCH_SPACING_CM,
] as const;

function edgeSamples(edge: Edge): Point[] {
  if (edge.kind === "line") return [edge.start, edge.end];
  return Array.from({ length: CURVE_SECTIONS + 1 }, (_, index) =>
    cubicPoint(edge.curve, index / CURVE_SECTIONS));
}

function pieceWinding(piece: Piece): number {
  const outline = piece.edges.flatMap((edge) => edgeSamples(edge).slice(0, -1));
  const doubleArea = outline.reduce((area, current, index) => {
    const next = outline[(index + 1) % outline.length]!;
    return area + current.x * next.y - next.x * current.y;
  }, 0);
  return doubleArea < 0 ? -1 : 1;
}

function pointInsidePiece(piece: Piece, query: Point): boolean {
  const outline = piece.edges.flatMap((edge) => edgeSamples(edge).slice(0, -1));
  return outline.reduce((inside, current, index) => {
    const previous = outline[(index + outline.length - 1) % outline.length]!;
    const crosses = (current.y > query.y) !== (previous.y > query.y)
      && query.x < (previous.x - current.x) * (query.y - current.y) / (previous.y - current.y) + current.x;
    return crosses ? !inside : inside;
  }, false);
}

function clipSegmentToPiece(piece: Piece, start: Point, end: Point): readonly (readonly [Point, Point])[] {
  const at = (fraction: number): Point => point(
    start.x + (end.x - start.x) * fraction,
    start.y + (end.y - start.y) * fraction,
  );
  const insideAt = (fraction: number): boolean => pointInsidePiece(piece, at(fraction));
  const subdivisions = 16;
  const boundaryBetween = (outside: number, inside: number): number => {
    let lo = outside;
    let hi = inside;
    for (let iteration = 0; iteration < 32; iteration += 1) {
      const middle = (lo + hi) / 2;
      if (insideAt(middle)) hi = middle;
      else lo = middle;
    }
    return hi;
  };

  const segments: (readonly [Point, Point])[] = [];
  let runStart: number | undefined = insideAt(0) ? 0 : undefined;
  let previousFraction = 0;
  let previousInside = runStart !== undefined;
  for (let step = 1; step <= subdivisions; step += 1) {
    const fraction = step / subdivisions;
    const inside = insideAt(fraction);
    if (inside !== previousInside) {
      const boundary = previousInside
        ? boundaryBetween(fraction, previousFraction)
        : boundaryBetween(previousFraction, fraction);
      if (previousInside && runStart !== undefined) {
        if (boundary - runStart > 1e-7) segments.push([at(runStart), at(boundary)]);
        runStart = undefined;
      } else if (inside) {
        runStart = boundary;
      }
    }
    previousFraction = fraction;
    previousInside = inside;
  }
  if (previousInside && runStart !== undefined && 1 - runStart > 1e-7) {
    segments.push([at(runStart), at(1)]);
  }
  return segments;
}

function offsetEdgeMarks(
  piece: Piece,
  edgeName: string,
  name: string,
  offsets: readonly number[],
  label?: string,
): PatternMark[] {
  const edge = pieceEdge(piece, edgeName);
  const samples = edgeSamples(edge);
  const winding = pieceWinding(piece);
  return offsets.flatMap((offset, rowIndex) => {
    const shifted = samples.map((sample, index) => {
      const previous = samples[Math.max(index - 1, 0)]!;
      const next = samples[Math.min(index + 1, samples.length - 1)]!;
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const length = Math.hypot(dx, dy);
      const normalX = (-dy / length) * winding;
      const normalY = (dx / length) * winding;
      return point(sample.x + normalX * offset, sample.y + normalY * offset);
    });
    return shifted.slice(0, -1).flatMap((start, segmentIndex) => {
      const pieces = clipSegmentToPiece(piece, start, shifted[segmentIndex + 1]!);
      return pieces.map(([clippedStart, clippedEnd], pieceIndex) => lineMark(
        "placementLine",
        `${name}-row-${rowIndex + 1}-segment-${segmentIndex + 1}-part-${pieceIndex + 1}`,
        clippedStart,
        clippedEnd,
        segmentIndex === 0 && pieceIndex === 0 && rowIndex === 0 ? label : undefined,
        "instruction",
      ));
    });
  });
}

function pairedRows(piece: Piece, edgeNames: readonly string[], name: string, label?: string): PatternMark[] {
  return edgeNames.flatMap((edgeName, edgeIndex) => offsetEdgeMarks(
    piece,
    edgeName,
    `${name}-${edgeName}`,
    FLAT_FELL_ROW_OFFSETS,
    edgeIndex === 0 ? label : undefined,
  ));
}

function pocketTopRows(piece: Piece, role: string): PatternMark[] {
  return offsetEdgeMarks(
    piece,
    "pocketTop",
    `${role}-topstitch`,
    [
      JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + JEANS_PRIMARY_TOPSTITCH_CM,
      JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + JEANS_PRIMARY_TOPSTITCH_CM + JEANS_SECONDARY_TOPSTITCH_SPACING_CM,
    ],
  );
}

function pocketBartacks(piece: Piece, role: string): PatternMark[] {
  const edge = pieceEdge(piece, "pocketTop");
  const start = edgeStart(edge);
  const end = edgeEnd(edge);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const edgeLength = Math.hypot(dx, dy);
  const winding = pieceWinding(piece);
  const normal = point((-dy / edgeLength) * winding, (dx / edgeLength) * winding);
  return [0, 1].map((index) => {
    const along = index === 0 ? BACKTACK_INSET_CM / edgeLength : 1 - BACKTACK_INSET_CM / edgeLength;
    const center = point(
      start.x + dx * along + normal.x * (JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + JEANS_PRIMARY_TOPSTITCH_CM + JEANS_SECONDARY_TOPSTITCH_SPACING_CM / 2),
      start.y + dy * along + normal.y * (JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + JEANS_PRIMARY_TOPSTITCH_CM + JEANS_SECONDARY_TOPSTITCH_SPACING_CM / 2),
    );
    const halfLength = BACKTACK_LENGTH_CM / 2;
    return lineMark(
      "placementLine",
      `${role}-bartack-${index + 1}`,
      point(center.x - normal.x * halfLength, center.y - normal.y * halfLength),
      point(center.x + normal.x * halfLength, center.y + normal.y * halfLength),
      index === 0 ? "bartack" : undefined,
      "instruction",
    );
  });
}

function frontPocketRivets(piece: Piece, side: "left" | "right"): PatternMark[] {
  const opening = pieceEdge(piece, "pocketOpening");
  if (opening.kind !== "curve") throw new RangeError("Jeans front pocket rivets require the named curved pocket opening.");
  return [
    pointMark("placementPoint", `optional-rivet-front-${side}-waist`, opening.curve.start, undefined, "instruction"),
    pointMark("placementPoint", `optional-rivet-front-${side}-side`, opening.curve.end, undefined, "instruction"),
  ];
}

function flyCoverRows(piece: Piece): PatternMark[] {
  const cover = piece.marks?.find((mark): mark is Extract<PatternMark, { readonly start: Point; readonly end: Point }> =>
    mark.name === "flyCoverStitch" && "start" in mark && "end" in mark);
  if (cover === undefined) throw new RangeError("Jeans fly cover requires its named live placement line.");
  return [
    JEANS_PRIMARY_TOPSTITCH_CM,
    JEANS_PRIMARY_TOPSTITCH_CM + JEANS_SECONDARY_TOPSTITCH_SPACING_CM,
  ].map((offset, index) => lineMark(
    "placementLine",
    `fly-cover-topstitch-row-${index + 1}`,
    point(cover.start.x + offset, cover.start.y),
    point(cover.end.x + offset, cover.end.y),
    undefined,
    "instruction",
  ));
}

function coinPocketRivets(piece: Piece): PatternMark[] {
  const edge = pieceEdge(piece, "pocketTop");
  const start = edgeStart(edge);
  const end = edgeEnd(edge);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const winding = pieceWinding(piece);
  const normal = point((-dy / length) * winding, (dx / length) * winding);
  return [0.12, 0.88].map((along, index) => pointMark(
    "placementPoint",
    `optional-rivet-coin-${index === 0 ? "outer" : "inner"}`,
    point(
      start.x + dx * along + normal.x * (JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + 0.5),
      start.y + dy * along + normal.y * (JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM + 0.5),
    ),
    index === 0 ? "optional rivet" : undefined,
    "instruction",
  ));
}

function beltLoopTopstitch(piece: Piece): PatternMark[] {
  const stripStart = pieceEdge(piece, "stripStart");
  const stripOuter = pieceEdge(piece, "stripOuter");
  const cutWidth = edgeEnd(stripStart).x - edgeStart(stripStart).x;
  const loopWidth = cutWidth / 3;
  const length = edgeEnd(stripOuter).y;
  return [
    lineMark("placementLine", "belt-loop-strip-topstitch-left", point(loopWidth + 0.3, 0), point(loopWidth + 0.3, length), "loop topstitch", "instruction"),
    lineMark("placementLine", "belt-loop-strip-topstitch-right", point(loopWidth * 2 - 0.3, 0), point(loopWidth * 2 - 0.3, length), undefined, "instruction"),
  ];
}

function appendMarks(piece: Piece, marks: readonly PatternMark[]): Piece {
  return { ...piece, marks: [...(piece.marks ?? []), ...marks] };
}

/** Add digital construction marks without changing Jeans cut outlines or seams. */
export function addJeansConstructionMarks(draft: Block): Block {
  const frontLeft = rolePiece(draft, "frontLeft");
  const frontRight = rolePiece(draft, "frontRight");
  const backLowerLeft = rolePiece(draft, "backLowerLeft");
  const backLowerRight = rolePiece(draft, "backLowerRight");
  const backPocketLeft = rolePiece(draft, "backPocketLeft");
  const backPocketRight = rolePiece(draft, "backPocketRight");
  const coinPocket = rolePiece(draft, "coinPocket");
  const waistbandOuterLeft = rolePiece(draft, "waistbandOuterLeft");
  const waistbandOuterRight = rolePiece(draft, "waistbandOuterRight");
  const beltLoopStrip = rolePiece(draft, "beltLoopStrip");
  const marksByRole: Readonly<Record<string, readonly PatternMark[]>> = {
    frontLeft: [
      ...pairedRows(frontLeft, ["pocketOpening"], "front-left"),
      ...flyCoverRows(frontLeft),
      ...frontPocketRivets(frontLeft, "left"),
    ],
    frontRight: [
      ...pairedRows(frontRight, ["pocketOpening"], "front-right"),
      ...frontPocketRivets(frontRight, "right"),
    ],
    backLowerLeft: pairedRows(backLowerLeft, ["yokeJoin", "centerBackLower", "inseamLower", "inseamUpper", "innerThighToCrotch"], "back-lower-left", "flat-felled topstitch"),
    backLowerRight: pairedRows(backLowerRight, ["yokeJoin", "centerBackLower", "inseamLower", "inseamUpper", "innerThighToCrotch"], "back-lower-right", "flat-felled topstitch"),
    backPocketLeft: [...pocketTopRows(backPocketLeft, "back-pocket-left"), ...pocketBartacks(backPocketLeft, "back-pocket-left")],
    backPocketRight: [...pocketTopRows(backPocketRight, "back-pocket-right"), ...pocketBartacks(backPocketRight, "back-pocket-right")],
    coinPocket: [...pocketTopRows(coinPocket, "coin-pocket"), ...coinPocketRivets(coinPocket)],
    waistbandOuterLeft: pairedRows(waistbandOuterLeft, ["backTop", "frontTop", "closureExtensionTop"], "waistband-outer-left", "waistband topstitch"),
    waistbandOuterRight: pairedRows(waistbandOuterRight, ["backTop", "frontTop", "closureExtensionTop"], "waistband-outer-right", "waistband topstitch"),
    beltLoopStrip: beltLoopTopstitch(beltLoopStrip),
  };
  const roles = Object.fromEntries(Object.entries(draft.roles).map(([role, piece]) => {
    const marks = marksByRole[role];
    return [role, marks === undefined ? piece : appendMarks(piece, marks)];
  }));
  return { ...draft, roles };
}
