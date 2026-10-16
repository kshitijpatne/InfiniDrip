import { describe, expect, it } from "vitest";
import { defaultGarmentOptions, restoreGarmentOptions, GarmentOption } from "./options";

const DEFINITIONS: readonly GarmentOption[] = [
  { id: "standHeight", label: "Stand height", defaultValue: 2, min: 1, max: 3, step: 0.5 },
  { id: "leafDepth", label: "Collar leaf", defaultValue: 5, min: 4, max: 7, step: 0.5 },
  { id: "optionalEase", label: "Optional ease", defaultValue: 10, min: 7, max: 12, step: 0.5, optional: true },
];

describe("garment options", () => {
  it("derives recipe defaults", () => {
    expect(defaultGarmentOptions(DEFINITIONS)).toEqual({ standHeight: 2, leafDepth: 5 });
  });

  it("restores only finite, in-range persisted values", () => {
    expect(restoreGarmentOptions(DEFINITIONS, { standHeight: 2.5, leafDepth: 99 })).toEqual({
      standHeight: 2.5, leafDepth: 5,
    });
  });

  it("uses defaults for malformed or missing saved options", () => {
    expect(restoreGarmentOptions(DEFINITIONS, null)).toEqual({ standHeight: 2, leafDepth: 5 });
    expect(restoreGarmentOptions(DEFINITIONS, { standHeight: Number.NaN })).toEqual({ standHeight: 2, leafDepth: 5 });
  });

  it("keeps optional controls absent until explicitly selected and preserves invalid choices for guidance", () => {
    expect(restoreGarmentOptions(DEFINITIONS, { standHeight: 2, leafDepth: 5 }))
      .toEqual({ standHeight: 2, leafDepth: 5 });
    expect(restoreGarmentOptions(DEFINITIONS, { standHeight: 2, leafDepth: 5, optionalEase: 8 }))
      .toEqual({ standHeight: 2, leafDepth: 5, optionalEase: 8 });
    expect(restoreGarmentOptions(DEFINITIONS, { optionalEase: 14 }).optionalEase).toBe(14);
    expect(Number.isNaN(restoreGarmentOptions(DEFINITIONS, { optionalEase: "invalid" }).optionalEase)).toBe(true);
  });
});
