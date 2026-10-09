import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3524, "refusing stale S598 exit preflight");
for (const name of ["S598-exit-add-evidence.json", "S598-exit-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`docs/research/epic17/S598-clo-api-representation-diff/${name}`, "utf8")));
}
assert.equal(board.revision, 3526);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S598-EXIT"));
console.log("S598 exit commands pass clone preflight at 3524→3526; statuses remain unchanged.");
