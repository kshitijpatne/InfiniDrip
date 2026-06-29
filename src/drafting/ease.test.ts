import { describe, it, expect } from "vitest";
import {
  STRETCH_FABRICS,
  suggestedEase,
  fabricEaseNote,
  StretchFabric,
} from "./ease";

const woven: StretchFabric = { name: "Test woven", family: "woven", stretchPercent: 0 };
const knit: StretchFabric = { name: "Test knit", family: "knit", stretchPercent: 50 };

describe("STRETCH_FABRICS", () => {
  it("includes at least one woven and one knit", () => {
    expect(STRETCH_FABRICS.some((f) => f.family === "woven")).toBe(true);
    expect(STRETCH_FABRICS.some((f) => f.family === "knit")).toBe(true);
  });
});

describe("suggestedEase", () => {
  it("suggests positive ease for a woven", () => {
    expect(suggestedEase(woven, 100)).toBeGreaterThan(0);
  });

  it("suggests negative ease for a knit", () => {
    expect(suggestedEase(knit, 100)).toBeLessThan(0);
  });

  it("scales knit negative ease with the chest", () => {
    expect(suggestedEase(knit, 120)).toBeLessThan(suggestedEase(knit, 80));
  });

  it("rounds to the nearest 0.5 cm", () => {
    const e = suggestedEase(knit, 100);
    expect(e * 2).toBe(Math.round(e * 2));
  });
});

describe("fabricEaseNote", () => {
  it("mentions positive ease for a woven", () => {
    const note = fabricEaseNote(woven, 100);
    expect(note).toContain("no stretch");
    expect(note).toContain("positive ease");
  });

  it("mentions negative ease and the stretch % for a knit", () => {
    const note = fabricEaseNote(knit, 100);
    expect(note).toContain("negative ease");
    expect(note).toContain("50%");
  });
});
