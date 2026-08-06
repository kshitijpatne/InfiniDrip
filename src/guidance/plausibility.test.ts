import { describe, it, expect } from "vitest";
import { STANDARD_M, Measurements } from "../drafting";
import {
  MEASUREMENT_BOUNDS,
  RATIO_BOUNDS,
  plausibilityChecks,
  coherenceChecks,
  implausibleFields,
  measurementsPlausible,
} from "./plausibility";

// Every field these two tiers know how to bound/ratio — used below wherever a
// test wants the OLD "check everything" behaviour (i.e. a garment that exposes
// every field these tiers touch, which is what the tee effectively is).
const ALL_FIELDS = Object.keys(MEASUREMENT_BOUNDS) as (keyof Measurements)[];

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
    expect(plausibilityChecks(STANDARD_M, ALL_FIELDS)).toHaveLength(0);
  });

  it("warns on an absurd chest (the headline case: 160 cm)", () => {
    const notes = plausibilityChecks({ ...STANDARD_M, chest: 160 }, ALL_FIELDS);
    expect(notes).toHaveLength(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("Chest (160 cm)");
    expect(notes[0].text).toContain("60–140");
  });

  it("warns below the floor as well as above the ceiling", () => {
    expect(plausibilityChecks({ ...STANDARD_M, chest: 40 }, ALL_FIELDS)).toHaveLength(1);
    expect(plausibilityChecks({ ...STANDARD_M, chest: 200 }, ALL_FIELDS)).toHaveLength(1);
  });

  it("trips each bounded field just outside its range, and only that field", () => {
    for (const [key, b] of Object.entries(MEASUREMENT_BOUNDS)) {
      const below = plausibilityChecks({ ...STANDARD_M, [key]: b!.min - 1 }, ALL_FIELDS);
      const above = plausibilityChecks({ ...STANDARD_M, [key]: b!.max + 1 }, ALL_FIELDS);
      expect(below).toHaveLength(1);
      expect(above).toHaveLength(1);
      expect(below[0].text).toContain(b!.label);
    }
  });

  it("does not flag a wild ease value (ease is out of its scope)", () => {
    expect(plausibilityChecks({ ...STANDARD_M, ease: 99 }, ALL_FIELDS)).toHaveLength(0);
  });

  it("collects one note per offending field", () => {
    const notes = plausibilityChecks({ ...STANDARD_M, chest: 160, length: 200 }, ALL_FIELDS);
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.level === "warn")).toBe(true);
  });
});

describe("coherenceChecks", () => {
  it("clears the standard sample (its ratios are the centre)", () => {
    expect(coherenceChecks(STANDARD_M, ALL_FIELDS)).toHaveLength(0);
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
    expect(plausibilityChecks(m, ALL_FIELDS)).toHaveLength(0); // both individually fine
    const notes = coherenceChecks(m, ALL_FIELDS);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(notes[0].level).toBe("warn");
    expect(notes[0].text).toContain("proportion");
  });

  it("warns when the bicep is implausibly large for the chest", () => {
    const notes = coherenceChecks({ ...STANDARD_M, bicep: 55, chest: 90 }, ALL_FIELDS);
    expect(notes.some((n) => n.text.includes("Bicep"))).toBe(true);
  });

  it("never clamps — it only ever returns warnings, never edits the input", () => {
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    const snapshot = { ...m };
    coherenceChecks(m, ALL_FIELDS);
    expect(m).toEqual(snapshot);
  });
});

describe("implausibleFields", () => {
  it("flags an out-of-range waist or hip (bounds added in Slice 38)", () => {
    expect(implausibleFields({ ...STANDARD_M, waist: 200 }, ALL_FIELDS)).toContain("waist");
    expect(implausibleFields({ ...STANDARD_M, hip: 10 }, ALL_FIELDS)).toContain("hip");
    expect(implausibleFields(STANDARD_M, ALL_FIELDS)).not.toContain("waist");
  });
  it("is empty for the standard sample", () => {
    expect(implausibleFields(STANDARD_M, ALL_FIELDS)).toHaveLength(0);
  });

  it("returns exactly the fields outside their own bound", () => {
    const fields = implausibleFields({ ...STANDARD_M, chest: 160, length: 200 }, ALL_FIELDS);
    expect([...fields].sort()).toEqual(["chest", "length"]);
  });

  it("agrees with plausibilityChecks: one field flagged ⇔ one note", () => {
    const m = { ...STANDARD_M, bicep: 5 };
    expect(implausibleFields(m, ALL_FIELDS)).toHaveLength(plausibilityChecks(m, ALL_FIELDS).length);
  });
});

describe("measurementsPlausible", () => {
  it("is true for the standard sample", () => {
    expect(measurementsPlausible(STANDARD_M, ALL_FIELDS)).toBe(true);
  });

  it("is false when a field is out of range", () => {
    expect(measurementsPlausible({ ...STANDARD_M, chest: 160 }, ALL_FIELDS)).toBe(false);
  });

  it("is false on a coherence failure even when every field is individually in range", () => {
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    expect(implausibleFields(m, ALL_FIELDS)).toHaveLength(0); // each field fine
    expect(measurementsPlausible(m, ALL_FIELDS)).toBe(false); // but the ratio is not
  });
});

// Slice 41: the two tiers used to check EVERY bounded field/ratio regardless of
// which measurements the current garment actually exposes. On the skirt, chest
// sits frozen at its STANDARD_M default (the skirt has no chest control), so a
// short skirt used to trip a spurious "Body length and chest look out of
// proportion" warning about a field the user never touched. These tiers are now
// scoped to a `fields` list — the real fix is `guide()` passing `recipe.fields`
// (see guidance.test.ts), but the scoping itself is unit-tested here directly.
describe("garment-scoping (Slice 41)", () => {
  const SKIRT_FIELDS: (keyof Measurements)[] = ["waist", "hip", "length", "ease"];

  it("implausibleFields ignores a bound whose field the garment doesn't expose", () => {
    // chest 999 is wildly out of bounds, but "chest" isn't in SKIRT_FIELDS.
    expect(implausibleFields({ ...STANDARD_M, chest: 999 }, SKIRT_FIELDS)).toHaveLength(0);
  });

  it("implausibleFields still catches a bound the garment DOES expose", () => {
    expect(implausibleFields({ ...STANDARD_M, waist: 999 }, SKIRT_FIELDS)).toContain("waist");
  });

  it("plausibilityChecks stays silent on an out-of-scope field", () => {
    expect(plausibilityChecks({ ...STANDARD_M, chest: 999 }, SKIRT_FIELDS)).toHaveLength(0);
  });

  it("coherenceChecks skips a ratio when the 'per' field isn't exposed — the exact skirt bug", () => {
    // length 45 / chest 100 = 0.45, below the 0.52 floor — would warn under the
    // old unscoped behaviour, since "length" is in SKIRT_FIELDS but "chest" isn't.
    const m = { ...STANDARD_M, length: 45 };
    expect(coherenceChecks(m, ALL_FIELDS).some((n) => n.text.includes("proportion"))).toBe(true);
    expect(coherenceChecks(m, SKIRT_FIELDS)).toHaveLength(0);
  });

  it("coherenceChecks still runs a ratio when both its fields ARE exposed", () => {
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    const fields: (keyof Measurements)[] = ["chest", "shoulderWidth"];
    expect(coherenceChecks(m, fields).length).toBeGreaterThanOrEqual(1);
  });

  it("measurementsPlausible is true for a skirt even with an absurd frozen chest", () => {
    expect(measurementsPlausible({ ...STANDARD_M, chest: 999, length: 45 }, SKIRT_FIELDS)).toBe(true);
  });

  it("measurementsPlausible is still false for a skirt whose OWN field is out of range", () => {
    expect(measurementsPlausible({ ...STANDARD_M, waist: 999 }, SKIRT_FIELDS)).toBe(false);
  });

  // Slice 42: hipDepth joined the bounds table. It belongs to the skirt only, so
  // Slice 41's scoping is what keeps the tee from ever judging it.
  it("flags an out-of-range hipDepth for a garment that exposes it", () => {
    const withDepth: (keyof Measurements)[] = [...SKIRT_FIELDS, "hipDepth"];
    expect(implausibleFields({ ...STANDARD_M, hipDepth: 60 }, withDepth)).toContain("hipDepth");
    expect(implausibleFields({ ...STANDARD_M, hipDepth: 5 }, withDepth)).toContain("hipDepth");
    expect(implausibleFields(STANDARD_M, withDepth)).not.toContain("hipDepth");
  });

  it("never flags hipDepth on the tee, which doesn't expose it", () => {
    const TEE_FIELDS: (keyof Measurements)[] =
      ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"];
    expect(implausibleFields({ ...STANDARD_M, hipDepth: 999 }, TEE_FIELDS)).toHaveLength(0);
    expect(measurementsPlausible({ ...STANDARD_M, hipDepth: 999 }, TEE_FIELDS)).toBe(true);
  });
});
