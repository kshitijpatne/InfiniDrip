import { describe, expect, it } from "vitest";
import {
  PROJECT_SCENARIO_INPUT_ROW_LIMIT,
  PROJECT_SCENARIO_RECORD_LIMIT,
  SCENARIO_INPUT_LIST_LIMIT,
  SCENARIO_INPUT_ROW_LIMIT,
  addMissingScenarioVariantRows,
  createScenarioWithinProjectLimits,
  createBlankScenarioRecord,
  parseScenarioRecord,
  parseScenarioRecords,
  prepareScenarioRecordsForSave,
  provenanceDraftToCalculation,
  scenarioDraftsAreDirty,
  scenarioInputRowCount,
  scopeDraftToCalculation,
  type ScenarioRecord,
} from "./scenario-records";
import type { CollectionRecord } from "./collection-records";

const PROJECT = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const COLLECTION = "b02b8322-8f57-46bb-9d16-16ac1fcf6811";
const TIME = "2026-10-24T08:00:00.000Z";
let sequence = 1;

function uuid(): string {
  const hex = (sequence++).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

function unitRow(id = uuid()) {
  return { id, variantId: "unresolved-variant", units: "not a number", provenance: {
    kind: "invalid-kind", sourceLabel: "", asOf: "not a date", validThrough: "",
  } };
}

function scenario(overrides: Partial<ScenarioRecord> = {}): ScenarioRecord {
  return {
    schemaVersion: 1,
    id: uuid(),
    projectId: PROJECT,
    collectionId: COLLECTION,
    name: "",
    revision: 1,
    createdAt: TIME,
    updatedAt: TIME,
    evaluationDate: "not a date",
    currencyCode: "",
    units: [],
    prices: [],
    costs: [],
    moqs: [],
    capacityDelivery: [],
    ...overrides,
  };
}

function repeatedRows(count: number, builder: (id: string) => unknown = (id) => unitRow(id)) {
  return Array.from({ length: count }, () => builder(uuid()));
}

function collection(variantCount: number): CollectionRecord {
  const variants = Array.from({ length: variantCount }, (_, index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    skuCode: `TEE-${index + 1}`,
    sizeId: `size-${index}`,
    colorwayId: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  }));
  return {
    schemaVersion: 1,
    id: COLLECTION,
    projectId: PROJECT,
    name: "Collection",
    createdAt: TIME,
    updatedAt: TIME,
    revision: 1,
    skus: [{
      id: "30000000-0000-4000-8000-000000000001",
      code: "TEE",
      name: "Tee",
      styleId: "40000000-0000-4000-8000-000000000001",
      styleRevisionId: "50000000-0000-4000-8000-000000000001",
      sizePlan: { id: "60000000-0000-4000-8000-000000000001", name: "Sizes", sizeIds: ["size-0"] },
      colorways: [],
      variants,
    }],
    sharedMaterialGroups: [],
  };
}

describe("bounded scenario records", () => {
  it("preserves bounded invalid business text and UUID-shaped orphan references", () => {
    const value = scenario({ units: [unitRow()] });
    expect(parseScenarioRecord(value, PROJECT)).toEqual({ ok: true, value });
    const cost = {
      id: uuid(), variantId: "orphan-variant", amount: "raw amount", currencyCode: "unknown",
      provenance: { kind: "unknown", sourceLabel: "", asOf: "raw date", validThrough: "" },
    };
    expect(parseScenarioRecord(scenario({ costs: [{ ...cost, currencyCode: "x".repeat(9) }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ costs: [cost] })).ok).toBe(true);
    expect(parseScenarioRecord(scenario({ units: [{ ...unitRow(), id: "invalid-row-id" }] })).ok).toBe(false);
    const duplicateRow = unitRow();
    expect(parseScenarioRecord(scenario({ units: [duplicateRow, { ...duplicateRow }] })).ok).toBe(false);
    expect(parseScenarioRecord(value, "c02b8322-8f57-46bb-9d16-16ac1fcf6811").ok).toBe(false);
    expect(scenarioInputRowCount(value)).toBe(1);
  });

  it("requires an exact top-level shape and valid identity, revision, and canonical time", () => {
    const valid = scenario();
    expect(parseScenarioRecord(null).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, extra: true }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, name: "x".repeat(81) }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, id: "bad" }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, projectId: "bad" }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, collectionId: "bad" }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, revision: 0 }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, createdAt: "yesterday" }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, createdAt: 123 as unknown as string }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, updatedAt: "2026-10-23T08:00:00.000Z" }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, evaluationDate: "x".repeat(33) }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, currencyCode: "x".repeat(9) }).ok).toBe(false);
    expect(parseScenarioRecord({ ...valid, schemaVersion: 2 }).ok).toBe(false);
  });

  it("accepts every bounded text field at its limit and rejects one character over", () => {
    const provenance = {
      kind: "k".repeat(40), sourceLabel: "s".repeat(120), asOf: "a".repeat(32), validThrough: "v".repeat(32),
    };
    const scope = {
      kind: "k".repeat(40), styleId: "s".repeat(80), skuId: "u".repeat(80),
      colorwayId: "c".repeat(80), variantId: "v".repeat(80),
    };
    const atLimit = scenario({
      name: "n".repeat(80), evaluationDate: "d".repeat(32), currencyCode: "c".repeat(8),
      units: [{ id: uuid(), variantId: "v".repeat(80), units: "1".repeat(80), provenance }],
      prices: [{ id: uuid(), variantId: "v".repeat(80), amount: "1".repeat(80), currencyCode: "c".repeat(8), provenance }],
      costs: [{ id: uuid(), variantId: "v".repeat(80), amount: "1".repeat(80), currencyCode: "c".repeat(8), provenance }],
      moqs: [{ id: uuid(), scope, unit: "u".repeat(80), minimumUnits: "1".repeat(80), provenance }],
      capacityDelivery: [{
        id: uuid(), scope, unitsPerPeriod: "1".repeat(80), periodUnit: "p".repeat(80),
        minimumPeriods: "1".repeat(80), maximumPeriods: "9".repeat(80), provenance,
      }],
    });
    expect(parseScenarioRecord(atLimit).ok).toBe(true);

    const oneOver = [
      scenario({ name: "n".repeat(81) }),
      scenario({ evaluationDate: "d".repeat(33) }),
      scenario({ currencyCode: "c".repeat(9) }),
      scenario({ units: [{ ...unitRow(), variantId: "v".repeat(81) }] }),
      scenario({ units: [{ ...unitRow(), units: "1".repeat(81) }] }),
      scenario({ units: [{ ...unitRow(), provenance: { ...provenance, kind: "k".repeat(41) } }] }),
      scenario({ units: [{ ...unitRow(), provenance: { ...provenance, sourceLabel: "s".repeat(121) } }] }),
      scenario({ units: [{ ...unitRow(), provenance: { ...provenance, asOf: "a".repeat(33) } }] }),
      scenario({ units: [{ ...unitRow(), provenance: { ...provenance, validThrough: "v".repeat(33) } }] }),
      scenario({ prices: [{ id: uuid(), variantId: "v".repeat(81), amount: "", currencyCode: "", provenance }] }),
      scenario({ prices: [{ id: uuid(), variantId: "v", amount: "1".repeat(81), currencyCode: "", provenance }] }),
      scenario({ prices: [{ id: uuid(), variantId: "v", amount: "", currencyCode: "c".repeat(9), provenance }] }),
      scenario({ costs: [{ id: uuid(), variantId: "v".repeat(81), amount: "", currencyCode: "", provenance }] }),
      scenario({ costs: [{ id: uuid(), variantId: "v", amount: "1".repeat(81), currencyCode: "", provenance }] }),
      scenario({ costs: [{ id: uuid(), variantId: "v", amount: "", currencyCode: "c".repeat(9), provenance }] }),
      ...["kind", "styleId", "skuId", "colorwayId", "variantId"].map((field) => scenario({ moqs: [{
        id: uuid(), scope: { ...scope, [field]: "x".repeat(field === "kind" ? 41 : 81) },
        unit: "garment", minimumUnits: "1", provenance,
      }] })),
      scenario({ moqs: [{ id: uuid(), scope, unit: "u".repeat(81), minimumUnits: "1", provenance }] }),
      scenario({ moqs: [{ id: uuid(), scope, unit: "garment", minimumUnits: "1".repeat(81), provenance }] }),
      ...["unitsPerPeriod", "periodUnit", "minimumPeriods", "maximumPeriods"].map((field) => scenario({ capacityDelivery: [{
        id: uuid(), scope, unitsPerPeriod: "1", periodUnit: "week", minimumPeriods: "1", maximumPeriods: "2",
        [field]: "x".repeat(81), provenance,
      }] })),
    ];
    for (const candidate of oneOver) expect(parseScenarioRecord(candidate).ok).toBe(false);
  });

  it("enforces exact nested keys, primitive types, text bounds, and row IDs across lists", () => {
    const valid = scenario({ units: [unitRow()] });
    const row = valid.units[0]!;
    expect(parseScenarioRecord(scenario({ units: [{ ...row, extra: true } as unknown as ScenarioRecord["units"][number]] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: [{ ...row, variantId: "x".repeat(81) }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: [{ ...row, units: "x".repeat(81) }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: [{ ...row, provenance: { ...row.provenance, sourceLabel: "x".repeat(121) } }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: [{ ...row, provenance: { ...row.provenance, unknown: true } as unknown as ScenarioRecord["units"][number]["provenance"] }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: [row], prices: [{
      id: row.id, variantId: "v", amount: "1.25", currencyCode: "USD", provenance: row.provenance,
    }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ prices: [{
      id: uuid(), variantId: "v", amount: "x".repeat(81), currencyCode: "USD", provenance: row.provenance,
    }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ units: "not an array" as unknown as ScenarioRecord["units"] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ moqs: [{
      id: uuid(), scope: { kind: "order", styleId: "", skuId: "", colorwayId: "", variantId: "", extra: true } as unknown as ScenarioRecord["moqs"][number]["scope"],
      unit: "garment", minimumUnits: "1", provenance: row.provenance,
    }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ moqs: [{
      id: uuid(), scope: { kind: "order", styleId: "x".repeat(81), skuId: "", colorwayId: "", variantId: "" },
      unit: "garment", minimumUnits: "1", provenance: row.provenance,
    }] })).ok).toBe(false);
    expect(parseScenarioRecord(scenario({ capacityDelivery: [{
      id: uuid(), scope: { kind: "order", styleId: "", skuId: "", colorwayId: "", variantId: "" },
      unitsPerPeriod: "1", periodUnit: "week", minimumPeriods: "1", maximumPeriods: "2",
      provenance: { ...row.provenance, asOf: "x".repeat(33) },
    }] })).ok).toBe(false);
  });

  it("enforces per-list, per-scenario and project row budgets at the boundary", () => {
    const listBoundary = scenario({ units: repeatedRows(SCENARIO_INPUT_LIST_LIMIT) as ScenarioRecord["units"] });
    expect(parseScenarioRecord(listBoundary).ok).toBe(true);
    expect(parseScenarioRecord(scenario({ units: repeatedRows(SCENARIO_INPUT_LIST_LIMIT + 1) as ScenarioRecord["units"] })).ok).toBe(false);

    const scenarioBoundary = scenario({
      units: repeatedRows(250) as ScenarioRecord["units"],
      prices: repeatedRows(250, (id) => ({
        id, variantId: "v", amount: "", currencyCode: "", provenance: { kind: "", sourceLabel: "", asOf: "", validThrough: "" },
      })) as ScenarioRecord["prices"],
    });
    expect(scenarioInputRowCount(scenarioBoundary)).toBe(SCENARIO_INPUT_ROW_LIMIT);
    expect(parseScenarioRecord(scenarioBoundary).ok).toBe(true);
    expect(parseScenarioRecord({ ...scenarioBoundary, costs: [{
      id: uuid(), variantId: "v", amount: "", currencyCode: "", provenance: { kind: "", sourceLabel: "", asOf: "", validThrough: "" },
    }] }).ok).toBe(false);

    const atProjectLimit = [scenarioBoundary, scenario({
      units: repeatedRows(500) as ScenarioRecord["units"],
    })];
    expect(atProjectLimit.reduce((total, item) => total + scenarioInputRowCount(item), 0)).toBe(PROJECT_SCENARIO_INPUT_ROW_LIMIT);
    expect(parseScenarioRecords(atProjectLimit, PROJECT).ok).toBe(true);
    expect(parseScenarioRecords([...atProjectLimit, scenario()], PROJECT).ok).toBe(true);
    expect(parseScenarioRecords([
      scenario({ units: repeatedRows(500) as ScenarioRecord["units"] }),
      scenario({ units: repeatedRows(500) as ScenarioRecord["units"] }),
      scenario({ units: [unitRow()] }),
    ], PROJECT).ok).toBe(false);
  });

  it("enforces scenario count and case-insensitive project identity", () => {
    const records = Array.from({ length: PROJECT_SCENARIO_RECORD_LIMIT }, () => scenario());
    expect(parseScenarioRecords(records, PROJECT).ok).toBe(true);
    expect(parseScenarioRecords([...records, scenario()], PROJECT).ok).toBe(false);
    expect(parseScenarioRecords([records[0]!, { ...records[1]!, id: records[0]!.id.toUpperCase() }], PROJECT).ok).toBe(false);
    expect(parseScenarioRecords([{ ...records[0]!, revision: 0 }], PROJECT).ok).toBe(false);
    expect(parseScenarioRecords(null, PROJECT).ok).toBe(false);
  });

  it("seeds exactly three blank rows per variant and blocks creation above the scenario cap", () => {
    const seeded = createBlankScenarioRecord({
      id: uuid(), projectId: PROJECT, collection: collection(2), name: "Scenario", now: TIME, uuid,
    });
    expect(seeded.ok).toBe(true);
    if (seeded.ok) {
      expect(seeded.value.units).toHaveLength(2);
      expect(seeded.value.prices).toHaveLength(2);
      expect(seeded.value.costs).toHaveLength(2);
      expect(scenarioInputRowCount(seeded.value)).toBe(6);
      expect(seeded.value.units.every((row) => row.units === "" && row.provenance.sourceLabel === "")).toBe(true);
    }
    const maxSeed = createBlankScenarioRecord({
      id: uuid(), projectId: PROJECT, collection: collection(166), name: "Max", now: TIME, uuid,
    });
    expect(maxSeed.ok).toBe(true);
    expect(createBlankScenarioRecord({
      id: uuid(), projectId: PROJECT, collection: collection(167), name: "Too many", now: TIME, uuid,
    })).toMatchObject({ ok: false, error: expect.stringContaining("501") });
  });

  it("preflights new scenarios and missing variant rows atomically against every aggregate cap", () => {
    const empty = scenario();
    expect(createScenarioWithinProjectLimits(empty, Array.from({ length: PROJECT_SCENARIO_RECORD_LIMIT }, () => scenario())).ok).toBe(false);
    const projectFull = [
      scenario({ units: repeatedRows(500) as ScenarioRecord["units"] }),
      scenario({ units: repeatedRows(500) as ScenarioRecord["units"] }),
    ];
    expect(createScenarioWithinProjectLimits(scenario({ units: [unitRow()] }), projectFull).ok).toBe(false);
    expect(createScenarioWithinProjectLimits(empty, projectFull).ok).toBe(true);

    const collectionWithOne = collection(1);
    const missing = addMissingScenarioVariantRows(empty, collectionWithOne, [empty], uuid);
    expect(missing.ok).toBe(true);
    if (missing.ok) {
      expect(scenarioInputRowCount(missing.value)).toBe(3);
      expect(missing.value.units[0]?.units).toBe("");
      expect(missing.value.prices[0]?.amount).toBe("");
      expect(missing.value.costs[0]?.amount).toBe("");
      const unchanged = addMissingScenarioVariantRows(missing.value, collectionWithOne, [missing.value], uuid);
      expect(unchanged.ok && unchanged.value).toBe(missing.value);
    }
    const targetVariantId = collectionWithOne.skus[0]!.variants[0]!.id;
    const unitsOnly = scenario({ units: [{ ...unitRow(), variantId: targetVariantId }] });
    const repairedLists = addMissingScenarioVariantRows(unitsOnly, collectionWithOne, [unitsOnly], uuid);
    expect(repairedLists).toMatchObject({ ok: true });
    if (repairedLists.ok) {
      expect(repairedLists.value.units).toEqual(unitsOnly.units);
      expect(repairedLists.value.prices).toHaveLength(1);
      expect(repairedLists.value.prices[0]).toMatchObject({ variantId: targetVariantId, amount: "" });
      expect(repairedLists.value.costs).toHaveLength(1);
      expect(repairedLists.value.costs[0]).toMatchObject({ variantId: targetVariantId, amount: "" });
    }
    const scenarioNearLimit = scenario({ units: repeatedRows(498) as ScenarioRecord["units"] });
    expect(addMissingScenarioVariantRows(scenarioNearLimit, collectionWithOne, [scenarioNearLimit], uuid)).toMatchObject({
      ok: false, error: expect.stringContaining("needs 3 rows"),
    });
    expect(addMissingScenarioVariantRows(empty, collectionWithOne, [empty], () => "70000000-0000-4000-8000-000000000001")).toMatchObject({
      ok: false, error: expect.stringContaining("unique within the scenario"),
    });
    const projectNearLimit = scenario({ units: repeatedRows(498) as ScenarioRecord["units"] });
    const projectPeer = scenario({ units: repeatedRows(500) as ScenarioRecord["units"] });
    expect(addMissingScenarioVariantRows(projectNearLimit, collectionWithOne, [projectNearLimit, projectPeer], uuid)).toMatchObject({
      ok: false, error: expect.stringContaining("available"),
    });
  });

  it("prepares revisions once, preserves no-op metadata, rejects bad clocks, and tracks dirty drafts", () => {
    const initial = scenario();
    const created = prepareScenarioRecordsForSave([initial], [], TIME, PROJECT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value[0]).toMatchObject({ revision: 1, createdAt: TIME, updatedAt: TIME });
    const unchanged = prepareScenarioRecordsForSave(created.value, created.value, "2026-10-24T09:00:00.000Z", PROJECT);
    expect(unchanged.ok && unchanged.value).toEqual(created.value);
    expect(prepareScenarioRecordsForSave([initial], [], "tomorrow", PROJECT).ok).toBe(false);
    expect(scenarioDraftsAreDirty(created.value, created.value)).toBe(false);
    expect(scenarioDraftsAreDirty([scenario({ ...initial, name: "Changed" })], created.value)).toBe(true);
    const changed = prepareScenarioRecordsForSave([scenario({ ...initial, name: "Changed" })], created.value, TIME, PROJECT);
    expect(changed).toMatchObject({ ok: true, value: [{ revision: 2, createdAt: TIME, updatedAt: "2026-10-24T08:00:00.001Z" }] });
    const exhausted = [{ ...created.value[0]!, revision: Number.MAX_SAFE_INTEGER }];
    expect(prepareScenarioRecordsForSave([scenario({ ...initial, name: "Changed" })], exhausted, TIME, PROJECT).ok).toBe(false);
    expect(prepareScenarioRecordsForSave([scenario({ ...initial, id: "bad" })], [], TIME, PROJECT).ok).toBe(false);
    const duplicate = { ...initial };
    expect(prepareScenarioRecordsForSave([initial, duplicate], [], TIME, PROJECT).ok).toBe(false);
  });

  it("adapts every supported scope and omits or preserves optional validity dates", () => {
    expect(scopeDraftToCalculation({ kind: "order", styleId: "s", skuId: "k", colorwayId: "c", variantId: "v" }))
      .toEqual({ kind: "order" });
    expect(scopeDraftToCalculation({ kind: "styleId", styleId: "s", skuId: "", colorwayId: "", variantId: "" }))
      .toEqual({ kind: "styleId", styleId: "s" });
    expect(scopeDraftToCalculation({ kind: "sku", styleId: "", skuId: "k", colorwayId: "", variantId: "" }))
      .toEqual({ kind: "sku", skuId: "k" });
    expect(scopeDraftToCalculation({ kind: "colorway", styleId: "", skuId: "k", colorwayId: "c", variantId: "" }))
      .toEqual({ kind: "colorway", skuId: "k", colorwayId: "c" });
    expect(scopeDraftToCalculation({ kind: "variant", styleId: "", skuId: "", colorwayId: "", variantId: "v" }))
      .toEqual({ kind: "variant", variantId: "v" });
    expect(scopeDraftToCalculation({ kind: "raw-scope", styleId: "s", skuId: "k", colorwayId: "c", variantId: "v" }))
      .toEqual({ kind: "raw-scope", styleId: "s", skuId: "k", colorwayId: "c", variantId: "v" });
    expect(provenanceDraftToCalculation({ kind: "bad", sourceLabel: "", asOf: "bad", validThrough: "" }))
      .toEqual({ kind: "bad", sourceLabel: "", asOf: "bad" });
    expect(provenanceDraftToCalculation({ kind: "user-input", sourceLabel: "Plan", asOf: "2026-10-01", validThrough: "2026-11-01" }))
      .toMatchObject({ kind: "user-input", validThrough: "2026-11-01" });
  });
});
