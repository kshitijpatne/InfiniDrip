// UIQ-03 standalone preview: mounts the native guidance panel against a fixed
// set of synthetic snapshots. This script only demonstrates existing data —
// it never navigates the real app, never recomputes readiness/validity, and
// every "Review correction" / note-action click is shown as a logged status
// line rather than a real navigation.

import {
  mountGuidancePanel,
  type GuidanceAction,
  type GuidanceEntry,
  type GuidanceSnapshot,
} from "../../src/ui/enhancements/guidance/guidance-panel";
import type { StageReadiness } from "../../src/ui/journey";

function readiness(overrides: Partial<StageReadiness> = {}): StageReadiness {
  return {
    inputsOk: true,
    styleReviewed: true,
    checksOk: true,
    checkReviewed: true,
    exported: false,
    ...overrides,
  };
}

interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly snapshot: GuidanceSnapshot;
}

const SCENARIOS: readonly Scenario[] = [
  {
    id: "valid-not-reviewed",
    title: "1. Valid inputs, not yet reviewed",
    description: "Digital inputs are valid, but the checklist still expects an explicit style/check review.",
    snapshot: {
      revisionLabel: "Revision 7",
      step: "fit",
      readiness: readiness({ styleReviewed: false }),
      notes: [
        { id: "n1", note: { level: "ok", text: "All measurements are within the standard range." } },
        { id: "n2", note: { level: "info", text: "Fabric selection changes digital ease guidance only." } },
      ],
      fitIntent: "Relaxed",
      validity: { state: "valid", detail: "All flagged inputs from Measure have been cleared." },
    },
  },
  {
    id: "invalid-blocked",
    title: "2. Invalid and blocked, with an exact field to review",
    description: "A blocker names the exact stage and field; the correction button emits that exact target.",
    snapshot: {
      revisionLabel: "Revision 3",
      step: "refine",
      readiness: readiness({ inputsOk: false, checksOk: false }),
      blocker: { message: "The collar width is outside the supported range.", step: "measure", field: "collarWidth" },
      notes: [
        {
          id: "n1",
          note: { level: "warn", text: "Collar width is outside the supported range." },
          detail: "Supported collar widths are 34–46 cm for this recipe.",
          action: { label: "Review collar width", step: "measure", field: "collarWidth" },
        },
      ],
      fitIntent: "Fitted",
      validity: { state: "invalid", detail: "1 flagged input: collarWidth." },
    },
  },
  {
    id: "unknown-validity",
    title: "3. Unknown validity",
    description: "The caller has not yet supplied a pass/fail validity verdict.",
    snapshot: {
      revisionLabel: "Revision 1",
      step: "measure",
      readiness: readiness(),
      notes: [],
      fitIntent: null,
      validity: { state: "unknown", detail: "Digital checks have not run for this revision yet." },
    },
  },
  {
    id: "no-fit-empty-notes",
    title: "4. No fit preference, empty notes",
    description: "Empty notes is an explicit no-guidance state, not a claim that every check passed.",
    snapshot: {
      revisionLabel: "Revision 1",
      step: "start",
      readiness: readiness({ inputsOk: false, styleReviewed: false, checksOk: false, checkReviewed: false }),
      notes: [],
      fitIntent: null,
      validity: { state: "unknown", detail: "No garment chosen yet." },
    },
  },
  {
    id: "all-severities",
    title: "5. All severities, with and without detail/action",
    description: "OK, Info, and Warning notes side by side, each labelled with text, never color alone.",
    snapshot: {
      revisionLabel: "Revision 5",
      step: "refine",
      readiness: readiness(),
      notes: [
        { id: "ok-1", note: { level: "ok", text: "Shoulder slope matches the drafted block." } },
        {
          id: "info-1",
          note: { level: "info", text: "Fabric stretch raises the suggested ease." },
          detail: "Suggested ease increased from 6cm to 8cm at the bust.",
        },
        {
          id: "warn-1",
          note: { level: "warn", text: "Hem length is close to the minimum supported value." },
          action: { label: "Review hem length", step: "refine", field: "hemLength" },
        },
      ],
      fitIntent: "Fitted",
      validity: { state: "valid", detail: "All flagged inputs cleared." },
    },
  },
  {
    id: "legacy-done-unconfirmed",
    title: "6. Legacy 'done' step with an unconfirmed export",
    description: "The persisted step is the legacy 'done' value, but readiness.exported is still false.",
    snapshot: {
      revisionLabel: "Revision 2",
      step: "done",
      readiness: readiness({ exported: false }),
      notes: [{ id: "n1", note: { level: "info", text: "No file has been confirmed for this revision yet." } }],
      fitIntent: "Relaxed",
      validity: { state: "unknown", detail: "Export has not been confirmed." },
    },
  },
  {
    id: "current-and-complete",
    title: "7. A current step that is also complete",
    description: "Current and complete are independent, visible badges — one does not imply the other.",
    snapshot: {
      revisionLabel: "Revision 4",
      step: "measure",
      readiness: readiness({ inputsOk: true }),
      notes: [],
      fitIntent: null,
      validity: { state: "unknown", detail: "Move to Style to continue." },
    },
  },
  {
    id: "hostile-unicode",
    title: "8. Long and hostile Unicode text",
    description: "Every string below is rendered via textContent, never parsed as markup.",
    snapshot: {
      revisionLabel: "<script>window.__pwned = true;</script>",
      step: "fit",
      readiness: readiness(),
      blocker: {
        message: "</h2><b>bold</b> ünïcödé — emoji 🎉 and RTL ‏تجربة",
        step: "fit",
      },
      notes: [
        {
          id: "hostile-1",
          note: { level: "warn", text: "<img src=x onerror=alert(1)> ".repeat(3) + "a".repeat(200) },
          detail: "javascript:alert(1)",
          action: { label: "</button><script>alert(2)</script>", step: "fit" },
        },
      ],
      fitIntent: "&lt;already-escaped&gt;",
      validity: { state: "invalid", detail: "   " },
    },
  },
];

function renderLog(container: HTMLElement, text: string): void {
  const line = document.createElement("p");
  line.className = "preview-log-line";
  line.textContent = text;
  container.prepend(line);
}

function mountScenario(root: HTMLElement, scenario: Scenario, instanceLabel: string): void {
  const section = document.createElement("section");
  section.className = "preview-scenario";

  const heading = document.createElement("h2");
  heading.textContent = `${scenario.title}${instanceLabel ? ` — ${instanceLabel}` : ""}`;
  const description = document.createElement("p");
  description.className = "preview-scenario-description";
  description.textContent = scenario.description;

  const mountPoint = document.createElement("div");
  mountPoint.className = "preview-mount-point";

  const log = document.createElement("div");
  log.className = "preview-log";
  const logHeading = document.createElement("p");
  logHeading.className = "preview-log-heading";
  logHeading.textContent = "Emitted action log (no real navigation occurs):";
  log.append(logHeading);

  section.append(heading, description, mountPoint, log);
  root.append(section);

  mountGuidancePanel(mountPoint, {
    snapshot: scenario.snapshot,
    onReview: (action: GuidanceAction) => {
      renderLog(log, `onReview: ${JSON.stringify(action)}`);
    },
  });
}

function renderAll(): void {
  const root = document.getElementById("preview-root");
  if (!root) return;

  for (const scenario of SCENARIOS) {
    mountScenario(root, scenario, "");
  }

  const twoMountsSection = document.createElement("section");
  twoMountsSection.className = "preview-scenario";
  const twoMountsHeading = document.createElement("h2");
  twoMountsHeading.textContent = "9. Two independent simultaneous mounts";
  const twoMountsDescription = document.createElement("p");
  twoMountsDescription.className = "preview-scenario-description";
  twoMountsDescription.textContent =
    "The same note id is reused by both mounts below; each panel's DOM, state, and callback stay independent.";
  const twoMountsWrap = document.createElement("div");
  twoMountsWrap.className = "preview-two-mounts";
  twoMountsSection.append(twoMountsHeading, twoMountsDescription, twoMountsWrap);
  root.append(twoMountsSection);

  const sharedEntry: GuidanceEntry = {
    id: "shared-id",
    note: { level: "warn", text: "Shared note id, independent mount." },
    action: { label: "Review", step: "measure" },
  };
  const sharedSnapshot: GuidanceSnapshot = {
    revisionLabel: "Revision 1",
    step: "measure",
    readiness: readiness(),
    notes: [sharedEntry],
    fitIntent: null,
    validity: { state: "unknown", detail: "Independent per mount." },
  };

  (["Mount A", "Mount B"] as const).forEach((label) => {
    const mountPoint = document.createElement("div");
    mountPoint.className = "preview-mount-point";
    const log = document.createElement("div");
    log.className = "preview-log";
    const logHeading = document.createElement("p");
    logHeading.className = "preview-log-heading";
    logHeading.textContent = `${label} log:`;
    log.append(logHeading);

    const wrap = document.createElement("div");
    wrap.className = "preview-two-mounts-column";
    wrap.append(mountPoint, log);
    twoMountsWrap.append(wrap);

    mountGuidancePanel(mountPoint, {
      snapshot: sharedSnapshot,
      onReview: (action) => renderLog(log, `${label} onReview: ${JSON.stringify(action)}`),
    });
  });
}

renderAll();
