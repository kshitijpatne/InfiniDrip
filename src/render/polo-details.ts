// Shared flat Polo collar/stand/placket schematic used by the Body and
// assembled views. The V2 overlay consumes the same neckline-derived collar
// contract as drafting, then maps its half-pattern facts into the front/back
// garment view. It remains a presentation layer: it never changes a Block.

import { NecklineParams, necklineEdge } from "../drafting";
import { buildPoloCollarGeometry, PoloCollarGeometry, reversePoloEdge } from "../drafting/polo-collar";
import { Edge, edgeEnd, edgeStart } from "../drafting/piece";

const round = (n: number): number => Math.round(n * 1000) / 1000;
type Position = "front" | "back";

export interface PoloDetailValues {
  readonly neckWidthHalf: number;
  readonly frontNeckDepth: number;
  readonly backNeckDepth?: number;
  readonly shoulderHalf: number;
  readonly armholeDepth: number;
  /** The active position's neckline, retained for the V1 compatibility path. */
  readonly neckline: NecklineParams;
  readonly frontNeckline?: NecklineParams;
  readonly backNeckline?: NecklineParams;
  readonly position?: Position;
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
  /** Polo V2 controls. Undefined means this is a legacy V1 direct caller. */
  readonly standFrontRise?: number;
  readonly collarPointExtension?: number;
  readonly sideVentDepth?: number;
  readonly backHemDrop?: number;
  readonly bodyHalf?: number;
  readonly bodyLength?: number;
  readonly baseLength?: number;
}

function edgePath(edge: Edge): string {
  if (edge.kind === "line") {
    return `M ${round(edge.start.x)} ${round(edge.start.y)} L ${round(edge.end.x)} ${round(edge.end.y)}`;
  }
  return `M ${round(edge.curve.start.x)} ${round(edge.curve.start.y)} ` +
    `C ${round(edge.curve.control1.x)} ${round(edge.curve.control1.y)} ` +
    `${round(edge.curve.control2.x)} ${round(edge.curve.control2.y)} ` +
    `${round(edge.curve.end.x)} ${round(edge.curve.end.y)}`;
}

function mapEdge(edge: Edge, start: { readonly x: number; readonly y: number }, end: { readonly x: number; readonly y: number }): Edge {
  const sourceStart = edgeStart(edge);
  const sourceEnd = edgeEnd(edge);
  const sourceDx = sourceEnd.x - sourceStart.x;
  const sourceDy = sourceEnd.y - sourceStart.y;
  const scaleX = Math.abs(sourceDx) > 0.000001 ? (end.x - start.x) / sourceDx : 1;
  const scaleY = Math.abs(sourceDy) > 0.000001 ? (end.y - start.y) / sourceDy : 1;
  const transform = (p: { readonly x: number; readonly y: number }) => ({
    x: start.x + (p.x - sourceStart.x) * scaleX,
    y: start.y + (p.y - sourceStart.y) * scaleY,
  });
  if (edge.kind === "line") return { kind: "line", name: edge.name, start: transform(edge.start), end: transform(edge.end) };
  return {
    kind: "curve",
    name: edge.name,
    curve: {
      start: transform(edge.curve.start),
      control1: transform(edge.curve.control1),
      control2: transform(edge.curve.control2),
      end: transform(edge.curve.end),
    },
  };
}

function mirror(edge: Edge): Edge {
  const reflect = (p: { readonly x: number; readonly y: number }) => ({ x: -p.x, y: p.y });
  if (edge.kind === "line") return { kind: "line", name: edge.name, start: reflect(edge.start), end: reflect(edge.end) };
  return {
    kind: "curve",
    name: edge.name,
    curve: {
      start: reflect(edge.curve.start),
      control1: reflect(edge.curve.control1),
      control2: reflect(edge.curve.control2),
      end: reflect(edge.curve.end),
    },
  };
}

function fullHalfPath(right: Edge): string {
  return `${edgePath(reversePoloEdge(mirror(right)))} ${edgePath(right)}`;
}

function collarGeometry(values: PoloDetailValues): PoloCollarGeometry | null {
  const front = necklineEdge(
    "front", values.neckWidthHalf, values.frontNeckDepth, values.shoulderHalf,
    values.armholeDepth, values.frontNeckline ?? values.neckline,
  ).edge;
  const back = necklineEdge(
    "back", values.neckWidthHalf, values.backNeckDepth ?? values.frontNeckDepth,
    values.shoulderHalf, values.armholeDepth, values.backNeckline ?? values.neckline,
  ).edge;
  const result = buildPoloCollarGeometry({ front, back }, {
    standHeight: values.standHeight,
    standFrontRise: values.standFrontRise ?? 0,
    collarLeafDepth: values.collarLeafDepth,
    collarPointExtension: values.collarPointExtension ?? 0,
  });
  return result.geometry;
}

function legacyPoloDetailsSvg(values: PoloDetailValues): string {
  const { cNeck, hps, edge } = necklineEdge(
    "front", values.neckWidthHalf, values.frontNeckDepth,
    values.shoulderHalf, values.armholeDepth, values.neckline);
  const nh = hps.x;
  const stand = values.standHeight;
  const leaf = values.collarLeafDepth;
  const half = values.placketWidth / 2;
  const innerNeck = `M ${round(-nh)} 0 ${edgePath(edge)}`;
  const outerEdge = edge.kind === "line"
    ? { kind: "line" as const, name: edge.name, start: { x: edge.start.x, y: edge.start.y - stand }, end: { x: edge.end.x, y: edge.end.y - stand } }
    : { kind: "curve" as const, name: edge.name, curve: {
        start: { x: edge.curve.start.x, y: edge.curve.start.y - stand },
        control1: { x: edge.curve.control1.x, y: edge.curve.control1.y - stand },
        control2: { x: edge.curve.control2.x, y: edge.curve.control2.y - stand },
        end: { x: edge.curve.end.x, y: edge.curve.end.y - stand },
      } };
  const outerNeck = edgePath(outerEdge);
  const standPath = `${innerNeck} M ${round(-nh)} ${round(-stand)} ${outerNeck} ` +
    `M ${round(-nh)} 0 L ${round(-nh)} ${round(-stand)} M ${round(nh)} 0 L ${round(nh)} ${round(-stand)}`;
  const collarLeft = `M ${round(-nh)} ${round(-stand)} L ${round(-nh - leaf * 0.35)} ${round(leaf * 0.35)} ` +
    `L -2 ${round(leaf)} L 0 ${round(leaf * 0.55)} Z`;
  const collarRight = `M ${round(nh)} ${round(-stand)} L ${round(nh + leaf * 0.35)} ${round(leaf * 0.35)} ` +
    `L 2 ${round(leaf)} L 0 ${round(leaf * 0.55)} Z`;
  const buttons = [3.5, 7, 10.5].map((offset) =>
    `<circle cx="0" cy="${round(cNeck.y + offset)}" r="0.35" fill="none" stroke="currentColor" stroke-width="0.2"/>`).join("");
  return `<g data-edge="option-standHeight"><path d="${standPath}" fill="none" stroke="currentColor" stroke-width="0.7"/></g>` +
    `<g data-edge="option-collarLeafDepth"><path d="${collarLeft} ${collarRight}" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round"/></g>` +
    `<g data-edge="option-placketLength"><rect x="${round(-half)}" y="${round(cNeck.y)}" width="${round(values.placketWidth)}" ` +
      `height="${round(values.placketLength)}" fill="none" stroke="currentColor" stroke-width="0.7"/>${buttons}</g>` +
    `<g data-edge="option-placketWidth"><line x1="${round(-half)}" y1="${round(cNeck.y + values.placketLength + 2)}" ` +
      `x2="${round(half)}" y2="${round(cNeck.y + values.placketLength + 2)}" stroke="currentColor" stroke-width="0.7"/></g>`;
}

/** Render the V2 details. The legacy branch preserves the established direct
 * render contract for callers that still provide only the four V1 values. */
export function poloDetailsSvg(values: PoloDetailValues): string {
  if (values.standFrontRise === undefined && values.collarPointExtension === undefined &&
      values.sideVentDepth === undefined && values.backHemDrop === undefined) {
    return legacyPoloDetailsSvg(values);
  }

  const position = values.position ?? "front";
  const geometry = collarGeometry(values);
  if (!geometry) return legacyPoloDetailsSvg(values);

  const rise = values.standFrontRise ?? 0;
  const depth = position === "front" ? values.frontNeckDepth + rise : (values.backNeckDepth ?? values.frontNeckDepth);
  const bodyHalf = values.bodyHalf ?? values.shoulderHalf;
  const baseLength = values.baseLength ?? values.bodyLength ?? 0;
  const bodyLength = values.bodyLength ?? baseLength + (position === "back" ? values.backHemDrop ?? 0 : 0);
  const ventDepth = values.sideVentDepth ?? 0;
  const stand = values.standHeight;
  const leaf = values.collarLeafDepth;
  const nh = values.neckWidthHalf;
  const lowerSource = position === "front"
    ? reversePoloEdge(geometry.lowerStand.segments[1], "frontNeckline")
    : geometry.lowerStand.segments[0];
  const upperSource = position === "front"
    ? reversePoloEdge(geometry.upperStand.segments[1], "frontCollar")
    : geometry.upperStand.segments[0];
  const baseSource = position === "front"
    ? reversePoloEdge(geometry.collarBase.segments[1], "frontCollarBase")
    : geometry.collarBase.segments[0];
  const lower = mapEdge(lowerSource, { x: 0, y: depth }, { x: nh, y: 0 });
  const upper = mapEdge(upperSource, { x: 0, y: depth - stand }, { x: nh, y: -stand });
  const standPath = `${fullHalfPath(lower)} ${fullHalfPath(upper)} ` +
    `M ${round(-nh)} 0 L ${round(-nh)} ${round(-stand)} M ${round(nh)} 0 L ${round(nh)} ${round(-stand)}`;
  const base = mapEdge(baseSource, { x: 0, y: depth - stand }, { x: nh, y: -stand });

  let collarPath = "";
  let pointPath = "";
  if (position === "front") {
    const tip = { x: Math.max(2, (values.collarPointExtension ?? 0) + 1.5), y: depth - stand + leaf };
    const tipEdge = mapEdge(geometry.collar.frontTip, { x: 0, y: depth - stand }, tip);
    const outerEdge = mapEdge(geometry.collar.outer, tip, { x: nh, y: -stand });
    const rightLeaf = `${edgePath(tipEdge)} ${edgePath(outerEdge)} ${edgePath(reversePoloEdge(base))}`;
    const leftLeaf = `${edgePath(mirror(tipEdge))} ${edgePath(mirror(outerEdge))} ${edgePath(mirror(reversePoloEdge(base)))}`;
    collarPath = `${rightLeaf} ${leftLeaf}`;
    pointPath = edgePath(tipEdge);
  } else {
    const outerBase = mapEdge(baseSource, { x: 0, y: depth - stand + leaf }, { x: nh, y: -stand + leaf });
    const centerBack = mapEdge(geometry.collar.centerBack,
      { x: 0, y: depth - stand + leaf }, { x: 0, y: depth - stand });
    const rightLeaf = `${edgePath(base)} L ${round(nh)} ${round(-stand + leaf)} ` +
      `${edgePath(reversePoloEdge(outerBase))} ${edgePath(centerBack)}`;
    collarPath = `${edgePath(mirror(reversePoloEdge(centerBack)))} ${edgePath(mirror(outerBase))} ` +
      `L ${round(-nh)} ${round(depth - stand)} ${edgePath(mirror(base))} ${rightLeaf}`;
    pointPath = edgePath(centerBack);
  }

  const half = values.placketWidth / 2;
  const frontY = values.frontNeckDepth + rise;
  const buttons = [3.5, 7, 10.5].map((offset) =>
    `<circle cx="0" cy="${round(frontY + offset)}" r="0.35" fill="none" stroke="currentColor" stroke-width="0.2"/>`).join("");
  const frontOnly = position === "front";
  const vent = ventDepth > 0
    ? `<path d="M ${round(bodyHalf)} ${round(baseLength - ventDepth)} L ${round(bodyHalf)} ${round(bodyLength)} ` +
      `M ${round(-bodyHalf)} ${round(baseLength - ventDepth)} L ${round(-bodyHalf)} ${round(bodyLength)}" ` +
      `fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="2 1"/>`
    : "";
  const drop = position === "back" && (values.backHemDrop ?? 0) !== 0
    ? `<path d="M ${round(-bodyHalf)} ${round(baseLength)} L ${round(-bodyHalf)} ${round(bodyLength)} ` +
      `M ${round(bodyHalf)} ${round(baseLength)} L ${round(bodyHalf)} ${round(bodyLength)}" ` +
      `fill="none" stroke="currentColor" stroke-width="0.9"/>`
    : "";
  const group = (field: string, body: string): string => `<g data-edge="${field}">${body}</g>`;
  return `<g data-garment-detail="polo" data-position="${position}">` +
    group("option-standHeight", `<path d="${standPath}" fill="none" stroke="currentColor" stroke-width="0.7"/>`) +
    group("option-standFrontRise", `<path d="${fullHalfPath(lower)}" fill="none" stroke="currentColor" stroke-width="0.7"/>`) +
    group("option-collarLeafDepth", `<path d="${collarPath}" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round"/>`) +
    group("option-collarPointExtension", `<path d="${pointPath}" fill="none" stroke="currentColor" stroke-width="0.7"/>`) +
    group("option-placketLength", frontOnly
      ? `<rect x="${round(-half)}" y="${round(frontY)}" width="${round(values.placketWidth)}" height="${round(values.placketLength)}" fill="none" stroke="currentColor" stroke-width="0.7"/>${buttons}`
      : "") +
    group("option-placketWidth", frontOnly
      ? `<line x1="${round(-half)}" y1="${round(frontY + values.placketLength + 2)}" x2="${round(half)}" y2="${round(frontY + values.placketLength + 2)}" stroke="currentColor" stroke-width="0.7"/>`
      : "") +
    group("option-sideVentDepth", vent) +
    group("option-backHemDrop", drop) +
    `</g>`;
}
