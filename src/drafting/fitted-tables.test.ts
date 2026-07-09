import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftFitted } from "./fitted";
import { specSheet } from "./pom";
import { gradeRun } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS } from "./fitted-tables";

describe("FITTED_NOTCHES", () => {
  it("gives the darted front its own rules and reuses the tee's back and sleeve", () => {
    expect(FITTED_NOTCHES.map((r) => r.pieceName)).toEqual(["fitted front", "back", "sleeve"]);
    const front = FITTED_NOTCHES[0];
    // the side notch lives on the lower side segment, below the dart mouth
    expect(front.notches.some((n) => n.edgeName === "sideLower")).toBe(true);
  });
});

describe("FITTED_POMS", () => {
  const graded = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftFitted);
  const rows = specSheet(graded, FITTED_POMS);

  it("reports the dart intake and the closed side seam", () => {
    const intake = rows.find((r) => r.label === "Bust dart intake")!;
    expect(intake.values.every((v) => v === 4)).toBe(true);
    expect(rows.find((r) => r.label === "Side seam (dart closed)")).toBeDefined();
  });

  it("measures body length at centre front, not the lengthened side", () => {
    const len = rows.find((r) => r.label === "Body length (HPS–hem)")!;
    const base = graded.findIndex((g) => g.step === 0);
    expect(len.values[base]).toBeCloseTo(STANDARD_M.length, 1);
  });
});
