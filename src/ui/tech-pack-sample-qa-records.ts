/** Strict T02 POM definitions and editable sample/QA observations. */
import {
  parseTechPackPomDefinitionSet,
  TECH_PACK_POM_RECORD_VERSION,
  TECH_PACK_POM_UNITS,
  type TechPackPomDefinition,
  type TechPackPomDefinitionSet,
  type TechPackPomUnit,
  type TechPackPomRecipeId,
} from "./tech-pack-pom-records";
import type { RecordResult } from "./project-records";

export const TECH_PACK_POM_DATA_VERSION = 1;
export const TECH_PACK_POM_MAX_SAMPLE_ROUNDS = 200;
export const TECH_PACK_POM_MAX_READINGS_PER_ROUND = 500;
export const TECH_PACK_POM_MAX_QA_OBSERVATIONS = 200;
export const TECH_PACK_POM_MAX_EVIDENCE_REFS = 100;
export const TECH_PACK_POM_MAX_FIELD_LENGTH = 512;

export interface TechPackPomSampleReading {
  readonly pomDefinitionId: string;
  readonly status: "MEASURED" | "UNRESOLVED";
  /** Observed value only; never populated from a pattern prediction. */
  readonly actualValue: number | null;
  readonly unit: TechPackPomUnit | null;
  readonly method: string | null;
  readonly evidenceRefs: readonly string[];
  readonly unresolvedReason: string | null;
  readonly nextAction: string | null;
}

export interface TechPackPomQaObservation {
  readonly id: string;
  readonly status: "OBSERVED" | "UNRESOLVED";
  readonly note: string;
  readonly nextAction: string | null;
}

export interface TechPackPomSampleQaRound {
  readonly id: string;
  readonly targetRevisionId: string;
  readonly targetRevisionNumber: number;
  readonly sampleLabel: string;
  readonly sampleSizeId: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly readings: readonly TechPackPomSampleReading[];
  readonly qaObservations: readonly TechPackPomQaObservation[];
}

/** Persisted T02 overlay; target revisions are checked against style history. */
export interface TechPackPomRecordSet {
  readonly schemaVersion: typeof TECH_PACK_POM_DATA_VERSION;
  readonly definitions: TechPackPomDefinitionSet;
  readonly sampleQaRounds: readonly TechPackPomSampleQaRound[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNITS = new Set<string>(TECH_PACK_POM_UNITS);

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function text(value: unknown, maximum = TECH_PACK_POM_MAX_FIELD_LENGTH): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;
  return new Date(Date.parse(value)).toISOString() === value;
}

function parseRefs(value: unknown): RecordResult<readonly string[]> {
  if (!Array.isArray(value)) return fail("Sample evidence references must be a list.");
  if (value.length > TECH_PACK_POM_MAX_EVIDENCE_REFS) return fail("Sample evidence references exceed their supported limit.");
  const refs: string[] = [];
  const unique = new Set<string>();
  for (const entry of value) {
    if (!text(entry)) return fail("Sample evidence references must be non-empty text.");
    if (unique.has(entry)) return fail("Sample evidence references must be unique.");
    unique.add(entry);
    refs.push(entry);
  }
  return { ok: true, value: refs };
}

function parseReading(value: unknown, definitions: ReadonlyMap<string, TechPackPomDefinition>): RecordResult<TechPackPomSampleReading> {
  const keys = ["pomDefinitionId", "status", "actualValue", "unit", "method", "evidenceRefs", "unresolvedReason", "nextAction"];
  if (!isRecord(value) || !exactKeys(value, keys)) return fail("Sample reading has missing or unknown fields.");
  if (!text(value.pomDefinitionId, 120)) return fail("Sample reading must identify a POM definition.");
  const definition = definitions.get(value.pomDefinitionId);
  if (!definition) return fail("Sample reading refers to a POM definition that is not in this T02 record.");
  if (value.status === "MEASURED") {
    if (typeof value.actualValue !== "number" || !Number.isFinite(value.actualValue)) {
      return fail("Measured sample reading requires a finite actual value.");
    }
    if (typeof value.unit !== "string" || !UNITS.has(value.unit) || value.unit !== definition.unit) {
      return fail("Measured sample reading must explicitly use its POM definition unit; implicit conversion is not supported.");
    }
    if (!text(value.method)) return fail("Measured sample reading requires its measurement method.");
    const refs = parseRefs(value.evidenceRefs);
    if (!refs.ok) return refs;
    if (value.unresolvedReason !== null || value.nextAction !== null) {
      return fail("Measured sample readings cannot carry unresolved fields.");
    }
    return {
      ok: true,
      value: {
        pomDefinitionId: value.pomDefinitionId,
        status: "MEASURED",
        actualValue: value.actualValue,
        unit: value.unit as TechPackPomUnit,
        method: value.method,
        evidenceRefs: refs.value,
        unresolvedReason: null,
        nextAction: null,
      },
    };
  }
  if (value.status === "UNRESOLVED") {
    if (value.actualValue !== null || value.unit !== null || value.method !== null) {
      return fail("Unresolved sample readings cannot carry an assumed value, unit, or method.");
    }
    const refs = parseRefs(value.evidenceRefs);
    if (!refs.ok) return refs;
    if (refs.value.length !== 0) return fail("Unresolved sample readings cannot claim measurement evidence.");
    if (!text(value.unresolvedReason) || !text(value.nextAction)) {
      return fail("Unresolved sample readings require a reason and actionable next step.");
    }
    return {
      ok: true,
      value: {
        pomDefinitionId: value.pomDefinitionId,
        status: "UNRESOLVED",
        actualValue: null,
        unit: null,
        method: null,
        evidenceRefs: [],
        unresolvedReason: value.unresolvedReason,
        nextAction: value.nextAction,
      },
    };
  }
  return fail("Sample reading status must be MEASURED or UNRESOLVED.");
}

function parseObservation(value: unknown): RecordResult<TechPackPomQaObservation> {
  if (!isRecord(value) || !exactKeys(value, ["id", "status", "note", "nextAction"])) {
    return fail("QA observation has missing or unknown fields.");
  }
  if (typeof value.id !== "string" || !UUID.test(value.id)) return fail("QA observation ID must be a UUID.");
  if (value.status !== "OBSERVED" && value.status !== "UNRESOLVED") return fail("QA observation status is unsupported.");
  if (!text(value.note)) return fail("QA observation requires an explicit note or unresolved reason.");
  if (value.status === "UNRESOLVED" && !text(value.nextAction)) {
    return fail("Unresolved QA observations require an actionable next step.");
  }
  if (value.status === "OBSERVED" && value.nextAction !== null && !text(value.nextAction)) {
    return fail("Observed QA next action must be null or non-empty text.");
  }
  return {
    ok: true,
    value: {
      id: value.id,
      status: value.status,
      note: value.note,
      nextAction: value.nextAction as string | null,
    },
  };
}

function parseRound(value: unknown, definitions: ReadonlyMap<string, TechPackPomDefinition>): RecordResult<TechPackPomSampleQaRound> {
  const keys = ["id", "targetRevisionId", "targetRevisionNumber", "sampleLabel", "sampleSizeId", "recordedAt", "recordedBy", "readings", "qaObservations"];
  if (!isRecord(value) || !exactKeys(value, keys)) return fail("Sample/QA round has missing or unknown fields.");
  if (typeof value.id !== "string" || !UUID.test(value.id)) return fail("Sample/QA round ID must be a UUID.");
  if (typeof value.targetRevisionId !== "string" || !UUID.test(value.targetRevisionId)) {
    return fail("Sample/QA round must reference one immutable style revision.");
  }
  if (!Number.isSafeInteger(value.targetRevisionNumber) || (value.targetRevisionNumber as number) < 1) {
    return fail("Sample/QA target revision number must be a positive integer.");
  }
  if (!text(value.sampleLabel, 160) || !text(value.sampleSizeId, 120)) return fail("Sample round needs an explicit sample label and size ID.");
  if (!timestamp(value.recordedAt) || !text(value.recordedBy, 160)) return fail("Sample/QA capture requires canonical time and a recorder label.");
  if (!Array.isArray(value.readings) || value.readings.length > TECH_PACK_POM_MAX_READINGS_PER_ROUND) {
    return fail("Sample readings must be a bounded list.");
  }
  const readings: TechPackPomSampleReading[] = [];
  const readingIds = new Set<string>();
  for (const raw of value.readings) {
    const parsed = parseReading(raw, definitions);
    if (!parsed.ok) return parsed;
    if (readingIds.has(parsed.value.pomDefinitionId)) return fail("A sample round may record one reading per POM definition.");
    readingIds.add(parsed.value.pomDefinitionId);
    readings.push(parsed.value);
  }
  if (!Array.isArray(value.qaObservations) || value.qaObservations.length > TECH_PACK_POM_MAX_QA_OBSERVATIONS) {
    return fail("QA observations must be a bounded list.");
  }
  const qaObservations: TechPackPomQaObservation[] = [];
  const observationIds = new Set<string>();
  for (const raw of value.qaObservations) {
    const parsed = parseObservation(raw);
    if (!parsed.ok) return parsed;
    if (observationIds.has(parsed.value.id)) return fail("QA observation IDs must be unique within a round.");
    observationIds.add(parsed.value.id);
    qaObservations.push(parsed.value);
  }
  return {
    ok: true,
    value: {
      id: value.id,
      targetRevisionId: value.targetRevisionId,
      targetRevisionNumber: value.targetRevisionNumber as number,
      sampleLabel: value.sampleLabel,
      sampleSizeId: value.sampleSizeId,
      recordedAt: value.recordedAt,
      recordedBy: value.recordedBy,
      readings,
      qaObservations,
    },
  };
}

export function emptyTechPackPomRecordSet(recipeId: TechPackPomRecipeId): TechPackPomRecordSet {
  return {
    schemaVersion: TECH_PACK_POM_DATA_VERSION,
    definitions: { schemaVersion: TECH_PACK_POM_RECORD_VERSION, recipeId, definitions: [] },
    sampleQaRounds: [],
  };
}

/** Parses detached T02 data without deriving an expected value from a pattern. */
export function parseTechPackPomRecordSet(value: unknown, recipeId: string): RecordResult<TechPackPomRecordSet> {
  if (!isRecord(value) || !exactKeys(value, ["schemaVersion", "definitions", "sampleQaRounds"])) {
    return fail("T02 POM record set has missing or unknown fields.");
  }
  if (value.schemaVersion !== TECH_PACK_POM_DATA_VERSION) return fail("Unsupported T02 POM record-set schema version.");
  const parsedDefinitions = parseTechPackPomDefinitionSet(value.definitions);
  if (!parsedDefinitions.ok) return parsedDefinitions;
  if (parsedDefinitions.value.recipeId !== recipeId) return fail("T02 POM definitions must match the containing style recipe.");
  if (!Array.isArray(value.sampleQaRounds) || value.sampleQaRounds.length > TECH_PACK_POM_MAX_SAMPLE_ROUNDS) {
    return fail("Sample/QA rounds must be a bounded list.");
  }
  const definitionMap = new Map(parsedDefinitions.value.definitions.map((definition) => [definition.id, definition]));
  const sampleQaRounds: TechPackPomSampleQaRound[] = [];
  const roundIds = new Set<string>();
  for (const raw of value.sampleQaRounds) {
    const parsed = parseRound(raw, definitionMap);
    if (!parsed.ok) return parsed;
    if (roundIds.has(parsed.value.id)) return fail("Sample/QA round IDs must be unique.");
    roundIds.add(parsed.value.id);
    sampleQaRounds.push(parsed.value);
  }
  return {
    ok: true,
    value: {
      schemaVersion: TECH_PACK_POM_DATA_VERSION,
      definitions: parsedDefinitions.value,
      sampleQaRounds,
    },
  };
}

/** All round targets must exist in this style's exact immutable history. */
export function sampleRoundsMatchStyleHistory(
  styleId: string,
  records: TechPackPomRecordSet,
  history: readonly { readonly styleId: string; readonly revisionId: string; readonly revisionNumber: number }[],
): boolean {
  return records.sampleQaRounds.every((round) => history.some((revision) =>
    revision.styleId === styleId
    && revision.revisionId === round.targetRevisionId
    && revision.revisionNumber === round.targetRevisionNumber));
}
