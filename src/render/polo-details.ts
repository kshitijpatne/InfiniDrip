// Shared flat Polo collar/stand/placket schematic used by the Body and
// assembled views. The stand follows the neckline and the collar leaf sits
// outside it instead of appearing as a bar across the neck.

import { NecklineParams, necklineEdge } from "../drafting";
import { necklinePathCommand } from "./neckline-path";

const round = (n: number): number => Math.round(n * 1000) / 1000;

export interface PoloDetailValues {
  readonly neckWidthHalf: number;
  readonly frontNeckDepth: number;
  readonly shoulderHalf: number;
  readonly armholeDepth: number;
  readonly neckline: NecklineParams;
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
}

export function poloDetailsSvg(values: PoloDetailValues): string {
  const { cNeck, hps, edge } = necklineEdge(
    "front", values.neckWidthHalf, values.frontNeckDepth,
    values.shoulderHalf, values.armholeDepth, values.neckline);
  const nh = hps.x;
  const stand = values.standHeight;
  const leaf = values.collarLeafDepth;
  const half = values.placketWidth / 2;
  const innerNeck = `M ${round(-nh)} 0 ${necklinePathCommand(cNeck, hps, edge)}`;
  const standPath = `${innerNeck} L ${round(nh)} ${round(-stand)} L ${round(-nh)} ${round(-stand)} Z`;
  const collarLeft = `M ${round(-nh)} ${round(-stand)} L ${round(-nh - leaf)} ${round(-stand - leaf * 0.35)} ` +
    `L -2 ${round(-stand - leaf)} L 0 ${round(-stand - leaf * 0.55)} Z`;
  const collarRight = `M ${round(nh)} ${round(-stand)} L ${round(nh + leaf)} ${round(-stand - leaf * 0.35)} ` +
    `L 2 ${round(-stand - leaf)} L 0 ${round(-stand - leaf * 0.55)} Z`;
  const buttons = [3.5, 7, 10.5].map((offset) =>
    `<circle cx="0" cy="${round(cNeck.y + offset)}" r="0.35" fill="none" stroke="currentColor" stroke-width="0.2"/>`).join("");
  return `<g data-edge="option-standHeight"><path d="${standPath}" fill="none" stroke="currentColor" stroke-width="0.7"/></g>` +
    `<g data-edge="option-collarLeafDepth"><path d="${collarLeft} ${collarRight}" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round"/></g>` +
    `<g data-edge="option-placketLength"><rect x="${round(-half)}" y="${round(cNeck.y)}" width="${round(values.placketWidth)}" ` +
      `height="${round(values.placketLength)}" fill="none" stroke="currentColor" stroke-width="0.7"/>${buttons}</g>` +
    `<g data-edge="option-placketWidth"><line x1="${round(-half)}" y1="${round(cNeck.y + values.placketLength + 2)}" ` +
      `x2="${round(half)}" y2="${round(cNeck.y + values.placketLength + 2)}" stroke="currentColor" stroke-width="0.7"/></g>`;
}
