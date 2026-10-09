import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S603-waistband-sew-grading-trial";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3546 && board.evidence.some(({ id }) => id === "E-G04-S603-EXIT")) {
  console.log("S603 exit replay already applied at revision 3546.");
  process.exit(0);
}
assert.equal(board.revision, 3544, "refusing stale S603 exit replay");
for (const file of ["S603-exit-add-evidence.json", "S603-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3546);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S603-EXIT" &&
  uri === `${dir}/S603-exit-packet.md` && verified));
console.log("S603 validated exit replay passed at revision 3546; statuses and V03 gates are preserved.");
