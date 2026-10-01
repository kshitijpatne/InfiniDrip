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
import { createG04TechnicalFlatProjectionMap, type FlatProjectionPhysicalPairReflection,
  type FlatProjectionOppositeSideReflection, type FlatProjectionViewPairReflection } from "./technical-flat-projection";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { assembleTechnicalFlatRoles, type FlatRoleTransform } from "./technical-flat-assembly";
import { compileTechnicalFlatOverlays } from "./technical-flat-overlays";
import { compileTechnicalFlatPomCallouts } from "./technical-flat-poms";
import { transformFlatPrimitive } from "./technical-flat-transform";
import { compileTrouserWaistbandFragments } from "./technical-flat-fragment-compiler";

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
    rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false }), roleId, placement }];
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

export function reflectPhysicalPairPrimitive(
  primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionPhysicalPairReflection | undefined,
  placement: FlatRoleTransform | undefined,
): TechnicalFlatPrimitive | undefined {
  if (!reflection || !placement || primitive.source.sourceClass !== "PATTERN_DERIVED") return undefined;
  const reflected = reflectFoldPrimitive(primitive, reflection.edgeId);
  if (!reflected) return undefined;
  return transformFlatPrimitive({
    ...reflected,
    id: reflected.id.replace(/:fold-reflection$/, ":physical-pair-reflection"),
  }, {
    offset: placement.offset,
    rotationDegrees: placement.rotationDegrees,
    mirrorX: true,
  });
}

export function appendPhysicalPairReflection(
  primitives: TechnicalFlatPrimitive[],
  primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionPhysicalPairReflection | undefined,
  placement: FlatRoleTransform | undefined,
): void {
  const mirrored = reflectPhysicalPairPrimitive(primitive, reflection, placement);
  if (mirrored) primitives.push(mirrored);
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

function placedPoint(pointValue: FlatPoint, placement: { readonly offset: FlatPoint; readonly rotationDegrees: number; readonly mirrorX?: boolean }): FlatPoint {
  const angle = placement.rotationDegrees * Math.PI / 180;
  const localX = placement.mirrorX ? -pointValue.x : pointValue.x;
  return {
    x: localX * Math.cos(angle) - pointValue.y * Math.sin(angle) + placement.offset.x,
    y: localX * Math.sin(angle) + pointValue.y * Math.cos(angle) + placement.offset.y,
  };
}

export function appendApprovedViewPairReflection(
  primitives: TechnicalFlatPrimitive[], primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionViewPairReflection | undefined, block: Block,
  transforms: Readonly<Record<string, FlatRoleTransform>>, issues: TechnicalFlatLiveIssue[],
): void {
  if (!reflection) return;
  const placement = transforms[reflection.axisRoleId];
  const piece = block.roles[reflection.axisRoleId];
  const edge = piece?.edges.find((candidate) => candidate.name === reflection.edgeId);
  if (!placement || !edge || edge.kind !== "line") {
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: `The approved paired view for “sleeve” has no exact assembled ${reflection.axisRoleId}.${reflection.edgeId} axis.` });
    return;
  }
  const start = placedPoint(edgeStart(edge), placement);
  const end = placedPoint(edgeEnd(edge), placement);
  const mirrored = reflectPrimitiveAcrossLine(primitive, start, end);
  if (mirrored) {
    primitives.push({ ...mirrored, id: mirrored.id.replace(/:attached-fold-reflection$/, ":approved-view-pair") });
  } else if (primitive.kind === "artwork" || primitive.kind === "text" || primitive.kind === "callout") {
    issues.push({ stage: "overlay", sourceId: primitive.source.sourceId,
      message: `The paired sleeve view cannot mirror ${primitive.kind} content without an explicit placement transform; the face is withheld.` });
  }
}

/** @internal Reflect one source-declared closure instance to its approved
 * opposite garment side without emitting the unreflected duplicate. */
export function appendOppositeSideReflection(
  primitives: TechnicalFlatPrimitive[], primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionOppositeSideReflection | undefined, block: Block,
  transforms: Readonly<Record<string, FlatRoleTransform>>, issues: TechnicalFlatLiveIssue[],
): boolean {
  if (!reflection) return false;
  const placement = transforms[reflection.axisRoleId];
  const piece = block.roles[reflection.axisRoleId];
  const edge = piece?.edges.find((candidate) => candidate.name === reflection.edgeId);
  if (!placement || !edge || edge.kind !== "line") {
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: `The approved left-side closure placement has no exact assembled ${reflection.axisRoleId}.${reflection.edgeId} axis.` });
    return true;
  }
  const start = placedPoint(edgeStart(edge), placement);
  const end = placedPoint(edgeEnd(edge), placement);
  const reflected = reflectPrimitiveAcrossLine(primitive, start, end);
  if (!reflected) {
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: "The approved left buttonhole placket cannot be represented on its opposite front side from the current attachment geometry." });
    return true;
  }
  primitives.push({ ...reflected, id: reflected.id.replace(/:attached-fold-reflection$/, ":approved-left-closure") });
  return true;
}

/** Compose one face from a single exact block, revision and sewn-role solution. */
export function compileTechnicalFlatLiveView(input: TechnicalFlatLiveInput): TechnicalFlatLiveResult {
  const { recipe, block, revisionId, kind } = input;
  const projectionMap = createG04TechnicalFlatProjectionMap(recipe.name, block, revisionId);
  const geometry = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, kind, projectionMap);
  const assembly = assembleTechnicalFlatRoles(recipe.name, block, kind, projectionMap);
  const waistbandFragments = recipe.name === "trouser"
    ? compileTrouserWaistbandFragments(block, revisionId, kind, assembly.sourceFragments, assembly.transforms)
    : { primitives: [], issues: [] };
  const overlays = compileTechnicalFlatOverlays(recipe, block, revisionId, input.placements,
    input.colorHex, input.texture, input.shine);
  const resolvePomAnchor = recipe.name === "trouser" ? (pom: GarmentRecipe["poms"][number], point: FlatPoint) => {
    const markAnchor = kind === "BACK_FLAT" ? pom.backMarkAnchor : undefined;
    if (markAnchor) {
      const target = waistbandFragments.primitives.find((primitive) => primitive.kind === "mark"
        && primitive.source.sourceId === `pattern:${recipe.name}:mark:${markAnchor.roleId}:${markAnchor.markName}`
        && primitive.source.revisionId === revisionId);
      return target?.kind === "mark" ? { targetGeometryId: target.id, point: target.at } : undefined;
    }
    const anchorRoleId = kind === "FRONT_FLAT" ? G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.pomAnchorRole
      : G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.backPomAnchorRole;
    const placement = assembly.transforms[anchorRoleId!];
    return anchorRoleId && placement ? {
      targetGeometryId: `flat:${recipe.name}:${kind}:component:${anchorRoleId}:outline`,
      point: placedPoint(point, placement),
    } : undefined;
  } : undefined;
  const poms = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, kind, recipe.poms,
    [...geometry.primitives, ...waistbandFragments.primitives], resolvePomAnchor);
  const issues: TechnicalFlatLiveIssue[] = [
    ...geometry.issues.map((issue) => ({ stage: "geometry" as const, sourceId: issue.sourceId, message: issue.message })),
    ...waistbandFragments.issues.map((issue) => ({ stage: "geometry" as const, sourceId: issue.sourceId, message: issue.message })),
    ...assembly.issues.filter((issue) => issue.code !== "STITCH_ENDPOINT_RESIDUAL")
      .map((issue) => ({ stage: "assembly" as const, sourceId: issue.sourceId, message: issue.message })),
    ...overlays.issues.map((issue) => ({ stage: "overlay" as const, sourceId: issue.sourceId, message: issue.message })),
    ...poms.issues.map((issue) => ({ stage: "pom" as const, sourceId: issue.sourceId, message: issue.message })),
  ];
  if (recipe.name === "polo") {
    issues.push(...assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId.includes("Sleeve-cap ease")).map((issue) => ({ stage: "assembly" as const,
      sourceId: issue.sourceId,
      message: `${issue.message} Polo front/back flats are withheld until this sleeve-cap join is within the 0.25 cm acceptance tolerance.`,
    })));
  }
  if (recipe.name === "skirt" && input.placements.some((placement) => placement.pieceRole === "waistband")) {
    issues.push({ stage: "overlay", sourceId: "style:artwork:waistband",
      message: "Artwork targeting the Skirt waistband is withheld until its face-specific segment can be clipped without crossing the side-seam boundary. Reposition it on the front or back panel." });
  }
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
  const face = mapping?.faces.find((candidate) => candidate.kind === kind);
  const overlayFace = overlays.faces?.find((candidate) => candidate.kind === kind);
  const bandArtwork = recipe.name === "trouser" ? (overlayFace?.artwork ?? []).filter((primitive) => primitive.targetRoleId === "waistband") : [];
  for (const artwork of bandArtwork) issues.push({ stage: "overlay", sourceId: artwork.source.sourceId,
    message: "Artwork on the Trouser waistband is withheld until its exact source placement can be clipped to one sewn front/back fragment." });
  const faceRoleIds = face?.roles.map((role) => role.roleId) ?? [];
  const fragmentPrimitiveIds = new Set(waistbandFragments.primitives.map((primitive) => primitive.id));
  const outputSpaceCalloutIds = new Set((poms.callouts ?? []).map((primitive) => primitive.id));
  const geometryPrimitives = recipe.name === "trouser" ? geometry.primitives.filter((primitive) =>
    primitive.source.sourceId !== "pattern:trouser:role:waistband"
      && !primitive.source.sourceId.startsWith("pattern:trouser:mark:waistband:")) : geometry.primitives;
  const combined = [...geometryPrimitives, ...waistbandFragments.primitives,
    ...(overlayFace?.artwork ?? []).filter((primitive) => !bandArtwork.includes(primitive)), ...(poms.callouts ?? [])];
  const transformed: TechnicalFlatPrimitive[] = [];
  for (const primitive of combined) {
    if (outputSpaceCalloutIds.has(primitive.id)) {
      transformed.push(primitive);
      continue;
    }
    if (fragmentPrimitiveIds.has(primitive.id)) {
      transformed.push(primitive);
      continue;
    }
    const roleId = technicalFlatPrimitiveRole(primitive, combined, faceRoleIds);
    for (const { placed, placement } of placeTechnicalFlatPrimitive(primitive, roleId, assembly.transforms[roleId], issues)) {
      const projectionRole = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
        .find((candidate) => candidate.roleId === roleId);
      const oppositeSide = projectionRole?.oppositeSideReflection;
      if (appendOppositeSideReflection(transformed, placed, oppositeSide, block, assembly.transforms, issues)) continue;
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
      } else {
        const viewPair = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
          .find((candidate) => candidate.roleId === roleId)?.viewPairReflection;
        appendApprovedViewPairReflection(transformed, placed, viewPair, block, assembly.transforms, issues);
        const physicalPair = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
          .find((candidate) => candidate.roleId === roleId)?.physicalPairReflection;
        if (!viewPair) appendPhysicalPairReflection(transformed, primitive, physicalPair, placement);
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
