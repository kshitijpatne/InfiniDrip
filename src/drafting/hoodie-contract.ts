import { defaultGarmentOptions, type GarmentOption, type GarmentOptions } from "./options";

export interface HoodieShapeOptions extends GarmentOptions {
  readonly hoodNecklineWidthEase: number;
  readonly hoodNecklineFrontDrop: number;
  readonly hoodNeckEase: number;
  readonly hoodHeight: number;
  readonly hoodDepth: number;
}

export interface HoodiePouchOptions extends GarmentOptions {
  readonly pocketWidth: number;
  readonly pocketHeight: number;
  readonly pocketOpeningLength: number;
  readonly pocketOpeningAngle: number;
  readonly pocketHemClearance: number;
}

/** Digital G04S shape seeds and bounds; none is a sourced measurement standard. */
export const HOODIE_SHAPE_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  {
    id: "hoodNecklineWidthEase",
    label: "Neckline width ease per side",
    unit: "cm",
    group: "Hood",
    help: "Adds the same width ease to the front and back necklines; reduce it if either neckline reaches the shoulder seam.",
    defaultValue: 4,
    min: 0,
    max: 12,
    step: 0.5,
  },
  {
    id: "hoodNecklineFrontDrop",
    label: "Front neckline drop",
    unit: "cm",
    group: "Hood",
    help: "Deepens the Hoodie front neckline only; reduce it if the curve reaches the shoulder seam or falls below the underarm.",
    defaultValue: 8,
    min: 0,
    max: 22,
    step: 0.5,
  },
  {
    id: "hoodNeckEase",
    label: "Hood-to-neckline ease",
    unit: "cm",
    group: "Hood",
    help: "Adds this length across each left or right hood half's front and back neck edges; outer and lining share the same seam. Keep it within 0–6 cm so the neckline can be represented.",
    defaultValue: 0,
    min: 0,
    max: 6,
    step: 0.5,
  },
  {
    id: "hoodHeight",
    label: "Hood height",
    unit: "cm",
    group: "Hood",
    help: "Sets the vertical rise from the neck seam at the shoulder notch to the crown. The same authored value is used from XS–XL; no head measurement is used.",
    defaultValue: 32,
    min: 20,
    max: 50,
    step: 1,
  },
  {
    id: "hoodDepth",
    label: "Hood depth",
    unit: "cm",
    group: "Hood",
    help: "Sets the horizontal extent from the center-back seam to the face opening. The same authored value is used from XS–XL; no head measurement is used.",
    defaultValue: 28,
    min: 18,
    max: 42,
    step: 1,
  },
];

export const HOODIE_SHAPE_DEFAULT_OPTIONS = defaultGarmentOptions(
  HOODIE_SHAPE_OPTION_DEFINITIONS,
) as HoodieShapeOptions;

/** Fill missing values without clamping explicit zero or invalid raw inputs. */
export function resolveHoodieShapeOptions(
  raw: Partial<HoodieShapeOptions> = {},
): HoodieShapeOptions {
  return {
    hoodNecklineWidthEase: raw.hoodNecklineWidthEase ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodNecklineWidthEase,
    hoodNecklineFrontDrop: raw.hoodNecklineFrontDrop ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodNecklineFrontDrop,
    hoodNeckEase: raw.hoodNeckEase ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodNeckEase,
    hoodHeight: raw.hoodHeight ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodHeight,
    hoodDepth: raw.hoodDepth ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodDepth,
  };
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
