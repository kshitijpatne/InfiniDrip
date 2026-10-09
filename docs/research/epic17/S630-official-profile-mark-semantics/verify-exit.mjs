import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateBoard } from "../../../../ops/control-center/board-core.mjs";

const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3664);
assert(validateBoard(board).valid);
assert(board.evidence.some(x=>x.id==="E-G04-S630-START"&&x.verified));
assert(board.evidence.some(x=>x.id==="E-G04-S630-EXIT"&&x.verified));
assert.equal(board.workItems.find(x=>x.id==="G04-V02")?.status,"Done");
for(const id of ["G04-V03","EPIC-17"])assert.equal(board.workItems.find(x=>x.id===id)?.status,"In Progress");
console.log("S630 exit verified at board revision 3664; board valid and acceptance statuses unchanged.");
