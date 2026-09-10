import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftTank, tankGuidance, TANK_NOTCHES, TANK_POMS } from "./tank";
import { TANK, gradeRun, specSheet } from "./index";
import { rolePiece, blockPieces } from "./block";
import { pieceEdge } from "./piece";
import { stitchChecks } from "./stitch";
import { garmentReport } from "../guidance/garment-check";

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

  it("widens BOTH shoulder points equally, so the shoulder seam still matches (TANK_BACK_NECKLINE's whole reason to exist)", () => {
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
});

describe("TANK recipe end-to-end — the real C2 test", () => {
  it("is in the garment registry with its own fields (no bicep/sleeveLength)", () => {
    expect(TANK.fields).toEqual(["chest", "shoulderWidth", "length", "armholeDepth", "ease"]);
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
