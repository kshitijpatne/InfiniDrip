import { describe, expect, it } from "vitest";
import { createEmptyTechPackRecord, type TechPackRecord } from "./tech-pack-records";
import {
  PRODUCTION_PACK_FORMAT,
  PRODUCTION_PACK_PRESETS,
  PRODUCTION_PACK_SECTIONS,
  type ProductionPackManifest,
  type ProductionPackOutputs,
  type ProductionPackSection,
} from "./tech-pack-output";
import {
  productionPackOutputMatchesCurrentRevision,
  renderProductionPackPanel,
  type ProductionPackPanelInput,
  type ProductionPackRevisionBinding,
} from "./tech-pack-presentation";

const STYLE_ID = "11111111-1111-4111-8111-111111111111";
const REVISION_ID = "22222222-2222-4222-8222-222222222222";
const DIGEST = "a".repeat(64);
const NOW = "2026-10-01T00:00:00.000Z";

function record(overrides: Partial<TechPackRecord> = {}): TechPackRecord {
  return {
    ...createEmptyTechPackRecord(STYLE_ID, "tee", NOW, NOW),
    revisionId: REVISION_ID,
    revisionNumber: 4,
    approval: { state: "REVIEW", revisionId: REVISION_ID, scopeFieldIds: ["cover.styleName"], changedBy: null, changedAt: null, manifestId: null },
    ...overrides,
  };
}

function outputsFor(inputRecord = record(), sections: readonly ProductionPackSection[] = PRODUCTION_PACK_SECTIONS): ProductionPackOutputs {
  const selectedSections = [...sections];
  const omittedSections = PRODUCTION_PACK_SECTIONS.filter((section) => !selectedSections.includes(section));
  const manifest: ProductionPackManifest = {
    format: PRODUCTION_PACK_FORMAT,
    packageVersion: 1,
    exporterVersion: "tech-pack-output-v1",
    styleId: STYLE_ID,
    recipeId: "tee",
    recipeVersion: inputRecord.recipeVersion,
    revisionId: REVISION_ID,
    revisionNumber: 4,
    revisionContentDigest: DIGEST,
    recordSchemaVersion: inputRecord.schemaVersion,
    preset: "complete-pack",
    selectedSections,
    recordPath: "records/tech-pack.json",
    artifacts: [{
      path: "documents/production-pack.pdf",
      role: "production-pdf",
      mediaType: "application/pdf",
      byteLength: 1,
      sha256: DIGEST,
      assetId: null,
      displayName: "production-pack.pdf",
      sourceLabel: null,
      attribution: null,
    }],
  };
  return {
    pdfBytes: new Uint8Array([37]),
    archiveBytes: new Uint8Array([80, 75, 3, 4]),
    recordJson: "{}",
    manifest,
    presentation: {
      format: PRODUCTION_PACK_FORMAT,
      fileName: "production-pack.pdf",
      mediaType: "application/pdf",
      styleId: STYLE_ID,
      recipeId: "tee",
      recipeVersion: inputRecord.recipeVersion,
      revisionId: REVISION_ID,
      revisionNumber: 4,
      revisionContentDigest: DIGEST,
      approvalState: inputRecord.approval.state,
      approvalRevisionId: inputRecord.approval.revisionId,
      approvalScopeFieldIds: inputRecord.approval.scopeFieldIds,
      selectedSections,
      omittedSections,
      record: inputRecord,
      disclaimer: "Local digital review only; no supplier or production acceptance is established.",
    },
  };
}

const bindingFor = (outputs: ProductionPackOutputs): ProductionPackRevisionBinding => ({
  styleId: STYLE_ID,
  recipeId: "tee",
  recipeVersion: outputs.presentation.recipeVersion,
  revisionId: REVISION_ID,
  revisionNumber: 4,
  revisionContentDigest: DIGEST,
  approvalState: outputs.presentation.approvalState,
  approvalRevisionId: outputs.presentation.approvalRevisionId,
  approvalScopeFieldIds: outputs.presentation.approvalScopeFieldIds,
});

function panel(overrides: Partial<ProductionPackPanelInput> = {}): ProductionPackPanelInput {
  return {
    preset: "complete-pack",
    selectedSections: PRODUCTION_PACK_PRESETS["complete-pack"],
    controlsDisabled: false,
    canGenerate: true,
    state: { kind: "unavailable", message: "No preview generated." },
    ...overrides,
  };
}

describe("productionPackOutputMatchesCurrentRevision", () => {
  it("requires the full style, immutable revision, record and review binding", () => {
    const outputs = outputsFor();
    const current = bindingFor(outputs);
    expect(productionPackOutputMatchesCurrentRevision(outputs, current)).toBe(true);
    expect(productionPackOutputMatchesCurrentRevision(outputs, null)).toBe(false);
    expect(productionPackOutputMatchesCurrentRevision(outputs, { ...current, revisionId: null })).toBe(false);
    expect(productionPackOutputMatchesCurrentRevision(outputs, { ...current, revisionContentDigest: null })).toBe(false);

    const bindingChanges: Partial<ProductionPackRevisionBinding>[] = [
      { styleId: "different-style" }, { recipeId: "woven-shirt" }, { recipeVersion: "other" },
      { revisionId: "different-revision" }, { revisionNumber: 5 }, { revisionContentDigest: "b".repeat(64) },
      { approvalState: "APPROVED" }, { approvalRevisionId: "different-approval-revision" },
      { approvalScopeFieldIds: [] }, { approvalScopeFieldIds: ["other.field"] },
    ];
    for (const change of bindingChanges) {
      expect(productionPackOutputMatchesCurrentRevision(outputs, { ...current, ...change })).toBe(false);
    }

    const modelChanges: Partial<ProductionPackOutputs["presentation"]>[] = [
      { styleId: "different-style" }, { recipeId: "woven-shirt" }, { recipeVersion: "other" },
      { revisionId: "different-revision" }, { revisionNumber: 5 }, { revisionContentDigest: "b".repeat(64) },
      { approvalState: "APPROVED" }, { approvalRevisionId: "different-approval-revision" },
      { approvalScopeFieldIds: [] }, { approvalScopeFieldIds: ["other.field"] },
      { record: { ...outputs.presentation.record, styleId: "different-style" } },
      { record: { ...outputs.presentation.record, recipeId: "woven-shirt" } },
      { record: { ...outputs.presentation.record, recipeVersion: "other" } },
      { record: { ...outputs.presentation.record, revisionId: "different-revision" } },
      { record: { ...outputs.presentation.record, revisionNumber: 5 } },
    ];
    for (const change of modelChanges) {
      expect(productionPackOutputMatchesCurrentRevision({
        ...outputs,
        presentation: { ...outputs.presentation, ...change },
      }, current)).toBe(false);
    }

    const manifestChanges: Partial<ProductionPackManifest>[] = [
      { styleId: "different-style" }, { recipeId: "woven-shirt" }, { recipeVersion: "other" },
      { revisionId: "different-revision" }, { revisionNumber: 5 }, { revisionContentDigest: "b".repeat(64) },
    ];
    for (const change of manifestChanges) {
      expect(productionPackOutputMatchesCurrentRevision({ ...outputs, manifest: { ...outputs.manifest, ...change } }, current)).toBe(false);
    }
  });
});

describe("renderProductionPackPanel", () => {
  it("shows explicit unavailable, stale, and generating states with disabled controls", () => {
    const unavailable = renderProductionPackPanel(panel({
      controlsDisabled: true,
      canGenerate: false,
      state: { kind: "unavailable", message: "Save a current revision first." },
    }));
    expect(unavailable).toContain("Save a current revision first.");
    expect(unavailable).toContain('role="status"');
    expect(unavailable).toContain("disabled");
    expect(unavailable).not.toContain("data-production-pack-download");

    const stale = renderProductionPackPanel(panel({ state: { kind: "stale", message: "Reload and generate again." } }));
    expect(stale).toContain('role="alert"');
    expect(stale).toContain("Reload and generate again.");

    const generating = renderProductionPackPanel(panel({
      state: { kind: "generating" },
      controlsDisabled: true,
    }));
    expect(generating).toContain('aria-busy="true"');
    expect(generating).toContain("Generating the revision-bound PDF and editable ZIP preview");
    expect(generating).toContain('data-production-pack-action="generate" disabled');
  });

  it("renders the three presets and keeps required identity, source, and review sections selected", () => {
    for (const preset of ["complete-pack", "materials-construction", "measurements-qa"] as const) {
      const markup = renderProductionPackPanel(panel({ preset, selectedSections: PRODUCTION_PACK_PRESETS[preset] }));
      expect(markup).toContain(`value="${preset}" selected`);
      expect(markup.match(/\(always included\)/g)).toHaveLength(3);
      expect(markup).toContain('data-pack-section-toggle="identity" checked disabled');
      expect(markup).toContain('data-pack-section-toggle="sources-open-items" checked disabled');
      expect(markup).toContain('data-pack-section-toggle="approval-disclaimer" checked disabled');
    }
    const disabledOptional = renderProductionPackPanel(panel({ controlsDisabled: true }));
    expect(disabledOptional).toContain('data-pack-section-toggle="materials-bom" checked disabled');
  });

  it("renders all sections as revision-bound tables and preserves unknown, conflicting and user-entered states", () => {
    const source = record();
    const unresolved = {
      fieldId: "materials.source",
      value: "<img src=x onerror=alert(1)>",
      provenance: "UNRESOLVED",
      evidenceStatus: "CONFLICT",
      validationStatus: "INVALID",
      unresolvedReason: "Source package does not identify this value.",
      nextAction: "Confirm the supplier document and enter the source.",
    };
    const conflicted = {
      status: "CONFLICT",
      sourceLabel: "two conflicting records",
      reason: "Keep both until reconciled.",
      nextAction: "Review the source records.",
    };
    const data = {
      fieldId: "materials.user-note",
      value: "entered by user",
      provenance: "USER_CAPTURED",
      evidenceStatus: "UNCONFIRMED",
      validationStatus: "VALID",
    };
    const operationData = { process: ["sew", "inspect"], source: data };
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 17; index++) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }
    cursor.value = "depth limit";
    const unusual = {
      ["" ]: "empty key",
      emptyFields: {},
      noState: { value: null, blank: "", enabled: false, count: 4 },
      enabledYes: true,
      unsupported: Symbol("render"),
      unresolvedValue: { fieldId: "unresolved.value", value: () => "not displayed", provenance: "UNRESOLVED" },
      zeroRows: [],
      deep,
    };
    const actualRecord = {
      ...source,
      cover: { ...source.cover, styleName: { ...source.cover.styleName, value: "<script>style & label</script>", provenance: "USER_CAPTURED" } },
      materials: [unresolved, data, unusual],
      bomRows: [conflicted],
      colorways: [{ fieldId: "colorways.note", value: "green", provenance: "USER_CAPTURED" }],
      pomData: { rounds: [
        { status: "UNRESOLVED", value: true, unresolvedReason: "No sample data.", nextAction: "Capture the sample." },
        { status: "CONFLICT", value: false },
        { fieldId: "needs.review", provenance: null, evidenceStatus: null, validationStatus: null, value: null },
      ] },
      operationData,
    } as unknown as TechPackRecord;
    (actualRecord.cover as unknown as Record<string, unknown>).cycle = actualRecord;
    const outputs = outputsFor(actualRecord);
    const markup = renderProductionPackPanel(panel({ state: { kind: "ready", outputs } }));
    expect(markup).toContain("Generated snapshot for saved revision r4.");
    expect(markup).toContain("Save a new revision and regenerate the preview");
    expect(markup).toContain("PDF SHA-256:");
    expect(markup).toContain("Editable ZIP size: 4 bytes");
    expect(markup).toContain("Style and revision identity");
    expect(markup).toContain("Materials and bill of materials");
    expect(markup).toContain("Measurements and sample QA");
    expect(markup).toContain("Construction operations");
    expect(markup).toContain("Sources and open items");
    expect(markup).toContain("Review state for this revision");
    expect(markup).toContain("materials.source");
    expect(markup).toContain("two conflicting records");
    expect(markup).toContain("entered by user");
    expect(markup).toContain("UNRESOLVED");
    expect(markup).toContain("CONFLICT");
    expect(markup).toContain("Source package does not identify this value.");
    expect(markup).toContain("Confirm the supplier document and enter the source.");
    expect(markup).toContain("Nested data is deeper than this view can display.");
    expect(markup).toContain("This value cannot be displayed.");
    expect(markup).toContain("No fields are recorded.");
    expect(markup).toContain("No");
    expect(markup).toContain("empty key");
    expect(markup).toContain("&lt;script&gt;style &amp; label&lt;/script&gt;");
    expect(markup).not.toContain("<script>style");
    expect(markup).not.toContain("<img src=x");
  });

  it("keeps missing T02/T03 records, empty arrays, absent artwork, mismatched review, and omitted sections explicit", () => {
    const outputs = outputsFor(record({
      cover: {
        styleCode: { value: "sample" }, styleName: { value: "sample" }, ownerLabel: { value: "sample" },
        intendedUse: { value: "sample" }, baseSizeId: { value: "sample" }, measurementUnit: { value: "cm" },
      } as unknown as TechPackRecord["cover"],
      materials: [], bomRows: [], colorways: [],
    }));
    const markup = renderProductionPackPanel(panel({
      preset: "measurements-qa",
      selectedSections: ["materials-bom"],
      state: { kind: "ready", outputs: {
        ...outputs,
        presentation: { ...outputs.presentation, approvalRevisionId: "older-revision", approvalScopeFieldIds: [] },
        manifest: { ...outputs.manifest, artifacts: [outputs.manifest.artifacts[0]!] },
      } },
    }));
    expect(markup).toContain("No materials are recorded.");
    expect(markup).toContain("No bill of materials are recorded.");
    expect(markup).toContain("No colorways are recorded.");
    expect(markup).toContain("No T02 measurement or sample-QA record is present.");
    expect(markup).toContain("No T03 construction operation record is present.");
    expect(markup).toContain("No local artwork attachment is included in this output.");
    expect(markup).toContain("No review state is linked to this saved revision.");
    expect(markup).toContain("Any review state from another revision is not shown.");
    expect(markup).toContain("No unresolved or conflicting field state is recorded in this revision.");
  });

  it("shows exact matching review scope and artwork manifest provenance, and omits empty review scope", () => {
    const outputs = outputsFor(record({ approval: {
      state: "APPROVED", revisionId: REVISION_ID, scopeFieldIds: [], changedBy: "reviewer", changedAt: NOW, manifestId: null,
    } }));
    const artwork = {
      path: "attachments/local-art.png",
      role: "artwork" as const,
      mediaType: "image/png",
      byteLength: 12,
      sha256: DIGEST,
      assetId: "local-asset",
      displayName: "local & art.png",
      sourceLabel: null,
      attribution: null,
    };
    const markup = renderProductionPackPanel(panel({ state: { kind: "ready", outputs: {
      ...outputs,
      manifest: { ...outputs.manifest, artifacts: [...outputs.manifest.artifacts, artwork] },
    } } }));
    expect(markup).toContain("Review state for this revision");
    expect(markup).toContain("APPROVED");
    expect(markup).toContain("No field IDs are included in this review scope.");
    expect(markup).toContain("Revision-bound local artwork attachments");
    expect(markup).toContain("local &amp; art.png");
    expect(markup).toContain("Source label not recorded");
    expect(markup).toContain("Attribution not recorded");
    expect(markup).toContain("12 bytes");
  });

  it("offers an explicit ready-state regenerate button with custom sections", () => {
    const markup = renderProductionPackPanel(panel({
      preset: "materials-construction",
      selectedSections: ["materials-bom", "construction"],
      state: { kind: "ready", outputs: outputsFor(record(), ["identity", "materials-bom", "construction", "sources-open-items", "approval-disclaimer"]) },
    }));
    expect(markup).toContain("Regenerate preview");
    expect(markup).toContain('data-production-pack-download="pdf"');
    expect(markup).toContain('data-production-pack-download="archive"');
    expect(markup).toContain('data-pack-section-toggle="measurements-qa"');
    expect(markup).toContain("data-pack-section=\"construction\"");

    const emptySelection = outputsFor(record(), []);
    const noPdfIdentity = renderProductionPackPanel(panel({ state: { kind: "ready", outputs: {
      ...emptySelection,
      manifest: { ...emptySelection.manifest, artifacts: [] },
    } } }));
    expect(noPdfIdentity).toContain("Sections included</dt>");
    expect(noPdfIdentity).toContain("None</span>");
    expect(noPdfIdentity).toContain("Sections omitted");
    expect(noPdfIdentity).toContain("PDF SHA-256: <code>Unavailable</code>");
  });

  it("keeps the unresolved items table readable in narrow panels and keyboard-scrollable", () => {
    const markup = renderProductionPackPanel(panel({
      state: { kind: "ready", outputs: outputsFor(record(), ["identity", "sources-open-items", "approval-disclaimer"]) },
    }));
    expect(markup).toContain("Use these controls or scroll horizontally to review all four columns.");
    expect(markup).toContain('data-pack-table-scroll="start" aria-controls="tech-pack-open-items-scroll"');
    expect(markup).toContain('data-pack-table-scroll="end" aria-controls="tech-pack-open-items-scroll"');
    expect(markup).toContain('class="tech-pack-table-wrap tech-pack-open-table-wrap" role="region" tabindex="0" id="tech-pack-open-items-scroll"');
    expect(markup).toContain('aria-describedby="tech-pack-open-table-hint"');
    expect(markup).toContain('<table class="tech-pack-table tech-pack-open-table">');
  });
});
