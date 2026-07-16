// The production-readiness report, driven by a garment recipe.
//
// Every check below is a fact you could confirm with a tape measure on the
// drafted block.
//
// HONEST BOUNDARY — this file is NOT yet garment-agnostic. The seam pairs below
// are hard-coded for a sleeved top: it asks every garment for a "front", a
// "back" and a "sleeve", and for edges named "shoulder", "armhole" and "capLeft".
// Only two facts currently come from the recipe (`frontSideEdges` and
// `hemSquareToFold`). A garment without sleeves does not degrade gracefully here
// — `rolePiece`/`pieceEdge` throw, loudly and on purpose. Moving these pairs into
// the recipe is what makes a structurally different garment (a skirt) possible;
// until then, this checker only speaks tee.
//
// What each check proves:
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
  blockPieces,
  rolePiece,
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
  return edges.reduce((sum, name) => sum + edgeLength(pieceEdge(rolePiece(block, "front"), name)), 0);
}

/** A dart closes cleanly only if its two legs are the same length. */
export function dartLegCheck(block: Block): CheckResult | null {
  const d = dartOf(rolePiece(block, "front"));
  if (!d) return null;
  const legs = rolePiece(block, "front").dart!.legs.map((n) => edgeLength(pieceEdge(rolePiece(block, "front"), n)));
  return matchLengths("Dart legs equal", legs[0], legs[1]);
}

/** Run every readiness check for a garment and fold them into one verdict. */
export function garmentReport(recipe: GarmentRecipe, m: Measurements): Report {
  const b = recipe.draft(m);

  const checks: CheckResult[] = [
    matchLengths(
      "Shoulder seam (front ↔ back)",
      edgeLength(pieceEdge(rolePiece(b, "front"), "shoulder")),
      edgeLength(pieceEdge(rolePiece(b, "back"), "shoulder"))
    ),
    matchLengths(
      "Side seam (front ↔ back)",
      sideSeamLength(b, recipe.checks.frontSideEdges),
      edgeLength(pieceEdge(rolePiece(b, "back"), "side"))
    ),
    matchLengths(
      "Sleeve underarm (left ↔ right)",
      edgeLength(pieceEdge(rolePiece(b, "sleeve"), "sideLeft")),
      edgeLength(pieceEdge(rolePiece(b, "sleeve"), "sideRight"))
    ),
    inBand(
      "Sleeve-cap ease",
      edgeLength(pieceEdge(rolePiece(b, "sleeve"), "capLeft")) + edgeLength(pieceEdge(rolePiece(b, "sleeve"), "capRight")) -
        (edgeLength(pieceEdge(rolePiece(b, "front"), "armhole")) + edgeLength(pieceEdge(rolePiece(b, "back"), "armhole"))),
      CAP_EASE_LO,
      CAP_EASE_HI
    ),
  ];

  // A trued hem leaves the fold at a right angle, so it's straight when unfolded.
  if (recipe.checks.hemSquareToFold) {
    const hem = pieceEdge(rolePiece(b, "front"), "hem");
    checks.push(
      squareCorner("Hem square to the fold", edgeStart(hem), edgeEnd(hem), edgeEnd(pieceEdge(rolePiece(b, "front"), "centerFront")))
    );
  }

  const dart = dartLegCheck(b);
  if (dart) checks.push(dart);

  // Role-agnostic: every piece the garment drafted must declare its notches.
  checks.push(notchGrainCheck(blockPieces(b).map((p) => p.name), recipe.notches));

  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft);
  const widths = graded.map((g) => edgeLength(pieceEdge(rolePiece(g.block, "front"), "hem")));
  checks.push(strictlyIncreasing("Size run grows in order", widths));

  return buildReport(checks);
}
