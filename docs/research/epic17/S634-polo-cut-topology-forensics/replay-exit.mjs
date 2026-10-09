import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S634-polo-cut-topology-forensics";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3678, "refusing stale S634 exit replay");
for (const file of ["S634-exit-add-evidence.json", "S634-exit-add-comment.json"])
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3680);
assert(board.evidence.some((entry) => entry.id === "E-G04-S634-EXIT" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
console.log("S634 validated exit replay passed at board revision 3680; all acceptance statuses and holds are unchanged.");
