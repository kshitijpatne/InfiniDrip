import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3439 && board.evidence.some(({ id }) => id === "E-G04-S581-START")) {
  console.log("S581 start already applied at revision 3439.");
  process.exit(0);
}
assert.equal(board.revision, 3437, "refusing stale or unexpected S581 start replay");
for (const name of ["S581-start-add-evidence.json", "S581-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S581-clo-internal-shape-info/${name}`], { stdio: "inherit" });
}
