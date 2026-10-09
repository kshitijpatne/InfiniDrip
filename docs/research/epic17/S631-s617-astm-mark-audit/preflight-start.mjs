import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S631-s617-astm-mark-audit";
const packet=await readFile(`${dir}/S631-start-packet.md`,"utf8");
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
const head=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
assert.equal(head,"4b5be3619c3b3398197a03044b6feefa464e962e");
execFileSync("git",["merge-base","--is-ancestor","origin/main","HEAD"]);
const max=Number(execFileSync("git",["log","--all","--format=%s"],{encoding:"utf8"}).split(/\r?\n/u).map(s=>/^Slice (\d+):/u.exec(s)?.[1]).filter(Boolean).map(Number).reduce((a,b)=>Math.max(a,b),0));
assert.equal(max,630);
assert.equal(board.revision,3666);
assert.equal(board.workItems.find(x=>x.id==="G04-V02")?.status,"Done");
for(const id of ["G04-V03","EPIC-17"])assert.equal(board.workItems.find(x=>x.id===id)?.status,"In Progress");
assert(board.evidence.some(x=>x.id==="E-G04-S631-START"&&x.verified));
assert.match(packet,/offline audit/u);
assert.match(packet,/do not describe it as an ASTM import/iu);
console.log("S631 post-replay start preflight passed: clean S630 base, origin/main ancestry, unique slice 631, board revision 3666 and status unchanged.");
