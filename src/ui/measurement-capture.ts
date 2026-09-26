/** Versioned, source-aware measurement-first session records for G03. */
import { getFieldDefinitions, type FieldDefinition, type FieldEvidenceStatus, type FieldProvenance } from "./field-provenance";

export const MEASUREMENT_CAPTURE_SCHEMA_VERSION = 1;
export const MEASUREMENT_CAPTURE_DEFINITION_VERSION = 1;
export const MEASUREMENT_CAPTURE_MAX_FIELDS = 64;
export const MEASUREMENT_CAPTURE_MAX_READINGS_PER_FIELD = 100;

export type CaptureMeasurer = "SELF" | "HELPER" | "IMPORTED" | "OTHER";
export type CaptureUnit = "cm" | "in";

export interface MeasurementCaptureReading {
  readonly id: string;
  /** The exact text the user entered. Empty and invalid text remains inspectable. */
  readonly rawValue: string;
  readonly enteredUnit: string;
  /** Canonical numeric value in the field definition's unit; null for unparseable input. */
  readonly canonicalValue: number | null;
  readonly provenance: Extract<FieldProvenance, "USER_CAPTURED" | "USER_SELECTED" | "PRESET">;
  readonly evidenceStatus: Extract<FieldEvidenceStatus, "UNCONFIRMED" | "USER_CONFIRMED" | "SOURCE_CONFIRMED" | "CONFLICT">;
  readonly sourceLabel: string;
  readonly captureMethod: string | null;
  readonly capturedAt: string | null;
  readonly measurer: CaptureMeasurer | null;
  readonly revision: number;
};

export interface MeasurementCaptureField {
  readonly fieldId: string;
  readonly semanticId: string;
  readonly inputKey: string;
  readonly inputKind: FieldDefinition["inputKind"];
  readonly semanticKind: FieldDefinition["semanticKind"];
  readonly unit: string;
  readonly readings: readonly MeasurementCaptureReading[];
  /** Null means no reading is selected; multiple readings are never averaged. */
  readonly selectedReadingId: string | null;
}

export interface MeasurementCaptureSession {
  readonly schemaVersion: typeof MEASUREMENT_CAPTURE_SCHEMA_VERSION;
  readonly definitionVersion: typeof MEASUREMENT_CAPTURE_DEFINITION_VERSION;
  readonly id: string;
  /** Null until M02 associates the guided draft with a saved G02 style. */
  readonly styleId: string | null;
  readonly recipeId: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly fields: readonly MeasurementCaptureField[];
}

export type CaptureFieldState = "missing" | "ambiguous" | "invalid" | "resolved";
export type CaptureFieldIssue = "missing" | "ambiguous" | "blank" | "not-numeric"
  | "outside-guardrail" | "conflicting-evidence" | "unsupported-field";

export interface CaptureFieldAssessment {
  readonly state: CaptureFieldState;
  readonly issue: CaptureFieldIssue | null;
  readonly correction: string | null;
}

export interface CaptureReadiness {
  readonly ready: boolean;
  readonly states: Readonly<Record<string, CaptureFieldState>>;
  readonly assessments: Readonly<Record<string, CaptureFieldAssessment>>;
  readonly unresolvedFieldIds: readonly string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAPTURE_MEASURERS = new Set<CaptureMeasurer>(["SELF", "HELPER", "IMPORTED", "OTHER"]);
const CAPTURE_UNITS = new Set<CaptureUnit>(["cm", "in"]);
const CAPTURE_PROVENANCE = new Set(["USER_CAPTURED", "USER_SELECTED", "PRESET"]);
const CAPTURE_EVIDENCE = new Set(["UNCONFIRMED", "USER_CONFIRMED", "SOURCE_CONFIRMED", "CONFLICT"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function numericValue(rawValue: string, enteredUnit: string, definition: FieldDefinition): number | null {
  if (rawValue.trim() === "") return null;
  const raw = Number(rawValue);
  if (!Number.isFinite(raw)) return null;
  if (enteredUnit === "in" && definition.unit === "cm") return raw * 2.54;
  return raw;
}

function valueIsWithinGuardrails(value: number, definition: FieldDefinition): boolean {
  return value >= definition.min && value <= definition.max;
}

function validEnteredUnit(enteredUnit: string, definition: FieldDefinition): boolean {
  if (enteredUnit === definition.unit) return true;
  return definition.unit === "cm" && CAPTURE_UNITS.has(enteredUnit as CaptureUnit);
}

function fieldFor(session: MeasurementCaptureSession, fieldId: string): MeasurementCaptureField | undefined {
  return session.fields.find((field) => field.fieldId === fieldId);
}

function bump(session: MeasurementCaptureSession, now: string, fields: readonly MeasurementCaptureField[]): MeasurementCaptureSession {
  if (!validTimestamp(now) || Date.parse(now) < Date.parse(session.updatedAt)) {
    throw new Error("Measurement capture update time must be canonical and monotonic.");
  }
  return { ...session, revision: session.revision + 1, updatedAt: now, fields };
}

export function createMeasurementCaptureSession(
  id: string,
  recipeId: string,
  createdAt: string,
  styleId: string | null = null,
): MeasurementCaptureSession {
  if (!UUID.test(id)) throw new Error("Measurement capture session ID must be a UUID.");
  if (styleId !== null && !UUID.test(styleId)) throw new Error("Measurement capture style ID must be a UUID or null.");
  if (!validTimestamp(createdAt)) throw new Error("Measurement capture timestamp must be canonical UTC time.");
  const definitions = getFieldDefinitions(recipeId);
  if (definitions.length === 0) throw new Error("Measurement capture requires a supported recipe.");
  return {
    schemaVersion: MEASUREMENT_CAPTURE_SCHEMA_VERSION,
    definitionVersion: MEASUREMENT_CAPTURE_DEFINITION_VERSION,
    id,
    styleId,
    recipeId,
    revision: 0,
    createdAt,
    updatedAt: createdAt,
    fields: definitions.map((definition) => ({
      fieldId: definition.id,
      semanticId: definition.semanticId,
      inputKey: definition.inputKey,
      inputKind: definition.inputKind,
      semanticKind: definition.semanticKind,
      unit: definition.unit,
      readings: [],
      selectedReadingId: null,
    })),
  };
}

export type NewCaptureReading = Omit<MeasurementCaptureReading, "canonicalValue" | "revision">;

export function addCaptureReadingForField(
  session: MeasurementCaptureSession,
  fieldId: string,
  input: NewCaptureReading,
  now: string,
): MeasurementCaptureSession {
  if (!UUID.test(input.id)) throw new Error("Measurement capture reading ID must be a UUID.");
  if (typeof input.rawValue !== "string" || input.rawValue.length > 4096) throw new Error("Measurement capture raw value is invalid.");
  if (typeof input.sourceLabel !== "string" || input.sourceLabel.trim() === "" || input.sourceLabel.length > 500) {
    throw new Error("Measurement capture source label is required.");
  }
  if (!CAPTURE_PROVENANCE.has(input.provenance) || !CAPTURE_EVIDENCE.has(input.evidenceStatus)) {
    throw new Error("Measurement capture provenance or evidence status is invalid.");
  }
  if (input.captureMethod !== null && (typeof input.captureMethod !== "string" || input.captureMethod.length > 256)) {
    throw new Error("Measurement capture method is invalid.");
  }
  if (input.capturedAt !== null && !validTimestamp(input.capturedAt)) throw new Error("Capture date must be canonical UTC time.");
  if (input.measurer !== null && !CAPTURE_MEASURERS.has(input.measurer)) throw new Error("Measurement capture measurer is invalid.");
  const currentField = fieldFor(session, fieldId);
  const definition = getFieldDefinitions(session.recipeId).find((candidate) => candidate.id === fieldId);
  if (!currentField || !definition || currentField.semanticId !== definition.semanticId) {
    throw new Error("Measurement capture field is not defined by the active recipe.");
  }
  if (!validEnteredUnit(input.enteredUnit, definition)) throw new Error("Measurement capture unit does not match the field.");
  if (input.provenance === "USER_CAPTURED" && definition.semanticKind !== "BODY_MEASURE") {
    throw new Error("Only a body-measure field can be recorded as user-captured.");
  }
  if (input.provenance === "USER_SELECTED" && definition.semanticKind === "BODY_MEASURE") {
    throw new Error("A body-measure field cannot be recorded as a selected garment target.");
  }
  if (currentField.readings.length >= MEASUREMENT_CAPTURE_MAX_READINGS_PER_FIELD) {
    throw new Error("Measurement capture field reached its reading limit.");
  }
  if (currentField.readings.some((reading) => reading.id === input.id)) throw new Error("Measurement capture reading ID already exists.");
  const canonicalValue = numericValue(input.rawValue, input.enteredUnit, definition);
  const reading: MeasurementCaptureReading = { ...input, canonicalValue, revision: session.revision + 1 };
  const nextField: MeasurementCaptureField = {
    ...currentField,
    readings: [...currentField.readings, reading],
    selectedReadingId: currentField.readings.length === 0 ? reading.id : null,
  };
  const fields = session.fields.map((candidate) => candidate.fieldId === fieldId ? nextField : candidate);
  return bump(session, now, fields);
}

export function acceptCapturePreset(
  session: MeasurementCaptureSession,
  fieldId: string,
  readingId: string,
  now: string,
  presetName = "Standard M digital preset; not measured wearer data",
): MeasurementCaptureSession {
  const field = fieldFor(session, fieldId);
  const definition = getFieldDefinitions(session.recipeId).find((candidate) => candidate.id === fieldId);
  if (!field || !definition) throw new Error("Measurement capture field is not defined by the active recipe.");
  return addCaptureReadingForField(session, fieldId, {
    id: readingId,
    rawValue: String(definition.defaultValue),
    enteredUnit: definition.unit,
    provenance: "PRESET",
    evidenceStatus: "UNCONFIRMED",
    sourceLabel: presetName,
    captureMethod: null,
    capturedAt: null,
    measurer: null,
  }, now);
}

export function selectCaptureReading(
  session: MeasurementCaptureSession,
  fieldId: string,
  readingId: string,
  now: string,
): MeasurementCaptureSession {
  const field = fieldFor(session, fieldId);
  if (!field || !field.readings.some((reading) => reading.id === readingId)) {
    throw new Error("Choose a recorded measurement reading for this recipe field.");
  }
  const fields = session.fields.map((candidate) => candidate.fieldId === fieldId
    ? { ...candidate, selectedReadingId: readingId }
    : candidate);
  return bump(session, now, fields);
}

export function assessCaptureField(field: MeasurementCaptureField, recipeId: string): CaptureFieldAssessment {
  if (field.readings.length === 0) return {
    state: "missing", issue: "missing", correction: "Enter a value or explicitly accept the named digital preset.",
  };
  if (field.selectedReadingId === null) return {
    state: "ambiguous", issue: "ambiguous", correction: "Choose one recorded value or add another reading.",
  };
  const selected = field.readings.find((reading) => reading.id === field.selectedReadingId);
  const definition = getFieldDefinitions(recipeId).find((candidate) => candidate.id === field.fieldId);
  if (!selected || !definition) return {
    state: "invalid", issue: "unsupported-field", correction: "Reload this garment's current field list before continuing.",
  };
  if (selected.evidenceStatus === "CONFLICT") return {
    state: "invalid", issue: "conflicting-evidence",
    correction: "Add a new reading and deliberately select it; earlier conflicting readings stay recorded.",
  };
  if (selected.canonicalValue === null) return selected.rawValue.trim() === ""
    ? { state: "invalid", issue: "blank", correction: "Enter a numeric value; the original text stays visible." }
    : { state: "invalid", issue: "not-numeric", correction: "Enter a finite numeric value; the original text stays visible." };
  if (!valueIsWithinGuardrails(selected.canonicalValue, definition)) {
    const skirtMaxiConflict = definition.recipeId === "skirt" && definition.inputKey === "length"
      && selected.canonicalValue > definition.max && selected.canonicalValue <= 120;
    return {
      state: "invalid", issue: "outside-guardrail",
      correction: skirtMaxiConflict
        ? `Choose ${definition.min}–${definition.max} ${definition.unit} in this route. The Maxi style label extends to 120 ${definition.unit}, but its ${definition.max}–120 range is unavailable because the shared control stops at ${definition.max}; the value is not changed automatically.`
        : `Choose a value from ${definition.min} to ${definition.max} ${definition.unit}; this is a software guardrail, not an industry limit.`,
    };
  }
  return { state: "resolved", issue: null, correction: null };
}

export function captureFieldState(field: MeasurementCaptureField, recipeId: string): CaptureFieldState {
  return assessCaptureField(field, recipeId).state;
}

export function measurementCaptureReadiness(session: MeasurementCaptureSession): CaptureReadiness {
  const states: Record<string, CaptureFieldState> = {};
  const assessments: Record<string, CaptureFieldAssessment> = {};
  const unresolvedFieldIds: string[] = [];
  for (const field of session.fields) {
    const assessment = assessCaptureField(field, session.recipeId);
    states[field.fieldId] = assessment.state;
    assessments[field.fieldId] = assessment;
    if (assessment.state !== "resolved") unresolvedFieldIds.push(field.fieldId);
  }
  return { ready: unresolvedFieldIds.length === 0, states, assessments, unresolvedFieldIds };
}

export function selectedCaptureValues(session: MeasurementCaptureSession): Readonly<Record<string, number>> | null {
  if (!measurementCaptureReadiness(session).ready) return null;
  const values: Record<string, number> = {};
  for (const field of session.fields) {
    const selected = field.readings.find((reading) => reading.id === field.selectedReadingId)!;
    values[field.inputKey] = selected.canonicalValue!;
  }
  return values;
}

export function attachCaptureSessionToStyle(
  session: MeasurementCaptureSession,
  styleId: string,
  now: string,
): MeasurementCaptureSession {
  if (!UUID.test(styleId)) throw new Error("Measurement capture style ID must be a UUID.");
  if (session.styleId !== null && session.styleId !== styleId) throw new Error("Measurement capture session already belongs to another style.");
  if (session.styleId === styleId) return session;
  if (!validTimestamp(now) || Date.parse(now) < Date.parse(session.updatedAt)) throw new Error("Measurement capture update time must be canonical and monotonic.");
  return { ...session, styleId, revision: session.revision + 1, updatedAt: now };
}

function parseReading(value: unknown, definition: FieldDefinition): MeasurementCaptureReading | null {
  const keys = ["id", "rawValue", "enteredUnit", "canonicalValue", "provenance", "evidenceStatus", "sourceLabel", "captureMethod", "capturedAt", "measurer", "revision"];
  if (!exactKeys(value, keys)) return null;
  const reading = value as unknown as MeasurementCaptureReading;
  const computed = typeof reading.rawValue === "string" && validEnteredUnit(reading.enteredUnit, definition)
    ? numericValue(reading.rawValue, reading.enteredUnit, definition)
    : Number.NaN;
  if (!UUID.test(reading.id) || typeof reading.rawValue !== "string" || reading.rawValue.length > 4096
    || !validEnteredUnit(reading.enteredUnit, definition)
    || (reading.canonicalValue !== null && (!Number.isFinite(reading.canonicalValue) || reading.canonicalValue !== computed))
    || reading.canonicalValue !== computed
    || !CAPTURE_PROVENANCE.has(reading.provenance) || !CAPTURE_EVIDENCE.has(reading.evidenceStatus)
    || (reading.provenance === "USER_CAPTURED" && definition.semanticKind !== "BODY_MEASURE")
    || (reading.provenance === "USER_SELECTED" && definition.semanticKind === "BODY_MEASURE")
    || typeof reading.sourceLabel !== "string" || reading.sourceLabel.trim() === "" || reading.sourceLabel.length > 500
    || (reading.captureMethod !== null && (typeof reading.captureMethod !== "string" || reading.captureMethod.length > 256))
    || (reading.capturedAt !== null && !validTimestamp(reading.capturedAt))
    || (reading.measurer !== null && !CAPTURE_MEASURERS.has(reading.measurer))
    || !Number.isSafeInteger(reading.revision) || reading.revision < 1) return null;
  return reading;
}

export function parseMeasurementCaptureSession(value: unknown):
  | { readonly ok: true; readonly value: MeasurementCaptureSession }
  | { readonly ok: false; readonly error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  const sessionKeys = ["schemaVersion", "definitionVersion", "id", "styleId", "recipeId", "revision", "createdAt", "updatedAt", "fields"];
  const fieldKeys = ["fieldId", "semanticId", "inputKey", "inputKind", "semanticKind", "unit", "readings", "selectedReadingId"];
  if (!exactKeys(value, sessionKeys)) return fail("Measurement capture session fields are incomplete or unknown.");
  const session = value as unknown as MeasurementCaptureSession;
  if (session.schemaVersion !== MEASUREMENT_CAPTURE_SCHEMA_VERSION
    || session.definitionVersion !== MEASUREMENT_CAPTURE_DEFINITION_VERSION) return fail("Unsupported measurement capture schema or definition version.");
  if (!UUID.test(session.id) || (session.styleId !== null && !UUID.test(session.styleId))
    || typeof session.recipeId !== "string" || !Number.isSafeInteger(session.revision) || session.revision < 0
    || !validTimestamp(session.createdAt) || !validTimestamp(session.updatedAt)
    || Date.parse(session.updatedAt) < Date.parse(session.createdAt)
    || !Array.isArray(session.fields) || session.fields.length > MEASUREMENT_CAPTURE_MAX_FIELDS) {
    return fail("Measurement capture identity, timestamp, revision, or field list is invalid.");
  }
  const definitions = getFieldDefinitions(session.recipeId);
  if (definitions.length === 0 || session.fields.length !== definitions.length) return fail("Measurement capture must cover every current recipe input exactly once.");
  const seenReadingIds = new Set<string>();
  for (let index = 0; index < session.fields.length; index += 1) {
    const field = session.fields[index];
    const definition = definitions[index];
    if (!exactKeys(field, fieldKeys) || !definition || field.fieldId !== definition.id
      || field.semanticId !== definition.semanticId || field.inputKey !== definition.inputKey
      || field.inputKind !== definition.inputKind || field.semanticKind !== definition.semanticKind
      || field.unit !== definition.unit || !Array.isArray(field.readings)
      || field.readings.length > MEASUREMENT_CAPTURE_MAX_READINGS_PER_FIELD
      || (field.selectedReadingId !== null && typeof field.selectedReadingId !== "string")) {
      return fail("Measurement capture field order, meaning, or values do not match its recipe definition.");
    }
    let previousRevision = 0;
    for (const rawReading of field.readings) {
      const reading = parseReading(rawReading, definition);
      if (!reading || reading.revision <= previousRevision || reading.revision > session.revision || seenReadingIds.has(reading.id)) {
        return fail("Measurement capture readings are malformed, duplicated, or out of revision order.");
      }
      previousRevision = reading.revision;
      seenReadingIds.add(reading.id);
    }
    if (field.selectedReadingId !== null && !field.readings.some((reading) => reading.id === field.selectedReadingId)) {
      return fail("Measurement capture selection must reference a recorded reading.");
    }
  }
  return { ok: true, value: session };
}
