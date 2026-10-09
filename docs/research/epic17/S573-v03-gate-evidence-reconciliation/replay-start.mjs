import { execFileSync } from "node:child_process";

for (const name of ["S573-start-add-evidence.json", "S573-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S573-v03-gate-evidence-reconciliation/${name}`], { stdio: "inherit" });
}
