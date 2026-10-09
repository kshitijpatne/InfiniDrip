import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3512 && before.evidence.some(({ id }) => id === "E-G04-S595-EXIT")) {
  console.log("S595 exit replay already applied at revision 3512.");
  process.exit(0);
}
assert.equal(before.revision, 3508, "refusing stale S595 exit replay");
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/S595-exit-${name}.json`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3512);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S595-EXIT"));
console.log("S595 exit replay passed at revision 3512; Epic/V02/V03 statuses are preserved.");
