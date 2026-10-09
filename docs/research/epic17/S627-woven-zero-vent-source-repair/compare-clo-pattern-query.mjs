import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S627-woven-zero-vent-source-repair";
const sourcePath = `${root}/Input/woven-shirt-sideVentDepth-min.dxf`;
const queryPath = `${root}/Evidence/clo-pattern-query.json`;
const reportPath = `${root}/Evidence/clo-source-contour-comparison.json`;
const toleranceMm = 0.01; // 0.001 cm, using observed import centimeters and API millimeters.

function parseDxf(bytes) {
  const rows = bytes.toString("utf8").replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  assert.equal(rows.length % 2, 0, "DXF must contain complete group-code/value pairs");
  const entities = [];
  let entity;
  for (let index = 0; index < rows.length; index += 2) {
    const code = Number(rows[index].trim());
    const value = rows[index + 1].trim();
    if (code === 0) {
      if (entity) entities.push(entity);
      entity = { type: value, layer: "(none)", fields: [], vertices: [] };
      continue;
    }
    if (!entity) continue;
    entity.fields.push([code, value]);
    if (code === 8) entity.layer = value;
  }
  if (entity) entities.push(entity);
  const contours = [];
  for (let index = 0; index < entities.length; index += 1) {
    const item = entities[index];
    if (item.type !== "POLYLINE") continue;
    const flags = Number(item.fields.find(([code]) => code === 70)?.[1] ?? 0);
    for (let cursor = index + 1; cursor < entities.length && entities[cursor].type !== "SEQEND"; cursor += 1) {
      if (entities[cursor].type !== "VERTEX") continue;
      const fields = entities[cursor].fields;
      item.vertices.push({
        x: Number(fields.find(([code]) => code === 10)?.[1]),
        y: Number(fields.find(([code]) => code === 20)?.[1]),
      });
    }
    if (flags & 1) contours.push({ layer: item.layer, type: item.type, points: item.vertices });
  }
  return contours;
}

function maximumResidual(source, actual, reverse, shift) {
  let maximum = 0;
  for (let index = 0; index < source.length; index += 1) {
    const sourceIndex = (shift + (reverse ? source.length - index : index)) % source.length;
    const expected = { x: source[sourceIndex].x * 10, y: source[sourceIndex].y * 10 };
    const observed = actual[index];
    maximum = Math.max(maximum, Math.hypot(expected.x - observed.x, expected.y - observed.y));
  }
  return maximum;
}

function compare(source, actual) {
  if (source.length !== actual.length || source.length === 0) return { vertexCountMatch: false, maximumResidualMm: null, reverse: null, shift: null };
  let best = { vertexCountMatch: true, maximumResidualMm: Infinity, reverse: false, shift: 0 };
  for (const reverse of [false, true]) {
    for (let shift = 0; shift < source.length; shift += 1) {
      const maximum = maximumResidual(source, actual, reverse, shift);
      if (maximum < best.maximumResidualMm) best = { vertexCountMatch: true, maximumResidualMm: maximum, reverse, shift };
    }
  }
  return best;
}

const [sourceBytes, queryBytes] = await Promise.all([readFile(sourcePath), readFile(queryPath)]);
const sourceContours = parseDxf(sourceBytes);
const query = JSON.parse(queryBytes.toString("utf8"));
assert.equal(query.profile, "DXF-AAMA");
assert.equal(query.pattern_count, 12);
assert.equal(sourceContours.length, 24, "expect ordered CUT/SEW contour pairs for twelve source pieces");

const cases = query.patterns.map((pattern, sourceIndex) => {
  const sourceCut = sourceContours[sourceIndex * 2];
  const sourceSew = sourceContours[sourceIndex * 2 + 1];
  assert.equal(sourceCut.layer, "CUT");
  assert.equal(sourceSew.layer, "SEW");
  const lineInfo = pattern.getters.GetPatternLineInfo.parsed;
  const linePoints = lineInfo.lines.map((line) => line.start);
  const cutLine = compare(sourceCut.points, linePoints);
  const input = pattern.getters.GetPatternInputInformation.parsed["Pattern InputInformation"][0];
  const shapes = input["Children Information"].slice(1).map((shape) => {
    const points = shape.PointList.slice(1).map((point) => ({
      x: point["Point positionX"], y: point["Point positionY"],
    }));
    return { shapeIndex: Number(shape["Shape index"]), pointCount: points.length,
      cut: compare(sourceCut.points, points), sew: compare(sourceSew.points, points) };
  });
  const cutCandidates = shapes.filter((shape) => shape.cut.maximumResidualMm !== null && shape.cut.maximumResidualMm <= toleranceMm);
  const sewCandidates = shapes.filter((shape) => shape.sew.maximumResidualMm !== null && shape.sew.maximumResidualMm <= toleranceMm);
  return {
    patternIndex: pattern.pattern_index,
    observedPatternName: pattern.pattern_name,
    sourcePairIndex: sourceIndex,
    sourceCutVertexCount: sourceCut.points.length,
    sourceSewVertexCount: sourceSew.points.length,
    lineInfoCutComparison: cutLine,
    cutPointListMatches: cutCandidates.map(({ shapeIndex, cut }) => ({ shapeIndex, ...cut })),
    sewPointListMatches: sewCandidates.map(({ shapeIndex, sew }) => ({ shapeIndex, ...sew })),
    pointListShapeCount: shapes.length,
    allShapeComparisons: shapes,
  };
});

const summary = {
  thresholdMm: toleranceMm,
  sourceToNativeUnitFactor: 10,
  sourceToNativeTransform: "fixed x10 unit conversion only; no fitted translation, scale, rotation, or reflection; cyclic start/reverse allowed for vertex ordering",
  sourcePairCount: sourceContours.length / 2,
  nativePatternCount: query.pattern_count,
  lineInfoCutMatches: cases.filter((item) => item.lineInfoCutComparison.maximumResidualMm !== null
    && item.lineInfoCutComparison.maximumResidualMm <= toleranceMm).length,
  cutPointListPatternMatches: cases.filter((item) => item.cutPointListMatches.length > 0).length,
  sewPointListPatternMatches: cases.filter((item) => item.sewPointListMatches.length > 0).length,
  allPiecesHaveCutAndSewPointMatches: cases.every((item) => item.cutPointListMatches.length > 0 && item.sewPointListMatches.length > 0),
};
const report = { slice: "S627", receiver: "CLO 2026.1.310", profile: "DXF-AAMA", sourcePath, queryPath,
  method: "GetPatternLineInfo and GetPatternInputInformation point sequences against source ordered CUT/SEW closed POLYLINEs",
  summary, cases };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, reportPath }, null, 2));
