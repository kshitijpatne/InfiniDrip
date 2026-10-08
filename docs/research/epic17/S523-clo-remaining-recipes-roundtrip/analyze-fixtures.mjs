import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip";
const manifest = JSON.parse(await readFile(`${root}/Evidence/fixture-manifest.json`, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const entities = sections.flatMap((part) => part.entities.map((raw) => ({
    type: raw[0][1], layer: value(raw, 8) ?? "(none)", raw,
  })));
  const blockSection = sections.find((part) => part.name === "BLOCKS");
  const blocks = [];
  let block;
  for (let i = 0; i < (blockSection?.entities.length ?? 0); i++) {
    const entity = blockSection.entities[i];
    const type = entity[0][1];
    if (type === "BLOCK") {
      block = { name: value(entity, 2), entities: [] };
      blocks.push(block);
    } else if (type === "ENDBLK") block = undefined;
    else if (block) {
      const item = { type, layer: value(entity, 8) ?? "(none)", raw: entity };
      if (type === "POLYLINE") {
        item.vertices = [];
        for (let j = i + 1; j < blockSection.entities.length; j++) {
          const vertexEntity = blockSection.entities[j];
          const vertexType = vertexEntity[0][1];
          if (vertexType === "VERTEX") item.vertices.push({ x: Number(value(vertexEntity, 10)), y: Number(value(vertexEntity, 20)) });
          if (vertexType === "SEQEND") break;
          if (["BLOCK", "POLYLINE", "ENDBLK"].includes(vertexType)) break;
        }
        item.closed = (Number(value(entity, 70) ?? 0) & 1) === 1;
      }
      block.entities.push(item);
    }
  }
  return {
    pairs, sections, entities, blocks,
    acadver: pairs[pairs.findIndex(([group, value]) => group === 9 && value === "$ACADVER") + 1]?.[1] ?? null,
    insunits: (() => { const index = pairs.findIndex(([group, value]) => group === 9 && value === "$INSUNITS"); return index < 0 ? null : pairs[index + 1]?.[1] ?? null; })(),
  };
}

function cyclicDelta(source, receiver) {
  if (source.length !== receiver.length || !source.length) return Infinity;
  let best = Infinity;
  for (let offset = 0; offset < receiver.length; offset++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < source.length; i++) {
      const point = receiver[(offset + direction * i + receiver.length * 2) % receiver.length];
      max = Math.max(max, Math.abs(source[i].x - point.x), Math.abs(source[i].y - point.y));
    }
    best = Math.min(best, max);
  }
  return best;
}

const results = { receiver: "CLO 2026.1.310 (r58944)", import: "DXF-AAMA, centimeters, 100%, no rotation; Import/Add; Draw Curve Points checked; curve optimization and non-grading-point removal off", export: "DXF-AAMA, Graded Nest, centimeters, 100%, no rotation; Duplicate Notch on Seam Allowance checked; selected patterns only", toleranceCm: 0.001, cases: [] };
for (const fixture of manifest.fixtures) {
  const inputBytes = await readFile(`${root}/Input/${fixture.file}`);
  assert.equal(sha(inputBytes), fixture.sha256, `${fixture.recipe} input hash`);
  assert.equal(inputBytes.byteLength, fixture.bytes, `${fixture.recipe} input size`);
  const source = parse(inputBytes, `${fixture.recipe} source`);
  assert.equal(source.sections.length, 1, `${fixture.recipe} legacy source sections`);
  const sourceEntities = source.sections[0].entities;
  const sourcePolylines = [];
  for (let i = 0; i < sourceEntities.length; i++) {
    const entity = sourceEntities[i];
    if (entity[0][1] !== "POLYLINE") continue;
    const vertices = [];
    for (let j = i + 1; j < sourceEntities.length && sourceEntities[j][0][1] !== "SEQEND"; j++) {
      if (sourceEntities[j][0][1] === "VERTEX") vertices.push({ x: Number(sourceEntities[j].find(([g]) => g === 10)?.[1]), y: Number(sourceEntities[j].find(([g]) => g === 20)?.[1]) });
    }
    sourcePolylines.push({ ordinal: sourcePolylines.length, layer: entity.find(([g]) => g === 8)?.[1] ?? "(none)", vertices, closed: (Number(entity.find(([g]) => g === 70)?.[1] ?? 0) & 1) === 1 });
  }
  assert.equal(sourcePolylines.length, fixture.closedCutSewOutlineCount);
  assert.ok(sourcePolylines.every((polyline) => polyline.closed));
  for (const generation of [1, 2]) {
    const outputFile = `${fixture.recipe}-aama-roundtrip-0${generation}.dxf`;
    const outputBytes = await readFile(`${root}/Output/${outputFile}`);
    const output = parse(outputBytes, `${fixture.recipe} CLO generation ${generation} output`);
    const outputPolylines = output.blocks.flatMap((part) => part.entities.filter((entity) => entity.type === "POLYLINE").map((entity) => ({ block: part.name, layer: entity.layer, vertices: entity.vertices, closed: entity.closed })));
    const matches = sourcePolylines.map((polyline) => {
      const candidates = outputPolylines.map((candidate) => ({ block: candidate.block, layer: candidate.layer, closed: candidate.closed, vertexCount: candidate.vertices.length, deltaCm: cyclicDelta(polyline.vertices, candidate.vertices) })).filter((candidate) => Number.isFinite(candidate.deltaCm)).sort((a, b) => a.deltaCm - b.deltaCm);
      return { sourceOrdinal: polyline.ordinal, sourceLayer: polyline.layer, vertexCount: polyline.vertices.length, closed: polyline.closed, bestDeltaCm: candidates[0]?.deltaCm ?? null, closestCandidates: candidates.slice(0, 3), matchCountWithinGate: candidates.filter((candidate) => candidate.deltaCm <= results.toleranceCm).length };
    });
    const outputInserts = output.entities.filter((entity) => entity.type === "INSERT").map((entity) => ({ block: entity.raw.find(([g]) => g === 2)?.[1], layer: entity.layer }));
    const modelEntities = output.sections.find((part) => part.name === "ENTITIES")?.entities ?? [];
    results.cases.push({
      recipe: fixture.recipe, generation, size: fixture.size, options: fixture.options,
      input: { file: fixture.file, bytes: inputBytes.byteLength, sha256: sha(inputBytes), pieces: fixture.pieceNames, entityCounts: fixture.entityCounts, layers: fixture.layerNames, sourceOutlineCount: sourcePolylines.length },
      output: { file: outputFile, bytes: outputBytes.byteLength, sha256: sha(outputBytes), acadver: output.acadver, insunits: output.insunits, sections: output.sections.map((part) => part.name), insertCount: outputInserts.length, inserts: outputInserts, blockCount: output.blocks.length, blockPolylineCount: outputPolylines.length, blockNames: output.blocks.map((part) => part.name), modelEntityCounts: Object.fromEntries([...new Set(modelEntities.map((entity) => entity[0][1]))].sort().map((type) => [type, modelEntities.filter((entity) => entity[0][1] === type).length])) },
      matches,
      summary: { sourceOutlineCount: sourcePolylines.length, matchedAt001cm: matches.filter((match) => match.bestDeltaCm !== null && match.bestDeltaCm <= results.toleranceCm).length, overGate: matches.filter((match) => match.bestDeltaCm !== null && match.bestDeltaCm > results.toleranceCm).length, differentVertexCount: matches.filter((match) => match.bestDeltaCm === null).length, maxBestDeltaCm: Math.max(...matches.map((match) => match.bestDeltaCm ?? 0)), ambiguousAtGate: matches.filter((match) => match.matchCountWithinGate > 1).length },
    });
  }
}
await writeFile(`${root}/Evidence/remaining-recipes-roundtrip-analysis.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.cases.map(({ recipe, generation, input, output, summary }) => ({ recipe, generation, sourceOutlines: summary.sourceOutlineCount, inserts: output.insertCount, outputBlocks: output.blockCount, outputPolylines: output.blockPolylineCount, matchedAt001cm: summary.matchedAt001cm, overGate: summary.overGate, differentVertexCount: summary.differentVertexCount, maxBestDeltaCm: summary.maxBestDeltaCm, outputBytes: output.bytes, outputSha256: output.sha256 })), null, 2));
