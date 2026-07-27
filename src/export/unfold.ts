// Unfolding — a cut-on-fold half piece mirrored to its full width.
//
// Convention (from the drafting engine): a piece with `onFold: true` keeps its
// fold on the x = 0 axis. The flattened outline touches that axis only at the
// fold-edge points; everything else sits at x > 0. Unfolding walks the off-fold
// path once and appends its mirror image (x → −x) reversed, producing ONE closed
// full-width loop with no seam down the middle. A projector file wants exactly
// that: projector cutting happens on single-layer fabric, so there is no fold to
// cut on — the piece must be shown at its real, full width.

import { Point } from "../geometry";
import { Polyline, FlatPiece } from "./layout";

/** Points closer than this (cm) to x = 0 count as ON the fold. */
export const FOLD_EPS = 0.01;

const onFold = (p: Point): boolean => Math.abs(p.x) <= FOLD_EPS;

/** Mirror a closed loop about the x = 0 fold into one full-width loop.
 *  A loop that never leaves — or never touches — the fold is returned unchanged. */
export function unfoldLoop(loop: Polyline): Polyline {
  const n = loop.length;
  let start = -1;
  for (let i = 0; i < n; i++) {
    if (onFold(loop[i]) && !onFold(loop[(i + 1) % n])) { start = i; break; }
  }
  if (start === -1) return loop;
  // Walk the off-fold path from the fold's edge until it comes back to the fold.
  const path: Point[] = [loop[start]];
  let i = (start + 1) % n;
  while (!onFold(loop[i])) {
    path.push(loop[i]);
    i = (i + 1) % n;
  }
  path.push(loop[i]);
  // Interior fold points (colinear on x = 0) are dropped; the mirror closes the loop.
  const mirrored = path.slice(1, -1).reverse().map((p) => ({ x: -p.x, y: p.y }));
  return [...path, ...mirrored];
}

/** Unfold a flat piece when it was drafted on the fold; pass through otherwise. */
export function unfoldFlat(flat: FlatPiece, wasOnFold: boolean): FlatPiece {
  if (!wasOnFold) return flat;
  return { name: flat.name, sew: unfoldLoop(flat.sew), cut: unfoldLoop(flat.cut) };
}
