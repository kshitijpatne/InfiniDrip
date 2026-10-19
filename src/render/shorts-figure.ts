// Lower-body shorts views built from the exact nine-role recipe block.

import type { Measurements } from "../drafting/measurements";
import type { Block } from "../drafting/block";
import { rolePiece } from "../drafting/block";
import type { Piece } from "../drafting/piece";
import { edgeEnd, edgeStart, pieceEdge } from "../drafting/piece";
import { draftShortsWithComponents, resolveShortsOptions } from "../drafting/shorts-components";
import type { ShortsOptions } from "../drafting/shorts-contract";
import { shortsMetrics } from "../drafting/shorts-geometry";
import { pieceBounds, pieceToPath } from "./shape";
import { patternMarksSvg } from "./pattern-mark";
import { BLUEPRINT as T } from "./theme";

type Position = "front" | "back";
type LegRole = "frontLeft" | "frontRight" | "backLeft" | "backRight";
type ComponentRole = "waistband" | "flyShield" | "flyUnderlap" | "pocketBagLeft" | "pocketBagRight";

const GAP = 10;
const MARGIN = 8;
const round = (value: number): number => Math.round(value * 1000) / 1000;
const FONT = 'font-family="system-ui, sans-serif"';

function txt(x: number, y: number, value: string, anchor = "middle", size = 2.8): string {
  return '<text x="' + round(x) + '" y="' + round(y) + '" fill="' + T.label + '" font-size="' + size +
    '" ' + FONT + ' text-anchor="' + anchor + '">' + value + "</text>";
}

function line(x1: number, y1: number, x2: number, y2: number, color: string = T.marker, width = 0.8): string {
  return '<line x1="' + round(x1) + '" y1="' + round(y1) + '" x2="' + round(x2) + '" y2="' + round(y2) +
    '" stroke="' + color + '" stroke-width="' + width + '" vector-effect="non-scaling-stroke"/>';
}

function dimH(x1: number, x2: number, y: number, label: string): string {
  return line(x1, y, x2, y) + line(x1, y - 1.2, x1, y + 1.2) + line(x2, y - 1.2, x2, y + 1.2) +
    txt((x1 + x2) / 2, y - 1.8, label);
}

function dimV(x: number, y1: number, y2: number, label: string, side: 1 | -1): string {
  return line(x, y1, x, y2) + line(x - 1.2, y1, x + 1.2, y1) + line(x - 1.2, y2, x + 1.2, y2) +
    txt(x + side * 1.8, (y1 + y2) / 2, label, side === 1 ? "start" : "end");
}

function edgePath(piece: Piece, name: string): string {
  const edge = pieceEdge(piece, name);
  if (edge.kind === "line") return line(edge.start.x, edge.start.y, edge.end.x, edge.end.y, T.line, 1.1);
  const curve = edge.curve;
  return '<path d="M ' + round(curve.start.x) + " " + round(curve.start.y) +
    " C " + round(curve.control1.x) + " " + round(curve.control1.y) +
    " " + round(curve.control2.x) + " " + round(curve.control2.y) +
    " " + round(curve.end.x) + " " + round(curve.end.y) +
    '" fill="none" stroke="' + T.line + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/>';
}

function edgeGroup(field: string, content: string): string {
  return '<g data-edge="' + field + '">' + content + "</g>";
}

function dimGroup(field: string, content: string): string {
  return '<g data-dim="' + field + '">' + content + "</g>";
}

function rolesFor(position: Position): readonly [LegRole, LegRole] {
  return position === "front" ? ["frontLeft", "frontRight"] : ["backLeft", "backRight"];
}

function panelPairHalf(block: Block, position?: Position): number {
  const roles: readonly LegRole[] = position
    ? rolesFor(position)
    : ["frontLeft", "frontRight", "backLeft", "backRight"];
  return Math.max(...roles.map((role) => {
    const bounds = pieceBounds(rolePiece(block, role));
    return Math.max(Math.abs(bounds.minX), Math.abs(bounds.minX + bounds.width));
  }));
}

function panelPair(
  block: Block, position: Position, fill: string, cx: number, top: number, label: string,
): string {
  const roles = rolesFor(position);
  const panels = roles.map((role) => {
    const piece = rolePiece(block, role);
    return '<path data-role="' + role + '" d="' + pieceToPath(piece) + '" fill="' + fill +
      '" stroke="' + T.line + '" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      patternMarksSvg(piece.marks, {
        stroke: T.marker, width: 0.9, pointSize: 0.7, labelSize: 1.45, labelPlacement: "offset",
      });
  }).join("");
  return '<g transform="translate(' + round(cx) + " " + round(top) + ')"><g data-edge="figure">' +
    panels + "</g></g>" + txt(cx, top - 3, label);
}

interface TrayLayout {
  readonly width: number;
  readonly height: number;
  readonly bandHeight: number;
  readonly flyRowHeight: number;
  readonly bagRowHeight: number;
}

function trayLayout(block: Block): TrayLayout {
  const band = pieceBounds(rolePiece(block, "waistband"));
  const shield = pieceBounds(rolePiece(block, "flyShield"));
  const underlap = pieceBounds(rolePiece(block, "flyUnderlap"));
  const leftBag = pieceBounds(rolePiece(block, "pocketBagLeft"));
  const rightBag = pieceBounds(rolePiece(block, "pocketBagRight"));
  const flyWidth = shield.width + underlap.width + GAP;
  const bagWidth = leftBag.width + rightBag.width + GAP;
  return {
    width: Math.max(band.width, flyWidth, bagWidth) + MARGIN * 2,
    height: 6 + band.height + GAP + Math.max(shield.height, underlap.height) +
      GAP + Math.max(leftBag.height, rightBag.height) + MARGIN,
    bandHeight: band.height,
    flyRowHeight: Math.max(shield.height, underlap.height),
    bagRowHeight: Math.max(leftBag.height, rightBag.height),
  };
}

function componentPiece(
  block: Block, role: ComponentRole, x: number, y: number, fill: string, overlays = "",
): string {
  const piece = rolePiece(block, role);
  const bounds = pieceBounds(piece);
  const name = piece.name.toUpperCase();
  return '<g transform="translate(' + round(x - bounds.minX) + " " + round(y - bounds.minY) +
    ')" data-edge="component"><path data-role="' + role + '" d="' + pieceToPath(piece) + '" fill="' + fill +
    '" stroke="' + T.line + '" stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
    patternMarksSvg(piece.marks, {
      stroke: T.marker, width: 0.8, pointSize: 0.6, labelSize: 1.25, labelPlacement: "offset",
    }) + overlays + "</g>" + txt(x + bounds.width / 2, y - 2, name, "middle", 2.1);
}

function componentOptionOverlays(block: Block, role: ComponentRole): string {
  const piece = rolePiece(block, role);
  if (role === "waistband") return edgeGroup("option-waistbandDepth", edgePath(piece, "endRight"));
  if (role === "flyShield") return edgeGroup("option-flyLength", edgePath(piece, "right"));
  if (role === "flyUnderlap") return edgeGroup("option-flyLength", edgePath(piece, "frontEdge"));
  const opening = edgePath(piece, "opening");
  return edgeGroup("option-pocketOpening", opening) +
    edgeGroup("option-pocketAngle", opening) +
    edgeGroup("option-pocketBagDepth", edgePath(piece, "bagLower")) +
    edgeGroup("option-pocketDrop", opening);
}

function componentTray(block: Block, fill: string, width: number, y: number): string {
  const layout = trayLayout(block);
  const band = pieceBounds(rolePiece(block, "waistband"));
  const shield = pieceBounds(rolePiece(block, "flyShield"));
  const underlap = pieceBounds(rolePiece(block, "flyUnderlap"));
  const leftBag = pieceBounds(rolePiece(block, "pocketBagLeft"));
  const rightBag = pieceBounds(rolePiece(block, "pocketBagRight"));
  const bandY = y + 6;
  const flyY = bandY + layout.bandHeight + GAP;
  const bagY = flyY + layout.flyRowHeight + GAP;
  const flyStart = (width - shield.width - underlap.width - GAP) / 2;
  const bagStart = (width - leftBag.width - rightBag.width - GAP) / 2;
  const content =
    txt(width / 2, y + 2, "SHORTS COMPONENTS", "middle", 2.4) +
    componentPiece(block, "waistband", (width - band.width) / 2, bandY, fill,
      componentOptionOverlays(block, "waistband")) +
    componentPiece(block, "flyShield", flyStart, flyY, fill,
      componentOptionOverlays(block, "flyShield")) +
    componentPiece(block, "flyUnderlap", flyStart + shield.width + GAP, flyY, fill,
      componentOptionOverlays(block, "flyUnderlap")) +
    componentPiece(block, "pocketBagLeft", bagStart, bagY, fill,
      componentOptionOverlays(block, "pocketBagLeft")) +
    componentPiece(block, "pocketBagRight", bagStart + leftBag.width + GAP, bagY, fill,
      componentOptionOverlays(block, "pocketBagRight"));
  return '<g data-garment-detail="shorts-components">' + content + "</g>";
}

function rawMeasurementEdges(block: Block, position: Position): string {
  const [leftRole, rightRole] = rolesFor(position);
  const left = rolePiece(block, leftRole);
  const right = rolePiece(block, rightRole);
  const both = (name: string): string => edgePath(left, name) + edgePath(right, name);
  const leftHip = edgeEnd(pieceEdge(left, "sideUpper"));
  const rightHip = edgeEnd(pieceEdge(right, "sideUpper"));
  const leftThighStart = edgeEnd(pieceEdge(left, "sideHipToThigh"));
  const leftThighEnd = edgeStart(pieceEdge(left, "innerThighToCrotch"));
  const rightThighStart = edgeEnd(pieceEdge(right, "sideHipToThigh"));
  const rightThighEnd = edgeStart(pieceEdge(right, "innerThighToCrotch"));
  const thigh = line(leftThighStart.x, leftThighStart.y, leftThighEnd.x, leftThighEnd.y, T.line, 1.1) +
    line(rightThighStart.x, rightThighStart.y, rightThighEnd.x, rightThighEnd.y, T.line, 1.1);
  const center = position === "front" ? "centerFront" : "centerBack";
  return edgeGroup("waist", both("waist")) +
    edgeGroup("hip", both("sideUpper") + both("sideHipToThigh")) +
    edgeGroup("hipDepth", line(leftHip.x, leftHip.y, rightHip.x, rightHip.y, T.line, 1.1)) +
    edgeGroup("crotchDepth", both(center)) +
    edgeGroup("crotch", both("crotch")) +
    edgeGroup("thigh", thigh);
}

function optionOverlays(block: Block, position: Position, options: ShortsOptions, rightDimX: number, metrics: ReturnType<typeof shortsMetrics>): string {
  const [leftRole, rightRole] = rolesFor(position);
  const left = rolePiece(block, leftRole);
  const right = rolePiece(block, rightRole);
  const center = position === "front" ? "centerFront" : "centerBack";
  const rise = position === "front" ? "frontRiseEase" : "backRiseEase";
  const hemOpening = rolesFor(position).map((role) => edgePath(rolePiece(block, role), "hem")).join("");
  return edgeGroup("option-" + rise, edgePath(left, center) + edgePath(right, center)) +
    edgeGroup("option-hemOpening", hemOpening) +
    edgeGroup("option-shortsInseam", dimV(rightDimX, metrics.backCrotchY, metrics.hemY,
      "Shorts length " + options.shortsInseam + " cm", 1));
}

function maxY(block: Block): number {
  return Math.max(...(["frontLeft", "frontRight", "backLeft", "backRight"] as const).map((role) => {
    const bounds = pieceBounds(rolePiece(block, role));
    return bounds.minY + bounds.height;
  }));
}

export function renderShortsBody(
  measurements: Measurements, rawOptions: Partial<ShortsOptions> = {}, position: Position = "front",
): string {
  const block = draftShortsWithComponents(measurements, rawOptions);
  const options: ShortsOptions = resolveShortsOptions(rawOptions);
  const metrics = shortsMetrics(measurements, options);
  const tray = trayLayout(block);
  const half = panelPairHalf(block, position);
  const leftDimX = -(half + 14);
  const rightDimX = half + 14;
  const trayY = maxY(block) + 10;
  const minX = Math.min(leftDimX - 24, -tray.width / 2 - MARGIN);
  const maxX = Math.max(rightDimX + 24, tray.width / 2 + MARGIN);
  const minY = -13;
  const maxSvgY = trayY + tray.height;
  const front = rolePiece(block, rolesFor(position)[0]);
  const side = edgeEnd(pieceEdge(front, "sideUpper"));
  const innerThigh = edgeStart(pieceEdge(front, "innerThighToCrotch"));
  const thighHalf = Math.abs(side.x - innerThigh.x);
  const dimensions =
    dimGroup("waist", dimH(-half / 2, half / 2, -6, "Waist " + measurements.waist + " (circ)")) +
    dimGroup("hip", dimH(-side.x, side.x, measurements.hipDepth - 2.5, "Hip " + measurements.hip + " (circ)")) +
    dimGroup("hipDepth", dimV(leftDimX, 0, measurements.hipDepth, "Hip depth " + measurements.hipDepth, -1)) +
    dimGroup("crotchDepth", dimV(leftDimX - 6, 0, measurements.crotchDepth,
      "Crotch depth " + measurements.crotchDepth, -1)) +
    dimGroup("thigh", dimH(-thighHalf, thighHalf, metrics.thighY - 2.5,
      "Finished thigh target " + measurements.thigh + " (circ)")) +
    dimGroup("option-hemOpening", txt(0, metrics.hemY + 4, "Finished hem opening " + options.hemOpening + " cm")) +
    dimGroup("frontRiseEase", dimV(rightDimX + 6, 0, metrics.frontRise,
      "Front rise " + metrics.frontRise + " cm", 1)) +
    dimGroup("backRiseEase", dimV(rightDimX + 6, 0, metrics.backRise,
      "Back rise " + metrics.backRise + " cm", 1));
  const body = panelPair(block, position, T.cloth, 0, 0, position.toUpperCase());
  const components = '<g transform="translate(' + round(-tray.width / 2) + ' 0)">' +
    componentTray(block, T.cloth, tray.width, trayY) + "</g>";
  const width = maxX - minX;
  const height = maxSvgY - minY;
  const label = "Shorts " + position + " body figure";
  return '<svg data-croquis-region="lower" data-croquis-view="' + position + '" aria-label="' + label +
    '" viewBox="' + round(minX) + " " + round(minY) + " " + round(width) + " " + round(height) +
    '" width="100%" xmlns="http://www.w3.org/2000/svg" style="background:' + T.background + ';border-radius:8px">' +
    '<rect x="' + round(minX) + '" y="' + round(minY) + '" width="' + round(width) + '" height="' +
    round(height) + '" fill="' + T.background + '"/>' + body + rawMeasurementEdges(block, position) +
    optionOverlays(block, position, options, rightDimX, metrics) + components + dimensions + "</svg>";
}

export function renderShortsBodyPair(
  measurements: Measurements, rawOptions: Partial<ShortsOptions> = {},
): string {
  return '<div style="display:flex;gap:8px;width:100%">' +
    '<div style="flex:1;min-width:0"><div style="font-size:11px;color:' + T.label +
    ';text-transform:uppercase;text-align:center;margin-bottom:4px">Front</div>' +
    renderShortsBody(measurements, rawOptions, "front") + "</div>" +
    '<div style="flex:1;min-width:0"><div style="font-size:11px;color:' + T.label +
    ';text-transform:uppercase;text-align:center;margin-bottom:4px">Back</div>' +
    renderShortsBody(measurements, rawOptions, "back") + "</div></div>";
}

export function renderShortsGarment(
  measurements: Measurements, fabric: string, rawOptions: Partial<ShortsOptions> = {},
): string {
  const block = draftShortsWithComponents(measurements, rawOptions);
  const half = panelPairHalf(block);
  const tray = trayLayout(block);
  const mainWidth = MARGIN * 2 + half * 4 + GAP;
  const width = Math.max(mainWidth, tray.width);
  const offset = (width - mainWidth) / 2;
  const frontCx = MARGIN + offset + half;
  const backCx = frontCx + half * 2 + GAP;
  const top = 12;
  const trayY = top + maxY(block) + 10;
  const height = trayY + tray.height + MARGIN;
  return '<svg data-garment="shorts" viewBox="0 0 ' + round(width) + " " + round(height) +
    '" width="100%" xmlns="http://www.w3.org/2000/svg" style="background:' + T.background + ';border-radius:8px">' +
    '<rect x="0" y="0" width="' + round(width) + '" height="' + round(height) + '" fill="' + T.background + '"/>' +
    panelPair(block, "front", fabric, frontCx, top, "FRONT") +
    panelPair(block, "back", fabric, backCx, top, "BACK") +
    componentTray(block, fabric, width, trayY) + "</svg>";
}

export function renderShortsSide(
  measurements: Measurements, rawOptions: Partial<ShortsOptions> = {},
): string {
  const block = draftShortsWithComponents(measurements, rawOptions);
  const piece = rolePiece(block, "frontLeft");
  const bounds = pieceBounds(piece);
  const minX = bounds.minX - MARGIN;
  const minY = bounds.minY - MARGIN;
  const width = bounds.width + MARGIN * 2;
  const height = bounds.height + MARGIN * 2;
  return '<svg data-croquis-region="lower" data-croquis-view="side" aria-label="Shorts side drafting profile" ' +
    'viewBox="' + round(minX) + " " + round(minY) + " " + round(width) + " " + round(height) +
    '" width="100%" xmlns="http://www.w3.org/2000/svg" style="background:' + T.background + ';border-radius:8px">' +
    '<rect x="' + round(minX) + '" y="' + round(minY) + '" width="' + round(width) + '" height="' +
    round(height) + '" fill="' + T.background + '"/>' +
    '<path data-role="frontLeft" data-part="side-silhouette" d="' + pieceToPath(piece) + '" fill="' + T.fill +
    '" stroke="' + T.line + '" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
    txt(0, minY + 4, "SIDE · SHORTS DRAFT", "middle", 2.5) + "</svg>";
}
