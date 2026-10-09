import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const board = JSON.parse(readFileSync("ops/control-center/data/board.json", "utf8"));
if ([3427, 3429].includes(board.revision) && board.evidence.some(({ id }) => id === "E-G04-S578-START")) {
  console.log(`S578 start commands already applied at revision ${board.revision}; no replay needed.`);
  process.exit(0);
}
if (board.revision !== 3425) throw new Error(`Unexpected board revision ${board.revision}; refusing stale replay.`);
for (const name of ["S578-start-add-evidence.json", "S578-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S578-clo-outline-api-smoke/${name}`], { stdio: "inherit" });
}
