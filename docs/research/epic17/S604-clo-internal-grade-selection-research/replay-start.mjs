import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S604-clo-internal-grade-selection-research";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3548 && board.evidence.some(({ id }) => id === "E-G04-S604-START")) {
  console.log("S604 start replay already applied at revision 3548.");
  process.exit(0);
}
assert.equal(board.revision, 3546, "refusing stale S604 start replay");
for (const file of ["S604-start-add-evidence.json", "S604-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3548);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S604-START" && uri === `${dir}/S604-start-packet.md` && verified));
console.log("S604 start replay passed at revision 3548; no acceptance/status change.");
