import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import {
  STANDARD_M, TEE, GarmentRecipe, block, TSHIRT_GRADE, TSHIRT_SIZES,
} from "../drafting";
import { guide, SEVERITY_ICON, Level } from "./guidance";

const BAD_M = { ...STANDARD_M, ease: 2, armholeDepth: 10 };

describe("guide (recipe-driven)", () => {
  it("gives the standard tee a clean bill (cap matches, ease comfortable)", () => {
    const notes = guide(TEE, STANDARD_M);
    expect(notes).toHaveLength(2); // OK cap-match note + OK ease note
    expect(notes.every((n) => n.level === "ok")).toBe(true);
  });

  it("collects multiple notes when several things are off", () => {
    const notes = guide(TEE, BAD_M);
    expect(notes.map((n) => n.level)).toContain("warn");
    expect(notes.length).toBeGreaterThan(1);
  });

  it("warns on an implausible chest that used to draft silently", () => {
    const notes = guide(TEE, { ...STANDARD_M, chest: 160 });
    expect(notes.some((n) => n.level === "warn" && n.text.includes("Chest (160 cm)"))).toBe(true);
  });

  it("surfaces a coherence warning for a proportionally impossible set", () => {
    const notes = guide(TEE, { ...STANDARD_M, chest: 130, shoulderWidth: 40 });
    expect(notes.some((n) => n.text.includes("proportion"))).toBe(true);
  });

  it("is garment-agnostic: runs a sleeveless recipe without throwing, adding its own guidance plus the sanity tiers", () => {
    const SLEEVELESS: GarmentRecipe = {
      name: "stub",
      label: "Stub",
      fields: [],
      styles: [],
      draft: (m) =>
        block({
          panel: {
            name: "panel",
            onFold: true,
            edges: [{ kind: "line", name: "hem", start: point(0, m.length), end: point(m.chest / 4, m.length) }],
          },
        }),
      checks: () => [],
      guidance: () => [{ level: "ok", text: "panel looks fine" }], // no sleeve reference
      sizeMetric: () => 1,
      notches: [],
      poms: [],
      grade: TSHIRT_GRADE,
      sizes: TSHIRT_SIZES,
      techPack: { bom: [], construction: [] },
      allowances: { default: 1, byEdge: {} },
    };
    expect(() => guide(SLEEVELESS, STANDARD_M)).not.toThrow();
    const notes = guide(SLEEVELESS, STANDARD_M);
    expect(notes.some((n) => n.text === "panel looks fine")).toBe(true); // recipe-owned guidance
    expect(notes.every((n) => n.level === "ok")).toBe(true); // STANDARD_M is sane
  });
});

describe("SEVERITY_ICON", () => {
  it("gives a distinct glyph for every level (severity is not colour-only)", () => {
    const icons = (["ok", "info", "warn"] as Level[]).map((l) => SEVERITY_ICON[l]);
    expect(new Set(icons).size).toBe(3); // all distinct
    expect(SEVERITY_ICON.warn).toBe("⚠");
    expect(SEVERITY_ICON.ok).toBe("✓");
  });
});
