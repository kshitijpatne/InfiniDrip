import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeLength, pieceEdge } from "../../../../src/drafting/piece";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";

const sourceMatrixUrl = new URL("../S348-woven-role-token/production-replay/matrix.json", import.meta.url);
const acceptedReplay = new URL("../S459-integrated-v02-acceptance-review/production-replay/", import.meta.url);
const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;

describe("S349 Woven source/accepted-view crosswalk", () => {
  it("retains the exact sleeve-to-band source relation while back bands stay detail-only", async () => {
    const sourceMatrix = JSON.parse(await readFile(sourceMatrixUrl, "utf8")) as {
      configurations: number;
      cases: { caseId: string; options: Record<string, number>; faces: { kind: "FRONT_FLAT" | "BACK_FLAT"; revisionId: string }[] }[];
    };
    const acceptedMatrix = JSON.parse(await readFile(new URL("matrix.json", acceptedReplay), "utf8")) as {
      cases: { caseId: string; recipeId: string; faces: { kind: string; revisionId: string; issueCount: number }[] }[];
    };
    let acceptedFaces = 0;
    let detachedBackFaces = 0;

    for (const testCase of sourceMatrix.cases) {
      const acceptedCase = acceptedMatrix.cases.find((candidate) => candidate.caseId === testCase.caseId
        && candidate.recipeId === "woven-shirt");
      expect(acceptedCase, testCase.caseId + ": current accepted S459 row").toBeDefined();
      const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options });
      const stitch = block.stitches.find((candidate) => candidate.label === "Folded sleeve band ↔ sleeve hem");
      expect(stitch).toBeDefined();
      const refs = [...stitch!.a.edges, ...stitch!.b.edges]
        .filter((ref): ref is Extract<typeof ref, { piece: string; edge: string }> => "edge" in ref)
        .map((ref) => ref.piece + "." + ref.edge).sort();
      expect(refs).toEqual(["sleeve.hem", "sleeveBand.top"]);
      expect(edgeLength(pieceEdge(block.roles.sleeve!, "hem")))
        .toBeCloseTo(edgeLength(pieceEdge(block.roles.sleeveBand!, "top")), 8);

      const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, "s459-crosswalk")!;
      for (const face of testCase.faces) {
        const acceptedFace = acceptedCase!.faces.find((candidate) => candidate.kind === face.kind)!;
        expect(acceptedFace.revisionId).toBe(face.revisionId);
        expect(acceptedFace.issueCount).toBe(0);
        const svgName = testCase.caseId + "-" + face.kind.toLowerCase() + ".svg";
        const svg = await readFile(new URL(svgName, acceptedReplay), "utf8");
        expect(svg).toContain("data-revision-id=\"" + face.revisionId + "\"");
        const bandRole = projection.faces.find((candidate) => candidate.kind === face.kind)!.roles
          .find((candidate) => candidate.roleId === "sleeveBand")!;
        if (face.kind === "BACK_FLAT") {
          expect(bandRole.wovenDetachedBandDetailRepresentation).toMatchObject({
            decisionId: "G04-S370-WOVEN-DETACHED-BAND-DETAIL",
            sourcePieceId: "sleeveBand",
            outlineEdgeIds: ["top", "sideRight", "bottom", "sideLeft"],
            receiverRoleId: "sleeve", receiverEdgeId: "hem", quantity: 2,
          });
          expect(svg).toContain("DETAIL ONLY—not at assembly location");
          expect(svg).toContain("detached-detail:left");
          expect(svg).toContain("detached-detail:right");
          detachedBackFaces += 1;
        } else {
          expect(bandRole.wovenDetachedBandDetailRepresentation).toBeUndefined();
          expect(svg).not.toContain("detached-detail:");
        }
        acceptedFaces += 1;
      }
    }

    expect(sourceMatrix.configurations).toBe(28);
    expect(acceptedFaces).toBe(56);
    expect(detachedBackFaces).toBe(28);
  }, 15_000);
});
