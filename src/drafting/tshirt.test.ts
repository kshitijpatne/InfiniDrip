import { describe, it, expect } from "vitest";
import { distance } from "../geometry";
import { STANDARD_M } from "./measurements";
import { edgeStart, edgeEnd, edgeLength, pieceEdge } from "./piece";
import { draftFront, draftBack, draftSleeve, draftTshirt, armholeLength } from "./tshirt";
import { rolePiece } from "./block";

describe("draftFront", () => {
  const front = draftFront(STANDARD_M);
  it("is a half-piece on the fold", () => {
    expect(front.onFold).toBe(true);
  });
  it("places the underarm at the chest-panel width and armhole depth", () => {
    const side = pieceEdge(front, "side"); // side seam starts at the underarm
    expect(edgeStart(side)).toEqual({ x: 27.5, y: 24 });
  });
  it("runs the hem across to the fold and up the centre front", () => {
    expect(edgeEnd(pieceEdge(front, "hem"))).toEqual({ x: 0, y: 70 });
    expect(edgeEnd(pieceEdge(front, "centerFront"))).toEqual({ x: 0, y: 8 });
  });
  it("has an armhole that curves (longer than the straight chord)", () => {
    const armhole = pieceEdge(front, "armhole");
    const chord = distance(edgeStart(armhole), edgeEnd(armhole));
    expect(edgeLength(armhole)).toBeGreaterThan(chord);
  });
});

describe("draftBack", () => {
  it("has a shallower neckline than the front", () => {
    const back = draftBack(STANDARD_M);
    expect(edgeStart(pieceEdge(back, "neckline"))).toEqual({ x: 0, y: 2.5 });
    expect(edgeEnd(pieceEdge(back, "centerBack"))).toEqual({ x: 0, y: 2.5 });
  });
});

describe("draftSleeve", () => {
  const sleeve = draftSleeve(STANDARD_M);
  it("is a full piece (not on a fold)", () => {
    expect(sleeve.onFold).toBe(false);
  });
  it("peaks at the cap top, centred on the sleeve width", () => {
    // width = bicep 38 + ease/2 (5) = 43, so the cap top sits at x = 21.5
    expect(edgeEnd(pieceEdge(sleeve, "capLeft"))).toEqual({ x: 21.5, y: 0 });
  });
  it("has a hem narrower than the bicep line", () => {
    expect(edgeLength(pieceEdge(sleeve, "hem"))).toBeCloseTo(37); // 43 - 2*3 taper
  });
});

describe("sleeve cap fitting", () => {
  it("fits the cap length to the armhole plus a small ease", () => {
    const block = draftTshirt(STANDARD_M);
    const cap = edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capLeft")) +
                edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capRight"));
    const diff = cap - armholeLength(STANDARD_M);
    expect(diff).toBeGreaterThan(0); // cap eased slightly longer
    expect(diff).toBeLessThan(3);    // but not by much
  });
});

describe("draftTshirt", () => {
  it("returns front, back, and sleeve", () => {
    const block = draftTshirt(STANDARD_M);
    expect([rolePiece(block, "front").name, rolePiece(block, "back").name, rolePiece(block, "sleeve").name])
      .toEqual(["front", "back", "sleeve"]);
  });
});
