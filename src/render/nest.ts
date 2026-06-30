// The nest — a graded size run drawn as "tree rings."
//
// For each piece type (front/back/sleeve) we overlay every size's outline in one
// shared frame. All pieces are anchored at their (0,0) fold-top corner, so the
// sizes fan out from that corner like growth rings — smaller sizes sit inside
// larger ones. Colour ramps cool→warm with size; the base size is drawn bold.
//
// Pure string in / string out, like the rest of render — no browser needed.

import { GradedSize } from "../drafting";
import { pieceToPath, pieceBounds } from "./shape";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;

const MARGIN = 6;
const GAP = 8;
const TOP = 12;
const LEGEND_H = 8;

const PIECE_TYPES = ["front", "back", "sleeve"] as const;

/** A cool→warm ramp across the size index, so size reads as colour. */
function sizeColor(i: number, n: number): string {
  const t = n <= 1 ? 0 : i / (n - 1);
  const lerp = (a: number, b: number): number => Math.round(a + (b - a) * t);
  // small = cool blue (90,165,235) → large = theme amber (232,178,58)
  return `rgb(${lerp(90, 232)},${lerp(165, 178)},${lerp(235, 58)})`;
}

/** Render a graded size run as overlaid tree-ring outlines, one column per piece. */
export function renderNest(graded: readonly GradedSize[]): string {
  let cursor = MARGIN;
  let maxH = 0;

  const columns = PIECE_TYPES.map((type) => {
    const pieces = graded.map((g) => g.block[type]);
    // Column box = the largest extent any size reaches from the (0,0) corner.
    const box = pieces.reduce(
      (acc, p) => {
        const b = pieceBounds(p);
        return { w: Math.max(acc.w, b.minX + b.width), h: Math.max(acc.h, b.minY + b.height) };
      },
      { w: 0, h: 0 }
    );
    const x = cursor;
    cursor += box.w + GAP;
    maxH = Math.max(maxH, box.h);

    // Draw largest first so smaller rings stay visible on top.
    const rings = graded
      .map((g, i) => ({ g, i }))
      .reverse()
      .map(({ g, i }) => {
        const base = g.step === 0;
        return `<path d="${pieceToPath(g.block[type])}" fill="none" ` +
          `stroke="${sizeColor(i, graded.length)}" stroke-width="${base ? 2.2 : 1.2}" ` +
          `stroke-linejoin="round" vector-effect="non-scaling-stroke"` +
          `${base ? "" : ` opacity="0.8"`}/>`;
      })
      .join("");

    const title = `<text x="${round(x + box.w / 2)}" y="${round(TOP - 4)}" fill="${T.label}" ` +
      `font-size="3" font-family="system-ui,sans-serif" text-anchor="middle">${type.toUpperCase()}</text>`;
    return title + `<g transform="translate(${round(x)} ${round(TOP)})">${rings}</g>`;
  });

  const width = cursor - GAP + MARGIN;
  const height = TOP + maxH + MARGIN + LEGEND_H;

  const legend = graded
    .map((g, i) => {
      const lx = MARGIN + i * 16;
      const ly = height - 4;
      return `<rect x="${round(lx)}" y="${round(ly - 3)}" width="3" height="3" ` +
        `fill="${sizeColor(i, graded.length)}"/>` +
        `<text x="${round(lx + 4.5)}" y="${round(ly - 0.3)}" fill="${T.line}" font-size="2.6" ` +
        `font-family="system-ui,sans-serif">${g.label}${g.step === 0 ? " (base)" : ""}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    columns.join("") + legend + `</svg>`;
}
