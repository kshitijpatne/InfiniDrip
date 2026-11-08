// The assembled garment view: a clean, schematic front/back silhouette of the
// finished t-shirt, drawn from the same measurements that drive the pattern.
// It is a preview of how the pieces read as a garment — not a drape simulation.

import { Measurements, derive, necklineEdge, NecklineParams, NECKLINE_DEFAULT } from "../drafting";
import { BLUEPRINT as T } from "./theme";
import { armholePathCommand, necklinePathCommand } from "./neckline-path";
import { sleevelessArmhole } from "../drafting/armhole";
import type { ResolvedDart } from "../drafting/dart";
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
  readonly buttonCount?: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
  readonly collarProfile?: "pointed" | "band";
  readonly standFrontRise?: number;
  readonly collarPointExtension?: number;
  readonly sideVentDepth?: number;
  readonly backHemDrop?: number;
}

/** Finished woven-shirt details used only by the assembled schematic. */
type WovenShirtVisualCommon = {
  readonly neckWidthHalf: number;
  readonly frontNeckDepth: number;
  readonly backNeckDepth: number;
  readonly buttonCount: number;
  readonly buttonSpacing: number;
  readonly frontOverlap: number;
  readonly placketWidth: number;
  readonly yokeDepth: number;
  readonly pocketWidth: number;
  readonly pocketHeight: number;
  readonly sleeveBandDepth: number;
  readonly sideVentDepth: number;
  readonly hemTurn: number;
  readonly bodyWidths?: {
    readonly chestHalf: number;
    readonly waistHalf: number;
    readonly hipHalf: number;
  };
  readonly hipStationY?: number;
  /** W08 pattern-derived side-dart geometry for the assembled front schematic. */
  readonly bustDart?: ResolvedDart;
};

export type WovenShirtVisual = WovenShirtVisualCommon & (
  | { readonly collarProfile?: "pointed"; readonly standHeight: number; readonly collarLeafDepth: number; readonly campCollarDepth?: never; readonly bandCollarHeight?: never }
  | { readonly collarProfile: "camp"; readonly campCollarDepth?: number; readonly standHeight?: never; readonly collarLeafDepth?: never; readonly bandCollarHeight?: never }
  | { readonly collarProfile: "band"; readonly bandCollarHeight: number; readonly standHeight?: never; readonly collarLeafDepth?: never; readonly campCollarDepth?: never }
);

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
  strapWidth?: number, polo?: PoloVisual, shirt?: WovenShirtVisual
): string {
  const d = derive(m);
  const half = shirt?.bodyWidths?.chestHalf ?? d.chestWidthHalf; // half the body width
  const sh = d.shoulderHalf;            // shoulder point
  const slope = d.shoulderSlope;
  const ad = m.armholeDepth;
  const len = m.length;
  const waistHalf = shirt?.bodyWidths?.waistHalf ?? (m.waist + m.ease) / 4;
  const hipHalf = shirt?.bodyWidths?.hipHalf ?? (m.hip + m.ease) / 4;
  const waistY = ad + (len - ad) * 0.35;
  const hipY = shirt?.hipStationY ?? waistY + m.hipDepth;
  const ventTop = len - (shirt?.sideVentDepth ?? 0);
  const poloVentDepth = polo?.sideVentDepth ?? 0;
  const poloHemY = len + (position === "back" ? polo?.backHemDrop ?? 0 : 0);
  const neckWidthHalf = shirt?.neckWidthHalf ?? d.neckWidthHalf;
  const baseDepth = shirt
    ? (position === "front" ? shirt.frontNeckDepth : shirt.backNeckDepth)
    : (position === "front" ? d.frontNeckDepth : d.backNeckDepth);
  const { cNeck, hps, edges: neckEdges } =
    necklineEdge(position, neckWidthHalf, baseDepth, sh, ad, neckline);
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
    shirt
      ? `L ${round(waistHalf)} ${round(waistY)} L ${round(hipHalf)} ${round(hipY)} ` +
        `L ${round(hipHalf)} ${round(ventTop)} L ${round(hipHalf)} ${round(len)} ` +
        `C ${round(hipHalf * 0.66)} ${round(len + shirt.hemTurn)} ${round(hipHalf * 0.33)} ${round(len + shirt.hemTurn)} 0 ${round(len)} ` +
        `L ${round(-hipHalf)} ${round(len)} ` +
        `C ${round(-hipHalf * 0.33)} ${round(len + shirt.hemTurn)} ${round(-hipHalf * 0.66)} ${round(len + shirt.hemTurn)} ${round(-hipHalf)} ${round(len)} ` +
        `L ${round(-hipHalf)} ${round(ventTop)} L ${round(-hipHalf)} ${round(hipY)} L ${round(-waistHalf)} ${round(waistY)} L ${round(-half)} ${round(ad)}`
      : polo
        ? poloVentDepth > 0
          ? `L ${round(half)} ${round(len - poloVentDepth)} L ${round(half)} ${round(poloHemY)} ` +
            `L ${round(-half)} ${round(poloHemY)} L ${round(-half)} ${round(len - poloVentDepth)} L ${round(-half)} ${round(ad)}`
          : `L ${round(half)} ${round(poloHemY)} L ${round(-half)} ${round(poloHemY)} L ${round(-half)} ${round(ad)}`
      : `L ${round(half)} ${round(len)} L ${round(-half)} ${round(len)} L ${round(-half)} ${round(ad)}`,
    ...sleeveIn,                                  // left sleeve (if any)
    tankArmhole ? armholePathCommand(tankArmhole, true) : `L ${round(-strapX)} ${round(slope)}`, // mirrored tank armhole
    `L ${round(-nh)} 0`,                          // left neck point
    necklinePathCommand(cNeck, hps, neckEdges),    // the real collar: crew, v, scoop, or N04 square front
    "Z",
  ].join(" ");
}

// Dashed armhole seams (both sides) — where the sleeve meets the body. Only
// meaningful when there IS a sleeve; a sleeveless garment's armhole is a
// single finished (bound) edge, not a seam between two pieces.
function armholeSeams(m: Measurements, chestHalf?: number): string {
  const d = derive(m);
  const underarmHalf = chestHalf ?? d.chestWidthHalf;
  const seam = (x1: number, y1: number, x2: number, y2: number): string =>
    `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="rgba(0,0,0,0.28)" stroke-width="1" stroke-dasharray="3 2" ` +
    `vector-effect="non-scaling-stroke"/>`;
  return seam(d.shoulderHalf, d.shoulderSlope, underarmHalf, m.armholeDepth) +
         seam(-d.shoulderHalf, d.shoulderSlope, -underarmHalf, m.armholeDepth);
}

function renderOne(m: Measurements, position: "front" | "back", fabric: string,
                   cx: number, top: number, label: string, hasSleeve: boolean,
                   neckline: NecklineParams, strapWidth?: number, polo?: PoloVisual,
                   shirt?: WovenShirtVisual, frontNeckline: NecklineParams = neckline,
                   backNeckline: NecklineParams = neckline): string {
  const path = `<path d="${silhouettePath(m, position, hasSleeve, neckline, strapWidth, polo, shirt)}" data-edge="ease" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
  const seams = hasSleeve ? armholeSeams(m, shirt?.bodyWidths?.chestHalf) : "";
  const poloV2 = polo !== undefined && (polo.collarProfile === "band" || polo.standFrontRise !== undefined || polo.collarPointExtension !== undefined || polo.sideVentDepth !== undefined || polo.backHemDrop !== undefined);
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${seams}` +
    (polo && (position === "front" || poloV2) ? poloDetails(m, position, frontNeckline, backNeckline, polo) : "") +
    (shirt ? wovenShirtDetails(m, position, shirt) : "") + `</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" font-family="system-ui, sans-serif" text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** Flat finished details use the same collar contract on both Polo V2 views. */
function poloDetails(m: Measurements, position: "front" | "back", frontNeckline: NecklineParams,
                     backNeckline: NecklineParams, polo: PoloVisual): string {
  const d = derive(m);
  const bodyLength = m.length + (position === "back" ? polo.backHemDrop ?? 0 : 0);
  const detailColor = polo.collarProfile === "band" ? T.line : "rgba(0,0,0,0.5)";
  return `<g color="${detailColor}">${poloDetailsSvg({
    neckWidthHalf: d.neckWidthHalf, frontNeckDepth: d.frontNeckDepth, backNeckDepth: d.backNeckDepth,
    shoulderHalf: d.shoulderHalf, armholeDepth: m.armholeDepth,
    neckline: position === "front" ? frontNeckline : backNeckline,
    frontNeckline, backNeckline, position, bodyHalf: d.chestWidthHalf,
    baseLength: m.length, bodyLength, ...polo,
  })}</g>`;
}

function wovenShirtDetails(m: Measurements, position: "front" | "back", shirt: WovenShirtVisual): string {
  const d = derive(m);
  const campCollar = shirt.collarProfile === "camp";
  const bandCollar = shirt.collarProfile === "band";
  const standHeight = campCollar || bandCollar ? 0 : shirt.standHeight;
  const campCollarDepth = campCollar && typeof shirt.campCollarDepth === "number" && Number.isFinite(shirt.campCollarDepth)
    ? shirt.campCollarDepth
    : null;
  const bandCollarHeight = bandCollar && "bandCollarHeight" in shirt && Number.isFinite(shirt.bandCollarHeight)
    ? shirt.bandCollarHeight : null;
  const count = Number.isFinite(shirt.buttonCount)
    ? Math.max(0, Math.min(20, Math.round(shirt.buttonCount)))
    : 0;
  const neckDepth = position === "front" ? shirt.frontNeckDepth : shirt.backNeckDepth;
  const firstY = Math.max(5, neckDepth + (bandCollar ? bandCollarHeight ?? 0 : standHeight));
  const buttons = Array.from({ length: count }, (_, i) =>
    `<circle cx="${round(shirt.frontOverlap)}" cy="${round(firstY + i * shirt.buttonSpacing)}" r="0.45" fill="none" stroke="currentColor" data-edge="woven-button"/>`
  ).join("");
  const buttonCountCue = count > 0
    ? `<line x1="${round(shirt.frontOverlap - 1.2)}" y1="${round(firstY)}" x2="${round(shirt.frontOverlap - 1.2)}" y2="${round(firstY + Math.max(0, count - 1) * shirt.buttonSpacing)}" stroke="currentColor" data-edge="option-buttonCount"/>`
    : "";
  const buttonSpacingCue = count > 1
    ? `<line x1="${round(shirt.frontOverlap + 1.2)}" y1="${round(firstY)}" x2="${round(shirt.frontOverlap + 1.2)}" y2="${round(firstY + shirt.buttonSpacing)}" stroke="currentColor" data-edge="option-buttonSpacing"/>`
    : "";
  const pocketY = Math.max(firstY + shirt.buttonSpacing, neckDepth + shirt.yokeDepth);
  const pocketX = Math.max(2, d.chestWidthHalf - shirt.pocketWidth - 2);
  const ventY = Math.max(m.armholeDepth + 2, m.length - shirt.sideVentDepth);
  const stand = campCollar || bandCollar ? "" :
    `<path d="M ${round(-shirt.neckWidthHalf)} 0 Q 0 ${round(standHeight)} ${round(shirt.neckWidthHalf)} 0" ` +
    `fill="none" stroke="currentColor" data-edge="option-standHeight"/>`;
  const neckEase = campCollar ? "" :
    `<path d="M ${round(-shirt.neckWidthHalf)} 0 Q 0 ${round(standHeight + 0.8)} ${round(shirt.neckWidthHalf)} 0" ` +
    `fill="none" stroke="currentColor" stroke-dasharray="1 1" data-edge="option-neckEase"/>`;
  const collar = bandCollar
    ? bandCollarHeight === null ? ""
      : `<path d="M ${round(-shirt.neckWidthHalf)} 0 Q 0 ${round(neckDepth + bandCollarHeight)} ${round(shirt.neckWidthHalf)} 0" ` +
        `fill="none" stroke="currentColor" data-edge="option-bandCollarHeight"/>`
    : campCollar
    ? campCollarDepth === null ? ""
      : position === "front"
        ? `<path d="M ${round(-shirt.neckWidthHalf)} 0 L ${round(-(shirt.neckWidthHalf + campCollarDepth * 0.3))} ${round(neckDepth + campCollarDepth)} ` +
          `L -0.4 ${round(neckDepth + campCollarDepth * 0.35)} M ${round(shirt.neckWidthHalf)} 0 ` +
          `L ${round(shirt.neckWidthHalf + campCollarDepth * 0.3)} ${round(neckDepth + campCollarDepth)} L 0.4 ${round(neckDepth + campCollarDepth * 0.35)}" ` +
          `fill="none" stroke="currentColor" data-edge="option-campCollarDepth"/>`
        : `<path d="M ${round(-shirt.neckWidthHalf)} 0 Q 0 ${round(campCollarDepth * 0.3)} ${round(shirt.neckWidthHalf)} 0" ` +
          `fill="none" stroke="currentColor" data-edge="option-campCollarDepth"/>`
    : `<path d="M ${round(-shirt.neckWidthHalf)} 0 L ${round(-shirt.neckWidthHalf - shirt.collarLeafDepth * 0.35)} ${round(neckDepth + shirt.collarLeafDepth)} ` +
      `L 0 ${round(neckDepth + shirt.collarLeafDepth * 0.35)} L ${round(shirt.neckWidthHalf + shirt.collarLeafDepth * 0.35)} ${round(neckDepth + shirt.collarLeafDepth)} ` +
      `L ${round(shirt.neckWidthHalf)} 0" fill="none" stroke="currentColor" data-edge="option-collarLeafDepth"/>`;
  const yoke = position === "back"
    ? `<line x1="${round(-d.chestWidthHalf)}" y1="${round(shirt.yokeDepth)}" x2="${round(d.chestWidthHalf)}" ` +
      `y2="${round(shirt.yokeDepth)}" stroke="currentColor" stroke-dasharray="2 2" data-edge="option-yokeDepth"/>`
    : "";
  const front = position === "front"
    ? `<line x1="${round(shirt.frontOverlap)}" y1="${round(firstY - standHeight)}" ` +
      `x2="${round(shirt.frontOverlap)}" y2="${round(ventY)}" stroke="currentColor" ` +
      `stroke-width="${round(Math.max(0.5, shirt.placketWidth / 3))}" data-edge="option-placketWidth"/>` +
      `<line x1="0" y1="${round(firstY - standHeight)}" x2="${round(shirt.frontOverlap)}" y2="${round(firstY - standHeight)}" stroke="currentColor" data-edge="option-frontOverlap"/>` +
      `<rect x="${round(pocketX)}" y="${round(pocketY)}" width="${round(shirt.pocketWidth)}" ` +
      `height="${round(shirt.pocketHeight)}" fill="none" stroke="currentColor" data-edge="option-pocketWidth"/>` +
      `<line x1="${round(pocketX + shirt.pocketWidth)}" y1="${round(pocketY)}" x2="${round(pocketX + shirt.pocketWidth)}" y2="${round(pocketY + shirt.pocketHeight)}" stroke="currentColor" data-edge="option-pocketHeight"/>` + buttons + buttonCountCue + buttonSpacingCue
    : "";
  const sleeveBandY = m.shoulderWidth / 2 + m.armholeDepth * 0.3 + m.bicep * 0.4 - shirt.sleeveBandDepth;
  const sleeveBand = `<line x1="${round(d.shoulderHalf + m.sleeveLength - 2)}" y1="${round(sleeveBandY)}" ` +
    `x2="${round(d.shoulderHalf + m.sleeveLength)}" y2="${round(sleeveBandY)}" stroke="currentColor" ` +
    `data-edge="option-sleeveBandDepth"/>`;
  const vent = `<line x1="${round(d.chestWidthHalf)}" y1="${round(ventY)}" x2="${round(d.chestWidthHalf)}" y2="${round(m.length)}" ` +
    `stroke="currentColor" stroke-dasharray="2 2" data-edge="option-sideVentDepth"/>`;
  const hemTurn = `<line x1="${round(-d.chestWidthHalf)}" y1="${round(m.length)}" x2="${round(d.chestWidthHalf)}" y2="${round(m.length)}" stroke="currentColor" stroke-dasharray="1 1" data-edge="option-hemTurn"/>`;
  const bustDart = position === "front" && shirt.bustDart
    ? wovenBustDartDetails(shirt.bustDart)
    : "";
  return `<g data-garment-detail="woven-shirt" data-position="${position}" color="rgba(0,0,0,0.52)">` +
    stand + neckEase + collar + yoke + front + bustDart + sleeveBand + vent + hemTurn + `</g>`;
}

function wovenBustDartDetails(dart: ResolvedDart): string {
  const sides = [
    { label: "right", sign: 1 },
    { label: "left", sign: -1 },
  ] as const;
  const legs = sides.flatMap((side) => [
    { label: "upper", mouth: dart.mouth[0] },
    { label: "lower", mouth: dart.mouth[1] },
  ].map((leg) =>
    `<path d="M ${round(side.sign * leg.mouth.x)} ${round(leg.mouth.y)} ` +
    `L ${round(side.sign * dart.apex.x)} ${round(dart.apex.y)}" fill="none" stroke="currentColor" ` +
    `stroke-width="0.65" vector-effect="non-scaling-stroke" data-edge="option-bustDartLeg" ` +
    `data-dart-side="${side.label}" data-dart-leg="${leg.label}"/>`
  )).join("");
  return `<g data-garment-detail="woven-shirt-bust-dart" data-dart-count="mirrored-pair">` +
    `<title>Mirrored side bust darts, positioned from the W08 digital pattern</title>${legs}</g>`;
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
  const height = top + m.length + (polo?.backHemDrop ?? 0) + margin;

  return `<svg viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    renderOne(m, "front", fabric, frontCx, top, "FRONT", hasSleeve, frontNeckline, strapWidth, polo, shirt, frontNeckline, backNeckline) +
    renderOne(m, "back", fabric, backCx, top, "BACK", hasSleeve, backNeckline, strapWidth, polo, shirt, frontNeckline, backNeckline) +
    `</svg>`;
}
