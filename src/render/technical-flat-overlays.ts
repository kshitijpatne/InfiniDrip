import type { GarmentRecipe } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import type { ArtworkPlacement } from "../surface/placement";
import { placementError } from "../surface/placement";
import { artworkInPiece, artworkInsidePiece, pieceFrames, resolvePieceFrame } from "../surface/piece-frames";
import type { TechnicalFlatNotice, FlatArtworkPrimitive, TechnicalFlatViewKind } from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";

export type TechnicalFlatTextureCue = "smooth" | "woven" | "rib" | "heather";

export interface TechnicalFlatColorwayOverlay {
  readonly id: string;
  readonly revisionId: string;
  readonly colorHex: string;
  readonly texture: TechnicalFlatTextureCue;
  readonly shine: number;
  readonly targetRoleIds: readonly string[];
  readonly sourceId: "style:fabric-presentation";
}

export interface TechnicalFlatOverlayIssue {
  readonly code:
    | "INVALID_REVISION_ID"
    | "INVALID_COLORWAY"
    | "INVALID_PLACEMENT_LIST"
    | "INVALID_PLACEMENT"
    | "DUPLICATE_PLACEMENT_ID"
    | "UNSUPPORTED_RECIPE"
    | "INVALID_PATTERN_GEOMETRY"
    | "UNMAPPED_PLACEMENT_ROLE"
    | "MISSING_PIECE_FRAME";
  readonly sourceId: string;
  readonly message: string;
}

export interface TechnicalFlatFaceOverlays {
  readonly kind: TechnicalFlatViewKind;
  readonly revisionId: string;
  readonly colorway: TechnicalFlatColorwayOverlay;
  readonly artwork: readonly FlatArtworkPrimitive[];
  readonly notices: readonly TechnicalFlatNotice[];
}

export interface TechnicalFlatOverlaySet {
  readonly recipeId: string;
  readonly revisionId: string;
  readonly faces: readonly [TechnicalFlatFaceOverlays, TechnicalFlatFaceOverlays] | null;
  readonly issues: readonly TechnicalFlatOverlayIssue[];
}

const TEXTURES: readonly TechnicalFlatTextureCue[] = ["smooth", "woven", "rib", "heather"];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function polygonsOverlap(a: readonly { readonly x: number; readonly y: number }[], b: readonly { readonly x: number; readonly y: number }[]): boolean {
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const axis = { x: -(end.y - start.y), y: end.x - start.x };
      const aProjection = a.map((point) => point.x * axis.x + point.y * axis.y);
      const bProjection = b.map((point) => point.x * axis.x + point.y * axis.y);
      if (Math.max(...aProjection) <= Math.min(...bProjection)
        || Math.max(...bProjection) <= Math.min(...aProjection)) return false;
    }
  }
  return true;
}

/** Compile saved style artwork plus the selected fabric presentation metadata
 * against the same Block and revision. Asset bytes are not resolved here. */
export function compileTechnicalFlatOverlays(
  recipe: GarmentRecipe,
  block: Block,
  revisionId: string,
  rawPlacements: unknown,
  colorHex: unknown,
  texture: unknown,
  shine: unknown,
): TechnicalFlatOverlaySet {
  const recipeId = recipe.name;
  const issues: TechnicalFlatOverlayIssue[] = [];
  if (typeof revisionId !== "string" || !revisionId.trim()) {
    issues.push({ code: "INVALID_REVISION_ID", sourceId: recipeId,
      message: "Choose or restore a valid saved design revision before showing surface overlays." });
  }
  if (typeof colorHex !== "string" || !/^#[0-9a-f]{6}$/i.test(colorHex)
    || typeof texture !== "string" || !TEXTURES.includes(texture as TechnicalFlatTextureCue)
    || typeof shine !== "number" || !Number.isFinite(shine) || shine < 0 || shine > 100) {
    issues.push({ code: "INVALID_COLORWAY", sourceId: "style:fabric-presentation",
      message: "Choose a valid six-digit fabric color, supported appearance cue and shine value from 0 to 100." });
  }
  if (!Array.isArray(rawPlacements)) {
    issues.push({ code: "INVALID_PLACEMENT_LIST", sourceId: `style:artwork:${recipeId}`,
      message: "Saved surface artwork must be a placement list." });
  }
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!mapping) {
    issues.push({ code: "UNSUPPORTED_RECIPE", sourceId: recipeId,
      message: `Recipe “${recipe.label}” has no admitted technical-flat overlay map.` });
  }
  if (issues.length > 0 || !mapping || typeof revisionId !== "string"
    || typeof colorHex !== "string" || typeof texture !== "string" || typeof shine !== "number"
    || !Array.isArray(rawPlacements)) {
    return { recipeId, revisionId: typeof revisionId === "string" ? revisionId : "", faces: null, issues };
  }

  let frames;
  try {
    frames = pieceFrames(block, recipe.allowances);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "pattern geometry could not be framed";
    return { recipeId, revisionId, faces: null, issues: [{
      code: "INVALID_PATTERN_GEOMETRY", sourceId: `pattern:${recipeId}`,
      message: `Artwork overlays need valid cut frames for this pattern revision: ${detail}.`,
    }] };
  }
  const placements: ArtworkPlacement[] = [];
  const placementIds = new Set<string>();
  for (const [index, candidate] of rawPlacements.entries()) {
    const error = placementError(candidate);
    if (error || !isRecord(candidate) || typeof candidate.sourceName !== "string" || !candidate.sourceName.trim()) {
      issues.push({ code: "INVALID_PLACEMENT", sourceId: `style:artwork:${index}`,
        message: error ?? "Artwork source name is empty; label the placement before showing it on a flat." });
      continue;
    }
    const placement = candidate as unknown as ArtworkPlacement;
    if (placementIds.has(placement.id)) {
      issues.push({ code: "DUPLICATE_PLACEMENT_ID", sourceId: `style:artwork:${placement.id}`,
        message: `Artwork placement id “${placement.id}” is repeated; give each placement a unique id.` });
      continue;
    }
    placementIds.add(placement.id);
    placements.push(placement);
  }

  const compileFace = (face: (typeof mapping.faces)[number]): TechnicalFlatFaceOverlays => {
    const visibleRoleIds = face.roles.filter((role) => role.treatment !== "INTERIOR_HIDDEN").map((role) => role.roleId);
    const artwork: FlatArtworkPrimitive[] = [];
    const notices: TechnicalFlatNotice[] = [];
    const placedPolygons: Array<{ placement: ArtworkPlacement; polygon: ReturnType<typeof artworkInPiece> }> = [];
    for (const placement of placements) {
      const role = face.roles.find((candidate) => candidate.roleId === placement.pieceRole);
      if (!role) continue;
      if (role.treatment === "INTERIOR_HIDDEN") {
        notices.push({ id: `notice:${recipeId}:${face.kind}:artwork:${placement.id}:hidden`, feature: "artwork",
          reason: "HIDDEN_BY_VIEW", sourceId: `style:artwork:${placement.id}`,
          message: `Artwork “${placement.sourceName}” targets interior role “${placement.pieceRole}” and is hidden in this exterior view.` });
        continue;
      }
      const frame = resolvePieceFrame(frames, placement.pieceRole);
      if (!frame) {
        issues.push({ code: "MISSING_PIECE_FRAME", sourceId: `style:artwork:${placement.id}`,
          message: `Artwork “${placement.sourceName}” targets “${placement.pieceRole}”, but that role has no cut frame in this pattern revision.` });
        continue;
      }
      const centerX = (frame.minX + frame.maxX) / 2 + placement.transform.dx;
      const centerY = (frame.minY + frame.maxY) / 2 + placement.transform.dy;
      artwork.push({
        kind: "artwork",
        id: `flat:${recipeId}:${face.kind}:artwork:${placement.id}`,
        layer: "ARTWORK",
        feature: "artwork",
        source: { sourceClass: "USER_REFERENCE", sourceId: `style:artwork:${placement.id}`, revisionId },
        artworkKind: placement.kind,
        placementId: placement.id,
        ...(placement.assetId ? { assetId: placement.assetId } : {}),
        sourceName: placement.sourceName,
        targetRoleId: placement.pieceRole,
        widthCm: placement.widthCm,
        heightCm: placement.heightCm,
        transform: { dx: centerX, dy: centerY, scale: placement.transform.scale, rotationDegrees: placement.transform.rotationDeg },
        zOrder: placement.zOrder,
      });
      const polygon = artworkInPiece(placement, frame);
      placedPolygons.push({ placement, polygon });
      if (!placement.assetId) {
        notices.push({ id: `notice:${recipeId}:${face.kind}:artwork:${placement.id}:asset`, feature: "artwork",
          reason: "SOURCE_REFERENCE_MISSING", sourceId: `style:artwork:${placement.id}`,
          message: `Artwork “${placement.sourceName}” has no asset reference; only its saved placement rectangle can be shown.` });
      }
      if (!artworkInsidePiece(placement, frame)) {
        notices.push({ id: `notice:${recipeId}:${face.kind}:artwork:${placement.id}:bounds`, feature: "artwork",
          reason: "OPTION_TOPOLOGY_MISMATCH", sourceId: `style:artwork:${placement.id}`,
          message: `Artwork “${placement.sourceName}” extends beyond role “${placement.pieceRole}”; move or reduce it before judging the flat.` });
      }
    }
    for (let left = 0; left < placedPolygons.length; left += 1) {
      for (let right = left + 1; right < placedPolygons.length; right += 1) {
        const a = placedPolygons[left];
        const b = placedPolygons[right];
        if (a.placement.pieceRole === b.placement.pieceRole && polygonsOverlap(a.polygon, b.polygon)) {
          notices.push({ id: `notice:${recipeId}:${face.kind}:artwork-overlap:${a.placement.id}:${b.placement.id}`,
            feature: "artwork", reason: "OPTION_TOPOLOGY_MISMATCH", sourceId: `style:artwork:${a.placement.id}`,
            message: `Artwork “${a.placement.sourceName}” overlaps “${b.placement.sourceName}” on role “${a.placement.pieceRole}”; review the z-order and rendered legibility.` });
        }
      }
    }
    return {
      kind: face.kind,
      revisionId,
      colorway: {
        id: `flat:${recipeId}:${face.kind}:colorway:fabric`, revisionId, colorHex,
        texture: texture as TechnicalFlatTextureCue, shine, targetRoleIds: visibleRoleIds,
        sourceId: "style:fabric-presentation" as const,
      },
      artwork: artwork.sort((a, b) => a.zOrder - b.zOrder),
      notices,
    };
  };
  const faceResults: [TechnicalFlatFaceOverlays, TechnicalFlatFaceOverlays] = [
    compileFace(mapping.faces[0]), compileFace(mapping.faces[1]),
  ];

  for (const placement of placements) {
    if (!mapping.faces.some((face) => face.roles.some((role) => role.roleId === placement.pieceRole))) {
      issues.push({ code: "UNMAPPED_PLACEMENT_ROLE", sourceId: `style:artwork:${placement.id}`,
        message: `Artwork “${placement.sourceName}” targets “${placement.pieceRole}”, which has no front/back technical-flat mapping.` });
    }
  }

  return { recipeId, revisionId, faces: issues.length === 0 ? faceResults : null, issues };
}
