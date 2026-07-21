// Builds the app's HTML as strings (same approach as the SVG canvas): a controls
// panel, a canvas host, a guidance panel, and a style panel. Pure, so the markup
// can be checked in tests without a browser.

import { Measurements, STRETCH_FABRICS, SpecRow, GARMENTS, SizeStep } from "../drafting";
import { BLUEPRINT as T, FABRICS } from "../render";
import { Note } from "../guidance";
import { Report } from "../guidance";
import { StyleMatch, Delta } from "../style";
import { FIELDS } from "./controls";

const PANEL = "#13233A";
const BORDER = "#1E3450";
const OK = "#2E9B63";

function field(id: string, label: string,
               value: number, min: number, max: number, step: number): string {
  return `<label data-dim-row="${id}" style="display:flex;justify-content:space-between;align-items:center;` +
    `gap:8px;margin-bottom:8px;font-size:13px">` +
    `<span style="color:${T.label}">${label}</span>` +
    `<input data-field="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" ` +
    `style="width:64px;padding:4px 6px;text-align:right;background:${T.background};color:${T.line};` +
    `border:1px solid ${BORDER};border-radius:5px;font-family:ui-monospace,monospace"/></label>`;
}

function panelTitle(text: string): string {
  return `<div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;` +
    `color:${T.label};margin-bottom:12px">${text}</div>`;
}

function panel(title: string, body: string): string {
  return `<div style="flex:0 0 230px;background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:14px">${panelTitle(title)}${body}</div>`;
}

/** The left-hand measurements panel. */
export function controlsMarkup(m: Measurements): string {
  const rows = FIELDS.map((f) => field(f.id, f.label, m[f.id], f.min, f.max, f.step)).join("");
  return `<div style="flex:0 0 220px;background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:14px">${panelTitle("Measurements (cm)")}${rows}</div>`;
}

const DOT: Record<Note["level"], string> = { ok: OK, info: T.label, warn: T.lineActive };

/** The guidance panel: one line per note, colour-coded by level. */
export function guidanceMarkup(notes: readonly Note[]): string {
  const rows = notes.map((n) =>
    `<div style="display:flex;gap:8px;margin-bottom:10px;font-size:12.5px;line-height:1.4">` +
    `<span style="flex:0 0 8px;width:8px;height:8px;border-radius:50%;margin-top:4px;` +
    `background:${DOT[n.level]}"></span><span style="color:${T.line}">${n.text}</span></div>`
  ).join("");
  return panel("Guidance", rows);
}

/** A row of fabric colour swatches; the current colour gets a highlight ring. */
export function fabricSwatchesMarkup(current: string): string {
  const sw = FABRICS.map((f) =>
    `<button data-fabric="${f.color}" title="${f.name}" ` +
    `style="width:22px;height:22px;border-radius:6px;cursor:pointer;background:${f.color};` +
    `border:1px solid ${BORDER};outline:${f.color === current ? `2px solid ${T.lineActive}` : "none"};` +
    `outline-offset:1px"></button>`
  ).join("");
  return `<div style="display:flex;gap:8px;align-items:center;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Fabric</span>${sw}</div>`;
}

// "Length +8 cm" — a single change, using the measurement's friendly label.
function deltaText(d: Delta): string {
  const label = FIELDS.find((f) => f.id === d.id)!.label;
  return `${label} ${d.change > 0 ? "+" : ""}${d.change} cm`;
}

/**
 * The style panel, prescriptive: the user picks a TARGET fit, and the panel
 * shows the gap to it on every axis. Selecting a target writes no measurement —
 * the user closes each gap themselves with the sliders.
 */
export function styleMarkup(
  targetName: string,
  match: StyleMatch,
  allNames: readonly string[]
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
  if (match.deltas.length === 0) {
    body = `<div style="font-size:13px;color:${OK}">✓ You're making a ${targetName}.</div>`;
  } else {
    const rows = match.deltas.map((d) =>
      `<div style="font-size:12.5px;color:${T.lineActive};font-family:ui-monospace,monospace;` +
      `margin-bottom:4px">${deltaText(d)}</div>`
    ).join("");
    body = `<div style="font-size:12.5px;color:${T.line};margin-bottom:8px">` +
      `To reach ${targetName}:</div>${rows}` +
      `<div style="font-size:11.5px;color:${T.label};margin-top:8px">` +
      `Adjust the sliders — nothing changes on its own.</div>`;
  }
  return panel("Style", label + select + body);
}

/** Download buttons for the export files, a size picker, plus Save/Load pattern state.
 *  The size picker scopes ONLY what the export buttons emit — every other view keeps
 *  its own job (Pattern = base draft, Nest/Spec = the whole run). */
export function exportButtonsMarkup(sizes: readonly SizeStep[]): string {
  const btn = (id: string, label: string): string =>
    `<button id="${id}" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">` +
    `${label}</button>`;
  const options = sizes
    .map((s) => `<option value="${s.step}" ${s.step === 0 ? "selected" : ""}>${s.label}</option>`)
    .join("");
  const sizePicker =
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-left:8px;margin-right:4px">Size</span>` +
    `<select id="export-size" style="padding:4px 8px;font-size:12px;background:${T.background};` +
    `color:${T.line};border:1px solid ${BORDER};border-radius:5px">${options}</select>`;
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Export</span>${btn("export-svg", "SVG")}${btn("export-dxf", "DXF")}${btn("export-pdf", "PDF")}` +
    `${btn("export-techpack", "Tech Pack")}` +
    `${sizePicker}` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-left:8px;margin-right:4px">Pattern</span>${btn("save-pattern", "Save")}${btn("load-pattern", "Load")}` +
    `<span id="persist-status" style="font-size:11px;color:${T.label};min-width:80px"></span></div>`;
}

/** Fabric (stretch) dropdown — drives the ease guidance note only, sets nothing. */
export function fabricStretchMarkup(current: string): string {
  const options = STRETCH_FABRICS
    .map((f) => `<option ${f.name === current ? "selected" : ""}>${f.name}</option>`)
    .join("");
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Fabric</span>` +
    `<select id="stretch-select" style="padding:4px 8px;font-size:12px;background:${T.background};` +
    `color:${T.line};border:1px solid ${BORDER};border-radius:5px">${options}</select></div>`;
}

/** Pattern vs. graded size-run toggle for the main canvas. */
export function viewToggleMarkup(active: string): string {
  const btn = (id: string, label: string, on: boolean): string =>
    `<button id="${id}" style="padding:5px 12px;font-size:12px;cursor:pointer;` +
    `background:${on ? T.lineActive : T.background};color:${on ? T.background : T.line};` +
    `border:1px solid ${BORDER};border-radius:5px">${label}</button>`;
  return `<div style="display:flex;gap:6px;align-items:center;margin:4px 0">` +
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

export function garmentToggleMarkup(active: string): string {
  const btn = (g: { name: string; label: string }): string =>
    `<button id="garment-${g.name}" style="padding:6px 12px;font-size:13px;cursor:pointer;` +
    `background:${g.name === active ? T.lineActive : T.background};` +
    `color:${g.name === active ? T.background : T.line};` +
    `border:1px solid ${BORDER};border-radius:5px">${g.label}</button>`;
  return `<div style="display:flex;gap:6px;align-items:center;margin-left:8px">` +
    `<span style="font-size:12px;color:${T.label}">Garment</span>` +
    `${GARMENTS.map(btn).join("")}</div>`;
}

/** Dart tools, shown only when the piece being edited actually has a dart.
 *  Moving a dart is a pure pivot about the apex: same wedge, new seam, same fit.
 *  Truing blends the corner the old dart leaves behind. */
export function dartControlsMarkup(hasDart: boolean, canTrue: boolean): string {
  if (!hasDart) return "";
  const btn = (id: string, label: string): string =>
    `<button id="${id}" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};` +
    `border-radius:5px">${label}</button>`;
  const trueBtn = canTrue ? btn("dart-true", "True side seam") : "";
  return `<div style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:12px;` +
    `color:${T.label}">` +
    `<span style="flex:1">Move the dart — same wedge, same fit, different seam.</span>` +
    `${btn("dart-shoulder", "→ Shoulder")}${btn("dart-hem", "→ Hem")}${trueBtn}</div>`;
}

/** The Edit-view hint + Reset (freeform edits are a manual override, not parametric). */
export function editorHintMarkup(): string {
  return `<div style="display:flex;gap:10px;align-items:center;margin-top:6px;font-size:12px;` +
    `color:${T.label}">` +
    `<span style="flex:1">Drag the dots to reshape the front. Edits are a manual override — ` +
    `they don't change your measurements.</span>` +
    `<button id="editor-reset" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">` +
    `Reset to draft</button></div>`;
}

/** Fabric-width input for the nesting estimator (a cutting setting, not a body number).
 *  Wrapped in an id'd host so the app can hide it in views where it does nothing. */
export function fabricWidthMarkup(width: number): string {
  const scopeBtn = (id: string, label: string, on: boolean): string =>
    `<button id="${id}" style="padding:4px 10px;font-size:12px;cursor:pointer;` +
    `background:${on ? T.lineActive : "transparent"};color:${on ? T.background : T.label};` +
    `border:1px solid ${BORDER};border-radius:5px">${label}</button>`;
  return `<div id="fabric-width-host" style="display:none;gap:8px;align-items:center;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Fabric width</span>` +
    `<input id="fabric-width" type="number" value="${width}" min="30" max="300" step="1" ` +
    `style="width:64px;padding:4px 6px;text-align:right;background:${T.background};color:${T.line};` +
    `border:1px solid ${BORDER};border-radius:5px;font-family:ui-monospace,monospace"/>` +
    `<span style="font-size:12px;color:${T.label}">cm</span>` +
    `<span style="width:8px"></span>` +
    `${scopeBtn("nest-single", "Single", true)}${scopeBtn("nest-marker", "Marker", false)}</div>`;
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

/** The production-readiness report: a pass/fail verdict banner over the check list. */
export function checkMarkup(report: Report): string {
  const bannerBg = report.ok ? OK : T.lineActive;
  const bannerText = report.ok ? "✓ Ready to cut" : "✗ Not ready — fix the flagged checks";
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
export function appShellMarkup(m: Measurements, fabric: string, sizes: readonly SizeStep[]): string {
  return `<div style="display:flex;gap:16px;align-items:flex-start;font-family:system-ui,sans-serif">` +
    `${controlsMarkup(m)}` +
    `<div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:6px">` +
    `${viewToggleMarkup("pattern")}${garmentToggleMarkup("tee")}${fabricStretchMarkup(STRETCH_FABRICS[0].name)}` +
    `${fabricWidthMarkup(150)}` +
    `<div id="canvas-host"></div>${fabricSwatchesMarkup(fabric)}${exportButtonsMarkup(sizes)}` +
    `<div id="garment-host"></div></div>` +
    `<div style="display:flex;flex-direction:column;gap:16px">` +
    `<div id="guidance-host"></div><div id="style-host"></div></div></div>`;
}
