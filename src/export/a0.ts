// The A0 copyshop file — a large-format page when the whole layout fits, or a
// small multi-page A0 set when an opted-in long garment cannot fit one sheet.
// Pieces stay whole and true-scale in both cases; this is still not a tiled
// home-printer export.
//
// Print shops run A0 plotters; a maker uploads this A0 set and gets each whole
// pattern piece full-size, with no taping. Same true-scale geometry as every
// other export, print-oriented styling: solid cut lines, dashed sew lines,
// piece labels, notches, grainlines — and pieces that are cut on a fabric fold
// KEEP their fold here (folded fabric is how a copyshop pattern is used) with
// the fold edge marked unmistakably. The 10 cm calibration square is embedded
// so the print can be verified before any cloth is cut.
//
// Pieces are shelf-packed to the page width (the same width-aware pack the
// nesting estimator uses) when the recipe fits one page. An opted-in overflow
// recipe gets one whole piece per A0 page when its long layout cannot fit.
// Geometry is NEVER scaled to fit — true scale is the point.

import { Piece, AllowanceSpec, PatternMark } from "../drafting";
import { Point } from "../geometry";
import { PieceNotches } from "../drafting/tshirt-notches";
import { flattenPiece, polylineBounds, FlatPiece } from "./layout";
import { nestPieces } from "./nesting";
import { pt, assemblePdf, polylinePath, PageSize } from "./pdf";
import { resolveNotch, resolveGrainline } from "../render/notch";
import { calibrationPdfOps, CALIBRATION_CM } from "./calibration";
import { FOLD_EPS } from "./unfold";
import { patternMarksPdfOps, translatePatternMarks } from "./pattern-mark";

export const PAGE_A0: PageSize = { width: 84.1, height: 118.9 };
/** Landscape A0, for layouts that run wide instead of tall. */
export const PAGE_A0_LANDSCAPE: PageSize = { width: 118.9, height: 84.1 };

const NOTCH_LEN = 1; // cm
const GAP = 3; // cm between pieces
const MARGIN = 2; // cm sheet margin
// A long leg is 118 cm at the selected trouser size. The ISO A0 long side is
// 118.9 cm, so the overflow path uses a deliberately small but real edge
// margin after rotating the page layout. The normal one-page path remains
// byte-identical for existing garments.
const OVERFLOW_MARGIN = 0.4;

/** One line segment as PDF ops, flipped into the page's up-axis. */
function lineOps(x1: number, y1: number, x2: number, y2: number, ph: number): string {
  return `${pt(x1)} ${pt(ph - y1)} m ${pt(x2)} ${pt(ph - y2)} l S`;
}

interface A0Transform {
  readonly rotate: boolean;
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

/** Choose a whole-piece orientation for the overflow A0 path. */
function pageTransform(flat: FlatPiece, page: PageSize): A0Transform {
  const bounds = polylineBounds(flat.cut);
  const usableWidth = page.width - OVERFLOW_MARGIN * 2;
  const usableHeight = page.height - OVERFLOW_MARGIN * 2;
  const fitsNormal = bounds.width <= usableWidth && bounds.height <= usableHeight;
  const fitsRotated = bounds.height <= usableWidth && bounds.width <= usableHeight;
  if (!fitsNormal && !fitsRotated) {
    throw new Error(`${flat.name} cannot fit on an A0 sheet at true scale`);
  }
  return {
    rotate: !fitsNormal,
    minX: bounds.minX,
    minY: bounds.minY,
    width: bounds.width,
    height: bounds.height,
  };
}

/** Translate a flattened point into the selected A0 page, rotating the layout
 *  90 degrees only when the page orientation needs it. */
function transformPoint(p: Point, transform: A0Transform): Point {
  const x = p.x - transform.minX;
  const y = p.y - transform.minY;
  return transform.rotate
    ? { x: OVERFLOW_MARGIN + transform.height - y, y: OVERFLOW_MARGIN + x }
    : { x: OVERFLOW_MARGIN + x, y: OVERFLOW_MARGIN + y };
}

function transformVector(v: Point, rotate: boolean): Point {
  return rotate ? { x: -v.y, y: v.x } : v;
}

function transformPolyline(points: readonly Point[], transform: A0Transform): Point[] {
  return points.map((p) => transformPoint(p, transform));
}

function transformMarks(marks: readonly PatternMark[] | undefined, transform: A0Transform): PatternMark[] {
  return (marks ?? []).map((mark) => "start" in mark
    ? {
        ...mark,
        start: transformPoint(mark.start, transform),
        end: transformPoint(mark.end, transform),
      }
    : { ...mark, at: transformPoint(mark.at, transform) });
}

/** One whole-piece page for an A0 overflow export. */
function overflowPieceStream(
  original: Piece,
  flat: FlatPiece,
  notches: readonly PieceNotches[],
  page: PageSize
): string {
  const transform = pageTransform(flat, page);
  const cut = transformPolyline(flat.cut, transform);
  const sew = transformPolyline(flat.sew, transform);
  const bounds = polylineBounds(cut);
  const lines: string[] = ["0 0 0 RG 1 w", `${polylinePath(cut, page.height)} S`];
  lines.push("0.5 0.5 0.5 RG 0.5 w [3 2] 0 d", `${polylinePath(sew, page.height)} S`, "[] 0 d");
  lines.push("0 0 0 RG 0.5 w", patternMarksPdfOps(transformMarks(original.marks, transform), page.height));

  const cx = bounds.minX + bounds.width / 2;
  const cy = bounds.minY + bounds.height / 2;
  lines.push(
    `BT /F1 14 Tf ${Math.max(pt(OVERFLOW_MARGIN), pt(cx) - original.name.length * 4)} ${pt(page.height - cy)} Td ` +
      `(${original.name.toUpperCase()}) Tj ET`
  );

  const table = notches.find((r) => r.pieceName === original.name);
  if (table) {
    lines.push("1 w");
    for (const rule of table.notches) {
      const notch = resolveNotch(original, rule);
      const p = transformPoint(notch.point, transform);
      const normal = transformVector(notch.normal, transform.rotate);
      lines.push(lineOps(p.x, p.y, p.x - normal.x * NOTCH_LEN, p.y - normal.y * NOTCH_LEN, page.height));
    }
    const grainline = resolveGrainline(original, table.grainline);
    const top = transformPoint(grainline.top, transform);
    const bottom = transformPoint(grainline.bottom, transform);
    const gcx = (top.x + bottom.x) / 2;
    lines.push("0.5 w");
    lines.push(lineOps(top.x, top.y, bottom.x, bottom.y, page.height));
    lines.push(lineOps(gcx - 0.8, top.y + 0.8, gcx, top.y, page.height));
    lines.push(lineOps(gcx, top.y, gcx + 0.8, top.y + 0.8, page.height));
    lines.push(lineOps(gcx - 0.8, bottom.y - 0.8, gcx, bottom.y, page.height));
    lines.push(lineOps(gcx, bottom.y, gcx + 0.8, bottom.y - 0.8, page.height));
  }

  if (original.onFold) {
    const foldPoints = transformPolyline(flat.sew, transform)
      .filter((_, index) => Math.abs(flat.sew[index].x) <= FOLD_EPS);
    const foldXs = foldPoints.map((p) => p.x);
    const foldYs = foldPoints.map((p) => p.y);
    const foldX = Math.min(...foldXs);
    const foldXEnd = Math.max(...foldXs);
    const foldY = Math.min(...foldYs);
    const foldYEnd = Math.max(...foldYs);
    const horizontal = foldXEnd - foldX >= foldYEnd - foldY;
    lines.push("0 0 0 RG 1.2 w [8 3 1 3] 0 d");
    lines.push(horizontal
      ? lineOps(foldX, foldY, foldXEnd, foldY, page.height)
      : lineOps(foldX, foldY, foldX, foldYEnd, page.height));
    lines.push("[] 0 d");
    lines.push(
      `BT /F1 9 Tf ${horizontal ? "1 0 0 1" : "0 1 -1 0"} ${pt(foldX) + 12} ${pt(page.height - foldYEnd) + 20} Tm ` +
        `(PLACE ON FOLD) Tj ET`
    );
  }
  lines.push(calibrationPdfOps(
    page.width - OVERFLOW_MARGIN - CALIBRATION_CM,
    page.height - OVERFLOW_MARGIN - CALIBRATION_CM,
    page.height
  ));
  return lines.join("\n");
}

/** A whole-piece A0 set for a layout that cannot fit on one sheet. */
function overflowA0Pdf(
  pieces: readonly Piece[],
  flats: readonly FlatPiece[],
  notches: readonly PieceNotches[],
  page: PageSize
): string {
  const outputPage: PageSize = {
    width: Math.max(page.width, page.height),
    height: Math.min(page.width, page.height),
  };
  const streams = pieces.map((piece, index) =>
    overflowPieceStream(piece, flats[index], notches, outputPage)
  );
  return assemblePdf(streams, outputPage);
}

/**
 * The A0 export. Pieces are shelf-packed at true scale when the whole layout
 * fits one sheet. If a long layout exceeds one sheet, the export becomes a
 * multi-page A0 set with one whole piece per page; geometry is never scaled or
 * silently clipped.
 */
export function exportA0Pdf(
  pieces: readonly Piece[],
  allowance: AllowanceSpec,
  notches: readonly PieceNotches[] = [],
  page: PageSize = PAGE_A0,
  allowOverflow = false
): string {
  const flats = pieces.map((p) => flattenPiece(p, allowance));
  const nest = nestPieces(flats, page.width, GAP, MARGIN);
  if (allowOverflow && (!nest.fits || nest.fabricLength > page.height - MARGIN)) {
    return overflowA0Pdf(pieces, flats, notches, page);
  }
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

    lines.push("0 0 0 RG 0.5 w");
    lines.push(patternMarksPdfOps(translatePatternMarks(original.marks, dx, dy), ph));

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
