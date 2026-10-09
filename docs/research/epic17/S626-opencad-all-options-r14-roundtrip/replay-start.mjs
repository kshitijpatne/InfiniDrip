import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S626-opencad-all-options-r14-roundtrip";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3644 && board.evidence.some((item) => item.id === "E-G04-S626-START")) {
  console.log("S626 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3642, "refusing stale S626 start replay");
for (const file of ["S626-start-add-evidence.json", "S626-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3644);
assert(board.evidence.some((item) => item.id === "E-G04-S626-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S626 validated start replay passed at revision 3644; Epic/V03 remain In Progress and V02 remains Done.");
