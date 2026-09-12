import { describe, expect, it } from "vitest";
import { edgeLength, edgeStart, pieceEdge, rolePiece, stitchChecks, STANDARD_M } from "./index";
import { draftWovenShirtBody, WOVEN_SHIRT_BODY_STITCHES } from "./shirt";

describe("woven shirt body", () => {
  it("drafts separate front/back panels with the required named boundaries", () => {
    const block = draftWovenShirtBody(STANDARD_M);
    const front = rolePiece(block, "front");
    const back = rolePiece(block, "back");
    expect(front.onFold).toBe(false);
    expect(back.onFold).toBe(true);
    expect(front.edges.map((e) => e.name)).toEqual([
      "neckline", "shoulder", "armhole", "sideUpper", "sideMiddle", "sideLower", "hem", "centerFront",
    ]);
    expect(back.edges.map((e) => e.name)).toContain("centerBack");
    expect(stitchChecks(block, WOVEN_SHIRT_BODY_STITCHES).every((check) => check.ok)).toBe(true);
  });

  it("uses the independent neck measurement and neck ease", () => {
    const standard = rolePiece(draftWovenShirtBody(STANDARD_M), "front");
    const wider = rolePiece(draftWovenShirtBody({ ...STANDARD_M, neck: 48 }), "front");
    const eased = rolePiece(draftWovenShirtBody(STANDARD_M, { neckEase: 3 }), "front");
    expect(edgeStart(pieceEdge(wider, "neckline")).y).toBeGreaterThan(edgeStart(pieceEdge(standard, "neckline")).y);
    expect(edgeStart(pieceEdge(eased, "neckline")).x).toBe(edgeStart(pieceEdge(standard, "neckline")).x);
    expect(edgeLength(pieceEdge(eased, "neckline"))).toBeGreaterThan(edgeLength(pieceEdge(standard, "neckline")));
  });

  it("uses waist and hip inputs in the relaxed lower shape", () => {
    const base = rolePiece(draftWovenShirtBody(STANDARD_M), "front");
    const shaped = rolePiece(draftWovenShirtBody({ ...STANDARD_M, waist: 100, hip: 120 }), "front");
    expect(edgeStart(pieceEdge(shaped, "sideMiddle")).x).toBeGreaterThan(edgeStart(pieceEdge(base, "sideMiddle")).x);
    expect(edgeStart(pieceEdge(shaped, "sideLower")).x).toBeGreaterThan(edgeStart(pieceEdge(base, "sideLower")).x);
  });
});
