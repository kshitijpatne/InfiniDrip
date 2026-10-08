import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {applyBoardCommand} from "../../../../ops/control-center/commands.mjs";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
for(const name of ["S553-start-add-evidence.json","S553-start-add-comment.json"]){const cmd=JSON.parse(await readFile(new URL(`./${name}`,import.meta.url),"utf8"));assert.equal(cmd.expectedRevision,board.revision);board=applyBoardCommand(board,cmd,{now:"2026-10-08T23:23:21.000Z"});}
assert.equal(board.revision,3327);assert.equal(board.workItems.find(({id})=>id==="G04-V03")?.status,"In Progress");
console.log("S553 start preflight passed at revision 3327; no file written.");
