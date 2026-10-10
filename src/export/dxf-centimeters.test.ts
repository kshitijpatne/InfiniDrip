import { describe, expect, it } from "vitest";
import { STANDARD_M, blockPieces, draftAtSize, garmentByName, GARMENTS } from "../drafting";
import { exportDxf } from "./dxf";
import { exportDxfCentimeters } from "./dxf-centimeters";
import { flattenPiece, layoutPieces, polylineBounds } from "./layout";
import { resolveNotch } from "../render/notch";

describe("exportDxfCentimeters", () => {
  it("declares centimeter units and preserves the existing DXF body byte-for-byte", () => {
    const recipe = garmentByName("polo");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    const legacy = exportDxf(pieces, recipe.allowances);
    const declared = exportDxfCentimeters(pieces, recipe.allowances);
    const header =
      "0\nSECTION\n2\nHEADER\n" +
      "9\n$ACADVER\n1\nAC1015\n" +
      "9\n$INSUNITS\n70\n5\n" +
      "0\nENDSEC\n";

    expect(declared).toBe(`${header}${legacy}`);
    expect(declared.slice(header.length)).toBe(legacy);
    expect(declared).toContain("2\nENTITIES");
    expect(declared.trimEnd().endsWith("0\nEOF")).toBe(true);
  });

  it("carries each recipe's live notches and grainlines on typed DXF layers", () => {
    for (const recipe of GARMENTS) {
      const block = draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft);
      const pieces = blockPieces(block);
      const output = exportDxfCentimeters(pieces, recipe.allowances, recipe.notches);
      const notchCount = recipe.notches.reduce((sum, table) => sum + table.notches.length, 0);
      const grainlineCount = recipe.notches.length * 5;

      expect(output.match(/0\nLINE\n8\nMARK_NOTCH\n/g) ?? []).toHaveLength(notchCount);
      expect(output.match(/0\nLINE\n8\nMARK_GRAINLINE\n/g) ?? []).toHaveLength(grainlineCount);
      expect(output.indexOf("0\nENDSEC\n0\nEOF\n")).toBeGreaterThan(output.indexOf("MARK_GRAINLINE"));
      expect(output).toContain("9\n$INSUNITS\n70\n5\n");
    }
  });

  it("maps the first resolved notch to its placed CAD coordinate and flips Y", () => {
    const recipe = garmentByName("tee");
    const block = draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft);
    const pieces = blockPieces(block);
    const table = recipe.notches.find((entry) => entry.notches.length > 0)!;
    const pieceIndex = pieces.findIndex((piece) => piece.name === table.pieceName);
    const piece = pieces[pieceIndex];
    const flats = pieces.map((item) => flattenPiece(item, recipe.allowances));
    const layout = layoutPieces(flats);
    const originalBounds = polylineBounds(flats[pieceIndex].cut);
    const placedBounds = polylineBounds(layout.pieces[pieceIndex].cut);
    const dx = placedBounds.minX - originalBounds.minX;
    const dy = placedBounds.minY - originalBounds.minY;
    const notch = resolveNotch(piece, table.notches[0]);
    const end = { x: notch.point.x - notch.normal.x * 0.4, y: notch.point.y - notch.normal.y * 0.4 };
    const number = (value: number) => (Math.round(value * 1000) / 1000).toString();
    const expected = `0\nLINE\n8\nMARK_NOTCH\n10\n${number(notch.point.x + dx)}\n20\n${number(layout.height - (notch.point.y + dy))}\n11\n${number(end.x + dx)}\n21\n${number(layout.height - (end.y + dy))}\n`;

    expect(exportDxfCentimeters(pieces, recipe.allowances, recipe.notches)).toContain(expected);
  });

  it("leaves pieces without a notch-table entry unchanged in the candidate", () => {
    const recipe = garmentByName("tee");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    const oneTable = [recipe.notches[0]];
    const output = exportDxfCentimeters(pieces, recipe.allowances, oneTable);
    const expectedNotches = oneTable.reduce((sum, table) => sum + table.notches.length, 0);

    expect(output.match(/0\nLINE\n8\nMARK_NOTCH\n/g) ?? []).toHaveLength(expectedNotches);
    expect(output.match(/0\nLINE\n8\nMARK_GRAINLINE\n/g) ?? []).toHaveLength(5);
  });

  it("fails closed for duplicate or missing piece mark tables", () => {
    const recipe = garmentByName("tee");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    const table = recipe.notches[0];

    expect(() => exportDxfCentimeters(pieces, recipe.allowances, [table, table]))
      .toThrow('Duplicate DXF construction-mark rules for piece "front"');
    expect(() => exportDxfCentimeters(pieces, recipe.allowances, [{ ...table, pieceName: "missing" }]))
      .toThrow('DXF construction-mark rules refer to missing piece "missing"');
  });
});
