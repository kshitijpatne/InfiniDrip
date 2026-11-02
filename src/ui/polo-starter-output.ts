import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe, TechPack } from "../drafting/recipe";
import {
  POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID,
  POLO_ZIPPER_CLOSURE_PROFILE_VALUE,
  poloNotchesForOptions,
  poloPomsForOptions,
} from "../drafting/polo";

const DEFAULT_P02_BUTTON_COUNT = 2;
const DEFAULT_P03_BUTTON_COUNT = 2;
const DEFAULT_P04_BUTTON_COUNT = 2;
const DEFAULT_P05_BUTTON_COUNT = 2;
const DEFAULT_P06_BUTTON_COUNT = 2;
const DEFAULT_P07_OPENING_LENGTH_CM = 14;
const DEFAULT_P07_FINISHED_WIDTH_CM = 3;
const P05_LOW_EASE_MIN_CM = 3;
const P05_LOW_EASE_MAX_CM = 6;

const STYLE_ARC_SLEEVE_HEM_REFERENCE =
  "Sleeve-hem reference: turn under 2 cm and topstitch, following Style Arc's Jess Knit Polo tutorial (https://www.stylearc.com/magazine/sewing-tutorials/jess-knit-polo/). This is a construction reference only; it has not been physically validated on an InfiniDrip garment.";

function longSleevePoloTechPack(base: TechPack, buttonCount: number): TechPack {
  const buttonCountText = Number.isFinite(buttonCount) ? String(buttonCount) : "unresolved";
  return {
    ...base,
    bom: [
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: buttonCountText },
    ],
    construction: [
      "Digital P02 Classic long-sleeve Polo profile using the existing Polo recipe; review the exported pattern before use.",
      STYLE_ARC_SLEEVE_HEM_REFERENCE,
      `Selected front button count: ${buttonCountText} software value; digital button and buttonhole marks follow this choice.`,
    ],
    constructionNotice: "Digital pattern output only. The construction reference is not a validated InfiniDrip sewing instruction, and no physical sample has been assessed.",
    measurementSpecNote: "P02 software geometry only. The sleeve input is measured below the modeled cap base, while the sleeve POM includes cap height. The generic Polo size run is not a validated P02 grade, sewn tolerance, or physical-fit result.",
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P02 is an editable digital pattern. Physical fit, comfort, wear, sleeve endpoint, sewing performance, material behavior, grading, and production have not been validated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloClassicLongSleeveRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const baseTechPack = recipe.techPackForOptions?.(options) ?? recipe.techPack;
  const techPackForOptions = (activeOptions: GarmentOptions): TechPack =>
    longSleevePoloTechPack(
      recipe.techPackForOptions?.(activeOptions) ?? recipe.techPack,
      activeOptions.buttonCount ?? DEFAULT_P02_BUTTON_COUNT,
    );
  return {
    ...recipe,
    label: "Polo Classic long-sleeve",
    poms: recipe.poms.map((pom) => ({ ...pom, tolerance: undefined })),
    techPack: longSleevePoloTechPack(baseTechPack, options.buttonCount ?? DEFAULT_P02_BUTTON_COUNT),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}

function relaxedPoloTechPack(base: TechPack, buttonCount: number): TechPack {
  const buttonCountText = Number.isFinite(buttonCount) ? String(buttonCount) : "unresolved";
  return {
    ...base,
    bom: [
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: buttonCountText },
    ],
    construction: [
      "Digital P03 Relaxed Polo profile using the existing Polo recipe; review the exported pattern before use.",
      "The 15 cm ease default is an InfiniDrip software choice, not a sourced physical standard or validated fit target; no boxy or drop-shoulder geometry is added.",
      `Selected front button count: ${buttonCountText} software value; digital button and buttonhole marks follow this choice.`,
    ],
    constructionNotice: "Digital pattern output only. No physical sample has been assessed.",
    measurementSpecNote: "P03 software geometry only. The 15 cm ease default is a software choice, not a physical standard or validated fit target. The generic Polo size run is not a validated P03 grade.",
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P03 is an editable digital profile. Physical fit, comfort, wear, materials, grading, and production remain unvalidated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloRelaxedRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const baseTechPack = recipe.techPackForOptions?.(options) ?? recipe.techPack;
  const techPackForOptions = (activeOptions: GarmentOptions): TechPack =>
    relaxedPoloTechPack(
      recipe.techPackForOptions?.(activeOptions) ?? recipe.techPack,
      activeOptions.buttonCount ?? DEFAULT_P03_BUTTON_COUNT,
    );
  return {
    ...recipe,
    label: "Polo Relaxed",
    poms: recipe.poms.map((pom) => ({ ...pom, tolerance: undefined })),
    techPack: relaxedPoloTechPack(baseTechPack, options.buttonCount ?? DEFAULT_P03_BUTTON_COUNT),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}

function croppedPoloTechPack(base: TechPack, buttonCount: number): TechPack {
  const buttonCountText = Number.isFinite(buttonCount) ? String(buttonCount) : "unresolved";
  return {
    ...base,
    bom: [
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: buttonCountText },
    ],
    construction: [
      "Digital P04 Cropped Polo profile using the existing Polo recipe; review the exported pattern before use.",
      "The 53 cm body length and 44–57 cm range are editable software choices measured from modeled high point shoulder to hem; they do not specify a physical crop location or validated fit target.",
      `Selected front button count: ${buttonCountText} software value; digital button and buttonhole marks follow this choice.`,
    ],
    constructionNotice: "Digital pattern output only. No physical sample has been assessed.",
    measurementSpecNote: "P04 software geometry only. The 53 cm default and 44–57 cm body-length range are editable software choices measured from modeled high point shoulder to hem, not a physical crop position or validated fit result. The generic Polo size run is not a validated P04 grade.",
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P04 is an editable digital profile. Physical fit, coverage, comfort, wear, materials, grading, and production remain unvalidated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloCroppedRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const baseTechPack = recipe.techPackForOptions?.(options) ?? recipe.techPack;
  const techPackForOptions = (activeOptions: GarmentOptions): TechPack =>
    croppedPoloTechPack(
      recipe.techPackForOptions?.(activeOptions) ?? recipe.techPack,
      activeOptions.buttonCount ?? DEFAULT_P04_BUTTON_COUNT,
    );
  return {
    ...recipe,
    label: "Polo Cropped",
    poms: recipe.poms.map((pom) => ({ ...pom, tolerance: undefined })),
    techPack: croppedPoloTechPack(baseTechPack, options.buttonCount ?? DEFAULT_P04_BUTTON_COUNT),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}

function lowEasePoloTechPack(base: TechPack, buttonCount: number): TechPack {
  const buttonCountText = Number.isFinite(buttonCount) ? String(buttonCount) : "unresolved";
  return {
    ...base,
    bom: [
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: buttonCountText },
    ],
    construction: [
      "Digital P05 Low-ease Polo profile using the existing Polo recipe; review the exported pattern before use.",
      "The 5 cm ease default and editable 3–6 cm range are InfiniDrip software choices, not sourced physical standards or validated fit targets; no darted or independently shaped waist construction is added.",
      `Selected front button count: ${buttonCountText} software value; digital button and buttonhole marks follow this choice.`,
    ],
    constructionNotice: "Digital pattern output only. No physical sample has been assessed.",
    measurementSpecNote: "P05 software geometry only. The 5 cm ease default and 3–6 cm range are software choices, not physical standards or validated fit targets. No darted or independently shaped waist construction is added. The generic Polo size run is not a validated P05 grade.",
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P05 is an editable digital profile. Physical fit, comfort, wear, materials, grading, and production remain unvalidated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloLowEaseRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const baseTechPack = recipe.techPackForOptions?.(options) ?? recipe.techPack;
  const techPackForOptions = (activeOptions: GarmentOptions): TechPack =>
    lowEasePoloTechPack(
      recipe.techPackForOptions?.(activeOptions) ?? recipe.techPack,
      activeOptions.buttonCount ?? DEFAULT_P05_BUTTON_COUNT,
    );
  return {
    ...recipe,
    label: "Polo Low-ease",
    poms: recipe.poms.map((pom) => ({ ...pom, tolerance: undefined })),
    guidance: (block, measurements, activeOptions = {}) => {
      const notes = recipe.guidance(block, measurements, activeOptions);
      const ease = measurements.ease;
      if (!Number.isFinite(ease) || ease < P05_LOW_EASE_MIN_CM || ease > P05_LOW_EASE_MAX_CM) return notes;

      const unrelatedNotes = notes.filter((note) => !(
        note.field === "ease" && note.text.startsWith(`Ease is ${ease} cm —`)
      ));
      return [
        ...unrelatedNotes,
        {
          field: "ease",
          level: "info",
          text: `P05 Low-ease: ${ease} cm is within the declared 3–6 cm software range. This check does not assess physical fit, wear, comfort, or fabric behavior.`,
        },
      ];
    },
    techPack: lowEasePoloTechPack(baseTechPack, options.buttonCount ?? DEFAULT_P05_BUTTON_COUNT),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}

function longlinePoloTechPack(base: TechPack, buttonCount: number): TechPack {
  const buttonCountText = Number.isFinite(buttonCount) ? String(buttonCount) : "unresolved";
  return {
    ...base,
    bom: [
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: buttonCountText },
    ],
    construction: [
      "Digital P06 Longline Polo profile using the existing Polo recipe; review the exported pattern before use.",
      "The 10 cm ease default and 7–18 cm range, plus the 89 cm length default and 78–100 cm range, are editable software choices. Length is modeled from high-point shoulder to hem and is not a physical hem target.",
      "Selected front button count: " + buttonCountText + " software value; digital button and buttonhole marks follow this choice.",
    ],
    constructionNotice: "Digital pattern output only. No physical sample has been assessed; existing placket and vent checks do not establish sewn performance.",
    measurementSpecNote: "P06 software geometry only. The 10 cm ease and 89 cm modeled HPS-to-hem length, with editable 7–18 cm and 78–100 cm ranges, are software choices, not physical standards, hem targets, or validated fit targets. The generic Polo size run is not a validated P06 grade.",
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P06 is an editable digital profile. Physical fit, hem placement, comfort, wear, materials, grading, sewing, and production remain unvalidated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloLonglineRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const baseTechPack = recipe.techPackForOptions?.(options) ?? recipe.techPack;
  const techPackForOptions = (activeOptions: GarmentOptions): TechPack =>
    longlinePoloTechPack(
      recipe.techPackForOptions?.(activeOptions) ?? recipe.techPack,
      activeOptions.buttonCount ?? DEFAULT_P06_BUTTON_COUNT,
    );
  return {
    ...recipe,
    label: "Polo Longline",
    poms: recipe.poms.map((pom) => ({ ...pom, tolerance: undefined })),
    techPack: longlinePoloTechPack(baseTechPack, options.buttonCount ?? DEFAULT_P06_BUTTON_COUNT),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}

function zipPlacketPoloTechPack(base: TechPack, options: GarmentOptions): TechPack {
  const openingLength = options.placketLength ?? DEFAULT_P07_OPENING_LENGTH_CM;
  const finishedWidth = options.placketWidth ?? DEFAULT_P07_FINISHED_WIDTH_CM;
  const zipperMaterial = "Zipper (type and material unspecified)";
  const zipper = base.bom.find((row) => row.material === zipperMaterial) ?? {
    material: zipperMaterial,
    placement: "Center-front opening; nominal modeled length " + openingLength + " cm",
    qty: "1",
  };
  const bom = base.bom.filter((row) => row.material !== "Buttons"
    && row.material !== "Buttonholes" && row.material !== zipperMaterial);
  const bodyRowIndex = bom.findIndex((row) => row.material === "Not specified");
  bom.splice(bodyRowIndex < 0 ? 0 : bodyRowIndex + 1, 0, zipper);
  const filteredConstruction = base.construction.filter((line) => {
    const lower = line.toLowerCase();
    return lower.includes("p07 zip-placket") || lower.includes("zipper") || lower.startsWith("no buttons")
      || (!lower.includes("button") && !lower.includes("placket"));
  });
  const construction = filteredConstruction.some((line) => line.includes("P07 Zip-placket"))
    ? filteredConstruction
    : [
        "Digital P07 Zip-placket Polo profile using the existing Polo body; review the exported pattern before use.",
        "The " + openingLength + " cm modeled zipper opening and " + finishedWidth + " cm finished zipper-placket width are editable software choices, not physical standards or a selected zipper specification.",
        "Use one folded zipper-finish piece behind the centered front slit; no separate shield is modeled.",
        "No buttons or buttonholes are included in the P07 pattern or bill of materials.",
        ...filteredConstruction,
      ];
  return {
    ...base,
    bom,
    construction,
    constructionNotice: "Digital pattern output only. No physical zipper product or sample has been assessed; physical fit, comfort, wear, zipper compatibility/performance, materials, and sewing performance remain unvalidated.",
    measurementSpecNote: `P07 uses a ${openingLength} cm modeled zipper opening and ${finishedWidth} cm finished zipper-placket width as editable software choices, not physical standards or a selected zipper specification. The generic Polo size run is not a validated P07 grade; physical fit, materials, grading, comfort, wear, and production remain unvalidated.`,
    measurementSpecToleranceColumn: false,
    fitRecordStatusNote: "P07 is an editable digital pattern. Physical fit, comfort, wear, zipper compatibility/performance, materials, grading, and production remain unvalidated.",
    fitRecordPassColumn: false,
    fitRecordToleranceColumn: false,
    fitRecordTitle: "Digital Measurement Worksheet",
  };
}

export function poloZipPlacketRecipeForOutput(
  recipe: GarmentRecipe,
  options: GarmentOptions,
): GarmentRecipe {
  const withZipPlacketProfile = (activeOptions: GarmentOptions = options): GarmentOptions => ({
    ...activeOptions,
    [POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID]: POLO_ZIPPER_CLOSURE_PROFILE_VALUE,
  });
  const pomsForOptions = (activeOptions: GarmentOptions): GarmentRecipe["poms"] =>
    recipe.pomsForOptions?.(withZipPlacketProfile(activeOptions))
      ?? poloPomsForOptions(withZipPlacketProfile(activeOptions));
  const notchesForOptions = (activeOptions: GarmentOptions): GarmentRecipe["notches"] =>
    recipe.notchesForOptions?.(withZipPlacketProfile(activeOptions))
      ?? poloNotchesForOptions(withZipPlacketProfile(activeOptions));
  const techPackForOptions = (activeOptions: GarmentOptions = options): TechPack =>
    zipPlacketPoloTechPack(
      recipe.techPackForOptions?.(withZipPlacketProfile(activeOptions)) ?? recipe.techPack,
      activeOptions,
    );
  const profileOptions = withZipPlacketProfile(options);
  return {
    ...recipe,
    label: "Polo Zip-placket",
    draft: (measurements, activeOptions) => recipe.draft(measurements, withZipPlacketProfile(activeOptions)),
    ...(recipe.draftReview ? {
      draftReview: (measurements: Parameters<NonNullable<GarmentRecipe["draftReview"]>>[0], activeOptions?: GarmentOptions) =>
        recipe.draftReview!(measurements, withZipPlacketProfile(activeOptions)),
    } : {}),
    poms: pomsForOptions(profileOptions).map((pom) => ({ ...pom, tolerance: undefined })),
    pomsForOptions,
    notches: notchesForOptions(profileOptions),
    notchesForOptions,
    techPack: techPackForOptions(options),
    techPackForOptions,
    techPackForFabric: undefined,
  };
}
