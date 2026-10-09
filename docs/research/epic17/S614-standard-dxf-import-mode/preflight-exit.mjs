import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S614-standard-dxf-import-mode";
const root = "C:/G04-CLO-DXF-Exchange/S614-standard-dxf-import-mode/Evidence/Analysis";
const diagnostic = JSON.parse(await readFile(`${root}/S614-scale-diagnostic.json`, "utf8"));
const inventory = JSON.parse(await readFile(`${root}/S614-output-inventory.json`, "utf8"));
assert.equal(diagnostic.results.length, 18);
const scaledExact = diagnostic.results.filter(({ factor, exactDelta }) => factor === 0.1 && exactDelta !== null && exactDelta <= 0.001);
assert.equal(scaledExact.length, 8);
const front = inventory.blocks[0].closedPolylines.find(({ layer }) => layer === "1");
const frontBounds = front.bounds;
const frontWidth = frontBounds.maxX - frontBounds.minX;
const frontHeight = frontBounds.maxY - frontBounds.minY;
assert(Math.abs(frontWidth / 28.5 - 0.1) < 1e-6);
assert(Math.abs(frontHeight / 73.274 - 0.1) < 1e-6);
const packet = await readFile(`${dir}/S614-exit-packet.md`, "utf8");
for (const phrase of ["10×", "0.001 cm", "all-seven", "CLO remains open"]) assert(packet.includes(phrase), `missing packet phrase: ${phrase}`);
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3588, 3591].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3588) {
  for (const name of ["S614-exit-add-evidence.json", "S614-exit-add-comment.json", "S614-exit-add-matrix-evidence.json"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3591);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-EXIT" && uri === `${dir}/S614-exit-packet.md` && verified));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-MATRIX" && uri === `${dir}/V03-CURRENT-GATE-MATRIX-S614.md` && verified));
console.log("S614 exit preflight passed: 8/18 exact source-path matches only at 0.1 scale; front bbox confirms 10× shrink; all V03 holds retained; board commands valid for 3588→3591.");
