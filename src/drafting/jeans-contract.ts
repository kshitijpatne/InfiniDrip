import type { GarmentOption } from "./options";
import { TROUSER_FIELDS } from "./trouser-contract";

/** Jeans uses the same lower-body measurements as Trouser without changing
 * that recipe's schema or defaults. */
export const JEANS_FIELDS = TROUSER_FIELDS;

export interface JeansOptions {
  readonly frontRiseEase: number;
  readonly backRiseEase: number;
  readonly waistbandDepth: number;
  readonly thighEase: number;
  readonly kneeEase: number;
  readonly legOpening: number;
  readonly flyLength: number;
  readonly yokeDepth: number;
  readonly yokeEase: number;
  readonly frontPocketOpening: number;
  readonly frontPocketDrop: number;
  readonly frontPocketCurveDepth: number;
  readonly frontPocketBagDepth: number;
  readonly coinPocketWidth: number;
  readonly coinPocketHeight: number;
  readonly backPocketWidth: number;
  readonly backPocketHeight: number;
  readonly backPocketDrop: number;
  readonly backPocketOffset: number;
  readonly waistbandExtension: number;
}

/** Numeric entries are digital product seeds and guardrails, not sourced
 * construction standards. A source-backed eased yoke join is represented by
 * the `yokeEase` control, while its amount is still a product decision. */
export const JEANS_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  {
    id: "frontRiseEase",
    label: "Front rise ease",
    unit: "cm",
    group: "Rise & waistband",
    help: "Adds room to the front sitting depth; later fit guidance checks the rise against the fly and waistband.",
    defaultValue: 1,
    min: -2,
    max: 8,
    step: 0.5,
  },
  {
    id: "backRiseEase",
    label: "Back rise ease",
    unit: "cm",
    group: "Rise & waistband",
    help: "Adds room to the back sitting depth; later guidance checks the finished rise against the waistband.",
    defaultValue: 9,
    min: 2,
    max: 14,
    step: 0.5,
  },
  {
    id: "waistbandDepth",
    label: "Waistband depth",
    unit: "cm",
    group: "Rise & waistband",
    help: "Sets the finished height of the two-layer waistband; keep it below the finished rises.",
    defaultValue: 4,
    min: 2,
    max: 8,
    step: 0.5,
  },
  {
    id: "thighEase",
    label: "Thigh ease",
    unit: "cm",
    group: "Leg fit",
    help: "Adds finished room at the upper thigh; change it if the front or back leg leaves its valid contour.",
    defaultValue: 8,
    min: 0,
    max: 20,
    step: 0.5,
  },
  {
    id: "kneeEase",
    label: "Knee ease",
    unit: "cm",
    group: "Leg fit",
    help: "Adds finished room at the knee; keep the selected leg opening compatible with this width.",
    defaultValue: 5,
    min: 0,
    max: 15,
    step: 0.5,
  },
  {
    id: "legOpening",
    label: "Finished leg opening",
    unit: "cm",
    group: "Leg fit",
    help: "Sets the full finished opening circumference; change it if either leg panel becomes invalid.",
    defaultValue: 40,
    min: 25,
    max: 65,
    step: 0.5,
  },
  {
    id: "flyLength",
    label: "Fly length",
    unit: "cm",
    group: "Front closure",
    help: "Sets the digital fly length; later geometry checks its clearance from the rise, pockets, and waistband.",
    defaultValue: 15,
    min: 8,
    max: 25,
    step: 0.5,
  },
  {
    id: "yokeDepth",
    label: "Back yoke depth",
    unit: "cm",
    group: "Back yoke",
    help: "Sets the depth of the curved back yoke; adjust it if the yoke or back-lower panel cannot close cleanly.",
    defaultValue: 9,
    min: 5,
    max: 15,
    step: 0.5,
  },
  {
    id: "yokeEase",
    label: "Ease at each yoke join",
    unit: "cm",
    group: "Back yoke",
    help: "Sets the allowed extra length for each curved yoke/back-lower seam; later geometry declares it with the shared seam-ease range.",
    defaultValue: 0.5,
    min: 0,
    max: 1.5,
    step: 0.5,
  },
  {
    id: "frontPocketOpening",
    label: "Front pocket opening length",
    unit: "cm",
    group: "Front pockets",
    help: "Sets the cut length of each curved scoop opening; adjust it if the opening leaves the front or conflicts with the fly.",
    defaultValue: 15,
    min: 10,
    max: 22,
    step: 0.5,
  },
  {
    id: "frontPocketDrop",
    label: "Front pocket drop",
    unit: "cm",
    group: "Front pockets",
    help: "Moves each front pocket opening below the waistband; adjust it to keep the opening contained on the front panel.",
    defaultValue: 4,
    min: 2,
    max: 12,
    step: 0.5,
  },
  {
    id: "frontPocketCurveDepth",
    label: "Front pocket scoop depth",
    unit: "cm",
    group: "Front pockets",
    help: "Sets the inward depth of each curved scoop; reduce it if the opening or facing becomes invalid.",
    defaultValue: 3,
    min: 1,
    max: 6,
    step: 0.5,
  },
  {
    id: "frontPocketBagDepth",
    label: "Front pocket bag depth",
    unit: "cm",
    group: "Front pockets",
    help: "Sets the front pocket bag depth; reduce it if the bag reaches the leg opening or a seam allowance.",
    defaultValue: 24,
    min: 16,
    max: 35,
    step: 0.5,
  },
  {
    id: "coinPocketWidth",
    label: "Coin pocket width",
    unit: "cm",
    group: "Coin pocket",
    help: "Sets the cut width of the single coin pocket on the wearer-right pocket-facing extension; reduce it if the extension cannot contain the pocket with its provisional 1 cm margin.",
    defaultValue: 8,
    min: 5,
    max: 10,
    step: 0.5,
  },
  {
    id: "coinPocketHeight",
    label: "Coin pocket height",
    unit: "cm",
    group: "Coin pocket",
    help: "Sets the cut height of the single coin pocket on the wearer-right pocket-facing extension; reduce it if the extension cannot contain the pocket with its provisional 1 cm margin.",
    defaultValue: 7,
    min: 5,
    max: 10,
    step: 0.5,
  },
  {
    id: "backPocketWidth",
    label: "Back pocket width",
    unit: "cm",
    group: "Back pockets",
    help: "Sets the cut width of each back patch pocket; reduce the width or adjust backPocketOffset if the provisional 1 cm envelope reaches center-back or the side seam.",
    defaultValue: 14,
    min: 10,
    max: 20,
    step: 0.5,
  },
  {
    id: "backPocketHeight",
    label: "Back pocket height",
    unit: "cm",
    group: "Back pockets",
    help: "Sets the cut height of each back patch pocket; reduce the height or backPocketDrop if the provisional 1 cm envelope reaches the lower-leg station or hem.",
    defaultValue: 15,
    min: 10,
    max: 22,
    step: 0.5,
  },
  {
    id: "backPocketDrop",
    label: "Back pocket drop",
    unit: "cm",
    group: "Back pockets",
    help: "Sets the vertical distance from the live lower-yoke seam to the full top edge of both back pockets; reduce backPocketDrop or backPocketHeight if the provisional 1 cm envelope reaches the lower-leg station or hem.",
    defaultValue: 7,
    min: 2,
    max: 15,
    step: 0.5,
  },
  {
    id: "backPocketOffset",
    label: "Back pocket inboard offset",
    unit: "cm",
    group: "Back pockets",
    help: "Sets each back pocket's horizontal distance inward from the narrowest live side-seam station across its full height; increase backPocketOffset if the provisional 1 cm envelope reaches the side seam, or decrease it if the pocket reaches center-back.",
    defaultValue: 4,
    min: 2,
    max: 15,
    step: 0.5,
  },
  {
    id: "waistbandExtension",
    label: "Waistband extension per front end",
    unit: "cm",
    group: "Rise & waistband",
    help: "Sets the digital extension at each front end of the waistband; change it if closure ends do not align with the fly.",
    defaultValue: 1.5,
    min: 1,
    max: 3,
    step: 0.5,
  },
];

export const DEFAULT_JEANS_OPTIONS: JeansOptions = Object.fromEntries(
  JEANS_OPTION_DEFINITIONS.map((definition) => [definition.id, definition.defaultValue]),
) as unknown as JeansOptions;

/** Fill only absent values. Keep explicit invalid values for later guidance. */
export function resolveJeansOptions(values: Partial<JeansOptions> = {}): JeansOptions {
  return Object.fromEntries(JEANS_OPTION_DEFINITIONS.map((definition) => {
    const value = values[definition.id as keyof JeansOptions];
    return [definition.id, value === undefined ? definition.defaultValue : value];
  })) as unknown as JeansOptions;
}
