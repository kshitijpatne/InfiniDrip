// A block is one garment's full set of drafted pieces. Every garment recipe
// produces the same shape, which is what lets the engine (grading, POM, checker,
// render, export) work on any garment without knowing which one it has.

import { Piece } from "./piece";

export interface Block {
  readonly front: Piece;
  readonly back: Piece;
  readonly sleeve: Piece;
}
