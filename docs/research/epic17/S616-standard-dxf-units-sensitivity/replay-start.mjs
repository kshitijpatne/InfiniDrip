import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S616-standard-dxf-units-sensitivity";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3598 && board.evidence.some(({ id }) => id === "E-G04-S616-START")) {
  console.log("S616 start replay already applied at revision 3598.");
  process.exit(0);
}
assert.equal(board.revision, 3596, "refusing stale S616 start replay");
for (const file of ["S616-start-add-evidence.json", "S616-start-add-comment.json"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3598);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S616-START" && uri === `${dir}/S616-start-packet.md` && verified));
console.log("S616 validated start replay passed at revision 3598.");
