import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S610-astm-vertex-loss-source-diagnosis";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3574 && board.evidence.some(({ id }) => id === "E-G04-S610-EXIT")) {
  console.log("S610 exit replay already applied at revision 3574.");
  process.exit(0);
}
assert.equal(board.revision, 3572, "refusing stale S610 exit replay");
for (const file of ["S610-exit-add-evidence.json", "S610-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3574);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S610-EXIT" && uri === `${dir}/S610-exit-packet.md` && verified));
console.log("S610 validated exit replay passed at revision 3574; all G04 statuses remain unchanged.");
