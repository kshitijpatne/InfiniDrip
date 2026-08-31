import { describe, it, expect } from "vitest";
import { TEE, STANDARD_M } from "./index";
import { sampleSpec, compareFit, PredictedPom } from "./fit-compare";

describe("sampleSpec", () => {
  const spec = sampleSpec(TEE, STANDARD_M);

  it("returns one entry per POM the recipe declares", () => {
    expect(spec).toHaveLength(TEE.poms.length);
  });

  it("reads every value off the SAME block the recipe drafts at m — not a re-derivation", () => {
    const block = TEE.draft(STANDARD_M);
    for (const pom of TEE.poms) {
      const entry = spec.find((s) => s.label === pom.label)!;
      expect(entry.value).toBeCloseTo(pom.measure(block), 1);
    }
  });

  it("carries the POM's own tolerance through unchanged", () => {
    for (const pom of TEE.poms) {
      const entry = spec.find((s) => s.label === pom.label)!;
      expect(entry.tolerance).toBe(pom.tolerance);
    }
  });

  it("changes when the measurements change", () => {
    const wider = sampleSpec(TEE, { ...STANDARD_M, chest: 110 });
    expect(wider).not.toEqual(spec);
  });
});

describe("compareFit", () => {
  const predicted: PredictedPom[] = [
    { label: "Chest", value: 100, tolerance: 1 },
    { label: "Length", value: 70, tolerance: 0.5 },
    { label: "No-tolerance POM", value: 50 }, // no tolerance declared
  ];

  it("reports zero delta and a pass when actual matches predicted exactly", () => {
    const [chest] = compareFit(predicted, { Chest: 100, Length: 70, "No-tolerance POM": 50 });
    expect(chest.delta).toBe(0);
    expect(chest.withinTolerance).toBe(true);
  });

  it("passes when the delta is exactly AT the tolerance boundary (inclusive)", () => {
    const [chest] = compareFit(predicted, { Chest: 101, Length: 70, "No-tolerance POM": 50 });
    expect(chest.delta).toBe(1);
    expect(chest.withinTolerance).toBe(true); // 1.0 <= tolerance 1.0
  });

  it("fails when the delta is just past the tolerance boundary", () => {
    const [chest] = compareFit(predicted, { Chest: 101.1, Length: 70, "No-tolerance POM": 50 });
    expect(chest.delta).toBeCloseTo(1.1, 5);
    expect(chest.withinTolerance).toBe(false);
  });

  it("treats undersewn (negative delta) the same as oversewn, via Math.abs", () => {
    const [, length] = compareFit(predicted, { Chest: 100, Length: 69.4, "No-tolerance POM": 50 });
    expect(length.delta).toBeCloseTo(-0.6, 5);
    expect(length.withinTolerance).toBe(false); // |−0.6| > 0.5
  });

  it("reports null — not true or false — when the POM has no declared tolerance", () => {
    const [, , noTol] = compareFit(predicted, { Chest: 100, Length: 70, "No-tolerance POM": 55 });
    expect(noTol.delta).toBe(5);
    expect(noTol.withinTolerance).toBeNull();
  });

  it("throws a clear error when an actual measurement is missing for a predicted label", () => {
    expect(() => compareFit(predicted, { Chest: 100, Length: 70 })).toThrow(
      'No actual measurement recorded for "No-tolerance POM"'
    );
  });

  it("returns one FitResult per predicted POM, in the same order", () => {
    const results = compareFit(predicted, { Chest: 100, Length: 70, "No-tolerance POM": 50 });
    expect(results.map((r) => r.label)).toEqual(["Chest", "Length", "No-tolerance POM"]);
  });
});
