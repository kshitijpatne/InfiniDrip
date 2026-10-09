import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S593-polo-cut-output-topology";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3493 && board.evidence.some(({ id }) => id === "E-G04-S593-START")) {
  console.log("S593 start already applied at revision 3493.");
  process.exit(0);
}
assert.equal(board.revision, 3491, "refusing stale S593 start replay");
for (const name of ["S593-start-add-evidence.json", "S593-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3493);
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S593 start replay passed at revision 3493; Epic/V02/V03 statuses are preserved.");
