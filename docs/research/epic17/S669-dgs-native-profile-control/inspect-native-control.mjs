import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const DxfParser = require("C:/G04-CLO-DXF-Exchange/Tools/open-patterns-astm-parser/node_modules/dxf-parser");
const root = "C:/G04-CLO-DXF-Exchange/S669-dgs-native-profile-control";
const inputPath = `${root}/Output/g04-dgs-native-control.dxf`;
const outputPath = `${root}/Evidence/native-control-dxf-parse.json`;
const bytes = await readFile(inputPath);
const text = bytes.toString("latin1");
const dxf = new DxfParser().parseSync(text);
const pairs = text.split(/\r?\n/).map(s => s.trim());
const groupCounts = {};
for (let i = 0; i + 1 < pairs.length; i += 2) {
  if (/^\d+$/.test(pairs[i])) groupCounts[pairs[i]] = (groupCounts[pairs[i]] || 0) + 1;
}
const entities = dxf.entities || [];
const report = {
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
  textStart: text.slice(0, 300),
  hasBinaryTail: bytes.includes(0),
  acadVersion: dxf.header?.$ACADVER ?? null,
  insunits: dxf.header?.$INSUNITS ?? null,
  header: dxf.header,
  blockNames: Object.keys(dxf.blocks || {}),
  entityCount: entities.length,
  entityTypes: entities.reduce((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {}),
  entityLayers: [...new Set(entities.map(e => e.layer ?? "<missing>"))].sort(),
  entities: entities.map(e => ({
    type: e.type,
    layer: e.layer ?? null,
    name: e.name ?? null,
    vertices: e.vertices?.map(v => [v.x, v.y, v.z ?? 0]) ?? null,
    position: e.position ? [e.position.x, e.position.y, e.position.z ?? 0] : null,
    text: e.text ?? null,
    start: e.start ? [e.start.x, e.start.y, e.start.z ?? 0] : null,
    end: e.end ? [e.end.x, e.end.y, e.end.z ?? 0] : null,
  })),
  groupCounts,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
