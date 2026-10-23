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
    expect(totalPieces).toBe(101);
    expect(optionOnlyPieces).toBe(17);
    expect(PATTERN_MEASUREMENT_MAP.shorts).not.toHaveProperty("knee");
  });


  it("maps newly activated pieces only to fields that change their default geometry", () => {
    expect(PATTERN_MEASUREMENT_MAP.crewneck).toEqual({
      front: { fields: ["chest", "shoulderWidth", "length", "armholeDepth", "ease", "neckDrop", "neckWidthEase"] },
      back: { fields: ["chest", "shoulderWidth", "length", "armholeDepth", "ease", "neckWidthEase"] },
      "left crewneck set-in sleeve": { fields: ["chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease"] },
      "right crewneck set-in sleeve": { fields: ["chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease"] },
      "crewneck rib neckband": { fields: [], noMeasurementReason: "This band is sized by the neckbandLength and neckbandDepth options, not body measurements." },
      "left crewneck rib cuff": { fields: [], noMeasurementReason: "This band is sized by the cuffLength and cuffDepth options, not body measurements." },
      "right crewneck rib cuff": { fields: [], noMeasurementReason: "This band is sized by the cuffLength and cuffDepth options, not body measurements." },
      "crewneck rib hem band": { fields: [], noMeasurementReason: "This band is sized by the hemBandLength and hemBandDepth options, not body measurements." },
    });
    expect(PATTERN_MEASUREMENT_MAP.jogger).toEqual({
      "jogger front left": { fields: ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"] },
      "jogger front right": { fields: ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"] },
      "jogger back left": { fields: ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"] },
      "jogger back right": { fields: ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"] },
      "jogger waistband casing": { fields: ["waist", "ease"] },
      "jogger pocket bag left": { fields: ["waist", "ease"] },
      "jogger pocket bag right": { fields: ["waist", "ease"] },
    });
    expect(PATTERN_MEASUREMENT_MAP.hoodie).toEqual({
      front: { fields: ["chest", "shoulderWidth", "length", "armholeDepth", "ease"] },
      back: { fields: ["chest", "shoulderWidth", "length", "armholeDepth", "ease"] },
      "left hoodie set-in sleeve": { fields: ["chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease"] },
      "right hoodie set-in sleeve": { fields: ["chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease"] },
      "hoodie left outer hood side": { fields: ["chest"] },
      "hoodie right outer hood side": { fields: ["chest"] },
      "hoodie left lining hood side": { fields: ["chest"] },
      "hoodie right lining hood side": { fields: ["chest"] },
      "hoodie kangaroo pouch": { fields: ["length"] },
      "left hoodie rib cuff": { fields: [], noMeasurementReason: "This band is sized by the cuffLength and cuffDepth options, not body measurements." },
      "right hoodie rib cuff": { fields: [], noMeasurementReason: "This band is sized by the cuffLength and cuffDepth options, not body measurements." },
      "hoodie rib hem band": { fields: [], noMeasurementReason: "This band is sized by the hemBandLength and hemBandDepth options, not body measurements." },
    });
  });

  it("normalizes piece-name case but does not mistake an unknown block for an intentional no-link", () => {
    expect(patternMeasurementDefinition("tee", "FRONT")).toEqual(
      patternMeasurementDefinition("tee", "front"),
    );
    expect(patternMeasurementDefinition("tee", "unlisted piece")).toBeUndefined();
    expect(patternMeasurementDefinition("unlisted garment", "front")).toBeUndefined();
  });
});
