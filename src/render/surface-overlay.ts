// Surface preview overlay — artwork polygons as one SVG group string.
//
// Pure translation, no decisions: the caller supplies precomputed true-scale
// polygons and this module draws them in centimetre coordinates, using the same
// millimetre rounding as pieceToPath. Items render in ascending z-order so
// stacking is explicit in the markup. The placement contract lives in
// surface/placement; this module takes caller-computed polygons so preview
// stays a pure translation with an acyclic, type-only model link.

import type { Point } from "../geometry/point";
import type { ArtworkPlacement } from "../surface/placement";

/** One drawable artwork polygon. Polygons come from placement math. */
export interface OverlayItem {
  readonly id: string;
  readonly pieceRole: string;
  readonly kind: string;
  readonly polygon: readonly Point[];
  readonly zOrder: number;
}

/** Adapt a placement plus its computed polygon for the overlay. */
export function overlayItem(placement: ArtworkPlacement, polygon: readonly Point[]): OverlayItem {
  return {
    id: placement.id,
    pieceRole: placement.pieceRole,
    kind: placement.kind,
    polygon,
    zOrder: placement.zOrder,
  };
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Escape user-controlled text for SVG attribute interpolation. */
export function escapeAttr(s: string): string {
  return s.replace(/&|<|>|"/g, (ch) => ESCAPES[ch]);
}

/** One SVG group holding every artwork polygon, tagged for inspection. */
export function surfaceOverlay(items: readonly OverlayItem[]): string {
  const ordered = [...items].sort((a, b) => a.zOrder - b.zOrder);
  const polygons = ordered.map((item) => {
    const points = item.polygon.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
    return `<polygon data-placement="${escapeAttr(item.id)}" data-piece="${escapeAttr(item.pieceRole)}" ` +
      `data-kind="${escapeAttr(item.kind)}" points="${points}" fill="none" stroke-width="0.1"/>`;
  });
  return `<g data-surface="overlay" data-count="${ordered.length}">${polygons.join("")}</g>`;
}
