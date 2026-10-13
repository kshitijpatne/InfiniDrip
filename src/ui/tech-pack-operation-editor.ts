/** Local T03 operation editor markup. Persistence and mutation stay in ProjectManager. */
import {
  TECH_PACK_OPERATION_MAX_RECORDS,
  TECH_PACK_OPERATION_RECIPE_IDS,
  emptyTechPackOperationRecordSetV2,
  type TechPackOperationRecordSet,
  type TechPackOperationRecipeId,
} from "./tech-pack-operation-records";
import type { TechPackOperationValidation } from "./tech-pack-operation-validation";
import type { TechPackRecord } from "./tech-pack-records";

export interface TechPackOperationEditorModel {
  readonly record: TechPackRecord;
  readonly operationsJsonDraft?: string | null;
  readonly disabled?: boolean;
  readonly validation?: TechPackOperationValidation | null;
  readonly validationError?: string | null;
}

const RECIPE_IDS = new Set<string>(TECH_PACK_OPERATION_RECIPE_IDS);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function emptyData(record: TechPackRecord): TechPackOperationRecordSet | null {
  if (!RECIPE_IDS.has(record.recipeId)) return null;
  return record.operationData ?? emptyTechPackOperationRecordSetV2(record.recipeId as TechPackOperationRecipeId);
}

function operationRows(data: TechPackOperationRecordSet, disabled: string): string {
  if (data.operations.length === 0) return "<p data-t03-empty>There are no operation records. Add an unresolved operation shell only when a construction step is ready to track.</p>";
  return data.operations.map((operation) => {
    const name = operation.name.value === null ? "Operation name unresolved" : String(operation.name.value);
    return `<article class="t03-operation" data-t03-operation-id="${escapeHtml(operation.id)}">` +
      `<h5>${escapeHtml(name)} <code>${escapeHtml(operation.id)}</code></h5>` +
      `<p>Name ${escapeHtml(operation.name.status)} · sequence ${escapeHtml(operation.sequence.status)} · components ${escapeHtml(operation.componentRefs.status)} · seams ${escapeHtml(operation.seamRefs.status)}</p>` +
      `<button type="button" data-t03-action="remove-operation" data-t03-operation-id="${escapeHtml(operation.id)}"${disabled}>Remove operation</button>` +
      `</article>`;
  }).join("");
}

function validationRows(validation: TechPackOperationValidation | null | undefined, error: string | null | undefined): string {
  if (error) return `<p class="t03-validation-error" role="alert">${escapeHtml(error)}</p>`;
  if (!validation) return "<p>Enter a valid operation record to see its validation summary.</p>";
  const statusOrder = ["ABSENT", "UNRESOLVED", "CONFLICT", "RECIPE_DEFAULT", "ESTIMATE", "USER_DECISION", "SOURCE_CONFIRMED"] as const;
  const counts = statusOrder.map((status) => `${status.replace(/_/g, " ")} ${validation.counts[status]}`).join(" · ");
  if (validation.findings.length === 0) return `<p data-t03-validation-counts>${escapeHtml(counts)}</p>`;
  return `<p data-t03-validation-counts>${escapeHtml(counts)}</p><ul class="t03-validation-findings">` +
    validation.findings.map((finding) => `<li data-t03-finding="${finding.status}">` +
      `<strong>${escapeHtml(finding.status.replace(/_/g, " "))}</strong> · ${escapeHtml(finding.path)}: ${escapeHtml(finding.message)} ` +
      `<span>Next: ${escapeHtml(finding.nextAction)}</span></li>`).join("") +
    `</ul>`;
}

export function renderTechPackOperationRows(data: TechPackOperationRecordSet, disabled = false): string {
  return operationRows(data, disabled ? " disabled" : "");
}

export function renderTechPackOperationValidation(
  validation: TechPackOperationValidation | null | undefined,
  error: string | null | undefined,
): string {
  return `<h5>Operation validation</h5>${validationRows(validation, error)}`;
}

export function renderTechPackOperationEditor(model: TechPackOperationEditorModel): string {
  const data = emptyData(model.record);
  if (!data) return `<section class="t03-editor" aria-label="T03 construction operations"><h4>T03 · Construction operations</h4><p>This recipe is not supported by the T03 operation record.</p></section>`;
  const source = model.operationsJsonDraft ?? JSON.stringify(data, null, 2);
  const addDisabled = model.disabled || data.operations.length >= TECH_PACK_OPERATION_MAX_RECORDS ? " disabled" : "";
  return `<section class="t03-editor" aria-label="T03 construction operations">` +
    `<h4>T03 · Construction operations</h4>` +
    `<p>Operation facts are separate from recipe defaults. Source-confirmed facts require a source reference; recipe defaults, estimates, and user decisions remain labeled and are not source evidence. Component and seam inventory reconciliation is checked in S773.</p>` +
    `<label for="project-t03-operations">Operation records (strict JSON)</label>` +
    `<textarea id="project-t03-operations" data-t03-input="operations" rows="12" spellcheck="false" aria-describedby="project-t03-schema">${escapeHtml(source)}</textarea>` +
    `<p id="project-t03-schema">Each operation has id, name, sequence, componentRefs, seamRefs, and facts. Version 2 supports SOURCE_CONFIRMED, UNRESOLVED, CONFLICT, RECIPE_DEFAULT, ESTIMATE, and USER_DECISION states. Defaults require recipe id/version marker/in-app locator; estimates require method/assumptions; decisions require rationale.</p>` +
    `<div class="t03-editor-actions"><button type="button" data-t03-action="add-unresolved-operation"${addDisabled}>Add unresolved operation</button></div>` +
    `<div class="t03-operations">${renderTechPackOperationRows(data, model.disabled)}</div>` +
    `<section class="t03-validation" aria-label="T03 validation summary">${renderTechPackOperationValidation(model.validation, model.validationError)}</section>` +
    `</section>`;
}
