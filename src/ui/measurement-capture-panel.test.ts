// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { getFieldDefinitions } from "./field-provenance";
import {
  addCaptureReadingForField,
  assessCaptureField,
  createMeasurementCaptureSession,
  selectCaptureReading,
} from "./measurement-capture";
import {
  MEASUREMENT_CAPTURE_PANEL_CLASS,
  measurementCapturePanelStatusText,
  renderMeasurementCapturePanel,
  type CapturePanelField,
  type CapturePanelReading,
  type MeasurementCapturePanelModel,
} from "./measurement-capture-panel";

const R1 = "d34a5104-ae25-4b54-9a2b-fcc35237ff71";
const R2 = "e78e0c40-ae1a-4d03-9470-80345f994734";
const R3 = "c200916f-baa3-4373-87f8-8d7481fb6053";
const TIME = "2026-09-26T08:00:00.000Z";
// jsdom has no layout engine, so color contrast is left to the live browser
// check; the fragment is audited against the WCAG A/AA rule sets.
const WCAG_AXE: axe.RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  rules: { "color-contrast": { enabled: false } },
};

const reading = (overrides: Partial<CapturePanelReading> = {}): CapturePanelReading => ({
  id: R1,
  rawValue: "100.25",
  enteredUnit: "cm",
  canonicalValue: 100.25,
  provenance: "USER_CAPTURED",
  evidenceStatus: "UNCONFIRMED",
  sourceLabel: "Value entered by user; capture technique not assessed",
  captureMethod: "Tape measure",
  capturedAt: TIME,
  measurer: "SELF",
  ...overrides,
});

const field = (overrides: Partial<CapturePanelField> = {}): CapturePanelField => ({
  fieldId: "body.chest-girth",
  label: "Chest",
  semanticKind: "BODY_MEASURE",
  referenceFrame: "body",
  unit: "cm",
  unitOptions: ["cm", "in"],
  meaning: "Supplied meaning text.",
  currentUse: "Supplied current-use text.",
  sourceCaveat: "Supplied caveat text.",
  guardrail: "Software guardrail 80–140 cm; not an industry limit.",
  draftRawValue: "",
  draftUnit: "cm",
  draftError: null,
  draftSourceNote: "",
  draftCaptureMethod: "",
  draftCaptureDate: "",
  draftMeasurer: "",
  readings: [],
  selectedReadingId: null,
  preset: null,
  state: "missing",
  correction: "Enter a value or explicitly accept the named digital preset.",
  ...overrides,
});

const model = (overrides: Partial<MeasurementCapturePanelModel> = {}): MeasurementCapturePanelModel => ({
  panelId: "guided-capture",
  heading: "Tee measurements",
  intro: "Enter what you know. Nothing is filled in for you.",
  fields: [field()],
  emptyMessage: null,
  announcement: null,
  ...overrides,
});

function mount(value: MeasurementCapturePanelModel): HTMLElement {
  document.body.innerHTML = renderMeasurementCapturePanel(value);
  return document.body;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const fieldItem = (root: HTMLElement, fieldId: string): HTMLElement =>
  root.querySelector<HTMLElement>(`li[data-field-id="${fieldId}"]`)!;

const allStatesModel = (): MeasurementCapturePanelModel => model({
  fields: [
    field({
      fieldId: "body.chest-girth", label: "Chest", state: "resolved", correction: null,
      readings: [reading()], selectedReadingId: R1,
    }),
    field({ fieldId: "body.shoulder-breadth", label: "Shoulder width", state: "missing" }),
    field({
      fieldId: "body.upper-arm-girth", label: "Bicep", state: "ambiguous",
      correction: "Choose one recorded value or add another reading.",
      readings: [reading({ id: R2, rawValue: "30", canonicalValue: 30 }), reading({ id: R3, rawValue: "32", canonicalValue: 32 })],
      selectedReadingId: null,
    }),
    field({
      fieldId: "target.top-hps-to-hem", label: "Length", semanticKind: "GARMENT_MEASURE", referenceFrame: "finished-garment",
      unitOptions: ["cm"], state: "invalid", draftRawValue: "seventy",
      correction: "Enter a finite numeric value; the original text stays visible.",
      readings: [reading({ rawValue: "seventy", canonicalValue: null, provenance: "USER_SELECTED" })], selectedReadingId: R1,
    }),
  ],
});

describe("measurement capture panel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders every field state in visible text with its own correction path", () => {
    const root = mount(allStatesModel());
    const expectations: Record<string, [string, string, string | null]> = {
      "body.chest-girth": ["resolved", "Ready", null],
      "body.shoulder-breadth": ["missing", "Missing — no value yet", "Enter a value or explicitly accept the named digital preset."],
      "body.upper-arm-girth": ["ambiguous", "Ambiguous — choose one reading", "Choose one recorded value or add another reading."],
      "target.top-hps-to-hem": ["invalid", "Invalid — needs correction", "Enter a finite numeric value; the original text stays visible."],
    };
    for (const [fieldId, [state, label, correction]] of Object.entries(expectations)) {
      const item = fieldItem(root, fieldId);
      expect(item.dataset.state).toBe(state);
      expect(item.querySelector(".measurement-capture-panel__state")!.textContent).toBe(`Status: ${label}`);
      const correctionNode = item.querySelector(".measurement-capture-panel__correction");
      if (correction === null) expect(correctionNode).toBeNull();
      else expect(correctionNode!.textContent).toBe(`To resolve: ${correction}`);
      const input = item.querySelector<HTMLInputElement>("input")!;
      expect(input.getAttribute("aria-invalid")).toBe(state === "invalid" ? "true" : null);
    }
    expect(root.querySelector('[role="status"]')!.textContent)
      .toBe("Ready: 1 of 4 fields. Needing attention: 3 (1 missing, 1 ambiguous, 1 invalid).");
  });

  it("separates kind, reference frame, meaning, current use, caveat and guardrail for each field", () => {
    const root = mount(model({ fields: [field({ semanticKind: "PATTERN_PARAMETER", referenceFrame: "pattern" })] }));
    const item = fieldItem(root, "body.chest-girth");
    expect(item.querySelector("legend")!.textContent).toBe("Chest");
    expect(item.querySelector(".measurement-capture-panel__kind")!.textContent)
      .toBe("Type: Pattern target · Refers to: the flat pattern");
    expect(item.querySelector(".measurement-capture-panel__meaning")!.textContent).toBe("What it means: Supplied meaning text.");
    expect(item.querySelector(".measurement-capture-panel__use")!.textContent).toBe("How the draft uses it: Supplied current-use text.");
    expect(item.querySelector(".measurement-capture-panel__caveat")!.textContent).toBe("Source and limits: Supplied caveat text.");
    expect(item.querySelector(".measurement-capture-panel__guardrail")!.textContent)
      .toBe("Range: Software guardrail 80–140 cm; not an industry limit.");

    const kinds: [CapturePanelField["semanticKind"], CapturePanelField["referenceFrame"], string][] = [
      ["BODY_MEASURE", "body", "Type: Body input · Refers to: the wearer's body"],
      ["GARMENT_MEASURE", "finished-garment", "Type: Finished-garment target · Refers to: the finished garment"],
      ["FINISHED_POM", "finished-garment", "Type: Derived output · Refers to: the finished garment"],
      ["STYLE_CONTROL", "design-control", "Type: Style control · Refers to: a design choice"],
    ];
    for (const [semanticKind, referenceFrame, text] of kinds) {
      mount(model({ fields: [field({ semanticKind, referenceFrame })] }));
      expect(document.querySelector(".measurement-capture-panel__kind")!.textContent).toBe(text);
    }
  });

  it("uses safe neutral fallbacks for missing or unknown copy and enum values", () => {
    const root = mount(model({
      heading: "  ", intro: " ",
      fields: [field({
        label: "", meaning: null, currentUse: "  ", sourceCaveat: null, guardrail: " ", correction: null,
        semanticKind: "MYSTERY" as never, referenceFrame: "elsewhere" as never, state: "stale" as never,
        readings: [reading({ provenance: "GUESSED" as never, evidenceStatus: "MAYBE" as never, measurer: "ROBOT" as never })],
        selectedReadingId: R1,
      })],
    }));
    expect(root.querySelector("h2")!.textContent).toBe("Measurements");
    expect(root.querySelector(".measurement-capture-panel__intro")).toBeNull();
    expect(root.querySelector("legend")!.textContent).toBe("Measurement field 1");
    expect(root.querySelector(".measurement-capture-panel__kind")!.textContent)
      .toBe("Type: Field type not specified · Refers to: not specified");
    expect(root.querySelector(".measurement-capture-panel__state")!.textContent).toBe("Status: Status unavailable — review this field");
    expect(root.querySelector(".measurement-capture-panel__meaning")!.textContent)
      .toBe("What it means: No explanation is available for this field yet.");
    expect(root.querySelector(".measurement-capture-panel__use")!.textContent)
      .toBe("How the draft uses it: How the current draft uses this value has not been described yet.");
    expect(root.querySelector(".measurement-capture-panel__caveat")!.textContent).toBe(
      "Source and limits: No source or qualification note is available for this field. A value is recorded as entered and is not confirmed.");
    expect(root.querySelector(".measurement-capture-panel__guardrail")).toBeNull();
    expect(root.querySelector(".measurement-capture-panel__correction")!.textContent).toBe("To resolve: Review this field before continuing.");
    expect(root.querySelector(".measurement-capture-panel__reading-details")!.textContent).toBe(
      "Source type not specified · Evidence status not specified · Source: Value entered by user; capture technique not assessed · " +
      "Method: Tape measure · Captured: 2026-09-26 (UTC) · Measured by: not specified");
    expect(root.querySelector('[role="status"]')!.textContent).toBe("Ready: 0 of 1 fields. Needing attention: 1.");
  });

  it("associates labels, descriptions and live status with unique ids that all resolve", async () => {
    const root = mount(allStatesModel());
    const ids = [...root.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of root.querySelectorAll("[aria-describedby], [aria-labelledby]")) {
      const refs = `${node.getAttribute("aria-describedby") ?? ""} ${node.getAttribute("aria-labelledby") ?? ""}`.trim().split(/\s+/);
      for (const ref of refs) expect(document.getElementById(ref), ref).not.toBeNull();
    }
    for (const control of Array.from(root.querySelectorAll("input, select")) as Array<HTMLInputElement | HTMLSelectElement>) {
      expect(control.labels).toHaveLength(1);
    }

    const chest = fieldItem(root, "body.chest-girth");
    const input = chest.querySelector<HTMLInputElement>("input")!;
    expect(input.id).toBe("guided-capture-f1-body-chest-girth-input");
    expect(input.labels![0].textContent).toBe("New reading for Chest");
    expect(input.type).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(input.getAttribute("aria-describedby")).toBe([
      "guided-capture-f1-body-chest-girth-kind", "guided-capture-f1-body-chest-girth-meaning",
      "guided-capture-f1-body-chest-girth-state",
    ].join(" "));
    const unit = chest.querySelector<HTMLSelectElement>('select[data-action="capture-change-unit"]')!;
    expect(unit.labels![0].textContent).toBe("Unit for Chest");
    expect([...unit.options].map((option) => [option.value, option.selected])).toEqual([["cm", true], ["in", false]]);

    const length = fieldItem(root, "target.top-hps-to-hem");
    expect(length.querySelector('select[data-action="capture-change-unit"]')).toBeNull();
    expect(length.querySelector("input")!.getAttribute("aria-describedby")).toBe([
      "guided-capture-f4-target-top-hps-to-hem-unit", "guided-capture-f4-target-top-hps-to-hem-kind",
      "guided-capture-f4-target-top-hps-to-hem-meaning", "guided-capture-f4-target-top-hps-to-hem-state",
      "guided-capture-f4-target-top-hps-to-hem-correction",
    ].join(" "));
    expect(document.getElementById("guided-capture-f4-target-top-hps-to-hem-unit")!.textContent).toBe("cm");

    const status = root.querySelector('[role="status"]')!;
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(root.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(1);
    const section = root.querySelector("section")!;
    expect(section.classList.contains(MEASUREMENT_CAPTURE_PANEL_CLASS)).toBe(true);
    expect(section.getAttribute("aria-labelledby")).toBe("guided-capture-title");

    const result = await axe.run(document.body, WCAG_AXE);
    expect(result.violations).toEqual([]);
  });

  it("exposes only data-action hooks with explicit button types and no inline handlers or styles", () => {
    const html = renderMeasurementCapturePanel(allStatesModel());
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).not.toMatch(/\sstyle=/i);
    const root = mount(allStatesModel());
    for (const button of root.querySelectorAll("button")) {
      expect(button.getAttribute("type")).toBe("button");
      expect(button.dataset.action).toBeTruthy();
      expect(button.dataset.fieldId).toBeTruthy();
    }
    for (const node of root.querySelectorAll("[data-action]")) {
      expect(["capture-edit-raw", "capture-change-unit", "capture-add-reading", "capture-select-reading", "capture-accept-preset",
        "capture-edit-source", "capture-edit-method", "capture-edit-date", "capture-change-measurer"])
        .toContain(node.getAttribute("data-action"));
    }
    const shoulder = fieldItem(root, "body.shoulder-breadth");
    expect(shoulder.querySelector('[data-action="capture-edit-raw"]')!.getAttribute("data-field-id")).toBe("body.shoulder-breadth");
    expect(shoulder.querySelector('[data-action="capture-change-unit"]')!.getAttribute("data-field-id")).toBe("body.shoulder-breadth");
    expect(shoulder.querySelector('[data-action="capture-add-reading"]')!.textContent).toBe("Add reading");
    expect(shoulder.querySelector('[data-action="capture-select-reading"]')).toBeNull();
    expect(shoulder.querySelector(".measurement-capture-panel__readings-empty")!.textContent).toBe("No readings recorded yet.");
    const bicepSelects = fieldItem(root, "body.upper-arm-girth").querySelectorAll<HTMLButtonElement>('[data-action="capture-select-reading"]');
    expect([...bicepSelects].map((button) => [button.dataset.fieldId, button.dataset.readingId, button.textContent]))
      .toEqual([["body.upper-arm-girth", R2, "Use reading 1"], ["body.upper-arm-girth", R3, "Use reading 2"]]);
  });

  it("keeps repeated readings separate, never averages them, and marks only the explicit selection", () => {
    const readings = [reading({ id: R2, rawValue: "30", canonicalValue: 30 }), reading({ id: R3, rawValue: "32", canonicalValue: 32 })];
    const ambiguous = mount(model({ fields: [field({ state: "ambiguous", readings, selectedReadingId: null })] }));
    const text = ambiguous.textContent!;
    expect(text).not.toContain("31");
    expect(text).toContain("Readings are kept separate and are never averaged. The draft uses only the reading you select.");
    expect([...ambiguous.querySelectorAll("button[aria-pressed]")].map((node) => node.getAttribute("aria-pressed"))).toEqual(["false", "false"]);
    expect(ambiguous.querySelector(".measurement-capture-panel__selected")).toBeNull();
    expect([...ambiguous.querySelectorAll(".measurement-capture-panel__reading-summary")].map((node) => node.textContent))
      .toEqual(["Reading 1: “30” cm", "Reading 2: “32” cm"]);

    const chosen = mount(model({ fields: [field({ state: "resolved", correction: null, readings, selectedReadingId: R3 })] }));
    const items = [...chosen.querySelectorAll<HTMLElement>(".measurement-capture-panel__reading")];
    expect(items.map((item) => [item.dataset.readingId, item.dataset.selected])).toEqual([[R2, "false"], [R3, "true"]]);
    expect(items[1].querySelector(".measurement-capture-panel__selected")!.textContent).toBe("Selected for the draft");
    expect(items[1].querySelector("button")!.getAttribute("aria-pressed")).toBe("true");
    expect(items[1].querySelector("button")!.getAttribute("aria-describedby")).toBe(`${items[1].id}-summary`);

    const single = mount(model({ fields: [field({ readings: [reading()], selectedReadingId: "not-recorded", state: "resolved" })] }));
    expect(single.textContent).not.toContain("never averaged");
    expect(single.querySelector("button[aria-pressed]")!.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows raw text exactly with units, conversions and optional reading details", () => {
    const root = mount(model({
      fields: [field({
        state: "invalid",
        readings: [
          reading({ id: R1, rawValue: "40.125", enteredUnit: "in", canonicalValue: 101.9175 }),
          reading({ id: R2, rawValue: "", canonicalValue: null, captureMethod: null, capturedAt: null, measurer: null, evidenceStatus: "CONFLICT" }),
          reading({ id: R3, rawValue: "12,5 ", canonicalValue: null, capturedAt: "sometime", measurer: "HELPER", evidenceStatus: "USER_CONFIRMED" }),
        ],
        selectedReadingId: R2,
      })],
    }));
    const summaries = [...root.querySelectorAll(".measurement-capture-panel__reading-summary")].map((node) => node.textContent);
    expect(summaries).toEqual([
      "Reading 1: “40.125” in = 101.9175 cm",
      "Reading 2: (blank) cm — not a usable number Selected for the draft",
      "Reading 3: “12,5 ” cm — not a usable number",
    ]);
    const details = [...root.querySelectorAll(".measurement-capture-panel__reading-details")].map((node) => node.textContent);
    expect(details[1]).toBe("Entered by you as a body input · Conflicting evidence · Source: Value entered by user; capture technique not assessed");
    expect(details[2]).toContain("Confirmed by you");
    expect(details[2]).toContain("Captured: sometime");
    expect(details[2]).toContain("Measured by: a helper");

    const unitless = mount(model({ fields: [field({
      unit: "", unitOptions: [], draftUnit: "", draftRawValue: "  7x ",
      readings: [reading({ rawValue: "4", enteredUnit: "", canonicalValue: 4, evidenceStatus: "SOURCE_CONFIRMED", measurer: "IMPORTED" })],
      selectedReadingId: R1, state: "resolved",
    })] }));
    expect(unitless.querySelector(".measurement-capture-panel__unit")!.textContent).toBe("no unit");
    expect(unitless.querySelector<HTMLInputElement>("input")!.value).toBe("  7x ");
    expect(unitless.querySelector(".measurement-capture-panel__reading-summary")!.textContent)
      .toBe("Reading 1: “4” no unit Selected for the draft");
    expect(unitless.querySelector(".measurement-capture-panel__reading-details")!.textContent).toContain("Confirmed against a source");
    expect(unitless.querySelector(".measurement-capture-panel__reading-details")!.textContent).toContain("Measured by: imported record");

    const other = mount(model({ fields: [field({ unitOptions: ["cm", "in"], draftUnit: "in",
      readings: [reading({ measurer: "OTHER" })], selectedReadingId: R1, state: "resolved" })] }));
    expect(other.querySelector<HTMLSelectElement>("select")!.value).toBe("in");
    expect(other.querySelector(".measurement-capture-panel__reading-details")!.textContent).toContain("Measured by: other");
  });

  it("shows a host-supplied draft-entry problem and marks the entry invalid", () => {
    const root = mount(model({ fields: [field({ state: "missing", draftRawValue: "12", draftError: "The unit does not match this field." })] }));
    const input = root.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")!.split(" ")).toContain("guided-capture-f1-body-chest-girth-draft-error");
    expect(document.getElementById("guided-capture-f1-body-chest-girth-draft-error")!.textContent)
      .toBe("Entry problem: The unit does not match this field.");

    const blank = mount(model({ fields: [field({ draftError: "  " })] }));
    expect(blank.querySelector(".measurement-capture-panel__draft-error")).toBeNull();
    expect(blank.querySelector("input")!.getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps optional source, method, date and recorder fields visibly labeled", async () => {
    const root = mount(model({ fields: [field({
      draftSourceNote: "User's notebook, page 4",
      draftCaptureMethod: "User's own method note",
      draftCaptureDate: "2026-09-25",
      draftMeasurer: "HELPER",
    })] }));
    const details = root.querySelector<HTMLDetailsElement>("details.measurement-capture-panel__optional-details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector<HTMLElement>("summary")!.textContent).toBe("Optional source details");
    const source = details.querySelector<HTMLInputElement>('[data-action="capture-edit-source"]')!;
    const method = details.querySelector<HTMLInputElement>('[data-action="capture-edit-method"]')!;
    const date = details.querySelector<HTMLInputElement>('[data-action="capture-edit-date"]')!;
    const measurer = details.querySelector<HTMLSelectElement>('[data-action="capture-change-measurer"]')!;
    expect(source.value).toBe("User's notebook, page 4");
    expect(method.value).toBe("User's own method note");
    expect(date.value).toBe("2026-09-25");
    expect(measurer.value).toBe("HELPER");
    expect([source, method, date, measurer].every((control) => control.labels?.length === 1)).toBe(true);
    const result = await axe.run(document.body, WCAG_AXE);
    expect(result.violations).toEqual([]);
  });

  it("offers presets only when supplied, explicitly as digital values that are not wearer measurements", () => {
    const withValue = mount(model({ fields: [field({ preset: { label: "Standard M digital preset", valueText: "100 cm" } })] }));
    const button = withValue.querySelector<HTMLButtonElement>('[data-action="capture-accept-preset"]')!;
    expect(button.type).toBe("button");
    expect(button.dataset.fieldId).toBe("body.chest-girth");
    expect(button.textContent).toBe("Use digital preset value");
    const details = document.getElementById(button.getAttribute("aria-describedby")!)!;
    expect(details.textContent).toBe("Digital preset — Standard M digital preset: 100 cm. " +
      "Digital starting value — not a measurement of the wearer. It stays labeled as a preset after you use it.");

    for (const valueText of [null, "  "]) {
      mount(model({ fields: [field({ preset: { label: "Standard M digital preset", valueText } })] }));
      expect(document.querySelector(".measurement-capture-panel__preset-details")!.textContent)
        .toMatch(/^Digital preset — Standard M digital preset\. Digital starting value/);
    }

    const none = mount(model());
    expect(none.querySelector('[data-action="capture-accept-preset"]')).toBeNull();
    expect(none.textContent).not.toContain("Digital preset");

    const accepted = mount(model({ fields: [field({
      state: "resolved", correction: null, selectedReadingId: R1,
      readings: [reading({ provenance: "PRESET", sourceLabel: "Standard M digital preset; not measured wearer data", captureMethod: null, capturedAt: null, measurer: null })],
    })] }));
    expect(accepted.querySelector(".measurement-capture-panel__reading-details")!.textContent)
      .toBe("Digital preset — not a measurement of the wearer · Unconfirmed · Source: Standard M digital preset; not measured wearer data");
  });

  it("escapes every dynamic string and attribute", () => {
    const evil = `"><img src=x onerror="alert(1)">&'<script>bad()</script>`;
    const html = renderMeasurementCapturePanel(model({
      panelId: evil, heading: evil, intro: evil, announcement: evil,
      fields: [field({
        fieldId: evil, label: evil, meaning: evil, currentUse: evil, sourceCaveat: evil, guardrail: evil,
        draftRawValue: evil, draftUnit: evil, draftError: evil, draftSourceNote: evil, draftCaptureMethod: evil,
        draftCaptureDate: evil, draftMeasurer: evil as never, unit: evil, unitOptions: [evil, "cm"],
        state: evil as never, correction: evil,
        preset: { label: evil, valueText: evil },
        readings: [reading({ id: evil, rawValue: evil, enteredUnit: evil, sourceLabel: evil, captureMethod: evil, capturedAt: evil })],
        selectedReadingId: evil,
      })],
    }));
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;&lt;script&gt;");
    document.body.innerHTML = html;
    expect(document.querySelector("img, script")).toBeNull();
    expect(document.querySelectorAll("[onerror]")).toHaveLength(0);
    const item = document.querySelector<HTMLElement>("li.measurement-capture-panel__field")!;
    expect(item.dataset.fieldId).toBe(evil);
    expect(item.dataset.state).toBe(evil);
    expect(document.querySelector("h2")!.textContent).toBe(evil);
    expect(document.querySelector("legend")!.textContent).toBe(evil);
    expect(document.querySelector<HTMLInputElement>("input")!.value).toBe(evil);
    expect(document.querySelector<HTMLSelectElement>("select")!.value).toBe(evil);
    expect(document.querySelector<HTMLElement>(".measurement-capture-panel__reading")!.dataset.readingId).toBe(evil);
    expect(document.querySelector<HTMLElement>('[data-action="capture-select-reading"]')!.dataset.readingId).toBe(evil);
    expect(document.querySelector(".measurement-capture-panel__reading-summary")!.textContent).toContain(`“${evil}”`);
    for (const node of document.querySelectorAll("[id]")) expect(node.id).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
    expect(document.querySelector("section")!.id).toBe("img-src-x-onerror-alert-1-script-bad-script");
  });

  it("renders an empty field list as a labeled status with no list or controls", async () => {
    const root = mount(model({ fields: [], emptyMessage: null, intro: null }));
    expect(root.querySelector("ol")).toBeNull();
    expect(root.querySelector("input, select, button")).toBeNull();
    expect(root.querySelector('[role="status"]')!.textContent).toBe("No measurement fields are available for this garment.");
    const result = await axe.run(document.body, WCAG_AXE);
    expect(result.violations).toEqual([]);

    mount(model({ fields: [], emptyMessage: "Choose a garment first.", announcement: "Garment cleared." }));
    expect(document.querySelector('[role="status"]')!.textContent).toBe("Garment cleared. Choose a garment first.");
  });

  it("summarizes readiness and host announcements for the live region", () => {
    const ready = model({ fields: [field({ state: "resolved" }), field({ fieldId: "x", state: "resolved" })] });
    expect(measurementCapturePanelStatusText(ready)).toBe("All fields are ready (2 of 2).");
    expect(measurementCapturePanelStatusText({ ...ready, announcement: "Reading added to Chest." }))
      .toBe("Reading added to Chest. All fields are ready (2 of 2).");
    expect(measurementCapturePanelStatusText({ ...ready, announcement: "   " })).toBe("All fields are ready (2 of 2).");
    expect(measurementCapturePanelStatusText(model({ fields: [field({ state: "missing" }), field({ fieldId: "y", state: "missing" })] })))
      .toBe("Ready: 0 of 2 fields. Needing attention: 2 (2 missing).");
  });

  it("derives stable, sanitized ids and falls back when a prefix or field id has no usable letters", () => {
    const html = renderMeasurementCapturePanel(model({ panelId: "", fields: [field({ fieldId: "..." }), field({ fieldId: "9-lives" })] }));
    expect(html).toBe(renderMeasurementCapturePanel(model({ panelId: "", fields: [field({ fieldId: "..." }), field({ fieldId: "9-lives" })] })));
    document.body.innerHTML = html;
    expect(document.querySelector("section")!.id).toBe("capture");
    expect(document.querySelector<HTMLInputElement>('input[data-action="capture-edit-raw"][data-field-id="..."]')!.id)
      .toBe("capture-f1-field-input");
    expect(document.querySelector<HTMLInputElement>('input[data-action="capture-edit-raw"][data-field-id="9-lives"]')!.id)
      .toBe("capture-f2-field-9-lives-input");
    mount(model({ panelId: "7 panel" }));
    expect(document.querySelector("section")!.id).toBe("capture-7-panel");
  });

  it("is pure: rendering a frozen model twice gives identical markup without mutation", () => {
    const frozen = deepFreeze(allStatesModel());
    const snapshot = JSON.stringify(frozen);
    const first = renderMeasurementCapturePanel(frozen);
    expect(renderMeasurementCapturePanel(frozen)).toBe(first);
    expect(JSON.stringify(frozen)).toBe(snapshot);
  });

  it("accepts capture-model sessions, readings and assessments without adaptation", () => {
    const session0 = createMeasurementCaptureSession("a02b8322-8f57-46bb-9d16-16ac1fcf6811", "tee", TIME);
    const chestId = "body.chest-girth";
    const input = {
      rawValue: "40.125", enteredUnit: "in", provenance: "USER_CAPTURED" as const, evidenceStatus: "UNCONFIRMED" as const,
      sourceLabel: "Value entered by user; capture technique not assessed", captureMethod: null, capturedAt: null, measurer: null,
    };
    const session1 = addCaptureReadingForField(session0, chestId, { ...input, id: R1 }, "2026-09-26T08:00:01.000Z");
    const session2 = addCaptureReadingForField(session1, chestId, { ...input, id: R2, rawValue: "abc", enteredUnit: "cm" }, "2026-09-26T08:00:02.000Z");
    const definitions = getFieldDefinitions("tee");
    const toPanel = (session: typeof session2): MeasurementCapturePanelModel => model({
      fields: session.fields.map((captureField) => {
        const definition = definitions.find((candidate) => candidate.id === captureField.fieldId)!;
        const assessment = assessCaptureField(captureField, session.recipeId);
        return field({
          fieldId: captureField.fieldId, label: definition.label, semanticKind: captureField.semanticKind,
          referenceFrame: definition.referenceFrame, unit: captureField.unit,
          unitOptions: captureField.unit === "cm" ? ["cm", "in"] : [captureField.unit],
          meaning: definition.meaning, currentUse: null, sourceCaveat: definition.captureBoundary, guardrail: null,
          readings: captureField.readings, selectedReadingId: captureField.selectedReadingId,
          state: assessment.state, correction: assessment.correction,
        });
      }),
    });
    const before = JSON.stringify(session2);
    const root = mount(toPanel(session2));
    expect(JSON.stringify(session2)).toBe(before);
    expect(root.querySelectorAll("li.measurement-capture-panel__field")).toHaveLength(session2.fields.length);
    const chest = fieldItem(root, chestId);
    expect(chest.dataset.state).toBe("ambiguous");
    expect([...chest.querySelectorAll(".measurement-capture-panel__reading-summary")].map((node) => node.textContent))
      .toEqual(["Reading 1: “40.125” in = 101.9175 cm", "Reading 2: “abc” cm — not a usable number"]);

    const session3 = selectCaptureReading(session2, chestId, R2, "2026-09-26T08:00:03.000Z");
    const invalid = fieldItem(mount(toPanel(session3)), chestId);
    expect(invalid.dataset.state).toBe("invalid");
    expect(invalid.querySelector(".measurement-capture-panel__correction")!.textContent)
      .toBe("To resolve: Enter a finite numeric value; the original text stays visible.");
    expect(invalid.querySelector(`[data-reading-id="${R2}"] .measurement-capture-panel__selected`)).not.toBeNull();
  });

  // jsdom has no layout engine, so viewport behavior itself is verified with a
  // rendered browser check; these tests pin the viewport-independent structural
  // classes and relationships that the narrow (320/390/700) and wide CSS rules
  // target, so a markup change cannot silently detach a breakpoint layout.
  it("keeps every field inside contained structural containers with no inline sizing", () => {
    const root = mount(allStatesModel());
    expect(root.querySelector("section.measurement-capture-panel")!.id).toBe("guided-capture");
    expect(root.querySelectorAll("ol.measurement-capture-panel__fields")).toHaveLength(1);
    const items = root.querySelectorAll("li.measurement-capture-panel__field");
    expect(items.length).toBe(4);
    for (const item of items) {
      expect(item.querySelector("fieldset.measurement-capture-panel__fieldset")).not.toBeNull();
      expect(item.querySelector("legend.measurement-capture-panel__legend")).not.toBeNull();
      expect(item.querySelector(".measurement-capture-panel__entry")).not.toBeNull();
      expect(item.querySelector(".measurement-capture-panel__readings")).not.toBeNull();
      expect(item.querySelector(".measurement-capture-panel__optional-details")).not.toBeNull();
    }
    expect(root.querySelectorAll("[width], [height]")).toHaveLength(0);
    const ids = [...root.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps entry controls usable for single-unit, multi-unit and unitless fields", () => {
    const root = mount(model({
      fields: [
        field({ fieldId: "single", label: "Single", unit: "cm", unitOptions: ["cm"], draftUnit: "cm" }),
        field({ fieldId: "multi", label: "Multi", unit: "cm", unitOptions: ["cm", "in"], draftUnit: "in" }),
        field({ fieldId: "unitless", label: `Unitless ${"name ".repeat(20)}`, unit: "", unitOptions: [], draftUnit: "" }),
      ],
    }));
    const items = [...root.querySelectorAll("li.measurement-capture-panel__field")];
    expect(items).toHaveLength(3);
    expect(items[0].querySelector("span.measurement-capture-panel__unit")).not.toBeNull();
    expect(items[0].querySelector(".measurement-capture-panel__entry select")).toBeNull();
    const unitSelect = items[1].querySelector<HTMLSelectElement>("select.measurement-capture-panel__unit-select")!;
    expect(unitSelect.labels).toHaveLength(1);
    expect(unitSelect.value).toBe("in");
    expect(items[2].querySelector(".measurement-capture-panel__unit")!.textContent).toBe("no unit");
    for (const item of items) {
      expect(item.querySelectorAll('.measurement-capture-panel__entry input[type="text"]')).toHaveLength(1);
      const add = item.querySelector<HTMLButtonElement>('[data-action="capture-add-reading"]')!;
      expect(add.type).toBe("button");
      expect(add.textContent).toBe("Add reading");
    }
    const ids = [...root.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps optional source controls grouped and labeled per field", () => {
    const root = mount(allStatesModel());
    const items = root.querySelectorAll("li.measurement-capture-panel__field");
    expect(items.length).toBeGreaterThan(1);
    for (const item of items) {
      const details = item.querySelector("details.measurement-capture-panel__optional-details")!;
      expect(details.querySelector("summary")!.textContent).toBe("Optional source details");
      const grid = details.querySelector(".measurement-capture-panel__optional-grid")!;
      expect(grid.querySelectorAll("label")).toHaveLength(4);
      for (const control of grid.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")) {
        expect(control.labels).toHaveLength(1);
      }
    }
  });

  it("keeps reading selection, conflict, correction and draft-error states understandable", () => {
    const root = mount(model({
      fields: [field({
        state: "ambiguous", draftRawValue: "12", draftError: "Choose a unit the field accepts.",
        correction: "Choose one recorded value or add another reading.",
        readings: [
          reading({ id: R1, rawValue: "30", canonicalValue: 30 }),
          reading({ id: R2, rawValue: "odd", canonicalValue: null, evidenceStatus: "CONFLICT" }),
        ],
        selectedReadingId: null,
      })],
    }));
    const item = root.querySelector("li.measurement-capture-panel__field")!;
    expect(item.querySelectorAll("li.measurement-capture-panel__reading")).toHaveLength(2);
    expect(item.querySelector(".measurement-capture-panel__never-averaged")!.textContent).toContain("never averaged");
    expect(item.querySelector(`[data-reading-id="${R2}"] .measurement-capture-panel__reading-details`)!.textContent)
      .toContain("Conflicting evidence");
    const error = item.querySelector(".measurement-capture-panel__draft-error")!;
    expect(error.textContent).toBe("Entry problem: Choose a unit the field accepts.");
    const input = item.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")!.split(" ")).toContain(error.id);
    expect(item.querySelector(".measurement-capture-panel__correction")!.textContent)
      .toBe("To resolve: Choose one recorded value or add another reading.");
    for (const button of item.querySelectorAll('[data-action="capture-select-reading"]')) {
      expect(button.textContent).toMatch(/^Use reading \d+$/);
      expect(button.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("keeps keyboard interaction on native controls with DOM order and no tabindex overrides", () => {
    const root = mount(allStatesModel());
    expect(root.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(root.querySelectorAll("div[role='button'], div[role='checkbox'], div[role='radio'], span[role='button']")).toHaveLength(0);
    const interactive = [...root.querySelectorAll("button, input, select, summary")];
    expect(interactive.length).toBeGreaterThan(0);
    for (const tag of interactive.map((node) => node.tagName)) {
      expect(["BUTTON", "INPUT", "SELECT", "SUMMARY"]).toContain(tag);
    }
    for (const control of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")) {
      expect(control.labels).toHaveLength(1);
    }
    for (const button of root.querySelectorAll("button")) {
      expect(button.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("announces through exactly one polite live region, including empty and announced states", () => {
    const announced = mount(model({ announcement: "Reading added to Chest." }));
    expect(announced.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(1);
    const status = announced.querySelector('[role="status"]')!;
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("Reading added to Chest. Ready: 0 of 1 fields. Needing attention: 1 (1 missing).");
    const empty = mount(model({ fields: [], emptyMessage: null }));
    expect(empty.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(1);
    expect(empty.querySelector('[role="status"]')!.textContent)
      .toBe("No measurement fields are available for this garment.");
    expect(empty.querySelector("section")!.getAttribute("aria-labelledby")).toBe("guided-capture-title");
  });
});
