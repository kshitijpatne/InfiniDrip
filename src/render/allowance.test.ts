import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece, STANDARD_M, draftFront } from "../drafting";
import { seamAllowance, seamAllowancePath } from "./allowance";

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

describe("seamAllowance", () => {
  it("expands a clockwise square outward", () => {
    expect(area(seamAllowance(squarePiece(false), 1))).toBeGreaterThan(100);
  });
  it("expands a counter-clockwise square outward", () => {
    expect(area(seamAllowance(squarePiece(true), 1))).toBeGreaterThan(100);
  });
  it("samples curved edges (front block)", () => {
    expect(seamAllowance(draftFront(STANDARD_M), 1).length).toBeGreaterThan(10);
  });
});

describe("seamAllowancePath", () => {
  it("is a closed SVG path", () => {
    const d = seamAllowancePath(squarePiece(true), 1);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
});
