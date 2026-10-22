import { describe, expect, it } from "vitest";
import { cubicLength, point } from "../geometry";
import { STANDARD_M } from "./measurements";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { rolePiece, type Block } from "./block";
import { edgeStart, pieceEdge, type Edge } from "./piece";
import {
  bodyRaglanCurve,
  curveAtLength,
  draftRaglanTshirt,
  necklinePrefix,
  raglanTeeGuidance,
} from "./tshirt-raglan";

function withEdge(block: Block, role: string, edgeName: string, replace: (edge: Edge) => Edge): Block {
  const piece = rolePiece(block, role);
  return {
    ...block,
    roles: {
      ...block.roles,
      [role]: {
        ...piece,
        edges: piece.edges.map((edge) => edge.name === edgeName ? replace(edge) : edge),
      },
    },
  };
}

describe("Raglan Tee seam geometry", () => {
  it("splits line and curve neckline edges at the same proportional join", () => {
    const line = necklineEdge("front", 6, 8, 30, 24, { ...NECKLINE_DEFAULT, shape: "v" }).edge;
    const [linePrefix, lineJoin] = necklinePrefix(line, 0.5);
    expect(linePrefix.kind).toBe("line");
    expect(lineJoin).toEqual(point(3, 4));

    const curve = necklineEdge("front", 6, 8, 30, 24).edge;
    const [curvePrefix, curveJoin] = necklinePrefix(curve, 0.5);
    if (curvePrefix.kind !== "curve") throw new Error("The crew neckline must be curved.");
    expect(curveJoin).toEqual(curvePrefix.curve.end);
  });

  it("bounds zero-chord, non-finite, short, and fitted seam-length cases", () => {
    const start = point(0, 0);
    const end = point(3, 4);
    const short = curveAtLength(start, end, 5, 1);
    expect(cubicLength(short)).toBeCloseTo(5, 6);
    const nonFinite = curveAtLength(start, end, Number.POSITIVE_INFINITY, -1);
    expect(cubicLength(nonFinite)).toBeCloseTo(5, 6);
    const fitted = curveAtLength(start, end, 8, -1);
    expect(cubicLength(fitted)).toBeCloseTo(8, 2);
    const zeroChord = curveAtLength(start, start, 1, 1);
    expect(cubicLength(zeroChord)).toBe(0);
    expect(bodyRaglanCurve(start, start)).toEqual({ start, control1: start, control2: start, end: start });
  });

  it("applies an explicit chest-ease override to both body panels", () => {
    const defaultBlock = draftRaglanTshirt(STANDARD_M);
    const easedBlock = draftRaglanTshirt(STANDARD_M, { chestEase: 14 });
    expect(edgeStart(pieceEdge(rolePiece(defaultBlock, "front"), "side")).x).toBe(27.5);
    expect(edgeStart(pieceEdge(rolePiece(easedBlock, "front"), "side")).x).toBe(28.5);
    expect(edgeStart(pieceEdge(rolePiece(defaultBlock, "back"), "side")).x).toBe(27.5);
    expect(edgeStart(pieceEdge(rolePiece(easedBlock, "back"), "side")).x).toBe(28.5);
  });

  it("gives shallow-armhole and mismatched-seam guidance without changing measurements", () => {
    const shallow = { ...STANDARD_M, armholeDepth: 1 };
    const shallowBlock = draftRaglanTshirt(shallow);
    expect(raglanTeeGuidance(shallowBlock, shallow).some((note) => note.field === "armholeDepth")).toBe(true);

    const standardBlock = draftRaglanTshirt(STANDARD_M);
    const sleeve = rolePiece(standardBlock, "sleeve");
    const frontRaglan = pieceEdge(sleeve, "frontRaglan");
    if (frontRaglan.kind !== "curve") throw new Error("The front Raglan interface must be curved.");
    const brokenRaglan = withEdge(standardBlock, "sleeve", "frontRaglan", (edge) => {
      if (edge.kind !== "curve") throw new Error("The front Raglan interface must be curved.");
      return {
        ...edge,
        curve: {
          start: edge.curve.start,
          control1: point(edge.curve.start.x, edge.curve.start.y + 8),
          control2: point(edge.curve.end.x, edge.curve.end.y + 8),
          end: edge.curve.end,
        },
      };
    });
    expect(raglanTeeGuidance(brokenRaglan, STANDARD_M).some((note) => note.field === "bicep" && note.text.includes("Front raglan seam"))).toBe(true);

    const brokenSide = withEdge(standardBlock, "front", "side", (edge) => {
      if (edge.kind !== "line") throw new Error("The body side interface must be straight.");
      return { ...edge, end: point(edge.end.x, edge.end.y + 5) };
    });
    expect(raglanTeeGuidance(brokenSide, STANDARD_M).some((note) => note.field === "sleeveLength" && note.text.includes("Side seam"))).toBe(true);
  });
});
