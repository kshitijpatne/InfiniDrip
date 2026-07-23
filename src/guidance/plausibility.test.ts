import { describe, it, expect } from "vitest";
import { STANDARD_M, Measurements } from "../drafting";
import {
  MEASUREMENT_BOUNDS,
  RATIO_BOUNDS,
  plausibilityChecks,
  coherenceChecks,
} from "./plausibility";

describe("MEASUREMENT_BOUNDS — the table itself is sane", () => {
  it("every bound has min < max", () => {
    for (const b of Object.values(MEASUREMENT_BOUNDS)) {
      expect(b!.min).toBeLessThan(b!.max);
    }
  });

  it("the known-good sample (STANDARD_M) sits strictly inside every bound", () => {
    for (const [key, b] of Object.entries(MEASUREMENT_BOUNDS)) {
      const v = STANDARD_M[key as keyof Measurements];
      expect(v).toBeGreaterThan(b!.min);
      expect(v).toBeLessThan(b!.max);
    }
  });

  it("does not bound ease — easeRange already owns it", () => {
    expect("ease" in MEASUREMENT_BOUNDS).toBe(false);
  });
});

describe("plausibilityChecks", () => {
  it("clears the standard sample with no warnings", () => {
    expect(plausibilityChecks(STANDARD_M)).toHaveLength(0);
  });

  it("warns on an absurd chest (the headline case: 160 cm)", () => {
    const notes = plausibilityChecks({ ...STANDARD_M, chest: 160 });
    expect(notes).toHaveLength(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("Chest (160 cm)");
    expect(notes[0].text).toContain("60–140");
  });

  it("warns below the floor as well as above the ceiling", () => {
    expect(plausibilityChecks({ ...STANDARD_M, chest: 40 })).toHaveLength(1);
    expect(plausibilityChecks({ ...STANDARD_M, chest: 200 })).toHaveLength(1);
  });

  it("trips each bounded field just outside its range, and only that field", () => {
    for (const [key, b] of Object.entries(MEASUREMENT_BOUNDS)) {
      const below = plausibilityChecks({ ...STANDARD_M, [key]: b!.min - 1 });
      const above = plausibilityChecks({ ...STANDARD_M, [key]: b!.max + 1 });
      expect(below).toHaveLength(1);
      expect(above).toHaveLength(1);
      expect(below[0].text).toContain(b!.label);
    }
  });

  it("does not flag a wild ease value (ease is out of its scope)", () => {
    expect(plausibilityChecks({ ...STANDARD_M, ease: 99 })).toHaveLength(0);
  });

  it("collects one note per offending field", () => {
    const notes = plausibilityChecks({ ...STANDARD_M, chest: 160, length: 200 });
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.level === "warn")).toBe(true);
  });
});

describe("coherenceChecks", () => {
  it("clears the standard sample (its ratios are the centre)", () => {
    expect(coherenceChecks(STANDARD_M)).toHaveLength(0);
  });

  it("STANDARD_M sits inside every ratio band", () => {
    for (const r of RATIO_BOUNDS) {
      const ratio = STANDARD_M[r.of] / STANDARD_M[r.per];
      expect(ratio).toBeGreaterThan(r.min);
      expect(ratio).toBeLessThan(r.max);
    }
  });

  it("catches a mismatched set even when BOTH values pass their own bounds", () => {
    // chest 130 (in 60–140) + shoulder 40 (in 30–60): each bound passes, but the
    // ratio 40/130 = 0.31 is below the 0.36 floor — the coherence net catches it.
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    expect(plausibilityChecks(m)).toHaveLength(0); // both individually fine
    const notes = coherenceChecks(m);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("proportion");
  });

  it("warns when the bicep is implausibly large for the chest", () => {
    const notes = coherenceChecks({ ...STANDARD_M, bicep: 55, chest: 90 });
    expect(notes.some((n) => n.text.includes("Bicep"))).toBe(true);
  });

  it("never clamps — it only ever returns warnings, never edits the input", () => {
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    const snapshot = { ...m };
    coherenceChecks(m);
    expect(m).toEqual(snapshot);
  });
});
