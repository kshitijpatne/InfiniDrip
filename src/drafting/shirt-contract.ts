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
  { id: "neckEase", label: "Neck ease", unit: "cm", group: "Neck & collar", help: "Changes the measured neck opening; reduce it if the neckline reaches the shoulder seam.", defaultValue: 1, min: 0, max: 3, step: 0.5 },
  { id: "buttonCount", label: "Front placket buttons", unit: "buttons", group: "Front closure", help: "Use 6 or 7 whole placket buttons; one additional button belongs on the collar stand.", defaultValue: 7, min: 6, max: 7, step: 1 },
  { id: "buttonSpacing", label: "Front button spacing", unit: "cm", group: "Front closure", help: "Sets adjacent button distance; reduce it if the last button is too close to the placket end.", defaultValue: 8, min: 6, max: 9, step: 0.5 },
  { id: "frontOverlap", label: "Front overlap", unit: "cm", group: "Front closure", help: "Sets the closure overlap; keep it at or below the finished placket width.", defaultValue: 1.5, min: 1, max: 3, step: 0.5 },
  { id: "placketWidth", label: "Finished placket width", unit: "cm", group: "Front closure", help: "Sets the visible closure face; increase it if the chosen overlap reaches beyond the placket.", defaultValue: 3, min: 2, max: 4, step: 0.5 },
  { id: "standHeight", label: "Finished stand height", unit: "cm", group: "Neck & collar", help: "Sets the collar stand depth; reduce it if it is deeper than the collar leaf.", defaultValue: 2.5, min: 1.5, max: 3.5, step: 0.5 },
  { id: "collarLeafDepth", label: "Finished collar leaf depth", unit: "cm", group: "Neck & collar", help: "Sets the pointed collar depth; increase it if the stand is deeper than the leaf.", defaultValue: 6, min: 4, max: 8, step: 0.5 },
  { id: "yokeDepth", label: "Back yoke depth", unit: "cm", group: "Back yoke", help: "Moves the back yoke seam; choose a depth between the shoulder and underarm.", defaultValue: 10, min: 7, max: 15, step: 0.5 },
  { id: "pocketWidth", label: "Patch pocket width", unit: "cm", group: "Pocket", help: "Sets the pocket width; keep it within the declared range for the front panel.", defaultValue: 12, min: 9, max: 16, step: 0.5 },
  { id: "pocketHeight", label: "Patch pocket height", unit: "cm", group: "Pocket", help: "Sets the pocket height; adjust it within the range if the pocket feels too tall or short.", defaultValue: 13, min: 10, max: 18, step: 0.5 },
  { id: "sleeveBandDepth", label: "Finished sleeve band depth", unit: "cm", group: "Sleeve & hem", help: "Sets the folded sleeve-band depth; adjust it within the range for the sleeve finish.", defaultValue: 3, min: 2, max: 5, step: 0.5 },
  { id: "sideVentDepth", label: "Side vent depth", unit: "cm", group: "Sleeve & hem", help: "Sets the open side vent; reduce it for a shorter opening or use zero to close it.", defaultValue: 3, min: 0, max: 8, step: 0.5 },
  { id: "hemTurn", label: "Hem turn", unit: "cm", group: "Sleeve & hem", help: "Sets the lower hem turn-under; keep it within the range to preserve the drafted finish.", defaultValue: 1, min: 0.7, max: 2, step: 0.1 },
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
