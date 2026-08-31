// The F1 regression gate: adding the real-world writers must not move a single
// byte of the existing exports. These SHA-256 hashes were recorded on main at
// commit 4f7e796 (Slice 34), BEFORE any F1 code existed — if any of them ever
// drifts, an "unrelated" change has altered a shipped cutting file.
//
// The two `.techpack` hashes are the deliberate exception, updated at Slice 45:
// exportTechPack legitimately grew a 4th page (the Fit Record). svg/dxf/pdf stay
// on their ORIGINAL Slice-34 baseline below, unmoved — confirming the blast
// radius of Slice 45 is exactly the tech-pack writer, nothing else in the
// export spine.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { STANDARD_M, blockPieces, draftAtSize, garmentByName } from "../drafting";
import { exportSvg } from "./svg";
import { exportDxf } from "./dxf";
import { exportPdf } from "./pdf";
import { exportTechPack } from "./techpack";

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

const BASELINE: Record<string, string> = {
  "tee.svg": "f820dc538f9102682354855770cf06d7c82b192f4343844dc6ae8e89e13521ae",
  "tee.dxf": "299b39bdc5c6bb775ef14d18810cd154aed4b32493823e234f4257d47d77eb5b",
  "tee.pdf": "57e88a26b016fddaa232269c6ed036a0ce277683e46ba5eece44387b6755caa9",
  "tee.techpack": "5e5778a315ac803fa6fa55ed2c086a89b75e7bfe3001e1143c03d8cd30164558", // slice 45: +Fit Record page
  "fitted.svg": "800a1f458a32a2bdee1f2b0ccba702b1e8da6e3841b089004c4a8d45dd116915",
  "fitted.dxf": "931edfa232b3ba2bf9aa20152b8bc59a9b85fd33a42bd59d4b27271778ce267d",
  "fitted.pdf": "14d1695f944df943dcac92b3bb75584a4ecfa0d5662b287fc16241655f0a8ad6",
  "fitted.techpack": "c7b15350b0c41d91620dd56e38626f3c59cc89ca9e3f7bf635d8d5df5b433a01", // slice 45: +Fit Record page
};

for (const name of ["tee", "fitted"]) {
  const recipe = garmentByName(name);
  const pieces = blockPieces(draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft));

  describe(`byte-identical exports — ${name}`, () => {
    it("SVG output is unchanged", () => {
      expect(sha(exportSvg(pieces, recipe.allowances, recipe.notches))).toBe(
        BASELINE[`${name}.svg`]
      );
    });

    it("DXF output is unchanged", () => {
      expect(sha(exportDxf(pieces, recipe.allowances))).toBe(BASELINE[`${name}.dxf`]);
    });

    it("tiled PDF output is unchanged", () => {
      expect(sha(exportPdf(pieces, recipe.allowances))).toBe(BASELINE[`${name}.pdf`]);
    });

    it("tech-pack output is unchanged", () => {
      expect(sha(exportTechPack(recipe, STANDARD_M))).toBe(BASELINE[`${name}.techpack`]);
    });
  });
}
