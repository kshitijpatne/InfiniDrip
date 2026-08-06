import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { blockPieces, rolePiece } from "./block";
import { pieceEdge, edgeStart, edgeEnd } from "./piece";
import { draftSkirt, skirtChecks, skirtGuidance, SKIRT_GRADE, SKIRT_POMS } from "./skirt";
import { SKIRT, gradeRun, specSheet } from "./index";

describe("draftSkirt", () => {
  it("drafts a front and back panel, each with the skirt's edges and no sleeve", () => {
    const b = draftSkirt(STANDARD_M);
    expect(blockPieces(b).map((p) => p.name).sort()).toEqual(["back", "front"]);
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
      expect(skirtChecks(b).every((c) => c.ok)).toBe(true);
    }
  });
});

describe("skirtChecks", () => {
  it("passes on a real skirt and names no sleeve", () => {
    const checks = skirtChecks(draftSkirt(STANDARD_M));
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
