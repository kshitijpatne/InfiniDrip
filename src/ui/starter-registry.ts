import type { TeeConstruction } from "../drafting/tshirt";
import {
  FITTED_CAP_SLEEVE_ENTRY_ID,
  FITTED_PRINCESS_ENTRY_ID,
  FITTED_SCOOP_ENTRY_ID,
  FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID,
  FITTED_VNECK_ENTRY_ID,
} from "../drafting/fitted";
import {
  TANK_RACERBACK_BACK_CUT_IN_OPTION,
  TANK_RACERBACK_ENTRY_ID,
  TANK_N04_ENTRY_ID,
  TANK_N05_ENTRY_ID,
  TANK_N06_ENTRY_ID,
  TANK_SQUARE_NECK_CORNER_RADIUS_OPTION,
} from "../drafting/tank";

export interface StarterControl {
  readonly fieldId: string;
  readonly label: string;
  readonly kind: "measurement" | "option" | "design";
  readonly unit: "cm" | "%";
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number | null;
}

export interface StarterEntry {
  readonly entryId: string;
  readonly entryRevision: string;
  readonly recipeId: string;
  /** Optional topology discriminator for Tee construction variants within the stable Tee root. */
  readonly teeConstruction?: TeeConstruction;
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

const TEE_VNECK_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-vneck-digital-v1",
  entryRevision: "2026-10-21.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee V-neck · software defaults",
  configuration: {
    targetStyle: "Classic tee",
    measurements: { ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements },
    options: { ...TEE_CLASSIC_BLANK_ENTRY.configuration.options, teeVNeckDropCm: 5 },
  },
  supportedControls: [
    ...TEE_CLASSIC_BLANK_ENTRY.supportedControls,
    { fieldId: "teeVNeckDropCm", label: "Front V-neck drop", kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured V-neck, short-sleeve Tee draft; editable before saving.",
    fit: "Starts from 7 cm ease and a 5 cm added front drop; both are editable software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses existing Tee body and sleeve topology with digital V-front geometry. The V-neck finish and band construction are unresolved; sewing is not validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease and 5 cm added front drop are product choices, not fit, fabric, or wearer recommendations.",
    "The V-neck band geometry, output, and construction are unresolved; this candidate remains outside the 56 digitally complete count until digital acceptance.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_SCOOP_BLANK_ENTRY: StarterEntry = {
  entryId: "tee-scoop-digital-v1",
  entryRevision: "2026-10-21.1",
  recipeId: "tee",
  recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
  catalogKind: "blank",
  label: "Tee Scoop-neck · software defaults",
  configuration: {
    targetStyle: "Classic tee",
    measurements: { ...TEE_CLASSIC_BLANK_ENTRY.configuration.measurements },
    options: { ...TEE_CLASSIC_BLANK_ENTRY.configuration.options, teeScoopNeckDropCm: 5 },
  },
  supportedControls: [
    ...TEE_CLASSIC_BLANK_ENTRY.supportedControls,
    { fieldId: "teeScoopNeckDropCm", label: "Front Scoop extra depth", kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured rounded Scoop-neck, short-sleeve Tee draft; editable before saving.",
    fit: "Starts from 7 cm ease and a 5 cm added front depth; both are editable software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses existing Tee body and sleeve topology with a rounded front scoop. The selected-size band is the existing provisional rectangle derived from the active neckline seamline; sewing and physical fit are not validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The modeled geometry and POM values are digital outputs, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease and 5 cm added front depth are product choices, not fit, fabric, or wearer recommendations.",
    "The selected-size neckband template is provisional; fabric stretch/recovery and physical construction have not been validated.",
    "No physical-fit, comfort, wear, material-performance, validated-grading, supplier, manufacturing, or production claim.",
    "Existing generic Tee size-run and export behavior is not a validated size profile or starter-specific grading contract.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TEE_RAGLAN_BLANK_ENTRY: StarterEntry = {
  ...TEE_CLASSIC_BLANK_ENTRY,
  entryId: "tee-raglan-digital-v1",
  entryRevision: "2026-10-22.1",
  recipeRevision: "raglan-tee-v1",
  teeConstruction: "raglan",
  label: "Tee Raglan · software defaults",
  intent: {
    ...TEE_CLASSIC_BLANK_ENTRY.intent,
    use: "Preconfigured crew-neck, short-sleeve Raglan Tee draft; editable before saving.",
    fit: "Crew-neck Raglan construction; 7 cm ease and all dimensions are software choices, not validated fit targets.",
    construction: "Uses a distinct digital Raglan body and sleeve topology with paired raglan seam-length construction, notches, and a crew neckline. No sewn garment or physical fit has been validated.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile. Generic Tee grading remains software output until separately validated for this construction.",
  },
  limits: [
    "STANDARD_M contributes software starting values only; it is not a population-derived or validated size-M profile.",
    "The body, sleeve, POM, notch, and seam-length outputs are digital construction data, not sewn measurements or physical-fit evidence.",
    "The 7 cm ease and all dimensions are product-software choices, not fit, fabric, or wearer recommendations.",
    "The generic Tee grade rule is reused as a software starting point; this starter's graded-size behavior has not been independently validated.",
    "No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: "fitted-tee-digital-v1",
  entryRevision: "2026-10-22.1",
  recipeId: "fitted",
  recipeRevision: "fitted-bust-dart-v1",
  catalogKind: "blank",
  label: "Fitted crew Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
  },
  supportedControls: [
    ...TEE_CLASSIC_BLANK_ENTRY.supportedControls.filter((control) => control.fieldId !== "chestEase"),
    { fieldId: "dartIntake", label: "Bust dart intake", kind: "option", unit: "cm", min: 0.5, max: 8, step: 0.5, defaultValue: 4 },
    { fieldId: "bustApexHorizontal", label: "Bust apex across half-front", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 55 },
    { fieldId: "bustApexVertical", label: "Bust apex from underarm to hem", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 28 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured bust-darted fitted crew Tee draft; editable before saving.",
    fit: "Fitted construction label; 7 cm ease and dart controls are software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Fitted recipe with one retained bust dart. The dart-closed side and level-hem reference is a digital construction check, not a sewn-garment simulation.",
    sizeScope: "One software-default profile based on the existing T01 measurement contract; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven measurements and three dart controls are editable software defaults, not sourced fit or population standards.",
    "The open cut pattern retains one bust dart; the closed-reference side and hem checks do not predict sewn fit.",
    "Generic Tee grading is software output and has not been independently validated for this Fitted starter.",
    "No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_WAIST_DART_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: "fitted-waist-dart-tee-digital-v1",
  entryRevision: "2026-10-22.1",
  recipeId: "fitted",
  recipeRevision: "fitted-waist-dart-v1",
  catalogKind: "blank",
  label: "Waist-darted fitted Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: {
      dartIntake: 4,
      bustApexHorizontal: 55,
      bustApexVertical: 28,
      waistDartWaistlineFromHps: 43,
      waistDartIntake: 2,
      waistDartLength: 10,
      waistDartPosition: 45,
    },
  },
  supportedControls: [
    ...FITTED_TEE_BLANK_ENTRY.supportedControls,
    { fieldId: "waistDartWaistlineFromHps", label: "Waistline depth from HPS", kind: "option", unit: "cm", min: 30, max: 60, step: 1, defaultValue: 43 },
    { fieldId: "waistDartIntake", label: "Waist dart intake", kind: "option", unit: "cm", min: 0.5, max: 6, step: 0.5, defaultValue: 2 },
    { fieldId: "waistDartLength", label: "Waist dart length", kind: "option", unit: "cm", min: 4, max: 18, step: 1, defaultValue: 10 },
    { fieldId: "waistDartPosition", label: "Waist dart across half-front", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 45 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured waist-darted fitted crew Tee draft; editable before saving.",
    fit: "Fitted construction label; 7 cm ease and all bust/waist-dart values are software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Fitted recipe, bust dart and shared Tee back/sleeve, with a new front waist dart represented by internal construction marks. The app does not simulate sewn take-up or predict physical fit.",
    sizeScope: "One software-default profile seeded from the existing F01 measurement vector; not a population chart, validated size-M profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven body measurements and seven dart controls are editable software defaults or geometry guardrails, not sourced fit or population standards.",
    "Waistline depth is an internal pattern coordinate from HPS, not a body-waist measurement; the waist circumference does not locate it vertically.",
    "The internal waist-dart marks describe construction intent; they do not simulate fabric take-up, sewn shape, or fit.",
    "Generic Tee grading is software output and has not been independently validated for this Fitted construction.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_PRINCESS_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: FITTED_PRINCESS_ENTRY_ID,
  entryRevision: "2026-10-23.1",
  recipeId: "fitted",
  recipeRevision: "fitted-princess-seam-v1",
  catalogKind: "blank",
  label: "Princess-seam fitted Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: {
      princessSeamShaping: 2,
      princessApexHorizontal: 55,
      princessApexVertical: 28,
      princessShoulderOrigin: 60,
    },
  },
  supportedControls: [
    ...FITTED_TEE_BLANK_ENTRY.supportedControls.filter((control) =>
      !["dartIntake", "bustApexHorizontal", "bustApexVertical"].includes(control.fieldId)),
    { fieldId: "princessSeamShaping", label: "Princess-seam shaping offset", kind: "option", unit: "cm", min: 0, max: 6, step: 0.5, defaultValue: 2 },
    { fieldId: "princessApexHorizontal", label: "Seam apex across half-front", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 55 },
    { fieldId: "princessApexVertical", label: "Seam apex from underarm to hem", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 28 },
    { fieldId: "princessShoulderOrigin", label: "Seam start across shoulder", kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 60 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured princess-seam fitted crew Tee draft; editable before saving.",
    fit: "Fitted construction label; 7 cm ease and princess-seam controls are software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses a center-front piece on fold and two mirrored side-front pieces joined by a shoulder-origin princess seam. The digital seam is not a simulation of sewn fit or physical behavior.",
    sizeScope: "One software-default profile seeded from the existing Fitted measurement vector; not a population chart or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven measurements and four princess-seam controls are editable software values, not sourced fit, anatomical, or population standards.",
    "The side-front pattern is one mirrored-pair geometry; the marker estimates one copy unless a quantity-aware output says otherwise.",
    "The generic Tee grade rule is software output and has not been independently validated for this Fitted construction.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_VNECK_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: FITTED_VNECK_ENTRY_ID,
  entryRevision: "2026-10-23.1",
  recipeId: "fitted",
  recipeRevision: "fitted-v-neck-v1",
  catalogKind: "blank",
  label: "Fitted V-neck Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, teeVNeckDropCm: 5 },
  },
  supportedControls: [
    ...FITTED_TEE_BLANK_ENTRY.supportedControls,
    { fieldId: "teeVNeckDropCm", label: "Front V-neck drop", kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured fitted, bust-darted V-neck Tee draft; editable before saving.",
    fit: "The Fitted label and all measurements, dart controls, V-drop and band settings are software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Fitted bust-dart front and shared back/sleeve with an entry-scoped straight V neckline. The selected-size V-band join is a digital construction choice, not sewn-fit or material evidence.",
    sizeScope: "One software-default profile based on the existing F01 measurement contract; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven measurements, three bust-dart values and 5 cm V drop are editable software defaults or geometry controls, not sourced fit or population standards.",
    "The V-band SVG and matching Tech Pack are selected-size digital outputs; graded V-band output is not supplied.",
    "The 75% band-length setting and 2 cm finished width are software choices, not material or recovery recommendations.",
    "Generic Tee grading remains software output and has not been independently validated for this Fitted V-neck starter.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_SCOOP_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: FITTED_SCOOP_ENTRY_ID,
  entryRevision: "2026-10-23.1",
  recipeId: "fitted",
  recipeRevision: "fitted-scoop-v1",
  catalogKind: "blank",
  label: "Fitted Scoop-neck Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, teeScoopNeckDropCm: 5 },
  },
  supportedControls: [
    ...FITTED_TEE_BLANK_ENTRY.supportedControls,
    { fieldId: "teeScoopNeckDropCm", label: "Front Scoop extra depth", kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured fitted, bust-darted Scoop-neck Tee draft; editable before saving.",
    fit: "The Fitted label and all measurements, dart controls, Scoop depth and band settings are software defaults, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Fitted bust-dart front and shared back/sleeve with an entry-scoped rounded Scoop neckline. The selected-size rectangle band is a digital construction choice, not sewn-fit or material evidence.",
    sizeScope: "One software-default profile based on the existing F01 measurement contract; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven measurements, three bust-dart values and 5 cm Scoop depth are editable software defaults or geometry controls, not sourced fit or population standards.",
    "The rectangle neckband SVG and matching Tech Pack are selected-size digital outputs; graded neckband output is not supplied.",
    "The 75% band-length setting and 2 cm finished width are software choices, not material or recovery recommendations.",
    "Generic Tee grading remains software output and has not been independently validated for this Fitted Scoop-neck starter.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

export const FITTED_CAP_SLEEVE_LENGTH_LABEL = "Sleeve length below modeled cap base";
export const FITTED_SLEEVE_LENGTH_BELOW_CAP_BASE_LABEL = FITTED_CAP_SLEEVE_LENGTH_LABEL;

const FITTED_CAP_SLEEVE_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: FITTED_CAP_SLEEVE_ENTRY_ID,
  entryRevision: "2026-10-24.1",
  recipeId: "fitted",
  recipeRevision: "fitted-cap-sleeve-v1",
  catalogKind: "blank",
  label: "Fitted Cap-Sleeve Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 8, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, capSleeveUnderarmTrimCm: 0.6 },
  },
  supportedControls: [
    ...FITTED_TEE_BLANK_ENTRY.supportedControls.map((control) => control.fieldId === "sleeveLength"
      ? { ...control, label: FITTED_CAP_SLEEVE_LENGTH_LABEL, min: 8, max: 10, step: 1, defaultValue: 8 }
      : control),
    { fieldId: "capSleeveUnderarmTrimCm", label: "Underarm taper per side", kind: "option", unit: "cm", min: 0, max: 1.5, step: 0.1, defaultValue: 0.6 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured fitted cap-sleeve Tee draft; measurements and underarm taper remain editable.",
    fit: "Fitted construction label and all dimensions are software choices, not validated fit targets.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Keeps the Fitted bust-dart front, shared back, and set-in sleeve cap solved to the actual assembled armhole. The sleeve-length input is the distance below the modeled cap base; the separate sleeve-length POM includes cap height. The F06-only underarm taper changes the sleeve sides toward the hem. This is digital construction geometry, not sewn fit.",
    sizeScope: "One software-default profile based on the existing Fitted measurement vector; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven body measurements, three bust-dart controls, 8 cm sleeve-length default and underarm taper are software values, not sourced fit or population standards.",
    "Sleeve length is measured in this draft from the solved cap base to the hem; the sleeve-length POM includes the modeled cap height.",
    "The F06 taper is a digital side-shape control; it does not establish sleeve fit, comfort, mobility, or wearability.",
    "Generic Tee grading is software output and has not been independently validated for this Fitted construction.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_THREE_QUARTER_SLEEVE_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID,
  entryRevision: "2026-10-24.1",
  recipeId: "fitted",
  recipeRevision: "fitted-three-quarter-sleeve-v1",
  catalogKind: "blank",
  label: "Fitted Three-Quarter-Sleeve Tee · software defaults",
  configuration: {
    targetStyle: "Fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 38, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
  },
  supportedControls: FITTED_TEE_BLANK_ENTRY.supportedControls.map((control) => control.fieldId === "sleeveLength"
    ? { ...control, label: FITTED_SLEEVE_LENGTH_BELOW_CAP_BASE_LABEL, min: 34, max: 44, step: 1, defaultValue: 38 }
    : control),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured fitted three-quarter-sleeve Tee draft; measurements and bust-dart controls remain editable.",
    fit: "Fitted and three-quarter-sleeve are style labels; 7 cm ease and 38 cm below-cap-base sleeve length are software choices, not validated fit targets or anatomical guarantees.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Keeps the Fitted bust-dart front, shared back, and set-in sleeve cap solved to the actual assembled armhole. Sleeve length is measured below the modeled cap base; the separate sleeve-length POM includes cap height. The three-quarter label identifies a digital style profile and does not guarantee an elbow-to-wrist endpoint. This is digital construction geometry, not sewn fit.",
    sizeScope: "One software-default profile based on the existing Fitted measurement vector; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven body measurements, three bust-dart controls, 38 cm sleeve-length default and 34–44 cm sleeve range are software choices, not sourced fit or population standards.",
    "The three-quarter style label does not locate the wearer's elbow or wrist; the profile has no wearer arm-length or elbow/wrist inputs and does not guarantee an anatomical endpoint.",
    "Sleeve length is measured in this draft below the solved cap base; the sleeve-length POM also includes modeled cap height.",
    "Generic Tee grading is software output and has not been independently validated for this Fitted construction.",
    "B1 technical-design review is pending. No physical-fit, comfort, mobility, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const FITTED_CROPPED_TEE_BLANK_ENTRY: StarterEntry = {
  entryId: "fitted-cropped-tee-digital-v1",
  entryRevision: "2026-10-24.1",
  recipeId: "fitted",
  recipeRevision: "fitted-cropped-v1",
  catalogKind: "blank",
  label: "Cropped fitted Tee · software defaults",
  configuration: {
    targetStyle: "Cropped fitted tee",
    measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
    options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
  },
  supportedControls: FITTED_TEE_BLANK_ENTRY.supportedControls.map((control) => control.fieldId === "length"
    ? { ...control, min: 40, max: 57, step: 1, defaultValue: 53 }
    : control),
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured cropped fitted bust-dart Tee draft; measurements and bust-dart controls remain editable.",
    fit: "Cropped fitted is a digital style label; 7 cm ease and 53 cm body length are software defaults, not validated fit targets or a physical crop landmark.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Fitted recipe with one retained bust dart and shared back and set-in sleeves. The F01 dart-closed side and level-hem reference remains a digital construction check, not a sewn-garment simulation.",
    sizeScope: "One software-default profile based on the existing F01 measurement vector; not a population chart, validated size profile, or validated Fitted grade run.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The seven measurements, three bust-dart controls, 53 cm length default and 40–57 cm range are editable software values, not sourced fit, crop-landmark, or population standards.",
    "The length input is a modeled HPS-to-hem value and does not locate a physical crop endpoint on any wearer.",
    "The retained open bust dart and dart-closed side/hem checks are digital geometry, not evidence of sewn fit.",
    "Generic Tee grading is software output and has not been independently validated for this Fitted construction.",
    "B1 technical-design review is pending. No physical-fit, comfort, wear, material-performance, supplier, manufacturing, or production claim.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TANK_CLASSIC_SCOOP_BLANK_ENTRY: StarterEntry = {
  entryId: "tank-classic-scoop-digital-v1",
  entryRevision: "2026-10-24.1",
  recipeId: "tank",
  recipeRevision: "tank-classic-scoop-v1",
  catalogKind: "blank",
  label: "Classic scoop Tank · software defaults",
  configuration: {
    targetStyle: "Classic tank",
    measurements: {
      chest: 100,
      shoulderWidth: 45,
      length: 70,
      armholeDepth: 24,
      strapWidth: 8,
      neckDrop: 5,
      neckWidthEase: 0,
      ease: 10,
    },
    options: {},
  },
  supportedControls: [
    { fieldId: "chest", label: "Chest", kind: "measurement", unit: "cm", min: 60, max: 160, step: 1, defaultValue: 100 },
    { fieldId: "shoulderWidth", label: "Shoulder width (biacromial breadth)", kind: "measurement", unit: "cm", min: 30, max: 70, step: 0.1, defaultValue: 45 },
    { fieldId: "length", label: "Length", kind: "design", unit: "cm", min: 59, max: 74, step: 1, defaultValue: 70 },
    { fieldId: "armholeDepth", label: "Armhole depth", kind: "design", unit: "cm", min: 12, max: 40, step: 1, defaultValue: 24 },
    { fieldId: "strapWidth", label: "Strap width (finished)", kind: "design", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 8 },
    { fieldId: "neckDrop", label: "Neck scoop depth", kind: "design", unit: "cm", min: 0, max: 18, step: 0.5, defaultValue: 5 },
    { fieldId: "neckWidthEase", label: "Neckline width adjustment", kind: "design", unit: "cm", min: -4, max: 12, step: 0.5, defaultValue: 0 },
    { fieldId: "ease", label: "Ease", kind: "design", unit: "cm", min: 5, max: 10, step: 1, defaultValue: 10 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured Classic scoop Tank draft; all existing controls remain editable before saving.",
    fit: "Classic scoop Tank profile; the numeric values are software choices, not validated fit targets or physical standards.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tank root: two body panels, scoop front, crew back, sleeveless armholes, and shoulder and side joins. This is digital construction only; no separate strap-width POM or sewn-construction validation is provided.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile. The existing generic Tank size run is not a validated N01 grade.",
  },
  gates: { b1: "approved for digital scope", physical: "not-validated" },
  limits: [
    "STANDARD_M values are editable software starting values only; they are not population-derived or validated size-M measurements.",
    "The 8 cm strap span is a modeled design value from neckline edge to armhole start, not a sourced physical wide/narrow standard. No physical strap-width, coverage, support, comfort, or fit claim.",
    "The modeled Tank geometry and POMs are digital outputs, not sewn measurements or physical-fit evidence.",
    "The generic Tank size run and Tech Pack are not a validated size profile or grading contract for N01.",
    "Independent B1 review passes only the stated digital-design scope. Physical validation, fit, comfort, wear, material performance, supplier suitability, manufacturing, and production remain not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TANK_HIGH_NECK_BLANK_ENTRY: StarterEntry = {
  entryId: "tank-high-neck-digital-v1",
  entryRevision: "2026-10-25.1",
  recipeId: "tank",
  recipeRevision: "tank-high-round-v1",
  catalogKind: "blank",
  label: "High-neck Tank · software defaults",
  configuration: {
    targetStyle: "Classic tank",
    measurements: {
      chest: 100, shoulderWidth: 45, length: 70, armholeDepth: 24,
      strapWidth: 8, neckDrop: 0, neckWidthEase: 0, ease: 10,
    },
    options: {},
  },
  supportedControls: [
    { fieldId: "chest", label: "Chest", kind: "measurement", unit: "cm", min: 60, max: 160, step: 1, defaultValue: 100 },
    { fieldId: "shoulderWidth", label: "Shoulder width (biacromial breadth)", kind: "measurement", unit: "cm", min: 30, max: 70, step: 0.1, defaultValue: 45 },
    { fieldId: "length", label: "Length", kind: "design", unit: "cm", min: 59, max: 74, step: 1, defaultValue: 70 },
    { fieldId: "armholeDepth", label: "Armhole depth", kind: "design", unit: "cm", min: 12, max: 40, step: 1, defaultValue: 24 },
    { fieldId: "strapWidth", label: "Strap width (finished)", kind: "design", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 8 },
    { fieldId: "neckDrop", label: "Additional front neckline drop", kind: "design", unit: "cm", min: 0, max: 18, step: 0.5, defaultValue: 0 },
    { fieldId: "neckWidthEase", label: "Neckline width adjustment", kind: "design", unit: "cm", min: -4, max: 12, step: 0.5, defaultValue: 0 },
    { fieldId: "ease", label: "Ease", kind: "design", unit: "cm", min: 5, max: 10, step: 1, defaultValue: 10 },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured higher round front-neckline Tank draft relative to N01; all existing controls remain editable before saving.",
    fit: "Higher round front-neckline profile relative to N01; the numeric values are software choices, not validated fit targets or physical standards.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing Tank root: two body panels, a higher round front neckline relative to N01, crew back, sleeveless armholes, and shoulder and side joins. No built-up neck, collar, neckband, facing, zipper, or modeled stabilization is included; this is digital construction only.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile. The generic Tank size run is not a validated N02 grade.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The 0 cm additional front neckline drop and 0 cm shared width adjustment are editable InfiniDrip software choices, not sourced physical dimensions or population standards; at the same body inputs N02 is 5 cm higher at front center than N01's 5 cm default.",
    "This profile uses the existing round Tank neckline curve only. It does not provide a built-up neck, standing collar, neckband, facing, zipper, or modeled neckline stabilization.",
    "The modeled Tank geometry and POMs are digital outputs, not sewn measurements or evidence of physical fit, coverage, comfort, or wear.",
    "The generic Tank size run and Tech Pack are not a validated size profile or grading contract for N02.",
    "B1 technical-design review is pending. Physical validation, fit, comfort, wear, material performance, supplier suitability, manufacturing, and production remain not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TANK_RACERBACK_BLANK_ENTRY: StarterEntry = {
  entryId: TANK_RACERBACK_ENTRY_ID,
  entryRevision: "2026-10-25.1",
  recipeId: "tank",
  recipeRevision: "tank-racerback-v1",
  catalogKind: "blank",
  label: "Racerback Tank · software defaults",
  configuration: {
    targetStyle: "Classic tank",
    measurements: { ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.measurements },
    options: { [TANK_RACERBACK_BACK_CUT_IN_OPTION.id]: TANK_RACERBACK_BACK_CUT_IN_OPTION.defaultValue },
  },
  supportedControls: [
    ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.supportedControls,
    {
      fieldId: TANK_RACERBACK_BACK_CUT_IN_OPTION.id,
      label: TANK_RACERBACK_BACK_CUT_IN_OPTION.label,
      kind: "option",
      unit: "cm",
      min: TANK_RACERBACK_BACK_CUT_IN_OPTION.min,
      max: TANK_RACERBACK_BACK_CUT_IN_OPTION.max,
      step: TANK_RACERBACK_BACK_CUT_IN_OPTION.step,
      defaultValue: TANK_RACERBACK_BACK_CUT_IN_OPTION.defaultValue,
    },
  ],
  intent: {
    audience: "Adult digital design candidate; not a representativeness or fit claim.",
    use: "Preconfigured Racerback Tank draft with an editable back-armhole cut-in software control.",
    fit: "N01-based software profile; values are editable defaults, not validated fit targets or physical standards.",
    bodyMaterial: "No body-material compatibility claim.",
    trimMaterial: "No trim-material compatibility claim.",
    construction: "Uses the existing two-panel Tank root with a distinct inward-cut back armhole curve; no separate yoke, lining, shelf bra, elastic, hardware, or extra body piece is implied. Digital construction only.",
    sizeScope: "One software-default profile seeded from the N01 Tank values; not a population chart or validated size-M profile. The generic Tank size run is not validated grading for N03.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The 3 cm default and 0–6 cm range are InfiniDrip software choices, not sourced physical dimensions, fit targets, or sewn tolerances.",
    "Only the N03 back armhole curve changes; shoulder and underarm endpoints and the existing Tank shoulder/side joins remain fixed.",
    "The modeled geometry and POMs are digital outputs, not sewn measurements or evidence of fit, coverage, comfort, or wear.",
    "Binding consumption, N03 grading, fabric/material performance, supplier suitability, manufacturing, and production remain unvalidated.",
    "B1 technical-design review is pending. Physical validation remains not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};

const TANK_SQUARE_NECK_BLANK_ENTRY: StarterEntry = {
  ...TANK_CLASSIC_SCOOP_BLANK_ENTRY,
  entryId: TANK_N04_ENTRY_ID,
  entryRevision: "2026-10-25.1",
  recipeRevision: "tank-square-neck-v1",
  label: "Square-neck Tank · software defaults",
  configuration: {
    targetStyle: TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.targetStyle,
    measurements: { ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.measurements },
    options: {
      [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.id]: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.defaultValue,
    },
  },
  supportedControls: [
    ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.supportedControls.map((control) =>
      control.fieldId === "neckDrop" ? { ...control, label: "Front neckline drop" } : control),
    {
      fieldId: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.id,
      label: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.label,
      kind: "option",
      unit: "cm",
      min: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.min,
      max: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.max,
      step: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.step,
      defaultValue: TANK_SQUARE_NECK_CORNER_RADIUS_OPTION.defaultValue,
    },
  ],
  intent: {
    ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.intent,
    use: "Preconfigured Square-neck Tank digital shell; all shared Tank controls and the N04-only corner setting remain editable before saving.",
    fit: "Square-front digital outline profile; the editable numeric values are software choices, not validated fit targets or physical standards.",
    construction: "Uses the existing Tank root: two body panels, an editable multi-segment square front neckline, crew back, sleeveless armholes, and shoulder and side joins. The neckline finish is unspecified; no facing or binding template is included. Digital construction only.",
    sizeScope: "One software-default profile seeded from STANDARD_M; not a population chart or validated size-M profile. The generic Tank size run is not validated grading for N04.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The 0 cm default and 0–1.5 cm square-corner range are provisional InfiniDrip software values, not sourced garment standards, sewing radii, or sewn tolerances.",
    "The N04 option changes only the digital front corner; it does not specify a neckline finish, facing, binding, sewn tolerance, or construction method.",
    "The modeled Tank geometry and POMs are digital outputs, not sewn measurements or evidence of fit, coverage, comfort, or wear.",
    "Materials and consumption are unspecified. The generic Tank size run is not validated grading for N04.",
    "B1 technical-design review is pending. Physical validation, fit, comfort, wear, material performance, supplier suitability, manufacturing, and production remain not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};
const TANK_V_NECK_BLANK_ENTRY: StarterEntry = {
  ...TANK_CLASSIC_SCOOP_BLANK_ENTRY,
  entryId: TANK_N05_ENTRY_ID,
  entryRevision: "2026-10-25.1",
  recipeRevision: "tank-v-neck-v1",
  label: "V-neck Tank · software defaults",
  configuration: {
    targetStyle: TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.targetStyle,
    measurements: { ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.measurements },
    options: {},
  },
  supportedControls: TANK_CLASSIC_SCOOP_BLANK_ENTRY.supportedControls.map((control) =>
    control.fieldId === "neckDrop" ? { ...control, label: "Front neckline drop" } : control),
  intent: {
    ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.intent,
    use: "Preconfigured V-neck Tank digital shell; the existing front-drop and neckline-width controls remain editable.",
    fit: "N01-derived Tank software values with a V front; defaults are not validated fit targets or physical standards.",
    construction: "Uses the existing Tank root: two body panels, a digital V front, crew back, sleeveless armholes, and shoulder and side joins. Neckline finish is unspecified; no facing or binding template is included. Digital construction only.",
    sizeScope: "One software-default profile seeded from the N01 Tank values; not a population chart or validated size-M profile. The generic Tank size run is not validated grading for N05.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The shared N01 measurements and controls are InfiniDrip software choices, not sourced physical dimensions, fit targets, or population standards.",
    "N05 changes only the digital front neckline shape; the shared neckline-width and front-drop controls remain editable. No facing, binding template, sewn tolerance, or construction method is specified.",
    "The modeled Tank geometry and POMs are digital outputs, not sewn measurements or evidence of fit, coverage, comfort, or wear.",
    "Materials, consumption, N05-specific grading, supplier suitability, manufacturing, and production remain unvalidated.",
    "B1 technical-design review is pending. Physical validation, fit, comfort, wear, material performance, and production remain not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};
const TANK_CROPPED_BLANK_ENTRY: StarterEntry = {
  ...TANK_CLASSIC_SCOOP_BLANK_ENTRY,
  entryId: TANK_N06_ENTRY_ID,
  entryRevision: "2026-10-26.1",
  recipeRevision: "tank-cropped-v1",
  label: "Cropped Tank · software defaults",
  configuration: {
    targetStyle: "Crop tank",
    measurements: { ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.configuration.measurements, length: 53, ease: 7 },
    options: {},
  },
  supportedControls: TANK_CLASSIC_SCOOP_BLANK_ENTRY.supportedControls.map((control) =>
    control.fieldId === "length"
      ? { ...control, min: 40, max: 57, defaultValue: 53 }
      : control.fieldId === "ease"
        ? { ...control, min: 0, max: 10, defaultValue: 7 }
        : control),
  intent: {
    ...TANK_CLASSIC_SCOOP_BLANK_ENTRY.intent,
    use: "Preconfigured Cropped Tank digital shell; all existing Tank controls remain editable.",
    fit: "N01-derived software values with a 53 cm body length and 7 cm ease as explicit product defaults; not physical crop landmarks, fit targets, or standards.",
    construction: "Uses the existing Tank root: two body panels, scoop front, crew back, sleeveless armholes, and shoulder and side joins. The Crop tank style uses the existing HPS-to-hem body-length control; no physical crop landmark, neckline finish, facing, or binding is specified.",
    sizeScope: "One software-default profile seeded from N01 with N06-specific body length and ease choices; not a population chart or validated size-M profile. The generic Tank size run is not validated grading for N06.",
  },
  gates: { b1: "pending", physical: "not-validated" },
  limits: [
    "The shared N01 values and N06 body-length/ease defaults are editable software choices, not physical dimensions, fit targets, or population standards.",
    "Crop tank body length is measured in software from high-point shoulder to hem; no physical crop location, wearer reference, or intended waist/hip placement has been established.",
    "The modeled Tank geometry and POMs are digital outputs, not sewn measurements or evidence of fit, coverage, comfort, or wear.",
    "Materials, consumption, N06-specific grading, supplier suitability, manufacturing, and production remain unvalidated.",
    "B1 technical-design review is pending. Physical validation, fit, comfort, wear, material performance, and production remain not-validated.",
    "No garment artwork or aggregate survey data are included; imported artwork requires separate rights clearance.",
  ],
};
export const STARTER_REGISTRY: StarterRegistry = {
  schemaVersion: 1,
  catalogRevision: "g18-catalog-v17",
  entries: [TEE_CLASSIC_ENTRY, TEE_CLASSIC_BLANK_ENTRY, TEE_RELAXED_BLANK_ENTRY, TEE_BOXY_CROP_BLANK_ENTRY, TEE_CROP_BLANK_ENTRY, TEE_LONGLINE_BLANK_ENTRY, TEE_VNECK_BLANK_ENTRY, TEE_SCOOP_BLANK_ENTRY, TEE_RAGLAN_BLANK_ENTRY, FITTED_TEE_BLANK_ENTRY, FITTED_WAIST_DART_TEE_BLANK_ENTRY, FITTED_PRINCESS_TEE_BLANK_ENTRY, FITTED_VNECK_TEE_BLANK_ENTRY, FITTED_SCOOP_TEE_BLANK_ENTRY, FITTED_CAP_SLEEVE_TEE_BLANK_ENTRY, FITTED_THREE_QUARTER_SLEEVE_TEE_BLANK_ENTRY, FITTED_CROPPED_TEE_BLANK_ENTRY, TANK_CLASSIC_SCOOP_BLANK_ENTRY, TANK_HIGH_NECK_BLANK_ENTRY, TANK_RACERBACK_BLANK_ENTRY, TANK_SQUARE_NECK_BLANK_ENTRY, TANK_V_NECK_BLANK_ENTRY, TANK_CROPPED_BLANK_ENTRY],
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
  if (!Number.isFinite(value)) return control.label + ": enter a finite number in " + control.unit + ".";
  if (value < control.min || value > control.max) {
    return control.label + ": this candidate supports " + control.min + "–" + control.max + " " + control.unit + ".";
  }
  const stepsFromMinimum = (value - control.min) / control.step;
  if (Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) > 1e-8) {
    return control.label + ": use " + control.step + " " + control.unit + " increments from " + control.min + " " + control.unit + ".";
  }
  return null;
}
