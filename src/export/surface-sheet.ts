// The artwork print sheet — one true-scale SVG for printing artwork placement.
//
// Unlike the cutting files, this sheet carries no pieces: it draws each
// placeable artwork rectangle where the placement math puts it, in
// artwork-space centimetres (1 unit = 1 cm), with the locked 10 cm calibration
// square so a print shop can verify scale before using it. Placements shared
// per style across graded sizes make this a whole-style file: it ignores the
// per-size picker by design. Entries that fail validation are named in the
// header with their error and drawn nowhere, never silently dropped.

import type { ArtworkPlacement } from "../surface/placement";
import { effectiveSize, placementError } from "../surface/placement";
import { artworkCorners, boundingBox } from "../surface/transform";
import { surfacePlaceable } from "../surface/store";
import { escapeAttr, overlayItem, surfaceOverlay } from "../render/surface-overlay";
import { calibrationSvg, CALIBRATION_CM } from "./calibration";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const MARGIN = 5; // cm white space, same generosity as the projector file
const TITLE_SIZE = 2.2; // cm
const LINE_SIZE = 1.4; // cm
const LINE_STEP = 2.5; // cm
const CHAR_W = 0.85; // cm per header character — sheet layout only, never a measurement

const headerLines = (placements: readonly ArtworkPlacement[], styleLabel: string): string[] => {
  const lines = [
    `Artwork print sheet - ${styleLabel}`,
    "True scale, 1 unit = 1 cm. Shared across graded sizes.",
  ];
  if (placements.length === 0) lines.push(`No artwork on ${styleLabel}.`);
  placements.forEach((p, index) => {
    const error = placementError(p);
    const size = surfacePlaceable(p)
      ? effectiveSize(p as ArtworkPlacement)
      : { widthCm: NaN, heightCm: NaN };
    const dims = Number.isFinite(size.widthCm) && Number.isFinite(size.heightCm)
      ? `${round(size.widthCm)} x ${round(size.heightCm)} cm`
      : "unmeasurable size";
    const t = surfaceRecord(p.transform);
    const pose = t
      ? `at (${round(t.dx)}, ${round(t.dy)}) scale ${round(t.scale)} rot ${round(t.rotationDeg)} deg stack ${zOf(p)}`
      : "unmeasurable pose";
    lines.push(
      `#${index + 1} ${idOf(p)} (${kindOf(p)}) on ${roleOf(p)} - ${dims} ${pose}${sourceOf(p)}` +
      (error ? ` INVALID: ${error}` : ""),
    );
  });
  return lines;
};

const surfaceRecord = (value: unknown): Record<string, number> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, number>) : null;

const textOf = (value: unknown): string => typeof value === "string" ? value : "";
const idOf = (p: ArtworkPlacement): string => textOf(p.id);
const kindOf = (p: ArtworkPlacement): string => textOf(p.kind);
const roleOf = (p: ArtworkPlacement): string => textOf(p.pieceRole);
const sourceOf = (p: ArtworkPlacement): string =>
  textOf(p.sourceName) === "" ? "" : ` - ${textOf(p.sourceName)}`;
const zOf = (p: ArtworkPlacement): string =>
  typeof p.zOrder === "number" && Number.isFinite(p.zOrder) ? String(p.zOrder) : "?";

/** True-scale print sheet SVG for one style's artwork set. */
export function exportSurfaceSheet(
  placements: readonly ArtworkPlacement[],
  styleLabel: string,
): string {
  const lines = headerLines(placements, styleLabel);
  const headerH = 14 + lines.length * LINE_STEP;
  const items = placements.flatMap((p) =>
    surfacePlaceable(p) ? [overlayItem(p, artworkCorners(p.widthCm, p.heightCm, p.transform))] : []);
  const bounds = items.length === 0 ? null : boundingBox(items.flatMap((item) => [...item.polygon]));
  const artTop = headerH + 2 + CALIBRATION_CM + 3;
  const shift = bounds === null ? { x: 0, y: 0 } : { x: MARGIN - bounds.minX, y: artTop - bounds.minY };
  const moved = items.map((item) => ({
    ...item,
    polygon: item.polygon.map((pt) => ({ x: pt.x + shift.x, y: pt.y + shift.y })),
  }));
  const artW = bounds === null ? 0 : bounds.maxX - bounds.minX;
  const artH = bounds === null ? 0 : bounds.maxY - bounds.minY;
  const textW = MARGIN * 2 + 13 + Math.max(...lines.map((line) => line.length)) * CHAR_W;
  const width = round(Math.max(40, textW, artW + MARGIN * 2));
  const height = round(artTop + artH + MARGIN);
  const header = lines.map((line, i) => {
    const size = i === 0 ? TITLE_SIZE : LINE_SIZE;
    const y = i === 0 ? MARGIN + TITLE_SIZE : MARGIN + 6 + i * LINE_STEP;
    return `<text x="${MARGIN + 13}" y="${round(y)}" fill="#000000" font-size="${size}" ` +
      `font-family="sans-serif">${escapeAttr(line)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-label="Artwork print sheet">${header}` +
    calibrationSvg(MARGIN, headerH + 2, "#000000", 0.2) +
    surfaceOverlay(moved) + `</svg>`;
}
