import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S625-clo-standard-r14-import-test";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3642 && board.evidence.some((item) => item.id === "E-G04-S625-MATRIX")) {
  console.log("S625 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3639, "refusing stale S625 exit replay");
assert(board.evidence.some((item) => item.id === "E-G04-S625-START" && item.verified));
for (const file of ["S625-exit-add-evidence.json", "S625-exit-add-matrix.json", "S625-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3642);
assert(board.evidence.some((item) => item.id === "E-G04-S625-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S625-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S625 validated exit replay passed at revision 3642; V02 remains Done and V03/EPIC-17 remain In Progress.");
