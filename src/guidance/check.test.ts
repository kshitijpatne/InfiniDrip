import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import {
  matchLengths,
  inBand,
  cornerAngle,
  squareCorner,
  strictlyIncreasing,
  present,
  buildReport,
} from "./check";

describe("matchLengths", () => {
  it("passes when two seam lengths agree within tolerance", () => {
    const c = matchLengths("seam", 20.0, 20.05);
    expect(c.ok).toBe(true);
    expect(c.detail).toContain("agree");
  });

  it("fails and reports the gap when they differ", () => {
    const c = matchLengths("seam", 20, 23);
    expect(c.ok).toBe(false);
    expect(c.detail).toContain("off by 3.0 cm");
  });
});

describe("inBand", () => {
  it("passes inside the band and fails outside it", () => {
    expect(inBand("ease", 1.5, -1, 4).ok).toBe(true);
    const out = inBand("ease", 9, -1, 4);
    expect(out.ok).toBe(false);
    expect(out.detail).toContain("outside");
  });
});

describe("cornerAngle", () => {
  it("measures a right angle between two edges at a corner", () => {
    expect(cornerAngle(point(1, 0), point(0, 0), point(0, 1))).toBeCloseTo(90);
  });

  it("measures a straight (180°) corner", () => {
    expect(cornerAngle(point(-1, 0), point(0, 0), point(1, 0))).toBeCloseTo(180);
  });
});

describe("squareCorner", () => {
  it("passes a 90° fold corner and fails a skewed one", () => {
    expect(squareCorner("fold", point(1, 0), point(0, 0), point(0, 1)).ok).toBe(true);
    const skew = squareCorner("fold", point(1, 0), point(0, 0), point(1, 1));
    expect(skew.ok).toBe(false);
    expect(skew.detail).toContain("°");
  });
});

describe("strictlyIncreasing", () => {
  it("passes a growing run and fails when a value stalls or drops", () => {
    expect(strictlyIncreasing("run", [1, 2, 3, 4]).ok).toBe(true);
    expect(strictlyIncreasing("run", [1, 2, 2, 3]).ok).toBe(false);
    expect(strictlyIncreasing("run", [3, 2, 1]).ok).toBe(false);
  });
});

describe("present", () => {
  it("wraps a yes/no fact with its detail", () => {
    const c = present("notches", true, "all marked");
    expect(c).toEqual({ name: "notches", ok: true, detail: "all marked" });
  });
});

describe("buildReport", () => {
  it("passes only when every check passes", () => {
    const pass = buildReport([present("a", true, ""), present("b", true, "")]);
    expect(pass.ok).toBe(true);
    const fail = buildReport([present("a", true, ""), present("b", false, "")]);
    expect(fail.ok).toBe(false);
    expect(fail.checks).toHaveLength(2);
  });
});
