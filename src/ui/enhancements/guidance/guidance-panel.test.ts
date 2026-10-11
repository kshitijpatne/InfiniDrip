// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Note } from "../../../guidance/note";
import type { JourneyStep, StageBlocker, StageReadiness } from "../../journey";
import {
  mountGuidancePanel,
  GUIDANCE_SCOPE_CLASS,
  type GuidanceAction,
  type GuidanceEntry,
  type GuidanceSnapshot,
} from "./guidance-panel";

afterEach(() => document.body.replaceChildren());

const HOSTILE_STRINGS = [
  "<script>window.__pwned = true;</script>",
  "<img src=x onerror=alert(1)>",
  "</h2><b>bold</b>",
  "javascript:alert(1)",
  "&lt;already-escaped&gt;",
  "",
  "   ",
  "a".repeat(2000),
  "ünïcödé — emoji 🎉 and RTL ‏تجربة",
];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

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

function note(level: Note["level"], text = "A guidance note."): Note {
  return { level, text };
}

function snapshot(overrides: Partial<GuidanceSnapshot> = {}): GuidanceSnapshot {
  return deepFreeze({
    revisionLabel: "Revision 1",
    step: "measure" as JourneyStep,
    readiness: readiness(),
    notes: [] as GuidanceEntry[],
    fitIntent: null,
    validity: { state: "unknown" as const, detail: "No digital checks run yet." },
    ...overrides,
  });
}

function makeHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

describe("Codex focused reconciliation pressure checks", () => {
  it("isolates nested simultaneous panels even when caller note IDs repeat", () => {
    const host = makeHost(); const outerReview = vi.fn(), innerReview = vi.fn();
    const value = snapshot({ notes: [{ id: "shared", note: note("info"), action: { label: "Review", step: "fit" } }] });
    const outer = mountGuidancePanel(host, { snapshot: value, onReview: outerReview });
    const innerHost = document.createElement("div"); host.querySelector(".uiq-guidance")!.append(innerHost);
    const inner = mountGuidancePanel(innerHost, { snapshot: value, onReview: innerReview });
    innerHost.querySelector<HTMLButtonElement>("button")!.click();
    expect(innerReview).toHaveBeenCalledTimes(1); expect(outerReview).not.toHaveBeenCalled();
    inner.dispose(); host.querySelector<HTMLButtonElement>("button")!.click(); expect(outerReview).toHaveBeenCalledTimes(1); outer.dispose();
  });
  it("ignores unknown/forged/reinserted obsolete controls rather than crashing or emitting", () => {
    const host = makeHost(); const onReview = vi.fn();
    const value = snapshot({ notes: [{ id: "known", note: note("info"), action: { label: "Review", step: "fit" } }], blocker: { message: "Review", step: "measure" } });
    const controls = mountGuidancePanel(host, { snapshot: value, onReview });
    const root = host.querySelector(".uiq-guidance")!;
    const oldNote = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    const oldCorrection = host.querySelector<HTMLButtonElement>(".uiq-guidance-correction")!;
    const unknown = oldNote.cloneNode(true) as HTMLButtonElement; unknown.dataset.actionId = "unknown";
    const forged = oldNote.cloneNode(true) as HTMLButtonElement;
    root.append(unknown, forged); unknown.click(); forged.click(); expect(onReview).not.toHaveBeenCalled();
    controls.update(snapshot({ notes: [{ id: "known", note: note("info") }] }));
    root.append(oldNote, oldCorrection); oldNote.click(); oldCorrection.click(); expect(onReview).not.toHaveBeenCalled(); controls.dispose();
  });
  it("maps a legacy done blocker onto output visually but emits the literal original correction target", () => {
    const host = makeHost(); const onReview = vi.fn();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ step: "done", readiness: readiness({ exported: false }), blocker: { message: "File confirmation unavailable", step: "done", field: "export" } }), onReview });
    const stage = host.querySelector<HTMLElement>('[data-step="output"]')!;
    expect(stage.dataset.current).toBe("true"); expect(stage.dataset.blocked).toBe("true"); expect(stage.dataset.complete).toBe("false");
    host.querySelector<HTMLButtonElement>(".uiq-guidance-correction")!.click();
    expect(onReview).toHaveBeenCalledWith({ label: "Review correction", step: "done", field: "export" }); controls.dispose();
  });
  it.each(["", "   "])("gives blank action label %j a visible accessible affordance without inventing the emitted label", label => {
    const host = makeHost(); const onReview = vi.fn();
    const entries = [{ id: "blank", note: note("info"), action: { label, step: "fit" as const } }];
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: entries }), onReview });
    const button = host.querySelector("button")!;
    expect(button.textContent).toBe("Review guidance note (label not supplied)");
    button.click(); expect(onReview).toHaveBeenCalledWith({ label, step: "fit" });
    controls.update(snapshot({ notes: [{ ...entries[0], action: { label: "Review supplied label", step: "fit" } }] }));
    expect(host.querySelector("button")).toBe(button); expect(button.textContent).toBe("Review supplied label");
    controls.dispose();
  });
  it.each(["abc", "acb", "bac", "bca", "cab", "cba"])("reorders to %s without blurring any surviving focused subtree", (order) => {
    for (const focusedId of ["a", "b", "c"]) {
      const host = makeHost();
      const entries = ["a", "b", "c"].map(id => ({ id, note: note("info", id), action: { label: `Review ${id}`, step: "fit" as const }, detail: `Detail ${id}` }));
      const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: entries }), onReview: vi.fn() });
      const original = host.querySelector<HTMLButtonElement>(`[data-action-id="${focusedId}"]`)!;
      const detail = original.closest("li")!.querySelector("details")!;
      detail.open = true;
      const blurred = vi.fn(); original.addEventListener("blur", blurred); original.focus();
      controls.update(snapshot({ notes: [...order].map(id => entries.find(entry => entry.id === id)!) }));
      expect([...host.querySelectorAll<HTMLElement>(".uiq-guidance-note")].map(el => el.dataset.noteId).join("")).toBe(order);
      expect(document.activeElement).toBe(original); expect(blurred).not.toHaveBeenCalled();
      expect(original.closest("li")!.querySelector("details")).toBe(detail); expect(detail.open).toBe(true);
      controls.dispose(); host.remove();
    }
  });
});

describe("mountGuidancePanel: mounting and isolation", () => {
  it("appends exactly one owned root, preserving existing siblings", () => {
    const host = makeHost();
    const sibling = document.createElement("span");
    sibling.className = "pre-existing-sibling";
    host.append(sibling);

    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview: vi.fn() });

    expect(host.children).toHaveLength(2);
    expect(host.children[0]).toBe(sibling);
    const root = host.children[1]!;
    expect(root.tagName).toBe("SECTION");
    expect(root.classList.contains("uiq-foundation")).toBe(true);
    expect(root.classList.contains(GUIDANCE_SCOPE_CLASS)).toBe(true);

    controls.dispose();
  });

  it("does not touch the document head, body children count beyond its own root, or an unrelated sibling", () => {
    const headCountBefore = document.head.children.length;
    const sibling = document.createElement("div");
    sibling.className = "unrelated-sibling";
    sibling.setAttribute("data-marker", "untouched");
    document.body.append(sibling);

    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview: vi.fn() });

    expect(document.head.children.length).toBe(headCountBefore);
    expect(sibling.className).toBe("unrelated-sibling");
    expect(sibling.getAttribute("data-marker")).toBe("untouched");
    expect(sibling.children).toHaveLength(0);
    expect(document.documentElement.classList.length).toBe(0);

    controls.dispose();
    sibling.remove();
  });

  it("rejects duplicate note ids before mounting anything, leaving the host untouched", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const dup = snapshot({
      notes: [
        { id: "n1", note: note("ok") },
        { id: "n1", note: note("warn") },
      ],
    });

    expect(() => mountGuidancePanel(host, { snapshot: dup, onReview })).toThrow(/duplicate/i);
    expect(host.children).toHaveLength(0);
    expect(onReview).not.toHaveBeenCalled();
  });
});

describe("mountGuidancePanel: revision label, fit preference, validity", () => {
  it.each(HOSTILE_STRINGS)("renders the revision label %j as literal text", (raw) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ revisionLabel: raw }), onReview: vi.fn() });

    const revision = host.querySelector(".uiq-guidance-revision")!;
    expect(revision.textContent).toBe(raw);
    expect(revision.querySelector("script")).toBeNull();

    controls.dispose();
  });

  it("shows the literal 'No fit preference supplied' copy when fitIntent is null", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ fitIntent: null }), onReview: vi.fn() });

    expect(host.querySelector(".uiq-guidance-fit-value")!.textContent).toBe("No fit preference supplied");
    controls.dispose();
  });

  it.each(HOSTILE_STRINGS)("shows a supplied fit intent %j literally, never as a validation pass", (raw) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ fitIntent: raw }), onReview: vi.fn() });

    expect(host.querySelector(".uiq-guidance-fit-value")!.textContent).toBe(raw);
    controls.dispose();
  });

  it.each([
    ["valid", "Valid"],
    ["invalid", "Invalid"],
    ["unknown", "Unknown"],
  ] as const)("shows caller-provided validity state %s as %s plus full detail and the fixed caveat", (state, label) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ validity: { state, detail: `Detail for ${state}.` } }),
      onReview: vi.fn(),
    });

    const stateEl = host.querySelector(".uiq-guidance-validity-state")!;
    expect(stateEl.textContent).toBe(label);
    expect(stateEl.getAttribute("data-state")).toBe(state);
    expect(host.querySelector(".uiq-guidance-validity-detail")!.textContent).toBe(`Detail for ${state}.`);
    expect(host.querySelector(".uiq-guidance-caveat")!.textContent).toBe(
      "Digital checks are not physical fit validation.",
    );

    controls.dispose();
  });

  it("never calls a supplied, valid fit intent a validation pass even when validity is itself valid", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ fitIntent: "Relaxed", validity: { state: "valid", detail: "All flagged inputs cleared." } }),
      onReview: vi.fn(),
    });

    expect(host.querySelector(".uiq-guidance-fit-value")!.textContent).toBe("Relaxed");
    expect(host.querySelector(".uiq-guidance-validity-state")!.textContent).toBe("Valid");
    controls.dispose();
  });
});

describe("mountGuidancePanel: stage rail", () => {
  it("renders all five COACHED_STEPS names and hints", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview: vi.fn() });

    const items = host.querySelectorAll(".uiq-guidance-stage");
    expect(items).toHaveLength(5);
    expect(items[0]!.querySelector(".uiq-guidance-stage-label")!.textContent).toBe("1 Garment");
    expect(items[1]!.querySelector(".uiq-guidance-stage-label")!.textContent).toBe("2 Measure");
    expect(items[2]!.querySelector(".uiq-guidance-stage-label")!.textContent).toBe("3 Style");
    expect(items[3]!.querySelector(".uiq-guidance-stage-label")!.textContent).toBe("4 Check");
    expect(items[4]!.querySelector(".uiq-guidance-stage-label")!.textContent).toBe("5 Export");
    expect(items[1]!.querySelector(".uiq-guidance-stage-hint")!.textContent).toMatch(/body measurements/i);

    controls.dispose();
  });

  it("marks the current stage, and only the current stage, as current", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ step: "fit" }), onReview: vi.fn() });

    const items = host.querySelectorAll(".uiq-guidance-stage");
    items.forEach((item, index) => {
      const badge = item.querySelector(".uiq-guidance-badge--current")!;
      expect((badge as HTMLElement).hidden).toBe(index !== 2);
    });

    controls.dispose();
  });

  it("a current step can also independently show complete, and a non-current step can show the blocker target", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        step: "measure",
        readiness: readiness({ inputsOk: true }),
        blocker: { message: "Fix the fabric choice.", step: "fit" },
      }),
      onReview: vi.fn(),
    });

    const items = host.querySelectorAll(".uiq-guidance-stage");
    const measureItem = items[1]!;
    const fitItem = items[2]!;

    expect((measureItem.querySelector(".uiq-guidance-badge--current") as HTMLElement).hidden).toBe(false);
    expect((measureItem.querySelector(".uiq-guidance-badge--complete") as HTMLElement).hidden).toBe(false);
    expect((fitItem.querySelector(".uiq-guidance-badge--current") as HTMLElement).hidden).toBe(true);
    expect((fitItem.querySelector(".uiq-guidance-badge--blocked") as HTMLElement).hidden).toBe(false);

    controls.dispose();
  });

  it("never infers a stage complete merely from being current, a supplied fit intent, or valid digital inputs", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        step: "fit",
        fitIntent: "Fitted",
        validity: { state: "valid", detail: "Looks fine so far." },
        readiness: readiness({ styleReviewed: false }),
      }),
      onReview: vi.fn(),
    });

    const fitItem = host.querySelectorAll(".uiq-guidance-stage")[2]!;
    expect((fitItem.querySelector(".uiq-guidance-badge--current") as HTMLElement).hidden).toBe(false);
    expect((fitItem.querySelector(".uiq-guidance-badge--complete") as HTMLElement).hidden).toBe(true);

    controls.dispose();
  });

  it("maps the legacy 'done' step onto the output stage without implying a confirmed export", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ step: "done", readiness: readiness({ exported: false }) }),
      onReview: vi.fn(),
    });

    const outputItem = host.querySelectorAll(".uiq-guidance-stage")[4]!;
    expect((outputItem.querySelector(".uiq-guidance-badge--current") as HTMLElement).hidden).toBe(false);
    expect((outputItem.querySelector(".uiq-guidance-badge--complete") as HTMLElement).hidden).toBe(true);

    controls.dispose();
  });

  it("shows the output stage complete once readiness reports an actual export, independent of legacy step display", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ step: "done", readiness: readiness({ exported: true }) }),
      onReview: vi.fn(),
    });

    const outputItem = host.querySelectorAll(".uiq-guidance-stage")[4]!;
    expect((outputItem.querySelector(".uiq-guidance-badge--complete") as HTMLElement).hidden).toBe(false);

    controls.dispose();
  });
});

describe("mountGuidancePanel: blocker", () => {
  it("renders no blocker element when the snapshot has none", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview: vi.fn() });
    expect(host.querySelector(".uiq-guidance-blocker")).toBeNull();
    controls.dispose();
  });

  it.each(HOSTILE_STRINGS)("renders a role=alert blocker with the exact message %j and a native Review correction button", (raw) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ blocker: { message: raw, step: "measure" } }),
      onReview: vi.fn(),
    });

    const alertEl = host.querySelector(".uiq-guidance-blocker")!;
    expect(alertEl.getAttribute("role")).toBe("alert");
    expect(alertEl.querySelector(".uiq-guidance-blocker-message")!.textContent).toBe(raw);
    const button = alertEl.querySelector("button.uiq-guidance-correction")!;
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.textContent).toBe("Review correction");

    controls.dispose();
  });

  it("emits the exact step and field exactly once when the correction button is clicked", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const blocker: StageBlocker = { message: "Fix the collar width.", step: "refine", field: "collarWidth" };
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ blocker }), onReview });

    const button = host.querySelector<HTMLButtonElement>("button.uiq-guidance-correction")!;
    button.click();

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onReview).toHaveBeenCalledWith({ label: "Review correction", step: "refine", field: "collarWidth" });

    controls.dispose();
  });

  it("emits a step with no field property when the blocker supplies none", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const blocker: StageBlocker = { message: "Fix something.", step: "measure" };
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ blocker }), onReview });

    host.querySelector<HTMLButtonElement>("button.uiq-guidance-correction")!.click();

    const received = onReview.mock.calls[0]![0] as GuidanceAction;
    expect(received).toEqual({ label: "Review correction", step: "measure" });
    expect(Object.prototype.hasOwnProperty.call(received, "field")).toBe(false);

    controls.dispose();
  });

  it("removes the blocker element once the snapshot clears it, and re-adds it if it returns", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ blocker: { message: "First.", step: "measure" } }),
      onReview: vi.fn(),
    });
    expect(host.querySelector(".uiq-guidance-blocker")).not.toBeNull();

    controls.update(snapshot());
    expect(host.querySelector(".uiq-guidance-blocker")).toBeNull();

    controls.update(snapshot({ blocker: { message: "Second.", step: "fit" } }));
    const alertEl = host.querySelector(".uiq-guidance-blocker");
    expect(alertEl).not.toBeNull();
    expect(alertEl!.querySelector(".uiq-guidance-blocker-message")!.textContent).toBe("Second.");

    controls.dispose();
  });

  it("keeps the same correction button node focused across an update that only changes the blocker message", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ blocker: { message: "First.", step: "measure" } }),
      onReview: vi.fn(),
    });

    const button = host.querySelector<HTMLButtonElement>("button.uiq-guidance-correction")!;
    button.focus();
    expect(document.activeElement).toBe(button);

    controls.update(snapshot({ blocker: { message: "Updated.", step: "measure" } }));

    expect(host.querySelector<HTMLButtonElement>("button.uiq-guidance-correction")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(host.querySelector(".uiq-guidance-blocker-message")!.textContent).toBe("Updated.");

    controls.dispose();
  });

  it("uses the latest blocker step/field after an update, even though the button node is reused", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ blocker: { message: "First.", step: "measure", field: "chest" } }),
      onReview,
    });

    controls.update(snapshot({ blocker: { message: "Second.", step: "refine", field: "waist" } }));
    host.querySelector<HTMLButtonElement>("button.uiq-guidance-correction")!.click();

    expect(onReview).toHaveBeenCalledWith({ label: "Review correction", step: "refine", field: "waist" });

    controls.dispose();
  });
});

describe("mountGuidancePanel: notes", () => {
  it("shows an explicit no-guidance state (not 'all checks pass') when notes is empty", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: [] }), onReview: vi.fn() });

    const empty = host.querySelector(".uiq-guidance-note-empty")!;
    expect(empty.textContent).toBe("No guidance notes supplied.");
    expect(empty.textContent!.toLowerCase()).not.toMatch(/all checks pass|all good|no issues/);

    controls.dispose();
  });

  it("removes the empty-state item once an update supplies a real note", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: [] }), onReview: vi.fn() });
    expect(host.querySelector(".uiq-guidance-note-empty")).not.toBeNull();

    controls.update(snapshot({ notes: [{ id: "n1", note: note("ok", "Now present.") }] }));

    expect(host.querySelector(".uiq-guidance-note-empty")).toBeNull();
    expect(host.querySelector(".uiq-guidance-note-text")!.textContent).toBe("Now present.");

    controls.dispose();
  });

  it("keeps showing the empty state unchanged across repeated empty updates", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: [] }), onReview: vi.fn() });
    const firstEmpty = host.querySelector(".uiq-guidance-note-empty");

    controls.update(snapshot({ notes: [] }));

    expect(host.querySelector(".uiq-guidance-note-empty")).toBe(firstEmpty);
    expect(host.querySelectorAll(".uiq-guidance-note-empty")).toHaveLength(1);

    controls.dispose();
  });

  it.each([
    ["ok", "OK"],
    ["info", "Info"],
    ["warn", "Warning"],
  ] as const)("renders a %s note with literal text and the %s severity label, never color alone", (level, label) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note(level, `A ${level} message.`) }] }),
      onReview: vi.fn(),
    });

    const item = host.querySelector(".uiq-guidance-note")!;
    expect(item.getAttribute("data-level")).toBe(level);
    expect(item.querySelector(".uiq-guidance-note-level")!.textContent).toBe(label);
    expect(item.querySelector(".uiq-guidance-note-text")!.textContent).toBe(`A ${level} message.`);

    controls.dispose();
  });

  it("gives every note level a distinct visible text label (never color alone)", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        notes: [
          { id: "a", note: note("ok") },
          { id: "b", note: note("info") },
          { id: "c", note: note("warn") },
        ],
      }),
      onReview: vi.fn(),
    });

    const labels = Array.from(host.querySelectorAll(".uiq-guidance-note-level")).map((el) => el.textContent);
    expect(new Set(labels).size).toBe(3);

    controls.dispose();
  });

  it("every note, including a non-actionable warning, remains visible with no action or detail", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn", "Heads up.") }] }),
      onReview: vi.fn(),
    });

    const item = host.querySelector(".uiq-guidance-note")!;
    expect(item.querySelector(".uiq-guidance-note-detail")).toBeNull();
    expect(item.querySelector(".uiq-guidance-note-action")).toBeNull();

    controls.dispose();
  });

  it.each(HOSTILE_STRINGS)("renders note text %j as literal text, never markup", (raw) => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn", raw) }] }),
      onReview: vi.fn(),
    });

    const textEl = host.querySelector(".uiq-guidance-note-text")!;
    expect(textEl.textContent).toBe(raw);
    expect(host.querySelector("script")).toBeNull();
    expect(host.querySelector("img")).toBeNull();
    expect((globalThis as { __pwned?: boolean }).__pwned).toBeUndefined();

    controls.dispose();
  });

  it("shows a supplied detail in a native disclosure with a clear summary", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("info"), detail: "Measured at the chest line." }] }),
      onReview: vi.fn(),
    });

    const details = host.querySelector<HTMLDetailsElement>(".uiq-guidance-note-detail")!;
    expect(details.tagName).toBe("DETAILS");
    expect(details.querySelector("summary")!.textContent).toBe("More detail");
    expect(details.querySelector("p")!.textContent).toBe("Measured at the chest line.");

    controls.dispose();
  });

  it("renders an empty supplied detail literally rather than fabricating rationale", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("info"), detail: "" }] }),
      onReview: vi.fn(),
    });

    const details = host.querySelector<HTMLDetailsElement>(".uiq-guidance-note-detail")!;
    expect(details).not.toBeNull();
    expect(details.querySelector("p")!.textContent).toBe("");

    controls.dispose();
  });

  it("emits a note action's exact label/step/field exactly once on click", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const action: GuidanceAction = { label: "Review chest measurement", step: "measure", field: "chest" };
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn"), action }] }),
      onReview,
    });

    const button = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    expect(button.textContent).toBe("Review chest measurement");
    button.click();
    button.click();

    expect(onReview).toHaveBeenCalledTimes(2);
    const received = onReview.mock.calls[0]![0] as GuidanceAction;
    expect(received).toEqual(action);
    expect(received).not.toBe(action);

    controls.dispose();
  });

  it("emits a note action with no field property when none was supplied", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const action: GuidanceAction = { label: "Review", step: "fit" };
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn"), action }] }),
      onReview,
    });

    host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!.click();

    const received = onReview.mock.calls[0]![0] as GuidanceAction;
    expect(received).toEqual({ label: "Review", step: "fit" });
    expect(Object.prototype.hasOwnProperty.call(received, "field")).toBe(false);

    controls.dispose();
  });

  it("shows an action button only when explicitly supplied", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("info") }] }),
      onReview: vi.fn(),
    });

    expect(host.querySelector(".uiq-guidance-note-action")).toBeNull();
    controls.dispose();
  });

  it("clicking elsewhere in the panel, or on an unrelated outside sibling, never invokes onReview", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("info"), action: { label: "Go", step: "fit" } }] }),
      onReview,
    });

    host.querySelector(".uiq-guidance-stages")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const outsideSibling = document.createElement("button");
    document.body.append(outsideSibling);
    outsideSibling.click();

    expect(onReview).not.toHaveBeenCalled();

    controls.dispose();
    outsideSibling.remove();
  });

  it("does not throw and does not invoke onReview when a click bubbles from a raw text node", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ revisionLabel: "Rev" }), onReview });

    const revisionTextNode = host.querySelector(".uiq-guidance-revision")!.firstChild!;
    expect(() => revisionTextNode.dispatchEvent(new MouseEvent("click", { bubbles: true }))).not.toThrow();
    expect(onReview).not.toHaveBeenCalled();

    controls.dispose();
  });
});

describe("mountGuidancePanel: controlled update, duplicate rejection, and reconciliation", () => {
  it("update never invokes onReview on its own", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview });

    controls.update(snapshot({ revisionLabel: "Revision 2" }));

    expect(onReview).not.toHaveBeenCalled();
    controls.dispose();
  });

  it("rejects a duplicate-id update before mutating the DOM, leaving prior notes intact", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("ok", "First note.") }] }),
      onReview: vi.fn(),
    });

    const dup = snapshot({
      notes: [
        { id: "dup", note: note("ok") },
        { id: "dup", note: note("warn") },
      ],
    });

    expect(() => controls.update(dup)).toThrow(/duplicate/i);
    expect(host.querySelectorAll(".uiq-guidance-note")).toHaveLength(1);
    expect(host.querySelector(".uiq-guidance-note-text")!.textContent).toBe("First note.");

    controls.dispose();
  });

  it("keeps a surviving note's action button and open detail node identity and open state across an update", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        notes: [{
          id: "n1",
          note: note("warn", "Original text."),
          detail: "Original detail.",
          action: { label: "Review", step: "measure" },
        }],
      }),
      onReview,
    });

    const button = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    const details = host.querySelector<HTMLDetailsElement>(".uiq-guidance-note-detail")!;
    details.open = true;
    button.focus();
    expect(document.activeElement).toBe(button);

    controls.update(snapshot({
      notes: [{
        id: "n1",
        note: note("warn", "Updated text."),
        detail: "Updated detail.",
        action: { label: "Review again", step: "measure" },
      }],
    }));

    expect(host.querySelector(".uiq-guidance-note-action")).toBe(button);
    expect(host.querySelector(".uiq-guidance-note-detail")).toBe(details);
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("Review again");
    expect(host.querySelector(".uiq-guidance-note-text")!.textContent).toBe("Updated text.");

    controls.dispose();
  });

  it("a synchronous controlled update called from inside the onReview callback still preserves node identity and focus", () => {
    const host = makeHost();
    let controls!: ReturnType<typeof mountGuidancePanel>;
    const onReview = vi.fn((action: GuidanceAction) => {
      controls.update(snapshot({
        notes: [{ id: "n1", note: note("warn"), action: { label: `${action.label} (seen)`, step: "measure" } }],
      }));
    });
    controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn"), action: { label: "Review", step: "measure" } }] }),
      onReview,
    });

    const button = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    button.focus();
    button.click();

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(host.querySelector(".uiq-guidance-note-action")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("Review (seen)");

    controls.dispose();
  });

  it("adds only a newly supplied note on update, leaving the existing note's node untouched", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "a", note: note("ok", "A") }] }),
      onReview: vi.fn(),
    });
    const firstNode = host.querySelector(".uiq-guidance-note")!;

    controls.update(snapshot({
      notes: [
        { id: "a", note: note("ok", "A") },
        { id: "b", note: note("info", "B") },
      ],
    }));

    const items = host.querySelectorAll(".uiq-guidance-note");
    expect(items).toHaveLength(2);
    expect(items[0]).toBe(firstNode);
    expect(items[1]!.querySelector(".uiq-guidance-note-text")!.textContent).toBe("B");

    controls.dispose();
  });

  it("removes only the note that disappears from the snapshot, keeping the remaining note's node", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        notes: [
          { id: "a", note: note("ok", "A") },
          { id: "b", note: note("info", "B") },
        ],
      }),
      onReview: vi.fn(),
    });
    const keptNode = host.querySelectorAll(".uiq-guidance-note")[1]!;

    controls.update(snapshot({ notes: [{ id: "b", note: note("info", "B") }] }));

    const items = host.querySelectorAll(".uiq-guidance-note");
    expect(items).toHaveLength(1);
    expect(items[0]).toBe(keptNode);

    controls.dispose();
  });

  it("reorders surviving note nodes in place without recreating them", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        notes: [
          { id: "a", note: note("ok", "A") },
          { id: "b", note: note("info", "B") },
        ],
      }),
      onReview: vi.fn(),
    });
    const [nodeA, nodeB] = Array.from(host.querySelectorAll(".uiq-guidance-note"));

    controls.update(snapshot({
      notes: [
        { id: "b", note: note("info", "B") },
        { id: "a", note: note("ok", "A") },
      ],
    }));

    const items = host.querySelectorAll(".uiq-guidance-note");
    expect(items[0]).toBe(nodeB);
    expect(items[1]).toBe(nodeA);

    controls.dispose();
  });

  it("makes no DOM move when a repeated update supplies notes in the same order", () => {
    const host = makeHost();
    const notesList = [
      { id: "a", note: note("ok", "A") },
      { id: "b", note: note("info", "B") },
    ];
    const controls = mountGuidancePanel(host, { snapshot: snapshot({ notes: notesList }), onReview: vi.fn() });
    const before = Array.from(host.querySelectorAll(".uiq-guidance-note"));

    controls.update(snapshot({ notes: notesList }));

    const after = Array.from(host.querySelectorAll(".uiq-guidance-note"));
    expect(after).toEqual(before);

    controls.dispose();
  });

  it("removing a note's action also removes its button, and removing its detail removes the disclosure", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({
        notes: [{
          id: "n1",
          note: note("warn"),
          detail: "Some detail.",
          action: { label: "Fix", step: "measure" },
        }],
      }),
      onReview: vi.fn(),
    });

    expect(host.querySelector(".uiq-guidance-note-action")).not.toBeNull();
    expect(host.querySelector(".uiq-guidance-note-detail")).not.toBeNull();

    controls.update(snapshot({ notes: [{ id: "n1", note: note("warn") }] }));

    expect(host.querySelector(".uiq-guidance-note-action")).toBeNull();
    expect(host.querySelector(".uiq-guidance-note-detail")).toBeNull();

    controls.dispose();
  });

  it("a removed action button cannot emit an obsolete request even if a caller still holds a reference to it", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn"), action: { label: "Fix", step: "measure" } }] }),
      onReview,
    });

    const staleButton = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    controls.update(snapshot({ notes: [] }));

    expect(staleButton.isConnected).toBe(false);
    staleButton.click();

    expect(onReview).not.toHaveBeenCalled();
    controls.dispose();
  });
});

describe("mountGuidancePanel: disposal", () => {
  it("dispose removes the root and is idempotent", () => {
    const host = makeHost();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview: vi.fn() });

    controls.dispose();
    expect(host.children).toHaveLength(0);

    expect(() => controls.dispose()).not.toThrow();
  });

  it("update after disposal is inert: it does not throw, mutate the DOM, or call onReview", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, { snapshot: snapshot(), onReview });

    controls.dispose();
    expect(() => controls.update(snapshot({ revisionLabel: "Should not render" }))).not.toThrow();
    expect(host.children).toHaveLength(0);
    expect(onReview).not.toHaveBeenCalled();
  });

  it("a detached control captured before disposal cannot emit a callback afterward", () => {
    const host = makeHost();
    const onReview = vi.fn();
    const controls = mountGuidancePanel(host, {
      snapshot: snapshot({ notes: [{ id: "n1", note: note("warn"), action: { label: "Fix", step: "measure" } }] }),
      onReview,
    });

    const button = host.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!;
    controls.dispose();
    button.click();

    expect(onReview).not.toHaveBeenCalled();
  });
});

describe("mountGuidancePanel: multiple simultaneous mounts", () => {
  it("gives repeated note ids from distinct mounts independent DOM state and callbacks", () => {
    const hostA = makeHost();
    const hostB = makeHost();
    const onReviewA = vi.fn();
    const onReviewB = vi.fn();

    const snapshotFor = (label: string) => snapshot({
      notes: [{ id: "n1", note: note("warn"), action: { label, step: "measure" } }],
    });

    const controlsA = mountGuidancePanel(hostA, { snapshot: snapshotFor("Fix A"), onReview: onReviewA });
    const controlsB = mountGuidancePanel(hostB, { snapshot: snapshotFor("Fix B"), onReview: onReviewB });

    hostA.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!.click();

    expect(onReviewA).toHaveBeenCalledTimes(1);
    expect(onReviewB).not.toHaveBeenCalled();

    controlsA.dispose();

    hostB.querySelector<HTMLButtonElement>(".uiq-guidance-note-action")!.click();
    expect(onReviewB).toHaveBeenCalledTimes(1);

    controlsB.dispose();
  });
});

describe("guidance-panel.css isolation", () => {
  const css = readFileSync("src/ui/enhancements/guidance/guidance-panel.css", "utf8");

  it("requires its own .uiq-guidance root for every selector, including modifiers, children, and nested rules", () => {
    const selectorLines = css
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("/*") && !line.startsWith("*")
        && !line.startsWith("@") && line.endsWith("{"));

    for (const line of selectorLines) {
      const selectorGroup = line.slice(0, -1).trim();
      for (const selector of selectorGroup.split(",")) {
        expect(selector.trim()).toMatch(/^\.uiq-guidance\b/);
      }
    }
  });

  it("never selects the foundation module's own class as this file's root", () => {
    expect(css).not.toMatch(/(?:^|\n)\s*\.uiq-foundation\s*\{/);
  });

  it("declares reduced-motion and forced-colors fallbacks", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (forced-colors: active)");
  });

  it("keeps native controls at the 44px minimum interactive target", () => {
    expect(css).toMatch(/\.uiq-guidance button \{[^}]*min-height: 44px/);
  });
});
