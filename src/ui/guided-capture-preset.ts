import type { FieldDefinition } from "./field-provenance";
import { FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID } from "../drafting/fitted";
import { starterEntryById } from "./starter-registry";

export interface GuidedCapturePreset {
  readonly label: string;
  readonly valueText: string;
  readonly value: number;
  readonly sourceLabel: string;
  readonly announcement: string;
}

export function guidedCapturePresetForEntry(
  entryId: string | null | undefined,
  definition: FieldDefinition,
): GuidedCapturePreset {
  if (entryId === FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID && definition.inputKey === "sleeveLength") {
    const entry = starterEntryById(FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID);
    const control = entry?.supportedControls.find((candidate) => candidate.fieldId === "sleeveLength") ?? null;
    if (!control) throw new Error("F07 sleeve digital preset requires a sleeve control.");
    if (typeof control.defaultValue !== "number" || !Number.isFinite(control.defaultValue)) {
      throw new Error("F07 sleeve digital preset requires a finite registry default.");
    }
    return {
      label: "F07 sleeve digital preset",
      valueText: `${control.defaultValue} ${control.unit} below the modeled cap base`,
      value: control.defaultValue,
      sourceLabel: "F07 sleeve software preset; not measured wearer data",
      announcement: `F07 sleeve digital preset selected: ${control.defaultValue} ${control.unit} below the modeled cap base. It remains a software choice.`,
    };
  }
  return {
    label: "Standard M digital preset",
    valueText: `${definition.defaultValue} ${definition.unit}`,
    value: definition.defaultValue,
    sourceLabel: "Standard M digital preset; not measured wearer data",
    announcement: "Standard M digital preset selected. It remains labeled as a preset.",
  };
}
