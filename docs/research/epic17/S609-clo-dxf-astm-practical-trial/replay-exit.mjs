import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S609-clo-dxf-astm-practical-trial";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3570 && board.evidence.some(({ id }) => id === "E-G04-S609-EXIT")) {
  console.log("S609 exit replay already applied at revision 3570.");
  process.exit(0);
}
assert.equal(board.revision, 3568, "refusing stale S609 exit replay");
for (const file of ["S609-exit-add-evidence.json", "S609-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3570);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S609-EXIT" && uri === `${dir}/S609-exit-packet.md` && verified));
console.log("S609 validated exit replay passed at revision 3570; all gate statuses remain unchanged.");
