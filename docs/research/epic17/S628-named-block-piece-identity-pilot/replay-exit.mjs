import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S628-named-block-piece-identity-pilot";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3656 && board.evidence.some((item) => item.id === "E-G04-S628-EXIT")) {
  console.log("S628 exit replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3654, "refusing stale S628 exit replay");
assert(board.evidence.some((item) => item.id === "E-G04-S628-START" && item.verified));
for (const file of ["S628-exit-add-evidence.json", "S628-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3656);
assert(board.evidence.some((item) => item.id === "E-G04-S628-EXIT" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S628 validated exit replay passed at board revision 3656; all G04 statuses are unchanged.");
