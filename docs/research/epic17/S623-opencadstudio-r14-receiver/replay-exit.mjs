import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S623-opencadstudio-r14-receiver";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3632 && board.evidence.some((item) => item.id === "E-G04-S623-MATRIX")) {
  console.log("S623 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3629, "refusing stale S623 exit replay");
for (const file of ["S623-exit-add-evidence.json", "S623-exit-add-matrix.json", "S623-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3632);
assert(board.evidence.some((item) => item.id === "E-G04-S623-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S623-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S623 validated exit replay passed at revision 3632; V03 and EPIC-17 remain In Progress.");
