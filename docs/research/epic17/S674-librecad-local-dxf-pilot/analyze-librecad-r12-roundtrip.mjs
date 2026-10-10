import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputPath = "C:/G04-CLO-DXF-Exchange/S671-polo-cut-source-path-density/Input/polo-standard-m-cm-units-header-exact-path-density.dxf";
const outputPath = "C:/G04-LibreCAD-Exchange/S674-librecad-r12-profile/RoundTrip/polo-roundtrip-r12.dxf";
const reportPath = "C:/G04-LibreCAD-Exchange/S674-librecad-r12-profile/Evidence/Analysis/librecad-r12-roundtrip.json";
const inputSha256 = "487fad7533bda83306d3f4fa2dfef523e469e62f3d808eff0a9c98a7e38b77f8";
const gateCm = 0.001;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete group pair`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trim()]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: invalid group code`);
  const sections = new Map();
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] !== 0 || pairs[i][1] !== "SECTION") continue;
    const name = pairs[i + 1]?.[1];
    const start = i + 2;
    let end = start;
    while (end < pairs.length && !(pairs[end][0] === 0 && pairs[end][1] === "ENDSEC")) end++;
    sections.set(name, pairs.slice(start, end));
    i = end;
  }
  const header = sections.get("HEADER") ?? [];
  const headerValue = (variable, code) => {
    const i = header.findIndex(([c, v]) => c === 9 && v === variable);
    if (i < 0) return null;
    return header.slice(i + 1).find(([c]) => c === code)?.[1] ?? null;
  };
  const records = [];
  const entities = sections.get("ENTITIES") ?? [];
  const value = (record, code) => record.find(([c]) => c === code)?.[1] ?? null;
  for (let i = 0; i < entities.length;) {
    if (entities[i][0] !== 0) { i++; continue; }
    const type = entities[i][1];
    if (type === "POLYLINE") {
      const headerRecord = [];
      while (i < entities.length && entities[i][0] !== 0) i++;
      headerRecord.push(entities[i++]);
      while (i < entities.length && !(entities[i][0] === 0 && entities[i][1] === "SEQEND")) {
        if (entities[i][0] === 0 && entities[i][1] === "VERTEX") {
          const vertex = [entities[i++]];
          while (i < entities.length && entities[i][0] !== 0) vertex.push(entities[i++]);
          headerRecord.push(...vertex);
        } else headerRecord.push(entities[i++]);
      }
      if (entities[i]?.[1] === "SEQEND") { headerRecord.push(entities[i++]); while (i < entities.length && entities[i][0] !== 0) headerRecord.push(entities[i++]); }
      const vertices = [];
      for (let j = 0; j < headerRecord.length; j++) if (headerRecord[j][0] === 0 && headerRecord[j][1] === "VERTEX") {
        const vertex = [];
        for (let k = j + 1; k < headerRecord.length && headerRecord[k][0] !== 0; k++) vertex.push(headerRecord[k]);
        const get = (code) => vertex.find(([c]) => c === code)?.[1];
        vertices.push({ x: Number(get(10)), y: Number(get(20)), bulge: Number(get(42) ?? 0) });
      }
      records.push({ type, layer: value(headerRecord, 8) ?? "(none)", closed: Boolean(Number(value(headerRecord, 70) ?? 0) & 1), vertices });
      continue;
    }
    const record = [entities[i++]];
    while (i < entities.length && entities[i][0] !== 0) record.push(entities[i++]);
    records.push({ type, layer: value(record, 8) ?? "(none)", record });
  }
  return {
    version: headerValue("$ACADVER", 1), insunits: headerValue("$INSUNITS", 70),
    records, layers: [...new Set(records.map(({ layer }) => layer))].sort(),
  };
}

function maxCycleDeltas(a, b) {
  if (a.vertices.length !== b.vertices.length || a.closed !== b.closed) return null;
  const n = a.vertices.length;
  if (!n) return null;
  let best = null;
  const rotations = a.closed ? n : 1;
  for (let start = 0; start < rotations; start++) for (const direction of [1, -1]) {
    if (!a.closed && direction < 0) continue;
    let coordinateCm = 0, bulge = 0;
    for (let i = 0; i < n; i++) {
      const p = a.vertices[i], q = b.vertices[(start + direction * i + n * 2) % n];
      coordinateCm = Math.max(coordinateCm, Math.hypot(p.x - q.x, p.y - q.y));
      bulge = Math.max(bulge, Math.abs(p.bulge - q.bulge));
    }
    if (!best || coordinateCm < best.coordinateCm || (coordinateCm === best.coordinateCm && bulge < best.bulge)) best = { coordinateCm, bulge };
  }
  return best;
}

function markCoordinates(record) {
  const v = (code) => Number(record.record.find(([c]) => c === code)?.[1]);
  if (record.type === "POINT") return [v(10), v(20), v(30) || 0];
  if (record.type === "LINE") return [v(10), v(20), v(30) || 0, v(11), v(21), v(31) || 0];
  if (record.type === "CIRCLE") return [v(10), v(20), v(30) || 0, v(40)];
  return null;
}
function matchMarks(sourceMarks, outputMarks) {
  const unmatched = [...outputMarks];
  const results = sourceMarks.map((source) => {
    const a = markCoordinates(source);
    const options = unmatched.flatMap((target, index) => {
      if (target.type !== source.type || target.layer !== source.layer) return [];
      const b = markCoordinates(target);
      if (!a || !b || a.length !== b.length) return [];
      return [{ index, maxDelta: Math.max(...a.map((n, i) => Math.abs(n - b[i]))), type: target.type, layer: target.layer }];
    }).sort((x, y) => x.maxDelta - y.maxDelta);
    const best = options[0];
    if (best) unmatched.splice(best.index, 1);
    return { type: source.type, layer: source.layer, maxDelta: best?.maxDelta ?? null, pass: best != null && best.maxDelta <= gateCm };
  });
  return { sourceCount: sourceMarks.length, outputCount: outputMarks.length, matched: results.filter((r) => r.pass).length, failures: results.filter((r) => !r.pass), unmatchedOutput: unmatched.length };
}

const [inputBytes, outputBytes] = await Promise.all([readFile(inputPath), readFile(outputPath)]);
assert.equal(sha(inputBytes), inputSha256, "the hash-pinned S671 source fixture changed");
const source = parse(inputBytes, "source"), output = parse(outputBytes, "LibreCAD output");
const srcPaths = source.records.filter((r) => r.type === "POLYLINE" && ["CUT", "SEW"].includes(r.layer));
const outPaths = output.records.filter((r) => r.type === "POLYLINE" && ["CUT", "SEW"].includes(r.layer));
const pathResults = srcPaths.map((path) => {
  const candidates = outPaths.filter((candidate) => candidate.layer === path.layer)
    .map((candidate) => ({ candidate, deltas: maxCycleDeltas(path, candidate) }))
    .filter((entry) => entry.deltas !== null).sort((a, b) => a.deltas.coordinateCm - b.deltas.coordinateCm || a.deltas.bulge - b.deltas.bulge);
  const best = candidates[0];
  if (best) outPaths.splice(outPaths.indexOf(best.candidate), 1);
  return { layer: path.layer, closed: path.closed, vertices: path.vertices.length, maxCoordinateDeltaCm: best?.deltas.coordinateCm ?? null, maxBulgeDelta: best?.deltas.bulge ?? null, pass: best != null && best.deltas.coordinateCm <= gateCm && best.deltas.bulge === 0 };
});
const srcMarks = source.records.filter((r) => r.type !== "POLYLINE");
const outMarks = output.records.filter((r) => r.type !== "POLYLINE");
const marks = matchMarks(srcMarks, outMarks);
const sourceTypes = Object.fromEntries([...new Set(source.records.map((r) => r.type))].sort().map((type) => [type, source.records.filter((r) => r.type === type).length]));
const outputTypes = Object.fromEntries([...new Set(output.records.map((r) => r.type))].sort().map((type) => [type, output.records.filter((r) => r.type === type).length]));
const report = {
  experiment: "LibreCAD 2.2.1.5 one exact S671 Polo M import, R12 Save As, and clean re-open. Empirical vendor-specific profile test only; no standards claim.",
  source: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes), version: source.version, insunits: source.insunits, types: sourceTypes, layers: source.layers },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes), version: output.version, insunits: output.insunits, types: outputTypes, layers: output.layers },
  gates: {
  geometry: { pass: pathResults.length === 18 && pathResults.every((r) => r.pass) && outPaths.length === 0, thresholdCm: gateCm, sourcePathCount: srcPaths.length, outputPathCount: output.records.filter((r) => r.type === "POLYLINE" && ["CUT", "SEW"].includes(r.layer)).length, results: pathResults, leftoverOutputPaths: outPaths.length },
    units: { pass: source.insunits === output.insunits && source.insunits === "5", detail: "Source is INSUNITS=5 (centimeter); R12 output omits INSUNITS, so output does not self-describe the source unit." },
    typedMarks: { pass: marks.sourceCount === marks.outputCount && marks.matched === marks.sourceCount && marks.unmatchedOutput === 0, ...marks },
    semanticLayers: { pass: JSON.stringify(source.layers) === JSON.stringify(output.layers), source: source.layers, output: output.layers },
    sourcePieceIdentity: { pass: null, status: "unproven", detail: "The source fixture contains no piece-name/revision payload, so this one-file pilot cannot assess identity preservation or mismatch rejection." },
    cleanReopen: { pass: true, detail: "LibreCAD status reported the exact saved C: path loaded from disk with no intervening import warning dialog." },
    repeatability: { pass: null, status: "unproven", detail: "Only the one authorized Save As and clean re-open was run; a second conversion generation was not part of this pilot." },
  },
  limitations: "One representative Polo M file cannot prove all-seven recipes/options, grades, malformed-input rejection, two-generation repeatability, complete source identity binding, industrial apparel-CAD suitability, physical fit, factory acceptance, or production readiness.",
};
await mkdir("C:/G04-LibreCAD-Exchange/S674-librecad-r12-profile/Evidence/Analysis", { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, hashes: { input: report.source.sha256, output: report.output.sha256 }, gates: Object.fromEntries(Object.entries(report.gates).map(([k, v]) => [k, v.status ?? (v.pass ? "passed" : v.pass === false ? "failed" : "unproven")])), geometryMaxCm: Math.max(...pathResults.map((r) => r.maxCoordinateDeltaCm ?? Infinity)), maxBulgeDelta: Math.max(...pathResults.map((r) => r.maxBulgeDelta ?? Infinity)), markCount: { source: marks.sourceCount, output: marks.outputCount, matched: marks.matched, failures: marks.failures.length } }, null, 2));
