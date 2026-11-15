import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { STANDARD_M, TSHIRT_NOTCHES, draftTshirt, rolePiece } from "../drafting";
import {
  pointOnEdge,
  normalOnEdge,
  resolveNotch,
  resolveGrainline,
  notchSvg,
  grainlineSvg,
  grainlineMarkSegments,
} from "./notch";
import { Edge } from "../drafting";

const block = draftTshirt(STANDARD_M);

const hLine: Edge = { kind: "line", name: "top", start: point(0, 10), end: point(20, 10) };
const vLine: Edge = { kind: "line", name: "side", start: point(5, 0), end: point(5, 30) };

describe("pointOnEdge", () => {
  it("returns the start at t=0", () => {
    expect(pointOnEdge(hLine, 0)).toEqual({ x: 0, y: 10 });
  });

  it("returns the end at t=1", () => {
    expect(pointOnEdge(hLine, 1)).toEqual({ x: 20, y: 10 });
  });

  it("returns the midpoint at t=0.5 on a line", () => {
    const mid = pointOnEdge(hLine, 0.5);
    expect(mid.x).toBeCloseTo(10);
    expect(mid.y).toBeCloseTo(10);
  });

  it("samples a curve edge without throwing", () => {
    const armhole = rolePiece(block, "front").edges.find((e) => e.name === "armhole")!;
    const mid = pointOnEdge(armhole, 0.5);
    expect(typeof mid.x).toBe("number");
    expect(typeof mid.y).toBe("number");
  });
});

describe("normalOnEdge", () => {
  it("is a unit vector (length ≈ 1)", () => {
    const n = normalOnEdge(hLine, 0.5);
    expect(Math.hypot(n.x, n.y)).toBeCloseTo(1, 3);
  });

  it("points perpendicular to a horizontal edge (x≈0)", () => {
    const n = normalOnEdge(hLine, 0.5);
    expect(Math.abs(n.x)).toBeCloseTo(0, 2);
  });

  it("points perpendicular to a vertical edge (y≈0)", () => {
    const n = normalOnEdge(vLine, 0.5);
    expect(Math.abs(n.y)).toBeCloseTo(0, 2);
  });
});

describe("resolveNotch", () => {
  it("resolves a shoulder notch on the front piece", () => {
    const notch = resolveNotch(rolePiece(block, "front"), { edgeName: "shoulder", t: 0.5 });
    expect(typeof notch.point.x).toBe("number");
    expect(Math.hypot(notch.normal.x, notch.normal.y)).toBeCloseTo(1, 3);
  });

  it("throws if the edge name does not exist", () => {
    expect(() => resolveNotch(rolePiece(block, "front"), { edgeName: "nonexistent", t: 0.5 })).toThrow();
  });
});

describe("resolveGrainline", () => {
  it("resolves a grainline for the front piece", () => {
    const recipe = TSHIRT_NOTCHES.find((r) => r.pieceName === "front")!;
    const gl = resolveGrainline(rolePiece(block, "front"), recipe.grainline);
    expect(typeof gl.top.x).toBe("number");
    expect(typeof gl.bottom.y).toBe("number");
    expect(gl.top.y).toBeLessThan(gl.bottom.y);
  });

  it("uses a custom live-geometry resolver when supplied", () => {
    const piece = rolePiece(block, "front");
    const resolved = { top: point(2, 3), bottom: point(12, 13) };
    expect(resolveGrainline(piece, {
      topEdge: "unused",
      topT: 0,
      bottomEdge: "unused",
      bottomT: 1,
      resolve: () => resolved,
    })).toBe(resolved);
  });
});

describe("notchSvg", () => {
  it("produces an SVG line element", () => {
    const notch = resolveNotch(rolePiece(block, "front"), { edgeName: "shoulder", t: 0.5 });
    const svg = notchSvg(notch, 1.5, "#000", 1);
    expect(svg.startsWith("<line")).toBe(true);
    expect(svg).toContain("x1=");
    expect(svg).toContain("stroke=");
  });
});

describe("grainlineSvg", () => {
  it("produces a line + two chevron paths", () => {
    const recipe = TSHIRT_NOTCHES.find((r) => r.pieceName === "front")!;
    const gl = resolveGrainline(rolePiece(block, "front"), recipe.grainline);
    const svg = grainlineSvg(gl, "#888", 1, 1.2);
    expect(svg).toContain("<line");
    expect(svg).toContain("<path");
  });

  it("preserves the exact vertical grainline SVG bytes", () => {
    expect(grainlineSvg({ top: { x: 10, y: 10 }, bottom: { x: 10, y: 30 } }, "#123", 0.5, 2)).toBe(
      '<line x1="10" y1="10" x2="10" y2="30" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 8 12 L 10 10 L 12 12" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 8 28 L 10 30 L 12 28" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>'
    );
  });

  it("preserves legacy horizontal chevrons for a diagonal grainline by default", () => {
    expect(grainlineSvg({ top: { x: 0, y: 0 }, bottom: { x: 10, y: 10 } }, "#123", 0.5, 1)).toBe(
      '<line x1="0" y1="0" x2="10" y2="10" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 4 1 L 5 0 L 6 1" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 4 9 L 5 10 L 6 9" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>'
    );
  });

  it("aligns both chevrons to a diagonal grainline when the rule opts in", () => {
    expect(grainlineSvg({ top: { x: 0, y: 0 }, bottom: { x: 10, y: 10 } }, "#123", 0.5, 1, true)).toBe(
      '<line x1="0" y1="0" x2="10" y2="10" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 0 1.414 L 0 0 L 1.414 0" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 8.586 10 L 10 10 L 10 8.586" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>'
    );
  });

  it("preserves legacy chevrons for a zero-length default grainline", () => {
    expect(grainlineSvg({ top: { x: 2, y: 3 }, bottom: { x: 2, y: 3 } }, "#123", 0.5, 1)).toBe(
      '<line x1="2" y1="3" x2="2" y2="3" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 1 4 L 2 3 L 3 4" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 1 2 L 2 3 L 3 2" fill="none" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>'
    );
  });

  it("emits only the line for a zero-length grainline opted into directional chevrons", () => {
    expect(grainlineSvg({ top: { x: 2, y: 3 }, bottom: { x: 2, y: 3 } }, "#123", 0.5, 1, true)).toBe(
      '<line x1="2" y1="3" x2="2" y2="3" stroke="#123" stroke-width="0.5" vector-effect="non-scaling-stroke"/>'
    );
  });

  it("keeps the legacy horizontal DXF chevron segments by default", () => {
    expect(grainlineMarkSegments({ top: { x: 0, y: 0 }, bottom: { x: 10, y: 10 } }, 1)).toEqual([
      { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
      { start: { x: 4, y: 1 }, end: { x: 0, y: 0 } },
      { start: { x: 6, y: 1 }, end: { x: 0, y: 0 } },
      { start: { x: 4, y: 9 }, end: { x: 10, y: 10 } },
      { start: { x: 6, y: 9 }, end: { x: 10, y: 10 } },
    ]);
  });

  it("exposes the same directional diagonal spine and chevron segments to opted-in exporters", () => {
    const segments = grainlineMarkSegments({ top: { x: 0, y: 0 }, bottom: { x: 10, y: 10 } }, 1, true);
    expect(segments).toHaveLength(5);
    expect(segments[0]).toEqual({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
    expect(segments[1]?.start.x).toBeCloseTo(0, 10);
    expect(segments[1]?.start.y).toBeCloseTo(Math.SQRT2, 10);
    expect(segments[1]?.end).toEqual({ x: 0, y: 0 });
    expect(segments[2]?.end.x).toBeCloseTo(Math.SQRT2, 10);
    expect(segments[2]?.end.y).toBeCloseTo(0, 10);
    expect(segments[3]?.start.x).toBeCloseTo(10 - Math.SQRT2, 10);
    expect(segments[3]?.start.y).toBeCloseTo(10, 10);
    expect(segments[4]?.end.x).toBeCloseTo(10, 10);
    expect(segments[4]?.end.y).toBeCloseTo(10 - Math.SQRT2, 10);
  });

  it("exposes only the spine segment for a zero-length directional grainline", () => {
    expect(grainlineMarkSegments({ top: { x: 2, y: 3 }, bottom: { x: 2, y: 3 } }, 1, true)).toEqual([
      { start: { x: 2, y: 3 }, end: { x: 2, y: 3 } },
    ]);
  });
});

describe("TSHIRT_NOTCHES", () => {
  it("has rules for front, back, and sleeve", () => {
    const names = TSHIRT_NOTCHES.map((r) => r.pieceName);
    expect(names).toContain("front");
    expect(names).toContain("back");
    expect(names).toContain("sleeve");
  });

  it("all notch rules resolve without error on STANDARD_M", () => {
    const pieces = { front: rolePiece(block, "front"), back: rolePiece(block, "back"), sleeve: rolePiece(block, "sleeve") };
    for (const recipe of TSHIRT_NOTCHES) {
      const piece = pieces[recipe.pieceName as keyof typeof pieces];
      for (const rule of recipe.notches) {
        expect(() => resolveNotch(piece, rule)).not.toThrow();
      }
      expect(() => resolveGrainline(piece, recipe.grainline)).not.toThrow();
    }
  });
});
