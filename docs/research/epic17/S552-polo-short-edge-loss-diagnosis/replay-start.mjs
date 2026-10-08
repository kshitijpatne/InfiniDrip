import { execFileSync } from "node:child_process";

for (const name of ["S552-start-add-evidence.json", "S552-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S552-polo-short-edge-loss-diagnosis/${name}`], { stdio: "inherit" });
}
