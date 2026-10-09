import {execFileSync} from "node:child_process"; import {readFileSync} from "node:fs";
const b=JSON.parse(readFileSync("ops/control-center/data/board.json","utf8"));
if([3429,3431].includes(b.revision)&&b.evidence.some(({id})=>id==="E-G04-S578-EXIT")){console.log(`S578 exit commands already applied at revision ${b.revision}; no replay needed.`);process.exit(0);}
if(b.revision!==3427)throw new Error(`Unexpected board revision ${b.revision}; refusing stale replay.`);
for(const n of ["S578-exit-add-evidence.json","S578-exit-add-comment.json"])execFileSync(process.execPath,["ops/control-center/cli.mjs",`docs/research/epic17/S578-clo-outline-api-smoke/${n}`],{stdio:"inherit"});
