import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S606-clo-inputinfo-grade-identity";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3556 && board.evidence.some(({ id }) => id === "E-G04-S606-START")) {
  console.log("S606 start replay already applied at revision 3556.");
  process.exit(0);
}
assert.equal(board.revision, 3554, "refusing stale S606 start replay");
for (const file of ["S606-start-add-evidence.json", "S606-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3556);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S606-START" && uri === `${dir}/S606-start-packet.md` && verified));
console.log("S606 validated start replay passed at revision 3556; no acceptance/status change.");
