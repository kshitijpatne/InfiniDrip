// Builds the app's HTML as strings (same approach as the SVG canvas): a controls
// panel, a canvas host, a guidance panel, and a style panel. Pure, so the markup
// can be checked in tests without a browser.

import { Measurements } from "../drafting";
import { BLUEPRINT as T, FABRICS } from "../render";
import { Note } from "../guidance";
import { StyleSuggestions, Delta } from "../style";
import { FIELDS } from "./controls";

const PANEL = "#13233A";
const BORDER = "#1E3450";
const OK = "#2E9B63";

function field(id: string, label: string,
               value: number, min: number, max: number, step: number): string {
  return `<label style="display:flex;justify-content:space-between;align-items:center;` +
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

/** The style panel: the current style, then nearby styles with how to reach them. */
export function styleMarkup(s: StyleSuggestions): string {
  const current = s.current.length > 0 ? s.current.join(", ") : "Between styles";
  const head = `<div style="font-size:13px;color:${T.line};margin-bottom:12px">` +
    `<span style="color:${T.label}">Current: </span>${current}</div>`;
  const rows = s.nearby.map((n) =>
    `<div style="margin-bottom:10px">` +
    `<div style="font-size:13px;color:${T.line}">${n.name}</div>` +
    `<div style="font-size:11.5px;color:${T.lineActive};font-family:ui-monospace,monospace">` +
    `${n.deltas.map(deltaText).join(", ")}</div></div>`
  ).join("");
  return panel("Style", head + rows);
}

/** Download buttons for the export files (the click logic lives in app.ts). */
export function exportButtonsMarkup(): string {
  const btn = (id: string, label: string): string =>
    `<button id="${id}" style="padding:5px 10px;font-size:12px;cursor:pointer;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">` +
    `${label}</button>`;
  return `<div style="display:flex;gap:8px;align-items:center;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;` +
    `margin-right:4px">Export</span>${btn("export-svg", "SVG")}${btn("export-dxf", "DXF")}</div>`;
}

/** The whole app shell: controls, canvas host, and a stacked guidance + style column. */
export function appShellMarkup(m: Measurements, fabric: string): string {
  return `<div style="display:flex;gap:16px;align-items:flex-start;font-family:system-ui,sans-serif">` +
    `${controlsMarkup(m)}` +
    `<div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:6px">` +
    `<div id="canvas-host"></div>${fabricSwatchesMarkup(fabric)}${exportButtonsMarkup()}` +
    `<div id="garment-host"></div></div>` +
    `<div style="display:flex;flex-direction:column;gap:16px">` +
    `<div id="guidance-host"></div><div id="style-host"></div></div></div>`;
}
