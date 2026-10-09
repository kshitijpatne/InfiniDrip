import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3447 && board.evidence.some(({ id }) => id === "E-G04-S583-START")) {
  console.log("S583 start already applied at revision 3447.");
  process.exit(0);
}
assert.equal(board.revision, 3445, "refusing stale or unexpected S583 start replay");
for (const name of ["S583-start-add-evidence.json", "S583-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S583-clo-pattern-info-getters/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3447);
assert.equal(after.workItems.find(({ id }) => id === "G04-V02").status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03").status, "In Progress");
