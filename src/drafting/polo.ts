// Polo V1 shell (Slice 69): tee body/sleeve plus a real centre-front slit and
// two folded plackets. Collar and stand join this block in Slice 70.

import { distance, point } from "../geometry";
import { Block, block, rolePiece } from "./block";
import { bodice } from "./bodice";
import { Measurements } from "./measurements";
import { GarmentOption } from "./options";
import { Piece, edgeLength, edgeStart, pieceEdge } from "./piece";
import { lineMark, pointMark } from "./pattern-mark";
import { sleeve as sleeveComponent } from "./sleeve";
import { edgeRef, iface, markRef, Stitch } from "./stitch";
import { sleevedTopStitches } from "./tshirt-checks";
import { AllowanceSpec } from "./allowance";
import { Note } from "../guidance/note";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { Pom, seam } from "./pom";
import { PieceNotches } from "./tshirt-notches";
import { TSHIRT_NOTCHES } from "./tshirt-notches";

export interface PoloOptions {
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
}

export const POLO_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "placketLength", label: "Finished placket length", defaultValue: 14, min: 14, max: 30, step: 0.5 },
  { id: "placketWidth", label: "Finished placket width", defaultValue: 3, min: 2, max: 4, step: 0.5 },
  { id: "standHeight", label: "Finished stand height", defaultValue: 2, min: 1, max: 3, step: 0.5 },
  { id: "collarLeafDepth", label: "Finished pointed collar leaf", defaultValue: 5, min: 4, max: 7, step: 0.5 },
];

export const DEFAULT_POLO_OPTIONS: PoloOptions = {
  placketLength: 14,
  placketWidth: 3,
  standHeight: 2,
  collarLeafDepth: 5,
};

/** Uses a supplied live value verbatim. Guardrails report bad values; they do
 * not silently turn a person’s chosen design back into a default. */
export function resolvePoloOptions(values: Partial<PoloOptions> = {}): PoloOptions {
  return {
    placketLength: finiteOr(values.placketLength, DEFAULT_POLO_OPTIONS.placketLength),
    placketWidth: finiteOr(values.placketWidth, DEFAULT_POLO_OPTIONS.placketWidth),
    standHeight: finiteOr(values.standHeight, DEFAULT_POLO_OPTIONS.standHeight),
    collarLeafDepth: finiteOr(values.collarLeafDepth, DEFAULT_POLO_OPTIONS.collarLeafDepth),
  };
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const BUTTON_CENTRES = [3.5, 7, 10.5] as const;
const PLACKET_SEAM_ALLOWANCE = 1;
const MIN_BUTTON_END_CLEARANCE = 3.5;
const COLLAR_TIP_FLARE = 1.5;

/** V1 Polo's production allowances. Internal fold/attachment marks have no
 * allowance themselves: their surrounding sew-outline edges own it. */
export const POLO_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    centerFront: 0,
    centerBack: 0,
    hem: 2,
    attachmentRaw: 1,
    outerRaw: 1,
    neckline: 1,
    collar: 1,
    frontEnd: 1,
    frontTip: 1,
    outer: 1,
  },
};

/** A 3 cm finished placket is a 3 cm outer face plus a 3 cm inner facing,
 * with 1 cm attachment and turn-under allowances. Its fold/attachment lines
 * are construction marks, not invented exterior seams. */
function placketPiece(
  role: "buttonPlacket" | "buttonholePlacket", options: PoloOptions
): Piece {
  const cutWidth = options.placketWidth * 2 + PLACKET_SEAM_ALLOWANCE * 2;
  const faceStart = PLACKET_SEAM_ALLOWANCE;
  const foldX = faceStart + options.placketWidth;
  const turnX = foldX + options.placketWidth;
  const markKind = role === "buttonPlacket" ? "button" : "buttonhole";
  return {
    name: role === "buttonPlacket" ? "button placket" : "buttonhole placket",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(cutWidth, 0) },
      { kind: "line", name: "outerRaw", start: point(cutWidth, 0), end: point(cutWidth, options.placketLength) },
      { kind: "line", name: "bottom", start: point(cutWidth, options.placketLength), end: point(0, options.placketLength) },
      { kind: "line", name: "attachmentRaw", start: point(0, options.placketLength), end: point(0, 0) },
    ],
    marks: [
      lineMark("placementLine", "attachmentLine", point(faceStart, 0), point(faceStart, options.placketLength), "SEW TO FRONT SLIT"),
      lineMark("foldLine", "placketFold", point(foldX, 0), point(foldX, options.placketLength), "FOLD"),
      lineMark("foldLine", "turnUnder", point(turnX, 0), point(turnX, options.placketLength), "TURN UNDER"),
      ...BUTTON_CENTRES.map((y, index) => pointMark(
        markKind, `${markKind}-${index + 1}`, point(faceStart + options.placketWidth / 2, y),
        markKind === "button" ? "BUTTON" : "BUTTONHOLE"
      )),
    ],
  };
}

function poloFront(m: Measurements, options: PoloOptions): Piece {
  const drafted = bodice(m, { position: "front" }).pieces.front;
  const neckline = pieceEdge(drafted, "neckline");
  const slitStart = edgeStart(neckline);
  const slitEnd = point(slitStart.x, slitStart.y + options.placketLength);
  return {
    ...drafted,
    marks: [
      lineMark("cutLine", "placketOpening", slitStart, slitEnd, "CUT FRONT SLIT"),
      lineMark("placementLine", "placketReinforcement", point(slitStart.x, slitEnd.y), point(slitStart.x + 1.5, slitEnd.y), "REINFORCE SLIT BASE"),
    ],
  };
}

export const POLO_SHELL_STITCHES = (): readonly Stitch[] => [
  ...sleevedTopStitches(["side"], false),
  {
    label: "Button placket ↔ left front slit",
    a: iface(markRef("front", "placketOpening", "left")),
    b: iface(markRef("buttonPlacket", "attachmentLine", "left")),
  },
  {
    label: "Buttonhole placket ↔ right front slit",
    a: iface(markRef("front", "placketOpening", "right")),
    b: iface(markRef("buttonholePlacket", "attachmentLine", "right")),
  },
];

/** Drafts only components resolved for Slice 69. `options` remains in the
 * signature so Slice 70 can add collar/stand without changing this contract. */
export function draftPoloShell(m: Measurements, rawOptions: Partial<PoloOptions> = {}): Block {
  const options = resolvePoloOptions(rawOptions);
  const front = poloFront(m, options);
  const back = bodice(m, { position: "back" }).pieces.back;
  const armhole = edgeLength(pieceEdge(front, "armhole")) + edgeLength(pieceEdge(back, "armhole"));
  const sleeve = sleeveComponent(m, { targetArmhole: armhole }).pieces.sleeve;
  return block({
    front,
    back,
    sleeve,
    buttonPlacket: placketPiece("buttonPlacket", options),
    buttonholePlacket: placketPiece("buttonholePlacket", options),
  }, POLO_SHELL_STITCHES());
}

/** One half of a stand, cut on the centre-back fold. Its neckline edge is the
 * real front+back half-neckline length; unfolding produces one continuous
 * stand without an invented centre-back seam. */
function standPiece(name: string, necklineLength: number, height: number): Piece {
  return {
    name,
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: point(0, height), end: point(0, 0) },
      { kind: "line", name: "collar", start: point(0, 0), end: point(necklineLength, 0) },
      { kind: "line", name: "frontEnd", start: point(necklineLength, 0), end: point(necklineLength, height) },
      { kind: "line", name: "neckline", start: point(necklineLength, height), end: point(0, height) },
    ],
    marks: [lineMark("placementLine", "centerMatch", point(0, 0), point(0, height), "PLACE ON FOLD")],
  };
}

/** One half of a pointed collar leaf, also cut on the centre-back fold. The
 * base intentionally equals the stand's collar edge; only the outer edge
 * flares to make the two front tips. */
function collarPiece(name: string, necklineLength: number, depth: number): Piece {
  return {
    name,
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: point(0, depth), end: point(0, 0) },
      { kind: "line", name: "stand", start: point(0, 0), end: point(necklineLength, 0) },
      { kind: "line", name: "frontTip", start: point(necklineLength, 0), end: point(necklineLength + COLLAR_TIP_FLARE, depth) },
      { kind: "line", name: "outer", start: point(necklineLength + COLLAR_TIP_FLARE, depth), end: point(0, depth) },
    ],
    marks: [lineMark("placementLine", "centerMatch", point(0, 0), point(0, depth), "PLACE ON FOLD")],
  };
}

function poloCollarStitches(): readonly Stitch[] {
  return [
    {
      label: "Outer stand ↔ polo neckline",
      a: iface(edgeRef("outerStand", "neckline")),
      b: iface(edgeRef("front", "neckline"), edgeRef("back", "neckline")),
    },
    {
      label: "Under collar ↔ outer stand",
      a: iface(edgeRef("underCollar", "stand")),
      b: iface(edgeRef("outerStand", "collar")),
    },
    {
      label: "Upper collar ↔ inner stand",
      a: iface(edgeRef("upperCollar", "stand")),
      b: iface(edgeRef("innerStand", "collar")),
    },
    {
      label: "Collar outer seam (upper ↔ under)",
      a: iface(edgeRef("upperCollar", "frontTip"), edgeRef("upperCollar", "outer")),
      b: iface(edgeRef("underCollar", "frontTip"), edgeRef("underCollar", "outer")),
    },
  ];
}

/** Completes the Slice 70 draft. Four layer pieces are emitted instead of a
 * metadata-only “cut two”, so nesting/export have actual physical quantities. */
export function draftPolo(m: Measurements, rawOptions: Partial<PoloOptions> = {}): Block {
  const options = resolvePoloOptions(rawOptions);
  const shell = draftPoloShell(m, options);
  const necklineLength = edgeLength(pieceEdge(shell.roles.front, "neckline")) +
    edgeLength(pieceEdge(shell.roles.back, "neckline"));
  const outerStand = standPiece("outer collar stand", necklineLength, options.standHeight);
  const innerStand = standPiece("inner collar stand", necklineLength, options.standHeight);
  const upperCollar = collarPiece("upper pointed collar", necklineLength, options.collarLeafDepth);
  const underCollar = collarPiece("under pointed collar", necklineLength, options.collarLeafDepth);
  return block({
    ...shell.roles,
    outerStand,
    innerStand,
    upperCollar,
    underCollar,
  }, [...shell.stitches, ...poloCollarStitches()]);
}

/** Polo-specific warnings. Every value stays drafted exactly as supplied; a
 * warning names the correction rather than altering it behind the maker's back. */
export function poloGuidance(block: Block, m: Measurements, rawOptions: Partial<PoloOptions> = {}): Note[] {
  const options = resolvePoloOptions(rawOptions);
  const notes = [...sleevedTopGuidance(block, m)];
  for (const definition of POLO_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof PoloOptions];
    if (value < definition.min || value > definition.max) {
      notes.push({ field: `option-${definition.id}`, level: "warn", text: `${definition.label} (${value} cm) is outside V1's ${definition.min}–${definition.max} cm range — adjust it into that range.` });
    }
  }
  const minimumLength = BUTTON_CENTRES[BUTTON_CENTRES.length - 1] + MIN_BUTTON_END_CLEARANCE;
  if (options.placketLength < minimumLength) {
    notes.push({ field: "option-placketLength", level: "warn", text: `Placket (${options.placketLength} cm) is too short for the fixed button group — increase it to at least ${minimumLength} cm.` });
  }
  const frontNeckline = edgeStart(pieceEdge(block.roles.front, "neckline"));
  if (frontNeckline.y + options.placketLength > m.length - 2) {
    notes.push({ field: "option-placketLength", level: "warn", text: `Placket reaches the hem allowance — shorten it to ${Math.max(0, m.length - 2 - frontNeckline.y)} cm or less.` });
  }
  if (options.standHeight > options.collarLeafDepth) {
    notes.push({ field: "option-standHeight", level: "warn", text: "Stand is deeper than the collar leaf — reduce stand height or increase collar leaf depth." });
  }
  return notes;
}

function markedPoint(block: Block, pieceRole: string, name: string): { readonly x: number; readonly y: number } {
  const mark = rolePiece(block, pieceRole).marks?.find((candidate) => candidate.name === name);
  if (!mark || !("at" in mark)) throw new Error(`Polo piece "${pieceRole}" has no point mark "${name}"`);
  return mark.at;
}

/** Polo keeps the tee's body/sleeve POMs and adds every new finished V1 fact. */
export const POLO_POMS: readonly Pom[] = [
  // Kept local rather than sharing the exported array by reference: a Polo
  // tech pack must remain self-contained if the tee later gains a tee-only POM.
  {
    label: "Finished placket length",
    tolerance: 0.3,
    measure: (block) => seam(rolePiece(block, "buttonPlacket"), "attachmentRaw"),
  },
  {
    label: "Finished placket width",
    tolerance: 0.2,
    measure: (block) => {
      const piece = rolePiece(block, "buttonPlacket");
      const attachment = piece.marks?.find((mark) => mark.name === "attachmentLine");
      const fold = piece.marks?.find((mark) => mark.name === "placketFold");
      if (!attachment || !fold || !("start" in attachment) || !("start" in fold)) {
        throw new Error("Polo placket construction marks are missing");
      }
      return distance(attachment.start, fold.start);
    },
  },
  {
    label: "Button spacing",
    tolerance: 0.15,
    measure: (block) => distance(
      markedPoint(block, "buttonPlacket", "button-1"),
      markedPoint(block, "buttonPlacket", "button-2")
    ),
  },
  {
    label: "Finished collar stand height",
    tolerance: 0.2,
    measure: (block) => seam(rolePiece(block, "outerStand"), "frontEnd"),
  },
  {
    label: "Finished pointed collar leaf",
    tolerance: 0.3,
    measure: (block) => seam(rolePiece(block, "upperCollar"), "centerBack"),
  },
];

/** Notches and grainlines for every Polo piece. Sleeve/body tables are reused
 * verbatim because those pieces are the current tee geometry, not lookalikes. */
export const POLO_NOTCHES: readonly PieceNotches[] = [
  ...TSHIRT_NOTCHES,
  {
    pieceName: "button placket",
    notches: [{ edgeName: "attachmentRaw", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  {
    pieceName: "buttonhole placket",
    notches: [{ edgeName: "attachmentRaw", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  ...["outer collar stand", "inner collar stand"].map((pieceName) => ({
    pieceName,
    notches: [{ edgeName: "frontEnd", t: 0.5 }],
    grainline: { topEdge: "collar", topT: 0.5, bottomEdge: "neckline", bottomT: 0.5 },
  })),
  ...["upper pointed collar", "under pointed collar"].map((pieceName) => ({
    pieceName,
    notches: [{ edgeName: "frontTip", t: 0.5 }],
    grainline: { topEdge: "stand", topT: 0.5, bottomEdge: "outer", bottomT: 0.5 },
  })),
];
