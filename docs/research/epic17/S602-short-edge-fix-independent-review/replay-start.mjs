import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S602-short-edge-fix-independent-review";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if ([3540, 3542].includes(board.revision) && board.evidence.some(({ id }) => id === "E-G04-S602-START")) {
  console.log(`S602 start replay already applied at revision ${board.revision}.`);
  process.exit(0);
}
assert.equal(board.revision, 3538, "refusing stale S602 start replay");
for (const file of ["S602-start-add-evidence.json", "S602-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3540);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S602-START" && uri === `${dir}/S602-start-packet.md` && verified));
console.log("S602 start replay passed at revision 3540; admitted statuses are preserved.");
