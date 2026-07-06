// The freeform edit engine — pure geometry, no DOM.
//
// A drafted Piece is a closed loop of named edges. To edit it by hand we expose
// its movable points as *handles*:
//   • a VERTEX handle at each corner (where two edges meet), and
//   • two CONTROL handles for every curve edge (the Bézier "magnets").
//
// `moveHandle` returns a NEW piece with one handle dragged to a new spot — and,
// for a vertex, it moves BOTH edges that share that corner so the outline stays
// closed. That single primitive is what dart manipulation will later rotate
// around an apex; here it just follows the pointer.
//
// This engine is garment-agnostic: it moves points on any Piece and knows
// nothing about t-shirts. It also does not enforce the fold — freeform means
// freeform, so dragging a centre-fold vertex off x=0 is allowed (and on you).

import { Point, distance } from "../geometry";
import { Edge, Piece, edgeStart } from "../drafting";

export type Handle =
  | { readonly id: string; readonly kind: "vertex"; readonly edge: number; readonly pos: Point }
  | {
      readonly id: string;
      readonly kind: "control";
      readonly edge: number;
      readonly which: 1 | 2;
      readonly pos: Point;
    };

/** Every draggable point on a piece: a vertex per corner, two controls per curve. */
export function pieceHandles(piece: Piece): Handle[] {
  const out: Handle[] = [];
  piece.edges.forEach((e, i) => {
    out.push({ id: `v${i}`, kind: "vertex", edge: i, pos: edgeStart(e) });
    if (e.kind === "curve") {
      out.push({ id: `c${i}a`, kind: "control", edge: i, which: 1, pos: e.curve.control1 });
      out.push({ id: `c${i}b`, kind: "control", edge: i, which: 2, pos: e.curve.control2 });
    }
  });
  return out;
}

function withStart(e: Edge, p: Point): Edge {
  return e.kind === "line" ? { ...e, start: p } : { ...e, curve: { ...e.curve, start: p } };
}
function withEnd(e: Edge, p: Point): Edge {
  return e.kind === "line" ? { ...e, end: p } : { ...e, curve: { ...e.curve, end: p } };
}
function withControl(e: Edge, which: 1 | 2, p: Point): Edge {
  if (e.kind !== "curve") return e; // only curves have controls; guarded by the caller
  return which === 1
    ? { ...e, curve: { ...e.curve, control1: p } }
    : { ...e, curve: { ...e.curve, control2: p } };
}

/** Return a new piece with `handle` moved to `to` (a vertex moves both its edges). */
export function moveHandle(piece: Piece, handle: Handle, to: Point): Piece {
  const edges = piece.edges.slice();
  if (handle.kind === "control") {
    edges[handle.edge] = withControl(edges[handle.edge], handle.which, to);
  } else {
    const n = edges.length;
    const prev = (handle.edge - 1 + n) % n;
    edges[handle.edge] = withStart(edges[handle.edge], to); // this corner starts here…
    edges[prev] = withEnd(edges[prev], to); // …and the previous edge ends here
  }
  return { ...piece, edges };
}

/** The handle nearest to `p`, or null if the closest is still farther than `maxDist`. */
export function nearestHandle(
  handles: readonly Handle[],
  p: Point,
  maxDist: number
): Handle | null {
  let best: Handle | null = null;
  let bestD = maxDist;
  for (const h of handles) {
    const d = distance(h.pos, p);
    if (d <= bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}

export interface ViewBox {
  readonly minX: number;
  readonly minY: number;
  readonly w: number;
  readonly h: number;
}

/** The cm box the editor draws in: the piece's handles, padded by `margin` cm. */
export function editorViewBox(piece: Piece, margin = 4): ViewBox {
  const pts = pieceHandles(piece).map((h) => h.pos);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs) - margin;
  const minY = Math.min(...ys) - margin;
  return { minX, minY, w: Math.max(...xs) + margin - minX, h: Math.max(...ys) + margin - minY };
}

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Map an on-screen pointer (clientX/Y within `rect`) to a cm point in `vb`. */
export function viewboxPointToCm(clientX: number, clientY: number, rect: Rect, vb: ViewBox): Point {
  return {
    x: vb.minX + ((clientX - rect.left) / rect.width) * vb.w,
    y: vb.minY + ((clientY - rect.top) / rect.height) * vb.h,
  };
}
