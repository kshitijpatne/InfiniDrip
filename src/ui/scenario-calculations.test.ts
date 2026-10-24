import { describe, expect, it } from "vitest";
import { COLLECTION_RECORD_VERSION, type CollectionRecord } from "./collection-records";
import {
  calculateScenario,
  type ScenarioCalculationResult,
  type ScenarioInput,
  type ScenarioProvenance,
  type ScenarioScope,
} from "./scenario-calculations";

const ID = {
  collection: "21000000-0000-4000-8000-000000000001",
  project: "21000000-0000-4000-8000-000000000002",
  sku: "21000000-0000-4000-8000-000000000003",
  style: "21000000-0000-4000-8000-000000000004",
  revision: "21000000-0000-4000-8000-000000000005",
  sizePlan: "21000000-0000-4000-8000-000000000006",
  colorway: "21000000-0000-4000-8000-000000000007",
  sourceColorway: "21000000-0000-4000-8000-000000000008",
  unusedColorway: "21000000-0000-4000-8000-000000000011",
  unusedSourceColorway: "21000000-0000-4000-8000-000000000012",
  variantOne: "21000000-0000-4000-8000-000000000009",
  variantTwo: "21000000-0000-4000-8000-000000000010",
} as const;

const EVALUATION_DATE = "2026-10-24";

function collection(): CollectionRecord {
  return {
    schemaVersion: COLLECTION_RECORD_VERSION,
    id: ID.collection,
    projectId: ID.project,
    name: "Autumn Study",
    createdAt: "2026-10-24T00:00:00.000Z",
    updatedAt: "2026-10-24T00:00:00.000Z",
    revision: 1,
    skus: [{
      id: ID.sku,
      code: "TEE-01",
      name: "Everyday tee",
      styleId: ID.style,
      styleRevisionId: ID.revision,
      sizePlan: { id: ID.sizePlan, name: "Alpha sizes", sizeIds: ["S", "M"] },
      colorways: [{ id: ID.colorway, name: "Ink", sourceColorwayId: ID.sourceColorway }],
      variants: [
        { id: ID.variantOne, skuCode: "TEE-INK-S", sizeId: "S", colorwayId: ID.colorway },
        { id: ID.variantTwo, skuCode: "TEE-INK-M", sizeId: "M", colorwayId: ID.colorway },
      ],
    }],
    sharedMaterialGroups: [],
  };
}

function provenance(overrides: Partial<ScenarioProvenance> = {}): ScenarioProvenance {
  return {
    kind: "user-input",
    sourceLabel: "Supplier quote",
    asOf: "2026-10-20",
    validThrough: EVALUATION_DATE,
    ...overrides,
  };
}

function scenario(overrides: Partial<ScenarioInput> = {}): ScenarioInput {
  return {
    currencyCode: "USD",
    units: [
      { variantId: ID.variantOne, units: 2, provenance: provenance() },
      { variantId: ID.variantTwo, units: 1, provenance: provenance() },
    ],
    prices: [
      { variantId: ID.variantOne, amount: "12.500", currencyCode: "USD", provenance: provenance() },
      { variantId: ID.variantTwo, amount: "0.5", currencyCode: "USD", provenance: provenance() },
    ],
    costs: [
      { variantId: ID.variantOne, amount: "8.000000", currencyCode: "USD", provenance: provenance() },
      { variantId: ID.variantTwo, amount: "0.75", currencyCode: "USD", provenance: provenance() },
    ],
    moqs: [{ scope: { kind: "order" }, unit: "garment", minimumUnits: 3, provenance: provenance() }],
    capacities: [{ scope: { kind: "order" }, unitsPerPeriod: 2, periodUnit: "calendar-week", provenance: provenance() }],
    deliveries: [{ scope: { kind: "order" }, minimumPeriods: 1, maximumPeriods: 3, periodUnit: "calendar-week", provenance: provenance() }],
    ...overrides,
  };
}

function evaluate(input: unknown = scenario(), source: unknown = collection(), date: unknown = EVALUATION_DATE): ScenarioCalculationResult {
  return calculateScenario(source, input as ScenarioInput, date as string);
}

function codes(result: ScenarioCalculationResult): string[] {
  return result.blockers.map((blocker) => blocker.code);
}

function units(one: number, two: number): ScenarioInput["units"] {
  return [
    { variantId: ID.variantOne, units: one, provenance: provenance() },
    { variantId: ID.variantTwo, units: two, provenance: provenance() },
  ];
}

function withPlan(input: ScenarioInput, plan: ScenarioScope, minimumUnits = 3): ScenarioInput {
  return { ...input, moqs: [{ scope: plan, unit: "garment", minimumUnits, provenance: provenance() }] };
}

describe("deterministic scenario calculations", () => {
  it("computes canonical exact unit economics, totals and inclusive constraint results without mutating inputs", () => {
    const input = scenario();
    const originalCollection = structuredClone(collection());
    const originalInput = structuredClone(input);
    const result = evaluate(input, originalCollection);

    expect(result.state).toBe("complete");
    expect(result.blockers).toEqual([]);
    expect(result.financialSummary).toEqual({
      currencyCode: "USD",
      totalUnits: "3",
      totalPrice: "25.5",
      totalCost: "16.75",
      totalMargin: "8.75",
      variants: [
        { variantId: ID.variantOne, plannedUnits: "2", unitPrice: "12.5", unitCost: "8", unitMargin: "4.5", extendedMargin: "9" },
        { variantId: ID.variantTwo, plannedUnits: "1", unitPrice: "0.5", unitCost: "0.75", unitMargin: "-0.25", extendedMargin: "-0.25" },
      ],
    });
    expect(result.moqResults[0]).toMatchObject({ ok: true, value: { plannedUnits: "3", minimumUnits: "3", shortfallUnits: "0", outcome: "meets" } });
    expect(result.capacityResults[0]).toMatchObject({ ok: true, value: { plannedUnits: "3", minimumCapacityUnits: "2", maximumCapacityUnits: "6", outcome: "within-maximum-window" } });
    expect(result.sourceStatuses.every((sourceStatus) => sourceStatus.status === "current")).toBe(true);
    expect(originalCollection).toEqual(collection());
    expect(input).toEqual(originalInput);
  });

  it.each([
    [".5"], ["00.5"], ["12."], ["-1"], ["+1"], ["1e2"], ["1,000"], ["1.1234567"], ["1234567890123"],
  ])("rejects noncanonical decimal amount %s", (amount) => {
    const input = scenario({ prices: [{ variantId: ID.variantOne, amount, currencyCode: "USD", provenance: provenance() }, scenario().prices[1]] });
    const result = evaluate(input);
    expect(result.state).toBe("blocked");
    expect(result.financialSummary).toBeNull();
    expect(codes(result)).toContain("MONEY_AMOUNT_INVALID");
  });

  it("keeps zero quantities and zero amounts explicit and formats negative zero as zero", () => {
    const base = scenario();
    const result = evaluate({
      ...base,
      units: units(0, 0),
      prices: base.prices.map((row) => ({ ...row, amount: "0" })),
      costs: base.costs.map((row) => ({ ...row, amount: "0" })),
      moqs: [{ scope: { kind: "order" }, unit: "garment", minimumUnits: 1, provenance: provenance() }],
      capacities: [{ scope: { kind: "order" }, unitsPerPeriod: 0, periodUnit: "calendar-day", provenance: provenance() }],
      deliveries: [{ scope: { kind: "order" }, minimumPeriods: 1, maximumPeriods: 1, periodUnit: "calendar-day", provenance: provenance() }],
    });
    expect(result.state).toBe("complete");
    expect(result.financialSummary?.totalMargin).toBe("0");
    expect(result.financialSummary?.variants[0].unitMargin).toBe("0");
    expect(result.moqResults[0]).toMatchObject({ ok: true, value: { plannedUnits: "0", shortfallUnits: "1", outcome: "below" } });
    expect(result.capacityResults[0]).toMatchObject({ ok: true, value: { minimumCapacityUnits: "0", outcome: "within-minimum-window" } });
  });

  it("uses BigInt for extended amounts and capacity products beyond safe-number precision", () => {
    const maxSafe = Number.MAX_SAFE_INTEGER;
    const base = scenario();
    const result = evaluate({
      ...base,
      units: units(maxSafe, maxSafe),
      prices: base.prices.map((row) => ({ ...row, amount: "999999999999.999999" })),
      costs: base.costs.map((row) => ({ ...row, amount: "0" })),
      moqs: [{ scope: { kind: "order" }, unit: "garment", minimumUnits: maxSafe, provenance: provenance() }],
      capacities: [{ scope: { kind: "order" }, unitsPerPeriod: maxSafe, periodUnit: "calendar-week", provenance: provenance() }],
      deliveries: [{ scope: { kind: "order" }, minimumPeriods: maxSafe, maximumPeriods: maxSafe, periodUnit: "calendar-week", provenance: provenance() }],
    });
    const total = BigInt(maxSafe) * 2n;
    const totalPrice = total * 999999999999999999n;
    expect(result.financialSummary?.totalUnits).toBe(total.toString());
    expect(result.financialSummary?.totalPrice).toBe((totalPrice / 1_000_000n).toString() + "." + (totalPrice % 1_000_000n).toString().padStart(6, "0"));
    expect(result.capacityResults[0]).toMatchObject({ ok: true, value: { maximumCapacityUnits: (BigInt(maxSafe) * BigInt(maxSafe)).toString() } });
  });

  it("blocks a currency mismatch on each mismatched price or cost and provides no financial summary", () => {
    const base = scenario();
    const result = evaluate({
      ...base,
      prices: [{ ...base.prices[0], currencyCode: "EUR" }, base.prices[1]],
      costs: [{ ...base.costs[0], currencyCode: "GBP" }, base.costs[1]],
    });
    expect(result.financialSummary).toBeNull();
    expect(result.blockers.filter((blocker) => blocker.code === "CURRENCY_MISMATCH").map((blocker) => blocker.path)).toEqual([
      "scenario.prices[0].currencyCode", "scenario.costs[0].currencyCode",
    ]);
  });

  it("rejects malformed scenario and entry currency codes", () => {
    const base = scenario();
    const scenarioCurrency = evaluate({ ...base, currencyCode: "usd" });
    const entryCurrency = evaluate({ ...base, prices: [{ ...base.prices[0], currencyCode: "US" }, base.prices[1]] });
    expect(codes(scenarioCurrency)).toContain("CURRENCY_FORMAT_INVALID");
    expect(codes(entryCurrency)).toContain("CURRENCY_FORMAT_INVALID");
    expect(scenarioCurrency.financialSummary).toBeNull();
    expect(entryCurrency.financialSummary).toBeNull();
  });

  it("requires one planned-unit row per variant and rejects duplicate, unknown and malformed references", () => {
    const base = scenario();
    const missing = evaluate({ ...base, units: [base.units[0]] });
    const duplicate = evaluate({ ...base, units: [base.units[0], base.units[0], base.units[1]] });
    const unknown = evaluate({ ...base, units: [...base.units, { ...base.units[0], variantId: "not-a-variant" }] });
    const malformed = evaluate({ ...base, units: [null, base.units[1]] });
    expect(codes(missing)).toContain("VARIANT_ROW_MISSING");
    expect(codes(duplicate)).toContain("VARIANT_REFERENCE_DUPLICATE");
    expect(codes(unknown)).toContain("VARIANT_REFERENCE_UNKNOWN");
    expect(codes(malformed)).toContain("VARIANT_REFERENCE_REQUIRED");
    for (const result of [missing, duplicate, unknown, malformed]) expect(result.financialSummary).toBeNull();
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid planned garment units %s", (value) => {
    const base = scenario();
    const result = evaluate({ ...base, units: [{ ...base.units[0], units: value }, base.units[1]] });
    expect(codes(result)).toContain("PLANNED_UNITS_INVALID");
    expect(result.financialSummary).toBeNull();
  });

  it("requires the three financial and unit input lists", () => {
    const base = scenario();
    const result = evaluate({ ...base, units: undefined, prices: undefined, costs: undefined });
    expect(codes(result)).toContain("INPUT_LIST_REQUIRED");
    expect(codes(result)).toContain("VARIANT_ROW_MISSING");
    expect(result.financialSummary).toBeNull();
  });

  it.each([
    [{ kind: "styleId", styleId: ID.style } as ScenarioScope, "3", "meets"],
    [{ kind: "sku", skuId: ID.sku } as ScenarioScope, "3", "meets"],
    [{ kind: "colorway", skuId: ID.sku, colorwayId: ID.colorway } as ScenarioScope, "3", "meets"],
    [{ kind: "variant", variantId: ID.variantOne } as ScenarioScope, "2", "below"],
  ])("compares a supported MOQ scope %#", (scope, plannedUnits, outcome) => {
    const result = evaluate(withPlan(scenario(), scope, 3));
    expect(result.moqResults[0]).toMatchObject({ ok: true, value: { plannedUnits, outcome } });
  });

  it("blocks unsupported MOQ units, bases, references and quantities with repair paths", () => {
    const base = scenario();
    const unsupported = evaluate({ ...base, moqs: [{ scope: { kind: "material", materialId: "fabric" }, unit: "meter", minimumUnits: 0, provenance: provenance() }] as unknown as ScenarioInput["moqs"] });
    const unknownStyle = evaluate(withPlan(scenario(), { kind: "styleId", styleId: "missing" } as unknown as ScenarioScope));
    const unknownSku = evaluate(withPlan(scenario(), { kind: "sku", skuId: "missing" } as unknown as ScenarioScope));
    const unknownColorway = evaluate(withPlan(scenario(), { kind: "colorway", skuId: ID.sku, colorwayId: "missing" } as unknown as ScenarioScope));
    const unknownColorwaySku = evaluate(withPlan(scenario(), { kind: "colorway", skuId: "missing", colorwayId: ID.colorway } as unknown as ScenarioScope));
    const unknownVariant = evaluate(withPlan(scenario(), { kind: "variant", variantId: "missing" } as unknown as ScenarioScope));
    expect(codes(unsupported)).toEqual(expect.arrayContaining(["SCOPE_UNSUPPORTED", "MOQ_UNIT_UNSUPPORTED", "MOQ_MINIMUM_INVALID"]));
    for (const result of [unknownStyle, unknownSku, unknownColorway, unknownVariant]) expect(codes(result)).toContain("SCOPE_REFERENCE_UNKNOWN");
    expect(unknownColorwaySku.blockers).toContainEqual(expect.objectContaining({ path: "scenario.moqs[0].scope.skuId", code: "SCOPE_REFERENCE_UNKNOWN" }));
    expect(unsupported.moqResults[0]?.ok).toBe(false);
  });

  it("compares a declared SKU-local colorway with no planned variants as zero units", () => {
    const source = collection();
    const sku = source.skus[0];
    const sourceWithUnusedColorway: CollectionRecord = {
      ...source,
      skus: [{
        ...sku,
        colorways: [...sku.colorways, { id: ID.unusedColorway, name: "Unused", sourceColorwayId: ID.unusedSourceColorway }],
      }],
    };
    const result = evaluate(withPlan(scenario(), { kind: "colorway", skuId: ID.sku, colorwayId: ID.unusedColorway }), sourceWithUnusedColorway);
    expect(result.moqResults[0]).toMatchObject({ ok: true, value: { plannedUnits: "0", minimumUnits: "3", shortfallUnits: "3", outcome: "below" } });
  });

  it("names malformed MOQ rows and missing scopes", () => {
    const base = scenario();
    const malformed = evaluate({ ...base, moqs: [null] as unknown as ScenarioInput["moqs"] });
    const missingScope = evaluate({ ...base, moqs: [{ unit: "garment", minimumUnits: 1, provenance: provenance() }] as unknown as ScenarioInput["moqs"] });
    expect(codes(malformed)).toContain("MOQ_ROW_INVALID");
    expect(codes(missingScope)).toContain("SCOPE_REQUIRED");
    expect(malformed.moqResults[0]?.ok).toBe(false);
    expect(missingScope.moqResults[0]?.ok).toBe(false);
  });

  it("reports absent MOQ input and keeps a valid summary partial", () => {
    const result = evaluate(scenario({ moqs: [] }));
    expect(result.state).toBe("partial");
    expect(result.financialSummary).not.toBeNull();
    expect(codes(result)).toContain("MOQ_INPUT_NOT_PROVIDED");
  });

  it("treats an omitted MOQ list as absent input", () => {
    const result = evaluate(scenario({ moqs: undefined }));
    expect(result.state).toBe("partial");
    expect(result.financialSummary).not.toBeNull();
    expect(codes(result)).toContain("MOQ_INPUT_NOT_PROVIDED");
  });

  it.each([
    [units(1, 1), "within-minimum-window"],
    [units(1, 2), "within-maximum-window"],
    [units(3, 4), "exceeds-maximum-window"],
  ])("uses inclusive capacity envelope thresholds %#", (planned, outcome) => {
    const result = evaluate(scenario({ units: planned }));
    expect(result.capacityResults[0]).toMatchObject({ ok: true, value: { outcome } });
  });

  it("requires an exact scope and period-unit capacity/delivery pair", () => {
    const base = scenario();
    const missingDelivery = evaluate({ ...base, deliveries: [] });
    const missingCapacity = evaluate({ ...base, capacities: [] });
    const mismatchedPeriod = evaluate({ ...base, deliveries: [{ ...base.deliveries![0], periodUnit: "calendar-day" }] });
    expect(codes(missingDelivery)).toContain("CAPACITY_PAIR_MISSING");
    expect(codes(missingDelivery)).toContain("CAPACITY_INPUT_NOT_PROVIDED");
    expect(codes(missingCapacity)).toContain("CAPACITY_PAIR_MISSING");
    expect(codes(missingCapacity)).toContain("CAPACITY_INPUT_NOT_PROVIDED");
    expect(codes(mismatchedPeriod)).toContain("CAPACITY_PERIOD_UNIT_MISMATCH");
    expect(mismatchedPeriod.state).toBe("partial");
  });

  it("retains an unmatched same-scope delivery with a different period unit after a valid pair", () => {
    const base = scenario();
    const extraDelivery = { ...base.deliveries![0], periodUnit: "calendar-day" };
    const result = evaluate({ ...base, deliveries: [...base.deliveries!, extraDelivery] });
    expect(result.capacityResults.filter((outcome) => outcome.ok)).toHaveLength(1);
    expect(codes(result)).toContain("CAPACITY_PERIOD_UNIT_MISMATCH");
    expect(result.capacityResults).toContainEqual(expect.objectContaining({
      ok: false,
      path: "scenario.deliveries[1]",
      blockers: expect.arrayContaining([expect.objectContaining({ code: "CAPACITY_PERIOD_UNIT_MISMATCH" })]),
    }));
    expect(result.state).toBe("partial");
  });

  it("reports an unknown delivery scope when all other delivery fields are valid", () => {
    const base = scenario();
    const delivery = { ...base.deliveries![0], scope: { kind: "sku" as const, skuId: "missing" } };
    const result = evaluate({ ...base, deliveries: [delivery] });
    expect(codes(result)).toContain("SCOPE_REFERENCE_UNKNOWN");
    expect(result.capacityResults).toContainEqual(expect.objectContaining({
      ok: false,
      path: "scenario.deliveries[0]",
      blockers: expect.arrayContaining([expect.objectContaining({ code: "SCOPE_REFERENCE_UNKNOWN" })]),
    }));
    expect(result.state).toBe("partial");
  });

  it("blocks duplicated capacity or delivery rows instead of reusing an ambiguous pair", () => {
    const base = scenario();
    const duplicatedCapacity = evaluate({ ...base, capacities: [...base.capacities!, base.capacities![0]] });
    const duplicatedDelivery = evaluate({ ...base, deliveries: [...base.deliveries!, base.deliveries![0]] });
    expect(codes(duplicatedCapacity)).toContain("CAPACITY_PAIR_DUPLICATE");
    expect(codes(duplicatedDelivery)).toContain("CAPACITY_PAIR_DUPLICATE");
    expect(duplicatedCapacity.state).toBe("partial");
    expect(duplicatedDelivery.state).toBe("partial");
  });

  it("blocks malformed capacity and delivery rows with explicit path errors", () => {
    const base = scenario();
    const capacity = evaluate({
      ...base,
      capacities: [{ scope: { kind: "sku", skuId: "missing" }, unitsPerPeriod: -1, periodUnit: "business-day", provenance: provenance({ asOf: "2026-10-25" }) }],
      deliveries: [{ scope: { kind: "order" }, minimumPeriods: 0, maximumPeriods: Number.MAX_SAFE_INTEGER + 1, periodUnit: "day", provenance: provenance() }],
    });
    const reversedInterval = evaluate({
      ...base,
      deliveries: [{ ...base.deliveries![0], minimumPeriods: 4, maximumPeriods: 3 }],
    });
    const malformedRows = evaluate({ ...base, capacities: [null] as unknown as ScenarioInput["capacities"], deliveries: [null] as unknown as ScenarioInput["deliveries"] });
    expect(codes(capacity)).toEqual(expect.arrayContaining(["SCOPE_REFERENCE_UNKNOWN", "CAPACITY_RATE_INVALID", "CAPACITY_PERIOD_UNIT_UNSUPPORTED", "PROVENANCE_FUTURE_DATED", "DELIVERY_INTERVAL_INVALID", "DELIVERY_PERIOD_UNIT_UNSUPPORTED"]));
    expect(codes(reversedInterval)).toContain("DELIVERY_INTERVAL_INVALID");
    expect(codes(malformedRows)).toEqual(expect.arrayContaining(["CAPACITY_ROW_INVALID", "DELIVERY_ROW_INVALID"]));
  });

  it("treats stale and unknown source validity as warnings and leaves financial values unchanged", () => {
    const base = scenario();
    const stale = evaluate({ ...base, units: [{ ...base.units[0], provenance: provenance({ validThrough: "2026-10-23" }) }, base.units[1]] });
    const unknown = evaluate({ ...base, prices: [{ ...base.prices[0], provenance: provenance({ validThrough: undefined }) }, base.prices[1]] });
    expect(stale.state).toBe("partial");
    expect(stale.financialSummary?.totalUnits).toBe("3");
    expect(stale.sourceStatuses).toContainEqual({ path: "scenario.units[0].provenance", status: "stale" });
    expect(unknown.state).toBe("partial");
    expect(unknown.financialSummary?.totalPrice).toBe("25.5");
    expect(unknown.sourceStatuses).toContainEqual({ path: "scenario.prices[0].provenance", status: "validity-unknown" });
  });

  it.each([
    [provenance({ kind: "guess" as ScenarioProvenance["kind"] }), "PROVENANCE_INVALID"],
    [provenance({ sourceLabel: " " }), "PROVENANCE_INVALID"],
    [provenance({ asOf: "2026-02-30" }), "PROVENANCE_INVALID"],
    [provenance({ asOf: "2026-10-25" }), "PROVENANCE_FUTURE_DATED"],
    [provenance({ asOf: "2026-10-21", validThrough: "2026-10-20" }), "PROVENANCE_INTERVAL_INVALID"],
  ])("blocks invalid numeric provenance %#", (source, code) => {
    const base = scenario();
    const result = evaluate({ ...base, units: [{ ...base.units[0], provenance: source }, base.units[1]] });
    expect(codes(result)).toContain(code);
    expect(result.sourceStatuses).toContainEqual({ path: "scenario.units[0].provenance", status: "invalid" });
    expect(result.financialSummary).toBeNull();
  });

  it("blocks invalid evaluation dates and malformed required scenarios", () => {
    const badDate = evaluate(scenario(), collection(), "2026-02-30");
    const nonStringDate = evaluate(scenario(), collection(), 20261024);
    const badScenario = evaluate(null);
    const badCollection = evaluate(scenario(), { not: "a collection" });
    expect(codes(badDate)).toContain("EVALUATION_DATE_INVALID");
    expect(codes(nonStringDate)).toContain("EVALUATION_DATE_INVALID");
    expect(codes(badDate)).toContain("PROVENANCE_INVALID");
    expect(codes(badScenario)).toContain("SCENARIO_INVALID");
    expect(badScenario.state).toBe("blocked");
    expect(codes(badCollection)).toContain("COLLECTION_INVALID");
    expect(badCollection.moqResults[0]?.ok).toBe(false);
    expect(badCollection.capacityResults.every((result) => !result.ok)).toBe(true);
  });

  it("requires a provenance object for every numeric input", () => {
    const base = scenario();
    const result = evaluate({
      ...base,
      units: [{ ...base.units[0], provenance: null } as unknown as typeof base.units[number], base.units[1]],
    });
    expect(codes(result)).toContain("PROVENANCE_REQUIRED");
    expect(result.sourceStatuses).toContainEqual({ path: "scenario.units[0].provenance", status: "invalid" });
    expect(result.financialSummary).toBeNull();
  });

  it("blocks an empty collection, malformed optional lists and malformed base records", () => {
    const empty = { ...collection(), skus: [] };
    const noVariants = evaluate(scenario({ units: [], prices: [], costs: [] }), empty);
    const badLists = evaluate(scenario({ moqs: "no", capacities: "no", deliveries: "no" } as unknown as Partial<ScenarioInput>));
    expect(codes(noVariants)).toContain("COLLECTION_HAS_NO_VARIANTS");
    expect(noVariants.financialSummary).toBeNull();
    expect(codes(badLists)).toContain("INPUT_LIST_INVALID");
    expect(badLists.state).toBe("partial");
    expect(codes(evaluate(scenario(), { ...collection(), revision: 0 }))).toContain("COLLECTION_INVALID");
  });
});
