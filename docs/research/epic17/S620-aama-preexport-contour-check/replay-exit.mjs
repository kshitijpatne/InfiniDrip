import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S620-aama-preexport-contour-check";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3618 && board.evidence.some((item) => item.id === "E-G04-S620-EXIT")) {
  console.log("S620 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3616, "refusing stale S620 exit replay");
for (const file of ["S620-exit-add-evidence.json", "S620-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3618);
assert(board.evidence.some((item) => item.id === "E-G04-S620-EXIT" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S620 validated exit replay passed at revision 3618; V03 remains In Progress.");
