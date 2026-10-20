import { describe, expect, it } from "vitest";
import {
  HOODIE_POUCH_DEFAULT_OPTIONS,
  HOODIE_POUCH_OPTION_DEFINITIONS,
  resolveHoodiePouchOptions,
} from "./hoodie-contract";

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