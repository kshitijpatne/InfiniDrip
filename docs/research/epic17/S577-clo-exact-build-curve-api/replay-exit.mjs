import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3425 && board.evidence.some(({ id }) => id === "E-G04-S577-EXIT")) {
  console.log("S577 exit commands are already applied at revision 3425; no replay needed.");
  process.exit(0);
}
if (board.revision !== 3423) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);

for (const name of ["S577-exit-add-evidence.json", "S577-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", "docs/research/epic17/S577-clo-exact-build-curve-api/" + name], { stdio: "inherit" });
}
