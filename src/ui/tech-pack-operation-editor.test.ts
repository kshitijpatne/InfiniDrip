import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M } from "../drafting";
import { createEmptyTechPackRecord } from "./tech-pack-records";
import { parseTechPackOperationRecordSet, unresolvedTechPackOperation } from "./tech-pack-operation-records";
import { evaluateTechPackOperationRecordSet } from "./tech-pack-operation-validation";
import { buildTechPackReferenceReconciliation } from "./tech-pack-operation-reconciliation";
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

  it("renders the read-only pattern inventory, escaped reconciliation findings, and unavailable guidance", () => {
    const record = createEmptyTechPackRecord(STYLE_ID, "tee", NOW, NOW);
    const recipe = GARMENTS.find((item) => item.name === "tee")!;
    const reconciliation = buildTechPackReferenceReconciliation(record, recipe, STANDARD_M, {}, null);
    const withFinding = {
      ...reconciliation,
      inventory: {
        ...reconciliation.inventory,
        components: reconciliation.inventory.components.map((component, index) => index === 0
          ? { ...component, id: "", pieceName: "<Front>", valid: false }
          : { ...component, pieceName: "", valid: false }),
        seams: reconciliation.inventory.seams.map((seam, index) => index === 0
          ? { ...seam, id: "", label: "", valid: false }
          : seam),
      },
      findings: [{
        code: "SYNTHETIC_UNKNOWN",
        status: "UNKNOWN" as const,
        path: "bomRows.synthetic.componentRef",
        message: "<stale component>",
        nextAction: "<correct it>",
      }],
    };
    const html = renderTechPackOperationEditor({ record, referenceReconciliation: withFinding });
    expect(html).toContain("Pattern reference reconciliation");
    expect(html).toContain("data-t03-component-id=");
    expect(html).toContain("data-t03-seam-id=");
    expect(html).toContain("&lt;Front&gt;");
    expect(html).toContain("&lt;stale component&gt;");
    expect(html).not.toContain("<stale component>");
    expect(html).toContain("T03 component and seam references use the lowercase IDs shown here");
    expect(html).toContain("not source or manufacturing data");

    const cleanHtml = renderTechPackOperationEditor({ record, referenceReconciliation: reconciliation });
    expect(cleanHtml).toContain("data-t03-reference-clean");

    const unavailable = buildTechPackReferenceReconciliation(record, null, STANDARD_M, {}, null);
    const unavailableHtml = renderTechPackOperationEditor({ record, referenceReconciliation: unavailable });
    expect(unavailableHtml).toContain("No pattern components are available.");
    expect(unavailableHtml).toContain("No stitch declarations are available.");
    expect(unavailableHtml).toContain('data-t03-reference-status="UNSUPPORTED"');

    const unresolvedRecord = {
      ...record,
      operationData: { schemaVersion: 2 as const, recipeId: "tee" as const, operations: [unresolvedTechPackOperation("operation-shell")] },
    };
    expect(renderTechPackOperationEditor({ record: unresolvedRecord })).toContain("Operation name unresolved");
  });
});
