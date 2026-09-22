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

export type TutorialStatus = "unseen" | "in_progress" | "skipped" | "suppressed" | "completed";
export type TutorialStep = "welcome" | "garment" | "measure" | "style" | "check" | "export";

export interface TutorialState {
  readonly status: TutorialStatus;
  readonly step: TutorialStep;
}

export interface JourneyBarOptions {
  readonly nextLabel?: string;
  readonly correctionLabel?: string;
  readonly hideNextWhenBlocked?: boolean;
  readonly tutorialActive?: boolean;
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
  blocker?: StageBlocker,
  options: JourneyBarOptions = {},
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
  const next = currentIndex < COACHED_STEPS.length - 1 &&
    !(options.hideNextWhenBlocked && blocker)
    ? `<button class="journey-nav-button journey-next" id="journey-next" type="button"` +
      `${blocker ? ' disabled aria-describedby="journey-blocker"' : ""}>${escapeHtml(options.nextLabel ?? "Next →")}</button>`
    : "";
  const blockerMarkup = blocker
    ? `<div id="journey-blocker" class="journey-blocker" role="alert">${escapeHtml(blocker.message)}</div>` +
      `<button class="journey-correction${options.tutorialActive ? " tutorial-primary-action" : ""}" id="journey-correction" type="button"` +
      ` data-correction-step="${escapeHtml(blocker.step)}"` +
      `${blocker.field ? ` data-correction-field="${escapeHtml(blocker.field)}"` : ""}>` +
      `${escapeHtml(options.correctionLabel ?? `Review in ${friendlyStage(blocker.step)}`)}</button>`
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

const TUTORIAL_STEPS: readonly TutorialStep[] = ["welcome", "garment", "measure", "style", "check", "export"];
const TUTORIAL_STATUSES: readonly TutorialStatus[] = ["unseen", "in_progress", "skipped", "suppressed", "completed"];

const isTutorialStep = (value: unknown): value is TutorialStep =>
  typeof value === "string" && TUTORIAL_STEPS.includes(value as TutorialStep);
const isTutorialStatus = (value: unknown): value is TutorialStatus =>
  typeof value === "string" && TUTORIAL_STATUSES.includes(value as TutorialStatus);

export const FRESH_TUTORIAL: TutorialState = { status: "unseen", step: "welcome" };

export function tutorialStepForJourneyStep(step: JourneyStep): TutorialStep {
  switch (step) {
    case "start": return "garment";
    case "measure": return "measure";
    case "fit": return "style";
    case "refine": return "check";
    case "output":
    case "done": return "export";
  }
}

const TUTORIAL_COPY: Readonly<Record<Exclude<TutorialStep, "welcome">, {
  readonly title: string;
  readonly body: string;
}>> = {
  garment: {
    title: "Choose what to design.",
    body: "Choose what you want to design. The app will show its measurements and design choices. You can change this choice later.",
  },
  measure: {
    title: "Review measurements.",
    body: "Enter or adjust the listed body measurements. Values that need review stay visible with guidance. You can change them later.",
  },
  style: {
    title: "Shape the design.",
    body: "Choose how close or relaxed the digital pattern should be. Change the fabric, color, details, or add a graphic. These editable choices do not test how a sewn garment will fit.",
  },
  check: {
    title: "Check the digital draft.",
    body: "Review the drawing and guidance. If something needs attention, the app identifies it and points to a correction. These checks are not a physical fitting.",
  },
  export: {
    title: "Choose digital files.",
    body: "Choose a size, then choose an outline or a file for printing. A reference file can show measurements and notes about putting the garment together. Some downloads cover one size; others include all sizes. A file does not prove physical fit or production readiness.",
  },
};

export function tutorialProgressLabel(step: TutorialStep): string {
  if (step === "welcome") return "Step 1 of 5";
  if (step === "garment") return "Step 2 of 5";
  if (step === "measure") return "Step 3 of 5";
  if (step === "style") return "Step 4 of 5";
  return "Step 5 of 5";
}

export function tutorialAnnouncement(tutorial: TutorialState): string {
  return tutorialProgressLabel(tutorial.step);
}

/** A non-modal coach panel; the stage bar retains the primary transition action. */
export function tutorialMarkup(
  tutorial: TutorialState,
  storageUnavailable = false,
): string {
  const notice = storageUnavailable
    ? `<p class="tutorial-storage-notice" role="status">Tour progress may not survive a reload because local storage is unavailable.</p>`
    : "";
  if (tutorial.status !== "unseen" && tutorial.status !== "in_progress") {
    return `<section id="tutorial-panel" class="tutorial-panel tutorial-replay" role="region" aria-labelledby="tutorial-title">` +
      `<h2 id="tutorial-title" tabindex="-1">Need a quick guide?</h2>` +
      `<button id="tutorial-replay" type="button" class="journey-secondary-action">Take the tour</button>${notice}</section>`;
  }

  const step: TutorialStep = tutorial.status === "unseen" || tutorial.step === "welcome"
    ? "welcome"
    : tutorial.step;
  const progress = tutorialProgressLabel(step);
  const title = step === "welcome" ? "Welcome" : TUTORIAL_COPY[step].title;
  const body = step === "welcome"
    ? `<p class="tutorial-lead">Create a digital sewing pattern that fits your design intent.</p>` +
      `<p>Your measurements and choices make an editable digital outline of garment pieces and files you can save. Nothing has been sewn or fit-tested, so the files do not confirm physical fit or production readiness.</p>`
    : `<p>${escapeHtml(TUTORIAL_COPY[step].body)}</p>`;
  const actions = step === "welcome"
    ? `<button id="welcome-start" type="button" class="journey-primary-action">Start the tour</button>` +
      `<button id="welcome-skip" type="button" class="journey-secondary-action">Skip for now</button>`
    : step === "export"
      ? `<button id="tutorial-finish" type="button" class="journey-primary-action">Finish the tour</button>` +
        `<button id="tutorial-skip" type="button" class="journey-secondary-action">Skip tour</button>`
      : `<button id="tutorial-skip" type="button" class="journey-secondary-action">Skip tour</button>`;
  return `<section id="tutorial-panel" class="tutorial-panel" role="region" aria-labelledby="tutorial-title">` +
    `<p class="tutorial-progress">${progress}</p>` +
    `<h2 id="tutorial-title" tabindex="-1">${escapeHtml(title)}</h2>` + body +
    `<div class="tutorial-actions">${actions}</div>${notice}` +
    `<span id="tutorial-announcement" class="studio-visually-hidden" role="status" aria-live="polite" aria-atomic="true"></span>` +
    `</section>`;
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

export const JOURNEY_VERSION = 3;

export interface JourneyState {
  readonly v: number;
  readonly step: JourneyStep;
  readonly exported: boolean;
  readonly familiar?: boolean;
  readonly tutorial: TutorialState;
}

export const FRESH_JOURNEY: JourneyState = {
  v: JOURNEY_VERSION,
  step: "start",
  exported: false,
  familiar: false,
  tutorial: FRESH_TUTORIAL,
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
  tutorial: isTutorialState(state.tutorial) ? state.tutorial : FRESH_TUTORIAL,
});

export interface JourneyLoadResult {
  readonly state: JourneyState;
  readonly storageAvailable: boolean;
}

const isTutorialState = (value: unknown): value is TutorialState =>
  isRecord(value) && isTutorialStatus(value.status) && isTutorialStep(value.step);

const normalizedStage = (step: JourneyStep): JourneyStep =>
  step === "output" || step === "done" ? "refine" : step;

const returningRecord = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return value.familiar === true || (isJourneyStep(value.step) && value.step !== "start");
};

const fallbackJourney = (hasSavedWorkspace: boolean, parsed?: unknown): JourneyState => {
  const returning = hasSavedWorkspace || returningRecord(parsed);
  const parsedStep = isRecord(parsed) && isJourneyStep(parsed.step) ? normalizedStage(parsed.step) : "start";
  const step = hasSavedWorkspace && parsedStep === "start" ? "measure" : parsedStep;
  return {
    ...FRESH_JOURNEY,
    step,
    familiar: returning,
    tutorial: returning
      ? { status: "suppressed", step: tutorialStepForJourneyStep(step) }
      : FRESH_TUTORIAL,
  };
};

function migrateJourney(parsed: Record<string, unknown>, hasSavedWorkspace: boolean): JourneyState {
  if (parsed.v !== 1 && parsed.v !== 2 && parsed.v !== JOURNEY_VERSION) {
    return fallbackJourney(hasSavedWorkspace, parsed);
  }
  if (!isJourneyStep(parsed.step) ||
    (hasOwn(parsed, "exported") && typeof parsed.exported !== "boolean") ||
    (hasOwn(parsed, "familiar") && typeof parsed.familiar !== "boolean")) {
    return fallbackJourney(hasSavedWorkspace, parsed);
  }

  const legacyStep = parsed.step;
  const legacyStage = parsed.v === 1 && legacyStep === "done"
    ? "measure"
    : normalizedStage(legacyStep);
  const legacyFamiliar = parsed.v === 1 ? legacyStep !== "start" : parsed.familiar === true;

  if (parsed.v === 1 || parsed.v === 2) {
    const suppressed = hasSavedWorkspace || legacyFamiliar || legacyStep !== "start";
    const step = hasSavedWorkspace && legacyStage === "start" && !legacyFamiliar
      ? "measure"
      : legacyStage;
    return {
      v: JOURNEY_VERSION,
      step,
      exported: false,
      familiar: suppressed,
      tutorial: suppressed
        ? { status: "suppressed", step: tutorialStepForJourneyStep(step) }
        : FRESH_TUTORIAL,
    };
  }

  if (!isTutorialState(parsed.tutorial)) return fallbackJourney(hasSavedWorkspace, parsed);
  const step = normalizedStage(legacyStep);
  const tutorialStatus = parsed.tutorial.status === "unseen" &&
    (hasSavedWorkspace || parsed.familiar === true || legacyStep !== "start")
    ? "suppressed"
    : parsed.tutorial.status;
  const savedWorkspaceStage = hasSavedWorkspace &&
    parsed.tutorial.status === "unseen" &&
    parsed.familiar !== true &&
    step === "start"
    ? "measure"
    : step;
  const tutorialStep = tutorialStatus === "in_progress"
    ? parsed.tutorial.step === "export" ? "check"
      : parsed.tutorial.step === "welcome" ? "welcome" : tutorialStepForJourneyStep(savedWorkspaceStage)
    : tutorialStatus === "unseen" ? "welcome"
      : parsed.tutorial.status === "unseen" ? tutorialStepForJourneyStep(savedWorkspaceStage) : parsed.tutorial.step;
  return {
    v: JOURNEY_VERSION,
    step: tutorialStatus === "in_progress" && parsed.tutorial.step === "export" ? "refine" : savedWorkspaceStage,
    exported: false,
    familiar: parsed.familiar === true || tutorialStatus !== "unseen",
    tutorial: { status: tutorialStatus, step: tutorialStep },
  };
}

/** Persist the journey in the legacy storage slot using the v3 shape. */
export function saveJourney(state: JourneyState): boolean {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(normalizedForSave(state)));
    return true;
  } catch {
    return false;
  }
}

/** Load and migrate tutorial state without carrying stale export confirmation forward. */
export function loadJourneyWithStatus(hasSavedWorkspace = false): JourneyLoadResult {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (raw === null) return { state: fallbackJourney(hasSavedWorkspace), storageAvailable: true };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { state: fallbackJourney(hasSavedWorkspace), storageAvailable: true };
    }
    return {
      state: isRecord(parsed) ? migrateJourney(parsed, hasSavedWorkspace) : fallbackJourney(hasSavedWorkspace, parsed),
      storageAvailable: true,
    };
  } catch {
    return { state: fallbackJourney(hasSavedWorkspace), storageAvailable: false };
  }
}

export function loadJourney(hasSavedWorkspace = false): JourneyState {
  return loadJourneyWithStatus(hasSavedWorkspace).state;
}
