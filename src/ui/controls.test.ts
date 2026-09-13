import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { FIELDS, inputError, applyChange, numericRangePosition, numericRangeState, stepNumericValue } from "./controls";

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

describe("numeric range controls", () => {
  it("classifies values without changing the declared range contract", () => {
    expect(numericRangeState("", 60, 160)).toBe("empty");
    expect(numericRangeState("abc", 60, 160)).toBe("empty");
    expect(numericRangeState("20", 60, 160)).toBe("under");
    expect(numericRangeState("999", 60, 160)).toBe("over");
    expect(numericRangeState("100", 60, 160)).toBe("valid");
    expect(numericRangeState("100")).toBe("valid");
  });

  it("maps bounded values to a rail and leaves open-ended values unscaled", () => {
    expect(numericRangePosition("110", 60, 160)).toBe(50);
    expect(numericRangePosition("20", 60, 160)).toBe(-40);
    expect(numericRangePosition("999", 60, 160)).toBe(939);
    expect(numericRangePosition("", 60, 160)).toBeNull();
    expect(numericRangePosition("100", undefined, 160)).toBeNull();
    expect(numericRangePosition("100", 60, undefined)).toBeNull();
    expect(numericRangePosition("100", 60, 60)).toBeNull();
  });

  it("steps by the declared increment, rounds decimal steps, and recovers bounds explicitly", () => {
    expect(stepNumericValue("100", 1, 1, 60, 160)).toBe("101");
    expect(stepNumericValue("100", -1, 1, 60, 160)).toBe("99");
    expect(stepNumericValue("60", -1, 1, 60, 160)).toBe("60");
    expect(stepNumericValue("160", 1, 1, 60, 160)).toBe("160");
    expect(stepNumericValue("", 1, 1, 60, 160)).toBe("60");
    expect(stepNumericValue("", -1, 1, 60, 160)).toBe("160");
    expect(stepNumericValue("not-a-number", 1, 1, 60, 160)).toBe("60");
    expect(stepNumericValue("not-a-number", -1, 1, 60, 160)).toBe("160");
    expect(stepNumericValue("1", 1, 0.1)).toBe("1.1");
    expect(stepNumericValue("1.1", -1, 0.1)).toBe("1");
    expect(stepNumericValue("", 1, 0.5)).toBe("0.5");
    expect(stepNumericValue("", -1, 0.5)).toBe("-0.5");
  });
});
