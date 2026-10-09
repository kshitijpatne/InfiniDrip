import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S614-standard-dxf-import-mode";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3588 && board.evidence.some(({ id }) => id === "E-G04-S614-START")) {
  console.log("S614 start replay already applied at revision 3588.");
  process.exit(0);
}
assert.equal(board.revision, 3586, "refusing stale S614 start replay");
for (const file of ["S614-start-add-evidence.json", "S614-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3588);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-START" && uri === `${dir}/S614-start-packet.md` && verified));
console.log("S614 validated start replay passed at revision 3588.");
