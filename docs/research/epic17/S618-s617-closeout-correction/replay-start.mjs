import assert from "node:assert/strict"; import {execFileSync} from "node:child_process"; import {readFile} from "node:fs/promises";
const dir="docs/research/epic17/S618-s617-closeout-correction";
let board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
if(board.revision===3608&&board.evidence.some(x=>x.id==="E-G04-S618-START")){console.log("S618 start replay already applied.");process.exit(0)}
assert.equal(board.revision,3606,"refusing stale S618 start replay");
for(const f of ["S618-start-add-evidence.json","S618-start-add-comment.json"])execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${f}`],{stdio:"inherit"});
board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));assert.equal(board.revision,3608);assert(board.evidence.some(x=>x.id==="E-G04-S618-START"&&x.verified));
console.log("S618 validated start replay passed at revision 3608.");
