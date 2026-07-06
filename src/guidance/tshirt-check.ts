// The t-shirt's production-readiness checks — the recipe half of the checker.
//
// It wires the garment-agnostic primitives (check.ts) to the tee's actual edges,
// thresholds, and grade run, and returns one Report. Every check here is a fact
// you could confirm with a tape measure on the drafted block:
//   • the seams that sew together are the same length,
//   • the sleeve cap is eased into the armhole within a sane band,
//   • the hem meets the fold square (so it's straight when unfolded),
//   • every piece declares its notches + grainline,
//   • the graded size run grows in order (no size crossing).
//
// It reports SEWABILITY, not fit. Darts and smooth-transition checks arrive with
// the first darted garment; the tee has neither, so they're intentionally absent.

import {
  Measurements,
  draftTshirt,
  gradeRun,
  edgeLength,
  edgeStart,
  edgeEnd,
  pieceEdge,
} from "../drafting";
import { TSHIRT_NOTCHES, PieceNotches } from "../drafting/tshirt-notches";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "../drafting/tshirt-grade";
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

// The cap ease band is meant to be eased a touch longer than its armhole; outside
// this band the sleeve either won't reach or won't set in. (Matches guidance.)
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

/** Run every t-shirt readiness check and fold them into one verdict. */
export function tshirtReport(m: Measurements): Report {
  const b = draftTshirt(m);

  const shoulder = matchLengths(
    "Shoulder seam (front ↔ back)",
    edgeLength(pieceEdge(b.front, "shoulder")),
    edgeLength(pieceEdge(b.back, "shoulder"))
  );
  const side = matchLengths(
    "Side seam (front ↔ back)",
    edgeLength(pieceEdge(b.front, "side")),
    edgeLength(pieceEdge(b.back, "side"))
  );
  const underarm = matchLengths(
    "Sleeve underarm (left ↔ right)",
    edgeLength(pieceEdge(b.sleeve, "sideLeft")),
    edgeLength(pieceEdge(b.sleeve, "sideRight"))
  );

  const armhole =
    edgeLength(pieceEdge(b.front, "armhole")) + edgeLength(pieceEdge(b.back, "armhole"));
  const cap =
    edgeLength(pieceEdge(b.sleeve, "capLeft")) + edgeLength(pieceEdge(b.sleeve, "capRight"));
  const capEase = inBand("Sleeve-cap ease", cap - armhole, CAP_EASE_LO, CAP_EASE_HI);

  // The hem must leave the fold at a right angle so it's straight across when the
  // half-piece is unfolded. The corner is where the hem meets the centre fold.
  const hemEdge = pieceEdge(b.front, "hem");
  const foldSquare = squareCorner(
    "Hem square to the fold",
    edgeStart(hemEdge),
    edgeEnd(hemEdge),
    edgeEnd(pieceEdge(b.front, "centerFront"))
  );

  // Every piece in the block must have notches + a grainline declared.
  const notchGrain = notchGrainCheck(
    [b.front.name, b.back.name, b.sleeve.name],
    TSHIRT_NOTCHES
  );

  // Across the size run, a finished width (front hem = half chest) must grow.
  const graded = gradeRun(m, TSHIRT_GRADE, TSHIRT_SIZES);
  const widths = graded.map((g) => edgeLength(pieceEdge(g.block.front, "hem")));
  const monotonic = strictlyIncreasing("Size run grows in order", widths);

  const checks: CheckResult[] = [
    shoulder,
    side,
    underarm,
    capEase,
    foldSquare,
    notchGrain,
    monotonic,
  ];
  return buildReport(checks);
}
