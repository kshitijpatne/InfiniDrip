import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3520, "refusing stale S597 exit preflight");
const directory = "docs/research/epic17/S597-clo-helper-recovery";
for (const name of ["S597-exit-add-evidence.json", "S597-exit-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${directory}/${name}`, "utf8")));
}
assert.equal(board.revision, 3522);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S597-EXIT"));
console.log("S597 exit commands pass clone preflight at 3520→3522; statuses remain unchanged.");
