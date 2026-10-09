import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3449 && board.evidence.some(({ id }) => id === "E-G04-S583-EXIT")) {
  console.log("S583 exit already applied at revision 3449.");
  process.exit(0);
}
assert.equal(board.revision, 3447, "refusing stale or unexpected S583 exit replay");
for (const name of ["S583-exit-add-evidence.json", "S583-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S583-clo-pattern-info-getters/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3449);
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S583-EXIT"));
console.log("S583 validated exit replay passed at revision 3449.");
