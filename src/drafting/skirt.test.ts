import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { blockPieces, rolePiece } from "./block";
import { pieceEdge, edgeStart, edgeEnd } from "./piece";
import { draftSkirt, skirtPanelChecks, skirtGuidance, SKIRT_GRADE, SKIRT_POMS, skirtPanel } from "./skirt";
import { stitchChecks } from "./stitch";
import { SKIRT, gradeRun, specSheet } from "./index";

/** The whole sewability surface for a skirt — stitches plus panel checks
 *  together, the same combination garmentReport assembles in production. */
function allSkirtChecks(b: ReturnType<typeof draftSkirt>) {
  return [...stitchChecks(b, b.stitches), ...skirtPanelChecks(b)];
}

describe("draftSkirt", () => {
  it("drafts a front panel, back panel, and waistband — no sleeve", () => {
    const b = draftSkirt(STANDARD_M);
    expect(blockPieces(b).map((p) => p.name).sort()).toEqual(["back", "front", "waistband"]);
    const edges = rolePiece(b, "front").edges.map((e) => e.name);
    expect(edges).toEqual(["waist", "sideUpper", "sideLower", "hem", "center"]);
    expect(() => rolePiece(b, "sleeve")).toThrow(); // structurally not a top
  });

  it("makes the hip wider than the waist (the side seam tapers out)", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    const waistX = edgeEnd(pieceEdge(front, "waist")).x;      // side point at the waist
    const hipX = edgeStart(pieceEdge(front, "sideLower")).x;   // side point at the hip
    expect(hipX).toBeGreaterThan(waistX);
  });

  it("adds ease around the hip: finished hip = hip + ease", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    const hipQuarter = edgeStart(pieceEdge(front, "sideLower")).x;
    expect(hipQuarter * 4).toBeCloseTo(STANDARD_M.hip + STANDARD_M.ease, 5);
  });

  // Slice 42: the waist-to-hip drop used to be a hard-coded HIP_DROP = 20 in this
  // file AND in render/skirt-figure.ts. It is now the real `hipDepth` measurement.
  // The gate is a MEASURED y-coordinate on the drafted piece, not a re-derivation.
  it("puts the hip point at exactly m.hipDepth below the waist", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    expect(edgeStart(pieceEdge(front, "sideLower")).y).toBeCloseTo(STANDARD_M.hipDepth, 5);
  });

  it("moves the hip point when hipDepth changes — it is no longer a constant", () => {
    const deep = rolePiece(draftSkirt({ ...STANDARD_M, hipDepth: 28 }), "front");
    expect(edgeStart(pieceEdge(deep, "sideLower")).y).toBeCloseTo(28, 5);

    const shallow = rolePiece(draftSkirt({ ...STANDARD_M, hipDepth: 14 }), "front");
    expect(edgeStart(pieceEdge(shallow, "sideLower")).y).toBeCloseTo(14, 5);
  });

  it("still drafts a sewable panel at the extremes of the hipDepth range", () => {
    for (const hipDepth of [12, 35]) {
      const b = draftSkirt({ ...STANDARD_M, hipDepth });
      expect(allSkirtChecks(b).every((c) => c.ok)).toBe(true);
    }
  });
});

describe("skirtPanelChecks", () => {
  it("returns just the hem and waist checks — the side seam is a stitch now, not here", () => {
    const checks = skirtPanelChecks(draftSkirt(STANDARD_M));
    expect(checks.map((c) => c.name)).toEqual(["Hem square to the fold", "Waist square to the fold"]);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("combined with its stitch, the full skirt check surface passes and names no sleeve", () => {
    const b = draftSkirt(STANDARD_M);
    const checks = allSkirtChecks(b);
    expect(checks.every((c) => c.ok)).toBe(true);
    const names = checks.map((c) => c.name);
    expect(names).toContain("Side seam (front ↔ back)");
    expect(names).toContain("Hem square to the fold");
    expect(names).toContain("Waist square to the fold");
    expect(names.join(" ")).not.toContain("Sleeve");
  });
});

describe("skirtGuidance", () => {
  it("is happy with a normal waist < hip and comfortable ease", () => {
    const notes = skirtGuidance(draftSkirt(STANDARD_M), STANDARD_M);
    expect(notes.every((n) => n.level === "ok")).toBe(true);
  });

  it("warns when the waist is not smaller than the hip", () => {
    const m = { ...STANDARD_M, waist: 110, hip: 100 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("wider"))).toBe(true);
  });

  // Slice 42: making hipDepth editable opened a failure mode that was unreachable
  // while it was a constant — a hem at or above the hip line folds the panel over
  // itself. Warn, never clamp: the draft still runs, the user is told.
  it("warns when the hem does not clear the hip depth", () => {
    const m = { ...STANDARD_M, length: 18, hipDepth: 24 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("clear the hip depth"))).toBe(true);
  });

  it("warns on the exact boundary (hem level with the hip), not just below it", () => {
    const m = { ...STANDARD_M, length: 20, hipDepth: 20 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.text.includes("clear the hip depth"))).toBe(true);
  });

  it("stays silent about hip depth on a normal skirt", () => {
    const notes = skirtGuidance(draftSkirt(STANDARD_M), STANDARD_M);
    expect(notes.some((n) => n.text.includes("clear the hip depth"))).toBe(false);
  });

  it("warns on too-tight ease and informs on loose ease", () => {
    expect(skirtGuidance(draftSkirt(STANDARD_M), { ...STANDARD_M, ease: 0 }).some((n) => n.level === "warn")).toBe(true);
    expect(skirtGuidance(draftSkirt(STANDARD_M), { ...STANDARD_M, ease: 20 }).some((n) => n.level === "info")).toBe(true);
  });
});

describe("SKIRT recipe end-to-end", () => {
  it("grades a POM run that grows in order", () => {
    const graded = gradeRun(STANDARD_M, SKIRT_GRADE, SKIRT.sizes, draftSkirt);
    const spec = specSheet(graded, SKIRT_POMS);
    const hip = spec.find((r) => r.label.startsWith("Hip"))!;
    for (let i = 1; i < hip.values.length; i++) {
      expect(hip.values[i]).toBeGreaterThan(hip.values[i - 1]);
    }
  });

  it("uses the lower-body field set (waist/hip/hipDepth, no chest/sleeve)", () => {
    expect(SKIRT.fields).toEqual(["waist", "hip", "hipDepth", "length", "ease"]);
  });

  it("gives its anchored POMs a point on the front piece (for tech-pack leaders)", () => {
    const b = draftSkirt(STANDARD_M);
    for (const pom of SKIRT_POMS) {
      if (pom.anchor) {
        const p = pom.anchor(b);
        expect(typeof p.x).toBe("number");
        expect(typeof p.y).toBe("number");
      }
    }
  });
});

describe("skirtPanel — the Component contract (Phase C1, Slice 58)", () => {
  it("keys its piece under the requested position, exposes a waist interface, declares no internal stitches", () => {
    const result = skirtPanel(STANDARD_M, { position: "front", silhouette: "straight" });
    expect(Object.keys(result.pieces)).toEqual(["front"]);
    expect(result.pieces.front.name).toBe("front");
    expect(result.stitches).toHaveLength(0);
    expect(result.interfaces.waist.edges).toEqual([{ piece: "front", edge: "waist" }]);
  });

  it("throws on any silhouette other than \"straight\" — flare isn't drafted yet", () => {
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: "flare" }))
      .toThrow(/not yet implemented/);
  });

  it("draftSkirt's front and back pieces ARE skirtPanel's output, not a re-derivation of it", () => {
    const b = draftSkirt(STANDARD_M);
    expect(rolePiece(b, "front")).toEqual(skirtPanel(STANDARD_M, { position: "front", silhouette: "straight" }).pieces.front);
    expect(rolePiece(b, "back")).toEqual(skirtPanel(STANDARD_M, { position: "back", silhouette: "straight" }).pieces.back);
  });
});
