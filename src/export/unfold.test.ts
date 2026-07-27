import { describe, it, expect } from "vitest";
import { Point } from "../geometry";
import { STANDARD_M, TEE, draftTshirt, rolePiece } from "../drafting";
import { flattenPiece, polylineBounds, Polyline } from "./layout";
import { unfoldLoop, unfoldFlat, FOLD_EPS } from "./unfold";

const KNIT = TEE.allowances;

/** Shoelace area of a closed loop — an independent measure of "did it double?". */
function area(loop: Polyline): number {
  let sum = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

// A half square with its fold on x = 0: unfolds to the full 10 × 10 square.
const half: Point[] = [
  { x: 0, y: 0 },
  { x: 5, y: 0 },
  { x: 5, y: 10 },
  { x: 0, y: 10 },
];

describe("unfoldLoop", () => {
  it("mirrors a half outline to its full width", () => {
    const full = unfoldLoop(half);
    expect(full).toContainEqual({ x: -5, y: 0 });
    expect(full).toContainEqual({ x: -5, y: 10 });
    expect(full).toHaveLength(6);
  });

  it("doubles the enclosed area exactly", () => {
    expect(area(unfoldLoop(half))).toBeCloseTo(area(half) * 2, 10);
  });

  it("drops interior fold points so no seam runs down the middle", () => {
    const withInterior: Point[] = [...half, { x: 0, y: 5 }];
    const full = unfoldLoop(withInterior);
    expect(full).toHaveLength(6);
    expect(full.some((p) => p.x === 0 && p.y === 5)).toBe(false);
  });

  it("returns a loop that never touches the fold unchanged", () => {
    const away: Point[] = [
      { x: 2, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
      { x: 2, y: 5 },
    ];
    expect(unfoldLoop(away)).toBe(away);
  });

  it("returns a degenerate all-on-fold loop unchanged", () => {
    const flat: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 5 },
      { x: 0, y: 10 },
    ];
    expect(unfoldLoop(flat)).toBe(flat);
  });

  it("makes a real drafted front symmetric about the fold", () => {
    const front = rolePiece(draftTshirt(STANDARD_M), "front");
    const full = unfoldLoop(flattenPiece(front, KNIT).sew);
    for (const p of full) {
      if (Math.abs(p.x) <= FOLD_EPS) continue;
      const mirror = full.find(
        (q) => Math.abs(q.x + p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6
      );
      expect(mirror).toBeDefined();
    }
  });

  it("doubles a real front's width", () => {
    const front = rolePiece(draftTshirt(STANDARD_M), "front");
    const folded = flattenPiece(front, KNIT);
    const b = polylineBounds(folded.cut);
    const full = polylineBounds(unfoldLoop(folded.cut));
    // The cut line's neckline corner legitimately pokes past the fold (its
    // allowance offsets left of x = 0), so the doubled quantity is the MAX
    // reach from the fold axis, not the folded bounding-box width.
    expect(full.width).toBeCloseTo((b.minX + b.width) * 2, 4);
    expect(full.minX).toBeCloseTo(-(b.minX + b.width), 4);
  });
});

describe("unfoldFlat", () => {
  it("passes a not-on-fold piece through untouched", () => {
    const sleeve = rolePiece(draftTshirt(STANDARD_M), "sleeve");
    const flat = flattenPiece(sleeve, KNIT);
    expect(unfoldFlat(flat, false)).toBe(flat);
  });

  it("unfolds both the sew and the cut loop of an on-fold piece", () => {
    const front = rolePiece(draftTshirt(STANDARD_M), "front");
    const flat = flattenPiece(front, KNIT);
    const full = unfoldFlat(flat, true);
    const cutB = polylineBounds(flat.cut);
    expect(polylineBounds(full.sew).width).toBeCloseTo(polylineBounds(flat.sew).width * 2, 4);
    expect(polylineBounds(full.cut).width).toBeCloseTo((cutB.minX + cutB.width) * 2, 4);
    expect(full.name).toBe(flat.name);
  });
});
