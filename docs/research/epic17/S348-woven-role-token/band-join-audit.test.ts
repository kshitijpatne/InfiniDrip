import { readFile, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeStart, edgeLength, pieceEdge } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";

const replayDir = new URL("./production-replay/", import.meta.url);
const toleranceCm = 0.00011;
const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "u"))?.[1];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function intersection(a: { x: number; y: number }, b: { x: number; y: number },
  c: { x: number; y: number }, d: { x: number; y: number }) {
  const rx = b.x - a.x; const ry = b.y - a.y;
  const sx = d.x - c.x; const sy = d.y - c.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-10) return undefined;
  const qx = c.x - a.x; const qy = c.y - a.y;
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  return t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8
    ? { x: a.x + t * rx, y: a.y + t * ry }
    : undefined;
}

function contourPoints(path: string) {
  return path.split(/\s+Z\s*/u).filter(Boolean).map((subpath) => {
    const matches = [...subpath.matchAll(/(?:^|\s)(?:M|L)\s*(-?[\d.]+)\s+(-?[\d.]+)/gu)];
    return matches.map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
  });
}

function contourCrossings(left: { x: number; y: number }[], right: { x: number; y: number }[]) {
  const crossings: { leftEdge: number; rightEdge: number; point: { x: number; y: number } }[] = [];
  for (let leftEdge = 0; leftEdge < left.length; leftEdge += 1) {
    for (let rightEdge = 0; rightEdge < right.length; rightEdge += 1) {
      const point = intersection(left[leftEdge]!, left[(leftEdge + 1) % left.length]!,
        right[rightEdge]!, right[(rightEdge + 1) % right.length]!);
      if (point) crossings.push({ leftEdge, rightEdge, point });
    }
  }
  return crossings;
}

describe("S348 production Woven band join audit", () => {
  it("matches every rendered sleeveBand top to its source sleeve hem in all options and faces", async () => {
    const matrix = JSON.parse(await readFile(new URL("matrix.json", replayDir), "utf8")) as {
      configurations: number;
      faceRequests: number;
      cases: { caseId: string; options: Record<string, number>; faces: { kind: "FRONT_FLAT" | "BACK_FLAT"; revisionId: string }[] }[];
    };
    const findings: unknown[] = [];
    let maxJoinResidualCm = 0;
    let maxRenderedJoinResidualCm = 0;
    let mirroredBandTopEdges = 0;

    for (const testCase of matrix.cases) {
      const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
      const block = recipe.draft(STANDARD_M, options);
      const bandTop = pieceEdge(block.roles.sleeveBand!, "top");
      const sleeveHem = pieceEdge(block.roles.sleeve!, "hem");
      expect(edgeLength(bandTop)).toBeCloseTo(edgeLength(sleeveHem), 8);

      for (const face of testCase.faces) {
        const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, face.revisionId)!;
        const assembly = assembleTechnicalFlatRoles("woven-shirt", block, face.kind, projection);
        const bandTransform = assembly.transforms.sleeveBand;
        const sleeveTransform = assembly.transforms.sleeve;
        expect(bandTransform, `${testCase.caseId}/${face.kind}: band transform`).toBeDefined();
        expect(sleeveTransform, `${testCase.caseId}/${face.kind}: sleeve transform`).toBeDefined();
        const transform = (point: { x: number; y: number }, value: typeof bandTransform) =>
          transformFlatPoint(point, { ...value!, mirrorX: value!.mirrorX ?? false });
        const expectedTop = [transform(edgeStart(bandTop), bandTransform), transform(edgeEnd(bandTop), bandTransform)];
        const expectedHem = [transform(edgeStart(sleeveHem), sleeveTransform), transform(edgeEnd(sleeveHem), sleeveTransform)];
        const endpointResiduals = [distance(expectedTop[0]!, expectedHem[0]!), distance(expectedTop[1]!, expectedHem[1]!)];
        const reversedResiduals = [distance(expectedTop[0]!, expectedHem[1]!), distance(expectedTop[1]!, expectedHem[0]!)];
        const sourceJoinResidualCm = Math.min(Math.max(...endpointResiduals), Math.max(...reversedResiduals));
        maxJoinResidualCm = Math.max(maxJoinResidualCm, sourceJoinResidualCm);
        expect(sourceJoinResidualCm, `${testCase.caseId}/${face.kind}: source seam join`).toBeLessThanOrEqual(1e-8);

        const svg = await readFile(new URL(`${testCase.caseId}-${face.kind.toLowerCase()}.svg`, replayDir), "utf8");
        const fillTag = (svg.match(/<path\b[^>]*data-colorway-fill-for="[^"]*component:sleeveBand:outline"[^>]*>/u) ?? [])[0];
        expect(fillTag, `${testCase.caseId}/${face.kind}: rendered band outline`).toBeDefined();
        expect(attr(fillTag!, "data-source-id")).toBe("pattern:woven-shirt:role:sleeveBand");
        expect(attr(fillTag!, "data-revision-id")).toBe(face.revisionId);
        const path = attr(fillTag!, "d") ?? "";
        const renderedTopEdges = [...path.matchAll(/M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+L\s*(-?[\d.]+)\s+(-?[\d.]+)/gu)]
          .map((match) => [{ x: Number(match[1]), y: Number(match[2]) }, { x: Number(match[3]), y: Number(match[4]) }]);
        expect(renderedTopEdges, `${testCase.caseId}/${face.kind}: mirrored band count`).toHaveLength(2);
        const contours = contourPoints(path);
        expect(contours, `${testCase.caseId}/${face.kind}: rendered band contour count`).toHaveLength(2);
        const bandPairCrossings = contourCrossings(contours[0]!, contours[1]!);
        expect(bandPairCrossings.length > 0, `${testCase.caseId}/${face.kind}: paired band crossing evidence`)
          .toBe(face.kind === "BACK_FLAT");
        const mirroredExpected = [expectedTop, expectedTop.map((point) => ({ x: -point.x, y: point.y }))];
        const renderedJoinResiduals: number[] = [];
        for (const expectedEdge of mirroredExpected) {
          const residuals = renderedTopEdges.map((edge) => {
            const direct = Math.max(distance(edge[0]!, expectedEdge[0]!), distance(edge[1]!, expectedEdge[1]!));
            const reverse = Math.max(distance(edge[0]!, expectedEdge[1]!), distance(edge[1]!, expectedEdge[0]!));
            return Math.min(direct, reverse);
          });
          const renderedResidualCm = Math.min(...residuals);
          renderedJoinResiduals.push(renderedResidualCm);
          maxRenderedJoinResidualCm = Math.max(maxRenderedJoinResidualCm, renderedResidualCm);
          expect(renderedResidualCm, `${testCase.caseId}/${face.kind}: rendered join`).toBeLessThanOrEqual(toleranceCm);
        }
        mirroredBandTopEdges += renderedTopEdges.length;
        findings.push({ caseId: testCase.caseId, face: face.kind, revisionId: face.revisionId,
          sourceSleeveHem: expectedHem, sourceBandTop: expectedTop, sourceJoinResidualCm,
          renderedMirroredBandTopEdges: renderedTopEdges, renderedJoinResiduals,
          pairedBandContourCrossings: bandPairCrossings });
      }
    }

    expect(matrix.configurations).toBe(28);
    expect(matrix.faceRequests).toBe(56);
    expect(findings).toHaveLength(56);
    expect(mirroredBandTopEdges).toBe(112);
    const report = { basis: "each production Chromium SVG compared with the sleeve hem and band top transformed from that exact option draft and face assembly",
      toleranceCm, configurations: matrix.configurations, faces: matrix.faceRequests, mirroredBandTopEdges,
      maxSourceJoinResidualCm: maxJoinResidualCm, maxRenderedJoinResidualCm, findings };
    await writeFile(new URL("band-join-audit.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  });
});
