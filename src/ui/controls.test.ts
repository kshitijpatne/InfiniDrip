import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { FIELDS, inputError, applyChange } from "./controls";

describe("FIELDS", () => {
  it("covers every measurement", () => {
    // FIELDS must carry metadata for every key on Measurements (waist/hip added s37).
    expect(FIELDS.map((f) => f.id).sort()).toEqual(Object.keys(STANDARD_M).sort());
  });
});

describe("inputError", () => {
  it("diagnoses nonfinite and out-of-range input without modifying it", () => {
    const field = { label: "Chest", min: 60, max: 160 };
    for (const value of [NaN, Infinity, -Infinity]) expect(inputError(value, field)).toContain("finite number");
    for (const value of [20, 999]) expect(inputError(value, field)).toContain("60–160");
    for (const value of [60, 100, 160]) expect(inputError(value, field)).toBeNull();
  });
});

describe("applyChange", () => {
  const chest = FIELDS[0];
  it("updates the field with a valid value", () => {
    expect(applyChange(STANDARD_M, chest, "120").chest).toBe(120);
  });
  it("preserves an out-of-range value", () => {
    expect(applyChange(STANDARD_M, chest, "999").chest).toBe(999);
  });
  it("represents empty and non-numeric input as incomplete", () => {
    for (const raw of ["abc", "", " "]) expect(applyChange(STANDARD_M, chest, raw).chest).toBeNaN();
  });
  it("never mutates the original measurements", () => {
    const before = { ...STANDARD_M };
    applyChange(STANDARD_M, chest, "120");
    expect(STANDARD_M).toEqual(before);
  });
});
