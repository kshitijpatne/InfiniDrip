import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m.dxf";
const lineChainPath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m-cut-lines.dxf";
const lineChainProofPath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Evidence/line-chain-derivative-report.json";
const periodicPath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input/polo-m-periodic-degree1-spline.dxf";
const periodicProofPath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Evidence/Analysis/S595-periodic-source-preflight.json";
const lineApiPath = "C:/G04-CLO-DXF-Exchange/S580-clo-line-info-runtime/Evidence/pattern-line-info.json";
const splineApiPath = "C:/G04-CLO-DXF-Exchange/S597-clo-helper-recovery/Evidence/periodic-preexport-pattern-line-info.json";
const outputPath = "C:/G04-CLO-DXF-Exchange/S598-clo-api-representation-diff/Evidence/representation-comparison.json";
const thresholdMm = 0.001 * 10;
const expectedHashes = {
  source: "796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA",
  lineChain: "A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675",
  periodic: "E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC",
  lineApi: "B5B199F4DD85D538631BB78BD066E843483DB7F60EDB0D6193FFBC4F8E1C5878",
  splineApi: "63A3857B8398F6723B041B3C6E305F3006B364C0EF1FAD185A71590537ACC269",
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const rows = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(rows.length % 2, 0, "DXF group/value rows must be paired");
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
function parseClosedContour(entity, following = []) {
  const type = entity[0]?.[1];
  if (type !== "POLYLINE" && type !== "LWPOLYLINE") return undefined;
  if ((Number(value(entity, 70) ?? 0) & 1) !== 1) return undefined;
  const points = [];
  if (type === "LWPOLYLINE") {
    let x;
    for (const [code, raw] of entity) {
      if (code === 10) x = Number(raw);
      if (code === 20 && x !== undefined) { points.push({ x, y: Number(raw) }); x = undefined; }
    }
  } else {
    for (const child of following) {
      if (child[0]?.[1] === "SEQEND") break;
      if (child[0]?.[1] === "VERTEX") points.push({ x: Number(value(child, 10)), y: Number(value(child, 20)) });
    }
  }
  return { type, layer: value(entity, 8) ?? "(none)", points };
}
function extractContours(bytes) {
  const entities = parseDxf(bytes).find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const result = [];
  for (let index = 0; index < entities.length; index += 1) {
    const contour = parseClosedContour(entities[index], entities.slice(index + 1));
    if (contour) result.push({ ordinal: result.length, ...contour });
  }
  return result;
}
const segments = (points) => points.map((point, index) => [point, points[(index + 1) % points.length]]);
function pointSegmentDistance(point, [a, b]) {
  const dx = b.x - a.x; const dy = b.y - a.y; const d2 = dx * dx + dy * dy;
  const t = d2 ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / d2)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
function symmetricVertexSegmentDistance(pointsA, segmentsB) {
  const segmentsA = segments(pointsA);
  const endpointsB = segmentsB.flat();
  const aToB = Math.max(...pointsA.map((point) => Math.min(...segmentsB.map((segment) => pointSegmentDistance(point, segment)))));
  const bToA = Math.max(...endpointsB.map((point) => Math.min(...segmentsA.map((segment) => pointSegmentDistance(point, segment)))));
  return Math.max(aToB, bToA);
}
const bounds = (points) => ({ minX: Math.min(...points.map(({ x }) => x)), minY: Math.min(...points.map(({ y }) => y)), maxX: Math.max(...points.map(({ x }) => x)), maxY: Math.max(...points.map(({ y }) => y)), width: Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x)), height: Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y)) });
function extractApiPieces(bytes, expectedSlice) {
  const api = JSON.parse(bytes.toString("utf8"));
  if (api.slice !== undefined) assert.equal(api.slice, expectedSlice);
  assert.equal(api.clo_build_observed_ui, "2026.1.310");
  assert.equal(api.pattern_count, 9);
  assert.equal(api.pieces.length, 9);
  assert.equal(api.error, null);
  return api.pieces.map((piece, index) => {
    assert.equal(piece.index, index);
    assert.equal(piece.error, null);
    assert.equal(piece.line_info.status, "success");
    const lines = piece.line_info.lines.map(({ start, end }) => [start, end]);
    assert.equal(piece.line_info.lineCount, lines.length);
    const closureGapMm = Math.hypot(lines.at(-1)[1].x - lines[0][0].x, lines.at(-1)[1].y - lines[0][0].y);
    const consecutiveGapMm = Math.max(0, ...lines.slice(0, -1).map((line, i) => Math.hypot(line[1].x - lines[i + 1][0].x, line[1].y - lines[i + 1][0].y)));
    const endpointBounds = bounds(lines.flat());
    const returnedBounds = piece.line_info.boundingBox;
    const boundsResidualMm = Math.max(...["minX", "minY", "maxX", "maxY", "width", "height"].map((key) => Math.abs(endpointBounds[key] - returnedBounds[key])));
    return { index, apiName: piece.name, lines, lineCount: lines.length, bounds: returnedBounds, closureGapMm, consecutiveGapMm, boundsResidualMm };
  });
}
function sourceMatches(piece, contours) {
  return contours.map((contour) => {
    const pointsMm = contour.points.map(({ x, y }) => ({ x: x * 10, y: y * 10 }));
    return { sourceOrdinal: contour.ordinal, literalLayer: contour.layer, vertexCount: pointsMm.length, residualMm: symmetricVertexSegmentDistance(pointsMm, piece.lines) };
  }).sort((a, b) => a.residualMm - b.residualMm);
}

const paths = [sourcePath, lineChainPath, lineChainProofPath, periodicPath, periodicProofPath, lineApiPath, splineApiPath];
const contents = await Promise.all(paths.map((path) => readFile(path)));
const [sourceBytes, lineChainBytes, lineChainProofBytes, periodicBytes, periodicProofBytes, lineApiBytes, splineApiBytes] = contents;
const hashes = Object.fromEntries(paths.map((path, i) => [path, sha(contents[i])]));
for (const [path, expected] of [[sourcePath, expectedHashes.source], [lineChainPath, expectedHashes.lineChain], [periodicPath, expectedHashes.periodic], [lineApiPath, expectedHashes.lineApi], [splineApiPath, expectedHashes.splineApi]]) assert.equal(hashes[path], expected, `unexpected pinned input ${path}`);
const lineChainProof = JSON.parse(lineChainProofBytes.toString("utf8"));
assert.equal(lineChainProof.inputSha256, expectedHashes.source);
assert.equal(lineChainProof.outputSha256, expectedHashes.lineChain);
assert.equal(lineChainProof.sourceCutPolylineCount, 9);
assert.equal(lineChainProof.emittedCutLineCount, 301);
assert.equal(lineChainProof.convertedEdgesUseExactSourceEndpointStrings, true);
assert.equal(lineChainProof.lineEdgesCloseEverySourceContour, true);
const periodicProof = JSON.parse(periodicProofBytes.toString("utf8"));
assert.equal(periodicProof.source.sha256.toUpperCase(), expectedHashes.source);
assert.equal(periodicProof.output.sha256.toUpperCase(), expectedHashes.periodic);
assert.equal(periodicProof.allFivePeriodicCurvesProvenSourceExact, true);
const sourceContours = extractContours(sourceBytes);
assert.equal(sourceContours.length, 18);
assert.ok(sourceContours.every((contour, index) => contour.layer === (index % 2 === 0 ? "CUT" : "SEW")));
const lineApi = extractApiPieces(lineApiBytes, "S580");
const splineApi = extractApiPieces(splineApiBytes, "S597");
const lineMatches = lineApi.map((piece) => sourceMatches(piece, sourceContours));
const splineMatches = splineApi.map((piece) => sourceMatches(piece, sourceContours));
const targetCutOrdinals = [2, 10, 12, 14, 16];
const nearestApiSlotsByTarget = (apiPieces) => targetCutOrdinals.map((sourceOrdinal) => {
  const contour = sourceContours[sourceOrdinal];
  assert.equal(contour.layer, "CUT", `target contour ${sourceOrdinal} must be a literal source CUT layer`);
  const pointsMm = contour.points.map(({ x, y }) => ({ x: x * 10, y: y * 10 }));
  const nearest = apiPieces.map((piece) => ({ observationIndex: piece.index, residualMm: symmetricVertexSegmentDistance(pointsMm, piece.lines) })).sort((a, b) => a.residualMm - b.residualMm);
  return { sourceContourOrdinal: sourceOrdinal, nearestApiObservationSlots: nearest.slice(0, 3), slotsWithinSourceThreshold: nearest.filter(({ residualMm }) => residualMm <= thresholdMm).map(({ observationIndex }) => observationIndex) };
});
const pairedSlots = lineApi.map((linePiece, index) => {
  const splinePiece = splineApi[index];
  const directDistanceMm = symmetricVertexSegmentDistance(linePiece.lines.flat().filter((_, i) => i % 2 === 0), splinePiece.lines);
  const lineMin = { x: linePiece.bounds.minX, y: linePiece.bounds.minY };
  const splineMin = { x: splinePiece.bounds.minX, y: splinePiece.bounds.minY };
  const lineTop = { x: linePiece.bounds.maxX, y: linePiece.bounds.maxY };
  const splineTop = { x: splinePiece.bounds.maxX, y: splinePiece.bounds.maxY };
  return {
    observationIndex: index,
    lineChain: { apiName: linePiece.apiName, lineCount: linePiece.lineCount, boundsMm: linePiece.bounds, closureGapMm: linePiece.closureGapMm, consecutiveGapMm: linePiece.consecutiveGapMm, boundsResidualMm: linePiece.boundsResidualMm, nearestSourceContours: lineMatches[index].slice(0, 3), withinSourceThreshold: lineMatches[index].filter(({ residualMm }) => residualMm <= thresholdMm) },
    periodicSpline: { apiName: splinePiece.apiName, lineCount: splinePiece.lineCount, boundsMm: splinePiece.bounds, closureGapMm: splinePiece.closureGapMm, consecutiveGapMm: splinePiece.consecutiveGapMm, boundsResidualMm: splinePiece.boundsResidualMm, nearestSourceContours: splineMatches[index].slice(0, 3), withinSourceThreshold: splineMatches[index].filter(({ residualMm }) => residualMm <= thresholdMm) },
    deltas: { lineCount: splinePiece.lineCount - linePiece.lineCount, minXmm: splineMin.x - lineMin.x, minYmm: splineMin.y - lineMin.y, maxXmm: splineTop.x - lineTop.x, maxYmm: splineTop.y - lineTop.y, widthMm: splinePiece.bounds.width - linePiece.bounds.width, heightMm: splinePiece.bounds.height - linePiece.bounds.height, directFrameEndpointToOpposingPolylineDistanceMm: directDistanceMm },
  };
});
const report = {
  slice: "S598",
  purpose: "Compare existing read-only CLO pre-export line-info captures across connected-LINE and periodic-SPLINE representations of the same hash-pinned Polo M R12 source.",
  method: { units: "source DXF cm converted to API mm by ×10", thresholdCm: 0.001, thresholdMm, matching: "symmetric source-vertex-to-returned-segment and returned-endpoint-to-source-segment diagnostic; not the V03 round-trip contour acceptance metric", directCaptureComparison: "same numeric API index only; absolute coordinates, no fitted translation/rotation/scale/reflection", semantics: "source DXF layer names remain literal source metadata; CLO API does not assign CUT/SEW roles or promise index-stable piece identity" },
  commonSource: { path: sourcePath, sha256: hashes[sourcePath], closedContourCount: sourceContours.length, sourceLineChainDerivation: { path: lineChainPath, sha256: hashes[lineChainPath], reportPath: lineChainProofPath, reportSha256: hashes[lineChainProofPath], exactSourceEndpointStrings: lineChainProof.convertedEdgesUseExactSourceEndpointStrings, closedChains: lineChainProof.lineEdgesCloseEverySourceContour }, periodicSplineDerivation: { path: periodicPath, sha256: hashes[periodicPath], proofPath: periodicProofPath, proofSha256: hashes[periodicProofPath], fiveCurvesSourceExact: periodicProof.allFivePeriodicCurvesProvenSourceExact } },
  captures: { connectedLine: { slice: "S580", cloBuild: "2026.1.310", apiPath: lineApiPath, apiSha256: hashes[lineApiPath], sourceContext: "S574 import of connected-LINE CUT derivative; read-only query in S580" }, periodicSpline: { slice: "S597", cloBuild: "2026.1.310", apiPath: splineApiPath, apiSha256: hashes[splineApiPath], sourceContext: "S595 import of five periodic SPLINE CUT contours; read-only query in S597" } },
  periodicCandidateCutSourceContours: targetCutOrdinals.map((ordinal) => ({ sourceContourOrdinal: ordinal, sourceRoleLabel: sourceContours[ordinal].layer, sourceVertexCount: sourceContours[ordinal].points.length })),
  closestApiObservationForEachCandidateCut: { connectedLineCapture: nearestApiSlotsByTarget(lineApi), periodicSplineCapture: nearestApiSlotsByTarget(splineApi) },
  pairedObservationSlots: pairedSlots,
  summary: {
    lineChainLineCounts: lineApi.map(({ lineCount }) => lineCount),
    periodicSplineLineCounts: splineApi.map(({ lineCount }) => lineCount),
    indexesWithDifferentLineCount: pairedSlots.filter(({ deltas }) => deltas.lineCount !== 0).map(({ observationIndex }) => observationIndex),
    lineChainSlotsWithSourceContourWithinThreshold: lineMatches.filter((matches) => matches.some(({ residualMm }) => residualMm <= thresholdMm)).length,
    lineChainSlotsMatchingLiteralCutLayer: lineMatches.filter((matches) => matches.some(({ literalLayer, residualMm }) => literalLayer === "CUT" && residualMm <= thresholdMm)).length,
    lineChainSlotsMatchingLiteralSewLayer: lineMatches.filter((matches) => matches.some(({ literalLayer, residualMm }) => literalLayer === "SEW" && residualMm <= thresholdMm)).length,
    periodicSplineSlotsWithSourceContourWithinThreshold: splineMatches.filter((matches) => matches.some(({ residualMm }) => residualMm <= thresholdMm)).length,
    periodicSplineSlotsMatchingLiteralCutLayer: splineMatches.filter((matches) => matches.some(({ literalLayer, residualMm }) => literalLayer === "CUT" && residualMm <= thresholdMm)).length,
    periodicSplineSlotsMatchingLiteralSewLayer: splineMatches.filter((matches) => matches.some(({ literalLayer, residualMm }) => literalLayer === "SEW" && residualMm <= thresholdMm)).length,
    bothCapturePathsContinuousAndClosedWithinScreeningThreshold: [...lineApi, ...splineApi].every(({ closureGapMm, consecutiveGapMm }) => closureGapMm <= thresholdMm && consecutiveGapMm <= thresholdMm),
    bothCaptureReportedBoundsMatchReturnedEndpointsWithinScreeningThreshold: [...lineApi, ...splineApi].every(({ boundsResidualMm }) => boundsResidualMm <= thresholdMm),
  },
  conclusionLimit: "These two existing captures differ in representation and some returned outline data, but the comparison does not assign piece identity to API indexes, does not infer CUT/SEW semantics, and does not locate a change inside CLO import, API exposure, export, or another stage. The S574 and S595 actual export round-trip results remain controlling and unchanged.",
};
assert.equal(report.summary.lineChainLineCounts.join(","), "33,33,31,4,4,58,58,44,44");
assert.equal(report.summary.periodicSplineLineCounts.join(","), "33,6,31,4,4,58,58,15,15");
assert.equal(report.summary.indexesWithDifferentLineCount.join(","), "1,7,8");
assert.ok(report.closestApiObservationForEachCandidateCut.periodicSplineCapture.every(({ slotsWithinSourceThreshold }) => slotsWithinSourceThreshold.length === 0));
assert.equal(report.summary.bothCapturePathsContinuousAndClosedWithinScreeningThreshold, true);
assert.equal(report.summary.bothCaptureReportedBoundsMatchReturnedEndpointsWithinScreeningThreshold, true);
await mkdir("C:/G04-CLO-DXF-Exchange/S598-clo-api-representation-diff/Evidence", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, hashes, summary: report.summary, pairedObservationSlots: pairedSlots.map(({ observationIndex, deltas, lineChain, periodicSpline }) => ({ observationIndex, lineCount: [lineChain.lineCount, periodicSpline.lineCount], deltas, matches: { lineChain: lineChain.withinSourceThreshold, periodicSpline: periodicSpline.withinSourceThreshold } })) }, null, 2));
