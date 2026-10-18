import { describe, it, expect } from "vitest";
import { derive, STANDARD_M } from "./measurements";
import { draftFront, draftBack, draftSleeve } from "./tshirt";
import { draftFittedFront, draftFitted, fittedGuidance, FITTED_DART_OPTIONS } from "./fitted";
import { pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { rolePiece } from "./block";
import { point } from "../geometry";
import { FITTED } from "./recipe";

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

  it("keeps the existing dart geometry as disclosed recipe defaults", () => {
    const d = derive(STANDARD_M);
    const bustY = STANDARD_M.armholeDepth + (STANDARD_M.length - STANDARD_M.armholeDepth) * 0.28;
    const front = draftFittedFront(STANDARD_M);

    expect(FITTED.options).toEqual(FITTED_DART_OPTIONS);
    expect(FITTED_DART_OPTIONS.map((option) => option.defaultValue)).toEqual([4, 55, 28]);
    expect(edgeStart(pieceEdge(front, "bustDartUpper"))).toEqual(point(d.chestWidthHalf, bustY - 2));
    const apex = edgeEnd(pieceEdge(front, "bustDartUpper"));
    expect(apex.x).toBeCloseTo(d.chestWidthHalf * 0.55);
    expect(apex.y).toBeCloseTo(bustY);
    expect(edgeEnd(pieceEdge(front, "bustDartLower"))).toEqual(point(d.chestWidthHalf, bustY + 2));
    expect(edgeEnd(pieceEdge(front, "sideLower"))).toEqual(point(d.chestWidthHalf, STANDARD_M.length + 4));
  });

  it("uses the selected intake and both apex positions in the drafted geometry", () => {
    const d = derive(STANDARD_M);
    const options = { dartIntake: 6, bustApexHorizontal: 65, bustApexVertical: 40 };
    const bustY = STANDARD_M.armholeDepth + (STANDARD_M.length - STANDARD_M.armholeDepth) * 0.4;
    const front = draftFittedFront(STANDARD_M, options);

    const upperMouth = edgeStart(pieceEdge(front, "bustDartUpper"));
    expect(upperMouth.x).toBeCloseTo(d.chestWidthHalf);
    expect(upperMouth.y).toBeCloseTo(bustY - 3);
    const apex = edgeEnd(pieceEdge(front, "bustDartUpper"));
    const lowerMouth = edgeEnd(pieceEdge(front, "bustDartLower"));
    expect(apex.x).toBeCloseTo(d.chestWidthHalf * 0.65);
    expect(apex.y).toBeCloseTo(bustY);
    expect(lowerMouth.x).toBeCloseTo(d.chestWidthHalf);
    expect(lowerMouth.y).toBeCloseTo(bustY + 3);
    expect(edgeEnd(pieceEdge(front, "sideLower"))).toEqual(point(d.chestWidthHalf, STANDARD_M.length + 6));
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

  it("threads registered recipe options through the composed fitted draft", () => {
    const m = STANDARD_M;
    const d = derive(m);
    const options = { dartIntake: 6, bustApexHorizontal: 65, bustApexVertical: 40 };
    const bustY = m.armholeDepth + (m.length - m.armholeDepth) * 0.4;
    const front = rolePiece(FITTED.draft(m, options), "front");
    const upperMouth = edgeStart(pieceEdge(front, "bustDartUpper"));
    const apex = edgeEnd(pieceEdge(front, "bustDartUpper"));
    const lowerMouth = edgeEnd(pieceEdge(front, "bustDartLower"));
    const sideHem = edgeEnd(pieceEdge(front, "sideLower"));

    expect(upperMouth.x).toBeCloseTo(d.chestWidthHalf);
    expect(upperMouth.y).toBeCloseTo(bustY - 3);
    expect(apex.x).toBeCloseTo(d.chestWidthHalf * 0.65);
    expect(apex.y).toBeCloseTo(bustY);
    expect(lowerMouth.x).toBeCloseTo(d.chestWidthHalf);
    expect(lowerMouth.y).toBeCloseTo(bustY + 3);
    expect(sideHem.x).toBeCloseTo(d.chestWidthHalf);
    expect(sideHem.y).toBeCloseTo(m.length + 6);
  });
});

describe("fittedGuidance", () => {
  it("does not warn about dart clearance for the default fitted geometry", () => {
    const block = draftFitted(STANDARD_M);
    const notes = fittedGuidance(block, STANDARD_M);

    expect(notes.filter((note) => note.field === "option-bustApexVertical")).toEqual([]);
  });

  it("warns when the upper dart mouth crosses the underarm and gives a correction", () => {
    const measurements = { ...STANDARD_M, length: 32, armholeDepth: 24 };
    const options = { dartIntake: 8, bustApexVertical: 20 };
    const notes = fittedGuidance(draftFitted(measurements, options), measurements, options);

    expect(notes).toContainEqual(expect.objectContaining({
      level: "warn",
      field: "option-bustApexVertical",
      text: expect.stringContaining("Move the apex toward the hem or reduce dart intake"),
    }));
  });

  it("does not warn when the lower mouth is beyond nominal length but inside the extended side hem", () => {
    const measurements = { ...STANDARD_M, length: 52, armholeDepth: 34 };
    const options = { dartIntake: 8, bustApexVertical: 80 };
    const notes = fittedGuidance(draftFitted(measurements, options), measurements, options);

    expect(notes.filter((note) => note.field === "option-bustApexVertical")).toEqual([]);
  });

  it("warns when the lower dart mouth reaches the actual side hem and gives a correction", () => {
    const measurements = { ...STANDARD_M, length: 32, armholeDepth: 24 };
    const options = { dartIntake: 8, bustApexVertical: 150 };
    const notes = fittedGuidance(draftFitted(measurements, options), measurements, options);

    expect(notes).toContainEqual(expect.objectContaining({
      level: "warn",
      field: "option-bustApexVertical",
      text: expect.stringContaining("Move the apex toward the underarm or reduce dart intake"),
    }));
  });

  it("warns when armhole depth leaves no vertical space for the dart", () => {
    const measurements = { ...STANDARD_M, length: 24, armholeDepth: 24 };
    const notes = fittedGuidance(draftFitted(measurements), measurements);

    expect(notes).toContainEqual(expect.objectContaining({
      level: "warn",
      field: "armholeDepth",
      text: expect.stringContaining("Reduce armhole depth or increase body length"),
    }));
  });
});
