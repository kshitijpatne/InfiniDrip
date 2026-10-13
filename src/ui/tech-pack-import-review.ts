import type {
  ProductionPackFieldDiff,
  ProductionPackImportPreview,
} from "./tech-pack-output";
import type { TechPackRecord, TechPackScopedApproval } from "./tech-pack-records";

export type TechPackImportReviewState =
  | { readonly kind: "idle" }
  | { readonly kind: "reading"; readonly fileName: string }
  | { readonly kind: "applying"; readonly fileName: string }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "invalidated"; readonly message: string }
  | {
    readonly kind: "applied";
    readonly styleId: string;
    readonly previousRevisionNumber: number;
    readonly revisionNumber: number;
  }
  | {
    readonly kind: "preview";
    readonly fileName: string;
    readonly result: ProductionPackImportPreview;
    readonly currentApproval: TechPackScopedApproval;
  };

export function productionPackImportCandidateEligible(
  preview: ProductionPackImportPreview,
): preview is ProductionPackImportPreview & { readonly candidateRecord: TechPackRecord } {
  return preview.status === "changed" && preview.canApply && preview.candidateRecord !== null
    && !preview.findings.some((finding) => finding.status === "INVALID");
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]!));

function exactValue(value: unknown): string {
  if (value === undefined) return "(not present)";
  const serialized = JSON.stringify(value);
  return serialized === undefined ? String(value) : serialized;
}

function fieldDiffRow(diff: ProductionPackFieldDiff): string {
  return `<tr data-change="${escapeHtml(diff.change)}"><th scope="row"><code>${escapeHtml(diff.path)}</code></th>` +
    `<td><code>${escapeHtml(exactValue(diff.before))}</code></td>` +
    `<td><code>${escapeHtml(exactValue(diff.after))}</code></td></tr>`;
}

function diffMarkup(diff: readonly ProductionPackFieldDiff[]): string {
  if (diff.length === 0) return `<p class="tech-pack-import-empty">No authored fields differ from this package's base revision.</p>`;
  return `<p class="tech-pack-import-table-hint">Focus the field-difference region and use the left and right arrow keys to review every column.</p>` +
    `<div class="tech-pack-import-table-wrap" role="region" aria-label="Field differences; horizontally scrollable" tabindex="0"><table class="tech-pack-table tech-pack-import-table">` +
    `<caption>Exact authored field differences (${diff.length})</caption><thead><tr>` +
    `<th scope="col">Field path</th><th scope="col">Saved value</th><th scope="col">Package value</th>` +
    `</tr></thead><tbody>${diff.map(fieldDiffRow).join("")}</tbody></table></div>`;
}

function revisionMarkup(label: string, revision: ProductionPackImportPreview["baseRevision"]): string {
  const digest = revision.revisionContentDigest;
  return `<section class="tech-pack-import-revision"><h4>${escapeHtml(label)}</h4><dl>` +
    `<dt>Style</dt><dd><code>${escapeHtml(revision.styleId)}</code></dd>` +
    `<dt>Revision</dt><dd>r${revision.revisionNumber} · <code>${escapeHtml(revision.revisionId)}</code></dd>` +
    `<dt>Content digest</dt><dd><code>${escapeHtml(digest)}</code></dd></dl></section>`;
}

function savedApprovalMarkup(approval: TechPackScopedApproval): string {
  const scope = approval.scopeFieldIds.length === 0
    ? "No fields are in the saved review scope."
    : approval.scopeFieldIds.map((fieldId) => `<code>${escapeHtml(fieldId)}</code>`).join(", ");
  return `<section class="tech-pack-import-approval"><h4>Saved approval on the current exact revision</h4>` +
    `<p>State: <strong>${escapeHtml(approval.state)}</strong>; approval revision: ` +
    `<code>${escapeHtml(approval.revisionId ?? "none")}</code>.</p><p>Scoped fields: ${scope}</p></section>`;
}

function findingMarkup(preview: ProductionPackImportPreview): string {
  if (preview.findings.length === 0) return `<p class="tech-pack-import-empty">No additional semantic findings.</p>`;
  return `<ul class="tech-pack-import-findings">${preview.findings.map((finding) =>
    `<li data-finding-status="${escapeHtml(finding.status)}"><strong>${escapeHtml(finding.status)}</strong> ` +
    `<code>${escapeHtml(finding.path)}</code>: ${escapeHtml(finding.message)}</li>`,
  ).join("")}</ul>`;
}

function previewMarkup(
  fileName: string,
  preview: ProductionPackImportPreview,
  currentApproval: TechPackScopedApproval,
): string {
  const eligible = productionPackImportCandidateEligible(preview);
  const stateMessage = preview.status === "unchanged"
    ? "This package matches its saved base; no style revision will be created."
    : preview.status === "stale"
      ? "This package is based on an older style revision. Review is read-only; export the current head or re-enter values manually."
      : eligible
        ? "Review each field and finding below. Nothing is saved until you choose Apply reviewed record."
        : "This changed record is read-only because it has no eligible candidate to apply.";
  const approvalNotice = `<p class="tech-pack-import-approval-notice">Package approval metadata is never trusted. Applying authored changes creates a new immutable revision in DRAFT with no approved field scope.</p>`;
  const apply = eligible
    ? `<button type="button" data-production-pack-import-action="apply">Apply reviewed record</button>`
    : "";
  return `<section class="tech-pack-import-result" data-import-status="${preview.status}">` +
    `<h3>Package review: ${escapeHtml(fileName)}</h3><p role="status">${stateMessage}</p>` +
    `<div class="tech-pack-import-revisions">${revisionMarkup("Package base revision", preview.baseRevision)}` +
    `${revisionMarkup("Current style head", preview.currentHead)}</div>` +
    `${savedApprovalMarkup(currentApproval)}${diffMarkup(preview.diff)}` +
    `<section class="tech-pack-import-findings-section"><h4>Validation findings</h4>${findingMarkup(preview)}</section>` +
    `<p class="tech-pack-import-attachments">${preview.attachments.length} read-only artwork attachment descriptor(s); package bytes are not imported.</p>` +
    `${approvalNotice}<div class="tech-pack-download-actions">${apply}</div></section>`;
}

export function renderTechPackImportReview(state: TechPackImportReviewState): string {
  const busy = state.kind === "reading" || state.kind === "applying";
  const input = `<label class="tech-pack-import-picker">` +
    `<span>Review an editable production-pack ZIP</span>` +
    `<input type="file" data-production-pack-import-file accept=".techpack.zip,application/zip" aria-label="Choose a .techpack.zip package"${busy ? " disabled" : ""}/>` +
    `</label><p class="tech-pack-import-help">Selecting a file checks it against this style's local revision history. Review is read-only until you explicitly apply a changed record.</p>`;
  let content: string;
  switch (state.kind) {
    case "idle":
      content = `<p class="tech-pack-import-empty">No package selected.</p>`;
      break;
    case "reading":
      content = `<p role="status">Checking ${escapeHtml(state.fileName)} against local revision history…</p>`;
      break;
    case "applying":
      content = `<p role="status">Saving the reviewed changes from ${escapeHtml(state.fileName)} as a new local style revision…</p>`;
      break;
    case "error":
      content = `<p role="alert">${escapeHtml(state.message)}</p>`;
      break;
    case "invalidated":
      content = `<p role="alert">${escapeHtml(state.message)}</p>`;
      break;
    case "applied":
      content = `<p role="status">Saved ${escapeHtml(state.styleId)} as immutable revision r${state.revisionNumber} (from r${state.previousRevisionNumber}). The new revision is DRAFT with no approved scope.</p>`;
      break;
    case "preview":
      content = previewMarkup(state.fileName, state.result, state.currentApproval);
      break;
  }
  return `<section class="tech-pack-import-review" aria-label="Editable production-pack review">` +
    `<h3>Review and apply an editable package</h3>${input}<div class="tech-pack-import-state" aria-live="polite">${content}</div></section>`;
}
