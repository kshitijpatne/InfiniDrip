import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S594-polo-spline-semantics-audit";
let candidate = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(candidate.revision, 3500, "refusing stale S594 start preflight");
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S594-start-add-evidence.json", "S594-start-add-comment.json"]) {
  candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${directory}/${name}`, "utf8")));
}
assert.equal(candidate.revision, 3502);
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S594-START"));
console.log("S594 start commands pass clone preflight at 3500→3502; statuses are preserved.");
