import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
if(board.revision===3427){for(const n of ["S578-exit-add-evidence.json","S578-exit-add-comment.json"]){const c=JSON.parse(await readFile(new URL("./"+n,import.meta.url),"utf8"));assert.equal(c.expectedRevision,board.revision);board=applyBoardCommand(board,c,{now:"2026-10-09T05:00:47.000Z"});}}
else {assert.ok([3429,3431].includes(board.revision));assert.ok(board.evidence.some(({id})=>id==="E-G04-S578-EXIT"));}
assert.ok([3429,3431].includes(board.revision));assert.equal(board.epics.find(({id})=>id==="EPIC-17")?.status,"In Progress");assert.equal(board.workItems.find(({id})=>id==="G04-V03")?.status,"In Progress");assert.equal(board.workItems.find(({id})=>id==="G04-V02")?.status,"Done");
console.log(`S578 exit preflight passed at board revision ${board.revision}; statuses unchanged.`);
