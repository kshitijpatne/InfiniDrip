import { execFileSync } from "node:child_process";

for (const name of ["S572-exit-add-evidence.json", "S572-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S572-clo-polo-pre-export-stage-check/${name}`], { stdio: "inherit" });
}
