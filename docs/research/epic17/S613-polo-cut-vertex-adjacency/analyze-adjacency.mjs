import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange";
const rootPath = `${root}/S609-clo-dxf-astm-practical-trial/Input/polo-standard-m.dxf`;
const astmPath = `${root}/S609-clo-dxf-astm-practical-trial/Output/polo-m-clo-dxf-astm.dxf`;
const aamaPath = `${root}/S536-polo-aama-vertex-preservation/Output/polo-lwpolyline-aama-output.dxf`;
const s609Path = `${root}/S609-clo-dxf-astm-practical-trial/Evidence/Analysis/S609-dxf-astm-roundtrip-analysis.json`;
const reportPath = `${root}/S613-polo-cut-vertex-adjacency/Evidence/s613-missing-vertex-adjacency.json`;
const sha = (b) => createHash("sha256").update(b).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: unpaired group code/value`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const sections = new Map(); let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1][1]; sections.set(section, []); i++; }
    else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      sections.get(section).push(pairs.slice(start, i)); i--;
    }
  }
  const val = (e, code) => e.find(([g]) => g === code)?.[1];
  const closed = (e) => Boolean(Number(val(e, 70) ?? 0) & 1);
  const points = (e, records, start) => {
    if (e[0][1] !== "POLYLINE") return null;
    const pts = []; let i = start + 1;
    while (i < records.length && records[i][0][1] !== "SEQEND") {
      if (records[i][0][1] === "VERTEX") pts.push({ x: Number(val(records[i], 10)), y: Number(val(records[i], 20)) });
      i++;
    }
    return { pts, next: i + 1 };
  };
  const entityRecords = sections.get("ENTITIES") ?? [];
  const source = [];
  for (let i = 0; i < entityRecords.length;) {
    const e = entityRecords[i], p = points(e, entityRecords, i);
    if (p) { source.push({ layer: val(e, 8) ?? "(none)", closed: closed(e), pts: p.pts }); i = p.next; }
    else i++;
  }
  const blockRecords = sections.get("BLOCKS") ?? [];
  const blocks = new Map(); let blockName;
  for (let i = 0; i < blockRecords.length;) {
    const e = blockRecords[i], kind = e[0][1];
    if (kind === "BLOCK") { blockName = val(e, 2); i++; continue; }
    if (kind === "ENDBLK") { blockName = undefined; i++; continue; }
    const p = points(e, blockRecords, i);
    if (p && blockName) {
      if (!blocks.has(blockName)) blocks.set(blockName, []);
      blocks.get(blockName).push({ layer: val(e, 8) ?? "(none)", closed: closed(e), pts: p.pts }); i = p.next;
    } else i++;
  }
  const inserts = new Map(entityRecords.filter((e) => e[0][1] === "INSERT").map((e) => [val(e, 2), {
    x: Number(val(e, 10) ?? 0), y: Number(val(e, 20) ?? 0), sx: Number(val(e, 41) ?? 1), sy: Number(val(e, 42) ?? 1), rot: Number(val(e, 50) ?? 0) * Math.PI / 180,
  }]));
  for (const [name, paths] of blocks) {
    const t = inserts.get(name) ?? { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
    for (const path of paths) path.pts = path.pts.map(({ x, y }) => ({
      x: t.x + x * t.sx * Math.cos(t.rot) - y * t.sy * Math.sin(t.rot),
      y: t.y + x * t.sx * Math.sin(t.rot) + y * t.sy * Math.cos(t.rot),
    }));
  }
  return { source, blocks, acadver: val((sections.get("HEADER") ?? []).find((e) => e[0][1] === "$ACADVER") ?? [], 1) };
}

const center = (path) => ({ x: path.pts.reduce((s, p) => s + p.x, 0) / path.pts.length, y: path.pts.reduce((s, p) => s + p.y, 0) / path.pts.length });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
function matchOneMissingVertex(source, output) {
  const n = source.length, m = output.length;
  assert.equal(n - m, 1, `expected one missing vertex, got ${n} source / ${m} output`);
  let best;
  for (let omitted = 0; omitted < n; omitted++) for (const direction of [1, -1]) for (let rotation = 0; rotation < m; rotation++) {
    const deltas = [];
    for (let j = 0; j < m; j++) deltas.push(dist(source[(omitted + direction * (j + 1) + n * 4) % n], output[(rotation + j) % m]));
    const sumSq = deltas.reduce((s, d) => s + d * d, 0), max = Math.max(...deltas);
    if (!best || sumSq < best.sumSq - 1e-16 || (Math.abs(sumSq - best.sumSq) <= 1e-16 && max < best.max)) best = { omitted, direction, rotation, sumSq, max, deltas };
  }
  return best;
}
function localGeometry(points, index) {
  const p = points[index], prev = points[(index + points.length - 1) % points.length], next = points[(index + 1) % points.length];
  const inX = p.x - prev.x, inY = p.y - prev.y, outX = next.x - p.x, outY = next.y - p.y;
  const turn = Math.atan2(inX * outY - inY * outX, inX * outX + inY * outY) * 180 / Math.PI;
  const interior = Math.acos(Math.max(-1, Math.min(1, ((prev.x - p.x) * (next.x - p.x) + (prev.y - p.y) * (next.y - p.y)) / (dist(prev, p) * dist(next, p))))) * 180 / Math.PI;
  return {
    sourceVertexIndexZeroBased: index, pointCm: p,
    previousEdgeLengthCm: dist(prev, p), nextEdgeLengthCm: dist(p, next),
    chordLengthCm: dist(prev, next),
    perpendicularDistanceToReplacementChordCm: pointSegmentDistance(p, prev, next),
    unsignedInteriorAngleDeg: interior, signedTurnDeg: turn,
  };
}

const [sourceBytes, astmBytes, aamaBytes, s609Bytes] = await Promise.all([rootPath, astmPath, aamaPath, s609Path].map((p) => readFile(p)));
const hashes = {
  source: sha(sourceBytes), astm: sha(astmBytes), aama: sha(aamaBytes),
};
assert.equal(hashes.source, "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
assert.equal(hashes.astm, "be0f11fc3fca57887bdacce366034e4cf4479c2867be4529181dec34fffcb9e0");
assert.equal(hashes.aama, "06ede87a504a38b21f7af3529a16ebb064768c14def1ec59287c6ced354ef4de");
const src = parse(sourceBytes, "source"), astm = parse(astmBytes, "ASTM"), aama = parse(aamaBytes, "AAMA"), prior = JSON.parse(s609Bytes.toString("utf8"));
const pieces = [
  { name: "back", block: "1_M", count: 33 }, { name: "outer collar stand", block: "5_M", count: 54 },
  { name: "inner collar stand", block: "6_M", count: 54 }, { name: "upper pointed collar", block: "7_M", count: 44 },
  { name: "under pointed collar", block: "8_M", count: 44 },
];
const findings = pieces.map((piece) => {
  const expectedAama = (aama.blocks.get(piece.block) ?? []).filter((p) => p.closed && p.pts.length === piece.count - 1);
  const expectedAstm = (astm.blocks.get(piece.block) ?? []).filter((p) => p.closed && p.pts.length === piece.count - 1);
  assert(expectedAama.length && expectedAstm.length, `${piece.name}: no one-vertex-short candidate contours`);
  const candidates = src.source.filter((p) => p.layer === "CUT" && p.closed && p.pts.length === piece.count);
  function expectedOutputCandidates(input) {
    const align = (paths) => paths.map((path, index) => ({ index, path, match: matchOneMissingVertex(input.pts, path.pts) }))
      .filter(({ match }) => match.max <= 0.001);
    return { aama: align(expectedAama), astm: align(expectedAstm) };
  }
  const mapped = candidates.map((source, index) => ({ index, source, matches: expectedOutputCandidates(source) }))
    .filter(({ matches }) => matches.aama.length && matches.astm.length);
  const paired = mapped.filter(({ matches }) => {
    const ai = new Set(matches.aama.map(({ match }) => match.omitted));
    return matches.astm.some(({ match }) => ai.has(match.omitted));
  });
  assert.equal(paired.length, 1, `${piece.name}: source contour mapping at the 0.001 cm gate is ambiguous (${paired.length} input CUT candidates)`);
  const { index: sourceContourIndex, source } = paired[0];
  const aamaMatched = paired[0].matches.aama, astmMatched = paired[0].matches.astm;
  const omittedIndices = new Set([...aamaMatched, ...astmMatched].map(({ match }) => match.omitted));
  assert.equal(omittedIndices.size, 1, `${piece.name}: AAMA and ASTM omit different source vertices`);
  const omitted = [...omittedIndices][0];
  const aamaMatch = aamaMatched[0].match, astmMatch = astmMatched[0].match;
  const aamaLocal = localGeometry(source.pts, omitted), astmLocal = localGeometry(source.pts, omitted);
  const result = prior.results.find((r) => r.piece === piece.name)?.cut;
  assert(result && result.passes === false, `${piece.name}: missing matching S609 failure row`);
  return {
    piece: piece.name, sourceContourIndex, sourceLayer: source.layer, sourceVertexCount: source.pts.length,
    outputVertexCounts: { aama: expectedAama[0].pts.length, astm: expectedAstm[0].pts.length },
    omittedSourceVertex: aamaLocal,
    aama: { matchedOutputLayers: [...new Set(aamaMatched.map(({ path }) => path.layer))], equivalentContourCount: aamaMatched.length, alignmentMaxIncludedVertexDeltaCm: Math.max(...aamaMatched.map(({ match }) => match.max)), alignmentRmsCm: Math.min(...aamaMatched.map(({ match }) => Math.sqrt(match.sumSq / match.deltas.length))), outputMissingVertexToChordCm: pointSegmentDistance(source.pts[omitted], source.pts[(omitted + 1) % source.pts.length], source.pts[(omitted - 1 + source.pts.length) % source.pts.length]) },
    astm: { matchedOutputLayers: [...new Set(astmMatched.map(({ path }) => path.layer))], equivalentContourCount: astmMatched.length, alignmentMaxIncludedVertexDeltaCm: Math.max(...astmMatched.map(({ match }) => match.max)), alignmentRmsCm: Math.min(...astmMatched.map(({ match }) => Math.sqrt(match.sumSq / match.deltas.length))), outputMissingVertexToChordCm: pointSegmentDistance(source.pts[omitted], source.pts[(omitted + 1) % source.pts.length], source.pts[(omitted - 1 + source.pts.length) % source.pts.length]) },
    s609ConservativeUpperBoundCm: result.conservativeUpperBoundCm,
  };
});
const chordValues = findings.map((f) => f.omittedSourceVertex.perpendicularDistanceToReplacementChordCm);
const report = {
  sourceArtifacts: { source: { path: rootPath, sha256: hashes.source }, astm: { path: astmPath, sha256: hashes.astm }, aama: { path: aamaPath, sha256: hashes.aama } },
  method: "For each exact-count source CUT and its same-block closed output contours, enumerate all cyclic sequence alignments with one source vertex omitted and either winding. Transform block coordinates by their INSERT transform. Report the best RMS/max alignment and the omitted point's incident-edge geometry. The previously validated source-to-piece mapping and S609 failure table provide identities and independent conservative contour gate results.",
  findings,
  summary: {
    fiveUniquePieceContourPairsCompared: findings.length === 5,
    omittedSourceIndices: findings.map((f) => f.omittedSourceVertex.sourceVertexIndexZeroBased),
    replacementChordDeviationRangeCm: [Math.min(...chordValues), Math.max(...chordValues)],
    allIncludedVertexMaxDeltasAtOrBelowGate: findings.every((f) => f.aama.alignmentMaxIncludedVertexDeltaCm <= 0.001 && f.astm.alignmentMaxIncludedVertexDeltaCm <= 0.001),
  },
  limits: [
    "The S536 and S609 tests changed source entity encoding and CLO export format together. Matching the same omitted source vertex in both results would establish repeatability for those artifacts, not the processing stage or a universal simplification rule.",
    "No importing receiver was available in this slice; no CLO interaction or acceptance gate was tested.",
    "This analysis cannot authorize source geometry changes, weaker tolerances, or a compatibility claim.",
  ],
};
assert.equal(findings.length, 5);
await mkdir(`${root}/S613-polo-cut-vertex-adjacency/Evidence`, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, summary: report.summary, findings: findings.map(({ piece, omittedSourceVertex, aama, astm }) => ({ piece, index: omittedSourceVertex.sourceVertexIndexZeroBased, chordCm: omittedSourceVertex.perpendicularDistanceToReplacementChordCm, angleDeg: omittedSourceVertex.unsignedInteriorAngleDeg, aamaMaxDeltaCm: aama.alignmentMaxIncludedVertexDeltaCm, astmMaxDeltaCm: astm.alignmentMaxIncludedVertexDeltaCm })) }, null, 2));
