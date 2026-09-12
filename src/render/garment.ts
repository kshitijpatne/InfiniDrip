// The assembled garment view: a clean, schematic front/back silhouette of the
// finished t-shirt, drawn from the same measurements that drive the pattern.
// It is a preview of how the pieces read as a garment — not a drape simulation.

import { Measurements, derive, necklineEdge, NecklineParams, NECKLINE_DEFAULT } from "../drafting";
import { BLUEPRINT as T } from "./theme";
import { armholePathCommand, necklinePathCommand } from "./neckline-path";
import { sleevelessArmhole } from "../drafting/armhole";
import { poloDetailsSvg } from "./polo-details";

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

/** Finished, recipe-owned Polo dimensions used only to annotate the assembled
 * schematic. Pattern geometry remains the drafting source of truth. */
export interface PoloVisual {
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
}

/** Finished woven-shirt details used only by the assembled schematic. */
export interface WovenShirtVisual {
  readonly buttonCount: number;
  readonly buttonSpacing: number;
  readonly frontOverlap: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
  readonly yokeDepth: number;
  readonly pocketWidth: number;
  readonly pocketHeight: number;
  readonly sideVentDepth: number;
}

// One full garment silhouette, centred on x = 0. `hasSleeve` (Slice 60): a
// garment with no sleeve role (a tank) stops at the armhole instead of
// extending out to a cuff — the same distinction render/body.ts now makes
// for its dimension lines, so neither view misrepresents a sleeveless
// garment as short-sleeved. `neckline` (Slice 61): front and back used to
// differ only in how deep a fixed placeholder curve dipped; now the curve
// itself is the REAL one `necklineEdge()` computes for this garment's
// declared shape (crew/v/scoop), the same function the actual draft calls.
function silhouettePath(
  m: Measurements, position: "front" | "back", hasSleeve: boolean, neckline: NecklineParams,
  strapWidth?: number
): string {
  const d = derive(m);
  const half = d.chestWidthHalf;        // half the body width
  const sh = d.shoulderHalf;            // shoulder point
  const slope = d.shoulderSlope;
  const ad = m.armholeDepth;
  const len = m.length;
  const baseDepth = position === "front" ? d.frontNeckDepth : d.backNeckDepth;
  const { cNeck, hps, edge: neckEdge } =
    necklineEdge(position, d.neckWidthHalf, baseDepth, sh, ad, neckline);
  const nh = hps.x; // where the collar meets the shoulder — real, not the raw derived default
  const strapX = strapWidth === undefined ? sh : nh + strapWidth;
  const tankArmhole = !hasSleeve && strapWidth !== undefined
    ? sleevelessArmhole(strapX, nh, sh, slope, half, ad).edge
    : null;

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
    `L ${round(strapX)} ${round(slope)}`,        // right shoulder / strap point
    ...sleeveOut,                                 // out to the sleeve (if any)
    tankArmhole ? armholePathCommand(tankArmhole) : `L ${round(half)} ${round(ad)}`, // real tank armhole
    `L ${round(half)} ${round(len)}`,            // right side down to hem
    `L ${round(-half)} ${round(len)}`,           // across the hem
    `L ${round(-half)} ${round(ad)}`,            // left side up
    ...sleeveIn,                                  // left sleeve (if any)
    tankArmhole ? armholePathCommand(tankArmhole, true) : `L ${round(-strapX)} ${round(slope)}`, // mirrored tank armhole
    `L ${round(-nh)} 0`,                          // left neck point
    necklinePathCommand(cNeck, hps, neckEdge),    // the real collar: crew, v, or scoop
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

function renderOne(m: Measurements, position: "front" | "back", fabric: string,
                   cx: number, top: number, label: string, hasSleeve: boolean,
                   neckline: NecklineParams, strapWidth?: number, polo?: PoloVisual,
                   shirt?: WovenShirtVisual): string {
  const path = `<path d="${silhouettePath(m, position, hasSleeve, neckline, strapWidth)}" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
  const seams = hasSleeve ? armholeSeams(m) : "";
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${seams}` +
    (position === "front" && polo ? poloFrontDetails(m, neckline, polo) : "") +
    (position === "front" && shirt ? wovenShirtFrontDetails(m, shirt) : "") + `</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" font-family="system-ui, sans-serif" text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** Flat front view only: visible finished placket, fixed three buttons, and
 * collar/stand silhouette at the exact selected dimensions. No drape claim. */
function poloFrontDetails(m: Measurements, neckline: NecklineParams, polo: PoloVisual): string {
  const d = derive(m);
  return `<g color="rgba(0,0,0,0.5)">${poloDetailsSvg({
    neckWidthHalf: d.neckWidthHalf, frontNeckDepth: d.frontNeckDepth,
    shoulderHalf: d.shoulderHalf, armholeDepth: m.armholeDepth,
    neckline, ...polo,
  })}</g>`;
}

function wovenShirtFrontDetails(m: Measurements, shirt: WovenShirtVisual): string {
  const d = derive(m);
  const count = Number.isFinite(shirt.buttonCount)
    ? Math.max(0, Math.min(20, Math.round(shirt.buttonCount)))
    : 0;
  const firstY = Math.max(5, d.frontNeckDepth + shirt.standHeight);
  const buttons = Array.from({ length: count }, (_, i) =>
    `<circle cx="${round(shirt.frontOverlap)}" cy="${round(firstY + i * shirt.buttonSpacing)}" r="0.45" fill="none" stroke="currentColor" data-edge="woven-button"/>`
  ).join("");
  const pocketY = Math.max(firstY + shirt.buttonSpacing, d.frontNeckDepth + shirt.yokeDepth);
  const pocketX = Math.max(2, d.chestWidthHalf - shirt.pocketWidth - 2);
  const ventY = Math.max(m.armholeDepth + 2, m.length - shirt.sideVentDepth);
  return `<g data-garment-detail="woven-shirt" color="rgba(0,0,0,0.52)">` +
    `<line x1="${round(shirt.frontOverlap)}" y1="${round(firstY - shirt.standHeight)}" ` +
      `x2="${round(shirt.frontOverlap)}" y2="${round(ventY)}" stroke="currentColor" ` +
      `stroke-width="${round(Math.max(0.5, shirt.placketWidth / 3))}" data-edge="option-placketWidth"/>` +
    `<line x1="${round(-d.chestWidthHalf)}" y1="${round(pocketY)}" x2="${round(d.chestWidthHalf)}" ` +
      `y2="${round(pocketY)}" stroke="currentColor" stroke-dasharray="2 2" ` +
      `data-edge="option-yokeDepth"/>` +
    `<rect x="${round(pocketX)}" y="${round(pocketY)}" width="${round(shirt.pocketWidth)}" ` +
      `height="${round(shirt.pocketHeight)}" fill="none" stroke="currentColor" ` +
      `data-edge="option-pocketWidth"/>` +
    `<path d="M ${round(d.chestWidthHalf)} ${round(ventY)} V ${round(m.length)}" fill="none" ` +
      `stroke="currentColor" stroke-dasharray="2 2" data-edge="option-sideVentDepth"/>` +
    buttons + `</g>`;
}

/** The assembled view: front and back silhouettes side by side, in fabric
 *  colour. `hasSleeve` (Slice 60) — pass `false` for a sleeveless garment
 *  (a tank); the silhouette stops at the armhole instead of drawing a short
 *  sleeve regardless of what `m.sleeveLength` happens to hold.
 *  `frontNeckline`/`backNeckline` (Slice 61) — the garment's real declared
 *  neckline shapes (`recipe.frontNeckline`/`backNeckline`); default to crew,
 *  matching what an unspecified garment actually drafts.
 *  `strapWidth` (Slice 66) — a sleeveless garment's finished strap span from
 *  neckline edge to armhole start; undefined keeps the sleeved shoulder point, byte-
 *  identical to every render before this slice. */
export function renderGarment(
  m: Measurements, fabric: string, hasSleeve = true,
  frontNeckline: NecklineParams = NECKLINE_DEFAULT, backNeckline: NecklineParams = NECKLINE_DEFAULT,
  strapWidth?: number, polo?: PoloVisual, shirt?: WovenShirtVisual
): string {
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
    renderOne(m, "front", fabric, frontCx, top, "FRONT", hasSleeve, frontNeckline, strapWidth, polo, shirt) +
    renderOne(m, "back", fabric, backCx, top, "BACK", hasSleeve, backNeckline, strapWidth, polo, shirt) +
    `</svg>`;
}
