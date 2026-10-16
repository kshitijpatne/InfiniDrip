import { describe, expect, it } from "vitest";
import type { GarmentRecipe } from "../drafting/recipe";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { validateTechnicalFlatOptions } from "./technical-flat-options";

const revisionId = "style-revision-17";

describe("technical-flat option and topology validation", () => {
  it("drafts and validates default values and every declared option endpoint for both faces", () => {
    for (const recipe of GARMENTS) {
      const defaults = validateTechnicalFlatOptions(recipe, STANDARD_M, undefined, revisionId);
      expect(defaults.issues, recipe.name).toEqual([]);
      expect(defaults.options).toEqual(defaultGarmentOptions(recipe.options ?? []));
      expect(defaults.faces?.map((face) => face.kind)).toEqual(["FRONT_FLAT", "BACK_FLAT"]);

      for (const definition of recipe.options ?? []) {
        for (const value of [definition.min, definition.max]) {
          const result = validateTechnicalFlatOptions(recipe, STANDARD_M, { [definition.id]: value }, revisionId);
          expect(result.issues, `${recipe.name}.${definition.id}=${value}`).toEqual([]);
          expect(result.options?.[definition.id]).toBe(value);
          expect(result.faces).toHaveLength(2);
        }
      }
    }
  });

  it("keeps an unset optional Tee control absent while validating explicit values", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const inherited = validateTechnicalFlatOptions(recipe, STANDARD_M, undefined, revisionId);
    expect(inherited.issues).toEqual([]);
    expect(inherited.options).not.toHaveProperty("chestEase");

    const explicit = validateTechnicalFlatOptions(recipe, STANDARD_M, { chestEase: 8 }, revisionId);
    expect(explicit.issues).toEqual([]);
    expect(explicit.options).toMatchObject({ chestEase: 8 });

    const invalid = validateTechnicalFlatOptions(recipe, STANDARD_M, { chestEase: 6.5 }, revisionId);
    expect(invalid.options).toBeNull();
    expect(invalid.issues).toContainEqual(expect.objectContaining({
      code: "OPTION_OUT_OF_RANGE", optionId: "chestEase",
    }));
  });

  it("returns field-specific actionable issues without drafting invalid supplied values", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt");
    if (!recipe) throw new Error("Woven shirt recipe is missing.");
    const invalid = validateTechnicalFlatOptions(recipe, STANDARD_M, {
      unknownControl: 1,
      buttonCount: 6.5,
      pocketWidth: 999,
      pocketHeight: Number.NaN,
    }, revisionId);
    expect(invalid.faces).toBeNull();
    expect(invalid.options).toBeNull();
    expect(invalid.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "UNKNOWN_OPTION", optionId: "unknownControl" }),
      expect.objectContaining({ code: "OPTION_OFF_STEP", optionId: "buttonCount" }),
      expect.objectContaining({ code: "OPTION_OUT_OF_RANGE", optionId: "pocketWidth" }),
      expect.objectContaining({ code: "INVALID_OPTION_VALUE", optionId: "pocketHeight" }),
    ]));
  });

  it("rejects malformed option containers and revisions", () => {
    const recipe = GARMENTS[0];
    expect(validateTechnicalFlatOptions(recipe, STANDARD_M, null, revisionId).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_OPTIONS_OBJECT" }));
    expect(validateTechnicalFlatOptions(recipe, STANDARD_M, [], revisionId).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_OPTIONS_OBJECT" }));
    expect(validateTechnicalFlatOptions(recipe, STANDARD_M, {}, " ").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_REVISION_ID" }));
  });

  it("reports unitless option guidance without placeholders", () => {
    const baseRecipe = GARMENTS[0];
    const recipe = { ...baseRecipe, options: [{ id: "shape", label: "Shape", defaultValue: 1, min: 0, max: 2, step: 1 }] } as GarmentRecipe;
    const results = [
      validateTechnicalFlatOptions(recipe, STANDARD_M, { shape: Number.NaN }, revisionId),
      validateTechnicalFlatOptions(recipe, STANDARD_M, { shape: 3 }, revisionId),
      validateTechnicalFlatOptions(recipe, STANDARD_M, { shape: 0.5 }, revisionId),
    ];
    expect(results.map((result) => result.issues[0].code)).toEqual([
      "INVALID_OPTION_VALUE", "OPTION_OUT_OF_RANGE", "OPTION_OFF_STEP",
    ]);
    expect(results.flatMap((result) => result.issues).every((issue) => !issue.message.includes("undefined"))).toBe(true);
  });

  it("does not let resolver fallbacks hide a failed draft or mismatched topology", () => {
    const baseRecipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!baseRecipe) throw new Error("Tee recipe is missing.");
    const throwingRecipe = { ...baseRecipe, draft: () => { throw new RangeError("invalid combination"); } } as unknown as GarmentRecipe;
    expect(validateTechnicalFlatOptions(throwingRecipe, STANDARD_M, {}, revisionId).issues)
      .toContainEqual(expect.objectContaining({ code: "DRAFT_FAILED", message: expect.stringContaining("invalid combination") }));
    const nonErrorRecipe = { ...baseRecipe, draft: () => { throw "rejected pattern"; } } as unknown as GarmentRecipe;
    expect(validateTechnicalFlatOptions(nonErrorRecipe, STANDARD_M, {}, revisionId).issues)
      .toContainEqual(expect.objectContaining({ code: "DRAFT_FAILED", message: expect.stringContaining("The recipe rejected") }));

    const block = baseRecipe.draft(STANDARD_M, defaultGarmentOptions(baseRecipe.options ?? []));
    const malformedRecipe = { ...baseRecipe, draft: () => ({ ...block, roles: { back: block.roles.back, sleeve: block.roles.sleeve } }) } as unknown as GarmentRecipe;
    const mismatch = validateTechnicalFlatOptions(malformedRecipe, STANDARD_M, {}, revisionId);
    expect(mismatch.faces).toBeNull();
    expect(mismatch.issues).toContainEqual(expect.objectContaining({ code: "MISSING_MAPPED_ROLE", sourceId: "front" }));

    const invalidBack = { ...block, roles: { ...block.roles,
      back: { ...block.roles.back, edges: [{ ...block.roles.back.edges[0], kind: "line", end: { x: Number.NaN, y: 0 } }, ...block.roles.back.edges.slice(1)] },
    } };
    const invalidGeometryRecipe = { ...baseRecipe, draft: () => invalidBack } as unknown as GarmentRecipe;
    const invalidGeometry = validateTechnicalFlatOptions(invalidGeometryRecipe, STANDARD_M, {}, revisionId);
    expect(invalidGeometry.faces).toBeNull();
    expect(invalidGeometry.issues).toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE" }));
  });

  it("returns actual combined-option geometry without changing declared values", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt");
    if (!recipe) throw new Error("Woven shirt recipe is missing.");
    const options = {
      ...defaultGarmentOptions(recipe.options ?? []),
      buttonCount: 6, buttonSpacing: 6, frontOverlap: 2, placketWidth: 4,
      standHeight: 3, collarLeafDepth: 7, pocketWidth: 14, pocketHeight: 15,
    };
    const result = validateTechnicalFlatOptions(recipe, STANDARD_M, options, revisionId);
    expect(result.issues).toEqual([]);
    expect(result.options).toEqual(options);
    expect(result.faces?.[0].primitives.length).toBeGreaterThan(0);
    expect(result.faces?.[1].primitives.length).toBeGreaterThan(0);
  });
});
