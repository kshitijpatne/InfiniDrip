// The t-shirt's points of measure — recipe. Each is a plain-English label and a
// live geometry query built from the engine helpers. Finished-garment values
// (what a maker checks with a tape), read straight off the drafted pieces.
//
// The fold sits at x = 0, so a "half" width is measured from a point out to the
// fold; we double it for the finished body/neck. Front and back are symmetric
// here, so front-piece queries stand in for the body.

import { Pom, seam, spanX, spanY, PointRef } from "./pom";

// The fold reference: any centre-front point (x = 0).
const FOLD: PointRef = { edge: "centerFront", at: "start" };

export const TSHIRT_POMS: readonly Pom[] = [
  {
    label: "Body chest (finished)",
    measure: (b) => 4 * spanX(b.front, { edge: "side", at: "start" }, FOLD),
  },
  {
    label: "Body length (HPS–hem)",
    measure: (b) => spanY(b.front, { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
  },
  {
    label: "Across shoulder",
    measure: (b) => 2 * spanX(b.front, { edge: "shoulder", at: "end" }, FOLD),
  },
  {
    label: "Shoulder seam",
    measure: (b) => seam(b.front, "shoulder"),
  },
  {
    label: "Armhole (front + back)",
    measure: (b) => seam(b.front, "armhole") + seam(b.back, "armhole"),
  },
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
  {
    label: "Sleeve bicep width",
    measure: (b) => spanX(b.sleeve, { edge: "sideLeft", at: "end" }, { edge: "sideRight", at: "start" }),
  },
  {
    label: "Sleeve hem",
    measure: (b) => seam(b.sleeve, "hem"),
  },
];
