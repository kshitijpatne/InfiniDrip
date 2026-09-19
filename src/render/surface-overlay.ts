// Surface preview overlay — artwork polygons as one SVG group string.
//
// Pure translation, no decisions: the caller supplies precomputed true-scale
// polygons and this module draws them in centimetre coordinates, using the same
// millimetre rounding as pieceToPath. Items render in ascending z-order so
// stacking is explicit in the markup. No app, view, or surface-model imports;
// wiring lands post-rebase in Slice 126, which also unifies the item shape
// with the placement contract.

import type { Point } from "../geometry/point";

/** One drawable artwork polygon. Polygons come from placement math. */
export interface OverlayItem {
  readonly id: string;
  readonly pieceRole: string;
  readonly kind: string;
  readonly polygon: readonly Point[];
  readonly zOrder: number;
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escapeAttr = (s: string): string => s.replace(/&|<|>|"/g, (ch) => ESCAPES[ch]);

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
