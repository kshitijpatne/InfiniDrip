// The F1 regression gate: adding the real-world writers must not move a single
// byte of the existing exports. These SHA-256 hashes were recorded on main at
// commit 4f7e796 (Slice 34), BEFORE any F1 code existed — if any of them ever
// drifts, an "unrelated" change has altered a shipped cutting file.
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
  "tee.techpack": "d6ebf43276af68fba20962ff0f8fd6bcde84947e95276862ea9081c9c7c82f1a",
  "fitted.svg": "800a1f458a32a2bdee1f2b0ccba702b1e8da6e3841b089004c4a8d45dd116915",
  "fitted.dxf": "931edfa232b3ba2bf9aa20152b8bc59a9b85fd33a42bd59d4b27271778ce267d",
  "fitted.pdf": "14d1695f944df943dcac92b3bb75584a4ecfa0d5662b287fc16241655f0a8ad6",
  "fitted.techpack": "c52929f4a4e8a6403567b30f1171eec922aa0218882c28332c9e54ef10372177",
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
