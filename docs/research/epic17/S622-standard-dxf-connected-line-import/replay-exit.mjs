import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S622-standard-dxf-connected-line-import";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3627 && board.evidence.some((item) => item.id === "E-G04-S622-MATRIX")) {
  console.log("S622 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3624, "refusing stale S622 exit replay");
for (const file of ["S622-exit-add-evidence.json", "S622-exit-add-comment.json", "S622-exit-add-matrix.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3627);
assert(board.evidence.some((item) => item.id === "E-G04-S622-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S622-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S622 validated exit replay passed at revision 3627; V03 remains In Progress.");
