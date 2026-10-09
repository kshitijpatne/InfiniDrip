import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S594-polo-spline-semantics-audit";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3502 && before.evidence.some(({ id }) => id === "E-G04-S594-START")) {
  console.log("S594 start replay already applied at revision 3502.");
  process.exit(0);
}
assert.equal(before.revision, 3500, "refusing stale S594 start replay");
for (const name of ["S594-start-add-evidence.json", "S594-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3502);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S594 start replay passed at revision 3502; Epic/V02/V03 statuses are preserved.");
