import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S614-standard-dxf-import-mode";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3588) {
  for (const file of ["S614-exit-add-evidence.json", "S614-exit-add-comment.json"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
  board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
}
if (board.revision === 3590 && board.evidence.some(({ id }) => id === "E-G04-S614-EXIT")) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/S614-exit-add-matrix-evidence.json`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3591);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-EXIT" && uri === `${dir}/S614-exit-packet.md` && verified));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-MATRIX" && uri === `${dir}/V03-CURRENT-GATE-MATRIX-S614.md` && verified));
console.log("S614 validated exit replay passed at revision 3591.");
