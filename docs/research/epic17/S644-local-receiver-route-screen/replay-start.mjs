import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S644-local-receiver-route-screen";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3718, "refusing stale S644 start replay");
for (const file of ["S644-start-add-evidence.json", "S644-start-add-comment.json"])
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3720);
assert(board.evidence.some((entry) => entry.id === "E-G04-S644-START" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
console.log("S644 validated start replay passed at board revision 3720; all G04 statuses are preserved.");
