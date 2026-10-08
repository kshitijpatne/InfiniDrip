import { execFileSync } from "node:child_process";

for (const name of ["S546-exit-add-evidence.json", "S546-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S546-polo-contour-delta-diagnosis/${name}`], { stdio: "inherit" });
}
