import { describe, expect, it } from "vitest";
import {
  HOODIE_POUCH_DEFAULT_OPTIONS,
  HOODIE_POUCH_OPTION_DEFINITIONS,
  HOODIE_BAND_OPTION_DEFINITIONS,
  HOODIE_DEFAULT_OPTIONS,
  HOODIE_OPTION_DEFINITIONS,
  HOODIE_SHAPE_DEFAULT_OPTIONS,
  HOODIE_SHAPE_OPTION_DEFINITIONS,
  resolveHoodieOptions,
  resolveHoodiePouchOptions,
  resolveHoodieShapeOptions,
} from "./hoodie-contract";

describe("Hoodie shape option contract", () => {
  it("matches the G04 digital seeds, ranges, steps, units, and corrective help", () => {
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS.map(({ id, label, defaultValue, min, max, step }) => ({
      id, label, defaultValue, min, max, step,
    }))).toEqual([
      { id: "hoodNecklineWidthEase", label: "Neckline width ease per side", defaultValue: 4, min: 0, max: 12, step: 0.5 },
      { id: "hoodNecklineFrontDrop", label: "Front neckline drop", defaultValue: 8, min: 0, max: 22, step: 0.5 },
      { id: "hoodNeckEase", label: "Hood-to-neckline ease", defaultValue: 0, min: 0, max: 6, step: 0.5 },
      { id: "hoodFrontOverlap", label: "Hood front overlap", defaultValue: 3, min: 0, max: 8, step: 0.5 },
      { id: "hoodHeight", label: "Hood height", defaultValue: 32, min: 20, max: 50, step: 1 },
      { id: "hoodDepth", label: "Hood depth", defaultValue: 28, min: 18, max: 42, step: 1 },
      { id: "hoodCasingWidth", label: "Hood casing width", defaultValue: 2.5, min: 0, max: 5.5, step: 0.5 },
      { id: "hoodDrawcordLength", label: "Drawcord length", defaultValue: 120, min: 60, max: 180, step: 1 },
      { id: "hoodExitSpacing", label: "Drawcord exit spacing", defaultValue: 8, min: 4, max: 16, step: 0.5 },
    ]);
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS.every((definition) =>
      definition.unit === "cm" && definition.group === "Hood" && definition.help?.length)).toBe(true);
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[0]?.help).toContain("same width ease to the front and back");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[1]?.help).toContain("front neckline only");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[2]?.help).toContain("each left or right hood half's front and back neck edges");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[2]?.help).toContain("outer and lining share the same seam");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[3]?.help).toContain("total paired overlap at center front");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[3]?.help).toContain("split evenly across the mirrored hood halves");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[4]?.help).toContain("same authored value is used from XS–XL");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[5]?.help).toContain("same authored value is used from XS–XL");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[6]?.help).toContain("perpendicular depth");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[6]?.help).toContain("zero to remove the casing and both exits");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[7]?.help).toContain("not a cut length");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[7]?.help).toContain("unused while the casing width is zero");
    expect(HOODIE_SHAPE_OPTION_DEFINITIONS[8]?.help).toContain("center-to-center distance");
    expect(HOODIE_SHAPE_DEFAULT_OPTIONS).toEqual({
      hoodNecklineWidthEase: 4,
      hoodNecklineFrontDrop: 8,
      hoodNeckEase: 0,
      hoodFrontOverlap: 3,
      hoodHeight: 32,
      hoodDepth: 28,
      hoodCasingWidth: 2.5,
      hoodDrawcordLength: 120,
      hoodExitSpacing: 8,
    });
    expect(resolveHoodieShapeOptions()).toEqual(HOODIE_SHAPE_DEFAULT_OPTIONS);
  });

  it("fills missing values and preserves explicit zero without clamping", () => {
    expect(resolveHoodieShapeOptions({ hoodHeight: 40 })).toEqual({
      hoodNecklineWidthEase: 4,
      hoodNecklineFrontDrop: 8,
      hoodNeckEase: 0,
      hoodFrontOverlap: 3,
      hoodHeight: 40,
      hoodDepth: 28,
      hoodCasingWidth: 2.5,
      hoodDrawcordLength: 120,
      hoodExitSpacing: 8,
    });
    expect(resolveHoodieShapeOptions({
      hoodNecklineWidthEase: 0,
      hoodNecklineFrontDrop: 0,
      hoodNeckEase: 0,
      hoodFrontOverlap: 0,
      hoodHeight: 0,
      hoodDepth: 0,
      hoodCasingWidth: 0,
      hoodDrawcordLength: 0,
      hoodExitSpacing: 0,
    })).toEqual({
      hoodNecklineWidthEase: 0,
      hoodNecklineFrontDrop: 0,
      hoodNeckEase: 0,
      hoodFrontOverlap: 0,
      hoodHeight: 0,
      hoodDepth: 0,
      hoodCasingWidth: 0,
      hoodDrawcordLength: 0,
      hoodExitSpacing: 0,
    });
  });

  it("preserves invalid raw values for later actionable guidance", () => {
    const options = resolveHoodieShapeOptions({
      hoodNecklineWidthEase: -1,
      hoodNecklineFrontDrop: 30,
      hoodNeckEase: Number.NaN,
      hoodFrontOverlap: Number.NEGATIVE_INFINITY,
      hoodHeight: Number.NaN,
      hoodDepth: Number.POSITIVE_INFINITY,
      hoodCasingWidth: 8,
      hoodDrawcordLength: Number.NaN,
      hoodExitSpacing: Number.NEGATIVE_INFINITY,
    });
    expect(options.hoodNecklineWidthEase).toBe(-1);
    expect(options.hoodNecklineFrontDrop).toBe(30);
    expect(options.hoodNeckEase).toBeNaN();
    expect(options.hoodFrontOverlap).toBe(Number.NEGATIVE_INFINITY);
    expect(options.hoodHeight).toBeNaN();
    expect(options.hoodDepth).toBe(Number.POSITIVE_INFINITY);
    expect(options.hoodCasingWidth).toBe(8);
    expect(options.hoodDrawcordLength).toBeNaN();
    expect(options.hoodExitSpacing).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe("Hoodie pouch option contract", () => {
  it("matches the accepted digital seeds, ranges, steps, and correction guidance", () => {
    expect(HOODIE_POUCH_OPTION_DEFINITIONS.map(({ id, defaultValue, min, max, step }) => ({
      id, defaultValue, min, max, step,
    }))).toEqual([
      { id: "pocketWidth", defaultValue: 34, min: 0, max: 54, step: 1 },
      { id: "pocketHeight", defaultValue: 22, min: 0, max: 38, step: 1 },
      { id: "pocketOpeningLength", defaultValue: 10, min: 4, max: 18, step: 0.5 },
      { id: "pocketOpeningAngle", defaultValue: 45, min: 30, max: 60, step: 1 },
      { id: "pocketHemClearance", defaultValue: 6, min: 0, max: 25, step: 0.5 },
    ]);
    expect(HOODIE_POUCH_OPTION_DEFINITIONS.filter((definition) => definition.id !== "pocketOpeningAngle").every((definition) => definition.unit === "cm")).toBe(true);
    expect(HOODIE_POUCH_OPTION_DEFINITIONS.find((definition) => definition.id === "pocketOpeningAngle")?.unit).toBe("°");
    expect(HOODIE_POUCH_OPTION_DEFINITIONS.every((definition) =>
      definition.group === "Pocket" && definition.help?.length)).toBe(true);
    expect(resolveHoodiePouchOptions()).toEqual(HOODIE_POUCH_DEFAULT_OPTIONS);
    expect(HOODIE_POUCH_DEFAULT_OPTIONS).toEqual({
      pocketWidth: 34,
      pocketHeight: 22,
      pocketOpeningLength: 10,
      pocketOpeningAngle: 45,
      pocketHemClearance: 6,
    });
  });

  it("fills missing fields while preserving zero and explicitly supplied values", () => {
    expect(resolveHoodiePouchOptions({
      pocketWidth: 0,
      pocketHeight: 38,
      pocketOpeningLength: 18,
      pocketOpeningAngle: 30,
      pocketHemClearance: 0,
    })).toEqual({
      pocketWidth: 0,
      pocketHeight: 38,
      pocketOpeningLength: 18,
      pocketOpeningAngle: 30,
      pocketHemClearance: 0,
    });
    expect(resolveHoodiePouchOptions({ pocketWidth: 40 })).toEqual({
      pocketWidth: 40,
      pocketHeight: 22,
      pocketOpeningLength: 10,
      pocketOpeningAngle: 45,
      pocketHemClearance: 6,
    });
  });

  it("does not clamp negative, over-range, non-finite, or NaN raw values", () => {
    const resolved = resolveHoodiePouchOptions({
      pocketWidth: -2,
      pocketHeight: 99,
      pocketOpeningLength: Number.NaN,
      pocketOpeningAngle: 99,
      pocketHemClearance: Number.POSITIVE_INFINITY,
    });
    expect(resolved.pocketWidth).toBe(-2);
    expect(resolved.pocketHeight).toBe(99);
    expect(resolved.pocketOpeningLength).toBeNaN();
    expect(resolved.pocketOpeningAngle).toBe(99);
    expect(resolved.pocketHemClearance).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("complete internal Hoodie option contract", () => {
  it("composes accepted hood, pouch, and shared cuff/hem options without neckband controls", () => {
    expect(HOODIE_BAND_OPTION_DEFINITIONS.map(({ id }) => id)).toEqual([
      "cuffDepth",
      "hemBandDepth",
      "cuffLength",
      "hemBandLength",
    ]);
    expect(HOODIE_OPTION_DEFINITIONS.map(({ id }) => id)).toEqual([
      ...HOODIE_SHAPE_OPTION_DEFINITIONS.map(({ id }) => id),
      ...HOODIE_POUCH_OPTION_DEFINITIONS.map(({ id }) => id),
      "cuffDepth",
      "hemBandDepth",
      "cuffLength",
      "hemBandLength",
    ]);
    expect(HOODIE_OPTION_DEFINITIONS.map(({ id }) => id)).not.toContain("neckbandDepth");
    expect(HOODIE_OPTION_DEFINITIONS.map(({ id }) => id)).not.toContain("neckbandLength");
    expect(HOODIE_DEFAULT_OPTIONS).toEqual({
      ...HOODIE_SHAPE_DEFAULT_OPTIONS,
      ...HOODIE_POUCH_DEFAULT_OPTIONS,
      cuffDepth: 6,
      hemBandDepth: 6,
      cuffLength: 31.5,
      hemBandLength: 93.5,
    });
    expect(resolveHoodieOptions()).toEqual(HOODIE_DEFAULT_OPTIONS);
  });

  it("fills missing fields and preserves explicit zero and invalid raw values", () => {
    expect(resolveHoodieOptions({
      pocketWidth: 0,
      hoodCasingWidth: 0,
      cuffLength: 0,
    })).toEqual({
      ...HOODIE_DEFAULT_OPTIONS,
      pocketWidth: 0,
      hoodCasingWidth: 0,
      cuffLength: 0,
    });
    const invalid = resolveHoodieOptions({
      hoodHeight: Number.POSITIVE_INFINITY,
      pocketWidth: -3,
      cuffDepth: -1,
      hemBandLength: Number.NaN,
    });
    expect(invalid.hoodHeight).toBe(Number.POSITIVE_INFINITY);
    expect(invalid.pocketWidth).toBe(-3);
    expect(invalid.cuffDepth).toBe(-1);
    expect(invalid.hemBandLength).toBeNaN();
  });
});
