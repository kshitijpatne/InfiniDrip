// The fitted garment's rule tables — notches and points of measure.
//
// The back and sleeve are the tee's own pieces, so their notch rules are reused
// verbatim; only the darted front needs its own entry (its side seam is split
// into sideUpper/sideLower around the dart mouth).

import { PieceNotches, TSHIRT_NOTCHES } from "./tshirt-notches";
import { Pom, seam, spanX, spanY, PointRef } from "./pom";
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
    measure: (b) => 4 * spanX(b.front, { edge: "sideUpper", at: "start" }, FOLD),
  },
  {
    // Measured at centre front: the side is longer by the dart intake until trued.
    label: "Body length (HPS–hem)",
    measure: (b) => spanY(b.front, { edge: "shoulder", at: "start" }, { edge: "hem", at: "end" }),
  },
  {
    label: "Across shoulder",
    measure: (b) => 2 * spanX(b.front, { edge: "shoulder", at: "end" }, FOLD),
  },
  { label: "Shoulder seam", measure: (b) => seam(b.front, "shoulder") },
  {
    label: "Armhole (front + back)",
    measure: (b) => seam(b.front, "armhole") + seam(b.back, "armhole"),
  },
  {
    label: "Side seam (dart closed)",
    measure: (b) => seam(b.front, "sideUpper") + seam(b.front, "sideLower"),
  },
  { label: "Bust dart intake", measure: (b) => dartIntake(b.front) },
  {
    label: "Neck width",
    measure: (b) => 2 * spanX(b.front, { edge: "shoulder", at: "start" }, FOLD),
  },
  {
    label: "Front neck drop",
    measure: (b) => spanY(b.front, { edge: "neckline", at: "start" }, { edge: "shoulder", at: "start" }),
  },
  {
    label: "Sleeve length (cap–hem)",
    measure: (b) => spanY(b.sleeve, { edge: "capLeft", at: "end" }, { edge: "hem", at: "start" }),
  },
  { label: "Sleeve hem", measure: (b) => seam(b.sleeve, "hem") },
];
