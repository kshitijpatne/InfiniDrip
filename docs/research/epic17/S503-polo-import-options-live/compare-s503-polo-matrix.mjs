import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const analysisRoot = "C:/G04-CLO-DXF-Exchange/S503-polo-import-options/Evidence/Analysis";
const cellNames = ["aama-opt-off", "aama-opt-on", "astm-opt-off", "astm-opt-on"];
const reports = Object.fromEntries(await Promise.all(cellNames.map(async (name) => [
  name,
  JSON.parse(await readFile(`${analysisRoot}/${name}/polo-contour-diagnosis.json`, "utf8")),
])));
const signature = (polyline) => JSON.stringify({
  block: polyline.block, layer: polyline.layer, closed: polyline.closed, vertices: polyline.vertices,
});
const pointSegmentDistance = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], length2 = dx * dx + dy * dy;
  if (length2 < 1e-18) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2));
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
};
const vertexToPolylineMaximum = (from, to) => {
  const edges = to.vertices.map((start, i) => [start, to.vertices[(i + 1) % to.vertices.length]]);
  let maximum = 0;
  for (const point of from.vertices) {
    const nearest = Math.min(...edges.map(([a, b]) => pointSegmentDistance(point, a, b)));
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
};
const compare = (leftName, rightName) => {
  const left = reports[leftName].output.polylineGeometries;
  const right = reports[rightName].output.polylineGeometries;
  assert.equal(left.length, right.length, `${leftName}/${rightName} polyline count`);
  const changed = [];
  for (let i = 0; i < left.length; i++) {
    if (signature(left[i]) === signature(right[i])) continue;
    const a = left[i], b = right[i];
    assert.equal(a.outputPolylineOrdinal, b.outputPolylineOrdinal);
    assert.equal(a.block, b.block, `block at ordinal ${i}`);
    assert.equal(a.layer, b.layer, `layer at ordinal ${i}`);
    assert.equal(a.closed, b.closed, `closed flag at ordinal ${i}`);
    changed.push({
      ordinal: i, block: a.block, layer: a.layer,
      offVertexCount: a.vertices.length, onVertexCount: b.vertices.length,
      maxVertexDistanceOffToOnCm: vertexToPolylineMaximum(a, b),
      maxVertexDistanceOnToOffCm: vertexToPolylineMaximum(b, a),
    });
  }
  return {
    left: leftName, right: rightName, polylineCount: left.length,
    changedPolylineCount: changed.length,
    exactOrderedGeometryEqual: changed.length === 0,
    changed,
  };
};
const analyses = [
  compare("aama-opt-off", "astm-opt-off"),
  compare("aama-opt-on", "astm-opt-on"),
  compare("aama-opt-off", "aama-opt-on"),
  compare("astm-opt-off", "astm-opt-on"),
];
const sourceHashes = [...new Set(cellNames.map((name) => reports[name].input.sha256))];
assert.deepEqual(sourceHashes, ["796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca"]);
const contourResults = Object.fromEntries(cellNames.map((name) => [name, reports[name].unresolvedContours.map((item) => ({
  piece: item.sourcePiece,
  sourceVertexCount: item.sourceCUT.vertexCount,
  receiverCandidateVertexCount: item.nearestGeometryInBlock?.vertexCount ?? null,
  mappedBlock: item.associatedBlock,
  lowerBoundDeviationCm: item.nearestGeometryInBlock?.deviationWitness.nearestDistanceCm ?? null,
  witness: item.nearestGeometryInBlock?.deviationWitness ?? null,
}))]));
const report = {
  receiver: "CLO 2026.1.310 (r58944), four live Polo M import-option/export trials; geometry-only diagnostic",
  testedImportMatrix: [
    { cell: "aama-opt-off", format: "DXF-AAMA", optimizeAllCurvePoints: false },
    { cell: "aama-opt-on", format: "DXF-AAMA", optimizeAllCurvePoints: true },
    { cell: "astm-opt-off", format: "DXF-ASTM", optimizeAllCurvePoints: false },
    { cell: "astm-opt-on", format: "DXF-ASTM", optimizeAllCurvePoints: true },
  ],
  fixedImportSettings: { units: "cm", scalePercent: 100, rotation: "Do Not Rotate", resetGrainAngle: "Maintain Original", notches: "Both", notchPosition: "Ratio" },
  fixedExportSettings: { format: "DXF-ASTM", sizeFormat: "Graded Nest", scale: "cm at 100%", rotation: "Do Not Rotate", duplicateNotchOnSeamAllowance: true, optimizeAllCurvePoints: false },
  source: { sha256: sourceHashes[0], inputCellHashes: Object.fromEntries(cellNames.map((name) => [name, reports[name].input.sha256])) },
  outputs: Object.fromEntries(cellNames.map((name) => [name, { sha256: reports[name].output.sha256, bytes: reports[name].output.bytes, polylineCount: reports[name].output.outputPolylineCount, pieceBlockMap: reports[name].sourceOutlines.filter((item) => item.expectedRole === "SEW").map((item) => ({ piece: item.piece, block: reports[name].unresolvedContours.find((c) => c.sourcePiece === item.piece)?.associatedBlock ?? null })) }])),
  pairwiseGeometry: analyses,
  fiveCutContourDiagnostics: contourResults,
  acceptance: {
    sourceToOutputCutLimitCm: 0.001,
    conclusion: "All four cells reproduce the same five identified CUT contour one-vertex losses. Exact source-SEW block association remains successful for all nine pieces. Each recorded sampled exact-segment witness is >0.001 cm, so all four cells fail the unchanged cut-geometry gate.",
  },
  interpretationLimits: "AAMA/ASTM format and Optimize All Curve Points were the only varied import controls. The numeric DXF layer identifiers are retained without assigning manufacturing semantics. Vertex-distance summaries on the four optimizer-affected loops are sample lower bounds, not industrial-profile or broad CLO-conformance claims.",
};
const path = `${analysisRoot}/s503-matrix-comparison.json`;
await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  report: path,
  pairs: analyses.map(({ left, right, polylineCount, changedPolylineCount, exactOrderedGeometryEqual, changed }) => ({ left, right, polylineCount, changedPolylineCount, exactOrderedGeometryEqual, changed })),
  cutDeviationByCell: Object.fromEntries(cellNames.map((name) => [name, contourResults[name].map(({ piece, lowerBoundDeviationCm }) => ({ piece, lowerBoundDeviationCm }))])),
}, null, 2));
