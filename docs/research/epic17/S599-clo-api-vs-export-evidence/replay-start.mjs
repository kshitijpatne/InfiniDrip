import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S599-clo-api-vs-export-evidence";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3528 && before.evidence.some(({ id }) => id === "E-G04-S599-START")) {
  console.log("S599 start replay already applied at revision 3528.");
  process.exit(0);
}
assert.equal(before.revision, 3526, "refusing stale S599 start replay");
for (const name of ["S599-start-add-evidence.json", "S599-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3528);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S599 start replay passed at revision 3528; statuses are preserved.");
