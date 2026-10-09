import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3467 && board.evidence.some(({ id }) => id === "E-G04-S588-START")) {
  console.log("S588 start already applied at revision 3467.");
  process.exit(0);
}
assert.equal(board.revision, 3465, "refusing stale or unexpected S588 start replay");
for (const name of ["S588-start-add-evidence.json", "S588-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S588-xdata-retention-pilot/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3467);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S588-START"));
console.log("S588 validated start replay passed at revision 3467.");
