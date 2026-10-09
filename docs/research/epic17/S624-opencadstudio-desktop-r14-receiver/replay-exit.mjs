import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S624-opencadstudio-desktop-r14-receiver";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3637 && board.evidence.some((item) => item.id === "E-G04-S624-MATRIX")) {
  console.log("S624 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3634, "refusing stale S624 exit replay");
for (const file of ["S624-exit-add-evidence.json", "S624-exit-add-matrix.json", "S624-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3637);
assert(board.evidence.some((item) => item.id === "E-G04-S624-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S624-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S624 validated exit replay passed at revision 3637; V03 and EPIC-17 remain In Progress.");
