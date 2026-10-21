import { describe, expect, it } from "vitest";
import { TROUSER_FIELDS } from "./trouser-contract";
import {
  DEFAULT_JEANS_OPTIONS,
  JEANS_FIELDS,
  JEANS_OPTION_DEFINITIONS,
  resolveJeansOptions,
  type JeansOptions,
} from "./jeans-contract";

const expectedDefinitions = [
  ["frontRiseEase", 1, -2, 8],
  ["backRiseEase", 9, 2, 14],
  ["waistbandDepth", 4, 2, 8],
  ["thighEase", 8, 0, 20],
  ["kneeEase", 5, 0, 15],
  ["legOpening", 40, 25, 65],
  ["flyLength", 15, 8, 25],
  ["yokeDepth", 9, 5, 15],
  ["yokeEase", 0.5, 0, 1.5],
  ["frontPocketOpening", 15, 10, 22],
  ["frontPocketDrop", 4, 2, 12],
  ["frontPocketCurveDepth", 3, 1, 6],
  ["frontPocketBagDepth", 24, 16, 35],
  ["coinPocketWidth", 8, 5, 10],
  ["coinPocketHeight", 7, 5, 10],
  ["backPocketWidth", 14, 10, 20],
  ["backPocketHeight", 15, 10, 22],
  ["backPocketDrop", 7, 2, 15],
  ["backPocketOffset", 4, 2, 15],
  ["waistbandExtension", 1.5, 1, 3],
] as const;

describe("Jeans option contract", () => {
  it("reuses the exact Trouser lower-body fields", () => {
    expect(JEANS_FIELDS).toBe(TROUSER_FIELDS);
    expect(JEANS_FIELDS).toEqual([
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
    ]);
  });

  it("declares all unique packet options with their product seeds and bounds", () => {
    const actual = JEANS_OPTION_DEFINITIONS.map(({ id, defaultValue, min, max, step }) =>
      [id, defaultValue, min, max, step]);
    expect(actual).toEqual(expectedDefinitions.map(([id, value, min, max]) =>
      [id, value, min, max, 0.5]));
    expect(new Set(JEANS_OPTION_DEFINITIONS.map(({ id }) => id)).size).toBe(expectedDefinitions.length);
    expect(JEANS_OPTION_DEFINITIONS.every(({ label, unit, group, help }) =>
      label.length > 0 && unit === "cm" && typeof group === "string" && group.length > 0 &&
      typeof help === "string" && help.length > 0)).toBe(true);
  });

  it("describes the chosen coin host and lower-yoke back-pocket drop", () => {
    const help = Object.fromEntries(JEANS_OPTION_DEFINITIONS.map(({ id, help: text }) => [id, text]));
    expect(help.coinPocketWidth).toContain("wearer-right pocket-facing extension");
    expect(help.coinPocketHeight).toContain("provisional 1 cm margin");
    expect(help.backPocketDrop).toContain("live lower-yoke seam");
    expect(help.backPocketDrop).not.toContain("back waist");
    expect(help.backPocketWidth).toContain("reduce the width");
    expect(help.backPocketHeight).toContain("backPocketDrop");
    expect(help.backPocketOffset).toContain("narrowest live side-seam station");
    expect(help.backPocketOffset).toContain("provisional 1 cm envelope");
  });

  it("derives defaults from the definitions and fills missing or undefined values", () => {
    const expectedDefaults = Object.fromEntries(
      JEANS_OPTION_DEFINITIONS.map(({ id, defaultValue }) => [id, defaultValue]),
    );
    const allUndefined = Object.fromEntries(
      JEANS_OPTION_DEFINITIONS.map(({ id }) => [id, undefined]),
    ) as Partial<JeansOptions>;
    expect(DEFAULT_JEANS_OPTIONS).toEqual(expectedDefaults);
    expect(resolveJeansOptions()).toEqual(expectedDefaults);
    expect(resolveJeansOptions(allUndefined)).toEqual(expectedDefaults);
  });

  it("preserves every explicit valid value, including meaningful zeros", () => {
    const values = Object.fromEntries(JEANS_OPTION_DEFINITIONS.map(({ id, defaultValue }) =>
      [id, defaultValue])) as unknown as JeansOptions;
    const explicit = {
      ...values,
      frontRiseEase: 0,
      thighEase: 0,
      yokeEase: 0,
      frontPocketDrop: 2.5,
      waistbandExtension: 2.5,
    };
    expect(resolveJeansOptions(explicit)).toEqual(explicit);
  });

  it("preserves finite out-of-range and non-finite raw numeric values", () => {
    const actual = resolveJeansOptions({
      frontRiseEase: 100,
      yokeEase: -0.5,
      frontPocketDrop: Number.NaN,
      coinPocketWidth: Number.POSITIVE_INFINITY,
      backPocketOffset: Number.NEGATIVE_INFINITY,
    });
    expect(actual.frontRiseEase).toBe(100);
    expect(actual.yokeEase).toBe(-0.5);
    expect(actual.frontPocketDrop).toBe(Number.NaN);
    expect(actual.coinPocketWidth).toBe(Number.POSITIVE_INFINITY);
    expect(actual.backPocketOffset).toBe(Number.NEGATIVE_INFINITY);
    expect(actual.backPocketHeight).toBe(DEFAULT_JEANS_OPTIONS.backPocketHeight);
  });
});
