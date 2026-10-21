// Jeans views are projections of the live draft block. The component tray keeps
// cut pieces identifiable without implying they have been sewn or fitted.

import type { Block, Piece } from "../drafting";
import { jeansNotchesForDraft } from "../drafting/jeans-tables";
import type { PieceNotches } from "../drafting/tshirt-notches";
import { rolePiece } from "../drafting/block";
import { patternMarksSvg } from "./pattern-mark";
import { grainlineSvg, notchSvg, resolveGrainline, resolveNotch } from "./notch";
import { pieceToPath } from "./shape";
import { BLUEPRINT as T } from "./theme";

export type JeansViewPosition = "front" | "back";

interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
}

interface RenderRole {
  readonly role: string;
  readonly fill: string;
  readonly piece: Piece;
  readonly recipeMarks: string;
}

const MARGIN = 10;
const HEADER = 12;
const FOOTER = 16;
const GAP = 10;
const TILE_HEADER = 7;
const TILE_GAP = 6;
const TILE_COLUMNS = 4;
const DISCLOSURE = "PATTERN-LINKED DIGITAL VIEW · NO BODY, FIT, SEWING, DRAPE OR MATERIAL SIMULATION";
const ASSEMBLED_DISCLOSURE = "PATTERN-LINKED COMPONENT SCHEMATIC · CUT COMPONENTS SHOWN DETACHED, NOT SEWN OR FIT SIMULATED";
const MARK_STYLE = {
  stroke: T.marker,
  width: 0.8,
  pointSize: 0.55,
  labelSize: 1.4,
  labelPlacement: "offset" as const,
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

const FRONT_ROLES = [
  { role: "frontLeft", fill: T.cloth },
  { role: "frontRight", fill: T.cloth },
  { role: "coinPocket", fill: T.fillActive },
] as const;

const BACK_ROLES = [
  { role: "backYokeLeft", fill: T.cloth },
  { role: "backYokeRight", fill: T.cloth },
  { role: "backLowerLeft", fill: T.cloth },
  { role: "backLowerRight", fill: T.cloth },
  { role: "backPocketLeft", fill: T.fillActive },
  { role: "backPocketRight", fill: T.fillActive },
] as const;

const COMPONENT_ROWS = [
  ["pocketFacingLeft", "pocketFacingRight", "pocketBagLeft", "pocketBagRight"],
  ["pocketStayLeft", "pocketStayRight", "pocketFacingExtensionRight", "flyFacingUnderlapRight"],
  ["flyShield", "waistbandOuterLeft", "waistbandOuterRight", "waistbandInnerLeft"],
  ["waistbandInnerRight", "beltLoopStrip"],
] as const;

/** Bounds include cubic control points so curved source edges cannot be clipped. */
function sourceBounds(pieces: readonly Piece[]): Bounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const piece of pieces) {
    for (const edge of piece.edges) {
      const points = edge.kind === "line"
        ? [edge.start, edge.end]
        : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end];
      for (const point of points) {
        xs.push(point.x);
        ys.push(point.y);
      }
    }
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function recipeRoleMarks(piece: Piece, role: string, notchTable: readonly PieceNotches[]): string {
  const rule = notchTable.find((entry) => entry.pieceName === piece.name);
  if (!rule) throw new Error(`Jeans view requires notch and grainline rules for ${piece.name}.`);
  const notches = rule.notches.map((notch) => notchSvg(resolveNotch(piece, notch), 1.5, T.marker, 1.1)).join("");
  const grainline = grainlineSvg(resolveGrainline(piece, rule.grainline), T.marker, 1.0, 1.2);
  return `<g data-role-mark="notch" data-source-role="${role}" data-mark-count="${rule.notches.length}">${notches}</g>` +
    `<g data-role-mark="grainline" data-source-role="${role}">${grainline}</g>`;
}

function renderRole({ role, fill, piece, recipeMarks }: RenderRole): string {
  return `<g data-source-role="${role}" aria-label="${role}; authored pattern marks, notch and grainline">` +
    `<path data-role="${role}" d="${pieceToPath(piece)}" fill="${fill}" ` +
    `stroke="${T.line}" stroke-width="1.15" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>` +
    recipeMarks + patternMarksSvg(piece.marks, MARK_STYLE) +
    `</g>`;
}

function projection(
  block: Block, position: JeansViewPosition, notchTable: readonly PieceNotches[],
): readonly RenderRole[] {
  const definitions = position === "front" ? FRONT_ROLES : BACK_ROLES;
  return definitions.map(({ role, fill }) => {
    const piece = rolePiece(block, role);
    return { role, fill, piece, recipeMarks: recipeRoleMarks(piece, role, notchTable) };
  });
}

function roleBounds(roles: readonly RenderRole[]): Bounds {
  return sourceBounds(roles.map((item) => item.piece));
}

function projectionMarkup(
  roles: readonly RenderRole[], position: JeansViewPosition, x: number, y: number,
): string {
  const bounds = roleBounds(roles);
  const tx = x - bounds.minX;
  const ty = y - bounds.minY;
  return `<g data-projection="${position}" transform="translate(${round(tx)} ${round(ty)})">` +
    `${roles.map(renderRole).join("")}</g>`;
}

function projectionView(block: Block, position: JeansViewPosition): string {
  const roles = projection(block, position, jeansNotchesForDraft(block));
  const bounds = roleBounds(roles);
  const minX = bounds.minX - MARGIN;
  const minY = bounds.minY - HEADER;
  const width = bounds.width + MARGIN * 2;
  const height = bounds.height + HEADER + FOOTER;
  const title = `JEANS ${position.toUpperCase()} · PATTERN-LINKED BODY VIEW`;
  return `<svg data-garment="jeans" data-renderer="jeans-body" data-view="${position}" ` +
    `data-source="active-jeans-assessment-block" aria-label="${title}" ` +
    `viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    `<text x="${round((bounds.minX + bounds.maxX) / 2)}" y="${round(bounds.minY - 4)}" ` +
    `fill="${T.patternHeading}" font-size="2.8" font-family="system-ui, sans-serif" text-anchor="middle">${title}</text>` +
    roles.map(renderRole).join("") +
    `<text data-disclosure="pattern-linked-digital-view" x="${round((bounds.minX + bounds.maxX) / 2)}" ` +
    `y="${round(bounds.maxY + 8)}" fill="${T.patternInstruction}" font-size="1.7" ` +
    `font-family="system-ui, sans-serif" text-anchor="middle">${DISCLOSURE}</text></svg>`;
}

/** One Jeans front or back projection from the already-assessed live draft block. */
export function renderJeansBody(block: Block, position: JeansViewPosition = "front"): string {
  return projectionView(block, position);
}

/** Front and back projections share the same assessed block. */
export function renderJeansBodyPair(block: Block): string {
  return `<div style="display:flex;gap:8px;width:100%">` +
    `<div style="flex:1;min-width:0">${projectionView(block, "front")}</div>` +
    `<div style="flex:1;min-width:0">${projectionView(block, "back")}</div></div>`;
}

function componentWidth(block: Block, role: string): number {
  const bounds = sourceBounds([rolePiece(block, role)]);
  return Math.max(bounds.width, role.length * 1.45, 18);
}

function componentTile(block: Block, notchTable: readonly PieceNotches[], role: string, x: number, y: number, width: number): string {
  const piece = rolePiece(block, role);
  const bounds = sourceBounds([piece]);
  const pieceX = x + (width - bounds.width) / 2 - bounds.minX;
  const pieceY = y + TILE_HEADER - bounds.minY;
  return `<g data-component-role="${role}" aria-label="${role}; detached cut component with authored marks">` +
    `<text x="${round(x + width / 2)}" y="${round(y + 3)}" fill="${T.patternLabel}" ` +
    `font-size="1.8" font-family="system-ui, sans-serif" text-anchor="middle">${role}</text>` +
    `<g transform="translate(${round(pieceX)} ${round(pieceY)})">` +
    `${renderRole({ role, fill: T.fill, piece, recipeMarks: recipeRoleMarks(piece, role, notchTable) })}</g></g>`;
}

/** Flat front/back component schematic. Separate pieces stay detached in the tray. */
export function renderJeansAssembled(block: Block): string {
  const notchTable = jeansNotchesForDraft(block);
  const front = projection(block, "front", notchTable);
  const back = projection(block, "back", notchTable);
  const frontBounds = roleBounds(front);
  const backBounds = roleBounds(back);
  const projectionMinY = Math.min(frontBounds.minY, backBounds.minY);
  const projectionMaxY = Math.max(frontBounds.maxY, backBounds.maxY);
  const projectionHeight = projectionMaxY - projectionMinY;
  const frontWidth = frontBounds.width;
  const backWidth = backBounds.width;
  const projectionWidth = frontWidth + GAP + backWidth;
  const columns = Array.from({ length: TILE_COLUMNS }, (_, column) => Math.max(
    ...COMPONENT_ROWS.map((row) => {
      const role = row[column];
      return role === undefined ? 0 : componentWidth(block, role);
    }),
  ));
  const rowHeights = COMPONENT_ROWS.map((row) => Math.max(
    ...row.map((role) => sourceBounds([rolePiece(block, role)]).height),
  ) + TILE_HEADER + 3);
  const trayWidth = columns.reduce((sum, width) => sum + width, 0) + TILE_GAP * (TILE_COLUMNS - 1);
  const trayHeight = rowHeights.reduce((sum, height) => sum + height, 0) + TILE_GAP * (COMPONENT_ROWS.length - 1);
  const width = Math.max(projectionWidth, trayWidth) + MARGIN * 2;
  const projectionLeft = MARGIN + (width - projectionWidth) / 2;
  const frontX = projectionLeft;
  const backX = projectionLeft + frontWidth + GAP;
  const projectionY = HEADER;
  const trayStartY = HEADER + projectionHeight + 18;
  const trayStartX = (width - trayWidth) / 2;
  const height = trayStartY + trayHeight + FOOTER;
  let rowY = trayStartY;
  const tiles = COMPONENT_ROWS.map((row, rowIndex) => {
    let x = trayStartX;
    const content = row.map((role, columnIndex) => {
      const tile = componentTile(block, notchTable, role, x, rowY, columns[columnIndex]!);
      x += columns[columnIndex]! + TILE_GAP;
      return tile;
    }).join("");
    rowY += rowHeights[rowIndex]! + TILE_GAP;
    return content;
  }).join("");
  const left = projectionLeft;
  const center = width / 2;
  return `<svg data-garment="jeans" data-renderer="jeans-assembled" ` +
    `data-source="active-jeans-assessment-block" aria-label="Jeans pattern-linked front and back component schematic" ` +
    `viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    `<text x="${round(left + frontWidth / 2)}" y="7" fill="${T.patternHeading}" font-size="2.8" font-family="system-ui, sans-serif" text-anchor="middle">FRONT</text>` +
    `<text x="${round(left + frontWidth + GAP + backWidth / 2)}" y="7" fill="${T.patternHeading}" font-size="2.8" font-family="system-ui, sans-serif" text-anchor="middle">BACK</text>` +
    projectionMarkup(front, "front", frontX, projectionY) + projectionMarkup(back, "back", backX, projectionY) +
    `<text x="${round(center)}" y="${round(trayStartY - 5)}" fill="${T.patternHeading}" font-size="2.4" font-family="system-ui, sans-serif" text-anchor="middle">DETACHED CUT COMPONENTS · SOURCE ROLES AND AUTHORED MARKS</text>` +
    tiles +
    `<text data-disclosure="assembled-component-schematic" x="${round(center)}" y="${round(height - 8)}" ` +
    `fill="${T.patternInstruction}" font-size="1.65" font-family="system-ui, sans-serif" text-anchor="middle">${ASSEMBLED_DISCLOSURE}</text>` +
    `<text data-disclosure="material-and-fit-limits" x="${round(center)}" y="${round(height - 3)}" ` +
    `fill="${T.patternInstruction}" font-size="1.55" font-family="system-ui, sans-serif" text-anchor="middle">FIBER, WEIGHT, RECOVERY, SHRINKAGE AND PHYSICAL FIT ARE UNKNOWN</text></svg>`;
}
