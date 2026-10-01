import { describe, expect, it } from "vitest";
import {
  TECHNICAL_FLAT_SCHEMA_VERSION,
  validateTechnicalFlat,
  type FlatPathPrimitive,
  type TechnicalFlatPrimitive,
  type TechnicalFlatView,
} from "./technical-flat";

const source = { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:front", revisionId: "rev-1" };
const path = (id = "front-outline"): FlatPathPrimitive => ({
  kind: "path", id, layer: "GARMENT_SILHOUETTE", feature: "silhouette", source,
  commands: [
    { op: "move", point: { x: 0, y: 0 } },
    { op: "line", point: { x: 10, y: 0 } },
    { op: "cubic", control1: { x: 12, y: 2 }, control2: { x: 12, y: 8 }, point: { x: 10, y: 10 } },
    { op: "close" },
  ],
});

const view = (primitives: readonly TechnicalFlatPrimitive[] = [path()]): TechnicalFlatView => ({
  schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION,
  viewId: "tee:front",
  revisionId: "rev-1",
  recipeId: "tee",
  kind: "FRONT_FLAT",
  units: "cm",
  primitives,
  notices: [],
});

const codes = (candidate: TechnicalFlatView) => validateTechnicalFlat(candidate).map((issue) => issue.code);

describe("validateTechnicalFlat", () => {
  it("accepts versioned geometry, artwork and an anchored callout in one revision", () => {
    const primitives: TechnicalFlatPrimitive[] = [
      path(),
      { kind: "circle", id: "button-1", layer: "CLOSURE", feature: "closure", source,
        center: { x: 3, y: 4 }, radius: 0.25 },
      { kind: "mark", id: "button-point", layer: "CLOSURE", feature: "closure", source,
        markKind: "button", markName: "button-1", at: { x: 3, y: 4 }, label: "Top button" },
      { kind: "text", id: "label", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 5, y: 8 }, text: "Front" },
      { kind: "artwork", id: "graphic", layer: "ARTWORK", feature: "artwork", source,
        artworkKind: "print", placementId: "placement-1", assetId: "asset-1", sourceName: "Print asset", targetRoleId: "front",
        widthCm: 2, heightCm: 3, transform: { dx: 0, dy: 0, scale: 1, rotationDegrees: 0 }, zOrder: 0 },
      { kind: "callout", id: "pom-chest", layer: "CALLOUT", feature: "pom", source,
        text: "Chest width", anchor: { primitiveId: "front-outline", point: { x: 5, y: 2 } },
        labelAt: { x: 14, y: 2 } },
    ];
    expect(validateTechnicalFlat({ ...view(primitives), kind: "BACK_FLAT", notices: [
      { id: "topstitch-source-gap", feature: "topstitch", reason: "SOURCE_NOT_REPRESENTED", message: "Topstitch source is not represented." },
    ] })).toEqual([]);
  });

  it("validates a POM callout's exact represented source edge", () => {
    const edgeSource = { ...source, sourceId: "pattern:tee:role:front" };
    const outline = { ...path(), source: edgeSource, sourceEdgeIds: ["pattern:tee:role:front:edge:side"] };
    const validCallout: TechnicalFlatPrimitive = { kind: "callout", id: "pom-side", layer: "CALLOUT", feature: "pom",
      source, text: "Chest", anchor: { primitiveId: "front-outline", point: { x: 0, y: 0 },
        sourceEntityId: "pattern:tee:role:front:edge:side" }, labelAt: { x: 15, y: 0 } };
    expect(validateTechnicalFlat(view([outline, validCallout]))).toEqual([]);
    const wrongEdgeTarget = { ...outline, sourceEdgeIds: ["pattern:tee:role:front:edge:neck"] };
    expect(validateTechnicalFlat(view([wrongEdgeTarget, validCallout]))).toContainEqual(expect.objectContaining({
      code: "UNRESOLVED_CALLOUT_TARGET", entityId: "pom-side",
    }));
    const wrongEdge = { ...validCallout, anchor: { ...validCallout.anchor,
      sourceEntityId: "pattern:tee:role:front:edge:neck" } };
    expect(validateTechnicalFlat(view([outline, wrongEdge]))).toContainEqual(expect.objectContaining({
      code: "UNRESOLVED_CALLOUT_TARGET", entityId: "pom-side",
      message: expect.stringContaining("source entity must be represented"),
    }));
    const wrongRole = { ...validCallout, anchor: { ...validCallout.anchor,
      sourceEntityId: "pattern:tee:role:back:edge:side" } };
    expect(validateTechnicalFlat(view([outline, wrongRole]))).toContainEqual(expect.objectContaining({
      code: "UNRESOLVED_CALLOUT_TARGET", entityId: "pom-side",
    }));
    const unlistedEdges = { ...outline, sourceEdgeIds: undefined };
    expect(validateTechnicalFlat(view([unlistedEdges, validCallout]))).toEqual([]);
    const nonPathRoleTarget: TechnicalFlatPrimitive = { kind: "mark", id: "front-source-mark", layer: "CLOSURE",
      feature: "closure", source: edgeSource, markKind: "button", markName: "source-mark", at: { x: 0, y: 0 } };
    expect(validateTechnicalFlat(view([nonPathRoleTarget, validCallout]))).toContainEqual(expect.objectContaining({
      code: "UNRESOLVED_CALLOUT_TARGET", entityId: "pom-side",
    }));
    const sourceMark: TechnicalFlatPrimitive = { kind: "mark", id: "front-button", layer: "CLOSURE", feature: "closure",
      source: { ...source, sourceId: "pattern:tee:mark:buttonPlacket:button-1" }, markKind: "button",
      markName: "button-1", at: { x: 2, y: 2 } };
    const markCallout: TechnicalFlatPrimitive = { ...validCallout, id: "pom-button",
      anchor: { primitiveId: "front-button", point: { x: 2, y: 2 },
        sourceEntityId: "pattern:tee:mark:buttonPlacket:button-1" } };
    expect(validateTechnicalFlat(view([sourceMark, markCallout]))).toEqual([]);
  });

  it("allows hidden garment edges only as exact annotation dimension references", () => {
    const sourceEdge = "pattern:polo:role:upperCollar:edge:centerBack";
    const upperCollar: FlatPathPrimitive = { ...path("upper-collar"), source: { ...source,
      sourceId: "pattern:polo:role:upperCollar" }, sourceEdgeIds: ["pattern:polo:role:upperCollar:edge:frontTip"] };
    const dimension: TechnicalFlatPrimitive = { kind: "callout", id: "leaf-pom", layer: "ANNOTATION", feature: "pom",
      source: { ...source, sourceId: "pom:polo:finished-pointed-collar-leaf" }, text: "Finished pointed collar leaf: 5.0 cm",
      anchor: { primitiveId: "upper-collar", point: { x: 0, y: 3 }, sourceEntityId: sourceEdge }, labelAt: { x: 4, y: 4 },
      dimensionReferences: { kind: "edge-length", references: [
        { point: { x: 0, y: 0 }, sourceEntityId: sourceEdge },
        { point: { x: 0, y: 5 }, sourceEntityId: sourceEdge },
      ] } };
    expect(validateTechnicalFlat({ ...view([upperCollar, dimension]), recipeId: "polo" })).toEqual([]);
    const wrongRecipe = { ...dimension, dimensionReferences: { ...dimension.dimensionReferences!, references: [
      { point: { x: 0, y: 0 }, sourceEntityId: "pattern:tee:role:upperCollar:edge:centerBack" },
      { point: { x: 0, y: 5 }, sourceEntityId: sourceEdge },
    ] } };
    expect(validateTechnicalFlat({ ...view([upperCollar, wrongRecipe]), recipeId: "polo" })).toContainEqual(
      expect.objectContaining({ code: "UNRESOLVED_CALLOUT_TARGET", entityId: "leaf-pom" }));
    const wrongTarget = { ...dimension, dimensionReferences: { ...dimension.dimensionReferences!, references: [
      { point: { x: 0, y: 0 }, sourceEntityId: sourceEdge },
      { point: { x: 0, y: 5 }, sourceEntityId: sourceEdge },
    ] }, anchor: { ...dimension.anchor, sourceEntityId: "pattern:polo:role:upperCollar:edge:missing" } };
    expect(validateTechnicalFlat({ ...view([upperCollar, wrongTarget]), recipeId: "polo" })).toContainEqual(
      expect.objectContaining({ code: "UNRESOLVED_CALLOUT_TARGET", entityId: "leaf-pom" }));
    const malformed = { ...dimension, dimensionReferences: { kind: "vertical-levels", references: [] } } as unknown as TechnicalFlatPrimitive;
    expect(validateTechnicalFlat({ ...view([upperCollar, malformed]), recipeId: "polo" })).toContainEqual(
      expect.objectContaining({ code: "INVALID_GEOMETRY", entityId: "leaf-pom" }));
  });

  it("rejects invalid view identity, version, view kind and units", () => {
    const invalid = {
      ...view(), viewId: " ", revisionId: "", recipeId: " ", schemaVersion: 2,
      kind: "SIDE_VIEW", units: "in",
    } as unknown as TechnicalFlatView;
    expect(codes(invalid)).toEqual([
      "INVALID_VIEW_ID", "INVALID_REVISION_ID", "INVALID_RECIPE_ID", "INVALID_SCHEMA_VERSION",
      "INVALID_VIEW_KIND", "INVALID_UNITS", "REVISION_MISMATCH",
    ]);
  });

  it("rejects missing, duplicate, and revision-mismatched primitive identities", () => {
    const missing = { ...path(" "), source: { ...source, sourceId: " " } } as TechnicalFlatPrimitive;
    const noSource = { ...path("no-source"), source: undefined } as unknown as TechnicalFlatPrimitive;
    const unknownSource = { ...path("unknown-source"), source: { ...source, sourceClass: "UNKNOWN" } } as unknown as TechnicalFlatPrimitive;
    const mismatch = { ...path("reused-id"), source: { ...source, revisionId: "rev-2" } } as TechnicalFlatPrimitive;
    const duplicate = path("reused-id");
    expect(codes(view([missing, noSource, unknownSource, mismatch, duplicate]))).toEqual([
      "INVALID_ENTITY_ID", "INVALID_SOURCE", "INVALID_SOURCE", "INVALID_SOURCE",
      "REVISION_MISMATCH", "DUPLICATE_ENTITY_ID",
    ]);
  });

  it("validates path command order and finite line and curve coordinates", () => {
    const invalidPaths: TechnicalFlatPrimitive[] = [
      { ...path("too-short"), commands: [{ op: "move", point: { x: 0, y: 0 } }] },
      { ...path("missing-move"), commands: [{ op: "line", point: { x: 1, y: 1 } }, { op: "close" }] },
      { ...path("double-move"), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "move", point: { x: 1, y: 1 } },
      ] },
      { ...path("draw-after-close"), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "close" }, { op: "line", point: { x: 1, y: 1 } },
      ] },
      { ...path("close-after-close"), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "close" }, { op: "close" },
      ] },
      { ...path("bad-line"), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: Number.NaN, y: 1 } },
      ] },
      { ...path("bad-move"), commands: [
        { op: "move", point: { x: Number.NaN, y: 0 } }, { op: "line", point: { x: 1, y: 1 } },
      ] },
      { ...path("bad-curve-control"), commands: [
        { op: "move", point: { x: 0, y: 0 } },
        { op: "cubic", control1: { x: Number.POSITIVE_INFINITY, y: 1 }, control2: { x: 1, y: 2 }, point: { x: 2, y: 3 } },
      ] },
      { ...path("bad-second-curve-control"), commands: [
        { op: "move", point: { x: 0, y: 0 } },
        { op: "cubic", control1: { x: 1, y: 1 }, control2: { x: Number.POSITIVE_INFINITY, y: 2 }, point: { x: 2, y: 3 } },
      ] },
      { ...path("bad-curve-end"), commands: [
        { op: "move", point: { x: 0, y: 0 } },
        { op: "cubic", control1: { x: 1, y: 1 }, control2: { x: 1, y: 2 }, point: { x: 2, y: Number.NaN } },
      ] },
    ];
    expect(codes(view(invalidPaths))).toEqual(Array(invalidPaths.length).fill("INVALID_GEOMETRY"));
    const multiSubpath: TechnicalFlatPrimitive = { ...path("multi"), commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 0 } }, { op: "close" },
      { op: "move", point: { x: 4, y: 4 } }, { op: "line", point: { x: 5, y: 5 } },
    ] };
    expect(validateTechnicalFlat(view([multiSubpath]))).toEqual([]);
    const independentOpenEdges: TechnicalFlatPrimitive = { ...path("open-edges"), commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 0 } },
      { op: "move", point: { x: 8, y: 0 } },
      { op: "cubic", control1: { x: 8, y: 1 }, control2: { x: 9, y: 1 }, point: { x: 9, y: 0 } },
    ] };
    expect(validateTechnicalFlat(view([independentOpenEdges]))).toEqual([]);
    const markedLine: FlatPathPrimitive = { ...path("marked-line"), patternMark: {
      kind: "foldLine", name: "placket-fold", label: "Fold to inside", labelRole: "instruction",
    } };
    expect(validateTechnicalFlat(view([markedLine]))).toEqual([]);
    expect(validateTechnicalFlat(view([{ ...path("colorway-boundary"), colorwayBoundaryOnly: true }]))).toEqual([]);
    expect(codes(view([{ ...path("invalid-colorway-boundary"), colorwayBoundaryOnly: "yes" as unknown as boolean }]))).toEqual(["INVALID_GEOMETRY"]);
    expect(codes(view([{ ...markedLine, patternMark: { ...markedLine.patternMark!, name: " " } }]))).toEqual(["INVALID_GEOMETRY"]);
    expect(validateTechnicalFlat(view([{ ...path("projected"), sourceEdgeIds: ["pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:shoulder"] }]))).toEqual([]);
    expect(codes(view([{ ...path("empty-projection"), sourceEdgeIds: [] }]))).toEqual(["INVALID_GEOMETRY"]);
    expect(codes(view([{ ...path("bad-projection"), sourceEdgeIds: ["pattern:front", " "] }]))).toEqual(["INVALID_GEOMETRY"]);
    expect(codes(view([{ ...path("duplicate-projection"), sourceEdgeIds: ["pattern:front", "pattern:front"] }]))).toEqual(["INVALID_GEOMETRY"]);
  });

  it("validates circles and labels", () => {
    const badCircle: TechnicalFlatPrimitive = { kind: "circle", id: "button", layer: "CLOSURE", feature: "closure", source,
      center: { x: Number.NaN, y: 0 }, radius: 0 };
    const badText: TechnicalFlatPrimitive = { kind: "text", id: "empty-label", layer: "ANNOTATION", feature: "annotation", source,
      at: { x: 1, y: Number.POSITIVE_INFINITY }, text: " " };
    expect(codes(view([badCircle, badText]))).toEqual([
      "INVALID_GEOMETRY", "INVALID_GEOMETRY", "INVALID_TEXT",
    ]);
  });

  it("validates exact-size-free source point marks", () => {
    const valid: TechnicalFlatPrimitive = { kind: "mark", id: "button-point", layer: "CLOSURE", feature: "closure", source,
      markKind: "buttonhole", markName: "neck-buttonhole", at: { x: 2, y: 3 } };
    expect(validateTechnicalFlat(view([valid]))).toEqual([]);
    const invalid: TechnicalFlatPrimitive[] = [
      { ...valid, id: "bad-point", at: { x: Number.NaN, y: 1 } },
      { ...valid, id: "bad-name", markName: " " },
      { ...valid, id: "bad-kind", markKind: "unknown" as "buttonhole" },
      { ...valid, id: "bad-label", label: " " },
      { ...valid, id: "bad-label-role", labelRole: "caption" as "label" },
    ];
    expect(codes(view(invalid))).toEqual(Array(invalid.length).fill("INVALID_GEOMETRY"));
  });

  it("requires bounded artwork metadata and finite transforms", () => {
    const artwork: TechnicalFlatPrimitive = { kind: "artwork", id: "bad-art", layer: "ARTWORK", feature: "artwork", source,
      artworkKind: "patch", placementId: "placement", assetId: "asset", sourceName: "Patch", targetRoleId: "front",
      widthCm: 2, heightCm: 3, transform: { dx: 1, dy: -1, scale: 1.2, rotationDegrees: 30 }, zOrder: 1 };
    const invalid: TechnicalFlatPrimitive[] = [
      { ...artwork, placementId: " " },
      { ...artwork, assetId: " " },
      { ...artwork, sourceName: " " },
      { ...artwork, targetRoleId: " " },
      { ...artwork, widthCm: 0 },
      { ...artwork, widthCm: Number.NaN },
      { ...artwork, heightCm: 0 },
      { ...artwork, heightCm: Number.NaN },
      { ...artwork, transform: { ...artwork.transform, dx: Number.NaN } },
      { ...artwork, transform: { ...artwork.transform, dy: Number.POSITIVE_INFINITY } },
      { ...artwork, transform: { ...artwork.transform, scale: 0 } },
      { ...artwork, transform: { ...artwork.transform, scale: Number.NaN } },
      { ...artwork, transform: { ...artwork.transform, rotationDegrees: Number.NaN } },
      { ...artwork, zOrder: 0.5 },
    ];
    const distinctInvalid = invalid.map((primitive, index) => ({ ...primitive, id: `bad-art-${index}` }));
    expect(codes(view(distinctInvalid))).toEqual(Array(invalid.length).fill("INVALID_ARTWORK"));
    const noAsset = { ...artwork, id: "no-asset", assetId: undefined };
    expect(validateTechnicalFlat(view([noAsset]))).toEqual([]);
  });

  it("requires callouts to have visible text, finite positions and geometry targets", () => {
    const noTarget: TechnicalFlatPrimitive = { kind: "callout", id: "pom", layer: "CALLOUT", feature: "pom", source,
      text: "Chest", anchor: { primitiveId: "missing", point: { x: 1, y: 1 } }, labelAt: { x: 2, y: 2 } };
    expect(codes(view([noTarget]))).toEqual(["UNRESOLVED_CALLOUT_TARGET"]);
    const invalid: TechnicalFlatPrimitive = { ...noTarget, id: "invalid-pom", text: " ", anchor: {
      primitiveId: "front-outline", point: { x: Number.NaN, y: 1 },
    }, labelAt: { x: 2, y: Number.NaN } };
    expect(codes(view([path(), invalid]))).toEqual(["INVALID_GEOMETRY"]);
    const pointMark: TechnicalFlatPrimitive = { kind: "mark", id: "waistband-mark", layer: "ANNOTATION",
      feature: "annotation", source, markKind: "placementPoint", markName: "centerBack", at: { x: 1, y: 1 } };
    const markCallout = { ...noTarget, id: "mark-pom", anchor: { primitiveId: pointMark.id, point: { x: 1, y: 1 } } };
    expect(validateTechnicalFlat(view([pointMark, markCallout]))).toEqual([]);
  });

  it("requires stable unique notice identities and actionable messages", () => {
    const candidate = { ...view(), notices: [
      { id: "gap", feature: "topstitch", reason: "SOURCE_NOT_REPRESENTED", message: " " },
      { id: "gap", feature: "pleat", reason: "VIEW_MAPPING_MISSING", message: "Map pleat." },
      { id: "", feature: "closure", reason: "SOURCE_REFERENCE_MISSING", message: "Add source." },
    ] } as unknown as TechnicalFlatView;
    expect(codes(candidate)).toEqual(["INVALID_NOTICE", "INVALID_NOTICE", "INVALID_NOTICE"]);
  });
});
