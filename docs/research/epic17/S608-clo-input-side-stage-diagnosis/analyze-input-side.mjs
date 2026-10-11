import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const exchange = "C:/G04-CLO-DXF-Exchange";
const s595 = `${exchange}/S595-polo-periodic-spline-roundtrip`;
const s608 = `${exchange}/S608-clo-input-side-stage-diagnosis`;
const files = {
  source: `${exchange}/S536-polo-aama-vertex-preservation/Input/polo-standard-m-lwpolyline-r2000.dxf`,
  input: `${s595}/Input/polo-m-periodic-degree1-spline.dxf`,
  output: `${s595}/Output/polo-m-periodic-degree1-spline-clo-aama.dxf`,
  preflight: `${s595}/Evidence/Analysis/S595-periodic-source-preflight.json`,
  priorReport: `${s595}/Evidence/Analysis/S595-roundtrip-analysis.json`,
  inputInfo: `${s608}/Evidence/pattern-input-information.json`,
  report: `${s608}/Evidence/S608-stage-comparison.json`,
};
const thresholdCm = 0.001, sampleStepCm = 0.0005, apiMmPerSourceCm = 10;
const pieceNames = ["front", "back", "sleeve", "button placket", "buttonhole placket", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parseDxf(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: odd group-pair count`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const records = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1]?.[1]; i++; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = undefined; continue; }
    if (!section || pairs[i][0] !== 0) continue;
    const start = i++;
    while (i < pairs.length && pairs[i][0] !== 0) i++;
    records.push({ section, pairs: pairs.slice(start, i) });
    i--;
  }
  const value = (record, code) => record.pairs.find(([group]) => group === code)?.[1];
  const polylines = records.filter(({ section: where, pairs: p }) => where === "ENTITIES" && p[0]?.[1] === "LWPOLYLINE").map((record) => {
    const vertices = [];
    for (const [code, raw] of record.pairs.slice(1)) {
      if (code === 10) vertices.push({ x: Number(raw), y: NaN });
      else if (code === 20 && vertices.length) vertices.at(-1).y = Number(raw);
    }
    return { layer: value(record, 8) ?? "(none)", closed: Boolean(Number(value(record, 70) ?? 0) & 1), vertices };
  });
  return { records, polylines };
}

function segments(points) {
  return points.map((a, i) => ({ a, b: points[(i + 1) % points.length], length: Math.hypot(points[(i + 1) % points.length].x - a.x, points[(i + 1) % points.length].y - a.y) }));
}
function pointToSegment(point, { a, b }) {
  const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / den)) : 0;
  return Math.hypot(point.x - a.x - dx * t, point.y - a.y - dy * t);
}
function directedDistance(from, to, direction) {
  const fromSegments = segments(from), toSegments = segments(to);
  let maximum = 0;
  for (const segment of fromSegments) {
    const count = Math.max(1, Math.ceil(segment.length / sampleStepCm));
    for (let i = 0; i <= count; i++) {
      const t = i / count, point = { x: segment.a.x + (segment.b.x - segment.a.x) * t, y: segment.a.y + (segment.b.y - segment.a.y) * t };
      let nearest = Infinity;
      for (const candidate of toSegments) nearest = Math.min(nearest, pointToSegment(point, candidate));
      maximum = Math.max(maximum, nearest);
    }
  }
  return { direction, sampledMaxCm: maximum, conservativeUpperBoundCm: maximum + sampleStepCm / 2, sampleStepCm };
}
function symmetricDistance(a, b) {
  const ab = directedDistance(a, b, "api-to-source"), ba = directedDistance(b, a, "source-to-api");
  return ab.conservativeUpperBoundCm >= ba.conservativeUpperBoundCm ? ab : ba;
}
function exactCycleDelta(a, b) {
  if (a.length !== b.length) return null;
  let best = Infinity;
  for (let start = 0; start < b.length; start++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const p = b[(start + direction * i + 2 * b.length) % b.length];
      max = Math.max(max, Math.hypot(a[i].x - p.x, a[i].y - p.y));
    }
    best = Math.min(best, max);
  }
  return best;
}

const [sourceBytes, inputBytes, outputBytes, preflightBytes, priorBytes, rawBytes] = await Promise.all([
  readFile(files.source), readFile(files.input), readFile(files.output), readFile(files.preflight), readFile(files.priorReport), readFile(files.inputInfo),
]);
const hashes = Object.fromEntries(Object.entries({ source: sourceBytes, input: inputBytes, output: outputBytes, preflight: preflightBytes, priorReport: priorBytes, inputInfo: rawBytes }).map(([key, bytes]) => [key, sha(bytes)]));
assert.equal(hashes.source, "9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2");
assert.equal(hashes.input, "e050b9dd3e49677494878be9460e0e740bebe3ce1f97a731a328786e706caebc");
assert.equal(hashes.output, "e31f45437ecadb4ed40e7b2bfb99468509ceebf17027c87f4e9f8150906c22f2");
assert.equal(hashes.preflight, "8e605cf2e6662bc9cfe2a52eff5898ac8d9e004bcc5cdce7127c696bd97daafa");
const sourceContours = parseDxf(sourceBytes, "source").polylines;
assert.equal(sourceContours.length, 18);
assert(sourceContours.every((path) => path.closed && path.vertices.length >= 3));
assert.equal(sourceContours.filter((path) => path.layer === "CUT").length, 9);
assert.equal(sourceContours.filter((path) => path.layer === "SEW").length, 9);
const inputEntityCounts = parseDxf(inputBytes, "S595 input").records.reduce((counts, { section, pairs }) => {
  if (section === "ENTITIES") { const type = pairs[0]?.[1]; counts[type] = (counts[type] ?? 0) + 1; }
  return counts;
}, {});
const raw = JSON.parse(rawBytes), prior = JSON.parse(priorBytes);
assert.equal(raw.count, 9, "saved S595 input-side scene must contain nine patterns");
assert.deepEqual(raw.errors, []);
assert.equal(raw.patterns.length, 9);

const paths = [];
for (const pattern of raw.patterns) {
  const rootInfo = pattern.parsed?.["Pattern InputInformation"]?.[0];
  assert(rootInfo, `pattern ${pattern.pattern_index}: root info missing`);
  const shapes = [{ role: "root", shapeIndex: null, shapeType: null, pointList: rootInfo.PointList }];
  for (const child of (rootInfo["Children Information"] ?? []).slice(1)) {
    if (child.PointList) shapes.push({ role: "child", shapeIndex: child["Shape index"], shapeType: child["Shape type"], pointList: child.PointList });
  }
  for (const shape of shapes) {
    const pointsCm = (shape.pointList ?? []).slice(1).map(({ "Point positionX": x, "Point positionY": y }) => ({ x: Number(x) / apiMmPerSourceCm, y: Number(y) / apiMmPerSourceCm }));
    if (pointsCm.length < 3 || pointsCm.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) continue;
    paths.push({ patternIndex: pattern.pattern_index, role: shape.role, shapeIndex: shape.shapeIndex, shapeType: shape.shapeType, pointsCm });
  }
}

const patternBindings = raw.patterns.map((pattern) => {
  const patternPaths = paths.filter((path) => path.patternIndex === pattern.pattern_index);
  const sewCandidates = sourceContours.map((source, index) => ({ sourceIndex: index, piece: pieceNames[Math.floor(index / 2)], source }))
    .filter(({ sourceIndex }) => sourceIndex % 2 === 1).map(({ sourceIndex, piece, source }) => {
      const best = patternPaths.map((path) => ({ path, residualCm: exactCycleDelta(source.vertices, path.pointsCm) }))
        .filter(({ residualCm }) => residualCm !== null).sort((a, b) => a.residualCm - b.residualCm)[0];
      return { sourceIndex, piece, residualCm: best?.residualCm ?? Infinity,
        matchedPath: best ? { role: best.path.role, shapeIndex: best.path.shapeIndex, pointCount: best.path.pointsCm.length } : null };
    }).sort((a, b) => a.residualCm - b.residualCm);
  const passingSew = sewCandidates.filter(({ residualCm }) => residualCm <= thresholdCm);
  return { patternIndex: pattern.pattern_index, piece: passingSew.length === 1 ? passingSew[0].piece : null,
    matchedSew: passingSew.length === 1 ? passingSew[0] : null, sewCandidates: sewCandidates.slice(0, 2) };
});

const comparisons = pieceNames.map((piece, pieceIndex) => {
  const cutSource = sourceContours[pieceIndex * 2].vertices.map(({ x, y }) => ({ x, y }));
  const owner = patternBindings.filter((binding) => binding.piece === piece);
  const ownedPaths = owner.flatMap((binding) => paths.filter((path) => path.patternIndex === binding.patternIndex));
  const candidates = ownedPaths.map((path) => {
    const residual = symmetricDistance(path.pointsCm, cutSource);
    const exact = path.pointsCm.length === cutSource.length
      ? exactCycleDelta(cutSource, path.pointsCm)
      : null;
    return { patternIndex: path.patternIndex, role: path.role, shapeIndex: path.shapeIndex, shapeType: path.shapeType,
      pointCount: path.pointsCm.length, residual, exactCyclicVertexDeltaCm: exact, passesUnchangedGate: residual.conservativeUpperBoundCm <= thresholdCm };
  }).sort((a, b) => a.residual.conservativeUpperBoundCm - b.residual.conservativeUpperBoundCm);
  const outputEvidence = prior.results.find((row) => row.piece === piece);
  assert(outputEvidence?.cut, `${piece}: pinned S595 output CUT metric missing`);
  return { piece, inputSideBinding: owner, candidatePathsComparedToSourceCut: candidates,
    bestGeometricCandidateToSourceCut: candidates[0] ? { patternIndex: candidates[0].patternIndex, role: candidates[0].role, shapeIndex: candidates[0].shapeIndex,
      pointCount: candidates[0].pointCount, residualUpperBoundCm: candidates[0].residual.conservativeUpperBoundCm, withinGate: candidates[0].passesUnchangedGate } : null,
    outputCut: { receiverBlock: outputEvidence.receiverBlock, residualUpperBoundCm: outputEvidence.cut.conservativeUpperBoundCm, passes: outputEvidence.cut.passes } };
});

const report = {
  slice: 608,
  experiment: "Read-only GetPatternInputInformation query against S601-confirmed saved S595 input-side imported scene; compare API paths to pinned source CUT/SEW geometry and the prior measured emitted DXF.",
  hashes,
  inputEntityCounts,
  getter: { patternCount: raw.count, errors: raw.errors, patternRecords: raw.patterns.length, candidatePointPaths: paths.length,
    coordinateFactor: "S606-observed API millimeters / 10 = source DXF centimeters; API docs do not define units or manufacturing semantics." },
  comparisonMethod: `Bind each CLO pattern only by a unique source SEW contour match within ${thresholdCm} cm. Compare all paths from that same pattern to its source CUT with symmetric sampled polyline distance, ${sampleStepCm} cm spacing and a half-step conservative bound; also report exact cyclic-vertex residual when vertex counts match. No registration, scaling fit, projection, or assumed API role. API geometry is treated as a closed cycle only to compare against closed source contours; the getter does not document closure.`,
  patternBindings,
  cutStageComparisons: comparisons,
  interpretationLimit: "A unique source SEW match anchors only which source piece's returned paths are compared. A CUT path under threshold in the saved input-side scene followed by a failing emitted CUT would place the measured discrepancy after that input-side query, but would not prove CLO implementation internals or universal exporter behavior. If the CUT path is absent or unmatched in the getter, import-vs-export stage attribution is inconclusive.",
};
await writeFile(files.report, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: files.report, hashes, getter: report.getter,
    comparisons: comparisons.map(({ piece, inputSideBinding, bestGeometricCandidateToSourceCut, outputCut }) => ({ piece, matchedPattern: inputSideBinding[0]?.patternIndex ?? null,
    inputPathCount: inputSideBinding.length ? (paths.filter((path) => path.patternIndex === inputSideBinding[0].patternIndex).length) : 0,
    bestCandidateCm: bestGeometricCandidateToSourceCut?.residualUpperBoundCm ?? null, candidateWithinGate: bestGeometricCandidateToSourceCut?.withinGate ?? false,
    outputCutCm: outputCut.residualUpperBoundCm, outputPass: outputCut.passes })) }, null, 2));
