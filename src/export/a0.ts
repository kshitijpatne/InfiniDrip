// The A0 copyshop file — one large-format page, whole pieces, never tiled.
//
// Print shops run A0 plotters; a maker uploads this single-page PDF and gets the
// pattern back full-size, no taping. Same true-scale geometry as every other
// export, print-oriented styling: solid cut lines, dashed sew lines, piece
// labels, notches, grainlines — and pieces that are cut on a fabric fold KEEP
// their fold here (folded fabric is how a copyshop pattern is used) with the
// fold edge marked unmistakably. The 10 cm calibration square is embedded so the
// print can be verified before any cloth is cut.
//
// Pieces are shelf-packed to the page width (the same width-aware pack the
// nesting estimator uses), because a graded size laid in one row can outgrow
// even an A0 sheet. Geometry is NEVER scaled to fit — true scale is the point.

import { Piece, AllowanceSpec } from "../drafting";
import { PieceNotches } from "../drafting/tshirt-notches";
import { flattenPiece, polylineBounds, FlatPiece } from "./layout";
import { nestPieces } from "./nesting";
import { pt, assemblePdf, polylinePath, PageSize } from "./pdf";
import { resolveNotch, resolveGrainline } from "../render/notch";
import { calibrationPdfOps, CALIBRATION_CM } from "./calibration";
import { FOLD_EPS } from "./unfold";

export const PAGE_A0: PageSize = { width: 84.1, height: 118.9 };
/** Landscape A0, for layouts that run wide instead of tall. */
export const PAGE_A0_LANDSCAPE: PageSize = { width: 118.9, height: 84.1 };

const NOTCH_LEN = 1; // cm
const GAP = 3; // cm between pieces
const MARGIN = 2; // cm sheet margin

/** One line segment as PDF ops, flipped into the page's up-axis. */
function lineOps(x1: number, y1: number, x2: number, y2: number, ph: number): string {
  return `${pt(x1)} ${pt(ph - y1)} m ${pt(x2)} ${pt(ph - y2)} l S`;
}

/**
 * The single-page A0 export. Pieces are shelf-packed at true scale; the caller
 * picks the page (portrait by default) — geometry is never scaled to fit.
 */
export function exportA0Pdf(
  pieces: readonly Piece[],
  allowance: AllowanceSpec,
  notches: readonly PieceNotches[] = [],
  page: PageSize = PAGE_A0
): string {
  const flats = pieces.map((p) => flattenPiece(p, allowance));
  const nest = nestPieces(flats, page.width, GAP, MARGIN);
  const ph = page.height;
  const byName = new Map<string, { piece: Piece; flat: FlatPiece }>(
    pieces.map((p, i) => [p.name, { piece: p, flat: flats[i] }])
  );

  const lines: string[] = [];

  // Cut lines: solid, 1 pt, black.
  lines.push("0 0 0 RG 1 w");
  for (const p of nest.placed) lines.push(`${polylinePath(p.cut, ph)} S`);

  // Sew lines: dashed, 0.5 pt, grey.
  lines.push("0.5 0.5 0.5 RG 0.5 w [3 2] 0 d");
  for (const p of nest.placed) lines.push(`${polylinePath(p.sew, ph)} S`);
  lines.push("[] 0 d 0 0 0 RG");

  for (const placed of nest.placed) {
    const { piece: original, flat } = byName.get(placed.name)!;
    const origB = polylineBounds(flat.cut);
    const placedB = polylineBounds(placed.cut);
    const dx = placedB.minX - origB.minX;
    const dy = placedB.minY - origB.minY;

    // Piece label at the cut-line centre.
    const cx = placedB.minX + placedB.width / 2;
    const cy = placedB.minY + placedB.height / 2;
    lines.push(
      `BT /F1 14 Tf ${pt(cx) - placed.name.length * 4} ${pt(ph - cy)} Td ` +
        `(${placed.name.toUpperCase()}) Tj ET`
    );

    // Notches and grainline, re-resolved from the live piece (they never drift).
    const table = notches.find((r) => r.pieceName === original.name);
    if (table) {
      lines.push("1 w");
      for (const rule of table.notches) {
        const n = resolveNotch(original, rule);
        lines.push(lineOps(
          n.point.x + dx, n.point.y + dy,
          n.point.x - n.normal.x * NOTCH_LEN + dx, n.point.y - n.normal.y * NOTCH_LEN + dy,
          ph
        ));
      }
      const gl = resolveGrainline(original, table.grainline);
      const gcx = (gl.top.x + gl.bottom.x) / 2 + dx;
      lines.push("0.5 w");
      lines.push(lineOps(gl.top.x + dx, gl.top.y + dy, gl.bottom.x + dx, gl.bottom.y + dy, ph));
      lines.push(lineOps(gcx - 0.8, gl.top.y + dy + 0.8, gcx, gl.top.y + dy, ph));
      lines.push(lineOps(gcx, gl.top.y + dy, gcx + 0.8, gl.top.y + dy + 0.8, ph));
      lines.push(lineOps(gcx - 0.8, gl.bottom.y + dy - 0.8, gcx, gl.bottom.y + dy, ph));
      lines.push(lineOps(gcx, gl.bottom.y + dy, gcx + 0.8, gl.bottom.y + dy - 0.8, ph));
    }

    // A kept fold, marked unmistakably: dash-dot line down the fold edge + label.
    if (original.onFold) {
      const foldPts = flat.sew
        .map((p, j) => ({ p, placed: placed.sew[j] }))
        .filter(({ p }) => Math.abs(p.x) <= FOLD_EPS)
        .map(({ placed: q }) => q);
      const ys = foldPts.map((q) => q.y);
      const foldX = foldPts[0].x;
      const yTop = Math.min(...ys);
      const yBot = Math.max(...ys);
      lines.push("0 0 0 RG 1.2 w [8 3 1 3] 0 d");
      lines.push(lineOps(foldX, yTop, foldX, yBot, ph));
      lines.push("[] 0 d");
      // Rotated 90° so the label reads along the fold edge.
      lines.push(
        `BT /F1 9 Tf 0 1 -1 0 ${pt(foldX) + 12} ${pt(ph - yBot) + 20} Tm ` +
          `(PLACE ON FOLD) Tj ET`
      );
    }
  }

  // The scale anchor. The shelf pack guarantees two free zones: to the right of
  // the last piece on its shelf, and below the whole nest — prefer the first.
  const last = nest.placed[nest.placed.length - 1];
  const lastB = polylineBounds(last.cut);
  let sqX = lastB.minX + lastB.width + GAP;
  let sqY = lastB.minY;
  if (sqX + CALIBRATION_CM > page.width - MARGIN) {
    sqX = MARGIN;
    sqY = nest.fabricLength + GAP;
  }
  lines.push(calibrationPdfOps(sqX, sqY, ph));

  return assemblePdf([lines.join("\n")], page);
}
