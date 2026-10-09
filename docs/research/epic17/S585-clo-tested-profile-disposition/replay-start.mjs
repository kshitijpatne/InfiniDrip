import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3455 && board.evidence.some(({ id }) => id === "E-G04-S585-START")) {
  console.log("S585 start already applied at revision 3455.");
  process.exit(0);
}
assert.equal(board.revision, 3453, "refusing stale or unexpected S585 start replay");
for (const name of ["S585-start-add-evidence.json", "S585-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S585-clo-tested-profile-disposition/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3455);
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S585-START"));
console.log("S585 validated start replay passed at revision 3455.");
