import { describe, it, expect } from "vitest";
import { STANDARD_M, derive } from "./measurements";
import { sleevelessArmhole } from "./armhole";

const d = derive(STANDARD_M);
const NECK_WIDTH_HALF = d.neckWidthHalf; // 7 — stands in for hps.x in isolation
const SHOULDER_HALF = d.shoulderHalf;    // 22.5
const CHEST_WIDTH_HALF = d.chestWidthHalf; // 27.5
const ARMHOLE_DEPTH = STANDARD_M.armholeDepth; // 24

describe("sleevelessArmhole — points", () => {
  it("places the strap at (strapWidth, shoulderSlope) and the underarm unchanged from the sleeved point", () => {
    const { strap, underarm } = sleevelessArmhole(
      15, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(strap).toEqual({ x: 15, y: d.shoulderSlope });
    // TANK-RESEARCH.md Finding 2: the underarm point itself doesn't move —
    // only the curve's shape between the strap and it does.
    expect(underarm).toEqual({ x: CHEST_WIDTH_HALF, y: ARMHOLE_DEPTH });
  });

  it("is a curve, not a line — an armhole is always a curve, unlike the neckline's optional V", () => {
    const { edge } = sleevelessArmhole(15, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(edge.kind).toBe("curve");
  });
});

describe("sleevelessArmhole — cuts further in than the sleeved curve (TANK-RESEARCH.md Finding 2)", () => {
  it("pulls its control points in toward the centreline relative to the straight strap-to-underarm line", () => {
    const strapWidth = 15;
    const { edge } = sleevelessArmhole(strapWidth, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    if (edge.kind !== "curve") throw new Error("expected a curve");
    // The straight line from strap to underarm, at the same fraction along
    // its length as each control point: a curve that "cuts in" must sit
    // strictly INSIDE (smaller x than) that straight reference at both
    // control points — an open scoop, not a curve that bulges OUT the way
    // a sleeve-cap-accommodating curve would.
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
    const straightAt25 = lerp(strapWidth, CHEST_WIDTH_HALF, 0.25);
    const straightAt75 = lerp(strapWidth, CHEST_WIDTH_HALF, 0.75);
    expect(edge.curve.control1.x).toBeLessThan(straightAt25);
    expect(edge.curve.control2.x).toBeLessThan(straightAt75);
  });

  it("cuts further in for a narrower strap and less for a wider one, at the same underarm point", () => {
    const narrow = sleevelessArmhole(12, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    const wide = sleevelessArmhole(20, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    if (narrow.edge.kind !== "curve" || wide.edge.kind !== "curve") throw new Error("expected curves");
    expect(narrow.underarm).toEqual(wide.underarm); // Finding 2: underarm never moves
    expect(narrow.strap.x).not.toBe(wide.strap.x);   // only the strap does
  });
});

describe("sleevelessArmhole guardrails — warn, never clamp", () => {
  it("warns when the strap is as narrow as, or narrower than, the neckline", () => {
    const { notes } = sleevelessArmhole(7, 7, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(notes).toHaveLength(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("narrow");
  });

  it("warns when the strap reaches the full shoulder width", () => {
    const { notes } = sleevelessArmhole(SHOULDER_HALF, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(notes).toHaveLength(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("shoulder");
  });

  it("is silent for an ordinary strap width comfortably between the two", () => {
    const { notes } = sleevelessArmhole(15, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(notes).toHaveLength(0);
  });

  it("never clamps — the strap point is exactly what was asked for even when a guardrail fires", () => {
    const { strap, notes } = sleevelessArmhole(SHOULDER_HALF, NECK_WIDTH_HALF, SHOULDER_HALF, d.shoulderSlope, CHEST_WIDTH_HALF, ARMHOLE_DEPTH);
    expect(notes.length).toBeGreaterThan(0); // the guardrail did fire
    expect(strap.x).toBe(SHOULDER_HALF);     // but the geometry drafted anyway, unclamped
  });
});
