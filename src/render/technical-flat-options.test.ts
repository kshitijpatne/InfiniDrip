import { describe, expect, it } from "vitest";
import type { GarmentRecipe } from "../drafting/recipe";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { validateTechnicalFlatOptions } from "./technical-flat-options";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";

const revisionId = "style-revision-17";
const G04_RECIPES = GARMENTS.filter((recipe) => G04_TECHNICAL_FLAT_MAPPINGS[recipe.name] !== undefined);

describe("technical-flat option and topology validation", () => {
  it("drafts and validates default values and every declared option endpoint for both faces", () => {
    for (const recipe of G04_RECIPES) {
      const defaults = validateTechnicalFlatOptions(recipe, STANDARD_M, undefined, revisionId);
      expect(defaults.issues, recipe.name).toEqual([]);
      expect(defaults.options).toEqual(defaultGarmentOptions(recipe.options ?? []));
      expect(defaults.faces?.map((face) => face.kind)).toEqual(["FRONT_FLAT", "BACK_FLAT"]);

      for (const definition of recipe.options ?? []) {
        if (definition.appliesToStarterEntryId !== undefined) continue;
        for (const value of [definition.min, definition.max]) {
          const result = validateTechnicalFlatOptions(recipe, STANDARD_M, { [definition.id]: value }, revisionId);
          expect(result.issues, `${recipe.name}.${definition.id}=${value}`).toEqual([]);
          expect(result.options?.[definition.id]).toBe(value);
          expect(result.faces).toHaveLength(2);
        }
      }
    }
  });

  it("activates F02-only waist-dart controls only for the matching starter origin", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted");
    if (!recipe) throw new Error("Fitted recipe is missing.");
    const starterEntryId = "fitted-waist-dart-tee-digital-v1";

    const generic = validateTechnicalFlatOptions(recipe, STANDARD_M, undefined, revisionId);
    expect(generic.issues).toEqual([]);
    expect(generic.options).not.toHaveProperty("waistDartIntake");
    expect(generic.faces).toHaveLength(2);

    const unscoped = validateTechnicalFlatOptions(recipe, STANDARD_M, { waistDartIntake: 2 }, revisionId);
    expect(unscoped.options).toBeNull();
    expect(unscoped.issues).toContainEqual(expect.objectContaining({
      code: "UNKNOWN_OPTION", optionId: "waistDartIntake", message: expect.stringContaining("option set"),
    }));

    const options = defaultGarmentOptions(recipe.options ?? [], starterEntryId);
    expect(options).toMatchObject({
      waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45,
    });
    const active = validateTechnicalFlatOptions(recipe, STANDARD_M, options, revisionId, starterEntryId);
    expect(active.issues).toEqual([]);
    expect(active.options).toEqual(options);
    expect(active.faces).toHaveLength(2);

    for (const definition of recipe.options!.filter((candidate) =>
      candidate.appliesToStarterEntryId === starterEntryId)) {
      for (const value of [definition.min, definition.max]) {
        const result = validateTechnicalFlatOptions(recipe, STANDARD_M,
          { ...options, [definition.id]: value }, revisionId, starterEntryId);
        expect(result.issues, `${definition.id}=${value}`).toEqual([]);
        expect(result.options?.[definition.id]).toBe(value);
      }
    }
  });

  it("keeps the F03 princess-seam profile free of inactive bust-dart options", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted");
    if (!recipe) throw new Error("Fitted recipe is missing.");
    const starterEntryId = "fitted-princess-tee-digital-v1";
    const options = defaultGarmentOptions(recipe.options ?? [], starterEntryId);
    expect(options).toMatchObject({ princessSeamShaping: 2, princessApexHorizontal: 55,
      princessApexVertical: 28, princessShoulderOrigin: 60 });
    expect(options).not.toHaveProperty("dartIntake");
    expect(options).not.toHaveProperty("bustApexHorizontal");
    expect(options).not.toHaveProperty("bustApexVertical");

    const active = validateTechnicalFlatOptions(recipe, STANDARD_M, options, revisionId, starterEntryId);
    expect(active.issues).toEqual([]);
    expect(active.options).toEqual(options);
    expect(active.faces).toHaveLength(2);

    const leaked = validateTechnicalFlatOptions(recipe, STANDARD_M, { ...options, dartIntake: 4 }, revisionId, starterEntryId);
    expect(leaked.options).toBeNull();
    expect(leaked.issues).toContainEqual(expect.objectContaining({
      code: "UNKNOWN_OPTION", optionId: "dartIntake", message: expect.stringContaining("not part of this starter's option set"),
    }));
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

  it("keeps Jeans fail-closed until a G04 technical-flat map is admitted", () => {
    const jeans = GARMENTS.find((recipe) => recipe.name === "jeans")!;
    const result = validateTechnicalFlatOptions(jeans, STANDARD_M, undefined, revisionId);
    expect(G04_TECHNICAL_FLAT_MAPPINGS.jeans).toBeUndefined();
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_RECIPE" }));
    expect(result.faces).toBeNull();
  });
});
