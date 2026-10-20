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
import { edgeEnd, edgeStart } from "../drafting/piece";
import { resolveFlatProjectionLandmark, validateTechnicalFlatProjectionMap, edgeParameterAtArclengthFraction,
  type FlatProjectionIssue, type FlatProjectionLandmark, type FlatProjectionRole, type TechnicalFlatProjectionMap } from "./technical-flat-projection";

export interface TechnicalFlatGeometryIssue {
  readonly code: "INVALID_REVISION_ID" | "INVALID_SOURCE_EDGE" | "INVALID_PROJECTION_MAP" | "UNRESOLVED_PROJECTION_EDGE";
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
  readonly issues: readonly (FlatMappingIssue | FlatProjectionIssue | TechnicalFlatGeometryIssue)[];
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
  recipeId: string, revisionId: string, kind: TechnicalFlatViewKind, roleId: string,
  edges: readonly Edge[], sourceEdgeIds?: readonly string[], commandOverride?: readonly FlatPathCommand[],
): FlatPathPrimitive | null {
  const commands = commandOverride ?? edgeCommands(edges);
  if (!commands) return null;
  return {
    kind: "path",
    id: `flat:${recipeId}:${kind}:component:${roleId}:outline`,
    layer: "GARMENT_SILHOUETTE",
    feature: "silhouette",
    source: source(revisionId, `pattern:${recipeId}:role:${roleId}`),
    ...(sourceEdgeIds ? { sourceEdgeIds } : {}),
    commands,
  };
}

function pointForProjectionLandmark(
  block: Block, kind: TechnicalFlatViewKind, roleId: string, edgeId: string,
  landmark: FlatProjectionRole["runs"][number]["from"],
) {
  return resolveFlatProjectionLandmark(block, roleId, kind, landmark, edgeId);
}

/** @internal Pure helper exported for focused landmark validation tests. */
export function parameterForLandmark(edge: Edge, piece: Piece, landmark: FlatProjectionLandmark): number | undefined {
  if (landmark.kind === "edge-endpoint") {
    if (landmark.edgeId !== edge.name) return undefined;
    return landmark.endpoint === "start" ? 0 : landmark.endpoint === "end" ? 1 : undefined;
  }
  if (landmark.kind === "edge-arclength" || landmark.kind === "normalized-edge-transfer") {
    if (landmark.edgeId !== edge.name) return undefined;
    return edgeParameterAtArclengthFraction(edge, landmark.fraction);
  }
  if (landmark.kind === "pattern-mark") {
    const mark = piece.marks?.find((candidate) => candidate.name === landmark.markId);
    if (!mark) return undefined;
    const point = "at" in mark ? landmark.point === "at" ? mark.at : undefined
      : landmark.point === "start" ? mark.start : landmark.point === "end" ? mark.end : undefined;
    if (!point) return undefined;
    const start = edgeStart(edge);
    if (point.x === start.x && point.y === start.y) return 0;
    const end = edgeEnd(edge);
    if (point.x === end.x && point.y === end.y) return 1;
    return undefined;
  }
  return undefined;
}

function lerpPoint(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }, t: number) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function splitCubic(curve: Extract<Edge, { kind: "curve" }> ["curve"], t: number) {
  const p01 = lerpPoint(curve.start, curve.control1, t);
  const p12 = lerpPoint(curve.control1, curve.control2, t);
  const p23 = lerpPoint(curve.control2, curve.end, t);
  const p012 = lerpPoint(p01, p12, t);
  const p123 = lerpPoint(p12, p23, t);
  const point = lerpPoint(p012, p123, t);
  return {
    left: { start: curve.start, control1: p01, control2: p012, end: point },
    right: { start: point, control1: p123, control2: p23, end: curve.end },
  };
}

function cubicInterval(
  curve: Extract<Edge, { kind: "curve" }> ["curve"], from: number, to: number,
) {
  const lower = Math.min(from, to);
  const upper = Math.max(from, to);
  const left = splitCubic(curve, upper).left;
  const interval = lower === 0 ? left : splitCubic(left, lower / upper).right;
  return from <= to ? interval : {
    start: interval.end, control1: interval.control2, control2: interval.control1, end: interval.start,
  };
}

/** @internal Pure helper exported for malformed-run fail-closed tests. */
export function projectedCommands(recipeId: string, block: Block, kind: TechnicalFlatViewKind, piece: Piece, role: FlatProjectionRole) {
  const commands: FlatPathCommand[] = [];
  const sourceEdgeIds: string[] = [];
  for (const run of role.runs) {
    const edge = piece.edges.find((candidate) => candidate.name === run.edgeId)!;
    const from = pointForProjectionLandmark(block, kind, role.roleId, edge.name, run.from);
    const to = pointForProjectionLandmark(block, kind, role.roleId, edge.name, run.to);
    if (edge.kind === "line") {
      if (!finitePoint(from) || !finitePoint(to)) return null;
      commands.push({ op: "move", point: { ...from } }, { op: "line", point: { ...to } });
    } else {
      const fromParameter = parameterForLandmark(edge, piece, run.from);
      const toParameter = parameterForLandmark(edge, piece, run.to);
      if (fromParameter === undefined || toParameter === undefined || !finitePoint(from) || !finitePoint(to)) return null;
      const segment = cubicInterval(edge.curve, fromParameter, toParameter);
      if (!finitePoint(segment.control1) || !finitePoint(segment.control2)) return null;
      commands.push({ op: "move", point: { ...from } }, {
        op: "cubic",
        control1: { ...segment.control1 },
        control2: { ...segment.control2 },
        point: { ...to },
      });
    }
    sourceEdgeIds.push(`pattern:${recipeId}:role:${role.roleId}:edge:${edge.name}`);
  }
  return commands.length > 0 ? { commands, sourceEdgeIds } : null;
}

function projectionBoundaryPrimitives(
  recipeId: string, revisionId: string, kind: TechnicalFlatViewKind, block: Block, role: FlatProjectionRole,
): FlatPathPrimitive[] {
  const primitives: FlatPathPrimitive[] = [];
  for (const boundary of role.viewBoundaries ?? []) {
    const from = resolveFlatProjectionLandmark(block, role.roleId, kind, boundary.from);
    const to = resolveFlatProjectionLandmark(block, role.roleId, kind, boundary.to);
    const sourceStitch = boundary.from.kind === "stitch-interface-boundary"
      ? boundary.from.stitchLabel : boundary.to.kind === "stitch-interface-boundary" ? boundary.to.stitchLabel : "unknown";
    const boundarySourceId = boundary.fillOnlyColorway
      ? `view:${recipeId}:role:${role.roleId}:decision:${boundary.fillOnlyColorway.decisionId}:boundary:${boundary.id}`
      : `view:${recipeId}:role:${role.roleId}:stitch:${sourceStitch}:boundary:${boundary.id}`;
    const endpointEdgeIds = [boundary.from, boundary.to].map((landmark) =>
      landmark.kind === "edge-endpoint" || landmark.kind === "edge-arclength"
        || landmark.kind === "normalized-edge-transfer" ? `pattern:${recipeId}:role:${role.roleId}:edge:${landmark.edgeId}` : undefined);
    const wovenCollarAreaBoundary = recipeId === "woven-shirt"
      && ["outerStand", "upperCollar", "underCollar"].includes(role.roleId)
      && boundary.id === "approved-woven-collar-area-closure";
    primitives.push({
      kind: "path",
      id: `flat:${recipeId}:${kind}:component:${role.roleId}:view-boundary:${boundary.id}`,
      layer: "GARMENT_SILHOUETTE",
      feature: "silhouette",
      source: source(revisionId, boundarySourceId),
      ...(wovenCollarAreaBoundary && endpointEdgeIds.every((edgeId): edgeId is string => edgeId !== undefined)
        ? { projectionEndpointEdgeIds: endpointEdgeIds as [string, string] } : {}),
      ...(boundary.fillOnlyColorway ? { colorwayBoundaryOnly: true } : {}),
      commands: [{ op: "move", point: { ...from! } }, { op: "line", point: { ...to! } }],
    });
  }
  return primitives;
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
  projectionMap?: TechnicalFlatProjectionMap,
): TechnicalFlatSourceGeometry {
  const mapping = mapTechnicalFlatSources(recipeId, block);
  const face = mapping.faces.find((candidate) => candidate.kind === kind);
  const issues: (FlatMappingIssue | FlatProjectionIssue | TechnicalFlatGeometryIssue)[] = [...mapping.issues];
  const notices: TechnicalFlatNotice[] = mapping.notices.map((notice) => ({ ...notice }));
  const primitives: TechnicalFlatPrimitive[] = [];
  if (typeof revisionId !== "string" || !revisionId.trim()) {
    issues.push({ code: "INVALID_REVISION_ID", sourceId: recipeId, message: "Source geometry requires a non-empty design revision." });
    return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };
  }
  if (!face) return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };

  if (projectionMap) {
    const projectionIssues = validateTechnicalFlatProjectionMap(recipeId, block, revisionId, projectionMap);
    if (projectionIssues.length > 0) {
      issues.push(...projectionIssues);
      return { recipeId, revisionId, kind, units: "cm", primitives, notices, issues };
    }
  }

  const viewSeamRepresentation = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
    .find((candidate) => candidate.roleId === "outerStand")?.viewSeamRepresentation;
  const wovenSleeveCapRepresentation = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
    .find((candidate) => candidate.roleId === "sleeve")?.wovenSleeveCapRepresentation;
  const poloSleeveCapRepresentation = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
    .find((candidate) => candidate.roleId === "sleeve")?.poloSleeveCapRepresentation;
  const crewneckCapRoleId = kind === "FRONT_FLAT" ? "sleeveLeft" : "sleeveRight";
  const crewneckSleeveCapRepresentation = recipeId === "crewneck"
    ? projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
      .find((candidate) => candidate.roleId === crewneckCapRoleId)?.crewneckSleeveCapRepresentation
    : undefined;

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

    const projectionRole = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles.find((candidate) => candidate.roleId === role.roleId);
    if (projectionRole?.heldEdges.length) {
      for (const held of projectionRole.heldEdges) {
        issues.push({ code: "UNRESOLVED_PROJECTION_EDGE", sourceId: `pattern:${recipeId}:role:${role.roleId}:edge:${held.edgeId}`,
          message: `Visible ${kind} is withheld because edge “${role.roleId}.${held.edgeId}” is unresolved: ${held.reason}` });
      }
      continue;
    }
    const silhouetteRole = projectionRole ? { ...projectionRole, runs: projectionRole.runs.filter((run) => {
      if (viewSeamRepresentation?.visibleRoleId === role.roleId && run.edgeId === viewSeamRepresentation.visibleEdgeId) return false;
      if (role.roleId === "sleeve" && wovenSleeveCapRepresentation?.capEdgeIds.includes(run.edgeId as "capLeft" | "capRight")) return false;
      if (role.roleId === "sleeve" && poloSleeveCapRepresentation?.capEdgeId === run.edgeId) return false;
      if (role.roleId === crewneckSleeveCapRepresentation?.sleeveRoleId
        && crewneckSleeveCapRepresentation.capEdgeId === run.edgeId) return false;
      if (wovenSleeveCapRepresentation?.visibleBodyEdges.some((segment) => segment.roleId === role.roleId
        && segment.edgeId === run.edgeId)) return false;
      if (poloSleeveCapRepresentation?.visibleBodyRole === role.roleId
        && poloSleeveCapRepresentation.visibleBodyEdge === run.edgeId) return false;
      if (crewneckSleeveCapRepresentation?.visibleBodyRole === role.roleId
        && crewneckSleeveCapRepresentation.visibleBodyEdge === run.edgeId) return false;
      return true;
    }) } : projectionRole;
    const projected = silhouetteRole ? projectedCommands(recipeId, block, kind, piece, silhouetteRole) : undefined;
    const outline = projectionRole
      ? projected && outlinePrimitive(recipeId, revisionId, kind, role.roleId, [], projected.sourceEdgeIds, projected.commands)
      : outlinePrimitive(recipeId, revisionId, kind, role.roleId, piece.edges);
    if (!outline) {
      issues.push({ code: projectionRole ? "INVALID_PROJECTION_MAP" : "INVALID_SOURCE_EDGE", sourceId: `pattern:${recipeId}:role:${role.roleId}`,
        message: `Role “${role.roleId}” contains an empty or non-finite outline edge.` });
      continue;
    }
    primitives.push(outline);
    if (crewneckSleeveCapRepresentation?.visibleBodyRole === role.roleId) {
      const edge = piece.edges.find((candidate) => candidate.name === crewneckSleeveCapRepresentation.visibleBodyEdge)!;
      const commands = edgeCommand(edge)!;
      const sourceEdgeId = `pattern:crewneck:role:${role.roleId}:edge:${edge.name}`;
      const sourceRef = source(revisionId, sourceEdgeId);
      primitives.push({ kind: "path", id: `flat:crewneck:${kind}:view-seam:crewneck-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "SEAM", feature: "seam", source: sourceRef, sourceEdgeIds: [sourceEdgeId], commands });
      primitives.push({ kind: "path", id: `flat:crewneck:${kind}:view-seam-boundary:crewneck-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: sourceRef, sourceEdgeIds: [sourceEdgeId],
        colorwayBoundaryOnly: true, commands });
    }
    for (const segment of wovenSleeveCapRepresentation?.visibleBodyEdges.filter((candidate) => candidate.roleId === role.roleId) ?? []) {
      // Projection-map validation above proves the same-revision role edge exists.
      const edge = piece.edges.find((candidate) => candidate.name === segment.edgeId)!;
      const commands = edgeCommand(edge)!;
      const sourceEdgeId = `pattern:${recipeId}:role:${role.roleId}:edge:${edge.name}`;
      const sourceRef = source(revisionId, sourceEdgeId);
      primitives.push({ kind: "path", id: `flat:${recipeId}:${kind}:view-seam:woven-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "SEAM", feature: "seam", source: sourceRef, sourceEdgeIds: [sourceEdgeId], commands });
      primitives.push({ kind: "path", id: `flat:${recipeId}:${kind}:view-seam-boundary:woven-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: sourceRef, sourceEdgeIds: [sourceEdgeId],
        colorwayBoundaryOnly: true, commands });
    }
    if (poloSleeveCapRepresentation?.visibleBodyRole === role.roleId) {
      const edge = piece.edges.find((candidate) => candidate.name === poloSleeveCapRepresentation.visibleBodyEdge)!;
      const commands = edgeCommand(edge)!;
      const sourceEdgeId = `pattern:polo:role:${role.roleId}:edge:${edge.name}`;
      const sourceRef = source(revisionId, sourceEdgeId);
      primitives.push({ kind: "path", id: `flat:polo:${kind}:view-seam:polo-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "SEAM", feature: "seam", source: sourceRef, sourceEdgeIds: [sourceEdgeId], commands });
      primitives.push({ kind: "path", id: `flat:polo:${kind}:view-seam-boundary:polo-sleeve-cap:${role.roleId}:${edge.name}`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: sourceRef, sourceEdgeIds: [sourceEdgeId],
        colorwayBoundaryOnly: true, commands });
    }
    if (viewSeamRepresentation?.visibleRoleId === role.roleId) {
      // Exact map validation above proves the role/edge and its finite full run.
      const edge = piece.edges.find((candidate) => candidate.name === viewSeamRepresentation.visibleEdgeId)!;
      const commands = edgeCommand(edge)!;
      const sourceEdgeId = `pattern:${recipeId}:role:${role.roleId}:edge:${edge.name}`;
      const sourceRef = source(revisionId, sourceEdgeId);
      primitives.push({ kind: "path", id: `flat:${recipeId}:${kind}:view-seam:${role.roleId}:${edge.name}`,
        layer: "SEAM", feature: "seam", source: sourceRef, sourceEdgeIds: [sourceEdgeId], commands });
      primitives.push({ kind: "path", id: `flat:${recipeId}:${kind}:view-seam-boundary:${role.roleId}:${edge.name}`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: sourceRef, sourceEdgeIds: [sourceEdgeId],
        colorwayBoundaryOnly: true, commands });
    }
    if (viewSeamRepresentation && role.roleId === "outerStand" && projectionRole) {
      // The validator proves the exact source edge and normalized interval.
      const hiddenBoundary = projectedCommands(recipeId, block, kind, piece, { ...projectionRole, runs: [{
        edgeId: viewSeamRepresentation.suppressedEdgeId,
        from: viewSeamRepresentation.suppressedFrom,
        to: viewSeamRepresentation.suppressedTo,
      }] })!;
      primitives.push({ kind: "path", id: `flat:${recipeId}:${kind}:view-seam-boundary:outerStand:${viewSeamRepresentation.suppressedEdgeId}`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: source(revisionId, `pattern:${recipeId}:role:outerStand`),
        sourceEdgeIds: hiddenBoundary.sourceEdgeIds, colorwayBoundaryOnly: true, commands: hiddenBoundary.commands });
    }
    if (projectionRole) {
      const boundaries = projectionBoundaryPrimitives(recipeId, revisionId, kind, block, projectionRole);
      primitives.push(...boundaries);
    }
    const dartGeometry = dartPrimitives(recipeId, revisionId, kind, role.roleId, piece);
    primitives.push(...dartGeometry.primitives);
    issues.push(...dartGeometry.issues);

    for (const mark of piece.marks ?? []) {
      const excludedMark = projectionRole?.faceExcludedMarks?.find((candidate) => candidate.markName === mark.name);
      if (excludedMark) {
        notices.push({ id: `notice:${recipeId}:${kind}:mark:${role.roleId}:${mark.name}`, feature: "annotation",
          reason: "HIDDEN_BY_VIEW", sourceId: `pattern:${recipeId}:mark:${role.roleId}:${mark.name}`,
          message: excludedMark.reason });
        continue;
      }
      const primitive = markPrimitive(recipeId, revisionId, kind, role.roleId, mark);
      if (!primitive) {
        issues.push({ code: "INVALID_SOURCE_EDGE", sourceId: `pattern:${recipeId}:mark:${role.roleId}:${mark.name}`,
          message: `Pattern mark “${mark.name}” contains an empty or non-finite source coordinate.` });
        continue;
      }
      primitives.push(primitive);
    }
  }

  return { recipeId, revisionId, kind, units: "cm", primitives: projectionMap && issues.length > 0 ? [] : primitives, notices, issues };
}
