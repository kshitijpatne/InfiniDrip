import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S627-woven-zero-vent-source-repair";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3652 && board.evidence.some((item) => item.id === "E-G04-S627-EXIT")
  && board.evidence.some((item) => item.id === "E-G04-S627-MATRIX")) {
  console.log("S627 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3649, "refusing stale S627 exit replay");
assert(board.evidence.some((item) => item.id === "E-G04-S627-START" && item.verified));
for (const file of ["S627-exit-add-evidence.json", "S627-exit-add-matrix.json", "S627-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3652);
assert(board.evidence.some((item) => item.id === "E-G04-S627-EXIT" && item.verified));
assert(board.evidence.some((item) => item.id === "E-G04-S627-MATRIX" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S627 validated exit replay passed at board revision 3652; V02/V03/EPIC statuses are unchanged.");
