import { cubicPoint, distance, point, type Point } from "../geometry";
import { describe, expect, it } from "vitest";
import { gradeMeasurements } from "./grading";
import { derive, STANDARD_M } from "./measurements";
import { pieceEdge, edgeEnd, edgeStart, type Edge, type Piece } from "./piece";
import { stitchChecks } from "./stitch";
import { TSHIRT_GRADE } from "./tshirt-grade";
import { draftCrewneck } from "./crewneck";
import { HOODIE_POUCH_DEFAULT_OPTIONS, HOODIE_SHAPE_DEFAULT_OPTIONS } from "./hoodie-contract";
import {
  draftHoodie,
  hoodieNecklineMeasurements,
  hoodieNecklineNotes,
  HOODIE_ROLE_ORDER,
  type HoodieDraftOptions,
  type HoodieHoodRole,
} from "./hoodie";

const OPTIONS: HoodieDraftOptions = {
  ...HOODIE_SHAPE_DEFAULT_OPTIONS,
  ...HOODIE_POUCH_DEFAULT_OPTIONS,
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
      hoodNeckEase: 0,
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

  it("adds the requested total ease across each hood half while keeping garment attachment endpoints fixed", () => {
    for (const step of [-2, -1, 0, 1, 2]) {
      const size = gradeMeasurements(STANDARD_M, TSHIRT_GRADE, step);
      for (const hoodNeckEase of [0, 3, 6]) {
        const drafted = draftHoodie(size, { ...OPTIONS, hoodNeckEase });
        const measurements = hoodieNecklineMeasurements(drafted);
        const frontNeckline = pieceEdge(drafted.roles.front!, "neckline");
        const backNeckline = pieceEdge(drafted.roles.back!, "neckline");
        const leftOuter = drafted.roles.hoodOuterLeft!;

        for (const item of measurements.hoodPieces) {
          expect(Math.abs(item.differenceFromGarmentCm - hoodNeckEase)).toBeLessThan(0.02);
          const piece = drafted.roles[item.role]!;
          const frontSeam = pieceEdge(piece, "necklineFront");
          const backSeam = pieceEdge(piece, "necklineBack");
          const expected = (value: Point): Point => item.role.endsWith("Right")
            ? point(-value.x, value.y)
            : value;
          expect(distance(edgeStart(frontSeam), expected(edgeStart(frontNeckline)))).toBeLessThan(1e-12);
          expect(distance(edgeEnd(frontSeam), expected(edgeEnd(frontNeckline)))).toBeLessThan(1e-12);
          expect(distance(edgeStart(backSeam), expected(edgeEnd(backNeckline)))).toBeLessThan(1e-12);
          expect(distance(edgeEnd(backSeam), expected(edgeStart(backNeckline)))).toBeLessThan(1e-12);
        }
        expect(drafted.roles.hoodLiningLeft?.edges).toEqual(leftOuter.edges);
        expect(stitchChecks(drafted, drafted.stitches).filter((check) => !check.ok)).toEqual([]);
      }
    }
  });

  it("warns on invalid or unrepresentable hood-neck ease without clamping the raw value", () => {
    for (const hoodNeckEase of [-0.5, 6.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const notes = hoodieNecklineNotes(STANDARD_M, {
        hoodNecklineWidthEase: OPTIONS.hoodNecklineWidthEase,
        hoodNecklineFrontDrop: OPTIONS.hoodNecklineFrontDrop,
        hoodNeckEase,
      });
      const note = notes.find((item) => item.field === "hoodNeckEase");
      expect(note?.level).toBe("warn");
      expect(note?.text).toContain("supported 0–6 cm range");
      expect(draftHoodie(STANDARD_M, { ...OPTIONS, hoodNeckEase }).roles.hoodOuterLeft?.edges)
        .toEqual(draftHoodie(STANDARD_M, OPTIONS).roles.hoodOuterLeft?.edges);
    }

    const unrepresentable = hoodieNecklineNotes(STANDARD_M, {
      hoodNecklineWidthEase: Number.POSITIVE_INFINITY,
      hoodNecklineFrontDrop: OPTIONS.hoodNecklineFrontDrop,
      hoodNeckEase: 3,
    }).find((item) => item.field === "hoodNeckEase");
    expect(unrepresentable?.level).toBe("warn");
    expect(unrepresentable?.text).toContain("cannot be represented by a finite neck seam");

    const precisionLimit = hoodieNecklineNotes(STANDARD_M, {
      hoodNecklineWidthEase: OPTIONS.hoodNecklineWidthEase,
      hoodNecklineFrontDrop: 1e16,
      hoodNeckEase: 6,
    }).find((item) => item.field === "hoodNeckEase");
    expect(precisionLimit?.level).toBe("warn");
    expect(precisionLimit?.text).toContain("cannot be represented by a finite neck seam");
  });

  it("mirrors the outer and lining sides exactly and keeps each outline finite, closed, and simple across XS-XL", () => {
    const bounds = [
      { ...OPTIONS, hoodHeight: 20, hoodDepth: 18, hoodNeckEase: 6, hoodNecklineWidthEase: 0, hoodNecklineFrontDrop: 0 },
      { ...OPTIONS, hoodHeight: 50, hoodDepth: 42, hoodNeckEase: 6, hoodNecklineWidthEase: 12, hoodNecklineFrontDrop: 22 },
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

  it("derives one centered on-fold pouch and matched placement from the live front hem across XS-XL", () => {
    for (const step of [-2, -1, 0, 1, 2]) {
      const size = gradeMeasurements(STANDARD_M, TSHIRT_GRADE, step);
      const drafted = draftHoodie(size, OPTIONS);
      const pouch = drafted.roles.pocket!;
      const front = drafted.roles.front!;
      const hemY = edgeEnd(pieceEdge(front, "hem")).y;
      const opening = pieceEdge(pouch, "opening");
      const sideSeam = pieceEdge(front, "side");

      expect(Object.keys(drafted.roles)).toEqual(HOODIE_ROLE_ORDER);
      expect(pouch.onFold).toBe(true);
      expect(pouch.edges.filter((edge) => edge.name === "fold")).toHaveLength(1);
      expect(edgeStart(pieceEdge(pouch, "fold")).x).toBe(0);
      expect(edgeEnd(pieceEdge(pouch, "fold")).x).toBe(0);
      expect(edgeStart(pieceEdge(pouch, "top")).x).toBe(0);
      expect(edgeEnd(pieceEdge(pouch, "top")).x).toBeCloseTo(OPTIONS.pocketWidth / 2, 10);
      expect(edgeStart(opening).y).toBeCloseTo(hemY - OPTIONS.pocketHemClearance - OPTIONS.pocketHeight, 10);
      const angleRadians = OPTIONS.pocketOpeningAngle * Math.PI / 180;
      expect(edgeStart(opening).x - edgeEnd(opening).x)
        .toBeCloseTo(OPTIONS.pocketOpeningLength * Math.cos(angleRadians), 10);
      expect(edgeEnd(opening).y - edgeStart(opening).y)
        .toBeCloseTo(OPTIONS.pocketOpeningLength * Math.sin(angleRadians), 10);
      expect(distance(edgeStart(opening), edgeEnd(opening))).toBeCloseTo(OPTIONS.pocketOpeningLength, 10);
      expect(edgeEnd(opening).x).toBeGreaterThan(0);
      expect(-edgeEnd(opening).x).toBeLessThan(0);
      expect(edgeEnd(pieceEdge(pouch, "bottom")).y).toBeCloseTo(hemY - OPTIONS.pocketHemClearance, 10);
      expect(edgeEnd(pieceEdge(pouch, "bottom")).x).toBe(0);
      expect(edgeEnd(pieceEdge(pouch, "top")).x).toBeLessThan(edgeStart(sideSeam).x);
      expect(edgeStart(opening).y).toBeGreaterThan(edgeStart(sideSeam).y);
      expect(edgeStart(pieceEdge(pouch, "bottom")).y).toBeLessThan(edgeEnd(sideSeam).y);
      expect(-edgeStart(opening).x).toBeCloseTo(-OPTIONS.pocketWidth / 2, 10);
      expect(-edgeEnd(opening).x).toBeCloseTo(-OPTIONS.pocketWidth / 2 + OPTIONS.pocketOpeningLength * Math.cos(angleRadians), 10);
      expect(edgeStart(opening).y).toBe(edgeStart(pieceEdge(pouch, "top")).y);
      expect(outlineSelfCrosses(pouch)).toBe(false);
      for (let index = 0; index < pouch.edges.length; index += 1) {
        expect(distance(edgeEnd(pouch.edges[index]!), edgeStart(pouch.edges[(index + 1) % pouch.edges.length]!)))
          .toBeLessThan(1e-9);
      }
      for (const value of outlinePoints(pouch)) {
        expect(Number.isFinite(value.x)).toBe(true);
        expect(Number.isFinite(value.y)).toBe(true);
      }
      expect(front.marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
        "kangarooPouchTop",
        "kangarooPouchOpening",
        "kangarooPouchSide",
        "kangarooPouchBottom",
      ]));
      expect(stitchChecks(drafted, drafted.stitches).filter((check) => !check.ok)).toEqual([]);
      expect(Object.keys(drafted.roles).filter((role) => role.toLowerCase().includes("pocket"))).toEqual(["pocket"]);
      expect(Object.keys(drafted.roles)).not.toContain("pocketFacing");
    }
  });

  it("omits pouch topology and placement when either zero dimension disables the pouch", () => {
    for (const options of [
      { ...OPTIONS, pocketWidth: 0 },
      { ...OPTIONS, pocketHeight: 0 },
    ]) {
      const drafted = draftHoodie(STANDARD_M, options);
      expect(drafted.roles.pocket).toBeUndefined();
      expect(Object.keys(drafted.roles)).not.toContain("pocket");
      expect(drafted.roles.front?.marks).toEqual([]);
      expect(drafted.stitches.map((stitch) => stitch.label)).not.toContain("Hoodie kangaroo pouch top ↔ front placement");
      expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    }
  });

  it("uses exact accepted maximum pouch inputs without clamping their outline geometry", () => {
    const boundaryOptions = [
      { ...OPTIONS, pocketWidth: 54 },
      { ...OPTIONS, pocketHeight: 38 },
      { ...OPTIONS, pocketOpeningLength: 18 },
      { ...OPTIONS, pocketOpeningAngle: 30 },
      { ...OPTIONS, pocketOpeningAngle: 60 },
      { ...OPTIONS, pocketHemClearance: 25 },
    ];
    for (const options of boundaryOptions) {
      const drafted = draftHoodie(STANDARD_M, options);
      const pouch = drafted.roles.pocket!;
      expect(edgeEnd(pieceEdge(pouch, "top")).x).toBe(options.pocketWidth / 2);
      expect(edgeEnd(pieceEdge(pouch, "bottom")).y)
        .toBeCloseTo(STANDARD_M.length - options.pocketHemClearance, 10);
      expect(edgeStart(pieceEdge(pouch, "opening")).y)
        .toBeCloseTo(STANDARD_M.length - options.pocketHemClearance - options.pocketHeight, 10);
      expect(distance(edgeStart(pieceEdge(pouch, "opening")), edgeEnd(pieceEdge(pouch, "opening"))))
        .toBeCloseTo(options.pocketOpeningLength, 10);
    }
  });
});
