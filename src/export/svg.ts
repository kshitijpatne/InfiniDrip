// True-scale SVG export. Unlike the on-screen Blueprint (dark, decorative, fitted
// to the window), this is a *cutting file*: white sheet, black cut lines, faint
// dashed sew lines, sized in real centimetres so it prints and opens at 1:1.

import { Piece } from "../drafting";
import { flattenPiece, layoutPieces, polylineBounds, Polyline, PlacedPiece } from "./layout";
import { resolveNotch, resolveGrainline, notchSvg, grainlineSvg } from "../render/notch";
import { PieceNotches } from "../drafting/tshirt-notches";

const round = (n: number): number => Math.round(n * 1000) / 1000;

const CUT = "#000000";
const SEW = "#888888";
const STROKE = 0.05; // cm (~0.5 mm) — a fine, plotter-friendly line

/** Points as an SVG "x,y x,y ..." list. */
function pointList(pts: Polyline): string {
  return pts.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

function pieceSvg(
  p: PlacedPiece,
  originalPiece: Piece,
  dx: number,
  dy: number,
  notchTable: readonly PieceNotches[]
): string {
  const cut = `&lt;polygon points="${pointList(p.cut)}" fill="none" stroke="${CUT}" ` +
    `stroke-width="${STROKE}"/&gt;`;
  const sew = `&lt;polygon points="${pointList(p.sew)}" fill="none" stroke="${SEW}" ` +
    `stroke-width="${STROKE}" stroke-dasharray="0.3 0.2"/&gt;`;
  const b = polylineBounds(p.cut);
  const label = `&lt;text x="${round(b.minX + b.width / 2)}" y="${round(b.minY + b.height / 2)}" ` +
    `fill="${CUT}" font-size="1" font-family="sans-serif" text-anchor="middle"&gt;` +
    `${p.name.toUpperCase()}&lt;/text&gt;`;

  const recipe = notchTable.find((r) => r.pieceName === originalPiece.name);
  const notches = recipe
    ? recipe.notches.map((rule) => {
        const n = resolveNotch(originalPiece, rule);
        const translated = { point: { x: n.point.x + dx, y: n.point.y + dy }, normal: n.normal };
        return notchSvg(translated, 0.4, CUT, STROKE);
      }).join("")
    : "";
  const grain = recipe
    ? (() => {
        const gl = resolveGrainline(originalPiece, recipe.grainline);
        const translated = {
          top: { x: gl.top.x + dx, y: gl.top.y + dy },
          bottom: { x: gl.bottom.x + dx, y: gl.bottom.y + dy },
        };
        return grainlineSvg(translated, SEW, STROKE, 0.3);
      })()
    : "";

  return cut + sew + notches + grain + label;
}

/** A printable, true-scale SVG of the pieces. Sew on the dashed line, cut on the solid. */
export function exportSvg(
  pieces: readonly Piece[],
  allowance: number,
  notches: readonly PieceNotches[] = []
): string {
  const flats = pieces.map((p) => flattenPiece(p, allowance));
  const layout = layoutPieces(flats);
  const w = round(layout.width);
  const h = round(layout.height);
  const body = layout.pieces.map((placed, i) => {
    const origB = polylineBounds(flats[i].cut);
    const placedB = polylineBounds(placed.cut);
    return pieceSvg(placed, pieces[i], placedB.minX - origB.minX, placedB.minY - origB.minY, notches);
  }).join("");
  return `&lt;svg xmlns="http://www.w3.org/2000/svg" width="${w}cm" height="${h}cm" ` +
    `viewBox="0 0 ${w} ${h}"&gt;` +
    `&lt;rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/&gt;` +
    body + `&lt;/svg&gt;`;
}
