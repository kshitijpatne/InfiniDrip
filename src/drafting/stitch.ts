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

/** One named edge on one piece, addressed the same way the checker always has:
 *  by role ("front", "back", "sleeve") and edge name ("shoulder", "armhole"). */
export interface EdgeRef {
  readonly piece: string;
  readonly edge: string;
}
export const edgeRef = (piece: string, edge: string): EdgeRef => ({ piece, edge });

/** An ordered set of edges that acts as one connectable seam. Multi-edge on
 *  purpose, not a simplification added later: a darted front's side seam is
 *  two edges (sideUpper + sideLower), a sleeve cap is capLeft + capRight, and
 *  an armhole spans front AND back. All three are real, existing cases. */
export interface Interface {
  readonly edges: readonly EdgeRef[];
}
export const iface = (...edges: readonly EdgeRef[]): Interface => ({ edges });

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
  return i.edges.reduce((sum, r) => sum + edgeLength(pieceEdge(rolePiece(b, r.piece), r.edge)), 0);
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
