// The production-readiness report, driven by a garment recipe.
//
// Every check below is a fact you could confirm with a tape measure on the
// drafted block. Nothing here names a t-shirt: the edges that pair up and the
// facts a garment opts into come from the recipe (see drafting/recipe.ts), so a
// new garment gets checked the day it's added.
//
//   • the seams that sew together are the same length,
//   • the sleeve cap is eased into the armhole within a sane band,
//   • a trued hem meets the fold square (untrued fronts opt out),
//   • a dart's two legs are equal, so it closes cleanly,
//   • every piece declares its notches + grainline,
//   • the graded size run grows in order (no size crossing).
//
// It reports SEWABILITY, not fit — a muslin still decides fit.

import {
  Measurements,
  GarmentRecipe,
  Block,
  gradeRun,
  edgeLength,
  edgeStart,
  edgeEnd,
  pieceEdge,
  dartOf,
  PieceNotches,
} from "../drafting";
import {
  Report,
  CheckResult,
  matchLengths,
  inBand,
  squareCorner,
  strictlyIncreasing,
  present,
  buildReport,
} from "./check";

// A sleeve cap is eased a touch longer than its armhole; outside this band the
// sleeve either won't reach or won't set in. (Matches the guidance layer.)
const CAP_EASE_LO = -1;
const CAP_EASE_HI = 4;

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

/** Sum the named front edges — a darted front splits its side around the mouth. */
function sideSeamLength(block: Block, edges: readonly string[]): number {
  return edges.reduce((sum, name) => sum + edgeLength(pieceEdge(block.front, name)), 0);
}

/** A dart closes cleanly only if its two legs are the same length. */
export function dartLegCheck(block: Block): CheckResult | null {
  const d = dartOf(block.front);
  if (!d) return null;
  const legs = block.front.dart!.legs.map((n) => edgeLength(pieceEdge(block.front, n)));
  return matchLengths("Dart legs equal", legs[0], legs[1]);
}

/** Run every readiness check for a garment and fold them into one verdict. */
export function garmentReport(recipe: GarmentRecipe, m: Measurements): Report {
  const b = recipe.draft(m);

  const checks: CheckResult[] = [
    matchLengths(
      "Shoulder seam (front ↔ back)",
      edgeLength(pieceEdge(b.front, "shoulder")),
      edgeLength(pieceEdge(b.back, "shoulder"))
    ),
    matchLengths(
      "Side seam (front ↔ back)",
      sideSeamLength(b, recipe.checks.frontSideEdges),
      edgeLength(pieceEdge(b.back, "side"))
    ),
    matchLengths(
      "Sleeve underarm (left ↔ right)",
      edgeLength(pieceEdge(b.sleeve, "sideLeft")),
      edgeLength(pieceEdge(b.sleeve, "sideRight"))
    ),
    inBand(
      "Sleeve-cap ease",
      edgeLength(pieceEdge(b.sleeve, "capLeft")) + edgeLength(pieceEdge(b.sleeve, "capRight")) -
        (edgeLength(pieceEdge(b.front, "armhole")) + edgeLength(pieceEdge(b.back, "armhole"))),
      CAP_EASE_LO,
      CAP_EASE_HI
    ),
  ];

  // A trued hem leaves the fold at a right angle, so it's straight when unfolded.
  if (recipe.checks.hemSquareToFold) {
    const hem = pieceEdge(b.front, "hem");
    checks.push(
      squareCorner("Hem square to the fold", edgeStart(hem), edgeEnd(hem), edgeEnd(pieceEdge(b.front, "centerFront")))
    );
  }

  const dart = dartLegCheck(b);
  if (dart) checks.push(dart);

  checks.push(notchGrainCheck([b.front.name, b.back.name, b.sleeve.name], recipe.notches));

  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft);
  const widths = graded.map((g) => edgeLength(pieceEdge(g.block.front, "hem")));
  checks.push(strictlyIncreasing("Size run grows in order", widths));

  return buildReport(checks);
}
