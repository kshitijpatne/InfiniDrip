// Tiled PDF export. The pattern is bigger than a home printer page, so we split
// it across tiles that overlap slightly — you tape them together by aligning the
// registration marks (small corner crosses) on adjacent tiles.
//
// PDF is text-based here: we emit PDF-1.4 with only ASCII content operators
// (m/l/S for paths, Tf/Tj for labels). No binary streams, no compression — every
// byte is printable, so it opens in any PDF reader and passes strict validators.
//
// The coordinate system: PDF puts (0,0) at the bottom-left of each page and
// measures in points (1 pt = 1/72 inch = 0.03528 cm). We convert cm → pt once.
//
// Page flow:
//   1. layoutPieces  → one big virtual sheet (in cm)
//   2. tilePlan      → array of tiles; each tile is a (col, row) window into that sheet
//   3. tileToPage    → one PDF page per tile; clip to the tile, draw the pieces that
//                      intersect, then overlay the registration marks + tile label
//   4. exportPdf     → assemble pages into a valid PDF with an xref table

import { Piece } from "../drafting";
import { flattenPiece, layoutPieces, Polyline } from "./layout";

// ── Unit conversion ───────────────────────────────────────────────────────────

const CM_TO_PT = 72 / 2.54; // 1 cm = 28.3465 pt
const pt = (cm: number): number => Math.round(cm * CM_TO_PT * 1000) / 1000;

// ── Page sizes (cm) ───────────────────────────────────────────────────────────

export interface PageSize {
  readonly width: number; // cm
  readonly height: number; // cm
}

export const PAGE_A4: PageSize = { width: 21.0, height: 29.7 };
export const PAGE_LETTER: PageSize = { width: 21.59, height: 27.94 };

// ── Tile plan ─────────────────────────────────────────────────────────────────

export interface Tile {
  readonly col: number;
  readonly row: number;
  readonly x: number; // cm: left edge of the tile's printable area
  readonly y: number; // cm: top edge of the tile's printable area
  readonly w: number; // cm: printable width
  readonly h: number; // cm: printable height
}

/**
 * Split a sheet of `sheetW × sheetH` cm into tiles that fit on `page`, each
 * overlapping the next by `overlap` cm so taped seams align.
 */
export function tilePlan(
  sheetW: number,
  sheetH: number,
  page: PageSize,
  overlap = 1.0
): Tile[] {
  const printW = page.width - 2; // 1 cm margin each side
  const printH = page.height - 2;
  const stepX = printW - overlap;
  const stepY = printH - overlap;
  const cols = Math.ceil(sheetW / stepX);
  const rows = Math.ceil(sheetH / stepY);
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        col: c,
        row: r,
        x: c * stepX,
        y: r * stepY,
        w: printW,
        h: printH,
      });
    }
  }
  return tiles;
}

// ── PDF content stream builders ───────────────────────────────────────────────

/** Polyline as PDF path operators (m then l, in pt, y-flipped for PDF's up-axis).
 *  Exported so tests can exercise the empty-input guard directly. */
export function polylinePath(pts: Polyline, sheetH: number): string {
  if (pts.length === 0) return "";
  const flip = (y: number): number => pt(sheetH - y);
  const head = `${pt(pts[0].x)} ${flip(pts[0].y)} m`;
  const rest = pts
    .slice(1)
    .map((p) => `${pt(p.x)} ${flip(p.y)} l`)
    .join(" ");
  return `${head} ${rest} h`; // h = closepath
}

/** A small registration cross centred at (cx, cy) in pt (already in PDF coords). */
function regCross(cx: number, cy: number, size = 6): string {
  const h = size / 2;
  return [
    `${cx - h} ${cy} m ${cx + h} ${cy} l S`, // horizontal bar
    `${cx} ${cy - h} m ${cx} ${cy + h} l S`, // vertical bar
  ].join(" ");
}

/** One PDF content stream for a tile: clips, draws pieces, adds reg marks + label. */
function tileStream(
  tile: Tile,
  layout: { pieces: readonly { sew: Polyline; cut: Polyline; name: string }[]; height: number },
  totalCols: number,
  totalRows: number
): string {
  const { x: tx, y: ty, w: tw, h: th } = tile;
  const sh = layout.height;

  // ── clip rectangle (the printable tile window, in pt, PDF coords) ──────────
  const clipX = pt(tx);
  const clipY = pt(sh - ty - th);
  const clipW = pt(tw);
  const clipH = pt(th);

  const lines: string[] = [];
  lines.push("q"); // save graphics state
  // clip to tile
  lines.push(`${clipX} ${clipY} ${clipW} ${clipH} re W n`);

  // ── cut lines (solid, 0.5 pt, black) ──────────────────────────────────────
  lines.push("0 0 0 RG 0.5 w");
  for (const p of layout.pieces) {
    const path = polylinePath(p.cut, sh);
    if (path) lines.push(`${path} S`);
  }

  // ── sew lines (dashed, 0.3 pt, grey) ──────────────────────────────────────
  lines.push("0.5 0.5 0.5 RG 0.3 w [2 1.5] 0 d");
  for (const p of layout.pieces) {
    const path = polylinePath(p.sew, sh);
    if (path) lines.push(`${path} S`);
  }
  lines.push("[] 0 d"); // reset dash

  lines.push("Q"); // restore graphics state

  // ── registration marks at tile corners (outside clip, in margin) ───────────
  lines.push("0 0 0 RG 0.4 w");
  const corners = [
    [clipX, clipY],
    [clipX + clipW, clipY],
    [clipX, clipY + clipH],
    [clipX + clipW, clipY + clipH],
  ] as const;
  for (const [cx, cy] of corners) lines.push(regCross(cx, cy));

  // ── tile label (bottom-left, 7 pt Helvetica) ──────────────────────────────
  const label = `Tile ${tile.col + 1}-${tile.row + 1} of ${totalCols}x${totalRows}`;
  lines.push("BT /F1 7 Tf");
  lines.push(`${clipX + 2} ${clipY + 2} Td`);
  lines.push(`(${label}) Tj ET`);

  return lines.join("\n");
}

// ── PDF assembly ──────────────────────────────────────────────────────────────

/**
 * Assemble a valid minimal PDF-1.4 document from an array of content streams,
 * one per page.  Uses only the standard Helvetica font (no embedding needed).
 */
function assemblePdf(streams: string[], page: PageSize): string {
  const W = Math.round(pt(page.width));
  const H = Math.round(pt(page.height));

  // object slots: 1=catalog, 2=pages, 3=font, 4..n=page+content pairs
  // We'll build objects as strings then compute byte offsets for xref.
  const objects: string[] = [];

  const obj = (id: number, body: string): void => {
    objects[id] = `${id} 0 obj\n${body}\nendobj`;
  };

  obj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
  const pageCount = streams.length;
  const pageIds = streams.map((_, i) => 4 + i * 2); // 4,6,8,...
  const contentIds = streams.map((_, i) => 5 + i * 2); // 5,7,9,...

  obj(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")} ] /Count ${pageCount} >>`
  );
  obj(3, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  for (let i = 0; i < streams.length; i++) {
    const pid = pageIds[i];
    const cid = contentIds[i];
    const stream = streams[i];
    const len = stream.length;
    obj(
      pid,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
        `/Contents ${cid} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`
    );
    obj(cid, `<< /Length ${len} >>\nstream\n${stream}\nendstream`);
  }

  // Build the PDF body and xref
  const header = "%PDF-1.4\n";
  const parts: string[] = [header];
  const offsets: number[] = new Array(objects.length).fill(0);

  for (const [idStr, body] of Object.entries(objects)) {
    const id = Number(idStr);
    offsets[id] = parts.reduce((acc, s) => acc + s.length, 0);
    parts.push(body + "\n");
  }

  const xrefOffset = parts.reduce((acc, s) => acc + s.length, 0);
  const totalObjs = objects.length; // highest id + 1

  const xrefEntries = ["0000000000 65535 f \n"];
  for (let id = 1; id < totalObjs; id++) {
    xrefEntries.push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  parts.push(
    `xref\n0 ${totalObjs}\n${xrefEntries.join("")}` +
      `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`
  );

  return parts.join("");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Export the pattern as a tiled, print-at-home PDF.
 * Each page is one tile; adjacent tiles overlap by `overlap` cm so you can tape
 * them together using the registration-mark crosses at each corner.
 */
export function exportPdf(
  pieces: readonly Piece[],
  allowance: number,
  page: PageSize = PAGE_A4,
  overlap = 1.0
): string {
  const layout = layoutPieces(pieces.map((p) => flattenPiece(p, allowance)));
  const tiles = tilePlan(layout.width, layout.height, page, overlap);
  const cols = Math.max(...tiles.map((t) => t.col)) + 1;
  const rows = Math.max(...tiles.map((t) => t.row)) + 1;
  const streams = tiles.map((tile) => tileStream(tile, layout, cols, rows));
  return assemblePdf(streams, page);
}
