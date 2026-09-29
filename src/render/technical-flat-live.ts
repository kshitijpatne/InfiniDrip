import type { GarmentRecipe } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import type { ArtworkPlacement } from "../surface/placement";
import type { TechnicalFlatColorwayOverlay } from "./technical-flat-overlays";
import {
  TECHNICAL_FLAT_SCHEMA_VERSION,
  type TechnicalFlatPrimitive,
  type TechnicalFlatView,
  type TechnicalFlatViewKind,
} from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
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

export function technicalFlatPrimitiveRole(primitive: TechnicalFlatPrimitive, primitives: readonly TechnicalFlatPrimitive[], roleIds: readonly string[]): string {
  if (primitive.kind === "artwork") return primitive.targetRoleId;
  const sourceId = primitive.kind === "callout"
    ? primitives.find((candidate) => candidate.id === primitive.anchor.primitiveId)?.source.sourceId ?? ""
    : primitive.source.sourceId;
  return roleIds.find((roleId) => sourceId.includes(`role:${roleId}`)
    || sourceId.includes(`mark:${roleId}:`) || sourceId.includes(`dart:${roleId}:`)) ?? "";
}

/** Compose one face from a single exact block, revision and sewn-role solution. */
export function compileTechnicalFlatLiveView(input: TechnicalFlatLiveInput): TechnicalFlatLiveResult {
  const { recipe, block, revisionId, kind } = input;
  const geometry = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, kind);
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
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
  const face = mapping?.faces.find((candidate) => candidate.kind === kind);
  const overlayFace = overlays.faces?.find((candidate) => candidate.kind === kind);
  const faceRoleIds = face?.roles.map((role) => role.roleId) ?? [];
  const combined = [...geometry.primitives, ...(overlayFace?.artwork ?? []), ...(poms.callouts ?? [])];
  const transformed: TechnicalFlatPrimitive[] = [];
  for (const primitive of combined) {
    const roleId = technicalFlatPrimitiveRole(primitive, combined, faceRoleIds);
    const placement = assembly.transforms[roleId];
    if (!placement) {
      issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
        message: `Source “${primitive.source.sourceId}” has no sewn placement on this face; the flat is withheld.` });
      continue;
    }
    transformed.push(transformFlatPrimitive(primitive, { offset: placement.offset,
      rotationDegrees: placement.rotationDegrees, mirrorX: false }));
  }
  if (!mapping || !face) issues.push({ stage: "geometry", sourceId: recipe.name,
    message: `Recipe “${recipe.label}” has no admitted ${kind === "FRONT_FLAT" ? "front" : "back"} flat mapping.` });
  if (issues.length > 0 || !overlayFace || poms.callouts === null) return { view: null, colorway: null, issues };

  const notices = [
    ...geometry.notices,
    ...overlayFace.notices,
    ...poms.notices,
    ...assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL").map((issue) => ({
      id: `notice:${recipe.name}:${kind}:assembly:${issue.sourceId}`,
      feature: "seam" as const,
      reason: "SOURCE_NOT_REPRESENTED" as const,
      sourceId: issue.sourceId,
      message: issue.message,
    })),
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
