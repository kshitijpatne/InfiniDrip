import { defaultGarmentOptions, type GarmentOption, type GarmentOptions } from "./options";

export interface HoodiePouchOptions extends GarmentOptions {
  readonly pocketWidth: number;
  readonly pocketHeight: number;
  readonly pocketOpeningLength: number;
  readonly pocketOpeningAngle: number;
  readonly pocketHemClearance: number;
}

/** Digital G04S seeds and control bounds; these are not sourced pattern standards. */
export const HOODIE_POUCH_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  {
    id: "pocketWidth",
    label: "Pouch width",
    unit: "cm",
    group: "Pocket",
    help: "Sets the full pouch width centered on the front fold. Set to zero to omit the pouch; reduce it if the pouch leaves the panel.",
    defaultValue: 34,
    min: 0,
    max: 54,
    step: 1,
  },
  {
    id: "pocketHeight",
    label: "Pouch height",
    unit: "cm",
    group: "Pocket",
    help: "Sets the pouch height upward from the fixed hem-clearance edge. Set to zero to omit the pouch; reduce it if the upper edge leaves the front panel.",
    defaultValue: 22,
    min: 0,
    max: 38,
    step: 1,
  },
  {
    id: "pocketOpeningLength",
    label: "Each side opening length",
    unit: "cm",
    group: "Pocket",
    help: "Sets one opening on the on-fold half pattern; the fold mirrors it to form the pair. Shorten it if it reaches the pouch lower edge.",
    defaultValue: 10,
    min: 4,
    max: 18,
    step: 0.5,
  },
  {
    id: "pocketOpeningAngle",
    label: "Side opening angle",
    unit: "°",
    group: "Pocket",
    help: "Sets the diagonal direction of both side openings, measured down from horizontal toward the fold. Adjust it if an endpoint approaches the fold or side seam.",
    defaultValue: 45,
    min: 30,
    max: 60,
    step: 1,
  },
  {
    id: "pocketHemClearance",
    label: "Pouch hem clearance",
    unit: "cm",
    group: "Pocket",
    help: "Sets the vertical gap from the pouch lower edge to the actual front hem-band seam. Increase it if the pouch approaches that seam.",
    defaultValue: 6,
    min: 0,
    max: 25,
    step: 0.5,
  },
];

export const HOODIE_POUCH_DEFAULT_OPTIONS = defaultGarmentOptions(
  HOODIE_POUCH_OPTION_DEFINITIONS,
) as HoodiePouchOptions;

/** Missing fields receive the pouch defaults; explicit zero and invalid numbers pass through. */
export function resolveHoodiePouchOptions(
  raw: Partial<HoodiePouchOptions> = {},
): HoodiePouchOptions {
  return {
    pocketWidth: raw.pocketWidth ?? HOODIE_POUCH_DEFAULT_OPTIONS.pocketWidth,
    pocketHeight: raw.pocketHeight ?? HOODIE_POUCH_DEFAULT_OPTIONS.pocketHeight,
    pocketOpeningLength: raw.pocketOpeningLength ?? HOODIE_POUCH_DEFAULT_OPTIONS.pocketOpeningLength,
    pocketOpeningAngle: raw.pocketOpeningAngle ?? HOODIE_POUCH_DEFAULT_OPTIONS.pocketOpeningAngle,
    pocketHemClearance: raw.pocketHemClearance ?? HOODIE_POUCH_DEFAULT_OPTIONS.pocketHemClearance,
  };
}