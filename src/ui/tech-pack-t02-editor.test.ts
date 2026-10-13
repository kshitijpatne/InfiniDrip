import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M } from "../drafting";
import { createEmptyTechPackRecord, type TechPackRecord } from "./tech-pack-records";
import type { TechPackPomDefinition } from "./tech-pack-pom-records";
import { emptyTechPackPomRecordSet, type TechPackPomRecordSet, type TechPackPomSampleQaRound } from "./tech-pack-sample-qa-records";
import { renderTechPackT02Editor } from "./tech-pack-t02-editor";
import { evaluateTechPackT02 } from "./tech-pack-t02-validation";

const TIME = "2026-10-12T12:00:00.000Z";
const REVISION_ONE = "00000000-0000-4000-8000-000000000101";
const REVISION_TWO = "00000000-0000-4000-8000-000000000102";
const ROUND_ONE = "00000000-0000-4000-8000-000000000201";
const ROUND_TWO = "00000000-0000-4000-8000-000000000202";
const OBSERVATION_ONE = "00000000-0000-4000-8000-000000000301";
const OBSERVATION_TWO = "00000000-0000-4000-8000-000000000302";

function unresolvedFact(reason: string, action: string) {
  return { status: "UNRESOLVED" as const, value: null, unresolvedReason: reason, nextAction: action };
}

function definition(id: string, label: string): TechPackPomDefinition {
  return {
    id, label, unit: "cm",
    method: unresolvedFact("No source", "Find source"),
    landmarks: unresolvedFact("No source", "Find landmarks"),
    tolerance: unresolvedFact("No source", "Find tolerance"),
    sizeRangeSource: unresolvedFact("No source", "Find size range"),
    gradeRuleSource: unresolvedFact("No source", "Find grade rule"),
  };
}

function withPomData(data: TechPackPomRecordSet): TechPackRecord {
  return { ...createEmptyTechPackRecord("00000000-0000-4000-8000-000000000001", "tee", TIME, TIME), schemaVersion: 2, pomData: data };
}

function emptyRound(id: string): TechPackPomSampleQaRound {
  return {
    id, targetRevisionId: REVISION_ONE, targetRevisionNumber: 1, sampleLabel: "Sample", sampleSizeId: "M",
    recordedAt: TIME, recordedBy: "Maker", readings: [], qaObservations: [],
  };
}

describe("T02 sample and QA editor renderer", () => {
  it("reports unsupported recipes without inventing a record contract", () => {
    const record = createEmptyTechPackRecord("00000000-0000-4000-8000-000000000001", "unsupported", TIME, TIME);
    expect(renderTechPackT02Editor({ record, revisions: [] })).toContain("This recipe has no T02 record contract.");
  });

  it("renders an empty supported recipe as explicitly unrecorded and waits for immutable history", () => {
    const record = createEmptyTechPackRecord("00000000-0000-4000-8000-000000000001", "tee", TIME, TIME);
    const html = renderTechPackT02Editor({ record, revisions: [] });
    expect(html).toContain("No POM definitions are recorded");
    expect(html).toContain("No sample/QA rounds recorded");
    expect(html).toContain("No immutable style revision is available");
    expect(html).toContain("data-t02-action=\"add-round\" disabled");
    expect(html).toContain("Definition source records (JSON)");
  });

  it("renders actuals, unresolved readings, observations, revision binding, and escaped source text", () => {
    const definitions = [definition("chest.width", `Chest <width> & "span"`), definition("body.length", "Body length")];
    const first: TechPackPomSampleQaRound = {
      ...emptyRound(ROUND_ONE), sampleLabel: "Proto <one>", sampleSizeId: `M' & L`, recordedBy: `Maker "A"`,
      readings: [
        { pomDefinitionId: "chest.width", status: "MEASURED", actualValue: 52.5, unit: "cm", method: "Flat tape", evidenceRefs: ["note-1"], unresolvedReason: null, nextAction: null },
      ],
      qaObservations: [
        { id: OBSERVATION_ONE, status: "OBSERVED", note: `Seam <ok> & 'view'`, nextAction: null },
        { id: OBSERVATION_TWO, status: "UNRESOLVED", note: "Need another look", nextAction: "Inspect after pressing" },
      ],
    };
    const second: TechPackPomSampleQaRound = {
      ...emptyRound(ROUND_TWO), sampleLabel: "Revision two", targetRevisionId: REVISION_TWO, targetRevisionNumber: 2,
      readings: [
        { pomDefinitionId: "chest.width", status: "MEASURED", actualValue: 53, unit: "cm", method: "Flat tape", evidenceRefs: [], unresolvedReason: null, nextAction: null },
        { pomDefinitionId: "body.length", status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: "No sample", nextAction: "Measure when sample arrives" },
      ],
    };
    const third = emptyRound("00000000-0000-4000-8000-000000000203");
    const data: TechPackPomRecordSet = {
      schemaVersion: 1,
      definitions: { schemaVersion: 1, recipeId: "tee", definitions },
      sampleQaRounds: [first, second, third],
    };
    const html = renderTechPackT02Editor({
      record: withPomData(data),
      revisions: [{ revisionId: REVISION_TWO, revisionNumber: 2 }, { revisionId: REVISION_ONE, revisionNumber: 1 }],
      definitionsJsonDraft: `</textarea><script>alert("x")</script>`,
    });

    expect(html).toContain("Chest &lt;width&gt; &amp; &quot;span&quot;");
    expect(html).toContain("Proto &lt;one&gt;");
    expect(html).toContain("M&#39; &amp; L");
    expect(html).toContain("Maker &quot;A&quot;");
    expect(html).toContain("Recorded sample actual");
    expect(html).toContain("Actual reading unresolved");
    expect(html).toContain("Flat tape");
    expect(html).toContain("Measure when sample arrives");
    expect(html).toContain("Editing this round will not retarget it.");
    expect(html).toContain("&lt;/textarea&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("No unrecorded POM definition is available for this round.");
    expect(html).toContain("No actual readings recorded. Predicted values remain separate.");
    expect(html).toContain("No QA observations recorded. This does not imply a pass.");
    expect(html).toContain("data-t02-reading-status=\"UNRESOLVED\"");
    expect(html).toContain("data-t02-round=\"00000000-0000-4000-8000-000000000202\"");
    expect(html).not.toMatch(/data-t02-predicted-value/);
    expect(html).not.toMatch(/QA (pass|fail)/i);
  });

  it("renders a defensive missing-definition label and a disabled editor state", () => {
    const round = {
      ...emptyRound(ROUND_ONE),
      readings: [
        { pomDefinitionId: "missing.pom", status: "MEASURED", actualValue: null, unit: "cm", method: null, evidenceRefs: [], unresolvedReason: null, nextAction: null },
        { pomDefinitionId: "missing.other", status: "UNRESOLVED", actualValue: null, unit: null, method: null, evidenceRefs: [], unresolvedReason: null, nextAction: null },
      ],
    } as unknown as TechPackPomSampleQaRound;
    const data: TechPackPomRecordSet = { schemaVersion: 1, definitions: { schemaVersion: 1, recipeId: "tee", definitions: [] }, sampleQaRounds: [round] };
    const html = renderTechPackT02Editor({ record: withPomData(data), revisions: [{ revisionId: REVISION_ONE, revisionNumber: 1 }], disabled: true });
    expect(html).toContain("Missing POM missing.pom");
    expect(html).toContain("data-t02-action=\"remove-reading\" data-t02-round-id=\"00000000-0000-4000-8000-000000000201\" data-t02-pom-id=\"missing.pom\" disabled");
    expect(html).toContain("data-t02-action=\"add-round\" disabled");
  });

  it("renders actionable callout gaps, sourced size-run status, and separate pattern predictions", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const data = emptyTechPackPomRecordSet("tee");
    const record = withPomData(data);
    const validation = evaluateTechPackT02({
      record, data, recipe, measurements: STANDARD_M, options: {}, sizeSteps: recipe.sizes,
    });
    const html = renderTechPackT02Editor({ record, revisions: [], validation });
    expect(html).toContain("Callout and size-run checks");
    expect(html).toContain("No T02 definition matches this recipe POM label.");
    expect(html).toContain("exact label");
    expect(html).toContain("Pattern predictions by size");
    expect(html).toContain("not source-confirmed production measurements");
    expect(html).toContain("predicted pattern values stay separate");
    expect(html).toContain("data-t02-callout-ready=\"false\"");
    expect(html).toContain("0/10 callouts have complete sources");
  });

  it("renders passing digital consistency without implying fit or production acceptance", () => {
    const record = withPomData(emptyTechPackPomRecordSet("tee"));
    const html = renderTechPackT02Editor({
      record,
      revisions: [],
      validation: {
        recipeId: "tee",
        sizeIds: ["M"],
        baseSizeId: "M",
        callouts: [{ label: "Chest width", definitionId: "chest-width", ready: true }],
        predictions: [{ label: "Chest width", values: [{ sizeId: "M", value: 48.2 }] }],
        findings: [],
        completeCalloutCount: 1,
        sizeRunReady: true,
        ready: true,
      },
    });
    expect(html).toContain("T02 record checks pass. Physical fit and production acceptance are not established.");
    expect(html).toContain("Definition chest-width");
    expect(html).toContain("48.2 cm");
  });

  it("renders unavailable predictions and an incomplete empty run with actionable findings", () => {
    const record = withPomData(emptyTechPackPomRecordSet("tee"));
    const html = renderTechPackT02Editor({
      record,
      revisions: [],
      validation: {
        recipeId: "tee",
        sizeIds: [],
        baseSizeId: null,
        callouts: [],
        predictions: [{ label: "Uncalculated POM", values: [{ sizeId: "M", value: null }] }],
        findings: [{
          calloutLabel: null,
          field: "Size run",
          status: "INVALID",
          message: "The recipe declares no sizes.",
          nextAction: "Repair the recipe size run before checking a T02 record.",
        }],
        completeCalloutCount: 0,
        sizeRunReady: false,
        ready: false,
      },
    });
    expect(html).toContain("0/0 callouts have complete sources; size run needs action.");
    expect(html).toContain("No sizes declared");
    expect(html).toContain("Base size: unresolved");
    expect(html).toContain("No recipe POM callouts are declared.");
    expect(html).toContain("Uncalculated POM");
    expect(html).toContain("Unavailable");
  });

  it("renders an empty prediction state and the incomplete digital consistency phrase", () => {
    const record = withPomData(emptyTechPackPomRecordSet("tee"));
    const html = renderTechPackT02Editor({
      record,
      revisions: [],
      validation: {
        recipeId: "tee",
        sizeIds: [],
        baseSizeId: null,
        callouts: [{ label: "Chest width", definitionId: null, ready: false }],
        predictions: [],
        findings: [],
        completeCalloutCount: 0,
        sizeRunReady: true,
        ready: false,
      },
    });
    expect(html).toContain("size run consistent");
    expect(html).toContain("No predicted POM values are available.");
  });

  it("pauses checks when the edited definition JSON is invalid and escapes the error", () => {
    const record = withPomData(emptyTechPackPomRecordSet("tee"));
    const html = renderTechPackT02Editor({ record, revisions: [], validation: null, validationError: "bad <source>" });
    expect(html).toContain("Checks are paused because the edited POM definitions are invalid: bad &lt;source&gt;");
    expect(html).not.toContain("data-t02-validation=\"READY\"");
  });
});
