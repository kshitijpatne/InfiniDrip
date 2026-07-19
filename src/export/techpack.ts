// The tech-pack document — the pattern packaged as one PDF a maker could hand to
// a factory. It rides the SAME PDF spine as the tiled export (assemblePdf / pt),
// but composes a *document* instead of print-at-home tiles:
//
//   Page 1  Flat sketch   — the real drafted front/back/sleeve outlines (sample
//                           size), scaled to fit, each piece labelled. (Callout
//                           leaders to the POM points arrive in slice 23-b.)
//   Page 2  Spec          — the graded POM table (one column per size), the same
//                           self-measuring spec sheet the Spec view shows.
//   Page 3  BOM + build   — the recipe's bill of materials and construction stubs.
//
// The sketch is drawn at the BASE (sample) size; the table grades across the whole
// run. It is deliberately NOT wired to the per-size export picker — a tech pack is
// a whole-style document, not one size's cutting file.
//
// Like the tiled writer, every byte is printable ASCII (no binary streams), so it
// opens in any reader — which is why `pdfString` forces text to a safe ASCII set
// and escapes the PDF string metacharacters ( ) and \.

import {
  GarmentRecipe,
  Measurements,
  Block,
  Pom,
  SpecRow,
  gradeRun,
  specSheet,
  blockPieces,
  NO_ALLOWANCE,
} from "../drafting";
import { flattenPiece, layoutPieces, polylineBounds } from "./layout";
import { assemblePdf, pt, PAGE_A4, PageSize } from "./pdf";

const M = 1.5; // cm page margin, all four sides

// ── PDF text helpers ──────────────────────────────────────────────────────────

/**
 * Make a string safe inside a PDF `(...)` literal: escape the metacharacters
 * `\ ( )`, fold the typographic dashes / times sign we actually use down to
 * ASCII, and replace anything else outside printable ASCII with `?`.
 */
export function pdfString(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch === "\\" || ch === "(" || ch === ")") out += "\\" + ch;
    else if (ch === "–" || ch === "—") out += "-"; // en / em dash
    else if (ch === "×") out += "x"; // multiplication sign
    else {
      const code = ch.charCodeAt(0);
      out += code < 32 || code > 126 ? "?" : ch;
    }
  }
  return out;
}

/** One line of left-set text at (xCm, yCm-from-top), in pt, PDF coords. */
function text(xCm: number, yTopCm: number, size: number, str: string, page: PageSize): string {
  return `BT /F1 ${size} Tf ${pt(xCm)} ${pt(page.height - yTopCm)} Td (${pdfString(str)}) Tj ET`;
}

/** A horizontal rule from the left margin to the right margin at yCm-from-top. */
function rule(yTopCm: number, page: PageSize): string {
  const y = pt(page.height - yTopCm);
  return `0 0 0 RG 0.4 w ${pt(M)} ${y} m ${pt(page.width - M)} ${y} l S`;
}

// ── Page 1: the flat sketch ───────────────────────────────────────────────────

function sketchStream(block: Block, poms: readonly Pom[], label: string, page: PageSize): string {
  const flats = blockPieces(block).map((p) => flattenPiece(p, NO_ALLOWANCE));
  const layout = layoutPieces(flats);

  const titleH = 2.2;
  const gutter = 5.5; // left column reserved for callout labels
  const printW = page.width - 2 * M - gutter;
  const printH = page.height - 2 * M - titleH;
  const s = Math.min(printW / layout.width, printH / layout.height); // fit, keep aspect
  const leftCm = M + gutter + (printW - layout.width * s) / 2; // centre in the sketch area
  const topCm = M + titleH;
  const mx = (x: number): number => pt(leftCm + x * s);
  const my = (y: number): number => pt(page.height - (topCm + y * s));

  const lines: string[] = [text(M, M + 1, 13, `${label} - Tech Pack`, page), "0 0 0 RG 0.6 w"];
  for (const piece of layout.pieces) {
    const pts = piece.sew;
    const head = `${mx(pts[0].x)} ${my(pts[0].y)} m`;
    const rest = pts.slice(1).map((p) => `${mx(p.x)} ${my(p.y)} l`).join(" ");
    lines.push(`${head} ${rest} h S`);
    const b = polylineBounds(piece.sew);
    lines.push(text(leftCm + b.minX * s, topCm + (b.minY + b.height) * s + 0.6, 8, piece.name.toUpperCase(), page));
  }

  // Callout leaders: the front is drawn as pieces[0], translated by the layout;
  // recover that translation, then point each anchored POM's label at its point.
  const dx = layout.pieces[0].sew[0].x - flats[0].sew[0].x;
  const dy = layout.pieces[0].sew[0].y - flats[0].sew[0].y;
  const anchored = poms.filter((p) => p.anchor);
  const step = printH / (anchored.length + 1);
  anchored.forEach((pom, i) => {
    const a = pom.anchor!(block); // front-piece coords
    const ax = mx(a.x + dx);
    const ay = my(a.y + dy);
    const labelY = topCm + step * (i + 1);
    lines.push(`0.4 0.4 0.4 RG 0.4 w ${pt(M + gutter - 0.3)} ${pt(page.height - labelY)} m ${ax} ${ay} l S`);
    lines.push(`0 0 0 rg ${ax} ${ay} ${pt(0.2)} ${pt(0.2)} re f`); // a dot at the point
    lines.push(text(M, labelY - 0.15, 7, pom.label, page));
  });
  return lines.join("\n");
}

// ── Page 2: the graded spec table ─────────────────────────────────────────────

function tableStream(sizes: readonly string[], rows: readonly SpecRow[], page: PageSize): string {
  const labelW = 7.5; // cm reserved for the POM label column
  const tolW = 2.0; // cm reserved for the tolerance column
  const colW = (page.width - 2 * M - labelW - tolW) / sizes.length;
  const tolX = M + labelW;
  const colX = (i: number): number => M + labelW + tolW + i * colW;

  const lines: string[] = [text(M, M + 1, 13, "Measurement Spec (cm)", page)];
  let y = M + 2.4;
  lines.push(text(tolX, y, 9, "Tol +/-", page));
  sizes.forEach((sz, i) => lines.push(text(colX(i), y, 9, sz, page)));
  y += 0.5;
  lines.push(rule(y, page));
  y += 0.6;
  for (const row of rows) {
    lines.push(text(M, y, 9, row.label, page));
    lines.push(text(tolX, y, 9, row.tolerance === undefined ? "-" : row.tolerance.toFixed(1), page));
    row.values.forEach((v, i) => lines.push(text(colX(i), y, 9, v.toFixed(1), page)));
    y += 0.62;
  }
  return lines.join("\n");
}

// ── Page 3: BOM + construction ────────────────────────────────────────────────

function bomStream(tp: GarmentRecipe["techPack"], page: PageSize): string {
  const c1 = M;
  const c2 = M + 6.5;
  const c3 = page.width - M - 2.5;

  const lines: string[] = [text(M, M + 1, 13, "Bill of Materials", page)];
  let y = M + 2.4;
  lines.push(text(c1, y, 9, "Material", page), text(c2, y, 9, "Placement", page), text(c3, y, 9, "Qty", page));
  y += 0.5;
  lines.push(rule(y, page));
  y += 0.6;
  for (const r of tp.bom) {
    lines.push(text(c1, y, 9, r.material, page), text(c2, y, 9, r.placement, page), text(c3, y, 9, r.qty, page));
    y += 0.62;
  }
  y += 1.4;
  lines.push(text(M, y, 13, "Construction", page));
  y += 1.2;
  tp.construction.forEach((step, i) => {
    lines.push(text(M, y, 9, `${i + 1}. ${step}`, page));
    y += 0.62;
  });
  return lines.join("\n");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Export the garment as a three-page tech-pack PDF: flat sketch (sample size),
 * graded POM spec table, and the recipe's BOM + construction stubs.
 */
export function exportTechPack(
  recipe: GarmentRecipe,
  m: Measurements,
  page: PageSize = PAGE_A4
): string {
  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft);
  const rows = specSheet(graded, recipe.poms);
  const sizes = graded.map((g) => g.label);
  return assemblePdf(
    [
      sketchStream(recipe.draft(m), recipe.poms, recipe.label, page),
      tableStream(sizes, rows, page),
      bomStream(recipe.techPack, page),
    ],
    page
  );
}
