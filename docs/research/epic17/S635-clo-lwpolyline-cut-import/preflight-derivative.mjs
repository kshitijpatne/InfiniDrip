import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S635-cut-lwpolyline-import";
const sourcePath = `${root}/Input/polo-standard-m-cm-units-header.dxf`;
const derivativePath = `${root}/Output/polo-cm-header-cut-lwpolyline.dxf`;
const manifestPath = `${root}/Evidence/derivative-manifest.json`;
const expectedSource = "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5";
const expectedDerivative = "606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
function pairs(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0);
  return Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trimEnd()]);
}
function sections(inputPairs) {
  const result = [];
  let section = null;
  for (let i = 0; i < inputPairs.length;) {
    if (inputPairs[i][0] === 0 && inputPairs[i][1] === "SECTION") {
      section = { name: inputPairs[i + 1]?.[1], records: [] }; result.push(section); i += 2; continue;
    }
    if (inputPairs[i][0] === 0 && inputPairs[i][1] === "ENDSEC") { section = null; i++; continue; }
    if (!section || inputPairs[i][0] !== 0) { i++; continue; }
    const start = i++;
    while (i < inputPairs.length && inputPairs[i][0] !== 0) i++;
    const record = inputPairs.slice(start, i);
    if (record[0][1] === "POLYLINE") {
      while (i < inputPairs.length && inputPairs[i][0] === 0 && inputPairs[i][1] === "VERTEX") {
        const v = i++;
        while (i < inputPairs.length && inputPairs[i][0] !== 0) i++;
        record.push(...inputPairs.slice(v, i));
      }
      assert.equal(inputPairs[i]?.[1], "SEQEND"); record.push(inputPairs[i++]);
    }
    section.records.push(record);
  }
  return result;
}
const value = (record, code) => record.find(([group]) => group === code)?.[1];
function cutPoints(record, type) {
  const points = [];
  if (type === "LWPOLYLINE") {
    for (let i = 1; i < record.length; i++) if (record[i][0] === 10) points.push([record[i][1], record[i + 1]?.[1]]);
  } else {
    for (let i = 1; i < record.length; i++) {
      if (record[i][0] !== 0 || record[i][1] !== "VERTEX") continue;
      let x, y;
      for (let j = i + 1; j < record.length && record[j][0] !== 0; j++) {
        if (record[j][0] === 10) x = record[j][1];
        if (record[j][0] === 20) y = record[j][1];
      }
      points.push([x, y]);
    }
  }
  return points;
}

const sourceBytes = await readFile(sourcePath), derivativeBytes = await readFile(derivativePath);
assert.equal(sha(sourceBytes), expectedSource);
assert.equal(sha(derivativeBytes), expectedDerivative);
assert.equal(sha(await readFile("C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf")), expectedSource);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assert.equal(manifest.input.sha256, expectedSource);
assert.equal(manifest.derivative.sha256, expectedDerivative);
assert.equal(manifest.changedEntities.length, 9);
assert(manifest.changedEntities.every((e) => e.oldType === "POLYLINE" && e.newType === "LWPOLYLINE" && e.layer === "CUT" && e.closed));
const originalSections = sections(pairs(sourceBytes)), derivativeSections = sections(pairs(derivativeBytes));
assert.deepEqual(originalSections.map((s) => s.name), derivativeSections.map((s) => s.name));
for (let si = 0; si < originalSections.length; si++) {
  const a = originalSections[si], b = derivativeSections[si];
  if (a.name !== "ENTITIES") { assert.deepEqual(b.records, a.records, `${a.name} section changed`); continue; }
  assert.equal(a.records.length, b.records.length, "ENTITIES count/order changed");
  let converted = 0;
  for (let i = 0; i < a.records.length; i++) {
    const old = a.records[i], next = b.records[i];
    if (old[0]?.[1] === "POLYLINE" && value(old, 8) === "CUT") {
      assert.equal(next[0]?.[1], "LWPOLYLINE");
      assert.equal(value(next, 8), "CUT");
      assert.equal(Number(value(old, 70)) & 1, 1);
      assert.equal(Number(value(next, 70)) & 1, 1);
      assert.deepEqual(cutPoints(next, "LWPOLYLINE"), cutPoints(old, "POLYLINE"), `CUT ${converted} coordinates/order changed`);
      converted++;
    } else assert.deepEqual(next, old, `non-CUT entity ${i} changed`);
  }
  assert.equal(converted, 9);
}
const header = pairs(sourceBytes);
assert(header.some(([code, v], i) => code === 9 && v === "$ACADVER" && header[i + 1]?.[1] === "AC1015"));
assert(header.some(([code, v], i) => code === 9 && v === "$INSUNITS" && header[i + 1]?.[1] === "5"));
console.log("S635 derivative preflight passed: nine CUT entity-type changes only; all CUT vertices, order, closure, header, units, sections, SEW, marks, and other entity records preserved.");
