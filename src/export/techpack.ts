// Legacy tech-pack draft writer retained for export byte-identity compatibility.
// It rides the SAME PDF spine as the tiled export (assemblePdf / pt), but
// composes a multi-page document rather than print-at-home tiles:
//
//   Page 1  Flat sketch   — the real drafted front/back/sleeve outlines (sample
//                           size), scaled to fit, each piece labelled. (Callout
//                           leaders to the POM points arrive in slice 23-b.)
//   Page 2  Spec          — the graded POM table (one column per size), the same
//                           self-measuring spec sheet the Spec view shows.
//   Page 3  BOM + build   — the recipe's bill of materials and construction stubs.
//   Page 4  Fit Record    — the SAME POMs as page 2, but only the base/sample
//                           size, with blank ruled space next to each for a real,
//                           sewn measurement (slice 45). The checker verifies
//                           sewability, never fit — this page is how fit gets
//                           verified: print it, sew the sample size, measure the
//                           finished garment, write the numbers in by hand.
//
// The sketch is drawn at the BASE (sample) size; the table grades across the whole
// run. It is deliberately NOT wired to the per-size export picker — a tech pack is
// a whole-style document, not one size's cutting file. Page 4 uses that same base
// size on purpose: it's the exact block sampleSpec() (drafting/fit-compare.ts)
// reads, so the sketch, the table, and the Fit Record can never quietly disagree
// about what "predicted" means.
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
  sampleSpec,
  PredictedPom,
  StretchFabric,
  GarmentOptions,
} from "../drafting";
import { flattenPiece, layoutPieces, polylineBounds } from "./layout";
import { assemblePdf, pt, PAGE_A4, PageSize } from "./pdf";
import type { ArtworkPlacement } from "../surface/placement";
import { effectiveSize, placementError } from "../surface/placement";
import { surfacePlaceable } from "../surface/store";

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

// ── Legacy page 1: all-piece pattern overview ────────────────────────────────

function sketchStream(
  block: Block,
  poms: readonly Pom[],
  label: string,
  page: PageSize,
  compactLabels = false
): string {
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
  for (const [pieceIndex, piece] of layout.pieces.entries()) {
    const pts = piece.sew;
    const head = `${mx(pts[0].x)} ${my(pts[0].y)} m`;
    const rest = pts.slice(1).map((p) => `${mx(p.x)} ${my(p.y)} l`).join(" ");
    lines.push(`${head} ${rest} h S`);
    const b = polylineBounds(piece.sew);
    const labelText = piece.name.toUpperCase();
    // The sketch already carries the recipe title. Drop its repeated prefix
    // only for this compact trouser sketch so narrow component labels stay
    // legible; the full role names remain in the cutting/A0 outputs.
    const displayLabel = compactLabels
      ? labelText.replace(/^TROUSER /, "")
        .replace(/^POCKET BAG LEFT$/, "BAG L")
        .replace(/^POCKET BAG RIGHT$/, "BAG R")
      : labelText;
    const labelSize = compactLabels
      ? Math.max(3.2, Math.min(8, pt(Math.max(b.width * s - 0.4, 0.8)) / (displayLabel.length * 0.52)))
      : 8;
    const labelX = compactLabels
      ? leftCm + (b.minX + b.width / 2) * s - displayLabel.length * labelSize * 0.25 / pt(1)
      : leftCm + b.minX * s;
    const labelY = topCm + (b.minY + b.height) * s + 0.6 +
      (compactLabels && pieceIndex >= 4 ? (pieceIndex - 4) * 0.8 : 0);
    lines.push(text(labelX, labelY, labelSize, displayLabel, page));
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

// ── Readable pattern-piece overview (additive digital remediation) ───────────

/**
 * Lay out independent fit-to-cell pattern-piece illustrations for the current
 * UI export. These are reference illustrations only: pieces are individually
 * scaled, are not a finished-garment technical flat, and must never be cut
 * from this page. The old sketchStream remains byte-compatible for the
 * protected legacy export contract.
 */
function overviewSketchStreams(block: Block, label: string, page: PageSize): string[] {
  const pieces = blockPieces(block).map((piece) => ({
    name: piece.name.toUpperCase(),
    outline: flattenPiece(piece, NO_ALLOWANCE).sew,
  }));
  const columns = 2;
  const rows = 2;
  const perPage = columns * rows;
  const pageCount = Math.max(1, Math.ceil(pieces.length / perPage));
  const gap = 0.55;
  const gridTop = M + 2.65;
  const gridBottom = page.height - M;
  const cellW = (page.width - 2 * M - gap) / columns;
  const cellH = (gridBottom - gridTop - gap) / rows;
  const pages: string[] = [];

  for (let sheet = 0; sheet < pageCount; sheet++) {
    const first = sheet * perPage;
    const current = pieces.slice(first, first + perPage);
    const lines: string[] = [
      text(M, M + 1, 13, `${label} - Pattern Piece Overview (${sheet + 1}/${pageCount})`, page),
      text(M, M + 1.8, 8, "Each piece is fitted independently. NOT TO SCALE - never cut from this overview.", page),
      text(M, M + 2.25, 8, "POM names and size values are listed on the Measurement Spec page.", page),
    ];

    current.forEach((piece, localIndex) => {
      const slot = localIndex;
      const column = slot % columns;
      const row = Math.floor(slot / columns);
      const cellX = M + column * (cellW + gap);
      const cellY = gridTop + row * (cellH + gap);
      const xPt = pt(cellX);
      const yPt = pt(page.height - cellY - cellH);
      lines.push(`0.6 w ${xPt} ${yPt} ${pt(cellW)} ${pt(cellH)} re S`);
      lines.push(text(cellX + 0.3, cellY + 0.55, 8, `${String(first + slot + 1).padStart(2, "0")} - ${piece.name}`, page));

      const bounds = polylineBounds(piece.outline);
      const drawingLeft = cellX + 0.4;
      const drawingRight = cellX + cellW - 0.4;
      const drawingTop = cellY + 1.0;
      const drawingBottom = cellY + cellH - 0.4;
      const scale = Math.min(
        (drawingRight - drawingLeft) / bounds.width,
        (drawingBottom - drawingTop) / bounds.height,
      );
      const left = drawingLeft + ((drawingRight - drawingLeft) - bounds.width * scale) / 2;
      const top = drawingTop + ((drawingBottom - drawingTop) - bounds.height * scale) / 2;
      const mx = (x: number): number => pt(left + (x - bounds.minX) * scale);
      const my = (y: number): number => pt(page.height - (top + (y - bounds.minY) * scale));
      const head = `${mx(piece.outline[0].x)} ${my(piece.outline[0].y)} m`;
      const rest = piece.outline.slice(1).map((point) => `${mx(point.x)} ${my(point.y)} l`).join(" ");
      lines.push(`0.6 w ${head} ${rest} h S`);
    });
    pages.push(lines.join("\n"));
  }
  return pages;
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

/** Wrap text at word boundaries using a conservative Helvetica width estimate. */
function wrapPackText(value: string, maxWidthCm: number, fontSize: number): string[] {
  const maxChars = Math.max(1, Math.floor((maxWidthCm * pt(1)) / (fontSize * 0.55)));
  const words = value.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) result.push(current);
      current = "";
      for (let offset = 0; offset < word.length; offset += maxChars) {
        result.push(word.slice(offset, offset + maxChars));
      }
    } else if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      result.push(current);
      current = word;
    }
  }
  if (current) result.push(current);
  return result.length ? result : [""];
}

/** Readable, wrapping BOM/construction pages for the additive current export. */
function bomStreamsV2(tp: GarmentRecipe["techPack"], label: string, page: PageSize): string[] {
  const c1 = M;
  const c2 = M + 6.5;
  const c3 = page.width - M - 2.5;
  const colX = [c1, c2, c3];
  const colW = [c2 - c1 - 0.35, c3 - c2 - 0.35, page.width - M - c3 - 0.35];
  const fontSize = 9;
  const lineHeight = 0.48;
  const bottom = page.height - M;
  const pages: string[] = [];
  let lines: string[] = [];
  let y = 0;

  const startMaterials = (continued: boolean): void => {
    lines = [text(M, M + 1, 13, `Bill of Materials${continued ? " (continued)" : ""}`, page)];
    y = M + 2.4;
    lines.push(
      text(c1, y, fontSize, "Material", page),
      text(c2, y, fontSize, "Placement", page),
      text(c3, y, fontSize, "Qty", page),
    );
    y += 0.5;
    lines.push(rule(y, page));
    y += 0.6;
  };
  const startConstruction = (continued: boolean): void => {
    lines = [text(M, M + 1, 13, `${label} - Construction${continued ? " (continued)" : ""}`, page)];
    y = M + 2.2;
  };
  const nextMaterialsPage = (): void => {
    pages.push(lines.join("\n"));
    startMaterials(true);
  };
  const nextConstructionPage = (): void => {
    pages.push(lines.join("\n"));
    startConstruction(true);
  };

  startMaterials(false);
  for (const row of tp.bom) {
    const cells = [row.material, row.placement, row.qty].map((value, index) =>
      wrapPackText(value, colW[index], fontSize)
    );
    const rowLines = Math.max(...cells.map((cell) => cell.length));
    for (let line = 0; line < rowLines; line++) {
      if (y + lineHeight > bottom) nextMaterialsPage();
      cells.forEach((cell, index) => {
        if (cell[line]) lines.push(text(colX[index], y, fontSize, cell[line], page));
      });
      y += lineHeight;
    }
    y += 0.14;
  }

  if (y + 1.25 > bottom) nextConstructionPage();
  lines.push(text(M, y + 0.35, 13, "Construction", page));
  y += 1.25;
  const constructionWidth = page.width - 2 * M - 1.2;
  tp.construction.forEach((step, index) => {
    const wrapped = wrapPackText(step, constructionWidth, fontSize);
    wrapped.forEach((line, lineIndex) => {
      if (y + lineHeight > bottom) nextConstructionPage();
      const prefix = lineIndex === 0 ? `${index + 1}. ` : "   ";
      lines.push(text(M, y, fontSize, `${prefix}${line}`, page));
      y += lineHeight;
    });
    y += 0.14;
  });
  pages.push(lines.join("\n"));
  return pages;
}

// ── Page 4: the Fit Record ────────────────────────────────────────────────────

// A print-and-write sheet, not an interactive PDF form — this writer emits
// plain ASCII text streams (see the module comment on `pdfString`), so there
// are no AcroForm fields to fill on screen. Blank space + a short rule is the
// "field": the same honest constraint the rest of this writer already lives
// under, just applied to a page whose whole job is to be written on by hand.
function fitRecordStream(predicted: readonly PredictedPom[], label: string, page: PageSize): string {
  const labelW = 7.5; // cm — matches tableStream's column, same table reads twice
  const tolW = 2.0;
  const predW = 2.4;
  const actualX = M + labelW + tolW + predW;
  const actualW = 3.2;
  const passX = actualX + actualW + 0.6;

  const lines: string[] = [
    text(M, M + 1, 13, `${label} - Fit Record`, page),
    text(
      M,
      M + 1.9,
      8,
      "Sew the sample size, measure the finished garment, write the actual value in cm.",
      page
    ),
  ];

  // A blank-fill header: fabric / who sewed it / when. Free text, ruled to write
  // on. Three EQUAL columns across the actual printable width (page.width, not a
  // hardcoded cm offset) — a fixed offset here is exactly the bug the sketch's
  // scale-to-fit logic above already avoids, and it broke on first render: the
  // Date column ran off the page, and Sewn-by's rule struck through Date's label.
  let y = M + 3.0;
  const colW = (page.width - 2 * M) / 3;
  const meta: [string, number, number][] = [["Fabric", 0, 1.6], ["Sewn by", 1, 1.9], ["Date", 2, 1.3]];
  for (const [fieldLabel, col, labelW2] of meta) {
    const x = M + col * colW;
    lines.push(text(x, y, 9, `${fieldLabel}:`, page));
    const ruleY = pt(page.height - y + 0.15);
    lines.push(`0 0 0 RG 0.4 w ${pt(x + labelW2)} ${ruleY} m ${pt(x + colW - 0.4)} ${ruleY} l S`);
  }
  y += 1.0;
  lines.push(rule(y, page));
  y += 0.6;

  lines.push(text(M, y, 9, "Point of measure", page));
  lines.push(text(M + labelW, y, 9, "Tol +/-", page));
  lines.push(text(M + labelW + tolW, y, 9, "Predicted", page));
  lines.push(text(actualX, y, 9, "Actual", page));
  lines.push(text(passX, y, 9, "Pass?", page));
  y += 0.5;
  lines.push(rule(y, page));
  y += 0.65;

  for (const p of predicted) {
    lines.push(text(M, y, 9, p.label, page));
    lines.push(text(M + labelW, y, 9, p.tolerance === undefined ? "-" : p.tolerance.toFixed(1), page));
    lines.push(text(M + labelW + tolW, y, 9, `${p.value.toFixed(1)} cm`, page));
    // Actual + Pass?: blank ruled space, not a computed value — nothing here is
    // invented, matching the tolerance column's own "don't guess" rule.
    const ruleY = pt(page.height - y + 0.15);
    lines.push(`0 0 0 RG 0.4 w ${pt(actualX)} ${ruleY} m ${pt(actualX + actualW)} ${ruleY} l S`);
    lines.push(`0 0 0 RG 0.4 w ${pt(passX)} ${ruleY} m ${pt(passX + 1.6)} ${ruleY} l S`);
    y += 0.7;
  }
  return lines.join("\n");
}

// ── Page 5 (opt-in): artwork placement specification ──────────────────────────

// Present only when the style carries artwork. Coordinates are artwork-space
// centimetres (the same frame as the print sheet); piece association is by
// role name, with no invented on-piece anchor. Invalid entries are listed with
// their error so the handoff never hides a correction.
function surfaceSpecStreams(
  surface: readonly ArtworkPlacement[],
  styleLabel: string,
  page: PageSize
): string[] {
  const rows = surface.map((p, index) => {
    const error = placementError(p);
    const raw = p as unknown as Record<string, unknown>;
    const dims = surfacePlaceable(p)
      ? (() => { const s = effectiveSize(p); return `${s.widthCm.toFixed(1)} x ${s.heightCm.toFixed(1)} cm`; })()
      : `${String(raw.widthCm)} x ${String(raw.heightCm)} cm`;
    const t = p.transform as unknown as { dx: unknown; dy: unknown; scale: unknown; rotationDeg: unknown } | null;
    const pose = t !== null && typeof t === "object" && !Array.isArray(t)
      ? `at (${String(t.dx)}, ${String(t.dy)}) scale ${String(t.scale)} rot ${String(t.rotationDeg)} deg`
      : "unmeasurable pose";
    const source = typeof p.sourceName === "string" && p.sourceName !== "" ? ` - ${p.sourceName}` : "";
    return `#${index + 1} ${String(p.id)} (${String(p.kind)}) - piece ${String(p.pieceRole)} - ` +
      `${dims} ${pose} stack ${String(p.zOrder)}${source}` + (error ? ` INVALID: ${error}` : "");
  });
  const perPage = Math.max(1, Math.floor((page.height - M - 1.5 - 3.5) / 0.62));
  const pages: string[] = [];
  for (let start = 0; start < rows.length; start += perPage) {
    const lines: string[] = [
      text(M, M + 1, 13, `Artwork placement - ${styleLabel}`, page),
      text(M, M + 2.2, 9, "True scale artwork space. Shared across graded sizes.", page),
    ];
    let y = M + 3.5;
    for (const row of rows.slice(start, start + perPage)) {
      lines.push(text(M, y, 9, row, page));
      y += 0.62;
    }
    pages.push(lines.join("\n"));
  }
  return pages;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Export the garment as the unchanged legacy four-page draft PDF: pattern-piece
 * overview (sample size),
 * graded POM spec table, the recipe's BOM + construction stubs, and a Fit
 * Record page to validate the sample size against a real sewn garment.
 * A fifth artwork-placement section is appended only when the style carries
 * artwork; an empty set leaves the four-page document byte-identical.
 */
export function exportTechPack(
  recipe: GarmentRecipe,
  m: Measurements,
  page: PageSize = PAGE_A4,
  fabric?: StretchFabric,
  options: GarmentOptions = {},
  surface: readonly ArtworkPlacement[] = [],
  styleLabel = ""
): string {
  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft, options);
  const rows = specSheet(graded, recipe.poms);
  const sizes = graded.map((g) => g.label);
  return assemblePdf(
    [
      sketchStream(recipe.draft(m, options), recipe.poms, recipe.label, page, recipe.name === "trouser"),
      tableStream(sizes, rows, page),
      bomStream(
        fabric && recipe.techPackForFabric
          ? recipe.techPackForFabric(fabric)
          : recipe.techPackForOptions
            ? recipe.techPackForOptions(options)
            : recipe.techPack,
        page
      ),
      fitRecordStream(sampleSpec(recipe, m, options), recipe.label, page),
      ...surfaceSpecStreams(surface, styleLabel, page),
    ],
    page
  );
}

/**
 * Current readable draft-pack export. Its pattern overview paginates at four
 * independently scaled pieces per page, removing cross-piece label collisions
 * and long POM leaders. `exportTechPack` remains available as the unchanged
 * legacy byte-identity fixture; the UI uses this additive readable route.
 */
export function exportTechPackV2(
  recipe: GarmentRecipe,
  m: Measurements,
  page: PageSize = PAGE_A4,
  fabric?: StretchFabric,
  options: GarmentOptions = {},
  surface: readonly ArtworkPlacement[] = [],
  styleLabel = ""
): string {
  const block = recipe.draft(m, options);
  const graded = gradeRun(m, recipe.grade, recipe.sizes, recipe.draft, options);
  const rows = specSheet(graded, recipe.poms);
  const sizes = graded.map((g) => g.label);
  return assemblePdf(
    [
      ...overviewSketchStreams(block, recipe.label, page),
      tableStream(sizes, rows, page),
      ...bomStreamsV2(
        fabric && recipe.techPackForFabric
          ? recipe.techPackForFabric(fabric)
          : recipe.techPackForOptions
            ? recipe.techPackForOptions(options)
            : recipe.techPack,
        recipe.label,
        page,
      ),
      fitRecordStream(sampleSpec(recipe, m, options), recipe.label, page),
      ...surfaceSpecStreams(surface, styleLabel, page),
    ],
    page
  );
}
