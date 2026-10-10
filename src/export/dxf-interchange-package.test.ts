import { describe, expect, it } from "vitest";
import { STANDARD_M, GARMENTS, gradeRun } from "../drafting";
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
    const changedOptions = { ...options, [Object.keys(options)[0]]: Object.values(options)[0] + 0.1 };
    const changedGraded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, changedOptions)[2];
    const changed = await createDxfInterchangePackage(recipe, changedGraded, changedOptions);

    expect(first.dxf).toBe(reordered.dxf);
    expect(first.manifest.revisionId).toBe(reordered.manifest.revisionId);
    expect(first.manifest.revisionId).not.toBe(changed.manifest.revisionId);
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
      manifest: { ...candidate.manifest, pieces: [] },
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
