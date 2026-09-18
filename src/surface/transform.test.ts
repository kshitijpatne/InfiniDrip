import { describe, it, expect } from "vitest";
import { point } from "../geometry/point";
import {
  artworkCorners,
  boundingBox,
  boxesOverlap,
  effectiveResolution,
  type BoundingBox,
} from "./transform";

const box = (minX: number, minY: number, maxX: number, maxY: number): BoundingBox => ({
  minX, minY, maxX, maxY,
});

const closeBox = (actual: BoundingBox, expected: BoundingBox): void => {
  expect(actual.minX).toBeCloseTo(expected.minX, 9);
  expect(actual.minY).toBeCloseTo(expected.minY, 9);
  expect(actual.maxX).toBeCloseTo(expected.maxX, 9);
  expect(actual.maxY).toBeCloseTo(expected.maxY, 9);
};

describe("artworkCorners", () => {
  it("returns the untransformed rectangle for the identity transform", () => {
    const corners = artworkCorners(20, 10, { dx: 0, dy: 0, scale: 1, rotationDeg: 0 });
    expect(corners).toHaveLength(4);
    closeBox(boundingBox(corners)!, box(-10, -5, 10, 5));
  });

  it("scales about the artwork centre before translating", () => {
    const corners = artworkCorners(20, 10, { dx: 5, dy: -3, scale: 2, rotationDeg: 0 });
    closeBox(boundingBox(corners)!, box(-15, -13, 25, 7));
  });

  it("rotates a wide rectangle upright with a quarter turn", () => {
    const corners = artworkCorners(20, 10, { dx: 0, dy: 0, scale: 1, rotationDeg: 90 });
    closeBox(boundingBox(corners)!, box(-5, -10, 5, 10));
  });

  it("keeps corner order cyclic after rotation", () => {
    const corners = artworkCorners(20, 10, { dx: 0, dy: 0, scale: 1, rotationDeg: 180 });
    expect(corners).toHaveLength(4);
    closeBox(boundingBox(corners)!, box(-10, -5, 10, 5));
  });
});

describe("boundingBox", () => {
  it("returns null for an empty ring", () => {
    expect(boundingBox([])).toBeNull();
  });
  it("bounds a single point to itself", () => {
    expect(boundingBox([point(2, 3)])).toEqual(box(2, 3, 2, 3));
  });
  it("bounds a triangle exactly", () => {
    expect(boundingBox([point(0, 0), point(4, 1), point(-2, 6)]))
      .toEqual(box(-2, 0, 4, 6));
  });
});

describe("boxesOverlap", () => {
  it("detects shared area", () => {
    expect(boxesOverlap(box(0, 0, 4, 4), box(2, 2, 6, 6))).toBe(true);
  });
  it("counts touching edges as overlap", () => {
    expect(boxesOverlap(box(0, 0, 4, 4), box(4, 0, 8, 4))).toBe(true);
  });
  it("rejects x-separated boxes", () => {
    expect(boxesOverlap(box(0, 0, 4, 4), box(5, 0, 8, 4))).toBe(false);
  });
  it("rejects y-separated boxes", () => {
    expect(boxesOverlap(box(0, 0, 4, 4), box(0, 5, 4, 8))).toBe(false);
  });
});

describe("effectiveResolution", () => {
  it("divides source pixels by placed centimetres", () => {
    expect(effectiveResolution(1200, 1500, 20, 25, 1.5))
      .toEqual({ xPxPerCm: 40, yPxPerCm: 40 });
  });
  it("returns null for non-finite input", () => {
    expect(effectiveResolution(NaN, 1500, 20, 25, 1)).toBeNull();
    expect(effectiveResolution(1200, Infinity, 20, 25, 1)).toBeNull();
    expect(effectiveResolution("1200" as unknown as number, 1500, 20, 25, 1)).toBeNull();
  });
  it("returns null for non-positive geometry", () => {
    expect(effectiveResolution(1200, 1500, 0, 25, 1)).toBeNull();
    expect(effectiveResolution(1200, 1500, 20, -25, 1)).toBeNull();
    expect(effectiveResolution(1200, 1500, 20, 25, 0)).toBeNull();
  });
});
