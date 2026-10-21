import { describe, expect, it } from "vitest";
import { gradeMeasurements } from "./grading";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { blockPieces } from "./block";
import { draftJeansCore } from "./jeans";
import { STANDARD_M } from "./measurements";
import { TROUSER_GRADE, TROUSER_SIZES } from "./trouser-tables";
import { TROUSER_ALLOWANCES } from "./trouser";
import { allowanceFor } from "./allowance";
import {
  JEANS_ALLOWANCES,
  JEANS_BOM,
  JEANS_CONSTRUCTION_STEPS,
  JEANS_CUT_ROLE_QUANTITIES,
  JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM,
  JEANS_PRIMARY_TOPSTITCH_CM,
  JEANS_SECONDARY_TOPSTITCH_SPACING_CM,
  JEANS_TECH_PACK,
  JEANS_GRADE,
  JEANS_POM_DEFINITIONS,
  JEANS_POMS,
  JEANS_SIZES,
  JEANS_NOTCHES,
  jeansNotchesForDraft,
} from "./jeans-tables";
import { specSheet } from "./pom";

describe("Jeans notch and grainline rules", () => {
  it("names every draft role and resolves its matched marks from live geometry", () => {
    expect(JEANS_NOTCHES.map(({ pieceName }) => pieceName)).toEqual([
      "jeans front left", "jeans front right",
      "jeans back yoke left", "jeans back yoke right",
      "jeans back lower left", "jeans back lower right",
      "jeans front pocket facing left", "jeans front pocket facing right",
      "jeans front pocket bag left", "jeans front pocket bag right",
      "jeans front pocket stay left", "jeans front pocket stay right",
      "jeans right coin-pocket facing extension", "jeans coin pocket",
      "jeans back patch pocket left", "jeans back patch pocket right",
      "jeans right fly facing and underlap", "jeans fly shield",
      "jeans outer waistband left", "jeans outer waistband right",
      "jeans inner waistband left", "jeans inner waistband right",
      "jeans belt-loop strip",
    ]);

    for (const { step } of JEANS_SIZES) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements);
      const pieces = blockPieces(draft);
      expect(JEANS_CUT_ROLE_QUANTITIES.map(({ role }) => role)).toEqual(Object.keys(draft.roles));
      const notches = jeansNotchesForDraft(draft);
      for (const rule of notches) {
        const piece = pieces.find(({ name }) => name === rule.pieceName)!;
        for (const notchRule of rule.notches) {
          const resolved = resolveNotch(piece, notchRule);
          expect([resolved.point.x, resolved.point.y, resolved.normal.x, resolved.normal.y]
            .every(Number.isFinite)).toBe(true);
        }
        const grain = resolveGrainline(piece, rule.grainline);
        expect([grain.top.x, grain.top.y, grain.bottom.x, grain.bottom.y]
          .every(Number.isFinite)).toBe(true);
        expect(grain.top).not.toEqual(grain.bottom);
      }

      const front = pieces.find(({ name }) => name === "jeans front left")!;
      const yoke = pieces.find(({ name }) => name === "jeans back yoke left")!;
      const frontSideNotch = resolveNotch(front, { edgeName: "sidePocketDropToYoke", t: 1 });
      const yokeSideRule = notches.find(({ pieceName }) => pieceName === "jeans back yoke left")!
        .notches.find(({ edgeName }) => edgeName === "sideWaistToYoke")!;
      const yokeSideNotch = resolveNotch(yoke, yokeSideRule);
      expect(frontSideNotch.point).toEqual(yokeSideNotch.point);

      const frontHipNotch = resolveNotch(front, {
        edgeName: "sideHipToThigh",
        t: 0,
      });
      const backLower = pieces.find(({ name }) => name === "jeans back lower left")!;
      const backHipRule = notches.find(({ pieceName }) => pieceName === "jeans back lower left")!
        .notches.find(({ edgeName }) => edgeName === "sideYokeToHip")!;
      expect(frontHipNotch.point).toEqual(resolveNotch(backLower, backHipRule).point);
    }
  });

  it("moves the front yoke notch onto the facing when a deeper pocket crosses that side station", () => {
    const draft = draftJeansCore(STANDARD_M, { frontPocketDrop: 12 });
    const notches = jeansNotchesForDraft(draft);
    const pieces = blockPieces(draft);
    const facing = pieces.find(({ name }) => name === "jeans front pocket facing left")!;
    const yoke = pieces.find(({ name }) => name === "jeans back yoke left")!;
    const facingSideRule = notches.find(({ pieceName }) => pieceName === "jeans front pocket facing left")!
      .notches.find(({ edgeName }) => edgeName === "sideFacing")!;
    const yokeSideRule = notches.find(({ pieceName }) => pieceName === "jeans back yoke left")!
      .notches.find(({ edgeName }) => edgeName === "sideWaistToYoke")!;
    expect(resolveNotch(facing, facingSideRule).point).toEqual(resolveNotch(yoke, yokeSideRule).point);
  });
});

describe("Jeans allowance and digital construction tables", () => {
  it("uses live pattern POMs with explicit XS–XL redrafts and no invented tolerances", () => {
    expect(JEANS_GRADE).toEqual(TROUSER_GRADE);
    expect(JEANS_SIZES).toEqual(TROUSER_SIZES);
    expect(JEANS_SIZES.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(JEANS_POMS.map(({ label }) => label)).toEqual(JEANS_POM_DEFINITIONS.map(({ label }) => label));
    expect(JEANS_POMS.every(({ tolerance }) => tolerance === undefined)).toBe(true);
    const waist = JEANS_POM_DEFINITIONS.find(({ id }) => id === "jeans.waist.finished")!;
    expect(waist.instructions).toContain("pocket-facing waist edges");
    expect(waist.landmarks.map(({ id }) => id)).toContain("pocket-facing.waist.left");
    expect(waist.landmarks.map(({ id }) => id)).toContain("pocket-facing.waist.right");

    const graded = JEANS_SIZES.map(({ step, label }) => ({
      label,
      step,
      measurements: gradeMeasurements(STANDARD_M, JEANS_GRADE, step),
      block: draftJeansCore(gradeMeasurements(STANDARD_M, JEANS_GRADE, step)),
    }));
    const rows = specSheet(graded, JEANS_POMS);
    expect(rows).toHaveLength(JEANS_POMS.length);
    expect(rows.every(({ values }) => values.length === JEANS_SIZES.length && values.every((value) => Number.isFinite(value) && value > 0))).toBe(true);
    expect(rows.find(({ label }) => label === "Waist circumference (modeled)")?.values[2]).toBeCloseTo(STANDARD_M.waist + STANDARD_M.ease);
    expect(rows.find(({ label }) => label === "Seat circumference (modeled)")?.values[2]).toBeCloseTo(STANDARD_M.hip + STANDARD_M.ease);
  });

  it("maps the Jeans-only seam and cut exceptions without changing other defaults", () => {
    expect(JEANS_ALLOWANCES.default).toBe(1.6);
    expect(JEANS_ALLOWANCES.byEdge).toEqual({ hem: 3.8, pocketTop: 1.9 });
    expect(JEANS_PATCH_POCKET_TOP_ALLOWANCE_CM).toBe(1.9);
    expect(JEANS_PRIMARY_TOPSTITCH_CM).toBe(0.3);
    expect(JEANS_SECONDARY_TOPSTITCH_SPACING_CM).toBe(0.6);
    expect(allowanceFor(JEANS_ALLOWANCES, "yokeJoin", "jeans back lower left")).toBe(1.6);
    expect(allowanceFor(JEANS_ALLOWANCES, "hem", "jeans front left")).toBe(3.8);
    expect(allowanceFor(JEANS_ALLOWANCES, "pocketTop", "jeans coin pocket")).toBe(1.9);
    expect(allowanceFor(JEANS_ALLOWANCES, "bagClose", "jeans front pocket bag right")).toBe(1);
    expect(allowanceFor(JEANS_ALLOWANCES, "shieldBottom", "jeans fly shield")).toBe(0.6);
    expect(allowanceFor(JEANS_ALLOWANCES, "stripOuter", "jeans belt-loop strip")).toBe(0);
    expect(TROUSER_ALLOWANCES.default).toBe(1);
    expect(allowanceFor(TROUSER_ALLOWANCES, "hem", "trouser front left")).toBe(2);
  });

  it("declares all 23 cut roles and qualified, ordered internal production notes", () => {
    const draft = draftJeansCore(STANDARD_M);
    expect(JEANS_CUT_ROLE_QUANTITIES.map(({ role }) => role)).toEqual(Object.keys(draft.roles));
    expect(JEANS_CUT_ROLE_QUANTITIES).toHaveLength(23);
    expect(JEANS_CUT_ROLE_QUANTITIES.every(({ quantity }) => quantity === 1)).toBe(true);
    expect(JEANS_CUT_ROLE_QUANTITIES.find(({ role }) => role === "beltLoopStrip")?.note).toContain("six loop segments");
    expect(JEANS_BOM.find(({ material }) => material === "Jeans zipper")?.qty).toBe("1; size and length unconfirmed.");
    expect(JEANS_BOM.find(({ material }) => material === "Jeans button")?.qty).toContain("1;");
    expect(JEANS_BOM.find(({ material }) => material === "Jeans rivets (optional)")?.qty).toContain("6 optional");
    expect(JEANS_BOM.filter(({ qty }) => qty.startsWith("Unknown")).length).toBeGreaterThanOrEqual(3);
    expect(JEANS_TECH_PACK.constructionNotice).toContain("digital draft notes only");
    expect(JEANS_CONSTRUCTION_STEPS.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(JEANS_TECH_PACK.construction).toEqual(
      JEANS_CONSTRUCTION_STEPS.map(({ order, action }) => `${order}. ${action}`),
    );
  });
});
