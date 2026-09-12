// The reusable lower-body block for Epic 3.
//
// Coordinates are centimetres, x increases toward the
// side seam, and y increases down from the body-panel waist reference.
//
// The curve is deliberately transparent digital drafting geometry: front and
// back crotch curves are separate cubic Béziers, while the inner leg and side
// profile are shared so the sewn inseams and side seams match exactly. It is a
// coherent approximation, not a universal fit formula.

import { point } from "../geometry";
import { Block, block, rolePiece } from "./block";
import { Edge, Piece } from "./piece";
import { lineMark, pointMark, PatternMark } from "./pattern-mark";
import { edgeRef, iface, markRef, Stitch } from "./stitch";
import { Component, assembleComponents } from "./component";
import {
  DEFAULT_TROUSER_OPTIONS,
  resolveTrouserOptions,
  TROUSER_OPTION_DEFINITIONS,
  TrouserOptions,
} from "./trouser-contract";
import { Measurements } from "./measurements";
import type { AllowanceSpec } from "./allowance";
import type { PieceNotches } from "./tshirt-notches";
import type { Note } from "../guidance/note";

export interface TrouserDraftMetrics {
  readonly finishedWaist: number;
  readonly finishedSeat: number;
  readonly finishedThigh: number;
  readonly finishedKnee: number;
  readonly frontRise: number;
  readonly backRise: number;
  readonly frontCrotchY: number;
  readonly backCrotchY: number;
  readonly hemY: number;
  readonly kneeY: number;
  readonly thighY: number;
}

/** One source-of-truth conversion from the contract to drafted stations. */
export function trouserMetrics(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): TrouserDraftMetrics {
  const options = resolveTrouserOptions(rawOptions);
  const frontRise = m.crotchDepth + options.frontRiseEase;
  const backRise = m.crotchDepth + options.backRiseEase;
  const frontCrotchY = frontRise - options.waistbandDepth;
  const backCrotchY = backRise - options.waistbandDepth;
  // The common inner crotch station keeps the front/back inseams sewable while
  // the center-front/center-back endpoints still expose separate rise values.
  const hemY = backCrotchY + m.inseam;
  return {
    finishedWaist: m.waist + m.ease,
    finishedSeat: m.hip + m.ease,
    finishedThigh: m.thigh + options.thighEase,
    finishedKnee: m.knee + options.kneeEase,
    frontRise,
    backRise,
    frontCrotchY,
    backCrotchY,
    hemY,
    kneeY: backCrotchY + m.inseam * 0.52,
    thighY: backCrotchY + 2.5,
  };
}

const profilePoints = (
  m: Measurements, metrics: TrouserDraftMetrics, options: TrouserOptions
) => {
  const waistQ = metrics.finishedWaist / 4;
  const seatQ = metrics.finishedSeat / 4;
  const thighQ = metrics.finishedThigh / 4;
  const kneeQ = metrics.finishedKnee / 4;
  const openingQ = options.legOpening / 4;
  const crotchX = seatQ * 0.32;
  const innerThighX = crotchX - 1.5;
  const innerKneeX = crotchX - 1.8;
  const innerHemX = crotchX - 2;
  return {
    waistQ,
    seatQ,
    sideWaist: point(waistQ, 0),
    sideHip: point(seatQ, m.hipDepth),
    sideThigh: point(innerThighX + thighQ, metrics.thighY),
    sideKnee: point(innerKneeX + kneeQ, metrics.kneeY),
    sideHem: point(innerHemX + openingQ, metrics.hemY),
    crotch: point(crotchX, metrics.backCrotchY),
    innerThigh: point(innerThighX, metrics.thighY),
    innerKnee: point(innerKneeX, metrics.kneeY),
    innerHem: point(innerHemX, metrics.hemY),
  };
};

function legMarks(
  waistQ: number, sideHemX: number, metrics: TrouserDraftMetrics, name: string
): PatternMark[] {
  const creaseX = (waistQ + sideHemX) / 2;
  return [
    lineMark("placementLine", "creaseLine", point(creaseX, 0), point(creaseX, metrics.hemY), "front crease"),
    pointMark("placementPoint", "hipLine", point(creaseX, metrics.thighY - 2.5), "hip balance"),
    pointMark("placementPoint", "kneeLine", point(creaseX, metrics.kneeY), "knee"),
    pointMark("placementPoint", "grainTop", point(creaseX, 4), `${name} grain`),
  ];
}

function legPiece(
  m: Measurements, metrics: TrouserDraftMetrics, options: TrouserOptions,
  position: "front" | "back", name: string
): Piece {
  const p = profilePoints(m, metrics, options);
  const centerY = position === "front" ? metrics.frontCrotchY : metrics.backCrotchY;
  const centerName = position === "front" ? "centerFront" : "centerBack";
  const crotch: Edge = position === "front"
    ? {
        kind: "curve", name: "crotch", curve: {
          start: p.crotch,
          control1: point(p.crotch.x - 2.2, p.crotch.y - 0.6),
          control2: point(p.crotch.x - 2.6, centerY + 0.8),
          end: point(0, centerY),
        },
      }
    : {
        kind: "curve", name: "crotch", curve: {
          start: p.crotch,
          control1: point(p.crotch.x + 2.8, p.crotch.y + 1.2),
          control2: point(p.crotch.x + 3.7, centerY - 1.6),
          end: point(0, centerY),
        },
      };
  const sideThigh = p.sideThigh;
  const sideKnee = p.sideKnee;
  const sideHem = p.sideHem;
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: point(0, 0), end: p.sideWaist },
    { kind: "line", name: "sideUpper", start: p.sideWaist, end: p.sideHip },
    { kind: "line", name: "sideHipToThigh", start: p.sideHip, end: sideThigh },
    { kind: "line", name: "sideThighToKnee", start: sideThigh, end: sideKnee },
    { kind: "line", name: "sideKneeToHem", start: sideKnee, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: p.innerHem },
    { kind: "line", name: "inseamLower", start: p.innerHem, end: p.innerKnee },
    { kind: "line", name: "inseamUpper", start: p.innerKnee, end: p.innerThigh },
    { kind: "line", name: "innerThighToCrotch", start: p.innerThigh, end: p.crotch },
    crotch,
    { kind: "line", name: centerName, start: point(0, centerY), end: point(0, 0) },
  ];
  return {
    name,
    onFold: false,
    edges,
    marks: legMarks(metrics.finishedWaist / 4, sideHem.x, metrics, name),
  };
}

function mirrorPoint(p: { readonly x: number; readonly y: number }) {
  return point(-p.x, p.y);
}

function mirrorPiece(piece: Piece, name: string): Piece {
  return {
    ...piece,
    name,
    edges: piece.edges.map((edge): Edge => edge.kind === "line"
      ? { ...edge, start: mirrorPoint(edge.start), end: mirrorPoint(edge.end) }
      : { ...edge, curve: {
          ...edge.curve,
          start: mirrorPoint(edge.curve.start),
          control1: mirrorPoint(edge.curve.control1),
          control2: mirrorPoint(edge.curve.control2),
          end: mirrorPoint(edge.curve.end),
        } }),
    marks: piece.marks?.map((mark): PatternMark => "at" in mark
      ? { ...mark, at: mirrorPoint(mark.at) }
      : { ...mark, start: mirrorPoint(mark.start), end: mirrorPoint(mark.end) }),
  };
}

const sideInterface = (role: string) => iface(
  edgeRef(role, "sideUpper"),
  edgeRef(role, "sideHipToThigh"),
  edgeRef(role, "sideThighToKnee"),
  edgeRef(role, "sideKneeToHem"),
);

const inseamInterface = (role: string) => iface(
  edgeRef(role, "inseamLower"),
  edgeRef(role, "inseamUpper"),
  edgeRef(role, "innerThighToCrotch"),
);

/** The four-panel leg block used by later waistband/fly/pocket assembly. */
export function draftTrouserLegs(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Block {
  const options = resolveTrouserOptions(rawOptions);
  const metrics = trouserMetrics(m, options);
  const front = legPiece(m, metrics, options, "front", "trouser front left");
  const back = legPiece(m, metrics, options, "back", "trouser back left");
  const frontRight = mirrorPiece(front, "trouser front right");
  const backRight = mirrorPiece(back, "trouser back right");
  const roles = { frontLeft: front, frontRight, backLeft: back, backRight };
  const stitches: readonly Stitch[] = [
    { label: "Left side seam (front ↔ back)", a: sideInterface("frontLeft"), b: sideInterface("backLeft") },
    { label: "Right side seam (front ↔ back)", a: sideInterface("frontRight"), b: sideInterface("backRight") },
    { label: "Left inseam (front ↔ back)", a: inseamInterface("frontLeft"), b: inseamInterface("backLeft") },
    { label: "Right inseam (front ↔ back)", a: inseamInterface("frontRight"), b: inseamInterface("backRight") },
    { label: "Center-back seam (left ↔ right)", a: iface(edgeRef("backLeft", "centerBack")), b: iface(edgeRef("backRight", "centerBack")) },
  ];
  return block(roles, stitches);
}

/** Public defaults make the contract easy to inspect in tests and later
 * components without making callers reconstruct the option table. */
export const TROUSER_LEG_DEFAULT_OPTIONS = DEFAULT_TROUSER_OPTIONS;

/** Package the already-verified leg block for later component assembly. */
export const trouserLegsComponent: Component<TrouserOptions> = (m, options) => {
  const legs = draftTrouserLegs(m, options);
  return { pieces: legs.roles, stitches: legs.stitches, interfaces: {} };
};

/** Separate full-length waistband. Its lower edge equals the combined waist
 * edges of the four leg panels, so the later stitch is a real 1:1 seam. */
export const trouserWaistband: Component<TrouserOptions> = (m, rawOptions) => {
  const options = resolveTrouserOptions(rawOptions);
  const finishedWaist = m.waist + m.ease;
  const depth = options.waistbandDepth;
  const end = point(finishedWaist, 0);
  const endBottom = point(finishedWaist, depth);
  const bottom = point(0, depth);
  return {
    pieces: {
      waistband: {
        name: "trouser waistband",
        onFold: false,
        edges: [
          { kind: "line", name: "top", start: point(0, 0), end },
          { kind: "line", name: "endRight", start: end, end: endBottom },
          { kind: "line", name: "bottom", start: endBottom, end: bottom },
          { kind: "line", name: "endLeft", start: bottom, end: point(0, 0) },
        ],
        marks: [
          pointMark("placementPoint", "centerBack", point(0, depth / 2), "center back"),
          pointMark("placementPoint", "centerFront", point(finishedWaist / 2, depth / 2), "center front"),
          pointMark("button", "waistbandButton", point(finishedWaist / 2, depth / 2), "waistband button"),
        ],
      },
    },
    stitches: [],
    interfaces: { bottom: iface(edgeRef("waistband", "bottom")) },
  };
};

const FLY_SHIELD_WIDTH = 3.5;

/** Add a real front-fly mark to both front legs and return the marked block. */
function addFlyMarks(b: Block, flyLength: number): Block {
  const roles = Object.fromEntries(Object.entries(b.roles).map(([role, piece]) => {
    if (!role.startsWith("front")) return [role, piece];
      return [role, {
        ...piece,
        marks: [
        ...piece.marks!,
        lineMark("placementLine", "flyEdge", point(0, 0), point(0, flyLength), "front fly edge"),
      ],
    }];
  }));
  return block(roles, b.stitches);
}

/** A simple two-sided fly shield. Zip/hardware variants are intentionally not
 * modeled in V1; the attachment edges and buttonhole mark are explicit. */
export const trouserFly: Component<TrouserOptions> = (_m, rawOptions) => {
  const options = resolveTrouserOptions(rawOptions);
  const length = options.flyLength;
  const w = FLY_SHIELD_WIDTH;
  const piece: Piece = {
    name: "trouser fly shield",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(w, 0) },
      { kind: "line", name: "right", start: point(w, 0), end: point(w, length) },
      { kind: "line", name: "bottom", start: point(w, length), end: point(0, length) },
      { kind: "line", name: "left", start: point(0, length), end: point(0, 0) },
    ],
    marks: [
      lineMark("foldLine", "flyFold", point(w / 2, 0), point(w / 2, length), "fly fold"),
      pointMark("buttonhole", "waistbandButtonhole", point(w / 2, 2), "waistband buttonhole"),
    ],
  };
  return {
    pieces: { flyShield: piece },
    stitches: [],
    interfaces: {
      left: iface(edgeRef("flyShield", "left")),
      right: iface(edgeRef("flyShield", "right")),
    },
  };
};

/** The V1 pocket-opening construction line on the left front panel. The
 * opening starts inboard of the side waist and travels down/inward at the
 * user's chosen angle; no renderer invents a second pocket geometry. */
export interface TrouserPocketOpening {
  readonly start: ReturnType<typeof point>;
  readonly end: ReturnType<typeof point>;
}

const POCKET_SIDE_WAIST_CLEARANCE = 3.5;

export function trouserPocketOpening(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): TrouserPocketOpening {
  const options = resolveTrouserOptions(rawOptions);
  const waistQ = (m.waist + m.ease) / 4;
  const angle = options.pocketAngle * Math.PI / 180;
  const start = point(waistQ - POCKET_SIDE_WAIST_CLEARANCE, options.pocketDrop);
  return {
    start,
    end: point(
      start.x - Math.cos(angle) * options.pocketOpening,
      start.y + Math.sin(angle) * options.pocketOpening,
    ),
  };
}

function pocketOpeningMark(opening: TrouserPocketOpening): PatternMark {
  return lineMark("placementLine", "pocketOpening", opening.start, opening.end, "pocket opening");
}

/** Add the same live opening mark to the two mirrored front panels. */
function addPocketMarks(b: Block, opening: TrouserPocketOpening): Block {
  const roles = Object.fromEntries(Object.entries(b.roles).map(([role, piece]) => {
    if (role === "frontLeft") {
      return [role, { ...piece, marks: [...piece.marks!, pocketOpeningMark(opening)] }];
    }
    if (role === "frontRight") {
      return [role, {
        ...piece,
        marks: [...piece.marks!, pocketOpeningMark({
          start: mirrorPoint(opening.start), end: mirrorPoint(opening.end),
        })],
      }];
    }
    return [role, piece];
  }));
  return block(roles, b.stitches);
}

/** One minimal quadrilateral pocket bag. Its opening edge is the exact same
 * line as the front-panel mark, so the pocket join is a real stitch rather
 * than a decorative overlay. */
function pocketBagPiece(
  opening: TrouserPocketOpening, depth: number, name: string
): Piece {
  const bottomY = opening.end.y + depth;
  const bottomEnd = point(opening.end.x, bottomY);
  const bottomStart = point(opening.start.x, bottomY);
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "opening", start: opening.start, end: opening.end },
      { kind: "line", name: "bagLower", start: opening.end, end: bottomEnd },
      { kind: "line", name: "bagOuter", start: bottomEnd, end: bottomStart },
      { kind: "line", name: "bagClose", start: bottomStart, end: opening.start },
    ],
    marks: [
      lineMark("placementLine", "bagOpeningMatch", opening.start, opening.end, "MATCH FRONT OPENING"),
      pointMark("placementPoint", "bagBottom", point((bottomStart.x + bottomEnd.x) / 2, bottomY), "bag bottom"),
    ],
  };
}

/** Paired minimal bags, mirrored from the same opening/depth contract. */
export const trouserPocket: Component<TrouserOptions> = (m, rawOptions) => {
  const options = resolveTrouserOptions(rawOptions);
  const opening = trouserPocketOpening(m, options);
  const left = pocketBagPiece(opening, options.pocketBagDepth, "trouser pocket bag left");
  const right = mirrorPiece(left, "trouser pocket bag right");
  return {
    pieces: { pocketBagLeft: left, pocketBagRight: right },
    stitches: [],
    interfaces: {
      leftOpening: iface(edgeRef("pocketBagLeft", "opening")),
      rightOpening: iface(edgeRef("pocketBagRight", "opening")),
    },
  };
};

const trouserWaistStitch = (roles: readonly string[]): Stitch => ({
  label: "Waistband (four legs ↔ separate waistband)",
  a: iface(...roles.map((role) => edgeRef(role, "waist"))),
  b: iface(edgeRef("waistband", "bottom")),
});

/** Slice 97's assembled lower-body block: legs + separate waistband + fly. */
export function draftTrouserWithClosure(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Block {
  const options = resolveTrouserOptions(rawOptions);
  const legs = addFlyMarks(draftTrouserLegs(m, options), options.flyLength);
  const legRoles = ["frontLeft", "frontRight", "backLeft", "backRight"] as const;
  const combined = assembleComponents([
    { pieces: legs.roles, stitches: legs.stitches, interfaces: {} },
    trouserWaistband(m, options),
    trouserFly(m, options),
  ]);
  const stitches: Stitch[] = [
    ...combined.stitches,
    trouserWaistStitch(legRoles),
    { label: "Left front fly ↔ shield", a: iface(markRef("frontLeft", "flyEdge", "left")), b: iface(edgeRef("flyShield", "left")) },
    { label: "Right front fly ↔ shield", a: iface(markRef("frontRight", "flyEdge", "right")), b: iface(edgeRef("flyShield", "right")) },
  ];
  return block(combined.roles, stitches);
}

/** Slice 98's complete digital trouser block: closure plus paired pocket bags
 * attached to the real front-panel opening marks. */
export function draftTrouserWithPockets(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Block {
  const options = resolveTrouserOptions(rawOptions);
  const opening = trouserPocketOpening(m, options);
  const closure = addPocketMarks(draftTrouserWithClosure(m, options), opening);
  const pocket = trouserPocket(m, options);
  const leftPocketStitch: Stitch = {
    label: "Left pocket opening ↔ bag",
    a: iface(markRef("frontLeft", "pocketOpening", "left")),
    b: iface(edgeRef("pocketBagLeft", "opening")),
  };
  const rightPocketStitch: Stitch = {
    label: "Right pocket opening ↔ bag",
    a: iface(markRef("frontRight", "pocketOpening", "right")),
    b: iface(edgeRef("pocketBagRight", "opening")),
  };
  return assembleComponents([
    { pieces: closure.roles, stitches: closure.stitches, interfaces: {} },
    pocket,
  ], [leftPocketStitch, rightPocketStitch]);
}

/** V1 woven trouser cutting allowances. All roles are off-fold; a future
 * material-specific recipe may replace this table without changing sewing
 * geometry. */
export const TROUSER_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    hem: 2,
    waist: 1,
    centerFront: 1,
    centerBack: 1,
    crotch: 1,
    opening: 1,
    bagLower: 1,
    bagOuter: 1,
    bagClose: 1,
    top: 1,
    bottom: 1,
    endRight: 1,
    endLeft: 1,
    left: 1,
    right: 1,
  },
};

/** V1 balance and grain rules for every physical trouser piece. */
export const TROUSER_NOTCHES: readonly PieceNotches[] = [
  ...["trouser front left", "trouser front right"].map((pieceName) => ({
    pieceName,
    notches: [
      { edgeName: "sideUpper", t: 0.5 },
      { edgeName: "sideThighToKnee", t: 0.5 },
      { edgeName: "inseamUpper", t: 0.5 },
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  })),
  ...["trouser back left", "trouser back right"].map((pieceName) => ({
    pieceName,
    notches: [
      { edgeName: "sideUpper", t: 0.5 },
      { edgeName: "sideThighToKnee", t: 0.5 },
      { edgeName: "inseamUpper", t: 0.5 },
      { edgeName: "centerBack", t: 0.5 },
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  })),
  {
    pieceName: "trouser waistband",
    notches: [{ edgeName: "top", t: 0.5 }, { edgeName: "bottom", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  {
    pieceName: "trouser fly shield",
    notches: [{ edgeName: "left", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  ...["trouser pocket bag left", "trouser pocket bag right"].map((pieceName) => ({
    pieceName,
    notches: [{ edgeName: "opening", t: 0.5 }, { edgeName: "bagOuter", t: 0.5 }],
    grainline: { topEdge: "opening", topT: 0.5, bottomEdge: "bagOuter", bottomT: 0.5 },
  })),
];

function sideBoundaryXAtY(piece: Piece, y: number): number | null {
  for (const edge of piece.edges) {
    if (!edge.name.startsWith("side") || edge.kind !== "line") continue;
    const low = Math.min(edge.start.y, edge.end.y);
    const high = Math.max(edge.start.y, edge.end.y);
    if (y < low || y > high) continue;
    const dy = edge.end.y - edge.start.y;
    if (Math.abs(dy) < 1e-9) continue;
    const t = (y - edge.start.y) / dy;
    return edge.start.x + (edge.end.x - edge.start.x) * t;
  }
  return null;
}

function frontPanelPointInside(piece: Piece, p: ReturnType<typeof point>): boolean {
  const side = sideBoundaryXAtY(piece, p.y);
  return p.x > 0 && side !== null && p.x < side;
}

/** Pocket-specific guidance. It reports the supplied finite option values and
 * geometry as-is; it never repairs an invalid opening or silently clamps a
 * bag back into the panel. */
export function trouserPocketGuidance(
  drafted: Block, m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Note[] {
  const options = resolveTrouserOptions(rawOptions);
  const notes: Note[] = [];
  for (const definition of TROUSER_OPTION_DEFINITIONS.filter((d) => d.group === "Pocket")) {
    const value = options[definition.id as keyof TrouserOptions];
    if (value < definition.min || value > definition.max) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} (${value}${definition.unit === "°" ? "°" : " cm"}) is outside V1's ` +
          `${definition.min}–${definition.max}${definition.unit === "°" ? "°" : " cm"} range — adjust it into that range.`,
      });
    }
  }

  const opening = trouserPocketOpening(m, options);
  const metrics = trouserMetrics(m, options);
  const front = rolePiece(drafted, "frontLeft");
  const bottomY = opening.end.y + options.pocketBagDepth;
  if (!frontPanelPointInside(front, opening.start) || !frontPanelPointInside(front, opening.end)) {
    notes.push({
      field: "option-pocketOpening",
      level: "warn",
      text: "Pocket opening leaves the front panel — shorten the opening, reduce its angle/drop, or add waist ease.",
    });
  }
  if (opening.end.y >= metrics.frontCrotchY) {
    notes.push({
      field: "option-pocketDrop",
      level: "warn",
      text: `Pocket opening reaches the front rise (${opening.end.y.toFixed(1)} cm versus ${metrics.frontCrotchY.toFixed(1)} cm) — reduce pocket drop/angle or shorten the opening.`,
    });
  }
  const bagStart = point(opening.start.x, bottomY);
  const bagEnd = point(opening.end.x, bottomY);
  if (bottomY >= metrics.kneeY) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: `Pocket bag reaches the knee region (${bottomY.toFixed(1)} cm) — shorten pocket-bag depth or increase inseam.`,
    });
  }
  if (bottomY >= metrics.hemY) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: `Pocket bag reaches the hem (${bottomY.toFixed(1)} cm versus ${metrics.hemY.toFixed(1)} cm) — shorten pocket-bag depth or increase inseam.`,
    });
  }
  if (bottomY < metrics.hemY &&
      (!frontPanelPointInside(front, bagStart) || !frontPanelPointInside(front, bagEnd))) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: "Pocket bag extends past the front side seam — shorten the bag or reduce the opening/drop so its bottom stays inside the panel.",
    });
  }
  return notes;
}
