import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputPath = "C:/G04-CLO-DXF-Exchange/S671-polo-cut-source-path-density/Input/polo-standard-m-cm-units-header-exact-path-density.dxf";
const outputPath = "C:/G04-CLO-DXF-Exchange/S672-clo-standard-source-path-density/S672-standard-density-export.dxf";
const reportPath = "C:/G04-CLO-DXF-Exchange/S672-clo-standard-source-path-density/Evidence/Analysis/S672-entity-inventory.json";
const expectedInputHash = "487fad7533bda83306d3f4fa2dfef523e469e62f3d808eff0a9c98a7e38b77f8";
const expectedOutputHash = "e0ab634dd03562c33cc3cd07f70c320bdfdb2a917045a48aa75ab6748c3e631f";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete DXF group pair`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trim()]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: invalid group code`);
  const sections = [];
  let i = 0;
  while (i < pairs.length) {
    if (pairs[i][0] !== 0 || pairs[i][1] !== "SECTION") { i++; continue; }
    const name = pairs[i + 1]?.[1];
    i += 2;
    const contentStart = i;
    const entities = [];
    while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1] === "ENDSEC")) {
      if (pairs[i][0] !== 0) { i++; continue; }
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      entities.push(pairs.slice(start, i));
    }
    sections.push({ name, entities, rawPairs: pairs.slice(contentStart, i) });
    i++;
  }
  const val = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const header = sections.find(({ name }) => name === "HEADER")?.rawPairs ?? [];
  const headerVariables = new Map();
  for (let index = 0; index < header.length; index++) {
    const pair = header[index];
    if (pair?.[0] !== 9) continue;
    const variable = pair[1];
    const values = [];
    for (let next = index + 1; next < header.length && header[next][0] !== 9; next++) {
      values.push(header[next]);
    }
    headerVariables.set(variable, values);
  }
  const headerValue = (key, group) => headerVariables.get(key)?.find(([code]) => code === group)?.[1] ?? null;
  const inventory = sections.map(({ name, entities }) => {
    const types = {}, layers = {};
    for (const entity of entities) {
      const type = entity[0]?.[1] ?? "(unknown)";
      const layer = val(entity, 8) ?? "(none)";
      types[type] = (types[type] ?? 0) + 1;
      layers[layer] = (layers[layer] ?? 0) + 1;
    }
    return { name, entityCount: entities.length, types, layers };
  });
  const blocks = sections.find(({ name }) => name === "BLOCKS")?.entities ?? [];
  const blockNames = blocks.filter((entity) => entity[0]?.[1] === "BLOCK").map((entity) => val(entity, 2));
  const entitySection = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const inserts = entitySection.filter((entity) => entity[0]?.[1] === "INSERT").map((entity) => ({
    block: val(entity, 2), x: Number(val(entity, 10) ?? 0), y: Number(val(entity, 20) ?? 0),
    sx: Number(val(entity, 41) ?? 1), sy: Number(val(entity, 42) ?? 1), rotation: Number(val(entity, 50) ?? 0),
  }));
  return { version: headerValue("$ACADVER", 1), insunits: headerValue("$INSUNITS", 70), inventory, blockNames, inserts };
}

const [inputBytes, outputBytes] = await Promise.all([readFile(inputPath), readFile(outputPath)]);
assert.equal(sha(inputBytes), expectedInputHash, "S671 input fixture hash changed");
assert.equal(sha(outputBytes), expectedOutputHash, "CLO export hash changed");
const input = parse(inputBytes, "input"), output = parse(outputBytes, "output");
assert.equal(output.inserts.length, 9, "CLO export should contain all nine inserted pieces");
assert.equal(output.blockNames.length, 11, "recorded CLO block inventory changed");
const report = {
  experiment: "Source/output section, DXF entity, layer, block identity, version, and unit inventory for S672.",
  input: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes), ...input },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes), ...output },
  interpretation: {
    outputLayerLabels: "CLO exported numeric layer labels; they do not retain the source semantic layer names.",
    outputBlockLabels: "CLO block identifiers and size suffixes are receiver-generated ordinals, not source piece/revision identity.",
    units: "Compare $INSUNITS metadata as well as coordinates; coordinates can match numerically while unit metadata changes physical scale for a consuming receiver.",
  },
};
await mkdir("C:/G04-CLO-DXF-Exchange/S672-clo-standard-source-path-density/Evidence/Analysis", { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ input: report.input, output: report.output }, null, 2));
