// Assembles the whole Blueprint canvas as one SVG string: a dark background, a
// measured grid, and each piece drawn with its label, grainline, and fold mark.
// Everything is a string in / string out, so it is testable without a browser.

import { Piece } from "../drafting";
import { pieceToPath, pieceBounds } from "./shape";
import { seamAllowancePath } from "./allowance";
import { BLUEPRINT as T } from "./theme";
import { resolveNotch, resolveGrainline, notchSvg, grainlineSvg } from "./notch";
import { TSHIRT_NOTCHES } from "../drafting/tshirt-notches";
import { dartOf } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;

// --- low-level SVG string helpers -------------------------------------------
function svgLine(x1: number, y1: number, x2: number, y2: number,
                 stroke: string, width: number, dash?: string): string {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
         `stroke="${stroke}" stroke-width="${width}" vector-effect="non-scaling-stroke"${d}/>`;
}

function svgText(x: number, y: number, content: string, fill: string, size: number): string {
  return `<text x="${round(x)}" y="${round(y)}" fill="${fill}" font-size="${size}" ` +
         `font-family="system-ui, sans-serif" text-anchor="middle">${content}</text>`;
}

// --- layout: place pieces left to right, tops aligned -----------------------
const MARGIN_X = 6;
const MARGIN_TOP = 10;
const GAP = 8;
const SEAM_ALLOWANCE = 1;

interface Placed {
  readonly piece: Piece;
  readonly tx: number; // group translate so the piece lands at its visual box
  readonly ty: number;
  readonly vx: number; // visual box (canvas coordinates)
  readonly vy: number;
  readonly w: number;
  readonly h: number;
}

function place(pieces: readonly Piece[]): { placed: Placed[]; width: number; height: number } {
  let cursor = MARGIN_X;
  let maxH = 0;
  const placed = pieces.map((piece) => {
    const b = pieceBounds(piece);
    const item: Placed = {
      piece, tx: cursor - b.minX, ty: MARGIN_TOP - b.minY,
      vx: cursor, vy: MARGIN_TOP, w: b.width, h: b.height,
    };
    cursor += b.width + GAP;
    maxH = Math.max(maxH, b.height);
    return item;
  });
  return { placed, width: cursor - GAP + MARGIN_X, height: MARGIN_TOP + maxH + MARGIN_X };
}

// --- per-piece decorations --------------------------------------------------
function foldMark(x: number, top: number, height: number): string {
  return svgLine(x, top, x, top + height, T.gridStrong, 1.4, "1.4 1.2") +
         svgText(x + 1.6, top + height / 2, "FOLD", T.marker, 2.2);
}

function renderPiece(p: Placed, isActive: boolean): string {
  const stroke = isActive ? T.lineActive : T.line;
  const fill = isActive ? T.fillActive : T.fill;
  const path = `<path d="${pieceToPath(p.piece)}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="${isActive ? 2 : 1.4}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const cut = `<path d="${seamAllowancePath(p.piece, SEAM_ALLOWANCE)}" fill="none" ` +
    `stroke="${T.marker}" stroke-width="1" stroke-dasharray="2 2" opacity="0.55" ` +
    `vector-effect="non-scaling-stroke"/>`;

  const recipe = TSHIRT_NOTCHES.find((r) => r.pieceName === p.piece.name);
  const notches = recipe
    ? recipe.notches.map((rule) => {
        const n = resolveNotch(p.piece, rule);
        return notchSvg(n, 1.5, T.marker, 1.2);
      }).join("")
    : "";
  const grain = recipe
    ? grainlineSvg(resolveGrainline(p.piece, recipe.grainline), T.marker, 1, 1.2)
    : "";

  // A dart's legs already draw as part of the outline; mark its apex so it reads.
  const dart = dartOf(p.piece);
  const dartMark = dart
    ? `<circle cx="${round(dart.apex.x)}" cy="${round(dart.apex.y)}" r="0.9" fill="none" ` +
      `stroke="${T.marker}" stroke-width="1" vector-effect="non-scaling-stroke"/>`
    : "";
  const group = `<g transform="translate(${round(p.tx)} ${round(p.ty)})">${cut}${path}${notches}${grain}${dartMark}</g>`;
  const label = svgText(p.vx + p.w / 2, p.vy - 2.5, p.piece.name.toUpperCase(), T.label, 2.6);
  const fold = p.piece.onFold ? foldMark(p.vx, p.vy, p.h) : "";
  return group + fold + label;
}

function buildGrid(width: number, height: number): string {
  const step = 5;
  const lines: string[] = [];
  for (let x = 0; x <= width + 0.001; x += step) {
    const strong = Math.round(x / step) % 2 === 0;
    lines.push(svgLine(x, 0, x, height, strong ? T.gridStrong : T.grid, 1));
  }
  for (let y = 0; y <= height + 0.001; y += step) {
    const strong = Math.round(y / step) % 2 === 0;
    lines.push(svgLine(0, y, width, y, strong ? T.gridStrong : T.grid, 1));
  }
  return lines.join("");
}

export interface RenderOptions {
  readonly active?: string; // name of the piece to highlight
}

/** Render a set of pieces as one Blueprint-themed SVG string. */
export function renderBlueprint(pieces: readonly Piece[], options: RenderOptions = {}): string {
  const active = options.active ?? (pieces.length > 0 ? pieces[0].name : "");
  const { placed, width, height } = place(pieces);
  const body = placed.map((p) => renderPiece(p, p.piece.name === active)).join("");
  return `<svg viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    buildGrid(width, height) + body + `</svg>`;
}
