import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateBoard } from "../../../../ops/control-center/board-core.mjs";

const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3672);
assert(validateBoard(board).valid);
for(const id of ["E-G04-S632-START","E-G04-S632-EXIT"])assert(board.evidence.some(x=>x.id===id&&x.verified));
assert.equal(board.workItems.find(x=>x.id==="G04-V02")?.status,"Done");
for(const id of ["G04-V03","EPIC-17"])assert.equal(board.workItems.find(x=>x.id===id)?.status,"In Progress");
console.log("S632 exit verified: canonical board valid at revision 3672 and G04 statuses preserved.");
