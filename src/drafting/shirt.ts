import { point } from "../geometry";
import { Block, block } from "./block";
import { Measurements } from "./measurements";
import { Piece, Edge } from "./piece";
import { edgeRef, iface, Stitch } from "./stitch";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { WovenShirtOptions, resolveWovenShirtOptions } from "./shirt-contract";
import { edgeLength, edgeStart, pieceEdge } from "./piece";
import { lineMark, pointMark } from "./pattern-mark";

/** The relaxed woven body is drafted as a half-width back on fold and a
 * separate half-width front. Fronts are cut as a mirrored pair later; keeping
 * centre front as a real edge gives the placket a named attachment boundary. */
function shirtPanel(m: Measurements, position: "front" | "back", options: WovenShirtOptions): Piece {
  const chestHalf = (m.chest + m.ease) / 4;
  const waistHalf = (m.waist + m.ease) / 4;
  const hipHalf = (m.hip + m.ease) / 4;
  const shoulderHalf = m.shoulderWidth / 2;
  const neckHalf = (m.neck + options.neckEase) / 4;
  const baseDepth = position === "front" ? neckHalf * 0.8 : neckHalf * 0.3;
  const neckline = necklineEdge(
    position, neckHalf, baseDepth, shoulderHalf, m.armholeDepth, NECKLINE_DEFAULT
  );
  const shoulder = point(shoulderHalf, 2.5);
  const underarm = point(chestHalf, m.armholeDepth);
  const waist = point(waistHalf, m.armholeDepth + (m.length - m.armholeDepth) * 0.35);
  const hip = point(hipHalf, waist.y + m.hipDepth);
  const sideHem = point(hipHalf, m.length);
  const cHem = point(0, m.length);
  const armhole: Edge = {
    kind: "curve", name: "armhole", curve: {
      start: shoulder,
      control1: point(shoulderHalf, 2.5 + (m.armholeDepth - 2.5) * 0.45),
      control2: point(chestHalf - 2, m.armholeDepth - 3),
      end: underarm,
    },
  };
  return {
    name: position === "front" ? "woven front" : "woven back",
    onFold: position === "back",
    edges: [
      neckline.edge,
      { kind: "line", name: "shoulder", start: neckline.hps, end: shoulder },
      armhole,
      { kind: "line", name: "sideUpper", start: underarm, end: waist },
      { kind: "line", name: "sideMiddle", start: waist, end: hip },
      { kind: "line", name: "sideLower", start: hip, end: sideHem },
      { kind: "line", name: "hem", start: sideHem, end: cHem },
      { kind: "line", name: position === "front" ? "centerFront" : "centerBack", start: cHem, end: neckline.cNeck },
    ],
  };
}

export const WOVEN_SHIRT_BODY_STITCHES: readonly Stitch[] = [
  {
    label: "Shoulder seam (front ↔ back)",
    a: iface(edgeRef("front", "shoulder")),
    b: iface(edgeRef("back", "shoulder")),
  },
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideMiddle"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideMiddle"), edgeRef("back", "sideLower")),
  },
];

/** Slice 87's woven-only body component. It deliberately does not reuse
 * `bodice()`: neck circumference, front closure edge, and lower shaping have
 * different semantics from the knit tee block. */
export function draftWovenShirtBody(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  return block({
    front: shirtPanel(m, "front", options),
    back: shirtPanel(m, "back", options),
  }, WOVEN_SHIRT_BODY_STITCHES);
}

const COLLAR_TIP_FLARE = 2;

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

export const WOVEN_SHIRT_COLLAR_STITCHES: readonly Stitch[] = [
  {
    label: "Outer stand ↔ woven neckline",
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

/** Add the four physical collar layers to an already drafted woven body. */
export function addWovenShirtCollar(
  body: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const necklineLength = edgeLength(pieceEdge(body.roles.front, "neckline")) +
    edgeLength(pieceEdge(body.roles.back, "neckline"));
  const outerStand = standPiece("outer woven stand", necklineLength, options.standHeight);
  const innerStand = standPiece("inner woven stand", necklineLength, options.standHeight);
  const upperCollar = collarPiece("upper pointed woven collar", necklineLength, options.collarLeafDepth);
  const underCollar = collarPiece("under pointed woven collar", necklineLength, options.collarLeafDepth);
  return block({ ...body.roles, outerStand, innerStand, upperCollar, underCollar }, [
    ...body.stitches, ...WOVEN_SHIRT_COLLAR_STITCHES,
  ]);
}

export function draftWovenShirtCollar(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtCollar(draftWovenShirtBody(m, rawOptions), rawOptions);
}

const PLACKET_SEAM_ALLOWANCE = 1;
const FIRST_BUTTON_DROP = 5;

export function frontButtonPositions(buttonCount: number, spacing: number): readonly number[] {
  if (!Number.isInteger(buttonCount) || buttonCount < 0) return [];
  return Array.from({ length: buttonCount }, (_, index) => FIRST_BUTTON_DROP + index * spacing);
}

function placketPiece(
  name: string, length: number, options: WovenShirtOptions,
  markKind: "button" | "buttonhole"
): Piece {
  const cutWidth = options.placketWidth + PLACKET_SEAM_ALLOWANCE * 2;
  const faceStart = PLACKET_SEAM_ALLOWANCE;
  const faceEnd = faceStart + options.placketWidth;
  const closureX = options.frontOverlap;
  const prefix = markKind === "button" ? "button" : "buttonhole";
  const buttonMarks = frontButtonPositions(options.buttonCount, options.buttonSpacing).map((y, index) =>
    pointMark(markKind, `${prefix}-${index + 1}`, point(closureX, y), markKind === "button" ? "BUTTON" : "BUTTONHOLE")
  );
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(cutWidth, 0) },
      { kind: "line", name: "outerRaw", start: point(cutWidth, 0), end: point(cutWidth, length) },
      { kind: "line", name: "bottom", start: point(cutWidth, length), end: point(0, length) },
      { kind: "line", name: "attachmentRaw", start: point(0, length), end: point(0, 0) },
    ],
    marks: [
      lineMark("placementLine", "placketFace", point(faceStart, 0), point(faceStart, length), "FOLD"),
      lineMark("foldLine", "placketFold", point(faceEnd, 0), point(faceEnd, length), "FOLD"),
      lineMark("placementLine", "closureLine", point(closureX, 0), point(closureX, length), "CLOSURE"),
      ...buttonMarks,
    ],
  };
}

export const WOVEN_SHIRT_PLACKET_STITCHES: readonly Stitch[] = [
  {
    label: "Button placket ↔ right front centre front",
    a: iface(edgeRef("buttonPlacket", "attachmentRaw")),
    b: iface(edgeRef("front", "centerFront")),
  },
  {
    label: "Buttonhole placket ↔ left front centre front",
    a: iface(edgeRef("buttonholePlacket", "attachmentRaw")),
    b: iface(edgeRef("front", "centerFront")),
  },
];

/** Add two full-length folded plackets and the one additional collar-stand
 * button/hole pair. Front buttons and buttonholes share measured positions. */
export function addWovenShirtPlackets(
  collar: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const frontLength = edgeLength(pieceEdge(collar.roles.front, "centerFront"));
  const necklineLength = edgeLength(pieceEdge(collar.roles.outerStand, "collar"));
  const stand = collar.roles.outerStand;
  const innerStand = collar.roles.innerStand;
  const standY = edgeStart(pieceEdge(stand, "centerBack")).y / 2;
  const standButtonX = necklineLength - PLACKET_SEAM_ALLOWANCE;
  const outerStand: Piece = {
    ...stand,
    marks: [...(stand.marks ?? []), pointMark("button", "stand-button", point(standButtonX, standY), "STAND BUTTON")],
  };
  const innerStandWithHole: Piece = {
    ...innerStand,
    marks: [...(innerStand.marks ?? []), pointMark("buttonhole", "stand-buttonhole", point(standButtonX, standY), "STAND BUTTONHOLE")],
  };
  return block({
    ...collar.roles,
    outerStand,
    innerStand: innerStandWithHole,
    buttonPlacket: placketPiece("woven button placket", frontLength, options, "button"),
    buttonholePlacket: placketPiece("woven buttonhole placket", frontLength, options, "buttonhole"),
  }, [...collar.stitches, ...WOVEN_SHIRT_PLACKET_STITCHES]);
}

export function draftWovenShirtPlackets(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtPlackets(draftWovenShirtCollar(m, rawOptions), rawOptions);
}
