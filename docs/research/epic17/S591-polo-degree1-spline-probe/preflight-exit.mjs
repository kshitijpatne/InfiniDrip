import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S591-polo-degree1-spline-probe";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3481, "refusing stale S591 exit preflight");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let candidate = board;
for (const name of [
  "S591-exit-edit-epic.json",
  "S591-exit-edit-item.json",
  "S591-exit-add-evidence.json",
  "S591-exit-add-comment.json",
]) {
  const command = JSON.parse(await readFile(`${dir}/${name}`, "utf8"));
  candidate = applyBoardCommand(candidate, command);
}
assert.equal(candidate.revision, 3485);
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S591-EXIT"));
console.log("S591 exit commands preflight passed on a clone at revisions 3481→3485; statuses are preserved.");
