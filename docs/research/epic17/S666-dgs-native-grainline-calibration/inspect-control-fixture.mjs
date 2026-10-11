import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S666-dgs-native-grainline-calibration";
const inputPath = `${root}/Input/control-rectangle-20x30cm-r14.dxf`;
const evidencePath = `${root}/Evidence/S666-source-inspection.json`;
const bytes = await readFile(inputPath);
const text = bytes.toString("ascii");
const rows = text.trimEnd().split(/\r?\n/);
assert.equal(rows.length % 2, 0, "DXF group codes and values must pair");
const pairs = [];
for (let index = 0; index < rows.length; index += 2) {
  const code = Number(rows[index]);
  assert.ok(Number.isInteger(code), `DXF group code must be integer: ${rows[index]}`);
  pairs.push([code, rows[index + 1]]);
}

let section = "";
let activeBlock = "";
let entity = null;
const entities = [];
const blocks = new Map();
for (let index = 0; index < pairs.length; index += 1) {
  const [code, value] = pairs[index];
  if (code === 0 && value === "SECTION" && pairs[index + 1]?.[0] === 2) {
    section = pairs[index + 1][1];
    index += 1;
    continue;
  }
  if (code === 0 && value === "ENDSEC") {
    if (entity) entities.push(entity);
    entity = null;
    section = "";
    continue;
  }
  if (section === "BLOCKS" && code === 0 && value === "BLOCK") {
    if (entity) entities.push(entity);
    entity = { kind: "BLOCK", values: [] };
    continue;
  }
  if (section === "BLOCKS" && entity?.kind === "BLOCK" && code === 2) {
    activeBlock = value;
    entity.name = value;
    continue;
  }
  if (section === "BLOCKS" && code === 0 && value === "ENDBLK") {
    if (entity) blocks.set(activeBlock, entities.splice(0));
    entity = { kind: "ENDBLK", values: [] };
    continue;
  }
  if ((section === "BLOCKS" || section === "ENTITIES") && code === 0) {
    if (entity && entity.kind !== "BLOCK" && entity.kind !== "ENDBLK") entities.push(entity);
    entity = { kind: value, section, values: [] };
  } else if (entity) {
    entity.values.push([code, value]);
  }
}
if (entity && entity.kind !== "ENDBLK") entities.push(entity);

const insertCount = entities.filter((item) => item.kind === "INSERT").length;
const polylines = blocks.get("IDR_CAL_CONTROL") ?? [];
const outline = polylines.find((item) => item.kind === "POLYLINE");
assert.equal(insertCount, 1);
assert.ok(outline, "the named calibration block must contain the CUT polyline");
assert.equal(outline.values.filter(([code]) => code === 10 || code === 20).length, 2);
const vertices = polylines.filter((item) => item.kind === "VERTEX");
assert.equal(vertices.length, 4);
const coordinates = vertices.map((vertex) => Object.fromEntries(vertex.values.filter(([code]) => [10, 20, 30].includes(code))));
assert.deepEqual(coordinates.map(({ 10: x, 20: y }) => [Number(x), Number(y)]), [[0, 0], [20, 0], [20, 30], [0, 30]]);
assert.ok(outline.values.some(([code, value]) => code === 70 && value === "1"), "CUT polyline must be closed");
assert.equal(entities.filter((item) => item.kind === "LINE" || item.kind === "LWPOLYLINE").length, 0);
assert.equal(pairs.some(([code, value]) => code === 1000 && /grainline/i.test(value)), true, "piece identity label includes the ordinary word grainline");
assert.equal(pairs.some(([code, value]) => code === 1000 && /^GRAINLINE$/i.test(value)), false);

const report = {
  sourcePath: inputPath,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
  entityMap: { modelSpaceInsert: insertCount, namedBlock: "IDR_CAL_CONTROL", cutPolylines: 1, cutVertices: vertices.length, explicitLineEntities: 0, explicitGrainlineEntities: 0 },
  sourceCutCoordinatesCm: coordinates.map(({ 10: x, 20: y }) => [Number(x), Number(y)]),
  xdataContainsWordGrainlineOnlyAsPieceIdentifier: true,
  parserOutcome: "PASS: source has one closed 20 x 30 cm CUT polyline and zero explicit grainline entities",
  receiverOutcome: "FAIL: DGS AutoCAD/Pattern import reported one outside-border grainline warning and rendered a centered two-way marker; source-to-receiver grainline semantics remain unproven",
};
await mkdir(`${root}/Evidence`, { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
