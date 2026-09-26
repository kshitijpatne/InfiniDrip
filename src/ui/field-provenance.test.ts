import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE } from "./appearance";
import { GARMENTS, STANDARD_M, defaultGarmentOptions, type GarmentRecipe } from "../drafting";
import { DEFAULT_WORKSPACE, deserializeRecovery, serialize, serializeRecovery } from "./persist";
import { migrateLegacySaveFile, type RecoveryPayload, type StyleRecord } from "./project-records";
import {
  appendRecoveryFieldObservations,
  assertRecipeFieldCoverage,
  createFieldObservationRecord,
  currentFieldObservation,
  fieldDefinitionById,
  getAllFieldDefinitions,
  getFieldDefinition,
  getFieldDefinitions,
  isKnownFieldProvenance,
  parseFieldObservationRecord,
  reconcileDesignFieldObservations,
  remapFieldObservationStyleId,
} from "./field-provenance";

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const TIME = "2026-09-24T16:00:00.000Z";
const FABRIC = "#3A4150";

function styleFor(recipeId = "tee"): StyleRecord {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const workspace = {
    ...DEFAULT_WORKSPACE,
    garment: recipe.name,
    targetStyle: recipe.styles[0].name,
  };
  const result = migrateLegacySaveFile({
    json: serialize(STANDARD_M, FABRIC, { [recipe.name]: defaultGarmentOptions(recipe.options ?? []) }, workspace, DEFAULT_APPEARANCE),
    projectId: PROJECT_ID,
    styleId: STYLE_ID,
    migratedAt: TIME,
  });
  if (!result.ok) throw new Error(result.error);
  return result.value.style;
}

function recoveryFor(style: StyleRecord, changes: {
  readonly rawMeasurements?: Record<string, string>;
  readonly measurements?: Record<string, number | null>;
  readonly rawOptions?: Record<string, Record<string, string>>;
} = {}): RecoveryPayload {
  const payload = {
    savedAt: 1_790_259_200_000,
    measurements: { ...style.design.measurements, ...changes.measurements },
    rawMeasurements: changes.rawMeasurements ?? {},
    fabric: style.design.fabric,
    appearance: style.design.appearance,
    garmentOptions: style.design.garmentOptions,
    rawOptions: changes.rawOptions ?? {},
    workspace: style.design.workspace,
    materialSelectionExplicit: true,
    surface: style.design.surface,
    rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
  };
  const parsed = deserializeRecovery(serializeRecovery(payload));
  if (!parsed.ok) throw new Error(parsed.error);
  const { ok: _ok, ...recovery } = parsed;
  return recovery;
}

describe("C03 field definitions and append-only observations", () => {
  it("covers every editable input exactly once across all seven current recipes", () => {
    expect(GARMENTS).toHaveLength(7);
    expect(() => assertRecipeFieldCoverage()).not.toThrow();
    expect(getAllFieldDefinitions().length).toBe(
      GARMENTS.reduce((sum, recipe) => sum + recipe.fields.length + (recipe.options?.length ?? 0), 0),
    );
    for (const recipe of GARMENTS) {
      const definitions = getFieldDefinitions(recipe.name);
      expect(new Set(definitions.map(({ inputKind, inputKey }) => `${inputKind}/${inputKey}`)).size).toBe(definitions.length);
      expect(definitions.every((definition) => definition.recipeId === recipe.name)).toBe(true);
    }
  });

  it("distinguishes body, finished-garment, pattern, and style-control meanings from C03", () => {
    expect(getFieldDefinition("tee", "chest")?.semanticKind).toBe("BODY_MEASURE");
    expect(getFieldDefinition("tee", "length")?.semanticKind).toBe("GARMENT_MEASURE");
    expect(getFieldDefinition("woven-shirt", "armholeDepth")).toMatchObject({
      semanticKind: "PATTERN_PARAMETER",
      label: "Target underarm drop",
      referenceFrame: "pattern",
    });
    expect(getFieldDefinition("trouser", "thigh")).toMatchObject({
      semanticKind: "GARMENT_MEASURE",
      label: "Target finished thigh girth",
    });
    expect(getFieldDefinition("trouser", "knee")?.semanticId).toBe("target.finished-knee-girth");
    expect(getFieldDefinition("tee", "ease")?.semanticKind).toBe("STYLE_CONTROL");
    expect(getFieldDefinition("tank", "strapWidth")?.semanticKind).toBe("STYLE_CONTROL");
    expect(getFieldDefinition("tee", "chest")?.limitBasis).toBe("existing-ui-guardrail-not-industry-standard");
  });

  it("records first-run defaults as presets and legacy values as unresolved, without confidence claims", () => {
    const style = styleFor();
    expect(() => createFieldObservationRecord(style, "yesterday", "first-run-default"))
      .toThrow("canonical UTC ISO time");
    const preset = createFieldObservationRecord(style, TIME, "first-run-default");
    const chest = currentFieldObservation(preset, getFieldDefinition("tee", "chest")!);
    expect(chest).toMatchObject({
      rawValue: "100",
      canonicalValue: 100,
      provenance: "PRESET",
      evidenceStatus: "UNCONFIRMED",
      confidence: "NOT_ASSESSED",
      recordedAt: TIME,
    });
    const imported = createFieldObservationRecord(style, TIME, "legacy-save");
    expect(currentFieldObservation(imported, getFieldDefinition("tee", "chest")!)).toMatchObject({
      provenance: "UNRESOLVED",
      sourceLabel: expect.stringContaining("original value source"),
      recordedAt: null,
      canonicalValue: 100,
    });
    expect(getFieldDefinition("tee", "chest")?.defaultValue).toBe(STANDARD_M.chest);
  });

  it("appends raw user edits without clamping invalid values or mutating previous history", () => {
    const style = styleFor();
    const original = createFieldObservationRecord(style, TIME, "first-run-default");
    const next = appendRecoveryFieldObservations(original, style, recoveryFor(style, {
      measurements: { chest: 176.25 },
      rawMeasurements: { chest: "176.250" },
    }), "2026-09-24T16:00:01.000Z", {
      recipeId: "tee", inputKind: "measurement", inputKey: "chest",
    });
    const chest = currentFieldObservation(next, getFieldDefinition("tee", "chest")!);
    expect(chest).toMatchObject({
      revision: original.revision + 1,
      rawValue: "176.250",
      canonicalValue: 176.25,
      provenance: "USER_CAPTURED",
      validationStatus: "INVALID",
      evidenceStatus: "UNCONFIRMED",
      confidence: "NOT_ASSESSED",
    });
    expect(original.observations).toHaveLength(getFieldDefinitions("tee").length);
    expect(original.observations[original.observations.length - 1]?.revision).toBe(original.revision);
    expect(parseFieldObservationRecord(next).ok).toBe(true);
  });

  it("keeps semantic changes unresolved when a shared legacy input changes meaning between recipes", () => {
    const tee = styleFor("tee");
    const original = createFieldObservationRecord(tee, TIME, "existing-local-style");
    const skirt = styleFor("skirt");
    const changedRecipe: StyleRecord = {
      ...tee,
      recipeId: "skirt",
      recipePresetId: skirt.recipePresetId,
      design: { ...tee.design, workspace: skirt.design.workspace },
    };
    const next = appendRecoveryFieldObservations(original, changedRecipe,
      recoveryFor(changedRecipe, { rawMeasurements: { length: "70" } }), "2026-09-24T16:00:01.000Z");
    expect(currentFieldObservation(next, getFieldDefinition("skirt", "length")!)).toMatchObject({
      fieldId: "target.skirt-waistline-to-hem",
      semanticKind: "GARMENT_MEASURE",
      provenance: "UNRESOLVED",
      validationStatus: "VALID",
    });
    expect(currentFieldObservation(next, getFieldDefinition("skirt", "waist")!)).toMatchObject({
      provenance: "UNRESOLVED",
      sourceLabel: expect.stringContaining("field-specific user edit was not recorded"),
    });
  });

  it("reconciles the saved canonical value and rejects unknown or contradictory records", () => {
    const style = styleFor();
    const original = createFieldObservationRecord(style, TIME, "legacy-save");
    const updatedStyle: StyleRecord = {
      ...style,
      revision: 2,
      design: { ...style.design, measurements: { ...style.design.measurements, chest: 101 } },
    };
    const saved = reconcileDesignFieldObservations(original, updatedStyle, updatedStyle.design, "2026-09-24T16:00:01.000Z");
    expect(currentFieldObservation(saved, getFieldDefinition("tee", "chest")!)).toMatchObject({
      canonicalValue: 101,
      rawValue: "101",
      provenance: "UNRESOLVED",
      styleRevision: 2,
    });
    const typed = appendRecoveryFieldObservations(saved, updatedStyle, recoveryFor(updatedStyle, {
      measurements: { chest: 101 }, rawMeasurements: { chest: "101" },
    }), "2026-09-24T16:00:02.000Z", {
      recipeId: "tee", inputKind: "measurement", inputKey: "chest",
    });
    expect(currentFieldObservation(typed, getFieldDefinition("tee", "chest")!)).toMatchObject({
      revision: saved.revision + 1,
      rawValue: "101",
      provenance: "USER_CAPTURED",
    });
    expect(parseFieldObservationRecord({ ...saved, unexpected: true }).ok).toBe(false);
    expect(parseFieldObservationRecord(null).ok).toBe(false);
    const tampered = structuredClone(saved) as unknown as { observations: Array<Record<string, unknown>> };
    tampered.observations[0]!.unit = "inches";
    expect(parseFieldObservationRecord(tampered).ok).toBe(false);
    const contradictoryValue = structuredClone(saved) as unknown as { observations: Array<Record<string, unknown>> };
    contradictoryValue.observations[0]!.canonicalValue = 41;
    expect(parseFieldObservationRecord(contradictoryValue).ok).toBe(false);
    expect(remapFieldObservationStyleId(saved, "c502163f-10be-4dce-89c9-35de897e9814").styleId)
      .toBe("c502163f-10be-4dce-89c9-35de897e9814");
  });

  it("rejects malformed record identities, histories, and observation fields", () => {
    const original = createFieldObservationRecord(styleFor(), TIME, "first-run-default");
    const invalidRecords: Array<(record: Record<string, unknown>) => void> = [
      (record) => { record.schemaVersion = 99; },
      (record) => { record.definitionVersion = 99; },
      (record) => { record.styleId = "not-a-uuid"; },
      (record) => { record.revision = -1; },
      (record) => { record.updatedAt = "yesterday"; },
      (record) => { record.observations = null; },
      (record) => { record.observations = Array.from({ length: 100_001 }, () => ({})); },
      (record) => { record.revision = (record.revision as number) + 1; },
    ];
    for (const mutate of invalidRecords) {
      const candidate = structuredClone(original) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(parseFieldObservationRecord(candidate).ok).toBe(false);
    }

    const invalidEntries: Array<(entry: Record<string, unknown>, record: Record<string, unknown>) => void> = [
      (entry) => { entry.extra = true; },
      (entry) => { entry.revision = "1"; },
      (entry) => { entry.fieldId = "unknown-field"; },
      (entry) => { entry.definitionVersion = 99; },
      (entry) => { entry.semanticKind = "UNKNOWN"; },
      (entry) => { entry.rawValue = "1".repeat(4097); },
      (entry) => { entry.rawValue = 1; },
      (entry) => { entry.canonicalValue = Number.NaN; },
      (entry) => { entry.provenance = "UNKNOWN"; },
      (entry) => { entry.evidenceStatus = "UNKNOWN"; },
      (entry) => { entry.validationStatus = "UNKNOWN"; },
      (entry) => { entry.sourceLabel = ""; },
      (entry) => { entry.recordedAt = "yesterday"; },
      (entry) => { entry.styleRevision = 0; },
      (entry) => { entry.confidence = "HIGH"; },
      (entry) => { entry.rawValue = "101"; },
    ];
    for (const mutate of invalidEntries) {
      const candidate = structuredClone(original) as unknown as { observations: Array<Record<string, unknown>> } & Record<string, unknown>;
      mutate(candidate.observations[0]!, candidate);
      expect(parseFieldObservationRecord(candidate).ok).toBe(false);
    }
    const badOrder = structuredClone(original) as unknown as { observations: Array<Record<string, unknown>> } & Record<string, unknown>;
    badOrder.observations[0]!.revision = 2;
    badOrder.observations[1]!.revision = 1;
    expect(parseFieldObservationRecord(badOrder).ok).toBe(false);
    const nullEntry = structuredClone(original) as unknown as { observations: unknown[] } & Record<string, unknown>;
    nullEntry.observations[0] = null;
    expect(parseFieldObservationRecord(nullEntry).ok).toBe(false);
  });

  it("uses explicit defaults for sparse recipe options and validates option provenance helpers", () => {
    const template = GARMENTS[0]!;
    const probe = {
      ...template,
      name: "__field-definition-probe__",
      label: "Definition probe",
      fields: ["unknown-measurement"],
      options: [{ id: "finishChoice", label: "Finish choice", min: 0, max: 2, step: 1, defaultValue: 1 }],
    } as unknown as GarmentRecipe;
    const recipes = GARMENTS as GarmentRecipe[];
    recipes.push(probe);
    try {
      const definitions = getFieldDefinitions(probe.name);
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toMatchObject({
        inputKind: "option", inputKey: "finishChoice", unit: "cm",
        meaning: expect.stringContaining("construction/design choice"),
      });
      const source = styleFor();
      const sparseStyle = {
        ...source,
        recipeId: probe.name,
        design: {
          ...source.design,
          garmentOptions: {},
          workspace: { ...source.design.workspace, garment: probe.name },
        },
      } as unknown as StyleRecord;
      const record = createFieldObservationRecord(sparseStyle, TIME, "first-run-default");
      expect(record.observations[0]).toMatchObject({ rawValue: "1", canonicalValue: 1 });
      expect(() => assertRecipeFieldCoverage([probe])).toThrow("do not exactly cover");
    } finally {
      recipes.pop();
    }

    expect(fieldDefinitionById("body.chest-girth")?.inputKey).toBe("chest");
    expect(fieldDefinitionById("missing-field")).toBeUndefined();
    expect(isKnownFieldProvenance("USER_CAPTURED")).toBe(true);
    expect(isKnownFieldProvenance("automatic" )).toBe(false);
  });

  it("records option edits as user-selected and rejects mismatched append/reconcile inputs", () => {
    const style = styleFor("polo");
    const option = getFieldDefinitions("polo").find((definition) => definition.inputKind === "option")!;
    const original = createFieldObservationRecord(style, TIME, "existing-local-style");
    const base = recoveryFor(style);
    const sparsePayload = {
      ...base,
      rawOptions: { polo: { [option.inputKey]: "" } },
      garmentOptions: { ...base.garmentOptions, polo: { ...base.garmentOptions.polo, [option.inputKey]: null } },
    } as unknown as RecoveryPayload;
    const changed = appendRecoveryFieldObservations(original, style, sparsePayload, "2026-09-24T16:00:01.000Z", {
      recipeId: "polo", inputKind: "option", inputKey: option.inputKey,
    });
    expect(currentFieldObservation(changed, option)).toMatchObject({
      rawValue: "", canonicalValue: null, provenance: "USER_SELECTED", validationStatus: "INVALID",
    });

    const sparseStored = {
      ...base,
      rawOptions: { polo: {} },
      garmentOptions: { ...base.garmentOptions, polo: {} },
    } as unknown as RecoveryPayload;
    const defaulted = appendRecoveryFieldObservations(original, style, sparseStored, "2026-09-24T16:00:02.000Z");
    expect(currentFieldObservation(defaulted, option)).toMatchObject({ rawValue: String(option.defaultValue), canonicalValue: option.defaultValue });

    expect(() => appendRecoveryFieldObservations(original, { ...style, id: PROJECT_ID }, base, TIME))
      .toThrow("must match the style");
    expect(() => appendRecoveryFieldObservations(original, style, base, "yesterday"))
      .toThrow("canonical UTC timestamp");
    expect(() => appendRecoveryFieldObservations(original, style, base, TIME, {
      recipeId: "tee", inputKind: "measurement", inputKey: "chest",
    })).toThrow("defined by the active recipe");
    expect(() => appendRecoveryFieldObservations(original, style, base, TIME, {
      recipeId: "polo", inputKind: "measurement", inputKey: "missing",
    })).toThrow("defined by the active recipe");
    expect(() => reconcileDesignFieldObservations(original, { ...style, id: PROJECT_ID }, style.design, TIME))
      .toThrow("must match the style");
    expect(() => reconcileDesignFieldObservations(original, style, style.design, "yesterday"))
      .toThrow("canonical UTC timestamp");
    expect(() => remapFieldObservationStyleId(original, "bad-id")).toThrow("valid style ID");

    const tee = styleFor("tee");
    const skirt = styleFor("skirt");
    const teeHistory = createFieldObservationRecord(tee, TIME, "existing-local-style");
    const skirtStyle = {
      ...tee,
      revision: tee.revision + 1,
      recipeId: "skirt",
      recipePresetId: skirt.recipePresetId,
      design: { ...tee.design, workspace: skirt.design.workspace },
    };
    const reconciled = reconcileDesignFieldObservations(teeHistory, skirtStyle, skirtStyle.design, "2026-09-24T16:00:03.000Z");
    expect(currentFieldObservation(reconciled, getFieldDefinition("skirt", "length")!))
      .toMatchObject({ provenance: "UNRESOLVED", sourceLabel: expect.stringContaining("different reference meaning") });
  });

  it("preserves an absent raw measurement when its stored canonical value is null", () => {
    const style = styleFor();
    const original = createFieldObservationRecord(style, TIME, "existing-local-style");
    const next = appendRecoveryFieldObservations(original, style, recoveryFor(style, {
      measurements: { chest: null },
    }), "2026-09-24T16:00:01.000Z");
    expect(currentFieldObservation(next, getFieldDefinition("tee", "chest")!)).toMatchObject({
      rawValue: "", canonicalValue: null, validationStatus: "INVALID", provenance: "UNRESOLVED",
    });
  });
});
