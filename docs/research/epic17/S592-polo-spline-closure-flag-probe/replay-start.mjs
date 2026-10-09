import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S592-polo-spline-closure-flag-probe";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3487 && board.evidence.some(({ id }) => id === "E-G04-S592-START")) {
  console.log("S592 start already applied at revision 3487.");
  process.exit(0);
}
assert.equal(board.revision, 3485, "refusing stale S592 start replay");
for (const name of ["S592-start-add-evidence.json", "S592-start-add-comment.json"])
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${name}`], { stdio: "inherit" });
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3487);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S592-START"));
console.log("S592 start replay passed at revision 3487; all Epic and V03 statuses remain unchanged.");
