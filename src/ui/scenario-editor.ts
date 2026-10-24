/** Project Manager editor and S1183 adapter for saved raw scenario drafts. */
import { calculateScenario, type ScenarioInput, type ScenarioCalculationResult, type ScenarioScope } from "./scenario-calculations";
import type { CollectionRecord } from "./collection-records";
import {
  SCENARIO_INPUT_LIST_LIMIT,
  addMissingScenarioVariantRows,
  parseScenarioRecord,
  parseScenarioRecords,
  scenarioDraftsAreDirty,
  scopeDraftToCalculation,
  provenanceDraftToCalculation,
  type ScenarioCapacityDeliveryDraftRow,
  type ScenarioDraftScope,
  type ScenarioRecord,
  type ScenarioRowKind,
} from "./scenario-records";

export type ScenarioEditorAction =
  | { readonly type: "update"; readonly scenarioId: string; readonly field: string; readonly value: string }
  | { readonly type: "update-row"; readonly scenarioId: string; readonly rowKind: ScenarioRowKind; readonly rowId: string; readonly field: string; readonly value: string; readonly nested?: "scope" | "provenance" }
  | { readonly type: "add-moq"; readonly scenarioId: string; readonly row: ScenarioRecord["moqs"][number] }
  | { readonly type: "add-capacity-delivery"; readonly scenarioId: string; readonly row: ScenarioCapacityDeliveryDraftRow }
  | { readonly type: "delete"; readonly scenarioId: string }
  | { readonly type: "delete-row"; readonly scenarioId: string; readonly rowKind: "moqs" | "capacityDelivery"; readonly rowId: string }
  | { readonly type: "add-missing"; readonly scenarioId: string; readonly collection: CollectionRecord; readonly projectScenarios: readonly ScenarioRecord[]; readonly uuid: () => string };

export interface ScenarioEditorInput {
  readonly scenarios: readonly ScenarioRecord[];
  readonly savedScenarios: readonly ScenarioRecord[];
  readonly collections: readonly CollectionRecord[];
  readonly disabled?: boolean;
}

const key = (value: string): string => value.toLowerCase();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function boundedInteger(raw: string): number {
  if (!/^\d+$/.test(raw)) return Number.NaN;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : Number.NaN;
}

function asScope(scope: ScenarioDraftScope): ScenarioScope {
  return scopeDraftToCalculation(scope);
}

function scenarioInputForCalculation(scenario: ScenarioRecord): ScenarioInput {
  const capacities = scenario.capacityDelivery.map((row) => ({
    scope: asScope(row.scope),
    unitsPerPeriod: boundedInteger(row.unitsPerPeriod),
    periodUnit: row.periodUnit,
    provenance: provenanceDraftToCalculation(row.provenance),
  }));
  const deliveries = scenario.capacityDelivery.map((row) => ({
    scope: asScope(row.scope),
    minimumPeriods: boundedInteger(row.minimumPeriods),
    maximumPeriods: boundedInteger(row.maximumPeriods),
    periodUnit: row.periodUnit,
    provenance: provenanceDraftToCalculation(row.provenance),
  }));
  return {
    currencyCode: scenario.currencyCode,
    units: scenario.units.map((row) => ({
      variantId: row.variantId,
      units: boundedInteger(row.units),
      provenance: provenanceDraftToCalculation(row.provenance),
    })),
    prices: scenario.prices.map((row) => ({
      variantId: row.variantId,
      amount: row.amount,
      currencyCode: row.currencyCode,
      provenance: provenanceDraftToCalculation(row.provenance),
    })),
    costs: scenario.costs.map((row) => ({
      variantId: row.variantId,
      amount: row.amount,
      currencyCode: row.currencyCode,
      provenance: provenanceDraftToCalculation(row.provenance),
    })),
    moqs: scenario.moqs.map((row) => ({
      scope: asScope(row.scope),
      unit: row.unit,
      minimumUnits: boundedInteger(row.minimumUnits),
      provenance: provenanceDraftToCalculation(row.provenance),
    })),
    capacities,
    deliveries,
  };
}

export function calculateScenarioDraft(
  scenario: ScenarioRecord,
  collections: readonly CollectionRecord[],
): ScenarioCalculationResult | null {
  const collection = collections.find((item) => key(item.id) === key(scenario.collectionId));
  return collection ? calculateScenario(collection, scenarioInputForCalculation(scenario), scenario.evaluationDate) : null;
}

function resultMarkup(result: ScenarioCalculationResult | null, scenario: ScenarioRecord): string {
  if (!result) {
    return `<p class="scenario-orphan" role="status">This scenario references an unavailable collection. Choose a saved collection to repair the link; its input rows and unresolved references are preserved.</p>`;
  }
  const blockers = result.blockers.length
    ? `<h5>Inputs needing attention</h5><ul>${result.blockers.map((blocker) =>
      `<li><code>${escapeHtml(blocker.path)}</code> · <strong>${escapeHtml(blocker.code)}</strong>: ${escapeHtml(blocker.message)}</li>`).join("")}</ul>`
    : `<p>No calculation blockers.</p>`;
  const sources = result.sourceStatuses.length
    ? `<h5>Source status</h5><ul>${result.sourceStatuses.map((source) =>
      `<li><code>${escapeHtml(source.path)}</code> · ${escapeHtml(source.status)}</li>`).join("")}</ul>`
    : "";
  const summary = result.financialSummary
    ? `<dl class="scenario-summary"><div><dt>Planned units</dt><dd>${escapeHtml(result.financialSummary.totalUnits)}</dd></div>` +
      `<div><dt>Total price</dt><dd>${escapeHtml(result.financialSummary.currencyCode)} ${escapeHtml(result.financialSummary.totalPrice)}</dd></div>` +
      `<div><dt>Total cost</dt><dd>${escapeHtml(result.financialSummary.currencyCode)} ${escapeHtml(result.financialSummary.totalCost)}</dd></div>` +
      `<div><dt>Total margin</dt><dd>${escapeHtml(result.financialSummary.currencyCode)} ${escapeHtml(result.financialSummary.totalMargin)}</dd></div></dl>`
    : "";
  const moqs = result.moqResults.length
    ? `<h5>Minimum order checks</h5><ul>${result.moqResults.map((outcome) => outcome.ok
      ? `<li>${escapeHtml(outcome.value.outcome)} · ${escapeHtml(outcome.value.plannedUnits)} planned / ${escapeHtml(outcome.value.minimumUnits)} minimum</li>`
      : `<li>${escapeHtml(outcome.path)} · needs correction</li>`).join("")}</ul>` : "";
  const capacities = result.capacityResults.length
    ? `<h5>Capacity checks</h5><ul>${result.capacityResults.map((outcome) => outcome.ok
      ? `<li>${escapeHtml(outcome.value.outcome)} · ${escapeHtml(outcome.value.plannedUnits)} planned in ${escapeHtml(outcome.value.periodUnit)} window</li>`
      : `<li>${escapeHtml(outcome.path)} · needs correction</li>`).join("")}</ul>` : "";
  return `<div class="scenario-calculation" data-scenario-result="${escapeHtml(scenario.id)}">` +
    `<p class="scenario-state scenario-state-${result.state}" role="status">Calculation state: <strong>${result.state}</strong></p>` +
    `${blockers}${sources}${summary}${moqs}${capacities}</div>`;
}

function input(label: string, value: string, attrs: string, disabled: boolean): string {
  return `<label>${escapeHtml(label)}<input type="text" value="${escapeHtml(value)}" ${attrs}${disabled ? " disabled" : ""}></label>`;
}

function select(label: string, value: string, options: readonly string[], attrs: string, disabled: boolean): string {
  const visibleOptions = value && !options.includes(value) ? [value, ...options] : options;
  return `<label>${escapeHtml(label)}<select ${attrs}${disabled ? " disabled" : ""}>` +
    visibleOptions.map((option) => `<option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(option ? options.includes(option) ? option : `Unsupported saved value · ${option}` : "Choose…")}</option>`).join("") +
    `</select></label>`;
}

function referenceSelect(
  label: string,
  value: string,
  choices: readonly { readonly id: string; readonly label: string }[],
  attrs: string,
  disabled: boolean,
): string {
  const known = choices.some((choice) => key(choice.id) === key(value));
  const unresolved = value && !known
    ? `<option value="${escapeHtml(value)}" selected>Unresolved saved ID · ${escapeHtml(value)}</option>` : "";
  return `<label>${escapeHtml(label)}<select ${attrs}${disabled ? " disabled" : ""}>` +
    `<option value=""${value ? "" : " selected"}>Choose an exact saved reference…</option>${unresolved}` +
    choices.map((choice) => `<option value="${escapeHtml(choice.id)}"${key(choice.id) === key(value) ? " selected" : ""}>${escapeHtml(choice.label)}</option>`).join("") +
    `</select></label>`;
}

function rowControl(
  scenarioId: string,
  rowKind: ScenarioRowKind,
  rowId: string,
  field: string,
  value: string,
  disabled: boolean,
  nested?: "scope" | "provenance",
): string {
  const attrs = `data-scenario-input="true" data-se-scenario="${escapeHtml(scenarioId)}"` +
    ` data-se-row-kind="${rowKind}" data-se-row-id="${escapeHtml(rowId)}"` +
    ` data-se-field="${field}"${nested ? ` data-se-nested="${nested}"` : ""}`;
  return input(field, value, attrs, disabled);
}

function variantReferenceControl(
  scenario: ScenarioRecord,
  rowKind: ScenarioRowKind,
  rowId: string,
  fieldName: "variantId",
  value: string,
  collection: CollectionRecord | undefined,
  disabled: boolean,
): string {
  const choices = collection?.skus.flatMap((sku) => sku.variants.map((variant) => ({
    id: variant.id,
    label: `${sku.code} · ${variant.skuCode} · ${variant.sizeId}`,
  }))) ?? [];
  const attrs = `data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}"` +
    ` data-se-row-kind="${rowKind}" data-se-row-id="${escapeHtml(rowId)}" data-se-field="${fieldName}"`;
  return referenceSelect("Variant reference", value, choices, attrs, disabled);
}

function provenanceControls(scenario: ScenarioRecord, kind: ScenarioRowKind, rowId: string, provenance: ScenarioRecord["units"][number]["provenance"], disabled: boolean): string {
  return `<fieldset class="scenario-provenance"><legend>Source and validity</legend>` +
    `${rowControl(scenario.id, kind, rowId, "kind", provenance.kind, disabled, "provenance")}` +
    `${rowControl(scenario.id, kind, rowId, "sourceLabel", provenance.sourceLabel, disabled, "provenance")}` +
    `${rowControl(scenario.id, kind, rowId, "asOf", provenance.asOf, disabled, "provenance")}` +
    `${rowControl(scenario.id, kind, rowId, "validThrough", provenance.validThrough, disabled, "provenance")}</fieldset>`;
}

function scopeControls(
  scenario: ScenarioRecord,
  kind: "moqs" | "capacityDelivery",
  rowId: string,
  scope: ScenarioDraftScope,
  collection: CollectionRecord | undefined,
  disabled: boolean,
): string {
  const styleChoices = [...new Map((collection?.skus ?? []).map((sku) => [key(sku.styleId), { id: sku.styleId, label: sku.styleId }])).values()];
  const skuChoices = collection?.skus.map((sku) => ({ id: sku.id, label: `${sku.code} · ${sku.name}` })) ?? [];
  const colorwayChoices = collection?.skus.flatMap((sku) => sku.colorways.map((colorway) => ({
    id: colorway.id, label: `${sku.code} · ${colorway.name}`,
  }))) ?? [];
  const variantChoices = collection?.skus.flatMap((sku) => sku.variants.map((variant) => ({
    id: variant.id, label: `${sku.code} · ${variant.skuCode}`,
  }))) ?? [];
  const attrs = (field: string): string => `data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}" data-se-row-kind="${kind}" data-se-row-id="${escapeHtml(rowId)}" data-se-nested="scope" data-se-field="${field}"`;
  return `<fieldset class="scenario-scope"><legend>Comparison scope</legend>` +
    `${select("Scope kind", scope.kind, ["", "order", "styleId", "sku", "colorway", "variant"],
      attrs("kind"), disabled)}` +
    `${referenceSelect("Style reference", scope.styleId, styleChoices, attrs("styleId"), disabled)}` +
    `${referenceSelect("SKU reference", scope.skuId, skuChoices, attrs("skuId"), disabled)}` +
    `${referenceSelect("Colorway reference", scope.colorwayId, colorwayChoices, attrs("colorwayId"), disabled)}` +
    `${referenceSelect("Variant reference", scope.variantId, variantChoices, attrs("variantId"), disabled)}</fieldset>`;
}

function inputRows(scenario: ScenarioRecord, collection: CollectionRecord | undefined, disabled: boolean): string {
  const units = scenario.units.map((row) => `<fieldset class="scenario-input-row"><legend>Quantity row</legend>` +
    `${variantReferenceControl(scenario, "units", row.id, "variantId", row.variantId, collection, disabled)}` +
    `${rowControl(scenario.id, "units", row.id, "units", row.units, disabled)}${provenanceControls(scenario, "units", row.id, row.provenance, disabled)}</fieldset>`).join("");
  const prices = scenario.prices.map((row) => `<fieldset class="scenario-input-row"><legend>Price row</legend>` +
    `${variantReferenceControl(scenario, "prices", row.id, "variantId", row.variantId, collection, disabled)}` +
    `${rowControl(scenario.id, "prices", row.id, "amount", row.amount, disabled)}` +
    `${rowControl(scenario.id, "prices", row.id, "currencyCode", row.currencyCode, disabled)}${provenanceControls(scenario, "prices", row.id, row.provenance, disabled)}</fieldset>`).join("");
  const costs = scenario.costs.map((row) => `<fieldset class="scenario-input-row"><legend>Cost row</legend>` +
    `${variantReferenceControl(scenario, "costs", row.id, "variantId", row.variantId, collection, disabled)}` +
    `${rowControl(scenario.id, "costs", row.id, "amount", row.amount, disabled)}` +
    `${rowControl(scenario.id, "costs", row.id, "currencyCode", row.currencyCode, disabled)}${provenanceControls(scenario, "costs", row.id, row.provenance, disabled)}</fieldset>`).join("");
  const moqs = scenario.moqs.map((row) => `<fieldset class="scenario-input-row"><legend>Minimum order row</legend>` +
    `${scopeControls(scenario, "moqs", row.id, row.scope, collection, disabled)}` +
    `${rowControl(scenario.id, "moqs", row.id, "unit", row.unit, disabled)}` +
    `${rowControl(scenario.id, "moqs", row.id, "minimumUnits", row.minimumUnits, disabled)}` +
    `${provenanceControls(scenario, "moqs", row.id, row.provenance, disabled)}` +
    `<button type="button" data-scenario-action="delete-row" data-se-scenario="${escapeHtml(scenario.id)}" data-se-row-kind="moqs" data-se-row-id="${escapeHtml(row.id)}"${disabled ? " disabled" : ""}>Remove minimum order row</button></fieldset>`).join("");
  const capacities = scenario.capacityDelivery.map((row) => `<fieldset class="scenario-input-row"><legend>Capacity and delivery row</legend>` +
    `${scopeControls(scenario, "capacityDelivery", row.id, row.scope, collection, disabled)}` +
    `${rowControl(scenario.id, "capacityDelivery", row.id, "unitsPerPeriod", row.unitsPerPeriod, disabled)}` +
    `${rowControl(scenario.id, "capacityDelivery", row.id, "periodUnit", row.periodUnit, disabled)}` +
    `${rowControl(scenario.id, "capacityDelivery", row.id, "minimumPeriods", row.minimumPeriods, disabled)}` +
    `${rowControl(scenario.id, "capacityDelivery", row.id, "maximumPeriods", row.maximumPeriods, disabled)}` +
    `${provenanceControls(scenario, "capacityDelivery", row.id, row.provenance, disabled)}` +
    `<button type="button" data-scenario-action="delete-row" data-se-scenario="${escapeHtml(scenario.id)}" data-se-row-kind="capacityDelivery" data-se-row-id="${escapeHtml(row.id)}"${disabled ? " disabled" : ""}>Remove capacity and delivery row</button></fieldset>`).join("");
  return `<div class="scenario-input-columns"><section><h5>Variant plan</h5>${units}${prices}${costs}</section>` +
    `<section><h5>Order and timing constraints</h5>${moqs}${capacities}</section></div>`;
}

export function renderScenarioEditor(inputData: ScenarioEditorInput): string {
  const disabled = inputData.disabled === true;
  const dirty = scenarioDraftsAreDirty(inputData.scenarios, inputData.savedScenarios);
  const invalidRecord = inputData.scenarios.map((scenario) => parseScenarioRecord(scenario)).find((result) => !result.ok);
  const projectValidation = parseScenarioRecords(inputData.scenarios, inputData.scenarios[0]?.projectId ?? "");
  const validationMessage = invalidRecord?.ok === false ? invalidRecord.error
    : projectValidation.ok ? null : projectValidation.error;
  const collectionOptions = inputData.collections.map((collection) => ({ id: collection.id, name: collection.name || "Unnamed collection" }));
  const cards = inputData.scenarios.map((scenario) => {
    const linkedCollection = inputData.collections.find((collection) => key(collection.id) === key(scenario.collectionId));
    const unresolved = !linkedCollection
      ? `<option value="${escapeHtml(scenario.collectionId)}" selected>Unavailable collection · ${escapeHtml(scenario.collectionId)}</option>`
      : "";
    const collections = `${unresolved}${collectionOptions.map((collection) =>
      `<option value="${escapeHtml(collection.id)}"${key(collection.id) === key(scenario.collectionId) ? " selected" : ""}>${escapeHtml(collection.name)}</option>`).join("")}`;
    const hasLinkedCollection = linkedCollection !== undefined;
    return `<article class="scenario-card" data-scenario-card="${escapeHtml(scenario.id)}"><header><h4>${escapeHtml(scenario.name || "Untitled scenario")}</h4>` +
      `<button type="button" data-scenario-action="delete" data-se-scenario="${escapeHtml(scenario.id)}"${disabled ? " disabled" : ""}>Delete scenario</button></header>` +
      `<div class="scenario-header-fields">` +
      `${input("Scenario name", scenario.name, `data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}" data-se-field="name"`, disabled)}` +
      `<label>Collection<select data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}" data-se-field="collectionId"${disabled ? " disabled" : ""}>${collections}</select></label>` +
      `${input("Evaluation date", scenario.evaluationDate, `data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}" data-se-field="evaluationDate"`, disabled)}` +
      `${input("Currency code", scenario.currencyCode, `data-scenario-input="true" data-se-scenario="${escapeHtml(scenario.id)}" data-se-field="currencyCode"`, disabled)}</div>` +
      `${inputRows(scenario, linkedCollection, disabled)}` +
      `<div class="scenario-card-actions"><button type="button" data-scenario-action="add-moq" data-se-scenario="${escapeHtml(scenario.id)}"${disabled || scenario.moqs.length >= SCENARIO_INPUT_LIST_LIMIT ? " disabled" : ""}>Add minimum order</button>` +
      `<button type="button" data-scenario-action="add-capacity-delivery" data-se-scenario="${escapeHtml(scenario.id)}"${disabled || scenario.capacityDelivery.length >= SCENARIO_INPUT_LIST_LIMIT ? " disabled" : ""}>Add capacity and delivery</button>` +
      `<button type="button" data-scenario-action="add-missing" data-se-scenario="${escapeHtml(scenario.id)}"${disabled || !hasLinkedCollection ? " disabled" : ""}>Add rows for new collection variants</button></div>` +
      `<div class="scenario-result" data-scenario-result="${escapeHtml(scenario.id)}">${resultMarkup(calculateScenarioDraft(scenario, inputData.collections), scenario)}</div></article>`;
  }).join("");
  const addSelector = `<label>Collection for new scenario<select id="scenario-create-collection"${disabled || collectionOptions.length === 0 ? " disabled" : ""}>` +
    `${collectionOptions.map((collection) => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`).join("")}</select></label>`;
  const recordError = validationMessage ? `<p class="scenario-validation" role="alert">${escapeHtml(validationMessage)}</p>` : "";
  return `<section class="scenario-editor-panel" aria-labelledby="scenario-editor-title"><h3 id="scenario-editor-title">Scenario planner</h3>` +
    `<p>Enter quantities, prices, costs, constraints, source labels and dates. Invalid or incomplete text stays saved for repair; calculations use only these entered values.</p>` +
    `<div class="scenario-create-controls">${addSelector}<button type="button" data-scenario-action="create"${disabled || collectionOptions.length === 0 ? " disabled" : ""}>Create scenario</button></div>` +
    `${recordError}${cards || `<p>No scenarios saved. Create one from a collection to begin.</p>`}` +
    `<div class="scenario-editor-actions"><button type="button" data-scenario-action="save"${disabled || !dirty || validationMessage !== null ? " disabled" : ""}>Save scenarios</button>` +
    `<button type="button" data-scenario-action="discard"${disabled || !dirty ? " disabled" : ""}>Discard unsaved scenario edits</button></div></section>`;
}

export function reduceScenarioDrafts(
  drafts: readonly ScenarioRecord[],
  action: ScenarioEditorAction,
): readonly ScenarioRecord[] {
  if (action.type === "delete") return drafts.filter((scenario) => key(scenario.id) !== key(action.scenarioId));
  return drafts.map((scenario) => {
    if (key(scenario.id) !== key(action.scenarioId)) return scenario;
    if (action.type === "update") {
      if (action.field !== "name" && action.field !== "collectionId" && action.field !== "evaluationDate" && action.field !== "currencyCode") return scenario;
      return { ...scenario, [action.field]: action.value };
    }
    if (action.type === "update-row") {
      const rows = scenario[action.rowKind] as unknown as readonly Record<string, unknown>[];
      const updated = rows.map((row) => {
        if (key(row.id as string) !== key(action.rowId)) return row;
        if (action.nested) {
          const nested = row[action.nested] as Record<string, string>;
          return { ...row, [action.nested]: { ...nested, [action.field]: action.value } };
        }
        return { ...row, [action.field]: action.value };
      });
      return { ...scenario, [action.rowKind]: updated };
    }
    if (action.type === "add-moq") return { ...scenario, moqs: [...scenario.moqs, action.row] };
    if (action.type === "add-capacity-delivery") return { ...scenario, capacityDelivery: [...scenario.capacityDelivery, action.row] };
    if (action.type === "delete-row") return { ...scenario, [action.rowKind]: scenario[action.rowKind].filter((row) => key(row.id) !== key(action.rowId)) };
    const updated = addMissingScenarioVariantRows(scenario, action.collection, action.projectScenarios, action.uuid);
    return updated.ok ? updated.value : scenario;
  });
}

export function updateScenarioEditorControls(
  root: ParentNode,
  scenarios: readonly ScenarioRecord[],
  collections: readonly CollectionRecord[],
  savedScenarios: readonly ScenarioRecord[],
  busy: boolean,
): void {
  for (const scenario of scenarios) {
    const target = root.querySelector<HTMLElement>(`[data-scenario-result="${scenario.id}"]`);
    if (target) target.innerHTML = resultMarkup(calculateScenarioDraft(scenario, collections), scenario);
  }
  const dirty = scenarioDraftsAreDirty(scenarios, savedScenarios);
  const invalid = scenarios.some((scenario) => !parseScenarioRecord(scenario).ok)
    || !parseScenarioRecords(scenarios, scenarios[0]?.projectId ?? "").ok;
  const save = root.querySelector<HTMLButtonElement>("[data-scenario-action='save']");
  if (save) save.disabled = busy || !dirty || invalid;
  const discard = root.querySelector<HTMLButtonElement>("[data-scenario-action='discard']");
  if (discard) discard.disabled = busy || !dirty;
}
