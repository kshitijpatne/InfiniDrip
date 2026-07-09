import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { TEE, FITTED, GARMENTS, garmentByName } from "./recipe";
import { dartOf } from "./dart";

describe("the garment registry", () => {
  it("lists every garment with a stable id and a display label", () => {
    expect(GARMENTS.map((g) => g.name)).toEqual(["tee", "fitted"]);
    expect(GARMENTS.map((g) => g.label)).toEqual(["Tee", "Fitted"]);
  });

  it("looks a recipe up by name and falls back to the tee for an unknown one", () => {
    expect(garmentByName("fitted")).toBe(FITTED);
    expect(garmentByName("tee")).toBe(TEE);
    expect(garmentByName("kimono")).toBe(TEE);
  });
});

describe("recipes are self-describing", () => {
  it("each drafts a complete three-piece block", () => {
    for (const g of GARMENTS) {
      const b = g.draft(STANDARD_M);
      expect([b.front.name, b.back.name, b.sleeve.name].every(Boolean)).toBe(true);
    }
  });

  it("each declares notches for every piece it drafts", () => {
    for (const g of GARMENTS) {
      const b = g.draft(STANDARD_M);
      for (const name of [b.front.name, b.back.name, b.sleeve.name]) {
        expect(g.notches.find((n) => n.pieceName === name)).toBeDefined();
      }
    }
  });

  it("declares the tee undarted with a trued hem, and the fitted darted and untrued", () => {
    expect(dartOf(TEE.draft(STANDARD_M).front)).toBeNull();
    expect(TEE.checks).toEqual({ frontSideEdges: ["side"], hemSquareToFold: true });

    expect(dartOf(FITTED.draft(STANDARD_M).front)).not.toBeNull();
    expect(FITTED.checks).toEqual({
      frontSideEdges: ["sideUpper", "sideLower"],
      hemSquareToFold: false,
    });
  });
});
