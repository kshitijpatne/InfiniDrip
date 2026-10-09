import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S633-v03-gate-reconciliation";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3674,"refusing stale S633 exit replay");
for(const file of ["S633-exit-add-evidence.json","S633-exit-add-comment.json"])
  execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${file}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3676);
assert(board.evidence.some(x=>x.id==="E-G04-S633-EXIT"&&x.verified));
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
console.log("S633 validated exit replay passed at board revision 3676; acceptance statuses unchanged.");
