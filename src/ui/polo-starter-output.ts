import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe, TechPack } from "../drafting/recipe";

const DEFAULT_P02_BUTTON_COUNT = 2;

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
