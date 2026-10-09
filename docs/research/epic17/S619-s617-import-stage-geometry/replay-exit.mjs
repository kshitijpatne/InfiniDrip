import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S619-s617-import-stage-geometry";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3614 && board.evidence.some((item) => item.id === "E-G04-S619-EXIT")) {
  console.log("S619 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3612, "refusing stale S619 exit replay");
for (const file of ["S619-exit-add-evidence.json", "S619-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3614);
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some((item) => item.id === "E-G04-S619-EXIT" && item.verified));
console.log("S619 validated exit replay passed at revision 3614; V03 remains In Progress.");
