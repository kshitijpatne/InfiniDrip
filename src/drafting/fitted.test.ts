import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftFront, draftBack, draftSleeve } from "./tshirt";
import { draftFittedFront, draftFitted } from "./fitted";
import { pieceEdge, edgeStart, edgeEnd } from "./piece";

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

  it("reuses the tee front's neckline, shoulder, armhole, hem and centre edges", () => {
    const tee = draftFront(STANDARD_M);
    for (const name of ["neckline", "shoulder", "armhole", "hem", "centerFront"]) {
      expect(pieceEdge(f, name)).toEqual(pieceEdge(tee, name));
    }
  });
});

describe("draftFitted", () => {
  it("swaps in the darted front but reuses the tee's back and sleeve verbatim", () => {
    const m = STANDARD_M;
    const block = draftFitted(m);
    expect(block.front.name).toBe("fitted front");
    expect(block.front.dart).toBeDefined();
    expect(block.back).toEqual(draftBack(m));
    expect(block.sleeve).toEqual(draftSleeve(m));
  });
});
