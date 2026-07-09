import { describe, it, expect } from "vitest";
import { point } from "./point";
import { rotatePoint, angleBetween } from "./rotate";

const close = (a: { x: number; y: number }, b: { x: number; y: number }): void => {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
};

describe("rotatePoint", () => {
  it("leaves the pivot itself untouched", () => {
    close(rotatePoint(point(3, 4), point(3, 4), 1.2), point(3, 4));
  });

  it("turns +x into +y with a quarter turn", () => {
    close(rotatePoint(point(1, 0), point(0, 0), Math.PI / 2), point(0, 1));
  });

  it("preserves distance from the pivot (it is rigid)", () => {
    const p = point(5, -2);
    const about = point(1, 1);
    const r = rotatePoint(p, about, 0.7);
    expect(Math.hypot(r.x - about.x, r.y - about.y))
      .toBeCloseTo(Math.hypot(p.x - about.x, p.y - about.y), 9);
  });
});

describe("angleBetween", () => {
  it("measures the turn from one arm to the other", () => {
    expect(angleBetween(point(1, 0), point(0, 0), point(0, 1))).toBeCloseTo(Math.PI / 2, 9);
    expect(angleBetween(point(0, 1), point(0, 0), point(1, 0))).toBeCloseTo(-Math.PI / 2, 9);
  });

  it("is the exact angle that rotates one arm onto the other", () => {
    const about = point(2, 2);
    const from = point(5, 3);
    const to = point(1, 6);
    const a = angleBetween(from, about, to);
    const moved = rotatePoint(from, about, a);
    expect(Math.atan2(moved.y - about.y, moved.x - about.x))
      .toBeCloseTo(Math.atan2(to.y - about.y, to.x - about.x), 9);
  });
});
