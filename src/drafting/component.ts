// Component architecture, adopted by Epic 4 Slices 106–109.
// Design rationale: COMPONENT-ARCHITECTURE.md §4.5.
//
// The problem this closes: `draftTshirt`/`draftFitted`/`draftSkirt` each build
// their whole block in one function — a bodice, a sleeve, a neckline, all
// tangled together per garment. A `Component` is one reusable piece of that
// (a bodice, a sleeve, a neckline), built independently and merged into a
// `Block` by a recipe's `draft` function.
//
// The original Phase B1 shape is now used by every registered recipe through
// `GarmentGrammar`. It remains intentionally strict: assembleComponents throws
// on a role collision instead of silently overwriting, so a wrong assumption
// fails loudly at composition time instead of drafting a garment with a
// missing piece.

import { Measurements } from "./measurements";
import { Piece } from "./piece";
import { Block, block } from "./block";
import { Stitch, Interface } from "./stitch";

/**
 * What one component contributes to a garment: the pieces it drafted (by
 * role — a Bodice contributes "front"/"back", the same role names a Block
 * uses today), the stitches internal to itself (e.g. a darted bodice's own
 * dart-leg relationship, if it ever has one), and the interfaces it exposes
 * for another component to sew onto (a Bodice's armhole, for a Sleeve to
 * attach to — the §2.4 case the design doc calls out by name).
 */
export interface ComponentResult {
  readonly pieces: Readonly<Record<string, Piece>>;
  readonly stitches: readonly Stitch[];
  readonly interfaces: Readonly<Record<string, Interface>>;
}

/** A component is a pure function, same shape as a garment's own `draft`:
 *  measurements + its own params in, one `ComponentResult` out. */
export type Component<P> = (m: Measurements, params: P) => ComponentResult;

/**
 * Merge component results — in the order a recipe built them, since a later
 * component may depend on an earlier one's exposed interface (the sleeve
 * needs the assembled bodice's armhole length; assembly is an ordered
 * pipeline, not a set) — plus the connecting stitches the recipe wires
 * between them, into one `Block`.
 *
 * A duplicate role across components is a real authoring mistake (two
 * components both claiming "front", say) and throws rather than silently
 * letting the later one win — the same "surface a mismatch immediately"
 * posture `rolePiece` already takes in block.ts.
 */
export function assembleComponents(
  results: readonly ComponentResult[],
  connectingStitches: readonly Stitch[] = []
): Block {
  const roles: Record<string, Piece> = {};
  const stitches: Stitch[] = [];

  for (const result of results) {
    for (const [role, piece] of Object.entries(result.pieces)) {
      if (role in roles) {
        throw new Error(`assembleComponents: role "${role}" claimed by more than one component`);
      }
      roles[role] = piece;
    }
    stitches.push(...result.stitches);
  }
  stitches.push(...connectingStitches);

  return block(roles, stitches);
}
