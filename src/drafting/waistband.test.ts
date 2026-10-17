import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { edgeRef } from "./stitch";
import { waistband, WAISTBAND_DEFAULT } from "./waistband";

describe("waistband component", () => {
  it("drafts separate front and back pieces on their center folds", () => {
    const result = waistband(STANDARD_M, WAISTBAND_DEFAULT);

    expect(Object.keys(result.pieces)).toEqual(["waistbandFront", "waistbandBack"]);
    for (const piece of Object.values(result.pieces)) {
      expect(piece.onFold).toBe(true);
      expect(piece.edges.map((edge) => edge.name)).toEqual(["top", "side", "seam", "fold"]);
    }
    expect(result.stitches).toEqual([]);
  });

  it("keeps each band's perimeter continuous for a closed rectangular export outline", () => {
    const result = waistband(STANDARD_M, WAISTBAND_DEFAULT);

    for (const piece of Object.values(result.pieces)) {
      piece.edges.forEach((edge, index) => {
        const next = piece.edges[(index + 1) % piece.edges.length]!;
        expect(edgeEnd(edge)).toEqual(edgeStart(next));
      });
    }
  });

  it("exposes the matching waist and side edges for both pieces", () => {
    const result = waistband(STANDARD_M, WAISTBAND_DEFAULT);

    expect(result.interfaces).toEqual({
      frontWaist: { edges: [edgeRef("waistbandFront", "seam", true)] },
      backWaist: { edges: [edgeRef("waistbandBack", "seam", true)] },
      frontSide: { edges: [edgeRef("waistbandFront", "side")] },
      backSide: { edges: [edgeRef("waistbandBack", "side")] },
    });
  });

  it("uses each supplied body seam length and derives omitted lengths from the default quarter waist", () => {
    const defaultResult = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    const frontDefault = (STANDARD_M.waist + STANDARD_M.ease) / 4;
    expect(edgeLength(pieceEdge(defaultResult.pieces.waistbandFront, "seam"))).toBeCloseTo(frontDefault, 6);
    expect(edgeLength(pieceEdge(defaultResult.pieces.waistbandBack, "seam"))).toBeCloseTo(frontDefault, 6);

    const customResult = waistband(STANDARD_M, {
      depth: 3.5,
      frontSeamLength: 18,
      backSeamLength: 21,
    });
    expect(edgeLength(pieceEdge(customResult.pieces.waistbandFront, "seam"))).toBeCloseTo(18, 6);
    expect(edgeLength(pieceEdge(customResult.pieces.waistbandBack, "seam"))).toBeCloseTo(21, 6);
  });

  it("doubles each on-fold band to match the finished waist interface", () => {
    const result = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    const halfWaist = edgeLength(pieceEdge(result.pieces.waistbandFront, "seam")) +
      edgeLength(pieceEdge(result.pieces.waistbandBack, "seam"));
    expect(halfWaist * 2).toBeCloseTo(STANDARD_M.waist + STANDARD_M.ease, 6);
  });

  it("uses params.depth for the zipper-side edge", () => {
    const shallow = waistband(STANDARD_M, { depth: 2 });
    const deep = waistband(STANDARD_M, { depth: 6 });
    const shallowDepth = edgeLength(pieceEdge(shallow.pieces.waistbandFront, "side"));
    const deepDepth = edgeLength(pieceEdge(deep.pieces.waistbandFront, "side"));
    expect(shallowDepth).toBeCloseTo(2, 6);
    expect(deepDepth).toBeCloseTo(6, 6);
    expect(deepDepth).toBeGreaterThan(shallowDepth);
  });
});
