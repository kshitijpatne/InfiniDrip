import { describe, expect, it } from "vitest";
import { createEmptyTechPackRecord } from "./tech-pack-records";
import { parseTechPackOperationRecordSet } from "./tech-pack-operation-records";
import { evaluateTechPackOperationRecordSet } from "./tech-pack-operation-validation";
import { renderTechPackOperationEditor } from "./tech-pack-operation-editor";

const NOW = "2026-10-13T03:10:01.000Z";
const STYLE_ID = "10000000-0000-4000-8000-000000000001";

describe("T03 operation editor renderer", () => {
  it("labels the distinct origins and renders empty, disabled operation controls", () => {
    const record = createEmptyTechPackRecord(STYLE_ID, "tee", NOW, NOW);
    const data = { schemaVersion: 2 as const, recipeId: "tee" as const, operations: [] };
    const html = renderTechPackOperationEditor({ record, disabled: true, validation: evaluateTechPackOperationRecordSet(data) });
    expect(html).toContain("T03 · Construction operations");
    expect(html).toContain("Source-confirmed facts require a source reference");
    expect(html).toContain("RECIPE_DEFAULT");
    expect(html).toContain("USER_DECISION");
    expect(html).toContain("data-t03-empty");
    expect(html).toContain("Add unresolved operation</button>");
    expect(html).toContain('data-t03-action="add-unresolved-operation" disabled');
    expect(html).toContain("ABSENT 1");
  });

  it("escapes operation content and lists each validation origin with actionable guidance", () => {
    const record = createEmptyTechPackRecord(STYLE_ID, "tee", NOW, NOW);
    const operation = {
      id: "join-side-seam",
      name: { status: "USER_DECISION", value: "<script>&\"'", rationale: "<reason>" },
      sequence: { status: "ESTIMATE", value: 1, method: "fixture", assumptions: "synthetic" },
      componentRefs: { status: "RECIPE_DEFAULT", value: ["front"], recipeId: "tee", recipeVersionMarker: "v1", inAppLocator: "defaults" },
      seamRefs: { status: "SOURCE_CONFIRMED", value: ["side-seam"], source: { uri: "docs/fixture.md", title: "Fixture", locator: "Line 1" } },
      facts: [{ factId: "method", value: { status: "UNRESOLVED", value: null, unresolvedReason: "Need a source.", nextAction: "Add the sewing specification." } }],
    };
    const parsed = parseTechPackOperationRecordSet({ schemaVersion: 2, recipeId: "tee", operations: [operation] }, "tee");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validation = evaluateTechPackOperationRecordSet(parsed.value);
    const html = renderTechPackOperationEditor({
      record: { ...record, operationData: parsed.value },
      operationsJsonDraft: null,
      validation,
      validationError: null,
    });
    expect(html).toContain("&lt;script&gt;&amp;&quot;&#39;");
    expect(html).not.toContain("<script>");
    for (const status of ["USER_DECISION", "ESTIMATE", "RECIPE_DEFAULT", "SOURCE_CONFIRMED", "UNRESOLVED", "ABSENT"]) {
      expect(html).toContain(`data-t03-finding="${status}"`);
    }
    expect(html).toContain("Next:");
    expect(html).toContain("data-t03-action=\"remove-operation\"");
    expect(html).toContain("S773");
  });

  it("renders invalid JSON and valid empty finding states, and rejects unsupported recipes clearly", () => {
    const record = createEmptyTechPackRecord(STYLE_ID, "tee", NOW, NOW);
    const errorHtml = renderTechPackOperationEditor({ record, validation: null, validationError: "Invalid <JSON>" });
    expect(errorHtml).toContain("Invalid &lt;JSON&gt;");
    const noFindings = renderTechPackOperationEditor({
      record,
      validation: { findings: [], counts: { ABSENT: 0, UNRESOLVED: 0, CONFLICT: 0, RECIPE_DEFAULT: 0, ESTIMATE: 0, USER_DECISION: 0, SOURCE_CONFIRMED: 0 } },
    });
    expect(noFindings).toContain("ABSENT 0");
    expect(renderTechPackOperationEditor({ record, validation: null })).toContain("Enter a valid operation record");
    const unsupported = renderTechPackOperationEditor({ record: createEmptyTechPackRecord(STYLE_ID, "unknown", NOW, NOW) });
    expect(unsupported).toContain("This recipe is not supported");
  });
});
