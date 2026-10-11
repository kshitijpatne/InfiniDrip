import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { draftPolo } from "../../../../src/drafting/polo";
import { POLO } from "../../../../src/drafting/recipe";
import { edgeLength } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { compileTechnicalFlatPomCallouts } from "../../../../src/render/technical-flat-poms";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const root = resolve(import.meta.dirname, "../../../..");
const baseline = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S331-polo-browser-final/matrix.json"), "utf8"));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const cases = [];

for (const entry of baseline.cases) {
  const block = draftPolo(STANDARD_M, entry.options);
  const revisionId = `s337-diagnostic:${entry.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId);
  const faces = [];
  for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
    const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, kind, projection);
    const poms = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind, POLO.poms, geometry.primitives);
    const faceMap = projection.faces.find((face) => face.kind === kind)!;
    const mappedSleeve = faceMap.roles.find((role) => role.roleId === "sleeve")!;
    const mappedCollars = Object.fromEntries(["outerStand", "upperCollar", "underCollar", "innerStand"].map((roleId) => {
      const role = faceMap.roles.find((candidate) => candidate.roleId === roleId);
      return [roleId, role ? { runs: role.runs, heldEdges: role.heldEdges,
        faceExcludedEdges: role.faceExcludedEdges ?? [], foldAxisReflection: role.foldAxisReflection ?? null } : null];
    }));
    const sleeveTransform = assembly.transforms.sleeve;
    const bodyRoleId = kind === "FRONT_FLAT" ? "front" : "back";
    const bodyTransform = assembly.transforms[bodyRoleId];
    const body = block.roles[bodyRoleId]!;
    const sleeve = block.roles.sleeve!;
    const capName = kind === "FRONT_FLAT" ? "capLeft" : "capRight";
    const cap = sleeve.edges.find((edge) => edge.name === capName)!;
    const armhole = body.edges.find((edge) => edge.name === "armhole")!;
    const point = (roleId: string, edge: typeof cap, endpoint: "start" | "end") => {
      const transform = assembly.transforms[roleId];
      const p = edge.kind === "line" ? edge[endpoint] : edge.curve[endpoint];
      return transform ? transformFlatPoint(p, transform) : null;
    };
    const start = point("sleeve", cap, "start");
    const end = point("sleeve", cap, "end");
    const armStart = point(bodyRoleId, armhole, "start");
    const armEnd = point(bodyRoleId, armhole, "end");
    const collarTransforms = Object.fromEntries(["outerStand", "upperCollar", "underCollar", "innerStand"]
      .filter((roleId) => assembly.transforms[roleId])
      .map((roleId) => [roleId, assembly.transforms[roleId]]));
    faces.push({ kind, revisionId, sourceRoleIds: { sleeve: "sleeve", body: bodyRoleId },
      selectedCapEdge: capName, runIds: mappedSleeve.runs.map((run) => run.edgeId),
      instanceRules: { viewPairReflection: mappedSleeve.viewPairReflection ?? null,
        localYReflection: mappedSleeve.localYReflection ?? null },
      sourceEdgeLengthsCm: { selectedCap: edgeLength(cap), sleeveCapLeft: edgeLength(sleeve.edges.find((edge) => edge.name === "capLeft")!),
        sleeveCapRight: edgeLength(sleeve.edges.find((edge) => edge.name === "capRight")!), bodyArmhole: edgeLength(armhole) },
      transformedStationsCm: { capStart: start, capEnd: end, armholeStart: armStart, armholeEnd: armEnd,
        underarmDistance: kind === "FRONT_FLAT" ? distance(start!, armEnd!) : distance(end!, armEnd!),
        shoulderDistance: kind === "FRONT_FLAT" ? distance(end!, armStart!) : distance(start!, armStart!) },
      transforms: { body: bodyTransform, sleeve: sleeveTransform, collars: collarTransforms }, mappedCollars,
      issues: assembly.issues.map((issue) => ({ code: issue.code, sourceId: issue.sourceId, message: issue.message })),
      pomCallouts: (poms.callouts ?? []).map((callout) => ({ sourceId: callout.source.sourceId, targetId: callout.anchor.primitiveId })),
      pomNotices: poms.notices.map((notice) => ({ sourceId: notice.sourceId, reason: notice.reason, message: notice.message })),
      pomIssues: poms.issues });
  }
  cases.push({ caseId: entry.caseId, options: entry.options, revisionId,
      directlyEncoded: { sleeveEdges: block.roles.sleeve!.edges, frontArmhole: block.roles.front!.edges.find((edge) => edge.name === "armhole"),
      backArmhole: block.roles.back!.edges.find((edge) => edge.name === "armhole"),
      stitches: block.stitches.filter((stitch) => /sleeve-cap|collar|stand|neckline/i.test(stitch.label)),
      collarMarks: Object.fromEntries(["outerStand", "innerStand", "upperCollar", "underCollar"].map((roleId) => [roleId,
        block.roles[roleId]?.marks ?? []])),
      collarEdges: Object.fromEntries(["front", "back", "outerStand", "innerStand", "upperCollar", "underCollar"].map((roleId) => [roleId,
        block.roles[roleId]?.edges ?? []])) }, faces });
}

const output = { generatedAt: new Date().toISOString(), basis: "current draftPolo source, S333-approved projection mapping and current assembly solver",
  configurations: cases.length, faceRequests: cases.length * 2, allProjectionMapsPresent: cases.every((entry) => entry.faces.length === 2), cases };
const folder = resolve(root, "docs/research/epic17/S337-polo-holds");
await mkdir(folder, { recursive: true });
await writeFile(resolve(folder, "source-transform-matrix.json"), `${JSON.stringify(output, null, 2)}\n`);
const summary = {};
for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) for (const metric of ["underarmDistance", "shoulderDistance"] as const) {
  const values = cases.map((entry: any) => entry.faces.find((face: any) => face.kind === kind).transformedStationsCm[metric]);
  summary[`${kind}.${metric}`] = { min: Math.min(...values), max: Math.max(...values) };
}
console.log(JSON.stringify({ configurations: cases.length, faces: cases.length * 2, summary }, null, 2));
