import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S631-s617-astm-mark-audit";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3664,"refusing stale S631 start replay");
for(const file of ["S631-start-add-evidence.json","S631-start-add-comment.json"])
  execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${file}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3666);
assert(board.evidence.some(x=>x.id==="E-G04-S631-START"&&x.verified));
assert.equal(board.workItems.find(x=>x.id==="G04-V02")?.status,"Done");
for(const id of ["G04-V03","EPIC-17"])assert.equal(board.workItems.find(x=>x.id===id)?.status,"In Progress");
console.log("S631 validated start replay passed at board revision 3666; G04 statuses unchanged.");
