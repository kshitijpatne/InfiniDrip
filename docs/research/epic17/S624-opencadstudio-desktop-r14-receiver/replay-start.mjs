import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S624-opencadstudio-desktop-r14-receiver";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3634 && board.evidence.some((item) => item.id === "E-G04-S624-START")) {
  console.log("S624 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3632, "refusing stale S624 start replay");
for (const file of ["S624-start-add-evidence.json", "S624-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3634);
assert(board.evidence.some((item) => item.id === "E-G04-S624-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S624 validated start replay passed at revision 3634; V03 remains In Progress.");
