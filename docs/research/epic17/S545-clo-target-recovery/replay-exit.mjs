import { execFileSync } from "node:child_process";

for (const name of ["S545-exit-add-evidence.json", "S545-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S545-clo-target-recovery/${name}`], { stdio: "inherit" });
}
