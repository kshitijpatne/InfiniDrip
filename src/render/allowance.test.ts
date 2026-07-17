import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece, STANDARD_M, draftFront, AllowanceSpec } from "../drafting";
import { seamAllowance, seamAllowancePath, outlineSamples, outlinePoints } from "./allowance";

const UNIFORM: AllowanceSpec = { default: 1 };

function squarePiece(ccw: boolean): Piece {
  const v = ccw
    ? [point(0, 0), point(10, 0), point(10, 10), point(0, 10)]
    : [point(0, 0), point(0, 10), point(10, 10), point(10, 0)];
  return {
    name: "sq", onFold: false,
    edges: v.map((p, i) => ({ kind: "line" as const, name: `e${i}`, start: p, end: v[(i + 1) % 4] })),
  };
}

function area(pts: { x: number; y: number }[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Shortest distance from a point to the infinite line through a..b. */
function distToLine(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.hypot(dx, dy);
}

describe("outlineSamples", () => {
  it("tags every point with the edge it came from", () => {
    const names = new Set(outlineSamples(squarePiece(true)).map((s) => s.edgeName));
    expect([...names].sort()).toEqual(["e0", "e1", "e2", "e3"]);
  });

  it("samples a curved edge into many points under one edge name", () => {
    const samples = outlineSamples(draftFront(STANDARD_M));
    const armhole = samples.filter((s) => s.edgeName === "armhole");
    expect(armhole.length).toBeGreaterThan(1); // a curve, not a single vertex
  });

  it("outlinePoints is the same walk without the tags", () => {
    const piece = draftFront(STANDARD_M);
    expect(outlinePoints(piece)).toEqual(outlineSamples(piece).map((s) => s.point));
  });
});

describe("seamAllowance — the cutting line is the right DISTANCE away", () => {
  // The bug this replaces: the corner used to slide along the bisector by `d`,
  // landing at 0.707 cm on a 1 cm allowance. Assert real geometry, not "it grew".
  it("puts a square's corners exactly one allowance out on BOTH edges", () => {
    const cut = seamAllowance(squarePiece(true), UNIFORM);
    const corners = cut.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).sort();
    expect(corners).toEqual(["-1.000,-1.000", "-1.000,11.000", "11.000,-1.000", "11.000,11.000"]);
  });

  it("holds the allowance perpendicular to every edge of a real curved piece", () => {
    const piece = draftFront(STANDARD_M);
    const cut = seamAllowance(piece, UNIFORM);
    const samples = outlineSamples(piece);
    // Each cut point must sit ~1 cm from the sewing segment it was pushed off.
    for (let i = 0; i < samples.length; i++) {
      const next = samples[(i + 1) % samples.length];
      if (samples[i].edgeName !== next.edgeName) continue; // corners span two edges
      const d = distToLine(cut[i], samples[i].point, next.point);
      expect(d).toBeGreaterThan(0.9);
      expect(d).toBeLessThan(1.1);
    }
  });

  it("expands a clockwise square outward", () => {
    expect(area(seamAllowance(squarePiece(false), UNIFORM))).toBeGreaterThan(100);
  });

  it("expands a counter-clockwise square outward", () => {
    expect(area(seamAllowance(squarePiece(true), UNIFORM))).toBeGreaterThan(100);
  });
});

describe("seamAllowance — collinear segments", () => {
  // Two edges in a straight line (and every interior sample of a flat curve) give
  // parallel normals, so the 2x2 corner solve is degenerate. It must fall back to a
  // plain perpendicular push instead of dividing by ~zero and flinging the point away.
  it("pushes a mid-edge vertex straight out when its neighbours are collinear", () => {
    const v = [point(0, 0), point(5, 0), point(10, 0), point(10, 10), point(0, 10)];
    const split: Piece = {
      name: "split", onFold: false,
      edges: v.map((p, i) => ({ kind: "line" as const, name: `e${i}`, start: p, end: v[(i + 1) % 5] })),
    };
    const cut = seamAllowance(split, UNIFORM);
    // (5,0) sits mid-way along a straight run: it must land exactly 1 cm below it.
    const mid = cut[1];
    expect(mid.x).toBeCloseTo(5, 9);
    expect(mid.y).toBeCloseTo(-1, 9);
    expect(Number.isFinite(mid.x) && Number.isFinite(mid.y)).toBe(true);
  });
});

describe("seamAllowance — per-edge", () => {
  it("gives each edge its own allowance, and squares the corner between them", () => {
    // e3 is the left edge (x=0); e0 is the bottom (y=0). 2 cm left, 1 cm bottom
    // => the shared corner sits at (-2, -1): 2 from the left edge, 1 from the bottom.
    const spec: AllowanceSpec = { default: 1, byEdge: { e3: 2 } };
    const cut = seamAllowance(squarePiece(true), spec);
    const corners = cut.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).sort();
    expect(corners).toEqual(["-2.000,-1.000", "-2.000,11.000", "11.000,-1.000", "11.000,11.000"]);
  });

  it("a zero-allowance edge leaves the cutting line ON the sewing line (a fold)", () => {
    const spec: AllowanceSpec = { default: 1, byEdge: { e3: 0 } };
    const cut = seamAllowance(squarePiece(true), spec);
    // the left edge sits on x = 0 and must not move outward at all
    expect(Math.min(...cut.map((p) => p.x))).toBeCloseTo(0, 9);
  });

  it("keeps a real front piece's FOLD EDGE exactly on the fold", () => {
    const piece = draftFront(STANDARD_M); // onFold: centerFront sits on x = 0
    const samples = outlineSamples(piece);
    const foldEdgeX = (spec: AllowanceSpec): number => {
      const cut = seamAllowance(piece, spec);
      return Math.min(...samples.map((s, i) => (s.edgeName === "centerFront" ? cut[i].x : 99)));
    };
    // Zeroing the fold pulls the cutting line back onto it...
    expect(foldEdgeX({ default: 1, byEdge: { centerFront: 0 } })).toBeCloseTo(0, 6);
    // ...where a flat 1 cm pushed it a full centimetre PAST the fold. That is the
    // bug: a half-front cut 1 cm wide at the fold adds 4 cm of chest once the
    // front and back are cut on the fold and sewn up.
    expect(foldEdgeX(UNIFORM)).toBeCloseTo(-1, 6);
  });
});

describe("seamAllowancePath", () => {
  it("is a closed SVG path", () => {
    const d = seamAllowancePath(squarePiece(true), UNIFORM);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
});
