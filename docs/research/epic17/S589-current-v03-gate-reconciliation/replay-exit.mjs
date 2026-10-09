import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S589-current-v03-gate-reconciliation";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3473 && board.evidence.some(({ id }) => id === "E-G04-S589-EXIT")) {
  console.log("S589 exit already applied at revision 3473.");
  process.exit(0);
}
assert.equal(board.revision, 3471, "refusing stale S589 exit replay");
for (const name of ["S589-exit-add-evidence.json", "S589-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3473);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S589-EXIT"));
console.log("S589 exit replay passed at 3473; no status or gate was changed.");
