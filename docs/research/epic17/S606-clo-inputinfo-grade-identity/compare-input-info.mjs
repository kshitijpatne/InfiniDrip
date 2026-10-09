import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const apiPath = "C:/G04-CLO-DXF-Exchange/S606-clo-inputinfo-grade-identity/pattern-input-information.json";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S565-clo-grade-state-diagnosis/s565-corrected-sizegroup1-analysis.json";
const reportPath = "C:/G04-CLO-DXF-Exchange/S606-clo-inputinfo-grade-identity/source-geometry-comparison.json";
const api = JSON.parse(await readFile(apiPath, "utf8"));
const source = JSON.parse(await readFile(sourcePath, "utf8"));
assert.equal(api.count, 3);
assert.equal(api.errors.length, 0);
assert.equal(api.patterns.length, 3);
assert(source.sizeMatches.some(({ size }) => size === "XS"));

const xs = source.sizeMatches.find(({ size }) => size === "XS");
const sourceContours = xs.contours.map((contour) => ({
  sourceIndex: contour.sourceIndex,
  sourceLayer: contour.sourceLayer,
  points: contour.sourceVertices.map(({ x, y }) => ({ x: x * 10, y: y * 10 })),
}));

function extractPoints(list) {
  return list.filter((item) => Number.isInteger(Number(item["Point index"])))
    .map((item) => ({ x: Number(item["Point positionX"]), y: Number(item["Point positionY"]) }));
}

function bestCorrespondence(observed, expected) {
  if (observed.length !== expected.length || observed.length === 0) return null;
  let best = null;
  for (const reverse of [false, true]) {
    const sequence = reverse ? [...expected].reverse() : expected;
    for (let shift = 0; shift < sequence.length; shift += 1) {
      const ordered = [...sequence.slice(shift), ...sequence.slice(0, shift)];
      const distances = observed.map((point, i) => Math.hypot(point.x - ordered[i].x, point.y - ordered[i].y));
      const candidate = { reverse, shift, maxVertexDistanceMm: Math.max(...distances), distancesMm: distances };
      if (best === null || candidate.maxVertexDistanceMm < best.maxVertexDistanceMm) best = candidate;
    }
  }
  return best;
}

function candidatesFor(points) {
  return sourceContours.map((contour) => ({
    sourceIndex: contour.sourceIndex,
    sourceLayer: contour.sourceLayer,
    ...bestCorrespondence(points, contour.points),
  })).filter(({ maxVertexDistanceMm }) => typeof maxVertexDistanceMm === "number")
    .sort((a, b) => a.maxVertexDistanceMm - b.maxVertexDistanceMm);
}

const patternRecords = api.patterns.map((pattern) => {
  const root = pattern.parsed?.["Pattern InputInformation"]?.[0];
  assert(root, `pattern ${pattern.pattern_index} has no parsed input-info root`);
  const rootPoints = extractPoints(root.PointList ?? []);
  const shapes = (root["Children Information"] ?? [])
    .filter((item) => item["Shape index"] !== undefined)
    .map((shape) => {
      const points = extractPoints(shape.PointList ?? []);
      return {
        shapeIndex: Number(shape["Shape index"]),
        shapeName: shape["Shape name"],
        shapeType: shape["Shape type"],
        points,
        sourceCandidates: candidatesFor(points),
      };
    });
  return {
    patternArrayIndex: pattern.pattern_index,
    patternName: root["Pattern name"],
    rootPointCount: rootPoints.length,
    rootPoints,
    rootSourceCandidates: candidatesFor(rootPoints),
    reportedChildShapeCount: Number(root["Children Information"]?.[0]?.["Children shape count"]),
    returnedChildRecords: shapes.length,
    shapes,
  };
});

const result = {
  receiver: "CLO 2026.1.310 (r58944), existing S565 corrected-sizegroup1 project",
  sourceReport: "S565 hash-pinned XS input geometry; source contours are in cm",
  comparison: "Direct coordinate comparison after the S567 DXF-ASTM cm-to-mm factor of 10; cyclic start/reversal only; no translation, rotation, scale fit, or point projection",
  apiUnits: "Not specified by GetPatternInputInformation documentation; mm/cm interpretation is not asserted as API contract",
  acceptanceThresholdMm: 0.01,
  apiCount: api.count,
  apiCalls: api.calls,
  apiErrors: api.errors,
  sourceContourOrder: sourceContours.map(({ sourceIndex, sourceLayer, points }) => ({ sourceIndex, sourceLayer, vertexCount: points.length })),
  patterns: patternRecords,
  identityLimit: "Coordinate congruence binds returned geometry to the corresponding hash-pinned source contour but does not by itself prove that CLO's undocumented Shape type/selection semantics identify a grade-editable internal sewn path.",
};
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  reportPath,
  summary: patternRecords.map(({ patternArrayIndex, patternName, rootSourceCandidates, shapes }) => ({
    patternArrayIndex,
    patternName,
    rootBest: rootSourceCandidates[0] ?? null,
    shapes: shapes.map(({ shapeIndex, shapeType, sourceCandidates }) => ({
      shapeIndex,
      shapeType,
      best: sourceCandidates[0] ?? null,
    })),
  })),
}, null, 2));
