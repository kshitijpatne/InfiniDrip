import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S624-opencadstudio-desktop-r14-receiver";
const paths = {
  source: `${root}/synthetic-rectangle-r12.dxf`,
  output: `${root}/synthetic-rectangle-r14.dxf`,
  reopened: `${root}/synthetic-rectangle-r14-reopened.dxf`,
  executable: `${root}/OpenCADStudio-v2026.40.1-windows-x86_64-portable.exe`,
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const numeric = (value) => Number(value.trim());

function parse(file, text) {
  const lines = text.replace(/\r\n/g, "\n").trimEnd().split("\n");
  assert.equal(lines.length % 2, 0, `${file}: complete code/value pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${file}: numeric group code`);
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const sections = [];
  let active = null;
  let pendingSection = false;
  let header = [];
  let entities = [];
  let current = null;
  let vertex = null;
  const finishEntity = () => {
    if (vertex && current?.type === "POLYLINE") current.vertices.push(vertex);
    vertex = null;
    if (current && ["LINE", "POLYLINE"].includes(current.type)) entities.push(current);
    current = null;
  };
  for (const [code, value] of pairs) {
    if (code === 0 && value === "SECTION") { pendingSection = true; continue; }
    if (pendingSection && code === 2) {
      active = value;
      if (active === "ENTITIES") { entities = []; current = null; }
      pendingSection = false;
      continue;
    }
    if (active === "HEADER") header.push([code, value]);
    if (active !== "ENTITIES") {
      if (code === 0 && value === "ENDSEC") active = null;
      continue;
    }
    if (code === 0 && value === "ENDSEC") { finishEntity(); active = null; continue; }
    if (code === 0 && value === "VERTEX" && current?.type === "POLYLINE") {
      if (vertex) current.vertices.push(vertex);
      vertex = { x: null, y: null };
      continue;
    }
    if (code === 0 && value === "SEQEND" && current?.type === "POLYLINE") {
      finishEntity();
      continue;
    }
    if (code === 0) {
      finishEntity();
      if (value === "LINE") current = { type: value, layer: null, start: {}, end: {} };
      if (value === "POLYLINE") current = { type: value, layer: null, flags: 0, vertices: [] };
      continue;
    }
    if (!current) continue;
    if (code === 8) current.layer = value;
    if (current.type === "POLYLINE") {
      if (!vertex && code === 70) current.flags = numeric(value);
      if (vertex && code === 10) vertex.x = numeric(value);
      if (vertex && code === 20) vertex.y = numeric(value);
    }
    if (current.type === "LINE") {
      if (code === 10) current.start.x = numeric(value);
      if (code === 20) current.start.y = numeric(value);
      if (code === 11) current.end.x = numeric(value);
      if (code === 21) current.end.y = numeric(value);
    }
  }
  finishEntity();
  let version = null;
  let units = null;
  for (let i = 0; i < header.length; i += 1) {
    if (header[i][0] === 9 && header[i][1] === "$ACADVER" && header[i + 1]?.[0] === 1) version = header[i + 1][1];
    if (header[i][0] === 9 && header[i][1] === "$INSUNITS" && header[i + 1]?.[0] === 70) units = numeric(header[i + 1][1]);
  }
  return { file, version, units, entities };
}

const docs = {};
for (const [role, file] of Object.entries(paths)) {
  if (role === "executable") continue;
  docs[role] = parse(file, await readFile(file, "utf8"));
}
const expectEntities = (doc, label) => {
  assert.deepEqual(doc.entities.map(({ type, layer }) => [type, layer]), [["POLYLINE", "CUT"], ["LINE", "SEW"]], `${label}: entity/layer inventory`);
  assert.equal(doc.entities[0].flags & 1, 1, `${label}: CUT remains closed`);
  assert.deepEqual(doc.entities[0].vertices, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }], `${label}: CUT vertices`);
  assert.deepEqual(doc.entities[1].start, { x: 1, y: 1 }, `${label}: SEW start`);
  assert.deepEqual(doc.entities[1].end, { x: 9, y: 4 }, `${label}: SEW end`);
  assert.equal(doc.units, 5, `${label}: centimeter units`);
};
expectEntities(docs.source, "source R12");
expectEntities(docs.output, "R14 output");
expectEntities(docs.reopened, "reopened R14");
assert.equal(docs.source.version, "AC1009");
assert.equal(docs.output.version, "AC1014");
assert.equal(docs.reopened.version, "AC1014");

console.log(JSON.stringify({
  executable: { bytes: (await readFile(paths.executable)).length, sha256: sha256(await readFile(paths.executable)) },
  conversionPath: "local CLI --export input.dxf output.dxf --target-version R14; two separate zero-exit process invocations",
  source: { bytes: (await readFile(paths.source)).length, sha256: sha256(await readFile(paths.source)), version: docs.source.version, units: docs.source.units, entities: docs.source.entities },
  output: { bytes: (await readFile(paths.output)).length, sha256: sha256(await readFile(paths.output)), version: docs.output.version, units: docs.output.units, entities: docs.output.entities },
  reopened: { bytes: (await readFile(paths.reopened)).length, sha256: sha256(await readFile(paths.reopened)), version: docs.reopened.version, units: docs.reopened.units, entities: docs.reopened.entities },
  result: "exact synthetic entity, layer, closure, coordinate, unit and R14 version checks PASS",
}, null, 2));
