import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir="docs/research/epic17/S632-astm-import-mode-polo";
const expectedHead="b2bb1258ed98ad23f2c7654b7a3bad0453906167";
const input="C:/G04-CLO-DXF-Exchange/S632-astm-import-mode-polo/Input/polo-standard-m-cm-units-header.dxf";
const expectedHash="71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5";
const packet=await readFile(`${dir}/S632-start-packet.md`,"utf8");
const bytes=await readFile(input);
assert.equal(createHash("sha256").update(bytes).digest("hex").toUpperCase(),expectedHash);
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),expectedHead);
execFileSync("git",["merge-base","--is-ancestor","origin/main","HEAD"]);
const subjects=execFileSync("git",["log","--all","--format=%s"],{encoding:"utf8"}).split(/\r?\n/u);
const max=Math.max(...subjects.map(x=>/^Slice (\d+):/u.exec(x)?.[1]).filter(Boolean).map(Number));
assert.equal(max,631);
assert.equal(board.revision,3670);
assert(board.evidence.some(x=>x.id==="E-G04-S632-START"&&x.verified));
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])
  assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert.match(packet,/each of the 38 source marks/u);
assert.match(packet,/Do not guess\s+enum\s+values/u);
console.log("S632 post-replay start preflight passed: S631 base, origin/main ancestry, unique slice 632, pinned C: input, board revision 3670, and acceptance unchanged.");
