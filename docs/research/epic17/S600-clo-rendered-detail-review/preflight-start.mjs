import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3530, "refusing stale S600 start preflight");
for (const name of ["S600-start-add-evidence.json", "S600-start-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`docs/research/epic17/S600-clo-rendered-detail-review/${name}`, "utf8")));
}
assert.equal(board.revision, 3532);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S600-START"));
console.log("S600 start commands pass clone preflight at 3530→3532; statuses remain unchanged.");
