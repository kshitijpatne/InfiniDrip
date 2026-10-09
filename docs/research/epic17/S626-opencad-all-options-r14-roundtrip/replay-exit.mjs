import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S626-opencad-all-options-r14-roundtrip";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3647 && board.evidence.some((item) => item.id === "E-G04-S626-MATRIX")) {
  console.log("S626 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3644, "refusing stale S626 exit replay");
assert(board.evidence.some((item) => item.id === "E-G04-S626-START" && item.verified));
for (const file of ["S626-exit-add-evidence.json", "S626-exit-add-matrix.json", "S626-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3647);
assert(board.evidence.some((item) => item.id === "E-G04-S626-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S626-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S626 validated exit replay passed at revision 3647; V02 remains Done and V03/EPIC-17 remain In Progress.");
