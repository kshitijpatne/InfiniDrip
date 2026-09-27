import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import {
  CUSTOM_ONE_SIZE_MODE,
  CUSTOM_STYLE_RECORD_VERSION,
  MEASUREMENT_CAPTURE_RECORD_VERSION,
  STYLE_RECORD_VERSION,
  isCustomOneSizeStyle,
  isMeasurementCaptureSessionSuccessor,
  migrateLegacyRecovery,
  migrateLegacySaveFile,
  parseMeasurementCaptureRecord,
  parseMigrationRecord,
  parseProjectRecord,
  parseRecoveryRecord,
  parseSavedDesignRecord,
  parseStyleRecord,
  validateProjectBundle,
  type MeasurementCaptureDraft,
  type MeasurementCaptureRecord,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";
import {
  addCaptureReadingForField,
  createMeasurementCaptureSession,
  selectCaptureReading,
  type MeasurementCaptureSession,
} from "./measurement-capture";

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const OTHER_PROJECT_ID = "c502163f-10be-4dce-89c9-35de897e9814";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const OTHER_STYLE_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
const TIME = "2026-09-24T16:00:00.000Z";
const FABRIC = "#3A4150";
const migrated = (json = serialize(STANDARD_M, FABRIC)) => migrateLegacySaveFile({
  json, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
});

function legacySave(version: number): string {
  const current = JSON.parse(serialize(STANDARD_M, FABRIC));
  delete current.semanticEdits;
  if (version < 5) {
    delete current.workspace;
    delete current.garmentOptions;
    delete current.appearance;
    delete current.surface;
    delete current.nestingIntelligence;
  }
  if (version < 4) {
    delete current.measurements.neck;
    delete current.measurements.strapWidth;
    delete current.measurements.neckDrop;
    delete current.measurements.neckWidthEase;
  }
  if (version < 3) {
    delete current.measurements.waist;
    delete current.measurements.hip;
    delete current.measurements.hipDepth;
  }
  if (version < 5) {
    delete current.measurements.crotchDepth;
    delete current.measurements.thigh;
    delete current.measurements.knee;
    delete current.measurements.inseam;
  }
  if (version === 1) current.measurements.strapWidth = 15;
  current.v = version;
  return JSON.stringify(current);
}

function validStyle(): StyleRecord {
  const result = migrated();
  if (!result.ok) throw new Error(result.error);
  return result.value.style;
}

function validProject(): ProjectRecord {
  const result = migrated();
  if (!result.ok) throw new Error(result.error);
  return result.value.project;
}

function validRecovery(): RecoveryRecord {
  const recovery = {
    savedAt: 123,
    measurements: { ...Object.fromEntries(Object.entries(STANDARD_M)), chest: null },
    rawMeasurements: { chest: "", neck: "40" },
    fabric: FABRIC,
    appearance: DEFAULT_APPEARANCE,
    garmentOptions: { tee: {} },
    rawOptions: { tee: {} },
    workspace: DEFAULT_WORKSPACE,
    materialSelectionExplicit: false,
    surface: {},
    rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
  } as const;
  const parsed = migrateLegacyRecovery(STYLE_ID, serializeRecovery(recovery));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe("strict project and style records", () => {
  it("migrates every accepted SaveFile version into distinct project, style, recipe, and preset identities", () => {
    for (const version of [1, 2, 3, 4, 5]) {
      const result = migrated(legacySave(version));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.sourceVersion).toBe(version);
      expect(result.value.project.styleIds).toEqual([STYLE_ID]);
      expect(result.value.project.activeStyleId).toBe(STYLE_ID);
      expect(result.value.style.id).toBe(STYLE_ID);
      expect(result.value.style.projectId).toBe(PROJECT_ID);
      expect(result.value.style.name).toBe("Untitled tee");
      expect(result.value.style.recipeId).toBe("tee");
      expect(result.value.style.recipePresetId).toBe("Classic tee");
      expect(result.value.style.design.measurements).toEqual(STANDARD_M);
      if (version === 1) expect(result.value.style.design.measurements.strapWidth).toBe(8);
    }
    const polo = JSON.parse(serialize(STANDARD_M, FABRIC, {}, {
      ...DEFAULT_WORKSPACE, garment: "polo", targetStyle: "Classic polo",
    }));
    const result = migrated(JSON.stringify(polo));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.style.name).toBe("Untitled polo");
      expect(result.value.style.recipePresetId).toBe("Classic polo");
    }
  });

  it("preserves current version data and fails closed for malformed JSON, version, IDs, timestamps, and saved design", () => {
    const current = JSON.parse(serialize(STANDARD_M, FABRIC));
    expect(migrateLegacySaveFile({ json: "{", projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME }).ok).toBe(false);
    expect(migrateLegacySaveFile({ json: "[]", projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME }).ok).toBe(false);
    expect(migrated(JSON.stringify({ ...current, v: "5" })).ok).toBe(false);
    expect(migrateLegacySaveFile({ json: serialize(STANDARD_M, FABRIC), projectId: "bad", styleId: STYLE_ID, migratedAt: TIME }).ok).toBe(false);
    expect(migrateLegacySaveFile({ json: serialize(STANDARD_M, FABRIC), projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: "yesterday" }).ok).toBe(false);
    const result = migrated();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.project.name).toBe("My designs");
      expect(result.value.style.design.fabric).toBe(FABRIC);
    }
    expect(migrated(JSON.stringify({ ...current, measurements: { ...current.measurements, chest: 999 } })).ok).toBe(false);
  });

  it("rejects malformed project fields and project/style graph mismatches", () => {
    const project = validProject();
    const style = validStyle();
    expect(parseProjectRecord(null).ok).toBe(false);
    expect(parseProjectRecord({ ...project, unexpected: true }).ok).toBe(false);
    const wrongKeyCount = { ...project, unexpected: true } as Record<string, unknown>;
    delete wrongKeyCount.name;
    expect(parseProjectRecord(wrongKeyCount).ok).toBe(false);
    expect(parseProjectRecord({ ...project, schemaVersion: 9 }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, id: "bad" }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, name: "  " }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, createdAt: "2026-09-24" }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, createdAt: 123 }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, updatedAt: "2026-09-24T15:00:00.000Z" }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, revision: 0 }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, styleIds: [] }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, styleIds: [STYLE_ID, STYLE_ID] }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, activeStyleId: OTHER_STYLE_ID }).ok).toBe(false);
    expect(parseProjectRecord({ ...project, activeStyleId: "bad" }).ok).toBe(false);
    const imported = {
      ...project,
      id: OTHER_PROJECT_ID,
      name: "Imported copy",
      styleIds: [OTHER_STYLE_ID],
      activeStyleId: OTHER_STYLE_ID,
      importedFrom: { projectId: PROJECT_ID, styleIds: [STYLE_ID], packageSha256: "a".repeat(64) },
    };
    expect(parseProjectRecord(imported).ok).toBe(true);
    expect(parseProjectRecord({ ...imported, importedFrom: { ...imported.importedFrom, projectId: OTHER_PROJECT_ID } }).ok).toBe(false);
    expect(parseProjectRecord({ ...imported, importedFrom: { ...imported.importedFrom, styleIds: [STYLE_ID, OTHER_STYLE_ID] } }).ok).toBe(false);
    expect(validateProjectBundle(project, []).ok).toBe(false);
    expect(validateProjectBundle(project, [null]).ok).toBe(false);
    expect(validateProjectBundle(project, [style, style]).ok).toBe(false);
    expect(validateProjectBundle(project, [{ ...style, projectId: OTHER_STYLE_ID }]).ok).toBe(false);
    expect(validateProjectBundle(project, [{ ...style, id: OTHER_STYLE_ID }]).ok).toBe(false);
    const twoStyleProject = { ...project, styleIds: [STYLE_ID, OTHER_STYLE_ID] };
    expect(validateProjectBundle(twoStyleProject, [style, { ...style, id: OTHER_STYLE_ID }]).ok).toBe(true);
    expect(validateProjectBundle(twoStyleProject, [style, style]).ok).toBe(false);
    expect(validateProjectBundle(project, [{ ...style, archivedAt: TIME }]).ok).toBe(false);
  });

  it("validates style schema, timestamps, recipe identity, and nested canonical design", () => {
    const style = validStyle();
    expect(parseStyleRecord(undefined).ok).toBe(false);
    expect(parseStyleRecord({ ...style, extra: 1 }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, schemaVersion: 99 }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, projectId: "bad" }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, name: "" }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, updatedAt: "2026-09-24T15:00:00.000Z" }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, archivedAt: "not-a-time" }).ok).toBe(false);
    const { archivedAt: _archivedAt, ...missingArchiveState } = style;
    expect(parseStyleRecord(missingArchiveState).ok).toBe(false);
    expect(parseStyleRecord({ ...style, recipeId: "polo" }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, added: true } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, measurements: { ...STANDARD_M, unknown: 2 } } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, measurements: { ...STANDARD_M, chest: 999 } } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, workspace: { ...style.design.workspace, other: true } } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, appearance: { ...style.design.appearance, other: true } } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, design: { ...style.design, nestingIntelligence: { ...style.design.nestingIntelligence, other: true } } }).ok).toBe(false);
    const cyclicMeasurements = { ...STANDARD_M, chest: null } as unknown as Record<string, unknown>;
    cyclicMeasurements.chest = cyclicMeasurements;
    expect(parseStyleRecord({ ...style, design: { ...style.design, measurements: cyclicMeasurements } }).ok).toBe(false);
    expect(parseStyleRecord(style).ok).toBe(true);
    expect(parseStyleRecord({ ...style, archivedAt: TIME }).ok).toBe(true);
    expect(parseSavedDesignRecord(style.design).ok).toBe(true);
    expect(parseSavedDesignRecord({ ...style.design, workspace: { ...style.design.workspace, unexpected: true } }).ok).toBe(false);
    expect(parseStyleRecord({ ...style, revisionHeadId: "not-a-revision-id" }).ok).toBe(false);
    const legacyDesign = { ...style.design } as Record<string, unknown>;
    delete legacyDesign.semanticEdits;
    const legacyStyle: Record<string, unknown> = { ...style, schemaVersion: 1, design: legacyDesign };
    delete legacyStyle.archivedAt;
    delete legacyStyle.revisionHeadId;
    expect(parseStyleRecord(legacyStyle)).toMatchObject({
      ok: true,
      value: { schemaVersion: 4, archivedAt: null, revisionHeadId: null, design: { semanticEdits: null } },
    });
    const semanticV3: Record<string, unknown> = { ...style, schemaVersion: 3 };
    delete semanticV3.revisionHeadId;
    expect(parseStyleRecord(semanticV3)).toMatchObject({
      ok: true,
      value: { schemaVersion: 4, revisionHeadId: null, design: { semanticEdits: style.design.semanticEdits } },
    });
  });

  it("keeps custom one-size style schema v5 exact and legacy v1–v4 styles free of a size mode", () => {
    const style = validStyle();
    expect(style.schemaVersion).toBe(STYLE_RECORD_VERSION);
    expect(style).not.toHaveProperty("sizeMode");
    const custom: Record<string, unknown> = { ...style, schemaVersion: CUSTOM_STYLE_RECORD_VERSION, sizeMode: CUSTOM_ONE_SIZE_MODE };
    const parsed = parseStyleRecord(custom);
    expect(parsed).toEqual({ ok: true, value: custom });
    if (!parsed.ok) throw new Error(parsed.error);
    expect(Object.keys(parsed.value)).toEqual(Object.keys(custom));
    expect(isCustomOneSizeStyle(parsed.value)).toBe(true);
    // A JSON round trip keeps the version and size mode exactly.
    expect(parseStyleRecord(JSON.parse(JSON.stringify(parsed.value)))).toEqual({ ok: true, value: custom });
    const revisionHeadId = "11111111-1111-4111-8111-111111111111";
    expect(parseStyleRecord({ ...custom, revisionHeadId, archivedAt: TIME })).toEqual({
      ok: true, value: { ...custom, revisionHeadId, archivedAt: TIME },
    });
    expect(validateProjectBundle(validProject(), [custom])).toMatchObject({ ok: true, value: { styles: [custom] } });

    // Legacy records keep their normalized v4 shape and are never upgraded to a custom style.
    const legacy = parseStyleRecord(style);
    expect(legacy).toEqual({ ok: true, value: style });
    if (!legacy.ok) throw new Error(legacy.error);
    expect(isCustomOneSizeStyle(legacy.value)).toBe(false);
    const { semanticEdits: _semanticEdits, ...legacyDesign } = style.design;
    const { revisionHeadId: _head, archivedAt: _archived, ...v1Fields } = style;
    const { revisionHeadId: _v3Head, ...v3Fields } = style;
    for (const input of [
      { ...v1Fields, schemaVersion: 1, design: legacyDesign },
      { ...v3Fields, schemaVersion: 2, design: legacyDesign },
      { ...v3Fields, schemaVersion: 3 },
    ]) {
      const upgraded = parseStyleRecord(input);
      expect(upgraded).toMatchObject({ ok: true, value: { schemaVersion: STYLE_RECORD_VERSION } });
      expect(upgraded.ok && Object.keys(upgraded.value).sort()).toEqual(Object.keys(style).sort());
    }

    const { sizeMode: _sizeMode, ...missingMode } = custom;
    const markerOnLegacy = "Only style schema v5 custom one-size records may declare a size mode.";
    const wrongMode = `Style schema v5 size mode must be exactly "${CUSTOM_ONE_SIZE_MODE}".`;
    const invalid: ReadonlyArray<{ value: unknown; error?: string }> = [
      { value: missingMode, error: "Style record fields are incomplete or unknown." },
      { value: { ...custom, sizeMode: "graded" }, error: wrongMode },
      { value: { ...custom, sizeMode: "Custom-One-Size" }, error: wrongMode },
      { value: { ...custom, sizeMode: "" }, error: wrongMode },
      { value: { ...custom, sizeMode: null }, error: wrongMode },
      { value: { ...custom, sizeMode: [CUSTOM_ONE_SIZE_MODE] }, error: wrongMode },
      { value: { ...custom, extra: true }, error: "Style record fields are incomplete or unknown." },
      { value: { ...custom, revisionHeadId: "not-a-revision-id" } },
      { value: { ...custom, archivedAt: "not-a-time" } },
      { value: { ...custom, recipeId: "polo" } },
      { value: { ...custom, design: legacyDesign } },
      { value: { ...style, sizeMode: CUSTOM_ONE_SIZE_MODE }, error: markerOnLegacy },
      { value: { ...style, sizeMode: undefined }, error: markerOnLegacy },
      { value: { ...v3Fields, schemaVersion: 3, sizeMode: CUSTOM_ONE_SIZE_MODE }, error: markerOnLegacy },
      { value: { ...v1Fields, schemaVersion: 1, design: legacyDesign, sizeMode: CUSTOM_ONE_SIZE_MODE }, error: markerOnLegacy },
      { value: { ...custom, schemaVersion: 6 }, error: "Unsupported style record schema version." },
    ];
    for (const candidate of invalid) {
      const result = parseStyleRecord(candidate.value);
      expect(result.ok).toBe(false);
      if (candidate.error && !result.ok) expect(result.error).toBe(candidate.error);
    }
  });

  it("validates per-style recovery records and legacy recovery without altering unfinished raw input", () => {
    const recovery = validRecovery();
    expect(parseRecoveryRecord(null).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, extra: true }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, schemaVersion: 4 }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, styleId: "bad" }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, payload: { ...recovery.payload, unknown: true } }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, payload: { ...recovery.payload, fabric: "bad" } }).ok).toBe(false);
    expect(parseRecoveryRecord({
      ...recovery,
      schemaVersion: 2,
      payload: { ...recovery.payload, semanticEdits: recovery.payload.semanticEdits ?? null },
    }).ok).toBe(true);
    const legacyPayload = { ...recovery.payload } as Record<string, unknown>;
    delete legacyPayload.semanticEdits;
    expect(parseRecoveryRecord({ schemaVersion: 1, styleId: STYLE_ID, payload: legacyPayload }).ok).toBe(true);
    const cyclicMeasurements = { ...recovery.payload.measurements, chest: null } as Record<string, unknown>;
    cyclicMeasurements.chest = cyclicMeasurements;
    const cyclicPayload = { ...recovery.payload, measurements: cyclicMeasurements };
    expect(parseRecoveryRecord({ ...recovery, payload: cyclicPayload }).ok).toBe(false);
    const invalidRaw = JSON.stringify({ v: 1, ...recovery.payload, rawMeasurements: { chest: 2 } });
    expect(migrateLegacyRecovery(STYLE_ID, invalidRaw).ok).toBe(false);
    const invalidCurrentRecovery = JSON.parse(serializeRecovery(recovery.payload));
    invalidCurrentRecovery.semanticEdits = { schemaVersion: 99 };
    expect(migrateLegacyRecovery(STYLE_ID, JSON.stringify(invalidCurrentRecovery)).ok).toBe(false);
    expect(migrateLegacyRecovery("bad", serializeRecovery(recovery.payload)).ok).toBe(false);
    expect(migrateLegacyRecovery(STYLE_ID, "[").ok).toBe(false);
    expect(migrateLegacyRecovery(STYLE_ID, JSON.stringify({ v: 99 })).ok).toBe(false);
    expect(recovery.payload.rawMeasurements).toEqual({ chest: "", neck: "40" });
    expect(recovery.payload.measurements.chest).toBeNull();
    expect(parseRecoveryRecord(recovery).ok).toBe(true);
  });

  it("validates migration marker schema, source fingerprint, and destination identity", () => {
    const marker = {
      schemaVersion: 1,
      sourceKeys: ["patternworks_save_v1", "patternworks_recovery_v1"],
      sourceSaveVersion: 5,
      sourceSha256: "a".repeat(64),
      migratedAt: TIME,
      projectId: PROJECT_ID,
      styleId: STYLE_ID,
    };
    expect(parseMigrationRecord(marker).ok).toBe(true);
    expect(parseMigrationRecord({ ...marker, extra: true }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, schemaVersion: 2 }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceKeys: ["wrong", "wrong"] }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: 7 }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: 1.5 }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: null }).ok).toBe(true);
    expect(parseMigrationRecord({ ...marker, sourceSha256: "bad" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, migratedAt: "today" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, projectId: "bad" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, styleId: "bad" }).ok).toBe(false);
  });
});

const SESSION_ID = "3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90";
const READING_ID = "d34a5104-ae25-4b54-9a2b-fcc35237ff71";
const SECOND_READING_ID = "e78e0c40-ae1a-4d03-9470-80345f994734";
const CHEST = "body.chest-girth";
const T1 = "2026-09-24T16:00:01.000Z";
const T2 = "2026-09-24T16:00:02.000Z";
const T3 = "2026-09-24T16:00:03.000Z";

function captureSession(styleId: string | null = STYLE_ID): MeasurementCaptureSession {
  return createMeasurementCaptureSession(SESSION_ID, "tee", TIME, styleId);
}

function withReading(
  session: MeasurementCaptureSession,
  id = READING_ID,
  rawValue = "40.125",
  enteredUnit = "in",
  at = T1,
): MeasurementCaptureSession {
  return addCaptureReadingForField(session, CHEST, {
    id,
    rawValue,
    enteredUnit,
    provenance: "USER_CAPTURED",
    evidenceStatus: "UNCONFIRMED",
    sourceLabel: "User-entered value; capture method and technique not qualified.",
    captureMethod: null,
    capturedAt: null,
    measurer: null,
  }, at);
}

function captureDraft(fieldId = CHEST, overrides: Partial<MeasurementCaptureDraft> = {}): MeasurementCaptureDraft {
  const unit = captureSession().fields.find((field) => field.fieldId === fieldId)?.unit ?? "cm";
  return {
    fieldId, rawValue: "9O.5 typo", enteredUnit: unit, sourceNote: "", captureMethod: "", captureDate: "", measurer: "",
    ...overrides,
  };
}

function captureRecord(overrides: Partial<MeasurementCaptureRecord> = {}): MeasurementCaptureRecord {
  return {
    schemaVersion: MEASUREMENT_CAPTURE_RECORD_VERSION,
    styleId: STYLE_ID,
    projectId: PROJECT_ID,
    recipeId: "tee",
    revision: 1,
    updatedAt: TIME,
    session: captureSession(),
    drafts: [],
    ...overrides,
  };
}

describe("measurement capture records", () => {
  it("keeps an empty session and exact unrecorded drafts separate from recorded readings", () => {
    const fieldIds = captureSession().fields.map((field) => field.fieldId);
    const chestIndex = fieldIds.indexOf(CHEST);
    const laterField = fieldIds[chestIndex + 1]!;
    const empty = captureRecord();
    expect(parseMeasurementCaptureRecord(empty)).toEqual({ ok: true, value: empty });
    const drafts = [
      captureDraft(CHEST, {
        rawValue: " 40 1/8 ", enteredUnit: "in", sourceNote: "Tape note", captureMethod: "Over a T-shirt",
        captureDate: "2026-09-24", measurer: "HELPER",
      }),
      captureDraft(laterField, { rawValue: "" }),
    ];
    const record = captureRecord({ session: withReading(captureSession()), drafts });
    const parsed = parseMeasurementCaptureRecord(record);
    expect(parsed).toEqual({ ok: true, value: record });
    if (!parsed.ok) throw new Error(parsed.error);
    // The recorded reading and the unrecorded draft for the same field stay distinct.
    expect(parsed.value.session.fields[chestIndex]?.readings.map((reading) => reading.rawValue)).toEqual(["40.125"]);
    expect(parsed.value.drafts[0]?.rawValue).toBe(" 40 1/8 ");
  });

  it("fails closed for malformed, foreign, unattached, or reordered capture records", () => {
    const fieldIds = captureSession().fields.map((field) => field.fieldId);
    const record = captureRecord();
    const invalid: readonly unknown[] = [
      null,
      { ...record, extra: true },
      { ...record, schemaVersion: 2 },
      { ...record, styleId: "bad" },
      { ...record, projectId: "bad" },
      { ...record, recipeId: 5 },
      { ...record, revision: 0 },
      { ...record, updatedAt: "today" },
      { ...record, session: { ...record.session, extra: true } },
      { ...record, session: captureSession(null) },
      { ...record, session: captureSession(OTHER_STYLE_ID) },
      { ...record, recipeId: "skirt" },
      { ...record, drafts: {} },
      { ...record, drafts: [{ ...captureDraft(), extra: true }] },
      { ...record, drafts: [captureDraft("body.unknown")] },
      { ...record, drafts: [captureDraft(), captureDraft()] },
      { ...record, drafts: [captureDraft(fieldIds[1]!), captureDraft(fieldIds[0]!)] },
      { ...record, drafts: [captureDraft(CHEST, { rawValue: 5 as unknown as string })] },
      { ...record, drafts: [captureDraft(CHEST, { rawValue: "1".repeat(4097) })] },
      { ...record, drafts: [captureDraft(CHEST, { enteredUnit: 5 as unknown as string })] },
      { ...record, drafts: [captureDraft(CHEST, { enteredUnit: "mm" })] },
      { ...record, drafts: [captureDraft(CHEST, { sourceNote: null as unknown as string })] },
      { ...record, drafts: [captureDraft(CHEST, { sourceNote: "s".repeat(501) })] },
      { ...record, drafts: [captureDraft(CHEST, { captureMethod: null as unknown as string })] },
      { ...record, drafts: [captureDraft(CHEST, { captureMethod: "m".repeat(257) })] },
      { ...record, drafts: [captureDraft(CHEST, { captureDate: null as unknown as string })] },
      { ...record, drafts: [captureDraft(CHEST, { captureDate: "24-09-2026" })] },
      { ...record, drafts: [captureDraft(CHEST, { captureDate: "2026-13-01" })] },
      { ...record, drafts: [captureDraft(CHEST, { captureDate: "2026-02-30" })] },
      { ...record, drafts: [captureDraft(CHEST, { measurer: null as unknown as "" })] },
      { ...record, drafts: [captureDraft(CHEST, { measurer: "ROBOT" as unknown as "" })] },
    ];
    for (const value of invalid) expect(parseMeasurementCaptureRecord(value).ok).toBe(false);
    expect(parseMeasurementCaptureRecord({ ...record, drafts: [captureDraft(CHEST, { measurer: "IMPORTED" })] }).ok).toBe(true);
  });

  it("accepts only same-session successors that keep every earlier reading exactly", () => {
    const prior = withReading(captureSession());
    const { fields, ...identity } = JSON.parse(JSON.stringify(prior)) as MeasurementCaptureSession;
    const reordered = { fields, ...identity };
    expect(isMeasurementCaptureSessionSuccessor(prior, prior)).toBe(true);
    // Key order from a package or structured clone must not look like a changed reading.
    expect(isMeasurementCaptureSessionSuccessor(prior, reordered)).toBe(true);
    const repeated = withReading(prior, SECOND_READING_ID, "102", "cm", T2);
    expect(isMeasurementCaptureSessionSuccessor(prior, repeated)).toBe(true);
    const selected = selectCaptureReading(repeated, CHEST, READING_ID, T3);
    expect(isMeasurementCaptureSessionSuccessor(repeated, selected)).toBe(true);
    expect(isMeasurementCaptureSessionSuccessor(prior, selected)).toBe(true);

    expect(isMeasurementCaptureSessionSuccessor(prior, { ...repeated, id: "c200916f-baa3-4373-87f8-8d7481fb6053" })).toBe(false);
    expect(isMeasurementCaptureSessionSuccessor(prior, { ...repeated, styleId: OTHER_STYLE_ID })).toBe(false);
    expect(isMeasurementCaptureSessionSuccessor(prior, { ...repeated, recipeId: "skirt" })).toBe(false);
    expect(isMeasurementCaptureSessionSuccessor(prior, { ...repeated, createdAt: T1 })).toBe(false);
    expect(isMeasurementCaptureSessionSuccessor(repeated, prior)).toBe(false);
    expect(isMeasurementCaptureSessionSuccessor(prior, { ...repeated, updatedAt: TIME })).toBe(false);
    const sameRevisionChanged = { ...prior, fields: prior.fields.map((field) => ({ ...field, selectedReadingId: null })) };
    expect(isMeasurementCaptureSessionSuccessor(prior, sameRevisionChanged)).toBe(false);
    const rewritten = {
      ...repeated,
      fields: repeated.fields.map((field) => field.fieldId !== CHEST ? field : {
        ...field, readings: field.readings.map((reading, index) => index === 0 ? { ...reading, rawValue: "40" } : reading),
      }),
    };
    expect(isMeasurementCaptureSessionSuccessor(prior, rewritten)).toBe(false);
    const dropped = {
      ...repeated,
      fields: repeated.fields.map((field) => field.fieldId !== CHEST ? field : { ...field, readings: field.readings.slice(1) }),
    };
    expect(isMeasurementCaptureSessionSuccessor(prior, dropped)).toBe(false);
  });
});
