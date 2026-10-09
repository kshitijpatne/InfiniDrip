import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S615-standard-dxf-explicit-scale";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3593 && board.evidence.some(({ id }) => id === "E-G04-S615-START")) {
  console.log("S615 start replay already applied at revision 3593.");
  process.exit(0);
}
assert.equal(board.revision, 3591, "refusing stale S615 start replay");
for (const file of ["S615-start-add-evidence.json", "S615-start-add-comment.json"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3593);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-START" && uri === `${dir}/S615-start-packet.md` && verified));
console.log("S615 validated start replay passed at revision 3593.");
