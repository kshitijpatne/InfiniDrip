import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S610-astm-vertex-loss-source-diagnosis";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3572, 3574].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S610-START" && uri === `${dir}/S610-start-packet.md` && verified));
if (board.revision === 3572) assert(!board.evidence.some(({ id }) => id === "E-G04-S610-EXIT"));
if (board.revision === 3574) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S610-EXIT" && uri === `${dir}/S610-exit-packet.md` && verified));
const reportPath = "C:/G04-CLO-DXF-Exchange/S610-astm-vertex-loss-source-diagnosis/Evidence/s610-vertex-loss-comparison.json";
const reportBytes = await readFile(reportPath);
const report = JSON.parse(reportBytes);
assert.equal(createHash("sha256").update(reportBytes).digest("hex"), "8215dd7ad011c387651380aad683d414c13df24dba2601616be2af8e99005c85");
assert.equal(report.findings.length, 5);
assert(report.findings.every(({ sourceVertices, astmCandidateVertexCounts, aamaCandidateVertexCounts, s609FailureWitness }) =>
  astmCandidateVertexCounts.some(({ vertices }) => vertices === sourceVertices - 1) &&
  aamaCandidateVertexCounts.some(({ vertices }) => vertices === sourceVertices - 1) &&
  s609FailureWitness.conservativeUpperBoundCm > 0.001));
const packet = await readFile(`${dir}/S610-exit-packet.md`, "utf8");
const help = await readFile(`${dir}/CLO-DXF-HELP-REVIEW-S610.md`, "utf8");
const matrix = await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S610.md`, "utf8");
assert(packet.toLowerCase().replaceAll(/\s+/g, " ").includes("effects cannot be separated"));
assert(help.includes("official article explains"));
assert(matrix.includes("All V03 holds remain"));
console.log("S610 exit preflight passed: five same-role contour changes across both pinned receiver outputs, measured S609 witnesses, docs and unchanged board statuses verified.");
