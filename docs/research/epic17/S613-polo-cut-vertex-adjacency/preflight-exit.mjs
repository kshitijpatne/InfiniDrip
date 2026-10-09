import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S613-polo-cut-vertex-adjacency";
const root = "C:/G04-CLO-DXF-Exchange/S613-polo-cut-vertex-adjacency/Evidence/s613-missing-vertex-adjacency.json";
const report = JSON.parse(await readFile(root, "utf8"));
assert.equal(report.findings.length, 5);
assert.deepEqual(report.findings.map(({ piece }) => piece), ["back", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"]);
assert(report.findings.every(({ aama, astm, s609ConservativeUpperBoundCm }) => aama.alignmentMaxIncludedVertexDeltaCm <= 0.001 && astm.alignmentMaxIncludedVertexDeltaCm <= 0.001 && s609ConservativeUpperBoundCm > 0.001));
assert(report.findings.every(({ omittedSourceVertex, aama, astm }) => omittedSourceVertex.previousEdgeLengthCm >= 0.045 && omittedSourceVertex.previousEdgeLengthCm <= 0.048 && omittedSourceVertex.perpendicularDistanceToReplacementChordCm >= 0.012 && aama.outputMissingVertexToChordCm > 0.001 && astm.outputMissingVertexToChordCm > 0.001));
const dirName = "docs/research/epic17/S613-polo-cut-vertex-adjacency";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3584);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S613-exit-add-evidence.json", "S613-exit-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dirName}/${name}`, "utf8")));
}
assert.equal(board.revision, 3586);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S613-EXIT" && uri === `${dirName}/S613-exit-packet.md` && verified));
console.log("S613 exit preflight passed: five unique source-corresponding losses, fixed gate fails, 3584→3586 board commands valid.");
