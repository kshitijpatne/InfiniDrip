import { describe, expect, it } from "vitest";
import { blockPieces, GARMENTS, gradeRun, specSheet, STANDARD_M, WOVEN_SHIRT as WOVEN_SHIRT_RECIPE, type GarmentOptions } from "../drafting";
import { exportA0Pdf, exportDxf, exportPdf, exportProjectorSvg, exportSvg, exportTechPackV2, flattenPiece, nestPieces } from "../export";
import { DEFAULT_WOVEN_SHIRT_OPTIONS } from "../drafting/shirt-contract";
import {
  assertFieldArtifactCoverage,
  describeFieldArtifactImpact,
  FIELD_DEPENDENT_ARTIFACTS,
  FIELD_INDEPENDENT_ARTIFACTS,
  getFieldArtifactDependency,
  getRecipeFieldArtifactMatrix,
} from "./artifact-dependencies";
import { getAllFieldDefinitions, getFieldDefinitions } from "./field-provenance";

function defaultOptions(recipeName: string): GarmentOptions {
  const recipe = GARMENTS.find((item) => item.name === recipeName)!;
  return Object.fromEntries((recipe.options ?? []).map((option) => [option.id, option.defaultValue]));
}

function adjacentAllowedValue(value: number, min: number, max: number, step: number): number {
  return value + step <= max ? value + step : value - step >= min ? value - step : value;
}

function derivedOutputs(recipeName: string, options: GarmentOptions, measurements = STANDARD_M) {
  const recipe = GARMENTS.find((item) => item.name === recipeName)!;
  const block = recipe.draft(measurements, options);
  const pieces = blockPieces(block);
  const graded = gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, options);
  const flats = pieces.map((piece) => flattenPiece(piece, recipe.allowances));
  return {
    pattern: block,
    pomSpec: specSheet(graded, recipe.poms),
    grade: graded,
    nesting: nestPieces(flats, 150),
    exports: {
      svg: exportSvg(pieces, recipe.allowances, recipe.notches),
      dxf: exportDxf(pieces, recipe.allowances),
      tiledPdf: exportPdf(pieces, recipe.allowances),
      techPackPdf: exportTechPackV2(recipe, measurements, undefined, undefined, options),
      projectorSvg: exportProjectorSvg(recipe, measurements, options),
      a0Pdf: exportA0Pdf(pieces, recipe.allowances, recipe.notches),
    },
  };
}

describe("field-to-artifact invalidation graph", () => {
  it("covers every measurement and construction option across all seven recipes exactly once", () => {
    assertFieldArtifactCoverage();
    const total = GARMENTS.reduce((sum, recipe) => sum + recipe.fields.length + (recipe.options?.length ?? 0), 0);
    expect(getAllFieldDefinitions()).toHaveLength(total);
    for (const recipe of GARMENTS) {
      const definitions = getFieldDefinitions(recipe.name);
      const matrix = getRecipeFieldArtifactMatrix(recipe.name);
      expect(matrix.map((row) => `${row.inputKind}/${row.inputKey}`)).toEqual(
        definitions.map((field) => `${field.inputKind}/${field.inputKey}`),
      );
      expect(matrix.every((row) => row.recipeId === recipe.name && row.affected.length > 0 && row.unaffected.length > 0)).toBe(true);
    }
  });

  it("rejects a recipe whose newly added input has no field definition and dependency row", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    expect(() => assertFieldArtifactCoverage([{ ...tee, fields: [...tee.fields, "neck"] }])).toThrow(
      "tee field inputs do not have a complete artifact dependency row.",
    );
  });

  it("probes every field against the real recipe draft and keeps view-only hem turn explicit", () => {
    for (const recipe of GARMENTS) {
      const options = defaultOptions(recipe.name);
      const baselineBlock = recipe.draft(STANDARD_M, options);
      for (const definition of getFieldDefinitions(recipe.name)) {
        const dependency = getFieldArtifactDependency(recipe.name, definition.inputKind, definition.inputKey)!;
        const measured = definition.inputKind === "measurement"
          ? STANDARD_M[definition.inputKey as keyof typeof STANDARD_M]
          : undefined;
        const optionValue = definition.inputKind === "option" ? options[definition.inputKey] : undefined;
        const current = measured ?? optionValue ?? definition.defaultValue;
        const changed = adjacentAllowedValue(current, definition.min, definition.max, definition.step);
        const nextMeasurements = definition.inputKind === "measurement"
          ? { ...STANDARD_M, [definition.inputKey]: changed }
          : STANDARD_M;
        const nextOptions = definition.inputKind === "option"
          ? { ...options, [definition.inputKey]: changed }
          : options;
        const nextBlock = recipe.draft(nextMeasurements, nextOptions);
        if (recipe.name === "woven-shirt" && definition.inputKey === "hemTurn") {
          expect(JSON.stringify(nextBlock)).toBe(JSON.stringify(baselineBlock));
          expect(dependency.notRepresented.map((artifact) => artifact.id)).toEqual([
            "pattern", "pom-spec", "nesting", "garment-exports",
          ]);
          expect(dependency.affected.map((artifact) => artifact.id)).toEqual(["views.assembled-and-check"]);
          continue;
        }
        if (recipe.name === "tank" && definition.inputKey === "shoulderWidth") {
          expect(JSON.stringify(nextBlock)).toBe(JSON.stringify(baselineBlock));
          expect(dependency.notRepresented.map((artifact) => artifact.id)).toEqual([
            "pattern", "pom-spec", "nesting", "garment-exports",
          ]);
          expect(dependency.affected.map((artifact) => artifact.id)).toEqual(["grade-run", "views.body-assembled-check"]);
          continue;
        }
        expect(JSON.stringify(nextBlock), `${recipe.name}/${definition.inputKey} must change a drafted piece or mark`).not.toBe(JSON.stringify(baselineBlock));
        expect(dependency.notRepresented).toEqual([]);
        if (recipe.name === "woven-shirt" && (definition.inputKey === "buttonCount" || definition.inputKey === "buttonSpacing")) {
          expect(dependency.affected.some((artifact) => artifact.id === "nesting")).toBe(false);
          expect(dependency.unaffected.some((artifact) => artifact.id === "nesting")).toBe(true);
        } else {
          expect(dependency.affected.some((artifact) => artifact.id === "nesting")).toBe(true);
        }
      }
    }
  });

  it("distinguishes preview-only hem turn from tank shoulder width's per-size measurement records", () => {
    const wovenBase = { ...DEFAULT_WOVEN_SHIRT_OPTIONS };
    const wovenHem = derivedOutputs("woven-shirt", { ...wovenBase, hemTurn: wovenBase.hemTurn + 0.2 });
    expect(wovenHem).toEqual(derivedOutputs("woven-shirt", wovenBase));

    const tankBaseOptions = defaultOptions("tank");
    const tankBase = derivedOutputs("tank", tankBaseOptions);
    const widerShoulders = { ...STANDARD_M, shoulderWidth: STANDARD_M.shoulderWidth + 1 };
    const tankWide = derivedOutputs("tank", tankBaseOptions, widerShoulders);
    expect(tankWide.pattern).toEqual(tankBase.pattern);
    expect(tankWide.pomSpec).toEqual(tankBase.pomSpec);
    expect(tankWide.grade.map((size) => size.measurements)).not.toEqual(tankBase.grade.map((size) => size.measurements));
    expect(tankWide.grade.map((size) => size.block)).toEqual(tankBase.grade.map((size) => size.block));
    expect(tankWide.nesting).toEqual(tankBase.nesting);
    expect(tankWide.exports).toEqual(tankBase.exports);
  });

  it("distinguishes mark-only woven-shirt edits from cut geometry and measures button spacing", () => {
    const recipe = WOVEN_SHIRT_RECIPE;
    const baseOptions = { ...DEFAULT_WOVEN_SHIRT_OPTIONS };
    const buttonCountOptions = { ...baseOptions, buttonCount: 6 };
    const spacingOptions = { ...baseOptions, buttonSpacing: 8.5 };
    const baseBlock = recipe.draft(STANDARD_M, baseOptions);
    const countBlock = recipe.draft(STANDARD_M, buttonCountOptions);
    const spacingBlock = recipe.draft(STANDARD_M, spacingOptions);
    const cutShapes = (block: typeof baseBlock) => blockPieces(block).map((piece) => flattenPiece(piece, recipe.allowances));

    expect(JSON.stringify(countBlock)).not.toBe(JSON.stringify(baseBlock));
    expect(JSON.stringify(cutShapes(countBlock))).toBe(JSON.stringify(cutShapes(baseBlock)));
    expect(JSON.stringify(spacingBlock)).not.toBe(JSON.stringify(baseBlock));
    expect(JSON.stringify(cutShapes(spacingBlock))).toBe(JSON.stringify(cutShapes(baseBlock)));
    const baseSpec = specSheet(gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, baseOptions), recipe.poms);
    const spacingSpec = specSheet(gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, spacingOptions), recipe.poms);
    expect(spacingSpec.find((row) => row.label === "Front button spacing")!.values)
      .not.toEqual(baseSpec.find((row) => row.label === "Front button spacing")!.values);
    const buttonCountDependency = getFieldArtifactDependency("woven-shirt", "option", "buttonCount")!;
    const buttonSpacingDependency = getFieldArtifactDependency("woven-shirt", "option", "buttonSpacing")!;
    expect(buttonCountDependency.affected.map((artifact) => artifact.id)).not.toContain("pom-spec");
    expect(buttonCountDependency.unaffected.map((artifact) => artifact.id)).toContain("pom-spec");
    expect(buttonSpacingDependency.affected.map((artifact) => artifact.id)).toContain("pom-spec");
    expect(derivedOutputs("woven-shirt", buttonCountOptions).pomSpec).toEqual(derivedOutputs("woven-shirt", baseOptions).pomSpec);
    expect(derivedOutputs("woven-shirt", buttonCountOptions).nesting).toEqual(derivedOutputs("woven-shirt", baseOptions).nesting);
    expect(derivedOutputs("woven-shirt", spacingOptions).nesting).toEqual(derivedOutputs("woven-shirt", baseOptions).nesting);
    expect(derivedOutputs("woven-shirt", buttonCountOptions).exports).not.toEqual(derivedOutputs("woven-shirt", baseOptions).exports);
    expect(derivedOutputs("woven-shirt", spacingOptions).exports).not.toEqual(derivedOutputs("woven-shirt", baseOptions).exports);
  });

  it("lists only stable artifact groups and reports unsupported semantic propagation plainly", () => {
    expect(FIELD_DEPENDENT_ARTIFACTS.map((artifact) => artifact.id)).toEqual([
      "pattern", "pom-spec", "grade-run", "nesting", "views", "garment-exports",
    ]);
    expect(FIELD_INDEPENDENT_ARTIFACTS.map((artifact) => artifact.id)).toEqual(["surface-sheet-svg"]);
    expect(getFieldArtifactDependency("tee", "measurement", "not-a-field")).toBeUndefined();
    expect(getRecipeFieldArtifactMatrix("not-a-recipe")).toEqual([]);

    const chest = getFieldArtifactDependency("tee", "measurement", "chest")!;
    expect(describeFieldArtifactImpact(chest)).toContain("pattern pieces");
    expect(describeFieldArtifactImpact(chest)).toContain("surface-art sheet SVG");
    expect(describeFieldArtifactImpact(chest)).toContain("The open view updates now");

    const hemTurn = getFieldArtifactDependency("woven-shirt", "option", "hemTurn")!;
    const message = describeFieldArtifactImpact(hemTurn);
    expect(message).toContain("Not represented in current outputs");
    expect(message).toContain("They omit this input until the propagation gap is fixed.");
    expect(message).toContain("does not establish fit or production readiness");

    const tankShoulder = getFieldArtifactDependency("tank", "measurement", "shoulderWidth")!;
    expect(describeFieldArtifactImpact(tankShoulder)).toContain("body/assembled illustration and shoulder-width guidance/check status");
  });
});
