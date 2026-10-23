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
  /** Optional controls are absent until explicitly set; a fallback measurement may supply the inactive value. */
  readonly optional?: boolean;
  /** Measurement inherited while an optional control is unset. */
  readonly fallbackMeasurement?: keyof import("./measurements").Measurements;
  /** Style that activates this control; its saved value remains dormant otherwise. */
  readonly appliesToStyle?: string;
  /** Starter entry that activates this control; its saved value remains dormant otherwise. */
  readonly appliesToStarterEntryId?: string;
  /** Starter entries where this control is not part of the design contract. */
  readonly excludedForStarterEntryIds?: readonly string[];
  /** Optional-control copy for features whose inactive state is not an inherited measurement. */
  readonly optionalSetLabel?: string;
  readonly optionalResetLabel?: string;
  /** Status copy supports {value} and {unit} placeholders. */
  readonly optionalSetStatus?: string;
  readonly optionalUnsetStatus?: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export type GarmentOptions = Readonly<Record<string, number>>;
export type GarmentOptionsByRecipe = Readonly<Record<string, GarmentOptions>>;

export const EMPTY_GARMENT_OPTIONS: GarmentOptions = {};

/** Shared entry applicability for controls, drafting defaults and output validation. */
export function optionAppliesToStarterEntry(option: GarmentOption, starterEntryId?: string): boolean {
  const explicitlyMatches = option.appliesToStarterEntryId === undefined
    || option.appliesToStarterEntryId === starterEntryId;
  const excluded = starterEntryId !== undefined
    && option.excludedForStarterEntryIds?.includes(starterEntryId) === true;
  return explicitlyMatches && !excluded;
}

export function optionalOptionStatusMessage(
  option: GarmentOption,
  explicit: boolean,
  value: number | string,
): string {
  const template = explicit ? option.optionalSetStatus : option.optionalUnsetStatus;
  if (template !== undefined) {
    return template.split("{value}").join(String(value))
      .split("{unit}").join(option.unit ?? "cm");
  }
  if (explicit && option.fallbackMeasurement) {
    return "Independent value: " + String(value) + " " + (option.unit ?? "cm") + ".";
  }
  if (explicit) {
    return "Independent value: " + String(value) + " " + (option.unit ?? "cm") + ".";
  }
  if (option.fallbackMeasurement) {
    return "Inherited from shared fit allowance: " + String(value) + " cm.";
  }
  return option.label + " is inactive. Set a value to enable it.";
}

export function optionalOptionActionLabel(option: GarmentOption, explicit: boolean): string {
  if (explicit) return option.optionalResetLabel ?? "Use shared fit allowance";
  return option.optionalSetLabel ?? "Set independent value";
}

/** Defaults are recipe data, so a future recipe never relies on UI state. */
export function defaultGarmentOptions(
  definitions: readonly GarmentOption[],
  starterEntryId?: string,
): GarmentOptions {
  return Object.fromEntries(definitions.filter((d) => !d.optional
    && optionAppliesToStarterEntry(d, starterEntryId))
    .map((d) => [d.id, d.defaultValue]));
}

/** Defaults and saved values that are active for one selected recipe style. */
export function garmentOptionsForStyle(
  definitions: readonly GarmentOption[],
  saved: GarmentOptions,
  style: string,
  includeDefaults = true,
  starterEntryId?: string,
): GarmentOptions {
  const applicable = definitions.filter((definition) =>
    (definition.appliesToStyle === undefined || definition.appliesToStyle === style)
      && optionAppliesToStarterEntry(definition, starterEntryId));
  const options: Record<string, number> = includeDefaults ? { ...defaultGarmentOptions(applicable, starterEntryId) } : {};
  for (const definition of applicable) {
    if (Object.prototype.hasOwnProperty.call(saved, definition.id)) {
      options[definition.id] = saved[definition.id]!;
    }
  }
  return options;
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
  return Object.fromEntries(definitions.flatMap((d) => {
    const value = raw[d.id];
    if (d.optional) {
      if (!Object.prototype.hasOwnProperty.call(raw, d.id)) return [];
      // Preserve an explicitly saved invalid optional value so the UI can show
      // actionable correction guidance instead of silently choosing a value.
      return [[d.id, typeof value === "number" ? value : Number.NaN]];
    }
    return [[d.id, typeof value === "number" && Number.isFinite(value) &&
      value >= d.min && value <= d.max ? value : d.defaultValue]];
  }));
}
