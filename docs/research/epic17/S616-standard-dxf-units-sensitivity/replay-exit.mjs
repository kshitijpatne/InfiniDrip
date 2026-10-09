import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S616-standard-dxf-units-sensitivity";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3601 && board.evidence.some(({ id }) => id === "E-G04-S616-MATRIX")) {
  console.log("S616 exit replay already applied at revision 3601.");
  process.exit(0);
}
assert.equal(board.revision, 3598, "refusing stale S616 exit replay");
for (const file of ["S616-exit-add-evidence.json", "S616-exit-add-comment.json", "S616-exit-add-matrix.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3601);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const id of ["E-G04-S616-EXIT", "E-G04-S616-MATRIX"]) assert(board.evidence.some((entry) => entry.id === id && entry.verified));
console.log("S616 validated exit replay passed at revision 3601.");
