import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const base = "C:/G04-CLO-DXF-Exchange";
const root = `${base}/S622-standard-dxf-connected-line-import`;
const inputPath = `${root}/Input/polo-source-m-cut-lines.dxf`;
const sourcePath = `${base}/S574-polo-line-chain-representation/Input/polo-source-m.dxf`;
const derivativePath = `${base}/S574-polo-line-chain-representation/Evidence/line-chain-derivative-report.json`;
const projectPath = `${root}/Project/clo-standard-dxf-connected-line-import.zprj`;
const infoPath = `${root}/Evidence/preexport-input-information.json`;
const renderPdfPath = `${root}/Evidence/standard-dxf-import-scene.pdf`;
const renderPngPath = `${root}/Evidence/standard-dxf-import-scene-1.png`;
const aamaComparisonPath = `${base}/S621-aama-swap-lines-import/Evidence/preexport-cut-sew-comparison.json`;
const outputPath = `${root}/Evidence/preexport-cut-sew-comparison.json`;
const expectedInput = "a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675";
const expectedSource = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedProject = "4828a5a3fba81a10cefa179be5d95c85055108e6731d12315145513223286a0f";
const expectedAamaComparison = "c2581a0e779c10ff58288bfb2b42674268ef0b37c68d0e22d7d6e696d712271b";
const expectedRenderPdf = "60cbe775239095eb5986f76b6916523ebf5b0ac718053fd489716ab478e07694";
const expectedRenderPng = "b35ae71ef0ea3812100ec7e27026a471c82f6679ac78b7a9a127c225e83299c1";
const toleranceMm = 0.01;
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

function parseSource(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const value = (entity, code) => entity.find(([g]) => g === code)?.[1];
  const entities = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1]?.[1]; i++; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = undefined; continue; }
    if (section === "ENTITIES" && pairs[i][0] === 0) {
      const entity = [pairs[i]];
      for (i++; i < pairs.length && pairs[i][0] !== 0; i++) entity.push(pairs[i]);
      i--;
      entities.push(entity);
    }
  }
  const paths = [];
  for (let i = 0; i < entities.length; i++) {
    if (entities[i][0][1] !== "POLYLINE") continue;
    const vertices = [];
    for (let j = i + 1; j < entities.length && entities[j][0][1] !== "SEQEND"; j++) {
      if (entities[j][0][1] === "VERTEX") vertices.push({ x: Number(value(entities[j], 10)), y: Number(value(entities[j], 20)), bulge: Number(value(entities[j], 42) ?? 0) });
    }
    paths.push({ layer: value(entities[i], 8), closed: Boolean(Number(value(entities[i], 70) ?? 0) & 1), vertices });
  }
  return paths;
}
function parseInputCutLineChains(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const entities = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1]?.[1]; i++; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = undefined; continue; }
    if (section === "ENTITIES" && pairs[i][0] === 0) {
      const entity = [pairs[i]];
      for (i++; i < pairs.length && pairs[i][0] !== 0; i++) entity.push(pairs[i]);
      i--;
      entities.push(entity);
    }
  }
  const value = (entity, code) => entity.find(([g]) => g === code)?.[1];
  const cutLines = entities.filter((entity) => entity[0][1] === "LINE" && value(entity, 8) === "CUT").map((entity) => ({
    a: { x: Number(value(entity, 10)), y: Number(value(entity, 20)) },
    b: { x: Number(value(entity, 11)), y: Number(value(entity, 21)) },
  }));
  const chains = [];
  let vertices = [], first;
  for (const line of cutLines) {
    if (!vertices.length) { first = line.a; vertices.push(line.a); }
    else assert(Math.hypot(vertices.at(-1).x - line.a.x, vertices.at(-1).y - line.a.y) < 1e-8, "CUT LINE chain is disconnected");
    if (Math.hypot(line.b.x - first.x, line.b.y - first.y) < 1e-8) {
      chains.push({ layer: "CUT-LINE-CHAIN", closed: true, vertices: [...vertices] });
      vertices = []; first = undefined;
    } else vertices.push(line.b);
  }
  assert.equal(vertices.length, 0, "CUT LINE chain ends open");
  return chains;
}

function exactCycle(source, candidate) {
  if (source.length !== candidate.length) return null;
  let best = null;
  for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = source.map((p, i) => {
      const q = candidate[(offset + direction * i + candidate.length * 2) % candidate.length];
      return Math.hypot(p.x * 10 - q.x * 10, p.y * 10 - q.y * 10);
    });
    const result = { direction, offset, pointCount: deltas.length, maxDeltaMm: Math.max(...deltas), rmsDeltaMm: Math.sqrt(deltas.reduce((s, d) => s + d * d, 0) / deltas.length) };
    if (!best || result.maxDeltaMm < best.maxDeltaMm) best = result;
  }
  return best;
}

const valueAt = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function pathSegments(path) {
  const result = [];
  for (let i = 0; i < path.vertices.length; i++) {
    const a = path.vertices[i], b = path.vertices[(i + 1) % path.vertices.length];
    if (Math.abs(a.bulge ?? 0) < 1e-12) {
      result.push({ a, b, bulge: 0, length: Math.hypot(b.x - a.x, b.y - a.y) });
      continue;
    }
    const theta = 4 * Math.atan(a.bulge), chord = Math.hypot(b.x - a.x, b.y - a.y);
    const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const left = { x: -(b.y - a.y) / chord, y: (b.x - a.x) / chord };
    const offset = chord / (2 * Math.tan(theta / 2));
    const center = { x: midpoint.x + left.x * offset, y: midpoint.y + left.y * offset };
    result.push({ a, b, bulge: a.bulge, theta, radius, center, start: Math.atan2(a.y - center.y, a.x - center.x), length: radius * Math.abs(theta) });
  }
  return result;
}
function pointOnSegment(segment, t) {
  if (!segment.bulge) return valueAt(segment.a, segment.b, t);
  const angle = segment.start + segment.theta * t;
  return { x: segment.center.x + segment.radius * Math.cos(angle), y: segment.center.y + segment.radius * Math.sin(angle) };
}
function pointToSegment(point, segment) {
  if (!segment.bulge) {
    const dx = segment.b.x - segment.a.x, dy = segment.b.y - segment.a.y, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / den)) : 0;
    return Math.hypot(point.x - (segment.a.x + t * dx), point.y - (segment.a.y + t * dy));
  }
  const angle = Math.atan2(point.y - segment.center.y, point.x - segment.center.x), tau = 2 * Math.PI;
  const progress = segment.theta >= 0 ? ((angle - segment.start) % tau + tau) % tau : ((segment.start - angle) % tau + tau) % tau;
  if (progress <= Math.abs(segment.theta) + 1e-10) return Math.abs(Math.hypot(point.x - segment.center.x, point.y - segment.center.y) - segment.radius);
  return Math.min(Math.hypot(point.x - segment.a.x, point.y - segment.a.y), Math.hypot(point.x - segment.b.x, point.y - segment.b.y));
}
const sampleStepMm = 0.01;
function sampledDirectedDistance(fromPath, toSegments, direction) {
  let worst = { distanceMm: 0 };
  for (const [segmentIndex, segment] of pathSegments(fromPath).entries()) {
    const count = Math.max(1, Math.ceil(segment.length / sampleStepMm));
    for (let i = 0; i <= count; i++) {
      const point = pointOnSegment(segment, i / count);
      let distanceMm = Infinity;
      for (const target of toSegments) distanceMm = Math.min(distanceMm, pointToSegment(point, target));
      if (distanceMm > worst.distanceMm) worst = { distanceMm, direction, segmentIndex, sampleFraction: i / count, point };
    }
  }
  return worst;
}
function vertexSymmetricDistance(sourcePathCm, nativePointsMm) {
  const sourcePath = { closed: true, vertices: sourcePathCm.vertices.map((p) => ({ ...p, x: p.x * 10, y: p.y * 10 })) };
  // CLO's InputInformation coordinates align with the centimeter coordinates
  // in this DXF. Convert both sides to mm for the acceptance calculation.
  const nativePath = { closed: true, vertices: nativePointsMm.map((p) => ({ x: p.x * 10, y: p.y * 10, bulge: 0 })) };
  const sourceSegments = pathSegments(sourcePath), nativeSegments = pathSegments(nativePath);
  const directed = (vertices, targets) => vertices.map((point) => Math.min(...targets.map((target) => pointToSegment(point, target))));
  const distances = [...directed(sourcePath.vertices, nativeSegments), ...directed(nativePath.vertices, sourceSegments)];
  return Math.max(...distances);
}
function sampledSymmetricDistance(sourcePathCm, nativePointsMm) {
  const sourcePath = { closed: true, vertices: sourcePathCm.vertices.map((p) => ({ ...p, x: p.x * 10, y: p.y * 10 })) };
  const nativePath = { closed: true, vertices: nativePointsMm.map((p) => ({ x: p.x * 10, y: p.y * 10, bulge: 0 })) };
  const sourceSegments = pathSegments(sourcePath), nativeSegments = pathSegments(nativePath);
  const sourceToNative = sampledDirectedDistance(sourcePath, nativeSegments, "source-to-native");
  const nativeToSource = sampledDirectedDistance(nativePath, sourceSegments, "native-to-source");
  const worst = sourceToNative.distanceMm >= nativeToSource.distanceMm ? sourceToNative : nativeToSource;
  return { ...worst, sampledMaxMm: worst.distanceMm, conservativeUpperBoundMm: worst.distanceMm + sampleStepMm / 2, sampleStepMm };
}

const [inputBytes, sourceBytes, derivativeBytes, projectBytes, infoBytes, aamaComparisonBytes, renderPdfBytes, renderPngBytes] = await Promise.all([
  readFile(inputPath), readFile(sourcePath), readFile(derivativePath), readFile(projectPath), readFile(infoPath), readFile(aamaComparisonPath), readFile(renderPdfPath), readFile(renderPngPath),
]);
for (const [label, actual, expected] of [["input", sha(inputBytes), expectedInput], ["source", sha(sourceBytes), expectedSource], ["project", sha(projectBytes), expectedProject], ["AAMA comparison", sha(aamaComparisonBytes), expectedAamaComparison], ["render PDF", sha(renderPdfBytes), expectedRenderPdf], ["render PNG", sha(renderPngBytes), expectedRenderPng]]) assert.equal(actual, expected, `${label} SHA-256 mismatch`);
const derivative = JSON.parse(derivativeBytes.toString("utf8"));
assert.equal(derivative.outputSha256.toLowerCase(), expectedInput);
assert.equal(derivative.convertedEdgesUseExactSourceEndpointStrings, true);
assert.equal(derivative.lineEdgesCloseEverySourceContour, true);
assert.equal(derivative.sourceCutPolylineCount, 9);
const cut = parseSource(sourceBytes).filter((p) => p.layer === "CUT" && p.closed);
const sew = parseSource(sourceBytes).filter((p) => p.layer === "SEW" && p.closed);
const inputCut = parseInputCutLineChains(inputBytes);
assert.equal(cut.length, 9);
assert.equal(sew.length, 9);
assert.equal(inputCut.length, 9);
const info = JSON.parse(infoBytes.toString("utf8"));
const aamaComparison = JSON.parse(aamaComparisonBytes.toString("utf8"));
assert.equal(aamaComparison.input.sha256.toLowerCase(), expectedInput);
assert.equal(aamaComparison.summary.cutPasses, 0);
assert.equal(aamaComparison.summary.sewPasses, 9);
assert.equal(info.slice, "S622");
assert.equal(info.pattern_count, 9);
assert.equal(info.errors.length, 0);
assert.equal(info.import_profile.format, "Standard DXF");
assert.equal(info.import_profile.swap_cutting_and_sewing, false);
assert.equal(info.intended_project_sha256.toLowerCase(), expectedProject);

const extract = (project) => project.patterns.map((pattern) => ({
  index: pattern.pattern_index,
  name: pattern.pattern_name,
  shapes: (pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? []).slice(1).map((shape) => ({
    index: Number(shape["Shape index"]), name: shape["Shape name"], type: shape["Shape type"],
    lineCount: Number(shape.LineList?.[0]?.["Line count"] ?? -1),
    points: (shape.PointList ?? []).filter((p) => p["Point positionX"] != null && p["Point positionY"] != null).map((p) => ({ x: Number(p["Point positionX"]), y: Number(p["Point positionY"]) })),
  })).filter((shape) => shape.points.length >= 3 && shape.lineCount === shape.points.length),
}));
const patterns = extract(info);
const matches = (source, shapes) => shapes.map((shape) => ({
  patternIndex: shape.patternIndex, patternName: shape.patternName, shapeIndex: shape.index, shapeName: shape.name, shapeType: shape.type,
  exact: exactCycle(source.vertices, shape.points), vertexDistanceMm: vertexSymmetricDistance(source, shape.points),
})).sort((a, b) => a.vertexDistanceMm - b.vertexDistanceMm);
const allNativeShapes = patterns.flatMap((pattern) => pattern.shapes.map((shape) => ({ ...shape, patternIndex: pattern.index, patternName: pattern.name })));
const bestMatch = (source) => {
  const ranked = matches(source, allNativeShapes);
  if (!ranked.length) return null;
  const near = ranked.filter((candidate) => candidate.vertexDistanceMm <= ranked[0].vertexDistanceMm + 0.1).slice(0, 4);
  const sampled = near.map((candidate) => ({
    ...candidate,
    sampled: sampledSymmetricDistance(source, allNativeShapes.find((shape) => shape.patternIndex === candidate.patternIndex && shape.index === candidate.shapeIndex).points),
  })).sort((a, b) => a.sampled.conservativeUpperBoundMm - b.sampled.conservativeUpperBoundMm);
  return { ...sampled[0], nearCandidates: sampled.map(({ patternIndex, patternName, shapeIndex, shapeName, shapeType, vertexDistanceMm, sampled: distance }) => ({ patternIndex, patternName, shapeIndex, shapeName, shapeType, vertexDistanceMm, sampled: distance })), withinGateCount: ranked.filter((candidate) => candidate.vertexDistanceMm + sampleStepMm / 2 <= toleranceMm).length };
};
const pieces = cut.map((cutPath, i) => {
  const inputCutBest = bestMatch(inputCut[i]);
  const cutBest = bestMatch(cutPath);
  const sewBest = bestMatch(sew[i]);
  const pattern = patterns.find((item) => item.index === cutBest?.patternIndex) ?? null;
  return {
    sourceCutContourOrdinal: i, patternIndex: pattern?.index ?? null, patternName: pattern?.name ?? null,
    sewPatternIndex: sewBest?.patternIndex ?? null,
    sourceCutPoints: cutPath.vertices.length, sourceSewPoints: sew[i].vertices.length,
    inputCutLinePoints: inputCut[i].vertices.length,
    nativeShapes: pattern?.shapes.map((shape) => ({ index: shape.index, name: shape.name, type: shape.type, pointCount: shape.points.length, lineCount: shape.lineCount })) ?? [],
    inputCutBest, cutBest, sewBest,
    derivativeDeviation: sampledSymmetricDistance(cutPath, inputCut[i].vertices),
    cutPass: Boolean(cutBest && cutBest.sampled.conservativeUpperBoundMm <= toleranceMm),
    sewPass: Boolean(sewBest && sewBest.sampled.conservativeUpperBoundMm <= toleranceMm),
  };
});
const report = {
  slice: "S622", receiver: "CLO 2026.1.310 (r58944)", profile: info.import_profile,
  threshold: { cm: 0.001, mm: toleranceMm },
  input: { path: inputPath, sha256: sha(inputBytes), sourcePolylinePath: sourcePath, sourcePolylineSha256: sha(sourceBytes), derivativeReportSha256: sha(derivativeBytes) },
  renderedEvidence: { pdf: { path: renderPdfPath, sha256: sha(renderPdfBytes) }, png: { path: renderPngPath, sha256: sha(renderPngBytes) }, review: "CLO-native 2D snapshot; rendered PNG was visually inspected. Nine outlines and internal lines are present in frame. This image is not used as a substitute for measured geometry acceptance." },
  project: { path: projectPath, sha256: sha(projectBytes), patternCount: info.pattern_count, getterErrors: info.errors },
  comparisonContext: {
    units: "CLO InputInformation coordinates align numerically with this centimeter DXF fixture; both source and native coordinates are converted to millimeters for measurement. No translation, rotation, scale fit, or point correspondence adjustment is applied.",
    priorAamaReference: { slice: aamaComparison.slice, inputSha256: aamaComparison.input.sha256, cutPasses: aamaComparison.summary.cutPasses, sewPasses: aamaComparison.summary.sewPasses, comparisonSha256: sha(aamaComparisonBytes) },
  },
  association: "CUT and SEW closed contours were independently matched geometrically against all native child shapes whose LineList count equals the number of contour points. This avoids treating one-edge open marks as closed contours or assuming CLO pattern index equals DXF contour order. Candidate identities and equal-geometry ties are recorded; the CLO 'Base Line' label is not interpreted as manufacturing semantics.",
  pieces,
  summary: {
    pieceCount: info.pattern_count, inputLineCutPasses: pieces.filter((p) => p.inputCutBest?.sampled.conservativeUpperBoundMm <= toleranceMm).length,
    canonicalCutPasses: pieces.filter((p) => p.cutPass).length, sewPasses: pieces.filter((p) => p.sewPass).length,
    allCutPass: pieces.every((p) => p.cutPass), allSewPass: pieces.every((p) => p.sewPass),
    renderObservation: "Nine pieces are visible in the CLO 2D window; the imported scene shows the contour and internal dotted-line appearance. Rendering is supplementary to native geometry measurement.",
    stageLimit: "This result identifies the native geometry exposed after CLO Standard-DXF import for this fixture/build/settings; it does not establish hidden CLO processing stages, semantic layer mappings, or round-trip behavior.",
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, summary: report.summary, pieces: pieces.map((p) => ({ sourceCutContourOrdinal: p.sourceCutContourOrdinal, patternIndex: p.patternIndex, cutPass: p.cutPass, sewPass: p.sewPass, cutUpperMm: p.cutBest?.sampled.conservativeUpperBoundMm ?? null, sewUpperMm: p.sewBest?.sampled.conservativeUpperBoundMm ?? null })) }, null, 2));
