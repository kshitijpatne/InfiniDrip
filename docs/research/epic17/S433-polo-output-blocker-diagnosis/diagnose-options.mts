import { readFile, writeFile } from "node:fs/promises";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";

const folder = new URL("./", import.meta.url);
const fixtures = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8")).cases as Array<{
  caseId: string; options: Record<string, number>;
}>;
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const targetIds = new Set(["Finished collar stand height", "Stand front rise"]);
const rows = fixtures.map(({ caseId, options }) => {
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
  const revisionId = `live-draft:polo:S433:${caseId}`;
  const input = { block, revisionId, kind: "FRONT_FLAT" as const, placements: [],
    colorHex: "#456789", texture: "smooth" as const, shine: 0 };
  const full = compileTechnicalFlatLiveView({ recipe, ...input });
  const isolated = Object.fromEntries([...targetIds].map((label) => {
    const single = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: recipe.poms!.filter((pom) => pom.label === label) }, ...input });
    return [label, { issues: single.issues.filter((issue) => issue.stage === "pom").map((issue) => issue.sourceId),
      callouts: single.view?.primitives.filter((primitive) => primitive.kind === "callout").map((callout) => ({
        sourceId: callout.source.sourceId, anchor: callout.anchor.point, labelAt: callout.labelAt,
        text: callout.text, presentation: callout.presentation,
      })) ?? [] }];
  }));
  const withoutTargets = compileTechnicalFlatLiveView({ recipe: { ...recipe,
    poms: recipe.poms!.filter((pom) => !targetIds.has(pom.label)) }, ...input });
  const withColorway = full.view ? renderTechnicalFlatSvg(full.view, { measureText: (text) => ({ widthCm: text.length * 0.18,
    ascentCm: 0.35, descentCm: 0.1 }), colorway: full.colorway }) : null;
  const back = compileTechnicalFlatLiveView({ recipe, ...input, kind: "BACK_FLAT" });
  const sleevePaths = back.view?.primitives.filter((primitive) => primitive.kind === "path"
    && primitive.id.includes(":component:sleeve:") && primitive.layer === "GARMENT_SILHOUETTE").map((primitive) => {
    if (primitive.kind !== "path") return null;
    const start = primitive.commands.find((command) => command.op === "move");
    const last = primitive.commands.at(-1);
    return { id: primitive.id, sourceId: primitive.source.sourceId, sourceEdgeIds: primitive.sourceEdgeIds,
      colorwayBoundaryOnly: primitive.colorwayBoundaryOnly === true,
      start: start?.op === "move" ? start.point : null,
      end: last && last.op !== "close" ? last.point : null,
      commands: primitive.commands };
  }) ?? [];
  const sleeveCapSeams = back.view?.primitives.filter((primitive) => primitive.kind === "path"
    && primitive.id.includes(":view-seam:polo-sleeve-cap:")).map((primitive) => {
    if (primitive.kind !== "path") return null;
    const start = primitive.commands.find((command) => command.op === "move");
    const last = primitive.commands.at(-1);
    return { id: primitive.id, sourceId: primitive.source.sourceId, sourceEdgeIds: primitive.sourceEdgeIds,
      start: start?.op === "move" ? start.point : null, end: last && last.op !== "close" ? last.point : null,
      commands: primitive.commands };
  }) ?? [];
  const allEnds = sleevePaths.flatMap((path) => path ? [path.start, path.end].filter(Boolean) : []) as Array<{x:number;y:number}>;
  const degrees = allEnds.reduce((counts, point) => { const key = `${point.x.toPrecision(12)},${point.y.toPrecision(12)}`;
    counts[key] = (counts[key] ?? 0) + 1; return counts; }, {} as Record<string, number>);
  return { caseId, options, frontPOMIssues: full.issues.filter((issue) => issue.stage === "pom").map((issue) => issue.sourceId),
    isolated, withoutTargets: { viewEmitted: !!withoutTargets.view, pomIssues: withoutTargets.issues.filter((issue) => issue.stage === "pom").map((issue) => issue.sourceId),
      callouts: withoutTargets.view?.primitives.filter((primitive) => primitive.kind === "callout").map((callout) => ({
        sourceId: callout.source.sourceId, anchor: callout.anchor.point, labelAt: callout.labelAt, text: callout.text })) ?? [] },
    frontColorwayIssues: withColorway?.issues ?? null,
    backSleeve: { viewEmitted: !!back.view, colorwayIssues: back.view && back.colorway
      ? renderTechnicalFlatSvg(back.view, { measureText: (text) => ({ widthCm: text.length * 0.18, ascentCm: 0.35, descentCm: 0.1 }),
        colorway: back.colorway }).issues : null, paths: sleevePaths, sleeveCapSeams, endpointDegree: degrees } };
});
const outputPath = new URL("./S433-polo-output-diagnostic.json", import.meta.url);
await writeFile(outputPath, `${JSON.stringify({ sourceFixture: "S331-polo-browser-final/matrix.json", options: rows.length,
  revisions: rows.map((row) => `${row.caseId}:live-draft:polo:S433:${row.caseId}`), rows }, null, 2)}\n`);
console.log(JSON.stringify({ options: rows.length,
  frontFailureCounts: Object.fromEntries([...targetIds].map((id) => [id, rows.filter((row) => row.frontPOMIssues.includes(`pom:polo:${id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`)).length])),
  isolatedCalloutSuccesses: Object.fromEntries([...targetIds].map((id) => [id, rows.filter((row) => row.isolated[id as keyof typeof row.isolated].callouts.length === 1).length])),
  withoutTargetsEmit: rows.filter((row) => row.withoutTargets.viewEmitted).length,
  backColorwayFailures: rows.filter((row) => row.backSleeve.colorwayIssues?.some((issue) => issue.code === "COLORWAY_CONTOUR_UNCLOSED")).length,
  defaultBackEndpointDegree: rows.find((row) => row.caseId === "polo-default")?.backSleeve.endpointDegree }, null, 2));
