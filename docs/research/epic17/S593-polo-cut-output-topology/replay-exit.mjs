import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S593-polo-cut-output-topology";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3497 && board.evidence.some(({ id }) => id === "E-G04-S593-EXIT")) {
  console.log("S593 exit already applied at revision 3497.");
  process.exit(0);
}
assert.equal(board.revision, 3493, "refusing stale S593 exit replay");
for (const name of ["edit-epic", "edit-item", "add-evidence", "add-comment"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/S593-exit-${name}.json`], { stdio: "inherit" });
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3497);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S593-EXIT"));
console.log("S593 exit replay passed at revision 3497; Epic/V02/V03 statuses are preserved.");
