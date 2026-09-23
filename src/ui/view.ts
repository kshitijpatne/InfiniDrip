// Builds the app's HTML as strings (same approach as the SVG canvas): a persistent
// workspace header, a stable inspection canvas, and a bounded grouped inspector.
// Pure, so the markup can be checked in tests without a browser.

import { Measurements, STRETCH_FABRICS, SpecRow, GARMENTS, SizeStep, roleTag, GarmentOption, GarmentOptions } from "../drafting";
import { BLUEPRINT as T, FABRICS } from "../render";
import { Note, SEVERITY_ICON } from "../guidance";
import { Report } from "../guidance";
import { StyleMatch, Delta } from "../style";
import { FIELDS, Field, numericRangeState } from "./controls";
import type { ArtworkPlacement } from "../surface/placement";
import { escapeAttr } from "../render/surface-overlay";
import type { Piece, PatternMark, PatternAnnotationRole } from "../drafting";
import { APPEARANCE_TEXTURES, Appearance, DEFAULT_APPEARANCE, hexToHsl, normalizeHex } from "./appearance";
import {
  availableLengthError,
  bufferError,
  fitResult,
  napNoticeText,
  plannedLength,
  wastePercent,
} from "../export/nesting-intelligence";
import type { Handle } from "../edit";
import "./studio.css";

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
    `style="flex:0 0 36px;width:36px;height:36px;padding:0;cursor:pointer;touch-action:manipulation;` +
    `background:${T.background};color:${T.line};border:1px solid ${BORDER};font-size:16px;line-height:1">${symbol}</button>`;
  const input = `<input id="${inputId}" ${inputAttributes} type="number" value="${value}" step="${step}"${inputMinAttribute}${inputMaxAttribute} ` +
    `style="width:58px;height:36px;box-sizing:border-box;padding:4px 5px;text-align:right;background:${T.background};color:${T.line};` +
    `border:1px solid ${BORDER};font-family:ui-monospace,monospace"/>`;
  return `<span class="numeric-control" data-range-control="${controlId}" data-range-label="${label}" ` +
    `data-range-unit="${rangeUnit}" data-range-step="${step}" data-range-state="${state}"${controlMinAttribute}${controlMaxAttribute}` +
    ` style="display:inline-flex;flex:0 0 130px;flex-direction:column;gap:5px;min-width:130px">` +
    `<span class="numeric-stepper" style="display:inline-flex;align-items:center;justify-content:center">` +
    `${button(-1, "−", "Decrease")}${input}${button(1, "+", "Increase")}</span>` +
    `<span data-range-rail role="img" aria-label="${allowed}; ${current}" ` +
    `style="display:flex;align-items:center;gap:5px;width:130px;height:14px;color:${T.label};font-size:11px;line-height:1;` +
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
    `<span style="display:block;color:${T.label};font-size:11px;margin-top:3px">${tag}</span>`;
  const helpId = `help-${id}`;
  const describedBy = details.help ? `error-${id} ${helpId}` : `error-${id}`;
  const input = numericControlMarkup(
    id, `input-${id}`, label, value, min, max, step,
    `data-field="${id}" data-guidance-control="${id}" aria-label="${label}" aria-describedby="${describedBy}"`,
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

/** The grouped measurement and construction controls in the bounded inspector. */
export function controlsMarkup(
  m: Measurements, fields: readonly (keyof Measurements)[],
  options: readonly GarmentOption[] = [], values: GarmentOptions = {}
): string {
  const measurementFields = fields
    .map((id) => FIELDS.find((f) => f.id === id))
    .filter((f): f is Field => f !== undefined);
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
  const measurementGroups = new Map<string, Field[]>();
  measurementFields.forEach((f) => {
    const group = f.id === "ease" ? "Fit allowance"
      : roleTag(f.id)?.startsWith("body") ? "Body measurements" : "Lengths & shape";
    measurementGroups.set(group, [...(measurementGroups.get(group) ?? []), f]);
  });
  const pages = [
    ...[...measurementGroups].map(([label, groupFields]) => ({
      label, option: false, stage: label === "Fit allowance" ? "fit" : "measure",
      body: groupFields.map((f) => field(f.id, f.label, m[f.id], f.min, f.max, f.step)).join("") +
        (label === "Fit allowance" ? finished : ""),
    })),
    ...[...groups].map(([label, groupOptions]) => ({
      label, option: true, stage: "fit", body: groupOptions.map(optionRows).join(""),
    })),
  ];
  const selector = pages.map((page, index) => `<option value="${index}">${index + 1} / ${pages.length} · ${page.label}</option>`).join("");
  const pageMarkup = pages.map((page, index) =>
    `<fieldset data-control-page="${index}" data-control-stage="${page.stage}" data-control-label="${page.label}"${page.option ? ` data-option-group="${page.label}"` : ""}${index > 0 ? " hidden" : ""}>` +
    `<legend>${page.label}</legend>${page.body}</fieldset>`).join("");
  return `<section id="controls-panel" role="region" aria-labelledby="measurements-title">` +
    `${panelTitle("Measurements & construction (cm)", "measurements-title")}` +
    `<div id="pattern-measurement-navigation" hidden></div>` +
    `<nav class="control-pages" aria-label="Measurement groups">` +
    `<button type="button" data-control-page-step="-1" aria-label="Previous measurement group" disabled>←</button>` +
    `<select id="control-page-select" aria-label="Measurement group">${selector}</select>` +
    `<button type="button" data-control-page-step="1" aria-label="Next measurement group"${pages.length < 2 ? " disabled" : ""}>→</button>` +
    `</nav>${pageMarkup}</section>`;
}

const DOT: Record<Note["level"], string> = { ok: OK, info: T.label, warn: T.lineActive };

/** The guidance panel: a top-line verdict, then one line per note. Each line leads
 *  with a severity ICON (not colour alone) so the signal survives colour-blindness
 *  and greyscale; the verdict folds every warning into a single read. */
export function guidanceMarkup(notes: readonly Note[], ignored: ReadonlySet<string> = new Set()): string {
  const warnCount = notes.filter((n) => n.level === "warn").length;
  const clean = warnCount === 0;
  const verdictText = clean
    ? `${SEVERITY_ICON.ok} Digital checks pass`
    : `${SEVERITY_ICON.warn} ${warnCount} to review`;
  const verdict = `<div style="font-size:13px;font-weight:600;margin-bottom:12px;` +
    `color:${clean ? OK : T.lineActive}">${verdictText}</div>`;
  const rows = notes.map((n, index) => {
    const fieldName = n.field;
    const isIgnored = fieldName !== undefined && ignored.has(fieldName);
    const fieldLabel = fieldName?.startsWith("option-")
      ? fieldName.slice("option-".length).replace(/([A-Z])/g, " $1").toLowerCase()
      : fieldName ? FIELDS.find((f) => f.id === fieldName)?.label ?? fieldName : "";
    const controlId = fieldName === "stretchFabric" ? "stretch-select" : `input-${fieldName}`;
    const action = fieldName
      ? isIgnored
        ? `<button type="button" data-restore-guidance="${fieldName}" ` +
          `style="flex:0 0 auto;padding:3px 6px;font-size:11px;cursor:pointer;background:${T.background};` +
          `color:${T.line};border:1px solid ${BORDER};border-radius:4px">Show again</button>`
        : `<button type="button" data-guidance-focus="${fieldName}" aria-controls="${controlId}" ` +
          `style="flex:0 0 auto;padding:3px 6px;font-size:11px;cursor:pointer;background:${T.background};` +
          `color:${T.line};border:1px solid ${BORDER};border-radius:4px">Review ${fieldLabel}</button>` +
          `<button type="button" data-ignore-guidance="${fieldName}" aria-label="Set aside ${fieldLabel} guidance" ` +
          `style="flex:0 0 auto;padding:3px 6px;font-size:11px;cursor:pointer;background:${T.background};` +
          `color:${T.label};border:1px solid ${BORDER};border-radius:4px">Set aside</button>`
      : "";
    const ignoredState = isIgnored ? `<span class="guidance-ignored-state">Set aside for this draft</span>` : "";
    return `<div data-guidance-row="${index}"${fieldName ? ` data-guidance-field="${fieldName}"` : ""}${isIgnored ? " data-guidance-ignored" : ""} ` +
      `style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;font-size:12.5px;line-height:1.4">` +
      `<span style="flex:0 0 14px;color:${DOT[n.level]};font-weight:700" aria-hidden="true">` +
      `${SEVERITY_ICON[n.level]}</span><span style="flex:1;color:${T.line}">${n.text}${ignoredState}</span>${action}</div>`;
  }).join("");
  return panel("Guidance", verdict + rows);
}

/** Compact palette plus an on-demand screen appearance editor. */
export function fabricSwatchesMarkup(current: string, appearance: Appearance = DEFAULT_APPEARANCE): string {
  const color = normalizeHex(current) ?? FABRICS[0].color;
  const hsl = hexToHsl(color)!;
  const angle = (hsl.h - 90) * Math.PI / 180;
  const wheelX = 50 + Math.cos(angle) * hsl.s * 42;
  const wheelY = 50 + Math.sin(angle) * hsl.s * 42;
  const sw = FABRICS.map((f) =>
    `<span data-swatch="${f.color}" style="display:inline-flex;flex-direction:column;align-items:center;gap:3px">` +
    `<button data-fabric="${f.color}" title="${f.name}" aria-label="Color ${f.name}" aria-pressed="${f.color === color}" ` +
    `style="width:22px;height:22px;border-radius:6px;cursor:pointer;background:${f.color};` +
    `border:1px solid ${BORDER};outline:${f.color === color ? `2px solid ${T.lineActive}` : "none"};` +
    `outline-offset:1px"></button>` +
    `<span data-fabric-name="${f.color}" style="font-size:10px;color:${T.label};white-space:nowrap">${f.name}</span></span>`
  ).join("");
  const textures = APPEARANCE_TEXTURES.map((option) =>
    `<button type="button" class="appearance-texture-card" data-texture="${option.id}" ` +
    `aria-pressed="${option.id === appearance.texture}" aria-label="Choose ${option.label} texture">` +
    `<span>${option.label}</span><small>${option.detail}</small></button>`).join("");
  return `<section id="swatch-host" role="group" aria-labelledby="color-title" class="appearance-host">` +
    `<div class="appearance-summary">` +
    `<span id="color-title" class="appearance-label">Color</span>` +
    `<span class="appearance-current-chip" role="img" style="background:${color}" aria-label="Current color ${color}"></span>` +
    `<span id="appearance-readout" class="appearance-readout">${color}</span>` +
    `<button id="appearance-toggle" type="button" class="appearance-toggle" aria-expanded="false" aria-controls="appearance-editor">Adjust appearance</button>` +
    `</div><div class="appearance-palette">${sw}</div>` +
    `<div id="appearance-editor" class="appearance-editor" hidden>` +
    `<div class="appearance-editor-heading"><strong>Appearance editor</strong><span>Screen cue only</span></div>` +
    `<div class="appearance-color-grid">` +
    `<div id="appearance-wheel" class="appearance-wheel" role="slider" tabindex="0" aria-label="Choose hue and saturation" ` +
    `aria-valuemin="0" aria-valuemax="360" aria-valuenow="${Math.round(hsl.h)}" aria-valuetext="Hue ${Math.round(hsl.h)}, saturation ${Math.round(hsl.s * 100)} percent" ` +
    `style="--wheel-hue:${hsl.h}deg"><span data-wheel-knob class="appearance-wheel-knob" style="left:${wheelX}%;top:${wheelY}%"></span></div>` +
    `<div class="appearance-color-values">` +
    `<label for="appearance-hex">Hex<input id="appearance-hex" type="text" value="${color}" inputmode="text" autocomplete="off" spellcheck="false" maxlength="7" pattern="#[0-9A-Fa-f]{6}" aria-describedby="appearance-hex-status"></label>` +
    `<label for="appearance-color-native">Native color<input id="appearance-color-native" type="color" value="${color}" aria-label="Exact color picker"></label>` +
    `<label for="appearance-lightness">Lightness<output id="appearance-lightness-output">${Math.round(hsl.l * 100)}%</output><input id="appearance-lightness" type="range" min="0" max="100" step="1" value="${Math.round(hsl.l * 100)}" aria-label="Lightness"></label>` +
    `<span id="appearance-hex-status" class="appearance-input-status" role="status"></span>` +
    `</div></div>` +
    `<div class="appearance-choice-heading">Texture</div><div class="appearance-texture-cards" role="group" aria-label="Screen texture">${textures}</div>` +
    `<label class="appearance-shine" for="appearance-shine">Shine <output id="appearance-shine-output">${appearance.shine}%</output><input id="appearance-shine" type="range" min="0" max="100" step="1" value="${appearance.shine}" aria-label="Screen shine"></label>` +
    `<p class="appearance-note">Color changes the assembled screen preview; material/stretch still controls drafting advice.</p>` +
    `</div></section>`;
}

// "Length +8 cm" — a single change, using the measurement's friendly label.
function deltaText(d: Delta): string {
  const label = FIELDS.find((f) => f.id === d.id)!.label;
  return `${label} ${d.change > 0 ? "+" : ""}${d.change} cm`;
}

const GARMENT_UI: Readonly<Record<string, { region: string; summary: string; detail: string }>> = {
  tee: { region: "Upper body", summary: "Everyday knit top", detail: "Short sleeve · crew neck" },
  fitted: { region: "Upper body", summary: "Shaped knit top", detail: "Darted fit · short sleeve" },
  tank: { region: "Upper body", summary: "Sleeveless knit top", detail: "Strap and neckline controls" },
  polo: { region: "Upper body", summary: "Collared knit top", detail: "Placket, collar, vents & hem controls" },
  "woven-shirt": { region: "Upper body", summary: "Stable woven shirt", detail: "Yoke, placket and pocket" },
  skirt: { region: "Lower body", summary: "Simple woven skirt", detail: "Waist and hem controls" },
  trouser: { region: "Lower body", summary: "Straight-leg trouser", detail: "Rise, leg and pocket controls" },
};

function styleDescription(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("fitted")) return "Close, shaped ease";
  if (lower.includes("oversized")) return "Maximum wearing room";
  if (lower.includes("relaxed")) return "More room to move";
  if (lower.includes("classic")) return "Balanced everyday ease";
  if (lower.includes("crop")) return "Shorter finished length";
  if (lower.includes("longline") || lower.includes("long ")) return "Longer finished length";
  if (lower.includes("mini")) return "Above-knee length";
  if (lower.includes("knee")) return "Knee length";
  if (lower.includes("midi")) return "Mid-calf length";
  if (lower.includes("maxi")) return "Full length";
  if (lower.includes("muscle")) return "Sleeveless shape";
  return "A declared starting direction";
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
  const select = `<select id="style-target" class="studio-visually-hidden" aria-label="Target fit">${options}</select>`;

  const label = `<label for="style-target" style="font-size:11px;color:${T.label};text-transform:uppercase;` +
    `letter-spacing:0.04em;margin-bottom:7px">Target fit</label>`;
  const cards = `<div class="fit-intent-cards" role="group" aria-label="Fit intent">` +
    allNames.map((name) => `<button type="button" class="fit-intent-card" data-style-target="${name}" ` +
      `aria-pressed="${name === targetName}" aria-label="Choose ${name}">` +
      `<span class="fit-intent-card-name">${name}</span>` +
      `<span class="fit-intent-card-description">${styleDescription(name)}</span></button>`).join("") +
    `</div>`;

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
  return panel("Style", label + select + cards + body);
}

/** Surface artwork panel data. Placements, problems, and preview are precomputed
 * by the app; this module only translates them into markup. */
export interface SurfacePanelData {
  readonly style: string;
  readonly placements: readonly ArtworkPlacement[];
  /** Exact structural roles in the current garment draft. */
  readonly pieceRoles?: readonly string[];
  /** Placement index → actionable placementError text. */
  readonly errors: ReadonlyMap<number, string>;
  /** Precomputed true-scale artwork-space preview SVG (empty when no artwork). */
  readonly preview: string;
}

const SURFACE_NUMERIC: readonly {
  readonly id: "widthCm" | "heightCm" | "dx" | "dy" | "scale" | "rotationDeg" | "zOrder" | "sourcePxWidth" | "sourcePxHeight";
  readonly label: string;
  readonly step: number;
  readonly unit: string;
}[] = [
  { id: "widthCm", label: "Width", step: 0.5, unit: "cm" },
  { id: "heightCm", label: "Height", step: 0.5, unit: "cm" },
  { id: "dx", label: "Shift X", step: 0.5, unit: "cm" },
  { id: "dy", label: "Shift Y", step: 0.5, unit: "cm" },
  { id: "scale", label: "Scale", step: 0.1, unit: "×" },
  { id: "rotationDeg", label: "Rotation", step: 1, unit: "°" },
  { id: "zOrder", label: "Stack order", step: 1, unit: "" },
  { id: "sourcePxWidth", label: "Source width", step: 1, unit: "px" },
  { id: "sourcePxHeight", label: "Source height", step: 1, unit: "px" },
];

const surfaceRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>) : null;

/** Row values stay display-safe for hostile saves: non-numbers become NaN,
 * which the numeric control renders as an empty, explicitly invalid value. */
const surfaceNumber = (p: ArtworkPlacement, id: (typeof SURFACE_NUMERIC)[number]["id"]): number => {
  const source = id === "widthCm" ? p.widthCm
    : id === "heightCm" ? p.heightCm
    : id === "zOrder" ? p.zOrder
    : id === "sourcePxWidth" ? p.sourcePxWidth
    : id === "sourcePxHeight" ? p.sourcePxHeight
    : surfaceRecord(p.transform)?.[id];
  return typeof source === "number" ? source : NaN;
};

const surfaceKindOptions = (kind: string): string =>
  (["print", "patch", "color-block"] as const)
    .map((option) => `<option value="${option}"${option === kind ? " selected" : ""}>${option}</option>`)
    .join("");

const SURFACE_SOURCE_HELP = "Optional provenance: creator, citation/source URL, local filename, or asset ID. Text only—no file is loaded and URLs are never fetched.";

const surfaceRoleOptions = (roles: readonly string[]): string =>
  `<datalist id="surface-piece-role-options">${roles.map((role) => `<option value="${escapeAttr(role)}"></option>`).join("")}</datalist>`;

const surfaceRoleHelp = (id: string, roles: readonly string[]): string =>
  `<p class="surface-help" id="${id}">${roles.length > 0
    ? "Choose an exact piece role from this garment's current draft."
    : "Role suggestions are unavailable for this option set; enter an exact role from the Pattern view."}</p>`;

const surfaceNumericFields = (
  p: ArtworkPlacement,
  index: number,
  ids: readonly (typeof SURFACE_NUMERIC)[number]["id"][],
): string => SURFACE_NUMERIC.filter((field) => ids.includes(field.id)).map((field) => {
  const controlId = `surface-${index}-${field.id}`;
  const describedBy = field.id === "widthCm" || field.id === "heightCm"
    ? `error-surface-${index} surface-size-help-${index}`
    : field.id === "dx" || field.id === "dy" || field.id === "scale" || field.id === "rotationDeg" || field.id === "zOrder"
      ? `error-surface-${index} surface-position-help-${index}`
      : `error-surface-${index} surface-source-pixels-help-${index}`;
  return `<div class="surface-field"><label for="input-${controlId}">${field.label}${field.unit ? ` (${field.unit})` : ""}</label>` +
    numericControlMarkup(controlId, `input-${controlId}`, `${field.label} artwork ${index + 1}`,
      surfaceNumber(p, field.id), undefined, undefined, field.step,
      `data-surface-index="${index}" data-surface-field="${field.id}" data-guidance-control="surface-${index}-${field.id}" aria-label="${field.label} artwork ${index + 1}" aria-describedby="${describedBy}"`,
      field.unit) + `</div>`;
}).join("");

const surfaceRow = (
  p: ArtworkPlacement,
  index: number,
  error: string | undefined,
  roles: readonly string[],
): string => {
  const safeId = escapeAttr(typeof p.id === "string" ? p.id : "");
  const rowLabel = `artwork ${index + 1}`;
  const sourceHelpId = `surface-source-help-${index}`;
  return `<article class="surface-placement-card" data-surface-row="${index}" aria-labelledby="surface-title-${index}">` +
    `<header class="surface-placement-header"><h3 id="surface-title-${index}">#${index + 1} · ${safeId || "Unnamed placement"}</h3>` +
    `<button type="button" data-surface-remove-index="${index}" aria-label="Remove ${rowLabel}${safeId ? ` ${safeId}` : ""}">Remove</button></header>` +
    `<fieldset class="surface-fieldset"><legend>Identity and target</legend>` +
    `<div class="surface-field"><label for="surface-id-${index}">Placement name</label>` +
    `<input id="surface-id-${index}" type="text" data-surface-index="${index}" data-surface-field="id" data-guidance-control="surface-${index}-id" value="${safeId}" aria-label="Placement name ${rowLabel}" aria-describedby="error-surface-${index}"/></div>` +
    `<div class="surface-field"><label for="surface-kind-${index}">Artwork type</label>` +
    `<select id="surface-kind-${index}" data-surface-index="${index}" data-surface-field="kind" data-guidance-control="surface-${index}-kind" aria-label="Artwork type ${rowLabel}" aria-describedby="error-surface-${index}">${surfaceKindOptions(typeof p.kind === "string" ? p.kind : "")}</select></div>` +
    `<div class="surface-field"><label for="surface-role-${index}">Pattern piece role</label>` +
    `<input id="surface-role-${index}" type="text" list="surface-piece-role-options" data-surface-index="${index}" data-surface-field="pieceRole" data-guidance-control="surface-${index}-pieceRole" value="${escapeAttr(typeof p.pieceRole === "string" ? p.pieceRole : "")}" aria-label="Pattern piece role ${rowLabel}" aria-describedby="error-surface-${index} surface-role-help-${index}"/>` +
    `${surfaceRoleHelp(`surface-role-help-${index}`, roles)}</div>` +
    `<div class="surface-field"><label for="surface-source-${index}">Source / asset reference (optional)</label>` +
    `<input id="surface-source-${index}" type="text" data-surface-index="${index}" data-surface-field="sourceName" data-guidance-control="surface-${index}-sourceName" value="${escapeAttr(typeof p.sourceName === "string" ? p.sourceName : "")}" aria-label="Source or asset reference ${rowLabel}" aria-describedby="error-surface-${index} ${sourceHelpId}"/>` +
    `<p class="surface-help" id="${sourceHelpId}">${SURFACE_SOURCE_HELP}</p></div></fieldset>` +
    `<fieldset class="surface-fieldset"><legend>Placement size</legend>` +
    `<p class="surface-help" id="surface-size-help-${index}">Width and height are the placement rectangle in centimetres before scale.</p>` +
    `<div class="surface-numeric-stack">${surfaceNumericFields(p, index, ["widthCm", "heightCm"])}</div></fieldset>` +
    `<fieldset class="surface-fieldset"><legend>Position and appearance</legend>` +
    `<p class="surface-help" id="surface-position-help-${index}">X/Y offsets start at the selected piece's cut-box centre. Scale multiplies both dimensions evenly; rotation is in degrees; larger stack-order numbers render above smaller ones.</p>` +
    `<div class="surface-numeric-stack">${surfaceNumericFields(p, index, ["dx", "dy", "scale", "rotationDeg", "zOrder"])}</div></fieldset>` +
    `<fieldset class="surface-fieldset"><legend>Source image size (optional)</legend>` +
    `<p class="surface-help" id="surface-source-pixels-help-${index}">Enter both original image dimensions in pixels to estimate print resolution. Leave blank when unknown; these values do not load an image.</p>` +
    `<div class="surface-numeric-stack">${surfaceNumericFields(p, index, ["sourcePxWidth", "sourcePxHeight"])}</div></fieldset>` +
    `<p id="error-surface-${index}" class="surface-error" role="status" aria-live="polite">${error ?? ""}</p></article>`;
};

/** Artwork sets for one style: add/edit/remove with warn-only validation plus a
 * true-scale artwork-space preview. Positions on pieces arrive with print output. */
export function surfaceMarkup(data: SurfacePanelData): string {
  const roles = data.pieceRoles ?? [];
  const rows = data.placements.map((p, index) => surfaceRow(p, index, data.errors.get(index), roles)).join("");
  const list = rows === ""
    ? `<p class="surface-empty">No artwork placements on ${escapeAttr(data.style)} yet. Add one below.</p>`
    : `<div class="surface-placement-list">${rows}</div>`;
  const preview = `<div data-surface-preview-shell${data.preview === "" ? " hidden" : ""} class="surface-preview-shell"><h3>Placement preview · true scale</h3>` +
    `<div id="surface-preview">${data.preview}</div>` +
    `<p class="surface-help">This is the placement rectangle, not the artwork image or a garment rendering. X/Y offsets are measured from the selected piece's cut-box centre.</p></div>`;
  const newDimension = (id: "width" | "height", label: string, value: number): string =>
    `<div class="surface-field"><label for="surface-new-${id}">Placement ${label.toLowerCase()} (cm)</label>` +
    `<input id="surface-new-${id}" type="number" min="0" step="0.5" value="${value}" inputmode="decimal" aria-describedby="surface-new-size-help surface-form-error" aria-label="New placement ${label.toLowerCase()} in centimetres"/></div>`;
  const form = `<section class="surface-add-form" aria-labelledby="surface-add-title">` +
    `<h3 id="surface-add-title">Add artwork placement</h3>` +
    `<p class="surface-help">Creates a local placement area for this style. It does not import or display an image.</p>` +
    `<fieldset class="surface-fieldset"><legend>Identity and target</legend>` +
    `<div class="surface-field"><label for="surface-new-id">Placement name</label><input id="surface-new-id" type="text" aria-label="New placement name" aria-describedby="surface-form-error"/></div>` +
    `<div class="surface-field"><label for="surface-new-kind">Artwork type</label><select id="surface-new-kind" aria-label="New artwork type" aria-describedby="surface-form-error">${surfaceKindOptions("print")}</select></div>` +
    `<div class="surface-field"><label for="surface-new-role">Pattern piece role</label><input id="surface-new-role" type="text" list="surface-piece-role-options" placeholder="Choose a role from the list" aria-label="New placement pattern piece role" aria-describedby="surface-new-role-help surface-form-error"/>${surfaceRoleHelp("surface-new-role-help", roles)}</div>` +
    `<div class="surface-field"><label for="surface-new-source">Source / asset reference (optional)</label><input id="surface-new-source" type="text" aria-label="New placement source or asset reference" aria-describedby="surface-new-source-help surface-form-error"/><p class="surface-help" id="surface-new-source-help">${SURFACE_SOURCE_HELP}</p></div></fieldset>` +
    `<fieldset class="surface-fieldset"><legend>Placement size</legend>` +
    `<p class="surface-help" id="surface-new-size-help">Width and height are the placement rectangle in centimetres before scale.</p>` +
    `<div class="surface-numeric-stack">${newDimension("width", "Width", 20)}${newDimension("height", "Height", 25)}</div></fieldset>` +
    `<button id="surface-add" type="button">Add placement</button>` +
    `<p id="surface-form-error" class="surface-error" role="status" aria-live="polite"></p></section>`;
  return panel("Surface", `<div class="surface-panel-content">${surfaceRoleOptions(roles)}<p class="surface-intro">Record where a print, patch, or colour block belongs. Artwork files are not loaded in this Phase 6 form.</p>${list}${form}${preview}</div>`);
}

interface ExportFormat {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

const PER_SIZE_EXPORTS: readonly ExportFormat[] = [
  { id: "export-svg", label: "SVG", description: "Vector cutting outline · selected size" },
  { id: "export-dxf", label: "DXF", description: "CAD exchange file · selected size" },
  { id: "export-pdf", label: "PDF", description: "Tiled paper print · selected size" },
  { id: "export-a0", label: "A0", description: "Full-sheet print · selected size" },
];

const WHOLE_RUN_EXPORTS: readonly ExportFormat[] = [
  { id: "export-techpack", label: "Tech Pack", description: "Specs and construction reference · all sizes" },
  { id: "export-projector", label: "Projector", description: "Layered projection SVG · all sizes" },
];

const SURFACE_EXPORTS: readonly ExportFormat[] = [
  { id: "export-surface-sheet", label: "Print sheet", description: "Artwork print sheet, true scale · current style" },
];

const exportFormatMarkup = (format: ExportFormat): string =>
  `<div class="export-format" data-export-format="${format.id}">` +
  `<button id="${format.id}" type="button" aria-describedby="${format.id}-description" ` +
  `title="${format.description}" class="export-format-button">${format.label}</button>` +
  `<span id="${format.id}-description" class="export-format-description">${format.description}</span></div>`;

/** Download buttons for the export files, a size picker, plus Save/Load pattern state.
 *  The size picker drives every selected-size export and the Single size nesting
 *  scope; whole-run documents deliberately remain independent of that choice. */
export function exportButtonsMarkup(sizes: readonly SizeStep[]): string {
  const options = sizes
    .map((s) => `<option value="${s.step}" ${s.step === 0 ? "selected" : ""}>${s.label}</option>`)
    .join("");
  const sizePicker =
    `<label class="export-size-picker">` +
    `Selected size <select id="export-size" aria-label="Selected size for per-size exports" style="padding:4px 8px;font-size:12px;background:${T.background};` +
    `color:${T.line};border:1px solid ${BORDER};border-radius:5px">${options}</select></label>`;
  const scope = (name: string, title: string, consequence: string, formats: readonly ExportFormat[]): string =>
    `<div data-export-scope="${name}" class="export-scope">` +
    `<div class="export-scope-heading"><strong>${title}</strong><span>${consequence}</span></div>` +
    `<div class="export-format-grid">${formats.map(exportFormatMarkup).join("")}</div></div>`;
  return `<div id="export-host" style="display:flex;flex-direction:column;gap:2px;align-items:stretch;flex-wrap:wrap;margin:4px 0">` +
    `<div style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em">Export</div>` +
    `<div class="export-size-context">${sizePicker}<span>Drives the four selected-size files and Single size nesting.</span></div>` +
    scope("selected-size", "Selected size files", "One size for cutting or CAD", PER_SIZE_EXPORTS) +
    scope("whole-run", "Whole graded run", "All graded sizes; ignores Selected size", WHOLE_RUN_EXPORTS) +
    scope("current-style", "Current style artwork", "One style's artwork; ignores Selected size", SURFACE_EXPORTS) +
    `</div>`;
}

/** Material cards plus a native selector — drives ease and compatibility guidance only. */
export function fabricStretchMarkup(current: string): string {
  const options = STRETCH_FABRICS
    .map((f) => `<option ${f.name === current ? "selected" : ""}>${f.name}</option>`)
    .join("");
  const cards = STRETCH_FABRICS.map((f) => `<button type="button" class="material-card" ` +
    `data-material-option="${f.name}" aria-pressed="${f.name === current}" aria-label="Choose ${f.name}">` +
    `<span class="material-card-name">${f.name}</span>` +
    `<span class="material-card-detail">${f.family === "knit" ? `${f.stretchPercent}% stretch` : "Stable woven"}</span></button>`).join("");
  return `<div id="stretch-host" role="group" aria-label="Material and stretch" style="display:flex;flex-direction:column;gap:7px;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em">Material / stretch</span>` +
    `<select id="stretch-select" class="studio-visually-hidden" data-guidance-control="stretchFabric" aria-label="Material and stretch">${options}</select>` +
    `<div class="material-cards" role="group" aria-label="Material choices">${cards}</div>` +
    `<span style="font-size:11px;color:${T.label};line-height:1.35">Sets ease advice and tech-pack material; garment color is separate.</span></div>`;
}

/** Pattern/body stay primary; the remaining canvas views use native disclosure. */
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
    `<details id="advanced-views"><summary id="advanced-view-label">More views</summary>` +
    `<div class="advanced-view-menu">` +
    `${btn("view-nest", "Size run", active === "nest")}` +
    `${btn("view-spec", "Spec", active === "spec")}` +
    `${btn("view-fabric", "Nesting", active === "fabric")}` +
    `${btn("view-check", "Check", active === "check")}` +
    `${btn("view-edit", "Edit", active === "edit")}</div></details></div>`;
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
  assembled: "Assembled preview · schematic, not a fit simulation",
};

const PATTERN_MARK_KIND_LABELS: Record<PatternMark["kind"], string> = {
  cutLine: "Cut line",
  foldLine: "Fold line",
  placementLine: "Placement line",
  button: "Button mark",
  buttonhole: "Buttonhole mark",
  placementPoint: "Placement point",
};

interface PatternKeyEntry {
  readonly role: PatternAnnotationRole;
  readonly kind: string;
  readonly label: string;
  count: number;
}

/** Keep piece names and construction text out of the scaled pattern geometry. */
export function patternAnnotationKeyMarkup(
  pieces: readonly Piece[],
  selectedPieceName: string | null = null,
  feedback = "",
): string {
  const pieceItems = pieces.map((piece, index) => {
    const entries = new Map<string, PatternKeyEntry>();
    const addEntry = (entry: PatternKeyEntry): void => {
      const key = `${entry.role}\u0000${entry.kind}\u0000${entry.label}`;
      const existing = entries.get(key);
      if (existing) existing.count += 1;
      else entries.set(key, { ...entry });
    };
    if (piece.onFold) {
      addEntry({ role: "instruction", kind: "Cutting", label: "Cut on fold", count: 1 });
    }
    for (const mark of piece.marks ?? []) {
      const label = mark.label?.trim();
      if (!label) continue;
      addEntry({
        role: mark.labelRole ?? "label",
        kind: PATTERN_MARK_KIND_LABELS[mark.kind],
        label,
        count: 1,
      });
    }
    const annotations = [...entries.values()].map((entry) => {
      const role = entry.role === "instruction" ? "Instruction" : "Label";
      const roleClass = entry.role === "instruction" ? "instruction" : "label";
      const count = entry.count > 1 ? ` <span class="pattern-annotation-count">(${entry.count} marks)</span>` : "";
      return `<li class="pattern-annotation-row pattern-annotation-row--${roleClass}">` +
        `<span class="pattern-annotation-role">${role}</span>` +
        `<span class="pattern-annotation-kind">${entry.kind}</span>` +
        `<span class="pattern-annotation-text">${escapeAttr(entry.label)}${count}</span></li>`;
    }).join("");
    const noAnnotations = annotations ? "" :
      `<li class="pattern-annotation-empty">No written construction marks.</li>`;
    const name = escapeAttr(piece.name.toUpperCase());
    const selected = piece.name === selectedPieceName;
    return `<li class="pattern-piece-key-item"><h4 class="pattern-piece-key-heading">` +
      `<button type="button" class="pattern-piece-key-select" data-pattern-piece-index="${index}" ` +
      `data-pattern-piece-name="${escapeAttr(piece.name)}" aria-pressed="${selected}" ` +
      `aria-label="Open related measurements for ${name} pattern block">` +
      `<span class="pattern-piece-key-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>` +
      `<span class="pattern-piece-key-name">${name}</span>` +
      `<span class="pattern-piece-key-action" aria-hidden="true">Measurements ↗</span></button></h4>` +
      `<ul class="pattern-piece-key-annotations">${annotations}${noAnnotations}</ul></li>`;
  }).join("");
  const feedbackMarkup = `<p id="pattern-measurement-feedback" class="pattern-measurement-feedback" ` +
    `role="status" aria-live="polite"${feedback === "" ? " hidden" : ""}>${escapeAttr(feedback)}</p>`;
  return `<aside id="pattern-annotation-key" aria-labelledby="pattern-annotation-title" ` +
    `style="--pattern-heading-color:${T.patternHeading};--pattern-label-color:${T.patternLabel};` +
    `--pattern-instruction-color:${T.patternInstruction};--pattern-key-background:${T.background}">` +
    `<header class="pattern-annotation-key-header"><h3 id="pattern-annotation-title">Pattern key</h3>` +
    `<p>Activate a piece or its name to open related measurements. Names, labels, and instructions follow piece order; text stays outside the cut shapes.</p></header>` +
    feedbackMarkup +
    `<ol class="pattern-piece-key">${pieceItems}</ol></aside>`;
}

/** A bounded inspection frame for every main canvas. SVGs are deliberately
 * labelled and live inside a scrollable viewport so a narrow/portrait drawing
 * cannot make the whole page unusably tall or disappear at intrinsic size. */
export function inspectionMarkup(content: string, view: string): string {
  const title = INSPECTION_TITLES[view] ?? "Canvas inspection";
  const patternClass = view === "pattern" ? " pattern-inspection" : "";
  return `<section id="canvas-inspection" class="inspection-frame${patternClass}" data-inspection-view="${view}" aria-labelledby="inspection-title">` +
    `<div id="inspection-toolbar" role="group" aria-label="${title} controls">` +
    `<h2 id="inspection-title">${title}</h2>` +
    `<button type="button" data-inspection-zoom="out" aria-label="Zoom out" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">−</button>` +
    `<button type="button" data-inspection-zoom="fit" aria-label="Fit inspection" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">Fit</button>` +
    `<button type="button" data-inspection-zoom="in" aria-label="Zoom in" style="padding:3px 8px;cursor:pointer;background:${T.background};color:${T.line};border:1px solid ${BORDER};border-radius:5px">+</button>` +
    `<output id="inspection-zoom" aria-live="polite" style="min-width:38px;text-align:right;font-size:11px;color:${T.label}">100%</output>` +
    `</div>` +
    `<div id="inspection-viewport" role="region" aria-label="Scrollable ${title}" tabindex="0">` +
    `<div id="inspection-content">${content}</div></div>` +
    `<div id="spatial-guidance-host" aria-live="polite"></div></section>`;
}

export function garmentToggleMarkup(active: string): string {
  const cards = GARMENTS.map((g) => {
    const ui = GARMENT_UI[g.name];
    return `<button id="garment-${g.name}" class="garment-card" type="button" ` +
      `data-garment-region="${ui.region}" aria-pressed="${g.name === active}" aria-label="Choose ${g.label}">` +
      `<span class="garment-card-title">${g.label}</span>` +
      `<span class="garment-card-summary">${ui.summary}</span>` +
      `<span class="garment-card-detail">${ui.detail}</span></button>`;
  }).join("");
  return `<div id="garment-toggle-host" role="group" aria-label="Garment" class="garment-library">` +
    `<div class="garment-library-heading"><span>Choose a starting garment</span><span>7 drafting blocks</span></div>` +
    `<div class="garment-card-grid">${cards}</div></div>`;
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
    `Single size uses <strong id="nest-selected-size">M</strong>; Graded marker includes every graded size.</span></div>`;
}

/** Nesting-intelligence planning controls and readouts. Rendered once per
 * mount inside #nest-intel-host (fabric view only); draw() syncs values,
 * errors, and readouts imperatively so typing never loses focus. */
export function nestIntelMarkup(bufferRaw: string, availableRaw: string, napAware: boolean): string {  const bufferValue = bufferRaw.trim() === "" ? NaN : Number(bufferRaw);
  const availableValue = availableRaw.trim() === "" ? NaN : Number(availableRaw);
  const bufferInput = numericControlMarkup(
    "nest-buffer", "nest-buffer", "Cutting buffer", bufferValue, 0, 50, 1,
    `data-guidance-control="nesting-buffer" aria-label="Cutting buffer" aria-describedby="error-nest-buffer"`,
    "%",
  );
  const availableInput = numericControlMarkup(
    "nest-available", "nest-available", "Fabric on hand", availableValue, undefined, undefined, 0.5,
    `data-guidance-control="nesting-available" aria-label="Fabric on hand" aria-describedby="error-nest-available"`,
    "cm",
  );
  return `<div id="nest-intel-host" role="group" aria-label="Nesting intelligence" style="display:none;gap:8px;align-items:flex-start;flex-wrap:wrap;margin:4px 0">` +
    `<span style="font-size:11px;color:${T.label};text-transform:uppercase;letter-spacing:0.04em;margin-right:4px">Planning</span>` +
    `<div><div style="font-size:11.5px;color:${T.label};margin-bottom:2px">Cutting buffer</div>${bufferInput}` +
    `<p id="error-nest-buffer" role="status" style="font-size:12px;color:${T.lineActive};margin:4px 0 0;min-height:16px"></p></div>` +
    `<div><div style="font-size:11.5px;color:${T.label};margin-bottom:2px">Fabric on hand (optional)</div>${availableInput}` +
    `<p id="error-nest-available" role="status" style="font-size:12px;color:${T.label};margin:4px 0 0;min-height:16px"></p></div>` +
    `<label style="font-size:12px;color:${T.line};display:inline-flex;gap:6px;align-items:center">` +
    `<input id="nest-nap" type="checkbox"${napAware ? " checked" : ""} aria-label="Directional print"/>Directional print</label>` +
    `<div id="nest-readout" role="status" aria-label="Nesting estimate" style="font-size:12px;color:${T.line};flex-basis:100%;line-height:1.6">` +
    `<span id="nest-intel-scope"></span><span id="nest-required"></span><span id="nest-planned"></span>` +
    `<span id="nest-waste"></span><span id="nest-available-state"></span><span id="nest-verdict"></span>` +
    `<span id="nest-nap-notice"></span></div></div>`;
}

/** Precomputed Nesting-intelligence readout lines. Pure so every
 * display/null arm is unit-testable; the app only assigns the strings. */
export interface NestIntelReadout {
  readonly scope: string;
  readonly required: string;
  readonly planned: string;
  readonly waste: string;
  readonly available: string;
  readonly verdict: string;
  readonly nap: string;
  readonly bufferError: string;
  readonly availableError: string;
}

export function nestIntelReadout(
  requiredLengthCm: number,
  utilization: number,
  bufferRaw: string,
  availableRaw: string,
  napAware: boolean,
  scopeLabel: string,
): NestIntelReadout {
  const buffer = bufferRaw.trim() === "" ? NaN : Number(bufferRaw);
  const planned = plannedLength(requiredLengthCm, buffer);
  const waste = wastePercent(utilization);
  const verdict = fitResult(availableRaw, planned);
  const bufferProblem = bufferError(buffer);
  const availableProblem = availableLengthError(availableRaw);
  return {
    scope: `${scopeLabel} · `,
    required: `Requires ${requiredLengthCm.toFixed(1)} cm of cloth · `,
    planned: planned === null
      ? "Planned: unavailable — fix the cutting buffer · "
      : `Planned with buffer: ${planned.toFixed(1)} cm · `,
    waste: waste === null
      ? "Waste: unavailable · "
      : `Waste: ${waste.toFixed(1)}% of cloth · `,
    available: availableRaw.trim() === ""
      ? "On hand: not entered · "
      : `On hand: ${availableRaw.trim()} cm · `,
    verdict: verdict.verdict === "fits"
      ? "Fit: fits the fabric on hand."
      : verdict.verdict === "short"
        ? `Fit: short by ${verdict.shortByCm.toFixed(1)} cm.`
        : "Fit: unknown — enter fabric on hand for a fits/short verdict.",
    nap: napNoticeText(napAware),
    bufferError: bufferProblem ?? "",
    availableError: availableProblem ?? "",
  };
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
export function checkMarkup(report: Report, plausible: boolean, ignored: readonly Note[] = []): string {
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
  const dismissed = [...new Map(ignored
    .filter((note) => note.level === "warn" && note.field)
    .map((note) => [note.field!, note])).values()];
  const dismissedMarkup = dismissed.length === 0 ? "" :
    `<aside class="check-advisory" data-ignored-guidance role="status">` +
    `<strong>Advisory set aside for this draft</strong>` +
    dismissed.map((note) => `<div class="check-advisory-row" data-ignored-guidance-field="${note.field}">` +
      `<span>⚠ ${note.text}</span>` +
      `<button type="button" data-restore-guidance="${note.field}">Show guidance again</button></div>`).join("") +
    `</aside>`;
  return `<div style="background:${T.background};border-radius:8px;padding:14px">${banner}${dismissedMarkup}${rows}</div>`;
}

/** The whole app shell: persistent workspace actions, a stable canvas, and a
 * bounded inspector whose controls stay grouped by task. */
export function appShellMarkup(
  m: Measurements,
  fabric: string,
  sizes: readonly SizeStep[],
  fields: readonly (keyof Measurements)[],
  stretchFabric = STRETCH_FABRICS[0].name,
  activeGarment = "tee",
  appearance: Appearance = DEFAULT_APPEARANCE
): string {
  const activeGarmentLabel = GARMENTS.find((g) => g.name === activeGarment)?.label ?? activeGarment;
  return `<main id="infini-shell" aria-labelledby="product-title">` +
    `<header id="product-header"><div><h1 id="product-title">InfiniDrip</h1>` +
    `<span id="current-garment">${activeGarmentLabel}</span>` +
    `<p id="product-subtitle">Parametric garment design workspace</p></div>` +
    `<div id="workspace-actions" role="group" aria-label="Local workspace">` +
    `<span id="persist-status" role="status"></span>` +
    `<button id="undo-pattern" type="button" title="Undo the last design change" aria-label="Undo the last design change" disabled>Undo</button>` +
    `<button id="redo-pattern" type="button" title="Redo the last design change" aria-label="Redo the last design change" disabled>Redo</button>` +
    `<button id="save-pattern" type="button" title="Save this workspace locally on this device">Save</button>` +
    `<button id="load-pattern" type="button" title="Replace this workspace with your last local save">Load</button></div></header>` +
    `<div id="recovery-host"></div>` +
    `<div id="workspace-confirm" hidden role="dialog" aria-modal="true" aria-labelledby="workspace-confirm-title">` +
    `<div class="workspace-confirm-card"><h2 id="workspace-confirm-title">Replace this workspace?</h2>` +
    `<p>Your current unsaved changes will be replaced by the last local save.</p>` +
    `<div class="workspace-confirm-actions"><button id="workspace-confirm-cancel" type="button">Keep editing</button>` +
    `<button id="workspace-confirm-accept" type="button">Load saved workspace</button></div></div></div>` +
    `<div id="journey-area"><div id="journey-host"></div><div id="tutorial-host"></div></div><div id="studio-body">` +
    `<aside id="studio-inspector" aria-label="Design controls">` +
    `${garmentToggleMarkup(activeGarment)}<div id="review-context"></div>` +
    `<details id="readiness-details"><summary>Design readiness</summary><div id="readiness-host"></div></details>` +
    `<div id="style-host"></div>${fabricStretchMarkup(stretchFabric)}${fabricSwatchesMarkup(fabric, appearance)}` +
    `${controlsMarkup(m, fields)}` +
    `<details id="guidance-details"><summary>Guidance & corrections</summary><div id="guidance-host"></div></details>` +
    `${exportButtonsMarkup(sizes)}</aside>` +
    `<div id="infini-workspace"><div id="canvas-tools">${viewToggleMarkup("pattern")}` +
    `<button id="assembled-preview-toggle" type="button" aria-pressed="false" aria-controls="canvas-host">Assembled</button></div>` +
    `${bodyCroquisToggleMarkup("front-back")}<div id="spatial-cue" role="status" hidden>` +
    `<span id="spatial-cue-text"></span><button id="spatial-cue-action" type="button">Show in Assembled</button></div>` +
    `${fabricWidthMarkup(150)}${nestIntelMarkup("10", "", true)}<div id="canvas-host"></div>` +
    `</div></div></main>`;
}
