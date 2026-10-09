import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3437 && board.evidence.some(({ id }) => id === "E-G04-S580-EXIT")) {
  console.log("S580 exit already applied at revision 3437.");
  process.exit(0);
}
assert.equal(board.revision, 3435, "refusing stale or unexpected S580 exit replay");
for (const name of ["S580-exit-add-evidence.json", "S580-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S580-clo-line-info-runtime/${name}`], { stdio: "inherit" });
}
