// The fitted garment's rule tables — notches and points of measure.
//
// The back and sleeve are the tee's own pieces, so their notch rules are reused
// verbatim; only the darted front needs its own entry (its side seam is split
// into sideUpper/sideLower around the dart mouth).

import { PieceNotches, TSHIRT_NOTCHES } from "./tshirt-notches";
import { CheckResult, matchLengths, present, squareCorner } from "../guidance/check";
import { Block, rolePiece } from "./block";
import { fittedGeometryPair, fittedPrincessStitches } from "./fitted";
import { Pom, seam, spanX, spanY, PointRef } from "./pom";
import { pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { dartIntake, seamKink } from "./dart";
import { sleevedTopStitches } from "./tshirt-checks";
import { matchedNotch } from "./stitch";
import { pointOnEdge } from "../render/notch";

const FOLD: PointRef = { edge: "centerFront", at: "start" };

// Phase A3 (Slice 51): the fitted front's own stitches — same reasoning as
// TSHIRT_NOTCHES. The side seam is 2 edges (sideUpper/sideLower); the notch
// sits on sideLower (index 1), same as the hand table always placed it.
const [FITTED_SHOULDER, FITTED_SIDE] = sleevedTopStitches(["sideUpper", "sideLower"], true);
const PRINCESS_STITCH = fittedPrincessStitches().find((stitch) => stitch.label.startsWith("Princess seam"))!;

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
  {
    pieceName: "fitted front center",
    notches: [
      matchedNotch(PRINCESS_STITCH, "a", 1, 0),
      { edgeName: "shoulder", t: 0.5 },
    ],
    grainline: { topEdge: "centerFront", topT: 1, bottomEdge: "centerFront", bottomT: 0 },
  },
  {
    pieceName: "fitted side front (cut 2 mirrored)",
    notches: [
      matchedNotch(PRINCESS_STITCH, "b", 0, 0),
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
      { edgeName: "sideLower", t: 0.5 },
    ],
    grainline: {
      topEdge: "princessUpper", topT: 0.5, bottomEdge: "princessLower", bottomT: 0.5,
      resolve: (piece) => {
        const upper = pieceEdge(piece, "princessUpper");
        const lower = pieceEdge(piece, "princessLower");
        const sideUpper = pieceEdge(piece, "sideUpper");
        const sideLower = pieceEdge(piece, "sideLower");
        const underarmY = edgeStart(sideUpper).y;
        const hemY = edgeEnd(sideLower).y;
        const topY = underarmY + (hemY - underarmY) * 0.2;
        const bottomY = underarmY + (hemY - underarmY) * 0.8;
        const xAtY = (edge: ReturnType<typeof pieceEdge>, y: number): number | null => {
          if (edge.kind === "line") {
            const minY = Math.min(edge.start.y, edge.end.y);
            const maxY = Math.max(edge.start.y, edge.end.y);
            if (y < minY || y > maxY) return null;
            const dy = edge.end.y - edge.start.y;
            return Math.abs(dy) < 1e-9 ? (edge.start.x + edge.end.x) / 2
              : edge.start.x + (edge.end.x - edge.start.x) * (y - edge.start.y) / dy;
          }
          let found: number | null = null;
          let previous = edge.curve.start;
          for (let index = 1; index <= 80; index += 1) {
            const t = index / 80;
            const current = pointOnEdge(edge, t);
            if (y >= Math.min(previous.y, current.y) && y <= Math.max(previous.y, current.y)) {
              const dy = current.y - previous.y;
              found = Math.abs(dy) < 1e-9 ? (previous.x + current.x) / 2
                : previous.x + (current.x - previous.x) * (y - previous.y) / dy;
            }
            previous = current;
          }
          return found;
        };
        const midpointY = (topY + bottomY) / 2;
        const seamX = xAtY(upper, midpointY) ?? xAtY(lower, midpointY) ?? Number.NaN;
        const outerX = xAtY(sideUpper, midpointY) ?? xAtY(sideLower, midpointY) ?? Number.NaN;
        const grainX = (seamX + outerX) / 2;
        return { top: { x: grainX, y: topY }, bottom: { x: grainX, y: bottomY } };
      },
    },
  },
  ...TSHIRT_NOTCHES.filter((r) => r.pieceName !== "front"),
];

/** Seam and hem checks for the Fitted dart-closed digital reference. */
export function fittedPanelChecks(block: Block): CheckResult[] {
  const openPattern = rolePiece(block, "front");
  const princessSide = block.roles.frontSide;
  if (princessSide) {
    const centerUpper = pieceEdge(openPattern, "princessUpper");
    const centerLower = pieceEdge(openPattern, "princessLower");
    const sideUpper = pieceEdge(princessSide, "princessUpper");
    const sideLower = pieceEdge(princessSide, "princessLower");
    const princessLength = edgeLength(centerUpper) + edgeLength(centerLower);
    const sidePrincessLength = edgeLength(sideUpper) + edgeLength(sideLower);
    const centerShoulderLength = edgeLength(pieceEdge(openPattern, "shoulder"));
    const sideShoulderLength = edgeLength(pieceEdge(princessSide, "shoulder"));
    const backShoulderLength = edgeLength(pieceEdge(rolePiece(block, "back"), "shoulder"));
    const centerHem = pieceEdge(openPattern, "hem");
    const centerFold = pieceEdge(openPattern, "centerFront");
    const shoulderJoin = Math.hypot(edgeEnd(pieceEdge(openPattern, "shoulder")).x
      - edgeStart(pieceEdge(princessSide, "shoulder")).x,
    edgeEnd(pieceEdge(openPattern, "shoulder")).y - edgeStart(pieceEdge(princessSide, "shoulder")).y) <= 1e-7;
    const seamApexJoin = Math.hypot(edgeEnd(centerUpper).x - edgeStart(centerLower).x,
      edgeEnd(centerUpper).y - edgeStart(centerLower).y) <= 1e-7;
    const sideApexJoin = Math.hypot(edgeEnd(sideLower).x - edgeStart(sideUpper).x,
      edgeEnd(sideLower).y - edgeStart(sideUpper).y) <= 1e-7;
    const centerHemLevel = Math.abs(edgeStart(centerHem).y - edgeEnd(centerHem).y) <= 1e-7;
    const hasNoBustDart = !openPattern.dart && !princessSide.dart
      && !openPattern.edges.some((edge) => edge.name.startsWith("bustDart"));
    return [
      matchLengths("Princess seam (front center ↔ side front)", princessLength, sidePrincessLength),
      matchLengths("Shoulder seam (split front ↔ back)", centerShoulderLength + sideShoulderLength, backShoulderLength),
      matchLengths("Side seam (front side ↔ back)",
        edgeLength(pieceEdge(princessSide, "sideUpper")) + edgeLength(pieceEdge(princessSide, "sideLower")),
        edgeLength(pieceEdge(rolePiece(block, "back"), "side"))),
      present("Princess seam joins continuously through the apex", seamApexJoin && sideApexJoin,
        seamApexJoin && sideApexJoin ? "both panel seams meet at their authored apex endpoints" : "one or both panel seams have a gap at the apex"),
      present("Split shoulder joins continuously", shoulderJoin,
        shoulderJoin ? "center and side-front shoulder edges share one origin" : "split shoulder edges do not meet"),
      present("Center-front fold and side-front pair are distinct", openPattern.onFold && !princessSide.onFold,
        openPattern.onFold && !princessSide.onFold ? "center front is on fold; side front is a mirrored pair" : "front panel cut semantics are inconsistent"),
      present("Princess seam replaces the bust dart", hasNoBustDart,
        hasNoBustDart ? "neither front panel retains bust-dart legs" : "bust-dart geometry remains in the princess-seam pattern"),
      present("Center-front hem is level", centerHemLevel,
        `Endpoint level delta ${Math.abs(edgeStart(centerHem).y - edgeEnd(centerHem).y).toFixed(4)} cm`),
      squareCorner("Center-front hem square to fold", edgeStart(centerHem), edgeEnd(centerHem), edgeEnd(centerFold)),
    ];
  }
  const legs = openPattern.dart?.legs ?? [];
  const oneBustDartRetained = legs[0] === "bustDartUpper" && legs[1] === "bustDartLower";
  const waistMarks = (openPattern.marks ?? []).filter((mark) =>
    mark.name === "waistDartUpperLeg" || mark.name === "waistDartLowerLeg");
  const waistUpper = waistMarks.find((mark) => mark.name === "waistDartUpperLeg");
  const waistLower = waistMarks.find((mark) => mark.name === "waistDartLowerLeg");
  const waistMarkGeometryValid = waistMarks.length === 2 && waistUpper !== undefined && waistLower !== undefined
    && "start" in waistUpper && "start" in waistLower
    && waistUpper.kind === "placementLine" && waistLower.kind === "placementLine"
    && Number.isFinite(waistUpper.start.x) && Number.isFinite(waistUpper.start.y)
    && Number.isFinite(waistUpper.end.x) && Number.isFinite(waistUpper.end.y)
    && Number.isFinite(waistLower.start.x) && Number.isFinite(waistLower.start.y)
    && Number.isFinite(waistLower.end.x) && Number.isFinite(waistLower.end.y)
    && Math.hypot(waistUpper.end.x - waistLower.end.x, waistUpper.end.y - waistLower.end.y) <= 1e-6
    && Math.hypot(waistUpper.start.x - waistLower.start.x, waistUpper.start.y - waistLower.start.y) > 1e-6
    && Math.abs(waistUpper.start.y - waistLower.start.y) <= 1e-6
    && Math.abs(waistUpper.end.y - waistUpper.start.y) > 1e-6;
  const waistMarkChecks = waistMarks.length === 0 ? [] : [present(
    "Waist dart marks form one internal dart", waistMarkGeometryValid,
    waistMarkGeometryValid
      ? "two internal placement lines have a positive opening and meet at one apex"
      : "waist-dart marks are incomplete, non-finite, or do not meet at one apex",
  )];

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
    ...waistMarkChecks,
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

/** Modeled-only POMs for F03. No production tolerances are assigned. */
export const FITTED_PRINCESS_POMS: readonly Pom[] = [
  {
    label: "Modeled chest circumference (digital)",
    measure: (b) => 4 * edgeStart(pieceEdge(rolePiece(b, "frontSide"), "sideUpper")).x,
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "frontSide"), "sideUpper")),
    anchorRoleId: "frontSide", anchorEdgeId: "sideUpper",
  },
  {
    label: "Modeled body length (HPS–hem)",
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "end" }),
  },
  {
    label: "Modeled across shoulder",
    measure: (b) => 2 * edgeEnd(pieceEdge(rolePiece(b, "frontSide"), "shoulder")).x,
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "frontSide"), "shoulder")),
    anchorRoleId: "frontSide", anchorEdgeId: "shoulder",
  },
  {
    label: "Modeled shoulder seam",
    measure: (b) => seam(rolePiece(b, "front"), "shoulder") + seam(rolePiece(b, "frontSide"), "shoulder"),
  },
  {
    label: "Modeled armhole (front + back)",
    measure: (b) => seam(rolePiece(b, "frontSide"), "armhole") + seam(rolePiece(b, "back"), "armhole"),
  },
  {
    label: "Modeled side seam",
    measure: (b) => seam(rolePiece(b, "frontSide"), "sideUpper") + seam(rolePiece(b, "frontSide"), "sideLower"),
  },
  {
    label: "Modeled princess seam",
    measure: (b) => seam(rolePiece(b, "front"), "princessUpper") + seam(rolePiece(b, "front"), "princessLower"),
  },
  {
    label: "Modeled neck width",
    measure: (b) => 2 * spanX(rolePiece(b, "front"), { edge: "shoulder", at: "start" }, FOLD),
  },
  {
    label: "Modeled front neck drop",
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "neckline", at: "start" }, { edge: "shoulder", at: "start" }),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "neckline")),
    anchorRoleId: "front", anchorEdgeId: "neckline",
  },
  {
    label: "Modeled sleeve length (cap–hem)",
    measure: (b) => spanY(rolePiece(b, "sleeve"), { edge: "capLeft", at: "end" }, { edge: "hem", at: "start" }),
  },
  { label: "Modeled sleeve hem", measure: (b) => seam(rolePiece(b, "sleeve"), "hem") },
];
