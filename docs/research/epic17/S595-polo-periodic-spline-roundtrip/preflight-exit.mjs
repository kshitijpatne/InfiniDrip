import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
let candidate = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(candidate.revision, 3508, "refusing stale S595 exit preflight");
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) {
  candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${directory}/S595-exit-${name}.json`, "utf8")));
}
assert.equal(candidate.revision, 3512);
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S595-EXIT"));
console.log("S595 exit commands pass clone preflight at 3508→3512; Epic/V02/V03 statuses and evidence are preserved.");
