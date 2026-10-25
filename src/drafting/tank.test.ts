import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import {
  draftTank, tankGuidance, TANK_NOTCHES, TANK_POMS,
  TANK_RACERBACK_BACK_CUT_IN_OPTION, TANK_RACERBACK_BACK_CUT_IN_OPTION_ID, TANK_RACERBACK_ENTRY_ID,
  TANK_N04_ENTRY_ID, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID,
  tankRacerbackControlOffsetCm,
} from "./tank";
import { TANK, gradeRun, specSheet } from "./index";
import { defaultGarmentOptions } from "./options";
import { rolePiece, blockPieces } from "./block";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { stitchChecks } from "./stitch";
import { garmentReport } from "../guidance/garment-check";
import { TSHIRT_POMS } from "./tshirt-pom";

describe("draftTank", () => {
  it("drafts a front and back panel — no sleeve role", () => {
    const b = draftTank(STANDARD_M);
    expect(blockPieces(b).map((p) => p.name).sort()).toEqual(["back", "front"]);
    expect(() => rolePiece(b, "sleeve")).toThrow();
  });

  it("gives the front a deeper scoop than the back's crew (Slice 62: depth, not curve shape)", () => {
    const b = draftTank(STANDARD_M);
    const front = pieceEdge(rolePiece(b, "front"), "neckline");
    const back = pieceEdge(rolePiece(b, "back"), "neckline");
    expect(front.kind).toBe("curve");
    expect(back.kind).toBe("curve");
    if (front.kind === "curve" && back.kind === "curve") {
      // After the Slice 62 curve fix, crew and scoop share the SAME curve
      // construction — a scoop is a crew curve that's deeper (and can be
      // wider), not a differently-shaped one. Only the front carries
      // TANK_FRONT_NECKLINE's frontDrop, so only its centre-front point
      // sits deeper than the back's.
      expect(front.curve.start.y).toBeGreaterThan(back.curve.start.y);
    }
  });

  it("widens BOTH shoulder points equally, so the shoulder seam still matches (tankBackNeckline's whole reason to exist)", () => {
    const b = draftTank(STANDARD_M);
    const front = pieceEdge(rolePiece(b, "front"), "neckline");
    const back = pieceEdge(rolePiece(b, "back"), "neckline");
    if (front.kind === "curve" && back.kind === "curve") {
      expect(front.curve.end.x).toBeCloseTo(back.curve.end.x);
    }
  });

  it("has only shoulder and side stitches — no cap-ease, no underarm", () => {
    const b = draftTank(STANDARD_M);
    expect(b.stitches.map((s) => s.label)).toEqual([
      "Shoulder seam (front ↔ back)",
      "Side seam (front ↔ back)",
    ]);
  });

  it("sews together cleanly (both stitches match)", () => {
    const b = draftTank(STANDARD_M);
    expect(stitchChecks(b, b.stitches).every((c) => c.ok)).toBe(true);
  });

  it("draws the armhole from the REAL m.strapWidth, not a hardcoded point (Slice 63)", () => {
    const m = { ...STANDARD_M, strapWidth: 10 };
    const b = draftTank(m);
    const front = pieceEdge(rolePiece(b, "front"), "armhole");
    const back = pieceEdge(rolePiece(b, "back"), "armhole");
    expect(front.kind).toBe("curve");
    expect(back.kind).toBe("curve");
    if (front.kind === "curve" && back.kind === "curve") {
      expect(front.curve.start.x).toBe(17);
      expect(back.curve.start.x).toBe(17);
    }
  });

  it("moves the strap when m.strapWidth changes, and keeps the shoulder seam matching at every value", () => {
    for (const strapWidth of [5, 8, 12]) {
      const b = draftTank({ ...STANDARD_M, strapWidth });
      expect(stitchChecks(b, b.stitches).every((c) => c.ok)).toBe(true);
      const front = pieceEdge(rolePiece(b, "front"), "armhole");
      if (front.kind === "curve") expect(front.curve.start.x).toBe(7 + strapWidth);
    }
  });

  it("draws the front neckline from the REAL m.neckDrop, not a hardcoded depth (Slice 63)", () => {
    const shallow = draftTank({ ...STANDARD_M, neckDrop: 2 });
    const deep = draftTank({ ...STANDARD_M, neckDrop: 9 });
    const shallowFront = pieceEdge(rolePiece(shallow, "front"), "neckline");
    const deepFront = pieceEdge(rolePiece(deep, "front"), "neckline");
    if (shallowFront.kind === "curve" && deepFront.kind === "curve") {
      expect(deepFront.curve.start.y).toBeGreaterThan(shallowFront.curve.start.y);
    }
  });

  it("places the N02 software profile 5 cm higher at front center than N01 with Tank joins intact", () => {
    const n01 = draftTank({ ...STANDARD_M, neckDrop: 5, neckWidthEase: 0 });
    const n02 = draftTank({ ...STANDARD_M, neckDrop: 0, neckWidthEase: 0 });
    const n01Front = pieceEdge(rolePiece(n01, "front"), "neckline");
    const n02Front = pieceEdge(rolePiece(n02, "front"), "neckline");
    expect(n01Front.kind).toBe("curve");
    expect(n02Front.kind).toBe("curve");
    if (n01Front.kind === "curve" && n02Front.kind === "curve") {
      expect(n01Front.curve.start.y - n02Front.curve.start.y).toBeCloseTo(5, 8);
    }
    expect(pieceEdge(rolePiece(n01, "back"), "neckline"))
      .toEqual(pieceEdge(rolePiece(n02, "back"), "neckline"));
    expect(stitchChecks(n01, n01.stitches).map((check) => check.ok)).toEqual([true, true]);
    expect(stitchChecks(n02, n02.stitches).map((check) => check.ok)).toEqual([true, true]);
  });
  it("never lets neckDrop move the BACK neckline — only the front carries frontDrop", () => {
    const shallow = draftTank({ ...STANDARD_M, neckDrop: 2 });
    const deep = draftTank({ ...STANDARD_M, neckDrop: 9 });
    const shallowBack = pieceEdge(rolePiece(shallow, "back"), "neckline");
    const deepBack = pieceEdge(rolePiece(deep, "back"), "neckline");
    expect(shallowBack).toEqual(deepBack);
  });

  it("moves both neckline shoulder points with the user width adjustment", () => {
    const narrow = draftTank({ ...STANDARD_M, neckWidthEase: -1 });
    const wide = draftTank({ ...STANDARD_M, neckWidthEase: 3 });
    const n = pieceEdge(rolePiece(narrow, "front"), "neckline");
    const w = pieceEdge(rolePiece(wide, "front"), "neckline");
    if (n.kind === "curve" && w.kind === "curve") expect(w.curve.end.x).toBeGreaterThan(n.curve.end.x);
  });
});

describe("N03 racerback Tank geometry", () => {
  it("converts the displayed maximum contour movement to the matching Bezier control offset", () => {
    expect(tankRacerbackControlOffsetCm(0)).toBe(0);
    expect(tankRacerbackControlOffsetCm(3)).toBe(4);
    expect(tankRacerbackControlOffsetCm(6)).toBe(8);
  });

  it("changes only the back armhole curve across 0/default/6 cm and keeps endpoints and joins", () => {
    const n01 = draftTank(STANDARD_M);
    expect(TANK.options).toEqual([TANK_RACERBACK_BACK_CUT_IN_OPTION, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION]);
    const defaultOptions = defaultGarmentOptions([TANK_RACERBACK_BACK_CUT_IN_OPTION], TANK_RACERBACK_ENTRY_ID);
    expect(defaultOptions).toEqual({ [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 3 });
    const draft = (cutIn: number) => draftTank(STANDARD_M, { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: cutIn });
    const zero = draft(0);
    const three = draft(defaultOptions[TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]!);
    const six = draft(6);
    const backCurve = (block: ReturnType<typeof draftTank>) => pieceEdge(rolePiece(block, "back"), "armhole");
    const zeroEdge = backCurve(zero);
    const threeEdge = backCurve(three);
    const sixEdge = backCurve(six);
    expect([zeroEdge.kind, threeEdge.kind, sixEdge.kind]).toEqual(["curve", "curve", "curve"]);
    if (zeroEdge.kind !== "curve" || threeEdge.kind !== "curve" || sixEdge.kind !== "curve") {
      throw new Error("expected back armhole curves");
    }

    expect(zeroEdge).toEqual(pieceEdge(rolePiece(n01, "back"), "armhole"));
    expect(threeEdge).not.toEqual(zeroEdge);
    expect(sixEdge).not.toEqual(threeEdge);
    const cubicMidpointX = (edge: Extract<typeof zeroEdge, { kind: "curve" }>): number =>
      (edge.curve.start.x + 3 * edge.curve.control1.x + 3 * edge.curve.control2.x + edge.curve.end.x) / 8;
    expect(cubicMidpointX(zeroEdge) - cubicMidpointX(threeEdge)).toBeCloseTo(3, 10);
    expect(cubicMidpointX(zeroEdge) - cubicMidpointX(sixEdge)).toBeCloseTo(6, 10);
    for (const edge of [zeroEdge, threeEdge, sixEdge]) {
      expect(edge.curve.start).toEqual(zeroEdge.curve.start);
      expect(edge.curve.end).toEqual(zeroEdge.curve.end);
      for (const point of [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]) {
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      }
    }

    const n01Front = pieceEdge(rolePiece(n01, "front"), "armhole");
    for (const candidate of [zero, three, six]) {
      expect(pieceEdge(rolePiece(candidate, "front"), "armhole")).toEqual(n01Front);
      expect(pieceEdge(rolePiece(candidate, "back"), "neckline"))
        .toEqual(pieceEdge(rolePiece(n01, "back"), "neckline"));
      expect(candidate.stitches.map((stitch) => stitch.label)).toEqual(n01.stitches.map((stitch) => stitch.label));
      expect(stitchChecks(candidate, candidate.stitches).map((check) => check.ok)).toEqual([true, true]);
    }
  });
});

describe("tankGuidance", () => {
  it("is sleevedTopGuidance minus armholeMatch — never touches a sleeve role", () => {
    const b = draftTank(STANDARD_M);
    expect(() => tankGuidance(b, STANDARD_M)).not.toThrow();
  });

  it("still surfaces ease/armhole-depth/shoulder-width guidance", () => {
    const notes = tankGuidance(draftTank(STANDARD_M), STANDARD_M);
    expect(notes.some((n) => n.text.includes("Ease"))).toBe(true);
  });

  it("warns on a shallow armhole, same as the tee does", () => {
    const m = { ...STANDARD_M, armholeDepth: 10 };
    const notes = tankGuidance(draftTank(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("Armhole depth"))).toBe(true);
  });

  it("surfaces necklineEdge()'s own guardrail when neckDrop pushes the front below the underarm (Slice 63)", () => {
    // A pre-existing guardrail (necklineEdge's own "notes"), never reachable
    // before because no caller surfaced it — real now that neckDrop is a
    // live slider, not a fixed constant nobody could push out of range.
    const m = { ...STANDARD_M, neckDrop: 17, armholeDepth: 15 };
    const notes = tankGuidance(draftTank(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("underarm"))).toBe(true);
  });

  it("surfaces sleevelessArmhole()'s guardrail when the strap is narrower than the neckline (Slice 63)", () => {
    const m = { ...STANDARD_M, strapWidth: 0 }; // strap point meets neck edge
    const notes = tankGuidance(draftTank(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("narrow"))).toBe(true);
  });

  it("surfaces sleevelessArmhole()'s guardrail when the strap reaches the full shoulder (Slice 63)", () => {
    const m = { ...STANDARD_M, strapWidth: 22.5 }; // = shoulderHalf at STANDARD_M
    const notes = tankGuidance(draftTank(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("shoulder"))).toBe(true);
  });

  it("is silent on strap/neckline guardrails for the default measurements", () => {
    const notes = tankGuidance(draftTank(STANDARD_M), STANDARD_M);
    expect(notes.some((n) => n.text.includes("narrow") || n.text.includes("underarm"))).toBe(false);
  });

  it("uses the N04 option only when explicitly present and holds geometry/guidance to the same radius", () => {
    const options = { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 1 };
    const square = draftTank(STANDARD_M, options);
    const front = rolePiece(square, "front");
    expect(front.edges.slice(0, 3).map((edge) => edge.name))
      .toEqual(["neckline", "necklineCorner", "necklineSide"]);
    expect(tankGuidance(square, STANDARD_M, options).some((note) => note.field === TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID)).toBe(false);
    expect(rolePiece(draftTank(STANDARD_M), "front").edges.slice(0, 1).map((edge) => edge.name)).toEqual(["neckline"]);
    expect(TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.appliesToStarterEntryId).toBe(TANK_N04_ENTRY_ID);
  });

  it("surfaces an N04 radius that cannot fit the available legs and does not clamp it", () => {
    const m = { ...STANDARD_M, neckWidthEase: -20, neckDrop: 0 };
    const radius = TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.max;
    const options = { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: radius };
    const notes = tankGuidance(draftTank(m, options), m, options);
    expect(notes).toContainEqual(expect.objectContaining({
      field: `option-${TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID}`, level: "warn",
    }));
    const front = rolePiece(draftTank(m, options), "front");
    expect(pieceEdge(front, "neckline").kind).toBe("line");
  });
});

describe("TANK_NOTCHES / TANK_POMS", () => {
  it("marks front and back with shoulder + side balance notches (2 = back)", () => {
    const front = TANK_NOTCHES.find((r) => r.pieceName === "front")!;
    const back = TANK_NOTCHES.find((r) => r.pieceName === "back")!;
    expect(front.notches).toHaveLength(2);
    expect(back.notches).toHaveLength(3); // shoulder x2 (back ref) + side
  });

  it("drops the 3 sleeve POMs the tee has, keeps everything else", () => {
    expect(TANK_POMS).toHaveLength(7);
    expect(TANK_POMS.some((p) => p.label.toLowerCase().includes("sleeve"))).toBe(false);
  });

  it("anchors only exact same-draft Tank back vertices and leaves front neck drop front-only", () => {
    const variants = [
      STANDARD_M,
      { ...STANDARD_M, chest: 92, shoulderWidth: 39, length: 64, armholeDepth: 19, strapWidth: 9, neckDrop: 8, neckWidthEase: 2, ease: 12 },
      { ...STANDARD_M, chest: 106, shoulderWidth: 44, length: 72, armholeDepth: 24, strapWidth: 13, neckDrop: 3, neckWidthEase: -1, ease: 8 },
    ];
    const methods = [
      { index: 0, edge: "side", at: "start" as const },
      { index: 1, edge: "hem", at: "start" as const },
      { index: 2, edge: "shoulder", at: "end" as const },
      { index: 5, edge: "shoulder", at: "start" as const },
    ];
    for (const measurements of variants) {
      const block = draftTank(measurements);
      for (const method of methods) {
        const pom = TANK_POMS[method.index];
        const frontPoint = method.at === "start"
          ? edgeStart(pieceEdge(rolePiece(block, "front"), method.edge))
          : edgeEnd(pieceEdge(rolePiece(block, "front"), method.edge));
        const backPoint = method.at === "start"
          ? edgeStart(pieceEdge(rolePiece(block, "back"), method.edge))
          : edgeEnd(pieceEdge(rolePiece(block, "back"), method.edge));
        expect(pom.anchor?.(block)).toEqual(frontPoint);
        expect(pom.backAnchor?.(block)).toEqual(backPoint);
        expect(backPoint).toEqual(frontPoint);
        expect(pom.measure(block)).toBeCloseTo(TSHIRT_POMS[method.index].measure(block));
        expect(pom.tolerance).toBe(TSHIRT_POMS[method.index].tolerance);
      }
      expect(TANK_POMS[6].backAnchor).toBeUndefined();
      expect(TANK_POMS[6].anchor?.(block)).toEqual(edgeStart(pieceEdge(rolePiece(block, "front"), "neckline")));
      expect(TANK_POMS[3].backAnchor).toBeUndefined();
      expect(TANK_POMS[4].backAnchor).toBeUndefined();
    }
  });
});

describe("TANK recipe end-to-end — the real C2 test", () => {
  it("is in the garment registry with its own fields (no bicep/sleeveLength)", () => {
    // Slice 63: gained strapWidth/neckDrop — real, user-adjustable measurements
    // for the strap position and neckline scoop depth, not hardcoded recipe
    // constants (TANK-RESEARCH.md found no single sourced number for either).
    expect(TANK.fields).toEqual(["chest", "shoulderWidth", "length", "armholeDepth", "strapWidth", "neckDrop", "neckWidthEase", "ease"]);
  });

  it("grades a POM run that grows in order, with zero engine changes", () => {
    const graded = gradeRun(STANDARD_M, TANK.grade, TANK.sizes, TANK.draft);
    const spec = specSheet(graded, TANK.poms);
    const chest = spec.find((r) => r.label.startsWith("Body chest"))!;
    for (let i = 1; i < chest.values.length; i++) {
      expect(chest.values[i]).toBeGreaterThan(chest.values[i - 1]);
    }
  });

  it("produces a full, passing garmentReport through the generic engine", () => {
    const report = garmentReport(TANK, STANDARD_M);
    expect(report.ok).toBe(true);
    expect(report.checks.map((c) => c.name)).toContain("Hem square to the fold");
  });
});
