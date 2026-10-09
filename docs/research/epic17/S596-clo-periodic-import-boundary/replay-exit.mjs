import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S596-clo-periodic-import-boundary";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3518 && before.evidence.some(({ id }) => id === "E-G04-S596-EXIT")) {
  console.log("S596 exit replay already applied at revision 3518.");
  process.exit(0);
}
assert.equal(before.revision, 3516, "refusing stale S596 exit replay");
for (const name of ["S596-exit-add-evidence.json", "S596-exit-add-comment.json"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3518);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S596-EXIT"));
console.log("S596 exit replay passed at revision 3518; statuses are preserved.");
