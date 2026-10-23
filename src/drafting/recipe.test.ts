import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { defaultGarmentOptions } from "./options";
import { TEE, TEE_RAGLAN, FITTED, TANK, POLO, WOVEN_SHIRT, SKIRT, TROUSER, GARMENTS,
  garmentByName, garmentForConstruction, piecesForRecipeBlock, pomsForRecipeOptions, notchesForRecipeOptions } from "./recipe";
import { raglanNecklineLength, raglanTeeGuidance, TEE_RAGLAN_GRAMMAR, TEE_RAGLAN_STITCHES } from "./tshirt-raglan";
import { TEE_SCOOP_NECK_DROP_OPTION_ID, TEE_V_NECK_DROP_OPTION_ID } from "./tshirt";
import { TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION } from "./vneck-band-output";
import { dartOf } from "./dart";
import { rolePiece, blockPieces } from "./block";
import { pieceEdge } from "./piece";
import { edgeLength } from "./piece";
import { derive } from "./measurements";
import { necklineEdge } from "./neckline";
import { garmentReport } from "../guidance/garment-check";
import { wovenShirtAllowances } from "./shirt";
import { teeNeckbandTemplateSvg, teeVNeckbandTemplateSvg } from "./tshirt";
import { exportSvg } from "../export/svg";
import { exportDxf } from "../export/dxf";
import { gradeRun } from "./grading";
import { stitchChecks } from "./stitch";
import { FITTED_PRINCESS_ENTRY_ID, FITTED_VNECK_ENTRY_ID } from "./fitted";


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

describe("recipe cut quantities", () => {
  it("expands only the declared F03 cut roles for marker and nesting geometry", () => {
    const options = defaultGarmentOptions(FITTED.options ?? [], FITTED_PRINCESS_ENTRY_ID);
    const block = FITTED.draft(STANDARD_M, options);
    const pieces = piecesForRecipeBlock(FITTED, block, options);
    expect(pieces.map((piece) => piece.name)).toEqual([
      "fitted front center", "fitted side front (cut 2 mirrored) (1 of 2)",
      "fitted side front (cut 2 mirrored) (2 of 2)", "back", "sleeve (1 of 2)", "sleeve (2 of 2)",
    ]);
    expect(pieces[1]!.edges).toEqual(pieces[2]!.edges);
    expect(pieces[4]!.edges).toEqual(pieces[5]!.edges);
    expect(piecesForRecipeBlock(FITTED, FITTED.draft(STANDARD_M)).map((piece) => piece.name))
      .toEqual(["fitted front", "back", "sleeve"]);
    const partialQuantities = piecesForRecipeBlock({ ...FITTED, pieceQuantitiesForOptions: () => ({ front: 1 }) },
      FITTED.draft(STANDARD_M));
    expect(partialQuantities.map((piece) => piece.name)).toEqual(["fitted front", "back", "sleeve"]);
    expect(piecesForRecipeBlock(TEE, TEE.draft(STANDARD_M)).map((piece) => piece.name))
      .toEqual(["front", "back", "sleeve"]);
  });

  it("rejects quantities that do not resolve to a present role and positive integer", () => {
    const block = FITTED.draft(STANDARD_M);
    expect(() => piecesForRecipeBlock({ ...FITTED, pieceQuantitiesForOptions: () => ({ ghost: 1 }) }, block))
      .toThrow('Declared cut quantity references missing role "ghost".');
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      expect(() => piecesForRecipeBlock({ ...FITTED, pieceQuantitiesForOptions: () => ({ front: quantity }) }, block))
        .toThrow('Cut quantity for role "front" must be a positive safe integer.');
    }
  });
});

describe("option-aware construction marks", () => {
  it("selects notch and grainline tables for the active Fitted panel topology", () => {
    const legacy = notchesForRecipeOptions(FITTED);
    expect(legacy.map(({ pieceName }) => pieceName)).toEqual(["fitted front", "back", "sleeve"]);

    const princessOptions = defaultGarmentOptions(FITTED.options ?? [], FITTED_PRINCESS_ENTRY_ID);
    const princess = notchesForRecipeOptions(FITTED, princessOptions);
    expect(princess.map(({ pieceName }) => pieceName)).toEqual([
      "fitted front center", "fitted side front (cut 2 mirrored)", "back", "sleeve",
    ]);
    expect(notchesForRecipeOptions(TEE)).toBe(TEE.notches);
  });
});

describe("T08 Raglan Tee construction variant", () => {
  it("keeps seven roots while resolving Tee construction to the correct digital recipe", () => {
    expect(GARMENTS).toHaveLength(7);
    expect(garmentForConstruction("tee", "set-in")).toBe(TEE);
    expect(garmentForConstruction("tee", "raglan")).toBe(TEE_RAGLAN);
    expect(garmentForConstruction("polo", "raglan")).toBe(POLO);
    expect(TEE_RAGLAN.name).toBe("tee");
    expect(TEE_RAGLAN.label).toBe("Raglan Tee");
    expect(TEE_RAGLAN.grammar).toBe(TEE_RAGLAN_GRAMMAR);
    expect(TEE_RAGLAN.options?.map((option) => option.id)).not.toContain("teeVNeckDropCm");
    expect(TEE_RAGLAN.options?.map((option) => option.id)).not.toContain("teeScoopNeckDropCm");
  });

  it("drafts matched front and back Raglan seams with notches, POMs, and a digital neckline", () => {
    const block = TEE_RAGLAN.draft(STANDARD_M);
    const report = garmentReport(TEE_RAGLAN, STANDARD_M);
    expect(blockPieces(block).map((piece) => piece.name)).toEqual(["front", "back", "sleeve"]);
    expect(report.checks.filter((check) => check.name.toLowerCase().includes("raglan")).every((check) => check.ok)).toBe(true);
    const sideToCuff = TEE_RAGLAN_STITCHES.find((stitch) => stitch.label.startsWith("Continuous side-to-cuff"))!;
    expect(sideToCuff.a.edges).toEqual([
      { piece: "front", edge: "side", reversed: true },
      { piece: "sleeve", edge: "sideLeft", reversed: true },
    ]);
    expect(sideToCuff.b.edges).toEqual([
      { piece: "sleeve", edge: "sideRight", reversed: true },
      { piece: "back", edge: "side" },
    ]);
    expect(report.checks.find((check) => check.name === sideToCuff.label)?.ok).toBe(true);
    expect(TEE_RAGLAN.notches.map((entry) => entry.pieceName)).toEqual(["front", "back", "sleeve"]);
    expect(TEE_RAGLAN.notches.flatMap((entry) => entry.notches).length).toBeGreaterThan(0);
    expect(TEE_RAGLAN.notches.find((entry) => entry.pieceName === "sleeve")?.notches)
      .toContainEqual({ edgeName: "backRaglan", t: 0.66 });
    expect(TEE_RAGLAN.poms).toHaveLength(9);
    expect(TEE_RAGLAN.poms.every((pom) => Number.isFinite(pom.measure(block)) && pom.measure(block) > 0)).toBe(true);
    expect(raglanNecklineLength(block)).toBeGreaterThan(0);
    expect(TEE_RAGLAN.techPack.construction.join(" ")).toContain("front body raglan seam");
    expect(TEE_RAGLAN.techPack.construction.join(" ")).toContain("short ends at center back");
    expect(TEE_RAGLAN.techPack.construction.join(" ")).toContain("side-to-cuff path in one continuous pass");
    expect(TEE_RAGLAN.techPack.construction.join(" ")).not.toMatch(/shoulder seam|set in|cap ease/i);
    expect(TEE_RAGLAN.techPack.bom.some((row) => row.placement === "Shoulder seams")).toBe(false);
    expect(TEE_RAGLAN.techPack.constructionNotice).toContain("no sewn sample");
    expect(TEE_RAGLAN.techPackForOptions?.({ teeScoopNeckDropCm: 2 })?.constructionNotice).toContain("crew-neck only");
    const neckband = teeNeckbandTemplateSvg(blockPieces(block), 85, 2.4);
    expect(neckband).toContain("<title>Raglan Tee neckband provisional cutting template</title>");
    expect(neckband).toContain("data-neckline-circumference-cm=");
    expect(neckband).toContain("both sleeve neckline edges");
    expect(neckband).toContain("data-neckband-anchor=\"center-back\"");
    expect(neckband).toContain("data-neckband-match=\"center-front\"");
    expect(neckband).not.toContain("data-quarter-notch");
    const neckbandCircumference = Number(neckband.match(/data-neckline-circumference-cm="([^"]+)"/)?.[1]);
    expect(neckbandCircumference).toBeCloseTo(raglanNecklineLength(block), 2);
    const notchMatches = [...neckband.matchAll(/data-neckband-match="([^"]+)" data-neckband-offset-cm="([^"]+)"/g)];
    const frontNeckline = edgeLength(pieceEdge(rolePiece(block, "front"), "neckline"));
    const backNeckline = edgeLength(pieceEdge(rolePiece(block, "back"), "neckline"));
    const sleeveNeckline = edgeLength(pieceEdge(rolePiece(block, "sleeve"), "neckline"));
    const expectedNotches = [
      ["back-raglan-1", backNeckline * 0.85],
      ["front-raglan-1", (backNeckline + sleeveNeckline) * 0.85],
      ["center-front", (backNeckline + sleeveNeckline + frontNeckline) * 0.85],
      ["front-raglan-2", (backNeckline + sleeveNeckline + 2 * frontNeckline) * 0.85],
      ["back-raglan-2", (backNeckline + sleeveNeckline + 2 * frontNeckline + sleeveNeckline) * 0.85],
    ] as const;
    expect(notchMatches.map((match) => match[1])).toEqual(expectedNotches.map(([name]) => name));
    notchMatches.forEach((match, index) => expect(Number(match[2])).toBeCloseTo(expectedNotches[index]![1], 3));
    const svg = exportSvg(blockPieces(block), TEE_RAGLAN.allowances!, TEE_RAGLAN.notches);
    expect(svg).toContain(">FRONT</text>");
    expect(svg).toContain(">BACK</text>");
    expect(svg).toContain(">SLEEVE</text>");
    const dxf = exportDxf(blockPieces(block), TEE_RAGLAN.allowances!);
    expect((dxf.match(/^POLYLINE$/gm) ?? []).length).toBe(6);
  });

  it("adds the inactive-neckline notice when the base Tech Pack has no construction notice", () => {
    const noNotice = TEE_RAGLAN.techPackForOptions!.call(
      {
        ...TEE_RAGLAN,
        techPack: { ...TEE_RAGLAN.techPack, constructionNotice: undefined },
      },
      { [TEE_SCOOP_NECK_DROP_OPTION_ID]: 2 },
    );

    expect(noNotice.constructionNotice).toMatch(/^ Raglan is crew-neck only;/);
  });

  it("redrafts the complete supported Tee size run with matching digital Raglan seams", () => {
    const run = gradeRun(STANDARD_M, TEE_RAGLAN.grade!, TEE_RAGLAN.sizes, TEE_RAGLAN.draft);
    expect(run.map((size) => size.label)).toEqual(TEE_RAGLAN.sizes.map((size) => size.label));
    for (const size of run) {
      expect(stitchChecks(size.block, size.block.stitches).every((check) => check.ok), size.label).toBe(true);
      expect(TEE_RAGLAN.poms.every((pom) => Number.isFinite(pom.measure(size.block))), size.label).toBe(true);
    }
  });

  it("reports invalid digital inputs and inactive Set-in neckline settings without clamping", () => {
    const shortSleeve = { ...STANDARD_M, sleeveLength: 2, armholeDepth: 40 };
    const block = TEE_RAGLAN.draft(shortSleeve);
    const guidance = raglanTeeGuidance(block, shortSleeve, { teeVNeckDropCm: 5 });
    expect(guidance.some((note) => note.field === "sleeveLength" && note.text.includes("Increase sleeve length"))).toBe(true);
    expect(guidance.some((note) => note.field === "teeConstruction" && note.text.includes("inactive"))).toBe(true);
    expect(guidance.every((note) => !note.text.includes("input was changed"))).toBe(true);
  });
});

describe("F02 waist-darted Fitted Tee Tech Pack", () => {
  it("adds a waist-dart sewing step only when the F02 entry options are active", () => {
    const f01 = FITTED.techPackForOptions!(FITTED.options!.slice(0, 3).reduce((values, option) => ({
      ...values, [option.id]: option.defaultValue,
    }), {}));
    const f02 = FITTED.techPackForOptions!({ waistDartWaistlineFromHps: 43, waistDartIntake: 2,
      waistDartLength: 10, waistDartPosition: 45 });
    const waistStep = "Sew the marked front waist dart by matching both legs to the apex; orient the sewn fold toward center front.";

    expect(f01).toBe(FITTED.techPack);
    expect(f01.construction).not.toContain(waistStep);
    expect(f02.construction).toContain(waistStep);
    expect(f02.construction.indexOf(waistStep)).toBe(f02.construction.indexOf("Sew the bust darts; press them toward the hem.") + 1);
  });
});

describe("F03 princess-seam fitted Tee pipeline", () => {
  const options = defaultGarmentOptions(FITTED.options ?? [], FITTED_PRINCESS_ENTRY_ID);

  it("redrafts every supported grade size with matched seams, explicit POMs, allowances and cut instructions", () => {
    const run = gradeRun(STANDARD_M, FITTED.grade, FITTED.sizes, FITTED.draft, options);
    expect(run.map((size) => size.label)).toEqual(FITTED.sizes.map((size) => size.label));
    for (const size of run) {
      expect(stitchChecks(size.block, size.block.stitches).every((check) => check.ok), size.label).toBe(true);
      expect(FITTED.checks(size.block, size.measurements).every((check) => check.ok), size.label).toBe(true);
      expect(FITTED.guidance(size.block, size.measurements, options).filter((note) => note.level === "warn"), size.label)
        .toEqual([]);
      expect(pomsForRecipeOptions(FITTED, options).every((pom) => Number.isFinite(pom.measure(size.block))), size.label)
        .toBe(true);
    }
    expect(pomsForRecipeOptions(FITTED, options).map((pom) => pom.label)).toContain("Modeled princess seam");
    expect(FITTED.allowances.byEdge).toMatchObject({ princessUpper: 1, princessLower: 1 });
    const techPack = FITTED.techPackForOptions!(options);
    expect(techPack.construction[0]).toContain("2 side-front pieces as a mirrored pair");
    expect(techPack.construction[0]).toContain("2 sleeves");
    expect(techPack.constructionNotice).toContain("physical fit");
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
    expect(fittedChecks).toContain("Side seam trued in closed reference");
    expect(fittedChecks).toContain("Bust dart closed before trueing");
    expect(fittedChecks).toContain("Hem level in dart-closed reference");
    expect(fittedChecks).toContain("Hem square to fold (dart-closed reference)");

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

  it("drafts an option-driven V front with a crew back and matching preview parameters", () => {
    const options = { [TEE_V_NECK_DROP_OPTION_ID]: 6.5 };
    const block = TEE.draft(STANDARD_M, options);
    const crewBlock = TEE.draft(STANDARD_M, {});
    const front = pieceEdge(rolePiece(block, "front"), "neckline");
    const back = pieceEdge(rolePiece(block, "back"), "neckline");
    const crewFront = pieceEdge(rolePiece(crewBlock, "front"), "neckline");
    const declaredFront = TEE.frontNeckline!(STANDARD_M, options);
    const declaredBack = TEE.backNeckline!(STANDARD_M);

    expect(front.kind).toBe("line");
    expect(back.kind).toBe("curve");
    expect(crewFront.kind).toBe("curve");
    expect(declaredFront).toEqual({ shape: "v", widthEase: 0, frontDrop: 6.5 });
    expect(declaredBack).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
  });

  it("drafts an option-driven rounded Scoop front with a crew back and matching output seamline", () => {
    const options = { [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5 };
    const block = TEE.draft(STANDARD_M, options);
    const crewBlock = TEE.draft(STANDARD_M, {});
    const front = pieceEdge(rolePiece(block, "front"), "neckline");
    const back = pieceEdge(rolePiece(block, "back"), "neckline");
    const crewFront = pieceEdge(rolePiece(crewBlock, "front"), "neckline");

    expect(front.kind).toBe("curve");
    expect(back.kind).toBe("curve");
    expect(crewFront.kind).toBe("curve");
    expect(edgeLength(front)).toBeGreaterThan(edgeLength(crewFront));
    expect(TEE.frontNeckline!(STANDARD_M, options)).toEqual({ shape: "scoop", widthEase: 0, frontDrop: 5 });
    expect(TEE.backNeckline!(STANDARD_M)).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
  });

  it("keeps crew output unchanged and supplies a V-specific neckband BOM and construction summary", () => {
    const crew = TEE.techPackForOptions!({});
    const vNeckOptions = {
      [TEE_V_NECK_DROP_OPTION_ID]: 5,
      teeNeckbandLengthPercent: 85,
      teeNeckbandFinishedWidthCm: 2.4,
      teeVNecklineCircumferenceCm: 40,
      teeVNeckbandTargetLengthCm: 34,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    };
    const wholeRunVNeck = TEE.techPackForOptions!({ [TEE_V_NECK_DROP_OPTION_ID]: 5 });
    const vNeck = TEE.techPackForOptions!(vNeckOptions);

    expect(crew).toBe(TEE.techPack);
    expect(crew.bom.some((row) => row.placement === "Neckband")).toBe(true);
    expect(crew.construction.some((step) => step.startsWith("Attach the neckband"))).toBe(true);
    expect(wholeRunVNeck.constructionNotice).toContain("whole-run Tech Packs do not include graded-size V-band");
    expect(wholeRunVNeck.bom.some((row) => row.placement === "Provisional V-neck band")).toBe(false);
    expect(wholeRunVNeck.construction.join(" ")).not.toContain("V-band settings:");
    expect(vNeck.constructionNotice).toContain("Provisional digital V-band construction");
    expect(vNeck.bom.some((row) => row.placement === "Neckband")).toBe(false);
    expect(vNeck.bom).toContainEqual({
      material: "User-selected band material",
      placement: "Provisional V-neck band",
      qty: "1 strip; see selected-size V-band SVG",
    });
    expect(vNeck.construction).toContain("Mark and staystitch the front V point; clip to, but not through, the point stitching.");
    expect(vNeck.construction).toContain("Match the band center-front to the garment V point, then align shoulder and center-back registration notches.");
    expect(vNeck.construction.some((step) => step.startsWith("V-band settings: Measured selected-size body neckline 40.0 cm; selected band target 34.0 cm at 85%"))).toBe(true);
    expect(vNeck.construction.join(" ")).toContain("Finished width 2.4 cm");
    expect(vNeck.construction.join(" ")).toContain("no graded-size band output is supplied");
  });

  it("adds selected-size V-band instructions to F04 without losing its bust-dart construction", () => {
    const vNeckDrop = { [TEE_V_NECK_DROP_OPTION_ID]: 5 };
    const wholeRun = FITTED.techPackForOptions!(vNeckDrop);
    const selectedSize = FITTED.techPackForOptions!({
      ...vNeckDrop,
      teeNeckbandLengthPercent: 85,
      teeNeckbandFinishedWidthCm: 2.4,
      teeVNecklineCircumferenceCm: 40,
      teeVNeckbandTargetLengthCm: 34,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    });
    const invalidSettings = FITTED.techPackForOptions!({
      ...vNeckDrop,
      teeNeckbandLengthPercent: 74,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    });
    const fittedBlock = FITTED.draft(STANDARD_M, { ...vNeckDrop, dartIntake: 4,
      bustApexHorizontal: 55, bustApexVertical: 28 });
    const fittedPieces = blockPieces(fittedBlock);
    const svg = teeVNeckbandTemplateSvg(fittedPieces, 85, 2.4, "Fitted Tee");

    expect(FITTED.techPackForOptions!({})).toBe(FITTED.techPack);
    expect(wholeRun.constructionNotice).toContain("whole-run Tech Packs do not include graded-size V-band");
    expect(wholeRun.bom.some((row) => row.placement === "Provisional V-neck band")).toBe(false);
    expect(wholeRun.construction.join(" ")).toContain("Sew the bust darts; press them toward the hem.");
    expect(wholeRun.construction.join(" ")).not.toContain("V-band settings:");
    expect(selectedSize.constructionNotice).toContain("Provisional digital V-band construction");
    expect(selectedSize.construction.join(" ")).toContain("Sew the bust darts; press them toward the hem.");
    expect(selectedSize.construction.join(" ")).toContain("V-band settings: Measured selected-size body neckline");
    const fittedBandBom = selectedSize.bom.find((row) => row.placement === "Provisional V-neck band");
    expect(fittedBandBom?.qty).toBe("1 strip");
    expect(selectedSize.construction.join(" ")).toContain("separate selected-size band SVG");
    expect(invalidSettings.constructionNotice).toContain("Fitted Tee band settings");
    expect(invalidSettings.bom.some((row) => row.placement === "Provisional V-neck band")).toBe(false);
    expect(svg).toContain("Fitted Tee V-neck band provisional cutting template");
    expect(svg).toContain("Fitted Tee V-NECK BAND");
    expect(fittedPieces.some((piece) => piece.name === "fitted front")).toBe(true);
    expect(FITTED_VNECK_ENTRY_ID).toBe("fitted-vneck-tee-digital-v1");
  });

  it("uses default V band parameters when omitted and withholds band steps for invalid settings", () => {
    const defaults = TEE.techPackForOptions!({
      [TEE_V_NECK_DROP_OPTION_ID]: 5,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    });
    expect(defaults.bom.some((row) => row.placement === "Provisional V-neck band")).toBe(true);
    expect(defaults.construction.join(" ")).toContain("Selected band target 75% of the measured neckline");
    expect(defaults.construction.join(" ")).toContain("Finished width 2.0 cm");

    const invalidSettings: Readonly<Record<string, number>>[] = [
      { teeNeckbandLengthPercent: Number.NaN },
      { teeNeckbandLengthPercent: 74 },
      { teeNeckbandLengthPercent: 91 },
      { teeNeckbandLengthPercent: 75.5 },
      { teeNeckbandFinishedWidthCm: Number.NaN },
      { teeNeckbandFinishedWidthCm: 1.4 },
      { teeNeckbandFinishedWidthCm: 3.1 },
      { teeNeckbandFinishedWidthCm: 2.05 },
    ];
    for (const settings of invalidSettings) {
      const invalid = TEE.techPackForOptions!({
        [TEE_V_NECK_DROP_OPTION_ID]: 5,
        [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
        ...settings,
      });
      expect(invalid.constructionNotice).toContain("unavailable while its length or finished-width setting is invalid");
      expect(invalid.bom.some((row) => row.placement === "Provisional V-neck band")).toBe(false);
      expect(invalid.construction.some((step) => step.startsWith("Attach the neckband"))).toBe(false);
    }
  });

  it("keeps the provisional rounded-loop output for Scoop and explicitly withholds it on an option conflict", () => {
    const scoop = TEE.techPackForOptions!({ [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5 });
    const conflictOptions = {
      [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5,
      [TEE_V_NECK_DROP_OPTION_ID]: 6,
    };
    const conflict = TEE.techPackForOptions!(conflictOptions);

    expect(scoop).toBe(TEE.techPack);
    expect(scoop.bom.some((row) => row.placement === "Neckband")).toBe(true);
    expect(scoop.construction.some((step) => step.startsWith("Attach the neckband"))).toBe(true);
    expect(TEE.frontNeckline!(STANDARD_M, conflictOptions)).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(conflict.constructionNotice).toContain("Both V and Scoop neckline options are active");
    expect(conflict.bom.some((row) => row.placement === "Neckband")).toBe(false);
    expect(conflict.construction.some((step) => step.startsWith("Attach the neckband"))).toBe(false);
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
