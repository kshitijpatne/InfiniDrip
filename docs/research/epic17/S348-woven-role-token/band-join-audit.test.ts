import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const sourceMatrixUrl = new URL("./production-replay/matrix.json", import.meta.url);
const acceptedOutputDir = new URL("../S459-integrated-v02-acceptance-review/production-replay/", import.meta.url);
const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
const toleranceCm = 0.00011;

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "u"))?.[1];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function transformedEdge(block: ReturnType<typeof recipe.draft>, roleId: string, edgeId: string,
  transform: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"][string]>) {
  const edge = pieceEdge(block.roles[roleId]!, edgeId);
  const settings = { ...transform, mirrorX: transform.mirrorX ?? false };
  return [transformFlatPoint(edgeStart(edge), settings), transformFlatPoint(edgeEnd(edge), settings)];
}

function endpointResidual(left: { x: number; y: number }[], right: { x: number; y: number }[]): number {
  const direct = Math.max(distance(left[0]!, right[0]!), distance(left[1]!, right[1]!));
  const reversed = Math.max(distance(left[0]!, right[1]!), distance(left[1]!, right[0]!));
  return Math.min(direct, reversed);
}

describe("S348 Woven source seam and accepted detail-only back display", () => {
  it("preserves source stitching while distinguishing the assembled front from detached back detail", async () => {
    const sourceMatrix = JSON.parse(await readFile(sourceMatrixUrl, "utf8")) as {
      configurations: number;
      faceRequests: number;
      cases: { caseId: string; options: Record<string, number>; faces: { kind: "FRONT_FLAT" | "BACK_FLAT"; revisionId: string }[] }[];
    };
    const acceptedMatrix = JSON.parse(await readFile(new URL("matrix.json", acceptedOutputDir), "utf8")) as {
      cases: { caseId: string; recipeId: string; faces: { kind: string; revisionId: string }[] }[];
    };
    const findings = [] as { caseId: string; face: string; revisionId: string; sourceStitchRefs: string[];
      displayMode: string; displayedJoinResidualCm?: number; detachedBandPaths: number }[];
    let maxFrontJoinResidualCm = 0;
    let backDetailInstanceCount = 0;

    for (const testCase of sourceMatrix.cases) {
      const acceptedCase = acceptedMatrix.cases.find((candidate) => candidate.caseId === testCase.caseId
        && candidate.recipeId === "woven-shirt");
      expect(acceptedCase, `${testCase.caseId}: accepted S459 replay row`).toBeDefined();
      const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
      const block = recipe.draft(STANDARD_M, options);
      const bandTop = pieceEdge(block.roles.sleeveBand!, "top");
      const sleeveHem = pieceEdge(block.roles.sleeve!, "hem");
      expect(edgeLength(bandTop)).toBeCloseTo(edgeLength(sleeveHem), 8);
      const bandStitch = block.stitches.find((stitch) => stitch.label === "Folded sleeve band ↔ sleeve hem");
      expect(bandStitch, `${testCase.caseId}: source seam`).toBeDefined();
      const sourceStitchRefs = [...bandStitch!.a.edges, ...bandStitch!.b.edges]
        .filter((ref): ref is Extract<typeof ref, { piece: string; edge: string }> => "edge" in ref)
        .map((ref) => `${ref.piece}.${ref.edge}`).sort();
      expect(sourceStitchRefs).toEqual(["sleeve.hem", "sleeveBand.top"]);

      for (const face of testCase.faces) {
        const acceptedFace = acceptedCase!.faces.find((candidate) => candidate.kind === face.kind)!;
        expect(acceptedFace.revisionId).toBe(face.revisionId);
        const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, face.revisionId)!;
        const assembly = assembleTechnicalFlatRoles("woven-shirt", block, face.kind, projection);
        const sleeveTransform = assembly.transforms.sleeve;
        const bandTransform = assembly.transforms.sleeveBand;
        expect(sleeveTransform).toBeDefined();
        expect(bandTransform).toBeDefined();
        const outputName = `${testCase.caseId}-${face.kind.toLowerCase()}.svg`;
        const svg = await readFile(new URL(outputName, acceptedOutputDir), "utf8");
        expect(svg).toContain(`data-revision-id="${face.revisionId}"`);
        const fills = [...svg.matchAll(/<path\b[^>]*data-colorway-fill-for="([^"]*component:sleeveBand:outline[^"]*)"[^>]*>/gu)];
        expect(fills.length, `${testCase.caseId}/${face.kind}: sleeve-band fill paths`).toBeGreaterThan(0);
        for (const match of fills) {
          expect(attr(match[0], "data-source-id")).toBe("pattern:woven-shirt:role:sleeveBand");
          expect(attr(match[0], "data-revision-id")).toBe(face.revisionId);
        }

        if (face.kind === "FRONT_FLAT") {
          const displayedJoinResidualCm = endpointResidual(
            transformedEdge(block, "sleeve", "hem", sleeveTransform!),
            transformedEdge(block, "sleeveBand", "top", bandTransform!),
          );
          expect(displayedJoinResidualCm, `${testCase.caseId}: assembled front join`).toBeLessThanOrEqual(toleranceCm);
          expect(fills.map((match) => match[1]).join(" ")).not.toContain("detached-detail");
          maxFrontJoinResidualCm = Math.max(maxFrontJoinResidualCm, displayedJoinResidualCm);
          findings.push({ caseId: testCase.caseId, face: face.kind, revisionId: face.revisionId,
            sourceStitchRefs, displayMode: "ASSEMBLED_SOURCE_JOIN", displayedJoinResidualCm, detachedBandPaths: 0 });
        } else {
          const detailFills = fills.filter((match) => match[1].includes("detached-detail:"));
          expect(detailFills.map((match) => match[1])).toEqual([
            "flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline:detached-detail:left",
          ]);
          expect((attr(detailFills[0]![0], "d")!.match(/Z/gu) ?? [])).toHaveLength(2);
          expect(svg).toContain('data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline:detached-detail:left"');
          expect(svg).toContain('data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline:detached-detail:right"');
          expect(svg).toContain("DETAIL ONLY—not at assembly location");
          backDetailInstanceCount += 2;
          findings.push({ caseId: testCase.caseId, face: face.kind, revisionId: face.revisionId,
            sourceStitchRefs, displayMode: "DETACHED_DETAIL_ONLY_BACK", detachedBandPaths: 2 });
        }
      }
    }

    expect(sourceMatrix.configurations).toBe(28);
    expect(sourceMatrix.faceRequests).toBe(56);
    expect(findings).toHaveLength(56);
    expect(backDetailInstanceCount).toBe(56);
    expect(maxFrontJoinResidualCm).toBeLessThanOrEqual(toleranceCm);
  });
});
