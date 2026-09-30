import type { GarmentRecipe } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import { edgeEnd, edgeStart } from "../drafting/piece";
import type { ArtworkPlacement } from "../surface/placement";
import type { TechnicalFlatColorwayOverlay } from "./technical-flat-overlays";
import {
  TECHNICAL_FLAT_SCHEMA_VERSION,
  type FlatPoint,
  type FlatPathCommand,
  type TechnicalFlatPrimitive,
  type TechnicalFlatView,
  type TechnicalFlatViewKind,
} from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { createG04TechnicalFlatProjectionMap } from "./technical-flat-projection";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { assembleTechnicalFlatRoles, type FlatRoleTransform } from "./technical-flat-assembly";
import { compileTechnicalFlatOverlays } from "./technical-flat-overlays";
import { compileTechnicalFlatPomCallouts } from "./technical-flat-poms";
import { transformFlatPrimitive } from "./technical-flat-transform";

export interface TechnicalFlatLiveIssue {
  readonly stage: "geometry" | "assembly" | "overlay" | "pom" | "transform";
  readonly sourceId: string;
  readonly message: string;
}

export interface TechnicalFlatLiveInput {
  readonly recipe: GarmentRecipe;
  readonly block: Block;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly placements: readonly ArtworkPlacement[];
  readonly colorHex: string;
  readonly texture: "smooth" | "woven" | "rib" | "heather";
  readonly shine: number;
}

export interface TechnicalFlatLiveResult {
  readonly view: TechnicalFlatView | null;
  readonly colorway: TechnicalFlatColorwayOverlay | null;
  readonly issues: readonly TechnicalFlatLiveIssue[];
}

export function technicalFlatAssemblyNotices(
  recipeId: string,
  kind: TechnicalFlatViewKind,
  assemblyIssues: ReturnType<typeof assembleTechnicalFlatRoles>["issues"],
) {
  return assemblyIssues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL").map((issue) => ({
    id: `notice:${recipeId}:${kind}:assembly:${issue.sourceId}`,
    feature: "seam" as const,
    reason: "SOURCE_NOT_REPRESENTED" as const,
    sourceId: issue.sourceId,
    message: issue.message,
  }));
}

export function placeTechnicalFlatPrimitive(primitive: TechnicalFlatPrimitive, roleId: string,
  placement: FlatRoleTransform | undefined, issues?: TechnicalFlatLiveIssue[]) {
  if (!placement) {
    const issue = {
    stage: "transform" as const,
    sourceId: primitive.source.sourceId,
    message: `Source “${primitive.source.sourceId}” has no sewn placement on this face; the flat is withheld.`,
    };
    issues?.push(issue);
    return [];
  }
  return [{ placed: transformFlatPrimitive(primitive, { offset: placement.offset,
    rotationDegrees: placement.rotationDegrees, mirrorX: false }), roleId, placement }];
}

export function technicalFlatPrimitiveRole(primitive: TechnicalFlatPrimitive, primitives: readonly TechnicalFlatPrimitive[], roleIds: readonly string[]): string {
  if (primitive.kind === "artwork") return primitive.targetRoleId;
  const sourceId = primitive.kind === "callout"
    ? primitives.find((candidate) => candidate.id === primitive.anchor.primitiveId)?.source.sourceId ?? ""
    : primitive.source.sourceId;
  return roleIds.find((roleId) => sourceId.includes(`role:${roleId}`)
    || sourceId.includes(`mark:${roleId}:`) || sourceId.includes(`dart:${roleId}:`)) ?? "";
}

export function reflectFoldPrimitive(
  primitive: TechnicalFlatPrimitive,
  foldEdgeId: string,
): TechnicalFlatPrimitive | undefined {
  if (primitive.kind === "path") {
    if (primitive.sourceEdgeIds) {
      const keepIndexes = primitive.sourceEdgeIds.flatMap((sourceId, index) =>
        sourceId.endsWith(`:edge:${foldEdgeId}`) ? [] : [index]);
      if (keepIndexes.length === 0) return undefined;
      return {
        ...primitive,
        id: `${primitive.id}:fold-reflection`,
        sourceEdgeIds: keepIndexes.map((index) => primitive.sourceEdgeIds![index]!),
        commands: keepIndexes.flatMap((index) => primitive.commands.slice(index * 2, index * 2 + 2)),
      };
    }
    const points = primitive.commands.flatMap((command) => {
      if (command.op === "close") return [];
      if (command.op === "cubic") return [command.control1, command.control2, command.point];
      return [command.point];
    });
    if (points.length === 0 || points.every((point) => point.x === 0)) return undefined;
    return { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  if (primitive.kind === "mark") {
    return primitive.at.x === 0 ? undefined : { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  if (primitive.kind === "circle") {
    return primitive.center.x === 0 ? undefined : { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  return undefined;
}

function pointOnLine(point: FlatPoint, start: FlatPoint, end: FlatPoint): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const cross = Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx);
  const dot = (point.x - start.x) * dx + (point.y - start.y) * dy;
  return cross <= 1e-8 * length && dot >= -1e-8 && dot <= length * length + 1e-8;
}

function reflectPointAcrossLine(point: FlatPoint, start: FlatPoint, end: FlatPoint): FlatPoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const nearest = { x: start.x + projection * dx, y: start.y + projection * dy };
  return { x: 2 * nearest.x - point.x, y: 2 * nearest.y - point.y };
}

/** Reflect source-derived geometry across a sewn-to panel axis in assembled coordinates. */
export function reflectPrimitiveAcrossLine(
  primitive: TechnicalFlatPrimitive, start: FlatPoint, end: FlatPoint,
): TechnicalFlatPrimitive | undefined {
  if (!(Math.hypot(end.x - start.x, end.y - start.y) > 0)) return undefined;
  if (primitive.kind === "path") {
    const groups: FlatPathCommand[][] = [];
    let current: FlatPathCommand[] = [];
    for (const command of primitive.commands) {
      if (command.op === "move" && current.length > 0) {
        groups.push(current);
        current = [];
      }
      current.push(command);
    }
    if (current.length > 0) groups.push(current);
    if (primitive.sourceEdgeIds && primitive.sourceEdgeIds.length !== groups.length) return undefined;
    const commands: FlatPathCommand[] = [];
    const sourceEdgeIds: string[] = [];
    groups.forEach((group, index) => {
      // A component's own fold edge is the shared center boundary. Its sewn-to
      // panel places that boundary on the same axis, so reflecting it would
      // emit a duplicate seam even when the assembly fit has tiny residuals.
      if (primitive.sourceEdgeIds?.[index]?.endsWith(":edge:fold")) return;
      const points = group.flatMap((command) => command.op === "cubic"
        ? [command.control1, command.control2, command.point]
        : command.op === "close" ? [] : [command.point]);
      if (points.length === 0 || points.every((point) => pointOnLine(point, start, end))) return;
      commands.push(...group.map((command) => {
        if (command.op === "close") return command;
        if (command.op === "cubic") return {
          ...command,
          control1: reflectPointAcrossLine(command.control1, start, end)!,
          control2: reflectPointAcrossLine(command.control2, start, end)!,
          point: reflectPointAcrossLine(command.point, start, end)!,
        };
        return { ...command, point: reflectPointAcrossLine(command.point, start, end)! };
      }));
      if (primitive.sourceEdgeIds) sourceEdgeIds.push(primitive.sourceEdgeIds[index]!);
    });
    if (commands.length === 0) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, commands,
      ...(primitive.sourceEdgeIds ? { sourceEdgeIds } : {}) };
  }
  if (primitive.kind === "mark") {
    if (pointOnLine(primitive.at, start, end)) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, at: reflectPointAcrossLine(primitive.at, start, end) };
  }
  if (primitive.kind === "circle") {
    if (pointOnLine(primitive.center, start, end)) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, center: reflectPointAcrossLine(primitive.center, start, end) };
  }
  return undefined;
}

function placedPoint(pointValue: FlatPoint, placement: { readonly offset: FlatPoint; readonly rotationDegrees: number }): FlatPoint {
  const angle = placement.rotationDegrees * Math.PI / 180;
  return {
    x: pointValue.x * Math.cos(angle) - pointValue.y * Math.sin(angle) + placement.offset.x,
    y: pointValue.x * Math.sin(angle) + pointValue.y * Math.cos(angle) + placement.offset.y,
  };
}

/** Compose one face from a single exact block, revision and sewn-role solution. */
export function compileTechnicalFlatLiveView(input: TechnicalFlatLiveInput): TechnicalFlatLiveResult {
  const { recipe, block, revisionId, kind } = input;
  const projectionMap = createG04TechnicalFlatProjectionMap(recipe.name, block, revisionId);
  const geometry = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, kind, projectionMap);
  const assembly = assembleTechnicalFlatRoles(recipe.name, block, kind);
  const overlays = compileTechnicalFlatOverlays(recipe, block, revisionId, input.placements,
    input.colorHex, input.texture, input.shine);
  const poms = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, kind, recipe.poms, geometry.primitives);
  const issues: TechnicalFlatLiveIssue[] = [
    ...geometry.issues.map((issue) => ({ stage: "geometry" as const, sourceId: issue.sourceId, message: issue.message })),
    ...assembly.issues.filter((issue) => issue.code !== "STITCH_ENDPOINT_RESIDUAL")
      .map((issue) => ({ stage: "assembly" as const, sourceId: issue.sourceId, message: issue.message })),
    ...overlays.issues.map((issue) => ({ stage: "overlay" as const, sourceId: issue.sourceId, message: issue.message })),
    ...poms.issues.map((issue) => ({ stage: "pom" as const, sourceId: issue.sourceId, message: issue.message })),
  ];
  if (recipe.name === "skirt" && input.placements.some((placement) => placement.pieceRole === "waistband")) {
    issues.push({ stage: "overlay", sourceId: "style:artwork:waistband",
      message: "Artwork targeting the Skirt waistband is withheld until its face-specific segment can be clipped without crossing the side-seam boundary. Reposition it on the front or back panel." });
  }
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
  const face = mapping?.faces.find((candidate) => candidate.kind === kind);
  const overlayFace = overlays.faces?.find((candidate) => candidate.kind === kind);
  const faceRoleIds = face?.roles.map((role) => role.roleId) ?? [];
  const combined = [...geometry.primitives, ...(overlayFace?.artwork ?? []), ...(poms.callouts ?? [])];
  const transformed: TechnicalFlatPrimitive[] = [];
  for (const primitive of combined) {
    const roleId = technicalFlatPrimitiveRole(primitive, combined, faceRoleIds);
    for (const { placed, placement } of placeTechnicalFlatPrimitive(primitive, roleId, assembly.transforms[roleId], issues)) {
      transformed.push(placed);
      const foldAxis = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
        .find((candidate) => candidate.roleId === roleId)?.foldAxisReflection;
      if (foldAxis) {
        if (foldAxis.axisRoleId) {
          const axisPlacement = assembly.transforms[foldAxis.axisRoleId];
          const axisPiece = block.roles[foldAxis.axisRoleId];
          const axisEdge = axisPiece?.edges.find((candidate) => candidate.name === foldAxis.edgeId);
          // Projection-map validation guarantees the exact straight source axis;
          // assembly validation guarantees its placement whenever this segment is emitted.
          const axisStart = placedPoint(edgeStart(axisEdge!), axisPlacement!);
          const axisEnd = placedPoint(edgeEnd(axisEdge!), axisPlacement!);
          const mirrored = reflectPrimitiveAcrossLine(placed, axisStart, axisEnd);
          if (mirrored) transformed.push(mirrored);
        } else {
          const mirrored = reflectFoldPrimitive(primitive, foldAxis.edgeId);
          if (mirrored) transformed.push(transformFlatPrimitive(mirrored, { offset: placement.offset,
            rotationDegrees: placement.rotationDegrees, mirrorX: true }));
        }
      }
    }
  }
  if (!mapping || !face) issues.push({ stage: "geometry", sourceId: recipe.name,
    message: `Recipe “${recipe.label}” has no admitted ${kind === "FRONT_FLAT" ? "front" : "back"} flat mapping.` });
  if (issues.length > 0 || !overlayFace || poms.callouts === null) return { view: null, colorway: null, issues };

  const notices = [
    ...geometry.notices,
    ...overlayFace.notices,
    ...poms.notices,
    ...technicalFlatAssemblyNotices(recipe.name, kind, assembly.issues),
  ];
  return {
    view: {
      schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION,
      viewId: `live-flat:${recipe.name}:${kind}`,
      revisionId,
      recipeId: recipe.name,
      kind,
      units: "cm",
      primitives: transformed,
      notices,
    },
    colorway: overlayFace.colorway,
    issues: [],
  };
}
