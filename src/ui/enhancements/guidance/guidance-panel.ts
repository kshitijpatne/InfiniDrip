// UIQ-03 native guidance panel: an isolated, dependency-free display of the
// existing design-journey guidance engine's output. This module never
// computes readiness, validity, or decision logic itself — every judgement
// (readiness flags, blocker, validity state/detail, note severity/text) is
// supplied by the caller's snapshot and rendered literally. The only engine
// helper this file calls is the existing `journeyChecklist`, used purely to
// read already-computed per-stage completion, never to invent it.
//
// Every scoped selector in the companion stylesheet requires this module's
// own ".uiq-guidance" root class (see guidance-panel.css), so nothing here
// can affect — or be affected by — an unrelated lookalike element elsewhere
// on the host page.

import type { Note, Level } from "../../../guidance/note";
import { SEVERITY_ICON } from "../../../guidance/note";
import type { JourneyStep, StageReadiness, StageBlocker } from "../../journey";
import { COACHED_STEPS, journeyChecklist } from "../../journey";

export const GUIDANCE_SCOPE_CLASS = "uiq-guidance";

export interface GuidanceAction {
  readonly label: string;
  readonly step: JourneyStep;
  readonly field?: string;
}

export interface GuidanceEntry {
  readonly id: string;
  readonly note: Note;
  readonly action?: GuidanceAction;
  readonly detail?: string;
}

export type GuidanceValidityState = "valid" | "invalid" | "unknown";

export interface GuidanceValidity {
  readonly state: GuidanceValidityState;
  readonly detail: string;
}

export interface GuidanceSnapshot {
  readonly revisionLabel: string;
  readonly step: JourneyStep;
  readonly readiness: StageReadiness;
  readonly blocker?: StageBlocker;
  readonly notes: readonly GuidanceEntry[];
  readonly fitIntent: string | null;
  readonly validity: GuidanceValidity;
}

export interface GuidancePanelOptions {
  readonly snapshot: GuidanceSnapshot;
  readonly onReview: (action: GuidanceAction) => void;
}

export interface GuidancePanelControls {
  update(snapshot: GuidanceSnapshot): void;
  dispose(): void;
}

const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  ok: "OK",
  info: "Info",
  warn: "Warning",
};

const VALIDITY_LABEL: Readonly<Record<GuidanceValidityState, string>> = {
  valid: "Valid",
  invalid: "Invalid",
  unknown: "Unknown",
};

const NO_FIT_PREFERENCE = "No fit preference supplied";
const DIGITAL_CAVEAT = "Digital checks are not physical fit validation.";
const NO_NOTES_TEXT = "No guidance notes supplied.";
const CORRECTION_LABEL = "Review correction";
const DETAIL_SUMMARY = "More detail";

/** Legacy "done" is a persisted historical step; it displays as the "output"
 *  stage without implying a confirmed export (that remains readiness-driven). */
const displayStepFor = (step: JourneyStep): JourneyStep => (step === "done" ? "output" : step);

/** Throws before any DOM mutation so a caller mistake never corrupts
 *  previously rendered, still-valid content. */
function assertUniqueNoteIds(notes: readonly GuidanceEntry[]): void {
  const seen = new Set<string>();
  for (const entry of notes) {
    if (seen.has(entry.id)) {
      throw new Error(`mountGuidancePanel: duplicate guidance note id "${entry.id}"`);
    }
    seen.add(entry.id);
  }
}

function freshAction(label: string, step: JourneyStep, field: string | undefined): GuidanceAction {
  return field !== undefined ? { label, step, field } : { label, step };
}

interface StageRefs {
  readonly item: HTMLLIElement;
  readonly badgeCurrent: HTMLSpanElement;
  readonly badgeComplete: HTMLSpanElement;
  readonly badgeBlocked: HTMLSpanElement;
}

interface NoteRefs {
  readonly li: HTMLLIElement;
  readonly icon: HTMLSpanElement;
  readonly levelEl: HTMLSpanElement;
  readonly textEl: HTMLSpanElement;
  detailEl?: HTMLDetailsElement;
  detailBodyEl?: HTMLParagraphElement;
  actionBtn?: HTMLButtonElement;
}

function createStageItem(stepInfo: (typeof COACHED_STEPS)[number]): StageRefs {
  const item = document.createElement("li");
  item.className = "uiq-guidance-stage";
  item.dataset.step = stepInfo.id;

  const label = document.createElement("p");
  label.className = "uiq-guidance-stage-label";
  label.textContent = stepInfo.label;

  const hint = document.createElement("p");
  hint.className = "uiq-guidance-stage-hint";
  hint.textContent = stepInfo.hint;

  const badges = document.createElement("div");
  badges.className = "uiq-guidance-stage-badges";

  const badgeCurrent = document.createElement("span");
  badgeCurrent.className = "uiq-guidance-badge uiq-guidance-badge--current";
  badgeCurrent.textContent = "Current stage";
  badgeCurrent.hidden = true;

  const badgeComplete = document.createElement("span");
  badgeComplete.className = "uiq-guidance-badge uiq-guidance-badge--complete";
  badgeComplete.textContent = "Complete";
  badgeComplete.hidden = true;

  const badgeBlocked = document.createElement("span");
  badgeBlocked.className = "uiq-guidance-badge uiq-guidance-badge--blocked";
  badgeBlocked.textContent = "Needs correction";
  badgeBlocked.hidden = true;

  badges.append(badgeCurrent, badgeComplete, badgeBlocked);
  item.append(label, hint, badges);

  return { item, badgeCurrent, badgeComplete, badgeBlocked };
}

function createNoteNode(): NoteRefs {
  const li = document.createElement("li");
  li.className = "uiq-guidance-note";

  const icon = document.createElement("span");
  icon.className = "uiq-guidance-note-icon";
  icon.setAttribute("aria-hidden", "true");

  const levelEl = document.createElement("span");
  levelEl.className = "uiq-guidance-note-level";

  const textEl = document.createElement("span");
  textEl.className = "uiq-guidance-note-text";

  li.append(icon, levelEl, textEl);

  return { li, icon, levelEl, textEl };
}

function updateNoteNode(nodes: NoteRefs, entry: GuidanceEntry): void {
  nodes.li.dataset.noteId = entry.id;
  nodes.li.dataset.level = entry.note.level;
  nodes.icon.textContent = SEVERITY_ICON[entry.note.level];
  nodes.levelEl.textContent = LEVEL_LABEL[entry.note.level];
  nodes.textEl.textContent = entry.note.text;

  if (entry.detail !== undefined) {
    if (!nodes.detailEl) {
      const detailEl = document.createElement("details");
      detailEl.className = "uiq-guidance-note-detail";
      const summary = document.createElement("summary");
      summary.textContent = DETAIL_SUMMARY;
      const body = document.createElement("p");
      detailEl.append(summary, body);
      nodes.li.append(detailEl);
      nodes.detailEl = detailEl;
      nodes.detailBodyEl = body;
    }
    nodes.detailBodyEl!.textContent = entry.detail;
  } else if (nodes.detailEl) {
    nodes.detailEl.remove();
    nodes.detailEl = undefined;
    nodes.detailBodyEl = undefined;
  }

  if (entry.action) {
    if (!nodes.actionBtn) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "uiq-guidance-note-action";
      button.dataset.actionId = entry.id;
      nodes.li.append(button);
      nodes.actionBtn = button;
    }
    // An explicitly supplied action can have a blank label at runtime. Keep
    // its callback payload literal, but do not render an unnamed control.
    nodes.actionBtn.textContent = entry.action.label.trim() === ""
      ? "Review guidance note (label not supplied)"
      : entry.action.label;
  } else if (nodes.actionBtn) {
    nodes.actionBtn.remove();
    nodes.actionBtn = undefined;
  }
}

/**
 * Mount the native guidance panel. Appends exactly one owned root to `host`,
 * preserving any existing siblings. The returned controller's `update` never
 * invokes `onReview` or mutates the supplied snapshot; `dispose` is
 * idempotent and leaves the panel permanently inert.
 */
export function mountGuidancePanel(host: HTMLElement, options: GuidancePanelOptions): GuidancePanelControls {
  assertUniqueNoteIds(options.snapshot.notes);

  const root = document.createElement("section");
  root.className = `uiq-foundation ${GUIDANCE_SCOPE_CLASS}`;

  const title = document.createElement("h2");
  title.className = "uiq-guidance-title";
  title.textContent = "Guidance";

  const revision = document.createElement("p");
  revision.className = "uiq-guidance-revision";

  const stagesList = document.createElement("ol");
  stagesList.className = "uiq-guidance-stages";
  const stageRefs: StageRefs[] = COACHED_STEPS.map((stepInfo) => {
    const refs = createStageItem(stepInfo);
    stagesList.append(refs.item);
    return refs;
  });

  const fitSection = document.createElement("section");
  fitSection.className = "uiq-guidance-fit";
  const fitHeading = document.createElement("h3");
  fitHeading.textContent = "Fit preference";
  const fitValue = document.createElement("p");
  fitValue.className = "uiq-guidance-fit-value";
  fitSection.append(fitHeading, fitValue);

  const validitySection = document.createElement("section");
  validitySection.className = "uiq-guidance-validity";
  const validityHeading = document.createElement("h3");
  validityHeading.textContent = "Digital input validity";
  const validityState = document.createElement("p");
  validityState.className = "uiq-guidance-validity-state";
  const validityDetail = document.createElement("p");
  validityDetail.className = "uiq-guidance-validity-detail";
  const caveat = document.createElement("p");
  caveat.className = "uiq-guidance-caveat";
  caveat.textContent = DIGITAL_CAVEAT;
  validitySection.append(validityHeading, validityState, validityDetail, caveat);

  const notesList = document.createElement("ul");
  notesList.className = "uiq-guidance-notes";

  const emptyNotesItem = document.createElement("li");
  emptyNotesItem.className = "uiq-guidance-note-empty";
  emptyNotesItem.textContent = NO_NOTES_TEXT;

  root.append(title, revision, stagesList, fitSection, validitySection, notesList);
  host.append(root);

  let disposed = false;
  let blockerEl: HTMLDivElement | null = null;
  let blockerMessageEl: HTMLParagraphElement | null = null;
  let blockerCorrectionButton: HTMLButtonElement | null = null;
  let currentBlocker: StageBlocker | undefined;

  const noteNodeById = new Map<string, NoteRefs>();
  const currentEntryById = new Map<string, GuidanceEntry>();

  function renderStages(snapshot: GuidanceSnapshot): void {
    const displayStep = displayStepFor(snapshot.step);
    const checklist = journeyChecklist(snapshot.readiness);
    stageRefs.forEach((refs, index) => {
      const stepInfo = COACHED_STEPS[index];
      const isCurrent = stepInfo.id === displayStep;
      const isComplete = checklist[index]!.done;
      const isBlocked = snapshot.blocker !== undefined && displayStepFor(snapshot.blocker.step) === stepInfo.id;

      refs.badgeCurrent.hidden = !isCurrent;
      refs.badgeComplete.hidden = !isComplete;
      refs.badgeBlocked.hidden = !isBlocked;
      refs.item.dataset.current = String(isCurrent);
      refs.item.dataset.complete = String(isComplete);
      refs.item.dataset.blocked = String(isBlocked);
    });
  }

  function renderBlocker(snapshot: GuidanceSnapshot): void {
    if (snapshot.blocker) {
      if (!blockerEl) {
        blockerEl = document.createElement("div");
        blockerEl.className = "uiq-guidance-blocker";
        blockerEl.setAttribute("role", "alert");

        blockerMessageEl = document.createElement("p");
        blockerMessageEl.className = "uiq-guidance-blocker-message";

        const correctionButton = document.createElement("button");
        correctionButton.type = "button";
        correctionButton.className = "uiq-guidance-correction";
        correctionButton.textContent = CORRECTION_LABEL;
        blockerCorrectionButton = correctionButton;

        blockerEl.append(blockerMessageEl, correctionButton);
        root.insertBefore(blockerEl, notesList);
      }
      blockerMessageEl!.textContent = snapshot.blocker.message;
    } else if (blockerEl) {
      blockerEl.remove();
      blockerEl = null;
      blockerMessageEl = null;
      blockerCorrectionButton = null;
    }
    currentBlocker = snapshot.blocker;
  }

  function renderNotes(snapshot: GuidanceSnapshot): void {
    const entries = snapshot.notes;
    const nextIds = new Set(entries.map((entry) => entry.id));

    for (const [id, nodes] of noteNodeById) {
      if (!nextIds.has(id)) {
        nodes.li.remove();
        noteNodeById.delete(id);
        currentEntryById.delete(id);
      }
    }

    if (entries.length === 0) {
      if (!emptyNotesItem.isConnected) notesList.append(emptyNotesItem);
      return;
    }
    if (emptyNotesItem.isConnected) emptyNotesItem.remove();

    entries.forEach((entry) => {
      currentEntryById.set(entry.id, entry);
      let nodes = noteNodeById.get(entry.id);
      if (!nodes) {
        nodes = createNoteNode();
        noteNodeById.set(entry.id, nodes);
      }
      updateNoteNode(nodes, entry);

    });
    // Reorder around the focused note rather than moving its subtree: moving
    // a focused node with insertBefore blurs it in a real browser. Retain the
    // exact button/details and avoid any synthetic blur/refocus side effects.
    let referenceNode: Node | null = null;
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const nodes = noteNodeById.get(entries[index].id)!;
      if (!nodes.li.contains(document.activeElement) && (nodes.li.parentNode !== notesList || nodes.li.nextSibling !== referenceNode)) {
        notesList.insertBefore(nodes.li, referenceNode);
      }
      referenceNode = nodes.li;
    }
  }

  function render(snapshot: GuidanceSnapshot): void {
    revision.textContent = snapshot.revisionLabel;
    renderStages(snapshot);
    fitValue.textContent = snapshot.fitIntent === null ? NO_FIT_PREFERENCE : snapshot.fitIntent;
    validityState.textContent = VALIDITY_LABEL[snapshot.validity.state];
    validityState.dataset.state = snapshot.validity.state;
    validityDetail.textContent = snapshot.validity.detail;
    renderBlocker(snapshot);
    renderNotes(snapshot);
  }

  render(options.snapshot);

  // A button carrying ".uiq-guidance-note-action" is only ever created by
  // updateNoteNode for an entry whose `action` is defined, keyed by that
  // entry's own id, and is removed together with its `currentEntryById`
  // entry in the same renderNotes pass — so a live (attached) note-action
  // button always resolves to an entry with a defined action. Likewise
  // ".uiq-guidance-correction" only exists in the DOM while `currentBlocker`
  // is set (renderBlocker creates and removes them together). The non-null
  // assertions below rely on those construction invariants, not on
  // unchecked caller input.
  function handleClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Nested instances own their own clicks; never let duplicate caller IDs
    // or an obsolete/reinserted lookalike route into this controller.
    if (target.closest(`.${GUIDANCE_SCOPE_CLASS}`) !== root) return;

    const noteButton = target.closest<HTMLButtonElement>(".uiq-guidance-note-action");
    if (noteButton) {
      if (noteNodeById.get(noteButton.dataset.actionId!)?.actionBtn !== noteButton) return;
      const entry = currentEntryById.get(noteButton.dataset.actionId!)!;
      options.onReview(freshAction(entry.action!.label, entry.action!.step, entry.action!.field));
      return;
    }

    const correctionButton = target.closest(".uiq-guidance-correction");
    if (correctionButton && correctionButton === blockerCorrectionButton) {
      options.onReview(freshAction(CORRECTION_LABEL, currentBlocker!.step, currentBlocker!.field));
    }
  }

  root.addEventListener("click", handleClick);

  return {
    update(snapshot: GuidanceSnapshot): void {
      if (disposed) return;
      assertUniqueNoteIds(snapshot.notes);
      render(snapshot);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      root.removeEventListener("click", handleClick);
      root.remove();
      noteNodeById.clear();
      currentEntryById.clear();
      blockerEl = null;
      blockerMessageEl = null;
      blockerCorrectionButton = null;
      currentBlocker = undefined;
    },
  };
}
