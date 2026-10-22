// The fitted garment's rule tables — notches and points of measure.
//
// The back and sleeve are the tee's own pieces, so their notch rules are reused
// verbatim; only the darted front needs its own entry (its side seam is split
// into sideUpper/sideLower around the dart mouth).

import { PieceNotches, TSHIRT_NOTCHES } from "./tshirt-notches";
import { CheckResult, matchLengths, present, squareCorner } from "../guidance/check";
import { Block, rolePiece } from "./block";
import { fittedGeometryPair } from "./fitted";
import { Pom, seam, spanX, spanY, PointRef } from "./pom";
import { pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { dartIntake, seamKink } from "./dart";
import { sleevedTopStitches } from "./tshirt-checks";
import { matchedNotch } from "./stitch";

const FOLD: PointRef = { edge: "centerFront", at: "start" };

// Phase A3 (Slice 51): the fitted front's own stitches — same reasoning as
// TSHIRT_NOTCHES. The side seam is 2 edges (sideUpper/sideLower); the notch
// sits on sideLower (index 1), same as the hand table always placed it.
const [FITTED_SHOULDER, FITTED_SIDE] = sleevedTopStitches(["sideUpper", "sideLower"], true);

/** Notches + grainlines for the fitted block: a new front, the tee's back/sleeve. */
export const FITTED_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "fitted front",
    notches: [
      matchedNotch(FITTED_SHOULDER, "a", 0.5),
      matchedNotch(FITTED_SIDE, "a", 0.5, 1),
      { edgeName: "armhole", t: 0.33 }, // sleeve-cap ease — not a matched point
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  ...TSHIRT_NOTCHES.filter((r) => r.pieceName !== "front"),
];

/** Seam and hem checks for the Fitted dart-closed digital reference. */
export function fittedPanelChecks(block: Block): CheckResult[] {
  const openPattern = rolePiece(block, "front");
  const legs = openPattern.dart?.legs ?? [];
  const oneBustDartRetained = legs[0] === "bustDartUpper" && legs[1] === "bustDartLower";

  let pair: ReturnType<typeof fittedGeometryPair>;
  try {
    pair = fittedGeometryPair(block);
  } catch (error) {
    return [
      present("Bust dart closed before trueing", false, String(error)),
      present("Open pattern retains one bust dart", oneBustDartRetained,
        oneBustDartRetained ? "two named bust dart legs retained" : "named bust dart legs are missing"),
    ];
  }

  const back = rolePiece(block, "back");
  const sideUpper = pieceEdge(pair.dartClosedReference, "sideUpper");
  const sideLower = pieceEdge(pair.dartClosedReference, "sideLower");
  const sideLength = edgeLength(sideUpper) + edgeLength(sideLower);
  const backSideLength = edgeLength(pieceEdge(back, "side"));
  const sideKink = seamKink(pair.dartClosedReference, "sideUpper", "sideLower");
  const sideTrued = Math.abs(sideKink) <= 1e-6;
  const hem = pieceEdge(pair.dartClosedReference, "hem");
  const centerFront = pieceEdge(pair.dartClosedReference, "centerFront");
  const levelDelta = Math.abs(edgeStart(hem).y - edgeEnd(hem).y);
  return [
    matchLengths("Side seam (dart-closed reference)", sideLength, backSideLength),
    present("Side seam trued in closed reference", sideTrued,
      sideTrued ? "side seam kink 0.0 degrees" : "side seam kink " + sideKink.toFixed(1) + " degrees"),
    present("Bust dart closed before trueing", pair.bustDartClosed,
      pair.bustDartClosed ? "side bust-dart mouth closes before hem trueing" : "bust-dart mouth remains open before trueing"),
    present("Hem level in dart-closed reference", levelDelta <= 1e-9, "Endpoint level delta " + levelDelta.toFixed(4) + " cm"),
    squareCorner("Hem square to fold (dart-closed reference)", edgeStart(hem), edgeEnd(hem), edgeEnd(centerFront)),
    present("Open pattern retains one bust dart", oneBustDartRetained, oneBustDartRetained ? "two named bust dart legs retained" : "named bust dart legs are missing"),
  ];
}
/** The fitted block's points of measure — the tee's, adapted to the darted front. */
export const FITTED_POMS: readonly Pom[] = [
  {
    label: "Body chest (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideUpper", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideUpper")), // the underarm point
  },
  {
    // The body length stays anchored at center front in the open cut pattern.
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
    measure: (b) => {
      const reference = fittedGeometryPair(b).dartClosedReference;
      return seam(reference, "sideUpper") + seam(reference, "sideLower");
    },
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
