import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S617-standard-dxf-units-header";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3606 && board.evidence.some(({ id }) => id === "E-G04-S617-MATRIX")) {
  console.log("S617 exit replay already applied at revision 3606.");
  process.exit(0);
}
assert.equal(board.revision, 3603, "refusing stale S617 exit replay");
for (const file of ["S617-exit-add-evidence.json", "S617-exit-add-matrix.json", "S617-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3606);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const id of ["E-G04-S617-EXIT", "E-G04-S617-MATRIX"]) assert(board.evidence.some((entry) => entry.id === id && entry.verified));
console.log("S617 validated exit replay passed at revision 3606; V03 remains In Progress and every hold is preserved.");
