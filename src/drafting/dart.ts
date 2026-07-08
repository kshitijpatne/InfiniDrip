// Darts — the engine half. A dart is a wedge folded out of a flat piece to build
// shape (a bust dart cones the fabric over the bust). In the flat pattern it is
// two straight LEG edges that meet at the APEX, with the wedge open at the MOUTH
// on a seam. We store only the leg edge NAMES on the piece; everything else is
// read live off the outline, so editing a leg moves the apex/mouth with it.
//
// This is garment-agnostic engine. Which piece gets a dart, and where, is recipe
// (see fitted.ts).

import { Point } from "../geometry";
import { Piece, edgeStart, edgeEnd, pieceEdge } from "./piece";

export interface ResolvedDart {
  readonly apex: Point;                       // where the two legs meet (interior)
  readonly mouth: readonly [Point, Point];    // the two open ends on the seam
}

/**
 * Resolve a piece's dart to live points, or null if it has none.
 * Convention: leg[0] runs mouthUpper → apex, leg[1] runs apex → mouthLower, so the
 * shared apex is leg[0].end === leg[1].start.
 */
export function dartOf(piece: Piece): ResolvedDart | null {
  if (!piece.dart) return null;
  const upper = pieceEdge(piece, piece.dart.legs[0]);
  const lower = pieceEdge(piece, piece.dart.legs[1]);
  return { apex: edgeEnd(upper), mouth: [edgeStart(upper), edgeEnd(lower)] };
}

/** The take-up (intake) of a dart: the straight gap across its mouth, in cm. */
export function dartIntake(piece: Piece): number {
  const d = dartOf(piece);
  if (!d) return 0;
  return Math.hypot(d.mouth[0].x - d.mouth[1].x, d.mouth[0].y - d.mouth[1].y);
}
