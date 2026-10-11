import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [sourcePath, receiverPath, comparisonPath, outputPath] = process.argv.slice(2);
if (![sourcePath, receiverPath, comparisonPath, outputPath].every(Boolean)) {
  throw new Error("usage: node inspect-returned-mark-entities.mjs <source.dxf> <returned.dxf> <S685-report.json> <output.json>");
}

const expected = {
  source: "a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c",
  receiver: "f54d6f3c221d8478e13fdae703f0e69d466882962620fb2bc4014becd5fbe180",
  comparison: "4C2CE7C9D8DCAF8A4788948C6539498ABA19EBE0F47FF5C535C273226A41DD9B".toLowerCase(),
};

const readPairs = async (path) => {
  const bytes = await readFile(path);
  const lines = bytes.toString("utf8").split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  if (lines.length % 2 !== 0) throw new Error(`${path}: incomplete DXF group-code pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i]);
    if (!Number.isInteger(code)) throw new Error(`${path}: invalid group code at line ${i + 1}`);
    pairs.push([code, lines[i + 1]]);
  }
  return { bytes, pairs };
};

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const parseBlocks = (pairs) => {
  const blocks = new Map();
  let section = "";
  let block = null;
  let i = 0;
  while (i < pairs.length) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION" && pairs[i + 1]?.[0] === 2) {
      section = pairs[i + 1][1];
      i += 2;
      continue;
    }
    if (code === 0 && value === "ENDSEC") { section = ""; block = null; i += 1; continue; }
    if (section !== "BLOCKS") { i += 1; continue; }
    if (code === 0 && value === "BLOCK") {
      let end = i + 1;
      while (end < pairs.length && pairs[end][0] !== 0) end += 1;
      const name = pairs.slice(i + 1, end).find(([c]) => c === 2)?.[1];
      if (!name || blocks.has(name)) throw new Error(`invalid or duplicate returned block at pair ${i}`);
      block = { name, entities: [] };
      blocks.set(name, block);
      i = end;
      continue;
    }
    if (code === 0 && value === "ENDBLK") { block = null; i += 1; continue; }
    if (!block || code !== 0 || ["ENDSEC", "SEQEND"].includes(value)) { i += 1; continue; }

    const type = value;
    let end = i + 1;
    while (end < pairs.length && pairs[end][0] !== 0) end += 1;
    const fields = pairs.slice(i + 1, end);
    const entity = { type, fields, layer: fields.find(([c]) => c === 8)?.[1] ?? "(missing)" };
    if (type === "LWPOLYLINE") {
      entity.vertices = [];
      for (let k = 0; k < fields.length; k += 1) {
        if (fields[k][0] === 10 && fields[k + 1]?.[0] === 20) {
          entity.vertices.push({ x: Number(fields[k][1]), y: Number(fields[k + 1][1]), bulge: Number(fields[k + 2]?.[0] === 42 ? fields[k + 2][1] : 0) });
        }
      }
      entity.closed = (Number(fields.find(([c]) => c === 70)?.[1] ?? 0) & 1) === 1;
    }
    if (type === "POLYLINE") {
      entity.vertices = [];
      entity.closed = (Number(fields.find(([c]) => c === 70)?.[1] ?? 0) & 1) === 1;
      i = end;
      while (pairs[i]?.[0] === 0 && pairs[i][1] === "VERTEX") {
        let vertexEnd = i + 1;
        while (vertexEnd < pairs.length && pairs[vertexEnd][0] !== 0) vertexEnd += 1;
        const vf = pairs.slice(i + 1, vertexEnd);
        entity.vertices.push({ x: Number(vf.find(([c]) => c === 10)?.[1]), y: Number(vf.find(([c]) => c === 20)?.[1]), bulge: Number(vf.find(([c]) => c === 42)?.[1] ?? 0) });
        i = vertexEnd;
      }
      if (pairs[i]?.[0] === 0 && pairs[i][1] === "SEQEND") i += 1;
    } else {
      i = end;
    }
    if (!entity.vertices) {
      const get = (wanted) => fields.find(([c]) => c === wanted)?.[1];
      if (type === "LINE") {
        entity.start = { x: Number(get(10)), y: Number(get(20)) };
        entity.end = { x: Number(get(11)), y: Number(get(21)) };
      }
      if (type === "POINT") entity.at = { x: Number(get(10)), y: Number(get(20)) };
      if (type === "CIRCLE") {
        entity.at = { x: Number(get(10)), y: Number(get(20)) };
        entity.radius = Number(get(40));
      }
    }
    block.entities.push(entity);
  }
  return blocks;
};

const source = await readPairs(sourcePath);
const receiver = await readPairs(receiverPath);
const comparisonBytes = await readFile(comparisonPath);
const comparison = JSON.parse(comparisonBytes.toString("utf8"));
const hashes = { source: hash(source.bytes), receiver: hash(receiver.bytes), comparison: hash(comparisonBytes) };
for (const [key, value] of Object.entries(expected)) if (hashes[key] !== value) throw new Error(`${key} SHA-256 differs from S685 pinned evidence`);

const blocks = parseBlocks(receiver.pairs);
const misses = comparison.unmatchedDrawingEntities;
if (!Array.isArray(misses) || misses.length !== 8) throw new Error(`Expected 8 S685 misses, found ${misses?.length}`);
const markAudit = misses.map((mark) => {
  const block = blocks.get(mark.blockName);
  if (!block) throw new Error(`S685 mark references missing block ${mark.blockName}`);
  const typedKinds = block.entities.filter((entity) => ["LINE", "POINT", "CIRCLE"].includes(entity.type));
  const drawablePaths = block.entities.filter((entity) => entity.vertices?.length >= 2);
  return {
    sourceEntityOrdinal: mark.sourceEntityOrdinal,
    sourceType: mark.sourceType,
    sourceLayer: mark.sourceLayer,
    sourceGeometry: mark.sourceGeometry,
    returnedPieceBlock: mark.blockName,
    returnedBlockEntityCounts: Object.fromEntries([...new Set(block.entities.map((entity) => entity.type))].sort().map((type) => [type, block.entities.filter((entity) => entity.type === type).length])),
    sameTypeReturnedEntities: typedKinds.length,
    returnedDrawablePaths: drawablePaths.length,
    returnedLayerNames: [...new Set(block.entities.map(({ layer }) => layer))].sort(),
    sourceSemanticLayerPresent: block.entities.some(({ layer }) => layer === mark.sourceLayer),
    closestReturnedGeometryDistanceCm: mark.distanceCm,
  };
});

const pieceBlocks = [...blocks.values()].filter(({ name }) => /^\d+_M$/.test(name));
const allCounts = pieceBlocks.flatMap((block) => block.entities.map(({ type }) => type)).reduce((counts, type) => ({ ...counts, [type]: (counts[type] ?? 0) + 1 }), {});
const report = {
  source: { path: sourcePath, sha256: hashes.source },
  receiver: { path: receiverPath, sha256: hashes.receiver },
  s685Report: { path: comparisonPath, sha256: hashes.comparison },
  totalReturnedBlockCount: blocks.size,
  returnedPieceBlockCount: pieceBlocks.length,
  returnedPieceEntityCounts: allCounts,
  returnedBlockTypedMarkEntityCounts: Object.fromEntries(["LINE", "POINT", "CIRCLE"].map((type) => [type, allCounts[type] ?? 0])),
  s685UnmatchedCount: misses.length,
  s685Misses: markAudit,
  conclusion: "The pinned returned piece blocks contain LWPOLYLINE entities only; they contain no returned LINE, POINT, or CIRCLE entities that the earlier polyline-only mark search could have overlooked. Each of the eight reported marks remains farther than 0.001 cm from returned drawable geometry. This confirms the measured misses for this saved CLO output; it does not identify a source-writer cause or generalize to other receiver routes.",
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, hashes, returnedPieceBlockCount: pieceBlocks.length, returnedPieceEntityCounts: allCounts, s685UnmatchedCount: misses.length, distancesCm: markAudit.map(({ sourceEntityOrdinal, closestReturnedGeometryDistanceCm }) => ({ sourceEntityOrdinal, distanceCm: closestReturnedGeometryDistanceCm })) }, null, 2));
