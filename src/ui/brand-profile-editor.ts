import type { BrandProfileColor, BrandProfileRecord, BrandProfileRule } from "./brand-profile-records";

export interface BrandProfileAssignmentChoice {
  readonly id: string;
  readonly label: string;
  readonly fieldId: string;
  readonly color: string | null;
}

export interface BrandProfileEditorModel {
  readonly profile: BrandProfileRecord;
  readonly savedColors: readonly BrandProfileColor[];
  readonly assignments: readonly BrandProfileAssignmentChoice[];
  readonly missingArtworkIds: readonly string[] | null;
  readonly stagedArtworkNames: readonly string[];
  readonly selectedColorId: string;
  readonly selectedAssignmentId: string;
  readonly validationError: string | null;
  readonly applyBlockedReason: string | null;
  readonly artworkAvailable: boolean;
  readonly disabled: boolean;
  readonly dirty: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function colorRow(color: BrandProfileColor, disabled: boolean): string {
  return `<li class="brand-profile-color" data-brand-profile-color-row="${escapeHtml(color.id)}">` +
    `<label>Color name<input type="text" maxlength="80" data-brand-profile-color-id="${escapeHtml(color.id)}" data-brand-profile-color-field="name" value="${escapeHtml(color.name)}"${disabled ? " disabled" : ""}></label>` +
    `<label>Hex color<input type="text" maxlength="7" pattern="#[0-9A-Fa-f]{6}" aria-label="${escapeHtml(color.name)} hex color" data-brand-profile-color-id="${escapeHtml(color.id)}" data-brand-profile-color-field="hex" value="${escapeHtml(color.hex)}"${disabled ? " disabled" : ""}></label>` +
    `<button type="button" data-brand-profile-action="remove-color" data-color-id="${escapeHtml(color.id)}"${disabled ? " disabled" : ""}>Remove color</button>` +
    `</li>`;
}

function ruleRow(rule: BrandProfileRule, disabled: boolean): string {
  return `<li class="brand-profile-rule" data-brand-profile-rule-row="${escapeHtml(rule.id)}">` +
    `<label>Scope<select data-brand-profile-rule-id="${escapeHtml(rule.id)}" data-brand-profile-rule-field="scope"${disabled ? " disabled" : ""}>` +
    (["design", "materials", "supplier"] as const).map((scope) =>
      `<option value="${scope}"${rule.scope === scope ? " selected" : ""}>${scope}</option>`).join("") +
    `</select></label>` +
    `<label>Guidance type<select data-brand-profile-rule-id="${escapeHtml(rule.id)}" data-brand-profile-rule-field="kind"${disabled ? " disabled" : ""}>` +
    (["preference", "block", "supplier-constraint"] as const).map((kind) =>
      `<option value="${kind}"${rule.kind === kind ? " selected" : ""}>${kind}</option>`).join("") +
    `</select></label>` +
    `<label class="brand-profile-rule-description">User-authored guidance<textarea rows="2" maxlength="1000" data-brand-profile-rule-id="${escapeHtml(rule.id)}" data-brand-profile-rule-field="description"${disabled ? " disabled" : ""}>${escapeHtml(rule.description)}</textarea></label>` +
    `<button type="button" data-brand-profile-action="remove-rule" data-rule-id="${escapeHtml(rule.id)}"${disabled ? " disabled" : ""}>Remove guidance</button>` +
    `</li>`;
}

function artworkRows(model: BrandProfileEditorModel): string {
  if (model.profile.artworkAssetIds.length === 0) return "<li>No saved local artwork references.</li>";
  return model.profile.artworkAssetIds.map((assetId) => {
    const state = model.missingArtworkIds === null
      ? "Checking local storage…"
      : model.missingArtworkIds.includes(assetId) ? "Missing from local storage" : "Stored locally";
    const correctiveAction = model.missingArtworkIds?.includes(assetId) === true;
    return `<li data-brand-profile-asset-row="${escapeHtml(assetId)}"><code>${escapeHtml(assetId)}</code>` +
      `<span data-brand-profile-asset-state>${state}</span>` +
      `<button type="button" data-brand-profile-action="remove-artwork" data-asset-id="${escapeHtml(assetId)}"${model.disabled ? " disabled" : ""}>${correctiveAction ? "Remove missing reference" : "Remove reference"}</button></li>`;
  }).join("");
}

function colorApplication(model: BrandProfileEditorModel): string {
  const selectedColor = model.savedColors.find((color) => color.id === model.selectedColorId);
  const selectedAssignment = model.assignments.find((assignment) => assignment.id === model.selectedAssignmentId);
  const sameColor = selectedColor && selectedAssignment?.color !== null && selectedAssignment?.color !== undefined
    && selectedColor.hex.toLowerCase() === selectedAssignment.color.trim().toLowerCase();
  const message = !selectedColor || !selectedAssignment
    ? "Choose a saved Brand Profile color and an existing Tech Pack colorway assignment to compare."
    : sameColor
      ? `${selectedColor.name} already matches ${selectedAssignment.fieldId}.`
      : `${selectedColor.name} (${selectedColor.hex}) differs from ${selectedAssignment.fieldId} (${selectedAssignment.color ?? "empty"}). Apply will update this pending field only.`;
  const blocked = model.disabled || !selectedColor || !selectedAssignment || sameColor || model.applyBlockedReason !== null;
  return `<div class="brand-profile-apply">` +
    `<label for="brand-profile-apply-color">Saved palette color<select id="brand-profile-apply-color" data-brand-profile-color-selection="true"${model.disabled ? " disabled" : ""}>` +
    `<option value="">Choose a saved color</option>${model.savedColors.map((color) => `<option value="${escapeHtml(color.id)}"${color.id === model.selectedColorId ? " selected" : ""}>${escapeHtml(color.name)} · ${escapeHtml(color.hex)}</option>`).join("")}</select></label>` +
    `<label for="brand-profile-apply-assignment">Tech Pack colorway field<select id="brand-profile-apply-assignment" data-brand-profile-assignment-selection="true"${model.disabled || model.assignments.length === 0 ? " disabled" : ""}>` +
    `<option value="">Choose an existing assignment</option>${model.assignments.map((assignment) => `<option value="${escapeHtml(assignment.id)}"${assignment.id === model.selectedAssignmentId ? " selected" : ""}>${escapeHtml(assignment.label)} · ${escapeHtml(assignment.fieldId)}</option>`).join("")}</select></label>` +
    `<p data-brand-profile-conflict role="status" aria-live="polite">${escapeHtml(model.applyBlockedReason ?? message)}</p>` +
    `<button type="button" data-brand-profile-action="apply-color"${blocked ? " disabled" : ""}>Apply to pending Tech Pack draft</button>` +
    `</div>`;
}

export function renderBrandProfileEditor(model: BrandProfileEditorModel): string {
  const pendingStatus = model.missingArtworkIds === null
    ? "Checking existing artwork references against local storage…"
    : model.missingArtworkIds.length === 0
      ? "All existing artwork references resolve locally."
      : `${model.missingArtworkIds.length} artwork reference(s) are missing. Remove each missing reference or restore its file before saving.`;
  const canSave = !model.disabled && model.dirty && !model.validationError
    && model.missingArtworkIds !== null && model.missingArtworkIds.length === 0;
  const stagedFiles = model.stagedArtworkNames.length === 0
    ? "No new files staged."
    : `Staged for the next explicit save: ${model.stagedArtworkNames.map(escapeHtml).join(", ")}.`;
  return `<section class="brand-profile-editor" aria-labelledby="brand-profile-heading">` +
    `<h3 id="brand-profile-heading">Brand Profile</h3>` +
    `<p>Local palette, artwork references and user-authored guidance for this project.</p>` +
    `<section aria-label="Brand color palette"><h4>Color palette</h4>` +
    `<ul class="brand-profile-list">${model.profile.colors.map((color) => colorRow(color, model.disabled)).join("") || "<li>No palette colors yet.</li>"}</ul>` +
    `<button type="button" data-brand-profile-action="add-color"${model.disabled ? " disabled" : ""}>Add palette color</button></section>` +
    `<section aria-label="Local artwork references"><h4>Local artwork</h4>` +
    `<p data-brand-profile-assets-status role="status" aria-live="polite">${pendingStatus}</p>` +
    `<ul class="brand-profile-list" data-brand-profile-assets>${artworkRows(model)}</ul>` +
    `<label for="brand-profile-artwork-files">Add local artwork files<input id="brand-profile-artwork-files" type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"${model.disabled || !model.artworkAvailable ? " disabled" : ""}></label>` +
    `<p data-brand-profile-staged-files>${stagedFiles}</p>` +
    `${model.stagedArtworkNames.length ? `<button type="button" data-brand-profile-action="discard-files"${model.disabled ? " disabled" : ""}>Clear staged files</button>` : ""}</section>` +
    `<section aria-label="User-authored guidance"><h4>Guidance</h4>` +
    `<p>Guidance stays as text with its scope and type; it is not interpreted or used to claim conflicts.</p>` +
    `<ul class="brand-profile-list">${model.profile.rules.map((rule) => ruleRow(rule, model.disabled)).join("") || "<li>No guidance added.</li>"}</ul>` +
    `<button type="button" data-brand-profile-action="add-rule"${model.disabled ? " disabled" : ""}>Add guidance</button></section>` +
    `${colorApplication(model)}` +
    `<p data-brand-profile-validation role="alert">${escapeHtml(model.validationError ?? "")}</p>` +
    `<div class="project-manager-actions"><button type="button" data-brand-profile-action="save-profile"${canSave ? "" : " disabled"}>Save Brand Profile</button>` +
    `<button type="button" data-brand-profile-action="discard-profile"${!model.disabled && model.dirty ? "" : " disabled"}>Discard unsaved profile edits</button></div>` +
    `<p>Apply records a user-selected design value in the pending Tech Pack draft. Save the Tech Pack revision to commit it. This does not verify physical material or supplier facts.</p>` +
    `</section>`;
}
