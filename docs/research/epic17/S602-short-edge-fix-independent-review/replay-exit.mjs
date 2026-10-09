import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S602-short-edge-fix-independent-review";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3542 && board.evidence.some(({ id }) => id === "E-G04-S602-EXIT")) {
  console.log("S602 exit replay already applied at revision 3542.");
  process.exit(0);
}
assert.equal(board.revision, 3540, "refusing stale S602 exit replay");
for (const file of ["S602-exit-add-evidence.json", "S602-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3542);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S602-EXIT" && uri === `${dir}/S602-exit-packet.md` && verified));
console.log("S602 exit replay passed at revision 3542; admitted statuses are preserved.");
