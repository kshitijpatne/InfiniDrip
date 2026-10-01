import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { WOVEN_SHIRT } from "../../../../src/drafting/recipe";
import { edgeLength, edgeStart, edgeEnd } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";

const root = resolve(import.meta.dirname, "../../../..");
const prior = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S324-woven-browser-current/matrix.json"), "utf8"));
const cases = prior.cases.filter((entry: { recipeId: string }) => entry.recipeId === "woven-shirt");
const measurements = { ...STANDARD_M };
const records = [];

for (const testCase of cases) {
  const block = WOVEN_SHIRT.draft(measurements, testCase.options);
  const revision = `s334-diagnostic:${testCase.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, revision);
  const seam = block.stitches.find((entry) => entry.label === "Woven sleeve-cap ease")!;
  const edgeRecord = (roleId: string, edgeId: string) => {
    const edge = block.roles[roleId]?.edges.find((candidate) => candidate.name === edgeId);
    return edge ? { roleId, edgeId, kind: edge.kind, lengthCm: edgeLength(edge), start: edgeStart(edge), end: edgeEnd(edge), geometry: edge } : null;
  };
  const faces = (['FRONT_FLAT', 'BACK_FLAT'] as const).map((kind) => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, kind, projection);
    const mappedSleeve = projection?.faces.find((face) => face.kind === kind)?.roles.find((role) => role.roleId === "sleeve");
    return {
      kind,
      roles: projection?.faces.find((face) => face.kind === kind)?.roles.map((role) => ({
        roleId: role.roleId, treatment: role.treatment, instanceId: role.instanceId,
        pair: role.viewPairReflection ?? null, localY: role.localYReflection ?? null,
        runs: role.roleId === "sleeve" ? role.runs : undefined,
      })),
      transforms: assembly.transforms,
      issues: assembly.issues,
      joinedStitchLabels: assembly.joinedStitchLabels,
      sleeveInstanceCount: mappedSleeve?.viewPairReflection?.quantity ?? 1,
    };
  });
  records.push({
    caseId: testCase.caseId,
    optionValues: testCase.optionValues,
    resolvedOptions: testCase.options,
    revision,
    roles: ["front", "yoke", "back", "sleeve", "sleeveBand"].map((roleId) => ({
      roleId,
      edges: block.roles[roleId]?.edges.map((edge) => edgeRecord(roleId, edge.name)),
    })),
    stitch: { label: seam.label, ease: seam.ease, a: seam.a.edges, b: seam.b.edges },
    faces,
  });
}

const output = { generatedAt: new Date().toISOString(), source: "current WOVEN_SHIRT draft and S334 projection/assembly functions",
  baseline: "S324's 28 supported Woven option configurations", configurationCount: records.length, records };
await mkdir(resolve(root, "docs/research/epic17/S334-woven-sleeve"), { recursive: true });
await writeFile(resolve(root, "docs/research/epic17/S334-woven-sleeve/source-assembly-diagnostics.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ configurations: records.length, revisions: records.map((record) => record.revision),
  issueSummary: Object.fromEntries(records.flatMap((record) => record.faces.flatMap((face) => face.issues.map((issue: { sourceId: string }) => issue.sourceId)))
    .reduce((entries, key) => entries.set(key, (entries.get(key) ?? 0) + 1), new Map<string, number>())),
  output: "docs/research/epic17/S334-woven-sleeve/source-assembly-diagnostics.json" }, null, 2));
