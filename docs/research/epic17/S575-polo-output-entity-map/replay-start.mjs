import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if ([3415, 3417].includes(board.revision) && board.evidence.some(({ id }) => id === "E-G04-S575-START")) {
  console.log(`S575 admission commands are already applied at revision ${board.revision}; no replay needed.`);
  process.exit(0);
}
if (board.revision !== 3413) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);

for (const name of ["S575-start-add-evidence.json", "S575-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", "docs/research/epic17/S575-polo-output-entity-map/" + name], { stdio: "inherit" });
}
