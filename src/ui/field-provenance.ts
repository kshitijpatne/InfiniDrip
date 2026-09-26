/** C03-aligned definitions and append-only value observations for current recipe inputs. */
import { GARMENTS, STANDARD_M, type GarmentRecipe } from "../drafting";
import { FIELDS } from "./controls";
import type { RecoveryPayload, SavedDesign, StyleRecord } from "./project-records";

export const FIELD_DEFINITION_VERSION = 1;
export const FIELD_OBSERVATION_RECORD_VERSION = 1;
export const FIELD_OBSERVATION_MAX_ENTRIES = 100_000;

export type FieldSemanticKind =
  | "BODY_MEASURE"
  | "GARMENT_MEASURE"
  | "FINISHED_POM"
  | "PATTERN_PARAMETER"
  | "STYLE_CONTROL";
export type FieldProvenance =
  | "USER_CAPTURED"
  | "USER_SELECTED"
  | "PRESET"
  | "INHERITED"
  | "CALCULATED"
  | "SUPPLIER"
  | "SAMPLE_ACTUAL"
  | "IMAGE_OBSERVED"
  | "UNRESOLVED";
export type FieldEvidenceStatus = "UNCONFIRMED" | "USER_CONFIRMED" | "SOURCE_CONFIRMED" | "SAMPLE_MEASURED" | "CONFLICT";
export type FieldValidationStatus = "VALID" | "INVALID";
export type FieldInputKind = "measurement" | "option";

export interface FieldInputReference {
  readonly recipeId: string;
  readonly inputKind: FieldInputKind;
  readonly inputKey: string;
}

export interface FieldDefinition {
  readonly id: string;
  readonly semanticId: string;
  readonly recipeId: string;
  readonly inputKind: FieldInputKind;
  readonly inputKey: string;
  readonly label: string;
  readonly semanticKind: FieldSemanticKind;
  readonly unit: string;
  readonly referenceFrame: "body" | "finished-garment" | "pattern" | "design-control";
  readonly meaning: string;
  readonly captureBoundary: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number;
  readonly limitBasis: "existing-ui-guardrail-not-industry-standard";
}

export interface FieldObservation {
  readonly revision: number;
  readonly definitionVersion: typeof FIELD_DEFINITION_VERSION;
  readonly fieldId: string;
  readonly semanticId: string;
  readonly recipeId: string;
  readonly inputKey: string;
  readonly rawValue: string;
  readonly canonicalValue: number | null;
  readonly unit: string;
  readonly semanticKind: FieldSemanticKind;
  readonly provenance: FieldProvenance;
  readonly evidenceStatus: FieldEvidenceStatus;
  readonly validationStatus: FieldValidationStatus;
  readonly sourceLabel: string;
  /** The edit date, not a body-capture date, unless a future capture guide records that separately. */
  readonly recordedAt: string | null;
  readonly styleRevision: number;
  readonly confidence: "NOT_ASSESSED";
}

export interface FieldObservationRecord {
  readonly schemaVersion: typeof FIELD_OBSERVATION_RECORD_VERSION;
  readonly definitionVersion: typeof FIELD_DEFINITION_VERSION;
  readonly styleId: string;
  /** Monotonic append sequence; old observations are never edited or removed. */
  readonly revision: number;
  readonly updatedAt: string;
  readonly observations: readonly FieldObservation[];
}

export type InitialObservationOrigin =
  | "first-run-default"
  | "legacy-save"
  | "existing-local-style"
  | "package-v1"
  | "copied-style";

interface MeasurementSpec {
  readonly id: string;
  readonly kind: FieldSemanticKind;
  readonly frame: FieldDefinition["referenceFrame"];
  readonly meaning: string;
  readonly captureBoundary: string;
  readonly label?: string;
}

const MEASUREMENT_SPECS: Readonly<Partial<Record<string, MeasurementSpec>>> = Object.freeze({
  neck: {
    id: "body.neck-base-girth", kind: "BODY_MEASURE", frame: "body",
    meaning: "Neck-base girth input used by the woven-shirt neckline calculation.",
    captureBoundary: "Exact neck-base path and head posture are not reviewed. Keep user supplied and unconfirmed; never infer this from chest or appearance.",
  },
  chest: {
    id: "body.chest-girth", kind: "BODY_MEASURE", frame: "body",
    meaning: "Full wearer chest/bust girth used by the current recipe; the recipe's chest-derived neckline remains a calculation.",
    captureBoundary: "The chest/bust path is not defined by an accepted guide. Preserve the user-entered value as unconfirmed; a girth does not describe torso shape or prove fit.",
  },
  shoulderWidth: {
    id: "body.shoulder-breadth", kind: "BODY_MEASURE", frame: "body",
    meaning: "Left-to-right shoulder-point breadth consumed as a straight horizontal pattern span.",
    captureBoundary: "Endpoint localization and repeatability are not qualified. The current straight span is not a surface-following tape path.",
  },
  bicep: {
    id: "body.upper-arm-girth", kind: "BODY_MEASURE", frame: "body",
    meaning: "Upper-arm girth input used by sleeved recipes.",
    captureBoundary: "The body station, side, and posture are not specified by the current block. Do not present the resulting sleeve as fit validated.",
  },
  length: {
    id: "target.top-hps-to-hem", kind: "GARMENT_MEASURE", frame: "finished-garment",
    meaning: "User-selected finished top length from high-point shoulder to hem.",
    captureBoundary: "This is a finished target, not body stature. Preserve the selected start/end landmarks and do not infer it from a preset.",
  },
  armholeDepth: {
    id: "pattern.target-underarm-drop", kind: "PATTERN_PARAMETER", frame: "pattern",
    meaning: "Pattern distance from the HPS origin to the drafted underarm station.",
    captureBoundary: "This is a user-selected pattern target, not a body HPS-to-underarm measurement. A body transform is not accepted.",
    label: "Target underarm drop",
  },
  sleeveLength: {
    id: "target.sleeve-cap-to-hem", kind: "GARMENT_MEASURE", frame: "finished-garment",
    meaning: "Desired finished sleeve length from cap top to sleeve hem.",
    captureBoundary: "This is a finished garment target, not a wearer arm path.",
    label: "Sleeve length (cap to hem target)",
  },
  waist: {
    id: "body.girth-at-wear-line", kind: "BODY_MEASURE", frame: "body",
    meaning: "Girth at the user's selected garment wear line.",
    captureBoundary: "The intended waistline and capture path are not independently reviewed. Natural waist and a lower garment's worn line are not interchangeable.",
  },
  hip: {
    id: "body.girth-at-selected-seat-level", kind: "BODY_MEASURE", frame: "body",
    meaning: "Girth at a user-selected hip/seat level.",
    captureBoundary: "The level and path are method dependent and not qualified. One girth does not encode front/back body shape.",
  },
  hipDepth: {
    id: "body.wear-line-to-hip-level", kind: "BODY_MEASURE", frame: "body",
    meaning: "Vertical distance between the selected wear line and the same hip level used for hip girth.",
    captureBoundary: "The two reference levels and vertical method need review. A draft POM is not a body observation.",
  },
  crotchDepth: {
    id: "body.seated-waist-to-seat-depth", kind: "BODY_MEASURE", frame: "body",
    meaning: "Seated waist-to-seat depth used by the current trouser draft.",
    captureBoundary: "The seated posture and waistband reference are not qualified; one scalar does not establish front/back rise or fit.",
  },
  thigh: {
    id: "target.finished-thigh-girth", kind: "GARMENT_MEASURE", frame: "finished-garment",
    meaning: "Exploratory finished thigh-girth target at the current pattern station.",
    captureBoundary: "The current pattern station is a fixed offset without a reviewed anatomical mapping; this is not a body-thigh capture.",
    label: "Target finished thigh girth",
  },
  knee: {
    id: "target.finished-knee-girth", kind: "GARMENT_MEASURE", frame: "finished-garment",
    meaning: "Exploratory finished knee-girth target at the current pattern station.",
    captureBoundary: "The current pattern station is a 52%-of-inseam heuristic without a reviewed anatomical mapping; this is not a body-knee capture.",
    label: "Target finished knee girth",
  },
  inseam: {
    id: "target.trouser-finished-inseam", kind: "GARMENT_MEASURE", frame: "finished-garment",
    meaning: "Desired finished crotch-seam-to-hem length.",
    captureBoundary: "This is a finished garment target, not a wearer body inseam or outseam.",
    label: "Inseam (finished seam target)",
  },
  ease: {
    id: "style.shared-ease", kind: "STYLE_CONTROL", frame: "design-control",
    meaning: "One shared recipe control currently applied to different regions and ratios by different recipes.",
    captureBoundary: "This scalar is a digital design control, not a body measure or a validated ease standard; review the affected regions and material choice.",
  },
  strapWidth: {
    id: "style.tank-strap-width", kind: "STYLE_CONTROL", frame: "design-control",
    meaning: "Tank design span from neckline edge to armhole start.",
    captureBoundary: "Finished design control; the current tank tech pack has no independent strap-width POM.",
  },
  neckDrop: {
    id: "style.tank-neck-drop", kind: "STYLE_CONTROL", frame: "design-control",
    meaning: "Additional front tank neckline depth beyond the chest-derived baseline.",
    captureBoundary: "A user design choice, not a body measurement or sourced default.",
  },
  neckWidthEase: {
    id: "style.tank-neck-width-per-side", kind: "STYLE_CONTROL", frame: "design-control",
    meaning: "Per-side neckline width adjustment applied to front and back.",
    captureBoundary: "This is a per-side design control, not a neck girth.",
  },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVENANCE = new Set<FieldProvenance>([
  "USER_CAPTURED", "USER_SELECTED", "PRESET", "INHERITED", "CALCULATED", "SUPPLIER",
  "SAMPLE_ACTUAL", "IMAGE_OBSERVED", "UNRESOLVED",
]);
const EVIDENCE = new Set<FieldEvidenceStatus>(["UNCONFIRMED", "USER_CONFIRMED", "SOURCE_CONFIRMED", "SAMPLE_MEASURED", "CONFLICT"]);
const SEMANTIC_KINDS = new Set<FieldSemanticKind>(["BODY_MEASURE", "GARMENT_MEASURE", "FINISHED_POM", "PATTERN_PARAMETER", "STYLE_CONTROL"]);
const definitionsByRecipe = new Map<string, readonly FieldDefinition[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value;
}

function currentValue(design: SavedDesign, definition: FieldDefinition): number {
  if (definition.inputKind === "measurement") {
    return design.measurements[definition.inputKey as keyof SavedDesign["measurements"]];
  }
  const current = design.garmentOptions[definition.recipeId]?.[definition.inputKey];
  return typeof current === "number" && Number.isFinite(current) ? current : definition.defaultValue;
}

function validationStatus(definition: FieldDefinition, rawValue: string, value: number | null): FieldValidationStatus {
  return value !== null && Number.isFinite(value) && value >= definition.min && value <= definition.max
    && rawValue.trim() !== "" && Number.isFinite(Number(rawValue))
    ? "VALID" : "INVALID";
}

function sourceLabel(origin: InitialObservationOrigin): string {
  switch (origin) {
    case "first-run-default": return "Built-in digital starting value; not a user measurement or fit validation.";
    case "legacy-save": return "Imported legacy SaveFile; the original value source and capture method were not recorded.";
    case "existing-local-style": return "Existing local style predates field provenance; the original value source and capture method were not recorded.";
    case "package-v1": return "Imported package version 1 did not record field provenance, source, or capture date.";
    case "copied-style": return "Inherited from another local style; the inherited value is not independently captured or fit validated.";
  }
}

function initialProvenance(origin: InitialObservationOrigin): FieldProvenance {
  if (origin === "first-run-default") return "PRESET";
  if (origin === "copied-style") return "INHERITED";
  return "UNRESOLVED";
}

function makeObservation(
  definition: FieldDefinition,
  revision: number,
  rawValue: string,
  canonicalValue: number | null,
  provenance: FieldProvenance,
  sourceText: string,
  recordedAt: string | null,
  styleRevision: number,
  evidenceStatus: FieldEvidenceStatus = "UNCONFIRMED",
): FieldObservation {
  return {
    revision,
    definitionVersion: FIELD_DEFINITION_VERSION,
    fieldId: definition.id,
    semanticId: definition.semanticId,
    recipeId: definition.recipeId,
    inputKey: definition.inputKey,
    rawValue,
    canonicalValue,
    unit: definition.unit,
    semanticKind: definition.semanticKind,
    provenance,
    evidenceStatus,
    validationStatus: validationStatus(definition, rawValue, canonicalValue),
    sourceLabel: sourceText,
    recordedAt,
    styleRevision,
    confidence: "NOT_ASSESSED",
  };
}

function observationKeys(value: Record<string, unknown>): boolean {
  const keys = ["revision", "definitionVersion", "fieldId", "semanticId", "recipeId", "inputKey", "rawValue", "canonicalValue", "unit", "semanticKind", "provenance", "evidenceStatus", "validationStatus", "sourceLabel", "recordedAt", "styleRevision", "confidence"];
  return Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

export function getFieldDefinitions(recipeId: string): readonly FieldDefinition[] {
  const cached = definitionsByRecipe.get(recipeId);
  if (cached) return cached;
  const recipe = GARMENTS.find((item) => item.name === recipeId);
  if (!recipe) return [];
  const definitions: FieldDefinition[] = [];
  for (const inputKey of recipe.fields) {
    const control = FIELDS.find((field) => field.id === inputKey);
    const spec = MEASUREMENT_SPECS[inputKey];
    if (!control || !spec) continue;
    const semanticId = inputKey === "length" && recipe.name === "skirt"
      ? "target.skirt-waistline-to-hem"
      : spec.id;
    const meaning = inputKey === "length" && recipe.name === "skirt"
      ? "User-selected finished skirt length from the intended waistline to hem."
      : spec.meaning;
    const captureBoundary = inputKey === "length" && recipe.name === "skirt"
      ? "This is a finished target, not body stature. The existing shared UI range conflicts with the Maxi label range; current guardrails are not industry standards."
      : spec.captureBoundary;
    definitions.push({
      id: semanticId,
      semanticId,
      recipeId: recipe.name,
      inputKind: "measurement",
      inputKey,
      label: spec.label ?? control.label,
      semanticKind: spec.kind,
      unit: "cm",
      referenceFrame: spec.frame,
      meaning,
      captureBoundary,
      min: control.min,
      max: control.max,
      step: control.step,
      defaultValue: STANDARD_M[inputKey as keyof typeof STANDARD_M],
      limitBasis: "existing-ui-guardrail-not-industry-standard",
    });
  }
  for (const option of recipe.options ?? []) {
    const slug = option.id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    definitions.push({
      id: `style.${recipe.name}.${slug}`,
      semanticId: `style.${recipe.name}.${slug}`,
      recipeId: recipe.name,
      inputKind: "option",
      inputKey: option.id,
      label: option.label,
      semanticKind: "STYLE_CONTROL",
      unit: option.unit ?? "cm",
      referenceFrame: "design-control",
      meaning: option.help ?? `${option.label} construction/design choice owned by the ${recipe.label} recipe.`,
      captureBoundary: "This is a user-editable digital construction choice. Its range is an existing UI guardrail, not a sewing tolerance or industry standard.",
      min: option.min,
      max: option.max,
      step: option.step,
      defaultValue: option.defaultValue,
      limitBasis: "existing-ui-guardrail-not-industry-standard",
    });
  }
  const result = Object.freeze(definitions.map((definition) => Object.freeze(definition)));
  definitionsByRecipe.set(recipeId, result);
  return result;
}

export function getAllFieldDefinitions(): readonly FieldDefinition[] {
  return GARMENTS.flatMap((recipe) => getFieldDefinitions(recipe.name));
}

export function getFieldDefinition(recipeId: string, inputKey: string, inputKind?: FieldInputKind): FieldDefinition | undefined {
  return getFieldDefinitions(recipeId).find((definition) => definition.inputKey === inputKey
    && (inputKind === undefined || definition.inputKind === inputKind));
}

export function createFieldObservationRecord(
  style: StyleRecord,
  recordedAt: string,
  origin: InitialObservationOrigin,
): FieldObservationRecord {
  if (!validTimestamp(recordedAt)) throw new Error("Field observation timestamp must be canonical UTC ISO time.");
  const observations = getFieldDefinitions(style.recipeId).map((definition, index) => {
    const value = currentValue(style.design, definition);
    const raw = String(value);
    return makeObservation(definition, index + 1, raw, value, initialProvenance(origin), sourceLabel(origin),
      origin === "first-run-default" ? recordedAt : null, style.revision);
  });
  return {
    schemaVersion: FIELD_OBSERVATION_RECORD_VERSION,
    definitionVersion: FIELD_DEFINITION_VERSION,
    styleId: style.id,
    revision: observations.length,
    updatedAt: recordedAt,
    observations,
  };
}

export function parseFieldObservationRecord(value: unknown): { readonly ok: true; readonly value: FieldObservationRecord } | { readonly ok: false; readonly error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!isRecord(value)) return fail("Field observation record must be an object.");
  const recordKeys = ["schemaVersion", "definitionVersion", "styleId", "revision", "updatedAt", "observations"];
  if (Object.keys(value).length !== recordKeys.length || !recordKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))) {
    return fail("Field observation record fields are incomplete or unknown.");
  }
  if (value.schemaVersion !== FIELD_OBSERVATION_RECORD_VERSION || value.definitionVersion !== FIELD_DEFINITION_VERSION) {
    return fail("Unsupported field observation or definition version.");
  }
  if (typeof value.styleId !== "string" || !UUID.test(value.styleId) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0
    || !validTimestamp(value.updatedAt) || !Array.isArray(value.observations)
    || value.observations.length > FIELD_OBSERVATION_MAX_ENTRIES) {
    return fail("Field observation record identity, revision, timestamp, or history is invalid.");
  }
  let priorRevision = 0;
  for (const entry of value.observations) {
    if (!isRecord(entry) || !observationKeys(entry)) return fail("Field observation fields are incomplete or unknown.");
    const revision = entry.revision;
    if (!Number.isSafeInteger(revision) || (revision as number) <= priorRevision || (revision as number) > (value.revision as number)) {
      return fail("Field observation revisions must be strictly increasing within the record.");
    }
    priorRevision = revision as number;
    const definition = getFieldDefinitions(String(entry.recipeId)).find((candidate) => candidate.id === entry.fieldId
      && candidate.semanticId === entry.semanticId && candidate.inputKey === entry.inputKey);
    const rawNumber = typeof entry.rawValue === "string" && entry.rawValue.trim() !== ""
      ? Number(entry.rawValue)
      : null;
    const rawCanonical = rawNumber !== null && Number.isFinite(rawNumber) ? rawNumber : null;
    if (!definition || entry.definitionVersion !== FIELD_DEFINITION_VERSION
      || entry.unit !== definition.unit || entry.semanticKind !== definition.semanticKind
      || typeof entry.rawValue !== "string" || entry.rawValue.length > 4096
      || (entry.canonicalValue !== null && (typeof entry.canonicalValue !== "number" || !Number.isFinite(entry.canonicalValue)))
      || entry.canonicalValue !== rawCanonical
      || !SEMANTIC_KINDS.has(entry.semanticKind as FieldSemanticKind)
      || !PROVENANCE.has(entry.provenance as FieldProvenance)
      || !EVIDENCE.has(entry.evidenceStatus as FieldEvidenceStatus)
      || !["VALID", "INVALID"].includes(String(entry.validationStatus))
      || typeof entry.sourceLabel !== "string" || entry.sourceLabel.length === 0 || entry.sourceLabel.length > 500
      || (entry.recordedAt !== null && !validTimestamp(entry.recordedAt))
      || !Number.isSafeInteger(entry.styleRevision) || (entry.styleRevision as number) < 1
      || entry.confidence !== "NOT_ASSESSED"
      || entry.validationStatus !== validationStatus(definition, entry.rawValue, entry.canonicalValue as number | null)) {
      return fail("Field observation value, source, semantic definition, or validation status is invalid.");
    }
  }
  if (priorRevision !== value.revision) return fail("Field observation record revision does not match its append history.");
  return { ok: true, value: value as unknown as FieldObservationRecord };
}

export function currentFieldObservation(
  record: FieldObservationRecord | undefined,
  definition: FieldDefinition,
): FieldObservation | undefined {
  if (!record) return undefined;
  for (let index = record.observations.length - 1; index >= 0; index -= 1) {
    const observation = record.observations[index];
    if (observation.fieldId === definition.id && observation.recipeId === definition.recipeId) return observation;
  }
  return undefined;
}

function recoveryRawValue(payload: RecoveryPayload, definition: FieldDefinition): { raw: string; value: number | null } {
  let raw = "";
  if (definition.inputKind === "measurement") {
    const captured = payload.rawMeasurements[definition.inputKey as keyof typeof payload.rawMeasurements];
    const stored = payload.measurements[definition.inputKey];
    raw = captured === undefined ? stored === null ? "" : String(stored) : captured;
  } else {
    const captured = payload.rawOptions[definition.recipeId]?.[definition.inputKey];
    const stored = payload.garmentOptions[definition.recipeId]?.[definition.inputKey];
    raw = captured === undefined
      ? stored === null || stored === undefined ? String(definition.defaultValue) : String(stored)
      : captured;
  }
  const number = raw.trim() === "" ? null : Number(raw);
  return { raw, value: number !== null && Number.isFinite(number) ? number : null };
}

function priorMeaningForInput(record: FieldObservationRecord, definition: FieldDefinition): FieldObservation | undefined {
  for (let index = record.observations.length - 1; index >= 0; index -= 1) {
    const observation = record.observations[index];
    if (observation.inputKey === definition.inputKey && observation.fieldId !== definition.id) return observation;
  }
  return undefined;
}

function appendOne(
  record: FieldObservationRecord,
  definition: FieldDefinition,
  rawValue: string,
  canonicalValue: number | null,
  recordedAt: string,
  styleRevision: number,
  provenance: FieldProvenance,
  source: string,
  evidenceStatus: FieldEvidenceStatus = "UNCONFIRMED",
): FieldObservationRecord {
  const revision = record.revision + 1;
  const observation = makeObservation(definition, revision, rawValue, canonicalValue, provenance, source,
    recordedAt, styleRevision, evidenceStatus);
  return {
    ...record,
    revision,
    updatedAt: recordedAt,
    observations: [...record.observations, observation],
  };
}

function provenanceForUserEdit(definition: FieldDefinition): FieldProvenance {
  return definition.semanticKind === "BODY_MEASURE" ? "USER_CAPTURED" : "USER_SELECTED";
}

export function appendRecoveryFieldObservations(
  record: FieldObservationRecord,
  style: StyleRecord,
  payload: RecoveryPayload,
  recordedAt: string,
  changedInput?: FieldInputReference,
): FieldObservationRecord {
  if (record.styleId !== style.id || !validTimestamp(recordedAt)) {
    throw new Error("Field observations must match the style and use a canonical UTC timestamp.");
  }
  if (changedInput && (changedInput.recipeId !== payload.workspace.garment
    || !getFieldDefinition(changedInput.recipeId, changedInput.inputKey, changedInput.inputKind))) {
    throw new Error("The changed input must be defined by the active recipe.");
  }
  let next = record;
  for (const definition of getFieldDefinitions(payload.workspace.garment)) {
    const { raw, value } = recoveryRawValue(payload, definition);
    const current = currentFieldObservation(next, definition);
    const directlyChanged = changedInput?.recipeId === definition.recipeId
      && changedInput.inputKind === definition.inputKind && changedInput.inputKey === definition.inputKey;
    const requestedProvenance = directlyChanged ? provenanceForUserEdit(definition) : undefined;
    if (current?.rawValue === raw && current.canonicalValue === value
      && (!requestedProvenance || current.provenance === requestedProvenance)) continue;
    const oldMeaning = current ? undefined : priorMeaningForInput(next, definition);
    if (!directlyChanged && oldMeaning) {
      next = appendOne(next, definition, raw, value, recordedAt, style.revision,
        "UNRESOLVED", "The shared legacy control value carried across recipes has a different reference meaning; review it.");
    } else if (directlyChanged) {
      next = appendOne(next, definition, raw, value, recordedAt, style.revision,
        provenanceForUserEdit(definition), "Value entered or selected in the InfiniDrip control; capture method and fit remain unassessed.");
    } else {
      next = appendOne(next, definition, raw, value, recordedAt, style.revision,
        "UNRESOLVED", "Value carried by the current design or recovery; a field-specific user edit was not recorded.");
    }
  }
  return next;
}

export function reconcileDesignFieldObservations(
  record: FieldObservationRecord,
  style: StyleRecord,
  design: SavedDesign,
  recordedAt: string,
): FieldObservationRecord {
  if (record.styleId !== style.id || !validTimestamp(recordedAt)) {
    throw new Error("Field observations must match the style and use a canonical UTC timestamp.");
  }
  let next = record;
  for (const definition of getFieldDefinitions(design.workspace.garment)) {
    const value = currentValue(design, definition);
    const current = currentFieldObservation(next, definition);
    if (current?.canonicalValue === value && current.validationStatus === "VALID") continue;
    const oldMeaning = current ? undefined : priorMeaningForInput(next, definition);
    const source = oldMeaning
      ? "The shared legacy control value carried across recipes has a different reference meaning; review it."
      : "Saved design value differs from its observation; the specific input event or source was not recorded.";
    next = appendOne(next, definition, String(value), value, recordedAt, style.revision,
      "UNRESOLVED", source);
  }
  return next;
}

export function remapFieldObservationStyleId(record: FieldObservationRecord, styleId: string): FieldObservationRecord {
  if (!UUID.test(styleId)) throw new Error("Field observation copy requires a valid style ID.");
  return { ...record, styleId };
}

export function assertRecipeFieldCoverage(recipes: readonly GarmentRecipe[] = GARMENTS): void {
  for (const recipe of recipes) {
    const definitions = getFieldDefinitions(recipe.name);
    const expectedMeasurements = recipe.fields.length;
    const expectedOptions = recipe.options?.length ?? 0;
    if (definitions.length !== expectedMeasurements + expectedOptions
      || new Set(definitions.map((definition) => `${definition.inputKind}/${definition.inputKey}`)).size !== definitions.length) {
      throw new Error(`${recipe.name} field definitions do not exactly cover its recipe inputs.`);
    }
  }
}

export function fieldDefinitionById(fieldId: string): FieldDefinition | undefined {
  return getAllFieldDefinitions().find((definition) => definition.id === fieldId);
}

export function isKnownFieldProvenance(value: unknown): value is FieldProvenance {
  return PROVENANCE.has(value as FieldProvenance);
}
