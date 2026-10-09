import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S610-astm-vertex-loss-source-diagnosis";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3570);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S610-start-add-evidence.json", "S610-start-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3572);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S610-START" && uri === `${dir}/S610-start-packet.md` && verified));
console.log("S610 start preflight passed: board commands apply 3570→3572; G04 statuses unchanged.");
