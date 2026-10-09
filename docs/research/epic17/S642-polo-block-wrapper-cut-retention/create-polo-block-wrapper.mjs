import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";

const root = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const outputPath = `${root}/Input/polo-m-named-block-wrapper.dxf`;
const reportPath = `${root}/Evidence/wrapper-preflight.json`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pair = (code, value) => `${code}\n${value}\n`;

function parsePairs(text) {
  const lines = text.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  assert.equal(lines.at(-1), "", "DXF must end with a newline");
  lines.pop();
  assert.equal(lines.length % 2, 0, "DXF must contain complete group-code/value pairs");
  return Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1].trim()]);
}

function section(pairs, name) {
  for (let i = 0; i < pairs.length - 2; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION" && pairs[i + 1][0] === 2 && pairs[i + 1][1] === name) {
      const end = pairs.findIndex((item, index) => index > i + 1 && item[0] === 0 && item[1] === "ENDSEC");
      assert.notEqual(end, -1, `DXF ${name} section is unterminated`);
      return { start: i, end, body: pairs.slice(i + 2, end) };
    }
  }
  return null;
}

function sourceSectionOffsets(text, pairs, name) {
  const lines = text.replace(/^\uFEFF/u, "").split(/(?<=\n)/u);
  const starts = [];
  let offset = 0;
  for (const line of lines) { starts.push(offset); offset += line.length; }
  const row = [];
  for (const line of lines) row.push(line.replace(/\r?\n$/u, "").trim());
  for (let i = 0; i < pairs.length - 2; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION" && pairs[i + 1][1] === name) {
      const endPair = pairs.findIndex((item, index) => index > i + 1 && item[0] === 0 && item[1] === "ENDSEC");
      assert.notEqual(endPair, -1);
      const startLine = i * 2;
      const endLineExclusive = (endPair + 1) * 2;
      assert.equal(row[startLine], "0");
      return { start: starts[startLine], end: starts[endLineExclusive] ?? text.length };
    }
  }
  return null;
}

function entityAt(pairs, start) {
  assert.equal(pairs[start]?.[0], 0, "entity must begin at group code 0");
  const type = pairs[start][1];
  if (type === "POLYLINE") {
    const end = pairs.findIndex((item, index) => index > start && item[0] === 0 && item[1] === "SEQEND");
    assert.notEqual(end, -1, "POLYLINE has no SEQEND");
    return { end: end + 1, pairs: pairs.slice(start, end + 1) };
  }
  let end = start + 1;
  while (end < pairs.length && pairs[end][0] !== 0) end += 1;
  return { end, pairs: pairs.slice(start, end) };
}

function entities(pairs) {
  const out = [];
  for (let i = 0; i < pairs.length;) {
    if (pairs[i][0] !== 0) { i += 1; continue; }
    const found = entityAt(pairs, i);
    out.push(found.pairs);
    i = found.end;
  }
  return out;
}

const value = (record, code) => record.find(([candidate]) => candidate === code)?.[1];
const serialize = (pairs) => pairs.map(([code, entry]) => `${code}\n${entry}\n`).join("");
const blockName = (pieceName) => `IDR_POLO_${pieceName.normalize("NFKD").replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_|_$/gu, "").toUpperCase()}`;

const sourceBytes = await readFile(sourcePath);
assert.equal(sourceBytes.length, 24326);
assert.equal(sha256(sourceBytes), "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5", "source fixture changed");
const sourceText = sourceBytes.toString("utf8");
const sourcePairs = parsePairs(sourceText);
const sourceEntitiesSection = section(sourcePairs, "ENTITIES");
assert(sourceEntitiesSection, "pinned DXF must have ENTITIES section");
assert.equal(section(sourcePairs, "BLOCKS"), null, "pinned source unexpectedly already contains BLOCKS");
const rawEntities = entities(sourceEntitiesSection.body);
const entityGroups = [];
for (const entity of rawEntities) {
  if (value(entity, 8) === "CUT") entityGroups.push({ entities: [entity] });
  else {
    assert(entityGroups.length > 0, "an entity precedes the first CUT role");
    entityGroups.at(-1).entities.push(entity);
  }
}

const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true }, appType: "custom" });
let pieces;
try {
  const [{ POLO }, { STANDARD_M }, { blockPieces }, { exportDxf }] = await Promise.all([
    server.ssrLoadModule("/src/drafting/recipe.ts"),
    server.ssrLoadModule("/src/drafting/measurements.ts"),
    server.ssrLoadModule("/src/drafting/block.ts"),
    server.ssrLoadModule("/src/export/dxf.ts"),
  ]);
  pieces = blockPieces(POLO.draft(STANDARD_M));
  assert.equal(pieces.length, 9);
  assert.equal(entityGroups.length, pieces.length, "CUT-started source groups must match Polo piece count");
  for (let i = 0; i < pieces.length; i += 1) {
    assert.equal(entityGroups[i].entities.filter((entity) => value(entity, 8) === "CUT").length, 1, `piece group ${i} must have one CUT`);
    assert.equal(entityGroups[i].entities.filter((entity) => value(entity, 8) === "SEW").length, 1, `piece group ${i} must have one SEW`);
  }
  const exportDxfText = exportDxf(pieces, POLO.allowances);
  const sourceHeader = sourceSectionOffsets(sourceText, sourcePairs, "HEADER");
  assert(sourceHeader, "pinned fixture requires HEADER");
  assert.equal(sourceText.slice(sourceHeader.end), exportDxfText, "pinned S617 source entity body differs from current product DXF");
} finally {
  await server.close();
}

const names = pieces.map((piece) => blockName(piece.name));
assert.equal(new Set(names).size, 9, "piece-role block names must be unique");
assert(entityGroups.every((group) => group.entities.some((entity) => value(entity, 8) === "SEW")));

const blockSectionText = pair(0, "SECTION") + pair(2, "BLOCKS") + entityGroups.map((group, index) => {
  const name = names[index];
  return pair(0, "BLOCK") + pair(8, "0") + pair(2, name) + pair(70, 0) +
    pair(10, 0) + pair(20, 0) + pair(30, 0) + pair(3, name) + pair(1, "") +
    group.entities.map(serialize).join("") + pair(0, "ENDBLK") + pair(8, "0");
}).join("") + pair(0, "ENDSEC");
const insertSectionText = pair(0, "SECTION") + pair(2, "ENTITIES") + entityGroups.map((_, index) =>
  pair(0, "INSERT") + pair(8, "0") + pair(2, names[index]) + pair(10, 0) + pair(20, 0) + pair(30, 0) +
  pair(41, 1) + pair(42, 1) + pair(43, 1) + pair(50, 0),
).join("") + pair(0, "ENDSEC");

const sectionOffsets = sourceSectionOffsets(sourceText, sourcePairs, "ENTITIES");
assert(sectionOffsets, "missing source ENTITIES byte range");
const candidateText = sourceText.slice(0, sectionOffsets.start) + blockSectionText + insertSectionText + sourceText.slice(sectionOffsets.end);
const candidatePairs = parsePairs(candidateText);
const blockSection = section(candidatePairs, "BLOCKS");
const insertSection = section(candidatePairs, "ENTITIES");
assert(blockSection && insertSection);
const blockDefinitions = [];
for (let i = 0; i < blockSection.body.length;) {
  assert.equal(blockSection.body[i]?.[0], 0);
  assert.equal(blockSection.body[i]?.[1], "BLOCK");
  i += 1;
  const header = [];
  while (i < blockSection.body.length && blockSection.body[i][0] !== 0) header.push(blockSection.body[i++]);
  const headerRecord = [[0, "BLOCK"], ...header];
  const inner = [];
  while (i < blockSection.body.length && !(blockSection.body[i][0] === 0 && blockSection.body[i][1] === "ENDBLK")) {
    const parsed = entityAt(blockSection.body, i);
    inner.push(parsed.pairs);
    i = parsed.end;
  }
  assert.equal(blockSection.body[i]?.[1], "ENDBLK");
  i += 1;
  while (i < blockSection.body.length && blockSection.body[i][0] !== 0) i += 1;
  blockDefinitions.push({ name: value(headerRecord, 2), inner });
}
const inserts = entities(insertSection.body);
assert.equal(blockDefinitions.length, 9);
assert.equal(inserts.length, 9);
assert.deepEqual(blockDefinitions.map(({ name }) => name), names);
assert.deepEqual(inserts.map((insert) => value(insert, 2)), names);
for (const insert of inserts) {
  assert.equal(Number(value(insert, 10)), 0);
  assert.equal(Number(value(insert, 20)), 0);
  assert.equal(Number(value(insert, 30)), 0);
  assert.equal(Number(value(insert, 41)), 1);
  assert.equal(Number(value(insert, 42)), 1);
  assert.equal(Number(value(insert, 43)), 1);
  assert.equal(Number(value(insert, 50)), 0);
}
const expanded = blockDefinitions.flatMap(({ inner }) => inner);
assert.deepEqual(expanded.map(serialize), rawEntities.map(serialize), "block expansion must reproduce source entity payload and order exactly");
const inventory = (items) => Object.fromEntries([...items.reduce((map, record) => {
  const key = `${record[0]?.[1]}/${value(record, 8) ?? "(none)"}`;
  map.set(key, (map.get(key) ?? 0) + 1);
  return map;
}, new Map())].sort(([a], [b]) => a.localeCompare(b)));
const sourceOtherSections = sourcePairs.filter((_, i) => i < sourceEntitiesSection.start || i > sourceEntitiesSection.end);
const candidateOtherSections = candidatePairs.filter((_, i) => i < blockSection.start || (i > blockSection.end && (i < insertSection.start || i > insertSection.end)));
assert.deepEqual(candidateOtherSections, sourceOtherSections, "non-ENTITIES source sections must remain pair-identical");

await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await mkdir(`${root}/Project`, { recursive: true });
await mkdir(`${root}/Renders`, { recursive: true });
await writeFile(outputPath, candidateText, "utf8");
const report = {
  slice: "S642",
  source: { path: sourcePath, bytes: sourceBytes.length, sha256: sha256(sourceBytes) },
  candidate: { path: outputPath, bytes: Buffer.byteLength(candidateText), sha256: sha256(Buffer.from(candidateText)), acadVersion: "AC1015", unitsCode: 5, entityWrapper: "one identity BLOCK/INSERT per source piece; source internal entities embedded verbatim" },
  pieceRoles: pieces.map((piece, index) => ({ index, sourceName: piece.name, blockName: names[index] })),
  blockCount: blockDefinitions.length,
  insertCount: inserts.length,
  sourceEntityCount: rawEntities.length,
  expandedEntityCount: expanded.length,
  sourceEntityPayloadAndOrderExact: true,
  otherSectionsPairIdentical: true,
  sourceInventory: inventory(rawEntities),
  expandedInventory: inventory(expanded),
  identityTransforms: true,
  scopeLimits: ["generic DXF grouping only; no industrial-profile semantics or conformance claim", "single Polo M/default fixture; all other V03 gates remain open"],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
