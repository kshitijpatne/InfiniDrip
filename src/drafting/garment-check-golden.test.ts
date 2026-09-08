import { describe, it, expect } from "vitest";
import { TEE, FITTED, SKIRT } from "./recipe";
import { garmentReport } from "../guidance/garment-check";
import {
  TEE_GOLDEN_POINTS, TEE_GOLDEN_REPORTS,
  FITTED_GOLDEN_POINTS, FITTED_GOLDEN_REPORTS,
  SKIRT_GOLDEN_POINTS, SKIRT_GOLDEN_REPORTS,
} from "./garment-check-golden";

// This file's only job: prove the frozen fixture is an honest recording of
// real output, BEFORE Phase A2 rewrites the functions that produced it. If
// this fails, the fixture itself is wrong — fix the fixture, never loosen
// this test. Once A2's migration is complete, these same assertions prove
// the rewrite changed nothing observable.

describe("garment-check-golden.ts is an honest recording of garmentReport", () => {
  it("matches for every tee golden point, deep-equal", () => {
    TEE_GOLDEN_POINTS.forEach((m, i) => {
      expect(garmentReport(TEE, m)).toEqual(TEE_GOLDEN_REPORTS[i]);
    });
  });

  it("matches for every fitted golden point, deep-equal", () => {
    FITTED_GOLDEN_POINTS.forEach((m, i) => {
      expect(garmentReport(FITTED, m)).toEqual(FITTED_GOLDEN_REPORTS[i]);
    });
  });

  it("matches for every skirt golden point, deep-equal", () => {
    SKIRT_GOLDEN_POINTS.forEach((m, i) => {
      expect(garmentReport(SKIRT, m)).toEqual(SKIRT_GOLDEN_REPORTS[i]);
    });
  });
});
