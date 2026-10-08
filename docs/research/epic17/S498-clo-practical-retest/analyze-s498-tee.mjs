import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const path = "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/tee-standard-m-s498-clo-export.dxf";
const outputBytes = await readFile(path);
const inputBytes = await readFile("C:/G04-CLO-DXF-Exchange/Input/tee-standard-m.dxf");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const lines = outputBytes.toString("utf8").trimEnd().split(/\r?\n/);
if (lines.length % 2) throw new Error("DXF has an incomplete group pair");
const pairs = [];
for (let i = 0; i < lines.length; i += 2) pairs.push([Number(lines[i]), lines[i + 1]]);
const sections = [];
let section = null;
for (let i = 0; i < pairs.length; i++) {
  if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
    section = { name: pairs[i + 1]?.[1], entities: [] };
    sections.push(section);
  } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = null;
  else if (section && pairs[i][0] === 0) {
    const start = i;
    i++;
    while (i < pairs.length && pairs[i][0] !== 0) i++;
    section.entities.push(pairs.slice(start, i));
    i--;
  }
}
function value(entity, code) { return entity.find(([c]) => c === code)?.[1]; }
const report = {};
let activeBlock = "(outside)";
const polylineSummaries = [];
for (const s of sections) {
  const types = Object.create(null), layers = Object.create(null);
  const blockNames = [];
  for (let ei = 0; ei < s.entities.length; ei++) {
    const e = s.entities[ei];
    const type = e[0][1], layer = value(e, 8) ?? "(none)";
    types[type] = (types[type] ?? 0) + 1;
    layers[layer] = (layers[layer] ?? 0) + 1;
    if (type === "BLOCK") blockNames.push(value(e, 2));
    if (s.name === "BLOCKS" && type === "BLOCK") activeBlock = value(e, 2);
    if (s.name === "BLOCKS" && type === "POLYLINE") {
      const vertices = [];
      for (let vi = ei + 1; vi < s.entities.length; vi++) {
        const ve = s.entities[vi];
        if (ve[0][1] === "SEQEND") break;
        if (ve[0][1] === "VERTEX") vertices.push({ x: Number(value(ve, 10)), y: Number(value(ve, 20)) });
        if (["BLOCK", "POLYLINE", "ENDBLK"].includes(ve[0][1])) break;
      }
      const xs = vertices.map(({ x }) => x), ys = vertices.map(({ y }) => y);
      polylineSummaries.push({ block: activeBlock, layer, vertexCount: vertices.length,
        closedFlag: Number(value(e, 70) ?? 0) & 1,
        attributes: e.filter(([code]) => [6, 62, 70, 39, 370].includes(code)),
        bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
        first: vertices.slice(0, 3) });
    }
  }
  report[s.name] = { entityCount: s.entities.length, types, layers, blockNames };
}
report.acadver = pairs.find(([code, val]) => code === 9 && val === "$ACADVER") ? pairs[pairs.findIndex(([code, val]) => code === 9 && val === "$ACADVER") + 1]?.[1] : null;
report.polylines = polylineSummaries.map(({ block, layer, vertexCount, closedFlag, bounds, attributes }) =>
  ({ block, layer, vertexCount, closedFlag, bounds, attributes }));
report.tables = [];
for (let i = 0; i < pairs.length; i++) if (pairs[i][0] === 0 && pairs[i][1] === "TABLE") {
  const tableName = pairs[i + 1]?.[1];
  const records = [];
  for (let j = i + 2; j < pairs.length && !(pairs[j][0] === 0 && pairs[j][1] === "ENDTAB"); j++) {
    if (pairs[j][0] === 0) {
      const row = [];
      for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) row.push(pairs[k]);
      records.push({ type: pairs[j][1], name: row.find(([code]) => code === 2)?.[1], flags: row.find(([code]) => code === 70)?.[1], color: row.find(([code]) => code === 62)?.[1], linetype: row.find(([code]) => code === 6)?.[1] });
    }
  }
  report.tables.push({ tableName, records });
}
report.inserts = sections.find(({ name }) => name === "ENTITIES")?.entities.filter((e) => e[0][1] === "INSERT").map((e) => ({
  block: value(e, 2), layer: value(e, 8), x: Number(value(e, 10)), y: Number(value(e, 20)),
  scaleX: Number(value(e, 41) ?? 1), scaleY: Number(value(e, 42) ?? 1), rotation: Number(value(e, 50) ?? 0),
}));
const here = fileURLToPath(new URL(".", import.meta.url));
const oracle = JSON.parse(await readFile(resolve(here, "../S474-tee-geometry-oracle/tee-expected-geometry.json"), "utf8"));
const completePolylines = [];
for (const s of sections.filter(({ name }) => name === "BLOCKS")) {
  let block = "(outside)";
  for (let ei = 0; ei < s.entities.length; ei++) {
    const e = s.entities[ei], type = e[0][1];
    if (type === "BLOCK") block = value(e, 2);
    if (type !== "POLYLINE") continue;
    const vertices = [];
    for (let vi = ei + 1; vi < s.entities.length; vi++) {
      const ve = s.entities[vi];
      if (ve[0][1] === "SEQEND") break;
      if (ve[0][1] === "VERTEX") vertices.push({ x: Number(value(ve, 10)), y: Number(value(ve, 20)) });
      if (["BLOCK", "POLYLINE", "ENDBLK"].includes(ve[0][1])) break;
    }
    completePolylines.push({ block, layer: value(e, 8), vertices });
  }
}
function cyclicMax(expected, actual, reverse) {
  if (expected.length !== actual.length) return null;
  let best = Infinity;
  for (let offset = 0; offset < actual.length; offset++) {
    let max = 0;
    for (let i = 0; i < expected.length; i++) {
      const j = reverse ? (offset - i + actual.length) % actual.length : (offset + i) % actual.length;
      max = Math.max(max, Math.abs(expected[i].x - actual[j].x), Math.abs(expected[i].y - actual[j].y));
    }
    best = Math.min(best, max);
  }
  return best;
}
report.sourceOutlineMatches = oracle.outlines.map((source) => {
  const candidates = completePolylines.filter(({ block }) => block === `${source.sourcePieceOrdinal}_M`).map((candidate) => ({
    layer: candidate.layer, vertexCount: candidate.vertices.length,
    maxCoordinateDeltaCm: Math.min(cyclicMax(source.vertices, candidate.vertices, false) ?? Infinity,
      cyclicMax(source.vertices, candidate.vertices, true) ?? Infinity),
  })).sort((a, b) => a.maxCoordinateDeltaCm - b.maxCoordinateDeltaCm);
  const bestDelta = candidates[0]?.maxCoordinateDeltaCm;
  return {
  source: `${source.sourcePieceName}:${source.layer}`,
  sourceVertexCount: source.vertexCount,
  sourceBounds: source.bounds,
  bestCoordinateDeltaCm: bestDelta,
  coincidentCandidateLayersWithinTolerance: candidates.filter(({ maxCoordinateDeltaCm }) => maxCoordinateDeltaCm <= 0.001).map(({ layer }) => layer),
  candidates: candidates.slice(0, 4),
  };
});
assert.equal(report.acadver, "AC1009");
assert.equal(report.polylines.length, 24);
assert.ok(report.polylines.every(({ closedFlag }) => closedFlag === 1));
assert.equal(report.inserts.length, 3);
assert.equal(report.sourceOutlineMatches.length, 6);
assert.ok(report.sourceOutlineMatches.every(({ bestCoordinateDeltaCm }) => bestCoordinateDeltaCm <= 0.001));
assert.equal(hash(inputBytes), oracle.source.sha256, "C: input still matches byte-identified source oracle");
report.trial = {
  receiver: "CLO 2026.1.310 (r58944)",
  inputPath: "C:/G04-CLO-DXF-Exchange/Input/tee-standard-m.dxf",
  inputSha256: oracle.source.sha256,
  inputBytes: oracle.source.bytes,
  outputPath: path,
  outputSha256: hash(outputBytes),
  outputBytes: outputBytes.byteLength,
  sourcePieceBlockAssociation: "fixture piece ordinal maps to CLO block names 0_M (front), 1_M (back), 2_M (sleeve); each has one unrotated, unit-scale model-space INSERT",
  closure: "All 24 output POLYLINE entities have the closed flag set; 8 occur in each piece block.",
  sourceAssociation: "Every one of the six source outlines has a same-piece, same-vertex-count output polyline match within 0.001 cm under cyclic vertex rotation and either traversal direction.",
  profileObservation: "CLO UI selected DXF-ASTM export and matching DXF-ASTM reimport, centimeters and 100%; AC1009 header contains no drawing-units declaration.",
  semanticMultiplicity: "Each source CUT outline is coincident with output polylines on four numeric layers; each source SEW outline is coincident with output polylines on two numeric layers. The UI reimport renders the three separate pieces and inner/outer contours without a visible extra stroke, but this one fixture does not establish a product-independent meaning for those numeric layer duplicates.",
  maxBestCoordinateDeltaCm: Math.max(...report.sourceOutlineMatches.map(({ bestCoordinateDeltaCm }) => bestCoordinateDeltaCm)),
};
const resultPath = "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Evidence/tee-roundtrip-analysis.json";
await writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  resultPath,
  outputSha256: report.trial.outputSha256,
  outputBytes: report.trial.outputBytes,
  sections: Object.fromEntries(Object.entries(report).filter(([key]) => ["HEADER", "BLOCKS", "ENTITIES"].includes(key)).map(([key, value]) => [key, value.entityCount])),
  pieces: report.inserts.map(({ block }) => block),
  outputPolylines: report.polylines.length,
  maxBestCoordinateDeltaCm: report.trial.maxBestCoordinateDeltaCm,
  outlineMatches: report.sourceOutlineMatches.map(({ source, bestCoordinateDeltaCm, coincidentCandidateLayersWithinTolerance }) => ({ source, bestCoordinateDeltaCm, coincidentCandidateLayersWithinTolerance })),
}, null, 2));
