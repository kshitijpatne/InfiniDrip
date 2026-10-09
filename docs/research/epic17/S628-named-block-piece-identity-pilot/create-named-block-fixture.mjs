import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S628-named-block-piece-identity-pilot";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S627-woven-zero-vent-source-repair/Input/woven-shirt-sideVentDepth-min.dxf";
const manifestPath = "C:/G04-CLO-DXF-Exchange/S627-woven-zero-vent-source-repair/Evidence/fixture-manifest.json";
const outputPath = `${root}/Input/woven-zero-vent-named-piece-blocks.dxf`;
const reportPath = `${root}/Evidence/named-block-preflight.json`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pair = (code, value) => `${code}\n${value}\n`;

function parsePairs(text) {
  const rows = text.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/u);
  assert.equal(rows.length % 2, 0, "DXF must contain complete group-code/value pairs");
  return Array.from({ length: rows.length / 2 }, (_, index) => [Number(rows[index * 2].trim()), rows[index * 2 + 1].trim()]);
}

function section(pairs, name) {
  for (let i = 0; i < pairs.length - 2; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION" && pairs[i + 1][0] === 2 && pairs[i + 1][1] === name) {
      const end = pairs.findIndex((item, index) => index > i + 1 && item[0] === 0 && item[1] === "ENDSEC");
      assert.notEqual(end, -1, `DXF ${name} section is unterminated`);
      return pairs.slice(i + 2, end);
    }
  }
  return [];
}

function entityAt(pairs, start) {
  assert.equal(pairs[start]?.[0], 0, "entity must begin at group code 0");
  const type = pairs[start][1];
  if (type === "POLYLINE") {
    const end = pairs.findIndex((item, index) => index > start && item[0] === 0 && item[1] === "SEQEND");
    assert.notEqual(end, -1, "POLYLINE has no SEQEND");
    return { type, end: end + 1, pairs: pairs.slice(start, end + 1) };
  }
  let end = start + 1;
  while (end < pairs.length && pairs[end][0] !== 0) end += 1;
  return { type, end, pairs: pairs.slice(start, end) };
}

function entities(pairs) {
  const out = [];
  for (let index = 0; index < pairs.length;) {
    if (pairs[index][0] !== 0) { index += 1; continue; }
    const entity = entityAt(pairs, index);
    out.push(entity.pairs);
    index = entity.end;
  }
  return out;
}

function value(entity, code) {
  return entity.find(([candidate]) => candidate === code)?.[1];
}

function serialize(pairs) {
  return pairs.map(([code, item]) => `${code}\n${item}\n`).join("");
}

function nameFor(pieceName) {
  return `IDR_WOVEN_${pieceName.normalize("NFKD").replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_|_$/gu, "").toUpperCase()}`;
}

const sourceBytes = await readFile(sourcePath);
const sourceText = sourceBytes.toString("utf8");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const fixture = manifest.cases.find((item) => item.caseId === "woven-shirt-sideVentDepth-min");
assert(fixture, "pinned S627 Woven zero-vent manifest row missing");
assert.equal(fixture.sha256.toUpperCase(), sha256(sourceBytes), "source fixture differs from S627 hash");
assert.equal(fixture.pieceCount, 12);
const sourceEntities = entities(section(parsePairs(sourceText), "ENTITIES"));
const groups = [];
for (const entity of sourceEntities) {
  if (value(entity, 8) === "CUT") groups.push({ entities: [entity] });
  else {
    assert(groups.length > 0, "entity encountered before first CUT piece");
    groups.at(-1).entities.push(entity);
  }
}
assert.equal(groups.length, fixture.pieceNames.length, "piece-name/entity group count mismatch");
for (let index = 0; index < groups.length; index += 1) {
  const group = groups[index];
  assert.equal(group.entities.filter((entity) => value(entity, 8) === "CUT").length, 1, `piece ${index} must contain one CUT entity`);
  assert.equal(group.entities.filter((entity) => value(entity, 8) === "SEW").length, 1, `piece ${index} must contain one SEW entity`);
  group.name = nameFor(fixture.pieceNames[index]);
}
const names = groups.map((group) => group.name);
assert.equal(new Set(names).size, 12, "sanitized block names must be unique");

const blocks = groups.map(({ name, entities: grouped }) =>
  pair(0, "BLOCK") + pair(8, "0") + pair(2, name) + pair(70, 0) +
  pair(10, 0) + pair(20, 0) + pair(30, 0) + pair(3, name) + pair(1, "") +
  grouped.map(serialize).join("") + pair(0, "ENDBLK") + pair(8, "0"),
).join("");
const inserts = groups.map(({ name }) =>
  pair(0, "INSERT") + pair(8, "0") + pair(2, name) + pair(10, 0) + pair(20, 0) + pair(30, 0) +
  pair(41, 1) + pair(42, 1) + pair(43, 1) + pair(50, 0),
).join("");
const candidate = pair(0, "SECTION") + pair(2, "BLOCKS") + blocks + pair(0, "ENDSEC") +
  pair(0, "SECTION") + pair(2, "ENTITIES") + inserts + pair(0, "ENDSEC") + pair(0, "EOF");

const candidatePairs = parsePairs(candidate);
const blockSection = section(candidatePairs, "BLOCKS");
const blockDefs = [];
for (let i = 0; i < blockSection.length;) {
  assert.equal(blockSection[i][0], 0);
  assert.equal(blockSection[i][1], "BLOCK");
  const headerStart = i;
  i += 1;
  while (i < blockSection.length && blockSection[i][0] !== 0) i += 1;
  const header = blockSection.slice(headerStart, i);
  const blockName = value(header, 2);
  const body = [];
  while (i < blockSection.length && !(blockSection[i][0] === 0 && blockSection[i][1] === "ENDBLK")) {
    const parsed = entityAt(blockSection, i);
    body.push(parsed.pairs);
    i = parsed.end;
  }
  assert.equal(blockSection[i]?.[1], "ENDBLK");
  i += 1;
  while (i < blockSection.length && blockSection[i][0] !== 0) i += 1;
  blockDefs.push({ name: blockName, header, body });
}
const candidateInserts = entities(section(candidatePairs, "ENTITIES"));
assert.equal(blockDefs.length, 12);
assert.equal(candidateInserts.length, 12);
const blockMap = new Map(blockDefs.map((item) => [item.name, item]));
const expanded = candidateInserts.flatMap((insert, index) => {
  const blockName = value(insert, 2);
  assert.equal(blockName, names[index], "INSERT order/name mismatch");
  assert.equal(Number(value(insert, 10)), 0);
  assert.equal(Number(value(insert, 20)), 0);
  assert.equal(Number(value(insert, 41) ?? 1), 1);
  assert.equal(Number(value(insert, 42) ?? 1), 1);
  assert.equal(Number(value(insert, 50) ?? 0), 0);
  const block = blockMap.get(blockName);
  assert(block, `undefined block reference ${blockName}`);
  return block.body;
});
assert.equal(expanded.length, sourceEntities.length);
assert.deepEqual(expanded.map(serialize), sourceEntities.map(serialize), "expanding blocks changed source entity payload/order");

function inventory(entityList) {
  const out = {};
  for (const entity of entityList) {
    const type = entity[0]?.[1];
    const layer = value(entity, 8) ?? "(none)";
    const key = `${type}/${layer}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}
const report = {
  slice: "S628",
  source: { path: sourcePath, sha256: sha256(sourceBytes), bytes: sourceBytes.length },
  candidate: { path: outputPath, bytes: Buffer.byteLength(candidate), sha256: sha256(Buffer.from(candidate)), format: "R12 BLOCKS/INSERT; original piece entities embedded verbatim; unitless" },
  sourcePieceNames: fixture.pieceNames,
  blockNames: names,
  definitionCount: blockDefs.length,
  insertCount: candidateInserts.length,
  sourceEntityCount: sourceEntities.length,
  expandedEntityCount: expanded.length,
  geometryAndEntityPayloadExact: true,
  sourceInventory: inventory(sourceEntities),
  expandedInventory: inventory(expanded),
  insertTransforms: "all (0,0,0), scale (1,1,1), rotation 0",
  warnings: ["This tests generic piece-role names only; no product revision ID, apparel semantics, grade, or mark identity is asserted."],
};
await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await mkdir(`${root}/Renders`, { recursive: true });
await writeFile(outputPath, candidate, "utf8");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
