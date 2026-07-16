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
