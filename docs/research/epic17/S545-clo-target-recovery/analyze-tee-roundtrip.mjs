import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S544-aama-three-recipe-roundtrip";
const toleranceCm = 0.001;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF must contain complete group-code/value pairs");
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    assert.match(lines[index].trim(), /^\d+$/, `invalid group code at line ${index + 1}`);
    pairs.push([Number(lines[index].trim()), lines[index + 1]]);
  }
  const value = (entity, group) => entity.find(([code]) => code === group)?.[1];
  const sections = [];
  let section;
  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index][0] === 0 && pairs[index][1] === "SECTION") {
      section = { name: pairs[index + 1]?.[1], entities: [] };
      sections.push(section);
      index += 1;
      continue;
    }
    if (pairs[index][0] === 0 && pairs[index][1] === "ENDSEC") { section = undefined; continue; }
    if (!section || pairs[index][0] !== 0) continue;
    const start = index;
    index += 1;
    while (index < pairs.length && pairs[index][0] !== 0) index += 1;
    section.entities.push(pairs.slice(start, index));
    index -= 1;
  }
  const entitiesFor = (items) => items.map((raw) => ({ type: raw[0][1], layer: value(raw, 8) ?? "(none)", raw }));
  const readVertices = (entity, following) => {
    if (entity[0][1] === "LWPOLYLINE") {
      const vertices = [];
      let x;
      for (const [code, raw] of entity) {
        if (code === 10) x = Number(raw);
        if (code === 20 && x !== undefined) { vertices.push({ x, y: Number(raw) }); x = undefined; }
      }
      return { vertices, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
    }
    if (entity[0][1] !== "POLYLINE") return null;
    const vertices = [];
    for (const candidate of following) {
      const vertex = candidate.raw ?? candidate;
      if (!vertex?.[0]) continue;
      if (vertex[0][1] === "SEQEND") break;
      if (vertex[0][1] === "VERTEX") vertices.push({ x: Number(value(vertex, 10)), y: Number(value(vertex, 20)) });
    }
    return { vertices, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  };
  const allEntities = sections.flatMap((part) => entitiesFor(part.entities));
  const blockSection = sections.find((part) => part.name === "BLOCKS");
  const blocks = [];
  let block;
  for (const raw of blockSection?.entities ?? []) {
    const type = raw[0][1];
    if (type === "BLOCK") { block = { name: value(raw, 2), entities: [] }; blocks.push(block); continue; }
    if (type === "ENDBLK") { block = undefined; continue; }
    if (block) block.entities.push(...entitiesFor([raw]));
  }
  const contours = [];
  for (const current of blocks) {
    for (let index = 0; index < current.entities.length; index += 1) {
      const entity = current.entities[index];
      if (!["POLYLINE", "LWPOLYLINE"].includes(entity.type)) continue;
      const parsed = readVertices(entity.raw, current.entities.slice(index + 1));
      if (parsed) contours.push({ block: current.name, layer: entity.layer, ...parsed });
    }
  }
  return {
    sections,
    allEntities,
    blocks,
    contours,
    inserts: allEntities.filter((entity) => entity.type === "INSERT").map((entity) => ({ block: value(entity.raw, 2), layer: entity.layer })),
    readVertices,
  };
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

function directedVertexToPathDistance(source, target) {
  let maximum = 0;
  for (const point of source) {
    let nearest = Infinity;
    for (let index = 0; index < target.length; index += 1) {
      nearest = Math.min(nearest, pointToSegmentDistance(point, target[index], target[(index + 1) % target.length]));
    }
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}

function symmetricVertexToPathDistanceCm(source, target) {
  if (source.length === 0 || target.length === 0) return Infinity;
  return Math.max(directedVertexToPathDistance(source, target), directedVertexToPathDistance(target, source));
}

const recipes = [
  { name: "Tee", input: "tee-standard-m.dxf", output: "tee-aama" },
  { name: "Polo", input: "polo-standard-m.dxf", output: "polo-aama" },
  { name: "Woven", input: "woven-shirt-standard-m.dxf", output: "woven-aama" },
];
const results = {
  receiver: "CLO 2026.1.310 (r58944)",
  size: "M",
  option: "default",
  profile: "DXF-AAMA, centimeters, 100%, no rotation; import Draw Curve Points on; export Graded Nest, selected patterns only, duplicate notches on seam allowance",
  toleranceCm,
  recipes: [],
};
for (const recipe of recipes) {
  const inputBytes = await readFile(`${root}/Input/${recipe.input}`);
  const input = parse(inputBytes);
  const sourceEntities = input.sections.flatMap((part) => part.entities);
  const sourceOutlines = [];
  for (let index = 0; index < sourceEntities.length; index += 1) {
    const entity = sourceEntities[index];
    const geometry = input.readVertices(entity, sourceEntities.slice(index + 1));
    if (geometry?.closed) sourceOutlines.push({ ordinal: sourceOutlines.length, type: entity[0][1], layer: entity.find(([code]) => code === 8)?.[1] ?? "(none)", ...geometry });
  }
  assert.ok(sourceOutlines.length > 0, `expected closed source outlines for ${recipe.name}`);
  const recipeResult = {
    recipe: recipe.name,
    input: { file: recipe.input, bytes: inputBytes.byteLength, sha256: sha256(inputBytes), sourceSections: input.sections.map((part) => part.name), sourceEntityCounts: Object.fromEntries([...new Set(input.allEntities.map((entity) => entity.type))].sort().map((type) => [type, input.allEntities.filter((entity) => entity.type === type).length])), sourceOutlineCount: sourceOutlines.length, sourceOutlines: sourceOutlines.map(({ ordinal, type, layer, vertices }) => ({ ordinal, type, layer, vertexCount: vertices.length })) },
    generations: [],
  };
  for (const generation of [1, 2]) {
    const file = `${recipe.output}-gen${generation}.dxf`;
    const bytes = await readFile(`${root}/Output/${file}`);
    const output = parse(bytes);
    const matches = sourceOutlines.map((source) => {
      const candidates = output.contours.map((candidate) => ({ block: candidate.block, layer: candidate.layer, closed: candidate.closed, vertexCount: candidate.vertices.length, symmetricVertexToPathDistanceCm: symmetricVertexToPathDistanceCm(source.vertices, candidate.vertices) })).filter((candidate) => Number.isFinite(candidate.symmetricVertexToPathDistanceCm)).sort((a, b) => a.symmetricVertexToPathDistanceCm - b.symmetricVertexToPathDistanceCm);
      return { sourceOrdinal: source.ordinal, sourceLayer: source.layer, sourceVertexCount: source.vertices.length, best: candidates[0] ?? null, candidatesWithinGate: candidates.filter((candidate) => candidate.symmetricVertexToPathDistanceCm <= toleranceCm).length, nearestCandidates: candidates.slice(0, 3) };
    });
    recipeResult.generations.push({
      generation, file, bytes: bytes.byteLength, sha256: sha256(bytes), sections: output.sections.map((part) => part.name), insertCount: output.inserts.length, inserts: output.inserts, blockCount: output.blocks.length, blockNames: output.blocks.map((current) => current.name), closedBlockContourCount: output.contours.filter((contour) => contour.closed).length,
      matchSummary: { matchedWithin001cm: matches.filter((match) => match.best && match.best.symmetricVertexToPathDistanceCm <= toleranceCm).length, overGate: matches.filter((match) => match.best && match.best.symmetricVertexToPathDistanceCm > toleranceCm).length, missing: matches.filter((match) => !match.best).length, ambiguous: matches.filter((match) => match.candidatesWithinGate > 1).length, maxBestSymmetricVertexToPathDistanceCm: Math.max(...matches.map((match) => match.best?.symmetricVertexToPathDistanceCm ?? 0)), vertexCountChanged: matches.filter((match) => match.best && match.best.vertexCount !== match.sourceVertexCount).length }, matches,
    });
  }
  results.recipes.push(recipeResult);
}
await writeFile(`${root}/Evidence/three-recipe-roundtrip-analysis.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ recipes: results.recipes.map(({ recipe, input, generations }) => ({ recipe, input: input.file, sourceOutlineCount: input.sourceOutlineCount, generations: generations.map(({ generation, file, bytes, sha256: hash, insertCount, blockCount, closedBlockContourCount, matchSummary }) => ({ generation, file, bytes, sha256: hash, insertCount, blockCount, closedBlockContourCount, matchSummary })) })) }, null, 2));
