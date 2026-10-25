import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftTank, tankGuidance, TANK_NOTCHES, TANK_POMS } from "./tank";
import { TANK, gradeRun, specSheet } from "./index";
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
