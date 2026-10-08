import { execFileSync } from "node:child_process";

for (const name of ["S550-exit-add-evidence.json", "S550-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S550-polo-unit-invariance-control/${name}`], { stdio: "inherit" });
}
