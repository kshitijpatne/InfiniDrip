// Hidden Jogger body and assembled views use the same authored draft block as
// pattern, construction, and production output. They are flat inspection aids,
// not fit or drape simulations.

import type { Block, Measurements } from "../drafting";
import { draftJogger } from "../drafting/jogger";
import { edgeEnd, edgeStart, pieceEdge, type Piece } from "../drafting/piece";
import type { JoggerOptions } from "../drafting/jogger-contract";
import type { PatternMark } from "../drafting/pattern-mark";
import { pieceBounds, pieceToPath } from "./shape";
import { JOGGER_CASING_MARK_LABEL_OFFSETS, patternMarksSvg } from "./pattern-mark";
import { BLUEPRINT as T } from "./theme";

type Position = "front" | "back";
const MARGIN = 8;
const GAP = 10;
const round = (value: number): number => Math.round(value * 1000) / 1000;

function panelRoles(position: Position): readonly [string, string] {
  return position === "front" ? ["frontLeft", "frontRight"] : ["backLeft", "backRight"];
}

function sourcePiece(block: Block, roleId: string) {
  return block.roles[roleId]!;
}

function omitMarkLabel(mark: PatternMark): PatternMark {
  const { label: _label, ...geometryOnly } = mark;
  return geometryOnly;
}


function edgePath(piece: Piece, edgeName: string): string {
  const edge = pieceEdge(piece, edgeName);
  if (edge.kind === "line") {
    return '<path d="M ' + round(edge.start.x) + ' ' + round(edge.start.y) + ' L ' +
      round(edge.end.x) + ' ' + round(edge.end.y) + '" fill="none" stroke="' + T.line +
      '" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  }
  const curve = edge.curve;
  return '<path d="M ' + round(curve.start.x) + ' ' + round(curve.start.y) + ' C ' +
    round(curve.control1.x) + ' ' + round(curve.control1.y) + ' ' +
    round(curve.control2.x) + ' ' + round(curve.control2.y) + ' ' +
    round(curve.end.x) + ' ' + round(curve.end.y) + '" fill="none" stroke="' + T.line +
    '" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
}

function edgeGroup(field: string, content: string): string {
  return '<g data-edge="' + field + '">' + content + "</g>";
}

function lineBetween(piece: Piece, first: string, second: string, secondAt: "start" | "end"): string {
  const firstPoint = edgeEnd(pieceEdge(piece, first));
  const secondEdge = pieceEdge(piece, second);
  const secondPoint = secondAt === "start" ? edgeStart(secondEdge) : edgeEnd(secondEdge);
  return '<line x1="' + round(firstPoint.x) + '" y1="' + round(firstPoint.y) +
    '" x2="' + round(secondPoint.x) + '" y2="' + round(secondPoint.y) +
    '" stroke="' + T.line + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/>';
}

function measurementOverlays(
  block: Block, position: Position, cx: number, top: number,
): string {
  const roles = panelRoles(position);
  const pieces = roles.map((roleId) => sourcePiece(block, roleId));
  const paired = (name: string): string => pieces.map((piece) => edgePath(piece, name)).join("");
  const center = position === "front" ? "centerFront" : "centerBack";
  const leftHip = edgeEnd(pieceEdge(pieces[0]!, "sideUpper"));
  const rightHip = edgeEnd(pieceEdge(pieces[1]!, "sideUpper"));
  const hipDepth = '<line x1="' + round(leftHip.x) + '" y1="' + round(leftHip.y) +
    '" x2="' + round(rightHip.x) + '" y2="' + round(rightHip.y) +
    '" stroke="' + T.line + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/>';
  const thigh = pieces.map((piece) =>
    lineBetween(piece, "sideHipToThigh", "innerThighToCrotch", "start"),
  ).join("");
  const knee = pieces.map((piece) =>
    lineBetween(piece, "sideThighToKnee", "inseamLower", "end"),
  ).join("");
  const inseamNames = ["inseamLower", "inseamUpper", "innerThighToCrotch"];
  const inseam = pieces.map((piece) =>
    inseamNames.map((name) => edgePath(piece, name)).join(""),
  ).join("");
  return '<g transform="translate(' + round(cx) + ' ' + round(top) + ')">' +
    edgeGroup("waist", paired("waist")) +
    edgeGroup("hip", paired("sideUpper") + paired("sideHipToThigh")) +
    edgeGroup("hipDepth", hipDepth) +
    edgeGroup("crotchDepth", paired(center) + paired("crotch")) +
    edgeGroup("thigh", thigh) +
    edgeGroup("knee", knee) +
    edgeGroup("inseam", inseam) +
    "</g>";
}

function panelPair(block: Block, position: Position, color: string, cx: number, top: number): string {
  const roles = panelRoles(position);
  const panels = roles.map((roleId) => {
    const piece = sourcePiece(block, roleId);
    const pocketMarks = piece.marks!.filter((mark) => mark.name === "pocketOpening")
      .map(omitMarkLabel);
    return '<g transform="translate(' + round(cx) + ' ' + round(top) + ')" data-source-role="' + roleId + '">' +
      '<path data-role="' + roleId + '" d="' + pieceToPath(piece) + '" fill="' + color +
      '" data-edge="ease" stroke="' + T.line + '" stroke-width="1.1" stroke-linejoin="round" ' +
      'vector-effect="non-scaling-stroke"/>' +
      patternMarksSvg(pocketMarks, { stroke: T.marker, width: 0.8, pointSize: 0.55, labelSize: 1.1 }) +
      '</g>';
  }).join("");
  return panels + measurementOverlays(block, position, cx, top);
}

function svgShell(viewBox: string, label: string, body: string): string {
  return `<svg data-garment="jogger" aria-label="${label}" viewBox="${viewBox}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="${viewBox.split(" ")[0]}" y="${viewBox.split(" ")[1]}" ` +
    `width="${viewBox.split(" ")[2]}" height="${viewBox.split(" ")[3]}" fill="${T.background}"/>${body}</svg>`;
}

/** One front or back lower-body Body view built from its two live draft panels. */
export function renderJoggerBody(
  m: Measurements, rawOptions: Partial<JoggerOptions> = {}, position: Position = "front",
): string {
  const block = draftJogger(m, rawOptions);
  const pieces = panelRoles(position).map((roleId) => sourcePiece(block, roleId));
  const bounds = pieces.map(pieceBounds);
  const minX = Math.min(...bounds.map((bound) => bound.minX)) - MARGIN;
  const minY = Math.min(...bounds.map((bound) => bound.minY)) - MARGIN;
  const maxX = Math.max(...bounds.map((bound) => bound.minX + bound.width)) + MARGIN;
  const maxY = Math.max(...bounds.map((bound) => bound.minY + bound.height)) + MARGIN;
  const body = `<text x="0" y="${round(minY + 3)}" fill="${T.label}" font-size="2.8" ` +
    `font-family="system-ui, sans-serif" text-anchor="middle">${position.toUpperCase()} BODY</text>` +
    panelPair(block, position, T.cloth, 0, 0);
  return svgShell(`${round(minX)} ${round(minY)} ${round(maxX - minX)} ${round(maxY - minY)}`,
    `Jogger ${position} body figure`, body);
}

/** Side-by-side front/back lower-body Body views. */
export function renderJoggerBodyPair(m: Measurements, rawOptions: Partial<JoggerOptions> = {}): string {
  return `<div style="display:flex;gap:8px;width:100%">` +
    `<div style="flex:1;min-width:0">${renderJoggerBody(m, rawOptions, "front")}</div>` +
    `<div style="flex:1;min-width:0">${renderJoggerBody(m, rawOptions, "back")}</div></div>`;
}

function boundsFor(block: Block, roleId: string) {
  return pieceBounds(sourcePiece(block, roleId));
}

function maximumPanelHalf(block: Block): number {
  return Math.max(...["frontLeft", "frontRight", "backLeft", "backRight"].map((roleId) => {
    const bounds = boundsFor(block, roleId);
    return Math.max(Math.abs(bounds.minX), Math.abs(bounds.minX + bounds.width));
  }));
}

function withoutLabels(piece: ReturnType<typeof sourcePiece>): PatternMark[] {
  return piece.marks!.map(omitMarkLabel);
}

function component(
  piece: ReturnType<typeof sourcePiece>, roleId: string, targetX: number, targetY: number,
  color: string, label: string,
): string {
  const bounds = pieceBounds(piece);
  const dx = targetX - bounds.minX;
  const dy = targetY - bounds.minY;
  const marks = roleId === "waistband"
    ? patternMarksSvg(piece.marks, {
      stroke: T.marker, width: 0.8, pointSize: 0.55, labelSize: 0.85,
      labelOffsets: JOGGER_CASING_MARK_LABEL_OFFSETS,
    })
    : patternMarksSvg(withoutLabels(piece), { stroke: T.marker, width: 0.8, pointSize: 0.55, labelSize: 0.85 });
  return `<g transform="translate(${round(dx)} ${round(dy)})" data-component-role="${roleId}">` +
    `<path data-role="${roleId}" d="${pieceToPath(piece)}" fill="${color}" stroke="${T.line}" ` +
    `stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${marks}</g>` +
    `<text x="${round(targetX + bounds.width / 2)}" y="${round(targetY - 2)}" fill="${T.label}" ` +
    `font-size="2.2" font-family="system-ui, sans-serif" text-anchor="middle">${label}</text>`;
}

/** Flat assembled Jogger view plus identifiable source-scale casing and pocket details. */
export function renderJoggerGarment(
  m: Measurements, fabric: string, rawOptions: Partial<JoggerOptions> = {},
): string {
  const block = draftJogger(m, rawOptions);
  const half = maximumPanelHalf(block);
  const mainWidth = MARGIN * 2 + half * 4 + GAP;
  const band = sourcePiece(block, "waistband");
  const leftBag = sourcePiece(block, "pocketBagLeft");
  const rightBag = sourcePiece(block, "pocketBagRight");
  const bandBounds = pieceBounds(band);
  const leftBounds = pieceBounds(leftBag);
  const rightBounds = pieceBounds(rightBag);
  const bagRowWidth = leftBounds.width + rightBounds.width + GAP;
  const width = Math.max(mainWidth, bandBounds.width + MARGIN * 2, bagRowWidth + MARGIN * 2);
  const offset = (width - mainWidth) / 2;
  const frontCx = MARGIN + offset + half;
  const backCx = frontCx + half * 2 + GAP;
  const legHeight = Math.max(...["frontLeft", "frontRight", "backLeft", "backRight"].map((roleId) => {
    const bounds = boundsFor(block, roleId);
    return bounds.minY + bounds.height;
  }));
  const top = 12;
  const detailsY = top + legHeight + 10;
  const bagRowY = detailsY + bandBounds.height + GAP + 6;
  const height = bagRowY + Math.max(leftBounds.height, rightBounds.height) + MARGIN;
  const body = `<text x="${round(frontCx)}" y="8" fill="${T.label}" font-size="2.8" ` +
    `font-family="system-ui, sans-serif" text-anchor="middle">FRONT</text>` +
    `<text x="${round(backCx)}" y="8" fill="${T.label}" font-size="2.8" ` +
    `font-family="system-ui, sans-serif" text-anchor="middle">BACK</text>` +
    panelPair(block, "front", fabric, frontCx, top) + panelPair(block, "back", fabric, backCx, top) +
    component(band, "waistband", (width - bandBounds.width) / 2, detailsY, fabric, "WAISTBAND CASING") +
    component(leftBag, "pocketBagLeft", (width - bagRowWidth) / 2, bagRowY, fabric, "LEFT POCKET BAG") +
    component(rightBag, "pocketBagRight", (width - bagRowWidth) / 2 + leftBounds.width + GAP, bagRowY, fabric, "RIGHT POCKET BAG");
  return svgShell(`0 0 ${round(width)} ${round(height)}`, "Jogger assembled lower-body view", body);
}
