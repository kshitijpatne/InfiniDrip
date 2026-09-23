import type { Measurements } from "../drafting/measurements";

export type PatternMeasurementField = keyof Measurements;

export interface PatternMeasurementDefinition {
  /** Empty only for pieces with an explicitly reviewed option-only relationship. */
  readonly fields: readonly PatternMeasurementField[];
  /** Explains an intentionally unlinked piece; missing mappings are not treated as this case. */
  readonly noMeasurementReason?: string;
}

const linked = (...fields: PatternMeasurementField[]): PatternMeasurementDefinition => ({ fields });
const optionOnly = (reason: string): PatternMeasurementDefinition => ({ fields: [], noMeasurementReason: reason });

const teeFrontBack = linked("chest", "shoulderWidth", "length", "armholeDepth", "ease");
const teeSleeve = linked("chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease");
const lowerPanel = linked("waist", "hip", "hipDepth", "length", "ease");
const trouserLeg = linked("waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease");

/**
 * Reviewed Slice 197 candidate links, keyed by stable recipe id and drafted
 * piece name. These are measurement dependencies under default design options;
 * option-only pieces deliberately carry a reason instead of a false field link.
 */
export const PATTERN_MEASUREMENT_MAP: Readonly<Record<string, Readonly<Record<string, PatternMeasurementDefinition>>>> = {
  tee: {
    front: teeFrontBack,
    back: teeFrontBack,
    sleeve: teeSleeve,
  },
  fitted: {
    "fitted front": teeFrontBack,
    back: teeFrontBack,
    sleeve: teeSleeve,
  },
  tank: {
    front: linked("chest", "length", "armholeDepth", "strapWidth", "neckDrop", "neckWidthEase", "ease"),
    back: linked("chest", "length", "armholeDepth", "strapWidth", "neckWidthEase", "ease"),
  },
  polo: {
    front: teeFrontBack,
    back: teeFrontBack,
    sleeve: teeSleeve,
    "button placket": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "buttonhole placket": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "outer collar stand": linked("chest"),
    "inner collar stand": linked("chest"),
    "upper pointed collar": linked("chest"),
    "under pointed collar": linked("chest"),
  },
  "woven-shirt": {
    "woven front": linked("neck", "chest", "shoulderWidth", "waist", "hip", "hipDepth", "length", "armholeDepth", "ease"),
    "woven back lower": linked("chest", "shoulderWidth", "waist", "hip", "hipDepth", "length", "armholeDepth", "ease"),
    "woven back yoke": linked("neck", "chest", "shoulderWidth", "armholeDepth", "ease"),
    "woven patch pocket": optionOnly("This block is controlled by Pocket options, not body measurements."),
    "outer woven stand": linked("neck"),
    "inner woven stand": linked("neck"),
    "upper pointed woven collar": linked("neck"),
    "under pointed woven collar": linked("neck"),
    "woven button placket": linked("neck", "length"),
    "woven buttonhole placket": linked("neck", "length"),
    "woven short sleeve": linked("chest", "shoulderWidth", "bicep", "armholeDepth", "sleeveLength", "ease"),
    "woven folded sleeve band": linked("bicep", "ease"),
  },
  skirt: {
    front: lowerPanel,
    back: lowerPanel,
    waistband: linked("waist", "ease"),
  },
  trouser: {
    "trouser front left": trouserLeg,
    "trouser front right": trouserLeg,
    "trouser back left": trouserLeg,
    "trouser back right": trouserLeg,
    "trouser waistband": linked("waist", "ease"),
    "trouser fly shield": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "trouser pocket bag left": linked("waist", "ease"),
    "trouser pocket bag right": linked("waist", "ease"),
  },
};

/** Undefined means the inventory is missing this piece; it is not an option-only mapping. */
export function patternMeasurementDefinition(
  garment: string,
  pieceName: string,
): PatternMeasurementDefinition | undefined {
  return PATTERN_MEASUREMENT_MAP[garment]?.[pieceName.trim().toLowerCase()];
}
