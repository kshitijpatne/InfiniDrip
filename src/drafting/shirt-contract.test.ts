import { describe, expect, it } from "vitest";
import {
  DEFAULT_WOVEN_SHIRT_OPTIONS,
  WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID,
  resolveWovenShirtOptions,
  WOVEN_SHIRT_FIELDS,
  WOVEN_SHIRT_OPTION_DEFINITIONS,
  WOVEN_SHIRT_PHYSICAL_ROLES,
} from "./shirt-contract";
import { garmentOptionsForStyle } from "./options";

describe("woven shirt construction contract", () => {
  it("keeps neck as a body input and construction choices as recipe options", () => {
    expect(WOVEN_SHIRT_FIELDS).toContain("neck");
    expect(WOVEN_SHIRT_FIELDS).toContain("chest");
    expect(WOVEN_SHIRT_FIELDS).not.toContain("strapWidth");
    expect(WOVEN_SHIRT_OPTION_DEFINITIONS.find((d) => d.id === "buttonCount")).toMatchObject({
      id: "buttonCount", label: "Front placket buttons", defaultValue: 7, min: 6, max: 7, step: 1,
    });
    expect(WOVEN_SHIRT_OPTION_DEFINITIONS.find((d) => d.id === "buttonCount")).toMatchObject({
      unit: "buttons", group: "Front closure",
    });
  });

  it("defaults all declared options and preserves finite live values", () => {
    expect(resolveWovenShirtOptions()).toMatchObject(DEFAULT_WOVEN_SHIRT_OPTIONS);
    expect(resolveWovenShirtOptions()).toMatchObject({ shoulderExtension: 0, shoulderDrop: 0 });
    const resolved = resolveWovenShirtOptions({ buttonCount: 6, buttonSpacing: 6.5, hemTurn: Number.NaN });
    expect(resolved.buttonCount).toBe(6);
    expect(resolved.buttonSpacing).toBe(6.5);
    expect(resolved.hemTurn).toBe(DEFAULT_WOVEN_SHIRT_OPTIONS.hemTurn);
  });

  it("keeps W03-only shoulder controls out of shared defaults and preserves authored values", () => {
    expect(DEFAULT_WOVEN_SHIRT_OPTIONS).not.toHaveProperty("shoulderExtension");
    expect(DEFAULT_WOVEN_SHIRT_OPTIONS).not.toHaveProperty("shoulderDrop");
    const extension = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "shoulderExtension")!;
    const drop = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "shoulderDrop")!;
    expect(extension).toMatchObject({ defaultValue: 4, min: 2, max: 8, step: 0.5, appliesToStyle: "Oversized loose-drop woven shirt", preserveInvalidWhenRestored: true });
    expect(drop).toMatchObject({ defaultValue: 3, min: 1, max: 4, step: 0.5, appliesToStyle: "Oversized loose-drop woven shirt", preserveInvalidWhenRestored: true });
    expect(resolveWovenShirtOptions({ shoulderExtension: 4, shoulderDrop: 3 })).toMatchObject({ shoulderExtension: 4, shoulderDrop: 3 });
    expect(resolveWovenShirtOptions({ shoulderExtension: 9, shoulderDrop: 4.5 })).toMatchObject({ shoulderExtension: 9, shoulderDrop: 4.5 });
  });

  it("scopes the W04 boxy profile to its style and preserves invalid authored percentages", () => {
    const profile = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "boxySideProfile")!;
    expect(DEFAULT_WOVEN_SHIRT_OPTIONS).not.toHaveProperty("boxySideProfile");
    expect(profile).toMatchObject({
      unit: "%",
      defaultValue: 100,
      min: 0,
      max: 100,
      step: 10,
      appliesToStyle: "Cropped boxy woven shirt",
      preserveInvalidWhenRestored: true,
    });
    const w04Options = garmentOptionsForStyle(
      WOVEN_SHIRT_OPTION_DEFINITIONS,
      { boxySideProfile: 55 },
      "Cropped boxy woven shirt",
    );
    expect(w04Options.boxySideProfile).toBe(55);
    const w03Options = garmentOptionsForStyle(
      WOVEN_SHIRT_OPTION_DEFINITIONS,
      { boxySideProfile: 55, shoulderExtension: 5 },
      "Oversized loose-drop woven shirt",
    );
    expect(w03Options).not.toHaveProperty("boxySideProfile");
    expect(w03Options.shoulderExtension).toBe(5);
  });

  it("keeps W06 collar depth entry-scoped and preserves finite authored values", () => {
    const depth = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "campCollarDepth")!;
    expect(depth).toMatchObject({
      defaultValue: 6,
      min: 4,
      max: 8,
      step: 0.5,
      appliesToStarterEntryId: WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID,
      preserveInvalidWhenRestored: true,
    });
    expect(DEFAULT_WOVEN_SHIRT_OPTIONS).not.toHaveProperty("campCollarDepth");
    expect(resolveWovenShirtOptions()).not.toHaveProperty("campCollarDepth");
    expect(resolveWovenShirtOptions({ campCollarDepth: 7.5 }).campCollarDepth).toBe(7.5);
    expect(resolveWovenShirtOptions({ campCollarDepth: 9 }).campCollarDepth).toBe(9);
  });

  it("records explicit physical quantities for the sixteen-piece cut", () => {
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.reduce((sum, role) => sum + role.quantity, 0)).toBe(16);
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.find((role) => role.id === "yoke")).toMatchObject({ quantity: 2, onFold: true });
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.find((role) => role.id === "buttonholePlacket")).toMatchObject({ quantity: 1, onFold: false });
  });
});
