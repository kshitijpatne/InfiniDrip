import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3421 && board.evidence.some(({ id }) => id === "E-G04-S576-EXIT")) {
  console.log("S576 exit commands are already applied at revision 3421; no replay needed.");
  process.exit(0);
}
if (board.revision !== 3419) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);

for (const name of ["S576-exit-add-evidence.json", "S576-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", "docs/research/epic17/S576-clo-project-geometry-audit/" + name], { stdio: "inherit" });
}
