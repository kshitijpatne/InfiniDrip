import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { TEE, FITTED, TANK, GARMENTS, garmentByName } from "./recipe";
import { dartOf } from "./dart";
import { rolePiece, blockPieces } from "./block";
import { pieceEdge } from "./piece";
import { derive } from "./measurements";
import { necklineEdge } from "./neckline";
import { garmentReport } from "../guidance/garment-check";

describe("the garment registry", () => {
  it("lists every garment with a stable id and a display label", () => {
    expect(GARMENTS.map((g) => g.name)).toEqual(["tee", "fitted", "tank", "skirt"]);
    expect(GARMENTS.map((g) => g.label)).toEqual(["Tee", "Fitted", "Tank", "Skirt"]);
  });

  it("looks a recipe up by name and falls back to the tee for an unknown one", () => {
    expect(garmentByName("fitted")).toBe(FITTED);
    expect(garmentByName("tee")).toBe(TEE);
    expect(garmentByName("kimono")).toBe(TEE);
  });
});

describe("recipes are self-describing", () => {
  it("each drafts a block of named pieces (two or more)", () => {
    for (const g of GARMENTS) {
      const pieces = blockPieces(g.draft(STANDARD_M));
      expect(pieces.length).toBeGreaterThanOrEqual(2);
      expect(pieces.every((p) => p.name.length > 0)).toBe(true);
    }
  });

  it("each declares notches for every piece it drafts", () => {
    for (const g of GARMENTS) {
      for (const p of blockPieces(g.draft(STANDARD_M))) {
        expect(g.notches.find((n) => n.pieceName === p.name)).toBeDefined();
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
    // Phase A2: the seam/cap facts now come from stitches (declared on the
    // block) plus recipe.checks for whatever isn't a stitch (a hem square to
    // the fold). garmentReport is where production combines the two — read
    // from there, not from recipe.checks alone, which only has the panel half.
    expect(dartOf(rolePiece(TEE.draft(STANDARD_M), "front"))).toBeNull();
    const teeChecks = garmentReport(TEE, STANDARD_M).checks.map((c) => c.name);
    expect(teeChecks).toContain("Side seam (front ↔ back)");
    expect(teeChecks).toContain("Hem square to the fold"); // trued hem
    expect(teeChecks).not.toContain("Dart legs equal");

    expect(dartOf(rolePiece(FITTED.draft(STANDARD_M), "front"))).not.toBeNull();
    const fittedChecks = garmentReport(FITTED, STANDARD_M).checks.map((c) => c.name);
    expect(fittedChecks).toContain("Dart legs equal");
    expect(fittedChecks).not.toContain("Hem square to the fold"); // untrued, opts out

    expect(typeof TEE.sizeMetric(TEE.draft(STANDARD_M))).toBe("number");
  });
});

describe("recipe fields (per-garment measurement set)", () => {
  it("the tee and fitted declare the upper-body set, without waist/hip", () => {
    for (const g of [TEE, FITTED]) {
      expect(g.fields).toContain("chest");
      expect(g.fields).toContain("ease");
      expect(g.fields).not.toContain("waist");
      expect(g.fields).not.toContain("hip");
    }
  });

  it("every declared field exists on Measurements (STANDARD_M has it)", () => {
    for (const id of TEE.fields) {
      expect(STANDARD_M[id]).toBeTypeOf("number");
    }
  });
});

describe("recipe.frontNeckline/backNeckline actually match what draft() produces (Slice 61)", () => {
  // The whole point of declaring these on the recipe is so the body/garment
  // preview views can draw the REAL neckline. A declared shape that quietly
  // drifted from what bodice()/draftTank() actually draft would be exactly
  // the "reads correct, isn't" failure mode Slice 60 shipped — so this checks
  // the declared params reproduce the real drafted edge, not just that both
  // exist.
  const cases: readonly { recipe: typeof TEE; label: string }[] = [
    { recipe: TEE, label: "tee" },
    { recipe: FITTED, label: "fitted" },
    { recipe: TANK, label: "tank" },
  ];

  for (const { recipe, label } of cases) {
    it(`${label}: front/back declared neckline reproduces the real drafted edge`, () => {
      const d = derive(STANDARD_M);
      const block = recipe.draft(STANDARD_M);
      for (const position of ["front", "back"] as const) {
        const drafted = pieceEdge(rolePiece(block, position), "neckline");
        const baseDepth = position === "front" ? d.frontNeckDepth : d.backNeckDepth;
        const declared = position === "front" ? recipe.frontNeckline : recipe.backNeckline;
        const { edge: expected } = necklineEdge(
          position, d.neckWidthHalf, baseDepth, d.shoulderHalf, STANDARD_M.armholeDepth, declared);
        expect(drafted.kind).toBe(expected.kind);
        if (drafted.kind === "curve" && expected.kind === "curve") {
          expect(drafted.curve).toEqual(expected.curve);
        } else if (drafted.kind === "line" && expected.kind === "line") {
          expect(drafted.start).toEqual(expected.start);
          expect(drafted.end).toEqual(expected.end);
        }
      }
    });
  }
});
