import { execFileSync } from "node:child_process";
for(const name of ["S552-exit-add-evidence.json","S552-exit-add-comment.json"])
 execFileSync(process.execPath,["ops/control-center/cli.mjs",`docs/research/epic17/S552-polo-short-edge-loss-diagnosis/${name}`],{stdio:"inherit"});
