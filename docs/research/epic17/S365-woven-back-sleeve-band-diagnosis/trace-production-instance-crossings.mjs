import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const { chromium } = createRequire(import.meta.url)("playwright");
const replayDir = join(import.meta.dirname, "..", "S363-woven-pom-leader-readability", "production-replay");
const crosswalkPath = join(import.meta.dirname, "..", "S349-woven-back-band-pair", "source-crossing-crosswalk.json");
const outputDir = join(import.meta.dirname, "production-instance-trace");
const annotatedDir = join(outputDir, "annotated");
await mkdir(annotatedDir, { recursive: true });
const matrix = JSON.parse(await readFile(join(replayDir, "matrix.json"), "utf8"));
const crosswalk = JSON.parse(await readFile(crosswalkPath, "utf8"));

function pathSegments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const segments = [];
  let i = 0, current = null, subpath = null;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === "M") { current = { x: +tokens[i++], y: +tokens[i++] }; subpath = current; }
    else if (op === "L") {
      const next = { x: +tokens[i++], y: +tokens[i++] };
      segments.push([current, next]); current = next;
    } else if (op === "C") {
      const c1 = { x: +tokens[i++], y: +tokens[i++] }, c2 = { x: +tokens[i++], y: +tokens[i++] };
      const next = { x: +tokens[i++], y: +tokens[i++] };
      let previous = current;
      for (let step = 1; step <= 80; step += 1) {
        const t = step / 80, u = 1 - t;
        const point = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * next.x,
          y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * next.y };
        segments.push([previous, point]); previous = point;
      }
      current = next;
    } else if (op === "Z" && current && subpath) { segments.push([current, subpath]); current = subpath; }
    else throw new Error(`Unsupported production SVG path command “${op}”.`);
  }
  return segments;
}

function properIntersections(first, second) {
  const points = [];
  for (const [a, b] of first) for (const [c, d] of second) {
    const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
    const denominator = rx * sy - ry * sx;
    if (Math.abs(denominator) < 1e-10) continue;
    const qx = c.x - a.x, qy = c.y - a.y;
    const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
    if (t > 1e-7 && t < 1 - 1e-7 && u > 1e-7 && u < 1 - 1e-7) {
      const point = { x: a.x + t * rx, y: a.y + t * ry };
      if (!points.some((candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) < 0.015)) points.push(point);
    }
  }
  return points;
}

function pathCommandCounts(d) {
  return Object.fromEntries(["M", "L", "C", "Z"].map((op) =>
    [op, (d.match(new RegExp(op, "gu")) ?? []).length]));
}

const visibleRolePattern = /:component:(sleeve|sleeveBand|yoke|back):outline/u;
const records = [];
for (const item of matrix.cases) {
  const caseId = item.caseId;
  const slug = caseId.replace(/^woven-shirt-/u, "");
  const svgPath = join(replayDir, `woven-shirt-${slug}-back_flat.svg`);
  const svgText = await readFile(svgPath, "utf8");
  const document = new JSDOM(svgText, { contentType: "image/svg+xml" }).window.document;
  const revisionId = document.documentElement.getAttribute("data-revision-id");
  const sourceRecord = crosswalk.configurationsByOption.find((entry) => entry.caseId === caseId);
  const prior = sourceRecord?.faces.find((face) => face.kind === "BACK_FLAT");
  if (!prior || !revisionId || prior.revisionId !== revisionId) throw new Error(`${caseId}: source/output revision mismatch.`);
  const paths = [...document.querySelectorAll("path[data-entity-id]")].flatMap((element) => {
    const entityId = element.getAttribute("data-entity-id") ?? "";
    const match = visibleRolePattern.exec(entityId);
    if (!match) return [];
    return [{ roleId: match[1], entityId, sourceId: element.getAttribute("data-source-id"),
      revisionId: element.getAttribute("data-revision-id"), layer: element.getAttribute("data-layer"),
      d: element.getAttribute("d") ?? "", segments: pathSegments(element.getAttribute("d") ?? "") }];
  });
  if (paths.some((path) => path.revisionId !== revisionId)) throw new Error(`${caseId}: emitted role path revision mismatch.`);
  const bandPaths = paths.filter((path) => path.roleId === "sleeveBand");
  const bandPairPoints = bandPaths.length === 2 ? properIntersections(bandPaths[0].segments, bandPaths[1].segments) : [];
  const pairCrosswalk = prior.renderedBandPairIntersections ?? [];
  const crossingMatchesBaseline = bandPairPoints.length === pairCrosswalk.length
    && pairCrosswalk.every(({ point }) => bandPairPoints.some((actual) => Math.hypot(actual.x - point.x, actual.y - point.y) < 0.03));
  const pathPairCrossings = [];
  for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) {
    if (paths[i].entityId === paths[j].entityId) continue;
    const points = properIntersections(paths[i].segments, paths[j].segments);
    if (points.length) pathPairCrossings.push({ firstRole: paths[i].roleId, firstEntityId: paths[i].entityId,
      secondRole: paths[j].roleId, secondEntityId: paths[j].entityId, properIntersections: points.length, points });
  }
  const instanceCounts = Object.fromEntries(["sleeve", "sleeveBand", "yoke", "back"].map((roleId) =>
    [roleId, paths.filter((path) => path.roleId === roleId).length]));
  const record = { caseId, options: item.options, revisionId,
    sourceStitches: sourceRecord?.source?.stitchOrder ?? null,
    sourceEdgeInventory: Object.keys(prior.edges ?? {}),
    roleTransforms: prior.roleTransforms,
    projectedPairMetadata: { sleeve: prior.pairMappings?.sleeve, sleeveRuns: prior.pairMappings?.sleeveRuns,
      band: prior.pairMappings?.band },
    emittedInstanceCounts: instanceCounts,
    rolePaths: paths.map(({ roleId, entityId, sourceId, revisionId: pathRevision, layer, d }) =>
      ({ roleId, entityId, sourceId, revisionId: pathRevision, layer, pathCommands: pathCommandCounts(d), pathData: d })),
    sleeveToBandTopJoin: { sourceSleeveHem: prior.edges?.sleeveHem?.view,
      sourceBandTop: prior.edges?.sleeveBandTop?.view,
      endpointResidualCm: prior.seamEndpointResidualsCm ? Math.max(...prior.seamEndpointResidualsCm) : null,
      visibleBandPairIntersections: bandPairPoints.length,
      S349BaselineIntersections: pairCrosswalk.length, crossingPointsMatchBaseline: crossingMatchesBaseline },
    pathPairCrossings };
  records.push(record);

  const shouldAnnotate = ["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max", "woven-shirt-combined-supported"].includes(caseId);
  if (shouldAnnotate) {
    const markers = bandPairPoints.map((point, index) => `<circle data-s365-band-crossing="${index + 1}" cx="${point.x}" cy="${point.y}" r="0.27"/>`).join("");
    const style = `<style>
      path[data-entity-id*="component:sleeve:outline"]{stroke:#0284c7!important;stroke-width:.16!important}
      path[data-entity-id*="component:sleeveBand:outline"]{stroke:#f97316!important;stroke-width:.16!important}
      path[data-entity-id*="component:yoke:outline"]{stroke:#16a34a!important;stroke-width:.12!important}
      path[data-entity-id*="component:back:outline"]{stroke:#475569!important;stroke-width:.10!important}
      circle[data-s365-band-crossing]{fill:#e879f9;stroke:#701a75;stroke-width:.07}
    </style>`;
    document.documentElement.setAttribute("viewBox", "-30 -1 60 40");
    document.documentElement.setAttribute("width", "60cm");
    document.documentElement.setAttribute("height", "40cm");
    document.documentElement.insertAdjacentHTML("afterbegin", style);
    document.documentElement.insertAdjacentHTML("beforeend", `<g data-s365-crossing-markers="true">${markers}</g>`);
    const annotated = document.documentElement.outerHTML;
    const basename = `${slug}-back-flat-role-crossings`;
    await writeFile(join(annotatedDir, `${basename}.svg`), annotated);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 1 });
      await page.setContent(`<html><head><style>body{margin:12px;background:#fff;font:20px Arial;color:#111}p{margin:0 0 8px}.key{padding-right:20px}</style></head><body><p>${caseId} · ${revisionId} · BACK_FLAT — blue sleeve, orange band, green yoke, slate back, magenta band-pair intersections</p>${annotated}</body></html>`);
      await page.locator("svg").screenshot({ path: join(annotatedDir, `${basename}.png`) });
      await page.close();
    } finally { await browser.close(); }
  }
}
const faceRequests = matrix.cases.flatMap((item) => item.faces.map((face) => ({
  caseId: item.caseId, options: item.options, kind: face.kind, svgCount: face.svgCount,
  issueCount: face.issueCount, revisionId: face.revisionId,
  heldGuidance: face.svgCount === 0 ? face.guidance : null,
})));
const output = { sourceMatrix: "S363 production Chromium output", comparison: "S349 source/output band crossing crosswalk",
  faceRequests: faceRequests.length,
  faceRequestSummary: ["FRONT_FLAT", "BACK_FLAT"].map((kind) => {
    const rows = faceRequests.filter((face) => face.kind === kind);
    return { kind, requests: rows.length, emitted: rows.reduce((sum, face) => sum + face.svgCount, 0),
      held: rows.filter((face) => face.svgCount === 0).length,
      issueCountSum: rows.reduce((sum, face) => sum + face.issueCount, 0),
      distinctEmittedRevisions: [...new Set(rows.map((face) => face.revisionId).filter(Boolean))] };
  }),
  faceRequestRecords: faceRequests,
  configurations: records.length, backFaces: records.length, allSameRevision: true,
  bandPairBaselineMatches: records.filter((record) => record.sleeveToBandTopJoin.crossingPointsMatchBaseline).length,
  facesWithBandPairCrossings: records.filter((record) => record.sleeveToBandTopJoin.visibleBandPairIntersections > 0).length,
  bandPairCrossingsByConfiguration: records.map((record) => ({ caseId: record.caseId,
    crossings: record.sleeveToBandTopJoin.visibleBandPairIntersections,
    baselineMatches: record.sleeveToBandTopJoin.crossingPointsMatchBaseline,
    rolePairCounts: record.pathPairCrossings.map(({ firstRole, secondRole, properIntersections }) =>
      `${firstRole}/${secondRole}:${properIntersections}`) })), records };
await writeFile(join(outputDir, "production-sleeve-band-instance-trace.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ configurations: output.configurations, backFaces: output.backFaces,
  allSameRevision: output.allSameRevision, bandPairBaselineMatches: output.bandPairBaselineMatches,
  facesWithBandPairCrossings: output.facesWithBandPairCrossings, bandPairCrossingsByConfiguration: output.bandPairCrossingsByConfiguration,
  report: join(outputDir, "production-sleeve-band-instance-trace.json"), annotated: annotatedDir }, null, 2));
if (records.length !== 28 || faceRequests.length !== 56
  || faceRequests.filter((face) => face.kind === "FRONT_FLAT").length !== 28
  || faceRequests.filter((face) => face.kind === "BACK_FLAT").length !== 28
  || records.some((record) => record.sleeveToBandTopJoin.visibleBandPairIntersections !== 4
  || !record.sleeveToBandTopJoin.crossingPointsMatchBaseline)) throw new Error("Current production output diverged from the S349 baseline crossing evidence.");
