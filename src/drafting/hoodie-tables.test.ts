import { describe, expect, it } from "vitest";
import { allowanceFor } from "./allowance";
import { blockPieces } from "./block";
import { draftHoodie, type HoodieDraftOptions } from "./hoodie";
import { HOODIE_DEFAULT_OPTIONS, type HoodieOptions } from "./hoodie-contract";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { pieceEdge } from "./piece";
import {
  HOODIE_ALLOWANCES,
  HOODIE_GRADE,
  HOODIE_NOTCHES,
  HOODIE_POMS,
  HOODIE_SIZES,
  HOODIE_TECH_PACK,
  hoodieBandMeasurements,
  hoodieTechPackForOptions,
  resolveHoodieOptionsForSize,
} from "./hoodie-tables";

function draftOptions(options: Record<string, number> = HOODIE_DEFAULT_OPTIONS): HoodieDraftOptions {
  return options as HoodieDraftOptions;
}

function draftAt(measurements = STANDARD_M, options: Record<string, number> = HOODIE_DEFAULT_OPTIONS) {
  return draftHoodie(measurements, draftOptions(options));
}

function sizeOptions(step: number, options: Record<string, number> = HOODIE_DEFAULT_OPTIONS): HoodieOptions {
  const sizeMeasurements = gradeMeasurements(STANDARD_M, HOODIE_GRADE, step);
  return resolveHoodieOptionsForSize({
    baseMeasurements: STANDARD_M,
    sizeMeasurements,
    step,
    draft: (measurements, draftOptionsValue = options) =>
      draftHoodie(measurements, draftOptions(draftOptionsValue)),
    baseOptions: options,
  }) as HoodieOptions;
}

describe("Hoodie recipe grade and production tables", () => {
  it("reuses the adult XS-XL body grade and proportions only actual cuff and hem openings", () => {
    expect(HOODIE_GRADE).toEqual({
      chest: 5,
      shoulderWidth: 1.2,
      bicep: 1.5,
      length: 2,
      armholeDepth: 0.6,
      sleeveLength: 0.8,
    });
    expect(HOODIE_SIZES.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);

    const base = draftAt();
    const baseJoins = hoodieBandMeasurements(base, HOODIE_DEFAULT_OPTIONS);
    expect(baseJoins.map(({ role }) => role)).toEqual(["cuffLeft", "cuffRight", "hemBand"]);
    expect(baseJoins.every(({ analysis }) => analysis.calculable)).toBe(true);
    expect(baseJoins[0]?.openingLengthCm).toBeCloseTo(baseJoins[1]!.openingLengthCm, 8);
    expect(baseJoins[0]?.bandEdgeLengthCm).toBeCloseTo(HOODIE_DEFAULT_OPTIONS.cuffLength, 8);
    expect(baseJoins[2]?.bandEdgeLengthCm).toBeCloseTo(HOODIE_DEFAULT_OPTIONS.hemBandLength, 8);
    const missingOptions = hoodieBandMeasurements(base, {});
    expect(missingOptions.every(({ bandLengthCm, analysis }) =>
      Number.isNaN(bandLengthCm) && !analysis.calculable)).toBe(true);

    for (const size of HOODIE_SIZES) {
      const resolved = sizeOptions(size.step);
      const drafted = draftAt(gradeMeasurements(STANDARD_M, HOODIE_GRADE, size.step), resolved);
      const joins = hoodieBandMeasurements(drafted, resolved);
      const cuff = joins.find(({ role }) => role === "cuffLeft")!;
      const hem = joins.find(({ role }) => role === "hemBand")!;
      const expectedCuff = HOODIE_DEFAULT_OPTIONS.cuffLength *
        cuff.openingLengthCm / baseJoins[0]!.openingLengthCm;
      const expectedHem = HOODIE_DEFAULT_OPTIONS.hemBandLength *
        hem.openingLengthCm / baseJoins[2]!.openingLengthCm;

      expect(resolved.cuffLength).toBeCloseTo(expectedCuff, 8);
      expect(resolved.hemBandLength).toBeCloseTo(expectedHem, 8);
      expect(resolved.cuffDepth).toBe(HOODIE_DEFAULT_OPTIONS.cuffDepth);
      expect(resolved.hemBandDepth).toBe(HOODIE_DEFAULT_OPTIONS.hemBandDepth);
      expect(resolved.hoodHeight).toBe(HOODIE_DEFAULT_OPTIONS.hoodHeight);
      expect(resolved.hoodDepth).toBe(HOODIE_DEFAULT_OPTIONS.hoodDepth);
      expect(resolved.pocketWidth).toBe(HOODIE_DEFAULT_OPTIONS.pocketWidth);
      expect(resolved.pocketHeight).toBe(HOODIE_DEFAULT_OPTIONS.pocketHeight);
      expect(resolved.hoodExitSpacing).toBe(HOODIE_DEFAULT_OPTIONS.hoodExitSpacing);
      expect(joins.every(({ analysis }) => analysis.calculable)).toBe(true);
    }
  });

  it("preserves uncalculable base lengths and unrepresentable graded lengths", () => {
    const invalidBase = sizeOptions(2, {
      ...HOODIE_DEFAULT_OPTIONS,
      cuffLength: 0,
      hemBandLength: Number.NaN,
    });
    expect(invalidBase.cuffLength).toBe(0);
    expect(invalidBase.hemBandLength).toBeNaN();

    const tooLarge = sizeOptions(2, {
      ...HOODIE_DEFAULT_OPTIONS,
      cuffLength: Number.MAX_VALUE,
    });
    expect(tooLarge.cuffLength).toBe(Number.MAX_VALUE);
  });

  it("maps every default drafted piece to valid notch and grainline edge references", () => {
    const drafted = draftAt();
    const pieces = blockPieces(drafted);
    const names = pieces.map(({ name }) => name);
    expect(HOODIE_NOTCHES.map(({ pieceName }) => pieceName).sort()).toEqual([...names].sort());

    for (const rule of HOODIE_NOTCHES) {
      const piece = pieces.find(({ name }) => name === rule.pieceName)!;
      const edgeNames = piece.edges.map(({ name }) => name);
      for (const notch of rule.notches) {
        expect(edgeNames).toContain(notch.edgeName);
        expect(notch.t).toBeGreaterThanOrEqual(0);
        expect(notch.t).toBeLessThanOrEqual(1);
      }
      expect(edgeNames).toContain(rule.grainline.topEdge);
      expect(edgeNames).toContain(rule.grainline.bottomEdge);
      expect(rule.grainline.topT).toBeGreaterThanOrEqual(0);
      expect(rule.grainline.topT).toBeLessThanOrEqual(1);
      expect(rule.grainline.bottomT).toBeGreaterThanOrEqual(0);
      expect(rule.grainline.bottomT).toBeLessThanOrEqual(1);
    }
    expect(HOODIE_NOTCHES.find(({ pieceName }) => pieceName === "hoodie left outer hood side")?.grainline)
      .toEqual(HOODIE_NOTCHES.find(({ pieceName }) => pieceName === "hoodie right outer hood side")?.grainline);
    expect(HOODIE_NOTCHES.find(({ pieceName }) => pieceName === "hoodie left lining hood side")?.grainline)
      .toEqual(HOODIE_NOTCHES.find(({ pieceName }) => pieceName === "hoodie right lining hood side")?.grainline);
  });

  it("gives zero allowance only to true fold edges", () => {
    const drafted = draftAt();
    expect(allowanceFor(HOODIE_ALLOWANCES, "centerFront", "front")).toBe(0);
    expect(allowanceFor(HOODIE_ALLOWANCES, "centerBack", "back")).toBe(0);
    expect(allowanceFor(HOODIE_ALLOWANCES, "fold", "Hoodie kangaroo pouch")).toBe(0);
    expect(allowanceFor(HOODIE_ALLOWANCES, "centerBack", "hoodie left outer hood side")).toBe(1);
    expect(allowanceFor(HOODIE_ALLOWANCES, "opening", "Hoodie kangaroo pouch")).toBe(1);
    expect(pieceEdge(drafted.roles.hoodOuterLeft!, "centerBack").name).toBe("centerBack");
  });

  it("measures actual default digital POMs and reports zero only for omitted pouch topology", () => {
    const drafted = draftAt();
    expect(HOODIE_POMS.every(({ tolerance }) => tolerance === undefined)).toBe(true);
    for (const pom of HOODIE_POMS) {
      expect(Number.isFinite(pom.measure(drafted)), pom.label).toBe(true);
      expect(pom.measure(drafted)).toBeGreaterThanOrEqual(0);
      if (pom.anchor !== undefined) {
        const anchor = pom.anchor(drafted);
        expect(Number.isFinite(anchor.x) && Number.isFinite(anchor.y)).toBe(true);
      }
    }
    expect(HOODIE_POMS.find(({ label }) => label.startsWith("Pouch total width"))!.measure(drafted))
      .toBeCloseTo(HOODIE_DEFAULT_OPTIONS.pocketWidth, 8);
    expect(HOODIE_POMS.find(({ label }) => label.startsWith("Pouch height"))!.measure(drafted))
      .toBeCloseTo(HOODIE_DEFAULT_OPTIONS.pocketHeight, 8);

    const omitted = draftAt(STANDARD_M, { ...HOODIE_DEFAULT_OPTIONS, pocketWidth: 0 });
    expect(omitted.roles.pocket).toBeUndefined();
    for (const pom of HOODIE_POMS.filter(({ label }) => label.startsWith("Pouch "))) {
      expect(pom.measure(omitted)).toBe(0);
    }
  });

  it("qualifies static and option-aware Tech Pack data without physical or cut-length claims", () => {
    expect(HOODIE_TECH_PACK.constructionNotice).toContain("single-bolt draft estimate");
    expect(hoodieTechPackForOptions()).toEqual(HOODIE_TECH_PACK);
    expect(HOODIE_TECH_PACK.bom).toHaveLength(3);
    expect(HOODIE_TECH_PACK.bom.every(({ qty }) => qty.includes("Digital") || qty.includes("One half-pattern"))).toBe(true);
    expect(HOODIE_TECH_PACK.bom.some(({ placement }) => placement.toLowerCase().includes("lining"))).toBe(true);

    const zero = hoodieTechPackForOptions({
      hoodCasingWidth: 0,
      hoodDrawcordLength: 96,
      pocketWidth: 0,
    });
    expect(zero.bom.some(({ placement }) => placement.toLowerCase().includes("pouch"))).toBe(false);
    expect(zero.bom.some(({ material }) => material.toLowerCase().includes("drawcord"))).toBe(false);
    expect(zero.construction.join(" ")).toContain("96 cm");
    expect(zero.construction.join(" ")).toContain("not a cut length");
    expect(zero.construction.join(" ")).toContain("unused while hood casing width is zero");

    const noHeight = hoodieTechPackForOptions({ pocketHeight: 0 });
    expect(noHeight.bom.some(({ placement }) => placement.toLowerCase().includes("pouch"))).toBe(false);

    const invalid = hoodieTechPackForOptions({
      pocketWidth: -2,
      hoodCasingWidth: -1,
      hoodDrawcordLength: Number.NaN,
    });
    expect(invalid.bom.some(({ placement }) => placement.toLowerCase().includes("pouch"))).toBe(true);
    expect(invalid.construction.join(" ")).toContain("NaN cm");
  });
});
