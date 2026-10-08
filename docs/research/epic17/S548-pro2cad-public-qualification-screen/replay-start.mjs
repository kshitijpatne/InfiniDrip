import { execFileSync } from "node:child_process";

for (const name of ["S548-start-add-evidence.json", "S548-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `docs/research/epic17/S548-pro2cad-public-qualification-screen/${name}`], { stdio: "inherit" });
}
