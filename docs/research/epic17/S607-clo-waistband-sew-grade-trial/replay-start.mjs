import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S607-clo-waistband-sew-grade-trial";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3560 && board.evidence.some(({ id }) => id === "E-G04-S607-START")) {
  console.log("S607 start replay already applied at revision 3560.");
  process.exit(0);
}
assert.equal(board.revision, 3558, "refusing stale S607 start replay");
for (const file of ["S607-start-add-evidence.json", "S607-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3560);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S607-START" && uri === `${dir}/S607-start-packet.md` && verified));
console.log("S607 validated start replay passed at revision 3560; no acceptance/status change.");
