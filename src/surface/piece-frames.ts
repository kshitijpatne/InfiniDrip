// Piece frames — the anchor contract for artwork bounds validation.
//
// A placement's dx/dy offsets measure from the centre of its piece's
// true-scale cut bounding box (base/sample size, the same size the tech-pack
// sketch draws). That frame is explicit, deterministic, and computed from the
// actual draft — never invented. Out-of-bounds, coverage, and resolution
// guidance all read through it; nothing here changes drafting or exports.
//
// Layer note: this module consumes drafting and export geometry helpers. The
// dependency points one way (nothing in drafting or export imports surface),
// so the module graph stays acyclic.

import type { Block } from "../drafting/block";
import type { AllowanceSpec } from "../drafting/allowance";
import { flattenPiece, polylineBounds } from "../export/layout";
import { polygonArea } from "../export/nesting";
import type { Point } from "../geometry/point";
import { artworkCorners, boundingBox, effectiveResolution, type BoundingBox } from "./transform";
import { effectiveSize, type ArtworkPlacement } from "./placement";
import { surfacePlaceable } from "./store";

/** One piece's true-scale cut frame at base size, in drafting-plane centimetres. */
export interface PieceFrame {
  readonly role: string;
  readonly name: string;
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  /** Cut-outline area in cm² (shoelace). Zero or negative means degenerate. */
  readonly areaCm2: number;
}

/** Frames addressable by role first, then by piece name. Exact matches only. */
export interface PieceFrameSet {
  readonly frames: ReadonlyMap<string, PieceFrame>;
  readonly roles: readonly string[];
}

/** True-scale cut frames for every role in the block, at base size. Addressable
 * by role or by piece name; roles always win because they are set last. */
export function pieceFrames(block: Block, allowance: AllowanceSpec): PieceFrameSet {
  const frames = new Map<string, PieceFrame>();
  const roles: string[] = [];
  for (const [role, piece] of Object.entries(block.roles)) {
    const flat = flattenPiece(piece, allowance);
    const bounds = polylineBounds(flat.cut);
    const frame: PieceFrame = {
      role,
      name: piece.name,
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.minX + bounds.width,
      maxY: bounds.minY + bounds.height,
      areaCm2: polygonArea(flat.cut),
    };
    frames.set(piece.name, frame);
    frames.set(role, frame);
    roles.push(role);
  }
  return { frames, roles };
}

/** Resolve a placement's piece role: exact role first, then exact piece name. */
export function resolvePieceFrame(set: PieceFrameSet, pieceRole: string): PieceFrame | null {
  return set.frames.get(pieceRole) ?? null;
}

/** Artwork corners in piece-frame coordinates: the artwork centre sits at the
 * piece-box centre plus the placement offset. */
export function artworkInPiece(p: ArtworkPlacement, frame: PieceFrame): Point[] {
  const cx = (frame.minX + frame.maxX) / 2;
  const cy = (frame.minY + frame.maxY) / 2;
  return artworkCorners(p.widthCm, p.heightCm, {
    dx: 0, dy: 0, scale: p.transform.scale, rotationDeg: p.transform.rotationDeg,
  }).map((corner) => ({ x: corner.x + cx + p.transform.dx, y: corner.y + cy + p.transform.dy }));
}

/** Bounding box of artwork corners. Callers pass non-empty corner lists. */
export function artworkBounds(corners: readonly Point[]): BoundingBox {
  const box = boundingBox(corners);
  if (!box) throw new Error("artworkBounds needs at least one corner.");
  return box;
}

/** True when every artwork corner sits inside (or exactly on) the piece box. */
export function artworkInsidePiece(p: ArtworkPlacement, frame: PieceFrame): boolean {
  const box = artworkBounds(artworkInPiece(p, frame));
  const outer: BoundingBox = { minX: frame.minX, minY: frame.minY, maxX: frame.maxX, maxY: frame.maxY };
  return outer.minX <= box.minX && box.maxX <= outer.maxX &&
    outer.minY <= box.minY && box.maxY <= outer.maxY;
}

/** Artwork area over piece area. Null when either side is unmeasurable. */
export function coverageRatio(p: ArtworkPlacement, frame: PieceFrame): number | null {
  if (!surfacePlaceable(p)) return null;
  if (!(frame.areaCm2 > 0)) return null;
  const size = effectiveSize(p);
  return (size.widthCm * size.heightCm) / frame.areaCm2;
}

/** Effective print resolution from persisted source dimensions. Null when the
 * placement carries no ratable source size (unknown is never a failure). */
export function artworkResolution(p: ArtworkPlacement): { xPxPerCm: number; yPxPerCm: number } | null {
  if (p.sourcePxWidth === undefined || p.sourcePxHeight === undefined) return null;
  if (!surfacePlaceable(p)) return null;
  return effectiveResolution(p.sourcePxWidth, p.sourcePxHeight, p.widthCm, p.heightCm, p.transform.scale);
}
