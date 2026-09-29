/**
 * Presentational G03 guided-capture field panel. Renders supplied capture
 * state and supplied factual copy as accessible markup; it never mutates,
 * selects, averages, clamps, or invents values or measuring procedures.
 * Interaction is exposed only through `data-action` hooks for the host.
 */
import type { FieldDefinition, FieldSemanticKind } from "./field-provenance";
import type { CaptureFieldState, CaptureMeasurer, MeasurementCaptureReading } from "./measurement-capture";

/** A recorded reading; `MeasurementCaptureReading` values can be passed directly. */
export type CapturePanelReading = Pick<MeasurementCaptureReading,
  "id" | "rawValue" | "enteredUnit" | "canonicalValue" | "provenance" | "evidenceStatus"
  | "sourceLabel" | "captureMethod" | "capturedAt" | "measurer">;

/** An opt-in digital preset offer. Omit (null) when no preset is offered for the field. */
export interface CapturePanelPreset {
  /** Supplied preset name, e.g. the name later passed to `acceptCapturePreset`. */
  readonly label: string;
  /** Supplied display value with unit, e.g. "100 cm"; null when not shown. */
  readonly valueText: string | null;
}

export interface CapturePanelField {
  /** `MeasurementCaptureField.fieldId`; emitted as `data-field-id`. */
  readonly fieldId: string;
  /** Supplied plain-language field name (`FieldDefinition.label`). */
  readonly label: string;
  readonly semanticKind: FieldSemanticKind;
  readonly referenceFrame: FieldDefinition["referenceFrame"];
  /** Canonical unit of the field (`MeasurementCaptureField.unit`); may be empty for unitless options. */
  readonly unit: string;
  /** Units the user may enter. More than one renders a unit selector. Empty means `[unit]`. */
  readonly unitOptions: readonly string[];
  /** Supplied meaning (`FieldDefinition.meaning`); null/blank uses a neutral fallback. */
  readonly meaning: string | null;
  /** Supplied description of how the current draft uses the value; null/blank uses a neutral fallback. */
  readonly currentUse: string | null;
  /** Supplied source/qualification caveat (`FieldDefinition.captureBoundary`); null/blank uses a neutral fallback. */
  readonly sourceCaveat: string | null;
  /** Supplied guardrail note, e.g. software range wording; null hides it. */
  readonly guardrail: string | null;
  /** Host-held text of the not-yet-added reading. Rendered exactly, including invalid text. */
  readonly draftRawValue: string;
  /** Host-held entry unit of the not-yet-added reading. */
  readonly draftUnit: string;
  /** Host-supplied problem with the draft entry itself (e.g. a rejected add); null when none. */
  readonly draftError: string | null;
  /** Optional user supplied source note for the next reading. */
  readonly draftSourceNote: string;
  /** Optional user supplied method note for the next reading. */
  readonly draftCaptureMethod: string;
  /** Optional calendar date in YYYY-MM-DD form. */
  readonly draftCaptureDate: string;
  /** Optional user supplied recorder; empty means not supplied. */
  readonly draftMeasurer: CaptureMeasurer | "";
  readonly readings: readonly CapturePanelReading[];
  /** Null means no reading is selected. The panel never selects one on the host's behalf. */
  readonly selectedReadingId: string | null;
  readonly preset: CapturePanelPreset | null;
  /** `CaptureFieldAssessment.state`. */
  readonly state: CaptureFieldState;
  /** `CaptureFieldAssessment.correction`; null/blank for an unresolved field uses a neutral fallback. */
  readonly correction: string | null;
}

export interface MeasurementCapturePanelModel {
  /** DOM id prefix; must be unique on the page. Unsafe characters are replaced. */
  readonly panelId: string;
  readonly heading: string;
  readonly intro: string | null;
  readonly fields: readonly CapturePanelField[];
  /** Supplied text for an empty field list; null uses a neutral fallback. */
  readonly emptyMessage: string | null;
  /** Result of the latest host action, announced before the summary; null when none. */
  readonly announcement: string | null;
}

export const MEASUREMENT_CAPTURE_PANEL_CLASS = "measurement-capture-panel";

export type MeasurementCapturePanelAction =
  | "capture-edit-raw"
  | "capture-change-unit"
  | "capture-add-reading"
  | "capture-select-reading"
  | "capture-accept-preset"
  | "capture-edit-source"
  | "capture-edit-method"
  | "capture-edit-date"
  | "capture-change-measurer";

const C = MEASUREMENT_CAPTURE_PANEL_CLASS;

const SEMANTIC_KIND_LABELS: Readonly<Record<string, string>> = {
  BODY_MEASURE: "Body input",
  GARMENT_MEASURE: "Finished-garment target",
  FINISHED_POM: "Derived output",
  PATTERN_PARAMETER: "Pattern target",
  STYLE_CONTROL: "Style control",
};

const REFERENCE_FRAME_LABELS: Readonly<Record<string, string>> = {
  body: "the wearer's body",
  "finished-garment": "the finished garment",
  pattern: "the flat pattern",
  "design-control": "a design choice",
};

const STATE_LABELS: Readonly<Record<string, string>> = {
  resolved: "Ready",
  missing: "Missing — no value yet",
  ambiguous: "Ambiguous — choose one reading",
  invalid: "Invalid — needs correction",
};

const PROVENANCE_LABELS: Readonly<Record<string, string>> = {
  USER_CAPTURED: "Entered by you as a body input",
  USER_SELECTED: "Chosen by you as a target",
  PRESET: "Digital preset — not a measurement of the wearer",
};

const EVIDENCE_LABELS: Readonly<Record<string, string>> = {
  UNCONFIRMED: "Unconfirmed",
  USER_CONFIRMED: "Confirmed by you",
  SOURCE_CONFIRMED: "Confirmed against a source",
  CONFLICT: "Conflicting evidence",
};

const MEASURER_LABELS: Readonly<Record<string, string>> = {
  SELF: "self",
  HELPER: "a helper",
  IMPORTED: "imported record",
  OTHER: "other",
};

const FALLBACK = {
  kind: "Field type not specified",
  frame: "not specified",
  state: "Status unavailable — review this field",
  meaning: "No explanation is available for this field yet.",
  currentUse: "How the current draft uses this value has not been described yet.",
  sourceCaveat: "No source or qualification note is available for this field. A value is recorded as entered and is not confirmed.",
  correction: "Review this field before continuing.",
  empty: "No measurement fields are available for this garment.",
  provenance: "Source type not specified",
  evidence: "Evidence status not specified",
  measurer: "not specified",
} as const;

const PRESET_NOTICE = "Digital starting value — not a measurement of the wearer. It stays labeled as a preset after you use it.";
const NEVER_AVERAGED = "Readings are kept separate and are never averaged. The draft uses only the reading you select.";

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function labelFrom(table: Readonly<Record<string, string>>, key: string, fallback: string): string {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : fallback;
}

function supplied(text: string | null, fallback: string): string {
  return text !== null && text.trim() !== "" ? text : fallback;
}

function idToken(value: string, fallback: string): string {
  const token = value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return /^[A-Za-z]/.test(token) ? token : `${fallback}${token ? `-${token}` : ""}`;
}

/** Text for the panel's polite live region; exported so a host can update a persistent region. */
export function measurementCapturePanelStatusText(model: MeasurementCapturePanelModel): string {
  const announcement = model.announcement !== null && model.announcement.trim() !== "" ? `${model.announcement} ` : "";
  const total = model.fields.length;
  if (total === 0) return `${announcement}${supplied(model.emptyMessage, FALLBACK.empty)}`;
  const count = (state: string) => model.fields.filter((field) => field.state === state).length;
  const ready = count("resolved");
  if (ready === total) return `${announcement}All fields are ready (${ready} of ${total}).`;
  const parts = (["missing", "ambiguous", "invalid"] as const)
    .map((state) => ({ state, n: count(state) }))
    .filter(({ n }) => n !== 0)
    .map(({ state, n }) => `${n} ${state}`);
  const detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `${announcement}Ready: ${ready} of ${total} fields. Needing attention: ${total - ready}${detail}.`;
}

function unitText(unit: string): string {
  return unit === "" ? "no unit" : unit;
}

function readingMarkup(field: CapturePanelField, reading: CapturePanelReading, base: string, index: number): string {
  const id = `${base}-r${index + 1}`;
  const selected = field.selectedReadingId !== null && reading.id === field.selectedReadingId;
  const raw = reading.rawValue === "" ? "(blank)" : `“${escapeHtml(reading.rawValue)}”`;
  const converted = reading.canonicalValue === null
    ? " — not a usable number"
    : reading.enteredUnit === field.unit ? "" : ` = ${reading.canonicalValue} ${escapeHtml(unitText(field.unit))}`;
  const details = [
    escapeHtml(labelFrom(PROVENANCE_LABELS, reading.provenance, FALLBACK.provenance)),
    escapeHtml(labelFrom(EVIDENCE_LABELS, reading.evidenceStatus, FALLBACK.evidence)),
    `Source: ${escapeHtml(reading.sourceLabel)}`,
    reading.captureMethod === null ? null : `Method: ${escapeHtml(reading.captureMethod)}`,
    reading.capturedAt === null ? null : `Captured: ${escapeHtml(/^\d{4}-\d{2}-\d{2}T/.test(reading.capturedAt)
      ? `${reading.capturedAt.slice(0, 10)} (UTC)` : reading.capturedAt)}`,
    reading.measurer === null ? null : `Measured by: ${escapeHtml(labelFrom(MEASURER_LABELS, reading.measurer, FALLBACK.measurer))}`,
  ].filter((part): part is string => part !== null);
  return `<li id="${id}" class="${C}__reading" data-reading-id="${escapeHtml(reading.id)}" data-selected="${selected}">` +
    `<p id="${id}-summary" class="${C}__reading-summary">Reading ${index + 1}: ${raw} ${escapeHtml(unitText(reading.enteredUnit))}${converted}` +
    (selected ? ` <strong class="${C}__selected">Selected for the draft</strong>` : "") + `</p>` +
    `<p class="${C}__reading-details">${details.join(" · ")}</p>` +
    `<button id="${id}-select" type="button" data-action="capture-select-reading" data-field-id="${escapeHtml(field.fieldId)}" ` +
    `data-reading-id="${escapeHtml(reading.id)}" aria-pressed="${selected}" aria-describedby="${id}-summary">` +
    `Use reading ${index + 1}</button></li>`;
}

function readingsMarkup(field: CapturePanelField, base: string, label: string): string {
  const title = `<p id="${base}-readings-title" class="${C}__readings-title"><strong>Recorded readings for ${label}</strong></p>`;
  if (field.readings.length === 0) {
    return `<div class="${C}__readings">${title}<p class="${C}__readings-empty">No readings recorded yet.</p></div>`;
  }
  const items = field.readings.map((reading, index) => readingMarkup(field, reading, base, index)).join("");
  const note = field.readings.length > 1 ? `<p class="${C}__never-averaged">${NEVER_AVERAGED}</p>` : "";
  return `<div class="${C}__readings">${title}<ol class="${C}__reading-list" aria-labelledby="${base}-readings-title">${items}</ol>${note}</div>`;
}

function unitMarkup(field: CapturePanelField, base: string, label: string): { markup: string; describedBy: string | null } {
  const options = field.unitOptions.length > 0 ? field.unitOptions : [field.unit];
  if (options.length === 1) {
    return {
      markup: `<span id="${base}-unit" class="${C}__unit">${escapeHtml(unitText(options[0]))}</span>`,
      describedBy: `${base}-unit`,
    };
  }
  const choices = options.map((unit) =>
    `<option value="${escapeHtml(unit)}"${unit === field.draftUnit ? " selected" : ""}>${escapeHtml(unitText(unit))}</option>`).join("");
  return {
    markup: `<label for="${base}-unit" class="${C}__unit-label">Unit for ${label}</label>` +
      `<select id="${base}-unit" class="${C}__unit-select" data-action="capture-change-unit" data-field-id="${escapeHtml(field.fieldId)}">${choices}</select>`,
    describedBy: null,
  };
}

function presetMarkup(field: CapturePanelField, base: string): string {
  if (field.preset === null) return "";
  const value = field.preset.valueText !== null && field.preset.valueText.trim() !== ""
    ? `: ${escapeHtml(field.preset.valueText)}` : "";
  return `<div class="${C}__preset">` +
    `<p id="${base}-preset" class="${C}__preset-details"><strong>Digital preset</strong> — ` +
    `${escapeHtml(field.preset.label)}${value}. ${PRESET_NOTICE}</p>` +
    `<button id="${base}-preset-accept" type="button" data-action="capture-accept-preset" data-field-id="${escapeHtml(field.fieldId)}" ` +
    `aria-describedby="${base}-preset">Use digital preset value</button></div>`;
}

function optionalCaptureDetailsMarkup(field: CapturePanelField, base: string): string {
  const measurers = [
    ["", "Not supplied"], ["SELF", "Me"], ["HELPER", "A helper"], ["OTHER", "Other"],
  ] as const;
  const options = measurers.map(([value, label]) =>
    `<option value="${value}"${value === field.draftMeasurer ? " selected" : ""}>${label}</option>`).join("");
  return `<details class="${C}__optional-details">` +
    `<summary>Optional source details</summary>` +
    `<div class="${C}__optional-grid">` +
    `<label for="${base}-source">Source note (optional)</label>` +
    `<input id="${base}-source" type="text" maxlength="500" autocomplete="off" ` +
    `value="${escapeHtml(field.draftSourceNote)}" data-action="capture-edit-source" data-field-id="${escapeHtml(field.fieldId)}">` +
    `<label for="${base}-method">Method note (optional)</label>` +
    `<input id="${base}-method" type="text" maxlength="256" autocomplete="off" ` +
    `value="${escapeHtml(field.draftCaptureMethod)}" data-action="capture-edit-method" data-field-id="${escapeHtml(field.fieldId)}">` +
    `<label for="${base}-date">Capture date (optional)</label>` +
    `<input id="${base}-date" type="date" value="${escapeHtml(field.draftCaptureDate)}" ` +
    `data-action="capture-edit-date" data-field-id="${escapeHtml(field.fieldId)}">` +
    `<label for="${base}-measurer">Entered by (optional)</label>` +
    `<select id="${base}-measurer" data-action="capture-change-measurer" data-field-id="${escapeHtml(field.fieldId)}">${options}</select>` +
    `<p>These notes record what you supplied; they do not qualify a measuring technique or establish fit.</p>` +
    `</div></details>`;
}

function fieldMarkup(field: CapturePanelField, prefix: string, index: number): string {
  const base = `${prefix}-f${index + 1}-${idToken(field.fieldId, "field")}`;
  const label = escapeHtml(supplied(field.label, `Measurement field ${index + 1}`));
  const fieldId = escapeHtml(field.fieldId);
  const resolved = field.state === "resolved";
  const invalid = field.state === "invalid";
  const draftError = field.draftError !== null && field.draftError.trim() !== "" ? field.draftError : null;
  const unit = unitMarkup(field, base, label);
  const describedBy = [
    unit.describedBy, `${base}-kind`, `${base}-meaning`, `${base}-state`,
    resolved ? null : `${base}-correction`, draftError === null ? null : `${base}-draft-error`,
  ].filter((id): id is string => id !== null).join(" ");
  const guardrail = field.guardrail !== null && field.guardrail.trim() !== ""
    ? `<p id="${base}-guardrail" class="${C}__guardrail"><strong>Range:</strong> ${escapeHtml(field.guardrail)}</p>` : "";
  const correction = resolved ? ""
    : `<p id="${base}-correction" class="${C}__correction"><strong>To resolve:</strong> ${escapeHtml(supplied(field.correction, FALLBACK.correction))}</p>`;
  const errorMarkup = draftError === null ? ""
    : `<p id="${base}-draft-error" class="${C}__draft-error"><strong>Entry problem:</strong> ${escapeHtml(draftError)}</p>`;
  return `<li class="${C}__field" data-field-id="${fieldId}" data-state="${escapeHtml(field.state)}">` +
    `<fieldset class="${C}__fieldset"><legend id="${base}-legend" class="${C}__legend">${label}</legend>` +
    `<p id="${base}-kind" class="${C}__kind"><strong>Type:</strong> ` +
    `${escapeHtml(labelFrom(SEMANTIC_KIND_LABELS, field.semanticKind, FALLBACK.kind))} · ` +
    `<strong>Refers to:</strong> ${escapeHtml(labelFrom(REFERENCE_FRAME_LABELS, field.referenceFrame, FALLBACK.frame))}</p>` +
    `<p id="${base}-state" class="${C}__state" data-state="${escapeHtml(field.state)}"><strong>Status:</strong> ` +
    `${escapeHtml(labelFrom(STATE_LABELS, field.state, FALLBACK.state))}</p>` +
    `<div class="${C}__help">` +
    `<p id="${base}-meaning" class="${C}__meaning"><strong>What it means:</strong> ${escapeHtml(supplied(field.meaning, FALLBACK.meaning))}</p>` +
    `<p id="${base}-use" class="${C}__use"><strong>How the draft uses it:</strong> ${escapeHtml(supplied(field.currentUse, FALLBACK.currentUse))}</p>` +
    `<p id="${base}-caveat" class="${C}__caveat"><strong>Source and limits:</strong> ${escapeHtml(supplied(field.sourceCaveat, FALLBACK.sourceCaveat))}</p>` +
    `${guardrail}</div>` +
    `<div class="${C}__entry">` +
    `<label for="${base}-input" class="${C}__input-label">New reading for ${label}</label>` +
    `<input id="${base}-input" class="${C}__input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" ` +
    `maxlength="4096" value="${escapeHtml(field.draftRawValue)}" data-action="capture-edit-raw" data-field-id="${fieldId}" ` +
    `aria-describedby="${describedBy}"${invalid || draftError !== null ? ` aria-invalid="true"` : ""}>` +
    `${unit.markup}` +
    `<button id="${base}-add" type="button" data-action="capture-add-reading" data-field-id="${fieldId}">Add reading</button>` +
    `${errorMarkup}</div>` +
    optionalCaptureDetailsMarkup(field, base) +
    readingsMarkup(field, base, label) +
    presetMarkup(field, base) +
    correction +
    `</fieldset></li>`;
}

/** Pure renderer for the guided capture field list. Returns markup only; performs no mutation. */
export function renderMeasurementCapturePanel(model: MeasurementCapturePanelModel): string {
  const prefix = idToken(model.panelId, "capture");
  const intro = model.intro !== null && model.intro.trim() !== ""
    ? `<p class="${C}__intro">${escapeHtml(model.intro)}</p>` : "";
  const status = `<p id="${prefix}-status" class="${C}__status" role="status" aria-live="polite">` +
    `${escapeHtml(measurementCapturePanelStatusText(model))}</p>`;
  const body = model.fields.length === 0 ? ""
    : `<ol class="${C}__fields" aria-labelledby="${prefix}-title">` +
      model.fields.map((field, index) => fieldMarkup(field, prefix, index)).join("") + `</ol>`;
  return `<section id="${prefix}" class="${C}" aria-labelledby="${prefix}-title">` +
    `<h2 id="${prefix}-title" class="${C}__title">${escapeHtml(supplied(model.heading, "Measurements"))}</h2>` +
    intro + status + body + `</section>`;
}
