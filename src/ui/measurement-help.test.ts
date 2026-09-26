import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import { getFieldDefinitions } from "./field-provenance";
import { MEASUREMENT_HELP, measurementHelpFor } from "./measurement-help";

const ALLOWED_SOURCE_IDS = new Set([
  "C03",
  "CODE",
  "S06",
  "S07",
  "S08",
  "S09",
  "S10",
  "S11",
  "S13",
  "S14",
]);

/** Prescriptive measuring-step fragments that must never appear in help body text. */
const FORBIDDEN_PROCEDURE_FRAGMENTS = [
  "place the tape",
  "wrap the tape",
  "run the tape",
  "keep the tape",
  "parallel to the floor",
  "horizontal plane",
  "stand straight",
  "sit upright",
  "breathe",
  "exhal",
  "mirror",
  "palpate",
  "midaxillary",
  "hug position",
  "crossed arms",
  "get a helper",
  "ask someone",
  "wear tight",
  "undergarment",
  "non-stretch",
  "measure around",
  "measure from",
  "measure at",
  "plus 1 inch",
  "should fit",
  "will fit",
  "ensures fit",
  "guarantees fit",
  "proves fit",
  "fit is validated",
  "follow these steps",
  "take the average",
  "average your",
  "round to the",
  "you should measure",
  "you must measure",
];

/** Positive validation claims that must never appear; negated withholding is required instead. */
const FORBIDDEN_POSITIVE_CLAIMS = [
  "ensures fit",
  "guarantees fit",
  "proves fit",
  "validates fit",
  "fit is validated",
  "fit has been validated",
  "qualified to measure",
  "industry target is",
  "meets the standard",
];

function bodyTextOf(recipeId: string, fieldId: string): string {
  const entry = measurementHelpFor(recipeId, fieldId);
  if (!entry) throw new Error(`Missing help for ${recipeId} ${fieldId}`);
  return `${entry.meaning} ${entry.draftUse} ${entry.limits} ${entry.guardrailNote} ${entry.qualificationNote}`.toLowerCase();
}

describe("measurement help catalog", () => {
  it("covers every field definition of all seven recipes exactly once", () => {
    expect(GARMENTS).toHaveLength(7);
    expect(Object.keys(MEASUREMENT_HELP).sort()).toEqual(GARMENTS.map((recipe) => recipe.name).sort());
    for (const recipe of GARMENTS) {
      const definitions = getFieldDefinitions(recipe.name);
      expect(definitions.length).toBeGreaterThan(0);
      const byField = MEASUREMENT_HELP[recipe.name];
      expect(Object.keys(byField!).sort()).toEqual(definitions.map((definition) => definition.id).sort());
      for (const definition of definitions) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry).toBeDefined();
        expect(entry.recipeId).toBe(recipe.name);
        expect(entry.fieldId).toBe(definition.id);
        expect(entry.inputKey).toBe(definition.inputKey);
        expect(entry.inputKind).toBe(definition.inputKind);
        expect(entry.label).toBe(definition.label);
        expect(entry.meaning).toBe(definition.meaning);
        expect(entry.referenceFrame).toBe(definition.referenceFrame);
        expect(entry.semanticKind).toBe(definition.semanticKind);
        expect(entry.guardrailNote).toContain(`${definition.min}–${definition.max} ${definition.unit}`);
        expect(entry.guardrailNote.toLowerCase()).toContain("not an industry standard");
      }
    }
  });

  it("returns stable entries and explicit null for unknown or stale IDs", () => {
    const first = measurementHelpFor("tee", "body.chest-girth");
    const second = measurementHelpFor("tee", "body.chest-girth");
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(measurementHelpFor("unknown-recipe", "body.chest-girth")).toBeNull();
    expect(measurementHelpFor("tee", "unknown-field")).toBeNull();
    expect(measurementHelpFor("tee", "")).toBeNull();
    expect(measurementHelpFor("", "body.chest-girth")).toBeNull();
    // Stale: a trouser-only target is not part of the tee route.
    expect(measurementHelpFor("tee", "target.finished-thigh-girth")).toBeNull();
    // Stale: a woven-only body input is not part of the skirt route.
    expect(measurementHelpFor("skirt", "body.neck-base-girth")).toBeNull();
    // Unknown recipe never throws and stays null on repeat.
    expect(measurementHelpFor("nope", "nope")).toBeNull();
    expect(measurementHelpFor("nope", "nope")).toBeNull();
  });

  it("marks every technique as unqualified with explicit withholding copy", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.techniqueQualified).toBe(false);
        expect(entry.qualificationNote).toContain("No accepted fit-qualified capture procedure exists");
        expect(entry.qualificationNote).toContain("gives no measuring steps");
        expect(entry.qualificationNote).toContain("claims no fit");
        expect(entry.limits).toContain("NOT_ASSESSED");
        expect(entry.limits.length).toBeGreaterThan(definition.captureBoundary.length);
        expect(entry.draftUse.length).toBeGreaterThan(20);
      }
    }
  });

  it("cites only directly supporting sources with a fit-disclaiming scope", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.sources.length).toBeGreaterThanOrEqual(3);
        for (const source of entry.sources) {
          expect(ALLOWED_SOURCE_IDS.has(source.id)).toBe(true);
          expect(source.scope.toLowerCase()).toContain("does not validate");
        }
      }
    }
    // Waist disagreement is evidenced by two distinct sites, not one authoritative path.
    const trouserWaist = measurementHelpFor("trouser", "body.girth-at-wear-line")!;
    expect(trouserWaist.sources.map((source) => source.id)).toContain("S06");
    expect(trouserWaist.sources.map((source) => source.id)).toContain("S08");
    expect(trouserWaist.limits.toLowerCase()).toContain("not interchangeable");
    // Tank shoulder input is disclosed as not consumed by its pattern block.
    const tankShoulder = measurementHelpFor("tank", "body.shoulder-breadth")!;
    expect(tankShoulder.draftUse.toLowerCase()).toContain("does not read this value");
    expect(tankShoulder.draftUse.toLowerCase()).toContain("follows the strap point");
    // Skirt guided range keeps the Maxi contradiction visible without clamping.
    const skirtLength = measurementHelpFor("skirt", "target.skirt-waistline-to-hem")!;
    expect(skirtLength.guardrailNote).toContain("40–100 cm");
    expect(skirtLength.limits.toLowerCase()).toContain("100 to 120");
    expect(skirtLength.limits.toLowerCase()).toContain("no automatic changes");
    // Sleeve and trouser stations preserve the Slice 245 executed dispositions.
    expect(measurementHelpFor("tee", "target.sleeve-cap-to-hem")!.draftUse).toContain("23.79");
    expect(measurementHelpFor("trouser", "target.finished-thigh-girth")!.draftUse).toContain("33 summed one-leg");
    expect(measurementHelpFor("trouser", "target.trouser-finished-inseam")!.draftUse).toContain("78.42");
    expect(measurementHelpFor("woven-shirt", "body.neck-base-girth")!.draftUse).toContain("51.55");
    expect(measurementHelpFor("woven-shirt", "target.top-hps-to-hem")!.limits)
      .toContain("blocks continuation when the hip station falls below the hem");
  });

  it("contains no invented procedure, ease, target, or fit-validation copy", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const text = bodyTextOf(recipe.name, definition.id);
        for (const fragment of FORBIDDEN_PROCEDURE_FRAGMENTS) {
          expect(text).not.toContain(fragment);
        }
        for (const claim of FORBIDDEN_POSITIVE_CLAIMS) {
          expect(text).not.toContain(claim);
        }
        // Concise novice copy: no dossier dump in any single entry.
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.meaning.length).toBeLessThan(300);
        expect(entry.draftUse.length).toBeLessThan(600);
        expect(entry.limits.length).toBeLessThan(600);
        expect(entry.guardrailNote.length).toBeLessThan(300);
      }
    }
  });

  it("exposes an immutable lookup", () => {
    expect(Object.isFrozen(MEASUREMENT_HELP)).toBe(true);
    for (const recipe of GARMENTS) {
      const byField = MEASUREMENT_HELP[recipe.name]!;
      expect(Object.isFrozen(byField)).toBe(true);
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = byField[definition.id]!;
        expect(Object.isFrozen(entry)).toBe(true);
        expect(Object.isFrozen(entry.sources)).toBe(true);
      }
    }
  });
});
