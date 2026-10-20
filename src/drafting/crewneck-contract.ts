import type { Measurements } from "./measurements";
import type { GarmentOption, GarmentOptions } from "./options";
import { defaultGarmentOptions } from "./options";
import type { StyleDef } from "../style";
import type { StretchFabric } from "./ease";

/** Existing shared fields used by the adult crewneck; no save-schema extension. */
export const CREWNECK_FIELDS = [
  "chest",
  "shoulderWidth",
  "bicep",
  "length",
  "armholeDepth",
  "sleeveLength",
  "ease",
  "neckDrop",
  "neckWidthEase",
] as const satisfies readonly (keyof Measurements)[];

/** One digital classification envelope, aligned to the current M draft only. */
export const CREWNECK_STYLES: readonly StyleDef[] = [
  { name: "Classic crewneck sweatshirt", ranges: { ease: [7, 12], length: [59, 74] } },
];

export interface CrewneckOptions {
  readonly neckbandDepth: number;
  readonly cuffDepth: number;
  readonly hemBandDepth: number;
  readonly neckbandLength: number;
  readonly cuffLength: number;
  readonly hemBandLength: number;
}

/** Bounds guide live controls; they do not judge material suitability. */
export const CREWNECK_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  {
    id: "neckbandDepth",
    label: "Finished neckband depth",
    unit: "cm",
    group: "Neckband",
    help: "Sets the folded neckband depth. Cut depth follows twice the finished depth plus two seam allowances; adjust if the neckline geometry conflicts.",
    defaultValue: 2.5,
    min: 1,
    max: 8,
    step: 0.5,
  },
  {
    id: "cuffDepth",
    label: "Finished cuff depth",
    unit: "cm",
    group: "Sleeve bands",
    help: "Sets the folded depth of each cuff. Cut depth follows twice the finished depth plus two seam allowances.",
    defaultValue: 6,
    min: 2,
    max: 15,
    step: 0.5,
  },
  {
    id: "hemBandDepth",
    label: "Finished hem-band depth",
    unit: "cm",
    group: "Hem band",
    help: "Sets the folded body hem-band depth. Cut depth follows twice the finished depth plus two seam allowances.",
    defaultValue: 6,
    min: 2,
    max: 15,
    step: 0.5,
  },
  {
    id: "neckbandLength",
    label: "Neckband finished circumference",
    unit: "cm",
    group: "Neckband",
    help: "User-owned M/base circumference. Compare the actual walked neckline and required stretch; this is math, not a material pass/fail result.",
    defaultValue: 40.5,
    min: 1,
    max: 120,
    step: 0.5,
  },
  {
    id: "cuffLength",
    label: "Each cuff finished circumference",
    unit: "cm",
    group: "Sleeve bands",
    help: "One user-owned M/base value controls both cuffs. Compare each walked sleeve opening and required stretch; no material threshold is implied.",
    defaultValue: 31.5,
    min: 1,
    max: 100,
    step: 0.5,
  },
  {
    id: "hemBandLength",
    label: "Hem-band finished circumference",
    unit: "cm",
    group: "Hem band",
    help: "User-owned M/base circumference. Compare the actual walked body hem and required stretch; this is math, not a material pass/fail result.",
    defaultValue: 93.5,
    min: 1,
    max: 200,
    step: 0.5,
  },
];

export const CREWNECK_DEFAULT_OPTIONS: GarmentOptions =
  defaultGarmentOptions(CREWNECK_OPTION_DEFINITIONS);

/** Internal context seed; public selector exposure is deferred with the UI. */
export const CREWNECK_STABLE_KNIT_DEFAULT: StretchFabric = {
  name: "Stable sweatshirt knit (10% width seed)",
  family: "knit",
  stretchPercent: 10,
};
