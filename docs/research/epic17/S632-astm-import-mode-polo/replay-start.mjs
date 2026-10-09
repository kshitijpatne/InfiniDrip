import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S632-astm-import-mode-polo";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3668,"refusing stale S632 start replay");
for(const file of ["S632-start-add-evidence.json","S632-start-add-comment.json"])
  execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${file}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3670);
assert(board.evidence.some(x=>x.id==="E-G04-S632-START"&&x.verified));
assert.equal(board.workItems.find(x=>x.id==="G04-V01")?.status,"Done");
assert.equal(board.workItems.find(x=>x.id==="G04-V02")?.status,"Done");
for(const id of ["G04-V03","EPIC-17"])assert.equal(board.workItems.find(x=>x.id===id)?.status,"In Progress");
console.log("S632 validated start replay passed at board revision 3670; acceptance statuses unchanged.");
