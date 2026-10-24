import { parseCollectionRecord, type CollectionRecord, type CollectionVariant } from "./collection-records";

export type ProvenanceKind = "user-input" | "estimate" | "transcribed-source";

export interface ScenarioProvenance {
  readonly kind: ProvenanceKind;
  readonly sourceLabel: string;
  readonly asOf: string;
  readonly validThrough?: string;
}

export type ScenarioScope =
  | { readonly kind: "order" }
  | { readonly kind: "styleId"; readonly styleId: string }
  | { readonly kind: "sku"; readonly skuId: string }
  | { readonly kind: "colorway"; readonly skuId: string; readonly colorwayId: string }
  | { readonly kind: "variant"; readonly variantId: string };

export interface ScenarioUnitsInput {
  readonly variantId: string;
  readonly units: number;
  readonly provenance: ScenarioProvenance;
}

export interface ScenarioMoneyInput {
  readonly variantId: string;
  readonly amount: string;
  readonly currencyCode: string;
  readonly provenance: ScenarioProvenance;
}

export interface ScenarioMoqInput {
  readonly scope: ScenarioScope;
  readonly unit: string;
  readonly minimumUnits: number;
  readonly provenance: ScenarioProvenance;
}

export interface ScenarioCapacityInput {
  readonly scope: ScenarioScope;
  readonly unitsPerPeriod: number;
  readonly periodUnit: string;
  readonly provenance: ScenarioProvenance;
}

export interface ScenarioDeliveryInput {
  readonly scope: ScenarioScope;
  readonly minimumPeriods: number;
  readonly maximumPeriods: number;
  readonly periodUnit: string;
  readonly provenance: ScenarioProvenance;
}

export interface ScenarioInput {
  readonly currencyCode: string;
  readonly units: readonly ScenarioUnitsInput[];
  readonly prices: readonly ScenarioMoneyInput[];
  readonly costs: readonly ScenarioMoneyInput[];
  readonly moqs?: readonly ScenarioMoqInput[];
  readonly capacities?: readonly ScenarioCapacityInput[];
  readonly deliveries?: readonly ScenarioDeliveryInput[];
}

export interface CalculationBlocker {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export type SourceValidity = "current" | "stale" | "validity-unknown" | "invalid";

export interface ScenarioSourceStatus {
  readonly path: string;
  readonly status: SourceValidity;
}

export interface VariantFinancialResult {
  readonly variantId: string;
  readonly plannedUnits: string;
  readonly unitPrice: string;
  readonly unitCost: string;
  readonly unitMargin: string;
  readonly extendedMargin: string;
}

export interface ScenarioFinancialSummary {
  readonly currencyCode: string;
  readonly totalUnits: string;
  readonly totalPrice: string;
  readonly totalCost: string;
  readonly totalMargin: string;
  readonly variants: readonly VariantFinancialResult[];
}

export type ConstraintOutcome<T> =
  | { readonly ok: true; readonly path: string; readonly pairedPath?: string; readonly value: T }
  | { readonly ok: false; readonly path: string; readonly blockers: readonly CalculationBlocker[] };

export interface ScenarioMoqResult {
  readonly plannedUnits: string;
  readonly minimumUnits: string;
  readonly shortfallUnits: string;
  readonly outcome: "meets" | "below";
}

export interface ScenarioCapacityResult {
  readonly scopeKey: string;
  readonly periodUnit: "calendar-day" | "calendar-week";
  readonly plannedUnits: string;
  readonly minimumCapacityUnits: string;
  readonly maximumCapacityUnits: string;
  readonly outcome: "within-minimum-window" | "within-maximum-window" | "exceeds-maximum-window";
}

export interface ScenarioCalculationResult {
  readonly state: "complete" | "partial" | "blocked";
  readonly financialSummary: ScenarioFinancialSummary | null;
  readonly blockers: readonly CalculationBlocker[];
  readonly sourceStatuses: readonly ScenarioSourceStatus[];
  readonly moqResults: readonly ConstraintOutcome<ScenarioMoqResult>[];
  readonly capacityResults: readonly ConstraintOutcome<ScenarioCapacityResult>[];
}

type JsonObject = Record<string, unknown>;
type ScopeReference = { readonly key: string; readonly variantIds: readonly string[] };
type CollectionIndex = {
  readonly variants: readonly CollectionVariant[];
  readonly styleVariants: ReadonlyMap<string, readonly string[]>;
  readonly skus: ReadonlyMap<string, CollectionRecord["skus"][number]>;
  readonly colorwayVariants: ReadonlyMap<string, readonly string[]>;
  readonly variantsById: ReadonlyMap<string, CollectionVariant>;
};
type PreparedCapacity = {
  readonly path: string;
  readonly scope: ScopeReference;
  readonly plannedUnits: bigint;
  readonly unitsPerPeriod: bigint;
  readonly periodUnit: "calendar-day" | "calendar-week";
};
type PreparedDelivery = {
  readonly path: string;
  readonly scope: ScopeReference;
  readonly minimumPeriods: bigint;
  readonly maximumPeriods: bigint;
  readonly periodUnit: "calendar-day" | "calendar-week";
};

const MONEY_PATTERN = /^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,6})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_SCALE = 1_000_000n;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addBlocker(
  blockers: CalculationBlocker[],
  path: string,
  code: string,
  message: string,
): CalculationBlocker {
  const blocker = { path, code, message };
  blockers.push(blocker);
  return blocker;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseMoney(value: unknown): bigint | null {
  if (typeof value !== "string" || !MONEY_PATTERN.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * MONEY_SCALE + BigInt(fraction.padEnd(6, "0"));
}

function formatMoney(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / MONEY_SCALE;
  const fraction = (absolute % MONEY_SCALE).toString().padStart(6, "0").replace(/0+$/, "");
  const magnitude = fraction.length === 0 ? whole.toString() : whole.toString() + "." + fraction;
  return negative && absolute !== 0n ? "-" + magnitude : magnitude;
}

function formatInteger(value: bigint): string {
  return value.toString();
}

function parseRows(value: unknown, path: string, blockers: CalculationBlocker[]): unknown[] {
  if (!Array.isArray(value)) {
    addBlocker(blockers, path, "INPUT_LIST_REQUIRED", "Enter this scenario input as a list.");
    return [];
  }
  return value;
}

function validateProvenance(
  value: unknown,
  path: string,
  evaluationDate: string | null,
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
): boolean {
  if (!isObject(value)) {
    sourceStatuses.push({ path, status: "invalid" });
    addBlocker(blockers, path, "PROVENANCE_REQUIRED", "Add a provenance kind, source label and valid as-of date.");
    return false;
  }
  const kindValid = value.kind === "user-input" || value.kind === "estimate" || value.kind === "transcribed-source";
  const labelValid = typeof value.sourceLabel === "string" && value.sourceLabel.trim().length > 0;
  const asOfValid = isCalendarDate(value.asOf);
  const validThroughProvided = value.validThrough !== undefined;
  const validThroughValid = !validThroughProvided || isCalendarDate(value.validThrough);
  if (!kindValid || !labelValid || !asOfValid || !validThroughValid || evaluationDate === null) {
    sourceStatuses.push({ path, status: "invalid" });
    addBlocker(blockers, path, "PROVENANCE_INVALID", "Use a supported provenance kind, nonblank source label and valid Gregorian dates.");
    return false;
  }
  if ((value.asOf as string) > evaluationDate) {
    sourceStatuses.push({ path, status: "invalid" });
    addBlocker(blockers, path, "PROVENANCE_FUTURE_DATED", "The source as-of date cannot be after the evaluation date.");
    return false;
  }
  if (validThroughProvided && (value.validThrough as string) < (value.asOf as string)) {
    sourceStatuses.push({ path, status: "invalid" });
    addBlocker(blockers, path, "PROVENANCE_INTERVAL_INVALID", "The valid-through date cannot be earlier than the as-of date.");
    return false;
  }
  if (!validThroughProvided) {
    sourceStatuses.push({ path, status: "validity-unknown" });
  } else if (evaluationDate > (value.validThrough as string)) {
    sourceStatuses.push({ path, status: "stale" });
  } else {
    sourceStatuses.push({ path, status: "current" });
  }
  return true;
}

function mapVariantRows<T>(
  value: readonly unknown[],
  path: string,
  variants: readonly CollectionVariant[],
  blockers: CalculationBlocker[],
  validate: (row: JsonObject, rowPath: string) => T | null,
): { readonly values: ReadonlyMap<string, T>; readonly valid: boolean } {
  const values = new Map<string, T>();
  const expected = new Set(variants.map((variant) => variant.id.toLowerCase()));
  let valid = true;
  value.forEach((entry, index) => {
    const rowPath = path + "[" + index + "]";
    if (!isObject(entry) || typeof entry.variantId !== "string") {
      addBlocker(blockers, rowPath, "VARIANT_REFERENCE_REQUIRED", "Choose a collection variant for this row.");
      valid = false;
      return;
    }
    const key = entry.variantId.toLowerCase();
    if (!expected.has(key)) {
      addBlocker(blockers, rowPath + ".variantId", "VARIANT_REFERENCE_UNKNOWN", "Choose a variant in this collection.");
      valid = false;
      return;
    }
    if (values.has(key)) {
      addBlocker(blockers, rowPath + ".variantId", "VARIANT_REFERENCE_DUPLICATE", "Keep exactly one row for each collection variant.");
      valid = false;
      return;
    }
    const parsed = validate(entry, rowPath);
    if (parsed === null) {
      valid = false;
      return;
    }
    values.set(key, parsed);
  });
  variants.forEach((variant) => {
    const key = variant.id.toLowerCase();
    if (!values.has(key)) {
      addBlocker(blockers, path + "[" + variant.id + "]", "VARIANT_ROW_MISSING", "Add the missing variant row.");
      valid = false;
    }
  });
  return { values, valid };
}

function indexCollection(collection: CollectionRecord): CollectionIndex {
  const variants: CollectionVariant[] = [];
  const styleVariants = new Map<string, string[]>();
  const skus = new Map<string, CollectionRecord["skus"][number]>();
  const colorwayVariants = new Map<string, string[]>();
  const variantsById = new Map<string, CollectionVariant>();
  collection.skus.forEach((sku) => {
    const skuKey = sku.id.toLowerCase();
    skus.set(skuKey, sku);
    sku.variants.forEach((variant) => {
      const variantKey = variant.id.toLowerCase();
      variants.push(variant);
      variantsById.set(variantKey, variant);
      const styleKey = sku.styleId.toLowerCase();
      const styleRows = styleVariants.get(styleKey) ?? [];
      styleRows.push(variant.id);
      styleVariants.set(styleKey, styleRows);
      const colorwayKey = skuKey + ":" + variant.colorwayId.toLowerCase();
      const colorwayRows = colorwayVariants.get(colorwayKey) ?? [];
      colorwayRows.push(variant.id);
      colorwayVariants.set(colorwayKey, colorwayRows);
    });
  });
  return { variants, styleVariants, skus, colorwayVariants, variantsById };
}

function readScope(
  index: CollectionIndex,
  value: unknown,
  path: string,
  blockers: CalculationBlocker[],
): ScopeReference | null {
  if (!isObject(value) || typeof value.kind !== "string") {
    addBlocker(blockers, path, "SCOPE_REQUIRED", "Choose a supported order, style, SKU, colorway or variant scope.");
    return null;
  }
  if (value.kind === "order") return { key: "order", variantIds: index.variants.map((variant) => variant.id) };
  if (value.kind === "styleId" && typeof value.styleId === "string") {
    const styleKey = (value.styleId as string).toLowerCase();
    const matches = index.styleVariants.get(styleKey);
    if (!matches) {
      addBlocker(blockers, path + ".styleId", "SCOPE_REFERENCE_UNKNOWN", "Choose a style used by this collection.");
      return null;
    }
    return { key: "styleId:" + styleKey, variantIds: matches };
  }
  if (value.kind === "sku" && typeof value.skuId === "string") {
    const sku = index.skus.get((value.skuId as string).toLowerCase());
    if (!sku) {
      addBlocker(blockers, path + ".skuId", "SCOPE_REFERENCE_UNKNOWN", "Choose a SKU in this collection.");
      return null;
    }
    return { key: "sku:" + sku.id.toLowerCase(), variantIds: sku.variants.map((variant) => variant.id) };
  }
  if (value.kind === "colorway" && typeof value.skuId === "string" && typeof value.colorwayId === "string") {
    const sku = index.skus.get((value.skuId as string).toLowerCase());
    const colorway = sku?.colorways.find((item) => item.id.toLowerCase() === (value.colorwayId as string).toLowerCase());
    if (!sku || !colorway) {
      addBlocker(blockers, !sku ? path + ".skuId" : path + ".colorwayId", "SCOPE_REFERENCE_UNKNOWN", "Choose a colorway within its exact collection SKU.");
      return null;
    }
    return {
      key: "colorway:" + sku.id.toLowerCase() + ":" + colorway.id.toLowerCase(),
      variantIds: index.colorwayVariants.get(sku.id.toLowerCase() + ":" + colorway.id.toLowerCase()) ?? [],
    };
  }
  if (value.kind === "variant" && typeof value.variantId === "string") {
    const variantKey = (value.variantId as string).toLowerCase();
    const variant = index.variantsById.get(variantKey);
    if (!variant) {
      addBlocker(blockers, path + ".variantId", "SCOPE_REFERENCE_UNKNOWN", "Choose a variant in this collection.");
      return null;
    }
    return { key: "variant:" + variant.id.toLowerCase(), variantIds: [variant.id] };
  }
  addBlocker(blockers, path, "SCOPE_UNSUPPORTED", "This basis cannot be compared with planned garment units.");
  return null;
}

function plannedForScope(scope: ScopeReference, units: ReadonlyMap<string, number>): bigint {
  return scope.variantIds.reduce((sum, variantId) => sum + BigInt(units.get(variantId.toLowerCase())!), 0n);
}

function optionalRows(value: unknown, path: string, blockers: CalculationBlocker[]): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    addBlocker(blockers, path, "INPUT_LIST_INVALID", "Enter constraint rows as a list.");
    return [];
  }
  return value;
}

function constraintFailure<T>(path: string, blockers: CalculationBlocker[]): ConstraintOutcome<T> {
  return { ok: false, path, blockers };
}

function validateConstraintProvenance(
  row: JsonObject,
  path: string,
  evaluationDate: string | null,
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
): boolean {
  return validateProvenance(row.provenance, path + ".provenance", evaluationDate, blockers, sourceStatuses);
}

function calculateMoqs(
  rows: readonly unknown[],
  index: CollectionIndex,
  units: ReadonlyMap<string, number>,
  unitsComplete: boolean,
  evaluationDate: string | null,
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
): ConstraintOutcome<ScenarioMoqResult>[] {
  if (rows.length === 0) {
    addBlocker(blockers, "scenario.moqs", "MOQ_INPUT_NOT_PROVIDED", "Add at least one minimum-order quantity to complete this scenario.");
  }
  return rows.map((entry, rowIndex) => {
    const path = "scenario.moqs[" + rowIndex + "]";
    const rowBlockers: CalculationBlocker[] = [];
    if (!isObject(entry)) {
      rowBlockers.push(addBlocker(blockers, path, "MOQ_ROW_INVALID", "Enter a minimum-order row."));
      return constraintFailure(path, rowBlockers);
    }
    const scope = readScope(index, entry.scope, path + ".scope", blockers);
    if (!scope) rowBlockers.push(blockers[blockers.length - 1]);
    if (entry.unit !== "garment") rowBlockers.push(addBlocker(blockers, path + ".unit", "MOQ_UNIT_UNSUPPORTED", "Only a garment-unit minimum can be compared in this calculation."));
    if (typeof entry.minimumUnits !== "number" || !Number.isSafeInteger(entry.minimumUnits) || entry.minimumUnits <= 0) {
      rowBlockers.push(addBlocker(blockers, path + ".minimumUnits", "MOQ_MINIMUM_INVALID", "Enter a positive safe-integer garment quantity."));
    }
    const provenanceValid = validateConstraintProvenance(entry, path, evaluationDate, blockers, sourceStatuses);
    if (!provenanceValid) rowBlockers.push(blockers[blockers.length - 1]);
    if (!unitsComplete) rowBlockers.push(addBlocker(blockers, path, "MOQ_PLAN_UNAVAILABLE", "Resolve every planned variant quantity before comparing this minimum."));
    if (rowBlockers.length > 0 || !scope) return constraintFailure(path, rowBlockers);
    const planned = plannedForScope(scope, units);
    const minimum = BigInt(entry.minimumUnits as number);
    const shortfall = minimum > planned ? minimum - planned : 0n;
    return {
      ok: true,
      path,
      value: {
        plannedUnits: formatInteger(planned),
        minimumUnits: formatInteger(minimum),
        shortfallUnits: formatInteger(shortfall),
        outcome: planned >= minimum ? "meets" : "below",
      },
    };
  });
}

function readPeriodUnit(value: unknown): "calendar-day" | "calendar-week" | null {
  return value === "calendar-day" || value === "calendar-week" ? value : null;
}

function prepareCapacities(
  rows: readonly unknown[],
  index: CollectionIndex,
  units: ReadonlyMap<string, number>,
  unitsComplete: boolean,
  evaluationDate: string | null,
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
): { readonly prepared: PreparedCapacity[]; readonly failures: ConstraintOutcome<ScenarioCapacityResult>[] } {
  const prepared: PreparedCapacity[] = [];
  const failures: ConstraintOutcome<ScenarioCapacityResult>[] = [];
  rows.forEach((entry, rowIndex) => {
    const path = "scenario.capacities[" + rowIndex + "]";
    const rowBlockers: CalculationBlocker[] = [];
    if (!isObject(entry)) {
      rowBlockers.push(addBlocker(blockers, path, "CAPACITY_ROW_INVALID", "Enter a capacity rate."));
      failures.push(constraintFailure(path, rowBlockers));
      return;
    }
    const scope = readScope(index, entry.scope, path + ".scope", blockers);
    if (!scope) rowBlockers.push(blockers[blockers.length - 1]);
    const periodUnit = readPeriodUnit(entry.periodUnit);
    if (periodUnit === null) rowBlockers.push(addBlocker(blockers, path + ".periodUnit", "CAPACITY_PERIOD_UNIT_UNSUPPORTED", "Choose calendar-day or calendar-week."));
    if (typeof entry.unitsPerPeriod !== "number" || !Number.isSafeInteger(entry.unitsPerPeriod) || entry.unitsPerPeriod < 0) {
      rowBlockers.push(addBlocker(blockers, path + ".unitsPerPeriod", "CAPACITY_RATE_INVALID", "Enter a nonnegative safe-integer garment capacity."));
    }
    if (!validateConstraintProvenance(entry, path, evaluationDate, blockers, sourceStatuses)) rowBlockers.push(blockers[blockers.length - 1]);
    if (!unitsComplete) rowBlockers.push(addBlocker(blockers, path, "CAPACITY_PLAN_UNAVAILABLE", "Resolve every planned variant quantity before comparing capacity."));
    if (rowBlockers.length > 0) {
      failures.push(constraintFailure(path, rowBlockers));
      return;
    }
    prepared.push({
      path,
      scope: scope!,
      plannedUnits: plannedForScope(scope!, units),
      unitsPerPeriod: BigInt(entry.unitsPerPeriod as number),
      periodUnit: periodUnit!,
    });
  });
  return { prepared, failures };
}

function prepareDeliveries(
  rows: readonly unknown[],
  index: CollectionIndex,
  evaluationDate: string | null,
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
): { readonly prepared: PreparedDelivery[]; readonly failures: ConstraintOutcome<ScenarioCapacityResult>[] } {
  const prepared: PreparedDelivery[] = [];
  const failures: ConstraintOutcome<ScenarioCapacityResult>[] = [];
  rows.forEach((entry, rowIndex) => {
    const path = "scenario.deliveries[" + rowIndex + "]";
    const rowBlockers: CalculationBlocker[] = [];
    if (!isObject(entry)) {
      rowBlockers.push(addBlocker(blockers, path, "DELIVERY_ROW_INVALID", "Enter a delivery interval."));
      failures.push(constraintFailure(path, rowBlockers));
      return;
    }
    const scope = readScope(index, entry.scope, path + ".scope", blockers);
    if (!scope) rowBlockers.push(blockers[blockers.length - 1]);
    const periodUnit = readPeriodUnit(entry.periodUnit);
    if (periodUnit === null) rowBlockers.push(addBlocker(blockers, path + ".periodUnit", "DELIVERY_PERIOD_UNIT_UNSUPPORTED", "Choose calendar-day or calendar-week."));
    const minimumPeriods = entry.minimumPeriods;
    const maximumPeriods = entry.maximumPeriods;
    const minimumValid = typeof minimumPeriods === "number" && Number.isSafeInteger(minimumPeriods) && minimumPeriods > 0;
    const maximumValid = typeof maximumPeriods === "number" && Number.isSafeInteger(maximumPeriods) && maximumPeriods > 0;
    if (!minimumValid || !maximumValid || (minimumValid && maximumValid && (minimumPeriods as number) > (maximumPeriods as number))) {
      rowBlockers.push(addBlocker(blockers, path, "DELIVERY_INTERVAL_INVALID", "Enter positive safe-integer periods with minimum no greater than maximum."));
    }
    if (!validateConstraintProvenance(entry, path, evaluationDate, blockers, sourceStatuses)) rowBlockers.push(blockers[blockers.length - 1]);
    if (rowBlockers.length > 0) {
      failures.push(constraintFailure(path, rowBlockers));
      return;
    }
    prepared.push({
      path,
      scope: scope!,
      minimumPeriods: BigInt(minimumPeriods as number),
      maximumPeriods: BigInt(maximumPeriods as number),
      periodUnit: periodUnit!,
    });
  });
  return { prepared, failures };
}

function compareCapacity(
  capacities: readonly PreparedCapacity[],
  deliveries: readonly PreparedDelivery[],
  blockers: CalculationBlocker[],
): ConstraintOutcome<ScenarioCapacityResult>[] {
  const results: ConstraintOutcome<ScenarioCapacityResult>[] = [];
  const accountedDeliveries = new Set<number>();
  capacities.forEach((capacity) => {
    const sameScopeCapacities = capacities.filter((candidate) => candidate.scope.key === capacity.scope.key && candidate.periodUnit === capacity.periodUnit);
    const sameScope = deliveries.map((delivery, index) => ({ delivery, index })).filter(({ delivery }) => delivery.scope.key === capacity.scope.key);
    const exact = sameScope.filter(({ delivery }) => delivery.periodUnit === capacity.periodUnit);
    if (exact.length === 0) {
      const code = sameScope.length > 0 ? "CAPACITY_PERIOD_UNIT_MISMATCH" : "CAPACITY_PAIR_MISSING";
      const message = sameScope.length > 0 ? "Capacity and delivery period units must match exactly." : "Add a delivery interval for this exact scope and period unit.";
      const failure = addBlocker(blockers, capacity.path, code, message);
      sameScope.forEach(({ index }) => accountedDeliveries.add(index));
      results.push(constraintFailure(capacity.path, [failure]));
      return;
    }
    if (exact.length > 1 || sameScopeCapacities.length > 1) {
      const failure = addBlocker(blockers, capacity.path, "CAPACITY_PAIR_DUPLICATE", "Keep exactly one delivery interval for each capacity scope and period unit.");
      exact.forEach(({ delivery, index }) => {
        accountedDeliveries.add(index);
        const deliveryFailure = addBlocker(blockers, delivery.path, "CAPACITY_PAIR_DUPLICATE", "Keep exactly one capacity and delivery row for each scope and period unit.");
        results.push(constraintFailure(delivery.path, [deliveryFailure]));
      });
      results.push(constraintFailure(capacity.path, [failure]));
      return;
    }
    const match = exact[0];
    accountedDeliveries.add(match.index);
    const minimum = capacity.unitsPerPeriod * match.delivery.minimumPeriods;
    const maximum = capacity.unitsPerPeriod * match.delivery.maximumPeriods;
    const outcome = capacity.plannedUnits <= minimum
      ? "within-minimum-window"
      : capacity.plannedUnits <= maximum
        ? "within-maximum-window"
        : "exceeds-maximum-window";
    results.push({
      ok: true,
      path: capacity.path,
      pairedPath: match.delivery.path,
      value: {
        scopeKey: capacity.scope.key,
        periodUnit: capacity.periodUnit,
        plannedUnits: formatInteger(capacity.plannedUnits),
        minimumCapacityUnits: formatInteger(minimum),
        maximumCapacityUnits: formatInteger(maximum),
        outcome,
      },
    });
  });
  deliveries.forEach((delivery, index) => {
    if (accountedDeliveries.has(index)) return;
    const sameScope = capacities.some((capacity) => capacity.scope.key === delivery.scope.key);
    const code = sameScope ? "CAPACITY_PERIOD_UNIT_MISMATCH" : "CAPACITY_PAIR_MISSING";
    const message = sameScope ? "Capacity and delivery period units must match exactly." : "Add a capacity rate for this exact scope and period unit.";
    const failure = addBlocker(blockers, delivery.path, code, message);
    results.push(constraintFailure(delivery.path, [failure]));
  });
  if (results.every((result) => !result.ok)) {
    addBlocker(blockers, "scenario.capacities", "CAPACITY_INPUT_NOT_PROVIDED", "Add at least one matched capacity and delivery interval.");
  }
  return results;
}

function financialSummary(
  currencyCode: string,
  variants: readonly CollectionVariant[],
  units: ReadonlyMap<string, number>,
  prices: ReadonlyMap<string, bigint>,
  costs: ReadonlyMap<string, bigint>,
): ScenarioFinancialSummary {
  let totalUnits = 0n;
  let totalPrice = 0n;
  let totalCost = 0n;
  const variantResults = variants.map((variant) => {
    const key = variant.id.toLowerCase();
    const count = BigInt(units.get(key)!);
    const price = prices.get(key)!;
    const cost = costs.get(key)!;
    const margin = price - cost;
    totalUnits += count;
    totalPrice += price * count;
    totalCost += cost * count;
    return {
      variantId: variant.id,
      plannedUnits: formatInteger(count),
      unitPrice: formatMoney(price),
      unitCost: formatMoney(cost),
      unitMargin: formatMoney(margin),
      extendedMargin: formatMoney(margin * count),
    };
  });
  return {
    currencyCode,
    totalUnits: formatInteger(totalUnits),
    totalPrice: formatMoney(totalPrice),
    totalCost: formatMoney(totalCost),
    totalMargin: formatMoney(totalPrice - totalCost),
    variants: variantResults,
  };
}

function blockedEarlyResult(
  blockers: CalculationBlocker[],
  sourceStatuses: ScenarioSourceStatus[],
  moqRows: readonly unknown[],
  capacityRows: readonly unknown[],
  deliveryRows: readonly unknown[],
): ScenarioCalculationResult {
  const moqResults = moqRows.map((_, index) => {
    const path = "scenario.moqs[" + index + "]";
    const blocker = addBlocker(blockers, path, "COLLECTION_INVALID", "Resolve the collection before evaluating this constraint.");
    return constraintFailure<ScenarioMoqResult>(path, [blocker]);
  });
  const capacityResults = [...capacityRows, ...deliveryRows].map((_, index) => {
    const path = index < capacityRows.length ? "scenario.capacities[" + index + "]" : "scenario.deliveries[" + (index - capacityRows.length) + "]";
    const blocker = addBlocker(blockers, path, "COLLECTION_INVALID", "Resolve the collection before evaluating this constraint.");
    return constraintFailure<ScenarioCapacityResult>(path, [blocker]);
  });
  if (moqRows.length === 0) addBlocker(blockers, "scenario.moqs", "MOQ_INPUT_NOT_PROVIDED", "Add at least one minimum-order quantity to complete this scenario.");
  if (capacityRows.length === 0 || deliveryRows.length === 0) addBlocker(blockers, "scenario.capacities", "CAPACITY_INPUT_NOT_PROVIDED", "Add at least one matched capacity and delivery interval.");
  return { state: "blocked", financialSummary: null, blockers, sourceStatuses, moqResults, capacityResults };
}

/** Pure exact-arithmetic evaluation over one collection graph and explicit user-authored scenario values. */
export function calculateScenario(
  collectionInput: unknown,
  scenarioInput: ScenarioInput,
  evaluationDateInput: string,
): ScenarioCalculationResult {
  const blockers: CalculationBlocker[] = [];
  const sourceStatuses: ScenarioSourceStatus[] = [];
  const collectionResult = parseCollectionRecord(collectionInput);
  const scenarioObject = isObject(scenarioInput) ? scenarioInput : null;
  const evaluationDate = isCalendarDate(evaluationDateInput) ? evaluationDateInput : null;
  if (evaluationDate === null) addBlocker(blockers, "evaluationDate", "EVALUATION_DATE_INVALID", "Enter an exact Gregorian date in YYYY-MM-DD form.");
  if (!collectionResult.ok) addBlocker(blockers, "collection", "COLLECTION_INVALID", "Repair the collection before evaluating a scenario.");
  if (!scenarioObject) {
    addBlocker(blockers, "scenario", "SCENARIO_INVALID", "Enter a scenario object.");
    return blockedEarlyResult(blockers, sourceStatuses, [], [], []);
  }
  const moqRows = optionalRows(scenarioObject.moqs, "scenario.moqs", blockers);
  const capacityRows = optionalRows(scenarioObject.capacities, "scenario.capacities", blockers);
  const deliveryRows = optionalRows(scenarioObject.deliveries, "scenario.deliveries", blockers);
  if (!collectionResult.ok) return blockedEarlyResult(blockers, sourceStatuses, moqRows, capacityRows, deliveryRows);
  const collection = collectionResult.value;
  const index = indexCollection(collection);
  const variants = index.variants;
  if (variants.length === 0) addBlocker(blockers, "collection.skus", "COLLECTION_HAS_NO_VARIANTS", "Add at least one collection variant before planning quantities.");
  const currencyCode = scenarioObject.currencyCode;
  const currencyValid = typeof currencyCode === "string" && CURRENCY_PATTERN.test(currencyCode);
  if (!currencyValid) addBlocker(blockers, "scenario.currencyCode", "CURRENCY_FORMAT_INVALID", "Use a three-letter uppercase currency code.");
  const unitsRows = parseRows(scenarioObject.units, "scenario.units", blockers);
  const priceRows = parseRows(scenarioObject.prices, "scenario.prices", blockers);
  const costRows = parseRows(scenarioObject.costs, "scenario.costs", blockers);
  const units = mapVariantRows<number>(unitsRows, "scenario.units", variants, blockers, (row, path) => {
    const numericValid = typeof row.units === "number" && Number.isSafeInteger(row.units) && row.units >= 0;
    if (!numericValid) addBlocker(blockers, path + ".units", "PLANNED_UNITS_INVALID", "Enter a nonnegative safe-integer garment quantity; zero is allowed.");
    const provenanceValid = validateProvenance(row.provenance, path + ".provenance", evaluationDate, blockers, sourceStatuses);
    return numericValid && provenanceValid ? row.units as number : null;
  });
  const mapMoneyRows = (rows: unknown[], path: string) => mapVariantRows<bigint>(rows, path, variants, blockers, (row, rowPath) => {
    const amount = parseMoney(row.amount);
    if (amount === null) addBlocker(blockers, rowPath + ".amount", "MONEY_AMOUNT_INVALID", "Use a nonnegative decimal amount with up to twelve whole and six fractional digits.");
    const entryCurrencyValid = typeof row.currencyCode === "string" && CURRENCY_PATTERN.test(row.currencyCode);
    if (!entryCurrencyValid) {
      addBlocker(blockers, rowPath + ".currencyCode", "CURRENCY_FORMAT_INVALID", "Use a three-letter uppercase currency code.");
    } else if (currencyValid && row.currencyCode !== currencyCode) {
      addBlocker(blockers, rowPath + ".currencyCode", "CURRENCY_MISMATCH", "Match this amount's currency to the scenario; conversion is not provided.");
    }
    const provenanceValid = validateProvenance(row.provenance, rowPath + ".provenance", evaluationDate, blockers, sourceStatuses);
    return amount !== null && entryCurrencyValid && currencyValid && row.currencyCode === currencyCode && provenanceValid ? amount : null;
  });
  const prices = mapMoneyRows(priceRows, "scenario.prices");
  const costs = mapMoneyRows(costRows, "scenario.costs");
  const baseValid = collectionResult.ok && variants.length > 0 && currencyValid && evaluationDate !== null
    && units.valid && prices.valid && costs.valid;
  const moqResults = calculateMoqs(moqRows, index, units.values, units.valid, evaluationDate, blockers, sourceStatuses);
  const capacityPrepared = prepareCapacities(capacityRows, index, units.values, units.valid, evaluationDate, blockers, sourceStatuses);
  const deliveryPrepared = prepareDeliveries(deliveryRows, index, evaluationDate, blockers, sourceStatuses);
  const capacityResults = [
    ...capacityPrepared.failures,
    ...deliveryPrepared.failures,
    ...compareCapacity(capacityPrepared.prepared, deliveryPrepared.prepared, blockers),
  ];
  const summary = baseValid ? financialSummary(currencyCode as string, variants, units.values, prices.values, costs.values) : null;
  const freshnessWarning = sourceStatuses.some((source) => source.status === "stale" || source.status === "validity-unknown");
  const constraintsValid = blockers.length === 0;
  const complete = summary !== null && moqRows.length > 0 && capacityResults.some((result) => result.ok) && constraintsValid && !freshnessWarning;
  return {
    state: summary === null ? "blocked" : complete ? "complete" : "partial",
    financialSummary: summary,
    blockers,
    sourceStatuses,
    moqResults,
    capacityResults,
  };
}
