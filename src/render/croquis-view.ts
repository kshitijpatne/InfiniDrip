// Presentation for the user-facing Side Body view. The path itself comes from
// the shared croquis geometry; this wrapper adds only a truthful label and the
// minimum SVG framing needed to display it.

import { Measurements, derive } from "../drafting";
import { BLUEPRINT as T } from "./theme";
import { CroquisRegion, croquisPath } from "./croquis";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const FONT = 'font-family="system-ui, sans-serif"';

interface SideFrame {
  readonly half: number;
  readonly minY: number;
  readonly maxY: number;
}

function sideFrame(m: Measurements, region: CroquisRegion): SideFrame {
  if (region === "upper") {
    const d = derive(m);
    const bodyHalf = Math.max(2, d.chestWidthHalf * 0.22);
    return { half: bodyHalf, minY: -10, maxY: m.length + 6 };
  }
  const waist = (m.waist + m.ease) / 4;
  const hip = (m.hip + m.ease) / 4;
  // The lower side envelope's negative control reaches waist * 0.6; include
  // it in the frame instead of relying on the path's visible endpoint.
  return {
    half: Math.max(2, hip * 0.45, waist * 0.6),
    minY: -10,
    maxY: m.length + 6,
  };
}

/** Render one visible, explicitly schematic Side croquis. There are no
 * measurement dimensions or edge spotlight groups because the current model
 * has no side-specific measurements. */
export function renderSideCroquis(m: Measurements, region: CroquisRegion): string {
  const frame = sideFrame(m, region);
  const marginX = 8;
  const minX = -frame.half - marginX;
  const width = (frame.half + marginX) * 2;
  const height = frame.maxY - frame.minY;
  const path = croquisPath(region, m, "side");
  return `<svg data-croquis-region="${region}" data-croquis-view="side" ` +
    `aria-label="Side schematic croquis" viewBox="${round(minX)} ${round(frame.minY)} ` +
    `${round(width)} ${round(height)}" width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(frame.minY)}" width="${round(width)}" ` +
    `height="${round(height)}" fill="${T.background}"/>` +
    `<text x="0" y="-4" fill="${T.label}" font-size="3" ${FONT} ` +
    `text-anchor="middle">SIDE · SCHEMATIC</text>` +
    `<path data-part="side-silhouette" d="${path}" fill="${T.fill}" stroke="${T.line}" ` +
    `stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
    `</svg>`;
}
