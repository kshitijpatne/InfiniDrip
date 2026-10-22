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
  "tee.techpack": "cd8d8aad31c98b3141703d26e118ab52285b3d8cddf574a4d7243053d4a1ac6d", // slice 62 neckline fix; slices 1054-1055 Tee stabilizer BOM and construction sequence
  // Slice 1163: Fitted-only geometry correction; the closed-reference trace now opens the lower side around the dart apex. Tee identities above remain unchanged.
  "fitted.svg": "a11bc97419da6c9c741d23bff5a79e8e148352153da751ff963c9cc5051aed05",
  "fitted.dxf": "875ed4aa76636fd55bd261a26af285a8be1205391339be4cc0fb4d12540bd069",
  "fitted.pdf": "a9bd4bf0df9e9d6fc671f76ddb28d3e406630d5dacfb0a96bc9f35ad5fdbc313",
  "fitted.techpack": "6376babcf0ff3c6ee7a7cd65a3f3fd156a8b5d08734ed537cf918fa5f33cf8a3", // slice 65 label clarification; S1163 Fitted geometry correction
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
