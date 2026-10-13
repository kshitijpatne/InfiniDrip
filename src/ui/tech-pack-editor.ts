/**
 * Slice 767 isolated pure T01 editor renderer.
 *
 * Presentation only: renders the full editable T01 record as escaping-safe
 * HTML markup with stable `data-t01-*` attributes for Codex-owned
 * integration (editable value inputs, editable source/provenance/evidence
 * metadata controls, selects, row/material/color linkage, nested-record
 * action buttons, and explicit unknown states).
 *
 * Every meaningful TechPackField scalar property is editable through a
 * control carrying `data-t01-input="true"`, its `data-t01-field-id`, and a
 * stable `data-t01-field-property`; only fieldId, semanticKind, and the
 * constant NOT_ASSESSED confidence stay read-only as contract identity.
 * Nested add/remove buttons are disabled-aware pure markup; Codex owns IDs,
 * defaults, relationships, deletion safety, and persistence.
 *
 * This module performs no persistence, revision creation, recipe-specific
 * mutation, approval/freeze action, validation, or cost arithmetic. Entered
 * unit costs, currencies, cost bases, quantities, and quantity bases are
 * rendered exactly as entered; nothing is summed or derived. The strict
 * project parser in `./tech-pack-records` remains the authority for semantic
 * validation and actionable corrections; unknown, invalid, or conflicting
 * values stay visible with their recorded reason and next action and are
 * never normalized, clamped, or totaled here.
 */
import type {
  TechPackBomRow,
  TechPackColorway,
  TechPackColorwayAssignment,
  TechPackField,
  TechPackFieldValue,
  TechPackMaterial,
  TechPackRecord,
} from "./tech-pack-records";

export interface TechPackEditorModel {
  readonly record: TechPackRecord;
  readonly recipeLabel: string;
  readonly disabled?: boolean;
}

const TECH_PACK_PROVENANCE_OPTIONS: readonly string[] = [
  "USER_CAPTURED",
  "USER_SELECTED",
  "PRESET",
  "INHERITED",
  "CALCULATED",
  "SUPPLIER",
  "SAMPLE_ACTUAL",
  "IMAGE_OBSERVED",
  "UNRESOLVED",
];

const TECH_PACK_EVIDENCE_OPTIONS: readonly string[] = [
  "UNCONFIRMED",
  "USER_CONFIRMED",
  "SOURCE_CONFIRMED",
  "SAMPLE_MEASURED",
  "CONFLICT",
];

const TECH_PACK_VALIDATION_OPTIONS: readonly string[] = ["VALID", "INVALID"];

const TECH_PACK_INHERITED_PROVENANCE_OPTIONS: readonly string[] = [
  "USER_CAPTURED",
  "USER_SELECTED",
  "PRESET",
  "CALCULATED",
  "SUPPLIER",
  "SAMPLE_ACTUAL",
  "IMAGE_OBSERVED",
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function textInputValue(value: string | null): string {
  return value === null ? "" : value;
}

function numberInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function requirednessOptions(value: boolean | null): string {
  return `<option value=""${value === null ? " selected" : ""}>Unknown — not recorded</option>` +
    `<option value="true"${value === true ? " selected" : ""}>Required</option>` +
    `<option value="false"${value === false ? " selected" : ""}>Optional</option>`;
}

function categoryOptions(category: TechPackMaterial["category"]): string {
  return `<option value="fabric"${category === "fabric" ? " selected" : ""}>Fabric</option>` +
    `<option value="trim"${category === "trim" ? " selected" : ""}>Trim</option>`;
}

function linkOptions(ids: readonly string[], selectedId: string, missingLabel: string): string {
  const options = ids
    .map((id) => `<option value="${escapeHtml(id)}"${id === selectedId ? " selected" : ""}>${escapeHtml(id)}</option>`)
    .join("");
  if (ids.includes(selectedId)) return options;
  return `${options}<option value="${escapeHtml(selectedId)}" selected>${escapeHtml(missingLabel)}${escapeHtml(selectedId)}</option>`;
}

function newLinkOptions(ids: readonly string[], label: string): string {
  return `<option value="" selected>Choose ${escapeHtml(label)}</option>` +
    ids.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
}

function inheritedMeta(inherited: NonNullable<TechPackField<TechPackFieldValue>["inheritedFrom"]>): string {
  const source = inherited.sourceRef ?? "";
  const visibleSource = inherited.sourceRef === null ? "" : ` source ${escapeHtml(inherited.sourceRef)}`;
  return `<span data-t01-inherited-revision="${escapeHtml(inherited.revisionId)}" data-t01-inherited-provenance="${escapeHtml(inherited.provenance)}" data-t01-inherited-source="${escapeHtml(source)}">` +
    `Inherited from revision ${escapeHtml(inherited.revisionId)} (${escapeHtml(inherited.provenance)}${visibleSource})</span>`;
}

function fieldMeta(field: TechPackField<TechPackFieldValue>): string {
  const ruleVersion = field.ruleVersion ?? "";
  const unit = field.unit === null
    ? ""
    : ` <span data-t01-unit="${escapeHtml(field.unit)}">Unit ${escapeHtml(field.unit)}</span>`;
  const source = field.sourceRef === null
    ? ""
    : ` <span data-t01-source-ref="${escapeHtml(field.sourceRef)}">Source ${escapeHtml(field.sourceRef)}</span>`;
  const method = field.method === null
    ? ""
    : ` <span data-t01-method="${escapeHtml(field.method)}">Method ${escapeHtml(field.method)}</span>`;
  const capturedBy = field.capturedBy === null
    ? ""
    : ` <span data-t01-captured-by="${escapeHtml(field.capturedBy)}">Captured by ${escapeHtml(field.capturedBy)}</span>`;
  const capturedAt = field.capturedAt === null
    ? ""
    : ` <span data-t01-captured-at="${escapeHtml(field.capturedAt)}">Captured at ${escapeHtml(field.capturedAt)}</span>`;
  const inputs = field.inputRefs.length === 0
    ? ""
    : ` <span data-t01-input-refs="${escapeHtml(field.inputRefs.join(","))}">Inputs ${escapeHtml(field.inputRefs.join(", "))}</span>`;
  const rule = field.ruleId === null
    ? ""
    : ` <span data-t01-rule-id="${escapeHtml(field.ruleId)}" data-t01-rule-version="${escapeHtml(ruleVersion)}">Rule ${escapeHtml(field.ruleId)} version ${escapeHtml(ruleVersion)}</span>`;
  const evidence = field.evidenceRefs.length === 0
    ? ""
    : ` <span data-t01-evidence-refs="${escapeHtml(field.evidenceRefs.join(","))}">Evidence ${escapeHtml(field.evidenceRefs.join(", "))}</span>`;
  const inherited = field.inheritedFrom === null ? "" : ` ${inheritedMeta(field.inheritedFrom)}`;
  return `<p class="t01-meta"><span>Source and evidence:</span>` +
    ` <span data-t01-semantic-kind="${escapeHtml(field.semanticKind)}">${escapeHtml(field.semanticKind)}</span>` +
    ` <span data-t01-provenance-text="${escapeHtml(field.provenance)}">${escapeHtml(field.provenance)}</span>` +
    ` <span data-t01-evidence-text="${escapeHtml(field.evidenceStatus)}">${escapeHtml(field.evidenceStatus)}</span>` +
    ` <span data-t01-validation-text="${escapeHtml(field.validationStatus)}">${escapeHtml(field.validationStatus)}</span>` +
    ` <span data-t01-confidence="NOT_ASSESSED">Confidence not assessed</span>` +
    `${unit}${source}${method}${capturedBy}${capturedAt}${inputs}${rule}${evidence}${inherited}</p>`;
}

function unknownBlock(field: TechPackField<TechPackFieldValue>): string {
  if (
    field.value !== null &&
    field.validationStatus !== "INVALID" &&
    field.provenance !== "UNRESOLVED" &&
    field.evidenceStatus !== "CONFLICT"
  ) {
    return "";
  }
  const reason = field.unresolvedReason ?? "No reason recorded.";
  const action = field.nextAction ?? "No next action recorded.";
  const reasonAttr = field.unresolvedReason ?? "";
  const actionAttr = field.nextAction ?? "";
  return `<p class="t01-unknown" role="note" data-t01-unknown="true" data-t01-unresolved-reason="${escapeHtml(reasonAttr)}" data-t01-next-action="${escapeHtml(actionAttr)}">` +
    `Unknown value. Reason: ${escapeHtml(reason)} Next action: ${escapeHtml(action)}</p>`;
}

function textPropertyRow(
  label: string,
  field: TechPackField<TechPackFieldValue>,
  property: string,
  value: string | null,
  disabledSuffix: string,
): string {
  return `<div class="t01-field-meta-row">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<input type="text" data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="${property}" maxlength="240" value="${escapeHtml(value === null ? "" : value)}"${disabledSuffix}></label></div>`;
}

function refsPropertyRow(
  label: string,
  field: TechPackField<TechPackFieldValue>,
  property: string,
  refs: readonly string[],
  disabledSuffix: string,
): string {
  return `<div class="t01-field-meta-row">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<textarea data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="${property}" rows="2"${disabledSuffix}>` +
    `${escapeHtml(refs.join("\n"))}</textarea></label></div>`;
}

function enumPropertyRow(
  label: string,
  field: TechPackField<TechPackFieldValue>,
  property: string,
  current: string,
  options: readonly string[],
  disabledSuffix: string,
): string {
  const items = options
    .map((option) => `<option value="${option}"${option === current ? " selected" : ""}>${option}</option>`)
    .join("");
  return `<div class="t01-field-meta-row">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<select data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="${property}"${disabledSuffix}>` +
    `${items}</select></label></div>`;
}

function inheritedProvenanceRow(
  field: TechPackField<TechPackFieldValue>,
  current: string,
  disabledSuffix: string,
): string {
  const empty = `<option value=""${current === "" ? " selected" : ""}>Not inherited</option>`;
  const items = TECH_PACK_INHERITED_PROVENANCE_OPTIONS
    .map((option) => `<option value="${option}"${option === current ? " selected" : ""}>${option}</option>`)
    .join("");
  return `<div class="t01-field-meta-row">` +
    `<label><span class="t01-label">Inherited provenance</span>` +
    `<select data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="inheritedProvenance"${disabledSuffix}>` +
    `${empty}${items}</select></label></div>`;
}

function inheritedControls(field: TechPackField<TechPackFieldValue>, disabledSuffix: string): string {
  const inherited = field.inheritedFrom;
  const revision = inherited === null ? "" : inherited.revisionId;
  const provenance = inherited === null ? "" : inherited.provenance;
  const source: string | null = inherited === null ? null : inherited.sourceRef;
  return textPropertyRow("Inherited revision ID", field, "inheritedRevisionId", revision, disabledSuffix) +
    inheritedProvenanceRow(field, provenance, disabledSuffix) +
    textPropertyRow("Inherited source reference", field, "inheritedSourceRef", source, disabledSuffix);
}

function fieldControls(field: TechPackField<TechPackFieldValue>, disabledSuffix: string): string {
  return `<details class="t01-controls" data-t01-controls="${escapeHtml(field.fieldId)}">` +
    `<summary>Source, evidence and validation details</summary><div class="t01-controls-fields">` +
    textPropertyRow("Unit", field, "unit", field.unit, disabledSuffix) +
    enumPropertyRow("Provenance", field, "provenance", field.provenance, TECH_PACK_PROVENANCE_OPTIONS, disabledSuffix) +
    enumPropertyRow("Evidence status", field, "evidenceStatus", field.evidenceStatus, TECH_PACK_EVIDENCE_OPTIONS, disabledSuffix) +
    enumPropertyRow("Validation status", field, "validationStatus", field.validationStatus, TECH_PACK_VALIDATION_OPTIONS, disabledSuffix) +
    textPropertyRow("Source reference", field, "sourceRef", field.sourceRef, disabledSuffix) +
    textPropertyRow("Method", field, "method", field.method, disabledSuffix) +
    textPropertyRow("Captured by", field, "capturedBy", field.capturedBy, disabledSuffix) +
    textPropertyRow("Captured at", field, "capturedAt", field.capturedAt, disabledSuffix) +
    refsPropertyRow("Input references (one per line)", field, "inputRefs", field.inputRefs, disabledSuffix) +
    textPropertyRow("Rule ID", field, "ruleId", field.ruleId, disabledSuffix) +
    textPropertyRow("Rule version", field, "ruleVersion", field.ruleVersion, disabledSuffix) +
    inheritedControls(field, disabledSuffix) +
    textPropertyRow("Unresolved reason", field, "unresolvedReason", field.unresolvedReason, disabledSuffix) +
    textPropertyRow("Next action", field, "nextAction", field.nextAction, disabledSuffix) +
    refsPropertyRow("Evidence references (one per line)", field, "evidenceRefs", field.evidenceRefs, disabledSuffix) +
    `</div></details>`;
}

function actionButton(action: string, label: string, attrs: string, disabledSuffix: string): string {
  return `<button type="button" data-t01-action="${action}"${attrs}${disabledSuffix}>${escapeHtml(label)}</button>`;
}

function textFieldRow(
  label: string,
  field: TechPackField<string | null>,
  scope: string,
  disabledSuffix: string,
): string {
  return `<div class="t01-field" data-t01-field="${escapeHtml(field.fieldId)}" data-t01-scope="${escapeHtml(scope)}" data-t01-provenance="${escapeHtml(field.provenance)}" data-t01-evidence-status="${escapeHtml(field.evidenceStatus)}" data-t01-validation-status="${escapeHtml(field.validationStatus)}">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<input type="text" data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="value" maxlength="240" value="${escapeHtml(textInputValue(field.value))}"${disabledSuffix}></label>` +
    `${fieldMeta(field)}${fieldControls(field, disabledSuffix)}${unknownBlock(field)}</div>`;
}

function numberFieldRow(
  label: string,
  field: TechPackField<number | null>,
  scope: string,
  disabledSuffix: string,
): string {
  return `<div class="t01-field" data-t01-field="${escapeHtml(field.fieldId)}" data-t01-scope="${escapeHtml(scope)}" data-t01-provenance="${escapeHtml(field.provenance)}" data-t01-evidence-status="${escapeHtml(field.evidenceStatus)}" data-t01-validation-status="${escapeHtml(field.validationStatus)}">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<input type="number" step="any" data-t01-input="true" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="value" value="${escapeHtml(numberInputValue(field.value))}"${disabledSuffix}></label>` +
    `${fieldMeta(field)}${fieldControls(field, disabledSuffix)}${unknownBlock(field)}</div>`;
}

function requirednessRow(
  label: string,
  field: TechPackField<boolean | null>,
  scope: string,
  rowId: string,
  disabledSuffix: string,
): string {
  return `<div class="t01-field" data-t01-field="${escapeHtml(field.fieldId)}" data-t01-scope="${escapeHtml(scope)}" data-t01-provenance="${escapeHtml(field.provenance)}" data-t01-evidence-status="${escapeHtml(field.evidenceStatus)}" data-t01-validation-status="${escapeHtml(field.validationStatus)}">` +
    `<label><span class="t01-label">${escapeHtml(label)}</span>` +
    `<select data-t01-input="true" data-t01-bom-field="requiredness" data-t01-bom-row-id="${escapeHtml(rowId)}" data-t01-field-id="${escapeHtml(field.fieldId)}" data-t01-field-property="value"${disabledSuffix}>` +
    `${requirednessOptions(field.value)}</select></label>` +
    `${fieldMeta(field)}${fieldControls(field, disabledSuffix)}${unknownBlock(field)}</div>`;
}

function coverSection(record: TechPackRecord, disabledSuffix: string): string {
  const rows: Array<readonly [string, TechPackField<string | null>]> = [
    ["Style code", record.cover.styleCode],
    ["Style name", record.cover.styleName],
    ["Owner label", record.cover.ownerLabel],
    ["Intended use", record.cover.intendedUse],
    ["Base size", record.cover.baseSizeId],
    ["Measurement unit", record.cover.measurementUnit],
  ];
  return `<fieldset class="t01-cover" data-t01-cover="true"><legend>Cover — six style fields</legend>` +
    `${rows.map(([label, field]) => textFieldRow(label, field, "cover", disabledSuffix)).join("")}</fieldset>`;
}

function materialBlock(material: TechPackMaterial, index: number, disabledSuffix: string): string {
  const scope = `material:${material.id}`;
  return `<article class="t01-material" data-t01-material="${escapeHtml(material.id)}" data-t01-material-index="${index}" data-t01-material-category="${escapeHtml(material.category)}">` +
    `<h4>Material ${index + 1}</h4>` +
    `<div class="t01-actions" aria-label="Material actions">` +
    `${actionButton("remove-material", "Remove material", ` data-t01-material-id="${escapeHtml(material.id)}"`, disabledSuffix)}</div>` +
    `<div class="t01-field" data-t01-material-category-row="true" data-t01-material-id="${escapeHtml(material.id)}">` +
    `<label><span class="t01-label">Category</span>` +
    `<select data-t01-input="true" data-t01-material-field="category" data-t01-material-id="${escapeHtml(material.id)}"${disabledSuffix}>` +
    `${categoryOptions(material.category)}</select></label></div>` +
    `${textFieldRow("Name", material.name, scope, disabledSuffix)}` +
    `${textFieldRow("Supplier", material.supplier, scope, disabledSuffix)}` +
    `${textFieldRow("Article ID", material.articleId, scope, disabledSuffix)}` +
    `${textFieldRow("Lot ID", material.lotId, scope, disabledSuffix)}` +
    `${textFieldRow("Composition", material.composition, scope, disabledSuffix)}` +
    `${textFieldRow("Construction", material.construction, scope, disabledSuffix)}` +
    `${numberFieldRow("Weight", material.weight, scope, disabledSuffix)}` +
    `${numberFieldRow("Usable width", material.usableWidth, scope, disabledSuffix)}` +
    `${textFieldRow("Finish", material.finish, scope, disabledSuffix)}` +
    `${textFieldRow("Color", material.color, scope, disabledSuffix)}` +
    `${textFieldRow("Directional behavior", material.directionalBehavior, scope, disabledSuffix)}` +
    `${numberFieldRow("Unit cost (entered exactly; never totaled here)", material.unitCost, scope, disabledSuffix)}` +
    `${textFieldRow("Currency", material.currency, scope, disabledSuffix)}` +
    `${textFieldRow("Cost basis", material.costBasis, scope, disabledSuffix)}</article>`;
}

function materialsSection(record: TechPackRecord, disabledSuffix: string): string {
  return `<section class="t01-materials" data-t01-materials="true" aria-label="Materials">` +
    `<h3>Materials</h3><div class="t01-actions" aria-label="Add material">` +
    `${actionButton("add-fabric", "Add fabric", "", disabledSuffix)}` +
    `${actionButton("add-trim", "Add trim", "", disabledSuffix)}</div>` +
    `${record.materials.length === 0 ? `<p data-t01-empty="materials">No materials recorded yet. Add a fabric or trim record when you have an explicit value or need to record an unknown.</p>` : ""}` +
    `${record.materials.map((material, index) => materialBlock(material, index, disabledSuffix)).join("")}</section>`;
}

function bomRowBlock(
  row: TechPackBomRow,
  materialIds: readonly string[],
  index: number,
  disabledSuffix: string,
): string {
  const scope = `bomRow:${row.id}`;
  return `<article class="t01-bom-row" data-t01-bom-row="${escapeHtml(row.id)}" data-t01-bom-index="${index}" data-t01-bom-material="${escapeHtml(row.materialId)}">` +
    `<h4>BOM row ${index + 1}</h4>` +
    `<div class="t01-actions" aria-label="BOM row actions">` +
    `${actionButton("remove-bom-row", "Remove BOM row", ` data-t01-bom-row-id="${escapeHtml(row.id)}"`, disabledSuffix)}</div>` +
    `${textFieldRow("Component reference", row.componentRef, scope, disabledSuffix)}` +
    `${textFieldRow("Placement", row.placement, scope, disabledSuffix)}` +
    `<div class="t01-field" data-t01-bom-material-row="true" data-t01-bom-row-id="${escapeHtml(row.id)}">` +
    `<label><span class="t01-label">Material</span>` +
    `<select data-t01-input="true" data-t01-bom-field="materialId" data-t01-bom-row-id="${escapeHtml(row.id)}"${disabledSuffix}>` +
    `${linkOptions(materialIds, row.materialId, "Missing material: ")}</select></label></div>` +
    `${numberFieldRow("Quantity (entered exactly; never totaled here)", row.quantity, scope, disabledSuffix)}` +
    `${textFieldRow("Quantity basis", row.quantityBasis, scope, disabledSuffix)}` +
    `${requirednessRow("Requiredness", row.requiredness, scope, row.id, disabledSuffix)}</article>`;
}

function bomSection(record: TechPackRecord, materialIds: readonly string[], disabledSuffix: string): string {
  const canAddRow = materialIds.length > 0;
  const addRowDisabled = disabledSuffix || (canAddRow ? "" : " disabled");
  return `<section class="t01-bom" data-t01-bom="true" aria-label="Bill of materials">` +
    `<h3>Bill of materials</h3><div class="t01-actions" aria-label="Add BOM row">` +
    `${actionButton("add-bom-row", "Add BOM row", "", addRowDisabled)}</div>` +
    `<div class="t01-field"><label><span class="t01-label">Material for new BOM row</span>` +
    `<select data-t01-new-bom-material${addRowDisabled}>${newLinkOptions(materialIds, "a material")}</select></label></div>` +
    `${record.bomRows.length === 0 ? `<p data-t01-empty="bomRows">No BOM rows recorded yet. Choose a material, then add a row; the row starts with explicitly unknown values.</p>` : ""}` +
    `${record.bomRows.map((row, index) => bomRowBlock(row, materialIds, index, disabledSuffix)).join("")}</section>`;
}

function assignmentBlock(
  assignment: TechPackColorwayAssignment,
  colorwayId: string,
  rowIds: readonly string[],
  materialIds: readonly string[],
  disabledSuffix: string,
): string {
  return `<article class="t01-assignment" data-t01-assignment="${escapeHtml(assignment.id)}" data-t01-assignment-bom-row="${escapeHtml(assignment.bomRowId)}" data-t01-assignment-material="${escapeHtml(assignment.materialId)}">` +
    `<h5>Assignment ${escapeHtml(assignment.id)}</h5>` +
    `<div class="t01-actions" aria-label="Assignment actions">` +
    `${actionButton("remove-assignment", "Remove assignment", ` data-t01-assignment-id="${escapeHtml(assignment.id)}" data-t01-colorway-id="${escapeHtml(colorwayId)}"`, disabledSuffix)}</div>` +
    `<div class="t01-field" data-t01-assignment-row="true" data-t01-assignment-id="${escapeHtml(assignment.id)}">` +
    `<label><span class="t01-label">BOM row</span>` +
    `<select data-t01-input="true" data-t01-assignment-field="bomRowId" data-t01-assignment-id="${escapeHtml(assignment.id)}"${disabledSuffix}>` +
    `${linkOptions(rowIds, assignment.bomRowId, "Missing BOM row: ")}</select></label></div>` +
    `<div class="t01-field" data-t01-assignment-material-row="true" data-t01-assignment-id="${escapeHtml(assignment.id)}">` +
    `<label><span class="t01-label">Material</span>` +
    `<select data-t01-input="true" data-t01-assignment-field="materialId" data-t01-assignment-id="${escapeHtml(assignment.id)}"${disabledSuffix}>` +
    `${linkOptions(materialIds, assignment.materialId, "Missing material: ")}</select></label></div>` +
    `${textFieldRow("Color", assignment.color, `assignment:${assignment.id}`, disabledSuffix)}</article>`;
}

function colorwayBlock(
  colorway: TechPackColorway,
  rowIds: readonly string[],
  materialIds: readonly string[],
  disabledSuffix: string,
): string {
  const canAddAssignment = rowIds.length > 0 && materialIds.length > 0;
  const addAssignmentDisabled = disabledSuffix || (canAddAssignment ? "" : " disabled");
  const heading = `<h4>Colorway ${escapeHtml(colorway.id)}</h4>` +
    `<div class="t01-actions" aria-label="Colorway actions">` +
    `${actionButton("remove-colorway", "Remove colorway", ` data-t01-colorway-id="${escapeHtml(colorway.id)}"`, disabledSuffix)}` +
    `${actionButton("add-assignment", "Add assignment", ` data-t01-colorway-id="${escapeHtml(colorway.id)}"`, addAssignmentDisabled)}</div>` +
    `<div class="t01-field"><label><span class="t01-label">BOM row for new assignment</span>` +
    `<select data-t01-new-assignment-row${addAssignmentDisabled}>${newLinkOptions(rowIds, "a BOM row")}</select></label></div>` +
    `<div class="t01-field"><label><span class="t01-label">Material for new assignment</span>` +
    `<select data-t01-new-assignment-material${addAssignmentDisabled}>${newLinkOptions(materialIds, "a material")}</select></label></div>` +
    `${textFieldRow("Colorway name", colorway.name, `colorway:${colorway.id}`, disabledSuffix)}`;
  if (colorway.assignments.length === 0) {
    return `<article class="t01-colorway" data-t01-colorway="${escapeHtml(colorway.id)}">${heading}` +
      `<p data-t01-empty="assignments">No assignments recorded for this colorway yet. Choose an existing BOM row and material to add one.</p></article>`;
  }
  return `<article class="t01-colorway" data-t01-colorway="${escapeHtml(colorway.id)}">${heading}` +
    `${colorway.assignments.map((assignment) => assignmentBlock(assignment, colorway.id, rowIds, materialIds, disabledSuffix)).join("")}</article>`;
}

function colorwaysSection(
  record: TechPackRecord,
  rowIds: readonly string[],
  materialIds: readonly string[],
  disabledSuffix: string,
): string {
  return `<section class="t01-colorways" data-t01-colorways="true" aria-label="Colorways">` +
    `<h3>Colorways</h3><div class="t01-actions" aria-label="Add colorway">` +
    `${actionButton("add-colorway", "Add colorway", "", disabledSuffix)}</div>` +
    `${record.colorways.length === 0 ? `<p data-t01-empty="colorways">No colorways recorded yet. Add one when you have an explicit colorway to record.</p>` : ""}` +
    `${record.colorways.map((colorway) => colorwayBlock(colorway, rowIds, materialIds, disabledSuffix)).join("")}</section>`;
}

function approvalScopeList(scopeFieldIds: readonly string[]): string {
  if (scopeFieldIds.length === 0) {
    return `<p data-t01-approval-scope="empty">No approval scope recorded.</p>`;
  }
  return `<ul data-t01-approval-scope="listed">` +
    `${scopeFieldIds.map((fieldId) => `<li data-t01-approval-scope-field="${escapeHtml(fieldId)}">${escapeHtml(fieldId)}</li>`).join("")}</ul>`;
}

function metadataSection(record: TechPackRecord): string {
  const revision = record.revisionId === null
    ? `<p data-t01-revision="none">No immutable revision yet. These are editable draft values.</p>`
    : `<p>Revision <span data-t01-revision="${escapeHtml(record.revisionId)}">number ${record.revisionNumber}, id ${escapeHtml(record.revisionId)}</span></p>`;
  const changedBy = record.approval.changedBy === null
    ? ""
    : ` <span data-t01-approval-changed-by="${escapeHtml(record.approval.changedBy)}">Changed by ${escapeHtml(record.approval.changedBy)}</span>`;
  const changedAt = record.approval.changedAt === null
    ? ""
    : ` <span data-t01-approval-changed-at="${escapeHtml(record.approval.changedAt)}">Changed at ${escapeHtml(record.approval.changedAt)}</span>`;
  const manifest = record.approval.manifestId === null
    ? ""
    : ` <span data-t01-approval-manifest="${escapeHtml(record.approval.manifestId)}">Manifest ${escapeHtml(record.approval.manifestId)}</span>`;
  return `<section class="t01-metadata" data-t01-metadata="true" aria-label="Style and revision metadata">` +
    `<h3>Style and revision</h3>` +
    `<p><span data-t01-style-id="${escapeHtml(record.styleId)}">Style ${escapeHtml(record.styleId)}</span>` +
    ` <span data-t01-recipe="${escapeHtml(record.recipeId)}">Recipe ${escapeHtml(record.recipeId)} version ${escapeHtml(record.recipeVersion)}</span></p>` +
    `${revision}` +
    `<p>Created ${escapeHtml(record.createdAt)}; updated ${escapeHtml(record.updatedAt)}.</p>` +
    `<div data-t01-approval="true" data-t01-approval-state="${escapeHtml(record.approval.state)}"><h4>Scoped approval</h4>` +
    `<p>State ${escapeHtml(record.approval.state)}.${changedBy}${changedAt}${manifest}</p>` +
    `${approvalScopeList(record.approval.scopeFieldIds)}</div></section>`;
}

export function renderTechPackEditor(model: TechPackEditorModel): string {
  const disabledSuffix = model.disabled === true ? " disabled" : "";
  const record = model.record;
  const materialIds = record.materials.map((material) => material.id);
  const rowIds = record.bomRows.map((row) => row.id);
  return `<section class="t01-editor" data-t01-editor="true" data-t01-style-id="${escapeHtml(record.styleId)}" data-t01-recipe-id="${escapeHtml(record.recipeId)}" data-t01-recipe-version="${escapeHtml(record.recipeVersion)}" data-t01-revision-number="${record.revisionNumber}" data-t01-approval-state="${escapeHtml(record.approval.state)}" aria-labelledby="t01-editor-title">` +
    `<h2 id="t01-editor-title">Tech pack editor — ${escapeHtml(model.recipeLabel)}</h2>` +
    `<p class="t01-boundary">Editable draft values only. Saving, revisions, approvals, and reviews stay outside this renderer. ` +
    `Entered costs and quantities are recorded exactly as entered; nothing is summed or derived here.</p>` +
    `${metadataSection(record)}${coverSection(record, disabledSuffix)}` +
    `${materialsSection(record, disabledSuffix)}${bomSection(record, materialIds, disabledSuffix)}` +
    `${colorwaysSection(record, rowIds, materialIds, disabledSuffix)}</section>`;
}
