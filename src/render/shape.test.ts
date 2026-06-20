import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece } from "../drafting";
import { STANDARD_M, draftFront } from "../drafting";
import { pieceToPath, pieceBounds } from "./shape";

const square: Piece = {
  name: "square", onFold: false,
  edges: [
    { kind: "line", name: "top", start: point(0, 0), end: point(10, 0) },
    { kind: "line", name: "right", start: point(10, 0), end: point(10, 10) },
    { kind: "line", name: "bottom", start: point(10, 10), end: point(0, 10) },
    { kind: "line", name: "left", start: point(0, 10), end: point(0, 0) },
  ],
};

describe("pieceToPath", () => {
  it("writes a closed path of line segments", () => {
    expect(pieceToPath(square)).toBe("M 0 0 L 10 0 L 10 10 L 0 10 L 0 0 Z");
  });
  it("emits a cubic command for curved edges", () => {
    const path = pieceToPath(draftFront(STANDARD_M));
    expect(path.startsWith("M ")).toBe(true);
    expect(path).toContain("C ");
    expect(path.endsWith("Z")).toBe(true);
  });
});

describe("pieceBounds", () => {
  it("boxes a simple square", () => {
    expect(pieceBounds(square)).toEqual({ minX: 0, minY: 0, width: 10, height: 10 });
  });
  it("boxes the front block at its chest width and length", () => {
    const b = pieceBounds(draftFront(STANDARD_M));
    expect(b.minX).toBe(0);
    expect(b.minY).toBe(0);
    expect(b.width).toBeCloseTo(27.5);
    expect(b.height).toBeCloseTo(70);
  });
});
