import { describe, expect, it } from "vitest";
import { STANDARD_M, GARMENTS, gradeRun } from "../drafting";
import optionMatrix from "../../docs/research/epic17/S330-integrated-browser/matrix.json";
import {
  createDxfInterchangePackage,
  verifyDxfInterchangePackage,
} from "./dxf-interchange-package";

describe("C04-bounded DXF interchange package", () => {
  it("binds every registered recipe and grade row to an exact DXF and seam graph", async () => {
    for (const recipe of GARMENTS) {
      const run = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft);
      expect(run).toHaveLength(recipe.sizes.length);
      for (const graded of run) {
        const candidate = await createDxfInterchangePackage(recipe, graded);
        expect(candidate.manifest.recipe.id).toBe(recipe.name);
        expect(candidate.manifest.grade.selectedSize).toEqual({ label: graded.label, step: graded.step });
        expect(candidate.manifest.grade.sizeRun).toEqual(recipe.sizes);
        expect(candidate.manifest.units).toEqual({ length: "cm", dxfInsunits: 5 });
        expect(candidate.manifest.pieces.map((piece) => piece.role)).toEqual(Object.keys(graded.block.roles));
        expect(candidate.manifest.stitches).toEqual(graded.block.stitches);
        expect(candidate.manifest.drawingSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(candidate.manifest.revisionId).toMatch(/^[0-9a-f]{64}$/);
        expect(candidate.dxf).toContain("9\n$INSUNITS\n70\n5\n");
        expect(candidate.dxf).toContain("MARK_GRAINLINE");
        expect(candidate.dxf).toContain("MARK_NOTCH");
        expect(await verifyDxfInterchangePackage(candidate)).toBe(true);
      }
    }
  });

  it("uses canonical option-key ordering and changes package revision when option data changes", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = Object.fromEntries((recipe.options ?? []).slice(0, 2).map((option) => [option.id, option.defaultValue]));
    const reversedOptions = Object.fromEntries(Object.entries(options).reverse());
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options)[2];
    const first = await createDxfInterchangePackage(recipe, graded, options);
    const reordered = await createDxfInterchangePackage(recipe, graded, reversedOptions);
    const firstDefinition = recipe.options![0]!;
    const changedOptions = { ...options, [firstDefinition.id]: firstDefinition.defaultValue + firstDefinition.step };
    const changedGraded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, changedOptions)[2];
    const changed = await createDxfInterchangePackage(recipe, changedGraded, changedOptions);

    expect(first.dxf).toBe(reordered.dxf);
    expect(first.manifest.revisionId).toBe(reordered.manifest.revisionId);
    expect(first.manifest.revisionId).not.toBe(changed.manifest.revisionId);
  });

  it("records every canonical S330 option configuration with fully resolved values", async () => {
    expect(optionMatrix.cases).toHaveLength(73);
    for (const testCase of optionMatrix.cases) {
      const recipe = GARMENTS.find((candidate) => candidate.name === testCase.recipeId)!;
      const options: Record<string, number> = {};
      Object.assign(options, testCase.options ?? {});
      Object.assign(options, testCase.optionValues ?? {});
      const resolvedOptions = Object.fromEntries((recipe.options ?? []).map((definition) => [
        definition.id,
        options[definition.id] ?? definition.defaultValue,
      ]));
      const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, resolvedOptions)[2];
      let candidate;
      try {
        candidate = await createDxfInterchangePackage(recipe, graded, options);
      } catch (error) {
        throw new Error(`${testCase.caseId}: ${error instanceof Error ? error.message : String(error)}`);
      }
      expect(candidate.manifest.options).toEqual(resolvedOptions);
      expect(await verifyDxfInterchangePackage(candidate)).toBe(true);
    }
  });

  it("materializes recipe defaults and rejects invalid or unsupported options", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const definitions = recipe.options ?? [];
    const fullDefaults = Object.fromEntries(definitions.map((definition) => [definition.id, definition.defaultValue]));
    const defaultGraded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2];
    const implicit = await createDxfInterchangePackage(recipe, defaultGraded);
    const explicit = await createDxfInterchangePackage(recipe, defaultGraded, fullDefaults);
    expect(implicit.manifest.options).toEqual(fullDefaults);
    expect(implicit.manifest.revisionId).toBe(explicit.manifest.revisionId);

    const option = definitions[0]!;
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { unsupported: 1 }))
      .rejects.toThrow('Unsupported polo option "unsupported"');
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: Number.NaN }))
      .rejects.toThrow(`polo option "${option.id}" must be a finite number`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: option.max + option.step }))
      .rejects.toThrow(`polo option "${option.id}" must be between ${option.min} and ${option.max}`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: option.min + option.step / 2 }))
      .rejects.toThrow(`polo option "${option.id}" must match its ${option.step} step`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, null as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage(recipe, defaultGraded, [] as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage(recipe, defaultGraded, "invalid" as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage({
      ...recipe,
      options: [{ ...option, step: 0 }],
    }, defaultGraded))
      .rejects.toThrow(`polo option "${option.id}" must match its 0 step`);
  });

  it("rejects a block drafted from a different option set", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = Object.fromEntries((recipe.options ?? []).slice(0, 2).map((option) => [option.id, option.defaultValue]));
    const otherOptions = { ...options, [Object.keys(options)[0]]: Object.values(options)[0] + 0.1 };
    const gradedWithOtherOptions = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, otherOptions)[2];

    await expect(createDxfInterchangePackage(recipe, gradedWithOtherOptions, options))
      .rejects.toThrow("Selected pattern block does not match the recipe, size and options");
  });

  it("rejects a size label or step that does not match the recipe grade table", async () => {
    const recipe = GARMENTS[0];
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[0];

    await expect(createDxfInterchangePackage(recipe, { ...graded, step: graded.step + 1 }))
      .rejects.toThrow(`Selected size "${graded.label}" does not match the recipe's grade table`);
    await expect(createDxfInterchangePackage(recipe, { ...graded, label: "Unknown" }))
      .rejects.toThrow('Selected size "Unknown" does not match the recipe\'s grade table');
  });

  it("rejects DXF, manifest, schema and malformed package tampering", async () => {
    const recipe = GARMENTS[0];
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2];
    const candidate = await createDxfInterchangePackage(recipe, graded);

    expect(await verifyDxfInterchangePackage({ ...candidate, dxf: `${candidate.dxf}0\nEOF\n` })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      dxf: candidate.dxf.replace("9\n$INSUNITS\n70\n5\n", ""),
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, pieces: [] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, units: { length: "in", dxfInsunits: 1 } },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, schemaVersion: "unsupported" },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, unsupported: () => "not JSON" },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, unsupported: null },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage(null)).toBe(false);
    expect(await verifyDxfInterchangePackage("not a package")).toBe(false);
    expect(await verifyDxfInterchangePackage({ dxf: 42, manifest: {} })).toBe(false);
    expect(await verifyDxfInterchangePackage({ dxf: "", manifest: null })).toBe(false);
  });
});
