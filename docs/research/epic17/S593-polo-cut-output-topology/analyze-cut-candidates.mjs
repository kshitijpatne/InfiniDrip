import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const baselinePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m-lwpolyline-r2000.dxf";
const cases = [
  { id: "S591-closed", fixture: "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Input/polo-standard-m-cut-degree1-spline.dxf", fixtureHash: "06d93e8a5a55a76f52d4c38ee3b9d74ec3309bd8f9a1bdd71de82a7b75dabcca", output: "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Output/polo-degree1-spline-clo-aama.dxf", outputHash: "0dfb0829b0037b4754438f44db5dbdc54ac53ac0e8b00f635940280b6a64232e", priorReport: "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Evidence/Analysis/S591-roundtrip-analysis.json", reportHash: "2b2f644e921b66742671c6745bc587a1ae0da42bb2095781392bcc04b845ab2e" },
  { id: "S592-open", fixture: "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe/Input/polo-standard-m-cut-degree1-spline-open-flag.dxf", fixtureHash: "e6da8d63056848a2c010ab141dce577cf834b7738155684b4e3a7dcaa1849ce3", output: "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe/Output/polo-spline-open-flag-clo-aama.dxf", outputHash: "f96e7388de85d02c60b391c45b0465eaeca482a6ff1dc22e68c5ba166f29adc7", priorReport: "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe/Evidence/Analysis/S592-roundtrip-analysis.json", reportHash: "a16f193cbf5ecd64cac1db8083923a3816436d5364f3a9f12124820f857559e5" },
];
const baselineHash = "9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2";
const reportPath = "C:/G04-CLO-DXF-Exchange/S593-polo-cut-output-topology/Evidence/Analysis/S593-cut-candidate-topology.json";
const locationStepCm = 0.01;
const sha = (b) => createHash("sha256").update(b).digest("hex");

function parseDxf(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete DXF pair`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: invalid group code`);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = { name: pairs[i + 1]?.[1], entities: [] }; sections.push(section); i++; }
    else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i)); i--;
    }
  }
  const value = (e, code) => e.find(([c]) => c === code)?.[1];
  const makePath = (entity, block) => {
    const kind = entity[0]?.[1];
    let vertices = [];
    if (kind === "LWPOLYLINE") {
      for (const [code, raw] of entity.slice(1)) {
        if (code === 10) vertices.push({ x: Number(raw), y: NaN, bulge: 0 });
        else if (code === 20 && vertices.length) vertices.at(-1).y = Number(raw);
        else if (code === 42 && vertices.length) vertices.at(-1).bulge = Number(raw);
      }
    } else if (kind === "POLYLINE") {
      const all = sections.find(({ name }) => name === (label === "output" ? "BLOCKS" : "ENTITIES"))?.entities ?? [];
      const start = all.indexOf(entity);
      for (let j = start + 1; j < all.length && all[j][0]?.[1] !== "SEQEND"; j++) {
        if (all[j][0]?.[1] === "VERTEX") vertices.push({ x: Number(value(all[j], 10)), y: Number(value(all[j], 20)), bulge: Number(value(all[j], 42) ?? 0) });
      }
    } else return null;
    return { entityType: kind, block, layer: value(entity, 8) ?? "(none)", closed: Boolean(Number(value(entity, 70) ?? 0) & 1), vertices };
  };
  const ent = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const sourcePolys = label === "baseline" ? ent.map((e) => makePath(e, null)).filter(Boolean) : [];
  const inserts = ent.filter((e) => e[0]?.[1] === "INSERT").map((e) => ({ block: value(e, 2), x: Number(value(e, 10) ?? 0), y: Number(value(e, 20) ?? 0), sx: Number(value(e, 41) ?? 1), sy: Number(value(e, 42) ?? 1), rotation: Number(value(e, 50) ?? 0) }));
  const blocks = sections.find(({ name }) => name === "BLOCKS")?.entities ?? [];
  const outputPolys = [];
  let block;
  for (let i = 0; i < blocks.length; i++) {
    const e = blocks[i], kind = e[0]?.[1];
    if (kind === "BLOCK") block = value(e, 2);
    else if (kind === "ENDBLK") block = undefined;
    else if (block && (kind === "POLYLINE" || kind === "LWPOLYLINE")) {
      outputPolys.push(makePath(e, block));
      if (kind === "POLYLINE") { while (i + 1 < blocks.length && blocks[i + 1][0]?.[1] !== "SEQEND") i++; if (blocks[i + 1]?.[0]?.[1] === "SEQEND") i++; }
    }
  }
  const byBlock = new Map(inserts.map((x) => [x.block, x]));
  for (const p of outputPolys) {
    const t = byBlock.get(p.block) ?? { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 };
    const angle = t.rotation * Math.PI / 180;
    p.vertices = p.vertices.map(({ x, y, bulge }) => ({ x: t.x + x * t.sx * Math.cos(angle) - y * t.sy * Math.sin(angle), y: t.y + x * t.sx * Math.sin(angle) + y * t.sy * Math.cos(angle), bulge }));
  }
  return { sourcePolys, outputPolys, inserts };
}

const pointDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function nearestOnPath(point, path) {
  let best = { distanceCm: Infinity };
  for (let i = 0; i < path.vertices.length; i++) {
    const a = path.vertices[i], b = path.vertices[(i + 1) % path.vertices.length];
    const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / den)) : 0;
    const projected = { x: a.x + t * dx, y: a.y + t * dy }, distanceCm = pointDist(point, projected);
    if (distanceCm < best.distanceCm) best = { distanceCm, pathSegmentIndex: i, pathSegmentFraction: t, point: projected, pathSegmentStart: a, pathSegmentEnd: b };
  }
  return best;
}
function pathMetrics(path) {
  const xs = path.vertices.map((p) => p.x), ys = path.vertices.map((p) => p.y);
  let lengthCm = 0, area2 = 0;
  for (let i = 0; i < path.vertices.length; i++) {
    const a = path.vertices[i], b = path.vertices[(i + 1) % path.vertices.length];
    lengthCm += pointDist(a, b); area2 += a.x * b.y - b.x * a.y;
  }
  return { vertexCount: path.vertices.length, closed: path.closed, layerLocator: path.layer, entityType: path.entityType, boundsCm: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }, perimeterCm: lengthCm, signedAreaCm2: area2 / 2 };
}
function sourceWitnesses(path, source) {
  let sourceToOutput = { distanceCm: -1 }, outputToSource = { distanceCm: -1 };
  for (let i = 0; i < source.vertices.length; i++) {
    const a = source.vertices[i], b = source.vertices[(i + 1) % source.vertices.length];
    const length = pointDist(a, b), n = Math.max(1, Math.ceil(length / locationStepCm));
    for (let k = 0; k <= n; k++) {
      const t = k / n, point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const q = nearestOnPath(point, path);
      if (q.distanceCm > sourceToOutput.distanceCm) sourceToOutput = { distanceCm: q.distanceCm, sourceSegmentIndex: i, sourceSegmentFraction: t, sourceSegmentStart: a, sourceSegmentEnd: b, sourcePoint: point, receiverNearestPoint: q.point, receiverSegmentIndex: q.pathSegmentIndex, receiverSegmentFraction: q.pathSegmentFraction };
    }
  }
  for (let i = 0; i < path.vertices.length; i++) {
    const a = path.vertices[i], b = path.vertices[(i + 1) % path.vertices.length];
    const length = pointDist(a, b), n = Math.max(1, Math.ceil(length / locationStepCm));
    for (let k = 0; k <= n; k++) {
      const t = k / n, point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const q = nearestOnPath(point, source);
      if (q.distanceCm > outputToSource.distanceCm) outputToSource = { distanceCm: q.distanceCm, receiverSegmentIndex: i, receiverSegmentFraction: t, receiverPoint: point, nearestSource: { distanceCm: q.distanceCm, sourceSegmentIndex: q.pathSegmentIndex, sourceSegmentFraction: q.pathSegmentFraction, sourceSegmentStart: q.pathSegmentStart, sourceSegmentEnd: q.pathSegmentEnd, point: q.point } };
    }
  }
  return { sourceToReceiverCoarseWitness: sourceToOutput, receiverToSourceCoarseWitness: outputToSource, locationSampleStepCm: locationStepCm };
}
function exactCycleDelta(a, b, tolerance) {
  if (a.length !== b.length) return null;
  const starts = b.flatMap((p, i) => pointDist(a[0], p) <= tolerance ? [i] : []);
  let best = Infinity;
  for (const start of starts) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) max = Math.max(max, pointDist(a[i], b[(start + direction * i + b.length * 2) % b.length]));
    best = Math.min(best, max);
  }
  return Number.isFinite(best) ? best : null;
}

const baselineBytes = await readFile(baselinePath);
assert.equal(sha(baselineBytes), baselineHash, "baseline hash changed");
const baseline = parseDxf(baselineBytes, "baseline");
assert.equal(baseline.sourcePolys.length, 18);
const pieceNames = ["front", "back", "sleeve", "button placket", "buttonhole placket", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const output = [];
for (const c of cases) {
  const [fixtureBytes, outputBytes, priorBytes] = await Promise.all([readFile(c.fixture), readFile(c.output), readFile(c.priorReport)]);
  assert.equal(sha(fixtureBytes), c.fixtureHash, `${c.id}: fixture hash changed`);
  assert.equal(sha(outputBytes), c.outputHash, `${c.id}: CLO output hash changed`);
  assert.equal(sha(priorBytes), c.reportHash, `${c.id}: prior analyzer report hash changed`);
  const parsed = parseDxf(outputBytes, "output"), prior = JSON.parse(priorBytes);
  assert.equal(parsed.inserts.length, 9, `${c.id}: expected 9 receiver blocks`);
  const caseResults = [];
  for (let i = 0; i < pieceNames.length; i++) {
    const sourceCut = baseline.sourcePolys[i * 2], sourceSew = baseline.sourcePolys[i * 2 + 1];
    assert(sourceCut.vertices.every((v) => Math.abs(v.bulge) < 1e-12), `${pieceNames[i]}: source contains an arc not covered by the neighborhood method`);
    const result = prior.results.find((r) => r.piece === pieceNames[i]);
    assert(result, `${c.id}/${pieceNames[i]}: prior per-piece result absent`);
    const sewMatches = parsed.outputPolys.map((p, j) => ({ p, j, delta: exactCycleDelta(sourceSew.vertices, p.vertices, prior.thresholdCm) })).filter((x) => x.delta !== null).sort((a, b) => a.delta - b.delta);
    assert(sewMatches[0] && sewMatches[0].delta <= prior.thresholdCm, `${c.id}/${pieceNames[i]}: no exact SEW block binding`);
    const sew = sewMatches[0].p;
    const candidates = parsed.outputPolys.map((p, j) => ({ p, j })).filter(({ p }) => p.block === sew.block && p.closed && p !== sew);
    assert.equal(candidates.length, result.cut.closedOutlineCandidates.length, `${c.id}/${pieceNames[i]}: candidate inventory count differs from pinned analyzer`);
    const priorDescriptors = result.cut.closedOutlineCandidates.map((c) => `${c.layer}|${c.vertices}|${c.arcSegments}`).sort();
    const receiverDescriptors = candidates.map(({ p }) => `${p.layer}|${p.vertices.length}|${p.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length}`).sort();
    assert.deepEqual(receiverDescriptors, priorDescriptors, `${c.id}/${pieceNames[i]}: candidate descriptor inventory differs from pinned analyzer`);
    const candidateResults = candidates.map(({ p, j }, rank) => {
      assert(p.vertices.every((v) => Math.abs(v.bulge) < 1e-12), `${c.id}/${pieceNames[i]}/${rank}: output contains an arc not covered by the neighborhood method`);
      const metrics = pathMetrics(p);
      const descriptorMatches = result.cut.closedOutlineCandidates.filter((c) => c.layer === metrics.layerLocator && c.vertices === metrics.vertexCount && c.arcSegments === p.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length);
      assert(descriptorMatches.length > 0, `${c.id}/${pieceNames[i]}/${rank}: prior exact metrics absent for candidate descriptor`);
      const exactDuplicateRanks = candidates.flatMap(({ p: other }, otherRank) => otherRank < rank && exactCycleDelta(p.vertices, other.vertices, 1e-12) === 0 ? [otherRank] : []);
      return { rank, entityIndexWithinOutput: j, receiverBlock: p.block, ...metrics, exactDuplicateOfEarlierCandidateRanks: exactDuplicateRanks, priorExactRoundTripMetricsForSameDescriptor: descriptorMatches.map((x) => ({ conservativeUpperBoundCm: x.conservativeUpperBoundCm, sampledMaxCm: x.sampledMaxCm, exactCyclicDeltaCm: x.exactCyclicDeltaCm, acceptanceGateCm: prior.thresholdCm, passes: x.conservativeUpperBoundCm <= prior.thresholdCm })), coarseResidualWitnesses: sourceWitnesses(p, sourceCut) };
    });
    caseResults.push({ piece: pieceNames[i], sourceCutVertices: sourceCut.vertices.length, sourceSewVertices: sourceSew.vertices.length, sewnBlockBinding: { block: sew.block, maxCoordinateDeltaCm: sewMatches[0].delta }, cutCandidates: candidateResults });
  }
  output.push({ case: c.id, fixture: { path: c.fixture, sha256: c.fixtureHash }, output: { path: c.output, sha256: c.outputHash }, priorReport: { path: c.priorReport, sha256: c.reportHash }, pieces: caseResults });
}
const report = {
  slice: 593,
  method: "The original hash-pinned S536 LWPOLYLINE outlines provide source CUT/SEW geometry. Every CLO block is independently bound by its unchanged SEW outline. Every closed non-SEW path in each bound block is enumerated as an anonymous CUT candidate; numeric layer names are locators only. Exact round-trip measurements and gate results are carried from hash-pinned S591/S592 analyzers. Coarse witnesses use 0.01 cm source-segment spacing only to localize residual neighborhoods; they are diagnostic locations, not acceptance measurements.",
  baseline: { path: baselinePath, sha256: baselineHash },
  targetPieces: ["back", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"],
  cases: output,
  conclusions: [
    "Every receiver candidate is associated to a block by its unchanged SEW geometry; numeric layer names and INSERT order are not interpreted as manufacturing meaning.",
    "Exact pass/fail metrics remain those from the earlier 0.0005 cm step analyzers; this diagnostic does not relax the 0.001 cm gate.",
    "Across both variants, no enumerated target CUT candidate passes. S592 upper/under collar candidates are duplicate geometries across three layer locators; the stands and back each retain only failing candidates.",
    "Maximum residual neighborhoods shift between tested variants on some pieces (notably back and stands), while the upper/under collar residuals remain near source segment 15 at about 0.159 cm. Existing output evidence does not identify a single source-exact corrective mapping or establish CLO's internal cause."
  ],
  limitations: "One Polo M source and two CLO 2026.1.310 DXF-AAMA generation-one outputs only. Does not establish CLO internal cause, other options/sizes/recipes, semantic identity, or universal compatibility. No new import/export or product change."
};
await mkdir("C:/G04-CLO-DXF-Exchange/S593-polo-cut-output-topology/Evidence/Analysis", { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, cases: output.map(({ case: id, pieces }) => ({ case: id, pieces: pieces.length, targetCandidates: pieces.filter((p) => report.targetPieces.includes(p.piece)).map((p) => ({ piece: p.piece, candidates: p.cutCandidates.map((c) => ({ candidate: c.rank, layerLocator: c.layerLocator, vertices: c.vertexCount, boundsCm: c.priorExactRoundTripMetricsForSameDescriptor.map((x) => x.conservativeUpperBoundCm), sourceSegment: c.coarseResidualWitnesses.sourceToReceiverCoarseWitness.sourceSegmentIndex, sourceT: c.coarseResidualWitnesses.sourceToReceiverCoarseWitness.sourceSegmentFraction, sourcePoint: c.coarseResidualWitnesses.sourceToReceiverCoarseWitness.sourcePoint, sourceSegmentStart: c.coarseResidualWitnesses.sourceToReceiverCoarseWitness.sourceSegmentStart, sourceSegmentEnd: c.coarseResidualWitnesses.sourceToReceiverCoarseWitness.sourceSegmentEnd })) })) })) }, null, 2));
