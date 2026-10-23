import { describe, it, expect } from "vitest";
import { derive, STANDARD_M } from "./measurements";
import { draftFront, draftBack, draftSleeve, TEE_V_NECK_DROP_OPTION_ID } from "./tshirt";
import { draftFittedFront, draftFitted, fittedGuidance, fittedGeometryPair, reopenFittedReference, FITTED_DART_OPTIONS,
  FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID, FITTED_VNECK_ENTRY_ID, sideBoundaryAtY, draftFittedPrincessFronts } from "./fitted";
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { dartIntake, dartOf, edgesMeet, seamKink } from "./dart";
import { rolePiece } from "./block";
import { point } from "../geometry";
import { rotatePoint } from "../geometry/rotate";
import { FITTED } from "./recipe";
import { defaultGarmentOptions } from "./options";
import { stitchChecks } from "./stitch";
import { fittedPanelChecks } from "./fitted-tables";

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

    expect(FITTED.options).toEqual(FITTED_OPTIONS);
    expect(FITTED_OPTIONS.slice(0, FITTED_DART_OPTIONS.length)).toEqual(FITTED_DART_OPTIONS);
    expect(FITTED_DART_OPTIONS.slice(0, 3).map((option) => option.defaultValue)).toEqual([4, 55, 28]);
    expect(FITTED_DART_OPTIONS.slice(3).map((option) => option.defaultValue)).toEqual([43, 2, 10, 45]);
    expect(defaultGarmentOptions(FITTED_DART_OPTIONS)).not.toHaveProperty("waistDartIntake");
    expect(defaultGarmentOptions(FITTED_DART_OPTIONS, "fitted-waist-dart-tee-digital-v1"))
      .toMatchObject({ waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45 });
    expect(rolePiece(FITTED.draft(STANDARD_M, defaultGarmentOptions(FITTED_DART_OPTIONS)), "front").marks).toBeUndefined();
    expect(rolePiece(FITTED.draft(STANDARD_M,
      defaultGarmentOptions(FITTED_DART_OPTIONS, "fitted-waist-dart-tee-digital-v1")), "front").marks).toHaveLength(2);
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

  it("adds an entry-scoped V neckline while retaining the F04 bust dart and F01 crew default", () => {
    const f01Options = defaultGarmentOptions(FITTED_OPTIONS, "fitted-tee-digital-v1");
    const f04Options = defaultGarmentOptions(FITTED_OPTIONS, FITTED_VNECK_ENTRY_ID);
    const crewFront = rolePiece(draftFitted(STANDARD_M, f01Options), "front");
    const vNeckFront = rolePiece(draftFitted(STANDARD_M, f04Options), "front");

    expect(f01Options).not.toHaveProperty(TEE_V_NECK_DROP_OPTION_ID);
    expect(f04Options[TEE_V_NECK_DROP_OPTION_ID]).toBe(5);
    expect(pieceEdge(vNeckFront, "neckline")).not.toEqual(pieceEdge(crewFront, "neckline"));
    expect(vNeckFront.dart).toEqual({ legs: ["bustDartUpper", "bustDartLower"] });
    expect(pieceEdge(vNeckFront, "bustDartUpper")).toEqual(pieceEdge(crewFront, "bustDartUpper"));
    expect(fittedGuidance(draftFitted(STANDARD_M, f04Options), STANDARD_M, f04Options)
      .filter((note) => note.level === "warn")).toEqual([]);

    const invalid = { ...f04Options, [TEE_V_NECK_DROP_OPTION_ID]: 20 };
    expect(fittedGuidance(draftFitted(STANDARD_M, invalid), STANDARD_M, invalid)
      .find((note) => note.field === `option-${TEE_V_NECK_DROP_OPTION_ID}`)?.text).toContain("reduce the V drop or increase armhole depth");
    expect(invalid[TEE_V_NECK_DROP_OPTION_ID]).toBe(20);
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

describe("F03 princess-seam fitted Tee", () => {
  const options = defaultGarmentOptions(FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID);

  it("drafts closed center and mirrored side-front panels with a continuously true digital seam", () => {
    const block = draftFitted(STANDARD_M, options);
    const center = rolePiece(block, "front");
    const side = rolePiece(block, "frontSide");
    const centerUpper = pieceEdge(center, "princessUpper");
    const centerLower = pieceEdge(center, "princessLower");
    const sideLower = pieceEdge(side, "princessLower");
    const sideUpper = pieceEdge(side, "princessUpper");

    expect(center.onFold).toBe(true);
    expect(side.onFold).toBe(false);
    expect(center.dart).toBeUndefined();
    expect(side.dart).toBeUndefined();
    expect(edgeEnd(pieceEdge(center, "shoulder"))).toEqual(edgeStart(centerUpper));
    expect(edgeEnd(centerUpper)).toEqual(edgeStart(centerLower));
    expect(edgeEnd(centerLower)).toEqual(edgeStart(pieceEdge(center, "hem")));
    expect(edgeEnd(sideLower)).toEqual(edgeStart(sideUpper));
    expect(edgeLength(centerUpper) + edgeLength(centerLower))
      .toBeCloseTo(edgeLength(sideUpper) + edgeLength(sideLower), 9);
    expect(block.stitches.find((stitch) => stitch.label === "Sleeve-cap ease")?.b.edges[0])
      .toMatchObject({ piece: "frontSide", edge: "armhole" });
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
    expect(fittedPanelChecks(block).every((check) => check.ok)).toBe(true);
    expect(fittedGuidance(block, STANDARD_M, options).filter((note) => note.level === "warn")).toEqual([]);
  });

  it("flags invalid princess controls without changing the entered value", () => {
    const invalid = { ...options, princessSeamShaping: 7 };
    const notes = fittedGuidance(draftFitted(STANDARD_M, invalid), STANDARD_M, invalid);
    expect(notes.find((note) => note.field === "option-princessSeamShaping")?.text)
      .toContain("between 0 and 6 cm");
    expect(invalid.princessSeamShaping).toBe(7);
  });

  it("applies omitted digital controls from their declared defaults", () => {
    const partialOptions = { princessSeamShaping: options.princessSeamShaping };
    const directPieces = draftFittedPrincessFronts(STANDARD_M, {});
    expect(Object.keys(directPieces)).toEqual(["front", "frontSide"]);

    const block = draftFitted(STANDARD_M, partialOptions);
    expect(fittedGuidance(block, STANDARD_M, partialOptions).filter((note) => note.level === "warn")).toEqual([]);
  });

  it("reports invalid apex and shoulder controls without clamping", () => {
    const invalid = {
      ...options,
      princessApexHorizontal: 81,
      princessApexVertical: 81,
      princessShoulderOrigin: 81,
    };
    const block = draftFitted(STANDARD_M, options);
    const notes = fittedGuidance(block, STANDARD_M, invalid);
    expect(notes.map((note) => note.field)).toEqual(expect.arrayContaining([
      "option-princessApexHorizontal", "option-princessApexVertical", "option-princessShoulderOrigin",
    ]));
  });

  it("stops with an actionable warning when a digital control is non-finite", () => {
    const invalid = { ...options, princessApexHorizontal: Number.NaN };
    const block = draftFitted(STANDARD_M, options);
    const note = fittedGuidance(block, STANDARD_M, invalid).find((candidate) => candidate.level === "warn");
    expect(note?.field).toBe("option-princessSeamShaping");
    expect(note?.text).toContain("must be finite numbers");
  });

  it("warns when a princess seam has finite but untrued panel geometry", () => {
    const block = draftFitted(STANDARD_M, options);
    const center = rolePiece(block, "front");
    const centerUpper = pieceEdge(center, "princessUpper");
    expect(centerUpper.kind).toBe("curve");
    if (centerUpper.kind !== "curve") throw new Error("Expected the authored princess edge to be curved.");
    const centerAsLine = {
      ...center,
      edges: center.edges.map((edge) => edge.name === "princessUpper"
        ? { kind: "line" as const, name: edge.name, start: centerUpper.curve.start, end: centerUpper.curve.end }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, front: centerAsLine } };
    const note = fittedGuidance(malformed, STANDARD_M, options).find((candidate) => candidate.field === "option-princessSeamShaping");
    expect(note?.text).toContain("incomplete, non-finite, or untrued");
  });

  it("orients princess handles when a malformed reference reverses the shoulder-to-hem axis", () => {
    const reversed = { ...STANDARD_M, length: -20 };
    const pieces = draftFittedPrincessFronts(reversed, options);
    const centerUpper = pieceEdge(pieces.front, "princessUpper");
    const sideUpper = pieceEdge(pieces.frontSide, "princessUpper");
    expect(centerUpper.kind).toBe("curve");
    expect(sideUpper.kind).toBe("curve");
    expect(edgeLength(centerUpper)).toBeCloseTo(edgeLength(sideUpper), 8);
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

  it("adds two internal F02 waist-dart marks without changing F01's cutting outline", () => {
    const fittedOptions = { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 };
    const waistOptions = { ...fittedOptions, waistDartWaistlineFromHps: 43, waistDartIntake: 2,
      waistDartLength: 10, waistDartPosition: 45 };
    const f01 = draftFittedFront(STANDARD_M, fittedOptions);
    const f02 = draftFittedFront(STANDARD_M, waistOptions);
    const line = (name: string) => {
      const mark = f02.marks?.find((candidate) => candidate.name === name);
      if (!mark || !("start" in mark)) throw new Error(`Missing line mark ${name}`);
      return mark;
    };
    const upper = line("waistDartUpperLeg");
    const lower = line("waistDartLowerLeg");

    expect(f01.marks).toBeUndefined();
    expect(f02.edges).toEqual(f01.edges);
    expect(upper).toMatchObject({ kind: "placementLine", label: "WAIST DART", labelRole: "instruction" });
    expect(upper.start.y).toBe(43);
    expect(lower.start.y).toBe(43);
    expect(upper.end.y).toBe(33);
    expect(lower.end).toEqual(upper.end);
    expect(upper.start.x).toBeLessThan(lower.start.x);
    expect(lower.start.x - upper.start.x).toBeCloseTo(2);
    const boundary = sideBoundaryAtY(f02, 43);
    expect(boundary).not.toBeNull();
    expect((upper.start.x + lower.start.x) / 2).toBeCloseTo(boundary! * 0.45);
  });

  it("uses disclosed F02 defaults for omitted controls and does not clamp a missing-side depth", () => {
    const d = derive(STANDARD_M);
    const omitted = draftFittedFront(STANDARD_M, { waistDartIntake: 2 });
    const defaultUpper = omitted.marks?.find((mark) => mark.name === "waistDartUpperLeg");
    if (!defaultUpper || !("start" in defaultUpper)) throw new Error("Missing default waist-dart mark");
    const boundary = sideBoundaryAtY(omitted, 43)!;
    expect(defaultUpper.start.x).toBeCloseTo(boundary * 0.45 - 1, 12);
    expect(defaultUpper.start.y).toBe(43);
    expect(defaultUpper.end.x).toBeCloseTo(boundary * 0.45, 12);
    expect(defaultUpper.end.y).toBe(33);

    // This raw invalid depth is outside either fitted side segment. Drafting
    // keeps the entered value visible; fittedGuidance explains the error.
    const outside = draftFittedFront(STANDARD_M, { waistDartWaistlineFromHps: 200, waistDartIntake: 2 });
    const outsideUpper = outside.marks?.find((mark) => mark.name === "waistDartUpperLeg");
    if (!outsideUpper || !("start" in outsideUpper)) throw new Error("Missing raw out-of-range waist-dart mark");
    expect(outsideUpper.start.x).toBeCloseTo(d.chestWidthHalf * 0.45 - 1, 12);
    expect(outsideUpper.start.y).toBe(200);
    expect(outsideUpper.end.x).toBeCloseTo(d.chestWidthHalf * 0.45, 12);
    expect(outsideUpper.end.y).toBe(190);
  });

  it("returns only an unambiguous fitted-side boundary at the requested vertical level", () => {
    const front = draftFittedFront(STANDARD_M);
    expect(sideBoundaryAtY(front, 43)).not.toBeNull();
    expect(sideBoundaryAtY(front, 36.9)).toBeNull();

    const noSide: Piece = { ...front, edges: front.edges.filter((edge) => !edge.name.startsWith("side")) };
    expect(sideBoundaryAtY(noSide, 43)).toBeNull();

    const curvedSide: Piece = { ...front, edges: front.edges.map((edge) => edge.name === "sideLower"
      ? { kind: "curve" as const, name: edge.name, curve: {
        start: edgeStart(edge), control1: edgeStart(edge), control2: edgeEnd(edge), end: edgeEnd(edge),
      } }
      : edge) };
    expect(sideBoundaryAtY(curvedSide, 43)).toBeNull();

    const ambiguous: Piece = { ...front, edges: front.edges.map((edge) => edge.name === "sideUpper"
      ? { kind: "line" as const, name: edge.name, start: point(8, 30), end: point(8, 50) }
      : edge) };
    expect(sideBoundaryAtY(ambiguous, 43)).toBeNull();

    const horizontal: Piece = { ...front, edges: [
      { kind: "line", name: "sideLower", start: point(4, 43), end: point(8, 43) },
    ] };
    expect(sideBoundaryAtY(horizontal, 43)).toBe(8);
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

  it("keeps valid F02 marks clear of the bust dart and does not activate them for F01", () => {
    const waistOptions = { waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45 };
    const f02Notes = fittedGuidance(draftFitted(STANDARD_M, waistOptions), STANDARD_M, waistOptions);
    expect(f02Notes.filter((note) => note.field?.startsWith("option-waistDart"))).toEqual([]);

    const f01WithDormantSettings = fittedGuidance(draftFitted(STANDARD_M), STANDARD_M, waistOptions);
    expect(f01WithDormantSettings.find((note) => note.text.includes("cross a bust-dart leg"))).toBeUndefined();
  });

  it("warns when waist-dart placement reaches the fold or side seam", () => {
    // Raw saved inputs can be outside the displayed guardrail; guidance must
    // explain the resulting collision instead of silently correcting it.
    const foldOptions = { waistDartWaistlineFromHps: 43, waistDartIntake: 6, waistDartLength: 10, waistDartPosition: 10 };
    const foldNotes = fittedGuidance(draftFitted(STANDARD_M, foldOptions), STANDARD_M, foldOptions);
    expect(foldNotes.find((note) => note.field === "option-waistDartPosition")?.text)
      .toContain("reaches the center-front fold");

    const sideOptions = { ...foldOptions, waistDartPosition: 90 };
    const sideNotes = fittedGuidance(draftFitted(STANDARD_M, sideOptions), STANDARD_M, sideOptions);
    expect(sideNotes.some((note) => note.field === "option-waistDartPosition" && note.text.includes("reaches the side seam")))
      .toBe(true);
    expect(sideNotes.some((note) => note.text.includes("cross a bust-dart leg"))).toBe(true);
  });

  it("warns for an invalid waistline, an apex past HPS, and non-finite values without clamping", () => {
    const highLine = { waistDartWaistlineFromHps: 24, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45 };
    const highLineNotes = fittedGuidance(draftFitted(STANDARD_M, highLine), STANDARD_M, highLine);
    expect(highLineNotes.find((note) => note.field === "option-waistDartWaistlineFromHps")?.text)
      .toContain("between the underarm and hem");

    const pastHps = { waistDartWaistlineFromHps: 30, waistDartIntake: 2, waistDartLength: 35, waistDartPosition: 45 };
    const pastHpsNotes = fittedGuidance(draftFitted(STANDARD_M, pastHps), STANDARD_M, pastHps);
    expect(pastHpsNotes.find((note) => note.field === "option-waistDartLength")?.text)
      .toContain("reaches the HPS neckline");

    const nonFinite = { waistDartWaistlineFromHps: 43, waistDartIntake: Number.NaN, waistDartLength: 10, waistDartPosition: 45 };
    const nonFiniteNotes = fittedGuidance(draftFitted(STANDARD_M, nonFinite), STANDARD_M, nonFinite);
    expect(nonFiniteNotes.find((note) => note.field === "option-waistDartIntake")?.text)
      .toContain("must be finite numbers");
  });

  it("warns when a waist-dart apex overlaps the bust-dart apex", () => {
    const options = { waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 6,
      waistDartPosition: 55 };
    const notes = fittedGuidance(draftFitted(STANDARD_M, options), STANDARD_M, options);
    expect(notes.find((note) => note.text.includes("too close to the bust-dart apex"))).toBeDefined();
  });

  it("measures waist-dart clearance from the side-boundary width used by the draft", () => {
    const waistline = 43;
    const sideX = sideBoundaryAtY(draftFittedFront(STANDARD_M), waistline)!;
    const bustApex = dartOf(rolePiece(draftFitted(STANDARD_M), "front"))!.apex;
    const position = (bustApex.x + 1.9) / sideX * 100;
    const chestWidthEstimate = derive(STANDARD_M).chestWidthHalf * position / 100;
    expect(position).toBeGreaterThan(20);
    expect(position).toBeLessThan(80);
    expect(Math.abs(chestWidthEstimate - bustApex.x)).toBeGreaterThan(2);

    const options = {
      waistDartWaistlineFromHps: waistline,
      waistDartIntake: 2,
      waistDartLength: waistline - bustApex.y,
      waistDartPosition: position,
    };
    const notes = fittedGuidance(draftFitted(STANDARD_M, options), STANDARD_M, options);
    expect(notes.find((note) => note.text.includes("too close to the bust-dart apex"))).toBeDefined();
  });

  it("withholds bust-apex clearance when the waistline falls in the opened side gap", () => {
    const options = {
      waistDartWaistlineFromHps: 35.5,
      waistDartIntake: 2,
      waistDartLength: 10,
      waistDartPosition: 45,
    };
    expect(sideBoundaryAtY(draftFittedFront(STANDARD_M), options.waistDartWaistlineFromHps)).toBeNull();
    const notes = fittedGuidance(draftFitted(STANDARD_M, options), STANDARD_M, options);
    expect(notes.find((note) => note.field === "option-waistDartWaistlineFromHps")?.text)
      .toContain("outside the bust-dart opening");
    expect(notes.find((note) => note.text.includes("too close to the bust-dart apex"))).toBeUndefined();
  });
});
