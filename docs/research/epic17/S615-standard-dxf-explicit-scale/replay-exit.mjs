import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S615-standard-dxf-explicit-scale";
for (const file of ["S615-exit-add-evidence.json", "S615-exit-add-comment.json", "S615-exit-add-matrix-evidence.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3596);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-EXIT" && uri === `${dir}/S615-exit-packet.md` && verified));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-MATRIX" && uri === `${dir}/V03-CURRENT-GATE-MATRIX-S615.md` && verified));
console.log("S615 validated exit replay passed at revision 3596.");
