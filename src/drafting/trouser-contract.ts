import { Measurements } from "./measurements";
import { GarmentOption } from "./options";

/** The shared lower-body measurements exposed by the first trouser recipe.
 * `length` is intentionally not included: it keeps its existing upper-body
 * meaning, while `inseam` is a finished trouser control. */
export const TROUSER_FIELDS = [
  "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
] as const satisfies readonly (keyof Measurements)[];

export interface TrouserOptions {
  readonly frontRiseEase: number;
  readonly backRiseEase: number;
  readonly waistbandDepth: number;
  readonly thighEase: number;
  readonly kneeEase: number;
  readonly legOpening: number;
  readonly flyLength: number;
  readonly pocketOpening: number;
  readonly pocketAngle: number;
  readonly pocketBagDepth: number;
  readonly pocketDrop: number;
}

/** V1 construction dimensions. Ranges are visible guardrails; live controls
 * retain an invalid value and let guidance explain how to correct it. */
export const TROUSER_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "frontRiseEase", label: "Front rise ease", unit: "cm", group: "Rise & waistband", help: "Adds to the sitting crotch depth for the finished front rise; reduce it if the front rise is too long.", defaultValue: 1, min: -2, max: 8, step: 0.5 },
  { id: "backRiseEase", label: "Back rise ease", unit: "cm", group: "Rise & waistband", help: "Adds to the sitting crotch depth for the finished back rise; keep it greater than the front rise for seat room.", defaultValue: 9, min: 2, max: 14, step: 0.5 },
  { id: "waistbandDepth", label: "Waistband depth", unit: "cm", group: "Rise & waistband", help: "Sets the separate finished waistband height; keep it below each finished rise.", defaultValue: 4, min: 2, max: 8, step: 0.5 },
  { id: "thighEase", label: "Thigh ease", unit: "cm", group: "Leg fit", help: "Adds finished room at the upper thigh only; it is separate from waist/seat ease.", defaultValue: 8, min: 0, max: 20, step: 0.5 },
  { id: "kneeEase", label: "Knee ease", unit: "cm", group: "Leg fit", help: "Adds finished room at the knee; adjust it if the straight-leg transition is not coherent.", defaultValue: 5, min: 0, max: 15, step: 0.5 },
  { id: "legOpening", label: "Leg opening", unit: "cm", group: "Leg fit", help: "Sets the finished straight-leg opening circumference; keep it near the finished knee circumference.", defaultValue: 40, min: 25, max: 65, step: 0.5 },
  { id: "flyLength", label: "Fly length", unit: "cm", group: "Front closure", help: "Sets the front fly length; shorten it if it reaches beyond the front rise after the waistband.", defaultValue: 15, min: 8, max: 25, step: 0.5 },
  { id: "pocketOpening", label: "Pocket opening", unit: "cm", group: "Pocket", help: "Sets each angled front pocket opening; shorten it if it leaves the front panel.", defaultValue: 16, min: 8, max: 25, step: 0.5 },
  { id: "pocketAngle", label: "Pocket angle", unit: "°", group: "Pocket", help: "Sets the opening angle down from the side waist; reduce it if the opening approaches the front rise or centre front.", defaultValue: 58, min: 35, max: 70, step: 1 },
  { id: "pocketBagDepth", label: "Pocket bag depth", unit: "cm", group: "Pocket", help: "Sets the pocket bag depth; reduce it if the bag reaches the hem or knee region.", defaultValue: 23, min: 12, max: 35, step: 0.5 },
  { id: "pocketDrop", label: "Pocket drop", unit: "cm", group: "Pocket", help: "Moves the pocket opening below the waistband; keep the opening inside the front panel.", defaultValue: 2, min: 0, max: 15, step: 0.5 },
];

export const DEFAULT_TROUSER_OPTIONS: TrouserOptions = Object.fromEntries(
  TROUSER_OPTION_DEFINITIONS.map((definition) => [definition.id, definition.defaultValue])
) as unknown as TrouserOptions;

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Preserve finite work-in-progress option values verbatim. Range guidance is
 * deliberately separate so an invalid combination remains visible. */
export function resolveTrouserOptions(values: Partial<TrouserOptions> = {}): TrouserOptions {
  return Object.fromEntries(TROUSER_OPTION_DEFINITIONS.map((definition) => [
    definition.id,
    finiteOr(values[definition.id as keyof TrouserOptions], definition.defaultValue),
  ])) as unknown as TrouserOptions;
}
