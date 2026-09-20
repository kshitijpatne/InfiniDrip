// Surface artwork placement model — pure data describing artwork on pieces.
//
// Surface design never changes geometry: a placement names a piece role and puts a
// true-scale artwork rectangle on it (translate / uniform scale / rotate, with an
// explicit z-order for stacking). Validation reports problems as data so guidance
// can warn with actionable corrections; nothing here clamps or rewrites input.
// Persistence wiring and renderer bindings arrive in later slices; this module
// stays dependency-free so the contract is testable headlessly.

export type ArtworkKind = "print" | "patch" | "color-block";

/** Placement transform in centimetres and degrees. Rotation accepts any finite range. */
export interface PlacementTransform {
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
  readonly rotationDeg: number;
}

/** One artwork rectangle placed on one piece role, at true scale before transform.
 * `sourcePxWidth`/`sourcePxHeight` are optional source-artwork pixel dimensions
 * (Slice 130): present means print resolution is ratable, absent means unknown
 * and never a failure. */
export interface ArtworkPlacement {
  readonly id: string;
  readonly kind: ArtworkKind;
  readonly pieceRole: string;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly transform: PlacementTransform;
  readonly zOrder: number;
  readonly sourceName: string;
  readonly sourcePxWidth?: number;
  readonly sourcePxHeight?: number;
}

/** A style's full artwork set. Shared across graded sizes by design. */
export interface StyleSurface {
  readonly styleName: string;
  readonly placements: readonly ArtworkPlacement[];
}

export const EMPTY_TRANSFORM: PlacementTransform = { dx: 0, dy: 0, scale: 1, rotationDeg: 0 };

/** Empty artwork set for a style. */
export function emptyStyleSurface(styleName: string): StyleSurface {
  return { styleName, placements: [] };
}

export function isArtworkKind(value: unknown): value is ArtworkKind {
  return value === "print" || value === "patch" || value === "color-block";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Actionable error for a transform, or null when it is usable. */
export function transformError(t: unknown): string | null {
  if (!isRecord(t)) return "Transform must be an object.";
  if (!finite(t.dx)) return "Transform dx: enter a finite number.";
  if (!finite(t.dy)) return "Transform dy: enter a finite number.";
  if (!finite(t.scale) || t.scale <= 0) return "Transform scale: enter a number above 0.";
  if (!finite(t.rotationDeg)) return "Transform rotationDeg: enter a finite number.";
  return null;
}

/** Actionable error for a placement, or null when it is usable. */
export function placementError(p: unknown): string | null {
  if (!isRecord(p)) return "Placement must be an object.";
  if (typeof p.id !== "string" || p.id.length === 0) return "Placement id: enter a non-empty name.";
  if (!isArtworkKind(p.kind)) return "Placement kind: choose print, patch, or color-block.";
  if (typeof p.pieceRole !== "string" || p.pieceRole.length === 0) {
    return "Placement pieceRole: enter a non-empty piece role.";
  }
  if (!finite(p.widthCm) || p.widthCm <= 0) return "Placement widthCm: enter a number above 0.";
  if (!finite(p.heightCm) || p.heightCm <= 0) return "Placement heightCm: enter a number above 0.";
  const badTransform = transformError(p.transform);
  if (badTransform) return `Placement transform: ${badTransform}`;
  if (!finite(p.zOrder) || !Number.isInteger(p.zOrder)) return "Placement zOrder: enter a whole number.";
  if (typeof p.sourceName !== "string") return "Placement sourceName: enter text.";
  if (p.sourcePxWidth !== undefined && (!finite(p.sourcePxWidth) || p.sourcePxWidth <= 0)) {
    return "Placement sourcePxWidth: enter a number above 0, or leave it empty.";
  }
  if (p.sourcePxHeight !== undefined && (!finite(p.sourcePxHeight) || p.sourcePxHeight <= 0)) {
    return "Placement sourcePxHeight: enter a number above 0, or leave it empty.";
  }
  return null;
}

/** Insert or replace by id, so ids stay unique without hiding input. */
export function addPlacement(surface: StyleSurface, placement: ArtworkPlacement): StyleSurface {
  const rest = surface.placements.filter((existing) => existing.id !== placement.id);
  return { styleName: surface.styleName, placements: [...rest, placement] };
}

/** Remove by id. Unknown ids leave the set unchanged. */
export function removePlacement(surface: StyleSurface, id: string): StyleSurface {
  return { styleName: surface.styleName, placements: surface.placements.filter((p) => p.id !== id) };
}

/** Map any finite rotation into [0, 360). The stored value is never rewritten. */
export function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** True-scale artwork size after the uniform scale is applied. */
export function effectiveSize(p: ArtworkPlacement): { widthCm: number; heightCm: number } {
  return { widthCm: p.widthCm * p.transform.scale, heightCm: p.heightCm * p.transform.scale };
}
