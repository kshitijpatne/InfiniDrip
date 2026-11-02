import { describe, expect, it } from "vitest";
import {
  DEFAULT_WOVEN_SHIRT_OPTIONS,
  resolveWovenShirtOptions,
  WOVEN_SHIRT_FIELDS,
  WOVEN_SHIRT_OPTION_DEFINITIONS,
  WOVEN_SHIRT_PHYSICAL_ROLES,
} from "./shirt-contract";

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

  it("records explicit physical quantities for the sixteen-piece cut", () => {
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.reduce((sum, role) => sum + role.quantity, 0)).toBe(16);
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.find((role) => role.id === "yoke")).toMatchObject({ quantity: 2, onFold: true });
    expect(WOVEN_SHIRT_PHYSICAL_ROLES.find((role) => role.id === "buttonholePlacket")).toMatchObject({ quantity: 1, onFold: false });
  });
});
