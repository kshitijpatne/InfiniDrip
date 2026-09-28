import { gradePlanCompletionIssues, type GradePlanRecord } from "./grade-plan";

export interface GradePlanPanelModel {
  readonly recipeLabel: string;
  readonly plan: GradePlanRecord | null;
  readonly stale: boolean;
  readonly canCreate: boolean;
  readonly createBlocker: string | null;
  readonly message: string | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function statusLabel(plan: GradePlanRecord): string {
  if (plan.status === "approved") return "Approved grade-plan record";
  if (plan.status === "reviewed") return "Reviewed; approval still required";
  return "Draft — not reviewed";
}

function basisMarkup(plan: GradePlanRecord): string {
  const basis = plan.basis;
  const population = basis?.kind === "population-source" ? basis : null;
  const digital = basis?.kind === "user-authored-digital-rule" ? basis : null;
  return `<fieldset class="grade-plan-basis"><legend>What is this plan based on?</legend>` +
    `<label>Basis <select data-grade-plan-basis>` +
    `<option value=""${basis === null ? " selected" : ""}>Choose a basis</option>` +
    `<option value="population-source"${population ? " selected" : ""}>Named population and source</option>` +
    `<option value="user-authored-digital-rule"${digital ? " selected" : ""}>My own digital rule</option></select></label>` +
    `<div class="grade-plan-basis-fields" data-grade-plan-basis-fields="population-source"${population ? "" : " hidden"}>` +
    `<label>Population <input data-grade-plan-population maxlength="240" value="${escapeHtml(population?.population ?? "")}"></label>` +
    `<label>Source name <input data-grade-plan-source-name maxlength="240" value="${escapeHtml(population?.sourceName ?? "")}"></label>` +
    `<label>Source version or date <input data-grade-plan-source-version maxlength="240" value="${escapeHtml(population?.sourceVersion ?? "")}"></label>` +
    `<label>Source scope <input data-grade-plan-source-scope maxlength="240" value="${escapeHtml(population?.sourceScope ?? "")}"></label></div>` +
    `<div class="grade-plan-basis-fields" data-grade-plan-basis-fields="user-authored-digital-rule"${digital ? "" : " hidden"}>` +
    `<label>Product decision <input data-grade-plan-decision maxlength="240" value="${escapeHtml(digital?.decision ?? "")}"></label>` +
    `<label>Digital range <input data-grade-plan-digital-range maxlength="240" value="${escapeHtml(digital?.digitalRange ?? "")}"></label></div>` +
    `</fieldset>`;
}

function targetRows(plan: GradePlanRecord): string {
  const columns = plan.sizes.map((size) => `<th scope="col">${escapeHtml(size.label)}${size.position === 0 ? " · base" : ""}</th>`).join("");
  const rows = plan.targets.map((target) => {
    const cells = plan.sizes.map((size) => {
      const delta = target.deltas.find((entry) => entry.sizeLabel.toLocaleLowerCase("en-US") === size.label.toLocaleLowerCase("en-US"));
      const exception = plan.exceptions.find((entry) => entry.targetId === target.targetId
        && entry.sizeLabel.toLocaleLowerCase("en-US") === size.label.toLocaleLowerCase("en-US"));
      const isBase = size.position === 0;
      return `<td><label class="grade-plan-cell-label">${escapeHtml(size.label)} change from base` +
        `<input type="number" step="any" data-grade-plan-delta data-target-id="${escapeHtml(target.targetId)}"` +
        ` data-size-label="${escapeHtml(size.label)}" value="${delta?.deltaFromBase === null || delta === undefined ? "" : delta.deltaFromBase}"${isBase ? " readonly aria-label=" + `"${escapeHtml(target.label)} base value; change is zero"` : ""}></label>` +
        `<label class="grade-plan-exception"><input type="checkbox" data-grade-plan-exception data-target-id="${escapeHtml(target.targetId)}"` +
        ` data-size-label="${escapeHtml(size.label)}"${exception ? " checked" : ""}${isBase ? " disabled" : ""}>` +
        `Not applicable for this size</label>` +
        `<label>Reason <textarea data-grade-plan-exception-reason data-target-id="${escapeHtml(target.targetId)}"` +
        ` data-size-label="${escapeHtml(size.label)}" maxlength="240"${isBase ? " disabled" : ""}>${escapeHtml(exception?.reason ?? "")}</textarea></label></td>`;
    }).join("");
    return `<tr><th scope="row"><strong>${escapeHtml(target.label)}</strong><span>${escapeHtml(target.kind)} · base ${target.baseValue} ${escapeHtml(target.unit)}</span></th>${cells}</tr>`;
  }).join("");
  return `<div class="grade-plan-table-wrap"><table class="grade-plan-table"><thead><tr><th scope="col">Target and current base</th>${columns}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`;
}

export function gradePlanPanelMarkup(model: GradePlanPanelModel): string {
  const heading = `<section class="grade-plan-panel" aria-labelledby="grade-plan-title">` +
    `<h3 id="grade-plan-title">Grade plan</h3>` +
    `<p>Write the size rules for this style. Nothing is filled in from another size chart.</p>` +
    `<p class="grade-plan-boundary">Approval records your review of these rules. Each declared size must still pass drafting checks and exact, unrounded POM reconciliation before its files can be used.</p>`;
  if (!model.plan) {
    return `${heading}<p>There is no grade plan for this ${escapeHtml(model.recipeLabel)} style yet.</p>` +
      `${model.message ? `<p role="status">${escapeHtml(model.message)}</p>` : ""}` +
      `${model.createBlocker ? `<p role="status">${escapeHtml(model.createBlocker)}</p>` : ""}` +
      `<button type="button" data-grade-plan-action="create"${model.canCreate ? "" : " disabled"}>Create a grade plan</button></section>`;
  }
  const plan = model.plan;
  const issues = model.stale ? ["The base style or measurement capture changed. Refresh this draft from the current base before review."]
    : gradePlanCompletionIssues(plan);
  const issueMarkup = issues.length ? `<ul class="grade-plan-issues" aria-label="Items to resolve">${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>` : "";
  const status = model.stale ? "Stale — approval cannot be used" : statusLabel(plan);
  const metadata = `<label>Declared range and unsupported edges <textarea data-grade-plan-range maxlength="240">${escapeHtml(plan.declaredRange)}</textarea></label>` +
    `<label>Base size <input data-grade-plan-base-size maxlength="48" value="${escapeHtml(plan.baseSizeLabel ?? "")}"></label>` +
    `<label>Size labels, ordered smallest to largest <textarea data-grade-plan-sizes placeholder="Enter one size label per line">${escapeHtml(plan.sizes.map((size) => size.label).join("\n"))}</textarea></label>` +
    `<p>Choose the base label above. Labels before it receive positions below the base; labels after it receive positions above it. Enter each size’s changes yourself.</p>`;
  const actionButtons = `<button type="button" data-grade-plan-action="save-draft">Save draft</button>` +
    `<button type="button" data-grade-plan-action="review"${plan.status === "draft" && !model.stale && issues.length === 0 ? "" : " disabled"}>Review this plan</button>` +
    `<button type="button" data-grade-plan-action="approve"${plan.status === "reviewed" && !model.stale && issues.length === 0 ? "" : " disabled"}>Approve this plan</button>` +
    `<button type="button" data-grade-plan-action="refresh"${model.stale ? "" : " disabled"}>Refresh from current base</button>`;
  return `${heading}<p class="grade-plan-status" role="status">${escapeHtml(status)}</p>` +
    `${model.message ? `<p role="status">${escapeHtml(model.message)}</p>` : ""}` +
    `<div class="grade-plan-editor">${basisMarkup(plan)}${metadata}${targetRows(plan)}${issueMarkup}` +
    `<div class="grade-plan-actions">${actionButtons}</div></div></section>`;
}
