import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir="docs/research/epic17/S633-v03-gate-reconciliation";
const matrix=await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S633.md`,"utf8");
const packet=await readFile(`${dir}/S633-exit-packet.md`,"utf8");
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3674);
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert(board.evidence.some(x=>x.id==="E-G04-S633-START"&&x.verified));
for(const label of ["Receiver, documented industrial apparel profile","Units and coordinate contract","Source validity and CUT/SEW geometry","Seven recipes, supported options, and grades","Piece identity, revision identity, and relationships","Manufacturing marks and layer/entity semantics","Malformed/invalid input behavior","Repeated exchange and round-trip stability","Rendered output and readability","Legacy DXF and protected output identities","V02 dependency and all-seven scope"])assert(matrix.includes(label),`matrix missing admitted area: ${label}`);
for(const ref of ["S628-named-block-piece-identity-pilot/S628-exit-packet.md","S629-clo-mark-geometry-audit/S629-exit-packet.md","S630-official-profile-mark-semantics/S630-exit-packet.md","S631-s617-astm-mark-audit/S631-exit-packet.md","S632-astm-import-mode-polo/S632-exit-packet.md"])assert(matrix.includes(ref),`matrix missing evidence source: ${ref}`);
assert.match(matrix,/CLO DXF-ASTM import-mode test\s+specifically repeats the known Polo losses/u);
assert.match(matrix,/4\/9 CUT passes/u); assert.match(matrix,/9\/9 SEW passes/u); assert.match(matrix,/0\.01422316 cm/u);
assert.match(matrix,/Reserve S634 for an offline/u); assert.match(matrix,/Do not reopen CLO/u);
assert.match(packet,/No V03 gate clears/u); assert.match(packet,/S634 is reserved/u);
execFileSync("git",["diff","--check"],{stdio:"inherit"});
console.log("S633 evidence preflight passed: all 11 acceptance areas, S628-S632 citations, exact S632 counts, unchanged board statuses, and offline S634 next action.");
