import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S671-polo-cut-source-path-density";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const derivativePath = `${root}/Input/polo-standard-m-cm-units-header-exact-path-density.dxf`;
const outputPath = `${root}/Evidence/independent-preflight.json`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const parse = (bytes) => {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").replace(/\r\n/gu, "\n").trimEnd().split("\n");
  assert.equal(lines.length % 2, 0);
  return Array.from({ length: lines.length / 2 }, (_, i) => ({ code: lines[2 * i].trim(), value: lines[2 * i + 1] }));
};
function records(pairs) {
  let inEntities = false;
  const list = [];
  for (let i = 0; i < pairs.length;) {
    if (pairs[i].code === "0" && pairs[i].value === "SECTION" && pairs[i + 1]?.value === "ENTITIES") { inEntities = true; i += 2; continue; }
    if (inEntities && pairs[i].code === "0" && pairs[i].value === "ENDSEC") break;
    if (!inEntities || pairs[i].code !== "0") { i++; continue; }
    const start = i++;
    const type = pairs[start].value;
    if (type === "POLYLINE") {
      while (i < pairs.length && pairs[i].code !== "0") i++;
      while (pairs[i]?.code === "0" && pairs[i].value === "VERTEX") { i++; while (i < pairs.length && pairs[i].code !== "0") i++; }
      if (pairs[i]?.code === "0" && pairs[i].value === "SEQEND") { i++; while (i < pairs.length && pairs[i].code !== "0") i++; }
    } else while (i < pairs.length && pairs[i].code !== "0") i++;
    list.push({ type, pairs: pairs.slice(start, i) });
  }
  return list;
}
function vertices(record) {
  const out = [];
  for (let i = 0; i < record.pairs.length;) {
    if (record.pairs[i].code !== "0" || record.pairs[i].value !== "VERTEX") { i++; continue; }
    i++;
    let x, y;
    while (i < record.pairs.length && record.pairs[i].code !== "0") {
      if (record.pairs[i].code === "10") x = Number(record.pairs[i].value);
      if (record.pairs[i].code === "20") y = Number(record.pairs[i].value);
      i++;
    }
    out.push({ x, y });
  }
  return out;
}
const [sourceBytes, derivativeBytes] = await Promise.all([readFile(sourcePath), readFile(derivativePath)]);
const sourcePairs = parse(sourceBytes);
const derivativePairs = parse(derivativeBytes);
const sourceRecords = records(sourcePairs);
const derivativeRecords = records(derivativePairs);
const isCut = (record) => record.type === "POLYLINE" && record.pairs.some((pair) => pair.code === "8" && pair.value === "CUT");
const sourceCuts = sourceRecords.filter(isCut);
const derivativeCuts = derivativeRecords.filter(isCut);
assert.equal(sourceCuts.length, 9);
assert.equal(derivativeCuts.length, 9);
assert.equal(sourceRecords.length, derivativeRecords.length);

const targetVertices = new Map([[1, 13], [5, 14], [6, 14], [7, 14], [8, 14]]);
const changes = [];
for (let i = 0; i < sourceRecords.length; i++) {
  const before = sourceRecords[i];
  const after = derivativeRecords[i];
  assert.equal(before.type, after.type);
  const ordinal = isCut(before) ? sourceCuts.indexOf(before) : -1;
  if (!targetVertices.has(ordinal)) {
    assert.deepEqual(after.pairs, before.pairs, `non-target record ${i} must be identical`);
    continue;
  }
  const src = vertices(before);
  const dst = vertices(after);
  const k = targetVertices.get(ordinal);
  assert.equal(dst.length - src.length, ordinal === 1 ? 24 : 188, `unexpected vertex count change for CUT ${ordinal}`);
  let j = 0;
  for (const point of dst) {
    if (j < src.length && point.x === src[j].x && point.y === src[j].y) j++;
  }
  assert.equal(j, src.length, `all original points remain ordered for CUT ${ordinal}`);
  const a = src[k];
  const b = src[k + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const maxInsertedDeviation = dst.filter((point) => {
    const t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (len * len);
    return t > 1e-10 && t < 1 - 1e-10;
  }).reduce((max, point) => Math.max(max, Math.abs((point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x)) / len), 0);
  assert(maxInsertedDeviation < 1e-9);
  changes.push({ cutOrdinal: ordinal, sourceVertices: src.length, derivativeVertices: dst.length, originalVertexIndex: k, sourceSegmentCm: len, insertedVertices: dst.length - src.length, collinearityDeviationCm: maxInsertedDeviation });
}

// All source file records outside the five modified entities must be unchanged.
const subsequence = [];
let cursor = 0;
for (const pair of derivativePairs) if (cursor < sourcePairs.length && pair.code === sourcePairs[cursor].code && pair.value === sourcePairs[cursor].value) { subsequence.push(pair); cursor++; }
assert.equal(cursor, sourcePairs.length, "every original pair remains in order");
assert.equal(sourcePairs.filter((pair) => pair.code === "9" && pair.value === "$INSUNITS").length, derivativePairs.filter((pair) => pair.code === "9" && pair.value === "$INSUNITS").length);
const report = {
  slice: 671,
  source: { sha256: sha(sourceBytes), bytes: sourceBytes.length },
  derivative: { sha256: sha(derivativeBytes), bytes: derivativeBytes.length },
  sourceGroupValuePairs: sourcePairs.length,
  derivativeGroupValuePairs: derivativePairs.length,
  originalPairsPreservedInOrder: cursor === sourcePairs.length,
  sourceRecords: sourceRecords.length,
  derivativeRecords: derivativeRecords.length,
  originalCUTContours: sourceCuts.length,
  derivativeCUTContours: derivativeCuts.length,
  modifiedCUTs: changes,
  exactPathPreservation: "Added coordinates are collinear subdivisions of existing straight edges; no original path vertex moves or is removed.",
  decision: "PREPARED_FOR_ONE_RECEIVER_IMPORT; this report is only source/fixture proof, not a CLO result.",
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
