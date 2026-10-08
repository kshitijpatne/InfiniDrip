import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation";
const inputPath = `${root}/Input/polo-standard-m.dxf`;
const outputPath = `${root}/Input/polo-standard-m-lwpolyline-r2000.dxf`;
const expectedInputHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputBytes = await readFile(inputPath);
assert.equal(hash(inputBytes), expectedInputHash, "pinned S516 source bytes changed");
const source = inputBytes.toString("utf8").replace(/\r/g, "").trimEnd();
const lines = source.split("\n");
assert.equal(lines.length % 2, 0, "input has an incomplete DXF group pair");
const pairs = [];
for (let i = 0; i < lines.length; i += 2) {
  const code = Number(lines[i]);
  assert(Number.isInteger(code), `invalid group code at line ${i + 1}`);
  pairs.push([code, lines[i + 1]]);
}

function recordsFrom(values) {
  const records = [];
  for (let i = 0; i < values.length;) {
    assert.equal(values[i][0], 0, `expected entity marker at pair ${i}`);
    let end = i + 1;
    while (end < values.length && values[end][0] !== 0) end++;
    records.push(values.slice(i, end));
    i = end;
  }
  return records;
}

function field(record, code) {
  return record.find(([group]) => group === code)?.[1];
}

function polylines(records) {
  return records.map((record) => {
    if (record[0][1] !== "POLYLINE") return null;
    const vertices = [];
    let count = 0;
    for (let i = records.indexOf(record) + 1; i < records.length; i++) {
      const next = records[i];
      if (next[0][1] === "SEQEND") break;
      if (next[0][1] !== "VERTEX") continue;
      count++;
      const supported = new Set([0, 8, 10, 20, 40, 41, 42]);
      for (const [code] of next) assert(supported.has(code), `unsupported VERTEX group ${code}`);
      const vertex = { x: field(next, 10), y: field(next, 20) };
      for (const code of [40, 41, 42]) {
        const value = field(next, code);
        if (value !== undefined) vertex[code] = value;
      }
      vertices.push(vertex);
    }
    assert.equal(count, vertices.length, "vertex capture count mismatch");
    assert(vertices.length >= 2, "polyline has too few vertices");
    return {
      layer: field(record, 8) ?? "0",
      flags: Number(field(record, 70) ?? 0),
      vertices,
    };
  }).filter(Boolean);
}

const header = [
  [0, "SECTION"], [2, "HEADER"],
  [9, "$ACADVER"], [1, "AC1015"],
  [9, "$INSUNITS"], [70, "4"],
  [0, "ENDSEC"],
];
const sourceRecords = recordsFrom(pairs);
const converted = [...header];
let convertedCount = 0;
for (let index = 0; index < sourceRecords.length; index++) {
  const record = sourceRecords[index];
  const kind = record[0][1];
  if (kind !== "POLYLINE") {
    if (kind !== "VERTEX" && kind !== "SEQEND") converted.push(...record);
    continue;
  }
  const vertices = [];
  let sourceIndex = index + 1;
  while (sourceIndex < sourceRecords.length && sourceRecords[sourceIndex][0][1] !== "SEQEND") {
    const vertex = sourceRecords[sourceIndex];
    assert.equal(vertex[0][1], "VERTEX", "unexpected entity inside source polyline");
    vertices.push(vertex);
    sourceIndex++;
  }
  assert(sourceIndex < sourceRecords.length, "unterminated POLYLINE");
  const layer = field(record, 8) ?? "0";
  const flags = field(record, 70) ?? "0";
  const flattened = [
    [0, "LWPOLYLINE"], [100, "AcDbEntity"], [8, layer],
    [100, "AcDbPolyline"], [90, String(vertices.length)], [70, flags],
  ];
  for (const vertex of vertices) {
    assert.equal(field(vertex, 8) ?? layer, layer, "vertex layer differs from polyline layer");
    for (const code of [10, 20, 40, 41, 42]) {
      const value = field(vertex, code);
      if (value !== undefined) flattened.push([code, value]);
    }
  }
  converted.push(...flattened);
  convertedCount++;
  index = sourceIndex;
}

const convertedRecords = recordsFrom(converted);
const originalPolylines = polylines(sourceRecords);
const lightweight = convertedRecords.filter((record) => record[0][1] === "LWPOLYLINE");
assert.equal(originalPolylines.length, 18, "expected the 18 pinned Polo CUT/SEW outlines");
assert.equal(lightweight.length, originalPolylines.length, "polyline conversion count differs");
assert.equal(convertedCount, originalPolylines.length);

const expectedGeometry = originalPolylines.map(({ layer, flags, vertices }) => ({
  layer,
  closed: Boolean(flags & 1),
  vertices: vertices.map(({ x, y, 42: bulge }) => ({ x, y, ...(bulge === undefined ? {} : { bulge }) })),
}));
const actualGeometry = lightweight.map((record) => {
  const flags = Number(field(record, 70) ?? 0);
  const vertices = [];
  let current;
  for (const [code, value] of record) {
    if (code === 10) {
      current = { x: value };
      vertices.push(current);
    } else if (code === 20) current.y = value;
    else if (code === 42 && current) current.bulge = value;
  }
  return { layer: field(record, 8) ?? "0", closed: Boolean(flags & 1), vertices };
});
assert.deepEqual(actualGeometry, expectedGeometry, "diagnostic variant changed path identity or coordinates");

await mkdir(`${root}/Evidence`, { recursive: true });
const output = `${converted.map(([code, value]) => `${code}\n${value}`).join("\n")}\n`;
await writeFile(outputPath, output, "utf8");
const outputBytes = await readFile(outputPath);
const report = {
  sourcePath: inputPath,
  sourceBytes: inputBytes.length,
  sourceSha256: hash(inputBytes),
  outputPath,
  outputBytes: outputBytes.length,
  outputSha256: hash(outputBytes),
  acadver: "AC1015",
  insunits: 4,
  entity: "LWPOLYLINE",
  convertedClosedContours: convertedCount,
  geometryPreservedExactly: true,
  layers: [...new Set(originalPolylines.map(({ layer }) => layer))],
  outlineCountsByLayer: Object.fromEntries([...new Set(originalPolylines.map(({ layer }) => layer))]
    .map((layer) => [layer, originalPolylines.filter((entry) => entry.layer === layer).length])),
};
await writeFile(`${root}/Evidence/lwpolyline-variant-preflight.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
