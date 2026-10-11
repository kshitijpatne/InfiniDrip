import { describe, expect, it } from "vitest";
import { allowanceFor, type Piece } from "../drafting";
import { cubicPoint } from "../geometry";
import { GARMENTS, STANDARD_M, gradeRun } from "../drafting";
import { adaptiveCurvePoint, adaptiveSeamAllowance } from "./adaptive-cut";

function distanceToSegment(point: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function distanceToClosedPolyline(point: { x: number; y: number }, points: readonly { x: number; y: number }[]): number {
  let minimum = Infinity;
  for (let index = 0; index < points.length; index += 1) {
    minimum = Math.min(minimum, distanceToSegment(point, points[index]!, points[(index + 1) % points.length]!));
  }
  return minimum;
}

describe("adaptive interchange cut geometry", () => {
  it("adaptively samples the Polo neckline and trims the cusp's inner loop", () => {
    const recipe = GARMENTS.find((entry) => entry.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const back = graded.block.roles.back!;
    const edge = back.edges.find((candidate) => candidate.name === "neckline" && candidate.kind === "curve")!;
    if (edge.kind !== "curve") throw new Error("Polo back neckline fixture is not curved");
    const cut = adaptiveSeamAllowance(back, recipe.allowances);
    const amount = allowanceFor(recipe.allowances, edge.name, back.name);
    let worst = 0;
    let worstAt = 0;
    for (let index = 1; index < 900; index += 1) {
      const t = index / 1000;
      const point = adaptiveCurvePoint(edge.curve, t, amount, 1);
      const error = distanceToClosedPolyline(point, cut);
      if (error > worst) { worst = error; worstAt = t; }
    }
    const cusp = adaptiveCurvePoint(edge.curve, 0.9346892443, amount, 1);
    // The existing offset contract removes the cusp's self-crossing inner loop.
    // The surviving simple contour stays close to its source offset before the trim.
    expect(distanceToClosedPolyline(cusp, cut)).toBeGreaterThan(0.001);
    expect(worst, `worst residual at t=${worstAt}`).toBeLessThan(0.001);
    expect(cut.length).toBeGreaterThan(14);
  });

  it("supports straight and collinear pieces with equal and unequal edge allowances", () => {
    const piece: Piece = {
      name: "collinear",
      onFold: false,
      edges: [
        { kind: "line", name: "bottom-a", start: { x: 0, y: 0 }, end: { x: 2, y: 0 } },
        { kind: "line", name: "bottom-b", start: { x: 2, y: 0 }, end: { x: 4, y: 0 } },
        { kind: "line", name: "right", start: { x: 4, y: 0 }, end: { x: 4, y: 3 } },
        { kind: "line", name: "top", start: { x: 4, y: 3 }, end: { x: 0, y: 3 } },
        { kind: "line", name: "left", start: { x: 0, y: 3 }, end: { x: 0, y: 0 } },
      ],
    };
    const uniform = adaptiveSeamAllowance(piece, { default: 1 });
    const varied = adaptiveSeamAllowance(piece, { default: 1, byEdge: { "bottom-b": 0.5 } });
    expect(uniform.length).toBeGreaterThanOrEqual(5);
    expect(varied.length).toBeGreaterThan(uniform.length);
  });

  it("fails closed for too few edges, negative allowance and degenerate tangents", () => {
    const base: Piece = { name: "bad", onFold: false, edges: [] };
    expect(() => adaptiveSeamAllowance(base, { default: 1 })).toThrow("requires at least two edges");
    const negative: Piece = { ...base, edges: [
      { kind: "line", name: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
      { kind: "line", name: "b", start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
    ] };
    expect(() => adaptiveSeamAllowance(negative, { default: -1 })).toThrow("invalid seam allowance");
    const degenerate: Piece = { ...negative, edges: [
      { kind: "line", name: "zero", start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
      { kind: "line", name: "return", start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    ] };
    expect(() => adaptiveSeamAllowance(degenerate, { default: 1 })).toThrow("degenerate tangent");
    const nonFinite: Piece = { ...negative, edges: [
      { kind: "line", name: "nan", start: { x: Number.NaN, y: 0 }, end: { x: 1, y: 0 } },
      { kind: "line", name: "return", start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
    ] };
    expect(() => adaptiveSeamAllowance(nonFinite, { default: 1 })).toThrow("non-finite source geometry");
  });

  it("detects curves whose adaptive subdivision cannot meet the tolerance", () => {
    const scale = 1e18;
    const piece: Piece = {
      name: "nonconvergent",
      onFold: false,
      edges: [
        { kind: "curve", name: "large", curve: {
          start: { x: 0, y: 0 }, control1: { x: scale, y: scale },
          control2: { x: -scale, y: scale }, end: { x: 1, y: 0 },
        } },
        { kind: "line", name: "close", start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
      ],
    };
    expect(() => adaptiveSeamAllowance(piece, { default: 1 })).toThrow("did not converge");
  });

  it("stops at the per-edge point ceiling before emitting an oversized drawing", () => {
    const piece: Piece = {
      name: "too-many-points",
      onFold: false,
      edges: [
        { kind: "curve", name: "large", curve: {
          start: { x: 0, y: 0 }, control1: { x: 1e6, y: 0 },
          control2: { x: 1e6, y: 1 }, end: { x: 0, y: 1 },
        } },
        { kind: "line", name: "close", start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },
      ],
    };
    expect(() => adaptiveSeamAllowance(piece, { default: 1 })).toThrow("point limit exceeded on edge");
  });

  it("stops at the whole-piece point ceiling when many simple edges accumulate", () => {
    const sides = 4001;
    const point = (index: number) => {
      const angle = (index / sides) * Math.PI * 2;
      return { x: 100 * Math.cos(angle), y: 100 * Math.sin(angle) };
    };
    const piece: Piece = {
      name: "many-edges",
      onFold: false,
      edges: Array.from({ length: sides }, (_, index) => ({
        kind: "line" as const,
        name: `edge-${index}`,
        start: point(index),
        end: point(index + 1),
      })),
    };
    expect(() => adaptiveSeamAllowance(piece, { default: 1 })).toThrow("point limit exceeded on piece");
  });

  it("fails closed for non-finite and unbounded miter joins", () => {
    const makePiece = (nearAngle: number, span: number): Piece => ({
      name: "extreme-join",
      onFold: false,
      edges: [
        { kind: "line", name: "current", start: { x: 0, y: 0 }, end: { x: -span, y: nearAngle } },
        { kind: "line", name: "close", start: { x: -span, y: nearAngle }, end: { x: -span, y: 0 } },
        { kind: "line", name: "previous", start: { x: -span, y: 0 }, end: { x: 0, y: 0 } },
      ],
    });
    const unbounded = makePiece(0.001, 10);
    expect(() => adaptiveSeamAllowance(unbounded, { default: 1 })).toThrow("Offset join is unbounded");
    const nonFinite = makePiece(1e-308, 1e308);
    expect(() => adaptiveSeamAllowance(nonFinite, { default: 1, byEdge: { previous: 2 } }))
      .toThrow("Offset join is not finite");
  });

  it("rejects a finite allowance that overflows the source coordinate range", () => {
    const curve = {
      start: { x: 1e308, y: 0 }, control1: { x: 1e308, y: 1 },
      control2: { x: 1e308, y: 2 }, end: { x: 1e308, y: 3 },
    };
    expect(() => adaptiveCurvePoint(curve, 0.5, 1e308)).toThrow("Cannot form a finite offset");
  });

  it("trims a concave offset loop and rejects a zero-area outline", () => {
    const concave: Piece = {
      name: "concave",
      onFold: false,
      edges: [
        { kind: "line", name: "a", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
        { kind: "line", name: "b", start: { x: 6, y: 0 }, end: { x: 6, y: 2 } },
        { kind: "line", name: "c", start: { x: 6, y: 2 }, end: { x: 2, y: 2 } },
        { kind: "line", name: "d", start: { x: 2, y: 2 }, end: { x: 2, y: 6 } },
        { kind: "line", name: "e", start: { x: 2, y: 6 }, end: { x: 0, y: 6 } },
        { kind: "line", name: "f", start: { x: 0, y: 6 }, end: { x: 0, y: 0 } },
      ],
    };
    expect(adaptiveSeamAllowance(concave, { default: 3 }).length).toBeGreaterThan(3);
    const flat: Piece = { ...concave, name: "flat", edges: [
      { kind: "line", name: "out", start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
      { kind: "line", name: "back", start: { x: 3, y: 0 }, end: { x: 0, y: 0 } },
    ] };
    expect(() => adaptiveSeamAllowance(flat, { default: 0 })).toThrow("not a simple closed outline");
  });

  it("uses cubic source points for its candidate curve samples", () => {
    const curve = { start: { x: 0, y: 0 }, control1: { x: 0, y: 1 }, control2: { x: 1, y: 1 }, end: { x: 1, y: 0 } };
    const sample = adaptiveCurvePoint(curve, 0.5, 0, 1);
    expect(sample).toEqual(cubicPoint(curve, 0.5));
  });
});
