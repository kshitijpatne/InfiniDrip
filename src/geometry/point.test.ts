import { describe, it, expect } from "vitest";
import { point, distance, lerp } from "./point";

describe("point", () => {
  it("stores the x and y it is given", () => {
    expect(point(3, 4)).toEqual({ x: 3, y: 4 });
  });
});

describe("distance", () => {
  it("measures a 3-4-5 triangle as 5", () => {
    expect(distance(point(0, 0), point(3, 4))).toBe(5);
  });
  it("is zero between a point and itself", () => {
    expect(distance(point(2, 7), point(2, 7))).toBe(0);
  });
  it("handles negative coordinates", () => {
    expect(distance(point(-1, -1), point(-1, 4))).toBe(5);
  });
});

describe("lerp", () => {
  it("returns the start at t = 0", () => {
    expect(lerp(point(0, 0), point(10, 20), 0)).toEqual({ x: 0, y: 0 });
  });
  it("returns the end at t = 1", () => {
    expect(lerp(point(0, 0), point(10, 20), 1)).toEqual({ x: 10, y: 20 });
  });
  it("returns the midpoint at t = 0.5", () => {
    expect(lerp(point(0, 0), point(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
  });
});
