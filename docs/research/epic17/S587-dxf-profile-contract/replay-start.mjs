import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3463 && board.evidence.some(({ id }) => id === "E-G04-S587-START")) {
  console.log("S587 start already applied at revision 3463.");
  process.exit(0);
}
assert.equal(board.revision, 3461, "refusing stale or unexpected S587 start replay");
for (const name of ["S587-start-add-evidence.json", "S587-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S587-dxf-profile-contract/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3463);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S587-START"));
console.log("S587 validated start replay passed at revision 3463.");
