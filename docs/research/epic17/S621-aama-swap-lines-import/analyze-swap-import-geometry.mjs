import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const base = "C:/G04-CLO-DXF-Exchange";
const inputPath = `${base}/S621-aama-swap-lines-import/Input/polo-source-m-cut-lines.dxf`;
const sourcePath = `${base}/S574-polo-line-chain-representation/Input/polo-source-m.dxf`;
const derivativeReportPath = `${base}/S574-polo-line-chain-representation/Evidence/line-chain-derivative-report.json`;
const infoPath = `${base}/S621-aama-swap-lines-import/Evidence/preexport-input-information.json`;
const noSwapInfoPath = `${base}/S620-aama-preexport-contour-check/Evidence/preexport-input-information.json`;
const projectPath = `${base}/S621-aama-swap-lines-import/Project/clo-aama-swap-lines-import.zprj`;
const outputPath = `${base}/S621-aama-swap-lines-import/Evidence/preexport-cut-sew-comparison.json`;
const expectedInputHash = "a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675";
const expectedSourceHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedProjectHash = "4b75d868ee9f4cee883811da484de33c6ea0cc5af333970dbb7c8e46d3e49642";
const expectedNoSwapInfoHash = "873a12aa58579e04172b67e53649b640c667cf3a36f779e45de6ac50eb33f5ed";
const toleranceMm = 0.01; // unchanged 0.001 cm acceptance gate
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
    const entity = entities[i];
    if (entity[0][1] !== "POLYLINE") continue;
    const vertices = [];
    for (let j = i + 1; j < entities.length && entities[j][0][1] !== "SEQEND"; j++) {
      if (entities[j][0][1] === "VERTEX") vertices.push({ x: Number(value(entities[j], 10)), y: Number(value(entities[j], 20)) });
    }
    paths.push({ layer: value(entity, 8), closed: Boolean(Number(value(entity, 70) ?? 0) & 1), vertices });
  }
  return paths;
}

function exactCycle(source, candidate) {
  if (source.length !== candidate.length) return null;
  let best = null;
  for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = source.map((p, i) => {
      const q = candidate[(offset + direction * i + candidate.length * 2) % candidate.length];
      return Math.hypot(p.x * 10 - q.x, p.y * 10 - q.y);
    });
    const result = { direction, offset, pointCount: deltas.length, maxDeltaMm: Math.max(...deltas), rmsDeltaMm: Math.sqrt(deltas.reduce((s, d) => s + d * d, 0) / deltas.length) };
    if (!best || result.maxDeltaMm < best.maxDeltaMm) best = result;
  }
  return best;
}

const [inputBytes, sourceBytes, derivativeBytes, infoBytes, projectBytes, noSwapInfoBytes] = await Promise.all([
  readFile(inputPath), readFile(sourcePath), readFile(derivativeReportPath), readFile(infoPath), readFile(projectPath), readFile(noSwapInfoPath),
]);
assert.equal(sha(inputBytes), expectedInputHash);
assert.equal(sha(sourceBytes), expectedSourceHash);
assert.equal(sha(projectBytes), expectedProjectHash);
const derivative = JSON.parse(derivativeBytes.toString("utf8"));
assert.equal(derivative.outputSha256.toLowerCase(), expectedInputHash);
assert.equal(derivative.convertedEdgesUseExactSourceEndpointStrings, true);
assert.equal(derivative.lineEdgesCloseEverySourceContour, true);
assert.equal(derivative.sourceCutPolylineCount, 9);

const sourcePaths = parseSource(sourceBytes);
const cut = sourcePaths.filter((p) => p.layer === "CUT" && p.closed);
const sew = sourcePaths.filter((p) => p.layer === "SEW" && p.closed);
const info = JSON.parse(infoBytes.toString("utf8"));
const noSwapInfo = JSON.parse(noSwapInfoBytes.toString("utf8"));
assert.equal(info.slice, "S621");
assert.equal(info.pattern_count, 9);
assert.equal(info.errors.length, 0);
assert.equal(info.import_profile.swap_cutting_and_sewing, true);
assert.equal(info.intended_project_sha256.toLowerCase(), expectedProjectHash);
assert.equal(sha(noSwapInfoBytes), expectedNoSwapInfoHash);

function nativePointLists(projectInfo) {
  return projectInfo.patterns.map((pattern) => (pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? []).slice(1)
    .map((shape) => (shape.PointList ?? []).map((point) => [point["Point positionX"] ?? null, point["Point positionY"] ?? null])));
}
const swapPointLists = nativePointLists(info);
const noSwapPointLists = nativePointLists(noSwapInfo);
const pointListsIdenticalByPattern = swapPointLists.map((shapes, index) => JSON.stringify(shapes) === JSON.stringify(noSwapPointLists[index]));
assert.equal(pointListsIdenticalByPattern.length, 9);
assert(pointListsIdenticalByPattern.every(Boolean), "swap import native point lists differ from the hash-pinned no-swap baseline");
assert.equal(cut.length, 9);
assert.equal(sew.length, 9);

const patterns = info.patterns.map((pattern) => ({
  index: pattern.pattern_index,
  name: pattern.pattern_name,
  shapes: (pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? []).slice(1).map((shape) => ({
    index: Number(shape["Shape index"]),
    name: shape["Shape name"],
    type: shape["Shape type"],
    points: (shape.PointList ?? []).filter((p) => p["Point positionX"] != null && p["Point positionY"] != null).map((p) => ({ x: Number(p["Point positionX"]), y: Number(p["Point positionY"]) })),
  })).filter((shape) => shape.points.length >= 3),
}));

function matches(source, shapes) {
  return shapes.map((shape) => ({ patternIndex: shape.patternIndex, patternName: shape.patternName, shapeIndex: shape.index, shapeName: shape.name, shapeType: shape.type, delta: exactCycle(source.vertices, shape.points) }))
    .filter((match) => match.delta)
    .sort((a, b) => a.delta.maxDeltaMm - b.delta.maxDeltaMm);
}

const pieceRows = cut.map((cutPath, pieceIndex) => {
  const sewPath = sew[pieceIndex];
  const sourcePattern = patterns[pieceIndex];
  assert.equal(sourcePattern.name, String(pieceIndex), `source piece ${pieceIndex} does not bind to CLO ordinal name`);
  const samePatternShapes = sourcePattern.shapes.map((shape) => ({ ...shape, patternIndex: sourcePattern.index, patternName: sourcePattern.name }));
  const sewBest = matches(sewPath, samePatternShapes)[0] ?? null;
  const cutSamePattern = matches(cutPath, samePatternShapes);
  const cutAllPatterns = matches(cutPath, patterns.flatMap((pattern) => pattern.shapes.map((shape) => ({ ...shape, patternIndex: pattern.index, patternName: pattern.name }))));
  return {
    pieceOrdinal: pieceIndex,
    sourceBlock: `${pieceIndex}_M`,
    expectedPatternIndex: sourcePattern.index,
    expectedPatternName: sourcePattern.name,
    sourceCutPoints: cutPath.vertices.length,
    sourceSewPoints: sewPath.vertices.length,
    sourceCutClosed: cutPath.closed,
    sourceSewClosed: sewPath.closed,
    sewSamePatternBest: sewBest,
    sewPass: Boolean(sewBest && sewBest.delta.maxDeltaMm <= toleranceMm),
    cutSamePatternCandidates: cutSamePattern,
    cutAnyPatternBest: cutAllPatterns[0] ?? null,
    cutPass: Boolean(cutSamePattern[0] && cutSamePattern[0].delta.maxDeltaMm <= toleranceMm),
  };
});

const report = {
  slice: "S621",
  receiver: "CLO 2026.1.310 (r58944)",
  profile: info.import_profile,
  toleranceCm: 0.001,
  toleranceMm,
  input: { path: inputPath, sha256: sha(inputBytes), sourcePolylineBase: { path: sourcePath, sha256: sha(sourceBytes) }, derivativeReportSha256: sha(derivativeBytes) },
  importedProject: { path: projectPath, sha256: sha(projectBytes), patternCount: info.pattern_count, getterErrors: info.errors },
  noSwapBaseline: { slice: noSwapInfo.slice, getterSha256: sha(noSwapInfoBytes), projectSha256: noSwapInfo.intended_project_sha256, pointListsIdenticalByPattern },
  association: "For each ordinal 0–8, the pre-existing S574 source review associates alternating source CUT/SEW contours with block n_M, and this report independently requires that the same ordinal SEW geometry match CLO pattern name/index n before evaluating that piece's CUT geometry. No Base Line or numeric output-layer meaning is inferred.",
  pieces: pieceRows,
  summary: {
    sourcePieces: pieceRows.length,
    sewPasses: pieceRows.filter((r) => r.sewPass).length,
    cutPasses: pieceRows.filter((r) => r.cutPass).length,
    allCutPass: pieceRows.every((r) => r.cutPass),
    allSewPass: pieceRows.every((r) => r.sewPass),
    renderObservation: "CLO rendered nine pattern pieces and displayed its informational Custom-mode/no-seam-allowance notice. No import error was shown.",
    stageLimit: "A point-list match in the saved imported scene establishes that geometry is present in this queried native representation; it does not prove CLO's semantic layer contract or export/round-trip behavior.",
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, summary: report.summary, pieces: pieceRows.map((r) => ({ piece: r.sourceBlock, sewPass: r.sewPass, cutPass: r.cutPass, cutBest: r.cutSamePatternCandidates[0]?.delta ?? null, nearest: r.cutAnyPatternBest && { patternIndex: r.cutAnyPatternBest.patternIndex, delta: r.cutAnyPatternBest.delta } })) }, null, 2));
