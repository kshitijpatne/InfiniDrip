import { execFileSync } from "node:child_process";

for (const name of ["S574-start-add-evidence.json", "S574-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S574-polo-line-chain-representation/${name}`], { stdio: "inherit" });
}
