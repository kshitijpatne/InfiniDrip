import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { currentStyles, nearbyStyles, styleSuggestions, styleNames, matchStyle } from "./style";

describe("currentStyles", () => {
  it("classifies the standard block as a Classic tee", () => {
    expect(currentStyles(STANDARD_M)).toEqual(["Classic tee"]);
  });
  it("classifies a short, regular-ease block as a Crop tee", () => {
    expect(currentStyles({ ...STANDARD_M, length: 50 })).toContain("Crop tee");
  });
  it("returns nothing when the measurements fall between styles", () => {
    expect(currentStyles({ ...STANDARD_M, length: 76 })).toEqual([]);
  });
});

describe("nearbyStyles", () => {
  const nearby = nearbyStyles(STANDARD_M);
  it("ranks the closest style first", () => {
    expect(nearby[0].name).toBe("Relaxed tee"); // +3 ease, the smallest step
  });
  it("tells you the exact change to reach a style", () => {
    const relaxed = nearby.find((n) => n.name === "Relaxed tee")!;
    expect(relaxed.deltas).toContainEqual({ id: "ease", change: 3 });
    const longline = nearbyStyles(STANDARD_M, 9).find((n) => n.name === "Longline tee")!;
    expect(longline.deltas).toContainEqual({ id: "length", change: 8 });
  });
  it("never includes a style you are already in", () => {
    expect(nearby.map((n) => n.name)).not.toContain("Classic tee");
  });
  it("limits how many it returns", () => {
    expect(nearbyStyles(STANDARD_M, 2)).toHaveLength(2);
  });
});

describe("styleSuggestions", () => {
  it("bundles current and nearby together", () => {
    const s = styleSuggestions(STANDARD_M);
    expect(s.current).toEqual(["Classic tee"]);
    expect(s.nearby.length).toBeGreaterThan(0);
  });
});

describe("styleNames", () => {
  it("lists every style as a selectable target", () => {
    const names = styleNames();
    expect(names).toContain("Classic tee");
    expect(names).toContain("Oversized tee");
    expect(names.length).toBeGreaterThan(5);
  });
});

describe("matchStyle", () => {
  it("reports zero deltas when you already match the chosen style", () => {
    const match = matchStyle(STANDARD_M, "Classic tee");
    expect(match.deltas).toEqual([]);
    expect(match.distance).toBe(0);
  });

  it("reports the signed gap to a chosen target you are not in", () => {
    const match = matchStyle(STANDARD_M, "Oversized tee");
    expect(match.distance).toBeGreaterThan(0);
    expect(match.deltas).toContainEqual({ id: "ease", change: 9 });
  });

  it("reports a length gap for a length-defined target", () => {
    const match = matchStyle(STANDARD_M, "Crop tee");
    expect(match.deltas).toContainEqual({ id: "length", change: -13 });
  });

  it("throws on an unknown style name", () => {
    expect(() => matchStyle(STANDARD_M, "Nonexistent tee")).toThrow();
  });
});
