import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S613-polo-cut-vertex-adjacency";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3584 && board.evidence.some(({ id }) => id === "E-G04-S613-START")) {
  console.log("S613 start replay already applied at revision 3584.");
  process.exit(0);
}
assert.equal(board.revision, 3582, "refusing stale S613 start replay");
for (const file of ["S613-start-add-evidence.json", "S613-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3584);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S613-START" && uri === `${dir}/S613-start-packet.md` && verified));
console.log("S613 validated start replay passed at revision 3584.");
