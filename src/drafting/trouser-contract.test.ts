import { describe, it, expect } from "vitest";
import { Measurements, STANDARD_M } from "./measurements";
import {
  DEFAULT_TROUSER_OPTIONS,
  resolveTrouserOptions,
  TROUSER_FIELDS,
  TROUSER_OPTION_DEFINITIONS,
} from "./trouser-contract";

describe("trouser contract", () => {
  it("declares lower-body fields without reusing upper-body length", () => {
    expect(TROUSER_FIELDS).toEqual([
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
    ]);
    expect(TROUSER_FIELDS).not.toContain("length" as keyof Measurements);
    expect(STANDARD_M.inseam).toBeGreaterThan(STANDARD_M.hipDepth);
  });

  it("has a complete option table with defaults in each declared range", () => {
    expect(TROUSER_OPTION_DEFINITIONS).toHaveLength(10);
    for (const definition of TROUSER_OPTION_DEFINITIONS) {
      expect(definition.min).toBeLessThan(definition.defaultValue);
      expect(definition.defaultValue).toBeLessThan(definition.max);
      expect(definition.unit).toBe("cm");
      expect(definition.group).toBeTruthy();
      expect(definition.help).toBeTruthy();
      expect(DEFAULT_TROUSER_OPTIONS[definition.id as keyof typeof DEFAULT_TROUSER_OPTIONS])
        .toBe(definition.defaultValue);
    }
  });

  it("restores missing/nonfinite options but preserves finite invalid work in progress", () => {
    const options = resolveTrouserOptions({ frontRiseEase: 999, backRiseEase: NaN });
    expect(options.frontRiseEase).toBe(999);
    expect(options.backRiseEase).toBe(DEFAULT_TROUSER_OPTIONS.backRiseEase);
    expect(options.pocketDrop).toBe(DEFAULT_TROUSER_OPTIONS.pocketDrop);
  });
});
