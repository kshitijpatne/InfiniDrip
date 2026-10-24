import { describe, expect, it } from "vitest";
import { analyzeBandStretch } from "./band-stretch";

describe("analyzeBandStretch", () => {
  it("reports equal walked opening and finished band lengths without a fit verdict", () => {
    expect(analyzeBandStretch(40.5, 40.5)).toEqual({
      calculable: true,
      openingLengthCm: 40.5,
      bandLengthCm: 40.5,
      openingToBandRatio: 1,
      requiredStretchPercent: 0,
      issues: [],
    });
  });

  it("calculates positive, negative, and very large representable stretch without a threshold", () => {
    const shorterBand = analyzeBandStretch(40.5, 34.425);
    expect(shorterBand.calculable).toBe(true);
    if (!shorterBand.calculable) throw new Error("expected a calculable shorter-band result");
    expect(shorterBand.openingToBandRatio).toBeCloseTo(40.5 / 34.425, 12);
    expect(shorterBand.requiredStretchPercent).toBeCloseTo((40.5 / 34.425 - 1) * 100, 12);

    const longerBand = analyzeBandStretch(30, 45);
    expect(longerBand.calculable).toBe(true);
    if (!longerBand.calculable) throw new Error("expected a calculable longer-band result");
    expect(longerBand.openingToBandRatio).toBeCloseTo(2 / 3, 12);
    expect(longerBand.requiredStretchPercent).toBeCloseTo(-100 / 3, 12);

    const large = analyzeBandStretch(1e300, 1e290);
    expect(large.calculable).toBe(true);
    if (!large.calculable) throw new Error("expected a calculable large result");
    expect(large.openingToBandRatio).toBe(1e10);
    expect(large.requiredStretchPercent).toBe(999_999_999_900);
  });

  it.each([
    ["openingLengthCm", Number.NaN, 20, "non-finite"],
    ["openingLengthCm", Number.POSITIVE_INFINITY, 20, "non-finite"],
    ["openingLengthCm", 0, 20, "not-positive"],
    ["openingLengthCm", -1, 20, "not-positive"],
    ["bandLengthCm", 20, Number.NEGATIVE_INFINITY, "non-finite"],
    ["bandLengthCm", 20, Number.NaN, "non-finite"],
    ["bandLengthCm", 20, 0, "not-positive"],
    ["bandLengthCm", 20, -1, "not-positive"],
  ] as const)("retains invalid input values and identifies %s (%s)", (field, opening, band, code) => {
    const result = analyzeBandStretch(opening, band);
    expect(result.calculable).toBe(false);
    expect(result.openingLengthCm).toBe(opening);
    expect(result.bandLengthCm).toBe(band);
    expect(result.openingToBandRatio).toBeNull();
    expect(result.requiredStretchPercent).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ field, code }));
    expect(result.issues[0]?.message).toMatch(/must be|review/i);
  });

  it("reports both invalid source values instead of stopping at the first", () => {
    const result = analyzeBandStretch(-2, 0);

    expect(result.calculable).toBe(false);
    expect(result.openingLengthCm).toBe(-2);
    expect(result.bandLengthCm).toBe(0);
    expect(result.issues).toEqual([
      expect.objectContaining({ field: "openingLengthCm", code: "not-positive" }),
      expect.objectContaining({ field: "bandLengthCm", code: "not-positive" }),
    ]);
  });

  it.each([
    [Number.MAX_VALUE, Number.MIN_VALUE],
    [Number.MIN_VALUE, Number.MAX_VALUE],
  ])("reports an unrepresentable ratio for opening %s and band %s", (opening, band) => {
    const result = analyzeBandStretch(opening, band);

    expect(result).toMatchObject({
      calculable: false,
      openingLengthCm: opening,
      bandLengthCm: band,
      openingToBandRatio: null,
      requiredStretchPercent: null,
      issues: [expect.objectContaining({ field: "calculation", code: "unrepresentable" })],
    });
  });

  it("reports an unrepresentable implied percentage even when the ratio itself is finite", () => {
    const openingLengthCm = Number.MAX_VALUE;
    const result = analyzeBandStretch(openingLengthCm, 1);

    expect(Number.isFinite(openingLengthCm / 1)).toBe(true);
    expect(result).toMatchObject({
      calculable: false,
      openingLengthCm,
      bandLengthCm: 1,
      openingToBandRatio: null,
      requiredStretchPercent: null,
      issues: [expect.objectContaining({ field: "calculation", code: "unrepresentable" })],
    });
  });
});
