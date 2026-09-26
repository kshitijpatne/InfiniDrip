import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import {
  acceptCapturePreset,
  addCaptureReadingForField,
  assessCaptureField,
  attachCaptureSessionToStyle,
  captureFieldState,
  createMeasurementCaptureSession,
  measurementCaptureReadiness,
  parseMeasurementCaptureSession,
  selectCaptureReading,
  selectedCaptureValues,
  type MeasurementCaptureSession,
} from "./measurement-capture";

const SESSION_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const READING_1 = "d34a5104-ae25-4b54-9a2b-fcc35237ff71";
const READING_2 = "e78e0c40-ae1a-4d03-9470-80345f994734";
const READING_3 = "c200916f-baa3-4373-87f8-8d7481fb6053";
const TIME = "2026-09-26T08:00:00.000Z";

const baseReading = (id = READING_1) => ({
  id,
  rawValue: "100.250",
  enteredUnit: "cm",
  provenance: "USER_CAPTURED" as const,
  evidenceStatus: "UNCONFIRMED" as const,
  sourceLabel: "Value entered by user; capture technique not assessed",
  captureMethod: "Tape measure",
  capturedAt: TIME,
  measurer: "SELF" as const,
});

function teeSession(): MeasurementCaptureSession {
  return createMeasurementCaptureSession(SESSION_ID, "tee", TIME);
}

describe("measurement-first capture session", () => {
  it("starts every supported recipe with all consumed inputs unresolved and without defaults", () => {
    expect(GARMENTS).toHaveLength(7);
    for (const recipe of GARMENTS) {
      const session = createMeasurementCaptureSession(SESSION_ID, recipe.name, TIME);
      expect(session.fields).toHaveLength(recipe.fields.length + (recipe.options?.length ?? 0));
      expect(session.fields.every((field) => field.readings.length === 0 && field.selectedReadingId === null)).toBe(true);
      expect(measurementCaptureReadiness(session).ready).toBe(false);
      expect(parseMeasurementCaptureSession(session)).toEqual({ ok: true, value: session });
    }
  });

  it("preserves raw precision, converts inches without rounding, and waits for explicit selection between readings", () => {
    const session = teeSession();
    const chestId = "body.chest-girth";
    const first = addCaptureReadingForField(session, chestId, {
      ...baseReading(), rawValue: "40.125", enteredUnit: "in",
    }, "2026-09-26T08:00:01.000Z");
    expect(first.fields.find((field) => field.fieldId === chestId)).toMatchObject({
      selectedReadingId: READING_1,
      readings: [{ rawValue: "40.125", enteredUnit: "in", canonicalValue: 101.9175, revision: 1 }],
    });
    expect(captureFieldState(first.fields.find((field) => field.fieldId === chestId)!, "tee")).toBe("resolved");
    const second = addCaptureReadingForField(first, chestId, {
      ...baseReading(READING_2), rawValue: "102", enteredUnit: "cm",
    }, "2026-09-26T08:00:02.000Z");
    expect(captureFieldState(second.fields.find((field) => field.fieldId === chestId)!, "tee")).toBe("ambiguous");
    expect(second.fields.find((field) => field.fieldId === chestId)?.readings).toHaveLength(2);
    let selected = selectCaptureReading(second, chestId, READING_1, "2026-09-26T08:00:03.000Z");
    expect(selected.fields.find((field) => field.fieldId === chestId)?.readings[0]?.canonicalValue).toBe(101.9175);
    expect(selectedCaptureValues(selected)).toBeNull();
    for (const [index, field] of selected.fields.filter((candidate) => candidate.fieldId !== chestId).entries()) {
      const suffix = String(index + 1).padStart(12, "0");
      selected = acceptCapturePreset(selected, field.fieldId, `00000000-0000-4000-8000-${suffix}`,
        new Date(Date.parse(selected.updatedAt) + 1).toISOString());
    }
    expect(measurementCaptureReadiness(selected).ready).toBe(true);
    expect(selectedCaptureValues(selected)?.chest).toBe(101.9175);
    expect(parseMeasurementCaptureSession(selected).ok).toBe(true);
  });

  it("keeps blanks, nonnumeric entries, and out-of-range values visible and blocking", () => {
    const session = teeSession();
    const chestId = "body.chest-girth";
    for (const [id, rawValue] of [[READING_1, ""], [READING_2, "unknown"], [READING_3, "161"]]) {
      const next = addCaptureReadingForField(session, chestId, { ...baseReading(id), rawValue }, "2026-09-26T08:00:01.000Z");
      const field = next.fields.find((candidate) => candidate.fieldId === chestId)!;
      expect(field.readings[0]?.canonicalValue).toBe(rawValue === "161" ? 161 : null);
      expect(captureFieldState(field, "tee")).toBe("invalid");
      expect(parseMeasurementCaptureSession(next).ok).toBe(true);
      expect(selectedCaptureValues(next)).toBeNull();
      const assessment = assessCaptureField(field, "tee");
      expect(assessment).toMatchObject({
        state: "invalid",
        issue: rawValue.trim() === "" ? "blank" : rawValue === "161" ? "outside-guardrail" : "not-numeric",
      });
      if (rawValue !== "161") expect(assessment.correction).toContain("original text");
    }
    const offRange = addCaptureReadingForField(teeSession(), chestId, { ...baseReading(), rawValue: "161" }, "2026-09-26T08:00:01.000Z");
    expect(assessCaptureField(offRange.fields.find((field) => field.fieldId === chestId)!, "tee").correction)
      .toContain("software guardrail");
  });

  it("keeps explicitly conflicting evidence blocked until a fresh reading is deliberately selected", () => {
    const fieldId = "body.chest-girth";
    let session = addCaptureReadingForField(teeSession(), fieldId, {
      ...baseReading(), evidenceStatus: "CONFLICT",
    }, "2026-09-26T08:00:01.000Z");
    const conflicting = session.fields.find((field) => field.fieldId === fieldId)!;
    expect(captureFieldState(conflicting, "tee")).toBe("invalid");
    expect(assessCaptureField(conflicting, "tee").issue).toBe("conflicting-evidence");
    session = addCaptureReadingForField(session, fieldId, {
      ...baseReading(READING_2), rawValue: "100.5", evidenceStatus: "UNCONFIRMED",
      sourceLabel: "New user-entered reading; prior conflict retained",
    }, "2026-09-26T08:00:02.000Z");
    expect(captureFieldState(session.fields.find((field) => field.fieldId === fieldId)!, "tee")).toBe("ambiguous");
    session = selectCaptureReading(session, fieldId, READING_2, "2026-09-26T08:00:03.000Z");
    expect(captureFieldState(session.fields.find((field) => field.fieldId === fieldId)!, "tee")).toBe("resolved");
    expect(session.fields.find((field) => field.fieldId === fieldId)?.readings[0]?.evidenceStatus).toBe("CONFLICT");
  });

  it("provides correction actions for missing, ambiguous, and stale recipe fields", () => {
    const session = teeSession();
    expect(assessCaptureField(session.fields[0]!, "tee")).toMatchObject({
      state: "missing", issue: "missing", correction: expect.stringContaining("preset"),
    });
    const first = addCaptureReadingForField(session, "body.chest-girth", baseReading(), "2026-09-26T08:00:01.000Z");
    const second = addCaptureReadingForField(first, "body.chest-girth", { ...baseReading(READING_2) }, "2026-09-26T08:00:02.000Z");
    expect(assessCaptureField(second.fields.find((field) => field.fieldId === "body.chest-girth")!, "tee")).toMatchObject({
      state: "ambiguous", issue: "ambiguous", correction: expect.stringContaining("Choose"),
    });
    const stale = addCaptureReadingForField(session, "body.chest-girth", baseReading(), "2026-09-26T08:00:01.000Z")
      .fields.find((field) => field.fieldId === "body.chest-girth")!;
    expect(assessCaptureField({ ...stale, fieldId: "removed.field" }, "tee")).toMatchObject({
      state: "invalid", issue: "unsupported-field", correction: expect.stringContaining("Reload"),
    });
  });

  it("keeps the skirt Maxi 100–120 cm mismatch visible and blocks values above the shared 100 cm limit", () => {
    const session = createMeasurementCaptureSession(SESSION_ID, "skirt", TIME);
    const length = session.fields.find((field) => field.inputKey === "length")!;
    const next = addCaptureReadingForField(session, length.fieldId, {
      ...baseReading(), rawValue: "110", provenance: "USER_SELECTED",
      sourceLabel: "User-selected finished skirt length target",
    }, "2026-09-26T08:00:01.000Z");
    const field = next.fields.find((candidate) => candidate.fieldId === length.fieldId)!;
    const assessment = assessCaptureField(field, "skirt");
    expect(assessment).toMatchObject({ state: "invalid", issue: "outside-guardrail" });
    expect(assessment.correction).toContain("Maxi style label extends to 120 cm");
    expect(assessment.correction).toContain("value is not changed automatically");
  });

  it("requires explicit acceptance for presets and keeps them distinct from captured body facts", () => {
    const accepted = acceptCapturePreset(teeSession(), "body.chest-girth", READING_1, "2026-09-26T08:00:01.000Z");
    expect(accepted.fields.find((field) => field.fieldId === "body.chest-girth")?.readings[0]).toMatchObject({
      rawValue: "100", provenance: "PRESET", evidenceStatus: "UNCONFIRMED",
      sourceLabel: expect.stringContaining("not measured wearer data"),
    });
    expect(captureFieldState(accepted.fields.find((field) => field.fieldId === "body.chest-girth")!, "tee")).toBe("resolved");
    expect(parseMeasurementCaptureSession(accepted).ok).toBe(true);
  });

  it("attaches a session to one saved style and rejects changing its owner", () => {
    const session = teeSession();
    const attached = attachCaptureSessionToStyle(session, STYLE_ID, "2026-09-26T08:00:01.000Z");
    expect(attached.styleId).toBe(STYLE_ID);
    expect(attachCaptureSessionToStyle(attached, STYLE_ID, "invalid")).toBe(attached);
    expect(() => attachCaptureSessionToStyle(attached, SESSION_ID, "2026-09-26T08:00:02.000Z"))
      .toThrow("already belongs to another style");
    expect(() => attachCaptureSessionToStyle(session, "bad-id", "2026-09-26T08:00:01.000Z"))
      .toThrow("must be a UUID");
    expect(() => attachCaptureSessionToStyle(session, STYLE_ID, "2026-09-26T07:59:59.000Z"))
      .toThrow("canonical and monotonic");
    expect(() => attachCaptureSessionToStyle(session, STYLE_ID, 123 as unknown as string))
      .toThrow("canonical and monotonic");
  });

  it("rejects unsupported fields, contradictory semantic kinds, bad timestamps and duplicate reading IDs", () => {
    const session = teeSession();
    expect(() => createMeasurementCaptureSession("bad-id", "tee", TIME)).toThrow("session ID must be a UUID");
    expect(() => createMeasurementCaptureSession(SESSION_ID, "unknown", TIME)).toThrow("supported recipe");
    expect(() => createMeasurementCaptureSession(SESSION_ID, "tee", "yesterday")).toThrow("canonical UTC time");
    expect(() => createMeasurementCaptureSession(SESSION_ID, "tee", TIME, "bad-style")).toThrow("style ID");
    expect(() => addCaptureReadingForField(session, "missing", baseReading(), TIME)).toThrow("not defined by the active recipe");
    expect(() => acceptCapturePreset(session, "missing", READING_3, "2026-09-26T08:00:01.000Z"))
      .toThrow("not defined by the active recipe");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), enteredUnit: "inch",
    }, "2026-09-26T08:00:01.000Z")).toThrow("unit does not match");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), provenance: "USER_SELECTED",
    }, "2026-09-26T08:00:01.000Z")).toThrow("cannot be recorded as a selected garment target");
    const torso = createMeasurementCaptureSession(SESSION_ID, "trouser", TIME);
    expect(() => addCaptureReadingForField(torso, "target.finished-thigh-girth", {
      ...baseReading(), provenance: "USER_CAPTURED",
    }, "2026-09-26T08:00:01.000Z")).toThrow("Only a body-measure field");
    const first = addCaptureReadingForField(session, "body.chest-girth", baseReading(), "2026-09-26T08:00:01.000Z");
    expect(() => addCaptureReadingForField(first, "body.chest-girth", baseReading(), "2026-09-26T08:00:02.000Z"))
      .toThrow("reading ID already exists");
    expect(() => selectCaptureReading(first, "body.chest-girth", "00000000-0000-4000-8000-000000000000", "2026-09-26T08:00:02.000Z"))
      .toThrow("Choose a recorded measurement reading");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), capturedAt: "not-a-date",
    }, "2026-09-26T08:00:01.000Z")).toThrow("Capture date must be canonical");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), measurer: "UNKNOWN" as "SELF",
    }, "2026-09-26T08:00:01.000Z")).toThrow("measurer is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), captureMethod: 12 as unknown as string,
    }, "2026-09-26T08:00:01.000Z")).toThrow("capture method is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), captureMethod: "x".repeat(257),
    }, "2026-09-26T08:00:01.000Z")).toThrow("capture method is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), rawValue: "x".repeat(4097),
    }, "2026-09-26T08:00:01.000Z")).toThrow("raw value is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), sourceLabel: "x".repeat(501),
    }, "2026-09-26T08:00:01.000Z")).toThrow("source label is required");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), provenance: "INHERITED" as "USER_CAPTURED",
    }, "2026-09-26T08:00:01.000Z")).toThrow("provenance or evidence status is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), evidenceStatus: "SAMPLE_MEASURED" as "UNCONFIRMED",
    }, "2026-09-26T08:00:01.000Z")).toThrow("provenance or evidence status is invalid");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(), id: "bad-id",
    }, "2026-09-26T08:00:01.000Z")).toThrow("reading ID must be a UUID");
    expect(() => addCaptureReadingForField(session, "body.chest-girth", baseReading(), "not-a-time"))
      .toThrow("update time must be canonical and monotonic");
    let full = session;
    for (let index = 0; index < 100; index += 1) {
      full = acceptCapturePreset(full, "body.chest-girth", `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        new Date(Date.parse(full.updatedAt) + 1).toISOString());
    }
    expect(() => acceptCapturePreset(full, "body.chest-girth", "00000000-0000-4000-8000-000000000101",
      new Date(Date.parse(full.updatedAt) + 1).toISOString())).toThrow("reached its reading limit");
  });

  it("strictly rejects malformed records and accepts valid but explicitly unresolved captures", () => {
    const session = addCaptureReadingForField(teeSession(), "body.chest-girth", baseReading(), "2026-09-26T08:00:01.000Z");
    const shirtSession = createMeasurementCaptureSession(SESSION_ID, "woven-shirt", TIME);
    const optionField = shirtSession.fields.find((field) => field.unit === "buttons");
    if (!optionField) throw new Error("Expected the woven-shirt recipe to expose its button-count input.");
    const optionSession = acceptCapturePreset(shirtSession, optionField.fieldId, READING_2, "2026-09-26T08:00:01.000Z");
    const wrongUnit = structuredClone(optionSession) as unknown as Record<string, unknown>;
    (((wrongUnit.fields as Array<Record<string, unknown>>).find((field) => field.fieldId === optionField.fieldId)!.readings as Array<Record<string, unknown>>)[0]!).enteredUnit = "cm";
    expect(parseMeasurementCaptureSession(wrongUnit).ok).toBe(false);
    const mutations: Array<(candidate: Record<string, unknown>) => void> = [
      (candidate) => { candidate.unexpected = true; },
      (candidate) => { candidate.schemaVersion = 9; },
      (candidate) => { candidate.definitionVersion = 9; },
      (candidate) => { candidate.id = "bad-id"; },
      (candidate) => { candidate.styleId = "bad-id"; },
      (candidate) => { candidate.revision = -1; },
      (candidate) => { candidate.createdAt = "yesterday"; },
      (candidate) => { candidate.updatedAt = "2026-09-26T07:59:59.000Z"; },
      (candidate) => { candidate.recipeId = "unknown"; },
      (candidate) => { candidate.fields = []; },
      (candidate) => { (candidate.fields as Array<Record<string, unknown>>)[0]!.semanticKind = "PATTERN_PARAMETER"; },
      (candidate) => { (candidate.fields as Array<Record<string, unknown>>)[0]!.extra = true; },
      (candidate) => { (candidate.fields as Array<Record<string, unknown>>)[0]!.readings = "bad"; },
      (candidate) => { (candidate.fields as Array<Record<string, unknown>>)[0]!.selectedReadingId = "missing"; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).extra = true; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).canonicalValue = 101; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).enteredUnit = "in"; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).sourceLabel = ""; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).revision = 0; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).capturedAt = "bad"; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).measurer = "UNKNOWN"; },
      (candidate) => { (((candidate.fields as Array<Record<string, unknown>>)[0]!.readings as Array<Record<string, unknown>>)[0]!).provenance = "USER_SELECTED"; },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(session) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(parseMeasurementCaptureSession(candidate).ok).toBe(false);
    }
    expect(parseMeasurementCaptureSession({ ...session, fields: null }).ok).toBe(false);
    expect(parseMeasurementCaptureSession(null).ok).toBe(false);
  });

  it("requires deliberate selection after multiple readings and never infers disagreement thresholds", () => {
    let session = teeSession();
    session = addCaptureReadingForField(session, "body.chest-girth", baseReading(READING_1), "2026-09-26T08:00:01.000Z");
    session = addCaptureReadingForField(session, "body.chest-girth", {
      ...baseReading(READING_2), rawValue: "100.251", captureMethod: "Tape measure, repeat",
    }, "2026-09-26T08:00:02.000Z");
    expect(measurementCaptureReadiness(session).states["body.chest-girth"]).toBe("ambiguous");
    expect(measurementCaptureReadiness(session).unresolvedFieldIds).toContain("body.chest-girth");
    session = selectCaptureReading(session, "body.chest-girth", READING_2, "2026-09-26T08:00:03.000Z");
    expect(measurementCaptureReadiness(session).states["body.chest-girth"]).toBe("resolved");
    expect(parseMeasurementCaptureSession(session).ok).toBe(true);
  });
});
