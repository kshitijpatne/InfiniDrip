import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m.dxf";
const apiPath = "C:/G04-CLO-DXF-Exchange/S580-clo-line-info-runtime/Evidence/pattern-line-info.json";
const reportPath = "C:/G04-CLO-DXF-Exchange/S580-clo-line-info-runtime/Evidence/source-boundary-comparison.json";
const scaleMmPerCm = 10;
const gateCm = 0.001;
const gateMm = gateCm * scaleMmPerCm;

function parseDxf(bytes) {
  const rows = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(rows.length % 2, 0, "DXF code/value pairs must be complete");
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) pairs.push([Number(rows[i].trim()), rows[i + 1].trim()]);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
      section = undefined;
    } else if (section && pairs[i][0] === 0) {
      const start = i;
      i += 1;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.entities.push(pairs.slice(start, i));
      i -= 1;
    }
  }
  return sections;
}

function value(entity, code) {
  return entity.find(([group]) => group === code)?.[1];
}

function contour(entity, following) {
  const type = entity[0]?.[1];
  const layer = value(entity, 8) ?? "(none)";
  if (type === "LWPOLYLINE") {
    const points = [];
    let x;
    for (const [code, raw] of entity) {
      if (code === 10) x = Number(raw);
      if (code === 20 && x !== undefined) {
        points.push({ x, y: Number(raw) });
        x = undefined;
      }
    }
    return { type, layer, points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  }
  if (type !== "POLYLINE") return undefined;
  const points = [];
  for (const child of following) {
    if (child[0]?.[1] === "SEQEND") break;
    if (child[0]?.[1] === "VERTEX") points.push({ x: Number(value(child, 10)), y: Number(value(child, 20)) });
  }
  return { type, layer, points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
}

function segments(points, closed) {
  const result = [];
  for (let i = 0; i + 1 < points.length; i += 1) result.push([points[i], points[i + 1]]);
  if (closed && points.length > 2) result.push([points.at(-1), points[0]]);
  return result;
}

function pointSegmentDistance(point, [start, end]) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length2)) : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function symmetricDistance(sourcePointsMm, targetSegmentsMm) {
  const sourceSegments = segments(sourcePointsMm, true);
  const targetPoints = targetSegmentsMm.flat();
  const forward = Math.max(...sourcePointsMm.map((point) => Math.min(...targetSegmentsMm.map((seg) => pointSegmentDistance(point, seg)))));
  const reverse = Math.max(...targetPoints.map((point) => Math.min(...sourceSegments.map((seg) => pointSegmentDistance(point, seg)))));
  return Math.max(forward, reverse);
}

function bounds(points) {
  return {
    minX: Math.min(...points.map(({ x }) => x)),
    minY: Math.min(...points.map(({ y }) => y)),
    maxX: Math.max(...points.map(({ x }) => x)),
    maxY: Math.max(...points.map(({ y }) => y)),
  };
}

const [sourceBytes, apiBytes] = await Promise.all([readFile(sourcePath), readFile(apiPath)]);
const sourceEntities = parseDxf(sourceBytes).find(({ name }) => name === "ENTITIES")?.entities ?? [];
const contours = [];
for (let i = 0; i < sourceEntities.length; i += 1) {
  const parsed = contour(sourceEntities[i], sourceEntities.slice(i + 1));
  if (parsed?.closed) contours.push({ ordinal: contours.length, ...parsed });
}
assert.equal(contours.length, 18, "hash-pinned source must contain nine CUT/SEW pairs");
assert.ok(contours.every((item, index) => item.layer === (index % 2 === 0 ? "CUT" : "SEW")));
const api = JSON.parse(apiBytes.toString("utf8"));
assert.equal(api.clo_build_observed_ui, "2026.1.310");
assert.equal(api.pattern_count, 9);
assert.equal(api.pieces.length, 9);
const pieces = api.pieces.map((piece) => {
  assert.equal(piece.error, null);
  assert.equal(piece.line_info.status, "success");
  const returned = piece.line_info.lines.map(({ start, end }) => [start, end]);
  assert.equal(piece.line_info.lineCount, returned.length, `pattern ${piece.index} lineCount must match returned lines`);
  const consecutiveGapMm = returned.slice(0, -1).map((segment, index) => Math.hypot(segment[1].x - returned[index + 1][0].x, segment[1].y - returned[index + 1][0].y));
  const closureGapMm = Math.hypot(returned.at(-1)[1].x - returned[0][0].x, returned.at(-1)[1].y - returned[0][0].y);
  const allEndpoints = returned.flat();
  const calculatedBounds = bounds(allEndpoints);
  const reportedBounds = piece.line_info.boundingBox;
  const bboxResidualMm = Math.max(...Object.keys(calculatedBounds).map((key) => Math.abs(calculatedBounds[key] - reportedBounds[key])));
  const maxSegmentLengthResidualMm = Math.max(...piece.line_info.lines.map((line) => Math.abs(line.length - Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y))));
  const maxConsecutiveGapMm = consecutiveGapMm.length ? Math.max(...consecutiveGapMm) : 0;
  const sourceMatches = contours.map((item) => {
    const pointsMm = item.points.map(({ x, y }) => ({ x: x * scaleMmPerCm, y: y * scaleMmPerCm }));
    return { ordinal: item.ordinal, layer: item.layer, sourceVertexCount: item.points.length, residualMm: symmetricDistance(pointsMm, returned) };
  }).sort((a, b) => a.residualMm - b.residualMm);
  return {
    patternIndex: piece.index,
    patternName: piece.name,
    returnedLineCount: piece.line_info.lineCount,
    returnedBoundsMm: piece.line_info.boundingBox,
    pathIntegrity: { maxConsecutiveGapMm, closureGapMm, bboxResidualMm, maxSegmentLengthResidualMm },
    returnedPathClosed: closureGapMm <= gateMm,
    diagnosticBestTranslationMm: (() => {
      const outputBounds = piece.line_info.boundingBox;
      const translated = contours.map((item) => {
        const sourceMm = item.points.map(({ x, y }) => ({ x: x * scaleMmPerCm, y: y * scaleMmPerCm }));
        const sourceBounds = bounds(sourceMm);
        const dx = outputBounds.minX - sourceBounds.minX;
        const dy = outputBounds.minY - sourceBounds.minY;
        const moved = sourceMm.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
        return { ordinal: item.ordinal, layer: item.layer, dx, dy, residualMm: symmetricDistance(moved, returned) };
      }).sort((a, b) => a.residualMm - b.residualMm);
      return translated.slice(0, 2);
    })(),
    bestSourceMatches: sourceMatches.slice(0, 4),
    withinGateSourceMatches: sourceMatches.filter(({ residualMm }) => residualMm <= gateMm),
  };
});
const report = {
  method: {
    units: "Official CLO API line coordinates/lengths are documented in millimeters; source DXF uses centimeters, converted exactly by ×10.",
    comparison: "Gate comparison is symmetric maximum source-vertex-to-returned-segment and returned-endpoint-to-source-segment distance in the documented direct frame, with no fitted transform. A separate bounding-box-minimum-aligned translation diagnostic is recorded only to surface possible layout displacement and never contributes to match counts or the gate.",
    gateCm,
    gateMm,
    semantics: "CLO's GetPatternLineInfo documentation describes pattern outline lines but does not assign CUT/SEW roles; source layers are retained literally and matches establish geometry only.",
  },
  source: { path: sourcePath, sha256: createHash("sha256").update(sourceBytes).digest("hex").toUpperCase(), contourCount: contours.length, contours: contours.map(({ ordinal, type, layer, points }) => ({ ordinal, type, layer, vertexCount: points.length, boundsCm: bounds(points) })) },
  api: { path: apiPath, sha256: createHash("sha256").update(apiBytes).digest("hex").toUpperCase(), patternCount: api.pattern_count },
  pieces,
  summary: {
    piecesWithExactlyOneWithinGateSourceContour: pieces.filter(({ withinGateSourceMatches }) => withinGateSourceMatches.length === 1).length,
    piecesWithCUTMatch: pieces.filter(({ withinGateSourceMatches }) => withinGateSourceMatches.some(({ layer }) => layer === "CUT")).length,
    piecesWithSEWMatch: pieces.filter(({ withinGateSourceMatches }) => withinGateSourceMatches.some(({ layer }) => layer === "SEW")).length,
    piecesWithClosedReturnedPath: pieces.filter(({ returnedPathClosed }) => returnedPathClosed).length,
    piecesWithContinuousAndClosedLineSequence: pieces.filter(({ pathIntegrity }) => Math.max(pathIntegrity.maxConsecutiveGapMm, pathIntegrity.closureGapMm) <= gateMm).length,
    piecesWithReturnedBoundingBoxMatchingEndpoints: pieces.filter(({ pathIntegrity }) => pathIntegrity.bboxResidualMm <= gateMm).length,
    piecesWithReportedLineLengthsMatchingEndpoints: pieces.filter(({ pathIntegrity }) => pathIntegrity.maxSegmentLengthResidualMm <= gateMm).length,
  },
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ reportPath, sourceSha256: report.source.sha256, apiSha256: report.api.sha256, summary: report.summary, pieces: pieces.map(({ patternIndex, returnedLineCount, returnedBoundsMm, pathIntegrity, returnedPathClosed, bestSourceMatches, withinGateSourceMatches }) => ({ patternIndex, returnedLineCount, returnedBoundsMm, pathIntegrity, returnedPathClosed, bestSourceMatches, withinGateSourceMatches })) }, null, 2));
