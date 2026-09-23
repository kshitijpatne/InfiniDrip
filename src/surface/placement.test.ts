import { describe, it, expect } from "vitest";
import {
  EMPTY_TRANSFORM,
  addPlacement,
  effectiveSize,
  emptyStyleSurface,
  isArtworkKind,
  normalizeRotation,
  placementError,
  removePlacement,
  transformError,
  type ArtworkPlacement,
} from "./placement";

const valid = (): ArtworkPlacement => ({
  id: "chest-print",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 25,
  transform: { dx: 1, dy: -2, scale: 1.5, rotationDeg: 45 },
  zOrder: 1,
  sourceName: "tiger.svg",
});

describe("isArtworkKind", () => {
  it("accepts the three known kinds", () => {
    expect(isArtworkKind("print")).toBe(true);
    expect(isArtworkKind("patch")).toBe(true);
    expect(isArtworkKind("color-block")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isArtworkKind("embroidery")).toBe(false);
    expect(isArtworkKind(null)).toBe(false);
    expect(isArtworkKind(3)).toBe(false);
  });
});

describe("transformError", () => {
  it("passes a usable transform", () => {
    expect(transformError(EMPTY_TRANSFORM)).toBeNull();
  });
  it("rejects non-objects", () => {
    expect(transformError(null)).toContain("object");
    expect(transformError("1,2")).toContain("object");
    expect(transformError([0, 0, 1, 0])).toContain("object");
  });
  it("names each bad field", () => {
    expect(transformError({ ...EMPTY_TRANSFORM, dx: NaN })).toContain("dx");
    expect(transformError({ ...EMPTY_TRANSFORM, dy: Infinity })).toContain("dy");
    expect(transformError({ ...EMPTY_TRANSFORM, scale: 0 })).toContain("scale");
    expect(transformError({ ...EMPTY_TRANSFORM, scale: -2 })).toContain("scale");
    expect(transformError({ ...EMPTY_TRANSFORM, scale: "big" })).toContain("scale");
    expect(transformError({ ...EMPTY_TRANSFORM, rotationDeg: NaN })).toContain("rotationDeg");
  });
});

describe("placementError", () => {
  it("passes a usable placement", () => {
    expect(placementError(valid())).toBeNull();
  });
  it("accepts local and bundled artwork references and rejects path-like references", () => {
    expect(placementError({ ...valid(), assetId: "local-11111111111141118111111111111111-png" })).toBeNull();
    expect(placementError({ ...valid(), assetId: "builtin-leaf-print" })).toBeNull();
    expect(placementError({ ...valid(), assetId: "../outside.png" })).toContain("assetId");
    expect(placementError({ ...valid(), assetId: 7 })).toContain("assetId");
  });
  it("rejects non-objects", () => {
    expect(placementError(null)).toContain("object");
    expect(placementError("print")).toContain("object");
    expect(placementError([valid()])).toContain("object");
  });
  it("names each bad field", () => {
    expect(placementError({ ...valid(), id: "" })).toContain("id");
    expect(placementError({ ...valid(), id: 7 })).toContain("id");
    expect(placementError({ ...valid(), kind: "foil" })).toContain("kind");
    expect(placementError({ ...valid(), pieceRole: "" })).toContain("pieceRole");
    expect(placementError({ ...valid(), pieceRole: 4 })).toContain("pieceRole");
    expect(placementError({ ...valid(), widthCm: 0 })).toContain("widthCm");
    expect(placementError({ ...valid(), widthCm: -5 })).toContain("widthCm");
    expect(placementError({ ...valid(), heightCm: 0 })).toContain("heightCm");
    expect(placementError({ ...valid(), heightCm: NaN })).toContain("heightCm");
    expect(placementError({ ...valid(), zOrder: 1.5 })).toContain("zOrder");
    expect(placementError({ ...valid(), zOrder: NaN })).toContain("zOrder");
    expect(placementError({ ...valid(), sourceName: 9 })).toContain("sourceName");
  });
  it("leaves absent source dimensions alone and validates present ones", () => {
    expect(placementError(valid())).toBeNull();
    expect(placementError({ ...valid(), sourcePxWidth: 1200, sourcePxHeight: 1500 })).toBeNull();
    expect(placementError({ ...valid(), sourcePxWidth: 0 })).toContain("sourcePxWidth");
    expect(placementError({ ...valid(), sourcePxWidth: -4 })).toContain("sourcePxWidth");
    expect(placementError({ ...valid(), sourcePxWidth: "wide" })).toContain("sourcePxWidth");
    expect(placementError({ ...valid(), sourcePxHeight: 0 })).toContain("sourcePxHeight");
    expect(placementError({ ...valid(), sourcePxHeight: NaN })).toContain("sourcePxHeight");
  });
  it("prefixes transform problems with the transform path", () => {
    const bad = { ...valid(), transform: { ...EMPTY_TRANSFORM, scale: 0 } };
    const message = placementError(bad);
    expect(message).toContain("transform");
    expect(message).toContain("scale");
  });
});

describe("emptyStyleSurface", () => {
  it("starts a named style with no artwork", () => {
    expect(emptyStyleSurface("Classic tee")).toEqual({ styleName: "Classic tee", placements: [] });
  });
});

describe("addPlacement", () => {
  it("appends a new id", () => {
    const surface = addPlacement(emptyStyleSurface("Classic tee"), valid());
    expect(surface.placements).toHaveLength(1);
    expect(surface.styleName).toBe("Classic tee");
  });
  it("replaces the same id instead of duplicating it", () => {
    const first = addPlacement(emptyStyleSurface("Classic tee"), valid());
    const moved = { ...valid(), transform: { ...EMPTY_TRANSFORM, dx: 9, dy: 9, scale: 1, rotationDeg: 0 } };
    const second = addPlacement(first, moved);
    expect(second.placements).toHaveLength(1);
    expect(second.placements[0].transform.dx).toBe(9);
  });
});

describe("removePlacement", () => {
  it("drops the named id and keeps the rest", () => {
    const other = { ...valid(), id: "back-patch", kind: "patch" as const };
    const surface = addPlacement(addPlacement(emptyStyleSurface("Classic tee"), valid()), other);
    const pruned = removePlacement(surface, "chest-print");
    expect(pruned.placements.map((p) => p.id)).toEqual(["back-patch"]);
  });
  it("leaves an unknown id unchanged", () => {
    const surface = addPlacement(emptyStyleSurface("Classic tee"), valid());
    expect(removePlacement(surface, "missing")).toEqual(surface);
  });
});

describe("normalizeRotation", () => {
  it("maps any finite rotation into [0, 360)", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(45)).toBe(45);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(-720)).toBe(0);
  });
});

describe("effectiveSize", () => {
  it("scales true artwork size by the uniform scale", () => {
    expect(effectiveSize(valid())).toEqual({ widthCm: 30, heightCm: 37.5 });
  });
});
