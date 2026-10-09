import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S592-polo-spline-closure-flag-probe";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3491 && board.evidence.some(({ id }) => id === "E-G04-S592-EXIT")) {
  console.log("S592 exit already applied at revision 3491.");
  process.exit(0);
}
assert.equal(board.revision, 3487, "refusing stale S592 exit replay");
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/S592-exit-${name}.json`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3491);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S592-EXIT"));
console.log("S592 exit replay passed at revision 3491; Epic/V02/V03 statuses are preserved.");
