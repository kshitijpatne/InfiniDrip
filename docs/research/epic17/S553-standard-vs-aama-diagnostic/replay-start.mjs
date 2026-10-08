import {execFileSync} from "node:child_process";
for(const name of ["S553-start-add-evidence.json","S553-start-add-comment.json"])execFileSync(process.execPath,["ops/control-center/cli.mjs",`docs/research/epic17/S553-standard-vs-aama-diagnostic/${name}`],{stdio:"inherit"});
