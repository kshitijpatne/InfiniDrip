// Garment options are design choices, not body measurements. Recipes own their
// schema; persistence keeps raw values by recipe id and later restores them
// against that schema. This prevents collar/placket preferences leaking into
// the global Measurements object.

export interface GarmentOption {
  readonly id: string;
  readonly label: string;
  /** Unit shown beside the numeric control; omitted for unitless choices. */
  readonly unit?: string;
  /** Short explanation of the feature affected and the correction path. */
  readonly help?: string;
  /** Construction area used to group related controls in the UI. */
  readonly group?: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export type GarmentOptions = Readonly<Record<string, number>>;
export type GarmentOptionsByRecipe = Readonly<Record<string, GarmentOptions>>;

export const EMPTY_GARMENT_OPTIONS: GarmentOptions = {};

/** Defaults are recipe data, so a future recipe never relies on UI state. */
export function defaultGarmentOptions(definitions: readonly GarmentOption[]): GarmentOptions {
  return Object.fromEntries(definitions.map((d) => [d.id, d.defaultValue]));
}

/**
 * Restores persisted numeric values only when they fit a recipe's declared
 * range. This is load validation, not live-input clamping: future UI guidance
 * may show an invalid current design rather than silently changing it.
 */
export function restoreGarmentOptions(
  definitions: readonly GarmentOption[], saved: unknown
): GarmentOptions {
  const raw = typeof saved === "object" && saved !== null
    ? saved as Record<string, unknown>
    : {};
  return Object.fromEntries(definitions.map((d) => {
    const value = raw[d.id];
    return [d.id, typeof value === "number" && Number.isFinite(value) &&
      value >= d.min && value <= d.max ? value : d.defaultValue];
  }));
}
