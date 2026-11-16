import { describe, it, expect } from "vitest";
import { renderBlueprint } from "../render/canvas";
import { blockPieces, rolePiece, stitchChecks, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./index";
import { STANDARD_M } from "./measurements";
import { draftTrouserLegs, draftTrouserWithPockets, trouserMetrics } from "./trouser";
import { DEFAULT_TROUSER_OPTIONS, TROUSER_TAPERED_PROFILE_ROUTE_KEY } from "./trouser-contract";

describe("trouser leg block", () => {
  it("drafts four explicit off-fold leg panels with construction landmarks", () => {
    const b = draftTrouserLegs(STANDARD_M);
    expect(blockPieces(b).map((piece) => piece.name)).toEqual([
      "trouser front left", "trouser front right", "trouser back left", "trouser back right",
    ]);
    for (const piece of blockPieces(b)) {
      expect(piece.onFold).toBe(false);
      expect(piece.edges.map((edge) => edge.name)).toEqual([
        "waist", "sideUpper", "sideHipToThigh", "sideThighToKnee", "sideKneeToHem",
        "hem", "inseamLower", "inseamUpper", "innerThighToCrotch", "crotch",
        piece.name.includes("front") ? "centerFront" : "centerBack",
      ]);
      expect(piece.marks).toHaveLength(4);
    }
  });

  it("declares matching side, inseam, and center-back stitches", () => {
    const b = draftTrouserLegs(STANDARD_M);
    expect(b.stitches.map((stitch) => stitch.label)).toEqual([
      "Left side seam (front ↔ back)", "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)", "Right inseam (front ↔ back)",
      "Center-back seam (left ↔ right)",
    ]);
    expect(stitchChecks(b, b.stitches).every((check) => check.ok)).toBe(true);
  });

  it("uses separate front/back crotch curves and rise endpoints", () => {
    const b = draftTrouserLegs(STANDARD_M);
    const front = rolePiece(b, "frontLeft");
    const back = rolePiece(b, "backLeft");
    const frontCrotch = pieceEdge(front, "crotch");
    const backCrotch = pieceEdge(back, "crotch");
    expect(frontCrotch.kind).toBe("curve");
    expect(backCrotch.kind).toBe("curve");
    if (frontCrotch.kind !== "curve" || backCrotch.kind !== "curve") return;
    expect(frontCrotch.curve.control1).not.toEqual(backCrotch.curve.control1);
    expect(edgeEnd(pieceEdge(front, "centerFront")).y).toBeCloseTo(0);
    expect(edgeEnd(pieceEdge(back, "centerBack")).y).toBeCloseTo(0);
    expect(frontCrotch.curve.end.y).toBeLessThan(backCrotch.curve.end.y);
  });

  it("keeps left/right panels mirrored while sharing every edge length", () => {
    const b = draftTrouserLegs(STANDARD_M);
    for (const [leftRole, rightRole] of [["frontLeft", "frontRight"], ["backLeft", "backRight"]] as const) {
      const left = rolePiece(b, leftRole);
      const right = rolePiece(b, rightRole);
      expect(edgeEnd(pieceEdge(left, "waist")).x).toBeCloseTo(-edgeEnd(pieceEdge(right, "waist")).x);
      expect(left.edges.map(edgeLength)).toEqual(right.edges.map(edgeLength));
      expect(right.marks![0]).toMatchObject({ start: { x: expect.any(Number) }, end: { x: expect.any(Number) } });
    }
  });

  it("centers the R03 hem reduction at every knee and preserves the route through full assembly", () => {
    const tapered = draftTrouserWithPockets(STANDARD_M, {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening: 36,
      [TROUSER_TAPERED_PROFILE_ROUTE_KEY]: 1,
    });
    expect(stitchChecks(tapered, tapered.stitches).every((check) => check.ok)).toBe(true);

    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"] as const) {
      const piece = rolePiece(tapered, role);
      const sideKnee = edgeStart(pieceEdge(piece, "sideKneeToHem"));
      const innerKnee = edgeEnd(pieceEdge(piece, "inseamLower"));
      const sideHem = edgeStart(pieceEdge(piece, "hem"));
      const innerHem = edgeEnd(pieceEdge(piece, "hem"));
      const kneeMidpoint = (sideKnee.x + innerKnee.x) / 2;
      const hemMidpoint = (sideHem.x + innerHem.x) / 2;

      expect(Math.abs(sideHem.x - innerHem.x)).toBeCloseTo(9);
      expect(hemMidpoint).toBeCloseTo(kneeMidpoint);
      expect(Math.abs(sideKnee.x - sideHem.x)).toBeCloseTo(1.125);
      expect(Math.abs(innerKnee.x - innerHem.x)).toBeCloseTo(1.125);
    }

    const legacy = rolePiece(draftTrouserLegs(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, legOpening: 36 }), "frontLeft");
    const legacySideKnee = edgeStart(pieceEdge(legacy, "sideKneeToHem"));
    const legacyInnerKnee = edgeEnd(pieceEdge(legacy, "inseamLower"));
    const legacySideHem = edgeStart(pieceEdge(legacy, "hem"));
    const legacyInnerHem = edgeEnd(pieceEdge(legacy, "hem"));
    expect((legacySideHem.x + legacyInnerHem.x) / 2).not.toBeCloseTo((legacySideKnee.x + legacyInnerKnee.x) / 2);
  });

  it("takes live measurements/options into the real drafted stations", () => {
    const base = draftTrouserLegs(STANDARD_M);
    const changed = draftTrouserLegs(
      { ...STANDARD_M, waist: 92, hip: 112, hipDepth: 23, crotchDepth: 30, thigh: 64, knee: 44, inseam: 84 },
      { ...DEFAULT_TROUSER_OPTIONS, frontRiseEase: 2, backRiseEase: 11, thighEase: 10, kneeEase: 7, legOpening: 48 },
    );
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "waist")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "waist")));
    expect(edgeEnd(pieceEdge(rolePiece(changed, "frontLeft"), "sideUpper")).y).toBe(23);
    expect(edgeEnd(pieceEdge(rolePiece(changed, "frontLeft"), "hem")).y).toBeGreaterThan(
      edgeEnd(pieceEdge(rolePiece(base, "frontLeft"), "hem")).y);
    expect(edgeLength(pieceEdge(rolePiece(changed, "frontLeft"), "hem")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "frontLeft"), "hem")));
    expect(edgeStart(pieceEdge(rolePiece(changed, "frontLeft"), "centerFront")).y).toBe(30 + 2 - 4);
  });

  it("reports station metrics from the same source used by the pieces", () => {
    const metrics = trouserMetrics(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    expect(metrics.finishedWaist).toBe(94);
    expect(metrics.finishedSeat).toBe(110);
    expect(metrics.finishedThigh).toBe(66);
    expect(metrics.finishedKnee).toBe(45);
    expect(metrics.frontRise).toBe(28);
    expect(metrics.backRise).toBe(36);
    expect(metrics.hemY).toBe(110);
    expect(metrics.thighY).toBeGreaterThan(metrics.backCrotchY);
    expect(metrics.kneeY).toBeGreaterThan(metrics.thighY);
  });

  it("renders the actual leg block as a closed blueprint with labels", () => {
    const svg = renderBlueprint([...blockPieces(draftTrouserLegs(STANDARD_M))]);
    expect(svg).toContain("TROUSER FRONT LEFT");
    expect(svg).toContain("TROUSER BACK RIGHT");
    expect(svg).toContain("viewBox=\"");
    expect(svg).toContain("C ");
  });
});
