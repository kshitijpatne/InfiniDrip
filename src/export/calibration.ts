// The calibration square — the scale anchor every real-world file embeds.
//
// LOCKED spec: a 10 cm × 10 cm square labelled "10 cm". The user measures this
// square on the projection (or the print) before cutting; if it isn't exactly
// 10 cm, the file is being scaled somewhere and every piece would be silently
// wrong. It is the one mark that turns "looks right" into "is right", so both
// writers embed it and the tests measure it with a real parser.

import { pt } from "./pdf";

export const CALIBRATION_CM = 10;
export const CALIBRATION_LABEL = "10 cm";

/** The square as SVG. Coordinates in cm; the caller's viewBox is 1 unit = 1 cm,
 *  so the rect's width/height ARE its physical size — that is what the test measures. */
export function calibrationSvg(
  x: number,
  y: number,
  stroke: string,
  strokeWidth: number
): string {
  const s = CALIBRATION_CM;
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" ` +
    `stroke="${stroke}" stroke-width="${strokeWidth}"/>` +
    `<text x="${x + s / 2}" y="${y + s / 2 + 0.6}" fill="${stroke}" font-size="1.6" ` +
    `font-family="sans-serif" text-anchor="middle">${CALIBRATION_LABEL}</text>`;
}

/** The square as PDF content ops. (x, y) is the top-left corner in cm measured
 *  from the sheet's top-left; PDF's y-axis runs up, so the rect is re-anchored
 *  at its bottom-left in points. */
export function calibrationPdfOps(x: number, y: number, pageHeightCm: number): string {
  const s = pt(CALIBRATION_CM);
  const px = pt(x);
  const py = pt(pageHeightCm - y) - s;
  return [
    `0 0 0 RG 1 w ${px} ${py} ${s} ${s} re S`,
    `BT /F1 10 Tf ${px + s / 2 - 12} ${py + s / 2 - 4} Td (${CALIBRATION_LABEL}) Tj ET`,
  ].join("\n");
}
