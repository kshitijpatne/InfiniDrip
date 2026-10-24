import { describe, expect, it } from "vitest";
import { FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID } from "../drafting/fitted";
import { getCaptureFieldDefinitions } from "./field-provenance";
import { guidedCapturePresetForEntry } from "./guided-capture-preset";
import { STARTER_REGISTRY, type StarterEntry } from "./starter-registry";

const sleeveDefinition = getCaptureFieldDefinitions("fitted").find((field) => field.inputKey === "sleeveLength")!;

function withF07Entry<T>(transform: (entry: StarterEntry) => StarterEntry, run: () => T): T {
  const entries = STARTER_REGISTRY.entries as unknown as StarterEntry[];
  const index = entries.findIndex((entry) => entry.entryId === FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID);
  const original = entries[index]!;
  entries[index] = transform(original);
  try {
    return run();
  } finally {
    entries[index] = original;
  }
}

describe("guided entry capture presets", () => {
  it("uses the F07 sleeve control default with explicit digital-only provenance", () => {
    expect(guidedCapturePresetForEntry(FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID, sleeveDefinition)).toMatchObject({
      label: "F07 sleeve digital preset",
      value: 38,
      valueText: "38 cm below the modeled cap base",
      sourceLabel: "F07 sleeve software preset; not measured wearer data",
      announcement: expect.stringContaining("It remains a software choice."),
    });
  });

  it("preserves the generic Standard M fallback outside F07 sleeve capture", () => {
    expect(guidedCapturePresetForEntry(null, sleeveDefinition)).toMatchObject({
      label: "Standard M digital preset",
      value: 22,
      valueText: "22 cm",
      sourceLabel: "Standard M digital preset; not measured wearer data",
    });
  });

  it("fails closed when F07 has no sleeve control", () => {
    expect(() => withF07Entry(
      (entry) => ({
        ...entry,
        supportedControls: entry.supportedControls.filter((control) => control.fieldId !== "sleeveLength"),
      }),
      () => guidedCapturePresetForEntry(FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID, sleeveDefinition),
    )).toThrow("F07 sleeve digital preset requires a sleeve control.");
  });

  it.each([null, Number.NaN])("fails closed when F07 has an invalid sleeve default: %s", (defaultValue) => {
    expect(() => withF07Entry(
      (entry) => ({
        ...entry,
        supportedControls: entry.supportedControls.map((control) => control.fieldId === "sleeveLength"
          ? { ...control, defaultValue }
          : control),
      }),
      () => guidedCapturePresetForEntry(FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID, sleeveDefinition),
    )).toThrow("F07 sleeve digital preset requires a finite registry default.");
  });
});
