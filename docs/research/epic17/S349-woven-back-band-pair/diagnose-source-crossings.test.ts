import { readFile, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeStart, edgeLength, pieceEdge } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const s348 = new URL("../S348-woven-role-token/", import.meta.url);
const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
const point = (value: { x: number; y: number }) => ({ x: value.x, y: value.y });

function placedEdge(block: ReturnType<typeof recipe.draft>, roleId: string, edgeId: string,
  transform: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"][string]>) {
  const edge = pieceEdge(block.roles[roleId]!, edgeId);
  return { source: [point(edgeStart(edge)), point(edgeEnd(edge))],
    view: [transformFlatPoint(edgeStart(edge), { ...transform, mirrorX: transform.mirrorX ?? false }),
      transformFlatPoint(edgeEnd(edge), { ...transform, mirrorX: transform.mirrorX ?? false })],
    lengthCm: edgeLength(edge) };
}

describe("S349 Woven sleeve/band back crossing source trace", () => {
  it("crosswalks every production option to its source interfaces and current view pair", async () => {
    const matrix = JSON.parse(await readFile(new URL("production-replay/matrix.json", s348), "utf8"));
    const bandAudit = JSON.parse(await readFile(new URL("band-join-audit.json", s348), "utf8"));
    const output = [];
    for (const testCase of matrix.cases) {
      const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
      const block = recipe.draft(STANDARD_M, options);
      const stitches = block.stitches.filter((stitch) => stitch.label === "Woven sleeve-cap ease"
        || stitch.label === "Folded sleeve band ↔ sleeve hem");
      expect(stitches).toHaveLength(2);
      const faceRecords = [];
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const productionFace = testCase.faces.find((face: { kind: string }) => face.kind === kind)!;
        const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, productionFace.revisionId)!;
        const assembly = assembleTechnicalFlatRoles("woven-shirt", block, kind, projection);
        const sleeveTransform = assembly.transforms.sleeve!;
        const bandTransform = assembly.transforms.sleeveBand!;
        const hem = placedEdge(block, "sleeve", "hem", sleeveTransform);
        const bandTop = placedEdge(block, "sleeveBand", "top", bandTransform);
        const pointResiduals = hem.view.map((endpoint, index) => Math.hypot(
          endpoint.x - bandTop.view[index]!.x, endpoint.y - bandTop.view[index]!.y));
        expect(Math.max(...pointResiduals), `${testCase.caseId}/${kind}: joined source interface`).toBeLessThanOrEqual(1e-8);
        const projectedSleeve = projection.faces.find((face) => face.kind === kind)!.roles.find((role) => role.roleId === "sleeve")!;
        const projectedBand = projection.faces.find((face) => face.kind === kind)!.roles.find((role) => role.roleId === "sleeveBand")!;
        const crossings = bandAudit.findings.find((finding: { caseId: string; face: string }) =>
          finding.caseId === testCase.caseId && finding.face === kind)!.pairedBandContourCrossings;
        expect(crossings.length, `${testCase.caseId}/${kind}: rendered crossing count`).toBe(kind === "BACK_FLAT" ? 4 : 0);
        faceRecords.push({ kind, revisionId: productionFace.revisionId,
          roleTransforms: { sleeve: sleeveTransform, sleeveBand: bandTransform },
          edges: { sleeveCapLeft: placedEdge(block, "sleeve", "capLeft", sleeveTransform),
            sleeveCapRight: placedEdge(block, "sleeve", "capRight", sleeveTransform),
            sleeveSideLeft: placedEdge(block, "sleeve", "sideLeft", sleeveTransform),
            sleeveSideRight: placedEdge(block, "sleeve", "sideRight", sleeveTransform),
            sleeveHem: hem, sleeveBandTop: bandTop },
          bodyCenterAxis: placedEdge(block, kind === "FRONT_FLAT" ? "front" : "back",
            kind === "FRONT_FLAT" ? "centerFront" : "centerBack",
            assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!),
          pairMappings: { sleeve: projectedSleeve.viewPairReflection, sleeveRuns: projectedSleeve.runs,
            band: projectedBand.viewPairReflection, bandFoldMarks: block.roles.sleeveBand!.marks?.map((mark) => mark.name) ?? [] },
          renderedBandPairIntersections: crossings, seamEndpointResidualsCm: pointResiduals });
      }
      output.push({ caseId: testCase.caseId, options: testCase.options,
        source: { sleeveOnFold: block.roles.sleeve!.onFold, sleeveMarks: block.roles.sleeve!.marks?.map((mark) => mark.name) ?? [],
          sleeveBandOnFold: block.roles.sleeveBand!.onFold, sleeveBandDepthCm: options.sleeveBandDepth,
          stitchOrder: stitches.map((stitch) => ({ label: stitch.label,
            a: stitch.a.edges.map((ref) => ({ ...ref })), b: stitch.b.edges.map((ref) => ({ ...ref })), ease: stitch.ease ?? null })) },
        faces: faceRecords });
    }
    expect(output).toHaveLength(28);
    const report = { basis: "S348 emitted SVGs and S348 source/output seam audit; exact recipe block and approved projection map redrafted per option and face",
      configurations: output.length, faces: output.length * 2, sourceSeamResidualMaxCm: Math.max(...output.flatMap((entry) => entry.faces.map((face) => Math.max(...face.seamEndpointResidualsCm)))),
      backBandPairIntersections: output.flatMap((entry) => entry.faces.filter((face) => face.kind === "BACK_FLAT")
        .map((face) => ({ caseId: entry.caseId, points: face.renderedBandPairIntersections.map((crossing) => crossing.point) }))),
      configurationsByOption: output };
    await writeFile(new URL("source-crossing-crosswalk.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  });
});
