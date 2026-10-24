/** Render side-by-side summaries from the existing scenario and collection records. */
import { calculateScenarioDraft } from "./scenario-editor";
import type { CollectionRecord } from "./collection-records";
import type { CollectionSourceStatus } from "./collection-source-validation";
import type {
  ConstraintOutcome,
  ScenarioCalculationResult,
  ScenarioCapacityResult,
  ScenarioMoqResult,
} from "./scenario-calculations";
import type { ScenarioRecord } from "./scenario-records";

export interface ScenarioComparisonInput {
  readonly scenarios: readonly ScenarioRecord[];
  readonly collections: readonly CollectionRecord[];
  readonly collectionSourceStatuses: readonly CollectionSourceStatus[];
}

interface ScenarioView {
  readonly scenario: ScenarioRecord;
  readonly collection: CollectionRecord | undefined;
  readonly calculation: ScenarioCalculationResult | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function key(value: string): string {
  return value.toLowerCase();
}

function text(value: string): string {
  return value.trim() ? escapeHtml(value) : "<span class=\"scenario-comparison-missing\">Missing</span>";
}

function list(items: readonly string[], empty: string): string {
  return items.length === 0 ? escapeHtml(empty) : `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function financialSummary(view: ScenarioView, field: "totalUnits" | "totalPrice" | "totalCost" | "totalMargin"): string {
  const summary = view.calculation?.financialSummary;
  if (!summary) return "Not available; see calculation state and blockers.";
  return field === "totalUnits"
    ? escapeHtml(summary.totalUnits)
    : `${escapeHtml(summary.currencyCode)} ${escapeHtml(summary[field])}`;
}

function unitMargins(view: ScenarioView): string {
  const summary = view.calculation?.financialSummary;
  if (!summary) return "Not available; see calculation state and blockers.";
  return list(summary.variants.map((variant) =>
    `<code>${escapeHtml(variant.variantId)}</code>: ${escapeHtml(summary.currencyCode)} ${escapeHtml(variant.unitMargin)}`),
  "No variant margins are available.");
}

function formatConstraintResults<T>(
  results: readonly ConstraintOutcome<T>[] | undefined,
  label: "MOQ" | "capacity",
  formatValue: (value: T, pairedPath?: string) => string,
): string {
  if (!results || results.length === 0) return `No ${label} result recorded.`;
  return `<ul>${results.map((result) => {
    if (!result.ok) return `<li><code>${escapeHtml(result.path)}</code>: needs attention (${result.blockers.map((blocker) => escapeHtml(blocker.code)).join(", ")})</li>`;
    return `<li>${formatValue(result.value, result.pairedPath)}</li>`;
  }).join("")}</ul>`;
}

function pairedDeliveryInterval(view: ScenarioView, pairedPath: string): string {
  const rowIndex = Number(pairedPath.slice("scenario.deliveries[".length, -1));
  const delivery = view.scenario.capacityDelivery[rowIndex]!;
  return `${text(delivery.minimumPeriods)}–${text(delivery.maximumPeriods)} ${text(delivery.periodUnit)} interval`;
}

function constraintResults(view: ScenarioView, kind: "moq" | "capacity"): string {
  if (kind === "moq") {
    return formatConstraintResults<ScenarioMoqResult>(view.calculation?.moqResults, "MOQ", (result) =>
      `${escapeHtml(result.outcome)} · ${escapeHtml(result.plannedUnits)} planned / ${escapeHtml(result.minimumUnits)} minimum`);
  }
  return formatConstraintResults<ScenarioCapacityResult>(view.calculation?.capacityResults, "capacity", (result, pairedPath) =>
    `${escapeHtml(result.outcome)} · ${escapeHtml(result.plannedUnits)} planned; ${escapeHtml(result.minimumCapacityUnits)}–${escapeHtml(result.maximumCapacityUnits)} total capacity units for the ${pairedDeliveryInterval(view, pairedPath!)}`);
}

function deliveryRanges(scenario: ScenarioRecord): string {
  return list(scenario.capacityDelivery.map((row) =>
    `${text(row.minimumPeriods)}–${text(row.maximumPeriods)} ${text(row.periodUnit)}`), "No delivery interval entered.");
}

function sharedMaterials(collection: CollectionRecord | undefined): string {
  if (!collection) return "Unavailable collection; no shared-material links can be read.";
  const groups = collection.sharedMaterialGroups.map((group) =>
    `<li><strong>${text(group.name)}</strong>${list(group.members.map((member) =>
      `<code>${escapeHtml(member.skuId)}</code> → <code>${escapeHtml(member.materialId)}</code>`), "No member links.")}</li>`);
  return groups.length === 0
    ? "No shared-material group recorded."
    : `<ul>${groups.join("")}</ul><p>These are user-authored links; they do not establish equivalence, availability or material usage.</p>`;
}

function provenanceRows(view: ScenarioView): string {
  const { scenario, calculation } = view;
  const inputs = [
    ...scenario.units.map((row, index) => ({ path: `scenario.units[${index}].provenance`, provenance: row.provenance })),
    ...scenario.prices.map((row, index) => ({ path: `scenario.prices[${index}].provenance`, provenance: row.provenance })),
    ...scenario.costs.map((row, index) => ({ path: `scenario.costs[${index}].provenance`, provenance: row.provenance })),
    ...scenario.moqs.map((row, index) => ({ path: `scenario.moqs[${index}].provenance`, provenance: row.provenance })),
    ...scenario.capacityDelivery.map((row, index) => ({ path: `scenario.capacities[${index}].provenance`, provenance: row.provenance })),
  ];
  return list(inputs.map(({ path, provenance }) => {
    const status = calculation?.sourceStatuses.find((source) => source.path === path)?.status ?? "not evaluated";
    const validity = provenance.validThrough.trim() ? `valid through ${text(provenance.validThrough)}` : "validity date not entered";
    return `<code>${escapeHtml(path)}</code>: ${text(provenance.sourceLabel)} · ${text(provenance.kind)} · as of ${text(provenance.asOf)} · ${validity} · ${escapeHtml(status)}`;
  }), "No input provenance rows recorded.");
}

function collectionRevisions(
  view: ScenarioView,
  sourceStatuses: readonly CollectionSourceStatus[],
): string {
  if (!view.collection) return "Unavailable collection source revision.";
  const statuses = sourceStatuses.filter((status) => key(status.collectionId) === key(view.collection!.id));
  return list(statuses.map((status) => {
    const state = status.isStale ? "stale" : "current";
    const archived = status.isArchived ? " · archived" : "";
    return `<code>${escapeHtml(status.skuCode)}</code>: r${status.pinnedRevisionNumber} pinned / r${status.headRevisionNumber} current · ${state}${archived}`;
  }), "No resolved source-revision status is available.");
}

function blockers(view: ScenarioView): string {
  const entries = view.calculation?.blockers ?? [];
  if (!view.calculation) return "Calculation unavailable until this scenario has a saved collection.";
  return list(entries.map((blocker) =>
    `<code>${escapeHtml(blocker.path)}</code> · <strong>${escapeHtml(blocker.code)}</strong>: ${escapeHtml(blocker.message)}`),
  "No calculation blockers.");
}

/** Keeps all scenario values separate; no cross-scenario aggregation or ranking is performed. */
export function renderScenarioComparison(input: ScenarioComparisonInput): string {
  if (input.scenarios.length === 0) {
    return `<section class="scenario-comparison" aria-labelledby="scenario-comparison-title" data-scenario-comparison="true"><h3 id="scenario-comparison-title">Scenario comparison</h3><p role="status">No scenarios are available to compare yet.</p></section>`;
  }
  const views = input.scenarios.map((scenario): ScenarioView => {
    const collection = input.collections.find((candidate) => key(candidate.id) === key(scenario.collectionId));
    return { scenario, collection, calculation: calculateScenarioDraft(scenario, input.collections) };
  });
  const row = (label: string, value: (view: ScenarioView) => string) =>
    `<tr><th scope="row">${escapeHtml(label)}</th>${views.map((view) => `<td>${value(view)}</td>`).join("")}</tr>`;
  const headers = views.map(({ scenario, collection }) =>
    `<th scope="col"><strong>${text(scenario.name || "Untitled scenario")}</strong><span>${collection ? text(collection.name || "Unnamed collection") : `Unavailable collection · <code>${escapeHtml(scenario.collectionId)}</code>`}</span><span>Currency: ${text(scenario.currencyCode)}</span></th>`).join("");
  return `<section class="scenario-comparison" aria-labelledby="scenario-comparison-title" data-scenario-comparison="true">` +
    `<h3 id="scenario-comparison-title">Scenario comparison</h3>` +
    `<p>Each column keeps its own inputs and currency. Values are not added across scenarios or ranked.</p>` +
    `<div class="scenario-comparison-scroll" role="region" aria-label="Scenario comparison table" tabindex="0">` +
    `<table><caption>Current scenario drafts, constraints and source status</caption><thead><tr><th scope="col">Measure</th>${headers}</tr></thead><tbody>` +
    row("Calculation", (view) => view.calculation
      ? `<span class="scenario-state scenario-state-${view.calculation.state}">${escapeHtml(view.calculation.state)}</span>`
      : "Blocked · collection unavailable") +
    row("Planned units", (view) => financialSummary(view, "totalUnits")) +
    row("Total price", (view) => financialSummary(view, "totalPrice")) +
    row("Total cost", (view) => financialSummary(view, "totalCost")) +
    row("Total margin", (view) => financialSummary(view, "totalMargin")) +
    row("Unit margin by variant", unitMargins) +
    row("MOQ results", (view) => constraintResults(view, "moq")) +
    row("Capacity results", (view) => constraintResults(view, "capacity")) +
    row("Entered delivery intervals", (view) => deliveryRanges(view.scenario)) +
    row("Shared-material links", (view) => sharedMaterials(view.collection)) +
    row("Input source labels and validity", provenanceRows) +
    row("Collection source revisions", (view) => collectionRevisions(view, input.collectionSourceStatuses)) +
    row("Blockers", blockers) +
    `</tbody></table></div></section>`;
}
