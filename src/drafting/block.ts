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

import { Piece } from "./piece";

export interface Block {
  readonly roles: Readonly<Record<string, Piece>>;
}

/** Build a block from its roles. Insertion order is the pattern's piece order. */
export function block(roles: Readonly<Record<string, Piece>>): Block {
  return { roles };
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
