/** Strict, bounded local records for user-authored collection scenarios. */
import type { RecordResult } from "./project-records";
import type { ScenarioProvenance, ScenarioScope } from "./scenario-calculations";
import type { CollectionRecord } from "./collection-records";

export const SCENARIO_RECORD_VERSION = 1;
export const PROJECT_SCENARIO_RECORD_LIMIT = 100;
export const SCENARIO_INPUT_LIST_LIMIT = 500;
export const SCENARIO_INPUT_ROW_LIMIT = 500;
export const PROJECT_SCENARIO_INPUT_ROW_LIMIT = 1_000;

export interface ScenarioDraftProvenance {
  readonly kind: string;
  readonly sourceLabel: string;
  readonly asOf: string;
  readonly validThrough: string;
}

export interface ScenarioDraftScope {
  readonly kind: string;
  readonly styleId: string;
  readonly skuId: string;
  readonly colorwayId: string;
  readonly variantId: string;
}

interface ScenarioInputRow {
  readonly id: string;
  readonly provenance: ScenarioDraftProvenance;
}

export interface ScenarioUnitDraftRow extends ScenarioInputRow {
  readonly variantId: string;
  readonly units: string;
}

export interface ScenarioMoneyDraftRow extends ScenarioInputRow {
  readonly variantId: string;
  readonly amount: string;
  readonly currencyCode: string;
}

export interface ScenarioMoqDraftRow extends ScenarioInputRow {
  readonly scope: ScenarioDraftScope;
  readonly unit: string;
  readonly minimumUnits: string;
}

export interface ScenarioCapacityDeliveryDraftRow extends ScenarioInputRow {
  readonly scope: ScenarioDraftScope;
  readonly unitsPerPeriod: string;
  readonly periodUnit: string;
  readonly minimumPeriods: string;
  readonly maximumPeriods: string;
}

export interface ScenarioRecord {
  readonly schemaVersion: typeof SCENARIO_RECORD_VERSION;
  readonly id: string;
  readonly projectId: string;
  /** A UUID-shaped reference may be orphaned after its collection is removed. */
  readonly collectionId: string;
  readonly name: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly evaluationDate: string;
  readonly currencyCode: string;
  readonly units: readonly ScenarioUnitDraftRow[];
  readonly prices: readonly ScenarioMoneyDraftRow[];
  readonly costs: readonly ScenarioMoneyDraftRow[];
  readonly moqs: readonly ScenarioMoqDraftRow[];
  readonly capacityDelivery: readonly ScenarioCapacityDeliveryDraftRow[];
}

export type ScenarioRowKind = "units" | "prices" | "costs" | "moqs" | "capacityDelivery";

export const SCENARIO_RECORD_KEYS = Object.freeze([
  "schemaVersion", "id", "projectId", "collectionId", "name", "revision", "createdAt", "updatedAt",
  "evaluationDate", "currencyCode", "units", "prices", "costs", "moqs", "capacityDelivery",
]);

const UNIT_ROW_KEYS = ["id", "variantId", "units", "provenance"];
const MONEY_ROW_KEYS = ["id", "variantId", "amount", "currencyCode", "provenance"];
const MOQ_ROW_KEYS = ["id", "scope", "unit", "minimumUnits", "provenance"];
const CAPACITY_DELIVERY_ROW_KEYS = [
  "id", "scope", "unitsPerPeriod", "periodUnit", "minimumPeriods", "maximumPeriods", "provenance",
];
const SCOPE_KEYS = ["kind", "styleId", "skuId", "colorwayId", "variantId"];
const PROVENANCE_KEYS = ["kind", "sourceLabel", "asOf", "validThrough"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: unknown, expected: readonly string[]): value is JsonObject {
  if (!isObject(value)) return false;
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function isRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function validProvenance(value: unknown, path: string): string | null {
  if (!hasExactKeys(value, PROVENANCE_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!isBoundedString(value.kind, 40) || !isBoundedString(value.sourceLabel, 120)
    || !isBoundedString(value.asOf, 32) || !isBoundedString(value.validThrough, 32)) {
    return `${path}: provenance text exceeds its record limit.`;
  }
  return null;
}

function validScope(value: unknown, path: string): string | null {
  if (!hasExactKeys(value, SCOPE_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!isBoundedString(value.kind, 40) || !isBoundedString(value.styleId, 80)
    || !isBoundedString(value.skuId, 80) || !isBoundedString(value.colorwayId, 80)
    || !isBoundedString(value.variantId, 80)) {
    return `${path}: scope text exceeds its record limit.`;
  }
  return null;
}

function validRows(
  value: unknown,
  path: ScenarioRowKind,
  keys: readonly string[],
  rowText: (row: JsonObject, rowPath: string) => string | null,
): value is readonly JsonObject[] | unknown[] {
  if (!Array.isArray(value)) return false;
  if (value.length > SCENARIO_INPUT_LIST_LIMIT) return false;
  const ids = new Set<string>();
  for (const [index, input] of value.entries()) {
    const rowPath = `${path}[${index}]`;
    if (!hasExactKeys(input, keys)) return false;
    if (!isUuid(input.id)) return false;
    const id = input.id.toLowerCase();
    if (ids.has(id)) return false;
    ids.add(id);
    if (rowText(input, rowPath) !== null) return false;
  }
  return true;
}

function inputRows(scenario: Pick<ScenarioRecord, ScenarioRowKind>): number {
  return scenario.units.length + scenario.prices.length + scenario.costs.length
    + scenario.moqs.length + scenario.capacityDelivery.length;
}

export function scenarioInputRowCount(scenario: Pick<ScenarioRecord, ScenarioRowKind>): number {
  return inputRows(scenario);
}

export function parseScenarioRecord(value: unknown, expectedProjectId?: string): RecordResult<ScenarioRecord> {
  if (!hasExactKeys(value, SCENARIO_RECORD_KEYS)) return fail("Scenario record fields are incomplete or unknown.");
  if (value.schemaVersion !== SCENARIO_RECORD_VERSION) return fail("Unsupported scenario record schema version.");
  if (!isUuid(value.id) || !isUuid(value.projectId) || !isUuid(value.collectionId)) {
    return fail("Scenario, project, and collection references must be UUID-shaped values.");
  }
  if (expectedProjectId !== undefined && value.projectId.toLowerCase() !== expectedProjectId.toLowerCase()) {
    return fail("Scenario projectId must reference this project.");
  }
  if (!isBoundedString(value.name, 80) || !isRevision(value.revision)
    || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt)
    || Date.parse(value.updatedAt) < Date.parse(value.createdAt)) {
    return fail("Scenario name, revision, or timestamps are invalid.");
  }
  if (!isBoundedString(value.evaluationDate, 32) || !isBoundedString(value.currencyCode, 8)) {
    return fail("Scenario evaluation date or currency exceeds its record limit.");
  }
  const rowCommon = (row: JsonObject, path: string): string | null => {
    if (validProvenance(row.provenance, `${path}.provenance`)) return `${path}.provenance: invalid fields.`;
    return null;
  };
  const validUnits = validRows(value.units, "units", UNIT_ROW_KEYS, (row, path) =>
    isBoundedString(row.variantId, 80) && isBoundedString(row.units, 80) && rowCommon(row, path) === null ? null : "invalid");
  const validPrices = validRows(value.prices, "prices", MONEY_ROW_KEYS, (row, path) =>
    isBoundedString(row.variantId, 80) && isBoundedString(row.amount, 80) && isBoundedString(row.currencyCode, 8)
      && rowCommon(row, path) === null ? null : "invalid");
  const validCosts = validRows(value.costs, "costs", MONEY_ROW_KEYS, (row, path) =>
    isBoundedString(row.variantId, 80) && isBoundedString(row.amount, 80) && isBoundedString(row.currencyCode, 8)
      && rowCommon(row, path) === null ? null : "invalid");
  const validMoqs = validRows(value.moqs, "moqs", MOQ_ROW_KEYS, (row, path) =>
    validScope(row.scope, `${path}.scope`) === null && isBoundedString(row.unit, 80)
      && isBoundedString(row.minimumUnits, 80) && rowCommon(row, path) === null ? null : "invalid");
  const validCapacityDelivery = validRows(value.capacityDelivery, "capacityDelivery", CAPACITY_DELIVERY_ROW_KEYS, (row, path) =>
    validScope(row.scope, `${path}.scope`) === null && isBoundedString(row.unitsPerPeriod, 80)
      && isBoundedString(row.periodUnit, 80) && isBoundedString(row.minimumPeriods, 80)
      && isBoundedString(row.maximumPeriods, 80) && rowCommon(row, path) === null ? null : "invalid");
  if (!validUnits || !validPrices || !validCosts || !validMoqs || !validCapacityDelivery) {
    return fail("Scenario input rows exceed a list limit or contain malformed fields.");
  }
  const scenario = value as unknown as ScenarioRecord;
  const rowIds = new Set<string>();
  for (const row of [...scenario.units, ...scenario.prices, ...scenario.costs, ...scenario.moqs, ...scenario.capacityDelivery]) {
    const rowId = row.id.toLowerCase();
    if (rowIds.has(rowId)) return fail("Scenario input row IDs must be unique within the scenario.");
    rowIds.add(rowId);
  }
  if (inputRows(scenario) > SCENARIO_INPUT_ROW_LIMIT) {
    return fail(`Scenario input rows exceed the ${SCENARIO_INPUT_ROW_LIMIT}-row limit.`);
  }
  return { ok: true, value: scenario };
}

export function parseScenarioRecords(value: unknown, projectId: string): RecordResult<readonly ScenarioRecord[]> {
  if (!Array.isArray(value)) return fail("Project scenarios must be a list.");
  if (value.length > PROJECT_SCENARIO_RECORD_LIMIT) {
    return fail(`Project scenarios exceed the ${PROJECT_SCENARIO_RECORD_LIMIT}-record limit.`);
  }
  const ids = new Set<string>();
  const records: ScenarioRecord[] = [];
  let totalRows = 0;
  for (const [index, input] of value.entries()) {
    const parsed = parseScenarioRecord(input, projectId);
    if (!parsed.ok) return fail(`scenarios[${index}]: ${parsed.error}`);
    const id = parsed.value.id.toLowerCase();
    if (ids.has(id)) return fail(`scenarios[${index}].id: duplicate project scenario ID.`);
    ids.add(id);
    totalRows += inputRows(parsed.value);
    if (totalRows > PROJECT_SCENARIO_INPUT_ROW_LIMIT) {
      return fail(`Project scenario inputs exceed the ${PROJECT_SCENARIO_INPUT_ROW_LIMIT}-row limit.`);
    }
    records.push(parsed.value);
  }
  return { ok: true, value: records };
}

export function createScenarioWithinProjectLimits(
  candidate: ScenarioRecord,
  existing: readonly ScenarioRecord[],
): RecordResult<ScenarioRecord> {
  if (existing.length >= PROJECT_SCENARIO_RECORD_LIMIT) {
    return fail(`Creating this scenario would exceed the ${PROJECT_SCENARIO_RECORD_LIMIT}-scenario project limit.`);
  }
  const required = scenarioInputRowCount(candidate);
  const used = existing.reduce((total, item) => total + scenarioInputRowCount(item), 0);
  const available = PROJECT_SCENARIO_INPUT_ROW_LIMIT - used;
  if (required > available) {
    return fail(`Creating this scenario needs ${required} rows; ${available} of the ${PROJECT_SCENARIO_INPUT_ROW_LIMIT}-row project limit are available. Reduce or split the collection.`);
  }
  return { ok: true, value: candidate };
}

export function addMissingScenarioVariantRows(
  scenario: ScenarioRecord,
  collection: CollectionRecord,
  projectScenarios: readonly ScenarioRecord[],
  uuid: () => string,
): RecordResult<ScenarioRecord> {
  const variants = collection.skus.flatMap((sku) => sku.variants);
  const unitVariants = new Set(scenario.units.map((row) => row.variantId.toLowerCase()));
  const priceVariants = new Set(scenario.prices.map((row) => row.variantId.toLowerCase()));
  const costVariants = new Set(scenario.costs.map((row) => row.variantId.toLowerCase()));
  const missingUnits = variants.filter((variant) => !unitVariants.has(variant.id.toLowerCase()));
  const missingPrices = variants.filter((variant) => !priceVariants.has(variant.id.toLowerCase()));
  const missingCosts = variants.filter((variant) => !costVariants.has(variant.id.toLowerCase()));
  const required = missingUnits.length + missingPrices.length + missingCosts.length;
  const currentRows = scenarioInputRowCount(scenario);
  const scenarioAvailable = SCENARIO_INPUT_ROW_LIMIT - currentRows;
  const projectRows = projectScenarios.reduce((total, item) => total + scenarioInputRowCount(item), 0);
  const projectAvailable = PROJECT_SCENARIO_INPUT_ROW_LIMIT - projectRows;
  const listAvailable = [
    Math.min(missingUnits.length, SCENARIO_INPUT_LIST_LIMIT - scenario.units.length),
    Math.min(missingPrices.length, SCENARIO_INPUT_LIST_LIMIT - scenario.prices.length),
    Math.min(missingCosts.length, SCENARIO_INPUT_LIST_LIMIT - scenario.costs.length),
  ].reduce((total, count) => total + Math.max(0, count), 0);
  const available = Math.max(0, Math.min(scenarioAvailable, projectAvailable, listAvailable));
  if (required > available) {
    return fail(`Adding missing variants needs ${required} rows; ${available} rows are available under scenario, list and project limits. Reduce or split the collection.`);
  }
  if (required === 0) return { ok: true, value: scenario };
  const blankProvenance = (): ScenarioDraftProvenance => ({ kind: "", sourceLabel: "", asOf: "", validThrough: "" });
  const updated: ScenarioRecord = {
    ...scenario,
    units: [...scenario.units, ...missingUnits.map((variant) => ({ id: uuid(), variantId: variant.id, units: "", provenance: blankProvenance() }))],
    prices: [...scenario.prices, ...missingPrices.map((variant) => ({ id: uuid(), variantId: variant.id, amount: "", currencyCode: "", provenance: blankProvenance() }))],
    costs: [...scenario.costs, ...missingCosts.map((variant) => ({ id: uuid(), variantId: variant.id, amount: "", currencyCode: "", provenance: blankProvenance() }))],
  };
  const parsed = parseScenarioRecord(updated, scenario.projectId);
  return parsed.ok ? parsed : fail(parsed.error);
}

function scenarioContent(record: ScenarioRecord): string {
  const { revision: _revision, createdAt: _createdAt, updatedAt: _updatedAt, ...content } = record;
  return JSON.stringify(content);
}

export function scenarioDraftsAreDirty(
  drafts: readonly ScenarioRecord[],
  saved: readonly ScenarioRecord[],
): boolean {
  return JSON.stringify(drafts) !== JSON.stringify(saved);
}

export function prepareScenarioRecordsForSave(
  drafts: readonly ScenarioRecord[],
  saved: readonly ScenarioRecord[],
  now: string,
  projectId: string,
): RecordResult<readonly ScenarioRecord[]> {
  const timestamp = Date.parse(now);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== now) {
    return fail("Scenario save time must be a canonical UTC ISO timestamp.");
  }
  const savedById = new Map(saved.map((record) => [record.id.toLowerCase(), record] as const));
  const prepared: ScenarioRecord[] = [];
  for (const [index, draft] of drafts.entries()) {
    const parsed = parseScenarioRecord(draft, projectId);
    if (!parsed.ok) return fail(`scenarios[${index}]: ${parsed.error}`);
    const previous = savedById.get(parsed.value.id.toLowerCase());
    if (!previous) {
      prepared.push({ ...parsed.value, revision: 1, createdAt: now, updatedAt: now });
      continue;
    }
    if (scenarioContent(previous) === scenarioContent(parsed.value)) {
      prepared.push(previous);
      continue;
    }
    if (!Number.isSafeInteger(previous.revision + 1)) return fail("Scenario revision is at its maximum supported value.");
    const updated = Math.max(timestamp, Date.parse(previous.updatedAt) + 1, Date.parse(previous.createdAt));
    prepared.push({
      ...parsed.value,
      revision: previous.revision + 1,
      createdAt: previous.createdAt,
      updatedAt: new Date(updated).toISOString(),
    });
  }
  const validated = parseScenarioRecords(prepared, projectId);
  return validated.ok ? validated : fail(validated.error);
}

export function createBlankScenarioRecord(input: {
  readonly id: string;
  readonly projectId: string;
  readonly collection: CollectionRecord;
  readonly name: string;
  readonly now: string;
  readonly uuid: () => string;
}): RecordResult<ScenarioRecord> {
  const variantCount = input.collection.skus.reduce((count, sku) => count + sku.variants.length, 0);
  const neededRows = variantCount * 3;
  if (neededRows > SCENARIO_INPUT_ROW_LIMIT) {
    return fail(`Creating this scenario needs ${neededRows} input rows, above the ${SCENARIO_INPUT_ROW_LIMIT}-row scenario limit. Reduce or split the collection.`);
  }
  const rows = input.collection.skus.flatMap((sku) => sku.variants);
  const provenance: ScenarioDraftProvenance = { kind: "", sourceLabel: "", asOf: "", validThrough: "" };
  const record: ScenarioRecord = {
    schemaVersion: SCENARIO_RECORD_VERSION,
    id: input.id,
    projectId: input.projectId,
    collectionId: input.collection.id,
    name: input.name,
    revision: 1,
    createdAt: input.now,
    updatedAt: input.now,
    evaluationDate: "",
    currencyCode: "",
    units: rows.map((variant) => ({ id: input.uuid(), variantId: variant.id, units: "", provenance: { ...provenance } })),
    prices: rows.map((variant) => ({ id: input.uuid(), variantId: variant.id, amount: "", currencyCode: "", provenance: { ...provenance } })),
    costs: rows.map((variant) => ({ id: input.uuid(), variantId: variant.id, amount: "", currencyCode: "", provenance: { ...provenance } })),
    moqs: [],
    capacityDelivery: [],
  };
  return parseScenarioRecord(record, input.projectId);
}

export function scopeDraftToCalculation(scope: ScenarioDraftScope): ScenarioScope {
  if (scope.kind === "order") return { kind: "order" };
  if (scope.kind === "styleId") return { kind: "styleId", styleId: scope.styleId };
  if (scope.kind === "sku") return { kind: "sku", skuId: scope.skuId };
  if (scope.kind === "colorway") return { kind: "colorway", skuId: scope.skuId, colorwayId: scope.colorwayId };
  if (scope.kind === "variant") return { kind: "variant", variantId: scope.variantId };
  return { ...scope } as unknown as ScenarioScope;
}

export function provenanceDraftToCalculation(provenance: ScenarioDraftProvenance): ScenarioProvenance {
  return {
    kind: provenance.kind as ScenarioProvenance["kind"],
    sourceLabel: provenance.sourceLabel,
    asOf: provenance.asOf,
    ...(provenance.validThrough === "" ? {} : { validThrough: provenance.validThrough }),
  };
}
