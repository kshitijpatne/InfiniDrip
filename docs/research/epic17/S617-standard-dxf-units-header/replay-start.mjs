import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S617-standard-dxf-units-header";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3603 && board.evidence.some(({ id }) => id === "E-G04-S617-START")) {
  console.log("S617 start replay already applied at revision 3603.");
  process.exit(0);
}
assert.equal(board.revision, 3601, "refusing stale S617 start replay");
for (const file of ["S617-start-add-evidence.json", "S617-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3603);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S617-START" && uri === `${dir}/S617-start-packet.md` && verified));
console.log("S617 validated start replay passed at revision 3603.");
