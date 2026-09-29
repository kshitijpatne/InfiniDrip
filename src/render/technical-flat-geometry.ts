import type { Block } from "../drafting/block";
import type { Edge, Piece } from "../drafting/piece";
import type { PatternMark } from "../drafting/pattern-mark";
import type {
  FlatPathCommand,
  FlatPointMarkPrimitive,
  FlatPathPrimitive,
  TechnicalFlatNotice,
  TechnicalFlatPrimitive,
  TechnicalFlatViewKind,
} from "./technical-flat";
import { mapTechnicalFlatSources, type FlatMappingIssue } from "./technical-flat-mapping";

export interface TechnicalFlatGeometryIssue {
  readonly code: "INVALID_REVISION_ID" | "INVALID_SOURCE_EDGE";
  readonly sourceId: string;
  readonly message: string;
}

/** Pattern-space source geometry before component placement or finished-seam
 * visibility is resolved. This is not an assembled or user-facing flat. */
export interface TechnicalFlatSourceGeometry {
  readonly recipeId: string;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly units: "cm";
  readonly primitives: readonly TechnicalFlatPrimitive[];
  readonly notices: readonly TechnicalFlatNotice[];
  readonly issues: readonly (FlatMappingIssue | TechnicalFlatGeometryIssue)[];
}

function finitePoint(value: unknown): value is { readonly x: number; readonly y: number } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.x === "number" && Number.isFinite(candidate.x)
    && typeof candidate.y === "number" && Number.isFinite(candidate.y);
}

function edgeCommand(edge: Edge): FlatPathCommand[] | null {
  if (edge.kind === "line") {
    if (!finitePoint(edge.start) || !finitePoint(edge.end)) return null;
    return [{ op: "move", point: { ...edge.start } }, { op: "line", point: { ...edge.end } }];
  }
  if (!finitePoint(edge.curve.start) || !finitePoint(edge.curve.control1)
    || !finitePoint(edge.curve.control2) || !finitePoint(edge.curve.end)) return null;
  return [
    { op: "move", point: { ...edge.curve.start } },
    { op: "cubic", control1: { ...edge.curve.control1 }, control2: { ...edge.curve.control2 }, point: { ...edge.curve.end } },
  ];
}

/** Keep each authored edge as its own subpath so no connection is inferred. */
function edgeCommands(edges: readonly Edge[]): FlatPathCommand[] | null {
  const commands: FlatPathCommand[] = [];
  for (const edge of edges) {
    const next = edgeCommand(edge);
    if (!next) return null;
    commands.push(...next);
  }
  return commands.length > 0 ? commands : null;
}

function source(revisionId: string, sourceId: string) {
  return { sourceClass: "PATTERN_DERIVED" as const, sourceId, revisionId };
}

function outlinePrimitive(
  recipeId: string, revisionId: string, kind: TechnicalFlatViewKind, roleId: string, piece: Piece,
): FlatPathPrimitive | null {
  const commands = edgeCommands(piece.edges);
  if (!commands) return null;
  return {
    kind: "path",
    id: `flat:${recipeId}:${kind}:component:${roleId}:outline`,
    layer: "GARMENT_SILHOUETTE",
    feature: "silhouette",
    source: source(revisionId, `pattern:${recipeId}:role:${roleId}`),
    commands,
  };
}

function dartPrimitives(
  recipeId: string, revisionId: string, kind: TechnicalFlatViewKind, roleId: string, piece: Piece,
): { readonly primitives: FlatPathPrimitive[]; readonly issues: TechnicalFlatGeometryIssue[] } {
  if (!piece.dart) return { primitives: [], issues: [] };
  const primitives: FlatPathPrimitive[] = [];
  const issues: TechnicalFlatGeometryIssue[] = [];
  for (const edgeName of piece.dart.legs) {
    const sourceId = `pattern:${recipeId}:dart:${roleId}:${piece.dart.legs.join(":")}`;
    const edge = piece.edges.find((candidate) => candidate.name === edgeName);
    if (!edge) {
      issues.push({ code: "INVALID_SOURCE_EDGE", sourceId,
        message: `Dart leg “${roleId}.${edgeName}” does not resolve to a drafted edge.` });
      continue;
    }
    // The enclosing piece outline has already validated every edge before its
    // dart legs are copied into their construction layer.
    const commands = edgeCommand(edge) as FlatPathCommand[];
    primitives.push({
      kind: "path" as const,
      id: `flat:${recipeId}:${kind}:dart:${roleId}:${edgeName}`,
      layer: "DART" as const,
      feature: "dart" as const,
      source: source(revisionId, sourceId),
      commands,
    });
  }
  return { primitives, issues };
}

function markFeature(mark: PatternMark, roleId: string): "closure" | "pocket" | "annotation" {
  if (mark.kind === "button" || mark.kind === "buttonhole") return "closure";
  if (/pocket/i.test(roleId) || /pocket/i.test(mark.name)) return "pocket";
  return "annotation";
}

function markPrimitive(
  recipeId: string,
  revisionId: string,
  kind: TechnicalFlatViewKind,
  roleId: string,
  mark: PatternMark,
): FlatPathPrimitive | FlatPointMarkPrimitive | null {
  const id = `flat:${recipeId}:${kind}:mark:${roleId}:${mark.name}`;
  const sourceId = `pattern:${recipeId}:mark:${roleId}:${mark.name}`;
  const feature = markFeature(mark, roleId);
  const layer = feature === "closure" ? "CLOSURE" : feature === "pocket" ? "CONSTRUCTION" : "ANNOTATION";
  if ("at" in mark) {
    if (!finitePoint(mark.at)) return null;
    return {
      kind: "mark", id, layer, feature, source: source(revisionId, sourceId),
      markKind: mark.kind, markName: mark.name, at: { ...mark.at },
      label: mark.label,
      labelRole: mark.labelRole,
    };
  }
  if (!finitePoint(mark.start) || !finitePoint(mark.end)) return null;
  return {
    kind: "path", id, layer, feature, source: source(revisionId, sourceId),
    commands: [{ op: "move", point: { ...mark.start } }, { op: "line", point: { ...mark.end } }],
    patternMark: { kind: mark.kind, name: mark.name, label: mark.label, labelRole: mark.labelRole },
  };
}

/** Compile exact Block source geometry for a face. Hidden interior roles remain
 * explicit notices, and stitch relations do not become visible seam lines. */
export function compileTechnicalFlatSourceGeometry(
  recipeId: string,
  block: Block,
  revisionId: string,
  kind: TechnicalFlatViewKind,
): TechnicalFlatSourceGeometry {
  const mapping = mapTechnicalFlatSources(recipeId, block);
  const face = mapping.faces.find((candidate) => candidate.kind === kind);
  const issues: (FlatMappingIssue | TechnicalFlatGeometryIssue)[] = [...mapping.issues];
  const notices: TechnicalFlatNotice[] = mapping.notices.map((notice) => ({ ...notice }));
  const primitives: TechnicalFlatPrimitive[] = [];
  if (typeof revisionId !== "string" || !revisionId.trim()) {
    issues.push({ code: "INVALID_REVISION_ID", sourceId: recipeId, message: "Source geometry requires a non-empty design revision." });
    return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };
  }
  if (!face) return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };

  for (const role of face.roles) {
    const piece = block.roles[role.roleId];
    if (!piece) continue;
    if (role.treatment === "INTERIOR_HIDDEN") {
      notices.push({
        id: `notice:${recipeId}:${kind}:role:${role.roleId}:hidden`, feature: "annotation",
        reason: "HIDDEN_BY_VIEW", sourceId: `pattern:${recipeId}:role:${role.roleId}`,
        message: `Interior role “${role.roleId}” is retained as source data and omitted from the exterior ${kind === "FRONT_FLAT" ? "front" : "back"} geometry.`,
      });
      continue;
    }

    const outline = outlinePrimitive(recipeId, revisionId, kind, role.roleId, piece);
    if (!outline) {
      issues.push({ code: "INVALID_SOURCE_EDGE", sourceId: `pattern:${recipeId}:role:${role.roleId}`,
        message: `Role “${role.roleId}” contains an empty or non-finite outline edge.` });
      continue;
    }
    primitives.push(outline);
    const dartGeometry = dartPrimitives(recipeId, revisionId, kind, role.roleId, piece);
    primitives.push(...dartGeometry.primitives);
    issues.push(...dartGeometry.issues);

    for (const mark of piece.marks ?? []) {
      const primitive = markPrimitive(recipeId, revisionId, kind, role.roleId, mark);
      if (!primitive) {
        issues.push({ code: "INVALID_SOURCE_EDGE", sourceId: `pattern:${recipeId}:mark:${role.roleId}:${mark.name}`,
          message: `Pattern mark “${mark.name}” contains an empty or non-finite source coordinate.` });
        continue;
      }
      primitives.push(primitive);
    }
  }

  return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };
}
