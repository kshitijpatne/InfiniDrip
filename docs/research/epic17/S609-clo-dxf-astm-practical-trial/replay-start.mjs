import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const dir="docs/research/epic17/S609-clo-dxf-astm-practical-trial";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
if (board.revision===3570&&board.evidence.some(({id})=>id==="E-G04-S609-START")){console.log("S609 start replay already applied.");process.exit(0)}
assert.equal(board.revision,3566,"refusing stale S609 start replay");
for(const f of ["S609-start-add-evidence.json","S609-start-add-comment.json"]) execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${f}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3568);
assert.equal(board.workItems.find(({id})=>id==="EPIC-17")?.status,"In Progress");
assert.equal(board.workItems.find(({id})=>id==="G04-V02")?.status,"Done");
assert.equal(board.workItems.find(({id})=>id==="G04-V03")?.status,"In Progress");
assert(board.evidence.some(({id,uri,verified})=>id==="E-G04-S609-START"&&uri===`${dir}/S609-start-packet.md`&&verified));
console.log("S609 validated start replay passed at revision 3568.");
