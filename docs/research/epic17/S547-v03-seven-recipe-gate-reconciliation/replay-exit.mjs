import { execFileSync } from "node:child_process";

for (const name of ["S547-exit-add-evidence.json", "S547-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S547-v03-seven-recipe-gate-reconciliation/${name}`], { stdio: "inherit" });
}
