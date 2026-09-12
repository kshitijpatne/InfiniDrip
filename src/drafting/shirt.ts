import { cubicLength, lerp, point, CubicBezier } from "../geometry";
import { Block, block } from "./block";
import { Measurements } from "./measurements";
import { Piece, Edge, edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { edgeRef, iface, markRef, Stitch } from "./stitch";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { WovenShirtOptions, resolveWovenShirtOptions } from "./shirt-contract";
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

function wovenCollarStitches(necklineRole: "back" | "yoke"): readonly Stitch[] {
  return WOVEN_SHIRT_COLLAR_STITCHES.map((stitch) => {
    if (stitch.label !== "Outer stand ↔ woven neckline") return stitch;
    return {
      ...stitch,
      b: iface(edgeRef("front", "neckline"), edgeRef(necklineRole, "neckline")),
    };
  });
}

/** Add the four physical collar layers to an already drafted woven body. */
export function addWovenShirtCollar(
  body: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const necklineRole = "yoke" in body.roles ? "yoke" : "back";
  const necklineLength = edgeLength(pieceEdge(body.roles.front, "neckline")) +
    edgeLength(pieceEdge(body.roles[necklineRole], "neckline"));
  const outerStand = standPiece("outer woven stand", necklineLength, options.standHeight);
  const innerStand = standPiece("inner woven stand", necklineLength, options.standHeight);
  const upperCollar = collarPiece("upper pointed woven collar", necklineLength, options.collarLeafDepth);
  const underCollar = collarPiece("under pointed woven collar", necklineLength, options.collarLeafDepth);
  return block({ ...body.roles, outerStand, innerStand, upperCollar, underCollar }, [
    ...body.stitches, ...wovenCollarStitches(necklineRole),
  ]);
}

export function draftWovenShirtCollar(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtCollar(draftWovenShirtBody(m, rawOptions), rawOptions);
}

function splitCubic(curve: CubicBezier, t: number): { readonly left: CubicBezier; readonly right: CubicBezier } {
  const p01 = lerp(curve.start, curve.control1, t);
  const p12 = lerp(curve.control1, curve.control2, t);
  const p23 = lerp(curve.control2, curve.end, t);
  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);
  const split = lerp(p012, p123, t);
  return {
    left: { start: curve.start, control1: p01, control2: p012, end: split },
    right: { start: split, control1: p123, control2: p23, end: curve.end },
  };
}

/** Replace the back's upper outline with a true yoke seam. The armhole curve
 * is split at the requested depth so the lower back remains a real garment
 * piece and the yoke still carries the neckline/shoulder. */
export function addWovenShirtYoke(
  body: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const back = body.roles.back;
  const armhole = pieceEdge(back, "armhole");
  if (armhole.kind !== "curve") throw new Error("Woven back armhole must be a curve for yoke splitting");
  const shoulder = edgeStart(pieceEdge(back, "shoulder"));
  const t = (options.yokeDepth - shoulder.y) /
    (edgeEnd(armhole).y - shoulder.y);
  const split = splitCubic(armhole.curve, t);
  const foldTop = point(0, options.yokeDepth);
  const backLower: Piece = {
    name: "woven back lower",
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: edgeStart(pieceEdge(back, "hem")), end: foldTop },
      { kind: "line", name: "yokeSeam", start: foldTop, end: split.right.start },
      { kind: "curve", name: "armholeLower", curve: split.right },
      pieceEdge(back, "sideUpper"),
      pieceEdge(back, "sideMiddle"),
      pieceEdge(back, "sideLower"),
      pieceEdge(back, "hem"),
    ],
  };
  const yoke: Piece = {
    name: "woven back yoke",
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: foldTop, end: edgeStart(pieceEdge(back, "centerBack")) },
      pieceEdge(back, "neckline"),
      pieceEdge(back, "shoulder"),
      { kind: "curve", name: "armholeUpper", curve: split.left },
      { kind: "line", name: "yokeSeam", start: split.left.end, end: foldTop },
    ],
  };
  const stitches: Stitch[] = [
    {
      label: "Shoulder seam (front ↔ yoke)",
      a: iface(edgeRef("front", "shoulder")),
      b: iface(edgeRef("yoke", "shoulder")),
    },
    {
      label: "Side seam (front ↔ back)",
      a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideMiddle"), edgeRef("front", "sideLower")),
      b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideMiddle"), edgeRef("back", "sideLower")),
    },
    {
      label: "Yoke seam (yoke ↔ back lower)",
      a: iface(edgeRef("yoke", "yokeSeam")),
      b: iface(edgeRef("back", "yokeSeam")),
    },
  ];
  return block({ ...body.roles, back: backLower, yoke }, stitches);
}

export function draftWovenShirtYoke(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtYoke(draftWovenShirtBody(m, rawOptions), rawOptions);
}

function patchPocket(width: number, height: number): Piece {
  return {
    name: "woven patch pocket",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(width, 0) },
      { kind: "line", name: "sideRight", start: point(width, 0), end: point(width, height) },
      { kind: "line", name: "bottom", start: point(width, height), end: point(0, height) },
      { kind: "line", name: "sideLeft", start: point(0, height), end: point(0, 0) },
    ],
    marks: [lineMark("foldLine", "pocketTopTurn", point(0, 1), point(width, 1), "TURN UNDER")],
  };
}

export const WOVEN_SHIRT_POCKET_STITCHES: readonly Stitch[] = [
  {
    label: "Patch pocket ↔ front placement",
    a: iface(edgeRef("pocket", "top")),
    b: iface(markRef("front", "pocketPlacement", "left")),
  },
];

export function addWovenShirtPocket(
  yoke: Block, m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const pocketX = m.chest / 20;
  const pocketY = m.armholeDepth + 6;
  const front = yoke.roles.front;
  const frontWithPlacement: Piece = {
    ...front,
    marks: [
      ...(front.marks ?? []),
      lineMark("placementLine", "pocketPlacement", point(pocketX, pocketY), point(pocketX + options.pocketWidth, pocketY), "POCKET PLACEMENT"),
    ],
  };
  return block({
    ...yoke.roles,
    front: frontWithPlacement,
    pocket: patchPocket(options.pocketWidth, options.pocketHeight),
  }, [...yoke.stitches, ...WOVEN_SHIRT_POCKET_STITCHES]);
}

export function draftWovenShirtPocket(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtPocket(draftWovenShirtYoke(m, rawOptions), m, rawOptions);
}

function curvedHemAndVent(piece: Piece, ventDepth: number): Piece {
  const hem = pieceEdge(piece, "hem");
  const sideEnd = edgeStart(hem);
  const ventTop = point(sideEnd.x, sideEnd.y - ventDepth);
  const updatedEdges = piece.edges.flatMap((edge): Edge[] => {
    if (edge.name === "sideLower") {
      return [{ kind: "line", name: "sideLower", start: edgeStart(edge), end: ventTop }];
    }
    if (edge.name === "hem") {
      return [
        { kind: "line", name: "vent", start: ventTop, end: sideEnd },
        { kind: "curve", name: "hem", curve: {
          start: sideEnd,
          control1: point((sideEnd.x * 0.66), sideEnd.y + 1),
          control2: point((sideEnd.x * 0.33), sideEnd.y + 1),
          end: edgeEnd(edge),
        } },
      ];
    }
    return [edge];
  });
  return {
    ...piece,
    edges: updatedEdges,
    marks: [
      ...(piece.marks ?? []),
      pointMark("placementPoint", "ventTop", ventTop, "VENT TOP"),
    ],
  };
}

/** Turn the body hems into a shallow curved hem and leave the selected lower
 * side-seam section open as a real vent boundary. */
export function addWovenShirtHemVent(
  block: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  return blockFromRoles(block, {
    front: curvedHemAndVent(block.roles.front, options.sideVentDepth),
    back: curvedHemAndVent(block.roles.back, options.sideVentDepth),
  });
}

function blockFromRoles(base: Block, replacements: Readonly<Record<string, Piece>>): Block {
  return block({ ...base.roles, ...replacements }, base.stitches);
}

function wovenCapCurves(width: number, capHeight: number): readonly [CubicBezier, CubicBezier] {
  const half = width / 2;
  return [
    {
      start: point(0, capHeight), control1: point(half * 0.5, capHeight),
      control2: point(half * 0.55, capHeight * 0.15), end: point(half, 0),
    },
    {
      start: point(half, 0), control1: point(width - half * 0.55, capHeight * 0.15),
      control2: point(width - half * 0.5, capHeight), end: point(width, capHeight),
    },
  ];
}

function solveWovenCapHeight(width: number, target: number): number {
  let lo = 0;
  let hi = width;
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    const curves = wovenCapCurves(width, mid);
    if (cubicLength(curves[0]) + cubicLength(curves[1]) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function wovenSleeve(m: Measurements, targetArmhole: number): Piece {
  const width = m.bicep + m.ease * 0.5;
  const capHeight = solveWovenCapHeight(width, targetArmhole + 1.5);
  const [capLeft, capRight] = wovenCapCurves(width, capHeight);
  const taper = 3;
  const hemY = capHeight + m.sleeveLength;
  const rightHem = point(width - taper, hemY);
  const leftHem = point(taper, hemY);
  return {
    name: "woven short sleeve",
    onFold: false,
    edges: [
      { kind: "curve", name: "capLeft", curve: capLeft },
      { kind: "curve", name: "capRight", curve: capRight },
      { kind: "line", name: "sideRight", start: point(width, capHeight), end: rightHem },
      { kind: "line", name: "hem", start: rightHem, end: leftHem },
      { kind: "line", name: "sideLeft", start: leftHem, end: point(0, capHeight) },
    ],
  };
}

function sleeveBand(width: number, depth: number): Piece {
  return {
    name: "woven folded sleeve band",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(width, 0) },
      { kind: "line", name: "sideRight", start: point(width, 0), end: point(width, depth) },
      { kind: "line", name: "bottom", start: point(width, depth), end: point(0, depth) },
      { kind: "line", name: "sideLeft", start: point(0, depth), end: point(0, 0) },
    ],
    marks: [lineMark("foldLine", "bandFold", point(0, depth / 2), point(width, depth / 2), "FOLD")],
  };
}

export const WOVEN_SHIRT_SLEEVE_STITCHES: readonly Stitch[] = [
  {
    label: "Woven sleeve-cap ease",
    a: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
    b: iface(edgeRef("front", "armhole"), edgeRef("yoke", "armholeUpper"), edgeRef("back", "armholeLower")),
    ease: { lo: -1, hi: 4 },
  },
  {
    label: "Folded sleeve band ↔ sleeve hem",
    a: iface(edgeRef("sleeveBand", "top")),
    b: iface(edgeRef("sleeve", "hem")),
  },
];

/** Add a short set-in sleeve and a separate folded sleeve band to a yoke block. */
export function addWovenShirtSleeves(
  blockWithYoke: Block, m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const armhole = edgeLength(pieceEdge(blockWithYoke.roles.front, "armhole")) +
    edgeLength(pieceEdge(blockWithYoke.roles.yoke, "armholeUpper")) +
    edgeLength(pieceEdge(blockWithYoke.roles.back, "armholeLower"));
  const sleeve = wovenSleeve(m, armhole);
  const band = sleeveBand(edgeLength(pieceEdge(sleeve, "hem")), options.sleeveBandDepth);
  return block({ ...blockWithYoke.roles, sleeve, sleeveBand: band }, [
    ...blockWithYoke.stitches, ...WOVEN_SHIRT_SLEEVE_STITCHES,
  ]);
}

export function draftWovenShirtSleeves(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return addWovenShirtSleeves(addWovenShirtYoke(draftWovenShirtBody(m, rawOptions), rawOptions), m, rawOptions);
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
