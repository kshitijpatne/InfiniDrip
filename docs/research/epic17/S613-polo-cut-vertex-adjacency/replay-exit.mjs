import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S613-polo-cut-vertex-adjacency";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3586 && board.evidence.some(({ id }) => id === "E-G04-S613-EXIT")) {
  console.log("S613 exit replay already applied at revision 3586.");
  process.exit(0);
}
assert.equal(board.revision, 3584, "refusing stale S613 exit replay");
for (const file of ["S613-exit-add-evidence.json", "S613-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3586);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S613-EXIT" && uri === `${dir}/S613-exit-packet.md` && verified));
console.log("S613 validated exit replay passed at revision 3586.");
