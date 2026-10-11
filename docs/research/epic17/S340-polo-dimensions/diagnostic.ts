import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeStart } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "../../../../src/render/technical-flat-mapping";
import { compileTechnicalFlatPomCallouts } from "../../../../src/render/technical-flat-poms";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { appendApprovedViewPairReflection, appendOppositeSideReflection, appendPhysicalPairReflection, mapPoloDimensionCallouts,
  placeTechnicalFlatPrimitive, reflectFoldPrimitive, reflectPrimitiveAcrossLine, technicalFlatPrimitiveRole } from "../../../../src/render/technical-flat-live";
import { transformFlatPoint, transformFlatPrimitive } from "../../../../src/render/technical-flat-transform";
import { TECHNICAL_FLAT_SCHEMA_VERSION, type TechnicalFlatPrimitive, type TechnicalFlatView,
  type TechnicalFlatViewKind } from "../../../../src/render/technical-flat";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";

const folder = dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const mapping = G04_TECHNICAL_FLAT_MAPPINGS.polo!;
const matrix: unknown[] = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });

try {
  for (const entry of baseline.cases) {
    const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...entry.options });
    const revisionId = `s338-diagnostic:${entry.caseId}`;
    const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId);
    const faces = [];
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const satisfies readonly TechnicalFlatViewKind[]) {
      const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, kind, projection);
      const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
      const resolveAnchor = (pom: (typeof recipe.poms)[number], point: { x: number; y: number }) => {
        const mark = kind === "FRONT_FLAT" ? pom.frontMarkAnchor
          : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined;
        const roleId = mark?.roleId ?? (kind === "FRONT_FLAT"
          ? pom.anchorRoleId ?? mapping.pomAnchorRole
          : pom.backAnchorRoleId ?? mapping.backPomAnchorRole);
        const placement = roleId ? assembly.transforms[roleId] : undefined;
        if (!roleId || !placement) return undefined;
        if (mark) return {
          targetGeometryId: `flat:polo:${kind}:mark:${mark.roleId}:${mark.markName}`,
          point: transformFlatPoint(point, { offset: placement.offset, rotationDegrees: placement.rotationDegrees,
            mirrorX: placement.mirrorX ?? false }),
          sourcePoint: point, sourceEntityId: `pattern:polo:mark:${mark.roleId}:${mark.markName}`,
        };
        const edgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
        return {
          targetGeometryId: `flat:polo:${kind}:component:${roleId}:outline`,
          point: transformFlatPoint(point, { offset: placement.offset, rotationDegrees: placement.rotationDegrees,
            mirrorX: placement.mirrorX ?? false }),
          sourcePoint: point,
          ...(edgeId ? { sourceEntityId: `pattern:polo:role:${roleId}:edge:${edgeId}` } : {}),
        };
      };
      const allPoms = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind, recipe.poms, geometry.primitives, resolveAnchor);
      const blockedIds = new Set(allPoms.issues.filter((issue) => issue.code === "LABEL_COLLISION").map((issue) => issue.sourceId));
      const diagnosticPoms = blockedIds.size === 0 ? allPoms : compileTechnicalFlatPomCallouts("polo", block, revisionId, kind,
        recipe.poms.filter((pom) => !blockedIds.has(`pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`)),
        geometry.primitives, resolveAnchor);
      const faceRoleIds = mapping.faces.find((face) => face.kind === kind)!.roles.map((role) => role.roleId);
      const transformed: TechnicalFlatPrimitive[] = [];
      const transformIssues: string[] = [];
      for (const primitive of geometry.primitives) {
        const roleId = technicalFlatPrimitiveRole(primitive, geometry.primitives, faceRoleIds);
        const placement = assembly.transforms[roleId];
        const placed = placeTechnicalFlatPrimitive(primitive, roleId, placement, []).map((item) => item.placed);
        for (const placedPrimitive of placed) {
          const faceRole = projection.faces.find((face) => face.kind === kind)?.roles.find((role) => role.roleId === roleId);
          const oppositeSide = faceRole?.oppositeSideReflection;
          if (appendOppositeSideReflection(transformed, placedPrimitive, oppositeSide, block,
            { ...assembly.transforms }, [])) continue;
          transformed.push(placedPrimitive);
          const fold = faceRole?.foldAxisReflection;
          if (fold) {
            if (fold.axisRoleId) {
              const axisPlacement = assembly.transforms[fold.axisRoleId];
              const axisEdge = block.roles[fold.axisRoleId]?.edges.find((edge) => edge.name === fold.edgeId);
              if (axisPlacement && axisEdge) {
                const start = transformFlatPoint(edgeStart(axisEdge), { offset: axisPlacement.offset,
                  rotationDegrees: axisPlacement.rotationDegrees, mirrorX: axisPlacement.mirrorX ?? false });
                const end = transformFlatPoint(edgeEnd(axisEdge), { offset: axisPlacement.offset,
                  rotationDegrees: axisPlacement.rotationDegrees, mirrorX: axisPlacement.mirrorX ?? false });
                const mirrored = reflectPrimitiveAcrossLine(placedPrimitive, start, end);
                if (mirrored) transformed.push(mirrored);
              }
            } else if (placement) {
              const mirrored = reflectFoldPrimitive(primitive, fold.edgeId);
              if (mirrored) transformed.push(transformFlatPrimitive(mirrored, { offset: placement.offset,
                rotationDegrees: placement.rotationDegrees, mirrorX: true }));
            }
          } else {
            const viewPair = faceRole?.viewPairReflection;
            appendApprovedViewPairReflection(transformed, placedPrimitive, viewPair, block, assembly.transforms, []);
            const physicalPair = faceRole?.physicalPairReflection;
            if (!viewPair) appendPhysicalPairReflection(transformed, primitive, physicalPair, placement);
          }
        }
      }
      const mappedDimensions = mapPoloDimensionCallouts(block, kind, recipe.poms,
        diagnosticPoms.callouts ?? [], assembly.transforms);
      const callouts = mappedDimensions.callouts;
      const view: TechnicalFlatView = { schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION,
        viewId: `polo:${kind.toLowerCase()}:${revisionId}`, revisionId, recipeId: "polo", kind, units: "cm",
        primitives: [...transformed, ...callouts], notices: diagnosticPoms.notices };
      const rendered = renderTechnicalFlatSvg(view, { measureText: (text, fontSizeCm) => ({
        widthCm: text.length * fontSizeCm * 0.35, ascentCm: fontSizeCm * 0.7, descentCm: fontSizeCm * 0.2,
      }), title: `Polo ${kind} source-mapped POM diagnostic — ${entry.caseId}` });
      if (entry.caseId === "polo-default" && rendered.svg) {
        const svgPath = join(folder, `polo-default-${kind.toLowerCase()}-pom-diagnostic.svg`);
        await writeFile(svgPath, rendered.svg);
        await page.setContent(rendered.svg, { waitUntil: "load" });
        const svg = page.locator("svg");
        await svg.screenshot({ path: join(folder, `polo-default-${kind.toLowerCase()}-pom-diagnostic.png`) });
      }
      faces.push({ kind, revisionId, sourceGeometryCount: geometry.primitives.length,
        transformedGeometryCount: transformed.length, candidateCalloutCount: callouts.length,
        mappingIssues: geometry.issues.map((issue) => ({ sourceId: issue.sourceId, message: issue.message })),
        assemblyIssues: assembly.issues.map((issue) => ({ sourceId: issue.sourceId, message: issue.message })),
        blockedPoms: allPoms.issues.map((issue) => ({ sourceId: issue.sourceId, code: issue.code, message: issue.message })),
        dimensionMappingIssues: mappedDimensions.issues,
        callouts: callouts.map((callout) => ({ sourceId: callout.source.sourceId,
          text: callout.text, targetId: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId,
          anchor: callout.anchor.point, labelAt: callout.labelAt, dimensionReferences: callout.dimensionReferences })),
        renderIssues: rendered.issues.map((issue) => ({ code: issue.code, message: issue.message })),
        diagnosticIsProductionFlat: false, transformIssues });
    }
    matrix.push({ caseId: entry.caseId, options: entry.options, faces });
  }
} finally {
  await browser.close();
}

await mkdir(folder, { recursive: true });
await writeFile(join(folder, "source-anchor-diagnostic-matrix.json"), JSON.stringify({
  basis: "Exact recipe patterns and S338 source-to-view mappings; view transform and callout compiler; held/failed POM labels omitted only in default diagnostic rendering.",
  configurations: matrix.length, faceRequests: matrix.length * 2, configurationsAndFaces: matrix,
}, null, 2));
console.log(JSON.stringify({ configurations: matrix.length, faceRequests: matrix.length * 2,
  defaultDiagnostics: ["polo-default-front_flat-pom-diagnostic.svg", "polo-default-back_flat-pom-diagnostic.svg"] }, null, 2));
