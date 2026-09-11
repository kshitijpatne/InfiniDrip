// Polo V1 shell (Slice 69): tee body/sleeve plus a real centre-front slit and
// two folded plackets. Collar and stand join this block in Slice 70.

import { point } from "../geometry";
import { Block, block } from "./block";
import { bodice } from "./bodice";
import { Measurements } from "./measurements";
import { GarmentOption } from "./options";
import { Piece, edgeLength, edgeStart, pieceEdge } from "./piece";
import { lineMark, pointMark } from "./pattern-mark";
import { sleeve as sleeveComponent } from "./sleeve";
import { iface, markRef, Stitch } from "./stitch";
import { sleevedTopStitches } from "./tshirt-checks";

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
