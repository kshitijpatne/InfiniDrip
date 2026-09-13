// Builds the app's HTML as strings (same approach as the SVG canvas): a controls
// panel, a canvas host, a guidance panel, and a style panel. Pure, so the markup
// can be checked in tests without a browser.

import { Measurements, STRETCH_FABRICS, SpecRow, GARMENTS, SizeStep, roleTag, GarmentOption, GarmentOptions } from "../drafting";
import { BLUEPRINT as T, FABRICS } from "../render";
import { Note, SEVERITY_ICON } from "../guidance";
import { Report } from "../guidance";
import { StyleMatch, Delta } from "../style";
import { FIELDS, Field, numericRangeState } from "./controls";
import type { Handle } from "../edit";

const PANEL = "#13233A";
const BORDER = "#1E3450";
const OK = "#2E9B63";

/** Shared number control: explicit +/- affordances flank the editable value,
 * and the small boundary rail turns the declared min/max into a glanceable
 * number line. Open-ended exploratory coordinates use infinity endpoints. */
function numericControlMarkup(
  controlId: string,
  inputId: string,
  label: string,
  value: number,
  min: number | undefined,
  max: number | undefined,
  step: number,
  inputAttributes: string,
  rangeUnit: string,
): string {
  const unit = rangeUnit ? ` ${rangeUnit}` : "";
  const inputMinAttribute = min === undefined ? "" : ` min="${min}" data-range-min="${min}" aria-valuemin="${min}"`;
  const inputMaxAttribute = max === undefined ? "" : ` max="${max}" data-range-max="${max}" aria-valuemax="${max}"`;
  const controlMinAttribute = min === undefined ? "" : ` data-range-min="${min}"`;
  const controlMaxAttribute = max === undefined ? "" : ` data-range-max="${max}"`;
  const state = numericRangeState(String(value), min, max);
  const allowed = min === undefined || max === undefined
    ? "Open range"
    : `Allowed range ${min}–${max}${unit}`;
  const current = state === "empty" ? "current value unavailable" : `current value ${value}${unit}`;
  const endpoint = (edge: "min" | "max"): string => edge === "min"
    ? (min === undefined ? "−∞" : String(min))
    : (max === undefined ? "+∞" : String(max));
  const button = (direction: -1 | 1, symbol: string, verb: string): string =>
    `<button type="button" data-step-target="${controlId}" data-step-direction="${direction}" ` +
    `aria-controls="${inputId}" aria-label="${verb} ${label} by ${step}${unit}" ` +
    `style="flex:0 0 21px;width:21px;height:28px;padding:0;cursor:pointer;touch-action:manipulation;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};font-size:16px;line-height:1">${symbol}</button>`;
  const input = `<input id="${inputId}" ${inputAttributes} type="number" value="${value}" step="${step}"${inputMinAttribute}${inputMaxAttribute} ` +
    `style="width:58px;height:28px;box-sizing:border-box;padding:4px 5px;text-align:right;background:${T.background};color:${T.line};` +
    `border:1px solid ${BORDER};font-family:ui-monospace,monospace"/>`;
  return `<span class="numeric-control" data-range-control="${controlId}" data-range-label="${label}" ` +
    `data-range-unit="${rangeUnit}" data-range-step="${step}" data-range-state="${state}"${controlMinAttribute}${controlMaxAttribute}` +
    ` style="display:inline-flex;flex:0 0 112px;flex-direction:column;gap:2px;min-width:112px">` +
    `<span class="numeric-stepper" style="display:inline-flex;align-items:center;justify-content:center">` +
    `${button(-1, "−", "Decrease")}${input}${button(1, "+", "Increase")}</span>` +
    `<span data-range-rail role="img" aria-label="${allowed}; ${current}" ` +
    `style="display:flex;align-items:center;gap:3px;width:112px;height:12px;color:${T.label};font-size:9px;line-height:1;` +
    `font-family:ui-monospace,monospace;white-space:nowrap">` +
    `<span data-range-endpoint="min" style="min-width:16px;text-align:left">${endpoint("min")}</span>` +
    `<span data-range-track style="position:relative;flex:1;height:3px;border-radius:3px;background:${BORDER};overflow:visible">` +
    `<span data-range-fill style="position:absolute;left:0;top:0;height:100%;width:50%;border-radius:3px;background:${OK}"></span>` +
    `<span data-range-marker style="position:absolute;left:50%;top:-3px;width:9px;height:9px;transform:translateX(-50%);` +
    `border:1px solid ${T.background};border-radius:50%;background:${OK};box-sizing:border-box"></span></span>` +
    `<span data-range-endpoint="max" style="min-width:16px;text-align:right">${endpoint("max")}</span></span></span>`;
}

function field(id: string, label: string,
               value: number, min: number, max: number, step: number,
               details: Pick<GarmentOption, "unit" | "help"> = {}): string {
  const tag = roleTag(id); // "body · circ" / "finished", or null for ease
  const tagSpan = tag === null ? "" :
    `<span style="opacity:0.55;font-size:11px;margin-left:6px">${tag}</span>`;
  const helpId = `help-${id}`;
  const describedBy = details.help ? `error-${id} ${helpId}` : `error-${id}`;
  const input = numericControlMarkup(
    id, `input-${id}`, label, value, min, max, step,
    `data-field="${id}" data-guidance-control="${id}" aria-describedby="${describedBy}"`,
    details.unit ?? (id.startsWith("option-") ? "" : "cm"),
  );
  const unit = details.unit
    ? `<span data-field-unit="${id}" style="font-size:11px;color:${T.label};margin-left:4px">${details.unit}</span>`
    : "";
  const help = details.help
    ? `<div id="${helpId}" data-option-help="${id}" style="font-size:11px;color:${T.label};line-height:1.35;margin:-4px 0 8px">${details.help}</div>`
    : "";
  return `<label data-dim-row="${id}" style="display:flex;justify-content:space-between;align-items:center;` +
    `gap:8px;margin-bottom:8px;font-size:13px">` +
    `<span style="color:${T.label}">${label}${tagSpan}</span>` +
    `<span style="display:inline-flex;align-items:center;white-space:nowrap">${input}${unit}</span></label>` +
    `<div id="error-${id}" data-input-error="${id}" style="font-size:12px;color:${T.lineActive}" role="status"></div>${help}`;
}

function panelTitle(text: string, id: string): string {
  return `<h2 id="${id}" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;` +
    `color:${T.label};margin:0 0 12px">${text}</h2>`;
}

function panel(title: string, body: string): string {
  const titleId = `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;
  return `<div style="flex:0 0 230px;background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:14px" role="region" aria-labelledby="${titleId}">${panelTitle(title, titleId)}${body}</div>`;
}

/** The left-hand measurements panel. */
export function controlsMarkup(
  m: Measurements, fields: readonly (keyof Measurements)[],
  options: readonly GarmentOption[] = [], values: GarmentOptions = {}
): string {
  const rows = fields
    .map((id) => FIELDS.find((f) => f.id === id))
    .filter((f): f is Field => f !== undefined)
    .map((f) => field(f.id, f.label, m[f.id], f.min, f.max, f.step))
    .join("");
  const finished = fields.includes("crotchDepth")
    ? `<div style="font-size:11.5px;color:${T.label};margin-top:2px;margin-bottom:8px">Finished waist: <span data-finished="waist" style="color:${T.line};font-family:ui-monospace,monospace">${m.waist + m.ease} cm</span> · Finished hip: <span data-finished="hip" style="color:${T.line};font-family:ui-monospace,monospace">${m.hip + m.ease} cm</span></div>`
    : fields.includes("chest")
    ? `<div style="font-size:11.5px;color:${T.label};margin-top:2px;margin-bottom:8px">Finished chest: <span data-finished="chest" style="color:${T.line};font-family:ui-monospace,monospace">${m.chest + m.ease} cm</span></div>`
    : fields.includes("hip")
      ? `<div style="font-size:11.5px;color:${T.label};margin-top:2px;margin-bottom:8px">Finished hip: <span data-finished="hip" style="color:${T.line};font-family:ui-monospace,monospace">${m.hip + m.ease} cm</span></div>`
      : "";
  const optionRows = (option: GarmentOption): string => field(
    `option-${option.id}`, option.label, values[option.id] ?? option.defaultValue,
    option.min, option.max, option.step, option
  ).replace(`data-field="option-${option.id}"`, `data-option="${option.id}"`);
  const groups = new Map<string, GarmentOption[]>();
  options.forEach((option) => {
    const group = option.group ?? "Design options";
    groups.set(group, [...(groups.get(group) ?? []), option]);
  });
  const optionGroups = [...groups.entries()].map(([group, groupOptions]) =>
    `<fieldset data-option-group="${group}" style="border:1px solid ${BORDER};border-radius:7px;padding:8px 9px;margin:0 0 10px">` +
    `<legend style="padding:0 4px;font-size:11px;color:${T.line};text-transform:uppercase;letter-spacing:0.04em">${group}</legend>` +
    `${groupOptions.map(optionRows).join("")}</fieldset>`
  ).join("");
  const optionPanel = options.length === 0 ? "" :
    `<div style="border-top:1px solid ${BORDER};margin-top:12px;padding-top:12px">` +
    `${panelTitle("Design options", "design-options-title")}${optionGroups}</div>`;
  return `<section id="controls-panel" role="region" aria-labelledby="measurements-title" style="flex:0 0 220px;background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:14px">${panelTitle("Measurements (cm)", "measurements-title")}${rows}${finished}${optionPanel}</section>`;
}

const DOT: Record<Note["level"], string> = { ok: OK, info: T.label, warn: T.lineActive };

/** The guidance panel: a top-line verdict, then one line per note. Each line leads
 *  with a severity ICON (not colour alone) so the signal survives colour-blindness
 *  and greyscale; the verdict folds every warning into a single read. */
export function guidanceMarkup(notes: readonly Note[]): string {
  const warnCount = notes.filter((n) => n.level === "warn").length;
  const clean = warnCount === 0;
  const verdictText = clean
    ? `${SEVERITY_ICON.ok} Digital checks pass`
    : `${SEVERITY_ICON.warn} ${warnCount} to review`;
  const verdict = `<div style="font-size:13px;font-weight:600;margin-bottom:12px;` +
    `color:${clean ? OK : T.lineActive}">${verdictText}</div>`;
  const rows = notes.map((n, index) => {
    const fieldName = n.field;
    const fieldLabel = fieldName?.startsWith("option-")
      ? fieldName.slice("option-".length).replace(/([A-Z])/g, " $1").toLowerCase()
      : fieldName ? FIELDS.find((f) => f.id === fieldName)?.label ?? fieldName : "";
    const controlId = fieldName === "stretchFabric" ? "stretch-select" : `input-${fieldName}`;
    const action = fieldName
      ? `<button type="button" data-guidance-focus="${fieldName}" aria-controls="${controlId}" ` +
        `style="flex:0 0 auto;padding:3px 6px;font-size:11px;cursor:pointer;background:${T.background};` +
        `color:${T.line};border:1px solid ${BORDER};border-radius:4px">Review ${fieldLabel}</button>`
      : "";
    return `<div data-guidance-row="${index}"${fieldName ? ` data-guidance-field="${fieldName}"` : ""} ` +
      `style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;font-size:12.5px;line-height:1.4">` +
      `<span style="flex:0 0 14px;color:${DOT[n.level]};font-weight:700" aria-hidden="true">` +
      `${SEVERITY_ICON[n.level]}</span><span style="flex:1;color:${T.line}">${n.text}</span>${action}</div>`;
  }).join("");
  return panel("Guidance", verdict + rows);
}

/** A row of fabric colour swatches; the current colour gets a highlight ring. */
export function fabricSwatchesMarkup(current: string): string {
  const sw = FABRICS.map((f) =>
    `<span data-swatch="${f.color}" style="display:inline-flex;flex-direction:column;align-items:center;gap:3px">` +
    `<button data-fabric="${f.color}" title="${f.name}" aria-label="Color ${f.name}" aria-pressed="${f.color === current}" ` +
    `style="width:22px;height:22px;border-radius:6px;cursor:pointer;background:${f.color};` +
    `border:1px solid ${BORDER};outline:${f.color === current ? `2px solid ${T.lineActive}` : "none"};` +
    `outline-offset:1px"></button>` +
    `<span data-fabric-name="${f.color}" style="font-size:10px;color:${T.label};white-space:nowrap">${f.name}</span></span>`
  ).join("");
  return `<div id="swatch-host" role="group" aria-labelledby="color-title" style="display:flex;gap:8px;align-items:center;margin:4px 0">` +
    `<span id="color-title" style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Color</span>${sw}</div>`;
}

// "Length +8 cm" — a single change, using the measurement's friendly label.
function deltaText(d: Delta): string {
  const label = FIELDS.find((f) => f.id === d.id)!.label;
  return `${label} ${d.change > 0 ? "+" : ""}${d.change} cm`;
}

/**
 * The style panel, prescriptive: the user picks a TARGET fit, and the panel
 * shows the gap to it on every axis. Selecting a target writes no measurement —
 * the user closes each gap themselves with the numeric inputs.
 */
export function styleMarkup(
  targetName: string,
  match: StyleMatch,
  allNames: readonly string[],
  plausible: boolean
): string {
  const options = allNames
    .map((n) => `<option ${n === targetName ? "selected" : ""}>${n}</option>`)
    .join("");
  const select = `<select id="style-target" style="width:100%;padding:5px 8px;font-size:13px;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px;` +
    `margin-bottom:12px">${options}</select>`;

  const label = `<div style="font-size:11px;color:${T.label};text-transform:uppercase;` +
    `letter-spacing:0.04em;margin-bottom:6px">Target fit</div>`;

  let body: string;
  if (match.deltas.length === 0 && !plausible) {
    // The measurements hit the target on every axis, but at least one is implausible
    // — so "you're making a X" would be a green lie. Withhold it until they're sane.
    body = `<div style="font-size:12.5px;color:${T.lineActive}">` +
      `⚠ This matches ${targetName} on paper, but the flagged inputs or digital checks need review first.</div>`;
  } else if (match.deltas.length === 0) {
    body = `<div style="font-size:13px;color:${OK}">✓ You're making a ${targetName}.</div>`;
  } else {
    const rows = match.deltas.map((d) =>
      `<div style="font-size:12.5px;color:${T.lineActive};font-family:ui-monospace,monospace;` +
      `margin-bottom:4px">${deltaText(d)}</div>`
    ).join("");
    body = `<div style="font-size:12.5px;color:${T.line};margin-bottom:8px">` +
      `To reach ${targetName}:</div>${rows}` +
      `<div style="font-size:11.5px;color:${T.label};margin-top:8px">` +
    `Enter the numeric inputs to make each change; the preview updates immediately.</div>`;
  }
  return panel("Style", label + select + body);
}

/** Download buttons for the export files, a size picker, plus Save/Load pattern state.
 *  The size picker scopes ONLY what the export buttons emit — every other view keeps
 *  its own job (Pattern = base draft, Nest/Spec = the whole run). */
export function exportButtonsMarkup(sizes: readonly SizeStep[]): string {
  const btn = (id: string, label: string): string =>
    `<button id="${id}" type="button" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">` +
    `${label}</button>`;
  const options = sizes
    .map((s) => `<option value="${s.step}" ${s.step === 0 ? "selected" : ""}>${s.label}</option>`)
    .join("");
  const sizePicker =
    `<label style="display:inline-flex;gap:5px;align-items:center;font-size:11px;color:${T.label}">` +
    `Selected size <select id="export-size" aria-label="Selected size for per-size exports" style="padding:4px 8px;font-size:12px;background:${T.background};` +
    `color:${T.line};border:1px solid ${BORDER};border-radius:5px">${options}</select></label>`;
  const scope = (name: string, consequence: string, buttons: string): string =>
    `<div data-export-scope="${name}" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;` +
    `padding:7px 0;border-top:1px solid ${BORDER}">` +
    `<strong style="font-size:11px;color:${T.line};white-space:nowrap">${name === "selected-size" ? "Selected size exports" : "Whole graded run exports"}</strong>` +
    `<span style="font-size:11px;color:${T.label};margin-right:3px">${consequence}</span>${buttons}</div>`;
  return `<div id="export-host" style="display:flex;flex-direction:column;gap:2px;align-items:stretch;flex-wrap:wrap;margin:4px 0">` +
    `<div style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em">Export</div>` +
    scope("selected-size", "One selected size", `${btn("export-svg", "SVG")}${btn("export-dxf", "DXF")}${btn("export-pdf", "PDF")}${btn("export-a0", "A0")}${sizePicker}`) +
    scope("whole-run", "All graded sizes; ignores Selected size", `${btn("export-techpack", "Tech Pack")}${btn("export-projector", "Projector")}`) +
    `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:6px">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;margin-right:4px">Workspace</span>` +
    `${btn("save-pattern", "Save")}${btn("load-pattern", "Load")}` +
    `<span id="persist-status" style="font-size:11px;color:${T.label};min-width:80px"></span></div></div>`;
}

/** Material/stretch dropdown — drives ease and compatibility guidance only. */
export function fabricStretchMarkup(current: string): string {
  const options = STRETCH_FABRICS
    .map((f) => `<option ${f.name === current ? "selected" : ""}>${f.name}</option>`)
    .join("");
  return `<div id="stretch-host" role="group" aria-label="Material and stretch" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Material / stretch</span>` +
    `<select id="stretch-select" data-guidance-control="stretchFabric" aria-label="Material and stretch" style="padding:4px 8px;font-size:12px;background:${T.background};` +
    `color:${T.line};border:1px solid ${BORDER};border-radius:5px">${options}</select>` +
    `<span style="font-size:11px;color:${T.label};line-height:1.35">Guides ease and tech-pack material; it does not set garment color.</span></div>`;
}

/** Pattern vs. graded size-run toggle for the main canvas. */
export function viewToggleMarkup(active: string): string {
  const btn = (id: string, label: string, on: boolean): string =>
    `<button id="${id}" type="button" aria-pressed="${on}" style="padding:5px 12px;font-size:12px;cursor:pointer;` +
    `background:${on ? T.lineActive : T.background};color:${on ? T.background : T.line};` +
    `border:1px solid ${BORDER};border-radius:5px">${label}</button>`;
  return `<div id="view-toggle-host" role="group" aria-label="Canvas view" style="display:flex;gap:6px;align-items:center;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">View</span>` +
    `${btn("view-pattern", "Pattern", active === "pattern")}` +
    `${btn("view-body", "Body", active === "body")}` +
    `${btn("view-nest", "Size run", active === "nest")}` +
    `${btn("view-spec", "Spec", active === "spec")}` +
    `${btn("view-fabric", "Nesting", active === "fabric")}` +
    `${btn("view-check", "Check", active === "check")}` +
    `${btn("view-edit", "Edit", active === "edit")}</div>`;
}

export type BodyCroquisView = "front-back" | "front" | "back" | "side";

/** The Body view's projection selector. Side is intentionally a separate
 * presentation mode because it is a schematic envelope, not another measured
 * front/back panel. */
export function bodyCroquisToggleMarkup(active: BodyCroquisView): string {
  const btn = (id: string, label: string, on: boolean): string =>
    `<button id="${id}" type="button" aria-label="Show ${label.toLowerCase()} body figure" aria-pressed="${on}" style="padding:4px 10px;font-size:12px;cursor:pointer;` +
    `background:${on ? T.lineActive : T.background};color:${on ? T.background : T.line};` +
    `border:1px solid ${BORDER};border-radius:5px">${label}</button>`;
  return `<div id="body-croquis-toggle-host" role="group" aria-label="Body figure" style="display:none;gap:6px;align-items:center;` +
    `margin:0 0 4px 2px"><span style="font-size:11px;color:${T.label};text-transform:uppercase;` +
    `letter-spacing:0.04em;margin-right:2px">Body figure</span>` +
    `${btn("body-front-back", "Front + Back", active === "front-back")}` +
    `${btn("body-front", "Front", active === "front")}` +
    `${btn("body-back", "Back", active === "back")}` +
    `${btn("body-side", "Side", active === "side")}</div>`;
}

const INSPECTION_TITLES: Record<string, string> = {
  pattern: "Pattern inspection",
  body: "Body figure inspection",
  nest: "Size-run inspection",
  fabric: "Marker inspection",
  check: "Digital check inspection",
  edit: "Pattern edit inspection",
  spec: "Specification inspection",
};

/** A bounded inspection frame for every main canvas. SVGs are deliberately
 * labelled and live inside a scrollable viewport so a narrow/portrait drawing
 * cannot make the whole page unusably tall or disappear at intrinsic size. */
export function inspectionMarkup(content: string, view: string): string {
  const title = INSPECTION_TITLES[view] ?? "Canvas inspection";
  return `<section id="canvas-inspection" data-inspection-view="${view}" aria-labelledby="inspection-title" ` +
    `style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;padding:10px;min-width:0">` +
    `<div id="inspection-toolbar" role="group" aria-label="${title} controls" ` +
    `style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">` +
    `<h2 id="inspection-title" style="flex:1;margin:0;font-size:12px;font-weight:600;color:${T.line}">${title}</h2>` +
    `<button type="button" data-inspection-zoom="out" aria-label="Zoom out" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">−</button>` +
    `<button type="button" data-inspection-zoom="fit" aria-label="Fit inspection" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">Fit</button>` +
    `<button type="button" data-inspection-zoom="in" aria-label="Zoom in" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">+</button>` +
    `<output id="inspection-zoom" aria-live="polite" style="min-width:38px;text-align:right;font-size:11px;color:${T.label}">100%</output>` +
    `</div>` +
    `<div id="inspection-viewport" role="region" aria-labelledby="inspection-title" tabindex="0" ` +
    `style="min-height:260px;max-height:560px;overflow:auto;background:${T.background};border-radius:8px;padding:8px;box-sizing:border-box">` +
    `<div id="inspection-content" style="min-width:0">${content}</div></div></section>`;
}

/** The assembled garment is a secondary preview, not the active analytical
 * canvas. Give it an explicit owner and let the user collapse it when it is
 * competing with the current inspection task. */
export function assembledPreviewMarkup(content: string, expanded = true): string {
  const display = expanded ? "block" : "none";
  const label = expanded ? "Hide preview" : "Show preview";
  return `<section id="assembled-preview" aria-labelledby="assembled-preview-title" ` +
    `style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;padding:10px;margin-top:2px">` +
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">` +
    `<h2 id="assembled-preview-title" style="flex:1;margin:0;font-size:12px;font-weight:600;color:${T.line}">Assembled preview</h2>` +
    `<button id="assembled-preview-toggle" type="button" aria-controls="assembled-preview-content" aria-expanded="${expanded}" ` +
    `style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">${label}</button></div>` +
    `<div id="assembled-preview-content" style="display:${display}">${content}</div></section>`;
}

export function garmentToggleMarkup(active: string): string {
  const btn = (g: { name: string; label: string }): string =>
    `<button id="garment-${g.name}" type="button" aria-pressed="${g.name === active}" style="padding:6px 12px;font-size:13px;cursor:pointer;` +
    `background:${g.name === active ? T.lineActive : T.background};` +
    `color:${g.name === active ? T.background : T.line};` +
    `border:1px solid ${BORDER};border-radius:5px">${g.label}</button>`;
  return `<div id="garment-toggle-host" role="group" aria-label="Garment" style="display:flex;gap:6px;align-items:center;margin-left:8px">` +
    `<span style="font-size:12px;color:${T.label}">Garment</span>` +
    `${GARMENTS.map(btn).join("")}</div>`;
}

/** Dart tools, shown only when the piece being edited actually has a dart.
 *  Moving a dart is a pure pivot about the apex: same wedge, new seam, same fit.
 *  Truing blends the corner the old dart leaves behind. */
export function dartControlsMarkup(hasDart: boolean, canTrue: boolean): string {
  if (!hasDart) return "";
  const btn = (id: string, label: string): string =>
    `<button id="${id}" type="button" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};` +
    `border-radius:5px">${label}</button>`;
  const trueBtn = canTrue ? btn("dart-true", "True side seam") : "";
  return `<div style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:12px;` +
    `color:${T.label}">` +
    `<span style="flex:1">Move the dart — same wedge, same fit, different seam.</span>` +
    `${btn("dart-shoulder", "→ Shoulder")}${btn("dart-hem", "→ Hem")}${trueBtn}</div>`;
}

/** The Edit-view contract + Reset. Edits are intentionally an exploratory
 * front-piece preview until a design-state model exists to carry them through
 * grading, validation, nesting, persistence, and exports. */
export function editorHintMarkup(): string {
  return `<div data-editor-contract="preview-only" style="display:flex;gap:10px;align-items:center;` +
    `margin-top:6px;font-size:12px;color:${T.label}">` +
    `<span style="flex:1"><strong style="color:${T.line}">Exploratory edit — front piece only.</strong> ` +
    `Drag the dots, enter their coordinates below, or use dart tools to test a shape. This preview does not change ` +
    `measurements, the assembled garment, checks, size grading, nesting, saves, or exports. ` +
    `Use Reset to return to the current parametric draft.</span>` +
    `<button id="editor-reset" type="button" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">` +
    `Reset to draft</button></div>`;
}

/** Numeric equivalents for every pointer handle. They keep Edit usable with a
 * keyboard or assistive technology while retaining the pointer canvas as a
 * quick exploratory surface. */
export function editorHandleControlsMarkup(handles: readonly Handle[]): string {
  const rows = handles.map((handle, index) => {
    const label = handle.kind === "vertex" ? `Corner ${index + 1}` : `Curve control ${index + 1}`;
    const input = (axis: "x" | "y", value: number): string =>
      `<label style="display:inline-flex;gap:4px;align-items:center;font-size:12px;color:${T.label}">` +
      `${axis.toUpperCase()} ${numericControlMarkup(
        `editor-${handle.id}-${axis}`, `editor-coordinate-${handle.id}-${axis}`,
        `${label} ${axis.toUpperCase()} coordinate`, value, undefined, undefined, 0.1,
        `data-editor-coordinate data-editor-handle-id="${handle.id}" data-editor-axis="${axis}" ` +
        `aria-label="${label} ${axis.toUpperCase()} coordinate"`, "cm",
      )}</label>`;
    return `<div data-editor-handle="${handle.id}" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">` +
      `<span style="min-width:116px;color:${T.line};font-size:12px">${label} <span style="color:${T.label}">(${handle.id})</span></span>` +
      `${input("x", handle.pos.x)}${input("y", handle.pos.y)}</div>`;
  }).join("");
  return `<section data-editor-handle-controls role="group" aria-labelledby="editor-coordinates-title" ` +
    `style="margin-top:8px;padding-top:8px;border-top:1px solid ${BORDER}">` +
    `<h3 id="editor-coordinates-title" style="margin:0 0 4px;font-size:12px;color:${T.line}">Keyboard handle coordinates</h3>` +
    `<p style="margin:0 0 8px;font-size:11px;color:${T.label}">Enter a finite coordinate in centimetres, then leave the field to apply it.</p>` +
    rows + `</section>`;
}

/** Fabric-width input for the nesting estimator (a cutting setting, not a body number).
 *  Wrapped in an id'd host so the app can hide it in views where it does nothing. */
export function fabricWidthMarkup(width: number): string {
  const scopeBtn = (id: string, label: string, description: string, on: boolean): string =>
    `<button id="${id}" type="button" aria-pressed="${on}" aria-label="${description}" aria-describedby="nest-scope-help" style="padding:4px 10px;font-size:12px;cursor:pointer;` +
    `background:${on ? T.lineActive : "transparent"};color:${on ? T.background : T.label};` +
    `border:1px solid ${BORDER};border-radius:5px">${label}</button>`;
  const widthInput = numericControlMarkup(
    "fabric-width", "fabric-width", "Fabric width", width, 30, 300, 1,
    `aria-label="Fabric width"`, "cm",
  );
  return `<div id="fabric-width-host" role="group" aria-label="Nesting scope" style="display:none;gap:8px;align-items:center;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Fabric width</span>` +
    `${widthInput}` +
    `<span style="width:8px"></span>` +
    `${scopeBtn("nest-single", "Single size", "Nest the selected size only", true)}` +
    `${scopeBtn("nest-marker", "Graded marker", "Nest every graded size", false)}` +
    `<span id="nest-scope-help" style="font-size:11px;color:${T.label};flex-basis:100%">` +
    `Single size uses the selected size; Graded marker includes every graded size.</span></div>`;
}

/** The auto-measured spec sheet: POM rows × size columns, base column highlighted. */
export function specTableMarkup(
  rows: readonly SpecRow[],
  sizeLabels: readonly string[],
  baseIndex: number
): string {
  const cell = (content: string, isBase: boolean, header: boolean): string => {
    const bg = isBase ? T.gridStrong : "transparent";
    const weight = header ? "600" : "400";
    const align = header ? "center" : "right";
    return `<td style="padding:5px 9px;text-align:${align};background:${bg};` +
      `color:${T.line};font-weight:${weight};font-variant-numeric:tabular-nums;` +
      `white-space:nowrap">${content}</td>`;
  };
  const labelCell = (content: string, header: boolean): string =>
    `<td style="padding:5px 9px;text-align:left;color:${header ? T.label : T.line};` +
    `font-weight:${header ? "600" : "400"};white-space:nowrap">${content}</td>`;

  const head = `<tr>${labelCell("Measurement (cm)", true)}` +
    cell("Tol ±", false, true) +
    sizeLabels.map((l, i) => cell(l, i === baseIndex, true)).join("") + `</tr>`;
  const body = rows.map((r) =>
    `<tr>${labelCell(r.label, false)}` +
    cell(r.tolerance === undefined ? "—" : r.tolerance.toFixed(1), false, false) +
    r.values.map((v, i) => cell(v.toFixed(1), i === baseIndex, false)).join("") + `</tr>`
  ).join("");

  return `<div style="background:${T.background};border-radius:8px;padding:14px;overflow-x:auto">` +
    `<table style="border-collapse:collapse;font-size:12.5px;font-family:system-ui,sans-serif;` +
    `width:100%">${head}${body}</table></div>`;
}

/** The production-readiness report: a pass/fail verdict banner over the check list.
 *  `plausible` gates the GREEN state: geometry can pass (it sews) while the numbers
 *  are still an impossible body — that must not read as a green "ready". */
export function checkMarkup(report: Report, plausible: boolean): string {
  const green = report.ok && plausible;
  const bannerBg = green ? OK : T.lineActive;
  const bannerText = green
    ? "✓ Digital checks pass — physical validation pending"
    : report.ok
      ? "⚠ Review the flagged inputs and design guidance"
      : "✗ Digital checks need review — fix the flagged checks";
  const banner = `<div style="padding:10px 14px;border-radius:8px;font-weight:600;font-size:14px;` +
    `color:${T.background};background:${bannerBg};margin-bottom:12px">${bannerText}</div>`;

  const rows = report.checks.map((c) => {
    const color = c.ok ? OK : T.lineActive;
    const mark = c.ok ? "✓" : "✗";
    return `<div style="display:flex;gap:10px;align-items:baseline;margin-bottom:9px;font-size:13px">` +
      `<span style="flex:0 0 14px;color:${color};font-weight:700">${mark}</span>` +
      `<span style="flex:1;color:${T.line}">${c.name}` +
      `<span style="color:${T.label};font-size:12px"> — ${c.detail}</span></span></div>`;
  }).join("");

  return `<div style="background:${T.background};border-radius:8px;padding:14px">${banner}${rows}</div>`;
}

/** The whole app shell: controls, canvas host, and a stacked guidance + style column. */
export function appShellMarkup(
  m: Measurements,
  fabric: string,
  sizes: readonly SizeStep[],
  fields: readonly (keyof Measurements)[],
  stretchFabric = STRETCH_FABRICS[0].name,
  activeGarment = "tee"
): string {
  const responsive = `<style id="infini-responsive-shell">` +
    `#infini-shell .numeric-control input[type=number]{appearance:textfield;-moz-appearance:textfield}` +
    `#infini-shell .numeric-control input[type=number]::-webkit-inner-spin-button,#infini-shell .numeric-control input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}` +
    `#infini-shell .numeric-stepper button{user-select:none;-webkit-user-select:none}` +
    `#infini-shell .numeric-stepper button:first-child{border-radius:5px 0 0 5px}` +
    `#infini-shell .numeric-stepper button:last-child{border-radius:0 5px 5px 0}` +
    `#infini-shell .numeric-stepper input{border-radius:0}` +
    `#infini-shell .numeric-stepper button:disabled{opacity:.35;cursor:not-allowed}` +
    `#infini-shell{display:grid!important;grid-template-columns:minmax(210px,0.75fr) minmax(300px,1.7fr) minmax(240px,0.9fr);gap:16px;align-items:start;font-family:system-ui,sans-serif}` +
    `#infini-workspace{min-width:0;display:flex;flex-direction:column;gap:6px}` +
    `#infini-inspection{min-width:0;display:flex;flex-direction:column;gap:16px}` +
    `#infini-shell svg{max-width:100%;height:auto}` +
    `#view-toggle-host,#garment-toggle-host,#body-croquis-toggle-host,#swatch-host,#stretch-host,#export-host{flex-wrap:wrap}` +
    `@media(max-width:900px){#infini-shell{grid-template-columns:minmax(190px,0.7fr) minmax(0,1.3fr)}#infini-inspection{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}}` +
    `@media(max-width:560px){#infini-shell{display:flex!important;flex-direction:column;gap:12px}#infini-shell>*{width:100%;min-width:0;box-sizing:border-box}#infini-shell #controls-panel{flex:0 1 auto!important;width:100%}#infini-workspace,#infini-inspection{width:100%}#infini-inspection{display:flex;gap:12px}#infini-shell button,#infini-shell select{max-width:100%}}` +
    `</style>`;
  const productHeader = `<header id="product-header" style="grid-column:1 / -1;padding:2px 0 0">` +
    `<h1 id="product-title" style="font-size:22px;line-height:1.1;letter-spacing:-0.02em;color:${T.line};margin:0">InfiniDrip</h1>` +
    `<p id="product-subtitle" style="font-size:12px;color:${T.label};margin:4px 0 0">Parametric garment design workspace</p></header>`;
  return responsive + `<main id="infini-shell" aria-labelledby="product-title" style="display:flex;gap:16px;align-items:flex-start;font-family:system-ui,sans-serif">` +
    productHeader +
    `${controlsMarkup(m, fields)}` +
    `<div id="infini-workspace" style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:6px">` +
    `<div id="journey-host"></div>` +
    `${viewToggleMarkup("pattern")}${bodyCroquisToggleMarkup("front-back")}${garmentToggleMarkup(activeGarment)}${fabricStretchMarkup(stretchFabric)}` +
    `${fabricWidthMarkup(150)}` +
    `<div id="canvas-host"></div>${fabricSwatchesMarkup(fabric)}${exportButtonsMarkup(sizes)}` +
    `<div id="garment-host"></div></div>` +
    `<div id="infini-inspection" style="display:flex;flex-direction:column;gap:16px">` +
    `<div id="guidance-host"></div><div id="style-host"></div></div></main>`;
}
