import { describe, it, expect } from "vitest";
import { point } from "./point";
import { cubicPoint, cubicLength, type CubicBezier } from "./curve";

// Controls spaced evenly on a line make the Bézier behave like that line,
// which gives us known answers to test against.
const straight: CubicBezier = {
  start: point(0, 0),
  control1: point(1, 0),
  control2: point(2, 0),
  end: point(3, 0),
};

describe("cubicPoint", () => {
  it("returns the start at t = 0", () => {
    expect(cubicPoint(straight, 0)).toEqual({ x: 0, y: 0 });
  });
  it("returns the end at t = 1", () => {
    expect(cubicPoint(straight, 1)).toEqual({ x: 3, y: 0 });
  });
  it("returns the midpoint of a straight Bézier at t = 0.5", () => {
    const mid = cubicPoint(straight, 0.5);
    expect(mid.x).toBeCloseTo(1.5);
    expect(mid.y).toBeCloseTo(0);
  });
});

describe("cubicLength", () => {
  it("measures a straight Bézier as its end-to-end distance", () => {
    expect(cubicLength(straight)).toBeCloseTo(3, 5);
  });
  it("is zero when every point is the same", () => {
    const dot: CubicBezier = {
      start: point(2, 2), control1: point(2, 2),
      control2: point(2, 2), end: point(2, 2),
    };
    expect(cubicLength(dot)).toBe(0);
  });
  it("stays stable as the sample count rises", () => {
    const curved: CubicBezier = {
      start: point(0, 0), control1: point(0, 10),
      control2: point(10, 10), end: point(10, 0),
    };
    const coarse = cubicLength(curved, 16);
    const fine = cubicLength(curved, 1024);
    expect(Math.abs(fine - coarse)).toBeLessThan(0.1);
  });
});
