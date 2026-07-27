// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  COACHED_STEPS, disclosureFor, stepView, journeyChecklist,
  journeyBarMarkup, checklistMarkup, welcomeMarkup, celebrationMarkup,
  loadJourney, saveJourney, FRESH_JOURNEY, JOURNEY_VERSION,
} from "./journey";

describe("COACHED_STEPS", () => {
  it("is the locked five-step spine, Start through Output", () => {
    expect(COACHED_STEPS.map((s) => s.id)).toEqual(
      ["start", "measure", "fit", "refine", "output"]);
  });

  it("coaches every step with a hint (contextual help on first encounter)", () => {
    for (const s of COACHED_STEPS) expect(s.hint.length).toBeGreaterThan(10);
  });
});

describe("disclosureFor — progressive disclosure", () => {
  it("start front-loads nothing", () => {
    const d = disclosureFor("start");
    expect(d.controls).toBe(false);
    expect(d.stretch).toBe(false);
    expect(d.style).toBe(false);
    expect(d.exports).toBe(false);
    expect(d.views).toHaveLength(0);
  });

  it("measure reveals the measurements panel and the pattern/body views only", () => {
    const d = disclosureFor("measure");
    expect(d.controls).toBe(true);
    expect(d.guidance).toBe(true);
    expect(d.views).toEqual(["pattern", "body"]);
    expect(d.exports).toBe(false);
    expect(d.style).toBe(false);
  });

  it("fit adds fabric and the style target, still no exports", () => {
    const d = disclosureFor("fit");
    expect(d.stretch).toBe(true);
    expect(d.style).toBe(true);
    expect(d.swatches).toBe(true);
    expect(d.exports).toBe(false);
  });

  it("refine unlocks Check and Edit, one click away", () => {
    expect(disclosureFor("refine").views).toEqual(["pattern", "body", "check", "edit"]);
    expect(disclosureFor("refine").exports).toBe(false);
  });

  it("output and done reveal everything, including exports", () => {
    for (const step of ["output", "done"] as const) {
      const d = disclosureFor(step);
      expect(d.views).toHaveLength(7);
      expect(d.exports).toBe(true);
    }
  });
});

describe("stepView", () => {
  it("lands measure on the body view and refine/output on the pattern", () => {
    expect(stepView("measure")).toBe("body");
    expect(stepView("refine")).toBe("pattern");
    expect(stepView("output")).toBe("pattern");
    expect(stepView("start")).toBeNull();
    expect(stepView("fit")).toBeNull();
    expect(stepView("done")).toBeNull();
  });
});

describe("journeyChecklist — honest progress", () => {
  it("ticks everything for a plausible, fitted, checked, exported design", () => {
    const items = journeyChecklist(true, 0, true, true);
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.done)).toBe(true);
  });

  it("never ticks the production row while measurements are implausible", () => {
    // geometry passes (checksOk) but the numbers are absurd — no green.
    const items = journeyChecklist(false, 0, true, false);
    expect(items[1].done).toBe(false);
    expect(items[3].done).toBe(false);
    expect(items[3].next).toContain("flagged");
  });

  it("counts open fit gaps as unfinished, with the next action named", () => {
    const items = journeyChecklist(true, 3, true, false);
    expect(items[2].done).toBe(false);
    expect(items[2].next).toContain("gap");
  });

  it("flips the export row once files are downloaded", () => {
    expect(journeyChecklist(true, 0, true, false)[4].done).toBe(false);
    expect(journeyChecklist(true, 0, true, true)[4].done).toBe(true);
  });
});

describe("journeyBarMarkup", () => {
  it("shows the active step's coach hint", () => {
    const html = journeyBarMarkup("measure");
    expect(html).toContain("amber outline");
    expect(html).toContain('id="journey-step-measure"');
  });

  it("offers Next but no Back on the first step", () => {
    const html = journeyBarMarkup("start");
    expect(html).toContain('id="journey-next"');
    expect(html).not.toContain('id="journey-back"');
  });

  it("offers Back but no Next on the last coached step", () => {
    const html = journeyBarMarkup("output");
    expect(html).toContain('id="journey-back"');
    expect(html).not.toContain('id="journey-next"');
  });

  it("keeps the skip escape hatch while touring, and drops it when done", () => {
    expect(journeyBarMarkup("fit")).toContain('id="journey-skip"');
    const done = journeyBarMarkup("done");
    expect(done).not.toContain('id="journey-skip"');
    expect(done).toContain("Tour complete");
  });
});

describe("checklistMarkup", () => {
  it("headlines the progress count", () => {
    const html = checklistMarkup(journeyChecklist(true, 0, true, false));
    expect(html).toContain("4 of 5");
  });

  it("shows a next action for undone rows only — no dead ends", () => {
    const html = checklistMarkup(journeyChecklist(true, 2, true, false));
    expect(html).toContain("Close the remaining gaps");
    expect(html).not.toContain("Switch any time"); // the done garment row hides its hint
  });
});

describe("welcomeMarkup", () => {
  it("coaches the first run and offers both start and skip", () => {
    const html = welcomeMarkup();
    expect(html).toContain('id="welcome-start"');
    expect(html).toContain('id="welcome-skip"');
    expect(html).toContain("five steps");
  });
});

describe("celebrationMarkup — the gated green", () => {
  it("reads green only when the measurements are plausible", () => {
    expect(celebrationMarkup(true)).toContain("✓ Files exported");
  });

  it("withholds the green tick while any input is implausible", () => {
    const html = celebrationMarkup(false);
    expect(html).not.toContain("✓");
    expect(html).toContain("review");
  });

  it("is dismissible either way", () => {
    expect(celebrationMarkup(true)).toContain('id="celebrate-dismiss"');
    expect(celebrationMarkup(false)).toContain('id="celebrate-dismiss"');
  });
});

describe("journey persistence", () => {
  beforeEach(() => localStorage.clear());

  it("starts fresh when nothing is stored", () => {
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
  });

  it("round-trips a saved state", () => {
    expect(saveJourney({ v: JOURNEY_VERSION, step: "refine", exported: true })).toBe(true);
    expect(loadJourney()).toEqual({ v: JOURNEY_VERSION, step: "refine", exported: true });
  });

  it("falls back to fresh on invalid JSON, wrong version, or a bad step", () => {
    localStorage.setItem("patternworks_journey_v1", "not json");
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
    localStorage.setItem("patternworks_journey_v1", JSON.stringify({ v: 99, step: "fit" }));
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
    localStorage.setItem("patternworks_journey_v1",
      JSON.stringify({ v: JOURNEY_VERSION, step: "teleport" }));
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
  });

  it("survives an unavailable storage: save reports false, load starts fresh", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(saveJourney(FRESH_JOURNEY)).toBe(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
    vi.restoreAllMocks();
  });

  it("coerces a missing exported flag to false", () => {
    localStorage.setItem("patternworks_journey_v1",
      JSON.stringify({ v: JOURNEY_VERSION, step: "done" }));
    expect(loadJourney().exported).toBe(false);
  });
});
