import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { TEE, FITTED, GARMENTS, garmentByName } from "./recipe";
import { dartOf } from "./dart";
import { rolePiece } from "./block";

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
      expect([rolePiece(b, "front").name, rolePiece(b, "back").name, rolePiece(b, "sleeve").name].every(Boolean)).toBe(true);
    }
  });

  it("each declares notches for every piece it drafts", () => {
    for (const g of GARMENTS) {
      const b = g.draft(STANDARD_M);
      for (const name of [rolePiece(b, "front").name, rolePiece(b, "back").name, rolePiece(b, "sleeve").name]) {
        expect(g.notches.find((n) => n.pieceName === name)).toBeDefined();
      }
    }
  });

  it("carries tech-pack scaffolding — a BOM and construction steps — for every garment", () => {
    for (const g of GARMENTS) {
      expect(g.techPack.bom.length).toBeGreaterThan(0);
      expect(g.techPack.construction.length).toBeGreaterThan(0);
      expect(g.techPack.bom.every((r) => r.material && r.placement && r.qty)).toBe(true);
    }
  });

  it("gives every garment a sewability-check function and a size metric", () => {
    // The tee is undarted (no dart-leg check); the fitted is darted (has one).
    expect(dartOf(rolePiece(TEE.draft(STANDARD_M), "front"))).toBeNull();
    const teeChecks = TEE.checks(TEE.draft(STANDARD_M), STANDARD_M).map((c) => c.name);
    expect(teeChecks).toContain("Side seam (front ↔ back)");
    expect(teeChecks).toContain("Hem square to the fold"); // trued hem
    expect(teeChecks).not.toContain("Dart legs equal");

    expect(dartOf(rolePiece(FITTED.draft(STANDARD_M), "front"))).not.toBeNull();
    const fittedChecks = FITTED.checks(FITTED.draft(STANDARD_M), STANDARD_M).map((c) => c.name);
    expect(fittedChecks).toContain("Dart legs equal");
    expect(fittedChecks).not.toContain("Hem square to the fold"); // untrued, opts out

    expect(typeof TEE.sizeMetric(TEE.draft(STANDARD_M))).toBe("number");
  });
});
