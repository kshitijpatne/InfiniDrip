import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const inputPath = process.argv[2] ?? 'C:/G04-CLO-DXF-Exchange/S565-clo-grade-state-diagnosis/s565-corrected-sizegroup1-analysis.json';
const reportPath = process.argv[3] ?? 'docs/research/epic17/S566-clo-sew-line-attribution/s566-sew-candidate-report.json';
const inputBytes = await readFile(inputPath);
const input = JSON.parse(inputBytes.toString('utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function contourResidual(left, right) {
  const anchor = contour => {
    const first = contour[0];
    return contour.map(point => ({ x: point.x - first.x, y: point.y - first.y }));
  };
  const a = anchor(left);
  const b = anchor(right);
  let maximum = 0;
  for (const [points, edges] of [[a, b], [b, a]]) {
    for (const point of points) {
      let minimum = Infinity;
      for (let index = 0; index < edges.length; index++) {
        minimum = Math.min(minimum, pointSegmentDistance(point, edges[index], edges[(index + 1) % edges.length]));
      }
      maximum = Math.max(maximum, minimum);
    }
  }
  return maximum;
}

const allSizes = input.sizeMatches;
const baselineSew = allSizes[0].contours.find(({ sourceIndex }) => sourceIndex === 5);
assert.equal(baselineSew.sourceLayer, 'SEW');
const sizes = allSizes.map(size => {
  const source = size.contours.find(({ sourceIndex }) => sourceIndex === 5);
  assert.equal(source.sourceLayer, 'SEW');
  const candidates = source.candidateChecks.map(candidate => ({
    candidateIndex: candidate.candidateIndex,
    outputLayer: candidate.layer,
    vertices: candidate.vertices,
    residualToCurrentSizeSewCm: candidate.residualCm,
    residualToBaseXsSewCm: contourResidual(baselineSew.sourceVertices, candidate.vertices),
  }));
  const nearestCurrent = [...candidates].sort((a, b) => a.residualToCurrentSizeSewCm - b.residualToCurrentSizeSewCm)[0] ?? null;
  const nearestBase = [...candidates].sort((a, b) => a.residualToBaseXsSewCm - b.residualToBaseXsSewCm)[0] ?? null;
  return {
    size: size.size,
    sourceSewVertices: source.sourceVertices,
    expectedSewWidthCm: Math.max(...source.sourceVertices.map(({ x }) => x)) - Math.min(...source.sourceVertices.map(({ x }) => x)),
    nearestCandidateToCurrentSew: nearestCurrent,
    nearestCandidateToBaseXsSew: nearestBase,
    candidateCount: candidates.length,
  };
});

assert.ok(sizes[0].nearestCandidateToCurrentSew.residualToCurrentSizeSewCm <= 0.001);
for (const size of sizes.slice(1)) {
  assert.ok(size.nearestCandidateToCurrentSew.residualToCurrentSizeSewCm > 0.001, `${size.size} current-size SEW unexpectedly passed`);
  assert.ok(size.nearestCandidateToBaseXsSew.residualToBaseXsSewCm <= 0.001, `${size.size} has no base-XS-SEW-shaped candidate`);
}

const report = {
  title: 'S566 source-SEW versus CLO graded-nest candidate attribution',
  sourceAnalysis: {
    path: inputPath.replaceAll('\\', '/'),
    sha256: sha256(inputBytes),
    receiver: input.receiver,
    exportSha256: input.output.sha256,
  },
  unchangedContourGateCm: 0.001,
  method: 'Compare ordered closed contours symmetrically by maximum point-to-segment distance after anchoring each contour at its first vertex, matching the S564 analyzer method.',
  sizes,
  findings: [
    'For each S/M/L/XL role block, one emitted candidate is within 0.000015 cm of the XS source SEW shape after layout-origin alignment.',
    'No emitted candidate in S/M/L/XL is within 0.001 cm of that size’s source SEW contour.',
    'This is geometric attribution only. Numeric output layer IDs and entity order do not establish that the XS-shaped candidate is semantically the receiver’s SEW line.',
  ],
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  reportPath,
  sourceAnalysisSha256: report.sourceAnalysis.sha256,
  exportSha256: report.sourceAnalysis.exportSha256,
  sizes: sizes.map(({ size, expectedSewWidthCm, nearestCandidateToCurrentSew, nearestCandidateToBaseXsSew }) => ({
    size,
    expectedSewWidthCm,
    closestCurrentResidualCm: nearestCandidateToCurrentSew?.residualToCurrentSizeSewCm,
    baseXsShapeResidualCm: nearestCandidateToBaseXsSew?.residualToBaseXsSewCm,
    baseXsShapeLayer: nearestCandidateToBaseXsSew?.outputLayer,
    baseXsShapeIndex: nearestCandidateToBaseXsSew?.candidateIndex,
  })),
}, null, 2));
