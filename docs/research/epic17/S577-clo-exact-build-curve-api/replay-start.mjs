import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if ([3423, 3425].includes(board.revision) && board.evidence.some(({ id }) => id === "E-G04-S577-START")) {
  console.log(`S577 start commands are already applied at revision ${board.revision}; no replay needed.`);
  process.exit(0);
}
if (board.revision !== 3421) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);

for (const name of ["S577-start-add-evidence.json", "S577-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", "docs/research/epic17/S577-clo-exact-build-curve-api/" + name], { stdio: "inherit" });
}
