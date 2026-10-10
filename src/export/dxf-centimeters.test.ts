import { describe, expect, it } from "vitest";
import { STANDARD_M, blockPieces, draftAtSize, garmentByName } from "../drafting";
import { exportDxf } from "./dxf";
import { exportDxfCentimeters } from "./dxf-centimeters";

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
});
