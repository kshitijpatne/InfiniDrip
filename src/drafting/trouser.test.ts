import { describe, it, expect } from "vitest";
import { renderBlueprint } from "../render/canvas";
import { blockPieces, rolePiece, stitchChecks, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./index";
import { STANDARD_M } from "./measurements";
import { draftTrouserLegs, draftTrouserWithPockets, trouserMetrics } from "./trouser";
import { DEFAULT_TROUSER_OPTIONS, TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY, TROUSER_BOOTCUT_PROFILE_ROUTE_KEY, TROUSER_TAPERED_PROFILE_ROUTE_KEY, resolveTrouserOptions } from "./trouser-contract";
import { trouserGuidance } from "./trouser-guidance";

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

  it("expands the R05 hem evenly from the existing knee station across four panels", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening: 52,
      [TROUSER_BOOTCUT_PROFILE_ROUTE_KEY]: 1 as const,
    };
    const bootcut = draftTrouserWithPockets(STANDARD_M, options);
    const metrics = trouserMetrics(STANDARD_M, options);
    expect(metrics).toMatchObject({ finishedThigh: 66, finishedKnee: 45 });
    expect(options.legOpening).toBe(52);
    expect(stitchChecks(bootcut, bootcut.stitches).every((check) => check.ok)).toBe(true);

    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"] as const) {
      const piece = rolePiece(bootcut, role);
      const sideKneeToHem = pieceEdge(piece, "sideKneeToHem");
      const innerKneeToThigh = pieceEdge(piece, "inseamLower");
      const hem = pieceEdge(piece, "hem");
      expect(sideKneeToHem.kind).toBe("line");
      if (sideKneeToHem.kind !== "line") continue;
      const sideKnee = edgeStart(sideKneeToHem);
      const sideHem = edgeEnd(sideKneeToHem);
      const innerKnee = edgeEnd(innerKneeToThigh);
      const innerHem = edgeEnd(hem);
      expect(Math.abs(sideHem.x - innerHem.x)).toBeCloseTo(13);
      expect(Math.abs(sideHem.x - sideKnee.x)).toBeCloseTo(0.875);
      expect(Math.abs(innerHem.x - innerKnee.x)).toBeCloseTo(0.875);
      expect((sideHem.x + innerHem.x) / 2).toBeCloseTo((sideKnee.x + innerKnee.x) / 2);
    }

    const straightAt52 = rolePiece(
      draftTrouserLegs(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, legOpening: 52 }), "frontLeft",
    );
    const bootcutFront = rolePiece(bootcut, "frontLeft");
    expect(edgeEnd(pieceEdge(straightAt52, "hem")).x).not.toBeCloseTo(
      edgeEnd(pieceEdge(bootcutFront, "hem")).x,
    );
  });

  it("adds an R04 outer-leg curve while retaining the existing stations, four panels, and matched seams", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening: 38,
      barrelBowCm: 2,
      [TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY]: 1 as const,
    };
    const barrel = draftTrouserLegs(STANDARD_M, options);
    const straight = draftTrouserLegs(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, legOpening: 38 });
    expect(blockPieces(barrel)).toHaveLength(4);
    expect(stitchChecks(barrel, barrel.stitches).every((check) => check.ok)).toBe(true);
    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"] as const) {
      const barrelPiece = rolePiece(barrel, role);
      const straightPiece = rolePiece(straight, role);
      const thighToKnee = pieceEdge(barrelPiece, "sideThighToKnee");
      const kneeToHem = pieceEdge(barrelPiece, "sideKneeToHem");
      const straightThighToKnee = pieceEdge(straightPiece, "sideThighToKnee");
      const straightKneeToHem = pieceEdge(straightPiece, "sideKneeToHem");
      expect(thighToKnee.kind).toBe("curve");
      expect(kneeToHem.kind).toBe("curve");
      expect(straightThighToKnee.kind).toBe("line");
      expect(straightKneeToHem.kind).toBe("line");
      expect(edgeStart(thighToKnee)).toEqual(edgeStart(straightThighToKnee));
      expect(edgeEnd(thighToKnee)).toEqual(edgeEnd(straightThighToKnee));
      expect(edgeStart(kneeToHem)).toEqual(edgeStart(straightKneeToHem));
      expect(edgeEnd(kneeToHem)).toEqual(edgeEnd(straightKneeToHem));
      if (thighToKnee.kind === "curve" && straightThighToKnee.kind === "line") {
        expect(thighToKnee.curve.control1.x)
          .toBeCloseTo(straightThighToKnee.start.x + (straightThighToKnee.end.x - straightThighToKnee.start.x) / 3
            + (straightThighToKnee.start.x < 0 ? -2 : 2));
      }
    }
    const front = rolePiece(barrel, "frontLeft");
    const back = rolePiece(barrel, "backLeft");
    expect(pieceEdge(front, "sideThighToKnee")).toEqual(pieceEdge(back, "sideThighToKnee"));
    expect(pieceEdge(front, "sideKneeToHem")).toEqual(pieceEdge(back, "sideKneeToHem"));
    expect(trouserGuidance(barrel, STANDARD_M, options)
      .filter((note) => note.field === "option-pocketOpening" || note.field === "option-pocketBagDepth")).toEqual([]);
  });

  it("keeps R04 curve controls finite when adjacent stations share a vertical coordinate", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening: 38,
      barrelBowCm: 2,
      [TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY]: 1 as const,
    };
    for (const inseam of [0, 2.5 / 0.52]) {
      const drafted = draftTrouserLegs({ ...STANDARD_M, inseam }, options);
      const side = pieceEdge(rolePiece(drafted, "frontLeft"), "sideThighToKnee");
      const lower = pieceEdge(rolePiece(drafted, "frontLeft"), "sideKneeToHem");
      for (const edge of [side, lower]) {
        expect(edge.kind).toBe("curve");
        if (edge.kind !== "curve") continue;
        expect([edge.curve.control1.x, edge.curve.control1.y, edge.curve.control2.x, edge.curve.control2.y]
          .every(Number.isFinite)).toBe(true);
      }
    }
  });

  it("retains invalid R04 curve input and guides users instead of clamping it", () => {
    const invalidOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening: 45,
      barrelBowCm: 4.5,
      [TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY]: 1 as const,
    };
    expect(resolveTrouserOptions(invalidOptions).barrelBowCm).toBe(4.5);
    expect(resolveTrouserOptions({ barrelBowCm: 4.5 })).not.toHaveProperty("barrelBowCm");
    const notes = trouserGuidance(
      draftTrouserWithPockets(STANDARD_M, invalidOptions), STANDARD_M, invalidOptions,
    );
    expect(notes).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-barrelBowCm", text: expect.stringContaining("0.5–4 cm range") }),
      expect.objectContaining({ field: "option-legOpening", text: expect.stringContaining("must be smaller than the finished knee") }),
    ]));
    const nonFiniteNotes = trouserGuidance(
      draftTrouserWithPockets(STANDARD_M, { ...invalidOptions, barrelBowCm: 2, legOpening: 38 }),
      STANDARD_M,
      { ...invalidOptions, barrelBowCm: Number.NaN, legOpening: 38 },
    );
    expect(nonFiniteNotes).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-barrelBowCm", text: expect.stringContaining("outside V1's 0.5–4 cm range") }),
    ]));
  });

  it.each([45, 44])("retains R05 opening %i cm and guides the user to restore the flare", (legOpening) => {
    const invalidOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      legOpening,
      [TROUSER_BOOTCUT_PROFILE_ROUTE_KEY]: 1 as const,
    };
    const notes = trouserGuidance(
      draftTrouserWithPockets(STANDARD_M, invalidOptions), STANDARD_M, invalidOptions,
    );
    expect(resolveTrouserOptions(invalidOptions)[TROUSER_BOOTCUT_PROFILE_ROUTE_KEY]).toBe(1);
    expect(notes).toContainEqual(expect.objectContaining({
      field: "option-legOpening",
      text: expect.stringContaining(`Bootcut opening (${legOpening} cm) must be wider than the finished knee (45.0 cm)`),
    }));
    expect(notes.some((note) => note.text.includes("knee-to-opening drop"))).toBe(false);
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
