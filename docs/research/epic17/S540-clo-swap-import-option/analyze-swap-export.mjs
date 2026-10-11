import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange";
const inputPath = `${root}/S540-clo-swap-import-option/Input/synthetic-profile-positive.dxf`;
const outputPath = `${root}/S540-clo-swap-import-option/Output/synthetic-profile-swap-enabled.dxf`;
const baselinePath = `${root}/S532-synthetic-roundtrip/synthetic-clo-export.dxf`;
const reportPath = `${root}/S540-clo-swap-import-option/Evidence/swap-enabled-analysis.json`;
const toleranceCm = 0.001;

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex").toUpperCase(); }
function readPairs(bytes, label) {
  const lines = bytes.toString("ascii").replace(/\r/g, "").split("\n");
  if (lines.at(-1) === "") lines.pop();
  assert.equal(lines.length % 2, 0, `${label}: group-code/value pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    assert.ok(Number.isInteger(code), `${label}: numeric group code at line ${i + 1}`);
    pairs.push([code, lines[i + 1]]);
  }
  return pairs;
}
function polylines(bytes, label) {
  const pairs = readPairs(bytes, label);
  const found = [];
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] !== 0 || pairs[i][1].trim() !== "POLYLINE") continue;
    const header = [];
    const vertices = [];
    let j = i + 1;
    while (j < pairs.length) {
      const [code, value] = pairs[j];
      if (code === 0 && value.trim() === "VERTEX") {
        const vertex = [];
        j++;
        while (j < pairs.length && pairs[j][0] !== 0) vertex.push(pairs[j++]);
        const x = Number(vertex.find(([group]) => group === 10)?.[1]);
        const y = Number(vertex.find(([group]) => group === 20)?.[1]);
        assert.ok(Number.isFinite(x) && Number.isFinite(y), `${label}: valid POLYLINE vertex`);
        vertices.push({ x, y });
        continue;
      }
      if (code === 0 && value.trim() === "SEQEND") { j++; break; }
      if (code === 0) break;
      header.push(pairs[j++]);
    }
    const get = (group) => header.find(([code]) => code === group)?.[1]?.trim();
    found.push({
      layer: get(8) ?? "(none)",
      flags: Number(get(70) ?? 0),
      vertices,
      properties: Object.fromEntries([6, 62, 370, 60, 39, 48, 67, 410, 1001].flatMap((code) => {
        const values = header.filter(([group]) => group === code).map(([, value]) => value.trim());
        return values.length ? [[String(code), values]] : [];
      })),
    });
    i = j - 1;
  }
  return found;
}
function sameCycle(a, b) {
  if (a.length !== b.length || !a.length) return false;
  for (let offset = 0; offset < a.length; offset++) {
    for (const direction of [1, -1]) {
      if (a.every((p, index) => {
        const q = b[(offset + direction * index + 2 * b.length) % b.length];
        return Math.hypot(p.x - q.x, p.y - q.y) <= toleranceCm;
      })) return true;
    }
  }
  return false;
}
async function reportFile(path, label) {
  const bytes = await readFile(path);
  return { label, path, bytes: bytes.length, sha256: sha256(bytes), polylines: polylines(bytes, label) };
}

const input = await reportFile(inputPath, "S540 input");
const output = await reportFile(outputPath, "swap-enabled export");
const baseline = await reportFile(baselinePath, "S532 no-swap export");
assert.equal(input.sha256, "78BDF785BBBF882E2E91F5F08C7446CA944B8501C6F54B30A2AF07CC34C49147");
assert.equal(input.polylines.length, 2);
assert.equal(output.sha256, "62BA3A3F4ABE5131170313A876720F2FD42BBF8D7FA6A2DF6649A7E790A9E447");
function mapRoles(target) {
  return input.polylines.map((entity) => ({ sourceLayer: entity.layer, vertices: entity.vertices.length, matches: target.polylines.filter((candidate) => sameCycle(entity.vertices, candidate.vertices)).map((candidate) => ({ layer: candidate.layer, flags: candidate.flags, vertices: candidate.vertices.length, properties: candidate.properties })) }));
}
function layerCounts(entities) {
  return Object.fromEntries([...new Set(entities.map(({ layer }) => layer))].sort().map((layer) => [layer, entities.filter((entity) => entity.layer === layer).length]));
}
const noSwapRoles = mapRoles(baseline);
const sourceRoles = mapRoles(output);
const noSwapLayerCounts = layerCounts(baseline.polylines);
const outputLayerCounts = layerCounts(output.polylines);
assert.deepEqual(outputLayerCounts, noSwapLayerCounts, "swap option does not change observed output polyline layer counts");
assert.deepEqual(sourceRoles.map(({ sourceLayer, matches }) => [sourceLayer, matches.map(({ layer }) => layer).sort()]), noSwapRoles.map(({ sourceLayer, matches }) => [sourceLayer, matches.map(({ layer }) => layer).sort()]), "swap option does not change source-geometry-to-layer mappings");
const result = {
  receiver: "CLO 2026.1.310 (r58944)",
  import: { format: "DXF-AAMA", unit: "cm", scalePercent: 100, rotation: "Do Not Rotate", grain: "Maintain Original", swapCuttingAndSewing: true, includeNotches: true, importNotchTo: "Pattern Outline", notchPosition: "Ratio", autoDistribute: false, optimizeAllCurvePoints: false, importDrawCurvePoints: true, removeNonGradingPoints: false },
  export: { format: "DXF-AAMA", sizeFormat: "Graded Nest", scale: "cm", scalePercent: 100, rotation: "Do Not Rotate", exportWithoutGrading: false, exportWithoutBaseLines: false, exportWithoutSeamAllowance: false, duplicateNotchOnSeamAllowance: true, convertCurvePoints: false, optimizeAllCurvePoints: false, exportPatternBoundingBox: false },
  thresholdCm: toleranceCm,
  files: { input: { path: input.path, bytes: input.bytes, sha256: input.sha256, polylineCount: input.polylines.length }, noSwapBaseline: { path: baseline.path, bytes: baseline.bytes, sha256: baseline.sha256, polylineCount: baseline.polylines.length }, swappedOutput: { path: output.path, bytes: output.bytes, sha256: output.sha256, polylineCount: output.polylines.length } },
  noSwapSourceRoles: noSwapRoles,
  sourceRoles,
  noSwapLayerCounts,
  outputLayerCounts,
  limitations: ["Synthetic two-contour diagnostic only; not an apparel-profile or all-seven acceptance test.", "CLO documentation labels this control as a swap; output semantics remain empirical and do not by themselves establish a normative layer contract."],
};
await mkdir(new URL("file:///C:/G04-CLO-DXF-Exchange/S540-clo-swap-import-option/Evidence/"), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ reportPath, reportSha256: sha256(Buffer.from(`${JSON.stringify(result, null, 2)}\n`)), files: result.files, noSwapLayerCounts, outputLayerCounts, noSwapRoles, sourceRoles }, null, 2));
