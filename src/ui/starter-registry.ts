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
  readonly catalogKind: "blank" | "custom-measurement";
  readonly label: string;
  readonly configuration: {
    readonly targetStyle: string;
    readonly measurements: Readonly<Record<string, number>>;
    readonly options: Readonly<Record<string, number>>;
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
    readonly b1: "pending" | "approved for digital scope";
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
  entryRevision: "2026-10-19.3",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "custom-measurement",
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
    sizeScope: "One custom-measurement draft only. The Tech Pack maps modeled length to HPS-to-hem; its Tol columns are generic recipe references, not validated tolerances for this starter.",
  },
  gates: { b1: "approved for digital scope", physical: "not-validated" },
  limits: [
    "Body measurements are user-entered; the app does not capture or qualify measurement technique.",
    "Displayed geometry and POMs are modeled digital values, not sewn measurements or fit evidence.",
    "No fit-probability, physical-fit, material-compatibility, starter-specific grading, manufacturing, supplier, or production claim.",
    "The generic material selector and stretch heuristic do not model the declared 95/5 cotton-spandex intent; 7 cm ease remains a product choice, not a fabric-derived recommendation.",
    "Exports do not carry this registry entry ID or revision; BOM material names and quantities remain generic recipe estimates.",
    "Tech Pack size labels (such as M) and XS–XL graded outputs use the generic Tee recipe size run; they are not starter-specific size or grade guidance. Only the one custom-measurement draft is in scope.",
    "This starter selector is unavailable in the separate project custom-one-size workflow.",
    "No garment artwork or aggregate survey data are included; user-imported artwork requires separate rights clearance.",
    "Independent B1 review approves this limited digital scope; physical validation has not been performed.",
  ],
};

const TEE_CLASSIC_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-classic-digital-v1",
  entryRevision: "2026-10-20.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Classic · software defaults",
  configuration: {
    targetStyle: "Classic tee",
    measurements: {
      chest: 100,
      shoulderWidth: 45,
      bicep: 38,
      length: 70,
      armholeDepth: 24,
      sleeveLength: 22,
      ease: 7,
    },
    options: { chestEase: 7 },
  },
  supportedControls: [
    { fieldId: "chest", label: "Chest", kind: "measurement", unit: "cm", min: 60, max: 160, step: 1, defaultValue: 100 },
    { fieldId: "shoulderWidth", label: "Shoulder width (biacromial breadth)", kind: "measurement", unit: "cm", min: 30, max: 70, step: 0.1, defaultValue: 45 },
    { fieldId: "bicep", label: "Bicep", kind: "measurement", unit: "cm", min: 20, max: 60, step: 1, defaultValue: 38 },
    { fieldId: "length", label: "Length", kind: "design", unit: "cm", min: 59, max: 74, step: 1, defaultValue: 70 },
    { fieldId: "armholeDepth", label: "Armhole depth", kind: "measurement", unit: "cm", min: 12, max: 40, step: 1, defaultValue: 24 },
    { fieldId: "sleeveLength", label: "Sleeve length", kind: "measurement", unit: "cm", min: 8, max: 70, step: 1, defaultValue: 22 },
    { fieldId: "ease", label: "Ease", kind: "design", unit: "cm", min: 7, max: 12, step: 1, defaultValue: 7 },
    { fieldId: "chestEase", label: "Classic chest ease", kind: "option", unit: "cm", min: 7, max: 12, step: 0.5, defaultValue: 7 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured home-sewing Tee draft; editable before saving.",
    fit: "Classic crew-neck, short-sleeve Tee; software defaults and 7 cm ease are product choices, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tee draft logic as a digital starting point; sewn construction has not been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease values are product choices, not fit, fabric, or wearer recommendations.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_RELAXED_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-relaxed-digital-v1",
  entryRevision: "2026-10-20.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Relaxed · software defaults",
  configuration: {
    targetStyle: "Relaxed tee",
    measurements: { ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements, ease: 13 },
    options: {},
  },
  supportedControls: TEE_CLASSIC_BLANK_ENTRY.supportedControls
    .filter((control) => control.fieldId !== "chestEase")
    .map((control) => control.fieldId === "ease"
      ? { ...control, min: 13, max: 18, defaultValue: 13 }
      : control),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured relaxed crew-neck, short-sleeve Tee draft; editable before saving.",
    fit: "Relaxed crew-neck, short-sleeve Tee; 13 cm ease is a software choice, not a validated fit target.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tee draft logic as a digital starting point; sewn construction has not been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 13 cm ease is a product choice at the lower bound of the code-defined Relaxed tee style range, not a fit, fabric, or wearer recommendation.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_BOXY_CROP_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-boxy-crop-digital-v1",
  entryRevision: "2026-10-20.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Boxy Crop · software defaults",
  configuration: {
    targetStyle: "Boxy crop",
    measurements: {
      ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements,
      length: 54,
      ease: 17,
    },
    options: {},
  },
  supportedControls: TEE_CLASSIC_BLANK_ENTRY.supportedControls
    .filter((control) => control.fieldId !== "chestEase")
    .map((control) => {
      if (control.fieldId === "ease") return { ...control, min: 13, max: 30, defaultValue: 17 };
      if (control.fieldId === "length") return { ...control, min: 40, max: 57, defaultValue: 54 };
      return control;
    }),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured Boxy crop Tee draft; editable before saving.",
    fit: "Boxy crop configuration; 17 cm ease and 54 cm length are software choices, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tee topology and standard shoulder/sleeve attachment; drop-shoulder geometry is not implemented and sewn construction has not been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 17 cm ease and 54 cm length are product choices, not fit, fabric, or wearer recommendations.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_CROP_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-cropped-digital-v1",
  entryRevision: "2026-10-20.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Crop · software defaults",
  configuration: {
    targetStyle: "Crop tee",
    measurements: {
      ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements,
      length: 53,
      ease: 7,
    },
    options: {},
  },
  supportedControls: TEE_CLASSIC_BLANK_ENTRY.supportedControls
    .filter((control) => control.fieldId !== "chestEase")
    .map((control) => {
      if (control.fieldId === "ease") return { ...control, min: 0, max: 12, defaultValue: 7 };
      if (control.fieldId === "length") return { ...control, min: 40, max: 57, defaultValue: 53 };
      return control;
    }),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured Crop tee draft; editable before saving.",
    fit: "Cropped crew-neck, short-sleeve Tee configuration; 7 cm ease and 53 cm length are software choices, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tee draft logic and pattern topology as a digital starting point; sewn construction has not been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease and 53 cm length are product choices, not fit, fabric, or wearer recommendations.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_LONGLINE_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-longline-digital-v1",
  entryRevision: "2026-10-21.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Longline · software defaults",
  configuration: {
    targetStyle: "Longline tee",
    measurements: {
      ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements,
      length: 80,
      ease: 7,
    },
    options: {},
  },
  supportedControls: TEE_CLASSIC_BLANK_ENTRY.supportedControls
    .filter((control) => control.fieldId !== "chestEase")
    .map((control) => {
      if (control.fieldId === "ease") return { ...control, min: 7, max: 18, defaultValue: 7 };
      if (control.fieldId === "length") return { ...control, min: 78, max: 100, defaultValue: 80 };
      return control;
    }),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured Longline crew-neck, short-sleeve Tee draft; editable before saving.",
    fit: "Longline crew-neck, short-sleeve Tee; 7 cm ease and 80 cm length are software choices, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tee draft logic and pattern topology as a digital starting point; sewn construction has not been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile. The Tech Pack maps modeled length to HPS-to-hem; Tol ± values are generic Tee recipe references, not validated tolerances for this starter.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease and 80 cm length are product choices, not fit, fabric, or wearer recommendations.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

export const STARTER_REGISTRY: StarterRegistry = {
  schemaVersion: 1,
  catalogRevision: "g18-catalog-v1",
  entries: [TEE_CLASSIC_ENTRY, TEE_CLASSIC_BLANK_ENTRY, TEE_RELAXED_BLANK_ENTRY, TEE_BOXY_CROP_BLANK_ENTRY, TEE_CROP_BLANK_ENTRY, TEE_LONGLINE_BLANK_ENTRY],
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: RecordValue, keys: readonly string[]): boolean => {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
};

function matchesNumericRecord(value: unknown, expected: Readonly<Record<string, number>>): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.keys(expected);
  return hasExactKeys(value, keys)
    && keys.every((key) => value[key] === expected[key]);
}

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
  { entryId: "tee-classic-custom-v1", entryRevision: "2026-10-19.2" },
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
    && matchesNumericRecord(snapshot.measurements, entry.configuration.measurements)
    && matchesNumericRecord(snapshot.options, entry.configuration.options);
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
