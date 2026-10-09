import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S611-free-local-apparel-cad-alternatives";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3578 && board.evidence.some(({ id }) => id === "E-G04-S611-EXIT")) {
  console.log("S611 exit replay already applied at revision 3578.");
  process.exit(0);
}
assert.equal(board.revision, 3576, "refusing stale S611 exit replay");
for (const file of ["S611-exit-add-evidence.json", "S611-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3578);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S611-EXIT" && uri === `${dir}/S611-exit-packet.md` && verified));
console.log("S611 validated exit replay passed at revision 3578; G04 remains in progress.");
