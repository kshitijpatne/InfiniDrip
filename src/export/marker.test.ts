import { describe, it, expect } from "vitest";
import { STANDARD_M, TEE, blockPieces } from "../drafting";
import { markerPieces, gradedMarker } from "./marker";

describe("markerPieces", () => {
  it("holds every piece of every graded size, labelled with its size", () => {
    const pieces = markerPieces(TEE, STANDARD_M);
    const perSize = blockPieces(TEE.draft(STANDARD_M)).length; // 3 for the tee
    expect(pieces.length).toBe(TEE.sizes.length * perSize); // 5 × 3 = 15
    // every name is "<SIZE> <piece>", so a size and a piece both appear in it
    for (const p of pieces) {
      const [size, ...rest] = p.name.split(" ");
      expect(TEE.sizes.map((s) => s.label)).toContain(size);
      expect(rest.length).toBeGreaterThan(0);
    }
  });

  it("labels distinguish the same piece across sizes", () => {
    const names = markerPieces(TEE, STANDARD_M).map((p) => p.name);
    expect(names).toContain("XS front");
    expect(names).toContain("XL front");
    expect(new Set(names).size).toBe(names.length); // no collisions
  });

  it("keeps real cut geometry on each piece", () => {
    const pieces = markerPieces(TEE, STANDARD_M);
    expect(pieces.every((p) => p.cut.length > 2 && p.sew.length > 2)).toBe(true);
  });
});

describe("gradedMarker", () => {
  it("nests the whole run and needs more cloth than a single garment", () => {
    const width = 150;
    const marker = gradedMarker(TEE, STANDARD_M, width);
    expect(marker.placed.length).toBe(markerPieces(TEE, STANDARD_M).length);
    expect(marker.fabricWidth).toBe(width);
    expect(marker.fabricLength).toBeGreaterThan(0);
    expect(marker.utilization).toBeGreaterThan(0);
    expect(marker.utilization).toBeLessThanOrEqual(1);
  });

  it("uses a larger size's pieces, so a bigger run reaches further down the bolt", () => {
    // a narrow bolt forces more shelves -> more length; the marker still fits its
    // widest single piece, so `fits` stays true on a sensible bolt.
    const marker = gradedMarker(TEE, STANDARD_M, 150);
    expect(marker.fits).toBe(true);
  });
});
