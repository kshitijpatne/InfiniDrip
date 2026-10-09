import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S594-polo-spline-semantics-audit";
let candidate = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(candidate.revision, 3502, "refusing stale S594 exit preflight");
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${directory}/S594-exit-${name}.json`, "utf8")));
assert.equal(candidate.revision, 3506);
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S594-EXIT"));
for (const value of [candidate.epics.find(({ id }) => id === "EPIC-17"), candidate.workItems.find(({ id }) => id === "EPIC-17")]) {
  assert.match(value.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
  assert.match(value.description, /S406's approved view-only collar-over-plackets order remains implemented/);
}
console.log("S594 exit commands pass clone preflight at 3502→3506; Epic/V02/V03 statuses and canonical evidence language are preserved.");
