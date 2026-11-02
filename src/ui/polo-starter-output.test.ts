import { describe, expect, it } from "vitest";
import { POLO, STANDARD_M, type GarmentRecipe } from "../drafting";
import { poloBandCollarRecipeForOutput, poloClassicLongSleeveRecipeForOutput, poloCroppedRecipeForOutput, poloLonglineRecipeForOutput, poloLowEaseRecipeForOutput, poloRelaxedRecipeForOutput, poloZipPlacketRecipeForOutput } from "./polo-starter-output";

describe("P02 Classic long-sleeve Polo output", () => {
  it("keeps material consumption unspecified and follows the selected button count", () => {
    const output = poloClassicLongSleeveRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Classic long-sleeve");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("turn under 2 cm and topstitch");
    expect(output.techPack.construction.join(" ")).toContain("https://www.stylearc.com/magazine/sewing-tutorials/jess-knit-polo/");
    expect(output.techPack.construction.join(" ")).toContain("digital button and buttonhole marks follow this choice");
    expect(output.techPack.constructionNotice).toContain("not a validated InfiniDrip sewing instruction");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P02 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");

    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses safe output defaults when the source recipe has no option-aware Tech Pack", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloClassicLongSleeveRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P03 Relaxed Polo output", () => {
  it("keeps material use unspecified and labels the relaxed default as digital-only", () => {
    const output = poloRelaxedRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Relaxed");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("15 cm ease default is an InfiniDrip software choice");
    expect(output.techPack.construction.join(" ")).toContain("no boxy or drop-shoulder geometry");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.measurementSpecNote).toContain("not a physical standard or validated fit target");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P03 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the two-button default for missing options and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloRelaxedRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P04 Cropped Polo output", () => {
  it("labels the modeled length as a software choice and keeps physical claims unvalidated", () => {
    const output = poloCroppedRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Cropped");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("Digital P04 Cropped Polo profile");
    expect(output.techPack.construction.join(" ")).toContain("53 cm body length and 44–57 cm range are editable software choices");
    expect(output.techPack.construction.join(" ")).toContain("not specify a physical crop location or validated fit target");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.measurementSpecNote).toContain("not a physical crop position or validated fit result");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P04 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, coverage, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the two-button default for missing options and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloCroppedRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P05 Low-ease Polo output", () => {
  it("uses P05 range guidance for supported ease values and preserves unrelated notes", () => {
    const unrelatedWarning = { field: "armholeDepth", level: "warn" as const, text: "Preserve this unrelated warning." };
    const base: GarmentRecipe = {
      ...POLO,
      guidance: (_block, measurements) => [
        {
          field: "ease",
          level: "warn",
          text: `Ease is ${measurements.ease} cm — below the tee check's 5 cm lower boundary.`,
        },
        unrelatedWarning,
      ],
    };
    const output = poloLowEaseRecipeForOutput(base, { buttonCount: 2 });

    for (const ease of [3, 4, 5, 6]) {
      const measurements = { ...STANDARD_M, ease };
      const notes = output.guidance(base.draft(measurements), measurements, { buttonCount: 2 });
      expect(notes).toEqual([
        unrelatedWarning,
        {
          field: "ease",
          level: "info",
          text: `P05 Low-ease: ${ease} cm is within the declared 3–6 cm software range. This check does not assess physical fit, wear, comfort, or fabric behavior.`,
        },
      ]);
    }

    for (const ease of [2, 7]) {
      const measurements = { ...STANDARD_M, ease };
      expect(output.guidance(base.draft(measurements), measurements, { buttonCount: 2 }))
        .toEqual(base.guidance(base.draft(measurements), measurements, { buttonCount: 2 }));
    }

    const nonFiniteMeasurements = { ...STANDARD_M, ease: Number.NaN };
    const validBlock = base.draft(STANDARD_M);
    expect(output.guidance(validBlock, nonFiniteMeasurements, { buttonCount: 2 }))
      .toEqual(base.guidance(validBlock, nonFiniteMeasurements, { buttonCount: 2 }));
  });

  it("labels ease as a software choice and keeps physical claims unvalidated", () => {
    const output = poloLowEaseRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Low-ease");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("Digital P05 Low-ease Polo profile");
    expect(output.techPack.construction.join(" ")).toContain("5 cm ease default and editable 3–6 cm range are InfiniDrip software choices");
    expect(output.techPack.construction.join(" ")).toContain("no darted or independently shaped waist construction");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.measurementSpecNote).toContain("not physical standards or validated fit targets");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P05 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the two-button default for missing options and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloLowEaseRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P06 Longline Polo output", () => {
  it("labels the longline software choices and retains truthful digital-only disclosures", () => {
    const output = poloLonglineRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Longline");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("Digital P06 Longline Polo profile");
    expect(output.techPack.construction.join(" ")).toContain("10 cm ease default and 7–18 cm range");
    expect(output.techPack.construction.join(" ")).toContain("89 cm length default and 78–100 cm range");
    expect(output.techPack.construction.join(" ")).toContain("not a physical hem target");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.constructionNotice).toContain("do not establish sewn performance");
    expect(output.techPack.measurementSpecNote).toContain("not physical standards, hem targets, or validated fit targets");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P06 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, hem placement, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the P01 two-button fallback and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloLonglineRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P07 Zip-placket Polo output", () => {
  it("opts only the P07 output profile into page-local tiled PDF coordinates", () => {
    const output = poloZipPlacketRecipeForOutput(POLO, {});

    expect(output.tiledPdfLocalCoordinates).toBe(true);
    expect(poloLonglineRecipeForOutput(POLO, { buttonCount: 2 }).tiledPdfLocalCoordinates).not.toBe(true);
    expect(POLO.tiledPdfLocalCoordinates).not.toBe(true);
  });

  it("preserves an option-aware P07 Tech Pack without applying the P07 builder twice", () => {
    const prebuilt = {
      ...POLO.techPack,
      construction: [...POLO.techPack.construction, "P07 callback output retained"],
    };
    const base: GarmentRecipe = {
      ...POLO,
      techPackForOptions: () => prebuilt,
    };

    const output = poloZipPlacketRecipeForOutput(base, {});

    expect(output.techPack.construction).toContain("P07 callback output retained");
    expect(output.techPackForOptions!({ placketLength: 20 }).construction)
      .toContain("P07 callback output retained");
  });

  it("keeps the zipper BOM and digital-only disclosures across option-aware output", () => {
    const options = { placketLength: 20, placketWidth: 3.5 };
    const output = poloZipPlacketRecipeForOutput(POLO, options);
    expect(output.label).toBe("Polo Zip-placket");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.draft(STANDARD_M, options).roles.zipperFinish).toBeDefined();
    expect(output.pomsForOptions!(options).map((pom) => pom.label)).toContain("Modeled zipper opening length");
    expect(output.notchesForOptions!(options).map((notch) => notch.pieceName)).toContain("zipper finish");
    expect(output.techPack.bom).toEqual(expect.arrayContaining([
      { material: "Not specified", placement: "Body, sleeves, collar, zipper finish and unspecified trim", qty: "No consumption estimate" },
      { material: "Zipper (type and material unspecified)", placement: "One modeled center-front closure; nominal opening length 20 cm", qty: "1 modeled closure; physical product unspecified" },
    ]));
    expect(output.techPack.bom.some((row) => row.material === "Buttons" || row.material === "Buttonholes")).toBe(false);
    expect(output.techPack.bom.some((row) => row.material === "Stretch sewing thread" || row.material.toLowerCase().includes("stabilizer"))).toBe(false);
    expect(output.techPack.construction.join(" ")).toContain("No buttons or buttonholes");
    expect(output.techPack.construction.join(" ")).toContain("cut line, two diagonal lower clip lines and a reinforcement-box placement line");
    expect(output.techPack.construction.join(" ")).toContain("3.5 cm finished zipper-placket width");
    expect(output.techPack.construction.join(" ")).toContain("Hem front and back body edges separately");
    expect(output.techPack.constructionNotice).toContain("physical fit, dimensions, comfort, wear");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P07 grade");
    expect(output.techPack.fitRecordStatusNote).toContain("zipper compatibility/performance");
    expect(output.techPackForOptions!({ ...options, placketLength: 30 }).bom[1]?.placement)
      .toContain("nominal opening length 30 cm");
  });

  it("keeps the P07 consumers and disclosures when the source recipe lacks option-aware callbacks", () => {
    const base: GarmentRecipe = {
      ...POLO,
      pomsForOptions: undefined,
      notchesForOptions: undefined,
      techPackForOptions: undefined,
      draftReview: (measurements, options = {}) => ({
        block: POLO.draft(measurements, options),
        notes: [],
      }),
    };
    const output = poloZipPlacketRecipeForOutput(base, {});
    const poms = output.pomsForOptions!({});
    expect(poms.map((pom) => pom.label)).toContain("Modeled zipper opening length");
    expect(poms.map((pom) => pom.label)).not.toContain("Button spacing");
    expect(output.notchesForOptions!({}).map((notch) => notch.pieceName)).toContain("zipper finish");
    const techPack = output.techPackForOptions!({});
    expect(techPack.measurementSpecNote).toContain("14 cm modeled zipper opening and 3 cm finished zipper-placket width");
    expect(techPack.bom.filter((row) => row.material === "Zipper (type and material unspecified)"))
      .toEqual([{ material: "Zipper (type and material unspecified)", placement: "One modeled center-front closure; nominal opening length 14 cm", qty: "1 modeled closure; physical product unspecified" }]);
    expect(techPack.bom.some((row) => row.material === "Buttons" || row.material === "Buttonholes")).toBe(false);
    expect(techPack.construction.join(" ")).toContain("No buttons or buttonholes are included");
    expect(output.draftReview!(STANDARD_M, {}).block?.roles.zipperFinish).toBeDefined();
  });
});

describe("P08 band-collar half-placket Polo output", () => {
  it("keeps the two-layer band profile and digital-only Tech Pack consistent", () => {
    const options = { buttonCount: 3, standHeight: 2.5, placketLength: 20, placketWidth: 3.5 };
    const output = poloBandCollarRecipeForOutput(POLO, options);
    const draft = output.draft(STANDARD_M, options);
    expect(output.label).toBe("Polo Band-collar half-placket");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.pomsForOptions!(options).map((pom) => pom.label)).toContain("Finished band height");
    expect(output.pomsForOptions!(options).map((pom) => pom.label)).not.toContain("Finished pointed collar leaf");
    expect(output.notchesForOptions!(options).map((notch) => notch.pieceName)).toContain("outer collar band");
    expect(draft.roles.upperCollar).toBeUndefined();
    expect(draft.roles.underCollar).toBeUndefined();
    expect(draft.roles.outerStand?.name).toBe("outer collar band");
    expect(draft.roles.innerStand?.name).toBe("inner collar band");
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar band, placket and unspecified trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "3" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("two band layers with no pointed collar leaf");
    expect(output.techPack.construction.join(" ")).toContain("no additional button on the collar band");
    expect(output.techPack.construction.join(" ")).toContain("3.5 cm finished placket width");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.fitRecordStatusNote).toContain("remain unvalidated");
    const fallbackOutput = poloBandCollarRecipeForOutput({ ...POLO, techPackForOptions: undefined }, options);
    expect(fallbackOutput.techPackForOptions!({ ...options, buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty)
      .toBe("unresolved");
  });

  it("routes drafting and output callbacks through P08 when option callbacks are absent", () => {
    const base: GarmentRecipe = {
      ...POLO,
      pomsForOptions: undefined,
      notchesForOptions: undefined,
      techPackForOptions: undefined,
      draftReview: (measurements, options = {}) => ({ block: POLO.draft(measurements, options), notes: [] }),
    };
    const output = poloBandCollarRecipeForOutput(base, {});
    expect(output.draftReview!(STANDARD_M, {})!.block!.roles.outerStand?.name).toBe("outer collar band");
    expect(output.pomsForOptions!({}).map((pom) => pom.label)).toContain("Finished band height");
    expect(output.notchesForOptions!({}).map((notch) => notch.pieceName)).toContain("inner collar band");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
  });
});
