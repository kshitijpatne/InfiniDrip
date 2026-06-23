import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { currentStyles, nearbyStyles, styleSuggestions } from "./style";

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
