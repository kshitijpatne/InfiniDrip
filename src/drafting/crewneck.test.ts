import { describe, expect, it } from "vitest";
import { analyzeBandStretch } from "../guidance/band-stretch";
import { edgeLength, pieceEdge } from "./piece";
import { gradeMeasurements, draftAtSize } from "./grading";
import { STANDARD_M } from "./measurements";
import { stitchChecks } from "./stitch";
import { TSHIRT_GRADE } from "./tshirt-grade";
import {
  crewneckBandMeasurements,
  crewneckBandPiece,
  CREWNECK_BAND_JOIN_DEFINITIONS,
  resolveCrewneckOptionsForSize,
} from "./crewneck-components";
import {
  CREWNECK_ROLE_ORDER,
  crewneckNecklineNotes,
  draftCrewneck,
} from "./crewneck";

const CREWNECK_OPTIONS = {
  neckbandLength: 40.5,
  neckbandDepth: 2.5,
  cuffLength: 31.5,
  cuffDepth: 6,
  hemBandLength: 93.5,
  hemBandDepth: 6,
};

describe("crewneck geometry", () => {
  it("drafts the admitted roles in order with on-fold body and separate off-fold pieces", () => {
    const drafted = draftCrewneck(STANDARD_M, CREWNECK_OPTIONS);

    expect(Object.keys(drafted.roles)).toEqual(CREWNECK_ROLE_ORDER);
    expect(drafted.roles.front?.onFold).toBe(true);
    expect(drafted.roles.back?.onFold).toBe(true);
    for (const role of ["sleeveLeft", "sleeveRight", "neckband", "cuffLeft", "cuffRight", "hemBand"]) {
      expect(drafted.roles[role]?.onFold).toBe(false);
    }
    expect(drafted.roles.sleeveLeft?.edges).toEqual(drafted.roles.sleeveRight?.edges);
    expect(drafted.roles.cuffLeft?.edges).toEqual(drafted.roles.cuffRight?.edges);
  });

  it("measures full folded-body openings and each real sleeve opening from named edges", () => {
    const drafted = draftCrewneck(STANDARD_M, CREWNECK_OPTIONS);
    const measurements = crewneckBandMeasurements(drafted, CREWNECK_OPTIONS);
    const value = (role: string) => measurements.find((item) => item.role === role)!;

    expect(value("neckband").openingLengthCm).toBeCloseTo(47.9046, 3);
    expect(value("hemBand").openingLengthCm).toBeCloseTo(110, 6);
    expect(value("cuffLeft").openingLengthCm).toBeCloseTo(37, 6);
    expect(value("cuffRight").openingLengthCm).toBeCloseTo(value("cuffLeft").openingLengthCm, 8);
    expect(value("neckband").bandEdgeLengthCm).toBeCloseTo(CREWNECK_OPTIONS.neckbandLength, 8);
    expect(value("hemBand").bandEdgeLengthCm).toBeCloseTo(CREWNECK_OPTIONS.hemBandLength, 8);
  });

  it("exposes valid ratio math while keeping band joins outside absolute-centimetre stitches", () => {
    const drafted = draftCrewneck(STANDARD_M, CREWNECK_OPTIONS);
    const measurements = crewneckBandMeasurements(drafted, CREWNECK_OPTIONS);

    expect(measurements).toHaveLength(4);
    for (const measurement of measurements) {
      expect(measurement.analysis).toEqual(
        analyzeBandStretch(measurement.openingLengthCm, measurement.bandLengthCm),
      );
      expect(measurement.analysis.calculable).toBe(true);
    }
    expect(drafted.stitches.every((stitch) => !stitch.label.includes("band ↔ opening"))).toBe(true);
    expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    expect(CREWNECK_BAND_JOIN_DEFINITIONS).toHaveLength(4);
  });

  it("reports equal, longer, and unrepresentable ratios from actual band interfaces", () => {
    const baseDraft = draftCrewneck(STANDARD_M, CREWNECK_OPTIONS);
    const baseMeasurements = crewneckBandMeasurements(baseDraft, CREWNECK_OPTIONS);
    const opening = (role: string) => baseMeasurements.find((item) => item.role === role)!.openingLengthCm;
    const equalOptions = {
      ...CREWNECK_OPTIONS,
      neckbandLength: opening("neckband"),
      cuffLength: opening("cuffLeft"),
      hemBandLength: opening("hemBand"),
    };
    const equalBands = crewneckBandMeasurements(draftCrewneck(STANDARD_M, equalOptions), equalOptions);
    expect(equalBands.every((item) => item.analysis.calculable && item.analysis.requiredStretchPercent === 0)).toBe(true);

    const longerOptions = {
      ...CREWNECK_OPTIONS,
      neckbandLength: opening("neckband") * 2,
      cuffLength: opening("cuffLeft") * 2,
      hemBandLength: opening("hemBand") * 2,
    };
    const longerBands = crewneckBandMeasurements(draftCrewneck(STANDARD_M, longerOptions), longerOptions);
    expect(longerBands.every((item) => item.analysis.calculable && item.analysis.requiredStretchPercent < 0)).toBe(true);

    const tinyBandOptions = { ...CREWNECK_OPTIONS, neckbandLength: Number.MIN_VALUE };
    const tinyNeckband = crewneckBandMeasurements(
      draftCrewneck(STANDARD_M, tinyBandOptions),
      tinyBandOptions,
    )[0]!;
    expect(tinyNeckband.analysis.calculable).toBe(false);
    expect(tinyNeckband.analysis.issues[0]).toMatchObject({ field: "calculation", code: "unrepresentable" });
  });

  it("keeps folded band layers, cut-depth basis, and greatest-stretch instructions explicit", () => {
    const band = crewneckBandPiece("neckband", 40.5, 2.5);
    const fold = band.marks?.find((mark) => mark.name === "bandFold");
    const stretch = band.marks?.find((mark) => mark.name === "greatestStretchDirection");

    expect(band.onFold).toBe(false);
    expect(fold?.kind).toBe("foldLine");
    expect(fold?.name).toBe("bandFold");
    expect(fold?.label).toBeUndefined();
    expect(edgeLength(pieceEdge(band, "join"))).toBeCloseTo(40.5, 8);
    expect(edgeLength(pieceEdge(band, "joinLayer"))).toBeCloseTo(40.5, 8);
    expect(edgeLength(pieceEdge(band, "sideLeft"))).toBeCloseTo(5, 8);
    expect(fold && "start" in fold ? fold.start.y : null).toBe(2.5);
    expect(stretch?.label).toBe("GREATEST STRETCH ALONG BAND LENGTH");
    expect(band.marks?.some((mark) => mark.name.toLowerCase().includes("grain"))).toBe(false);
  });

  it("keeps neckline warnings visible without clamping width or drop inputs", () => {
    const notes = crewneckNecklineNotes({
      ...STANDARD_M,
      neckWidthEase: 40,
      neckDrop: 40,
    });

    expect(notes.map((note) => note.field)).toContain("neckWidthEase");
    expect(notes.map((note) => note.field)).toContain("neckDrop");
    const drafted = draftCrewneck({ ...STANDARD_M, neckWidthEase: 40, neckDrop: 40 }, CREWNECK_OPTIONS);
    expect(drafted.roles.front?.edges.find((edge) => edge.name === "neckline")?.kind).toBe("curve");
  });

  it("derives valid nonbase band lengths from actual walked opening proportions", () => {
    const sizeMeasurements = gradeMeasurements(STANDARD_M, TSHIRT_GRADE, 1);
    const baseBlock = draftCrewneck(STANDARD_M, CREWNECK_OPTIONS);
    const sizeBlock = draftCrewneck(sizeMeasurements, CREWNECK_OPTIONS);
    const baseJoins = crewneckBandMeasurements(baseBlock, CREWNECK_OPTIONS);
    const sizeJoins = crewneckBandMeasurements(sizeBlock, CREWNECK_OPTIONS);
    const resolved = resolveCrewneckOptionsForSize({
      baseMeasurements: STANDARD_M,
      sizeMeasurements,
      step: 1,
      draft: (measurements, options = {}) => draftCrewneck(measurements, options),
      baseOptions: CREWNECK_OPTIONS,
    });

    for (const [role, optionId] of [
      ["neckband", "neckbandLength"],
      ["cuffLeft", "cuffLength"],
      ["hemBand", "hemBandLength"],
    ] as const) {
      const baseOpening = baseJoins.find((item) => item.role === role)!.openingLengthCm;
      const sizeOpening = sizeJoins.find((item) => item.role === role)!.openingLengthCm;
      expect(resolved[optionId]).toBeCloseTo(
        CREWNECK_OPTIONS[optionId] * sizeOpening / baseOpening,
        10,
      );
    }

    const sharedHelperBlock = draftAtSize(
      STANDARD_M,
      TSHIRT_GRADE,
      1,
      draftCrewneck,
      CREWNECK_OPTIONS,
      resolveCrewneckOptionsForSize,
    );
    const gradedJoins = crewneckBandMeasurements(
      sharedHelperBlock,
      resolveCrewneckOptionsForSize({
        baseMeasurements: STANDARD_M,
        sizeMeasurements,
        step: 1,
        draft: (measurements, options = {}) => draftCrewneck(measurements, options),
        baseOptions: CREWNECK_OPTIONS,
      }),
    );
    for (const role of ["neckband", "cuffLeft", "cuffRight", "hemBand"]) {
      const graded = gradedJoins.find((item) => item.role === role)!;
      expect(graded.analysis.calculable).toBe(true);
      expect(graded.analysis.openingToBandRatio).toBeCloseTo(
        crewneckBandMeasurements(baseBlock, CREWNECK_OPTIONS)
          .find((item) => item.role === role)!.analysis.openingToBandRatio!,
        9,
      );
    }
  });

  it("preserves invalid and missing raw inputs and reports the associated math issues", () => {
    const invalidOptions = {
      ...CREWNECK_OPTIONS,
      neckbandLength: Number.NaN,
      cuffLength: -31.5,
    };
    const drafted = draftCrewneck(STANDARD_M, invalidOptions);
    const measurements = crewneckBandMeasurements(drafted, invalidOptions);
    const neck = measurements.find((item) => item.role === "neckband")!;
    const cuff = measurements.find((item) => item.role === "cuffLeft")!;

    expect(Number.isNaN(neck.bandLengthCm)).toBe(true);
    expect(neck.analysis.calculable).toBe(false);
    expect(neck.analysis.issues[0]?.field).toBe("bandLengthCm");
    expect(cuff.bandLengthCm).toBe(-31.5);
    expect(cuff.analysis.calculable).toBe(false);
    expect(cuff.analysis.bandLengthCm).toBe(-31.5);

    const missing = draftCrewneck(STANDARD_M, {});
    const missingJoins = crewneckBandMeasurements(missing, {});
    expect(Number.isNaN(missingJoins[0]?.bandLengthCm)).toBe(true);
    expect(missingJoins[0]?.analysis.calculable).toBe(false);
  });

  it("leaves invalid base or size geometry values intact during grade resolution", () => {
    const invalidBaseOptions = { ...CREWNECK_OPTIONS, cuffLength: -4 };
    const invalidBase = resolveCrewneckOptionsForSize({
      baseMeasurements: STANDARD_M,
      sizeMeasurements: gradeMeasurements(STANDARD_M, TSHIRT_GRADE, 1),
      step: 1,
      draft: (measurements, options = {}) => draftCrewneck(measurements, options),
      baseOptions: invalidBaseOptions,
    });
    expect(invalidBase.cuffLength).toBe(-4);

    const invalidSize = resolveCrewneckOptionsForSize({
      baseMeasurements: STANDARD_M,
      sizeMeasurements: { ...gradeMeasurements(STANDARD_M, TSHIRT_GRADE, 1), chest: Number.NaN, bicep: Number.NaN },
      step: 1,
      draft: (measurements, options = {}) => draftCrewneck(measurements, options),
      baseOptions: CREWNECK_OPTIONS,
    });
    expect(invalidSize.neckbandLength).toBe(CREWNECK_OPTIONS.neckbandLength);
    expect(invalidSize.cuffLength).toBe(CREWNECK_OPTIONS.cuffLength);
    expect(invalidSize.hemBandLength).toBe(CREWNECK_OPTIONS.hemBandLength);
  });
});
