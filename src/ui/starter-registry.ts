export interface StarterControl {
  readonly fieldId: string;
  readonly label: string;
  readonly kind: "measurement" | "option" | "design";
  readonly unit: "cm";
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number | null;
}

export interface StarterEntry {
  readonly entryId: string;
  readonly entryRevision: string;
  readonly recipeId: string;
  readonly recipeRevision: string;
  readonly label: string;
  readonly configuration: {
    readonly targetStyle: string;
    readonly measurements: { readonly ease: number };
    readonly options: { readonly chestEase: number };
  };
  readonly supportedControls: readonly StarterControl[];
  readonly intent: {
    readonly audience: string;
    readonly use: string;
    readonly fit: string;
    readonly bodyMaterial: string;
    readonly trimMaterial: string;
    readonly construction: string;
    readonly sizeScope: string;
  };
  readonly gates: {
    readonly b1: "pending";
    readonly physical: "not-validated";
  };
  readonly limits: readonly string[];
}

export interface StarterRegistry {
  readonly schemaVersion: 1;
  readonly catalogRevision: string;
  readonly entries: readonly StarterEntry[];
}

export interface StarterOrigin {
  readonly entryId: string;
  readonly entryRevision: string;
  readonly recipeId: string;
  readonly recipeRevision: string;
  readonly configurationSnapshot: StarterEntry["configuration"];
}

const TEE_CLASSIC_ENTRY: StarterEntry = {
  entryId: "tee-classic-custom-v1",
  entryRevision: "2026-10-19.2",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  label: "Tee Classic · custom measurements",
  configuration: {
    targetStyle: "Classic tee",
    measurements: { ease: 7 },
    options: { chestEase: 7 },
  },
  supportedControls: [
    { fieldId: "chest", label: "Chest", kind: "measurement", unit: "cm", min: 60, max: 160, step: 1, defaultValue: null },
    { fieldId: "shoulderWidth", label: "Shoulder width (biacromial breadth)", kind: "measurement", unit: "cm", min: 30, max: 70, step: 0.1, defaultValue: null },
    { fieldId: "bicep", label: "Bicep", kind: "measurement", unit: "cm", min: 20, max: 60, step: 1, defaultValue: null },
    { fieldId: "length", label: "Length", kind: "design", unit: "cm", min: 59, max: 74, step: 1, defaultValue: null },
    { fieldId: "armholeDepth", label: "Armhole depth", kind: "measurement", unit: "cm", min: 12, max: 40, step: 1, defaultValue: null },
    { fieldId: "sleeveLength", label: "Sleeve length", kind: "measurement", unit: "cm", min: 8, max: 70, step: 1, defaultValue: null },
    { fieldId: "ease", label: "Ease", kind: "design", unit: "cm", min: 7, max: 12, step: 1, defaultValue: 7 },
    { fieldId: "chestEase", label: "Classic chest ease", kind: "option", unit: "cm", min: 7, max: 12, step: 0.5, defaultValue: 7 },
  ],
  intent: {
    audience: "Adult women aged 20–39 in South Korea; intended design audience, not a representativeness or fit claim.",
    use: "Custom-measurement-first casual home sewing.",
    fit: "Classic crew-neck, short-sleeve Tee; 7 cm shared and chest ease are product choices, not a validated fit target.",
    bodyMaterial: "95/5 cotton-spandex single jersey as design intent; no tested compatibility or numerical stretch/recovery requirement.",
    trimMaterial: "Matching 1×1 rib neckline as design intent; no tested compatibility claim.",
    construction: "Existing Tee draft guidance for home sewing; BOM quantities are estimates.",
    sizeScope: "One custom-size route. Length is a modeled Tee input, not a body measure or sewn POM; no landmark, grade, or tolerance is claimed.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "Body measurements are user-entered; the app does not capture or qualify measurement technique.",
    "Displayed geometry and POMs are modeled digital values, not sewn measurements or fit evidence.",
    "No fit-probability, physical-fit, material-compatibility, grading, manufacturing, supplier, or production claim.",
    "The generic material selector and stretch heuristic do not model the declared 95/5 cotton-spandex intent; 7 cm ease remains a product choice, not a fabric-derived recommendation.",
    "Exports do not carry this registry entry ID or revision; BOM material names and quantities remain generic recipe estimates.",
    "This starter selector is unavailable in the separate project custom-one-size workflow.",
    "No garment artwork or aggregate survey data are included; user-imported artwork requires separate rights clearance.",
    "Independent B1 technical review is pending; physical validation has not been performed.",
  ],
};

export const STARTER_REGISTRY: StarterRegistry = {
  schemaVersion: 1,
  catalogRevision: "g06-catalog-v2",
  entries: [TEE_CLASSIC_ENTRY],
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: RecordValue, keys: readonly string[]): boolean => {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
};

export function starterEntryById(entryId: string): StarterEntry | null {
  return STARTER_REGISTRY.entries.find((entry) => entry.entryId === entryId) ?? null;
}

export function starterOriginForEntry(entry: StarterEntry): StarterOrigin {
  return {
    entryId: entry.entryId,
    entryRevision: entry.entryRevision,
    recipeId: entry.recipeId,
    recipeRevision: entry.recipeRevision,
    configurationSnapshot: {
      targetStyle: entry.configuration.targetStyle,
      measurements: { ...entry.configuration.measurements },
      options: { ...entry.configuration.options },
    },
  };
}

const COMPATIBLE_ORIGIN_REVISIONS = [
  { entryId: "tee-classic-custom-v1", entryRevision: "2026-10-19.1" },
] as const;

export function starterOriginError(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !hasExactKeys(value, ["entryId", "entryRevision", "recipeId", "recipeRevision", "configurationSnapshot"])) {
    return "Saved starter origin is malformed.";
  }
  if (typeof value.entryId !== "string" || value.entryId.trim() === "") return "Saved starter origin has no entry ID.";
  const entry = starterEntryById(value.entryId);
  if (!entry) return "The saved starter entry is unavailable; open a compatible app version or explicitly migrate this design.";
  const snapshot = value.configurationSnapshot;
  const validSnapshot = isRecord(snapshot)
    && hasExactKeys(snapshot, ["targetStyle", "measurements", "options"])
    && snapshot.targetStyle === entry.configuration.targetStyle
    && isRecord(snapshot.measurements)
    && hasExactKeys(snapshot.measurements, ["ease"])
    && snapshot.measurements.ease === entry.configuration.measurements.ease
    && isRecord(snapshot.options)
    && hasExactKeys(snapshot.options, ["chestEase"])
    && snapshot.options.chestEase === entry.configuration.options.chestEase;
  const revisionMatches = value.entryRevision === entry.entryRevision
    || COMPATIBLE_ORIGIN_REVISIONS.some((compatible) =>
      compatible.entryId === entry.entryId && compatible.entryRevision === value.entryRevision);
  if (!revisionMatches || value.recipeId !== entry.recipeId || value.recipeRevision !== entry.recipeRevision
    || !validSnapshot) {
    return "The saved starter revision is unavailable or its configuration snapshot changed; migrate the design explicitly.";
  }
  return null;
}

export function starterControlError(entryId: string | null, fieldId: string, value: number): string | null {
  if (!entryId) return null;
  const entry = starterEntryById(entryId);
  if (!entry) return "The selected starter is unavailable; choose a supported design candidate.";
  const control = entry.supportedControls.find((item) => item.fieldId === fieldId);
  if (!control) return null;
  if (!Number.isFinite(value)) return control.label + ": enter a finite number in cm.";
  if (value < control.min || value > control.max) {
    return control.label + ": this candidate supports " + control.min + "–" + control.max + " cm.";
  }
  const stepsFromMinimum = (value - control.min) / control.step;
  if (Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) > 1e-8) {
    return control.label + ": use " + control.step + " cm increments from " + control.min + " cm.";
  }
  return null;
}
