import { describe, expect, it } from "vitest";
import {
  defaultGarmentOptions,
  garmentOptionsForStyle,
  optionalOptionActionLabel,
  optionalOptionStatusMessage,
  restoreGarmentOptions,
  GarmentOption,
} from "./options";

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

  it("keeps saved style-specific options dormant and optional values absent outside their style", () => {
    const definitions: readonly GarmentOption[] = [
      { id: "shared", label: "Shared", defaultValue: 2, min: 1, max: 3, step: 1 },
      { id: "classic", label: "Classic only", defaultValue: 10, min: 7, max: 12, step: 0.5,
        optional: true, appliesToStyle: "Classic tee" },
    ];
    expect(garmentOptionsForStyle(definitions, { shared: 3, classic: 8 }, "Fitted tee"))
      .toEqual({ shared: 3 });
    expect(garmentOptionsForStyle(definitions, { shared: 3, classic: 8 }, "Classic tee"))
      .toEqual({ shared: 3, classic: 8 });
    expect(garmentOptionsForStyle(definitions, { shared: 3, classic: 14 }, "Classic tee").classic).toBe(14);
    expect(garmentOptionsForStyle(definitions, {}, "Classic tee", false)).toEqual({});
  });

  it("keeps starter-entry construction options dormant outside their selected catalog entry", () => {
    const definitions: readonly GarmentOption[] = [
      ...DEFINITIONS,
      { id: "waistDartIntake", label: "Waist dart intake", defaultValue: 2, min: 0.5, max: 6, step: 0.5,
        appliesToStarterEntryId: "fitted-waist-dart-tee-digital-v1" },
    ];
    const saved = { standHeight: 2.5, leafDepth: 6, waistDartIntake: 3 };

    expect(garmentOptionsForStyle(definitions, saved, "Fitted tee"))
      .toEqual({ standHeight: 2.5, leafDepth: 6 });
    expect(garmentOptionsForStyle(definitions, saved, "Fitted tee", true, "fitted-tee-digital-v1"))
      .toEqual({ standHeight: 2.5, leafDepth: 6 });
    expect(garmentOptionsForStyle(definitions, saved, "Fitted tee", true, "fitted-waist-dart-tee-digital-v1"))
      .toEqual({ standHeight: 2.5, leafDepth: 6, waistDartIntake: 3 });
    expect(garmentOptionsForStyle(definitions, {}, "Fitted tee", true, "fitted-waist-dart-tee-digital-v1"))
      .toEqual({ standHeight: 2, leafDepth: 5, waistDartIntake: 2 });
    expect(defaultGarmentOptions(definitions)).toEqual({ standHeight: 2, leafDepth: 5 });
    expect(defaultGarmentOptions(definitions, "fitted-waist-dart-tee-digital-v1"))
      .toEqual({ standHeight: 2, leafDepth: 5, waistDartIntake: 2 });
  });

  it("renders optional control status and actions for inherited and independent values", () => {
    const inherited: GarmentOption = {
      id: "chestEase", label: "Chest allowance", defaultValue: 10, min: 7, max: 12, step: 0.5,
      optional: true, fallbackMeasurement: "ease",
    };
    const vNeck: GarmentOption = {
      id: "teeVNeckDropCm", label: "Front V-neck drop", defaultValue: 5, min: 0, max: 15, step: 0.5,
      optional: true, optionalSetLabel: "Use V neckline", optionalResetLabel: "Use crew neckline",
      optionalSetStatus: "V neckline active. Additional front drop: {value} {unit}.",
      optionalUnsetStatus: "Crew neckline active. Set a value to switch to the V neckline.",
    };

    expect(optionalOptionStatusMessage(inherited, false, 10))
      .toBe("Inherited from shared fit allowance: 10 cm.");
    expect(optionalOptionStatusMessage(inherited, true, 8))
      .toBe("Independent value: 8 cm.");
    expect(optionalOptionStatusMessage(inherited, true, "enter a number"))
      .toBe("Independent value: enter a number cm.");
    expect(optionalOptionStatusMessage(vNeck, false, 5))
      .toBe("Crew neckline active. Set a value to switch to the V neckline.");
    expect(optionalOptionStatusMessage(vNeck, true, 7.5))
      .toBe("V neckline active. Additional front drop: 7.5 cm.");
    expect(optionalOptionActionLabel(vNeck, false)).toBe("Use V neckline");
    expect(optionalOptionActionLabel(vNeck, true)).toBe("Use crew neckline");
    expect(optionalOptionActionLabel(inherited, false)).toBe("Set independent value");
    expect(optionalOptionActionLabel(inherited, true)).toBe("Use shared fit allowance");
    expect(optionalOptionStatusMessage({ ...vNeck, optionalSetStatus: undefined, optionalUnsetStatus: undefined }, true, 6))
      .toBe("Independent value: 6 cm.");
    expect(optionalOptionStatusMessage({ ...vNeck, optionalSetStatus: undefined, optionalUnsetStatus: undefined }, false, 5))
      .toBe("Front V-neck drop is inactive. Set a value to enable it.");
  });
});
