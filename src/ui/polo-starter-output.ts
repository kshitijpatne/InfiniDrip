import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe, TechPack } from "../drafting/recipe";

const DEFAULT_P02_BUTTON_COUNT = 2;
const DEFAULT_P03_BUTTON_COUNT = 2;
const DEFAULT_P04_BUTTON_COUNT = 2;

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
