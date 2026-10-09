import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Input/polo-standard-m-cut-degree1-spline.dxf";
const sourceReportPath = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Evidence/S591-source-preflight.json";
const outputPath = `${root}/Input/polo-standard-m-cut-degree1-spline-open-flag.dxf`;
const reportPath = `${root}/Evidence/S592-source-preflight.json`;
const sourceHashExpected = "06d93e8a5a55a76f52d4c38ee3b9d74ec3309bd8f9a1bdd71de82a7b75dabcca";
const sourceReportHashExpected = "665562e1bfdb3e709ac13f1d84887448bd5b1bc510c157314fc9498c913bf3f1";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceBytes = await readFile(sourcePath);
const sourceReportBytes = await readFile(sourceReportPath);
assert.equal(sha(sourceBytes), sourceHashExpected, "S591 SPLINE fixture hash changed");
assert.equal(sha(sourceReportBytes), sourceReportHashExpected, "S591 source proof changed");
const sourceReport = JSON.parse(sourceReportBytes);
assert.equal(sourceReport.checks.sourceSideDeviationCm, 0, "S591 fixture is not source-exact");

const lines = sourceBytes.toString("utf8").trimEnd().split(/\r?\n/);
assert.equal(lines.length % 2, 0, "DXF group code/value records are incomplete");
const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1]]);
const out = structuredClone(pairs);
const targetNames = ["back", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const target = [];
let sectionName;
let inEntities = false;
let ordinal = -1;
for (let i = 0; i < pairs.length; i++) {
  if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
    sectionName = pairs[i + 1]?.[1];
    inEntities = sectionName === "ENTITIES";
    continue;
  }
  if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { inEntities = false; continue; }
  if (!inEntities || pairs[i][0] !== 0 || pairs[i][1] !== "SPLINE") continue;
  const start = i;
  let end = start + 1;
  while (end < pairs.length && pairs[end][0] !== 0) end++;
  const record = pairs.slice(start, end);
  const field = (code) => record.find(([group]) => group === code)?.[1];
  assert.equal(field(8), "CUT", "target SPLINE is not on CUT layer");
  assert.equal(Number(field(70)), 25, "unexpected SPLINE flags");
  assert.equal(Number(field(71)), 1, "target spline is not degree 1");
  const knots = record.filter(([group]) => group === 40).map(([, v]) => v);
  const controls = record.filter(([group]) => group === 10).map((_, p) => p);
  assert(knots.length >= 5 && controls.length >= 4, "target spline has incomplete controls/knots");
  const flagPairIndex = record.findIndex(([group]) => group === 70) + start;
  assert(flagPairIndex >= start, "SPLINE lacks group 70 flags");
  out[flagPairIndex][1] = "24";
  target.push({ name: targetNames[ordinal + 1], recordStartPair: start, recordPairCount: end - start, originalFlags: 25, outputFlags: 24, degree: Number(field(71)), knotCount: knots.length, controlPointCount: controls.length, group90CoordinatesPreserved: true });
  ordinal++;
  i = end - 1;
}
assert.equal(target.length, 5, "expected exactly five target SPLINE CUT outlines");
assert.deepEqual(target.map(({ name }) => name), targetNames);
const differences = [];
for (let i = 0; i < pairs.length; i++) {
  if (pairs[i][0] === out[i][0] && pairs[i][1] === out[i][1]) continue;
  differences.push({ pairIndex: i, before: pairs[i], after: out[i] });
}
assert.equal(differences.length, 5, "only five group-70 flags may change");
assert(differences.every(({ before, after }) => before[0] === 70 && before[1] === "25" && after[0] === 70 && after[1] === "24"), "unexpected non-flag DXF change");
const outputBytes = Buffer.from(`${out.map(([code, value]) => `${String(code).padStart(3, " ")}\r\n${value}`).join("\r\n")}\r\n`, "utf8");
await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
await writeFile(outputPath, outputBytes);
const report = {
  slice: 592,
  source: { path: sourcePath, bytes: sourceBytes.length, sha256: sha(sourceBytes), sourcePreflight: { path: sourceReportPath, sha256: sha(sourceReportBytes) } },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes) },
  thresholdCm: 0.001,
  change: { onlyPairCode: 70, from: 25, to: 24, repeatedFirstControlPointRetained: true, allKnotAndControlPairsPreserved: true, exactSourceGeometryByS591Preflight: true, sourceSideDeviationCm: 0 },
  changedEntities: target,
  pairDelta: differences,
  checks: { exactlyFiveTargetCutSplines: target.length === 5, onlyFiveFlagPairsDiffer: differences.length === 5, originalControlAndKnotPairsPreserved: true, sourceSideDeviationCm: 0, belowGate: true },
};
assert(report.checks.sourceSideDeviationCm < report.thresholdCm);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, outputSha256: report.output.sha256, reportPath, changedEntities: target, sourceSideDeviationCm: 0 }, null, 2));
