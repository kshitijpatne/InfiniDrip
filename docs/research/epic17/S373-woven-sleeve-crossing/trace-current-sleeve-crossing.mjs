import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const { chromium } = require("playwright");
const root = join(import.meta.dirname, "..", "S372-woven-band-detached-detail", "production-replay");
const priorRoot = join(import.meta.dirname, "..", "S365-woven-back-sleeve-band-diagnosis", "production-instance-trace");
const out = import.meta.dirname;
const renders = join(out, "annotated");
await mkdir(renders, { recursive: true });
const matrix = JSON.parse(await readFile(join(root, "matrix.json"), "utf8"));
const prior = JSON.parse(await readFile(join(priorRoot, "production-sleeve-band-instance-trace.json"), "utf8"));
assert.equal(matrix.configurations, 28);
assert.equal(matrix.faceRequests, 56);
assert.deepEqual(matrix.browserErrors, []);

function segments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const result = [];
  let i = 0, current, start;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === "M") { current = { x: +tokens[i++], y: +tokens[i++] }; start = current; }
    else if (op === "L") {
      const end = { x: +tokens[i++], y: +tokens[i++] };
      result.push({ a: current, b: end }); current = end;
    } else if (op === "Z") { if (current && start) result.push({ a: current, b: start }); current = start; }
    else throw new Error(`Unexpected path command ${op}; exact linear trace requires M/L/Z only.`);
  }
  return result;
}

function intersections(aSegments, bSegments) {
  const points = [];
  for (const [ai, first] of aSegments.entries()) for (const [bi, second] of bSegments.entries()) {
    const rx = first.b.x - first.a.x, ry = first.b.y - first.a.y;
    const sx = second.b.x - second.a.x, sy = second.b.y - second.a.y;
    const denominator = rx * sy - ry * sx;
    if (Math.abs(denominator) < 1e-10) continue;
    const qx = second.a.x - first.a.x, qy = second.a.y - first.a.y;
    const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
    if (t <= 1e-7 || t >= 1 - 1e-7 || u <= 1e-7 || u >= 1 - 1e-7) continue;
    points.push({ x: first.a.x + t * rx, y: first.a.y + t * ry, firstSegment: ai, secondSegment: bi });
  }
  return points;
}

const records = [];
const renderCases = new Set(["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max", "woven-shirt-sleeveBandDepth-max", "woven-shirt-combined-supported"]);
for (const item of matrix.cases) {
  const file = join(root, `${item.caseId}-back_flat.json`);
  const result = JSON.parse(await readFile(file, "utf8"));
  assert.equal(result.svgCount, 1, `${item.caseId}: expected an emitted back SVG`);
  assert.equal(result.revisionId, "live-draft:woven-shirt:14:14");
  const document = new JSDOM(result.svg, { contentType: "image/svg+xml" }).window.document;
  const paths = [...document.querySelectorAll('path[data-entity-id*="component:sleeve:outline"]')];
  assert.equal(paths.length, 2, `${item.caseId}: expected two reflected sleeve instances`);
  const [left, right] = paths.map((path) => ({
    entityId: path.getAttribute("data-entity-id"), sourceId: path.getAttribute("data-source-id"),
    revisionId: path.getAttribute("data-revision-id"), layer: path.getAttribute("data-layer"),
    d: path.getAttribute("d"), segments: segments(path.getAttribute("d") ?? ""),
  }));
  assert.equal(left.sourceId, "pattern:woven-shirt:role:sleeve");
  assert.equal(right.sourceId, left.sourceId);
  assert.equal(left.revisionId, result.revisionId);
  assert.equal(right.revisionId, result.revisionId);
  assert.equal(left.layer, "GARMENT_SILHOUETTE");
  assert.equal(right.layer, left.layer);
  const points = intersections(left.segments, right.segments);
  assert.equal(points.length, 1, `${item.caseId}: expected the single hem-run crossing`);
  const point = points[0];
  const old = prior.records.find((record) => record.caseId === item.caseId);
  assert.ok(old, `${item.caseId}: missing S365 same-revision baseline`);
  const oldSleeves = old.rolePaths.filter((path) => path.roleId === "sleeve");
  assert.deepEqual([left.d, right.d], oldSleeves.map((path) => path.pathData),
    `${item.caseId}: S372 sleeve output paths differ from S365`);
  const oldPair = old.pathPairCrossings.find((pair) => pair.firstRole === "sleeve" && pair.secondRole === "sleeve");
  assert.equal(oldPair?.properIntersections, 1);
  assert.ok(Math.hypot(point.x - oldPair.points[0].x, point.y - oldPair.points[0].y) < 0.002,
    `${item.caseId}: S372 intersection differs from S365 baseline`);
  records.push({ caseId: item.caseId, options: item.options, revisionId: result.revisionId,
    faceStatus: "BACK_FLAT emitted; held under V02 output acceptance", instances: [
      { entityId: left.entityId, sourceId: left.sourceId, layer: left.layer, segments: left.segments.length, pathData: left.d },
      { entityId: right.entityId, sourceId: right.sourceId, layer: right.layer, segments: right.segments.length, pathData: right.d },
    ], placement: { baseRoleTransform: old.roleTransforms.sleeve,
      mirroredPair: "approved view pair reflected across back.centerBack; the second entity is suffixed :approved-view-pair",
      sourcePairMetadata: old.projectedPairMetadata,
      sourceStitches: old.sourceStitches },
    crossing: { x: point.x, y: point.y, firstPathSegmentIndex: point.firstSegment,
      secondPathSegmentIndex: point.secondSegment,
      sourceEdges: ["pattern:woven-shirt:role:sleeve:edge:hem", "pattern:woven-shirt:role:sleeve:edge:hem"],
      sourceBasis: "Both current BACK_FLAT projection runs include sleeve.hem from its authored start to its 0.5 arclength station.",
      matchesS365: true } });

  if (renderCases.has(item.caseId)) {
    const svg = document.documentElement;
    svg.setAttribute("width", "60cm"); svg.setAttribute("height", "40cm"); svg.setAttribute("viewBox", "-30 -1 60 40");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `path[data-entity-id="${left.entityId}"]{stroke:#0284c7!important;stroke-width:.18!important}path[data-entity-id="${right.entityId}"]{stroke:#f97316!important;stroke-width:.18!important}`;
    svg.insertBefore(style, svg.firstChild);
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", String(point.x)); marker.setAttribute("cy", String(point.y)); marker.setAttribute("r", ".38");
    marker.setAttribute("fill", "#ec4899"); marker.setAttribute("stroke", "#831843"); marker.setAttribute("stroke-width", ".08");
    svg.appendChild(marker);
    const basename = item.caseId.replace("woven-shirt-", "");
    await writeFile(join(renders, `${basename}-whole.svg`), svg.outerHTML);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
      await page.setContent(`<html><body style="margin:0;font:20px Arial"><p>${item.caseId} · ${result.revisionId} · cyan/orange = mirrored sleeve instances · magenta = exact crossing</p>${svg.outerHTML}</body></html>`);
      await page.locator("svg").screenshot({ path: join(renders, `${basename}-whole.png`) });
      const close = new JSDOM(svg.outerHTML, { contentType: "image/svg+xml" }).window.document.documentElement;
      close.setAttribute("width", "16cm"); close.setAttribute("height", "16cm");
      close.setAttribute("viewBox", `${point.x - 4} ${point.y - 4} 8 8`);
      await page.setContent(`<html><body style="margin:0;font:18px Arial"><p>${item.caseId} · hem crossing at (${point.x.toFixed(5)}, ${point.y.toFixed(5)}) cm</p>${close.outerHTML}</body></html>`);
      await page.locator("svg").screenshot({ path: join(renders, `${basename}-crossing-closeup.png`) });
      await page.close();
    } finally { await browser.close(); }
  }
}

const output = { method: "independent exact 2D finite-segment intersection over saved S372 production SVG M/L commands",
  sourceOutput: "S372 live Chromium UI replay", revisionId: "live-draft:woven-shirt:14:14",
  configurations: records.length, backFaces: records.length, allTwoSleeveInstances: records.every((row) => row.instances.length === 2),
  crossingCountDistribution: Object.fromEntries([...new Set(records.map((row) => row.crossing ? 1 : 0))]
    .map((count) => [String(count), records.filter((row) => (row.crossing ? 1 : 0) === count).length])),
  matchesS365SleevePathsEveryConfiguration: records.length === 28,
  distinctIntersectionCoordinates: [...new Map(records.map((row) => [`${row.crossing.x.toFixed(7)},${row.crossing.y.toFixed(7)}`,
    { x: row.crossing.x, y: row.crossing.y }])).values()],
  matchesS365EveryConfiguration: records.every((row) => row.crossing.matchesS365),
  browserErrors: matrix.browserErrors.length, records };
assert.equal(output.configurations, 28);
assert.equal(output.allTwoSleeveInstances, true);
assert.equal(output.matchesS365EveryConfiguration, true);
assert.equal(output.browserErrors, 0);
await writeFile(join(out, "current-sleeve-crossing-trace.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ configurations: output.configurations, revisionId: output.revisionId,
  allTwoSleeveInstances: output.allTwoSleeveInstances, matchesS365EveryConfiguration: output.matchesS365EveryConfiguration,
  crossing: records[0].crossing, renderedCases: [...renderCases], browserErrors: output.browserErrors }, null, 2));
