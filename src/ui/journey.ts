// The five-stage design journey. The stage bar reports actual design
// readiness; familiarity with the interface is persisted separately.

export type JourneyStep = "start" | "measure" | "fit" | "refine" | "output" | "done";

export interface StepInfo {
  readonly id: JourneyStep;
  readonly label: string;
  readonly hint: string;
}

/** The five user-facing stages. "done" remains a legacy persisted step. */
export const COACHED_STEPS: readonly StepInfo[] = [
  {
    id: "start",
    label: "1 Garment",
    hint: "Choose a garment to begin. Your design stays editable as you move through the stages.",
  },
  {
    id: "measure",
    label: "2 Measure",
    hint: "Enter body measurements. The app flags values that need review.",
  },
  {
    id: "fit",
    label: "3 Style",
    hint: "Choose a fit intent and fabric; this changes digital ease guidance, not physical fit.",
  },
  {
    id: "refine",
    label: "4 Check",
    hint: "Review the pattern and digital checks. Fix flagged inputs before exporting.",
  },
  {
    id: "output",
    label: "5 Export",
    hint: "Choose a size, then export files. Digital checks do not replace physical fit validation.",
  },
];

export type ViewName = "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit";

/** The controls and views relevant to one stage. */
export interface Disclosure {
  readonly controls: boolean;
  readonly stretch: boolean;
  readonly style: boolean;
  readonly guidance: boolean;
  readonly swatches: boolean;
  readonly exports: boolean;
  readonly views: readonly ViewName[];
}

const ALL_VIEWS: readonly ViewName[] = [
  "pattern", "body", "nest", "spec", "fabric", "check", "edit",
];

export function disclosureFor(step: JourneyStep): Disclosure {
  switch (step) {
    case "start":
      return {
        controls: false,
        stretch: false,
        style: false,
        guidance: false,
        swatches: false,
        exports: false,
        views: ["pattern", "body"],
      };
    case "measure":
      return {
        controls: true,
        stretch: false,
        style: false,
        guidance: true,
        swatches: false,
        exports: false,
        views: ["pattern", "body"],
      };
    case "fit":
      return {
        controls: true,
        stretch: true,
        style: true,
        guidance: true,
        swatches: true,
        exports: false,
        views: ["pattern", "body"],
      };
    case "refine":
      return {
        controls: false,
        stretch: false,
        style: false,
        guidance: true,
        swatches: false,
        exports: false,
        views: ALL_VIEWS,
      };
    case "output":
    case "done":
      return {
        controls: false,
        stretch: false,
        style: false,
        guidance: true,
        swatches: false,
        exports: true,
        views: ALL_VIEWS,
      };
  }
}

export function stepView(step: JourneyStep): ViewName {
  switch (step) {
    case "start":
      return "pattern";
    case "measure":
      return "body";
    case "fit":
      return "body";
    case "refine":
      return "check";
    case "output":
    case "done":
      return "pattern";
  }
}

// ── Readiness and checklist ──────────────────────────────────────────────────

export interface StageReadiness {
  readonly inputsOk: boolean;
  readonly styleReviewed: boolean;
  readonly checksOk: boolean;
  readonly checkReviewed: boolean;
  readonly exported: boolean;
}

export interface ChecklistItem {
  readonly label: string;
  readonly done: boolean;
  readonly next: string;
}

/**
 * Retained for the current app transition. The checklist follows the same
 * readiness contract as the stage bar and does not infer a fit target.
 */
export function journeyChecklist(readiness: StageReadiness): ChecklistItem[] {
  return [
    {
      label: "Garment chosen",
      done: true,
      next: "Choose a garment in the Garment stage.",
    },
    {
      label: "Measurements valid",
      done: readiness.inputsOk,
      next: "Review flagged inputs in the Measure stage.",
    },
    {
      label: "Style reviewed",
      done: readiness.styleReviewed,
      next: "Review the current choices in the Style stage.",
    },
    {
      label: "Digital checks reviewed",
      done: readiness.checksOk && readiness.checkReviewed,
      next: readiness.checksOk
        ? "Review the design in the Check stage."
        : "Fix the flagged design issues in the Check stage.",
    },
    {
      label: "File confirmed",
      done: readiness.exported,
      next: "Confirm a file export in the Export stage.",
    },
  ];
}

// ── Markup ───────────────────────────────────────────────────────────────────

export interface StageBlocker {
  readonly message: string;
  readonly step: JourneyStep;
  readonly field?: string;
}

const STEP_IDS: readonly JourneyStep[] = [
  "start", "measure", "fit", "refine", "output", "done",
];

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const friendlyStage = (step: JourneyStep): string => {
  const displayStep = step === "done" ? "output" : step;
  return COACHED_STEPS.find((candidate) => candidate.id === displayStep)!.label
    .replace(/^\d+\s+/, "");
};

/**
 * Render stage navigation and its current readiness explanation. Completion is
 * deliberately readiness-driven; the current step and the legacy `done` step
 * never make earlier stages look complete by position alone.
 */
export function journeyBarMarkup(
  step: JourneyStep,
  readiness: StageReadiness,
  blocker?: StageBlocker
): string {
  const displayStep = step === "done" ? "output" : step;
  const currentIndex = COACHED_STEPS.findIndex((candidate) => candidate.id === displayStep);
  const completed = journeyChecklist(readiness).map((item) => item.done);
  const exportReady = completed[1] && completed[2] && completed[3];

  const stages = COACHED_STEPS.map((info, index) => {
    const state = index === currentIndex
      ? "active"
      : completed[index] ? "complete" : "pending";
    const current = index === currentIndex ? ' aria-current="step"' : "";
    const disabled = info.id === "output" && !exportReady ? " disabled" : "";
    const status = state === "complete"
      ? " — complete"
      : state === "active" ? " — current stage" : "";
    return `<button class="journey-stage" id="journey-step-${info.id}" type="button"` +
      `${current} aria-label="${escapeHtml(info.label + status)}"` +
      ` data-stage-state="${state}"${disabled}>${info.label}</button>`;
  }).join("");

  const info = COACHED_STEPS[currentIndex];
  const back = currentIndex > 0
    ? `<button class="journey-nav-button journey-back" id="journey-back" type="button">← Back</button>`
    : "";
  const next = currentIndex < COACHED_STEPS.length - 1
    ? `<button class="journey-nav-button journey-next" id="journey-next" type="button"` +
      `${blocker ? ' disabled aria-describedby="journey-blocker"' : ""}>Next →</button>`
    : "";
  const blockerMarkup = blocker
    ? `<div id="journey-blocker" class="journey-blocker" role="alert">${escapeHtml(blocker.message)}</div>` +
      `<button class="journey-correction" id="journey-correction" type="button"` +
      ` data-correction-step="${escapeHtml(blocker.step)}"` +
      `${blocker.field ? ` data-correction-field="${escapeHtml(blocker.field)}"` : ""}>` +
      `Review in ${friendlyStage(blocker.step)}</button>`
    : "";

  return `<nav class="journey-bar" aria-label="Design stages">` +
    `<div class="journey-stage-rail">${stages}</div>` +
    `<div class="journey-navigation">` +
    `<div class="journey-current">` +
    `<span class="journey-current-stage">Current stage: ${info.label}</span>` +
    `<span class="journey-current-hint">${info.hint}</span>` +
    `</div>` +
    `<div class="journey-navigation-actions">${back}${next}</div>` +
    `</div>${blockerMarkup}</nav>`;
}

export function checklistMarkup(items: readonly ChecklistItem[]): string {
  const done = items.filter((item) => item.done).length;
  const rows = items.map((item) => {
    const mark = item.done ? "✓" : "○";
    const nextLine = item.done
      ? ""
      : `<div class="journey-checklist-next">${escapeHtml(item.next)}</div>`;
    return `<div class="journey-checklist-row${item.done ? " is-complete" : ""}">` +
      `<span class="journey-checklist-mark" aria-hidden="true">${mark}</span>` +
      `<span>${escapeHtml(item.label)}${nextLine}</span></div>`;
  }).join("");
  return `<section class="journey-checklist" aria-label="Design readiness">` +
    `<div class="journey-checklist-summary">${done} of ${items.length} to an exportable design</div>` +
    rows + `</section>`;
}

/** The compact first-run welcome. Its actions only communicate familiarity. */
export function welcomeMarkup(): string {
  return `<section id="journey-welcome" class="journey-welcome"` +
    ` aria-labelledby="journey-welcome-title">` +
    `<h2 id="journey-welcome-title">Design a garment in five stages</h2>` +
    `<p>Choose a garment, add measurements, set a style intent, review the digital checks,` +
    ` then export when the design is ready. You can revisit any stage; physical fit still` +
    ` needs separate validation.</p>` +
    `<div class="journey-welcome-actions">` +
    `<button id="welcome-start" type="button" class="journey-primary-action">Start designing</button>` +
    `<button id="welcome-skip" type="button" class="journey-secondary-action">Skip introduction</button>` +
    `</div></section>`;
}

/** Export confirmation stays digital and does not claim physical validation. */
export function celebrationMarkup(plausible: boolean): string {
  const text = plausible
    ? "✓ Files exported — digital inputs were valid; physical fit still needs validation."
    : "Files exported — flagged inputs still need review; physical fit still needs validation.";
  return `<div id="journey-celebration" class="journey-celebration" role="status" aria-live="polite">` +
    `<span>${text}</span>` +
    `<button id="celebrate-dismiss" type="button" class="journey-secondary-action">Dismiss</button>` +
    `</div>`;
}

// ── Persistence ──────────────────────────────────────────────────────────────

export const JOURNEY_VERSION = 2;

export interface JourneyState {
  readonly v: number;
  readonly step: JourneyStep;
  readonly exported: boolean;
  readonly familiar?: boolean;
}

export const FRESH_JOURNEY: JourneyState = {
  v: JOURNEY_VERSION,
  step: "start",
  exported: false,
  familiar: false,
};

const JOURNEY_KEY = "patternworks_journey_v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJourneyStep = (value: unknown): value is JourneyStep =>
  typeof value === "string" && STEP_IDS.includes(value as JourneyStep);

const hasOwn = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

const normalizedForSave = (state: JourneyState): JourneyState => ({
  v: JOURNEY_VERSION,
  step: isJourneyStep(state.step) ? state.step : "start",
  exported: state.exported === true,
  familiar: state.familiar === true,
});

/** Persist the journey in the legacy storage slot using the v2 shape. */
export function saveJourney(state: JourneyState): boolean {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(normalizedForSave(state)));
    return true;
  } catch {
    return false;
  }
}

/** Load v1/v2 journey state without carrying stale export confirmation forward. */
export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (raw === null) return FRESH_JOURNEY;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return FRESH_JOURNEY;
    if (parsed.v !== 1 && parsed.v !== JOURNEY_VERSION) return FRESH_JOURNEY;
    if (!isJourneyStep(parsed.step)) return FRESH_JOURNEY;
    if (hasOwn(parsed, "exported") && typeof parsed.exported !== "boolean") return FRESH_JOURNEY;
    if (hasOwn(parsed, "familiar") && typeof parsed.familiar !== "boolean") return FRESH_JOURNEY;

    if (parsed.v === 1) {
      const legacyStep = parsed.step;
      const step = legacyStep === "done"
        ? "measure"
        : legacyStep === "output" ? "refine" : legacyStep;
      return {
        v: JOURNEY_VERSION,
        step,
        exported: false,
        familiar: legacyStep !== "start",
      };
    }

    const step = parsed.step === "output" || parsed.step === "done"
      ? "refine"
      : parsed.step;
    return {
      v: JOURNEY_VERSION,
      step,
      exported: false,
      familiar: parsed.familiar === true,
    };
  } catch {
    return FRESH_JOURNEY;
  }
}
