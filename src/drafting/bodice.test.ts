import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { pieceEdge, edgeStart } from "./piece";
import { bodice } from "./bodice";
import { draftFront, draftBack } from "./tshirt";

describe("bodice — the Component contract", () => {
  it("front: keys its piece under the requested role, declares no internal stitches", () => {
    const result = bodice(STANDARD_M, { position: "front" });
    expect(Object.keys(result.pieces)).toEqual(["front"]);
    expect(result.pieces.front.name).toBe("front");
    expect(result.stitches).toHaveLength(0);
  });

  it("back: same shape, keyed under \"back\"", () => {
    const result = bodice(STANDARD_M, { position: "back" });
    expect(Object.keys(result.pieces)).toEqual(["back"]);
    expect(result.pieces.back.name).toBe("back");
  });

  it("exposes an armhole interface naming its OWN role's armhole edge", () => {
    const front = bodice(STANDARD_M, { position: "front" });
    const back = bodice(STANDARD_M, { position: "back" });
    expect(Object.keys(front.interfaces)).toEqual(["armhole"]);
    expect(front.interfaces.armhole.edges).toEqual([{ piece: "front", edge: "armhole" }]);
    expect(back.interfaces.armhole.edges).toEqual([{ piece: "back", edge: "armhole" }]);
  });

  it("front and back start their necklines at different depths — the whole point of the split", () => {
    const front = bodice(STANDARD_M, { position: "front" });
    const back = bodice(STANDARD_M, { position: "back" });
    const frontStart = edgeStart(pieceEdge(front.pieces.front, "neckline"));
    const backStart = edgeStart(pieceEdge(back.pieces.back, "neckline"));
    expect(frontStart.y).toBeGreaterThan(backStart.y); // front dips deeper
  });
});

describe("bodice reproduces draftFront/draftBack exactly (Phase B2 byte-identity)", () => {
  it("draftFront IS bodice's front panel, not a re-derivation of it", () => {
    expect(draftFront(STANDARD_M)).toEqual(bodice(STANDARD_M, { position: "front" }).pieces.front);
  });

  it("draftBack IS bodice's back panel, not a re-derivation of it", () => {
    expect(draftBack(STANDARD_M)).toEqual(bodice(STANDARD_M, { position: "back" }).pieces.back);
  });
});
