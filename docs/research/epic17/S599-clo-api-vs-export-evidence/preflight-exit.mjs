import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3528, "refusing stale S599 exit preflight");
for (const name of ["S599-exit-add-evidence.json", "S599-exit-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`docs/research/epic17/S599-clo-api-vs-export-evidence/${name}`, "utf8")));
}
assert.equal(board.revision, 3530);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S599-EXIT"));
console.log("S599 exit commands pass clone preflight at 3528→3530; statuses remain unchanged.");
