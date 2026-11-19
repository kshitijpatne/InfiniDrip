import { describe, it, expect } from "vitest";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import {
  draftTrouserWithPockets,
  TROUSER_GRADE,
  TROUSER_POMS,
  TROUSER_SIZES,
  TROUSER_TECH_PACK,
  trouserGuidance,
  trouserMetrics,
  DEFAULT_TROUSER_OPTIONS,
  STANDARD_M,
  Measurements,
  TrouserOptions,
  gradeMeasurements,
  gradeRun,
  specSheet,
} from "./index";
import { TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY, TROUSER_CARGO_PROFILE_ROUTE_KEY } from "./trouser-contract";
import { trouserPomsForOptions, trouserTechPackForOptions, trouserWaistSizeMetric } from "./trouser-tables";

describe("trouser grading, POM, and tech-pack tables", () => {
  it("measures the R08 pocket pieces and placement from their authored block geometry", () => {
    const options = {
      [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const,
      cargoPocketWidthCm: 19,
      cargoPocketHeightCm: 21,
      cargoPleatIntakeCm: 3,
      cargoFlapDepthCm: 6,
      cargoPocketVerticalOffsetCm: 1.5,
    };
    const drafted = draftTrouserWithPockets(STANDARD_M, options);
    const poms = trouserPomsForOptions(options);
    const rows = specSheet([{ label: "M", step: 0, measurements: STANDARD_M, block: drafted }], poms);
    expect(rows.slice(-5).map((row) => [row.label, row.values[0]])).toEqual([
      ["Cargo pocket body width (digital finished)", 19],
      ["Cargo pocket body height (digital)", 21],
      ["Cargo pocket center pleat intake (digital)", 3],
      ["Cargo flap depth (digital)", 6],
      ["Cargo pocket vertical offset (digital)", 1.5],
    ]);
    const techPack = trouserTechPackForOptions(options);
    expect(techPack.constructionNotice).toContain("Digital R08 cargo-pocket");
    expect(techPack.construction.join(" ")).toContain("19 cm finished width by 21 cm digital height");
    expect(techPack.construction.join(" ")).toContain("3 cm cut intake");
    expect(techPack.construction.join(" ")).toContain("6 cm digital flap-depth guide");
    expect(techPack.construction.join(" ")).toContain("fastener material, size and performance are unspecified");
    expect(techPack.bom.every((item) => item.qty === "Unspecified" && item.material === "Unspecified")).toBe(true);
  });

  it("keeps R08 digital defaults explicit when restored values or placement marks are absent", () => {
    const options = { [TROUSER_CARGO_PROFILE_ROUTE_KEY]: 1 as const };
    const drafted = draftTrouserWithPockets(STANDARD_M, options);
    const poms = trouserPomsForOptions(options);
    const noCargoMarks = {
      ...drafted,
      roles: {
        ...drafted.roles,
        cargoPocketBodyLeft: { ...drafted.roles.cargoPocketBodyLeft!, marks: [] },
        frontLeft: { ...drafted.roles.frontLeft!, marks: drafted.roles.frontLeft!.marks?.filter((mark) => mark.name !== "cargoPocketPlacementCenter") },
      },
    };
    expect(poms.find((pom) => pom.label === "Cargo pocket body width (digital finished)")?.measure(noCargoMarks)).toBe(22);
    expect(poms.find((pom) => pom.label === "Cargo pocket center pleat intake (digital)")?.measure(noCargoMarks)).toBe(0);
    expect(poms.find((pom) => pom.label === "Cargo pocket vertical offset (digital)")?.measure(noCargoMarks)).toBe(0);

    const defaultPack = trouserTechPackForOptions(options);
    expect(defaultPack.construction.join(" ")).toContain("18 cm finished width by 20 cm digital height");
    expect(defaultPack.construction.join(" ")).toContain("centered 4 cm cut intake");
    expect(defaultPack.construction.join(" ")).toContain("0 cm vertical offset");
    expect(defaultPack.construction.join(" ")).toContain("5 cm digital flap-depth guide");
  });

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
    expect(run.every((size) => size.block.stitches.length === 11)).toBe(true);
    expect(run.every((size) => size.block.stitches.some((stitch) => stitch.label === "Left front fly ↔ shield"))).toBe(true);
    expect(run.every((size) => size.block.stitches.some((stitch) => stitch.label === "Right front fly ↔ underlap"))).toBe(true);
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
      for (const anchorMethod of [pom.anchor, pom.backAnchor]) {
        if (!anchorMethod) continue;
        const anchor = anchorMethod(b);
        expect(Number.isFinite(anchor.x) && Number.isFinite(anchor.y)).toBe(true);
      }
    }
    const backRise = TROUSER_POMS.find((pom) => pom.label === "Back rise (finished incl. waistband)");
    expect(backRise?.backAnchor?.(b)).toEqual(edgeStart(pieceEdge(b.roles.backLeft, "centerBack")));
  });

  it("measures R06 from its post-fold waist mark and identifies the digital pleat limits", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const,
      frontPleatIntakeCm: 4,
      frontPleatOffsetCm: 6,
      frontPleatStitchDepthCm: 8,
    };
    const b = draftTrouserWithPockets(STANDARD_M, options);
    const poms = trouserPomsForOptions(options);
    const rows = specSheet([{ label: "M", step: 0, measurements: STANDARD_M, block: b }], poms);
    const waistPom = poms.find((pom) => pom.label === "Waist (finished)")!;
    const waistMark = b.roles.frontLeft!.marks!.find((mark) => mark.name === "frontWaistAfterPleat")!;
    const pack = trouserTechPackForOptions(options);

    expect(rows.find((row) => row.label === "Waist (finished)")?.values[0]).toBeCloseTo(94);
    expect(waistPom.frontMarkAnchor).toEqual({ roleId: "frontLeft", markName: "frontWaistAfterPleat", point: "end" });
    expect(waistPom.anchor?.(b)).toEqual("start" in waistMark ? waistMark.end : undefined);
    expect(trouserWaistSizeMetric(b)).toBeCloseTo(23.5);
    expect(trouserPomsForOptions(DEFAULT_TROUSER_OPTIONS)).toBe(TROUSER_POMS);
    expect(pack.constructionNotice).toContain("Fabric response");
    expect(pack.construction.join(" ")).toContain("digital knife-pleat intake is 4 cm at 6 cm from centre front");
    expect(pack.construction.join(" ")).toContain("sewn sample");
    expect(trouserTechPackForOptions(DEFAULT_TROUSER_OPTIONS)).toBe(TROUSER_TECH_PACK);
  });

  it("falls back to the generic front waist edge when no authored waist reference mark exists", () => {
    const block = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);

    expect(trouserWaistSizeMetric(block)).toBeCloseTo(23.5);
  });

  it("keeps the R06 POM and tech-pack defaults safe for partial route options", () => {
    const routeOnly = { [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const };
    const b = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const waistPom = trouserPomsForOptions(routeOnly).find((pom) => pom.label === "Waist (finished)")!;
    const front = b.roles.frontLeft!;

    expect(waistPom.measure(b)).toBeCloseTo(4 * edgeLength(pieceEdge(front, "waist")));
    expect(waistPom.anchor?.(b)).toEqual(edgeEnd(pieceEdge(front, "waist")));
    expect(trouserTechPackForOptions(routeOnly).construction.join(" "))
      .toContain("digital knife-pleat intake is 4 cm at 6 cm from centre front, with an 8 cm stitch-down guide");
  });

  it("uses the R07 software defaults for partial route options and safely reports missing reference marks", () => {
    const routeOnly = { [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const };
    const block = draftTrouserWithPockets(STANDARD_M, routeOnly);
    const poms = trouserPomsForOptions(routeOnly);
    const measure = (label: string, target: typeof block) => poms.find((pom) => pom.label === label)!.measure(target);
    const techPack = trouserTechPackForOptions(routeOnly);

    expect(measure("Casing depth (digital)", block)).toBeCloseTo(4);
    expect(techPack.construction[1]).toContain("4 cm");
    expect(measure("Hip depth (body reference)", block)).toBeCloseTo(STANDARD_M.hipDepth);
    expect(measure("Front rise (digital gather-to waist reference)", block)).toBeCloseTo(trouserMetrics(STANDARD_M, routeOnly).frontRise);
    expect(measure("Back rise (digital gather-to waist reference)", block)).toBeCloseTo(trouserMetrics(STANDARD_M, routeOnly).backRise);
    expect(measure("Gather-to waist reference (digital)", block)).toBeCloseTo(trouserMetrics(STANDARD_M, routeOnly).finishedWaist);
    expect(trouserGuidance(block, STANDARD_M, routeOnly).some((note) =>
      note.field === "option-waistbandDepth" || note.field === "option-flyLength")).toBe(false);

    const withoutFrontGuide = { ...block, roles: { ...block.roles,
      frontLeft: { ...block.roles.frontLeft!, marks: block.roles.frontLeft!.marks?.filter((mark) => mark.name !== "casingStitchGuide") },
    } } as typeof block;
    const withoutBackGuide = { ...block, roles: { ...block.roles,
      backLeft: { ...block.roles.backLeft!, marks: block.roles.backLeft!.marks?.filter((mark) => mark.name !== "casingStitchGuide") },
    } } as typeof block;
    expect(measure("Hip depth (body reference)", withoutFrontGuide)).toBe(0);
    expect(measure("Front rise (digital gather-to waist reference)", withoutFrontGuide)).toBe(0);
    expect(measure("Gather-to waist reference (digital)", withoutFrontGuide)).toBe(0);
    expect(measure("Back rise (digital gather-to waist reference)", withoutBackGuide)).toBe(0);
  });

  it("reports R07 opening, gather-to reference and casing depth without fly or band claims", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const,
      waistGatherRatio: 1.25,
      casingDepthCm: 4,
    };
    const block = draftTrouserWithPockets(STANDARD_M, options);
    const poms = trouserPomsForOptions(options);
    const rows = specSheet([{ label: "M", step: 0, measurements: STANDARD_M, block }], poms);
    const value = (label: string) => rows.find((row) => row.label === label)!.values[0];
    const labels = rows.map((row) => row.label);
    const pack = trouserTechPackForOptions(options);

    expect(labels).toContain("Waist opening before gathering (digital seamline)");
    expect(labels).toContain("Gather-to waist reference (digital)");
    expect(labels).toContain("Casing depth (digital)");
    expect(labels).not.toContain("Waistband depth (finished)");
    expect(labels).not.toContain("Front fly length (finished)");
    expect(value("Waist opening before gathering (digital seamline)")).toBeCloseTo(117.5);
    expect(value("Gather-to waist reference (digital)")).toBeCloseTo(94);
    expect(value("Casing depth (digital)")).toBeCloseTo(4);
    expect(trouserWaistSizeMetric(block)).toBeCloseTo(23.5);
    expect(pack.constructionNotice).toContain("Elastic specification");
    expect(pack.bom.find((item) => item.material.startsWith("Elastic"))).toMatchObject({ qty: "Unspecified" });
    expect(pack.construction.join(" ")).toContain("no elastic cut length is calculated");
    expect(pack.constructionNotice).toContain("physical pull-on fit");

    const belowHip = trouserGuidance(block, STANDARD_M, { ...options, waistGatherRatio: 1 });
    expect(belowHip.some((note) => note.field === "option-waistGatherRatio" && note.text.includes("hip + existing ease"))).toBe(true);
    const offStep = trouserGuidance(block, STANDARD_M, { ...options, waistGatherRatio: 1.23, casingDepthCm: 4.25 });
    expect(offStep.filter((note) => note.level === "warn").map((note) => note.field))
      .toEqual(expect.arrayContaining(["option-waistGatherRatio", "option-casingDepthCm"]));
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

  it("retains the R06 side-waist pleat placement correction on a narrow digital waist", () => {
    const measurements = { ...STANDARD_M, waist: 30 };
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const,
      frontPleatOffsetCm: 12,
      frontPleatIntakeCm: 8,
      frontPleatStitchDepthCm: 8,
    };
    const block = draftTrouserWithPockets(measurements, options);

    expect(trouserGuidance(block, measurements, options).some((note) =>
      note.field === "option-frontPleatOffsetCm" && note.text.includes("reaches the side waist"))).toBe(true);
  });
});
