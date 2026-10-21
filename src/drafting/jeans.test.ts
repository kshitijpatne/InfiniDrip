import { describe, expect, it } from "vitest";
import { blockPieces, rolePiece } from "./block";
import { cubicPoint, distance, type Point } from "../geometry";
import { renderBlueprint } from "../render/canvas";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { edgeEnd, edgeLength, edgeStart, perimeter, pieceEdge } from "./piece";
import { interfaceLength, stitchChecks } from "./stitch";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import { DEFAULT_JEANS_OPTIONS, type JeansOptions } from "./jeans-contract";
import { JEANS_NOTCHES, jeansNotchesForDraft } from "./jeans-tables";
import { draftJeansCore, jeansMetrics } from "./jeans";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { TROUSER_GRADE } from "./trouser-tables";

function isClosed(piece: ReturnType<typeof rolePiece>): boolean {
  return piece.edges.every((edge, index) => {
    const next = piece.edges[(index + 1) % piece.edges.length]!;
    const end = edgeEnd(edge);
    const start = edgeStart(next);
    return end.x === start.x && end.y === start.y;
  });
}

function isFinitePiece(piece: ReturnType<typeof rolePiece>): boolean {
  return piece.edges.every((edge) => edge.kind === "line"
    ? [edge.start, edge.end].every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
    : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]
      .every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
}

function outlinePoints(piece: ReturnType<typeof rolePiece>, curveSegments = 24): Point[] {
  const points: Point[] = [];
  for (const edge of piece.edges) {
    const samples = edge.kind === "line"
      ? [edge.start, edge.end]
      : Array.from({ length: curveSegments + 1 }, (_, index) => cubicPoint(edge.curve, index / curveSegments));
    points.push(...samples.slice(points.length === 0 ? 0 : 1));
  }
  if (points.length > 1 && distance(points[0]!, points[points.length - 1]!) < 1e-7) points.pop();
  return points;
}

function onSegment(value: Point, start: Point, end: Point): boolean {
  const cross = (value.x - start.x) * (end.y - start.y) - (value.y - start.y) * (end.x - start.x);
  if (Math.abs(cross) > 1e-6) return false;
  return value.x >= Math.min(start.x, end.x) - 1e-6 && value.x <= Math.max(start.x, end.x) + 1e-6 &&
    value.y >= Math.min(start.y, end.y) - 1e-6 && value.y <= Math.max(start.y, end.y) + 1e-6;
}

function pointInOutline(value: Point, points: readonly Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const a = points[previous]!;
    const b = points[index]!;
    if (onSegment(value, a, b)) return true;
    if ((a.y > value.y) !== (b.y > value.y) &&
        value.x < (b.x - a.x) * (value.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const orient = (p: Point, q: Point, r: Point) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = orient(a, b, c);
  const abD = orient(a, b, d);
  const cdA = orient(c, d, a);
  const cdB = orient(c, d, b);
  if (Math.abs(abC) < 1e-7 && onSegment(c, a, b)) return true;
  if (Math.abs(abD) < 1e-7 && onSegment(d, a, b)) return true;
  if (Math.abs(cdA) < 1e-7 && onSegment(a, c, d)) return true;
  if (Math.abs(cdB) < 1e-7 && onSegment(b, c, d)) return true;
  return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
}

function hasSelfIntersection(piece: ReturnType<typeof rolePiece>): boolean {
  const points = outlinePoints(piece);
  const count = points.length;
  for (let first = 0; first < count; first += 1) {
    const firstNext = (first + 1) % count;
    for (let second = first + 1; second < count; second += 1) {
      const secondNext = (second + 1) % count;
      if (first === second || firstNext === second || secondNext === first) continue;
      if (segmentsCross(points[first]!, points[firstNext]!, points[second]!, points[secondNext]!)) return true;
    }
  }
  return false;
}

function expectMirror(left: ReturnType<typeof rolePiece>, right: ReturnType<typeof rolePiece>): void {
  expect(right.edges).toHaveLength(left.edges.length);
  left.edges.forEach((edge, index) => {
    const mirrored = right.edges[index]!;
    expect(mirrored.kind).toBe(edge.kind);
    if (edge.kind === "line" && mirrored.kind === "line") {
      expect(mirrored.start).toEqual({ x: -edge.start.x, y: edge.start.y });
      expect(mirrored.end).toEqual({ x: -edge.end.x, y: edge.end.y });
    } else if (edge.kind === "curve" && mirrored.kind === "curve") {
      expect(mirrored.curve.start).toEqual({ x: -edge.curve.start.x, y: edge.curve.start.y });
      expect(mirrored.curve.control1).toEqual({ x: -edge.curve.control1.x, y: edge.curve.control1.y });
      expect(mirrored.curve.control2).toEqual({ x: -edge.curve.control2.x, y: edge.curve.control2.y });
      expect(mirrored.curve.end).toEqual({ x: -edge.curve.end.x, y: edge.curve.end.y });
    }
    expect(edgeLength(mirrored)).toBeCloseTo(edgeLength(edge));
  });
}

const sizeCases = [
  { label: "XS", step: -2 },
  { label: "M", step: 0 },
  { label: "XL", step: 2 },
] as const;

describe("Jeans lower-body core", () => {
  it("derives upper stations from the shared lower-body metrics", () => {
    const options: JeansOptions = {
      ...DEFAULT_JEANS_OPTIONS,
      frontRiseEase: 2,
      backRiseEase: 11,
      waistbandDepth: 6,
      thighEase: 10,
      kneeEase: 7,
    };
    const upper = lowerBodyUpperMetrics(
      STANDARD_M,
      options,
      STANDARD_M.thigh + options.thighEase,
    );
    const actual = jeansMetrics(STANDARD_M, options);
    expect(actual).toEqual({
      ...upper,
      finishedKnee: STANDARD_M.knee + options.kneeEase,
      hemY: upper.backCrotchY + STANDARD_M.inseam,
      kneeY: upper.backCrotchY + STANDARD_M.inseam * 0.52,
    });
    expect(actual.kneeY).toBe(72.56);
  });

  it("drafts sixteen closed roles with finite paired seams and the unchanged outside back stations", () => {
    const draft = draftJeansCore(STANDARD_M);
    expect(Object.keys(draft.roles)).toEqual([
      "frontLeft", "frontRight", "backYokeLeft", "backYokeRight", "backLowerLeft", "backLowerRight",
      "pocketFacingLeft", "pocketFacingRight", "pocketBagLeft", "pocketBagRight", "pocketStayLeft", "pocketStayRight",
      "pocketFacingExtensionRight", "coinPocket", "backPocketLeft", "backPocketRight",
    ]);
    expect(blockPieces(draft).map(({ name }) => name)).toEqual([
      "jeans front left", "jeans front right",
      "jeans back yoke left", "jeans back yoke right",
      "jeans back lower left", "jeans back lower right",
      "jeans front pocket facing left", "jeans front pocket facing right",
      "jeans front pocket bag left", "jeans front pocket bag right",
      "jeans front pocket stay left", "jeans front pocket stay right",
      "jeans right coin-pocket facing extension", "jeans coin pocket",
      "jeans back patch pocket left", "jeans back patch pocket right",
    ]);
    expect(draft.stitches.map(({ label }) => label)).toEqual([
      "Left side seam (front ↔ back)",
      "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)",
      "Right inseam (front ↔ back)",
      "Left back yoke join (back lower longer)",
      "Right back yoke join (back lower longer)",
      "Center-back yoke seam (left ↔ right)",
      "Center-back lower seam (left ↔ right)",
      "Left front pocket opening (front ↔ facing)",
      "Right front pocket opening (front ↔ facing)",
      "Left pocket facing ↔ bag opening",
      "Right pocket facing ↔ bag opening",
      "Right coin-facing extension ↔ facing",
      "Left localized pocket stay ↔ bag",
      "Right localized pocket stay ↔ bag",
    ]);
    expect(stitchChecks(draft, draft.stitches).filter(({ ok }) => !ok)).toEqual([]);
    for (const piece of blockPieces(draft)) {
      expect(piece.onFold).toBe(false);
      expect(isClosed(piece)).toBe(true);
      expect(isFinitePiece(piece)).toBe(true);
      expect(perimeter(piece)).toBeGreaterThan(0);
    }

    const upper = lowerBodyUpperMetrics(
      STANDARD_M,
      DEFAULT_JEANS_OPTIONS,
      STANDARD_M.thigh + DEFAULT_JEANS_OPTIONS.thighEase,
    );
    const sideWaist = edgeEnd(pieceEdge(rolePiece(draft, "backYokeLeft"), "sideWaistToYoke"));
    const sideYoke = edgeStart(pieceEdge(rolePiece(draft, "backYokeLeft"), "sideWaistToYoke"));
    const sideHip = edgeEnd(pieceEdge(rolePiece(draft, "backLowerLeft"), "sideYokeToHip"));
    const centerYoke = edgeEnd(pieceEdge(rolePiece(draft, "backLowerLeft"), "centerBackLower"));
    const centerLower = edgeStart(pieceEdge(rolePiece(draft, "backLowerLeft"), "centerBackLower"));
    expect(sideYoke).toEqual(edgeStart(pieceEdge(rolePiece(draft, "backLowerLeft"), "sideYokeToHip")));
    expect(sideHip).toEqual({ x: upper.finishedSeat / 4, y: STANDARD_M.hipDepth });
    expect(distance(sideWaist, sideYoke) + distance(sideYoke, sideHip))
      .toBeCloseTo(distance(sideWaist, sideHip), 9);
    expect(edgeLength(pieceEdge(rolePiece(draft, "backYokeLeft"), "centerBackYoke"))
      + edgeLength(pieceEdge(rolePiece(draft, "backLowerLeft"), "centerBackLower")))
      .toBeCloseTo(centerLower.y, 9);
    expect(centerYoke.y).toBe(DEFAULT_JEANS_OPTIONS.yokeDepth);
  });

  it("mirrors paired panels while preserving distinct front and back crotch curves", () => {
    const draft = draftJeansCore(STANDARD_M, DEFAULT_JEANS_OPTIONS);
    for (const [leftRole, rightRole] of [
      ["frontLeft", "frontRight"],
      ["backYokeLeft", "backYokeRight"],
      ["backLowerLeft", "backLowerRight"],
      ["backPocketLeft", "backPocketRight"],
      ["pocketFacingLeft", "pocketFacingRight"],
      ["pocketBagLeft", "pocketBagRight"],
      ["pocketStayLeft", "pocketStayRight"],
    ]) {
      expectMirror(rolePiece(draft, leftRole!), rolePiece(draft, rightRole!));
    }
    const frontCrotch = pieceEdge(rolePiece(draft, "frontLeft"), "crotch");
    const backCrotch = pieceEdge(rolePiece(draft, "backLowerLeft"), "crotch");
    expect(frontCrotch.kind).toBe("curve");
    expect(backCrotch.kind).toBe("curve");
    if (frontCrotch.kind === "curve" && backCrotch.kind === "curve") {
      expect(frontCrotch.curve.control1).not.toEqual(backCrotch.curve.control1);
    }
  });

  it("walks each eased yoke seam from actual arc lengths at XS, M, and XL", () => {
    for (const { label, step } of sizeCases) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements);
      expect(stitchChecks(draft, draft.stitches).filter(({ ok }) => !ok), label).toEqual([]);
      for (const side of ["Left", "Right"]) {
        const join = draft.stitches.find((stitch) => stitch.label === `${side} back yoke join (back lower longer)`)!;
        expect(join.ease).toEqual({ lo: 0, hi: DEFAULT_JEANS_OPTIONS.yokeEase });
        expect(interfaceLength(draft, join.a) - interfaceLength(draft, join.b))
          .toBeCloseTo(DEFAULT_JEANS_OPTIONS.yokeEase, 5);
      }

      const lowerLeft = rolePiece(draft, "backLowerLeft");
      const yokeLeft = rolePiece(draft, "backYokeLeft");
      const originalSideLength = distance(
        edgeEnd(pieceEdge(yokeLeft, "sideWaistToYoke")),
        edgeEnd(pieceEdge(lowerLeft, "sideYokeToHip")),
      );
      expect(
        edgeLength(pieceEdge(yokeLeft, "sideWaistToYoke"))
          + edgeLength(pieceEdge(lowerLeft, "sideYokeToHip")),
      ).toBeCloseTo(originalSideLength, 9);

      const rendered = renderBlueprint(blockPieces(draft), {
        notches: jeansNotchesForDraft(draft),
        allowances: { default: 0 },
      });
      const withoutMarkRules = renderBlueprint(blockPieces(draft), { allowances: { default: 0 } });
      expect(rendered).toContain("<svg");
      expect(rendered).toContain("JEANS BACK YOKE LEFT");
      expect(rendered).toContain("stroke-dasharray");
      expect(rendered).not.toBe(withoutMarkRules);
    }
  });

  it("builds measured, mirrored scoop cuts with contained bag and local stay across XS–XL option boundaries", () => {
    const boundaryOptions: Partial<JeansOptions>[] = [
      {},
      { frontPocketOpening: 10 },
      { frontPocketOpening: 22 },
      { frontPocketDrop: 2 },
      { frontPocketDrop: 12 },
      { frontPocketCurveDepth: 1 },
      { frontPocketCurveDepth: 6 },
      { frontPocketBagDepth: 16 },
      { frontPocketBagDepth: 35 },
    ];
    for (const { label, step } of sizeCases) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const baselineFront = rolePiece(draftJeansCore(measurements), "frontLeft");
      for (const optionPatch of boundaryOptions) {
        const options = { ...DEFAULT_JEANS_OPTIONS, ...optionPatch };
        const draft = draftJeansCore(measurements, optionPatch);
        const front = rolePiece(draft, "frontLeft");
        const facing = rolePiece(draft, "pocketFacingLeft");
        const bag = rolePiece(draft, "pocketBagLeft");
        const stay = rolePiece(draft, "pocketStayLeft");
        const opening = pieceEdge(front, "pocketOpening");
        expect(opening.kind, `${label} opening kind ${JSON.stringify(optionPatch)}`).toBe("curve");
        if (opening.kind !== "curve") throw new Error("Jeans pocket opening must be a curve.");
        expect(edgeLength(opening)).toBeCloseTo(options.frontPocketOpening, 2);
        expect(opening.curve.end.y).toBe(options.frontPocketDrop);
        const dx = opening.curve.end.x - opening.curve.start.x;
        const dy = opening.curve.end.y - opening.curve.start.y;
        const chord = Math.hypot(dx, dy);
        const normal = { x: -dy / chord, y: dx / chord };
        const baseControl1 = {
          x: opening.curve.start.x + dx * 0.3,
          y: opening.curve.start.y + dy * 0.3,
        };
        expect((opening.curve.control1.x - baseControl1.x) * normal.x +
          (opening.curve.control1.y - baseControl1.y) * normal.y)
          .toBeCloseTo(options.frontPocketCurveDepth, 8);
        expect(pieceEdge(facing, "opening")).toEqual({
          kind: "curve",
          name: "opening",
          curve: {
            start: opening.curve.end,
            control1: opening.curve.control2,
            control2: opening.curve.control1,
            end: opening.curve.start,
          },
        });
        expect(pieceEdge(bag, "pocketOpening")).toEqual(opening);
        const openingMaximumY = Math.max(...Array.from({ length: 65 }, (_, index) =>
          cubicPoint(opening.curve, index / 64).y));
        expect(edgeStart(pieceEdge(bag, "bagBottom")).y)
          .toBeCloseTo(openingMaximumY + options.frontPocketBagDepth, 8);
        expect(edgeStart(pieceEdge(stay, "stayJoin"))).toEqual(edgeEnd(pieceEdge(bag, "bagClose")));
        expect(edgeEnd(pieceEdge(stay, "stayJoin"))).toEqual(edgeStart(pieceEdge(bag, "bagClose")));
        expect(stitchChecks(draft, draft.stitches).filter(({ ok }) => !ok), `${label} seam walk`)
          .toEqual([]);
        expect(edgeLength(pieceEdge(front, "waist")) + edgeLength(pieceEdge(facing, "waistFacing")))
          .toBeCloseTo(jeansMetrics(measurements, options).finishedWaist / 4, 8);
        for (const edgeName of [
          "sideHipToThigh", "sideThighToKnee", "sideKneeToHem", "hem",
          "inseamLower", "inseamUpper", "innerThighToCrotch", "crotch", "centerFront",
        ]) {
          expect(pieceEdge(front, edgeName), `${label} unchanged ${edgeName}`)
            .toEqual(pieceEdge(baselineFront, edgeName));
        }

        for (const piece of [front, facing, bag, stay]) {
          expect(isClosed(piece), `${label} ${piece.name} closed`).toBe(true);
          expect(isFinitePiece(piece), `${label} ${piece.name} finite`).toBe(true);
          expect(hasSelfIntersection(piece), `${label} ${piece.name} simple`).toBe(false);
        }
        const frontOutline = outlinePoints(front);
        for (const piece of [bag, stay]) {
          for (const value of outlinePoints(piece)) {
            expect(pointInOutline(value, frontOutline), `${label} ${piece.name} containment at ${value.x},${value.y}`)
              .toBe(true);
          }
        }
        expect(Math.min(...outlinePoints(stay).map(({ x }) => x)), `${label} local stay clearance`)
          .toBeGreaterThan(0);

        const frontRight = rolePiece(draft, "frontRight");
        expectMirror(front, frontRight);
        expectMirror(facing, rolePiece(draft, "pocketFacingRight"));
        expectMirror(bag, rolePiece(draft, "pocketBagRight"));
        expectMirror(stay, rolePiece(draft, "pocketStayRight"));

        const rendered = renderBlueprint(blockPieces(draft), {
          notches: jeansNotchesForDraft(draft),
          allowances: { default: 0 },
        });
        expect(rendered).toContain("JEANS FRONT POCKET FACING LEFT");
        expect(rendered).toContain("JEANS FRONT POCKET BAG RIGHT");
      }
    }
  });

  it("rejects unsupported pocket combinations and raw out-of-range values without clamping", () => {
    expect(() => draftJeansCore(STANDARD_M, {
      frontPocketDrop: 12,
      frontPocketCurveDepth: 6,
    })).toThrow(/cannot fit the selected 12 cm drop and 6 cm scoop depth/);
    expect(() => draftJeansCore(STANDARD_M, { frontPocketOpening: 22.5 }))
      .toThrow(/frontPocketOpening must be a finite value from 10 to 22 cm; received 22.5/);
    expect(() => draftJeansCore(STANDARD_M, { frontPocketBagDepth: Number.NaN }))
      .toThrow(/frontPocketBagDepth must be a finite value from 16 to 35 cm; received NaN/);
    expect(() => draftJeansCore({ ...STANDARD_M, inseam: 1 }, { frontPocketBagDepth: 35 }))
      .toThrow(/no finite inner boundary/);
    expect(() => draftJeansCore({ ...STANDARD_M, waist: 70.5 }, {
      frontPocketOpening: 22,
      frontPocketCurveDepth: 1,
    }))
      .toThrow(/no room for the localized pocket stay/);
    expect(() => draftJeansCore({ ...STANDARD_M, thigh: 8, knee: 8, ease: 0 }, {
      thighEase: 0,
      kneeEase: 0,
      frontPocketBagDepth: 35,
    })).toThrow(/bag does not fit between the front rise and side seam/);
  });

  it("resolves each rule-based notch and grainline on every size and mirrored back role", () => {
    expect(JEANS_NOTCHES.map(({ pieceName }) => pieceName)).toEqual([
      "jeans front left", "jeans front right",
      "jeans back yoke left", "jeans back yoke right",
      "jeans back lower left", "jeans back lower right",
      "jeans front pocket facing left", "jeans front pocket facing right",
      "jeans front pocket bag left", "jeans front pocket bag right",
      "jeans front pocket stay left", "jeans front pocket stay right",
      "jeans right coin-pocket facing extension", "jeans coin pocket",
      "jeans back patch pocket left", "jeans back patch pocket right",
    ]);
    const leftYoke = JEANS_NOTCHES.find(({ pieceName }) => pieceName === "jeans back yoke left")!;
    const leftLower = JEANS_NOTCHES.find(({ pieceName }) => pieceName === "jeans back lower left")!;
    expect(leftYoke.notches.find(({ edgeName }) => edgeName === "yokeJoin"))
      .toEqual(leftLower.notches.find(({ edgeName }) => edgeName === "yokeJoin"));
    expect(leftYoke.notches.find(({ edgeName }) => edgeName === "centerBackYoke"))
      .toEqual(JEANS_NOTCHES.find(({ pieceName }) => pieceName === "jeans back yoke right")!
        .notches.find(({ edgeName }) => edgeName === "centerBackYoke"));

    for (const { step } of sizeCases) {
      const draft = draftJeansCore(gradeMeasurements(STANDARD_M, TROUSER_GRADE, step));
      const notches = jeansNotchesForDraft(draft);
      for (const rule of notches) {
        const piece = blockPieces(draft).find(({ name }) => name === rule.pieceName)!;
        for (const notchRule of rule.notches) {
          const notch = resolveNotch(piece, notchRule);
          expect([notch.point.x, notch.point.y, notch.normal.x, notch.normal.y]
            .every(Number.isFinite)).toBe(true);
        }
        const grainline = resolveGrainline(piece, rule.grainline);
        expect([grainline.top.x, grainline.top.y, grainline.bottom.x, grainline.bottom.y]
          .every(Number.isFinite)).toBe(true);
        expect(grainline.top).not.toEqual(grainline.bottom);
      }
    }
  });

  it("keeps yoke depth/ease live, including zero, maximum, and invalid raw ease values", () => {
    const base = draftJeansCore(STANDARD_M);
    const zero = draftJeansCore(STANDARD_M, { yokeEase: 0 });
    const maximum = draftJeansCore(STANDARD_M, { yokeDepth: 15, yokeEase: 1.5 });
    const zeroJoin = zero.stitches.find(({ label }) => label === "Left back yoke join (back lower longer)")!;
    expect(interfaceLength(zero, zeroJoin.a) - interfaceLength(zero, zeroJoin.b)).toBeCloseTo(0, 9);
    expect(stitchChecks(zero, zero.stitches).every(({ ok }) => ok)).toBe(true);

    const baseYoke = rolePiece(base, "backYokeLeft");
    const maxYoke = rolePiece(maximum, "backYokeLeft");
    expect(edgeLength(pieceEdge(baseYoke, "centerBackYoke"))).toBe(9);
    expect(edgeLength(pieceEdge(maxYoke, "centerBackYoke"))).toBe(15);
    const maxJoin = maximum.stitches.find(({ label }) => label === "Left back yoke join (back lower longer)")!;
    expect(interfaceLength(maximum, maxJoin.a) - interfaceLength(maximum, maxJoin.b))
      .toBeCloseTo(1.5, 5);

    const aboveRange = draftJeansCore(STANDARD_M, { yokeEase: 2.5 });
    const aboveRangeJoin = aboveRange.stitches.find(({ label }) => label === "Left back yoke join (back lower longer)")!;
    expect(aboveRangeJoin.ease).toEqual({ lo: 0, hi: 2.5 });
    expect(interfaceLength(aboveRange, aboveRangeJoin.a) - interfaceLength(aboveRange, aboveRangeJoin.b))
      .toBeCloseTo(2.5, 5);

    const negative = draftJeansCore(STANDARD_M, { yokeEase: -0.5 });
    expect(negative.stitches.find(({ label }) => label === "Left back yoke join (back lower longer)")!.ease)
      .toEqual({ lo: 0, hi: -0.5 });
    const nonFinite = draftJeansCore(STANDARD_M, { yokeEase: Number.NaN });
    expect(edgeLength(pieceEdge(rolePiece(nonFinite, "backLowerLeft"), "yokeJoin"))).toBeNaN();
  });

  it("uses live rise, thigh, knee, and opening values without changing Trouser", () => {
    const base = draftJeansCore(STANDARD_M, DEFAULT_JEANS_OPTIONS);
    const options = {
      ...DEFAULT_JEANS_OPTIONS,
      frontRiseEase: 4,
      thighEase: 12,
      kneeEase: 7,
      legOpening: 60,
    };
    const changed = draftJeansCore(STANDARD_M, options);
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "centerFront")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "centerFront")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "sideThighToKnee")))
      .not.toBe(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "sideThighToKnee")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "hem"))).toBe(15);
    expect(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "hem"))).toBe(10);
    expect(stitchChecks(changed, changed.stitches).filter(({ ok }) => !ok)).toEqual([]);
  });
});
