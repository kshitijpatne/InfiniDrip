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
  const outerEdge = edge.kind === "line"
    ? { kind: "line" as const, name: edge.name, start: { x: edge.start.x, y: edge.start.y - stand }, end: { x: edge.end.x, y: edge.end.y - stand } }
    : { kind: "curve" as const, name: edge.name, curve: {
        start: { x: edge.curve.start.x, y: edge.curve.start.y - stand },
        control1: { x: edge.curve.control1.x, y: edge.curve.control1.y - stand },
        control2: { x: edge.curve.control2.x, y: edge.curve.control2.y - stand },
        end: { x: edge.curve.end.x, y: edge.curve.end.y - stand },
      } };
  // The stand is a shallow band that follows the neckline; its outer edge is
  // visibly parallel instead of becoming a rectangle across the neck.
  const outerNeck = necklinePathCommand(
    { x: cNeck.x, y: cNeck.y - stand }, { x: hps.x, y: hps.y - stand }, outerEdge,
  );
  const standPath = `${innerNeck} M ${round(-nh)} ${round(-stand)} ${outerNeck} ` +
    `M ${round(-nh)} 0 L ${round(-nh)} ${round(-stand)} M ${round(nh)} 0 L ${round(nh)} ${round(-stand)}`;
  // Collar leaves sit on the outside of the stand and point down onto the
  // chest, matching the conventional polo silhouette in the references.
  const collarLeft = `M ${round(-nh)} ${round(-stand)} L ${round(-nh - leaf * 0.35)} ${round(leaf * 0.35)} ` +
    `L -2 ${round(leaf)} L 0 ${round(leaf * 0.55)} Z`;
  const collarRight = `M ${round(nh)} ${round(-stand)} L ${round(nh + leaf * 0.35)} ${round(leaf * 0.35)} ` +
    `L 2 ${round(leaf)} L 0 ${round(leaf * 0.55)} Z`;
  const buttons = [3.5, 7, 10.5].map((offset) =>
    `<circle cx="0" cy="${round(cNeck.y + offset)}" r="0.35" fill="none" stroke="currentColor" stroke-width="0.2"/>`).join("");
  return `<g data-edge="option-standHeight"><path d="${standPath}" fill="none" stroke="currentColor" stroke-width="0.7"/></g>` +
    `<g data-edge="option-collarLeafDepth"><path d="${collarLeft} ${collarRight}" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round"/></g>` +
    `<g data-edge="option-placketLength"><rect x="${round(-half)}" y="${round(cNeck.y)}" width="${round(values.placketWidth)}" ` +
      `height="${round(values.placketLength)}" fill="none" stroke="currentColor" stroke-width="0.7"/>${buttons}</g>` +
    `<g data-edge="option-placketWidth"><line x1="${round(-half)}" y1="${round(cNeck.y + values.placketLength + 2)}" ` +
      `x2="${round(half)}" y2="${round(cNeck.y + values.placketLength + 2)}" stroke="currentColor" stroke-width="0.7"/></g>`;
}
