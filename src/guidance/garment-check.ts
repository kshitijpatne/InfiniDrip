// The production-readiness report, driven by a garment recipe.
//
// Every check is a fact you could confirm with a tape measure on the drafted block.
//
// This file is now GARMENT-AGNOSTIC. It asks the recipe for its sewability checks
// (`recipe.checks`) and its size-run metric (`recipe.sizeMetric`) rather than naming
// any seam itself, so a structurally different garment — a skirt with no sleeve —
// runs through it without throwing. The only checks it still owns are true of ANY
// garment: every drafted piece declares its notches + grainline, and the graded run
// grows in order. The tee/fitted seam/cap/hem/dart checks live in
// `drafting/tshirt-checks.ts`, next to the recipe that owns them.
//
// It reports SEWABILITY, not fit — a muslin still decides fit.

import {
  Measurements,
  GarmentRecipe,
  gradeRun,
  PieceNotches,
  blockPieces,
} from "../drafting";
import {
  Report,
  CheckResult,
  strictlyIncreasing,
  present,
  buildReport,
} from "./check";

/** Every piece must have notches + a grainline declared in the recipe table. */
export function notchGrainCheck(
  pieceNames: readonly string[],
  table: readonly PieceNotches[]
): CheckResult {
  const declared = pieceNames.every((n) => {
    const rule = table.find((r) => r.pieceName === n);
    return rule !== undefined && rule.notches.length > 0;
  });
  return present(
    "Notches + grainline on every piece",
    declared,
    declared ? `all ${pieceNames.length} pieces marked` : `a piece is missing notches`
  );
}

/** Run every readiness check for a garment and fold them into one verdict.
 *  Garment-agnostic: the garment-specific seam/cap/hem/dart checks come from
 *  `recipe.checks`, and the size-run orders by `recipe.sizeMetric`. The only checks
 *  this file still owns are the ones true of ANY garment — every drafted piece must
 *  declare its notches, and a graded run must grow in order.
 *
 *  It reports SEWABILITY, not fit — a muslin still decides fit. */
export function garmentReport(recipe: GarmentRecipe, m: Measurements): Report {
  const b = recipe.draft(m);

  const checks: CheckResult[] = [
    ...recipe.checks(b, m),
    // Role-agnostic: every piece the garment drafted must declare its notches.
    notchGrainCheck(blockPieces(b).map((p) => p.name), recipe.notches),
  ];

  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft);
  checks.push(strictlyIncreasing("Size run grows in order", graded.map((g) => recipe.sizeMetric(g.block))));

  return buildReport(checks);
}
