import { execFileSync } from "node:child_process";

for (const name of ["S572-start-add-evidence.json", "S572-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S572-clo-polo-pre-export-stage-check/${name}`], { stdio: "inherit" });
}
