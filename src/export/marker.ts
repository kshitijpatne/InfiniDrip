// The graded marker — the whole size run nested on ONE bolt of cloth.
//
// The single-size Nesting view answers "how much cloth for one garment?". A
// marker answers the question a cutting room actually asks: "how much cloth to
// cut this entire size run at once?" — every size's pieces packed together, the
// way they're really laid up before the cutter walks the table.
//
// It is the SAME estimator (`nestPieces`) fed a bigger pile. The only new work is
// labelling: 5 sizes × 3 pieces would otherwise be fifteen shapes all reading
// "FRONT", so each flat piece is retagged "<SIZE> <piece>" before packing.
//
// Still an estimator, not a production marker: bounding-box shelf pack, grain
// upright, no interlock (see nesting.ts). What's true here is the cloth length and
// the true-area utilization for the run as a whole.

import { Measurements, GarmentRecipe, gradeRun, blockPieces } from "../drafting";
import { flattenPiece, FlatPiece } from "./layout";
import { nestPieces, NestResult } from "./nesting";

/** Re-label a flat piece with its size, so the marker is readable. */
function labelWithSize(flat: FlatPiece, sizeLabel: string): FlatPiece {
  return { name: `${sizeLabel} ${flat.name}`, sew: flat.sew, cut: flat.cut };
}

/** Every piece of every graded size, cut-ready and size-labelled, in one list. */
export function markerPieces(recipe: GarmentRecipe, m: Measurements): FlatPiece[] {
  const run = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft);
  return run.flatMap((g) =>
    blockPieces(g.block).map((p) => labelWithSize(flattenPiece(p, recipe.allowances), g.label))
  );
}

/** Nest the whole size run on one bolt: the graded marker. */
export function gradedMarker(
  recipe: GarmentRecipe,
  m: Measurements,
  fabricWidth: number
): NestResult {
  return nestPieces(markerPieces(recipe, m), fabricWidth);
}
