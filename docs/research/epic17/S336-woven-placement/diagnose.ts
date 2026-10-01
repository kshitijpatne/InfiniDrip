import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { WOVEN_SHIRT } from "../../../../src/drafting/recipe";
import { edgeLength } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const root = resolve(import.meta.dirname, "../../../..");
const prior = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S324-woven-browser-current/matrix.json"), "utf8"));
const cases = prior.cases.filter((entry: { recipeId: string }) => entry.recipeId === "woven-shirt");
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const records = [];

for (const testCase of cases) {
  const block = WOVEN_SHIRT.draft(STANDARD_M, testCase.options);
  const revision = `s336-diagnostic:${testCase.caseId}`;
  const sourceProjection = createG04TechnicalFlatProjectionMap("woven-shirt", block, revision)!;
  const priorProjection = { ...sourceProjection, faces: sourceProjection.faces.map((face) => ({ ...face,
    roles: face.roles.map((role) => role.roleId === "outerStand" ? { ...role, reversedStitchEdges: [] } : role) })) };
  const currentFront = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT", priorProjection);
  const currentBack = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT", priorProjection);
  const candidateFront = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT", sourceProjection);
  const candidateBack = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT", sourceProjection);
  const at = (roleId: string, edgeId: string, end: "start" | "end", face: typeof currentFront) => {
    const edge = block.roles[roleId]?.edges.find((candidate) => candidate.name === edgeId);
    const transform = face.transforms[roleId];
    if (!edge || !transform) return null;
    const point = edge.kind === "line" ? edge[end] : edge.curve[end];
    return transformFlatPoint(point, transform);
  };
  const interpolateLine = (roleId: string, edgeId: string, fraction: number, face: typeof currentFront) => {
    const edge = block.roles[roleId]?.edges.find((candidate) => candidate.name === edgeId);
    const transform = face.transforms[roleId];
    if (!edge || edge.kind !== "line" || !transform) return null;
    return transformFlatPoint({ x: edge.start.x + (edge.end.x - edge.start.x) * fraction,
      y: edge.start.y + (edge.end.y - edge.start.y) * fraction }, transform);
  };
  const frontLength = edgeLength(block.roles.front!.edges.find((edge) => edge.name === "neckline")!);
  const backRole = block.roles.yoke ? "yoke" : "back";
  const backLength = edgeLength(block.roles[backRole]!.edges.find((edge) => edge.name === "neckline")!);
  const standLength = edgeLength(block.roles.outerStand!.edges.find((edge) => edge.name === "neckline")!);
  const standFraction = frontLength / (frontLength + backLength);
  const sleeveStitch = block.stitches.find((stitch) => stitch.label === "Woven sleeve-cap ease")!;
  const sourceEdges = Object.fromEntries(["front", "yoke", "back", "sleeve", "outerStand"].map((roleId) => [roleId,
    Object.fromEntries((block.roles[roleId]?.edges ?? [])
      .filter((edge) => ["armhole", "armholeUpper", "armholeLower", "capLeft", "capRight", "neckline", "centerBack", "frontEnd"].includes(edge.name))
      .map((edge) => [edge.name, edge]))]));
  records.push({
    caseId: testCase.caseId,
    resolvedOptions: testCase.options,
    revision,
    directlyEncoded: {
      sleeveStitch: { a: sleeveStitch.a.edges, b: sleeveStitch.b.edges, easeCm: sleeveStitch.ease,
        totalCapLengthCm: edgeLength(block.roles.sleeve!.edges.find((edge) => edge.name === "capLeft")!)
          + edgeLength(block.roles.sleeve!.edges.find((edge) => edge.name === "capRight")!),
        totalBodyLengthCm: ["front", "yoke", "back"].reduce((sum, roleId) => {
          const edgeName = roleId === "front" ? "armhole" : roleId === "yoke" ? "armholeUpper" : "armholeLower";
          const edge = block.roles[roleId]?.edges.find((candidate) => candidate.name === edgeName);
          return sum + (edge ? edgeLength(edge) : 0);
        }, 0) },
      necklineStitch: block.stitches.find((stitch) => stitch.label === "Outer stand ↔ woven neckline"),
      standLengthCm: standLength, frontNecklineLengthCm: frontLength, backNecklineLengthCm: backLength,
    },
    sourceEdges,
    exactViewStationDistancesCm: Object.fromEntries(["beforeWovenNecklineTraversal", "sourceBackedWovenNecklineTraversal"].map((variant) => {
      const front = variant === "beforeWovenNecklineTraversal" ? currentFront : candidateFront;
      const back = variant === "beforeWovenNecklineTraversal" ? currentBack : candidateBack;
      return [variant, {
        frontCapUnderarmToFrontArmhole: distance(at("sleeve", "capLeft", "start", front)!, at("front", "armhole", "end", front)! ),
        frontCapCrownToFrontShoulder: distance(at("sleeve", "capLeft", "end", front)!, at("front", "armhole", "start", front)! ),
        backCapCrownToYokeShoulder: distance(at("sleeve", "capRight", "start", back)!, at("yoke", "armholeUpper", "start", back)! ),
        backCapUnderarmToBackUnderarm: distance(at("sleeve", "capRight", "end", back)!, at("back", "armholeLower", "end", back)! ),
        frontStandCFToFrontCF: distance(at("outerStand", "neckline", "start", front)!, at("front", "neckline", "start", front)! ),
        frontStandShoulderStationToFrontShoulder: distance(interpolateLine("outerStand", "neckline", standFraction, front)!, at("front", "neckline", "end", front)! ),
        backStandShoulderStationToYokeShoulder: distance(interpolateLine("outerStand", "neckline", standFraction, back)!, at("yoke", "neckline", "end", back)! ),
        backStandCBToYokeCB: distance(at("outerStand", "neckline", "end", back)!, at("yoke", "neckline", "start", back)! ),
      }];
    })),
    transforms: { current: { front: currentFront.transforms, back: currentBack.transforms },
      candidate: { front: candidateFront.transforms, back: candidateBack.transforms } },
    issues: { current: { front: currentFront.issues, back: currentBack.issues },
      candidate: { front: candidateFront.issues, back: candidateBack.issues } },
  });
}

const output = { generatedAt: new Date().toISOString(), source: "current WOVEN_SHIRT draft, approved S321 projection map, and S336 assembly implementation",
  configurations: records.length, records };
await mkdir(resolve(root, "docs/research/epic17/S336-woven-placement"), { recursive: true });
await writeFile(resolve(root, "docs/research/epic17/S336-woven-placement/source-assembly-matrix.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ configurations: records.length,
  variants: Object.fromEntries(["beforeWovenNecklineTraversal", "sourceBackedWovenNecklineTraversal"].map((variant) => [variant,
    Object.fromEntries(Object.keys(records[0].exactViewStationDistancesCm[variant]).map((key) => [key, {
      min: Math.min(...records.map((record: any) => record.exactViewStationDistancesCm[variant][key])),
      max: Math.max(...records.map((record: any) => record.exactViewStationDistancesCm[variant][key])),
    }]))])) }, null, 2));
