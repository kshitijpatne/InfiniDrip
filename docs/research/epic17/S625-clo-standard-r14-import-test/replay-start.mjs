import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S625-clo-standard-r14-import-test";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3639 && board.evidence.some((item) => item.id === "E-G04-S625-START")) {
  console.log("S625 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3637, "refusing stale S625 start replay");
for (const file of ["S625-start-add-evidence.json", "S625-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3639);
assert(board.evidence.some((item) => item.id === "E-G04-S625-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S625 validated start replay passed at revision 3639; V03 remains In Progress.");
