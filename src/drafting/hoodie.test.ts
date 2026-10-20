import { cubicPoint, distance, point, type Point } from "../geometry";
import { describe, expect, it } from "vitest";
import { gradeMeasurements } from "./grading";
import { derive, STANDARD_M } from "./measurements";
import { pieceEdge, edgeEnd, edgeStart, type Edge, type Piece } from "./piece";
import { stitchChecks } from "./stitch";
import { TSHIRT_GRADE } from "./tshirt-grade";
import { draftCrewneck } from "./crewneck";
import {
  draftHoodie,
  hoodieNecklineMeasurements,
  hoodieNecklineNotes,
  HOODIE_ROLE_ORDER,
  type HoodieDraftOptions,
  type HoodieHoodRole,
} from "./hoodie";

const OPTIONS: HoodieDraftOptions = {
  hoodNecklineWidthEase: 4,
  hoodNecklineFrontDrop: 8,
  hoodHeight: 32,
  hoodDepth: 28,
  cuffLength: 31.5,
  cuffDepth: 6,
  hemBandLength: 93.5,
  hemBandDepth: 6,
};

const HOOD_ROLES: readonly HoodieHoodRole[] = [
  "hoodOuterLeft",
  "hoodOuterRight",
  "hoodLiningLeft",
  "hoodLiningRight",
];

function outlinePoints(piece: Piece, segmentsPerCurve = 32): readonly Point[] {
  const points: Point[] = [];
  for (const edge of piece.edges) {
    const edgePoints = edge.kind === "line"
      ? [edge.start, edge.end]
      : Array.from({ length: segmentsPerCurve + 1 }, (_, index) =>
          cubicPoint(edge.curve, index / segmentsPerCurve));
    points.push(...edgePoints.slice(points.length === 0 ? 0 : 1));
  }
  return points;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function properlyIntersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < -1e-9 && cdA * cdB < -1e-9;
}

function outlineSelfCrosses(piece: Piece): boolean {
  const points = outlinePoints(piece);
  const segmentCount = points.length - 1;
  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 2; second < segmentCount; second += 1) {
      if (first === 0 && second === segmentCount - 1) continue;
      if (properlyIntersects(points[first]!, points[first + 1]!, points[second]!, points[second + 1]!)) {
        return true;
      }
    }
  }
  return false;
}

function reflectedCurve(edge: Edge): Edge {
  if (edge.kind === "line") {
    return {
      ...edge,
      start: point(-edge.start.x, edge.start.y),
      end: point(-edge.end.x, edge.end.y),
    };
  }
  return {
    ...edge,
    curve: {
      start: point(-edge.curve.start.x, edge.curve.start.y),
      control1: point(-edge.curve.control1.x, edge.curve.control1.y),
      control2: point(-edge.curve.control2.x, edge.curve.control2.y),
      end: point(-edge.curve.end.x, edge.curve.end.y),
    },
  };
}

describe("hoodie draft core", () => {
  it("keeps the body and sleeve contract while replacing the neckband with four hood pieces", () => {
    const hoodie = draftHoodie(STANDARD_M, OPTIONS);

    expect(Object.keys(hoodie.roles)).toEqual(HOODIE_ROLE_ORDER);
    expect(Object.keys(hoodie.roles)).not.toContain("neckband");
    expect(hoodie.roles.front?.onFold).toBe(true);
    expect(hoodie.roles.back?.onFold).toBe(true);
    expect(hoodie.roles.sleeveLeft?.onFold).toBe(false);
    expect(hoodie.roles.sleeveRight?.edges).toEqual(hoodie.roles.sleeveLeft?.edges);
    for (const role of HOOD_ROLES) expect(hoodie.roles[role]?.onFold).toBe(false);
    expect(hoodie.roles.cuffLeft?.edges).toEqual(hoodie.roles.cuffRight?.edges);
    expect(hoodie.roles.hemBand?.name).toBe("hoodie rib hem band");
    expect(hoodie.roles.cuffLeft?.name).toBe("left hoodie rib cuff");
    expect(hoodie.stitches.map((stitch) => stitch.label)).toEqual(expect.arrayContaining([
      "Hoodie shoulder seams",
      "Hoodie side seams",
      "Hoodie hood-to-neckline attachment: hoodOuterLeft",
      "Hoodie hood-to-neckline attachment: hoodOuterRight",
    ]));
    expect(stitchChecks(hoodie, hoodie.stitches).every((check) => check.ok)).toBe(true);
  });

  it("retains Crewneck body, sleeve, cuff, and hem geometry when Hoodie neckline changes are zero", () => {
    const measurements = { ...STANDARD_M, neckWidthEase: 0, neckDrop: 0 };
    const hoodie = draftHoodie(measurements, { ...OPTIONS, hoodNecklineWidthEase: 0, hoodNecklineFrontDrop: 0 });
    const crewneck = draftCrewneck(measurements, {
      neckbandLength: 40.5,
      neckbandDepth: 2.5,
      cuffLength: OPTIONS.cuffLength,
      cuffDepth: OPTIONS.cuffDepth,
      hemBandLength: OPTIONS.hemBandLength,
      hemBandDepth: OPTIONS.hemBandDepth,
    });

    for (const role of ["front", "back", "sleeveLeft", "sleeveRight", "cuffLeft", "cuffRight", "hemBand"] as const) {
      expect(hoodie.roles[role]?.edges).toEqual(crewneck.roles[role]?.edges);
    }
    expect(hoodie.roles.front?.onFold).toBe(crewneck.roles.front?.onFold);
    expect(hoodie.roles.back?.onFold).toBe(crewneck.roles.back?.onFold);
  });

  it("applies equal front/back width ease and the Hoodie front drop without clamping", () => {
    const plain = draftHoodie(STANDARD_M, { ...OPTIONS, hoodNecklineWidthEase: 0, hoodNecklineFrontDrop: 0 });
    const drafted = draftHoodie(STANDARD_M, { ...OPTIONS, hoodNecklineWidthEase: 40, hoodNecklineFrontDrop: 40 });
    const d = derive(STANDARD_M);

    for (const role of ["front", "back"] as const) {
      const plainNeck = pieceEdge(plain.roles[role]!, "neckline");
      const hoodieNeck = pieceEdge(drafted.roles[role]!, "neckline");
      expect(edgeEnd(hoodieNeck).x - edgeEnd(plainNeck).x).toBeCloseTo(40, 10);
    }
    expect(edgeStart(pieceEdge(drafted.roles.front!, "neckline")).y)
      .toBeCloseTo(d.frontNeckDepth + 40, 10);
    expect(edgeStart(pieceEdge(drafted.roles.back!, "neckline")).y)
      .toBeCloseTo(d.backNeckDepth, 10);

    const notes = hoodieNecklineNotes(STANDARD_M, {
      hoodNecklineWidthEase: 40,
      hoodNecklineFrontDrop: 40,
    });
    expect(notes.map((note) => note.field)).toContain("hoodNecklineWidthEase");
    expect(notes.map((note) => note.field)).toContain("hoodNecklineFrontDrop");
  });

  it("walks the actual half-neckline and reports equal outer and lining hood seams", () => {
    const drafted = draftHoodie(STANDARD_M, OPTIONS);
    const measurements = hoodieNecklineMeasurements(drafted);

    expect(measurements.garmentHalfNecklineCm).toBeGreaterThan(0);
    expect(measurements.hoodPieces.map((item) => item.role)).toEqual(HOOD_ROLES);
    for (const item of measurements.hoodPieces) {
      expect(item.hoodNecklineCm).toBeCloseTo(measurements.garmentHalfNecklineCm, 10);
      expect(item.differenceFromGarmentCm).toBeCloseTo(0, 10);
    }
    expect(measurements.hoodPieces[0]?.hoodNecklineCm)
      .toBeCloseTo(measurements.hoodPieces[1]?.hoodNecklineCm ?? Number.NaN, 10);
  });

  it("mirrors the outer and lining sides exactly and keeps each outline finite, closed, and simple across XS-XL", () => {
    const bounds = [
      { ...OPTIONS, hoodHeight: 20, hoodDepth: 18, hoodNecklineWidthEase: 0, hoodNecklineFrontDrop: 0 },
      { ...OPTIONS, hoodHeight: 50, hoodDepth: 42, hoodNecklineWidthEase: 12, hoodNecklineFrontDrop: 22 },
    ];
    for (const step of [-2, -1, 0, 1, 2]) {
      const size = gradeMeasurements(STANDARD_M, TSHIRT_GRADE, step);
      const leftRightPairs = [
        ["hoodOuterLeft", "hoodOuterRight"],
        ["hoodLiningLeft", "hoodLiningRight"],
      ] as const;

      for (const options of bounds) {
        const drafted = draftHoodie(size, options);
        for (const [leftRole, rightRole] of leftRightPairs) {
          const left = drafted.roles[leftRole]!;
          const right = drafted.roles[rightRole]!;
          expect(right.edges).toEqual(left.edges.map(reflectedCurve));
          expect(outlineSelfCrosses(left), `${step}/${options.hoodHeight}/${options.hoodDepth}/${leftRole}`).toBe(false);
          expect(outlineSelfCrosses(right), `${step}/${options.hoodHeight}/${options.hoodDepth}/${rightRole}`).toBe(false);
          for (const piece of [left, right]) {
            for (let index = 0; index < piece.edges.length; index += 1) {
              const edge = piece.edges[index]!;
              const next = piece.edges[(index + 1) % piece.edges.length]!;
              expect(distance(edgeEnd(edge), edgeStart(next))).toBeLessThan(1e-9);
            }
            for (const value of outlinePoints(piece)) {
              expect(Number.isFinite(value.x)).toBe(true);
              expect(Number.isFinite(value.y)).toBe(true);
            }
          }
        }

        const d = derive(size);
        const leftCrown = edgeEnd(pieceEdge(drafted.roles.hoodOuterLeft!, "centerBack"));
        const rightCrown = edgeEnd(pieceEdge(drafted.roles.hoodOuterRight!, "centerBack"));
        expect(leftCrown).toEqual(point(-options.hoodDepth, -options.hoodHeight));
        expect(rightCrown).toEqual(point(options.hoodDepth, -options.hoodHeight));
        expect(edgeEnd(pieceEdge(drafted.roles.front!, "neckline")).x)
          .toBeCloseTo(d.neckWidthHalf + options.hoodNecklineWidthEase, 10);
        expect(edgeEnd(pieceEdge(drafted.roles.back!, "neckline")).x)
          .toBeCloseTo(d.neckWidthHalf + options.hoodNecklineWidthEase, 10);
      }
    }
  });
});
