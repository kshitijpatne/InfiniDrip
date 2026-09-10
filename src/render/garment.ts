// The assembled garment view: a clean, schematic front/back silhouette of the
// finished t-shirt, drawn from the same measurements that drive the pattern.
// It is a preview of how the pieces read as a garment — not a drape simulation.

import { Measurements, derive } from "../drafting";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;

// Fabric colour options shown as swatches in the UI.
export const FABRICS: readonly { name: string; color: string }[] = [
  { name: "Charcoal", color: "#3A4150" },
  { name: "Indigo", color: "#3B5BA5" },
  { name: "Terracotta", color: "#C26A4A" },
  { name: "Sage", color: "#7A9B76" },
  { name: "Ecru", color: "#D8CDB8" },
];

export const DEFAULT_FABRIC = FABRICS[0].color;

// One full garment silhouette, centred on x = 0. Front and back differ only
// in how deep the neckline dips. `hasSleeve` (Slice 60): a garment with no
// sleeve role (a tank) stops at the armhole instead of extending out to a
// cuff — the same distinction render/body.ts now makes for its dimension
// lines, so neither view misrepresents a sleeveless garment as short-sleeved.
function silhouettePath(m: Measurements, neckDepth: number, hasSleeve: boolean): string {
  const d = derive(m);
  const half = d.chestWidthHalf;        // half the body width
  const sh = d.shoulderHalf;            // shoulder point
  const nh = d.neckWidthHalf;           // half the neck opening
  const slope = d.shoulderSlope;
  const ad = m.armholeDepth;
  const len = m.length;

  // The sleeve's two extra points, going out from the shoulder and back in
  // to the underarm — only when there IS a sleeve to draw.
  let sleeveOut: string[] = [];
  let sleeveIn: string[] = [];
  if (hasSleeve) {
    const ext = m.sleeveLength;                  // how far the sleeve reaches out
    const y1 = slope + ad * 0.3;                  // sleeve outer-top
    const y2 = slope + ad * 0.3 + m.bicep * 0.4;  // sleeve cuff
    sleeveOut = [`L ${round(sh + ext)} ${round(y1)}`, `L ${round(sh + ext - 2)} ${round(y2)}`];
    sleeveIn = [`L ${round(-(sh + ext - 2))} ${round(y2)}`, `L ${round(-(sh + ext))} ${round(y1)}`];
  }

  return [
    `M ${round(nh)} 0`,                          // right neck point
    `L ${round(sh)} ${round(slope)}`,            // right shoulder
    ...sleeveOut,                                 // out to the sleeve (if any)
    `L ${round(half)} ${round(ad)}`,             // in to the underarm
    `L ${round(half)} ${round(len)}`,            // right side down to hem
    `L ${round(-half)} ${round(len)}`,           // across the hem
    `L ${round(-half)} ${round(ad)}`,            // left side up
    ...sleeveIn,                                  // left sleeve (if any)
    `L ${round(-sh)} ${round(slope)}`,           // left shoulder
    `L ${round(-nh)} 0`,                          // left neck point
    `Q 0 ${round(2 * neckDepth)} ${round(nh)} 0`, // neckline scoop back to start
    "Z",
  ].join(" ");
}

// Dashed armhole seams (both sides) — where the sleeve meets the body. Only
// meaningful when there IS a sleeve; a sleeveless garment's armhole is a
// single finished (bound) edge, not a seam between two pieces.
function armholeSeams(m: Measurements): string {
  const d = derive(m);
  const seam = (x1: number, y1: number, x2: number, y2: number): string =>
    `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="rgba(0,0,0,0.28)" stroke-width="1" stroke-dasharray="3 2" ` +
    `vector-effect="non-scaling-stroke"/>`;
  return seam(d.shoulderHalf, d.shoulderSlope, d.chestWidthHalf, m.armholeDepth) +
         seam(-d.shoulderHalf, d.shoulderSlope, -d.chestWidthHalf, m.armholeDepth);
}

function renderOne(m: Measurements, neckDepth: number, fabric: string,
                   cx: number, top: number, label: string, hasSleeve: boolean): string {
  const path = `<path d="${silhouettePath(m, neckDepth, hasSleeve)}" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
  const seams = hasSleeve ? armholeSeams(m) : "";
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${seams}</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" font-family="system-ui, sans-serif" text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** The assembled view: front and back silhouettes side by side, in fabric
 *  colour. `hasSleeve` (Slice 60) — pass `false` for a sleeveless garment
 *  (a tank); the silhouette stops at the armhole instead of drawing a short
 *  sleeve regardless of what `m.sleeveLength` happens to hold. */
export function renderGarment(m: Measurements, fabric: string, hasSleeve = true): string {
  const d = derive(m);
  const halfW = hasSleeve ? d.shoulderHalf + m.sleeveLength : Math.max(d.shoulderHalf, d.chestWidthHalf);
  const margin = 6;
  const top = 10;
  const gap = 12;
  const frontCx = margin + halfW;
  const backCx = frontCx + 2 * halfW + gap;
  const width = backCx + halfW + margin;
  const height = top + m.length + margin;

  return `<svg viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    renderOne(m, d.frontNeckDepth, fabric, frontCx, top, "FRONT", hasSleeve) +
    renderOne(m, d.backNeckDepth, fabric, backCx, top, "BACK", hasSleeve) +
    `</svg>`;
}
