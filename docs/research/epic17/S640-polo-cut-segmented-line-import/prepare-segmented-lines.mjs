import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputSource = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const root = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import";
const inputCopy = `${root}/Input/polo-standard-m-cm-units-header.dxf`;
const derivativePath = `${root}/Output/polo-m-five-cut-contours-as-lines.dxf`;
const manifestPath = `${root}/Evidence/derivative-manifest.json`;
const expectedInputHash = "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5";
const toleranceCm = 0.001;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const targets = [
  { piece: "back", point: ["37.489", "74.514"] },
  { piece: "outer collar stand", point: ["139.277", "66.459"] },
  { piece: "inner collar stand", point: ["156.921", "66.459"] },
  { piece: "upper pointed collar", point: ["174.564", "66.459"] },
  { piece: "under pointed collar", point: ["194.164", "66.459"] },
];

function parsePairs(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0, "DXF group/value pairs must be complete");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trimEnd()]);
  assert(pairs.every(([code]) => Number.isInteger(code)), "DXF contains invalid group code");
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
    const record = [pairs[i++]];
    while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
    if (record[0][1] === "POLYLINE") {
      while (pairs[i]?.[0] === 0 && pairs[i]?.[1] === "VERTEX") {
        record.push(pairs[i++]);
        while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
      }
      assert.equal(pairs[i]?.[1], "SEQEND", "classic POLYLINE is missing SEQEND");
      record.push(pairs[i++]);
      while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
    }
    section.records.push(record);
  }
  return sections;
}

const value = (record, code) => record.find(([group]) => group === code)?.[1];

function readPolyline(record) {
  assert.equal(record[0]?.[1], "POLYLINE");
  assert.equal(value(record, 8), "CUT");
  const flags = Number(value(record, 70) ?? 0);
  assert(flags & 1, "target CUT polyline must be closed");
  const allowedHeaderCodes = new Set([0, 8, 66, 70, 10, 20, 30]);
  const firstVertex = record.findIndex(([code, data]) => code === 0 && data === "VERTEX");
  assert(firstVertex > 0, "CUT polyline has no vertices");
  const header = record.slice(0, firstVertex);
  assert(header.every(([code]) => allowedHeaderCodes.has(code)), "CUT polyline header metadata needs manual review");
  const points = [];
  for (let i = firstVertex; i < record.length && record[i][1] !== "SEQEND";) {
    assert.equal(record[i]?.[1], "VERTEX", "unexpected classic POLYLINE child");
    i++;
    const fields = [];
    while (i < record.length && record[i][0] !== 0) fields.push(record[i++]);
    assert(!fields.some(([code]) => [40, 41, 42].includes(code)), "vertex width/bulge is unsupported");
    const x = fields.find(([code]) => code === 10)?.[1];
    const y = fields.find(([code]) => code === 20)?.[1];
    assert(x !== undefined && y !== undefined, "vertex is missing X/Y coordinates");
    assert(fields.every(([code, data]) => [8, 10, 20, 30].includes(code) && (code !== 8 || data === "CUT")), "vertex contains non-coordinate metadata");
    points.push({ x, y, z: fields.find(([code]) => code === 30)?.[1] });
  }
  assert(points.length >= 3);
  return { flags, points };
}

const sourceBytes = await readFile(inputSource);
assert.equal(sourceBytes.length, 24_326, "S617 input length changed");
assert.equal(sha256(sourceBytes), expectedInputHash, "S617 source hash changed");
const sourcePairs = parsePairs(sourceBytes);
const sourceSections = parseSections(sourcePairs);
const entities = sourceSections.find(({ name }) => name === "ENTITIES");
assert(entities, "ENTITIES section missing");
const cutRecords = entities.records.filter((record) => record[0]?.[1] === "POLYLINE" && value(record, 8) === "CUT");
assert.equal(cutRecords.length, 9, "expected nine source CUT polylines");

const mapping = new Map();
for (const target of targets) {
  const matches = cutRecords.flatMap((record, ordinal) => {
    const geometry = readPolyline(record);
    const index = geometry.points.findIndex((point) => point.x === target.point[0] && point.y === target.point[1]);
    return index < 0 ? [] : [{ record, ordinal, geometry, vertexIndex: index }];
  });
  assert.equal(matches.length, 1, `source corner for ${target.piece} must uniquely identify one CUT contour`);
  mapping.set(matches[0].record, { ...target, ...matches[0] });
}
assert.equal(mapping.size, 5);

const newRecords = new Map();
const replacements = new Map();
const changed = [];
for (const match of mapping.values()) {
  const { points, flags } = match.geometry;
  const header = match.record.slice(0, match.record.findIndex(([code, data]) => code === 0 && data === "VERTEX"));
  const unexpectedHeader = header.filter(([code]) => ![0, 8, 66, 70, 10, 20, 30].includes(code));
  assert.equal(unexpectedHeader.length, 0, `${match.piece} header has unreviewed fields`);
  const generated = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    assert(point.x !== next.x || point.y !== next.y, `${match.piece} contains a zero-length edge`);
    const line = [[0, "LINE"], [8, "CUT"], [10, point.x], [20, point.y]];
    if (point.z !== undefined) line.push([30, point.z]);
    line.push([11, next.x], [21, next.y]);
    if (next.z !== undefined) line.push([31, next.z]);
    return line;
  });
  assert.equal(generated.length, points.length, "one closing LINE required per source vertex");
  assert(generated.every((line) => value(line, 8) === "CUT"));
  newRecords.set(match.record, generated);
  replacements.set(JSON.stringify(match.record), generated);
  changed.push({
    piece: match.piece,
    sourceCutOrdinal: match.ordinal,
    sourceVertexCount: points.length,
    sourceTargetVertexIndex: match.vertexIndex,
    sourceCorner: targetPoint(match),
    closed: Boolean(flags & 1),
    outputLineCount: generated.length,
  });
}

function targetPoint(match) {
  const point = match.geometry.points[match.vertexIndex];
  return { x: point.x, y: point.y };
}

const derivativePairList = [];
let activeSection = null;
for (let i = 0; i < sourcePairs.length;) {
  if (sourcePairs[i][0] === 0 && sourcePairs[i][1] === "SECTION") {
    activeSection = sourcePairs[i + 1]?.[1];
    derivativePairList.push(sourcePairs[i], sourcePairs[i + 1]);
    i += 2;
    continue;
  }
  if (sourcePairs[i][0] === 0 && sourcePairs[i][1] === "ENDSEC") {
    derivativePairList.push(sourcePairs[i++]);
    activeSection = null;
    continue;
  }
  if (activeSection !== "ENTITIES" || sourcePairs[i][0] !== 0 || sourcePairs[i][1] !== "POLYLINE") {
    derivativePairList.push(sourcePairs[i++]);
    continue;
  }
  const start = i++;
  while (i < sourcePairs.length && sourcePairs[i][0] !== 0) i++;
  while (sourcePairs[i]?.[0] === 0 && sourcePairs[i]?.[1] === "VERTEX") {
    i++;
    while (i < sourcePairs.length && sourcePairs[i][0] !== 0) i++;
  }
  assert.equal(sourcePairs[i]?.[1], "SEQEND", "classic POLYLINE missing SEQEND during rewrite");
  i++;
  while (i < sourcePairs.length && sourcePairs[i][0] !== 0) i++;
  const record = sourcePairs.slice(start, i);
  const generated = replacements.get(JSON.stringify(record));
  if (generated) derivativePairList.push(...generated.flatMap((line) => line));
  else derivativePairList.push(...record);
}
assert.equal(replacements.size, 5);
const derivativeBytes = Buffer.from(derivativePairList.flatMap(([code, data]) => [String(code), data]).join("\n") + "\n", "utf8");
const parsedDerivativePairs = parsePairs(derivativeBytes);
const derivativeParsed = parseSections(parsedDerivativePairs);
const derivativeEntities = derivativeParsed.find(({ name }) => name === "ENTITIES");
assert.equal(derivativeEntities.records.filter((record) => record[0]?.[1] === "POLYLINE" && value(record, 8) === "CUT").length, 4);
assert.equal(derivativeEntities.records.filter((record) => record[0]?.[1] === "LINE" && value(record, 8) === "CUT").length, changed.reduce((sum, item) => sum + item.outputLineCount, 0));
assert.equal(derivativeEntities.records.filter((record) => record[0]?.[1] === "POLYLINE" && value(record, 8) === "SEW").length, 9);
for (const section of sourceSections) {
  const derivative = derivativeParsed.find((candidate) => candidate.name === section.name);
  assert(derivative, `derivative is missing ${section.name}`);
  const expectedRecords = section.records.flatMap((record) => newRecords.has(record) ? newRecords.get(record) : [record]);
  assert.deepEqual(derivative.records, expectedRecords, `${section.name} has an unrelated entity/group-value change`);
}

await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Output`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await writeFile(inputCopy, sourceBytes);
await writeFile(derivativePath, derivativeBytes);
const manifest = {
  slice: "S640",
  input: { path: inputCopy, bytes: sourceBytes.length, sha256: sha256(sourceBytes) },
  derivative: { path: derivativePath, bytes: derivativeBytes.length, sha256: sha256(derivativeBytes) },
  controlledVariable: "Entity representation for exactly five closed CUT contours: coordinate-identical POLYLINE vertex chains to connected LINE entities on CUT, including the closing segment.",
  conversion: changed,
  sourceCornerCoordinatesAndPointOrderPreserved: true,
  sourceUnitHeaderPreserved: true,
  allOtherGroupValueRecordsPreserved: true,
  originalInputRetained: true,
  toleranceCm,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
