import { blockPieces, defaultGarmentOptions, GARMENTS, STANDARD_M } from "../drafting";
import { PATTERN_MEASUREMENT_MAP, patternMeasurementDefinition } from "./pattern-measurements";
import { describe, expect, it } from "vitest";

describe("pattern block measurement inventory", () => {
  it("covers every default pattern piece exactly once with real recipe fields", () => {
    let totalPieces = 0;
    let optionOnlyPieces = 0;
    for (const recipe of GARMENTS) {
      const pieces = blockPieces(recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? [])));
      const pieceNames = pieces.map((piece) => piece.name.toLowerCase());
      expect(new Set(pieceNames).size).toBe(pieceNames.length);
      expect(Object.keys(PATTERN_MEASUREMENT_MAP[recipe.name] ?? {}).sort()).toEqual([...pieceNames].sort());
      for (const piece of pieces) {
        const definition = patternMeasurementDefinition(recipe.name, piece.name);
        expect(definition).toBeDefined();
        definition!.fields.forEach((field) => expect(recipe.fields).toContain(field));
        if (definition!.fields.length === 0) {
          optionOnlyPieces += 1;
          expect(definition!.noMeasurementReason?.trim()).not.toBe("");
        } else {
          expect(definition!.noMeasurementReason).toBeUndefined();
        }
        totalPieces += 1;
      }
    }
    expect(totalPieces).toBe(40);
    expect(optionOnlyPieces).toBe(4);
  });

  it("normalizes piece-name case but does not mistake an unknown block for an intentional no-link", () => {
    expect(patternMeasurementDefinition("tee", "FRONT")).toEqual(
      patternMeasurementDefinition("tee", "front"),
    );
    expect(patternMeasurementDefinition("tee", "unlisted piece")).toBeUndefined();
    expect(patternMeasurementDefinition("unlisted garment", "front")).toBeUndefined();
  });
});
