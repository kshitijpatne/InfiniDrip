/** Schema-v1 editable T01 tech-pack records and strict, pure validation.
 * Storage, migration, UI and immutable revision integration are separate slices. */
import type { FieldEvidenceStatus, FieldProvenance } from "./field-provenance";
import type { RecordResult } from "./project-records";

export const TECH_PACK_RECORD_VERSION = 1;
export const TECH_PACK_MAX_RECORDS = 10_000;

export const TECH_PACK_SEMANTIC_KINDS = Object.freeze([
  "BODY_MEASURE",
  "GARMENT_MEASURE",
  "FINISHED_POM",
  "PATTERN_PARAMETER",
  "STYLE_CONTROL",
  "GRADE_RULE",
  "MATERIAL_PROPERTY",
  "DONOR_MEASURE",
  "PANEL_GEOMETRY",
  "VISUAL_OBSERVATION",
] as const);

export const TECH_PACK_APPROVAL_STATES = Object.freeze([
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "FROZEN_FOR_SHARE",
] as const);

export const TECH_PACK_QUANTITY_BASES = Object.freeze([
  "per-garment",
  "per-marker",
  "per-run",
  "pieces-per-garment",
  "supplier-pack",
  "order-total",
] as const);

export type TechPackSemanticKind = typeof TECH_PACK_SEMANTIC_KINDS[number];
export type TechPackApprovalState = typeof TECH_PACK_APPROVAL_STATES[number];
export type TechPackQuantityBasis = typeof TECH_PACK_QUANTITY_BASES[number];
export type TechPackFieldValue = string | number | boolean | null;
export type TechPackField<T extends TechPackFieldValue = TechPackFieldValue> = {
  readonly fieldId: string;
  readonly semanticKind: TechPackSemanticKind;
  readonly value: T;
  readonly unit: string | null;
  readonly provenance: FieldProvenance;
  readonly evidenceStatus: FieldEvidenceStatus;
  readonly validationStatus: "VALID" | "INVALID";
  readonly sourceRef: string | null;
  readonly method: string | null;
  readonly capturedBy: string | null;
  readonly capturedAt: string | null;
  readonly inputRefs: readonly string[];
  readonly ruleId: string | null;
  readonly ruleVersion: string | null;
  readonly inheritedFrom: {
    readonly revisionId: string;
    readonly provenance: Exclude<FieldProvenance, "INHERITED" | "UNRESOLVED">;
    readonly sourceRef: string | null;
  } | null;
  readonly unresolvedReason: string | null;
  readonly nextAction: string | null;
  readonly evidenceRefs: readonly string[];
  readonly confidence: "NOT_ASSESSED";
};

export interface TechPackCover {
  readonly styleCode: TechPackField<string | null>;
  readonly styleName: TechPackField<string | null>;
  readonly ownerLabel: TechPackField<string | null>;
  readonly intendedUse: TechPackField<string | null>;
  readonly baseSizeId: TechPackField<string | null>;
  readonly measurementUnit: TechPackField<string | null>;
}

export interface TechPackMaterial {
  readonly id: string;
  readonly category: "fabric" | "trim";
  readonly name: TechPackField<string | null>;
  readonly supplier: TechPackField<string | null>;
  readonly articleId: TechPackField<string | null>;
  readonly lotId: TechPackField<string | null>;
  readonly composition: TechPackField<string | null>;
  readonly construction: TechPackField<string | null>;
  readonly weight: TechPackField<number | null>;
  readonly usableWidth: TechPackField<number | null>;
  readonly finish: TechPackField<string | null>;
  readonly color: TechPackField<string | null>;
  readonly directionalBehavior: TechPackField<string | null>;
  readonly unitCost: TechPackField<number | null>;
  readonly currency: TechPackField<string | null>;
  readonly costBasis: TechPackField<string | null>;
}

export interface TechPackBomRow {
  readonly id: string;
  readonly componentRef: TechPackField<string | null>;
  readonly placement: TechPackField<string | null>;
  readonly materialId: string;
  readonly quantity: TechPackField<number | null>;
  readonly quantityBasis: TechPackField<TechPackQuantityBasis | null>;
  readonly requiredness: TechPackField<boolean | null>;
}

export interface TechPackColorwayAssignment {
  readonly id: string;
  readonly bomRowId: string;
  readonly materialId: string;
  readonly color: TechPackField<string | null>;
}

export interface TechPackColorway {
  readonly id: string;
  readonly name: TechPackField<string | null>;
  readonly assignments: readonly TechPackColorwayAssignment[];
}

export interface TechPackScopedApproval {
  readonly state: TechPackApprovalState;
  readonly revisionId: string | null;
  readonly scopeFieldIds: readonly string[];
  readonly changedBy: string | null;
  readonly changedAt: string | null;
  readonly manifestId: string | null;
}

export interface TechPackRecord {
  readonly schemaVersion: typeof TECH_PACK_RECORD_VERSION;
  readonly styleId: string;
  readonly recipeId: string;
  readonly recipeVersion: string;
  /** Null/zero only before G02 has created the first immutable style revision. */
  readonly revisionId: string | null;
  readonly revisionNumber: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly cover: TechPackCover;
  readonly materials: readonly TechPackMaterial[];
  readonly bomRows: readonly TechPackBomRow[];
  readonly colorways: readonly TechPackColorway[];
  readonly approval: TechPackScopedApproval;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEMANTIC_KINDS = new Set<string>(TECH_PACK_SEMANTIC_KINDS);
const APPROVAL_STATES = new Set<string>(TECH_PACK_APPROVAL_STATES);
const QUANTITY_BASES = new Set<string>(TECH_PACK_QUANTITY_BASES);
const PROVENANCE_VALUES = new Set<string>([
  "USER_CAPTURED", "USER_SELECTED", "PRESET", "INHERITED", "CALCULATED",
  "SUPPLIER", "SAMPLE_ACTUAL", "IMAGE_OBSERVED", "UNRESOLVED",
]);
const EVIDENCE_STATUSES = new Set<string>([
  "UNCONFIRMED", "USER_CONFIRMED", "SOURCE_CONFIRMED", "SAMPLE_MEASURED", "CONFLICT",
]);
const VALIDATION_STATUSES = new Set<string>(["VALID", "INVALID"]);
const FIELD_KEYS = [
  "fieldId", "semanticKind", "value", "unit", "provenance", "evidenceStatus",
  "validationStatus", "sourceRef", "method", "capturedBy", "capturedAt", "inputRefs",
  "ruleId", "ruleVersion", "inheritedFrom", "unresolvedReason", "nextAction", "evidenceRefs", "confidence",
];
const COVER_KEYS = ["styleCode", "styleName", "ownerLabel", "intendedUse", "baseSizeId", "measurementUnit"];
const MATERIAL_KEYS = [
  "id", "category", "name", "supplier", "articleId", "lotId", "composition", "construction",
  "weight", "usableWidth", "finish", "color", "directionalBehavior", "unitCost", "currency", "costBasis",
];
const BOM_KEYS = ["id", "componentRef", "placement", "materialId", "quantity", "quantityBasis", "requiredness"];
const COLORWAY_KEYS = ["id", "name", "assignments"];
const ASSIGNMENT_KEYS = ["id", "bomRowId", "materialId", "color"];
const APPROVAL_KEYS = ["state", "revisionId", "scopeFieldIds", "changedBy", "changedAt", "manifestId"];
const RECORD_KEYS = [
  "schemaVersion", "styleId", "recipeId", "recipeVersion", "revisionId", "revisionNumber",
  "createdAt", "updatedAt", "cover", "materials", "bomRows", "colorways", "approval",
];

type FieldKind = "text" | "number" | "boolean";

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!object(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function nonEmpty(value: unknown, maxLength = 240): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function optionalText(value: unknown): value is string | null {
  return value === null || nonEmpty(value);
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function uniqueTextArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => nonEmpty(entry)) && new Set(value).size === value.length;
}

function inheritedFrom(value: unknown): value is TechPackField<never>["inheritedFrom"] {
  if (value === null) return true;
  if (!exactKeys(value, ["revisionId", "provenance", "sourceRef"])) return false;
  return uuid(value.revisionId)
    && typeof value.provenance === "string"
    && PROVENANCE_VALUES.has(value.provenance)
    && value.provenance !== "INHERITED"
    && value.provenance !== "UNRESOLVED"
    && optionalText(value.sourceRef);
}

function fieldValueMatches(value: unknown, kind: FieldKind): boolean {
  if (value === null) return true;
  if (kind === "text") return typeof value === "string";
  if (kind === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "boolean";
}

type ParsedFieldValues<T extends Record<string, RecordResult<unknown>>> = {
  [K in keyof T]: Extract<T[K], { readonly ok: true }> extends { readonly value: infer V } ? V : never;
};

function collectFields<T extends Record<string, RecordResult<unknown>>>(
  fields: T,
): RecordResult<ParsedFieldValues<T>> {
  const values = {} as ParsedFieldValues<T>;
  for (const key of Object.keys(fields) as Array<keyof T>) {
    const result = fields[key];
    if (!result.ok) return fail(result.error);
    values[key] = result.value as ParsedFieldValues<T>[typeof key];
  }
  return { ok: true, value: values };
}

function parseField<T extends TechPackFieldValue>(
  value: unknown,
  semanticKind: TechPackSemanticKind,
  kind: FieldKind,
  fieldIds: Set<string>,
  sampleAllowed = true,
): RecordResult<TechPackField<T>> {
  if (!exactKeys(value, FIELD_KEYS)) return fail("Field envelope is incomplete or contains an unknown property.");
  if (!nonEmpty(value.fieldId, 160) || fieldIds.has(value.fieldId)) return fail("Field ID is invalid or duplicated.");
  if (value.semanticKind !== semanticKind || !SEMANTIC_KINDS.has(String(value.semanticKind))) {
    return fail("Field semantic kind does not match its T01 definition.");
  }
  if (!fieldValueMatches(value.value, kind)) return fail("Field value must match its declared T01 value type and be finite.");
  if (typeof value.value === "string" && value.value.trim().length === 0 && value.validationStatus !== "INVALID") {
    return fail("An empty value must be retained as an invalid value with a correction.");
  }
  if (!optionalText(value.unit) || (kind !== "number" && value.unit !== null)) return fail("Field unit is invalid for its value type.");
  if (kind === "number" && value.value !== null && value.unit === null && value.validationStatus !== "INVALID") {
    return fail("A numeric field with a value requires an explicit unit.");
  }
  if (typeof value.provenance !== "string" || !PROVENANCE_VALUES.has(value.provenance)) return fail("Field provenance is unsupported.");
  if (value.provenance === "SAMPLE_ACTUAL" && !sampleAllowed) return fail("Sample actuals require a linked immutable style revision.");
  if (typeof value.evidenceStatus !== "string" || !EVIDENCE_STATUSES.has(value.evidenceStatus)) return fail("Field evidence status is unsupported.");
  if (typeof value.validationStatus !== "string" || !VALIDATION_STATUSES.has(value.validationStatus)) return fail("Field validation status is unsupported.");
  if (!optionalText(value.sourceRef) || !optionalText(value.method) || !optionalText(value.capturedBy)
    || !optionalText(value.ruleId) || !optionalText(value.ruleVersion)
    || !optionalText(value.unresolvedReason) || !optionalText(value.nextAction)) {
    return fail("Field provenance metadata must be null or non-empty text.");
  }
  if (value.capturedAt !== null && !timestamp(value.capturedAt)) return fail("Field capture time must be a canonical UTC timestamp.");
  if (!uniqueTextArray(value.inputRefs) || !uniqueTextArray(value.evidenceRefs)) return fail("Field input and evidence references must be unique, non-empty strings.");
  if (!inheritedFrom(value.inheritedFrom)) return fail("Inherited field source must identify its prior revision and original provenance.");
  if (value.confidence !== "NOT_ASSESSED") return fail("T01 does not define a confidence score.");
  if ((value.capturedBy === null) !== (value.capturedAt === null)) return fail("Field actor and capture time must be recorded together.");
  if ((value.ruleId === null) !== (value.ruleVersion === null)) return fail("Field rule ID and version must be recorded together.");
  if ((value.validationStatus === "INVALID" || value.evidenceStatus === "CONFLICT" || value.provenance === "UNRESOLVED")
    && (!nonEmpty(value.unresolvedReason) || !nonEmpty(value.nextAction))) {
    return fail("Invalid, conflicting or unresolved fields require a reason and next action.");
  }
  if (value.provenance === "UNRESOLVED" && value.validationStatus !== "INVALID") {
    return fail("Unresolved fields cannot be marked valid.");
  }
  if (value.evidenceStatus === "CONFLICT" && value.validationStatus !== "INVALID") return fail("Conflicting evidence cannot be marked valid.");
  if (value.evidenceStatus === "SAMPLE_MEASURED" && value.provenance !== "SAMPLE_ACTUAL") return fail("Sample-measured evidence requires SAMPLE_ACTUAL provenance.");
  if (value.provenance === "UNRESOLVED") {
    if (value.value !== null || value.evidenceStatus === "SOURCE_CONFIRMED" || value.evidenceStatus === "SAMPLE_MEASURED") {
      return fail("Unresolved fields cannot carry a value or confirmed evidence.");
    }
  } else if (value.value === null) {
    return fail("A missing value must use UNRESOLVED provenance.");
  }
  if ((value.provenance === "USER_CAPTURED" || value.provenance === "USER_SELECTED")
    && (value.capturedBy === null || value.capturedAt === null || value.method === null)) {
    return fail("User-entered values require actor, time and capture/selection method.");
  }
  if (value.provenance === "PRESET" && (value.sourceRef === null || value.ruleId === null || value.ruleVersion === null)) {
    return fail("Preset values require a source/block ID and version.");
  }
  if (value.provenance === "CALCULATED"
    && (value.inputRefs.length === 0 || value.ruleId === null || value.ruleVersion === null || value.unit === null)) {
    return fail("Calculated values require input IDs, rule/version and unit.");
  }
  if (value.provenance === "INHERITED" && value.inheritedFrom === null) return fail("Inherited values require their prior revision and original source.");
  if (value.provenance !== "INHERITED" && value.inheritedFrom !== null) return fail("Only inherited values may declare an inherited source.");
  if (value.provenance === "SUPPLIER"
    && (value.sourceRef === null || value.evidenceRefs.length === 0 || value.capturedBy === null || value.capturedAt === null)) {
    return fail("Supplier facts require identity/source, dated attribution and evidence.");
  }
  if ((value.provenance === "SAMPLE_ACTUAL" || value.provenance === "IMAGE_OBSERVED")
    && (value.sourceRef === null || value.method === null || value.evidenceRefs.length === 0
      || value.capturedBy === null || value.capturedAt === null)) {
    return fail("Observed values require source, method, actor/time and evidence.");
  }
  fieldIds.add(value.fieldId);
  return { ok: true, value: {
    ...value,
    inputRefs: [...value.inputRefs as string[]],
    evidenceRefs: [...value.evidenceRefs as string[]],
    inheritedFrom: value.inheritedFrom === null ? null : { ...(value.inheritedFrom as Record<string, unknown>) },
  } as unknown as TechPackField<T> };
}

function parseCover(value: unknown, fieldIds: Set<string>, sampleAllowed: boolean): RecordResult<TechPackCover> {
  if (!exactKeys(value, COVER_KEYS)) return fail("T01 cover fields are incomplete or unknown.");
  return collectFields({
    styleCode: parseField<string | null>(value.styleCode, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    styleName: parseField<string | null>(value.styleName, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    ownerLabel: parseField<string | null>(value.ownerLabel, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    intendedUse: parseField<string | null>(value.intendedUse, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    baseSizeId: parseField<string | null>(value.baseSizeId, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    measurementUnit: parseField<string | null>(value.measurementUnit, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
  });
}

function parseMaterial(value: unknown, fieldIds: Set<string>, recordIds: Set<string>, sampleAllowed: boolean): RecordResult<TechPackMaterial> {
  if (!exactKeys(value, MATERIAL_KEYS)) return fail("Material record fields are incomplete or unknown.");
  if (!uuid(value.id) || recordIds.has(value.id)) return fail("Material ID is invalid or duplicated.");
  if (value.category !== "fabric" && value.category !== "trim") return fail("Material category must be fabric or trim.");
  const fields = collectFields({
    name: parseField<string | null>(value.name, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    supplier: parseField<string | null>(value.supplier, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    articleId: parseField<string | null>(value.articleId, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    lotId: parseField<string | null>(value.lotId, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    composition: parseField<string | null>(value.composition, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    construction: parseField<string | null>(value.construction, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    weight: parseField<number | null>(value.weight, "MATERIAL_PROPERTY", "number", fieldIds, sampleAllowed),
    usableWidth: parseField<number | null>(value.usableWidth, "MATERIAL_PROPERTY", "number", fieldIds, sampleAllowed),
    finish: parseField<string | null>(value.finish, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    color: parseField<string | null>(value.color, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    directionalBehavior: parseField<string | null>(value.directionalBehavior, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    unitCost: parseField<number | null>(value.unitCost, "MATERIAL_PROPERTY", "number", fieldIds, sampleAllowed),
    currency: parseField<string | null>(value.currency, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    costBasis: parseField<string | null>(value.costBasis, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
  });
  if (!fields.ok) return fail(fields.error);
  const { weight, usableWidth, unitCost, currency, costBasis } = fields.value;
  if ([weight, usableWidth].some((field) => field.value !== null && field.validationStatus === "VALID" && field.value <= 0)) {
    return fail("Valid material weight and width must be positive; keep invalid entries visibly invalid with a correction.");
  }
  if (unitCost.value !== null && unitCost.validationStatus === "VALID" && unitCost.value < 0) {
    return fail("A valid material cost cannot be negative; do not replace missing cost with zero.");
  }
  if (unitCost.value !== null && (currency.value === null || costBasis.value === null)) {
    return fail("A material cost requires its currency and cost basis.");
  }
  recordIds.add(value.id);
  return { ok: true, value: { id: value.id, category: value.category, ...fields.value } };
}

function parseBomRow(value: unknown, fieldIds: Set<string>, recordIds: Set<string>, materialIds: Set<string>, sampleAllowed: boolean): RecordResult<TechPackBomRow> {
  if (!exactKeys(value, BOM_KEYS)) return fail("BOM row fields are incomplete or unknown.");
  if (!uuid(value.id) || recordIds.has(value.id)) return fail("BOM row ID is invalid or duplicated.");
  if (!uuid(value.materialId) || !materialIds.has(value.materialId)) return fail("BOM row references a missing material.");
  const fields = collectFields({
    componentRef: parseField<string | null>(value.componentRef, "PANEL_GEOMETRY", "text", fieldIds, sampleAllowed),
    placement: parseField<string | null>(value.placement, "STYLE_CONTROL", "text", fieldIds, sampleAllowed),
    quantity: parseField<number | null>(value.quantity, "MATERIAL_PROPERTY", "number", fieldIds, sampleAllowed),
    quantityBasis: parseField<TechPackQuantityBasis | null>(value.quantityBasis, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed),
    requiredness: parseField<boolean | null>(value.requiredness, "STYLE_CONTROL", "boolean", fieldIds, sampleAllowed),
  });
  if (!fields.ok) return fail(fields.error);
  const { componentRef, placement, quantity, quantityBasis, requiredness } = fields.value;
  if (quantity.value !== null && quantity.validationStatus === "VALID" && quantity.value <= 0) {
    return fail("A valid BOM quantity must be positive; retain invalid entries with an actionable correction.");
  }
  if (quantityBasis.value !== null && !QUANTITY_BASES.has(quantityBasis.value)) return fail("BOM quantity basis is unsupported.");
  recordIds.add(value.id);
  return { ok: true, value: { id: value.id, componentRef, placement,
    materialId: value.materialId, quantity, quantityBasis, requiredness } };
}

function parseColorway(value: unknown, fieldIds: Set<string>, recordIds: Set<string>, rowIds: Set<string>, materialIds: Set<string>, sampleAllowed: boolean): RecordResult<TechPackColorway> {
  if (!exactKeys(value, COLORWAY_KEYS)) return fail("Colorway record fields are incomplete or unknown.");
  if (!uuid(value.id) || recordIds.has(value.id)) return fail("Colorway ID is invalid or duplicated.");
  recordIds.add(value.id);
  if (!Array.isArray(value.assignments) || value.assignments.length > TECH_PACK_MAX_RECORDS) return fail("Colorway assignments must be a bounded list.");
  const name = parseField<string | null>(value.name, "STYLE_CONTROL", "text", fieldIds, sampleAllowed);
  if (!name.ok) return fail(name.error);
  const assignments: TechPackColorwayAssignment[] = [];
  const assignedRows = new Set<string>();
  for (const assignment of value.assignments) {
    if (!exactKeys(assignment, ASSIGNMENT_KEYS)) return fail("Colorway assignment fields are incomplete or unknown.");
    if (!uuid(assignment.id) || recordIds.has(assignment.id)) return fail("Colorway assignment ID is invalid or duplicated.");
    if (!uuid(assignment.bomRowId) || !rowIds.has(assignment.bomRowId)) return fail("Colorway assignment references a missing BOM row.");
    if (assignedRows.has(assignment.bomRowId)) return fail("A colorway can assign only one material to each BOM row.");
    if (!uuid(assignment.materialId) || !materialIds.has(assignment.materialId)) return fail("Colorway assignment references a missing material.");
    const color = parseField<string | null>(assignment.color, "MATERIAL_PROPERTY", "text", fieldIds, sampleAllowed);
    if (!color.ok) return fail(color.error);
    assignedRows.add(assignment.bomRowId);
    recordIds.add(assignment.id);
    assignments.push({ id: assignment.id, bomRowId: assignment.bomRowId, materialId: assignment.materialId, color: color.value });
  }
  return { ok: true, value: { id: value.id, name: name.value, assignments } };
}

function parseApproval(value: unknown, revisionId: string | null, fieldIds: Set<string>): RecordResult<TechPackScopedApproval> {
  if (!exactKeys(value, APPROVAL_KEYS)) return fail("Scoped approval fields are incomplete or unknown.");
  if (typeof value.state !== "string" || !APPROVAL_STATES.has(value.state)) return fail("Tech-pack approval state is unsupported.");
  if (value.revisionId !== null && !uuid(value.revisionId)) return fail("Approval revision ID is invalid.");
  if (!uniqueTextArray(value.scopeFieldIds)) return fail("Approval scope must contain unique field IDs.");
  if (value.scopeFieldIds.some((id) => !fieldIds.has(id))) return fail("Approval scope references a field outside this record.");
  if (!optionalText(value.changedBy) || (value.changedAt !== null && !timestamp(value.changedAt))) return fail("Approval actor/time is invalid.");
  if (value.manifestId !== null && !uuid(value.manifestId)) return fail("Frozen-share manifest ID is invalid.");
  if (value.state === "DRAFT") {
    if (value.revisionId !== null || value.scopeFieldIds.length > 0 || value.changedBy !== null || value.changedAt !== null || value.manifestId !== null) {
      return fail("Draft records cannot carry a review, approval or freeze decision.");
    }
  } else {
    if (revisionId === null || value.revisionId !== revisionId || value.scopeFieldIds.length === 0
      || value.changedBy === null || value.changedAt === null) {
      return fail("Review and approval decisions require an exact revision, non-empty field scope and actor/time.");
    }
    if (value.state === "FROZEN_FOR_SHARE" ? value.manifestId === null : value.manifestId !== null) {
      return fail("Only a frozen local share may carry a manifest ID; frozen state requires one.");
    }
  }
  return { ok: true, value: {
    state: value.state as TechPackApprovalState,
    revisionId: value.revisionId as string | null,
    scopeFieldIds: [...value.scopeFieldIds as string[]],
    changedBy: value.changedBy as string | null,
    changedAt: value.changedAt as string | null,
    manifestId: value.manifestId as string | null,
  } };
}

/** Strict parser for the additive T01 record; it does not read or write storage. */
export function parseTechPackRecord(value: unknown): RecordResult<TechPackRecord> {
  if (!exactKeys(value, RECORD_KEYS)) return fail("Tech-pack record fields are incomplete or unknown.");
  if (value.schemaVersion !== TECH_PACK_RECORD_VERSION) return fail("Unsupported tech-pack record schema version.");
  if (!uuid(value.styleId) || !nonEmpty(value.recipeId, 120) || !nonEmpty(value.recipeVersion, 120)) {
    return fail("Tech-pack style and recipe identity is invalid.");
  }
  if (value.revisionId !== null && !uuid(value.revisionId)) return fail("Tech-pack revision ID is invalid.");
  if (!Number.isSafeInteger(value.revisionNumber) || (value.revisionNumber as number) < 0
    || (value.revisionId === null ? value.revisionNumber !== 0 : (value.revisionNumber as number) < 1)) {
    return fail("Tech-pack revision ID and number must be paired.");
  }
  if (!timestamp(value.createdAt) || !timestamp(value.updatedAt) || Date.parse(value.updatedAt as string) < Date.parse(value.createdAt as string)) {
    return fail("Tech-pack timestamps must be canonical and updatedAt cannot precede createdAt.");
  }
  if (!Array.isArray(value.materials) || value.materials.length > TECH_PACK_MAX_RECORDS
    || !Array.isArray(value.bomRows) || value.bomRows.length > TECH_PACK_MAX_RECORDS
    || !Array.isArray(value.colorways) || value.colorways.length > TECH_PACK_MAX_RECORDS) {
    return fail("Tech-pack child collections must be bounded lists.");
  }
  let entityCount = 1 + value.materials.length + value.bomRows.length + value.colorways.length;
  for (const colorway of value.colorways) {
    if (object(colorway) && Array.isArray(colorway.assignments)) entityCount += colorway.assignments.length;
  }
  if (entityCount > TECH_PACK_MAX_RECORDS) return fail("Tech-pack records exceed the total entity limit.");
  const fieldIds = new Set<string>();
  const recordIds = new Set<string>([value.styleId]);
  const sampleAllowed = value.revisionId !== null;
  const cover = parseCover(value.cover, fieldIds, sampleAllowed);
  if (!cover.ok) return fail(cover.error);
  const materials: TechPackMaterial[] = [];
  for (const material of value.materials) {
    const parsed = parseMaterial(material, fieldIds, recordIds, sampleAllowed);
    if (!parsed.ok) return fail(parsed.error);
    materials.push(parsed.value);
  }
  const materialIds = new Set(materials.map((material) => material.id));
  const bomRows: TechPackBomRow[] = [];
  for (const row of value.bomRows) {
    const parsed = parseBomRow(row, fieldIds, recordIds, materialIds, sampleAllowed);
    if (!parsed.ok) return fail(parsed.error);
    bomRows.push(parsed.value);
  }
  const rowIds = new Set(bomRows.map((row) => row.id));
  const colorways: TechPackColorway[] = [];
  for (const colorway of value.colorways) {
    const parsed = parseColorway(colorway, fieldIds, recordIds, rowIds, materialIds, sampleAllowed);
    if (!parsed.ok) return fail(parsed.error);
    colorways.push(parsed.value);
  }
  const approval = parseApproval(value.approval, value.revisionId as string | null, fieldIds);
  if (!approval.ok) return fail(approval.error);
  return { ok: true, value: {
    schemaVersion: TECH_PACK_RECORD_VERSION,
    styleId: value.styleId,
    recipeId: value.recipeId,
    recipeVersion: value.recipeVersion,
    revisionId: value.revisionId,
    revisionNumber: value.revisionNumber as number,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    cover: cover.value,
    materials,
    bomRows,
    colorways,
    approval: approval.value,
  } };
}
