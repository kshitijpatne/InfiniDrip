import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir="docs/research/epic17/S634-polo-cut-topology-forensics";
const packet=await readFile(`${dir}/S634-start-packet.md`,"utf8");
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),"cf367686b74b4572662d23b9cf12c459e1de4308");
execFileSync("git",["merge-base","--is-ancestor","origin/main","HEAD"]);
const subjects=execFileSync("git",["log","--all","--format=%s"],{encoding:"utf8"}).split(/\r?\n/u);
const max=Math.max(...subjects.map(x=>/^Slice (\d+):/u.exec(x)?.[1]).filter(Boolean).map(Number));
assert.equal(max,633);
assert.equal(board.revision,3676);
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert.match(packet,/same centimeter-header source/u); assert.match(packet,/Do not edit source geometry/u);
console.log("S634 start preflight passed: committed S633 base, origin/main ancestry, unique slice 634, board revision 3676, preserved statuses and source-edit hold.");
