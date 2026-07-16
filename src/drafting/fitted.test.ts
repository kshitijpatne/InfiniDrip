import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftFront, draftBack, draftSleeve } from "./tshirt";
import { draftFittedFront, draftFitted } from "./fitted";
import { pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { rolePiece } from "./block";

describe("draftFittedFront", () => {
  const f = draftFittedFront(STANDARD_M);

  it("is a front half-piece carrying one bust dart", () => {
    expect(f.name).toBe("fitted front");
    expect(f.onFold).toBe(true);
    expect(f.dart).toEqual({ legs: ["bustDartUpper", "bustDartLower"] });
  });

  it("splits the side seam around the dart legs (apex interior, mouth on the seam)", () => {
    const upper = pieceEdge(f, "bustDartUpper");
    const lower = pieceEdge(f, "bustDartLower");
    // the two legs meet at the apex
    expect(edgeEnd(upper)).toEqual(edgeStart(lower));
    // apex is pulled in from the side seam
    expect(edgeEnd(upper).x).toBeLessThan(edgeStart(upper).x);
  });

  it("reuses the tee front's neckline, shoulder and armhole verbatim", () => {
    const tee = draftFront(STANDARD_M);
    for (const name of ["neckline", "shoulder", "armhole"]) {
      expect(pieceEdge(f, name)).toEqual(pieceEdge(tee, name));
    }
  });

  it("lengthens the side seam by the dart intake so it matches the back once sewn", () => {
    const back = draftBack(STANDARD_M);
    const frontSide =
      edgeLength(pieceEdge(f, "sideUpper")) + edgeLength(pieceEdge(f, "sideLower"));
    expect(frontSide).toBeCloseTo(edgeLength(pieceEdge(back, "side")), 6);
  });

  it("gives the dart two equal legs, so it closes cleanly", () => {
    expect(edgeLength(pieceEdge(f, "bustDartUpper")))
      .toBeCloseTo(edgeLength(pieceEdge(f, "bustDartLower")), 6);
  });
});

describe("draftFitted", () => {
  it("swaps in the darted front but reuses the tee's back and sleeve verbatim", () => {
    const m = STANDARD_M;
    const block = draftFitted(m);
    expect(rolePiece(block, "front").name).toBe("fitted front");
    expect(rolePiece(block, "front").dart).toBeDefined();
    expect(rolePiece(block, "back")).toEqual(draftBack(m));
    expect(rolePiece(block, "sleeve")).toEqual(draftSleeve(m));
  });
});
