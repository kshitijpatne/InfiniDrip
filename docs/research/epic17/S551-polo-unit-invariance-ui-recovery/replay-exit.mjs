import { execFileSync } from "node:child_process";

for (const name of ["S551-exit-add-evidence.json", "S551-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S551-polo-unit-invariance-ui-recovery/${name}`], { stdio: "inherit" });
}
