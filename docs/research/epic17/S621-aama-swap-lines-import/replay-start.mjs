import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S621-aama-swap-lines-import";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3620 && board.evidence.some((item) => item.id === "E-G04-S621-START")) {
  console.log("S621 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3618, "refusing stale S621 start replay");
for (const file of ["S621-start-add-evidence.json", "S621-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3620);
assert(board.evidence.some((item) => item.id === "E-G04-S621-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S621 validated start replay passed at revision 3620; V03 remains In Progress.");
