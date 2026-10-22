import { describe, it, expect } from "vitest";
import { derive, STANDARD_M } from "./measurements";
import { draftFront, draftBack, draftSleeve } from "./tshirt";
import { draftFittedFront, draftFitted, fittedGuidance, fittedGeometryPair, reopenFittedReference, FITTED_DART_OPTIONS } from "./fitted";
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { dartIntake, dartOf, edgesMeet, seamKink } from "./dart";
import { rolePiece } from "./block";
import { point } from "../geometry";
import { rotatePoint } from "../geometry/rotate";
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

  it("opens the dart from the closed reference and preserves the back seam length", () => {
    const back = draftBack(STANDARD_M);
    const closed = fittedGeometryPair(draftFitted(STANDARD_M)).dartClosedReference;
    const frontSide =
      edgeLength(pieceEdge(f, "sideUpper")) + edgeLength(pieceEdge(f, "sideLower"));
    expect(frontSide).toBeCloseTo(edgeLength(pieceEdge(back, "side")), 6);
    expect(edgeLength(pieceEdge(f, "sideLower")))
      .toBeCloseTo(edgeLength(pieceEdge(closed, "sideLower")), 6);
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
    const upperMouth = edgeStart(pieceEdge(front, "bustDartUpper"));
    const openSideHem = rotatePoint(point(d.chestWidthHalf, STANDARD_M.length), apex,
      2 * Math.atan2(2, upperMouth.x - apex.x));
    expect(edgeEnd(pieceEdge(front, "sideLower"))).toEqual(openSideHem);
    expect(edgeStart(pieceEdge(front, "hem"))).toEqual(openSideHem);
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
    const openSideHem = rotatePoint(point(d.chestWidthHalf, STANDARD_M.length), apex,
      2 * Math.atan2(3, upperMouth.x - apex.x));
    expect(edgeEnd(pieceEdge(front, "sideLower"))).toEqual(openSideHem);
  });
});

describe("fittedGeometryPair", () => {
  it("closes the side dart, then traces a continuous level and square reference", () => {
    const block = draftFitted(STANDARD_M);
    const { openPattern, dartClosedBeforeTrueing, dartClosedReference } = fittedGeometryPair(block);
    const front = rolePiece(block, "front");
    const cfHem = edgeStart(pieceEdge(front, "centerFront"));
    const refUpper = pieceEdge(dartClosedReference, "sideUpper");
    const refLower = pieceEdge(dartClosedReference, "sideLower");
    const sideStart = edgeStart(refUpper);
    const sideMouth = edgeEnd(refUpper);
    const sideEnd = edgeEnd(refLower);
    const hem = pieceEdge(dartClosedReference, "hem");

    expect(openPattern).toBe(front);
    expect(openPattern.dart).toEqual({ legs: ["bustDartUpper", "bustDartLower"] });
    expect(dartClosedBeforeTrueing.dart).toEqual({ legs: ["bustDartUpper", "bustDartLower"] });
    expect(edgesMeet(dartClosedBeforeTrueing, "sideUpper", "sideLower")).toBe(true);
    expect(dartClosedReference.dart).toBeUndefined();
    expect(refUpper).toEqual(pieceEdge(dartClosedBeforeTrueing, "sideUpper"));
    expect(edgeStart(refLower)).toEqual(sideMouth);
    expect(seamKink(dartClosedReference, "sideUpper", "sideLower")).toBeCloseTo(0, 6);
    expect(edgeLength(refUpper) + edgeLength(refLower)).toBeCloseTo(
      edgeLength(pieceEdge(rolePiece(block, "back"), "side")),
      6,
    );
    expect(sideEnd).toEqual(point(sideStart.x, STANDARD_M.length));
    expect(edgeStart(hem)).toEqual(sideEnd);
    expect(edgeEnd(hem)).toEqual(cfHem);
    expect(edgeStart(hem).y).toBe(edgeEnd(hem).y);
    expect(edgeEnd(hem)).toEqual(point(0, STANDARD_M.length));
    const dart = dartOf(openPattern)!;
    expect(reopenFittedReference(dartClosedReference, dart.apex, dartIntake(openPattern))).toEqual(openPattern);

    const edges = dartClosedReference.edges;
    edges.forEach((edge, index) => {
      expect(edgeEnd(edge)).toEqual(edgeStart(edges[(index + 1) % edges.length]));
    });
  });

  it("builds the traced side and level hem from supported boundary dart options", () => {
    const options = { dartIntake: 8, bustApexHorizontal: 80, bustApexVertical: 80 };
    const block = draftFitted(STANDARD_M, options);
    const { openPattern, dartClosedBeforeTrueing, dartClosedReference } = fittedGeometryPair(block);

    expect(edgeLength(pieceEdge(openPattern, "bustDartUpper"))).toBeGreaterThan(0);
    expect(edgeLength(pieceEdge(openPattern, "bustDartLower"))).toBeGreaterThan(0);
    expect(openPattern.dart?.legs).toEqual(["bustDartUpper", "bustDartLower"]);
    expect(edgesMeet(dartClosedBeforeTrueing, "sideUpper", "sideLower")).toBe(true);
    expect(edgeStart(pieceEdge(dartClosedReference, "hem")).y)
      .toBe(edgeEnd(pieceEdge(dartClosedReference, "hem")).y);
    expect(edgeStart(pieceEdge(dartClosedReference, "hem")).y).toBe(STANDARD_M.length);
    expect(seamKink(dartClosedReference, "sideUpper", "sideLower")).toBeCloseTo(0, 6);
  });

  it("reports a side-dart closure that misses after trueing", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformedFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "sideUpper" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, y: edge.end.y + 1 } }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, front: malformedFront } };
    const pair = fittedGeometryPair(malformed);
    expect(pair.bustDartClosed).toBe(false);
  });
  it("rejects a block with no open bust dart", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const invalid = { ...block, roles: { ...block.roles, front: { ...front, dart: undefined } } };
    expect(() => fittedGeometryPair(invalid)).toThrow("requires the open bust dart");
  });

  it("rejects curved side or hem edges when reopening a traced reference", () => {
    const block = draftFitted(STANDARD_M);
    const { dartClosedReference } = fittedGeometryPair(block);
    const dart = dartOf(rolePiece(block, "front"))!;
    const apex = dart.apex;
    const curveFor = (name: string, edge: Edge): Edge => ({
      kind: "curve",
      name,
      curve: {
        start: edgeStart(edge),
        control1: edgeStart(edge),
        control2: edgeEnd(edge),
        end: edgeEnd(edge),
      },
    });
    const referenceWithCurve = (name: "sideLower" | "hem"): Piece => ({
      ...dartClosedReference,
      edges: dartClosedReference.edges.map((edge) => edge.name === name ? curveFor(name, edge) : edge),
    });

    expect(() => reopenFittedReference(referenceWithCurve("sideLower"), apex, dartIntake(rolePiece(block, "front"))))
      .toThrow("requires straight side edges");
    expect(() => reopenFittedReference(referenceWithCurve("hem"), apex, dartIntake(rolePiece(block, "front"))))
      .toThrow("requires a straight hem");
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
    expect(sideHem).toEqual(rotatePoint(point(d.chestWidthHalf, m.length), apex,
      2 * Math.atan2(3, upperMouth.x - apex.x)));
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

  it("warns when the lower mouth reaches the level hem in the closed reference", () => {
    const measurements = { ...STANDARD_M, length: 52, armholeDepth: 34 };
    const options = { dartIntake: 8, bustApexVertical: 80 };
    const notes = fittedGuidance(draftFitted(measurements, options), measurements, options);

    expect(notes).toContainEqual(expect.objectContaining({
      level: "warn",
      field: "option-bustApexVertical",
      text: expect.stringContaining("lower bust-dart mouth reaches the hem line"),
    }));
  });

  it("warns when reopening the side dart carries the hem across the center-front fold", () => {
    const options = { dartIntake: 8, bustApexHorizontal: 80, bustApexVertical: 20 };
    const notes = fittedGuidance(draftFitted(STANDARD_M, options), STANDARD_M, options);

    expect(notes).toContainEqual(expect.objectContaining({
      level: "warn",
      field: "option-bustApexHorizontal",
      text: expect.stringContaining("across the center-front fold"),
    }));
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
