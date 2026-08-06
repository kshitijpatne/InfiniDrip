// The skirt — a structurally different garment that proves the engine/recipe split.
//
// It shares NOTHING tee-shaped: no sleeve, no armhole, no neckline. A panel is
// waist (top) → side seam (tapering out to the hip, then straight to the hem) →
// hem (bottom) → centre (the fold). Front and back are the same simple block.
//
// This is a dartless block: the waist is eased in at the side seam rather than
// darted. Waist darts / A-line flare are a later refinement.

import { point } from "../geometry";
import { Measurements } from "./measurements";
import { Edge, Piece, pieceEdge, edgeLength, edgeStart, edgeEnd } from "./piece";
import { Block, block, rolePiece } from "./block";
import { CheckResult, matchLengths, squareCorner } from "../guidance/check";
import { Note } from "../guidance/note";
import { GradeRule } from "./grading";
import { Pom, spanX, spanY, PointRef } from "./pom";
import { PieceNotches } from "./tshirt-notches";

/** One skirt panel (front or back), cut on the fold at the centre (x = 0). */
function panel(m: Measurements, name: string): Piece {
  const waistQ = (m.waist + m.ease) / 4; // quarter-panel at the waist
  const hipQ = (m.hip + m.ease) / 4;     // quarter-panel at the hip (the widest)

  const cWaist = point(0, 0);
  const sWaist = point(waistQ, 0);
  const sHip = point(hipQ, m.hipDepth);
  const sHem = point(hipQ, m.length);
  const cHem = point(0, m.length);

  const edges: Edge[] = [
    { kind: "line", name: "waist", start: cWaist, end: sWaist },
    { kind: "line", name: "sideUpper", start: sWaist, end: sHip }, // taper out to the hip
    { kind: "line", name: "sideLower", start: sHip, end: sHem },   // straight to the hem
    { kind: "line", name: "hem", start: sHem, end: cHem },
    { kind: "line", name: "center", start: cHem, end: cWaist },    // the fold
  ];
  return { name, onFold: true, edges };
}

export function draftSkirt(m: Measurements): Block {
  return block({ front: panel(m, "front"), back: panel(m, "back") });
}

// ── sewability checks (recipe-owned) ──────────────────────────────────────────

function sideSeam(b: Block, role: string): number {
  const p = rolePiece(b, role);
  return edgeLength(pieceEdge(p, "sideUpper")) + edgeLength(pieceEdge(p, "sideLower"));
}

/** A skirt sews together when the front and back side seams match and the hem and
 *  waist meet the fold square. No sleeve is ever named. */
export function skirtChecks(b: Block): CheckResult[] {
  const front = rolePiece(b, "front");
  const hem = pieceEdge(front, "hem");
  const waist = pieceEdge(front, "waist");
  const center = pieceEdge(front, "center");
  return [
    matchLengths("Side seam (front ↔ back)", sideSeam(b, "front"), sideSeam(b, "back")),
    squareCorner("Hem square to the fold", edgeStart(hem), edgeEnd(hem), edgeEnd(center)),
    squareCorner("Waist square to the fold", edgeEnd(waist), edgeStart(waist), edgeStart(center)),
  ];
}

// ── guidance (recipe-owned) ───────────────────────────────────────────────────

/** Skirt-specific advice: the waist must be smaller than the hip, the hem must
 *  clear the hip line, and a sane ease. */
export function skirtGuidance(_b: Block, m: Measurements): Note[] {
  const notes: Note[] = [];
  if (m.waist >= m.hip) {
    notes.push({
      level: "warn",
      text: `Waist (${m.waist} cm) is not smaller than the hip (${m.hip} cm) — a skirt needs ` +
            `the hip to be the wider of the two.`,
    });
  }
  // The draft puts the hip point at hipDepth and the hem at length. If the hem is
  // not BELOW the hip, the side seam runs back upward and the panel folds over
  // itself. Unreachable while hip depth was a constant; reachable now it's a field.
  if (m.length <= m.hipDepth) {
    notes.push({
      level: "warn",
      text: `Length (${m.length} cm) does not clear the hip depth (${m.hipDepth} cm) — the hem ` +
            `would sit at or above the fullest hip, so the side seam has nowhere to run. ` +
            `Lengthen the skirt or reduce the hip depth.`,
    });
  }
  if (m.ease < 2) {
    notes.push({ level: "warn", text: `Ease is ${m.ease} cm — a skirt needs a little room to sit over the hip.` });
  } else if (m.ease > 12) {
    notes.push({ level: "info", text: `Ease is ${m.ease} cm — loose; the skirt will sit away from the body.` });
  } else {
    notes.push({ level: "ok", text: `Ease is ${m.ease} cm — comfortable for a skirt.` });
  }
  return notes;
}

// ── grade, POMs, notches (recipe tables) ──────────────────────────────────────

/** cm added per +1 size step. Declared, like the tee grade. */
export const SKIRT_GRADE: GradeRule = { waist: 4, hip: 4, length: 1.5 };

const FOLD: PointRef = { edge: "center", at: "start" }; // x = 0

export const SKIRT_POMS: readonly Pom[] = [
  {
    label: "Waist (finished)",
    tolerance: 1.0,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "waist", at: "end" }, FOLD),
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "waist")),
  },
  {
    label: "Hip (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideLower", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideLower")),
  },
  {
    label: "Length (waist–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "waist", at: "start" }, { edge: "hem", at: "end" }),
  },
];

export const SKIRT_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [{ edgeName: "sideLower", t: 0.5 }], // a balance notch at the side
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [{ edgeName: "sideLower", t: 0.5 }, { edgeName: "sideLower", t: 0.75 }], // 2 = back
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
];
