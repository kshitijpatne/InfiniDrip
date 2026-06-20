import { describe, it, expect } from "vitest";
import { STANDARD_M, derive } from "./measurements";

describe("STANDARD_M", () => {
  it("is a complete size-M measurement set", () => {
    expect(STANDARD_M.chest).toBe(100);
    expect(STANDARD_M.ease).toBe(10);
  });
});

describe("derive", () => {
  const d = derive(STANDARD_M);
  it("halves the chest panel including ease", () => {
    expect(d.chestWidthHalf).toBeCloseTo(27.5); // (100 + 10) / 4
  });
  it("places the shoulder point at half the shoulder width", () => {
    expect(d.shoulderHalf).toBeCloseTo(22.5);
  });
  it("derives the neck opening and front/back neck depths", () => {
    expect(d.neckWidthHalf).toBeCloseTo(7);     // 100 / 20 + 2
    expect(d.frontNeckDepth).toBeCloseTo(8);    // neckWidthHalf + 1
    expect(d.backNeckDepth).toBeCloseTo(2.5);
  });
  it("uses a fixed shoulder slope", () => {
    expect(d.shoulderSlope).toBeCloseTo(4);
  });
});
