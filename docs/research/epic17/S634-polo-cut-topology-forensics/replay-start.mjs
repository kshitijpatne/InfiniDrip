import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S634-polo-cut-topology-forensics";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3676,"refusing stale S634 start replay");
for(const file of ["S634-start-add-evidence.json","S634-start-add-comment.json"])
  execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${file}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3678);
assert(board.evidence.some(x=>x.id==="E-G04-S634-START"&&x.verified));
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
console.log("S634 validated start replay passed at board revision 3678; acceptance statuses unchanged.");
