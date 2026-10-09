import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S627-woven-zero-vent-source-repair";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3649 && board.evidence.some((item) => item.id === "E-G04-S627-START")) {
  console.log("S627 start replay already applied.");
  process.exit(0);
}
if (board.revision === 3652 && board.evidence.some((item) => item.id === "E-G04-S627-START")
  && board.evidence.some((item) => item.id === "E-G04-S627-EXIT")) {
  console.log("S627 start and exit replays already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3647, "refusing stale S627 start replay");
for (const file of ["S627-start-add-evidence.json", "S627-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3649);
assert(board.evidence.some((item) => item.id === "E-G04-S627-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S627 validated start replay passed at revision 3649; V02 remains Done and V03/EPIC-17 remain In Progress.");
