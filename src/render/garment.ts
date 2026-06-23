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

// One full garment silhouette (body + short sleeves), centred on x = 0.
// Front and back differ only in how deep the neckline dips.
function silhouettePath(m: Measurements, neckDepth: number): string {
  const d = derive(m);
  const half = d.chestWidthHalf;        // half the body width
  const sh = d.shoulderHalf;            // shoulder point
  const nh = d.neckWidthHalf;           // half the neck opening
  const slope = d.shoulderSlope;
  const ad = m.armholeDepth;
  const len = m.length;
  const ext = m.sleeveLength;           // how far the sleeve reaches out
  const y1 = slope + ad * 0.3;          // sleeve outer-top
  const y2 = slope + ad * 0.3 + m.bicep * 0.4; // sleeve cuff

  return [
    `M ${round(nh)} 0`,                          // right neck point
    `L ${round(sh)} ${round(slope)}`,            // right shoulder
    `L ${round(sh + ext)} ${round(y1)}`,         // out to the sleeve
    `L ${round(sh + ext - 2)} ${round(y2)}`,     // sleeve cuff
    `L ${round(half)} ${round(ad)}`,             // back in to the underarm
    `L ${round(half)} ${round(len)}`,            // right side down to hem
    `L ${round(-half)} ${round(len)}`,           // across the hem
    `L ${round(-half)} ${round(ad)}`,            // left side up
    `L ${round(-(sh + ext - 2))} ${round(y2)}`,  // left sleeve cuff
    `L ${round(-(sh + ext))} ${round(y1)}`,      // left sleeve
    `L ${round(-sh)} ${round(slope)}`,           // left shoulder
    `L ${round(-nh)} 0`,                          // left neck point
    `Q 0 ${round(2 * neckDepth)} ${round(nh)} 0`, // neckline scoop back to start
    "Z",
  ].join(" ");
}

// Dashed armhole seams (both sides) — where the sleeve meets the body.
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
                   cx: number, top: number, label: string): string {
  const path = `<path d="${silhouettePath(m, neckDepth)}" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${armholeSeams(m)}</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" font-family="system-ui, sans-serif" text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** The assembled view: front and back silhouettes side by side, in fabric colour. */
export function renderGarment(m: Measurements, fabric: string): string {
  const d = derive(m);
  const halfW = d.shoulderHalf + m.sleeveLength; // half-width of one silhouette
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
    renderOne(m, d.frontNeckDepth, fabric, frontCx, top, "FRONT") +
    renderOne(m, d.backNeckDepth, fabric, backCx, top, "BACK") +
    `</svg>`;
}
