import { describe, it, expect } from "vitest";
import { draftTshirt } from "./tshirt";
import { STANDARD_M } from "./measurements";
import { gradeMeasurements, gradeRun, GradeRule, SizeStep } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { resolveNotch, pointOnEdge } from "../render/notch";

const rule: GradeRule = { chest: 5, length: 2 };
const sizes: readonly SizeStep[] = [
  { label: "S", step: -1 },
  { label: "M", step: 0 },
  { label: "L", step: 1 },
];

describe("gradeMeasurements", () => {
  it("returns the base unchanged at step 0", () => {
    expect(gradeMeasurements(STANDARD_M, rule, 0)).toEqual(STANDARD_M);
  });

  it("adds the increment per step up", () => {
    const up = gradeMeasurements(STANDARD_M, rule, 1);
    expect(up.chest).toBe(STANDARD_M.chest + 5);
    expect(up.length).toBe(STANDARD_M.length + 2);
  });

  it("subtracts the increment per step down", () => {
    const down = gradeMeasurements(STANDARD_M, rule, -2);
    expect(down.chest).toBe(STANDARD_M.chest - 10);
  });

  it("never grades a measurement absent from the rule (e.g. ease)", () => {
    const up = gradeMeasurements(STANDARD_M, rule, 3);
    expect(up.ease).toBe(STANDARD_M.ease);
    expect(up.bicep).toBe(STANDARD_M.bicep); // not in `rule`
  });

  it("does not mutate the base", () => {
    const before = { ...STANDARD_M };
    gradeMeasurements(STANDARD_M, rule, 2);
    expect(STANDARD_M).toEqual(before);
  });
});

describe("gradeRun", () => {
  it("produces one drafted block per size, in order", () => {
    const run = gradeRun(STANDARD_M, rule, sizes, draftTshirt);
    expect(run.map((g) => g.label)).toEqual(["S", "M", "L"]);
    for (const g of run) {
      expect(rolePiece(g.block, "front").edges.length).toBeGreaterThan(0);
      expect(rolePiece(g.block, "sleeve").edges.length).toBeGreaterThan(0);
    }
  });

  it("grows monotonically with size (chest width increases each step up)", () => {
    const run = gradeRun(STANDARD_M, rule, sizes, draftTshirt);
    const chests = run.map((g) => g.measurements.chest);
    expect(chests[0]).toBeLessThan(chests[1]);
    expect(chests[1]).toBeLessThan(chests[2]);
  });

  it("uses the real tee recipe to make a five-size run with M as base", () => {
    const run = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);
    expect(run.map((g) => g.label)).toEqual(["XS", "S", "M", "L", "XL"]);
    const base = run.find((g) => g.step === 0)!;
    expect(base.measurements).toEqual(STANDARD_M);
  });
});

describe("notches carry free across the grade", () => {
  it("regrades a notch automatically: same rule, position scales with the size", () => {
    const run = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);
    const small = rolePiece(run[0].block, "front"); // XS
    const large = rolePiece(run[run.length - 1].block, "front"); // XL
    const ruleNotch = { edgeName: "shoulder", t: 0.5 };

    const nSmall = resolveNotch(small, ruleNotch);
    const nLarge = resolveNotch(large, ruleNotch);

    // The notch is still the midpoint of each size's shoulder edge — derived, not
    // saved — so its absolute x grows with the wider shoulder of the larger size.
    const shoulderMidLarge = pointOnEdge(
      large.edges.find((e) => e.name === "shoulder")!, 0.5);
    expect(nLarge.point.x).toBeCloseTo(shoulderMidLarge.x, 6);
    expect(nLarge.point.x).toBeGreaterThan(nSmall.point.x);
  });
});

import { draftAtSize } from "./grading";
import { FITTED } from "./recipe";
import { edgeLength, pieceEdge } from "./piece";
import { rolePiece } from "./block";

describe("draftAtSize", () => {
  it("at step 0 reproduces the base draft exactly", () => {
    expect(draftAtSize(STANDARD_M, TSHIRT_GRADE, 0, draftTshirt))
      .toEqual(draftTshirt(STANDARD_M));
  });

  it("matches the block gradeRun produces for the same step", () => {
    const run = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);
    for (const g of run) {
      expect(draftAtSize(STANDARD_M, TSHIRT_GRADE, g.step, draftTshirt)).toEqual(g.block);
    }
  });

  it("grows a size-sensitive measure with the step, for either garment", () => {
    const hem = (step: number, r = TSHIRT_GRADE, d = draftTshirt): number =>
      edgeLength(pieceEdge(rolePiece(draftAtSize(STANDARD_M, r, step, d), "front"), "hem"));
    expect(hem(1)).toBeGreaterThan(hem(0));
    expect(hem(0)).toBeGreaterThan(hem(-1));
    // the fitted garment grades on the same rule
    const fhem = (step: number): number =>
      edgeLength(pieceEdge(rolePiece(draftAtSize(STANDARD_M, FITTED.grade, step, FITTED.draft), "front"), "hem"));
    expect(fhem(2)).toBeGreaterThan(fhem(-2));
  });
});
