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
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd } from "./piece";
import { Block, rolePiece } from "./block";
import { CheckResult, squareCorner } from "../guidance/check";
import { Note } from "../guidance/note";
import { GradeRule } from "./grading";
import { Pom, spanX, spanY, PointRef } from "./pom";
import { PieceNotches } from "./tshirt-notches";
import { Stitch, edgeRef, iface, matchedNotch } from "./stitch";
import { Component } from "./component";
import { waistband, WAISTBAND_DEFAULT } from "./waistband";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";

/** The skirt's own half-widths at the waist and hip — the single source of
 *  truth `panel()` drafts from and `render/skirt-figure.ts` must draw from
 *  too. Exported (Slice 61) after the figure view was found computing its
 *  OWN independent approximation (`waist * 0.20`, `hip * 0.22` — dropping
 *  ease entirely) a few lines away from `renderSkirtGarment`'s correct
 *  formula in the very same file. Same fix as `derive().chestWidthHalf` for
 *  the upper body: one function, every consumer reads it. */
export function skirtWidths(m: Measurements): { waistHalf: number; hipHalf: number } {
  return {
    waistHalf: (m.waist + m.ease) / 4, // quarter-panel at the waist
    hipHalf: (m.hip + m.ease) / 4,     // quarter-panel at the hip (the widest)
  };
}

/** One skirt panel (front or back), cut on the fold at the centre (x = 0). */
function panel(m: Measurements, name: string): Piece {
  const { waistHalf: waistQ, hipHalf: hipQ } = skirtWidths(m);

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

export interface SkirtPanelParams {
  readonly position: "front" | "back";
  /** Per §5's taxonomy. Only "straight" is drafted — the block's whole
   *  premise (§ file header: "waist darts / A-line flare are a later
   *  refinement"). Typed now so the taxonomy doesn't need a breaking change
   *  when flare ships; throws rather than silently drafting straight. */
  readonly silhouette: "straight" | "flare";
}

/** The SkirtPanel component (Phase C1, Slice 58): formalises `panel` — the
 *  skirt's own real implementation since Slice 1 — behind the same
 *  `Component` shape every other Phase B/C piece uses, mirroring `bodice`'s
 *  `{position}` pattern exactly. Not a new abstraction invented for a second
 *  consumer that doesn't exist yet (§5's "two real consumers" rule is about
 *  inventing, not about wrapping an already-real implementation for
 *  consistency) — `panel`'s geometry is untouched, so this is byte-identical. */
export const skirtPanel: Component<SkirtPanelParams> = (m, params) => {
  if (params.silhouette !== "straight") {
    throw new Error(`Skirt silhouette "${params.silhouette}" not yet implemented (straight only)`);
  }
  const piece = panel(m, params.position);
  return {
    pieces: { [params.position]: piece },
    stitches: [],
    interfaces: { waist: iface(edgeRef(params.position, "waist")) },
  };
};

/** The skirt's stitches preserve the original panel side-seam check, attach
 *  separate front/back waistband pieces to their matching body panels, and
 *  describe the single side zipper path from the band through the upper body
 *  seam to the hip. */
const SKIRT_STITCHES: readonly Stitch[] = [
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
  },
  {
    label: "Waistband (front + back ↔ matching bands)",
    // Walk center-front → side seam → center-back. Body edges are authored
    // center-to-side; band seams follow the outline side-to-fold, so reverse
    // the front band seam and retain the back seam for the same ordered path.
    a: iface(edgeRef("front", "waist"), edgeRef("back", "waist", true)),
    b: iface(edgeRef("waistbandFront", "seam", true), edgeRef("waistbandBack", "seam")),
  },
  {
    label: "Waistband side seam (front ↔ back)",
    a: iface(edgeRef("waistbandFront", "side")),
    b: iface(edgeRef("waistbandBack", "side")),
  },
  {
    label: "Side zipper path (waistband → hip)",
    // The zipper replaces one side seam from the band top to the body hip.
    // Its two tape sides have matching band + upper-body lengths.
    a: iface(edgeRef("waistbandFront", "side"), edgeRef("front", "sideUpper")),
    b: iface(edgeRef("waistbandBack", "side"), edgeRef("back", "sideUpper")),
  },
];

export function draftSkirt(m: Measurements): Block {
  return composeBlock(SKIRT_GRAMMAR, m);
}

/** Each band receives the exact seam length exposed by its matching panel.
 * This keeps the dependency in the grammar instead of re-deriving waist width. */
export const SKIRT_GRAMMAR = garmentGrammar(
  "skirt",
  [
    componentNode("front", "skirt-panel", skirtPanel, () => ({ position: "front" as const, silhouette: "straight" as const })),
    componentNode("back", "skirt-panel", skirtPanel, () => ({ position: "back" as const, silhouette: "straight" as const })),
    componentNode(
      "waistband",
      "waistband",
      waistband,
      (context) => ({
        ...WAISTBAND_DEFAULT,
        frontSeamLength: context.interfaceLength("front", "waist"),
        backSeamLength: context.interfaceLength("back", "waist"),
      }),
      ["front", "back"],
    ),
  ],
  () => SKIRT_STITCHES,
);

// ── sewability checks (recipe-owned) ──────────────────────────────────────────

/** What's left once the side-seam stitch above is declared: the hem and waist
 *  each meeting the fold square — panel properties, not seams between two
 *  pieces, so `stitchChecks` can't express them. No sleeve is ever named. */
export function skirtPanelChecks(b: Block): CheckResult[] {
  const front = rolePiece(b, "front");
  const hem = pieceEdge(front, "hem");
  const waist = pieceEdge(front, "waist");
  const center = pieceEdge(front, "center");
  return [
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
      field: "waist",
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
      field: "length",
      level: "warn",
      text: `Length (${m.length} cm) does not clear the hip depth (${m.hipDepth} cm) — the hem ` +
            `would sit at or above the fullest hip, so the side seam has nowhere to run. ` +
            `Lengthen the skirt or reduce the hip depth.`,
    });
  }
  if (m.ease < 2) {
    notes.push({ field: "ease", level: "warn", text: `Ease is ${m.ease} cm — a skirt needs a little room to sit over the hip.` });
  } else if (m.ease > 12) {
    notes.push({ field: "ease", level: "info", text: `Ease is ${m.ease} cm — loose; the skirt will sit away from the body.` });
  } else {
    notes.push({ field: "ease", level: "ok", text: `Ease is ${m.ease} cm — comfortable for a skirt.` });
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
    // Both quarter panels come from the same panel(m, position) source with
    // the same Measurements, so this is the exact counterpart edge point.
    backAnchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "back"), "waist")),
  },
  {
    label: "Hip (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideLower", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideLower")),
    backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "sideLower")),
  },
  {
    label: "Length (waist–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "waist", at: "start" }, { edge: "hem", at: "end" }),
  },
];

// Phase A3 (Slice 51): both balance notches read off SKIRT_STITCHES' own
// side-seam interface (index 1 = sideLower, the edge nearest the hem) instead
// of a second, separately-typed "sideLower" string.
// Waistband/body and zipper/body junction notches are read from their stitch
// interfaces so pattern marks stay aligned with the declared assembly paths.
const SIDE_SEAM = SKIRT_STITCHES[0];
const WAISTBAND_SEAM = SKIRT_STITCHES[1];
const SIDE_ZIPPER = SKIRT_STITCHES[3];

export const SKIRT_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      matchedNotch(SIDE_SEAM, "a", 0.5, 1), // a balance notch at the side
      matchedNotch(WAISTBAND_SEAM, "a", 1.0, 0), // body side at the front waistband seam
      matchedNotch(SIDE_ZIPPER, "a", 0.0, 1), // zipper junction at the front waist
      matchedNotch(SIDE_ZIPPER, "a", 1.0, 1), // zipper endpoint at the front hip
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(SIDE_SEAM, "b", 0.5, 1),
      matchedNotch(SIDE_SEAM, "b", 0.75, 1), // 2 = back
      matchedNotch(WAISTBAND_SEAM, "a", 1.0, 1), // body side at the back waistband seam
      matchedNotch(SIDE_ZIPPER, "b", 0.0, 1), // zipper junction at the back waist
      matchedNotch(SIDE_ZIPPER, "b", 1.0, 1), // zipper endpoint at the back hip
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "waistbandFront",
    notches: [
      matchedNotch(WAISTBAND_SEAM, "b", 0.0, 0),
      matchedNotch(SIDE_ZIPPER, "a", 1.0, 0),
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 },
  },
  {
    pieceName: "waistbandBack",
    notches: [
      matchedNotch(WAISTBAND_SEAM, "b", 0.0, 1),
      matchedNotch(SIDE_ZIPPER, "b", 1.0, 0),
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 },
  },
];
