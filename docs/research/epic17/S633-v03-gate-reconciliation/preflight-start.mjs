import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S633-v03-gate-reconciliation";
const expectedHead="b107d9568db2d3cfed4f3473c40778b9d060edf1";
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),expectedHead);
execFileSync("git",["merge-base","--is-ancestor","origin/main","HEAD"]);
const subjects=execFileSync("git",["log","--all","--format=%s"],{encoding:"utf8"}).split(/\r?\n/u);
const max=Math.max(...subjects.map(x=>/^Slice (\d+):/u.exec(x)?.[1]).filter(Boolean).map(Number));
assert.equal(max,632);
assert.equal(board.revision,3672);
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert.match(await readFile(`${dir}/S633-start-packet.md`,"utf8"),/S628–S632/u);
console.log("S633 start preflight passed: committed S632 base, origin/main ancestry, unique slice 633, board revision 3672, acceptance statuses and scope.");
