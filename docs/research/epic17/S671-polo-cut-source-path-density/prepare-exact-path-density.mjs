import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S671-polo-cut-source-path-density";
const inputPath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const outputPath = `${root}/Input/polo-standard-m-cm-units-header-exact-path-density.dxf`;
const manifestPath = `${root}/Evidence/derivative-preflight.json`;
const expectedInputSha256 = "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5";
const maxSegmentCm = 0.05;
const sha = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();

function parsePairs(bytes) {
  const text = bytes.toString("utf8").replace(/^\uFEFF/u, "");
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.replace(/\r\n/gu, "\n").replace(/\r/gu, "\n").trimEnd().split("\n");
  assert.equal(lines.length % 2, 0, "DXF needs complete group-code/value pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => ({ code: lines[i * 2].trim(), value: lines[i * 2 + 1] }));
  return { pairs, newline };
}

function entities(pairs) {
  let section = false;
  const result = [];
  for (let i = 0; i < pairs.length;) {
    if (pairs[i].code === "0" && pairs[i].value === "SECTION" && pairs[i + 1]?.value === "ENTITIES") {
      section = true;
      i += 2;
      continue;
    }
    if (section && pairs[i].code === "0" && pairs[i].value === "ENDSEC") break;
    if (!section || pairs[i].code !== "0") { i++; continue; }
    const start = i;
    const type = pairs[i].value;
    i++;
    if (type === "POLYLINE") {
      while (i < pairs.length && pairs[i].code !== "0") i++;
      while (pairs[i]?.code === "0" && pairs[i].value === "VERTEX") {
        i++;
        while (i < pairs.length && pairs[i].code !== "0") i++;
      }
      if (pairs[i]?.code === "0" && pairs[i].value === "SEQEND") {
        i++;
        while (i < pairs.length && pairs[i].code !== "0") i++;
      }
    } else {
      while (i < pairs.length && pairs[i].code !== "0") i++;
    }
    result.push({ type, start, end: i, pairs: pairs.slice(start, i) });
  }
  return result;
}

function vertexRecords(record) {
  const result = [];
  for (let i = 0; i < record.pairs.length;) {
    if (record.pairs[i].code !== "0" || record.pairs[i].value !== "VERTEX") { i++; continue; }
    const start = i++;
    while (i < record.pairs.length && record.pairs[i].code !== "0") i++;
    const pairs = record.pairs.slice(start, i);
    const x = pairs.find((pair) => pair.code === "10");
    const y = pairs.find((pair) => pair.code === "20");
    assert(x && y, "CUT vertex must have X and Y coordinates");
    result.push({ pairs, x: Number(x.value), y: Number(y.value), xPair: x, yPair: y });
  }
  return result;
}

const input = await readFile(inputPath);
assert.equal(sha(input), expectedInputSha256, "the pinned S617 input changed");
const { pairs: original, newline } = parsePairs(input);
const records = entities(original);
const cuts = records.filter((record) => record.type === "POLYLINE" && record.pairs.some((pair) => pair.code === "8" && pair.value === "CUT"));
assert.equal(cuts.length, 9, "expected nine Polo CUT contours");

const targets = new Map([[1, 13], [5, 14], [6, 14], [7, 14], [8, 14]]);
const output = [];
const modifications = [];
let cursor = 0;
for (const record of records) {
  while (cursor < record.start) output.push(original[cursor++]);
  const cutOrdinal = record.type === "POLYLINE" && record.pairs.some((pair) => pair.code === "8" && pair.value === "CUT")
    ? cuts.indexOf(record) : -1;
  if (!targets.has(cutOrdinal)) {
    output.push(...record.pairs);
    cursor = record.end;
    continue;
  }

  const vertices = vertexRecords(record);
  const k = targets.get(cutOrdinal);
  assert(k + 1 < vertices.length, `CUT ${cutOrdinal} target segment is unavailable`);
  const a = vertices[k];
  const b = vertices[k + 1];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  assert(length > maxSegmentCm, `CUT ${cutOrdinal} adjacent segment does not need subdivision`);
  const steps = Math.ceil(length / maxSegmentCm);
  const inserted = [];
  for (let j = 1; j < steps; j++) {
    const t = j / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const cross = Math.abs((x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x));
    const deviation = cross / length;
    assert(deviation < 1e-10, "inserted vertex must lie on the exact source segment");
    inserted.push([
      { code: "0", value: "VERTEX" }, { code: "8", value: "CUT" },
      { code: "10", value: x.toFixed(12) }, { code: "20", value: y.toFixed(12) },
    ]);
  }

  const rebuilt = [];
  let vertexIndex = 0;
  for (let i = 0; i < record.pairs.length;) {
    if (record.pairs[i].code === "0" && record.pairs[i].value === "VERTEX") {
      const start = i++;
      while (i < record.pairs.length && record.pairs[i].code !== "0") i++;
      rebuilt.push(...record.pairs.slice(start, i));
      if (vertexIndex === k) rebuilt.push(...inserted.flat());
      vertexIndex++;
    } else rebuilt.push(record.pairs[i++]);
  }
  assert.equal(vertexIndex, vertices.length, "rebuilt CUT must retain each original vertex");
  output.push(...rebuilt);
  cursor = record.end;
  modifications.push({ cutOrdinal, sourceVertexIndex: k, sourceShortEdgeCm: Math.hypot(a.x - vertices[k - 1].x, a.y - vertices[k - 1].y), subdividedSourceSegmentCm: length, subdivisions: steps, insertedVertices: inserted.length, maxSubsegmentCm: length / steps });
}
while (cursor < original.length) output.push(original[cursor++]);

// The derivative must contain every original group/value pair, in order.
let originalIndex = 0;
for (const pair of output) {
  if (originalIndex < original.length && pair.code === original[originalIndex].code && pair.value === original[originalIndex].value) originalIndex++;
}
assert.equal(originalIndex, original.length, "all original DXF group/value pairs must remain in order");

const outputText = output.map((pair) => `${pair.code}${newline}${pair.value}`).join(newline) + newline;
const bytes = Buffer.from(outputText, "utf8");
await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await writeFile(outputPath, bytes);

const manifest = {
  slice: 671,
  hypothesis: "collinear subdivision of the single long segment after each of five source CUT vertices; preserve path and original records",
  source: { path: inputPath, bytes: input.length, sha256: sha(input) },
  derivative: { path: outputPath, bytes: bytes.length, sha256: sha(bytes) },
  maxSubsegmentCm: maxSegmentCm,
  targets: modifications,
  proof: {
    expectedCutContours: 9,
    changedCutContours: modifications.length,
    originalGroupValuePairsPreservedInOrder: original.length,
    exactCollinearityMaxDeviationCm: "<1e-10",
    originalVerticesPreserved: true,
    pathResidualCm: 0,
    noRecipeOrProductGeometrySourceChanged: true,
    noOtherSourceRecordChanged: true,
  },
  sourceBound: "Only the five pinned source CUT polylines receive new VERTEX records. Every old pair is an unchanged ordered subsequence; no source CUT vertex is deleted or moved.",
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
