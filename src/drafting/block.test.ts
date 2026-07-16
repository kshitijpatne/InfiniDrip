import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece } from "./piece";
import { block, blockPieces, rolePiece } from "./block";
import { draftTshirt } from "./tshirt";
import { STANDARD_M } from "./measurements";

// A minimal stand-in piece — the block layer only cares about roles, not geometry.
const stub = (name: string): Piece => ({
  name,
  onFold: false,
  edges: [{ kind: "line", name: "hem", start: point(0, 0), end: point(1, 0) }],
});

describe("block", () => {
  it("hands the engine every drafted piece, in role order", () => {
    const b = block({ front: stub("front"), back: stub("back"), sleeve: stub("sleeve") });
    expect(blockPieces(b).map((p) => p.name)).toEqual(["front", "back", "sleeve"]);
  });

  it("finds the piece filling a role", () => {
    const b = block({ front: stub("front"), back: stub("back") });
    expect(rolePiece(b, "back").name).toBe("back");
  });

  it("keeps role and piece name separate — a role may hold a differently named piece", () => {
    const b = block({ front: stub("fitted front") });
    expect(rolePiece(b, "front").name).toBe("fitted front");
  });

  it("throws — loudly, not silently — when a garment has no such role", () => {
    // A sleeveless garment simply has no "sleeve" role. Asking for one is a bug
    // in the caller, so it fails fast rather than returning undefined.
    const skirtish = block({ front: stub("front"), back: stub("back") });
    expect(blockPieces(skirtish).length).toBe(2);
    expect(() => rolePiece(skirtish, "sleeve")).toThrow('no piece in role "sleeve"');
  });

  it("carries the real t-shirt draft: three roles, three pieces", () => {
    const tee = draftTshirt(STANDARD_M);
    expect(Object.keys(tee.roles)).toEqual(["front", "back", "sleeve"]);
    expect(blockPieces(tee).length).toBe(3);
  });
});
