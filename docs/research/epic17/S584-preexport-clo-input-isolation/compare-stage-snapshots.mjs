import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const paths = {
  s583: "C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/pattern-information.json",
  s584: "C:/G04-CLO-DXF-Exchange/S584-preexport-clo-input-isolation/Evidence/preexport-pattern-input-information.json",
  s583Geometry: "C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/source-geometry-comparison.json",
  s584Geometry: "C:/G04-CLO-DXF-Exchange/S584-preexport-clo-input-isolation/Evidence/preexport-source-geometry-comparison.json",
  output: "C:/G04-CLO-DXF-Exchange/S584-preexport-clo-input-isolation/Evidence/preexport-vs-s583-stage-comparison.json",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const bytes = await Promise.all([readFile(paths.s583), readFile(paths.s584), readFile(paths.s583Geometry), readFile(paths.s584Geometry)]);
const [s583, s584, s583Geometry, s584Geometry] = bytes.map((value) => JSON.parse(value));
assert.equal(s584.project_sha256, "43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25");
assert.equal(s583.pattern_count, 9);
assert.equal(s584.pattern_count, 9);
assert.equal(s583.patterns.length, 9);
assert.equal(s584.patterns.length, 9);
assert.equal(s584Geometry.source.sha256, s583Geometry.source.sha256);
assert.equal(s584Geometry.importedFixture.sha256, s583Geometry.importedFixture.sha256);
assert.deepEqual(
  [s584Geometry.exactGeometrySummary.patternsWithAtLeastOneSourceContourMatch, s584Geometry.exactGeometrySummary.patternsMatchingLiteralCut, s584Geometry.exactGeometrySummary.patternsMatchingLiteralSew],
  [s583Geometry.exactGeometrySummary.patternsWithAtLeastOneSourceContourMatch, s583Geometry.exactGeometrySummary.patternsMatchingLiteralCut, s583Geometry.exactGeometrySummary.patternsMatchingLiteralSew],
);
const patterns = s584.patterns.map((pre, index) => {
  const prior = s583.patterns[index];
  assert.equal(pre.pattern_index, index);
  assert.equal(prior.pattern_index, index);
  assert.equal(pre.pattern_name, prior.pattern_name);
  const cur = pre.information.GetPatternInputInformation;
  const old = prior.information.GetPatternInputInformation;
  assert.equal(cur.call_error, null, `pre-export getter call failed for index ${index}`);
  assert.equal(cur.parse_error, null, `pre-export JSON parse failed for index ${index}`);
  assert.equal(old.call_error, null, `S583 getter call failed for index ${index}`);
  assert.equal(old.parse_error, null, `S583 JSON parse failed for index ${index}`);
  const newPoints = s584Geometry.patterns[index].returnedPoints;
  const oldPoints = s583Geometry.patterns[index].returnedPoints;
  assert.equal(newPoints.length, oldPoints.length, `point count differs at index ${index}`);
  let maxDeltaMm = 0;
  let sumSquares = 0;
  for (let pointIndex = 0; pointIndex < newPoints.length; pointIndex += 1) {
    const deltaMm = Math.hypot(newPoints[pointIndex].x - oldPoints[pointIndex].x, newPoints[pointIndex].y - oldPoints[pointIndex].y);
    maxDeltaMm = Math.max(maxDeltaMm, deltaMm);
    sumSquares += deltaMm * deltaMm;
  }
  const oldCandidates = s583Geometry.patterns[index].exactGeometryCandidates.map(({ sourceOrdinal }) => sourceOrdinal).sort((a, b) => a - b);
  const newCandidates = s584Geometry.patterns[index].exactGeometryCandidates.map(({ sourceOrdinal }) => sourceOrdinal).sort((a, b) => a - b);
  assert.deepEqual(newCandidates, oldCandidates, `source contour candidate set differs at index ${index}`);
  return {
    patternIndex: index,
    patternName: pre.pattern_name,
    returnedPointCount: newPoints.length,
    sourceGeometryCandidateOrdinals: newCandidates,
    interSnapshotMaxPointDeltaMm: maxDeltaMm,
    interSnapshotRmsPointDeltaMm: newPoints.length ? Math.sqrt(sumSquares / newPoints.length) : 0,
    rawGetterByteExactToS583: cur.raw === old.raw,
    parsedGetterDeepEqualToS583: JSON.stringify(cur.parsed) === JSON.stringify(old.parsed),
  };
});
const report = {
  slice: "S584",
  question: "Are S583's GetPatternInputInformation geometry observations present in the selected hash-pinned post-input-import, pre-export project?",
  preExportProject: { path: s584.project_path, sha256: s584.project_sha256 },
  getterName: "GetPatternInputInformation(index)",
  failures: { getterCalls: 0, jsonParses: 0 },
  geometryComparison: s584Geometry.comparison,
  sourceMatchAggregate: s584Geometry.exactGeometrySummary,
  perPattern: patterns,
  interpretation: "The pre-export snapshot returns the same nine pattern indexes/names/counts and the same source-contour candidate sets as S583. Per-point numeric differences are reported directly; the getter JSON is not byte-identical. The source comparison still finds eight patterns matching literal SEW contours and none matching literal CUT contours, with index 3 unmatched. This establishes that the observed getter geometry exists in this saved pre-export project, but the public getter has no documented CUT/SEW or pipeline-stage contract; it does not by itself assign causation to CLO's importer or exporter.",
  inputHashes: {
    s583GetterSnapshot: sha256(bytes[0]),
    s584GetterSnapshot: sha256(bytes[1]),
    s583GeometryComparison: sha256(bytes[2]),
    s584GeometryComparison: sha256(bytes[3]),
  },
};
await writeFile(paths.output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ output: paths.output, failures: report.failures, sourceMatchAggregate: { matchingPatterns: report.sourceMatchAggregate.patternsWithAtLeastOneSourceContourMatch, literalCUT: report.sourceMatchAggregate.patternsMatchingLiteralCut, literalSEW: report.sourceMatchAggregate.patternsMatchingLiteralSew }, maxInterSnapshotPointDeltaMm: Math.max(...patterns.map(({ interSnapshotMaxPointDeltaMm }) => interSnapshotMaxPointDeltaMm)), perPattern: patterns.map(({ patternIndex, sourceGeometryCandidateOrdinals, returnedPointCount, interSnapshotMaxPointDeltaMm }) => ({ patternIndex, sourceGeometryCandidateOrdinals, returnedPointCount, interSnapshotMaxPointDeltaMm })) }, null, 2));
