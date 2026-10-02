/** Versioned semantic model for assembled two-dimensional garment flats.
 *
 * Coordinates are pattern-space centimetres. The model intentionally keeps
 * source identity and the design revision next to every drawn entity so a
 * technical flat cannot silently combine geometry from different drafts.
 */

export const TECHNICAL_FLAT_SCHEMA_VERSION = 1 as const;

export type TechnicalFlatViewKind = "FRONT_FLAT" | "BACK_FLAT";

export type TechnicalFlatSourceClass =
  | "PATTERN_DERIVED"
  | "PARAMETRIC_TECHNICAL"
  | "USER_REFERENCE"
  | "SCHEMATIC"
  | "3D_SIMULATION";

/** Paint order, from garment base to labels, shared by SVG and raster review. */
export const TECHNICAL_FLAT_LAYER_ORDER = [
  "GARMENT_SILHOUETTE",
  "ARTWORK",
  "SEAM",
  "CONSTRUCTION",
  "DART",
  "PLEAT",
  "CLOSURE",
  "TOPSTITCH",
  "CALLOUT",
  "ANNOTATION",
] as const;

export type TechnicalFlatLayer = typeof TECHNICAL_FLAT_LAYER_ORDER[number];

export type TechnicalFlatFeature =
  | "silhouette"
  | "seam"
  | "topstitch"
  | "closure"
  | "pocket"
  | "dart"
  | "pleat"
  | "artwork"
  | "pom"
  | "annotation";

export type TechnicalFlatNoticeReason =
  | "SOURCE_NOT_REPRESENTED"
  | "SOURCE_REFERENCE_MISSING"
  | "OPTION_TOPOLOGY_MISMATCH"
  | "VIEW_MAPPING_MISSING"
  | "HIDDEN_BY_VIEW";

export interface TechnicalFlatSource {
  readonly sourceClass: TechnicalFlatSourceClass;
  readonly sourceId: string;
  readonly revisionId: string;
}

export interface FlatPoint {
  readonly x: number;
  readonly y: number;
}

export type FlatPathCommand =
  | { readonly op: "move"; readonly point: FlatPoint }
  | { readonly op: "line"; readonly point: FlatPoint }
  | {
      readonly op: "cubic";
      readonly control1: FlatPoint;
      readonly control2: FlatPoint;
      readonly point: FlatPoint;
    }
  | { readonly op: "close" };

interface FlatPrimitiveBase {
  /** Stable semantic identity. It must not be generated from the current label or coordinates. */
  readonly id: string;
  readonly layer: TechnicalFlatLayer;
  readonly feature: TechnicalFlatFeature;
  readonly source: TechnicalFlatSource;
}

export interface FlatPathPrimitive extends FlatPrimitiveBase {
  readonly kind: "path";
  readonly commands: readonly FlatPathCommand[];
  /** Exact outline-edge sources for a projected multi-edge path, in subpath order. */
  readonly sourceEdgeIds?: readonly string[];
  /** Source edges at the two endpoints of a view-only closure segment. */
  readonly projectionEndpointEdgeIds?: readonly [string, string];
  /** Internal source-bound contour closure used only to paint the associated colorway area. */
  readonly colorwayBoundaryOnly?: boolean;
  readonly patternMark?: {
    readonly kind: "cutLine" | "foldLine" | "placementLine";
    readonly name: string;
    readonly label?: string;
    readonly labelRole?: "label" | "instruction";
  };
}

export interface FlatCirclePrimitive extends FlatPrimitiveBase {
  readonly kind: "circle";
  readonly center: FlatPoint;
  readonly radius: number;
}

/** A source point mark has no authored glyph size. Keeping it semantic lets a
 * renderer choose a screen-space symbol without inventing garment dimensions. */
export interface FlatPointMarkPrimitive extends FlatPrimitiveBase {
  readonly kind: "mark";
  readonly markKind: "button" | "buttonhole" | "placementPoint";
  readonly markName: string;
  readonly at: FlatPoint;
  readonly label?: string;
  readonly labelRole?: "label" | "instruction";
}

export interface FlatTextPrimitive extends FlatPrimitiveBase {
  readonly kind: "text";
  readonly at: FlatPoint;
  readonly text: string;
}

export interface FlatArtworkPrimitive extends FlatPrimitiveBase {
  readonly kind: "artwork";
  readonly artworkKind: "print" | "patch" | "color-block";
  readonly placementId: string;
  readonly assetId?: string;
  readonly sourceName: string;
  readonly targetRoleId: string;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly transform: {
    readonly dx: number;
    readonly dy: number;
    readonly scale: number;
    readonly rotationDegrees: number;
  };
  readonly zOrder: number;
}

export interface FlatCalloutPrimitive extends FlatPrimitiveBase {
  readonly kind: "callout";
  readonly text: string;
  readonly anchor: { readonly primitiveId: string; readonly point: FlatPoint; readonly sourceEntityId?: string };
  readonly labelAt: FlatPoint;
  /** Annotation-only evidence for a multi-point POM; these references never join garment contours. */
  readonly dimensionReferences?: {
    readonly kind: "edge-length" | "vertical-levels";
    readonly references: readonly { readonly point: FlatPoint; readonly sourceEntityId: string }[];
  };
}

export type TechnicalFlatPrimitive =
  | FlatPathPrimitive
  | FlatCirclePrimitive
  | FlatPointMarkPrimitive
  | FlatTextPrimitive
  | FlatArtworkPrimitive
  | FlatCalloutPrimitive;

export interface TechnicalFlatNotice {
  readonly id: string;
  readonly feature: TechnicalFlatFeature;
  readonly reason: TechnicalFlatNoticeReason;
  readonly message: string;
  readonly sourceId?: string;
}

export interface TechnicalFlatView {
  readonly schemaVersion: typeof TECHNICAL_FLAT_SCHEMA_VERSION;
  readonly viewId: string;
  readonly revisionId: string;
  readonly recipeId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly units: "cm";
  readonly primitives: readonly TechnicalFlatPrimitive[];
  readonly notices: readonly TechnicalFlatNotice[];
}

export type TechnicalFlatIssueCode =
  | "INVALID_VIEW_ID"
  | "INVALID_REVISION_ID"
  | "INVALID_RECIPE_ID"
  | "INVALID_VIEW_KIND"
  | "INVALID_SCHEMA_VERSION"
  | "INVALID_UNITS"
  | "DUPLICATE_ENTITY_ID"
  | "INVALID_ENTITY_ID"
  | "INVALID_SOURCE"
  | "REVISION_MISMATCH"
  | "INVALID_GEOMETRY"
  | "INVALID_TEXT"
  | "INVALID_ARTWORK"
  | "UNRESOLVED_CALLOUT_TARGET"
  | "INVALID_NOTICE";

export interface TechnicalFlatIssue {
  readonly code: TechnicalFlatIssueCode;
  readonly entityId?: string;
  readonly message: string;
}

const finitePoint = (point: FlatPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

const nonBlank = (value: string): boolean => value.trim().length > 0;

const SOURCE_CLASSES: ReadonlySet<string> = new Set([
  "PATTERN_DERIVED", "PARAMETRIC_TECHNICAL", "USER_REFERENCE", "SCHEMATIC", "3D_SIMULATION",
]);

function validatePath(primitive: FlatPathPrimitive): boolean {
  const first = primitive.commands[0];
  if (primitive.commands.length < 2 || first?.op !== "move" || !finitePoint(first.point)) return false;

  let hasOpenSubpath = true;
  let hasDrawnInSubpath = false;
  for (const command of primitive.commands.slice(1)) {
    if (command.op === "move") {
      if (hasOpenSubpath && !hasDrawnInSubpath) return false;
      hasOpenSubpath = true;
      hasDrawnInSubpath = false;
    } else if (command.op === "close") {
      if (!hasOpenSubpath) return false;
      hasOpenSubpath = false;
      hasDrawnInSubpath = false;
    } else {
      if (!hasOpenSubpath) return false;
      if (command.op === "line" && !finitePoint(command.point)) return false;
      if (command.op === "cubic" && !finitePoint(command.point)) return false;
      if (command.op === "cubic" && !finitePoint(command.control1)) return false;
      if (command.op === "cubic" && !finitePoint(command.control2)) return false;
      hasDrawnInSubpath = true;
    }
  }
  return true;
}

function validatePrimitive(primitive: TechnicalFlatPrimitive): TechnicalFlatIssue[] {
  const issues: TechnicalFlatIssue[] = [];
  if (!nonBlank(primitive.id)) {
    issues.push({ code: "INVALID_ENTITY_ID", message: "Primitive identity must be non-empty." });
  }
  if (!primitive.source || !SOURCE_CLASSES.has(primitive.source.sourceClass)
    || !nonBlank(primitive.source.sourceId) || !nonBlank(primitive.source.revisionId)) {
    issues.push({ code: "INVALID_SOURCE", entityId: primitive.id, message: "Every primitive needs a source identity and revision." });
  }

  switch (primitive.kind) {
    case "path":
      if (primitive.colorwayBoundaryOnly !== undefined && typeof primitive.colorwayBoundaryOnly !== "boolean") {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Colorway-only contour boundaries need an explicit boolean value." });
      }
      if (!validatePath(primitive)) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Path commands must form finite, ordered subpaths." });
      }
      if (primitive.sourceEdgeIds !== undefined && (!Array.isArray(primitive.sourceEdgeIds)
        || primitive.sourceEdgeIds.length === 0
        || primitive.sourceEdgeIds.some((sourceId) => !nonBlank(sourceId))
        || new Set(primitive.sourceEdgeIds).size !== primitive.sourceEdgeIds.length)) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Projected path source-edge IDs must be non-empty, unique and ordered with their subpaths." });
      }
      if (primitive.patternMark && (!nonBlank(primitive.patternMark.name)
        || !["cutLine", "foldLine", "placementLine"].includes(primitive.patternMark.kind)
        || (primitive.patternMark.label !== undefined && !nonBlank(primitive.patternMark.label))
        || (primitive.patternMark.labelRole !== undefined && !["label", "instruction"].includes(primitive.patternMark.labelRole)))) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Pattern line-mark metadata needs a supported kind, name and valid optional label role." });
      }
      break;
    case "circle":
      if (!finitePoint(primitive.center) || !Number.isFinite(primitive.radius) || primitive.radius <= 0) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Circle geometry needs a finite center and positive radius." });
      }
      break;
    case "mark":
      if (!finitePoint(primitive.at) || !nonBlank(primitive.markName)
        || !["button", "buttonhole", "placementPoint"].includes(primitive.markKind)
        || (primitive.label !== undefined && !nonBlank(primitive.label))
        || (primitive.labelRole !== undefined && !["label", "instruction"].includes(primitive.labelRole))) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Point marks need a supported kind, name, finite source point and optional non-empty label." });
      }
      break;
    case "text":
      if (!finitePoint(primitive.at)) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Text anchor must be finite." });
      }
      if (!nonBlank(primitive.text)) {
        issues.push({ code: "INVALID_TEXT", entityId: primitive.id, message: "Text content must be non-empty." });
      }
      break;
    case "artwork":
      if (!nonBlank(primitive.placementId) || !nonBlank(primitive.sourceName) || !nonBlank(primitive.targetRoleId)
        || (primitive.assetId !== undefined && !nonBlank(primitive.assetId))
        || !Number.isFinite(primitive.widthCm) || primitive.widthCm <= 0
        || !Number.isFinite(primitive.heightCm) || primitive.heightCm <= 0
        || !Number.isFinite(primitive.transform.dx) || !Number.isFinite(primitive.transform.dy)
        || !Number.isFinite(primitive.transform.scale) || primitive.transform.scale <= 0
        || !Number.isFinite(primitive.transform.rotationDegrees)
        || !Number.isInteger(primitive.zOrder)) {
        issues.push({ code: "INVALID_ARTWORK", entityId: primitive.id, message: "Artwork requires a placement, target role, source label, positive dimensions and scale, and a finite transform and integer layer order." });
      }
      break;
    case "callout":
      if (!nonBlank(primitive.text) || !finitePoint(primitive.anchor.point) || !finitePoint(primitive.labelAt)) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id, message: "Callout text and anchor/label positions must be valid." });
      }
      if (primitive.dimensionReferences !== undefined && (!primitive.dimensionReferences
        || !["edge-length", "vertical-levels"].includes(primitive.dimensionReferences.kind)
        || !Array.isArray(primitive.dimensionReferences.references) || primitive.dimensionReferences.references.length !== 2
        || primitive.dimensionReferences.references.some((reference) => !finitePoint(reference.point)
          || !nonBlank(reference.sourceEntityId)))) {
        issues.push({ code: "INVALID_GEOMETRY", entityId: primitive.id,
          message: "Dimension references need two finite, source-identified annotation points." });
      }
      break;
  }
  return issues;
}

/** Validate the source/revision and geometry invariants shared by every view.
 * Issues are returned to the caller so an invalid design remains visible. */
export function validateTechnicalFlat(view: TechnicalFlatView): TechnicalFlatIssue[] {
  const issues: TechnicalFlatIssue[] = [];
  if (!nonBlank(view.viewId)) issues.push({ code: "INVALID_VIEW_ID", message: "View identity must be non-empty." });
  if (!nonBlank(view.revisionId)) issues.push({ code: "INVALID_REVISION_ID", message: "View revision must be non-empty." });
  if (!nonBlank(view.recipeId)) issues.push({ code: "INVALID_RECIPE_ID", message: "Recipe identity must be non-empty." });
  if (view.schemaVersion !== TECHNICAL_FLAT_SCHEMA_VERSION) {
    issues.push({ code: "INVALID_SCHEMA_VERSION", message: "Unsupported technical-flat schema version." });
  }
  if (view.kind !== "FRONT_FLAT" && view.kind !== "BACK_FLAT") {
    issues.push({ code: "INVALID_VIEW_KIND", message: "Technical flat kind must be FRONT_FLAT or BACK_FLAT." });
  }
  if (view.units !== "cm") issues.push({ code: "INVALID_UNITS", message: "Technical-flat pattern coordinates must be in centimetres." });

  const ids = new Set<string>();
  const geometryIds = new Set<string>();
  for (const primitive of view.primitives) {
    if (ids.has(primitive.id)) {
      issues.push({ code: "DUPLICATE_ENTITY_ID", entityId: primitive.id, message: "Primitive identities must be unique within a view." });
    }
    ids.add(primitive.id);
    if (primitive.kind === "path" || primitive.kind === "circle" || primitive.kind === "mark") geometryIds.add(primitive.id);
    issues.push(...validatePrimitive(primitive));
    if (primitive.source && primitive.source.revisionId !== view.revisionId) {
      issues.push({ code: "REVISION_MISMATCH", entityId: primitive.id, message: "Primitive source must belong to the view revision." });
    }
  }

  for (const primitive of view.primitives) {
    if (primitive.kind === "callout" && !geometryIds.has(primitive.anchor.primitiveId)) {
      issues.push({ code: "UNRESOLVED_CALLOUT_TARGET", entityId: primitive.id, message: "Callout target must identify geometry in this view." });
    }
    if (primitive.kind === "callout" && primitive.anchor.sourceEntityId !== undefined) {
      const target = view.primitives.find((candidate) => candidate.id === primitive.anchor.primitiveId);
      const edgeReference = /^pattern:([^:]+):role:([^:]+):edge:(.+)$/.exec(primitive.anchor.sourceEntityId);
      const roleSourceId = edgeReference ? `pattern:${edgeReference[1]}:role:${edgeReference[2]}` : undefined;
      const exactEdgeId = edgeReference ? `pattern:${edgeReference[1]}:role:${edgeReference[2]}:edge:${edgeReference[3]}` : undefined;
      const roleEdgeIsRepresented = roleSourceId !== undefined && target?.source.sourceId === roleSourceId
        && target.kind === "path" && sourceEdgeIsRepresented(target, exactEdgeId as string);
      const sourceIsRepresented = target?.source.sourceId === primitive.anchor.sourceEntityId || roleEdgeIsRepresented
        || primitive.dimensionReferences?.references.some((reference) => reference.sourceEntityId === primitive.anchor.sourceEntityId) === true;
      if (!sourceIsRepresented) issues.push({ code: "UNRESOLVED_CALLOUT_TARGET", entityId: primitive.id,
        message: "Callout source entity must be represented by its same-revision target geometry." });
    }
    if (primitive.kind === "callout" && primitive.dimensionReferences?.references.some((reference) => {
      const match = /^pattern:([^:]+):role:[^:]+:edge:.+$/u.exec(reference.sourceEntityId);
      return !match || match[1] !== view.recipeId;
    })) issues.push({ code: "UNRESOLVED_CALLOUT_TARGET", entityId: primitive.id,
      message: "Dimension references must identify source edges from this recipe and revision." });
  }

  const noticeIds = new Set<string>();
  for (const notice of view.notices) {
    if (!nonBlank(notice.id) || !nonBlank(notice.message) || noticeIds.has(notice.id)) {
      issues.push({ code: "INVALID_NOTICE", entityId: notice.id, message: "Notices need unique identities and actionable messages." });
    }
    noticeIds.add(notice.id);
  }
  return issues;
}

function sourceEdgeIsRepresented(target: FlatPathPrimitive, exactEdgeId: string): boolean {
  if (target.sourceEdgeIds === undefined) return true;
  return target.sourceEdgeIds.includes(exactEdgeId);
}
