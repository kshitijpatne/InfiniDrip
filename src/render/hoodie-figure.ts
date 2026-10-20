// Hidden Hoodie schematics translate the same live draft pieces and marks used
// by pattern output. They are flat digital views, not sewn, fit, or material
// simulations.

import type { Block, Measurements, Piece } from "../drafting";
import { rolePiece } from "../drafting/block";
import { draftHoodie } from "../drafting/hoodie";
import { resolveHoodieOptions, type HoodieOptions } from "../drafting/hoodie-contract";
import { patternMarksSvg } from "./pattern-mark";
import { pieceToPath } from "./shape";
import { BLUEPRINT as T } from "./theme";

type HoodieBodyPosition = "front" | "back";

interface PieceBounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

interface RoleLabel {
  readonly role: string;
  readonly label: string;
}

const MARGIN = 12;
const BODY_TOP = 10;
const HEADER = 10;
const LABEL_BAND = 6;
const GAP = 10;
const ROW_GAP = 10;
const DISCLOSURE = "SCHEMATIC ONLY · NOT PATTERN-LINKED · NO FIT OR MATERIAL CLAIM";
const MARK_STYLE = {
  stroke: T.marker,
  width: 0.8,
  pointSize: 0.55,
  labelSize: 1.5,
  labelPlacement: "offset" as const,
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

/** Control-point bounds conservatively contain every cubic outline segment. */
function sourceBounds(piece: Piece): PieceBounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const edge of piece.edges) {
    const points = edge.kind === "line"
      ? [edge.start, edge.end]
      : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end];
    for (const point of points) {
      xs.push(point.x);
      ys.push(point.y);
    }
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function disclosure(width: number, height: number): string {
  return '<text data-disclosure="schematic-not-pattern-linked" x="' + round(width / 2) +
    '" y="' + round(height - 2.4) + '" fill="' + T.patternInstruction +
    '" font-size="1.8" font-family="system-ui, sans-serif" text-anchor="middle">' +
    DISCLOSURE + "</text>";
}

function svgShell(width: number, height: number, label: string, body: string): string {
  return '<svg data-garment="hoodie" data-source-geometry="draftHoodie" aria-label="' + label +
    '" viewBox="0 0 ' + round(width) + " " + round(height) +
    '" width="100%" xmlns="http://www.w3.org/2000/svg" style="background:' + T.background +
    ';border-radius:8px"><rect x="0" y="0" width="' + round(width) + '" height="' +
    round(height) + '" fill="' + T.background + '"/>' + body + disclosure(width, height) + "</svg>";
}

function sourcePiece(
  piece: Piece,
  role: string,
  fill: string,
  translateX: number,
  translateY: number,
): string {
  const path = '<path data-role="' + role + '" d="' + pieceToPath(piece) + '" fill="' + fill +
    '" stroke="' + T.line + '" stroke-width="1.1" stroke-linejoin="round" ' +
    'vector-effect="non-scaling-stroke"/>';
  return '<g data-source-role="' + role + '" data-on-fold="' + String(piece.onFold) +
    '" transform="translate(' + round(translateX) + " " + round(translateY) + ')">' +
    path + patternMarksSvg(piece.marks, MARK_STYLE) + "</g>";
}

function bodySvg(block: Block, position: HoodieBodyPosition): string {
  const piece = rolePiece(block, position);
  const bounds = sourceBounds(piece);
  const width = Math.max(bounds.width + MARGIN * 2, DISCLOSURE.length * 1.15);
  const height = BODY_TOP + bounds.height + 18;
  const pieceX = (width - bounds.width) / 2;
  const body = '<text x="' + round(width / 2) + '" y="6" fill="' + T.label +
    '" font-size="2.8" font-family="system-ui, sans-serif" text-anchor="middle">' +
    position.toUpperCase() + " BODY</text>" +
    sourcePiece(piece, position, T.cloth, pieceX - bounds.minX, BODY_TOP - bounds.minY);
  return svgShell(width, height, "Hoodie " + position + " body schematic", body);
}

/** One Hoodie Body view drawn from the live front or back draft piece. */
export function renderHoodieBody(
  measurements: Measurements,
  rawOptions: Partial<HoodieOptions> = {},
  position: HoodieBodyPosition = "front",
): string {
  const block = draftHoodie(measurements, resolveHoodieOptions(rawOptions));
  return bodySvg(block, position);
}

/** Side-by-side front and back Body views from one shared draft block. */
export function renderHoodieBodyPair(
  measurements: Measurements,
  rawOptions: Partial<HoodieOptions> = {},
): string {
  const block = draftHoodie(measurements, resolveHoodieOptions(rawOptions));
  return '<div style="display:flex;gap:8px;width:100%"><div style="flex:1;min-width:0">' +
    bodySvg(block, "front") + '</div><div style="flex:1;min-width:0">' +
    bodySvg(block, "back") + "</div></div>";
}

function roleRows(block: Block): readonly (readonly { role: string; label: string; piece: Piece }[])[] {
  const rows: readonly (readonly RoleLabel[])[] = [
    [{ role: "front", label: "FRONT BODY" }, { role: "back", label: "BACK BODY" }],
    [{ role: "sleeveLeft", label: "LEFT SLEEVE" }, { role: "sleeveRight", label: "RIGHT SLEEVE" }],
    [{ role: "hoodOuterLeft", label: "LEFT OUTER HOOD" }, { role: "hoodOuterRight", label: "RIGHT OUTER HOOD" }],
    [{ role: "hoodLiningLeft", label: "LEFT HOOD LINING" }, { role: "hoodLiningRight", label: "RIGHT HOOD LINING" }],
    [
      { role: "pocket", label: "KANGAROO POUCH" },
      { role: "cuffLeft", label: "LEFT CUFF" },
      { role: "cuffRight", label: "RIGHT CUFF" },
      { role: "hemBand", label: "HEM BAND" },
    ],
  ];
  return rows.map((row) => row.flatMap((entry) => {
    const piece = block.roles[entry.role];
    if (!piece) return [];
    const label = entry.role === "pocket" && piece.onFold
      ? "KANGAROO POUCH · ON FOLD"
      : entry.label;
    return [{ ...entry, label, piece }];
  }));
}

function assembledRows(block: Block, fill: string): { readonly svg: string; readonly width: number; readonly height: number } {
  const rows = roleRows(block);
  const fragments: string[] = [];
  let width = MARGIN * 2;
  let y = HEADER;

  for (const row of rows) {
    let x = MARGIN;
    let rowHeight = 0;
    for (const entry of row) {
      const bounds = sourceBounds(entry.piece);
      const labelWidth = entry.label.length * 1.25 + 4;
      const slotWidth = Math.max(bounds.width, labelWidth);
      const pieceX = x + (slotWidth - bounds.width) / 2;
      const pieceY = y + LABEL_BAND;
      fragments.push(
        '<text x="' + round(x + slotWidth / 2) + '" y="' + round(y + 2.8) +
        '" fill="' + T.label + '" font-size="2.2" font-family="system-ui, sans-serif" ' +
        'text-anchor="middle">' + entry.label + "</text>" +
        sourcePiece(entry.piece, entry.role, fill, pieceX - bounds.minX, pieceY - bounds.minY),
      );
      rowHeight = Math.max(rowHeight, bounds.height);
      x += slotWidth + GAP;
    }
    const rowWidth = x - GAP + MARGIN;
    width = Math.max(width, rowWidth);
    y += LABEL_BAND + rowHeight + ROW_GAP;
  }

  return {
    svg: fragments.join(""),
    width: Math.max(width, DISCLOSURE.length * 1.15),
    height: y - ROW_GAP + 8,
  };
}

/** Assembled Hoodie schematic laid out from the same live roles as its draft. */
export function renderHoodieGarment(
  measurements: Measurements,
  fabric: string,
  rawOptions: Partial<HoodieOptions> = {},
): string {
  const block = draftHoodie(measurements, resolveHoodieOptions(rawOptions));
  const assembled = assembledRows(block, fabric);
  return svgShell(
    assembled.width,
    assembled.height,
    "Hoodie assembled schematic",
    assembled.svg,
  );
}
