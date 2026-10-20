import { point, type Point } from "../geometry";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import { rolePiece, type Block } from "./block";
import type { Measurements } from "./measurements";
import { lineMark, pointMark, type PatternMark } from "./pattern-mark";
import type { Edge, Piece } from "./piece";
import { edgeRef, iface, markRef, type Interface, type Stitch } from "./stitch";
import { resolveJoggerOptions, type JoggerOptions } from "./jogger-contract";
import type { Component, ComponentResult } from "./component";
import { componentNode, composeBlock, garmentGrammar, type CompositionContext } from "./grammar";
import type { GarmentOptions } from "./options";

interface JoggerMetrics {
  readonly finishedWaist: number;
  readonly finishedSeat: number;
  readonly finishedThigh: number;
  readonly finishedKnee: number;
  readonly frontCrotchY: number;
  readonly backCrotchY: number;
  readonly thighY: number;
  readonly kneeY: number;
  readonly hemY: number;
}

interface JoggerProfile {
  readonly sideWaist: Point;
  readonly sideHip: Point;
  readonly sideThigh: Point;
  readonly sideKnee: Point;
  readonly sideHem: Point;
  readonly crotch: Point;
  readonly innerThigh: Point;
  readonly innerKnee: Point;
  readonly innerHem: Point;
}

const JOGGER_POCKET_SIDE_CLEARANCE = 3.5;
const DRAWCORD_CHANNEL_CLEARANCE = 0.6;

function joggerMetrics(m: Measurements, options: JoggerOptions): JoggerMetrics {
  const upper = lowerBodyUpperMetrics(m, options, m.thigh + options.thighEase);
  return {
    finishedWaist: upper.finishedWaist,
    finishedSeat: upper.finishedSeat,
    finishedThigh: upper.finishedThigh,
    finishedKnee: m.knee + options.kneeEase,
    frontCrotchY: upper.frontCrotchY,
    backCrotchY: upper.backCrotchY,
    thighY: upper.thighY,
    kneeY: upper.backCrotchY + m.inseam * 0.52,
    hemY: upper.backCrotchY + m.inseam,
  };
}

function joggerProfile(
  m: Measurements,
  metrics: JoggerMetrics,
  options: JoggerOptions,
): JoggerProfile {
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
}

function joggerLegMarks(
  waistQ: number,
  sideHemX: number,
  metrics: JoggerMetrics,
  position: "front" | "back",
): PatternMark[] {
  const creaseX = (waistQ + sideHemX) / 2;
  return [
    lineMark("placementLine", "creaseLine", point(creaseX, 0), point(creaseX, metrics.hemY), `${position} crease`),
    pointMark("placementPoint", "hipLine", point(creaseX, metrics.thighY - 2.5), "hip balance"),
    pointMark("placementPoint", "kneeLine", point(creaseX, metrics.kneeY), "knee"),
    pointMark("placementPoint", "grainTop", point(creaseX, 4), `${position} grain`),
  ];
}

function joggerLegPiece(
  m: Measurements,
  metrics: JoggerMetrics,
  options: JoggerOptions,
  position: "front" | "back",
): Piece {
  const profile = joggerProfile(m, metrics, options);
  const centerY = position === "front" ? metrics.frontCrotchY : metrics.backCrotchY;
  const centerName = position === "front" ? "centerFront" : "centerBack";
  const crotch: Edge = position === "front"
    ? {
        kind: "curve",
        name: "crotch",
        curve: {
          start: profile.crotch,
          control1: point(profile.crotch.x - 2.2, profile.crotch.y - 0.6),
          control2: point(profile.crotch.x - 2.6, centerY + 0.8),
          end: point(0, centerY),
        },
      }
    : {
        kind: "curve",
        name: "crotch",
        curve: {
          start: profile.crotch,
          control1: point(profile.crotch.x + 2.8, profile.crotch.y + 1.2),
          control2: point(profile.crotch.x + 3.7, centerY - 1.6),
          end: point(0, centerY),
        },
      };
  return {
    name: `jogger ${position} left`,
    onFold: false,
    edges: [
      { kind: "line", name: "waist", start: point(0, 0), end: profile.sideWaist },
      { kind: "line", name: "sideUpper", start: profile.sideWaist, end: profile.sideHip },
      { kind: "line", name: "sideHipToThigh", start: profile.sideHip, end: profile.sideThigh },
      { kind: "line", name: "sideThighToKnee", start: profile.sideThigh, end: profile.sideKnee },
      { kind: "line", name: "sideKneeToHem", start: profile.sideKnee, end: profile.sideHem },
      { kind: "line", name: "hem", start: profile.sideHem, end: profile.innerHem },
      { kind: "line", name: "inseamLower", start: profile.innerHem, end: profile.innerKnee },
      { kind: "line", name: "inseamUpper", start: profile.innerKnee, end: profile.innerThigh },
      { kind: "line", name: "innerThighToCrotch", start: profile.innerThigh, end: profile.crotch },
      crotch,
      { kind: "line", name: centerName, start: point(0, centerY), end: point(0, 0) },
    ],
    marks: joggerLegMarks(metrics.finishedWaist / 4, profile.sideHem.x, metrics, position),
  };
}

function mirrorPoint(p: Point): Point {
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
    marks: piece.marks!.map((mark): PatternMark => "at" in mark
      ? { ...mark, at: mirrorPoint(mark.at) }
      : { ...mark, start: mirrorPoint(mark.start), end: mirrorPoint(mark.end) }),
  };
}

function joggerSideInterface(role: string, reverse: boolean): Interface {
  const forward = ["sideUpper", "sideHipToThigh", "sideThighToKnee", "sideKneeToHem"];
  const path = reverse ? [...forward].reverse() : forward;
  return iface(...path.map((edge) => edgeRef(role, edge, reverse)));
}

function joggerInseamInterface(role: string, reverse: boolean): Interface {
  const forward = ["inseamLower", "inseamUpper", "innerThighToCrotch"];
  const path = reverse ? [...forward].reverse() : forward;
  return iface(...path.map((edge) => edgeRef(role, edge, reverse)));
}

function waistInterface(): Interface {
  return iface(
    edgeRef("backLeft", "waist"),
    edgeRef("frontLeft", "waist", true),
    edgeRef("frontRight", "waist"),
    edgeRef("backRight", "waist", true),
  );
}

function joggerWaistband(options: JoggerOptions, finishedWaist: number): Piece {
  const depth = options.waistbandDepth;
  const foldedCordWidth = options.drawcordCutWidth / 4;
  const requiredChannelDepth = options.elasticWidth + foldedCordWidth + DRAWCORD_CHANNEL_CLEARANCE;
  const channelMargin = (depth - requiredChannelDepth) / 2;
  const elasticStart = channelMargin;
  const elasticEnd = elasticStart + options.elasticWidth;
  const cordStart = elasticEnd + DRAWCORD_CHANNEL_CLEARANCE;
  const cordEnd = cordStart + foldedCordWidth;
  const cordCenter = (cordStart + cordEnd) / 2;
  const leftExitX = finishedWaist / 2 - options.drawcordExitSpacing / 2;
  const rightExitX = finishedWaist / 2 + options.drawcordExitSpacing / 2;
  const marks: PatternMark[] = [
    lineMark("placementLine", "elasticChannelTop", point(0, elasticStart), point(finishedWaist, elasticStart), "elastic channel top"),
    lineMark("placementLine", "elasticChannelBottom", point(0, elasticEnd), point(finishedWaist, elasticEnd), "elastic channel bottom"),
    lineMark("placementLine", "drawcordChannelTop", point(0, cordStart), point(finishedWaist, cordStart), "drawcord channel top"),
    lineMark("placementLine", "drawcordChannelBottom", point(0, cordEnd), point(finishedWaist, cordEnd), "drawcord channel bottom"),
  ];
  if (options.drawcordExit === 1) {
    marks.push(
      pointMark("buttonhole", "drawcordExitLeft", point(leftExitX, cordCenter), "left centre-front drawcord exit"),
      pointMark("buttonhole", "drawcordExitRight", point(rightExitX, cordCenter), "right centre-front drawcord exit"),
      pointMark("placementPoint", "drawcordRetention", point(0, cordCenter), "centre-back drawcord retention"),
    );
  }
  return {
    name: "jogger waistband casing",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(finishedWaist, 0) },
      { kind: "line", name: "endRight", start: point(finishedWaist, 0), end: point(finishedWaist, depth) },
      { kind: "line", name: "bottom", start: point(finishedWaist, depth), end: point(0, depth) },
      { kind: "line", name: "endLeft", start: point(0, depth), end: point(0, 0) },
    ],
    marks,
  };
}

function joggerPocketOpening(
  metrics: JoggerMetrics,
  options: JoggerOptions,
): { readonly start: Point; readonly end: Point } {
  const angle = options.pocketAngle * Math.PI / 180;
  const start = point(metrics.finishedWaist / 4 - JOGGER_POCKET_SIDE_CLEARANCE, options.pocketDrop);
  return {
    start,
    end: point(
      start.x - Math.cos(angle) * options.pocketOpening,
      start.y + Math.sin(angle) * options.pocketOpening,
    ),
  };
}

function pocketBagPiece(opening: { readonly start: Point; readonly end: Point }, depth: number, name: string): Piece {
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
      lineMark("placementLine", "bagOpeningMatch", opening.start, opening.end, "match jogger front opening", "instruction"),
      pointMark("placementPoint", "bagBottom", point((bottomStart.x + bottomEnd.x) / 2, bottomY), "bag bottom"),
    ],
  };
}

export const JOGGER_LEG_STITCHES: readonly Stitch[] = [
    { label: "Left jogger side seam", a: joggerSideInterface("frontLeft", false), b: joggerSideInterface("backLeft", true) },
    { label: "Right jogger side seam", a: joggerSideInterface("frontRight", false), b: joggerSideInterface("backRight", true) },
    { label: "Left jogger inseam", a: joggerInseamInterface("frontLeft", false), b: joggerInseamInterface("backLeft", true) },
    { label: "Right jogger inseam", a: joggerInseamInterface("frontRight", false), b: joggerInseamInterface("backRight", true) },
    { label: "Jogger centre-back rise", a: iface(edgeRef("backLeft", "centerBack")), b: iface(edgeRef("backRight", "centerBack", true)) },
];

type PocketOpening = { readonly start: Point; readonly end: Point };

export function joggerOpeningFromBlock(drafted: Block, role: string): PocketOpening {
  const mark = rolePiece(drafted, role).marks?.find((candidate) => candidate.name === "pocketOpening");
  if (!mark || !("start" in mark)) throw new Error(`Jogger role "${role}" has no line pocketOpening mark`);
  return { start: mark.start, end: mark.end };
}

const joggerLegsComponent: Component<JoggerOptions> = (m, options): ComponentResult => {
  const metrics = joggerMetrics(m, options);
  const frontLeftBase = joggerLegPiece(m, metrics, options, "front");
  const backLeft = joggerLegPiece(m, metrics, options, "back");
  const frontRightBase = mirrorPiece(frontLeftBase, "jogger front right");
  const backRight = mirrorPiece(backLeft, "jogger back right");
  const opening = joggerPocketOpening(metrics, options);
  const frontLeft: Piece = {
    ...frontLeftBase,
    marks: [...frontLeftBase.marks!,
      lineMark("placementLine", "pocketOpening", opening.start, opening.end, "left slant pocket opening"),
      pointMark("placementPoint", "pocketOpeningStart", opening.start, "left pocket start")],
  };
  const frontRight: Piece = {
    ...frontRightBase,
    marks: [...frontRightBase.marks!,
      lineMark("placementLine", "pocketOpening", mirrorPoint(opening.start), mirrorPoint(opening.end), "right slant pocket opening"),
      pointMark("placementPoint", "pocketOpeningStart", mirrorPoint(opening.start), "right pocket start")],
  };
  return {
    pieces: { frontLeft, frontRight, backLeft, backRight },
    stitches: JOGGER_LEG_STITCHES,
    interfaces: {
      waist: waistInterface(),
      leftPocketOpening: iface(markRef("frontLeft", "pocketOpening", "left")),
      rightPocketOpening: iface(markRef("frontRight", "pocketOpening", "left")),
    },
  };
};

const joggerCasingComponent: Component<{ readonly options: JoggerOptions; readonly waistLength: number }> =
  (_m, { options, waistLength }) => ({
    pieces: { waistband: joggerWaistband(options, waistLength) },
    stitches: [],
    interfaces: { bottom: iface(edgeRef("waistband", "bottom", true)) },
  });

const joggerPocketBagsComponent: Component<{
  readonly options: JoggerOptions;
  readonly leftOpening: PocketOpening;
  readonly rightOpening: PocketOpening;
}> = (_m, { options, leftOpening, rightOpening }) => ({
  pieces: {
    pocketBagLeft: pocketBagPiece(leftOpening, options.pocketBagDepth, "jogger pocket bag left"),
    pocketBagRight: pocketBagPiece(rightOpening, options.pocketBagDepth, "jogger pocket bag right"),
  },
  stitches: [],
  interfaces: {
    leftOpening: iface(edgeRef("pocketBagLeft", "opening")),
    rightOpening: iface(edgeRef("pocketBagRight", "opening")),
  },
});

const joggerOptionsFrom = (context: CompositionContext): JoggerOptions =>
  resolveJoggerOptions(context.options as Partial<JoggerOptions>);

/** P0 construction graph. Component joins consume the actual interfaces from
 * the preceding pieces so sizing and seam declarations cannot drift apart. */
export const JOGGER_GRAMMAR = garmentGrammar(
  "jogger",
  [
    componentNode("legs", "jogger-legs", joggerLegsComponent, joggerOptionsFrom),
    componentNode("casing", "self-fabric-casing", joggerCasingComponent, (context) => ({
      options: joggerOptionsFrom(context),
      waistLength: context.interfaceLength("legs", "waist"),
    }), ["legs"]),
    componentNode("pockets", "slant-pocket-bags", joggerPocketBagsComponent, (context) => ({
      options: joggerOptionsFrom(context),
      leftOpening: joggerOpeningFromBlock(context.block, "frontLeft"),
      rightOpening: joggerOpeningFromBlock(context.block, "frontRight"),
    }), ["legs", "casing"]),
  ],
  (context) => [
    {
      label: "Jogger waist to separate casing",
      a: context.interfaceOf("legs", "waist"),
      b: context.interfaceOf("casing", "bottom"),
    },
    {
      label: "Left slant pocket opening to bag",
      a: context.interfaceOf("legs", "leftPocketOpening"),
      b: context.interfaceOf("pockets", "leftOpening"),
    },
    {
      label: "Right slant pocket opening to bag",
      a: context.interfaceOf("legs", "rightPocketOpening"),
      b: context.interfaceOf("pockets", "rightOpening"),
    },
  ],
);

/** Hidden P0 Jogger draft core. The lower-body points are the shipped digital
 * trouser construction stations; this recipe owns its pocket and casing paths. */
export function draftJogger(m: Measurements, rawOptions: Partial<JoggerOptions> = {}): Block {
  return composeBlock(JOGGER_GRAMMAR, m, rawOptions as GarmentOptions);
}
