import { describe, expect, it } from "vitest";
import { renderTechPackEditor } from "./tech-pack-editor";
import type {
  TechPackBomRow,
  TechPackColorway,
  TechPackColorwayAssignment,
  TechPackField,
  TechPackMaterial,
  TechPackQuantityBasis,
  TechPackRecord,
  TechPackSemanticKind,
} from "./tech-pack-records";

const NOW = "2026-10-12T20:00:00.000Z";
const STYLE_ID = "10000000-0000-4000-8000-000000000001";
const REVISION_ID = "10000000-0000-4000-8000-000000000002";
const MATERIAL_ID = "10000000-0000-4000-8000-000000000003";
const MATERIAL2_ID = "10000000-0000-4000-8000-000000000008";
const ROW_ID = "10000000-0000-4000-8000-000000000004";
const ROW2_ID = "10000000-0000-4000-8000-000000000009";
const ROW3_ID = "10000000-0000-4000-8000-000000000010";
const COLORWAY_ID = "10000000-0000-4000-8000-000000000005";
const COLORWAY2_ID = "10000000-0000-4000-8000-000000000011";
const ASSIGNMENT_ID = "10000000-0000-4000-8000-000000000006";
const ASSIGNMENT2_ID = "10000000-0000-4000-8000-000000000012";
const ASSIGNMENT3_ID = "10000000-0000-4000-8000-000000000013";
const MANIFEST_ID = "10000000-0000-4000-8000-000000000007";
const INHERITED_REVISION = "10000000-0000-4000-8000-000000000014";

function textField(
  fieldId: string,
  semanticKind: TechPackSemanticKind,
  value: string | null,
  extra: Partial<TechPackField<string | null>> = {},
): TechPackField<string | null> {
  const unresolved = value === null;
  return {
    fieldId,
    semanticKind,
    value,
    unit: null,
    provenance: unresolved ? "UNRESOLVED" : "USER_SELECTED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: unresolved ? "INVALID" : "VALID",
    sourceRef: null,
    method: unresolved ? null : "synthetic fixture entry",
    capturedBy: unresolved ? null : "fixture",
    capturedAt: unresolved ? null : NOW,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: unresolved ? "No fixture value was supplied." : null,
    nextAction: unresolved ? "Supply an explicit value." : null,
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
    ...extra,
  };
}

function numberField(
  fieldId: string,
  value: number | null,
  extra: Partial<TechPackField<number | null>> = {},
): TechPackField<number | null> {
  const unresolved = value === null;
  return {
    fieldId,
    semanticKind: "MATERIAL_PROPERTY",
    value,
    unit: unresolved ? null : "cm",
    provenance: unresolved ? "UNRESOLVED" : "USER_SELECTED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: unresolved ? "INVALID" : "VALID",
    sourceRef: null,
    method: unresolved ? null : "synthetic fixture entry",
    capturedBy: unresolved ? null : "fixture",
    capturedAt: unresolved ? null : NOW,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: unresolved ? "No fixture value was supplied." : null,
    nextAction: unresolved ? "Supply an explicit value." : null,
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
    ...extra,
  };
}

function booleanField(
  fieldId: string,
  value: boolean | null,
): TechPackField<boolean | null> {
  const unresolved = value === null;
  return {
    fieldId,
    semanticKind: "STYLE_CONTROL",
    value,
    unit: null,
    provenance: unresolved ? "UNRESOLVED" : "USER_SELECTED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: unresolved ? "INVALID" : "VALID",
    sourceRef: null,
    method: unresolved ? null : "synthetic fixture entry",
    capturedBy: unresolved ? null : "fixture",
    capturedAt: unresolved ? null : NOW,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: unresolved ? "No fixture value was supplied." : null,
    nextAction: unresolved ? "Supply an explicit value." : null,
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
  };
}

function unresolvedMaterial(id: string, category: TechPackMaterial["category"], prefix: string): TechPackMaterial {
  return {
    id,
    category,
    name: textField(`${prefix}.name`, "MATERIAL_PROPERTY", null),
    supplier: textField(`${prefix}.supplier`, "MATERIAL_PROPERTY", null),
    articleId: textField(`${prefix}.article`, "MATERIAL_PROPERTY", null),
    lotId: textField(`${prefix}.lot`, "MATERIAL_PROPERTY", null),
    composition: textField(`${prefix}.composition`, "MATERIAL_PROPERTY", null),
    construction: textField(`${prefix}.construction`, "MATERIAL_PROPERTY", null),
    weight: numberField(`${prefix}.weight`, null),
    usableWidth: numberField(`${prefix}.width`, null),
    finish: textField(`${prefix}.finish`, "MATERIAL_PROPERTY", null),
    color: textField(`${prefix}.color`, "MATERIAL_PROPERTY", null),
    directionalBehavior: textField(`${prefix}.direction`, "MATERIAL_PROPERTY", null),
    unitCost: numberField(`${prefix}.cost`, null),
    currency: textField(`${prefix}.currency`, "MATERIAL_PROPERTY", null),
    costBasis: textField(`${prefix}.costBasis`, "MATERIAL_PROPERTY", null),
  };
}

function populatedMaterial(): TechPackMaterial {
  return {
    id: MATERIAL_ID,
    category: "fabric",
    name: textField("material.name", "MATERIAL_PROPERTY", "Organic twill"),
    supplier: textField("material.supplier", "MATERIAL_PROPERTY", "Fixture Mills"),
    articleId: textField("material.article", "MATERIAL_PROPERTY", "TW-100"),
    lotId: textField("material.lot", "MATERIAL_PROPERTY", "LOT-9"),
    composition: textField("material.composition", "MATERIAL_PROPERTY", "100% cotton"),
    construction: textField("material.construction", "MATERIAL_PROPERTY", "2/1 twill"),
    weight: numberField("material.weight", 180, { unit: "gsm" }),
    usableWidth: numberField("material.width", 150),
    finish: textField("material.finish", "MATERIAL_PROPERTY", "Soft wash"),
    color: textField("material.color", "MATERIAL_PROPERTY", "Ecru"),
    directionalBehavior: textField("material.direction", "MATERIAL_PROPERTY", "Non-directional"),
    unitCost: numberField("material.cost", 2.5, { unit: "USD/m" }),
    currency: textField("material.currency", "MATERIAL_PROPERTY", "USD"),
    costBasis: textField("material.costBasis", "MATERIAL_PROPERTY", "per metre"),
  };
}

function quantityBasisField(fieldId: string, value: TechPackQuantityBasis | null): TechPackField<TechPackQuantityBasis | null> {
  const unresolved = value === null;
  return {
    fieldId,
    semanticKind: "MATERIAL_PROPERTY",
    value,
    unit: null,
    provenance: unresolved ? "UNRESOLVED" : "USER_SELECTED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: unresolved ? "INVALID" : "VALID",
    sourceRef: null,
    method: unresolved ? null : "synthetic fixture entry",
    capturedBy: unresolved ? null : "fixture",
    capturedAt: unresolved ? null : NOW,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: unresolved ? "No fixture value was supplied." : null,
    nextAction: unresolved ? "Supply an explicit value." : null,
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
  };
}

function bomRow(
  id: string,
  materialId: string,
  quantity: number | null,
  requiredness: boolean | null,
  prefix: string,
): TechPackBomRow {
  return {
    id,
    componentRef: textField(`${prefix}.component`, "PANEL_GEOMETRY", "Front body"),
    placement: textField(`${prefix}.placement`, "STYLE_CONTROL", "Self"),
    materialId,
    quantity: numberField(`${prefix}.quantity`, quantity, quantity === null ? {} : { unit: "m" }),
    quantityBasis: quantityBasisField(`${prefix}.quantityBasis`, quantity === null ? null : "per-garment"),
    requiredness: booleanField(`${prefix}.required`, requiredness),
  };
}

function assignment(
  id: string,
  bomRowId: string,
  materialId: string,
  color: string | null,
): TechPackColorwayAssignment {
  return {
    id,
    bomRowId,
    materialId,
    color: textField(`${id}.color`, "MATERIAL_PROPERTY", color),
  };
}

function colorway(id: string, name: string | null, assignments: readonly TechPackColorwayAssignment[]): TechPackColorway {
  return {
    id,
    name: textField(`${id}.name`, "STYLE_CONTROL", name),
    assignments,
  };
}

function fullRecord(): TechPackRecord {
  return {
    schemaVersion: 1,
    styleId: STYLE_ID,
    recipeId: "Tee",
    recipeVersion: "1",
    revisionId: REVISION_ID,
    revisionNumber: 1,
    createdAt: NOW,
    updatedAt: NOW,
    cover: {
      styleCode: textField("cover.styleCode", "STYLE_CONTROL", "TS-001", {
        provenance: "INHERITED",
        sourceRef: "style-archive",
        method: "copied from the approved style",
        inputRefs: ["source-input"],
        ruleId: "cover-rule",
        ruleVersion: "2",
        inheritedFrom: { revisionId: INHERITED_REVISION, provenance: "USER_SELECTED", sourceRef: "source-style" },
        evidenceRefs: ["source-evidence"],
      }),
      styleName: textField("cover.styleName", "STYLE_CONTROL", "Fixture tee", {
        provenance: "INHERITED",
        inheritedFrom: { revisionId: INHERITED_REVISION, provenance: "PRESET", sourceRef: null },
      }),
      ownerLabel: textField("cover.owner", "STYLE_CONTROL", "Studio", {
        ruleId: "owner-rule",
        ruleVersion: null,
      }),
      intendedUse: textField("cover.use", "STYLE_CONTROL", "Everyday wear"),
      baseSizeId: textField("cover.baseSize", "STYLE_CONTROL", "M"),
      measurementUnit: textField("cover.unit", "STYLE_CONTROL", "cm"),
    },
    materials: [populatedMaterial(), unresolvedMaterial(MATERIAL2_ID, "trim", "trim")],
    bomRows: [
      bomRow(ROW_ID, MATERIAL_ID, 1.5, true, "bom"),
      bomRow(ROW2_ID, MATERIAL2_ID, 2, false, "bom2"),
      bomRow(ROW3_ID, "missing-material", null, null, "bom3"),
    ],
    colorways: [
      colorway(COLORWAY_ID, "Spring", [
        assignment(ASSIGNMENT_ID, ROW_ID, MATERIAL_ID, "Navy"),
        assignment(ASSIGNMENT2_ID, ROW2_ID, MATERIAL2_ID, null),
        assignment(ASSIGNMENT3_ID, "missing-row", "missing-material", "Rust"),
      ]),
      colorway(COLORWAY2_ID, "Empty", []),
    ],
    approval: {
      state: "DRAFT",
      revisionId: null,
      scopeFieldIds: [],
      changedBy: null,
      changedAt: null,
      manifestId: null,
    },
  };
}

function emptyRecord(): TechPackRecord {
  const cover = {
    styleCode: textField("cover.styleCode", "STYLE_CONTROL", null),
    styleName: textField("cover.styleName", "STYLE_CONTROL", null),
    ownerLabel: textField("cover.owner", "STYLE_CONTROL", null),
    intendedUse: textField("cover.use", "STYLE_CONTROL", null),
    baseSizeId: textField("cover.baseSize", "STYLE_CONTROL", null),
    measurementUnit: textField("cover.unit", "STYLE_CONTROL", null),
  };
  return {
    schemaVersion: 1,
    styleId: STYLE_ID,
    recipeId: "Tee",
    recipeVersion: "unversioned",
    revisionId: null,
    revisionNumber: 0,
    createdAt: NOW,
    updatedAt: NOW,
    cover,
    materials: [],
    bomRows: [],
    colorways: [],
    approval: {
      state: "DRAFT",
      revisionId: null,
      scopeFieldIds: [],
      changedBy: null,
      changedAt: null,
      manifestId: null,
    },
  };
}

function reviewedRecord(): TechPackRecord {
  const record = fullRecord();
  return {
    ...record,
    approval: {
      state: "REVIEW",
      revisionId: REVISION_ID,
      scopeFieldIds: ["cover.styleCode"],
      changedBy: "reviewer",
      changedAt: NOW,
      manifestId: null,
    },
  };
}

function frozenRecord(): TechPackRecord {
  const record = fullRecord();
  return {
    ...record,
    approval: {
      state: "FROZEN_FOR_SHARE",
      revisionId: REVISION_ID,
      scopeFieldIds: ["cover.styleCode", "material.name"],
      changedBy: "reviewer",
      changedAt: NOW,
      manifestId: MANIFEST_ID,
    },
  };
}

describe("tech-pack editor renderer", () => {
  it("renders style and revision metadata with the recipe label and approval state", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-editor="true"');
    expect(html).toContain(`data-t01-style-id="${STYLE_ID}"`);
    expect(html).toContain('data-t01-recipe-id="Tee"');
    expect(html).toContain('data-t01-recipe-version="1"');
    expect(html).toContain('data-t01-revision-number="1"');
    expect(html).toContain('data-t01-approval-state="DRAFT"');
    expect(html).toContain("<h2 id=\"t01-editor-title\">Tech pack editor — Tee</h2>");
    expect(html).toContain(`number 1, id ${REVISION_ID}`);
    expect(html).toContain(`Created ${NOW}; updated ${NOW}.`);
    expect(html).toContain("State DRAFT.");
    expect(html).toContain('data-t01-approval-scope="empty"');
    expect(html).toContain("Editable draft values only.");
  });

  it("marks a revision-less draft explicitly instead of inventing a revision", () => {
    const html = renderTechPackEditor({ record: emptyRecord(), recipeLabel: "Tank" });
    expect(html).toContain('data-t01-revision="none"');
    expect(html).toContain("No immutable revision yet.");
    expect(html).not.toContain(REVISION_ID);
  });

  it("renders all six cover fields as labeled text inputs with field identity", () => {
    const html = renderTechPackEditor({ record: emptyRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-cover="true"');
    for (const label of ["Style code", "Style name", "Owner label", "Intended use", "Base size", "Measurement unit"]) {
      expect(html).toContain(label);
    }
    for (const fieldId of ["cover.styleCode", "cover.styleName", "cover.owner", "cover.use", "cover.baseSize", "cover.unit"]) {
      expect(html).toContain(`data-t01-field="${fieldId}"`);
      expect(html).toContain(`data-t01-field-id="${fieldId}"`);
    }
    expect(html).toContain('data-t01-scope="cover"');
  });

  it("renders fabric and trim material rows with every material field group", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-materials="true"');
    expect(html).toContain(`data-t01-material="${MATERIAL_ID}"`);
    expect(html).toContain(`data-t01-material="${MATERIAL2_ID}"`);
    expect(html).toContain('<option value="fabric" selected>Fabric</option>');
    expect(html).toContain('<option value="trim" selected>Trim</option>');
    for (const label of ["Name", "Supplier", "Article ID", "Lot ID", "Composition", "Construction",
      "Weight", "Usable width", "Finish", "Color", "Directional behavior",
      "Unit cost (entered exactly; never totaled here)", "Currency", "Cost basis"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('value="Organic twill"');
    expect(html).toContain('value="180"');
    expect(html).toContain('value="2.5"');
    expect(html).toContain('value="USD"');
    expect(html).toContain('value="per metre"');
    expect(html).toContain('data-t01-material-field="category"');
  });

  it("renders BOM rows with component, placement, material linkage, quantity, basis, and requiredness", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-bom="true"');
    expect(html).toContain(`data-t01-bom-row="${ROW_ID}"`);
    expect(html).toContain(`data-t01-bom-row="${ROW2_ID}"`);
    expect(html).toContain(`data-t01-bom-row="${ROW3_ID}"`);
    expect(html).toContain(`data-t01-bom-material="${MATERIAL_ID}"`);
    expect(html).toContain('value="Front body"');
    expect(html).toContain('value="Self"');
    expect(html).toContain('value="1.5"');
    expect(html).toContain('value="per-garment"');
    expect(html).toContain('data-t01-bom-field="materialId"');
    expect(html).toContain('data-t01-bom-field="requiredness"');
    expect(html).toContain(`<option value="${MATERIAL_ID}" selected>`);
    expect(html).toContain(`<option value="${MATERIAL2_ID}" selected>`);
    expect(html).toContain('<option value="true" selected>Required</option>');
    expect(html).toContain('<option value="false" selected>Optional</option>');
    expect(html).toContain('<option value="" selected>Unknown — not recorded</option>');
  });

  it("renders colorways with row-to-material-to-color assignments", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-colorways="true"');
    expect(html).toContain(`data-t01-colorway="${COLORWAY_ID}"`);
    expect(html).toContain(`data-t01-colorway="${COLORWAY2_ID}"`);
    expect(html).toContain('value="Spring"');
    expect(html).toContain(`data-t01-assignment="${ASSIGNMENT_ID}"`);
    expect(html).toContain(`data-t01-assignment-bom-row="${ROW_ID}"`);
    expect(html).toContain(`data-t01-assignment-material="${MATERIAL_ID}"`);
    expect(html).toContain('data-t01-assignment-field="bomRowId"');
    expect(html).toContain('data-t01-assignment-field="materialId"');
    expect(html).toContain('value="Navy"');
    expect(html).toContain('data-t01-empty="assignments"');
  });

  it("keeps unresolved values explicit with their reason and next action", () => {
    const html = renderTechPackEditor({ record: emptyRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-unknown="true"');
    expect(html).toContain("No fixture value was supplied.");
    expect(html).toContain("Supply an explicit value.");
    expect(html).toContain('data-t01-unresolved-reason="No fixture value was supplied."');
    expect(html).toContain('data-t01-next-action="Supply an explicit value."');
    expect(html).toContain('data-t01-validation-status="INVALID"');
    expect(html).toContain('data-t01-provenance="UNRESOLVED"');
  });

  it("keeps an invalid entered value visible instead of normalizing it", () => {
    const record = emptyRecord();
    const html = renderTechPackEditor({
      record: {
        ...record,
        cover: {
          ...record.cover,
          styleCode: textField("cover.styleCode", "STYLE_CONTROL", "  ", {
            validationStatus: "INVALID",
            unresolvedReason: "Blank entries are not style codes.",
            nextAction: "Enter the sourced style code.",
          }),
        },
      },
      recipeLabel: "Tee",
    });
    expect(html).toContain('data-t01-unknown="true"');
    expect(html).toContain("Blank entries are not style codes.");
    expect(html).toContain("Enter the sourced style code.");
  });

  it("keeps conflicting evidence visible with its correction", () => {
    const record = emptyRecord();
    const html = renderTechPackEditor({
      record: {
        ...record,
        cover: {
          ...record.cover,
          styleCode: textField("cover.styleCode", "STYLE_CONTROL", "TS-001", {
            evidenceStatus: "CONFLICT",
            validationStatus: "INVALID",
            unresolvedReason: "Two sources disagree on the code.",
            nextAction: "Reconcile the sources.",
          }),
        },
      },
      recipeLabel: "Tee",
    });
    expect(html).toContain("Two sources disagree on the code.");
    expect(html).toContain("Reconcile the sources.");
  });

  it("keeps an unresolved provenance with a carried value visible", () => {
    const record = emptyRecord();
    const html = renderTechPackEditor({
      record: {
        ...record,
        cover: {
          ...record.cover,
          styleCode: textField("cover.styleCode", "STYLE_CONTROL", "carried", {
            provenance: "UNRESOLVED",
            validationStatus: "INVALID",
            unresolvedReason: "Carried value lacks a source.",
            nextAction: "Confirm or replace the value.",
          }),
        },
      },
      recipeLabel: "Tee",
    });
    expect(html).toContain("Carried value lacks a source.");
  });

  it("falls back to explicit placeholders when a reason or action was never recorded", () => {
    const record = emptyRecord();
    const html = renderTechPackEditor({
      record: {
        ...record,
        cover: {
          ...record.cover,
          styleCode: textField("cover.styleCode", "STYLE_CONTROL", null, {
            unresolvedReason: null,
            nextAction: null,
          }),
        },
      },
      recipeLabel: "Tee",
    });
    expect(html).toContain("No reason recorded.");
    expect(html).toContain("No next action recorded.");
    expect(html).toContain('data-t01-unresolved-reason=""');
    expect(html).toContain('data-t01-next-action=""');
  });

  it("omits the unknown block for a fully resolved field", () => {
    const record = emptyRecord();
    const resolved = textField("cover.styleCode", "STYLE_CONTROL", "TS-001");
    const html = renderTechPackEditor({
      record: { ...record, cover: { ...record.cover, styleCode: resolved } },
      recipeLabel: "Tee",
    });
    const unknowns = html.match(/data-t01-unknown="true"/g) ?? [];
    expect(unknowns.length).toBe(5);
    expect(html).toContain(
      `<input type="text" data-t01-input="true" data-t01-field-id="cover.styleCode" data-t01-field-property="value" maxlength="240" value="TS-001">` +
      `</label><p class="t01-meta">`,
    );
  });

  it("renders complete scalar source, provenance, and evidence state", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-semantic-kind="STYLE_CONTROL"');
    expect(html).toContain('data-t01-source-ref="style-archive"');
    expect(html).toContain("copied from the approved style");
    expect(html).toContain('data-t01-captured-by="fixture"');
    expect(html).toContain(`data-t01-captured-at="${NOW}"`);
    expect(html).toContain('data-t01-input-refs="source-input"');
    expect(html).toContain('data-t01-rule-id="cover-rule"');
    expect(html).toContain('data-t01-rule-version="2"');
    expect(html).toContain('data-t01-evidence-refs="source-evidence"');
    expect(html).toContain(`data-t01-inherited-revision="${INHERITED_REVISION}"`);
    expect(html).toContain('data-t01-inherited-provenance="USER_SELECTED"');
    expect(html).toContain('data-t01-inherited-source="source-style"');
    expect(html).toContain('data-t01-confidence="NOT_ASSESSED"');
    expect(html).toContain("Confidence not assessed");
    expect(html).toContain('data-t01-unit="gsm"');
  });

  it("renders inherited sources without a recorded source as explicitly empty", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-inherited-source=""');
  });

  it("renders a rule without a recorded version as explicitly empty", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-rule-id="owner-rule"');
    expect(html).toContain('data-t01-rule-version=""');
  });

  it("omits optional source spans for minimal fields", () => {
    const html = renderTechPackEditor({ record: emptyRecord(), recipeLabel: "Tee" });
    expect(html).not.toContain("data-t01-source-ref=");
    expect(html).not.toContain("data-t01-method=");
    expect(html).not.toContain("data-t01-captured-by=");
    expect(html).not.toContain("data-t01-input-refs=");
    expect(html).not.toContain("data-t01-rule-id=");
    expect(html).not.toContain("data-t01-evidence-refs=");
    expect(html).not.toContain("data-t01-inherited-revision=");
    expect(html).not.toContain("data-t01-unit=");
  });

  it("escapes hostile content in labels, values, and attributes", () => {
    const record = emptyRecord();
    const hostile = `"><script>alert(1)</script>&'`;
    const html = renderTechPackEditor({
      record: {
        ...record,
        styleId: `style${hostile}`,
        cover: {
          ...record.cover,
          styleCode: textField("cover.styleCode", "STYLE_CONTROL", hostile, {
            sourceRef: hostile,
            unresolvedReason: hostile,
            nextAction: hostile,
          }),
        },
      },
      recipeLabel: `<b>Tee</b> & "Polo"`,
    });
    expect(html).toContain("&lt;b&gt;Tee&lt;/b&gt; &amp; &quot;Polo&quot;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;&#39;");
    expect(html).toContain('data-t01-field-property="sourceRef" maxlength="240" value="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;&#39;"');
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<b>Tee</b>");
  });

  it("disables every control when disabled and enables them otherwise", () => {
    const enabled = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    const enabledControls = enabled.match(/<(input|select|textarea|button)[^>]*>/g) ?? [];
    expect(enabledControls.length).toBeGreaterThan(0);
    expect(enabledControls.every((tag) => !tag.includes(" disabled"))).toBe(true);

    const explicitEnabled = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee", disabled: false });
    const explicitControls = explicitEnabled.match(/<(input|select|textarea|button)[^>]*>/g) ?? [];
    expect(explicitControls.length).toBe(enabledControls.length);

    const disabled = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee", disabled: true });
    const disabledControls = disabled.match(/<(input|select|textarea|button)[^>]*>/g) ?? [];
    expect(disabledControls.length).toBe(enabledControls.length);
    expect(disabledControls.every((tag) => tag.includes(" disabled"))).toBe(true);
  });

  it("states empty collections explicitly instead of hiding them", () => {
    const html = renderTechPackEditor({ record: emptyRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-empty="materials"');
    expect(html).toContain("No materials recorded yet.");
    expect(html).toContain('data-t01-action="add-fabric"');
    expect(html).toContain('data-t01-action="add-trim"');
    expect(html).toContain('data-t01-empty="bomRows"');
    expect(html).toContain("No BOM rows recorded yet.");
    expect(html).toContain('<select data-t01-new-bom-material disabled><option value="" selected>Choose a material</option></select>');
    expect(html).toContain('<button type="button" data-t01-action="add-bom-row" disabled>Add BOM row</button>');
    expect(html).toContain('data-t01-empty="colorways"');
    expect(html).toContain("No colorways recorded yet.");
    expect(html).toContain('data-t01-action="add-colorway"');
  });

  it("requires explicit existing selections before adding BOM or assignment links", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('<select data-t01-new-bom-material><option value="" selected>Choose a material</option>');
    expect(html).toContain(`<option value="${MATERIAL_ID}">${MATERIAL_ID}</option>`);
    expect(html).toContain(`<option value="${MATERIAL2_ID}">${MATERIAL2_ID}</option>`);
    expect(html).toContain('<select data-t01-new-assignment-row><option value="" selected>Choose a BOM row</option>');
    expect(html).toContain(`<option value="${ROW_ID}">${ROW_ID}</option>`);
    expect(html).toContain('<select data-t01-new-assignment-material><option value="" selected>Choose a material</option>');
    expect(html).toContain(`data-t01-action="add-assignment" data-t01-colorway-id="${COLORWAY_ID}"`);
  });

  it("keeps dangling row and material links explicit with a missing-entry option", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('<option value="missing-material" selected>Missing material: missing-material</option>');
    expect(html).toContain('<option value="missing-row" selected>Missing BOM row: missing-row</option>');
  });

  it("renders assignment links explicitly even when no BOM rows exist", () => {
    const record = emptyRecord();
    const html = renderTechPackEditor({
      record: {
        ...record,
        colorways: [colorway(COLORWAY_ID, "Lone", [assignment(ASSIGNMENT_ID, ROW_ID, MATERIAL_ID, "Red")])],
      },
      recipeLabel: "Tee",
    });
    expect(html).toContain(`<option value="${ROW_ID}" selected>Missing BOM row: ${ROW_ID}</option>`);
    expect(html).toContain(`<option value="${MATERIAL_ID}" selected>Missing material: ${MATERIAL_ID}</option>`);
  });

  it("records exact entered costs and quantities without calculating anything", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('value="2.5"');
    expect(html).toContain('value="1.5"');
    expect(html).not.toContain("3.75");
    expect(html).not.toContain("data-t01-total");
  });

  it("renders review approval scope, actor, and time without actions", () => {
    const html = renderTechPackEditor({ record: reviewedRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-approval-state="REVIEW"');
    expect(html).toContain("State REVIEW.");
    expect(html).toContain('data-t01-approval-changed-by="reviewer"');
    expect(html).toContain(`data-t01-approval-changed-at="${NOW}"`);
    expect(html).toContain('data-t01-approval-scope="listed"');
    expect(html).toContain('<li data-t01-approval-scope-field="cover.styleCode">cover.styleCode</li>');
    expect(html).not.toContain("data-t01-approval-manifest");
    expect(html).not.toContain('data-t01-action="approve"');
    expect(html).not.toContain('data-t01-action="review"');
    expect(html).not.toContain('data-t01-action="freeze"');
  });

  it("renders frozen approval scope with its manifest reference", () => {
    const html = renderTechPackEditor({ record: frozenRecord(), recipeLabel: "Tee" });
    expect(html).toContain("State FROZEN_FOR_SHARE.");
    expect(html).toContain(`data-t01-approval-manifest="${MANIFEST_ID}"`);
    expect(html).toContain('<li data-t01-approval-scope-field="material.name">material.name</li>');
  });

  it("keeps an accessible label, heading, and section structure", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('aria-labelledby="t01-editor-title"');
    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend>Cover — six style fields</legend>");
    expect(html).toContain("<h3>Materials</h3>");
    expect(html).toContain("<h3>Bill of materials</h3>");
    expect(html).toContain("<h3>Colorways</h3>");
    expect(html).toContain("<h3>Style and revision</h3>");
    expect(html).toContain("<h4>Scoped approval</h4>");
    expect(html).toContain('role="note"');
    const labels = html.match(/<label>/g) ?? [];
    expect(labels.length).toBeGreaterThan(10);
  });

  it("renders empty numeric and boolean inputs as blank or unknown selections", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-field-id="trim.weight" data-t01-field-property="value" value=""');
    expect(html).toContain('data-t01-field-id="trim.cost" data-t01-field-property="value" value=""');
  });

  it("renders editable metadata controls for every field in the record", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    const provenanceControls = html.match(/data-t01-field-property="provenance"/g) ?? [];
    expect(provenanceControls.length).toBe(54);
    const valueControls = html.match(/data-t01-field-property="value"/g) ?? [];
    expect(valueControls.length).toBe(54);
    for (const property of ["value", "unit", "provenance", "evidenceStatus", "validationStatus",
      "sourceRef", "method", "capturedBy", "capturedAt", "inputRefs", "ruleId", "ruleVersion",
      "inheritedRevisionId", "inheritedProvenance", "inheritedSourceRef",
      "unresolvedReason", "nextAction", "evidenceRefs"]) {
      expect(html).toContain(`data-t01-field-property="${property}"`);
    }
    expect(html).toContain('data-t01-controls="cover.styleCode"');
    expect(html).toContain('data-t01-controls="material.cost"');
    expect(html).toContain('data-t01-controls="bom.quantity"');
  });

  it("renders enum metadata options with the current value selected", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    for (const option of ["USER_CAPTURED", "USER_SELECTED", "PRESET", "INHERITED", "CALCULATED",
      "SUPPLIER", "SAMPLE_ACTUAL", "IMAGE_OBSERVED", "UNRESOLVED"]) {
      expect(html).toContain(`<option value="${option}"`);
    }
    expect(html).toContain("<option value=\"INHERITED\" selected>INHERITED</option>");
    expect(html).toContain("<option value=\"UNRESOLVED\" selected>UNRESOLVED</option>");
    for (const option of ["UNCONFIRMED", "USER_CONFIRMED", "SOURCE_CONFIRMED", "SAMPLE_MEASURED", "CONFLICT"]) {
      expect(html).toContain(`<option value="${option}"`);
    }
    expect(html).toContain("<option value=\"VALID\" selected>VALID</option>");
    expect(html).toContain("<option value=\"INVALID\" selected>INVALID</option>");
  });

  it("renders reference arrays as multiline text inputs with current entries", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain('data-t01-field-property="inputRefs" rows="2">source-input</textarea>');
    expect(html).toContain('data-t01-field-property="evidenceRefs" rows="2">source-evidence</textarea>');
    expect(html).toContain('data-t01-field-property="inputRefs" rows="2"></textarea>');
    expect(html).toContain('data-t01-field-property="evidenceRefs" rows="2"></textarea>');
  });

  it("renders current inherited state and blank inherited inputs when absent", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    expect(html).toContain(
      `data-t01-field-id="cover.styleCode" data-t01-field-property="inheritedRevisionId" maxlength="240" value="${INHERITED_REVISION}"`,
    );
    expect(html).toContain(
      'data-t01-field-id="cover.styleCode" data-t01-field-property="inheritedSourceRef" maxlength="240" value="source-style"',
    );
    expect(html).toContain(
      'data-t01-field-id="cover.use" data-t01-field-property="inheritedRevisionId" maxlength="240" value=""',
    );
    expect(html).toContain(
      'data-t01-field-id="cover.use" data-t01-field-property="inheritedSourceRef" maxlength="240" value=""',
    );
    expect(html).toContain(
      'data-t01-field-property="inheritedProvenance"><option value="" selected>Not inherited</option>',
    );
    expect(html).toContain("<option value=\"USER_SELECTED\" selected>USER_SELECTED</option>");
  });

  it("renders disabled-aware nested-record action buttons with stable identities", () => {
    const html = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee" });
    for (const action of ["add-fabric", "add-trim", "add-bom-row", "add-colorway", "add-assignment",
      "remove-material", "remove-bom-row", "remove-colorway", "remove-assignment"]) {
      expect(html).toContain(`data-t01-action="${action}"`);
    }
    expect(html).toContain(`data-t01-action="remove-material" data-t01-material-id="${MATERIAL_ID}"`);
    expect(html).toContain(`data-t01-action="remove-bom-row" data-t01-bom-row-id="${ROW_ID}"`);
    expect(html).toContain(`data-t01-action="remove-colorway" data-t01-colorway-id="${COLORWAY_ID}"`);
    expect(html).toContain(`data-t01-action="remove-assignment" data-t01-assignment-id="${ASSIGNMENT_ID}" data-t01-colorway-id="${COLORWAY_ID}"`);
    expect(html).toContain(`data-t01-action="add-assignment" data-t01-colorway-id="${COLORWAY_ID}"`);
    expect(html).toContain('aria-label="Add material"');
  });

  it("disables action buttons and metadata controls together with value inputs", () => {
    const disabled = renderTechPackEditor({ record: fullRecord(), recipeLabel: "Tee", disabled: true });
    const buttons = disabled.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBe(16);
    expect(buttons.every((tag) => tag.includes(" disabled"))).toBe(true);
    const areas = disabled.match(/<textarea[^>]*>/g) ?? [];
    expect(areas.length).toBeGreaterThan(0);
    expect(areas.every((tag) => tag.includes(" disabled"))).toBe(true);
  });
});
