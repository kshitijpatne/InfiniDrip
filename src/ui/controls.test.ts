import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { FIELDS, clamp, applyChange } from "./controls";

describe("FIELDS", () => {
  it("covers every measurement", () => {
    expect(FIELDS.map((f) => f.id).sort()).toEqual(
      ["armholeDepth", "bicep", "chest", "ease", "length", "shoulderWidth", "sleeveLength"]
    );
  });
});

describe("clamp", () => {
  it("raises a value below the minimum", () => {
    expect(clamp(5, 10, 20)).toBe(10);
  });
  it("lowers a value above the maximum", () => {
    expect(clamp(99, 10, 20)).toBe(20);
  });
  it("leaves a value already in range", () => {
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe("applyChange", () => {
  const chest = FIELDS[0];
  it("updates the field with a valid value", () => {
    expect(applyChange(STANDARD_M, chest, "120").chest).toBe(120);
  });
  it("clamps an out-of-range value", () => {
    expect(applyChange(STANDARD_M, chest, "999").chest).toBe(160);
  });
  it("ignores non-numeric input", () => {
    expect(applyChange(STANDARD_M, chest, "abc")).toEqual(STANDARD_M);
  });
  it("never mutates the original measurements", () => {
    const before = { ...STANDARD_M };
    applyChange(STANDARD_M, chest, "120");
    expect(STANDARD_M).toEqual(before);
  });
});
