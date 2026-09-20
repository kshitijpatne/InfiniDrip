import { describe, it, expect } from "vitest";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "../surface/placement";
import { EMPTY_BOOK, surfaceAdd } from "../surface/store";
import { surfaceErrorField, surfaceGuidance } from "./surface-notes";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "chest-print",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 25,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "",
  ...overrides,
});

describe("surfaceErrorField", () => {
  it("targets the failing control when the error names one", () => {
    expect(surfaceErrorField("Placement widthCm: enter a number above 0.", 2))
      .toBe("surface-2-widthCm");
    expect(surfaceErrorField("Transform dx: enter a finite number.", 0))
      .toBe("surface-0-dx");
    expect(surfaceErrorField("Placement kind: choose print, patch, or color-block.", 1))
      .toBe("surface-1-kind");
  });
  it("falls back to the row when no aspect is named", () => {
    expect(surfaceErrorField("Placement must be an object.", 3)).toBe("surface-3");
  });
});

describe("surfaceGuidance", () => {
  it("reports nothing for valid or unknown sets", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceGuidance(book, "tee/A", "A")).toEqual([]);
    expect(surfaceGuidance(EMPTY_BOOK, "missing", "A")).toEqual([]);
  });
  it("warns per invalid placement with its actionable correction", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({ widthCm: 0 }));
    expect(surfaceGuidance(book, "tee/A", "A")).toEqual([{
      level: "warn",
      field: "surface-0-widthCm",
      text: "Artwork 'chest-print' on A: Placement widthCm: enter a number above 0.",
    }]);
  });
  it("keeps stored order across several failures", () => {
    const key = "tee/A";
    const book = surfaceAdd(
      surfaceAdd(EMPTY_BOOK, key, "A", placement({ id: "ok" })),
      key, "A", placement({ id: "bad", heightCm: -1 }));
    expect(surfaceGuidance(book, key, "A")).toHaveLength(1);
    expect(surfaceGuidance(book, key, "A")[0].field).toBe("surface-1-heightCm");
  });
  it("falls back to position when the id itself is unusable", () => {
    const book = { "tee/A": { styleName: "A", placements: [{ ...placement(), id: "" }] } };
    expect(surfaceGuidance(book, "tee/A", "A")).toEqual([{
      level: "warn",
      field: "surface-0-id",
      text: expect.stringContaining("#1"),
    }]);
  });
});
