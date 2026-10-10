import { AllowanceSpec, Piece } from "../drafting";
import { PieceNotches } from "../drafting/tshirt-notches";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { exportDxf } from "./dxf";
import { flattenPiece, layoutPieces, polylineBounds } from "./layout";

const CENTIMETER_HEADER =
  "0\nSECTION\n2\nHEADER\n" +
  "9\n$ACADVER\n1\nAC1015\n" +
  "9\n$INSUNITS\n70\n5\n" +
  "0\nENDSEC\n";
const num = (value: number): string => (Math.round(value * 1000) / 1000).toString();

/**
 * Add explicit centimeter units to the legacy DXF entity stream without
 * changing its entity body. This generic serialization helper is not an
 * apparel-CAD profile or a compatibility claim.
 */
export function exportDxfCentimeters(
  pieces: readonly Piece[], allowance: AllowanceSpec,
  notchTables: readonly PieceNotches[] = [],
): string {
  const output = CENTIMETER_HEADER + exportDxf(pieces, allowance);
  if (notchTables.length === 0) return output;

  const byPiece = new Map<string, PieceNotches>();
  for (const table of notchTables) {
    if (byPiece.has(table.pieceName)) {
      throw new Error(`Duplicate DXF construction-mark rules for piece "${table.pieceName}"`);
    }
    if (!pieces.some((piece) => piece.name === table.pieceName)) {
      throw new Error(`DXF construction-mark rules refer to missing piece "${table.pieceName}"`);
    }
    byPiece.set(table.pieceName, table);
  }

  const flats = pieces.map((piece) => flattenPiece(piece, allowance));
  const layout = layoutPieces(flats);
  const entities = pieces.map((piece, index) => {
    const table = byPiece.get(piece.name);
    if (!table) return "";

    const originalBounds = polylineBounds(flats[index].cut);
    const placedBounds = polylineBounds(layout.pieces[index].cut);
    const dx = placedBounds.minX - originalBounds.minX;
    const dy = placedBounds.minY - originalBounds.minY;
    const line = (start: { readonly x: number; readonly y: number }, end: { readonly x: number; readonly y: number }, layer: string): string => {
      const cad = (point: { readonly x: number; readonly y: number }) => ({
        x: point.x + dx,
        y: layout.height - (point.y + dy),
      });
      const a = cad(start);
      const b = cad(end);
      return `0\nLINE\n8\n${layer}\n10\n${num(a.x)}\n20\n${num(a.y)}\n11\n${num(b.x)}\n21\n${num(b.y)}\n`;
    };

    let output = "";
    for (const rule of table.notches) {
      const notch = resolveNotch(piece, rule);
      output += line(notch.point, {
        x: notch.point.x - notch.normal.x * 0.4,
        y: notch.point.y - notch.normal.y * 0.4,
      }, "MARK_NOTCH");
    }

    const grainline = resolveGrainline(piece, table.grainline);
    const chevron = 0.3;
    const centerX = (grainline.top.x + grainline.bottom.x) / 2;
    output += line(grainline.top, grainline.bottom, "MARK_GRAINLINE");
    output += line({ x: centerX - chevron, y: grainline.top.y + chevron }, grainline.top, "MARK_GRAINLINE");
    output += line({ x: centerX + chevron, y: grainline.top.y + chevron }, grainline.top, "MARK_GRAINLINE");
    output += line({ x: centerX - chevron, y: grainline.bottom.y - chevron }, grainline.bottom, "MARK_GRAINLINE");
    output += line({ x: centerX + chevron, y: grainline.bottom.y - chevron }, grainline.bottom, "MARK_GRAINLINE");
    return output;
  }).join("");

  const endEntities = "0\nENDSEC\n0\nEOF\n";
  const insertionPoint = output.lastIndexOf(endEntities);
  return output.slice(0, insertionPoint) + entities + output.slice(insertionPoint);
}
