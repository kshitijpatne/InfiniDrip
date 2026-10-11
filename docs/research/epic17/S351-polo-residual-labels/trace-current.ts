import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { draftPolo } from "../../../../src/drafting/polo";
import { POLO } from "../../../../src/drafting/recipe";
import { edgeEnd, edgeLength, edgeStart } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "../../../../src/render/technical-flat-mapping";
import { compileTechnicalFlatPomCallouts } from "../../../../src/render/technical-flat-poms";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const root = process.cwd();
const baseline = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S331-polo-browser-final/matrix.json"), "utf8"));
const mapping = G04_TECHNICAL_FLAT_MAPPINGS.polo!;
const rows = [];

for (const entry of baseline.cases) {
  const block = draftPolo(STANDARD_M, entry.options);
  const revisionId = `s351-current:${entry.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId);
  const faces = [];
  for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, kind, projection);
    const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
    const resolveAnchor = (pom: (typeof POLO.poms)[number], sourcePoint: { x: number; y: number }) => {
      const mark = kind === "FRONT_FLAT" ? pom.frontMarkAnchor
        : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined;
      const roleId = mark?.roleId ?? (kind === "FRONT_FLAT"
        ? pom.anchorRoleId ?? mapping.pomAnchorRole
        : pom.backAnchorRoleId ?? mapping.backPomAnchorRole);
      const placement = roleId ? assembly.transforms[roleId] : undefined;
      if (!roleId || !placement) return undefined;
      const point = transformFlatPoint(sourcePoint, { offset: placement.offset,
        rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false });
      if (mark) return { targetGeometryId: `flat:polo:${kind}:mark:${mark.roleId}:${mark.markName}`,
        point, sourcePoint, sourceEntityId: `pattern:polo:mark:${mark.roleId}:${mark.markName}` };
      const edgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
      return { targetGeometryId: `flat:polo:${kind}:component:${roleId}:outline`, point, sourcePoint,
        ...(edgeId ? { sourceEntityId: `pattern:polo:role:${roleId}:edge:${edgeId}` } : {}) };
    };
    const compiled = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind,
      POLO.poms, geometry.primitives, resolveAnchor);
    const blockedPoms = [];
    for (const issue of compiled.issues) {
      if (issue.code !== "LABEL_COLLISION") continue;
      const pom = POLO.poms.find((candidate) =>
        `pom:polo:${candidate.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` === issue.sourceId);
      if (!pom) throw new Error(`Cannot resolve blocked POM ${issue.sourceId}`);
      const isolated = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind,
        [pom], geometry.primitives, resolveAnchor);
      const value = pom.measure(block);
      const sourcePoint = kind === "FRONT_FLAT" ? pom.anchor?.(block) : pom.backAnchor?.(block);
      blockedPoms.push({ sourceId: issue.sourceId, label: pom.label, code: issue.code,
        text: `${pom.label}: ${value.toFixed(1)} cm${pom.tolerance === undefined ? "" : ` (±${pom.tolerance.toFixed(1)} cm)`}`,
        anchor: isolated.callouts?.[0]?.anchor.point ?? null,
        sourcePoint: sourcePoint ?? null,
        anchorSourceEntityId: isolated.callouts?.[0]?.anchor.sourceEntityId ?? null,
        isolatedPlacement: isolated.callouts?.[0]?.labelAt ?? null,
        failedPlacementMessage: issue.message });
    }
    const blockedIds = new Set(blockedPoms.map((pom) => pom.sourceId));
    const placementDiagnostic = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind,
      POLO.poms.filter((pom) => !blockedIds.has(`pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`)),
      geometry.primitives, resolveAnchor);
    const sleeve = block.roles.sleeve!;
    const bodyRole = kind === "FRONT_FLAT" ? block.roles.front! : block.roles.back!;
    const capName = kind === "FRONT_FLAT" ? "capLeft" : "capRight";
    const cap = sleeve.edges.find((edge) => edge.name === capName)!;
    const armhole = bodyRole.edges.find((edge) => edge.name === "armhole")!;
    faces.push({ kind, revisionId, sourceEdges: { cap: capName, body: "armhole" },
      sourceLengthsCm: { cap: edgeLength(cap), armhole: edgeLength(armhole), excess: edgeLength(cap) - edgeLength(armhole) },
      sourceEndpoints: { capStart: edgeStart(cap), capEnd: edgeEnd(cap), armholeStart: edgeStart(armhole), armholeEnd: edgeEnd(armhole) },
      transformedStationsCm: {
        capStart: transformFlatPoint(edgeStart(cap), { offset: assembly.transforms.sleeve!.offset,
          rotationDegrees: assembly.transforms.sleeve!.rotationDegrees, mirrorX: assembly.transforms.sleeve!.mirrorX ?? false }),
        capEnd: transformFlatPoint(edgeEnd(cap), { offset: assembly.transforms.sleeve!.offset,
          rotationDegrees: assembly.transforms.sleeve!.rotationDegrees, mirrorX: assembly.transforms.sleeve!.mirrorX ?? false }),
        armholeStart: transformFlatPoint(edgeStart(armhole), { offset: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.offset,
          rotationDegrees: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.rotationDegrees,
          mirrorX: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.mirrorX ?? false }),
        armholeEnd: transformFlatPoint(edgeEnd(armhole), { offset: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.offset,
          rotationDegrees: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.rotationDegrees,
          mirrorX: assembly.transforms[kind === "FRONT_FLAT" ? "front" : "back"]!.mirrorX ?? false }),
      },
      assemblyIssues: assembly.issues.map((issue) => ({ code: issue.code, sourceId: issue.sourceId, message: issue.message })),
      blockedPoms, emittedCallouts: (placementDiagnostic.callouts ?? []).map((callout) => ({ sourceId: callout.source.sourceId,
        text: callout.text, anchor: callout.anchor.point, labelAt: callout.labelAt })),
    });
  }
  rows.push({ caseId: entry.caseId, options: entry.options, faces });
}

const report = { generatedAt: new Date().toISOString(), basis: "Current S351 HEAD draftPolo, projection map, rigid assembly and POM compiler; exact option cases from S331; diagnostic revision IDs are synthetic and not production acceptance output.",
  configurations: rows.length, faces: rows.length * 2, rows };
await writeFile(resolve(root, "docs/research/epic17/S351-polo-residual-labels/current-source-matrix.json"),
  `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: report.configurations, faces: report.faces,
  blockedPomCount: rows.flatMap((row) => row.faces).flatMap((face) => face.blockedPoms).length,
  assemblyIssueCount: rows.flatMap((row) => row.faces).flatMap((face) => face.assemblyIssues)
    .filter((issue) => issue.sourceId === "stitch:Sleeve-cap ease").length,
  output: "current-source-matrix.json" }, null, 2));
