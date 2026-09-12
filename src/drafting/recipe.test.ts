import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { TEE, FITTED, TANK, POLO, WOVEN_SHIRT, TROUSER, GARMENTS, garmentByName } from "./recipe";
import { dartOf } from "./dart";
import { rolePiece, blockPieces } from "./block";
import { pieceEdge } from "./piece";
import { derive } from "./measurements";
import { necklineEdge } from "./neckline";
import { garmentReport } from "../guidance/garment-check";

describe("the garment registry", () => {
  it("lists every garment with a stable id and a display label", () => {
    expect(GARMENTS.map((g) => g.name)).toEqual(["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]);
    expect(GARMENTS.map((g) => g.label)).toEqual(["Tee", "Darted tee", "Tank", "Polo", "Woven shirt", "Skirt", "Trouser"]);
  });

  it("looks a recipe up by name and falls back to the tee for an unknown one", () => {
    expect(garmentByName("fitted")).toBe(FITTED);
    expect(garmentByName("tee")).toBe(TEE);
    expect(garmentByName("polo")).toBe(POLO);
    expect(garmentByName("woven-shirt")).toBe(WOVEN_SHIRT);
    expect(garmentByName("trouser")).toBe(TROUSER);
    expect(garmentByName("kimono")).toBe(TEE);
  });
});

describe("Polo recipe pipeline", () => {
  it("is a loose polo with V1 controls, full POMs, and complete production data", () => {
    expect(POLO.styles.map((style) => style.name)).toEqual(["Classic polo", "Relaxed polo", "Longline polo"]);
    expect(POLO.options?.map((option) => option.id)).toEqual([
      "placketLength", "placketWidth", "standHeight", "collarLeafDepth",
    ]);
    expect(POLO.poms.map((pom) => pom.label)).toEqual(expect.arrayContaining([
      "Finished placket length", "Finished placket width", "Button spacing",
      "Finished collar stand height", "Finished pointed collar leaf",
    ]));
    expect(POLO.techPack.bom.find((row) => row.material === "Buttons")?.qty).toBe("3");
    expect(POLO.techPack.construction.join(" ")).toContain("knit-compatible stabilizer");
  });

  it("passes generic production checks across its real, nine-piece block", () => {
    const report = garmentReport(POLO, STANDARD_M);
    expect(report.ok).toBe(true);
    expect(blockPieces(POLO.draft(STANDARD_M))).toHaveLength(9);
    expect(report.checks.map((check) => check.name)).toContain("Notches + grainline on every piece");
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

describe("Woven shirt recipe integration", () => {
  it("declares the full woven measurement and design-control contract", () => {
    expect(WOVEN_SHIRT.fields).toEqual([
      "neck", "chest", "shoulderWidth", "bicep", "length", "armholeDepth",
      "sleeveLength", "waist", "hip", "hipDepth", "ease",
    ]);
    expect(WOVEN_SHIRT.options?.map((option) => option.id)).toEqual([
      "neckEase", "buttonCount", "buttonSpacing", "frontOverlap", "placketWidth",
      "standHeight", "collarLeafDepth", "yokeDepth", "pocketWidth", "pocketHeight",
      "sleeveBandDepth", "sideVentDepth", "hemTurn",
    ]);
  });

  it("keeps the selected button count in the tech pack", () => {
    const six = WOVEN_SHIRT.techPackForOptions!({ buttonCount: 6 });
    const seven = WOVEN_SHIRT.techPackForOptions!({ buttonCount: 7 });
    const defaults = WOVEN_SHIRT.techPackForOptions!({});
    expect(six.bom.find((row) => row.material === "Buttons")?.qty).toBe("6 front + 1 stand");
    expect(seven.bom.find((row) => row.material === "Buttons")?.qty).toBe("7 front + 1 stand");
    expect(defaults.bom.find((row) => row.material === "Buttons")?.qty).toBe("7 front + 1 stand");
  });

  it("evaluates every woven-shirt POM from the assembled block", () => {
    const block = WOVEN_SHIRT.draft(STANDARD_M);
    for (const pom of WOVEN_SHIRT.poms) expect(pom.measure(block)).toBeTypeOf("number");
  });
});

describe("Trouser recipe integration (Slice 100)", () => {
  it("registers the complete lower-body contract as one recipe", () => {
    expect(TROUSER.region).toBe("lower");
    expect(TROUSER.editRole).toBe("frontLeft");
    expect(TROUSER.fields).toEqual([
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
    ]);
    expect(TROUSER.options?.map((option) => option.id)).toHaveLength(11);
    expect(TROUSER.styles.map((style) => style.name)).toContain("Relaxed straight trouser");
  });

  it("runs the live eight-role block through the generic production report", () => {
    const block = TROUSER.draft(STANDARD_M);
    expect(Object.keys(block.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight",
      "waistband", "flyShield", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(garmentReport(TROUSER, STANDARD_M).ok).toBe(true);
    expect(TROUSER.sizeMetric(block)).toBeGreaterThan(0);
    for (const pom of TROUSER.poms) expect(pom.measure(block)).toBeTypeOf("number");
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
        const declared = (position === "front" ? recipe.frontNeckline : recipe.backNeckline)?.(STANDARD_M);
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
