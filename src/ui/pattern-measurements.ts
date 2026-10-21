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
const shortsLeg = linked("waist", "hip", "hipDepth", "crotchDepth", "thigh", "ease");
const joggerLeg = linked("waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease");
const jeansPanel = linked("waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease");
const jeansUpper = linked("waist", "hip", "hipDepth", "ease");

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
    waistbandfront: linked("waist", "ease"),
    waistbandback: linked("waist", "ease"),
  },
  trouser: {
    "trouser front left": trouserLeg,
    "trouser front right": trouserLeg,
    "trouser back left": trouserLeg,
    "trouser back right": trouserLeg,
    "trouser waistband": linked("waist", "ease"),
    "trouser fly shield": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "trouser fly underlap": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "trouser pocket bag left": linked("waist", "ease"),
    "trouser pocket bag right": linked("waist", "ease"),
  },
  shorts: {
    "shorts front left": shortsLeg,
    "shorts front right": shortsLeg,
    "shorts back left": shortsLeg,
    "shorts back right": shortsLeg,
    "shorts waistband": linked("waist", "ease"),
    "shorts fly shield": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "shorts fly underlap": optionOnly("This block is controlled by Front closure options, not body measurements."),
    "shorts pocket bag left": linked("waist", "ease"),
    "shorts pocket bag right": linked("waist", "ease"),
  },

  crewneck: {
    front: linked("chest", "shoulderWidth", "length", "armholeDepth", "ease", "neckDrop", "neckWidthEase"),
    back: linked("chest", "shoulderWidth", "length", "armholeDepth", "ease", "neckWidthEase"),
    "left crewneck set-in sleeve": teeSleeve,
    "right crewneck set-in sleeve": teeSleeve,
    "crewneck rib neckband": optionOnly("This band is sized by the neckbandLength and neckbandDepth options, not body measurements."),
    "left crewneck rib cuff": optionOnly("This band is sized by the cuffLength and cuffDepth options, not body measurements."),
    "right crewneck rib cuff": optionOnly("This band is sized by the cuffLength and cuffDepth options, not body measurements."),
    "crewneck rib hem band": optionOnly("This band is sized by the hemBandLength and hemBandDepth options, not body measurements."),
  },
  jogger: {
    "jogger front left": joggerLeg,
    "jogger front right": joggerLeg,
    "jogger back left": joggerLeg,
    "jogger back right": joggerLeg,
    "jogger waistband casing": linked("waist", "ease"),
    "jogger pocket bag left": linked("waist", "ease"),
    "jogger pocket bag right": linked("waist", "ease"),
  },
  jeans: {
    "jeans front left": jeansPanel,
    "jeans front right": jeansPanel,
    "jeans back yoke left": jeansUpper,
    "jeans back yoke right": jeansUpper,
    "jeans back lower left": jeansPanel,
    "jeans back lower right": jeansPanel,
    "jeans front pocket facing left": jeansUpper,
    "jeans front pocket facing right": jeansUpper,
    "jeans front pocket bag left": jeansPanel,
    "jeans front pocket bag right": jeansPanel,
    "jeans front pocket stay left": jeansPanel,
    "jeans front pocket stay right": jeansPanel,
    "jeans right coin-pocket facing extension": jeansUpper,
    "jeans coin pocket": optionOnly("This piece is sized by the coinPocketWidth and coinPocketHeight options, not body measurements."),
    "jeans back patch pocket left": jeansPanel,
    "jeans back patch pocket right": jeansPanel,
    "jeans right fly facing and underlap": linked("waist", "hip", "crotchDepth", "ease"),
    "jeans fly shield": optionOnly("This support piece is sized by the flyLength and flyExtensionWidth options, not body measurements."),
    "jeans outer waistband left": linked("waist", "ease"),
    "jeans outer waistband right": linked("waist", "ease"),
    "jeans inner waistband left": linked("waist", "ease"),
    "jeans inner waistband right": linked("waist", "ease"),
    "jeans belt-loop strip": optionOnly("This strip is sized by the beltLoopWidth option, not body measurements."),
  },
  hoodie: {
    front: teeFrontBack,
    back: teeFrontBack,
    "left hoodie set-in sleeve": teeSleeve,
    "right hoodie set-in sleeve": teeSleeve,
    "hoodie left outer hood side": linked("chest"),
    "hoodie right outer hood side": linked("chest"),
    "hoodie left lining hood side": linked("chest"),
    "hoodie right lining hood side": linked("chest"),
    "hoodie kangaroo pouch": linked("length"),
    "left hoodie rib cuff": optionOnly("This band is sized by the cuffLength and cuffDepth options, not body measurements."),
    "right hoodie rib cuff": optionOnly("This band is sized by the cuffLength and cuffDepth options, not body measurements."),
    "hoodie rib hem band": optionOnly("This band is sized by the hemBandLength and hemBandDepth options, not body measurements."),
  },
};

/** Undefined means the inventory is missing this piece; it is not an option-only mapping. */
export function patternMeasurementDefinition(
  garment: string,
  pieceName: string,
): PatternMeasurementDefinition | undefined {
  return PATTERN_MEASUREMENT_MAP[garment]?.[pieceName.trim().toLowerCase()];
}
