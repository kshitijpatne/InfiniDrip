import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const evidenceRoot = "C:/G04-CLO-DXF-Exchange/S546-polo-contour-delta-diagnosis/Evidence";
const sourceFile = "C:/G04-CLO-DXF-Exchange/S544-aama-three-recipe-roundtrip/Input/polo-standard-m.dxf";
const inputs = [
  { label: "S498 ASTM gen1", file: "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/polo-standard-m-s498-clo-export.dxf", bytes: 221652, sha256: "523dbd2d7f2e1e6440a1deff254efa1137b1bf37bb0c9070da6681144594722c" },
  { label: "S498 ASTM gen2", file: "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/polo-standard-m-s498-generation-2.dxf", bytes: 221654, sha256: "2a878fa0d00d289cf733718debc77b755c2e033b9834e53b1a9e76d948f0a0f8" },
  { label: "S516 AAMA", file: "C:/G04-CLO-DXF-Exchange/S516-clo-aama-roundtrip/Output/polo-aama-export-01.dxf", bytes: 148000, sha256: null },
  { label: "S545 AAMA gen1", file: "C:/G04-CLO-DXF-Exchange/S544-aama-three-recipe-roundtrip/Output/polo-aama-gen1.dxf", bytes: 147995, sha256: "cac8d2d90a7b72bfebcf9bedbef7c1c91e3558c3386423f833e080c283bb0470" },
  { label: "S545 AAMA gen2", file: "C:/G04-CLO-DXF-Exchange/S544-aama-three-recipe-roundtrip/Output/polo-aama-gen2.dxf", bytes: 147995, sha256: "ae3731633a396cc94911dfe7ee53cd0dc85e847a04420a0c6e985b8cf57c1241" },
];
const pieces = [
  { ordinal: 2, name: "Back", block: "1_M", s500PointCm: [37.489, 74.514], s500VertexIndex: 13 },
  { ordinal: 10, name: "Outer collar stand", block: "5_M", s500PointCm: [139.277, 66.459], s500VertexIndex: 14 },
  { ordinal: 12, name: "Inner collar stand", block: "6_M", s500PointCm: [156.921, 66.459], s500VertexIndex: 14 },
  { ordinal: 14, name: "Upper pointed collar", block: "7_M", s500PointCm: [174.564, 66.459], s500VertexIndex: 14 },
  { ordinal: 16, name: "Under pointed collar", block: "8_M", s500PointCm: [194.164, 66.459], s500VertexIndex: 14 },
];
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const value = (entity, code) => entity.find(([key]) => key === code)?.[1];

function parse(buffer) {
  const lines = buffer.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF group code/value pairs are complete");
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `numeric group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    const [code, pairValue] = pairs[i];
    if (code === 0 && pairValue === "SECTION") {
      section = { name: pairs[++i]?.[1], entities: [] };
      sections.push(section);
    } else if (code === 0 && pairValue === "ENDSEC") section = undefined;
    else if (section && code === 0) {
      const entity = [pairs[i++]];
      while (i < pairs.length && pairs[i][0] !== 0) entity.push(pairs[i++]);
      i -= 1;
      section.entities.push(entity);
    }
  }
  const polylines = (entities, block) => {
    const result = [];
    for (let i = 0; i < entities.length; i += 1) {
      const header = entities[i];
      if (header[0][1] !== "POLYLINE") continue;
      const vertices = [];
      for (let j = i + 1; j < entities.length; j += 1) {
        const child = entities[j];
        if (child[0][1] === "SEQEND" || ["BLOCK", "POLYLINE", "ENDBLK"].includes(child[0][1])) break;
        if (child[0][1] === "VERTEX") vertices.push({ x: Number(value(child, 10)), y: Number(value(child, 20)) });
      }
      result.push({ block, layer: value(header, 8) ?? "(none)", closed: (Number(value(header, 70) ?? 0) & 1) === 1, vertices });
    }
    return result;
  };
  const blocks = [];
  let active;
  for (const entity of sections.find(({ name }) => name === "BLOCKS")?.entities ?? []) {
    if (entity[0][1] === "BLOCK") {
      active = { name: value(entity, 2), entities: [] };
      blocks.push(active);
    } else if (entity[0][1] === "ENDBLK") active = undefined;
    else if (active) active.entities.push(entity);
  }
  for (const block of blocks) block.polylines = polylines(block.entities, block.name);
  return {
    source: polylines(sections.find(({ name }) => name === "ENTITIES")?.entities ?? [], "model"),
    blocks,
  };
}

function sequenceDelta(source, target) {
  if (source.length !== target.length || !source.length) return Infinity;
  let best = Infinity;
  for (let start = 0; start < target.length; start += 1) for (const direction of [1, -1]) {
    let maximum = 0;
    for (let i = 0; i < source.length; i += 1) {
      const point = target[(start + direction * i + target.length * 2) % target.length];
      maximum = Math.max(maximum, Math.abs(source[i].x - point.x), Math.abs(source[i].y - point.y));
    }
    best = Math.min(best, maximum);
  }
  return best;
}

function onePointLoss(source, output) {
  let best = null;
  for (let removed = 0; removed < source.length; removed += 1) {
    const retained = source.filter((_, index) => index !== removed);
    const delta = sequenceDelta(retained, output);
    if (!best || delta < best.delta) best = { removedVertexIndexZeroBased: removed, retainedPointMaxDeltaCm: delta };
  }
  return best;
}

function pointToSegment(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2)) : 0;
  const projected = { x: a.x + t * dx, y: a.y + t * dy };
  return { distanceCm: Math.hypot(point.x - projected.x, point.y - projected.y), projected, t };
}

function turnDegrees(a, point, b) {
  const u = { x: a.x - point.x, y: a.y - point.y }, v = { x: b.x - point.x, y: b.y - point.y };
  const cosine = Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))));
  return 180 - Math.acos(cosine) * 180 / Math.PI;
}

function bounds(vertices) {
  return { minX: Math.min(...vertices.map((p) => p.x)), minY: Math.min(...vertices.map((p) => p.y)), maxX: Math.max(...vertices.map((p) => p.x)), maxY: Math.max(...vertices.map((p) => p.y)) };
}

function svgPath(vertices, map) {
  return `${vertices.map((p, i) => `${i ? "L" : "M"}${map(p).x.toFixed(3)},${map(p).y.toFixed(3)}`).join(" ")} Z`;
}

const sourceBytes = await readFile(sourceFile);
assert.equal(sourceBytes.length, 24261);
assert.equal(sha256(sourceBytes), "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
const source = parse(sourceBytes).source;
assert.equal(source.length, 18);
const generations = [];
for (const input of inputs) {
  const bytes = await readFile(input.file);
  assert.equal(bytes.length, input.bytes, `${input.label}: pinned byte count`);
  const hash = sha256(bytes);
  if (input.sha256) assert.equal(hash, input.sha256, `${input.label}: pinned SHA-256`);
  generations.push({ ...input, sha256: hash, parsed: parse(bytes) });
}

const findings = pieces.map((piece) => {
  const original = source[piece.ordinal];
  assert.equal(original.closed, true);
  const missingCandidates = [];
  for (const generation of generations) {
    const block = generation.parsed.blocks.find(({ name }) => name === piece.block);
    assert.ok(block, `${generation.label}: ${piece.block} exists`);
    const candidates = block.polylines.filter((line) => line.closed && line.vertices.length === original.vertices.length - 1)
      .map((line) => ({ layer: line.layer, vertices: line.vertices, ...onePointLoss(original.vertices, line.vertices) }))
      .sort((a, b) => a.retainedPointMaxDeltaCm - b.retainedPointMaxDeltaCm);
    assert.ok(candidates.length, `${generation.label}: ${piece.name} output candidate exists`);
    const chosen = candidates[0];
    if (!(chosen.retainedPointMaxDeltaCm < 0.001)) console.error(JSON.stringify({ debug: generation.label, piece: piece.name, sourceCount: original.vertices.length, outputCount: chosen.vertices.length, removedIndex: chosen.removedVertexIndexZeroBased, retainedDeltaCm: chosen.retainedPointMaxDeltaCm, sourceFirst: original.vertices.slice(0, 3), outputFirst: chosen.vertices.slice(0, 3), candidateLayers: candidates.map(({ layer, retainedPointMaxDeltaCm, removedVertexIndexZeroBased }) => ({ layer, retainedPointMaxDeltaCm, removedVertexIndexZeroBased })) }));
    assert.ok(chosen.retainedPointMaxDeltaCm < 0.001, `${generation.label}: retained contour vertices stay within 0.001 cm`);
    const i = chosen.removedVertexIndexZeroBased;
    const before = original.vertices[(i - 1 + original.vertices.length) % original.vertices.length];
    const omitted = original.vertices[i];
    const after = original.vertices[(i + 1) % original.vertices.length];
    const chord = pointToSegment(omitted, before, after);
    missingCandidates.push({ label: generation.label, hash: generation.sha256, layer: chosen.layer, candidateLayerCount: candidates.length, outputVertexCount: chosen.vertices.length, removedVertexIndexZeroBased: i, omittedSourcePointCm: omitted, retainedPointMaxDeltaCm: chosen.retainedPointMaxDeltaCm, predecessorCm: before, successorCm: after, replacementChordResidualCm: chord.distanceCm, chordProjectionCm: chord.projected, chordFraction: chord.t, localDirectionChangeDegrees: turnDegrees(before, omitted, after), sourceBounds: bounds(original.vertices), outputBounds: bounds(chosen.vertices), chosenVertices: chosen.vertices });
  }
  assert.ok(missingCandidates.every((entry) => entry.removedVertexIndexZeroBased === missingCandidates[0].removedVertexIndexZeroBased), `${piece.name}: same source point disappears in every output`);
  const reportEntries = missingCandidates.map(({ chosenVertices, ...entry }) => entry);
  return {
    ...piece,
    sourceVertexCount: original.vertices.length,
    outputs: reportEntries,
    repeatedPointRemoval: true,
    maxRetainedDeltaCm: Math.max(...reportEntries.map(({ retainedPointMaxDeltaCm }) => retainedPointMaxDeltaCm)),
    maxChordResidualCm: Math.max(...reportEntries.map(({ replacementChordResidualCm }) => replacementChordResidualCm)),
    generationStabilityUpperBoundCm: reportEntries.at(-2).retainedPointMaxDeltaCm + reportEntries.at(-1).retainedPointMaxDeltaCm,
    sourceVertices: original.vertices,
    gen1Vertices: missingCandidates.find(({ label }) => label === "S545 AAMA gen1").chosenVertices,
    gen2Vertices: missingCandidates.find(({ label }) => label === "S545 AAMA gen2").chosenVertices,
  };
});

const report = {
  title: "S546 Polo CUT point-loss identity across existing CLO outputs",
  receiver: "CLO 2026.1.310 (r58944)",
  thresholdCm: 0.001,
  source: { path: sourceFile, bytes: sourceBytes.length, sha256: sha256(sourceBytes) },
  outputs: generations.map(({ label, file, bytes, sha256: hash }) => ({ label, file, bytes, sha256: hash })),
  method: "For five source CUT contour ordinals already identified in S500, the analyzer tests deleting each single source vertex and compares every cyclic/reversed retained point sequence to same-block output contours. The minimum same-block candidate is recorded; the same removed point must recur across all five independent CLO outputs. The omitted point's deviation from the source neighbor chord and local turn are measured directly.",
  findings: findings.map(({ sourceVertices, gen1Vertices, gen2Vertices, ...entry }) => entry),
  conclusion: "This read-only cross-profile comparison does not run CLO again or change settings. It establishes whether the S545 AAMA outputs omit the same points identified from S498 ASTM and S516 AAMA outputs. It cannot attribute the point loss to import versus export.",
  limits: ["numeric output layers are not interpreted as manufacturing semantics", "sample fixture is Polo M/default only", "this report does not prove profile conformance, grade behavior, or factory acceptance"],
};
await writeFile(`${evidenceRoot}/polo-contour-point-identity.json`, `${JSON.stringify(report, null, 2)}\n`);

const rowHeight = 255, width = 1120;
const drawings = findings.map((finding, row) => {
  const all = [...finding.sourceVertices, ...finding.gen1Vertices, ...finding.gen2Vertices];
  const box = bounds(all);
  const scale = Math.min(830 / Math.max(box.maxX - box.minX, 0.1), 168 / Math.max(box.maxY - box.minY, 0.1));
  const map = ({ x, y }) => ({ x: 230 + (x - box.minX) * scale, y: row * rowHeight + 214 - (y - box.minY) * scale });
  const output = finding.outputs.find(({ label }) => label === "S545 AAMA gen1");
  const index = output.removedVertexIndexZeroBased;
  const omitted = finding.sourceVertices[index];
  const previous = finding.sourceVertices[(index - 1 + finding.sourceVertices.length) % finding.sourceVertices.length];
  const next = finding.sourceVertices[(index + 1) % finding.sourceVertices.length];
  const m = map(omitted), a = map(previous), b = map(next);
  return `<g><rect x="0" y="${row * rowHeight}" width="${width}" height="${rowHeight}" fill="${row % 2 ? "#f4f6f8" : "#ffffff"}"/><text x="18" y="${row * rowHeight + 24}" font-family="Arial" font-size="17" font-weight="bold">${finding.name} — ${finding.block}</text><text x="18" y="${row * rowHeight + 45}" font-family="Arial" font-size="13">source vertex ${index}; removed in all 5 exports; chord residual ${output.replacementChordResidualCm.toFixed(6)} cm</text><path d="${svgPath(finding.sourceVertices, map)}" fill="none" stroke="#222" stroke-width="2"/><path d="${svgPath(finding.gen1Vertices, map)}" fill="none" stroke="#1463b8" stroke-width="1.4" stroke-dasharray="5 3"/><path d="${svgPath(finding.gen2Vertices, map)}" fill="none" stroke="#159447" stroke-width="1.2" stroke-dasharray="2 3"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d62728" stroke-width="2.4"/><circle cx="${m.x}" cy="${m.y}" r="4.5" fill="#d62728"/></g>`;
}).join("\n");
await writeFile(`${evidenceRoot}/polo-contour-point-identity.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rowHeight * findings.length}" viewBox="0 0 ${width} ${rowHeight * findings.length}">${drawings}</svg>`);

console.log(JSON.stringify({ outputs: report.outputs, findings: report.findings.map(({ name, block, s500PointCm, s500VertexIndex, outputs }) => ({ name, block, s500PointCm, s500VertexIndex, allSamePoint: outputs.every(({ removedVertexIndexZeroBased }) => removedVertexIndexZeroBased === outputs[0].removedVertexIndexZeroBased), point: outputs[0].omittedSourcePointCm, vertexIndex: outputs[0].removedVertexIndexZeroBased, maxChordResidualCm: Math.max(...outputs.map(({ replacementChordResidualCm }) => replacementChordResidualCm)), maxRetainedDeltaCm: Math.max(...outputs.map(({ retainedPointMaxDeltaCm }) => retainedPointMaxDeltaCm)), outputs: outputs.map(({ label, layer, removedVertexIndexZeroBased }) => ({ label, layer, removedVertexIndexZeroBased })) })) }, null, 2));
