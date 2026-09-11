// Component architecture, Phase A1 (Slice 49). Design: COMPONENT-ARCHITECTURE.md.
//
// The problem this closes: a seam relationship — "front shoulder sews to back
// shoulder" — exists today only as a hand-written assertion inside the checker
// (tshirt-checks.ts, skirt.ts). That's construction knowledge encoded backwards,
// in its own verification, instead of as data the rest of the system could read.
//
// This module is the data shape and nothing else: an Interface names a seam's
// edges, a Stitch says two interfaces join. Phase A1 is deliberately narrow —
// per COMPONENT-ARCHITECTURE.md §11 Q4, `Block` is NOT touched in this slice.
// No recipe declares a stitch yet. The proof this slice owes (stitch.test.ts)
// is that stitches DECLARED AS DATA, run through stitchChecks, reproduce the
// real hand-written checks byte-for-byte on real drafted blocks. Phase A2 is
// the slice where `Block` actually grows a `stitches` field and recipes commit
// to it; until then this is a pure library, safe to add with zero blast radius.

import { Block, rolePiece } from "./block";
import { pieceEdge, edgeLength } from "./piece";
import { CheckResult, matchLengths, inBand } from "../guidance/check";
import { distance } from "../geometry";

/** One named edge on one piece, addressed the same way the checker always has:
 *  by role ("front", "back", "sleeve") and edge name ("shoulder", "armhole"). */
export interface EdgeRef {
  readonly piece: string;
  readonly edge: string;
}
export const edgeRef = (piece: string, edge: string): EdgeRef => ({ piece, edge });

/** A sewable internal cut line. A slash has two physical sides, so `side`
 * keeps each attachment explicit while both sides measure the same line. */
export interface MarkRef {
  readonly piece: string;
  readonly mark: string;
  readonly side: "left" | "right";
}
export const markRef = (piece: string, mark: string, side: "left" | "right"): MarkRef =>
  ({ piece, mark, side });

export type InterfaceRef = EdgeRef | MarkRef;

/** An ordered set of edges that acts as one connectable seam. Multi-edge on
 *  purpose, not a simplification added later: a darted front's side seam is
 *  two edges (sideUpper + sideLower), a sleeve cap is capLeft + capRight, and
 *  an armhole spans front AND back. All three are real, existing cases. */
export interface Interface {
  readonly edges: readonly InterfaceRef[];
}
export const iface = (...edges: readonly InterfaceRef[]): Interface => ({ edges });

/**
 * Two interfaces sewn together. `ease`, when present, means the two sides are
 * allowed to differ by an amount in [lo, hi] cm — the sleeve-cap case, eased a
 * touch longer than the armhole it sets into. Omitted means they must match
 * within `matchLengths`'s own tolerance (0.1cm) — an ordinary seam.
 */
export interface Stitch {
  readonly label: string;
  readonly a: Interface;
  readonly b: Interface;
  readonly ease?: { readonly lo: number; readonly hi: number };
}

/** The total length of an interface: every one of its edges, summed. A
 *  single-edge interface is just that edge's length — the common case falls
 *  out of the general one for free. */
export function interfaceLength(b: Block, i: Interface): number {
  return i.edges.reduce((sum, r) => sum + interfaceRefLength(rolePiece(b, r.piece), r), 0);
}

function interfaceRefLength(piece: ReturnType<typeof rolePiece>, ref: InterfaceRef): number {
  if ("edge" in ref) return edgeLength(pieceEdge(piece, ref.edge));
  const mark = piece.marks?.find((candidate) => candidate.name === ref.mark);
  if (!mark) throw new Error(`Piece "${piece.name}" has no mark named "${ref.mark}"`);
  if (!("start" in mark)) throw new Error(`Piece "${piece.name}" mark "${ref.mark}" is not a line`);
  return distance(mark.start, mark.end);
}

/**
 * Every declared stitch, checked against a real drafted block: matched
 * lengths for an ordinary seam, or within an ease band for one that
 * deliberately isn't 1:1 (a sleeve cap). Uses the SAME primitives
 * (matchLengths, inBand) the hand-written checks already used — this is not
 * a reimplementation of the check logic, only of how the two sides of a
 * seam are named and summed.
 */
export function stitchChecks(b: Block, stitches: readonly Stitch[]): CheckResult[] {
  return stitches.map((s) => {
    const la = interfaceLength(b, s.a);
    const lb = interfaceLength(b, s.b);
    return s.ease ? inBand(s.label, la - lb, s.ease.lo, s.ease.hi) : matchLengths(s.label, la, lb);
  });
}

/**
 * Phase A3 (Slice 51, COMPONENT-ARCHITECTURE.md §9). A matched notch exists
 * *because* two edges are stitched together — so read the edge name off the
 * stitch itself instead of re-typing it in a separate notch table, where it
 * could silently drift from the seam it's meant to mark.
 *
 * `edgeIndex` picks which edge of a multi-edge interface carries the notch
 * (the fitted side seam is two edges, sideUpper + sideLower; the notch sits
 * on sideLower, index 1). Only for a plain, un-eased, 1:1 seam — the return
 * shape is deliberately structural (not `NotchRule`, imported from
 * render/notch.ts) so this stays a drafting-layer function with no
 * dependency on render: drafting -> render would be a real cycle, since
 * render/notch.ts already imports the drafting barrel.
 */
export function matchedNotch(
  stitch: Stitch,
  side: "a" | "b",
  t: number,
  edgeIndex = 0
): { readonly edgeName: string; readonly t: number } {
  const ref = stitch[side].edges[edgeIndex];
  if (!ref || !("edge" in ref)) {
    throw new Error("matchedNotch requires an exterior edge reference");
  }
  return { edgeName: ref.edge, t };
}
