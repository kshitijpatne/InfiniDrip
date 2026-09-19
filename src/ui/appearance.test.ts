import { describe, expect, it } from "vitest";
import {
  APPEARANCE_TEXTURES,
  DEFAULT_APPEARANCE,
  applyAppearanceToSvg,
  hexToHsl,
  hslToHex,
  normalizeHex,
  parseAppearance,
} from "./appearance";

describe("appearance color math", () => {
  it("normalizes only six-digit hexadecimal colors", () => {
    expect(normalizeHex("#3a4150")).toBe("#3A4150");
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("navy")).toBeNull();
  });

  it("round-trips primary and achromatic colors through HSL", () => {
    expect(hexToHsl("#FFFFFF")).toEqual({ h: 0, s: 0, l: 1 });
    expect(hexToHsl("#FF0000")).toEqual({ h: 0, s: 1, l: 0.5 });
    expect(hexToHsl("#00FF00")!.h).toBe(120);
    expect(hexToHsl("#0000FF")!.h).toBe(240);
    expect(hexToHsl("#FF00FF")!.h).toBe(300);
    expect(hexToHsl("#12345")).toBeNull();
    expect(hslToHex(0, 0, 1)).toBe("#FFFFFF");
    expect(hslToHex(0, 1, 0.5)).toBe("#FF0000");
    expect(hslToHex(120, 1, 0.5)).toBe("#00FF00");
    expect(hslToHex(240, 1, 0.5)).toBe("#0000FF");
    expect(hslToHex(-120, 0.4, 0.3)).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("appearance persistence and preview decoration", () => {
  const svg = `<svg viewBox="0 0 10 10"><rect fill="#13233A"/><path d="M0 0H4V4Z" fill="#3A4150" stroke="#fff"/></svg>`;

  it("defaults missing appearance for legacy saves and rejects invalid current values", () => {
    expect(parseAppearance(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance({ texture: "woven", shine: 35 })).toEqual({ texture: "woven", shine: 35 });
    expect(parseAppearance(null)).toBeNull();
    expect(parseAppearance({ texture: "missing", shine: 35 })).toBeNull();
    expect(parseAppearance({ texture: "woven", shine: 101 })).toBeNull();
    expect(parseAppearance({ texture: "woven", shine: Number.NaN })).toBeNull();
  });

  it("leaves the legacy assembled SVG byte-identical for the default cue", () => {
    expect(applyAppearanceToSvg(svg, "#3A4150", DEFAULT_APPEARANCE)).toBe(svg);
    expect(applyAppearanceToSvg(svg, "invalid", { texture: "woven", shine: 10 })).toBe(svg);
  });

  it("adds texture and sheen only to fabric surfaces", () => {
    for (const texture of APPEARANCE_TEXTURES.filter((option) => option.id !== "smooth")) {
      const decorated = applyAppearanceToSvg(svg, "#3A4150", { texture: texture.id, shine: 0 });
      expect(decorated).toContain("appearance-texture");
      expect(decorated).toContain("url(#appearance-texture)");
      expect(decorated).not.toContain('rect fill="url(#appearance-texture)"');
    }
    const shiny = applyAppearanceToSvg(svg, "#3A4150", { texture: "smooth", shine: 60 });
    expect(shiny).toContain("appearance-sheen");
    expect(shiny).toContain('opacity="0.240"');
    expect(shiny).toContain('rect fill="#13233A"');
  });
});
