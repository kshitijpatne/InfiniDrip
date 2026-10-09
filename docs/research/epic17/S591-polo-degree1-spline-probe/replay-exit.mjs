import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S591-polo-degree1-spline-probe";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3485 && board.evidence.some(({ id }) => id === "E-G04-S591-EXIT")) {
  console.log("S591 exit already applied at revision 3485.");
  process.exit(0);
}
assert.equal(board.revision, 3481, "refusing stale S591 exit replay");
for (const name of [
  "S591-exit-edit-epic.json",
  "S591-exit-edit-item.json",
  "S591-exit-add-evidence.json",
  "S591-exit-add-comment.json",
]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3485);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S591-EXIT"));
console.log("S591 exit replay passed at revision 3485; all Epic and V03 statuses remain unchanged.");
