/** Local editable T02 POM definition and sample/QA flow; rendering only. */
import {
  TECH_PACK_POM_RECIPE_IDS,
  type TechPackPomDefinition,
  type TechPackPomRecipeId,
  type TechPackPomUnit,
} from "./tech-pack-pom-records";
import {
  emptyTechPackPomRecordSet,
  type TechPackPomRecordSet,
  type TechPackPomSampleQaRound,
} from "./tech-pack-sample-qa-records";
import type { TechPackRecord } from "./tech-pack-records";

export interface TechPackT02RevisionOption {
  readonly revisionId: string;
  readonly revisionNumber: number;
}

export interface TechPackT02EditorModel {
  readonly record: TechPackRecord;
  readonly revisions: readonly TechPackT02RevisionOption[];
  readonly definitionsJsonDraft?: string | null;
  readonly disabled?: boolean;
}

const RECIPE_IDS = new Set<string>(TECH_PACK_POM_RECIPE_IDS);
const UNITS: readonly TechPackPomUnit[] = ["cm", "mm", "in"];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function valueText(value: number | null): string {
  return value === null ? "" : String(value);
}

function unavailableData(recipeId: string): TechPackPomRecordSet | null {
  if (!RECIPE_IDS.has(recipeId)) return null;
  return emptyTechPackPomRecordSet(recipeId as TechPackPomRecipeId);
}

function sourceState(definition: TechPackPomDefinition, fact: "method" | "landmarks" | "tolerance" | "sizeRangeSource" | "gradeRuleSource"): string {
  return definition[fact].status;
}

function sourceSummary(definition: TechPackPomDefinition): string {
  return [
    `Method ${sourceState(definition, "method")}`,
    `Landmarks ${sourceState(definition, "landmarks")}`,
    `Tolerance ${sourceState(definition, "tolerance")}`,
    `Size range ${sourceState(definition, "sizeRangeSource")}`,
    `Grade rule ${sourceState(definition, "gradeRuleSource")}`,
  ].map(escapeHtml).join(" · ");
}

function definitionRows(records: TechPackPomRecordSet, disabled: string): string {
  if (records.definitions.definitions.length === 0) {
    return `<p data-t02-empty="definitions">No POM definitions are recorded. Add one with an explicit unit; each source fact starts unresolved.</p>`;
  }
  return records.definitions.definitions.map((definition) =>
    `<article class="t02-definition" data-t02-definition-id="${escapeHtml(definition.id)}">` +
    `<h5>${escapeHtml(definition.label)} <code>${escapeHtml(definition.id)}</code></h5>` +
    `<p>Unit ${escapeHtml(definition.unit)}. ${sourceSummary(definition)}</p>` +
    `<button type="button" data-t02-action="remove-definition" data-t02-pom-id="${escapeHtml(definition.id)}"${disabled}>Remove definition</button>` +
    `</article>`).join("");
}

function readingMarkup(round: TechPackPomSampleQaRound, data: TechPackPomRecordSet, disabled: string): string {
  const definitions = new Map(data.definitions.definitions.map((definition) => [definition.id, definition]));
  if (round.readings.length === 0) return `<p data-t02-empty-readings="${escapeHtml(round.id)}">No actual readings recorded. Predicted values remain separate.</p>`;
  return round.readings.map((reading) => {
    const definition = definitions.get(reading.pomDefinitionId);
    const heading = definition ? `${definition.label} (${definition.unit})` : `Missing POM ${reading.pomDefinitionId}`;
    const base = `data-t02-input="reading" data-t02-round-id="${escapeHtml(round.id)}" data-t02-pom-id="${escapeHtml(reading.pomDefinitionId)}"`;
    const unresolved = reading.status === "UNRESOLVED";
    return `<article class="t02-reading" data-t02-reading="${escapeHtml(reading.pomDefinitionId)}">` +
      `<h6>${escapeHtml(heading)}</h6>` +
      `<p data-t02-reading-status="${reading.status}">${unresolved ? "Actual reading unresolved" : "Recorded sample actual"}</p>` +
      (unresolved
        ? `<label>Reason<input type="text" ${base} data-t02-property="unresolvedReason" maxlength="512" value="${escapeHtml(reading.unresolvedReason ?? "")}"${disabled}></label>` +
          `<label>Next action<input type="text" ${base} data-t02-property="nextAction" maxlength="512" value="${escapeHtml(reading.nextAction ?? "")}"${disabled}></label>`
        : `<label>Actual measurement<input type="number" step="any" ${base} data-t02-property="actualValue" value="${escapeHtml(valueText(reading.actualValue))}"${disabled}></label>` +
          `<label>Measurement method<input type="text" ${base} data-t02-property="method" maxlength="512" value="${escapeHtml(reading.method ?? "")}"${disabled}></label>` +
          `<label>Evidence references (one per line)<textarea ${base} data-t02-property="evidenceRefs" rows="2"${disabled}>${escapeHtml(reading.evidenceRefs.join("\n"))}</textarea></label>` ) +
      `<button type="button" data-t02-action="remove-reading" data-t02-round-id="${escapeHtml(round.id)}" data-t02-pom-id="${escapeHtml(reading.pomDefinitionId)}"${disabled}>Remove reading</button>` +
      `</article>`;
  }).join("");
}

function observationMarkup(round: TechPackPomSampleQaRound, disabled: string): string {
  if (round.qaObservations.length === 0) return `<p data-t02-empty-qa="${escapeHtml(round.id)}">No QA observations recorded. This does not imply a pass.</p>`;
  return round.qaObservations.map((observation) => {
    const base = `data-t02-input="observation" data-t02-round-id="${escapeHtml(round.id)}" data-t02-observation-id="${escapeHtml(observation.id)}"`;
    return `<article class="t02-observation" data-t02-observation="${escapeHtml(observation.id)}">` +
      `<label>Observation status<select ${base} data-t02-property="status"${disabled}>` +
      `<option value="OBSERVED"${observation.status === "OBSERVED" ? " selected" : ""}>Observed</option>` +
      `<option value="UNRESOLVED"${observation.status === "UNRESOLVED" ? " selected" : ""}>Unresolved</option></select></label>` +
      `<label>Note or unresolved reason<textarea ${base} data-t02-property="note" rows="2" maxlength="512"${disabled}>${escapeHtml(observation.note)}</textarea></label>` +
      `<label>Next action<input type="text" ${base} data-t02-property="nextAction" maxlength="512" value="${escapeHtml(observation.nextAction ?? "")}"${disabled}></label>` +
      `<button type="button" data-t02-action="remove-observation" data-t02-round-id="${escapeHtml(round.id)}" data-t02-observation-id="${escapeHtml(observation.id)}"${disabled}>Remove observation</button>` +
      `</article>`;
  }).join("");
}

function roundMarkup(round: TechPackPomSampleQaRound, data: TechPackPomRecordSet, disabled: string): string {
  const base = `data-t02-input="round" data-t02-round-id="${escapeHtml(round.id)}"`;
  const definitions = data.definitions.definitions;
  const recordedActualIds = new Set(round.readings.map((reading) => reading.pomDefinitionId));
  const availableOptions = definitions.filter((definition) => !recordedActualIds.has(definition.id));
  const options = availableOptions.map((definition) =>
    `<option value="${escapeHtml(definition.id)}">${escapeHtml(definition.label)} (${escapeHtml(definition.unit)})</option>`).join("");
  return `<article class="t02-round" data-t02-round="${escapeHtml(round.id)}">` +
    `<h5>${escapeHtml(round.sampleLabel)} — ${escapeHtml(round.sampleSizeId)}</h5>` +
    `<p data-t02-target-revision="${escapeHtml(round.targetRevisionId)}">Bound to immutable style revision r${round.targetRevisionNumber} (${escapeHtml(round.targetRevisionId)}). Editing this round will not retarget it.</p>` +
    `<p>Recorded ${escapeHtml(round.recordedAt)} by ${escapeHtml(round.recordedBy)}. Actual readings are stored separately from pattern predictions.</p>` +
    `<label>Sample label<input type="text" ${base} data-t02-property="sampleLabel" maxlength="160" value="${escapeHtml(round.sampleLabel)}"${disabled}></label>` +
    `<label>Sample size ID<input type="text" ${base} data-t02-property="sampleSizeId" maxlength="120" value="${escapeHtml(round.sampleSizeId)}"${disabled}></label>` +
    `<label>Recorded by<input type="text" ${base} data-t02-property="recordedBy" maxlength="160" value="${escapeHtml(round.recordedBy)}"${disabled}></label>` +
    `<h6>Actual POM readings</h6>${readingMarkup(round, data, disabled)}` +
    `${availableOptions.length === 0 ? `<p>No unrecorded POM definition is available for this round.</p>` :
      `<div class="t02-add-reading"><label>POM<select data-t02-new-reading-pom="${escapeHtml(round.id)}"${disabled}><option value="">Choose a POM definition</option>${options}</select></label>` +
      `<label>Actual value<input type="number" step="any" data-t02-new-reading-value="${escapeHtml(round.id)}"${disabled}></label>` +
      `<label>Measurement method<input type="text" data-t02-new-reading-method="${escapeHtml(round.id)}" maxlength="512"${disabled}></label>` +
      `<label>Evidence references (one per line)<textarea data-t02-new-reading-evidence="${escapeHtml(round.id)}" rows="2"${disabled}></textarea></label>` +
      `<button type="button" data-t02-action="add-measured-reading" data-t02-round-id="${escapeHtml(round.id)}"${disabled}>Add actual reading</button></div>`}` +
    `${availableOptions.length === 0 ? "" : `<div class="t02-add-unresolved-reading"><label>POM<select data-t02-new-unresolved-pom="${escapeHtml(round.id)}"${disabled}><option value="">Choose a POM definition</option>${options}</select></label>` +
      `<label>Reason<input type="text" data-t02-new-unresolved-reason="${escapeHtml(round.id)}" maxlength="512"${disabled}></label>` +
      `<label>Next action<input type="text" data-t02-new-unresolved-action="${escapeHtml(round.id)}" maxlength="512"${disabled}></label>` +
      `<button type="button" data-t02-action="add-unresolved-reading" data-t02-round-id="${escapeHtml(round.id)}"${disabled}>Record unresolved reading</button></div>`}` +
    `<h6>QA observations</h6>${observationMarkup(round, disabled)}` +
    `<div class="t02-add-observation"><label>Status<select data-t02-new-observation-status="${escapeHtml(round.id)}"${disabled}><option value="">Choose status</option><option value="OBSERVED">Observed</option><option value="UNRESOLVED">Unresolved</option></select></label>` +
    `<label>Observation or unresolved reason<textarea data-t02-new-observation-note="${escapeHtml(round.id)}" rows="2" maxlength="512"${disabled}></textarea></label>` +
    `<label>Next action<input type="text" data-t02-new-observation-action="${escapeHtml(round.id)}" maxlength="512"${disabled}></label>` +
    `<button type="button" data-t02-action="add-observation" data-t02-round-id="${escapeHtml(round.id)}"${disabled}>Add QA observation</button></div>` +
    `<button type="button" data-t02-action="remove-round" data-t02-round-id="${escapeHtml(round.id)}"${disabled}>Remove sample/QA round</button></article>`;
}

export function renderTechPackT02Editor(model: TechPackT02EditorModel): string {
  const { record } = model;
  const data = record.pomData ?? unavailableData(record.recipeId);
  if (!data) return `<section class="t02-editor" data-t02-editor="true"><h3>T02 POM and sample/QA</h3><p>This recipe has no T02 record contract.</p></section>`;
  const disabled = model.disabled === true ? " disabled" : "";
  const revisions = [...model.revisions].sort((left, right) => left.revisionNumber - right.revisionNumber);
  const definitionJson = model.definitionsJsonDraft ?? JSON.stringify(data.definitions, null, 2);
  const revisionOptions = revisions.map((revision) =>
    `<option value="${escapeHtml(revision.revisionId)}" data-t02-revision-number="${revision.revisionNumber}">Revision r${revision.revisionNumber} — ${escapeHtml(revision.revisionId)}</option>`).join("");
  const newRoundDisabled = disabled || revisions.length === 0 ? " disabled" : "";
  return `<section class="t02-editor" data-t02-editor="true" aria-labelledby="t02-editor-title">` +
    `<h3 id="t02-editor-title">T02 POM definitions and sample/QA</h3>` +
    `<p>Source facts stay sourced, unresolved, or conflicting. Sample actuals and QA notes are editable local records tied to the selected immutable style revision; predicted pattern values stay separate. These records do not establish physical fit or acceptance.</p>` +
    `<section class="t02-definitions" aria-label="POM definitions">` +
    `<h4>Source-aware POM definitions</h4>${definitionRows(data, disabled)}` +
    `<div class="t02-add-definition"><label>POM ID<input type="text" data-t02-new-pom-id maxlength="120"${disabled}></label>` +
    `<label>Label<input type="text" data-t02-new-pom-label maxlength="160"${disabled}></label>` +
    `<label>Unit<select data-t02-new-pom-unit${disabled}><option value="">Choose a unit</option>${UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}</select></label>` +
    `<button type="button" data-t02-action="add-definition"${disabled}>Add unresolved POM definition</button></div>` +
    `<label>Definition source records (JSON)<textarea data-t02-input="definitions" rows="14" spellcheck="false"${disabled}>${escapeHtml(definitionJson)}</textarea></label>` +
    `<p>Use the strict schema shown here to edit method, landmarks, tolerance, size-range and grade-rule evidence. No measurements or sources are inferred.</p>` +
    `</section>` +
    `<section class="t02-sample-rounds" aria-label="Sample and QA rounds">` +
    `<h4>Sample and QA rounds</h4>` +
    `${revisions.length === 0 ? `<p>No immutable style revision is available. Save the design before creating a revision-bound round.</p>` : ""}` +
    `<div class="t02-add-round"><label>Target style revision<select data-t02-new-round-revision${newRoundDisabled}><option value="">Choose a revision</option>${revisionOptions}</select></label>` +
    `<label>Sample label<input type="text" data-t02-new-round-label maxlength="160"${newRoundDisabled}></label>` +
    `<label>Sample size ID<input type="text" data-t02-new-round-size maxlength="120"${newRoundDisabled}></label>` +
    `<label>Recorded by<input type="text" data-t02-new-round-recorder maxlength="160"${newRoundDisabled}></label>` +
    `<button type="button" data-t02-action="add-round"${newRoundDisabled}>Create revision-bound sample/QA round</button></div>` +
    `${data.sampleQaRounds.length === 0 ? `<p data-t02-empty="sampleQaRounds">No sample/QA rounds recorded. No fit or QA outcome is implied.</p>` : data.sampleQaRounds.map((round) => roundMarkup(round, data, disabled)).join("")}` +
    `</section></section>`;
}
