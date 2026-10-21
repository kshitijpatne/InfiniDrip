import { describe, expect, it } from "vitest";
import { blockPieces, rolePiece } from "./block";
import { edgeEnd, edgeLength, edgeStart, perimeter, pieceEdge } from "./piece";
import { interfaceLength, stitchChecks } from "./stitch";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import { DEFAULT_JEANS_OPTIONS, type JeansOptions } from "./jeans-contract";
import { draftJeansCore, jeansMetrics } from "./jeans";
import { STANDARD_M } from "./measurements";

function isClosed(piece: ReturnType<typeof rolePiece>): boolean {
  return piece.edges.every((edge, index) => {
    const next = piece.edges[(index + 1) % piece.edges.length]!;
    const end = edgeEnd(edge);
    const start = edgeStart(next);
    return end.x === start.x && end.y === start.y;
  });
}

describe("Jeans lower-body core", () => {
  it("derives upper stations from the shared lower-body metrics", () => {
    const options: JeansOptions = {
      ...DEFAULT_JEANS_OPTIONS,
      frontRiseEase: 2,
      backRiseEase: 11,
      waistbandDepth: 6,
      thighEase: 10,
      kneeEase: 7,
    };
    const upper = lowerBodyUpperMetrics(
      STANDARD_M,
      options,
      STANDARD_M.thigh + options.thighEase,
    );
    const actual = jeansMetrics(STANDARD_M, options);
    expect(actual).toEqual({
      ...upper,
      finishedKnee: STANDARD_M.knee + options.kneeEase,
      hemY: upper.backCrotchY + STANDARD_M.inseam,
      kneeY: upper.backCrotchY + STANDARD_M.inseam * 0.52,
    });
    expect(actual.kneeY).toBe(72.56);
  });

  it("drafts four closed named leg roles with finite and passing seam interfaces", () => {
    const draft = draftJeansCore(STANDARD_M);
    expect(Object.keys(draft.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight",
    ]);
    expect(blockPieces(draft).map(({ name }) => name)).toEqual([
      "jeans front left", "jeans front right", "jeans back left", "jeans back right",
    ]);
    expect(draft.stitches.map(({ label }) => label)).toEqual([
      "Left side seam (front ↔ back)",
      "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)",
      "Right inseam (front ↔ back)",
      "Center-back seam (left ↔ right)",
    ]);
    expect(draft.stitches).toHaveLength(5);
    expect(stitchChecks(draft, draft.stitches).every(({ ok }) => ok)).toBe(true);
    expect(draft.stitches.every(({ a, b }) =>
      Number.isFinite(interfaceLength(draft, a)) && Number.isFinite(interfaceLength(draft, b)))).toBe(true);
    for (const piece of blockPieces(draft)) {
      expect(piece.onFold).toBe(false);
      expect(piece.marks).toBeUndefined();
      expect(isClosed(piece)).toBe(true);
      expect(perimeter(piece)).toBeGreaterThan(0);
      const finite = piece.edges.every((edge) => edge.kind === "line"
        ? [edge.start, edge.end].every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
        : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]
          .every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
      expect(finite).toBe(true);
    }
  });

  it("mirrors left and right panels while keeping separate front and back crotch shapes", () => {
    const draft = draftJeansCore(STANDARD_M, DEFAULT_JEANS_OPTIONS);
    for (const [leftRole, rightRole] of [["frontLeft", "frontRight"], ["backLeft", "backRight"]]) {
      const left = rolePiece(draft, leftRole);
      const right = rolePiece(draft, rightRole);
      expect(right.edges).toHaveLength(left.edges.length);
      left.edges.forEach((edge, index) => {
        const mirrored = right.edges[index]!;
        expect(mirrored.kind).toBe(edge.kind);
        if (edge.kind === "line" && mirrored.kind === "line") {
          expect(mirrored.start).toEqual({ x: -edge.start.x, y: edge.start.y });
          expect(mirrored.end).toEqual({ x: -edge.end.x, y: edge.end.y });
        } else if (edge.kind === "curve" && mirrored.kind === "curve") {
          expect(mirrored.curve.start).toEqual({ x: -edge.curve.start.x, y: edge.curve.start.y });
          expect(mirrored.curve.control1).toEqual({ x: -edge.curve.control1.x, y: edge.curve.control1.y });
          expect(mirrored.curve.control2).toEqual({ x: -edge.curve.control2.x, y: edge.curve.control2.y });
          expect(mirrored.curve.end).toEqual({ x: -edge.curve.end.x, y: edge.curve.end.y });
        }
        expect(edgeLength(mirrored)).toBeCloseTo(edgeLength(edge));
      });
    }
    const frontCrotch = pieceEdge(rolePiece(draft, "frontLeft"), "crotch");
    const backCrotch = pieceEdge(rolePiece(draft, "backLeft"), "crotch");
    expect(frontCrotch.kind).toBe("curve");
    expect(backCrotch.kind).toBe("curve");
    if (frontCrotch.kind === "curve" && backCrotch.kind === "curve") {
      expect(frontCrotch.curve.control1).not.toEqual(backCrotch.curve.control1);
    }
  });

  it("uses live rise, thigh, knee, and opening values without changing Trouser", () => {
    const base = draftJeansCore(STANDARD_M, DEFAULT_JEANS_OPTIONS);
    const options = {
      ...DEFAULT_JEANS_OPTIONS,
      frontRiseEase: 4,
      thighEase: 12,
      kneeEase: 7,
      legOpening: 60,
    };
    const changed = draftJeansCore(STANDARD_M, options);
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "centerFront")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "centerFront")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "sideThighToKnee")))
      .not.toBe(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "sideThighToKnee")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "hem"))).toBe(15);
    expect(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "hem"))).toBe(10);
    expect(stitchChecks(changed, changed.stitches).every(({ ok }) => ok)).toBe(true);
  });
});
