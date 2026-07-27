// The guided journey — the coached path from a blank start to a finished,
// exportable design. LOCKED wireflow: Start → Measure → Fit → Refine → Output,
// five coached steps; Size run / Nesting / Spec / Check / Edit stay one click
// away but are progressively disclosed, never front-loaded. No badges, points,
// or streaks — a designer audience gets a checklist and a quiet confirmation.
//
// Everything here is pure (markup strings + step maps) except the two thin
// localStorage helpers at the bottom, which follow persist.ts's versioned-JSON
// convention. The journey renders Opus's guidance DATA — the verdict, the
// plausibility gate, the severity icons — it never recomputes any of it.

import { BLUEPRINT as T } from "../render";

const PANEL = "#13233A";
const BORDER = "#1E3450";
const OK = "#2E9B63";

export type JourneyStep = "start" | "measure" | "fit" | "refine" | "output" | "done";

export interface StepInfo {
  readonly id: JourneyStep;
  readonly label: string;
  readonly hint: string; // the coach line shown while the step is active
}

/** The five coached steps, in walking order. "done" is the graduated state. */
export const COACHED_STEPS: readonly StepInfo[] = [
  {
    id: "start",
    label: "1 Start",
    hint: "Pick a garment above — or keep the Tee and press Next.",
  },
  {
    id: "measure",
    label: "2 Measure",
    hint: "Enter body measurements. Hover a row to see it on the body; " +
      "an amber outline means the number looks implausible.",
  },
  {
    id: "fit",
    label: "3 Fit",
    hint: "Choose a target fit and your fabric. The Style panel shows the exact " +
      "gap on every axis; the Guidance panel explains the ease.",
  },
  {
    id: "refine",
    label: "4 Refine",
    hint: "Review the pattern against the verdict below. Check and Edit are one " +
      "click away if something needs attention.",
  },
  {
    id: "output",
    label: "5 Output",
    hint: "Export your cutting files — print-at-home PDF, projector, A0 copyshop, " +
      "DXF, or the tech pack.",
  },
];

export type ViewName = "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit";

/** What each step reveals. Anything not listed stays hidden — that is the
 *  progressive disclosure the wireflow locks in. */
export interface Disclosure {
  readonly controls: boolean; // the measurements panel
  readonly stretch: boolean; // the fabric-stretch selector
  readonly style: boolean; // the target-fit panel
  readonly guidance: boolean;
  readonly swatches: boolean; // fabric colour row
  readonly exports: boolean; // export buttons + size picker + save/load
  readonly views: readonly ViewName[]; // which view-toggle buttons show
}

const ALL_VIEWS: readonly ViewName[] = [
  "pattern", "body", "nest", "spec", "fabric", "check", "edit",
];

export function disclosureFor(step: JourneyStep): Disclosure {
  switch (step) {
    case "start":
      return { controls: false, stretch: false, style: false, guidance: false,
        swatches: false, exports: false, views: [] };
    case "measure":
      return { controls: true, stretch: false, style: false, guidance: true,
        swatches: false, exports: false, views: ["pattern", "body"] };
    case "fit":
      return { controls: true, stretch: true, style: true, guidance: true,
        swatches: true, exports: false, views: ["pattern", "body"] };
    case "refine":
      return { controls: true, stretch: true, style: true, guidance: true,
        swatches: true, exports: false, views: ["pattern", "body", "check", "edit"] };
    default: // output and done both show the whole app
      return { controls: true, stretch: true, style: true, guidance: true,
        swatches: true, exports: true, views: ALL_VIEWS };
  }
}

/** The view a step lands on when entered (null = keep the current view). */
export function stepView(step: JourneyStep): ViewName | null {
  if (step === "measure") return "body";
  if (step === "refine" || step === "output") return "pattern";
  return null;
}

// ── Checklist: how far to a finished, exportable design ──────────────────────

export interface ChecklistItem {
  readonly label: string;
  readonly done: boolean;
  readonly next: string; // the action that finishes it — no dead ends
}

/**
 * The progress checklist. `checksOk` alone can NOT tick the production row —
 * geometry passing while the numbers are implausible must never read done
 * (the same gate the check banner and style ✓ obey).
 */
export function journeyChecklist(
  plausible: boolean,
  fitGaps: number,
  checksOk: boolean,
  exported: boolean
): ChecklistItem[] {
  return [
    {
      label: "Garment picked",
      done: true,
      next: "Switch any time with the Tee / Fitted toggle.",
    },
    {
      label: "Measurements plausible",
      done: plausible,
      next: "Review the amber-outlined fields in Measure.",
    },
    {
      label: "Target fit reached",
      done: fitGaps === 0,
      next: "Close the remaining gaps shown in the Style panel.",
    },
    {
      label: "Production checks pass",
      done: checksOk && plausible,
      next: checksOk && !plausible
        ? "It sews together, but fix the flagged measurements first."
        : "Open the Check view to see what needs attention.",
    },
    {
      label: "Files exported",
      done: exported,
      next: "Download a cutting file from the Output step.",
    },
  ];
}

// ── Markup ────────────────────────────────────────────────────────────────────

const chipStyle = (state: "active" | "done" | "todo"): string => {
  const bg = state === "active" ? T.lineActive : state === "done" ? T.gridStrong : T.background;
  const color = state === "active" ? T.background : state === "done" ? T.line : T.label;
  return `padding:5px 12px;font-size:12px;cursor:pointer;background:${bg};color:${color};` +
    `border:1px solid ${BORDER};border-radius:14px`;
};

/** The journey bar: step chips + the active step's coach line + Back/Next/Skip. */
export function journeyBarMarkup(step: JourneyStep): string {
  const idx = COACHED_STEPS.findIndex((s) => s.id === step);
  const chips = COACHED_STEPS.map((s, i) => {
    const state = step === "done" || i < idx ? "done" : i === idx ? "active" : "todo";
    const tick = state === "done" ? "✓ " : "";
    return `<button id="journey-step-${s.id}" style="${chipStyle(state)}">${tick}${s.label}</button>`;
  }).join("");

  if (step === "done") {
    return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0">` +
      `${chips}<span style="font-size:11.5px;color:${T.label};margin-left:6px">` +
      `Tour complete — every view is unlocked. Click a step to revisit it.</span></div>`;
  }

  const info = COACHED_STEPS[idx];
  const back = idx > 0
    ? `<button id="journey-back" style="${chipStyle("todo")}">← Back</button>`
    : "";
  const next = idx < COACHED_STEPS.length - 1
    ? `<button id="journey-next" style="${chipStyle("active")}">Next →</button>`
    : "";
  return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0">` +
    `${chips}${back}${next}` +
    `<button id="journey-skip" style="padding:5px 10px;font-size:11px;cursor:pointer;` +
    `background:transparent;color:${T.label};border:1px solid ${BORDER};border-radius:5px;` +
    `margin-left:auto">Skip tour — show everything</button></div>` +
    `<div style="font-size:12.5px;color:${T.line};margin:2px 0 6px 2px">${info.hint}</div>`;
}

/** The checklist panel: N of 5 with per-row next actions for anything undone. */
export function checklistMarkup(items: readonly ChecklistItem[]): string {
  const done = items.filter((i) => i.done).length;
  const rows = items.map((i) => {
    const mark = i.done ? "✓" : "○";
    const color = i.done ? OK : T.label;
    const nextLine = i.done ? "" :
      `<div style="font-size:11px;color:${T.label};margin-left:22px">${i.next}</div>`;
    return `<div style="font-size:12.5px;color:${i.done ? T.line : T.label};margin-bottom:6px">` +
      `<span style="color:${color};font-weight:700;margin-right:8px">${mark}</span>` +
      `${i.label}${nextLine}</div>`;
  }).join("");
  return `<div style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;` +
    `padding:12px 14px;margin:4px 0">` +
    `<div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;` +
    `color:${T.label};margin-bottom:8px">${done} of ${items.length} to an exportable design</div>` +
    rows + `</div>`;
}

/** The first-run welcome: coaches the first pattern, never dead-ends. */
export function welcomeMarkup(): string {
  return `<div id="journey-welcome" style="background:${PANEL};border:1px solid ${BORDER};` +
    `border-radius:10px;padding:16px;margin:4px 0">` +
    `<div style="font-size:15px;font-weight:600;color:${T.line};margin-bottom:8px">` +
    `Design a real, cuttable garment in five steps</div>` +
    `<div style="font-size:12.5px;color:${T.label};line-height:1.5;margin-bottom:12px">` +
    `Pick a garment, type your measurements, choose a fit, review the pattern, and ` +
    `export true-scale cutting files. The app checks your numbers as you go and ` +
    `tells you plainly when something looks off.</div>` +
    `<button id="welcome-start" style="padding:7px 14px;font-size:13px;cursor:pointer;` +
    `background:${T.lineActive};color:${T.background};border:none;border-radius:6px;` +
    `margin-right:8px">Start the tour</button>` +
    `<button id="welcome-skip" style="padding:7px 14px;font-size:13px;cursor:pointer;` +
    `background:transparent;color:${T.label};border:1px solid ${BORDER};border-radius:6px">` +
    `Skip — I know my way around</button></div>`;
}

/**
 * The light celebration on reaching a valid export — subtle, dismissible, and
 * HONEST: while any measurement is implausible it must not read green.
 */
export function celebrationMarkup(plausible: boolean): string {
  const text = plausible
    ? "✓ Files exported — your design made it from numbers to cutting files."
    : "Files exported — but the flagged measurements still need review before cutting.";
  const color = plausible ? OK : T.lineActive;
  return `<div id="journey-celebration" style="display:flex;gap:10px;align-items:center;` +
    `background:${PANEL};border:1px solid ${color};border-radius:8px;padding:10px 14px;` +
    `margin:4px 0;font-size:13px;color:${color}">` +
    `<span style="flex:1">${text}</span>` +
    `<button id="celebrate-dismiss" style="padding:3px 10px;font-size:12px;cursor:pointer;` +
    `background:transparent;color:${T.label};border:1px solid ${BORDER};border-radius:5px">` +
    `Dismiss</button></div>`;
}

// ── Persistence (versioned, following persist.ts's convention) ───────────────

export const JOURNEY_VERSION = 1;

export interface JourneyState {
  readonly v: number;
  readonly step: JourneyStep;
  readonly exported: boolean;
}

export const FRESH_JOURNEY: JourneyState = {
  v: JOURNEY_VERSION,
  step: "start",
  exported: false,
};

const JOURNEY_KEY = "patternworks_journey_v1";

const STEP_IDS: readonly JourneyStep[] = [
  "start", "measure", "fit", "refine", "output", "done",
];

/** Persist the journey. Returns false if storage is unavailable. */
export function saveJourney(state: JourneyState): boolean {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Load the journey; a missing or invalid save means a fresh first run. */
export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (raw === null) return FRESH_JOURNEY;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p["v"] !== JOURNEY_VERSION) return FRESH_JOURNEY;
    if (!STEP_IDS.includes(p["step"] as JourneyStep)) return FRESH_JOURNEY;
    return {
      v: JOURNEY_VERSION,
      step: p["step"] as JourneyStep,
      exported: p["exported"] === true,
    };
  } catch {
    return FRESH_JOURNEY;
  }
}
