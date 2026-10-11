import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = "C:/G04-CLO-DXF-Exchange/S498-practical-retest";
const sourcePath = "C:/G04-CLO-DXF-Exchange/Input/polo-standard-m.dxf";
const expected = {
  source: { bytes: 24261, sha256: "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca" },
  first: { file: `${root}/Output/polo-standard-m-s498-clo-export.dxf`, bytes: 221652, sha256: "523dbd2d7f2e1e6440a1deff254efa1137b1bf37bb0c9070da6681144594722c" },
  second: { file: `${root}/Output/polo-standard-m-s498-generation-2.dxf`, bytes: 221654, sha256: "2a878fa0d00d289cf733718debc77b755c2e033b9834e53b1a9e76d948f0a0f8" },
};
const pieces = [
  { sourceOrdinal: 2, name: "back", block: "1_M" },
  { sourceOrdinal: 10, name: "outer collar stand", block: "5_M" },
  { sourceOrdinal: 12, name: "inner collar stand", block: "6_M" },
  { sourceOrdinal: 14, name: "upper pointed collar", block: "7_M" },
  { sourceOrdinal: 16, name: "under pointed collar", block: "8_M" },
];
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

function parse(buffer, label) {
  const lines = buffer.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete code/value pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${label}: numeric group code at ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION") {
      section = { name: pairs[++i]?.[1], entities: [] };
      sections.push(section);
    } else if (code === 0 && value === "ENDSEC") section = undefined;
    else if (section && code === 0) {
      const entity = [pairs[i++]];
      while (i < pairs.length && pairs[i][0] !== 0) entity.push(pairs[i++]);
      i--;
      section.entities.push(entity);
    }
  }
  const val = (entity, key) => entity.find(([code]) => code === key)?.[1];
  function polylines(entities, block) {
    const result = [];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity[0][1] !== "POLYLINE") continue;
      const vertices = [];
      for (let j = i + 1; j < entities.length; j++) {
        const child = entities[j];
        if (child[0][1] === "SEQEND") break;
        if (child[0][1] === "VERTEX") vertices.push({ x: Number(val(child, 10)), y: Number(val(child, 20)) });
        if (["BLOCK", "POLYLINE", "ENDBLK"].includes(child[0][1])) break;
      }
      result.push({ block, layer: val(entity, 8) ?? "(none)", closed: (Number(val(entity, 70) ?? 0) & 1) === 1, vertices });
    }
    return result;
  }
  const source = polylines(sections.find(({ name }) => name === "ENTITIES")?.entities ?? [], "model");
  const blocks = [];
  let active;
  for (const entity of sections.find(({ name }) => name === "BLOCKS")?.entities ?? []) {
    const type = entity[0][1];
    if (type === "BLOCK") {
      active = { name: val(entity, 2), polylines: [] };
      blocks.push(active);
    } else if (type === "ENDBLK") active = undefined;
    else if (type === "POLYLINE" && active) active.polylines.push(...polylines([entity, ...[]], active.name));
  }
  // Reparse each block as a contiguous entity range so POLYLINE VERTEX runs stay together.
  let block;
  for (const entity of sections.find(({ name }) => name === "BLOCKS")?.entities ?? []) {
    const type = entity[0][1];
    if (type === "BLOCK") block = blocks.find(({ name }) => name === val(entity, 2));
    if (type === "ENDBLK") block = undefined;
    if (block && type === "POLYLINE") {
      // locate the next VERTEX entities from the flat BLOCKS list in a second pass below
    }
  }
  const blockEntities = sections.find(({ name }) => name === "BLOCKS")?.entities ?? [];
  for (const item of blocks) {
    const begin = blockEntities.findIndex((entity) => entity[0][1] === "BLOCK" && val(entity, 2) === item.name);
    const end = blockEntities.findIndex((entity, index) => index > begin && entity[0][1] === "ENDBLK");
    item.polylines = polylines(blockEntities.slice(begin + 1, end), item.name);
  }
  return { source, blocks };
}

function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const denom = dx * dx + dy * dy;
  const t = denom ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / denom)) : 0;
  const q = { x: a.x + t * dx, y: a.y + t * dy };
  return { distance: Math.hypot(p.x - q.x, p.y - q.y), projection: q, t };
}
function sequenceDelta(a, b) {
  if (a.length !== b.length) return Infinity;
  let best = Infinity;
  for (let start = 0; start < b.length; start++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const j = (start + direction * i + b.length * 2) % b.length;
      max = Math.max(max, Math.abs(a[i].x - b[j].x), Math.abs(a[i].y - b[j].y));
    }
    best = Math.min(best, max);
  }
  return best;
}
function oneVertexRemoval(source, output) {
  let best = null;
  for (let removed = 0; removed < source.length; removed++) {
    const retained = source.filter((_, index) => index !== removed);
    const delta = sequenceDelta(retained, output);
    if (!best || delta < best.delta) best = { removedSourceVertexIndex: removed, delta };
  }
  return best;
}
function localTurn(a, p, b) {
  const u = { x: a.x - p.x, y: a.y - p.y }, v = { x: b.x - p.x, y: b.y - p.y };
  const cosine = Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))));
  return 180 - (Math.acos(cosine) * 180 / Math.PI);
}
function path(points, map) { return points.map((p, i) => `${i ? "L" : "M"}${map(p).x.toFixed(2)},${map(p).y.toFixed(2)}`).join(" ") + " Z"; }

const raw = {};
for (const [key, input] of Object.entries({ source: { file: sourcePath, ...expected.source }, first: expected.first, second: expected.second })) {
  const bytes = await readFile(input.file);
  assert.equal(bytes.length, input.bytes, `${key} byte count`);
  assert.equal(sha(bytes), input.sha256, `${key} pinned SHA-256`);
  raw[key] = parse(bytes, key);
}
assert.equal(raw.source.source.length, 18, "source Polo has 18 CUT/SEW contours");
const findings = pieces.map((piece, row) => {
  const source = raw.source.source[piece.sourceOrdinal];
  assert.ok(source?.closed && source.vertices.length > 3, `${piece.name}: source closed CUT outline`);
  const generations = {};
  for (const generation of ["first", "second"]) {
    const outputPolylines = raw[generation].blocks.find(({ name }) => name === piece.block)?.polylines ?? [];
    const candidates = outputPolylines.map((polyline) => ({
      layer: polyline.layer,
      closed: polyline.closed,
      vertexCount: polyline.vertices.length,
      match: oneVertexRemoval(source.vertices, polyline.vertices),
      vertices: polyline.vertices,
    })).filter((candidate) => candidate.closed && candidate.vertexCount === source.vertices.length - 1)
      .sort((a, b) => a.match.delta - b.match.delta);
    assert.ok(candidates.length, `${piece.name}: output candidate with exactly one fewer vertex`);
    const chosen = candidates[0];
    assert.ok(chosen.match.delta <= 0.001, `${piece.name}/${generation}: all retained vertices match within 0.001 cm`);
    const i = chosen.match.removedSourceVertexIndex;
    const before = source.vertices[(i - 1 + source.vertices.length) % source.vertices.length];
    const missing = source.vertices[i];
    const after = source.vertices[(i + 1) % source.vertices.length];
    const gap = pointSegmentDistance(missing, before, after);
    const outputGap = pointSegmentDistance(missing, before, after);
    generations[generation] = {
      matchedOutputLayer: chosen.layer,
      matchingOneVertexDeletedSequenceDeltaCm: chosen.match.delta,
      outputVertexCount: chosen.vertexCount,
      removedVertexIndexZeroBased: i,
      omittedSourcePointCm: missing,
      retainedPredecessorCm: before,
      retainedSuccessorCm: after,
      sourcePointToReplacementChordCm: gap.distance,
      sourcePointToReplacementProjectionCm: outputGap.projection,
      projectionPosition: gap.t,
      localDirectionChangeDegrees: localTurn(before, missing, after),
      distinctNumericLayerCandidateCount: candidates.length,
    };
    generations[generation].outputVertices = chosen.vertices;
  }
  const first = generations.first, second = generations.second;
  assert.equal(first.removedVertexIndexZeroBased, second.removedVertexIndexZeroBased, `${piece.name}: same removed source index`);
  const { outputVertices: firstVertices, ...firstSummary } = first;
  const { outputVertices: secondVertices, ...secondSummary } = second;
  return {
    ...piece,
    sourceVertexCount: source.vertices.length,
    sourceBounds: {
      minX: Math.min(...source.vertices.map(({ x }) => x)), maxX: Math.max(...source.vertices.map(({ x }) => x)),
      minY: Math.min(...source.vertices.map(({ y }) => y)), maxY: Math.max(...source.vertices.map(({ y }) => y)),
    },
    generation1: firstSummary,
    generation2: secondSummary,
    generationsOmitSameSourceVertex: first.removedVertexIndexZeroBased === second.removedVertexIndexZeroBased,
    generationOutputVertices: { first: firstVertices, second: secondVertices },
  };
});
const report = {
  title: "S500 Polo CUT point-removal geometry diagnosis",
  receiver: "CLO 2026.1.310 (r58944), S498 practical outputs",
  thresholdCm: 0.001,
  sources: Object.fromEntries(Object.entries(expected).map(([key, input]) => [key, { file: key === "source" ? sourcePath : input.file, bytes: input.bytes, sha256: input.sha256 }])),
  method: "Hash-pinned pair parser associates source CUT ordinals to S498 piece blocks. For each block, every possible single source-vertex deletion is tested against each closed output polyline using cyclic/reverse maximum coordinate delta. The closest deleted-vertex match is retained. The geometric residual is the omitted source point's distance to the chord between its source neighbors; this quantifies point significance but does not identify CLO's internal cause.",
  findings,
  conclusion: "The same source point index is absent in both generations for each affected piece; every remaining vertex sequence matches within 0.001 cm. Chord distances and direction changes state whether the removed points were geometrically redundant in the source. Repetition proves a stable receiver output difference, not which import setting caused it.",
  renderedEvidence: "The companion SVG overlays the exact source CUT, first-generation receiver polyline, and second-generation receiver polyline, with the omitted source vertex and replacement chord highlighted.",
  limits: ["No CLO UI option was changed or tested in S499.", "This does not prove DXF-AAMA or DXF-ASTM conformance, semantic layer meaning, rights/local handling, or factory/physical acceptance.", "A geometrically small chord residual cannot alone decide whether removing a source subdivision is semantically permitted by the V03 exact round-trip gate."],
};
for (const item of findings) delete item.generationOutputVertices;
const dir = dirname(fileURLToPath(import.meta.url));
await writeFile(resolve(dir, "S500-vertex-loss-analysis.json"), `${JSON.stringify(report, null, 2)}\n`);
const width = 1120, rowHeight = 260;
const drawings = findings.map((finding, row) => {
  const source = raw.source.source[finding.sourceOrdinal].vertices;
  const first = pieces.find(({ name }) => name === finding.name);
  const a = raw.first.blocks.find(({ name }) => name === first.block).polylines.find((line) => line.vertices.length === source.length - 1 && oneVertexRemoval(source, line.vertices).removedSourceVertexIndex === finding.generation1.removedVertexIndexZeroBased);
  const b = raw.second.blocks.find(({ name }) => name === first.block).polylines.find((line) => line.vertices.length === source.length - 1 && oneVertexRemoval(source, line.vertices).removedSourceVertexIndex === finding.generation2.removedVertexIndexZeroBased);
  const all = [...source, ...a.vertices, ...b.vertices];
  const minX = Math.min(...all.map(({ x }) => x)), maxX = Math.max(...all.map(({ x }) => x));
  const minY = Math.min(...all.map(({ y }) => y)), maxY = Math.max(...all.map(({ y }) => y));
  const scale = Math.min(850 / Math.max(maxX - minX, 0.1), 170 / Math.max(maxY - minY, 0.1));
  const map = ({ x, y }) => ({ x: 180 + (x - minX) * scale, y: row * rowHeight + 250 - (y - minY) * scale });
  const miss = source[finding.generation1.removedVertexIndexZeroBased], prev = source[(finding.generation1.removedVertexIndexZeroBased - 1 + source.length) % source.length], next = source[(finding.generation1.removedVertexIndexZeroBased + 1) % source.length];
  const marker = map(miss), p1 = map(prev), p2 = map(next);
  const summary = `deleted source index ${finding.generation1.removedVertexIndexZeroBased}; chord residual ${finding.generation1.sourcePointToReplacementChordCm.toFixed(6)} cm; direction change ${finding.generation1.localDirectionChangeDegrees.toFixed(4)}°`;
  return `<g><rect x="0" y="${row * rowHeight}" width="${width}" height="${rowHeight}" fill="${row % 2 ? "#f4f6f8" : "#fff"}"/><text x="18" y="${row * rowHeight + 22}" font-family="Arial" font-size="17" font-weight="bold">${finding.name} — ${finding.block}</text><text x="18" y="${row * rowHeight + 44}" font-family="Arial" font-size="13">${summary}</text><path d="${path(source, map)}" fill="none" stroke="#222" stroke-width="1.7"/><path d="${path(a.vertices, map)}" fill="none" stroke="#1463b8" stroke-width="1.1" stroke-dasharray="5 3"/><path d="${path(b.vertices, map)}" fill="none" stroke="#169447" stroke-width="1.1" stroke-dasharray="2 3"/><line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#d62728" stroke-width="2.3"/><circle cx="${marker.x}" cy="${marker.y}" r="5" fill="#d62728"/><text x="${marker.x + 8}" y="${marker.y + 12}" font-family="Arial" font-size="12" fill="#a11">dropped source point</text></g>`;
}).join("\n");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rowHeight * findings.length}" viewBox="0 0 ${width} ${rowHeight * findings.length}"><rect width="100%" height="100%" fill="white"/>${drawings}</svg>`;
await writeFile(resolve(dir, "S500-vertex-loss-overlays.svg"), svg);
console.log(JSON.stringify({ report: "S500-vertex-loss-analysis.json", overlay: "S500-vertex-loss-overlays.svg", contours: findings.map(({ name, block, sourceVertexCount, generation1, generation2 }) => ({ name, block, sourceVertexCount, removedIndex: generation1.removedVertexIndexZeroBased, gen1ChordResidualCm: generation1.sourcePointToReplacementChordCm, gen2ChordResidualCm: generation2.sourcePointToReplacementChordCm, gen1DirectionChangeDegrees: generation1.localDirectionChangeDegrees, retainedSequenceDeltaGen1: generation1.matchingOneVertexDeletedSequenceDeltaCm, retainedSequenceDeltaGen2: generation2.matchingOneVertexDeletedSequenceDeltaCm })) }, null, 2));
