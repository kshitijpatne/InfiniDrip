import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {applyBoardCommand} from "../../../../ops/control-center/commands.mjs";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
for(const name of ["S553-exit-add-evidence.json","S553-exit-add-comment.json"]){const cmd=JSON.parse(await readFile(new URL(`./${name}`,import.meta.url),"utf8"));assert.equal(cmd.expectedRevision,board.revision);board=applyBoardCommand(board,cmd,{now:"2026-10-08T23:27:54.000Z"});}
assert.equal(board.revision,3329);assert.equal(board.workItems.find(({id})=>id==="G04-V03")?.status,"In Progress");assert.ok(board.workItems.find(({id})=>id==="G04-V03")?.evidenceRefs.includes("E-G04-S553-EXIT"));
console.log("S553 exit preflight passed at revision 3329; no file written.");
