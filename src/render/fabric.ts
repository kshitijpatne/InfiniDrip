// The fabric nest view — the estimator drawn on a bolt of cloth.
//
// A grey "fabric" sheet the width of the bolt and as long as the nest reaches,
// with each piece's cut outline dropped onto it and a caption reporting the
// length of cloth needed and how much of it is actually pattern (utilization).
//
// Pure string in / string out, like the rest of render — the packing math lives
// in export/nesting; this only draws what it was handed. Inputs are plain
// geometry so render never depends on the export layer.

import { Point } from "../geometry";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;

const CAPTION_H = 10; // cm of space under the sheet for the read-out
const WARNING_H = 8; // cm reserved above the sheet when the bolt is too narrow
const FABRIC = "#1B2A3D"; // the cloth: a shade up from the canvas background
const EDGE = "#2E496B"; // the selvage edges

/** A placed piece as this view needs it: a name and its true-scale cut loop. */
export interface NestPlacement {
  readonly name: string;
  readonly cut: readonly Point[];
}

function loopPath(pts: readonly Point[]): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
    .join(" ") + " Z";
}

function centroid(pts: readonly Point[]): Point {
  const sx = pts.reduce((s, p) => s + p.x, 0);
  const sy = pts.reduce((s, p) => s + p.y, 0);
  return { x: sx / pts.length, y: sy / pts.length };
}

/**
 * Draw the nest: the fabric sheet, the placed cut outlines, and a caption with
 * the fabric length needed and the utilization. `fits` false adds a warning that
 * a piece is wider than the cloth.
 */
export function renderFabricNest(
  placed: readonly NestPlacement[],
  fabricWidth: number,
  fabricLength: number,
  utilization: number,
  fits: boolean
): string {
  const warningHeight = fits ? 0 : WARNING_H;
  const height = fabricLength + CAPTION_H + warningHeight;

  const sheet =
    `<rect x="0" y="${round(warningHeight)}" width="${round(fabricWidth)}" height="${round(fabricLength)}" ` +
    `fill="${FABRIC}"/>` +
    `<line x1="0" y1="${round(warningHeight)}" x2="0" y2="${round(warningHeight + fabricLength)}" stroke="${EDGE}" stroke-width="0.4"/>` +
    `<line x1="${round(fabricWidth)}" y1="${round(warningHeight)}" x2="${round(fabricWidth)}" ` +
    `y2="${round(warningHeight + fabricLength)}" stroke="${EDGE}" stroke-width="0.4"/>`;

  const shapes = placed
    .map((p) => {
      const c = centroid(p.cut);
      return `<path d="${loopPath(p.cut)}" fill="${T.lineActive}" fill-opacity="0.14" ` +
        `stroke="${T.line}" stroke-width="0.15" stroke-linejoin="round"/>` +
        `<text x="${round(c.x)}" y="${round(c.y)}" fill="${T.line}" font-size="2.2" ` +
        `font-family="system-ui,sans-serif" text-anchor="middle">${p.name.toUpperCase()}</text>`;
    })
    .join("");

  const pct = (utilization * 100).toFixed(0);
  const cap = `${fabricWidth} cm wide  ·  needs ${fabricLength.toFixed(1)} cm of length  ·  ${pct}% used`;
  const warning = fits ? "" :
    `<g role="alert" aria-label="A piece is wider than this fabric. Increase fabric width or revise the garment.">` +
    `<text x="0" y="3" fill="${T.patternInstruction}" font-size="1.1" font-weight="bold" ` +
    `font-family="system-ui,sans-serif">WARNING · a piece is wider than this fabric</text>` +
    `<text x="0" y="5.3" fill="${T.patternInstruction}" font-size="1.1" ` +
    `font-family="system-ui,sans-serif">Increase fabric width or revise the garment.</text></g>`;
  const shapesOnSheet = warningHeight === 0 ? shapes
    : `<g transform="translate(0 ${round(warningHeight)})">${shapes}</g>`;
  const caption = fits
    ? `<text x="0" y="${round(warningHeight + fabricLength + 5)}" fill="${T.label}" font-size="3" ` +
      `font-family="system-ui,sans-serif">${cap}</text>`
    : `<text x="0" y="${round(warningHeight + fabricLength + 3)}" fill="${T.label}" font-size="1.1" ` +
      `font-family="system-ui,sans-serif">${fabricWidth} cm wide · needs ${fabricLength.toFixed(1)} cm of length</text>` +
      `<text x="0" y="${round(warningHeight + fabricLength + 5.2)}" fill="${T.label}" font-size="1.1" ` +
      `font-family="system-ui,sans-serif">${pct}% used</text>`;

  return `<svg viewBox="0 0 ${round(fabricWidth)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(fabricWidth)}" height="${round(height)}" ` +
    `fill="${T.background}"/>` +
    warning + sheet + shapesOnSheet + caption + `</svg>`;
}
