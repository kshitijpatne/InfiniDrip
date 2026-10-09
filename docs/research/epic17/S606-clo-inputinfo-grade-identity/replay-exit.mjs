import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S606-clo-inputinfo-grade-identity";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3558 && board.evidence.some(({ id }) => id === "E-G04-S606-EXIT")) {
  console.log("S606 exit replay already applied at revision 3558.");
  process.exit(0);
}
assert.equal(board.revision, 3556, "refusing stale S606 exit replay");
for (const file of ["S606-exit-add-evidence.json", "S606-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3558);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S606-EXIT" && uri === `${dir}/S606-exit-packet.md` && verified));
console.log("S606 validated exit replay passed at revision 3558; no acceptance/status change.");
