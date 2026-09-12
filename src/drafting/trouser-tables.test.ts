import { describe, it, expect } from "vitest";
import {
  draftTrouserWithPockets,
  TROUSER_GRADE,
  TROUSER_POMS,
  TROUSER_SIZES,
  TROUSER_TECH_PACK,
  trouserGuidance,
  DEFAULT_TROUSER_OPTIONS,
  STANDARD_M,
  Measurements,
  TrouserOptions,
  gradeMeasurements,
  gradeRun,
  specSheet,
} from "./index";

describe("trouser grading, POM, and tech-pack tables", () => {
  it("grades body fields while keeping ease and construction options constant", () => {
    const larger = gradeMeasurements(STANDARD_M, TROUSER_GRADE, 2);
    expect(larger.waist).toBe(92);
    expect(larger.hip).toBe(108);
    expect(larger.hipDepth).toBe(22);
    expect(larger.crotchDepth).toBe(29);
    expect(larger.thigh).toBe(62);
    expect(larger.knee).toBe(43);
    expect(larger.inseam).toBe(81);
    expect(larger.ease).toBe(STANDARD_M.ease);

    const draft = (m: Measurements, options: Readonly<Record<string, number>> = {}) =>
      draftTrouserWithPockets(m, options as Partial<TrouserOptions>);
    const run = gradeRun(
      STANDARD_M, TROUSER_GRADE, TROUSER_SIZES, draft,
      DEFAULT_TROUSER_OPTIONS as unknown as Readonly<Record<string, number>>,
    );
    expect(run.map((size) => size.label)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(run.map((size) => size.block.roles.frontLeft.name)).toEqual([
      "trouser front left", "trouser front left", "trouser front left",
      "trouser front left", "trouser front left",
    ]);
    expect(run.every((size) => size.block.stitches.length === 10)).toBe(true);
  });

  it("measures every required finished/body reference from the assembled block", () => {
    const b = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const rows = specSheet(
      [{ label: "M", step: 0, measurements: STANDARD_M, block: b }],
      TROUSER_POMS,
    );
    expect(rows.map((row) => row.label)).toEqual([
      "Waist (finished)", "Waistband depth (finished)", "Seat / hip (finished)",
      "Hip depth (body reference)", "Front rise (finished incl. waistband)",
      "Back rise (finished incl. waistband)", "Thigh (finished)", "Knee (finished)",
      "Inseam (finished seam)", "Outseam (finished incl. waistband)",
      "Leg opening (finished)", "Front fly length (finished)",
      "Left pocket opening (finished)", "Right pocket opening (finished)",
      "Pocket bag depth (finished)", "Pocket bag width (finished)",
      "Pocket drop (finished placement)",
    ]);
    const value = (label: string) => rows.find((row) => row.label === label)!.values[0];
    expect(value("Waist (finished)")).toBeCloseTo(94);
    expect(value("Waistband depth (finished)")).toBeCloseTo(4);
    expect(value("Seat / hip (finished)")).toBeCloseTo(110);
    expect(value("Hip depth (body reference)")).toBeCloseTo(20);
    expect(value("Front rise (finished incl. waistband)")).toBeCloseTo(28);
    expect(value("Back rise (finished incl. waistband)")).toBeCloseTo(36);
    expect(value("Thigh (finished)")).toBeCloseTo(66);
    expect(value("Knee (finished)")).toBeCloseTo(45);
    expect(value("Leg opening (finished)")).toBeCloseTo(40);
    expect(value("Front fly length (finished)")).toBeCloseTo(15);
    expect(value("Left pocket opening (finished)")).toBeCloseTo(16);
    expect(value("Right pocket opening (finished)")).toBeCloseTo(16);
    expect(value("Pocket bag depth (finished)")).toBeCloseTo(23);
    expect(value("Pocket bag width (finished)")).toBeCloseTo(8.5);
    expect(value("Pocket drop (finished placement)")).toBeCloseTo(2);
    expect(rows.every((row) => row.values.every(Number.isFinite))).toBe(true);
    for (const pom of TROUSER_POMS) {
      if (!pom.anchor) continue;
      const anchor = pom.anchor(b);
      expect(Number.isFinite(anchor.x) && Number.isFinite(anchor.y)).toBe(true);
    }
  });

  it("keeps the BOM and construction order aligned with the emitted V1 roles", () => {
    expect(TROUSER_TECH_PACK.bom).toHaveLength(5);
    expect(TROUSER_TECH_PACK.construction).toHaveLength(7);
    const text = [...TROUSER_TECH_PACK.bom, ...TROUSER_TECH_PACK.construction]
      .map((row) => typeof row === "string" ? row : `${row.material} ${row.placement}`)
      .join(" ");
    expect(text).toContain("Four leg panels, waistband & pocket bags");
    expect(text).toContain("pocket bag");
    expect(text).toContain("centre-back seam");
    expect(text.toLowerCase()).not.toContain("production-ready");
    expect(text.toLowerCase()).not.toContain("physically validated");
  });
});

describe("trouser guidance", () => {
  it("returns no warnings for the standard block", () => {
    const b = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    expect(trouserGuidance(b, STANDARD_M, DEFAULT_TROUSER_OPTIONS)).toEqual([]);
  });

  it("reports body, rise, closure, and leg relationship failures without clamping", () => {
    const measurements = {
      ...STANDARD_M,
      waist: 100,
      hip: 90,
      hipDepth: 30,
      crotchDepth: 16,
      inseam: -1,
      ease: -100,
      thigh: 40,
      knee: 50,
    };
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      frontRiseEase: 9,
      backRiseEase: 2,
      waistbandDepth: 12,
      flyLength: 25,
      thighEase: -100,
      kneeEase: -100,
      legOpening: 65,
    };
    const notes = trouserGuidance(
      draftTrouserWithPockets(measurements, options), measurements, options
    );
    const fields = notes.map((note) => note.field);
    expect(fields).toContain("waist");
    expect(fields).toContain("hipDepth");
    expect(fields).toContain("inseam");
    expect(fields).toContain("option-frontRiseEase");
    expect(fields).toContain("option-backRiseEase");
    expect(fields).toContain("option-waistbandDepth");
    expect(fields).toContain("option-flyLength");
    expect(fields).toContain("option-thighEase");
    expect(fields).toContain("thigh");
    expect(fields).toContain("option-legOpening");
    expect(notes.every((note) => note.level === "warn")).toBe(true);
    expect(notes.some((note) => note.text.includes("increase back rise ease"))).toBe(true);
  });

  it("detects a sharp knee-to-opening taper and a negative finished seat independently", () => {
    const taperOptions = { ...DEFAULT_TROUSER_OPTIONS, kneeEase: 15, legOpening: 25 };
    const taperNotes = trouserGuidance(
      draftTrouserWithPockets(STANDARD_M, taperOptions), STANDARD_M, taperOptions
    );
    expect(taperNotes.some((note) => note.text.includes("taper sharply"))).toBe(true);

    const negativeSeat = { ...STANDARD_M, hip: 0, ease: 0 };
    const negativeSeatNotes = trouserGuidance(
      draftTrouserWithPockets(negativeSeat), negativeSeat, DEFAULT_TROUSER_OPTIONS
    );
    expect(negativeSeatNotes.some((note) => note.text.includes("Finished waist and seat"))).toBe(true);
  });
});
