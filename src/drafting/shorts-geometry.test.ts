import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { STANDARD_M } from "./measurements";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { stitchChecks } from "./stitch";
import { gradeMeasurements } from "./grading";
import { TROUSER_GRADE } from "./trouser-tables";
import { blockPieces } from "./block";
import {
  DEFAULT_SHORTS_GEOMETRY_OPTIONS,
  SHORTS_GEOMETRY_OPTION_DEFINITIONS,
  SHORTS_LEG_ROLE_IDS,
  SHORTS_ROLE_IDS,
  SHORTS_ROLE_QUANTITIES,
} from "./shorts-contract";
import { draftShortsLegs, resolveShortsGeometryOptions, shortsMetrics } from "./shorts-geometry";
import { exportSvg } from "../export/svg";
import { NO_ALLOWANCE } from "./allowance";
import { outlinePoints } from "../render/allowance";

const SHORTS_M = {
  ...STANDARD_M,
  waist: 84,
  hip: 100,
  hipDepth: 18,
  crotchDepth: 27,
  thigh: 66,
  ease: 10,
};

type PointLike = { readonly x: number; readonly y: number };
const EPSILON = 1e-9;

function orientation(a: PointLike, b: PointLike, c: PointLike): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointOnSegment(a: PointLike, b: PointLike, p: PointLike): boolean {
  return p.x >= Math.min(a.x, b.x) - EPSILON && p.x <= Math.max(a.x, b.x) + EPSILON &&
    p.y >= Math.min(a.y, b.y) - EPSILON && p.y <= Math.max(a.y, b.y) + EPSILON;
}

function segmentsIntersect(a: PointLike, b: PointLike, c: PointLike, d: PointLike): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
      ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))) return true;
  return (Math.abs(abC) <= EPSILON && pointOnSegment(a, b, c)) ||
    (Math.abs(abD) <= EPSILON && pointOnSegment(a, b, d)) ||
    (Math.abs(cdA) <= EPSILON && pointOnSegment(c, d, a)) ||
    (Math.abs(cdB) <= EPSILON && pointOnSegment(c, d, b));
}

function hasSelfIntersection(points: readonly PointLike[]): boolean {
  const clean = points.filter((current, index) => index === 0 ||
    Math.hypot(current.x - points[index - 1].x, current.y - points[index - 1].y) > EPSILON);
  if (clean.length > 1 && Math.hypot(clean[0].x - clean[clean.length - 1].x, clean[0].y - clean[clean.length - 1].y) <= EPSILON) clean.pop();
  for (let first = 0; first < clean.length; first += 1) {
    const firstEnd = clean[(first + 1) % clean.length];
    for (let second = first + 1; second < clean.length; second += 1) {
      if (second === first + 1 || (first === 0 && second === clean.length - 1)) continue;
      const secondEnd = clean[(second + 1) % clean.length];
      if (segmentsIntersect(clean[first], firstEnd, clean[second], secondEnd)) return true;
    }
  }
  return false;
}

const EXPECTED_EDGE_NAMES = [
  ["waist", "sideUpper", "sideHipToThigh", "sideThighToHem", "hem", "inseamThighToHem", "innerThighToCrotch", "crotch", "centerFront"],
  ["waist", "sideUpper", "sideHipToThigh", "sideThighToHem", "hem", "inseamThighToHem", "innerThighToCrotch", "crotch", "centerFront"],
  ["waist", "sideUpper", "sideHipToThigh", "sideThighToHem", "hem", "inseamThighToHem", "innerThighToCrotch", "crotch", "centerBack"],
  ["waist", "sideUpper", "sideHipToThigh", "sideThighToHem", "hem", "inseamThighToHem", "innerThighToCrotch", "crotch", "centerBack"],
];

describe("shorts geometry contract", () => {
  it("declares the admitted dimensions and nine one-each role identities", () => {
    expect(SHORTS_GEOMETRY_OPTION_DEFINITIONS.map(({ id, defaultValue, min, max, step }) =>
      ({ id, defaultValue, min, max, step }))).toEqual([
      { id: "shortsInseam", defaultValue: 20, min: 5.5, max: 45, step: 0.5 },
      { id: "hemOpening", defaultValue: 60, min: 40, max: 90, step: 0.5 },
      { id: "frontRiseEase", defaultValue: 1, min: -2, max: 8, step: 0.5 },
      { id: "backRiseEase", defaultValue: 9, min: 2, max: 14, step: 0.5 },
      { id: "waistbandDepth", defaultValue: 3.5, min: 2, max: 6, step: 0.5 },
    ]);
    expect(SHORTS_ROLE_IDS).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband",
      "flyShield", "flyUnderlap", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(Object.keys(SHORTS_ROLE_QUANTITIES)).toEqual(SHORTS_ROLE_IDS);
    expect(Object.values(SHORTS_ROLE_QUANTITIES).every((quantity) => quantity === 1)).toBe(true);
    expect(SHORTS_LEG_ROLE_IDS).toEqual(["frontLeft", "frontRight", "backLeft", "backRight"]);
  });

  it("uses direct finished thigh and recipe-owned vertical hem defaults", () => {
    expect(resolveShortsGeometryOptions()).toEqual(DEFAULT_SHORTS_GEOMETRY_OPTIONS);
    expect(shortsMetrics(SHORTS_M)).toEqual({
      finishedWaist: 94,
      finishedSeat: 110,
      finishedThigh: 66,
      frontRise: 28,
      backRise: 36,
      frontCrotchY: 24.5,
      backCrotchY: 32.5,
      thighY: 35,
      shortsInseam: 20,
      hemOpening: 60,
      hemY: 52.5,
    });
  });

  it("does not consult global trouser inseam or knee", () => {
    const changedGlobalFields = { ...SHORTS_M, inseam: 1, knee: 140 };
    expect(shortsMetrics(changedGlobalFields)).toEqual(shortsMetrics(SHORTS_M));
  });

  it("uses explicit rise and length options without borrowing trouser leg fields", () => {
    const metrics = shortsMetrics(SHORTS_M, {
      shortsInseam: 23,
      hemOpening: 70,
      frontRiseEase: 2,
      backRiseEase: 10,
      waistbandDepth: 4,
    });
    expect(metrics).toMatchObject({
      finishedThigh: 66,
      frontRise: 29,
      backRise: 37,
      frontCrotchY: 25,
      backCrotchY: 33,
      thighY: 35.5,
      shortsInseam: 23,
      hemOpening: 70,
      hemY: 56,
    });
  });

  it("retains finite out-of-range and non-finite raw options without clamping", () => {
    const options = resolveShortsGeometryOptions({ shortsInseam: -1, hemOpening: 91, frontRiseEase: Number.NaN });
    expect(options.shortsInseam).toBe(-1);
    expect(options.hemOpening).toBe(91);
    expect(Number.isNaN(options.frontRiseEase)).toBe(true);
    expect(shortsMetrics(SHORTS_M, options)).toMatchObject({ shortsInseam: -1, hemOpening: 91 });
  });

  it("drafts four closed base panels with matching seams and exportable outlines", () => {
    const drafted = draftShortsLegs(SHORTS_M);
    const pieces = blockPieces(drafted);
    expect(Object.keys(drafted.roles)).toEqual(SHORTS_LEG_ROLE_IDS);
    expect(pieces.map((piece) => piece.name)).toEqual([
      "shorts front left", "shorts front right", "shorts back left", "shorts back right",
    ]);
    expect(pieces.map((piece) => piece.edges.map((edge) => edge.name))).toEqual(EXPECTED_EDGE_NAMES);
    for (const piece of pieces) {
      expect(hasSelfIntersection(outlinePoints(piece))).toBe(false);
      for (const edge of piece.edges) expect(edgeLength(edge)).toBeGreaterThan(0);
      for (let index = 0; index < piece.edges.length; index += 1) {
        const edge = piece.edges[index];
        const next = piece.edges[(index + 1) % piece.edges.length];
        expect(edgeEnd(edge).x).toBeCloseTo(edgeStart(next).x, 10);
        expect(edgeEnd(edge).y).toBeCloseTo(edgeStart(next).y, 10);
      }
    }
    expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    expect(pieces.map((piece) => edgeLength(pieceEdge(piece, "hem"))).reduce((sum, length) => sum + length, 0)).toBe(60);
    const svg = exportSvg(pieces, NO_ALLOWANCE);
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(8);
    expect(svg).toContain("SHORTS FRONT LEFT");
  });

  it("keeps XS/M/XL and short/opening endpoints on one symmetric topology", () => {
    for (const sizeStep of [-2, 0, 2]) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, sizeStep);
      for (const shortsInseam of [5.5, 20, 45]) {
        for (const hemOpening of [40, 60, 90]) {
          const options = { shortsInseam, hemOpening };
          const drafted = draftShortsLegs(measurements, options);
          const metrics = shortsMetrics(measurements, options);
          expect(metrics.hemY).toBeCloseTo(metrics.backCrotchY + shortsInseam, 10);
          expect(metrics.finishedThigh).toBe(measurements.thigh);
          expect(metrics.thighY).toBeCloseTo(metrics.backCrotchY + 2.5, 10);
          expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
          const pieces = blockPieces(drafted);
          expect(pieces).toHaveLength(4);
          expect(pieces.map((piece) => piece.edges.map((edge) => edge.name))).toEqual(EXPECTED_EDGE_NAMES);
          for (const [leftIndex, rightIndex] of [[0, 1], [2, 3]] as const) {
            const left = pieces[leftIndex];
            const right = pieces[rightIndex];
            expect(left.edges).toHaveLength(right.edges.length);
            left.edges.forEach((edge, index) => {
              const mirrored = right.edges[index];
              expect(edge.kind).toBe(mirrored.kind);
              if (edge.kind === "line" && mirrored.kind === "line") {
                expect(mirrored.start).toEqual(point(-edge.start.x, edge.start.y));
                expect(mirrored.end).toEqual(point(-edge.end.x, edge.end.y));
              } else if (edge.kind === "curve" && mirrored.kind === "curve") {
                expect(mirrored.curve.start).toEqual(point(-edge.curve.start.x, edge.curve.start.y));
                expect(mirrored.curve.control1).toEqual(point(-edge.curve.control1.x, edge.curve.control1.y));
                expect(mirrored.curve.control2).toEqual(point(-edge.curve.control2.x, edge.curve.control2.y));
                expect(mirrored.curve.end).toEqual(point(-edge.curve.end.x, edge.curve.end.y));
              }
            });
          }
          const totalHem = pieces.map((piece) => edgeLength(pieceEdge(piece, "hem")))
            .reduce((sum, length) => sum + length, 0);
          expect(totalHem).toBeCloseTo(hemOpening, 10);
          expect(pieces.every((piece) => piece.edges.every((edge) => [edgeStart(edge), edgeEnd(edge)]
            .every((value) => Number.isFinite(value.x) && Number.isFinite(value.y))))).toBe(true);
        }
      }
    }
  });
});
