import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const root = "C:/G04-CLO-DXF-Exchange/S635-cut-lwpolyline-import";
const input = `${root}/Input/polo-standard-m-cm-units-header.dxf`;
const output = `${root}/Output/polo-cm-header-cut-lwpolyline.dxf`;
const manifestPath = `${root}/Evidence/derivative-manifest.json`;
const sourceShaExpected = "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parsePairs(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0, "DXF group/value pairs must be complete");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trimEnd()]);
  assert(pairs.every(([code]) => Number.isInteger(code)), "DXF contains an invalid group code");
  return pairs;
}

function parseSections(pairs) {
  const sections = [];
  let section = null;
  for (let i = 0; i < pairs.length;) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], records: [] };
      assert(section.name, "SECTION is missing its name");
      sections.push(section);
      i += 2;
      continue;
    }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = null; i++; continue; }
    if (!section || pairs[i][0] !== 0) { i++; continue; }
    const start = i++;
    while (i < pairs.length && pairs[i][0] !== 0) i++;
    const record = pairs.slice(start, i);
    if (record[0][1] === "POLYLINE") {
      while (i < pairs.length && pairs[i][0] === 0 && pairs[i][1] === "VERTEX") {
        const vertexStart = i++;
        while (i < pairs.length && pairs[i][0] !== 0) i++;
        record.push(...pairs.slice(vertexStart, i));
      }
      assert.equal(pairs[i]?.[1], "SEQEND", "classic POLYLINE missing SEQEND");
      record.push(...pairs.slice(i, i + 1));
      i++;
      while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
    }
    section.records.push(record);
  }
  return sections;
}

const value = (record, code) => record.find(([group]) => group === code)?.[1];
const writeRecord = (record) => record.flatMap(([code, data]) => [String(code), data]).join("\n") + "\n";
function extractCutPoints(record) {
  assert.equal(record[0]?.[1], "POLYLINE");
  const flags = Number(value(record, 70) ?? 0);
  assert(Boolean(flags & 1), "all Polo CUT contours must be closed");
  let inVertices = false;
  const header = record.filter(([code, data]) => {
    if (code === 0 && data === "VERTEX") { inVertices = true; return false; }
    if (code === 0 && data === "SEQEND") return false;
    return !inVertices && code !== 0 && code !== 8 && code !== 66 && code !== 70;
  });
  assert.equal(header.length, 0, "unexpected classic CUT polyline metadata requires review");
  const points = [];
  for (let i = 1; i < record.length; i++) {
    if (record[i][0] !== 0 || record[i][1] !== "VERTEX") continue;
    const vertex = [];
    for (i += 1; i < record.length && record[i][0] !== 0; i++) vertex.push(record[i]);
    i--;
    assert(!vertex.some(([code]) => code === 42 || code === 41), "bulge/width requires separate encoding review");
    const x = vertex.find(([code]) => code === 10)?.[1];
    const y = vertex.find(([code]) => code === 20)?.[1];
    assert(x !== undefined && y !== undefined, "CUT vertex is missing X or Y");
    points.push([x, y]);
  }
  return { flags, points };
}

const sourceBytes = await readFile(source);
assert.equal(sha(sourceBytes), sourceShaExpected, "S617 source hash changed");
const inputPairs = parsePairs(sourceBytes);
const inputSections = parseSections(inputPairs);
const entities = inputSections.find((s) => s.name === "ENTITIES");
assert(entities, "ENTITIES section missing");
const cutIndices = entities.records.flatMap((record, index) =>
  record[0]?.[1] === "POLYLINE" && value(record, 8) === "CUT" ? [index] : []);
assert.equal(cutIndices.length, 9, "expected exactly nine classic CUT polylines");

const changeMap = new Map();
const changed = cutIndices.map((index) => {
  const record = entities.records[index];
  const { flags, points } = extractCutPoints(record);
  assert(points.length >= 3, "closed CUT outline must contain at least three vertices");
  const newRecord = [[0, "LWPOLYLINE"], [8, "CUT"], [90, String(points.length)], [70, String(flags)]];
  for (const [x, y] of points) newRecord.push([10, x], [20, y]);
  changeMap.set(index, newRecord);
  return { entityOrder: index, oldType: "POLYLINE", newType: "LWPOLYLINE", layer: "CUT", closed: true, vertexCount: points.length };
});

const derivativePairs = [];
let currentSection = null;
let cutOrdinal = 0;
for (let i = 0; i < inputPairs.length;) {
  if (inputPairs[i][0] === 0 && inputPairs[i][1] === "SECTION") {
    currentSection = inputPairs[i + 1]?.[1];
    derivativePairs.push(inputPairs[i], inputPairs[i + 1]);
    i += 2;
    continue;
  }
  if (inputPairs[i][0] === 0 && inputPairs[i][1] === "ENDSEC") { derivativePairs.push(inputPairs[i++]); currentSection = null; continue; }
  if (currentSection === "ENTITIES" && inputPairs[i][0] === 0 && inputPairs[i][1] === "POLYLINE") {
    const recordStart = i;
    i++;
    while (i < inputPairs.length && inputPairs[i][0] !== 0) i++;
    const header = inputPairs.slice(recordStart, i);
    const layer = value(header, 8);
    if (layer === "CUT") {
      while (i < inputPairs.length && inputPairs[i][0] === 0 && inputPairs[i][1] === "VERTEX") {
        i++;
        while (i < inputPairs.length && inputPairs[i][0] !== 0) i++;
      }
      assert.equal(inputPairs[i]?.[1], "SEQEND");
      i++;
      const sourceCutAtIndex = cutIndices[cutOrdinal++];
      assert(sourceCutAtIndex !== undefined, "more CUTs than expected");
      derivativePairs.push(...changeMap.get(sourceCutAtIndex));
      continue;
    }
    derivativePairs.push(...header);
    while (i < inputPairs.length && inputPairs[i][0] === 0 && inputPairs[i][1] === "VERTEX") {
      const vertexStart = i++;
      while (i < inputPairs.length && inputPairs[i][0] !== 0) i++;
      derivativePairs.push(...inputPairs.slice(vertexStart, i));
    }
    if (inputPairs[i]?.[0] === 0 && inputPairs[i][1] === "SEQEND") derivativePairs.push(inputPairs[i++]);
    continue;
  }
  derivativePairs.push(inputPairs[i++]);
}
assert.equal(cutOrdinal, 9, "not all nine CUT polylines were converted");
assert.equal(derivativePairs.filter((pair) => pair[0] === 0 && pair[1] === "LWPOLYLINE").length, 9);
const derivativeBytes = Buffer.from(derivativePairs.flatMap(([code, data]) => [String(code), data]).join("\n") + "\n", "utf8");
const derivativeSections = parseSections(derivativePairs);
const derivativeEntities = derivativeSections.find((s) => s.name === "ENTITIES");
const derivativeCuts = derivativeEntities.records.filter((record) => record[0]?.[1] === "LWPOLYLINE" && value(record, 8) === "CUT");
assert.equal(derivativeCuts.length, 9);
for (let index = 0; index < cutIndices.length; index++) {
  const before = extractCutPoints(entities.records[cutIndices[index]]);
  const after = derivativeCuts[index];
  const points = [];
  for (let i = 1; i < after.length; i++) {
    if (after[i][0] === 10) points.push([after[i][1], after[i + 1]?.[1]]);
  }
  assert.equal(Number(value(after, 70)) & 1, 1);
  assert.deepEqual(points, before.points, `CUT ${index} coordinates/order changed`);
}
await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Output`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await writeFile(input, sourceBytes);
await writeFile(output, derivativeBytes);
const manifest = {
  slice: "S635",
  input: { path: input, sha256: sha(sourceBytes), bytes: sourceBytes.length },
  derivative: { path: output, sha256: sha(derivativeBytes), bytes: derivativeBytes.length },
  controlledVariable: "Entity type for nine closed CUT contours: POLYLINE with VERTEX/SEQEND records to LWPOLYLINE with equivalent ordered X/Y coordinates.",
  changedEntities: changed,
  exactCutCoordinatesPreserved: true,
  noBulgesOrWidths: true,
  inputFileRetained: true,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
