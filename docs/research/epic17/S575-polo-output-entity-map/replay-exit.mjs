import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3417 && board.evidence.some(({ id }) => id === "E-G04-S575-EXIT")) {
  console.log("S575 exit commands are already applied at revision 3417; no replay needed.");
  process.exit(0);
}
if (board.revision !== 3415) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);

for (const name of ["S575-exit-add-evidence.json", "S575-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", "docs/research/epic17/S575-polo-output-entity-map/" + name], { stdio: "inherit" });
}
