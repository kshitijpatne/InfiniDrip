/** Strict, standalone T03 operation/source contract; persistence and UI are later slices. */
import type { RecordResult } from "./project-records";

export const TECH_PACK_OPERATION_RECORD_VERSION = 1;
export const TECH_PACK_OPERATION_MAX_RECORDS = 500;
export const TECH_PACK_OPERATION_MAX_REFERENCES = 100;
export const TECH_PACK_OPERATION_MAX_SEQUENCE = 10_000;
export const TECH_PACK_OPERATION_MAX_CONFLICT_SOURCES = 8;

export const TECH_PACK_OPERATION_RECIPE_IDS = Object.freeze([
  "tee",
  "fitted",
  "tank",
  "polo",
  "woven-shirt",
  "skirt",
  "trouser",
] as const);

export const TECH_PACK_OPERATION_FACT_IDS = Object.freeze([
  "method",
  "machineSettings",
  "stitchType",
  "seamConstruction",
  "seamAllowance",
  "finish",
  "pressing",
  "labels",
  "packaging",
  "tests",
  "compliance",
] as const);

export const TECH_PACK_OPERATION_UNITS = Object.freeze(["cm", "mm", "in"] as const);

export type TechPackOperationRecipeId = typeof TECH_PACK_OPERATION_RECIPE_IDS[number];
export type TechPackOperationFactId = typeof TECH_PACK_OPERATION_FACT_IDS[number];
export type TechPackOperationUnit = typeof TECH_PACK_OPERATION_UNITS[number];

export interface TechPackOperationSourceReference {
  readonly uri: string;
  readonly title: string;
  readonly locator: string;
}

export type TechPackOperationSourcedValue<T> =
  | {
      readonly status: "SOURCE_CONFIRMED";
      readonly value: T;
      readonly source: TechPackOperationSourceReference;
    }
  | {
      readonly status: "UNRESOLVED";
      readonly value: null;
      readonly unresolvedReason: string;
      readonly nextAction: string;
    }
  | {
      readonly status: "CONFLICT";
      readonly value: null;
      readonly sourceRefs: readonly TechPackOperationSourceReference[];
      readonly unresolvedReason: string;
      readonly nextAction: string;
    };

export interface TechPackOperationAllowance {
  readonly amount: number;
  readonly unit: TechPackOperationUnit;
}

type TextFactId = Exclude<TechPackOperationFactId, "seamAllowance">;

export type TechPackOperationFact =
  | {
      readonly factId: TextFactId;
      readonly value: TechPackOperationSourcedValue<string>;
    }
  | {
      readonly factId: "seamAllowance";
      readonly value: TechPackOperationSourcedValue<TechPackOperationAllowance>;
    };

export interface TechPackOperation {
  /** Internal stable key; it does not imply a source operation exists. */
  readonly id: string;
  readonly name: TechPackOperationSourcedValue<string>;
  readonly sequence: TechPackOperationSourcedValue<number>;
  /** Sourced stable component IDs; existence is reconciled in S773. */
  readonly componentRefs: TechPackOperationSourcedValue<readonly string[]>;
  /** Sourced stable seam IDs; existence is reconciled in S773. */
  readonly seamRefs: TechPackOperationSourcedValue<readonly string[]>;
  /** Omitted facts remain uncaptured until the later completeness validator. */
  readonly facts: readonly TechPackOperationFact[];
}

export interface TechPackOperationRecordSet {
  readonly schemaVersion: typeof TECH_PACK_OPERATION_RECORD_VERSION;
  readonly recipeId: TechPackOperationRecipeId;
  readonly operations: readonly TechPackOperation[];
}

const RECIPE_IDS = new Set<string>(TECH_PACK_OPERATION_RECIPE_IDS);
const FACT_IDS = new Set<string>(TECH_PACK_OPERATION_FACT_IDS);
const UNIT_IDS = new Set<string>(TECH_PACK_OPERATION_UNITS);
const SOURCE_STATUSES = new Set(["SOURCE_CONFIRMED", "UNRESOLVED", "CONFLICT"]);
const STABLE_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const MAX_TEXT = 512;
const RECORD_SET_KEYS = ["schemaVersion", "recipeId", "operations"];
const OPERATION_KEYS = ["id", "name", "sequence", "componentRefs", "seamRefs", "facts"];
const SOURCE_REFERENCE_KEYS = ["uri", "title", "locator"];

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

function text(value: unknown, maxLength = MAX_TEXT): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function stableId(value: unknown): value is string {
  return typeof value === "string" && STABLE_ID.test(value);
}

function portableUri(value: string): boolean {
  if (value !== value.trim()) return false;
  if (value.startsWith("https://")) {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }
  if (value.startsWith("/") || value.includes("\\") || /^[a-z]:/i.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.split("/").includes("..")) return false;
  return true;
}

function parseSourceReference(value: unknown): RecordResult<TechPackOperationSourceReference> {
  if (!isRecord(value) || !exactKeys(value, SOURCE_REFERENCE_KEYS)) {
    return fail("Operation source must contain exactly uri, title, and locator.");
  }
  if (!text(value.uri, MAX_TEXT) || !portableUri(value.uri)) {
    return fail("Operation source URI must be portable (HTTPS or repository-relative), not a machine path.");
  }
  if (!text(value.title, 240)) return fail("Operation source title must be non-empty text of at most 240 characters.");
  if (!text(value.locator, 240)) return fail("Operation source locator must name a page, section, table, or stable location.");
  return { ok: true, value: { uri: value.uri, title: value.title, locator: value.locator } };
}

function parseSourceReferences(value: unknown): RecordResult<readonly TechPackOperationSourceReference[]> {
  if (!Array.isArray(value)) return fail("Conflicting operation evidence requires a source-reference list.");
  if (value.length < 2) return fail("Conflicting operation evidence requires at least two sources.");
  if (value.length > TECH_PACK_OPERATION_MAX_CONFLICT_SOURCES) return fail("Conflicting operation evidence exceeds the source limit.");
  const sources: TechPackOperationSourceReference[] = [];
  const keys = new Set<string>();
  for (const raw of value) {
    const parsed = parseSourceReference(raw);
    if (!parsed.ok) return parsed;
    const key = `${parsed.value.uri}#${parsed.value.locator}`;
    if (keys.has(key)) return fail("Conflicting operation source references must be unique.");
    keys.add(key);
    sources.push(parsed.value);
  }
  return { ok: true, value: sources };
}

function parseSourcedValue<T>(
  value: unknown,
  parseValue: (candidate: unknown) => RecordResult<T>,
): RecordResult<TechPackOperationSourcedValue<T>> {
  if (!isRecord(value) || typeof value.status !== "string" || !SOURCE_STATUSES.has(value.status)) {
    return fail("Operation fact must explicitly be source-confirmed, unresolved, or conflicting.");
  }
  if (value.status === "SOURCE_CONFIRMED") {
    if (!exactKeys(value, ["status", "value", "source"])) return fail("Source-confirmed operation fact has missing or unknown fields.");
    const source = parseSourceReference(value.source);
    if (!source.ok) return source;
    const parsed = parseValue(value.value);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { status: "SOURCE_CONFIRMED", value: parsed.value, source: source.value } };
  }
  if (value.status === "UNRESOLVED") {
    if (!exactKeys(value, ["status", "value", "unresolvedReason", "nextAction"])) {
      return fail("Unresolved operation fact has missing or unknown fields.");
    }
    if (value.value !== null) return fail("Unresolved operation facts cannot carry an assumed value.");
    if (!text(value.unresolvedReason)) return fail("Unresolved operation fact requires a reason.");
    if (!text(value.nextAction)) return fail("Unresolved operation fact requires an actionable next step.");
    return { ok: true, value: { status: "UNRESOLVED", value: null, unresolvedReason: value.unresolvedReason, nextAction: value.nextAction } };
  }
  if (!exactKeys(value, ["status", "value", "sourceRefs", "unresolvedReason", "nextAction"])) {
    return fail("Conflicting operation fact has missing or unknown fields.");
  }
  if (value.value !== null) return fail("Conflicting operation facts cannot carry a selected value.");
  const sourceRefs = parseSourceReferences(value.sourceRefs);
  if (!sourceRefs.ok) return sourceRefs;
  if (!text(value.unresolvedReason)) return fail("Conflicting operation fact requires a reason.");
  if (!text(value.nextAction)) return fail("Conflicting operation fact requires an actionable next step.");
  return { ok: true, value: { status: "CONFLICT", value: null, sourceRefs: sourceRefs.value, unresolvedReason: value.unresolvedReason, nextAction: value.nextAction } };
}

function parseTextValue(value: unknown): RecordResult<string> {
  return text(value) ? { ok: true, value } : fail("Operation fact value must be non-empty text.");
}

function parseSequenceValue(value: unknown): RecordResult<number> {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= TECH_PACK_OPERATION_MAX_SEQUENCE
    ? { ok: true, value }
    : fail(`Operation sequence must be a positive integer no greater than ${TECH_PACK_OPERATION_MAX_SEQUENCE}.`);
}

function parseRefList(value: unknown): RecordResult<readonly string[]> {
  if (!Array.isArray(value)) return fail("Operation references must be an array of stable IDs.");
  if (value.length > TECH_PACK_OPERATION_MAX_REFERENCES) return fail("Operation reference list exceeds its item limit.");
  const refs: string[] = [];
  const unique = new Set<string>();
  for (const raw of value) {
    if (!stableId(raw)) return fail("Operation references must use stable lowercase IDs.");
    if (unique.has(raw)) return fail("Operation reference lists cannot repeat an ID.");
    unique.add(raw);
    refs.push(raw);
  }
  return { ok: true, value: refs };
}

function parseAllowance(value: unknown): RecordResult<TechPackOperationAllowance> {
  if (!isRecord(value) || !exactKeys(value, ["amount", "unit"])) return fail("Seam allowance must contain exactly amount and unit.");
  if (typeof value.amount !== "number" || !Number.isFinite(value.amount) || value.amount < 0) {
    return fail("Seam allowance must be a finite, non-negative value; it is never clamped.");
  }
  if (typeof value.unit !== "string" || !UNIT_IDS.has(value.unit)) return fail("Seam allowance requires an explicit cm, mm, or in unit.");
  return { ok: true, value: { amount: value.amount, unit: value.unit as TechPackOperationUnit } };
}

function parseFact(value: unknown): RecordResult<TechPackOperationFact> {
  if (!isRecord(value) || !exactKeys(value, ["factId", "value"])) return fail("Operation fact must contain exactly factId and value.");
  if (typeof value.factId !== "string" || !FACT_IDS.has(value.factId)) return fail("Operation fact has an unsupported fact ID.");
  if (value.factId === "seamAllowance") {
    const parsed = parseSourcedValue(value.value, parseAllowance);
    return parsed.ok ? { ok: true, value: { factId: "seamAllowance", value: parsed.value } } : parsed;
  }
  const parsed = parseSourcedValue(value.value, parseTextValue);
  return parsed.ok ? { ok: true, value: { factId: value.factId as TextFactId, value: parsed.value } } : parsed;
}

function parseOperation(value: unknown): RecordResult<TechPackOperation> {
  if (!isRecord(value) || !exactKeys(value, OPERATION_KEYS)) return fail("Operation must contain exactly id, name, sequence, componentRefs, seamRefs, and facts.");
  if (!stableId(value.id)) return fail("Operation ID must be a stable lowercase ID.");
  const name = parseSourcedValue(value.name, parseTextValue);
  if (!name.ok) return name;
  const sequence = parseSourcedValue(value.sequence, parseSequenceValue);
  if (!sequence.ok) return sequence;
  const componentRefs = parseSourcedValue(value.componentRefs, parseRefList);
  if (!componentRefs.ok) return componentRefs;
  const seamRefs = parseSourcedValue(value.seamRefs, parseRefList);
  if (!seamRefs.ok) return seamRefs;
  if (!Array.isArray(value.facts)) return fail("Operation facts must be an array.");
  if (value.facts.length > TECH_PACK_OPERATION_FACT_IDS.length) return fail("Operation fact list exceeds its supported fact count.");
  const facts: TechPackOperationFact[] = [];
  const factIds = new Set<string>();
  for (const raw of value.facts) {
    const parsed = parseFact(raw);
    if (!parsed.ok) return parsed;
    if (factIds.has(parsed.value.factId)) return fail("An operation cannot repeat a fact ID.");
    factIds.add(parsed.value.factId);
    facts.push(parsed.value);
  }
  return { ok: true, value: { id: value.id, name: name.value, sequence: sequence.value, componentRefs: componentRefs.value, seamRefs: seamRefs.value, facts } };
}

export function emptyTechPackOperationRecordSet(recipeId: TechPackOperationRecipeId): TechPackOperationRecordSet {
  return { schemaVersion: TECH_PACK_OPERATION_RECORD_VERSION, recipeId, operations: [] };
}

export function parseTechPackOperationRecordSet(
  value: unknown,
  expectedRecipeId?: TechPackOperationRecipeId,
): RecordResult<TechPackOperationRecordSet> {
  if (!isRecord(value) || !exactKeys(value, RECORD_SET_KEYS)) return fail("T03 record set has missing or unknown fields.");
  if (value.schemaVersion !== TECH_PACK_OPERATION_RECORD_VERSION) return fail("Unsupported T03 operation record version.");
  if (typeof value.recipeId !== "string" || !RECIPE_IDS.has(value.recipeId)) return fail("T03 record set has an unsupported recipe ID.");
  if (expectedRecipeId !== undefined && value.recipeId !== expectedRecipeId) return fail("T03 record set does not match the expected recipe.");
  if (!Array.isArray(value.operations)) return fail("T03 operations must be an array.");
  if (value.operations.length > TECH_PACK_OPERATION_MAX_RECORDS) return fail("T03 record set exceeds the operation limit.");
  const operations: TechPackOperation[] = [];
  const operationIds = new Set<string>();
  const confirmedSequences = new Set<number>();
  for (const raw of value.operations) {
    const parsed = parseOperation(raw);
    if (!parsed.ok) return parsed;
    if (operationIds.has(parsed.value.id)) return fail("T03 operation IDs must be unique within a recipe.");
    operationIds.add(parsed.value.id);
    if (parsed.value.sequence.status === "SOURCE_CONFIRMED") {
      if (confirmedSequences.has(parsed.value.sequence.value)) return fail("Source-confirmed T03 operation sequence values must be unique.");
      confirmedSequences.add(parsed.value.sequence.value);
    }
    operations.push(parsed.value);
  }
  return { ok: true, value: { schemaVersion: TECH_PACK_OPERATION_RECORD_VERSION, recipeId: value.recipeId as TechPackOperationRecipeId, operations } };
}
