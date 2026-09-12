import { Measurements } from "./measurements";
import { GarmentOption } from "./options";

/**
 * Slice 86's stable construction contract for the first woven shirt.
 *
 * Body measurements describe the person. Recipe options describe the chosen
 * construction. Keeping those namespaces separate means changing a placket
 * or collar cannot unexpectedly alter the person's measurement set.
 */
export const WOVEN_SHIRT_FIELDS = [
  "neck", "chest", "shoulderWidth", "bicep", "length", "armholeDepth",
  "sleeveLength", "waist", "hip", "hipDepth", "ease",
] as const satisfies readonly (keyof Measurements)[];

export interface WovenShirtOptions {
  /** Added to the measured neck circumference before quartering the neckline. */
  readonly neckEase: number;
  /** Number of evenly spaced buttons on the front placket; excludes stand button. */
  readonly buttonCount: number;
  /** Finished centre-to-centre distance between adjacent front buttons. */
  readonly buttonSpacing: number;
  /** Finished distance from cut centre front to the front closure line. */
  readonly frontOverlap: number;
  readonly placketWidth: number;
  /** Finished stand depth from neckline seam to collar-fold edge. */
  readonly standHeight: number;
  /** Finished collar leaf depth from stand seam to collar point. */
  readonly collarLeafDepth: number;
  readonly yokeDepth: number;
  readonly pocketWidth: number;
  readonly pocketHeight: number;
  readonly sleeveBandDepth: number;
  readonly sideVentDepth: number;
  readonly hemTurn: number;
}

/** Recipe controls exposed in the first woven-shirt UI. Ranges are advisory
 * guardrails, not a permission to clamp live input. */
export const WOVEN_SHIRT_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "neckEase", label: "Neck ease", defaultValue: 1, min: 0, max: 3, step: 0.5 },
  { id: "buttonCount", label: "Front placket buttons", defaultValue: 7, min: 6, max: 7, step: 1 },
  { id: "buttonSpacing", label: "Front button spacing", defaultValue: 8, min: 6, max: 9, step: 0.5 },
  { id: "frontOverlap", label: "Front overlap", defaultValue: 1.5, min: 1, max: 3, step: 0.5 },
  { id: "placketWidth", label: "Finished placket width", defaultValue: 3, min: 2, max: 4, step: 0.5 },
  { id: "standHeight", label: "Finished stand height", defaultValue: 2.5, min: 1.5, max: 3.5, step: 0.5 },
  { id: "collarLeafDepth", label: "Finished collar leaf depth", defaultValue: 6, min: 4, max: 8, step: 0.5 },
  { id: "yokeDepth", label: "Back yoke depth", defaultValue: 10, min: 7, max: 15, step: 0.5 },
  { id: "pocketWidth", label: "Patch pocket width", defaultValue: 12, min: 9, max: 16, step: 0.5 },
  { id: "pocketHeight", label: "Patch pocket height", defaultValue: 13, min: 10, max: 18, step: 0.5 },
  { id: "sleeveBandDepth", label: "Finished sleeve band depth", defaultValue: 3, min: 2, max: 5, step: 0.5 },
  { id: "sideVentDepth", label: "Side vent depth", defaultValue: 3, min: 0, max: 8, step: 0.5 },
  { id: "hemTurn", label: "Hem turn", defaultValue: 1, min: 0.7, max: 2, step: 0.1 },
];

export const DEFAULT_WOVEN_SHIRT_OPTIONS: WovenShirtOptions = Object.fromEntries(
  WOVEN_SHIRT_OPTION_DEFINITIONS.map((definition) => [definition.id, definition.defaultValue])
) as unknown as WovenShirtOptions;

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Preserve finite live values verbatim; the future shirt guidance owns range
 * and combination warnings so a user can see and fix an invalid design. */
export function resolveWovenShirtOptions(values: Partial<WovenShirtOptions> = {}): WovenShirtOptions {
  return Object.fromEntries(WOVEN_SHIRT_OPTION_DEFINITIONS.map((definition) => [
    definition.id,
    finiteOr(values[definition.id as keyof WovenShirtOptions], definition.defaultValue),
  ])) as unknown as WovenShirtOptions;
}

export interface WovenShirtPhysicalRole {
  readonly id: string;
  readonly label: string;
  readonly quantity: number;
  readonly onFold: boolean;
}

/** Physical quantities are explicit now so BOM, nesting and export cannot
 * later collapse a layer into an ambiguous "cut two" note. Totals 16. */
export const WOVEN_SHIRT_PHYSICAL_ROLES: readonly WovenShirtPhysicalRole[] = [
  { id: "front", label: "Front", quantity: 2, onFold: false },
  { id: "back", label: "Back lower", quantity: 1, onFold: true },
  { id: "yoke", label: "Back yoke", quantity: 2, onFold: true },
  { id: "sleeve", label: "Short sleeve", quantity: 2, onFold: false },
  { id: "sleeveBand", label: "Folded sleeve band", quantity: 2, onFold: false },
  { id: "buttonPlacket", label: "Button placket", quantity: 1, onFold: false },
  { id: "buttonholePlacket", label: "Buttonhole placket", quantity: 1, onFold: false },
  { id: "upperCollar", label: "Upper collar", quantity: 1, onFold: true },
  { id: "underCollar", label: "Under collar", quantity: 1, onFold: true },
  { id: "outerStand", label: "Outer collar stand", quantity: 1, onFold: true },
  { id: "innerStand", label: "Inner collar stand", quantity: 1, onFold: true },
  { id: "pocket", label: "Patch pocket", quantity: 1, onFold: false },
];

export const WOVEN_SHIRT_STAND_BUTTON = "one additional button on the collar stand" as const;
