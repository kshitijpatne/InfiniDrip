// A block is one garment's full set of drafted pieces, each sitting in a named
// structural ROLE ("front", "back", "sleeve", ...). The engine (grading, POM,
// checker, render, export) never names a role: it walks `blockPieces` and works
// on whatever the garment produced. Only a garment's own recipe asks for a role
// by name, because only the recipe knows the garment has one.
//
// Role is not the same thing as a piece's NAME. The role is the slot the piece
// fills in the garment; the name is its label on the pattern and in the notch
// table — the fitted garment fills the "front" role with a piece named
// "fitted front". Keeping the two apart is what lets a recipe rename or restyle
// a piece without the engine losing track of what it is.
//
// A garment with no sleeve simply has no "sleeve" role: `rolePiece` throws
// rather than handing back undefined, so a mismatch surfaces immediately
// instead of silently drafting a broken pattern.
//
// `stitches` (Phase A2, Slice 50 — COMPONENT-ARCHITECTURE.md §9) is the
// formal version of the same seam knowledge that used to live only inside
// hand-written checks: which edges sew to which. `import type` here is
// deliberate, not a style choice — stitch.ts imports Block/rolePiece from
// THIS file, so a normal (value) import back would be a real circular
// dependency; a type-only import is erased at compile time and never
// touches the runtime module graph, so the cycle is only ever a type-level
// one, which TypeScript resolves without issue.

import { Piece } from "./piece";
import type { Stitch } from "./stitch";

export interface Block {
  readonly roles: Readonly<Record<string, Piece>>;
  readonly stitches: readonly Stitch[];
}

/** Build a block from its roles and its stitches. Insertion order of roles is
 *  the pattern's piece order. */
export function block(roles: Readonly<Record<string, Piece>>, stitches: readonly Stitch[]): Block {
  return { roles, stitches };
}

/** Every drafted piece, in role order — what the engine iterates. */
export function blockPieces(b: Block): readonly Piece[] {
  return Object.values(b.roles);
}

/** The piece filling a role. Throws if the garment has no such role. */
export function rolePiece(b: Block, role: string): Piece {
  const found = b.roles[role];
  if (!found) throw new Error(`Block has no piece in role "${role}"`);
  return found;
}
