import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "./persist";
import {
  migrateLegacyRecovery,
  migrateLegacySaveFile,
  parseMigrationRecord,
  parseProjectRecord,
  parseRecoveryRecord,
  parseStyleRecord,
  validateProjectBundle,
  type ProjectRecord,
  type RecoveryRecord,
  type StyleRecord,
} from "./project-records";

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const OTHER_STYLE_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
const TIME = "2026-09-24T16:00:00.000Z";
const FABRIC = "#3A4150";
const migrated = (json = serialize(STANDARD_M, FABRIC)) => migrateLegacySaveFile({
  json, projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
});

function legacySave(version: number): string {
  const current = JSON.parse(serialize(STANDARD_M, FABRIC));
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
    expect(parseStyleRecord({ ...style, schemaVersion: 1 }).ok).toBe(false);
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
  });

  it("validates per-style recovery records and legacy recovery without altering unfinished raw input", () => {
    const recovery = validRecovery();
    expect(parseRecoveryRecord(null).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, extra: true }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, schemaVersion: 4 }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, styleId: "bad" }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, payload: { ...recovery.payload, unknown: true } }).ok).toBe(false);
    expect(parseRecoveryRecord({ ...recovery, payload: { ...recovery.payload, fabric: "bad" } }).ok).toBe(false);
    const cyclicMeasurements = { ...recovery.payload.measurements, chest: null } as Record<string, unknown>;
    cyclicMeasurements.chest = cyclicMeasurements;
    const cyclicPayload = { ...recovery.payload, measurements: cyclicMeasurements };
    expect(parseRecoveryRecord({ ...recovery, payload: cyclicPayload }).ok).toBe(false);
    const invalidRaw = JSON.stringify({ v: 1, ...recovery.payload, rawMeasurements: { chest: 2 } });
    expect(migrateLegacyRecovery(STYLE_ID, invalidRaw).ok).toBe(false);
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
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: 6 }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: 1.5 }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, sourceSaveVersion: null }).ok).toBe(true);
    expect(parseMigrationRecord({ ...marker, sourceSha256: "bad" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, migratedAt: "today" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, projectId: "bad" }).ok).toBe(false);
    expect(parseMigrationRecord({ ...marker, styleId: "bad" }).ok).toBe(false);
  });
});
