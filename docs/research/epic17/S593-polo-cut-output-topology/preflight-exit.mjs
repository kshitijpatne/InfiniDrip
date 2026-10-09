import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S593-polo-cut-output-topology";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3493, "refusing stale S593 exit preflight");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let candidate = board;
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${dir}/S593-exit-${name}.json`, "utf8")));
assert.equal(candidate.revision, 3497);
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S593-EXIT"));
console.log("S593 exit commands pass clone preflight at 3493→3497; Epic/V02/V03 statuses are preserved.");
