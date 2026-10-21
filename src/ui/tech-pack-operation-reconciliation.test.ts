import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M } from "../drafting";
import { block, type Block } from "../drafting/block";
import { iface, edgeRef, markRef, type Stitch } from "../drafting/stitch";
import { lineMark } from "../drafting/pattern-mark";
import type { Piece } from "../drafting/piece";
import type { TechPackOperation, TechPackOperationRecordSet, TechPackOperationSourcedValue } from "./tech-pack-operation-records";
import { createEmptyTechPackRecord, type TechPackBomRow, type TechPackField } from "./tech-pack-records";
import {
  buildTechPackReferenceReconciliation,
  deriveTechPackPatternInventory,
  reconcileTechPackReferences,
} from "./tech-pack-operation-reconciliation";

const NOW = "2026-10-13T04:15:00.000Z";
const STYLE_ID = "10000000-0000-4000-8000-000000000001";
const POINT = { x: 0, y: 0 };
const FRONT: Piece = {
  name: "Front panel", onFold: false,
  edges: [{ kind: "line", name: "shoulder", start: POINT, end: { x: 5, y: 0 } }],
  marks: [lineMark("placementLine", "dart", POINT, { x: 0, y: 2 })],
};
const BACK: Piece = {
  name: "Back panel", onFold: false,
  edges: [{ kind: "line", name: "shoulder", start: POINT, end: { x: 5, y: 0 } }],
};
const SIDE_STITCH: Stitch = {
  label: "Side Seam",
  a: iface(edgeRef("front", "shoulder")),
  b: iface(edgeRef("back", "shoulder", true)),
};

function refField(
  value: string | null,
  overrides: Partial<TechPackField<string | null>> = {},
): TechPackField<string | null> {
  const unresolved = value === null || overrides.provenance === "UNRESOLVED";
  return {
    fieldId: `bom.component.${value ?? "unknown"}`,
    semanticKind: "PANEL_GEOMETRY",
    value,
    unit: null,
    provenance: unresolved ? "UNRESOLVED" : "USER_CAPTURED",
    evidenceStatus: "UNCONFIRMED",
    validationStatus: unresolved ? "INVALID" : "VALID",
    sourceRef: null,
    method: null,
    capturedBy: null,
    capturedAt: null,
    inputRefs: [],
    ruleId: null,
    ruleVersion: null,
    inheritedFrom: null,
    unresolvedReason: unresolved ? "Reference is intentionally unresolved." : null,
    nextAction: unresolved ? "Choose a pattern component or retain the unknown." : null,
    evidenceRefs: [],
    confidence: "NOT_ASSESSED",
    ...overrides,
  };
}

function bomRow(value: string | null, overrides: Partial<TechPackField<string | null>> = {}): TechPackBomRow {
  const empty = <T extends string | number | boolean | null>(fieldId: string, semanticKind: TechPackBomRow["placement"]["semanticKind"]): TechPackField<T> => ({
    fieldId, semanticKind, value: null as T, unit: null, provenance: "UNRESOLVED", evidenceStatus: "UNCONFIRMED",
    validationStatus: "INVALID", sourceRef: null, method: null, capturedBy: null, capturedAt: null,
    inputRefs: [], ruleId: null, ruleVersion: null, inheritedFrom: null,
    unresolvedReason: "Synthetic unused field.", nextAction: "No action for this test.", evidenceRefs: [], confidence: "NOT_ASSESSED",
  });
  return {
    id: `bom-row-${value ?? "empty"}`,
    componentRef: refField(value, overrides),
    placement: empty("bom.placement", "STYLE_CONTROL"),
    materialId: "10000000-0000-4000-8000-000000000002",
    quantity: empty("bom.quantity", "MATERIAL_PROPERTY"),
    quantityBasis: empty("bom.quantityBasis", "MATERIAL_PROPERTY"),
    requiredness: empty("bom.requiredness", "STYLE_CONTROL"),
  };
}

function operationValue<T>(value: T): TechPackOperationSourcedValue<T> {
  return { status: "USER_DECISION", value, rationale: "Synthetic reference fixture." };
}

function operation(
  componentRefs: TechPackOperation["componentRefs"],
  seamRefs: TechPackOperation["seamRefs"],
  id = "join-seam",
): TechPackOperation {
  return {
    id,
    name: operationValue("Synthetic operation"),
    sequence: operationValue(1),
    componentRefs,
    seamRefs,
    facts: [],
  };
}

function record(bomRows: readonly TechPackBomRow[] = [], recipeId = "tee") {
  return { ...createEmptyTechPackRecord(STYLE_ID, recipeId, NOW, NOW), bomRows };
}

function operationSet(operations: readonly TechPackOperation[], recipeId = "tee"): TechPackOperationRecordSet {
  return { schemaVersion: 2, recipeId: recipeId as TechPackOperationRecordSet["recipeId"], operations };
}

function deriveSample(stitches: readonly unknown[] = [SIDE_STITCH], roles: Record<string, Piece> = { front: FRONT, back: BACK }) {
  const sample = block(roles, stitches as Stitch[]);
  return deriveTechPackPatternInventory({ name: "tee", draft: () => sample }, STANDARD_M, {});
}

describe("T03 pattern reference inventory and reconciliation", () => {
  it("derives deterministic IDs for all eleven registered recipe drafts", () => {
    for (const recipe of GARMENTS) {
      const actual = recipe.draft(STANDARD_M, {});
      const inventory = deriveTechPackPatternInventory(recipe, STANDARD_M, {});
      const again = deriveTechPackPatternInventory(recipe, STANDARD_M, {});
      expect(inventory.available).toBe(true);
      expect(inventory.components.map((component) => component.role)).toEqual(Object.keys(actual.roles));
      expect(inventory.components.every((component) => component.valid && /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(component.id))).toBe(true);
      expect(inventory.seams).toHaveLength(actual.stitches.length);
      expect(inventory.seams.every((seam) => seam.valid && /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(seam.id))).toBe(true);
      expect(inventory.components.map((component) => component.id)).toEqual(again.components.map((component) => component.id));
      expect(inventory.seams.map((seam) => seam.id)).toEqual(again.seams.map((seam) => seam.id));
    }
  });

  it("normalizes camel-cased roles, records full edge/mark topology and detects collisions", () => {
    const collision = deriveSample([SIDE_STITCH], { frontLeft: FRONT, "front-left": BACK, "$bad role": FRONT });
    expect(collision.components.map((component) => component.id)).toEqual(["front-left", "front-left", "bad-role"]);
    expect(collision.components.slice(0, 2).every((component) => !component.valid)).toBe(true);
    expect(collision.findings.filter((item) => item.code === "DUPLICATE_COMPONENT_ID")).toHaveLength(2);
    expect(collision.seams[0]?.topology).toContain("back.shoulder (reversed)");
    const markStitch: Stitch = { label: "Dart Join", a: iface(markRef("front", "dart", "left")), b: iface(edgeRef("back", "shoulder")) };
    const markInventory = deriveSample([markStitch]);
    expect(markInventory.seams[0]?.id).toMatch(/^seam-dart-join-/);
    expect(markInventory.seams[0]?.topology).toContain("front.dart (left)");
    const malformedMark = deriveSample([{ ...markStitch, a: { edges: [{ piece: "front", mark: "dart" }] } }]);
    expect(malformedMark.seams[0]?.topology).toContain("side unknown");
    const differentTopology = deriveSample([{ ...SIDE_STITCH, a: iface(edgeRef("front", "shoulder", true)) }]);
    expect(differentTopology.seams[0]?.id).not.toBe(deriveSample().seams[0]?.id);
    const roleInventory = deriveSample([], { frontLeft: FRONT });
    const exactRoleBom = reconcileTechPackReferences(record([bomRow("frontLeft")]), roleInventory, null);
    expect(exactRoleBom.findings[0]?.status).toBe("MATCHED");
  });

  it("reports malformed component/seam IDs, duplicate seams and invalid topology", () => {
    const duplicate = deriveSample([SIDE_STITCH, SIDE_STITCH], { "!!!": FRONT });
    expect(duplicate.findings.some((item) => item.code === "MALFORMED_COMPONENT_ID")).toBe(true);
    expect(duplicate.findings.filter((item) => item.code === "DUPLICATE_SEAM_ID")).toHaveLength(2);
    const invalidStitches: unknown[] = [
      { ...SIDE_STITCH, label: "" },
      { ...SIDE_STITCH, a: iface(edgeRef("missing", "shoulder")) },
      { ...SIDE_STITCH, a: iface(edgeRef("front", "missing-edge")) },
      { ...SIDE_STITCH, a: iface(markRef("front", "missing-mark", "right")) },
      { ...SIDE_STITCH, a: { edges: [] } },
      { label: "Malformed refs", a: { edges: [{ piece: "front" }] }, b: { edges: [{}] } },
      { label: "Nullish refs", a: { edges: [null, { piece: null, edge: null }, { piece: null, mark: null }] }, b: { edges: [] } },
      { label: "Missing interface", a: null, b: { edges: [] } },
      null,
    ];
    const invalid = deriveSample(invalidStitches);
    expect(invalid.findings.some((item) => item.code === "MALFORMED_SEAM_ID")).toBe(true);
    expect(invalid.findings.filter((item) => item.code === "INVALID_SEAM_TOPOLOGY")).toHaveLength(8);
    expect(invalid.seams.every((seam) => !seam.valid)).toBe(true);
    const malformedPiece = deriveSample([], { front: { name: 42 } as unknown as Piece });
    expect(malformedPiece.components[0]?.pieceName).toBe("");
    const malformedRole = deriveSample([SIDE_STITCH], {
      front: { name: "Malformed panel", onFold: false } as unknown as Piece,
      back: BACK,
    });
    expect(malformedRole.findings.some((item) => item.code === "INVALID_SEAM_TOPOLOGY")).toBe(true);
  });

  it("keeps unsupported, failed, and malformed recipe draft paths visible", () => {
    expect(deriveTechPackPatternInventory(null, STANDARD_M, {}).findings[0]?.status).toBe("UNSUPPORTED");
    const ordinaryError = deriveTechPackPatternInventory({ name: "tee", draft: () => { throw new Error("bad draft"); } }, STANDARD_M, {});
    expect(ordinaryError.findings[0]?.message).toContain("bad draft");
    const unknownError = deriveTechPackPatternInventory({ name: "tee", draft: () => { throw "bad draft"; } }, STANDARD_M, {});
    expect(unknownError.findings[0]?.message).toContain("unknown error");
    const malformed = deriveTechPackPatternInventory({ name: "tee", draft: () => ({ roles: null, stitches: [] } as unknown as Block) }, STANDARD_M, {});
    expect(malformed.findings[0]?.status).toBe("DRAFT_ERROR");
  });

  it("matches explicit BOM, operation component, and seam references without changing their origin", () => {
    const inventory = deriveSample();
    const operationData = operationSet([operation(
      operationValue(["front"]),
      operationValue([inventory.seams[0]!.id]),
    )]);
    const reconciled = reconcileTechPackReferences(record([bomRow("front")]), inventory, operationData);
    expect(reconciled.findings.map((item) => item.status)).toEqual(["MATCHED", "MATCHED", "MATCHED"]);
    expect(reconciled.findings.every((item) => item.nextAction.length > 0)).toBe(true);
    const htmlData = operationData.operations[0]!.componentRefs;
    expect(htmlData.status).toBe("USER_DECISION");
    expect(reconciled.findings.some((item) => item.message.includes("does not promote"))).toBe(false);
  });

  it("distinguishes unresolved, invalid, conflicting, unknown and missing BOM/component references", () => {
    const inventory = deriveSample();
    const conflictField = refField("front", { evidenceStatus: "CONFLICT", unresolvedReason: "Two sources disagree.", nextAction: "Resolve the conflict." });
    const invalidField = refField("front", { validationStatus: "INVALID", unresolvedReason: "Bad value.", nextAction: "Correct it." });
    const operationData = operationSet([
      operation(operationValue(["back", "SLEEVE", "unknown"]), operationValue(["unknown-seam"])),
      operation({ status: "UNRESOLVED", value: null, unresolvedReason: "Still unknown.", nextAction: "Inspect the pattern." }, { status: "CONFLICT", value: null, sourceRefs: [], unresolvedReason: "Disputed seam.", nextAction: "Resolve it." }, "unresolved-op"),
      operation(operationValue([]), operationValue([]), "empty-op"),
    ]);
    const reconciled = reconcileTechPackReferences(record([
      bomRow(null), bomRow("front", invalidField), bomRow("front", conflictField), bomRow("sleeve"),
    ]), inventory, operationData);
    const statuses = reconciled.findings.map((item) => item.status);
    expect(statuses).toContain("UNRESOLVED");
    expect(statuses).toContain("INVALID");
    expect(statuses).toContain("CONFLICT");
    expect(statuses).toContain("UNKNOWN");
    expect(statuses).toContain("MISSING");
    expect(reconciled.findings.some((item) => item.code === "OPERATION_COMPONENT_BOM_MISSING")).toBe(true);
    expect(reconciled.findings.some((item) => item.code === "OPERATION_COMPONENT_INVALID")).toBe(true);
    expect(reconciled.findings.some((item) => item.code === "OPERATION_REFERENCE_MISSING")).toBe(true);
    expect(reconciled.findings.some((item) => item.code === "OPERATION_REFERENCE_UNRESOLVED")).toBe(true);
    expect(reconciled.findings.some((item) => item.code === "OPERATION_REFERENCE_CONFLICT")).toBe(true);
    const unresolvedFallbacks = reconcileTechPackReferences(record([
      bomRow(null, { unresolvedReason: null, nextAction: null }),
      bomRow(null, { provenance: "USER_CAPTURED", unresolvedReason: null, nextAction: null }),
    ]), inventory, null);
    expect(unresolvedFallbacks.findings[0]?.message).toContain("no resolved pattern component");
    expect(unresolvedFallbacks.findings[0]?.nextAction).toContain("Enter a pattern component ID");
  });

  it("rejects normalized-role ambiguity and malformed or invalid seam targets", () => {
    const duplicateInventory = deriveSample([SIDE_STITCH], { frontLeft: FRONT, "front-left": BACK });
    const duplicate = reconcileTechPackReferences(record([bomRow("front-left")]), duplicateInventory,
      operationSet([operation(operationValue(["front-left"]), operationValue(["not-a-seam"]))]));
    expect(duplicate.findings.some((item) => item.status === "CONFLICT" && item.code.includes("AMBIGUOUS"))).toBe(true);
    const malformedInventory = deriveSample([{ ...SIDE_STITCH, a: iface(edgeRef("missing", "shoulder")) }]);
    const invalidSeamId = malformedInventory.seams[0]!.id;
    const invalid = reconcileTechPackReferences(record(), malformedInventory,
      operationSet([operation(operationValue(["front"]), operationValue([invalidSeamId]))]));
    expect(invalid.findings.some((item) => item.code === "OPERATION_SEAM_PATTERN_INVALID")).toBe(true);
    const malformedRefs = reconcileTechPackReferences(record(), deriveSample(), operationSet([
      operation(operationValue(["Bad-ID", "buttonPlacket"]), operationValue(["Bad-ID"])),
    ]));
    expect(malformedRefs.findings.filter((item) => item.code === "OPERATION_COMPONENT_INVALID")).toHaveLength(2);
    expect(malformedRefs.findings.some((item) => item.code === "OPERATION_SEAM_INVALID")).toBe(true);
    const malformedComponentInventory = deriveSample([SIDE_STITCH], { "!!!": FRONT });
    const invalidBomLink = reconcileTechPackReferences(record([bomRow("!!!")]), malformedComponentInventory, null);
    expect(invalidBomLink.findings.some((item) => item.code === "BOM_COMPONENT_PATTERN_INVALID")).toBe(true);
    const malformedBomValues = reconcileTechPackReferences(record([
      bomRow("front", { value: "   " }),
      bomRow("front", { value: 99 as unknown as string }),
      bomRow("front", { evidenceStatus: "CONFLICT", validationStatus: "INVALID", unresolvedReason: null, nextAction: null }),
      bomRow("front", { validationStatus: "INVALID", unresolvedReason: null, nextAction: null }),
      bomRow(null, { evidenceStatus: "CONFLICT", unresolvedReason: "Conflicting with a source.", nextAction: "Resolve both references." }),
    ]), deriveSample(), null);
    expect(malformedBomValues.findings.filter((item) => item.status === "INVALID")).toHaveLength(3);
    expect(malformedBomValues.findings.find((item) => item.message.includes("Conflicting with a source"))?.status).toBe("CONFLICT");
    expect(malformedBomValues.findings.find((item) => item.code === "BOM_COMPONENT_CONFLICT")?.message)
      .toContain("marked as conflicting");
    expect(malformedBomValues.findings.find((item) => item.message.includes("marked invalid"))?.message)
      .toContain("marked invalid");
    const duplicateSeams = deriveSample([SIDE_STITCH, SIDE_STITCH]);
    const seamAmbiguity = reconcileTechPackReferences(record(), duplicateSeams,
      operationSet([operation(operationValue(["front"]), operationValue([duplicateSeams.seams[0]!.id]))]));
    expect(seamAmbiguity.findings.some((item) => item.code === "OPERATION_SEAM_AMBIGUOUS")).toBe(true);
  });

  it("reports record recipe mismatches and stops reconciliation when the pattern is unavailable", () => {
    const inventory = deriveSample();
    const mismatch = reconcileTechPackReferences(record([], "trouser"), inventory, operationSet([]));
    expect(mismatch.findings[0]?.code).toBe("TECH_PACK_RECIPE_MISMATCH");
    const operationMismatch = reconcileTechPackReferences(record(), inventory, operationSet([], "skirt"));
    expect(operationMismatch.findings[0]?.code).toBe("OPERATION_RECIPE_MISMATCH");
    const unavailable = deriveTechPackPatternInventory(null, STANDARD_M, {});
    const unavailableResult = reconcileTechPackReferences(record([bomRow("front")]), unavailable, operationSet([]));
    expect(unavailableResult.findings).toHaveLength(1);
  });

  it("builds a reconciliation directly and allows no T03 data while preserving T01 findings", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const built = buildTechPackReferenceReconciliation(record([bomRow("front")]), recipe, STANDARD_M, {}, null);
    expect(built.inventory.available).toBe(true);
    expect(built.findings.some((item) => item.code === "BOM_COMPONENT_MATCHED")).toBe(true);
    expect(built.findings.some((item) => item.code.startsWith("OPERATION_"))).toBe(false);
  });
});
