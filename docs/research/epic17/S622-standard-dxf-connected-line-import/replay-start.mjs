import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S622-standard-dxf-connected-line-import";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3624 && board.evidence.some((item) => item.id === "E-G04-S622-START")) {
  console.log("S622 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3622, "refusing stale S622 start replay");
for (const file of ["S622-start-add-evidence.json", "S622-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3624);
assert(board.evidence.some((item) => item.id === "E-G04-S622-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
console.log("S622 validated start replay passed at revision 3624; V03 remains In Progress.");
