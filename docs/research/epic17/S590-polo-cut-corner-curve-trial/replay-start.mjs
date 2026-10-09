import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const dir = "docs/research/epic17/S590-polo-cut-corner-curve-trial";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3473, "refusing stale/unexpected S590 start");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S590-start-add-evidence.json", "S590-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3475);
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S590-START"));
console.log("S590 start replay passed at revision 3475; V03 remains In Progress.");
