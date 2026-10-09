import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S632-astm-import-mode-polo";
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3670,"refusing stale S632 exit replay");
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert(board.evidence.some(x=>x.id==="E-G04-S632-START"&&x.verified));
const evidence=JSON.parse(await readFile(`${dir}/S632-exit-add-evidence.json`,"utf8"));
const comment=JSON.parse(await readFile(`${dir}/S632-exit-add-comment.json`,"utf8"));
assert.equal(evidence.expectedRevision,3670); assert.equal(comment.expectedRevision,3671);
assert.match(evidence.evidence.uri,/S632-exit-packet\.md/u);
console.log("S632 board replay preflight passed at revision 3670; G04 statuses/acceptance and sequential evidence/comment revisions verified.");
