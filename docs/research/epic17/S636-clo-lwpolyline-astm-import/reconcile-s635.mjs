import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const s635 = "C:/G04-CLO-DXF-Exchange/S635-cut-lwpolyline-import/Evidence/native-cut-contour-comparison.json";
const s636 = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import/Evidence/native-cut-contour-comparison.json";
const output = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import/Evidence/s635-s636-matrix-reconciliation.json";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const [aBytes, bBytes] = await Promise.all([readFile(s635), readFile(s636)]);
const a = JSON.parse(aBytes.toString("utf8"));
const b = JSON.parse(bBytes.toString("utf8"));
assert.equal(a.toleranceCm, 0.001);
assert.equal(b.toleranceCm, a.toleranceCm);
assert.equal(a.fixtures.source.sha256, b.fixtures.source.sha256);
assert.equal(a.fixtures.derivative.sha256, b.fixtures.derivative.sha256);
assert.equal(a.results.length, 9);
assert.equal(b.results.length, 9);
const normalize = (report) => report.results.map((result) => ({
  piece: result.piece,
  sourceVertexCount: result.sourceVertexCount,
  nativeIdentity: { patternIndex: result.nativeIdentity.patternIndex, patternName: result.nativeIdentity.patternName },
  status: result.status,
  missingVertexIndex: result.missingVertex?.sourceVertexIndex ?? null,
  missingVertexCm: result.missingVertex?.coordinateCm ?? null,
  chordDeviationCm: result.missingVertex?.mergedChordDeviationCm ?? null,
}));
const left = normalize(a);
const right = normalize(b);
assert.deepEqual(right, left, "S635 Standard and S636 ASTM contours did not produce the same native result");
assert.equal(b.import.receiver, a.import.receiver);
assert.notEqual(b.import.mode, a.import.mode);
assert.equal(a.import.mode, "Standard DXF");
assert.equal(b.import.mode, "DXF-ASTM");
  const matrix = {
  scope: "same S617 source revision, same coordinate-identical CUT-LWPOLYLINE derivative, same piece order and native geometry analyzer; only CLO import mode differs",
  thresholdCm: 0.001,
  sourceSha256: b.fixtures.source.sha256,
  derivativeSha256: b.fixtures.derivative.sha256,
  receiver: b.import.receiver,
  runs: [
    { slice: "S635", mode: a.import.mode, reportSha256: sha(aBytes), pass: left.filter((x) => x.status === "PASS_EXACT_CUT_CONTOUR").length, fail: left.filter((x) => x.status !== "PASS_EXACT_CUT_CONTOUR").length },
    { slice: "S636", mode: b.import.mode, reportSha256: sha(bBytes), pass: right.filter((x) => x.status === "PASS_EXACT_CUT_CONTOUR").length, fail: right.filter((x) => x.status !== "PASS_EXACT_CUT_CONTOUR").length },
  ],
  identicalNativeResults: true,
  results: right.map((result, index) => ({
    ...result,
    nativeShapeCount: { S635: a.results[index].nativeIdentity.shapeCount, S636: b.results[index].nativeIdentity.shapeCount },
  })),
  nativeShapeCountDifferences: right.flatMap((result, index) => a.results[index].nativeIdentity.shapeCount === b.results[index].nativeIdentity.shapeCount ? [] : [{ piece: result.piece, S635: a.results[index].nativeIdentity.shapeCount, S636: b.results[index].nativeIdentity.shapeCount }]),
  disposition: "CLO CUT import path stopped: changing Standard to DXF-ASTM while holding source revision and CUT representation fixed reproduces the same four passes and five failures. No export is permitted because the unchanged native contour gate fails.",
  limitations: [
    "This matrix establishes observed behavior only for this receiver build, fixture revision, representation, and import settings; it is not an ASTM conformance finding.",
    "CLO's internal reason for omitting these vertices is not established.",
  ],
};
await writeFile(output, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, pass: matrix.runs.map((run) => run.pass), fail: matrix.runs.map((run) => run.fail), identicalNativeResults: matrix.identicalNativeResults, omitted: right.filter((x) => x.missingVertexIndex != null).map((x) => [x.piece, x.missingVertexIndex, x.chordDeviationCm]) }, null, 2));
