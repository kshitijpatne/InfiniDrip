import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S603-waistband-sew-grading-trial";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3544 && board.evidence.some(({ id }) => id === "E-G04-S603-START")) {
  console.log("S603 start replay already applied at revision 3544.");
  process.exit(0);
}
assert.equal(board.revision, 3542, "refusing stale S603 start replay");
for (const file of ["S603-start-add-evidence.json", "S603-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3544);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S603-START" && uri === `${dir}/S603-start-packet.md` && verified));
console.log("S603 start replay passed at revision 3544; admitted statuses are preserved.");
