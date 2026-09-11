import { describe, it, expect } from "vitest";
import { STANDARD_M, derive } from "./measurements";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { draftFront, draftBack } from "./tshirt";
import { draftFittedFront } from "./fitted";
import { pieceEdge } from "./piece";

const d = derive(STANDARD_M);
const SHOULDER_HALF = d.shoulderHalf;      // 22.5
const ARMHOLE_DEPTH = STANDARD_M.armholeDepth; // 24

describe("necklineEdge — crew", () => {
  it("front: places hps at neckWidthHalf, cNeck at the given depth", () => {
    const { cNeck, hps } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    expect(cNeck).toEqual({ x: 0, y: d.frontNeckDepth });
    expect(hps).toEqual({ x: d.neckWidthHalf, y: 0 });
  });

  it("front and back both meet centre-front at a right angle to the fold (Slice 62 fix)", () => {
    // The bug this slice fixed: the OLD control1 sat directly above cNeck
    // (same x), giving a VERTICAL tangent at the fold — the curve left the
    // fold running ALONG it, which is what spiked when mirrored. The tangent
    // at cNeck is (control1 - cNeck); it must be purely horizontal (exactly
    // zero y) for the curve to meet the fold at a right angle, per every
    // drafting source checked.
    const front = necklineEdge("front", d.neckWidthHalf, 10, SHOULDER_HALF, ARMHOLE_DEPTH);
    const back = necklineEdge("back", d.neckWidthHalf, 10, SHOULDER_HALF, ARMHOLE_DEPTH);
    for (const { edge, cNeck } of [front, back]) {
      expect(edge.kind).toBe("curve");
      if (edge.kind === "curve") {
        expect(edge.curve.control1.y).toBe(cNeck.y); // tangent's y-component is exactly zero
        expect(edge.curve.control1.x).toBeGreaterThan(0); // and it's not a zero-length tangent either
      }
    }
  });

  it("defaults params to NECKLINE_DEFAULT when omitted", () => {
    const withDefault = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    const explicit = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH, NECKLINE_DEFAULT);
    expect(withDefault).toEqual(explicit);
  });

  it("emits no notes at default params — nothing to warn about", () => {
    const { notes } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    expect(notes).toEqual([]);
  });
});

describe("necklineEdge — v (Phase B4 part 2, Slice 56)", () => {
  it("is a straight line from cNeck to hps — no curve", () => {
    const { edge, cNeck, hps } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "v", widthEase: 0, frontDrop: 0 });
    expect(edge).toEqual({ kind: "line", name: "neckline", start: cNeck, end: hps });
  });

  it("still respects frontDrop — a deeper V", () => {
    const shallow = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "v", widthEase: 0, frontDrop: 0 });
    const deep = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "v", widthEase: 0, frontDrop: 3 });
    expect(deep.cNeck.y).toBeCloseTo(shallow.cNeck.y + 3, 6);
  });
});

describe("necklineEdge — widthEase/frontDrop are genuinely applied", () => {
  it("widthEase widens BOTH cNeck-to-hps width and (for crew) control2 — same on front and back", () => {
    const eased = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 2, frontDrop: 0 });
    expect(eased.hps.x).toBeCloseTo(d.neckWidthHalf + 2, 6);
  });

  it("frontDrop deepens the FRONT depth only", () => {
    const front = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 0, frontDrop: 3 });
    const back = necklineEdge("back", d.neckWidthHalf, d.backNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 0, frontDrop: 3 });
    expect(front.cNeck.y).toBeCloseTo(d.frontNeckDepth + 3, 6);
    expect(back.cNeck.y).toBeCloseTo(d.backNeckDepth, 6); // frontDrop never touches back
  });
});

describe("necklineEdge guardrails — warn, never clamp", () => {
  it("stays silent when the neckline is safely inside the shoulder/armhole", () => {
    const { notes } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 1, frontDrop: 1 });
    expect(notes).toEqual([]);
  });

  it("warns when widthEase pushes the neckline out to the shoulder seam — but still returns valid geometry", () => {
    const widthEase = SHOULDER_HALF - d.neckWidthHalf; // exactly reaches shoulderHalf
    const { notes, edge } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase, frontDrop: 0 });
    expect(notes).toContainEqual({ level: "warn", text: "The neckline reaches the shoulder seam — reduce neckline width adjustment." });
    expect(edge.kind).toBe("curve"); // still drafts — warn, never clamp
  });

  it("warns when frontDrop pushes the front neck below the underarm", () => {
    const frontDrop = ARMHOLE_DEPTH - d.frontNeckDepth; // exactly reaches armholeDepth
    const { notes } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 0, frontDrop });
    expect(notes).toContainEqual({ level: "warn", text: "The front neckline drops below the underarm — reduce neck scoop depth or increase armhole depth." });
  });

  it("the depth guardrail is FRONT-only — the same absolute depth on the back never warns", () => {
    const { notes } = necklineEdge("back", d.neckWidthHalf, ARMHOLE_DEPTH, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(notes).toEqual([]);
  });

  it("can emit BOTH guardrail notes at once", () => {
    const { notes } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 20, frontDrop: 20 });
    expect(notes).toHaveLength(2);
  });
});

describe("necklineEdge — scoop (Slice 62: same curve construction as crew, no shape of its own)", () => {
  it("is byte-identical to crew's curve at the SAME depth and width", () => {
    // Slice 60's scoop had its own, differently-proportioned control
    // factors. Slice 62 removed them: once the curve is forced to meet the
    // fold at a right angle, its shape is fully determined by its two
    // endpoints — there's no remaining freedom for "rounder" control
    // points. Every drafting source checked agrees a scoop is the SAME
    // curve as crew, just deeper/wider (depth and width, not shape).
    const scoop = necklineEdge("front", d.neckWidthHalf, 10, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "scoop", widthEase: 0, frontDrop: 0 });
    const crew = necklineEdge("front", d.neckWidthHalf, 10, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(scoop.edge).toEqual(crew.edge);
  });

  it("reads as deeper/wider only when frontDrop/widthEase are set — the tank's real scoop, not the shape param alone", () => {
    const scoop = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "scoop", widthEase: 1.5, frontDrop: 5 });
    const crew = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH, NECKLINE_DEFAULT);
    expect(scoop.cNeck.y).toBeGreaterThan(crew.cNeck.y);
    expect(scoop.hps.x).toBeGreaterThan(crew.hps.x);
  });

  it("still respects widthEase/frontDrop, same as every other shape", () => {
    const base = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "scoop", widthEase: 0, frontDrop: 0 });
    const eased = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "scoop", widthEase: 2, frontDrop: 3 });
    expect(eased.hps.x).toBeCloseTo(base.hps.x + 2, 6);
    expect(eased.cNeck.y).toBeCloseTo(base.cNeck.y + 3, 6);
  });
});

describe("necklineEdge — deliberately unimplemented", () => {
  it("throws on \"boat\" — no curve math exists for it", () => {
    expect(() => necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH,
      { shape: "boat", widthEase: 0, frontDrop: 0 })).toThrow(/not yet implemented/);
  });
});

describe("necklineEdge reproduces every panel's neckline exactly (Phase B4 byte-identity)", () => {
  it("draftFront's neckline edge IS necklineEdge's front output at NECKLINE_DEFAULT", () => {
    const { edge } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    expect(pieceEdge(draftFront(STANDARD_M), "neckline")).toEqual(edge);
  });

  it("draftBack's neckline edge IS necklineEdge's back output at NECKLINE_DEFAULT", () => {
    const { edge } = necklineEdge("back", d.neckWidthHalf, d.backNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    expect(pieceEdge(draftBack(STANDARD_M), "neckline")).toEqual(edge);
  });

  it("draftFittedFront's neckline edge IS necklineEdge's front output — the SAME call bodice.ts makes, not a second copy", () => {
    const { edge } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, SHOULDER_HALF, ARMHOLE_DEPTH);
    expect(pieceEdge(draftFittedFront(STANDARD_M), "neckline")).toEqual(edge);
  });
});
