// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  COACHED_STEPS, disclosureFor, stepView, journeyChecklist,
  journeyBarMarkup, checklistMarkup, welcomeMarkup, celebrationMarkup,
  loadJourney, saveJourney, FRESH_JOURNEY, JOURNEY_VERSION,
  StageReadiness,
} from "./journey";

const readiness = (overrides: Partial<StageReadiness> = {}): StageReadiness => ({
  inputsOk: true,
  styleReviewed: true,
  checksOk: true,
  checkReviewed: true,
  exported: true,
  ...overrides,
});

const stageDocument = (html: string): Document =>
  new DOMParser().parseFromString(html, "text/html");

describe("COACHED_STEPS", () => {
  it("keeps the five stable IDs and product-facing labels", () => {
    expect(COACHED_STEPS.map((s) => s.id)).toEqual(
      ["start", "measure", "fit", "refine", "output"]);
    expect(COACHED_STEPS.map((s) => s.label)).toEqual(
      ["1 Garment", "2 Measure", "3 Style", "4 Check", "5 Export"]);
  });

  it("coaches every stage with concise, honest guidance", () => {
    for (const stage of COACHED_STEPS) {
      expect(stage.hint.length).toBeGreaterThan(10);
      expect(stage.hint).not.toContain("Tour complete");
    }
    expect(COACHED_STEPS[2].hint).toContain("physical fit");
    expect(COACHED_STEPS[4].hint).toContain("Digital checks");
  });
});

describe("disclosureFor — progressive disclosure", () => {
  it("returns the exact Garment-stage disclosure", () => {
    expect(disclosureFor("start")).toEqual({
      controls: false, stretch: false, style: false, guidance: false,
      swatches: false, exports: false, views: ["pattern", "body"],
    });
  });

  it("returns the exact Measure-stage disclosure", () => {
    expect(disclosureFor("measure")).toEqual({
      controls: true, stretch: false, style: false, guidance: true,
      swatches: false, exports: false, views: ["pattern", "body"],
    });
  });

  it("returns the exact Style-stage disclosure", () => {
    expect(disclosureFor("fit")).toEqual({
      controls: true, stretch: true, style: true, guidance: true,
      swatches: true, exports: false, views: ["pattern", "body"],
    });
  });

  it("gives Check every view without exposing editing controls", () => {
    expect(disclosureFor("refine")).toEqual({
      controls: false, stretch: false, style: false, guidance: true,
      swatches: false, exports: false,
      views: ["pattern", "body", "nest", "spec", "fabric", "check", "edit"],
    });
  });

  it("gives Export and legacy done the same exact disclosure", () => {
    const expected = {
      controls: false, stretch: false, style: false, guidance: true,
      swatches: false, exports: true,
      views: ["pattern", "body", "nest", "spec", "fabric", "check", "edit"],
    };
    expect(disclosureFor("output")).toEqual(expected);
    expect(disclosureFor("done")).toEqual(expected);
  });
});

describe("stepView", () => {
  it("lands every stage on its contract view", () => {
    expect(stepView("start")).toBe("pattern");
    expect(stepView("measure")).toBe("body");
    expect(stepView("fit")).toBe("body");
    expect(stepView("refine")).toBe("check");
    expect(stepView("output")).toBe("pattern");
    expect(stepView("done")).toBe("pattern");
  });
});

describe("journeyChecklist — readiness", () => {
  it("uses the exact five readiness labels and ticks a ready design", () => {
    const items = journeyChecklist(readiness());
    expect(items.map((item) => item.label)).toEqual([
      "Garment chosen", "Measurements valid", "Style reviewed",
      "Digital checks reviewed", "File confirmed",
    ]);
    expect(items.map((item) => item.done)).toEqual([true, true, true, true, true]);
  });

  it("does not infer readiness from stage position or fit-gap counts", () => {
    const items = journeyChecklist(readiness({
      inputsOk: false,
      styleReviewed: false,
      checksOk: true,
      checkReviewed: false,
      exported: false,
    }));
    expect(items.map((item) => item.done)).toEqual([true, false, false, false, false]);
    expect(items[1].next).toContain("Measure stage");
    expect(items[2].next).toContain("Style stage");
    expect(items[3].next).toContain("Check stage");
    expect(items[4].next).toContain("Export stage");
    expect(items[2].next).not.toContain("gap");
    expect(items.map((item) => item.label).join(" ")).not.toContain("Target fit reached");
  });

  it("requires both a passing check and an explicit check review", () => {
    expect(journeyChecklist(readiness({ checksOk: false })).map((item) => item.done)[3]).toBe(false);
    expect(journeyChecklist(readiness({ checkReviewed: false })).map((item) => item.done)[3]).toBe(false);
    expect(journeyChecklist(readiness({ checksOk: true, checkReviewed: true })).map((item) => item.done)[3]).toBe(true);
    expect(journeyChecklist(readiness({ checksOk: false }))[3].next).toContain("Fix");
    expect(journeyChecklist(readiness({ checksOk: true, checkReviewed: false }))[3].next).toContain("Review");
  });
});

describe("journeyBarMarkup", () => {
  it("renders five revisitable stage buttons with one current stage", () => {
    const document = stageDocument(journeyBarMarkup("measure", readiness({ exported: false })));
    const stages = [...document.querySelectorAll<HTMLButtonElement>(".journey-stage")];
    expect(stages).toHaveLength(5);
    expect(stages.map((button) => button.id)).toEqual([
      "journey-step-start", "journey-step-measure", "journey-step-fit",
      "journey-step-refine", "journey-step-output",
    ]);
    expect(stages.every((button) => button.type === "button")).toBe(true);
    expect(stages.filter((button) => button.getAttribute("aria-current") === "step")).toHaveLength(1);
    expect(document.querySelector("#journey-step-measure")?.getAttribute("aria-current")).toBe("step");
    expect(document.querySelector("#journey-step-start")?.textContent).toBe("1 Garment");
    expect(document.querySelector("#journey-step-start")?.getAttribute("aria-label")).toBe("1 Garment — complete");
    expect(document.querySelector("#journey-step-measure")?.getAttribute("aria-label")).toBe("2 Measure — current stage");
  });

  it("marks completion from readiness, not from the current index", () => {
    const document = stageDocument(journeyBarMarkup("refine", readiness({
      inputsOk: false,
      styleReviewed: false,
      checksOk: false,
      checkReviewed: true,
      exported: false,
    })));
    const state = (id: string): string | null => document.querySelector(`#journey-step-${id}`)?.getAttribute("data-stage-state") ?? null;
    expect(state("start")).toBe("complete");
    expect(state("measure")).toBe("pending");
    expect(state("fit")).toBe("pending");
    expect(state("refine")).toBe("active");
    expect(state("output")).toBe("pending");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
    expect(document.querySelector("#journey-step-start")?.getAttribute("aria-label")).toBe("1 Garment — complete");
    expect(document.querySelector("#journey-step-measure")?.getAttribute("aria-label")).toBe("2 Measure");
  });

  it("maps legacy done to the visible Export stage without tour-complete badges", () => {
    const document = stageDocument(journeyBarMarkup("done", readiness({
      inputsOk: false, styleReviewed: false, checksOk: false, checkReviewed: false, exported: false,
    })));
    expect(document.querySelector("#journey-step-output")?.getAttribute("aria-current")).toBe("step");
    expect(document.querySelector("#journey-step-output")?.getAttribute("data-stage-state")).toBe("active");
    expect(document.querySelector("#journey-step-output")?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelector("#journey-step-measure")?.getAttribute("data-stage-state")).toBe("pending");
    expect(document.body.textContent).not.toContain("Tour complete");
    expect(document.body.textContent).not.toContain("done");
  });

  it("gates only the Export chip on the full export readiness contract", () => {
    const missing: (keyof StageReadiness)[] = [
      "inputsOk", "styleReviewed", "checksOk", "checkReviewed",
    ];
    for (const key of missing) {
      const document = stageDocument(journeyBarMarkup("refine", readiness({ [key]: false })));
      expect(document.querySelector("#journey-step-output")?.hasAttribute("disabled")).toBe(true);
    }
    const ready = stageDocument(journeyBarMarkup("refine", readiness({ exported: false })));
    expect(ready.querySelector("#journey-step-output")?.hasAttribute("disabled")).toBe(false);
    expect(ready.querySelector("#journey-step-output")?.getAttribute("data-stage-state")).toBe("pending");
    const exported = stageDocument(journeyBarMarkup("refine", readiness()));
    expect(exported.querySelector("#journey-step-output")?.getAttribute("data-stage-state")).toBe("complete");
  });

  it("keeps Back/Next routes compact and stage-aware", () => {
    const start = stageDocument(journeyBarMarkup("start", readiness({ exported: false })));
    expect(start.querySelector("#journey-back")).toBeNull();
    expect(start.querySelector("#journey-next")).not.toBeNull();
    expect(start.querySelector<HTMLButtonElement>("#journey-next")?.type).toBe("button");
    const output = stageDocument(journeyBarMarkup("output", readiness()));
    expect(output.querySelector("#journey-back")).not.toBeNull();
    expect(output.querySelector("#journey-next")).toBeNull();
    expect(output.querySelector(".journey-current-stage")?.textContent).toContain("5 Export");
    expect(output.querySelector(".journey-current-hint")?.textContent).toContain("Choose a size");
  });

  it("explains a blocked Next and provides an escaped correction route", () => {
    const blocker = {
      message: "Review <waist> & \"ease\" before continuing.",
      step: "measure" as const,
      field: "waist\"<raw>",
    };
    const document = stageDocument(journeyBarMarkup("fit", readiness(), blocker));
    const next = document.querySelector<HTMLButtonElement>("#journey-next");
    const correction = document.querySelector<HTMLButtonElement>("#journey-correction");
    expect(next?.disabled).toBe(true);
    expect(next?.getAttribute("aria-describedby")).toBe("journey-blocker");
    expect(document.querySelector("#journey-blocker")?.textContent).toBe(blocker.message);
    expect(document.querySelector("#journey-blocker")?.innerHTML).not.toContain("<waist>");
    expect(correction?.dataset.correctionStep).toBe("measure");
    expect(correction?.dataset.correctionField).toBe(blocker.field);
    expect(correction?.textContent).toBe("Review in Measure");
  });

  it("supports correction routes without a field and leaves unblocked Next enabled", () => {
    const blocked = stageDocument(journeyBarMarkup("refine", readiness(), {
      message: "Inspect the digital checks.", step: "done",
    }));
    const correction = blocked.querySelector<HTMLButtonElement>("#journey-correction");
    expect(correction?.textContent).toBe("Review in Export");
    expect(correction?.hasAttribute("data-correction-field")).toBe(false);

    const clear = stageDocument(journeyBarMarkup("fit", readiness()));
    expect(clear.querySelector("#journey-blocker")).toBeNull();
    expect(clear.querySelector<HTMLButtonElement>("#journey-next")?.disabled).toBe(false);
    expect(clear.querySelector("#journey-next")?.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("checklistMarkup", () => {
  it("renders generic completed and unfinished rows with their named actions", () => {
    const html = checklistMarkup(journeyChecklist(readiness({
      inputsOk: false, styleReviewed: false, checksOk: true, checkReviewed: false, exported: false,
    })));
    expect(html).toContain("1 of 5");
    expect(html).toContain("Review flagged inputs in the Measure stage.");
    expect(html).toContain("Review the current choices in the Style stage.");
    expect(html).toContain("Confirm a file export in the Export stage.");
    expect(html).toContain("is-complete");
    expect(html).not.toContain("Target fit reached");
  });

  it("does not add next-action copy to completed rows", () => {
    const html = checklistMarkup([{ label: "Ready", done: true, next: "Should stay hidden" }]);
    expect(html).toContain("Ready");
    expect(html).not.toContain("Should stay hidden");
  });
});

describe("welcomeMarkup", () => {
  it("keeps compact beginner copy and both familiarity actions", () => {
    const document = stageDocument(welcomeMarkup());
    expect(document.querySelector("#welcome-start")?.textContent).toBe("Start designing");
    expect(document.querySelector("#welcome-skip")?.textContent).toBe("Skip introduction");
    expect(document.querySelectorAll("button")).toHaveLength(2);
    expect([...document.querySelectorAll<HTMLButtonElement>("button")].every((button) => button.type === "button")).toBe(true);
    expect(document.body.textContent).toContain("five stages");
    expect(document.body.textContent).toContain("physical fit");
    expect(document.body.textContent).not.toContain("unlock");
  });
});

describe("celebrationMarkup — digital confirmation only", () => {
  it("keeps the positive confirmation explicit about physical validation", () => {
    const document = stageDocument(celebrationMarkup(true));
    expect(document.querySelector("#journey-celebration")?.textContent).toContain("✓ Files exported");
    expect(document.body.textContent).toContain("physical fit still needs validation");
    expect(document.body.textContent).not.toContain("manufacturing ready");
    expect(document.querySelector("#celebrate-dismiss")?.getAttribute("type")).toBe("button");
  });

  it("withholds the green tick while inputs need review", () => {
    const html = celebrationMarkup(false);
    expect(html).not.toContain("✓");
    expect(html).toContain("flagged inputs still need review");
    expect(html).toContain("physical fit still needs validation");
  });
});

describe("journey persistence", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts fresh when nothing is stored", () => {
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
  });

  it("normalizes every saved state to v2 while keeping the storage key", () => {
    expect(saveJourney({ v: 1, step: "refine", exported: true })).toBe(true);
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!)).toEqual({
      v: JOURNEY_VERSION, step: "refine", exported: true, familiar: false,
    });
    expect(loadJourney()).toEqual({
      v: JOURNEY_VERSION, step: "refine", exported: false, familiar: false,
    });
    expect(saveJourney({ v: 99, step: "done", exported: false, familiar: true })).toBe(true);
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!)).toEqual({
      v: JOURNEY_VERSION, step: "done", exported: false, familiar: true,
    });
  });

  it("normalizes malformed runtime state without treating it as familiar", () => {
    expect(saveJourney({ v: JOURNEY_VERSION, step: "teleport" as never, exported: true })).toBe(true);
    expect(JSON.parse(localStorage.getItem("patternworks_journey_v1")!)).toEqual({
      v: JOURNEY_VERSION, step: "start", exported: true, familiar: false,
    });
  });

  it("migrates v1 done/output and preserves other steps", () => {
    const cases = [
      [{ v: 1, step: "done", exported: true }, { v: 2, step: "measure", exported: false, familiar: true }],
      [{ v: 1, step: "output", exported: true }, { v: 2, step: "refine", exported: false, familiar: true }],
      [{ v: 1, step: "start", exported: true }, { v: 2, step: "start", exported: false, familiar: false }],
      [{ v: 1, step: "fit", exported: true }, { v: 2, step: "fit", exported: false, familiar: true }],
    ] as const;
    for (const [stored, expected] of cases) {
      localStorage.setItem("patternworks_journey_v1", JSON.stringify(stored));
      expect(loadJourney()).toEqual(expected);
    }
  });

  it("reloads v2 output/done at Check and retains v2 familiarity elsewhere", () => {
    for (const step of ["output", "done"] as const) {
      localStorage.setItem("patternworks_journey_v1", JSON.stringify({
        v: 2, step, exported: true, familiar: true,
      }));
      expect(loadJourney()).toEqual({ v: 2, step: "refine", exported: false, familiar: true });
    }
    localStorage.setItem("patternworks_journey_v1", JSON.stringify({
      v: 2, step: "fit", exported: true, familiar: false,
    }));
    expect(loadJourney()).toEqual({ v: 2, step: "fit", exported: false, familiar: false });
    localStorage.setItem("patternworks_journey_v1", JSON.stringify({
      v: 2, step: "measure", exported: false, familiar: true,
    }));
    expect(loadJourney()).toEqual({ v: 2, step: "measure", exported: false, familiar: true });
  });

  it("always clears historical export confirmation on load", () => {
    for (const v of [1, 2] as const) {
      localStorage.setItem("patternworks_journey_v1", JSON.stringify({
        v, step: "refine", exported: true, familiar: true,
      }));
      expect(loadJourney().exported).toBe(false);
    }
  });

  it("falls back to fresh for corrupt, primitive, or schema-invalid saves", () => {
    const invalidValues: unknown[] = [
      "not json",
      JSON.stringify(null),
      JSON.stringify([]),
      JSON.stringify("journey"),
      JSON.stringify(42),
      JSON.stringify({ v: 99, step: "fit" }),
      JSON.stringify({ v: 2, step: "teleport" }),
      JSON.stringify({ v: 2, step: "fit", exported: "yes" }),
      JSON.stringify({ v: 2, step: "fit", familiar: "yes" }),
    ];
    for (const value of invalidValues) {
      localStorage.setItem("patternworks_journey_v1", String(value));
      expect(loadJourney()).toEqual(FRESH_JOURNEY);
    }
  });

  it("accepts missing legacy flags as false", () => {
    localStorage.setItem("patternworks_journey_v1", JSON.stringify({ v: 2, step: "start" }));
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
    localStorage.setItem("patternworks_journey_v1", JSON.stringify({ v: 1, step: "start" }));
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
  });

  it("survives unavailable storage for both save and load", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(saveJourney(FRESH_JOURNEY)).toBe(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    expect(loadJourney()).toEqual(FRESH_JOURNEY);
  });
});
