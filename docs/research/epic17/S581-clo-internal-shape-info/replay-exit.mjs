import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3441 && board.evidence.some(({ id }) => id === "E-G04-S581-EXIT")) {
  console.log("S581 exit already applied at revision 3441.");
  process.exit(0);
}
assert.equal(board.revision, 3439, "refusing stale or unexpected S581 exit replay");
for (const name of ["S581-exit-add-evidence.json", "S581-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S581-clo-internal-shape-info/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3441);
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S581-EXIT"));
assert.equal(after.workItems.find(({ id }) => id === "G04-V02").status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03").status, "In Progress");
