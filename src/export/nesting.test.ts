import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { STANDARD_M, draftTshirt, rolePiece, AllowanceSpec } from "../drafting";
import { flattenPiece, polylineBounds } from "./layout";

const UNIFORM: AllowanceSpec = { default: 1 };
import { polygonArea, nestPieces } from "./nesting";

// Two flat squares, made directly (no drafting) so the maths is easy to check.
// A FlatPiece just needs name/sew/cut point loops.
function squareFlat(name: string, size: number) {
  const loop = [point(0, 0), point(size, 0), point(size, size), point(0, size)];
  return { name, sew: loop, cut: loop };
}

describe("polygonArea", () => {
  it("computes the area of a closed loop (shoelace)", () => {
    const sq = [point(0, 0), point(4, 0), point(4, 3), point(0, 3)];
    expect(polygonArea(sq)).toBeCloseTo(12);
  });

  it("is sign-independent (clockwise or counter-clockwise)", () => {
    const cw = [point(0, 0), point(0, 3), point(4, 3), point(4, 0)];
    expect(polygonArea(cw)).toBeCloseTo(12);
  });
});

describe("nestPieces", () => {
  it("returns an empty-ish sheet for no pieces", () => {
    const r = nestPieces([], 150);
    expect(r.placed).toHaveLength(0);
    expect(r.fabricLength).toBe(2); // just the two margins
    expect(r.utilization).toBe(0);
    expect(r.fits).toBe(true);
  });

  it("keeps every piece within a wide bolt on a single shelf", () => {
    const r = nestPieces([squareFlat("a", 10), squareFlat("b", 10)], 150);
    expect(r.placed).toHaveLength(2);
    // Both fit side by side: length is one shelf tall (10 + two 1 cm margins).
    expect(r.fabricLength).toBeCloseTo(12);
    expect(r.fits).toBe(true);
  });

  it("wraps to a new shelf when the width runs out", () => {
    // Bolt only wide enough for one 10 cm square at a time.
    const r = nestPieces([squareFlat("a", 10), squareFlat("b", 10)], 12);
    // Second square drops to a second shelf: 1 + 10 + 2 gap + 10 + 1.
    expect(r.fabricLength).toBeCloseTo(24);
  });

  it("reports utilization as piece area over sheet area", () => {
    const r = nestPieces([squareFlat("a", 10)], 100);
    // one 10x10 = 100 cm² of a 100 x 12 sheet
    expect(r.utilization).toBeCloseTo(100 / (100 * 12));
    expect(r.utilization).toBeGreaterThan(0);
    expect(r.utilization).toBeLessThan(1);
  });

  it("flags a piece wider than the usable fabric", () => {
    const r = nestPieces([squareFlat("wide", 40)], 30);
    expect(r.fits).toBe(false);
  });

  it("packs tallest pieces first without mutating the input order", () => {
    const input = [squareFlat("short", 5), squareFlat("tall", 20)];
    const r = nestPieces(input, 150);
    // input array is untouched
    expect(input[0].name).toBe("short");
    // placement order is tallest-first
    expect(r.placed[0].name).toBe("tall");
  });

  it("nests the real t-shirt block within a standard bolt", () => {
    const block = draftTshirt(STANDARD_M);
    const flats = [rolePiece(block, "front"), rolePiece(block, "back"), rolePiece(block, "sleeve")].map((p) => flattenPiece(p, UNIFORM));
    const r = nestPieces(flats, 150);
    expect(r.placed).toHaveLength(3);
    expect(r.fits).toBe(true);
    // every placed cut sits inside the sheet the estimator reported
    for (const p of r.placed) {
      const b = polylineBounds(p.cut);
      expect(b.minX).toBeGreaterThanOrEqual(0);
      expect(b.minY + b.height).toBeLessThanOrEqual(r.fabricLength + 1e-6);
    }
  });
});
