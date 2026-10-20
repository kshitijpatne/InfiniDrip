import { defaultGarmentOptions, type GarmentOption, type GarmentOptions } from "./options";
import { CREWNECK_OPTION_DEFINITIONS } from "./crewneck-contract";

export interface HoodieShapeOptions extends GarmentOptions {
  readonly hoodNecklineWidthEase: number;
  readonly hoodNecklineFrontDrop: number;
  readonly hoodNeckEase: number;
  readonly hoodFrontOverlap: number;
  readonly hoodHeight: number;
  readonly hoodDepth: number;
  readonly hoodCasingWidth: number;
  readonly hoodDrawcordLength: number;
  readonly hoodExitSpacing: number;
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
    id: "hoodFrontOverlap",
    label: "Hood front overlap",
    unit: "cm",
    group: "Hood",
    help: "Sets the total paired overlap at center front, split evenly across the mirrored hood halves. Set it to zero for front edges to meet without an extra edge; reduce it if the hood outline crosses itself.",
    defaultValue: 3,
    min: 0,
    max: 8,
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
  {
    id: "hoodCasingWidth",
    label: "Hood casing width",
    unit: "cm",
    group: "Hood",
    help: "Sets the perpendicular depth from the face opening to the casing fold guide. Reduce it if the guide leaves the hood piece; set it to zero to remove the casing and both exits.",
    defaultValue: 2.5,
    min: 0,
    max: 5.5,
    step: 0.5,
  },
  {
    id: "hoodDrawcordLength",
    label: "Drawcord length",
    unit: "cm",
    group: "Hood",
    help: "Sets a qualified digital cord amount, not a cut length. This value is unused while the casing width is zero.",
    defaultValue: 120,
    min: 60,
    max: 180,
    step: 1,
  },
  {
    id: "hoodExitSpacing",
    label: "Drawcord exit spacing",
    unit: "cm",
    group: "Hood",
    help: "Sets the center-to-center distance between the mirrored exits. Reduce it if both marks do not fit on the current casing.",
    defaultValue: 8,
    min: 4,
    max: 16,
    step: 0.5,
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
    hoodFrontOverlap: raw.hoodFrontOverlap ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodFrontOverlap,
    hoodHeight: raw.hoodHeight ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodHeight,
    hoodDepth: raw.hoodDepth ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodDepth,
    hoodCasingWidth: raw.hoodCasingWidth ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodCasingWidth,
    hoodDrawcordLength: raw.hoodDrawcordLength ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodDrawcordLength,
    hoodExitSpacing: raw.hoodExitSpacing ??
      HOODIE_SHAPE_DEFAULT_OPTIONS.hoodExitSpacing,
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

/** Existing shared cuff/hem controls; the Hoodie has no neckband options. */
export interface HoodieBandOptions extends GarmentOptions {
  readonly cuffDepth: number;
  readonly hemBandDepth: number;
  readonly cuffLength: number;
  readonly hemBandLength: number;
}

/** Complete internal control set consumed by the unregistered Hoodie draft. */
export interface HoodieOptions extends HoodieShapeOptions, HoodiePouchOptions, HoodieBandOptions {}

const HOODIE_BAND_OPTION_IDS = [
  "cuffDepth",
  "hemBandDepth",
  "cuffLength",
  "hemBandLength",
] as const;

export const HOODIE_BAND_OPTION_DEFINITIONS: readonly GarmentOption[] =
  CREWNECK_OPTION_DEFINITIONS.filter(({ id }) =>
    (HOODIE_BAND_OPTION_IDS as readonly string[]).includes(id));

const HOODIE_BAND_DEFAULT_OPTIONS = defaultGarmentOptions(HOODIE_BAND_OPTION_DEFINITIONS);

/** Full control table for later recipe activation; neckband controls are excluded. */
export const HOODIE_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  ...HOODIE_SHAPE_OPTION_DEFINITIONS,
  ...HOODIE_POUCH_OPTION_DEFINITIONS,
  ...HOODIE_BAND_OPTION_DEFINITIONS,
];

export const HOODIE_DEFAULT_OPTIONS = {
  ...HOODIE_SHAPE_DEFAULT_OPTIONS,
  ...HOODIE_POUCH_DEFAULT_OPTIONS,
  ...HOODIE_BAND_DEFAULT_OPTIONS,
} as HoodieOptions;

/** Fill missing values while preserving explicit zero and invalid raw values. */
export function resolveHoodieOptions(raw: Partial<HoodieOptions> = {}): HoodieOptions {
  return {
    ...resolveHoodieShapeOptions(raw),
    ...resolveHoodiePouchOptions(raw),
    cuffDepth: raw.cuffDepth ?? HOODIE_DEFAULT_OPTIONS.cuffDepth,
    hemBandDepth: raw.hemBandDepth ?? HOODIE_DEFAULT_OPTIONS.hemBandDepth,
    cuffLength: raw.cuffLength ?? HOODIE_DEFAULT_OPTIONS.cuffLength,
    hemBandLength: raw.hemBandLength ?? HOODIE_DEFAULT_OPTIONS.hemBandLength,
  };
}
