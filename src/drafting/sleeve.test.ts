import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { pieceEdge, edgeLength } from "./piece";
import { sleeve } from "./sleeve";
import { draftSleeve, draftTshirt, armholeLength } from "./tshirt";
import { draftFitted } from "./fitted";
import { rolePiece } from "./block";

describe("sleeve — the Component contract", () => {
  it("keys its piece under \"sleeve\", declares no internal stitches or interfaces", () => {
    const result = sleeve(STANDARD_M, { targetArmhole: 40 });
    expect(Object.keys(result.pieces)).toEqual(["sleeve"]);
    expect(result.pieces.sleeve.name).toBe("sleeve");
    expect(result.pieces.sleeve.onFold).toBe(false);
    expect(result.stitches).toHaveLength(0);
    expect(result.interfaces).toEqual({});
  });

  it("targetArmhole is genuinely used, not ignored — a bigger target makes a bigger cap", () => {
    const small = sleeve(STANDARD_M, { targetArmhole: 50 });
    const big = sleeve(STANDARD_M, { targetArmhole: 70 });
    const capLen = (r: typeof small) =>
      edgeLength(pieceEdge(r.pieces.sleeve, "capLeft")) + edgeLength(pieceEdge(r.pieces.sleeve, "capRight"));
    expect(capLen(big)).toBeGreaterThan(capLen(small));
  });

  it("fits the cap to at least the target length (plus ease)", () => {
    const result = sleeve(STANDARD_M, { targetArmhole: 50 });
    const capLen = edgeLength(pieceEdge(result.pieces.sleeve, "capLeft")) +
                   edgeLength(pieceEdge(result.pieces.sleeve, "capRight"));
    expect(capLen).toBeGreaterThan(50);
    expect(capLen).toBeLessThan(53); // 50 + ease, not by much
  });
});

describe("sleeve reproduces draftSleeve exactly, given the same target (Phase B3 byte-identity)", () => {
  it("draftSleeve IS sleeve's output at the generic tee armhole, not a re-derivation of it", () => {
    const target = armholeLength(STANDARD_M);
    expect(draftSleeve(STANDARD_M)).toEqual(sleeve(STANDARD_M, { targetArmhole: target }).pieces.sleeve);
  });
});

describe("Phase B3 fix (§2.4): recipes now measure the REAL assembled armhole", () => {
  it("draftTshirt's sleeve is fit to its own front+back, not a re-drafted pair", () => {
    const block = draftTshirt(STANDARD_M);
    const front = rolePiece(block, "front");
    const back = rolePiece(block, "back");
    const realTarget = edgeLength(pieceEdge(front, "armhole")) + edgeLength(pieceEdge(back, "armhole"));
    const cap = edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capLeft")) +
                edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capRight"));
    expect(cap).toEqual(
      edgeLength(pieceEdge(sleeve(STANDARD_M, { targetArmhole: realTarget }).pieces.sleeve, "capLeft")) +
      edgeLength(pieceEdge(sleeve(STANDARD_M, { targetArmhole: realTarget }).pieces.sleeve, "capRight"))
    );
  });

  it("draftFitted's sleeve is fit to the DARTED front's own armhole, not the generic tee front's", () => {
    const block = draftFitted(STANDARD_M);
    const dartedFront = rolePiece(block, "front");
    expect(dartedFront.name).toBe("fitted front"); // proves this really is the darted piece
    const back = rolePiece(block, "back");
    const realTarget = edgeLength(pieceEdge(dartedFront, "armhole")) + edgeLength(pieceEdge(back, "armhole"));
    // Numerically equal to the generic armhole at STANDARD_M (by construction,
    // per §2.4) — but now measured off the REAL darted front, not assumed.
    expect(realTarget).toBeCloseTo(armholeLength(STANDARD_M), 6);
  });
});
