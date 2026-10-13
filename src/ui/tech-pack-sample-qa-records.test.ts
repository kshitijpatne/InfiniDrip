import { describe, expect, it } from "vitest";
import {
  emptyTechPackPomRecordSet,
  parseTechPackPomRecordSet,
  sampleRoundsMatchStyleHistory,
  TECH_PACK_POM_DATA_VERSION,
  TECH_PACK_POM_MAX_EVIDENCE_REFS,
  TECH_PACK_POM_MAX_QA_OBSERVATIONS,
  TECH_PACK_POM_MAX_READINGS_PER_ROUND,
  TECH_PACK_POM_MAX_SAMPLE_ROUNDS,
} from "./tech-pack-sample-qa-records";

const NOW = "2026-10-13T00:00:00.000Z";
const STYLE_ID = "10000000-0000-4000-8000-000000000001";
const REVISION_ID = "10000000-0000-4000-8000-000000000002";
const ROUND_ID = "10000000-0000-4000-8000-000000000003";
const OBSERVATION_ID = "10000000-0000-4000-8000-000000000004";
const POM_SOURCE = { uri: "docs/research/pom.md", title: "Reviewed POM", locator: "Table 1" };

function confirmed<T>(value: T) {
  return { status: "SOURCE_CONFIRMED", value, source: POM_SOURCE };
}

function unresolved() {
  return { status: "UNRESOLVED", value: null, unresolvedReason: "Not recorded yet.", nextAction: "Review a source." };
}

function definition(overrides: Record<string, unknown> = {}) {
  return {
    id: "finished.chest",
    label: "Finished chest width",
    method: confirmed({ kind: "STRAIGHT_LINE", instructions: "Measure flat between named landmarks." }),
    landmarks: confirmed([{ id: "front.side", label: "Front side seam" }]),
    unit: "cm",
    tolerance: unresolved(),
    sizeRangeSource: unresolved(),
    gradeRuleSource: unresolved(),
    ...overrides,
  };
}

function reading(overrides: Record<string, unknown> = {}) {
  return {
    pomDefinitionId: "finished.chest",
    status: "MEASURED",
    actualValue: 52.25,
    unit: "cm",
    method: "Tape across the finished flat garment at the cited landmarks.",
    evidenceRefs: ["sample-note-1"],
    unresolvedReason: null,
    nextAction: null,
    ...overrides,
  };
}

function observation(overrides: Record<string, unknown> = {}) {
  return { id: OBSERVATION_ID, status: "OBSERVED", note: "One loose thread at the left cuff.", nextAction: null, ...overrides };
}

function round(overrides: Record<string, unknown> = {}) {
  return {
    id: ROUND_ID,
    targetRevisionId: REVISION_ID,
    targetRevisionNumber: 1,
    sampleLabel: "Proto A",
    sampleSizeId: "M",
    recordedAt: NOW,
    recordedBy: "Local reviewer",
    readings: [reading()],
    qaObservations: [observation()],
    ...overrides,
  };
}

function recordSet(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: TECH_PACK_POM_DATA_VERSION,
    definitions: {
      schemaVersion: 1,
      recipeId: "tee",
      definitions: [definition()],
    },
    sampleQaRounds: [round()],
    ...overrides,
  };
}

describe("T02 sample and QA record set", () => {
  it("creates explicit empty data for a supported recipe", () => {
    expect(emptyTechPackPomRecordSet("tee")).toEqual({
      schemaVersion: 1,
      definitions: { schemaVersion: 1, recipeId: "tee", definitions: [] },
      sampleQaRounds: [],
    });
  });

  it("parses actual readings separately with their own method, unit, and QA observations", () => {
    const result = parseTechPackPomRecordSet(recordSet(), "tee");
    expect(result).toEqual({ ok: true, value: recordSet() });
    if (result.ok) {
      expect(result.value.sampleQaRounds[0]!.readings[0]!.actualValue).toBe(52.25);
      expect(result.value.sampleQaRounds[0]!.readings[0]!).not.toHaveProperty("predictedValue");
      expect(result.value.sampleQaRounds[0]!.targetRevisionId).toBe(REVISION_ID);
    }
  });

  it("preserves explicit unknown actual readings and unresolved QA next actions", () => {
    const input = recordSet({ sampleQaRounds: [round({
      readings: [reading({ status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: "The sample has not been measured.", nextAction: "Record an actual reading." })],
      qaObservations: [observation({ status: "UNRESOLVED", note: "The seam finish has not been reviewed.", nextAction: "Inspect the seam and record an observation." })],
    })] });
    const result = parseTechPackPomRecordSet(input, "tee");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sampleQaRounds[0]!.readings[0]).toMatchObject({ status: "UNRESOLVED", actualValue: null });
      expect(result.value.sampleQaRounds[0]!.qaObservations[0]).toMatchObject({ status: "UNRESOLVED" });
    }
  });

  it("returns detached definitions and actual readings", () => {
    const input = recordSet();
    const result = parseTechPackPomRecordSet(input, "tee");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toBe(input);
      expect(result.value.definitions.definitions).not.toBe(input.definitions.definitions);
      expect(result.value.sampleQaRounds).not.toBe(input.sampleQaRounds);
      (input.sampleQaRounds[0]!.readings[0] as { actualValue: number }).actualValue = 60;
      expect(result.value.sampleQaRounds[0]!.readings[0]!.actualValue).toBe(52.25);
    }
  });

  it.each([
    null,
    [],
    { ...recordSet(), extra: true },
    { schemaVersion: 1, definitions: recordSet().definitions },
    { ...recordSet(), schemaVersion: 2 },
    { ...recordSet(), definitions: { ...recordSet().definitions, recipeId: "polo" } },
    { ...recordSet(), definitions: null },
    { ...recordSet(), sampleQaRounds: null },
    { ...recordSet(), sampleQaRounds: Array.from({ length: TECH_PACK_POM_MAX_SAMPLE_ROUNDS + 1 }, () => round()) },
  ])("rejects malformed T02 roots (%#)", (value) => {
    expect(parseTechPackPomRecordSet(value, "tee").ok).toBe(false);
  });

  it.each([
    null,
    { ...round(), extra: true },
    { ...round(), id: "bad" },
    { ...round(), targetRevisionId: "bad" },
    { ...round(), targetRevisionNumber: 0 },
    { ...round(), targetRevisionNumber: 1.5 },
    { ...round(), sampleLabel: " " },
    { ...round(), sampleSizeId: "" },
    { ...round(), recordedAt: "yesterday" },
    { ...round(), recordedBy: "" },
    { ...round(), readings: null },
    { ...round(), readings: Array.from({ length: TECH_PACK_POM_MAX_READINGS_PER_ROUND + 1 }, () => reading()) },
    { ...round(), qaObservations: null },
    { ...round(), qaObservations: Array.from({ length: TECH_PACK_POM_MAX_QA_OBSERVATIONS + 1 }, () => observation()) },
  ])("rejects malformed sample rounds (%#)", (value) => {
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [value] }), "tee").ok).toBe(false);
  });

  it.each([
    null,
    { ...reading(), extra: true },
    { ...reading(), pomDefinitionId: "" },
    { ...reading(), pomDefinitionId: "missing" },
    { ...reading(), actualValue: Number.NaN },
    { ...reading(), actualValue: Infinity },
    { ...reading(), unit: "inch" },
    { ...reading(), unit: "mm" },
    { ...reading(), method: " " },
    { ...reading(), evidenceRefs: null },
    { ...reading(), evidenceRefs: ["same", "same"] },
    { ...reading(), evidenceRefs: Array.from({ length: TECH_PACK_POM_MAX_EVIDENCE_REFS + 1 }, (_, index) => `e-${index}`) },
    { ...reading(), unresolvedReason: "unexpected" },
    { ...reading(), status: "UNRESOLVED", actualValue: 5 },
    { ...reading(), status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [""], unresolvedReason: "Not measured.", nextAction: "Measure the sample." },
    { ...reading(), status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: " ", nextAction: "Measure the sample." },
    { ...reading(), status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: "Not measured.", nextAction: " " },
    { ...reading(), status: "UNRESOLVED", actualValue: null, unit: null, method: null, unresolvedReason: "missing method", nextAction: "record method" },
    { ...reading(), status: "OTHER" },
  ])("rejects malformed or ambiguous readings (%#)", (value) => {
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [round({ readings: [value] })] }), "tee").ok).toBe(false);
  });

  it.each([
    null,
    { ...observation(), extra: true },
    { ...observation(), id: "bad" },
    { ...observation(), status: "PASS" },
    { ...observation(), note: " " },
    { ...observation(), status: "UNRESOLVED", nextAction: null },
    { ...observation(), nextAction: " " },
  ])("rejects malformed QA observations (%#)", (value) => {
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [round({ qaObservations: [value] })] }), "tee").ok).toBe(false);
  });

  it("rejects duplicate rounds, readings, and QA observations", () => {
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [round(), round()] }), "tee").ok).toBe(false);
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [round({ readings: [reading(), reading()] })] }), "tee").ok).toBe(false);
    expect(parseTechPackPomRecordSet(recordSet({ sampleQaRounds: [round({ qaObservations: [observation(), observation()] })] }), "tee").ok).toBe(false);
  });

  it("requires round targets to exist in this style's exact immutable history", () => {
    const records = parseTechPackPomRecordSet(recordSet(), "tee");
    expect(records.ok).toBe(true);
    if (!records.ok) return;
    const history = [{ styleId: STYLE_ID, revisionId: REVISION_ID, revisionNumber: 1 }];
    expect(sampleRoundsMatchStyleHistory(STYLE_ID, records.value, history)).toBe(true);
    expect(sampleRoundsMatchStyleHistory("20000000-0000-4000-8000-000000000001", records.value, history)).toBe(false);
    expect(sampleRoundsMatchStyleHistory(STYLE_ID, records.value, [])).toBe(false);
    expect(sampleRoundsMatchStyleHistory(STYLE_ID, emptyTechPackPomRecordSet("tee"), [])).toBe(true);
  });
});
