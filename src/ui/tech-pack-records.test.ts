import { describe, expect, it } from "vitest";
import {
  parseTechPackRecord,
  TECH_PACK_MAX_RECORDS,
  TECH_PACK_RECORD_VERSION,
  type TechPackField,
  type TechPackFieldValue,
  type TechPackSemanticKind,
} from "./tech-pack-records";

const NOW = "2026-10-12T20:00:00.000Z";
const STYLE_ID = "10000000-0000-4000-8000-000000000001";
const REVISION_ID = "10000000-0000-4000-8000-000000000002";
const MATERIAL_ID = "10000000-0000-4000-8000-000000000003";
const ROW_ID = "10000000-0000-4000-8000-000000000004";
const COLORWAY_ID = "10000000-0000-4000-8000-000000000005";
const ASSIGNMENT_ID = "10000000-0000-4000-8000-000000000006";
const MANIFEST_ID = "10000000-0000-4000-8000-000000000007";

function field<T extends TechPackFieldValue>(
  fieldId: string,
  semanticKind: TechPackSemanticKind,
  value: T,
  extra: Partial<TechPackField<T>> = {},
): TechPackField<T> {
  const unresolved = value === null;
  const base: TechPackField<T> = {
    fieldId,
    semanticKind,
    value,
    unit: typeof value === "number" ? "unit" : null,
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
  return { ...base, ...extra };
}

function validRecord(): any {
  return {
    schemaVersion: TECH_PACK_RECORD_VERSION,
    styleId: STYLE_ID,
    recipeId: "Tee",
    recipeVersion: "1",
    revisionId: REVISION_ID,
    revisionNumber: 1,
    createdAt: NOW,
    updatedAt: NOW,
    cover: {
      styleCode: field("cover.styleCode", "STYLE_CONTROL", null),
      styleName: field("cover.styleName", "STYLE_CONTROL", null),
      ownerLabel: field("cover.owner", "STYLE_CONTROL", null),
      intendedUse: field("cover.use", "STYLE_CONTROL", null),
      baseSizeId: field("cover.baseSize", "STYLE_CONTROL", null),
      measurementUnit: field("cover.unit", "STYLE_CONTROL", null),
    },
    materials: [{
      id: MATERIAL_ID,
      category: "fabric",
      name: field("material.name", "MATERIAL_PROPERTY", null),
      supplier: field("material.supplier", "MATERIAL_PROPERTY", null),
      articleId: field("material.article", "MATERIAL_PROPERTY", null),
      lotId: field("material.lot", "MATERIAL_PROPERTY", null),
      composition: field("material.composition", "MATERIAL_PROPERTY", null),
      construction: field("material.construction", "MATERIAL_PROPERTY", null),
      weight: field<number | null>("material.weight", "MATERIAL_PROPERTY", null),
      usableWidth: field<number | null>("material.width", "MATERIAL_PROPERTY", null),
      finish: field("material.finish", "MATERIAL_PROPERTY", null),
      color: field("material.color", "MATERIAL_PROPERTY", null),
      directionalBehavior: field("material.direction", "MATERIAL_PROPERTY", null),
      unitCost: field<number | null>("material.cost", "MATERIAL_PROPERTY", null),
      currency: field("material.currency", "MATERIAL_PROPERTY", null),
      costBasis: field("material.costBasis", "MATERIAL_PROPERTY", null),
    }],
    bomRows: [{
      id: ROW_ID,
      componentRef: field("bom.component", "PANEL_GEOMETRY", null),
      placement: field("bom.placement", "STYLE_CONTROL", null),
      materialId: MATERIAL_ID,
      quantity: field<number | null>("bom.quantity", "MATERIAL_PROPERTY", null),
      quantityBasis: field("bom.quantityBasis", "MATERIAL_PROPERTY", null),
      requiredness: field<boolean | null>("bom.required", "STYLE_CONTROL", null),
    }],
    colorways: [{
      id: COLORWAY_ID,
      name: field("colorway.name", "STYLE_CONTROL", null),
      assignments: [{
        id: ASSIGNMENT_ID,
        bomRowId: ROW_ID,
        materialId: MATERIAL_ID,
        color: field("assignment.color", "MATERIAL_PROPERTY", null),
      }],
    }],
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

function reject(change: (record: any) => void): void {
  const record = validRecord();
  change(record);
  expect(parseTechPackRecord(record).ok).toBe(false);
}

function unresolvedWith(extra: Partial<TechPackField<null>>): TechPackField<null> {
  return field("cover.styleCode", "STYLE_CONTROL", null, extra);
}

function userTextWith(extra: Partial<TechPackField<string>>): TechPackField<string> {
  return field("cover.styleCode", "STYLE_CONTROL", "style", extra);
}

describe("parseTechPackRecord", () => {
  it("accepts a typed draft with explicit unknowns and returns a detached canonical graph", () => {
    const record = validRecord();
    record.cover.styleCode = userTextWith({
      provenance: "INHERITED",
      inputRefs: ["source-input"],
      evidenceRefs: ["source-evidence"],
      inheritedFrom: { revisionId: "10000000-0000-4000-8000-000000000008", provenance: "USER_SELECTED", sourceRef: "source" },
    });
    record.approval = {
      state: "REVIEW",
      revisionId: REVISION_ID,
      scopeFieldIds: [record.cover.styleCode.fieldId],
      changedBy: "reviewer",
      changedAt: NOW,
      manifestId: null,
    };
    const result = parseTechPackRecord(record);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(record);
      expect(result.value).not.toBe(record);
      expect(result.value.materials).not.toBe(record.materials);
      record.cover.styleCode.inputRefs.push("mutated-input");
      record.cover.styleCode.evidenceRefs.push("mutated-evidence");
      record.cover.styleCode.inheritedFrom.sourceRef = "mutated-source";
      record.cover.styleCode.value = "mutated-style";
      record.approval.scopeFieldIds.push("mutated-scope");
      expect(result.value.cover.styleCode.inputRefs).toEqual(["source-input"]);
      expect(result.value.cover.styleCode.evidenceRefs).toEqual(["source-evidence"]);
      expect(result.value.cover.styleCode.inheritedFrom?.sourceRef).toBe("source");
      expect(result.value.cover.styleCode.value).toBe("style");
      expect(result.value.approval.scopeFieldIds).toEqual(["cover.styleCode"]);
    }
  });

  it("accepts the supported child categories, measurement values, quantity bases and empty optional collections", () => {
    const record = validRecord();
    const material = record.materials[0];
    material.category = "trim";
    material.weight = field<number | null>("material.weight", "MATERIAL_PROPERTY", 180);
    material.usableWidth = field<number | null>("material.width", "MATERIAL_PROPERTY", 145);
    material.unitCost = field<number | null>("material.cost", "MATERIAL_PROPERTY", 2.5);
    material.currency = field("material.currency", "MATERIAL_PROPERTY", "USD");
    material.costBasis = field("material.costBasis", "MATERIAL_PROPERTY", "per metre");
    record.bomRows[0].quantity = field<number | null>("bom.quantity", "MATERIAL_PROPERTY", 1.5);
    record.bomRows[0].quantityBasis = field("bom.quantityBasis", "MATERIAL_PROPERTY", "per-garment");
    record.bomRows[0].requiredness = field<boolean | null>("bom.required", "STYLE_CONTROL", false);
    record.colorways[0].assignments = [];
    expect(parseTechPackRecord(record).ok).toBe(true);
  });

  it("accepts all supported field provenance envelopes and exact-revision sample actuals", () => {
    const values: Array<[string, TechPackField<string>]> = [];
    const userCaptured = userTextWith({ provenance: "USER_CAPTURED" });
    values.push(["user captured", userCaptured]);
    const preset = userTextWith({ provenance: "PRESET", sourceRef: "recipe:Tee", ruleId: "block", ruleVersion: "1" });
    values.push(["preset", preset]);
    const inherited = userTextWith({ provenance: "INHERITED", inheritedFrom: {
      revisionId: "10000000-0000-4000-8000-000000000008", provenance: "USER_SELECTED", sourceRef: null,
    } });
    values.push(["inherited", inherited]);
    const calculated = field<number>("material.calculated", "MATERIAL_PROPERTY", 1, {
      provenance: "CALCULATED", inputRefs: ["input-1"], ruleId: "calculation", ruleVersion: "1",
    });
    expect(parseTechPackRecord({ ...validRecord(), cover: { ...validRecord().cover, styleCode: userCaptured } }).ok).toBe(true);
    for (const [, value] of values) {
      const record = validRecord();
      record.cover.styleCode = value;
      expect(parseTechPackRecord(record).ok).toBe(true);
    }
    const calculatedRecord = validRecord();
    calculatedRecord.materials[0].weight = calculated;
    expect(parseTechPackRecord(calculatedRecord).ok).toBe(true);

    for (const provenance of ["SUPPLIER", "SAMPLE_ACTUAL", "IMAGE_OBSERVED"] as const) {
      const record = validRecord();
      record.cover.styleCode = userTextWith({
        provenance,
        evidenceStatus: provenance === "SAMPLE_ACTUAL" ? "SAMPLE_MEASURED" : "SOURCE_CONFIRMED",
        sourceRef: "evidence-source",
        evidenceRefs: ["evidence-1"],
        method: "documented synthetic fixture",
      });
      expect(parseTechPackRecord(record).ok).toBe(true);
    }
  });

  it.each([
    ["non-object", null],
    ["array", []],
    ["missing record property", (() => { const value = validRecord(); delete value.recipeId; return value; })()],
    ["unknown record property", { ...validRecord(), extra: true }],
  ])("rejects an invalid root shape: %s", (_name, value) => {
    expect(parseTechPackRecord(value).ok).toBe(false);
  });

  it.each([
    ["schema version", (record: any) => { record.schemaVersion = 2; }],
    ["style UUID", (record: any) => { record.styleId = "not-a-uuid"; }],
    ["empty recipe ID", (record: any) => { record.recipeId = "  "; }],
    ["overlong recipe ID", (record: any) => { record.recipeId = "x".repeat(121); }],
    ["empty recipe version", (record: any) => { record.recipeVersion = ""; }],
    ["invalid revision UUID", (record: any) => { record.revisionId = "bad"; }],
    ["non-integer revision number", (record: any) => { record.revisionNumber = 1.5; }],
    ["negative revision number", (record: any) => { record.revisionNumber = -1; }],
    ["null revision with positive number", (record: any) => { record.revisionId = null; }],
    ["revision UUID with zero number", (record: any) => { record.revisionNumber = 0; }],
    ["invalid created timestamp", (record: any) => { record.createdAt = "2026-10-12"; }],
    ["non-string created timestamp", (record: any) => { record.createdAt = 20261012; }],
    ["invalid updated timestamp", (record: any) => { record.updatedAt = "not-a-time"; }],
    ["updated before creation", (record: any) => { record.createdAt = "2026-10-13T00:00:00.000Z"; }],
    ["non-list materials", (record: any) => { record.materials = {}; }],
    ["oversized materials", (record: any) => { record.materials = new Array(TECH_PACK_MAX_RECORDS + 1); }],
    ["non-list BOM", (record: any) => { record.bomRows = null; }],
    ["oversized BOM", (record: any) => { record.bomRows = new Array(TECH_PACK_MAX_RECORDS + 1); }],
    ["non-list colorways", (record: any) => { record.colorways = "none"; }],
    ["oversized colorways", (record: any) => { record.colorways = new Array(TECH_PACK_MAX_RECORDS + 1); }],
    ["non-object colorway entry", (record: any) => { record.colorways[0] = null; }],
    ["oversized total nested entities", (record: any) => { record.colorways[0].assignments = new Array(TECH_PACK_MAX_RECORDS); }],
  ])("rejects invalid record identity or bounds: %s", (_name, change) => reject(change));

  it.each([
    ["cover shape", (record: any) => { delete record.cover.ownerLabel; }],
    ["cover extra property", (record: any) => { record.cover.extra = null; }],
    ["cover field shape", (record: any) => { delete record.cover.styleCode.fieldId; }],
    ["cover duplicate field ID", (record: any) => { record.cover.styleName.fieldId = record.cover.styleCode.fieldId; }],
    ["cover field ID blank", (record: any) => { record.cover.styleCode.fieldId = " "; }],
    ["cover field ID too long", (record: any) => { record.cover.styleCode.fieldId = "x".repeat(161); }],
    ["cover semantic mismatch", (record: any) => { record.cover.styleCode.semanticKind = "MATERIAL_PROPERTY"; }],
    ["cover field value type", (record: any) => { record.cover.styleCode.value = 3; }],
    ["non-finite field number", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", Infinity); }],
    ["empty valid text", (record: any) => { record.cover.styleCode = userTextWith({ value: "   " }); }],
    ["empty text without correction", (record: any) => { record.cover.styleCode = userTextWith({ value: "", validationStatus: "INVALID" }); }],
    ["invalid unit", (record: any) => { record.cover.styleCode = userTextWith({ unit: "cm" }); }],
    ["empty unit", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", 1, { unit: " " }); }],
    ["numeric value without unit", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", 1, { unit: null }); }],
    ["unknown provenance", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "GUESSED" as any }); }],
    ["unknown evidence status", (record: any) => { record.cover.styleCode = userTextWith({ evidenceStatus: "LIKELY" as any }); }],
    ["unknown validation status", (record: any) => { record.cover.styleCode = userTextWith({ validationStatus: "PENDING" as any }); }],
    ["blank source metadata", (record: any) => { record.cover.styleCode = userTextWith({ sourceRef: " " }); }],
    ["noncanonical capture time", (record: any) => { record.cover.styleCode = userTextWith({ capturedAt: "2026-10-12T20:00:00Z" }); }],
    ["duplicate input references", (record: any) => { record.cover.styleCode = userTextWith({ inputRefs: ["same", "same"] }); }],
    ["empty evidence reference", (record: any) => { record.cover.styleCode = userTextWith({ evidenceRefs: [""] }); }],
    ["invalid inherited source shape", (record: any) => { record.cover.styleCode = userTextWith({ inheritedFrom: {} as any }); }],
    ["wrong confidence value", (record: any) => { record.cover.styleCode = userTextWith({ confidence: "HIGH" as any }); }],
    ["actor without time", (record: any) => { record.cover.styleCode = userTextWith({ capturedAt: null }); }],
    ["time without actor", (record: any) => { record.cover.styleCode = userTextWith({ capturedBy: null }); }],
    ["rule without version", (record: any) => { record.cover.styleCode = userTextWith({ ruleId: "rule" }); }],
    ["version without rule", (record: any) => { record.cover.styleCode = userTextWith({ ruleVersion: "1" }); }],
    ["invalid without reason", (record: any) => { record.cover.styleCode = userTextWith({ validationStatus: "INVALID" }); }],
    ["unresolved without next action", (record: any) => { record.cover.styleCode = unresolvedWith({ nextAction: null }); }],
    ["conflict marked valid", (record: any) => { record.cover.styleCode = userTextWith({ evidenceStatus: "CONFLICT", unresolvedReason: "Two sources disagree.", nextAction: "Review evidence." }); }],
    ["unresolved marked valid", (record: any) => { record.cover.styleCode = unresolvedWith({ validationStatus: "VALID" }); }],
    ["unresolved with confirmed source", (record: any) => { record.cover.styleCode = unresolvedWith({ evidenceStatus: "SOURCE_CONFIRMED" }); }],
    ["missing value without unresolved provenance", (record: any) => { record.cover.styleCode = userTextWith({ value: null as any }); }],
    ["user value without actor", (record: any) => { record.cover.styleCode = userTextWith({ capturedBy: null, capturedAt: null }); }],
    ["user value without method", (record: any) => { record.cover.styleCode = userTextWith({ method: null }); }],
    ["preset without source", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "PRESET", ruleId: "rule", ruleVersion: "1" }); }],
    ["preset without rule", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "PRESET", sourceRef: "recipe:Tee" }); }],
    ["calculated without inputs", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", 1, { provenance: "CALCULATED", ruleId: "rule", ruleVersion: "1" }); }],
    ["calculated without rule", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", 1, { provenance: "CALCULATED", inputRefs: ["input"] }); }],
    ["calculated without unit", (record: any) => { record.materials[0].weight = field("material.weight", "MATERIAL_PROPERTY", 1, { provenance: "CALCULATED", inputRefs: ["input"], ruleId: "rule", ruleVersion: "1", unit: null }); }],
    ["inherited without origin", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "INHERITED" }); }],
    ["non-inherited with origin", (record: any) => { record.cover.styleCode = userTextWith({ inheritedFrom: { revisionId: REVISION_ID, provenance: "USER_SELECTED", sourceRef: null } }); }],
    ["supplier without evidence", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "SUPPLIER", sourceRef: "supplier", capturedBy: "fixture", capturedAt: NOW }); }],
    ["supplier without dated actor", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "SUPPLIER", sourceRef: "supplier", evidenceRefs: ["evidence"], capturedBy: null, capturedAt: null }); }],
    ["sample measured without sample provenance", (record: any) => { record.cover.styleCode = userTextWith({ evidenceStatus: "SAMPLE_MEASURED" }); }],
    ["sample actual without revision", (record: any) => {
      record.revisionId = null;
      record.revisionNumber = 0;
      record.cover.styleCode = userTextWith({ provenance: "SAMPLE_ACTUAL", evidenceStatus: "SAMPLE_MEASURED", sourceRef: "round", evidenceRefs: ["evidence"] });
    }],
    ["observed value without method", (record: any) => { record.cover.styleCode = userTextWith({ provenance: "IMAGE_OBSERVED", sourceRef: "photo", evidenceRefs: ["evidence"], method: null }); }],
  ])("rejects invalid field envelope: %s", (_name, change) => reject(change));

  it("requires exact revision pairing for sample observations and allows a corrected invalid numeric entry", () => {
    const invalidValue = field<number>("material.weight", "MATERIAL_PROPERTY", 0, {
      validationStatus: "INVALID", unresolvedReason: "Zero is not a usable width.", nextAction: "Enter a positive value.",
    });
    const record = validRecord();
    record.materials[0].weight = invalidValue;
    record.cover.styleCode = userTextWith({
      provenance: "SAMPLE_ACTUAL", evidenceStatus: "SAMPLE_MEASURED", sourceRef: "sample-round",
      method: "measured for the exact digital revision", evidenceRefs: ["sample-photo"],
    });
    expect(parseTechPackRecord(record).ok).toBe(true);
  });

  it.each([
    ["material shape", (record: any) => { delete record.materials[0].composition; }],
    ["material extra property", (record: any) => { record.materials[0].extra = true; }],
    ["material invalid ID", (record: any) => { record.materials[0].id = "bad"; }],
    ["material ID collides with style", (record: any) => { record.materials[0].id = STYLE_ID; }],
    ["material category", (record: any) => { record.materials[0].category = "unknown"; }],
    ["material duplicate ID", (record: any) => { record.materials.push({ ...record.materials[0] }); }],
    ["material field error", (record: any) => { record.materials[0].name.value = ""; }],
    ["valid nonpositive weight", (record: any) => { record.materials[0].weight = field<number | null>("material.weight", "MATERIAL_PROPERTY", 0); }],
    ["valid nonpositive width", (record: any) => { record.materials[0].usableWidth = field<number | null>("material.width", "MATERIAL_PROPERTY", 0); }],
    ["valid negative cost", (record: any) => {
      record.materials[0].unitCost = field<number | null>("material.cost", "MATERIAL_PROPERTY", -1);
      record.materials[0].currency = field("material.currency", "MATERIAL_PROPERTY", "USD");
      record.materials[0].costBasis = field("material.costBasis", "MATERIAL_PROPERTY", "per unit");
    }],
    ["cost without currency", (record: any) => { record.materials[0].unitCost = field<number | null>("material.cost", "MATERIAL_PROPERTY", 1); }],
    ["cost without cost basis", (record: any) => {
      record.materials[0].unitCost = field<number | null>("material.cost", "MATERIAL_PROPERTY", 1);
      record.materials[0].currency = field("material.currency", "MATERIAL_PROPERTY", "USD");
    }],
  ])("rejects invalid material record: %s", (_name, change) => reject(change));

  it.each([
    ["BOM row shape", (record: any) => { delete record.bomRows[0].placement; }],
    ["BOM row invalid ID", (record: any) => { record.bomRows[0].id = "bad"; }],
    ["BOM row collides with style", (record: any) => { record.bomRows[0].id = STYLE_ID; }],
    ["BOM missing material", (record: any) => { record.bomRows[0].materialId = MANIFEST_ID; }],
    ["BOM field error", (record: any) => { record.bomRows[0].placement.value = ""; }],
    ["BOM duplicate row ID", (record: any) => { record.bomRows.push({ ...record.bomRows[0] }); }],
    ["valid zero quantity", (record: any) => { record.bomRows[0].quantity = field<number | null>("bom.quantity", "MATERIAL_PROPERTY", 0); }],
    ["valid negative quantity", (record: any) => { record.bomRows[0].quantity = field<number | null>("bom.quantity", "MATERIAL_PROPERTY", -1); }],
    ["unknown quantity basis", (record: any) => { record.bomRows[0].quantityBasis = field("bom.quantityBasis", "MATERIAL_PROPERTY", "per-box"); }],
  ])("rejects invalid BOM record: %s", (_name, change) => reject(change));

  it.each([
    ["colorway shape", (record: any) => { delete record.colorways[0].name; }],
    ["colorway invalid ID", (record: any) => { record.colorways[0].id = "bad"; }],
    ["colorway collides with style", (record: any) => { record.colorways[0].id = STYLE_ID; }],
    ["colorway duplicate ID", (record: any) => { record.colorways.push({ ...record.colorways[0], assignments: [] }); }],
    ["invalid assignments collection", (record: any) => { record.colorways[0].assignments = {}; }],
    ["oversized assignments", (record: any) => { record.colorways[0].assignments = new Array(TECH_PACK_MAX_RECORDS + 1); }],
    ["colorway field error", (record: any) => { record.colorways[0].name.value = ""; }],
    ["assignment shape", (record: any) => { delete record.colorways[0].assignments[0].color; }],
    ["assignment invalid ID", (record: any) => { record.colorways[0].assignments[0].id = "bad"; }],
    ["assignment duplicates its parent ID", (record: any) => { record.colorways[0].assignments[0].id = COLORWAY_ID; }],
    ["duplicate assignment ID", (record: any) => { record.colorways[0].assignments.push({ ...record.colorways[0].assignments[0], color: field("assignment.color.2", "MATERIAL_PROPERTY", null) }); }],
    ["duplicate material assignment to one BOM row", (record: any) => { record.colorways[0].assignments.push({ ...record.colorways[0].assignments[0], id: "10000000-0000-4000-8000-000000000009", color: field("assignment.color.2", "MATERIAL_PROPERTY", null) }); }],
    ["assignment missing BOM row", (record: any) => { record.colorways[0].assignments[0].bomRowId = MANIFEST_ID; }],
    ["assignment missing material", (record: any) => { record.colorways[0].assignments[0].materialId = MANIFEST_ID; }],
    ["assignment color field error", (record: any) => { record.colorways[0].assignments[0].color.value = ""; }],
  ])("rejects invalid colorway record: %s", (_name, change) => reject(change));

  it.each([
    ["approval shape", (record: any) => { delete record.approval.state; }],
    ["unknown approval state", (record: any) => { record.approval.state = "SIGNED_OFF"; }],
    ["approval revision ID", (record: any) => { record.approval.revisionId = "bad"; }],
    ["duplicate approval scope", (record: any) => { const id = record.cover.styleCode.fieldId; record.approval.scopeFieldIds = [id, id]; }],
    ["dangling approval scope", (record: any) => { record.approval.scopeFieldIds = ["missing-field"]; }],
    ["blank approval actor", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = " "; }],
    ["bad approval timestamp", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = "yesterday"; }],
    ["invalid manifest ID", (record: any) => { record.approval.manifestId = "bad"; }],
    ["draft with revision", (record: any) => { record.approval.revisionId = REVISION_ID; }],
    ["draft with scope", (record: any) => { record.approval.scopeFieldIds = ["cover.styleCode"]; }],
    ["draft with actor", (record: any) => { record.approval.changedBy = "reviewer"; }],
    ["draft with time", (record: any) => { record.approval.changedAt = NOW; }],
    ["draft with manifest", (record: any) => { record.approval.manifestId = MANIFEST_ID; }],
    ["review on unlinked revision", (record: any) => { record.revisionId = null; record.revisionNumber = 0; record.approval.state = "REVIEW"; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; }],
    ["review on different revision", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = STYLE_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; }],
    ["review with empty scope", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; }],
    ["review without actor", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedAt = NOW; }],
    ["review without time", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; }],
    ["review with manifest", (record: any) => { record.approval.state = "REVIEW"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; record.approval.manifestId = MANIFEST_ID; }],
    ["approved with manifest", (record: any) => { record.approval.state = "APPROVED"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; record.approval.manifestId = MANIFEST_ID; }],
    ["frozen without manifest", (record: any) => { record.approval.state = "FROZEN_FOR_SHARE"; record.approval.revisionId = REVISION_ID; record.approval.scopeFieldIds = ["cover.styleCode"]; record.approval.changedBy = "reviewer"; record.approval.changedAt = NOW; }],
  ])("rejects invalid scoped approval: %s", (_name, change) => reject(change));

  it.each(["REVIEW", "APPROVED", "FROZEN_FOR_SHARE"] as const)("accepts a valid %s scope", (state) => {
    const record = validRecord();
    record.approval = {
      state,
      revisionId: REVISION_ID,
      scopeFieldIds: [record.cover.styleCode.fieldId],
      changedBy: "reviewer",
      changedAt: NOW,
      manifestId: state === "FROZEN_FOR_SHARE" ? MANIFEST_ID : null,
    };
    expect(parseTechPackRecord(record).ok).toBe(true);
  });
});
