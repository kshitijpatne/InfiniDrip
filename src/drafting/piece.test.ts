import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece, Edge, edgeStart, edgeEnd, edgeLength, pieceEdge, perimeter } from "./piece";

const lineEdge: Edge = { kind: "line", name: "a", start: point(0, 0), end: point(3, 4) };
const curveEdge: Edge = { kind: "curve", name: "b", curve: {
  start: point(0, 0), control1: point(1, 0), control2: point(2, 0), end: point(3, 0) } };

describe("edgeStart / edgeEnd", () => {
  it("read the ends of a line", () => {
    expect(edgeStart(lineEdge)).toEqual({ x: 0, y: 0 });
    expect(edgeEnd(lineEdge)).toEqual({ x: 3, y: 4 });
  });
  it("read the ends of a curve", () => {
    expect(edgeStart(curveEdge)).toEqual({ x: 0, y: 0 });
    expect(edgeEnd(curveEdge)).toEqual({ x: 3, y: 0 });
  });
});

describe("edgeLength", () => {
  it("measures a line as a straight distance", () => {
    expect(edgeLength(lineEdge)).toBe(5);
  });
  it("measures a curve as its curve length", () => {
    expect(edgeLength(curveEdge)).toBeCloseTo(3, 5);
  });
});

const square: Piece = {
  name: "square", onFold: false,
  edges: [
    { kind: "line", name: "top", start: point(0, 0), end: point(10, 0) },
    { kind: "line", name: "right", start: point(10, 0), end: point(10, 10) },
    { kind: "line", name: "bottom", start: point(10, 10), end: point(0, 10) },
    { kind: "line", name: "left", start: point(0, 10), end: point(0, 0) },
  ],
};

describe("pieceEdge", () => {
  it("finds an edge by name", () => {
    expect(pieceEdge(square, "right").name).toBe("right");
  });
  it("throws when the edge is missing", () => {
    expect(() => pieceEdge(square, "nope")).toThrow(/no edge named "nope"/);
  });
});

describe("perimeter", () => {
  it("sums all edge lengths", () => {
    expect(perimeter(square)).toBe(40);
  });
});
