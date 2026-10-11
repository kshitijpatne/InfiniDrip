import { describe, expect, it } from "vitest";
import { STANDARD_M, blockPieces, draftAtSize, garmentByName, GARMENTS } from "../drafting";
import { exportDxf } from "./dxf";
import { exportDxfCentimeters } from "./dxf-centimeters";
import { flattenPiece, layoutPieces, polylineBounds } from "./layout";
import { resolveNotch } from "../render/notch";

describe("exportDxfCentimeters", () => {
  it("declares centimeter units in the opt-in candidate", () => {
    const recipe = garmentByName("polo");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    const declared = exportDxfCentimeters(pieces, recipe.allowances);
    const header =
      "0\nSECTION\n2\nHEADER\n" +
      "9\n$ACADVER\n1\nAC1015\n" +
      "9\n$INSUNITS\n70\n5\n" +
      "0\nENDSEC\n";

    expect(declared.startsWith(header)).toBe(true);
    expect(declared).toContain("2\nENTITIES");
    expect(declared.trimEnd().endsWith("0\nEOF")).toBe(true);
  });

  it("keeps candidate outline and construction-mark coordinates finer than the contour gate", () => {
    const recipe = garmentByName("tee");
    const sourcePieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    const button = {
      kind: "button" as const,
      name: "precision-test-button",
      at: { x: 1.23456789, y: 2.34567891 },
    };
    const pieces = [{ ...sourcePieces[0]!, marks: [button] }, ...sourcePieces.slice(1)];
    const cuts = pieces.map((piece) => flattenPiece(piece, recipe.allowances).cut);
    cuts[0] = [
      { x: 0.123456789, y: 0.234567891 },
      { x: 4.234567891, y: 0.234567891 },
      { x: 4.234567891, y: 6.345678912 },
      { x: 0.123456789, y: 6.345678912 },
    ];
    const output = exportDxfCentimeters(pieces, recipe.allowances, recipe.notches, cuts);

    expect(output).toContain("10\n5.111111\n");
    expect(output).toContain("0\nCIRCLE\n8\nMARK_BUTTON\n10\n2.111111\n");
    expect(output).not.toContain("10\n5.111\n");
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
    const number = (value: number) => (Math.round(value * 1_000_000) / 1_000_000).toString();
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

  it("rejects candidate cut arrays that do not align one-to-one with pieces", () => {
    const recipe = garmentByName("tee");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));
    expect(() => exportDxf(pieces, recipe.allowances, [])).toThrow("cut outline count must match its piece count");
    expect(() => exportDxfCentimeters(pieces, recipe.allowances, [], [])).toThrow("cut outline count must match its piece count");
  });

  it("rejects invalid candidate layout gaps", () => {
    const recipe = garmentByName("tee");
    const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));

    expect(() => exportDxfCentimeters(pieces, recipe.allowances, [], undefined, "point", -1))
      .toThrow("DXF layout gap must be a non-negative finite number");
    expect(() => exportDxfCentimeters(pieces, recipe.allowances, [], undefined, "point", Number.NaN))
      .toThrow("DXF layout gap must be a non-negative finite number");
  });
});
