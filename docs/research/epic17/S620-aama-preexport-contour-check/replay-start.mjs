import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S620-aama-preexport-contour-check";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3616 && board.evidence.some((item) => item.id === "E-G04-S620-START")) {
  console.log("S620 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3614, "refusing stale S620 start replay");
for (const file of ["S620-start-add-evidence.json", "S620-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3616);
assert(board.evidence.some((item) => item.id === "E-G04-S620-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S620 validated start replay passed at revision 3616.");
