import { describe, it, expect } from "vitest";
import { STANDARD_M, derive } from "./measurements";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { draftFront, draftBack } from "./tshirt";
import { draftFittedFront } from "./fitted";
import { pieceEdge } from "./piece";

const d = derive(STANDARD_M);

describe("necklineEdge — crew (the only implemented shape)", () => {
  it("front: places hps at neckWidthHalf, cNeck at the given depth", () => {
    const { cNeck, hps } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth);
    expect(cNeck).toEqual({ x: 0, y: d.frontNeckDepth });
    expect(hps).toEqual({ x: d.neckWidthHalf, y: 0 });
  });

  it("front and back use different control-point factors at the same depth", () => {
    const front = necklineEdge("front", d.neckWidthHalf, 10);
    const back = necklineEdge("back", d.neckWidthHalf, 10);
    expect(front.edge.kind).toBe("curve");
    expect(back.edge.kind).toBe("curve");
    if (front.edge.kind === "curve" && back.edge.kind === "curve") {
      expect(front.edge.curve.control1.y).toBeCloseTo(5.5, 6);  // 10 * 0.55
      expect(back.edge.curve.control1.y).toBeCloseTo(6, 6);     // 10 * 0.6
    }
  });

  it("defaults params to NECKLINE_DEFAULT when omitted", () => {
    const withDefault = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth);
    const explicit = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, NECKLINE_DEFAULT);
    expect(withDefault).toEqual(explicit);
  });
});

describe("necklineEdge — deliberately unimplemented (Phase B4 part 1 scope)", () => {
  it("throws on \"v\" — real curve math isn't built yet", () => {
    expect(() => necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, { shape: "v", widthEase: 0, frontDrop: 0 }))
      .toThrow(/not yet implemented/);
  });

  it("throws on \"scoop\" and \"boat\"", () => {
    for (const shape of ["scoop", "boat"] as const) {
      expect(() => necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, { shape, widthEase: 0, frontDrop: 0 }))
        .toThrow(/not yet implemented/);
    }
  });

  it("throws on non-zero widthEase, rather than silently ignoring it", () => {
    expect(() => necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, { shape: "crew", widthEase: 1, frontDrop: 0 }))
      .toThrow(/not yet implemented/);
  });

  it("throws on non-zero frontDrop, rather than silently ignoring it", () => {
    expect(() => necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, { shape: "crew", widthEase: 0, frontDrop: 1 }))
      .toThrow(/not yet implemented/);
  });
});

describe("necklineEdge reproduces every panel's neckline exactly (Phase B4 byte-identity)", () => {
  it("draftFront's neckline edge IS necklineEdge's front output", () => {
    const { edge } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth);
    expect(pieceEdge(draftFront(STANDARD_M), "neckline")).toEqual(edge);
  });

  it("draftBack's neckline edge IS necklineEdge's back output", () => {
    const { edge } = necklineEdge("back", d.neckWidthHalf, d.backNeckDepth);
    expect(pieceEdge(draftBack(STANDARD_M), "neckline")).toEqual(edge);
  });

  it("draftFittedFront's neckline edge IS necklineEdge's front output — the SAME call bodice.ts makes, not a second copy", () => {
    const { edge } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth);
    expect(pieceEdge(draftFittedFront(STANDARD_M), "neckline")).toEqual(edge);
  });
});
