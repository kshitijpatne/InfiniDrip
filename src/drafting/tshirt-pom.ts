// The t-shirt's points of measure — recipe. Each is a plain-English label and a
// live geometry query built from the engine helpers. Finished-garment values
// (what a maker checks with a tape), read straight off the drafted pieces.
//
// The fold sits at x = 0, so a "half" width is measured from a point out to the
// fold; we double it for the finished body/neck. Front and back are symmetric
// here, so front-piece queries stand in for the body.

import { Pom, seam, spanX, spanY, PointRef } from "./pom";
import { pieceEdge, edgeStart, edgeEnd } from "./piece";
import { rolePiece } from "./block";

// The fold reference: any centre-front point (x = 0).
const FOLD: PointRef = { edge: "centerFront", at: "start" };

export const TSHIRT_POMS: readonly Pom[] = [
  {
    label: "Body chest (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "side", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "side")), // the underarm point
  },
  {
    label: "Body length (HPS–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "hem")), // hem at the fold
  },
  {
    label: "Across shoulder",
    tolerance: 0.6,
    measure: (b) => 2 * spanX(rolePiece(b, "front"), { edge: "shoulder", at: "end" }, FOLD),
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "shoulder")), // the shoulder tip
  },
  {
    label: "Shoulder seam",
    tolerance: 0.3,
    measure: (b) => seam(rolePiece(b, "front"), "shoulder"),
  },
  {
    label: "Armhole (front + back)",
    tolerance: 0.6,
    measure: (b) => seam(rolePiece(b, "front"), "armhole") + seam(rolePiece(b, "back"), "armhole"),
  },
  {
    label: "Neck width",
    tolerance: 0.6,
    measure: (b) => 2 * spanX(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "shoulder")), // the neck point
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
  {
    label: "Sleeve bicep width",
    tolerance: 0.6,
    measure: (b) => spanX(rolePiece(b, "sleeve"), { edge: "sideLeft", at: "end" }, { edge: "sideRight", at: "start" }),
  },
  {
    label: "Sleeve hem",
    tolerance: 0.3,
    measure: (b) => seam(rolePiece(b, "sleeve"), "hem"),
  },
];
