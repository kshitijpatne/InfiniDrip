import { describe, it, expect } from "vitest";
import { STANDARD_M, TEE, block } from "../drafting";
import { point } from "../geometry/point";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "./placement";
import {
  artworkBounds,
  artworkInPiece,
  artworkInsidePiece,
  artworkResolution,
  coverageRatio,
  pieceFrames,
  resolvePieceFrame,
  type PieceFrame,
} from "./piece-frames";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "chest-print",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 10,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "",
  ...overrides,
});

const frame: PieceFrame = {
  role: "front", name: "front",
  minX: 0, minY: 0, maxX: 100, maxY: 60, areaCm2: 6000,
};

describe("pieceFrames", () => {
  it("frames every role of a real draft with positive areas", () => {
    const set = pieceFrames(TEE.draft(STANDARD_M), TEE.allowances);
    expect(set.roles).toContain("front");
    const front = set.frames.get("front")!;
    expect(front.areaCm2).toBeGreaterThan(0);
    expect(front.minX).toBeLessThanOrEqual(front.maxX);
    expect(front.minY).toBeLessThanOrEqual(front.maxY);
    expect(set.frames.get(front.name)).toBe(front);
  });
  it("returns empty sets for an empty block", () => {
    expect(pieceFrames(block({}, []), TEE.allowances)).toEqual({ frames: new Map(), roles: [] });
  });
});

describe("resolvePieceFrame", () => {
  const set = { frames: new Map([["front", frame]]), roles: ["front"] };
  it("resolves exact roles and names, else null", () => {
    expect(resolvePieceFrame(set, "front")).toBe(frame);
    expect(resolvePieceFrame(set, "sleeve")).toBeNull();
    const byName = { frames: new Map([["Body Piece", frame]]), roles: [] as string[] };
    expect(resolvePieceFrame(byName, "Body Piece")).toBe(frame);
  });
});

describe("artworkInPiece", () => {
  it("centres artwork on the piece-box centre plus the offset", () => {
    const corners = artworkInPiece(
      placement({ transform: { ...EMPTY_TRANSFORM, dx: 5, dy: -2 } }), frame);
    expect(corners).toEqual([point(45, 23), point(65, 23), point(65, 33), point(45, 33)]);
  });
});

describe("artworkBounds", () => {
  it("bounds corners and refuses empty input loudly", () => {
    expect(artworkBounds([point(1, 2), point(5, 8)])).toEqual({ minX: 1, minY: 2, maxX: 5, maxY: 8 });
    expect(() => artworkBounds([])).toThrow("at least one corner");
  });
});

describe("artworkInsidePiece", () => {
  it("accepts inside and edge-touching artwork", () => {
    expect(artworkInsidePiece(placement(), frame)).toBe(true);
    expect(artworkInsidePiece(placement({ widthCm: 100, heightCm: 60 }), frame)).toBe(true);
  });
  it("rejects overhanging artwork", () => {
    expect(artworkInsidePiece(
      placement({ transform: { ...EMPTY_TRANSFORM, dx: 500, dy: 0 } }), frame)).toBe(false);
    expect(artworkInsidePiece(placement({ widthCm: 200, heightCm: 10 }), frame)).toBe(false);
  });
});

describe("coverageRatio", () => {
  it("divides artwork area by piece area", () => {
    expect(coverageRatio(placement(), frame)).toBeCloseTo(200 / 6000, 9);
  });
  it("returns null for invalid placements and degenerate frames", () => {
    expect(coverageRatio(placement({ widthCm: 0 }), frame)).toBeNull();
    expect(coverageRatio(placement(), { ...frame, areaCm2: 0 })).toBeNull();
  });
});

describe("artworkResolution", () => {
  it("returns null without persisted source dimensions", () => {
    expect(artworkResolution(placement())).toBeNull();
    expect(artworkResolution(placement({ sourcePxWidth: 1200 }))).toBeNull();
  });
  it("returns null for invalid geometry even with dimensions", () => {
    expect(artworkResolution(placement({ widthCm: 0, sourcePxWidth: 1200, sourcePxHeight: 1500 }))).toBeNull();
  });
  it("divides source pixels by placed centimetres", () => {
    expect(artworkResolution(placement({ sourcePxWidth: 1200, sourcePxHeight: 1500 })))
      .toEqual({ xPxPerCm: 60, yPxPerCm: 150 });
  });
});
