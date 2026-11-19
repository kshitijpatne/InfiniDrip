import { describe, it, expect } from "vitest";
import { renderBlueprint } from "../render/canvas";
import type { Block } from "./block";
import { blockPieces, rolePiece, stitchChecks, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./index";
import { STANDARD_M } from "./measurements";
import { draftTrouserLegs, draftTrouserWithPockets, TROUSER_ALLOWANCES, trouserCargoNotes, trouserMetrics, trouserNotchesForOptions, trouserPocketOpening } from "./trouser";
import type { Piece } from "./piece";
import { DEFAULT_TROUSER_OPTIONS, TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY, TROUSER_BOOTCUT_PROFILE_ROUTE_KEY, TROUSER_TAPERED_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY, TROUSER_CARGO_PROFILE_ROUTE_KEY, TROUSER_CASING_TURN_UNDER_CM, resolveTrouserOptions, type TrouserOptions } from "./trouser-contract";
import { trouserGuidance } from "./trouser-guidance";

describe("trouser leg block", () => {
  it("drafts mirrored R08 cargo bodies/flaps and aligned leg placement marks without false seam joins", () => {
    const options = { [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const };
    const drafted = draftTrouserWithPockets(STANDARD_M, options);
    expect(Object.keys(drafted.roles).sort()).toEqual([
      "backLeft", "backRight", "cargoPocketBodyLeft", "cargoPocketBodyRight",
      "cargoPocketFlapLeft", "cargoPocketFlapRight", "flyShield", "flyUnderlap",
      "frontLeft", "frontRight", "pocketBagLeft", "pocketBagRight", "waistband",
    ]);
    for (const [leftRole, rightRole] of [
      ["cargoPocketBodyLeft", "cargoPocketBodyRight"],
      ["cargoPocketFlapLeft", "cargoPocketFlapRight"],
    ] as const) {
      const left = rolePiece(drafted, leftRole);
      const right = rolePiece(drafted, rightRole);
      expect(left.edges.map((edge) => edge.name)).toEqual(["top", "right", "bottom", "left"]);
      expect(right.edges.map((edge) => edge.name)).toEqual(["top", "right", "bottom", "left"]);
      expect(edgeStart(pieceEdge(left, "top")).y).toBe(edgeStart(pieceEdge(right, "top")).y);
      expect(edgeLength(pieceEdge(left, "top"))).toBeCloseTo(edgeLength(pieceEdge(right, "top")));
    }
    expect(rolePiece(drafted, "cargoPocketBodyLeft").marks?.map((mark) => mark.name)).toEqual([
      "cargoPleatLeftFold", "cargoPleatRightFold", "cargoPleatCenter",
    ]);
    expect(rolePiece(drafted, "cargoPocketFlapLeft").marks?.map((mark) => mark.name)).toEqual([
      "cargoHookLoopPlacement",
    ]);
    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"] as const) {
      expect(rolePiece(drafted, role).marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
        "cargoBodyPlacementTop", "cargoBodyPlacementBottom", "cargoFlapPlacementTop",
        "cargoFlapPlacementBase", "cargoPocketPlacementCenter",
      ]));
    }
    const placementTop = rolePiece(drafted, "frontLeft").marks?.find((mark) => mark.name === "cargoBodyPlacementTop");
    if (!placementTop || !("start" in placementTop)) throw new Error("Expected the cargo body placement top line.");
    expect(placementTop.start.x).toBeGreaterThan(0);
    expect(drafted.stitches.flatMap((stitch) => [...stitch.a.edges, ...stitch.b.edges])
      .some((ref) => ref.piece.startsWith("cargoPocket"))).toBe(false);
    expect(trouserNotchesForOptions(options).map((rule) => rule.pieceName)).toEqual(expect.arrayContaining([
      "cargo pocket body left", "cargo pocket body right", "cargo pocket flap left", "cargo pocket flap right",
    ]));
    expect(TROUSER_ALLOWANCES.byPieceEdge).toEqual({
      "cargo pocket body left": { top: 1, right: 1, bottom: 1, left: 1 },
      "cargo pocket body right": { top: 1, right: 1, bottom: 1, left: 1 },
      "cargo pocket flap left": { top: 1, right: 1, bottom: 1, left: 1 },
      "cargo pocket flap right": { top: 1, right: 1, bottom: 1, left: 1 },
    });
    const cargoNotes = trouserGuidance(drafted, STANDARD_M, options)
      .filter((note) => note.field?.startsWith("option-cargo"));
    expect(cargoNotes, JSON.stringify(cargoNotes)).toEqual([]);
  });

  it.each([
    [{ cargoPocketWidthCm: 0 }, "option-cargoPocketWidthCm", "positive finished body width"],
    [{ cargoPocketHeightCm: 20, cargoFlapDepthCm: 21 }, "option-cargoFlapDepthCm", "smaller than the pocket body height"],
    [{ cargoPocketWidthCm: 100 }, "option-cargoPocketWidthCm", "leg-panel envelope"],
  ])("retains unsafe R08 values and reports a correction for %o", (overrides, field, correction) => {
    const options = { [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const, ...overrides };
    const drafted = draftTrouserWithPockets(STANDARD_M, options);
    const notes = trouserGuidance(drafted, STANDARD_M, options);
    expect(resolveTrouserOptions(options)).toMatchObject(overrides);
    expect(notes).toEqual(expect.arrayContaining([
      expect.objectContaining({ field, level: "warn", text: expect.stringContaining(correction) }),
    ]));
  });

  it("gives field-specific cargo corrections for panel, waistband, knee and flap collisions", () => {
    const cargoOptions = { [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const };
    const notesFor = (overrides: Partial<TrouserOptions>) => {
      const options = { ...cargoOptions, ...overrides };
      return trouserGuidance(draftTrouserWithPockets(STANDARD_M, options), STANDARD_M, options)
        .filter((note) => note.field?.startsWith("option-cargo"));
    };

    expect(notesFor({ cargoPocketHeightCm: 100 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoPocketHeightCm", text: expect.stringContaining("reduce pocket height") }),
    ]));
    expect(notesFor({ cargoPocketVerticalOffsetCm: 200 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoPocketVerticalOffsetCm", text: expect.stringContaining("leg-panel envelope") }),
      expect.objectContaining({ field: "option-cargoPocketVerticalOffsetCm", text: expect.stringContaining("knee or hem clearance") }),
    ]));

    const boundaryPanel: Piece = {
      name: "cargo placement boundary fixture",
      onFold: false,
      edges: [
        { kind: "line", name: "sideUpper", start: { x: 30, y: 0 }, end: { x: 30, y: 20 } },
        { kind: "line", name: "sideHipToThigh", start: { x: 30, y: 20 }, end: { x: 30, y: 40 } },
        { kind: "line", name: "sideThighToKnee", start: { x: 30, y: 40 }, end: { x: 30, y: 60 } },
      ],
    };
    const boundaryBlock: Block = { roles: { frontLeft: boundaryPanel, backLeft: boundaryPanel }, stitches: [] };
    expect(trouserCargoNotes(boundaryBlock, STANDARD_M, { ...cargoOptions, cargoFlapDepthCm: 50 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoFlapDepthCm", text: expect.stringContaining("reduce flap depth") }),
    ]));
    expect(trouserCargoNotes(boundaryBlock, STANDARD_M, {
      ...cargoOptions, cargoFlapDepthCm: 50, cargoPocketVerticalOffsetCm: 1,
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoPocketVerticalOffsetCm",
        text: expect.stringContaining("move the vertical offset toward the mid-thigh anchor") }),
    ]));
    expect(notesFor({ cargoFlapDepthCm: 40 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoFlapDepthCm", text: expect.stringContaining("reduce flap depth") }),
    ]));
    expect(notesFor({ cargoPocketVerticalOffsetCm: -100 })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "option-cargoPocketVerticalOffsetCm", text: expect.stringContaining("too close to the waistband") }),
    ]));
  });

  it("flags cargo placement that intersects or touches the existing front pocket opening", () => {
    const cargoRoute = { [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const };
    const noteFor = (measurements: typeof STANDARD_M, pocketDrop: number, pocketOpening: number, pocketAngle = 0) => {
      const options = { ...cargoRoute, pocketDrop, pocketOpening, pocketAngle };
      const drafted = draftTrouserWithPockets(measurements, options);
      return trouserGuidance(drafted, measurements, options).filter((note) =>
        note.field === "option-cargoPocketWidthCm" && note.text.includes("front pocket opening"));
    };
    const centerDraft = draftTrouserWithPockets(STANDARD_M, cargoRoute);
    const centerTop = rolePiece(centerDraft, "frontLeft").marks?.find((mark) => mark.name === "cargoBodyPlacementTop");
    const centerBottom = rolePiece(centerDraft, "frontLeft").marks?.find((mark) => mark.name === "cargoBodyPlacementBottom");
    if (!centerTop || !("start" in centerTop) || !centerBottom || !("start" in centerBottom)) {
      throw new Error("Expected cargo placement body bounds.");
    }
    const centerY = (centerTop.start.y + centerBottom.start.y) / 2;
    expect(noteFor(STANDARD_M, centerY, 10)).toHaveLength(1);

    const wideWaist = { ...STANDARD_M, waist: STANDARD_M.waist + 64 };
    const wideDraft = draftTrouserWithPockets(wideWaist, cargoRoute);
    const wideTop = rolePiece(wideDraft, "frontLeft").marks?.find((mark) => mark.name === "cargoBodyPlacementTop");
    const wideBottom = rolePiece(wideDraft, "frontLeft").marks?.find((mark) => mark.name === "cargoBodyPlacementBottom");
    if (!wideTop || !("start" in wideTop) || !wideBottom || !("start" in wideBottom)) {
      throw new Error("Expected wide-waist cargo placement bounds.");
    }
    const wideCenterY = (wideTop.start.y + wideBottom.start.y) / 2;
    const wideTopY = wideTop.start.y;
    expect(noteFor(wideWaist, wideCenterY, 40)).toHaveLength(1);
    expect(noteFor(wideWaist, wideTopY, 40)).toHaveLength(1);

    const diagonalStart = trouserPocketOpening(wideWaist, { ...cargoRoute, pocketAngle: 45 }).start;
    const topRight = { x: wideTop.end.x, y: wideTop.start.y };
    const cornerTangentDrop = topRight.y - (diagonalStart.x - topRight.x);
    expect(noteFor(wideWaist, cornerTangentDrop, 100, 45)).toHaveLength(1);
  });

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

  it("drafts R07 integrated casing contours and matched side seams without separate closure pieces", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const,
      waistGatherRatio: 1.25,
      casingDepthCm: 4,
    };
    const drafted = draftTrouserWithPockets(STANDARD_M, options);
    const metrics = trouserMetrics(STANDARD_M, options);
    expect(Object.keys(drafted.roles).sort()).toEqual([
      "backLeft", "backRight", "frontLeft", "frontRight", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"] as const) {
      const panel = rolePiece(drafted, role);
      const waist = pieceEdge(panel, "waist");
      expect(waist.kind).toBe("line");
      expect(edgeLength(waist)).toBeCloseTo(metrics.finishedWaist / 4 * 1.25);
      expect(edgeStart(waist).y).toBeCloseTo(-(4 + TROUSER_CASING_TURN_UNDER_CM));
      expect(panel.marks?.some((mark) => mark.name === "casingFold")).toBe(true);
      expect(panel.marks?.some((mark) => mark.name === "casingStitchGuide")).toBe(true);
      expect(panel.marks?.some((mark) => mark.name === "flyEdge")).toBe(false);
    }
    expect(drafted.roles.waistband).toBeUndefined();
    expect(drafted.roles.flyShield).toBeUndefined();
    expect(drafted.roles.flyUnderlap).toBeUndefined();
    expect(drafted.stitches.some((stitch) => stitch.label.includes("separate waistband"))).toBe(false);
    expect(drafted.stitches.some((stitch) => stitch.label.includes("fly"))).toBe(false);
    expect(drafted.stitches.map((stitch) => stitch.label)).toContain("Center-front seam (left ↔ right)");
    expect(drafted.stitches.map((stitch) => stitch.label)).toContain("Center-back seam (left ↔ right)");
  });

  it("routes R07 notch rules only to its four leg panels and pocket bags", () => {
    const options = { [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const };
    expect(trouserNotchesForOptions(options).map((rule) => rule.pieceName)).toEqual([
      "trouser front left", "trouser front right", "trouser back left", "trouser back right",
      "trouser pocket bag left", "trouser pocket bag right",
    ]);
  });

  it("resolves the R07 software defaults before drafting the integrated casing", () => {
    const options = { [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const };
    const drafted = draftTrouserLegs(STANDARD_M, options);
    const waist = pieceEdge(rolePiece(drafted, "frontLeft"), "waist");

    expect(edgeLength(waist)).toBeCloseTo(trouserMetrics(STANDARD_M, options).finishedWaist / 4 * 1.25);
    expect(edgeStart(waist).y).toBeCloseTo(-4.6);
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
