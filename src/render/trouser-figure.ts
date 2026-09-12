// The trouser's lower-body presentation, derived from the same drafted block
// used by Pattern, checks, POMs, and exports. This is a flat inspection aid, not
// a drape or fit simulation.

import {
  Block,
  Measurements,
  draftTrouserWithPockets,
  edgeEnd,
  edgeStart,
  pieceEdge,
  rolePiece,
  trouserMetrics,
} from "../drafting";
import type { Piece, PatternMark, TrouserOptions } from "../drafting";
import { pieceBounds, pieceToPath } from "./shape";
import { patternMarksSvg } from "./pattern-mark";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const FONT = 'font-family="system-ui, sans-serif"';
const GAP = 10;
const MARGIN = 8;

type Position = "front" | "back";

function txt(x: number, y: number, text: string, anchor = "middle", size = 3): string {
  return `<text x="${round(x)}" y="${round(y)}" fill="${T.label}" font-size="${size}" ` +
    `${FONT} text-anchor="${anchor}">${text}</text>`;
}

function line(
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 0.8, opacity = 1
): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" ` +
    `vector-effect="non-scaling-stroke"/>`;
}

function dimH(xa: number, xb: number, y: number, label: string): string {
  return line(xa, y, xb, y, T.marker) +
    line(xa, y - 1.2, xa, y + 1.2, T.marker) +
    line(xb, y - 1.2, xb, y + 1.2, T.marker) +
    txt((xa + xb) / 2, y - 1.8, label);
}

function dimV(x: number, ya: number, yb: number, label: string, side: 1 | -1): string {
  return line(x, ya, x, yb, T.marker) +
    line(x - 1.2, ya, x + 1.2, ya, T.marker) +
    line(x - 1.2, yb, x + 1.2, yb, T.marker) +
    txt(x + side * 1.8, (ya + yb) / 2, label, side === 1 ? "start" : "end");
}

function edgePath(piece: Piece, edgeName: string, color = T.line, width = 1.1): string {
  const edge = pieceEdge(piece, edgeName);
  if (edge.kind === "line") {
    return line(edge.start.x, edge.start.y, edge.end.x, edge.end.y, color, width);
  }
  const c = edge.curve;
  return `<path d="M ${round(c.start.x)} ${round(c.start.y)} ` +
    `C ${round(c.control1.x)} ${round(c.control1.y)} ${round(c.control2.x)} ${round(c.control2.y)} ` +
    `${round(c.end.x)} ${round(c.end.y)}" fill="none" stroke="${color}" stroke-width="${width}" ` +
    `stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
}

function edgeGroup(field: string, content: string): string {
  return `<g data-edge="${field}">${content}</g>`;
}

function lineBetween(piece: Piece, a: string, b: string, bAt: "start" | "end"): string {
  const ap = edgeEnd(pieceEdge(piece, a));
  const bp = bAt === "start" ? edgeStart(pieceEdge(piece, b)) : edgeEnd(pieceEdge(piece, b));
  return line(ap.x, ap.y, bp.x, bp.y, T.line, 1.1);
}

function markNames(piece: Piece, names: readonly string[]): readonly PatternMark[] {
  return piece.marks!.filter((mark) => names.includes(mark.name));
}

function panelRoles(position: Position): readonly [string, string] {
  return position === "front" ? ["frontLeft", "frontRight"] : ["backLeft", "backRight"];
}

function panelPairHalf(block: Block, position?: Position): number {
  const roles = position ? panelRoles(position) : ["frontLeft", "frontRight", "backLeft", "backRight"];
  return Math.max(...roles.map((role) => {
    const bounds = pieceBounds(rolePiece(block, role));
    return Math.max(Math.abs(bounds.minX), Math.abs(bounds.minX + bounds.width));
  }));
}

function optionOverlays(block: Block, position: Position): string {
  const [leftRole, rightRole] = panelRoles(position);
  const left = rolePiece(block, leftRole);
  const right = rolePiece(block, rightRole);
  const pieces = [left, right];
  const both = (fn: (piece: Piece) => string): string => pieces.map(fn).join("");
  const edgeBoth = (name: string): string => both((piece) => edgePath(piece, name));
  const marksBoth = (names: readonly string[]): string =>
    both((piece) => patternMarksSvg(markNames(piece, names), {
      stroke: T.marker, width: 0.9, pointSize: 0.7, labelSize: 1.6, labelPlacement: "offset",
    }));
  const option = (name: string, content: string): string => edgeGroup(`option-${name}`, content);
  const thigh = both((piece) => lineBetween(piece, "sideHipToThigh", "innerThighToCrotch", "start"));
  const knee = both((piece) => lineBetween(piece, "sideThighToKnee", "inseamLower", "end"));
  const riseName = position === "front" ? "frontRiseEase" : "backRiseEase";
  const riseEdge = position === "front" ? "centerFront" : "centerBack";
  return option(riseName, edgeBoth(riseEdge)) +
    option("thighEase", thigh) +
    option("kneeEase", knee) +
    option("legOpening", edgeBoth("hem")) +
    (position === "front"
      ? option("flyLength", marksBoth(["flyEdge"])) +
        option("pocketOpening", marksBoth(["pocketOpening", "pocketOpeningStart"])) +
        option("pocketAngle", marksBoth(["pocketOpening"])) +
        option("pocketDrop", marksBoth(["pocketOpeningStart"]))
      : "");
}

function panelPair(
  block: Block, position: Position, fill: string, cx: number, top: number,
  label: string, includeOptions = true
): string {
  const [leftRole, rightRole] = panelRoles(position);
  const pieces = [rolePiece(block, leftRole), rolePiece(block, rightRole)];
  const outlines = pieces.map((piece, index) =>
    `<path data-role="${index === 0 ? leftRole : rightRole}" d="${pieceToPath(piece)}" fill="${fill}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
  ).join("");
  const construction = pieces.map((piece) => {
    const hidden = markNames(piece, ["flyEdge", "pocketOpening", "pocketOpeningStart"]);
    const visible = piece.marks!.filter((mark) => !hidden.includes(mark));
    return patternMarksSvg(visible, {
      stroke: T.marker, width: 0.9, pointSize: 0.7, labelSize: 1.5, labelPlacement: "offset",
    });
  }).join("");
  const details = `<g transform="translate(${round(cx)} ${round(top)})">` +
    `<g data-edge="figure">${outlines}</g>` +
    `<g data-edge="construction">${construction}</g>` +
    (includeOptions ? optionOverlays(block, position) : "") +
    `</g>`;
  return details + txt(cx, top - 3, label, "middle", 2.8);
}

interface TrayLayout {
  readonly width: number;
  readonly height: number;
}

function trayLayout(block: Block): TrayLayout {
  const band = pieceBounds(rolePiece(block, "waistband"));
  const fly = pieceBounds(rolePiece(block, "flyShield"));
  const leftBag = pieceBounds(rolePiece(block, "pocketBagLeft"));
  const rightBag = pieceBounds(rolePiece(block, "pocketBagRight"));
  const rowWidth = fly.width + leftBag.width + rightBag.width + GAP * 2;
  return {
    width: Math.max(band.width, rowWidth) + MARGIN * 2,
    height: 6 + band.height + GAP + Math.max(fly.height, leftBag.height, rightBag.height) + MARGIN,
  };
}

function componentPiece(
  piece: Piece, role: string, x: number, y: number, color: string,
  optionEdges: Readonly<Record<string, readonly string[]>>
): string {
  const bounds = pieceBounds(piece);
  const tx = x - bounds.minX;
  const ty = y - bounds.minY;
  const base = `<path data-role="${role}" d="${pieceToPath(piece)}" fill="${color}" stroke="${T.line}" ` +
    `stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
    patternMarksSvg(piece.marks, { stroke: T.marker, width: 0.8, pointSize: 0.6, labelSize: 1.35, labelPlacement: "offset" });
  const overlays = Object.entries(optionEdges).map(([field, names]) =>
    edgeGroup(field, names.map((name) => edgePath(piece, name, T.line, 1.1)).join(""))).join("");
  return `<g transform="translate(${round(tx)} ${round(ty)})" data-edge="component">${base}${overlays}</g>` +
    txt(x + bounds.width / 2, y - 2, role.replace("trouser ", "").toUpperCase(), "middle", 2.2);
}

function componentTray(block: Block, color: string, width: number, y: number): string {
  const band = rolePiece(block, "waistband");
  const fly = rolePiece(block, "flyShield");
  const leftBag = rolePiece(block, "pocketBagLeft");
  const rightBag = rolePiece(block, "pocketBagRight");
  const bandBounds = pieceBounds(band);
  const flyBounds = pieceBounds(fly);
  const leftBounds = pieceBounds(leftBag);
  const rightBounds = pieceBounds(rightBag);
  const rowWidth = flyBounds.width + leftBounds.width + rightBounds.width + GAP * 2;
  let x = MARGIN + (width - rowWidth) / 2;
  const rowY = y + 6 + bandBounds.height + GAP;
  const parts = [
    componentPiece(band, "trouser waistband", (width - bandBounds.width) / 2, y + 6, color, { "option-waistbandDepth": ["endRight"] }),
    componentPiece(fly, "trouser fly shield", x, rowY, color, { "option-flyLength": ["left", "right"] }),
  ];
  x += flyBounds.width + GAP;
  parts.push(componentPiece(leftBag, "trouser pocket bag left", x, rowY, color, {
    "option-pocketOpening": ["opening"], "option-pocketAngle": ["opening"],
    "option-pocketDrop": ["opening"], "option-pocketBagDepth": ["bagLower"],
  }));
  x += leftBounds.width + GAP;
  parts.push(componentPiece(rightBag, "trouser pocket bag right", x, rowY, color, {
    "option-pocketOpening": ["opening"], "option-pocketAngle": ["opening"],
    "option-pocketDrop": ["opening"], "option-pocketBagDepth": ["bagLower"],
  }));
  return `<g data-garment-detail="trouser-components">${txt(width / 2, y + 2, "CONSTRUCTION DETAILS", "middle", 2.4)}${parts.join("")}</g>`;
}

function rawMeasurementEdges(block: Block, position: Position): string {
  const [leftRole, rightRole] = panelRoles(position);
  const front = rolePiece(block, leftRole);
  const right = rolePiece(block, rightRole);
  const paired = (name: string): string => edgePath(front, name) + edgePath(right, name);
  const hipLeft = edgeEnd(pieceEdge(front, "sideUpper"));
  const hipRight = edgeEnd(pieceEdge(right, "sideUpper"));
  const thigh = lineBetween(front, "sideHipToThigh", "innerThighToCrotch", "start") +
    lineBetween(right, "sideHipToThigh", "innerThighToCrotch", "start");
  const knee = lineBetween(front, "sideThighToKnee", "inseamLower", "end") +
    lineBetween(right, "sideThighToKnee", "inseamLower", "end");
  const center = position === "front" ? "centerFront" : "centerBack";
  return edgeGroup("waist", paired("waist")) +
    edgeGroup("hip", paired("sideUpper") + paired("sideHipToThigh")) +
    edgeGroup("hipDepth", line(hipLeft.x, hipLeft.y, hipRight.x, hipRight.y, T.line, 1.1)) +
    edgeGroup("crotchDepth", edgePath(front, center) + edgePath(right, center)) +
    edgeGroup("crotch", edgePath(front, "crotch") + edgePath(right, "crotch")) +
    edgeGroup("thigh", thigh) +
    edgeGroup("knee", knee) +
    edgeGroup("inseam", paired("inseamLower") + paired("inseamUpper") + paired("innerThighToCrotch"));
}

/** A lower-body Body view whose garment outline and option features come from
 * the actual trouser block, rather than a skirt or a second renderer formula. */
export function renderTrouserBody(
  m: Measurements, rawOptions: Partial<TrouserOptions> = {}, position: Position = "front"
): string {
  const block = draftTrouserWithPockets(m, rawOptions);
  const metrics = trouserMetrics(m, rawOptions);
  const half = panelPairHalf(block, position);
  const front = rolePiece(block, "frontLeft");
  const side = edgeEnd(pieceEdge(front, "sideUpper"));
  const thighInner = edgeStart(pieceEdge(front, "innerThighToCrotch"));
  const kneeInner = edgeEnd(pieceEdge(front, "inseamLower"));
  const hem = edgeStart(pieceEdge(front, "hem"));
  const thighHalf = Math.abs(side.x - thighInner.x);
  const kneeHalf = Math.abs(edgeEnd(pieceEdge(front, "sideThighToKnee")).x - kneeInner.x);
  const hemHalf = Math.abs(hem.x - edgeEnd(pieceEdge(front, "hem")).x);
  const widest = Math.max(half, side.x, thighHalf, kneeHalf, hemHalf);
  const gutter = 28;
  const leftDimX = -(widest + 7);
  const rightDimX = widest + 7;
  const tray = trayLayout(block);
  const trayY = metrics.hemY + 10;
  const minX = Math.min(leftDimX - gutter, -tray.width / 2 - MARGIN);
  const maxX = Math.max(rightDimX + gutter, tray.width / 2 + MARGIN);
  const minY = -13;
  const maxY = trayY + tray.height;
  const width = maxX - minX;
  const height = maxY - minY;
  const dim = (field: string, content: string): string => `<g data-dim="${field}">${content}</g>`;
  const riseField = position === "front" ? "frontRiseEase" : "backRiseEase";
  const riseLabel = position === "front" ? "Front" : "Back";
  const dimensions =
    dim("waist", dimH(-edgeEnd(pieceEdge(front, "waist")).x, edgeEnd(pieceEdge(front, "waist")).x, -6, `Waist ${m.waist} (circ)`)) +
    dim("hip", dimH(-side.x, side.x, m.hipDepth - 2.5, `Hip ${m.hip} (circ)`)) +
    dim("hipDepth", dimV(leftDimX, 0, m.hipDepth, `Hip depth ${m.hipDepth}`, -1)) +
    dim("crotchDepth", dimV(leftDimX - 6, 0, m.crotchDepth, `Crotch depth ${m.crotchDepth}`, -1)) +
    dim("thigh", dimH(-thighHalf, thighHalf, metrics.thighY - 2.5, `Thigh ${m.thigh} (circ)`)) +
    dim("knee", dimH(-kneeHalf, kneeHalf, metrics.kneeY - 2.5, `Knee ${m.knee} (circ)`)) +
    dim("inseam", dimV(rightDimX, metrics.backCrotchY, metrics.hemY, `Inseam ${m.inseam}`, 1)) +
    dim(riseField, dimV(rightDimX + 6, 0, position === "front" ? metrics.frontRise : metrics.backRise,
      `${riseLabel} rise ${position === "front" ? metrics.frontRise : metrics.backRise}`, 1));
  const bodyEdges = rawMeasurementEdges(block, position);
  const optionsSvg = optionOverlays(block, position);
  const body = panelPair(block, position, T.cloth, 0, 0, position.toUpperCase(), false);
  const component = `<g transform="translate(${round(-tray.width / 2)} 0)">${componentTray(block, T.cloth, tray.width, trayY)}</g>`;
  return `<svg data-croquis-region="lower" data-croquis-view="${position}" aria-label="Trouser ${position} body figure" ` +
    `viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    body + bodyEdges + optionsSvg + component + dimensions +
    // The option-specific overlays are deliberately separate from raw-field
    // overlays so the UI can spotlight either the body measurement or the
    // construction choice without hiding the other source-of-truth geometry.
    `</svg>`;
}

/** Front/back body projections for the lower trouser recipe. */
export function renderTrouserBodyPair(m: Measurements, rawOptions: Partial<TrouserOptions> = {}): string {
  return `<div style="display:flex;gap:8px;width:100%">` +
    `<div style="flex:1;min-width:0"><div style="font-size:11px;color:${T.label};text-transform:uppercase;text-align:center;margin-bottom:4px">Front</div>` +
    renderTrouserBody(m, rawOptions, "front") + `</div>` +
    `<div style="flex:1;min-width:0"><div style="font-size:11px;color:${T.label};text-transform:uppercase;text-align:center;margin-bottom:4px">Back</div>` +
    renderTrouserBody(m, rawOptions, "back") + `</div></div>`;
}

/** Flat assembled preview of the four live leg panels plus the actual closure
 * and pocket components. The tray is an inspection inset, not a second draft. */
export function renderTrouserGarment(
  m: Measurements, fabric: string, rawOptions: Partial<TrouserOptions> = {}
): string {
  const block = draftTrouserWithPockets(m, rawOptions);
  const half = panelPairHalf(block);
  const tray = trayLayout(block);
  const mainWidth = MARGIN * 2 + half * 4 + GAP;
  const width = Math.max(mainWidth, tray.width);
  const offset = (width - mainWidth) / 2;
  const frontCx = MARGIN + offset + half;
  const backCx = frontCx + half * 2 + GAP;
  const top = 12;
  const legHeight = Math.max(...["frontLeft", "frontRight", "backLeft", "backRight"].map((role) => {
    const bounds = pieceBounds(rolePiece(block, role));
    return bounds.minY + bounds.height;
  }));
  const trayY = top + legHeight + 10;
  const height = trayY + tray.height + MARGIN;
  const body = panelPair(block, "front", fabric, frontCx, top, "FRONT") +
    panelPair(block, "back", fabric, backCx, top, "BACK");
  return `<svg data-garment="trouser" viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    body + componentTray(block, fabric, width, trayY) +
    `</svg>`;
}

/** The Side projection uses the actual left-front profile endpoints as a
 * labelled drafting envelope. It intentionally carries no side dimensions. */
export function renderTrouserSide(m: Measurements, rawOptions: Partial<TrouserOptions> = {}): string {
  const block = draftTrouserWithPockets(m, rawOptions);
  const piece = rolePiece(block, "frontLeft");
  const pointAt = (edge: string, at: "start" | "end") => at === "start"
    ? edgeStart(pieceEdge(piece, edge)) : edgeEnd(pieceEdge(piece, edge));
  const points = [
    pointAt("waist", "start"), pointAt("waist", "end"), pointAt("sideUpper", "end"),
    pointAt("sideHipToThigh", "end"), pointAt("sideThighToKnee", "end"), pointAt("sideKneeToHem", "end"),
    pointAt("hem", "end"), pointAt("inseamLower", "end"), pointAt("inseamUpper", "end"),
    pointAt("innerThighToCrotch", "end"), pointAt("crotch", "end"), pointAt("centerFront", "end"),
  ];
  const path = `M ${points.map((p, i) => `${i ? "L" : ""} ${round(p.x)} ${round(p.y)}`).join(" ")} Z`;
  const bounds = pieceBounds(piece);
  const minX = -MARGIN;
  const maxX = bounds.minX + bounds.width + MARGIN;
  const minY = -10;
  const maxY = bounds.minY + bounds.height + MARGIN;
  return `<svg data-croquis-region="lower" data-croquis-view="side" aria-label="Side schematic trouser envelope" ` +
    `viewBox="${round(minX)} ${round(minY)} ${round(maxX - minX)} ${round(maxY - minY)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(maxX - minX)}" height="${round(maxY - minY)}" fill="${T.background}"/>` +
    `<text x="${round((minX + maxX) / 2)}" y="-4" fill="${T.label}" font-size="3" ${FONT} text-anchor="middle">SIDE · SCHEMATIC</text>` +
    `<path data-part="side-silhouette" d="${path}" fill="${T.fill}" stroke="${T.line}" stroke-width="1.4" ` +
    `stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
    `</svg>`;
}
