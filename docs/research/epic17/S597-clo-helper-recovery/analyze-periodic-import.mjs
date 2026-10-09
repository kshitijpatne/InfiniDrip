import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m-lwpolyline-r2000.dxf";
const fixturePath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input/polo-m-periodic-degree1-spline.dxf";
const apiPath = "C:/G04-CLO-DXF-Exchange/S597-clo-helper-recovery/Evidence/periodic-preexport-pattern-line-info.json";
const reportPath = "C:/G04-CLO-DXF-Exchange/S597-clo-helper-recovery/Evidence/periodic-preexport-source-comparison.json";
const sourceProximityThresholdCm = 0.001;
const sourceProximityThresholdMm = sourceProximityThresholdCm * 10;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const rows = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(rows.length % 2, 0, "DXF group/value pairs must be complete");
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) pairs.push([Number(rows[i].trim()), rows[i + 1].trim()]);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i;
      i += 1;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.entities.push(pairs.slice(start, i));
      i -= 1;
    }
  }
  return sections;
}
const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
function parseContour(entity, following = []) {
  const type = entity[0]?.[1];
  const layer = value(entity, 8) ?? "(none)";
  if (type === "LWPOLYLINE") {
    const points = [];
    let x;
    for (const [code, raw] of entity) {
      if (code === 10) x = Number(raw);
      if (code === 20 && x !== undefined) { points.push({ x, y: Number(raw) }); x = undefined; }
    }
    return { type, layer, points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  }
  if (type === "POLYLINE") {
    const points = [];
    for (const child of following) {
      if (child[0]?.[1] === "SEQEND") break;
      if (child[0]?.[1] === "VERTEX") points.push({ x: Number(value(child, 10)), y: Number(value(child, 20)) });
    }
    return { type, layer, points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  }
  return undefined;
}
const segments = (points) => points.map((point, i) => [point, points[(i + 1) % points.length]]);
function pointSegmentDistance(point, [a, b]) {
  const dx = b.x - a.x; const dy = b.y - a.y; const d2 = dx * dx + dy * dy;
  const t = d2 ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / d2)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
function symmetricDistance(source, returned) {
  const sourceSegments = segments(source);
  const toSource = Math.max(...returned.flat().map((p) => Math.min(...sourceSegments.map((s) => pointSegmentDistance(p, s)))));
  const toReturned = Math.max(...source.map((p) => Math.min(...returned.map((s) => pointSegmentDistance(p, s)))));
  return Math.max(toSource, toReturned);
}
function bounds(points) {
  return { minX: Math.min(...points.map((p) => p.x)), minY: Math.min(...points.map((p) => p.y)), maxX: Math.max(...points.map((p) => p.x)), maxY: Math.max(...points.map((p) => p.y)) };
}

const [sourceBytes, fixtureBytes, apiBytes] = await Promise.all([readFile(sourcePath), readFile(fixturePath), readFile(apiPath)]);
assert.equal(sha(sourceBytes), "9062B0D6442354165C5640EF3CA98B717AAEF6F4339EAC1DE99255D7D1750FA2");
assert.equal(sha(fixtureBytes), "E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC");
assert.equal(sha(apiBytes), "63A3857B8398F6723B041B3C6E305F3006B364C0EF1FAD185A71590537ACC269");
const entities = parseDxf(sourceBytes).find(({ name }) => name === "ENTITIES")?.entities ?? [];
const contours = [];
for (let index = 0; index < entities.length; index += 1) {
  const item = parseContour(entities[index], entities.slice(index + 1));
  if (item?.closed) contours.push({ ordinal: contours.length, ...item });
}
assert.equal(contours.length, 18);
assert.ok(contours.every((item, i) => item.layer === (i % 2 ? "SEW" : "CUT")));
const api = JSON.parse(apiBytes.toString("utf8"));
assert.equal(api.slice, "S597");
assert.equal(api.clo_build_observed_ui, "2026.1.310");
assert.equal(api.pattern_count, 9);
assert.equal(api.pieces.length, 9);
assert.equal(api.error, null);

const pieces = api.pieces.map((piece) => {
  assert.equal(piece.error, null, `API index ${piece.index} call error`);
  assert.equal(piece.line_info.status, "success", `API index ${piece.index} status`);
  const lines = piece.line_info.lines;
  assert.equal(piece.line_info.lineCount, lines.length);
  const returned = lines.map(({ start, end }) => [start, end]);
  const gaps = returned.slice(0, -1).map((line, i) => Math.hypot(line[1].x - returned[i + 1][0].x, line[1].y - returned[i + 1][0].y));
  const closureGap = Math.hypot(returned.at(-1)[1].x - returned[0][0].x, returned.at(-1)[1].y - returned[0][0].y);
  const endpointBounds = bounds(returned.flat());
  const bbox = piece.line_info.boundingBox;
  const bboxResidual = Math.max(...Object.keys(endpointBounds).map((key) => Math.abs(endpointBounds[key] - bbox[key])));
  const matches = contours.map((source) => {
    const pointsMm = source.points.map(({ x, y }) => ({ x: x * 10, y: y * 10 }));
    return { sourceOrdinal: source.ordinal, literalSourceLayer: source.layer, vertexCount: pointsMm.length, residualMm: symmetricDistance(pointsMm, returned) };
  }).sort((a, b) => a.residualMm - b.residualMm);
  return {
    index: piece.index,
    apiName: piece.name,
    lineCount: lines.length,
    boundsMm: bbox,
    maxConsecutiveGapMm: gaps.length ? Math.max(...gaps) : 0,
    closureGapMm: closureGap,
    endpointBoundsResidualMm: bboxResidual,
    bestSourceMatches: matches.slice(0, 4),
    withinSourceProximityThreshold: matches.filter(({ residualMm }) => residualMm <= sourceProximityThresholdMm),
  };
});

const report = {
  purpose: "Read-only GetPatternLineInfo measurements on the current CLO scene after opening S595's saved periodic-SPLINE pre-export scene; compare in documented direct mm frame only.",
  method: { sourceUnitConversion: "cm×10=mm", sourceProximityThresholdCm, sourceProximityThresholdMm, fittedTransform: false, distance: "symmetric vertex-to-opposing-segment minimum distance; diagnostic screening only, not the V03 contour-acceptance measurement", roleSemantics: "API documentation does not assign CUT/SEW roles; matched source layers remain literal DXF metadata." },
  inputs: { source: { path: sourcePath, sha256: sha(sourceBytes), contours: contours.length }, periodicFixture: { path: fixturePath, sha256: sha(fixtureBytes) }, api: { path: apiPath, sha256: sha(apiBytes), cloBuild: api.clo_build_observed_ui, patternCount: api.pattern_count } },
  results: pieces,
  summary: {
    piecesWithExactlyOneDirectWithinSourceProximityThreshold: pieces.filter((piece) => piece.withinSourceProximityThreshold.length === 1).length,
    piecesMatchingLiteralCutGeometry: pieces.filter((piece) => piece.withinSourceProximityThreshold.some((match) => match.literalSourceLayer === "CUT")).length,
    piecesMatchingLiteralSewGeometry: pieces.filter((piece) => piece.withinSourceProximityThreshold.some((match) => match.literalSourceLayer === "SEW")).length,
    piecesWithContinuousClosedLineSequence: pieces.filter((piece) => Math.max(piece.maxConsecutiveGapMm, piece.closureGapMm) === 0).length,
    piecesWithEndpointBoundsMatchingReportedBox: pieces.filter((piece) => piece.endpointBoundsResidualMm === 0).length,
    apiReturnedLineCounts: pieces.map(({ index, lineCount }) => ({ index, lineCount })),
  },
  conclusionLimit: "A direct geometric match is an observed API path comparison only. It does not establish CUT/SEW role, API stage semantics, or CLO importer/exporter causation.",
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ reportPath, summary: report.summary, results: pieces.map(({ index, lineCount, closureGapMm, withinSourceProximityThreshold }) => ({ index, lineCount, closureGapMm, withinSourceProximityThreshold })) }, null, 2));
