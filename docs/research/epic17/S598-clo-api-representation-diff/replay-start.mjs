import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S598-clo-api-representation-diff";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3524 && before.evidence.some(({ id }) => id === "E-G04-S598-START")) {
  console.log("S598 start replay already applied at revision 3524.");
  process.exit(0);
}
assert.equal(before.revision, 3522, "refusing stale S598 start replay");
for (const name of ["S598-start-add-evidence.json", "S598-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3524);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S598 start replay passed at revision 3524; statuses are preserved.");
