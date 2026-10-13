import {
  PRODUCTION_PACK_PRESETS,
  PRODUCTION_PACK_SECTIONS,
  type ProductionPackOutputs,
  type ProductionPackPresentationModel,
  type ProductionPackPreset,
  type ProductionPackSection,
} from "./tech-pack-output";
import type { TechPackRecord } from "./tech-pack-records";

export interface ProductionPackRevisionBinding {
  readonly styleId: string;
  readonly recipeId: string;
  readonly recipeVersion: string;
  readonly revisionId: string | null;
  readonly revisionNumber: number;
  readonly revisionContentDigest: string | null;
  readonly approvalState: TechPackRecord["approval"]["state"];
  readonly approvalRevisionId: string | null;
  readonly approvalScopeFieldIds: readonly string[];
}

export type ProductionPackPanelState =
  | { readonly kind: "unavailable"; readonly message: string }
  | { readonly kind: "stale"; readonly message: string }
  | { readonly kind: "generating" }
  | { readonly kind: "ready"; readonly outputs: ProductionPackOutputs };

export interface ProductionPackPanelInput {
  readonly preset: ProductionPackPreset;
  readonly selectedSections: readonly ProductionPackSection[];
  readonly controlsDisabled: boolean;
  readonly canGenerate: boolean;
  readonly state: ProductionPackPanelState;
}

const REQUIRED_SECTIONS = new Set<ProductionPackSection>([
  "identity", "sources-open-items", "approval-disclaimer",
]);

const SECTION_LABELS: Readonly<Record<ProductionPackSection, string>> = Object.freeze({
  identity: "Style and revision identity",
  "materials-bom": "Materials and bill of materials",
  "measurements-qa": "Measurements and sample QA",
  construction: "Construction operations",
  artwork: "Artwork references and attachments",
  "sources-open-items": "Sources and open items",
  "approval-disclaimer": "Review scope and disclaimer",
});

const PRESET_LABELS: Readonly<Record<ProductionPackPreset, string>> = Object.freeze({
  "complete-pack": "Complete pack",
  "materials-construction": "Materials + construction",
  "measurements-qa": "Measurements + QA",
});

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]!));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function humanize(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_.-]+/g, " ")
    .trim();
  return words ? words[0]!.toLocaleUpperCase() + words.slice(1) : "Unnamed field";
}

function primitiveText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not supplied";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function valueLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "not supplied";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "structured value";
}

function renderFieldList(entries: readonly (readonly [string, unknown])[], depth: number): string {
  if (entries.length === 0) return `<p class="tech-pack-empty">No fields are recorded.</p>`;
  return `<dl class="tech-pack-fields">${entries.map(([key, value]) =>
    `<div class="tech-pack-field-row"><dt>${escapeHtml(humanize(key))}</dt>` +
    `<dd>${renderData(value, humanize(key), depth + 1)}</dd></div>`,
  ).join("")}</dl>`;
}

function renderArray(value: readonly unknown[], label: string, depth: number): string {
  if (value.length === 0) {
    return `<p class="tech-pack-empty" data-empty-array="true">No ${escapeHtml(label.toLocaleLowerCase())} are recorded.</p>`;
  }
  const rows = value.map((entry, index) => {
    const entryLabel = `${label} ${index + 1}`;
    return `<tr><th scope="row">${escapeHtml(entryLabel)}</th>` +
      `<td>${renderData(entry, entryLabel, depth + 1)}</td></tr>`;
  }).join("");
  return `<div class="tech-pack-table-wrap"><table class="tech-pack-table">` +
    `<caption>${escapeHtml(label)}</caption><thead><tr><th scope="col">Entry</th>` +
    `<th scope="col">Recorded values and source detail</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderData(value: unknown, label: string, depth = 0): string {
  if (value === null || value === undefined || typeof value === "string"
    || typeof value === "number" || typeof value === "boolean") {
    return `<span class="tech-pack-primitive">${escapeHtml(primitiveText(value))}</span>`;
  }
  if (depth > 14) {
    return `<span class="tech-pack-open-state">Nested data is deeper than this view can display.</span>`;
  }
  if (Array.isArray(value)) return renderArray(value, label, depth);
  if (!isRecord(value)) return `<span class="tech-pack-open-state">This value cannot be displayed.</span>`;

  const isField = typeof value.fieldId === "string" && Object.prototype.hasOwnProperty.call(value, "provenance");
  const state = isField && typeof value.validationStatus === "string"
    ? value.validationStatus
    : typeof value.status === "string" ? value.status : null;
  const stateClass = state ? ` data-value-state="${escapeHtml(state.toLocaleLowerCase())}"` : "";
  const className = isField ? "tech-pack-data tech-pack-field-value" : "tech-pack-data";
  const header = `<h4>${escapeHtml(label)}</h4>`;
  const body = renderFieldList(Object.entries(value), depth);
  return `<section class="${className}"${stateClass}>${header}${body}</section>`;
}

interface OpenItem {
  readonly path: string;
  readonly status: string;
  readonly value: unknown;
  readonly reason: string;
  readonly nextAction: string;
}

function collectOpenItems(value: unknown, path: string, findings: OpenItem[], ancestors: WeakSet<object>): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectOpenItems(entry, `${path}[${index + 1}]`, findings, ancestors));
    return;
  }
  if (!isRecord(value) || ancestors.has(value)) return;
  ancestors.add(value);

  const isField = typeof value.fieldId === "string" && Object.prototype.hasOwnProperty.call(value, "provenance");
  const status = isField
    ? [value.provenance, value.evidenceStatus, value.validationStatus].filter((item) => typeof item === "string").join(" · ")
    : typeof value.status === "string" && ["UNRESOLVED", "CONFLICT"].includes(value.status) ? value.status : "";
  const isOpen = isField
    ? value.provenance === "UNRESOLVED" || value.evidenceStatus === "CONFLICT"
      || value.validationStatus === "INVALID" || value.value === null
    : value.status === "UNRESOLVED" || value.status === "CONFLICT";
  if (isOpen) {
    findings.push({
      path: typeof value.fieldId === "string" ? `${path} · ${value.fieldId}` : path,
      status: status || "Needs review",
      value: value.value,
      reason: typeof value.unresolvedReason === "string" ? value.unresolvedReason : "No resolution reason is recorded.",
      nextAction: typeof value.nextAction === "string" ? value.nextAction : "Review this item and record its source or next step.",
    });
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "approval") continue;
    collectOpenItems(child, `${path}.${key}`, findings, ancestors);
  }
  ancestors.delete(value);
}

function renderOpenItems(model: ProductionPackPresentationModel): string {
  const findings: OpenItem[] = [];
  collectOpenItems(model.record, "record", findings, new WeakSet<object>());
  if (findings.length === 0) {
    return `<p class="tech-pack-empty" role="status">No unresolved or conflicting field state is recorded in this revision.</p>`;
  }
  const rows = findings.map((finding) =>
    `<tr><th scope="row">${escapeHtml(finding.path)}</th>` +
    `<td><strong>${escapeHtml(finding.status)}</strong><br>Value: ${escapeHtml(valueLabel(finding.value))}</td>` +
    `<td>${escapeHtml(finding.reason)}</td><td>${escapeHtml(finding.nextAction)}</td></tr>`,
  ).join("");
  return `<div class="tech-pack-table-scroll-controls" role="group" aria-label="Unresolved item table columns">` +
    `<button type="button" data-pack-table-scroll="start" aria-controls="tech-pack-open-items-scroll">Show field and state</button>` +
    `<button type="button" data-pack-table-scroll="end" aria-controls="tech-pack-open-items-scroll">Show reason and next action</button></div>` +
    `<p id="tech-pack-open-table-hint" class="tech-pack-table-scroll-hint">Use these controls or scroll horizontally to review all four columns.</p>` +
    `<div class="tech-pack-table-wrap tech-pack-open-table-wrap" role="region" tabindex="0" ` +
    `id="tech-pack-open-items-scroll" aria-label="Unresolved and conflicting items table" aria-describedby="tech-pack-open-table-hint">` +
    `<table class="tech-pack-table tech-pack-open-table">` +
    `<caption>Unresolved and conflicting items</caption><thead><tr>` +
    `<th scope="col">Field</th><th scope="col">Recorded state</th>` +
    `<th scope="col">Reason</th><th scope="col">Next action</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderIdentity(model: ProductionPackPresentationModel, preset: ProductionPackPreset): string {
  const name = model.record.cover.styleName.value;
  const code = model.record.cover.styleCode.value;
  const selected = model.selectedSections.map((section) => SECTION_LABELS[section]);
  const omitted = model.omittedSections.map((section) => SECTION_LABELS[section]);
  const rows: readonly (readonly [string, unknown])[] = [
    ["Style", name], ["Style code", code], ["Style ID", model.styleId],
    ["Recipe", model.recipeId], ["Recipe version", model.recipeVersion],
    ["Saved revision", `r${model.revisionNumber} · ${model.revisionId}`],
    ["Revision content SHA-256", model.revisionContentDigest],
    ["Selected preset", PRESET_LABELS[preset]],
    ["Sections included", selected.join(", ") || "None"],
    ["Sections omitted", omitted.join(", ") || "None"],
  ];
  return `<div class="tech-pack-identity">${renderFieldList(rows, 0)}</div>`;
}

function renderApproval(model: ProductionPackPresentationModel): string {
  if (model.approvalRevisionId !== model.revisionId) {
    return `<p class="tech-pack-open-state" role="status">No review state is linked to this saved revision. ` +
      `Any review state from another revision is not shown.</p>`;
  }
  const scope = model.approvalScopeFieldIds.length
    ? model.approvalScopeFieldIds.join(", ")
    : "No field IDs are included in this review scope.";
  return renderFieldList([
    ["Review state for this revision", model.approvalState],
    ["Approval revision", model.approvalRevisionId],
    ["Scoped field IDs", scope],
  ], 0);
}

function renderArtwork(outputs: ProductionPackOutputs): string {
  const artwork = outputs.manifest.artifacts.filter((artifact) => artifact.role === "artwork");
  if (artwork.length === 0) {
    return `<p class="tech-pack-empty">No local artwork attachment is included in this output.</p>`;
  }
  const rows = artwork.map((artifact) =>
    `<tr><th scope="row">${escapeHtml(artifact.displayName)}</th>` +
    `<td>${escapeHtml(artifact.path)}</td><td>${escapeHtml(artifact.mediaType)}</td>` +
    `<td>${artifact.byteLength.toLocaleString()} bytes</td><td><code>${escapeHtml(artifact.sha256)}</code></td>` +
    `<td>${escapeHtml(artifact.sourceLabel ?? "Source label not recorded")}</td>` +
    `<td>${escapeHtml(artifact.attribution ?? "Attribution not recorded")}</td></tr>`,
  ).join("");
  return `<div class="tech-pack-table-wrap"><table class="tech-pack-table">` +
    `<caption>Revision-bound local artwork attachments</caption><thead><tr>` +
    `<th scope="col">File</th><th scope="col">Package path</th><th scope="col">Type</th>` +
    `<th scope="col">Size</th><th scope="col">SHA-256</th><th scope="col">Source</th>` +
    `<th scope="col">Attribution</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function sectionMarkup(section: ProductionPackSection, outputs: ProductionPackOutputs): string {
  const model = outputs.presentation;
  const record = model.record;
  let content: string;
  if (section === "identity") content = renderIdentity(model, outputs.manifest.preset);
  else if (section === "materials-bom") {
    content = [
      renderData(record.materials, "Materials"),
      renderData(record.bomRows, "Bill of materials"),
      renderData(record.colorways, "Colorways"),
    ].join("");
  } else if (section === "measurements-qa") {
    content = record.pomData === undefined
      ? `<p class="tech-pack-empty">No T02 measurement or sample-QA record is present.</p>`
      : renderData(record.pomData, "Measurements and sample QA");
  } else if (section === "construction") {
    content = record.operationData === undefined
      ? `<p class="tech-pack-empty">No T03 construction operation record is present.</p>`
      : renderData(record.operationData, "Construction operations");
  } else if (section === "artwork") content = renderArtwork(outputs);
  else if (section === "sources-open-items") content = renderOpenItems(model);
  else content = renderApproval(model);
  return `<section class="tech-pack-pack-section" data-pack-section="${section}">` +
    `<h3>${escapeHtml(SECTION_LABELS[section])}</h3>${content}</section>`;
}

export function productionPackOutputMatchesCurrentRevision(
  outputs: ProductionPackOutputs,
  current: ProductionPackRevisionBinding | null,
): boolean {
  if (!current || current.revisionId === null || current.revisionContentDigest === null) return false;
  const model = outputs.presentation;
  return model.styleId === current.styleId
    && model.recipeId === current.recipeId
    && model.recipeVersion === current.recipeVersion
    && model.revisionId === current.revisionId
    && model.revisionNumber === current.revisionNumber
    && model.revisionContentDigest === current.revisionContentDigest
    && model.record.styleId === current.styleId
    && model.record.recipeId === current.recipeId
    && model.record.recipeVersion === current.recipeVersion
    && model.record.revisionId === current.revisionId
    && model.record.revisionNumber === current.revisionNumber
    && model.approvalState === current.approvalState
    && model.approvalRevisionId === current.approvalRevisionId
    && model.approvalScopeFieldIds.length === current.approvalScopeFieldIds.length
    && model.approvalScopeFieldIds.every((fieldId, index) => fieldId === current.approvalScopeFieldIds[index])
    && outputs.manifest.styleId === current.styleId
    && outputs.manifest.recipeId === current.recipeId
    && outputs.manifest.recipeVersion === current.recipeVersion
    && outputs.manifest.revisionId === current.revisionId
    && outputs.manifest.revisionNumber === current.revisionNumber
    && outputs.manifest.revisionContentDigest === current.revisionContentDigest;
}

function renderControls(input: ProductionPackPanelInput): string {
  const controlsDisabled = input.controlsDisabled ? " disabled" : "";
  const selected = new Set(input.selectedSections);
  const presetOptions = Object.keys(PRODUCTION_PACK_PRESETS).map((preset) =>
    `<option value="${preset}"${input.preset === preset ? " selected" : ""}>` +
    `${escapeHtml(PRESET_LABELS[preset as ProductionPackPreset])}</option>`,
  ).join("");
  const sectionOptions = PRODUCTION_PACK_SECTIONS.map((section) => {
    const checked = REQUIRED_SECTIONS.has(section) || selected.has(section);
    const required = REQUIRED_SECTIONS.has(section);
    return `<label class="tech-pack-section-choice"><input type="checkbox" ` +
      `data-pack-section-toggle="${section}"${checked ? " checked" : ""}` +
      `${required || input.controlsDisabled ? " disabled" : ""}>` +
      `<span>${escapeHtml(SECTION_LABELS[section])}${required ? " (always included)" : ""}</span></label>`;
  }).join("");
  return `<div class="tech-pack-pack-controls">` +
    `<label class="tech-pack-preset-label" for="production-pack-preset">Section preset</label>` +
    `<select id="production-pack-preset"${controlsDisabled}>${presetOptions}</select>` +
    `<fieldset class="tech-pack-section-choices"${input.controlsDisabled ? " disabled" : ""}>` +
    `<legend>Sections for this snapshot</legend>${sectionOptions}</fieldset>` +
    `<button type="button" data-production-pack-action="generate"${!input.canGenerate || input.state.kind === "generating" ? " disabled" : ""}>` +
    `${input.state.kind === "ready" ? "Regenerate preview" : "Generate preview"}</button></div>`;
}

function renderReady(outputs: ProductionPackOutputs): string {
  const model = outputs.presentation;
  const selected = new Set<ProductionPackSection>(model.selectedSections);
  for (const section of REQUIRED_SECTIONS) selected.add(section);
  const sections = PRODUCTION_PACK_SECTIONS
    .filter((section) => selected.has(section))
    .map((section) => sectionMarkup(section, outputs)).join("");
  return `<div class="tech-pack-ready" data-revision-id="${escapeHtml(model.revisionId)}">` +
    `<p class="tech-pack-snapshot-note" role="status">Generated snapshot for saved revision r${model.revisionNumber}. ` +
    `Save a new revision and regenerate the preview to show later changes.</p>` +
    `<div class="tech-pack-download-actions" role="group" aria-label="Production pack files">` +
    `<button type="button" data-production-pack-download="pdf">Download PDF</button>` +
    `<button type="button" data-production-pack-download="archive">Download editable ZIP</button></div>` +
    `<ul class="tech-pack-output-identities">` +
    `<li>PDF SHA-256: <code>${escapeHtml(outputs.manifest.artifacts.find((item) => item.role === "production-pdf")?.sha256 ?? "Unavailable")}</code></li>` +
    `<li>Editable ZIP size: ${outputs.archiveBytes.byteLength.toLocaleString()} bytes</li>` +
    `</ul>${sections}<p class="tech-pack-disclaimer">${escapeHtml(model.disclaimer)}</p></div>`;
}

export function renderProductionPackPanel(input: ProductionPackPanelInput): string {
  let stateMarkup: string;
  if (input.state.kind === "ready") stateMarkup = renderReady(input.state.outputs);
  else if (input.state.kind === "generating") {
    stateMarkup = `<p role="status" aria-live="polite">Generating the revision-bound PDF and editable ZIP preview…</p>`;
  } else {
    const role = input.state.kind === "stale" ? "alert" : "status";
    stateMarkup = `<p role="${role}" aria-live="polite">${escapeHtml(input.state.message)}</p>`;
  }
  return `<section class="tech-pack-presentation__panel" aria-label="Revision-bound production pack" ` +
    `aria-busy="${input.state.kind === "generating"}">${renderControls(input)}${stateMarkup}</section>`;
}
