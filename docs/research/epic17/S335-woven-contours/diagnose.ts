import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { WOVEN_SHIRT } from "../../../../src/drafting/recipe";
import { edgeEnd, edgeStart, edgeLength } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { appendApprovedViewPairReflection, appendOppositeSideReflection, appendPhysicalPairReflection,
  placeTechnicalFlatPrimitive, reflectFoldPrimitive } from "../../../../src/render/technical-flat-live";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPrimitive } from "../../../../src/render/technical-flat-transform";
import type { FlatPoint, FlatPathCommand, TechnicalFlatPrimitive } from "../../../../src/render/technical-flat";

const root = resolve(import.meta.dirname, "../../../..");
const base = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S324-woven-browser-current/matrix.json"), "utf8"));
const cases = base.cases.filter((item: { recipeId: string }) => item.recipeId === "woven-shirt");
const pointKey = (point: FlatPoint) => `${Number(point.x.toFixed(4)).toString()},${Number(point.y.toFixed(4)).toString()}`;
const roleFor = (primitive: TechnicalFlatPrimitive) => {
  const match = /^pattern:[^:]+:role:([^:]+)(?::edge:[^:]+)?$/u.exec(primitive.source.sourceId)
    ?? /^view:[^:]+:role:([^:]+):/u.exec(primitive.source.sourceId);
  return match?.[1] ?? null;
};
const records = [];
for (const testCase of cases) {
  const block = WOVEN_SHIRT.draft(STANDARD_M, testCase.options);
  const revisionId = `s335-contour-diagnostic:${testCase.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, revisionId);
  if (!projection) throw new Error(`${testCase.caseId}: Woven projection metadata did not compile.`);
  const geometry = compileTechnicalFlatSourceGeometry("woven-shirt", block, revisionId, "FRONT_FLAT", projection);
  if (geometry.issues.length) throw new Error(`${testCase.caseId}: Woven source geometry did not compile: ${JSON.stringify(geometry.issues)}`);
  const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT", projection);
  const roles = projection.faces.find((face) => face.kind === "FRONT_FLAT")!.roles;
  const silhouettePrimitives = geometry.primitives.filter((primitive) => primitive.layer === "GARMENT_SILHOUETTE");
  const assembledPrimitives = [];
  for (const primitive of silhouettePrimitives) {
    const roleId = roleFor(primitive);
    const roleMapping = roles.find((role) => role.roleId === roleId);
    const placement = assembly.transforms[roleId];
    const placed = placeTechnicalFlatPrimitive(primitive, roleId, placement)[0]?.placed;
    if (!placed || !roleMapping) throw new Error(`${testCase.caseId}: ${primitive.id} has no projected role placement.`);
    if (appendOppositeSideReflection(assembledPrimitives, placed, roleMapping.oppositeSideReflection,
      block, assembly.transforms, [])) continue;
    assembledPrimitives.push(placed);
    if (roleMapping.foldAxisReflection) {
      const reflected = reflectFoldPrimitive(primitive, roleMapping.foldAxisReflection.edgeId);
      if (reflected && placement) assembledPrimitives.push(transformFlatPrimitive(reflected, { offset: placement.offset,
        rotationDegrees: placement.rotationDegrees, mirrorX: true }));
    } else {
      appendApprovedViewPairReflection(assembledPrimitives, placed, roleMapping.viewPairReflection, block, assembly.transforms, []);
      if (!roleMapping.viewPairReflection) appendPhysicalPairReflection(assembledPrimitives, primitive,
        roleMapping.physicalPairReflection, placement);
    }
  }
  const targetRoleIds = [...new Set(silhouettePrimitives.map((primitive) => roleFor(primitive)).filter(Boolean))];
  const roleRecords = targetRoleIds.map((roleId) => {
    const primitives = assembledPrimitives.filter((primitive) => primitive.kind === "path"
      && primitive.layer === "GARMENT_SILHOUETTE" && roleFor(primitive) === roleId);
    const degrees = new Map<string, { point: FlatPoint; edges: Array<{ primitiveId: string; sourceEdgeId?: string; endpoint: "start" | "end" }> }>();
    const paths = primitives.map((primitive) => {
      if (primitive.kind !== "path") return null;
      const segments: Array<{ edgeId?: string; from: FlatPoint; to: FlatPoint }> = [];
      let current: FlatPoint | null = null;
      let sourceIndex = -1;
      for (const command of primitive.commands as readonly FlatPathCommand[]) {
        if (command.op === "move") { current = command.point; sourceIndex += 1; }
        else if (command.op === "line" || command.op === "cubic") {
          if (!current) throw new Error(`move missing in ${primitive.id}`);
          segments.push({ edgeId: primitive.sourceEdgeIds?.[sourceIndex], from: current, to: command.point });
          current = command.point;
        }
      }
      for (const segment of segments) for (const [point, label] of [[segment.from, "start"], [segment.to, "end"]] as const) {
        const key = pointKey(point);
        const node = degrees.get(key) ?? { point, edges: [] };
        node.edges.push({ primitiveId: primitive.id, sourceEdgeId: segment.edgeId, endpoint: label });
        degrees.set(key, node);
      }
      return { id: primitive.id, sourceId: primitive.source.sourceId, revisionId: primitive.source.revisionId,
        colorwayBoundaryOnly: primitive.colorwayBoundaryOnly ?? false, sourceEdgeIds: primitive.sourceEdgeIds ?? [],
        commands: primitive.commands, segments };
    });
    const serializedDegreeCounts = [...degrees.values()].reduce<Record<string, number>>((counts, node) => {
      const degree = String(node.edges.length);
      counts[degree] = (counts[degree] ?? 0) + 1;
      return counts;
    }, {});
    return { roleId, sourcePieceEdges: block.roles[roleId]?.edges.map((edge) => ({ edgeId: edge.name,
      kind: edge.kind, lengthCm: edgeLength(edge), start: edgeStart(edge), end: edgeEnd(edge) })) ?? [],
      serializedNodeCount: degrees.size, serializedDegreeCounts,
      paths, openOrOverconnectedSerializedEndpoints: [...degrees.values()].filter((node) => node.edges.length !== 2)
        .map((node) => ({ point: node.point, serializedKey: pointKey(node.point), degree: node.edges.length, edges: node.edges })) };
  });
  records.push({ caseId: testCase.caseId, options: testCase.options, revisionId, kind: "FRONT_FLAT",
    colorwayTargetRoleIds: targetRoleIds, sourceStitches: block.stitches.map((stitch) => ({ label: stitch.label,
      a: stitch.a.edges, b: stitch.b.edges })), roles: roleRecords });
}
const compactRecords = records.map((record) => record.caseId === "woven-shirt-default" ? record : ({
  caseId: record.caseId,
  options: record.options,
  revisionId: record.revisionId,
  kind: record.kind,
  colorwayTargetRoleIds: record.colorwayTargetRoleIds,
  sourceStitchCount: record.sourceStitches.length,
  roles: record.roles.map((role) => ({
    roleId: role.roleId,
    sourcePieceEdges: role.sourcePieceEdges.map((edge) => edge.edgeId),
    paths: role.paths.map((path) => path ? ({ id: path.id, sourceId: path.sourceId, revisionId: path.revisionId,
      colorwayBoundaryOnly: path.colorwayBoundaryOnly, sourceEdgeIds: path.sourceEdgeIds }) : null),
    serializedNodeCount: role.serializedNodeCount,
    serializedDegreeCounts: role.serializedDegreeCounts,
    openOrOverconnectedSerializedEndpoints: role.openOrOverconnectedSerializedEndpoints,
  })),
}));
const output = { generatedAt: new Date().toISOString(), source: "current WOVEN_SHIRT exact draft and compiled FRONT_FLAT primitives",
  baseline: "S324's 28 supported Woven option configurations; default retains full endpoint geometry for the annotated overlay",
  configurationCount: records.length, records: compactRecords };
const dir = resolve(root, "docs/research/epic17/S335-woven-contours");
await mkdir(dir, { recursive: true });
await writeFile(resolve(dir, "source-contour-topology.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ configurations: records.length, targets: records[0]?.colorwayTargetRoleIds,
  output: "docs/research/epic17/S335-woven-contours/source-contour-topology.json" }, null, 2));
