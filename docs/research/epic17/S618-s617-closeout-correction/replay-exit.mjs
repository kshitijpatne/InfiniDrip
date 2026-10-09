import assert from "node:assert/strict";import {execFileSync}from"node:child_process";import{readFile}from"node:fs/promises";
const dir="docs/research/epic17/S618-s617-closeout-correction";let b=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
if(b.revision===3610&&b.evidence.some(x=>x.id==="E-G04-S618-EXIT")){console.log("S618 exit replay already applied.");process.exit(0)}
assert.equal(b.revision,3608,"refusing stale S618 exit replay");for(const f of["S618-exit-add-evidence.json","S618-exit-add-comment.json"])execFileSync(process.execPath,["ops/control-center/cli.mjs",`${dir}/${f}`],{stdio:"inherit"});
b=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));assert.equal(b.revision,3610);assert.equal(b.workItems.find(x=>x.id==="G04-V03")?.status,"In Progress");assert(b.evidence.some(x=>x.id==="E-G04-S618-EXIT"&&x.verified));console.log("S618 validated exit replay passed at revision 3610.");
