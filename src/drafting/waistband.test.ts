import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { pieceEdge, edgeLength } from "./piece";
import { waistband, WAISTBAND_DEFAULT } from "./waistband";
import { draftSkirt, SKIRT_POMS, SKIRT_GRADE } from "./skirt";
import { rolePiece } from "./block";
import { gradeRun } from "./grading";
import { specSheet } from "./pom";
import { SKIRT } from "./recipe";

describe("waistband — the Component contract", () => {
  it("keys its piece under \"waistband\", cut on the fold, declares no internal stitches or interfaces", () => {
    const result = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    expect(Object.keys(result.pieces)).toEqual(["waistband"]);
    expect(result.pieces.waistband.name).toBe("waistband");
    expect(result.pieces.waistband.onFold).toBe(true);
    expect(result.stitches).toHaveLength(0);
    expect(result.interfaces).toEqual({});
  });

  it("has exactly the four edges the design calls for: top, end, seam, fold", () => {
    const { pieces } = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    expect(pieces.waistband.edges.map((e) => e.name)).toEqual(["top", "end", "seam", "fold"]);
  });
});

describe("waistband geometry", () => {
  it("its half-circumference is (waist + ease) / 2 — doubled by the fold, matching the finished waist", () => {
    const { pieces } = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    const halfCirc = edgeLength(pieceEdge(pieces.waistband, "top"));
    expect(halfCirc).toBeCloseTo((STANDARD_M.waist + STANDARD_M.ease) / 2, 6);
  });

  it("the seam edge (sewn to the body) is the SAME length as the top edge — a plain rectangle", () => {
    const { pieces } = waistband(STANDARD_M, WAISTBAND_DEFAULT);
    expect(edgeLength(pieceEdge(pieces.waistband, "seam")))
      .toBeCloseTo(edgeLength(pieceEdge(pieces.waistband, "top")), 6);
  });

  it("its height is genuinely params.depth, not a fixed constant", () => {
    const shallow = waistband(STANDARD_M, { depth: 2, closure: "button" });
    const deep = waistband(STANDARD_M, { depth: 6, closure: "button" });
    const height = (r: typeof shallow) => edgeLength(pieceEdge(r.pieces.waistband, "end"));
    expect(height(deep)).toBeGreaterThan(height(shallow));
  });
});

describe("waistband — closure is geometry-inert (deliberate design decision)", () => {
  it("button and hook produce IDENTICAL geometry — closure only affects BOM/notions, never the pattern", () => {
    const button = waistband(STANDARD_M, { depth: 3.5, closure: "button" });
    const hook = waistband(STANDARD_M, { depth: 3.5, closure: "hook" });
    expect(button.pieces.waistband).toEqual(hook.pieces.waistband);
  });
});

describe("Phase B5 wiring: draftSkirt really drafts a waistband now", () => {
  it("the block has a waistband role alongside front and back", () => {
    const b = draftSkirt(STANDARD_M);
    expect(rolePiece(b, "waistband").name).toBe("waistband");
  });

  it("the waistband's finished length (doubled, cut on fold) equals the existing Waist POM, by construction", () => {
    const b = draftSkirt(STANDARD_M);
    const finishedWaistband = 2 * edgeLength(pieceEdge(rolePiece(b, "waistband"), "top"));
    const waistPom = SKIRT_POMS.find((p) => p.label.startsWith("Waist"))!;
    expect(finishedWaistband).toBeCloseTo(waistPom.measure(b), 6);
  });

  it("grades cleanly across the size run — the waistband grows with every size, in order", () => {
    const graded = gradeRun(STANDARD_M, SKIRT_GRADE, SKIRT.sizes, draftSkirt);
    const lengths = graded.map((g) => edgeLength(pieceEdge(rolePiece(g.block, "waistband"), "top")));
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeGreaterThan(lengths[i - 1]);
    }
  });

  it("appears in the graded spec sheet without breaking it", () => {
    const graded = gradeRun(STANDARD_M, SKIRT_GRADE, SKIRT.sizes, draftSkirt);
    expect(() => specSheet(graded, SKIRT_POMS)).not.toThrow();
  });
});
