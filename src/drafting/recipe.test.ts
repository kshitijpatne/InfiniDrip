import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { defaultGarmentOptions } from "./options";
import { TEE, FITTED, TANK, POLO, WOVEN_SHIRT, SKIRT, TROUSER, JEANS, SHORTS, CREWNECK, JOGGER, HOODIE, GARMENTS, garmentByName } from "./recipe";
import { dartOf } from "./dart";
import { rolePiece, blockPieces } from "./block";
import { pieceEdge } from "./piece";
import { edgeLength } from "./piece";
import { derive } from "./measurements";
import { necklineEdge } from "./neckline";
import { garmentReport } from "../guidance/garment-check";
import { wovenShirtAllowances } from "./shirt";
import {
  CREWNECK_DEFAULT_OPTIONS,
  CREWNECK_FIELDS,
  CREWNECK_OPTION_DEFINITIONS,
  CREWNECK_STABLE_KNIT_DEFAULT,
  CREWNECK_STYLES,
} from "./crewneck-contract";
import {
  CREWNECK_ALLOWANCES,
  CREWNECK_GRADE,
  CREWNECK_NOTCHES,
  CREWNECK_POMS,
  CREWNECK_SIZES,
  CREWNECK_TECH_PACK,
} from "./crewneck-tables";
import { CREWNECK_ROLE_ORDER } from "./crewneck";
import { crewneckBandMeasurements } from "./crewneck-components";
import { gradeRecipeRun } from "./recipe";
import { STRETCH_FABRICS } from "./ease";
import { CREWNECK as BARREL_CREWNECK, CREWNECK_STABLE_KNIT_DEFAULT as BARREL_STABLE_KNIT } from "./index";
import { JOGGER as BARREL_JOGGER } from "./index";
import { JOGGER_DEFAULT_OPTIONS, JOGGER_FIELDS, JOGGER_OPTION_DEFINITIONS, JOGGER_STYLES } from "./jogger-contract";
import { HOODIE_DEFAULT_OPTIONS, HOODIE_FIELDS, HOODIE_OPTION_DEFINITIONS, HOODIE_STYLES } from "./hoodie-contract";
import { HOODIE_ROLE_ORDER } from "./hoodie";

describe("the garment registry", () => {
  it("lists every garment with a stable id and a display label", () => {
    expect(GARMENTS.map((g) => g.name)).toEqual(["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser", "jeans", "shorts", "crewneck", "jogger", "hoodie"]);
    expect(GARMENTS.map((g) => g.label)).toEqual(["Tee", "Darted tee", "Tank", "Polo", "Woven shirt", "Skirt", "Trouser", "Jeans", "Shorts", "Crewneck sweatshirt", "Jogger", "Pullover hoodie"]);
  });

  it("looks a recipe up by name and falls back to the tee for an unknown one", () => {
    expect(garmentByName("fitted")).toBe(FITTED);
    expect(garmentByName("tee")).toBe(TEE);
    expect(garmentByName("polo")).toBe(POLO);
    expect(garmentByName("woven-shirt")).toBe(WOVEN_SHIRT);
    expect(garmentByName("trouser")).toBe(TROUSER);
    expect(garmentByName("jeans")).toBe(JEANS);
    expect(garmentByName("shorts")).toBe(SHORTS);
    expect(garmentByName("crewneck")).toBe(CREWNECK);
    expect(garmentByName("jogger")).toBe(JOGGER);
    expect(garmentByName("hoodie")).toBe(HOODIE);
    expect(garmentByName("kimono")).toBe(TEE);
  });

  it("registers the admitted Jeans draft with its own style, options, POMs, and XS–XL contract", () => {
    expect(JEANS.name).toBe("jeans");
    expect(JEANS.region).toBe("lower");
    expect(JEANS.styles).toEqual([{ name: "Relaxed straight mid-rise jeans", ranges: {} }]);
    expect(JEANS.styles).not.toEqual(TROUSER.styles);
    expect(JEANS.options?.map(({ id }) => id)).toContain("backPocketDrop");
    expect(JEANS.poms.length).toBeGreaterThan(0);
    expect(JEANS.sizes.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(garmentByName("jeans")).toBe(JEANS);

    const jeansBlock = JEANS.draft(STANDARD_M);
    const jeansPieces = blockPieces(jeansBlock);
    for (const piece of jeansPieces) {
      const rule = JEANS.notches.find(({ pieceName }) => pieceName === piece.name)!;
      expect(rule.notches.length, piece.name).toBeGreaterThan(0);
      expect(rule.notches.every(({ edgeName }) => piece.edges.some(({ name }) => name === edgeName)), piece.name).toBe(true);
      expect(piece.edges.some(({ name }) => name === rule.grainline.topEdge), piece.name).toBe(true);
      expect(piece.edges.some(({ name }) => name === rule.grainline.bottomEdge), piece.name).toBe(true);
    }
    expect(garmentReport(JEANS, STANDARD_M).ok).toBe(true);
  });
});

describe("Hoodie recipe activation (S1137)", () => {
  it("registers the existing adult P0 draft, options, views, and production contract", () => {
    expect(HOODIE.name).toBe("hoodie");
    expect(HOODIE.region).toBe("upper");
    expect(HOODIE_FIELDS).toEqual(["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"]);
    expect(HOODIE.fields).toEqual(HOODIE_FIELDS);
    expect(HOODIE.fields).not.toContain("neckDrop");
    expect(HOODIE.fields).not.toContain("neckWidthEase");
    expect(HOODIE_STYLES).toEqual([{ name: "Adult pullover hoodie P0", ranges: {} }]);
    expect(HOODIE.styles).toEqual(HOODIE_STYLES);
    expect(HOODIE.options).toEqual(HOODIE_OPTION_DEFINITIONS);
    expect(HOODIE_DEFAULT_OPTIONS.hoodHeight).toBe(32);
    expect(HOODIE.resolveOptionsForSize).toBeDefined();
    expect(HOODIE.a0Overflow).toBe(true);
    expect(HOODIE.tiledPdfLocalCoordinates).toBe(true);

    const drafted = HOODIE.draft(STANDARD_M);
    expect(Object.keys(drafted.roles)).toEqual([...HOODIE_ROLE_ORDER]);
    expect(HOODIE.guidance(drafted, STANDARD_M)).toEqual(expect.any(Array));
    expect(HOODIE.techPackForOptions?.({ ...HOODIE_DEFAULT_OPTIONS, hoodCasingWidth: 0 })
      .construction.join(" ")).toContain("not a cut length");
    expect(garmentByName("hoodie")).toBe(HOODIE);
  });
});

describe("Polo recipe pipeline", () => {
  it("is a loose polo with V2 collar controls, full POMs, and complete production data", () => {
    expect(POLO.styles.map((style) => style.name)).toEqual(["Classic polo", "Relaxed polo", "Longline polo"]);
    expect(POLO.options?.map((option) => option.id)).toEqual([
      "placketLength", "placketWidth", "standHeight", "collarLeafDepth",
      "standFrontRise", "collarPointExtension", "sideVentDepth", "backHemDrop",
    ]);
    expect(POLO.poms.map((pom) => pom.label)).toEqual(expect.arrayContaining([
      "Finished placket length", "Finished placket width", "Button spacing",
      "Finished collar stand height", "Finished pointed collar leaf", "Stand front rise",
      "Collar point extension", "Front side-vent depth", "Back side-vent depth", "Front body length (HPS–hem)",
      "Back body length (HPS–hem)", "Back hem drop",
    ]));
    expect(POLO.poms.filter((pom) => pom.label === "Body length (HPS–hem)")).toHaveLength(0);
    expect(POLO.techPack.bom.find((row) => row.material === "Buttons")?.qty).toBe("3");
    expect(POLO.techPack.construction.join(" ")).toContain("knit-compatible stabilizer");
    expect(POLO.techPack.construction.join(" ")).toContain("diagonal corners");
    expect(POLO.techPack.construction.join(" ")).toContain("open side vents");
    expect(POLO.techPack.construction.join(" ")).toContain("front and back body edges separately");
  });

  it("passes generic production checks across its real, nine-piece block", () => {
    const report = garmentReport(POLO, STANDARD_M);
    expect(report.ok).toBe(true);
    expect(blockPieces(POLO.draft(STANDARD_M))).toHaveLength(9);
    expect(report.checks.map((check) => check.name)).toContain("Notches + grainline on every piece");
  });
});

describe("Tank fabric tech-pack selection", () => {
  it("selects woven construction steps and preserves the knit pack", () => {
    const woven = TANK.techPackForFabric!({ name: "Cotton woven", family: "woven", stretchPercent: 0 });
    const knit = TANK.techPackForFabric!({ name: "Cotton jersey", family: "knit", stretchPercent: 25 });
    expect(woven.construction).toContain("Bind the neckline and both armholes with self-fabric binding.");
    expect(knit).toEqual(TANK.techPack);
  });
});

describe("Skirt side-opening tech pack", () => {
  it("specifies one continuous side zipper and removes the old hook closure", () => {
    const zipper = SKIRT.techPack.bom.find((row) => row.material === "Invisible zip");
    expect(zipper).toEqual({
      material: "Invisible zip",
      placement: "One side seam, waistband top to hip",
      qty: "1",
    });
    expect(SKIRT.techPack.bom.some((row) => /button|hook|bar/i.test(row.material))).toBe(false);
    expect(SKIRT.techPack.construction).toEqual([
      "Overlock the exposed raw edges of the panels and waistband pieces.",
      "Join each waistband to its matching front or back panel waist edge, matching the center fold and side endpoint.",
      "Install one invisible zipper in a side opening, continuing from the waistband top through the upper skirt side seam to the hip notch.",
      "Sew the opposite side seam from waistband to hem; close the zipper-side seam from the hip notch to the hem and secure the zipper end.",
      "Turn up and hem the skirt.",
    ]);
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
      const missing = blockPieces(g.draft(STANDARD_M)).map((piece) => piece.name)
        .filter((pieceName) => !g.notches.some((notch) => notch.pieceName === pieceName));
      expect(missing, g.name).toEqual([]);
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

describe("recipe callbacks", () => {
  it("keeps every registered recipe's current draft and presentation callbacks callable", () => {
    for (const recipe of GARMENTS) {
      const options = defaultGarmentOptions(recipe.options ?? []);
      const block = recipe.draft(STANDARD_M, options);
      expect(recipe.checks(block, STANDARD_M)).toBeInstanceOf(Array);
      expect(recipe.guidance(block, STANDARD_M, options)).toBeInstanceOf(Array);
      expect(recipe.sizeMetric(block)).toBeGreaterThan(0);
      expect(recipe.techPackForOptions?.(options) ?? recipe.techPack).toBeTruthy();
      recipe.frontNeckline?.(STANDARD_M);
      recipe.backNeckline?.(STANDARD_M);
      recipe.strapWidth?.(STANDARD_M);
      recipe.techPackForFabric?.({ name: "Cotton woven", family: "woven", stretchPercent: 0 });
      recipe.techPackForFabric?.({ name: "Cotton jersey", family: "knit", stretchPercent: 25 });
    }
  });

  it("applies an optional Tee chest ease to the bodice while retaining shared sleeve ease", () => {
    const inherited = TEE.draft(STANDARD_M);
    expect(TEE.draft(STANDARD_M, {})).toEqual(inherited);
    const independent = TEE.draft(STANDARD_M, { chestEase: 8 });
    const inheritedFrontSide = pieceEdge(rolePiece(inherited, "front"), "side");
    const independentFrontSide = pieceEdge(rolePiece(independent, "front"), "side");
    expect(inheritedFrontSide.kind).toBe("line");
    expect(independentFrontSide.kind).toBe("line");
    if (inheritedFrontSide.kind !== "line" || independentFrontSide.kind !== "line") return;
    expect(inheritedFrontSide.start.x).toBeCloseTo(27.5);
    expect(independentFrontSide.start.x).toBeCloseTo(27);
    expect(edgeLength(pieceEdge(rolePiece(independent, "sleeve"), "hem")))
      .toBeCloseTo(edgeLength(pieceEdge(rolePiece(inherited, "sleeve"), "hem")));
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

  it("records non-default body hem-turn allowance without changing the default pack", () => {
    const defaults = WOVEN_SHIRT.techPackForOptions!({});
    const edited = WOVEN_SHIRT.techPackForOptions!({ hemTurn: 1.2 });
    expect(defaults).toEqual(WOVEN_SHIRT.techPack);
    expect(defaults.construction.some((step) => step.includes("turn-under allowance"))).toBe(false);
    expect(edited.construction).toContain(
      "Apply a 1.2 cm turn-under allowance to the front body and lower-back body hems only; the sleeve hem remains at the default 1.0 cm allowance. This is a cutting allowance, not a finished POM.",
    );
  });

  it("rejects hem-turn allowances and tech-pack options outside the recipe range", () => {
    expect(() => wovenShirtAllowances(Number.NaN)).toThrow(/supported range/);
    expect(() => WOVEN_SHIRT.techPackForOptions!({ hemTurn: 99 })).toThrow(/supported range/);
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

  it("runs the live nine-role block through the generic production report", () => {
    const block = TROUSER.draft(STANDARD_M);
    expect(Object.keys(block.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight",
      "waistband", "flyShield", "flyUnderlap", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(garmentReport(TROUSER, STANDARD_M).ok).toBe(true);
    expect(TROUSER.sizeMetric(block)).toBeGreaterThan(0);
    for (const pom of TROUSER.poms) expect(pom.measure(block)).toBeTypeOf("number");
  });
});

describe("shorts recipe integration (Slice 1100)", () => {
  it("registers the shorts-owned fields, options, and actual nine-role draft", () => {
    expect(SHORTS.region).toBe("lower");
    expect(SHORTS.editRole).toBe("frontLeft");
    expect(SHORTS.fields).toEqual(["waist", "hip", "hipDepth", "crotchDepth", "thigh", "ease"]);
    expect(SHORTS.fields).not.toContain("knee");
    expect(SHORTS.options?.map((option) => option.id)).toEqual([
      "shortsInseam", "hemOpening", "frontRiseEase", "backRiseEase", "waistbandDepth",
      "flyLength", "pocketOpening", "pocketAngle", "pocketBagDepth", "pocketDrop",
    ]);
    expect(SHORTS.styles.map((style) => style.name)).toEqual(["Relaxed woven shorts"]);
    expect(Object.keys(SHORTS.draft(STANDARD_M).roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband", "flyShield",
      "flyUnderlap", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(SHORTS.sizeMetric(SHORTS.draft(STANDARD_M))).toBeGreaterThan(0);
    expect(garmentReport(SHORTS, STANDARD_M).ok).toBe(true);
    for (const pom of SHORTS.poms) expect(pom.measure(SHORTS.draft(STANDARD_M))).toBeTypeOf("number");
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

describe("internal crewneck recipe contract (S1110)", () => {
  it("defines only the accepted existing fields, digital style, and stable option contract", () => {
    expect(CREWNECK_FIELDS).toEqual([
      "chest", "shoulderWidth", "bicep", "length", "armholeDepth",
      "sleeveLength", "ease", "neckDrop", "neckWidthEase",
    ]);
    expect(CREWNECK.styles).toEqual(CREWNECK_STYLES);
    expect(CREWNECK_STYLES).toEqual([{
      name: "Classic crewneck sweatshirt",
      ranges: { ease: [7, 12], length: [59, 74] },
    }]);
    expect(CREWNECK.options).toBe(CREWNECK_OPTION_DEFINITIONS);
    expect(CREWNECK_OPTION_DEFINITIONS.map(({ id, defaultValue, min, max, step }) =>
      [id, defaultValue, min, max, step])).toEqual([
      ["neckbandDepth", 2.5, 1, 8, 0.5],
      ["cuffDepth", 6, 2, 15, 0.5],
      ["hemBandDepth", 6, 2, 15, 0.5],
      ["neckbandLength", 40.5, 1, 120, 0.5],
      ["cuffLength", 31.5, 1, 100, 0.5],
      ["hemBandLength", 93.5, 1, 200, 0.5],
    ]);
    expect(CREWNECK_DEFAULT_OPTIONS).toEqual({
      neckbandDepth: 2.5,
      cuffDepth: 6,
      hemBandDepth: 6,
      neckbandLength: 40.5,
      cuffLength: 31.5,
      hemBandLength: 93.5,
    });
    expect(BARREL_CREWNECK).toBe(CREWNECK);
    expect(BARREL_STABLE_KNIT).toBe(CREWNECK_STABLE_KNIT_DEFAULT);
    expect(CREWNECK_STABLE_KNIT_DEFAULT).toEqual({
      name: "Stable sweatshirt knit (10% width seed)",
      family: "knit",
      stretchPercent: 10,
    });
    expect(STRETCH_FABRICS).toContain(CREWNECK_STABLE_KNIT_DEFAULT);
  });

  it("activates the fully-tabled recipe in the picker and shared material selector", () => {
    expect(CREWNECK.name).toBe("crewneck");
    expect(CREWNECK.label).toBe("Crewneck sweatshirt");
    expect(CREWNECK.region).toBe("upper");
    expect(CREWNECK.editRole).toBe("front");
    expect(GARMENTS).toContain(CREWNECK);
    expect(garmentByName("crewneck")).toBe(CREWNECK);
    expect(CREWNECK.grade).toBe(CREWNECK_GRADE);
    expect(CREWNECK_GRADE).toBe(TEE.grade);
    expect(CREWNECK.sizes).toBe(CREWNECK_SIZES);
    expect(CREWNECK_SIZES.map(({ label, step }) => [label, step])).toEqual([
      ["XS", -2], ["S", -1], ["M", 0], ["L", 1], ["XL", 2],
    ]);
    expect(CREWNECK.resolveOptionsForSize).toBeTypeOf("function");
    expect(CREWNECK.frontNeckline?.(STANDARD_M)).toEqual({
      shape: "crew", widthEase: STANDARD_M.neckWidthEase, frontDrop: STANDARD_M.neckDrop,
    });
    expect(CREWNECK.backNeckline?.(STANDARD_M)).toEqual(CREWNECK.frontNeckline?.(STANDARD_M));

    const drafted = CREWNECK.draft(STANDARD_M);
    expect(Object.keys(drafted.roles)).toEqual(CREWNECK_ROLE_ORDER);
    expect(CREWNECK.checks(drafted, STANDARD_M).map((check) => check.name)).toContain("Hem square to the fold");
    expect(CREWNECK.sizeMetric(drafted)).toBeGreaterThan(0);
    expect(CREWNECK.draft(STANDARD_M, {}).roles.neckband?.edges[0]?.kind).toBe("line");
    expect(crewneckBandMeasurements(drafted, CREWNECK_DEFAULT_OPTIONS).every((item) => item.analysis.calculable)).toBe(true);
  });

  it("declares matching marks, seam allowances, live digital POMs, and an explicit BOM limitation", () => {
    const drafted = CREWNECK.draft(STANDARD_M, CREWNECK_DEFAULT_OPTIONS);
    const draftedPieces = blockPieces(drafted);
    expect(CREWNECK_NOTCHES.map(({ pieceName }) => pieceName)).toEqual(draftedPieces.map(({ name }) => name));
    expect(CREWNECK.allowances).toEqual(CREWNECK_ALLOWANCES);
    expect(CREWNECK_ALLOWANCES).toEqual({ default: 1, byEdge: { centerFront: 0, centerBack: 0 } });
    expect(CREWNECK.poms).toBe(CREWNECK_POMS);
    expect(CREWNECK_POMS.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(CREWNECK_POMS.every((pom) => Number.isFinite(pom.measure(drafted)))).toBe(true);
    for (const pom of CREWNECK_POMS) {
      if (pom.anchor) {
        const point = pom.anchor(drafted);
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      }
    }
    expect(CREWNECK_POMS.find((pom) => pom.label === "Neckband join length (digital)")?.measure(drafted)).toBeCloseTo(40.5);
    expect(CREWNECK_POMS.find((pom) => pom.label === "Left cuff join length (digital)")?.measure(drafted)).toBeCloseTo(31.5);
    expect(CREWNECK_POMS.find((pom) => pom.label === "Hem-band join length (digital)")?.measure(drafted)).toBeCloseTo(93.5);

    expect(CREWNECK.techPack).toBe(CREWNECK_TECH_PACK);
    const rib = CREWNECK_TECH_PACK.bom.find((row) => row.material === "Rib knit (secondary)");
    expect(rib?.qty).toContain("yardage unknown");
    expect(CREWNECK_TECH_PACK.constructionNotice).toContain("no physical sample");
    expect(CREWNECK_TECH_PACK.construction.join(" ")).toContain("greatest-stretch direction mark");
  });

  it("grades the live band joins proportionally across XS–XL without changing the selected ratio", () => {
    const graded = gradeRecipeRun(CREWNECK, STANDARD_M, CREWNECK.sizes, CREWNECK_DEFAULT_OPTIONS);
    expect(graded.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    const bySize = graded.map(({ block }) => crewneckBandMeasurements(block, CREWNECK_DEFAULT_OPTIONS));
    const base = bySize[2]!;
    for (const role of ["neckband", "cuffLeft", "cuffRight", "hemBand"] as const) {
      const baseBand = base.find((item) => item.role === role)!;
      const baseRatio = baseBand.bandEdgeLengthCm / baseBand.openingLengthCm;
      for (const size of bySize) {
        const current = size.find((item) => item.role === role)!;
        expect(current.bandEdgeLengthCm / current.openingLengthCm).toBeCloseTo(baseRatio, 9);
      }
    }
  });

  it("reports ratios as math and gives actionable corrections for invalid options and geometry", () => {
    const goodBlock = CREWNECK.draft(STANDARD_M, CREWNECK_DEFAULT_OPTIONS);
    const good = CREWNECK.guidance(goodBlock, STANDARD_M, CREWNECK_DEFAULT_OPTIONS);
    const ratioNote = good.find((note) => note.field === "neckbandLength");
    expect(ratioNote?.level).toBe("info");
    expect(ratioNote?.text).toContain("opening/band");
    expect(ratioNote?.text).toContain("implied required stretch");
    expect(ratioNote?.text).toContain("not a material");
    expect(good.some((note) => note.text.includes("Stable sweatshirt knit (10% width seed)"))).toBe(true);

    const invalidOptions = { ...CREWNECK_DEFAULT_OPTIONS, neckbandLength: 0, cuffDepth: Number.NaN };
    const invalidBlock = CREWNECK.draft(STANDARD_M, invalidOptions);
    const invalid = CREWNECK.guidance(invalidBlock, STANDARD_M, invalidOptions);
    expect(invalid.some((note) => note.level === "warn" && note.field === "neckbandLength" && note.text.includes("greater than zero"))).toBe(true);
    expect(invalid.some((note) => note.level === "warn" && note.field === "cuffDepth" && note.text.includes("finite"))).toBe(true);
    expect(invalidOptions.neckbandLength).toBe(0);
    expect(Number.isNaN(invalidOptions.cuffDepth)).toBe(true);

    const outOfRangeOptions = { ...CREWNECK_DEFAULT_OPTIONS, hemBandLength: 201 };
    const outOfRangeBlock = CREWNECK.draft(STANDARD_M, outOfRangeOptions);
    const outOfRange = CREWNECK.guidance(outOfRangeBlock, STANDARD_M, outOfRangeOptions);
    expect(outOfRange.some((note) => note.level === "warn" && note.field === "hemBandLength" && note.text.includes("1–200"))).toBe(true);
    expect(outOfRangeOptions.hemBandLength).toBe(201);

    const invalidMeasurements = { ...STANDARD_M, chest: Number.NaN };
    const invalidGeometry = CREWNECK.guidance(
      CREWNECK.draft(invalidMeasurements, CREWNECK_DEFAULT_OPTIONS),
      invalidMeasurements,
      CREWNECK_DEFAULT_OPTIONS,
    );
    expect(invalidGeometry.some((note) => note.level === "warn" && note.text.includes("actual walked opening"))).toBe(true);

    const tinyOptions = { ...CREWNECK_DEFAULT_OPTIONS, neckbandLength: Number.MIN_VALUE };
    const tiny = CREWNECK.guidance(CREWNECK.draft(STANDARD_M, tinyOptions), STANDARD_M, tinyOptions);
    expect(tiny.some((note) => note.level === "warn" && note.text.includes("cannot be represented"))).toBe(true);
  });
});

describe("Jogger recipe activation (S1119)", () => {
  it("registers the existing P0 contract without adding a numeric style fit range", () => {
    expect(BARREL_JOGGER).toBe(JOGGER);
    expect(GARMENTS.slice(-2)).toEqual([JOGGER, HOODIE]);
    expect(JOGGER).toMatchObject({
      name: "jogger",
      label: "Jogger",
      region: "lower",
      editRole: "frontLeft",
      fields: JOGGER_FIELDS,
      styles: JOGGER_STYLES,
      options: JOGGER_OPTION_DEFINITIONS,
      a0Overflow: true,
      tiledPdfLocalCoordinates: true,
    });
    expect(JOGGER_STYLES).toEqual([{ name: "Adult knit jogger P0", ranges: {} }]);
    expect(JOGGER.grammar).toBeDefined();
    expect(JOGGER.allowances).toBeDefined();
    expect(JOGGER.notches.length).toBeGreaterThan(0);
    expect(JOGGER.poms.length).toBeGreaterThan(0);
    expect(JOGGER.sizes.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(JOGGER.techPack.construction.join(" ")).toContain("Do not use a fixed waist-reduction rule");
  });

  it("projects the drawcord seed into Tech Pack guidance without calling it a cut length", () => {
    const defaultPack = JOGGER.techPackForOptions!({});
    const editedPack = JOGGER.techPackForOptions!({ drawcordLength: 132 });
    const invalidPack = JOGGER.techPackForOptions!({ drawcordLength: 181 });
    const nonFinitePack = JOGGER.techPackForOptions!({ drawcordLength: Number.NaN });

    expect(defaultPack).toEqual(JOGGER.techPackForOptions!({ drawcordLength: JOGGER_DEFAULT_OPTIONS.drawcordLength }));
    expect(defaultPack.construction[0]).toContain("Digital drawcord seed: 120 cm");
    expect(editedPack.construction[0]).toContain("Digital drawcord seed: 132 cm");
    expect(editedPack.construction[0]).toContain("not a cut length");
    expect(editedPack.construction[0]).toContain("measure/test-fit cord before cutting");
    expect(invalidPack.construction[0]).toContain("181 cm is outside the 80–180 cm control range");
    expect(nonFinitePack.construction[0]).toContain("NaN cm is outside the 80–180 cm control range");
    expect(defaultPack.bom).toEqual(JOGGER.techPack.bom);
    expect(editedPack.bom).toEqual(JOGGER.techPack.bom);
  });

  it("routes the registered recipe through its Jogger draft and actionable guidance", () => {
    const drafted = JOGGER.draft(STANDARD_M, JOGGER_DEFAULT_OPTIONS);
    expect(Object.keys(drafted.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(JOGGER.guidance(drafted, STANDARD_M, JOGGER_DEFAULT_OPTIONS).filter(({ level }) => level === "warn")).toEqual([]);
    expect(Number.isFinite(JOGGER.sizeMetric(drafted))).toBe(true);

    const invalidOptions = { ...JOGGER_DEFAULT_OPTIONS, waistbandDepth: 2 };
    const invalid = JOGGER.guidance(JOGGER.draft(STANDARD_M, invalidOptions), STANDARD_M, invalidOptions);
    expect(invalid.some((note) => note.field === "option-waistbandDepth" && note.text.includes("increase casing depth"))).toBe(true);
  });
});
