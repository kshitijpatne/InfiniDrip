import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange";
const cases = [
  { key: "polo", name: "Polo M", input: "Input/polo-standard-m.dxf", output: "Output/polo-standard-m-clo-export.dxf", expectedHash: "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca", expectedBytes: 24261, expectedOutlines: 18, expectedMarks: { CIRCLE: 3, LINE: 14, POINT: 21 } },
  { key: "woven", name: "Woven shirt M", input: "Input/woven-shirt-standard-m.dxf", output: "Output/woven-shirt-standard-m-clo-export.dxf", expectedHash: "9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5", expectedBytes: 14923, expectedOutlines: 24, expectedMarks: { CIRCLE: 8, LINE: 13, POINT: 10 } },
];
const sha = (b) => createHash("sha256").update(b).digest("hex");
function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  if (lines.length % 2) throw new Error(`${label}: incomplete group pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (!/^\d+$/.test(lines[i].trim())) throw new Error(`${label}: invalid group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i));
      i--;
    }
  }
  const value = (e, code) => e.find(([c]) => c === code)?.[1];
  const entities = sections.flatMap((s) => s.entities.map((raw) => ({
    type: raw[0][1], layer: value(raw, 8) ?? "(none)", raw,
    x: Number(value(raw, 10)), y: Number(value(raw, 20)),
  })));
  const acadIndex = pairs.findIndex(([c, v]) => c === 9 && v === "$ACADVER");
  const insIndex = pairs.findIndex(([c, v]) => c === 9 && v === "$INSUNITS");
  const blocks = [];
  let block;
  const blockSection = sections.find((s) => s.name === "BLOCKS");
  for (let i = 0; i < (blockSection?.entities.length ?? 0); i++) {
    const e = blockSection.entities[i], type = e[0][1];
    if (type === "BLOCK") {
      block = { name: value(e, 2), entities: [] };
      blocks.push(block);
    } else if (type === "ENDBLK") block = undefined;
    else if (block) {
      const item = { type, layer: value(e, 8) ?? "(none)", raw: e };
      if (type === "POLYLINE") {
        item.vertices = [];
        for (let j = i + 1; j < blockSection.entities.length; j++) {
          const ve = blockSection.entities[j], vt = ve[0][1];
          if (vt === "VERTEX") item.vertices.push({ x: Number(value(ve, 10)), y: Number(value(ve, 20)) });
          if (vt === "SEQEND") break;
          if (["BLOCK", "POLYLINE", "ENDBLK"].includes(vt)) break;
        }
        item.closed = (Number(value(e, 70) ?? 0) & 1) === 1;
      }
      block.entities.push(item);
    }
  }
  return { pairs, sections, entities, blocks, acadver: pairs[acadIndex + 1]?.[1] ?? null, insunits: insIndex < 0 ? null : pairs[insIndex + 1]?.[1] ?? null };
}
function cyclicDelta(a, b) {
  if (a.length !== b.length || !a.length) return Infinity;
  let best = Infinity;
  for (let k = 0; k < b.length; k++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const p = b[(k + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.abs(a[i].x - p.x), Math.abs(a[i].y - p.y));
    }
    best = Math.min(best, max);
  }
  return best;
}
const result = { receiver: "CLO 2026.1.310 (r58944)", observedProfile: "DXF-AAMA import; DXF-ASTM graded-nest export/reimport; centimeters, 100%, no rotation; import notches to both outline/seam allowance at ratio; duplicate notch on seam allowance checked at export; other optional toggles off", cases: [] };
for (const c of cases) {
  const inBytes = await readFile(`${root}/${c.input}`), outBytes = await readFile(`${root}/${c.output}`);
  const src = parse(inBytes, c.name + " source"), out = parse(outBytes, c.name + " output");
  assert.equal(inBytes.byteLength, c.expectedBytes);
  assert.equal(sha(inBytes), c.expectedHash);
  assert.equal(src.sections.length, 1);
  const sourceEntities = src.sections[0].entities;
  const sourceCounts = Object.fromEntries([...new Set(sourceEntities.map((e) => e[0][1]))].sort().map((t) => [t, sourceEntities.filter((e) => e[0][1] === t).length]));
  const sourceLayers = Object.fromEntries([...new Set(src.entities.map((e) => e.layer))].sort().map((l) => [l, src.entities.filter((e) => e.layer === l).length]));
  const sourcePolys = sourceEntities.filter((e) => e[0][1] === "POLYLINE").map((e, n) => {
    const next = sourceEntities.slice(sourceEntities.indexOf(e) + 1).findIndex((x) => x[0][1] === "SEQEND");
    const vertices = sourceEntities.slice(sourceEntities.indexOf(e) + 1, sourceEntities.indexOf(e) + 2 + next).filter((x) => x[0][1] === "VERTEX").map((x) => ({ x: Number(x.find(([g]) => g === 10)?.[1]), y: Number(x.find(([g]) => g === 20)?.[1]) }));
    return { ordinal: n, layer: e.find(([g]) => g === 8)?.[1], vertices, closed: (Number(e.find(([g]) => g === 70)?.[1] ?? 0) & 1) === 1 };
  });
  assert.equal(sourcePolys.length, c.expectedOutlines, `${c.name} source outline count`);
  assert.ok(sourcePolys.every((p) => p.closed), `${c.name} source outlines closed`);
  const outputPolys = out.blocks.flatMap((b) => b.entities.filter((e) => e.type === "POLYLINE").map((e) => ({ block: b.name, layer: e.layer, vertices: e.vertices, closed: e.closed })));
  const outlineMatches = sourcePolys.map((s) => {
    const candidates = outputPolys.map((o) => ({ block: o.block, layer: o.layer, closed: o.closed, delta: cyclicDelta(s.vertices, o.vertices) })).filter((o) => Number.isFinite(o.delta)).sort((a, b) => a.delta - b.delta);
    return { sourceOrdinal: s.ordinal, sourceLayer: s.layer, vertexCount: s.vertices.length, closed: s.closed, bestDeltaCm: candidates[0]?.delta ?? null, closestCandidates: candidates.slice(0, 3), matchesWithin001cm: candidates.filter((o) => o.delta <= 0.001).map(({ block, layer, closed }) => ({ block, layer, closed })) };
  });
  const outputBlockEntities = out.blocks.map((b) => ({ name: b.name, counts: Object.fromEntries([...new Set(b.entities.map((e) => e.type))].sort().map((t) => [t, b.entities.filter((e) => e.type === t).length])), layers: Object.fromEntries([...new Set(b.entities.map((e) => e.layer))].sort().map((l) => [l, b.entities.filter((e) => e.layer === l).length])) }));
  const modelEntities = out.sections.find((s) => s.name === "ENTITIES")?.entities ?? [];
  const outputCounts = Object.fromEntries([...new Set(modelEntities.map((e) => e[0][1]))].sort().map((t) => [t, modelEntities.filter((e) => e[0][1] === t).length]));
  const allOutputCounts = Object.fromEntries([...new Set(out.entities.map((e) => e.type))].sort().map((t) => [t, out.entities.filter((e) => e.type === t).length]));
  const inserts = out.entities.filter((e) => e.type === "INSERT").map((e) => ({ block: e.raw.find(([g]) => g === 2)?.[1], layer: e.layer, x: Number(e.raw.find(([g]) => g === 10)?.[1] ?? 0), y: Number(e.raw.find(([g]) => g === 20)?.[1] ?? 0), sx: Number(e.raw.find(([g]) => g === 41)?.[1] ?? 1), sy: Number(e.raw.find(([g]) => g === 42)?.[1] ?? 1), rotation: Number(e.raw.find(([g]) => g === 50)?.[1] ?? 0) }));
  const finiteDeltas = outlineMatches.map((m) => m.bestDeltaCm).filter(Number.isFinite);
  const caseResult = { name: c.name, input: { path: `${root}/${c.input}`, bytes: inBytes.byteLength, sha256: sha(inBytes), entityCounts: sourceCounts, layerCounts: sourceLayers, sourceClosedOutlineCount: sourcePolys.filter((p) => p.closed).length, sourceMarkCounts: c.expectedMarks }, output: { path: `${root}/${c.output}`, bytes: outBytes.byteLength, sha256: sha(outBytes), acadver: out.acadver, insunits: out.insunits, sectionNames: out.sections.map((s) => s.name), modelEntityCounts: outputCounts, allSectionEntityCounts: allOutputCounts, insertCount: inserts.length, inserts, blocks: outputBlockEntities, closedOutputPolylineCount: outputPolys.filter((p) => p.closed).length, openOutputPolylineCount: outputPolys.filter((p) => !p.closed).length }, outlineMatches, outlineMatchSummary: { sourceOutlineCount: sourcePolys.length, sourceClosedOutlineCount: sourcePolys.filter((p) => p.closed).length, matchedAt001cm: outlineMatches.filter((m) => m.bestDeltaCm !== null && m.bestDeltaCm <= 0.001).length, overGate: outlineMatches.filter((m) => m.bestDeltaCm !== null && m.bestDeltaCm > 0.001).length, unmatchedDifferentVertexCount: outlineMatches.filter((m) => m.bestDeltaCm === null).length, maxFiniteBestDeltaCm: Math.max(...finiteDeltas), allExactVertexDeltasAvailable: finiteDeltas.length === outlineMatches.length, minimumMatchCountPerSource: Math.min(...outlineMatches.map((m) => m.matchesWithin001cm.length)) } };
  result.cases.push(caseResult);
}
await writeFile(`${root}/Evidence/polo-woven-roundtrip-analysis.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.cases.map((c) => ({ name: c.name, inputSha256: c.input.sha256, outputSha256: c.output.sha256, bytes: c.output.bytes, acadver: c.output.acadver, insunits: c.output.insunits, inserts: c.output.insertCount, outputPolys: c.output.closedOutputPolylineCount, sourceOutlines: c.outlineMatchSummary.sourceOutlineCount, matched: c.outlineMatchSummary.matchedAt001cm, maxDeltaCm: c.outlineMatchSummary.maxBestDeltaCm, minimumMatches: c.outlineMatchSummary.minimumMatchCountPerSource, outputTypes: c.output.modelEntityCounts, blocks: c.output.blocks })), null, 2));
