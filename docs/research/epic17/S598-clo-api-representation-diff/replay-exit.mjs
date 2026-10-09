import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S598-clo-api-representation-diff";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3526 && before.evidence.some(({ id }) => id === "E-G04-S598-EXIT")) {
  console.log("S598 exit replay already applied at revision 3526.");
  process.exit(0);
}
assert.equal(before.revision, 3524, "refusing stale S598 exit replay");
for (const name of ["S598-exit-add-evidence.json", "S598-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3526);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S598 exit replay passed at revision 3526; statuses are preserved.");
