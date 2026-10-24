import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { block } from "./block";
import { DEFAULT_JEANS_OPTIONS, type JeansOptions } from "./jeans-contract";
import { buildJeansFly } from "./jeans-fly";
import { pointMark } from "./pattern-mark";
import { edgeLength, pieceEdge, type Edge, type Piece } from "./piece";
import { stitchChecks } from "./stitch";

function frontPiece(
  side: -1 | 1,
  crotchY = 32,
  waistWidth = 14,
  pocketX = 8,
  existingMarks = false,
): Piece {
  const pocketCurve = {
    start: point(side * pocketX, 0),
    control1: point(side * (pocketX + 0.5), 2),
    control2: point(side * (pocketX + 1), 6),
    end: point(side * (pocketX + 1.5), 10),
  };
  const marks = existingMarks ? [pointMark("placementPoint", "priorMark", point(1, 1))] : undefined;
  return {
    name: side < 0 ? "jeans front right test" : "jeans front left test",
    onFold: false,
    edges: [
      { kind: "line", name: "waist", start: point(0, 0), end: point(side * waistWidth, 0) },
      { kind: "line", name: "side", start: point(side * waistWidth, 0), end: point(side * waistWidth, crotchY) },
      { kind: "line", name: "centerFront", start: point(0, crotchY), end: point(0, 0) },
      { kind: "curve", name: "pocketOpening", curve: pocketCurve },
    ],
    ...(marks ? { marks } : {}),
  };
}

function options(patch: Partial<JeansOptions> = {}): JeansOptions {
  return { ...DEFAULT_JEANS_OPTIONS, ...patch };
}

function draftFly(
  optionPatch: Partial<JeansOptions> = {},
  left = frontPiece(1),
  right = frontPiece(-1),
) {
  return buildJeansFly(left, right, options(optionPatch));
}

describe("Jeans asymmetric fly", () => {
  it("adds the wearer-right integral extension, facing/underlap, shield, landmarks, and matching interfaces", () => {
    const fly = draftFly({}, frontPiece(1, 32, 14, 8, true), frontPiece(-1, 32, 14, 8, true));
    const extensionJoin = pieceEdge(fly.frontRight, "flyExtensionJoin");
    const facingJoin = pieceEdge(fly.facingUnderlapRight, "frontJoin");
    const shieldJoin = pieceEdge(fly.facingUnderlapRight, "shieldJoin");
    const shieldUnderlap = pieceEdge(fly.shield, "underlapJoin");
    expect(extensionJoin).toMatchObject({
      kind: "line",
      start: { x: DEFAULT_JEANS_OPTIONS.flyExtensionWidth, y: DEFAULT_JEANS_OPTIONS.flyLength },
      end: { x: DEFAULT_JEANS_OPTIONS.flyExtensionWidth, y: 0 },
    });
    expect(edgeLength(extensionJoin)).toBe(DEFAULT_JEANS_OPTIONS.flyLength);
    expect(edgeLength(facingJoin)).toBeCloseTo(DEFAULT_JEANS_OPTIONS.flyLength);
    expect(edgeLength(shieldJoin)).toBeCloseTo(edgeLength(shieldUnderlap));
    expect(fly.frontRight.marks?.map(({ name }) => name)).toContain("priorMark");
    expect(fly.frontRight.marks?.map(({ name }) => name)).toContain("flyExtensionFold");
    expect(fly.frontLeft.marks?.map(({ name }) => name)).toContain("flyCoverStitch");
    expect(fly.facingUnderlapRight.marks?.map(({ name }) => name)).toEqual([
      "zipperPlacement", "zipperStopNotch",
    ]);
    expect(fly.shield.marks?.map(({ name }) => name)).toEqual([
      "shieldFold", "flyBartackUpper", "flyBartackLower",
    ]);
    const assembled = block({
      frontRight: fly.frontRight,
      flyFacingUnderlapRight: fly.facingUnderlapRight,
      flyShield: fly.shield,
    }, fly.stitches);
    expect(stitchChecks(assembled, fly.stitches).filter(({ ok }) => !ok)).toEqual([]);
  });

  it("keeps supported fly length and width endpoints live", () => {
    for (const endpoint of [
      { flyLength: 8, flyExtensionWidth: 2.5 },
      { flyLength: 25, flyExtensionWidth: 5 },
    ]) {
      const fly = draftFly(endpoint);
      expect(edgeLength(pieceEdge(fly.frontRight, "flyExtensionJoin"))).toBe(endpoint.flyLength);
      expect(edgeLength(pieceEdge(fly.facingUnderlapRight, "frontJoin"))).toBe(endpoint.flyLength);
      expect(pieceEdge(fly.frontRight, "waist")).toMatchObject({
        kind: "line",
        start: { x: endpoint.flyExtensionWidth, y: 0 },
      });
      const zipper = fly.facingUnderlapRight.marks?.find(({ name }) => name === "zipperPlacement");
      expect(zipper).toMatchObject({
        kind: "placementLine",
        start: { x: endpoint.flyExtensionWidth / 2, y: 0 },
        end: { x: endpoint.flyExtensionWidth / 2, y: endpoint.flyLength },
      });
    }
  });

  it("rejects unsupported raw ranges without clamping", () => {
    for (const patch of [
      { flyLength: 7 },
      { flyLength: 26 },
      { flyLength: Number.NaN },
      { flyExtensionWidth: 2 },
      { flyExtensionWidth: 5.5 },
      { flyExtensionWidth: Number.POSITIVE_INFINITY },
    ]) {
      expect(() => draftFly(patch)).toThrow(RangeError);
    }
  });

  it("reports rise, waist, and pocket conflicts with field-specific corrections", () => {
    expect(() => draftFly({ flyLength: 25 }, frontPiece(1, 24), frontPiece(-1, 24)))
      .toThrow(/flyLength .* wearer-left front crotch transition .* reduce flyLength/);
    expect(() => draftFly({ flyExtensionWidth: 5 }, frontPiece(1), frontPiece(-1, 24, 5)))
      .toThrow(/less than 1 cm on the wearer-right waist edge/);
    expect(() => draftFly({}, frontPiece(1, 32, 14, 2), frontPiece(-1)))
      .toThrow(/flyLength .* flyExtensionWidth .* allowance-based 1\.6 cm .* frontPocketOpening/);
  });

  it("fails closed for invalid source edges, non-finite pocket data, or misaligned waist landmarks", () => {
    const wrongPocket = frontPiece(1);
    const wrongPocketEdges: Edge[] = wrongPocket.edges.map((edge) => edge.name === "pocketOpening"
      ? { kind: "line", name: edge.name, start: point(8, 0), end: point(9, 10) }
      : edge);
    expect(() => draftFly({}, { ...wrongPocket, edges: wrongPocketEdges }, frontPiece(-1)))
      .toThrow(/pocket edge to be curved/);

    const wrongCenter = frontPiece(-1);
    const wrongCenterEdges: Edge[] = wrongCenter.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "curve", name: edge.name, curve: {
        start: point(0, 32), control1: point(0, 20), control2: point(0, 10), end: point(0, 0),
      } }
      : edge);
    expect(() => draftFly({}, frontPiece(1), { ...wrongCenter, edges: wrongCenterEdges }))
      .toThrow(/centerFront.*to be straight/);

    const nonFinitePocket = frontPiece(1);
    const nonFinitePocketEdges: Edge[] = nonFinitePocket.edges.map((edge) => edge.name === "pocketOpening" && edge.kind === "curve"
      ? { ...edge, curve: { ...edge.curve, control1: point(Number.NaN, 2) } }
      : edge);
    expect(() => draftFly({}, { ...nonFinitePocket, edges: nonFinitePocketEdges }, frontPiece(-1)))
      .toThrow(/non-finite front pocket opening/);

    const misaligned = frontPiece(-1);
    const misalignedEdges: Edge[] = misaligned.edges.map((edge) => edge.name === "waist"
      ? { ...edge, start: point(0, 1) }
      : edge);
    expect(() => draftFly({}, frontPiece(1), { ...misaligned, edges: misalignedEdges }))
      .toThrow(/must share the live wearer-right waist interface/);
  });

  it("rejects a non-center crotch point and a wearer-left cover that misses the waist", () => {
    const offCenter = frontPiece(-1);
    const offCenterEdges: Edge[] = offCenter.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(1, 32), end: point(0, 0) }
      : edge);
    expect(() => draftFly({}, frontPiece(1), { ...offCenter, edges: offCenterEdges }))
      .toThrow(/live front crotch transition/);

    const invalidCover = frontPiece(1);
    const invalidCoverEdges: Edge[] = invalidCover.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(1, 32), end: point(1, 0) }
      : edge);
    expect(() => draftFly({}, { ...invalidCover, edges: invalidCoverEdges }, frontPiece(-1)))
      .toThrow(/wearer-left front waist at center front/);

    const invalidCoverTopY = frontPiece(1);
    const invalidCoverTopYEdges: Edge[] = invalidCoverTopY.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(0, 32), end: point(0, 1) }
      : edge);
    expect(() => draftFly({}, { ...invalidCoverTopY, edges: invalidCoverTopYEdges }, frontPiece(-1)))
      .toThrow(/wearer-left front waist at center front/);
  });

  it("rejects non-finite wearer-right waist and crotch geometry before extension", () => {
    const badWaist = frontPiece(-1);
    const badWaistEdges: Edge[] = badWaist.edges.map((edge) => edge.name === "waist"
      ? { ...edge, start: point(Number.NaN, 0) }
      : edge);
    expect(() => draftFly({}, frontPiece(1), { ...badWaist, edges: badWaistEdges }))
      .toThrow(/finite front waist and center-front geometry/);

    const badCrotch = frontPiece(-1);
    const badCrotchEdges: Edge[] = badCrotch.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(0, Number.NaN), end: point(0, 0) }
      : edge);
    expect(() => draftFly({}, frontPiece(1), { ...badCrotch, edges: badCrotchEdges }))
      .toThrow(/finite front waist and center-front geometry/);
  });

  it("rejects non-finite wearer-left cover landmarks", () => {
    const invalidTop = frontPiece(1);
    const invalidTopEdges: Edge[] = invalidTop.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(0, 32), end: point(0, Number.NaN) }
      : edge);
    expect(() => draftFly({}, { ...invalidTop, edges: invalidTopEdges }, frontPiece(-1)))
      .toThrow(/finite wearer-left front waist and center-front geometry/);

    const invalidCrotch = frontPiece(1);
    const invalidCrotchEdges: Edge[] = invalidCrotch.edges.map((edge) => edge.name === "centerFront"
      ? { kind: "line", name: edge.name, start: point(0, Number.NaN), end: point(0, 0) }
      : edge);
    expect(() => draftFly({}, { ...invalidCrotch, edges: invalidCrotchEdges }, frontPiece(-1)))
      .toThrow(/finite wearer-left front waist and center-front geometry/);
  });
});
