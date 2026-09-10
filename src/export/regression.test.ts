// The F1 regression gate: adding the real-world writers must not move a single
// byte of the existing exports. The original hashes were recorded on main at
// commit 4f7e796 (Slice 34), BEFORE any F1 code existed — if any of them ever
// drifts, an "unrelated" change has altered a shipped cutting file.
//
// Two deliberate moves since: the `.techpack` hashes at Slice 45 (exportTechPack
// legitimately grew a 4th page, the Fit Record — svg/dxf/pdf stayed on the
// original Slice-34 baseline, confirming the blast radius was exactly the
// tech-pack writer). And EVERY hash below, at Slice 62: the neckline curve
// construction was rebuilt (see neckline.ts's header) because the OLD curve
// didn't meet the centre-front/centre-back fold at a right angle, which is
// what spiked into a visible V when Slice 61 finally rendered it faithfully
// everywhere. The old "byte-identical" baseline encoded that spike — moving
// it here is the fix landing in the actual cut pattern, not a regression.
// Confirmed before regenerating: every OTHER test in the suite (structure,
// stitch-matching, POMs, checks) still passes unmodified — the blast radius
// is exactly the neckline curve's shape, nothing else in the drafting or
// export spine. Signed off by Kshitij before this baseline moved.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { STANDARD_M, blockPieces, draftAtSize, garmentByName } from "../drafting";
import { exportSvg } from "./svg";
import { exportDxf } from "./dxf";
import { exportPdf } from "./pdf";
import { exportTechPack } from "./techpack";

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

const BASELINE: Record<string, string> = {
  "tee.svg": "3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d",
  "tee.dxf": "0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9",
  "tee.pdf": "1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523",
  "tee.techpack": "6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1", // slice 62: neckline curve fix
  "fitted.svg": "cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c",
  "fitted.dxf": "e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6",
  "fitted.pdf": "184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff",
  "fitted.techpack": "a32bc158c8ba26cafbe1165ee441a45fecc0558db245a4b4d309382308a267ff", // slice 62: neckline curve fix
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
