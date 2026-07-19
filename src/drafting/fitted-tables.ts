// The fitted garment's rule tables — notches and points of measure.
//
// The back and sleeve are the tee's own pieces, so their notch rules are reused
// verbatim; only the darted front needs its own entry (its side seam is split
// into sideUpper/sideLower around the dart mouth).

import { PieceNotches, TSHIRT_NOTCHES } from "./tshirt-notches";
import { Pom, seam, spanX, spanY, PointRef } from "./pom";
import { pieceEdge, edgeStart, edgeEnd } from "./piece";
import { rolePiece } from "./block";
import { dartIntake } from "./dart";

const FOLD: PointRef = { edge: "centerFront", at: "start" };

/** Notches + grainlines for the fitted block: a new front, the tee's back/sleeve. */
export const FITTED_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "fitted front",
    notches: [
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "sideLower", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  ...TSHIRT_NOTCHES.filter((r) => r.pieceName !== "front"),
];

/** The fitted block's points of measure — the tee's, adapted to the darted front. */
export const FITTED_POMS: readonly Pom[] = [
  {
    label: "Body chest (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideUpper", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideUpper")), // the underarm point
  },
  {
    // Measured at centre front: the side is longer by the dart intake until trued.
    label: "Body length (HPS–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "end" }),
  },
  {
    label: "Across shoulder",
    tolerance: 0.6,
    measure: (b) => 2 * spanX(rolePiece(b, "front"), { edge: "shoulder", at: "end" }, FOLD),
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "shoulder")), // the shoulder tip
  },
  { label: "Shoulder seam", tolerance: 0.3, measure: (b) => seam(rolePiece(b, "front"), "shoulder") },
  {
    label: "Armhole (front + back)",
    tolerance: 0.6,
    measure: (b) => seam(rolePiece(b, "front"), "armhole") + seam(rolePiece(b, "back"), "armhole"),
  },
  {
    label: "Side seam (dart closed)",
    tolerance: 1.0,
    measure: (b) => seam(rolePiece(b, "front"), "sideUpper") + seam(rolePiece(b, "front"), "sideLower"),
  },
  { label: "Bust dart intake", tolerance: 0.5, measure: (b) => dartIntake(rolePiece(b, "front")) },
  {
    label: "Neck width",
    tolerance: 0.6,
    measure: (b) => 2 * spanX(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, FOLD),
  },
  {
    label: "Front neck drop",
    tolerance: 0.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "neckline", at: "start" }, { edge: "shoulder", at: "start" }),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "neckline")), // centre-front neck
  },
  {
    label: "Sleeve length (cap–hem)",
    tolerance: 1.0,
    measure: (b) => spanY(rolePiece(b, "sleeve"), { edge: "capLeft", at: "end" }, { edge: "hem", at: "start" }),
  },
  { label: "Sleeve hem", tolerance: 0.3, measure: (b) => seam(rolePiece(b, "sleeve"), "hem") },
];
