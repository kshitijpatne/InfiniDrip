import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S605-clo-readonly-internal-geometry";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3552 && board.evidence.some(({ id }) => id === "E-G04-S605-START")) {
  console.log("S605 start replay already applied at revision 3552.");
  process.exit(0);
}
assert.equal(board.revision, 3550, "refusing stale S605 start replay");
for (const file of ["S605-start-add-evidence.json", "S605-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3552);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S605-START" && uri === `${dir}/S605-start-packet.md` && verified));
console.log("S605 validated start replay passed at revision 3552; no acceptance/status change.");
