import { cubicLength, distance, lerp, point, CubicBezier } from "../geometry";
import { Block, block } from "./block";
import { Measurements } from "./measurements";
import { Piece, Edge, edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { edgeRef, iface, markRef, Stitch } from "./stitch";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { WovenShirtOptions, hasWovenShirtDartProfile, resolveWovenShirtOptions, WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID, WOVEN_SHIRT_OPTION_DEFINITIONS } from "./shirt-contract";
import { lineMark, pointMark } from "./pattern-mark";
import { PieceNotches } from "./tshirt-notches";
import { Pom } from "./pom";
import { dartIntake } from "./dart";
import { GradeRule } from "./grading";
import { AllowanceSpec } from "./allowance";
import { Note } from "../guidance/note";
import type { ComponentResult } from "./component";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { rotatePoint } from "../geometry/rotate";

export interface WovenShirtBodyHalfWidths {
  readonly chestHalf: number;
  readonly waistHalf: number;
  readonly hipHalf: number;
}

function interpolateWidth(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/** Resolve profile widths from body measurements without editing those measurements. */
export function wovenShirtBodyHalfWidths(
  m: Measurements, boxySideProfile = 0,
): WovenShirtBodyHalfWidths {
  const chestHalf = (m.chest + m.ease) / 4;
  const waistHalf = (m.waist + m.ease) / 4;
  const hipHalf = (m.hip + m.ease) / 4;
  const boxyHalf = Math.max(chestHalf, waistHalf, hipHalf);
  const profile = boxySideProfile / 100;
  return {
    chestHalf: interpolateWidth(chestHalf, boxyHalf, profile),
    waistHalf: interpolateWidth(waistHalf, boxyHalf, profile),
    hipHalf: interpolateWidth(hipHalf, boxyHalf, profile),
  };
}

const WOVEN_SHIRT_SIDE_EDGE_NAMES = ["sideUpper", "sideMiddle", "sideLower"] as const;
const WOVEN_SHIRT_DART_CONTINUATION = "dartSideContinuation";
const WOVEN_SHIRT_DART_OPTION_IDS = [
  "bustDartIntakeCm",
  "bustDartTargetAcrossFrontPercent",
  "bustDartTargetFromUnderarmToHemPercent",
] as const;

function rawWovenDartControlsAreFinite(rawOptions: Partial<WovenShirtOptions> | undefined): boolean {
  return rawOptions === undefined || WOVEN_SHIRT_DART_OPTION_IDS.every((id) =>
    !Object.prototype.hasOwnProperty.call(rawOptions, id) || Number.isFinite(rawOptions[id]));
}

function supportedWovenDartOption(id: string, value: number): boolean {
  const definition = WOVEN_SHIRT_OPTION_DEFINITIONS.find((candidate) => candidate.id === id);
  return definition !== undefined && Number.isFinite(value)
    && value >= definition.min && value <= definition.max
    && Number.isInteger((value - definition.min) / definition.step);
}

function rawWovenDartOptionsAreSupported(options: Partial<WovenShirtOptions>): boolean {
  return WOVEN_SHIRT_DART_OPTION_IDS.every((id) =>
    !Object.prototype.hasOwnProperty.call(options, id)
    || supportedWovenDartOption(id, options[id] as number));
}

function pointOnWovenSideAtY(piece: Piece, y: number): { readonly index: number; readonly at: ReturnType<typeof point>; readonly t: number } | null {
  for (const name of WOVEN_SHIRT_SIDE_EDGE_NAMES) {
    const index = piece.edges.findIndex((edge) => edge.name === name);
    // The internal woven-shirt panels always carry these three named lines.
    const edge = piece.edges[index] as WovenShirtLineEdge;
    const dy = edge.end.y - edge.start.y;
    if (Math.abs(dy) < 1e-9) continue;
    const t = (y - edge.start.y) / dy;
    if (t > 1e-8 && t < 1 - 1e-8) {
      return { index, t, at: lerp(edge.start, edge.end, t) };
    }
  }
  return null;
}

type WovenShirtLineEdge = Extract<Edge, { kind: "line" }>;

function rotateWovenSideLine(
  edge: WovenShirtLineEdge, apex: ReturnType<typeof point>, angle: number,
): WovenShirtLineEdge {
  const rotate = (value: ReturnType<typeof point>) => rotatePoint(value, apex, angle);
  // shirtPanel authors the named torso side seams and hem as straight edges.
  return { ...edge, start: rotate(edge.start), end: rotate(edge.end) };
}

function wovenBustDartUpperMouthY(m: Measurements, options: WovenShirtOptions): number {
  return m.armholeDepth + (m.length - m.armholeDepth)
    * options.bustDartTargetFromUnderarmToHemPercent! / 100
    - options.bustDartIntakeCm! / 2;
}

/** Open a W08 side dart from its closed woven front while retaining the
 * authored side-seam lengths. A null result means the options cannot produce
 * a safe digital opening; callers keep the undarted preview and issue guidance. */
function openWovenShirtSideBustDart(
  front: Piece, m: Measurements, options: WovenShirtOptions,
): Piece | null {
  // The active W08 profile resolves each optional contract value to its
  // declared default before this geometry helper is called.
  const intake = options.bustDartIntakeCm!;
  const across = options.bustDartTargetAcrossFrontPercent!;
  const vertical = options.bustDartTargetFromUnderarmToHemPercent!;
  if (!["bustDartIntakeCm", "bustDartTargetAcrossFrontPercent", "bustDartTargetFromUnderarmToHemPercent"]
    .every((id) => supportedWovenDartOption(id, options[id as keyof WovenShirtOptions] as number))) return null;

  const widths = wovenShirtBodyHalfWidths(m, options.boxySideProfile);
  const apex = point(widths.chestHalf * across / 100,
    m.armholeDepth + (m.length - m.armholeDepth) * vertical / 100);
  const upperMouthY = wovenBustDartUpperMouthY(m, options);
  const split = pointOnWovenSideAtY(front, upperMouthY);
  const apexBoundary = pointOnWovenSideAtY(front, apex.y);
  if (!split || !Number.isFinite(apex.x) || !Number.isFinite(apex.y)
    || !apexBoundary || apex.x >= apexBoundary.at.x || apex.x <= 0
    || apex.y <= m.armholeDepth || apex.y >= m.length
    || apex.x <= options.placketWidth + options.frontOverlap) return null;

  // pointOnWovenSideAtY returns only named straight side-seam edges.
  const sideEdge = front.edges[split.index] as WovenShirtLineEdge;
  const upperMouth = split.at;
  const radius = distance(upperMouth, apex);
  const openingAngle = 2 * Math.asin(intake / (2 * radius));

  const prefix: Edge = { ...sideEdge, end: upperMouth };
  const lowerMouth = rotatePoint(upperMouth, apex, openingAngle);
  const continuation: Edge = rotateWovenSideLine({
    ...sideEdge,
    name: WOVEN_SHIRT_DART_CONTINUATION,
    start: upperMouth,
  }, apex, openingAngle);
  // shirtPanel always authors the named hem as a line before this helper runs.
  const hem = front.edges.find((edge) => edge.name === "hem") as WovenShirtLineEdge;

  const edges: Edge[] = [];
  front.edges.forEach((edge, index) => {
    if (index < split.index) {
      edges.push(edge);
      return;
    }
    if (index === split.index) {
      edges.push(
        prefix,
        { kind: "line", name: "bustDartUpper", start: upperMouth, end: apex },
        { kind: "line", name: "bustDartLower", start: apex, end: lowerMouth },
        continuation,
      );
      return;
    }
    if ((WOVEN_SHIRT_SIDE_EDGE_NAMES as readonly string[]).includes(edge.name)) {
      edges.push(rotateWovenSideLine(edge as WovenShirtLineEdge, apex, openingAngle));
      return;
    }
    if (edge.name === "hem") {
      const rotatedHem = rotateWovenSideLine(hem, apex, openingAngle);
      edges.push({ ...rotatedHem, end: hem.end });
      return;
    }
    edges.push(edge);
  });

  // The generated side chain always meets the generated hem; when the dart
  // mouth splits sideLower, its named continuation is the final segment.
  const openedHem = edges.find((edge) => edge.name === "hem")!;
  const sideEnd = edges.find((edge) => (edge.name === "sideLower" || edge.name === WOVEN_SHIRT_DART_CONTINUATION)
    && distance(edgeEnd(edge), edgeStart(openedHem)) <= 1e-7)!;
  if (edgeLength(sideEnd) <= options.sideVentDepth) return null;
  return {
    ...front,
    edges,
    marks: [
      ...(front.marks ?? []),
      lineMark("placementLine", "bustDartUpperLeg", upperMouth, apex, "BUST DART", "instruction"),
      lineMark("placementLine", "bustDartLowerLeg", lowerMouth, apex),
    ],
    dart: { legs: ["bustDartUpper", "bustDartLower"] },
  };
}

/** Keep W04's digital hip-width station above the vent opening without
 * changing the body-derived location used by other woven-shirt profiles. */
export function wovenShirtHipStationY(
  m: Measurements, sideVentDepth: number, croppedBoxy = false,
): number {
  const bodyStationY = wovenHipStationY(m.length, m.armholeDepth, m.hipDepth);
  return croppedBoxy ? Math.min(bodyStationY, m.length - sideVentDepth - 1) : bodyStationY;
}

/** The relaxed woven body is drafted as a half-width back on fold and a
 * separate half-width front. Fronts are cut as a mirrored pair later; keeping
 * centre front as a real edge gives the placket a named attachment boundary. */
function shirtPanel(
  m: Measurements,
  position: "front" | "back",
  options: WovenShirtOptions,
  croppedBoxy = false,
  rawOptions?: Partial<WovenShirtOptions>,
): Piece {
  const { chestHalf, waistHalf, hipHalf } = wovenShirtBodyHalfWidths(m, options.boxySideProfile);
  const shoulderHalf = m.shoulderWidth / 2;
  const neckHalf = (m.neck + options.neckEase) / 4;
  const baseDepth = position === "front" ? neckHalf * 0.8 : neckHalf * 0.3;
  const neckline = necklineEdge(
    position, neckHalf, baseDepth, shoulderHalf, m.armholeDepth, NECKLINE_DEFAULT
  );
  const shoulder = point(shoulderHalf + options.shoulderExtension, 2.5 + options.shoulderDrop);
  const underarm = point(chestHalf, m.armholeDepth);
  const waist = point(waistHalf, m.armholeDepth + (m.length - m.armholeDepth) * 0.35);
  const hip = point(hipHalf, wovenShirtHipStationY(m, options.sideVentDepth, croppedBoxy));
  const sideHem = point(hipHalf, m.length);
  const cHem = point(0, m.length);
  const armhole: Edge = {
    kind: "curve", name: "armhole", curve: {
      start: shoulder,
      control1: point(shoulder.x, shoulder.y + (m.armholeDepth - shoulder.y) * 0.45),
      control2: point(chestHalf - 2, m.armholeDepth - 3),
      end: underarm,
    },
  };
  const panel: Piece = {
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
  if (position !== "front" || !hasWovenShirtDartProfile(options)
    || !rawWovenDartControlsAreFinite(rawOptions)) return panel;
  return openWovenShirtSideBustDart(panel, m, options) ?? panel;
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
/** HPS-origin y coordinate used by the current woven-shirt hip station. */
export function wovenHipStationY(length: number, armholeDepth: number, hipDepth: number): number {
  const waistY = armholeDepth + (length - armholeDepth) * 0.35;
  return waistY + hipDepth;
}

export function draftWovenShirtBody(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const croppedBoxy = Object.prototype.hasOwnProperty.call(rawOptions, "boxySideProfile");
  const front = shirtPanel(m, "front", options, croppedBoxy, rawOptions);
  const back = shirtPanel(m, "back", options, croppedBoxy);
  return block({
    front,
    back,
  }, wovenBodyStitches(rawOptions, front));
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
    marks: [lineMark("placementLine", "centerMatch", point(0, 0), point(0, height), "PLACE ON FOLD", "instruction")],
  };
}

function collarPiece(name: string, necklineLength: number, depth: number, baseEdgeName: "stand" | "neckline" = "stand"): Piece {
  return {
    name,
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: point(0, depth), end: point(0, 0) },
      { kind: "line", name: baseEdgeName, start: point(0, 0), end: point(necklineLength, 0) },
      { kind: "line", name: "frontTip", start: point(necklineLength, 0), end: point(necklineLength + COLLAR_TIP_FLARE, depth) },
      { kind: "line", name: "outer", start: point(necklineLength + COLLAR_TIP_FLARE, depth), end: point(0, depth) },
    ],
    marks: [lineMark("placementLine", "centerMatch", point(0, 0), point(0, depth), "PLACE ON FOLD", "instruction")],
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

function wovenCampCollarStitches(necklineRole: "back" | "yoke"): readonly Stitch[] {
  const bodyNeckline = iface(edgeRef("front", "neckline"), edgeRef(necklineRole, "neckline"));
  return [
    { label: "Under camp collar ↔ woven neckline", a: iface(edgeRef("underCollar", "neckline")), b: bodyNeckline },
    { label: "Upper camp collar ↔ woven neckline", a: iface(edgeRef("upperCollar", "neckline")), b: bodyNeckline },
    {
      label: "Camp collar outer seam (upper ↔ under)",
      a: iface(edgeRef("upperCollar", "frontTip"), edgeRef("upperCollar", "outer")),
      b: iface(edgeRef("underCollar", "frontTip"), edgeRef("underCollar", "outer")),
    },
  ];
}

function wovenCollarStitches(necklineRole: "back" | "yoke", options?: WovenShirtOptions): readonly Stitch[] {
  if (options?.campCollarDepth !== undefined) return wovenCampCollarStitches(necklineRole);
  if (options?.bandCollarHeight !== undefined) return wovenBandCollarStitches(necklineRole);
  return WOVEN_SHIRT_COLLAR_STITCHES.map((stitch) => {
    if (stitch.label !== "Outer stand ↔ woven neckline") return stitch;
    return {
      ...stitch,
      b: iface(edgeRef("front", "neckline"), edgeRef(necklineRole, "neckline")),
    };
  });
}

function wovenBandCollarStitches(necklineRole: "back" | "yoke"): readonly Stitch[] {
  return [
    {
      label: "Outer collar band ↔ woven neckline",
      a: iface(edgeRef("outerStand", "neckline")),
      b: iface(edgeRef("front", "neckline"), edgeRef(necklineRole, "neckline")),
    },
    {
      label: "Inner collar band ↔ outer band neckline",
      a: iface(edgeRef("innerStand", "neckline")),
      b: iface(edgeRef("outerStand", "neckline")),
    },
    {
      label: "Outer ↔ inner collar band finish",
      a: iface(edgeRef("outerStand", "collar"), edgeRef("outerStand", "frontEnd")),
      b: iface(edgeRef("innerStand", "collar"), edgeRef("innerStand", "frontEnd")),
    },
  ];
}

/** Add the four physical collar layers to an already drafted woven body. */
export function addWovenShirtCollar(
  body: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const necklineRole = "yoke" in body.roles ? "yoke" : "back";
  const necklineLength = edgeLength(pieceEdge(body.roles.front, "neckline")) +
    edgeLength(pieceEdge(body.roles[necklineRole], "neckline"));
  if (options.campCollarDepth !== undefined) {
    const upperCollar = collarPiece("upper camp collar", necklineLength, options.campCollarDepth, "neckline");
    const underCollar = collarPiece("under camp collar", necklineLength, options.campCollarDepth, "neckline");
    return block({ ...body.roles, upperCollar, underCollar }, [
      ...body.stitches, ...wovenCampCollarStitches(necklineRole),
    ]);
  }
  if (options.bandCollarHeight !== undefined) {
    const outerBand = standPiece("outer woven collar band", necklineLength, options.bandCollarHeight);
    const innerBand = standPiece("inner woven collar band", necklineLength, options.bandCollarHeight);
    return block({ ...body.roles, outerStand: outerBand, innerStand: innerBand }, [
      ...body.stitches, ...wovenBandCollarStitches(necklineRole),
    ]);
  }
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

interface WovenYokePieces {
  readonly back: Piece;
  readonly yoke: Piece;
}

function splitWovenBack(back: Piece, options: WovenShirtOptions): WovenYokePieces {
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
      { kind: "line", name: "centerBack", start: edgeStart(pieceEdge(back, "centerBack")), end: foldTop },
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
      { kind: "line", name: "centerBack", start: foldTop, end: edgeEnd(pieceEdge(back, "centerBack")) },
      pieceEdge(back, "neckline"),
      pieceEdge(back, "shoulder"),
      { kind: "curve", name: "armholeUpper", curve: split.left },
      { kind: "line", name: "yokeSeam", start: split.left.end, end: foldTop },
    ],
  };
  return {
    back: backLower,
    yoke,
  };
}

export const WOVEN_SHIRT_YOKE_STITCHES: readonly Stitch[] = [
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

function addWovenShirtDartStitches(stitches: readonly Stitch[]): readonly Stitch[] {
  return [
    ...stitches.map((stitch) => stitch.label === "Side seam (front ↔ back)"
      ? { ...stitch, a: iface(
          edgeRef("front", "sideUpper"),
          edgeRef("front", "sideMiddle"),
          edgeRef("front", "sideLower"),
          edgeRef("front", WOVEN_SHIRT_DART_CONTINUATION),
        ) }
      : stitch),
    {
      label: "W08 bust-dart legs equal",
      a: iface(edgeRef("front", "bustDartUpper")),
      b: iface(edgeRef("front", "bustDartLower")),
    },
  ];
}

function wovenBodyStitches(rawOptions: Partial<WovenShirtOptions>, front: Piece): readonly Stitch[] {
  return hasWovenShirtDartProfile(rawOptions) && front.dart
    ? addWovenShirtDartStitches(WOVEN_SHIRT_BODY_STITCHES)
    : WOVEN_SHIRT_BODY_STITCHES;
}

function wovenYokeStitches(rawOptions: Partial<WovenShirtOptions>, front: Piece): readonly Stitch[] {
  return hasWovenShirtDartProfile(rawOptions) && front.dart
    ? addWovenShirtDartStitches(WOVEN_SHIRT_YOKE_STITCHES)
    : WOVEN_SHIRT_YOKE_STITCHES;
}

/** Replace the back's upper outline with a true yoke seam. The armhole curve
 * is split at the requested depth so the lower back remains a real garment
 * piece and the yoke still carries the neckline/shoulder. */
export function addWovenShirtYoke(
  body: Block, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const pieces = splitWovenBack(body.roles.back, options);
  return block({ ...body.roles, back: pieces.back, yoke: pieces.yoke }, wovenYokeStitches(rawOptions, body.roles.front));
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
    marks: [lineMark("foldLine", "pocketTopTurn", point(0, 1), point(width, 1), "TURN UNDER", "instruction")],
  };
}

export const WOVEN_SHIRT_POCKET_STITCHES: readonly Stitch[] = [
  {
    label: "Patch pocket ↔ front placement",
    a: iface(edgeRef("pocket", "top")),
    b: iface(markRef("front", "pocketPlacement", "left")),
  },
];

export function wovenShirtPocketPlacement(
  m: Measurements, options: WovenShirtOptions, hasDartGeometry = true,
): { readonly x: number; readonly y: number } {
  const x = m.chest / 20;
  const baseY = m.armholeDepth + 6;
  return {
    x,
    y: hasDartGeometry && hasWovenShirtDartProfile(options)
      ? Math.min(baseY, wovenBustDartUpperMouthY(m, options) - options.pocketHeight - 1)
      : baseY,
  };
}

export function addWovenShirtPocket(
  yoke: Block, m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  const front = yoke.roles.front;
  const { x: pocketX, y: pocketY } = wovenShirtPocketPlacement(m, options, Boolean(front.dart));
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

function curvedHemAndVent(piece: Piece, ventDepth: number, ventAlongSideSeam = false): Piece {
  const hem = pieceEdge(piece, "hem");
  const sideEnd = edgeStart(hem);
  const sideBoundary = piece.edges.find((edge) =>
    (edge.name === "sideLower" || edge.name === WOVEN_SHIRT_DART_CONTINUATION)
      && distance(edgeEnd(edge), sideEnd) < 1e-7);
  const boundaryLength = sideBoundary ? edgeLength(sideBoundary) : 0;
  const ventTop = ventAlongSideSeam && sideBoundary?.kind === "line" && boundaryLength > 0
    ? lerp(edgeStart(sideBoundary), edgeEnd(sideBoundary), Math.max(0, (boundaryLength - ventDepth) / boundaryLength))
    : point(sideEnd.x, sideEnd.y - ventDepth);
  const updatedEdges = piece.edges.flatMap((edge): Edge[] => {
    if (edge === sideBoundary) {
      if (ventDepth === 0) return [edge];
      if (edge.kind !== "line") return [edge];
      return [{ ...edge, end: ventTop }];
    }
    if (edge.name === "hem") {
      const curvedHem: Edge = { kind: "curve", name: "hem", curve: {
        start: sideEnd,
        control1: point((sideEnd.x * 0.66), sideEnd.y + 1),
        control2: point((sideEnd.x * 0.33), sideEnd.y + 1),
        end: edgeEnd(edge),
      } };
      return ventDepth === 0 ? [curvedHem] : [
        { kind: "line", name: "vent", start: ventTop, end: sideEnd },
        curvedHem,
      ];
    }
    return [edge];
  });
  return {
    ...piece,
    edges: updatedEdges,
    marks: ventDepth === 0 ? piece.marks : [
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
  const ventAlongSideSeam = hasWovenShirtDartProfile(rawOptions);
  return blockFromRoles(block, {
    front: curvedHemAndVent(block.roles.front, options.sideVentDepth, ventAlongSideSeam),
    back: curvedHemAndVent(block.roles.back, options.sideVentDepth, ventAlongSideSeam),
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

function wovenArmholeLength(drafted: Block): number {
  const back = drafted.roles.back;
  const backEdge = back.edges.some((edge) => edge.name === "armholeLower") ? "armholeLower" : "armhole";
  const yoke = drafted.roles.yoke;
  const yokeUpper = yoke && yoke.edges.some((edge) => edge.name === "armholeUpper")
    ? edgeLength(pieceEdge(yoke, "armholeUpper"))
    : 0;
  return edgeLength(pieceEdge(drafted.roles.front, "armhole"))
    + yokeUpper + edgeLength(pieceEdge(back, backEdge));
}

function wovenSleeve(m: Measurements, targetArmhole: number, limitWidthToArmhole = false): Piece {
  const easedWidth = m.bicep + m.ease * 0.5;
  // W03's high-ease profile cannot have a sleeve-top width longer than its armscye; legacy profiles keep their exact width formula.
  const width = limitWidthToArmhole ? Math.min(easedWidth, targetArmhole) : easedWidth;
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
    marks: [lineMark("foldLine", "bandFold", point(0, depth / 2), point(width, depth / 2), "FOLD", "instruction")],
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
  const armhole = wovenArmholeLength(blockWithYoke);
  const hasLooseDropOptions = Object.prototype.hasOwnProperty.call(rawOptions, "shoulderExtension")
    || Object.prototype.hasOwnProperty.call(rawOptions, "shoulderDrop");
  const sleeve = wovenSleeve(m, armhole, hasLooseDropOptions || options.boxySideProfile > 0);
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

export function draftWovenShirt(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  return composeBlock(WOVEN_SHIRT_GRAMMAR, m, rawOptions);
}

export const WOVEN_SHIRT_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    centerBack: 0,
    centerFront: 1,
    neckline: 0.6,
    collar: 0.6,
    stand: 0.6,
    frontTip: 0.6,
    outer: 0.6,
    yokeSeam: 1,
    armhole: 1,
    armholeUpper: 1,
    armholeLower: 1,
    vent: 1,
    hem: 1,
    top: 1,
    bottom: 1,
  },
};

/** Apply the user-selected lower-body turn as a cut allowance. The sleeve has a
 * separately named piece but also an edge named hem, so scope this rule by
 * the actual body-piece names rather than broadening the shared edge rule. */
export function wovenShirtAllowances(hemTurn: number): AllowanceSpec {
  const definition = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "hemTurn");
  if (!definition || !Number.isFinite(hemTurn) || hemTurn < definition.min || hemTurn > definition.max) {
    throw new RangeError("Hem turn is outside its supported range.");
  }
  return {
    ...WOVEN_SHIRT_ALLOWANCES,
    byPieceEdge: {
      ...WOVEN_SHIRT_ALLOWANCES.byPieceEdge,
      "woven front": { hem: hemTurn },
      "woven back lower": { hem: hemTurn },
    },
  };
}

export const WOVEN_SHIRT_GRADE: GradeRule = {
  neck: 1.5, chest: 5, shoulderWidth: 1.2, bicep: 1.5,
  length: 2, armholeDepth: 0.6, sleeveLength: 0.8,
  waist: 5, hip: 5, hipDepth: 0.5,
};

const markPoint = (piece: Piece, name: string): { readonly x: number; readonly y: number } => {
  const mark = piece.marks?.find((candidate) => candidate.name === name);
  if (!mark || !("at" in mark)) throw new Error(`Piece "${piece.name}" has no point mark "${name}"`);
  return mark.at;
};

const pomEdgeMidpoint = (block: Block, roleId: string, edgeId: string) => {
  const edge = pieceEdge(block.roles[roleId]!, edgeId);
  const start = edgeStart(edge);
  const end = edgeEnd(edge);
  return point((start.x + end.x) / 2, (start.y + end.y) / 2);
};

export const WOVEN_SHIRT_POMS: readonly Pom[] = [
  {
    label: "Body chest (finished)", tolerance: 1.3,
    measure: (b) => 4 * edgeStart(pieceEdge(b.roles.front, "sideUpper")).x,
    anchor: (b) => edgeStart(pieceEdge(b.roles.front, "sideUpper")), anchorRoleId: "front", anchorEdgeId: "sideUpper",
  },
  {
    label: "Body length (HPS–hem)", tolerance: 1.3,
    measure: (b) => edgeStart(pieceEdge(b.roles.front, "centerFront")).y - edgeStart(pieceEdge(b.roles.front, "shoulder")).y,
    anchor: (b) => edgeStart(pieceEdge(b.roles.front, "centerFront")), anchorRoleId: "front", anchorEdgeId: "centerFront",
  },
  {
    label: "Neck circumference (pattern)", tolerance: 0.6,
    measure: (b) => 2 * (edgeLength(pieceEdge(b.roles.front, "neckline")) + edgeLength(pieceEdge(b.roles.yoke, "neckline"))),
    anchor: (b) => edgeStart(pieceEdge(b.roles.front, "neckline")), anchorRoleId: "front", anchorEdgeId: "neckline",
  },
  {
    label: "Back yoke depth", tolerance: 0.5,
    measure: (b) => edgeStart(pieceEdge(b.roles.back, "yokeSeam")).y,
    backAnchor: (b) => edgeStart(pieceEdge(b.roles.back, "yokeSeam")), backAnchorRoleId: "back", backAnchorEdgeId: "yokeSeam",
  },
  {
    label: "Finished placket width", tolerance: 0.2,
    measure: (b) => edgeLength(pieceEdge(b.roles.buttonPlacket, "top")) - 2,
    anchor: (b) => pomEdgeMidpoint(b, "buttonPlacket", "top"), anchorRoleId: "buttonPlacket", anchorEdgeId: "top",
    viewDimension: { kind: "edge-length", view: "FRONT_FLAT", roleId: "buttonPlacket", edgeId: "top" },
  },
  {
    label: "Front button spacing", tolerance: 0.2,
    measure: (b) => distance(markPoint(b.roles.buttonPlacket, "button-1"), markPoint(b.roles.buttonPlacket, "button-2")),
    frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "at" },
  },
  {
    label: "Patch pocket width", tolerance: 0.3,
    measure: (b) => edgeLength(pieceEdge(b.roles.pocket, "top")),
    anchor: (b) => pomEdgeMidpoint(b, "pocket", "top"), anchorRoleId: "pocket", anchorEdgeId: "top",
    viewDimension: { kind: "edge-length", view: "FRONT_FLAT", roleId: "pocket", edgeId: "top" },
  },
  {
    label: "Patch pocket height", tolerance: 0.3,
    measure: (b) => edgeLength(pieceEdge(b.roles.pocket, "sideRight")),
    anchor: (b) => pomEdgeMidpoint(b, "pocket", "sideRight"), anchorRoleId: "pocket", anchorEdgeId: "sideRight",
    viewDimension: { kind: "edge-length", view: "FRONT_FLAT", roleId: "pocket", edgeId: "sideRight" },
  },
  {
    label: "Finished sleeve band depth", tolerance: 0.2,
    measure: (b) => edgeLength(pieceEdge(b.roles.sleeveBand, "sideRight")),
    anchor: (b) => pomEdgeMidpoint(b, "sleeveBand", "sideRight"), anchorRoleId: "sleeveBand", anchorEdgeId: "sideRight",
    viewDimension: { kind: "edge-length", view: "FRONT_FLAT", roleId: "sleeveBand", edgeId: "sideRight" },
  },
  {
    label: "Side vent depth", tolerance: 0.3,
    measure: (b) => edgeLength(pieceEdge(b.roles.front, "vent")),
    anchor: (b) => pomEdgeMidpoint(b, "front", "vent"), anchorRoleId: "front", anchorEdgeId: "vent",
    anchorAvailable: (b) => b.roles.front.edges.some((edge) => edge.name === "vent" && edgeLength(edge) > 0),
    viewDimension: { kind: "edge-length", view: "FRONT_FLAT", roleId: "front", edgeId: "vent" },
  },
];

export const WOVEN_SHIRT_DARTED_POMS: readonly Pom[] = [
  ...WOVEN_SHIRT_POMS,
  { label: "Bust dart intake (modeled)", measure: (b) => dartIntake(b.roles.front) },
];

export const WOVEN_SHIRT_CAMP_COLLAR_POMS: readonly Pom[] = [
  ...WOVEN_SHIRT_POMS,
  {
    label: "Camp collar depth (modeled)", tolerance: 0.2,
    measure: (b) => edgeLength(pieceEdge(b.roles.upperCollar, "centerBack")),
    anchor: (b) => edgeStart(pieceEdge(b.roles.upperCollar, "centerBack")),
    anchorRoleId: "upperCollar", anchorEdgeId: "centerBack",
  },
];

export const WOVEN_SHIRT_BAND_COLLAR_POMS: readonly Pom[] = [
  ...WOVEN_SHIRT_POMS,
  {
    label: "Finished collar-band height (modeled)", tolerance: 0.2,
    measure: (b) => edgeLength(pieceEdge(b.roles.outerStand, "centerBack")),
    anchor: (b) => edgeStart(pieceEdge(b.roles.outerStand, "centerBack")),
    anchorRoleId: "outerStand", anchorEdgeId: "centerBack",
  },
];

export const WOVEN_SHIRT_BOXY_PROFILE_POMS: readonly Pom[] = [
  {
    label: "Body waist (finished)", tolerance: 1.3,
    measure: (b) => 4 * edgeEnd(pieceEdge(b.roles.front, "sideUpper")).x,
    anchor: (b) => edgeEnd(pieceEdge(b.roles.front, "sideUpper")), anchorRoleId: "front", anchorEdgeId: "sideUpper",
  },
  {
    label: "W04 cropped hip station (finished)", tolerance: 1.3,
    measure: (b) => 4 * edgeEnd(pieceEdge(b.roles.front, "sideMiddle")).x,
    anchor: (b) => edgeEnd(pieceEdge(b.roles.front, "sideMiddle")), anchorRoleId: "front", anchorEdgeId: "sideMiddle",
  },
];

const notch = (pieceName: string, topEdge: string, bottomEdge: string): PieceNotches => ({
  pieceName,
  notches: [{ edgeName: topEdge, t: 0.5 }],
  grainline: { topEdge, topT: 0.5, bottomEdge, bottomT: 0.5 },
});

const WOVEN_SHIRT_BODY_NOTCHES: readonly PieceNotches[] = [
  notch("woven front", "shoulder", "hem"),
  notch("woven back lower", "yokeSeam", "hem"),
  notch("woven back yoke", "shoulder", "yokeSeam"),
];

const WOVEN_SHIRT_SHARED_DETAIL_NOTCHES: readonly PieceNotches[] = [
  notch("woven button placket", "top", "bottom"),
  notch("woven buttonhole placket", "top", "bottom"),
  notch("woven short sleeve", "capLeft", "hem"),
  notch("woven folded sleeve band", "top", "bottom"),
  notch("woven patch pocket", "top", "bottom"),
];

export const WOVEN_SHIRT_NOTCHES: readonly PieceNotches[] = [
  ...WOVEN_SHIRT_BODY_NOTCHES,
  notch("outer woven stand", "collar", "neckline"),
  notch("inner woven stand", "collar", "neckline"),
  notch("upper pointed woven collar", "stand", "outer"),
  notch("under pointed woven collar", "stand", "outer"),
  ...WOVEN_SHIRT_SHARED_DETAIL_NOTCHES,
];

export const WOVEN_SHIRT_DARTED_NOTCHES: readonly PieceNotches[] = WOVEN_SHIRT_NOTCHES.map((rule) =>
  rule.pieceName === "woven front"
    ? { ...rule, notches: [...rule.notches, { edgeName: "bustDartUpper", t: 0.9 }, { edgeName: "bustDartLower", t: 0.1 }] }
    : rule);

export const WOVEN_SHIRT_CAMP_COLLAR_NOTCHES: readonly PieceNotches[] = [
  ...WOVEN_SHIRT_BODY_NOTCHES,
  notch("upper camp collar", "neckline", "outer"),
  notch("under camp collar", "neckline", "outer"),
  ...WOVEN_SHIRT_SHARED_DETAIL_NOTCHES,
];

export const WOVEN_SHIRT_BAND_COLLAR_NOTCHES: readonly PieceNotches[] = [
  ...WOVEN_SHIRT_BODY_NOTCHES,
  notch("outer woven collar band", "collar", "neckline"),
  notch("inner woven collar band", "collar", "neckline"),
  ...WOVEN_SHIRT_SHARED_DETAIL_NOTCHES,
];

export function wovenShirtGuidance(
  block: Block, m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Note[] {
  const options = resolveWovenShirtOptions(rawOptions);
  const notes: Note[] = [];
  const croppedBoxy = Object.prototype.hasOwnProperty.call(rawOptions, "boxySideProfile");
  const rawHipStationY = wovenHipStationY(m.length, m.armholeDepth, m.hipDepth);
  const hipStationY = wovenShirtHipStationY(m, options.sideVentDepth, croppedBoxy);
  if (!croppedBoxy && hipStationY > m.length) {
    notes.push({
      field: "hipDepth",
      level: "warn",
      text: `The current woven-shirt hip station is at y=${hipStationY.toFixed(2)} cm, below the hem at y=${m.length} cm — increase top length or reduce the underarm drop or hip depth until the station is at or above the hem. Values stay unchanged.`,
    });
  } else if (croppedBoxy && rawHipStationY > hipStationY) {
    notes.push({
      field: "hipDepth",
      level: "info",
      text: `W04 keeps its digital hip-width station at y=${hipStationY.toFixed(2)} cm, 1 cm above the side-vent opening at y=${(m.length - options.sideVentDepth).toFixed(2)} cm; the body-derived location remains unchanged.`,
    });
  }
  for (const definition of WOVEN_SHIRT_OPTION_DEFINITIONS) {
    if (definition.appliesToStyle !== undefined && !Object.prototype.hasOwnProperty.call(rawOptions, definition.id)) continue;
    if (definition.appliesToStarterEntryId !== undefined && !Object.prototype.hasOwnProperty.call(rawOptions, definition.id)) continue;
    const rawValue = rawOptions[definition.id as keyof WovenShirtOptions];
    if (Object.prototype.hasOwnProperty.call(rawOptions, definition.id) && !Number.isFinite(rawValue)) {
      notes.push({ field: `option-${definition.id}`, level: "warn",
        text: `${definition.label} must be a finite number; enter a value from ${definition.min} to ${definition.max} ${definition.unit}.` });
      continue;
    }
    const value = options[definition.id as keyof WovenShirtOptions] as number;
    // Every woven option declares a unit in shirt-contract.ts. Keep the
    // guidance value sourced from that contract so a count can never inherit a
    // dimensional suffix by accident.
    const unit = definition.unit!;
    const valueLabel = unit === "buttons" ? `${value} buttons` : `${value} ${unit}`;
    if (value < definition.min || value > definition.max) {
      notes.push({ field: `option-${definition.id}`, level: "warn", text: `${definition.label} (${valueLabel}) is outside the ${definition.min}–${definition.max} ${unit} design range — adjust it into that range.` });
    } else if (definition.id === "buttonCount" && !Number.isInteger(value)) {
      notes.push({ field: "option-buttonCount", level: "warn", text: `Front placket buttons (${valueLabel}) must be a whole number: choose 6 or 7.` });
    } else if (definition.id === "boxySideProfile" && value % definition.step !== 0) {
      notes.push({ field: "option-boxySideProfile", level: "warn", text: "Boxy side profile must use 10% increments; choose a value from 0% to 100% in steps of 10%." });
    } else if ((definition.id === "campCollarDepth" || definition.id === "bandCollarHeight")
      && !Number.isInteger((value - definition.min) / definition.step)) {
      notes.push({ field: `option-${definition.id}`, level: "warn",
        text: `${definition.label} must use ${definition.step} ${unit} increments; choose a value from ${definition.min} to ${definition.max} ${unit} in those steps.` });
    } else if (definition.appliesToStarterEntryId === WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID
      && !Number.isInteger((value - definition.min) / definition.step)) {
      notes.push({ field: `option-${definition.id}`, level: "warn",
        text: `${definition.label} must use ${definition.step} ${unit} increments; choose a supported value in the displayed range.` });
    }
  }
  if (hasWovenShirtDartProfile(rawOptions) && !block.roles.front.dart
    && rawWovenDartOptionsAreSupported(rawOptions)) {
    notes.push({ field: "option-bustDartIntakeCm", level: "warn",
      text: "The W08 side bust dart cannot be placed inside the current front panel with these values. Reduce intake, move the dart target inward or away from the panel boundaries, then review the regenerated pattern." });
  }
  if (options.frontOverlap > options.placketWidth) {
    notes.push({ field: "option-frontOverlap", level: "warn", text: "Front overlap reaches beyond the finished placket face — reduce overlap or increase placket width." });
  }
  const frontLength = edgeLength(pieceEdge(block.roles.front, "centerFront"));
  const positions = frontButtonPositions(options.buttonCount, options.buttonSpacing);
  const lastButton = positions[positions.length - 1];
  if (lastButton !== undefined && lastButton + 3 > frontLength) {
    notes.push({ field: "option-buttonSpacing", level: "warn", text: `The last front button leaves less than 3 cm at the placket end — reduce spacing/count or increase shirt length.` });
  }
  if (options.campCollarDepth === undefined && options.bandCollarHeight === undefined
    && options.standHeight > options.collarLeafDepth) {
    notes.push({ field: "option-standHeight", level: "warn", text: "Stand height is deeper than the collar leaf — reduce stand height or increase collar leaf depth." });
  }
  const shoulderY = 2.5 + options.shoulderDrop;
  const shoulderX = m.shoulderWidth / 2 + options.shoulderExtension;
  const underarmX = (m.chest + m.ease) / 4;
  const hasLooseDropOptions = Object.prototype.hasOwnProperty.call(rawOptions, "shoulderExtension")
    || Object.prototype.hasOwnProperty.call(rawOptions, "shoulderDrop");
  if (hasLooseDropOptions && shoulderX >= underarmX) {
    notes.push({ field: "option-shoulderExtension", level: "warn", text: "Shoulder extension reaches the underarm width — reduce shoulder extension or increase body ease." });
  }
  if (hasLooseDropOptions && shoulderY >= m.armholeDepth) {
    notes.push({ field: "option-shoulderDrop", level: "warn", text: "Shoulder drop reaches the underarm depth — reduce shoulder drop or increase armhole depth." });
  }
  if (options.yokeDepth <= shoulderY || options.yokeDepth >= m.armholeDepth) {
    notes.push({ field: "option-yokeDepth", level: "warn", text: "Back yoke depth (" + options.yokeDepth + " cm) must sit below the shoulder at " + shoulderY + " cm and above the underarm at " + m.armholeDepth + " cm — move the yoke seam between those points." });
  }
  if (hasLooseDropOptions) {
    const armholeLength = wovenArmholeLength(block);
    if (m.bicep > armholeLength) {
      notes.push({ field: "bicep", level: "warn", text: "Bicep circumference (" + m.bicep + " cm) exceeds the W03 armhole seam (" + armholeLength.toFixed(1) + " cm) — reduce the bicep value or increase armhole depth; the value stays unchanged." });
    }
  }
  if (Object.prototype.hasOwnProperty.call(rawOptions, "boxySideProfile") && options.boxySideProfile > 0) {
    const armholeLength = wovenArmholeLength(block);
    if (m.bicep > armholeLength) {
      notes.push({ field: "bicep", level: "warn", text: `Bicep circumference (${m.bicep} cm) exceeds the W04 armhole seam (${armholeLength.toFixed(1)} cm) — reduce the bicep value or increase armhole depth; the value stays unchanged.` });
    }
  }
  const neckHalf = (m.neck + options.neckEase) / 4;
  if (neckHalf >= m.shoulderWidth / 2) {
    notes.push({ field: "option-neckEase", level: "warn", text: "Neckline reaches the shoulder seam — reduce neck ease or check the neck measurement." });
  }
  if (neckHalf * 0.8 >= m.armholeDepth) {
    notes.push({ field: "option-neckEase", level: "warn", text: "Front neckline drops below the underarm — reduce neck ease or increase armhole depth." });
  }
  return notes;
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
      lineMark("placementLine", "placketFace", point(faceStart, 0), point(faceStart, length), "FOLD", "instruction"),
      lineMark("foldLine", "placketFold", point(faceEnd, 0), point(faceEnd, length), "FOLD", "instruction"),
      lineMark("placementLine", "closureLine", point(closureX, 0), point(closureX, length), "CLOSURE"),
      ...buttonMarks,
    ],
  };
}

const wovenGrammarFront = (
  m: Measurements,
  params: { readonly options: WovenShirtOptions; readonly croppedBoxy: boolean; readonly rawOptions: Partial<WovenShirtOptions> },
): ComponentResult => {
  const { options, croppedBoxy, rawOptions } = params;
  const base = shirtPanel(m, "front", options, croppedBoxy, rawOptions);
  const { x: pocketX, y: pocketY } = wovenShirtPocketPlacement(m, options, Boolean(base.dart));
  const withPlacement: Piece = {
    ...base,
    marks: [
      ...(base.marks ?? []),
      lineMark("placementLine", "pocketPlacement", point(pocketX, pocketY), point(pocketX + options.pocketWidth, pocketY), "POCKET PLACEMENT"),
    ],
  };
  return {
    pieces: { front: curvedHemAndVent(withPlacement, options.sideVentDepth, hasWovenShirtDartProfile(options)) },
    stitches: [],
    interfaces: {
      shoulder: iface(edgeRef("front", "shoulder")),
      neckline: iface(edgeRef("front", "neckline")),
      centerFront: iface(edgeRef("front", "centerFront")),
      armhole: iface(edgeRef("front", "armhole")),
    },
  };
};

const wovenGrammarBackYoke = (
  m: Measurements,
  params: { readonly options: WovenShirtOptions; readonly croppedBoxy: boolean },
): ComponentResult => {
  const { options, croppedBoxy } = params;
  const split = splitWovenBack(shirtPanel(m, "back", options, croppedBoxy), options);
  return {
    pieces: {
      back: curvedHemAndVent(split.back, options.sideVentDepth, hasWovenShirtDartProfile(options)),
      yoke: split.yoke,
    },
    stitches: [],
    interfaces: {
      shoulder: iface(edgeRef("yoke", "shoulder")),
      neckline: iface(edgeRef("yoke", "neckline")),
      armholeUpper: iface(edgeRef("yoke", "armholeUpper")),
      armholeLower: iface(edgeRef("back", "armholeLower")),
      yokeSeam: iface(edgeRef("yoke", "yokeSeam")),
    },
  };
};

const wovenGrammarPocket = (_m: Measurements, options: WovenShirtOptions): ComponentResult => ({
  pieces: { pocket: patchPocket(options.pocketWidth, options.pocketHeight) },
  stitches: [],
  interfaces: { top: iface(edgeRef("pocket", "top")) },
});

const wovenGrammarCollar = (
  _m: Measurements,
  params: { readonly options: WovenShirtOptions; readonly necklineLength: number },
): ComponentResult => {
  if (params.options.campCollarDepth !== undefined) {
    return {
      pieces: {
        upperCollar: collarPiece("upper camp collar", params.necklineLength, params.options.campCollarDepth, "neckline"),
        underCollar: collarPiece("under camp collar", params.necklineLength, params.options.campCollarDepth, "neckline"),
      },
      stitches: [],
      interfaces: {
        neckline: iface(edgeRef("underCollar", "neckline")),
        collar: iface(edgeRef("underCollar", "outer")),
      },
    };
  }
  if (params.options.bandCollarHeight !== undefined) {
    return {
      pieces: {
        outerStand: standPiece("outer woven collar band", params.necklineLength, params.options.bandCollarHeight),
        innerStand: standPiece("inner woven collar band", params.necklineLength, params.options.bandCollarHeight),
      },
      stitches: [],
      interfaces: {
        neckline: iface(edgeRef("outerStand", "neckline")),
        collar: iface(edgeRef("outerStand", "collar")),
      },
    };
  }
  const outer = standPiece("outer woven stand", params.necklineLength, params.options.standHeight);
  const inner = standPiece("inner woven stand", params.necklineLength, params.options.standHeight);
  const standY = edgeStart(pieceEdge(outer, "centerBack")).y / 2;
  const standButtonX = params.necklineLength - PLACKET_SEAM_ALLOWANCE;
  const outerStand: Piece = {
    ...outer,
    marks: [...outer.marks!, pointMark("button", "stand-button", point(standButtonX, standY), "STAND BUTTON")],
  };
  const innerStand: Piece = {
    ...inner,
    marks: [...inner.marks!, pointMark("buttonhole", "stand-buttonhole", point(standButtonX, standY), "STAND BUTTONHOLE")],
  };
  return {
    pieces: {
      outerStand,
      innerStand,
      upperCollar: collarPiece("upper pointed woven collar", params.necklineLength, params.options.collarLeafDepth),
      underCollar: collarPiece("under pointed woven collar", params.necklineLength, params.options.collarLeafDepth),
    },
    stitches: [],
    interfaces: {
      neckline: iface(edgeRef("outerStand", "neckline")),
      collar: iface(edgeRef("underCollar", "stand")),
    },
  };
};

const wovenGrammarPlackets = (
  _m: Measurements,
  params: { readonly options: WovenShirtOptions; readonly frontLength: number },
): ComponentResult => ({
  pieces: {
    buttonPlacket: placketPiece("woven button placket", params.frontLength, params.options, "button"),
    buttonholePlacket: placketPiece("woven buttonhole placket", params.frontLength, params.options, "buttonhole"),
  },
  stitches: [],
  interfaces: {
    button: iface(edgeRef("buttonPlacket", "attachmentRaw")),
    buttonhole: iface(edgeRef("buttonholePlacket", "attachmentRaw")),
  },
});

const wovenGrammarSleeves = (
  m: Measurements,
  params: { readonly options: WovenShirtOptions; readonly targetArmhole: number },
): ComponentResult => {
  const hasLooseDropGeometry = params.options.shoulderExtension !== 0 || params.options.shoulderDrop !== 0
    || params.options.boxySideProfile > 0;
  const sleeve = wovenSleeve(m, params.targetArmhole, hasLooseDropGeometry);
  return {
    pieces: {
      sleeve,
      sleeveBand: sleeveBand(edgeLength(pieceEdge(sleeve, "hem")), params.options.sleeveBandDepth),
    },
    stitches: [],
    interfaces: {
      cap: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
      hem: iface(edgeRef("sleeve", "hem")),
    },
  };
};

/** Complete woven-shirt composition. Each node owns only the roles it emits;
 * measurements for collar, placket, and sleeve sizing come from interfaces of
 * the already executed nodes. */
export const WOVEN_SHIRT_GRAMMAR = garmentGrammar(
  "woven-shirt",
  [
    componentNode("front", "woven-body", wovenGrammarFront, (context) => ({
      options: resolveWovenShirtOptions(context.options),
      croppedBoxy: Object.prototype.hasOwnProperty.call(context.options, "boxySideProfile"),
      rawOptions: context.options as Partial<WovenShirtOptions>,
    })),
    componentNode("back-yoke", "yoke", wovenGrammarBackYoke, (context) => ({
      options: resolveWovenShirtOptions(context.options),
      croppedBoxy: Object.prototype.hasOwnProperty.call(context.options, "boxySideProfile"),
    }), ["front"]),
    componentNode("pocket", "pocket", wovenGrammarPocket, (context) => resolveWovenShirtOptions(context.options), ["front", "back-yoke"]),
    componentNode(
      "collar",
      "collar-stand",
      wovenGrammarCollar,
      (context) => ({
        options: resolveWovenShirtOptions(context.options),
        necklineLength:
          context.interfaceLength("front", "neckline") +
          context.interfaceLength("back-yoke", "neckline"),
      }),
      ["front", "back-yoke"],
    ),
    componentNode(
      "plackets",
      "placket",
      wovenGrammarPlackets,
      (context) => ({
        options: resolveWovenShirtOptions(context.options),
        frontLength: context.interfaceLength("front", "centerFront"),
      }),
      ["front", "collar"],
    ),
    componentNode(
      "sleeves",
      "sleeve-band",
      wovenGrammarSleeves,
      (context) => ({
        options: resolveWovenShirtOptions(context.options),
        targetArmhole:
          context.interfaceLength("front", "armhole") +
          context.interfaceLength("back-yoke", "armholeUpper") +
          context.interfaceLength("back-yoke", "armholeLower"),
      }),
      ["front", "back-yoke", "pocket", "collar", "plackets"],
    ),
  ],
  (context) => [
    ...wovenYokeStitches(context.options, context.block.roles.front!),
    ...WOVEN_SHIRT_POCKET_STITCHES,
    ...wovenCollarStitches("yoke", resolveWovenShirtOptions(context.options)),
    ...WOVEN_SHIRT_PLACKET_STITCHES,
    ...WOVEN_SHIRT_SLEEVE_STITCHES,
  ],
);

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
  if (options.campCollarDepth !== undefined || options.bandCollarHeight !== undefined) {
    return block({
      ...collar.roles,
      buttonPlacket: placketPiece("woven button placket", frontLength, options, "button"),
      buttonholePlacket: placketPiece("woven buttonhole placket", frontLength, options, "buttonhole"),
    }, [...collar.stitches, ...WOVEN_SHIRT_PLACKET_STITCHES]);
  }
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
