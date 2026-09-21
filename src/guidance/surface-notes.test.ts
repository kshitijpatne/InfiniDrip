import { describe, it, expect } from "vitest";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "../surface/placement";
import { EMPTY_BOOK, surfaceAdd } from "../surface/store";
import type { PieceFrameSet } from "../surface/piece-frames";
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
    expect(surfaceErrorField("Placement sourcePxWidth: enter a number above 0.", 0))
      .toBe("surface-0-sourcePxWidth");
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

const frames: PieceFrameSet = {
  frames: new Map([["front", {
    role: "front", name: "front",
    minX: 0, minY: 0, maxX: 100, maxY: 60, areaCm2: 6000,
  }]]),
  roles: ["front", "back"],
};

describe("surfaceGuidance with piece frames", () => {
  it("stays silent for fitting artwork without source dimensions", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceGuidance(book, "tee/A", "A", frames)).toEqual([]);
  });
  it("reports only validity problems for invalid placements", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({ widthCm: 0 }));
    expect(surfaceGuidance(book, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-widthCm",
      text: expect.stringContaining("widthCm"),
    }]);
  });
  it("names unknown piece roles with the available choices", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({ pieceRole: "sleeve" }));
    expect(surfaceGuidance(book, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-pieceRole",
      text: expect.stringContaining("Pick one of: front, back."),
    }]);
    expect(surfaceGuidance(book, "tee/A", "A", { frames: new Map(), roles: [] })).toEqual([{
      level: "warn",
      field: "surface-0-pieceRole",
      text: expect.stringContaining("No roles are available."),
    }]);
  });
  it("targets the offset when the artwork centre leaves the piece", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({
      transform: { ...EMPTY_TRANSFORM, dx: 500, dy: 0 },
    }));
    expect(surfaceGuidance(book, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-dx",
      text: expect.stringContaining("extends beyond the front piece"),
    }]);
  });
  it("targets the vertical offset when only the centre leaves vertically", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({
      transform: { ...EMPTY_TRANSFORM, dy: 500 },
    }));
    expect(surfaceGuidance(book, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-dy",
      text: expect.stringContaining("extends beyond the front piece"),
    }]);
  });
  it("targets scale when an oversized artwork overhangs from inside", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({
      transform: { ...EMPTY_TRANSFORM, scale: 10 },
    }));
    const notes = surfaceGuidance(book, "tee/A", "A", frames);
    expect(notes.map((n) => n.field)).toContain("surface-0-scale");
    expect(notes.some((n) => n.text.includes("extends beyond"))).toBe(true);
  });
  it("warns below the print floor and stays silent at or above it", () => {
    const low = surfaceAdd(EMPTY_BOOK, "tee/A", "A",
      placement({ sourcePxWidth: 200, sourcePxHeight: 200 }));
    expect(surfaceGuidance(low, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-sourcePxHeight",
      text: expect.stringContaining("about 8 px/cm"),
    }]);
    const fine = surfaceAdd(EMPTY_BOOK, "tee/A", "A",
      placement({ sourcePxWidth: 1200, sourcePxHeight: 1500 }));
    expect(surfaceGuidance(fine, "tee/A", "A", frames)).toEqual([]);
  });
  it("focuses the lower-resolution source dimension", () => {
    const lowHeight = surfaceAdd(EMPTY_BOOK, "tee/A", "A",
      placement({ sourcePxWidth: 1200, sourcePxHeight: 200 }));
    expect(surfaceGuidance(lowHeight, "tee/A", "A", frames)[0].field)
      .toBe("surface-0-sourcePxHeight");
    const lowWidth = surfaceAdd(EMPTY_BOOK, "tee/A", "A",
      placement({ widthCm: 25, heightCm: 20, sourcePxWidth: 200, sourcePxHeight: 1200 }));
    expect(surfaceGuidance(lowWidth, "tee/A", "A", frames)[0].field)
      .toBe("surface-0-sourcePxWidth");
  });
  it("warns at full coverage and stays silent below it", () => {
    const full = surfaceAdd(EMPTY_BOOK, "tee/A", "A",
      placement({ widthCm: 100, heightCm: 60 }));
    expect(surfaceGuidance(full, "tee/A", "A", frames)).toEqual([{
      level: "warn",
      field: "surface-0-scale",
      text: expect.stringContaining("covers about 100%"),
    }]);
    const partial = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceGuidance(partial, "tee/A", "A", frames)).toEqual([]);
  });
  it("skips coverage for degenerate frames", () => {
    const flat = {
      frames: new Map([["front", {
        role: "front", name: "front",
        minX: 0, minY: 0, maxX: 100, maxY: 60, areaCm2: 0,
      }]]),
      roles: ["front"],
    };
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceGuidance(book, "tee/A", "A", flat)).toEqual([]);
  });
});
