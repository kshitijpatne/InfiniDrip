import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE } from "./appearance";
import { GARMENTS, STANDARD_M, defaultGarmentOptions, type GarmentRecipe } from "../drafting";
import { DEFAULT_WORKSPACE, deserializeRecovery, serialize, serializeRecovery } from "./persist";
import { migrateLegacySaveFile, type RecoveryPayload, type StyleRecord } from "./project-records";
import { addCaptureReadingForField, createMeasurementCaptureSession } from "./measurement-capture";
import {
  appendRecoveryFieldObservations,
  assertRecipeFieldCoverage,
  createFieldObservationRecord,
  createFieldObservationRecordFromCapture,
  currentFieldObservation,
  fieldDefinitionById,
  getAllFieldDefinitions,
  getCaptureFieldDefinitions,
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
  it("covers every editable input exactly once across all ten current recipes", () => {
    expect(GARMENTS).toHaveLength(10);
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
    expect(getFieldDefinition("shorts", "thigh")).toMatchObject({
      semanticId: "target.shorts-finished-thigh-girth",
      semanticKind: "GARMENT_MEASURE",
      referenceFrame: "finished-garment",
      label: "Target finished thigh girth",
      meaning: expect.stringContaining("finished shorts thigh-girth target"),
      captureBoundary: expect.stringContaining("not a wearer thigh capture"),
    });
    expect(getFieldDefinition("shorts", "knee")).toBeUndefined();
    expect(getFieldDefinition("tee", "ease")?.semanticKind).toBe("STYLE_CONTROL");
    expect(getFieldDefinition("tank", "strapWidth")?.semanticKind).toBe("STYLE_CONTROL");
    expect(getFieldDefinition("tee", "chest")?.limitBasis).toBe("existing-ui-guardrail-not-industry-standard");
  });

  it("defines shoulder input as examiner-sourced biacromial breadth without verifying user capture", () => {
    const shoulder = getFieldDefinitions("tee").find((definition) => definition.inputKey === "shoulderWidth");
    expect(shoulder).toMatchObject({
      semanticKind: "BODY_MEASURE",
      label: "Shoulder width (biacromial breadth)",
      meaning: expect.stringContaining("lateral borders of the left and right acromial processes"),
      captureBoundary: expect.stringContaining("do not record who took them"),
    });
    expect(shoulder?.captureBoundary).toContain("not verified by the app");
    expect(shoulder?.captureBoundary).toContain("Self-measure reliability and garment fit are not established");
  });

  it("records an unset optional Tee chest control as inheriting the current shared ease", () => {
    const base = styleFor("tee");
    const teeOptions = { ...base.design.garmentOptions.tee };
    delete teeOptions.chestEase;
    const style = {
      ...base,
      design: {
        ...base.design,
        measurements: { ...base.design.measurements, ease: 5 },
        garmentOptions: { ...base.design.garmentOptions, tee: teeOptions },
      },
    };
    const definition = getFieldDefinition("tee", "chestEase", "option")!;
    const record = createFieldObservationRecord(style, TIME, "existing-local-style");
    expect(currentFieldObservation(record, definition)).toMatchObject({
      rawValue: "5",
      canonicalValue: 5,
      provenance: "INHERITED",
      validationStatus: "VALID",
      sourceLabel: expect.stringContaining("inherits the shared measurement"),
    });
    expect(parseFieldObservationRecord(record).ok).toBe(true);
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

  it("seeds a custom style's field history from its exact selected capture provenance", () => {
    const style = styleFor("woven-shirt");
    let session = createMeasurementCaptureSession("3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90", "woven-shirt", TIME, style.id);
    const definitions = getFieldDefinitions("woven-shirt");
    definitions.forEach((definition, index) => {
      const isOption = definition.inputKind === "option";
      const provenance = isOption || definition.semanticKind !== "BODY_MEASURE"
        ? "USER_SELECTED"
        : definition.inputKey === "chest" ? "PRESET" : "USER_CAPTURED";
      session = addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance,
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: isOption ? "Selected digital construction option." : "Named digital starting value; not measured wearer data.",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      }, TIME);
    });

    const observations = createFieldObservationRecordFromCapture(style, TIME, session);
    expect(observations.observations).toHaveLength(definitions.length);
    expect(currentFieldObservation(observations, getFieldDefinition("woven-shirt", "chest")!)).toMatchObject({
      provenance: "PRESET",
      sourceLabel: "Named digital starting value; not measured wearer data.",
      evidenceStatus: "UNCONFIRMED",
      recordedAt: null,
      confidence: "NOT_ASSESSED",
    });
    const buttonRows = observations.observations.filter((entry) => entry.semanticKind === "STYLE_CONTROL");
    expect(buttonRows.length).toBeGreaterThan(0);
    expect(buttonRows.every((entry) => entry.provenance === "USER_SELECTED")).toBe(true);
    expect(parseFieldObservationRecord(observations).ok).toBe(true);
  });

  it("rejects capture history with an unresolved session, wrong recipe, or values that differ from the saved style", () => {
    const woven = styleFor("woven-shirt");
    const empty = createMeasurementCaptureSession("3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90", "woven-shirt", TIME, woven.id);
    expect(() => createFieldObservationRecordFromCapture(woven, TIME, empty)).toThrow("Resolve every measurement");
    expect(() => createFieldObservationRecordFromCapture(woven, TIME, { ...empty, fields: empty.fields.slice(1) }))
      .toThrow("does not exactly cover");
    expect(() => createFieldObservationRecordFromCapture(
      { ...woven, recipeId: "unknown-recipe" }, TIME, { ...empty, recipeId: "unknown-recipe", fields: [] },
    )).toThrow("does not exactly cover");

    const tee = styleFor("tee");
    expect(() => createFieldObservationRecordFromCapture(woven, TIME, {
      ...empty,
      recipeId: "tee",
    })).toThrow("ready recipe-matched capture");

    let ready = empty;
    getFieldDefinitions("woven-shirt").forEach((definition, index) => {
      const isOption = definition.inputKind === "option";
      ready = addCaptureReadingForField(ready, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 101).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: isOption || definition.semanticKind !== "BODY_MEASURE" ? "USER_SELECTED" : "USER_CAPTURED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Entered in guided capture.",
        captureMethod: null,
        capturedAt: null,
        measurer: null,
      }, TIME);
    });
    expect(() => createFieldObservationRecordFromCapture({
      ...woven,
      id: "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4",
    }, TIME, ready))
      .toThrow("ready recipe-matched capture");
    expect(() => createFieldObservationRecordFromCapture(tee, TIME, ready)).toThrow("ready recipe-matched capture");
    expect(() => createFieldObservationRecordFromCapture(woven, "yesterday", ready)).toThrow("ready recipe-matched capture");
    const changed = { ...woven, design: { ...woven.design, measurements: { ...woven.design.measurements, chest: 99 } } };
    expect(() => createFieldObservationRecordFromCapture(changed, TIME, ready)).toThrow("does not match the saved custom style");
  });

  it("creates Tee capture history without inventing an observation for the unset optional control", () => {
    const tee = styleFor("tee");
    let session = createMeasurementCaptureSession(tee.id, "tee", TIME, tee.id);
    getCaptureFieldDefinitions("tee").forEach((definition, index) => {
      const bodyMeasure = definition.semanticKind === "BODY_MEASURE";
      session = addCaptureReadingForField(session, definition.id, {
        id: `00000000-0000-4000-8000-${String(index + 301).padStart(12, "0")}`,
        rawValue: String(definition.defaultValue),
        enteredUnit: definition.unit,
        provenance: bodyMeasure ? "USER_CAPTURED" : "USER_SELECTED",
        evidenceStatus: "UNCONFIRMED",
        sourceLabel: "Entered in guided capture.",
        captureMethod: bodyMeasure ? "Tape; technique unqualified" : null,
        capturedAt: bodyMeasure ? TIME : null,
        measurer: bodyMeasure ? "SELF" : null,
      }, TIME);
    });
    expect(session.fields).toHaveLength(7);
    const record = createFieldObservationRecordFromCapture(tee, TIME, session);
    expect(currentFieldObservation(record, getFieldDefinition("tee", "chestEase", "option")!)).toBeUndefined();
    expect(parseFieldObservationRecord(record).ok).toBe(true);
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

  it("records resetting optional Tee chest ease as inherited shared ease, not as a user selection", () => {
    const base = styleFor("tee");
    const explicitOptions = { ...base.design.garmentOptions.tee, chestEase: 8 };
    const explicitStyle = {
      ...base,
      revision: 2,
      design: {
        ...base.design,
        measurements: { ...base.design.measurements, ease: 5 },
        garmentOptions: { ...base.design.garmentOptions, tee: explicitOptions },
      },
    };
    const definition = getFieldDefinition("tee", "chestEase", "option")!;
    const original = createFieldObservationRecord(explicitStyle, TIME, "existing-local-style");
    const selected = appendRecoveryFieldObservations(original, explicitStyle, recoveryFor(explicitStyle),
      "2026-09-24T16:00:01.000Z", { recipeId: "tee", inputKind: "option", inputKey: "chestEase" });
    expect(currentFieldObservation(selected, definition)?.provenance).toBe("USER_SELECTED");

    const resetOptions = { ...explicitOptions };
    Reflect.deleteProperty(resetOptions, "chestEase");
    const resetStyle = {
      ...explicitStyle,
      revision: 3,
      design: { ...explicitStyle.design, garmentOptions: { ...explicitStyle.design.garmentOptions, tee: resetOptions } },
    };
    const resetBase = recoveryFor(explicitStyle, { rawOptions: { tee: { chestEase: "" } } });
    const resetPayload = {
      ...resetBase,
      measurements: { ...resetBase.measurements, ease: 5 },
      garmentOptions: { ...resetBase.garmentOptions, tee: resetOptions },
    } as unknown as RecoveryPayload;
    const reset = appendRecoveryFieldObservations(selected, resetStyle, resetPayload, "2026-09-24T16:00:02.000Z",
      { recipeId: "tee", inputKind: "option", inputKey: "chestEase" });
    expect(currentFieldObservation(reset, definition)).toMatchObject({
      rawValue: "5",
      canonicalValue: 5,
      provenance: "INHERITED",
      validationStatus: "VALID",
      sourceLabel: expect.stringContaining("inherits the shared measurement"),
    });
    expect(parseFieldObservationRecord(reset).ok).toBe(true);
  });

  it("preserves invalid optional inheritance and explicit-null recovery without inventing a value", () => {
    const base = styleFor("tee");
    const teeOptions = { ...base.design.garmentOptions.tee };
    delete teeOptions.chestEase;
    const style = {
      ...base,
      revision: 2,
      design: {
        ...base.design,
        measurements: { ...base.design.measurements, ease: 5 },
        garmentOptions: { ...base.design.garmentOptions, tee: teeOptions },
      },
    };
    const definition = getFieldDefinition("tee", "chestEase", "option")!;
    const original = createFieldObservationRecord(style, TIME, "existing-local-style");
    const invalidFallback = appendRecoveryFieldObservations(original, style, recoveryFor(style, {
      measurements: { ease: Number.NaN }, rawOptions: { tee: { chestEase: "" } },
    }), "2026-09-24T16:00:03.000Z", { recipeId: "tee", inputKind: "option", inputKey: "chestEase" });
    expect(currentFieldObservation(invalidFallback, definition)).toMatchObject({
      rawValue: "", canonicalValue: null, provenance: "INHERITED", validationStatus: "INVALID",
    });
    expect(parseFieldObservationRecord(invalidFallback).ok).toBe(true);

    const basePayload = recoveryFor(style);
    const explicitNullPayload = {
      ...basePayload,
      garmentOptions: { ...basePayload.garmentOptions, tee: { chestEase: null } },
    } as unknown as RecoveryPayload;
    const explicitNull = appendRecoveryFieldObservations(original, style, explicitNullPayload,
      "2026-09-24T16:00:04.000Z", { recipeId: "tee", inputKind: "option", inputKey: "chestEase" });
    expect(currentFieldObservation(explicitNull, definition)).toMatchObject({
      rawValue: "", canonicalValue: null, provenance: "USER_SELECTED", validationStatus: "INVALID",
    });
    expect(parseFieldObservationRecord(explicitNull).ok).toBe(true);
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
