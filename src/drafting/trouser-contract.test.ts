import { describe, it, expect } from "vitest";
import { Measurements, STANDARD_M } from "./measurements";
import {
  DEFAULT_TROUSER_OPTIONS,
  resolveTrouserOptions,
  TROUSER_FIELDS,
  TROUSER_BARREL_BOW_OPTION,
  TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY,
  TROUSER_PLEATED_FRONT_ENTRY_ID,
  TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY,
  TROUSER_ELASTIC_PULLON_ENTRY_ID,
  TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY,
  TROUSER_CARGO_ENTRY_ID,
  TROUSER_CARGO_PROFILE_ROUTE_KEY,
  TROUSER_OPTION_DEFINITIONS,
  TROUSER_SHARED_OPTION_DEFINITIONS,
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
    expect(TROUSER_SHARED_OPTION_DEFINITIONS).toHaveLength(11);
    expect(TROUSER_OPTION_DEFINITIONS).toHaveLength(22);
    expect(TROUSER_OPTION_DEFINITIONS).toContain(TROUSER_BARREL_BOW_OPTION);
    expect(TROUSER_BARREL_BOW_OPTION.appliesToStarterEntryId).toBe("trouser-barrel-leg-digital-v1");
    expect(resolveTrouserOptions({ [TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY]: 1 }).barrelBowCm).toBe(2);
    expect(TROUSER_OPTION_DEFINITIONS.filter((option) => option.appliesToStarterEntryId === TROUSER_PLEATED_FRONT_ENTRY_ID)
      .map((option) => [option.id, option.defaultValue, option.min, option.max, option.step])).toEqual([
      ["frontPleatIntakeCm", 4, 2, 8, 0.5],
      ["frontPleatOffsetCm", 6, 4, 12, 0.5],
      ["frontPleatStitchDepthCm", 8, 4, 16, 0.5],
    ]);
    expect(resolveTrouserOptions({ [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 })).toMatchObject({
      frontPleatIntakeCm: 4, frontPleatOffsetCm: 6, frontPleatStitchDepthCm: 8,
    });
    expect(TROUSER_OPTION_DEFINITIONS.filter((option) => option.appliesToStarterEntryId === TROUSER_ELASTIC_PULLON_ENTRY_ID)
      .map((option) => [option.id, option.defaultValue, option.min, option.max, option.step])).toEqual([
      ["waistGatherRatio", 1.25, 1, 1.8, 0.05],
      ["casingDepthCm", 4, 2, 8, 0.5],
    ]);
    expect(resolveTrouserOptions({ [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 })).toMatchObject({
      waistbandDepth: 0, waistGatherRatio: 1.25, casingDepthCm: 4,
    });
    expect(TROUSER_OPTION_DEFINITIONS.filter((option) => option.appliesToStarterEntryId === TROUSER_CARGO_ENTRY_ID)
      .map((option) => [option.id, option.defaultValue, option.min, option.max, option.step])).toEqual([
      ["cargoPocketWidthCm", 18, 12, 24, 0.5],
      ["cargoPocketHeightCm", 20, 14, 26, 0.5],
      ["cargoPleatIntakeCm", 4, 0, 8, 0.5],
      ["cargoFlapDepthCm", 5, 3, 9, 0.5],
      ["cargoPocketVerticalOffsetCm", 0, -6, 6, 0.5],
    ]);
    expect(resolveTrouserOptions({ [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 })).toMatchObject({
      cargoPocketWidthCm: 18, cargoPocketHeightCm: 20, cargoPleatIntakeCm: 4,
      cargoFlapDepthCm: 5, cargoPocketVerticalOffsetCm: 0,
      [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1,
    });
    expect(resolveTrouserOptions({ cargoPocketWidthCm: 99 })).not.toHaveProperty("cargoPocketWidthCm");
    for (const definition of TROUSER_SHARED_OPTION_DEFINITIONS) {
      expect(definition.min).toBeLessThan(definition.defaultValue);
      expect(definition.defaultValue).toBeLessThan(definition.max);
      expect(["cm", "°"]).toContain(definition.unit);
      expect(definition.group).toBeTruthy();
      expect(definition.help).toBeTruthy();
      expect(DEFAULT_TROUSER_OPTIONS[definition.id as keyof typeof DEFAULT_TROUSER_OPTIONS])
        .toBe(definition.defaultValue);
    }
  });

  it("restores missing/nonfinite options but preserves finite invalid work in progress", () => {
    const options = resolveTrouserOptions({ frontRiseEase: 999, backRiseEase: NaN, pocketAngle: 85 });
    expect(options.frontRiseEase).toBe(999);
    expect(options.backRiseEase).toBe(DEFAULT_TROUSER_OPTIONS.backRiseEase);
    expect(options.pocketAngle).toBe(85);
    expect(options.pocketDrop).toBe(DEFAULT_TROUSER_OPTIONS.pocketDrop);
    const pleat = resolveTrouserOptions({
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1,
      frontPleatIntakeCm: 99,
      frontPleatOffsetCm: 999,
      frontPleatStitchDepthCm: 1,
    });
    expect(pleat).toMatchObject({ frontPleatIntakeCm: 99, frontPleatOffsetCm: 999, frontPleatStitchDepthCm: 1 });
    expect(resolveTrouserOptions({
      [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1,
      waistGatherRatio: 1.237,
      casingDepthCm: 10,
    })).toMatchObject({ waistGatherRatio: 1.237, casingDepthCm: 10 });
  });
});
