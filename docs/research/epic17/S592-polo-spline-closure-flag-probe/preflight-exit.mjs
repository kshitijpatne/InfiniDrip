import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S592-polo-spline-closure-flag-probe";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3487, "refusing stale S592 exit preflight");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let candidate = board;
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) {
  candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${dir}/S592-exit-${name}.json`, "utf8")));
}
assert.equal(candidate.revision, 3491);
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S592-EXIT"));
console.log("S592 exit commands pass clone preflight at 3487→3491; Epic/V02/V03 statuses are preserved.");
