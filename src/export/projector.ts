// The projector file — one seamless, layered SVG for projecting straight onto
// fabric. Projector sewing exists to escape print-and-tape, so this writer is
// the opposite of the tiled PDF: NO page breaks, one continuous cm-true canvas.
//
// LOCKED spec:
//   - one continuous canvas, never tiled
//   - each graded size on its own toggleable layer (reusing the size-run geometry)
//   - bold, high-contrast, projector-legible lines and labels
//   - cut-on-fold pieces unfolded to full width (single-layer fabric has no fold)
//   - the 10 cm calibration square in every file
//
// Layers use the Inkscape layer convention (`inkscape:groupmode="layer"`), which
// projector tools and SVG editors expose as a toggle list; each layer also has a
// stable `id="size-<LABEL>"` so any tool can address it. All sizes of a piece
// share one slot, anchored at the slot's top-centre, so they nest like the
// size-run view's tree rings and a toggled size lands exactly where the last was.

import { Measurements, GarmentRecipe, GarmentOptions, gradeRun, rolePiece, Piece } from "../drafting";
import { flattenPiece, polylineBounds, Polyline } from "./layout";
import { resolveNotch, resolveGrainline, notchSvg, grainlineSvg } from "../render/notch";
import { unfoldFlat, FOLD_EPS } from "./unfold";
import { calibrationSvg, CALIBRATION_CM } from "./calibration";
import { patternMarksSvg } from "../render/pattern-mark";
import { unfoldPatternMarks } from "./pattern-mark";
import type { AllowanceSpec } from "../drafting/allowance";

export interface ProjectorDraft {
  readonly label: string;
  readonly step: number;
  readonly block: ReturnType<GarmentRecipe["draft"]>;
  readonly allowances?: AllowanceSpec;
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

const CUT = "#000000";
const SEW = "#555555";
const CUT_W = 0.2; // cm — a bold ~2 mm line, legible at projection distance
const SEW_W = 0.12;
const MARGIN = 5; // cm — generous white space, per the locked spec
const GAP = 6; // cm between piece slots
const NOTCH_LEN = 1.2; // cm — projector-legible tick
const LABEL_SIZE = 2.5; // cm
const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);

/**
 * Stable, unique layer ids assigned in run order. A safe label keeps its
 * legacy `size-<label>` id; anything else falls back to its 1-based run
 * position. Any id already taken (a duplicate safe label, or a fallback that
 * collides with a safe label such as "1") gains a numeric suffix, so user
 * size labels can never produce duplicate or unstable layer ids.
 */
function sizeLayerIds(labels: readonly string[]): string[] {
  const used = new Set<string>();
  return labels.map((label, index) => {
    const base = /^[A-Za-z0-9_-]+$/.test(label) ? label : String(index + 1);
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    return candidate;
  });
}

/** Wrap a visible SVG text line to a character width, splitting long tokens too. */
function wrapProjectorText(value: string, maxChars: number): string[] {
  const limit = Math.max(1, Math.floor(maxChars));
  const lines: string[] = [];
  let line = "";
  for (const sourceWord of value.trim().split(/\s+/u).filter(Boolean)) {
    let word = sourceWord;
    while (word.length > limit) {
      if (line) { lines.push(line); line = ""; }
      lines.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= limit) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Points as an SVG "x,y x,y ..." list. */
function pointList(pts: Polyline): string {
  return pts.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

const translate = (pts: Polyline, dx: number, dy: number): Polyline =>
  pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));

/** One size of one piece, drawn into its slot: outlines, notches, grain, label. */
function pieceMarkup(
  recipe: GarmentRecipe,
  piece: Piece,
  step: number,
  sizeLabel: string,
  slotCenterX: number,
  slotTop: number,
  allowances = recipe.allowances,
): string {
  const flat = unfoldFlat(flattenPiece(piece, allowances), piece.onFold);
  const b = polylineBounds(flat.cut);
  const dx = slotCenterX - (b.minX + b.width / 2);
  const dy = slotTop - b.minY;

  const cut = `<polygon points="${pointList(translate(flat.cut, dx, dy))}" fill="none" ` +
    `stroke="${CUT}" stroke-width="${CUT_W}"/>`;
  const sew = `<polygon points="${pointList(translate(flat.sew, dx, dy))}" fill="none" ` +
    `stroke="${SEW}" stroke-width="${SEW_W}" stroke-dasharray="1 0.6"/>`;
  const constructionMarks = patternMarksSvg(
    piece.onFold ? unfoldPatternMarks(piece.marks) : piece.marks,
    { stroke: SEW, width: SEW_W, pointSize: 0.35, labelSize: 1.4 }, dx, dy
  );

  const table = recipe.notches.find((r) => r.pieceName === piece.name);
  let marks = "";
  if (table) {
    for (const rule of table.notches) {
      const n = resolveNotch(piece, rule);
      const moved = { point: { x: n.point.x + dx, y: n.point.y + dy }, normal: n.normal };
      marks += notchSvg(moved, NOTCH_LEN, CUT, CUT_W);
      // An unfolded piece needs the mirror-half notch too (unless it sits ON the fold).
      if (piece.onFold && Math.abs(n.point.x) > FOLD_EPS) {
        const mirroredNotch = {
          point: { x: -n.point.x + dx, y: n.point.y + dy },
          normal: { x: -n.normal.x, y: n.normal.y },
        };
        marks += notchSvg(mirroredNotch, NOTCH_LEN, CUT, CUT_W);
      }
    }
    const gl = resolveGrainline(piece, table.grainline);
    marks += grainlineSvg(
      { top: { x: gl.top.x + dx, y: gl.top.y + dy }, bottom: { x: gl.bottom.x + dx, y: gl.bottom.y + dy } },
      SEW,
      SEW_W,
      0.8
    );
  }

  // Labels stagger by grade step so overlapping size rings stay readable.
  const labelY = b.minY + dy + b.height / 2 + step * (LABEL_SIZE * 1.4);
  const label = `<text x="${round(slotCenterX)}" y="${round(labelY)}" fill="${CUT}" ` +
    `font-size="${LABEL_SIZE}" font-weight="bold" font-family="sans-serif" ` +
    `text-anchor="middle">${escapeXml(sizeLabel)} ${escapeXml(flat.name.toUpperCase())}</text>`;

  return cut + sew + marks + constructionMarks + label;
}

/**
 * The projector export: every graded size of every piece on one continuous
 * cm-true canvas, one toggleable layer per size, calibration square included.
 */
export function exportProjectorSvg(
  recipe: GarmentRecipe,
  m: Measurements,
  options: GarmentOptions = {},
  plannedRun?: readonly ProjectorDraft[],
  pomExceptions: readonly { readonly sizeLabel: string; readonly pomLabel: string; readonly reason: string }[] = [],
): string {
  const run: readonly ProjectorDraft[] = plannedRun ?? gradeRun(m, recipe.grade, recipe.sizes, recipe.draft, options);
  const roles = [...new Set(run.flatMap((size) => Object.keys(size.block.roles)))];

  // Slot per role: wide and tall enough for the largest size's unfolded cut line.
  const slots = roles.map((role) => {
    const boxes = run.flatMap((g) => {
      if (!(role in g.block.roles)) return [];
      const piece = rolePiece(g.block, role);
      return polylineBounds(unfoldFlat(flattenPiece(piece, g.allowances ?? recipe.allowances), piece.onFold).cut);
    });
    return {
      role,
      width: Math.max(...boxes.map((b) => b.width)),
      height: Math.max(...boxes.map((b) => b.height)),
    };
  });

  const headerH = CALIBRATION_CM + 4;
  const slotTop = MARGIN + headerH;
  let cursor = MARGIN;
  const centers = slots.map((s) => {
    const c = cursor + s.width / 2;
    cursor += s.width + GAP;
    return c;
  });
  const width = cursor - GAP + MARGIN;
  const maxSlotH = Math.max(...slots.map((s) => s.height));
  // A visible, legible legend names every not-applicable POM exception below
  // the piece slots (the <desc> metadata stays for machine consumers). Wrapped
  // text rows keep long reasons inside the canvas and away from piece geometry;
  // the canvas grows to contain every visible line.
  const EXCEPTION_TEXT = 1.5; // cm — readable at projection distance
  const EXCEPTION_GAP = 2.2; // cm between legend baselines
  const legendTop = slotTop + maxSlotH + MARGIN + 2;
  const exceptionTextChars = Math.floor((width - 2 * MARGIN) / (EXCEPTION_TEXT * 0.62));
  const exceptionLegendLines = pomExceptions.length === 0 ? [] : [
    ...wrapProjectorText("Excluded measurements (not applicable):", exceptionTextChars)
      .map((line) => ({ line, heading: true })),
    ...pomExceptions.flatMap((entry) => wrapProjectorText(
      `${entry.sizeLabel} — ${entry.pomLabel}: not applicable — ${entry.reason}`,
      exceptionTextChars,
    ).map((line) => ({ line, heading: false }))),
  ];
  const height = slotTop + maxSlotH + MARGIN +
    (exceptionLegendLines.length === 0 ? 0 : 4 + exceptionLegendLines.length * EXCEPTION_GAP);

  // Largest size drawn first so smaller rings sit on top when layers overlap.
  // Ids are assigned in run order (not draw order) so they stay stable.
  const layerIds = sizeLayerIds(run.map((g) => g.label));
  const layers = run.map((g, index) => ({ g, index }))
    .sort((a, b) => b.g.step - a.g.step)
    .map(({ g, index }) => {
      const pieces = slots
        .filter((s) => s.role in g.block.roles)
        .map((s) => {
          const slotIndex = slots.indexOf(s);
          return pieceMarkup(recipe, rolePiece(g.block, s.role), g.step, g.label, centers[slotIndex]!, slotTop, g.allowances ?? recipe.allowances);
        })
        .join("");
      return `<g id="size-${layerIds[index]}" inkscape:groupmode="layer" ` +
        `inkscape:label="Size ${escapeXml(g.label)}">${pieces}</g>`;
    })
    .join("");

  const header = `<g id="calibration">` +
    calibrationSvg(MARGIN, MARGIN, CUT, 0.1) +
    `<text x="${MARGIN + CALIBRATION_CM + 3}" y="${MARGIN + 4}" fill="${CUT}" ` +
    `font-size="1.8" font-family="sans-serif">Calibrate first: this square must ` +
    `measure exactly 10 cm on the fabric.</text>` +
    `<text x="${MARGIN + CALIBRATION_CM + 3}" y="${MARGIN + 7.5}" fill="${SEW}" ` +
    `font-size="1.5" font-family="sans-serif">${recipe.label} — one layer per size; ` +
    `project a single size at a time.</text></g>`;

  const exceptionDescription = pomExceptions.length === 0 ? "" :
    `<desc>${pomExceptions.map((entry) => `${entry.sizeLabel} - ${entry.pomLabel}: not applicable - ${entry.reason}`)
      .join("; ").replace(/[&<>"']/g, (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!)}</desc>`;
  const exceptionLegend = exceptionLegendLines.length === 0 ? "" :
    `<g id="pom-exceptions">` + exceptionLegendLines.map(({ line, heading }, index) =>
      `<text x="${MARGIN}" y="${round(legendTop + index * EXCEPTION_GAP)}" fill="${CUT}" ` +
      `font-size="${EXCEPTION_TEXT}"${heading ? ' font-weight="bold"' : ""} font-family="sans-serif">` +
      `${escapeXml(line)}</text>`).join("") + `</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${round(width)}cm" height="${round(height)}cm" ` +
    `viewBox="0 0 ${round(width)} ${round(height)}">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="#ffffff"/>` +
    exceptionDescription + header + layers + exceptionLegend + `</svg>`;
}
