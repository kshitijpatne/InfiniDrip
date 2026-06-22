// Builds the app's HTML as strings (same approach as the SVG canvas): a controls
// panel on the left and an empty host for the canvas on the right. Pure, so the
// markup can be checked in tests without a browser.

import { Measurements } from "../drafting";
import { BLUEPRINT as T } from "../render";
import { FIELDS } from "./controls";

const PANEL = "#13233A";
const BORDER = "#1E3450";

function field(id: string, label: string,
               value: number, min: number, max: number, step: number): string {
  return `<label style="display:flex;justify-content:space-between;align-items:center;` +
    `gap:8px;margin-bottom:8px;font-size:13px">` +
    `<span style="color:${T.label}">${label}</span>` +
    `<input data-field="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" ` +
    `style="width:64px;padding:4px 6px;text-align:right;background:${T.background};color:${T.line};` +
    `border:1px solid ${BORDER};border-radius:5px;font-family:ui-monospace,monospace"/></label>`;
}

/** The left-hand measurements panel. */
export function controlsMarkup(m: Measurements): string {
  const rows = FIELDS.map((f) => field(f.id, f.label, m[f.id], f.min, f.max, f.step)).join("");
  return `<div style="flex:0 0 220px;background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:14px">` +
    `<div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;` +
    `color:${T.label};margin-bottom:12px">Measurements (cm)</div>${rows}</div>`;
}

/** The whole app shell: controls panel + an empty canvas host. */
export function appShellMarkup(m: Measurements): string {
  return `<div style="display:flex;gap:16px;align-items:flex-start;font-family:system-ui,sans-serif">` +
    `${controlsMarkup(m)}<div id="canvas-host" style="flex:1;min-width:320px"></div></div>`;
}
