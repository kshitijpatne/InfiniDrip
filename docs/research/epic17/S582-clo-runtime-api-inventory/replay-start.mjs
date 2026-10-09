import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3443 && board.evidence.some(({ id }) => id === "E-G04-S582-START")) {
  console.log("S582 start already applied at revision 3443.");
  process.exit(0);
}
assert.equal(board.revision, 3441, "refusing stale or unexpected S582 start replay");
for (const name of ["S582-start-add-evidence.json", "S582-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S582-clo-runtime-api-inventory/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3443);
assert.equal(after.workItems.find(({ id }) => id === "G04-V02").status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03").status, "In Progress");
